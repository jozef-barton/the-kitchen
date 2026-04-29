import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../lib/coding-api';
import type { AgentIntegration, ConnectEvent } from '../lib/coding-api';

export type CodingIntegrationAction = 'connect' | 'disconnect';

export interface UseCodingIntegrationsResult {
  integrations: AgentIntegration[];
  connecting: string | null;
  connectLog: Record<string, string[]>;
  refresh: (id?: string) => void;
  connect: (id: string) => void;
  disable: (id: string) => Promise<void>;
  enable: (id: string) => Promise<void>;
  deleteIntegration: (id: string, onEvent: (e: ConnectEvent) => void) => () => void;
}

const POLL_INTERVAL_MS = 30_000;

export function useCodingIntegrations(): UseCodingIntegrationsResult {
  const [integrations, setIntegrations] = useState<AgentIntegration[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectLog, setConnectLog] = useState<Record<string, string[]>>({});
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateOne = useCallback((updated: AgentIntegration) => {
    setIntegrations(prev => {
      const exists = prev.some(i => i.id === updated.id);
      if (exists) return prev.map(i => i.id === updated.id ? updated : i);
      return [...prev, updated];
    });
  }, []);

  const detectAll = useCallback(() => {
    const ids: Array<'claude-code' | 'codex'> = ['claude-code', 'codex'];
    for (const id of ids) {
      api.detectIntegration(id).then(updateOne).catch(() => {});
    }
  }, [updateOne]);

  // Initial load + auto-detect stale entries
  const loadAndDetect = useCallback(() => {
    api.listIntegrations().then(list => {
      setIntegrations(list);
      const ONE_HOUR = 60 * 60 * 1000;
      const knownIds = new Set(list.map(i => i.id));
      const toDetect: Array<'claude-code' | 'codex'> = ['claude-code', 'codex'];
      for (const id of toDetect) {
        if (!knownIds.has(id)) {
          api.detectIntegration(id).then(updateOne).catch(() => {});
        } else {
          const agent = list.find(i => i.id === id)!;
          const stale = agent.authStatus === 'unchecked' || agent.lastCheckedAt === 0
            || (Date.now() - agent.lastCheckedAt > ONE_HOUR);
          if (stale) {
            api.detectIntegration(id).then(updateOne).catch(() => {});
          }
        }
      }
    }).catch(() => detectAll());
  }, [updateOne, detectAll]);

  useEffect(() => {
    loadAndDetect();

    // Re-check on window focus
    const onFocus = () => detectAll();
    window.addEventListener('focus', onFocus);

    // Poll every 30s while visible
    pollTimerRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') detectAll();
    }, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener('focus', onFocus);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadAndDetect, detectAll]);

  const refresh = useCallback((id?: string) => {
    if (id) {
      api.checkIntegration(id).then(updateOne).catch(() => {});
    } else {
      detectAll();
    }
  }, [updateOne, detectAll]);

  const connect = useCallback((id: string) => {
    setConnecting(id);
    setConnectLog(prev => ({ ...prev, [id]: [] }));
    const addLine = (line: string) => {
      setConnectLog(prev => ({ ...prev, [id]: [...(prev[id] ?? []), line] }));
    };
    api.connectAgent(id, (event: ConnectEvent) => {
      if (event.type === 'connect.status') addLine(`→ ${event.message}`);
      if (event.type === 'connect.output') addLine(event.line);
      if (event.type === 'connect.error') {
        addLine(`✗ ${event.message}`);
        setConnecting(null);
      }
      if (event.type === 'connect.complete') {
        addLine('✓ Done');
        updateOne(event.integration);
        setConnecting(null);
        // Re-detect both after connect to keep things in sync
        setTimeout(detectAll, 1000);
      }
    });
  }, [updateOne, detectAll]);

  const disable = useCallback(async (id: string) => {
    const updated = await api.disableAgent(id);
    updateOne(updated);
    detectAll();
  }, [updateOne, detectAll]);

  const enable = useCallback(async (id: string) => {
    const updated = await api.enableAgent(id);
    updateOne(updated);
    detectAll();
  }, [updateOne, detectAll]);

  const deleteIntegration = useCallback((id: string, onEvent: (e: ConnectEvent) => void) => {
    const wrappedHandler = (event: ConnectEvent) => {
      onEvent(event);
      if (event.type === 'connect.complete') {
        updateOne(event.integration);
        detectAll();
      }
    };
    return api.deleteAgent(id, wrappedHandler);
  }, [updateOne, detectAll]);

  return { integrations, connecting, connectLog, refresh, connect, disable, enable, deleteIntegration };
}
