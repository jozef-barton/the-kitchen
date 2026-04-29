// Pricing table per 1M tokens — hand-maintained from Anthropic + OpenAI pricing pages.
// Update when rates change. Units: USD per 1M tokens.

interface ModelPricing {
  inputPerM: number;
  outputPerM: number;
  cacheReadPerM: number;
  cacheWritePerM: number;
}

const CLAUDE_PRICING: Record<string, ModelPricing> = {
  'claude-sonnet-4-6':  { inputPerM: 3.00,  outputPerM: 15.00, cacheReadPerM: 0.30, cacheWritePerM: 3.75 },
  'claude-opus-4-7':    { inputPerM: 15.00, outputPerM: 75.00, cacheReadPerM: 1.50, cacheWritePerM: 18.75 },
  'claude-haiku-4-5':   { inputPerM: 0.80,  outputPerM: 4.00,  cacheReadPerM: 0.08, cacheWritePerM: 1.00 },
  // Aliases
  'sonnet':             { inputPerM: 3.00,  outputPerM: 15.00, cacheReadPerM: 0.30, cacheWritePerM: 3.75 },
  'opus':               { inputPerM: 15.00, outputPerM: 75.00, cacheReadPerM: 1.50, cacheWritePerM: 18.75 },
  'haiku':              { inputPerM: 0.80,  outputPerM: 4.00,  cacheReadPerM: 0.08, cacheWritePerM: 1.00 },
};

const CODEX_PRICING: Record<string, ModelPricing> = {
  // gpt-5-codex family — pricing approximate, update from OpenAI pricing page
  'gpt-5-codex':          { inputPerM: 30.00, outputPerM: 60.00, cacheReadPerM: 7.50, cacheWritePerM: 7.50 },
  'codex-mini-latest':    { inputPerM: 1.50,  outputPerM: 6.00,  cacheReadPerM: 0.375, cacheWritePerM: 0.375 },
};

const DEFAULT_CLAUDE_PRICING = CLAUDE_PRICING['claude-sonnet-4-6']!;
const DEFAULT_CODEX_PRICING = CODEX_PRICING['codex-mini-latest']!;

export function getPricing(agent: 'claude-code' | 'codex', model: string): ModelPricing {
  if (agent === 'claude-code') {
    return CLAUDE_PRICING[model] ?? DEFAULT_CLAUDE_PRICING;
  }
  return CODEX_PRICING[model] ?? DEFAULT_CODEX_PRICING;
}
