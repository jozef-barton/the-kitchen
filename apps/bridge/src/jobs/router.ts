import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, execFile } from 'node:child_process';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { JobManager } from './manager';
import type { CodingJob } from './types';
import { sendJson, sendSseHeaders, writeSseEvent } from '../http/response';
import { readJsonBody } from '../http/request-body';

function getPathParts(url: string): string[] {
  return new URL(url, 'http://localhost').pathname.split('/').filter(Boolean);
}

// Runs a shell command string and streams output lines via the emit callback.
// Resolves when the process exits (any exit code — caller decides on error).
function streamShellCommand(
  command: string,
  emit: (type: string, data: Record<string, unknown>) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('/bin/bash', ['-c', command], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', TERM: 'dumb' }
    });

    const handleChunk = (chunk: Buffer) => {
      const text = chunk.toString('utf8');
      for (const line of text.split('\n')) {
        if (line.trim()) emit('connect.output', { line });
      }
    };

    child.stdout?.on('data', handleChunk);
    child.stderr?.on('data', handleChunk);
    child.on('close', () => resolve());
    child.on('error', reject);
  });
}

export async function handleCodingRequest(
  request: IncomingMessage,
  response: ServerResponse,
  manager: JobManager,
  allowOrigin: string | undefined
): Promise<boolean> {
  const url = request.url ?? '/';
  const parts = getPathParts(url);
  const method = request.method ?? 'GET';

  // /api/projects
  if (parts[0] === 'api' && parts[1] === 'projects') {
    if (method === 'GET' && parts.length === 2) {
      sendJson(response, 200, { projects: manager.listProjects() }, allowOrigin);
      return true;
    }
    if (method === 'POST' && parts.length === 2) {
      const body = await readJsonBody(request) as { name?: string; repoPath?: string; defaultApprovalMode?: string };
      if (!body.name || !body.repoPath) {
        sendJson(response, 400, { error: { code: 'INVALID_REQUEST', message: 'name and repoPath required' } }, allowOrigin);
        return true;
      }
      try {
        const mode = (['manual', 'auto_safe', 'auto_all'] as const).find(m => m === body.defaultApprovalMode) ?? 'auto_safe';
        const project = manager.createProject(body.name, body.repoPath, mode);
        sendJson(response, 201, { project }, allowOrigin);
      } catch (err) {
        sendJson(response, 400, { error: { code: 'INVALID_REPO', message: (err as Error).message } }, allowOrigin);
      }
      return true;
    }
    if (parts.length === 3) {
      const projectId = parts[2];
      if (method === 'GET') {
        const project = manager.getProject(projectId!);
        if (!project) { sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Project not found' } }, allowOrigin); return true; }
        const jobs = manager.listJobs({ projectId: projectId! });
        const statsMap = manager.batchGetJobFileStats(jobs.map(j => j.id));
        const jobsWithStats = jobs.map(j => ({ ...j, ...(statsMap.get(j.id) ?? { filesChangedCount: 0, totalLinesAdded: 0, totalLinesRemoved: 0, mostRecentTurnText: null }) }));
        sendJson(response, 200, { project, jobs: jobsWithStats }, allowOrigin);
        return true;
      }
      if (method === 'PATCH') {
        const project = manager.getProject(projectId!);
        if (!project) { sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Project not found' } }, allowOrigin); return true; }
        const body = await readJsonBody(request) as { defaultApprovalMode?: string };
        const mode = (['manual', 'auto_safe', 'auto_all'] as const).find(m => m === body.defaultApprovalMode);
        if (mode) manager.updateProjectApprovalMode(projectId!, mode);
        sendJson(response, 200, { project: { ...project, defaultApprovalMode: mode ?? project.defaultApprovalMode } }, allowOrigin);
        return true;
      }
      if (method === 'DELETE') {
        manager.deleteProject(projectId!);
        sendJson(response, 200, { ok: true }, allowOrigin);
        return true;
      }
    }
    return false;
  }

  // /api/jobs
  if (parts[0] === 'api' && parts[1] === 'jobs') {
    // GET /api/jobs
    if (method === 'GET' && parts.length === 2) {
      const qs = new URL(url, 'http://localhost').searchParams;
      const jobs = manager.listJobs({ projectId: qs.get('projectId') ?? undefined, status: qs.get('status') ?? undefined });
      const statsMap = manager.batchGetJobFileStats(jobs.map(j => j.id));
      const jobsWithStats = jobs.map(j => ({ ...j, ...(statsMap.get(j.id) ?? { filesChangedCount: 0, totalLinesAdded: 0, totalLinesRemoved: 0, mostRecentTurnText: null }) }));
      sendJson(response, 200, { jobs: jobsWithStats }, allowOrigin);
      return true;
    }

    // POST /api/jobs
    if (method === 'POST' && parts.length === 2) {
      const body = await readJsonBody(request) as {
        projectId?: string; prompt?: string; agent?: string;
        approvalMode?: string; confirmAutoAll?: boolean; resumeSessionId?: string;
      };
      if (!body.projectId || !body.prompt || !body.agent) {
        sendJson(response, 400, { error: { code: 'INVALID_REQUEST', message: 'projectId, prompt, agent required' } }, allowOrigin);
        return true;
      }
      try {
        const job = await manager.createAndStartJob({
          projectId: body.projectId,
          prompt: body.prompt,
          agent: body.agent as 'claude-code' | 'codex',
          approvalMode: (body.approvalMode as CodingJob['approvalMode']) ?? 'auto_safe',
          confirmAutoAll: body.confirmAutoAll,
          resumeSessionId: body.resumeSessionId
        });
        sendJson(response, 201, { job }, allowOrigin);
      } catch (err) {
        const e = err as Error & { code?: string; installCommands?: unknown; docsUrl?: string };
        sendJson(response, 400, { error: { code: e.code ?? 'JOB_CREATE_FAILED', message: e.message, installCommands: e.installCommands, docsUrl: e.docsUrl } }, allowOrigin);
      }
      return true;
    }

    if (parts.length >= 3) {
      const jobId = parts[2]!;
      const sub = parts[3];

      // GET /api/jobs/:id/files — session file summary
      if (method === 'GET' && sub === 'files') {
        const job = manager.getJob(jobId);
        if (!job) { sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Job not found' } }, allowOrigin); return true; }
        const project = manager.getProject(job.projectId);
        const fileMap = manager.getJobFileMap(jobId);
        const MAX_CONTENT_BYTES = 100 * 1024;
        const files = Array.from(fileMap.entries()).map(([filePath, stats]) => {
          let currentContent: string | undefined;
          let currentContentTruncated = false;
          try {
            const absPath = path.isAbsolute(filePath) ? filePath : path.join(project?.repoPath ?? '', filePath);
            const content = fs.readFileSync(absPath, 'utf8');
            if (content.length > MAX_CONTENT_BYTES) {
              currentContent = content.slice(0, MAX_CONTENT_BYTES);
              currentContentTruncated = true;
            } else {
              currentContent = content;
            }
          } catch { /* file deleted or inaccessible */ }
          return { path: filePath, ...stats, currentContent, currentContentTruncated };
        });
        sendJson(response, 200, { files }, allowOrigin);
        return true;
      }

      // GET /api/jobs/:id/edits/:toolUseId — diff for a specific edit
      if (method === 'GET' && sub === 'edits' && parts[4]) {
        const toolUseId = parts[4];
        const ev = manager.getToolCallEvent(jobId, toolUseId);
        if (!ev) { sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Edit not found' } }, allowOrigin); return true; }
        const toolName = (ev.toolName as string) ?? '';
        const input = (ev.input as Record<string, unknown>) ?? {};
        const filePath = ((input.file_path ?? input.path) as string) ?? '';
        if (/^write$/i.test(toolName)) {
          const content = (input.content as string) ?? '';
          sendJson(response, 200, { toolUseId, filePath, toolName: 'Write', diff: { format: 'new_file', content, linesAdded: content ? content.split('\n').length : 0, linesRemoved: 0 } }, allowOrigin);
        } else if (/^(edit|str_replace_editor)$/i.test(toolName)) {
          const oldString = (input.old_string as string) ?? '';
          const newString = (input.new_string as string) ?? '';
          sendJson(response, 200, { toolUseId, filePath, toolName: 'Edit', diff: { format: 'edit', oldString, newString, linesAdded: newString ? newString.split('\n').length : 0, linesRemoved: oldString ? oldString.split('\n').length : 0 } }, allowOrigin);
        } else {
          sendJson(response, 200, { toolUseId, filePath, toolName, diff: { format: 'unavailable', content: '', linesAdded: 0, linesRemoved: 0 } }, allowOrigin);
        }
        return true;
      }

      // GET /api/jobs/:id
      if (method === 'GET' && !sub) {
        const job = manager.getJob(jobId);
        if (!job) { sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Job not found' } }, allowOrigin); return true; }
        const events = manager.getRecentEvents(jobId);
        sendJson(response, 200, { job, events }, allowOrigin);
        return true;
      }

      // GET /api/jobs/:id/events  — SSE stream
      if (method === 'GET' && sub === 'events') {
        const job = manager.getJob(jobId);
        if (!job) { sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Job not found' } }, allowOrigin); return true; }
        sendSseHeaders(response, allowOrigin);
        // Send last 200 events on connect
        const recentEvents = manager.getRecentEvents(jobId);
        for (const event of recentEvents) {
          writeSseEvent(response, event);
        }
        manager.addSubscriber(jobId, response);
        // Don't call response.end() — kept open until client disconnects
        return true;
      }

      // GET /api/jobs/:id/output — stream from log file
      if (method === 'GET' && sub === 'output') {
        const qs = new URL(url, 'http://localhost').searchParams;
        const offset = parseInt(qs.get('offset') ?? '0', 10);
        const limit = Math.min(parseInt(qs.get('limit') ?? '65536', 10), 65536);
        const logPath = manager.getLogFilePath(jobId, 0);
        if (!fs.existsSync(logPath)) {
          sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Log file not found' } }, allowOrigin);
          return true;
        }
        response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', ...(allowOrigin ? { 'access-control-allow-origin': allowOrigin } : {}) });
        const stream = fs.createReadStream(logPath, { start: offset, end: offset + limit - 1 });
        stream.pipe(response);
        return true;
      }

      // POST /api/jobs/:id/cancel
      if (method === 'POST' && sub === 'cancel') {
        manager.cancelJob(jobId);
        sendJson(response, 200, { ok: true }, allowOrigin);
        return true;
      }

      // POST /api/jobs/:id/respond — Phase 2
      if (method === 'POST' && sub === 'respond') {
        const body = await readJsonBody(request) as { response?: string; remember?: boolean; approvalId?: string };
        if (!body.response || !body.approvalId) {
          sendJson(response, 400, { error: { code: 'INVALID_REQUEST', message: 'response and approvalId required' } }, allowOrigin);
          return true;
        }
        const ok = await manager.respond(jobId, body.approvalId, body.response, body.remember ?? false);
        if (!ok) {
          sendJson(response, 409, { error: { code: 'APPROVAL_MISMATCH', message: 'Job not awaiting approval or approvalId mismatch' } }, allowOrigin);
          return true;
        }
        sendJson(response, 200, { ok: true }, allowOrigin);
        return true;
      }

      // POST /api/jobs/:id/turn — stay-alive user turn
      if (method === 'POST' && sub === 'turn') {
        const body = await readJsonBody(request) as { text?: string };
        if (!body.text) {
          sendJson(response, 400, { error: { code: 'INVALID_REQUEST', message: 'text required' } }, allowOrigin);
          return true;
        }
        try {
          const result = await manager.sendTurn(jobId, body.text);
          if (!result) {
            sendJson(response, 404, { error: { code: 'JOB_NOT_FOUND_OR_TERMINAL', message: 'Job not found or in terminal state' } }, allowOrigin);
            return true;
          }
          const statusCode = result.queued ? 202 : 200;
          sendJson(response, statusCode, { ok: true, turnId: result.turnId, turnIndex: result.turnIndex, queued: result.queued ?? false }, allowOrigin);
        } catch (err) {
          const e = err as Error & { code?: string };
          if (e.code === 'AWAITING_APPROVAL') {
            sendJson(response, 409, { error: { code: 'AWAITING_APPROVAL', message: e.message } }, allowOrigin);
          } else {
            sendJson(response, 400, { error: { code: 'TURN_FAILED', message: e.message } }, allowOrigin);
          }
        }
        return true;
      }

      // POST /api/jobs/:id/end — gracefully end the agent session
      if (method === 'POST' && sub === 'end') {
        const ok = manager.endJob(jobId);
        if (!ok) {
          sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Job not found or no active runner' } }, allowOrigin);
          return true;
        }
        sendJson(response, 200, { ok: true }, allowOrigin);
        return true;
      }

      // POST /api/jobs/:id/resume — resume an interrupted job
      if (method === 'POST' && sub === 'resume') {
        const currentJob = manager.getJob(jobId);
        if (!currentJob) {
          sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Job not found' } }, allowOrigin);
          return true;
        }
        if (currentJob.status !== 'interrupted') {
          sendJson(response, 409, { error: { code: 'NOT_INTERRUPTED', message: `Job status is '${currentJob.status}', expected 'interrupted'` } }, allowOrigin);
          return true;
        }
        const resumed = await manager.resumeInterruptedJob(jobId);
        if (!resumed) {
          sendJson(response, 409, { error: { code: 'RESUME_FAILED', message: 'Cannot resume: no agent session ID captured' } }, allowOrigin);
          return true;
        }
        const updatedJob = manager.getJob(jobId);
        sendJson(response, 200, { ok: true, job: updatedJob }, allowOrigin);
        return true;
      }
    }
    return false;
  }

  // /api/system
  if (parts[0] === 'api' && parts[1] === 'system') {
    // POST /api/system/pick-directory — native folder picker dialog
    if (method === 'POST' && parts[2] === 'pick-directory') {
      const chosenPath = await openFolderPicker();
      if (chosenPath) {
        sendJson(response, 200, { path: chosenPath }, allowOrigin);
      } else {
        sendJson(response, 400, { error: { code: 'DIALOG_CANCELLED', message: 'No folder selected' } }, allowOrigin);
      }
      return true;
    }

    // POST /api/system/clone — clone a GitHub repo into a chosen directory
    if (method === 'POST' && parts[2] === 'clone') {
      const body = await readJsonBody(request) as { repoUrl?: string; targetDir?: string };
      if (!body.repoUrl) {
        sendJson(response, 400, { error: { code: 'INVALID_REQUEST', message: 'repoUrl required' } }, allowOrigin);
        return true;
      }
      const repoUrl = body.repoUrl.trim();

      // Reject URLs that don't start with a recognised scheme or git@host: prefix.
      // This prevents --upload-pack and other flag injection via the URL argument.
      const SAFE_URL = /^(https?:\/\/|git@[\w.-]+:|git:\/\/|ssh:\/\/)/i;
      if (!SAFE_URL.test(repoUrl) || repoUrl.startsWith('-')) {
        sendJson(response, 400, { error: { code: 'INVALID_URL', message: 'Unsupported repository URL format' } }, allowOrigin);
        return true;
      }

      const targetDir = body.targetDir?.trim() || path.join(os.homedir(), 'Code', path.basename(repoUrl, '.git'));
      sendSseHeaders(response, allowOrigin);
      const emitClone = (type: string, data: Record<string, unknown>) => {
        if (!response.writableEnded) writeSseEvent(response, { type, ts: Date.now(), ...data });
      };
      try {
        if (!fs.existsSync(path.dirname(targetDir))) {
          fs.mkdirSync(path.dirname(targetDir), { recursive: true });
        }
        emitClone('clone.status', { message: `Cloning into ${targetDir}…` });
        // Use spawn directly to capture exit code and stream both stdout+stderr as clone.output.
        // '--' separates git options from the URL, preventing the URL from being parsed as a flag.
        await new Promise<void>((resolve, reject) => {
          const child = spawn('git', ['clone', '--progress', '--', repoUrl, targetDir], {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env as Record<string, string>, GIT_TERMINAL_PROMPT: '0' }
          });
          const handleChunk = (chunk: Buffer) => {
            for (const line of chunk.toString('utf8').split(/\r?\n/)) {
              if (line.trim()) emitClone('clone.output', { line: line.trim() });
            }
          };
          child.stdout?.on('data', handleChunk);
          child.stderr?.on('data', handleChunk); // git sends progress to stderr
          child.on('close', (code) => {
            if (code === 0) {
              emitClone('clone.complete', { path: targetDir });
              resolve();
            } else {
              reject(new Error(`git clone failed (exit ${code ?? '?'})`));
            }
          });
          child.on('error', reject);
        });
      } catch (err) {
        emitClone('clone.error', { message: (err as Error).message });
      }
      response.end();
      return true;
    }

    return false;
  }

  // /api/integrations
  if (parts[0] === 'api' && parts[1] === 'integrations') {
    // GET /api/integrations
    if (method === 'GET' && parts.length === 2) {
      sendJson(response, 200, { integrations: manager.integrationManager.listAll() }, allowOrigin);
      return true;
    }

    if (parts.length === 4 && parts[3] === 'check') {
      const agentId = parts[2] as 'claude-code' | 'codex';
      // POST /api/integrations/:id/check
      if (method === 'POST') {
        try {
          const integration = await manager.integrationManager.checkIntegration(agentId);
          sendJson(response, 200, { integration }, allowOrigin);
        } catch (err) {
          sendJson(response, 500, { error: { code: 'CHECK_FAILED', message: (err as Error).message } }, allowOrigin);
        }
        return true;
      }
    }

    if (parts.length === 4 && parts[3] === 'check-detect') {
      const agentId = parts[2] as 'claude-code' | 'codex';
      if (method === 'POST') {
        try {
          const integration = await manager.integrationManager.checkIntegration(agentId, { detectOnly: true });
          sendJson(response, 200, { integration }, allowOrigin);
        } catch (err) {
          sendJson(response, 500, { error: { code: 'CHECK_FAILED', message: (err as Error).message } }, allowOrigin);
        }
        return true;
      }
    }

    // POST /api/integrations/:id/connect — SSE stream: install (if needed) then auth
    if (parts.length === 4 && parts[3] === 'connect' && method === 'POST') {
      const agentId = parts[2] as 'claude-code' | 'codex';
      const adapter = manager.integrationManager.getAdapter(agentId);
      if (!adapter) {
        sendJson(response, 404, { error: { code: 'NOT_FOUND', message: `Unknown agent: ${agentId}` } }, allowOrigin);
        return true;
      }
      sendSseHeaders(response, allowOrigin);

      const emit = (type: string, data: Record<string, unknown>) => {
        if (!response.writableEnded) writeSseEvent(response, { type, agentId, ts: Date.now(), ...data });
      };

      (async () => {
        try {
          // Check if install is needed
          const detection = await adapter.detect();
          if (!detection.installed) {
            emit('connect.status', { message: `Installing ${adapter.name}…` });
            const installCmd = adapter.installCommands()[0];
            if (installCmd) {
              await streamShellCommand(installCmd.command, emit);
              const recheck = await adapter.detect();
              if (!recheck.installed) {
                emit('connect.error', { message: `Install completed but ${adapter.name} still not found on PATH. You may need to restart your terminal or open a new shell.` });
                response.end();
                return;
              }
            }
          }

          // Run auth command
          emit('connect.status', { message: `Authenticating ${adapter.name}…` });
          emit('connect.status', { message: `Running: ${adapter.authCommand()}` });
          await streamShellCommand(adapter.authCommand(), emit);

          // Refresh integration status
          const updated = await manager.integrationManager.checkIntegration(agentId);
          emit('connect.complete', { integration: updated });
        } catch (err) {
          emit('connect.error', { message: (err as Error).message });
        }
        response.end();
      })().catch(() => response.end());

      return true;
    }

    // POST /api/integrations/:id/disconnect — SSE stream: run logout command
    if (parts.length === 4 && parts[3] === 'disconnect' && method === 'POST') {
      const agentId = parts[2] as 'claude-code' | 'codex';
      const adapter = manager.integrationManager.getAdapter(agentId);
      if (!adapter) {
        sendJson(response, 404, { error: { code: 'NOT_FOUND', message: `Unknown agent: ${agentId}` } }, allowOrigin);
        return true;
      }
      const disconnectCmd = adapter.disconnectCommand();
      if (!disconnectCmd) {
        sendJson(response, 400, { error: { code: 'NOT_SUPPORTED', message: `${adapter.name} does not support in-app disconnect` } }, allowOrigin);
        return true;
      }
      sendSseHeaders(response, allowOrigin);
      const emit = (type: string, data: Record<string, unknown>) => {
        if (!response.writableEnded) writeSseEvent(response, { type, agentId, ts: Date.now(), ...data });
      };
      (async () => {
        try {
          emit('connect.status', { message: `Signing out of ${adapter.name}…` });
          await streamShellCommand(disconnectCmd, emit);
          const updated = await manager.integrationManager.checkIntegration(agentId);
          emit('connect.complete', { integration: updated });
        } catch (err) {
          emit('connect.error', { message: (err as Error).message });
        }
        response.end();
      })().catch(() => response.end());
      return true;
    }

    return false;
  }

  return false;
}

// ── Native folder picker ───────────────────────────────────────────────────────

function openFolderPicker(): Promise<string | null> {
  return new Promise((resolve) => {
    const platform = process.platform;

    if (platform === 'darwin') {
      // macOS: AppleScript folder picker
      execFile(
        'osascript',
        ['-e', 'POSIX path of (choose folder with prompt "Select project folder")'],
        { timeout: 30000 },
        (err, stdout) => {
          if (err) resolve(null);
          else resolve(stdout.trim().replace(/\/$/, '') || null);
        }
      );
    } else if (platform === 'linux') {
      // Linux: try zenity (GTK), then kdialog (KDE)
      execFile('zenity', ['--file-selection', '--directory', '--title=Select project folder'], { timeout: 30000 }, (err, stdout) => {
        if (!err) { resolve(stdout.trim() || null); return; }
        execFile('kdialog', ['--getexistingdirectory', os.homedir()], { timeout: 30000 }, (err2, stdout2) => {
          resolve(err2 ? null : stdout2.trim() || null);
        });
      });
    } else {
      // Windows or unsupported — return null, UI falls back to manual entry
      resolve(null);
    }
  });
}
