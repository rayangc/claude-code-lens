'use client';

import { useState } from 'react';
import { CopyButton } from '@/components/ui/CopyButton';
import type { ToolCall } from '@/lib/types';

interface ToolCallBlockProps {
  toolCall: ToolCall;
}

function getProminent(toolCall: ToolCall): { label: string; value: string } | null {
  const { name, input } = toolCall;
  if (name === 'Bash' && typeof input.command === 'string') {
    return { label: '$', value: input.command };
  }
  if (['Read', 'Write', 'Edit'].includes(name) && typeof input.file_path === 'string') {
    return { label: 'file', value: input.file_path };
  }
  if (name === 'Glob' && typeof input.pattern === 'string') {
    return { label: 'pattern', value: input.pattern };
  }
  if (name === 'Grep' && typeof input.pattern === 'string') {
    return { label: 'grep', value: input.pattern };
  }
  return null;
}

export function ToolCallBlock({ toolCall }: ToolCallBlockProps) {
  const [outputExpanded, setOutputExpanded] = useState(false);
  const prominent = getProminent(toolCall);
  const outputLines = toolCall.output?.split('\n') ?? [];
  const isLongOutput = outputLines.length > 5;
  const inputJson = JSON.stringify(toolCall.input, null, 2);

  return (
    <div
      className={`my-2 rounded border ${toolCall.isError ? 'border-red-500/40' : 'border-[#2a2a4a]'}`}
      style={{ background: '#1e1e38' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a4a]">
        <span className={`w-1.5 h-1.5 rounded-full ${toolCall.isError ? 'bg-red-400' : 'bg-green-400'}`} />
        <span className="text-[12px] font-bold text-text-secondary">{toolCall.name}</span>
        {toolCall.isError && <span className="text-[10px] text-red-400 uppercase tracking-wider">error</span>}
      </div>

      {/* Prominent field */}
      {prominent && (
        <div className="px-3 py-1.5 border-b border-[#2a2a4a] flex items-center gap-2">
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider">{prominent.label}</span>
          <code className="text-[12px] text-accent-cyan break-all">{prominent.value}</code>
          <CopyButton text={prominent.value} />
        </div>
      )}

      {/* Input JSON (collapsible for non-prominent tools) */}
      {!prominent && (
        <div className="px-3 py-2 border-b border-[#2a2a4a]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">input</span>
            <CopyButton text={inputJson} />
          </div>
          <pre className="text-[11px] text-text-secondary overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
            {inputJson}
          </pre>
        </div>
      )}

      {/* Output */}
      {toolCall.output && (
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">output</span>
            <CopyButton text={toolCall.output} />
          </div>
          <pre
            className={`text-[11px] text-text-secondary overflow-x-auto whitespace-pre-wrap leading-relaxed ${
              !outputExpanded && isLongOutput ? 'max-h-[100px] overflow-hidden' : 'max-h-[400px] overflow-y-auto'
            }`}
          >
            {toolCall.output}
          </pre>
          {isLongOutput && (
            <button
              onClick={() => setOutputExpanded(!outputExpanded)}
              className="mt-1 text-[11px] text-accent-blue hover:text-accent-cyan transition-colors duration-150"
            >
              {outputExpanded ? '▲ Show less' : `▼ Show more (${outputLines.length} lines)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
