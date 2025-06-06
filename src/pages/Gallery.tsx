
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GalleryImage {
  src: string;
  title: string;
  description: string;
  storyId?: string;
}

const Gallery = () => {
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('id, title, content, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching gallery images:', error);
        toast({
          title: "Error",
          description: "Failed to load gallery images",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const galleryImages: GalleryImage[] = [];
      
      // Extract images from posts
      postsData?.forEach(post => {
        try {
          const parsed = JSON.parse(post.content);
          if (parsed.imageLinks && Array.isArray(parsed.imageLinks)) {
            parsed.imageLinks.forEach((imageUrl: string, index: number) => {
              galleryImages.push({
                src: imageUrl,
                title: `${post.title} ${parsed.imageLinks.length > 1 ? `(${index + 1})` : ''}`,
                description: parsed.story?.substring(0, 100) + '...' || 'A beautiful moment captured in time',
                storyId: post.id
              });
            });
          }
        } catch {
          // Skip invalid JSON
        }
      });

      // Add some placeholder images if gallery is empty
      if (galleryImages.length === 0) {
        const placeholderImages = [
          {
            src: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=600&fit=crop",
            title: "Family Reunion 2023",
            description: "Three generations coming together for the holidays"
          },
          {
            src: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=800&fit=crop",
            title: "Grandmother's Kitchen",
            description: "Where all the magic happened"
          },
          {
            src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=800&fit=crop",
            title: "Study Sessions",
            description: "Late nights and determination"
          },
          {
            src: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=800&h=600&fit=crop",
            title: "Home Sweet Home",
            description: "Our little sanctuary"
          }
        ];
        galleryImages.push(...placeholderImages);
      }

      setImages(galleryImages);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
            <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4">Memory Gallery</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A collection of precious moments, captured in time. Each image tells a story, 
              preserves a memory, and connects us to what matters most.
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
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4">Memory Gallery</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A collection of precious moments, captured in time. Each image tells a story, 
            preserves a memory, and connects us to what matters most.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {images.length} images • Click any image to view full size
          </p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {images.map((image, index) => (
            <div
              key={index}
              className="break-inside-avoid group cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => openImage(index)}
            >
              <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                <img
                  src={image.src}
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
              Refresh Gallery
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
                  src={images[selectedImageIndex].src}
                  alt={images[selectedImageIndex].title}
                  className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                />
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <div className="bg-black/80 text-white p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">{images[selectedImageIndex].title}</h3>
                    <p className="text-sm opacity-90">{images[selectedImageIndex].description}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {selectedImageIndex + 1} of {images.length}
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
