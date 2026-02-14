export interface ProjectInfo {
  name: string;
  path: string;
  encodedPath: string;
  sessionCount: number;
  totalCost: number;
  lastActivity: string;
}

export interface SessionSummary {
  sessionId: string;
  firstPrompt: string;
  summary: string;
  messageCount: number;
  created: string;
  modified: string;
  gitBranch: string;
  projectPath: string;
  isSidechain: boolean;
  duration?: number;
  cost?: number;
  toolCallCount?: number;
}

export interface ParsedSession {
  id: string;
  projectPath: string;
  startTime: string;
  endTime?: string;
  model?: string;
  messages: ParsedMessage[];
  stats: SessionStats;
}

export interface ParsedMessage {
  id: string;
  uuid: string;
  parentUuid: string | null;
  type: 'user' | 'assistant';
  timestamp: string;
  content: ContentBlock[];
  toolCalls: ToolCall[];
  thinking?: string;
  isSidechain: boolean;
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking';
  text?: string;
  thinking?: string;
  toolUseId?: string;
  toolName?: string;
  input?: Record<string, unknown>;
  toolResultId?: string;
  output?: string;
  isError?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  isError: boolean;
  timestamp?: string;
}

export interface SessionStats {
  duration: number;
  cost: number;
  toolCallCount: number;
  messageCount: number;
  model?: string;
}
