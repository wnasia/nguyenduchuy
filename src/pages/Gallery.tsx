import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Upload, ImageIcon } from "lucide-react";
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
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching gallery images:', error);
        toast({ title: t("errors.network_error"), description: t("errors.failed_to_load"), variant: "destructive" });
        setLoading(false);
        return;
      }
      setImages(galleryData || []);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: t("common.error"), description: t("errors.unexpected_error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openImage = (index: number) => setSelectedImageIndex(index);
  const closeImage = () => setSelectedImageIndex(null);

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    if (direction === 'prev') {
      setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1);
    } else {
      setSelectedImageIndex(selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === 'ArrowLeft') navigateImage('prev');
      if (e.key === 'ArrowRight') navigateImage('next');
      if (e.key === 'Escape') closeImage();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex]);

  const handleUploadClick = () => {
    if (!user) {
      toast({ title: t("submit.auth_required"), description: t("gallery.login_to_upload"), variant: "destructive" });
      navigate('/login');
      return;
    }
    setShowUploadDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                {t("gallery.title")}
              </h1>
              <p className="text-base text-muted-foreground max-w-xl">
                {t("gallery.subtitle")}
              </p>
              {images.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {images.length} {t("gallery.image_count")}
                </p>
              )}
            </div>
            <Button onClick={handleUploadClick} size="lg" className="gap-2 shrink-0">
              <Upload className="h-4 w-4" />
              {t("gallery.upload_button")}
            </Button>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{t("gallery.no_images_title")}</h3>
            <p className="text-muted-foreground max-w-sm">{t("gallery.no_images_subtitle")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="group cursor-pointer rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-300"
                onClick={() => openImage(index)}
              >
                <div className="aspect-square w-full bg-muted overflow-hidden">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-1">{image.title}</h3>
                  {image.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{image.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={closeImage}>
        <DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none">
          <div className="relative">
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full" onClick={closeImage}>
              <X className="h-5 w-5" />
            </Button>
            
            {images.length > 1 && selectedImageIndex !== null && (
              <>
                <Button variant="ghost" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full" onClick={() => navigateImage('prev')}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full" onClick={() => navigateImage('next')}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
            
            {selectedImageIndex !== null && (
              <div>
                <img
                  src={images[selectedImageIndex].image_url}
                  alt={images[selectedImageIndex].title}
                  className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5 rounded-b-xl">
                  <h3 className="text-white font-semibold text-lg">{images[selectedImageIndex].title}</h3>
                  {images[selectedImageIndex].description && (
                    <p className="text-white/80 text-sm mt-1">{images[selectedImageIndex].description}</p>
                  )}
                  <p className="text-white/50 text-xs mt-2">{selectedImageIndex + 1} / {images.length}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <GalleryImageUpload 
            onUploadSuccess={() => { setShowUploadDialog(false); fetchGalleryImages(); }}
            onClose={() => setShowUploadDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gallery;
