# OSS Audit Report

Generated: 2026-02-15

## Code & Content

### MUST FIX

| # | File | Line(s) | Content | Issue |
|---|------|---------|---------|-------|
| 1 | `CLAUDE.md` | 15 | `Tailscale IP for remote access: \`100.123.90.13\`` | **Hardcoded Tailscale IP** — leaks personal network info, useless to OSS users |
| 2 | `CLAUDE.md` | 13 | `tmux new-session -d -s lens "npx next dev -p 3000 -H 0.0.0.0"` | **tmux setup + 0.0.0.0 binding** — personal dev workflow, irrelevant to OSS users. The 0.0.0.0 binding advice could be a security footgun |
| 3 | `CLAUDE.md` | 89 | `` `/Users/agent/foo` → `-Users-agent-foo` `` | **Hardcoded `/Users/agent/` path** in documentation example. Should use a generic placeholder like `/Users/you/foo` or `/home/user/foo` |
| 4 | `CLAUDE.md` | 105-106 | `Ben Tossell's Claude Code cookbook viewer (https://bensbites.com/claude-code-cookbook)` + `Study the cookbook site with agent-browser` | **`agent-browser` references** — `agent-browser` is a private/internal tool, confusing for OSS contributors. Appears at lines 106, 125, 139 |
| 5 | `CLAUDE.md` | 129 | `Use /frontend-design skill for color/design judgement calls` | **Private skill reference** — `/frontend-design` is not available to OSS contributors |
| 6 | `CLAUDE.md` | 131-132 | `00774cdb-7e95-40dc-9f70-addc77147b99 (lamb-v2 project, has tool calls + thinking)` | **Hardcoded session ID + personal project name** (`lamb-v2`). Useless to other users, leaks project name |
| 7 | `src/lib/indexer/scanner.ts` | 31 | `// -Users-agent-foo → /Users/agent/foo` | **Hardcoded `/Users/agent/` path** in code comment. Should use generic placeholder |
| 8 | `master-plan.md` | 5, 9, 21 | `"doing on my machine"`, `"I want to get fundamentally better"`, `"~/dev-shared/playground/sideline"` | **Personal narrative + hardcoded personal paths** — entire file is first-person dev journal with personal directory references |
| 9 | `specs/v1.4-fixes-and-teams.md` | 97 | `Use session \`6c5d39e8-466b-4620-8eb1-638259be7b91\` as test data` | **Hardcoded session ID** — useless to other users |
| 10 | `specs/v1.3-fixes-and-stats.md` | 140 | `http://localhost:3000/session/00774cdb-7e95-40dc-9f70-addc77147b99` | **Hardcoded session ID in URL** |
| 11 | `package.json` | 2 | `"name": "app"` | **Generic package name** — should be `claude-code-lens` or similar for an OSS project |

### SHOULD FIX

| # | File | Line(s) | Content | Issue |
|---|------|---------|---------|-------|
| 12 | `CLAUDE.md` | 10 | `npx next dev -H 0.0.0.0 # Bind to all interfaces (for remote access)` | **0.0.0.0 binding** in Quick Start — not needed for most users, could confuse/expose. Move to a "Remote Access" section or remove |
| 13 | `CLAUDE.md` | 141 | `Dev server runs in tmux session "lens"` | **Personal workflow assumption** — not relevant to OSS users |
| 14 | `master-plan.md` | 15-16 | Links to Ben Tossell's cookbook + Ralph Loop UI | Not sensitive, but the personal narrative tone ("the look and feel we're going for") reads as internal dev notes, not OSS docs |
| 15 | `master-plan.md` | 21 | `Built a similar tool previously at ~/dev-shared/playground/sideline` | **Personal directory path** — leaks workspace structure |
| 16 | `specs/v1.2-iteration-plan.md` | 16 | `Running in tmux session "lens" on port 3000, bound to 0.0.0.0` | **Personal dev setup assumption** |
| 17 | `specs/v1.3-fixes-and-stats.md` | 128, 134 | `agent-browser` references | **Private tool references** in spec files |
| 18 | `specs/v1.4-fixes-and-teams.md` | 95 | `Use agent-browser at mobile viewport width` | **Private tool reference** |
| 19 | `specs/v1.2-iteration-plan.md` | 115, 121 | `agent-browser` references | **Private tool references** |
| 20 | `CLAUDE.md` | 142 | `Git: commit freely, ask before pushing` | **Internal team convention** — reads as instructions to a specific person, not general contributor guidelines |
| 21 | `CLAUDE.md` | 137 | `Don't modify files outside your assigned scope when working in a team` | **Internal agent instruction** — not meaningful for human OSS contributors |
| 22 | `specs/*.md` (all) | Various | Agent team structures: "ux-agent", "mobile-agent", "qa-agent" | Internal implementation notes about how agent teams built features. Not harmful but potentially confusing for OSS contributors. Consider whether specs should ship at all |
| 23 | `research/observability-landscape.md` | Entire file | Research notes on competing tools | Not sensitive, but it's internal research. Consider whether it adds value for OSS users or is just noise |

