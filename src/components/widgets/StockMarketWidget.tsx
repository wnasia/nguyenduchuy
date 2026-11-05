import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, RefreshCw, ArrowUpRight, ArrowDownRight, Minus, Search, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/hooks/useI18n";
import { createChart, CandlestickSeries, HistogramSeries, ColorType, type IChartApi, type UTCTimestamp } from "lightweight-charts";
import {
  fetchHistory,
  fetchQuotes,
  fetchIntraday,
  fetchFinancials,
  ProxyUnavailableError,
  type Quote,
  type Candle,
  type MatchOrder,
} from "@/services/marketData";

const UP_COLOR = "#16a34a";
const DOWN_COLOR = "#dc2626";

const INDEX_SYMBOLS = [
  { code: "VNINDEX", name: "VN-Index" },
  { code: "VN30", name: "VN30" },
  { code: "HNX", name: "HNX-Index" },
  { code: "UPCOM", name: "UPCOM" },
];

const QUICK_STOCKS = ["FPT", "TCB", "HPG", "VCB", "VNM", "SSI"];

const isMarketOpen = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = parseInt(get("hour"), 10);
  const weekday = get("weekday");
  if (weekday === "Sat" || weekday === "Sun") return false;
  return hour >= 9 && hour < 15;
};

const formatVolume = (v: number) => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return `${v}`;
};

const formatMatchTime = (t: string | number) => {
  if (typeof t === "string") return t;
  return new Date(t * 1000).toLocaleTimeString("vi-VN", { hour12: false });
};

