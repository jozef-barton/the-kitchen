import http from 'node:http';
import path from 'node:path';
import type { ServerResponse } from 'node:http';
import type { UploadedFile } from '@hermes-recipes/protocol';
import {
  ApplyRecipeEntryActionRequestSchema,
  BeginProviderAuthRequestSchema,
  ChatStreamRequestSchema,
  ConnectProviderRequestSchema,
  CreateProfileRequestSchema,
  CreateRecipeRequestSchema,
  TestModelConfigRequestSchema,
  CreateSessionRequestSchema,
  DeleteRecipeRequestSchema,
  DeleteSessionRequestSchema,
  DeleteSkillRequestSchema,
  SkillSearchRequestSchema,
  SkillInstallRequestSchema,
  ExecuteRecipeActionRequestSchema,
  OpenRecipeChatRequestSchema,
  PollProviderAuthRequestSchema,
  RenameSessionRequestSchema,
  ResolveImagesRequestSchema,
  SelectProfileRequestSchema,
  SelectSessionRequestSchema,
  ToolExecutionResolveRequestSchema,
  UpdateRecipeRequestSchema,
  UpdateRuntimeModelConfigRequestSchema,
  UpdateSettingsRequestSchema,
  UpdateUiStateRequestSchema,
  RecipeManifestSchema
} from '@hermes-recipes/protocol';
import { createUnsplashSourceResolver, resolveImagesInParallel } from '../services/images/image-resolver';
import { refreshDiskRecipeRegistry } from '../services/recipes/recipe-template-registry';

const defaultImageResolver = createUnsplashSourceResolver();

// Prime the disk recipe registry on startup so user recipes and builtin recipe JSON files participate
// in template-definition lookups without waiting for the first request.
void refreshDiskRecipeRegistry();
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { HermesBridge, BridgeError } from '../services/hermes-bridge-service';
import { BridgeDatabase } from '../data/bridge-database';
import { HermesCli } from '../hermes-cli/client';
import { migrateLegacySnapshotIfNeeded } from '../legacy-snapshot';
import { resolveLegacySnapshotCandidates } from '../paths';
import { evaluateLocalOriginPolicy, createCorsHeaders } from './origin-policy';
import { validateRecipeId, resolveWithinRoot, validateVersion, PathValidationError } from './path-validation';
import { readJsonBody, PayloadTooLargeError } from './request-body';
import { sendJson, sendSseHeaders, writeSseEvent } from './response';
import { serveStaticAsset } from './static-assets';
import { buildRecipeBuilderSystemPrompt } from '../services/recipes/recipe-builder-prompt';
import { BlobStore, classifyFileKind } from '../services/uploads/blob-store';
import { parseMultipartUpload } from '../services/uploads/multipart';
import { parseAttachment } from '../services/uploads/attachment-parser';
import { scheduleTranscription } from '../services/uploads/transcription-service';

function toApiErrorPayload(error: unknown) {
  if (error instanceof BridgeError) {
    return {
      statusCode: error.statusCode,
      error: {
        code: error.code,
        message: error.message
      }
    };
  }

  if (error instanceof PathValidationError) {
    return {
      statusCode: 400,
      error: {
        code: 'INVALID_REQUEST',
        message: error.message
      }
    };
  }

  if (error instanceof PayloadTooLargeError) {
    return {
      statusCode: 413,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: error.message
      }
    };
  }

  // Log the raw error server-side for diagnosis but do not leak internals (paths, SQL errors,
  // stack traces) to the client.
  if (error instanceof Error) {
    console.error('[bridge] Unhandled error:', error);
  } else {
    console.error('[bridge] Unhandled non-error thrown:', error);
  }

  return {
    statusCode: 500,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. See the bridge logs for details.'
    }
  };
}

function sendError(response: ServerResponse, error: unknown, allowOrigin?: string, preferSse = false) {
  const payload = toApiErrorPayload(error);
  if (response.destroyed || response.writableEnded) {
    return;
  }

  if (response.headersSent) {
    if (preferSse) {
      try {
        writeSseEvent(response, {
          type: 'error',
          error: payload.error
        });
      } catch {
        // Ignore write failures when the client disconnects mid-stream.
      }
    }

    if (!response.writableEnded) {
      response.end();
    }
    return;
  }

  sendJson(
    response,
    payload.statusCode,
    {
      error: payload.error
    },
    allowOrigin
  );
}