### OK (Acceptable)

| # | File | Content | Reason |
|---|------|---------|--------|
| 24 | `src/lib/indexer/scanner.ts` | `join(homedir(), '.claude', 'projects')` | Uses `os.homedir()` dynamically — correct for any user |
| 25 | `CLAUDE.md` + specs | `~/.claude/projects/` references | Standard Claude Code convention, applies to all users |
| 26 | `CLAUDE.md` + specs | `http://localhost:3000` references | Standard dev convention — port 3000 is Next.js default |
| 27 | `CLAUDE.md` | Ben Tossell / bensbites.com attribution | Public attribution to design inspiration is fine |
| 28 | `.gitignore` | `/screenshots/` excluded | Good — prevents accidental leak of session data screenshots |
| 29 | `src/app/globals.css` | Font stack: Berkeley Mono, JetBrains Mono, etc. | Falls back gracefully — purely aesthetic preference |
| 30 | All source files | No API keys, tokens, secrets, or credentials found | Clean |
| 31 | `.env*` in `.gitignore` | Env files excluded | Good practice |

---

## Summary

**Critical items (MUST FIX before open-sourcing):**
- Remove Tailscale IP address (line 15 of CLAUDE.md)
- Replace `/Users/agent/` hardcoded paths with generic examples in CLAUDE.md and scanner.ts comment
- Remove or generalize hardcoded session IDs (CLAUDE.md, specs)
- Remove `agent-browser` references (private tool, 6 occurrences across CLAUDE.md and specs)
- Remove `/frontend-design` skill reference
- Remove personal project name `lamb-v2`
- Rename package from `"app"` to `"claude-code-lens"`
- Clean up or remove `master-plan.md` (personal dev journal with hardcoded paths)

**Recommended cleanup (SHOULD FIX):**
- Remove tmux-specific workflow instructions
- Remove internal agent team conventions from CLAUDE.md
- Decide whether `specs/` and `research/` dirs should ship — they contain useful context but also internal workflow noise
- Rewrite CLAUDE.md "Working Conventions" section for an OSS audience (contributor guidelines vs. internal agent instructions)

**No secrets or credentials found.** The codebase is clean of API keys, tokens, and passwords.

---

## Repo Artifacts & Git History

### .gitignore Analysis

The `.gitignore` is well-configured. Key entries:

| Pattern | Status | Notes |
|---------|--------|-------|
| `/node_modules` | Present | Standard |
| `/.next/` | Present | Next.js build output |
| `.DS_Store` | Present | macOS artifact |
| `*.pem` | Present | Prevents accidental key commits |
| `.env*` | Present | Catches all env file variants |
| `/screenshots/` | Present | Good — screenshots may contain sensitive session data |
| `/coverage` | Present | Test coverage output |
| `.vercel` | Present | Vercel deployment config |
| `*.tsbuildinfo` | Present | TypeScript incremental build |
| `next-env.d.ts` | Present | Auto-generated Next.js types |