const StockMarketWidget = () => {
  const { t } = useI18n();
  const [symbol, setSymbol] = useState("VNINDEX");
  const [symbolInput, setSymbolInput] = useState("");
  const [rangeDays, setRangeDays] = useState(90);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ReturnType<IChartApi["addSeries"]> | null>(null);
  const volumeSeriesRef = useRef<ReturnType<IChartApi["addSeries"]> | null>(null);

  // Candlestick history (1-minute cache)
  const historyQuery = useQuery({
    queryKey: ["stock-history", symbol, rangeDays],
    queryFn: () => fetchHistory(symbol, rangeDays),
    staleTime: 60_000,
    retry: 1,
  });

  // Live quote for the selected symbol (polls every 5s when auto-refresh is on)
  const quoteQuery = useQuery({
    queryKey: ["stock-quote", symbol],
    queryFn: () => fetchQuotes([symbol]),
    staleTime: 4_000,
    refetchInterval: autoRefresh ? 5_000 : false,
    retry: 1,
  });

  // Index watchlist strip
  const indexQuery = useQuery({
    queryKey: ["stock-index-strip"],
    queryFn: () => fetchQuotes(INDEX_SYMBOLS.map((i) => i.code)),
    staleTime: 30_000,
    refetchInterval: autoRefresh ? 30_000 : false,
    retry: 1,
  });

  // Intraday matched orders (polls every 5s when auto-refresh is on)
  const intradayQuery = useQuery({
    queryKey: ["stock-intraday", symbol],
    queryFn: () => fetchIntraday(symbol),
    staleTime: 4_000,
    refetchInterval: autoRefresh ? 5_000 : false,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Financial overview (1-day cache)
  const financialsQuery = useQuery({
    queryKey: ["stock-financials", symbol],
    queryFn: () => fetchFinancials(symbol),
    staleTime: 86_400_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const quote: Quote | null = quoteQuery.data?.quotes?.[0] ?? null;

  // Track last successful update time
  useEffect(() => {
    if (quote) setLastUpdate(new Date().toLocaleTimeString("vi-VN", { hour12: false }));
  }, [quote?.price]);

  // Chart lifecycle
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "hsl(var(--muted-foreground))" },
      grid: { vertLines: { visible: false }, horzLines: { color: "hsl(var(--border))" } },
      height: 320,
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: false },
    });
    chartRef.current = chart;
    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });
    volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeriesRef.current.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  // Feed history data into the chart
  useEffect(() => {
    const candles: Candle[] = historyQuery.data?.data ?? [];
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!candleSeries || !volumeSeries) return;
    candleSeries.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? `${UP_COLOR}44` : `${DOWN_COLOR}44`,
      })),
    );
    if (candles.length > 0) {
      chartRef.current?.timeScale().fitContent();
    }
  }, [historyQuery.data]);

  const orderFlow = useMemo(() => {
    const matches: MatchOrder[] = intradayQuery.data?.matches ?? [];
    const buy = matches.filter((m) => m.matchType === "BU").reduce((s, m) => s + m.volume, 0);
    const sell = matches.filter((m) => m.matchType === "SD").reduce((s, m) => s + m.volume, 0);
    const total = buy + sell;
    return {
      matches: matches.slice(0, 8),
      buy,
      sell,
      buyPct: total > 0 ? (buy / total) * 100 : 0,
    };
  }, [intradayQuery.data]);

  const financials = financialsQuery.data?.data ?? null;
  const fNum = (v: unknown) => (typeof v === "number" ? v.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "—");
  const marketOpen = isMarketOpen();

  const changeView = (change: number, changePercent: number) => {
    if (change > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-green-600">
          <ArrowUpRight className="h-4 w-4" />
          +{change.toFixed(2)} ({changePercent.toFixed(2)}%)
        </span>
      );
    }
    if (change < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-red-600">
          <ArrowDownRight className="h-4 w-4" />
          {change.toFixed(2)} ({changePercent.toFixed(2)}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-yellow-600">
        <Minus className="h-4 w-4" />0.00 (0.00%)
      </span>
    );
  };

  const isUnavailable = (err: unknown) => err instanceof ProxyUnavailableError;

  const renderUnavailable = (key: "order_flow_unavailable" | "financials_unavailable") => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
      <WifiOff className="h-4 w-4" />
      {t(`utilities.stock_${key}`)}
    </div>
  );

  const submitSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    const code = symbolInput.trim().toUpperCase();
    if (/^[A-Z0-9_]{1,15}$/.test(code)) {
      setSymbol(code);
      setSymbolInput("");
    }
  };

  const renderIndexStrip = () => {
    if (indexQuery.isLoading) {
      return <div className="h-[68px]" />;
    }
    if (isUnavailable(indexQuery.error)) {
      return (
        <p className="text-xs text-muted-foreground">{t("utilities.stock_data_error")}</p>
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {INDEX_SYMBOLS.map((idx) => {
          const q = indexQuery.data?.quotes?.find((x) => x?.symbol === idx.code);
          if (!q) return (
            <Card key={idx.code} className="border-0 shadow-md opacity-50">
              <CardContent className="p-4">
                <div className="text-xs font-medium text-muted-foreground">{idx.name}</div>
                <div className="text-sm text-muted-foreground mt-1">—</div>
              </CardContent>
            </Card>
          );
          return (
            <Card key={idx.code} className="border-0 shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSymbol(idx.code)}>
              <div className={`h-1 ${q.change >= 0 ? "bg-green-500" : "bg-red-500"}`} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">{idx.name}</span>
                  {q.change >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                </div>
                <div className="text-lg font-bold">{q.price.toFixed(2)}</div>
                <div className="text-xs mt-1">{changeView(q.change, q.changePercent)}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Market status + refresh controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${marketOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-sm text-muted-foreground">
            {marketOpen ? t("utilities.stock_market_open") : t("utilities.stock_market_closed")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {t("utilities.stock_auto_refresh")}
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              historyQuery.refetch();
              quoteQuery.refetch();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${(historyQuery.isFetching || quoteQuery.isFetching) ? "animate-spin" : ""}`} />
            {t("utilities.stock_refresh")}
          </Button>
        </div>
      </div>

      {/* Index strip */}
      {renderIndexStrip()}

      {/* Symbol picker */}
      <form onSubmit={submitSymbol} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            placeholder={t("utilities.stock_symbol_placeholder")}
            className="pl-9 bg-muted/50 border-0 h-10"
          />
        </div>
        <Button type="submit" size="sm" className="h-10">
          {t("utilities.stock_view")}
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {QUICK_STOCKS.map((code) => (
          <Badge
            key={code}
            variant={symbol === code ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setSymbol(code)}
          >
            {code}
          </Badge>
        ))}
      </div>

      {/* Quote strip */}
      {quote ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground">{quote.symbol}</div>
              <div className="text-2xl font-bold">{quote.price.toFixed(2)}</div>
            </div>
            <div className="text-sm">{changeView(quote.change, quote.changePercent)}</div>
            <div className="text-xs text-muted-foreground space-y-0.5 text-right">
              <div>{t("utilities.stock_volume")}: {formatVolume(quote.volume)}</div>
              <div>{t("utilities.stock_reference")}: {quote.reference.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
      ) : quoteQuery.isError ? (
        <p className="text-sm text-muted-foreground">{t("utilities.stock_data_error")}</p>
      ) : null}

      {/* Candlestick chart */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            {([30, 90, 180] as const).map((d) => (
              <Badge
                key={d}
                variant={rangeDays === d ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setRangeDays(d)}
              >
                {d === 30 ? "1M" : d === 90 ? "3M" : "6M"}
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground ml-auto">{symbol}</span>
          </div>
          {historyQuery.isPending ? (
            <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : historyQuery.isError ? (
            <div className="h-[320px] flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              {t("utilities.stock_data_error")}
              <Button variant="outline" size="sm" onClick={() => historyQuery.refetch()}>
                {t("utilities.stock_retry")}
              </Button>
            </div>
          ) : (
            <div ref={chartContainerRef} className="w-full" />
          )}
        </CardContent>
      </Card>

      {/* Order flow panel */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="text-sm font-semibold mb-3">{t("utilities.stock_order_flow")}</div>
          {intradayQuery.isPending ? (
            <div className="h-16" />
          ) : intradayQuery.isError ? (
            isUnavailable(intradayQuery.error)
              ? renderUnavailable("order_flow_unavailable")
              : <p className="text-sm text-muted-foreground">{t("utilities.stock_data_error")}</p>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-green-600 font-medium">{t("utilities.stock_active_buy")} {formatVolume(orderFlow.buy)}</span>
                <span className="text-red-600 font-medium">{t("utilities.stock_active_sell")} {formatVolume(orderFlow.sell)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                <div className="bg-green-500 h-full" style={{ width: `${orderFlow.buyPct}%` }} />
                <div className="bg-red-500 h-full" style={{ width: `${100 - orderFlow.buyPct}%` }} />
              </div>
              <div className="mt-3 space-y-1">
                {orderFlow.matches.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0">
                    <span className="text-muted-foreground">{formatMatchTime(m.time)}</span>
                    <span className={`font-semibold ${m.matchType === "BU" ? "text-green-600" : "text-red-600"}`}>
                      {m.price.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">{formatVolume(m.volume)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${m.matchType === "BU" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {m.matchType === "BU" ? t("utilities.stock_active_buy") : t("utilities.stock_active_sell")}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Financial snapshot */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="text-sm font-semibold mb-3">{t("utilities.stock_financials")}</div>
          {financialsQuery.isPending ? (
            <div className="h-16" />
          ) : financialsQuery.isError ? (
            isUnavailable(financialsQuery.error)
              ? renderUnavailable("financials_unavailable")
              : <p className="text-sm text-muted-foreground">{t("utilities.stock_data_error")}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "P/E", value: fNum(financials?.pe ?? financials?.priceToEarning) },
                { label: "P/B", value: fNum(financials?.pb ?? financials?.priceToBook) },
                { label: "EPS", value: fNum(financials?.eps ?? financials?.earningPerShare) },
                { label: "ROE", value: financials?.roe != null ? `${fNum(financials.roe)}%` : "—" },
                { label: t("utilities.stock_market_cap"), value: financials?.marketCap != null ? formatVolume(Number(financials.marketCap)) : "—" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-base font-semibold mt-1">{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer note */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{lastUpdate ? t("utilities.stock_last_update").replace("{{time}}", lastUpdate) : ""}</span>
        <Badge variant="secondary" className="text-[10px]">VNDIRECT</Badge>
      </div>
    </div>
  );
};

export default StockMarketWidget;
