import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

interface UseCachedFetchOptions {
  cacheKey: string;
  cacheDuration?: number; // in milliseconds, default 5 minutes
  enabled?: boolean;
}

export function useCachedFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseCachedFetchOptions
) {
  const { cacheKey, cacheDuration = 5 * 60 * 1000, enabled = true } = options;
  const [data, setData] = useState<T | null>(() => {
    const cached = cache.get(cacheKey) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return cached.data;
    }
    return null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFn();
      setData(result);
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
    } catch (err) {
      console.error(`Error fetching ${cacheKey}:`, err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, cacheKey, enabled]);

  useEffect(() => {
    if (!enabled || fetchedRef.current) return;
    
    const cached = cache.get(cacheKey) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      setData(cached.data);
      setLoading(false);
      return;
    }
    
    fetchedRef.current = true;
    refresh();
  }, [cacheKey, cacheDuration, refresh, enabled]);

  return { data, loading, error, refresh };
}

// Shared forex data to avoid duplicate API calls
let forexPromise: Promise<Record<string, number>> | null = null;
let forexData: Record<string, number> | null = null;
let forexTimestamp = 0;
const FOREX_CACHE_DURATION = 5 * 60 * 1000;

export async function getForexRates(): Promise<Record<string, number>> {
  if (forexData && Date.now() - forexTimestamp < FOREX_CACHE_DURATION) {
    return forexData;
  }
  
  if (forexPromise) {
    return forexPromise;
  }
  
  forexPromise = fetch(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'
  )
    .then(res => res.json())
    .then(data => {
      forexData = data.usd || {};
      forexTimestamp = Date.now();
      forexPromise = null;
      return forexData;
    })
    .catch(err => {
      forexPromise = null;
      throw err;
    });
  
  return forexPromise;
}
