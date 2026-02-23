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
  sessionIdRef.current = sessionId;

  // Silent refetch with ETag — never sets loading=true
  const refetch = useCallback(async () => {
    const id = sessionIdRef.current;
    if (!id) return;

    const headers: HeadersInit = {};
    if (etagRef.current) {
      headers['If-None-Match'] = etagRef.current;
    }

    const res = await fetch(`/api/session/${id}`, { headers });

    // 304 Not Modified — file hasn't changed, skip update
    if (res.status === 304) return;

    if (!res.ok) return;

    // Store new ETag
    const newEtag = res.headers.get('etag');
    if (newEtag) {
      etagRef.current = newEtag;
    }

    const data: ParsedSession = await res.json();
    setSession(data);
  }, []);

  // Initial fetch (with loading state)
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      setError('No session ID provided');
      return;
    }

    setLoading(true);
    setError(null);
    etagRef.current = null;

    fetch(`/api/session/${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch session');
        const etag = res.headers.get('etag');
        if (etag) etagRef.current = etag;
        return res.json();
      })
      .then((data: ParsedSession) => {
        setSession(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [sessionId]);

  const { lastRefreshed, refresh } = usePolling({
    fetchFn: refetch,
    intervalMs: 5_000,
    enabled: !!sessionId && autoRefresh,
  });

  return { session, loading, error, lastRefreshed, refresh };
}
