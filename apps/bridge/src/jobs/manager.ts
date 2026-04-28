import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ServerResponse } from 'node:http';
import type { DatabaseSync } from 'node:sqlite';
import type { CodingProject, CodingJob, JobEvent, AgentId } from './types';
import { CodingStore } from './store';
import { JobRunner } from './runner';
import { claudeCodeAdapter } from './agents/claude-code';
import { codexAdapter } from './agents/codex';
import { IntegrationManager } from './integrations';
import { writeSseEvent } from '../http/response';

const ADAPTERS = { 'claude-code': claudeCodeAdapter, codex: codexAdapter };

export class JobManager {
  private store: CodingStore;
  private integrations: IntegrationManager;
  private activeRunners = new Map<string, JobRunner>();
  // SSE subscribers: jobId -> list of response objects
  private sseSubscribers = new Map<string, Set<ServerResponse>>();

  constructor(db: DatabaseSync) {
    this.store = new CodingStore(db);
    this.integrations = new IntegrationManager(this.store);
  }

  // ── Startup cleanup ──────────────────────────────────────────────────────

  cleanupOrphanedJobs() {
    const orphaned = this.store.listJobs().filter(
      j => j.status === 'running' || j.status === 'awaiting_approval' || j.status === 'awaiting_user'
    );

    let autoResumed = 0;
    let interrupted = 0;

    for (const job of orphaned) {
      // Kill the old process if somehow still alive
      if (job.pid) {
        try { process.kill(job.pid, 'SIGTERM'); } catch { /* already dead */ }
      }

      // Jobs that were idle waiting for the user — we can silently reconnect the session.
      // The user won't notice the restart; they just send their next message as usual.
      if (job.agentSessionId && job.status === 'awaiting_user') {
        const project = this.store.getProject(job.projectId);
        if (project) {
          try {
            this.startJob(job, project, job.agentSessionId);
            // startJob sets status → 'running'; set it back to awaiting_user
            // since we haven't sent any new input — the session is just reconnected.
            this.store.updateJobStatus(job.id, 'awaiting_user');
            autoResumed++;
            continue;
          } catch {
            // fall through to interrupted
          }
        }
      }

      // Jobs that were actively running or where auto-resume failed —
      // mark interrupted so the user can decide whether to resume.
      if (job.agentSessionId) {
        this.store.updateJobStatus(job.id, 'interrupted', { error: 'bridge_restarted', completedAt: Date.now() });
        this.store.insertEvent(job.id, { type: 'job.failed', jobId: job.id, error: 'bridge_restarted_interrupted', ts: Date.now() });
      } else {
        this.store.updateJobStatus(job.id, 'failed', { error: 'bridge_restarted', completedAt: Date.now() });
        this.store.insertEvent(job.id, { type: 'job.failed', jobId: job.id, error: 'bridge_restarted', ts: Date.now() });
      }
      interrupted++;
    }

    if (autoResumed > 0) console.warn(`[coding] Auto-resumed ${autoResumed} session(s) on bridge start`);
    if (interrupted > 0) console.warn(`[coding] Marked ${interrupted} orphaned job(s) as interrupted`);
  }

  // ── Projects ────────────────────────────────────────────────────────────

  createProject(name: string, repoPath: string, defaultApprovalMode: CodingJob['approvalMode'] = 'auto_safe'): CodingProject {
    const abs = path.resolve(repoPath);
    if (!fs.existsSync(abs)) fs.mkdirSync(abs, { recursive: true });
    const now = Date.now();
    return this.store.createProject({ id: randomUUID(), name, repoPath: abs, createdAt: now, updatedAt: now, defaultApprovalMode });
  }

  getProject(id: string) { return this.store.getProject(id); }
  listProjects() { return this.store.listProjects(); }
  deleteProject(id: string) { this.store.deleteProject(id); }
  updateProjectApprovalMode(id: string, mode: CodingJob['approvalMode']) {
    this.store.updateProjectApprovalMode(id, mode);
  }

  // ── Jobs ─────────────────────────────────────────────────────────────────

