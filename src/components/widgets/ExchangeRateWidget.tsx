import { useState, useEffect, useCallback } from "react";
import { DollarSign, RefreshCw, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getForexRates } from "@/hooks/useCachedFetch";

interface ExchangeRate {
  code: string;
  name: string;
  rate: number;
  flag: string;
}

// Cache for exchange rates
let ratesCache: { data: ExchangeRate[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000;

const currencyConfig = [
  { code: "USD", name: "Đô la Mỹ", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "JPY", name: "Yên Nhật", flag: "🇯🇵" },
  { code: "KRW", name: "Won Hàn Quốc", flag: "🇰🇷" },
  { code: "CNY", name: "Nhân dân tệ", flag: "🇨🇳" },
  { code: "GBP", name: "Bảng Anh", flag: "🇬🇧" },
  { code: "AUD", name: "Đô la Úc", flag: "🇦🇺" },
];

const ExchangeRateWidget = () => {
  const [rates, setRates] = useState<ExchangeRate[]>(() => {
    if (ratesCache && Date.now() - ratesCache.timestamp < CACHE_DURATION) {
      return ratesCache.data;
    }
    return [];
  });
  const [loading, setLoading] = useState(rates.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    if (ratesCache && Date.now() - ratesCache.timestamp < CACHE_DURATION) {
      return new Date(ratesCache.timestamp);
    }
    return null;
  });

  const fetchRates = useCallback(async () => {
    // Check cache first
    if (ratesCache && Date.now() - ratesCache.timestamp < CACHE_DURATION) {
      setRates(ratesCache.data);
      setLastUpdated(new Date(ratesCache.timestamp));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const usdRates = await getForexRates();
      const vndPerUsd = usdRates.vnd || 25400;
      
      const formattedRates: ExchangeRate[] = currencyConfig.map((currency) => {
        const currencyCode = currency.code.toLowerCase();
        const currencyToUsd = usdRates[currencyCode];
        
        let vndRate = 0;
        if (currencyCode === "usd") {
          vndRate = vndPerUsd;
        } else if (currencyToUsd) {
          vndRate = vndPerUsd / currencyToUsd;
        }
        
        return {
          code: currency.code,
          name: currency.name,
          rate: vndRate,
          flag: currency.flag,
        };
      });
      
      setRates(formattedRates);
      setLastUpdated(new Date());
      ratesCache = { data: formattedRates, timestamp: Date.now() };
    } catch (err) {
      console.error("Error fetching exchange rates:", err);
      setError("Không thể tải tỷ giá");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (rates.length === 0) {
      fetchRates();
    }
    const interval = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRates, rates.length]);

  const formatVND = (value: number): string => {
    if (value === 0) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (error && rates.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Tỷ giá ngoại tệ
        </h3>
        <div className="text-center py-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchRates}>
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
          <DollarSign className="h-5 w-5 text-primary" />
          Tỷ giá ngoại tệ
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchRates}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading && rates.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {rates.map((rate) => (
              <div
                key={rate.code}
                className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{rate.flag}</span>
                  <div>
                    <span className="font-medium text-sm text-foreground">
                      {rate.code}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({rate.name})
                    </span>
                  </div>
                </div>
                <span className="font-semibold text-sm text-foreground">
                  {formatVND(rate.rate)} ₫
                </span>
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

export default ExchangeRateWidget;
