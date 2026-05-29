import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
}

const fallbackBanners = [
  {
    id: "fallback-1",
    image_url: "/banners/sample-banner-1.jpg",
    title: "Chia sẻ câu chuyện của bạn",
    subtitle: "Nơi ấm áp để chia sẻ những khoảnh khắc quý giá và câu chuyện cuộc sống.",
  },
  {
    id: "fallback-2",
    image_url: "/banners/sample-banner-2.jpg",
    title: "Kết nối qua trải nghiệm",
    subtitle: "Tham gia cộng đồng — thể hiện, truyền cảm hứng và kết nối với những câu chuyện chân thực.",
  },
];

const BannerSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [banners, setBanners] = useState<(Banner | typeof fallbackBanners[0])[]>(fallbackBanners);

  const fetchBanners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_banners')
        .select('id, image_url, link_url, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setBanners(data);
      } else {
        setBanners(fallbackBanners);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners(fallbackBanners);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentIndex, banners.length]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const currentBanner = banners[currentIndex];
  const isFallback = 'title' in currentBanner;
  const bannerImage = currentBanner.image_url;
  const bannerLink = 'link_url' in currentBanner ? currentBanner.link_url : null;
  const bannerTitle = isFallback ? (currentBanner as typeof fallbackBanners[0]).title : null;
  const bannerSubtitle = isFallback ? (currentBanner as typeof fallbackBanners[0]).subtitle : null;

  return (
    <section className="relative w-full h-[260px] sm:h-[360px] md:h-[460px] lg:h-[500px] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{ opacity: isAnimating ? 0.7 : 1 }}
      >
        {bannerLink ? (
          <a href={bannerLink} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
            <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
          </a>
        ) : (
          <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Fallback text overlay only */}
      {isFallback && (
        <div className="relative h-full flex items-center justify-center px-3 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-2 sm:space-y-4">
            <h1
              className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white transition-all duration-500 px-2"
              style={{
                transform: isAnimating ? "translateY(-10px)" : "translateY(0)",
                opacity: isAnimating ? 0.5 : 1,
                textShadow: "2px 2px 8px rgba(0,0,0,0.5)"
              }}
            >
              {bannerTitle}
            </h1>
            <p
              className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto transition-all duration-500 px-4"
              style={{
                transform: isAnimating ? "translateY(10px)" : "translateY(0)",
                opacity: isAnimating ? 0.5 : 1,
                textShadow: "1px 1px 4px rgba(0,0,0,0.4)"
              }}
            >
              {bannerSubtitle}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm shadow-md border border-white/20 h-8 w-8 sm:h-10 sm:w-10"
        onClick={handlePrev}
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm shadow-md border border-white/20 h-8 w-8 sm:h-10 sm:w-10"
        onClick={handleNext}
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
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
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default BannerSlider;
