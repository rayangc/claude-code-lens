'use client';

import type { SessionSummary } from '@/lib/types';
import { timeAgo, formatDuration, formatCost, truncate } from '@/lib/utils';

interface SessionCardProps {
  session: SessionSummary;
}

export function SessionCard({ session }: SessionCardProps) {
  const handleClick = () => {
    window.location.href = `/session/${session.sessionId}`;
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left block bg-surface rounded-lg p-4 border border-border hover:border-indigo-500/40 transition-all duration-150 cursor-pointer hover:bg-elevated/50"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-text-primary leading-snug flex-1">
          {truncate(session.firstPrompt || 'No prompt', 100)}
        </p>
        <span className="text-xs text-text-tertiary whitespace-nowrap shrink-0">
          {timeAgo(session.created)}
        </span>
      </div>

      <div className="flex gap-4 mt-3 text-xs text-text-tertiary">
        {session.duration != null && (
          <span>{formatDuration(session.duration)}</span>
        )}
        {session.cost != null && (
          <span>{formatCost(session.cost)}</span>
        )}
        {session.toolCallCount != null && (
          <span>{session.toolCallCount} tools</span>
        )}
        <span>{session.messageCount} msgs</span>
        {session.gitBranch && (
          <span className="text-indigo-400/70 truncate max-w-[120px]">{session.gitBranch}</span>
        )}
      </div>
    </button>
  );
}