**Missing from .gitignore (SHOULD ADD):**
- `oss-audit-report.md` — this audit report itself should not ship in the OSS repo
- `/specs/` — if the team decides specs are internal-only (see code audit recommendations)
- `/research/` — if the team decides research notes are internal-only

### Git History Audit

**Total commits:** 9 (clean, linear history on `main`)

**Sensitive files in history:** None found. Specifically checked:
- No `.png`, `.jpg`, `.mp4`, `.jpeg`, `.gif`, or other binary image/video files were ever committed
- No screenshots were ever committed (the `/screenshots/` gitignore was added in the initial V1 commit, before any screenshots existed)
- No credential files (`.pem`, `.key`) were ever committed
- No env files were ever committed
- `favicon.ico` (25,931 bytes) is the only binary file — this is the default Next.js favicon, harmless

**No history rewriting needed.** The git history is clean — no sensitive files to scrub with `git filter-branch` or BFG.

### Committed Files Review

All committed files are source code, configs, specs, or documentation. Full inventory:

| Category | Files | Status |
|----------|-------|--------|
| Source code (`src/`) | 22 files | Clean — no secrets, no personal data in code (paths in comments flagged by code auditor) |
| Config files | `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs` | Clean |
| Public assets | 5 SVG files + `favicon.ico` | Default Next.js assets — consider removing unused ones (file.svg, globe.svg, next.svg, vercel.svg, window.svg) if they're not used in the app |
| Specs | 4 spec files | Contains internal workflow references (see code auditor findings) |
| Research | 1 file (`observability-landscape.md`) | Clean content, but internal research — decide if it ships |
| Docs | `CLAUDE.md`, `master-plan.md` | Multiple issues flagged by code auditor |
| Lock file | `package-lock.json` | 6,538 lines — standard, ships with the repo |

### package.json Review

| Field | Value | Issue |
|-------|-------|-------|
| `name` | `"app"` | **MUST FIX** — should be `"claude-code-lens"` |
| `version` | `"0.1.0"` | Fine for pre-release |
| `private` | `true` | **MUST FIX** — remove or set to `false` if publishing to npm. If not publishing to npm, keeping `true` is fine but unusual for OSS |
| `author` | (missing) | **SHOULD ADD** — add author name/handle for attribution |
| `license` | (missing) | **MUST FIX** — must specify a license (see LICENSE section below) |
| `description` | (missing) | **SHOULD ADD** — helps discoverability |
| `repository` | (missing) | **SHOULD ADD** — standard for OSS packages |
| `keywords` | (missing) | **SHOULD ADD** — helps npm/GitHub discoverability |

### LICENSE File

**NO LICENSE FILE EXISTS.** This is a **blocker for open-sourcing.** Without a license:
- The code is "all rights reserved" by default
- Nobody can legally use, modify, or distribute it
- GitHub will show "No license" which deters contributors

**Recommendation:** Add a `LICENSE` file. Common choices:
- **MIT** — maximally permissive, most popular for tools like this
- **Apache 2.0** — permissive with patent protection
- **AGPL-3.0** — copyleft, requires derivative works to also be open-source

### Default Next.js Assets

The `public/` directory contains default Next.js starter template SVGs that are likely unused:
- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

**SHOULD FIX:** Remove unused default assets before open-sourcing — they add clutter and signal "generated from template."

### Summary of Repo Artifact Findings

**Blockers (MUST FIX):**
1. **No LICENSE file** — legally required for open-sourcing
2. **No `license` field in package.json** — must match the LICENSE file
3. **Package name is `"app"`** — should be `"claude-code-lens"`

**Recommended (SHOULD FIX):**
4. Add `author`, `description`, `repository`, and `keywords` to package.json
5. Remove unused default Next.js SVG assets from `public/`
6. Decide whether `private: true` should stay (fine if not publishing to npm)
7. Add `oss-audit-report.md` to `.gitignore` (or delete before publishing)

