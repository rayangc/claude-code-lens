# Claude Code Lens — V1 Spec

## Overview

A local web app for visualizing Claude Code sessions — see what your agents are doing, browse conversation history, inspect tool calls, and track costs. Think of it as a beautiful, navigable debugger for your Claude Code activity.

**Inspiration**: Ben Tossell's cookbook session viewer (layout, typography, terminal feel) + the multi-agent observability repo (data architecture) + Sideline (parsing logic).

---

## Core Concepts

- **Project**: A directory where Claude Code has been used. Maps to `~/.claude/projects/<encoded-path>/`
- **Session**: A single Claude Code conversation within a project. Stored as JSONL files.
- **Message**: A user prompt, assistant response, or tool call within a session.
- **Team Session** (future): A lead agent + teammates working together. V1 shows individual sessions only; team hierarchy is V2.

---

## Architecture

### Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Next.js + React (App Router) | Learning opportunity, proper component architecture |
| Backend | Next.js API routes | No separate server needed. Reads JSONL files directly from disk |
| Data source | `~/.claude/projects/` JSONL files | Direct file access, no hooks or DB required for V1 |
| Indexing | File watcher + incremental scan | Initial scan on launch, `chokidar` or `fs.watch` for new/changed files |
| Parser | Adapted from Sideline | Sideline's JSONL parser as reference, ported to TypeScript modules |
| Styling | Tailwind CSS + CSS custom properties | Fast to build, easy theming |
| Deployment | `npm run dev` / `npm start` on localhost | Simple local dev server |

### Data Flow

```
~/.claude/projects/        Next.js API Routes        React Frontend
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  JSONL files     │─────▶│  Parser/Indexer   │─────▶│  Dashboard       │
│  (sessions)      │      │  (watch + parse)  │      │  Session Viewer  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

### Parser Design — Pluggable Adapters

Design the parser as an interface so we can add new data sources later without refactoring:

```typescript
interface SessionAdapter {
  name: string;
  canParse(filePath: string): boolean;
  parseSession(filePath: string): ParsedSession;
  watchPaths(): string[];
}

