import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type { CodingProject, CodingJob, JobTurn, JobEvent, AgentIntegrationRow, AutoRespondRule, PendingApproval, AgentId, JobFileStats, FileSummaryStats, ApprovalMode } from './types';

const EVENT_PAYLOAD_MAX_BYTES = 400_000; // large enough for full file content

export class CodingStore {
  constructor(private readonly db: DatabaseSync) {}

  // ── Migration (called from bridge-database.ts migrate()) ──────────────

  static migrate(db: DatabaseSync) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS coding_projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        repo_path TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        memory_path TEXT,
        default_approval_mode TEXT NOT NULL DEFAULT 'auto_safe'
      );

      CREATE TABLE IF NOT EXISTS coding_jobs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES coding_projects(id),
        prompt TEXT NOT NULL,
        title TEXT,
        agent TEXT NOT NULL,
        status TEXT NOT NULL,
        approval_mode TEXT NOT NULL,
        worktree_path TEXT,
        pid INTEGER,
        created_at INTEGER NOT NULL,
        started_at INTEGER,
        completed_at INTEGER,
        exit_code INTEGER,
        error TEXT,
        approval_pending TEXT,
        auto_respond_rules TEXT NOT NULL DEFAULT '[]',
        resume_session_id TEXT,
        session_id TEXT,
        agent_session_id TEXT,
        turn_count INTEGER NOT NULL DEFAULT 0,
        last_turn_at INTEGER,
        viewed_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS coding_job_turns (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL REFERENCES coding_jobs(id),
        turn_index INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        delivered_at INTEGER,
        status TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_job_turns_job ON coding_job_turns(job_id, turn_index);

      CREATE TABLE IF NOT EXISTS coding_job_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL REFERENCES coding_jobs(id),
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_coding_job_events_job ON coding_job_events(job_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_coding_job_events_type ON coding_job_events(job_id, type);
      CREATE INDEX IF NOT EXISTS idx_coding_jobs_status ON coding_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_coding_jobs_project ON coding_jobs(project_id);

      CREATE TABLE IF NOT EXISTS coding_integrations (
        id TEXT PRIMARY KEY,
        installed INTEGER NOT NULL DEFAULT 0,
        enabled INTEGER NOT NULL DEFAULT 1,
        version TEXT,
        binary_path TEXT,
        auth_status TEXT NOT NULL DEFAULT 'unchecked',
        auth_message TEXT,
        account TEXT,
        last_checked_at INTEGER NOT NULL DEFAULT 0,
        last_diagnostic TEXT
      );
    `);

    // Add columns to existing DBs — ignore errors when column already exists.
    try { db.exec('ALTER TABLE coding_jobs ADD COLUMN resume_session_id TEXT'); } catch { /* ok */ }
    try { db.exec('ALTER TABLE coding_jobs ADD COLUMN session_id TEXT'); } catch { /* ok */ }
    try { db.exec('ALTER TABLE coding_jobs ADD COLUMN agent_session_id TEXT'); } catch { /* ok */ }
    try { db.exec('ALTER TABLE coding_jobs ADD COLUMN turn_count INTEGER NOT NULL DEFAULT 0'); } catch { /* ok */ }
    try { db.exec('ALTER TABLE coding_jobs ADD COLUMN last_turn_at INTEGER'); } catch { /* ok */ }
    try { db.exec("ALTER TABLE coding_projects ADD COLUMN default_approval_mode TEXT NOT NULL DEFAULT 'auto_safe'"); } catch { /* ok */ }
    try { db.exec('ALTER TABLE coding_jobs ADD COLUMN model TEXT'); } catch { /* ok */ }
    try { db.exec('ALTER TABLE coding_jobs ADD COLUMN reasoning_effort TEXT'); } catch { /* ok */ }
    try { db.exec('ALTER TABLE coding_jobs ADD COLUMN title TEXT'); } catch { /* ok */ }
    try { db.exec('ALTER TABLE coding_jobs ADD COLUMN viewed_at INTEGER'); } catch { /* ok */ }
    try { db.exec('ALTER TABLE coding_integrations ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1'); } catch { /* ok */ }
    // Index for type-filtered event queries (batchGetJobFileStats, etc.)
    try { db.exec('CREATE INDEX IF NOT EXISTS idx_coding_job_events_type ON coding_job_events(job_id, type)'); } catch { /* ok */ }
  }

  // ── Projects ────────────────────────────────────────────────────────────

  createProject(project: CodingProject): CodingProject {
    this.db.prepare(`
      INSERT INTO coding_projects (id, name, repo_path, created_at, updated_at, memory_path, default_approval_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(project.id, project.name, project.repoPath, project.createdAt, project.updatedAt,
      project.memoryPath ?? null, project.defaultApprovalMode ?? 'auto_safe');
    return project;
  }

  updateProjectApprovalMode(id: string, mode: ApprovalMode) {
    this.db.prepare('UPDATE coding_projects SET default_approval_mode = ?, updated_at = ? WHERE id = ?')
      .run(mode, Date.now(), id);
  }

  getProject(id: string): CodingProject | null {
    const row = this.db.prepare('SELECT * FROM coding_projects WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? this.rowToProject(row) : null;
  }

  listProjects(): CodingProject[] {
    const rows = this.db.prepare('SELECT * FROM coding_projects ORDER BY updated_at DESC').all() as Record<string, unknown>[];
    return rows.map((r) => this.rowToProject(r));
  }

  deleteProject(id: string) {
    this.db.prepare('DELETE FROM coding_projects WHERE id = ?').run(id);
  }

  private rowToProject(row: Record<string, unknown>): CodingProject {
    return {
      id: row.id as string,
      name: row.name as string,
      repoPath: row.repo_path as string,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
      memoryPath: row.memory_path as string | undefined,
      defaultApprovalMode: (row.default_approval_mode as ApprovalMode | undefined) ?? 'auto_safe',
    };
  }

  // ── Jobs ────────────────────────────────────────────────────────────────

  createJob(job: CodingJob): CodingJob {
    this.db.prepare(`
      INSERT INTO coding_jobs
        (id, project_id, prompt, title, agent, status, approval_mode, model, reasoning_effort,
         worktree_path, pid, created_at, started_at, completed_at, exit_code, error,
         approval_pending, auto_respond_rules, resume_session_id, session_id,
         agent_session_id, turn_count, last_turn_at, viewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      job.id, job.projectId, job.prompt, job.title ?? null, job.agent, job.status, job.approvalMode,
      job.model ?? null, job.reasoningEffort ?? null,
      job.worktreePath ?? null, job.pid ?? null, job.createdAt,
      job.startedAt ?? null, job.completedAt ?? null, job.exitCode ?? null,
      job.error ?? null,
      job.approvalPending ? JSON.stringify(job.approvalPending) : null,
      JSON.stringify(job.autoRespondRules),
      job.resumeSessionId ?? null,
      job.sessionId ?? null,
      job.agentSessionId ?? null,
      job.turnCount ?? 0,
      job.lastTurnAt ?? null,
      job.viewedAt ?? null
    );
    return job;
  }

  updateJobTitle(jobId: string, title: string): void {
    this.db.prepare('UPDATE coding_jobs SET title = ? WHERE id = ?').run(title, jobId);
  }

  markJobViewed(jobId: string, ts: number): void {
    // Only set on the first view — preserves "never opened" state if explicitly cleared.
    this.db.prepare('UPDATE coding_jobs SET viewed_at = ? WHERE id = ? AND viewed_at IS NULL').run(ts, jobId);
  }

  updateJobSessionId(jobId: string, sessionId: string) {
    this.db.prepare('UPDATE coding_jobs SET session_id = ? WHERE id = ?').run(sessionId, jobId);
  }

  updateJobAgentSessionId(jobId: string, agentSessionId: string) {
    this.db.prepare('UPDATE coding_jobs SET agent_session_id = ?, session_id = ? WHERE id = ?')
      .run(agentSessionId, agentSessionId, jobId);
  }

  updateJobTurnCount(jobId: string, turnCount: number, lastTurnAt: number) {
    this.db.prepare('UPDATE coding_jobs SET turn_count = ?, last_turn_at = ? WHERE id = ?')
      .run(turnCount, lastTurnAt, jobId);
  }

  getJob(id: string): CodingJob | null {
    const row = this.db.prepare('SELECT * FROM coding_jobs WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? this.rowToJob(row) : null;
  }

  listJobs(opts?: { projectId?: string; status?: string }): CodingJob[] {
    let sql = 'SELECT * FROM coding_jobs WHERE 1=1';
    const params: unknown[] = [];
    if (opts?.projectId) { sql += ' AND project_id = ?'; params.push(opts.projectId); }
    if (opts?.status) { sql += ' AND status = ?'; params.push(opts.status); }
    sql += ' ORDER BY COALESCE(last_turn_at, created_at) DESC';
    const rows = this.db.prepare(sql).all(...(params as SQLInputValue[])) as Record<string, unknown>[];
    return rows.map((r) => this.rowToJob(r));
  }

  updateJobStatus(id: string, status: CodingJob['status'], extra?: Partial<CodingJob>) {
    const fields: string[] = ['status = ?'];
    const values: unknown[] = [status];
    if (extra?.pid !== undefined) { fields.push('pid = ?'); values.push(extra.pid); }
    if (extra?.startedAt !== undefined) { fields.push('started_at = ?'); values.push(extra.startedAt); }
    if (extra?.completedAt !== undefined) { fields.push('completed_at = ?'); values.push(extra.completedAt); }
    if (extra?.exitCode !== undefined) { fields.push('exit_code = ?'); values.push(extra.exitCode); }
    if (extra?.error !== undefined) { fields.push('error = ?'); values.push(extra.error); }
    if (extra?.approvalPending !== undefined) {
      fields.push('approval_pending = ?');
      values.push(extra.approvalPending ? JSON.stringify(extra.approvalPending) : null);
    }
    values.push(id);
    this.db.prepare(`UPDATE coding_jobs SET ${fields.join(', ')} WHERE id = ?`).run(...(values as SQLInputValue[]));
  }

  private rowToJob(row: Record<string, unknown>): CodingJob {
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      prompt: row.prompt as string,
      title: (row.title as string | undefined) ?? undefined,
      agent: row.agent as AgentId,
      status: row.status as CodingJob['status'],
      approvalMode: row.approval_mode as CodingJob['approvalMode'],
      model: row.model as string | undefined,
      reasoningEffort: row.reasoning_effort as string | undefined,
      worktreePath: row.worktree_path as string | undefined,
      pid: row.pid as number | undefined,
      createdAt: row.created_at as number,
      startedAt: row.started_at as number | undefined,
      completedAt: row.completed_at as number | undefined,
      viewedAt: (row.viewed_at as number | undefined) ?? undefined,
      exitCode: row.exit_code as number | undefined,
      error: row.error as string | undefined,
      approvalPending: row.approval_pending ? JSON.parse(row.approval_pending as string) as PendingApproval : undefined,
      autoRespondRules: JSON.parse((row.auto_respond_rules as string) || '[]') as AutoRespondRule[],
      sessionId: row.session_id as string | undefined,
      resumeSessionId: row.resume_session_id as string | undefined,
      agentSessionId: row.agent_session_id as string | undefined,
      turnCount: (row.turn_count as number) ?? 0,
      lastTurnAt: row.last_turn_at as number | undefined
    };
  }

  updateJobModelConfig(jobId: string, config: { model?: string; reasoningEffort?: string }) {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (config.model !== undefined) { fields.push('model = ?'); values.push(config.model); }
    if (config.reasoningEffort !== undefined) { fields.push('reasoning_effort = ?'); values.push(config.reasoningEffort); }
    if (fields.length === 0) return;
    values.push(jobId);
    this.db.prepare(`UPDATE coding_jobs SET ${fields.join(', ')} WHERE id = ?`).run(...(values as SQLInputValue[]));
  }

  updateAutoRespondRules(jobId: string, rules: AutoRespondRule[]) {
    this.db.prepare('UPDATE coding_jobs SET auto_respond_rules = ? WHERE id = ?')
      .run(JSON.stringify(rules), jobId);
  }

  // ── Turns ────────────────────────────────────────────────────────────────────

  createTurn(turn: JobTurn): JobTurn {
    this.db.prepare(`
      INSERT INTO coding_job_turns (id, job_id, turn_index, text, created_at, delivered_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(turn.id, turn.jobId, turn.turnIndex, turn.text, turn.createdAt, turn.deliveredAt ?? null, turn.status);
    return turn;
  }

  getTurns(jobId: string): JobTurn[] {
    const rows = this.db.prepare(
      'SELECT * FROM coding_job_turns WHERE job_id = ? ORDER BY turn_index ASC'
    ).all(jobId) as Record<string, unknown>[];
    return rows.map(r => this.rowToTurn(r));
  }

  updateTurn(id: string, update: Partial<JobTurn>): void {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (update.status !== undefined) { fields.push('status = ?'); values.push(update.status); }
    if (update.deliveredAt !== undefined) { fields.push('delivered_at = ?'); values.push(update.deliveredAt); }
    if (fields.length === 0) return;
    values.push(id);
    this.db.prepare(`UPDATE coding_job_turns SET ${fields.join(', ')} WHERE id = ?`)
      .run(...(values as SQLInputValue[]));
  }

  getPendingTurns(jobId: string): JobTurn[] {
    const rows = this.db.prepare(
      "SELECT * FROM coding_job_turns WHERE job_id = ? AND status = 'pending' ORDER BY turn_index ASC"
    ).all(jobId) as Record<string, unknown>[];
    return rows.map(r => this.rowToTurn(r));
  }

  private rowToTurn(row: Record<string, unknown>): JobTurn {
    return {
      id: row.id as string,
      jobId: row.job_id as string,
      turnIndex: row.turn_index as number,
      text: row.text as string,
      createdAt: row.created_at as number,
      deliveredAt: row.delivered_at as number | undefined,
      status: row.status as JobTurn['status']
    };
  }

  // ── Events ───────────────────────────────────────────────────────────────

  insertEvent(jobId: string, event: JobEvent) {
    const payload = JSON.stringify(event);
    // Truncate if over limit
    const stored = payload.length > EVENT_PAYLOAD_MAX_BYTES
      ? JSON.stringify({ ...event, _truncated: true })
      : payload;
    this.db.prepare(`
      INSERT INTO coding_job_events (job_id, type, payload, created_at)
      VALUES (?, ?, ?, ?)
    `).run(jobId, event.type, stored, Date.now());
  }

  getRecentEvents(jobId: string, limit = 200): JobEvent[] {
    const rows = this.db.prepare(`
      SELECT id, payload FROM coding_job_events
      WHERE job_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(jobId, limit) as { id: number; payload: string }[];
    return rows.reverse().map((r) => {
      const ev = JSON.parse(r.payload) as JobEvent;
      return { ...ev, _id: r.id };
    });
  }

  // Full event history for a job, in chronological order. Used by the
  // detail-page initial load so reopened long jobs see every prior turn —
  // getRecentEvents' default 200 cap previously dropped early activity.
  getAllEvents(jobId: string): JobEvent[] {
    const rows = this.db.prepare(`
      SELECT id, payload FROM coding_job_events
      WHERE job_id = ?
      ORDER BY id ASC
    `).all(jobId) as { id: number; payload: string }[];
    return rows.map((r) => {
      const ev = JSON.parse(r.payload) as JobEvent;
      return { ...ev, _id: r.id };
    });
  }

  getEventsSince(jobId: string, sinceId: number): JobEvent[] {
    const rows = this.db.prepare(`
      SELECT id, payload FROM coding_job_events
      WHERE job_id = ? AND id > ?
      ORDER BY id ASC
    `).all(jobId, sinceId) as { id: number; payload: string }[];
    return rows.map((r) => {
      const ev = JSON.parse(r.payload) as JobEvent;
      return { ...ev, _id: r.id };
    });
  }

  getMaxEventId(jobId: string): number {
    const row = this.db.prepare(
      'SELECT MAX(id) as max_id FROM coding_job_events WHERE job_id = ?'
    ).get(jobId) as { max_id: number | null } | undefined;
    return row?.max_id ?? 0;
  }

  // ── File stats (computed from events, no schema changes) ─────────────────

  /** Single-job file map — used by /api/jobs/:id/files */
  getJobFileMap(jobId: string): Map<string, FileSummaryStats> {
    const rows = this.db.prepare(
      `SELECT type, payload FROM coding_job_events
       WHERE job_id = ? AND (type = 'job.tool_call' OR type = 'job.user_turn')
       ORDER BY id ASC`
    ).all(jobId) as { type: string; payload: string }[];
    return computeJobFileMap(rows);
  }

  /** Batch file stats for multiple jobs — used by project/list views */
  batchGetJobFileStats(jobIds: string[]): Map<string, JobFileStats> {
    if (jobIds.length === 0) return new Map();
    const placeholders = jobIds.map(() => '?').join(',');
    const rows = this.db.prepare(
      `SELECT job_id, type, payload FROM coding_job_events
       WHERE job_id IN (${placeholders})
         AND (type = 'job.tool_call' OR type = 'job.user_turn')
       ORDER BY id ASC`
    ).all(...(jobIds as SQLInputValue[])) as { job_id: string; type: string; payload: string }[];

    const grouped = new Map<string, Array<{ type: string; payload: string }>>();
    for (const r of rows) {
      if (!grouped.has(r.job_id)) grouped.set(r.job_id, []);
      grouped.get(r.job_id)!.push(r);
    }

    const result = new Map<string, JobFileStats>();
    for (const id of jobIds) {
      result.set(id, computeJobFileStats(grouped.get(id) ?? []));
    }
    return result;
  }

  /** Fetch a specific tool_call event by toolUseId — used by /api/jobs/:id/edits/:toolUseId */
  getToolCallEvent(jobId: string, toolUseId: string): Record<string, unknown> | null {
    const rows = this.db.prepare(
      `SELECT payload FROM coding_job_events WHERE job_id = ? AND type = 'job.tool_call' ORDER BY id ASC`
    ).all(jobId) as { payload: string }[];
    for (const row of rows) {
      try {
        const ev = JSON.parse(row.payload) as { toolUseId?: string };
        if (ev.toolUseId === toolUseId) return ev as Record<string, unknown>;
      } catch { /* skip */ }
    }
    return null;
  }

  // ── Integrations ─────────────────────────────────────────────────────────

  upsertIntegration(row: AgentIntegrationRow) {
    this.db.prepare(`
      INSERT INTO coding_integrations
        (id, installed, enabled, version, binary_path, auth_status, auth_message, account, last_checked_at, last_diagnostic)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        installed = excluded.installed,
        version = excluded.version,
        binary_path = excluded.binary_path,
        auth_status = excluded.auth_status,
        auth_message = excluded.auth_message,
        account = excluded.account,
        last_checked_at = excluded.last_checked_at,
        last_diagnostic = excluded.last_diagnostic
    `).run(
      row.id, row.installed ? 1 : 0, row.enabled ?? 1, row.version ?? null, row.binaryPath ?? null,
      row.authStatus, row.authMessage ?? null, row.account ?? null,
      row.lastCheckedAt, row.lastDiagnostic ?? null
    );
  }

  setIntegrationEnabled(id: AgentId, enabled: boolean) {
    this.db.prepare('UPDATE coding_integrations SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
  }

  resetIntegrationAuth(id: AgentId) {
    this.db.prepare(`
      UPDATE coding_integrations SET
        auth_status = 'not_authenticated', auth_message = NULL, account = NULL,
        last_checked_at = ?, enabled = 1
      WHERE id = ?
    `).run(Date.now(), id);
  }

  getIntegration(id: AgentId): AgentIntegrationRow | null {
    const row = this.db.prepare('SELECT * FROM coding_integrations WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? this.rowToIntegration(row) : null;
  }

  listIntegrations(): AgentIntegrationRow[] {
    const rows = this.db.prepare('SELECT * FROM coding_integrations').all() as Record<string, unknown>[];
    return rows.map((r) => this.rowToIntegration(r));
  }

  private rowToIntegration(row: Record<string, unknown>): AgentIntegrationRow {
    return {
      id: row.id as AgentId,
      installed: (row.installed as number) === 1 ? 1 : 0,
      enabled: (row.enabled as number) === 0 ? 0 : 1, // default 1 for existing rows
      version: row.version as string | undefined,
      binaryPath: row.binary_path as string | undefined,
      authStatus: row.auth_status as AgentIntegrationRow['authStatus'],
      authMessage: row.auth_message as string | undefined,
      account: row.account as string | undefined,
      lastCheckedAt: row.last_checked_at as number,
      lastDiagnostic: row.last_diagnostic as string | undefined
    };
  }
}

// ── File-stat helpers (module-level, no DB access needed) ─────────────────────

function isFileModifyingTool(name: string): boolean {
  return /^(write|edit|str_replace_editor|multiedit|multi_edit)$/i.test(name);
}

function processToolCallForStats(
  toolName: string,
  input: Record<string, unknown>,
  fileMap: Map<string, FileSummaryStats>,
  turnIndex: number
): void {
  const isWrite = /^write$/i.test(toolName);
  const isEdit = /^(edit|str_replace_editor)$/i.test(toolName);
  const isMultiEdit = /^(multiedit|multi_edit)$/i.test(toolName);

  if (!isWrite && !isEdit && !isMultiEdit) return;

  const fp = (input.file_path ?? input.path) as string | undefined;

  if (isMultiEdit) {
    const edits = (input.edits as Array<Record<string, unknown>>) ?? [];
    for (const e of edits) {
      const efp = (e.file_path ?? fp) as string | undefined;
      if (!efp) continue;
      const old = (e.old_string as string) ?? '';
      const nw = (e.new_string as string) ?? '';
      const existing = fileMap.get(efp) ?? { edits: 0, linesAdded: 0, linesRemoved: 0, isNewFile: false, lastModifiedTurnIndex: turnIndex };
      fileMap.set(efp, {
        edits: existing.edits + 1,
        linesAdded: existing.linesAdded + (nw ? nw.split('\n').length : 0),
        linesRemoved: existing.linesRemoved + (old ? old.split('\n').length : 0),
        isNewFile: existing.isNewFile,
        lastModifiedTurnIndex: turnIndex,
      });
    }
    return;
  }

  if (!fp) return;

  if (isWrite) {
    const content = (input.content as string) ?? '';
    const existing = fileMap.get(fp);
    fileMap.set(fp, {
      edits: (existing?.edits ?? 0) + 1,
      linesAdded: (existing?.linesAdded ?? 0) + content.split('\n').length,
      linesRemoved: existing?.linesRemoved ?? 0,
      isNewFile: existing == null,
      lastModifiedTurnIndex: turnIndex,
    });
  } else if (isEdit) {
    const oldStr = (input.old_string as string) ?? '';
    const newStr = (input.new_string as string) ?? '';
    const existing = fileMap.get(fp);
    fileMap.set(fp, {
      edits: (existing?.edits ?? 0) + 1,
      linesAdded: (existing?.linesAdded ?? 0) + (newStr ? newStr.split('\n').length : 0),
      linesRemoved: (existing?.linesRemoved ?? 0) + (oldStr ? oldStr.split('\n').length : 0),
      isNewFile: existing?.isNewFile ?? false,
      lastModifiedTurnIndex: turnIndex,
    });
  }
}

export function computeJobFileMap(rows: Array<{ type: string; payload: string }>): Map<string, FileSummaryStats> {
  const map = new Map<string, FileSummaryStats>();
  let turnIndex = 0;

  for (const row of rows) {
    try {
      if (row.type === 'job.user_turn') {
        const ev = JSON.parse(row.payload) as { turnIndex?: number };
        if (ev.turnIndex != null) turnIndex = ev.turnIndex;
        continue;
      }
      if (row.type !== 'job.tool_call') continue;

      const ev = JSON.parse(row.payload) as { toolName?: string; input?: Record<string, unknown> };
      if (!ev.toolName || !ev.input) continue;
      if (!isFileModifyingTool(ev.toolName)) continue;
      processToolCallForStats(ev.toolName, ev.input, map, turnIndex);
    } catch { /* skip malformed */ }
  }

  return map;
}

export function computeJobFileStats(rows: Array<{ type: string; payload: string }>): JobFileStats {
  const fileMap = computeJobFileMap(rows);
  let totalLinesAdded = 0;
  let totalLinesRemoved = 0;
  let mostRecentTurnText: string | null = null;

  for (const stats of fileMap.values()) {
    totalLinesAdded += stats.linesAdded;
    totalLinesRemoved += stats.linesRemoved;
  }

  for (const row of rows) {
    if (row.type !== 'job.user_turn') continue;
    try {
      const ev = JSON.parse(row.payload) as { text?: string };
      if (ev.text) mostRecentTurnText = ev.text;
    } catch { /* skip */ }
  }

  return {
    filesChangedCount: fileMap.size,
    totalLinesAdded,
    totalLinesRemoved,
    mostRecentTurnText,
  };
}
