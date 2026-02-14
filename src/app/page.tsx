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

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <ProjectSidebar
        projects={projects}
        loading={loading}
        selectedProject={selectedProject}
        onSelect={selectProject}
      />

      <main className="flex-1 overflow-y-auto">
        {selectedProject ? (
          <div className="p-6 max-w-4xl">
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
