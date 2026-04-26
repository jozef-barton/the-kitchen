# AGENTS.md

This repository is intended to be completed autonomously by a coding agent such as Codex.
Treat this file as the persistent execution charter and product/architecture specification.
Update it whenever architecture decisions, constraints, or risks materially change.

## Agent operating contract

1. Read this file fully before changing code.
2. Keep this file current. When an architectural or design decision changes, revise the affected section — do not maintain a dated completion ledger here.
3. Work autonomously in small, verifiable increments until acceptance criteria are met.
4. Do not stop at scaffolding. Leave the repository with a working vertical slice.
5. Follow TDD where practical:
   - write a failing test
   - implement the minimum code
   - make the test pass
   - refactor safely
6. Never disable tests, typechecks, lint rules, or security checks to move faster.
7. The runtime architecture is browser-first. Do not restore Electron IPC or renderer assumptions as the primary path.
8. Prefer structured schemas, explicit persistence models, and explicit failure states.
9. Preserve a minimal, modern, internal-scrollable UI.
10. If a better implementation detail is discovered, update this file before or alongside the code.
11. Before declaring a phase complete, run the relevant verification command.
12. When making changes, validate the local command path used by GitHub Actions before handoff; today that means running `pnpm ci:full` (lint, typecheck, unit tests, security). End-to-end Playwright runs are not part of CI today; run them separately with `pnpm exec playwright test` when a change affects the e2e surface.

## Product vision

Build a local-first Hermes frontend with:

- a browser-based chat interface with streaming markdown
- real Hermes profile and session browsing
- persisted local Spaces attached to sessions, with synchronized markdown/table/card content representations, extensible content-first tabs, and combined session+space workspaces
- jobs / cron visibility
- tool listing and reviewed tool execution history
- explicit disconnected, degraded, error, and empty states
- clean restart-safe persistence for hundreds of chats and thousands of messages

## Core product principles

1. Chat-first: chat is the default landing page.
2. Bridge-first: the browser talks only to a thin local bridge over HTTP and SSE.
3. Real data only: no synthetic `Local Profile`, fake sessions, or placeholder jobs presented as real state.
4. Local-first persistence: the app works from durable local state and survives restart cleanly.
5. Loud correctness: failures should surface clearly so they can be fixed.
6. Secure by default: dangerous actions stay behind explicit approval and capability boundaries.

## Architecture target

Monorepo layout:

- `apps/bridge`: local Node bridge service
- `apps/web`: Vite + React + TypeScript browser app
- `packages/protocol`: shared schemas and API contracts
- `packages/ui`: shared Chakra provider and theme helpers
- `packages/config`: shared lint configuration
- `packages/testing`: cross-package test utilities
- `docs/specs`: canonical product and architecture notes
- `scripts`: developer and security scripts

Tech stack target:

- Vite
- React
- TypeScript
- Chakra UI
- Zod
- SQLite
- Vitest
- Playwright
- Turbo + pnpm workspaces

## Runtime requirements

Frontend:

- Vite + React + TypeScript
- Chakra UI
- atomic design structure under:
  - `atoms`
  - `molecules`
  - `organisms`
  - `templates`
  - `pages`
- browser-first only
- no Electron renderer assumptions
- responsive, internal-scrollable shell
- dark mode / light mode

Bridge:

- local-only thin service
- HTTP + SSE transport
- Hermes CLI integration for:
  - profile discovery
  - session discovery
  - transcript import/export
  - cron/jobs reads
  - tools reads
  - streaming assistant updates
  - persistence access
  - reviewed tool execution
- OS-agnostic local data path resolution for macOS/Linux/Windows

Persistence:

- SQLite is the primary local store
- explicit schema for profiles, sessions, messages, jobs cache, tools, tool history, spaces, space events, settings, and UI state
- legacy Electron snapshot import exists only as a one-time migration path into SQLite

## Required UX

Required left nav order:

- profile selector
- `New session`
- recent sessions
- `Spaces`
- `All sessions`
- `Jobs`
- `Tools`
- `Skills`
- `Settings`

Behavior:

