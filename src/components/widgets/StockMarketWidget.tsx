import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, RefreshCw, Clock, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";

interface StockIndex {
  name: string;
  code: string;
  value: number;
  change: number;
  changePercent: number;
  volume: string;
  lastUpdate: string;
}

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  ceiling: number;
  floor: number;
  reference: number;
}

// Simulated real-time data generator based on market hours
const generateMarketData = () => {
  const now = new Date();
  const hour = now.getHours();
  const isMarketOpen = hour >= 9 && hour < 15;
  
  // Base values with slight variations
  const seed = now.getMinutes() + now.getSeconds();
  const variation = (seed % 100) / 1000; // Small variation 0-0.1
  
  const indices: StockIndex[] = [
    {
      name: "VN-Index",
      code: "VNINDEX",
      value: 1245.67 + (variation * 50 - 25),
      change: 12.34 + (variation * 10 - 5),
      changePercent: 1.0 + (variation * 2 - 1),
      volume: `${(2.5 + variation).toFixed(1)}B`,
      lastUpdate: now.toLocaleTimeString('vi-VN'),
    },
    {
      name: "HNX-Index",
      code: "HNX",
      value: 234.56 + (variation * 10 - 5),
      change: 2.34 + (variation * 2 - 1),
      changePercent: 1.01 + (variation - 0.5),
      volume: `${(450 + variation * 100).toFixed(0)}M`,
      lastUpdate: now.toLocaleTimeString('vi-VN'),
    },
    {
      name: "UPCOM-Index",
      code: "UPCOM",
      value: 92.34 + (variation * 5 - 2.5),
      change: -0.45 + (variation - 0.5),
      changePercent: -0.49 + (variation - 0.5),
      volume: `${(120 + variation * 50).toFixed(0)}M`,
      lastUpdate: now.toLocaleTimeString('vi-VN'),
    },
    {
      name: "VN30",
      code: "VN30",
      value: 1287.45 + (variation * 30 - 15),
      change: 8.92 + (variation * 5 - 2.5),
      changePercent: 0.70 + (variation - 0.5),
      volume: `${(1.8 + variation).toFixed(1)}B`,
      lastUpdate: now.toLocaleTimeString('vi-VN'),
    },
  ];
  
  return { indices, isMarketOpen };
};

const generateTopStocks = () => {
  const now = new Date();
  const seed = now.getMinutes();
  const variation = (seed % 60) / 600;
  
  const gainers: Stock[] = [
    { symbol: "FPT", name: "FPT Corporation", price: 125.5 + variation * 5, change: 7.5, changePercent: 6.36, volume: "5.2M", ceiling: 132.0, floor: 115.0, reference: 118.0 },
    { symbol: "VNM", name: "Vinamilk", price: 74.2 + variation * 3, change: 4.2, changePercent: 6.0, volume: "3.8M", ceiling: 77.5, floor: 68.5, reference: 70.0 },
    { symbol: "HPG", name: "Hoa Phat Group", price: 28.9 + variation * 2, change: 1.9, changePercent: 7.0, volume: "15.6M", ceiling: 29.5, floor: 25.5, reference: 27.0 },
    { symbol: "MWG", name: "Mobile World", price: 56.3 + variation * 2, change: 3.3, changePercent: 6.2, volume: "2.1M", ceiling: 58.0, floor: 50.0, reference: 53.0 },
    { symbol: "VIC", name: "Vingroup", price: 45.8 + variation * 2, change: 2.8, changePercent: 6.5, volume: "4.5M", ceiling: 48.0, floor: 42.0, reference: 43.0 },
  ];
  
  const losers: Stock[] = [
    { symbol: "SSI", name: "SSI Securities", price: 32.5 - variation * 2, change: -2.0, changePercent: -5.8, volume: "8.2M", ceiling: 36.0, floor: 31.0, reference: 34.5 },
    { symbol: "VCB", name: "Vietcombank", price: 92.3 - variation * 3, change: -5.7, changePercent: -5.8, volume: "2.4M", ceiling: 102.0, floor: 90.0, reference: 98.0 },
    { symbol: "TCB", name: "Techcombank", price: 35.6 - variation * 2, change: -2.1, changePercent: -5.6, volume: "6.8M", ceiling: 40.0, floor: 34.0, reference: 37.7 },
    { symbol: "VHM", name: "Vinhomes", price: 42.1 - variation * 2, change: -2.4, changePercent: -5.4, volume: "3.2M", ceiling: 46.0, floor: 40.0, reference: 44.5 },
    { symbol: "CTG", name: "VietinBank", price: 33.8 - variation * 1.5, change: -1.8, changePercent: -5.1, volume: "4.1M", ceiling: 37.0, floor: 32.0, reference: 35.6 },
  ];
  
  const active: Stock[] = [
    { symbol: "STB", name: "Sacombank", price: 32.4 + variation, change: 0.4, changePercent: 1.25, volume: "25.8M", ceiling: 34.0, floor: 30.0, reference: 32.0 },
    { symbol: "HPG", name: "Hoa Phat", price: 28.9 + variation, change: 1.9, changePercent: 7.0, volume: "18.2M", ceiling: 29.5, floor: 25.5, reference: 27.0 },
    { symbol: "SHB", name: "SHB Bank", price: 12.8 + variation * 0.5, change: 0.3, changePercent: 2.4, volume: "16.5M", ceiling: 13.5, floor: 11.5, reference: 12.5 },
    { symbol: "VND", name: "VNDirect", price: 18.9 - variation * 0.5, change: -0.6, changePercent: -3.1, volume: "14.2M", ceiling: 20.5, floor: 17.5, reference: 19.5 },
    { symbol: "SSI", name: "SSI Securities", price: 32.5 - variation, change: -2.0, changePercent: -5.8, volume: "12.8M", ceiling: 36.0, floor: 31.0, reference: 34.5 },
  ];
  
  return { gainers, losers, active };
};

