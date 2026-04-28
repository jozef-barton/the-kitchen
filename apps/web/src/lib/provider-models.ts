import type { RuntimeProviderOption } from '@hermes-recipes/protocol';

export type StaticModelOption = { value: string; label: string };

/**
 * Providers that support live model discovery via the bridge `/api/provider-models` endpoint.
 * Must mirror the keys of `PROVIDER_DISCOVERY` in `apps/bridge/src/services/model-discovery.ts`.
 * Anything not in this set is treated as "Coming soon" and cannot be connected.
 */
export const DISCOVERY_SUPPORTED_PROVIDERS: ReadonlySet<string> = new Set([
  'openai',
  'anthropic',
  'anthropic_token',
  'openrouter',
  'gemini',
  'google/gemini',
  'deepseek',
  'xai',
  'dashscope',
  'kimi',
  'nvidia',
  'stepfun',
  'zai',
  'glm/zai',
  'ollama-cloud'
]);

export function isProviderSupported(providerId: string): boolean {
  return DISCOVERY_SUPPORTED_PROVIDERS.has(providerId);
}

/**
 * Bundled known-good model IDs per provider. Used as the canonical source for the
 * header model selector and the Settings drawer stepper, so no Hermes runtime
 * cache or LLM discovery is required for models to be selectable.
 *
 * Bridge-supplied options (from Hermes's own model cache, when populated) are
 * merged on top via {@link getProviderModelOptions}.
 */