  async createAndStartJob(opts: {
    projectId: string;
    prompt: string;
    agent: AgentId;
    approvalMode: CodingJob['approvalMode'];
    confirmAutoAll?: boolean;
    resumeSessionId?: string;
  }): Promise<CodingJob> {
    const project = this.store.getProject(opts.projectId);
    if (!project) throw new Error(`Project not found: ${opts.projectId}`);

    // Validate auto_all without worktree requires explicit confirmation (Phase 1 has no worktrees)
    if (opts.approvalMode === 'auto_all' && !opts.confirmAutoAll) {
      const err: Error & { code?: string } = new Error(
        'auto_all mode will modify your repo directly without worktree isolation. ' +
        'Pass confirmAutoAll: true to proceed.'
      );
      err.code = 'AUTO_ALL_REQUIRES_CONFIRMATION';
      throw err;
    }

    // Pre-job integration health gate (fast path: detect only)
    const cachedIntegration = this.store.getIntegration(opts.agent);
    const fiveMinutes = 5 * 60 * 1000;
    const needsCheck = !cachedIntegration || (Date.now() - cachedIntegration.lastCheckedAt) > fiveMinutes;

    if (needsCheck) {
      const adapter = ADAPTERS[opts.agent];
      if (!adapter) throw new Error(`Unknown agent: ${opts.agent}`);
      const detection = await adapter.detect();
      await this.integrations.cacheDetection(opts.agent, detection);
      if (!detection.installed) {
        const cmds = adapter.installCommands();
        const err: Error & { code?: string; installCommands?: unknown; docsUrl?: string } = new Error(
          `${adapter.name} CLI not found on PATH.`
        );
        err.code = 'AGENT_NOT_INSTALLED';
        err.installCommands = cmds;
        err.docsUrl = adapter.installDocsUrl;
        throw err;
      }
    } else if (cachedIntegration && !cachedIntegration.installed) {
      const adapter = ADAPTERS[opts.agent];
      const err: Error & { code?: string } = new Error(`${adapter?.name ?? opts.agent} is not installed.`);
      err.code = 'AGENT_NOT_INSTALLED';
      throw err;
    }

    const job: CodingJob = {
      id: randomUUID(),
      projectId: opts.projectId,
      prompt: opts.prompt,
      agent: opts.agent,
      status: 'queued',
      approvalMode: opts.approvalMode,
      createdAt: Date.now(),
      autoRespondRules: [],
      resumeSessionId: opts.resumeSessionId,
      turnCount: 0,
    };

    this.store.createJob(job);
    this.startJob(job, project);
    return this.store.getJob(job.id)!;
  }

  private startJob(job: CodingJob, project: CodingProject, resumeSessionId?: string) {
    const adapter = ADAPTERS[job.agent];
    if (!adapter) throw new Error(`No adapter for agent: ${job.agent}`);

    // Ensure the working directory exists — it may have been deleted since project creation
    const workDir = job.worktreePath ?? project.repoPath;
    if (!fs.existsSync(workDir)) {
      fs.mkdirSync(workDir, { recursive: true });
    }

    const jobWithResume = resumeSessionId
      ? { ...job, resumeSessionId }
      : job;

    const runner = new JobRunner(
      { ...jobWithResume, worktreePath: job.worktreePath ?? project.repoPath },
      adapter,
      {
        onEvent: (event) => {
          this.store.insertEvent(job.id, event);

          // Persist the session ID from Claude Code for stay-alive mode
          if (event.type === 'job.agent_initialized' && event.sessionId) {
            this.store.updateJobAgentSessionId(job.id, event.sessionId);
          }

          // When a turn completes, check for pending queued turns
          if (event.type === 'job.agent_result') {
            this.onTurnComplete(job.id);
          }

          this.broadcast(job.id, event);
        },
        onExit: (exitCode, error) => {
          this.activeRunners.delete(job.id);
          if (error) {
            this.store.updateJobStatus(job.id, 'failed', { error, completedAt: Date.now() });
          } else {
            this.store.updateJobStatus(job.id, 'completed', { exitCode: exitCode ?? 0, completedAt: Date.now() });
          }
        },
        onNeedsApproval: (_approvalId, approval) => {
          this.store.updateJobStatus(job.id, 'awaiting_approval', { approvalPending: approval });
          const event: JobEvent = { type: 'job.needs_approval', jobId: job.id, ...approval, ts: Date.now() };
          this.store.insertEvent(job.id, event);
          this.broadcast(job.id, event);
        },
        onUnexpectedExit: () => {
          const currentJob = this.store.getJob(job.id);
          if (!currentJob) return;
          if (currentJob.agentSessionId) {
            this.store.updateJobStatus(job.id, 'interrupted', { completedAt: Date.now() });
          } else {
            this.store.updateJobStatus(job.id, 'failed', { error: 'unexpected_exit', completedAt: Date.now() });
          }
        }
      }
    );

    this.activeRunners.set(job.id, runner);
    this.store.updateJobStatus(job.id, 'running', { startedAt: Date.now() });
    runner.start();
  }

