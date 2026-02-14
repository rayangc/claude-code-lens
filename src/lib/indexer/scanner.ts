import { readdir, readFile, stat, open } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
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

async function readFirstLines(filePath: string, count: number): Promise<string[]> {
  const lines: string[] = [];
  const stream = createReadStream(filePath, { encoding: 'utf-8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    lines.push(line);
    if (lines.length >= count) break;
  }
  stream.destroy();
  return lines;
}

async function readLastLines(filePath: string, count: number): Promise<string[]> {
  const fh = await open(filePath, 'r');
  try {
    const fileStat = await fh.stat();
    const size = fileStat.size;
    // Read last 8KB — enough for ~10 JSONL lines
    const chunkSize = Math.min(size, 8192);
    const buffer = Buffer.alloc(chunkSize);
    await fh.read(buffer, 0, chunkSize, size - chunkSize);
    const text = buffer.toString('utf-8');
    const lines = text.split('\n').filter(Boolean);
    return lines.slice(-count);
  } finally {
    await fh.close();
  }
}

async function scanJsonlFiles(projectDir: string): Promise<SessionSummary[]> {
  let files: string[];
  try {
    const entries = await readdir(projectDir);
    files = entries.filter((f) => f.endsWith('.jsonl'));
  } catch {
    return [];
  }
  if (files.length === 0) return [];

  const sessions: SessionSummary[] = [];

  for (const file of files) {
    const sessionId = file.replace('.jsonl', '');
    const filePath = join(projectDir, file);

    try {
      const fileStat = await stat(filePath);
      // Rough message count estimate: ~500 bytes per line average
      const approxMessageCount = Math.max(1, Math.round(fileStat.size / 500));

      let firstPrompt = '';
      let created = '';
      let modified = '';
      let gitBranch = '';
      let projectPath = '';

      // Read first lines for created timestamp and first user message
      const firstLines = await readFirstLines(filePath, 10);
      for (const line of firstLines) {
        try {
          const event = JSON.parse(line);
          if (!created && event.timestamp) {
            created = event.timestamp;
          }
          if (event.gitBranch && !gitBranch) {
            gitBranch = event.gitBranch;
          }
          if (!firstPrompt && event.type === 'user' && event.message?.content) {
            const content = event.message.content;
            if (typeof content === 'string') {
              firstPrompt = content.slice(0, 200);
            } else if (Array.isArray(content)) {
              const textBlock = content.find((b: { type: string }) => b.type === 'text');
              if (textBlock?.text) {
                firstPrompt = textBlock.text.slice(0, 200);
              }
            }
          }
        } catch {
          // skip unparseable lines
        }
      }

      // Read last lines for modified timestamp
      const lastLines = await readLastLines(filePath, 10);
      for (let i = lastLines.length - 1; i >= 0; i--) {
        try {
          const event = JSON.parse(lastLines[i]);
          if (event.timestamp) {
            modified = event.timestamp;
            break;
          }
        } catch {
          // skip
        }
      }

      if (!modified) modified = fileStat.mtime.toISOString();
      if (!created) created = fileStat.birthtime.toISOString();

      sessions.push({
        sessionId,
        firstPrompt,
        summary: '',
        messageCount: approxMessageCount,
        created,
        modified,
        gitBranch,
        projectPath,
        isSidechain: false,
      });
    } catch {
      // skip files we can't read
    }
  }

  return sessions;
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

    let sessionCount = index?.entries?.length ?? 0;
    let totalCost = 0;
    let lastActivity = '';

    if (index?.entries && index.entries.length > 0) {
      for (const session of index.entries) {
        if (session.modified && (!lastActivity || session.modified > lastActivity)) {
          lastActivity = session.modified;
        }
      }
    } else {
      // Fallback: count JSONL files directly
      const fallbackSessions = await scanJsonlFiles(projectDir);
      sessionCount = fallbackSessions.length;
      for (const session of fallbackSessions) {
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

  let sessions: SessionSummary[];

  if (index?.entries && index.entries.length > 0) {
    sessions = index.entries.map((entry) => ({
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
  } else {
    // Fallback: scan JSONL files directly
    sessions = await scanJsonlFiles(projectDir);
  }

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
