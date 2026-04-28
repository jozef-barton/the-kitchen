import type { ServerResponse } from 'node:http';

export type JobStatus = 'queued' | 'running' | 'awaiting_user' | 'awaiting_approval' | 'interrupted' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type ApprovalMode = 'manual' | 'auto_safe' | 'auto_all';
export type AgentId = 'claude-code' | 'codex';
export type FileChange = 'add' | 'modify' | 'delete';
export type ApprovalCategory = 'edit' | 'shell' | 'install' | 'delete' | 'network' | 'git' | 'unknown';
export type IntegrationAuthStatus = 'ok' | 'not_authenticated' | 'network' | 'unknown' | 'unchecked';

export interface CodingProject {
  id: string;
  name: string;
  repoPath: string;
  createdAt: number;
  updatedAt: number;
  memoryPath?: string;
  defaultApprovalMode: ApprovalMode;
}

export interface PendingApproval {
  approvalId: string;
  message: string;
  options: string[];
  defaultOption?: number;
  category: ApprovalCategory;
}

export interface AutoRespondRule {
  matchRegex: string;
  response: string;
  createdAt: number;
}

export interface JobTurn {
  id: string;
  jobId: string;
  turnIndex: number;
  text: string;
  createdAt: number;
  deliveredAt?: number;
  status: 'pending' | 'delivered' | 'completed' | 'failed';
}

export interface CodingJob {
  id: string;
  projectId: string;
  prompt: string;
  agent: AgentId;
  status: JobStatus;
  approvalMode: ApprovalMode;
  worktreePath?: string;
  pid?: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  exitCode?: number;
  error?: string;
  approvalPending?: PendingApproval;
  autoRespondRules: AutoRespondRule[];
  sessionId?: string;        // Claude Code session ID (set when agent_initialized fires)
  resumeSessionId?: string;  // session ID of the parent job this job resumes from
  agentSessionId?: string;   // persistent stay-alive session ID
  turnCount: number;
  lastTurnAt?: number;
  // Computed from events on demand, not stored in DB
  filesChangedCount?: number;
  totalLinesAdded?: number;
  totalLinesRemoved?: number;
  mostRecentTurnText?: string | null;
}

export type JobEvent =
  | { type: 'job.started'; jobId: string; pid: number; ts: number }
  | { type: 'job.stdout'; jobId: string; chunk: string; truncated?: boolean; logFileOffset?: number; ts: number }
  | { type: 'job.stderr'; jobId: string; chunk: string; truncated?: boolean; logFileOffset?: number; ts: number }
  | { type: 'job.file_changed'; jobId: string; path: string; change: FileChange; ts: number }
  | { type: 'job.heartbeat'; jobId: string; lastActivity: number; ts: number }
  | { type: 'job.needs_approval'; jobId: string; approvalId: string; message: string; options: string[]; defaultOption?: number; category: ApprovalCategory; ts: number }
  | { type: 'job.approval_resolved'; jobId: string; approvalId: string; response: string; ts: number }
  | { type: 'job.maybe_idle'; jobId: string; idleMs: number; ts: number }
  | { type: 'job.cost_update'; jobId: string; tokensIn: number; tokensOut: number; cacheReadTokens: number; cacheWriteTokens: number; estimatedCostUsd: number; cumulative: { tokensIn: number; tokensOut: number; estimatedCostUsd: number }; ts: number }
  | { type: 'job.agent_initialized'; jobId: string; model: string; sessionId: string; cwd: string; toolsAvailable: string[]; ts: number }
  | { type: 'job.thinking'; jobId: string; messageId: string; text: string; ts: number }
  | { type: 'job.message'; jobId: string; messageId: string; text: string; ts: number }
  | { type: 'job.tool_call'; jobId: string; messageId: string; toolUseId: string; toolName: string; input: Record<string, unknown>; ts: number }
  | { type: 'job.tool_result'; jobId: string; toolUseId: string; content: string; isError: boolean; ts: number }
  | { type: 'job.agent_result'; jobId: string; subtype: string; durationMs: number; numTurns: number; ts: number }
  | { type: 'job.completed'; jobId: string; exitCode: number; ts: number }
  | { type: 'job.failed'; jobId: string; error: string; ts: number }
  | { type: 'job.warning'; jobId: string; message: string; ts: number }
  | { type: 'job.user_turn'; jobId: string; turnId: string; turnIndex: number; text: string; ts: number }
  | { type: 'job.session_resumed'; jobId: string; sessionId: string; ts: number }
  | { type: 'job.awaiting_user'; jobId: string; ts: number };

export interface ApprovalPattern {
  regex: RegExp;
  extract: (match: RegExpMatchArray, recentLines: string[]) => {
    message: string;
    options: string[];
    defaultOption?: number;
    category: ApprovalCategory;
  };
}

export interface AgentAdapter {
  id: AgentId;
  name: string;
  binary: string;
  installDocsUrl: string;
  buildCommand(opts: { prompt: string; cwd: string; approvalMode: ApprovalMode; resumeSessionId?: string }): { command: string; args: string[]; env: Record<string, string> };
  approvalPatterns: ApprovalPattern[];
  parseCostUpdate(recentLines: string[]): { tokensIn: number; tokensOut: number; estimatedCostUsd: number } | null;
  detect(): Promise<{ installed: false } | { installed: true; version: string; path: string }>;
  checkAuth(): Promise<{ ok: true; account?: string } | { ok: false; reason: Exclude<IntegrationAuthStatus, 'ok' | 'unchecked'>; message: string }>;
  installCommands(): Array<{ platform: string; command: string; note?: string }>;
  authCommand(): string;
  disconnectCommand(): string | null; // null = not supported by this agent
}

export interface JobSseSubscriber {
  response: ServerResponse;
  jobId: string;
}

export interface JobFileStats {
  filesChangedCount: number;
  totalLinesAdded: number;
  totalLinesRemoved: number;
  mostRecentTurnText: string | null;
}

export interface FileSummaryStats {
  edits: number;
  linesAdded: number;
  linesRemoved: number;
  isNewFile: boolean;
  lastModifiedTurnIndex: number;
}

export interface JobFileSummaryEntry extends FileSummaryStats {
  path: string;
  currentContent?: string;
  currentContentTruncated?: boolean;
}

export interface AgentIntegrationRow {
  id: AgentId;
  installed: 0 | 1;
  version?: string;
  binaryPath?: string;
  authStatus: IntegrationAuthStatus;
  authMessage?: string;
  account?: string;
  lastCheckedAt: number;
  lastDiagnostic?: string;
}
