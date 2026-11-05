import { supabase } from "@/integrations/supabase/client";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  symbol: string;
  price: number;
  reference: number;
  change: number;
  changePercent: number;
  volume: number;
  time: number;
}

export interface MatchOrder {
  time: string | number;
  price: number;
  volume: number;
  matchType: "BU" | "SD";
}

export interface ProxyResponse {
  ok?: boolean;
  reason?: string;
  error?: string;
}

export class ProxyUnavailableError extends Error {}

async function callStockProxy<T extends ProxyResponse>(
  payload: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("stock-proxy", {
    body: payload,
  });
  if (error) {
    throw new Error(error.message || "stock-proxy request failed");
  }
  const res = data as T;
  if (!res || res.ok === false) {
    throw new ProxyUnavailableError(res?.reason || "unavailable");
  }
  return res;
}

export interface HistoryResponse extends ProxyResponse {
  data: Candle[];
}

export async function fetchHistory(
  symbol: string,
  days = 90,
  resolution = "D",
): Promise<HistoryResponse> {
  const to = Math.floor(Date.now() / 1000);
  return callStockProxy<HistoryResponse>({
    type: "history",
    symbol,
    resolution,
    from: to - days * 86400,
    to,
  });
}

export interface QuoteResponse extends ProxyResponse {
  quotes: (Quote | null)[];
}

export async function fetchQuotes(symbols: string[]): Promise<QuoteResponse> {
  return callStockProxy<QuoteResponse>({ type: "quote", symbols });
}

export interface IntradayResponse extends ProxyResponse {
  matches: MatchOrder[];
}

export async function fetchIntraday(symbol: string): Promise<IntradayResponse> {
  return callStockProxy<IntradayResponse>({ type: "intraday", symbol });
}

export interface FinancialsResponse extends ProxyResponse {
  data: Record<string, unknown>;
}

export async function fetchFinancials(symbol: string): Promise<FinancialsResponse> {
  return callStockProxy<FinancialsResponse>({ type: "financials", symbol });
}
