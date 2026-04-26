import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import process from 'node:process';
import type {
  BootstrapResponse,
  ChatStreamEvent,
  ExecuteRecipeActionRequest,
  Session,
  SessionMessagesResponse,
  Recipe,
  TelemetryResponse
} from '@hermes-recipes/protocol';
import { getRecipeContentTab, getRecipeContentViewData, RecipeTemplateFillSchema } from '@hermes-recipes/protocol';
import { createBridgeServer } from '../src/server';
import { validateRecipeTemplateSemanticCompleteness } from '../src/services/recipes/recipe-template-contract';

type ValidationStatus = 'passed' | 'failed' | 'skipped';

type ValidationResult = {
  id: string;
  status: ValidationStatus;
  detail: string;
  sessionId?: string;
  recipeId?: string;
  renderMode?: Recipe['renderMode'];
  failureCategory?: string | null;
};

type StartedServer = ReturnType<typeof createBridgeServer> & {
  baseUrl: string;
  close: () => Promise<void>;
  tempRoot: string;
};

type PromptRunResult = {
  session: Session;
  recipe: Recipe;
  events: ChatStreamEvent[];
  telemetry: TelemetryResponse;
  assistantMarkdown: string;
};

const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');
const enabled = process.env.HERMES_LIVE_WORKRECIPE_VALIDATION === '1';
const includeEmail = process.env.HERMES_LIVE_WORKRECIPE_INCLUDE_EMAIL === '1';
const includeTimeout = process.env.HERMES_LIVE_WORKRECIPE_INCLUDE_TIMEOUT === '1';
const perCaseTimeoutMs = Math.max(
  30_000,
  Number.parseInt(process.env.HERMES_LIVE_WORKRECIPE_CASE_TIMEOUT_MS ?? '240000', 10) || 240_000
);
const requestedCases = new Set(
  String(process.env.HERMES_LIVE_WORKRECIPE_CASES ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

function shouldRun(caseId: string) {
  return requestedCases.size === 0 || requestedCases.has(caseId);
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function collectStreamEvents(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    return [] as ChatStreamEvent[];
  }

  const decoder = new TextDecoder();
  let buffer = '';
  const events: ChatStreamEvent[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex >= 0) {
      const chunk = buffer.slice(0, separatorIndex).trim();
      buffer = buffer.slice(separatorIndex + 2);
      if (chunk.startsWith('data:')) {
        events.push(JSON.parse(chunk.slice(5).trim()) as ChatStreamEvent);
      }
      separatorIndex = buffer.indexOf('\n\n');
    }
  }

  return events;
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function parseBuildLogDetail(detail: string | null | undefined) {
  if (!detail) {
    return null;
  }

  try {
    const parsed = JSON.parse(detail) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function collectAppletTelemetryCodes(telemetry: TelemetryResponse) {
  return telemetry.items.filter((item) => item.code.startsWith('RECIPE_APPLET_')).map((item) => item.code);
}

function getBaselineMarkdown(recipe: Recipe) {
  return getRecipeContentViewData(getRecipeContentTab(recipe), 'markdown').markdown.trim();
}

function ensureBaselineVisible(recipe: Recipe) {
  assertCondition(recipe.metadata.homeRecipe === true, 'Expected a Home recipe to be attached.');
  assertCondition(recipe.title.trim().length > 0, 'Expected the attached Home recipe to have a title.');
  assertCondition(getBaselineMarkdown(recipe).length > 0, 'Expected the baseline Home recipe markdown to remain populated.');
}

function ensureNoAppletProductionArtifacts(recipe: Recipe, telemetry: TelemetryResponse) {
  const appletCodes = collectAppletTelemetryCodes(telemetry);
  assertCondition(appletCodes.length === 0, `Standard flow emitted retired applet telemetry: ${appletCodes.join(', ')}`);
  assertCondition(recipe.dynamic?.activeBuild?.buildKind !== 'applet', 'Standard flow promoted an applet build instead of DSL enrichment.');
  assertCondition(recipe.dynamic?.applet == null, 'Standard flow persisted retired applet artifacts on the active recipe.');
}

function ensureSemanticallyPopulatedTemplate(server: StartedServer, recipe: Recipe) {
  const buildId = recipe.dynamic?.activeBuild?.id ?? null;
  assertCondition(buildId, 'Expected an active template build id on the attached Home recipe.');
  const fillArtifact = server.database.getRecipeBuildArtifact(buildId, 'recipe_template_fill');
  assertCondition(fillArtifact?.payload, `Expected build ${buildId} to persist a recipe_template_fill artifact.`);
  const fill = RecipeTemplateFillSchema.parse(fillArtifact.payload);
  const semanticCompleteness = validateRecipeTemplateSemanticCompleteness(fill);
  assertCondition(
    semanticCompleteness.ok,
    `Expected build ${buildId} to be semantically populated. ${semanticCompleteness.issues.join(' ')}`
  );
}

function ensureGhostHydrationProgression(server: StartedServer, recipe: Recipe) {
  const buildId = recipe.dynamic?.activeBuild?.id ?? null;
  assertCondition(buildId, 'Expected an active template build id on the attached Home recipe.');

  const structuredLogs = server.database
    .listRecipeBuildLogs(buildId)
    .map((log) => parseBuildLogDetail(log.detail))
    .filter((detail): detail is Record<string, unknown> => Boolean(detail?.recordType));

  const sectionProgressLogs = structuredLogs.filter((detail) => detail.recordType === 'recipe_template_section_progress');
  assertCondition(sectionProgressLogs.length > 0, `Expected build ${buildId} to persist recipe_template_section_progress logs.`);

  const loggedPhases = new Set(
    sectionProgressLogs
      .map((detail) => (typeof detail.viewPhase === 'string' ? detail.viewPhase : null))
      .filter((phase): phase is string => Boolean(phase))
  );
  assertCondition(loggedPhases.has('selected'), `Expected build ${buildId} to persist a selected ghost-template phase.`);
  assertCondition(
    ['text', 'hydrating', 'actions', 'repairing', 'ready', 'failed'].some((phase) => loggedPhases.has(phase)),
    `Expected build ${buildId} to record later template hydration phases, found ${Array.from(loggedPhases).join(', ') || 'none'}.`
  );

  const latestSectionStates = sectionProgressLogs.at(-1);
  const sections = Array.isArray(latestSectionStates?.sections) ? latestSectionStates.sections : [];
  assertCondition(sections.length > 0, `Expected build ${buildId} to include flattened section progress state.`);
}

function ensureTemplateReady(server: StartedServer, recipe: Recipe, telemetry: TelemetryResponse, expectedTemplateId?: string) {
  ensureBaselineVisible(recipe);
  ensureNoAppletProductionArtifacts(recipe, telemetry);
  assertCondition(recipe.renderMode === 'dynamic_v1', `Expected dynamic_v1 render mode, received ${recipe.renderMode}.`);
  assertCondition(recipe.dynamic?.recipeTemplate?.kind === 'recipe_template_state', 'Expected the normalized recipe template state.');
  assertCondition(recipe.dynamic?.recipeTemplate?.status?.phase === 'ready', 'Expected the normalized recipe template state to reach the ready phase.');
  assertCondition(recipe.dynamic?.recipeDsl == null, 'Standard template flow should not persist a freeform recipe DSL artifact.');
  assertCondition(recipe.dynamic?.recipeModel == null, 'Standard template flow should not persist a freeform recipe model artifact.');
  assertCondition(recipe.dynamic?.activeBuild?.buildKind === 'template_enrichment', 'Expected the active build to be template enrichment.');
  ensureGhostHydrationProgression(server, recipe);
  ensureSemanticallyPopulatedTemplate(server, recipe);
  if (expectedTemplateId) {
    assertCondition(
      recipe.dynamic?.recipeTemplate?.templateId === expectedTemplateId,
      `Expected template ${expectedTemplateId}, received ${recipe.dynamic?.recipeTemplate?.templateId ?? 'none'}.`
    );
  }
}

function ensureBaselineOnlyOrTemplateReady(recipe: Recipe, telemetry: TelemetryResponse) {
  ensureBaselineVisible(recipe);
  ensureNoAppletProductionArtifacts(recipe, telemetry);

  if (recipe.renderMode === 'dynamic_v1') {
    assertCondition(recipe.dynamic?.recipeTemplate?.kind === 'recipe_template_state', 'Expected the normalized recipe template state.');
  }
}

function ensureTemplateReadyOneOf(server: StartedServer, recipe: Recipe, telemetry: TelemetryResponse, expectedTemplateIds: string[]) {
  ensureTemplateReady(server, recipe, telemetry);
  assertCondition(
    expectedTemplateIds.includes(recipe.dynamic?.recipeTemplate?.templateId ?? ''),
    `Expected one of templates ${expectedTemplateIds.join(', ')}, received ${recipe.dynamic?.recipeTemplate?.templateId ?? 'none'}.`
  );
}

function ensureTemplateGenerationFailed(recipe: Recipe, telemetry: TelemetryResponse, expectedFailureCategories: string[]) {
  ensureBaselineVisible(recipe);
  ensureNoAppletProductionArtifacts(recipe, telemetry);

  const failureCategory =
    recipe.dynamic?.activeBuild?.failureCategory ?? recipe.metadata.recipePipeline?.applet.failureCategory ?? null;
  assertCondition(
    failureCategory && expectedFailureCategories.includes(failureCategory),
    `Expected template generation failure category ${expectedFailureCategories.join(', ')}, received ${failureCategory ?? 'none'}.`
  );
  assertCondition(
    recipe.metadata.recipePipeline?.applet.status === 'failed',
    `Expected enrichment pipeline status failed, received ${recipe.metadata.recipePipeline?.applet.status ?? 'none'}.`
  );
  assertCondition(
    recipe.metadata.recipePipeline?.applet.stage === 'enrichment_failed',
    `Expected enrichment_failed pipeline stage, received ${recipe.metadata.recipePipeline?.applet.stage ?? 'none'}.`
  );
}

function findActionId(recipe: Recipe, actionId: string) {
  return recipe.dynamic?.actionSpec?.actions.some((action) => action.id === actionId) ? actionId : null;
}

function findFirstTemplateActionSelectionId(recipe: Recipe, actionId: string): string | null {
  const walk = (value: unknown): string | null => {
    if (!value) {
      return null;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        const result = walk(entry);
        if (result) {
          return result;
        }
      }
      return null;
    }

    if (typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    if (
      record.kind === 'existing_action' &&
      record.actionId === actionId &&
      Array.isArray(record.selectedItemIds) &&
      typeof record.selectedItemIds[0] === 'string'
    ) {
      return record.selectedItemIds[0] as string;
    }

    for (const nestedValue of Object.values(record)) {
      const result = walk(nestedValue);
      if (result) {
        return result;
      }
    }

    return null;
  };

  return walk(recipe.dynamic?.recipeTemplate?.sections ?? []);
}

function collectTemplateSlotIds(recipe: Recipe) {
  const sections = recipe.dynamic?.recipeTemplate?.sections ?? [];
  return sections.map((section) => section.slotId).sort();
}

function ensureNoDataDataWrapper(server: StartedServer, recipe: Recipe) {
  const buildId = recipe.dynamic?.activeBuild?.id ?? null;
  if (!buildId) {
    return;
  }

  for (const artifactKind of ['recipe_template_fill', 'recipe_template_text', 'recipe_template_hydration'] as const) {
    const artifact = server.database.getRecipeBuildArtifact(buildId, artifactKind);
    if (!artifact?.payload) {
      continue;
    }

    const payload = artifact.payload as Record<string, unknown>;
    const data = payload.data;
    if (data && typeof data === 'object' && !Array.isArray(data) && 'data' in (data as Record<string, unknown>)) {
      throw new Error(
        `Build ${buildId} artifact ${artifactKind} contains a nested data.data wrapper. ` +
        'This is a schema-shape failure that should have been caught by validation or normalization.'
      );
    }
  }
}

function collectSameSessionCorrectionStats(server: StartedServer, recipe: Recipe) {
  const buildId = recipe.dynamic?.activeBuild?.id ?? null;
  if (!buildId) {
    return { correctionAttempts: 0, correctionSuccesses: 0 };
  }

  const structuredLogs = server.database
    .listRecipeBuildLogs(buildId)
    .map((log) => parseBuildLogDetail(log.detail))
    .filter((detail): detail is Record<string, unknown> => Boolean(detail?.recordType));

  const correctionLogs = structuredLogs.filter(
    (detail) => detail.recordType === 'recipe_same_session_correction' || detail.recordType === 'recipe_same_session_correction_result'
  );
  const correctionSuccesses = structuredLogs.filter(
    (detail) => detail.recordType === 'recipe_same_session_correction_result' && detail.correctionFixed === true
  );
  return {
    correctionAttempts: correctionLogs.length,
    correctionSuccesses: correctionSuccesses.length
  };
}

function ensureTemplateReadyWithSchemaIntegrity(
  server: StartedServer,
  recipe: Recipe,
  telemetry: TelemetryResponse,
  expectedTemplateId?: string
) {
  ensureTemplateReady(server, recipe, telemetry, expectedTemplateId);
  ensureNoDataDataWrapper(server, recipe);
}

function ensureAssistantMarkdown(markdown: string) {
  const normalizedMarkdown = markdown.trim();
  assertCondition(normalizedMarkdown.length > 0, 'Expected the assistant transcript reply to contain markdown content.');
  assertCondition(
    /(^|\n)(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```)/m.test(normalizedMarkdown),
    'Expected the assistant transcript reply to preserve visible Markdown structure such as headings, lists, blockquotes, or fenced code.'
  );
}

async function startServer(timeoutMs?: number): Promise<StartedServer> {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-live-home-'));
  const instance = createBridgeServer({
    databasePath: path.join(tempRoot, 'bridge.sqlite'),
    cliPath: process.env.HERMES_CLI_PATH,
    recipeRoot: repoRoot,
    legacySnapshotPaths: [],
    asyncRecipeEnrichmentTimeoutMs: timeoutMs
  });

  await new Promise<void>((resolve) => {
    instance.server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = instance.server.address() as AddressInfo;

  return {
    ...instance,
    tempRoot,
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      await Promise.race([
        new Promise<void>((resolve) => {
          instance.server.close(() => resolve());
        }),
        sleep(5_000).then(() => {
          instance.server.closeAllConnections?.();
        })
      ]);
      await sleep(250);
    }
  };
}

async function getBootstrap(server: StartedServer) {
  return fetch(`${server.baseUrl}/api/bootstrap`).then((response) => readJson<BootstrapResponse>(response));
}

async function createSession(server: StartedServer, profileId: string) {
  return fetch(`${server.baseUrl}/api/sessions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ profileId })
  }).then((response) => readJson<Session>(response));
}

async function fetchSessionMessages(server: StartedServer, profileId: string, sessionId: string) {
  return fetch(`${server.baseUrl}/api/sessions/${encodeURIComponent(sessionId)}/messages?profileId=${encodeURIComponent(profileId)}`).then((response) =>
    readJson<SessionMessagesResponse>(response)
  );
}

async function fetchTelemetry(server: StartedServer, profileId: string, sessionId: string) {
  return fetch(`${server.baseUrl}/api/telemetry?profileId=${encodeURIComponent(profileId)}&sessionId=${encodeURIComponent(sessionId)}&limit=200`).then(
    (response) => readJson<TelemetryResponse>(response)
  );
}

async function waitForTerminalRecipeState(server: StartedServer, profileId: string, sessionId: string, timeoutMs: number) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const sessionMessages = await fetchSessionMessages(server, profileId, sessionId);
    const recipe = sessionMessages.attachedRecipe;
    const appletStatus = recipe?.metadata.recipePipeline?.applet.status;
    const buildPhase = recipe?.dynamic?.activeBuild?.phase;

    if (recipe && ((appletStatus && appletStatus !== 'running') || buildPhase === 'ready' || buildPhase === 'failed')) {
      return {
        sessionMessages,
        telemetry: await fetchTelemetry(server, profileId, sessionId)
      };
    }

    await sleep(1_000);
  }

  const finalSessionMessages = await fetchSessionMessages(server, profileId, sessionId);
  const finalRecipe = finalSessionMessages.attachedRecipe;
  const finalAppletStatus = finalRecipe?.metadata.recipePipeline?.applet.status;
  const finalBuildPhase = finalRecipe?.dynamic?.activeBuild?.phase;

  if (finalRecipe && ((finalAppletStatus && finalAppletStatus !== 'running') || finalBuildPhase === 'ready' || finalBuildPhase === 'failed')) {
    return {
      sessionMessages: finalSessionMessages,
      telemetry: await fetchTelemetry(server, profileId, sessionId)
    };
  }

  throw new Error(`Timed out after ${timeoutMs}ms while waiting for Home recipe enrichment to reach a terminal state.`);
}

