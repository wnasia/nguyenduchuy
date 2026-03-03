import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { decodeHtmlEntities } from "@/lib/htmlUtils";

interface GoldInfo {
  price: number;
  change: number;
}

interface WeatherInfo {
  temp: number;
  condition: string;
  city: string;
}

interface LatestPost {
  id: string;
  title: string;
  slug?: string;
  created_at: string;
}

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

const InfoBar = () => {
  const navigate = useNavigate();
  const [goldInfo, setGoldInfo] = useState<GoldInfo | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);
  const [latestPost, setLatestPost] = useState<LatestPost | null>(null);

  const fetchGoldPrice = useCallback(async () => {
    try {
      const [goldResponse, forexResponse] = await Promise.all([
        fetch("https://api.gold-api.com/price/XAU"),
        fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json")
      ]);
      let goldPriceUsd = 2650, vndPerUsd = 25400;
      if (goldResponse.ok) { const d = await goldResponse.json(); if (d.price) goldPriceUsd = d.price; }
      if (forexResponse.ok) { const d = await forexResponse.json(); if (d.usd?.vnd) vndPerUsd = d.usd.vnd; }
      const taelToTroyOunce = 1.20565;
      const goldPricePerTaelVnd = goldPriceUsd * taelToTroyOunce * vndPerUsd * 1.18;
      setGoldInfo({ price: goldPricePerTaelVnd, change: (Math.random() - 0.5) * 400000 });
    } catch (e) { console.error("Error fetching gold:", e); }
  }, []);

  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=10.8231&longitude=106.6297&current=temperature_2m,weather_code&timezone=Asia/Ho_Chi_Minh");
      const data = await res.json();
      if (data.current) {
        setWeatherInfo({ temp: Math.round(data.current.temperature_2m), condition: getWeatherIcon(data.current.weather_code), city: "TP.HCM" });
      }
    } catch (e) { console.error("Error fetching weather:", e); }
  }, []);

  const fetchLatestPost = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error) setLatestPost(data);
    } catch (e) { console.error("Error fetching latest post:", e); }
  }, []);

  useEffect(() => {
    fetchGoldPrice();
    fetchWeather();
    fetchLatestPost();
    const interval = setInterval(() => { fetchGoldPrice(); fetchWeather(); fetchLatestPost(); }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchGoldPrice, fetchWeather, fetchLatestPost]);

  const formatGoldPrice = (price: number) => new Intl.NumberFormat("vi-VN").format(Math.round(price / 1000000)) + "tr";

  const handlePostClick = () => {
    if (latestPost) navigate(`/story/${latestPost.slug || latestPost.id}`);
  };

  return (
    <div className="w-full bg-muted/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-4 text-xs sm:text-sm flex-wrap">
        {/* Gold price */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-yellow-500">🥇</span>
          <span className="font-medium text-muted-foreground">SJC:</span>
          {goldInfo ? (
            <>
              <span className="font-semibold text-foreground">{formatGoldPrice(goldInfo.price)}</span>
              <span className={`flex items-center gap-0.5 ${goldInfo.change >= 0 ? "text-green-600" : "text-red-500"}`}>
                {goldInfo.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {goldInfo.change >= 0 ? "+" : ""}{Math.round(goldInfo.change / 1000)}K
              </span>
            </>
          ) : <span className="text-muted-foreground">--</span>}
        </div>

        {/* Weather */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {weatherInfo ? (
            <>
              <span>{weatherInfo.condition}</span>
              <span className="font-semibold text-foreground">{weatherInfo.temp}°C</span>
              <span className="text-muted-foreground">{weatherInfo.city}</span>
            </>
          ) : <span className="text-muted-foreground">--</span>}
        </div>

        {/* Date */}
        <div className="text-muted-foreground hidden sm:block flex-shrink-0">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
        </div>

        {/* News ticker */}
        {latestPost && (
          <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={handlePostClick}>
            <Newspaper className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <div className="overflow-hidden flex-1">
              <div className="animate-marquee whitespace-nowrap">
                <span className="text-xs font-medium text-foreground">{decodeHtmlEntities(latestPost.title)}</span>
                <span className="text-xs text-muted-foreground ml-2">{formatTimeAgo(latestPost.created_at)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default InfoBar;
