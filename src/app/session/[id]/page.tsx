'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { SessionNav, type FilterMode } from '@/components/session/SessionNav';
import { MessageContent } from '@/components/session/MessageContent';

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { session, loading, error } = useSession(sessionId);

  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Keyboard shortcut state
  const [thinkingExpanded, setThinkingExpanded] = useState<boolean | null>(null);
  const [toolOutputsExpanded, setToolOutputsExpanded] = useState<boolean | null>(null);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = useCallback((uuid: string) => {
    setActiveMessageId(uuid);
    setHighlightedId(uuid);
    const el = document.getElementById(`msg-${uuid}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Auto-clear highlight after 1 second
    setTimeout(() => setHighlightedId(null), 1000);
  }, []);

  const handleNavigateAndClose = useCallback((uuid: string) => {
    handleNavigate(uuid);
    setSidebarOpen(false);
  }, [handleNavigate]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setThinkingExpanded((prev) => (prev === null ? true : !prev));
      } else if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setToolOutputsExpanded((prev) => (prev === null ? true : !prev));
      } else if (e.key === 'Escape') {
        setThinkingExpanded(null);
        setToolOutputsExpanded(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle deep-linking via hash
  useEffect(() => {
    if (!session) return;
    const hash = window.location.hash;
    if (hash.startsWith('#msg-')) {
      const uuid = hash.replace('#msg-', '');
      setTimeout(() => handleNavigate(uuid), 100);
    }
  }, [session, handleNavigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-text-secondary">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px]">Loading session...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="text-red-400 text-[14px] mb-2">Failed to load session</div>
          <div className="text-text-tertiary text-[12px]">{error || 'Session not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded bg-surface border border-border text-text-secondary hover:text-text-primary"
        aria-label="Open sidebar"
      >
        <span className="text-lg leading-none">&#9776;</span>
      </button>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* Sidebar: slide-in on mobile, always visible on desktop */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:relative md:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <SessionNav
          session={session}
          filter={filter}
          onFilterChange={setFilter}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          activeMessageId={activeMessageId}
          onNavigate={handleNavigateAndClose}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky keyboard shortcuts hint bar */}
        <div className="sticky top-0 z-10 flex items-center justify-center gap-4 px-4 py-1.5 text-[11px] text-text-tertiary bg-surface border-b border-border">
          <span><kbd className="px-1 py-0.5 rounded bg-elevated text-text-secondary text-[10px]">Ctrl+T</kbd> toggle thinking</span>
          <span className="text-border">·</span>
          <span><kbd className="px-1 py-0.5 rounded bg-elevated text-text-secondary text-[10px]">Ctrl+O</kbd> toggle tool outputs</span>
          <span className="text-border">·</span>
          <span><kbd className="px-1 py-0.5 rounded bg-elevated text-text-secondary text-[10px]">Esc</kbd> Reset</span>
        </div>
        <MessageContent
          messages={session.messages}
          highlightedId={highlightedId}
          thinkingExpanded={thinkingExpanded}
          toolOutputsExpanded={toolOutputsExpanded}
        />
      </div>
    </div>
  );
}
