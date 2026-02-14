'use client';

import { useMemo, useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useSessions } from '@/hooks/useSessions';
import { ProjectSidebar } from '@/components/dashboard/ProjectSidebar';
import { SessionList } from '@/components/dashboard/SessionList';
import { FilterToggle, type DateRange } from '@/components/ui/FilterToggle';

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

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
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
              <h1 className="text-xl font-medium text-text-primary mb-2">Claude Code Lens</h1>
              <p className="text-sm text-text-tertiary">Select a project to view sessions</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
