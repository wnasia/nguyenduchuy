import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/useI18n";
import { Image as ImageIcon, Upload, Trash2, Eye, X } from "lucide-react";
import GalleryImageUpload from "./GalleryImageUpload";

interface GalleryImage {
  id: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
}

const UserGallery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    fetchUserImages();
  }, [user]);

  const fetchUserImages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching images:', error);
        toast({
          title: t("errors.network_error"),
          description: t("errors.failed_to_load"),
          variant: "destructive",
        });
      } else {
        setImages(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t("errors.network_error"),
        description: t("errors.unexpected_error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const filePath = urlParts.slice(-2).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('story-images')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        throw dbError;
      }

      toast({
        title: t("gallery.delete_success"),
        description: t("gallery.image_deleted"),
      });

      fetchUserImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: t("gallery.delete_error"),
        description: t("errors.unexpected_error"),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (images.length === 0 && !showUpload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("gallery.my_images")}</CardTitle>
          <CardDescription>{t("gallery.no_images_yet")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{t("gallery.upload_first_image")}</p>
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="mr-2 h-4 w-4" />
            {t("gallery.upload_images")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("gallery.my_images")}</CardTitle>
              <CardDescription>
                {t("gallery.manage_images")} ({images.length} {t("gallery.total_images")})
              </CardDescription>
            </div>
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="mr-2 h-4 w-4" />
              {t("gallery.upload_images")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="group relative rounded-lg overflow-hidden border hover:shadow-lg transition-all">
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedImage(image)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteImage(image.id, image.image_url)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-2 bg-white">
                  <p className="text-sm font-medium truncate">{image.title}</p>
                  {image.description && (
                    <p className="text-xs text-muted-foreground truncate">{image.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("gallery.upload_images")}</DialogTitle>
          </DialogHeader>
          <GalleryImageUpload
            onUploadSuccess={() => {
              fetchUserImages();
              setShowUpload(false);
            }}
            onClose={() => setShowUpload(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 z-10"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="space-y-4">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.title}
                  className="w-full rounded-lg"
                />
                <div>
                  <h3 className="text-xl font-semibold mb-2">{selectedImage.title}</h3>
                  {selectedImage.description && (
                    <p className="text-muted-foreground">{selectedImage.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("gallery.uploaded_on")} {new Date(selectedImage.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserGallery;
