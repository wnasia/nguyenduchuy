import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/useI18n";
import { Upload, Trash2, RefreshCw, Image as ImageIcon } from "lucide-react";

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminBanners = () => {
  const { toast } = useToast();
  const { t } = useI18n();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newBanner, setNewBanner] = useState({
    imageFile: null as File | null,
    linkUrl: ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('homepage_banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast({
        title: t("errors.network_error"),
        description: t("errors.failed_to_load"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: t("submit.invalid_file_type"),
        description: t("submit.select_image_file"),
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("submit.file_too_large"),
        description: t("submit.image_size_limit"),
        variant: "destructive",
      });
      return;
    }

    setNewBanner(prev => ({ ...prev, imageFile: file }));
  };

  const handleUploadBanner = async () => {
    if (!newBanner.imageFile) {
      toast({
        title: t("errors.validation_error"),
        description: "Please select an image",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = newBanner.imageFile.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, newBanner.imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('homepage_banners')
        .insert({
          image_url: publicUrl,
          link_url: newBanner.linkUrl || null,
          is_active: true,
          created_by: user.id
        });

      if (dbError) throw dbError;

      toast({
        title: t("common.success"),
        description: "Banner uploaded successfully",
      });

      setNewBanner({ imageFile: null, linkUrl: "" });
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchBanners();
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast({
        title: t("errors.network_error"),
        description: t("errors.unexpected_error"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (bannerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('homepage_banners')
        .update({ is_active: !currentStatus })
        .eq('id', bannerId);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: "Banner status updated",
      });

      await fetchBanners();
    } catch (error) {
      console.error('Error updating banner:', error);
      toast({
        title: t("errors.network_error"),
        description: t("errors.unexpected_error"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteBanner = async (bannerId: string, imageUrl: string) => {
    try {
      const { error: dbError } = await supabase
        .from('homepage_banners')
        .delete()
        .eq('id', bannerId);

      if (dbError) throw dbError;

      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('banners')
          .remove([fileName]);
      }

      toast({
        title: t("common.success"),
        description: "Banner deleted successfully",
      });

      await fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast({
        title: t("errors.network_error"),
        description: t("errors.unexpected_error"),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Homepage Banner Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Homepage Banner Management
          </CardTitle>
          <Button onClick={fetchBanners} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload New Banner */}
        <div className="border-2 border-dashed rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">Upload New Banner</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="banner-file">Banner Image</Label>
              <Input
                id="banner-file"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {newBanner.imageFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {newBanner.imageFile.name}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="banner-link">Link URL (optional)</Label>
              <Input
                id="banner-link"
                type="url"
                placeholder="https://example.com"
                value={newBanner.linkUrl}
                onChange={(e) => setNewBanner(prev => ({ ...prev, linkUrl: e.target.value }))}
                disabled={uploading}
              />
            </div>
            <Button onClick={handleUploadBanner} disabled={uploading || !newBanner.imageFile}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Banner"}
            </Button>
          </div>
        </div>

        {/* Existing Banners */}
        <div className="space-y-4">
          <h3 className="font-semibold">Existing Banners ({banners.length})</h3>
          {banners.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No banners uploaded yet</p>
          ) : (
            <div className="grid gap-4">
              {banners.map((banner) => (
                <div key={banner.id} className="border rounded-lg p-4">
                  <div className="flex gap-4">
                    <img
                      src={banner.image_url}
                      alt="Banner"
                      className="w-48 h-24 object-cover rounded"
                    />
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Link URL</Label>
                        <p className="text-sm">{banner.link_url || "No link"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Created</Label>
                        <p className="text-sm">{new Date(banner.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Active</Label>
                        <Switch
                          checked={banner.is_active}
                          onCheckedChange={() => handleToggleActive(banner.id, banner.is_active)}
                        />
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Banner?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The banner will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBanner(banner.id, banner.image_url)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminBanners;
