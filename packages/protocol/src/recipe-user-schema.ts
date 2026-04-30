import { z } from 'zod';

export const RecipeSpecSchema = z.object({
  purpose: z.string().default(''),
  primaryUserGoal: z.string().default(''),
  whenHermesShouldChoose: z.string().default(''),
  goodFor: z.array(z.string()).default([]),
  supports: z.array(z.string()).default([]),
  supportedTabs: z.array(z.string()).default([]),
  idealDataShape: z.array(z.string()).default([]),
  requiredSections: z.array(z.string()).default([]),
  optionalSections: z.array(z.string()).default([]),
  requiredActions: z.array(z.string()).default([]),
  optionalActions: z.array(z.string()).default([]),
  references: z.array(z.string()).default([]),
  smallPaneAdaptationNotes: z.array(z.string()).default([]),
  populationInstructions: z.object({
    summary: z.string().default(''),
    steps: z.array(z.string()).default([]),
    guardrails: z.array(z.string()).default([])
  }).default(() => ({ summary: '', steps: [], guardrails: [] })),
  updateRules: z.object({
    patchPrefer: z.array(z.string()).default([]),
    replaceTriggers: z.array(z.string()).default([]),
    persistAcrossUpdates: z.array(z.string()).default([]),
    stableRegions: z.array(z.string()).default([])
  }).default(() => ({ patchPrefer: [], replaceTriggers: [], persistAcrossUpdates: [], stableRegions: [] }))
});
export type RecipeSpec = z.infer<typeof RecipeSpecSchema>;

export const RecipeVersionEntrySchema = z.object({
  version: z.string(),
  summary: z.string(),
  savedAt: z.string()
});
export type RecipeVersionEntry = z.infer<typeof RecipeVersionEntrySchema>;

export const RecipeVersionSchema = RecipeVersionEntrySchema.extend({
  manifest: z.record(z.string(), z.unknown()),
  runtime: z.record(z.string(), z.unknown()),
  spec: z.record(z.string(), z.unknown()).nullable().default(null),
  fixture: z.record(z.string(), z.unknown()).nullable().default(null)
});
export type RecipeVersion = z.infer<typeof RecipeVersionSchema>;