function validateUserRecipe(manifest: unknown, runtime: unknown, spec: unknown): string[] {
  const errors: string[] = [];
  const m = manifest as Record<string, unknown> | null;
  const rt = runtime as Record<string, unknown> | null;
  const sp = spec as Record<string, unknown> | null;
  if (!m?.id || typeof m.id !== 'string' || !/^[a-z0-9-]+$/.test(m.id as string)) errors.push('Recipe ID must be lowercase kebab-case (e.g. my-recipe)');
  if (!m?.name || String(m.name).trim().length === 0) errors.push('Recipe name is required');
  if (!m?.category) errors.push('Recipe category is required');
  if (!rt || !Array.isArray(rt.selectionSignals) || rt.selectionSignals.length === 0) errors.push('At least one selection signal is required');
  if (!rt || !Array.isArray(rt.slots) || rt.slots.length === 0) errors.push('At least one slot is required');
  const validSlotKinds = ['comparison-table', 'card-grid', 'notes', 'grouped-list', 'stats', 'timeline', 'kanban', 'hero', 'filter-strip', 'action-bar'];
  if (rt && Array.isArray(rt.slots)) {
    for (const slot of rt.slots as Array<Record<string, unknown>>) {
      if (typeof slot.kind === 'string' && !validSlotKinds.includes(slot.kind)) {
        errors.push(`Invalid slot kind: ${slot.kind}`);
      }
    }
  }
  if (!sp?.purpose || String(sp.purpose).trim().length === 0) errors.push('Purpose is required (Info tab)');
  const popInstr = sp?.populationInstructions as Record<string, unknown> | null | undefined;
  if (!popInstr?.summary || String(popInstr.summary).trim().length === 0) errors.push('Population instructions summary is required');
  if (!Array.isArray(popInstr?.steps) || (popInstr?.steps as unknown[]).length === 0) errors.push('At least one population step is required');
  return errors;
}

