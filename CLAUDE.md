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
| `GET /api/stats` | Global aggregate stats (session count, token usage) |

### Key Libraries/Files
| File | Purpose |
|------|---------|
| `src/lib/types.ts` | Shared TypeScript types (ProjectInfo, ParsedSession, ParsedMessage, etc.) |
| `src/lib/parser/jsonl.ts` | Parses JSONL files into structured sessions |
| `src/lib/indexer/scanner.ts` | Scans ~/.claude/projects/ dirs, reads sessions-index.json with JSONL fallback |
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

- **Each JSONL file = one session** (no `system init` events for session boundaries)
- **Directory encoding**: `/Users/you/project` → `-Users-you-project`
- **sessions-index.json** exists per project directory with session metadata; scanner falls back to direct JSONL scanning when missing
- **Event types to process**: `user`, `assistant`, `result`
- **Event types to skip**: `file-history-snapshot`, `summary`, `create`, `queue-operation`
- **Split assistant messages**: One assistant turn can span multiple sequential events sharing the same `message.id` — parser groups them
- **Content block types**: `text`, `tool_use` (id, name, input), `thinking` (thinking, signature), `tool_result` (tool_use_id, content, is_error)
- **Result events** contain: `cost_usd`, `duration_ms`, `num_turns`

### Real Event Structure
```
Top-level fields: type, sessionId, timestamp, uuid, parentUuid, isSidechain, cwd, gitBranch, version
message field: { role, content (array of blocks), usage }
```

## Design Reference

- **Primary inspiration**: Ben Tossell's Claude Code cookbook viewer (https://bensbites.com/claude-code-cookbook)
- **Study the cookbook site** with agent-browser before making UI changes — match its patterns
- **Theme**: Dark with terminal monospace typography
- **Full spec**: `docs/specs/claude-code-lens-v1.md`
- **Reference screenshots**: `screenshots/` dir has cookbook screenshots showing keyboard shortcuts, filters, nesting, and mobile behavior

### Key Cookbook UI Patterns (Implemented in V1.2)
- **Keyboard shortcuts bar** at top: "Ctrl+T toggle thinking · Ctrl+O toggle tool outputs · Esc Reset" — sticky, always visible
- **Left rail nesting**: Max 2 levels — user messages top-level, assistant text + tool names (with previews) flat beneath
- **Filters** apply to left rail only, not main content. Filter buttons: All, Conv, User. Plus search input filtering all content.
- **Message backgrounds**: User messages = `#1a1a1a`, tool calls = `rgba(74, 222, 128, 0.03)` (green tint), assistant/thinking = transparent
- **Mobile**: Hamburger menu (md breakpoint) to toggle sidebar on both dashboard and session views
- **Scroll-to highlight**: Clicking a tree entry scrolls to the message and briefly highlights it with a cyan ring

## Self-Testing Protocol

Always test your changes before reporting done:

1. `npm run dev` — fix any compilation errors
2. **API routes**: test with `curl http://localhost:3000/api/projects` (etc.)
3. **UI pages**: use `agent-browser` to visually verify
   - Dashboard: `http://localhost:3000`
   - Session detail: `http://localhost:3000/session/<real-session-id>`
4. `npm run build` — must pass clean before committing
5. Use `/frontend-design` skill for color/design judgement calls

### Finding session IDs for testing
- Browse `/api/projects` then `/api/sessions?project=<encodedPath>` to find real session IDs
- Use a session with tool calls + thinking blocks for the best test coverage

## Working Conventions

- **Tailwind config** (`tailwind.config.ts`) has custom colors and font stack — use the theme tokens, don't hardcode colors
- **No tests yet** — relies on manual testing via curl + agent-browser
- **Screenshots directory** is gitignored (may contain sensitive session data)
- **Git**: Commit and push changes as needed

## Current Status (V1.3)

### Completed (V1.0–V1.1)
- Dashboard with project sidebar + session list + date filters
- Session detail view with message tree, tool calls, thinking blocks
- Search within sessions (with match count)
- Empty user messages (tool_result-only) hidden
- Scanner fallback for projects without sessions-index.json
- Improved color contrast

### Completed (V1.2)
- Keyboard shortcuts: Ctrl+T (toggle thinking), Ctrl+O (toggle tool outputs), Esc (reset) with sticky hint bar
- Filters (All/Conv/User) affect left rail only — main content always shows all messages
- Left rail flattened to max 2 levels with tool call previews (e.g., "Read — src/lib/types.ts")
- Role-based message backgrounds: user (#1a1a1a), tool calls (green tint), assistant/thinking (transparent)
- Mobile hamburger menu (md breakpoint) for both dashboard and session sidebars
- Scroll-to-message highlighting (brief cyan ring on navigate)

### Completed (V1.3)
- Fixed mobile scrolling: `dvh` viewport units, `overscroll-behavior: none`, proper overflow containment
- Left rail hierarchy matches cookbook: user/assistant at same level with labels, tool calls nested under assistant
- Global stats API (`GET /api/stats`) aggregating session count + token usage across all projects
- Dashboard landing page shows hero stats (sessions, input tokens, output tokens) when no project selected

### Known Limitations
- Cost data often shows `<$0.01` (result events don't always include cost_usd)
- No file watcher — requires page refresh for new sessions
- No virtualized scrolling — very large sessions may be slow
- Stats API scans all JSONL files on each request (no caching) — may be slow with many sessions
- Team session hierarchy is V2 scope
