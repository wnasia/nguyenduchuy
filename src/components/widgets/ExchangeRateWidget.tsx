import { useState, useEffect, useCallback } from "react";
import { DollarSign, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface ExchangeRate {
  code: string;
  name: string;
  rate: number;
  flag: string;
}

const ExchangeRateWidget = () => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const currencyConfig = [
    { code: "USD", name: "Đô la Mỹ", flag: "🇺🇸" },
    { code: "EUR", name: "Euro", flag: "🇪🇺" },
    { code: "JPY", name: "Yên Nhật", flag: "🇯🇵" },
    { code: "KRW", name: "Won Hàn Quốc", flag: "🇰🇷" },
    { code: "CNY", name: "Nhân dân tệ", flag: "🇨🇳" },
    { code: "GBP", name: "Bảng Anh", flag: "🇬🇧" },
  ];

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using Frankfurter API - completely free, no API key needed
      const response = await fetch(
        "https://api.frankfurter.app/latest?from=VND&to=USD,EUR,JPY,KRW,CNY,GBP"
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      
      const data = await response.json();
      
      // Convert rates (API returns VND to other currencies, we need to invert for display)
      const formattedRates: ExchangeRate[] = currencyConfig.map((currency) => {
        const apiRate = data.rates[currency.code];
        // Invert the rate: 1 foreign currency = X VND
        const vndRate = apiRate ? 1 / apiRate : 0;
        return {
          code: currency.code,
          name: currency.name,
          rate: vndRate,
          flag: currency.flag,
        };
      });
      
      setRates(formattedRates);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching exchange rates:", err);
      setError("Không thể tải tỷ giá. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    // Refresh every 30 minutes
    const interval = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const formatVND = (value: number): string => {
    if (value === 0) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Tỷ giá ngoại tệ
        </h3>
        <div className="text-center py-4">
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
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
