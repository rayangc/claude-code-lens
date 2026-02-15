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
      className="w-full text-left block bg-surface rounded-lg p-4 border border-border hover:border-accent-purple/40 transition-all duration-150 cursor-pointer hover:bg-elevated/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <p className="text-sm text-text-primary leading-snug flex-1 min-w-0">
            {truncate(session.firstPrompt || 'No prompt', 100)}
          </p>
          {session.isTeamSession && (
            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
              team
            </span>
          )}
        </div>
        <span className="text-xs text-text-tertiary whitespace-nowrap shrink-0">
          {timeAgo(session.created)}
        </span>
      </div>

      {/* Teammate names */}
      {session.isTeamSession && session.teammateNames && session.teammateNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {session.teammateNames.map((name) => (
            <span key={name} className="text-[10px] px-1.5 py-0.5 rounded bg-elevated text-text-secondary">
              {name}
            </span>
          ))}
        </div>
      )}

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
          <span className="text-accent-purple/70 truncate max-w-[120px]">{session.gitBranch}</span>
        )}
      </div>
    </button>
  );
}
