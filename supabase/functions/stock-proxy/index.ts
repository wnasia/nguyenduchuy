import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'

// Desktop browser User-Agent: some market data hosts reject default runtimes.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const VN_CHART_HISTORY = 'https://dchart-api.vndirect.com.vn/dchart/history'
// TCBS public endpoints (spec): apipubaws.tcbs.com.vn — service was retired by TCBS.
// The proxy still routes quote/financials/intraday there per spec and falls back gracefully.
const TCBS_BASE = 'https://apipubaws.tcbs.com.vn'

const MAX_RANGE_SECONDS = 400 * 86400

const BodySchema = z.object({
  type: z.enum(['history', 'quote', 'financials', 'intraday']),
  symbol: z.string().trim().regex(/^[A-Za-z0-9_]{1,15}$/).optional(),
  symbols: z.array(z.string().trim().regex(/^[A-Za-z0-9_]{1,15}$/)).max(8).optional(),
  resolution: z.enum(['1', '5', '15', '30', '60', 'D', 'W', 'M']).optional(),
  from: z.number().int().positive().optional(),
  to: z.number().int().positive().optional(),
  days: z.number().int().min(1).max(400).optional(),
})

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const ok = (data: Record<string, unknown>) => json({ ok: true, ...data })
const fail = (reason: string) => json({ ok: false, reason })

async function upstreamJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: '*/*',
        Referer: 'https://dstock.vndirect.com.vn/',
      },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

interface RawHistory {
  s?: string
  t?: number[]
  o?: number[]
  h?: number[]
  l?: number[]
  c?: number[]
  v?: number[]
}

interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function mapHistory(raw: RawHistory | null): Candle[] {
  if (!raw || raw.s !== 'ok' || !Array.isArray(raw.t) || raw.t.length === 0) return []
  const closes = raw.c ?? []
  return raw.t.map((time, i) => ({
    time,
    open: raw.o?.[i] ?? closes[i],
    high: raw.h?.[i] ?? closes[i],
    low: raw.l?.[i] ?? closes[i],
    close: closes[i],
    volume: raw.v?.[i] ?? 0,
  }))
}

async function fetchHistory(symbol: string, resolution: string, from: number, to: number): Promise<Candle[]> {
  const url = `${VN_CHART_HISTORY}?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}`
  return mapHistory((await upstreamJson(url)) as RawHistory | null)
}

interface Quote {
  symbol: string
  price: number
  reference: number
  change: number
  changePercent: number
  volume: number
  time: number
}

// Quote derived from the two most recent daily bars (the last bar is live during the session).
async function fetchQuote(symbol: string): Promise<Quote | null> {
  const now = Math.floor(Date.now() / 1000)
  const bars = await fetchHistory(symbol, 'D', now - 12 * 86400, now)
  if (bars.length === 0) return null
  const last = bars[bars.length - 1]
  const reference = bars.length > 1 ? bars[bars.length - 2].close : last.open
  const change = last.close - reference
  return {
    symbol,
    price: last.close,
    reference,
    change,
    changePercent: reference !== 0 ? (change / reference) * 100 : 0,
    volume: last.volume,
    time: last.time,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return fail('Method not allowed')
  }

  let parsed: z.infer<typeof BodySchema>
  try {
    const body = await req.json()
    const candidate = BodySchema.safeParse(body)
    if (!candidate.success) {
      return fail('Invalid request')
    }
    parsed = candidate.data
  } catch {
    return fail('Invalid JSON body')
  }

  const symbol = parsed.symbol?.toUpperCase()
  const now = Math.floor(Date.now() / 1000)

  if (parsed.type === 'history') {
    if (!symbol) return fail('symbol is required')
    const resolution = parsed.resolution ?? 'D'
    const to = Math.min(parsed.to ?? now, now)
    const from = Math.max(
      parsed.from ?? to - (parsed.days ?? 90) * 86400,
      to - MAX_RANGE_SECONDS,
    )
    const data = await fetchHistory(symbol, resolution, from, to)
    if (data.length === 0) return fail('upstream_no_data')
    return ok({ type: 'history', symbol, resolution, data })
  }

  if (parsed.type === 'quote') {
    const symbols = (parsed.symbols?.length ? parsed.symbols : [symbol]).map((s) => s.toUpperCase()).filter(Boolean)
    if (symbols.length === 0) return fail('symbol is required')
    const quotes = await Promise.all(symbols.map((s) => fetchQuote(s)))
    return ok({ quotes })
  }

  if (parsed.type === 'financials') {
    if (!symbol) return fail('symbol is required')
    // Spec target: TCBS tcanalysis overview (P/E, P/B, EPS, ROE, ROA, market cap...)
    const raw = (await upstreamJson(`${TCBS_BASE}/tcanalysis/v1/finance/${symbol}/overview`)) as
      | { data?: Record<string, unknown> }
      | null
    if (!raw?.data) return fail('source_unavailable')
    return ok({ type: 'financials', symbol, data: raw.data })
  }

  // intraday
  if (!symbol) return fail('symbol is required')
  // Spec target: TCBS intraday matched-order paging (BU = active buy, SD = active sell)
  const raw = (await upstreamJson(`${TCBS_BASE}/stock-insight-v1/intraday/${symbol}/his/paging?page=0&size=50`)) as
    | { data?: { matchPrices?: Array<Record<string, unknown>> } }
    | null
  const matches = (raw?.data?.matchPrices ?? []).map((m) => ({
    time: typeof m.time === 'string' || typeof m.time === 'number' ? m.time : 0,
    price: Number(m.matchPrice ?? m.price ?? 0),
    volume: Number(m.matchQtty ?? m.volume ?? 0),
    matchType: m.matchType === 'BU' || m.matchType === 'SD' ? m.matchType : 'SD',
  }))
  if (matches.length === 0) return fail('source_unavailable')
  return ok({ type: 'intraday', symbol, matches })
})
