import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/useI18n";
import { Trash2, Eye, X, ChevronLeft, ChevronRight, Upload, RefreshCw } from "lucide-react";
import GalleryImageUpload from "./GalleryImageUpload";

interface GalleryImage {
  id: string;
  title: string;
  description: string;
  image_url: string;
  uploaded_by: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const AdminGallery = () => {
  const { toast } = useToast();
  const { t } = useI18n();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      const { data: imagesData, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching gallery images:', error);
        toast({
          title: t("errors.network_error"),
          description: t("errors.failed_to_load"),
          variant: "destructive",
        });
        return;
      }

      // Fetch profile data separately for each image
      const imagesWithProfiles = await Promise.all(
        (imagesData || []).map(async (image) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', image.uploaded_by)
            .single();

          return {
            ...image,
            profiles: profileData
          };
        })
      );

      setImages(imagesWithProfiles);
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

  const handleSelectImage = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map(img => img.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) return;

    try {
      setDeleting(true);
      // First, get the image URLs to delete from storage
      const { data: imagesToDelete } = await supabase
        .from('gallery_images')
        .select('image_url')
        .in('id', Array.from(selectedImages));

      // Delete from database first
      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .in('id', Array.from(selectedImages));

      if (error) {
        console.error('Error deleting images:', error);
        toast({
          title: t("gallery.delete_error"),
          description: t("gallery.delete_error"),
          variant: "destructive",
        });
        return;
      }

      // Delete from storage
      if (imagesToDelete) {
        for (const image of imagesToDelete) {
          if (image.image_url) {
            const filePath = image.image_url.split('/').pop();
            if (filePath) {
              await supabase.storage
                .from('story-images')
                .remove([`gallery/${filePath}`]);
            }
          }
        }
      }

      toast({
        title: t("gallery.delete_success"),
        description: `${t("gallery.delete_success")} ${selectedImages.size} ${t("gallery.total_images")}`,
      });

      setSelectedImages(new Set());
      await fetchGalleryImages();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t("errors.network_error"),
        description: t("errors.unexpected_error"),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSingle = async (imageId: string) => {
    try {
      setDeleting(true);
      
      // Get the image URL to delete from storage
      const { data: imageToDelete } = await supabase
        .from('gallery_images')
        .select('image_url')
        .eq('id', imageId)
        .single();

      // Delete from database first
      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('Error deleting image:', error);
        toast({
          title: t("gallery.delete_error"),
          description: t("gallery.delete_error"),
          variant: "destructive",
        });
        return;
      }

      // Delete from storage
      if (imageToDelete?.image_url) {
        const filePath = imageToDelete.image_url.split('/').pop();
        if (filePath) {
          await supabase.storage
            .from('story-images')
            .remove([`gallery/${filePath}`]);
        }
      }

      toast({
        title: t("gallery.delete_success"),
        description: t("gallery.delete_success"),
      });

      await fetchGalleryImages();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t("errors.network_error"),
        description: t("errors.unexpected_error"),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1;
    } else {
      newIndex = selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0;
    }
    setSelectedImageIndex(newIndex);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t("gallery.management")}
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t("gallery.management")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <GalleryImageUpload onUploadSuccess={fetchGalleryImages} />
            <Button onClick={fetchGalleryImages} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("gallery.refresh")}
            </Button>
            {selectedImages.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={deleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("gallery.delete_selected")} ({selectedImages.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("gallery.delete_confirm")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("gallery.delete_selected_msg").replace('{count}', selectedImages.size.toString())}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                  <AlertDialogCancel>{t("gallery.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {t("gallery.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("gallery.no_images")}</h3>
            <p className="text-muted-foreground mb-4">{t("gallery.no_images_desc")}</p>
            <GalleryImageUpload onUploadSuccess={fetchGalleryImages} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedImages.size === images.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedImages.size > 0 ? `${selectedImages.size} ${t("gallery.selected")}` : `${images.length} ${t("gallery.total_images")}`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((image, index) => (
                <div key={image.id} className="group relative">
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedImages.has(image.id)}
                      onCheckedChange={() => handleSelectImage(image.id)}
                      className="bg-background/80 border-2"
                    />
                  </div>
                  
                  <div className="relative overflow-hidden rounded-lg border bg-background">
                    <div className="aspect-square">
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                        onClick={() => openImageModal(index)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    
                    <div className="p-3">
                      <h4 className="font-medium text-sm truncate mb-1">{image.title}</h4>
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {image.description || t("gallery.no_description")}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {t("gallery.uploaded_by")}: {image.profiles?.full_name || t("common.unknown")}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openImageModal(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                disabled={deleting}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("gallery.delete_confirm")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("gallery.delete_confirm_msg")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("gallery.cancel")}</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteSingle(image.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t("gallery.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(image.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>

      {/* Image Modal */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={closeImageModal}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={closeImageModal}
            >
              <X className="h-6 w-6" />
            </Button>
            
            {images.length > 1 && selectedImageIndex !== null && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigateImage('prev')}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigateImage('next')}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            
            {selectedImageIndex !== null && (
              <div className="relative">
                <img
                  src={images[selectedImageIndex].image_url}
                  alt={images[selectedImageIndex].title}
                  className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                />
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <div className="bg-black/80 text-white p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">{images[selectedImageIndex].title}</h3>
                    <p className="text-sm opacity-90 mb-2">{images[selectedImageIndex].description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("gallery.uploaded_by")}: {images[selectedImageIndex].profiles?.full_name || t("common.unknown")} • {new Date(images[selectedImageIndex].created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedImageIndex + 1} {t("gallery.image_of")} {images.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminGallery;