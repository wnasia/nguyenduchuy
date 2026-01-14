import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CalendarIcon, 
  Globe2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { format, subDays, isAfter, startOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";

interface RegionGoldPrice {
  region: string;
  regionCode: string;
  flag: string;
  currency: string;
  pricePerOunce: number;
  pricePerGram: number;
  priceInVnd: number;
  change: number;
  changePercent: number;
}

interface GoldPriceData {
  date: Date;
  regions: RegionGoldPrice[];
}

// Base gold price in USD (per troy ounce)
const BASE_GOLD_PRICE_USD = 2650;

// Generate gold prices based on date and region
const generateGoldPriceForDate = async (targetDate: Date): Promise<GoldPriceData> => {
  const today = startOfDay(new Date());
  const target = startOfDay(targetDate);
  const daysDiff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  
  // Seed based on date for consistent results
  const dateSeed = target.getFullYear() * 10000 + (target.getMonth() + 1) * 100 + target.getDate();
  
  // Fetch current exchange rate
  let vndPerUsd = 25400;
  try {
    const response = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json");
    if (response.ok) {
      const data = await response.json();
      if (data.usd?.vnd) {
        vndPerUsd = data.usd.vnd;
      }
    }
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
  }

  // Create pseudo-random variation based on date
  const getVariation = (seed: number, range: number) => {
    const x = Math.sin(seed) * 10000;
    return (x - Math.floor(x)) * range - range / 2;
  };

  // Historical trend simulation (prices generally fluctuate ±3% over short periods)
  const trendFactor = 1 + (getVariation(dateSeed, 0.06));
  const basePrice = BASE_GOLD_PRICE_USD * trendFactor;

  // Regional premiums and adjustments
  const regions: RegionGoldPrice[] = [
    {
      region: "Việt Nam",
      regionCode: "VN",
      flag: "🇻🇳",
      currency: "VND",
      pricePerOunce: Math.round(basePrice * 1.18 * vndPerUsd), // SJC premium ~18%
      pricePerGram: Math.round((basePrice * 1.18 * vndPerUsd) / 31.1035),
      priceInVnd: Math.round(basePrice * 1.18 * vndPerUsd / 31.1035),
      change: getVariation(dateSeed + 1, 500000),
      changePercent: getVariation(dateSeed + 1, 2),
    },
    {
      region: "Hoa Kỳ",
      regionCode: "US",
      flag: "🇺🇸",
      currency: "USD",
      pricePerOunce: Math.round(basePrice * 100) / 100,
      pricePerGram: Math.round((basePrice / 31.1035) * 100) / 100,
      priceInVnd: Math.round(basePrice * vndPerUsd / 31.1035),
      change: getVariation(dateSeed + 2, 30),
      changePercent: getVariation(dateSeed + 2, 1.5),
    },
    {
      region: "Châu Âu",
      regionCode: "EU",
      flag: "🇪🇺",
      currency: "EUR",
      pricePerOunce: Math.round(basePrice * 0.92 * 100) / 100, // EUR/USD rate
      pricePerGram: Math.round((basePrice * 0.92 / 31.1035) * 100) / 100,
      priceInVnd: Math.round(basePrice * 0.92 * (vndPerUsd / 0.92) / 31.1035),
      change: getVariation(dateSeed + 3, 25),
      changePercent: getVariation(dateSeed + 3, 1.2),
    },
    {
      region: "Trung Quốc",
      regionCode: "CN",
      flag: "🇨🇳",
      currency: "CNY",
      pricePerOunce: Math.round(basePrice * 7.25 * 1.02 * 100) / 100, // CNY/USD + premium
      pricePerGram: Math.round((basePrice * 7.25 * 1.02 / 31.1035) * 100) / 100,
      priceInVnd: Math.round(basePrice * 1.02 * vndPerUsd / 31.1035),
      change: getVariation(dateSeed + 4, 150),
      changePercent: getVariation(dateSeed + 4, 1.8),
    },
  ];

  return {
    date: targetDate,
    regions,
  };
};

const formatPrice = (price: number, currency: string): string => {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN").format(Math.round(price / 1000)) + "K";
  }
  return new Intl.NumberFormat("en-US", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(price);
};

const formatVndPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN").format(Math.round(price / 1000)) + "K";
};

type DatePreset = 'today' | 'yesterday' | 'custom';

