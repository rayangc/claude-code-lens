'use client';

import type { ParsedMessage } from '@/lib/types';
import { ToolCallBlock } from './ToolCallBlock';
import { ThinkingBlock } from './ThinkingBlock';
import { parseTeammateMessage, type TeammateMessage } from '@/lib/parser/teammate';

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

/** Render JSON protocol messages as compact status pills */
function ProtocolPill({ teammate }: { teammate: TeammateMessage }) {
  let emoji: string;
  let label: string;
  let detail: string | undefined;

  switch (teammate.jsonType) {
    case 'shutdown_request':
      emoji = '🔴';
      label = 'Shutdown requested';
      detail = (teammate.jsonData?.reason as string) || (teammate.jsonData?.content as string) || undefined;
      break;
    case 'shutdown_approved':
      emoji = '⏹';
      label = 'Shutdown approved';
      break;
    case 'idle':
      emoji = '💤';
      label = 'Idle';
      break;
    default:
      emoji = '📋';
      label = teammate.jsonType || 'protocol';
      break;
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-elevated text-[12px] text-text-secondary">
      <span>{emoji}</span>
      <span>{label}</span>
      {detail && <span className="text-text-tertiary">— {detail}</span>}
    </div>
  );
}

export function MessageContent({ messages, highlightedId, thinkingExpanded, toolOutputsExpanded }: MessageContentProps) {
  const displayed = messages.filter((msg) => hasVisibleContent(msg));

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 py-6">
      <div className="max-w-[800px] mx-auto space-y-4 break-anywhere">
        {displayed.map((msg) => {
          const isUser = msg.type === 'user';
          const text = getTextContent(msg);
          const isHighlighted = highlightedId === msg.uuid;

          // Parse teammate message for user messages
          const teammate = isUser && text ? parseTeammateMessage(text) : null;

          // Determine label and color
          let label: string;
          let labelColor: string;
          let labelIcon: string;
          if (teammate) {
            label = teammate.teammateId;
            labelColor = 'text-accent-blue';
            labelIcon = '\u2B24';
          } else if (isUser) {
            label = 'User';
            labelColor = 'text-accent-blue';
            labelIcon = '\u2B24';
          } else {
            label = 'Assistant';
            labelColor = 'text-accent-purple';
            labelIcon = '\u25C6';
          }

          // Determine displayed text content
          let displayText: string | null = null;
          if (teammate) {
            if (!teammate.isJson) {
              displayText = teammate.content;
            }
            // JSON protocol messages render as pills, no text block
          } else {
            displayText = text || null;
          }

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
                  className={`text-[11px] font-bold uppercase tracking-wider ${labelColor}`}
                >
                  {labelIcon} {label}
                </span>
                <span className="text-[10px] text-text-tertiary">{formatTime(msg.timestamp)}</span>
              </div>

              {/* Protocol pill for JSON teammate messages */}
              {teammate?.isJson && (
                <ProtocolPill teammate={teammate} />
              )}

              {/* Text content */}
              {displayText && (
                <div className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed mb-2 overflow-wrap-anywhere">
                  {displayText}
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
