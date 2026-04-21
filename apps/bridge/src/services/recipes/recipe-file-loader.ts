import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { RecipeManifestSchema } from '@hermes-recipes/protocol';
import type { RecipeManifest } from '@hermes-recipes/protocol';

export interface LoadedRecipeFile {
  manifest: RecipeManifest;
  folderPath: string;
  spec: Record<string, unknown> | null;
  fixture: Record<string, unknown> | null;
  runtime: Record<string, unknown> | null;
}

function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getBuiltinRecipesPath(): string {
  // From apps/bridge/src/services/recipes/, the builtin-recipes folder lives at apps/bridge/builtin-recipes/
  // (three directory levels up). Try the three-level path first (works from compiled src/), then fall back
  // to a couple of alternates so the bridge still resolves it when running from a TS loader or from dist.
  const candidates = [
    path.resolve(import.meta.dirname, '../../../builtin-recipes'),
    path.resolve(import.meta.dirname, '../../builtin-recipes'),
    path.resolve(import.meta.dirname, '../../../../builtin-recipes')
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  // Default to the expected location even if missing, so callers get a stable path to report.
  return candidates[0];
}

export function getUserRecipesPath(): string {
  return path.join(os.homedir(), '.hermes', 'recipes');
}

export function discoverRecipeFolders(rootPaths: string[]): RecipeManifest[] {
  const manifests: RecipeManifest[] = [];

  for (const rootPath of rootPaths) {
    if (!fs.existsSync(rootPath)) continue;

    const entries = fs.readdirSync(rootPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(rootPath, entry.name, 'manifest.json');
      const raw = readJsonFile(manifestPath);
      if (!raw) continue;

      try {
        manifests.push(RecipeManifestSchema.parse(raw));
      } catch {
        // Skip invalid manifests
      }
    }
  }

  return manifests;
}

export function loadRecipeFromDisk(folderPath: string): LoadedRecipeFile | null {
  const raw = readJsonFile(path.join(folderPath, 'manifest.json'));
  if (!raw) return null;

  try {
    const manifest = RecipeManifestSchema.parse(raw);
    return {
      manifest,
      folderPath,
      spec: readJsonFile(path.join(folderPath, 'spec.json')),
      fixture: readJsonFile(path.join(folderPath, 'fixture.json')),
      runtime: readJsonFile(path.join(folderPath, 'runtime.json'))
    };
  } catch {
    return null;
  }
}

export function saveRecipeToDisk(folderPath: string, manifest: RecipeManifest, files: {
  spec?: Record<string, unknown>;
  fixture?: Record<string, unknown>;
  runtime?: Record<string, unknown>;
}): void {
  fs.mkdirSync(folderPath, { recursive: true });
  fs.writeFileSync(path.join(folderPath, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  if (files.spec) fs.writeFileSync(path.join(folderPath, 'spec.json'), JSON.stringify(files.spec, null, 2), 'utf8');
  if (files.fixture) fs.writeFileSync(path.join(folderPath, 'fixture.json'), JSON.stringify(files.fixture, null, 2), 'utf8');
  if (files.runtime) fs.writeFileSync(path.join(folderPath, 'runtime.json'), JSON.stringify(files.runtime, null, 2), 'utf8');
}
