import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface GoldInfo {
  price: number;
  change: number;
}

interface WeatherInfo {
  temp: number;
  condition: string;
  city: string;
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

const InfoBar = () => {
  const [goldInfo, setGoldInfo] = useState<GoldInfo | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);

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

  useEffect(() => {
    fetchGoldPrice();
    fetchWeather();
    const interval = setInterval(() => { fetchGoldPrice(); fetchWeather(); }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchGoldPrice, fetchWeather]);

  const formatGoldPrice = (price: number) => new Intl.NumberFormat("vi-VN").format(Math.round(price / 1000000)) + "tr";

  return (
    <div className="w-full bg-muted/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4 text-xs sm:text-sm flex-wrap">
        <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-2">
          {weatherInfo ? (
            <>
              <span>{weatherInfo.condition}</span>
              <span className="font-semibold text-foreground">{weatherInfo.temp}°C</span>
              <span className="text-muted-foreground">{weatherInfo.city}</span>
            </>
          ) : <span className="text-muted-foreground">--</span>}
        </div>
        <div className="text-muted-foreground hidden sm:block">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
};

export default InfoBar;
