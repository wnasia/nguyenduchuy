import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle } from "lucide-react";

interface GoldPrice {
  buy: number;
  sell: number;
  change: number;
}

interface GoldData {
  sjc: GoldPrice;
  pnj: GoldPrice;
  doji: GoldPrice;
  lastUpdated: Date;
}

// Simulated Vietnam gold price data (in VND per tael/lượng)
// In production, this would connect to a real API like BTMC, SJC, etc.
const fetchGoldPrices = async (): Promise<GoldData | null> => {
  try {
    // Using a proxy or direct API for Vietnam gold prices
    // For now, we'll use realistic simulated data based on current market
    const basePrice = 92000000; // ~92 million VND per tael (realistic 2025 price)
    const variation = Math.random() * 500000 - 250000; // ±250,000 VND variation
    
    return {
      sjc: {
        buy: basePrice + variation,
        sell: basePrice + variation + 500000,
        change: Math.random() * 400000 - 200000,
      },
      pnj: {
        buy: basePrice + variation - 100000,
        sell: basePrice + variation + 400000,
        change: Math.random() * 400000 - 200000,
      },
      doji: {
        buy: basePrice + variation - 50000,
        sell: basePrice + variation + 450000,
        change: Math.random() * 400000 - 200000,
      },
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Error fetching gold prices:", error);
    return null;
  }
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN").format(Math.round(price / 1000)) + "K";
};

const formatChange = (change: number): string => {
  const prefix = change >= 0 ? "+" : "";
  return prefix + new Intl.NumberFormat("vi-VN").format(Math.round(change / 1000)) + "K";
};

const GoldPriceWidget = () => {
  const [data, setData] = useState<GoldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    const result = await fetchGoldPrices();
    if (result) {
      setData(result);
    } else {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const renderChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="text-yellow-600 text-sm">🥇</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground">Giá Vàng Việt Nam</h3>
        </div>
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">Không thể tải dữ liệu</span>
        </div>
        <button
          onClick={loadData}
          className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-primary hover:underline"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500/90 to-amber-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="text-lg">🥇</span>
            <h3 className="font-semibold">Giá Vàng Việt Nam</h3>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-1 rounded hover:bg-white/20 transition-colors text-white/80"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading && !data ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                <div className="h-6 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="space-y-3">
            {/* SJC Gold */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">SJC</p>
                <p className="text-xs text-muted-foreground">Vàng miếng</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mua:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatPrice(data.sjc.buy)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Bán:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatPrice(data.sjc.sell)}
                  </span>
                </div>
              </div>
              <div className={`flex items-center gap-1 ${getChangeColor(data.sjc.change)}`}>
                {renderChangeIcon(data.sjc.change)}
                <span className="text-xs font-medium">{formatChange(data.sjc.change)}</span>
              </div>
            </div>

            {/* PNJ Gold */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">PNJ</p>
                <p className="text-xs text-muted-foreground">Vàng nhẫn</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mua:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatPrice(data.pnj.buy)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Bán:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatPrice(data.pnj.sell)}
                  </span>
                </div>
              </div>
              <div className={`flex items-center gap-1 ${getChangeColor(data.pnj.change)}`}>
                {renderChangeIcon(data.pnj.change)}
                <span className="text-xs font-medium">{formatChange(data.pnj.change)}</span>
              </div>
            </div>

            {/* DOJI Gold */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">DOJI</p>
                <p className="text-xs text-muted-foreground">Vàng miếng</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mua:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatPrice(data.doji.buy)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Bán:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatPrice(data.doji.sell)}
                  </span>
                </div>
              </div>
              <div className={`flex items-center gap-1 ${getChangeColor(data.doji.change)}`}>
                {renderChangeIcon(data.doji.change)}
                <span className="text-xs font-medium">{formatChange(data.doji.change)}</span>
              </div>
            </div>

            {/* Last Updated */}
            <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
              Cập nhật: {data.lastUpdated.toLocaleTimeString("vi-VN")}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GoldPriceWidget;
