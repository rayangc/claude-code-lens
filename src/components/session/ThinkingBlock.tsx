'use client';

import { useState } from 'react';

interface ThinkingBlockProps {
  thinking: string;
  forceExpanded?: boolean | null;
}

export function ThinkingBlock({ thinking, forceExpanded = null }: ThinkingBlockProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const [prevForce, setPrevForce] = useState<boolean | null>(null);

  // Sync local state when force mode changes (adjust-state-during-render pattern)
  if (forceExpanded !== prevForce) {
    setPrevForce(forceExpanded);
    if (forceExpanded !== null) {
      setLocalExpanded(forceExpanded);
    }
  }

  const expanded = forceExpanded !== null ? forceExpanded : localExpanded;
  const canToggle = forceExpanded === null;

  return (
    <div className="my-2 rounded border border-border" style={{ background: 'transparent' }}>
      <button
        onClick={() => canToggle && setLocalExpanded(!localExpanded)}
        className={`flex items-center gap-2 w-full px-3 py-2 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors duration-150 ${!canToggle ? 'cursor-default' : ''}`}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="italic">Thinking...</span>
        {!expanded && (
          <span className="ml-2 truncate opacity-50" style={{ maxWidth: '400px' }}>
            {thinking.slice(0, 80)}...
          </span>
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-3 text-[12px] text-text-tertiary italic whitespace-pre-wrap leading-relaxed">
          {thinking}
        </div>
      )}
    </div>
  );
}
