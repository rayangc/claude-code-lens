'use client';

import { useState, useEffect } from 'react';
import type { ParsedSession } from '@/lib/types';

export function useSession(sessionId: string) {
  const [session, setSession] = useState<ParsedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      setError('No session ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/session/${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch session');
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

  return { session, loading, error };
}
