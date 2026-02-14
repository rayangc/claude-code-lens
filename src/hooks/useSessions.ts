'use client';

import { useState, useEffect } from 'react';
import type { SessionSummary } from '@/lib/types';

export function useSessions(encodedPath: string | null) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!encodedPath) {
      setSessions([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/sessions?project=${encodedPath}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch sessions');
        return res.json();
      })
      .then((data: SessionSummary[]) => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [encodedPath]);

  return { sessions, loading, error };
}
