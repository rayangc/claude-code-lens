'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SessionSummary } from '@/lib/types';
import { usePolling } from './usePolling';

export function useSessions(encodedPath: string | null) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const encodedPathRef = useRef(encodedPath);

  // Keep ref in sync
  useEffect(() => { encodedPathRef.current = encodedPath; }, [encodedPath]);

  // Silent refetch — never sets loading=true
  const refetch = useCallback(async () => {
    const path = encodedPathRef.current;
    if (!path) return;
    const res = await fetch(`/api/sessions?project=${path}`);
    if (!res.ok) return;
    const data: SessionSummary[] = await res.json();
    setSessions(data);
  }, []);

  // Initial fetch (with loading state)
  useEffect(() => {
    if (!encodedPath) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/sessions?project=${encodedPath}`);
        if (!res.ok) throw new Error('Failed to fetch sessions');
        const data: SessionSummary[] = await res.json();
        setSessions(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    })();
  }, [encodedPath]);

  const { lastRefreshed, refresh } = usePolling({
    fetchFn: refetch,
    intervalMs: 10_000,
    enabled: !!encodedPath,
  });

  return { sessions, loading, error, lastRefreshed, refresh };
}
