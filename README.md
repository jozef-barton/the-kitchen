<div align="center">
  <img src="docs/banner.svg" alt="The Kitchen — local-first browser frontend for Hermes Agent" width="100%"/>
</div>

<div align="center">

[![CI](https://github.com/jozef-barton/the-kitchen/actions/workflows/ci.yml/badge.svg)](https://github.com/jozef-barton/the-kitchen/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.11-brightgreen)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10-orange)](https://pnpm.io)
[![Hermes CLI](https://img.shields.io/badge/hermes--cli-0.12.x-brightgreen)](https://hermes-agent.nousresearch.com/)

</div>

<br>

<div align="center">

A local-first browser frontend for **[Hermes Agent](https://hermes-agent.nousresearch.com/)** —
streaming chat, structured recipe workspaces, provider settings, and a recipe template gallery.

</div>

<br>

> **pre-1.0** — protocol, persistence schema, and bridge surface area can change between releases. Pin to a commit if you depend on it.

<br>

## Requirements

| | |
|:--|:--|
| **Node.js ≥ 22.11** | Uses built-in `node:sqlite`. Node 24 LTS recommended — `nvm install 22` or [nodejs.org](https://nodejs.org) |
| **pnpm ≥ 10** | `npm install -g pnpm` |
| **Hermes CLI 0.12.x** | `curl -fsSL https://hermes-agent.nousresearch.com/install.sh \| bash` then `hermes setup` |

> Clone to a path with **no spaces** — e.g. `~/dev/the-kitchen/`. Spaces in the path cause subprocess errors.

<br>

## Quick start

```bash
pnpm install
pnpm kitchen
```

Builds the workspace, starts the bridge on port **8787**, and opens your browser. Ctrl-C to stop cleanly. If 8787 is in use, the command exits with a friendly message — pass `--port=N` or set `BRIDGE_PORT=N` to override.

<br>

## Hosting modes

| Mode | Command | Who can connect |
|:--|:--|:--|
| **Local only** (default) | `pnpm kitchen` | Only this machine (`127.0.0.1`) |
| **Tailscale** | Start Tailscale, then `pnpm kitchen` | Devices on your Tailscale network |
| **Public LAN** | `pnpm kitchen --public` | Any device on your local network |

`--public` binds to `0.0.0.0` and admits `Host:` headers in RFC1918 (`10/8`, `172.16/12`, `192.168/16`) and link-local (`169.254/16`, `fe80::/10`, `fc00::/7`) ranges. Every LAN URL is printed on startup and stays visible so you can copy it. Tailscale and `--public` compose — both can be active at once.

> **Security:** `--public` has no authentication. Anyone on your local network can read and modify everything stored in The Kitchen. Only use it on networks you trust. CSRF header (`x-hermes-bridge: 1`) and Origin validation remain enforced.

```bash
pnpm dev                  # hot reload — web :5173, bridge :8787
pnpm build && pnpm start  # production bundle, manual
```

<br>

## Surfaces

<div align="center">
  <img src="docs/features.svg" alt="The Kitchen feature surfaces" width="100%"/>
</div>

All persistence is local SQLite. The bridge binds to `127.0.0.1` by default; see [Hosting modes](#hosting-modes) to expose it over Tailscale or your local network.

<br>

## Coding agents

The `/coding` screen runs long-lived agentic sessions via **Claude Code** or **Codex**.

| Agent | Install | Min. version |
|:--|:--|:--|
| Claude Code | `npm install -g @anthropic-ai/claude-code` | 2.0+ |
| Codex | `npm install -g @openai/codex` | 0.120+ |

**Approval modes**

| Mode | Claude Code | Codex |
|:--|:--|:--|
| Manual | *(no flag)* | `-a on-request -s read-only` |
| Auto-safe | `--permission-mode acceptEdits` | `--full-auto` |
| Bypass | `--permission-mode bypassPermissions` | `--dangerously-bypass-approvals-and-sandbox` |

**Disable** (Integrations tab toggle) stops new jobs without signing out of the CLI. **Delete** (3-dot → Delete) runs `claude auth logout` / `codex logout` everywhere.

<br>

## Configuration

| Variable | Default | Description |
|:--|:--|:--|
| `BRIDGE_PORT` | `8787` | Pinned. Override with `--port=N` if 8787 is in use. |
| `BRIDGE_DB_PATH` | Platform default¹ | Path to the local SQLite database. |
| `HERMES_CLI_PATH` | `hermes` | Override if the binary isn't on `PATH`. |

¹ **macOS:** `~/Library/Application Support/Hermes Recipes Browser/hermes-recipes.db` · **Linux:** `~/.local/share/…` · **Windows:** `%APPDATA%\…`

<br>

## Architecture

```
apps/
  bridge/      Node runtime — Hermes CLI execution, origin policy, SQLite, SSE streaming
  web/         Vite + React + Chakra UI — talks to the bridge over HTTP/SSE only
packages/
  protocol/    Zod-validated request, response, event, and entity schemas
  ui/          Shared Chakra provider and theme helpers
  config/      Shared ESLint configuration
  testing/     Cross-package test utilities
```

Canonical specs live in [`docs/specs/`](docs/specs/) — architecture, product, protocol, spaces, and threat model.

<br>

## Development

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm ci:full              # lint + typecheck + unit tests + security check
pnpm exec playwright test # E2E against fixture bridge (not in ci:full)
```

<br>

## Troubleshooting

| Symptom | Fix |
|:--|:--|
| Bridge exits immediately | Node ≥ 22.5 · no spaces in repo path · `hermes` on `PATH` |
| "Hermes not fully healthy" | `hermes setup` · `hermes profile list` |
| Settings shows nothing | Add a provider API key in Settings · `hermes config show` |

<br>

---

<div align="center">

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Apache 2.0](LICENSE) · Built around [Hermes Agent](https://hermes-agent.nousresearch.com/) by Nous Research

</div>
