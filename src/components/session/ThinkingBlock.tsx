'use client';

import { useState } from 'react';

interface ThinkingBlockProps {
  thinking: string;
}

export function ThinkingBlock({ thinking }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-2 rounded border border-[#2a2a4a]" style={{ background: '#1e1e30' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[#808098] hover:text-text-secondary transition-colors duration-150"
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
        <div className="px-3 pb-3 text-[12px] text-[#808098] italic whitespace-pre-wrap leading-relaxed">
          {thinking}
        </div>
      )}
    </div>
  );
}