**Clean (no issues):**
- Git history has no sensitive files — no scrubbing needed
- No binary blobs, no screenshots, no credential files ever committed
- `.gitignore` is comprehensive for the tech stack
- `package-lock.json` is standard and should ship

---

## OSS Usability

Evaluated from the perspective of a new user cloning the repo for the first time.

### README.md — MISSING (Blocker)

There is **no README.md** in the repo root. This is the single most important file for any OSS project. Without it:
- GitHub renders an empty repo page with no description
- New users have no idea what the project does, how to install it, or how to run it
- Discoverability and first impressions are terrible

**MUST FIX:** Create a `README.md` covering:
- What the project is (one-liner + screenshot/gif if possible)
- Prerequisites (Node.js version, Claude Code installed with session data)
- Install & run instructions (`npm install && npm run dev`)
- What the user should expect to see (two-panel viewer reading from `~/.claude/projects/`)
- Known limitations (no file watcher, stats can be slow)

The existing `CLAUDE.md` has good technical detail but is written as agent instructions, not user-facing documentation.

### First-Run Experience: `npm install && npm run dev`

**The good:**
- `package.json` has standard `dev`, `build`, `start`, `lint` scripts — `npm install && npm run dev` works out of the box
- Dependencies are minimal and well-known (Next.js, React, Tailwind) — no exotic native modules that would fail on different platforms
- No `.env` files required — the app has zero environment variables
- No database or external service dependencies

**Issues:**
- Package name is `"app"` (flagged in prior sections) — confusing for `npm ls` / debugging
- No `engines` field in `package.json` to specify required Node.js version — Next.js 16 requires Node 18.18+, and users on older Node will get cryptic errors
- No `description` field — `npm ls` and GitHub package metadata show nothing

**SHOULD ADD to `package.json`:**
```json
"engines": { "node": ">=18.18.0" }
```

### Error Handling: Missing `~/.claude/projects/` Directory

This is the most likely failure scenario for a new user — they either don't use Claude Code, or use it but haven't accumulated session data yet.

**Current behavior — poor:**

| Route | What happens | User sees |
|-------|-------------|-----------|
| `GET /api/projects` | `scanner.ts:211` calls `readdir(CLAUDE_PROJECTS_DIR)` with no guard → throws `ENOENT` → caught by API route → returns `{ "error": "Failed to fetch projects" }` with HTTP 500 | Generic 500 error, no explanation |
| `GET /api/stats` | `stats/route.ts:17` same pattern — raw `readdir` on the dir, throws `ENOENT` → returns `{ "error": "Failed to compute stats" }` with HTTP 500 | Generic 500 error |
| `GET /api/sessions?project=X` | Would also 500 if the encoded path subdir doesn't exist | Generic 500 error |
| `GET /api/session/[id]` | `findSessionFile` calls `readdir(CLAUDE_PROJECTS_DIR)` → same ENOENT issue | Generic 500 error |

**What should happen:**
- `getProjects()` should check if `CLAUDE_PROJECTS_DIR` exists first and return an empty array if not
- `GET /api/stats` should similarly return zeroed stats instead of 500
- The UI should show a friendly empty state: "No Claude Code sessions found. Make sure you have Claude Code installed and have run at least one session."

**MUST FIX:** Add a directory existence check at the top of `getProjects()` and the stats route. Example:
```typescript
import { access } from 'fs/promises';
// At top of getProjects():
try { await access(CLAUDE_PROJECTS_DIR); } catch { return []; }
```

**Note:** `scanJsonlFiles()` (line 112-118) already handles missing directories gracefully with a try/catch around `readdir` — this pattern should be applied to the top-level functions too.

### Hardcoded Platform Assumptions

**OS path handling — mostly fine:**
- `scanner.ts` uses `os.homedir()` and `path.join()` correctly — works on macOS, Linux, and Windows
- `~/.claude/projects/` is the standard Claude Code convention across all platforms
- No hardcoded `/Users/` or `/home/` paths in runtime code (the one in the comment at line 31 is cosmetic only)

