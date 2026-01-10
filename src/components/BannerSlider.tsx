import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, TrendingUp, TrendingDown, Minus, Cloud } from "lucide-react";
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

  // Fetch gold price (simulated - in production use real API)
  const fetchGoldPrice = useCallback(async () => {
    try {
      // Simulated Vietnam gold price data
      const basePrice = 92000000; // ~92 million VND per tael
      const variation = Math.random() * 500000 - 250000;
      const change = Math.random() * 400000 - 200000;
      setGoldInfo({
        price: basePrice + variation,
        change: change,
      });
    } catch (error) {
      console.error('Error fetching gold price:', error);
    }
  }, []);

  // Fetch weather for Hanoi
  const fetchWeather = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&current=temperature_2m,weather_code&timezone=Asia/Ho_Chi_Minh"
      );
      const data = await response.json();
      if (data.current) {
        setWeatherInfo({
          temp: Math.round(data.current.temperature_2m),
          condition: getWeatherIcon(data.current.weather_code),
          city: "Hà Nội",
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
        <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-gray-50/30 to-transparent" />
      </div>

      {/* Realtime Info Bar - Top */}
      <div className="absolute top-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-4 py-2 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-white text-sm flex-wrap">
          {/* Gold Price */}
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">🥇</span>
            <span className="font-medium">SJC:</span>
            {goldInfo ? (
              <>
                <span className="font-semibold">{formatGoldPrice(goldInfo.price)}</span>
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
              <span className="text-gray-400">--</span>
            )}
          </div>

          {/* Weather */}
          <div className="flex items-center gap-2">
            {weatherInfo ? (
              <>
                <span>{weatherInfo.condition}</span>
                <span className="font-semibold">{weatherInfo.temp}°C</span>
                <span className="text-gray-300">{weatherInfo.city}</span>
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">--</span>
              </>
            )}
          </div>

          {/* Latest Post */}
          {latestPost && (
            <div 
              className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors max-w-[300px]"
              onClick={handlePostClick}
            >
              <Clock className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="truncate font-medium">
                {decodeHtmlEntities(latestPost.title)}
              </span>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {formatTimeAgo(latestPost.created_at)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-12">
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
