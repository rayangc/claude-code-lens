import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { ProjectInfo, SessionSummary } from '../types';

const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects');

interface SessionIndexEntry {
  sessionId: string;
  fullPath: string;
  fileMtime: number;
  firstPrompt: string;
  summary: string;
  messageCount: number;
  created: string;
  modified: string;
  gitBranch: string;
  projectPath: string;
  isSidechain: boolean;
}

interface SessionIndex {
  version: number;
  entries: SessionIndexEntry[];
}

function decodePath(encodedDir: string): string {
  // -Users-agent-foo → /Users/agent/foo
  return encodedDir.replace(/-/g, '/');
}

function getProjectName(decodedPath: string): string {
  const segments = decodedPath.split('/').filter(Boolean);
  return segments[segments.length - 1] || decodedPath;
}

async function readSessionIndex(projectDir: string): Promise<SessionIndex | null> {
  try {
    const indexPath = join(projectDir, 'sessions-index.json');
    const content = await readFile(indexPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function getProjects(): Promise<ProjectInfo[]> {
  const entries = await readdir(CLAUDE_PROJECTS_DIR, { withFileTypes: true });
  const projects: ProjectInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const encodedPath = entry.name;
    const projectDir = join(CLAUDE_PROJECTS_DIR, encodedPath);
    const index = await readSessionIndex(projectDir);

    // Use projectPath from index entries if available (more accurate than decoding)
    const realPath = index?.entries?.[0]?.projectPath || decodePath(encodedPath);

    const sessionCount = index?.entries?.length ?? 0;
    let totalCost = 0;
    let lastActivity = '';

    if (index?.entries) {
      for (const session of index.entries) {
        if (session.modified && (!lastActivity || session.modified > lastActivity)) {
          lastActivity = session.modified;
        }
      }
    }

    projects.push({
      name: getProjectName(realPath),
      path: realPath,
      encodedPath,
      sessionCount,
      totalCost,
      lastActivity,
    });
  }

  // Sort by last activity descending
  projects.sort((a, b) => (b.lastActivity || '').localeCompare(a.lastActivity || ''));
  return projects;
}

export async function getSessions(encodedPath: string): Promise<SessionSummary[]> {
  const projectDir = join(CLAUDE_PROJECTS_DIR, encodedPath);
  const index = await readSessionIndex(projectDir);
  if (!index?.entries) return [];

  const sessions: SessionSummary[] = index.entries.map((entry) => ({
    sessionId: entry.sessionId,
    firstPrompt: entry.firstPrompt || '',
    summary: entry.summary || '',
    messageCount: entry.messageCount || 0,
    created: entry.created || '',
    modified: entry.modified || '',
    gitBranch: entry.gitBranch || '',
    projectPath: entry.projectPath || '',
    isSidechain: entry.isSidechain ?? false,
  }));

  // Sort by modified date descending
  sessions.sort((a, b) => (b.modified || '').localeCompare(a.modified || ''));
  return sessions;
}

export async function findSessionFile(sessionId: string): Promise<string | null> {
  const entries = await readdir(CLAUDE_PROJECTS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const projectDir = join(CLAUDE_PROJECTS_DIR, entry.name);
    const jsonlPath = join(projectDir, `${sessionId}.jsonl`);
    try {
      await stat(jsonlPath);
      return jsonlPath;
    } catch {
      // not found in this project, continue
    }
  }
  return null;
}
