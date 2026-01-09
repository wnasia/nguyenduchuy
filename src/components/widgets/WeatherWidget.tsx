import { useState, useEffect, useCallback } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, RefreshCw, MapPin } from "lucide-react";
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
  data?: WeatherData;
}

const WeatherWidget = () => {
  const [cities, setCities] = useState<CityWeather[]>([
    { name: "Hà Nội", lat: 21.0285, lon: 105.8542 },
    { name: "TP.HCM", lat: 10.8231, lon: 106.6297 },
    { name: "Đà Nẵng", lat: 16.0544, lon: 108.2022 },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const getWeatherIcon = (code: number) => {
    // WMO Weather interpretation codes
    if (code === 0) return <Sun className="h-6 w-6 text-yellow-500" />;
    if (code >= 1 && code <= 3) return <Cloud className="h-6 w-6 text-gray-400" />;
    if (code >= 45 && code <= 48) return <Cloud className="h-6 w-6 text-gray-500" />;
    if (code >= 51 && code <= 67) return <CloudRain className="h-6 w-6 text-blue-400" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="h-6 w-6 text-blue-200" />;
    if (code >= 80 && code <= 99) return <CloudRain className="h-6 w-6 text-blue-500" />;
    return <Sun className="h-6 w-6 text-yellow-500" />;
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

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Using Open-Meteo API - completely free, no API key needed
      const weatherPromises = cities.map(async (city) => {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia/Ho_Chi_Minh`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch weather for ${city.name}`);
        }

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
      });

      const results = await Promise.all(weatherPromises);
      setCities(results);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching weather:", err);
      setError("Không thể tải thời tiết. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    // Refresh every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          Thời tiết
        </h3>
        <div className="text-center py-4">
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
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          Thời tiết Việt Nam
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

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-12 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {cities.map((city) => (
              <div
                key={city.name}
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  {city.data && getWeatherIcon(city.data.weatherCode)}
                  <div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-sm text-foreground">
                        {city.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {city.data?.description}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-foreground">
                    {city.data?.temperature}°C
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Droplets className="h-3 w-3" />
                      {city.data?.humidity}%
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Wind className="h-3 w-3" />
                      {city.data?.windSpeed}km/h
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
