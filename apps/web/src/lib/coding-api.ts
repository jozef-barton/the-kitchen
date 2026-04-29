// coding-api.ts — API client for the coding jobs feature

const BASE = typeof window !== 'undefined' ? '' : 'http://127.0.0.1:8787';

function codingFetch(path: string, opts?: Parameters<typeof fetch>[1]) {
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      'x-hermes-bridge': '1',
      ...(opts?.headers ?? {})
    }
  });
}

export type ApprovalMode = 'manual' | 'auto_safe' | 'auto_all';
export interface CodingProject {
  id: string; name: string; repoPath: string; createdAt: number; updatedAt: number;
  defaultApprovalMode: ApprovalMode;
}
export interface CodingJob {
  id: string; projectId: string; prompt: string; title?: string; agent: string; status: string;
  approvalMode: string; model?: string; reasoningEffort?: string;
  createdAt: number; startedAt?: number; completedAt?: number; viewedAt?: number; archivedAt?: number;
  exitCode?: number; error?: string; sessionId?: string; resumeSessionId?: string;
  agentSessionId?: string; turnCount: number; lastTurnAt?: number;
  // Computed from events on demand
  filesChangedCount?: number;
  totalLinesAdded?: number;
  totalLinesRemoved?: number;
  mostRecentTurnText?: string | null;
}

export interface JobFileSummaryEntry {
  path: string;
  edits: number;
  linesAdded: number;
  linesRemoved: number;
  isNewFile: boolean;
  lastModifiedTurnIndex: number;
  currentContent?: string;
  currentContentTruncated?: boolean;
}

export interface JobTurn {
  id: string;
  jobId: string;
  turnIndex: number;
  text: string;
  createdAt: number;
  deliveredAt?: number;
  status: string;
}
export interface AgentIntegration {
  id: string; installed: 0|1; enabled: 0|1; version?: string; binaryPath?: string;
  authStatus: string; authMessage?: string; account?: string; lastCheckedAt: number; lastDiagnostic?: string;
  latestVersion?: string;
}
export type JobEvent = { type: string; jobId: string; ts: number; [k: string]: unknown };

