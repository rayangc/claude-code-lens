import { ParsedSession, ProjectInfo, SessionSummary } from '../types';

export interface SessionAdapter {
  name: string;
  getProjects(): Promise<ProjectInfo[]>;
  getSessions(encodedPath: string): Promise<SessionSummary[]>;
  getSession(sessionId: string): Promise<ParsedSession | null>;
}
