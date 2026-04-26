# The Kitchen

[![CI](https://github.com/jozef-barton/the-kitchen/actions/workflows/ci.yml/badge.svg)](https://github.com/jozef-barton/the-kitchen/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.5-brightgreen)](https://nodejs.org)

A local-first browser frontend for [Hermes Agent](https://hermes-agent.nousresearch.com/) — streaming chat, structured recipe workspaces, provider settings, and a recipe template gallery.

> **Status:** pre-1.0. The protocol, persistence schema, and bridge surface area can change between releases. Pin to a commit if you depend on it.

## Requirements

- **Node.js 22.5 or later** — the bridge uses the built-in `node:sqlite` module added in v22.5. Node 24 LTS is recommended.
  - Check: `node --version`
  - Install via [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`, or download from [nodejs.org](https://nodejs.org)
- **pnpm 10+** — `npm install -g pnpm`
- **Hermes Agent CLI v0.9.0+** — install from [hermes-agent.nousresearch.com](https://hermes-agent.nousresearch.com/)
  - Quick install (Linux/macOS/WSL2): `curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash`
  - Verify: `hermes --version`
  - First-time setup: `hermes setup`

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

## How it works

- **Chat** — streaming responses from Hermes via SSE. Full Markdown rendering with syntax highlighting, tables, and lists.
- **Recipes** — structured workspaces Hermes generates during chat. Select a template from the Recipe Book tab, or let Hermes generate one based on your request. Recipes are attached to sessions and persist across restarts.
- **Settings** — configure Hermes providers with step-by-step guided setup for every supported provider, including API key links and example `hermes config set` commands.

All state persists in a local SQLite database. The bridge accepts connections from `localhost` / `127.0.0.1` only.

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
