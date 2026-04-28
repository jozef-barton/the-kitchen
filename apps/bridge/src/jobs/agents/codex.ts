import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { AgentAdapter } from '../types';

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

// TODO: verify exact Codex CLI flags against `codex --help` output for the installed version.
// This adapter uses a minimal/conservative flag set that should work across versions.
// Update buildCommand() and authCommand() once flags are confirmed for the target version.

export const codexAdapter: AgentAdapter = {
  id: 'codex',
  name: 'Codex',
  binary: 'codex',
  installDocsUrl: 'https://github.com/openai/codex',

  buildCommand({ prompt, cwd: _cwd, approvalMode: _approvalMode }) {
    // Conservative: just `codex exec "<prompt>"`. Add non-interactive flags once verified.
    // TODO: add --quiet or equivalent flag when confirmed safe for installed version
    return {
      command: 'codex',
      args: ['exec', prompt],
      env: { ...process.env as Record<string, string>, FORCE_COLOR: '0', NO_COLOR: '1', TERM: 'dumb' }
    };
  },

  approvalPatterns: [
    // TODO Phase 2: add ApprovalPattern entries for Codex prompts
  ],

  parseCostUpdate(_recentLines: string[]) {
    // TODO: parse Codex token usage format once confirmed
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
    // TODO: verify exact auth check command for installed Codex version
    // Using conservative approach: attempt a minimal exec and check for auth errors
    try {
      await execFileAsync('codex', ['exec', 'echo ok'], { timeout: 15000 });
      return { ok: true };
    } catch (err) {
      const stderr = (err as { stderr?: string }).stderr ?? '';
      const message = stderr.slice(0, 500) || String(err).slice(0, 500);
      if (/not.auth|login|api.key|credentials/i.test(message)) {
        return { ok: false, reason: 'not_authenticated', message };
      }
      if (/timeout|ETIMEDOUT|network/i.test(message)) {
        return { ok: false, reason: 'network', message };
      }
      if (/unknown.flag|unrecognized/i.test(message)) {
        console.warn('[coding] codex auth check failed with unknown flag error — adapter not verified for this version');
        return { ok: false, reason: 'unknown', message: `Flag compatibility issue: ${message}` };
      }
      return { ok: false, reason: 'unknown', message };
    }
  },

  installCommands() {
    return [
      { platform: 'all', command: 'npm install -g @openai/codex', note: 'Requires Node.js 18+' }
    ];
  },

  authCommand() {
    // TODO: verify exact auth subcommand for installed Codex version
    return 'codex auth login';
  },

  disconnectCommand() {
    // TODO: verify exact logout subcommand for installed Codex version
    return 'codex auth logout';
  }
};
