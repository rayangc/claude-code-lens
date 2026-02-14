# Claude Code Lens

A local Next.js app that reads Claude Code session JSONL files from `~/.claude/projects/` and displays them in a two-panel dark-themed UI. Think of it as a debugger/viewer for Claude Code activity.

## Quick Start

```bash
npm run dev              # Start dev server on port 3000
npm run build            # Production build (verify before committing)
npx next dev -H 0.0.0.0 # Bind to all interfaces (for remote access)
```

## Tech Stack

- **Next.js 16** (App Router) + React + TypeScript
- **Tailwind CSS** for styling (dark theme)
- No database — reads JSONL files directly from disk

## Architecture

### Data Flow
```
~/.claude/projects/ (JSONL files + sessions-index.json)
    → Scanner (src/lib/indexer/scanner.ts)
    → Parser (src/lib/parser/jsonl.ts)
    → API Routes (src/app/api/)
    → React Components (src/components/)
```

### API Routes
| Route | Purpose |
|-------|---------|
| `GET /api/projects` | List all projects with session counts |
| `GET /api/sessions?project=<encodedPath>` | Sessions for a project |
| `GET /api/session/[id]` | Full parsed session with messages + tool calls |

### Key Libraries/Files
| File | Purpose |
|------|---------|
| `src/lib/types.ts` | Shared TypeScript types (ProjectInfo, ParsedSession, ParsedMessage, etc.) |
| `src/lib/parser/jsonl.ts` | Parses JSONL files into structured sessions |
| `src/lib/indexer/scanner.ts` | Scans ~/.claude/projects/ directories, reads sessions-index.json |
| `src/lib/adapters/types.ts` | Pluggable adapter interface for future data sources |

## Project Structure

```
src/
├── app/                          # Next.js App Router pages + API
│   ├── page.tsx                  # Dashboard (project list + session list)
│   ├── session/[id]/page.tsx     # Session detail view
│   ├── api/projects/route.ts
│   ├── api/sessions/route.ts
│   └── api/session/[id]/route.ts
├── components/
│   ├── dashboard/                # Dashboard view components
│   │   ├── ProjectSidebar.tsx    # Left panel: project list
│   │   ├── SessionList.tsx       # Right panel: session cards
│   │   └── SessionCard.tsx       # Individual session card
│   ├── session/                  # Session detail view components
│   │   ├── SessionNav.tsx        # Left sidebar: metadata, search, filters, tree
│   │   ├── MessageTree.tsx       # Hierarchical message navigation
│   │   ├── MessageContent.tsx    # Main content: rendered messages
│   │   ├── ToolCallBlock.tsx     # Tool call display (name, input, output)
│   │   ├── ThinkingBlock.tsx     # Collapsible thinking blocks
│   │   └── SearchBar.tsx         # Search within session
│   └── ui/                       # Shared UI components
│       ├── FilterToggle.tsx      # Date range + message type filters
│       └── CopyButton.tsx        # Click-to-copy for code blocks
├── hooks/                        # React hooks for data fetching
│   ├── useProjects.ts
│   ├── useSessions.ts
│   └── useSession.ts
└── lib/                          # Backend logic
    ├── types.ts
    ├── parser/jsonl.ts
    ├── indexer/scanner.ts
    └── adapters/types.ts
```

## JSONL Data Format

Critical details for anyone working on the parser or API:

- **Each JSONL file = one session** (no `system init` events for session boundaries)
- **Directory encoding**: `/Users/agent/foo` → `-Users-agent-foo`
- **sessions-index.json** exists per project directory with session metadata (use this for the dashboard to avoid parsing every JSONL)
- **Event types to process**: `user`, `assistant`, `result`
- **Event types to skip**: `file-history-snapshot`, `summary`, `create`, `queue-operation`
- **Split assistant messages**: One assistant turn can span multiple sequential JSONL events sharing the same `message.id` — the parser must group them
- **Content block types**: `text`, `tool_use` (id, name, input), `thinking` (thinking, signature), `tool_result` (tool_use_id, content, is_error)
- **Result events** contain: `cost_usd`, `duration_ms`, `num_turns`

### Real Event Structure
```
Top-level fields: type, sessionId, timestamp, uuid, parentUuid, isSidechain, cwd, gitBranch, version
message field: { role, content (array of blocks), usage }
```

## Design Reference

- **Inspiration**: Ben Tossell's Claude Code cookbook viewer (https://bensbites.com/claude-code-cookbook)
- **Theme**: Dark with terminal monospace typography
- **Full spec**: `specs/claude-code-lens-v1.md`

## Self-Testing Protocol

Always test your changes before reporting done:

1. `npm run dev` — fix any compilation errors
2. **API routes**: test with `curl http://localhost:3000/api/projects` (etc.)
3. **UI pages**: use `agent-browser` to visually verify
   - Dashboard: `http://localhost:3000`
   - Session detail: `http://localhost:3000/session/<real-session-id>`
4. `npm run build` — must pass clean before committing

### Real session IDs for testing
- `00774cdb-7e95-40dc-9f70-addc77147b99` (lamb-v2 project, has tool calls)
- Browse `/api/projects` then `/api/sessions?project=<encodedPath>` to find more

## Working Conventions

- **Don't modify files outside your assigned scope** when working in a team
- **Tailwind config** (`tailwind.config.ts`) has custom colors and font stack — use the theme tokens, don't hardcode colors
- **No tests yet** — V1 relies on manual testing via curl + agent-browser
- **Screenshots directory** is gitignored (may contain sensitive session data)

## V1 Known Limitations

- Cost data shows `<$0.01` when `result` events don't include `cost_usd`
- No file watcher yet — requires page refresh to see new sessions
- No virtualized scrolling — very large sessions may be slow
- Team session hierarchy is V2 scope
