import { z } from 'zod';
export declare const RecipeSpecSchema: z.ZodObject<{
    purpose: z.ZodDefault<z.ZodString>;
    primaryUserGoal: z.ZodDefault<z.ZodString>;
    whenHermesShouldChoose: z.ZodDefault<z.ZodString>;
    goodFor: z.ZodDefault<z.ZodArray<z.ZodString>>;
    supports: z.ZodDefault<z.ZodArray<z.ZodString>>;
    supportedTabs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    idealDataShape: z.ZodDefault<z.ZodArray<z.ZodString>>;
    requiredSections: z.ZodDefault<z.ZodArray<z.ZodString>>;
    optionalSections: z.ZodDefault<z.ZodArray<z.ZodString>>;
    requiredActions: z.ZodDefault<z.ZodArray<z.ZodString>>;
    optionalActions: z.ZodDefault<z.ZodArray<z.ZodString>>;
    references: z.ZodDefault<z.ZodArray<z.ZodString>>;
    smallPaneAdaptationNotes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    populationInstructions: z.ZodDefault<z.ZodObject<{
        summary: z.ZodDefault<z.ZodString>;
        steps: z.ZodDefault<z.ZodArray<z.ZodString>>;
        guardrails: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    updateRules: z.ZodDefault<z.ZodObject<{
        patchPrefer: z.ZodDefault<z.ZodArray<z.ZodString>>;
        replaceTriggers: z.ZodDefault<z.ZodArray<z.ZodString>>;
        persistAcrossUpdates: z.ZodDefault<z.ZodArray<z.ZodString>>;
        stableRegions: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type RecipeSpec = z.infer<typeof RecipeSpecSchema>;
export declare const RecipeVersionEntrySchema: z.ZodObject<{
    version: z.ZodString;
    summary: z.ZodString;
    savedAt: z.ZodString;
}, z.core.$strip>;
export type RecipeVersionEntry = z.infer<typeof RecipeVersionEntrySchema>;
export declare const RecipeVersionSchema: z.ZodObject<{
    version: z.ZodString;
    summary: z.ZodString;
    savedAt: z.ZodString;
    manifest: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    runtime: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    spec: z.ZodDefault<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    fixture: z.ZodDefault<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type RecipeVersion = z.infer<typeof RecipeVersionSchema>;