- Chat is the default landing page
- `Spaces` opens a top-level template gallery and pattern-library surface rather than a live runtime workspace
- recent/all-session clicks open the selected session in Chat
- All sessions supports search and pagination
- sessions remain the primary entry point for attached live Spaces; sessions with an attached space show a compact indicator in recent/all-session lists
- opening a session with no attached space shows the normal chat-only layout
- opening a session with an attached space shows the combined workspace layout with space content on the left and chat on the right
- structured-result prompts can implicitly create or update the attached space in the same request, even when the user never says `space`
- Jobs show real Hermes-backed freshness/error/disconnected states
- Tools show compact capability and approval metadata, with `All Tools` and `Tool History` tabs in the page
- Skills show real Hermes-backed runtime skills for the active profile
- Settings contain runtime preferences, unrestricted-access controls, model/provider routing, provider connections, and audit visibility
- all panes scroll internally
- no document-level scrolling in normal use
- theme toggle visible in the top-right

## Delivery phases

### Phase 1 - Real bridge

- define bridge API routes and SSE channel
- define SQLite schema
- integrate with the real Hermes CLI
- validate real local Hermes commands:
  - `hermes profile list`
  - `hermes profile show 8tn`
  - `hermes profile show jbarton`
  - `hermes sessions list --limit 10`
- prove structured bridge responses for profiles, sessions, messages, jobs, tools, and tool history
- add bridge tests before UI work continues

### Phase 2 - Browser shell

- build the Vite/React/Chakra browser shell
- connect it only to the bridge
- remove Electron-specific runtime paths
- remove fake fallback data

### Phase 3 - Persistence and migration

- move runtime persistence to SQLite
- preserve useful legacy local data through a one-time migration path
- keep one clear source of truth for messages and queryable history

### Phase 4 - Product UX

- implement chat, sessions, spaces, jobs, tools, skills, and settings
- stream assistant updates through SSE
- finalize responsive internal-scroll behavior
- add theme switching

## Acceptance criteria

The project is complete when all of the following are true:

- `pnpm install` succeeds
- `pnpm lint` passes
- `pnpm typecheck` passes
- `pnpm test` passes
- `pnpm test:integration` passes
- `pnpm build` passes
- `pnpm security` passes
- `pnpm ci:full` passes locally
- the browser app launches through the local bridge
- the bridge serves real Hermes-backed profile/session/tool/job data plus persisted local spaces
- the UI renders the required left rail with a top-level `Spaces` gallery section, lands on chat by default, and shows attached-space indicators on sessions
- explicit disconnected/error/degraded states render instead of fake fallback data
- prior local data can be migrated safely from legacy Electron snapshots when present

## Test strategy

Unit test requirements:

- protocol schema validation
- SQLite persistence across reopen
- runtime-session collision reconciliation
- bridge bootstrap and transcript import
- session-attached space CRUD, migration, persistence, and chat-linked context
- browser shell error-state and navigation behavior

Integration / e2e test requirements:

- shell loads with required navigation structure
- session browse/resume works
- streaming chat persists across reload
- attached-space session creation/rendering/update/delete and reload persistence work end to end
- tools, tool history, and skills work end to end
- jobs render real fixture data and explicit failure states
- disconnected states are explicit
- internal-scroll layout works without document scrolling

Security requirements:

- dependency vulnerability scan
- static scan for unsafe DOM/code-execution patterns
- reviewed tool execution tests
- threat model kept current

## Design decisions and constraints

Persistence and runtime:

- SQLite is the default local store because it is the simplest practical local-first option and supports queryable history without requiring a separate service.
- Real Hermes sessions are profile-scoped via `HERMES_HOME`. Local associations still matter for migrated local sessions, recents, and restore state, but runtime session ownership follows the active Hermes profile rather than a synthetic bridge-global model.
- The bridge currently starts via `tsx` for `pnpm start` and fixture runs. `pnpm build` verifies the TypeScript compile; packaging the bridge into a standalone runtime is future work.
- `node:sqlite` is still marked experimental by Node. Any Node runtime upgrade must be validated carefully.
- Legacy Electron snapshot import exists only for continuity. SQLite is the runtime source of truth after migration.

Provider and model onboarding:

