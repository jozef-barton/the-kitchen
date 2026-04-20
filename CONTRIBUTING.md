# Contributing to The Kitchen

Thanks for your interest in contributing. This document covers how to get the project running locally, the workflow we use, and the expectations for pull requests.

## Prerequisites

- **Node.js** `>=22.5.0` (the bridge uses the experimental `node:sqlite` module introduced in 22.5).
- **pnpm** `>=10.0.0`. Install via `npm install -g pnpm` or `corepack enable`.
- **Hermes CLI** installed and on your PATH (the bridge shells out to it).

## Getting started

```bash
pnpm install
pnpm dev           # concurrently runs the bridge and the web app
```

- Bridge: `http://127.0.0.1:8787`
- Web: `http://127.0.0.1:5173`

## Repository layout

```
apps/
  bridge/      Node HTTP server, SQLite storage, Hermes CLI client
  web/         Vite + React frontend
packages/
  protocol/    Shared Zod schemas and TypeScript types
  ui/          Shared UI primitives
  config/      Shared config helpers
  testing/     Shared test utilities
```

## Workflow

1. Fork the repo and create a feature branch off `main`.
2. Keep commits focused. Prefer one logical change per commit.
3. Run the full verification locally before pushing:
   ```bash
   pnpm ci:full
   ```
   This runs lint, typecheck, unit tests, Playwright e2e, and a security check.
4. Open a pull request. Describe what changed and why.

## Code style

- TypeScript strict mode is enabled everywhere. Fix types; do not cast around them.
- Match the existing code style — no new formatting tool configs, no new abstractions without a concrete need.
- Add tests for new behavior. Prefer integration-level tests over mocks where feasible.
- Do not introduce new dependencies without discussion.

## Commit messages

Write short, imperative-mood titles:

```
Fix path traversal in recipe endpoints
Add CSRF header requirement to bridge
```

A short body is welcome when the *why* is not obvious from the diff.

## Reporting security issues

Do **not** file public issues for vulnerabilities. See [SECURITY.md](SECURITY.md).

## Questions

Open a discussion or a draft pull request if you want early feedback on an approach.
