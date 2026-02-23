'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { ParsedSession, ParsedMessage } from '@/lib/types';
import { SearchBar } from './SearchBar';
import { MessageTree } from './MessageTree';

export type FilterMode = 'all' | 'conv' | 'user';

interface SessionNavProps {
  session: ParsedSession;
  filter: FilterMode;
  onFilterChange: (filter: FilterMode) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  activeMessageId: string | null;
  onNavigate: (uuid: string) => void;
}
const filters: { key: FilterMode; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'conv', label: 'Conv' },
  { key: 'user', label: 'User' },
];

export function SessionNav({
  session,
  filter,
  onFilterChange,
  searchQuery,
  onSearch,
  activeMessageId,
  onNavigate,
}: SessionNavProps) {
  const { stats } = session;

  const searchMatchCount = useMemo(() => {
    if (!searchQuery) return 0;
    const q = searchQuery.toLowerCase();
    return session.messages.filter((msg: ParsedMessage) => {
      for (const block of msg.content) {
        if (block.text?.toLowerCase().includes(q)) return true;
      }
      for (const tc of msg.toolCalls) {
        if (tc.name.toLowerCase().includes(q)) return true;
        if (JSON.stringify(tc.input).toLowerCase().includes(q)) return true;
        if (tc.output?.toLowerCase().includes(q)) return true;
      }
      if (msg.thinking?.toLowerCase().includes(q)) return true;
      return false;
    }).length;
  }, [session.messages, searchQuery]);

  return (
    <div className="w-[300px] min-w-[300px] h-full flex flex-col bg-surface border-r border-border">
      {/* Back link */}
      <Link
        href="/"
        className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-text-secondary hover:text-accent-blue
          border-b border-border transition-colors duration-150"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Dashboard
      </Link>

      {/* Session metadata */}
      <div className="px-3 py-3 border-b border-border space-y-1.5">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div>
            <span className="text-text-tertiary">Model</span>
            <div className="text-text-secondary truncate">{stats?.model || session.model || '—'}</div>
          </div>
          <div>
            <span className="text-text-tertiary">Tools</span>
            <div className="text-text-secondary">{stats?.toolCallCount ?? '—'}</div>
          </div>
          <div>
            <span className="text-text-tertiary">Messages</span>
            <div className="text-text-secondary">{stats?.messageCount ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <SearchBar onSearch={onSearch} matchCount={searchMatchCount} />

      {/* Filter toggles */}
      <div className="flex gap-1 px-3 pb-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`px-2.5 py-1 text-[11px] rounded transition-colors duration-150
              ${filter === f.key
                ? 'bg-accent-purple/20 text-accent-purple'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-elevated'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Message tree */}
      <MessageTree
        messages={session.messages ?? []}
        searchQuery={searchQuery}
        filter={filter}
        activeMessageId={activeMessageId}
        onNavigate={onNavigate}
      />
    </div>
  );
}
