"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// In-memory cache for ultra-fast, single-session data access
const memoryCache: Record<string, { value: any; timestamp: number }> = {};

export function useCache<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number; // Time-to-live in ms (e.g. 2 minutes)
    revalidateOnMount?: boolean;
    useSessionStorage?: boolean;
  } = {}
) {
  const { ttl = 2 * 60 * 1000, revalidateOnMount = true, useSessionStorage = true } = options;

  const [data, setData] = useState<T | null>(() => {
    if (!key) return null;

    // 1. Check in-memory cache
    if (memoryCache[key]) {
      const { value, timestamp } = memoryCache[key];
      if (Date.now() - timestamp < ttl) {
        return value as T;
      }
    }

    // 2. Check sessionStorage
    if (useSessionStorage && typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(`app_cache_${key}`);
        if (cached) {
          const { value, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < ttl) {
            // Populate in-memory cache for next use
            memoryCache[key] = { value, timestamp };
            return value as T;
          }
        }
      } catch (e) {
        // ignore invalid cache entries
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(!data);
  const [error, setError] = useState<any>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!key) return;

    let isMounted = true;

    async function revalidate() {
      try {
        if (!data) {
          setIsLoading(true);
        }
        const freshData = await fetcherRef.current();
        if (isMounted) {
          setData(freshData);
          setIsLoading(false);
          setError(null);
        }

        // Cache fresh data
        const cacheObj = { value: freshData, timestamp: Date.now() };
        if (key) {
          memoryCache[key] = cacheObj;
          if (useSessionStorage && typeof window !== "undefined") {
            try {
              sessionStorage.setItem(`app_cache_${key}`, JSON.stringify(cacheObj));
            } catch (e) {
              // ignore
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    }

    if (revalidateOnMount || !data) {
      revalidate();
    }

    return () => {
      isMounted = false;
    };
  }, [key, ttl, useSessionStorage, revalidateOnMount]);

  const mutate = useCallback(async (newData?: T) => {
    if (!key) return;

    if (newData !== undefined) {
      setData(newData);
      const cacheObj = { value: newData, timestamp: Date.now() };
      memoryCache[key] = cacheObj;
      if (useSessionStorage && typeof window !== "undefined") {
        try {
          sessionStorage.setItem(`app_cache_${key}`, JSON.stringify(cacheObj));
        } catch (e) {
          // ignore
        }
      }
    } else {
      setIsLoading(true);
      try {
        const freshData = await fetcherRef.current();
        setData(freshData);
        setIsLoading(false);
        setError(null);

        const cacheObj = { value: freshData, timestamp: Date.now() };
        memoryCache[key] = cacheObj;
        if (useSessionStorage && typeof window !== "undefined") {
          try {
            sessionStorage.setItem(`app_cache_${key}`, JSON.stringify(cacheObj));
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        setError(err);
        setIsLoading(false);
      }
    }
  }, [key, useSessionStorage]);

  return { data, isLoading, error, mutate };
}

