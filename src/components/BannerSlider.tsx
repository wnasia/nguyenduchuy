import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { decodeHtmlEntities } from "@/lib/htmlUtils";

interface Banner {
   id: string;
   image_url: string;
   link_url: string | null;
   is_active: boolean;
}

interface LatestPost {
  id: string;
  title: string;
  slug?: string;
  created_at: string;
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
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
   const [banners, setBanners] = useState<(Banner | typeof fallbackBanners[0])[]>(fallbackBanners);
  const [latestPost, setLatestPost] = useState<LatestPost | null>(null);

   // Fetch banners from database
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
 
  // Fetch latest post
  const fetchLatestPost = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setLatestPost(data);
    } catch (error) {
      console.error('Error fetching latest post:', error);
    }
  }, []);

  useEffect(() => {
     fetchBanners();
    fetchLatestPost();

    const dataInterval = setInterval(() => {
      fetchLatestPost();
    }, 5 * 60 * 1000);

    return () => clearInterval(dataInterval);
   }, [fetchBanners, fetchLatestPost]);

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

  const handlePostClick = () => {
    if (latestPost) {
      navigate(`/story/${latestPost.slug || latestPost.id}`);
    }
  };


  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

   const currentBanner = banners[currentIndex];
   const isFallback = 'title' in currentBanner;
   const bannerImage = currentBanner.image_url;
   const bannerLink = 'link_url' in currentBanner ? currentBanner.link_url : null;
   const bannerTitle = isFallback ? (currentBanner as typeof fallbackBanners[0]).title : null;
   const bannerSubtitle = isFallback ? (currentBanner as typeof fallbackBanners[0]).subtitle : null;

  return (
    <section className="relative w-full h-[500px] overflow-hidden">
      {/* Background Image with Animation - Full Viewport Width */}
      <div 
        className="absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{ 
          opacity: isAnimating ? 0.7 : 1,
        }}
      >
         {bannerLink ? (
           <a href={bannerLink} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
             <img 
               src={bannerImage} 
               alt="Banner"
               className="w-full h-full object-cover"
             />
           </a>
         ) : (
           <img 
             src={bannerImage} 
             alt="Banner"
             className="w-full h-full object-cover"
           />
         )}
      </div>

      {/* No overlay - banner image displays clearly as-is */}

      {/* News ticker at bottom */}
      {latestPost && (
        <div className="absolute bottom-12 left-0 right-0 bg-black/50 backdrop-blur-sm px-4 py-2 z-10">
          <div className="max-w-7xl mx-auto flex items-center gap-2 cursor-pointer" onClick={handlePostClick}>
            <Newspaper className="h-4 w-4 text-white flex-shrink-0" />
            <div className="overflow-hidden flex-1">
              <div className="animate-marquee whitespace-nowrap">
                <span className="text-sm font-medium text-white">{decodeHtmlEntities(latestPost.title)}</span>
                <span className="text-xs text-white/70 ml-2">{formatTimeAgo(latestPost.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Overlay - White/transparent text */}
       {isFallback && (
         <div className="relative h-full flex items-center justify-center px-3 sm:px-6 lg:px-8 pt-10 sm:pt-12">
        <div className="max-w-4xl mx-auto text-center space-y-2 sm:space-y-4 animate-fade-in">
          <h1 
            className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg transition-all duration-500 px-2"
            style={{
              transform: isAnimating ? "translateY(-10px)" : "translateY(0)",
              opacity: isAnimating ? 0.5 : 1,
              textShadow: "2px 2px 8px rgba(0,0,0,0.5)"
            }}
          >
             {bannerTitle}
          </h1>
          <p 
            className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md transition-all duration-500 px-4"
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

      {/* Dots Indicator */}
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

       <style>{`
         @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default BannerSlider;
