'use client';

import type { ProjectInfo } from '@/lib/types';

interface ProjectSidebarProps {
  projects: ProjectInfo[];
  loading: boolean;
  selectedProject: ProjectInfo | null;
  onSelect: (project: ProjectInfo) => void;
}

export function ProjectSidebar({ projects, loading, selectedProject, onSelect }: ProjectSidebarProps) {
  const formatPath = (p: ProjectInfo) => {
    let displayPath = p.path;

    // Try to detect and replace home dir prefix (e.g., /Users/username → ~)
    const homeMatch = displayPath.match(/^\/(?:Users|home)\/[^/]+/);
    if (homeMatch) {
      displayPath = '~' + displayPath.slice(homeMatch[0].length);
    }

    const segments = displayPath.split('/').filter(Boolean);
    const projectName = segments[segments.length - 1] || p.name;
    const parentSegments = segments.slice(0, -1);

    // Truncate middle segments if path is long (keep first 2 and last 1 parent segments)
    let parentPath: string;
    if (parentSegments.length > 3) {
      const start = parentSegments.slice(0, 2);
      const end = parentSegments.slice(-1);
      parentPath = (parentSegments[0] === '~' ? '' : '/') + [...start, '...', ...end].join('/');
    } else {
      parentPath = (parentSegments[0] === '~' ? '' : '/') + parentSegments.join('/');
    }

    return { parentPath, projectName };
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
                  {(() => {
                    const { parentPath, projectName } = formatPath(project);
                    return (
                      <>
                        <div className="font-medium truncate">{projectName}</div>
                        <div className="truncate mt-0.5 text-text-tertiary">{parentPath}</div>
                      </>
                    );
                  })()}
                  <div className="flex gap-3 mt-1 text-text-tertiary">
                    <span>{project.sessionCount} {project.sessionCount === 1 ? 'session' : 'sessions'}</span>
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
