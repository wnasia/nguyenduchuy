import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/useI18n";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GalleryImageUpload from "@/components/dashboard/GalleryImageUpload";

interface GalleryImage {
  id: string;
  title: string;
  description: string;
  image_url: string;
  uploaded_by: string;
  created_at: string;
}

const Gallery = () => {
  const { toast } = useToast();
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  usePageTitle("meta.gallery_title");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      const { data: galleryData, error } = await supabase
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
        setLoading(false);
        return;
      }

      const galleryImages: GalleryImage[] = galleryData || [];
      setImages(galleryImages);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t("common.error"),
        description: t("errors.unexpected_error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openImage = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImage = () => {
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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedImageIndex === null) return;
    
    if (e.key === 'ArrowLeft') navigateImage('prev');
    if (e.key === 'ArrowRight') navigateImage('next');
    if (e.key === 'Escape') closeImage();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex]);

  const handleUploadClick = () => {
    if (!user) {
      toast({
        title: t("submit.auth_required"),
        description: t("gallery.login_to_upload"),
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    setShowUploadDialog(true);
  };

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
    fetchGalleryImages();
  };

  if (loading) {
    return (
      <div className="min-h-screen py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-semibold mb-2 sm:mb-4">{t("gallery.title")}</h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2">
              {t("gallery.subtitle")}
            </p>
          </div>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-semibold mb-2 sm:mb-4">{t("gallery.title")}</h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2">
            {t("gallery.subtitle")}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            {images.length > 0 && (
              <span>{images.length} {t("gallery.image_count")} • {t("gallery.click_to_view")}</span>
            )}
          </p>
          <div className="mt-4 sm:mt-6">
            <Button onClick={handleUploadClick} size="lg" className="gap-2 text-sm sm:text-base">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              {t("gallery.upload_button")}
            </Button>
          </div>
        </div>

        <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-3 xl:columns-4 gap-3 sm:gap-4 lg:gap-6 space-y-3 sm:space-y-4 lg:space-y-6">
        {images.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="text-gray-500">
              <div className="text-6xl mb-4">📷</div>
              <h3 className="text-xl font-semibold mb-2">{t("gallery.no_images_title")}</h3>
              <p className="text-gray-400">{t("gallery.no_images_subtitle")}</p>
            </div>
          </div>
        ) : (
          images.map((image, index) => (
            <div
              key={image.id}
              className="break-inside-avoid group cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => openImage(index)}
            >
              <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-semibold text-lg mb-1">{image.title}</h3>
                    <p className="text-sm opacity-90">{image.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        </div>

        {images.length > 12 && (
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="px-8" onClick={fetchGalleryImages}>
              {t("gallery.refresh_gallery")}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={selectedImageIndex !== null} onOpenChange={closeImage}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={closeImage}
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
                    <p className="text-sm opacity-90">{images[selectedImageIndex].description}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {selectedImageIndex + 1} {t("gallery.image_of")} {images.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <GalleryImageUpload 
            onUploadSuccess={() => {
              setShowUploadDialog(false);
              fetchGalleryImages();
            }}
            onClose={() => setShowUploadDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gallery;
