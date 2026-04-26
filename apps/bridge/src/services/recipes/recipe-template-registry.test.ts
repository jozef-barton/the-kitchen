import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RecipeTemplateStateSchema } from '@hermes-recipes/protocol';
import {
  getRecipeTemplateRuntimeDefinition,
  listAvailableRecipeTemplateDefinitions,
  refreshDiskRecipeRegistry
} from './recipe-template-registry';
import { getBuiltinRecipesPath } from './recipe-file-loader';

const BUILTIN_TEMPLATE_IDS = [
  'price-comparison-grid',
  'shopping-shortlist',
  'inbox-triage-board',
  'restaurant-finder',
  'hotel-shortlist',
  'flight-comparison',
  'travel-itinerary-planner',
  'research-notebook',
  'security-review-board',
  'vendor-evaluation-matrix',
  'event-planner',
  'job-search-pipeline',

  'local-discovery-comparison',
  'step-by-step-instructions'
] as const;

describe('recipe template registry (disk + TS merge)', () => {
  it('loads every builtin template from disk and prefers disk over the TS fallback', async () => {
    await refreshDiskRecipeRegistry();
    for (const id of BUILTIN_TEMPLATE_IDS) {
      const definition = getRecipeTemplateRuntimeDefinition(id);
      expect(definition, `disk registry missing ${id}`).not.toBeNull();
      expect(definition?.id).toBe(id);
      expect(definition?.selectionSignals.length ?? 0, `${id} has no selection signals`).toBeGreaterThan(0);
      expect(definition?.slots.length ?? 0, `${id} has no slots`).toBeGreaterThan(0);
      // Default actions (refresh/retry-build) are merged in automatically on disk-loaded recipes.
      expect(definition?.actions['refresh-recipe']).toBeDefined();
      expect(definition?.actions['retry-build']).toBeDefined();
    }
  });

  it('every builtin fixture.json parses against RecipeTemplateStateSchema', () => {
    const builtinRoot = getBuiltinRecipesPath();
    for (const id of BUILTIN_TEMPLATE_IDS) {
      const fixturePath = path.join(builtinRoot, id, 'fixture.json');
      expect(fs.existsSync(fixturePath), `${id}/fixture.json missing`).toBe(true);
      const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
      const result = RecipeTemplateStateSchema.safeParse(raw);
      if (!result.success) {
        throw new Error(`${id}/fixture.json failed validation: ${result.error.message}`);
      }
    }
  });

  it('returns null for unknown template ids instead of throwing', async () => {
    await refreshDiskRecipeRegistry();
    expect(getRecipeTemplateRuntimeDefinition('does-not-exist')).toBeNull();
  });

  it('listAvailableRecipeTemplateDefinitions exposes all 15 builtins with no duplicates', async () => {
    await refreshDiskRecipeRegistry();
    const all = listAvailableRecipeTemplateDefinitions();
    const ids = all.map((definition) => definition.id);
    for (const id of BUILTIN_TEMPLATE_IDS) {
      expect(ids, `${id} not in unified registry`).toContain(id);
    }
    // No duplicates.
    expect(new Set(ids).size).toBe(ids.length);
  });
});