export const STATIC_PROVIDER_MODELS: Record<string, StaticModelOption[]> = {
  anthropic: [
    { value: 'anthropic/claude-opus-4-7', label: 'Claude Opus 4.7' },
    { value: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { value: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    { value: 'anthropic/claude-opus-4', label: 'Claude Opus 4' },
    { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
    { value: 'anthropic/claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'anthropic/claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
  ],
  anthropic_token: [
    { value: 'anthropic/claude-opus-4-7', label: 'Claude Opus 4.7' },
    { value: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { value: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    { value: 'anthropic/claude-opus-4', label: 'Claude Opus 4' },
    { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
  ],
  openai: [
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'openai/gpt-4.1', label: 'GPT-4.1' },
    { value: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { value: 'openai/o3', label: 'o3' },
    { value: 'openai/o3-mini', label: 'o3 Mini' },
    { value: 'openai/o4-mini', label: 'o4 Mini' },
    { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  gemini: [
    { value: 'gemini/gemini-2.5-pro-preview', label: 'Gemini 2.5 Pro' },
    { value: 'gemini/gemini-2.5-flash-preview', label: 'Gemini 2.5 Flash' },
    { value: 'gemini/gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini/gemini-2.0-flash-thinking-exp', label: 'Gemini 2.0 Flash Thinking' },
    { value: 'gemini/gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini/gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  'google/gemini': [
    { value: 'gemini/gemini-2.5-pro-preview', label: 'Gemini 2.5 Pro' },
    { value: 'gemini/gemini-2.5-flash-preview', label: 'Gemini 2.5 Flash' },
    { value: 'gemini/gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini/gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini/gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  openrouter: [
    { value: 'anthropic/claude-opus-4', label: 'Claude Opus 4 (via OR)' },
    { value: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (via OR)' },
    { value: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5 (via OR)' },
    { value: 'openai/gpt-4o', label: 'GPT-4o (via OR)' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (via OR)' },
    { value: 'openai/o3', label: 'o3 (via OR)' },
    { value: 'google/gemini-2.5-pro-preview', label: 'Gemini 2.5 Pro (via OR)' },
    { value: 'google/gemini-2.5-flash-preview', label: 'Gemini 2.5 Flash (via OR)' },
    { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1 (via OR)' },
    { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat (via OR)' },
    { value: 'x-ai/grok-3', label: 'Grok 3 (via OR)' },
    { value: 'x-ai/grok-3-mini', label: 'Grok 3 Mini (via OR)' },
    { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B (via OR)' },
    { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B (via OR)' },
    { value: 'mistralai/mistral-large-2411', label: 'Mistral Large (via OR)' },
    { value: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B (via OR)' },
  ],
  deepseek: [
    { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat (V3)' },
    { value: 'deepseek/deepseek-reasoner', label: 'DeepSeek Reasoner (R1)' },
    { value: 'deepseek/deepseek-coder', label: 'DeepSeek Coder' },
  ],
  xai: [
    { value: 'xai/grok-3', label: 'Grok 3' },
    { value: 'xai/grok-3-mini', label: 'Grok 3 Mini' },
    { value: 'xai/grok-2-1212', label: 'Grok 2' },
    { value: 'xai/grok-vision-beta', label: 'Grok Vision Beta' },
  ],
  dashscope: [
    { value: 'qwen/qwen-max', label: 'Qwen Max' },
    { value: 'qwen/qwen-plus', label: 'Qwen Plus' },
    { value: 'qwen/qwen-turbo', label: 'Qwen Turbo' },
    { value: 'qwen/qwen2.5-72b-instruct', label: 'Qwen 2.5 72B' },
    { value: 'qwen/qwen2.5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B' },
  ],
  kimi: [
    { value: 'kimi/kimi-k2', label: 'Kimi K2' },
    { value: 'kimi/kimi-k1.5', label: 'Kimi K1.5' },
    { value: 'moonshot/moonshot-v1-128k', label: 'Moonshot v1 128k' },
    { value: 'moonshot/moonshot-v1-32k', label: 'Moonshot v1 32k' },
  ],
  minimax: [
    { value: 'minimax/minimax-text-01', label: 'MiniMax Text 01' },
    { value: 'minimax/abab6.5s-chat', label: 'ABAB 6.5S Chat' },
    { value: 'minimax/abab6.5g-chat', label: 'ABAB 6.5G Chat' },
  ],
  nvidia: [
    { value: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Nemotron 70B' },
    { value: 'nvidia/llama-3.1-nemotron-51b-instruct', label: 'Nemotron 51B' },
    { value: 'nvidia/mistral-nemo-12b-instruct', label: 'Mistral NeMo 12B' },
    { value: 'nvidia/llama-3.2-nv-instruct-v1', label: 'Llama 3.2 NV Instruct' },
  ],
  stepfun: [
    { value: 'stepfun/step-2-16k', label: 'Step-2 16k' },
    { value: 'stepfun/step-1-32k', label: 'Step-1 32k' },
    { value: 'stepfun/step-1-128k', label: 'Step-1 128k' },
    { value: 'stepfun/step-1-8k', label: 'Step-1 8k' },
  ],
  zai: [
    { value: 'glm/glm-4-plus', label: 'GLM-4 Plus' },
    { value: 'glm/glm-4-flash', label: 'GLM-4 Flash' },
    { value: 'glm/glm-4-0520', label: 'GLM-4 0520' },
    { value: 'glm/glm-z1-flash', label: 'GLM Z1 Flash' },
  ],
  'glm/zai': [
    { value: 'glm/glm-4-plus', label: 'GLM-4 Plus' },
    { value: 'glm/glm-4-flash', label: 'GLM-4 Flash' },
    { value: 'glm/glm-4-0520', label: 'GLM-4 0520' },
    { value: 'glm/glm-z1-flash', label: 'GLM Z1 Flash' },
  ],
  nous: [
    { value: 'nous/hermes-3-llama-3.1-405b', label: 'Hermes 3 Llama 3.1 405B' },
    { value: 'nous/hermes-3-llama-3.1-70b', label: 'Hermes 3 Llama 3.1 70B' },
    { value: 'nous/hermes-2-pro-llama-3-8b', label: 'Hermes 2 Pro Llama 3 8B' },
  ],
  'openai-codex': [
    { value: 'openai/codex-mini', label: 'Codex Mini' },
    { value: 'openai/codex-mini-latest', label: 'Codex Mini Latest' },
  ],
  opencode_zen: [
    { value: 'opencode/zen', label: 'OpenCode Zen' },
  ],
  opencode_go: [
    { value: 'opencode/go', label: 'OpenCode Go' },
  ],
  'ollama-cloud': [
    { value: 'ollama/llama3.2', label: 'Llama 3.2' },
    { value: 'ollama/llama3.1', label: 'Llama 3.1' },
    { value: 'ollama/deepseek-r1', label: 'DeepSeek R1' },
    { value: 'ollama/mistral', label: 'Mistral' },
    { value: 'ollama/codellama', label: 'Code Llama' },
    { value: 'ollama/phi3', label: 'Phi-3' },
  ],
  huggingface: [
    { value: 'huggingface/meta-llama/Llama-3.1-70B-Instruct', label: 'Llama 3.1 70B Instruct' },
    { value: 'huggingface/meta-llama/Llama-3.2-11B-Vision-Instruct', label: 'Llama 3.2 11B Vision' },
    { value: 'huggingface/mistralai/Mistral-7B-Instruct-v0.3', label: 'Mistral 7B Instruct' },
    { value: 'huggingface/Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B' },
    { value: 'huggingface/google/gemma-2-9b-it', label: 'Gemma 2 9B' },
    { value: 'huggingface/microsoft/Phi-3.5-mini-instruct', label: 'Phi-3.5 Mini' },
  ],
  // Intentionally absent (no known-good model list):
  //   ai_gateway  — custom OpenAI-compatible endpoint, model is user-defined
  //   kilocode    — provider's model catalogue is not publicly documented
};

/**
 * Returns the merged list of available model options for a provider.
 * Frontend static list is the canonical source; bridge-returned options
 * (e.g. from Hermes's model cache) are appended for any IDs we don't already know.
 */
export function getProviderModelOptions(provider: RuntimeProviderOption | null | undefined): StaticModelOption[] {
  if (!provider) return [];
  const fromStatic = STATIC_PROVIDER_MODELS[provider.id] ?? [];
  const fromBridge: StaticModelOption[] = [];
  // configurationFields[defaultModel].options
  const modelField = provider.configurationFields.find((f) => f.key === 'defaultModel');
  if (modelField?.options) {
    for (const opt of modelField.options) {
      fromBridge.push({ value: opt.value, label: opt.label });
    }
  }
  // provider.models[]
  for (const m of provider.models) {
    fromBridge.push({ value: m.id, label: m.label });
  }

  const seen = new Set<string>();
  const out: StaticModelOption[] = [];
  for (const opt of [...fromStatic, ...fromBridge]) {
    if (seen.has(opt.value)) continue;
    // ~ prefix models are Hermes-internal routing aliases — not valid external API model IDs
    if (opt.value.startsWith('~')) continue;
    seen.add(opt.value);
    out.push(opt);
  }
  return out;
}

/** Whether models for this provider can be auto-detected (not "Coming soon"). */
export function providerHasKnownModels(provider: RuntimeProviderOption): boolean {
  if (!isProviderSupported(provider.id)) return false;
  return getProviderModelOptions(provider).length > 0;
}
