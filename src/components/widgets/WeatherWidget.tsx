import { useState, useEffect, useCallback } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Droplets, RefreshCw, MapPin, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface WeatherData {
  city: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  weatherCode: number;
}

interface CityWeather {
  name: string;
  lat: number;
  lon: number;
  timezone: string;
  data?: WeatherData;
}

// Cache for weather data
let weatherCache: { data: CityWeather[]; timestamp: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Only fetch 3 cities initially for speed
const primaryCities: CityWeather[] = [
  { name: "TP.HCM", lat: 10.8231, lon: 106.6297, timezone: "Asia/Ho_Chi_Minh" },
  { name: "Hà Nội", lat: 21.0285, lon: 105.8542, timezone: "Asia/Ho_Chi_Minh" },
  { name: "Quy Nhơn", lat: 13.7765, lon: 109.2236, timezone: "Asia/Ho_Chi_Minh" },
];

const secondaryCities: CityWeather[] = [
  { name: "New York", lat: 40.7128, lon: -74.0060, timezone: "America/New_York" },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, timezone: "Australia/Sydney" },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, timezone: "Asia/Tokyo" },
  { name: "London", lat: 51.5074, lon: -0.1278, timezone: "Europe/London" },
];

const WeatherWidget = () => {
  const [cities, setCities] = useState<CityWeather[]>(() => {
    if (weatherCache && Date.now() - weatherCache.timestamp < CACHE_DURATION) {
      return weatherCache.data;
    }
    return primaryCities;
  });
  const [loading, setLoading] = useState(() => {
    return !(weatherCache && Date.now() - weatherCache.timestamp < CACHE_DURATION);
  });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    if (weatherCache && Date.now() - weatherCache.timestamp < CACHE_DURATION) {
      return new Date(weatherCache.timestamp);
    }
    return null;
  });
  const [showMore, setShowMore] = useState(false);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="h-5 w-5 text-yellow-500" />;
    if (code >= 1 && code <= 3) return <Cloud className="h-5 w-5 text-gray-400" />;
    if (code >= 45 && code <= 48) return <Cloud className="h-5 w-5 text-gray-500" />;
    if (code >= 51 && code <= 67) return <CloudRain className="h-5 w-5 text-blue-400" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="h-5 w-5 text-blue-200" />;
    if (code >= 80 && code <= 99) return <CloudRain className="h-5 w-5 text-blue-500" />;
    return <Sun className="h-5 w-5 text-yellow-500" />;
  };

  const getWeatherDescription = (code: number): string => {
    if (code === 0) return "Trời quang";
    if (code >= 1 && code <= 3) return "Có mây";
    if (code >= 45 && code <= 48) return "Sương mù";
    if (code >= 51 && code <= 55) return "Mưa phùn";
    if (code >= 56 && code <= 57) return "Mưa đóng băng";
    if (code >= 61 && code <= 65) return "Mưa";
    if (code >= 66 && code <= 67) return "Mưa đá";
    if (code >= 71 && code <= 77) return "Tuyết";
    if (code >= 80 && code <= 82) return "Mưa rào";
    if (code >= 95 && code <= 99) return "Giông bão";
    return "Không xác định";
  };

  const fetchWeatherForCities = async (cityList: CityWeather[]): Promise<CityWeather[]> => {
    const weatherPromises = cityList.map(async (city) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=${city.timezone}`
        );

        if (!response.ok) return city;

        const data = await response.json();
        const current = data.current;

        return {
          ...city,
          data: {
            city: city.name,
            temperature: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            description: getWeatherDescription(current.weather_code),
            weatherCode: current.weather_code,
          },
        };
      } catch {
        return city;
      }
    });

    return Promise.all(weatherPromises);
  };

  const fetchWeather = useCallback(async () => {
    // Check cache first
    if (weatherCache && Date.now() - weatherCache.timestamp < CACHE_DURATION) {
      setCities(weatherCache.data);
      setLastUpdated(new Date(weatherCache.timestamp));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Only fetch primary cities first for faster initial load
      const primaryResults = await fetchWeatherForCities(primaryCities);
      setCities(primaryResults);
      setLastUpdated(new Date());
      setLoading(false);

      // Cache primary results
      weatherCache = { data: primaryResults, timestamp: Date.now() };

      // Fetch secondary cities in background
      const secondaryResults = await fetchWeatherForCities(secondaryCities);
      const allResults = [...primaryResults, ...secondaryResults];
      setCities(allResults);
      weatherCache = { data: allResults, timestamp: Date.now() };
    } catch (err) {
      console.error("Error fetching weather:", err);
      setError("Không thể tải thời tiết");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const displayedCities = showMore ? cities : cities.slice(0, 3);

  if (error && cities.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          Thời tiết
        </h3>
        <div className="text-center py-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchWeather}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          Thời tiết
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchWeather}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading && cities.every(c => !c.data) ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-6 w-14" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {displayedCities.map((city) => (
              <div
                key={city.name}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  {city.data && getWeatherIcon(city.data.weatherCode)}
                  <div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-sm text-foreground">
                        {city.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {city.data?.description || "Đang tải..."}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">
                    {city.data?.temperature ?? "--"}°C
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Droplets className="h-3 w-3" />
                      {city.data?.humidity ?? "--"}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {cities.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMore(!showMore)}
              className="w-full mt-2 text-xs"
            >
              {showMore ? "Thu gọn" : `Xem thêm ${cities.length - 3} thành phố`}
            </Button>
          )}
          
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Cập nhật: {lastUpdated.toLocaleTimeString("vi-VN")}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default WeatherWidget;
