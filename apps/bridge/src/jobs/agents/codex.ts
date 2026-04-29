import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ChildProcess } from 'node:child_process';
import type { AgentAdapter, JobEvent } from '../types';
import { getPricing } from '../pricing';

const execFileAsync = promisify(execFile);

function findBinary(name: string): Promise<string | null> {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    execFile(cmd, [name], (err, stdout) => {
      if (err) { resolve(null); return; }
      resolve(stdout.trim().split('\n')[0]?.trim() || null);
    });
  });
}

// ── Codex JSONL parser ────────────────────────────────────────────────────────
// Codex CLI 0.120+ emits JSONL when run with --json flag.
// Event shapes are based on OpenAI's Responses API streaming format.

interface CodexRunState {
  model: string;
  sessionId: string;
  cumulativeTokensIn: number;
  cumulativeTokensOut: number;
  cumulativeCacheReadTokens: number;
  cumulativeCostUsd: number;
  currentMessageId: string;
  currentMessageText: string;
}

function handleCodexEvent(
  obj: Record<string, unknown>,
  jobId: string,
  state: CodexRunState,
  emit: (e: JobEvent) => void,
): void {
  const ts = Date.now();
  const type = obj.type as string;

  // Session/task start
  if (type === 'task_started' || type === 'exec_started' || type === 'session.created') {
    state.sessionId = (obj.session_id as string) ?? (obj.id as string) ?? '';
    state.model = (obj.model as string) ?? state.model;
    emit({
      type: 'job.agent_initialized',
      jobId,
      model: state.model,
      sessionId: state.sessionId,
      cwd: (obj.cwd as string) ?? '',
      toolsAvailable: [],
      ts,
    });
    return;
  }

  // Text streaming delta
  if (type === 'text' || type === 'agent_message_delta' || type === 'response.text.delta') {
    const delta = (obj.delta as string) ?? (obj.text as string) ?? '';
    if (!delta) return;
    const messageId = (obj.id as string) ?? state.currentMessageId ?? `codex-msg-${ts}`;
    state.currentMessageId = messageId;
    state.currentMessageText = (state.currentMessageText ?? '') + delta;
    emit({ type: 'job.message', jobId, messageId, text: state.currentMessageText, ts });
    return;
  }

  // Complete text message
  if (type === 'agent_message' || type === 'response.output_item.done') {
    const content = obj.content;
    if (Array.isArray(content)) {
      for (const block of content as Record<string, unknown>[]) {
        if (block.type === 'text' || block.type === 'output_text') {
          const text = ((block.text as string) ?? '').trim();
          if (!text) continue;
          const messageId = (obj.id as string) ?? `codex-msg-${ts}`;
          state.currentMessageId = messageId;
          state.currentMessageText = text;
          emit({ type: 'job.message', jobId, messageId, text, ts });
        }
        if (block.type === 'refusal') {
          const text = ((block.refusal as string) ?? '').trim();
          if (text) emit({ type: 'job.message', jobId, messageId: `codex-msg-${ts}`, text, ts });
        }
      }
    } else if (typeof content === 'string' && content.trim()) {
      const messageId = (obj.id as string) ?? `codex-msg-${ts}`;
      state.currentMessageId = messageId;
      state.currentMessageText = content;
      emit({ type: 'job.message', jobId, messageId, text: content, ts });
    }
    // Reset streaming buffer when message completes
    state.currentMessageText = '';
    return;
  }

  // Reasoning/thinking
  if (type === 'agent_reasoning' || type === 'response.output_item.added' && obj.item_type === 'reasoning') {
    const text = ((obj.content as string) ?? (obj.summary as string) ?? '').trim();
    if (text) {
      emit({ type: 'job.thinking', jobId, messageId: (obj.id as string) ?? `codex-think-${ts}`, text, ts });
    }
    return;
  }

  // Tool use (function call)
  if (type === 'tool_use' || type === 'function_call' || type === 'response.function_call_arguments.done') {
    const toolUseId = (obj.id as string) ?? (obj.call_id as string) ?? `codex-tool-${ts}`;
    const toolName = (obj.name as string) ?? 'unknown';
    let input: Record<string, unknown> = {};
    if (obj.input && typeof obj.input === 'object') {
      input = obj.input as Record<string, unknown>;
    } else if (typeof obj.arguments === 'string') {
      try { input = JSON.parse(obj.arguments as string) as Record<string, unknown>; } catch { input = { _raw: obj.arguments }; }
    }
    const messageId = (obj.message_id as string) ?? `codex-msg-${ts}`;
    emit({ type: 'job.tool_call', jobId, messageId, toolUseId, toolName, input, ts });
    return;
  }

  // Tool result (function output)
  if (type === 'tool_result' || type === 'function_call_output') {
    const toolUseId = (obj.tool_use_id as string) ?? (obj.call_id as string) ?? '';
    const rawContent = obj.content ?? obj.output ?? '';
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    const isError = (obj.is_error as boolean) ?? false;
    emit({ type: 'job.tool_result', jobId, toolUseId, content, isError, ts });
    return;
  }

  // Task complete — emit cost update and agent result
  if (type === 'task_complete' || type === 'exec_complete' || type === 'response.completed') {
    const usage = (obj.total_token_usage ?? obj.usage) as Record<string, number> | undefined;
    if (usage) {
      const tokensIn = usage.input_tokens ?? 0;
      const tokensOut = usage.output_tokens ?? 0;
      const cacheReadTokens = usage.cached_input_tokens ?? usage.cache_read_input_tokens ?? 0;
      const reasoningTokens = usage.reasoning_output_tokens ?? usage.reasoning_tokens ?? 0;
      const pricing = getPricing('codex', state.model);
      const stepCost = (
        (tokensIn - cacheReadTokens) * pricing.inputPerM +
        cacheReadTokens * pricing.cacheReadPerM +
        (tokensOut + reasoningTokens) * pricing.outputPerM
      ) / 1_000_000;
      state.cumulativeTokensIn += tokensIn;
      state.cumulativeTokensOut += tokensOut;
      state.cumulativeCacheReadTokens += cacheReadTokens;
      state.cumulativeCostUsd += stepCost;
      emit({
        type: 'job.cost_update',
        jobId,
        tokensIn, tokensOut, cacheReadTokens, cacheWriteTokens: 0,
        estimatedCostUsd: stepCost,
        cumulative: {
          tokensIn: state.cumulativeTokensIn,
          tokensOut: state.cumulativeTokensOut,
          estimatedCostUsd: state.cumulativeCostUsd,
        },
        ts,
      });
    }
    const durationMs = (obj.duration_ms as number) ?? 0;
    emit({
      type: 'job.agent_result',
      jobId,
      subtype: 'success',
      durationMs,
      numTurns: 1,
      ts,
    });
    return;
  }

  // Error event
  if (type === 'error') {
    const message = (obj.message as string) ?? JSON.stringify(obj);
    emit({ type: 'job.stderr', jobId, chunk: `[codex error] ${message}\n`, ts });
    return;
  }

  // Unknown — pass through as raw stdout for visibility
  emit({ type: 'job.stdout', jobId, chunk: '[event:' + type + '] ' + JSON.stringify(obj) + '\n', ts });
}

