'use client';

import { useMemo } from 'react';
import type { ParsedMessage } from '@/lib/types';
import type { ToolCall } from '@/lib/types';
import { getProminent } from './ToolCallBlock';

interface MessageTreeProps {
  messages: ParsedMessage[];
  searchQuery: string;
  filter: 'all' | 'conv' | 'user';
  activeMessageId: string | null;
  onNavigate: (uuid: string) => void;
}

type TreeEntry = {
  type: 'user';
  message: ParsedMessage;
  preview: string;
} | {
  type: 'assistant';
  message: ParsedMessage;
  preview: string;
  toolCalls: { toolCall: ToolCall; preview: string }[];
}

function hasVisibleContent(msg: ParsedMessage): boolean {
  if (msg.type !== 'user') return true;
  return msg.content.some((b) => b.type === 'text' && b.text);
}

function getTextPreview(msg: ParsedMessage): string {
  for (const block of msg.content) {
    if (block.type === 'text' && block.text) {
      return block.text.slice(0, 60).replace(/\n/g, ' ');
    }
  }
  return '';
}

function getToolPreview(tc: ToolCall): string {
  const prominent = getProminent(tc);
  if (prominent) {
    const val = prominent.value.length > 40
      ? '...' + prominent.value.slice(-37)
      : prominent.value;
    return `${tc.name} — ${val}`;
  }
  return tc.name;
}

function buildEntries(messages: ParsedMessage[]): TreeEntry[] {
  const entries: TreeEntry[] = [];

  for (const msg of messages) {
    if (!hasVisibleContent(msg)) continue;

    if (msg.type === 'user') {
      entries.push({
        type: 'user',
        message: msg,
        preview: getTextPreview(msg) || '(empty)',
      });
    } else {
      // Assistant message — level 1 with tool calls as children
      const textPreview = getTextPreview(msg);
      const toolCalls = msg.toolCalls.map((tc) => ({
        toolCall: tc,
        preview: getToolPreview(tc),
      }));
      // Only add if there's text or tool calls
      if (textPreview || toolCalls.length > 0) {
        entries.push({
          type: 'assistant',
          message: msg,
          preview: textPreview || '(tool calls)',
          toolCalls,
        });
      }
    }
  }

  return entries;
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

function toolMatchesSearch(tc: ToolCall, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  if (tc.name.toLowerCase().includes(q)) return true;
  if (JSON.stringify(tc.input).toLowerCase().includes(q)) return true;
  if (tc.output?.toLowerCase().includes(q)) return true;
  return false;
}

export function MessageTree({ messages, searchQuery, filter, activeMessageId, onNavigate }: MessageTreeProps) {
  const entries = useMemo(() => buildEntries(messages), [messages]);

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {entries.map((entry) => {
        if (entry.type === 'user') {
          // Filter: hide user entries only in non-applicable filters (user is always shown)
          const isActive = activeMessageId === entry.message.uuid;
          const isMatch = searchQuery ? matchesSearch(entry.message, searchQuery) : false;

          if (searchQuery && !isMatch) return null;

          return (
            <button
              key={entry.message.uuid}
              onClick={() => onNavigate(entry.message.uuid)}
              className={`w-full text-left px-2 py-1 text-[11px] leading-tight rounded transition-colors duration-150
                hover:bg-elevated truncate block
                ${isActive ? 'bg-elevated' : ''}
                ${isMatch ? 'ring-1 ring-accent-cyan/50' : ''}
              `}
              style={{ paddingLeft: '8px' }}
              title={entry.preview}
            >
              <span className="text-accent-blue font-medium">{'● '}</span>
              <span className="text-accent-blue text-[10px] font-medium">user: </span>
              <span className={isMatch ? 'text-accent-cyan' : 'text-text-secondary'}>
                {entry.preview}
              </span>
            </button>
          );
        }

        // Assistant entry
        if (filter === 'user') return null;

        const isActive = activeMessageId === entry.message.uuid;
        const entryMatchesSearch = searchQuery ? matchesSearch(entry.message, searchQuery) : false;
        const anyToolMatches = searchQuery
          ? entry.toolCalls.some((tc) => toolMatchesSearch(tc.toolCall, searchQuery))
          : false;

        if (searchQuery && !entryMatchesSearch && !anyToolMatches) return null;

        // Determine which tool calls to show
        const showToolCalls = filter === 'all';
        const displayedToolCalls = showToolCalls
          ? (searchQuery
              ? entry.toolCalls.filter((tc) => entryMatchesSearch || toolMatchesSearch(tc.toolCall, searchQuery))
              : entry.toolCalls)
          : [];

        return (
          <div key={entry.message.uuid}>
            <button
              onClick={() => onNavigate(entry.message.uuid)}
              className={`w-full text-left px-2 py-1 text-[11px] leading-tight rounded transition-colors duration-150
                hover:bg-elevated truncate block
                ${isActive ? 'bg-elevated' : ''}
                ${entryMatchesSearch ? 'ring-1 ring-accent-cyan/50' : ''}
              `}
              style={{ paddingLeft: '8px' }}
              title={entry.preview}
            >
              <span className="text-accent-purple font-medium">{'◦ '}</span>
              <span className="text-accent-purple text-[10px] font-medium">assistant: </span>
              <span className={entryMatchesSearch ? 'text-accent-cyan' : 'text-text-secondary'}>
                {entry.preview}
              </span>
            </button>

            {displayedToolCalls.map((tc) => {
              const tcMatch = searchQuery ? toolMatchesSearch(tc.toolCall, searchQuery) : false;
              return (
                <button
                  key={`tc-${tc.toolCall.id}`}
                  onClick={() => onNavigate(entry.message.uuid)}
                  className={`w-full text-left px-2 py-0.5 text-[10px] text-text-tertiary leading-tight
                    hover:bg-elevated truncate block transition-colors duration-150
                    ${isActive ? 'bg-elevated' : ''}
                    ${tcMatch ? 'ring-1 ring-accent-cyan/50' : ''}
                  `}
                  style={{ paddingLeft: '24px' }}
                  title={tc.preview}
                >
                  <span className="opacity-60">{'⚙ '}</span>
                  <span className={tcMatch ? 'text-accent-cyan' : ''}>
                    {tc.preview}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