// V1: Claude Code CLI adapter
// Future: Agent SDK adapter, hooks-based real-time adapter
```

---

## Views

### 1. Dashboard (Home)

The landing page. Shows all projects with their sessions and key metrics.

**Layout**: Two-panel — project sidebar (left) + session list with activity (right)

```
┌──────────────────────┬──────────────────────────────────────────────────────┐
│                      │                                                      │
│  PROJECTS            │  [Selected Project Name]                             │
│  ────────────────    │                                                      │
│                      │  Recent Sessions                    Total: $X.XX     │
│  ▼ project-name      │  ┌─────────────────────────────────────────────────┐ │
│    N sessions today  │  │ ● time  "session prompt preview"               │ │
│    $X.XX total       │  │   Duration | Cost | Tool calls | Team badge    │ │
│                      │  ├─────────────────────────────────────────────────┤ │
│  ▶ another-project   │  │ ✓ time  "session prompt preview"               │ │
│    N sessions        │  │   Duration | Cost | Tool calls                 │ │
│    $X.XX             │  └─────────────────────────────────────────────────┘ │
│                      │                                                      │
│  FILTERS             │  ┌─ Activity ─────────────────────────────────────┐ │
│  ────────────────    │  │  [mini sparkline / bar chart of activity]      │ │
│  Date: [Today ▼]     │  └───────────────────────────────────────────────-┘ │
└──────────────────────┴──────────────────────────────────────────────────────┘
```

**Project Sidebar**:
- Auto-discovered from `~/.claude/projects/`
- Shows decoded project path as name
- Session count and total cost per project
- Collapsible, click to select

**Session List** (right panel):
- Sessions for selected project, sorted by recency
- Each card shows: timestamp, first user prompt (truncated), duration, cost, tool call count
- Team sessions get a badge (e.g., "lead + 2 teammates")
- Active/completed status indicator
- Click to drill into session detail view

**Activity Chart** (optional, lower right):
- Small sparkline or bar chart showing session activity over the selected time period
- Nice-to-have, not critical for MVP

**Filters**:
- Date range selector (Today, Last 7 days, Last 30 days, All)

---

### 2. Session Detail View

The main viewer. Drill into a single session to see the full conversation with tool calls.

**Layout**: Two-panel — sidebar navigation (left) + message content (right). Modeled on the cookbook UI.

```
┌──────────────────────┬──────────────────────────────────────────────────────┐
│                      │                                                      │
│  ← Back to Dashboard │  👤 User                              timestamp     │
│                      │  [full user message]                                 │
│  Session Metadata    │                                                      │
│  Duration: 12m       │  ─────────────────────────────────────────────────── │
│  Cost: $1.85         │                                                      │
│  Tools: 34 calls     │  🤖 Assistant                                        │
│                      │  [assistant text response]                           │
│  Search: [________]  │                                                      │
│                      │  Thinking... (click to expand)                       │
│  [All] [Conv] [User] │                                                      │
│                      │  ┌─ ToolName ────────────────────────────────────┐  │
│  Message Tree:       │  │  { "param": "value", ... }                    │  │
│  👤 User msg         │  │                                                │  │
│  🤖 Assistant        │  │  [output / result]                            │  │
│    ├─ Read file.ts   │  │  ... (click to expand)                        │  │
│    ├─ Grep "query"   │  └───────────────────────────────────────────────┘  │
│    ├─ Write comp.tsx │                                                      │
│    └─ Bash: npm run  │  ┌─ Write ───────────────────────────────────────┐  │
│  👤 User msg         │  │  "file_path": "src/Component.tsx"              │  │
│  🤖 Assistant        │  │  ... (click to expand)                        │  │
│    └─ Task: subagent │  └───────────────────────────────────────────────┘  │
│       ├─ Read...     │                                                      │
│       └─ Write...    │                                                      │
│                      │                                                      │
└──────────────────────┴──────────────────────────────────────────────────────┘
```

**Sidebar Navigation**:
- **Back link**: Return to dashboard
- **Session metadata**: Duration, cost, model, tool call count
- **Search**: Full-text search across messages, tool inputs, tool outputs, thinking blocks. Highlights matches and scrolls to first result.
- **Filters** (toggle buttons):
  - **All**: User messages + assistant responses + tool calls (default)
  - **Conv**: User + assistant messages only (no tool call noise)
  - **User**: User messages only (review your own prompts)
- **Message tree**: Hierarchical navigation
  - User messages as top-level entries
  - Assistant responses with nested tool calls
  - Subagent/Task calls show nested children (indented)
  - Click any entry to scroll main content to that message
  - Color-coded by role (user = one color, assistant = another, tools = muted)

**Main Content Area**:
- Vertical message flow, centered content (max-width ~800px)
- **User messages**: Distinct background, full message displayed
- **Assistant messages**: Text response + thinking block (collapsed by default, expand inline) + tool calls
- **Tool calls**: Rendered as styled code blocks showing:
  - Tool name as header
  - Input parameters (JSON, syntax highlighted)
  - Output/result (collapsible if long)
  - Success/error status indicator
  - For file reads/writes: show file path prominently
  - For Bash: show command prominently
- **Timestamps**: Shown per message, relative or absolute toggle
- **Copy**: Click-to-copy on code blocks and tool outputs

---

## Design Language

### Theme: Dark + Cool

- **Background**: Dark charcoal (`#1a1a2e` or similar)
- **Surface**: Slightly lighter (`#222240`)
- **Accents**: Blue/purple range (primary interactions, links, active states)
- **Text hierarchy**:
  - Primary: Near-white (`#e8e8f0`)
  - Secondary: Muted (`#a0a0b8`)
  - Tertiary: Dimmed (`#606078`)
- **Success/Error**: Standard green/red with muted tones to fit the dark theme

### Typography — Terminal Feel (from cookbook)

- **Font family**: Monospace stack — `"Berkeley Mono", "JetBrains Mono", "Fira Code", "SF Mono", ui-monospace, monospace`
- **Base size**: 13-14px for body content
- **Line height**: 1.6 for readability
- **Sidebar text**: 12px, tighter line height
- **Message content**: Generous padding, clear visual separation between messages
- **Code blocks**: Same monospace, slightly darker background for tool call blocks

### Interactions

- Hover states with smooth transitions (150ms)
- Expandable sections with subtle animation
- Sticky sidebar on scroll
- Deep-linking to specific messages via URL hash (e.g., `/session/abc#msg-5`)

---

## JSONL Parser

### Reference: Sideline Parser

Port Sideline's parsing logic from vanilla JS to TypeScript modules. Key event types to handle:

| Event Type | Contains |
|-----------|----------|
| `system` (init) | Session start, model info, project path |
| `assistant` | Text response, thinking blocks, tool_use blocks |
| `user` | User messages (human turns) |
| `result` | Tool call results (matched by tool_use ID) |

### Session Boundary Detection

- New `system init` event = new session
- Sessions may span multiple files or be in a single file

### Data Model

