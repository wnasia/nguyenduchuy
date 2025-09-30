import { useState, useEffect, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Search, Star, StarOff, TrendingUp, TrendingDown } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { CryptoSparkline } from "@/components/crypto/CryptoSparkline";
import { useCryptoData } from "@/hooks/useCryptoData";
import { CryptoCoin, SortField, SortOrder, ChartTimeRange } from "@/types/crypto";

const CryptoTracker = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("market_cap");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin | null>(null);
  const [chartTimeRange, setChartTimeRange] = useState<ChartTimeRange>("1D");
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("crypto-watchlist");
    return saved ? JSON.parse(saved) : [];
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { data: coins, isLoading, error } = useCryptoData();

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem("crypto-watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = useCallback((coinId: string) => {
    setWatchlist(prev => 
      prev.includes(coinId) 
        ? prev.filter(id => id !== coinId)
        : [...prev, coinId]
    );
  }, []);

  const filteredAndSortedCoins = useMemo(() => {
    if (!coins) return [];

    let filtered = coins.filter(coin => 
      coin.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    // Sort coins
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [coins, debouncedSearchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    const isPositive = value > 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {Math.abs(value).toFixed(2)}%
      </span>
    );
  };

  // Get featured coins (BTC, ETH)
  const featuredCoins = coins?.filter(coin => ['bitcoin', 'ethereum'].includes(coin.id)) || [];

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Error loading crypto data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Crypto Market Tracker</h1>
      
      {/* Featured Coins */}
      {featuredCoins.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {featuredCoins.map(coin => (
            <Card key={coin.id} className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                  <span>{coin.name}</span>
                  <Badge variant="secondary">{coin.symbol.toUpperCase()}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">${coin.current_price.toLocaleString()}</p>
                  <div className="flex justify-between">
                    <span>24h Change:</span>
                    {formatPercent(coin.price_change_percentage_24h)}
                  </div>
                  <div className="flex justify-between">
                    <span>Market Cap:</span>
                    <span>{formatCurrency(coin.market_cap)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search and Controls */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search coins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={watchlist.length > 0 ? "default" : "outline"}
                onClick={() => setSearchTerm("")}
              >
                <Star className="w-4 h-4 mr-2" />
                Watchlist ({watchlist.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">Loading market data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-left">Coin</th>
                    <th 
                      className="p-4 text-right cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("current_price")}
                    >
                      Price {sortField === "current_price" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th 
                      className="p-4 text-right cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("price_change_percentage_24h")}
                    >
                      24h % {sortField === "price_change_percentage_24h" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th 
                      className="p-4 text-right cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("price_change_percentage_7d_in_currency")}
                    >
                      7d % {sortField === "price_change_percentage_7d_in_currency" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th 
                      className="p-4 text-right cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("total_volume")}
                    >
                      Volume {sortField === "total_volume" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th 
                      className="p-4 text-right cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("market_cap")}
                    >
                      Market Cap {sortField === "market_cap" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-4 text-center">24h Chart</th>
                    <th className="p-4 text-center">Watch</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedCoins.slice(0, 100).map((coin) => (
                    <tr 
                      key={coin.id} 
                      className="border-b hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedCoin(coin)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">#{coin.market_cap_rank}</span>
                          <img src={coin.image} alt={coin.name} className="w-6 h-6" />
                          <div>
                            <p className="font-medium">{coin.name}</p>
                            <p className="text-sm text-gray-500">{coin.symbol.toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">${coin.current_price.toLocaleString()}</td>
                      <td className="p-4 text-right">{formatPercent(coin.price_change_percentage_24h)}</td>
                      <td className="p-4 text-right">{formatPercent(coin.price_change_percentage_7d_in_currency || 0)}</td>
                      <td className="p-4 text-right">{formatCurrency(coin.total_volume)}</td>
                      <td className="p-4 text-right">{formatCurrency(coin.market_cap)}</td>
                      <td className="p-4">
                        <CryptoSparkline data={coin.sparkline_in_7d?.price || []} />
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(coin.id);
                          }}
                        >
                          {watchlist.includes(coin.id) ? (
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coin Detail Modal */}
      <Dialog open={!!selectedCoin} onOpenChange={() => setSelectedCoin(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedCoin && (
                <>
                  <img src={selectedCoin.image} alt={selectedCoin.name} className="w-8 h-8" />
                  <span>{selectedCoin.name}</span>
                  <Badge variant="secondary">{selectedCoin.symbol.toUpperCase()}</Badge>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedCoin && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Current Price</p>
                  <p className="text-xl font-bold">${selectedCoin.current_price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">24h Change</p>
                  <p>{formatPercent(selectedCoin.price_change_percentage_24h)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Market Cap</p>
                  <p>{formatCurrency(selectedCoin.market_cap)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Volume</p>
                  <p>{formatCurrency(selectedCoin.total_volume)}</p>
                </div>
              </div>

              <div>
                <div className="flex gap-2 mb-4">
                  {(["1D", "7D", "1M", "3M", "1Y"] as ChartTimeRange[]).map((range) => (
                    <Button
                      key={range}
                      variant={chartTimeRange === range ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartTimeRange(range)}
                    >
                      {range}
                    </Button>
                  ))}
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedCoin.sparkline_in_7d?.price?.map((price, index) => ({
                      index,
                      price
                    })) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" hide />
                      <YAxis domain={['dataMin', 'dataMax']} />
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                        labelFormatter={() => ''}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CryptoTracker;