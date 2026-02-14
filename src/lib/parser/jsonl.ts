import { ParsedSession, ParsedMessage, ContentBlock, ToolCall, SessionStats } from '../types';
import { readFile } from 'fs/promises';

const SKIP_TYPES = new Set(['file-history-snapshot', 'summary', 'create', 'queue-operation']);

interface RawEvent {
  type: string;
  subtype?: string;
  sessionId?: string;
  timestamp?: string;
  uuid?: string;
  parentUuid?: string | null;
  isSidechain?: boolean;
  cwd?: string;
  gitBranch?: string;
  version?: string;
  message?: {
    id?: string;
    role?: string;
    model?: string;
    content?: RawContentBlock[] | string;
  };
  cost_usd?: number;
  duration_ms?: number;
  num_turns?: number;
}

interface RawContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string | Array<{ type: string; text?: string }>;
  is_error?: boolean;
}

export async function parseJsonlFile(filePath: string): Promise<ParsedSession> {
  const content = await readFile(filePath, 'utf-8');
  // Extract session ID from filename: /path/to/abc-123.jsonl → abc-123
  const fileName = filePath.split('/').pop() || filePath;
  const sessionId = fileName.replace(/\.jsonl$/, '');
  return parseJsonlContent(content, sessionId);
}

export function parseJsonlContent(content: string, sessionId: string): ParsedSession {
  const lines = content.split('\n');
  const events: RawEvent[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      // skip invalid JSON lines
    }
  }

  return buildSession(events, sessionId);
}

function buildSession(events: RawEvent[], sessionId: string): ParsedSession {
  const messages: ParsedMessage[] = [];
  const toolCallMap = new Map<string, ToolCall>();
  // Track assistant messages by message.id to group split events
  const assistantMessageMap = new Map<string, ParsedMessage>();
  const stats: SessionStats = { duration: 0, cost: 0, toolCallCount: 0, messageCount: 0 };
  let model: string | undefined;
  let projectPath = '';
  let startTime = '';
  let endTime = '';

  for (const event of events) {
    if (SKIP_TYPES.has(event.type)) continue;

    // Track timestamps
    if (event.timestamp) {
      if (!startTime) startTime = event.timestamp;
      endTime = event.timestamp;
    }

    // Extract project path from cwd
    if (event.cwd && !projectPath) {
      projectPath = event.cwd;
    }

    switch (event.type) {
      case 'user':
        processUserEvent(event, messages, toolCallMap);
        break;
      case 'assistant':
        processAssistantEvent(event, messages, toolCallMap, assistantMessageMap);
        if (event.message?.model) model = event.message.model;
        break;
      case 'result':
        processResultEvent(event, stats);
        break;
      case 'system':
        // system init events - extract model if present
        if (event.subtype === 'init' && event.message?.model) {
          model = event.message.model;
        }
        break;
    }
  }

  stats.messageCount = messages.length;
  stats.toolCallCount = Array.from(toolCallMap.values()).length;
  stats.model = model;

  return {
    id: sessionId,
    projectPath,
    startTime,
    endTime,
    model,
    messages,
    stats,
  };
}

function processUserEvent(
  event: RawEvent,
  messages: ParsedMessage[],
  toolCallMap: Map<string, ToolCall>,
) {
  const contentBlocks: ContentBlock[] = [];
  const rawContent = event.message?.content;

  if (typeof rawContent === 'string') {
    contentBlocks.push({ type: 'text', text: rawContent });
  } else if (Array.isArray(rawContent)) {
    for (const block of rawContent) {
      if (block.type === 'text' && block.text) {
        contentBlocks.push({ type: 'text', text: block.text });
      } else if (block.type === 'tool_result') {
        // Extract output text from tool_result content
        let output: string | undefined;
        if (typeof block.content === 'string') {
          output = block.content;
        } else if (Array.isArray(block.content)) {
          output = block.content
            .filter((c) => c.type === 'text' && c.text)
            .map((c) => c.text)
            .join('\n');
        }

        contentBlocks.push({
          type: 'tool_result',
          toolResultId: block.tool_use_id,
          output,
          isError: block.is_error === true,
        });

        // Correlate with tool call
        if (block.tool_use_id) {
          const toolCall = toolCallMap.get(block.tool_use_id);
          if (toolCall) {
            toolCall.output = output;
            toolCall.isError = block.is_error === true;
          }
        }
      }
    }
  }

  messages.push({
    id: event.message?.id || event.uuid || '',
    uuid: event.uuid || '',
    parentUuid: event.parentUuid ?? null,
    type: 'user',
    timestamp: event.timestamp || '',
    content: contentBlocks,
    toolCalls: [],
    isSidechain: event.isSidechain ?? false,
  });
}

function processAssistantEvent(
  event: RawEvent,
  messages: ParsedMessage[],
  toolCallMap: Map<string, ToolCall>,
  assistantMessageMap: Map<string, ParsedMessage>,
) {
  const messageId = event.message?.id || '';
  const rawContent = event.message?.content;
  if (!Array.isArray(rawContent)) return;

  // Check if we already have a message with this message.id (split assistant messages)
  const existing = messageId ? assistantMessageMap.get(messageId) : undefined;

  const newContentBlocks: ContentBlock[] = [];
  const newToolCalls: ToolCall[] = [];
  let thinking: string | undefined;

  for (const block of rawContent) {
    switch (block.type) {
      case 'text':
        if (block.text) {
          newContentBlocks.push({ type: 'text', text: block.text });
        }
        break;
      case 'thinking':
        if (block.thinking) {
          thinking = block.thinking;
          newContentBlocks.push({ type: 'thinking', thinking: block.thinking });
        }
        break;
      case 'tool_use': {
        const toolCall: ToolCall = {
          id: block.id || '',
          name: block.name || '',
          input: (block.input as Record<string, unknown>) || {},
          isError: false,
          timestamp: event.timestamp,
        };
        newToolCalls.push(toolCall);
        toolCallMap.set(toolCall.id, toolCall);
        newContentBlocks.push({
          type: 'tool_use',
          toolUseId: block.id,
          toolName: block.name,
          input: block.input as Record<string, unknown>,
        });
        break;
      }
    }
  }

  if (existing) {
    // Merge into existing message (grouped split assistant events)
    existing.content.push(...newContentBlocks);
    existing.toolCalls.push(...newToolCalls);
    if (thinking) existing.thinking = thinking;
  } else {
    const msg: ParsedMessage = {
      id: messageId,
      uuid: event.uuid || '',
      parentUuid: event.parentUuid ?? null,
      type: 'assistant',
      timestamp: event.timestamp || '',
      content: newContentBlocks,
      toolCalls: newToolCalls,
      thinking,
      isSidechain: event.isSidechain ?? false,
    };
    messages.push(msg);
    if (messageId) {
      assistantMessageMap.set(messageId, msg);
    }
  }
}

function processResultEvent(event: RawEvent, stats: SessionStats) {
  if (event.cost_usd !== undefined) stats.cost += event.cost_usd;
  if (event.duration_ms !== undefined) stats.duration += event.duration_ms;
}
