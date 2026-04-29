import type { CodingStore } from './store';
import type { AgentId, AgentAdapter, AgentIntegrationRow, IntegrationAuthStatus } from './types';
import { claudeCodeAdapter } from './agents/claude-code';
import { codexAdapter } from './agents/codex';

const ADAPTERS: Record<AgentId, AgentAdapter> = {
  'claude-code': claudeCodeAdapter,
  codex: codexAdapter
};

const NPM_PACKAGES: Record<string, string> = {
  'claude-code': '@anthropic-ai/claude-code',
  codex: '@openai/codex',
};

async function fetchLatestNpmVersion(agentId: string): Promise<string | null> {
  const pkg = NPM_PACKAGES[agentId];
  if (!pkg) return null;
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`, {
      signal: AbortSignal.timeout(5000),
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json() as { version?: string };
    return typeof data.version === 'string' ? data.version : null;
  } catch {
    return null;
  }
}

export class IntegrationManager {
  constructor(private readonly store: CodingStore) {}
  private readonly latestVersionCache = new Map<string, string>();

  async cacheDetection(agentId: AgentId, result: { installed: false } | { installed: true; version: string; path: string }) {
    const existing = this.store.getIntegration(agentId) ?? {
      id: agentId, installed: 0 as 0 | 1, enabled: 1 as 0 | 1, authStatus: 'unchecked' as IntegrationAuthStatus, lastCheckedAt: 0
    };
    this.store.upsertIntegration({
      ...existing,
      id: agentId,
      installed: result.installed ? 1 : 0,
      version: result.installed ? result.version : undefined,
      binaryPath: result.installed ? result.path : undefined,
      lastCheckedAt: Date.now()
    });
  }

  async checkIntegration(agentId: AgentId, opts: { detectOnly?: boolean } = {}): Promise<AgentIntegrationRow> {
    const adapter = ADAPTERS[agentId];
    if (!adapter) throw new Error(`Unknown agent: ${agentId}`);

    const existing = this.store.getIntegration(agentId);

    // Detect
    const detection = await adapter.detect();

    // For detect-only: preserve existing auth fields when the binary is still present.
    // Only wipe auth state if the binary disappeared (can't be authenticated without it).
    const preserveAuth = detection.installed && opts.detectOnly;

    let row: AgentIntegrationRow = {
      id: agentId,
      installed: detection.installed ? 1 : 0,
      enabled: existing?.enabled ?? 1,
      version: detection.installed ? detection.version : undefined,
      binaryPath: detection.installed ? detection.path : undefined,
      authStatus: preserveAuth ? (existing?.authStatus ?? 'unchecked') : 'unchecked',
      authMessage: preserveAuth ? existing?.authMessage : undefined,
      account: preserveAuth ? existing?.account : undefined,
      lastDiagnostic: preserveAuth ? existing?.lastDiagnostic : undefined,
      lastCheckedAt: Date.now()
    };

    if (!detection.installed || opts.detectOnly) {
      this.store.upsertIntegration(row);
      return { ...row, latestVersion: this.latestVersionCache.get(agentId) };
    }

    // Auth check + latest version fetch (in parallel)
    const [authResult, latestVersion] = await Promise.all([
      adapter.checkAuth(),
      fetchLatestNpmVersion(agentId),
    ]);

    if (latestVersion) this.latestVersionCache.set(agentId, latestVersion);

    row = {
      ...row,
      authStatus: authResult.ok ? 'ok' : authResult.reason,
      authMessage: authResult.ok ? undefined : authResult.message,
      account: authResult.ok ? authResult.account : undefined,
      lastDiagnostic: authResult.ok ? undefined : authResult.message
    };

    this.store.upsertIntegration(row);
    return { ...row, latestVersion: latestVersion ?? this.latestVersionCache.get(agentId) };
  }

  disableIntegration(agentId: AgentId): AgentIntegrationRow | null {
    this.store.setIntegrationEnabled(agentId, false);
    return this.store.getIntegration(agentId);
  }

  async enableIntegration(agentId: AgentId): Promise<AgentIntegrationRow> {
    this.store.setIntegrationEnabled(agentId, true);
    return this.checkIntegration(agentId, { detectOnly: true });
  }

  resetIntegrationAuth(agentId: AgentId) {
    this.store.resetIntegrationAuth(agentId);
  }

  listAll(): AgentIntegrationRow[] {
    const stored = new Map(this.store.listIntegrations().map(r => [r.id, r]));
    return (['claude-code', 'codex'] as AgentId[]).map(id => {
      const row = stored.get(id) ?? {
        id,
        installed: 0 as 0 | 1,
        enabled: 1 as 0 | 1,
        authStatus: 'unchecked' as IntegrationAuthStatus,
        lastCheckedAt: 0
      };
      return { ...row, latestVersion: this.latestVersionCache.get(id) };
    });
  }

  getAdapter(agentId: AgentId) { return ADAPTERS[agentId]; }
}
