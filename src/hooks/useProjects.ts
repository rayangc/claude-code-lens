'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProjectInfo } from '@/lib/types';

export function useProjects() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

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

  const selectProject = useCallback((project: ProjectInfo) => {
    setSelectedProject(project);
  }, []);

  return { projects, loading, error, selectedProject, selectProject };
}