async function runPrompt(server: StartedServer, profileId: string, prompt: string): Promise<PromptRunResult> {
  const session = await createSession(server, profileId);
  const controller = new AbortController();
  const abortTimeout = setTimeout(() => controller.abort(), perCaseTimeoutMs);
  const events = await fetch(`${server.baseUrl}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    signal: controller.signal,
    body: JSON.stringify({
      profileId,
      sessionId: session.id,
      content: prompt
    })
  })
    .then(collectStreamEvents)
    .catch((error: unknown) => {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timed out after ${perCaseTimeoutMs}ms while waiting for the live Hermes chat stream to complete.`);
      }
      throw error;
    })
    .finally(() => clearTimeout(abortTimeout));

  const { sessionMessages, telemetry } = await waitForTerminalRecipeState(server, profileId, session.id, perCaseTimeoutMs);
  const recipe = sessionMessages.attachedRecipe;
  const completeEvent = events.find((event): event is Extract<ChatStreamEvent, { type: 'complete' }> => event.type === 'complete');

  assertCondition(recipe, `Expected prompt "${prompt}" to produce an attached Home recipe.`);
  assertCondition(completeEvent, `Expected prompt "${prompt}" to produce a complete chat event.`);

  return {
    session,
    recipe,
    events,
    telemetry,
    assistantMarkdown: completeEvent.assistantMessage.content
  };
}

