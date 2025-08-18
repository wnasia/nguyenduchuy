
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/useI18n";
import { usePageTitle } from "@/hooks/usePageTitle";

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
  usePageTitle("meta.gallery_title");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Use the gallery images from the dedicated table
      const galleryImages: GalleryImage[] = galleryData || [];

      // Add some placeholder images if gallery is empty
      if (galleryImages.length === 0) {
        const placeholderImages = [
          {
            id: "placeholder-1",
            title: "Family Reunion 2023",
            description: "Three generations coming together for the holidays",
            image_url: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=600&fit=crop",
            uploaded_by: "system",
            created_at: new Date().toISOString()
          },
          {
            id: "placeholder-2", 
            title: "Grandmother's Kitchen",
            description: "Where all the magic happened",
            image_url: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=800&fit=crop",
            uploaded_by: "system",
            created_at: new Date().toISOString()
          },
          {
            id: "placeholder-3",
            title: "Study Sessions", 
            description: "Late nights and determination",
            image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=800&fit=crop",
            uploaded_by: "system",
            created_at: new Date().toISOString()
          },
          {
            id: "placeholder-4",
            title: "Home Sweet Home",
            description: "Our little sanctuary", 
            image_url: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=800&h=600&fit=crop",
            uploaded_by: "system",
            created_at: new Date().toISOString()
          }
        ];
        galleryImages.push(...placeholderImages);
      }

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

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4">{t("gallery.title")}</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4">{t("gallery.title")}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("gallery.subtitle")}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {images.length} {t("gallery.image_count")} • {t("gallery.click_to_view")}
          </p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {images.map((image, index) => (
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
          ))}
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
            
            {/* Navigation buttons */}
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
    </div>
  );
};

export default Gallery;
