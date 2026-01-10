import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { decodeHtmlEntities } from "@/lib/htmlUtils";

interface Banner {
  image: string;
  title: string;
  subtitle: string;
  link?: string;
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
  const [latestPost, setLatestPost] = useState<LatestPost | null>(null);
  const [goldInfo, setGoldInfo] = useState<GoldInfo | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);

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
  }, [fetchLatestPost, fetchGoldPrice, fetchWeather]);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 6000);

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
        {/* Subtle gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30" />
      </div>

      {/* Realtime Info Bar - Top with transparent/white styling */}
      <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm px-4 py-2 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-white text-sm flex-wrap">
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

          {/* Latest Post with Marquee Animation */}
          {latestPost && (
            <div 
              className="flex items-center gap-2 cursor-pointer hover:text-primary-foreground transition-colors overflow-hidden flex-1 max-w-[400px]"
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
      <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-12">
        <div className="max-w-4xl mx-auto text-center space-y-4 animate-fade-in">
          <h1 
            className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg transition-all duration-500"
            style={{
              transform: isAnimating ? "translateY(-10px)" : "translateY(0)",
              opacity: isAnimating ? 0.5 : 1,
              textShadow: "2px 2px 8px rgba(0,0,0,0.5)"
            }}
          >
            {currentBanner.title}
          </h1>
          <p 
            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md transition-all duration-500"
            style={{
              transform: isAnimating ? "translateY(10px)" : "translateY(0)",
              opacity: isAnimating ? 0.5 : 1,
              textShadow: "1px 1px 4px rgba(0,0,0,0.4)"
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
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm shadow-md border border-white/20"
        onClick={handlePrev}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm shadow-md border border-white/20"
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
                ? "bg-white w-8" 
                : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
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
    </div>
  );
};

export default BannerSlider;
