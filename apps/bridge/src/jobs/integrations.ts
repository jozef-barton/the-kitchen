import type { CodingStore } from './store';
import type { AgentId, AgentAdapter, AgentIntegrationRow, IntegrationAuthStatus } from './types';
import { claudeCodeAdapter } from './agents/claude-code';
import { codexAdapter } from './agents/codex';

const ADAPTERS: Record<AgentId, AgentAdapter> = {
  'claude-code': claudeCodeAdapter,
  codex: codexAdapter
};

export class IntegrationManager {
  constructor(private readonly store: CodingStore) {}

  async cacheDetection(agentId: AgentId, result: { installed: false } | { installed: true; version: string; path: string }) {
    const existing = this.store.getIntegration(agentId) ?? {
      id: agentId, installed: 0 as 0 | 1, authStatus: 'unchecked' as IntegrationAuthStatus, lastCheckedAt: 0
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

    // Detect
    const detection = await adapter.detect();
    let row: AgentIntegrationRow = {
      id: agentId,
      installed: detection.installed ? 1 : 0,
      version: detection.installed ? detection.version : undefined,
      binaryPath: detection.installed ? detection.path : undefined,
      authStatus: 'unchecked',
      lastCheckedAt: Date.now()
    };

    if (!detection.installed || opts.detectOnly) {
      this.store.upsertIntegration(row);
      return row;
    }

    // Auth check
    const authResult = await adapter.checkAuth();
    row = {
      ...row,
      authStatus: authResult.ok ? 'ok' : authResult.reason,
      authMessage: authResult.ok ? undefined : authResult.message,
      account: authResult.ok ? authResult.account : undefined,
      lastDiagnostic: authResult.ok ? undefined : authResult.message
    };

    this.store.upsertIntegration(row);
    return row;
  }

  listAll(): AgentIntegrationRow[] {
    const stored = new Map(this.store.listIntegrations().map(r => [r.id, r]));
    // Ensure all known agents are represented
    return (['claude-code', 'codex'] as AgentId[]).map(id => {
      return stored.get(id) ?? {
        id,
        installed: 0 as 0 | 1,
        authStatus: 'unchecked' as IntegrationAuthStatus,
        lastCheckedAt: 0
      };
    });
  }

  getAdapter(agentId: AgentId) { return ADAPTERS[agentId]; }
}
