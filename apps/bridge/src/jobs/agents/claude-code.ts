import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ChildProcess } from 'node:child_process';
import type { AgentAdapter, JobEvent } from '../types';
import { StreamJsonParser } from './stream-parser';
import { getPricing } from '../pricing';

interface ClaudeRunState {
  model: string;
  sessionId: string;
  cumulativeTokensIn: number;
  cumulativeTokensOut: number;
  cumulativeCostUsd: number;
  loggedUnknownModels: Set<string>;
}


// ── Tool input truncation ─────────────────────────────────────────────────────
// File-modifying tools (Write/Edit) are NOT truncated — their full content is needed
// for diff rendering in the UI. Only non-file tools are truncated if unusually large.
const MAX_INPUT_BYTES_DEFAULT = 3500;
const MAX_INPUT_BYTES_FILE = 300_000; // 300 KB — accommodates almost any source file

function truncateToolInput(toolName: string, input: Record<string, unknown>): Record<string, unknown> {
  const isFileTool = /^(write|edit|str_replace_editor|multiedit|multi_edit)$/i.test(toolName);
  const limit = isFileTool ? MAX_INPUT_BYTES_FILE : MAX_INPUT_BYTES_DEFAULT;
  const json = JSON.stringify(input);
  if (json.length <= limit) return input;

  // For non-file tools that are unusually large, keep a summary
  return { _truncated: true, summary: json.slice(0, MAX_INPUT_BYTES_DEFAULT) + '…' };
}

// ── Event handler ─────────────────────────────────────────────────────────────
function handleClaudeEvent(
  obj: Record<string, unknown>,
  jobId: string,
  state: ClaudeRunState,
  emit: (e: JobEvent) => void,
): void {
  const ts = Date.now();

  if (obj.type === 'system' && obj.subtype === 'init') {
    state.model = (obj.model as string) || 'unknown';
    state.sessionId = (obj.session_id as string) || '';
    emit({
      type: 'job.agent_initialized',
      jobId,
      model: state.model,
      sessionId: state.sessionId,
      cwd: (obj.cwd as string) ?? '',
      toolsAvailable: Array.isArray(obj.tools) ? (obj.tools as string[]) : [],
      ts,
    });
    return;
  }

  if (obj.type === 'assistant') {
    const msg = obj.message as Record<string, unknown> | undefined;
    if (!msg?.content) return;
    const messageId = (msg.id as string) ?? '';
    const content = msg.content as Record<string, unknown>[];

    for (const block of content) {
      if (block.type === 'thinking') {
        const text = ((block.thinking as string) ?? '').trim();
        if (!text) continue;
        emit({ type: 'job.thinking', jobId, messageId, text, ts });
      } else if (block.type === 'text') {
        const text = ((block.text as string) ?? '').trim();
        if (!text) continue;
        emit({ type: 'job.message', jobId, messageId, text, ts });
      } else if (block.type === 'tool_use') {
        const toolUseId = (block.id as string) ?? '';
        const toolName = (block.name as string) ?? 'unknown';
        const input = (block.input as Record<string, unknown>) ?? {};
        const truncated = truncateToolInput(toolName, input);
        emit({
          type: 'job.tool_call',
          jobId,
          messageId,
          toolUseId,
          toolName,
          input: truncated,
          ts,
        });
      }
    }

    // Cost tracking — only count when output_tokens > 0 (avoids streaming duplicates)
    const usage = msg.usage as Record<string, number> | undefined;
    if (usage && (usage.output_tokens ?? 0) > 0) {
      const tokensIn = usage.input_tokens ?? 0;
      const tokensOut = usage.output_tokens ?? 0;
      const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
      const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0;
      const p = getPricing('claude-code', state.model);
      if (!state.loggedUnknownModels.has(state.model) && state.model !== 'unknown') {
        // Log unknown models once for diagnostics
        state.loggedUnknownModels.add(state.model);
      }
      const stepCost =
        (tokensIn * p.inputPerM + tokensOut * p.outputPerM +
         cacheReadTokens * p.cacheReadPerM + cacheWriteTokens * p.cacheWritePerM) / 1_000_000;
      state.cumulativeTokensIn += tokensIn;
      state.cumulativeTokensOut += tokensOut;
      state.cumulativeCostUsd += stepCost;
      emit({
        type: 'job.cost_update',
        jobId,
        tokensIn, tokensOut, cacheReadTokens, cacheWriteTokens,
        estimatedCostUsd: stepCost,
        cumulative: {
          tokensIn: state.cumulativeTokensIn,
          tokensOut: state.cumulativeTokensOut,
          estimatedCostUsd: state.cumulativeCostUsd,
        },
        ts,
      });
    }
    return;
  }

  if (obj.type === 'user') {
    const msg = obj.message as Record<string, unknown> | undefined;
    if (!msg?.content) return;
    const content = msg.content as Record<string, unknown>[];
    for (const block of content) {
      if (block.type === 'tool_result') {
        const toolUseId = (block.tool_use_id as string) ?? '';
        const raw = block.content;
        const resultContent = typeof raw === 'string' ? raw : JSON.stringify(raw);

        emit({ type: 'job.tool_result', jobId, toolUseId, content: resultContent, isError: block.is_error === true, ts });
      }
    }
    return;
  }

  if (obj.type === 'result') {
    emit({
      type: 'job.agent_result',
      jobId,
      subtype: (obj.subtype as string) ?? 'unknown',
      durationMs: (obj.duration_ms as number) ?? 0,
      numTurns: (obj.num_turns as number) ?? 0,
      ts,
    });
    return;
  }

  // Unknown event type — emit as raw stdout so it's visible
  emit({ type: 'job.stdout', jobId, chunk: '[event:' + (obj.type as string) + '] ' + JSON.stringify(obj) + '\n', ts });
}

