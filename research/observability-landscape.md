# Agent Observability & Visualization Landscape

> Research date: 2026-02-14 | Focus: Claude Code observability, agent session viewers, AI agent monitoring

---

## 1. Claude Code Session Viewers / Log Inspectors

These tools read Claude Code's native JSONL conversation logs from `~/.claude/projects/<project>/<session-id>.jsonl` and render them in a human-friendly UI.

### Key Projects

| Project | Language | Interface | Key Features |
|---------|----------|-----------|--------------|
| [claudeye](https://www.npmjs.com/package/claudeye) | Node.js (npm) | Local web dashboard | Stats bar (turns, tokens, tool calls, duration), color-coded entries, expandable tool call I/O, nested subagent logs, light/dark mode |
| [cc-log-viewer](https://crates.io/crates/cc-log-viewer) | Rust | Web UI (localhost) | Project browser, session navigator, specialized tool renderers with icons/color coding, bookmarkable URLs, searchable |
| [claude-JSONL-browser](https://github.com/withLinda/claude-JSONL-browser) | Web | Browser-based | Converts JSONL to readable Markdown, built-in file explorer for multiple logs |
| [claude-code-log](https://github.com/daaain/claude-code-log) | Python (PyPI) | CLI -> HTML | Converts transcripts to readable HTML, CLI tool |
| [clog (HillviewCap)](https://github.com/HillviewCap/clog) | Web | Web viewer | Real-time monitoring, status indicators, cross-platform |
| [claude-session-viewer](https://github.com/jtklinger/claude-session-viewer) | - | Markdown output | Parses conversation history into readable markdown |
| [claude-code-viewer](https://github.com/d-kimuson/claude-code-viewer) | TypeScript (npm) | Full web client | Start/resume conversations, real-time task monitoring, audio alerts, schema-validated progressive disclosure UI |
| [claude-code-history-viewer](https://github.com/jhlee0409/claude-code-history-viewer) | Desktop app | Desktop | Analytics, session boards, real-time monitoring |
| [claude-conversation-extractor](https://github.com/ZeroSumQuant/claude-conversation-extractor) | Python | CLI | Extract clean logs, search through conversations, backup sessions |

### Notable Patterns
- **Every viewer reads the same JSONL source** — there's no standard "viewer API" from Anthropic, everyone parses the raw files
- **Progressive disclosure is common** — collapse tool calls by default, expand on click
- **Color coding by message type** (user/assistant/tool/system) is universal
- **Real-time tailing** of active sessions is a differentiator (claudeye, clog, claude-code-viewer)
- **Stats/analytics** (token counts, costs, duration) appear in the more mature tools

### Gaps We Could Fill
- No viewer deeply understands **multi-agent / team sessions** (subagent swim lanes, team coordination)
- **Tool call visualization** is mostly flat lists — no timeline/waterfall views
- **Thinking/reasoning blocks** are generally shown as plain text, not highlighted or collapsible
- **Cross-session search** and comparison is weak across all tools
- **No visual diff** for file edits made by agents

---

## 2. Claude Code Observability via Hooks

Claude Code's [hooks system](https://code.claude.com/docs/en/hooks) provides lifecycle events that enable observability. Hook events include: `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Notification`, `Stop`, `SubagentStop`, `SubagentStart`, `PreCompact`, `SessionStart`, `SessionEnd`, `PermissionRequest`, `PostToolUseFailure`.

### Key Projects

| Project | Approach | Key Features |
|---------|----------|--------------|
| [claude-code-hooks-multi-agent-observability (disler)](https://github.com/disler/claude-code-hooks-multi-agent-observability) | Hook event capture + web dashboard | Real-time multi-agent monitoring, session tracking, event filtering, agent swim lanes, concurrent agent support. 100s of GitHub stars |
| [claude-langfuse-monitor](https://github.com/michaeloboyle/claude-langfuse-monitor) | Hooks -> Langfuse | Zero-instrumentation automatic tracking, "set up once, track forever" |
| [claude-code-langfuse-template (doneyli)](https://github.com/doneyli/claude-code-langfuse-template) | Self-hosted Langfuse + hooks | Full self-hosted observability stack, session replay |
| [claude-code-otel (ColeMurray)](https://github.com/ColeMurray/claude-code-otel) | Hooks -> OpenTelemetry | Comprehensive OTel solution for usage, performance, costs |
| [claude_telemetry (TechNickAI)](https://github.com/TechNickAI/claude_telemetry) | CLI wrapper | Drop-in `claudia` command that wraps `claude`, logs tool calls/tokens/costs to Logfire, Sentry, Honeycomb, or Datadog |

### Approaches
1. **Hook scripts** — Python/bash scripts in `.claude/settings.local.json` that fire on lifecycle events and POST data to a local server or cloud service
2. **Proxy-based** — Route Claude API traffic through a proxy (LiteLLM) that emits OTel spans
3. **CLI wrapper** — Replace the `claude` command with a wrapper that adds instrumentation

### Notable Insight: disler's Multi-Agent Dashboard
The most popular community project. Its key insight: when running multiple Claude Code agents in parallel (teams/swarms), you need **per-agent swim lanes** to see what each agent is doing, with the ability to filter by agent. This is directly relevant to our project.

---

## 3. Platform-Level Observability Tools

These are larger platforms that now support Claude Code as a data source.

### Langfuse (Open Source, Self-Hostable)
- **[langfuse.com](https://langfuse.com)** | MIT license | YC W23
- Full tracing: LLM calls, tool invocations, retrieval steps with context
- Prompt versioning tied to traces (compare perf before/after prompt changes)
- Claude Code integration via hooks (Stop hook captures each turn)
- What gets traced: turn traces, generation spans, tool spans (nested)
- Self-hostable via Docker Compose / Kubernetes
- **Pricing**: Free self-hosted, $29/mo cloud

### LangSmith
- **[langchain.com/langsmith](https://www.langchain.com/langsmith/observability)** | Proprietary
- Best-in-class for LangChain/LangGraph users
- Virtually no overhead on traced applications
- Deep debugging views that understand framework internals
- Now supports [Claude Code tracing](https://docs.langchain.com/langsmith/trace-claude-code)
- Weaker on big-picture analytics/dashboards

### Arize / Phoenix + Dev-Agent-Lens
- **[arize.com](https://arize.com/blog/claude-code-observability-and-tracing-introducing-dev-agent-lens/)**
- [Dev-Agent-Lens](https://github.com/Teraflop-Inc/dev-agent-lens): open proxy layer using LiteLLM -> OTel/OpenInference spans -> Arize AX or Phoenix (local)
- Shows token usage per prompt, tool call I/O as structured JSON, latency breakdowns
- Supports automated evals on spans (invalid JSON detection, latency SLA violations)

### SigNoz (Open Source)
- **[signoz.io](https://signoz.io/docs/claude-code-monitoring/)** | OpenTelemetry-native
- Claude Code monitoring via OTel hooks
- Custom dashboards for session activity, error rates, usage patterns
- Full self-hosted option

### Datadog
- **[datadoghq.com](https://www.datadoghq.com/blog/claude-code-monitoring/)** | Enterprise
- AI Agents Console now supports Claude Code
- Track adoption, performance, reliability, spend at org level
- Enterprise-grade but requires Datadog subscription

### MLflow / Databricks
- **[Databricks Docs](https://docs.databricks.com/aws/en/mlflow3/genai/tracing/integrations/claude-code)**
- MLflow Tracing auto-traces Claude Code conversations and Agent SDK apps
- Captures prompts, responses, tool usage, timing, session metadata

### AgentOps
- Production agent monitoring specialist
- 400+ LLM framework integrations
- Session states, custom alerts, collaboration tracking
- Claims 25x cost reduction for multi-agent fine-tuning

### Braintrust
- Evals tied to CI/CD
- Unified workflow for PMs and engineers
- Best for teams doing iterative prompt design

---

## 4. Agent Trace Visualization Components

### AgentPrism (Evil Martians)
- **[github.com/evilmartians/agent-prism](https://github.com/evilmartians/agent-prism)** | Open source React components
- Drop-in React components that visualize OpenTelemetry traces
- Components: `TraceViewer` (complete), `TraceList`, `TreeView`, `DetailsView`, `SpanCard`
- Data adapters for OTel and Langfuse trace formats
- Accessible (Radix/ARIA), themeable, strongly typed
- **Highly relevant** — these are embeddable UI components, not a full platform

### Agent Trace (Cursor)
- **[agent-trace.dev](https://agent-trace.dev/)** | [github.com/cursor/agent-trace](https://github.com/cursor/agent-trace)
- A **standard format** for tracking AI-generated code
- Captures: file paths, conversations, AI contributors/model IDs, line ranges, metadata
- Storage-agnostic (files, git notes, DB, anything)
- Not a viewer — it's a spec for attribution/provenance

---

## 5. Real-Time Session Dashboards

### claude-code-ui (KyleAMathews)
- **[github.com/KyleAMathews/claude-code-ui](https://github.com/KyleAMathews/claude-code-ui)**
- Real-time dashboard for monitoring sessions across multiple repos
- Kanban-style UI organized by repository
- Shows which sessions need user permission/approval
- Tracks PR/CI status
- Uses Durable Streams for real-time updates
- Daemon + web UI architecture

### claude-code-monitor (onikan27)
- **[github.com/onikan27/claude-code-monitor](https://github.com/onikan27/claude-code-monitor)**
- Real-time dashboard for multiple sessions
- CLI + Mobile web UI with QR code access
- Terminal focus switching (iTerm2, Terminal.app, Ghostty)
- macOS only

### Claude-Code-Usage-Monitor
- **[github.com/Maciek-roboblog/Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor)**
- Usage monitoring with predictions and warnings
- Focused on rate limits and consumption tracking

### Claude HUD
- **[Towards AI blog post](https://pub.towardsai.net/claude-hud-building-real-time-observability-for-claude-code-via-the-statusline-api-b114b825d3ef)**
- Terminal-based, uses Claude Code's Statusline API
- "htop for Claude Code" — always-visible HUD showing context health, tool activity, agent status, task progress
- Runs in the terminal, not a separate UI

---

## 6. Session Management Tools

| Project | Description |
|---------|-------------|
| [claude-sessions (iannuttall)](https://github.com/iannuttall/claude-sessions) | Slash commands for session tracking and documentation |
| [cc-sessions (GWUDCAP)](https://github.com/GWUDCAP/cc-sessions) | Opinionated productivity framework with unified sessions API, natural language protocols, todo validation |
| [@iamqc/cc-session](https://www.npmjs.com/package/@iamqc/cc-session) | TypeScript library for session management with streaming and tool integration |
| [claude-analytics](https://socket.dev/npm/package/claude-analytics) | Token tracking, cost analysis, usage heatmaps, productivity insights |

---

## 7. Key Insights for Our Project (Claude Code Lens)

### What's Missing in the Landscape

1. **No great "all-in-one" local viewer** — The best session viewers (claudeye, cc-log-viewer) don't do real-time hooks monitoring. The best hooks dashboards (disler's) don't parse JSONL history. Nobody combines both.

2. **Multi-agent visualization is primitive** — disler's project shows swim lanes but the UI is basic. Nobody visualizes team coordination (task assignments, message passing between agents, dependency graphs).

3. **Tool call visualization needs work** — Flat lists dominate. No one shows:
   - Timeline/waterfall views of tool execution
   - Visual diffs for file Edit/Write operations
   - Bash command output with syntax highlighting
   - Nested subagent tool calls as a tree

4. **Thinking/reasoning is underserved** — Extended thinking blocks are just rendered as text. No collapsible sections, no "thinking vs. acting" timeline, no way to see how much thinking preceded each action.

5. **Cost attribution is scattered** — Some tools track tokens, some track cost, but nobody ties cost to specific tasks/features/PRs in a meaningful way.

6. **Search across sessions is weak** — "Find all sessions where the agent edited file X" or "Find all tool call failures" requires manual log grep.

### Architectural Decisions Informed by Research

- **Read JSONL directly** (like everyone else) — it's the de facto standard, no API needed
- **Consider hooks integration later** for real-time monitoring, but JSONL parsing is the foundation
- **Progressive disclosure UI** is the established pattern — collapse by default, expand on click
- **Color coding by message type** is expected by users
- **AgentPrism's component architecture** is worth studying — they've solved the OTel-to-UI data transformation problem as reusable React components
- **Multi-agent swim lanes** (from disler's project) should be a first-class feature, not an afterthought
- **Desktop/local-first** is the norm — nobody ships a cloud-hosted viewer for local agent logs

### Competitive Positioning

Our best angle: **A purpose-built, local-first viewer for Claude Code sessions that deeply understands multi-agent workflows, tool calls, and thinking blocks** — combining the best of session replay (claudeye/cc-log-viewer) with multi-agent awareness (disler's hooks dashboard) in a polished Next.js UI. The landscape is fragmented across dozens of small tools; a well-designed unified experience would stand out.

---

## Sources

- [disler/claude-code-hooks-multi-agent-observability](https://github.com/disler/claude-code-hooks-multi-agent-observability)
- [Claude HUD (Towards AI)](https://pub.towardsai.net/claude-hud-building-real-time-observability-for-claude-code-via-the-statusline-api-b114b825d3ef)
- [SigNoz Claude Code Monitoring](https://signoz.io/docs/claude-code-monitoring/)
- [Dev-Agent-Lens (Arize)](https://arize.com/blog/claude-code-observability-and-tracing-introducing-dev-agent-lens/)
- [Langfuse Claude Code Integration](https://langfuse.com/integrations/other/claude-code)
- [AgentPrism (Evil Martians)](https://github.com/evilmartians/agent-prism)
- [Agent Trace (Cursor)](https://agent-trace.dev/)
- [claude-code-ui (KyleAMathews)](https://github.com/KyleAMathews/claude-code-ui)
- [claudeye (npm)](https://www.npmjs.com/package/claudeye)
- [cc-log-viewer (crates.io)](https://crates.io/crates/cc-log-viewer)
- [claude-JSONL-browser](https://github.com/withLinda/claude-JSONL-browser)
- [clog (HillviewCap)](https://github.com/HillviewCap/clog)
- [Datadog AI Agents Console](https://www.datadoghq.com/blog/claude-code-monitoring/)
- [AI Agent Observability 2026 Comparison](https://research.aimultiple.com/agentic-monitoring/)
- [LLM Observability Tools 2026 (lakeFS)](https://lakefs.io/blog/llm-observability-tools/)
- [Braintrust AI Observability Guide](https://www.braintrust.dev/articles/best-ai-observability-tools-2026)
- [doneyli Substack: Custom Observability for Claude Code](https://doneyli.substack.com/p/i-built-my-own-observability-for)
