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

  const handleNavigate = useCallback((uuid: string) => {
    setActiveMessageId(uuid);
    const el = document.getElementById(`msg-${uuid}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
      <SessionNav
        session={session}
        filter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        activeMessageId={activeMessageId}
        onNavigate={handleNavigate}
      />
      <MessageContent
        messages={session.messages}
        filter={filter}
        searchQuery={searchQuery}
      />
    </div>
  );
}