const StockMarketWidget = () => {
  const { t } = useI18n();
  const [marketData, setMarketData] = useState(generateMarketData());
  const [stockData, setStockData] = useState(generateTopStocks());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    // Auto refresh every 30 seconds during market hours
    const interval = setInterval(() => {
      const data = generateMarketData();
      if (data.isMarketOpen) {
        setMarketData(data);
        setStockData(generateTopStocks());
        setLastRefresh(new Date());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setMarketData(generateMarketData());
    setStockData(generateTopStocks());
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const renderChangeIndicator = (change: number, changePercent: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <ArrowUpRight className="h-4 w-4" />
          <span>+{change.toFixed(2)}</span>
          <span className="text-xs">({changePercent.toFixed(2)}%)</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <ArrowDownRight className="h-4 w-4" />
          <span>{change.toFixed(2)}</span>
          <span className="text-xs">({changePercent.toFixed(2)}%)</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <Minus className="h-4 w-4" />
        <span>0.00</span>
        <span className="text-xs">(0.00%)</span>
      </div>
    );
  };

  const getPriceColor = (price: number, reference: number, ceiling: number, floor: number) => {
    if (price >= ceiling) return "text-purple-600 bg-purple-100";
    if (price <= floor) return "text-cyan-600 bg-cyan-100";
    if (price > reference) return "text-green-600 bg-green-50";
    if (price < reference) return "text-red-600 bg-red-50";
    return "text-yellow-600 bg-yellow-50";
  };

  const renderStockRow = (stock: Stock) => (
    <div 
      key={stock.symbol} 
      className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 px-2 -mx-2 rounded transition-colors"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">{stock.symbol}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">{stock.name}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          KL: {stock.volume}
        </div>
      </div>
      <div className="text-right">
        <div className={`font-semibold px-2 py-0.5 rounded ${getPriceColor(stock.price, stock.reference, stock.ceiling, stock.floor)}`}>
          {stock.price.toFixed(1)}
        </div>
        <div className={`text-xs mt-0.5 ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)} ({stock.changePercent.toFixed(2)}%)
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Market Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${marketData.isMarketOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {marketData.isMarketOpen ? 'Thị trường đang mở' : 'Thị trường đã đóng'}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Index Cards */}
      <div className="grid grid-cols-2 gap-3">
        {marketData.indices.map((index) => (
          <Card key={index.code} className="border-0 shadow-md overflow-hidden">
            <div className={`h-1 ${index.change >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{index.code}</span>
                {index.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-xl font-bold text-foreground mb-1">
                {index.value.toFixed(2)}
              </div>
              {renderChangeIndicator(index.change, index.changePercent)}
              <div className="text-xs text-muted-foreground mt-2">
                KL: {index.volume}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Stocks Tabs */}
      <Tabs defaultValue="gainers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gainers" className="text-xs sm:text-sm">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            Tăng giá
          </TabsTrigger>
          <TabsTrigger value="losers" className="text-xs sm:text-sm">
            <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
            Giảm giá
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs sm:text-sm">
            <RefreshCw className="h-3 w-3 mr-1" />
            Thanh khoản
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gainers" className="mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                <TrendingUp className="h-4 w-4" />
                Top tăng giá
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockData.gainers.map(renderStockRow)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="losers" className="mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                <TrendingDown className="h-4 w-4" />
                Top giảm giá
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockData.losers.map(renderStockRow)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Thanh khoản cao nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockData.active.map(renderStockRow)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last update info */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Cập nhật lúc: {lastRefresh.toLocaleTimeString('vi-VN')}</span>
      </div>

      {/* Legend */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Chú thích màu giá:</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary" className="bg-purple-100 text-purple-600">Trần</Badge>
            <Badge variant="secondary" className="bg-green-50 text-green-600">Tăng</Badge>
            <Badge variant="secondary" className="bg-yellow-50 text-yellow-600">Tham chiếu</Badge>
            <Badge variant="secondary" className="bg-red-50 text-red-600">Giảm</Badge>
            <Badge variant="secondary" className="bg-cyan-100 text-cyan-600">Sàn</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockMarketWidget;
