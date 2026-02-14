'use client';

import type { SessionSummary } from '@/lib/types';
import { SessionCard } from './SessionCard';

interface SessionListProps {
  sessions: SessionSummary[];
  loading: boolean;
  error: string | null;
}

export function SessionList({ sessions, loading, error }: SessionListProps) {
  if (loading) {
    return <div className="text-text-tertiary text-sm py-8 text-center">Loading sessions…</div>;
  }

  if (error) {
    return <div className="text-red-400 text-sm py-8 text-center">{error}</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-text-tertiary text-sm py-8 text-center">No sessions found</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {sessions.map(session => (
        <SessionCard key={session.sessionId} session={session} />
      ))}
    </div>
  );
}
