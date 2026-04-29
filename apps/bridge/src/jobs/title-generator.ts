import type { Profile } from '@hermes-recipes/protocol';
import type { HermesCli } from '../hermes-cli/client';

const TITLE_TIMEOUT_MS = 25_000;
const MAX_PROMPT_CHARS = 800;
const MAX_TITLE_CHARS = 80;

export interface TitleGeneratorDeps {
  hermesCli: HermesCli;
  getActiveProfile: () => Profile | null;
}

/**
 * Generate a short display title for a coding job from its first user prompt,
 * via a single-turn Hermes chat. Returns null on any failure — the caller
 * should fall back to the raw prompt for display.
 *
 * Why Hermes: every other LLM path in the bridge already routes through it,
 * so we inherit the user's active provider/model and don't introduce a new
 * dependency surface.
 */
export async function generateJobTitle(
  prompt: string,
  deps: TitleGeneratorDeps
): Promise<string | null> {
  const profile = deps.getActiveProfile();
  if (!profile) {
    console.warn('[coding] title generator skipped — no active profile');
    return null;
  }

  const trimmedPrompt = prompt.trim().slice(0, MAX_PROMPT_CHARS);
  const content =
    'Generate a concise 3 to 6 word title for this coding task. ' +
    'Reply with ONLY the title — no quotes, no punctuation, no prefix, no markdown. ' +
    `Task: ${trimmedPrompt}`;

  const startedAt = Date.now();
  try {
    const result = await deps.hermesCli.streamChat({
      profile,
      content,
      requestMode: 'chat',
      maxTurns: 1,
      timeoutMs: TITLE_TIMEOUT_MS,
      discoveryTimeoutMs: TITLE_TIMEOUT_MS,
      nearbySearchTimeoutMs: TITLE_TIMEOUT_MS,
      recipeOperationTimeoutMs: TITLE_TIMEOUT_MS,
      unrestrictedTimeoutMs: TITLE_TIMEOUT_MS,
      unrestrictedAccessEnabled: false,
      structuredArtifactOnly: false,
      spaceContext: null,
      refreshContext: null,
      requestId: null
    });
    const title = sanitizeTitle(result.assistantMarkdown);
    const elapsedMs = Date.now() - startedAt;
    if (title) {
      console.warn(`[coding] title generated in ${elapsedMs}ms: "${title}"`);
      return title;
    }
    console.warn(`[coding] title generation returned empty result in ${elapsedMs}ms`);
    return null;
  } catch (err) {
    const elapsedMs = Date.now() - startedAt;
    console.warn(`[coding] title generation failed after ${elapsedMs}ms:`, (err as Error).message);
    return null;
  }
}

function sanitizeTitle(raw: string): string {
  if (!raw) return '';
  // Take the first non-empty line — models occasionally add an explanation below.
  const firstLine = raw
    .split('\n')
    .map(line => line.trim())
    .find(line => line.length > 0) ?? '';
  return firstLine
    .replace(/^["'`*_#>\s-]+/, '')
    .replace(/["'`*_\s.]+$/, '')
    .slice(0, MAX_TITLE_CHARS)
    .trim();
}