export async function listProjects(): Promise<CodingProject[]> {
  const r = await codingFetch('/api/projects');
  const d = await r.json() as { projects: CodingProject[] };
  return d.projects;
}
export async function createProject(name: string, repoPath: string, defaultApprovalMode?: ApprovalMode): Promise<CodingProject> {
  const r = await codingFetch('/api/projects', { method: 'POST', body: JSON.stringify({ name, repoPath, defaultApprovalMode }) });
  if (!r.ok) { const e = await r.json() as { error: { message: string } }; throw new Error(e.error.message); }
  const d = await r.json() as { project: CodingProject };
  return d.project;
}
export async function deleteProject(id: string) {
  await codingFetch(`/api/projects/${id}`, { method: 'DELETE' });
}
export async function updateProjectApprovalMode(id: string, mode: ApprovalMode): Promise<void> {
  await codingFetch(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify({ defaultApprovalMode: mode }) });
}
export async function getProject(id: string): Promise<{ project: CodingProject; jobs: CodingJob[] }> {
  const r = await codingFetch(`/api/projects/${id}`);
  return r.json() as Promise<{ project: CodingProject; jobs: CodingJob[] }>;
}
export async function listJobs(opts?: { projectId?: string; status?: string }): Promise<CodingJob[]> {
  const qs = new URLSearchParams();
  if (opts?.projectId) qs.set('projectId', opts.projectId);
  if (opts?.status) qs.set('status', opts.status);
  const r = await codingFetch(`/api/jobs?${qs.toString()}`);
  const d = await r.json() as { jobs: CodingJob[] };
  return d.jobs;
}
export async function createJob(opts: {
  projectId: string; prompt: string; agent: string; approvalMode: string;
  confirmAutoAll?: boolean; resumeSessionId?: string;
  model?: string; reasoningEffort?: string;
}): Promise<CodingJob> {
  const r = await codingFetch('/api/jobs', { method: 'POST', body: JSON.stringify(opts) });
  if (!r.ok) {
    const e = await r.json() as { error: { code: string; message: string; installCommands?: unknown; docsUrl?: string } };
    const err = Object.assign(new Error(e.error.message), e.error);
    throw err;
  }
  const d = await r.json() as { job: CodingJob };
  return d.job;
}
export async function cancelJob(id: string) {
  await codingFetch(`/api/jobs/${id}/cancel`, { method: 'POST' });
}
export async function archiveJob(id: string): Promise<CodingJob | null> {
  const r = await codingFetch(`/api/jobs/${id}/archive`, { method: 'POST' });
  if (!r.ok) return null;
  const d = await r.json() as { job: CodingJob };
  return d.job;
}
export async function markJobViewed(id: string): Promise<CodingJob | null> {
  const r = await codingFetch(`/api/jobs/${id}/viewed`, { method: 'POST' });
  if (!r.ok) return null;
  const d = await r.json() as { job: CodingJob };
  return d.job;
}
export async function sendTurn(jobId: string, text: string): Promise<{ turnId: string; turnIndex: number; queued?: boolean }> {
  const r = await codingFetch(`/api/jobs/${jobId}/turn`, {
    method: 'POST',
    body: JSON.stringify({ text })
  });
  if (!r.ok) {
    const e = await r.json() as { error: { message: string } };
    throw new Error(e.error.message);
  }
  return r.json() as Promise<{ turnId: string; turnIndex: number; queued?: boolean }>;
}
export async function endJob(jobId: string): Promise<void> {
  const r = await codingFetch(`/api/jobs/${jobId}/end`, { method: 'POST' });
  if (!r.ok) {
    const e = await r.json() as { error: { message: string } };
    throw new Error(e.error.message);
  }
}
export async function resumeJob(jobId: string): Promise<CodingJob> {
  const r = await codingFetch(`/api/jobs/${jobId}/resume`, { method: 'POST' });
  if (!r.ok) {
    const e = await r.json() as { error: { message: string } };
    throw new Error(e.error.message);
  }
  const d = await r.json() as { ok: boolean; job: CodingJob };
  return d.job;
}
export async function respondToApproval(jobId: string, approvalId: string, response: string, remember: boolean): Promise<void> {
  const r = await codingFetch(`/api/jobs/${jobId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ approvalId, response, remember })
  });
  if (!r.ok) {
    const e = await r.json() as { error: { message: string } };
    throw new Error(e.error.message);
  }
}
export async function getJobWithEvents(id: string): Promise<{ job: CodingJob; events: JobEvent[]; maxEventId: number }> {
  const r = await codingFetch(`/api/jobs/${id}`);
  return r.json() as Promise<{ job: CodingJob; events: JobEvent[]; maxEventId: number }>;
}
export async function updateJobConfig(id: string, config: { model?: string; reasoningEffort?: string }): Promise<CodingJob> {
  const r = await codingFetch(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(config) });
  if (!r.ok) { const e = await r.json() as { error: { message: string } }; throw new Error(e.error.message); }
  const d = await r.json() as { job: CodingJob };
  return d.job;
}

export async function getJob(id: string): Promise<CodingJob> {
  const r = await codingFetch(`/api/jobs/${id}`);
  const d = await r.json() as { job: CodingJob; events: JobEvent[] };
  return d.job;
}
export async function listIntegrations(): Promise<AgentIntegration[]> {
  const r = await codingFetch('/api/integrations');
  const d = await r.json() as { integrations: AgentIntegration[] };
  return d.integrations;
}
export async function checkIntegration(id: string): Promise<AgentIntegration> {
  const r = await codingFetch(`/api/integrations/${id}/check`, { method: 'POST' });
  const d = await r.json() as { integration: AgentIntegration };
  return d.integration;
}
export async function detectIntegration(id: string): Promise<AgentIntegration> {
  const r = await codingFetch(`/api/integrations/${id}/check-detect`, { method: 'POST' });
  const d = await r.json() as { integration: AgentIntegration };
  return d.integration;
}
export function subscribeToJobEvents(
  jobId: string,
  onEvent: (e: JobEvent) => void,
  onError?: () => void,
  sinceId?: number,
): () => void {
  const url = sinceId != null
    ? `${BASE}/api/jobs/${jobId}/events?since=${sinceId}`
    : `${BASE}/api/jobs/${jobId}/events`;
  const es = new EventSource(url);
  es.onmessage = (e) => {
    try { onEvent(JSON.parse(e.data) as JobEvent); } catch { /* ignore */ }
  };
  if (onError) es.onerror = onError;
  return () => es.close();
}

export async function pickDirectory(): Promise<string | null> {
  const r = await codingFetch('/api/system/pick-directory', { method: 'POST' });
  if (!r.ok) return null;
  const d = await r.json() as { path?: string };
  return d.path ?? null;
}

export type CloneEvent =
  | { type: 'clone.status'; message: string }
  | { type: 'clone.output'; line: string }
  | { type: 'clone.complete'; path: string }
  | { type: 'clone.error'; message: string };

export function cloneRepo(
  repoUrl: string,
  targetDir: string | undefined,
  onEvent: (e: CloneEvent) => void,
): () => void {
  let closed = false;
  const ctrl = new AbortController();
  codingFetch('/api/system/clone', {
    method: 'POST',
    body: JSON.stringify({ repoUrl, targetDir }),
    signal: ctrl.signal,
  }).then(async (res) => {
    if (!res.body) return;
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done || closed) break;
      buf += dec.decode(value, { stream: true });
      let idx = buf.indexOf('\n\n');
      while (idx >= 0) {
        const chunk = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 2);
        if (chunk.startsWith('data:')) {
          try { onEvent(JSON.parse(chunk.slice(5).trim()) as CloneEvent); } catch { /* ignore */ }
        }
        idx = buf.indexOf('\n\n');
      }
    }
  }).catch(() => {});
  return () => { closed = true; ctrl.abort(); };
}

export async function getJobFiles(jobId: string): Promise<{ files: JobFileSummaryEntry[] }> {
  const r = await codingFetch(`/api/jobs/${jobId}/files`);
  if (!r.ok) throw new Error('Failed to fetch file summary');
  return r.json() as Promise<{ files: JobFileSummaryEntry[] }>;
}

export type ConnectEvent =
  | { type: 'connect.status'; agentId: string; message: string }
  | { type: 'connect.output'; agentId: string; line: string }
  | { type: 'connect.complete'; agentId: string; integration: AgentIntegration }
  | { type: 'connect.error'; agentId: string; message: string };

/** @deprecated Use disableAgent instead — disconnect no longer runs CLI logout */
export function disconnectAgent(agentId: string, onEvent: (e: ConnectEvent) => void): () => void {
  return _streamIntegrationAction(agentId, 'disconnect', onEvent);
}

export function connectAgent(agentId: string, onEvent: (e: ConnectEvent) => void): () => void {
  return _streamIntegrationAction(agentId, 'connect', onEvent);
}

export function updateAgent(agentId: string, onEvent: (e: ConnectEvent) => void): () => void {
  return _streamIntegrationAction(agentId, 'update', onEvent);
}

export async function disableAgent(agentId: string): Promise<AgentIntegration> {
  const r = await codingFetch(`/api/integrations/${agentId}/disable`, { method: 'POST' });
  const d = await r.json() as { integration: AgentIntegration };
  return d.integration;
}

export async function enableAgent(agentId: string): Promise<AgentIntegration> {
  const r = await codingFetch(`/api/integrations/${agentId}/enable`, { method: 'POST' });
  const d = await r.json() as { integration: AgentIntegration };
  return d.integration;
}

export function deleteAgent(agentId: string, onEvent: (e: ConnectEvent) => void): () => void {
  return _streamIntegrationAction(agentId, 'delete', onEvent);
}

function _streamIntegrationAction(agentId: string, action: string, onEvent: (e: ConnectEvent) => void): () => void {
  let closed = false;
  const ctrl = new AbortController();

  codingFetch(`/api/integrations/${agentId}/${action}`, { method: 'POST', signal: ctrl.signal })
    .then(async (res) => {
      if (!res.body) return;
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done || closed) break;
        buf += dec.decode(value, { stream: true });
        let idx = buf.indexOf('\n\n');
        while (idx >= 0) {
          const chunk = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 2);
          if (chunk.startsWith('data:')) {
            try { onEvent(JSON.parse(chunk.slice(5).trim()) as ConnectEvent); } catch { /* ignore */ }
          }
          idx = buf.indexOf('\n\n');
        }
      }
    })
    .catch(() => {});

  return () => { closed = true; ctrl.abort(); };
}
