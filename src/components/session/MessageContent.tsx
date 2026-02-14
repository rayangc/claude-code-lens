'use client';

import type { ParsedMessage } from '@/lib/types';
import { ToolCallBlock } from './ToolCallBlock';
import { ThinkingBlock } from './ThinkingBlock';

interface MessageContentProps {
  messages: ParsedMessage[];
  filter: 'all' | 'conv' | 'user';
  searchQuery: string;
}

function formatTime(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

function getTextContent(msg: ParsedMessage): string {
  return msg.content
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text!)
    .join('\n');
}

function matchesSearch(msg: ParsedMessage, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  for (const block of msg.content) {
    if (block.text?.toLowerCase().includes(q)) return true;
  }
  for (const tc of msg.toolCalls) {
    if (tc.name.toLowerCase().includes(q)) return true;
    if (JSON.stringify(tc.input).toLowerCase().includes(q)) return true;
    if (tc.output?.toLowerCase().includes(q)) return true;
  }
  if (msg.thinking?.toLowerCase().includes(q)) return true;
  return false;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent-cyan/30 text-accent-cyan rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function hasVisibleContent(msg: ParsedMessage): boolean {
  if (msg.type !== 'user') return true;
  // User messages with only tool_result blocks (no text) are system messages — hide them
  return msg.content.some((b) => b.type === 'text' && b.text);
}

export function MessageContent({ messages, filter, searchQuery }: MessageContentProps) {
  const filtered = messages.filter((msg) => {
    if (!hasVisibleContent(msg)) return false;
    if (filter === 'user') return msg.type === 'user';
    if (filter === 'conv') return true; // show all messages, but hide tool calls in render
    return true;
  });

  // When search is active, only show matching messages
  const displayed = searchQuery
    ? filtered.filter((msg) => matchesSearch(msg, searchQuery))
    : filtered;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      {searchQuery && (
        <div className="max-w-[800px] mx-auto mb-3 text-[12px] text-text-tertiary">
          {displayed.length} {displayed.length === 1 ? 'result' : 'results'} for &ldquo;{searchQuery}&rdquo;
        </div>
      )}
      <div className="max-w-[800px] mx-auto space-y-4">
        {displayed.map((msg) => {
          const isUser = msg.type === 'user';
          const text = getTextContent(msg);

          return (
            <div
              key={msg.uuid}
              id={`msg-${msg.uuid}`}
              className="rounded-lg p-4 transition-all duration-150"
              style={{
                background: isUser ? '#1a1a1a' : '#141414',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isUser ? 'text-accent-blue' : 'text-accent-purple'
                  }`}
                >
                  {isUser ? '⬤ User' : '◆ Assistant'}
                </span>
                <span className="text-[10px] text-text-tertiary">{formatTime(msg.timestamp)}</span>
              </div>

              {/* Text content */}
              {text && (
                <div className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed mb-2">
                  {searchQuery ? highlightText(text, searchQuery) : text}
                </div>
              )}

              {/* Thinking block */}
              {msg.thinking && <ThinkingBlock thinking={msg.thinking} />}

              {/* Tool calls (hidden in conv filter) */}
              {filter !== 'conv' &&
                msg.toolCalls.map((tc) => (
                  <ToolCallBlock key={tc.id} toolCall={tc} />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
