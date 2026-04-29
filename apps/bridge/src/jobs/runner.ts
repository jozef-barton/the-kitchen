import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import type { AgentAdapter, ApprovalCategory, CodingJob, JobEvent, PendingApproval } from './types';
import { attachClaudeCodeParser } from './agents/claude-code';
import { attachCodexParser } from './agents/codex';

const SHELL_APPROVAL_RE = /This .{0,60}command.{0,60}requires? approval|requires? your? approval|must be approved before|The following parts? requires? approval|contains multiple operations/i;

const IDLE_THRESHOLD_MS = 20_000;         // wait 20s before first idle event (cold starts take 15-30s)
const IDLE_EMIT_INTERVAL_MS = 30_000;     // emit maybe_idle at most once per 30s
const STUCK_THRESHOLD_MS = 300_000;       // 5 min before "stuck" warning (was 3 min — too aggressive)
const HEARTBEAT_WARNING_IDLE_MS = 300_000; // 5 min — emit heartbeat_warning instead of approval dialog when no in-flight tools
const HEARTBEAT_INTERVAL_MS = 30_000;
const EVENT_PAYLOAD_MAX_BYTES = 4000;
const LOG_ROTATE_BYTES = 50 * 1024 * 1024;

function jobLogDir(jobId: string): string {
  // Store job logs in the same safe directory as the bridge DB (~/Library/Application Support
  // on macOS) so they survive Hermes reinstalls. Falls back to ~/.hermes on non-Mac.
  const base = process.platform === 'darwin'
    ? path.join(os.homedir(), 'Library', 'Application Support', 'Hermes Recipes Browser')
    : path.join(os.homedir(), '.hermes');
  return path.join(base, 'jobs', jobId);
}

export interface RunnerCallbacks {
  onEvent: (event: JobEvent) => void;
  onExit: (exitCode: number | null, error?: string) => void;
  onNeedsApproval: (approvalId: string, approval: PendingApproval) => void;
  onUnexpectedExit?: () => void;
}

export class JobRunner {
  private child: ChildProcess | null = null;
  private lastOutputAt = Date.now();
  private lastIdleEmitAt = 0;
  private outputLineBuffer: string[] = [];
  private logFileIndex = 0;
  private logFileBytesWritten = 0;
  private logFileHandle: fs.WriteStream | null = null;
  private idleCheckTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private stuckCheckTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingApprovalId: string | null = null;
  private stdinClosed = false;
  // Tracks in-flight tool calls (tool_call seen, tool_result not yet received)
  private inFlightToolCalls = new Set<string>();
  private lastInFlightClearedAt = 0;
  // Shell approval detected from a blocked tool_result — surfaced after the turn ends
  private pendingShellApproval: { command: string; category: string } | null = null;
  // Last bash command seen, so we can show the real command in the approval message
  private lastBashCommand = '';
  // True after job.agent_result fires, cleared when a new user turn is sent.
  // While awaiting the user the agent is intentionally idle — don't fire stuck detection.
  private isAwaitingUser = false;
  // Set when the manager deliberately cancels this runner (e.g. shell approval restart).
  // Suppresses job.completed/onExit so the replacement runner can take over cleanly.
  private cancelledByManager = false;

  constructor(
    private readonly job: CodingJob,
    private readonly adapter: AgentAdapter,
    private readonly callbacks: RunnerCallbacks
  ) {}