async function runAction(
  server: StartedServer,
  profileId: string,
  sessionId: string,
  recipeId: string,
  payload: ExecuteRecipeActionRequest
) {
  const controller = new AbortController();
  const abortTimeout = setTimeout(() => controller.abort(), perCaseTimeoutMs);
  const events = await fetch(`${server.baseUrl}/api/spaces/${encodeURIComponent(recipeId)}/actions/stream`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    signal: controller.signal,
    body: JSON.stringify(payload)
  })
    .then(collectStreamEvents)
    .catch((error: unknown) => {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timed out after ${perCaseTimeoutMs}ms while waiting for the live Hermes recipe action stream to complete.`);
      }
      throw error;
    })
    .finally(() => clearTimeout(abortTimeout));

  const { sessionMessages, telemetry } = await waitForTerminalRecipeState(server, profileId, sessionId, perCaseTimeoutMs);
  const recipe = sessionMessages.attachedRecipe;

  assertCondition(recipe, `Expected action ${payload.actionId} to preserve the attached Home recipe.`);

  return {
    events,
    recipe,
    telemetry
  };
}

function logResult(result: ValidationResult) {
  const detail = [
    `[${result.status.toUpperCase()}]`,
    result.id,
    result.detail,
    result.sessionId ? `session=${result.sessionId}` : null,
    result.recipeId ? `recipe=${result.recipeId}` : null,
    result.renderMode ? `renderMode=${result.renderMode}` : null,
    result.failureCategory ? `failureCategory=${result.failureCategory}` : null
  ]
    .filter(Boolean)
    .join(' | ');

  process.stdout.write(`${detail}\n`);
}

function logCaseStart(caseId: string, detail: string) {
  process.stdout.write(`[RUNNING] ${caseId} | ${detail}\n`);
}

async function main() {
  if (!enabled) {
    process.stderr.write('Set HERMES_LIVE_WORKRECIPE_VALIDATION=1 to run the live Hermes Home recipe validation suite.\n');
    process.exitCode = 1;
    return;
  }

  const results: ValidationResult[] = [];
  let standardServer: StartedServer | null = null;
  let timeoutServer: StartedServer | null = null;

  try {
    standardServer = await startServer();
    const bootstrap = await getBootstrap(standardServer);
    const profileId = process.env.HERMES_LIVE_WORKRECIPE_PROFILE_ID ?? bootstrap.activeProfileId ?? 'default';

    let planningRun: PromptRunResult | null = null;
    let actionRunSeed: PromptRunResult | null = null;
    let switchRunSeed: PromptRunResult | null = null;

    if (shouldRun('prose')) {
      try {
        logCaseStart('prose', 'simple prose-only Home recipe');
        const proseRun = await runPrompt(
          standardServer,
          profileId,
          'Summarize a practical release-readiness checklist in Markdown with a heading and bullet points, and organize it in a compact Home recipe.'
        );
        ensureBaselineOnlyOrTemplateReady(proseRun.recipe, proseRun.telemetry);
        ensureAssistantMarkdown(proseRun.assistantMarkdown);
        results.push({
          id: 'prose',
          status: 'passed',
          detail:
            proseRun.recipe.renderMode === 'dynamic_v1'
              ? 'Simple prose-only Home recipe completed through the template-ready path with Markdown preserved in chat.'
              : 'Simple prose-only Home recipe stayed on the baseline path with Markdown preserved in chat and no applet generation.',
          sessionId: proseRun.session.id,
          recipeId: proseRun.recipe.id,
          renderMode: proseRun.recipe.renderMode
        });
      } catch (error) {
        results.push({
          id: 'prose',
          status: 'failed',
          detail: error instanceof Error ? error.message : 'Unknown prose validation failure.'
        });
      }
    }

    if (shouldRun('travel')) {
      try {
        logCaseStart('travel', 'nearby or hotel comparison Home recipe');
        const travelRun = await runPrompt(
          standardServer,
          profileId,
          `Use only the hotel options in this request and do not browse or research externally.
Organize them in a compact Home recipe for a three-night product launch trip to Chicago.

Hotel options:
- Loop Loft Hotel: $289/night, 4.6 rating, 8-minute walk to venue, rooftop recipe, breakfast included, booking link https://example.com/loop-loft
- Lakeview Suites: $249/night, 4.4 rating, 18-minute rideshare to venue, larger rooms, free parking, booking link https://example.com/lakeview-suites
- Fulton Hub Stay: $319/night, 4.8 rating, 5-minute walk to venue, strong Wi-Fi, meeting room access, booking link https://example.com/fulton-hub

Include price, location fit, rating, standout amenities, and booking links in the recipe.`
        );
        ensureNoDataDataWrapper(standardServer, travelRun.recipe);
        ensureTemplateReadyOneOf(standardServer, travelRun.recipe, travelRun.telemetry, [
          'hotel-shortlist',
          'travel-itinerary-planner',
          'local-discovery-comparison'
        ]);
        results.push({
          id: 'travel',
          status: 'passed',
          detail: `Nearby or hotel comparison path completed through template selection and fill using ${travelRun.recipe.dynamic?.recipeTemplate?.templateId ?? 'an approved template'}.`,
          sessionId: travelRun.session.id,
          recipeId: travelRun.recipe.id,
          renderMode: travelRun.recipe.renderMode
        });
      } catch (error) {
        results.push({
          id: 'travel',
          status: 'failed',
          detail: error instanceof Error ? error.message : 'Unknown travel validation failure.'
        });
      }
    }

    if (shouldRun('comparison')) {
      try {
        logCaseStart('comparison', 'product or vendor comparison Home recipe');
        const comparisonRun = await runPrompt(
          standardServer,
          profileId,
          `Use only the vendor notes in this request and do not browse or research externally.
Build a compact vendor evaluation matrix Home recipe for a 10-person SaaS sales team.

Vendor notes:
- HubSpot: price $90/user/month, strong automation, easy onboarding, good SMB fit, implementation effort medium, link https://example.com/hubspot
- Pipedrive: price $64/user/month, fast pipeline UX, lighter automation, strongest fit for simple process, implementation effort low, link https://example.com/pipedrive
- Salesforce: price $165/user/month, deepest customization, heaviest setup, strongest enterprise ecosystem, implementation effort high, link https://example.com/salesforce

Compare pricing, automation, fit, implementation effort, and links.`
        );
        ensureNoDataDataWrapper(standardServer, comparisonRun.recipe);
        ensureTemplateReadyOneOf(standardServer, comparisonRun.recipe, comparisonRun.telemetry, ['vendor-evaluation-matrix']);
        const correctionStats = collectSameSessionCorrectionStats(standardServer, comparisonRun.recipe);
        results.push({
          id: 'comparison',
          status: 'passed',
          detail: `Comparison workflow completed through template generation using ${comparisonRun.recipe.dynamic?.recipeTemplate?.templateId ?? 'an approved template'}. Same-session corrections: ${correctionStats.correctionAttempts} attempted, ${correctionStats.correctionSuccesses} succeeded.`,
          sessionId: comparisonRun.session.id,
          recipeId: comparisonRun.recipe.id,
          renderMode: comparisonRun.recipe.renderMode
        });
      } catch (error) {
        results.push({
          id: 'comparison',
          status: 'failed',
          detail: error instanceof Error ? error.message : 'Unknown comparison validation failure.'
        });
      }
    }

    if (shouldRun('planning') || shouldRun('retry')) {
      try {
        logCaseStart('planning', 'coding workbench Home recipe');
        planningRun = await runPrompt(
          standardServer,
          profileId,
          `Review this engineering objective and use only the details in this request.
Build a compact coding workbench Home recipe with findings, plan, tasks, and risks.

Objective:
- Replace brittle one-shot recipe fill with staged template selection, text generation, hydration, and actions
- Add deterministic normalization for near-miss JSON
- Keep failures loud and observable
- Preserve rebuild and retry flows

Constraints:
- reliability over compatibility
- no freeform layout generation
- no silent fallback to markdown-as-recipe`
        );
        ensureTemplateReadyWithSchemaIntegrity(standardServer, planningRun.recipe, planningRun.telemetry, 'research-notebook');
        if (shouldRun('planning')) {
          results.push({
            id: 'planning',
            status: 'passed',
            detail: 'Coding workbench workflow completed through template selection and template-specific fill.',
            sessionId: planningRun.session.id,
            recipeId: planningRun.recipe.id,
            renderMode: planningRun.recipe.renderMode
          });
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'Unknown planning validation failure.';
        if (shouldRun('planning')) {
          results.push({
            id: 'planning',
            status: 'failed',
            detail
          });
        }
        if (shouldRun('retry')) {
          results.push({
            id: 'retry',
            status: 'failed',
              detail: `Planning seed workflow failed before the retry action could run. ${detail}`
          });
        }
      }
    }

    if (shouldRun('email')) {
      if (!includeEmail) {
        results.push({
          id: 'email',
          status: 'skipped',
          detail: 'Set HERMES_LIVE_WORKRECIPE_INCLUDE_EMAIL=1 and ensure the selected Hermes profile has email auth to run this case.'
        });
      } else {
        try {
          logCaseStart('email', 'unread email triage Home recipe');
          const emailRun = await runPrompt(
            standardServer,
            profileId,
            'Check my unread email and organize the inbox triage in a compact Home recipe with recommended actions.'
          );
          ensureTemplateReady(standardServer, emailRun.recipe, emailRun.telemetry, 'inbox-triage-board');
          results.push({
            id: 'email',
            status: 'passed',
            detail: 'Unread email triage completed through template selection and fill.',
            sessionId: emailRun.session.id,
            recipeId: emailRun.recipe.id,
            renderMode: emailRun.recipe.renderMode
          });
        } catch (error) {
          results.push({
            id: 'email',
            status: 'failed',
            detail: error instanceof Error ? error.message : 'Unknown email validation failure.'
          });
        }
      }
    }

    if (shouldRun('action')) {
      try {
        logCaseStart('action', 'prompt-bound research follow-up update');
        actionRunSeed = await runPrompt(
          standardServer,
          profileId,
          'Create a research notebook about improving Hermes Home recipe generation reliability. Use the details in this request as the source material, include extracted points, and add follow-up prompts about staged generation, semantic completeness, retries, and hydration.'
        );
        ensureTemplateReadyWithSchemaIntegrity(standardServer, actionRunSeed.recipe, actionRunSeed.telemetry, 'research-notebook');
        const actionId = findActionId(actionRunSeed.recipe, 'run-followup');
        const selectedItemId = findFirstTemplateActionSelectionId(actionRunSeed.recipe, 'run-followup');
        const beforeSlotIds = collectTemplateSlotIds(actionRunSeed.recipe);
        assertCondition(actionId, 'The research notebook did not expose the prompt-bound run-followup action.');
        assertCondition(selectedItemId, 'The research notebook did not expose a follow-up selection for run-followup.');

        const actionRun = await runAction(standardServer, profileId, actionRunSeed.session.id, actionRunSeed.recipe.id, {
          profileId,
          sessionId: actionRunSeed.session.id,
          actionId,
          selectedItemIds: [selectedItemId],
          formValues: {},
          pageState: {},
          filterState: {}
        });
        ensureTemplateReady(standardServer, actionRun.recipe, actionRun.telemetry, 'research-notebook');
        assertCondition(
          collectTemplateSlotIds(actionRun.recipe).join(',') === beforeSlotIds.join(','),
          'The research notebook update should preserve the existing template slot structure.'
        );
        results.push({
          id: 'action',
          status: 'passed',
          detail: 'Prompt-bound follow-up updated the research notebook through template update semantics while preserving the template structure.',
          sessionId: actionRunSeed.session.id,
          recipeId: actionRun.recipe.id,
          renderMode: actionRun.recipe.renderMode
        });
      } catch (error) {
        results.push({
          id: 'action',
          status: 'failed',
          detail: error instanceof Error ? error.message : 'Unknown action validation failure.'
        });
      }
    }

    if (shouldRun('retry')) {
      if (results.some((result) => result.id === 'retry' && result.status === 'failed')) {
        // The planning seed path already recorded the blocking failure.
      } else {
      try {
        logCaseStart('retry', 'retry-build from persisted Home artifacts');
        assertCondition(planningRun, 'The retry case requires a dynamic recipe seed first.');
        const retryActionId = findActionId(planningRun.recipe, 'retry-build');
        assertCondition(retryActionId, 'The seeded dynamic recipe did not expose the retry-build action.');
        const retryRun = await runAction(standardServer, profileId, planningRun.session.id, planningRun.recipe.id, {
          profileId,
          sessionId: planningRun.session.id,
          actionId: retryActionId,
          selectedItemIds: [],
          formValues: {},
          pageState: {},
          filterState: {}
        });
        ensureTemplateReady(standardServer, retryRun.recipe, retryRun.telemetry, 'research-notebook');
        results.push({
          id: 'retry',
          status: 'passed',
          detail: 'Retry rebuilt the coding workbench from persisted artifacts without reintroducing freeform generation or applet paths.',
          sessionId: planningRun.session.id,
          recipeId: retryRun.recipe.id,
          renderMode: retryRun.recipe.renderMode
        });
      } catch (error) {
        results.push({
          id: 'retry',
          status: 'failed',
          detail: error instanceof Error ? error.message : 'Unknown retry validation failure.'
        });
      }
      }
    }

    if (shouldRun('switch')) {
      try {
        logCaseStart('switch', 'template switch from local discovery to event planner');
        switchRunSeed = await runPrompt(
          standardServer,
          profileId,
          'Compare these Dayton launch-event venue options and organize them in a compact local discovery comparison recipe: Dana Hall (historic, central, good for 40 guests), Arcade Loft (modern, more expensive, strong AV), and River Room (waterfront, limited parking, flexible seating).'
        );
        ensureTemplateReadyWithSchemaIntegrity(standardServer, switchRunSeed.recipe, switchRunSeed.telemetry, 'local-discovery-comparison');
        const actionId = findActionId(switchRunSeed.recipe, 'switch-to-event-planner');
        const selectedItemId = findFirstTemplateActionSelectionId(switchRunSeed.recipe, 'switch-to-event-planner');
        assertCondition(actionId, 'The local discovery recipe did not expose the switch-to-event-planner action.');
        assertCondition(selectedItemId, 'The local discovery recipe did not expose a selected place for the template switch.');

        const switchedRun = await runAction(standardServer, profileId, switchRunSeed.session.id, switchRunSeed.recipe.id, {
          profileId,
          sessionId: switchRunSeed.session.id,
          actionId,
          selectedItemIds: [selectedItemId],
          formValues: {},
          pageState: {},
          filterState: {}
        });
        ensureTemplateReady(standardServer, switchedRun.recipe, switchedRun.telemetry, 'event-planner');
        assertCondition(
          (switchedRun.recipe.dynamic?.recipeTemplate?.transitionHistory?.[0]?.fromTemplateId ?? null) === 'local-discovery-comparison',
          'Expected the switched recipe to record the source template transition.'
        );
        assertCondition(
          (switchedRun.recipe.dynamic?.recipeTemplate?.transitionHistory?.[0]?.toTemplateId ?? null) === 'event-planner',
          'Expected the switched recipe to record the target template transition.'
        );
        results.push({
          id: 'switch',
          status: 'passed',
          detail: 'Local discovery carried the selected place forward into the event planner through the supported template transition.',
          sessionId: switchRunSeed.session.id,
          recipeId: switchedRun.recipe.id,
          renderMode: switchedRun.recipe.renderMode
        });
      } catch (error) {
        results.push({
          id: 'switch',
          status: 'failed',
          detail: error instanceof Error ? error.message : 'Unknown template switch validation failure.'
        });
      }
    }

    if (shouldRun('price')) {
      try {
        logCaseStart('price', 'price comparison grid Home recipe');
        const priceRun = await runPrompt(
          standardServer,
          profileId,
          `Use only the product data in this request and do not browse externally.
Build a compact price comparison grid Home recipe for the Samsung Galaxy S24 Ultra.

Merchant data:
- Amazon: $1,149, free 2-day shipping, 4-star reviews
- Best Buy: $1,199, same-day pickup available, 3-year warranty option
- Samsung.com: $1,119 with trade-in credit, free Galaxy Buds bundle

Compare price, shipping, and standout benefits.`
        );
        ensureTemplateReadyWithSchemaIntegrity(standardServer, priceRun.recipe, priceRun.telemetry, 'price-comparison-grid');
        results.push({
          id: 'price',
          status: 'passed',
          detail: `Price comparison grid completed with schema integrity verified.`,
          sessionId: priceRun.session.id,
          recipeId: priceRun.recipe.id,
          renderMode: priceRun.recipe.renderMode
        });
      } catch (error) {
        results.push({
          id: 'price',
          status: 'failed',
          detail: error instanceof Error ? error.message : 'Unknown price comparison validation failure.'
        });
      }
    }

    if (shouldRun('shopping')) {
      try {
        logCaseStart('shopping', 'shopping shortlist Home recipe');
        const shoppingRun = await runPrompt(
          standardServer,
          profileId,
          `Use only the product data in this request and do not browse externally.
Build a compact shopping shortlist Home recipe for ergonomic office chairs.

Shortlist:
- Steelcase Leap V2: $1,399, lumbar support excellent, 12-year warranty, link https://example.com/steelcase
- Herman Miller Aeron: $1,595, mesh breathability, PostureFit SL, 12-year warranty, link https://example.com/aeron
- Autonomous ErgoChair Pro: $499, adjustable headrest, good budget pick, 5-year warranty, link https://example.com/autonomous`
        );
        ensureTemplateReadyWithSchemaIntegrity(standardServer, shoppingRun.recipe, shoppingRun.telemetry, 'shopping-shortlist');
        results.push({
          id: 'shopping',
          status: 'passed',
          detail: `Shopping shortlist completed with schema integrity verified.`,
          sessionId: shoppingRun.session.id,
          recipeId: shoppingRun.recipe.id,
          renderMode: shoppingRun.recipe.renderMode
        });
      } catch (error) {
        results.push({
          id: 'shopping',
          status: 'failed',
          detail: error instanceof Error ? error.message : 'Unknown shopping shortlist validation failure.'
        });
      }
    }

    if (shouldRun('flight')) {
      try {
        logCaseStart('flight', 'flight comparison Home recipe');
        const flightRun = await runPrompt(
          standardServer,
          profileId,
          `Use only the flight data in this request and do not browse externally.
Build a compact flight comparison Home recipe for a round-trip from Dayton to San Francisco.

Outbound flights (May 15):
- United UA 1234: depart 6:00 AM, arrive 8:30 AM, 1 stop DEN, $289 economy
- Delta DL 5678: depart 9:15 AM, arrive 12:45 PM, nonstop, $345 economy
- American AA 9012: depart 11:30 AM, arrive 3:00 PM, 1 stop DFW, $312 economy

Return flights (May 18):
- United UA 4321: depart 4:00 PM, arrive 11:30 PM, 1 stop ORD, $275 economy
- Delta DL 8765: depart 6:30 PM, arrive 2:00 AM+1, nonstop, $329 economy`
        );
        ensureTemplateReadyWithSchemaIntegrity(standardServer, flightRun.recipe, flightRun.telemetry, 'flight-comparison');
        results.push({
          id: 'flight',
          status: 'passed',
          detail: `Flight comparison completed with schema integrity verified.`,
          sessionId: flightRun.session.id,
          recipeId: flightRun.recipe.id,
          renderMode: flightRun.recipe.renderMode
        });
      } catch (error) {
        results.push({
          id: 'flight',
          status: 'failed',
          detail: error instanceof Error ? error.message : 'Unknown flight comparison validation failure.'
        });
      }
    }

    if (shouldRun('security')) {
      try {
        logCaseStart('security', 'security review board Home recipe');
        const securityRun = await runPrompt(
          standardServer,
          profileId,
          `Use only the findings in this request and do not browse externally.
Build a compact security review board Home recipe for these audit findings:

Critical:
- SQL injection in /api/users endpoint — user input not parameterized
- Hardcoded AWS credentials in config.prod.js

High:
- CORS allows all origins in production
- Session tokens stored in localStorage without HttpOnly flag

Medium:
- Missing rate limiting on authentication endpoints
- Outdated TLS 1.1 still accepted`
        );
        ensureTemplateReadyWithSchemaIntegrity(standardServer, securityRun.recipe, securityRun.telemetry, 'security-review-board');
        results.push({
          id: 'security',
          status: 'passed',
          detail: `Security review board completed with schema integrity verified.`,
          sessionId: securityRun.session.id,
          recipeId: securityRun.recipe.id,
          renderMode: securityRun.recipe.renderMode
        });
      } catch (error) {
        results.push({
          id: 'security',
          status: 'failed',
          detail: error instanceof Error ? error.message : 'Unknown security review validation failure.'
        });
      }
    }


    if (shouldRun('jobsearch')) {
      try {
        logCaseStart('jobsearch', 'job search pipeline Home recipe');
        const jobRun = await runPrompt(
          standardServer,
          profileId,
          `Use only the job data in this request and do not browse externally.
Build a compact job search pipeline Home recipe for a backend engineering job search.

Applied:
- Platform Engineer at Stripe — applied April 1, awaiting recruiter screen
- Senior Backend at Vercel — applied March 28, phone screen scheduled April 16

Interviewing:
- Staff Engineer at Datadog — onsite scheduled April 18, focus on system design

Offer stage:
- Backend Lead at Linear — verbal offer $220k base, considering`
        );
        ensureTemplateReadyWithSchemaIntegrity(standardServer, jobRun.recipe, jobRun.telemetry, 'job-search-pipeline');
        results.push({
          id: 'jobsearch',
          status: 'passed',
          detail: `Job search pipeline completed with schema integrity verified.`,
          sessionId: jobRun.session.id,
          recipeId: jobRun.recipe.id,
          renderMode: jobRun.recipe.renderMode
        });
      } catch (error) {
        results.push({
          id: 'jobsearch',
          status: 'failed',
          detail: error instanceof Error ? error.message : 'Unknown job search pipeline validation failure.'
        });
      }
    }

    if (shouldRun('timeout')) {
      if (!includeTimeout && !requestedCases.has('timeout')) {
        results.push({
          id: 'timeout',
          status: 'skipped',
          detail: 'Set HERMES_LIVE_WORKRECIPE_INCLUDE_TIMEOUT=1 or request the timeout case explicitly to run the slower failure-preservation stress check.'
        });
      } else {
        try {
          logCaseStart('timeout', 'slow enrichment timeout preservation check');
          timeoutServer = await startServer(20_000);
          const timeoutBootstrap = await getBootstrap(timeoutServer);
          const timeoutProfileId = process.env.HERMES_LIVE_WORKRECIPE_PROFILE_ID ?? timeoutBootstrap.activeProfileId ?? profileId;
          const timeoutRun = await runPrompt(
            timeoutServer,
            timeoutProfileId,
            'Find good hotels, restaurants, and neighborhood tradeoffs in Dayton, OH, and organize the shortlist in a compact Home recipe.'
          );
          ensureTemplateGenerationFailed(timeoutRun.recipe, timeoutRun.telemetry, ['timeout_user_config', 'timeout_runtime']);
          results.push({
            id: 'timeout',
            status: 'passed',
            detail: 'Recipe generation timed out while the baseline Home recipe remained visible and the failure stayed explicit.',
            sessionId: timeoutRun.session.id,
            recipeId: timeoutRun.recipe.id,
            renderMode: timeoutRun.recipe.renderMode,
            failureCategory:
              timeoutRun.recipe.dynamic?.activeBuild?.failureCategory ?? timeoutRun.recipe.metadata.recipePipeline?.applet.failureCategory ?? null
          });
        } catch (error) {
          results.push({
            id: 'timeout',
            status: 'failed',
            detail:
              error instanceof Error
                ? `${error.message} Use HERMES_LIVE_WORKRECIPE_CASES=timeout to rerun just the timeout stress case if you want a focused pass.`
                : 'Unknown timeout validation failure.'
          });
        }
      }
    }
  } finally {
    if (timeoutServer) {
      await timeoutServer.close();
    }
    if (standardServer) {
      await standardServer.close();
    }
  }

  process.stdout.write('\nLive Hermes Home recipe validation summary\n');
  process.stdout.write('=============================================\n');
  for (const result of results) {
    logResult(result);
  }

  const failed = results.filter((result) => result.status === 'failed');
  const passed = results.filter((result) => result.status === 'passed');
  const skipped = results.filter((result) => result.status === 'skipped');
  process.stdout.write(`\nPassed: ${passed.length}  Failed: ${failed.length}  Skipped: ${skipped.length}\n`);
  process.exit(failed.length > 0 ? 1 : 0);
}

void main();
