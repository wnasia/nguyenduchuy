import assert from "node:assert/strict";
import { analyzeStock } from "../src/services/stockAnalysis";
import type { Candle } from "../src/services/marketData";

const now = Date.UTC(2026, 10, 10);
const makeCandles = (step: number): Candle[] => Array.from({ length: 60 }, (_, index) => {
  const close = 100 + index * step;
  return {
    time: Math.floor((now - (59 - index) * 86_400_000) / 1000),
    open: close - step / 2,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1000 + index,
  };
});

assert.equal(analyzeStock(makeCandles(1), now).signal, "buy", "strong rising trend should produce a Buy signal");
assert.equal(analyzeStock(makeCandles(-1), now).signal, "sell", "strong falling trend should produce a Sell signal");
assert.equal(analyzeStock(makeCandles(1).slice(0, 40), now).status, "insufficient", "fewer than 50 daily candles must not be rated");

const staleCandles = makeCandles(1).map((candle) => ({ ...candle, time: candle.time - 8 * 86_400 }));
assert.equal(analyzeStock(staleCandles, now).status, "stale", "data older than seven days must not produce a trading signal");

console.log("Stock analysis checks passed.");