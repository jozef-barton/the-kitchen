# Threat Model

## Primary threats

1. Malformed Hermes CLI output causing bad bridge state.
2. Cross-origin browser access reaching a local-only bridge.
3. Unsafe local command execution through reviewed tools or explicit unrestricted access.
4. Unsafe browser rendering through markdown or injected HTML.
5. Persistence corruption or bad legacy migration.
6. Silent fallback behavior masking real Hermes failures.
7. Unsafe or malformed Hermes-authored Space payloads causing browser-side code execution or broken local state.
8. Dependency vulnerabilities or unsafe code patterns in the repo.

## Mitigations

- The browser only consumes Zod-validated bridge payloads.
- The bridge only accepts trusted local origins (`localhost`, `127.0.0.1`, `::1`) on expected local ports, and it applies the same policy to SSE and JSON routes.
- Hermes CLI parsing failures surface as explicit bridge errors or degraded cached responses.
- No synthetic `Local Profile`, fake sessions, or placeholder jobs are injected as real data.
- Reviewed shell execution is allowlisted, runs without a shell, stays inside the workspace root, and requires explicit approval.
- Unrestricted Access is an explicit opt-in, disables the restricted turn limiter only when the user confirms the warning, and writes local audit events when it is enabled or used.
- Provider secrets are handed to Hermes auth/config flows and only masked connection metadata is cached in SQLite.
- Markdown renders without raw HTML support.
- Space payloads are validated against typed table/card/markdown schemas before persistence and before browser rendering.
- Spaces render through structured Chakra components only. Arbitrary HTML, JavaScript, and custom component execution are not allowed.
- SQLite is the durable source of truth, not local browser storage.
- Legacy Electron snapshots are imported once into SQLite only when the database is empty.
- Session/runtime collisions are reconciled in SQLite instead of crashing on unique constraints.

## Reviewed tool allowlist

The bridge currently allows reviewed execution only for:

- `pwd`
- `ls`
- `rg`
- `cat`
- `head`
- `tail`
- `sed -n <range>p <file>`
- `git status`
- `git diff --stat`
- `git rev-parse --show-toplevel`
- `git branch --show-current`
- `git log --oneline -n <N>`

Any expansion must update tests and this document together.

## `--public` mode (LAN binding)

`--public` is an explicit opt-in CLI flag that widens the bridge's trust surface beyond loopback:

- The bridge binds to `0.0.0.0` instead of `127.0.0.1`.
- Host headers in RFC1918 ranges (`10/8`, `172.16/12`, `192.168/16`), IPv4 link-local (`169.254/16`), IPv6 ULA (`fc00::/7`), and IPv6 link-local (`fe80::/10`) are admitted via a predicate-based extension to `evaluateLocalOriginPolicy`. Public IP addresses are still rejected.
- CSRF header checking (`x-hermes-bridge: 1`) and Origin validation remain active — any state-changing request without the CSRF header is still rejected.
- There is **no authentication**. Any device that can reach the bridge over the local network has full access. The trust boundary is the network itself.
- `--public` is a process-config flag; it is not persisted in the database and cannot be toggled via the UI.
- A security banner is printed to stderr on startup and shown in the terminal and the Local Network tab of the Remote Access page.

## Verification hooks

- `pnpm security` runs dependency audit plus a repository scan for unsafe DOM/code-execution patterns.
- `packages/protocol/src/index.test.ts` covers malformed schema inputs.
- `apps/bridge/src/database.test.ts` covers restart persistence and runtime-session collision handling.
- `apps/bridge/src/server.test.ts` covers bridge bootstrap, transcript import, local-origin policy, jobs/tools/skills/model-provider visibility, space CRUD, space chat context, streaming chat, unread-email regressions, reviewed tool history, degraded states, and legacy migration.
- `apps/web/src/App.test.tsx` covers browser error-state, navigation, model/provider settings, unrestricted access controls, transcript/runtime separation, space rendering, and runtime activity behavior.
- `apps/web/e2e/app.spec.ts` covers shell loading, compact recent sessions, compact runtime activity, session browse/resume, streaming chat persistence, spaces flows, jobs/tools/tool-history/skills flows, disconnected states, and internal scrolling.
