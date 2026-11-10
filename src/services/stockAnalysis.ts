import type { Candle } from "@/services/marketData";

export type StockSignal = "buy" | "sell" | "watch";

export interface StockAnalysis {
  status: "ready" | "insufficient" | "stale";
  signal?: StockSignal;
  score?: number;
  lastUpdated?: number;
  close?: number;
  sma20?: number;
  sma50?: number;
  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  volumeRatio?: number;
  support?: number;
  resistance?: number;
  atrPercent?: number;
  reasons: string[];
  risks: string[];
}

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const emaSeries = (values: number[], period: number) => {
  const multiplier = 2 / (period + 1);
  return values.reduce<number[]>((series, value, index) => {
    const previous = series[index - 1];
    series.push(index === 0 ? value : value * multiplier + (previous ?? value) * (1 - multiplier));
    return series;
  }, []);
};

const getRsi = (closes: number[], period = 14) => {
  const changes = closes.slice(1).map((close, index) => close - (closes[index] ?? close));
  const recent = changes.slice(-period);
  const gains = recent.map((change) => Math.max(change, 0));
  const losses = recent.map((change) => Math.max(-change, 0));
  const averageGain = average(gains);
  const averageLoss = average(losses);
  if (averageLoss === 0) return averageGain === 0 ? 50 : 100;
  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
};

export function analyzeStock(candles: Candle[], now = Date.now()): StockAnalysis {
  const sorted = candles
    .filter((candle) => Number.isFinite(candle.time) && Number.isFinite(candle.close) && candle.close > 0)
    .slice()
    .sort((a, b) => a.time - b.time);

  if (sorted.length < 50) {
    return { status: "insufficient", reasons: [], risks: ["insufficient_data"] };
  }

  const latest = sorted[sorted.length - 1];
  if (!latest) return { status: "insufficient", reasons: [], risks: ["insufficient_data"] };
  const lastUpdated = latest.time * 1000;
  if (now - lastUpdated > 7 * 24 * 60 * 60 * 1000) {
    return { status: "stale", lastUpdated, reasons: [], risks: ["stale_data"] };
  }

  const closes = sorted.map((candle) => candle.close);
  const latest20 = sorted.slice(-20);
  const sma20 = average(closes.slice(-20));
  const sma50 = average(closes.slice(-50));
  const rsi14 = getRsi(closes);

  const ema12 = emaSeries(closes, 12);
  const ema26 = emaSeries(closes, 26);
  const macdSeries = closes.map((_, index) => (ema12[index] ?? 0) - (ema26[index] ?? 0));
  const macdSignalSeries = emaSeries(macdSeries, 9);
  const macd = macdSeries[macdSeries.length - 1] ?? 0;
  const macdSignal = macdSignalSeries[macdSignalSeries.length - 1] ?? 0;

  const recentRanges = sorted.slice(-15).map((candle, index, recent) => {
    const previousClose = recent[index - 1]?.close ?? candle.close;
    return Math.max(candle.high - candle.low, Math.abs(candle.high - previousClose), Math.abs(candle.low - previousClose));
  });
  const atrPercent = (average(recentRanges) / latest.close) * 100;
  const averageVolume = average(latest20.map((candle) => Math.max(0, candle.volume)));
  const volumeRatio = averageVolume > 0 ? latest.volume / averageVolume : 1;
  const baseScore =
    (latest.close > sma20 ? 1 : -1) +
    (sma20 > sma50 ? 1 : -1) +
    (macd > macdSignal ? 1 : -1) +
    (rsi14 >= 50 && rsi14 < 68 ? 1 : rsi14 >= 68 || rsi14 < 32 ? -1 : 0);
  const score = baseScore + (volumeRatio >= 1.3 && baseScore !== 0 ? Math.sign(baseScore) : 0);
  const signal: StockSignal = score >= 3 ? "buy" : score <= -3 ? "sell" : "watch";
  const reasons: string[] = [];

  if (latest.close > sma20) reasons.push("above_sma20");
  else reasons.push("below_sma20");
  if (sma20 > sma50) reasons.push("sma_bullish");
  else reasons.push("sma_bearish");
  reasons.push(macd > macdSignal ? "macd_bullish" : "macd_bearish");
  if (volumeRatio >= 1.3) reasons.push("volume_confirmed");
  if (rsi14 >= 68) reasons.push("rsi_overbought");
  else if (rsi14 < 32) reasons.push("rsi_oversold");

  const risks: string[] = [];
  if (atrPercent >= 5) risks.push("high_volatility");
  if (rsi14 >= 68) risks.push("overbought_risk");
  if (rsi14 < 32) risks.push("oversold_risk");
  if (volumeRatio < 0.7) risks.push("low_volume");
  if (risks.length === 0) risks.push("technical_only");

  return {
    status: "ready",
    signal,
    score,
    lastUpdated,
    close: latest.close,
    sma20,
    sma50,
    rsi14,
    macd,
    macdSignal,
    volumeRatio,
    support: Math.min(...latest20.map((candle) => candle.low)),
    resistance: Math.max(...latest20.map((candle) => candle.high)),
    atrPercent,
    reasons,
    risks,
  };
}