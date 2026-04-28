import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type DiscoveredModel = { value: string; label: string };
export type DiscoverySource = 'live' | 'cached' | 'unsupported' | 'error';
export type DiscoveryResult = {
  models: DiscoveredModel[];
  source: DiscoverySource;
  error?: string;
};

type AuthScheme = 'bearer' | 'x-api-key' | 'none';

type ProviderDiscoveryConfig = {
  envVar?: string;
  buildUrl: (apiKey: string) => string;
  auth: AuthScheme;
  extraHeaders?: Record<string, string>;
  parse: (data: unknown) => DiscoveredModel[];
};

/* ── helpers ─────────────────────────────────────────────────────── */

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asObj(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asStr(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function prefixedModel(prefix: string, id: string): string {
  return id.startsWith(`${prefix}/`) ? id : `${prefix}/${id}`;
}

/* ── per-provider configuration ─────────────────────────────────── */

/**
 * Providers that support live model discovery.
 * Any provider not in this map is treated as "Coming soon" and cannot be connected.
 */
const PROVIDER_DISCOVERY: Record<string, ProviderDiscoveryConfig> = {
  openai: {
    envVar: 'OPENAI_API_KEY',
    buildUrl: () => 'https://api.openai.com/v1/models',
    auth: 'bearer',
    parse: (data) => {
      return asArray(asObj(data).data)
        .map((entry) => asObj(entry))
        .filter((m) => /^(gpt-|o\d|chatgpt|davinci|text-)/i.test(asStr(m.id) ?? ''))
        .map((m) => ({ value: prefixedModel('openai', asStr(m.id)!), label: asStr(m.id)! }));
    }
  },
  anthropic: {
    envVar: 'ANTHROPIC_API_KEY',
    buildUrl: () => 'https://api.anthropic.com/v1/models',
    auth: 'x-api-key',
    extraHeaders: { 'anthropic-version': '2023-06-01' },
    parse: (data) => {
      return asArray(asObj(data).data)
        .map((entry) => asObj(entry))
        .filter((m) => !!asStr(m.id))
        .map((m) => ({
          value: prefixedModel('anthropic', asStr(m.id)!),
          label: asStr(m.display_name) ?? asStr(m.id)!
        }));
    }
  },
  anthropic_token: {
    envVar: 'ANTHROPIC_TOKEN',
    buildUrl: () => 'https://api.anthropic.com/v1/models',
    auth: 'x-api-key',
    extraHeaders: { 'anthropic-version': '2023-06-01' },
    parse: (data) => {
      return asArray(asObj(data).data)
        .map((entry) => asObj(entry))
        .filter((m) => !!asStr(m.id))
        .map((m) => ({
          value: prefixedModel('anthropic', asStr(m.id)!),
          label: asStr(m.display_name) ?? asStr(m.id)!
        }));
    }
  },
  openrouter: {
    envVar: 'OPENROUTER_API_KEY',
    buildUrl: () => 'https://openrouter.ai/api/v1/models',
    auth: 'none',
    parse: (data) => {
      return asArray(asObj(data).data)
        .map((entry) => asObj(entry))
        .filter((m) => {
          const id = asStr(m.id);
          // Strip routing aliases (~ prefix) — these are Hermes-internal and not valid
          // model IDs on any external API, including OpenRouter.
          return !!id && !id.startsWith('~');
        })
        .map((m) => ({
          value: asStr(m.id)!,
          label: asStr(m.name) ?? asStr(m.id)!
        }));
    }
  },
  gemini: {
    envVar: 'GEMINI_API_KEY',
    buildUrl: (key) => `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
    auth: 'none',
    parse: (data) => {
      return asArray(asObj(data).models)
        .map((entry) => asObj(entry))
        .filter((m) => {
          const methods = asArray(m.supportedGenerationMethods).map(asStr);
          return methods.includes('generateContent');
        })
        .map((m) => {
          const id = (asStr(m.name) ?? '').replace(/^models\//, '');
          return { value: prefixedModel('gemini', id), label: asStr(m.displayName) ?? id };
        })
        .filter((m) => m.value.length > 'gemini/'.length);
    }
  },
  'google/gemini': {
    envVar: 'GEMINI_API_KEY',
    buildUrl: (key) => `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
    auth: 'none',
    parse: (data) => {
      return asArray(asObj(data).models)
        .map((entry) => asObj(entry))
        .filter((m) => {
          const methods = asArray(m.supportedGenerationMethods).map(asStr);
          return methods.includes('generateContent');
        })
        .map((m) => {
          const id = (asStr(m.name) ?? '').replace(/^models\//, '');
          return { value: prefixedModel('gemini', id), label: asStr(m.displayName) ?? id };
        })
        .filter((m) => m.value.length > 'gemini/'.length);
    }
  },
  deepseek: {
    envVar: 'DEEPSEEK_API_KEY',
    buildUrl: () => 'https://api.deepseek.com/v1/models',
    auth: 'bearer',
    parse: (data) => {
      return asArray(asObj(data).data)
        .map((entry) => asObj(entry))
        .filter((m) => !!asStr(m.id))
        .map((m) => ({ value: prefixedModel('deepseek', asStr(m.id)!), label: asStr(m.id)! }));
    }
  },
  xai: {
    envVar: 'XAI_API_KEY',
    buildUrl: () => 'https://api.x.ai/v1/models',
    auth: 'bearer',
    parse: (data) => {
      return asArray(asObj(data).data)
        .map((entry) => asObj(entry))
        .filter((m) => !!asStr(m.id))
        .map((m) => ({ value: prefixedModel('xai', asStr(m.id)!), label: asStr(m.id)! }));
    }
  },
  dashscope: {
    envVar: 'DASHSCOPE_API_KEY',
    buildUrl: () => 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models',
    auth: 'bearer',
    parse: (data) => {
      return asArray(asObj(data).data)
        .map((entry) => asObj(entry))
        .filter((m) => !!asStr(m.id))
        .map((m) => ({ value: prefixedModel('qwen', asStr(m.id)!), label: asStr(m.id)! }));
    }
  },
  kimi: {
    envVar: 'KIMI_API_KEY',
    buildUrl: () => 'https://api.moonshot.ai/v1/models',
    auth: 'bearer',
    parse: (data) => {
      return asArray(asObj(data).data)
        .map((entry) => asObj(entry))
        .filter((m) => !!asStr(m.id))
        .map((m) => ({ value: prefixedModel('kimi', asStr(m.id)!), label: asStr(m.id)! }));
    }
  },
  nvidia: {
    envVar: 'NVIDIA_API_KEY',
    buildUrl: () => 'https://integrate.api.nvidia.com/v1/models',
    auth: 'bearer',
    parse: (data) => {
      return asArray(asObj(data).data)
        .map((entry) => asObj(entry))
        .filter((m) => !!asStr(m.id))
        .map((m) => ({ value: prefixedModel('nvidia', asStr(m.id)!), label: asStr(m.id)! }));
    }
  },
  stepfun: {
    envVar: 'STEPFUN_API_KEY',
    buildUrl: () => 'https://api.stepfun.com/v1/models',
    auth: 'bearer',
    parse: (data) => {
      return asArray(asObj(data).data)
        .map((entry) => asObj(entry))
        .filter((m) => !!asStr(m.id))
        .map((m) => ({ value: prefixedModel('stepfun', asStr(m.id)!), label: asStr(m.id)! }));
    }
  },
  zai: {
    envVar: 'GLM_API_KEY',
    buildUrl: () => 'https://open.bigmodel.cn/api/paas/v4/models',
    auth: 'bearer',
    parse: (data) => {
      return asArray(asObj(data).data)
        .map((entry) => asObj(entry))
        .filter((m) => !!asStr(m.id))
        .map((m) => ({ value: prefixedModel('glm', asStr(m.id)!), label: asStr(m.id)! }));
    }
  },
  'glm/zai': {
    envVar: 'GLM_API_KEY',
    buildUrl: () => 'https://open.bigmodel.cn/api/paas/v4/models',
    auth: 'bearer',
    parse: (data) => {
      return asArray(asObj(data).data)
        .map((entry) => asObj(entry))
        .filter((m) => !!asStr(m.id))
        .map((m) => ({ value: prefixedModel('glm', asStr(m.id)!), label: asStr(m.id)! }));
    }
  },
  'ollama-cloud': {
    envVar: 'OLLAMA_API_KEY',
    buildUrl: () => 'https://ollama.com/v1/models',
    auth: 'bearer',
    parse: (data) => {
      return asArray(asObj(data).data)
        .map((entry) => asObj(entry))
        .filter((m) => !!asStr(m.id))
        .map((m) => ({ value: prefixedModel('ollama', asStr(m.id)!), label: asStr(m.id)! }));
    }
  }
};

export const SUPPORTED_DISCOVERY_PROVIDERS = Object.keys(PROVIDER_DISCOVERY);

export function isProviderDiscoverySupported(providerId: string): boolean {
  return providerId in PROVIDER_DISCOVERY;
}

/* ── env-var reader (looks up keys saved by `connectProvider`) ─── */

function readEnvVar(envVar: string, profilePath?: string): string | undefined {
  // 1. Process env (could be set by user or by Hermes parent process)
  const fromProcess = process.env[envVar];
  if (fromProcess && fromProcess.trim()) return fromProcess.trim();

  // 2. ~/.hermes/.env (or profile-specific .env)
  const candidates: string[] = [];
  if (profilePath) {
    candidates.push(path.join(profilePath, '.env'));
  }
  candidates.push(path.join(os.homedir(), '.hermes', '.env'));

  for (const envPath of candidates) {
    try {
      if (!fs.existsSync(envPath)) continue;
      const raw = fs.readFileSync(envPath, 'utf-8');
      for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq < 0) continue;
        const key = trimmed.slice(0, eq).trim();
        if (key !== envVar) continue;
        let value = trimmed.slice(eq + 1).trim();
        // Strip optional surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (value) return value;
      }
    } catch {
      /* ignore unreadable .env */
    }
  }
  return undefined;
}

/* ── cache ──────────────────────────────────────────────────────── */

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { models: DiscoveredModel[]; expiresAt: number }>();

function cacheKey(profileId: string, providerId: string): string {
  return `${profileId}::${providerId}`;
}

/* ── public API ─────────────────────────────────────────────────── */

export async function discoverProviderModels(
  profileId: string,
  providerId: string,
  profilePath?: string
): Promise<DiscoveryResult> {
  const config = PROVIDER_DISCOVERY[providerId];
  if (!config) {
    return { models: [], source: 'unsupported' };
  }

  const key = cacheKey(profileId, providerId);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { models: cached.models, source: 'cached' };
  }

  const apiKey = config.envVar ? readEnvVar(config.envVar, profilePath) : '';
  // OpenRouter doesn't strictly need a key for /models but we still reject if envVar required and missing.
  if (config.auth !== 'none' && !apiKey) {
    return { models: [], source: 'error', error: `Missing API key (${config.envVar}). Connect the provider first.` };
  }

  const url = config.buildUrl(apiKey ?? '');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...config.extraHeaders
  };
  if (config.auth === 'bearer' && apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  if (config.auth === 'x-api-key' && apiKey) headers['x-api-key'] = apiKey;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, { method: 'GET', headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return {
        models: [],
        source: 'error',
        error: `HTTP ${response.status} from ${providerId}: ${text.slice(0, 200) || response.statusText}`
      };
    }
    const json = await response.json();
    const models = config.parse(json);
    if (models.length === 0) {
      return { models: [], source: 'error', error: `Provider returned no usable models.` };
    }
    cache.set(key, { models, expiresAt: Date.now() + CACHE_TTL_MS });
    return { models, source: 'live' };
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : String(err);
    return { models: [], source: 'error', error: message };
  }
}