export function attachCodexParser(
  child: ChildProcess,
  jobId: string,
  model: string,
  emit: (event: JobEvent) => void,
): void {
  const state: CodexRunState = {
    model,
    sessionId: '',
    cumulativeTokensIn: 0,
    cumulativeTokensOut: 0,
    cumulativeCacheReadTokens: 0,
    cumulativeCostUsd: 0,
    currentMessageId: '',
    currentMessageText: '',
  };

  let buf = '';

  child.stdout!.on('data', (chunk: Buffer) => {
    buf += chunk.toString('utf8');
    const lines = buf.split('\n');
    buf = lines.pop() ?? ''; // keep incomplete last line
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const obj = JSON.parse(trimmed) as Record<string, unknown>;
        handleCodexEvent(obj, jobId, state, emit);
      } catch {
        // Not JSON — emit as raw stdout
        emit({ type: 'job.stdout', jobId, chunk: trimmed + '\n', ts: Date.now() });
      }
    }
  });

  child.stdout!.on('end', () => {
    if (buf.trim()) {
      try {
        const obj = JSON.parse(buf.trim()) as Record<string, unknown>;
        handleCodexEvent(obj, jobId, state, emit);
      } catch {
        emit({ type: 'job.stdout', jobId, chunk: buf + '\n', ts: Date.now() });
      }
    }
  });

  child.stderr!.on('data', (chunk: Buffer) => {
    emit({ type: 'job.stderr', jobId, chunk: chunk.toString(), ts: Date.now() });
  });
}

