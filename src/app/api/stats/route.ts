import { access, readdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { NextResponse } from 'next/server';

const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects');

export async function GET() {
  let totalSessions = 0;
  let totalProjects = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    try { await access(CLAUDE_PROJECTS_DIR); } catch {
      return NextResponse.json({ totalSessions: 0, totalProjects: 0, totalInputTokens: 0, totalOutputTokens: 0 });
    }
    const projectDirs = await readdir(CLAUDE_PROJECTS_DIR, { withFileTypes: true });

    for (const dir of projectDirs) {
      if (!dir.isDirectory()) continue;

      const projectDir = join(CLAUDE_PROJECTS_DIR, dir.name);
      let files: string[];
      try {
        const entries = await readdir(projectDir);
        files = entries.filter(f => f.endsWith('.jsonl'));
      } catch {
        continue;
      }

      if (files.length === 0) continue;
      totalProjects++;
      totalSessions += files.length;

      // Read each JSONL file for token usage
      for (const file of files) {
        const filePath = join(projectDir, file);
        try {
          const stream = createReadStream(filePath, { encoding: 'utf-8' });
          const rl = createInterface({ input: stream, crlfDelay: Infinity });

          for await (const line of rl) {
            try {
              // Quick check before full parse for performance
              if (!line.includes('"usage"')) continue;
              const event = JSON.parse(line);
              const usage = event.message?.usage;
              if (usage) {
                if (typeof usage.input_tokens === 'number') {
                  totalInputTokens += usage.input_tokens;
                }
                if (typeof usage.output_tokens === 'number') {
                  totalOutputTokens += usage.output_tokens;
                }
              }
            } catch {
              // skip unparseable lines
            }
          }

          stream.destroy();
        } catch {
          // skip unreadable files
        }
      }
    }
  } catch (error) {
    console.error('Error computing stats:', error);
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 });
  }

  return NextResponse.json({
    totalSessions,
    totalProjects,
    totalInputTokens,
    totalOutputTokens,
  });
}