  /**
   * Called when a turn completes (job.agent_result fires).
   * Checks for pending queued turns and delivers next one, or transitions to awaiting_user.
   */
  private onTurnComplete(jobId: string) {
    const job = this.store.getJob(jobId);
    if (!job) return;

    // Update turn count
    const turns = this.store.getTurns(jobId);
    const now = Date.now();
    this.store.updateJobTurnCount(jobId, turns.length, now);

    const pendingTurns = this.store.getPendingTurns(jobId);
    if (pendingTurns.length > 0) {
      // Deliver next queued turn
      const nextTurn = pendingTurns[0]!;
      const runner = this.activeRunners.get(jobId);
      if (runner) {
        runner.sendTurn(nextTurn.text, nextTurn.id);
        this.store.updateTurn(nextTurn.id, { status: 'delivered', deliveredAt: now });
        const event: JobEvent = {
          type: 'job.user_turn',
          jobId,
          turnId: nextTurn.id,
          turnIndex: nextTurn.turnIndex,
          text: nextTurn.text,
          ts: now
        };
        this.store.insertEvent(jobId, event);
        this.broadcast(jobId, event);
        // Status stays 'running'
      }
    } else {
      // No pending turns — wait for user
      this.store.updateJobStatus(jobId, 'awaiting_user');
      const event: JobEvent = { type: 'job.awaiting_user', jobId, ts: now };
      this.store.insertEvent(jobId, event);
      this.broadcast(jobId, event);
    }
  }

  /**
   * Send a new user turn to a running/awaiting job.
   */
  async sendTurn(jobId: string, text: string): Promise<{ turnId: string; turnIndex: number; queued?: boolean } | null> {
    const job = this.store.getJob(jobId);
    if (!job) return null;

    // Terminal states — reject
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return null;
    }

    // Awaiting approval — 409
    if (job.status === 'awaiting_approval') {
      const err: Error & { code?: string } = new Error('Job is awaiting approval, cannot accept turn');
      err.code = 'AWAITING_APPROVAL';
      throw err;
    }

    const existingTurns = this.store.getTurns(jobId);
    const turnIndex = existingTurns.length; // 0-indexed; first user turn after initial prompt = 1
    const turnId = randomUUID();
    const now = Date.now();

    const turn = this.store.createTurn({
      id: turnId,
      jobId,
      turnIndex,
      text,
      createdAt: now,
      status: 'pending'
    });

    if (job.status === 'running') {
      // Queue turn — will be delivered when current turn completes
      return { turnId: turn.id, turnIndex: turn.turnIndex, queued: true };
    }

    if (job.status === 'awaiting_user' || job.status === 'queued') {
      const runner = this.activeRunners.get(jobId);
      if (runner) {
        runner.sendTurn(text, turnId);
        this.store.updateTurn(turnId, { status: 'delivered', deliveredAt: now });
        this.store.updateJobStatus(jobId, 'running');

        const event: JobEvent = {
          type: 'job.user_turn',
          jobId,
          turnId,
          turnIndex: turn.turnIndex,
          text,
          ts: now
        };
        this.store.insertEvent(jobId, event);
        this.broadcast(jobId, event);
        return { turnId, turnIndex: turn.turnIndex };
      }
    }