const GoldPriceHistoryWidget = () => {
  const { t } = useI18n();
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [data, setData] = useState<GoldPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getSelectedDate = useCallback((): Date => {
    switch (datePreset) {
      case 'today':
        return new Date();
      case 'yesterday':
        return subDays(new Date(), 1);
      case 'custom':
        return customDate || new Date();
      default:
        return new Date();
    }
  }, [datePreset, customDate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await generateGoldPriceForDate(getSelectedDate());
      setData(result);
    } catch (err) {
      console.error("Error loading gold prices:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [getSelectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      setCustomDate(undefined);
    }
  };

  const handleCustomDateSelect = (date: Date | undefined) => {
    if (date) {
      setCustomDate(date);
      setDatePreset('custom');
    }
  };

  const renderChangeIndicator = (change: number, changePercent: number) => {
    const isPositive = change > 0;
    const isNegative = change < 0;
    
    return (
      <div className={cn(
        "flex items-center gap-1 text-sm font-medium",
        isPositive && "text-green-600",
        isNegative && "text-red-600",
        !isPositive && !isNegative && "text-muted-foreground"
      )}>
        {isPositive && <TrendingUp className="h-4 w-4" />}
        {isNegative && <TrendingDown className="h-4 w-4" />}
        {!isPositive && !isNegative && <Minus className="h-4 w-4" />}
        <span>{changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
      </div>
    );
  };

  const getDateLabel = (): string => {
    const date = getSelectedDate();
    return format(date, "EEEE, dd/MM/yyyy", { locale: vi });
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Không thể tải dữ liệu</h3>
        <Button onClick={loadData} variant="outline">
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Chọn ngày xem giá
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={datePreset === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDatePresetChange('today')}
            >
              Hôm nay
            </Button>
            <Button
              variant={datePreset === 'yesterday' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDatePresetChange('yesterday')}
            >
              Hôm qua
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={datePreset === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  {datePreset === 'custom' && customDate 
                    ? format(customDate, "dd/MM/yyyy")
                    : "Chọn ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDate}
                  onSelect={handleCustomDateSelect}
                  disabled={(date) => isAfter(date, new Date())}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="text-sm text-muted-foreground">
            📅 Đang xem: <span className="font-medium text-foreground capitalize">{getDateLabel()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <>
          {/* Price Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.regions.map((region) => (
              <Card key={region.regionCode} className="border-0 shadow-md overflow-hidden">
                <div className={cn(
                  "h-1",
                  region.regionCode === 'VN' && "bg-red-500",
                  region.regionCode === 'US' && "bg-blue-500",
                  region.regionCode === 'EU' && "bg-indigo-500",
                  region.regionCode === 'CN' && "bg-yellow-500"
                )} />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{region.flag}</span>
                      <div>
                        <h3 className="font-semibold text-foreground">{region.region}</h3>
                        <span className="text-xs text-muted-foreground">{region.currency}</span>
                      </div>
                    </div>
                    {renderChangeIndicator(region.change, region.changePercent)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Giá/ounce:</span>
                      <span className="font-semibold text-foreground">
                        {formatPrice(region.pricePerOunce, region.currency)} {region.currency}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Giá/gram:</span>
                      <span className="font-semibold text-foreground">
                        {formatPrice(region.pricePerGram, region.currency)} {region.currency}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">Quy đổi VND/gram:</span>
                      <Badge variant="secondary" className="font-semibold">
                        {formatVndPrice(region.priceInVnd)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Table */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-primary" />
                So sánh giá theo khu vực
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Khu vực</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Giá/gram (VND)</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">So với VN</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Biến động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.regions.map((region) => {
                      const vnPrice = data.regions.find(r => r.regionCode === 'VN')?.priceInVnd || 0;
                      const diff = ((region.priceInVnd - vnPrice) / vnPrice) * 100;
                      
                      return (
                        <tr key={region.regionCode} className="border-b border-border/50 last:border-0">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span>{region.flag}</span>
                              <span className="font-medium text-foreground">{region.region}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-2 font-semibold text-foreground">
                            {formatVndPrice(region.priceInVnd)}
                          </td>
                          <td className="text-right py-3 px-2">
                            {region.regionCode === 'VN' ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <span className={cn(
                                "font-medium",
                                diff > 0 ? "text-red-600" : diff < 0 ? "text-green-600" : "text-muted-foreground"
                              )}>
                                {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                              </span>
                            )}
                          </td>
                          <td className="text-right py-3 px-2">
                            {renderChangeIndicator(region.change, region.changePercent)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Info Note */}
          <Card className="border-0 shadow-sm bg-muted/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                <strong>Lưu ý:</strong> Giá vàng Việt Nam bao gồm phí chế tác và thuế. 
                Giá quốc tế được quy đổi theo tỷ giá USD hiện hành. 
                Dữ liệu mang tính chất tham khảo, không phải giá giao dịch thực tế.
              </p>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default GoldPriceHistoryWidget;
