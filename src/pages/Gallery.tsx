
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images = [
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
    },
    {
      src: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=900&fit=crop",
      title: "Wedding Day",
      description: "The beginning of forever"
    },
    {
      src: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=900&h=600&fit=crop",
      title: "First Steps",
      description: "A milestone moment"
    },
    {
      src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=700&fit=crop",
      title: "Graduation Day",
      description: "Dreams becoming reality"
    },
    {
      src: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=700&h=800&fit=crop",
      title: "Sunday Mornings",
      description: "Coffee and conversations"
    },
    {
      src: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=800&fit=crop",
      title: "Summer Vacation",
      description: "Making memories by the lake"
    },
    {
      src: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=700&fit=crop",
      title: "New Beginnings",
      description: "Starting fresh in a new city"
    },
    {
      src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&h=800&fit=crop",
      title: "Birthday Celebration",
      description: "Another year of wisdom"
    },
    {
      src: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=800&h=900&fit=crop",
      title: "Holiday Traditions",
      description: "Keeping the spirit alive"
    }
  ];

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

        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {images.map((image, index) => (
            <div
              key={index}
              className="break-inside-avoid group cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => setSelectedImage(image.src)}
            >
              <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                <img
                  src={image.src}
                  alt={image.title}
                  className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
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

        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="px-8">
            Load More Images
          </Button>
        </div>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Gallery preview"
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gallery;
