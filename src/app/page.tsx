'use client';

import { useEffect, useMemo, useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useSessions } from '@/hooks/useSessions';
import { ProjectSidebar } from '@/components/dashboard/ProjectSidebar';
import { SessionList } from '@/components/dashboard/SessionList';
import { FilterToggle, type DateRange } from '@/components/ui/FilterToggle';

interface Stats {
  totalSessions: number;
  totalProjects: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function filterByDate<T extends { created: string }>(sessions: T[], range: DateRange): T[] {
  if (range === 'all') return sessions;

  const now = Date.now();
  const cutoffs: Record<Exclude<DateRange, 'all'>, number> = {
    today: 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };

  const cutoff = now - cutoffs[range];
  return sessions.filter(s => new Date(s.created).getTime() >= cutoff);
}

export default function Home() {
  const { projects, loading, selectedProject, selectProject } = useProjects();
  const { sessions, loading: sessionsLoading, error: sessionsError } = useSessions(
    selectedProject?.encodedPath ?? null
  );
  const [dateRange, setDateRange] = useState<DateRange>('all');

  const filteredSessions = useMemo(
    () => filterByDate(sessions, dateRange),
    [sessions, dateRange]
  );

  const projectDisplayName = selectedProject
    ? selectedProject.path.split('/').filter(Boolean).pop() || selectedProject.name
    : null;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-dvh bg-background text-foreground overflow-hidden">
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
        <ProjectSidebar
          projects={projects}
          loading={loading}
          selectedProject={selectedProject}
          onSelect={(project) => {
            selectProject(project);
            setSidebarOpen(false);
          }}
        />
      </div>

      <main className="flex-1 overflow-y-auto">
        {selectedProject ? (
          <div className="p-6 pt-14 md:pt-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-lg font-medium text-text-primary">{projectDisplayName}</h1>
              <FilterToggle onChange={setDateRange} />
            </div>

            <SessionList
              sessions={filteredSessions}
              loading={sessionsLoading}
              error={sessionsError}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-xl font-medium text-text-primary mb-8">Claude Code Lens</h1>

              {/* Hero stats */}
              {stats ? (
                <div className="flex gap-6 justify-center mb-8">
                  <div className="bg-surface rounded-lg border border-border px-6 py-4 min-w-[140px]">
                    <div className="text-2xl font-bold text-accent-purple">{formatNumber(stats.totalSessions)}</div>
                    <div className="text-[11px] text-text-tertiary mt-1">sessions</div>
                  </div>
                  <div className="bg-surface rounded-lg border border-border px-6 py-4 min-w-[140px]">
                    <div className="text-2xl font-bold text-accent-blue">{formatNumber(stats.totalInputTokens)}</div>
                    <div className="text-[11px] text-text-tertiary mt-1">input tokens</div>
                  </div>
                  <div className="bg-surface rounded-lg border border-border px-6 py-4 min-w-[140px]">
                    <div className="text-2xl font-bold text-accent-cyan">{formatNumber(stats.totalOutputTokens)}</div>
                    <div className="text-[11px] text-text-tertiary mt-1">output tokens</div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-6 justify-center mb-8">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-surface rounded-lg border border-border px-6 py-4 min-w-[140px] animate-pulse">
                      <div className="h-8 bg-border rounded w-16 mx-auto" />
                      <div className="h-3 bg-border rounded w-12 mx-auto mt-2" />
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-text-tertiary">Select a project to explore</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