// ── Public API ────────────────────────────────────────────────────────────────
export const codexAdapter: AgentAdapter = {
  id: 'codex',
  name: 'Codex',
  binary: 'codex',
  installDocsUrl: 'https://github.com/openai/codex',
  multiTurnMode: 'spawn-per-turn',

  buildCommand({ prompt: _prompt, cwd: _cwd, approvalMode, resumeSessionId, model, reasoningEffort }) {
    const args: string[] = ['exec', '--json', '--color', 'never'];

    // Approval / sandbox mapping
    if (approvalMode === 'auto_all') {
      args.push('--dangerously-bypass-approvals-and-sandbox');
    } else if (approvalMode === 'auto_safe') {
      args.push('--full-auto'); // = -a on-request -s workspace-write
    } else {
      // manual: on-request approval, read-only sandbox
      args.push('-a', 'on-request', '-s', 'read-only');
    }

    if (model) {
      args.push('-m', model);
    }

    if (reasoningEffort) {
      args.push('-c', `model_reasoning_effort=${reasoningEffort}`);
    }

    if (resumeSessionId) {
      args.push('resume', '--last');
    }

    return {
      command: 'codex',
      args,
      env: { ...process.env as Record<string, string>, FORCE_COLOR: '0', NO_COLOR: '1', TERM: 'dumb' }
    };
  },

  approvalPatterns: [],

  parseCostUpdate(_recentLines: string[]) {
    // Cost tracking is handled in attachCodexParser via JSONL task_complete events.
    return null;
  },

  async detect() {
    const binaryPath = await findBinary('codex');
    if (!binaryPath) return { installed: false };
    try {
      const { stdout } = await execFileAsync('codex', ['--version'], { timeout: 8000 });
      const version = stdout.trim().match(/[\d.]+/)?.[0] ?? 'unknown';
      return { installed: true, version, path: binaryPath };
    } catch {
      // Some versions may not support --version; treat as installed-unknown
      return { installed: true, version: 'unknown', path: binaryPath };
    }
  },

  async checkAuth() {
    try {
      // `codex login status` is cheap and non-interactive.
      const { stdout } = await execFileAsync('codex', ['login', 'status'], { timeout: 8000 });
      const text = stdout.trim();
      if (/logged in/i.test(text)) {
        // Extract account identifier from output like "Logged in using an API key - sk-proj-***fj4EA"
        // or "Logged in using ChatGPT account"
        let account: string | undefined;
        const apiKeyMatch = text.match(/api key\s*-\s*(sk-[^\s]+)/i);
        const chatGptMatch = text.match(/chatgpt account/i);
        if (apiKeyMatch) account = apiKeyMatch[1] ?? undefined;
        else if (chatGptMatch) account = 'ChatGPT';
        return { ok: true as const, account };
      }
      return { ok: false as const, reason: 'not_authenticated' as const, message: text || 'Not logged in' };
    } catch (err) {
      const stderr = (err as { stderr?: string }).stderr ?? '';
      const stdout = (err as { stdout?: string }).stdout ?? '';
      const message = (stderr || stdout || String(err)).slice(0, 500);
      if (/not.auth|login|api.key|credentials/i.test(message)) {
        return { ok: false as const, reason: 'not_authenticated' as const, message };
      }
      if (/timeout|ETIMEDOUT|network/i.test(message)) {
        return { ok: false as const, reason: 'network' as const, message };
      }
      return { ok: false as const, reason: 'unknown' as const, message };
    }
  },

  installCommands() {
    return [
      { platform: 'all', command: 'npm install -g @openai/codex', note: 'Requires Node.js 18+' }
    ];
  },

  authCommand() {
    return 'codex login';
  },

  disconnectCommand() {
    return 'codex logout';
  }
};

