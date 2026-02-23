'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ParsedSession } from '@/lib/types';
import { usePolling } from './usePolling';

export function useSession(sessionId: string, autoRefresh = true) {
  const [session, setSession] = useState<ParsedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const etagRef = useRef<string | null>(null);
  const sessionIdRef = useRef(sessionId);

  // Keep ref in sync
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // Silent refetch with ETag — never sets loading=true
  const refetch = useCallback(async () => {
    const id = sessionIdRef.current;
    if (!id) return;

    const headers: HeadersInit = {};
    if (etagRef.current) {
      headers['If-None-Match'] = etagRef.current;
    }

    const res = await fetch(`/api/session/${id}`, { headers, cache: 'no-store' });

    if (!res.ok) return;

    // Store new ETag
    const newEtag = res.headers.get('etag');
    if (newEtag) {
      etagRef.current = newEtag;
    }

    const data = await res.json();

    // Unchanged — file hasn't changed, skip update
    if (data.unchanged) return;

    setSession(data as ParsedSession);
  }, []);

  // Initial fetch (with loading state)
  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      setError('No session ID provided');
      return;
    }

    etagRef.current = null;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch session');
        const etag = res.headers.get('etag');
        if (etag) etagRef.current = etag;
        const data: ParsedSession = await res.json();
        setSession(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    })();
  }, [sessionId]);

  const { lastRefreshed, refresh } = usePolling({
    fetchFn: refetch,
    intervalMs: 5_000,
    enabled: !!sessionId && autoRefresh,
  });

  return { session, loading, error, lastRefreshed, refresh };
}
