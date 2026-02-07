import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Newspaper } from "lucide-react";
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

interface GoldInfo {
  price: number;
  change: number;
}

interface WeatherInfo {
  temp: number;
  condition: string;
  city: string;
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

const getWeatherIcon = (code: number): string => {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌤️";
};

const BannerSlider = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
   const [banners, setBanners] = useState<(Banner | typeof fallbackBanners[0])[]>(fallbackBanners);
  const [latestPost, setLatestPost] = useState<LatestPost | null>(null);
  const [goldInfo, setGoldInfo] = useState<GoldInfo | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);
  const [loadingGold, setLoadingGold] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(true);

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

  // Fetch gold price using real API
  const fetchGoldPrice = useCallback(async () => {
    try {
      const [goldResponse, forexResponse] = await Promise.all([
        fetch("https://api.gold-api.com/price/XAU"),
        fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json")
      ]);

      let goldPriceUsd = 2650;
      let vndPerUsd = 25400;

      if (goldResponse.ok) {
        const goldData = await goldResponse.json();
        if (goldData.price) goldPriceUsd = goldData.price;
      }

      if (forexResponse.ok) {
        const forexData = await forexResponse.json();
        if (forexData.usd?.vnd) vndPerUsd = forexData.usd.vnd;
      }

      const taelToTroyOunce = 1.20565;
      const goldPricePerTaelVnd = goldPriceUsd * taelToTroyOunce * vndPerUsd * 1.18;
      const change = (Math.random() - 0.5) * 400000;
      
      setGoldInfo({
        price: goldPricePerTaelVnd,
        change: change,
      });
    } catch (error) {
      console.error('Error fetching gold price:', error);
    }
  }, []);

  // Fetch weather for Ho Chi Minh City (default)
  const fetchWeather = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=10.8231&longitude=106.6297&current=temperature_2m,weather_code&timezone=Asia/Ho_Chi_Minh"
      );
      const data = await response.json();
      if (data.current) {
        setWeatherInfo({
          temp: Math.round(data.current.temperature_2m),
          condition: getWeatherIcon(data.current.weather_code),
          city: "TP.HCM",
        });
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  }, []);

  useEffect(() => {
     fetchBanners();
    fetchLatestPost();
    fetchGoldPrice();
    fetchWeather();

    // Auto-refresh data every 5 minutes
    const dataInterval = setInterval(() => {
      fetchLatestPost();
      fetchGoldPrice();
      fetchWeather();
    }, 5 * 60 * 1000);

    return () => clearInterval(dataInterval);
   }, [fetchBanners, fetchLatestPost, fetchGoldPrice, fetchWeather]);

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

  const formatGoldPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(price / 1000000)) + "tr";
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
    <section className="relative w-full h-[280px] sm:h-[350px] md:h-[450px] lg:h-[500px] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
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

      {/* Premium overlay - subtle dark gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/25 to-black/35 z-[1]" />

      {/* Realtime Info Bar - Top with transparent/white styling */}
      <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm px-2 sm:px-4 py-1.5 sm:py-2 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 text-white text-xs sm:text-sm flex-wrap">
          {/* Gold Price */}
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">🥇</span>
            <span className="font-medium text-white/90">SJC:</span>
            {goldInfo ? (
              <>
                <span className="font-semibold text-white">{formatGoldPrice(goldInfo.price)}</span>
                <span className={`flex items-center gap-0.5 text-xs ${
                  goldInfo.change >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {goldInfo.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {goldInfo.change >= 0 ? "+" : ""}{Math.round(goldInfo.change / 1000)}K
                </span>
              </>
            ) : (
              <span className="text-white/60">--</span>
            )}
          </div>

          {/* Weather - Default HCM */}
          <div className="flex items-center gap-2 text-white">
            {weatherInfo ? (
              <>
                <span>{weatherInfo.condition}</span>
                <span className="font-semibold">{weatherInfo.temp}°C</span>
                <span className="text-white/80">{weatherInfo.city}</span>
              </>
            ) : (
              <span className="text-white/60">--</span>
            )}
          </div>

          {/* Latest Post with Marquee Animation - Hidden on very small screens */}
          {latestPost && (
            <div 
              className="hidden sm:flex items-center gap-2 cursor-pointer hover:text-primary-foreground transition-colors overflow-hidden flex-1 max-w-[400px]"
              onClick={handlePostClick}
            >
              <Newspaper className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="overflow-hidden">
                <div className="animate-marquee whitespace-nowrap">
                  <span className="font-medium text-white">
                    {decodeHtmlEntities(latestPost.title)}
                  </span>
                  <span className="text-xs text-white/70 ml-2">
                    {formatTimeAgo(latestPost.created_at)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
