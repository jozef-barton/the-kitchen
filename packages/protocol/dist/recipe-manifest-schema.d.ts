import { z } from 'zod';
export declare const RECIPE_PROTOCOL_VERSION = "1.0.0";
export declare const RecipeManifestSchema: z.ZodObject<{
    id: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    name: z.ZodString;
    category: z.ZodString;
    description: z.ZodDefault<z.ZodString>;
    author: z.ZodDefault<z.ZodString>;
    source: z.ZodDefault<z.ZodEnum<{
        user: "user";
        builtin: "builtin";
        community: "community";
    }>>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    protocolVersion: z.ZodDefault<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RecipeManifest = z.infer<typeof RecipeManifestSchema>;
