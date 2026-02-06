import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Eye, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  uploaded_by: string;
  created_at: string;
  status: string;
  moderated_at: string | null;
  rejection_reason: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const AdminImageModeration = () => {
  const { toast } = useToast();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    fetchImages();
  }, [activeTab]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('gallery_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab !== "all") {
        query = query.eq('status', activeTab);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profiles for each image
      const imagesWithProfiles = await Promise.all(
        (data || []).map(async (image) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', image.uploaded_by)
            .single();
          return { ...image, profiles: profileData };
        })
      );

      setImages(imagesWithProfiles);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải hình ảnh",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (imageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('gallery_images')
        .update({
          status: 'approved',
          moderated_by: user?.id,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Hình ảnh đã được duyệt",
      });

      fetchImages();
    } catch (error) {
      console.error('Error approving image:', error);
      toast({
        title: "Lỗi",
        description: "Không thể duyệt hình ảnh",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (imageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('gallery_images')
        .update({
          status: 'rejected',
          moderated_by: user?.id,
          moderated_at: new Date().toISOString(),
          rejection_reason: rejectionReason || "Vi phạm quy định cộng đồng",
        })
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Hình ảnh đã bị từ chối",
      });

      setRejectionReason("");
      setSelectedImage(null);
      fetchImages();
    } catch (error) {
      console.error('Error rejecting image:', error);
      toast({
        title: "Lỗi",
        description: "Không thể từ chối hình ảnh",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" /> Chờ duyệt</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" /> Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" /> Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = images.filter(img => img.status === 'pending').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Kiểm duyệt hình ảnh
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} chờ duyệt</Badge>
            )}
          </CardTitle>
          <Button onClick={fetchImages} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="rejected">Từ chối</TabsTrigger>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Không có hình ảnh nào
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="border rounded-lg overflow-hidden bg-card">
                    <div className="aspect-video relative">
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(image.status)}
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <h4 className="font-medium truncate">{image.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {image.description || "Không có mô tả"}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        <p>Người tải: {image.profiles?.full_name || "Ẩn danh"}</p>
                        <p>Ngày: {new Date(image.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>

                      {image.status === 'rejected' && image.rejection_reason && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          Lý do: {image.rejection_reason}
                        </div>
                      )}

                      {image.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleApprove(image.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Duyệt
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                onClick={() => setSelectedImage(image)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Từ chối
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Từ chối hình ảnh?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Hình ảnh này sẽ không được hiển thị công khai.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="py-4">
                                <Textarea
                                  placeholder="Lý do từ chối (tùy chọn)"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setRejectionReason("")}>
                                  Hủy
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleReject(image.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Xác nhận từ chối
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminImageModeration;
