import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/hooks/useI18n";
import { analyzeStock } from "@/services/stockAnalysis";
import type { Candle } from "@/services/marketData";

interface StockAnalysisPanelProps {
  candles: Candle[];
  isLoading: boolean;
}

const StockAnalysisPanel = ({ candles, isLoading }: StockAnalysisPanelProps) => {
  const { t } = useI18n();
  const analysis = analyzeStock(candles);
  const number = (value: number | undefined) => value?.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) ?? "—";

  const content = () => {
    if (isLoading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
    if (analysis.status === "stale") {
      return <p className="text-sm text-muted-foreground">{t("utilities.stock_analysis_stale")}</p>;
    }
    if (analysis.status === "insufficient") {
      return <p className="text-sm text-muted-foreground">{t("utilities.stock_analysis_insufficient")}</p>;
    }

    const signal = analysis.signal ?? "watch";
    const signalVariant = signal === "buy" ? "default" : signal === "sell" ? "destructive" : "secondary";
    const items = [
      { label: "RSI (14)", value: number(analysis.rsi14) },
      { label: t("utilities.stock_analysis_trend"), value: analysis.sma20 !== undefined && analysis.close !== undefined ? (analysis.close > analysis.sma20 ? t("utilities.stock_analysis_above") : t("utilities.stock_analysis_below")) : "—" },
      { label: "SMA 20 / 50", value: `${number(analysis.sma20)} / ${number(analysis.sma50)}` },
      { label: "MACD", value: analysis.macd !== undefined && analysis.macdSignal !== undefined ? (analysis.macd > analysis.macdSignal ? t("utilities.stock_analysis_bullish") : t("utilities.stock_analysis_bearish")) : "—" },
      { label: t("utilities.stock_analysis_volume"), value: analysis.volumeRatio !== undefined ? `${analysis.volumeRatio.toFixed(2)}×` : "—" },
      { label: t("utilities.stock_analysis_support"), value: number(analysis.support) },
      { label: t("utilities.stock_analysis_resistance"), value: number(analysis.resistance) },
      { label: t("utilities.stock_analysis_volatility"), value: analysis.atrPercent !== undefined ? `${analysis.atrPercent.toFixed(2)}%` : "—" },
    ];

    return (
      <>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant={signalVariant}>{t(`utilities.stock_signal_${signal}`)}</Badge>
          <span className="text-sm text-muted-foreground">{t("utilities.stock_analysis_score")}: {analysis.score}/5</span>
          <span className="text-xs text-muted-foreground ml-auto">{t("utilities.stock_analysis_updated")}: {analysis.lastUpdated ? new Date(analysis.lastUpdated).toLocaleDateString() : "—"}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-md bg-muted/50 p-3 min-w-0">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="text-sm font-semibold mt-1 break-words">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mt-4 text-sm">
          <div>
            <div className="font-medium mb-1">{t("utilities.stock_analysis_factors")}</div>
            <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
              {analysis.reasons.map((reason) => <li key={reason}>{t(`utilities.stock_analysis_reason_${reason}`)}</li>)}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">{t("utilities.stock_analysis_risks")}</div>
            <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
              {analysis.risks.map((risk) => <li key={risk}>{t(`utilities.stock_analysis_risk_${risk}`)}</li>)}
            </ul>
          </div>
        </div>
      </>
    );
  };

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h3 className="text-base font-semibold">{t("utilities.stock_analysis_title")}</h3>
          <span className="text-xs text-muted-foreground">{t("utilities.stock_analysis_technical_only")}</span>
        </div>
        {content()}
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">{t("utilities.stock_analysis_disclaimer")}</p>
      </CardContent>
    </Card>
  );
};

export default StockAnalysisPanel;