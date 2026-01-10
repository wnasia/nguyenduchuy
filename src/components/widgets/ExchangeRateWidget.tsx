import { useState, useEffect, useCallback } from "react";
import { DollarSign, RefreshCw, AlertCircle } from "lucide-react";
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
    { code: "AUD", name: "Đô la Úc", flag: "🇦🇺" },
  ];

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using FreeExchangeRateApi from GitHub - supports VND
      // Fallback: use exchangerate-api.com or similar free API
      const response = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      
      const data = await response.json();
      const usdRates = data.usd;
      
      // Get VND rate per 1 USD
      const vndPerUsd = usdRates.vnd || 25400;
      
      // Calculate VND per 1 unit of each foreign currency
      const formattedRates: ExchangeRate[] = currencyConfig.map((currency) => {
        const currencyCode = currency.code.toLowerCase();
        const currencyToUsd = usdRates[currencyCode];
        
        // Calculate how much VND equals 1 unit of foreign currency
        // If USD is 1 and EUR is 0.92, then 1 EUR = 1/0.92 USD = vndPerUsd/0.92 VND
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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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