// ── Public API ────────────────────────────────────────────────────────────────
export function attachClaudeCodeParser(
  child: ChildProcess,
  jobId: string,
  emit: (event: JobEvent) => void,
): void {
  const state: ClaudeRunState = {
    model: 'unknown',
    sessionId: '',
    cumulativeTokensIn: 0,
    cumulativeTokensOut: 0,
    cumulativeCostUsd: 0,
    loggedUnknownModels: new Set(),
  };

  const parser = new StreamJsonParser(
    (obj) => handleClaudeEvent(obj as Record<string, unknown>, jobId, state, emit),
    (raw) => emit({ type: 'job.stdout', jobId, chunk: raw + '\n', ts: Date.now() }),
  );

  child.stdout!.on('data', (chunk: Buffer) => parser.feed(chunk));
  child.stdout!.on('end', () => parser.end());

  // stderr stays raw — Claude Code sends warnings in plain text there
  child.stderr!.on('data', (chunk: Buffer) => {
    emit({ type: 'job.stderr', jobId, chunk: chunk.toString(), ts: Date.now() });
  });
}

const execFileAsync = promisify(execFile);

function findBinary(name: string): Promise<string | null> {
  return new Promise((resolve) => {
    // Use 'which' on unix, 'where' on windows
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    execFile(cmd, [name], (err, stdout) => {
      if (err) { resolve(null); return; }
      resolve(stdout.trim().split('\n')[0]?.trim() || null);
    });
  });
}