- Hermes provider onboarding depends on the authoritative `hermes_cli_models/v2` contract emitted from Hermes Python internals. If that contract changes, update the shared protocol schema, CLI serialization, bridge integration, UI renderer, and Hermes-side contract tests together.
- Hermes snapshots one active runtime model/base-URL configuration per profile, so the custom-endpoint adapter can legitimately appear connected whenever the active profile already has a reusable endpoint URL/API key configured. If Hermes later splits per-provider runtime snapshots, update the adapter-state contract, bridge consumption, and UI assumptions together instead of reintroducing bridge heuristics.
- Authoritative onboarding is intentionally fail-loud. If the local Hermes runtime cannot provide valid `hermes_cli_models/v2` payloads, the bridge blocks startup/provider setup with clean `MODEL_PROVIDER_REFRESH_FAILED`, `PROVIDER_AUTH_FAILED`, `PROVIDER_AUTH_POLL_FAILED`, `PROVIDER_CONNECT_FAILED`, or `MODEL_PROVIDER_UPDATE_FAILED` surfaces rather than falling back to TUI parsing.
- MiniMax and MiniMax China key validation uses an Anthropic-style `/v1/messages` probe instead of `/models`, because their `/anthropic/models` path returns `404` even for bad keys. If those upstream APIs change, update the CLI validator and its structured failure tests together.

Security and execution boundaries:

- Reviewed shell execution remains intentionally narrow and read-only. Any expansion must update tests and the threat model together.
- Spaces are intentionally local, structured, and non-executable. Space data is rendered only through predefined Chakra renderers for content/table/card/markdown; arbitrary HTML/JS execution is out of scope and should stay blocked unless the threat model and tests are updated together.

Sessions and transcripts:

- Session rename/delete is intentionally hybrid: the bridge uses Hermes rename/delete when the CLI supports it, but local title overrides and soft-delete state remain the fallback source of truth so the browser can stay consistent even when a remote mutation is unavailable.
- Real email/tool workflows still depend on the active Hermes profile auth state and scopes. The bridge pins email intents to the active profile and preloads `google-workspace` when available, but live results can still legitimately vary between a clean unread count and explicit auth guidance depending on the machine's actual credentials.
- Hermes transcript export does not provide stable request ids for bridge-originated chats. The bridge reconciles imported request ids back onto persisted runtime requests using normalized user-turn preview/order heuristics; if Hermes export formats change materially, update this reconciliation logic and its regression coverage together.
- Transcript sanitization relies on explicit leak-pattern classification across live streaming and transcript import. If Hermes CLI/runtime output shapes change, update the sanitizer and its regression fixtures together instead of allowing new technical content into persisted chat messages.
- Nearby-place timeout handling depends on heuristic intent detection (`restaurant`, `nearby`, `hotel`, etc.) because Hermes does not expose a structured local-search mode. If search request shapes change materially, update the detector and its timeout/progress tests together.

Spaces and workspace contracts:

- The product has two valid Spaces surfaces: the top-level template gallery and session-attached live spaces. Keep that distinction explicit in docs, telemetry, and future UX so the gallery does not get mistaken for a live workspace browser.
- Template-library metadata belongs only in the gallery and inspector surfaces. Keep attached live spaces limited to rendered workspace content plus operational controls, not template-selection guidance or capability badges.
- Workspace tabs remain extensible, but only the `content` tab ships today. If additional tab kinds return later, update the schema, migrations, normalization helpers, and regression coverage together.
- Synchronized content representations are stored eagerly instead of derived lazily. If a new content representation is added later, update the single bridge-side sync pipeline, drift/integrity tests, and migration path together so stored variants do not diverge.
- Rich link/image extraction across markdown/table/card synchronization is heuristic. If Hermes structured output shapes change materially, update the normalization pipeline and the content-renderer regression fixtures together.
- Direct source deletion is intentionally limited to entries whose inferred source is a Gmail message on the active Google Workspace profile. Other entry types only support local removal from the space until a bridge-safe delete contract exists for that integration.

Workspace generation pipeline:

- Template enrichment runs as sequential `selection -> text -> hydration -> actions -> validation/promotion` stages with stage-specific timeouts. Keep timeout classification, prompt packets, full-assistant-context injection, and persisted intermediate artifacts aligned with those stages instead of regressing to one-shot fill/repair assumptions.
- Semantic completeness is a hard gate for `ready`. Template-family minimum-content rules are hand-tuned heuristics; tighten them as real machine failures reveal weak or template-specific empty-success patterns, and do not relax them just to make builds look green.
- Automatic recovery is intentionally limited to mechanical JSON extraction and delimiter completion. Do not add semantic "best guess" repair that invents missing content or rewrites template meaning; if the payload is ambiguous, fail loudly and inspect the persisted raw attempt logs instead.
- The structured-only `hermes-space-data` artifact path allows only one short hidden reissue per request attempt, including `retry_build`, and relies on transcript sanitization to keep that technical prompt/runtime exchange out of the visible chat history.
- Hermes chat does not expose a fully authoritative `--json` response mode for conversational/artifact generation, so the production "structured-only channel" remains a dedicated bounded chat step with a strict marker-plus-balanced-JSON contract. Do not pretend the CLI exposes a native chat JSON transport until Hermes adds one.
- Hermes is still unreliable at emitting anything beyond the minimal seed contract. The bridge ignores invalid optional hints/extensions and owns analysis/enrichment context locally; base-seed schema failures can force Markdown-only Home workspaces until Hermes exposes a stronger native JSON channel.
- The Workspace DSL renderer architecture keeps the Home baseline as the primary reliability layer. Do not let any richer enrichment path replace that baseline until the normalization/rendering path has proven stable under repeated bad-output tests and real-machine telemetry.
- Runtime TSX applets remain in-repo only as dormant experimental code behind `HERMES_EXPERIMENTAL_WORKSPACE_APPLETS=1`. Do not route standard production request, retry, or async enrichment flows back through applet generation unless the product architecture changes explicitly and the DSL-only regression suite is updated first.
- Hermes still lacks a first-class hard tool-disable mode for chat. The dormant experimental applet path keeps its separate single-turn path plus live-activity detection/abort logic; if Hermes later exposes an authoritative no-tools mode, adopt it there instead of weakening the current guardrail.
- Legacy `hermes-ui-workspaces` payloads still need to remain readable during rollout, and prompt-bound `space_delete` remains compatibility-backed today. Keep the compatibility parser and transcript sanitization paths alive until the new `hermes-space-data` contract is fully adopted.
- Template switching is implemented concretely for `local-discovery-comparison -> event-planner`. The registry/contract layer supports more transitions, but additional migrations need explicit preserved-state rules before they should be enabled in production.
- Rebuild workspace streams template retries to completion on the same action request because the browser does not subscribe to a separate background channel for post-action template promotion. Do not move retries back to fire-and-forget background queueing unless a durable live update channel or polling strategy exists first.
- Async enrichment supersession treats the active enrichment build request id as the primary freshness signal and falls back to baseline-attempt metadata plus timestamps when needed. If the space metadata model grows a dedicated async-enrichment request id, update that check and its regression coverage together.
- `workspace_sdk/v1` is the stable richer-workspace binding contract beneath the declarative DSL renderer. If SDK v2 or richer patch operations are added later, update protocol schemas, graph synthesis, DSL normalization, static validation, renderer expectations, and prompt examples together instead of widening only one layer.
- `compiled_home`, `space_ui/v1`, and `space_ui/v2` remain compatibility-only persisted artifacts for older data. Do not reintroduce them into the live request path; remove them entirely once live/runtime and fixture adoption no longer needs the compatibility reader.
- Legacy attached spaces created before refresh metadata existed recover their refresh scope from space events plus transcript history. If Hermes export or event timing changes materially, keep that inference path and its regression coverage aligned instead of falling back to "latest user turn" behavior.

UI and performance:

- Combined-workspace chat-pane collapse is intentionally page-local UI state. It resets when the active session or attached space changes and does not widen the persisted bridge/UI-state contract.
- Draft state is isolated to the composer and historical transcript rows are memoized, but the transcript list is not yet virtualized; initial render and scroll cost scale with full history length until windowing is added.
- `pnpm build` currently passes with a non-blocking Vite chunk-size warning on the main web bundle. Watch bundle growth as more dynamic-space sections/actions are added.

CI and environment:

- GitHub Actions verifies this repo on Node 22 via `.github/workflows/ci.yml` with four parallel jobs: lint, typecheck, unit tests, security. CI-sensitive fixes should validate against the workflow-equivalent path (`pnpm ci:full`). Playwright e2e is not part of CI today; if you reintroduce it, install browsers with `pnpm exec playwright install --with-deps chromium` first.

## Definition of done for each milestone

A milestone is only done when:

- code exists
- tests for the behavior exist
- lint and typecheck pass
- this file is updated if architecture or commands changed
- docs reflect any changed architecture or commands

## Update policy for this file

Revise the sections above in place when architecture, runtime requirements, UX contracts, or design decisions change.
Do not maintain a completion ledger, status prose, or dated verification log here.
Keep this file useful for the next autonomous agent by keeping it timeless and factual.