  start() {
    const logDir = jobLogDir(this.job.id);
    fs.mkdirSync(logDir, { recursive: true });
    this.openLogFile();

    const { command, args, env } = this.adapter.buildCommand({
      prompt: this.job.prompt,
      cwd: this.job.worktreePath ?? process.cwd(),
      approvalMode: this.job.approvalMode,
      resumeSessionId: this.job.resumeSessionId,
      model: this.job.model,
      reasoningEffort: this.job.reasoningEffort
    });

    this.child = spawn(command, args, {
      cwd: this.job.worktreePath ?? process.cwd(),
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Stay-alive mode: stdin stays open.
    // New jobs: send the initial prompt to kick off the conversation.
    // Resumed sessions: just reconnect and wait — don't re-send the original prompt.
    this.stdinClosed = false;
    if (!this.job.resumeSessionId) {
      this.sendUserMessage(this.job.prompt);
    }

    const pid = this.child.pid!;
    this.emit({ type: 'job.started', jobId: this.job.id, pid, ts: Date.now() });

    // Phase 1 auto_all warning
    if (this.job.approvalMode === 'auto_all' && !this.job.worktreePath) {
      this.emit({
        type: 'job.warning',
        jobId: this.job.id,
        message: `⚠ Running in auto_all mode without worktree isolation. Files in the project repo will be modified directly.`,
        ts: Date.now()
      });
    }

    // Use the semantic parsers for claude-code and codex; raw handler for everything else
    if (this.job.agent === 'claude-code') {
      attachClaudeCodeParser(this.child, this.job.id, (event) => {
        this.handleOutput_semantic(event);
      });
    } else if (this.job.agent === 'codex') {
      attachCodexParser(this.child, this.job.id, this.job.model ?? 'unknown', (event) => {
        this.handleOutput_semantic(event);
      });
    } else {
      this.child.stdout?.on('data', (chunk: Buffer) => this.handleOutput(chunk, 'stdout'));
      this.child.stderr?.on('data', (chunk: Buffer) => this.handleOutput(chunk, 'stderr'));
    }

    this.child.on('close', (code) => {
      const wasActive = !this.stdinClosed;
      this.cleanup();

      // If the manager deliberately cancelled this runner (e.g. shell-approval restart),
      // swallow the exit entirely — the replacement runner owns the job from here on.
      if (this.cancelledByManager) return;

      if (wasActive) {
        // Process exited while we expected it to be alive
        this.callbacks.onUnexpectedExit?.();
      }
      if (code === 0 || code !== null) {
        this.emit({ type: 'job.completed', jobId: this.job.id, exitCode: code ?? -1, ts: Date.now() });
        this.callbacks.onExit(code);
      } else {
        this.callbacks.onExit(code);
      }
    });

    this.child.on('error', (err) => {
      this.cleanup();
      const message = err.message;
      this.emit({ type: 'job.failed', jobId: this.job.id, error: message, ts: Date.now() });
      this.callbacks.onExit(null, message);
    });

    this.startIdleDetection();
    this.startHeartbeat();

    // Sanity check: if no stdout/stderr in first 10s, log the full spawn details
    setTimeout(() => {
      if (!this.isExited() && Date.now() - this.lastOutputAt >= 9500) {
        console.warn(`[coding] job ${this.job.id}: no output in first 10s — cmd: ${command} ${args.join(' ')} | cwd: ${this.job.worktreePath ?? process.cwd()}`);
      }
    }, 10000);
  }

  /**
   * Send a user turn to the running agent via stdin (stay-alive mode).
   * Returns false if stdin is closed or the child has exited.
   */
  sendTurn(text: string, _turnId: string): boolean {
    if (this.stdinClosed || this.isExited()) return false;
    this.isAwaitingUser = false; // agent now has work to do again
    return this.sendUserMessage(text);
  }

  /**
   * Gracefully close stdin to end the agent session, then wait for exit.
   */
  end(): void {
    if (this.stdinClosed || !this.child?.stdin) return;
    this.stdinClosed = true;
    try {
      this.child.stdin.end();
    } catch { /* ignore */ }
  }

  private sendUserMessage(text: string): boolean {
    if (!this.child?.stdin || this.isExited()) return false;
    try {
      const msg = { type: 'user', message: { role: 'user', content: text } };
      this.child.stdin.write(JSON.stringify(msg) + '\n');
      return true;
    } catch {
      return false;
    }
  }

  private handleOutput(chunk: Buffer, stream: 'stdout' | 'stderr') {
    this.lastOutputAt = Date.now();
    this.lastIdleEmitAt = 0; // reset so next idle period gets a fresh first event
    const text = chunk.toString('utf8');

    // Write to log file
    this.writeToLog(text);

    // Update line buffer (last 50 lines)
    const lines = text.split('\n');
    this.outputLineBuffer.push(...lines);
    if (this.outputLineBuffer.length > 50) {
      this.outputLineBuffer = this.outputLineBuffer.slice(-50);
    }

    // Emit SSE event (truncate if needed)
    const logFileOffset = this.logFileBytesWritten;
    if (text.length > EVENT_PAYLOAD_MAX_BYTES) {
      const truncatedChunk = text.slice(0, EVENT_PAYLOAD_MAX_BYTES);
      this.emit({
        type: stream === 'stdout' ? 'job.stdout' : 'job.stderr',
        jobId: this.job.id,
        chunk: truncatedChunk,
        truncated: true,
        logFileOffset,
        ts: Date.now()
      });
    } else {
      this.emit({
        type: stream === 'stdout' ? 'job.stdout' : 'job.stderr',
        jobId: this.job.id,
        chunk: text,
        ts: Date.now()
      });
    }

    // Check for cost updates (used by non-Claude-Code agents that support parseCostUpdate)
    const costUpdate = this.adapter.parseCostUpdate(this.outputLineBuffer);
    if (costUpdate) {
      // Legacy cost_update shape for non-Claude-Code agents — emit with zero cache/cumulative fields
      this.emit({
        type: 'job.cost_update',
        jobId: this.job.id,
        tokensIn: costUpdate.tokensIn,
        tokensOut: costUpdate.tokensOut,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        estimatedCostUsd: costUpdate.estimatedCostUsd,
        cumulative: {
          tokensIn: costUpdate.tokensIn,
          tokensOut: costUpdate.tokensOut,
          estimatedCostUsd: costUpdate.estimatedCostUsd,
        },
        ts: Date.now()
      });
    }
  }

  /**
   * Semantic event handler for Claude Code stream-json output.
   * Called by attachClaudeCodeParser in place of handleOutput for claude-code jobs.
   */
  private handleOutput_semantic(event: JobEvent) {
    this.lastOutputAt = Date.now();
    this.lastIdleEmitAt = 0; // reset so next idle period gets a fresh event

    // For raw stdout/stderr chunks, also update the line buffer and write to log
    if (event.type === 'job.stdout' || event.type === 'job.stderr') {
      const chunk = (event as { chunk: string }).chunk;
      this.writeToLog(chunk);
      const lines = chunk.split('\n');
      this.outputLineBuffer.push(...lines);
      if (this.outputLineBuffer.length > 50) {
        this.outputLineBuffer = this.outputLineBuffer.slice(-50);
      }
    }

    // Track in-flight tool calls for stuck heuristic
    if (event.type === 'job.tool_call') {
      const tc = event as Extract<JobEvent, { type: 'job.tool_call' }>;
      this.inFlightToolCalls.add(tc.toolUseId);
      if (/^bash$/i.test(tc.toolName)) {
        this.lastBashCommand = (tc.input.command as string) ?? '';
      }
    }
    if (event.type === 'job.tool_result') {
      const tr = event as Extract<JobEvent, { type: 'job.tool_result' }>;
      this.inFlightToolCalls.delete(tr.toolUseId);
      this.lastInFlightClearedAt = Date.now();
    }

    // Detect shell approval blocks from tool_results.
    // Permission-blocked commands may arrive with is_error=false, so check content regardless.
    if (event.type === 'job.tool_result' && this.pendingApprovalId === null && !this.pendingShellApproval) {
      const te = event as Extract<JobEvent, { type: 'job.tool_result' }>;
      if (SHELL_APPROVAL_RE.test(te.content)) {
        // Use the actual command from the preceding tool_call, not the error text
        const command = this.lastBashCommand || te.content.replace(/^[✗×]\s*/, '').slice(0, 120);
        const category = /\b(pip|npm|pnpm|yarn|brew|apt)\s+install\b/i.test(command) ? 'install'
          : /\b(rm\s+-rf?|del\s+\/|truncate|drop\s+table)\b/i.test(command) ? 'delete'
          : 'shell';
        this.pendingShellApproval = { command, category };
      }
    }

    // After a turn with a blocked shell command: surface the approval card
    // AFTER onTurnComplete sets awaiting_user, then override with awaiting_approval
    if (event.type === 'job.agent_result' && this.pendingShellApproval !== null) {
      const { command, category } = this.pendingShellApproval;
      this.pendingShellApproval = null;
      // Let onTurnComplete run first (sets awaiting_user + broadcasts job.awaiting_user)
      this.callbacks.onEvent(event);
      // Now override: set awaiting_approval so the user's click goes through
      const approvalId = `shell-${Date.now()}`;
      this.pendingApprovalId = approvalId;
      const approval: PendingApproval = {
        approvalId,
        message: `Claude wants to run:\n${command}`,
        options: ['Approve once', 'Approve all in this job', 'Deny'],
        defaultOption: 0,
        category: category as ApprovalCategory,
      };
      // onNeedsApproval already inserts the event and broadcasts — no need to also emit
      this.callbacks.onNeedsApproval(approvalId, approval);
      return; // already called onEvent above
    }

    // Emit file_changed for Write/Edit tool calls
    if (event.type === 'job.tool_call') {
      const tc = event as Extract<JobEvent, { type: 'job.tool_call' }>;
      const filePath = (tc.input.file_path ?? tc.input.path) as string | undefined;
      if (filePath && (tc.toolName === 'Write' || tc.toolName === 'write' ||
          tc.toolName === 'Edit' || tc.toolName === 'edit' ||
          tc.toolName === 'str_replace_editor')) {
        this.emit({
          type: 'job.file_changed',
          jobId: this.job.id,
          path: filePath,
          change: tc.toolName === 'Write' || tc.toolName === 'write' ? 'add' : 'modify',
          ts: Date.now()
        });
      }
    }

    // When a turn completes, the agent is now intentionally idle waiting for user input.
    if (event.type === 'job.agent_result') {
      this.isAwaitingUser = true;
    }

    this.callbacks.onEvent(event);
  }

  private startIdleDetection() {
    this.idleCheckTimer = setInterval(() => {
      const idleMs = Date.now() - this.lastOutputAt;
      if (idleMs >= IDLE_THRESHOLD_MS && this.child?.pid && !this.isExited()) {
        // Throttle idle events — emit at most once per IDLE_EMIT_INTERVAL_MS
        const now = Date.now();
        if (now - this.lastIdleEmitAt >= IDLE_EMIT_INTERVAL_MS) {
          this.lastIdleEmitAt = now;
          this.emit({ type: 'job.maybe_idle', jobId: this.job.id, idleMs, ts: now });
        }

        // Check approval patterns regardless of emit throttle
        if (this.pendingApprovalId === null) {
          this.checkApprovalPatterns();
        }
      }
    }, 1000);

    // Stuck detection: two-tier — heartbeat warning (no dialog) vs approval dialog
    this.stuckCheckTimer = setInterval(() => {
      const idleMs = Date.now() - this.lastOutputAt;
      if (idleMs < HEARTBEAT_WARNING_IDLE_MS || !this.child?.pid || this.isExited()) return;
      if (this.pendingApprovalId !== null) return;
      // Agent completed a turn and is waiting for the user — this is intentional idle, not a stuck state.
      if (this.isAwaitingUser) return;

      const hasInFlightTools = this.inFlightToolCalls.size > 0;
      const toolsJustCleared = (Date.now() - this.lastInFlightClearedAt) < 60_000;
      // Exclude [event:system] JSON lines from the stuck message — they are internal
      // protocol frames, not meaningful "last output" for a human to read.
      const meaningfulLines = this.outputLineBuffer.filter(
        l => l.trim() && !l.trimStart().startsWith('[event:')
      );
      const hasOutputHistory = meaningfulLines.length > 0;

      // If tools are in-flight or were recently running, the agent is actively working — no alert.
      if (hasInFlightTools || toolsJustCleared) return;

      // If there's output history, fire a real stuck approval dialog.
      if (hasOutputHistory) {
        const stuckApprovalId = `stuck-${this.lastOutputAt}`;
        this.pendingApprovalId = stuckApprovalId;
        const lastLine = meaningfulLines.at(-1) ?? '';
        const approval: PendingApproval = {
          approvalId: stuckApprovalId,
          message: `Agent appears stuck. Last output was: ${lastLine}`,
          options: ['Continue waiting', 'Cancel job', 'Type custom input'],
          defaultOption: 0,
          category: 'unknown'
        };
        this.emit({
          type: 'job.needs_approval', jobId: this.job.id, ...approval, ts: Date.now()
        });
        this.callbacks.onNeedsApproval(stuckApprovalId, approval);
      } else {
        // No output at all — emit a soft heartbeat warning, not an approval dialog
        this.emit({
          type: 'job.heartbeat_warning',
          jobId: this.job.id,
          idleMs,
          message: 'No activity for 5 min — agent may still be processing',
          ts: Date.now()
        });
      }
    }, STUCK_THRESHOLD_MS);
  }

  private checkApprovalPatterns() {
    const lines = this.outputLineBuffer;
    const joined = lines.join('\n');

    for (const pattern of this.adapter.approvalPatterns) {
      const match = joined.match(pattern.regex);
      if (!match) continue;

      const extracted = pattern.extract(match, lines);
      const { category, defaultOption } = extracted;

      // Check auto-respond rules first (simple category string match)
      const autoRule = this.job.autoRespondRules.find(r => r.matchRegex === category);
      if (autoRule) {
        this.writeStdin(autoRule.response);
        this.emit({ type: 'job.approval_resolved', jobId: this.job.id, approvalId: `auto-${Date.now()}`, response: autoRule.response, ts: Date.now() });
        return;
      }

      // Apply approval mode logic
      const isAutoApprove =
        this.job.approvalMode === 'auto_all' ||
        (this.job.approvalMode === 'auto_safe' && category === 'edit');

      if (isAutoApprove) {
        const defaultIdx = defaultOption ?? 0;
        const defaultResponse = String(defaultIdx);
        this.writeStdin(defaultResponse);
        this.emit({ type: 'job.approval_resolved', jobId: this.job.id, approvalId: `auto-${Date.now()}`, response: defaultResponse, ts: Date.now() });
        return;
      }

      // Surface to UI
      const approvalId = `approval-${Date.now()}`;
      this.pendingApprovalId = approvalId;
      this.emit({
        type: 'job.needs_approval',
        jobId: this.job.id,
        approvalId,
        message: extracted.message,
        options: extracted.options,
        defaultOption: extracted.defaultOption,
        category,
        ts: Date.now()
      });
      const approval: PendingApproval = {
        approvalId,
        message: extracted.message,
        options: extracted.options,
        defaultOption: extracted.defaultOption,
        category
      };
      this.callbacks.onNeedsApproval(approvalId, approval);
      return;
    }
  }

  writeStdin(text: string): boolean {
    if (!this.child?.stdin || this.isExited() || this.stdinClosed) return false;
    try {
      this.child.stdin.write(text + '\n');
      return true;
    } catch {
      return false;
    }
  }

  respond(approvalId: string, response: string): boolean {
    if (this.pendingApprovalId !== approvalId) return false;
    this.writeStdin(response);
    this.pendingApprovalId = null;
    return true;
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (!this.isExited()) {
        this.emit({ type: 'job.heartbeat', jobId: this.job.id, lastActivity: this.lastOutputAt, ts: Date.now() });
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private isExited(): boolean {
    return this.child === null || this.child.exitCode !== null || this.child.killed;
  }

  private openLogFile() {
    const logPath = path.join(jobLogDir(this.job.id), `output.${this.logFileIndex > 0 ? this.logFileIndex + '.' : ''}log`);
    this.logFileHandle?.end();
    this.logFileHandle = fs.createWriteStream(logPath, { flags: 'a' });
    this.logFileBytesWritten = 0;
  }

  private writeToLog(text: string) {
    if (!this.logFileHandle) return;
    const bytes = Buffer.byteLength(text, 'utf8');
    this.logFileBytesWritten += bytes;
    this.logFileHandle.write(text);
    if (this.logFileBytesWritten >= LOG_ROTATE_BYTES) {
      this.logFileIndex++;
      this.openLogFile();
    }
  }

  cancel() {
    this.cancelledByManager = true; // suppresses job.completed on exit
    if (this.child && !this.isExited()) {
      this.stdinClosed = true;
      try { this.child.kill('SIGTERM'); } catch { /* ignore */ }
      setTimeout(() => {
        try { this.child?.kill('SIGKILL'); } catch { /* ignore */ }
      }, 3000);
    }
    this.cleanup();
  }

  getLogFilePath(index = 0): string {
    return path.join(jobLogDir(this.job.id), `output.${index > 0 ? index + '.' : ''}log`);
  }

  private emit(event: JobEvent) {
    this.callbacks.onEvent(event);
  }

  private cleanup() {
    if (this.idleCheckTimer) clearInterval(this.idleCheckTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.stuckCheckTimer) clearInterval(this.stuckCheckTimer);
    this.logFileHandle?.end();
    this.logFileHandle = null;
    this.child = null;
  }
}
