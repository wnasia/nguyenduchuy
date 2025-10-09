import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Banner {
  image: string;
  title: string;
  subtitle: string;
  link?: string;
}

const defaultBanners: Banner[] = [
  {
    image: "/banners/sample-banner-1.jpg",
    title: "Share Your Stories",
    subtitle: "A warm place to share precious moments, unique stories, and life experiences.",
  },
  {
    image: "/banners/sample-banner-2.jpg",
    title: "Connect Through Experiences",
    subtitle: "Join the community — express, inspire, and connect with authentic stories.",
  },
];

const BannerSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 6000); // Auto-slide every 6 seconds

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % defaultBanners.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + defaultBanners.length) % defaultBanners.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const currentBanner = defaultBanners[currentIndex];

  return (
    <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Background Image with Animation */}
      <div 
        className="absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{ 
          opacity: isAnimating ? 0.7 : 1,
        }}
      >
        <img 
          src={currentBanner.image} 
          alt={currentBanner.title}
          className="w-full h-full object-cover animate-pulse-slow"
          style={{
            animation: "pulse-slow 8s ease-in-out infinite"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-gray-50/30 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4 animate-fade-in">
          <h1 
            className="text-3xl md:text-5xl font-bold text-gray-800 drop-shadow-sm transition-all duration-500"
            style={{
              transform: isAnimating ? "translateY(-10px)" : "translateY(0)",
              opacity: isAnimating ? 0.5 : 1,
            }}
          >
            {currentBanner.title}
          </h1>
          <p 
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto drop-shadow-sm transition-all duration-500"
            style={{
              transform: isAnimating ? "translateY(10px)" : "translateY(0)",
              opacity: isAnimating ? 0.5 : 1,
            }}
          >
            {currentBanner.subtitle}
          </p>
        </div>
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 backdrop-blur-sm shadow-md"
        onClick={handlePrev}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 backdrop-blur-sm shadow-md"
        onClick={handleNext}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {defaultBanners.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isAnimating) {
                setIsAnimating(true);
                setCurrentIndex(index);
                setTimeout(() => setIsAnimating(false), 500);
              }
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? "bg-gray-700 w-8" 
                : "bg-gray-400 hover:bg-gray-600"
            }`}
          />
        ))}
      </div>

      {/* CSS for custom animation */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default BannerSlider;
