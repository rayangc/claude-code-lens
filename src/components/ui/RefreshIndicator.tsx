'use client';

import { useState, useEffect } from 'react';

interface RefreshIndicatorProps {
  lastRefreshed: Date | null;
  onRefresh: () => void;
  active?: boolean;
  onToggle?: () => void;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

export function RefreshIndicator({ lastRefreshed, onRefresh, active = true, onToggle }: RefreshIndicatorProps) {
  const [, setTick] = useState(0);

  // Re-render every 5s to update "Xs ago" text
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(interval);
  }, [active]);

  const handleClick = () => {
    if (active) {
      onRefresh();
    } else {
      onToggle?.();
      onRefresh();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-[11px] text-text-tertiary hover:text-text-secondary hover:border-text-tertiary transition-colors cursor-pointer"
      title={active ? 'Click to refresh now' : 'Click to enable auto-refresh'}
    >
      {active ? (
        /* Pulsing green dot */
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      ) : (
        /* Static gray dot */
        <span className="inline-flex rounded-full h-2 w-2 bg-text-tertiary" />
      )}
      <span>
        {active
          ? (lastRefreshed ? `Updated ${timeAgo(lastRefreshed)}` : 'Auto-refresh active')
          : 'Auto-refresh off'}
      </span>
    </button>
  );
}
