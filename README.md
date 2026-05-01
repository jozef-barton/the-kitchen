# The Kitchen

[![CI](https://github.com/jozef-barton/the-kitchen/actions/workflows/ci.yml/badge.svg)](https://github.com/jozef-barton/the-kitchen/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.11-brightgreen)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10-orange)](https://pnpm.io)
[![Hermes CLI](https://img.shields.io/badge/hermes--cli-0.12.x-brightgreen)](https://hermes-agent.nousresearch.com/)

A local-first browser frontend for [Hermes Agent](https://hermes-agent.nousresearch.com/) — streaming chat, structured recipe workspaces, provider settings, and a recipe template gallery.

> **Status:** pre-1.0. The protocol, persistence schema, and bridge surface area can change between releases. Pin to a commit if you depend on it.

## Requirements

- **Node.js 22.11 or later** — the bridge uses the built-in `node:sqlite` module. Node 24 LTS is recommended.
  - Check: `node --version`
  - Install via [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`, or download from [nodejs.org](https://nodejs.org)
- **pnpm 10+** — `npm install -g pnpm`
- **Hermes Agent CLI 0.12.x** — install from [hermes-agent.nousresearch.com](https://hermes-agent.nousresearch.com/)
  - Quick install (Linux/macOS/WSL2): `curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash`
  - Verify: `hermes --version` (must report `0.12.0` or later 0.12.x)
  - First-time setup: `hermes setup`
  - The bridge pins to a specific Hermes major+minor; mismatched versions surface a banner in the UI.

> **Important:** Clone or extract this repo to a path with **no spaces**. A path like `~/Desktop/the kitchen/` causes subprocess errors. Use `~/dev/the-kitchen/` or similar.

## Quick start

The friendliest single-command path — builds the workspace and opens the app in your browser:

```bash
pnpm install
pnpm kitchen
```

`pnpm kitchen` runs `pnpm build`, starts the bridge serving the built web app, picks a free port if 8787 is busy, and opens your default browser. Ctrl-C shuts it down cleanly.

For development with hot reload (web on 5173, bridge on 8787):

```bash
pnpm dev
```

Or build and serve the production bundle manually:

```bash
pnpm build
pnpm start
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `BRIDGE_PORT` | `8787` | Bridge HTTP port. `pnpm kitchen` falls back to a free ephemeral port if this one is busy. |
| `BRIDGE_DB_PATH` | See below | Path to the local SQLite database. |
| `HERMES_CLI_PATH` | `hermes` | Path to the Hermes binary if it isn't on `PATH`. |

Default database location:

- **macOS:** `~/Library/Application Support/Hermes Recipes Browser/hermes-recipes.db`
- **Linux:** `~/.local/share/Hermes Recipes Browser/hermes-recipes.db`
- **Windows:** `%APPDATA%\Hermes Recipes Browser\hermes-recipes.db`

## Troubleshooting

**Bridge exits with code 1 immediately**
- Check Node.js version: `node --version` — must be ≥ 22.5
- Make sure the repo path has no spaces
- Make sure `hermes` is on your `PATH`: `hermes --version`

**"Hermes is not fully healthy" banner**
- Run `hermes profile list` in your terminal to confirm Hermes works
- If you just installed Hermes, run `hermes setup` first

**Model selector or Settings shows nothing**
- Open Settings and configure a provider API key
- Run `hermes config show` to verify your current model and provider

## Features

| Surface | Route | What it does |
|---|---|---|
| **Chat** | `/` | Streaming Hermes responses over SSE with Markdown, syntax highlighting, tables, and image/file attachments. |
| **Sessions** | `/sessions` | Browse, resume, and delete real Hermes sessions. Search by title, tag, or transcript content. |
| **Jobs** | `/jobs` | Cron jobs and one-shot job runs surfaced from Hermes — status, history, and elapsed time. |
| **Coding** | `/coding` | Agentic coding sessions via Claude Code or Codex. Repos, jobs, integrations. See [Coding agents](#coding-agents). |
| **Tools** | `/tools` · `/tools/history` | Tool catalog (read-only) plus a reviewed-execution audit log. |
| **Skills** | `/skills` · `/skills/finder` | Hermes skill library plus a finder for installed and bundled skills. |
| **Recipes** | `/recipes` · `/recipes/ingredients` | Structured workspaces Hermes builds during chat. Pick a template from the Recipe Book or let Hermes choose one. Recipes attach to sessions and survive restart. |
| **Settings** | `/settings/{models,persona,access,audit}` | Guided provider setup, persona/profile editing, capability boundaries, and an action audit trail. |
| **Remote access** | `/remote-access` | Pairing UX for accessing the bridge from another device on your LAN. |

All persistence is local SQLite. The bridge binds to `127.0.0.1` only and accepts same-origin requests.

## Coding agents

The `/coding` screen runs long-lived agentic coding sessions via Claude Code or Codex.

**Tabs:**
- **Jobs** — projects list, job list, live job view with two-column layout (response left, activity right).
- **Repos** — same project list for quick navigation without leaving the coding context.
- **Integrations** — connect and manage Claude Code and Codex. Status is auto-detected every 30 s, on focus, and after any connect/disconnect operation.

**Required CLIs** (installed separately from the Kitchen):

| Agent | Install | Min. version | Auth status check |
|---|---|---|---|
| Claude Code | `npm install -g @anthropic-ai/claude-code` | 2.0+ | `claude auth status` |
| Codex | `npm install -g @openai/codex` | 0.120+ | `codex login status` |

**Approval modes:**

| Mode | Claude Code | Codex |
|---|---|---|
| Manual | *(no flag)* | `-a on-request -s read-only` |
| Auto-safe | `--permission-mode acceptEdits` | `--full-auto` |
| Bypass | `--permission-mode bypassPermissions` | `--dangerously-bypass-approvals-and-sandbox` |

**Disconnect vs. Delete:**
- **Disable in app** (toggle in the Integrations tab) — stops the Kitchen from offering the agent for new jobs, but does *not* sign out of the CLI. Your terminal sessions remain authenticated.
- **Delete** (3-dot menu → Delete) — runs `claude auth logout` / `codex logout` and signs you out everywhere. You'll need to re-authenticate from the terminal.

## Architecture

Monorepo layout:

- [`apps/bridge`](apps/bridge) — local Node runtime: Hermes CLI execution, origin policy, SQLite persistence, SSE streaming.
- [`apps/web`](apps/web) — Vite + React + Chakra browser app that talks only to the bridge over HTTP/SSE.
- [`packages/protocol`](packages/protocol) — Zod-validated request, response, event, and entity schemas.
- [`packages/ui`](packages/ui) — shared Chakra provider and theme helpers.
- [`packages/config`](packages/config) — shared lint configuration.
- [`packages/testing`](packages/testing) — cross-package test utilities.

Canonical specs live under [`docs/specs`](docs/specs):

- [architecture.md](docs/specs/architecture.md) — runtime surfaces, bridge API, persistence model, failure behavior.
- [product-spec.md](docs/specs/product-spec.md) — product goals, required behavior, and data expectations.
- [protocol.md](docs/specs/protocol.md) — shared HTTP/SSE schemas between the bridge and browser.
- [spaces.md](docs/specs/spaces.md) — session-attached Spaces framework and build pipeline.
- [spaces-template-library.md](docs/specs/spaces-template-library.md) — curated Spaces template gallery.
- [hermes-ui-workspaces.md](docs/specs/hermes-ui-workspaces.md) — Hermes-to-bridge space data contract.
- [threat-model.md](docs/specs/threat-model.md) — threats, mitigations, and reviewed-tool allowlist.

## Development

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The full path used by [CI](.github/workflows/ci.yml) bundles those into one command:

```bash
pnpm ci:full   # lint + typecheck + unit tests + security check
```

End-to-end Playwright tests live under [`apps/web/e2e`](apps/web/e2e) and run against a fixture bridge configured in [`playwright.config.ts`](playwright.config.ts). Run them locally with `pnpm exec playwright test`; they are not currently part of `pnpm ci:full`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, workflow, and pull-request expectations. A few load-bearing project rules to keep in mind:

- The browser app only talks to the bridge over HTTP/SSE. The bridge is the only place that calls the Hermes CLI.
- Persistence is SQLite-backed via Node.js `node:sqlite`. Do not add file-system state outside the database.
- Provider API keys flow through Hermes auth/config only — the bridge caches only masked metadata locally.
- Recipes must stay schema-driven. The production path is template selection plus structured fill/update JSON with bridge-owned normalization and rendering.
- Reviewed shell execution is intentionally narrow. Expand the allowlist only with tests.

## Security

The bridge binds to `127.0.0.1` only and accepts same-origin requests. To report a vulnerability, see [SECURITY.md](SECURITY.md). Do not file public issues for security problems.

## License

Apache License 2.0 — see [LICENSE](LICENSE).

## Acknowledgements

Built around [Hermes Agent](https://hermes-agent.nousresearch.com/) by Nous Research.