export function createBridgeServer(options: {
  databasePath: string;
  cliPath?: string;
  staticDirectory?: string;
  recipeRoot?: string;
  legacySnapshotPaths?: string[];
  asyncRecipeEnrichmentTimeoutMs?: number;
  asyncRecipeAppletTimeoutMs?: number;
}) {
  const database = new BridgeDatabase(options.databasePath);
  migrateLegacySnapshotIfNeeded(database, {
    snapshotPaths: options.legacySnapshotPaths ?? resolveLegacySnapshotCandidates()
  });
  const uploadsRoot = path.join(path.dirname(options.databasePath), 'uploads');
  const blobStore = new BlobStore(uploadsRoot);
  const hermesCli = new HermesCli({
    cliPath: options.cliPath
  });
  const bridge = new HermesBridge({
    database,
    hermesCli,
    recipeRoot: options.recipeRoot,
    asyncRecipeAppletTimeoutMs:
      options.asyncRecipeEnrichmentTimeoutMs ??
      options.asyncRecipeAppletTimeoutMs ??
      (() => {
        const rawValue =
          process.env.HERMES_ASYNC_WORKRECIPE_ENRICHMENT_TIMEOUT_MS ??
          process.env.HERMES_ASYNC_WORKRECIPE_APPLET_TIMEOUT_MS;
        if (!rawValue) {
          return undefined;
        }

        const parsedValue = Number.parseInt(rawValue, 10);
        return Number.isFinite(parsedValue) ? parsedValue : undefined;
      })()
  });

  const server = http.createServer(async (request, response) => {
    let preferSseErrors = false;

    if (!request.url) {
      sendJson(
        response,
        400,
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'Request URL is missing.'
          }
        },
        undefined
      );
      return;
    }

    const originDecision = evaluateLocalOriginPolicy(request);
    if (!originDecision.allowed) {
      sendJson(
        response,
        403,
        {
          error: {
            code: 'ORIGIN_FORBIDDEN',
            message: originDecision.message ?? 'The Hermes bridge rejected the request origin.'
          }
        },
        undefined
      );
      return;
    }

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'access-control-allow-origin': originDecision.allowOrigin ?? request.headers.origin ?? '',
        'access-control-allow-headers': 'content-type, x-hermes-bridge',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        vary: 'Origin'
      });
      response.end();
      return;
    }

    const url = new URL(request.url, 'http://127.0.0.1');
    const { pathname, searchParams } = url;

    try {
      if (request.method === 'GET' && pathname === '/api/health') {
        sendJson(response, 200, bridge.getHealth(), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/bootstrap') {
        sendJson(response, 200, await bridge.getBootstrap(), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/profiles/select') {
        const payload = SelectProfileRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.selectProfile(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/profiles') {
        const payload = CreateProfileRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 201, await bridge.createProfile(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'DELETE' && /^\/api\/profiles\/[^/]+$/.test(pathname)) {
        const profileId = decodeURIComponent(pathname.split('/')[3] ?? '');
        sendJson(response, 200, await bridge.deleteProfile({ profileId }), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/profiles/metrics') {
        sendJson(response, 200, bridge.getProfilesMetrics(), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/model-providers/test') {
        const payload = TestModelConfigRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.testModelConfig(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/sessions') {
        const payload = CreateSessionRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 201, await bridge.createSession(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/images/resolve') {
        const payload = ResolveImagesRequestSchema.parse(await readJsonBody(request));
        const results = await resolveImagesInParallel(defaultImageResolver, payload.queries);
        sendJson(response, 200, { results }, originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/recipes/templates') {
        const { discoverRecipeFolders, getBuiltinRecipesPath, getUserRecipesPath } = await import('../services/recipes/recipe-file-loader');
        const manifests = discoverRecipeFolders([getBuiltinRecipesPath(), getUserRecipesPath()]);
        sendJson(response, 200, { templates: manifests }, originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/recipes/templates/settings') {
        const { getUserRecipesPath, discoverRecipeFolders } = await import('../services/recipes/recipe-file-loader');
        const overrides = database.getTemplateEnabledOverrides();
        const userRecipeManifests = discoverRecipeFolders([getUserRecipesPath()]);
        sendJson(response, 200, { overrides, userRecipes: userRecipeManifests }, originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/recipes/user') {
        const { getUserRecipesPath, loadRecipeFromDisk } = await import('../services/recipes/recipe-file-loader');
        const fs = await import('node:fs');
        const userRecipesPath = getUserRecipesPath();
        const userRecipes: Array<{ manifest: unknown; runtime: unknown | null; errors: string[] }> = [];
        if (fs.existsSync(userRecipesPath)) {
          const entries = fs.readdirSync(userRecipesPath, { withFileTypes: true });
          for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const folderPath = path.join(userRecipesPath, entry.name);
            const loaded = loadRecipeFromDisk(folderPath);
            if (loaded) {
              const errors: string[] = [];
              if (!loaded.runtime) errors.push('Missing runtime.json');
              else {
                const rt = loaded.runtime as Record<string, unknown>;
                if (!Array.isArray(rt.selectionSignals) || (rt.selectionSignals as unknown[]).length === 0) {
                  errors.push('selectionSignals must be a non-empty array');
                }
                if (!Array.isArray(rt.slots) || (rt.slots as unknown[]).length === 0) {
                  errors.push('slots must be a non-empty array');
                }
              }
              userRecipes.push({ manifest: loaded.manifest, runtime: loaded.runtime, errors });
            }
          }
        }
        sendJson(response, 200, { userRecipes }, originDecision.allowOrigin);
        return;
      }

      if (request.method === 'DELETE' && /^\/api\/recipes\/user\/[^/]+$/.test(pathname)) {
        const recipeId = validateRecipeId(decodeURIComponent(pathname.split('/')[4] ?? ''));
        const { getUserRecipesPath } = await import('../services/recipes/recipe-file-loader');
        const fs = await import('node:fs');
        const folderPath = resolveWithinRoot(getUserRecipesPath(), recipeId);
        if (fs.existsSync(folderPath)) {
          fs.rmSync(folderPath, { recursive: true, force: true });
        }
        sendJson(response, 200, { deleted: recipeId }, originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && /^\/api\/recipes\/user\/[^/]+$/.test(pathname)) {
        const recipeId = validateRecipeId(decodeURIComponent(pathname.split('/')[4] ?? ''));
        const { getUserRecipesPath, loadRecipeFromDisk } = await import('../services/recipes/recipe-file-loader');
        const { listVersions } = await import('../services/recipes/recipe-version-manager');
        const folderPath = resolveWithinRoot(getUserRecipesPath(), recipeId);
        const loaded = loadRecipeFromDisk(folderPath);
        if (!loaded) throw new BridgeError(404, 'NOT_FOUND', `Recipe ${recipeId} not found.`);
        const versions = listVersions(folderPath);
        sendJson(response, 200, {
          manifest: loaded.manifest,
          runtime: loaded.runtime,
          spec: loaded.spec,
          fixture: loaded.fixture,
          versions
        }, originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && /^\/api\/recipes\/user\/[^/]+\/versions$/.test(pathname)) {
        const recipeId = validateRecipeId(decodeURIComponent(pathname.split('/')[4] ?? ''));
        const { getUserRecipesPath } = await import('../services/recipes/recipe-file-loader');
        const { listVersions } = await import('../services/recipes/recipe-version-manager');
        const folderPath = resolveWithinRoot(getUserRecipesPath(), recipeId);
        const versions = listVersions(folderPath);
        sendJson(response, 200, { versions }, originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && /^\/api\/recipes\/user\/[^/]+\/save$/.test(pathname)) {
        const recipeId = validateRecipeId(decodeURIComponent(pathname.split('/')[4] ?? ''));
        const body = await readJsonBody(request) as {
          summary?: string;
          manifest?: Record<string, unknown>;
          runtime?: Record<string, unknown>;
          spec?: Record<string, unknown> | null;
          fixture?: Record<string, unknown> | null;
        };
        const { manifest, runtime, spec = null, fixture = null } = body;
        const summary = body.summary ?? '';
        const errors = validateUserRecipe(manifest ?? null, runtime ?? null, spec ?? null);
        if (errors.length > 0) {
          sendJson(response, 400, { errors }, originDecision.allowOrigin);
          return;
        }
        const { getUserRecipesPath } = await import('../services/recipes/recipe-file-loader');
        const { saveVersion, listVersions } = await import('../services/recipes/recipe-version-manager');
        const fs = await import('node:fs');
        const folderPath = resolveWithinRoot(getUserRecipesPath(), recipeId);
        fs.mkdirSync(folderPath, { recursive: true });
        fs.writeFileSync(path.join(folderPath, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
        fs.writeFileSync(path.join(folderPath, 'runtime.json'), JSON.stringify(runtime, null, 2), 'utf8');
        if (spec) fs.writeFileSync(path.join(folderPath, 'spec.json'), JSON.stringify(spec, null, 2), 'utf8');
        if (fixture) fs.writeFileSync(path.join(folderPath, 'fixture.json'), JSON.stringify(fixture, null, 2), 'utf8');
        const newVersion = saveVersion(folderPath, summary, {
          manifest: manifest as Record<string, unknown>,
          runtime: runtime as Record<string, unknown>,
          spec: spec ?? null,
          fixture: fixture ?? null
        });
        const versions = listVersions(folderPath);
        // Refresh the disk registry so the saved recipe becomes available for selection immediately.
        void refreshDiskRecipeRegistry();
        sendJson(response, 200, {
          version: newVersion,
          recipe: { manifest, runtime, spec, fixture, versions }
        }, originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && /^\/api\/recipes\/user\/[^/]+\/rollback$/.test(pathname)) {
        const recipeId = validateRecipeId(decodeURIComponent(pathname.split('/')[4] ?? ''));
        const body = await readJsonBody(request) as { version?: string };
        const version = validateVersion(body.version);
        const { getUserRecipesPath } = await import('../services/recipes/recipe-file-loader');
        const { rollbackToVersion, listVersions } = await import('../services/recipes/recipe-version-manager');
        const folderPath = resolveWithinRoot(getUserRecipesPath(), recipeId);
        const rolled = rollbackToVersion(folderPath, version);
        if (!rolled) throw new BridgeError(404, 'NOT_FOUND', `Version ${version} not found for recipe ${recipeId}.`);
        const versions = listVersions(folderPath);
        sendJson(response, 200, {
          manifest: rolled.manifest,
          runtime: rolled.runtime,
          spec: rolled.spec,
          fixture: rolled.fixture,
          versions,
          version: rolled.version
        }, originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/recipes') {
        const profileId = searchParams.get('profileId');
        if (!profileId) {
          throw new BridgeError(400, 'PROFILE_REQUIRED', 'profileId is required.');
        }

        sendJson(response, 200, await bridge.listRecipes(profileId), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/recipes') {
        const payload = CreateRecipeRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 201, await bridge.createRecipe(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && /^\/api\/recipes\/[^/]+$/.test(pathname)) {
        const profileId = searchParams.get('profileId');
        if (!profileId) {
          throw new BridgeError(400, 'PROFILE_REQUIRED', 'profileId is required.');
        }

        const recipeId = decodeURIComponent(pathname.split('/')[3] ?? '');
        sendJson(response, 200, await bridge.getRecipe(profileId, recipeId), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'PUT' && /^\/api\/recipes\/[^/]+$/.test(pathname)) {
        const recipeId = decodeURIComponent(pathname.split('/')[3] ?? '');
        const payload = UpdateRecipeRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.updateRecipe(recipeId, payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && /^\/api\/recipes\/[^/]+\/delete$/.test(pathname)) {
        const recipeId = decodeURIComponent(pathname.split('/')[3] ?? '');
        const payload = DeleteRecipeRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.deleteRecipe(recipeId, payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && /^\/api\/recipes\/[^/]+\/entries\/actions$/.test(pathname)) {
        const recipeId = decodeURIComponent(pathname.split('/')[3] ?? '');
        const payload = ApplyRecipeEntryActionRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.applyRecipeEntryAction(recipeId, payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && /^\/api\/recipes\/[^/]+\/actions\/stream$/.test(pathname)) {
        const recipeId = decodeURIComponent(pathname.split('/')[3] ?? '');
        const payload = ExecuteRecipeActionRequestSchema.parse(await readJsonBody(request));
        preferSseErrors = true;
        sendSseHeaders(response, originDecision.allowOrigin);
        await bridge.streamRecipeAction(recipeId, payload, (event) => {
          writeSseEvent(response, event);
        });
        response.end();
        return;
      }

      if (request.method === 'POST' && /^\/api\/recipes\/[^/]+\/open-chat$/.test(pathname)) {
        const recipeId = decodeURIComponent(pathname.split('/')[3] ?? '');
        const payload = OpenRecipeChatRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.openRecipeChat(recipeId, payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/sessions/select') {
        const payload = SelectSessionRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.selectSession(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && /^\/api\/sessions\/[^/]+\/rename$/.test(pathname)) {
        const sessionId = decodeURIComponent(pathname.split('/')[3] ?? '');
        const payload = RenameSessionRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.renameSession(sessionId, payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && /^\/api\/sessions\/[^/]+\/delete$/.test(pathname)) {
        const sessionId = decodeURIComponent(pathname.split('/')[3] ?? '');
        const payload = DeleteSessionRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.deleteSession(sessionId, payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/sessions') {
        const profileId = searchParams.get('profileId');
        if (!profileId) {
          throw new BridgeError(400, 'PROFILE_REQUIRED', 'profileId is required.');
        }

        const page = Number.parseInt(searchParams.get('page') ?? '1', 10);
        const pageSize = Number.parseInt(searchParams.get('pageSize') ?? '50', 10);
        const search = searchParams.get('search') ?? '';
        sendJson(response, 200, await bridge.listSessions(profileId, page, pageSize, search), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && /^\/api\/sessions\/[^/]+\/messages$/.test(pathname)) {
        const profileId = searchParams.get('profileId');
        if (!profileId) {
          throw new BridgeError(400, 'PROFILE_REQUIRED', 'profileId is required.');
        }

        const sessionId = decodeURIComponent(pathname.split('/')[3] ?? '');
        sendJson(response, 200, await bridge.getSessionMessages(profileId, sessionId), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && /^\/api\/sessions\/[^/]+\/export$/.test(pathname)) {
        const profileId = searchParams.get('profileId');
        if (!profileId) {
          throw new BridgeError(400, 'PROFILE_REQUIRED', 'profileId is required.');
        }

        const sessionId = decodeURIComponent(pathname.split('/')[3] ?? '');
        sendJson(response, 200, await bridge.exportSession(profileId, sessionId), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/jobs') {
        const profileId = searchParams.get('profileId');
        if (!profileId) {
          throw new BridgeError(400, 'PROFILE_REQUIRED', 'profileId is required.');
        }
        sendJson(response, 200, await bridge.getJobs(profileId), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/tools') {
        const profileId = searchParams.get('profileId');
        if (!profileId) {
          throw new BridgeError(400, 'PROFILE_REQUIRED', 'profileId is required.');
        }
        sendJson(response, 200, await bridge.getTools(profileId), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/skills') {
        const profileId = searchParams.get('profileId');
        if (!profileId) {
          throw new BridgeError(400, 'PROFILE_REQUIRED', 'profileId is required.');
        }
        sendJson(response, 200, await bridge.getSkills(profileId), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && /^\/api\/skills\/[^/]+\/delete$/.test(pathname)) {
        const skillId = decodeURIComponent(pathname.split('/')[3] ?? '');
        const payload = DeleteSkillRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.deleteSkill(skillId, payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/skills/search') {
        const payload = SkillSearchRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.searchSkillsHub(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/skills/install') {
        const payload = SkillInstallRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.installSkillFromHub(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/model-providers') {
        const profileId = searchParams.get('profileId');
        if (!profileId) {
          throw new BridgeError(400, 'PROFILE_REQUIRED', 'profileId is required.');
        }
        const inspectedProviderId = searchParams.get('inspectedProviderId');
        sendJson(response, 200, await bridge.getModelProviderState(profileId, inspectedProviderId), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'PUT' && pathname === '/api/model-providers') {
        const payload = UpdateRuntimeModelConfigRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.updateRuntimeModelConfig(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/provider-connections') {
        const payload = ConnectProviderRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.connectProvider(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/provider-auth') {
        const payload = BeginProviderAuthRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.beginProviderAuth(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/provider-auth/poll') {
        const payload = PollProviderAuthRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.pollProviderAuth(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/tool-history') {
        const profileId = searchParams.get('profileId');
        if (!profileId) {
          throw new BridgeError(400, 'PROFILE_REQUIRED', 'profileId is required.');
        }

        const page = Number.parseInt(searchParams.get('page') ?? '1', 10);
        const pageSize = Number.parseInt(searchParams.get('pageSize') ?? '25', 10);
        sendJson(response, 200, await bridge.listToolHistory(page, pageSize, profileId), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/telemetry') {
        const profileId = searchParams.get('profileId') ?? undefined;
        const sessionId = searchParams.get('sessionId') ?? undefined;
        const requestId = searchParams.get('requestId') ?? undefined;
        const limit = Number.parseInt(searchParams.get('limit') ?? '', 10);
        const page = Number.parseInt(searchParams.get('page') ?? '1', 10);
        const pageSize = Number.parseInt(searchParams.get('pageSize') ?? (Number.isFinite(limit) ? String(limit) : '25'), 10);

        sendJson(
          response,
          200,
          await bridge.listTelemetry({
            profileId,
            sessionId,
            requestId,
            limit: Number.isFinite(limit) ? limit : undefined,
            page: Number.isFinite(page) ? page : 1,
            pageSize: Number.isFinite(pageSize) ? pageSize : 25
          }),
          originDecision.allowOrigin
        );
        return;
      }

      if (request.method === 'GET' && pathname === '/api/audit-events') {
        const profileId = searchParams.get('profileId') ?? undefined;
        const page = Number.parseInt(searchParams.get('page') ?? '1', 10);
        const pageSize = Number.parseInt(searchParams.get('pageSize') ?? '25', 10);

        sendJson(
          response,
          200,
          await bridge.listAuditEvents({
            profileId,
            page: Number.isFinite(page) ? page : 1,
            pageSize: Number.isFinite(pageSize) ? pageSize : 25
          }),
          originDecision.allowOrigin
        );
        return;
      }

      if (request.method === 'GET' && pathname === '/api/settings') {
        sendJson(response, 200, bridge.getSettings(), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'PUT' && pathname === '/api/settings') {
        const payload = UpdateSettingsRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.updateSettings(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'PUT' && pathname === '/api/ui-state') {
        const payload = UpdateUiStateRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.updateUiState(payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/tool-executions') {
        sendJson(response, 201, await bridge.prepareToolExecution(await readJsonBody(request)), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && /^\/api\/tool-executions\/[^/]+\/resolve$/.test(pathname)) {
        const executionId = decodeURIComponent(pathname.split('/')[3] ?? '');
        const payload = ToolExecutionResolveRequestSchema.parse(await readJsonBody(request));
        sendJson(response, 200, await bridge.resolveToolExecution(executionId, payload), originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/chat/stream') {
        const payload = ChatStreamRequestSchema.parse(await readJsonBody(request));
        preferSseErrors = true;
        sendSseHeaders(response, originDecision.allowOrigin);
        await bridge.streamChat(payload, async (event) => {
          writeSseEvent(response, event);
        });
        response.end();
        return;
      }

      if (request.method === 'PATCH' && /^\/api\/recipes\/templates\/[^/]+\/enabled$/.test(pathname)) {
        const templateId = decodeURIComponent(pathname.split('/')[4] ?? '');
        const body = await readJsonBody(request) as { enabled?: boolean };
        if (typeof body.enabled !== 'boolean') {
          throw new BridgeError(400, 'INVALID_REQUEST', 'enabled must be a boolean.');
        }
        database.setTemplateEnabled(templateId, body.enabled);

        // Also update manifest.json on disk for user recipes
        const { getUserRecipesPath, loadRecipeFromDisk, saveRecipeToDisk } = await import('../services/recipes/recipe-file-loader');
        const userRecipesPath = getUserRecipesPath();
        const folderPath = path.join(userRecipesPath, templateId);
        const loaded = loadRecipeFromDisk(folderPath);
        if (loaded) {
          const updatedManifest = { ...loaded.manifest, enabled: body.enabled };
          saveRecipeToDisk(folderPath, RecipeManifestSchema.parse(updatedManifest), {
            runtime: loaded.runtime ?? undefined,
            spec: loaded.spec ?? undefined,
            fixture: loaded.fixture ?? undefined
          });
        }

        sendJson(response, 200, { templateId, enabled: body.enabled }, originDecision.allowOrigin);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/recipes/builder/chat') {
        const body = await readJsonBody(request) as {
          profileId?: string;
          sessionId?: string;
          message?: string;
          currentRecipe?: Record<string, unknown> | null;
          recipeId?: string;
        };

        if (!body.profileId) throw new BridgeError(400, 'PROFILE_REQUIRED', 'profileId is required.');
        if (!body.message) throw new BridgeError(400, 'MESSAGE_REQUIRED', 'message is required.');

        const profile = database.getProfile(body.profileId);
        if (!profile) throw new BridgeError(404, 'PROFILE_NOT_FOUND', `Profile ${body.profileId} not found.`);

        // Create or reuse a session for the builder
        let sessionId = body.sessionId;
        if (!sessionId) {
          const session = await bridge.createSession({ profileId: body.profileId });
          sessionId = session.id;
        }

        // Build the enriched content for Hermes (includes builder system prompt)
        const builderSystemPrompt = buildRecipeBuilderSystemPrompt(body.currentRecipe ?? null);
        const hermesContent = `${builderSystemPrompt}\n\nUser request: ${body.message}`;
        const transcriptContent = body.message;

        preferSseErrors = true;
        sendSseHeaders(response, originDecision.allowOrigin);

        // Emit the session ID so the frontend can reuse it for subsequent messages
        writeSseEvent(response, { type: 'builder_session', sessionId });

        let lastAssistantContent = '';

        await bridge.streamBuilderChat(
          { profileId: body.profileId, sessionId, transcriptContent, hermesContent },
          (event) => {
            writeSseEvent(response, event);

            // Track the final assistant message for recipe definition extraction
            if (event.type === 'complete') {
              lastAssistantContent = event.assistantMessage.content;
            }
            if (event.type === 'assistant_snapshot') {
              lastAssistantContent = event.markdown;
            }
          }
        );

        // After the chat stream completes, extract <recipe_definition> from the response
        const defMatch = lastAssistantContent.match(/<recipe_definition>([\s\S]*?)<\/recipe_definition>/);
        if (defMatch) {
          try {
            const parsed = JSON.parse(defMatch[1].trim()) as {
              manifest?: Record<string, unknown>;
              runtime?: Record<string, unknown>;
              spec?: Record<string, unknown> | null;
              fixture?: Record<string, unknown> | null;
            };

            const manifest = parsed.manifest;
            const runtime = parsed.runtime;
            const spec = parsed.spec ?? null;
            const fixture = parsed.fixture ?? null;
            const errors: string[] = [];

            if (!manifest) errors.push('Missing manifest in recipe_definition');
            if (!runtime) errors.push('Missing runtime in recipe_definition');

            if (manifest && runtime) {
              const proposedRecipeId = body.recipeId ?? (manifest.id as string | undefined) ?? `user-${Date.now()}`;
              const recipeId = validateRecipeId(proposedRecipeId);
              const { getUserRecipesPath, saveRecipeToDisk } = await import('../services/recipes/recipe-file-loader');
              const folderPath = resolveWithinRoot(getUserRecipesPath(), recipeId);
              try {
                const validManifest = RecipeManifestSchema.parse({ ...manifest, id: recipeId, source: 'user' });
                saveRecipeToDisk(folderPath, validManifest, {
                  runtime,
                  spec: spec ?? undefined,
                  fixture: fixture ?? undefined
                });
                writeSseEvent(response, {
                  type: 'recipe_builder_update',
                  manifest: validManifest,
                  runtime,
                  spec,
                  fixture,
                  errors: []
                });
              } catch (saveErr) {
                errors.push(saveErr instanceof Error ? saveErr.message : 'Failed to save recipe.');
                writeSseEvent(response, { type: 'recipe_builder_update', manifest, runtime, spec, fixture, errors });
              }
            } else {
              writeSseEvent(response, { type: 'recipe_builder_update', manifest: manifest ?? null, runtime: runtime ?? null, spec, fixture, errors });
            }
          } catch {
            writeSseEvent(response, { type: 'recipe_builder_update', manifest: null, runtime: null, spec: null, fixture: null, errors: ['Failed to parse recipe_definition JSON.'] });
          }
        }

        response.end();
        return;
      }

      // POST /api/uploads — multipart file upload
      if (request.method === 'POST' && pathname === '/api/uploads') {
        const profileId = searchParams.get('profileId');
        const sessionId = searchParams.get('sessionId') ?? null;
        if (!profileId) throw new BridgeError(400, 'PROFILE_REQUIRED', 'profileId query param is required.');
        const profile = database.getProfile(profileId);
        if (!profile) throw new BridgeError(404, 'PROFILE_NOT_FOUND', `Profile ${profileId} not found.`);

        const uploadedFiles: UploadedFile[] = [];
        // Map from storage path → fileId so we can correlate after busboy finishes
        const pathToFileId = new Map<string, string>();

        const formData = await parseMultipartUpload(
          request,
          (filename, _mimeType) => {
            const fileId = `upload-${randomUUID()}`;
            const storagePath = blobStore.resolveStoragePath(profileId, fileId, filename);
            pathToFileId.set(storagePath, fileId);
            return storagePath;
          },
          { maxFiles: 20 }
        );

        const now = new Date().toISOString();

        for (const part of formData.files) {
          const fileId = pathToFileId.get(part.storagePath) ?? `upload-${randomUUID()}`;
          const kind = classifyFileKind(part.mimeType, part.filename);
          const storagePath = part.storagePath;

          database.insertUploadedFile({
            id: fileId,
            profileId,
            sessionId,
            filename: part.filename,
            mimeType: part.mimeType,
            fileKind: kind,
            fileSize: part.bytesWritten,
            storagePath,
            createdAt: now
          });

          const record = database.getUploadedFile(fileId);
          if (record) uploadedFiles.push(record);

          // Start async parsing (non-blocking)
          parseAttachment(storagePath, kind, part.mimeType)
            .then((result) => {
              if (result) {
                database.updateUploadedFileParse(fileId, {
                  status: 'done',
                  parsedText: result.text,
                  parseError: null
                });
              } else {
                database.updateUploadedFileParse(fileId, { status: 'not_applicable' });
              }
            })
            .catch(() => {
              database.updateUploadedFileParse(fileId, { status: 'failed', parseError: 'Parsing failed.' });
            });

          // Schedule async audio transcription
          if (kind === 'audio') {
            const openAiKey = process.env.VOICE_TOOLS_OPENAI_KEY ?? process.env.OPENAI_API_KEY;
            void scheduleTranscription(fileId, storagePath, part.filename, database, openAiKey);
          }
        }

        sendJson(response, 200, { files: uploadedFiles }, originDecision.allowOrigin);
        return;
      }

      // GET /api/uploads/:id — fetch upload metadata/status
      if (request.method === 'GET' && /^\/api\/uploads\/[^/]+$/.test(pathname)) {
        const fileId = decodeURIComponent(pathname.split('/')[3] ?? '');
        const record = database.getUploadedFile(fileId);
        if (!record) throw new BridgeError(404, 'UPLOAD_NOT_FOUND', `Upload ${fileId} not found.`);
        sendJson(response, 200, { file: record }, originDecision.allowOrigin);
        return;
      }

      // GET /api/uploads/:id/content — stream the file bytes
      if (request.method === 'GET' && /^\/api\/uploads\/[^/]+\/content$/.test(pathname)) {
        const fileId = decodeURIComponent(pathname.split('/')[3] ?? '');
        const record = database.getUploadedFile(fileId);
        if (!record) throw new BridgeError(404, 'UPLOAD_NOT_FOUND', `Upload ${fileId} not found.`);

        const storagePath = database.getUploadedFileStoragePath(fileId);
        if (!storagePath) throw new BridgeError(404, 'UPLOAD_NOT_FOUND', `File storage path not found.`);

        const fileStat = await fs.promises.stat(storagePath).catch(() => null);
        if (!fileStat) throw new BridgeError(404, 'UPLOAD_NOT_FOUND', `File not found on disk.`);

        const rangeHeader = request.headers.range;
        let start = 0;
        let end = fileStat.size - 1;
        let statusCode = 200;

        if (rangeHeader) {
          const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
          if (match) {
            start = parseInt(match[1] ?? '0', 10);
            end = match[2] ? parseInt(match[2], 10) : fileStat.size - 1;
            statusCode = 206;
          }
        }

        const corsHeaders = createCorsHeaders(originDecision.allowOrigin) as Record<string, string>;
        const headers: Record<string, string | number> = {
          'content-type': record.mimeType,
          'content-length': end - start + 1,
          'accept-ranges': 'bytes',
          'cache-control': 'private, max-age=3600',
          'content-disposition': `inline; filename="${encodeURIComponent(record.filename)}"`,
          ...corsHeaders
        };

        if (statusCode === 206) {
          headers['content-range'] = `bytes ${start}-${end}/${fileStat.size}`;
        }

        response.writeHead(statusCode, headers);
        const readStream = blobStore.createReadStream(storagePath, { start, end });
        readStream.pipe(response);
        return;
      }

      if (request.method === 'GET' && !pathname.startsWith('/api/') && options.staticDirectory) {
        serveStaticAsset(response, options.staticDirectory, pathname, database.getSettings().themeMode);
        return;
      }

      sendJson(
        response,
        404,
        {
          error: {
            code: 'NOT_FOUND',
            message: `No route matches ${pathname}.`
          }
        },
        originDecision.allowOrigin
      );
    } catch (error) {
      sendError(response, error, originDecision.allowOrigin, preferSseErrors);
    }
  });

  return {
    server,
    database,
    bridge
  };
}
