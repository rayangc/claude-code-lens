'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePollingOptions {
  fetchFn: () => Promise<void>;
  intervalMs: number;
  enabled: boolean;
}

export function usePolling({ fetchFn, intervalMs, enabled }: UsePollingOptions) {
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const inFlightRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchFnRef = useRef(fetchFn);

  // Keep fetchFn ref current without triggering effect re-runs
  fetchFnRef.current = fetchFn;

  const doFetch = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsRefreshing(true);
    try {
      await fetchFnRef.current();
      setLastRefreshed(new Date());
    } catch {
      // Silent failure — keep stale data
    } finally {
      inFlightRef.current = false;
      setIsRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => {
    doFetch();
  }, [doFetch]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start interval
    intervalRef.current = setInterval(doFetch, intervalMs);

    // Visibility change handler: pause when hidden, immediate fetch + resume on visible
    function handleVisibility() {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        doFetch();
        intervalRef.current = setInterval(doFetch, intervalMs);
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, intervalMs, doFetch]);

  return { lastRefreshed, isRefreshing, refresh };
}
