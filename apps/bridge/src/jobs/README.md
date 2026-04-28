# Jobs subsystem

## Architecture

```
JobRunner (runner.ts)
  ├── [claude-code]  attachClaudeCodeParser() ──> StreamJsonParser ──> handleClaudeEvent()
  │                                                                         └── emits typed JobEvents
  └── [codex/other]  handleOutput() ──> raw job.stdout / job.stderr events
```

The runner spawns a child process and wires up I/O. For Claude Code jobs, the stdout stream is
handed to `attachClaudeCodeParser` which parses Claude's `--output-format stream-json` output
into typed semantic events. For all other agents (Codex, etc.) stdout/stderr are emitted as raw
`job.stdout` / `job.stderr` chunks as before.

## Event types (Phase 1.5 additions)

| Event type              | When emitted                                       |
|-------------------------|----------------------------------------------------|
| `job.agent_initialized` | `system/init` JSON line — model, session, tools    |
| `job.thinking`          | Extended thinking block from an assistant message  |
| `job.message`           | Text content block from an assistant message       |
| `job.tool_call`         | Tool use block (input truncated if > 3500 bytes)   |
| `job.tool_result`       | Tool result from a user turn                       |
| `job.agent_result`      | `result` JSON line — final status, turns, duration |
| `job.cost_update`       | Per-assistant-turn token/cost accounting (updated) |

The updated `job.cost_update` adds `cacheReadTokens`, `cacheWriteTokens`, and a `cumulative`
object that tracks totals across the entire job run.

## Parser architecture

`StreamJsonParser` (stream-parser.ts) buffers partial lines across `data` chunks, then for each
complete line:
- If the line looks like `{...}`, attempts `JSON.parse`. On success, calls `onJson`.
- Otherwise (plain text or malformed JSON), calls `onRaw`.

`attachClaudeCodeParser` (claude-code.ts) wires the parser to a `ChildProcess`, dispatches
parsed objects to `handleClaudeEvent`, and forwards raw lines as `job.stdout` events.

## Phase 1.7 additions — session-as-unit-of-display

### Session model
A *job* is the unit of persistence and execution. From the UI's perspective, a job is also the unit
of display: one job = one session row in the project list, one continuous conversation timeline.
Turns within a job (via `sendTurn`) are rendered inline without per-turn card boundaries.

### Sort order
`GET /api/projects/:id` and `GET /api/jobs` both sort by `COALESCE(last_turn_at, created_at) DESC`
so the most recently active session always appears first.

### File stats on job summaries
Job objects returned by `GET /api/projects/:id` and `GET /api/jobs` include four computed fields:
- `filesChangedCount` — unique file paths touched across all `Write`/`Edit`/`MultiEdit` tool calls
- `totalLinesAdded` / `totalLinesRemoved` — aggregate line deltas
- `mostRecentTurnText` — text of the most recent user turn (null if only one turn)

These are derived on demand from `coding_job_events` with a single batch query per request. No new
columns are stored in the database.

### New endpoints

#### `GET /api/jobs/:id/files`
Returns a per-file breakdown for the session:
```ts
{ files: Array<{ path, edits, linesAdded, linesRemoved, isNewFile, lastModifiedTurnIndex,
                 currentContent?, currentContentTruncated? }> }
```
`currentContent` is read from disk at request time (absolute path from the tool call input).
Truncated at 100 KB. Returns `undefined` if the file no longer exists.

#### `GET /api/jobs/:id/edits/:toolUseId`
Returns the raw diff data for a specific tool call:
- `Write`: `{ format: 'new_file', content, linesAdded }`
- `Edit` / `str_replace_editor`: `{ format: 'edit', oldString, newString, linesAdded, linesRemoved }`
- Other: `{ format: 'unavailable' }`

The frontend computes the visual diff from this data rather than storing a pre-rendered diff.

### Diff source of truth (Phase 1.7)

| Tool       | Source                                        | Phase 3 upgrade           |
|------------|-----------------------------------------------|---------------------------|
| `Edit`     | `old_string` / `new_string` from event input  | Git worktree `HEAD` diff  |
| `Write`    | `content` from event input (new file, no before) | Worktree diff vs HEAD  |
| `MultiEdit`| Per-entry `old_string` / `new_string`         | Git worktree `HEAD` diff  |

The frontend `FileDiffCard` component computes diffs inline from already-loaded event data for
`Edit` calls. The `/api/jobs/:id/edits/:toolUseId` endpoint provides the data for
`Write`/`MultiEdit` and is the fallback for large events.

### Known limitations / TODOs (Phase 1.7)

- **No Write diffs**: `Write` calls show new file content as a code block, not a true diff.
  Phase 3 (worktree integration) will add `git diff HEAD -- <file>` as the before-state.
- **No real revert**: the "Revert this change" button in the `FileDiffCard` overflow menu is
  disabled ("Coming in Phase 3"). Wiring real reverts requires worktree infrastructure.
- **Event truncation**: `EVENT_PAYLOAD_MAX_BYTES = 4000` means very large `Edit` inputs may be
  stored without `old_string`/`new_string`. `FileDiffCard` falls back gracefully ("Content too
  large to display").
- **Codex**: raw stdout/stderr only. A `StreamJsonParser`-based Codex adapter would need a
  different event schema. Tracked as TODO in codex.ts.
- **Virtual scrolling**: the frontend caps at 500 rendered conversation items (simple slice).
  A proper virtual list should be added if jobs routinely exceed 500 items.
