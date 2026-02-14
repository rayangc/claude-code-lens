'use client';

import type { ParsedMessage } from '@/lib/types';
import { ToolCallBlock } from './ToolCallBlock';
import { ThinkingBlock } from './ThinkingBlock';

interface MessageContentProps {
  messages: ParsedMessage[];
  highlightedId?: string | null;
  thinkingExpanded?: boolean | null;
  toolOutputsExpanded?: boolean | null;
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

function hasVisibleContent(msg: ParsedMessage): boolean {
  if (msg.type !== 'user') return true;
  // User messages with only tool_result blocks (no text) are system messages — hide them
  return msg.content.some((b) => b.type === 'text' && b.text);
}

export function MessageContent({ messages, highlightedId, thinkingExpanded, toolOutputsExpanded }: MessageContentProps) {
  const displayed = messages.filter((msg) => hasVisibleContent(msg));

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-[800px] mx-auto space-y-4">
        {displayed.map((msg) => {
          const isUser = msg.type === 'user';
          const text = getTextContent(msg);
          const isHighlighted = highlightedId === msg.uuid;

          return (
            <div
              key={msg.uuid}
              id={`msg-${msg.uuid}`}
              className={`rounded-lg p-4 transition-all duration-300 ${isHighlighted ? 'ring-2 ring-accent-cyan/50' : ''}`}
              style={{
                background: isUser ? '#1a1a1a' : 'transparent',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isUser ? 'text-accent-blue' : 'text-accent-purple'
                  }`}
                >
                  {isUser ? '\u2B24 User' : '\u25C6 Assistant'}
                </span>
                <span className="text-[10px] text-text-tertiary">{formatTime(msg.timestamp)}</span>
              </div>

              {/* Text content */}
              {text && (
                <div className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed mb-2">
                  {text}
                </div>
              )}

              {/* Thinking block */}
              {msg.thinking && <ThinkingBlock thinking={msg.thinking} forceExpanded={thinkingExpanded} />}

              {/* Tool calls */}
              {msg.toolCalls.map((tc) => (
                <ToolCallBlock key={tc.id} toolCall={tc} forceOutputExpanded={toolOutputsExpanded} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