export const claudeCodeAdapter: AgentAdapter = {
  id: 'claude-code',
  name: 'Claude Code',
  binary: 'claude',
  installDocsUrl: 'https://docs.anthropic.com/claude-code',

  buildCommand({ prompt: _prompt, cwd: _cwd, approvalMode, resumeSessionId, model, reasoningEffort }) {
    // Stay-alive mode: use --input-format stream-json so stdin accepts JSON messages.
    // The initial prompt is NOT passed via -p; instead the runner sends it via stdin
    // immediately after spawn using sendUserMessage().
    const args: string[] = [
      '--input-format', 'stream-json',
      '--output-format', 'stream-json',
      '--verbose',
    ];
    if (approvalMode === 'auto_safe') {
      args.push('--permission-mode', 'acceptEdits');
    } else if (approvalMode === 'auto_all') {
      args.push('--permission-mode', 'bypassPermissions');
    }
    // manual: no --permission-mode flag; Claude Code asks for everything
    if (model) {
      args.push('--model', model);
    }
    if (reasoningEffort) {
      args.push('--effort', reasoningEffort);
    }
    if (resumeSessionId) {
      // --resume <sessionId> continues the specific prior session, giving the agent
      // full conversation history (knows what files were created, what was said, etc.)
      args.push('--resume', resumeSessionId);
    }
    return {
      command: 'claude',
      args,
      env: { ...process.env as Record<string, string>, FORCE_COLOR: '0', NO_COLOR: '1', TERM: 'dumb' }
    };
  },

  approvalPatterns: [
    {
      // "Apply this edit?" style prompts
      regex: /apply\s+(?:this\s+)?(?:edit|change|patch|modification)/i,
      extract: (_match, lines) => ({
        message: lines.filter(l => l.trim()).slice(-3).join('\n'),
        options: ['Yes', 'No'],
        defaultOption: 0,
        category: 'edit' as const
      })
    },
    {
      // "Run this command?" style prompts
      regex: /run\s+(?:this\s+)?(?:command|shell|script)/i,
      extract: (_match, lines) => ({
        message: lines.filter(l => l.trim()).slice(-3).join('\n'),
        options: ['Yes', 'No'],
        defaultOption: 1, // default No for shell
        category: 'shell' as const
      })
    },
    {
      // "Install X?" style prompts
      regex: /install\s+[\w@\-/.]+/i,
      extract: (_match, lines) => ({
        message: lines.filter(l => l.trim()).slice(-3).join('\n'),
        options: ['Yes', 'No'],
        defaultOption: 1,
        category: 'install' as const
      })
    },
    {
      // Generic [y/n] prompts
      regex: /\[y\/n\]|\(y\/n\)|\(yes\/no\)/i,
      extract: (_match, lines) => ({
        message: lines.filter(l => l.trim()).slice(-5).join('\n'),
        options: ['Yes', 'No'],
        defaultOption: 0,
        category: 'unknown' as const
      })
    },
    {
      // Numbered choice menus (2+ numbered options)
      regex: /(?:^|\n)\s*(?:1[.)]\s+\w|2[.)]\s+\w)/m,
      extract: (_match, lines) => {
        const choiceLines = lines.filter(l => /^\s*\d+[.)]\s+\w/.test(l));
        const options = choiceLines.length > 0 ? choiceLines.map(l => l.trim()) : ['1', '2'];
        return {
          message: lines.filter(l => l.trim()).slice(-Math.max(options.length + 2, 6)).join('\n'),
          options,
          defaultOption: 0,
          category: 'unknown' as const
        };
      }
    }
  ],

  parseCostUpdate(_recentLines: string[]) {
    // Cost tracking is now handled in attachClaudeCodeParser via stream-json events.
    return null;
  },

  async detect() {
    const binaryPath = await findBinary('claude');
    if (!binaryPath) return { installed: false };
    try {
      const { stdout } = await execFileAsync('claude', ['--version'], { timeout: 8000 });
      const version = stdout.trim().match(/[\d.]+/)?.[0] ?? 'unknown';
      return { installed: true, version, path: binaryPath };
    } catch {
      return { installed: false };
    }
  },

  async checkAuth() {
    try {
      // `claude auth status` outputs JSON and exits without spending API tokens.
      const { stdout } = await execFileAsync('claude', ['auth', 'status'], {
        timeout: 8000,
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', TERM: 'dumb' }
      });
      const parsed = JSON.parse(stdout.trim()) as {
        loggedIn?: boolean;
        email?: string;
        orgName?: string;
        authMethod?: string;
      };
      if (parsed.loggedIn) {
        const account = parsed.email ?? parsed.orgName ?? undefined;
        return { ok: true as const, account };
      }
      return { ok: false as const, reason: 'not_authenticated' as const, message: 'Not logged in to Claude Code' };
    } catch (err) {
      const stderr = (err as { stderr?: string }).stderr ?? '';
      const stdout = (err as { stdout?: string }).stdout ?? '';
      const message = (stderr || stdout || String(err)).slice(0, 500);
      if (/not.auth|login|sign.in|credentials/i.test(message)) {
        return { ok: false as const, reason: 'not_authenticated' as const, message };
      }
      if (/timeout|ETIMEDOUT|network|connect/i.test(message)) {
        return { ok: false as const, reason: 'network' as const, message };
      }
      // JSON parse failure — likely not logged in
      if (err instanceof SyntaxError) {
        return { ok: false as const, reason: 'not_authenticated' as const, message: 'Could not parse auth status' };
      }
      return { ok: false as const, reason: 'unknown' as const, message };
    }
  },

  installCommands() {
    return [
      { platform: 'all', command: 'npm install -g @anthropic-ai/claude-code', note: 'Requires Node.js 18+' }
    ];
  },

  authCommand() {
    return 'claude auth login';
  },

  disconnectCommand() {
    return 'claude auth logout';
  }
};
