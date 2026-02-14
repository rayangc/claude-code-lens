'use client';

import type { ProjectInfo } from '@/lib/types';
import { formatCost } from '@/lib/utils';

interface ProjectSidebarProps {
  projects: ProjectInfo[];
  loading: boolean;
  selectedProject: ProjectInfo | null;
  onSelect: (project: ProjectInfo) => void;
}

export function ProjectSidebar({ projects, loading, selectedProject, onSelect }: ProjectSidebarProps) {
  const projectName = (p: ProjectInfo) => {
    const segments = p.path.split('/').filter(Boolean);
    return segments[segments.length - 1] || p.name;
  };

  return (
    <aside className="w-[280px] min-w-[280px] h-full bg-surface border-r border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">Projects</h2>
      </div>

      {loading ? (
        <div className="p-4 text-text-tertiary text-xs">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="p-4 text-text-tertiary text-xs">No projects found</div>
      ) : (
        <ul>
          {projects.map(project => {
            const isActive = selectedProject?.encodedPath === project.encodedPath;
            return (
              <li key={project.encodedPath}>
                <button
                  onClick={() => onSelect(project)}
                  className={`w-full text-left px-4 py-3 text-xs transition-all duration-150 cursor-pointer border-l-2 ${
                    isActive
                      ? 'border-l-accent-purple bg-accent-purple/10 text-text-primary'
                      : 'border-l-transparent hover:bg-elevated/50 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div className="font-medium truncate">{projectName(project)}</div>
                  <div className="flex gap-3 mt-1 text-text-tertiary">
                    <span>{project.sessionCount} sessions</span>
                    <span>{formatCost(project.totalCost)}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