    // Runner not found — turn is pending, return queued
    return { turnId: turn.id, turnIndex: turn.turnIndex, queued: true };
  }

  /**
   * Gracefully end the agent session for a job.
   */
  endJob(jobId: string): boolean {
    const runner = this.activeRunners.get(jobId);
    if (!runner) return false;
    runner.end();
    this.store.updateJobStatus(jobId, 'completed', { completedAt: Date.now() });
    this.activeRunners.delete(jobId);
    return true;
  }

  /**
   * Resume a job that was interrupted (bridge restart while session was alive).
   */
  async resumeInterruptedJob(jobId: string): Promise<boolean> {
    const job = this.store.getJob(jobId);
    if (!job || job.status !== 'interrupted') return false;
    if (!job.agentSessionId) return false;

    const project = this.store.getProject(job.projectId);
    if (!project) return false;

    this.startJob(job, project, job.agentSessionId);
    this.store.updateJobStatus(jobId, 'awaiting_user');

    const event: JobEvent = { type: 'job.session_resumed', jobId, sessionId: job.agentSessionId, ts: Date.now() };
    this.store.insertEvent(jobId, event);
    this.broadcast(jobId, event);
    return true;
  }

  async respond(jobId: string, approvalId: string, response: string, remember: boolean): Promise<boolean> {
    const job = this.store.getJob(jobId);
    if (!job || job.status !== 'awaiting_approval') return false;
    if (job.approvalPending?.approvalId !== approvalId) return false;

    const runner = this.activeRunners.get(jobId);
    if (!runner) return false;

    // Shell approvals (detected from tool_results) need a session restart with bypass mode
    // because --permission-mode acceptEdits cannot be changed at runtime.
    if (approvalId.startsWith('shell-')) {
      const optionIdx = parseInt(response, 10);
      const project = this.store.getProject(job.projectId);
      if (!project) return false;

      if (optionIdx === 2) {
        // Deny — tell the agent to continue without running it
        runner.respond(approvalId, response); // clears pendingApprovalId
        this.store.updateJobStatus(jobId, 'running', { approvalPending: undefined });
        await this.sendTurn(jobId, "Please skip that command and continue without running it.");
      } else {
        // Approve (once or all) — restart with bypassPermissions so the command actually runs
        runner.cancel();
        this.activeRunners.delete(jobId);
        const bypassJob = { ...job, approvalMode: 'auto_all' as CodingJob['approvalMode'] };
        this.store.updateJobStatus(jobId, 'running', { approvalPending: undefined });
        this.startJob(bypassJob, project, job.agentSessionId ?? undefined);
        // Set awaiting_user so sendTurn can queue the continuation
        this.store.updateJobStatus(jobId, 'awaiting_user');
        const msg = optionIdx === 1
          ? "You're approved to run that and similar commands for the rest of this session. Please proceed."
          : "You're approved to run that command. Please proceed.";
        await this.sendTurn(jobId, msg);
      }

      const ev: JobEvent = { type: 'job.approval_resolved', jobId, approvalId, response, ts: Date.now() };
      this.store.insertEvent(jobId, ev);
      this.broadcast(jobId, ev);
      return true;
    }

    const written = runner.respond(approvalId, response);
    if (!written) return false;

    // Persist auto-respond rule if remember=true and category is known
    if (remember && job.approvalPending.category !== 'unknown') {
      const newRule = {
        matchRegex: job.approvalPending.category,
        response,
        createdAt: Date.now()
      };
      const rules = [...job.autoRespondRules, newRule];
      this.store.updateAutoRespondRules(jobId, rules);
    }

    this.store.updateJobStatus(jobId, 'running', { approvalPending: undefined });

    const event: JobEvent = {
      type: 'job.approval_resolved',
      jobId,
      approvalId,
      response,
      ts: Date.now()
    };
    this.store.insertEvent(jobId, event);
    this.broadcast(jobId, event);
    return true;
  }

  cancelJob(id: string): boolean {
    const runner = this.activeRunners.get(id);
    if (runner) {
      runner.cancel();
      this.store.updateJobStatus(id, 'cancelled', { completedAt: Date.now() });
      const event: JobEvent = { type: 'job.failed', jobId: id, error: 'cancelled_by_user', ts: Date.now() };
      this.store.insertEvent(id, event);
      this.broadcast(id, event);
      this.activeRunners.delete(id);
      return true;
    }
    return false;
  }

  getJob(id: string) { return this.store.getJob(id); }
  listJobs(opts?: { projectId?: string; status?: string }) { return this.store.listJobs(opts); }
  getRecentEvents(jobId: string) { return this.store.getRecentEvents(jobId); }
  batchGetJobFileStats(jobIds: string[]) { return this.store.batchGetJobFileStats(jobIds); }
  getJobFileMap(jobId: string) { return this.store.getJobFileMap(jobId); }
  getToolCallEvent(jobId: string, toolUseId: string) { return this.store.getToolCallEvent(jobId, toolUseId); }
  getLogFilePath(jobId: string, index = 0) {
    return this.activeRunners.get(jobId)?.getLogFilePath(index) ??
      path.join(os.homedir(), '.hermes', 'jobs', jobId, `output.${index > 0 ? index + '.' : ''}log`);
  }

  // ── SSE fan-out ───────────────────────────────────────────────────────────

  addSubscriber(jobId: string, res: ServerResponse) {
    if (!this.sseSubscribers.has(jobId)) this.sseSubscribers.set(jobId, new Set());
    this.sseSubscribers.get(jobId)!.add(res);
    res.on('close', () => this.removeSubscriber(jobId, res));
  }

  removeSubscriber(jobId: string, res: ServerResponse) {
    this.sseSubscribers.get(jobId)?.delete(res);
  }

  private broadcast(jobId: string, event: JobEvent) {
    const subs = this.sseSubscribers.get(jobId);
    if (!subs) return;
    for (const res of subs) {
      try { writeSseEvent(res, event); } catch { this.removeSubscriber(jobId, res); }
    }
  }

  // ── Integrations ──────────────────────────────────────────────────────────

  get integrationManager() { return this.integrations; }
}
