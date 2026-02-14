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

interface UserGroup {
  userMessage: ParsedMessage;
  children: ChildEntry[];
}

type ChildEntry = {
  type: 'assistant-text';
  message: ParsedMessage;
  preview: string;
} | {
  type: 'tool-call';
  message: ParsedMessage;
  toolCall: ToolCall;
  preview: string;
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
    // Shorten file paths to just the filename
    const val = prominent.value.length > 40
      ? '...' + prominent.value.slice(-37)
      : prominent.value;
    return `${tc.name} — ${val}`;
  }
  return tc.name;
}

function buildGroups(messages: ParsedMessage[]): UserGroup[] {
  const groups: UserGroup[] = [];
  let currentGroup: UserGroup | null = null;

  for (const msg of messages) {
    if (!hasVisibleContent(msg)) continue;

    if (msg.type === 'user') {
      // Start a new group
      currentGroup = { userMessage: msg, children: [] };
      groups.push(currentGroup);
    } else if (currentGroup) {
      // Assistant message — add text preview if it has text
      const textPreview = getTextPreview(msg);
      if (textPreview) {
        currentGroup.children.push({
          type: 'assistant-text',
          message: msg,
          preview: textPreview,
        });
      }
      // Add each tool call as a separate entry
      for (const tc of msg.toolCalls) {
        currentGroup.children.push({
          type: 'tool-call',
          message: msg,
          toolCall: tc,
          preview: getToolPreview(tc),
        });
      }
    }
  }

  return groups;
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
  const groups = useMemo(() => buildGroups(messages), [messages]);

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {groups.map((group) => {
        const userMsg = group.userMessage;
        const userPreview = getTextPreview(userMsg) || '(empty)';
        const isUserActive = activeMessageId === userMsg.uuid;
        const userMatchesSearchQuery = searchQuery ? matchesSearch(userMsg, searchQuery) : false;

        // In search mode, check if user or any child matches
        const anyChildMatches = searchQuery
          ? group.children.some((child) => {
              if (child.type === 'assistant-text') return matchesSearch(child.message, searchQuery);
              if (child.type === 'tool-call') return toolMatchesSearch(child.toolCall, searchQuery);
              return false;
            })
          : false;

        // If search is active and neither user nor children match, skip this group
        if (searchQuery && !userMatchesSearchQuery && !anyChildMatches) return null;

        // Filter children based on filter mode
        const filteredChildren = filter === 'user'
          ? [] // user filter: no children
          : filter === 'conv'
            ? group.children.filter((c) => c.type === 'assistant-text') // conv: text only, no tools
            : group.children; // all: everything

        // Further filter by search if active
        const displayedChildren = searchQuery
          ? filteredChildren.filter((child) => {
              if (child.type === 'assistant-text') return matchesSearch(child.message, searchQuery);
              if (child.type === 'tool-call') return toolMatchesSearch(child.toolCall, searchQuery);
              return false;
            })
          : filteredChildren;

        return (
          <div key={userMsg.uuid}>
            {/* Level 1: User message */}
            <button
              onClick={() => onNavigate(userMsg.uuid)}
              className={`w-full text-left px-2 py-1 text-[11px] leading-tight rounded transition-colors duration-150
                hover:bg-elevated truncate block
                ${isUserActive ? 'bg-elevated' : ''}
                ${userMatchesSearchQuery ? 'ring-1 ring-accent-cyan/50' : ''}
              `}
              style={{ paddingLeft: '8px' }}
              title={userPreview}
            >
              <span className="text-accent-blue font-medium">{'● '}</span>
              <span className={userMatchesSearchQuery ? 'text-accent-cyan' : 'text-text-secondary'}>
                {userPreview}
              </span>
            </button>

            {/* Level 2: Flat list of assistant text + tool calls */}
            {displayedChildren.map((child, idx) => {
              const isActive = activeMessageId === child.message.uuid;
              const childKey = child.type === 'tool-call'
                ? `tc-${child.toolCall.id}`
                : `at-${child.message.uuid}-${idx}`;

              const isMatch = searchQuery
                ? (child.type === 'assistant-text'
                    ? matchesSearch(child.message, searchQuery)
                    : toolMatchesSearch(child.toolCall, searchQuery))
                : false;

              if (child.type === 'assistant-text') {
                return (
                  <button
                    key={childKey}
                    onClick={() => onNavigate(child.message.uuid)}
                    className={`w-full text-left px-2 py-0.5 text-[11px] leading-tight rounded transition-colors duration-150
                      hover:bg-elevated truncate block
                      ${isActive ? 'bg-elevated' : ''}
                      ${isMatch ? 'ring-1 ring-accent-cyan/50' : ''}
                    `}
                    style={{ paddingLeft: '20px' }}
                    title={child.preview}
                  >
                    <span className="text-accent-purple font-medium">{'◦ '}</span>
                    <span className={isMatch ? 'text-accent-cyan' : 'text-text-secondary'}>
                      {child.preview}
                    </span>
                  </button>
                );
              }

              // Tool call entry
              return (
                <button
                  key={childKey}
                  onClick={() => onNavigate(child.message.uuid)}
                  className={`w-full text-left px-2 py-0.5 text-[10px] text-text-tertiary leading-tight
                    hover:bg-elevated truncate block transition-colors duration-150
                    ${isActive ? 'bg-elevated' : ''}
                    ${isMatch ? 'ring-1 ring-accent-cyan/50' : ''}
                  `}
                  style={{ paddingLeft: '20px' }}
                  title={child.preview}
                >
                  <span className="opacity-60">{'⚙ '}</span>
                  <span className={isMatch ? 'text-accent-cyan' : ''}>
                    {child.preview}
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
