import { useEffect, useState } from 'react';
import { getProviderModels, type ProviderModelsResponse } from '../lib/api';

type State = {
  models: ProviderModelsResponse['models'];
  source: ProviderModelsResponse['source'] | 'idle';
  error: string | null;
  loading: boolean;
};

const inflight = new Map<string, Promise<ProviderModelsResponse>>();
const memoryCache = new Map<string, { result: ProviderModelsResponse; expiresAt: number }>();
const CLIENT_TTL_MS = 5 * 60 * 1000;

let supportedProvidersCache: Set<string> | null = null;
const supportedProvidersListeners = new Set<(set: Set<string>) => void>();

function recordSupportedProviders(list: string[]) {
  supportedProvidersCache = new Set(list);
  for (const fn of supportedProvidersListeners) fn(supportedProvidersCache);
}

export function useDiscoverySupportedProviders(): Set<string> | null {
  const [set, setSet] = useState<Set<string> | null>(supportedProvidersCache);
  useEffect(() => {
    if (supportedProvidersCache) setSet(supportedProvidersCache);
    const listener = (next: Set<string>) => setSet(next);
    supportedProvidersListeners.add(listener);
    return () => { supportedProvidersListeners.delete(listener); };
  }, []);
  return set;
}

async function fetchOrReuse(profileId: string, providerId: string): Promise<ProviderModelsResponse> {
  const key = `${profileId}::${providerId}`;
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  const inProgress = inflight.get(key);
  if (inProgress) return inProgress;
  const promise = getProviderModels(profileId, providerId)
    .then((res) => {
      memoryCache.set(key, { result: res, expiresAt: Date.now() + CLIENT_TTL_MS });
      if (res.supportedProviders) recordSupportedProviders(res.supportedProviders);
      return res;
    })
    .finally(() => { inflight.delete(key); });
  inflight.set(key, promise);
  return promise;
}

/**
 * Fetches the live model list for a provider via the bridge.
 * - Returns cached models immediately if available, refetches in background.
 * - On `unsupported` source, models is empty (caller should show "Coming soon").
 */
export function useProviderModels(profileId: string | null, providerId: string | null): State {
  const [state, setState] = useState<State>({ models: [], source: 'idle', error: null, loading: false });

  useEffect(() => {
    if (!profileId || !providerId) {
      setState({ models: [], source: 'idle', error: null, loading: false });
      return;
    }

    const key = `${profileId}::${providerId}`;
    const cached = memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      setState({
        models: cached.result.models,
        source: cached.result.source,
        error: cached.result.error ?? null,
        loading: false
      });
      return;
    }

    let active = true;
    setState((prev) => ({ ...prev, loading: true }));
    fetchOrReuse(profileId, providerId)
      .then((res) => {
        if (!active) return;
        setState({
          models: res.models,
          source: res.source,
          error: res.error ?? null,
          loading: false
        });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setState({
          models: [],
          source: 'error',
          error: err instanceof Error ? err.message : String(err),
          loading: false
        });
      });
    return () => { active = false; };
  }, [profileId, providerId]);

  return state;
}

/** Manually invalidates the in-memory model cache for a provider (e.g. after a fresh connection). */
export function invalidateProviderModels(profileId: string, providerId: string) {
  memoryCache.delete(`${profileId}::${providerId}`);
}