**Platform risk — low:**
- The `decodePath()` function (line 30-33) replaces all `-` with `/` — this works for Unix paths but would produce wrong results on Windows where paths use `\`. However, Claude Code itself uses this same encoding convention, so this is a Claude Code compatibility detail, not a bug in this project
- No shell-outs, no platform-specific binaries, no native modules

**Verdict:** Runtime code is cross-platform. The only platform assumption is that Claude Code uses `~/.claude/projects/`, which is correct.

### Error Message Quality

| Scenario | Current message | Quality |
|----------|----------------|---------|
| Missing `~/.claude/projects/` | `"Failed to fetch projects"` (500) | **Poor** — doesn't tell user what's wrong or how to fix it |
| Missing project param on `/api/sessions` | `"Missing project parameter"` (400) | OK |
| Session not found | `"Session not found"` (404) | OK |
| JSONL parse error | Silently skipped (empty catch blocks) | **Acceptable** — graceful degradation, but no logging |
| General errors in all routes | `"Failed to fetch/compute X"` (500) | **Poor** — no detail, no hint about cause |

**SHOULD FIX:** API error responses should include a `detail` field when helpful:
```json
{ "error": "No Claude Code data found", "detail": "Expected directory ~/.claude/projects/ does not exist. Make sure Claude Code is installed." }
```

### package.json Completeness

| Field | Current | Needed for OSS? |
|-------|---------|-----------------|
| `name` | `"app"` | **MUST FIX** → `"claude-code-lens"` |
| `version` | `"0.1.0"` | Fine |
| `private` | `true` | Fine if not publishing to npm |
| `description` | (missing) | **SHOULD ADD** |
| `author` | (missing) | **SHOULD ADD** |
| `license` | (missing) | **MUST FIX** — must match LICENSE file |
| `repository` | (missing) | **SHOULD ADD** for GitHub linking |
| `engines` | (missing) | **SHOULD ADD** — `node >=18.18.0` |
| `keywords` | (missing) | Nice to have |
| Scripts | `dev`, `build`, `start`, `lint` | Good — standard Next.js set |

### LICENSE File

**No LICENSE file exists** (confirmed, also flagged in repo artifacts section). This is a legal blocker.

**Recommendation: MIT License** — it's the most common choice for developer tools, maximally permissive, and matches the project's nature (local-only viewer, no service component).

### Project Purpose Clarity

**From the repo alone (no README):** A new user would need to:
1. Read `CLAUDE.md` (which is written as agent instructions, not user docs)
2. Read `master-plan.md` (personal dev journal)
3. Infer from the code that it reads `~/.claude/projects/`

**Verdict: Not clear enough.** The project purpose is buried in agent-facing docs. A README would solve this entirely.

### Summary of OSS Usability Findings

**Blockers (MUST FIX):**
1. **No README.md** — critical for any OSS project
2. **No LICENSE file** — legal requirement (recommend MIT)
3. **Missing `~/.claude/projects/` crashes with 500** — needs graceful empty-state handling in `getProjects()`, stats route, and `findSessionFile()`
4. **`package.json` missing `license` field** and has generic `"app"` name

**Recommended (SHOULD FIX):**
5. Add `engines` field to `package.json` (`node >=18.18.0`)
6. Add `description`, `author`, `repository` to `package.json`
7. Improve API error messages — include hints about what's wrong when `~/.claude/projects/` is missing
8. Add a UI empty state for when no sessions exist (friendly message instead of blank/error)

**Already Good:**
- `npm install && npm run dev` works out of the box — no env setup required
- Zero external service dependencies (no DB, no API keys)
- Cross-platform runtime code (uses `os.homedir()`, `path.join()`)
- Minimal, well-known dependency tree (Next.js, React, Tailwind)
- Silent graceful degradation for malformed JSONL files (won't crash on bad data)
