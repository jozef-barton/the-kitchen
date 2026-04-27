# Hermes Workspaces Architecture

## Runtime surfaces

1. `apps/bridge` is the local runtime boundary.
   It owns Hermes CLI execution, origin policy, parsing, persistence, reviewed tool execution, and streaming assistant updates.
2. `apps/web` is a browser-first Vite application.
   It talks only to the bridge over HTTP and SSE.
3. `packages/protocol` defines the Zod-validated request, response, event, and entity schemas shared by both sides.
4. `packages/ui` provides the shared Chakra provider and theme hooks used by the browser app.

## Bridge API

The bridge exposes these runtime routes:

- `GET /api/health`
- `GET /api/bootstrap`
- `POST /api/profiles/select`
- `POST /api/sessions`
- `POST /api/sessions/select`
- `GET /api/sessions`
- `GET /api/sessions/:id/messages`
- `GET /api/sessions/:id/export`
- `GET /api/jobs`
- `GET /api/tools`
- `GET /api/skills`
- `GET /api/model-providers`
- `PUT /api/model-providers`
- `POST /api/provider-connections`
- `GET /api/spaces`
- `POST /api/spaces`
- `GET /api/spaces/:id`
- `PUT /api/spaces/:id`
- `POST /api/spaces/:id/delete`
- `POST /api/spaces/:id/open-chat`
- `GET /api/tool-history`
- `GET /api/settings`
- `PUT /api/settings`
- `PUT /api/ui-state`
- `POST /api/tool-executions`
- `POST /api/tool-executions/:id/resolve`
- `POST /api/chat/stream`

All JSON and SSE routes enforce the same trusted-local origin policy.
`/api/chat/stream` uses SSE and emits validated `progress`, `activity`, `assistant_snapshot`, `session`, `message`, `space_event`, `complete`, and `error` events.

## Hermes data flow

1. The browser requests `/api/bootstrap`.
2. The bridge shells out to the real `hermes` CLI for profile and session discovery, scoped through `HERMES_HOME` when profile-specific data is required.
3. Parsed profiles are stored in SQLite.
4. Parsed sessions are stored as Hermes runtime sessions plus explicit local profile association metadata.
5. If a session transcript is needed, the bridge imports it from `hermes sessions export`.
6. Chat streams through `hermes chat`, with incremental progress and structured runtime activity surfaced as SSE.
7. Jobs load from `hermes cron`.
8. Tools load from `hermes tools list`.
9. Skills load from `hermes skills list`, and model/provider state comes from Hermes config/auth/status commands.
10. Space CRUD and session-attached space context stay local to the bridge and SQLite.
11. During chat for a session with an attached space, the bridge injects that space context into the Hermes prompt, validates any returned `hermes-ui-workspaces` block, applies it locally, and emits `space_event` updates.
12. Reviewed shell commands run only through the bridge after explicit approval.
13. Email-oriented prompts are steered toward authenticated Google Workspace skills when available so the final answer stays focused on the user task instead of CLI/tool inventory noise.

The browser never invents fallback profiles, sessions, jobs, or tools.
When Hermes is unavailable or parsing fails, the bridge returns explicit errors or degraded cached responses.

## Persistence model

SQLite is the primary local store because it is simple, local-first, queryable, restart-safe, and practical on macOS, Linux, and Windows without requiring a separate service.

Tables:

- `app_metadata`
- `profiles`
- `sessions`
- `session_profile_associations`
- `messages`
- `job_freshness`
- `jobs`
- `tools`
- `skills`
- `provider_connections`
- `runtime_model_configs`
- `runtime_provider_catalogs`
- `tool_executions`
- `audit_events`
- `spaces`
- `space_events`
- `settings`
- `ui_state`

Relationships and rules:

- `messages.session_id -> sessions.id`
- `session_profile_associations.session_id -> sessions.id`
- `spaces.primary_session_id -> sessions.id`
- `space_events.space_id -> spaces.id`
- sessions may be global in Hermes, but the app persists explicit local profile associations for filtering, recents, and restore state
- sessions may expose zero or one attached active space via `sessions.linked_space_id`
- `runtime_session_id` is unique when known
- tools are first-class rows, not embedded blobs
- skills, provider connections, and runtime model config are cached per profile
- discovered provider/model capability catalogs are cached per profile in `runtime_provider_catalogs`
- reviewed tool execution history is persisted in `tool_executions`
- unrestricted access enable/disable/use is persisted in `audit_events`
- jobs cache freshness is separated from job rows so the UI can distinguish empty, stale, disconnected, and failed states
- spaces are first-class local entities with append-only `space_events`, but they are now subordinate to sessions in the primary UX
- `settings` and `ui_state` are single-row tables used for durable app preferences, active session restore, and sidebar/tool state; legacy active-space fields remain only for migration compatibility

## Migration

If the SQLite database is empty on first launch, the bridge attempts a one-time migration from prior Electron snapshot files.
The importer selects the richest legacy snapshot available, copies useful user data into SQLite, and records the source path in `app_metadata`.

Imported legacy data includes:

- profiles
- sessions
- messages
- jobs cache
- tool execution history
- theme mode
- UI state

After migration, SQLite is the only runtime source of truth.

## Browser shell

The browser app is organized as:

- atoms
- molecules
- organisms
- templates
- pages

The shell keeps the document fixed to the viewport.
Scrolling is internal to the sidebar, chat transcript, runtime activity pane, sessions table, spaces list/detail/events panes, jobs table, tools table, tool-history tab, skills table, and settings panes.

The top-right theme toggle persists to SQLite through the bridge.

## Failure behavior

- no synthetic `Local Profile`
- no fake demo jobs or sessions
- no silent transcript placeholders
- no masked CLI parse failures
- no runtime/tool/skill/CLI internals rendered as if they were user-facing chat

Connected, degraded, disconnected, and error states are explicit in the UI and grounded in bridge responses.

## Security boundaries

- the browser app never executes Hermes-authored code
- the bridge rejects non-local browser origins on both JSON and SSE endpoints
- all bridge payloads are runtime-validated with Zod
- reviewed shell execution uses a strict allowlist and no shell interpolation
- unrestricted access is an explicit local opt-in with persisted audit events
- markdown is rendered without raw HTML
- space payloads render only through structured Chakra view types and never execute arbitrary HTML or JavaScript
- local execution stays inside the configured workspace root

## Testing model

- Vitest covers protocol validation, database persistence, bridge integration, migration, local-origin policy, provider/model state, unread-email regressions, transcript/runtime separation, space CRUD, space chat context, and browser unit behavior
- Playwright covers browser shell loading, session browse/resume, streaming chat, spaces flows, jobs/tools/tool-history/skills flows, disconnected states, and internal scrolling
- `pnpm ci:full` runs the local verification path mirrored by GitHub Actions: lint, typecheck, unit tests (Vitest), and the security check
- Playwright e2e is not part of `pnpm ci:full` today and is not gated by CI; run it locally with `pnpm exec playwright test` when changing the e2e surface
