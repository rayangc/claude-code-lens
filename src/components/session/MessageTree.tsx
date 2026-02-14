'use client';

import { useMemo } from 'react';
import type { ParsedMessage } from '@/lib/types';

interface MessageTreeProps {
  messages: ParsedMessage[];
  searchQuery: string;
  activeMessageId: string | null;
  onNavigate: (uuid: string) => void;
}

interface TreeNode {
  message: ParsedMessage;
  children: TreeNode[];
}

function buildTree(messages: ParsedMessage[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Create nodes
  for (const msg of messages) {
    nodeMap.set(msg.uuid, { message: msg, children: [] });
  }

  // Build hierarchy
  for (const msg of messages) {
    const node = nodeMap.get(msg.uuid)!;
    if (msg.parentUuid && nodeMap.has(msg.parentUuid)) {
      nodeMap.get(msg.parentUuid)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function getMessagePreview(msg: ParsedMessage): string {
  for (const block of msg.content) {
    if (block.type === 'text' && block.text) {
      return block.text.slice(0, 60).replace(/\n/g, ' ');
    }
  }
  if (msg.toolCalls.length > 0) {
    return `[${msg.toolCalls.map(t => t.name).join(', ')}]`;
  }
  return '(empty)';
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

function TreeEntry({
  node,
  depth,
  searchQuery,
  activeMessageId,
  onNavigate,
}: {
  node: TreeNode;
  depth: number;
  searchQuery: string;
  activeMessageId: string | null;
  onNavigate: (uuid: string) => void;
}) {
  const msg = node.message;
  const isUser = msg.type === 'user';
  const isActive = activeMessageId === msg.uuid;
  const isMatch = searchQuery ? matchesSearch(msg, searchQuery) : false;

  const colorClass = isUser
    ? 'text-accent-blue'
    : 'text-accent-purple';

  return (
    <>
      <button
        onClick={() => onNavigate(msg.uuid)}
        className={`w-full text-left px-2 py-1 text-[11px] leading-tight rounded transition-colors duration-150
          hover:bg-elevated truncate block
          ${isActive ? 'bg-elevated' : ''}
          ${isMatch ? 'ring-1 ring-accent-cyan/50' : ''}
        `}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        title={getMessagePreview(msg)}
      >
        <span className={`${colorClass} font-medium`}>
          {isUser ? '● ' : '◦ '}
        </span>
        <span className={isMatch ? 'text-accent-cyan' : 'text-text-secondary'}>
          {getMessagePreview(msg)}
        </span>
      </button>

      {/* Tool calls under assistant messages */}
      {!isUser && msg.toolCalls.length > 0 && msg.toolCalls.map((tc) => (
        <button
          key={tc.id}
          onClick={() => onNavigate(msg.uuid)}
          className="w-full text-left px-2 py-0.5 text-[10px] text-text-tertiary leading-tight
            hover:bg-elevated truncate block transition-colors duration-150"
          style={{ paddingLeft: `${8 + (depth + 1) * 12}px` }}
        >
          <span className="opacity-60">⚙ </span>
          {tc.name}
        </button>
      ))}

      {node.children.map((child) => (
        <TreeEntry
          key={child.message.uuid}
          node={child}
          depth={depth + 1}
          searchQuery={searchQuery}
          activeMessageId={activeMessageId}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}

export function MessageTree({ messages, searchQuery, activeMessageId, onNavigate }: MessageTreeProps) {
  const tree = useMemo(() => buildTree(messages), [messages]);

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {tree.map((node) => (
        <TreeEntry
          key={node.message.uuid}
          node={node}
          depth={0}
          searchQuery={searchQuery}
          activeMessageId={activeMessageId}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
