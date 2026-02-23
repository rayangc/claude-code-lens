'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProjectInfo } from '@/lib/types';
import { usePolling } from './usePolling';

export function useProjects() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);
  const selectedProjectRef = useRef<ProjectInfo | null>(null);

  // Keep ref in sync for use in refetch
  selectedProjectRef.current = selectedProject;

  // Silent refetch — never sets loading=true
  const refetch = useCallback(async () => {
    const res = await fetch('/api/projects');
    if (!res.ok) return;
    const data: ProjectInfo[] = await res.json();
    setProjects(data);

    // Keep selectedProject's data (e.g., session count) up to date
    const current = selectedProjectRef.current;
    if (current) {
      const updated = data.find(p => p.encodedPath === current.encodedPath);
      if (updated) {
        setSelectedProject(updated);
      }
    }
  }, []);

  // Initial fetch (with loading state)
  useEffect(() => {
    fetch('/api/projects')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
      })
      .then((data: ProjectInfo[]) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const { lastRefreshed, refresh } = usePolling({
    fetchFn: refetch,
    intervalMs: 30_000,
    enabled: true,
  });

  const selectProject = useCallback((project: ProjectInfo) => {
    setSelectedProject(project);
  }, []);

  return { projects, loading, error, selectedProject, selectProject, lastRefreshed, refresh };
}