```typescript
interface ParsedSession {
  id: string;
  projectPath: string;
  startTime: Date;
  endTime?: Date;
  model: string;
  messages: ParsedMessage[];
  stats: SessionStats;
}

interface ParsedMessage {
  id: string;
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result';
  timestamp: Date;
  content: string;
  thinking?: string;
  toolCalls?: ToolCall[];
  parentToolUseId?: string; // for subagent nesting
}

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: 'success' | 'error';
  duration?: number;
  children?: ToolCall[]; // nested subagent calls
}

interface SessionStats {
  duration: number; // ms
  cost: number; // USD
  toolCallCount: number;
  messageCount: number;
  model: string;
  isTeamSession: boolean;
  teammateCount?: number;
}
```

---

## File Discovery & Indexing

### Startup Scan

1. Scan `~/.claude/projects/` for all subdirectories
2. Decode directory names to project paths (they're encoded)
3. Find JSONL session files in each project directory
4. Parse session metadata (without full message parsing) for the dashboard
5. Build an in-memory index of projects → sessions

### File Watcher

- Use `chokidar` (or Node `fs.watch`) on `~/.claude/projects/`
- Watch for new/modified JSONL files
- Incrementally update the index
- Notify the frontend via polling or simple refresh (SSE/WebSocket is a future enhancement)

### Lazy Loading

- Dashboard only needs session metadata (first user message, timestamps, cost)
- Full message parsing happens on-demand when user drills into a session
- Avoids parsing massive files until needed

---

## MVP Scope (V1)

### In Scope
- [x] Project discovery from `~/.claude/projects/`
- [x] Dashboard with project list + session list + metadata
- [x] Session detail view with full message/tool call rendering
- [x] Sidebar navigation tree with message hierarchy
- [x] Search within a session
- [x] Filters: All / Conversation / User
- [x] Thinking blocks (collapsed, expand inline)
- [x] Tool call rendering with syntax-highlighted JSON
- [x] File watcher for incremental updates
- [x] Dark + cool theme with terminal monospace typography
- [x] Deep-linking to messages
- [x] Pluggable adapter interface (only Claude Code adapter implemented)

### Out of Scope (V2+)
- [ ] Team hierarchy visualization (tree view of lead + teammates)
- [ ] Agent-to-agent message viewing
- [ ] Task list state visualization
- [ ] Real-time streaming (hooks-based capture)
- [ ] Agent SDK adapter
- [ ] Light theme
- [ ] Activity timeline chart on dashboard
- [ ] Export/sharing functionality
- [ ] Keyboard navigation / vim bindings
- [ ] Cost breakdown per tool / per turn

---

## Project Structure

```
claude-code-lens/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Dashboard
│   │   ├── session/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Session detail view
│   │   ├── api/
│   │   │   ├── projects/
│   │   │   │   └── route.ts    # GET projects list
│   │   │   ├── sessions/
│   │   │   │   └── route.ts    # GET sessions for a project
│   │   │   └── session/
│   │   │       └── [id]/
│   │   │           └── route.ts # GET full session data
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── ProjectSidebar.tsx
│   │   │   ├── SessionList.tsx
│   │   │   └── SessionCard.tsx
│   │   ├── session/
│   │   │   ├── SessionNav.tsx
│   │   │   ├── MessageTree.tsx
│   │   │   ├── MessageContent.tsx
│   │   │   ├── ToolCallBlock.tsx
│   │   │   ├── ThinkingBlock.tsx
│   │   │   └── SearchBar.tsx
│   │   └── ui/
│   │       ├── FilterToggle.tsx
│   │       └── CopyButton.tsx
│   ├── lib/
│   │   ├── adapters/
│   │   │   ├── types.ts         # SessionAdapter interface
│   │   │   └── claude-code.ts   # Claude Code JSONL adapter
│   │   ├── parser/
│   │   │   ├── jsonl.ts         # JSONL line parser
│   │   │   └── session.ts       # Session builder from events
│   │   ├── indexer/
│   │   │   ├── scanner.ts       # Initial project/session scan
│   │   │   └── watcher.ts       # File watcher for updates
│   │   └── types.ts             # Shared types (ParsedSession, etc.)
│   └── hooks/
│       ├── useProjects.ts
│       ├── useSessions.ts
│       └── useSession.ts
├── public/
├── specs/
│   └── claude-code-lens-v1.md   # This file
├── master-plan.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## Open Questions

1. **Session file format**: Need to reverse-engineer the exact JSONL schema from real files and Sideline's parser. The Sideline parser handles event routing, session boundary detection, and tool call correlation — we'll port this logic.
2. **Cost calculation**: How does Sideline calculate cost? Is it from token counts in the JSONL, or estimated? Need to verify.
3. **Large sessions**: Some sessions could have thousands of tool calls. Need to consider virtualized scrolling for the message list if performance is an issue.
4. **Team session detection**: How to identify that a session is part of a team? Look for `Task` tool calls with `team_name` parameter? Need to verify from real data.
