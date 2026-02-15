# Claude Code Lens

## Vision

A local tool for seeing what Claude Code and Claude Agent SDK agents are actually doing on my machine — the thinking, tool calls, messages, and session data — rendered in a beautiful, scannable UI.

## Why

I want to get fundamentally better at using Claude Code and the Claude Agent SDK. Not by patching surface-level issues when the agent does something wrong, but by understanding what's happening under the hood — how the agent reasons, what tools it reaches for, where it gets stuck, what patterns lead to good vs bad outcomes.

Right now that information exists in raw JSONL logs that are painful to read. Lens turns those logs into something I can actually browse, search, and learn from. The goal is to build deep intuition for how these agents work so I can steer them better — better prompts, better CLAUDE.md instructions, better architecture decisions.

## Inspiration

- **[Ben Tossell's Cookbook Session Viewer](https://cookbook.bensbites.com/cookbook/reverse-engineering-features/session/#msg-0)** — the UI/UX gold standard. Dark theme, monospace terminal feel, two-panel layout with sidebar navigation and message content. This is the look and feel we're going for.
- **[Ralph Loop UI](https://github.com/bentossell/ralph-loop-ui)** — related to the cookbook, lightweight task dashboard approach.
- **[Claude Code Hooks Multi-Agent Observability](https://github.com/disler/claude-code-hooks-multi-agent-observability)** — hook-based event capture with timeline views. Borrow the data approach for future real-time monitoring and team observability.

## Prior Art

Built a similar tool previously at `~/dev-shared/playground/sideline` — a single-file HTML viewer for Ralph loop logs. It works but is too basic, ugly, hard to navigate, and limited by the single-file architecture. Lens is the proper version.

## Detailed Spec

See [specs/claude-code-lens-v1.md](specs/claude-code-lens-v1.md) for the full V1 spec including architecture, data model, views, and scope.
