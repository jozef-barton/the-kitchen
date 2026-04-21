import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type {
  AuditEventsResponse,
  BootstrapResponse,
  ChatActivity,
  ChatMessage,
  ChatStreamEvent,
  ChatStreamRequest,
  ConnectProviderRequest,
  CreateRecipeRequest,
  CreateSessionRequest,
  ApplyRecipeEntryActionRequest,
  DeleteRecipeRequest,
  DeleteSessionRequest,
  DeleteSkillRequest,
  ExecuteRecipeActionRequest,
  JobsFreshness,
  JobsResponse,
  ModelProviderResponse,
  OpenRecipeChatRequest,
  OpenRecipeChatResponse,
  Profile,
  RenameSessionRequest,
  RuntimeRequest,
  SelectProfileRequest,
  SelectSessionRequest,
  Session,
  RecipeActionDefinition,
  RecipeActionSpec,
  RecipeAnalysis,
  RecipeArtifactPayload,
  RecipeAppletManifest,
  RecipeAppletPlan,
  RecipeAppletSourceArtifact,
  RecipeAppletTestSourceArtifact,
  RecipeAppletVerification,
  RecipeAssistantContext,
  RecipeBuild,
  RecipeBuildTriggerKind,
  Recipe,
  RecipeContentFormat,
  RecipeEvent,
  RecipeEntryActionResponse,
  RecipeIntent,
  RecipeDeletionResponse,
  RecipeFallbackState,
  RecipeRawData,
  RecipeTemplateId,
  RecipeNormalizedData,
  RecipeNormalizedItem,
  RecipeResponse,
  RecipeSummary,
  RecipesResponse,
  SessionDeletionResponse,
  SessionMessagesResponse,
  SessionsResponse,
  SettingsResponse,
  SkillDeletionResponse,
  SkillsResponse,
  TelemetryEvent,
  TelemetryResponse,
  ToolExecutionPrepareRequest,
  ToolExecutionResolveRequest,
  ToolHistoryResponse,
  ToolsResponse,
  UiState,
  UpdateRecipeRequest,
  UpdateRuntimeModelConfigRequest,
  UpdateSettingsRequest,
  UpdateUiStateRequest,
  RecipeTemplateActions,
  RecipeTemplateFill,
  RecipeTemplateHydration,
  RecipeTemplateSection,
  RecipeTemplateSelection,
  RecipeTemplateState,
  RecipeTemplateText,
  RecipeModel,
  RecipePatch,
  RecipeFailureCategory,
  RecipePipelineSegment,
  RecipePipelineStage,
  RecipePipelineState
} from '@hermes-recipes/protocol';
import {
  AuditEventsResponseSchema,
  ApiErrorSchema,
  ApplyRecipeEntryActionRequestSchema,
  ChatMessageSchema,
  ExecuteRecipeActionRequestSchema,
  RECIPE_REFRESH_USER_MESSAGE,
  ConnectProviderRequestSchema,
  CreateRecipeRequestSchema,
  DeleteSessionRequestSchema,
  DeleteRecipeRequestSchema,
  DeleteSkillRequestSchema,
  JobsFreshnessSchema,
  JobsResponseSchema,
  ModelProviderResponseSchema,
  OpenRecipeChatResponseSchema,
  RenameSessionRequestSchema,
  SessionDeletionResponseSchema,
  SessionMessagesResponseSchema,
  SessionsResponseSchema,
  RecipeDeletionResponseSchema,
  RecipeActionSpecSchema,
  RecipeAnalysisSchema,
  RecipeAssistantContextSchema,
  RecipeIntentSchema,
  RecipeMetadataSchema,
  RecipeEntryActionResponseSchema,
  RecipeFallbackStateSchema,
  RecipeNormalizedDataSchema,
  RecipeRawDataSchema,
  RecipeResponseSchema,
  RecipeSummarySchema,
  RecipesResponseSchema,
  RecipeStatusSchema,
  RecipeContentFormatSchema,
  RecipeTabSchema,
  RecipeUiStateSchema,
  RecipeUserPromptArtifactSchema,
  RecipeTemplateFillSchema,
  RecipeTemplateStateSchema,
  RecipeModelSchema,
  RecipePatchSchema,
  SettingsResponseSchema,
  SkillDeletionResponseSchema,
  SkillsResponseSchema,
  TelemetryResponseSchema,
  ToolExecutionPrepareRequestSchema,
  ToolHistoryResponseSchema,
  ToolsResponseSchema,
  UpdateRecipeRequestSchema,
  UpdateRuntimeModelConfigRequestSchema,
  UpdateSettingsRequestSchema,
  UpdateUiStateRequestSchema
} from '@hermes-recipes/protocol';
import {
  getRecipeContentFormat,
  getRecipeContentEntries,
  getRecipeContentTab,
  normalizeRecipeTabs,
  replaceRecipeContentEntries,
  removeRecipeContentEntries,
  normalizeRecipeUiState
} from '@hermes-recipes/protocol';
import type { BridgeDatabase } from '../data/bridge-database';
import {
  HERMES_EXPECTED_VERSION,
  HermesCliStructuredActionError,
  classifyStructuredRecipeIntent,
  classifyRecipeMutationIntent,
  resolveHermesChatTimeoutMs,
  type HermesCli,
  type RecipeMutationIntent,
  type RuntimeProviderDiscoveryResult,
  type StructuredRecipeIntent
} from '../hermes-cli/client';
import { bridgeReviewedShellToolId, runReviewedToolExecution } from '../reviewed-tools';
import { buildRuntimeActivityFromMessage, normalizePersistedSessionMessages } from '../transcript-runtime';
import { buildRecipeAppletBaseArtifacts } from './recipes/home-recipe-compiler';
import {
  extractHermesRecipeDataEnvelope,
  type HermesRecipeDataEnvelope,
  type HermesRecipeDataExtractionFailureKind,
  type HermesRecipeDataExtractionResult
} from './recipes/dynamic-recipe-contract';
import {
  createRecipeDslContractPacket,
  createRecipeDslRepairExcerpt,
  extractRecipeDslArtifact
} from './recipes/recipe-dsl-contract';
import { normalizeRecipeDsl } from './recipes/recipe-dsl-normalizer';
import {
  assembleRecipeTemplateFill,
  compileRecipeTemplatePreviewState,
  compileRecipeTemplateState,
  createRecipeTemplateGhostState,
  createRecipeTemplateActionSpec,
  createRecipeTemplateActionsPacket,
  createRecipeTemplateFillFromHydration,
  createRecipeTemplateFillFromText,
  createRecipeTemplateHydrationArtifact,
  createRecipeTemplateHydrationPacket,
  createRecipeTemplateSelectionPacket,
  createRecipeTemplateTextArtifact,
  createRecipeTemplateTextPacket,
  extractRecipeTemplateActionsArtifact,
  extractRecipeTemplateHydrationArtifact,
  extractRecipeTemplateSelectionArtifact,
  extractRecipeTemplateTextArtifact,
  findCardById,
  mapSections,
  migrateRecipeTemplateFill,
  normalizeRecipeTemplateActions,
  normalizeRecipeTemplateHydration,
  normalizeRecipeTemplateSelection,
  normalizeRecipeTemplateText,
  type RecipeTemplateRepairSummary,
  validateRecipeTemplateSelection
} from './recipes/recipe-template-contract';
import { extractRecipeAppletSource, synthesizeRecipeAppletPlan } from './recipes/recipe-applet-contract';
import { buildRecipeAppletGeneratedTests } from './recipes/recipe-applet-generated-tests';
import { synthesizeRecipeAppletManifest } from './recipes/recipe-applet-manifest';
import { collectRecipeAppletNodeKinds } from './recipes/recipe-applet-render-tree';
import { analyzeRecipeAppletModule } from './recipes/recipe-applet-static-validation';
import type { RecipeAppletRenderContext } from './recipes/recipe-applet-types';
import { verifyRecipeApplet } from './recipes/recipe-applet-verifier';
import { getRecipeTemplateRuntimeDefinition, listAvailableRecipeTemplateDefinitions } from './recipes/recipe-template-registry';
import type { StructuredJsonFailureKind } from './recipes/structured-json-recovery';
import { parsePartialJsonObject } from './recipes/structured-json-recovery';

export class BridgeError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export interface HermesBridgeOptions {
  database: BridgeDatabase;
  hermesCli: HermesCli;
  recipeRoot?: string;
  now?: () => string;
  asyncRecipeAppletTimeoutMs?: number;
}

const DEFAULT_ASYNC_WORKRECIPE_APPLET_TIMEOUT_MS = 90_000;
const EXPERIMENTAL_WORKRECIPE_APPLET_RUNTIME_ENABLED = process.env.HERMES_EXPERIMENTAL_WORKRECIPE_APPLETS === '1';

const HermesRecipeCreateOperationSchema = z.object({
  type: z.literal('create_space'),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  contentFormat: RecipeContentFormatSchema.optional(),
  contentData: z.record(z.string().min(1), z.unknown()).optional(),
  tabs: z.array(RecipeTabSchema).optional(),
  uiState: RecipeUiStateSchema.partial().optional(),
  viewType: z.enum(['blank', 'table', 'card', 'markdown']).optional(),
  data: z.record(z.string().min(1), z.unknown()).optional(),
  status: RecipeStatusSchema.optional(),
  metadata: RecipeMetadataSchema.partial().optional(),
  lastUpdatedBy: z.string().min(1).optional(),
  linkCurrentChat: z.boolean().default(true)
});

const HermesRecipeUpdateOperationSchema = z
  .object({
    type: z.literal('update_space'),
    recipeId: z.string().min(1).optional(),
    target: z.literal('current').optional(),
    title: z.string().min(1).max(120).optional(),
    description: z.string().max(500).optional(),
    contentFormat: RecipeContentFormatSchema.optional(),
    contentData: z.record(z.string().min(1), z.unknown()).optional(),
    tabs: z.array(RecipeTabSchema).optional(),
    uiState: RecipeUiStateSchema.partial().optional(),
    viewType: z.enum(['blank', 'table', 'card', 'markdown']).optional(),
    data: z.record(z.string().min(1), z.unknown()).optional(),
    status: RecipeStatusSchema.optional(),
    metadata: RecipeMetadataSchema.partial().optional(),
    lastUpdatedBy: z.string().min(1).optional(),
    linkCurrentChat: z.boolean().optional()
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.contentFormat !== undefined ||
      value.contentData !== undefined ||
      value.tabs !== undefined ||
      value.viewType !== undefined ||
      value.status !== undefined ||
      value.data !== undefined ||
      value.uiState !== undefined ||
      value.metadata !== undefined ||
      value.lastUpdatedBy !== undefined ||
      value.linkCurrentChat !== undefined,
    'At least one update field must be provided.'
  );

const HermesRecipeDeleteOperationSchema = z.object({
  type: z.literal('delete_space'),
  recipeId: z.string().min(1).optional(),
  target: z.literal('current').optional()
});

const HermesRecipeMarkChangedOperationSchema = z.object({
  type: z.literal('mark_space_changed'),
  recipeId: z.string().min(1).optional(),
  target: z.literal('current').optional(),
  summary: z.string().min(1).optional(),
  status: RecipeStatusSchema.optional(),
  metadata: RecipeMetadataSchema.partial().optional(),
  lastUpdatedBy: z.string().min(1).optional(),
  linkCurrentChat: z.boolean().optional()
});

const HermesRecipeOperationSchema = z.union([
  HermesRecipeCreateOperationSchema,
  HermesRecipeUpdateOperationSchema,
  HermesRecipeDeleteOperationSchema,
  HermesRecipeMarkChangedOperationSchema
]);

const HermesRecipeOperationEnvelopeSchema = z.object({
  operations: z.array(HermesRecipeOperationSchema).default([])
});

type HermesRecipeOperation = z.infer<typeof HermesRecipeOperationSchema>;
type HermesRecipeTargetOperation = {
  recipeId?: string;
  target?: 'current';
};

type RecipeMutationResult = {
  assistantMarkdown: string;
  activeRecipeId: string | null;
  summaries: string[];
  createdRecipeIds: string[];
};

type StreamBridgeRequestInput = {
  profileId: string;
  sessionId: string;
  recipeId?: string;
  transcriptContent: string;
  hermesContent?: string;
  intentContent?: string;
  mode?: ChatStreamRequest['mode'];
  triggerActionId?: string | null;
  triggerKindOverride?: RecipeBuildTriggerKind | null;
};

type RecipeActionArtifactContext = {
  buildId: string;
  action: RecipeActionDefinition;
  userPrompt: z.infer<typeof RecipeUserPromptArtifactSchema>;
  intent: RecipeIntent;
  rawData: Extract<RecipeArtifactPayload, { kind: 'raw_data' }>;
  normalizedData: RecipeNormalizedData;
  assistantContext: RecipeAssistantContext;
  summary: RecipeSummary | null;
};

type TemplateRecipeActionArtifactContext = {
  buildId: string;
  action: RecipeActionDefinition;
  userPrompt: z.infer<typeof RecipeUserPromptArtifactSchema>;
  intent: RecipeIntent;
  templateState: RecipeTemplateState;
};

type RecipeAppletArtifactContext = {
  buildId: string | null;
  build: RecipeBuild | null;
  userPrompt: z.infer<typeof RecipeUserPromptArtifactSchema>;
  intent: RecipeIntent;
  rawData: RecipeRawData;
  assistantContext: RecipeAssistantContext;
  analysis: RecipeAnalysis;
  normalizedData: RecipeNormalizedData;
  summary: RecipeSummary | null;
  fallback: RecipeFallbackState | null;
  actionSpec: RecipeActionSpec | null;
  recipeModel: RecipeModel | null;
  recipePatch: RecipePatch | null;
};

type RecipeTemplateArtifactContext = {
  buildId: string | null;
  build: RecipeBuild | null;
  userPrompt: z.infer<typeof RecipeUserPromptArtifactSchema>;
  intent: RecipeIntent;
  rawData: RecipeRawData;
  assistantContext: RecipeAssistantContext;
  analysis: RecipeAnalysis;
  normalizedData: RecipeNormalizedData;
  summary: RecipeSummary | null;
  fallback: RecipeFallbackState | null;
  currentTemplate: RecipeTemplateState | null;
};

type RecipePipelineSegmentKey = 'task' | 'baseline' | 'applet';

type RecipePipelineFailure = {
  category: RecipeFailureCategory;
  userFacingMessage: string;
  diagnostic: string;
  retryable: boolean;
  configuredTimeoutMs?: number;
  failureStage: RecipePipelineStage;
};

type RecipeGenerationStageKey =
  | 'structured_seed_generation'
  | 'template_selection'
  | 'template_text_generation'
  | 'template_hydration'
  | 'template_actions_generation'
  | 'template_text_repair'
  | 'template_actions_repair'
  | 'template_validation'
  | 'template_promotion';

type RecipeGenerationStageAttemptKind = 'initial' | 'repair';
type RecipeGenerationStageStatus = 'succeeded' | 'failed' | 'timed_out';
type RecipeGenerationStageFailureKind =
  | 'request_error'
  | 'context_invalid'
  | 'live_task_violation'
  | 'json_missing'
  | 'json_unbalanced'
  | 'json_invalid'
  | 'json_root_not_object'
  | 'schema_invalid'
  | 'validation_failed'
  | 'timeout';

type RecipeGenerationRawPayloadSnapshot = {
  preview: string;
  head: string;
  tail: string | null;
  totalChars: number;
  storedChars: number;
  truncated: boolean;
};

type RecipeGenerationStageObservation = {
  recordType: 'recipe_generation_stage_timing';
  buildId: string;
  requestId: string;
  profileId: string;
  sessionId: string | null;
  recipeId: string;
  stage: RecipeGenerationStageKey;
  phase: RecipeBuild['phase'];
  attemptKind: RecipeGenerationStageAttemptKind;
  attemptNumber: number;
  retryNumber: number;
  status: RecipeGenerationStageStatus;
  completed: boolean;
  startedAt: string;
  endedAt: string;
  elapsedMs: number;
  configuredTimeoutMs: number | null;
  recommendedTimeoutMs: number | null;
  timeoutCategory: Extract<RecipeFailureCategory, 'timeout_user_config' | 'timeout_runtime'> | null;
  templateId: RecipeTemplateId | null;
  currentTemplateId: RecipeTemplateId | null;
  autoRecoveryAttempted: boolean;
  autoRecoverySucceeded: boolean;
  failureKind: RecipeGenerationStageFailureKind | null;
  retryReason: string | null;
  rawPayloadLogId: string | null;
  errorDetail: string | null;
};

type RecipeGenerationTrace = {
  buildId: string;
  requestId: string;
  profileId: string;
  sessionId: string | null;
  recipeId: string;
  startedAt: string;
  currentTemplateId: RecipeTemplateId | null;
  templateId: RecipeTemplateId | null;
  repairInvoked: boolean;
  stageObservations: RecipeGenerationStageObservation[];
};

type RecipeGenerationStageRun = {
  stage: RecipeGenerationStageKey;
  phase: RecipeBuild['phase'];
  attemptKind: RecipeGenerationStageAttemptKind;
  startedAt: string;
  attemptNumber: number;
  retryReason: string | null;
  configuredTimeoutMs: number | null;
  recommendedTimeoutMs: number | null;
  templateId: RecipeTemplateId | null;
  currentTemplateId: RecipeTemplateId | null;
};

type RecipeGenerationSummary = {
  recordType: 'recipe_generation_summary';
  buildId: string;
  requestId: string;
  profileId: string;
  sessionId: string | null;
  recipeId: string;
  finalPhase: RecipeBuild['phase'];
  completed: boolean;
  ready: boolean;
  startedAt: string;
  completedAt: string | null;
  totalElapsedMs: number;
  repairInvoked: boolean;
  currentTemplateId: RecipeTemplateId | null;
  templateId: RecipeTemplateId | null;
  attemptsByStage: Partial<Record<RecipeGenerationStageKey, number>>;
  rawPayloadLogIdsByStage: Partial<Record<RecipeGenerationStageKey, string[]>>;
  recoveryByStage: Partial<
    Record<
      RecipeGenerationStageKey,
      {
        attempted: boolean;
        succeeded: boolean;
      }
    >
  >;
  perStageElapsedMs: Partial<Record<RecipeGenerationStageKey, number>>;
  stageObservations: RecipeGenerationStageObservation[];
  timeout: {
    stage: RecipeGenerationStageKey;
    elapsedMs: number;
    configuredTimeoutMs: number | null;
    recommendedTimeoutMs: number | null;
    timeoutCategory: Extract<RecipeFailureCategory, 'timeout_user_config' | 'timeout_runtime'> | null;
    attemptKind: RecipeGenerationStageAttemptKind;
    diagnostic: string | null;
  } | null;
  failureCategory: RecipeFailureCategory | null;
  failureStage: RecipePipelineStage | null;
  errorCode: string | null;
  errorMessage: string | null;
  errorDetail: string | null;
};

type RecipeGenerationStageAttemptResult<T> = {
  value: T | null;
  assistantMarkdown: string;
  detail: string;
  startedAt: string;
  endedAt: string;
  elapsedMs: number;
  configuredTimeoutMs: number | null;
  recommendedTimeoutMs: number | null;
  failureReason: 'live_task_violation' | 'context_invalid' | null;
  failureKind: RecipeGenerationStageFailureKind | null;
  retryable: boolean;
  autoRecoveryAttempted: boolean;
  autoRecoverySucceeded: boolean;
  templateId?: RecipeTemplateId | null;
  currentTemplateId?: RecipeTemplateId | null;
  parserDiagnostics?: Record<string, unknown> | null;
  normalizationSummary?: RecipeTemplateRepairSummary | Record<string, unknown> | null;
  sameSessionCorrections?: number;
  sameSessionCorrectionErrors?: string[];
  sameSessionCorrectionFixed?: boolean;
  sameSessionSessionId?: string | null;
};

type RecipeGenerationStageRetryOutcome<T> =
  | {
      ok: true;
      value: T;
      attemptResult: RecipeGenerationStageAttemptResult<T>;
      observation: RecipeGenerationStageObservation;
      attemptsUsed: number;
    }
  | {
      ok: false;
      detail: string;
      failureReason: 'live_task_violation' | 'context_invalid' | null;
      failureKind: RecipeGenerationStageFailureKind | null;
      retryable: boolean;
      attemptResult: RecipeGenerationStageAttemptResult<T>;
      observation: RecipeGenerationStageObservation;
      attemptsUsed: number;
    };

type RecipeRefreshContext = {
  intentPrompt: string;
  source: 'recipe_metadata' | 'recipe_event' | 'session_history' | 'recipe_snapshot';
};

type QueuedRecipeAppletBuildInput = {
  profile: Profile;
  session: Session;
  currentRecipe: Recipe;
  requestId: string;
  requestPreview: string;
  requestMode: ChatStreamRequest['mode'];
  settings: ReturnType<BridgeDatabase['getSettings']>;
  pipeline: RecipePipelineState;
  onEvent: (event: ChatStreamEvent) => Promise<void> | void;
  triggerActionId?: string | null;
  triggerKindOverride?: RecipeBuildTriggerKind | null;
  retryCount?: number;
  progressMessage: string;
  pipelineMessage: string;
  pipelineEventMessage: string;
  telemetryCode: string;
  telemetryMessage: string;
  telemetryDetail: string;
  buildKind?: RecipeBuild['buildKind'];
  renderMode?: Recipe['renderMode'];
};

type RecipeAppletEnrichmentJobInput =
  | {
      kind: 'request';
      profile: Profile;
      session: Session;
      recipeId: string;
      requestId: string;
      requestPreview: string;
      requestMode: ChatStreamRequest['mode'];
      settings: ReturnType<BridgeDatabase['getSettings']>;
      buildId: string;
      structuredIntentPrompt: string;
      conversationalAssistantMarkdown: string;
      structuredRecipeIntent: StructuredRecipeIntent | null;
      mutationIntent: RecipeMutationIntent | null;
      refreshContext: RecipeRefreshContext | null;
      triggerActionId?: string | null;
      triggerKindOverride?: RecipeBuildTriggerKind | null;
    }
  | {
      kind: 'retry';
      profile: Profile;
      session: Session;
      recipeId: string;
      requestId: string;
      requestPreview: string;
      settings: ReturnType<BridgeDatabase['getSettings']>;
      buildId: string;
      triggerActionId?: string | null;
      triggerKindOverride?: RecipeBuildTriggerKind | null;
    };

const recipeFenceOpenPattern = /```hermes-ui-recipes[^\n]*\n?/giu;

function normalizeRecipeMetadata(metadata: Partial<Recipe['metadata']> | undefined, current?: Recipe['metadata']) {
  return {
    changeVersion: metadata?.changeVersion ?? current?.changeVersion ?? 1,
    auditTags: metadata?.auditTags ?? current?.auditTags ?? [],
    homeRecipe: metadata?.homeRecipe ?? current?.homeRecipe ?? false,
    baselineContentUpdatedAt: metadata?.baselineContentUpdatedAt ?? current?.baselineContentUpdatedAt,
    lastChangedAt: metadata?.lastChangedAt ?? current?.lastChangedAt,
    changeSummary: metadata?.changeSummary ?? current?.changeSummary,
    refreshPrompt: metadata?.refreshPrompt ?? current?.refreshPrompt,
    refreshRequestId: metadata?.refreshRequestId ?? current?.refreshRequestId,
    refreshPromptUpdatedAt: metadata?.refreshPromptUpdatedAt ?? current?.refreshPromptUpdatedAt,
    latestRecipeAttemptOutcome: metadata?.latestRecipeAttemptOutcome ?? current?.latestRecipeAttemptOutcome,
    latestRecipeAttemptMode: metadata?.latestRecipeAttemptMode ?? current?.latestRecipeAttemptMode,
    latestRecipeAttemptRequestId: metadata?.latestRecipeAttemptRequestId ?? current?.latestRecipeAttemptRequestId,
    latestRecipeAttemptedAt: metadata?.latestRecipeAttemptedAt ?? current?.latestRecipeAttemptedAt,
    activeTemplateId: metadata?.activeTemplateId ?? current?.activeTemplateId,
    recipePipeline: metadata?.recipePipeline ?? current?.recipePipeline
  };
}

function createRecipePipelineSegment(
  status: RecipePipelineSegment['status'],
  updatedAt: string,
  options: Partial<Omit<RecipePipelineSegment, 'status' | 'updatedAt'>> = {}
): RecipePipelineSegment {
  return {
    status,
    updatedAt,
    ...options
  };
}

function createInitialRecipePipeline(timestamp: string): RecipePipelineState {
  return {
    currentStage: 'task_running',
    task: createRecipePipelineSegment('running', timestamp, {
      stage: 'task_running',
      message: 'Hermes is performing the request.'
    }),
    baseline: createRecipePipelineSegment('idle', timestamp, {
      message: 'The Home recipe baseline will update after the task completes.'
    }),
    applet: createRecipePipelineSegment('idle', timestamp, {
      message: 'No richer recipe enrichment has started yet.'
    })
  };
}

function createRecipeAppletRetryPipeline(timestamp: string): RecipePipelineState {
  return {
    currentStage: 'enrichment_generating',
    task: createRecipePipelineSegment('skipped', timestamp, {
      message: 'The original Hermes task was not rerun for this enrichment retry.'
    }),
    baseline: createRecipePipelineSegment('ready', timestamp, {
      stage: 'baseline_ready',
      message: 'Using the existing Home recipe baseline.'
    }),
    applet: createRecipePipelineSegment('running', timestamp, {
      stage: 'enrichment_generating',
      message: 'Retrying richer recipe enrichment from persisted artifacts.',
      retryable: true
    })
  };
}

function updateRecipePipelineSegment(
  pipeline: RecipePipelineState,
  segment: RecipePipelineSegmentKey,
  currentStage: RecipePipelineStage,
  update: Partial<RecipePipelineSegment> & Pick<RecipePipelineSegment, 'status' | 'updatedAt'>
): RecipePipelineState {
  return {
    ...pipeline,
    currentStage,
    [segment]: {
      ...pipeline[segment],
      ...update
    }
  };
}

function isSyntheticRecipeRefreshMessage(content: string) {
  return content.trim() === RECIPE_REFRESH_USER_MESSAGE;
}

function withRefreshableRecipeMetadata(
  metadata: Partial<Recipe['metadata']> | undefined,
  options: {
    current?: Recipe['metadata'];
    requestMode?: ChatStreamRequest['mode'];
    requestPreview?: string;
    requestId?: string;
    timestamp: string;
  }
) {
  const nextRefreshPrompt =
    options.requestMode !== 'recipe_refresh' && options.requestPreview && options.requestPreview.trim().length > 0
      ? options.requestPreview.trim()
      : undefined;

  return normalizeRecipeMetadata(
    nextRefreshPrompt
      ? {
          ...metadata,
          refreshPrompt: nextRefreshPrompt,
          refreshRequestId: options.requestId ?? metadata?.refreshRequestId ?? options.current?.refreshRequestId,
          refreshPromptUpdatedAt: options.timestamp
        }
      : metadata,
    options.current
  );
}

function withRecipeAttemptMetadata(
  metadata: Partial<Recipe['metadata']> | undefined,
  options: {
    current?: Recipe['metadata'];
    outcome: NonNullable<Recipe['metadata']['latestRecipeAttemptOutcome']>;
    mode: NonNullable<Recipe['metadata']['latestRecipeAttemptMode']>;
    requestId: string;
    timestamp: string;
  }
) {
  return normalizeRecipeMetadata(
    {
      ...metadata,
      latestRecipeAttemptOutcome: options.outcome,
      latestRecipeAttemptMode: options.mode,
      latestRecipeAttemptRequestId: options.requestId,
      latestRecipeAttemptedAt: options.timestamp
    },
    options.current
  );
}

function normalizeLegacyBlankContent(data: Record<string, unknown> | undefined) {
  const prompt = typeof data?.prompt === 'string' ? data.prompt.trim() : '';
  const emptyMessage = typeof data?.emptyMessage === 'string' ? data.emptyMessage.trim() : '';
  return {
    markdown: prompt || emptyMessage
  };
}

function normalizeRecipeTabsForInput(
  input: {
    tabs?: Recipe['tabs'];
    contentFormat?: RecipeContentFormat;
    contentData?: Record<string, unknown>;
    viewType?: 'blank' | 'table' | 'card' | 'markdown';
    data?: Record<string, unknown>;
  },
  currentRecipe?: Pick<Recipe, 'tabs'> | null
) {
  const currentContentFormat = currentRecipe ? getRecipeContentFormat(currentRecipe) : undefined;

  if (input.tabs !== undefined) {
    return normalizeRecipeTabs({
      tabs: input.tabs,
      currentRecipe
    });
  }

  if (input.viewType) {
    if (input.viewType === 'blank') {
      return normalizeRecipeTabs({
        currentRecipe,
        contentFormat: 'markdown',
        contentData: normalizeLegacyBlankContent(input.data)
      });
    }

    return normalizeRecipeTabs({
      currentRecipe,
      contentFormat: input.viewType,
      contentData: input.data
    });
  }

  if (input.data !== undefined) {
    const inferredContentFormat =
      input.contentFormat ??
      inferRecipeContentFormatFromData(input.data) ??
      currentContentFormat ??
      'markdown';
    return normalizeRecipeTabs({
      currentRecipe,
      contentFormat: inferredContentFormat,
      contentData: input.data
    });
  }

  return normalizeRecipeTabs({
    currentRecipe,
    contentFormat: input.contentFormat,
    contentData: input.contentData
  });
}

function inferRecipeContentFormatFromData(data: Record<string, unknown> | undefined) {
  if (!data) {
    return null;
  }

  if (Array.isArray(data.cards)) {
    return 'card' as const;
  }

  if (Array.isArray(data.columns)) {
    return 'table' as const;
  }

  if (typeof data.markdown === 'string') {
    return 'markdown' as const;
  }

  return null;
}

function extractBalancedJsonValue(text: string) {
  const startIndex = text.search(/[[{]/u);
  if (startIndex < 0) {
    return null;
  }

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const character = text[index];
    if (!character) {
      continue;
    }

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === '\\') {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === '{' || character === '[') {
      stack.push(character);
      continue;
    }

    if (character === '}' || character === ']') {
      const expected = character === '}' ? '{' : '[';
      if (stack.at(-1) !== expected) {
        return null;
      }

      stack.pop();
      if (stack.length === 0) {
        return {
          jsonText: text.slice(startIndex, index + 1),
          startIndex,
          endIndex: index + 1,
          leadingText: text.slice(0, startIndex).trim(),
          trailingText: text.slice(index + 1).trim()
        };
      }
    }
  }

  return null;
}

function parseRecipeOperationsJson(rawValue: unknown) {
  if (Array.isArray(rawValue)) {
    return HermesRecipeOperationEnvelopeSchema.parse({
      operations: rawValue
    });
  }

  if (rawValue && typeof rawValue === 'object' && 'type' in rawValue) {
    return HermesRecipeOperationEnvelopeSchema.parse({
      operations: [rawValue]
    });
  }

  return HermesRecipeOperationEnvelopeSchema.parse(rawValue);
}

function parseRecipeOperationsPayload(payloadText: string) {
  const trimmed = payloadText.trim();
  if (!trimmed) {
    return {
      operations: [] as HermesRecipeOperation[],
      warnings: [] as string[],
      error: null as string | null,
      extractedRange: null as { startIndex: number; endIndex: number } | null
    };
  }

  try {
    const parsedPayload = parseRecipeOperationsJson(JSON.parse(trimmed) as unknown);
    return {
      operations: parsedPayload.operations,
      warnings: [] as string[],
      error: null as string | null,
      extractedRange: {
        startIndex: payloadText.indexOf(trimmed),
        endIndex: payloadText.indexOf(trimmed) + trimmed.length
      }
    };
  } catch (initialError) {
    const extractedJson = extractBalancedJsonValue(trimmed);
    if (!extractedJson) {
      return {
        operations: [] as HermesRecipeOperation[],
        warnings: [] as string[],
        error: initialError instanceof Error ? initialError.message : 'Invalid Hermes UI Recipes block.',
        extractedRange: null as { startIndex: number; endIndex: number } | null
      };
    }

    try {
      const parsedPayload = parseRecipeOperationsJson(JSON.parse(extractedJson.jsonText) as unknown);
      const warnings: string[] = [];
      if (extractedJson.leadingText || extractedJson.trailingText) {
        warnings.push('Ignored non-JSON prose inside the Hermes UI Recipes block.');
      }

      return {
        operations: parsedPayload.operations,
        warnings,
        error: null as string | null,
        extractedRange: {
          startIndex: payloadText.indexOf(trimmed) + extractedJson.startIndex,
          endIndex: payloadText.indexOf(trimmed) + extractedJson.endIndex
        }
      };
    } catch (extractedError) {
      return {
        operations: [] as HermesRecipeOperation[],
        warnings: [] as string[],
        error: extractedError instanceof Error ? extractedError.message : 'Invalid Hermes UI Recipes block.',
        extractedRange: {
          startIndex: payloadText.indexOf(trimmed) + extractedJson.startIndex,
          endIndex: payloadText.indexOf(trimmed) + extractedJson.endIndex
        }
      };
    }
  }
}

function stripTextRanges(markdown: string, ranges: Array<{ start: number; end: number }>) {
  if (ranges.length === 0) {
    return markdown.trim();
  }

  const orderedRanges = [...ranges]
    .filter((range) => range.end > range.start)
    .sort((left, right) => left.start - right.start);
  const pieces: string[] = [];
  let cursor = 0;

  for (const range of orderedRanges) {
    if (range.start > cursor) {
      pieces.push(markdown.slice(cursor, range.start));
    }
    cursor = Math.max(cursor, range.end);
  }

  if (cursor < markdown.length) {
    pieces.push(markdown.slice(cursor));
  }

  return pieces.join('').replace(/\n{3,}/gu, '\n\n').trim();
}

function findRecipeFenceEnd(markdown: string, searchStart: number, maxEnd: number) {
  const boundedSearchStart = Math.min(Math.max(searchStart, 0), maxEnd);
  const firstFenceIndex = markdown.indexOf('```', boundedSearchStart);
  if (firstFenceIndex < 0 || firstFenceIndex >= maxEnd) {
    return boundedSearchStart;
  }

  let blockEnd = firstFenceIndex + 3;
  let cursor = blockEnd;

  while (cursor < maxEnd) {
    const whitespaceMatch = markdown.slice(cursor, maxEnd).match(/^\s*/u);
    cursor += whitespaceMatch?.[0].length ?? 0;
    if (!markdown.startsWith('```', cursor)) {
      break;
    }

    blockEnd = cursor + 3;
    cursor = blockEnd;
  }

  return Math.min(blockEnd, maxEnd);
}

function extractRecipeOperations(markdown: string) {
  const openingMatches = Array.from(markdown.matchAll(recipeFenceOpenPattern));
  if (openingMatches.length === 0) {
    return {
      cleanedMarkdown: markdown.trim(),
      operations: [] as HermesRecipeOperation[],
      errors: [] as string[],
      warnings: [] as string[]
    };
  }

  const operations: HermesRecipeOperation[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const rangesToStrip: Array<{ start: number; end: number }> = [];

  for (let index = 0; index < openingMatches.length; index += 1) {
    const match = openingMatches[index];
    if (match.index === undefined) {
      continue;
    }

    const blockStart = match.index;
    const payloadStart = blockStart + match[0].length;
    const nextBlockStart = openingMatches[index + 1]?.index ?? markdown.length;
    const payloadText = markdown.slice(payloadStart, nextBlockStart);
    const parsedPayload = parseRecipeOperationsPayload(payloadText);
    operations.push(...parsedPayload.operations);
    warnings.push(...parsedPayload.warnings);
    if (parsedPayload.error) {
      errors.push(parsedPayload.error);
    }

    const fallbackFenceEnd = markdown.indexOf('```', payloadStart);
    const parsedFenceEnd =
      parsedPayload.extractedRange && parsedPayload.extractedRange.endIndex > parsedPayload.extractedRange.startIndex
        ? findRecipeFenceEnd(markdown, payloadStart + parsedPayload.extractedRange.endIndex, nextBlockStart)
        : -1;
    const blockEnd =
      parsedFenceEnd > payloadStart
        ? parsedFenceEnd
        : fallbackFenceEnd >= payloadStart && fallbackFenceEnd < nextBlockStart
          ? fallbackFenceEnd + 3
          : nextBlockStart;

    rangesToStrip.push({
      start: blockStart,
      end: Math.max(blockEnd, payloadStart)
    });
  }

  return {
    cleanedMarkdown: stripTextRanges(markdown, rangesToStrip),
    operations,
    errors,
    warnings
  };
}

export const __recipeParsingForTests = {
  extractRecipeOperations
};

// Maps classifier labels (from classifyStructuredRecipeIntent) to their target template IDs.
// Labels are kept in sync with each template's selectionSignals so selection is predictable.
// This static map is the fallback: we also scan every loaded recipe's selectionSignals at runtime
// so user/builtin recipes on disk participate in selection without touching this code.
const INTENT_LABEL_TO_TEMPLATE_ID: Partial<Record<string, RecipeTemplateId>> = {
  'inbox triage': 'inbox-triage-board',
  'security review': 'security-review-board',
  'job search': 'job-search-pipeline',
  'flight comparison': 'flight-comparison',
  'travel planner': 'travel-itinerary-planner',
  'event planner': 'event-planner',
  'campaign planner': 'content-campaign-planner',
  'price comparison': 'price-comparison-grid',
  'restaurant shortlist': 'restaurant-finder',
  'hotel shortlist': 'hotel-shortlist',
  'nearby places': 'local-discovery-comparison',
  'research notebook': 'research-notebook',
  'comparison matrix': 'vendor-evaluation-matrix',
  'shopping results': 'shopping-shortlist',
  'step by step': 'step-by-step-instructions'
};

/**
 * Converts a RecipeMutationIntent (UI change request) into a StructuredRecipeIntent that can be
 * used to drive the rest of the enrichment pipeline.  The label is chosen to match an existing
 * recipe selection signal so the optimistic ghost and selection LLM both converge on the right
 * template.
 */
function synthesizeIntentFromMutation(
  mutation: RecipeMutationIntent,
  currentTemplateId: string
): StructuredRecipeIntent {
  // Prefer the mutation's own template hint when available.
  const targetLabel = mutation.targetTemplateHint
    ? Object.entries({
        'inbox-triage-board': 'inbox triage',
        'security-review-board': 'security review',
        'job-search-pipeline': 'job search',
        'flight-comparison': 'flight comparison',
        'travel-itinerary-planner': 'travel planner',
        'event-planner': 'event planner',
        'content-campaign-planner': 'campaign planner',
        'price-comparison-grid': 'price comparison',
        'restaurant-finder': 'restaurant shortlist',
        'hotel-shortlist': 'hotel shortlist',
        'local-discovery-comparison': 'nearby places',
        'research-notebook': 'research notebook',
        'vendor-evaluation-matrix': 'comparison matrix',
        'shopping-shortlist': 'shopping results',
        'step-by-step-instructions': 'step by step'
      }).find(([id]) => id === mutation.targetTemplateHint)?.[1] ?? 'shopping results'
    : mutation.kind === 'change_layout' && mutation.wantsKanban
      ? 'job search'
      : mutation.kind === 'change_visual' || mutation.wantsCards
        ? 'shopping results'
        : mutation.wantsTable
          ? 'comparison matrix'
          : mutation.wantsTimeline
            ? 'travel planner'
            : 'shopping results';

  const preferredContentFormat: RecipeContentFormat =
    mutation.wantsTable ? 'table' :
    mutation.wantsCards || mutation.wantsImages ? 'card' :
    'card';

  return {
    category: 'results',
    preferredContentFormat,
    label: targetLabel
  };
}

function resolveTemplateIdForIntentLabel(label: string): RecipeTemplateId | null {
  const direct = INTENT_LABEL_TO_TEMPLATE_ID[label];
  if (direct) return direct;

  // Scan every loaded recipe's selectionSignals for a case-insensitive match on the label or any
  // individual word. Disk-loaded recipes (builtin-recipes/* or ~/.hermes/recipes/*) become
  // discoverable without editing this file.
  const normalizedLabel = label.toLowerCase();
  const definitions = listAvailableRecipeTemplateDefinitions();
  for (const definition of definitions) {
    if (!definition.enabled && definition.enabled !== undefined) continue;
    for (const signal of definition.selectionSignals) {
      if (signal.toLowerCase() === normalizedLabel) {
        return definition.id;
      }
    }
  }
  return null;
}

export class HermesBridge {
  private readonly now: () => string;
  private readonly recipeRoot: string;
  private readonly recipeEnrichmentQueues = new Map<string, Promise<void>>();
  private readonly pendingRecipeEnrichmentRecipes = new Set<string>();

  constructor(private readonly options: HermesBridgeOptions) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.recipeRoot = options.recipeRoot ?? process.cwd();
  }

  private recordTelemetryIfLatestDifferent(
    event: Parameters<HermesBridge['recordTelemetry']>[0],
    dedupeBy: {
      profileId?: string | null;
      sessionId?: string | null;
      requestId?: string | null;
    } = {}
  ) {
    const latest = this.options.database.listTelemetryEvents({
      profileId: dedupeBy.profileId,
      sessionId: dedupeBy.sessionId,
      requestId: dedupeBy.requestId,
      limit: 1
    })[0];

    if (latest && latest.code === event.code && latest.message === event.message && latest.detail === event.detail) {
      return latest;
    }

    return this.recordTelemetry(event);
  }

  private recordTelemetry(
    event: Omit<TelemetryEvent, 'id' | 'createdAt'> & {
      id?: string;
      createdAt?: string;
    }
  ) {
    return this.options.database.appendTelemetryEvent({
      id: event.id ?? `telemetry-${randomUUID()}`,
      profileId: event.profileId ?? null,
      sessionId: event.sessionId ?? null,
      requestId: event.requestId ?? null,
      severity: event.severity,
      category: event.category,
      code: event.code,
      message: event.message,
      detail: event.detail,
      payload: event.payload ?? {},
      createdAt: event.createdAt ?? this.now()
    });
  }

  private formatTimeoutMs(timeoutMs: number) {
    return `${timeoutMs.toLocaleString()}ms`;
  }

  private upsertRuntimeRequestRecipePipeline(requestId: string, pipeline: RecipePipelineState) {
    return this.options.database.updateRuntimeRequestRecipePipeline(requestId, pipeline);
  }

  private updateRecipeRecipePipeline(recipe: Recipe, pipeline: RecipePipelineState) {
    return (
      this.options.database.updateRecipe(recipe.id, {
        profileId: recipe.profileId,
        metadata: normalizeRecipeMetadata(
          {
            recipePipeline: pipeline
          },
          recipe.metadata
        )
      }) ?? recipe
    );
  }

  private persistRecipePipeline(requestId: string, pipeline: RecipePipelineState, recipe?: Recipe | null) {
    this.upsertRuntimeRequestRecipePipeline(requestId, pipeline);
    if (!recipe) {
      return null;
    }

    return this.updateRecipeRecipePipeline(recipe, pipeline);
  }

  private describeTaskTimeoutContext(
    prompt: string,
    requestMode: ChatStreamRequest['mode'],
    structuredRecipeIntent: StructuredRecipeIntent | null
  ) {
    const normalizedPrompt = prompt.toLowerCase();

    if (/\b(email|gmail|inbox|mail|unread)\b/u.test(normalizedPrompt)) {
      return {
        recommendedTimeoutMs: 240_000,
        label: 'checking email'
      };
    }

    if (/\b(restaurant|restaurants|coffee|cafe|cafes|bar|bars|hotel|hotels|lodging|nearby|near me|around me)\b/u.test(normalizedPrompt)) {
      return {
        recommendedTimeoutMs: 300_000,
        label: 'searching nearby results'
      };
    }

    if (requestMode === 'recipe_refresh') {
      return {
        recommendedTimeoutMs: 180_000,
        label: 'refreshing the attached Home recipe'
      };
    }

    if (requestMode === 'recipe_action') {
      return {
        recommendedTimeoutMs: 180_000,
        label: 'running the recipe action'
      };
    }

    if (structuredRecipeIntent) {
      return {
        recommendedTimeoutMs: 180_000,
        label: 'preparing the Home recipe response'
      };
    }

    return {
      recommendedTimeoutMs: 45_000,
      label: 'handling the request'
    };
  }

  private classifyTaskFailure(input: {
    profileId: string;
    prompt: string;
    requestMode: ChatStreamRequest['mode'];
    structuredRecipeIntent: StructuredRecipeIntent | null;
    activeRecipe: Recipe | null;
    refreshContext: {
      intentPrompt: string;
      source: 'recipe_metadata' | 'recipe_event' | 'session_history' | 'recipe_snapshot';
    } | null;
    settings: ReturnType<BridgeDatabase['getSettings']>;
    detail: string;
  }): RecipePipelineFailure {
    const diagnostic = input.detail.trim() || 'Hermes could not finish the request.';
    const timeoutContext = this.describeTaskTimeoutContext(input.prompt, input.requestMode, input.structuredRecipeIntent);
    const configuredTimeoutMs = resolveHermesChatTimeoutMs({
      content: input.prompt,
      refreshContext: input.refreshContext,
      spaceContext: input.activeRecipe ? this.buildRecipeChatContext(input.activeRecipe) : null,
      timeoutMs: input.settings.chatTimeoutMs,
      discoveryTimeoutMs: input.settings.discoveryTimeoutMs,
      nearbySearchTimeoutMs: input.settings.nearbySearchTimeoutMs,
      recipeOperationTimeoutMs: input.settings.recipeOperationTimeoutMs,
      unrestrictedTimeoutMs: input.settings.unrestrictedTimeoutMs,
      unrestrictedAccessEnabled: input.settings.unrestrictedAccessEnabled
    });

    if (/timed out/i.test(diagnostic)) {
      const category =
        configuredTimeoutMs < timeoutContext.recommendedTimeoutMs ? 'timeout_user_config' : 'timeout_runtime';
      const timeoutDetail =
        category === 'timeout_user_config'
          ? ` The configured limit is ${this.formatTimeoutMs(configuredTimeoutMs)}. Increase it and retry.`
          : ` The request stopped after ${this.formatTimeoutMs(configuredTimeoutMs)}.`;

      return {
        category,
        userFacingMessage: `Hermes timed out while ${timeoutContext.label} before the Home recipe baseline could update.${timeoutDetail}`,
        diagnostic,
        retryable: true,
        configuredTimeoutMs,
        failureStage: 'task_failed'
      };
    }

    if (/not fully authenticated|auth[_\s-]?scope|authentication|authorization|oauth|credentials?/i.test(diagnostic)) {
      return {
        category: 'auth_scope',
        userFacingMessage: `Hermes could not finish the request for profile ${input.profileId} because the required authentication scope is missing. The Home recipe baseline was not updated.`,
        diagnostic,
        retryable: true,
        failureStage: 'task_failed'
      };
    }

    if (/tool|maximum iterations|cli request failed|command .*failed|exit code/i.test(diagnostic)) {
      return {
        category: 'upstream_tool_failure',
        userFacingMessage: 'Hermes could not finish the task because an upstream tool step failed. The Home recipe baseline was not updated.',
        diagnostic,
        retryable: true,
        failureStage: 'task_failed'
      };
    }

    return {
      category: 'task_failure',
      userFacingMessage: 'Hermes could not finish the task, so the Home recipe baseline was not updated.',
      diagnostic,
      retryable: true,
      failureStage: 'task_failed'
    };
  }

  private classifyBaselineFailure(detail: string): RecipePipelineFailure {
    const diagnostic = detail.trim() || 'The Home recipe baseline could not be updated.';
    return {
      category: 'baseline_recipe_failure',
      userFacingMessage: 'Hermes completed the task, but the Home recipe baseline could not be updated. The assistant answer is still available in chat.',
      diagnostic,
      retryable: true,
      failureStage: 'baseline_failed'
    };
  }

  private classifyRecipeAppletVerificationFailure(verification: RecipeAppletVerification): {
    category: RecipeFailureCategory;
    label: string;
  } {
    if (verification.capabilityValidation.status === 'failed') {
      return {
        category: 'applet_capability_failure',
        label: 'capability validation'
      };
    }

    if (verification.typecheck.status === 'failed') {
      return {
        category: 'applet_compile_failure',
        label: 'TypeScript compilation'
      };
    }

    if (verification.generatedTests.status === 'failed') {
      return {
        category: 'applet_test_failure',
        label: 'generated tests'
      };
    }

    if (verification.renderSmoke.status === 'failed') {
      return {
        category: 'applet_render_failure',
        label: 'render smoke validation'
      };
    }

    if (verification.smallPaneSmoke.status === 'failed') {
      return {
        category: 'applet_small_pane_failure',
        label: 'small-pane validation'
      };
    }

    return {
      category: 'applet_verification_failure',
      label: 'verification'
    };
  }

  private classifyRecipeAppletFailure(input: {
    kind: 'context' | 'seed' | 'manifest' | 'source' | 'verification';
    detail: string;
    settings: ReturnType<BridgeDatabase['getSettings']>;
    verification?: RecipeAppletVerification | null;
    failureReason?: 'live_task_violation' | 'context_invalid' | null;
    recommendedTimeoutMsOverride?: number;
    configuredTimeoutMsOverride?: number;
  }): RecipePipelineFailure {
    const diagnostic = input.detail.trim() || 'The recipe applet could not be promoted.';
    const recommendedTimeoutMs = input.recommendedTimeoutMsOverride ?? (input.kind === 'seed' ? 30_000 : 45_000);
    const configuredTimeoutMs =
      input.configuredTimeoutMsOverride ??
      (input.kind === 'seed'
        ? Math.max(15_000, Math.min(input.settings.recipeOperationTimeoutMs, 30_000))
        : Math.max(20_000, Math.min(input.settings.recipeOperationTimeoutMs, 45_000)));

    if (input.failureReason === 'live_task_violation') {
      return {
        category: 'applet_generation_live_task_violation',
        userFacingMessage:
          'The Home recipe baseline is ready, but the recipe applet generation attempted blocked live task work and was stopped. The applet path can only use persisted artifacts.',
        diagnostic,
        retryable: true,
        failureStage: 'applet_generating'
      };
    }

    if (input.failureReason === 'context_invalid' || input.kind === 'context') {
      return {
        category: 'applet_generation_context_invalid',
        userFacingMessage:
          'The Home recipe baseline is ready, but the recipe applet context is incomplete. Refresh the baseline artifacts before retrying the applet upgrade.',
        diagnostic,
        retryable: false,
        failureStage: 'applet_generating'
      };
    }

    if (/timed out/i.test(diagnostic)) {
      const category = configuredTimeoutMs < recommendedTimeoutMs ? 'timeout_user_config' : 'timeout_runtime';
      const timeoutDetail =
        category === 'timeout_user_config'
          ? ` The current applet timeout is ${this.formatTimeoutMs(configuredTimeoutMs)}. Increase it and retry the upgrade.`
          : ` The applet step stopped after ${this.formatTimeoutMs(configuredTimeoutMs)}.`;
      const stageLabel =
        input.kind === 'seed'
          ? 'recipe seed generation'
          : input.kind === 'manifest'
            ? 'manifest synthesis'
            : input.kind === 'source'
              ? 'source generation'
              : 'verification';

      return {
        category,
        userFacingMessage: `The Home recipe baseline is ready, but the recipe applet ${stageLabel} timed out.${timeoutDetail}`,
        diagnostic,
        retryable: true,
        configuredTimeoutMs,
        failureStage: input.kind === 'verification' ? 'applet_validating' : 'applet_generating'
      };
    }

    if (input.kind === 'seed') {
      return {
        category: 'applet_seed_failure',
        userFacingMessage: 'The Home recipe baseline is ready, but Hermes did not produce a valid recipe applet seed. You can retry the upgrade.',
        diagnostic,
        retryable: true,
        failureStage: 'applet_generating'
      };
    }

    if (input.kind === 'manifest') {
      return {
        category: 'applet_manifest_failure',
        userFacingMessage: 'The Home recipe baseline is ready, but the recipe applet manifest failed validation. You can retry the upgrade.',
        diagnostic,
        retryable: true,
        failureStage: 'applet_generating'
      };
    }

    if (input.kind === 'source') {
      return {
        category: 'applet_source_failure',
        userFacingMessage: 'The Home recipe baseline is ready, but the recipe applet source could not be generated safely. You can retry the upgrade.',
        diagnostic,
        retryable: true,
        failureStage: 'applet_generating'
      };
    }

    const verificationFailure = input.verification
      ? this.classifyRecipeAppletVerificationFailure(input.verification)
      : {
          category: 'applet_verification_failure' as const,
          label: 'verification'
        };

    return {
      category: verificationFailure.category,
      userFacingMessage: `The Home recipe baseline is ready, but the recipe applet ${verificationFailure.label} failed. You can retry the upgrade.`,
      diagnostic,
      retryable: true,
      failureStage: 'applet_validating'
    };
  }

  private resolveRecipeAppletFailureEvent(
    failure: RecipePipelineFailure,
    fallbackCode: string,
    fallbackMessage: string
  ) {
    if (failure.category === 'applet_generation_live_task_violation') {
      return {
        code: 'RECIPE_APPLET_LIVE_TASK_VIOLATION',
        message: 'Recipe applet generation was blocked because Hermes attempted live task work.'
      } as const;
    }

    if (failure.category === 'applet_generation_context_invalid') {
      return {
        code: 'RECIPE_APPLET_CONTEXT_INVALID',
        message: 'Recipe applet generation could not start because the artifact-only context was invalid.'
      } as const;
    }

    return {
      code: fallbackCode,
      message: fallbackMessage
    } as const;
  }

  private classifyRecipeDslFailure(input: {
    kind: 'context' | 'seed' | 'dsl' | 'normalization' | 'repair';
    detail: string;
    settings: ReturnType<BridgeDatabase['getSettings']>;
    configuredTimeoutMsOverride?: number;
    failureReason?: 'live_task_violation' | 'context_invalid' | null;
  }): RecipePipelineFailure {
    const diagnostic = input.detail.trim() || 'The richer recipe DSL could not be promoted.';
    const configuredTimeoutMs =
      input.configuredTimeoutMsOverride ??
      Math.max(20_000, Math.min(input.settings.recipeOperationTimeoutMs, DEFAULT_ASYNC_WORKRECIPE_APPLET_TIMEOUT_MS));

    if (input.failureReason === 'live_task_violation') {
      return {
        category: 'dsl_generation_live_task_violation',
        userFacingMessage:
          'The Home recipe baseline is ready, but recipe enrichment attempted blocked live task work and was stopped. Enrichment can only use persisted artifacts.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_generating'
      };
    }

    if (input.failureReason === 'context_invalid' || input.kind === 'context') {
      return {
        category: 'dsl_context_invalid',
        userFacingMessage:
          'The Home recipe baseline is ready, but the enrichment context is incomplete. Refresh the baseline artifacts before retrying recipe enrichment.',
        diagnostic,
        retryable: false,
        failureStage: 'enrichment_generating'
      };
    }

    if (/timed out/i.test(diagnostic)) {
      const category = configuredTimeoutMs < DEFAULT_ASYNC_WORKRECIPE_APPLET_TIMEOUT_MS ? 'timeout_user_config' : 'timeout_runtime';
      const timeoutDetail =
        category === 'timeout_user_config'
          ? ` The current enrichment timeout is ${this.formatTimeoutMs(configuredTimeoutMs)}. Increase it and retry.`
          : ` The enrichment step stopped after ${this.formatTimeoutMs(configuredTimeoutMs)}.`;
      const stageLabel =
        input.kind === 'seed'
          ? 'recipe seed generation'
          : input.kind === 'dsl'
            ? 'recipe DSL generation'
            : input.kind === 'repair'
              ? 'recipe DSL repair'
            : 'recipe DSL normalization';

      return {
        category,
        userFacingMessage: `The Home recipe baseline is ready, but ${stageLabel} timed out.${timeoutDetail}`,
        diagnostic,
        retryable: true,
        configuredTimeoutMs,
        failureStage: 'enrichment_generating'
      };
    }

    if (input.kind === 'seed') {
      return {
        category: 'dsl_seed_failure',
        userFacingMessage: 'The Home recipe baseline is ready, but Hermes did not produce a valid recipe seed for enrichment. You can retry recipe enrichment.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_generating'
      };
    }

    if (input.kind === 'dsl') {
      return {
        category: 'dsl_generation_failure',
        userFacingMessage: 'The Home recipe baseline is ready, but Hermes did not produce a valid recipe DSL artifact. You can retry recipe enrichment.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_generating'
      };
    }

    if (input.kind === 'repair') {
      return {
        category: 'dsl_repair_failed',
        userFacingMessage:
          'The Home recipe baseline is ready, but one bounded recipe DSL repair attempt still could not produce a valid enrichment artifact. You can retry recipe enrichment.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_validating'
      };
    }

    return {
      category: diagnostic.includes('patch')
        ? 'dsl_patch_failure'
        : diagnostic.includes('normalize') || diagnostic.includes('reference')
          ? 'dsl_normalization_failure'
          : 'dsl_validation_failure',
      userFacingMessage:
        'The Home recipe baseline is ready, but the bridge could not normalize the richer recipe DSL safely. You can retry recipe enrichment.',
      diagnostic,
      retryable: true,
      failureStage: 'enrichment_validating'
    };
  }

  private resolveRecipeDslFailureEvent(
    failure: RecipePipelineFailure,
    fallbackCode: string,
    fallbackMessage: string
  ) {
    if (failure.category === 'dsl_generation_live_task_violation') {
      return {
        code: 'RECIPE_DSL_LIVE_TASK_VIOLATION',
        message: 'Recipe DSL generation was blocked because Hermes attempted live task work.'
      } as const;
    }

    if (failure.category === 'dsl_context_invalid') {
      return {
        code: 'RECIPE_DSL_CONTEXT_INVALID',
        message: 'Recipe enrichment could not start because the artifact-only context was invalid.'
      } as const;
    }

    return {
      code: fallbackCode,
      message: fallbackMessage
    } as const;
  }

  private classifyRecipeTemplateFailure(input: {
    kind:
      | 'selection'
      | 'text'
      | 'hydration'
      | 'actions'
      | 'fill'
      | 'update'
      | 'switch'
      | 'validation'
      | 'normalization'
      | 'repair'
      | 'text_repair'
      | 'actions_repair';
    detail: string;
    settings: ReturnType<BridgeDatabase['getSettings']>;
    configuredTimeoutMsOverride?: number;
    recommendedTimeoutMsOverride?: number;
    failureReason?: 'live_task_violation' | 'context_invalid' | null;
  }): RecipePipelineFailure {
    const diagnostic = input.detail.trim() || 'Recipe template generation failed.';
    const semanticContentFailure = /Semantic completeness failed:/iu.test(diagnostic);
    const configuredTimeoutMs =
      input.configuredTimeoutMsOverride ??
      Math.max(20_000, Math.min(input.settings.recipeOperationTimeoutMs, DEFAULT_ASYNC_WORKRECIPE_APPLET_TIMEOUT_MS));
    const recommendedTimeoutMs = input.recommendedTimeoutMsOverride ?? DEFAULT_ASYNC_WORKRECIPE_APPLET_TIMEOUT_MS;

    if (input.failureReason === 'context_invalid') {
      return {
        category:
          input.kind === 'text'
            ? 'template_text_failed'
            : input.kind === 'hydration'
              ? 'template_hydration_failed'
            : input.kind === 'actions'
              ? 'template_actions_failed'
              : input.kind === 'text_repair'
                ? 'template_text_repair_failed'
                : input.kind === 'actions_repair'
                  ? 'template_actions_repair_failed'
                  : input.kind === 'repair'
                    ? 'repair_failed'
                    : input.kind === 'normalization'
                      ? 'normalization_failed'
                      : 'validation_failed',
        userFacingMessage: 'Recipe generation failed because the persisted template context was incomplete.',
        diagnostic,
        retryable: false,
        failureStage: 'enrichment_generating'
      };
    }

    if (input.failureReason === 'live_task_violation') {
      return {
        category:
          input.kind === 'selection'
            ? 'template_selection_failed'
            : input.kind === 'text'
              ? 'template_text_failed'
              : input.kind === 'hydration'
                ? 'template_hydration_failed'
              : input.kind === 'actions'
                ? 'template_actions_failed'
            : input.kind === 'update'
              ? 'template_update_failed'
              : input.kind === 'text_repair'
                ? 'template_text_repair_failed'
                : input.kind === 'actions_repair'
                  ? 'template_actions_repair_failed'
                : input.kind === 'repair'
                  ? 'repair_failed'
                  : input.kind === 'normalization'
                    ? 'normalization_failed'
                    : 'template_fill_failed',
        userFacingMessage:
          'Recipe generation failed because Hermes attempted live task work. Template generation may only use persisted artifacts.',
        diagnostic,
        retryable: true,
        failureStage: input.kind === 'selection' ? 'enrichment_generating' : 'enrichment_validating'
      };
    }

    if (/timed out/i.test(diagnostic)) {
      const category = configuredTimeoutMs < recommendedTimeoutMs ? 'timeout_user_config' : 'timeout_runtime';
        const stageLabel =
        input.kind === 'selection'
          ? 'template selection'
          : input.kind === 'text'
            ? 'template text generation'
            : input.kind === 'hydration'
              ? 'template content hydration'
            : input.kind === 'actions'
              ? 'template actions generation'
          : input.kind === 'update'
            ? 'template update'
            : input.kind === 'text_repair'
              ? 'template text repair'
              : input.kind === 'actions_repair'
                ? 'template actions repair'
            : input.kind === 'repair'
              ? 'template repair'
              : input.kind === 'normalization'
                ? 'template normalization'
                : input.kind === 'switch'
                  ? 'template switch'
                  : input.kind === 'validation'
                    ? 'template validation'
                    : 'template fill';
      return {
        category,
        userFacingMessage: `Recipe generation failed because ${stageLabel} timed out after ${this.formatTimeoutMs(configuredTimeoutMs)}.`,
        diagnostic,
        retryable: true,
        configuredTimeoutMs,
        failureStage: input.kind === 'selection' ? 'enrichment_generating' : 'enrichment_validating'
      };
    }

    if (input.kind === 'selection') {
      return {
        category: 'template_selection_failed',
        userFacingMessage: 'Recipe generation failed because Hermes did not select a valid approved template.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_generating'
      };
    }

    if (input.kind === 'fill') {
      return {
        category: 'template_fill_failed',
        userFacingMessage: 'Recipe generation failed because Hermes did not return a valid fill for the selected template.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_validating'
      };
    }

    if (input.kind === 'update') {
      return {
        category: 'template_update_failed',
        userFacingMessage: 'Recipe generation failed because Hermes did not return a valid update for the current template.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_validating'
      };
    }

    if (input.kind === 'switch') {
      return {
        category: 'template_switch_failed',
        userFacingMessage: 'Recipe generation failed because the template switch could not be completed safely.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_validating'
      };
    }

    if (input.kind === 'text') {
      return {
        category: 'template_text_failed',
        userFacingMessage: 'Recipe generation failed because Hermes did not return a valid text/content artifact for the selected template.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_validating'
      };
    }

    if (input.kind === 'hydration') {
      return {
        category: semanticContentFailure ? 'semantic_content_failed' : 'template_hydration_failed',
        userFacingMessage: semanticContentFailure
          ? 'Recipe generation failed because the selected template stayed semantically empty after hydration. Rebuild the recipe to try again.'
          : 'Recipe generation failed because Hermes did not return a valid populated content artifact for the selected template.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_validating'
      };
    }

    if (input.kind === 'actions') {
      return {
        category: 'template_actions_failed',
        userFacingMessage: 'Recipe generation failed because Hermes did not return a valid actions/buttons artifact for the selected template.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_validating'
      };
    }

    if (input.kind === 'normalization') {
      return {
        category: 'normalization_failed',
        userFacingMessage: 'Recipe generation failed because the template artifact could not be normalized safely.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_validating'
      };
    }

    if (input.kind === 'repair') {
      return {
        category: 'repair_failed',
        userFacingMessage: 'Recipe generation failed because the bounded repair pass could not produce a valid template artifact.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_validating'
      };
    }

    if (input.kind === 'text_repair') {
      return {
        category: 'template_text_repair_failed',
        userFacingMessage:
          'Recipe generation failed because the bounded text/content repair pass could not produce a valid staged artifact.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_validating'
      };
    }

    if (input.kind === 'actions_repair') {
      return {
        category: 'template_actions_repair_failed',
        userFacingMessage:
          'Recipe generation failed because the bounded actions/buttons repair pass could not produce a valid staged artifact.',
        diagnostic,
        retryable: true,
        failureStage: 'enrichment_validating'
      };
    }

    return {
      category: semanticContentFailure
        ? 'semantic_content_failed'
        : diagnostic.includes('transition')
          ? 'unsupported_template_transition'
          : 'validation_failed',
      userFacingMessage: semanticContentFailure
        ? 'Recipe generation failed because the selected template stayed semantically empty.'
        : 'Recipe generation failed because the selected template payload failed local validation.',
      diagnostic,
      retryable: true,
      failureStage: 'enrichment_validating'
    };
  }

  private normalizeRequestPreview(content: string) {
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : 'Hermes request';
  }

  private resolveRecipeTemplateSelectionMode(
    selection: RecipeTemplateSelection,
    currentTemplate: RecipeTemplateState | null
  ): 'fill' | 'update' | 'switch' {
    if (!currentTemplate) {
      return 'fill';
    }

    if (selection.templateId === currentTemplate.templateId) {
      return 'update';
    }

    return 'switch';
  }

  private resolveUnexpectedQueuedTemplateFailureKind(
    phase: RecipeBuild['phase']
  ): 'selection' | 'text' | 'hydration' | 'actions' | 'text_repair' | 'actions_repair' | 'validation' {
    switch (phase) {
      case 'template_selecting':
        return 'selection';
      case 'template_text_generating':
        return 'text';
      case 'template_hydrating':
        return 'hydration';
      case 'template_text_repairing':
        return 'text_repair';
      case 'template_actions_generating':
        return 'actions';
      case 'template_actions_repairing':
        return 'actions_repair';
      default:
        return 'validation';
    }
  }

  private resolveUnexpectedQueuedTemplateFailureEvent(
    kind: ReturnType<HermesBridge['resolveUnexpectedQueuedTemplateFailureKind']>
  ) {
    switch (kind) {
      case 'selection':
        return {
          code: 'RECIPE_TEMPLATE_SELECTION_FAILED',
          message: 'Recipe template selection failed unexpectedly.'
        };
      case 'text':
        return {
          code: 'RECIPE_TEMPLATE_TEXT_FAILED',
          message: 'Recipe template text generation failed unexpectedly.'
        };
      case 'hydration':
        return {
          code: 'RECIPE_TEMPLATE_HYDRATION_FAILED',
          message: 'Recipe template hydration failed unexpectedly.'
        };
      case 'text_repair':
        return {
          code: 'RECIPE_TEMPLATE_TEXT_REPAIR_FAILED',
          message: 'Recipe template text repair failed unexpectedly.'
        };
      case 'actions':
        return {
          code: 'RECIPE_TEMPLATE_ACTIONS_FAILED',
          message: 'Recipe template actions generation failed unexpectedly.'
        };
      case 'actions_repair':
        return {
          code: 'RECIPE_TEMPLATE_ACTIONS_REPAIR_FAILED',
          message: 'Recipe template actions repair failed unexpectedly.'
        };
      default:
        return {
          code: 'RECIPE_TEMPLATE_VALIDATION_FAILED',
          message: 'Recipe template validation failed unexpectedly.'
        };
    }
  }

  private serializeStructuredContext(value: unknown, maxLength = 4_000) {
    const raw =
      typeof value === 'string'
        ? value
        : JSON.stringify(value, null, 2);
    if (raw.length <= maxLength) {
      return raw;
    }

    return `${raw.slice(0, Math.max(0, maxLength - 18)).trimEnd()}\n... truncated`;
  }

  private getSelectedRecipeItems(normalizedData: RecipeNormalizedData, selectedItemIds: string[]) {
    if (selectedItemIds.length === 0) {
      return [] as RecipeNormalizedItem[];
    }

    const selectedSet = new Set(selectedItemIds);
    return normalizedData.datasets.flatMap((dataset) => dataset.items.filter((item) => selectedSet.has(item.id)));
  }

  private buildRecipeActionTranscriptContent(action: RecipeActionDefinition, selectedItems: RecipeNormalizedItem[]) {
    if (selectedItems.length === 1) {
      return `${action.label}: ${selectedItems[0]?.title ?? action.prompt?.promptTemplate ?? action.label}`;
    }

    if (selectedItems.length > 1) {
      return `${action.label}: ${selectedItems.length} selected items`;
    }

    return action.prompt?.promptTemplate ?? action.label;
  }

  private resolveRecipeActionArtifactBuildId(recipe: Recipe, actionId: string) {
    const candidateIds = [
      recipe.dynamic?.applet?.activeBuild?.id ?? null,
      recipe.dynamic?.applet?.promotedBuildId ?? null,
      recipe.dynamic?.activeBuild?.id ?? null,
      ...this.options.database.listRecipeBuilds(recipe.id, {
        limit: 12
      }).map((build) => build.id)
    ].filter((value): value is string => Boolean(value));

    let fallbackBuildId: string | null = null;
    for (const buildId of [...new Set(candidateIds)]) {
      const actionSpec = this.options.database.getRecipeBuildArtifact(buildId, 'action_spec');
      const userPrompt = this.options.database.getRecipeBuildArtifact(buildId, 'user_prompt');
      const intent = this.options.database.getRecipeBuildArtifact(buildId, 'intent');
      const rawData = this.options.database.getRecipeBuildArtifact(buildId, 'raw_data');
      const normalizedData = this.options.database.getRecipeBuildArtifact(buildId, 'normalized_data');
      const assistantContext = this.options.database.getRecipeBuildArtifact(buildId, 'assistant_context');

      if (!actionSpec || !userPrompt || !intent || !rawData || !normalizedData || !assistantContext) {
        continue;
      }

      const parsedActionSpec = RecipeActionSpecSchema.parse(actionSpec.payload);
      if (parsedActionSpec.actions.some((item) => item.id === actionId)) {
        return buildId;
      }

      if (!fallbackBuildId) {
        fallbackBuildId = buildId;
      }
    }

    return fallbackBuildId;
  }

  private resolveRecipeActionArtifactContext(recipe: Recipe, actionId: string): RecipeActionArtifactContext {
    const artifactBuildId = this.resolveRecipeActionArtifactBuildId(recipe, actionId);
    if (!artifactBuildId) {
      throw new BridgeError(409, 'RECIPE_ACTION_CONTEXT_MISSING', 'The dynamic recipe is missing the persisted build artifacts required for actions.');
    }

    const userPromptArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'user_prompt');
    const intentArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'intent');
    const rawDataArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'raw_data');
    const normalizedDataArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'normalized_data');
    const assistantContextArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'assistant_context');
    const actionSpecArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'action_spec');
    const summaryArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'summary');

    if (!userPromptArtifact || !intentArtifact || !rawDataArtifact || !normalizedDataArtifact || !assistantContextArtifact || !actionSpecArtifact) {
      throw new BridgeError(409, 'RECIPE_ACTION_CONTEXT_MISSING', 'The dynamic recipe is missing one or more action artifacts.');
    }

    const actionSpec = RecipeActionSpecSchema.parse(actionSpecArtifact.payload);
    const action = actionSpec.actions.find((item) => item.id === actionId);
    if (!action) {
      throw new BridgeError(404, 'RECIPE_ACTION_NOT_FOUND', `Action ${actionId} is not available for this recipe.`);
    }

    if (recipe.renderMode !== 'dynamic_v1' && action.kind !== 'bridge') {
      throw new BridgeError(
        409,
        'RECIPE_ACTION_UNAVAILABLE',
        'Prompt-bound actions are only available after richer recipe enrichment is ready.'
      );
    }

    return {
      buildId: artifactBuildId,
      action,
      userPrompt: RecipeUserPromptArtifactSchema.parse(userPromptArtifact.payload),
      intent: RecipeIntentSchema.parse(intentArtifact.payload),
      rawData: RecipeRawDataSchema.parse(rawDataArtifact.payload),
      normalizedData: RecipeNormalizedDataSchema.parse(normalizedDataArtifact.payload),
      assistantContext: RecipeAssistantContextSchema.parse(assistantContextArtifact.payload),
      summary: summaryArtifact ? RecipeSummarySchema.parse(summaryArtifact.payload) : null
    };
  }

  private resolveRecipeAppletArtifactBuildId(recipe: Recipe) {
    const candidateIds = [
      recipe.dynamic?.applet?.activeBuild?.id ?? null,
      recipe.dynamic?.applet?.promotedBuildId ?? null,
      recipe.dynamic?.activeBuild?.id ?? null,
      ...this.options.database.listRecipeBuilds(recipe.id, {
        limit: 12
      }).map((build) => build.id)
    ].filter((value): value is string => Boolean(value));

    let fallbackBuildId: string | null = null;
    for (const buildId of [...new Set(candidateIds)]) {
      const userPrompt = this.options.database.getRecipeBuildArtifact(buildId, 'user_prompt');
      const intent = this.options.database.getRecipeBuildArtifact(buildId, 'intent');
      const rawData = this.options.database.getRecipeBuildArtifact(buildId, 'raw_data');
      const assistantContext = this.options.database.getRecipeBuildArtifact(buildId, 'assistant_context');
      const analysis = this.options.database.getRecipeBuildArtifact(buildId, 'analysis');
      const normalizedData = this.options.database.getRecipeBuildArtifact(buildId, 'normalized_data');

      if (!userPrompt || !intent || !rawData || !assistantContext || !analysis || !normalizedData) {
        continue;
      }

      const build = this.options.database.getRecipeBuild(buildId);
      if (build?.buildKind === 'applet') {
        return buildId;
      }

      if (!fallbackBuildId) {
        fallbackBuildId = buildId;
      }
    }

    return fallbackBuildId;
  }

  private resolveRecipeAppletArtifactContext(recipe: Recipe): RecipeAppletArtifactContext {
    const artifactBuildId = this.resolveRecipeAppletArtifactBuildId(recipe);
    if (!artifactBuildId) {
      throw new BridgeError(
        409,
        'RECIPE_DSL_CONTEXT_MISSING',
        'The Home recipe is missing the persisted artifacts required for artifact-only recipe enrichment.'
      );
    }

    const build = this.options.database.getRecipeBuild(artifactBuildId);
    const userPromptArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'user_prompt');
    const intentArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'intent');
    const rawDataArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'raw_data');
    const assistantContextArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'assistant_context');
    const analysisArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'analysis');
    const normalizedDataArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'normalized_data');
    const summaryArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'summary');
    const fallbackArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'fallback');
    const actionSpecArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'action_spec');
    const recipeModelArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'recipe_model');
    const recipePatchArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'recipe_patch');

    if (
      !build ||
      !userPromptArtifact ||
      !intentArtifact ||
      !rawDataArtifact ||
      !assistantContextArtifact ||
      !analysisArtifact ||
      !normalizedDataArtifact
    ) {
      throw new BridgeError(
        409,
        'RECIPE_DSL_CONTEXT_MISSING',
        'The Home recipe is missing one or more persisted enrichment artifacts.'
      );
    }

    return {
      buildId: artifactBuildId,
      build,
      userPrompt: RecipeUserPromptArtifactSchema.parse(userPromptArtifact.payload),
      intent: RecipeIntentSchema.parse(intentArtifact.payload),
      rawData: RecipeRawDataSchema.parse(rawDataArtifact.payload),
      assistantContext: RecipeAssistantContextSchema.parse(assistantContextArtifact.payload),
      analysis: RecipeAnalysisSchema.parse(analysisArtifact.payload),
      normalizedData: RecipeNormalizedDataSchema.parse(normalizedDataArtifact.payload),
      summary: summaryArtifact ? RecipeSummarySchema.parse(summaryArtifact.payload) : null,
      fallback: fallbackArtifact ? RecipeFallbackStateSchema.parse(fallbackArtifact.payload) : null,
      actionSpec: actionSpecArtifact ? RecipeActionSpecSchema.parse(actionSpecArtifact.payload) : null,
      recipeModel: recipeModelArtifact ? RecipeModelSchema.parse(recipeModelArtifact.payload) : null,
      recipePatch: recipePatchArtifact ? RecipePatchSchema.parse(recipePatchArtifact.payload) : null
    };
  }

  private resolveRecipeTemplateArtifactContext(recipe: Recipe): RecipeTemplateArtifactContext {
    const artifactBuildId = this.resolveRecipeAppletArtifactBuildId(recipe);
    if (!artifactBuildId) {
      throw new BridgeError(
        409,
        'RECIPE_TEMPLATE_CONTEXT_MISSING',
        'The Home recipe is missing the persisted artifacts required for template generation.'
      );
    }

    const build = this.options.database.getRecipeBuild(artifactBuildId);
    const userPromptArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'user_prompt');
    const intentArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'intent');
    const rawDataArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'raw_data');
    const assistantContextArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'assistant_context');
    const analysisArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'analysis');
    const normalizedDataArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'normalized_data');
    const summaryArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'summary');
    const fallbackArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'fallback');
    const templateStateArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'recipe_template_state');

    if (
      !build ||
      !userPromptArtifact ||
      !intentArtifact ||
      !rawDataArtifact ||
      !assistantContextArtifact ||
      !analysisArtifact ||
      !normalizedDataArtifact
    ) {
      throw new BridgeError(
        409,
        'RECIPE_TEMPLATE_CONTEXT_MISSING',
        'The Home recipe is missing one or more persisted template-generation artifacts.'
      );
    }

    return {
      buildId: artifactBuildId,
      build,
      userPrompt: RecipeUserPromptArtifactSchema.parse(userPromptArtifact.payload),
      intent: RecipeIntentSchema.parse(intentArtifact.payload),
      rawData: RecipeRawDataSchema.parse(rawDataArtifact.payload),
      assistantContext: RecipeAssistantContextSchema.parse(assistantContextArtifact.payload),
      analysis: RecipeAnalysisSchema.parse(analysisArtifact.payload),
      normalizedData: RecipeNormalizedDataSchema.parse(normalizedDataArtifact.payload),
      summary: summaryArtifact ? RecipeSummarySchema.parse(summaryArtifact.payload) : null,
      fallback: fallbackArtifact ? RecipeFallbackStateSchema.parse(fallbackArtifact.payload) : null,
      currentTemplate: templateStateArtifact ? RecipeTemplateStateSchema.parse(templateStateArtifact.payload) : null
    };
  }

  private resolveTemplateRecipeActionArtifactContext(recipe: Recipe, actionId: string): TemplateRecipeActionArtifactContext {
    const artifactBuildId = this.resolveRecipeActionArtifactBuildId(recipe, actionId);
    if (!artifactBuildId) {
      throw new BridgeError(409, 'RECIPE_ACTION_CONTEXT_MISSING', 'The template recipe is missing the persisted artifacts required for actions.');
    }

    const userPromptArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'user_prompt');
    const intentArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'intent');
    const actionSpecArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'action_spec');
    const templateStateArtifact = this.options.database.getRecipeBuildArtifact(artifactBuildId, 'recipe_template_state');

    if (!userPromptArtifact || !intentArtifact || !actionSpecArtifact || !templateStateArtifact) {
      throw new BridgeError(409, 'RECIPE_ACTION_CONTEXT_MISSING', 'The template recipe is missing one or more action artifacts.');
    }

    const actionSpec = RecipeActionSpecSchema.parse(actionSpecArtifact.payload);
    const action = actionSpec.actions.find((item) => item.id === actionId);
    if (!action) {
      throw new BridgeError(404, 'RECIPE_ACTION_NOT_FOUND', `Action ${actionId} is not available for this template recipe.`);
    }

    return {
      buildId: artifactBuildId,
      action,
      userPrompt: RecipeUserPromptArtifactSchema.parse(userPromptArtifact.payload),
      intent: RecipeIntentSchema.parse(intentArtifact.payload),
      templateState: RecipeTemplateStateSchema.parse(templateStateArtifact.payload)
    };
  }

  private findFirstTemplateSection(
    sections: RecipeTemplateState['sections'],
    predicate: (section: RecipeTemplateSection) => boolean
  ): RecipeTemplateSection | null {
    for (const section of sections) {
      if (predicate(section)) {
        return section;
      }

      if (section.kind === 'split') {
        const nested = this.findFirstTemplateSection([...section.left, ...section.right], predicate);
        if (nested) {
          return nested;
        }
      }

      if (section.kind === 'tabs') {
        const nested = this.findFirstTemplateSection(Object.values(section.panes).flat(), predicate);
        if (nested) {
          return nested;
        }
      }
    }

    return null;
  }

  private persistTemplateRecipeActionUpdate(
    recipe: Recipe,
    buildId: string,
    templateState: RecipeTemplateState,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void,
    sessionId: string,
    requestId: string,
    actionLabel: string
  ) {
    const build = this.options.database.getRecipeBuild(buildId) ?? recipe.dynamic?.activeBuild ?? null;
    if (build) {
      this.persistRecipeBuildArtifact(build, templateState, this.now());
      const definition = getRecipeTemplateRuntimeDefinition(templateState.templateId);
      if (definition) {
        this.persistRecipeBuildArtifact(
          build,
          this.withRetryBuildActionSpec(createRecipeTemplateActionSpec(templateState, definition), true),
          this.now()
        );
      }
    }

    const updatedRecipe =
      this.options.database.updateRecipe(recipe.id, {
        profileId: recipe.profileId,
        renderMode: 'dynamic_v1',
        metadata: {
          ...recipe.metadata,
          activeTemplateId: templateState.templateId
        }
      }) ?? recipe;

    return this.emitRecipeEvent(
      this.createRecipeEvent(
        updatedRecipe,
        'updated',
        `${actionLabel} updated "${updatedRecipe.title}".`,
        'bridge',
        sessionId,
        {
          renderMode: 'dynamic_v1',
          templateId: templateState.templateId,
          requestId
        }
      ),
      onEvent,
      this.options.database.getRecipe(updatedRecipe.id) ?? updatedRecipe
    );
  }

  private cloneRecipeTemplateState(templateState: RecipeTemplateState) {
    return RecipeTemplateStateSchema.parse(JSON.parse(JSON.stringify(templateState)));
  }

  private getTemplateSelectedItems(templateState: RecipeTemplateState, selectedItemIds: string[]) {
    const selectedItems: Array<{
      id: string;
      title: string;
      subtitle?: string;
      footer?: string;
    }> = [];

    for (const itemId of selectedItemIds) {
      const match = findCardById(templateState.sections, itemId);
      if (!match) {
        continue;
      }

      selectedItems.push({
        id: itemId,
        title: match.title,
        subtitle: match.subtitle,
        footer: match.footer
      });
    }

    return selectedItems;
  }

  private validateTemplateActionSelection(
    action: RecipeActionDefinition,
    requestedSelectedItemIds: string[],
    templateState: RecipeTemplateState
  ) {
    const selectedItems = this.getTemplateSelectedItems(templateState, requestedSelectedItemIds);
    if (requestedSelectedItemIds.length > 0 && selectedItems.length !== requestedSelectedItemIds.length) {
      throw new BridgeError(400, 'RECIPE_ACTION_SELECTION_INVALID', 'One or more selected template items are no longer available in the current recipe.');
    }

    switch (action.visibility.requiresSelection) {
      case 'single':
        if (selectedItems.length !== 1) {
          throw new BridgeError(400, 'RECIPE_ACTION_SELECTION_REQUIRED', `Action ${action.label} requires exactly one selected item.`);
        }
        break;
      case 'one_or_more':
        if (selectedItems.length < 1) {
          throw new BridgeError(400, 'RECIPE_ACTION_SELECTION_REQUIRED', `Action ${action.label} requires one or more selected items.`);
        }
        break;
      case 'none':
        if (selectedItems.length > 0) {
          throw new BridgeError(400, 'RECIPE_ACTION_SELECTION_FORBIDDEN', `Action ${action.label} does not accept selected items.`);
        }
        break;
      case 'any':
      default:
        break;
    }

    return selectedItems;
  }

  private buildTemplateActionTranscriptContent(
    action: RecipeActionDefinition,
    selectedItems: Array<{ id: string; title: string }>
  ) {
    if (selectedItems.length === 1) {
      return `${action.label}: ${selectedItems[0]?.title ?? action.label}`;
    }

    if (selectedItems.length > 1) {
      return `${action.label}: ${selectedItems.length} selected items`;
    }

    return action.label;
  }

  private buildPromptBoundTemplateActionContent(
    recipe: Recipe,
    context: TemplateRecipeActionArtifactContext,
    input: ExecuteRecipeActionRequest,
    selectedItems: Array<{ id: string; title: string; subtitle?: string; footer?: string }>
  ) {
    const formValues = Object.entries(input.formValues)
      .filter(([, value]) => value !== null && String(value).trim().length > 0)
      .map(([key, value]) => `${key}: ${String(value).trim()}`);

    const taskInstruction = context.action.prompt?.promptTemplate
      ? context.action.prompt.promptTemplate
      : `Perform the requested action: ${context.action.label}`;

    return [
      `Update the attached Home recipe using the approved "${context.templateState.templateId}" template flow.`,
      `Recipe title: ${recipe.title}`,
      `Task: ${taskInstruction}`,
      selectedItems.length > 0
        ? `Selected items:\n${selectedItems
            .map((item) => `- ${item.title}${item.subtitle ? ` — ${item.subtitle}` : ''}${item.footer ? ` (${item.footer})` : ''}`)
            .join('\n')}`
        : null,
      formValues.length > 0 ? `Provided values:\n${formValues.map((value) => `- ${value}`).join('\n')}` : null,
      `Original recipe prompt: ${context.userPrompt.originalPrompt}`,
      `Current template summary: ${context.templateState.summary}`,
      'Preserve the current template unless the user intent has clearly changed.',
      'Do not invent arbitrary layouts, schemas, or runtime UI. The bridge will enforce template selection, fill, update, and switching.'
    ]
      .filter((value): value is string => Boolean(value))
      .join('\n\n');
  }

  private appendTemplateNoteLine(templateState: RecipeTemplateState, line: string) {
    const noteTarget =
      this.findFirstTemplateSection(templateState.sections, (section) => section.kind === 'notes') ?? null;
    if (!noteTarget || noteTarget.kind !== 'notes') {
      return templateState;
    }

    const nextState = this.cloneRecipeTemplateState(templateState);
    nextState.sections = mapSections(nextState.sections, (section) =>
      section.slotId === noteTarget.slotId && section.kind === 'notes'
        ? {
            ...section,
            lines: [...section.lines, line]
          }
        : section
    );
    return nextState;
  }

  private markTemplateSelection(
    templateState: RecipeTemplateState,
    selectedId: string,
    labels: {
      selected: string;
      saved?: string;
    }
  ) {
    const nextState = this.cloneRecipeTemplateState(templateState);
    nextState.sections = mapSections(nextState.sections, (section) => {
      if (section.kind === 'card-grid') {
        return {
          ...section,
          cards: section.cards.map((card) => {
            const cardId = card.id ?? card.title;
            const nextChips = card.chips.filter((chip) => chip.label !== labels.selected && chip.label !== (labels.saved ?? '__unused__'));
            return cardId === selectedId
              ? {
                  ...card,
                  chips: [...nextChips, { label: labels.selected, tone: 'success' }]
                }
              : {
                  ...card,
                  chips: nextChips
                };
          })
        };
      }

      if (section.kind === 'grouped-list') {
        return {
          ...section,
          groups: section.groups.map((group) => ({
            ...group,
            items: group.items.map((item) => {
              const itemId = item.id ?? item.title;
              const nextChips = item.chips.filter((chip) => chip.label !== labels.selected && chip.label !== (labels.saved ?? '__unused__'));
              return itemId === selectedId
                ? {
                    ...item,
                    chips: [...nextChips, { label: labels.selected, tone: 'success' }]
                  }
                : {
                    ...item,
                    chips: nextChips
                  };
            })
          }))
        };
      }

      return section;
    });
    return nextState;
  }

  private saveTemplatePlaceSelection(
    templateState: RecipeTemplateState,
    selectedItem: { id: string; title: string; subtitle?: string; footer?: string }
  ) {
    const selectedState = this.cloneRecipeTemplateState(this.markTemplateSelection(templateState, selectedItem.id, { selected: 'Saved place' }));
    return this.appendTemplateNoteLine(
      selectedState,
      `Saved place: ${selectedItem.title}${selectedItem.subtitle ? ` — ${selectedItem.subtitle}` : ''}`
    );
  }

  private selectEventVenue(
    templateState: RecipeTemplateState,
    selectedItem: { id: string; title: string; subtitle?: string }
  ) {
    const selectedState = this.markTemplateSelection(templateState, selectedItem.id, { selected: 'Selected venue' });
    return this.appendTemplateNoteLine(
      selectedState,
      `Selected venue: ${selectedItem.title}${selectedItem.subtitle ? ` — ${selectedItem.subtitle}` : ''}`
    );
  }

  private addEventGuest(templateState: RecipeTemplateState, guestName: string) {
    const guestsSection = this.findFirstTemplateSection(
      templateState.sections,
      (section) => section.slotId === 'guests' && section.kind === 'grouped-list'
    );
    if (!guestsSection || guestsSection.kind !== 'grouped-list') {
      return templateState;
    }

    const nextState = this.cloneRecipeTemplateState(templateState);
    nextState.sections = mapSections(nextState.sections, (section) => {
      if (section.slotId !== guestsSection.slotId || section.kind !== 'grouped-list') {
        return section;
      }

      const [firstGroup, ...restGroups] = section.groups;
      if (!firstGroup) {
        return section;
      }

      return {
        ...section,
        groups: [
          {
            ...firstGroup,
            items: [
              ...firstGroup.items,
              {
                id: `guest-${guestName.toLowerCase().replace(/[^a-z0-9]+/giu, '-') || randomUUID()}`,
                title: guestName,
                meta: 'Added from the recipe.',
                chips: [],
                actions: []
              }
            ]
          },
          ...restGroups
        ]
      };
    });

    return nextState;
  }

  private toggleTemplateChecklistItem(templateState: RecipeTemplateState, itemId: string) {
    const checklistSection = this.findFirstTemplateSection(
      templateState.sections,
      (section) => section.slotId === 'checklist' && section.kind === 'grouped-list'
    );
    if (!checklistSection || checklistSection.kind !== 'grouped-list') {
      return templateState;
    }

    const nextState = this.cloneRecipeTemplateState(templateState);
    nextState.sections = mapSections(nextState.sections, (section) => {
      if (section.slotId !== checklistSection.slotId || section.kind !== 'grouped-list') {
        return section;
      }

      let movedItem: (typeof section.groups)[number]['items'][number] | null = null;
      const nextGroups = section.groups.map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const matches = (item.id ?? item.title) === itemId;
          if (matches) {
            movedItem = {
              ...item,
              chips: item.chips.some((chip) => chip.label === 'Done')
                ? item.chips.filter((chip) => chip.label !== 'Done')
                : [...item.chips.filter((chip) => chip.label !== 'Open'), { label: 'Done', tone: 'success' }]
            };
          }
          return !matches;
        })
      }));

      if (!movedItem) {
        return section;
      }

      const doneIndex = nextGroups.findIndex((group) => /done|complete/iu.test(group.label));
      const openIndex = nextGroups.findIndex((group) => /open|next/iu.test(group.label));
      const sourceWasDone = checklistSection.groups.some((group) => /done|complete/iu.test(group.label) && group.items.some((item) => (item.id ?? item.title) === itemId));
      const targetIndex = sourceWasDone ? (openIndex >= 0 ? openIndex : 0) : (doneIndex >= 0 ? doneIndex : Math.max(0, nextGroups.length - 1));
      nextGroups[targetIndex] = {
        ...nextGroups[targetIndex],
        items: [...nextGroups[targetIndex].items, movedItem]
      };

      return {
        ...section,
        groups: nextGroups
      };
    });

    return nextState;
  }

  private moveTemplateCardStage(templateState: RecipeTemplateState, itemId: string, targetStageId?: string | null) {
    const pipelineSection = this.findFirstTemplateSection(templateState.sections, (section) => section.kind === 'kanban');
    if (!pipelineSection || pipelineSection.kind !== 'kanban') {
      return templateState;
    }

    const nextState = this.cloneRecipeTemplateState(templateState);
    nextState.sections = mapSections(nextState.sections, (section) => {
      if (section.slotId !== pipelineSection.slotId || section.kind !== 'kanban') {
        return section;
      }

      let movedCard: (typeof section.columns)[number]['cards'][number] | null = null;
      let sourceIndex = -1;
      const nextColumns = section.columns.map((column, index) => ({
        ...column,
        cards: column.cards.filter((card) => {
          const matches = (card.id ?? card.title) === itemId;
          if (matches) {
            movedCard = card;
            sourceIndex = index;
          }
          return !matches;
        })
      }));

      if (!movedCard) {
        return section;
      }

      const explicitTargetIndex =
        targetStageId && targetStageId.length > 0
          ? nextColumns.findIndex((column) => (column.id ?? column.label) === targetStageId)
          : -1;
      const destinationIndex =
        explicitTargetIndex >= 0
          ? explicitTargetIndex
          : sourceIndex >= 0 && sourceIndex < nextColumns.length - 1
            ? sourceIndex + 1
            : 0;

      nextColumns[destinationIndex] = {
        ...nextColumns[destinationIndex],
        cards: [...nextColumns[destinationIndex].cards, movedCard]
      };

      return {
        ...section,
        columns: nextColumns
      };
    });

    return nextState;
  }

  private buildEventPlannerTemplateFillFromPlace(place: { title: string; subtitle?: string; footer?: string }): RecipeTemplateFill {
    return RecipeTemplateFillSchema.parse({
      kind: 'recipe_template_fill',
      schemaVersion: 'recipe_template_fill/v2',
      templateId: 'event-planner',
      title: `${place.title} event plan`,
      subtitle: 'Converted from Local Discovery Comparison',
      summary: `Continue planning around ${place.title} without losing the selected venue context.`,
      data: {
        eyebrow: 'Planning template',
        heroChips: [
          {
            label: 'Converted recipe',
            tone: 'accent'
          },
          {
            label: 'Venue preserved',
            tone: 'success'
          }
        ],
        activeTabId: 'venues',
        venueCards: [
          {
            id: 'migrated-selected-venue',
            title: place.title,
            subtitle: place.subtitle,
            footer: place.footer ?? 'Imported from Local Discovery Comparison.',
            chips: [
              {
                label: 'Selected venue',
                tone: 'success'
              }
            ],
            bullets: ['Carry this venue forward into booking, guest, and itinerary decisions.'],
            links: []
          }
        ],
        guestGroups: [
          {
            id: 'guest-group',
            label: 'Guests',
            items: [
              {
                id: 'guest-host',
                title: 'Event host',
                meta: 'Add guest details as planning continues.',
                chips: [],
                bullets: [],
                links: []
              }
            ]
          }
        ],
        checklistItems: [
          {
            id: 'check-confirm-booking',
            title: 'Confirm venue availability',
            checked: false
          },
          {
            id: 'check-send-invite',
            title: 'Draft guest invite',
            checked: false
          }
        ],
        itineraryItems: [
          {
            id: 'arrival',
            title: 'Venue arrival',
            time: '6:00 PM',
            summary: `Start with arrival and setup at ${place.title}.`,
            chips: [],
            links: []
          }
        ],
        noteLines: [`Imported venue: ${place.title}`]
      },
      metadata: {
        transitionSourceTemplateId: 'local-discovery-comparison'
      }
    });
  }

  private async emitTemplateActionComplete(
    session: Session,
    requestId: string,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void,
    content: string
  ) {
    const assistantMessage = this.options.database.appendMessage(
      ChatMessageSchema.parse({
        id: `message-${randomUUID()}`,
        sessionId: session.id,
        role: 'assistant',
        content,
        createdAt: this.now(),
        requestId,
        visibility: 'runtime',
        kind: 'technical'
      })
    );

    await onEvent({
      type: 'complete',
      session: this.options.database.getSession(session.id) ?? session,
      assistantMessage
    });
  }

  private validateRecipeActionSelection(
    action: RecipeActionDefinition,
    requestedSelectedItemIds: string[],
    selectedItems: RecipeNormalizedItem[]
  ) {
    if (requestedSelectedItemIds.length > 0 && selectedItems.length !== requestedSelectedItemIds.length) {
      throw new BridgeError(400, 'RECIPE_ACTION_SELECTION_INVALID', 'One or more selected items are no longer available in the current recipe.');
    }

    switch (action.visibility.requiresSelection) {
      case 'single':
        if (selectedItems.length !== 1) {
          throw new BridgeError(400, 'RECIPE_ACTION_SELECTION_REQUIRED', `Action ${action.label} requires exactly one selected item.`);
        }
        break;
      case 'one_or_more':
        if (selectedItems.length < 1) {
          throw new BridgeError(400, 'RECIPE_ACTION_SELECTION_REQUIRED', `Action ${action.label} requires one or more selected items.`);
        }
        break;
      case 'none':
        if (selectedItems.length > 0) {
          throw new BridgeError(400, 'RECIPE_ACTION_SELECTION_FORBIDDEN', `Action ${action.label} does not accept selected items.`);
        }
        break;
      case 'any':
      default:
        break;
    }
  }

  private buildPromptBoundRecipeActionContent(
    recipe: Recipe,
    context: RecipeActionArtifactContext,
    input: ExecuteRecipeActionRequest,
    selectedItems: RecipeNormalizedItem[]
  ) {
    const prompt = context.action.prompt;
    if (!prompt) {
      throw new BridgeError(400, 'RECIPE_ACTION_PROMPT_MISSING', `Action ${context.action.id} does not define a prompt contract.`);
    }

    const includeInputs = new Set(prompt.includeInputs);
    const sections: string[] = [];
    const appendSection = (label: string, value: string | null | undefined) => {
      if (!value || value.trim().length === 0) {
        return;
      }

      sections.push(`${label}:\n${value}`);
    };

    appendSection('Original user prompt', includeInputs.has('original_prompt') ? context.userPrompt.originalPrompt : null);
    appendSection(
      'Normalized intent',
      includeInputs.has('intent')
        ? this.serializeStructuredContext({
            category: context.intent.category,
            label: context.intent.label,
            summary: context.intent.summary,
            preferredPresentation: context.intent.preferredPresentation,
            query: context.intent.query,
            entities: context.intent.entities,
            filters: context.intent.filters,
            sort: context.intent.sort,
            updateTarget: context.intent.updateTarget
          })
        : null
    );
    appendSection(
      'Recipe summary',
      includeInputs.has('recipe_summary')
        ? this.serializeStructuredContext({
            title: context.summary?.title ?? recipe.title,
            subtitle: context.summary?.subtitle ?? recipe.description ?? null,
            statusLabel: context.summary?.statusLabel ?? recipe.status,
            note: context.summary?.note ?? null,
            stats: context.summary?.stats ?? [],
            links: context.summary?.links ?? []
          })
        : null
    );
    appendSection(
      'Raw data',
      includeInputs.has('raw_data')
        ? this.serializeStructuredContext(
            {
              payload: context.rawData.payload,
              links: context.rawData.links,
              paginationHints: context.rawData.paginationHints
            },
            6_000
          )
        : null
    );
    appendSection(
      'Normalized data',
      includeInputs.has('normalized_data')
        ? this.serializeStructuredContext(
            {
              primaryDatasetId: context.normalizedData.primaryDatasetId,
              datasets: context.normalizedData.datasets,
              summaryStats: context.normalizedData.summaryStats,
              notes: context.normalizedData.notes
            },
            6_000
          )
        : null
    );
    appendSection(
      'Selected items',
      includeInputs.has('selected_items') ? this.serializeStructuredContext(selectedItems, 3_500) : null
    );
    appendSection(
      'Page state',
      includeInputs.has('page_state') && Object.keys(input.pageState).length > 0 ? this.serializeStructuredContext(input.pageState) : null
    );
    appendSection(
      'Filter state',
      includeInputs.has('filter_state') && Object.keys(input.filterState).length > 0
        ? this.serializeStructuredContext(input.filterState)
        : null
    );
    appendSection(
      'Form values',
      includeInputs.has('form_values') && Object.keys(input.formValues).length > 0 ? this.serializeStructuredContext(input.formValues) : null
    );
    appendSection(
      'Assistant response context',
      includeInputs.has('assistant_context')
        ? this.serializeStructuredContext(
            {
              summary: context.assistantContext.summary,
              responseLead: context.assistantContext.responseLead,
              responseTail: context.assistantContext.responseTail,
              links: context.assistantContext.links,
              citations: context.assistantContext.citations
            },
            4_000
          )
        : null
    );

    const instructions = [
      prompt.promptTemplate,
      '',
      `This request was triggered from the attached Recipe action "${context.action.label}".`,
      `Recipe action id: ${context.action.id}`,
      `Current attached recipe: ${recipe.title}`,
      `Expected output contract: ${prompt.expectedOutput}.`,
      `Allowed mutations: ${prompt.allowedMutations.length > 0 ? prompt.allowedMutations.join(', ') : 'none'}.`,
      `Outbound requests allowed: ${prompt.outboundRequestsAllowed ? 'yes' : 'no'}.`,
      prompt.outboundRequestsAllowed
        ? null
        : 'Do not make outbound requests. Work only from the attached recipe context and supplied data.',
      context.action.kind === 'destructive' ? 'The user has already confirmed this destructive action.' : null,
      prompt.expectedOutput === 'recipe_delete'
        ? 'If deleting the current attached recipe is the correct result, emit exactly one legacy hermes-ui-recipes delete block.'
        : prompt.expectedOutput === 'assistant_only'
          ? 'Do not emit a hermes-recipe-data block unless the only safe way to answer is to leave the recipe unchanged.'
          : 'If you mutate the attached recipe, emit exactly one hermes-recipe-data block at the end of the final answer.',
      'Keep the conversational answer short, and do not include raw JSON outside fenced blocks.'
    ]
      .filter((value): value is string => Boolean(value))
      .join('\n');

    return [instructions, ...sections].join('\n\n').trim();
  }

  private resolveRecipeAppletManifest(recipe: Recipe) {
    return recipe.dynamic?.applet?.manifest ?? null;
  }

  private isRecipeActionBuildReady(recipe: Recipe) {
    return recipe.dynamic?.activeBuild?.phase === 'ready';
  }

  private resolveAsyncRecipeAppletTimeoutMs(_settings: ReturnType<BridgeDatabase['getSettings']>) {
    const configuredTimeoutMs = this.options.asyncRecipeAppletTimeoutMs ?? DEFAULT_ASYNC_WORKRECIPE_APPLET_TIMEOUT_MS;
    return Math.max(20_000, Math.min(configuredTimeoutMs, 900_000));
  }

  private resolveRecipePipelineSnapshot(
    requestId: string,
    recipe: Recipe,
    fallback: RecipePipelineState
  ): RecipePipelineState {
    return this.options.database.getRuntimeRequest(requestId)?.recipePipeline ?? recipe.metadata.recipePipeline ?? fallback;
  }

  private assertExperimentalRecipeAppletRuntimeEnabled() {
    if (EXPERIMENTAL_WORKRECIPE_APPLET_RUNTIME_ENABLED) {
      return;
    }

    throw new BridgeError(
      409,
      'RECIPE_EXPERIMENTAL_APPLET_RUNTIME_DISABLED',
      'Runtime TSX recipe applets are disabled in production. Hermes Home enrichment uses the DSL-only renderer path.'
    );
  }

  private async queueRecipeAppletBuild(input: QueuedRecipeAppletBuildInput): Promise<{
    build: RecipeBuild;
    pipeline: RecipePipelineState;
    recipe: Recipe;
  }> {
    const timestamp = this.now();
    const nextPipeline = updateRecipePipelineSegment(input.pipeline, 'applet', 'enrichment_generating', {
      status: 'running',
      stage: 'enrichment_generating',
      message: input.pipelineMessage,
      retryable: true,
      updatedAt: timestamp
    });
    let recipeWithPipeline = this.persistRecipePipeline(input.requestId, nextPipeline, input.currentRecipe) ?? input.currentRecipe;
    if (input.renderMode === 'dynamic_v1' && recipeWithPipeline.renderMode !== 'dynamic_v1') {
      recipeWithPipeline =
        this.options.database.updateRecipe(recipeWithPipeline.id, {
          profileId: recipeWithPipeline.profileId,
          renderMode: 'dynamic_v1'
        }) ?? recipeWithPipeline;
    }
    const build = this.options.database.startRecipeBuild({
      id: `recipe-build-${recipeWithPipeline.id}-${randomUUID()}`,
      recipeId: recipeWithPipeline.id,
      profileId: input.profile.id,
      sessionId: input.session.id,
      buildVersion: this.nextRecipeBuildVersion(recipeWithPipeline.id),
      buildKind: input.buildKind ?? 'dsl_enrichment',
      triggerKind:
        input.triggerKindOverride ??
        (input.requestMode === 'recipe_refresh'
          ? 'refresh'
          : input.triggerActionId
            ? 'action'
            : 'chat'),
      triggerRequestId: input.requestId,
      triggerActionId: input.triggerActionId ?? null,
      phase: 'queued',
      progressMessage: input.progressMessage,
      retryCount: input.retryCount ?? 0,
      startedAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
      errorCode: null,
      errorMessage: null,
      errorDetail: null,
      failureCategory: null,
      failureStage: null,
      userFacingMessage: null,
      retryable: true,
      configuredTimeoutMs: this.resolveAsyncRecipeAppletTimeoutMs(input.settings)
    });
    this.pendingRecipeEnrichmentRecipes.add(recipeWithPipeline.id);

    await this.emitRecipeBuildProgress(build, input.onEvent, input.progressMessage);
    await this.emitRecipePipelineStateEvent(
      recipeWithPipeline,
      input.session.id,
      input.onEvent,
      input.pipelineEventMessage,
      {
        buildPhase: build.phase,
        asyncEnrichment: true
      }
    );
    this.recordTelemetry({
      profileId: input.profile.id,
      sessionId: input.session.id,
      requestId: input.requestId,
      severity: 'info',
      category: 'recipes',
      code: input.telemetryCode,
      message: input.telemetryMessage,
      detail: input.telemetryDetail,
      payload: {
        recipeId: recipeWithPipeline.id,
        buildId: build.id,
        triggerKind: build.triggerKind,
        configuredTimeoutMs: build.configuredTimeoutMs
      },
      createdAt: timestamp
    });

    return {
      build,
      pipeline: nextPipeline,
      recipe: this.options.database.getRecipe(recipeWithPipeline.id) ?? recipeWithPipeline
    };
  }

  private enqueueRecipeAppletEnrichmentJob(input: RecipeAppletEnrichmentJobInput) {
    const currentQueue = this.recipeEnrichmentQueues.get(input.recipeId) ?? Promise.resolve();
    const nextQueue = currentQueue
      .catch(() => undefined)
      .then(async () => {
        try {
          if (input.kind === 'request') {
            await this.runQueuedRecipeAppletEnrichmentFromRequest(input);
            return;
          }

          await this.runQueuedRecipeAppletEnrichmentFromArtifacts(input);
        } catch (error) {
          const detail = error instanceof Error ? error.message : 'Recipe enrichment failed unexpectedly.';
          let pipelineStage: RecipePipelineStage | null = null;
          let buildPhase: RecipeBuild['phase'] | null = null;
          let finalizedFailureCategory: RecipeFailureCategory | null = null;
          try {
            const recipe = this.options.database.getRecipe(input.recipeId);
            const build = this.options.database.getRecipeBuild(input.buildId);
            pipelineStage = recipe?.metadata.recipePipeline?.currentStage ?? null;
            buildPhase = build?.phase ?? null;
            if (
              recipe &&
              build &&
              build.buildKind === 'template_enrichment' &&
              build.phase !== 'failed' &&
              build.phase !== 'ready'
            ) {
              const failureKind = this.resolveUnexpectedQueuedTemplateFailureKind(build.phase);
              const failure = this.classifyRecipeTemplateFailure({
                kind: failureKind,
                detail,
                settings: input.settings
              });
              finalizedFailureCategory = failure.category;
              await this.finalizeRecipeAppletBuildFailure({
                profile: input.profile,
                session: input.session,
                currentRecipe: recipe,
                requestId: input.requestId,
                requestPreview: input.requestPreview,
                build,
                pipeline: this.resolveRecipePipelineSnapshot(
                  input.requestId,
                  recipe,
                  input.kind === 'retry' ? createRecipeAppletRetryPipeline(this.now()) : createInitialRecipePipeline(this.now())
                ),
                onEvent: async () => undefined,
                failure,
                failureEvent: this.resolveUnexpectedQueuedTemplateFailureEvent(failureKind),
                detail,
                pipelineEventMessage: `Recipe generation failed for "${recipe.title}" because an unexpected bridge-side error interrupted the staged template pipeline.`
              });
              pipelineStage = this.options.database.getRecipe(input.recipeId)?.metadata.recipePipeline?.currentStage ?? pipelineStage;
            }
          } catch {
            pipelineStage = null;
          }

          try {
            this.recordTelemetry({
              profileId: input.profile.id,
              sessionId: input.session.id,
              requestId: input.requestId,
              severity: 'error',
              category: 'recipes',
              code:
                finalizedFailureCategory || buildPhase
                  ? 'RECIPE_TEMPLATE_ASYNC_JOB_FAILED'
                  : 'RECIPE_DSL_ASYNC_JOB_FAILED',
              message:
                finalizedFailureCategory || buildPhase
                  ? 'The async template recipe generation job failed unexpectedly.'
                  : 'The async recipe enrichment job failed unexpectedly.',
              detail,
              payload: {
                recipeId: input.recipeId,
                buildId: input.buildId,
                pipelineStage,
                buildPhase,
                finalizedFailureCategory
              }
            });
          } catch {
            // Ignore teardown races after the database has closed.
          }
        }
      })
      .finally(() => {
        this.pendingRecipeEnrichmentRecipes.delete(input.recipeId);
        if (this.recipeEnrichmentQueues.get(input.recipeId) === nextQueue) {
          this.recipeEnrichmentQueues.delete(input.recipeId);
        }
      });

    this.recipeEnrichmentQueues.set(input.recipeId, nextQueue);
  }

  async waitForRecipeEnrichmentQueues() {
    while (true) {
      // Allow request handlers that just emitted the terminal SSE event to enqueue the background job.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      let pendingQueues = [...this.recipeEnrichmentQueues.values()];
      if (pendingQueues.length === 0 && this.pendingRecipeEnrichmentRecipes.size === 0) {
        // Give the post-complete request handler a short idle window to enqueue the background build
        // before tests conclude that enrichment has fully settled.
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
        pendingQueues = [...this.recipeEnrichmentQueues.values()];
        if (pendingQueues.length === 0 && this.pendingRecipeEnrichmentRecipes.size === 0) {
          return;
        }
      }

      if (pendingQueues.length > 0) {
        await Promise.allSettled(pendingQueues);
      }
    }
  }

  private isRecipeEnrichmentSuperseded(recipeId: string, requestId: string) {
    const currentRecipe = this.options.database.getRecipe(recipeId);
    if (!currentRecipe) {
      return true;
    }

    const latestRequestId = currentRecipe.metadata.latestRecipeAttemptRequestId ?? null;
    const latestAttemptedAtMs =
      typeof currentRecipe.metadata.latestRecipeAttemptedAt === 'string'
        ? Date.parse(currentRecipe.metadata.latestRecipeAttemptedAt)
        : Number.NaN;
    const activeEnrichmentBuild =
      currentRecipe.dynamic?.activeBuild &&
      (currentRecipe.dynamic.activeBuild.buildKind === 'dsl_enrichment' ||
        currentRecipe.dynamic.activeBuild.buildKind === 'template_enrichment')
        ? currentRecipe.dynamic.activeBuild
        : null;
    const activeEnrichmentRequestId = activeEnrichmentBuild?.triggerRequestId ?? null;
    const activeEnrichmentStartedAtMs = activeEnrichmentBuild?.startedAt
      ? Date.parse(activeEnrichmentBuild.startedAt)
      : Number.NaN;

    if (activeEnrichmentRequestId && activeEnrichmentRequestId !== requestId) {
      return true;
    }

    if (!latestRequestId || latestRequestId === requestId) {
      return false;
    }

    if (!activeEnrichmentRequestId) {
      return true;
    }

    if (activeEnrichmentRequestId === requestId) {
      if (Number.isFinite(latestAttemptedAtMs) && Number.isFinite(activeEnrichmentStartedAtMs)) {
        return latestAttemptedAtMs > activeEnrichmentStartedAtMs;
      }

      return false;
    }

    return true;
  }

  private async markRecipeEnrichmentSuperseded(input: {
    profile: Profile;
    session: Session;
    requestId: string;
    requestPreview: string;
    recipeId: string;
    build: RecipeBuild;
  }) {
    const detail = 'A newer Home recipe baseline superseded this background enrichment job before promotion.';
    await this.advanceRecipeBuild(input.build, input.requestPreview, async () => undefined, {
      phase: 'failed',
      progressMessage: 'Skipped stale background recipe enrichment.',
      errorCode: 'RECIPE_DSL_BUILD_SUPERSEDED',
      errorMessage: 'The async recipe enrichment job was superseded by a newer baseline update.',
      errorDetail: detail,
      completed: true,
      failureCategory: 'unknown',
      failureStage: 'enrichment_failed',
      userFacingMessage: 'A newer Home recipe update replaced this background enrichment attempt before it could be promoted.',
      retryable: true,
      configuredTimeoutMs: input.build.configuredTimeoutMs ?? null
    });
    this.recordTelemetry({
      profileId: input.profile.id,
      sessionId: input.session.id,
      requestId: input.requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_DSL_BUILD_SUPERSEDED',
      message: 'Skipped a stale async recipe enrichment job after a newer Home baseline update.',
      detail,
      payload: {
        recipeId: input.recipeId,
        buildId: input.build.id
      }
    });
  }

  private async executeRecipeAppletCapabilityAction(
    profileId: string,
    sessionId: string,
    recipe: Recipe,
    context: RecipeActionArtifactContext,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void
  ) {
    this.assertExperimentalRecipeAppletRuntimeEnabled();

    const capabilityId = context.action.bridge?.capabilityId?.trim() ?? '';
    if (!capabilityId) {
      throw new BridgeError(400, 'RECIPE_APPLET_CAPABILITY_MISSING', `Action ${context.action.id} is missing its applet capability id.`);
    }

    const manifest = this.resolveRecipeAppletManifest(recipe);
    if (!manifest) {
      throw new BridgeError(409, 'RECIPE_APPLET_MANIFEST_MISSING', 'The active recipe applet manifest is unavailable.');
    }

    const capability = manifest.requestedCapabilities.find((item) => item.id === capabilityId);
    if (!capability) {
      throw new BridgeError(404, 'RECIPE_APPLET_CAPABILITY_UNKNOWN', `Capability ${capabilityId} is not declared by the active recipe applet.`);
    }

    if (capability.requiresConfirmation && !context.action.confirmation) {
      throw new BridgeError(400, 'RECIPE_APPLET_CAPABILITY_CONFIRMATION_MISSING', `Capability ${capabilityId} requires confirmation.`);
    }

    if (capability.kind === 'refresh_space') {
      await this.streamHermesRequest(
        {
          profileId,
          sessionId,
          recipeId: recipe.id,
          transcriptContent: 'Refresh the attached recipe.',
          hermesContent: RECIPE_REFRESH_USER_MESSAGE,
          intentContent: context.userPrompt.originalPrompt,
          mode: 'recipe_refresh',
          triggerActionId: context.action.id,
          triggerKindOverride: 'refresh'
        },
        onEvent
      );
      return;
    }

    if (capability.kind === 'approved_api') {
      const operation =
        typeof capability.metadata.operation === 'string'
          ? capability.metadata.operation
          : typeof context.action.bridge?.payload.operation === 'string'
            ? String(context.action.bridge.payload.operation)
            : '';

      if (operation === 'retry_build') {
        await this.retryRecipeAppletUpgradeFromArtifacts(profileId, sessionId, recipe, context.action.id, onEvent);
        return;
      }

      if (operation === 'refresh_space') {
        await this.streamHermesRequest(
          {
            profileId,
            sessionId,
            recipeId: recipe.id,
            transcriptContent: 'Refresh the attached recipe.',
            hermesContent: RECIPE_REFRESH_USER_MESSAGE,
            intentContent: context.userPrompt.originalPrompt,
            mode: 'recipe_refresh',
            triggerActionId: context.action.id,
            triggerKindOverride: 'refresh'
          },
          onEvent
        );
        return;
      }

      throw new BridgeError(
        400,
        'RECIPE_APPLET_CAPABILITY_UNSUPPORTED',
        `Approved applet capability ${capabilityId} requested unsupported operation ${operation || 'unknown'}.`
      );
    }

    throw new BridgeError(
      400,
      'RECIPE_APPLET_CAPABILITY_UNSUPPORTED',
      `Applet capability ${capabilityId} with kind ${capability.kind} is not executable by the bridge.`
    );
  }

  private async retryRecipeAppletUpgradeFromArtifacts(
    profileId: string,
    sessionId: string,
    recipe: Recipe,
    triggerActionId: string | null,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void
  ) {
    const profile = await this.ensureProfile(profileId);
    const session = this.ensureScopedSession(profile.id, sessionId);
    const settings = this.options.database.getSettings();
    const requestId = `request-${randomUUID()}`;
    const startedAt = this.now();
    const useTemplateRetry =
      Boolean(recipe.dynamic?.recipeTemplate) ||
      recipe.metadata.activeTemplateId !== undefined ||
      this.options.database
        .listRecipeBuilds(recipe.id, { limit: 6 })
        .some((build) => build.buildKind === 'template_enrichment');
    const requestPreview = useTemplateRetry
      ? 'Rebuild recipe from persisted Home artifacts.'
      : 'Retry recipe enrichment from persisted Home artifacts.';

    this.ensurePersistedRuntimeRequest(profile.id, session.id, requestId, requestPreview, startedAt);
    this.appendPersistedRuntimeActivity(profile.id, session.id, requestId, requestPreview, {
      kind: 'status',
      state: 'started',
      label: useTemplateRetry ? 'Recipe generation' : 'Recipe enrichment',
      detail: useTemplateRetry
        ? 'Queueing a background recipe generation retry from persisted Home artifacts only.'
        : 'Queueing a background recipe enrichment retry from persisted Home artifacts only.',
      requestId,
      timestamp: startedAt
    });

    let pipeline = createRecipeAppletRetryPipeline(startedAt);
    let activeRecipe = this.persistRecipePipeline(requestId, pipeline, recipe) ?? recipe;
    let queuedRecipeEnrichmentJob: RecipeAppletEnrichmentJobInput | null = null;

    await this.emitRecipePipelineStateEvent(
      activeRecipe,
      session.id,
      onEvent,
      useTemplateRetry
        ? `Queueing background recipe generation for "${activeRecipe.title}" from persisted Home artifacts without rerunning the original task.`
        : `Queueing background recipe enrichment for "${activeRecipe.title}" from persisted Home artifacts without rerunning the original task.`,
      {
        enrichmentStatus: 'running'
      }
    );

    try {
      const dslContext = !useTemplateRetry ? this.resolveRecipeAppletArtifactContext(activeRecipe) : null;
      const templateContext = useTemplateRetry ? this.resolveRecipeTemplateArtifactContext(activeRecipe) : null;
      const queuedBuild = await this.queueRecipeAppletBuild({
        profile,
        session,
        currentRecipe: activeRecipe,
        requestId,
        requestPreview,
        requestMode: 'chat',
        settings,
        pipeline,
        triggerActionId,
        triggerKindOverride: 'retry',
        retryCount: 1,
        onEvent,
        progressMessage: useTemplateRetry ? 'Queued recipe generation retry…' : 'Queued recipe enrichment retry…',
        pipelineMessage: useTemplateRetry
          ? 'Recipe generation retry is queued and running in the background from persisted Home artifacts.'
          : 'Recipe enrichment retry is queued and running in the background from persisted Home artifacts.',
        pipelineEventMessage: useTemplateRetry
          ? `Hermes queued a background recipe generation retry for "${activeRecipe.title}" from persisted Home artifacts.`
          : `Hermes queued a background recipe enrichment retry for "${activeRecipe.title}" from persisted Home artifacts.`,
        telemetryCode: useTemplateRetry ? 'RECIPE_TEMPLATE_ENRICHMENT_QUEUED' : 'RECIPE_DSL_ENRICHMENT_QUEUED',
        telemetryMessage: useTemplateRetry
          ? 'Queued an async recipe generation retry from persisted artifacts.'
          : 'Queued an async recipe enrichment retry from persisted artifacts.',
        telemetryDetail: useTemplateRetry
          ? 'The retry request completed immediately while the template recipe rebuilds in the background.'
          : 'The retry request completed immediately while richer recipe UI rebuilds in the background.',
        buildKind: useTemplateRetry ? 'template_enrichment' : 'dsl_enrichment',
        renderMode: useTemplateRetry ? 'dynamic_v1' : undefined
      });
      activeRecipe = queuedBuild.recipe;
      pipeline = queuedBuild.pipeline;
      if (templateContext) {
        this.persistRecipeTemplateBaseArtifacts(queuedBuild.build, templateContext, startedAt);
      } else if (dslContext) {
        this.persistRecipeAppletBaseArtifacts(queuedBuild.build, dslContext, startedAt);
      }
      queuedRecipeEnrichmentJob = {
        kind: 'retry',
        profile,
        session,
        recipeId: activeRecipe.id,
        requestId,
        requestPreview,
        settings,
        buildId: queuedBuild.build.id,
        triggerActionId,
        triggerKindOverride: 'retry'
      };
    } catch (error) {
      const detail =
        error instanceof BridgeError && (error.code === 'RECIPE_DSL_CONTEXT_MISSING' || error.code === 'RECIPE_TEMPLATE_CONTEXT_MISSING')
          ? error.message
          : error instanceof Error
            ? error.message
            : 'The persisted recipe enrichment context was invalid.';
      const failure = useTemplateRetry
        ? this.classifyRecipeTemplateFailure({
            kind: 'validation',
            detail,
            settings,
            failureReason: 'context_invalid'
          })
        : this.classifyRecipeDslFailure({
            kind: 'context',
            detail,
            settings,
            failureReason: 'context_invalid'
          });
      const failureEvent = useTemplateRetry
        ? {
            code: 'RECIPE_TEMPLATE_CONTEXT_INVALID',
            message: 'Recipe generation could not start because the artifact-only template context was invalid.'
          }
        : this.resolveRecipeDslFailureEvent(
            failure,
            'RECIPE_WORKRECIPE_DSL_CONTEXT_INVALID',
            'Recipe enrichment could not start because the artifact-only context was invalid.'
          );
      const queuedBuild = await this.queueRecipeAppletBuild({
        profile,
        session,
        currentRecipe: activeRecipe,
        requestId,
        requestPreview,
        requestMode: 'chat',
        settings,
        pipeline,
        onEvent,
        triggerActionId,
        triggerKindOverride: 'retry',
        retryCount: 1,
        progressMessage: useTemplateRetry ? 'Queued recipe generation retry…' : 'Queued recipe enrichment retry…',
        pipelineMessage: useTemplateRetry
          ? 'Recipe generation retry could not start because the persisted template context was invalid.'
          : 'Recipe enrichment retry could not start because the persisted enrichment context was invalid.',
        pipelineEventMessage: useTemplateRetry
          ? `Queueing the recipe generation retry for "${activeRecipe.title}" failed immediately because the artifact-only template context was invalid.`
          : `Queueing the recipe enrichment retry for "${activeRecipe.title}" failed immediately because the artifact-only context was invalid.`,
        telemetryCode: useTemplateRetry ? 'RECIPE_TEMPLATE_ENRICHMENT_QUEUED' : 'RECIPE_DSL_ENRICHMENT_QUEUED',
        telemetryMessage: useTemplateRetry
          ? 'Queued an async recipe generation retry from persisted artifacts.'
          : 'Queued an async recipe enrichment retry from persisted artifacts.',
        telemetryDetail: useTemplateRetry
          ? 'The retry request completed immediately while the bridge validated the persisted template context.'
          : 'The retry request completed immediately while the bridge validated the persisted enrichment context.',
        buildKind: useTemplateRetry ? 'template_enrichment' : 'dsl_enrichment',
        renderMode: useTemplateRetry ? 'dynamic_v1' : undefined
      });
      activeRecipe = queuedBuild.recipe;
      pipeline = queuedBuild.pipeline;
      const failed = await this.finalizeRecipeAppletBuildFailure({
        profile,
        session,
        currentRecipe: activeRecipe,
        requestId,
        requestPreview,
        build: queuedBuild.build,
        pipeline,
        onEvent,
        failure,
        failureEvent,
        detail,
        pipelineEventMessage: useTemplateRetry
          ? `Recipe generation failed for "${activeRecipe.title}" because the artifact-only template retry context was invalid.`
          : `Hermes kept the baseline Home recipe for "${activeRecipe.title}" because the artifact-only enrichment retry context was invalid.`
      });
      activeRecipe = failed.recipe;
      pipeline = failed.pipeline;
    }

    if (queuedRecipeEnrichmentJob) {
      try {
        await this.runQueuedRecipeAppletEnrichmentFromArtifacts(queuedRecipeEnrichmentJob, onEvent);
      } finally {
        this.pendingRecipeEnrichmentRecipes.delete(queuedRecipeEnrichmentJob.recipeId);
      }
      activeRecipe = this.options.database.getRecipe(activeRecipe.id) ?? activeRecipe;
      pipeline = this.resolveRecipePipelineSnapshot(requestId, activeRecipe, pipeline);
    }

    const completionAt = this.now();
    const completionContent =
      queuedRecipeEnrichmentJob
        ? pipeline.applet.message ??
          (useTemplateRetry
            ? 'Recipe generation retry completed from persisted Home artifacts.'
            : 'Recipe enrichment retry completed from persisted Home artifacts.')
        : pipeline.applet.message ??
          'The Home recipe baseline remained active after the artifact-only enrichment retry.';
    const completionMessage = this.options.database.appendMessage(
      ChatMessageSchema.parse({
        id: `message-${randomUUID()}`,
        sessionId: session.id,
        role: 'system',
        content: completionContent,
        createdAt: completionAt,
        status: pipeline.applet.status === 'failed' ? 'error' : 'completed',
        requestId,
        visibility: 'runtime',
        kind: 'notice'
      })
    );

    this.options.database.markSessionMessagesSynced(session.id, completionMessage.createdAt);
    this.appendPersistedRuntimeActivity(profile.id, session.id, requestId, requestPreview, {
      kind: 'status',
      state: 'completed',
      label: 'Runtime status',
      detail:
        queuedRecipeEnrichmentJob
          ? 'Recipe enrichment retry completed from persisted artifacts.'
          : 'Recipe enrichment retry finished with the Home baseline still active.',
      requestId,
      timestamp: completionMessage.createdAt
    });
    this.finalizePersistedRuntimeRequest(profile.id, session.id, requestId, requestPreview, 'completed', completionMessage.createdAt);

    await onEvent({
      type: 'complete',
      session: this.options.database.getSession(session.id) ?? session,
      assistantMessage: completionMessage
    });
  }

  private ensurePersistedRuntimeRequest(
    profileId: string,
    sessionId: string,
    requestId: string,
    preview: string,
    startedAt: string
  ) {
    return this.options.database.ensureRuntimeRequest({
      requestId,
      sessionId,
      profileId,
      preview,
      startedAt,
      status: 'running'
    });
  }

  private appendPersistedRuntimeActivity(
    profileId: string,
    sessionId: string,
    requestId: string,
    preview: string,
    activity: ChatActivity
  ) {
    return this.options.database.appendRuntimeActivity(requestId, sessionId, profileId, activity, {
      preview
    });
  }

  private finalizePersistedRuntimeRequest(
    profileId: string,
    sessionId: string,
    requestId: string,
    preview: string,
    status: RuntimeRequest['status'],
    timestamp: string,
    lastError?: string
  ) {
    return this.options.database.upsertRuntimeRequestStatus(requestId, status, timestamp, {
      profileId,
      sessionId,
      preview,
      lastError
    });
  }

  private backfillRuntimeRequestsFromMessages(profileId: string, sessionId: string, messages: ChatMessage[]) {
    const orderedMessages = [...messages].sort((left, right) => left.createdAt.localeCompare(right.createdAt));

    for (const message of orderedMessages) {
      const requestId = message.requestId;
      if (!requestId) {
        continue;
      }

      this.options.database.ensureRuntimeRequest({
        requestId,
        sessionId,
        profileId,
        preview: message.role === 'user' ? this.normalizeRequestPreview(message.content) : 'Hermes request',
        startedAt: message.createdAt,
        status: message.role === 'assistant' ? (message.status === 'error' ? 'failed' : 'completed') : 'running'
      });

      const runtimeActivity = buildRuntimeActivityFromMessage(message);
      if (runtimeActivity) {
        this.options.database.appendRuntimeActivity(requestId, sessionId, profileId, runtimeActivity, {
          preview: message.role === 'user' ? this.normalizeRequestPreview(message.content) : 'Hermes request'
        });
      }

      if (message.role === 'assistant') {
        this.options.database.upsertRuntimeRequestStatus(requestId, message.status === 'error' ? 'failed' : 'completed', message.createdAt, {
          profileId,
          sessionId
        });
      } else if (message.role === 'system' && message.status === 'error') {
        this.options.database.upsertRuntimeRequestStatus(requestId, 'failed', message.createdAt, {
          profileId,
          sessionId,
          lastError: message.content
        });
      }
    }

    const runtimeRequests = this.options.database.listRuntimeRequests(sessionId);
    for (let index = 0; index < runtimeRequests.length - 1; index += 1) {
      const request = runtimeRequests[index];
      const nextRequest = runtimeRequests[index + 1];
      if (request.status === 'running' && nextRequest) {
        this.options.database.upsertRuntimeRequestStatus(request.requestId, 'cancelled', nextRequest.startedAt, {
          profileId,
          sessionId,
          lastError: request.lastError
        });
      }
    }
  }

  private buildImportedRequestAliasMap(messages: ChatMessage[], runtimeRequests: RuntimeRequest[]) {
    const importedTranscriptRequests = messages
      .filter(
        (message) =>
          message.role === 'user' &&
          message.visibility === 'transcript' &&
          typeof message.requestId === 'string' &&
          message.requestId.startsWith('imported-')
      )
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    const candidateRequests = runtimeRequests.filter((request) => !request.requestId.startsWith('imported-'));
    if (importedTranscriptRequests.length === 0 || candidateRequests.length === 0) {
      return new Map<string, string>();
    }

    const normalizedPreview = (value: string) => this.normalizeRequestPreview(value);
    const usedTargetIds = new Set<string>();
    const aliases = new Map<string, string>();
    let targetCursor = 0;

    const findCandidateIndex = (preview: string) => {
      for (let index = targetCursor; index < candidateRequests.length; index += 1) {
        const candidate = candidateRequests[index];
        if (!usedTargetIds.has(candidate.requestId) && normalizedPreview(candidate.preview) === preview) {
          return index;
        }
      }

      for (let index = 0; index < targetCursor; index += 1) {
        const candidate = candidateRequests[index];
        if (!usedTargetIds.has(candidate.requestId) && normalizedPreview(candidate.preview) === preview) {
          return index;
        }
      }

      for (let index = targetCursor; index < candidateRequests.length; index += 1) {
        if (!usedTargetIds.has(candidateRequests[index].requestId)) {
          return index;
        }
      }

      for (let index = 0; index < targetCursor; index += 1) {
        if (!usedTargetIds.has(candidateRequests[index].requestId)) {
          return index;
        }
      }

      return -1;
    };

    for (const message of importedTranscriptRequests) {
      const importedRequestId = message.requestId;
      if (!importedRequestId || aliases.has(importedRequestId)) {
        continue;
      }

      const matchIndex = findCandidateIndex(normalizedPreview(message.content));
      if (matchIndex < 0) {
        continue;
      }

      const targetRequest = candidateRequests[matchIndex];
      if (!targetRequest || targetRequest.requestId === importedRequestId) {
        continue;
      }

      aliases.set(importedRequestId, targetRequest.requestId);
      usedTargetIds.add(targetRequest.requestId);
      targetCursor = matchIndex + 1;
    }

    return aliases;
  }

  private remapMessageRequestIds(messages: ChatMessage[], aliases: Map<string, string>) {
    let changed = false;
    const remappedMessages = messages.map((message) => {
      const requestId = message.requestId;
      if (!requestId) {
        return message;
      }

      const aliasedRequestId = aliases.get(requestId);
      if (!aliasedRequestId || aliasedRequestId === requestId) {
        return message;
      }

      changed = true;
      return {
        ...message,
        requestId: aliasedRequestId
      };
    });

    return {
      changed,
      messages: remappedMessages
    };
  }

  private normalizeSessionMessages(profileId: string, sessionId: string, syncedAt?: string | null) {
    const normalized = normalizePersistedSessionMessages(this.options.database.listMessages(sessionId));
    if (normalized.changed) {
      this.options.database.replaceSessionMessages(sessionId, normalized.messages, syncedAt ?? this.now());
      this.recordTelemetry({
        profileId,
        sessionId,
        requestId: null,
        severity: 'info',
        category: 'transcript',
        code: 'SESSION_TRANSCRIPT_NORMALIZED',
        message: `Normalized persisted transcript metadata for ${sessionId}.`,
        detail: 'Updated stored request ids, transcript visibility, and technical/runtime classification for a session.',
        payload: {
          messageCount: normalized.messages.length
        }
      });
    }

    let sessionMessages = normalized.changed ? this.options.database.listMessages(sessionId) : normalized.messages;
    let runtimeRequests = this.options.database.listRuntimeRequests(sessionId);

    const importedRequestAliases = this.buildImportedRequestAliasMap(sessionMessages, runtimeRequests);
    if (importedRequestAliases.size > 0) {
      const remappedMessages = this.remapMessageRequestIds(sessionMessages, importedRequestAliases);
      if (remappedMessages.changed) {
        this.options.database.replaceSessionMessages(sessionId, remappedMessages.messages, syncedAt ?? this.now());
      }
      for (const [sourceRequestId, targetRequestId] of importedRequestAliases.entries()) {
        this.options.database.mergeRuntimeRequests(sourceRequestId, targetRequestId);
      }
      this.recordTelemetry({
        profileId,
        sessionId,
        requestId: null,
        severity: 'info',
        category: 'transcript',
        code: 'SESSION_REQUESTS_RECONCILED',
        message: `Reconciled imported request ids for ${sessionId}.`,
        detail: 'Aligned transcript-imported request ids with existing persisted runtime requests to avoid duplicate runtime buckets.',
        payload: {
          aliasCount: importedRequestAliases.size
        }
      });
      sessionMessages = this.options.database.listMessages(sessionId);
      runtimeRequests = this.options.database.listRuntimeRequests(sessionId);
    }

    const existingRuntimeRequestIds = new Set(runtimeRequests.map((request) => request.requestId));
    const missingRequestMessages = sessionMessages.filter(
      (message) => message.requestId && !existingRuntimeRequestIds.has(message.requestId)
    );

    if (missingRequestMessages.length > 0) {
      this.backfillRuntimeRequestsFromMessages(profileId, sessionId, missingRequestMessages);
      runtimeRequests = this.options.database.listRuntimeRequests(sessionId);
    }

    return {
      messages: sessionMessages,
      runtimeRequests
    };
  }

  private candidateSkillSummaryFiles(profile: Pick<Profile, 'path'>, skill: { name: string; category: string }) {
    const sharedHermesRoot = path.join(os.homedir(), '.hermes');
    const profileRoot = profile.path ?? sharedHermesRoot;
    const parentRoot = profile.path ? path.dirname(profile.path) : sharedHermesRoot;
    const category = skill.category.trim();

    return Array.from(
      new Set(
        [
          path.join(profileRoot, 'skills', skill.name, 'SKILL.md'),
          category ? path.join(profileRoot, 'skills', category, skill.name, 'SKILL.md') : null,
          path.join(parentRoot, 'skills', skill.name, 'SKILL.md'),
          category ? path.join(parentRoot, 'skills', category, skill.name, 'SKILL.md') : null,
          path.join(sharedHermesRoot, 'skills', skill.name, 'SKILL.md'),
          category ? path.join(sharedHermesRoot, 'skills', category, skill.name, 'SKILL.md') : null,
          path.join(sharedHermesRoot, 'skills', '.system', skill.name, 'SKILL.md'),
          category ? path.join(sharedHermesRoot, 'skills', '.system', category, skill.name, 'SKILL.md') : null
        ].filter((candidate): candidate is string => Boolean(candidate))
      )
    );
  }

  private generateSkillSummary(profile: Profile, skill: { name: string; category: string }) {
    const stopWords = new Set([
      'a',
      'ai',
      'an',
      'and',
      'for',
      'hermes',
      'local',
      'of',
      'or',
      'skill',
      'skills',
      'the',
      'to',
      'with'
    ]);
    const phrases: string[] = [];
    const addPhrase = (phrase: string) => {
      const normalized = phrase
        .trim()
        .replace(/[`*_]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/^[^a-z0-9]+|[^a-z0-9]+$/giu, '')
        .toLowerCase();
      if (!normalized || stopWords.has(normalized)) {
        return;
      }
      if (!phrases.includes(normalized)) {
        phrases.push(normalized);
      }
    };

    const skillFiles = this.candidateSkillSummaryFiles(profile, skill);
    for (const filePath of skillFiles) {
      if (!fs.existsSync(filePath)) {
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      for (const match of content.matchAll(/`([^`]{2,40})`/gu)) {
        addPhrase(match[1]);
        if (phrases.length >= 4) {
          break;
        }
      }
      if (phrases.length >= 4) {
        break;
      }

      const paragraphMatches = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('```'));
      for (const line of paragraphMatches.slice(0, 8)) {
        const fragments = line
          .split(/[,.]/u)
          .map((fragment) => fragment.trim())
          .filter(Boolean);
        for (const fragment of fragments) {
          const words = fragment
            .split(/[^a-z0-9]+/iu)
            .map((word) => word.trim())
            .filter((word) => word.length > 2 && !stopWords.has(word.toLowerCase()));
          if (words.length === 0) {
            continue;
          }
          addPhrase(words.slice(0, 3).join(' '));
          if (phrases.length >= 4) {
            break;
          }
        }
        if (phrases.length >= 4) {
          break;
        }
      }
      if (phrases.length >= 4) {
        break;
      }
    }

    if (phrases.length === 0) {
      skill.name
        .split(/[^a-z0-9]+/iu)
        .filter((word) => word.length > 2)
        .forEach((word) => addPhrase(word));
      skill.category
        .split(/[^a-z0-9]+/iu)
        .filter((word) => word.length > 2)
        .forEach((word) => addPhrase(word));
    }

    const summaryParts: string[] = [];
    let wordCount = 0;
    for (const phrase of phrases) {
      const nextWordCount = phrase.split(/\s+/u).length;
      if (summaryParts.length > 0 && wordCount + nextWordCount > 10) {
        break;
      }
      if (summaryParts.length === 0 && nextWordCount > 10) {
        summaryParts.push(phrase.split(/\s+/u).slice(0, 10).join(' '));
        break;
      }

      summaryParts.push(phrase);
      wordCount += nextWordCount;
      if (summaryParts.length >= 4) {
        break;
      }
    }

    return summaryParts.join(', ').slice(0, 120);
  }

  getHealth() {
    return {
      status: 'ok' as const,
      checkedAt: this.now()
    };
  }

  private resolveActiveProfileId() {
    const profiles = this.options.database.listProfiles();
    const uiState = this.options.database.getUiState();

    return (
      (uiState.activeProfileId && profiles.some((profile) => profile.id === uiState.activeProfileId) ? uiState.activeProfileId : null) ??
      profiles.find((profile) => profile.isActive)?.id ??
      profiles[0]?.id ??
      null
    );
  }

  private resolveCachedBootstrap(detail: string | undefined): BootstrapResponse {
    const profiles = this.options.database.listProfiles();
    const uiState = this.options.database.getUiState();
    const settings = this.options.database.getSettings();
    const activeProfileId = this.resolveActiveProfileId();
    const activeSessionId = this.options.database.getActiveSessionId(activeProfileId);

    return {
      connection: {
        status: profiles.length > 0 ? 'degraded' : 'error',
        detail,
        checkedAt: this.now(),
        usingCachedData: true
      },
      profiles,
      activeProfileId,
      activeSessionId,
      recentSessions: activeProfileId ? this.options.database.listRecentSessions(activeProfileId, 5) : [],
      sessionSummary: activeProfileId ? this.options.database.getSessionSummary(activeProfileId, 5) : null,
      settings,
      uiState,
      hermesVersion: null,
      expectedHermesVersion: HERMES_EXPECTED_VERSION
    };
  }

  async syncProfilesAndSessions(targetProfileId?: string | null) {
    const timestamp = this.now();

    try {
      const profiles = await this.options.hermesCli.listProfiles();
      const syncedProfiles = this.options.database.syncProfiles(profiles, timestamp);
      const profilesToSync =
        targetProfileId && syncedProfiles.some((profile) => profile.id === targetProfileId)
          ? syncedProfiles.filter((profile) => profile.id === targetProfileId)
          : syncedProfiles;

      for (const profile of profilesToSync) {
        const sessions = await this.options.hermesCli.listSessions(profile, 500);
        this.options.database.syncSessions(profile.id, sessions, timestamp);
      }

      return {
        status: 'connected' as const,
        detail: undefined,
        checkedAt: timestamp,
        usingCachedData: false
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Hermes bridge bootstrap failed.';
      const cached = this.resolveCachedBootstrap(detail);
      if (cached.profiles.length === 0 && cached.recentSessions.length === 0) {
        throw new BridgeError(503, 'HERMES_UNAVAILABLE', detail);
      }

      return cached.connection;
    }
  }

  private async ensureProfile(profileId: string) {
    let profile = this.options.database.getProfile(profileId);
    if (profile) {
      return profile;
    }

    await this.syncProfilesAndSessions(profileId);
    profile = this.options.database.getProfile(profileId);
    if (!profile) {
      throw new BridgeError(404, 'PROFILE_NOT_FOUND', `Profile ${profileId} was not found.`);
    }

    return profile;
  }

  private ensureScopedSession(profileId: string, sessionId: string) {
    const session = this.options.database.getSession(sessionId);
    if (!session) {
      throw new BridgeError(404, 'SESSION_NOT_FOUND', `Session ${sessionId} was not found.`);
    }

    if (!this.options.database.isSessionAssociatedWithProfile(sessionId, profileId)) {
      throw new BridgeError(404, 'SESSION_PROFILE_MISMATCH', `Session ${sessionId} is not available for profile ${profileId}.`);
    }

    return session;
  }

  private ensureRecipe(profileId: string, recipeId: string) {
    const recipe = this.options.database.getRecipe(recipeId);
    if (!recipe || recipe.profileId !== profileId) {
      throw new BridgeError(404, 'RECIPE_NOT_FOUND', `Recipe ${recipeId} is not available for profile ${profileId}.`);
    }

    return recipe;
  }

  private resolveRecipeTarget(
    profileId: string,
    currentRecipeId: string | null,
    operation: HermesRecipeTargetOperation
  ) {
    const resolvedRecipeId = operation.recipeId ?? (operation.target === 'current' ? currentRecipeId : null);
    if (!resolvedRecipeId) {
      throw new BridgeError(400, 'RECIPE_REQUIRED', 'The Hermes recipe operation requires a recipe target.');
    }

    return this.ensureRecipe(profileId, resolvedRecipeId);
  }

  private createRecipeEvent(
    recipe: Pick<Recipe, 'id' | 'profileId' | 'title'>,
    type: 'created' | 'updated' | 'renamed' | 'deleted' | 'changed' | 'linked_chat',
    message: string,
    source: Recipe['source'],
    sessionId: string | null,
    metadata: Record<string, unknown> = {}
  ) {
    return this.options.database.appendRecipeEvent({
      id: `recipe-event-${randomUUID()}`,
      profileId: recipe.profileId,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      type,
      message,
      source,
      sessionId,
      createdAt: this.now(),
      metadata
    });
  }

  private buildRecipeChatContext(recipe: Recipe) {
    const contentTab = getRecipeContentTab(recipe);
    const dataSnapshot = JSON.stringify(
      {
        activeTab: recipe.uiState.activeTab,
        content: {
          activeView: contentTab.content.activeView,
          markdownRepresentation: contentTab.content.markdownRepresentation,
          tableRepresentation: contentTab.content.tableRepresentation,
          cardRepresentation: contentTab.content.cardRepresentation
        }
      },
      null,
      2
    );
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      contentFormat: contentTab.content.activeView,
      status: recipe.status,
      metadata: recipe.metadata,
      data: dataSnapshot.length > 8_000 ? `${dataSnapshot.slice(0, 7_900)}\n...` : dataSnapshot
    };
  }

  private buildRecipeRefreshContext(sessionId: string, recipe: Recipe) {
    const metadataPrompt = recipe.metadata.refreshPrompt?.trim();
    if (metadataPrompt) {
      return {
        intentPrompt: metadataPrompt,
        source: 'recipe_metadata' as const
      };
    }

    const transcriptUserMessages = this.options.database
      .listMessages(sessionId)
      .filter((message) => message.role === 'user' && message.visibility === 'transcript')
      .filter((message) => !isSyntheticRecipeRefreshMessage(message.content))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

    const latestRecipeEvent = this.options.database
      .listRecipeEvents(recipe.profileId, {
        limit: 50,
        recipeId: recipe.id
      })
      .filter((event) => event.type !== 'linked_chat' && event.type !== 'deleted')
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    if (latestRecipeEvent) {
      const anchorPrompt = [...transcriptUserMessages]
        .reverse()
        .find((message) => message.createdAt <= latestRecipeEvent.createdAt)
        ?.content.trim();
      if (anchorPrompt) {
        return {
          intentPrompt: anchorPrompt,
          source: 'recipe_event' as const
        };
      }
    }

    const sessionPrompt = transcriptUserMessages.at(-1)?.content.trim();
    if (sessionPrompt) {
      return {
        intentPrompt: sessionPrompt,
        source: 'session_history' as const
      };
    }

    return {
      intentPrompt: `Refresh the attached recipe "${recipe.title}" with updated results and preserve the current scope.`,
      source: 'recipe_snapshot' as const
    };
  }

  private normalizeRecipeTabsForMutation(
    input: Parameters<typeof normalizeRecipeTabsForInput>[0],
    options: {
      profileId: string;
      sessionId: string | null;
      requestId?: string | null;
      requestPreview?: string;
      recipeId?: string | null;
      operation: string;
      currentRecipe?: Pick<Recipe, 'tabs'> | null;
    }
  ) {
    try {
      return normalizeRecipeTabsForInput(input, options.currentRecipe ?? null);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Recipe content could not be synchronized.';
      this.recordTelemetry({
        profileId: options.profileId,
        sessionId: options.sessionId ?? null,
        requestId: options.requestId ?? null,
        severity: 'error',
        category: 'recipes',
        code: 'RECIPE_CONTENT_SYNC_FAILED',
        message: `Failed to synchronize content representations while handling ${options.operation}.`,
        detail,
        payload: {
          recipeId: options.recipeId ?? null,
          requestPreview: options.requestPreview ?? null
        }
      });
      throw new BridgeError(400, 'RECIPE_CONTENT_INVALID', 'Recipe content could not be synchronized.');
    }
  }

  private nextRecipeBuildVersion(recipeId: string) {
    const latestBuild = this.options.database.listRecipeBuilds(recipeId, {
      limit: 1
    })[0];
    return latestBuild ? latestBuild.buildVersion + 1 : 1;
  }

  private persistRecipeBuildArtifact(build: RecipeBuild, artifact: RecipeArtifactPayload, timestamp: string) {
    return this.options.database.upsertRecipeBuildArtifact({
      id: `${build.id}-${artifact.kind}`,
      recipeId: build.recipeId,
      buildId: build.id,
      artifactKind: artifact.kind,
      schemaVersion: artifact.schemaVersion,
      payload: artifact,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  private flattenRecipeTemplateSections(sections: RecipeTemplateState['sections']) {
    const flattened: Array<{
      slotId: string;
      kind: RecipeTemplateState['sections'][number]['kind'];
      hydrationState: string;
      repairState: string;
      contentState: string;
      errorMessage: string | null;
    }> = [];

    const visit = (items: RecipeTemplateState['sections']) => {
      for (const section of items) {
        const progress = (section as {
          progress?: {
            hydrationState?: string;
            repairState?: string;
            contentState?: string;
            errorMessage?: string | null;
          };
        }).progress;
        flattened.push({
          slotId: section.slotId,
          kind: section.kind,
          hydrationState: progress?.hydrationState ?? 'ready',
          repairState: progress?.repairState ?? 'idle',
          contentState: progress?.contentState ?? 'hydrated',
          errorMessage: progress?.errorMessage ?? null
        });

        if (section.kind === 'split') {
          visit(section.left);
          visit(section.right);
        }

        if (section.kind === 'tabs') {
          Object.values(section.panes).forEach((pane) => visit(pane));
        }
      }
    };

    visit(sections);
    return flattened;
  }

  private persistRecipeTemplateProgressState(input: {
    build: RecipeBuild;
    phase: RecipeBuild['phase'];
    state: RecipeTemplateState;
    stage: RecipeGenerationStageKey;
    message: string;
  }) {
    const timestamp = this.now();
    this.persistRecipeBuildArtifact(input.build, input.state, timestamp);
    this.appendStructuredRecipeBuildLog(input.build, input.phase, 'info', input.message, {
      recordType: 'recipe_template_section_progress',
      buildId: input.build.id,
      requestId: input.build.triggerRequestId ?? null,
      profileId: input.build.profileId,
      sessionId: input.build.sessionId ?? null,
      recipeId: input.build.recipeId,
      stage: input.stage,
      phase: input.phase,
      templateId: input.state.templateId,
      viewPhase: input.state.status?.phase ?? 'ready',
      sectionCount: this.flattenRecipeTemplateSections(input.state.sections).length,
      sections: this.flattenRecipeTemplateSections(input.state.sections)
    });
  }

  private async emitRecipeBuildProgress(
    build: RecipeBuild,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void,
    messageOverride?: string | null,
    partialTemplateState?: RecipeTemplateState | null
  ) {
    const message = messageOverride ?? build.progressMessage ?? 'Building recipe…';
    await onEvent({
      type: 'progress',
      requestId: build.triggerRequestId ?? null,
      message
    });
    await onEvent({
      type: 'recipe_build_progress',
      recipeId: build.recipeId,
      build,
      recipe: this.options.database.getRecipe(build.recipeId),
      partialTemplateState: partialTemplateState ?? null
    });
  }

  private async advanceRecipeBuild(
    build: RecipeBuild,
    requestPreview: string,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void,
    update: {
      phase: RecipeBuild['phase'];
      progressMessage: string;
      errorCode?: string | null;
      errorMessage?: string | null;
      errorDetail?: string | null;
      completed?: boolean;
      logLevel?: 'info' | 'warning' | 'error';
      logDetail?: string | null;
      failureCategory?: RecipeFailureCategory | null;
      failureStage?: RecipePipelineStage | null;
      userFacingMessage?: string | null;
      retryable?: boolean | null;
      configuredTimeoutMs?: number | null;
      partialTemplateState?: RecipeTemplateState | null;
    }
  ) {
    const timestamp = this.now();
    const nextBuild =
      this.options.database.updateRecipeBuild(build.id, {
        phase: update.phase,
        progressMessage: update.progressMessage,
        updatedAt: timestamp,
        completedAt: update.completed ? timestamp : null,
        errorCode: update.errorCode ?? null,
        errorMessage: update.errorMessage ?? null,
        errorDetail: update.errorDetail ?? null,
        failureCategory: update.failureCategory ?? null,
        failureStage: update.failureStage ?? null,
        userFacingMessage: update.userFacingMessage ?? null,
        retryable: update.retryable ?? null,
        configuredTimeoutMs: update.configuredTimeoutMs ?? null
      }) ?? build;

    this.options.database.appendRecipeBuildLog({
      id: `${nextBuild.id}-${update.phase}-${randomUUID()}`,
      recipeId: nextBuild.recipeId,
      buildId: nextBuild.id,
      phase: update.phase,
      level:
        update.logLevel ??
        (update.phase === 'failed'
          ? 'error'
          : update.phase === 'ready'
            ? 'info'
            : 'info'),
      message: update.progressMessage,
      detail: update.logDetail ?? update.errorDetail ?? undefined,
      createdAt: timestamp
    });

    if (nextBuild.sessionId && nextBuild.triggerRequestId) {
      this.appendPersistedRuntimeActivity(nextBuild.profileId, nextBuild.sessionId, nextBuild.triggerRequestId, requestPreview, {
        kind: 'status',
        state: update.phase === 'failed' ? 'failed' : update.phase === 'ready' ? 'completed' : 'updated',
        label:
          build.buildKind === 'applet'
            ? 'Recipe applet'
            : build.buildKind === 'dsl_enrichment'
              ? 'Recipe enrichment'
              : 'Home recipe',
        detail: update.userFacingMessage ?? update.progressMessage,
        requestId: nextBuild.triggerRequestId,
        timestamp
      });
    }

    await this.emitRecipeBuildProgress(nextBuild, onEvent, update.progressMessage, update.partialTemplateState ?? null);
    return nextBuild;
  }

  private calculateElapsedMs(startedAt: string, endedAt: string) {
    const startedAtMs = Date.parse(startedAt);
    const endedAtMs = Date.parse(endedAt);
    if (!Number.isFinite(startedAtMs) || !Number.isFinite(endedAtMs)) {
      return 0;
    }
    return Math.max(0, endedAtMs - startedAtMs);
  }

  private createRecipeGenerationTrace(build: RecipeBuild, currentTemplateId: RecipeTemplateId | null): RecipeGenerationTrace {
    return {
      buildId: build.id,
      requestId: build.triggerRequestId ?? '',
      profileId: build.profileId,
      sessionId: build.sessionId ?? null,
      recipeId: build.recipeId,
      startedAt: build.startedAt,
      currentTemplateId,
      templateId: currentTemplateId,
      repairInvoked: false,
      stageObservations: []
    };
  }

  private beginRecipeGenerationStage(
    trace: RecipeGenerationTrace,
    input: {
      stage: RecipeGenerationStageKey;
      phase: RecipeBuild['phase'];
      attemptKind?: RecipeGenerationStageAttemptKind;
      attemptNumber?: number;
      retryReason?: string | null;
      startedAt?: string;
      configuredTimeoutMs?: number | null;
      recommendedTimeoutMs?: number | null;
      templateId?: RecipeTemplateId | null;
      currentTemplateId?: RecipeTemplateId | null;
    }
  ): RecipeGenerationStageRun {
    return {
      stage: input.stage,
      phase: input.phase,
      attemptKind: input.attemptKind ?? 'initial',
      startedAt: input.startedAt ?? this.now(),
      attemptNumber: input.attemptNumber ?? 1,
      retryReason: input.retryReason ?? null,
      configuredTimeoutMs: input.configuredTimeoutMs ?? null,
      recommendedTimeoutMs: input.recommendedTimeoutMs ?? null,
      templateId: input.templateId ?? trace.templateId,
      currentTemplateId: input.currentTemplateId ?? trace.currentTemplateId
    };
  }

  private describeRecipeGenerationStageLabel(stage: RecipeGenerationStageKey) {
    switch (stage) {
      case 'structured_seed_generation':
        return 'recipe structured seed generation';
      case 'template_selection':
        return 'recipe template selection';
      case 'template_text_generation':
        return 'recipe template text generation';
      case 'template_hydration':
        return 'recipe template hydration';
      case 'template_actions_generation':
        return 'recipe template actions generation';
      case 'template_text_repair':
        return 'recipe template text repair';
      case 'template_actions_repair':
        return 'recipe template actions repair';
      case 'template_validation':
        return 'recipe template validation';
      case 'template_promotion':
        return 'recipe template promotion';
      default:
        return 'recipe generation stage';
    }
  }

  private appendStructuredRecipeBuildLog(
    build: RecipeBuild,
    phase: RecipeBuild['phase'],
    level: 'info' | 'warning' | 'error',
    message: string,
    detail: Record<string, unknown>
  ) {
    const id = `${build.id}-${phase}-${randomUUID()}`;
    this.options.database.appendRecipeBuildLog({
      id,
      recipeId: build.recipeId,
      buildId: build.id,
      phase,
      level,
      message,
      detail: JSON.stringify(detail),
      createdAt: this.now()
    });
    return id;
  }

  private createBoundedRecipePayloadSnapshot(
    value: string,
    options: {
      headChars?: number;
      tailChars?: number;
    } = {}
  ): RecipeGenerationRawPayloadSnapshot {
    const headChars = options.headChars ?? 8_000;
    const tailChars = options.tailChars ?? 4_000;
    const totalChars = value.length;
    if (totalChars <= headChars + tailChars) {
      return {
        preview: value,
        head: value,
        tail: null,
        totalChars,
        storedChars: totalChars,
        truncated: false
      };
    }

    const head = value.slice(0, headChars);
    const tail = value.slice(-tailChars);
    const preview = `${head}\n\n… [truncated ${totalChars - (head.length + tail.length)} chars] …\n\n${tail}`;
    return {
      preview,
      head,
      tail,
      totalChars,
      storedChars: head.length + tail.length,
      truncated: true
    };
  }

  private persistRecipeGenerationRawPayloadLog(input: {
    build: RecipeBuild;
    phase: RecipeBuild['phase'];
    stage: RecipeGenerationStageKey;
    attemptNumber: number;
    attemptKind: RecipeGenerationStageAttemptKind;
    status: RecipeGenerationStageStatus;
    templateId: RecipeTemplateId | null;
    currentTemplateId: RecipeTemplateId | null;
    rawPayload: string;
    failureKind: RecipeGenerationStageFailureKind | null;
    errorDetail: string | null;
    parserDiagnostics?: Record<string, unknown> | null;
    recoveryAttempted: boolean;
    recoverySucceeded: boolean;
  }) {
    const snapshot = this.createBoundedRecipePayloadSnapshot(input.rawPayload);
    return this.appendStructuredRecipeBuildLog(
      input.build,
      input.phase,
      input.status === 'succeeded' ? 'info' : input.status === 'timed_out' ? 'warning' : 'error',
      `${this.describeRecipeGenerationStageLabel(input.stage)} raw payload snapshot.`,
      {
        recordType: 'recipe_generation_stage_attempt_raw',
        buildId: input.build.id,
        requestId: input.build.triggerRequestId ?? null,
        profileId: input.build.profileId,
        sessionId: input.build.sessionId ?? null,
        recipeId: input.build.recipeId,
        stage: input.stage,
        phase: input.phase,
        attemptKind: input.attemptKind,
        attemptNumber: input.attemptNumber,
        retryNumber: Math.max(0, input.attemptNumber - 1),
        templateId: input.templateId,
        currentTemplateId: input.currentTemplateId,
        status: input.status,
        failureKind: input.failureKind,
        errorDetail: input.errorDetail,
        recoveryAttempted: input.recoveryAttempted,
        recoverySucceeded: input.recoverySucceeded,
        payload: snapshot,
        parserDiagnostics: input.parserDiagnostics ?? null
      }
    );
  }

  private persistRecipeGenerationAttemptLog(input: {
    build: RecipeBuild;
    phase: RecipeBuild['phase'];
    stage: RecipeGenerationStageKey;
    attemptKind: RecipeGenerationStageAttemptKind;
    attemptNumber: number;
    status: RecipeGenerationStageStatus;
    startedAt: string;
    endedAt: string;
    elapsedMs: number;
    configuredTimeoutMs: number | null;
    recommendedTimeoutMs: number | null;
    templateId: RecipeTemplateId | null;
    currentTemplateId: RecipeTemplateId | null;
    retryReason: string | null;
    retryable: boolean;
    failureKind: RecipeGenerationStageFailureKind | null;
    errorDetail: string | null;
    autoRecoveryAttempted: boolean;
    autoRecoverySucceeded: boolean;
    rawPayloadLogId?: string | null;
    parserDiagnostics?: Record<string, unknown> | null;
    normalizationSummary?: RecipeTemplateRepairSummary | Record<string, unknown> | null;
    sameSessionCorrections?: number;
    sameSessionCorrectionErrors?: string[];
    sameSessionCorrectionFixed?: boolean;
    sameSessionSessionId?: string | null;
  }) {
    return this.appendStructuredRecipeBuildLog(
      input.build,
      input.phase,
      input.status === 'succeeded' ? 'info' : input.status === 'timed_out' ? 'warning' : 'error',
      `${this.describeRecipeGenerationStageLabel(input.stage)} attempt ${input.attemptNumber} ${input.status}.`,
      {
        recordType: 'recipe_generation_stage_attempt',
        buildId: input.build.id,
        requestId: input.build.triggerRequestId ?? null,
        profileId: input.build.profileId,
        sessionId: input.build.sessionId ?? null,
        recipeId: input.build.recipeId,
        stage: input.stage,
        phase: input.phase,
        attemptKind: input.attemptKind,
        attemptNumber: input.attemptNumber,
        retryNumber: Math.max(0, input.attemptNumber - 1),
        status: input.status,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        elapsedMs: input.elapsedMs,
        configuredTimeoutMs: input.configuredTimeoutMs,
        recommendedTimeoutMs: input.recommendedTimeoutMs,
        templateId: input.templateId,
        currentTemplateId: input.currentTemplateId,
        retryReason: input.retryReason,
        retryable: input.retryable,
        failureKind: input.failureKind,
        errorDetail: input.errorDetail,
        autoRecoveryAttempted: input.autoRecoveryAttempted,
        autoRecoverySucceeded: input.autoRecoverySucceeded,
        rawPayloadLogId: input.rawPayloadLogId ?? null,
        parserDiagnostics: input.parserDiagnostics ?? null,
        normalizationSummary: input.normalizationSummary ?? null,
        sameSessionCorrections: input.sameSessionCorrections ?? 0,
        sameSessionCorrectionErrors: input.sameSessionCorrectionErrors ?? [],
        sameSessionCorrectionFixed: input.sameSessionCorrectionFixed ?? false,
        sameSessionSessionId: input.sameSessionSessionId ?? null
      }
    );
  }

  private summarizeRecipeRetryReason(detail: string | null) {
    const normalized = detail?.replace(/\s+/gu, ' ').trim() ?? '';
    if (!normalized) {
      return null;
    }
    return normalized.length > 500 ? `${normalized.slice(0, 497)}...` : normalized;
  }

  private applyRecipeStageRetryPrompt(basePrompt: string, priorFailureDetail: string | null) {
    const summarizedFailure = this.summarizeRecipeRetryReason(priorFailureDetail);
    if (!summarizedFailure) {
      return basePrompt;
    }

    return `${basePrompt}

Previous attempt failed because:
${this.serializeStructuredContext(summarizedFailure, 2_000)}

Retry rules:
- Correct only the failure above.
- Keep all other valid structure unchanged where possible.
- Do not regenerate unrelated content or invent new unsupported structure.`;
  }

  private mapRecipeStructuredFailureKind(
    failureKind:
      | StructuredJsonFailureKind
      | HermesRecipeDataExtractionFailureKind
      | 'schema_invalid'
      | null
      | undefined,
    detail: string
  ): RecipeGenerationStageFailureKind {
    if (/timed out/i.test(detail)) {
      return 'timeout';
    }

    switch (failureKind) {
      case 'empty_payload':
      case 'missing_marker':
      case 'json_missing':
        return 'json_missing';
      case 'json_unbalanced':
        return 'json_unbalanced';
      case 'json_invalid':
        return 'json_invalid';
      case 'json_root_not_object':
        return 'json_root_not_object';
      case 'schema_invalid':
        return 'schema_invalid';
      default:
        return 'request_error';
    }
  }

  private mapRecipeRequestFailureKind(detail: string): RecipeGenerationStageFailureKind {
    return /timed out/i.test(detail) ? 'timeout' : 'request_error';
  }

  private buildRecipeStageInvalidJson(input: {
    assistantMarkdown: string;
    jsonText?: string | null;
    rawValue?: unknown | null;
    fallbackJson?: string;
  }) {
    if (input.jsonText?.trim()) {
      return input.jsonText.trim();
    }

    if (input.assistantMarkdown.trim()) {
      return input.assistantMarkdown.trim();
    }

    if (input.rawValue !== undefined && input.rawValue !== null) {
      try {
        return JSON.stringify(input.rawValue, null, 2);
      } catch {
        // Ignore serialization issues and fall through to the final fallback.
      }
    }

    return input.fallbackJson ?? '{}';
  }

  private isRetryableRecipeStageAttempt(input: {
    failureReason: 'live_task_violation' | 'context_invalid' | null;
    failureKind: RecipeGenerationStageFailureKind | null;
    detail: string;
  }) {
    if (input.failureReason === 'context_invalid') {
      return false;
    }

    if (input.failureReason === 'live_task_violation') {
      return false;
    }

    if (/unsupported template transition/i.test(input.detail)) {
      return false;
    }

    switch (input.failureKind) {
      case 'context_invalid':
      case 'live_task_violation':
        return false;
      case 'timeout':
      case 'request_error':
      case 'json_missing':
      case 'json_unbalanced':
      case 'json_invalid':
      case 'json_root_not_object':
      case 'schema_invalid':
      case 'validation_failed':
        return true;
      default:
        return true;
    }
  }

  private async runRecipeGenerationStageWithRetries<T>(input: {
    build: RecipeBuild;
    trace: RecipeGenerationTrace;
    stage: RecipeGenerationStageKey;
    phase: RecipeBuild['phase'];
    attemptKind?: RecipeGenerationStageAttemptKind;
    maxAttempts?: number;
    templateId?: RecipeTemplateId | null;
    currentTemplateId?: RecipeTemplateId | null;
    executeAttempt: (
      attemptNumber: number,
      priorFailureDetail: string | null
    ) => Promise<RecipeGenerationStageAttemptResult<T>>;
  }): Promise<RecipeGenerationStageRetryOutcome<T>> {
    const maxAttempts = input.maxAttempts ?? 3;
    let priorFailureDetail: string | null = null;

    for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber += 1) {
      const attemptResult = await input.executeAttempt(attemptNumber, priorFailureDetail);
      const status: RecipeGenerationStageStatus =
        attemptResult.value !== null
          ? 'succeeded'
          : /timed out/i.test(attemptResult.detail)
            ? 'timed_out'
            : 'failed';
      const retryReason = attemptNumber > 1 ? this.summarizeRecipeRetryReason(priorFailureDetail) : null;
      const rawPayloadLogId =
        attemptResult.assistantMarkdown.trim().length > 0 &&
        (attemptResult.value === null || attemptResult.autoRecoverySucceeded)
          ? this.persistRecipeGenerationRawPayloadLog({
              build: input.build,
              phase: input.phase,
              stage: input.stage,
              attemptNumber,
              attemptKind: input.attemptKind ?? 'initial',
              status,
              templateId: attemptResult.templateId ?? input.templateId ?? null,
              currentTemplateId: attemptResult.currentTemplateId ?? input.currentTemplateId ?? null,
              rawPayload: attemptResult.assistantMarkdown,
              failureKind: attemptResult.value === null ? attemptResult.failureKind : null,
              errorDetail: attemptResult.value === null ? attemptResult.detail : null,
              parserDiagnostics: attemptResult.parserDiagnostics ?? null,
              recoveryAttempted: attemptResult.autoRecoveryAttempted,
              recoverySucceeded: attemptResult.autoRecoverySucceeded
            })
          : null;
      const run = this.beginRecipeGenerationStage(input.trace, {
        stage: input.stage,
        phase: input.phase,
        attemptKind: input.attemptKind,
        attemptNumber,
        retryReason,
        startedAt: attemptResult.startedAt,
        configuredTimeoutMs: attemptResult.configuredTimeoutMs,
        recommendedTimeoutMs: attemptResult.recommendedTimeoutMs,
        templateId: attemptResult.templateId ?? input.templateId ?? null,
        currentTemplateId: attemptResult.currentTemplateId ?? input.currentTemplateId ?? null
      });
      const observation = this.completeRecipeGenerationStage(input.build, input.trace, run, {
        status,
        endedAt: attemptResult.endedAt,
        errorDetail: attemptResult.value === null ? attemptResult.detail : null,
        templateId: attemptResult.templateId ?? input.templateId ?? null,
        currentTemplateId: attemptResult.currentTemplateId ?? input.currentTemplateId ?? null,
        autoRecoveryAttempted: attemptResult.autoRecoveryAttempted,
        autoRecoverySucceeded: attemptResult.autoRecoverySucceeded,
        failureKind: attemptResult.value === null ? attemptResult.failureKind : null,
        rawPayloadLogId
      });
      const retryable =
        attemptResult.value === null
          ? attemptResult.retryable &&
            this.isRetryableRecipeStageAttempt({
              failureReason: attemptResult.failureReason,
              failureKind: attemptResult.failureKind,
              detail: attemptResult.detail
            })
          : false;
      this.persistRecipeGenerationAttemptLog({
        build: input.build,
        phase: input.phase,
        stage: input.stage,
        attemptKind: input.attemptKind ?? 'initial',
        attemptNumber,
        status,
        startedAt: attemptResult.startedAt,
        endedAt: attemptResult.endedAt,
        elapsedMs: attemptResult.elapsedMs,
        configuredTimeoutMs: attemptResult.configuredTimeoutMs,
        recommendedTimeoutMs: attemptResult.recommendedTimeoutMs,
        templateId: attemptResult.templateId ?? input.templateId ?? null,
        currentTemplateId: attemptResult.currentTemplateId ?? input.currentTemplateId ?? null,
        retryReason,
        retryable,
        failureKind: attemptResult.value === null ? attemptResult.failureKind : null,
        errorDetail: attemptResult.value === null ? attemptResult.detail : null,
        autoRecoveryAttempted: attemptResult.autoRecoveryAttempted,
        autoRecoverySucceeded: attemptResult.autoRecoverySucceeded,
        rawPayloadLogId,
        parserDiagnostics: attemptResult.parserDiagnostics ?? null,
        normalizationSummary: attemptResult.normalizationSummary ?? null,
        sameSessionCorrections: attemptResult.sameSessionCorrections,
        sameSessionCorrectionErrors: attemptResult.sameSessionCorrectionErrors,
        sameSessionCorrectionFixed: attemptResult.sameSessionCorrectionFixed,
        sameSessionSessionId: attemptResult.sameSessionSessionId
      });

      if (attemptResult.value !== null) {
        return {
          ok: true,
          value: attemptResult.value,
          attemptResult,
          observation,
          attemptsUsed: attemptNumber
        };
      }

      if (!retryable || attemptNumber >= maxAttempts) {
        return {
          ok: false,
          detail: attemptResult.detail,
          failureReason: attemptResult.failureReason,
          failureKind: attemptResult.failureKind,
          retryable,
          attemptResult,
          observation,
          attemptsUsed: attemptNumber
        };
      }

      priorFailureDetail = attemptResult.detail;
      this.appendStructuredRecipeBuildLog(
        input.build,
        input.phase,
        'warning',
        `Retrying ${this.describeRecipeGenerationStageLabel(input.stage)} after attempt ${attemptNumber} failed.`,
        {
          recordType: 'recipe_generation_stage_retry',
          buildId: input.build.id,
          requestId: input.build.triggerRequestId ?? null,
          profileId: input.build.profileId,
          sessionId: input.build.sessionId ?? null,
          recipeId: input.build.recipeId,
          stage: input.stage,
          phase: input.phase,
          attemptKind: input.attemptKind ?? 'initial',
          failedAttemptNumber: attemptNumber,
          nextAttemptNumber: attemptNumber + 1,
          retryReason: this.summarizeRecipeRetryReason(attemptResult.detail),
          failureKind: attemptResult.failureKind,
          timeoutMs: attemptResult.configuredTimeoutMs,
          elapsedMs: attemptResult.elapsedMs,
          templateId: attemptResult.templateId ?? input.templateId ?? null,
          currentTemplateId: attemptResult.currentTemplateId ?? input.currentTemplateId ?? null
        }
      );
    }

    throw new Error(`Unreachable retry state for ${input.stage}.`);
  }

  private completeRecipeGenerationStage(
    build: RecipeBuild,
    trace: RecipeGenerationTrace,
    run: RecipeGenerationStageRun,
    input: {
      status: RecipeGenerationStageStatus;
      endedAt?: string;
      errorDetail?: string | null;
      templateId?: RecipeTemplateId | null;
      currentTemplateId?: RecipeTemplateId | null;
      autoRecoveryAttempted?: boolean;
      autoRecoverySucceeded?: boolean;
      failureKind?: RecipeGenerationStageFailureKind | null;
      rawPayloadLogId?: string | null;
    }
  ) {
    const endedAt = input.endedAt ?? this.now();
    const timeoutCategory =
      input.status === 'timed_out'
        ? run.configuredTimeoutMs !== null &&
          run.recommendedTimeoutMs !== null &&
          run.configuredTimeoutMs < run.recommendedTimeoutMs
          ? 'timeout_user_config'
          : 'timeout_runtime'
        : null;
    const observation: RecipeGenerationStageObservation = {
      recordType: 'recipe_generation_stage_timing',
      buildId: trace.buildId,
      requestId: trace.requestId,
      profileId: trace.profileId,
      sessionId: trace.sessionId,
      recipeId: trace.recipeId,
      stage: run.stage,
      phase: run.phase,
      attemptKind: run.attemptKind,
      attemptNumber: run.attemptNumber,
      retryNumber: Math.max(0, run.attemptNumber - 1),
      status: input.status,
      completed: input.status === 'succeeded',
      startedAt: run.startedAt,
      endedAt,
      elapsedMs: this.calculateElapsedMs(run.startedAt, endedAt),
      configuredTimeoutMs: run.configuredTimeoutMs,
      recommendedTimeoutMs: run.recommendedTimeoutMs,
      timeoutCategory,
      templateId: input.templateId ?? run.templateId ?? trace.templateId,
      currentTemplateId: input.currentTemplateId ?? run.currentTemplateId ?? trace.currentTemplateId,
      autoRecoveryAttempted: input.autoRecoveryAttempted ?? false,
      autoRecoverySucceeded: input.autoRecoverySucceeded ?? false,
      failureKind: input.failureKind ?? null,
      retryReason: run.retryReason,
      rawPayloadLogId: input.rawPayloadLogId ?? null,
      errorDetail: input.errorDetail?.trim() ? input.errorDetail.trim() : null
    };

    if (observation.templateId) {
      trace.templateId = observation.templateId;
    }
    if (observation.currentTemplateId) {
      trace.currentTemplateId = observation.currentTemplateId;
    }
    if (observation.attemptKind === 'repair') {
      trace.repairInvoked = true;
    }
    trace.stageObservations.push(observation);

    const message =
      input.status === 'timed_out'
        ? `${this.describeRecipeGenerationStageLabel(run.stage)} timed out after ${observation.elapsedMs}ms.`
        : input.status === 'failed'
          ? `${this.describeRecipeGenerationStageLabel(run.stage)} failed after ${observation.elapsedMs}ms.`
          : `${this.describeRecipeGenerationStageLabel(run.stage)} completed in ${observation.elapsedMs}ms.`;

    this.appendStructuredRecipeBuildLog(
      build,
      run.phase,
      input.status === 'succeeded' ? 'info' : input.status === 'timed_out' ? 'warning' : 'error',
      message,
      observation
    );

    return observation;
  }

  private findLatestRecipeGenerationTimeout(
    trace: RecipeGenerationTrace
  ): RecipeGenerationStageObservation | null {
    for (let index = trace.stageObservations.length - 1; index >= 0; index -= 1) {
      const observation = trace.stageObservations[index];
      if (observation?.status === 'timed_out') {
        return observation;
      }
    }
    return null;
  }

  private recordRecipeGenerationTimeoutTelemetry(
    build: RecipeBuild,
    trace: RecipeGenerationTrace,
    observation: RecipeGenerationStageObservation
  ) {
    this.recordTelemetry({
      profileId: trace.profileId,
      sessionId: trace.sessionId,
      requestId: trace.requestId,
      severity: 'warning',
      category: 'recipes',
      code: 'RECIPE_TEMPLATE_STAGE_TIMEOUT',
      message: 'A Home recipe template-generation stage timed out.',
      detail: observation.errorDetail ?? `${this.describeRecipeGenerationStageLabel(observation.stage)} timed out.`,
      payload: {
        buildId: build.id,
        requestId: trace.requestId,
        profileId: trace.profileId,
        sessionId: trace.sessionId,
        recipeId: trace.recipeId,
        stage: observation.stage,
        phase: observation.phase,
        elapsedMs: observation.elapsedMs,
        configuredTimeoutMs: observation.configuredTimeoutMs,
        recommendedTimeoutMs: observation.recommendedTimeoutMs,
        timeoutCategory: observation.timeoutCategory,
        templateId: observation.templateId,
        currentTemplateId: observation.currentTemplateId,
        attemptKind: observation.attemptKind,
        attemptNumber: observation.attemptNumber,
        retryNumber: observation.retryNumber,
        autoRecoveryAttempted: observation.autoRecoveryAttempted,
        autoRecoverySucceeded: observation.autoRecoverySucceeded,
        failureKind: observation.failureKind,
        rawPayloadLogId: observation.rawPayloadLogId,
        diagnostic: observation.errorDetail
      }
    });
  }

  private recordRecipeGenerationSummary(build: RecipeBuild, trace: RecipeGenerationTrace): RecipeGenerationSummary {
    const totalElapsedMs = this.calculateElapsedMs(build.startedAt, build.completedAt ?? this.now());
    const attemptsByStage = trace.stageObservations.reduce<Partial<Record<RecipeGenerationStageKey, number>>>(
      (summary, observation) => {
        summary[observation.stage] = (summary[observation.stage] ?? 0) + 1;
        return summary;
      },
      {}
    );
    const rawPayloadLogIdsByStage = trace.stageObservations.reduce<Partial<Record<RecipeGenerationStageKey, string[]>>>(
      (summary, observation) => {
        if (!observation.rawPayloadLogId) {
          return summary;
        }
        summary[observation.stage] = [...(summary[observation.stage] ?? []), observation.rawPayloadLogId];
        return summary;
      },
      {}
    );
    const recoveryByStage = trace.stageObservations.reduce<
      Partial<
        Record<
          RecipeGenerationStageKey,
          {
            attempted: boolean;
            succeeded: boolean;
          }
        >
      >
    >((summary, observation) => {
      const current = summary[observation.stage] ?? {
        attempted: false,
        succeeded: false
      };
      summary[observation.stage] = {
        attempted: current.attempted || observation.autoRecoveryAttempted,
        succeeded: current.succeeded || observation.autoRecoverySucceeded
      };
      return summary;
    }, {});
    const perStageElapsedMs = trace.stageObservations.reduce<Partial<Record<RecipeGenerationStageKey, number>>>(
      (summary, observation) => {
        summary[observation.stage] = (summary[observation.stage] ?? 0) + observation.elapsedMs;
        return summary;
      },
      {}
    );
    const timeoutObservation = this.findLatestRecipeGenerationTimeout(trace);
    const summary: RecipeGenerationSummary = {
      recordType: 'recipe_generation_summary',
      buildId: build.id,
      requestId: trace.requestId,
      profileId: trace.profileId,
      sessionId: trace.sessionId,
      recipeId: trace.recipeId,
      finalPhase: build.phase,
      completed: build.completedAt !== null,
      ready: build.phase === 'ready',
      startedAt: build.startedAt,
      completedAt: build.completedAt,
      totalElapsedMs,
      repairInvoked: trace.repairInvoked,
      currentTemplateId: trace.currentTemplateId,
      templateId: trace.templateId,
      attemptsByStage,
      rawPayloadLogIdsByStage,
      recoveryByStage,
      perStageElapsedMs,
      stageObservations: trace.stageObservations,
      timeout: timeoutObservation
        ? {
            stage: timeoutObservation.stage,
            elapsedMs: timeoutObservation.elapsedMs,
            configuredTimeoutMs: timeoutObservation.configuredTimeoutMs,
            recommendedTimeoutMs: timeoutObservation.recommendedTimeoutMs,
            timeoutCategory: timeoutObservation.timeoutCategory,
            attemptKind: timeoutObservation.attemptKind,
            diagnostic: timeoutObservation.errorDetail
          }
        : null,
      failureCategory: build.failureCategory,
      failureStage: build.failureStage,
      errorCode: build.errorCode,
      errorMessage: build.errorMessage,
      errorDetail: build.errorDetail
    };

    this.appendStructuredRecipeBuildLog(
      build,
      build.phase,
      build.phase === 'ready' ? 'info' : 'warning',
      'Recipe generation summary.',
      summary
    );
    this.recordTelemetry({
      profileId: trace.profileId,
      sessionId: trace.sessionId,
      requestId: trace.requestId,
      severity: build.phase === 'ready' ? 'info' : 'warning',
      category: 'recipes',
      code: 'RECIPE_TEMPLATE_BUILD_SUMMARY',
      message: 'Persisted a Home recipe generation summary.',
      detail:
        build.phase === 'ready'
          ? 'The template-constrained recipe build completed successfully.'
          : build.errorDetail ?? 'The template-constrained recipe build completed with a failure state.',
      payload: summary
    });

    return summary;
  }

  private recordRecipeDataEnvelopeTelemetry(
    profileId: string,
    sessionId: string,
    requestId: string,
    requestPreview: string,
    currentRecipeId: string | null,
    extracted: HermesRecipeDataExtractionResult,
    options: {
      structuredRecipeRequired?: boolean;
      source?: 'initial' | 'repair' | 'structured_only' | 'structured_only_reissue';
    } = {}
  ) {
    const payload = {
      recipeId: currentRecipeId,
      requestPreview,
      cleanedAssistantPreview: extracted.cleanedMarkdown.slice(0, 160),
      foundFence: extracted.foundFence,
      missingClosingFence: extracted.missingClosingFence,
      recovered: extracted.recovered,
      strategy: extracted.strategy,
      source: options.source ?? 'initial',
      parserDiagnostics: extracted.parserDiagnostics
    };

    if (options.structuredRecipeRequired && options.source === 'repair' && extracted.mode !== 'structured_only' && !extracted.foundFence && !extracted.envelope) {
      this.recordTelemetry({
        profileId,
        sessionId,
        requestId,
        severity: 'warning',
        category: 'recipes',
        code: 'RECIPE_DATA_BLOCK_MISSING',
        message: 'Hermes did not emit a Hermes recipe-data block for a structured recipe request.',
        detail: 'No Hermes recipe-data block was present in the assistant response.',
        payload
      });
    }

    if (extracted.envelope) {
      this.recordTelemetry({
        profileId,
        sessionId,
        requestId,
        severity: 'info',
        category: 'recipes',
        code: 'RECIPE_DATA_BLOCK_EXTRACTED',
        message: extracted.recovered
          ? extracted.strategy === 'direct_json'
            ? 'Recovered and validated a structured-only recipe artifact.'
            : 'Recovered and validated a Hermes recipe-data payload.'
          : extracted.strategy === 'direct_json'
            ? 'Validated a structured-only recipe artifact.'
            : 'Validated a Hermes recipe-data payload.',
        detail: extracted.recovered
          ? extracted.strategy === 'direct_json'
            ? 'The bridge recovered the first balanced JSON object from the dedicated structured-only response and validated it.'
            : 'The bridge recovered the first balanced JSON object after the Hermes recipe-data start marker and validated it.'
          : extracted.strategy === 'direct_json'
            ? 'The bridge validated the JSON artifact emitted by the dedicated structured-only channel.'
            : 'The bridge validated the Hermes recipe-data payload emitted by Hermes.',
        payload
      });
    }

    for (const diagnostic of extracted.diagnostics) {
      const message = (() => {
        switch (diagnostic.code) {
          case 'RECIPE_DATA_BLOCK_PROSE_IGNORED':
            return 'Ignored extra prose inside a Hermes recipe-data block.';
          case 'RECIPE_DATA_BLOCK_EMPTY':
            return 'Hermes emitted an empty Hermes recipe-data block.';
          case 'RECIPE_DATA_BLOCK_JSON_MISSING':
            return 'Hermes emitted a Hermes recipe-data block without a usable JSON payload.';
          case 'RECIPE_DATA_BLOCK_JSON_UNBALANCED':
            return 'Hermes emitted an unbalanced Hermes recipe-data payload.';
          case 'RECIPE_DATA_BLOCK_JSON_INVALID':
            return 'Hermes emitted invalid JSON inside a Hermes recipe-data block.';
          case 'RECIPE_DATA_BLOCK_JSON_DELIMITER_COMPLETED':
            return 'Recovered a Hermes recipe-data payload by completing missing trailing delimiters.';
          case 'RECIPE_DATA_BLOCK_SCHEMA_INVALID':
            return 'Hermes emitted schema-invalid Hermes recipe-data JSON.';
          case 'RECIPE_DATA_BLOCK_MISSING_FENCE_RECOVERED':
            return 'Recovered a Hermes recipe-data block that was missing the closing fence.';
          case 'RECIPE_DATA_BLOCK_MISSING_FENCE_UNRECOVERABLE':
            return 'Hermes emitted a Hermes recipe-data block with a missing closing fence that could not be recovered.';
          default:
            return 'Hermes emitted an invalid Hermes recipe-data block.';
        }
      })();
      this.recordTelemetry({
        profileId,
        sessionId,
        requestId,
        severity: diagnostic.severity,
        category: 'recipes',
        code: diagnostic.code,
        message,
        detail: diagnostic.detail,
        payload
      });
    }
  }

  private normalizeRecipeArtifactRequestMode(mode: ChatStreamRequest['mode']) {
    if (mode === 'recipe_refresh') {
      return 'recipe_refresh' as const;
    }

    if (mode === 'recipe_action') {
      return 'recipe_action' as const;
    }

    return 'chat' as const;
  }

  private shouldAttemptRecipeAppletUpgrade(
    requestMode: ChatStreamRequest['mode'],
    structuredRecipeIntent: StructuredRecipeIntent | null,
    isRetryBuild: boolean,
    mutationIntent?: RecipeMutationIntent | null
  ) {
    if (isRetryBuild || requestMode === 'recipe_refresh' || requestMode === 'recipe_action') {
      return true;
    }

    // A mutation intent (user asking to change how the current recipe looks) always triggers
    // enrichment so the template can be switched/updated, even when there's no fresh data intent.
    if (mutationIntent) {
      return true;
    }

    return Boolean(
      structuredRecipeIntent &&
      structuredRecipeIntent.label !== 'recipe request'
    );
  }

  private buildRecipeAppletArtifactContext(input: {
    currentRecipe: Recipe;
    envelope: HermesRecipeDataEnvelope;
    prompt: string;
    requestMode: ChatStreamRequest['mode'];
    timestamp: string;
    structuredRecipeIntent: StructuredRecipeIntent | null;
    conversationalAssistantMarkdown: string;
  }): RecipeAppletArtifactContext {
    const artifacts = buildRecipeAppletBaseArtifacts({
      prompt: input.prompt,
      requestMode: this.normalizeRecipeArtifactRequestMode(input.requestMode),
      timestamp: input.timestamp,
      currentRecipe: {
        id: input.currentRecipe.id,
        title: input.currentRecipe.title,
        description: input.currentRecipe.description,
        status: input.currentRecipe.status,
        metadata: input.currentRecipe.metadata
      },
      envelope: input.envelope,
      intentHint: input.structuredRecipeIntent
        ? {
            category: input.structuredRecipeIntent.category,
            preferredContentFormat: input.structuredRecipeIntent.preferredContentFormat,
            label: input.structuredRecipeIntent.label
          }
        : null
    });
    const fullResponseMarkdown = this.sanitizeAssistantMarkdownForFallback(input.conversationalAssistantMarkdown);
    const fullResponseSnapshot = this.createBoundedRecipePayloadSnapshot(fullResponseMarkdown, {
      headChars: 24_000,
      tailChars: 8_000
    });
    const assistantContext = RecipeAssistantContextSchema.parse({
      ...artifacts.assistantContext,
      metadata: {
        ...artifacts.assistantContext.metadata,
        fullResponseMarkdown: fullResponseSnapshot.preview,
        fullResponseTruncated: fullResponseSnapshot.truncated
      }
    });

    return {
      buildId: null,
      build: null,
      userPrompt: artifacts.userPrompt,
      intent: artifacts.intent,
      rawData: artifacts.rawData,
      assistantContext,
      analysis: artifacts.analysis,
      normalizedData: artifacts.normalizedData,
      summary: artifacts.summary,
      fallback: artifacts.fallback,
      actionSpec: artifacts.actionSpec,
      recipeModel: artifacts.recipeModel,
      recipePatch: artifacts.recipePatch
    };
  }

  private summarizeAssistantAnswer(markdown: string, fallback = 'Hermes completed the conversational answer.') {
    const normalized = markdown.replace(/\s+/gu, ' ').trim();
    if (!normalized) {
      return fallback;
    }

    if (normalized.length <= 180) {
      return normalized;
    }

    return `${normalized.slice(0, 177).trimEnd()}...`;
  }

  private isRetryBuildAttempt(triggerKind: RecipeBuildTriggerKind | null | undefined, triggerActionId: string | null | undefined) {
    return triggerKind === 'retry' || triggerActionId === 'retry-build';
  }

  private stripHermesRecipeDataMarkerRemnants(markdown: string) {
    const markerIndex = markdown.search(/```hermes-recipe-data[^\n]*\n?/iu);
    if (markerIndex < 0) {
      return markdown.trim();
    }

    return markdown
      .slice(0, markerIndex)
      .replace(/\n{3,}/gu, '\n\n')
      .trim();
  }

  private sanitizeAssistantMarkdownForFallback(markdown: string) {
    const extracted = extractHermesRecipeDataEnvelope(markdown);
    const candidate = extracted.cleanedMarkdown.trim().length > 0 ? extracted.cleanedMarkdown : markdown;
    return this.stripHermesRecipeDataMarkerRemnants(candidate);
  }

  private deriveStructuredRecipeFailureTitle(currentRecipe: Recipe | null, intent: StructuredRecipeIntent | null) {
    if (currentRecipe?.title.trim()) {
      return currentRecipe.title.trim();
    }

    const label = intent?.label?.trim();
    if (!label) {
      return 'Recipe';
    }

    const humanized = label
      .replace(/[_-]+/gu, ' ')
      .replace(/\s+/gu, ' ')
      .trim()
      .replace(/\b\w/gu, (character) => character.toUpperCase());

    return humanized.toLowerCase() === 'recipe request' ? 'Recipe' : humanized;
  }

  private deriveMarkdownFallbackTitle(currentRecipe: Recipe | null, session: Session, intent: StructuredRecipeIntent | null) {
    if (currentRecipe?.title.trim()) {
      return currentRecipe.title.trim();
    }

    if (intent) {
      return this.deriveStructuredRecipeFailureTitle(currentRecipe, intent);
    }

    const sessionTitle = session.title.trim();
    return sessionTitle.length > 0 ? sessionTitle : 'Recipe';
  }

  private buildStructuredRecipeArtifactPrompt(input: {
    originalPrompt: string;
    assistantMarkdown: string;
    intent: StructuredRecipeIntent | null;
    currentRecipe: Recipe | null;
    reissueFailureDetail?: string | null;
  }) {
    const intentSummary = input.intent
      ? `Category: ${input.intent.category}
Label: ${input.intent.label}
Preferred content format: ${input.intent.preferredContentFormat}`
      : 'No structured intent was classified.';
    const currentRecipeSummary = input.currentRecipe
      ? `Recipe ID: ${input.currentRecipe.id}
Title: ${input.currentRecipe.title}
Status: ${input.currentRecipe.status}`
      : 'No current attached recipe.';
    const reissueInstruction = input.reissueFailureDetail?.trim()
      ? `The previous structured artifact attempt failed because:
${this.serializeStructuredContext(input.reissueFailureDetail, 1_500)}

Re-emit the artifact now with the exact contract below.`
      : 'Emit the structured artifact now with the exact contract below.';

    return `Bridge execution note: Emit only the structured Hermes Home recipe seed for the immediately preceding answer.
Do not use tools, commands, code execution, approvals, outbound requests, mutations, or external actions.
Do not repeat, revise, or extend the user-facing answer.
Primary contract: emit exactly one JSON object and nothing else.
Do not emit prose, commentary, markdown, code fences, or trailing text before or after the JSON.
Do not emit hermes-ui-recipes blocks.
Compatibility fallback only if raw JSON is impossible: emit exactly one \`hermes-recipe-data\` start marker followed immediately by the same JSON object, with no closing fence.
The bridge will parse the first balanced JSON object and validate it strictly.
The first non-whitespace character in the response should be \`{\`.
Use only the context below and do not invent records that are not supported by the prior answer.
Required schema:
{
  "schemaVersion": "hermes_space_seed/v1",
  "recipe": {
    "title": string,
    "subtitle": string?,
    "description": string?,
    "status": "idle" | "active" | "changed" | "archived" | "error"?
  },
  "rawData": {
    "kind": "raw_data",
    "schemaVersion": "recipe_raw_data/v1",
    "payload": object | array,
    "links": [],
    "paginationHints": [],
    "metadata": {}
  },
  "assistantContext": {
    "kind": "assistant_context",
    "schemaVersion": "recipe_assistant_context/v1",
    "summary": string,
    "responseLead": string?,
    "responseTail": string?,
    "links": [],
    "citations": [],
    "metadata": {}
  }
}
Optional fields are limited to intentHints, semanticHints, actionHints, or extensions.normalizedData.
Do not emit normalizedData, uiSpec, actionSpec, testSpec, or any final app-specific recipe layout schema unless it is inside an optional extension.
If any optional extension is uncertain, omit it instead of guessing.

${reissueInstruction}

Original user prompt:
${this.serializeStructuredContext(input.originalPrompt, 4_000)}

Recent assistant answer:
${this.serializeStructuredContext(input.assistantMarkdown, 8_000)}

Structured intent:
${intentSummary}

Current attached recipe:
${currentRecipeSummary}`;
  }

  private async emitStructuredRecipeArtifactProgress(
    profileId: string,
    sessionId: string,
    requestId: string,
    requestPreview: string,
    message: string,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void
  ) {
    this.appendPersistedRuntimeActivity(profileId, sessionId, requestId, requestPreview, {
      kind: 'status',
      state: 'updated',
      label: 'Recipe artifact',
      detail: message,
      requestId,
      timestamp: this.now()
    });
    await onEvent({
      type: 'progress',
      requestId,
      message
    });
  }

  private emitStructuredRecipeArtifactCompleted(
    profileId: string,
    sessionId: string,
    requestId: string,
    requestPreview: string,
    succeeded: boolean
  ) {
    this.appendPersistedRuntimeActivity(profileId, sessionId, requestId, requestPreview, {
      kind: 'status',
      state: succeeded ? 'completed' : 'failed',
      label: 'Recipe artifact',
      detail: succeeded ? 'Recipe generation completed.' : 'Recipe generation finished with errors.',
      requestId,
      timestamp: this.now()
    });
  }

  private describeStructuredRecipeArtifactFailure(
    extracted: HermesRecipeDataExtractionResult | null,
    fallbackDetail: string
  ) {
    if (!extracted) {
      return fallbackDetail;
    }

    return (
      extracted.errors.join('; ') ||
      (extracted.foundFence
        ? 'Hermes returned an unusable Hermes recipe-data block during structured artifact generation.'
        : extracted.strategy === 'direct_json'
          ? 'Hermes returned an unusable JSON artifact during structured artifact generation.'
          : 'Hermes did not return a JSON artifact or Hermes recipe-data start marker during structured artifact generation.')
    );
  }

  private getStructuredRecipeArtifactFailureTelemetry(
    extracted: HermesRecipeDataExtractionResult | null,
    fallbackDetail: string
  ) {
    const detail = this.describeStructuredRecipeArtifactFailure(extracted, fallbackDetail);
    switch (extracted?.failureKind ?? null) {
      case 'missing_marker':
        return {
          code: 'RECIPE_DATA_STRUCTURED_ONLY_FAILED_MARKER_MISSING',
          message: 'Structured-only generation did not emit a JSON artifact or compatibility start marker.',
          detail
        } as const;
      case 'empty_payload':
        return {
          code: 'RECIPE_DATA_STRUCTURED_ONLY_FAILED_EMPTY_PAYLOAD',
          message: 'Structured-only generation emitted an empty structured payload.',
          detail
        } as const;
      case 'json_missing':
        return {
          code: 'RECIPE_DATA_STRUCTURED_ONLY_FAILED_JSON_MISSING',
          message: 'Structured-only generation did not emit a usable JSON artifact.',
          detail
        } as const;
      case 'json_unbalanced':
        return {
          code: 'RECIPE_DATA_STRUCTURED_ONLY_FAILED_JSON_UNBALANCED',
          message: 'Structured-only generation emitted an unbalanced JSON artifact.',
          detail
        } as const;
      case 'json_invalid':
        return {
          code: 'RECIPE_DATA_STRUCTURED_ONLY_FAILED_JSON_INVALID',
          message: 'Structured-only generation emitted invalid JSON.',
          detail
        } as const;
      case 'schema_invalid':
        return {
          code: 'RECIPE_DATA_STRUCTURED_ONLY_FAILED_SCHEMA_INVALID',
          message: 'Structured-only generation emitted schema-invalid JSON.',
          detail
        } as const;
      default:
        return {
          code: 'RECIPE_DATA_STRUCTURED_ONLY_FAILED_REQUEST_ERROR',
          message: 'Structured-only generation did not produce a usable Hermes recipe-data payload.',
          detail
        } as const;
    }
  }

  private async requestStructuredRecipeArtifactAttempt(
    profile: Profile,
    session: Session,
    currentRecipe: Recipe | null,
    requestId: string,
    requestPreview: string,
    requestMode: ChatStreamRequest['mode'],
    prompt: string,
    refreshContext: {
      intentPrompt: string;
      source: 'recipe_metadata' | 'recipe_event' | 'session_history' | 'recipe_snapshot';
    } | null,
    settings: ReturnType<BridgeDatabase['getSettings']>,
    options: {
      source: 'structured_only' | 'structured_only_reissue';
    }
  ): Promise<{
    assistantMarkdown: string;
    extracted: HermesRecipeDataExtractionResult | null;
    errorDetail: string | null;
    startedAt: string;
    endedAt: string;
    elapsedMs: number;
    configuredTimeoutMs: number;
    recommendedTimeoutMs: number;
  }> {
    const attemptTimeoutMs = Math.max(15_000, Math.min(settings.recipeOperationTimeoutMs, DEFAULT_ASYNC_WORKRECIPE_APPLET_TIMEOUT_MS));
    const startedAt = this.now();

    try {
      const result = await this.options.hermesCli.streamChat({
        profile,
        runtimeSessionId: session.runtimeSessionId,
        content: prompt,
        requestMode,
        structuredArtifactOnly: true,
        spaceContext: currentRecipe ? this.buildRecipeChatContext(currentRecipe) : null,
        refreshContext,
        requestId,
        timeoutMs: attemptTimeoutMs,
        discoveryTimeoutMs: attemptTimeoutMs,
        nearbySearchTimeoutMs: attemptTimeoutMs,
        recipeOperationTimeoutMs: attemptTimeoutMs,
        unrestrictedTimeoutMs: attemptTimeoutMs,
        maxTurns: 1,
        unrestrictedAccessEnabled: false
      });
      const endedAt = this.now();
      const extracted = extractHermesRecipeDataEnvelope(result.assistantMarkdown, {
        mode: 'structured_only'
      });
      this.recordRecipeDataEnvelopeTelemetry(profile.id, session.id, requestId, requestPreview, currentRecipe?.id ?? null, extracted, {
        structuredRecipeRequired: true,
        source: options.source
      });

      return {
        assistantMarkdown: result.assistantMarkdown,
        extracted,
        errorDetail: null,
        startedAt,
        endedAt,
        elapsedMs: this.calculateElapsedMs(startedAt, endedAt),
        configuredTimeoutMs: attemptTimeoutMs,
        recommendedTimeoutMs: DEFAULT_ASYNC_WORKRECIPE_APPLET_TIMEOUT_MS
      };
    } catch (error) {
      const endedAt = this.now();
      return {
        assistantMarkdown: '',
        extracted: null,
        errorDetail: error instanceof Error ? error.message : 'The structured artifact generation call failed.',
        startedAt,
        endedAt,
        elapsedMs: this.calculateElapsedMs(startedAt, endedAt),
        configuredTimeoutMs: attemptTimeoutMs,
        recommendedTimeoutMs: DEFAULT_ASYNC_WORKRECIPE_APPLET_TIMEOUT_MS
      };
    }
  }

  private async generateStructuredRecipeArtifact(
    build: RecipeBuild,
    generationTrace: RecipeGenerationTrace,
    profile: Profile,
    session: Session,
    currentRecipe: Recipe | null,
    requestId: string,
    requestPreview: string,
    requestMode: ChatStreamRequest['mode'],
    originalPrompt: string,
    assistantMarkdown: string,
    structuredRecipeIntent: StructuredRecipeIntent | null,
    refreshContext: {
      intentPrompt: string;
      source: 'recipe_metadata' | 'recipe_event' | 'session_history' | 'recipe_snapshot';
    } | null,
    settings: ReturnType<BridgeDatabase['getSettings']>,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void,
    options: {
      isRetryBuild?: boolean;
      emitRepairTelemetry?: boolean;
    } = {}
  ): Promise<{
    assistantMarkdown: string;
    extracted: HermesRecipeDataExtractionResult | null;
    errorDetail: string | null;
  }> {
    await this.emitStructuredRecipeArtifactProgress(
      profile.id,
      session.id,
      requestId,
      requestPreview,
      options.isRetryBuild ? 'Retrying structured recipe generation…' : 'Generating structured recipe data…',
      onEvent
    );
    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_DATA_STRUCTURED_ONLY_STARTED',
      message: 'Started a dedicated structured-only Hermes artifact generation step.',
      detail: 'The bridge requested only the Hermes recipe-data artifact as a separate bounded step.',
      payload: {
        recipeId: currentRecipe?.id ?? null,
        requestPreview,
        intent: structuredRecipeIntent?.category ?? 'general',
        isRetryBuild: options.isRetryBuild ?? false
      }
    });
    if (options.emitRepairTelemetry) {
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: session.id,
        requestId,
        severity: 'info',
        category: 'recipes',
        code: 'RECIPE_DATA_BLOCK_REPAIR_ATTEMPTED',
        message: 'Attempting bounded Hermes repair calls for the malformed or missing recipe-data block.',
        detail: 'The assistant response did not yield a usable Hermes recipe-data payload.',
        payload: {
          recipeId: currentRecipe?.id ?? null,
          requestPreview,
          intent: structuredRecipeIntent?.category ?? 'general',
          maxAttempts: 3
        }
      });
      if (options.isRetryBuild) {
        this.recordTelemetry({
          profileId: profile.id,
          sessionId: session.id,
          requestId,
          severity: 'info',
          category: 'recipes',
          code: 'RECIPE_RETRY_BUILD_REPAIR_ATTEMPTED',
          message: 'Retry build attempted bounded structured-payload repair calls.',
          detail: 'The retry build did not receive a usable Hermes recipe-data payload.',
          payload: {
            recipeId: currentRecipe?.id ?? null,
            requestPreview,
            intent: structuredRecipeIntent?.category ?? 'general',
            maxAttempts: 3
          }
        });
      }
    }

    const retryOutcome = await this.runRecipeGenerationStageWithRetries<{
      assistantMarkdown: string;
      extracted: HermesRecipeDataExtractionResult;
    }>({
      build,
      trace: generationTrace,
      stage: 'structured_seed_generation',
      phase: build.phase,
      executeAttempt: async (attemptNumber, priorFailureDetail) => {
        if (attemptNumber > 1) {
          this.recordTelemetry({
            profileId: profile.id,
            sessionId: session.id,
            requestId,
            severity: 'info',
            category: 'recipes',
            code: 'RECIPE_DATA_STRUCTURED_ONLY_REISSUE_ATTEMPTED',
            message: `Attempting structured-only reissue ${attemptNumber}/3.`,
            detail:
              this.summarizeRecipeRetryReason(priorFailureDetail) ??
              'Retrying structured-only recipe seed generation after a failed prior attempt.',
            payload: {
              recipeId: currentRecipe?.id ?? null,
              requestPreview,
              intent: structuredRecipeIntent?.category ?? 'general',
              attemptNumber,
              maxAttempts: 3
            }
          });
          await this.emitStructuredRecipeArtifactProgress(
            profile.id,
            session.id,
            requestId,
            requestPreview,
            `Retrying structured recipe data (${attemptNumber}/3)…`,
            onEvent
          );
        }

        const attempt = await this.requestStructuredRecipeArtifactAttempt(
          profile,
          session,
          currentRecipe,
          requestId,
          requestPreview,
          requestMode,
          this.buildStructuredRecipeArtifactPrompt({
            originalPrompt,
            assistantMarkdown,
            intent: structuredRecipeIntent,
            currentRecipe,
            reissueFailureDetail: priorFailureDetail
          }),
          refreshContext,
          settings,
          {
            source: attemptNumber === 1 ? 'structured_only' : 'structured_only_reissue'
          }
        );

        if (attempt.extracted?.envelope) {
          this.recordTelemetry({
            profileId: profile.id,
            sessionId: session.id,
            requestId,
            severity: 'info',
            category: 'recipes',
            code: attemptNumber === 1 ? 'RECIPE_DATA_STRUCTURED_ONLY_SUCCEEDED' : 'RECIPE_DATA_STRUCTURED_ONLY_REISSUE_SUCCEEDED',
            message:
              attemptNumber === 1
                ? 'Structured-only generation emitted a valid Hermes recipe-data payload.'
                : 'Structured-only reissue emitted a valid Hermes recipe-data payload.',
            detail: attempt.extracted.recovered
              ? attemptNumber === 1
                ? 'The bridge recovered the structured-only payload from minor formatting issues and validated it.'
                : 'The bridge recovered the reissued structured-only payload from minor formatting issues and validated it.'
              : attemptNumber === 1
                ? 'The structured-only payload validated successfully.'
                : 'The reissued structured-only payload validated successfully.',
            payload: {
              recipeId: currentRecipe?.id ?? null,
              requestPreview,
              intent: structuredRecipeIntent?.category ?? 'general',
              attemptNumber,
              maxAttempts: 3
            }
          });

          return {
            value: {
              assistantMarkdown: attempt.assistantMarkdown,
              extracted: attempt.extracted
            },
            assistantMarkdown: attempt.assistantMarkdown,
            detail: '',
            startedAt: attempt.startedAt,
            endedAt: attempt.endedAt,
            elapsedMs: attempt.elapsedMs,
            configuredTimeoutMs: attempt.configuredTimeoutMs,
            recommendedTimeoutMs: attempt.recommendedTimeoutMs,
            failureReason: null,
            failureKind: null,
            retryable: false,
            autoRecoveryAttempted: attempt.extracted.parserDiagnostics.recoveryAttempted,
            autoRecoverySucceeded: attempt.extracted.parserDiagnostics.recoverySucceeded,
            parserDiagnostics: attempt.extracted.parserDiagnostics
          };
        }

        const failureTelemetry = this.getStructuredRecipeArtifactFailureTelemetry(
          attempt.extracted,
          attempt.errorDetail ?? 'The structured artifact generation call failed.'
        );
        this.recordTelemetry({
          profileId: profile.id,
          sessionId: session.id,
          requestId,
          severity: 'warning',
          category: 'recipes',
          code: attemptNumber === 1 ? failureTelemetry.code : 'RECIPE_DATA_STRUCTURED_ONLY_REISSUE_FAILED',
          message:
            attemptNumber === 1
              ? failureTelemetry.message
              : 'Structured-only reissue did not produce a usable Hermes recipe-data payload.',
          detail: failureTelemetry.detail,
          payload: {
            recipeId: currentRecipe?.id ?? null,
            requestPreview,
            intent: structuredRecipeIntent?.category ?? 'general',
            failureKind: attempt.extracted?.failureKind ?? null,
            cleanedAssistantPreview: attempt.extracted?.cleanedMarkdown.slice(0, 160) ?? null,
            attemptNumber,
            maxAttempts: 3,
            parserDiagnostics: attempt.extracted?.parserDiagnostics ?? null
          }
        });

        return {
          value: null,
          assistantMarkdown: attempt.assistantMarkdown,
          detail: failureTelemetry.detail,
          startedAt: attempt.startedAt,
          endedAt: attempt.endedAt,
          elapsedMs: attempt.elapsedMs,
          configuredTimeoutMs: attempt.configuredTimeoutMs,
          recommendedTimeoutMs: attempt.recommendedTimeoutMs,
          failureReason: null,
          failureKind: this.mapRecipeStructuredFailureKind(
            attempt.extracted?.failureKind ?? null,
            failureTelemetry.detail
          ),
          retryable: true,
          autoRecoveryAttempted: attempt.extracted?.parserDiagnostics.recoveryAttempted ?? false,
          autoRecoverySucceeded: attempt.extracted?.parserDiagnostics.recoverySucceeded ?? false,
          parserDiagnostics: attempt.extracted?.parserDiagnostics ?? null
        };
      }
    });

    if (retryOutcome.ok) {
      if (options.emitRepairTelemetry) {
        this.recordTelemetry({
          profileId: profile.id,
          sessionId: session.id,
          requestId,
          severity: 'info',
          category: 'recipes',
          code: 'RECIPE_DATA_BLOCK_REPAIR_SUCCEEDED',
          message: 'Hermes re-emitted a valid Hermes recipe-data block during the bounded repair step.',
          detail: retryOutcome.attemptResult.autoRecoverySucceeded
            ? 'The repair response was recovered from malformed formatting and validated successfully.'
            : 'The repair response validated successfully.',
          payload: {
            recipeId: currentRecipe?.id ?? null,
            requestPreview,
            intent: structuredRecipeIntent?.category ?? 'general',
            attemptsUsed: retryOutcome.attemptsUsed
          }
        });
        if (options.isRetryBuild) {
          this.recordTelemetry({
            profileId: profile.id,
            sessionId: session.id,
            requestId,
            severity: 'info',
            category: 'recipes',
            code: 'RECIPE_RETRY_BUILD_REPAIR_SUCCEEDED',
            message: 'Retry build recovered a valid Hermes recipe-data payload.',
            detail: retryOutcome.attemptResult.autoRecoverySucceeded
              ? 'The retry repair response was recovered from malformed formatting and validated successfully.'
              : 'The retry repair response validated successfully.',
            payload: {
              recipeId: currentRecipe?.id ?? null,
              requestPreview,
              intent: structuredRecipeIntent?.category ?? 'general',
              attemptsUsed: retryOutcome.attemptsUsed
            }
          });
        }
      }

      return {
        assistantMarkdown: retryOutcome.value.assistantMarkdown,
        extracted: retryOutcome.value.extracted,
        errorDetail: null
      };
    }

    if (options.emitRepairTelemetry) {
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: session.id,
        requestId,
        severity: 'warning',
        category: 'recipes',
        code: 'RECIPE_DATA_BLOCK_REPAIR_FAILED',
        message: 'Hermes did not repair the structured recipe-data block.',
        detail: retryOutcome.detail,
        payload: {
          recipeId: currentRecipe?.id ?? null,
          requestPreview,
          intent: structuredRecipeIntent?.category ?? 'general',
          attemptsUsed: retryOutcome.attemptsUsed
        }
      });
      if (options.isRetryBuild) {
        this.recordTelemetry({
          profileId: profile.id,
          sessionId: session.id,
          requestId,
          severity: 'warning',
          category: 'recipes',
          code: 'RECIPE_RETRY_BUILD_REPAIR_FAILED',
          message: 'Retry build did not recover a usable structured payload.',
          detail: retryOutcome.detail,
          payload: {
            recipeId: currentRecipe?.id ?? null,
            requestPreview,
            intent: structuredRecipeIntent?.category ?? 'general',
            attemptsUsed: retryOutcome.attemptsUsed
          }
        });
      }
    }

    return {
      assistantMarkdown: retryOutcome.attemptResult.assistantMarkdown,
      extracted: null,
      errorDetail: retryOutcome.detail
    };
  }

  private createRecipeAppletRenderContext(recipe: Recipe, context: RecipeAppletArtifactContext): RecipeAppletRenderContext {
    return {
      recipe: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        status: recipe.status,
        metadata: recipe.metadata
      },
      summary: context.summary,
      analysis: context.analysis,
      normalizedData: context.normalizedData,
      assistantContext: context.assistantContext,
      recipeModel: context.recipeModel
    };
  }

  private persistRecipeAppletBaseArtifacts(build: RecipeBuild, context: RecipeAppletArtifactContext, timestamp: string) {
    for (const artifact of [
      context.userPrompt,
      context.intent,
      context.rawData,
      context.assistantContext,
      context.analysis,
      context.normalizedData
    ]) {
      this.persistRecipeBuildArtifact(build, artifact, timestamp);
    }

    if (context.summary) {
      this.persistRecipeBuildArtifact(build, context.summary, timestamp);
    }
    if (context.fallback) {
      this.persistRecipeBuildArtifact(build, context.fallback, timestamp);
    }
    if (context.actionSpec) {
      this.persistRecipeBuildArtifact(build, context.actionSpec, timestamp);
    }
    if (context.recipeModel) {
      this.persistRecipeBuildArtifact(build, context.recipeModel, timestamp);
    }
    if (context.recipePatch) {
      this.persistRecipeBuildArtifact(build, context.recipePatch, timestamp);
    }
  }

  private persistRecipeTemplateBaseArtifacts(build: RecipeBuild, context: RecipeTemplateArtifactContext, timestamp: string) {
    for (const artifact of [
      context.userPrompt,
      context.intent,
      context.rawData,
      context.assistantContext,
      context.analysis,
      context.normalizedData
    ]) {
      this.persistRecipeBuildArtifact(build, artifact, timestamp);
    }

    if (context.summary) {
      this.persistRecipeBuildArtifact(build, context.summary, timestamp);
    }

    if (context.fallback) {
      this.persistRecipeBuildArtifact(build, context.fallback, timestamp);
    }

    if (context.currentTemplate) {
      this.persistRecipeBuildArtifact(build, context.currentTemplate, timestamp);
    }
  }

  private buildRecipeTemplateAssistantContextPacket(assistantContext: RecipeAssistantContext) {
    return {
      summary: assistantContext.summary,
      responseLead: assistantContext.responseLead,
      responseTail: assistantContext.responseTail,
      links: assistantContext.links,
      citations: assistantContext.citations
    };
  }

  private resolveRecipeTemplateAssistantMarkdown(context: RecipeTemplateArtifactContext) {
    const fullResponseMarkdown =
      typeof context.assistantContext.metadata.fullResponseMarkdown === 'string'
        ? context.assistantContext.metadata.fullResponseMarkdown.trim()
        : '';
    if (fullResponseMarkdown.length > 0) {
      return fullResponseMarkdown;
    }

    return [context.assistantContext.responseLead, context.assistantContext.responseTail].filter(Boolean).join('\n\n').trim();
  }

  private buildRecipeDslPrompt(input: {
    context: RecipeAppletArtifactContext;
    currentRecipe: Recipe;
  }) {
    const recipeModel = input.context.recipeModel;
    const contractPacket = createRecipeDslContractPacket({
      allowedActionIds: input.context.actionSpec?.actions.map((action) => action.id) ?? [],
      allowedDatasetIds:
        recipeModel?.collections.map((collection) => collection.id) ??
        input.context.normalizedData.datasets.map((dataset) => dataset.id),
      allowedSectionIds: recipeModel?.sections.map((section) => section.id) ?? []
    });

    return `Bridge execution note: Generate the Hermes Home recipe enrichment authoring DSL.
This is an artifact-only post-processing step. The Hermes task is already complete.
Return only one JSON object and nothing else.

Rules:
- Work only from the persisted artifacts and local bridge context in this prompt.
- Never redo the task, check email again, rerun search/discovery, refresh the recipe, fetch more data, or modify external systems.
- Never use tools, skills, commands, code execution, approvals, or outbound requests.
- Emit the compact authoring DSL only: kind "recipe_dsl", schemaVersion "recipe_dsl/v2".
- Do not emit TSX, views, entities, collections, action definitions, the final recipe_model, or recipe_patch.
- Tabs own sectionIds. Datasets are high-level hints over existing dataset ids. Sections stay semantic and compact.
- Reuse the allowed dataset ids, action ids, and stable section ids from this prompt whenever possible.
- Keep the layout compact for a narrow attached recipe pane.
- If context is incomplete, emit a minimal valid DSL overlay instead of inventing unsupported fields.

Compact contract packet:
${this.serializeStructuredContext(contractPacket, 9_000)}

Current Home recipe:
${this.serializeStructuredContext(
      {
        title: input.currentRecipe.title,
        description: input.currentRecipe.description,
        status: input.currentRecipe.status,
        summary: input.context.summary?.subtitle ?? input.context.assistantContext.summary
      },
      1_500
    )}

Intent summary:
${this.serializeStructuredContext(
      {
        category: input.context.intent.category,
        label: input.context.intent.label,
        summary: input.context.intent.summary,
        preferredPresentation: input.context.intent.preferredPresentation
      },
      1_500
    )}

Allowed actions:
${this.serializeStructuredContext(
      {
        actions:
          input.context.actionSpec?.actions.map((action) => ({
            id: action.id,
            label: action.label,
            kind: action.kind,
            description: action.description,
            selection: action.visibility.requiresSelection,
            whenBuildReady: action.visibility.whenBuildReady,
            datasetId: action.visibility.datasetId ?? null,
            handler: action.bridge?.handler ?? null,
            capabilityId: action.bridge?.capabilityId ?? null
          })) ?? []
      },
      4_000
    )}

Baseline recipe model snapshot:
${this.serializeStructuredContext(
      {
        sdkVersion: recipeModel?.sdkVersion ?? 'recipe_sdk/v1',
        revision: recipeModel?.revision ?? null,
        title: recipeModel?.title ?? input.currentRecipe.title,
        subtitle: recipeModel?.subtitle ?? null,
        activeTabId: recipeModel?.state.activeTabId ?? null,
        tabs: recipeModel?.tabs ?? [],
        views: recipeModel?.views ?? [],
        sections: recipeModel?.sections ?? [],
        collections: recipeModel?.collections ?? [],
        entities: recipeModel?.entities.map((entity) => ({
          id: entity.id,
          kind: entity.kind,
          title: entity.title,
          subtitle: entity.subtitle,
          badges: entity.badges,
          hasImage: Boolean(entity.image)
        })) ?? []
      },
      8_500
    )}

Baseline patch snapshot:
${this.serializeStructuredContext(input.context.recipePatch, 4_000)}

Normalized data snapshot:
${this.serializeStructuredContext(
      {
        primaryDatasetId: input.context.normalizedData.primaryDatasetId,
        datasets: input.context.normalizedData.datasets
      },
      5_000
    )}

Assistant response summary:
${this.serializeStructuredContext(input.context.assistantContext, 2_500)}`;
  }

  private buildRecipeDslRepairPrompt(input: {
    invalidDsl: string;
    errors: string[];
  }) {
    return `Bridge execution note: Repair the invalid Hermes Home recipe authoring DSL.
This is an artifact-only repair step. The original Hermes task is already complete.
Return only one corrected JSON object and nothing else.

Repair rules:
- Repair only the JSON artifact below.
- Do not add prose, markdown fences, comments, TSX, tool calls, live-task instructions, or unsupported keys.
- Keep stable ids when possible.

Invalid DSL:
${this.serializeStructuredContext(input.invalidDsl, 12_000)}

Validation errors:
${this.serializeStructuredContext(input.errors, 5_000)}

Relevant contract excerpt:
${this.serializeStructuredContext(createRecipeDslRepairExcerpt(input.errors), 6_000)}`;
  }

  private async requestRecipeDslStage(
    profile: Profile,
    requestId: string,
    prompt: string,
    stage: 'generate' | 'repair',
    settings: ReturnType<BridgeDatabase['getSettings']>
  ): Promise<{
    assistantMarkdown: string;
    errorDetail: string | null;
    failureReason: 'live_task_violation' | 'context_invalid' | null;
  }> {
    const timeoutMs = this.resolveAsyncRecipeAppletTimeoutMs(settings);
    try {
      const result = await this.options.hermesCli.generateRecipeDslArtifact({
        profile,
        prompt,
        stage,
        requestId,
        timeoutMs
      });
      return {
        assistantMarkdown: result.assistantMarkdown,
        errorDetail: null,
        failureReason: null
      };
    } catch (error) {
      return {
        assistantMarkdown: '',
        errorDetail: error instanceof Error ? error.message : `Recipe DSL ${stage} request failed.`,
        failureReason:
          error instanceof Error && error.name === 'HermesCliRecipeAppletViolationError'
            ? 'live_task_violation'
            : error instanceof Error && error.name === 'HermesCliRecipeAppletContextError'
              ? 'context_invalid'
              : null
      };
    }
  }

  private buildRecipeTemplateSelectionPrompt(input: {
    context: RecipeTemplateArtifactContext;
    currentRecipe: Recipe;
    mutationIntent?: RecipeMutationIntent | null;
  }) {
    const assistantMarkdown = this.resolveRecipeTemplateAssistantMarkdown(input.context);
    const mutationBlock = input.mutationIntent
      ? `\n\nCRITICAL — USER REQUESTED A RECIPE MUTATION (do not ignore):
The user explicitly asked to change how their current recipe looks or is structured.
Mutation kind: ${input.mutationIntent.kind}
Visual preferences: ${[
          input.mutationIntent.wantsImages && 'images/photos',
          input.mutationIntent.wantsCards && 'cards/tiles',
          input.mutationIntent.wantsCharts && 'charts',
          input.mutationIntent.wantsTable && 'table/matrix',
          input.mutationIntent.wantsKanban && 'kanban board',
          input.mutationIntent.wantsTimeline && 'timeline',
          input.mutationIntent.wantsFewerItems && 'fewer items',
          input.mutationIntent.wantsMoreItems && 'more items'
        ].filter(Boolean).join(', ') || 'none specified'}
Suggested template: ${input.mutationIntent.targetTemplateHint ?? 'let the selection LLM decide based on preferences'}
Mutation summary: "${input.mutationIntent.mutationSummary}"
Action: You MUST select a template that satisfies these preferences. Use mode=switch if changing templates, mode=update if keeping the same template but changing structure.`
      : '';
    return `Bridge execution note: Select the approved recipe template for Hermes Home enrichment.${mutationBlock}
This is an artifact-only post-processing step. The Hermes task is already complete.
Return only one JSON object and nothing else.

Rules:
- Choose exactly one template id from the approved registry packet below.
- Never invent a new template id or freeform layout.
- Return only the tiny selection artifact keys from the contract packet.
- Set mode to fill, update, or switch.
- Do not generate content text, sections, buttons, actions, or links in this stage.

Approved template registry:
${this.serializeStructuredContext(createRecipeTemplateSelectionPacket(), 10_000)}

Current Home recipe:
${this.serializeStructuredContext(
      {
        title: input.currentRecipe.title,
        description: input.currentRecipe.description,
        currentTemplateId: input.context.currentTemplate?.templateId ?? null,
        summary: input.context.summary?.subtitle ?? input.context.assistantContext.summary
      },
      2_500
    )}

Intent summary:
${this.serializeStructuredContext(
      {
        category: input.context.intent.category,
        label: input.context.intent.label,
        summary: input.context.intent.summary,
        preferredPresentation: input.context.intent.preferredPresentation
      },
      2_000
    )}

Assistant response summary:
${this.serializeStructuredContext(this.buildRecipeTemplateAssistantContextPacket(input.context.assistantContext), 2_500)}

Assistant response markdown:
${this.serializeStructuredContext(assistantMarkdown, 8_000)}

Current template state:
${this.serializeStructuredContext(input.context.currentTemplate, 6_000)}`;
  }

  private buildRecipeTemplateTextPrompt(input: {
    context: RecipeTemplateArtifactContext;
    currentRecipe: Recipe;
    selection: RecipeTemplateSelection;
  }) {
    const assistantMarkdown = this.resolveRecipeTemplateAssistantMarkdown(input.context);
    return `Bridge execution note: Generate the staged text/content artifact for the selected approved recipe template.
This is an artifact-only post-processing step. The Hermes task is already complete.
Return only one JSON object and nothing else.

CANONICAL SCHEMA (follow this exactly — this is the authoritative contract):
${this.serializeStructuredContext(createRecipeTemplateTextPacket(input.selection.templateId), 12_000)}

Selected template:
${this.serializeStructuredContext(input.selection, 1_500)}

Schema compliance rules:
- Return recipe_template_text JSON only.
- Use ONLY the top-level keys and template-specific data keys listed in the canonical schema above.
- Place template-specific fields directly under "data". NEVER wrap them in "data.data".
- NEVER rename canonical keys (e.g. do not use columnLabels, comparisonRows, shortlistItems, items, hotels, restaurants, places instead of the canonical names).
- NEVER emit slot ids, rendered sections, recipe_dsl, recipe_model, recipe_patch, TSX, or freeform layouts.
- Establish titles, summaries, tab labels, section labels, descriptions, notes, list wording, and non-interactive content scaffolding only.
- The later hydration stage will populate the concrete primary rows, cards, groups, timeline items, and checklist items.
- Leave links/button metadata empty. Do not populate hrefs, button labels, action ids, or link arrays with real values in this stage.

Current Home recipe:
${this.serializeStructuredContext(
      {
        title: input.currentRecipe.title,
        description: input.currentRecipe.description,
        currentTemplateId: input.context.currentTemplate?.templateId ?? null,
        summary: input.context.summary?.subtitle ?? input.context.assistantContext.summary
      },
      2_000
    )}

Normalized data snapshot:
${this.serializeStructuredContext(
      {
        primaryDatasetId: input.context.normalizedData.primaryDatasetId,
        datasets: input.context.normalizedData.datasets
      },
      10_000
    )}

Raw data snapshot:
${this.serializeStructuredContext(
      {
        payload: input.context.rawData.payload,
        links: input.context.rawData.links,
        metadata: input.context.rawData.metadata
      },
      10_000
    )}

Assistant response context:
${this.serializeStructuredContext(this.buildRecipeTemplateAssistantContextPacket(input.context.assistantContext), 3_500)}

Assistant response markdown:
${this.serializeStructuredContext(assistantMarkdown, 18_000)}

Current template state:
${this.serializeStructuredContext(input.context.currentTemplate, 6_000)}`;
  }

  private buildRecipeTemplateHydrationPrompt(input: {
    context: RecipeTemplateArtifactContext;
    currentRecipe: Recipe;
    selection: RecipeTemplateSelection;
    textArtifact: RecipeTemplateText;
  }) {
    const assistantMarkdown = this.resolveRecipeTemplateAssistantMarkdown(input.context);
    return `Bridge execution note: Generate the staged hydration artifact for the selected approved recipe template.
This is an artifact-only post-processing step. The Hermes task is already complete.
Return only one JSON object and nothing else.

CANONICAL SCHEMA (follow this exactly — this is the authoritative contract):
${this.serializeStructuredContext(createRecipeTemplateHydrationPacket(input.selection.templateId), 12_000)}

Selected template:
${this.serializeStructuredContext(input.selection, 1_500)}

Staged text artifact:
${this.serializeStructuredContext(input.textArtifact, 9_000)}

Schema compliance rules:
- Return only recipe_template_hydration JSON.
- Use the full assistant response and persisted data snapshots to populate the primary template content collections.
- Populate the concrete rows, cards, groups, notes, timeline items, detail fields, and checklist items needed for the selected template.
- Place template-specific fields directly under "data". NEVER wrap them in "data.data".
- NEVER rename canonical keys (e.g. do not use columnLabels, comparisonRows, shortlistItems, items, hotels, restaurants, places instead of the canonical names).
- Do NOT leave all primary collections empty — schema-valid but empty templates are rejected.
- Do not emit rendered sections, recipe_template_state, recipe_dsl, recipe_model, recipe_patch, TSX, or freeform layouts.
- Do not add links, hrefs, button labels, action ids, or link arrays with real values in this stage.
- If the selected template cannot be meaningfully populated from the persisted context, do not invent unsupported structure.

Current Home recipe:
${this.serializeStructuredContext(
      {
        title: input.currentRecipe.title,
        description: input.currentRecipe.description,
        currentTemplateId: input.context.currentTemplate?.templateId ?? null,
        summary: input.context.summary?.subtitle ?? input.context.assistantContext.summary
      },
      2_000
    )}

Normalized data snapshot:
${this.serializeStructuredContext(
      {
        primaryDatasetId: input.context.normalizedData.primaryDatasetId,
        datasets: input.context.normalizedData.datasets
      },
      12_000
    )}

Raw data snapshot:
${this.serializeStructuredContext(
      {
        payload: input.context.rawData.payload,
        links: input.context.rawData.links,
        metadata: input.context.rawData.metadata
      },
      12_000
    )}

Assistant response context:
${this.serializeStructuredContext(this.buildRecipeTemplateAssistantContextPacket(input.context.assistantContext), 3_500)}

Assistant response markdown:
${this.serializeStructuredContext(assistantMarkdown, 18_000)}

Current template state:
${this.serializeStructuredContext(input.context.currentTemplate, 8_000)}`;
  }

  private buildRecipeTemplateActionsPrompt(input: {
    context: RecipeTemplateArtifactContext;
    currentRecipe: Recipe;
    selection: RecipeTemplateSelection;
    hydratedTextArtifact: RecipeTemplateText;
  }) {
    const assistantMarkdown = this.resolveRecipeTemplateAssistantMarkdown(input.context);
    return `Bridge execution note: Generate the staged actions/buttons artifact for the selected approved recipe template.
This is an artifact-only post-processing step. The Hermes task is already complete.
Return only one JSON object and nothing else.

CANONICAL SCHEMA (follow this exactly — this is the authoritative contract):
${this.serializeStructuredContext(createRecipeTemplateActionsPacket(input.hydratedTextArtifact), 12_000)}

Selected template:
${this.serializeStructuredContext(input.selection, 1_500)}

Hydrated content artifact:
${this.serializeStructuredContext(input.hydratedTextArtifact, 9_000)}

Schema compliance rules:
- Return only recipe_template_actions JSON.
- Add only links, action metadata, and button/link affordances that are valid for the existing hydrated content artifact.
- Use only ids, field labels, and collections that already exist in the hydrated content artifact above.
- Place action-related fields directly under "data". NEVER wrap them in "data.data".
- Do not rewrite titles, summaries, tabs, labels, notes, or other text/content fields.
- Do not emit rendered sections, recipe_template_state, recipe_dsl, recipe_model, recipe_patch, TSX, or freeform layouts.

Current Home recipe:
${this.serializeStructuredContext(
      {
        title: input.currentRecipe.title,
        description: input.currentRecipe.description,
        currentTemplateId: input.context.currentTemplate?.templateId ?? null,
        summary: input.context.summary?.subtitle ?? input.context.assistantContext.summary
      },
      2_000
    )}

Current template state:
${this.serializeStructuredContext(input.context.currentTemplate, 10_000)}

Normalized data snapshot:
${this.serializeStructuredContext(
      {
        primaryDatasetId: input.context.normalizedData.primaryDatasetId,
        datasets: input.context.normalizedData.datasets
      },
      7_000
    )}

Assistant response context:
${this.serializeStructuredContext(this.buildRecipeTemplateAssistantContextPacket(input.context.assistantContext), 3_000)}

Assistant response markdown:
${this.serializeStructuredContext(assistantMarkdown, 8_000)}`;
  }

  private buildRecipeTemplateTextRepairPrompt(input: {
    templateId: RecipeTemplateId;
    invalidJson: string;
    validationErrors: string[];
  }) {
    return `Bridge execution note: Repair the invalid staged recipe template text/content artifact.
This is an artifact-only repair step. The original Hermes task is already complete.
Return only one repaired JSON object and nothing else.

Rules:
- Repair only the JSON artifact shown below.
- Do not change the template id.
- Do not use tools, skills, commands, code execution, approvals, or outbound requests.
- Do not redo the task, fetch data again, or invent a different layout.
- Repair only text/content structure. Leave links/button metadata empty.
- Return JSON only.

Invalid JSON artifact:
${input.invalidJson}

Validation errors:
${input.validationErrors.map((error) => `- ${error}`).join('\n')}

Relevant contract excerpt:
${this.serializeStructuredContext(createRecipeTemplateTextPacket(input.templateId), 8_000)}`;
  }

  private buildRecipeTemplateActionsRepairPrompt(input: {
    templateId: RecipeTemplateId;
    invalidJson: string;
    validationErrors: string[];
    hydratedTextArtifact: RecipeTemplateText;
  }) {
    return `Bridge execution note: Repair the invalid staged recipe template actions/buttons artifact.
This is an artifact-only repair step. The original Hermes task is already complete.
Return only one repaired JSON object and nothing else.

Rules:
- Repair only the JSON artifact shown below.
- Do not change the template id.
- Do not use tools, skills, commands, code execution, approvals, or outbound requests.
- Do not redo the task, fetch data again, or rewrite the hydrated content artifact.
- Keep all ids and field labels aligned with the hydrated content artifact.
- Return JSON only.

Hydrated content artifact:
${this.serializeStructuredContext(input.hydratedTextArtifact, 9_000)}

Invalid JSON artifact:
${input.invalidJson}

Validation errors:
${input.validationErrors.map((error) => `- ${error}`).join('\n')}

Relevant contract excerpt:
${this.serializeStructuredContext(createRecipeTemplateActionsPacket(input.hydratedTextArtifact), 8_000)}`;
  }

  private buildRecipeSameSessionCorrectionPrompt(input: {
    stage: 'select' | 'text' | 'hydrate' | 'actions';
    templateId: RecipeTemplateId;
    invalidJson: string;
    validationErrors: string[];
    correctionTurn: number;
    contractPacket: unknown;
  }) {
    const stageLabel =
      input.stage === 'select'
        ? 'template selection'
        : input.stage === 'text'
          ? 'text/content'
          : input.stage === 'hydrate'
            ? 'hydration'
            : 'actions/buttons';

    return `SAME-SESSION CORRECTION (turn ${input.correctionTurn} of 2)

Your previous response in this session did NOT match the required schema for the ${stageLabel} stage.

Exact validation errors:
${input.validationErrors.map((error) => `- ${error}`).join('\n')}

Your invalid output was:
${input.invalidJson.length > 4_000 ? `${input.invalidJson.slice(0, 3_997)}...` : input.invalidJson}

REQUIRED canonical schema (this is authoritative — follow it exactly):
${this.serializeStructuredContext(input.contractPacket, 12_000)}

Common wrong shapes to AVOID:
- Do NOT wrap data inside data.data
- Do NOT rename canonical keys (e.g. do not use columnLabels instead of columns, comparisonRows instead of rows)
- Do NOT invent wrapper objects not present in the schema
- Do NOT emit rendered sections, recipe_dsl, recipe_model, or freeform layouts

Fix instructions:
- Fix ONLY the schema shape errors listed above.
- Preserve the semantic meaning and content from your previous response.
- Return ONLY corrected JSON with no prose, markdown fences, or trailing text.
- The corrected JSON must pass the canonical schema validation exactly.`;
  }

  private describeRecipeTemplateStageTimeout(
    settings: ReturnType<BridgeDatabase['getSettings']>,
    stage: 'select' | 'text' | 'hydrate' | 'actions' | 'text_repair' | 'actions_repair'
  ) {
    void stage;
    const configuredCap = this.resolveAsyncRecipeAppletTimeoutMs(settings);
    const recommended = DEFAULT_ASYNC_WORKRECIPE_APPLET_TIMEOUT_MS; // TEMP(troubleshooting): keep every template-generation stage capped at 90s until real-hit-rate diagnostics are collected.
    return {
      configuredTimeoutMs: Math.max(8_000, Math.min(configuredCap, recommended)),
      recommendedTimeoutMs: recommended
    };
  }

  private async requestRecipeTemplateStage(
    profile: Profile,
    requestId: string,
    prompt: string,
    stage: 'select' | 'text' | 'hydrate' | 'actions' | 'text_repair' | 'actions_repair',
    settings: ReturnType<BridgeDatabase['getSettings']>,
    onAssistantSnapshot?: ((markdown: string) => void) | null
  ): Promise<{
    assistantMarkdown: string;
    errorDetail: string | null;
    failureReason: 'live_task_violation' | 'context_invalid' | null;
    startedAt: string;
    endedAt: string;
    elapsedMs: number;
    configuredTimeoutMs: number;
    recommendedTimeoutMs: number;
    runtimeSessionId: string | null;
  }> {
    const timeoutPolicy = this.describeRecipeTemplateStageTimeout(settings, stage);
    const startedAt = this.now();
    try {
      const result = await this.options.hermesCli.generateRecipeTemplateArtifact({
        profile,
        prompt,
        stage,
        requestId,
        timeoutMs: timeoutPolicy.configuredTimeoutMs,
        onAssistantSnapshot: onAssistantSnapshot ?? undefined
      });
      const endedAt = this.now();
      return {
        assistantMarkdown: result.assistantMarkdown,
        errorDetail: null,
        failureReason: null,
        startedAt,
        endedAt,
        elapsedMs: this.calculateElapsedMs(startedAt, endedAt),
        configuredTimeoutMs: timeoutPolicy.configuredTimeoutMs,
        recommendedTimeoutMs: timeoutPolicy.recommendedTimeoutMs,
        runtimeSessionId: result.runtimeSessionId ?? null
      };
    } catch (error) {
      const endedAt = this.now();
      return {
        assistantMarkdown: '',
        errorDetail: error instanceof Error ? error.message : `Recipe template ${stage} request failed.`,
        failureReason:
          error instanceof Error && error.name === 'HermesCliRecipeAppletViolationError'
            ? 'live_task_violation'
            : error instanceof Error && error.name === 'HermesCliRecipeAppletContextError'
              ? 'context_invalid'
              : null,
        startedAt,
        endedAt,
        elapsedMs: this.calculateElapsedMs(startedAt, endedAt),
        configuredTimeoutMs: timeoutPolicy.configuredTimeoutMs,
        recommendedTimeoutMs: timeoutPolicy.recommendedTimeoutMs,
        runtimeSessionId: null
      };
    }
  }

  private async requestRecipeTemplateSameSessionCorrection(
    profile: Profile,
    requestId: string,
    correctionPrompt: string,
    stage: 'select' | 'text' | 'hydrate' | 'actions' | 'text_repair' | 'actions_repair',
    sessionId: string,
    settings: ReturnType<BridgeDatabase['getSettings']>
  ): Promise<{
    assistantMarkdown: string;
    errorDetail: string | null;
    failureReason: 'live_task_violation' | 'context_invalid' | null;
    startedAt: string;
    endedAt: string;
    elapsedMs: number;
    configuredTimeoutMs: number;
    recommendedTimeoutMs: number;
    runtimeSessionId: string | null;
  }> {
    const timeoutPolicy = this.describeRecipeTemplateStageTimeout(settings, stage);
    const startedAt = this.now();
    try {
      const result = await this.options.hermesCli.generateRecipeTemplateArtifactCorrection({
        profile,
        correctionPrompt,
        sessionId,
        stage,
        requestId,
        timeoutMs: timeoutPolicy.configuredTimeoutMs
      });
      const endedAt = this.now();
      return {
        assistantMarkdown: result.assistantMarkdown,
        errorDetail: null,
        failureReason: null,
        startedAt,
        endedAt,
        elapsedMs: this.calculateElapsedMs(startedAt, endedAt),
        configuredTimeoutMs: timeoutPolicy.configuredTimeoutMs,
        recommendedTimeoutMs: timeoutPolicy.recommendedTimeoutMs,
        runtimeSessionId: result.runtimeSessionId ?? null
      };
    } catch (error) {
      const endedAt = this.now();
      return {
        assistantMarkdown: '',
        errorDetail: error instanceof Error ? error.message : `Recipe template ${stage} correction failed.`,
        failureReason:
          error instanceof Error && error.name === 'HermesCliRecipeAppletViolationError'
            ? 'live_task_violation'
            : error instanceof Error && error.name === 'HermesCliRecipeAppletContextError'
              ? 'context_invalid'
              : null,
        startedAt,
        endedAt,
        elapsedMs: this.calculateElapsedMs(startedAt, endedAt),
        configuredTimeoutMs: timeoutPolicy.configuredTimeoutMs,
        recommendedTimeoutMs: timeoutPolicy.recommendedTimeoutMs,
        runtimeSessionId: null
      };
    }
  }

  private async attemptSameSessionCorrection<T>(input: {
    profile: Profile;
    requestId: string;
    sessionId: string;
    stage: 'select' | 'text' | 'hydrate' | 'actions';
    templateId: RecipeTemplateId;
    invalidJson: string;
    validationErrors: string[];
    contractPacket: unknown;
    settings: ReturnType<BridgeDatabase['getSettings']>;
    extractAndValidate: (assistantMarkdown: string) => {
      value: T | null;
      errors: string[];
      invalidJson: string | null;
    };
    build: RecipeBuild;
  }): Promise<{
    value: T | null;
    correctionTurns: number;
    correctionErrors: string[];
    correctionFixed: boolean;
    lastAssistantMarkdown: string;
    lastInvalidJson: string | null;
  }> {
    const maxCorrectionTurns = 2;
    const correctionErrors: string[] = [];
    let currentInvalidJson = input.invalidJson;
    let currentErrors = input.validationErrors;
    let lastAssistantMarkdown = '';

    for (let turn = 1; turn <= maxCorrectionTurns; turn += 1) {
      const correctionPrompt = this.buildRecipeSameSessionCorrectionPrompt({
        stage: input.stage,
        templateId: input.templateId,
        invalidJson: currentInvalidJson,
        validationErrors: currentErrors,
        correctionTurn: turn,
        contractPacket: input.contractPacket
      });

      this.appendStructuredRecipeBuildLog(
        input.build,
        input.build.phase,
        'info',
        `Same-session correction turn ${turn} for ${input.stage} stage.`,
        {
          recordType: 'recipe_same_session_correction',
          buildId: input.build.id,
          stage: input.stage,
          correctionTurn: turn,
          validationErrors: currentErrors,
          templateId: input.templateId
        }
      );

      const correctionResponse = await this.requestRecipeTemplateSameSessionCorrection(
        input.profile,
        input.requestId,
        correctionPrompt,
        input.stage,
        input.sessionId,
        input.settings
      );

      if (correctionResponse.errorDetail) {
        correctionErrors.push(`correction_turn_${turn}: ${correctionResponse.errorDetail}`);
        lastAssistantMarkdown = correctionResponse.assistantMarkdown;
        continue;
      }

      lastAssistantMarkdown = correctionResponse.assistantMarkdown;
      const result = input.extractAndValidate(correctionResponse.assistantMarkdown);

      if (result.value !== null) {
        this.appendStructuredRecipeBuildLog(
          input.build,
          input.build.phase,
          'info',
          `Same-session correction succeeded on turn ${turn} for ${input.stage} stage.`,
          {
            recordType: 'recipe_same_session_correction_result',
            buildId: input.build.id,
            stage: input.stage,
            correctionTurn: turn,
            correctionFixed: true,
            templateId: input.templateId
          }
        );

        return {
          value: result.value,
          correctionTurns: turn,
          correctionErrors,
          correctionFixed: true,
          lastAssistantMarkdown,
          lastInvalidJson: null
        };
      }

      correctionErrors.push(`correction_turn_${turn}: ${result.errors.join('; ')}`);
      currentInvalidJson = result.invalidJson ?? correctionResponse.assistantMarkdown;
      currentErrors = result.errors;
    }

    this.appendStructuredRecipeBuildLog(
      input.build,
      input.build.phase,
      'warning',
      `Same-session correction exhausted ${maxCorrectionTurns} turns for ${input.stage} stage without fixing schema.`,
      {
        recordType: 'recipe_same_session_correction_result',
        buildId: input.build.id,
        stage: input.stage,
        correctionTurns: maxCorrectionTurns,
        correctionFixed: false,
        correctionErrors,
        templateId: input.templateId
      }
    );

    return {
      value: null,
      correctionTurns: maxCorrectionTurns,
      correctionErrors,
      correctionFixed: false,
      lastAssistantMarkdown,
      lastInvalidJson: currentInvalidJson
    };
  }

  private async attemptRecipeTemplateTextRepair(input: {
    profile: Profile;
    requestId: string;
    templateId: RecipeTemplateId;
    invalidJson: string;
    validationErrors: string[];
    settings: ReturnType<BridgeDatabase['getSettings']>;
    assistantSummary?: string | null;
  }) {
    const repairResponse = await this.requestRecipeTemplateStage(
      input.profile,
      input.requestId,
      this.buildRecipeTemplateTextRepairPrompt({
        templateId: input.templateId,
        invalidJson: input.invalidJson,
        validationErrors: input.validationErrors
      }),
      'text_repair',
      input.settings
    );
    const extractedRepair = extractRecipeTemplateTextArtifact(repairResponse.assistantMarkdown);
    const normalizedRepair =
      extractedRepair.rawValue !== null
        ? normalizeRecipeTemplateText({
            templateId: input.templateId,
            rawValue: extractedRepair.rawValue,
            assistantSummary: input.assistantSummary ?? null
          })
        : {
            text: null,
            errors: extractedRepair.errors,
            warnings: extractedRepair.warnings,
            repairs: {
              droppedKeys: [],
              aliasMappings: [],
              defaultedFields: [],
              normalizedValues: []
            }
          };

    return {
      text: normalizedRepair.text,
      detail:
        (repairResponse.errorDetail ?? [...extractedRepair.errors, ...normalizedRepair.errors].join('; ')) ||
        'The bounded template text/content repair did not return valid JSON.'
    };
  }

  private async attemptRecipeTemplateActionsRepair(input: {
    profile: Profile;
    requestId: string;
    templateId: RecipeTemplateId;
    invalidJson: string;
    validationErrors: string[];
    settings: ReturnType<BridgeDatabase['getSettings']>;
    hydratedTextArtifact: RecipeTemplateText;
    assistantSummary?: string | null;
  }) {
    const repairResponse = await this.requestRecipeTemplateStage(
      input.profile,
      input.requestId,
      this.buildRecipeTemplateActionsRepairPrompt({
        templateId: input.templateId,
        invalidJson: input.invalidJson,
        validationErrors: input.validationErrors,
        hydratedTextArtifact: input.hydratedTextArtifact
      }),
      'actions_repair',
      input.settings
    );
    const extractedRepair = extractRecipeTemplateActionsArtifact(repairResponse.assistantMarkdown);
    const normalizedRepair =
      extractedRepair.rawValue !== null
            ? normalizeRecipeTemplateActions({
                templateId: input.templateId,
                rawValue: extractedRepair.rawValue,
                text: input.hydratedTextArtifact,
                assistantSummary: input.assistantSummary ?? null
              })
        : {
            actions: null,
            errors: extractedRepair.errors,
            warnings: extractedRepair.warnings,
            repairs: {
              droppedKeys: [],
              aliasMappings: [],
              defaultedFields: [],
              normalizedValues: []
            }
          };

    return {
      actions: normalizedRepair.actions,
      detail:
        (repairResponse.errorDetail ?? [...extractedRepair.errors, ...normalizedRepair.errors].join('; ')) ||
        'The bounded template actions/buttons repair did not return valid JSON.'
    };
  }

  private synthesizeRecipeAppletArtifacts(input: {
    context: RecipeAppletArtifactContext;
    currentRecipe: Recipe;
    sourceArtifact: RecipeAppletSourceArtifact;
  }): {
    manifest: RecipeAppletManifest | null;
    plan: RecipeAppletPlan | null;
    testArtifact: RecipeAppletTestSourceArtifact | null;
    errors: string[];
    warnings: string[];
  } {
    const analysis = analyzeRecipeAppletModule(input.sourceArtifact.source, {
      fileName: 'applet.tsx',
      kind: 'source'
    });
    const manifestResult = synthesizeRecipeAppletManifest({
      recipe: {
        title: input.currentRecipe.title,
        description: input.currentRecipe.description
      },
      intent: {
        category: input.context.intent.category,
        label: input.context.intent.label,
        summary: input.context.intent.summary
      },
      normalizedData: input.context.normalizedData,
      summary: input.context.summary,
      assistantContext: input.context.assistantContext,
      actionSpec: input.context.actionSpec,
      recipeModel: input.context.recipeModel,
      analysis
    });

    if (!manifestResult.manifest) {
      return {
        manifest: null,
        plan: null,
        testArtifact: null,
        errors: manifestResult.errors,
        warnings: manifestResult.warnings
      };
    }

    return {
      manifest: manifestResult.manifest,
      plan: synthesizeRecipeAppletPlan(manifestResult.manifest, {
        note: 'The bridge synthesized this applet plan locally from the generated source analysis.',
        nodeKinds: analysis.nodeKinds
      }),
      testArtifact: buildRecipeAppletGeneratedTests(manifestResult.manifest),
      errors: [],
      warnings: manifestResult.warnings
    };
  }

  private buildRecipeAppletSourcePrompt(input: {
    context: RecipeAppletArtifactContext;
    currentRecipe: Recipe;
  }) {
    const recipeModel = input.context.recipeModel;
    return `Bridge execution note: Generate the Hermes Home recipe applet source.
This is an artifact-only post-processing step. The Hermes task is already complete.
Return only one TSX module and nothing else.

Rules:
- Work only from the persisted artifacts and local bridge context in this prompt.
- Never redo the task, check email again, rerun search/discovery, refresh the recipe, fetch more data, or modify external systems.
- Never use tools, skills, commands, code execution, approvals, or outbound requests.
- Import only from recipe-applet-sdk.
- Default export defineApplet(...).
- Use only SDK components and hooks.
- No intrinsic HTML elements.
- No raw fetch, eval, Function, dynamic import, window, document, process, or arbitrary imports.
- Bind to the stable recipe graph ids from this prompt instead of inventing new schema shapes.
- Use only literal action ids, collection ids, entity ids, and tab ids so the bridge can synthesize the manifest locally.
- Prefer useRecipe(), useCollection(id), useEntity(id), useSelection(collectionId), usePagination(collectionId), useFilters(collectionId), useFormState(id), useTabState(tabId), and patchRecipe([...]) over ad hoc local conventions.
- Use only these action ids: ${
      input.context.actionSpec?.actions.map((action) => action.id).join(', ') || '(none)'
    }.
- Use only these collection ids: ${recipeModel?.collections.map((collection) => collection.id).join(', ') || '(none)'}.
- Use only these tab ids: ${recipeModel?.tabs.map((tab) => tab.id).join(', ') || '(none)'}.
- If you need a table/list/detail/cards binding, point it at an existing collection id.
- Keep the layout compact for a narrow attached recipe pane.

Available SDK surface:
Stack, Inline, Grid, Card, Stat, Badge, Heading, Text, Markdown, Tabs, Tab, Table, List, DetailPanel, EmptyState, ErrorState, LoadingState, SkeletonSection, Paginator, Image, Button, ButtonGroup, Input, Select, Textarea, Divider, Callout, defineApplet, useRecipe, useCollection, useEntity, useSelection, usePagination, useFilters, useFormState, useTabState, useAppletState, runPromptAction, runPrompt, callApprovedApi, refreshRecipe, patchRecipe, updateLocalState, openLink, confirmAction.

Current Home recipe:
${this.serializeStructuredContext({
      title: input.currentRecipe.title,
      description: input.currentRecipe.description,
      status: input.currentRecipe.status,
      summary: input.context.summary?.subtitle ?? input.context.assistantContext.summary
    }, 1_500)}

Intent summary:
${this.serializeStructuredContext({
      category: input.context.intent.category,
      label: input.context.intent.label,
      summary: input.context.intent.summary,
      preferredPresentation: input.context.intent.preferredPresentation
    }, 1_500)}

Allowed actions:
${this.serializeStructuredContext({
      actions:
        input.context.actionSpec?.actions.map((action) => ({
          id: action.id,
          label: action.label,
          kind: action.kind,
          description: action.description,
          selection: action.visibility.requiresSelection,
          whenBuildReady: action.visibility.whenBuildReady,
          handler: action.bridge?.handler ?? null,
          capabilityId: action.bridge?.capabilityId ?? null
        })) ?? []
    }, 3_500)}

Recipe graph snapshot:
${this.serializeStructuredContext({
      sdkVersion: recipeModel?.sdkVersion ?? 'recipe_sdk/v1',
      revision: recipeModel?.revision ?? null,
      activeTabId: recipeModel?.state.activeTabId ?? null,
      tabs:
        recipeModel?.tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          viewId: tab.viewId,
          status: tab.status
        })) ?? [],
      collections:
        recipeModel?.collections.map((collection) => ({
          id: collection.id,
          label: collection.label,
          preferredView: collection.preferredView,
          entityIds: collection.entityIds,
          fieldKeys: collection.fieldKeys,
          pageSize: collection.pageSize
        })) ?? [],
      sections:
        recipeModel?.sections.map((section) => ({
          id: section.id,
          kind: section.kind,
          title: section.title,
          collectionId: section.collectionId,
          entityId: section.entityId,
          actionIds: section.actionIds
        })) ?? []
    }, 7_000)}

Collection data snapshot:
${this.serializeStructuredContext({
      primaryDatasetId: input.context.normalizedData.primaryDatasetId,
      datasets: input.context.normalizedData.datasets
    }, 4_500)}`;
  }

  private buildRecipeAppletRepairPrompt(input: {
    context: RecipeAppletArtifactContext;
    currentRecipe: Recipe;
    sourceArtifact: { source: string };
    verification: RecipeAppletVerification;
  }) {
    return `${this.buildRecipeAppletSourcePrompt({
      context: input.context,
      currentRecipe: input.currentRecipe
    })}

The previous recipe applet source failed verification.
Errors:
${this.serializeStructuredContext(input.verification.errors, 4_000)}

Warnings:
${this.serializeStructuredContext(input.verification.warnings, 2_000)}

Previous source:
${this.serializeStructuredContext(input.sourceArtifact.source, 10_000)}

Emit one corrected TSX module now.`;
  }

  private async emitRecipeAppletProgress(
    profileId: string,
    sessionId: string,
    requestId: string,
    requestPreview: string,
    message: string,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void
  ) {
    this.appendPersistedRuntimeActivity(profileId, sessionId, requestId, requestPreview, {
      kind: 'status',
      state: 'updated',
      label: 'Recipe applet',
      detail: message,
      requestId,
      timestamp: this.now()
    });
    await onEvent({
      type: 'progress',
      requestId,
      message
    });
  }

  private async requestRecipeAppletStage(
    profile: Profile,
    requestId: string,
    prompt: string,
    stage: 'source' | 'repair',
    settings: ReturnType<BridgeDatabase['getSettings']>
  ): Promise<{
    assistantMarkdown: string;
    errorDetail: string | null;
    failureReason: 'live_task_violation' | 'context_invalid' | null;
  }> {
    this.assertExperimentalRecipeAppletRuntimeEnabled();

    const timeoutMs = this.resolveAsyncRecipeAppletTimeoutMs(settings);
    try {
      const result = await this.options.hermesCli.generateRecipeAppletArtifact({
        profile,
        prompt,
        stage,
        requestId,
        timeoutMs
      });
      return {
        assistantMarkdown: result.assistantMarkdown,
        errorDetail: null as string | null,
        failureReason: null as 'live_task_violation' | 'context_invalid' | null
      };
    } catch (error) {
      return {
        assistantMarkdown: '',
        errorDetail: error instanceof Error ? error.message : `Recipe applet ${stage} request failed.`,
        failureReason:
          error instanceof Error && error.name === 'HermesCliRecipeAppletViolationError'
            ? 'live_task_violation'
            : error instanceof Error && error.name === 'HermesCliRecipeAppletContextError'
              ? 'context_invalid'
              : null
      };
    }
  }

  private async finalizeRecipeAppletBuildFailure(input: {
    profile: Profile;
    session: Session;
    currentRecipe: Recipe;
    requestId: string;
    requestPreview: string;
    build: RecipeBuild;
    pipeline: RecipePipelineState;
    onEvent: (event: ChatStreamEvent) => Promise<void> | void;
    failure: RecipePipelineFailure;
    failureEvent: ReturnType<HermesBridge['resolveRecipeAppletFailureEvent']>;
    detail: string;
    pipelineEventMessage: string;
    failedTemplateState?: RecipeTemplateState | null;
    recipeGenerationTrace?: RecipeGenerationTrace | null;
  }): Promise<{ recipe: Recipe; pipeline: RecipePipelineState; build: RecipeBuild }> {
    const templateDrivenFailure = input.build.buildKind === 'template_enrichment';
    if (input.failedTemplateState) {
      this.persistRecipeTemplateProgressState({
        build: input.build,
        phase: input.build.phase,
        state: input.failedTemplateState,
        stage: 'template_validation',
        message: 'Persisted failed template preview state for inspection.'
      });
    }
    if (input.failure.retryable) {
      this.persistRecipeBuildArtifact(input.build, this.createRetryBuildActionSpec(templateDrivenFailure), this.now());
    }
    const build = await this.advanceRecipeBuild(input.build, input.requestPreview, input.onEvent, {
      phase: 'failed',
      progressMessage: input.failure.userFacingMessage,
      errorCode: input.failureEvent.code,
      errorMessage: input.failureEvent.message,
      errorDetail: input.detail,
      completed: true,
      failureCategory: input.failure.category,
      failureStage: input.failure.failureStage,
      userFacingMessage: input.failure.userFacingMessage,
      retryable: input.failure.retryable,
      configuredTimeoutMs: input.failure.configuredTimeoutMs ?? null
    });
    const timeoutObservation = input.recipeGenerationTrace
      ? this.findLatestRecipeGenerationTimeout(input.recipeGenerationTrace)
      : null;
    if (timeoutObservation && input.failure.category.startsWith('timeout_')) {
      this.recordRecipeGenerationTimeoutTelemetry(build, input.recipeGenerationTrace!, timeoutObservation);
    }
    const generationSummary = input.recipeGenerationTrace
      ? this.recordRecipeGenerationSummary(build, input.recipeGenerationTrace)
      : null;
    const nextPipeline = updateRecipePipelineSegment(input.pipeline, 'applet', 'enrichment_failed', {
      status: 'failed',
      stage: 'enrichment_failed',
      failureCategory: input.failure.category,
      message: input.failure.userFacingMessage,
      diagnostic: input.failure.diagnostic,
      retryable: input.failure.retryable,
      configuredTimeoutMs: input.failure.configuredTimeoutMs,
      updatedAt: build.updatedAt
    });
    const failedRecipeWithPipeline = this.persistRecipePipeline(input.requestId, nextPipeline, input.currentRecipe) ?? input.currentRecipe;
    this.emitStructuredRecipeArtifactCompleted(input.profile.id, input.session.id, input.requestId, input.requestPreview, false);
    this.recordTelemetry({
      profileId: input.profile.id,
      sessionId: input.session.id,
      requestId: input.requestId,
      severity: 'warning',
      category: 'recipes',
      code: input.failureEvent.code,
      message: input.failureEvent.message,
      detail: input.detail,
      payload: {
        recipeId: input.currentRecipe.id,
        buildId: build.id,
        templateId: input.recipeGenerationTrace?.templateId ?? input.currentRecipe.metadata.activeTemplateId ?? null,
        currentTemplateId: input.recipeGenerationTrace?.currentTemplateId ?? input.currentRecipe.metadata.activeTemplateId ?? null,
        failureCategory: input.failure.category,
        failureStage: input.failure.failureStage,
        retryable: input.failure.retryable,
        configuredTimeoutMs: input.failure.configuredTimeoutMs ?? null,
        timeoutStage: timeoutObservation?.stage ?? null,
        timeoutElapsedMs: timeoutObservation?.elapsedMs ?? null,
        recommendedTimeoutMs: timeoutObservation?.recommendedTimeoutMs ?? null,
        timeoutAttemptKind: timeoutObservation?.attemptKind ?? null,
        totalElapsedMs: generationSummary?.totalElapsedMs ?? null
      }
    });
    const failedRecipe = this.options.database.getRecipe(failedRecipeWithPipeline.id) ?? failedRecipeWithPipeline;
    await this.emitRecipePipelineStateEvent(
      failedRecipe,
      input.session.id,
      input.onEvent,
      input.pipelineEventMessage,
      {
        buildPhase: build.phase,
        failureCategory: input.failure.category,
        asyncEnrichment: true
      }
    );

    return {
      recipe: failedRecipe,
      pipeline: nextPipeline,
      build
    };
  }

  private createRetryBuildActionSpec(templateDriven: boolean) {
    return RecipeActionSpecSchema.parse({
      kind: 'action_spec',
      schemaVersion: 'recipe_action_spec/v1',
      actions: [
        {
          id: 'retry-build',
          label: templateDriven ? 'Rebuild recipe' : 'Retry enrichment',
          kind: 'bridge',
          intent: 'secondary',
          description: templateDriven
            ? 'Rebuild the recipe from persisted artifacts only.'
            : 'Retry recipe enrichment from persisted Home artifacts only.',
          visibility: {
            requiresSelection: 'none',
            whenBuildReady: false
          },
          bridge: {
            handler: 'retry_build',
            payload: {}
          },
          metadata: {}
        }
      ]
    });
  }

  private withRetryBuildActionSpec(actionSpec: RecipeActionSpec | null, templateDriven: boolean) {
    const retryActionSpec = this.createRetryBuildActionSpec(templateDriven);
    const retryAction = retryActionSpec.actions[0];
    if (!retryAction) {
      return actionSpec ?? retryActionSpec;
    }

    if (!actionSpec) {
      return retryActionSpec;
    }

    if (actionSpec.actions.some((action) => action.id === retryAction.id)) {
      return actionSpec;
    }

    return RecipeActionSpecSchema.parse({
      ...actionSpec,
      actions: [...actionSpec.actions, retryAction]
    });
  }

  private async continueRecipeTemplateEnrichment(
    profile: Profile,
    session: Session,
    currentRecipe: Recipe,
    requestId: string,
    requestPreview: string,
    settings: ReturnType<BridgeDatabase['getSettings']>,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void,
    context: RecipeTemplateArtifactContext,
    pipeline: RecipePipelineState,
    build: RecipeBuild,
    generationTrace: RecipeGenerationTrace,
    mutationIntent?: RecipeMutationIntent | null
  ): Promise<{ recipe: Recipe; pipeline: RecipePipelineState; build: RecipeBuild }> {
    if (this.isRecipeEnrichmentSuperseded(currentRecipe.id, requestId)) {
      await this.markRecipeEnrichmentSuperseded({
        profile,
        session,
        requestId,
        requestPreview,
        recipeId: currentRecipe.id,
        build
      });
      const supersededBuild = this.options.database.getRecipeBuild(build.id) ?? build;
      this.recordRecipeGenerationSummary(supersededBuild, generationTrace);
      return {
        recipe: currentRecipe,
        pipeline,
        build: supersededBuild
      };
    }

    let nextPipeline = updateRecipePipelineSegment(pipeline, 'applet', 'enrichment_generating', {
      status: 'running',
      stage: 'enrichment_generating',
      message: 'Recipe generation is selecting a template, staging text, hydrating content, and adding actions in the background.',
      retryable: true,
      updatedAt: this.now()
    });
    currentRecipe = this.persistRecipePipeline(requestId, nextPipeline, currentRecipe) ?? currentRecipe;

    const currentTemplate = context.currentTemplate;

    // Win #3: emit an optimistic ghost shell immediately using the predicted template from the
    // intent label — gives the frontend a skeleton to render before the selection LLM call completes.
    const predictedTemplateId = resolveTemplateIdForIntentLabel(context.intent.label);
    const optimisticGhostState = predictedTemplateId
      ? createRecipeTemplateGhostState({
          templateId: predictedTemplateId,
          currentState: currentTemplate ?? null,
          transitionReason: null,
          updatedAt: this.now(),
          phase: 'selected',
          failureCategory: null,
          errorMessage: null,
          failureScope: 'all'
        }).state
      : null;

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'template_selecting',
      progressMessage: 'Selecting the recipe template…',
      partialTemplateState: optimisticGhostState
    });
    const selectionTimeoutPolicy = this.describeRecipeTemplateStageTimeout(settings, 'select');
    const selectionOutcome = await this.runRecipeGenerationStageWithRetries<RecipeTemplateSelection>({
      build,
      trace: generationTrace,
      stage: 'template_selection',
      phase: 'template_selecting',
      currentTemplateId: currentTemplate?.templateId ?? null,
      executeAttempt: async (_attemptNumber, priorFailureDetail) => {
        const selectionResponse = await this.requestRecipeTemplateStage(
          profile,
          requestId,
          this.applyRecipeStageRetryPrompt(
            this.buildRecipeTemplateSelectionPrompt({
              context,
              currentRecipe,
              mutationIntent
            }),
            priorFailureDetail
          ),
          'select',
          settings
        );
        const extractedSelection = extractRecipeTemplateSelectionArtifact(selectionResponse.assistantMarkdown);
        const normalizedSelection =
          extractedSelection.rawValue !== null
            ? normalizeRecipeTemplateSelection(extractedSelection.rawValue)
            : {
                selection: null,
                errors: extractedSelection.errors,
                warnings: extractedSelection.warnings,
                repairs: {
                  droppedKeys: [],
                  aliasMappings: [],
                  defaultedFields: [],
                  normalizedValues: []
                }
              };
        const selectionErrors = normalizedSelection.selection
          ? validateRecipeTemplateSelection(normalizedSelection.selection)
          : [];
        const allErrors = [...extractedSelection.errors, ...normalizedSelection.errors, ...selectionErrors];
        const isValid = normalizedSelection.selection && normalizedSelection.errors.length === 0 && selectionErrors.length === 0;

        // Same-session correction: if invalid but we have a sessionId and no request-level error, try correction
        let correctionResult: { correctionTurns: number; correctionErrors: string[]; correctionFixed: boolean } | null = null;
        let finalValue: RecipeTemplateSelection | null = isValid ? normalizedSelection.selection : null;
        if (
          !isValid &&
          selectionResponse.runtimeSessionId &&
          !selectionResponse.errorDetail &&
          !selectionResponse.failureReason
        ) {
          const invalidJson = this.buildRecipeStageInvalidJson({
            assistantMarkdown: selectionResponse.assistantMarkdown,
            rawValue: extractedSelection.rawValue
          });
          const correction = await this.attemptSameSessionCorrection<RecipeTemplateSelection>({
            profile,
            requestId,
            sessionId: selectionResponse.runtimeSessionId,
            stage: 'select',
            templateId: (normalizedSelection.selection?.templateId as RecipeTemplateId) ?? 'research-notebook',
            invalidJson,
            validationErrors: allErrors.length > 0 ? allErrors : ['Template selection did not match required schema.'],
            contractPacket: createRecipeTemplateSelectionPacket(),
            settings,
            build,
            extractAndValidate: (markdown) => {
              const extracted = extractRecipeTemplateSelectionArtifact(markdown);
              const normalized =
                extracted.rawValue !== null
                  ? normalizeRecipeTemplateSelection(extracted.rawValue)
                  : { selection: null, errors: extracted.errors, warnings: [], repairs: { droppedKeys: [], aliasMappings: [], defaultedFields: [], normalizedValues: [] } };
              const validationErrors = normalized.selection
                ? validateRecipeTemplateSelection(normalized.selection)
                : [];
              const valid = normalized.selection && normalized.errors.length === 0 && validationErrors.length === 0;
              return {
                value: valid ? normalized.selection : null,
                errors: [...extracted.errors, ...normalized.errors, ...validationErrors],
                invalidJson: extracted.rawValue ? JSON.stringify(extracted.rawValue) : null
              };
            }
          });
          correctionResult = correction;
          if (correction.correctionFixed && correction.value) {
            finalValue = correction.value;
          }
        }

        const detail =
          (
            selectionResponse.errorDetail ??
            (finalValue ? '' : [...allErrors, ...(correctionResult?.correctionErrors ?? [])].join('; '))
          ) || 'Template selection returned no valid JSON artifact.';

        return {
          value: finalValue,
          assistantMarkdown: selectionResponse.assistantMarkdown,
          detail,
          startedAt: selectionResponse.startedAt,
          endedAt: selectionResponse.endedAt,
          elapsedMs: selectionResponse.elapsedMs,
          configuredTimeoutMs: selectionResponse.configuredTimeoutMs,
          recommendedTimeoutMs: selectionResponse.recommendedTimeoutMs,
          failureReason: selectionResponse.failureReason,
          failureKind:
            finalValue
              ? null
              : selectionResponse.errorDetail
                ? this.mapRecipeRequestFailureKind(detail)
                : extractedSelection.failureKind
                  ? this.mapRecipeStructuredFailureKind(extractedSelection.failureKind, detail)
                  : 'validation_failed',
          retryable: true,
          autoRecoveryAttempted: extractedSelection.parserDiagnostics.recoveryAttempted,
          autoRecoverySucceeded: extractedSelection.parserDiagnostics.recoverySucceeded,
          templateId: finalValue?.templateId ?? normalizedSelection.selection?.templateId ?? null,
          currentTemplateId: currentTemplate?.templateId ?? null,
          parserDiagnostics: extractedSelection.parserDiagnostics,
          normalizationSummary: normalizedSelection.repairs,
          sameSessionCorrections: correctionResult?.correctionTurns ?? 0,
          sameSessionCorrectionErrors: correctionResult?.correctionErrors ?? [],
          sameSessionCorrectionFixed: correctionResult?.correctionFixed ?? false,
          sameSessionSessionId: selectionResponse.runtimeSessionId
        };
      }
    });

    if (!selectionOutcome.ok) {
      const failure = this.classifyRecipeTemplateFailure({
        kind: 'selection',
        detail: selectionOutcome.detail,
        settings,
        configuredTimeoutMsOverride: selectionOutcome.observation.configuredTimeoutMs ?? selectionTimeoutPolicy.configuredTimeoutMs,
        recommendedTimeoutMsOverride:
          selectionOutcome.observation.recommendedTimeoutMs ?? selectionTimeoutPolicy.recommendedTimeoutMs,
        failureReason: selectionOutcome.failureReason
      });
      return this.finalizeRecipeAppletBuildFailure({
        profile,
        session,
        currentRecipe,
        requestId,
        requestPreview,
        build,
        pipeline: nextPipeline,
        onEvent,
        failure,
        failureEvent: {
          code: 'RECIPE_TEMPLATE_SELECTION_FAILED',
          message: 'Recipe template selection failed.'
        },
        detail: selectionOutcome.detail,
        pipelineEventMessage: `Recipe generation failed for "${currentRecipe.title}" because Hermes did not select a valid approved template.`,
        recipeGenerationTrace: generationTrace
      });
    }

    const selection = selectionOutcome.value;
    const normalizedMode = this.resolveRecipeTemplateSelectionMode(selection, currentTemplate);
    const transitionDefinition =
      currentTemplate && currentTemplate.templateId !== selection.templateId
        ? getRecipeTemplateRuntimeDefinition(currentTemplate.templateId)?.transitions.find(
            (transition: { targetTemplateId: RecipeTemplateId }) => transition.targetTemplateId === selection.templateId
          ) ?? null
        : null;
    this.persistRecipeBuildArtifact(build, selection, this.now());

    if (normalizedMode === 'switch' && currentTemplate && !transitionDefinition) {
      const switchDetail = `Template transition ${currentTemplate.templateId} -> ${selection.templateId} is not supported.`;
      const failure = this.classifyRecipeTemplateFailure({
        kind: 'switch',
        detail: switchDetail,
        settings
      });
      return this.finalizeRecipeAppletBuildFailure({
        profile,
        session,
        currentRecipe,
        requestId,
        requestPreview,
        build,
        pipeline: nextPipeline,
        onEvent,
        failure,
        failureEvent: {
          code: 'RECIPE_TEMPLATE_SWITCH_UNSUPPORTED',
          message: 'Recipe template switch is not supported.'
        },
        detail: switchDetail,
        pipelineEventMessage: `Recipe generation failed for "${currentRecipe.title}" because the requested template switch is unsupported.`,
        recipeGenerationTrace: generationTrace
      });
    }

    const transitionCurrentState = normalizedMode === 'switch' ? currentTemplate : null;
    const persistTemplatePreviewState = (
      stage: RecipeGenerationStageKey,
      phase: 'selected' | 'text' | 'hydrating' | 'actions' | 'repairing' | 'failed',
      fill: RecipeTemplateFill,
      options: {
        failureCategory?: string | null;
        errorMessage?: string | null;
        failureScope?: 'all' | 'content' | 'actions';
      } = {}
    ) => {
      const preview = compileRecipeTemplatePreviewState({
        fill,
        currentState: transitionCurrentState,
        transitionReason: transitionDefinition?.reason ?? selection.reason,
        phase,
        updatedAt: this.now(),
        failureCategory: options.failureCategory ?? null,
        errorMessage: options.errorMessage ?? null,
        failureScope: options.failureScope ?? 'all'
      });
      if (preview.state) {
        this.persistRecipeTemplateProgressState({
          build,
          phase: build.phase,
          state: preview.state,
          stage,
          message: `Persisted ${phase} recipe template state preview.`
        });
      }
      return preview.state;
    };

    const persistGhostTemplateState = (
      phase: 'selected' | 'repairing' | 'failed',
      options: {
        failureCategory?: string | null;
        errorMessage?: string | null;
        failureScope?: 'all' | 'content' | 'actions';
      } = {}
    ) => {
      const preview = createRecipeTemplateGhostState({
        templateId: selection.templateId,
        currentState: transitionCurrentState,
        transitionReason: transitionDefinition?.reason ?? selection.reason,
        updatedAt: this.now(),
        phase,
        failureCategory: options.failureCategory ?? null,
        errorMessage: options.errorMessage ?? null,
        failureScope: options.failureScope ?? 'all'
      });
      if (preview.state) {
        this.persistRecipeTemplateProgressState({
          build,
          phase: build.phase,
          state: preview.state,
          stage: phase === 'selected' ? 'template_selection' : 'template_validation',
          message: `Persisted ${phase} recipe template ghost state.`
        });
      }
      return preview.state;
    };
    let latestTemplatePreviewState: RecipeTemplateState | null = persistGhostTemplateState('selected');

    const textRepairTimeoutPolicy = this.describeRecipeTemplateStageTimeout(settings, 'text_repair');
    const actionsRepairTimeoutPolicy = this.describeRecipeTemplateStageTimeout(settings, 'actions_repair');

    let stagedTextArtifact: RecipeTemplateText | null = null;
    let hydrationArtifact: RecipeTemplateHydration | null = null;
    let hydratedTextArtifact: RecipeTemplateText | null = null;
    let actionsArtifact: RecipeTemplateActions | null = null;
    let assembledFill: RecipeTemplateFill | null = null;
    let nextTemplateState: RecipeTemplateState | null = null;
    let nextActionSpec: RecipeActionSpec | null = null;
    let compiledTemplate: ReturnType<typeof compileRecipeTemplateState> | null = null;

    // Win #2: confirmed ghost state (correct template ID) sent immediately after selection
    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'template_text_generating',
      progressMessage:
        normalizedMode === 'switch'
          ? 'Generating the staged template text for the template switch…'
          : 'Generating the staged template text and labels…',
      partialTemplateState: latestTemplatePreviewState
    });
    let latestTextFailure = {
      invalidJson: '{}',
      validationErrors: ['The staged template text artifact was invalid.']
    };

    // Streaming callback for the text stage: emit partial template states as the LLM writes JSON.
    // Throttled to once per 400ms to avoid flooding the SSE stream.
    let lastPartialEmitAt = 0;
    const PARTIAL_EMIT_INTERVAL_MS = 400;
    const emitPartialTextState = async (markdown: string) => {
      const now = Date.now();
      if (now - lastPartialEmitAt < PARTIAL_EMIT_INTERVAL_MS) return;
      lastPartialEmitAt = now;
      try {
        const partial = parsePartialJsonObject(markdown);
        if (!partial) return;
        const partialNorm = normalizeRecipeTemplateText({
          templateId: selection.templateId,
          rawValue: partial,
          assistantSummary: context.summary?.subtitle ?? context.assistantContext.summary ?? null
        });
        if (!partialNorm.text) return;
        const partialFill = createRecipeTemplateFillFromText(partialNorm.text);
        const partialState = persistTemplatePreviewState('template_text_generation', 'text', partialFill);
        if (partialState) {
          await this.emitRecipeBuildProgress(build, onEvent, 'Building recipe…', partialState);
        }
      } catch {
        // Ignore partial parse errors — they are expected for mid-stream JSON chunks.
      }
    };

    const textOutcome = await this.runRecipeGenerationStageWithRetries<RecipeTemplateText>({
      build,
      trace: generationTrace,
      stage: 'template_text_generation',
      phase: 'template_text_generating',
      templateId: selection.templateId,
      currentTemplateId: currentTemplate?.templateId ?? null,
      executeAttempt: async (_attemptNumber, priorFailureDetail) => {
        const textResponse = await this.requestRecipeTemplateStage(
          profile,
          requestId,
          this.applyRecipeStageRetryPrompt(
            this.buildRecipeTemplateTextPrompt({
              context,
              currentRecipe,
              selection
            }),
            priorFailureDetail
          ),
          'text',
          settings,
          emitPartialTextState
        );
        const extractedText = extractRecipeTemplateTextArtifact(textResponse.assistantMarkdown);
        const normalizedText =
          extractedText.rawValue !== null
            ? normalizeRecipeTemplateText({
                templateId: selection.templateId,
                rawValue: extractedText.rawValue,
                assistantSummary: context.summary?.subtitle ?? context.assistantContext.summary ?? null
              })
            : {
                text: null,
                errors: extractedText.errors,
                warnings: extractedText.warnings,
                repairs: {
                  droppedKeys: [],
                  aliasMappings: [],
                  defaultedFields: [],
                  normalizedValues: []
                }
              };

        const validationErrors = [...extractedText.errors, ...normalizedText.errors].filter(Boolean);

        if (normalizedText.text && validationErrors.length === 0) {
          const candidateText = createRecipeTemplateTextArtifact(createRecipeTemplateFillFromText(normalizedText.text));
          return {
            value: candidateText,
            assistantMarkdown: textResponse.assistantMarkdown,
            detail: '',
            startedAt: textResponse.startedAt,
            endedAt: textResponse.endedAt,
            elapsedMs: textResponse.elapsedMs,
            configuredTimeoutMs: textResponse.configuredTimeoutMs,
            recommendedTimeoutMs: textResponse.recommendedTimeoutMs,
            failureReason: textResponse.failureReason,
            failureKind: null,
            retryable: false,
            autoRecoveryAttempted: extractedText.parserDiagnostics.recoveryAttempted,
            autoRecoverySucceeded: extractedText.parserDiagnostics.recoverySucceeded,
            templateId: selection.templateId,
            currentTemplateId: currentTemplate?.templateId ?? null,
            parserDiagnostics: extractedText.parserDiagnostics,
            normalizationSummary: normalizedText.repairs
          };
        }

        // Same-session correction for text stage
        let correctionResult: { correctionTurns: number; correctionErrors: string[]; correctionFixed: boolean } | null = null;
        if (
          textResponse.runtimeSessionId &&
          !textResponse.errorDetail &&
          !textResponse.failureReason
        ) {
          const invalidJson = this.buildRecipeStageInvalidJson({
            assistantMarkdown: textResponse.assistantMarkdown,
            jsonText: extractedText.jsonText,
            rawValue: extractedText.rawValue,
            fallbackJson: JSON.stringify(normalizedText.text ?? {}, null, 2)
          });
          const correction = await this.attemptSameSessionCorrection<RecipeTemplateText>({
            profile,
            requestId,
            sessionId: textResponse.runtimeSessionId,
            stage: 'text',
            templateId: selection.templateId,
            invalidJson,
            validationErrors: validationErrors.length > 0 ? validationErrors : ['The staged template text/content artifact failed local validation.'],
            contractPacket: createRecipeTemplateTextPacket(selection.templateId),
            settings,
            build,
            extractAndValidate: (markdown) => {
              const extracted = extractRecipeTemplateTextArtifact(markdown);
              const normalized =
                extracted.rawValue !== null
                  ? normalizeRecipeTemplateText({
                      templateId: selection.templateId,
                      rawValue: extracted.rawValue,
                      assistantSummary: context.summary?.subtitle ?? context.assistantContext.summary ?? null
                    })
                  : { text: null, errors: extracted.errors, warnings: [], repairs: { droppedKeys: [], aliasMappings: [], defaultedFields: [], normalizedValues: [] } };
              const errs = [...extracted.errors, ...normalized.errors].filter(Boolean);
              if (normalized.text && errs.length === 0) {
                return {
                  value: createRecipeTemplateTextArtifact(createRecipeTemplateFillFromText(normalized.text)),
                  errors: [],
                  invalidJson: null
                };
              }
              return {
                value: null,
                errors: errs.length > 0 ? errs : ['Text artifact failed validation.'],
                invalidJson: extracted.rawValue ? JSON.stringify(extracted.rawValue) : null
              };
            }
          });
          correctionResult = correction;
          if (correction.correctionFixed && correction.value) {
            return {
              value: correction.value,
              assistantMarkdown: textResponse.assistantMarkdown,
              detail: '',
              startedAt: textResponse.startedAt,
              endedAt: textResponse.endedAt,
              elapsedMs: textResponse.elapsedMs,
              configuredTimeoutMs: textResponse.configuredTimeoutMs,
              recommendedTimeoutMs: textResponse.recommendedTimeoutMs,
              failureReason: null,
              failureKind: null,
              retryable: false,
              autoRecoveryAttempted: extractedText.parserDiagnostics.recoveryAttempted,
              autoRecoverySucceeded: extractedText.parserDiagnostics.recoverySucceeded,
              templateId: selection.templateId,
              currentTemplateId: currentTemplate?.templateId ?? null,
              parserDiagnostics: extractedText.parserDiagnostics,
              normalizationSummary: normalizedText.repairs,
              sameSessionCorrections: correction.correctionTurns,
              sameSessionCorrectionErrors: correction.correctionErrors,
              sameSessionCorrectionFixed: true,
              sameSessionSessionId: textResponse.runtimeSessionId
            };
          }
        }

        latestTextFailure = {
          invalidJson: this.buildRecipeStageInvalidJson({
            assistantMarkdown: textResponse.assistantMarkdown,
            jsonText: extractedText.jsonText,
            rawValue: extractedText.rawValue,
            fallbackJson: JSON.stringify(normalizedText.text ?? {}, null, 2)
          }),
          validationErrors:
            validationErrors.length > 0 ? validationErrors : ['The staged template text/content artifact failed local validation.']
        };
        const detail =
          (textResponse.errorDetail ?? [...latestTextFailure.validationErrors, ...(correctionResult?.correctionErrors ?? [])].join('; ')) ||
          'The staged template text artifact was invalid.';
        return {
          value: null,
          assistantMarkdown: textResponse.assistantMarkdown,
          detail,
          startedAt: textResponse.startedAt,
          endedAt: textResponse.endedAt,
          elapsedMs: textResponse.elapsedMs,
          configuredTimeoutMs: textResponse.configuredTimeoutMs,
          recommendedTimeoutMs: textResponse.recommendedTimeoutMs,
          failureReason: textResponse.failureReason,
          failureKind: textResponse.errorDetail
            ? this.mapRecipeRequestFailureKind(detail)
            : extractedText.failureKind
              ? this.mapRecipeStructuredFailureKind(extractedText.failureKind, detail)
              : 'validation_failed',
          retryable: true,
          autoRecoveryAttempted: extractedText.parserDiagnostics.recoveryAttempted,
          autoRecoverySucceeded: extractedText.parserDiagnostics.recoverySucceeded,
          templateId: selection.templateId,
          currentTemplateId: currentTemplate?.templateId ?? null,
          parserDiagnostics: extractedText.parserDiagnostics,
          normalizationSummary: normalizedText.repairs,
          sameSessionCorrections: correctionResult?.correctionTurns ?? 0,
          sameSessionCorrectionErrors: correctionResult?.correctionErrors ?? [],
          sameSessionCorrectionFixed: false,
          sameSessionSessionId: textResponse.runtimeSessionId
        };
      }
    });

    if (!textOutcome.ok) {
      build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
        phase: 'template_text_repairing',
        progressMessage: 'Repairing the staged template text from persisted artifacts…'
      });
      let latestTextRepairFailure = latestTextFailure;
      latestTemplatePreviewState =
        persistGhostTemplateState('repairing', {
          errorMessage: latestTextFailure.validationErrors[0] ?? 'Repairing the staged template text artifact.',
          failureScope: 'content'
        }) ?? latestTemplatePreviewState;
      const textRepairOutcome = await this.runRecipeGenerationStageWithRetries<RecipeTemplateText>({
        build,
        trace: generationTrace,
        stage: 'template_text_repair',
        phase: 'template_text_repairing',
        attemptKind: 'repair',
        templateId: selection.templateId,
        currentTemplateId: currentTemplate?.templateId ?? null,
        executeAttempt: async (_attemptNumber, priorFailureDetail) => {
          const repairResponse = await this.requestRecipeTemplateStage(
            profile,
            requestId,
            this.applyRecipeStageRetryPrompt(
              this.buildRecipeTemplateTextRepairPrompt({
                templateId: selection.templateId,
                invalidJson: latestTextRepairFailure.invalidJson,
                validationErrors: latestTextRepairFailure.validationErrors
              }),
              priorFailureDetail
            ),
            'text_repair',
            settings
          );
          const extractedRepair = extractRecipeTemplateTextArtifact(repairResponse.assistantMarkdown);
          const normalizedRepair =
            extractedRepair.rawValue !== null
              ? normalizeRecipeTemplateText({
                  templateId: selection.templateId,
                  rawValue: extractedRepair.rawValue,
                  assistantSummary: context.summary?.subtitle ?? context.assistantContext.summary ?? null
                })
              : {
                  text: null,
                  errors: extractedRepair.errors,
                  warnings: extractedRepair.warnings,
                  repairs: {
                    droppedKeys: [],
                    aliasMappings: [],
                    defaultedFields: [],
                    normalizedValues: []
                  }
                };

          const validationErrors = [...extractedRepair.errors, ...normalizedRepair.errors].filter(Boolean);

          if (normalizedRepair.text && validationErrors.length === 0) {
            const candidateText = createRecipeTemplateTextArtifact(createRecipeTemplateFillFromText(normalizedRepair.text));
            return {
              value: candidateText,
              assistantMarkdown: repairResponse.assistantMarkdown,
              detail: '',
              startedAt: repairResponse.startedAt,
              endedAt: repairResponse.endedAt,
              elapsedMs: repairResponse.elapsedMs,
              configuredTimeoutMs: repairResponse.configuredTimeoutMs,
              recommendedTimeoutMs: repairResponse.recommendedTimeoutMs,
              failureReason: repairResponse.failureReason,
              failureKind: null,
              retryable: false,
              autoRecoveryAttempted: extractedRepair.parserDiagnostics.recoveryAttempted,
              autoRecoverySucceeded: extractedRepair.parserDiagnostics.recoverySucceeded,
              templateId: selection.templateId,
              currentTemplateId: currentTemplate?.templateId ?? null,
              parserDiagnostics: extractedRepair.parserDiagnostics,
              normalizationSummary: normalizedRepair.repairs
            };
          }

          latestTextRepairFailure = {
            invalidJson: this.buildRecipeStageInvalidJson({
              assistantMarkdown: repairResponse.assistantMarkdown,
              jsonText: extractedRepair.jsonText,
              rawValue: extractedRepair.rawValue,
              fallbackJson: JSON.stringify(normalizedRepair.text ?? {}, null, 2)
            }),
            validationErrors:
              validationErrors.length > 0 ? validationErrors : ['The staged template text/content artifact failed local validation.']
          };
          const detail =
            (repairResponse.errorDetail ?? latestTextRepairFailure.validationErrors.join('; ')) ||
            'The bounded template text/content repair did not return valid JSON.';
          return {
            value: null,
            assistantMarkdown: repairResponse.assistantMarkdown,
            detail,
            startedAt: repairResponse.startedAt,
            endedAt: repairResponse.endedAt,
            elapsedMs: repairResponse.elapsedMs,
            configuredTimeoutMs: repairResponse.configuredTimeoutMs,
            recommendedTimeoutMs: repairResponse.recommendedTimeoutMs,
            failureReason: repairResponse.failureReason,
            failureKind: repairResponse.errorDetail
              ? this.mapRecipeRequestFailureKind(detail)
              : extractedRepair.failureKind
                ? this.mapRecipeStructuredFailureKind(extractedRepair.failureKind, detail)
                : 'validation_failed',
            retryable: true,
            autoRecoveryAttempted: extractedRepair.parserDiagnostics.recoveryAttempted,
            autoRecoverySucceeded: extractedRepair.parserDiagnostics.recoverySucceeded,
            templateId: selection.templateId,
            currentTemplateId: currentTemplate?.templateId ?? null,
            parserDiagnostics: extractedRepair.parserDiagnostics,
            normalizationSummary: normalizedRepair.repairs
          };
        }
      });

      if (!textRepairOutcome.ok) {
        const failure = this.classifyRecipeTemplateFailure({
          kind: 'text_repair',
          detail: textRepairOutcome.detail,
          settings,
          configuredTimeoutMsOverride:
            textRepairOutcome.observation.configuredTimeoutMs ?? textRepairTimeoutPolicy.configuredTimeoutMs,
          recommendedTimeoutMsOverride:
            textRepairOutcome.observation.recommendedTimeoutMs ?? textRepairTimeoutPolicy.recommendedTimeoutMs,
          failureReason: textRepairOutcome.failureReason
        });
        return this.finalizeRecipeAppletBuildFailure({
          profile,
          session,
          currentRecipe,
          requestId,
          requestPreview,
          build,
          pipeline: nextPipeline,
          onEvent,
          failure,
          failureEvent: {
            code: 'RECIPE_TEMPLATE_TEXT_REPAIR_FAILED',
            message: 'Recipe template text repair failed.'
          },
          detail: textRepairOutcome.detail,
          pipelineEventMessage: `Recipe generation failed for "${currentRecipe.title}" because the bounded staged text repair did not produce a valid artifact.`,
          failedTemplateState:
            persistGhostTemplateState('failed', {
              failureCategory: failure.category,
              errorMessage: textRepairOutcome.detail,
              failureScope: 'content'
            }) ?? latestTemplatePreviewState,
          recipeGenerationTrace: generationTrace
        });
      }

      stagedTextArtifact = textRepairOutcome.value;
    } else {
      stagedTextArtifact = textOutcome.value;
    }

    this.persistRecipeBuildArtifact(build, stagedTextArtifact!, this.now());
    latestTemplatePreviewState =
      persistTemplatePreviewState(
        'template_text_generation',
        'text',
        createRecipeTemplateFillFromText(stagedTextArtifact!)
      ) ?? latestTemplatePreviewState;

    // Win #1: text-labeled shell sent — user sees correct section structure before content fills in
    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'template_hydrating',
      progressMessage:
        normalizedMode === 'switch'
          ? 'Hydrating the selected template with concrete content for the switch…'
          : 'Hydrating the selected template with concrete content…',
      partialTemplateState: latestTemplatePreviewState
    });
    let latestHydrationFailure = {
      invalidJson: '{}',
      validationErrors: ['The staged template hydration artifact was invalid.']
    };

    const hydrationOutcome = await this.runRecipeGenerationStageWithRetries<{
      hydration: RecipeTemplateHydration;
      hydratedText: RecipeTemplateText;
      hydratedFill: RecipeTemplateFill;
    }>({
      build,
      trace: generationTrace,
      stage: 'template_hydration',
      phase: 'template_hydrating',
      templateId: selection.templateId,
      currentTemplateId: currentTemplate?.templateId ?? null,
      executeAttempt: async (_attemptNumber, priorFailureDetail) => {
        const hydrationResponse = await this.requestRecipeTemplateStage(
          profile,
          requestId,
          this.applyRecipeStageRetryPrompt(
            this.buildRecipeTemplateHydrationPrompt({
              context,
              currentRecipe,
              selection,
              textArtifact: stagedTextArtifact!
            }),
            priorFailureDetail
          ),
          'hydrate',
          settings
        );
        const extractedHydration = extractRecipeTemplateHydrationArtifact(hydrationResponse.assistantMarkdown);
        const normalizedHydration =
          extractedHydration.rawValue !== null
            ? normalizeRecipeTemplateHydration({
                templateId: selection.templateId,
                rawValue: extractedHydration.rawValue,
                assistantSummary: context.summary?.subtitle ?? context.assistantContext.summary ?? null
              })
            : {
                hydration: null,
                errors: extractedHydration.errors,
                warnings: extractedHydration.warnings,
                repairs: {
                  droppedKeys: [],
                  aliasMappings: [],
                  defaultedFields: [],
                  normalizedValues: []
                }
              };

        const validationErrors = [...extractedHydration.errors, ...normalizedHydration.errors].filter(Boolean);
        let candidateHydration = normalizedHydration.hydration;
        let candidateText: RecipeTemplateText | null = null;
        let candidateFill: RecipeTemplateFill | null = null;
        let candidateCompiled: ReturnType<typeof compileRecipeTemplateState> | null = null;

        if (candidateHydration && validationErrors.length === 0) {
          candidateFill = createRecipeTemplateFillFromHydration(candidateHydration);
          candidateText = createRecipeTemplateTextArtifact(candidateFill);
          candidateFill = createRecipeTemplateFillFromText(candidateText);
          if (normalizedMode === 'switch' && currentTemplate) {
            candidateFill = migrateRecipeTemplateFill({
              fill: candidateFill,
              currentState: currentTemplate
            });
            candidateText = createRecipeTemplateTextArtifact(candidateFill);
          }
          candidateHydration = createRecipeTemplateHydrationArtifact(candidateFill);
          candidateCompiled = compileRecipeTemplateState({
            fill: candidateFill,
            currentState: normalizedMode === 'switch' ? currentTemplate : null,
            transitionReason: transitionDefinition?.reason ?? selection.reason
          });
          if (candidateCompiled.state && candidateCompiled.definition && candidateCompiled.errors.length === 0) {
            return {
              value: {
                hydration: candidateHydration,
                hydratedText: candidateText,
                hydratedFill: candidateFill
              },
              assistantMarkdown: hydrationResponse.assistantMarkdown,
              detail: '',
              startedAt: hydrationResponse.startedAt,
              endedAt: hydrationResponse.endedAt,
              elapsedMs: hydrationResponse.elapsedMs,
              configuredTimeoutMs: hydrationResponse.configuredTimeoutMs,
              recommendedTimeoutMs: hydrationResponse.recommendedTimeoutMs,
              failureReason: hydrationResponse.failureReason,
              failureKind: null,
              retryable: false,
              autoRecoveryAttempted: extractedHydration.parserDiagnostics.recoveryAttempted,
              autoRecoverySucceeded: extractedHydration.parserDiagnostics.recoverySucceeded,
              templateId: selection.templateId,
              currentTemplateId: currentTemplate?.templateId ?? null,
              parserDiagnostics: extractedHydration.parserDiagnostics,
              normalizationSummary: normalizedHydration.repairs
            };
          }
        }

        const hydrationAllErrors =
          validationErrors.length > 0
            ? validationErrors
            : candidateCompiled?.errors.length
              ? candidateCompiled.errors
              : ['The staged template hydration artifact failed local validation.'];

        // Same-session correction for hydration stage
        let correctionResult: { correctionTurns: number; correctionErrors: string[]; correctionFixed: boolean } | null = null;
        if (
          hydrationResponse.runtimeSessionId &&
          !hydrationResponse.errorDetail &&
          !hydrationResponse.failureReason
        ) {
          const invalidJson = this.buildRecipeStageInvalidJson({
            assistantMarkdown: hydrationResponse.assistantMarkdown,
            jsonText: extractedHydration.jsonText,
            rawValue: extractedHydration.rawValue,
            fallbackJson: JSON.stringify(candidateHydration ?? {}, null, 2)
          });
          const correction = await this.attemptSameSessionCorrection<{
            hydration: RecipeTemplateHydration;
            hydratedText: RecipeTemplateText;
            hydratedFill: RecipeTemplateFill;
          }>({
            profile,
            requestId,
            sessionId: hydrationResponse.runtimeSessionId,
            stage: 'hydrate',
            templateId: selection.templateId,
            invalidJson,
            validationErrors: hydrationAllErrors,
            contractPacket: createRecipeTemplateHydrationPacket(selection.templateId),
            settings,
            build,
            extractAndValidate: (markdown) => {
              const extracted = extractRecipeTemplateHydrationArtifact(markdown);
              const normalized =
                extracted.rawValue !== null
                  ? normalizeRecipeTemplateHydration({
                      templateId: selection.templateId,
                      rawValue: extracted.rawValue,
                      assistantSummary: context.summary?.subtitle ?? context.assistantContext.summary ?? null
                    })
                  : { hydration: null, errors: extracted.errors, warnings: [], repairs: { droppedKeys: [], aliasMappings: [], defaultedFields: [], normalizedValues: [] } };
              const errs = [...extracted.errors, ...normalized.errors].filter(Boolean);
              if (normalized.hydration && errs.length === 0) {
                let fill = createRecipeTemplateFillFromHydration(normalized.hydration);
                let text = createRecipeTemplateTextArtifact(fill);
                fill = createRecipeTemplateFillFromText(text);
                if (normalizedMode === 'switch' && currentTemplate) {
                  fill = migrateRecipeTemplateFill({ fill, currentState: currentTemplate });
                  text = createRecipeTemplateTextArtifact(fill);
                }
                const hydration = createRecipeTemplateHydrationArtifact(fill);
                const compiled = compileRecipeTemplateState({
                  fill,
                  currentState: normalizedMode === 'switch' ? currentTemplate : null,
                  transitionReason: transitionDefinition?.reason ?? selection.reason
                });
                if (compiled.state && compiled.definition && compiled.errors.length === 0) {
                  return { value: { hydration, hydratedText: text, hydratedFill: fill }, errors: [], invalidJson: null };
                }
                return { value: null, errors: compiled.errors.length > 0 ? compiled.errors : ['Compiled state invalid.'], invalidJson: extracted.rawValue ? JSON.stringify(extracted.rawValue) : null };
              }
              return { value: null, errors: errs.length > 0 ? errs : ['Hydration artifact failed validation.'], invalidJson: extracted.rawValue ? JSON.stringify(extracted.rawValue) : null };
            }
          });
          correctionResult = correction;
          if (correction.correctionFixed && correction.value) {
            return {
              value: correction.value,
              assistantMarkdown: hydrationResponse.assistantMarkdown,
              detail: '',
              startedAt: hydrationResponse.startedAt,
              endedAt: hydrationResponse.endedAt,
              elapsedMs: hydrationResponse.elapsedMs,
              configuredTimeoutMs: hydrationResponse.configuredTimeoutMs,
              recommendedTimeoutMs: hydrationResponse.recommendedTimeoutMs,
              failureReason: null,
              failureKind: null,
              retryable: false,
              autoRecoveryAttempted: extractedHydration.parserDiagnostics.recoveryAttempted,
              autoRecoverySucceeded: extractedHydration.parserDiagnostics.recoverySucceeded,
              templateId: selection.templateId,
              currentTemplateId: currentTemplate?.templateId ?? null,
              parserDiagnostics: extractedHydration.parserDiagnostics,
              normalizationSummary: normalizedHydration.repairs,
              sameSessionCorrections: correction.correctionTurns,
              sameSessionCorrectionErrors: correction.correctionErrors,
              sameSessionCorrectionFixed: true,
              sameSessionSessionId: hydrationResponse.runtimeSessionId
            };
          }
        }

        latestHydrationFailure = {
          invalidJson: this.buildRecipeStageInvalidJson({
            assistantMarkdown: hydrationResponse.assistantMarkdown,
            jsonText: extractedHydration.jsonText,
            rawValue: extractedHydration.rawValue,
            fallbackJson: JSON.stringify(candidateHydration ?? {}, null, 2)
          }),
          validationErrors: hydrationAllErrors
        };
        const detail =
          (hydrationResponse.errorDetail ?? [...latestHydrationFailure.validationErrors, ...(correctionResult?.correctionErrors ?? [])].join('; ')) ||
          'The staged template hydration artifact was invalid.';
        return {
          value: null,
          assistantMarkdown: hydrationResponse.assistantMarkdown,
          detail,
          startedAt: hydrationResponse.startedAt,
          endedAt: hydrationResponse.endedAt,
          elapsedMs: hydrationResponse.elapsedMs,
          configuredTimeoutMs: hydrationResponse.configuredTimeoutMs,
          recommendedTimeoutMs: hydrationResponse.recommendedTimeoutMs,
          failureReason: hydrationResponse.failureReason,
          failureKind: hydrationResponse.errorDetail
            ? this.mapRecipeRequestFailureKind(detail)
            : extractedHydration.failureKind
              ? this.mapRecipeStructuredFailureKind(extractedHydration.failureKind, detail)
              : 'validation_failed',
          retryable: true,
          autoRecoveryAttempted: extractedHydration.parserDiagnostics.recoveryAttempted,
          autoRecoverySucceeded: extractedHydration.parserDiagnostics.recoverySucceeded,
          templateId: selection.templateId,
          currentTemplateId: currentTemplate?.templateId ?? null,
          parserDiagnostics: extractedHydration.parserDiagnostics,
          normalizationSummary: normalizedHydration.repairs,
          sameSessionCorrections: correctionResult?.correctionTurns ?? 0,
          sameSessionCorrectionErrors: correctionResult?.correctionErrors ?? [],
          sameSessionCorrectionFixed: false,
          sameSessionSessionId: hydrationResponse.runtimeSessionId
        };
      }
    });

    if (!hydrationOutcome.ok) {
      const failure = this.classifyRecipeTemplateFailure({
        kind: 'hydration',
        detail: hydrationOutcome.detail,
        settings,
        configuredTimeoutMsOverride: hydrationOutcome.observation.configuredTimeoutMs ?? this.describeRecipeTemplateStageTimeout(settings, 'hydrate').configuredTimeoutMs,
        recommendedTimeoutMsOverride:
          hydrationOutcome.observation.recommendedTimeoutMs ?? this.describeRecipeTemplateStageTimeout(settings, 'hydrate').recommendedTimeoutMs,
        failureReason: hydrationOutcome.failureReason
      });
      const semanticContentFailure = failure.category === 'semantic_content_failed';
      return this.finalizeRecipeAppletBuildFailure({
        profile,
        session,
        currentRecipe,
        requestId,
        requestPreview,
        build,
        pipeline: nextPipeline,
        onEvent,
        failure,
        failureEvent: {
          code: semanticContentFailure ? 'RECIPE_TEMPLATE_SEMANTIC_CONTENT_FAILED' : 'RECIPE_TEMPLATE_HYDRATION_FAILED',
          message: semanticContentFailure
            ? 'Recipe template hydration stayed semantically empty.'
            : 'Recipe template hydration failed.'
        },
        detail: hydrationOutcome.detail,
        pipelineEventMessage: semanticContentFailure
          ? `Recipe generation failed for "${currentRecipe.title}" because the selected template stayed semantically empty after hydration.`
          : `Recipe generation failed for "${currentRecipe.title}" because Hermes did not produce a valid populated hydration artifact.`,
        failedTemplateState:
          persistTemplatePreviewState('template_validation', 'failed', assembledFill ?? createRecipeTemplateFillFromText(stagedTextArtifact!), {
            failureCategory: failure.category,
            errorMessage: hydrationOutcome.detail,
            failureScope: 'content'
          }) ?? latestTemplatePreviewState,
        recipeGenerationTrace: generationTrace
      });
    }

    hydrationArtifact = hydrationOutcome.value.hydration;
    hydratedTextArtifact = hydrationOutcome.value.hydratedText;
    assembledFill = hydrationOutcome.value.hydratedFill;
    this.persistRecipeBuildArtifact(build, hydrationArtifact!, this.now());
    latestTemplatePreviewState =
      persistTemplatePreviewState('template_hydration', 'hydrating', assembledFill!) ?? latestTemplatePreviewState;

    // Win #4: hydrated content streamed to frontend before action-button stage runs —
    // user sees all card/row data immediately rather than waiting for the full pipeline.
    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'template_actions_generating',
      progressMessage: 'Generating the staged template actions and buttons…',
      partialTemplateState: latestTemplatePreviewState
    });
    latestTemplatePreviewState =
      persistTemplatePreviewState('template_actions_generation', 'actions', assembledFill!) ?? latestTemplatePreviewState;
    let latestActionsFailure = {
      invalidJson: '{}',
      validationErrors: ['The staged template actions artifact was invalid.']
    };

    const actionsOutcome = await this.runRecipeGenerationStageWithRetries<{
      actions: RecipeTemplateActions;
      assembledFill: RecipeTemplateFill;
      compiled: ReturnType<typeof compileRecipeTemplateState>;
    }>({
      build,
      trace: generationTrace,
      stage: 'template_actions_generation',
      phase: 'template_actions_generating',
      templateId: selection.templateId,
      currentTemplateId: currentTemplate?.templateId ?? null,
      executeAttempt: async (_attemptNumber, priorFailureDetail) => {
        const actionsResponse = await this.requestRecipeTemplateStage(
          profile,
          requestId,
          this.applyRecipeStageRetryPrompt(
            this.buildRecipeTemplateActionsPrompt({
              context,
              currentRecipe,
              selection,
              hydratedTextArtifact: hydratedTextArtifact!
            }),
            priorFailureDetail
          ),
          'actions',
          settings
        );
        const extractedActions = extractRecipeTemplateActionsArtifact(actionsResponse.assistantMarkdown);
        const normalizedActions =
          extractedActions.rawValue !== null
            ? normalizeRecipeTemplateActions({
                templateId: selection.templateId,
                rawValue: extractedActions.rawValue,
                text: hydratedTextArtifact!,
                assistantSummary: context.summary?.subtitle ?? context.assistantContext.summary ?? null
              })
            : {
                actions: null,
                errors: extractedActions.errors,
                warnings: extractedActions.warnings,
                repairs: {
                  droppedKeys: [],
                  aliasMappings: [],
                  defaultedFields: [],
                  normalizedValues: []
                }
              };

        const validationErrors = [...extractedActions.errors, ...normalizedActions.errors].filter(Boolean);
        let candidateCompiled: ReturnType<typeof compileRecipeTemplateState> | null = null;
        let candidateFill: RecipeTemplateFill | null = null;

        if (normalizedActions.actions && validationErrors.length === 0) {
          candidateFill = assembleRecipeTemplateFill({
            text: hydratedTextArtifact!,
            actions: normalizedActions.actions
          });
          candidateCompiled = compileRecipeTemplateState({
            fill: candidateFill,
            currentState: normalizedMode === 'switch' ? currentTemplate : null,
            transitionReason: transitionDefinition?.reason ?? selection.reason
          });
          if (candidateCompiled.state && candidateCompiled.definition && candidateCompiled.errors.length === 0) {
            return {
              value: {
                actions: normalizedActions.actions,
                assembledFill: candidateFill,
                compiled: candidateCompiled
              },
              assistantMarkdown: actionsResponse.assistantMarkdown,
              detail: '',
              startedAt: actionsResponse.startedAt,
              endedAt: actionsResponse.endedAt,
              elapsedMs: actionsResponse.elapsedMs,
              configuredTimeoutMs: actionsResponse.configuredTimeoutMs,
              recommendedTimeoutMs: actionsResponse.recommendedTimeoutMs,
              failureReason: actionsResponse.failureReason,
              failureKind: null,
              retryable: false,
              autoRecoveryAttempted: extractedActions.parserDiagnostics.recoveryAttempted,
              autoRecoverySucceeded: extractedActions.parserDiagnostics.recoverySucceeded,
              templateId: selection.templateId,
              currentTemplateId: currentTemplate?.templateId ?? null,
              parserDiagnostics: extractedActions.parserDiagnostics,
              normalizationSummary: normalizedActions.repairs
            };
          }
        }

        const actionsAllErrors =
          validationErrors.length > 0
            ? validationErrors
            : candidateCompiled?.errors.length
              ? candidateCompiled.errors
              : ['The staged template actions/buttons artifact failed local validation.'];

        // Same-session correction for actions stage
        let correctionResult: { correctionTurns: number; correctionErrors: string[]; correctionFixed: boolean } | null = null;
        if (
          actionsResponse.runtimeSessionId &&
          !actionsResponse.errorDetail &&
          !actionsResponse.failureReason
        ) {
          const invalidJson = this.buildRecipeStageInvalidJson({
            assistantMarkdown: actionsResponse.assistantMarkdown,
            jsonText: extractedActions.jsonText,
            rawValue: extractedActions.rawValue,
            fallbackJson: JSON.stringify(
              normalizedActions.actions ?? { kind: 'recipe_template_actions', templateId: selection.templateId, actions: [], links: [] },
              null, 2
            )
          });
          const correction = await this.attemptSameSessionCorrection<{
            actions: RecipeTemplateActions;
            assembledFill: RecipeTemplateFill;
            compiled: ReturnType<typeof compileRecipeTemplateState>;
          }>({
            profile,
            requestId,
            sessionId: actionsResponse.runtimeSessionId,
            stage: 'actions',
            templateId: selection.templateId,
            invalidJson,
            validationErrors: actionsAllErrors,
            contractPacket: createRecipeTemplateActionsPacket(hydratedTextArtifact!),
            settings,
            build,
            extractAndValidate: (markdown) => {
              const extracted = extractRecipeTemplateActionsArtifact(markdown);
              const normalized =
                extracted.rawValue !== null
                  ? normalizeRecipeTemplateActions({
                      templateId: selection.templateId,
                      rawValue: extracted.rawValue,
                      text: hydratedTextArtifact!,
                      assistantSummary: context.summary?.subtitle ?? context.assistantContext.summary ?? null
                    })
                  : { actions: null, errors: extracted.errors, warnings: [], repairs: { droppedKeys: [], aliasMappings: [], defaultedFields: [], normalizedValues: [] } };
              const errs = [...extracted.errors, ...normalized.errors].filter(Boolean);
              if (normalized.actions && errs.length === 0) {
                const fill = assembleRecipeTemplateFill({ text: hydratedTextArtifact!, actions: normalized.actions });
                const compiled = compileRecipeTemplateState({
                  fill,
                  currentState: normalizedMode === 'switch' ? currentTemplate : null,
                  transitionReason: transitionDefinition?.reason ?? selection.reason
                });
                if (compiled.state && compiled.definition && compiled.errors.length === 0) {
                  return { value: { actions: normalized.actions, assembledFill: fill, compiled }, errors: [], invalidJson: null };
                }
                return { value: null, errors: compiled.errors.length > 0 ? compiled.errors : ['Compiled state invalid.'], invalidJson: extracted.rawValue ? JSON.stringify(extracted.rawValue) : null };
              }
              return { value: null, errors: errs.length > 0 ? errs : ['Actions artifact failed validation.'], invalidJson: extracted.rawValue ? JSON.stringify(extracted.rawValue) : null };
            }
          });
          correctionResult = correction;
          if (correction.correctionFixed && correction.value) {
            return {
              value: correction.value,
              assistantMarkdown: actionsResponse.assistantMarkdown,
              detail: '',
              startedAt: actionsResponse.startedAt,
              endedAt: actionsResponse.endedAt,
              elapsedMs: actionsResponse.elapsedMs,
              configuredTimeoutMs: actionsResponse.configuredTimeoutMs,
              recommendedTimeoutMs: actionsResponse.recommendedTimeoutMs,
              failureReason: null,
              failureKind: null,
              retryable: false,
              autoRecoveryAttempted: extractedActions.parserDiagnostics.recoveryAttempted,
              autoRecoverySucceeded: extractedActions.parserDiagnostics.recoverySucceeded,
              templateId: selection.templateId,
              currentTemplateId: currentTemplate?.templateId ?? null,
              parserDiagnostics: extractedActions.parserDiagnostics,
              normalizationSummary: normalizedActions.repairs,
              sameSessionCorrections: correction.correctionTurns,
              sameSessionCorrectionErrors: correction.correctionErrors,
              sameSessionCorrectionFixed: true,
              sameSessionSessionId: actionsResponse.runtimeSessionId
            };
          }
        }

        latestActionsFailure = {
          invalidJson: this.buildRecipeStageInvalidJson({
            assistantMarkdown: actionsResponse.assistantMarkdown,
            jsonText: extractedActions.jsonText,
            rawValue: extractedActions.rawValue,
            fallbackJson: JSON.stringify(
              normalizedActions.actions ?? {
                kind: 'recipe_template_actions',
                templateId: selection.templateId,
                actions: [],
                links: []
              },
              null,
              2
            )
          }),
          validationErrors: actionsAllErrors
        };
        const detail =
          (actionsResponse.errorDetail ?? [...latestActionsFailure.validationErrors, ...(correctionResult?.correctionErrors ?? [])].join('; ')) ||
          'The staged template actions artifact was invalid.';
        return {
          value: null,
          assistantMarkdown: actionsResponse.assistantMarkdown,
          detail,
          startedAt: actionsResponse.startedAt,
          endedAt: actionsResponse.endedAt,
          elapsedMs: actionsResponse.elapsedMs,
          configuredTimeoutMs: actionsResponse.configuredTimeoutMs,
          recommendedTimeoutMs: actionsResponse.recommendedTimeoutMs,
          failureReason: actionsResponse.failureReason,
          failureKind: actionsResponse.errorDetail
            ? this.mapRecipeRequestFailureKind(detail)
            : extractedActions.failureKind
              ? this.mapRecipeStructuredFailureKind(extractedActions.failureKind, detail)
              : 'validation_failed',
          retryable: true,
          autoRecoveryAttempted: extractedActions.parserDiagnostics.recoveryAttempted,
          autoRecoverySucceeded: extractedActions.parserDiagnostics.recoverySucceeded,
          templateId: selection.templateId,
          currentTemplateId: currentTemplate?.templateId ?? null,
          parserDiagnostics: extractedActions.parserDiagnostics,
          normalizationSummary: normalizedActions.repairs,
          sameSessionCorrections: correctionResult?.correctionTurns ?? 0,
          sameSessionCorrectionErrors: correctionResult?.correctionErrors ?? [],
          sameSessionCorrectionFixed: false,
          sameSessionSessionId: actionsResponse.runtimeSessionId
        };
      }
    });

    if (!actionsOutcome.ok) {
      build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
        phase: 'template_actions_repairing',
        progressMessage: 'Repairing the staged template actions from persisted artifacts…'
      });
      let latestActionsRepairFailure = latestActionsFailure;
      latestTemplatePreviewState =
        persistTemplatePreviewState('template_actions_repair', 'repairing', assembledFill!, {
          errorMessage: latestActionsFailure.validationErrors[0] ?? 'Repairing the staged template actions artifact.',
          failureScope: 'actions'
        }) ?? latestTemplatePreviewState;
      const actionsRepairOutcome = await this.runRecipeGenerationStageWithRetries<{
        actions: RecipeTemplateActions;
        assembledFill: RecipeTemplateFill;
        compiled: ReturnType<typeof compileRecipeTemplateState>;
      }>({
        build,
        trace: generationTrace,
        stage: 'template_actions_repair',
        phase: 'template_actions_repairing',
        attemptKind: 'repair',
        templateId: selection.templateId,
        currentTemplateId: currentTemplate?.templateId ?? null,
        executeAttempt: async (_attemptNumber, priorFailureDetail) => {
          const repairResponse = await this.requestRecipeTemplateStage(
            profile,
            requestId,
            this.applyRecipeStageRetryPrompt(
              this.buildRecipeTemplateActionsRepairPrompt({
                templateId: selection.templateId,
                invalidJson: latestActionsRepairFailure.invalidJson,
                validationErrors: latestActionsRepairFailure.validationErrors,
                hydratedTextArtifact: hydratedTextArtifact!
              }),
              priorFailureDetail
            ),
            'actions_repair',
            settings
          );
          const extractedRepair = extractRecipeTemplateActionsArtifact(repairResponse.assistantMarkdown);
          const normalizedRepair =
            extractedRepair.rawValue !== null
              ? normalizeRecipeTemplateActions({
                  templateId: selection.templateId,
                  rawValue: extractedRepair.rawValue,
                  text: hydratedTextArtifact!,
                  assistantSummary: context.summary?.subtitle ?? context.assistantContext.summary ?? null
                })
              : {
                  actions: null,
                  errors: extractedRepair.errors,
                  warnings: extractedRepair.warnings,
                  repairs: {
                    droppedKeys: [],
                    aliasMappings: [],
                    defaultedFields: [],
                    normalizedValues: []
                  }
                };

          const validationErrors = [...extractedRepair.errors, ...normalizedRepair.errors].filter(Boolean);
          let candidateCompiled: ReturnType<typeof compileRecipeTemplateState> | null = null;
          let candidateFill: RecipeTemplateFill | null = null;

          if (normalizedRepair.actions && validationErrors.length === 0) {
            candidateFill = assembleRecipeTemplateFill({
              text: hydratedTextArtifact!,
              actions: normalizedRepair.actions
            });
            candidateCompiled = compileRecipeTemplateState({
              fill: candidateFill,
              currentState: normalizedMode === 'switch' ? currentTemplate : null,
              transitionReason: transitionDefinition?.reason ?? selection.reason
            });
            if (candidateCompiled.state && candidateCompiled.definition && candidateCompiled.errors.length === 0) {
              return {
                value: {
                  actions: normalizedRepair.actions,
                  assembledFill: candidateFill,
                  compiled: candidateCompiled
                },
                assistantMarkdown: repairResponse.assistantMarkdown,
                detail: '',
                startedAt: repairResponse.startedAt,
                endedAt: repairResponse.endedAt,
                elapsedMs: repairResponse.elapsedMs,
                configuredTimeoutMs: repairResponse.configuredTimeoutMs,
                recommendedTimeoutMs: repairResponse.recommendedTimeoutMs,
                failureReason: repairResponse.failureReason,
                failureKind: null,
                retryable: false,
                autoRecoveryAttempted: extractedRepair.parserDiagnostics.recoveryAttempted,
                autoRecoverySucceeded: extractedRepair.parserDiagnostics.recoverySucceeded,
                templateId: selection.templateId,
                currentTemplateId: currentTemplate?.templateId ?? null,
                parserDiagnostics: extractedRepair.parserDiagnostics,
                normalizationSummary: normalizedRepair.repairs
              };
            }
          }

          latestActionsRepairFailure = {
            invalidJson: this.buildRecipeStageInvalidJson({
              assistantMarkdown: repairResponse.assistantMarkdown,
              jsonText: extractedRepair.jsonText,
              rawValue: extractedRepair.rawValue,
              fallbackJson: JSON.stringify(
                normalizedRepair.actions ?? {
                  kind: 'recipe_template_actions',
                  templateId: selection.templateId,
                  actions: [],
                  links: []
                },
                null,
                2
              )
            }),
            validationErrors:
              validationErrors.length > 0
                ? validationErrors
                : candidateCompiled?.errors.length
                  ? candidateCompiled.errors
                  : ['The staged template actions/buttons artifact failed local validation.']
          };
          const detail =
            (repairResponse.errorDetail ?? latestActionsRepairFailure.validationErrors.join('; ')) ||
            'The bounded template actions/buttons repair did not return valid JSON.';
          return {
            value: null,
            assistantMarkdown: repairResponse.assistantMarkdown,
            detail,
            startedAt: repairResponse.startedAt,
            endedAt: repairResponse.endedAt,
            elapsedMs: repairResponse.elapsedMs,
            configuredTimeoutMs: repairResponse.configuredTimeoutMs,
            recommendedTimeoutMs: repairResponse.recommendedTimeoutMs,
            failureReason: repairResponse.failureReason,
            failureKind: repairResponse.errorDetail
              ? this.mapRecipeRequestFailureKind(detail)
              : extractedRepair.failureKind
                ? this.mapRecipeStructuredFailureKind(extractedRepair.failureKind, detail)
                : 'validation_failed',
            retryable: true,
            autoRecoveryAttempted: extractedRepair.parserDiagnostics.recoveryAttempted,
            autoRecoverySucceeded: extractedRepair.parserDiagnostics.recoverySucceeded,
            templateId: selection.templateId,
            currentTemplateId: currentTemplate?.templateId ?? null,
            parserDiagnostics: extractedRepair.parserDiagnostics,
            normalizationSummary: normalizedRepair.repairs
          };
        }
      });

      if (!actionsRepairOutcome.ok) {
        const failure = this.classifyRecipeTemplateFailure({
          kind: 'actions_repair',
          detail: actionsRepairOutcome.detail,
          settings,
          configuredTimeoutMsOverride:
            actionsRepairOutcome.observation.configuredTimeoutMs ?? actionsRepairTimeoutPolicy.configuredTimeoutMs,
          recommendedTimeoutMsOverride:
            actionsRepairOutcome.observation.recommendedTimeoutMs ?? actionsRepairTimeoutPolicy.recommendedTimeoutMs,
          failureReason: actionsRepairOutcome.failureReason
        });
        return this.finalizeRecipeAppletBuildFailure({
          profile,
          session,
          currentRecipe,
          requestId,
          requestPreview,
          build,
          pipeline: nextPipeline,
          onEvent,
          failure,
          failureEvent: {
            code: 'RECIPE_TEMPLATE_ACTIONS_REPAIR_FAILED',
            message: 'Recipe template actions repair failed.'
          },
          detail: actionsRepairOutcome.detail,
          pipelineEventMessage: `Recipe generation failed for "${currentRecipe.title}" because the bounded staged actions repair did not produce a valid artifact.`,
          failedTemplateState:
            persistTemplatePreviewState('template_validation', 'failed', assembledFill!, {
              failureCategory: failure.category,
              errorMessage: actionsRepairOutcome.detail,
              failureScope: 'actions'
            }) ?? latestTemplatePreviewState,
          recipeGenerationTrace: generationTrace
        });
      }

      actionsArtifact = actionsRepairOutcome.value.actions;
      assembledFill = actionsRepairOutcome.value.assembledFill;
      compiledTemplate = actionsRepairOutcome.value.compiled;
    } else {
      actionsArtifact = actionsOutcome.value.actions;
      assembledFill = actionsOutcome.value.assembledFill;
      compiledTemplate = actionsOutcome.value.compiled;
    }

    this.persistRecipeBuildArtifact(build, actionsArtifact!, this.now());
    this.persistRecipeBuildArtifact(build, assembledFill!, this.now());

    if (!compiledTemplate?.state || !compiledTemplate.definition) {
      const validationDetail = 'Recipe template generation did not produce a compiled template state.';
      const failure = this.classifyRecipeTemplateFailure({
        kind: 'validation',
        detail: validationDetail,
        settings
      });
      return this.finalizeRecipeAppletBuildFailure({
        profile,
        session,
        currentRecipe,
        requestId,
        requestPreview,
        build,
        pipeline: nextPipeline,
        onEvent,
        failure,
        failureEvent: {
          code: 'RECIPE_TEMPLATE_VALIDATION_FAILED',
          message: 'Recipe template generation failed local validation.'
        },
        detail: validationDetail,
        pipelineEventMessage: `Recipe generation failed for "${currentRecipe.title}" because the final template state was invalid.`,
        failedTemplateState:
          persistTemplatePreviewState('template_validation', 'failed', assembledFill!, {
            failureCategory: failure.category,
            errorMessage: validationDetail,
            failureScope: 'all'
          }) ?? latestTemplatePreviewState,
        recipeGenerationTrace: generationTrace
      });
    }

    nextTemplateState = compiledTemplate.state;
    nextActionSpec = this.withRetryBuildActionSpec(
      createRecipeTemplateActionSpec(compiledTemplate.state, compiledTemplate.definition),
      true
    );

    if (!nextTemplateState || !nextActionSpec) {
      const validationDetail = 'Recipe template generation did not produce a valid template state.';
      this.completeRecipeGenerationStage(
        build,
        generationTrace,
        this.beginRecipeGenerationStage(generationTrace, {
          stage: 'template_validation',
          phase: 'template_validating',
          templateId: selection.templateId,
          currentTemplateId: currentTemplate?.templateId ?? null
        }),
        {
          status: 'failed',
          errorDetail: validationDetail,
          templateId: selection.templateId,
          currentTemplateId: currentTemplate?.templateId ?? null
        }
      );
      const failure = this.classifyRecipeTemplateFailure({
        kind: 'validation',
        detail: validationDetail,
        settings
      });
      return this.finalizeRecipeAppletBuildFailure({
        profile,
        session,
        currentRecipe,
        requestId,
        requestPreview,
        build,
        pipeline: nextPipeline,
        onEvent,
        failure,
        failureEvent: {
          code: 'RECIPE_TEMPLATE_VALIDATION_FAILED',
          message: 'Recipe template generation failed local validation.'
        },
        detail: validationDetail,
        pipelineEventMessage: `Recipe generation failed for "${currentRecipe.title}" because the final template state was invalid.`,
        failedTemplateState:
          persistTemplatePreviewState('template_validation', 'failed', assembledFill!, {
            failureCategory: failure.category,
            errorMessage: validationDetail,
            failureScope: 'all'
          }) ?? latestTemplatePreviewState,
        recipeGenerationTrace: generationTrace
      });
    }

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'template_validating',
      progressMessage: 'Validating the template-constrained recipe…'
    });
    const validationStage = this.beginRecipeGenerationStage(generationTrace, {
      stage: 'template_validation',
      phase: 'template_validating',
      templateId: nextTemplateState.templateId,
      currentTemplateId: currentTemplate?.templateId ?? null
    });

    this.persistRecipeBuildArtifact(build, selection, this.now());
    this.persistRecipeBuildArtifact(build, stagedTextArtifact!, this.now());
    this.persistRecipeBuildArtifact(build, actionsArtifact!, this.now());
    this.persistRecipeBuildArtifact(build, assembledFill!, this.now());
    this.persistRecipeBuildArtifact(build, nextActionSpec, this.now());
    latestTemplatePreviewState = nextTemplateState;
    this.persistRecipeTemplateProgressState({
      build,
      phase: build.phase,
      state: nextTemplateState,
      stage: 'template_validation',
      message: 'Persisted validated recipe template state.'
    });
    this.completeRecipeGenerationStage(build, generationTrace, validationStage, {
      status: 'succeeded',
      templateId: nextTemplateState.templateId,
      currentTemplateId: currentTemplate?.templateId ?? null
    });

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'template_promoting',
      progressMessage: 'Promoting the approved recipe template…'
    });
    const promotionStage = this.beginRecipeGenerationStage(generationTrace, {
      stage: 'template_promotion',
      phase: 'template_promoting',
      templateId: nextTemplateState.templateId,
      currentTemplateId: currentTemplate?.templateId ?? null
    });

    if (this.isRecipeEnrichmentSuperseded(currentRecipe.id, requestId)) {
      const supersededDetail = 'A newer Home recipe baseline superseded this background enrichment job before promotion.';
      this.completeRecipeGenerationStage(build, generationTrace, promotionStage, {
        status: 'failed',
        errorDetail: supersededDetail,
        templateId: nextTemplateState.templateId,
        currentTemplateId: currentTemplate?.templateId ?? null
      });
      await this.markRecipeEnrichmentSuperseded({
        profile,
        session,
        requestId,
        requestPreview,
        recipeId: currentRecipe.id,
        build
      });
      const supersededBuild = this.options.database.getRecipeBuild(build.id) ?? build;
      this.recordRecipeGenerationSummary(supersededBuild, generationTrace);
      return {
        recipe: currentRecipe,
        pipeline: nextPipeline,
        build: supersededBuild
      };
    }

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'ready',
      progressMessage: 'Recipe template ready.',
      completed: true
    });
    this.options.database.promoteRecipeBuild(currentRecipe.id, {
      buildId: build.id
    });
    const promotedRecipeWithTemplate =
      this.options.database.updateRecipe(currentRecipe.id, {
        profileId: currentRecipe.profileId,
        metadata: {
          ...currentRecipe.metadata,
          activeTemplateId: nextTemplateState.templateId
        }
      }) ?? currentRecipe;
    nextPipeline = updateRecipePipelineSegment(nextPipeline, 'applet', 'enrichment_ready', {
      status: 'ready',
      stage: 'enrichment_ready',
      message: `Recipe generation completed with the ${nextTemplateState.templateId} template.`,
      retryable: false,
      updatedAt: build.updatedAt
    });
    const promotedRecipeWithPipeline =
      this.persistRecipePipeline(requestId, nextPipeline, promotedRecipeWithTemplate) ?? promotedRecipeWithTemplate;
    const promotedRecipe = this.options.database.getRecipe(promotedRecipeWithPipeline.id) ?? promotedRecipeWithPipeline;
    this.completeRecipeGenerationStage(build, generationTrace, promotionStage, {
      status: 'succeeded',
      templateId: nextTemplateState.templateId,
      currentTemplateId: currentTemplate?.templateId ?? null
    });
    const generationSummary = this.recordRecipeGenerationSummary(build, generationTrace);
    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_TEMPLATE_PROMOTED',
      message: 'Promoted the template-constrained recipe.',
      detail: nextTemplateState.summary,
      payload: {
        recipeId: currentRecipe.id,
        buildId: build.id,
        templateId: nextTemplateState.templateId,
        mode: normalizedMode,
        repairInvoked: generationSummary.repairInvoked,
        totalElapsedMs: generationSummary.totalElapsedMs,
        perStageElapsedMs: generationSummary.perStageElapsedMs
      }
    });
    await this.emitRecipeEvent(
      this.createRecipeEvent(
        promotedRecipe,
        'updated',
        normalizedMode === 'switch'
          ? `Hermes switched "${promotedRecipe.title}" into the ${nextTemplateState.templateId} template.`
          : normalizedMode === 'update'
            ? `Hermes refreshed the ${nextTemplateState.templateId} recipe template for "${promotedRecipe.title}".`
            : `Hermes generated the ${nextTemplateState.templateId} recipe template for "${promotedRecipe.title}".`,
        'bridge',
        session.id,
        {
          renderMode: 'dynamic_v1',
          buildPhase: 'ready',
          recipePipelineStage: nextPipeline.currentStage,
          templateId: nextTemplateState.templateId,
          asyncEnrichment: true
        }
      ),
      onEvent,
      promotedRecipe
    );

    this.emitStructuredRecipeArtifactCompleted(profile.id, session.id, requestId, requestPreview, true);

    return {
      recipe: promotedRecipe,
      pipeline: nextPipeline,
      build
    };
  }

  private async continueRecipeDslEnrichment(
    profile: Profile,
    session: Session,
    currentRecipe: Recipe,
    requestId: string,
    requestPreview: string,
    settings: ReturnType<BridgeDatabase['getSettings']>,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void,
    context: RecipeAppletArtifactContext,
    pipeline: RecipePipelineState,
    build: RecipeBuild
  ): Promise<{ recipe: Recipe; pipeline: RecipePipelineState; build: RecipeBuild }> {
    if (this.isRecipeEnrichmentSuperseded(currentRecipe.id, requestId)) {
      await this.markRecipeEnrichmentSuperseded({
        profile,
        session,
        requestId,
        requestPreview,
        recipeId: currentRecipe.id,
        build
      });
      return {
        recipe: currentRecipe,
        pipeline,
        build
      };
    }

    let nextPipeline = updateRecipePipelineSegment(pipeline, 'applet', 'enrichment_generating', {
      status: 'running',
      stage: 'enrichment_generating',
      message: 'Recipe enrichment is generating a richer declarative Home recipe in the background.',
      retryable: true,
      updatedAt: this.now()
    });
    currentRecipe = this.persistRecipePipeline(requestId, nextPipeline, currentRecipe) ?? currentRecipe;

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'dsl_generating',
      progressMessage: 'Generating the richer recipe DSL…'
    });
    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_DSL_GENERATION_STARTED',
      message: 'Started recipe DSL generation.',
      detail: 'Hermes is generating only a declarative recipe DSL artifact for async enrichment.',
      payload: {
        recipeId: currentRecipe.id,
        buildId: build.id,
        configuredTimeoutMs: this.resolveAsyncRecipeAppletTimeoutMs(settings)
      }
    });

    const dslResponse = await this.requestRecipeDslStage(
      profile,
      requestId,
      this.buildRecipeDslPrompt({
        context,
        currentRecipe
      }),
      'generate',
      settings
    );
    const extractedDsl = extractRecipeDslArtifact(dslResponse.assistantMarkdown);

    if (!context.recipeModel) {
      const detail = 'The baseline recipe model was missing, so the DSL could not be normalized safely.';
      const failure = this.classifyRecipeDslFailure({
        kind: 'context',
        detail,
        settings
      });
      return this.finalizeRecipeAppletBuildFailure({
        profile,
        session,
        currentRecipe,
        requestId,
        requestPreview,
        build,
        pipeline: nextPipeline,
        onEvent,
        failure,
        failureEvent: this.resolveRecipeDslFailureEvent(
          failure,
          'RECIPE_WORKRECIPE_DSL_CONTEXT_INVALID',
          'The richer recipe DSL context was invalid.'
        ),
        detail,
        pipelineEventMessage: `Hermes kept the baseline Home recipe for "${currentRecipe.title}" because the richer recipe DSL context was invalid.`
      });
    }

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'dsl_normalizing',
      progressMessage: 'Normalizing the richer recipe DSL locally…'
    });

    const assistantSummary = context.summary?.note ?? context.summary?.subtitle ?? context.assistantContext.summary;
    let normalizedArtifactWarnings = [...extractedDsl.warnings];
    let normalizedDsl =
      extractedDsl.rawValue ?? extractedDsl.artifact
        ? normalizeRecipeDsl({
            baseModel: context.recipeModel,
            dsl: extractedDsl.rawValue ?? extractedDsl.artifact,
            assistantSummary
          })
        : {
            dsl: null,
            model: null,
            patch: null,
            warnings: [] as string[],
            errors: [...extractedDsl.errors],
            repairs: {
              droppedKeys: [] as string[],
              aliasMappings: [] as string[],
              defaultedFields: [] as string[],
              normalizedSynonyms: [] as string[]
            }
          };
    let persistedDslArtifact = normalizedDsl.dsl;
    let repairAttempted = false;
    let failureReason = dslResponse.failureReason;
    let stageErrorDetail = dslResponse.errorDetail;

    if ((!normalizedDsl.model || !normalizedDsl.patch) && (extractedDsl.jsonText || dslResponse.assistantMarkdown.trim().length > 0)) {
      repairAttempted = true;
      build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
        phase: 'dsl_repairing',
        progressMessage: 'Repairing the richer recipe DSL once from persisted artifacts…'
      });
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: session.id,
        requestId,
        severity: 'warning',
        category: 'recipes',
        code: 'RECIPE_DSL_REPAIR_ATTEMPTED',
        message: 'Attempting one bounded recipe DSL repair.',
        detail:
          normalizedDsl.errors.join('; ') ||
          extractedDsl.errors.join('; ') ||
          'The recipe DSL artifact was missing or invalid after local normalization.',
        payload: {
          recipeId: currentRecipe.id,
          buildId: build.id
        }
      });

      const repairErrors = [...new Set([...extractedDsl.errors, ...normalizedDsl.errors])];
      const repairedResponse = await this.requestRecipeDslStage(
        profile,
        requestId,
        this.buildRecipeDslRepairPrompt({
          invalidDsl: extractedDsl.jsonText ?? dslResponse.assistantMarkdown,
          errors: repairErrors
        }),
        'repair',
        settings
      );
      failureReason = repairedResponse.failureReason;
      stageErrorDetail = repairedResponse.errorDetail;
      const repairedDsl = extractRecipeDslArtifact(repairedResponse.assistantMarkdown);
      normalizedArtifactWarnings = [...normalizedArtifactWarnings, ...repairedDsl.warnings];
      normalizedDsl =
        repairedDsl.rawValue ?? repairedDsl.artifact
          ? normalizeRecipeDsl({
              baseModel: context.recipeModel,
              dsl: repairedDsl.rawValue ?? repairedDsl.artifact,
              assistantSummary
            })
          : {
              dsl: null,
              model: null,
              patch: null,
              warnings: [] as string[],
              errors: [...repairErrors, ...repairedDsl.errors],
              repairs: {
                droppedKeys: [] as string[],
                aliasMappings: [] as string[],
                defaultedFields: [] as string[],
                normalizedSynonyms: [] as string[]
              }
            };
      persistedDslArtifact = normalizedDsl.dsl;
    }

    if (!normalizedDsl.model || !normalizedDsl.patch) {
      const detail =
        stageErrorDetail ??
        (normalizedDsl.errors.join('; ') || 'The bridge could not normalize the richer recipe DSL into a safe recipe model.');
      const failure = this.classifyRecipeDslFailure({
        kind: repairAttempted ? 'repair' : extractedDsl.rawValue || extractedDsl.artifact ? 'normalization' : 'dsl',
        detail,
        settings,
        configuredTimeoutMsOverride: this.resolveAsyncRecipeAppletTimeoutMs(settings),
        failureReason
      });
      return this.finalizeRecipeAppletBuildFailure({
        profile,
        session,
        currentRecipe,
        requestId,
        requestPreview,
        build,
        pipeline: nextPipeline,
        onEvent,
        failure,
        failureEvent: this.resolveRecipeDslFailureEvent(
          failure,
          repairAttempted ? 'RECIPE_WORKRECIPE_DSL_REPAIR_FAILED' : 'RECIPE_WORKRECIPE_DSL_NORMALIZATION_FAILED',
          repairAttempted
            ? 'The richer recipe DSL could not be repaired safely.'
            : 'The richer recipe DSL could not be normalized safely.'
        ),
        detail,
        pipelineEventMessage: repairAttempted
          ? `Hermes kept the baseline Home recipe because one bounded repair still could not make the richer recipe DSL for "${currentRecipe.title}" safe.`
          : `Hermes kept the baseline Home recipe because the richer recipe DSL for "${currentRecipe.title}" could not be normalized safely.`
      });
    }

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'dsl_applying',
      progressMessage: 'Applying the richer recipe patch…'
    });

    this.persistRecipeBuildArtifact(build, persistedDslArtifact ?? normalizedDsl.dsl ?? extractedDsl.artifact!, this.now());
    this.persistRecipeBuildArtifact(
      build,
      RecipeActionSpecSchema.parse({
        kind: 'action_spec',
        schemaVersion: 'recipe_action_spec/v1',
        actions: normalizedDsl.model.actions
      }),
      this.now()
    );
    this.persistRecipeBuildArtifact(build, normalizedDsl.model, this.now());
    this.persistRecipeBuildArtifact(build, normalizedDsl.patch, this.now());

    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: normalizedDsl.warnings.length > 0 || normalizedArtifactWarnings.length > 0 ? 'warning' : 'info',
      category: 'recipes',
      code: 'RECIPE_DSL_NORMALIZED',
      message: 'Normalized the richer recipe DSL locally.',
      detail:
        normalizedDsl.warnings.join('; ') ||
        normalizedArtifactWarnings.join('; ') ||
        normalizedDsl.dsl?.summary,
      payload: {
        recipeId: currentRecipe.id,
        buildId: build.id,
        warningCount: normalizedDsl.warnings.length + normalizedArtifactWarnings.length,
        tabCount: normalizedDsl.model.tabs.length,
        viewCount: normalizedDsl.model.views.length,
        sectionCount: normalizedDsl.model.sections.length,
        patchOperationCount: normalizedDsl.patch.operations.length,
        repairAttempted,
        droppedKeyCount: normalizedDsl.repairs.droppedKeys.length,
        aliasMappingCount: normalizedDsl.repairs.aliasMappings.length,
        defaultedFieldCount: normalizedDsl.repairs.defaultedFields.length,
        normalizedSynonymCount: normalizedDsl.repairs.normalizedSynonyms.length
      }
    });
    if (repairAttempted) {
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: session.id,
        requestId,
        severity: 'info',
        category: 'recipes',
        code: 'RECIPE_DSL_REPAIR_SUCCEEDED',
        message: 'The bounded recipe DSL repair produced a valid artifact.',
        detail: normalizedDsl.dsl?.summary,
        payload: {
          recipeId: currentRecipe.id,
          buildId: build.id
        }
      });
    }

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'dsl_promoting',
      progressMessage: 'Promoting the richer recipe…'
    });
    if (this.isRecipeEnrichmentSuperseded(currentRecipe.id, requestId)) {
      await this.markRecipeEnrichmentSuperseded({
        profile,
        session,
        requestId,
        requestPreview,
        recipeId: currentRecipe.id,
        build
      });
      return {
        recipe: currentRecipe,
        pipeline: nextPipeline,
        build
      };
    }

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'ready',
      progressMessage: 'Richer recipe ready.',
      completed: true
    });
    this.options.database.promoteRecipeBuild(currentRecipe.id, {
      buildId: build.id
    });
    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_DSL_PROMOTED',
      message: 'Promoted the normalized richer recipe.',
      detail: normalizedDsl.dsl?.summary,
      payload: {
        recipeId: currentRecipe.id,
        buildId: build.id
      }
    });
    nextPipeline = updateRecipePipelineSegment(nextPipeline, 'applet', 'enrichment_ready', {
      status: 'ready',
      stage: 'enrichment_ready',
      message: 'Recipe enrichment completed and the richer declarative recipe is ready.',
      retryable: false,
      updatedAt: build.updatedAt
    });
    const promotedRecipeWithPipeline = this.persistRecipePipeline(requestId, nextPipeline, currentRecipe) ?? currentRecipe;
    const promotedRecipe = this.options.database.getRecipe(promotedRecipeWithPipeline.id) ?? promotedRecipeWithPipeline;
    const promotedEvent = this.createRecipeEvent(
      promotedRecipe,
      'updated',
      `Hermes upgraded "${promotedRecipe.title}" with a richer declarative recipe.`,
      'bridge',
      session.id,
      {
        renderMode: 'dynamic_v1',
        buildPhase: 'ready',
        recipePipelineStage: nextPipeline.currentStage,
        asyncEnrichment: true
      }
    );
    await this.emitRecipeEvent(promotedEvent, onEvent, promotedRecipe);
    return {
      recipe: promotedRecipe,
      pipeline: nextPipeline,
      build
    };
  }

  private async continueRecipeAppletUpgrade(
    profile: Profile,
    session: Session,
    currentRecipe: Recipe,
    requestId: string,
    requestPreview: string,
    settings: ReturnType<BridgeDatabase['getSettings']>,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void,
    context: RecipeAppletArtifactContext,
    pipeline: RecipePipelineState,
    build: RecipeBuild
  ): Promise<{ recipe: Recipe; pipeline: RecipePipelineState; build: RecipeBuild }> {
    this.assertExperimentalRecipeAppletRuntimeEnabled();

    if (this.isRecipeEnrichmentSuperseded(currentRecipe.id, requestId)) {
      await this.markRecipeEnrichmentSuperseded({
        profile,
        session,
        requestId,
        requestPreview,
        recipeId: currentRecipe.id,
        build
      });
      return {
        recipe: currentRecipe,
        pipeline,
        build
      };
    }

    let nextPipeline = updateRecipePipelineSegment(pipeline, 'applet', 'applet_generating', {
      status: 'running',
      stage: 'applet_generating',
      message: 'Recipe enrichment is generating the richer Home applet in the background.',
      retryable: true,
      updatedAt: this.now()
    });
    currentRecipe = this.persistRecipePipeline(requestId, nextPipeline, currentRecipe) ?? currentRecipe;

    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_APPLET_BUILD_STARTED',
      message: 'Started the optional async recipe applet build.',
      detail: 'The baseline Home recipe remains active while richer sections are generated and verified asynchronously.',
      payload: {
        recipeId: currentRecipe.id,
        buildId: build.id,
        sourceArtifactBuildId: context.buildId
      }
    });

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_planning',
      progressMessage: 'Planning the background recipe enrichment…'
    });
    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_generating_source',
      progressMessage: 'Generating the richer recipe applet source…'
    });
    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_APPLET_SOURCE_GENERATION_STARTED',
      message: 'Started recipe applet source generation.',
      detail: 'Hermes is generating only the TSX source module for the async enrichment lane.',
      payload: {
        recipeId: currentRecipe.id,
        buildId: build.id,
        configuredTimeoutMs: this.resolveAsyncRecipeAppletTimeoutMs(settings)
      }
    });

    let sourceResponse = await this.requestRecipeAppletStage(
      profile,
      requestId,
      this.buildRecipeAppletSourcePrompt({
        context,
        currentRecipe
      }),
      'source',
      settings
    );
    let extractedSource = extractRecipeAppletSource(sourceResponse.assistantMarkdown);
    if (!extractedSource.artifact && !sourceResponse.failureReason && !sourceResponse.errorDetail) {
      build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
        phase: 'applet_repairing',
        progressMessage: 'Repairing the recipe applet source…'
      });
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: session.id,
        requestId,
        severity: 'warning',
        category: 'recipes',
        code: 'RECIPE_APPLET_REPAIR_ATTEMPTED',
        message: 'Attempting one bounded recipe applet source repair.',
        detail:
          sourceResponse.errorDetail ??
          (extractedSource.errors.join('; ') || 'The source artifact was missing or invalid.'),
        payload: {
          recipeId: currentRecipe.id,
          buildId: build.id
        }
      });

      sourceResponse = await this.requestRecipeAppletStage(
        profile,
        requestId,
        this.buildRecipeAppletRepairPrompt({
          context,
          currentRecipe,
          sourceArtifact: {
            source: sourceResponse.assistantMarkdown
          },
          verification: {
            kind: 'applet_verification',
            schemaVersion: 'recipe_applet_verification/v1',
            status: 'failed',
            staticValidation: {
              status: 'failed',
              message: extractedSource.errors.join('; ') || 'The source artifact was missing or invalid.'
            },
            capabilityValidation: {
              status: 'skipped',
              message: 'Skipped because the applet source could not be parsed.'
            },
            typecheck: {
              status: 'skipped',
              message: 'Skipped because the applet source could not be parsed.'
            },
            generatedTests: {
              status: 'skipped',
              message: 'Skipped because the applet source could not be parsed.'
            },
            renderSmoke: {
              status: 'skipped',
              message: 'Skipped because the applet source could not be parsed.'
            },
            smallPaneSmoke: {
              status: 'skipped',
              message: 'Skipped because the applet source could not be parsed.'
            },
            errors: extractedSource.errors,
            warnings: extractedSource.warnings,
            checkedAt: this.now()
          }
        }),
        'repair',
        settings
      );
      extractedSource = extractRecipeAppletSource(sourceResponse.assistantMarkdown);
    }

    if (!extractedSource.artifact) {
      const detail =
        sourceResponse.errorDetail ??
        (extractedSource.errors.join('; ') || 'Hermes did not emit a valid recipe applet source module.');
      const failure = this.classifyRecipeAppletFailure({
        kind: 'source',
        detail,
        settings,
        failureReason: sourceResponse.failureReason,
        recommendedTimeoutMsOverride: 90_000,
        configuredTimeoutMsOverride: this.resolveAsyncRecipeAppletTimeoutMs(settings)
      });
      const failureEvent = this.resolveRecipeAppletFailureEvent(
        failure,
        'RECIPE_APPLET_SOURCE_FAILED',
        'The recipe applet source could not be generated.'
      );
      return this.finalizeRecipeAppletBuildFailure({
        profile,
        session,
        currentRecipe,
        requestId,
        requestPreview,
        build,
        pipeline: nextPipeline,
        onEvent,
        failure,
        failureEvent,
        detail,
        pipelineEventMessage: `Hermes kept the baseline Home recipe because the applet source for "${currentRecipe.title}" could not be generated asynchronously.`
      });
    }

    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_APPLET_SOURCE_GENERATION_SUCCEEDED',
      message: 'Recipe applet source generation completed.',
      detail: 'Hermes emitted a TSX recipe applet module that the bridge parsed successfully.',
      payload: {
        recipeId: currentRecipe.id,
        buildId: build.id
      }
    });

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_synthesizing_manifest',
      progressMessage: 'Synthesizing the recipe applet manifest locally…'
    });

    let sourceArtifact = extractedSource.artifact;
    let synthesizedArtifacts = this.synthesizeRecipeAppletArtifacts({
      context,
      currentRecipe,
      sourceArtifact
    });

    if (!synthesizedArtifacts.manifest || !synthesizedArtifacts.plan || !synthesizedArtifacts.testArtifact) {
      const detail =
        synthesizedArtifacts.errors.join('; ') ||
        'The bridge could not synthesize a deterministic recipe applet manifest from the generated source.';
      const failure = this.classifyRecipeAppletFailure({
        kind: 'manifest',
        detail,
        settings
      });
      const failureEvent = this.resolveRecipeAppletFailureEvent(
        failure,
        'RECIPE_APPLET_MANIFEST_FAILED',
        'The recipe applet manifest could not be synthesized locally.'
      );
      return this.finalizeRecipeAppletBuildFailure({
        profile,
        session,
        currentRecipe,
        requestId,
        requestPreview,
        build,
        pipeline: nextPipeline,
        onEvent,
        failure,
        failureEvent,
        detail,
        pipelineEventMessage: `Hermes kept the baseline Home recipe because the applet manifest for "${currentRecipe.title}" could not be synthesized locally.`
      });
    }

    let manifest = synthesizedArtifacts.manifest;
    let plan = synthesizedArtifacts.plan;
    let testArtifact = synthesizedArtifacts.testArtifact;
    const manifestActionSpec = RecipeActionSpecSchema.parse({
      kind: 'action_spec',
      schemaVersion: 'recipe_action_spec/v1',
      actions: manifest.actions
    });
    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_APPLET_MANIFEST_SYNTHESIZED',
      message: 'Synthesized the recipe applet manifest locally.',
      detail:
        synthesizedArtifacts.warnings.join('; ') ||
        'The bridge derived the manifest, plan, and generated tests from the applet source and persisted Home artifacts.',
      payload: {
        recipeId: currentRecipe.id,
        buildId: build.id,
        actionCount: manifest.actions.length,
        capabilityCount: manifest.requestedCapabilities.length,
        datasetCount: manifest.declaredDatasets.length
      }
    });

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_generating_tests',
      progressMessage: 'Generating recipe applet tests…'
    });

    this.persistRecipeBuildArtifact(build, sourceArtifact, this.now());
    this.persistRecipeBuildArtifact(build, manifest, this.now());
    this.persistRecipeBuildArtifact(build, plan, this.now());
    this.persistRecipeBuildArtifact(build, manifestActionSpec, this.now());
    this.persistRecipeBuildArtifact(build, testArtifact, this.now());

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_validating',
      progressMessage: 'Validating recipe applet capabilities…'
    });
    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_typechecking',
      progressMessage: 'Typechecking the recipe applet…'
    });
    nextPipeline = updateRecipePipelineSegment(nextPipeline, 'applet', 'applet_validating', {
      status: 'running',
      stage: 'applet_validating',
      message: 'Validating the optional recipe applet in the background.',
      retryable: true,
      updatedAt: build.updatedAt
    });
    currentRecipe = this.persistRecipePipeline(requestId, nextPipeline, currentRecipe) ?? currentRecipe;
    await this.emitRecipePipelineStateEvent(
      currentRecipe,
      session.id,
      onEvent,
      `Hermes is validating the optional recipe applet for "${currentRecipe.title}" in the background.`,
      {
        buildPhase: build.phase,
        asyncEnrichment: true
      }
    );

    let verificationResult = await verifyRecipeApplet({
      manifest,
      sourceArtifact,
      testArtifact,
      context: this.createRecipeAppletRenderContext(currentRecipe, context),
      normalizedData: context.normalizedData
    });

    if (verificationResult.verification.status === 'failed') {
      build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
        phase: 'applet_repairing',
        progressMessage: 'Repairing the recipe applet after verification failed…'
      });
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: session.id,
        requestId,
        severity: 'warning',
        category: 'recipes',
        code: 'RECIPE_APPLET_REPAIR_ATTEMPTED',
        message: 'Attempting one bounded recipe applet repair after verification failed.',
        detail: verificationResult.verification.errors.join('; '),
        payload: {
          recipeId: currentRecipe.id,
          buildId: build.id
        }
      });

      sourceResponse = await this.requestRecipeAppletStage(
        profile,
        requestId,
        this.buildRecipeAppletRepairPrompt({
          context,
          currentRecipe,
          sourceArtifact,
          verification: verificationResult.verification
        }),
        'repair',
        settings
      );
      const repairedSource = extractRecipeAppletSource(sourceResponse.assistantMarkdown);
      if (repairedSource.artifact) {
        sourceArtifact = repairedSource.artifact;
        synthesizedArtifacts = this.synthesizeRecipeAppletArtifacts({
          context,
          currentRecipe,
          sourceArtifact
        });
        if (!synthesizedArtifacts.manifest || !synthesizedArtifacts.plan || !synthesizedArtifacts.testArtifact) {
          verificationResult = {
            renderTree: null,
            verification: {
              kind: 'applet_verification',
              schemaVersion: 'recipe_applet_verification/v1',
              status: 'failed',
              staticValidation: {
                status: 'failed',
                message:
                  synthesizedArtifacts.errors.join('; ') ||
                  'The repaired recipe applet source could not be synthesized into a deterministic manifest.'
              },
              capabilityValidation: {
                status: 'skipped',
                message: 'Skipped because the repaired recipe applet manifest could not be synthesized.'
              },
              typecheck: {
                status: 'skipped',
                message: 'Skipped because the repaired recipe applet manifest could not be synthesized.'
              },
              generatedTests: {
                status: 'skipped',
                message: 'Skipped because the repaired recipe applet manifest could not be synthesized.'
              },
              renderSmoke: {
                status: 'skipped',
                message: 'Skipped because the repaired recipe applet manifest could not be synthesized.'
              },
              smallPaneSmoke: {
                status: 'skipped',
                message: 'Skipped because the repaired recipe applet manifest could not be synthesized.'
              },
              errors: synthesizedArtifacts.errors,
              warnings: synthesizedArtifacts.warnings,
              checkedAt: this.now()
            }
          };
        } else {
          manifest = synthesizedArtifacts.manifest;
          plan = synthesizedArtifacts.plan;
          testArtifact = synthesizedArtifacts.testArtifact;
          this.persistRecipeBuildArtifact(build, manifest, this.now());
          this.persistRecipeBuildArtifact(build, plan, this.now());
          this.persistRecipeBuildArtifact(
            build,
            RecipeActionSpecSchema.parse({
              kind: 'action_spec',
              schemaVersion: 'recipe_action_spec/v1',
              actions: manifest.actions
            }),
            this.now()
          );
          this.persistRecipeBuildArtifact(build, testArtifact, this.now());
          this.persistRecipeBuildArtifact(build, sourceArtifact, this.now());
          this.recordTelemetry({
            profileId: profile.id,
            sessionId: session.id,
            requestId,
            severity: 'info',
            category: 'recipes',
            code: 'RECIPE_APPLET_MANIFEST_SYNTHESIZED',
            message: 'Re-synthesized the recipe applet manifest locally after repair.',
            detail:
              synthesizedArtifacts.warnings.join('; ') ||
              'The bridge refreshed the local manifest and generated tests after the repaired source was emitted.',
            payload: {
              recipeId: currentRecipe.id,
              buildId: build.id,
              actionCount: manifest.actions.length,
              capabilityCount: manifest.requestedCapabilities.length,
              datasetCount: manifest.declaredDatasets.length
            }
          });
          verificationResult = await verifyRecipeApplet({
            manifest,
            sourceArtifact,
            testArtifact,
            context: this.createRecipeAppletRenderContext(currentRecipe, context),
            normalizedData: context.normalizedData
          });
        }
      }
    }

    this.persistRecipeBuildArtifact(build, verificationResult.verification, this.now());
    if (verificationResult.renderTree) {
      this.persistRecipeBuildArtifact(build, verificationResult.renderTree, this.now());
      build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
        phase: 'applet_section_ready',
        progressMessage: 'Recipe enrichment filled the richer sections and is preparing promotion…'
      });
      plan = synthesizeRecipeAppletPlan(manifest, {
        note: 'The bridge refreshed the plan with the verified render tree node kinds.',
        nodeKinds: collectRecipeAppletNodeKinds(verificationResult.renderTree)
      });
      this.persistRecipeBuildArtifact(build, plan, this.now());
    }

    if (verificationResult.verification.status !== 'passed' || !verificationResult.renderTree) {
      const failure = this.classifyRecipeAppletFailure({
        kind: 'verification',
        detail: verificationResult.verification.errors.join('; ') || 'Recipe applet verification failed.',
        settings,
        verification: verificationResult.verification
      });
      return this.finalizeRecipeAppletBuildFailure({
        profile,
        session,
        currentRecipe,
        requestId,
        requestPreview,
        build,
        pipeline: nextPipeline,
        onEvent,
        failure,
        failureEvent: {
          code: 'RECIPE_APPLET_VERIFICATION_FAILED',
          message: 'The recipe applet did not pass verification.'
        },
        detail: verificationResult.verification.errors.join('; ') || 'Recipe applet verification failed.',
        pipelineEventMessage: `Hermes kept the baseline Home recipe because the applet for "${currentRecipe.title}" failed verification.`
      });
    }

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_promoting',
      progressMessage: 'Promoting the recipe applet…'
    });
    if (this.isRecipeEnrichmentSuperseded(currentRecipe.id, requestId)) {
      await this.markRecipeEnrichmentSuperseded({
        profile,
        session,
        requestId,
        requestPreview,
        recipeId: currentRecipe.id,
        build
      });
      return {
        recipe: currentRecipe,
        pipeline: nextPipeline,
        build
      };
    }
    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'ready',
      progressMessage: 'Recipe applet ready.',
      completed: true
    });
    this.options.database.promoteRecipeAppletBuild(currentRecipe.id, {
      buildId: build.id
    });
    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_APPLET_PROMOTED',
      message: 'Promoted the verified recipe applet.',
      detail: manifest.summary,
      payload: {
        recipeId: currentRecipe.id,
        buildId: build.id
      }
    });
    nextPipeline = updateRecipePipelineSegment(nextPipeline, 'applet', 'applet_ready', {
      status: 'ready',
      stage: 'applet_ready',
      message: 'Recipe enrichment completed and the richer applet is ready.',
      retryable: false,
      updatedAt: build.updatedAt
    });
    const promotedRecipeWithPipeline = this.persistRecipePipeline(requestId, nextPipeline, currentRecipe) ?? currentRecipe;
    const promotedRecipe = this.options.database.getRecipe(promotedRecipeWithPipeline.id) ?? promotedRecipeWithPipeline;
    const promotedEvent = this.createRecipeEvent(
      promotedRecipe,
      'updated',
      `Hermes upgraded "${promotedRecipe.title}" with a verified recipe applet.`,
      'bridge',
      session.id,
      {
        renderMode: 'dynamic_v1',
        buildPhase: 'ready',
        recipePipelineStage: nextPipeline.currentStage,
        asyncEnrichment: true
      }
    );
    await this.emitRecipeEvent(promotedEvent, onEvent, promotedRecipe);
    return {
      recipe: promotedRecipe,
      pipeline: nextPipeline,
      build
    };
  }

  private async runQueuedRecipeAppletEnrichmentFromRequest(input: Extract<RecipeAppletEnrichmentJobInput, { kind: 'request' }>) {
    const onEvent = async () => undefined;
    const currentRecipe = this.options.database.getRecipe(input.recipeId);
    const build = this.options.database.getRecipeBuild(input.buildId);
    if (!currentRecipe || !build) {
      return;
    }
    if (this.isRecipeEnrichmentSuperseded(input.recipeId, input.requestId)) {
      await this.markRecipeEnrichmentSuperseded({
        profile: input.profile,
        session: input.session,
        requestId: input.requestId,
        requestPreview: input.requestPreview,
        recipeId: input.recipeId,
        build
      });
      return;
    }

    let pipeline = this.resolveRecipePipelineSnapshot(input.requestId, currentRecipe, createInitialRecipePipeline(this.now()));
    const generationTrace = this.createRecipeGenerationTrace(build, currentRecipe.metadata.activeTemplateId ?? null);
    let nextBuild = await this.advanceRecipeBuild(build, input.requestPreview, onEvent, {
      phase: 'template_selecting',
      progressMessage: 'Analyzing persisted Home artifacts for template generation…'
    });

    const structuredArtifact = await this.generateStructuredRecipeArtifact(
      nextBuild,
      generationTrace,
      input.profile,
      input.session,
      currentRecipe,
      input.requestId,
      input.requestPreview,
      input.requestMode,
      input.structuredIntentPrompt,
      input.conversationalAssistantMarkdown,
      input.structuredRecipeIntent,
      input.refreshContext,
      input.settings,
      onEvent
    );

    if (!structuredArtifact.extracted?.envelope) {
      const failure = this.classifyRecipeTemplateFailure({
        kind: 'selection',
        detail:
          structuredArtifact.errorDetail ??
          structuredArtifact.extracted?.errors.join('; ') ??
          'Hermes did not emit a usable minimal recipe seed for template generation.',
        settings: input.settings
      });
      await this.finalizeRecipeAppletBuildFailure({
        profile: input.profile,
        session: input.session,
        currentRecipe,
        requestId: input.requestId,
        requestPreview: input.requestPreview,
        build: nextBuild,
        pipeline,
        onEvent,
        failure,
        failureEvent: {
          code: 'RECIPE_TEMPLATE_SELECTION_FAILED',
          message: 'Template generation could not start because the seed artifacts were invalid.'
        },
        detail:
          structuredArtifact.errorDetail ??
          structuredArtifact.extracted?.errors.join('; ') ??
          'Hermes did not emit a usable minimal recipe seed for template generation.',
        pipelineEventMessage: `Recipe generation failed for "${currentRecipe.title}" because the template seed could not be generated asynchronously.`,
        recipeGenerationTrace: generationTrace
      });
      return;
    }

    const baseContext = this.buildRecipeAppletArtifactContext({
      currentRecipe,
      envelope: structuredArtifact.extracted.envelope,
      prompt: input.structuredIntentPrompt,
      requestMode: input.requestMode,
      timestamp: this.now(),
      structuredRecipeIntent: input.structuredRecipeIntent,
      conversationalAssistantMarkdown: input.conversationalAssistantMarkdown
    });
    const context: RecipeTemplateArtifactContext = {
      buildId: baseContext.buildId,
      build: baseContext.build,
      userPrompt: baseContext.userPrompt,
      intent: baseContext.intent,
      rawData: baseContext.rawData,
      assistantContext: baseContext.assistantContext,
      analysis: baseContext.analysis,
      normalizedData: baseContext.normalizedData,
      summary: baseContext.summary,
      fallback: baseContext.fallback,
      currentTemplate: currentRecipe.dynamic?.recipeTemplate ?? null
    };
    this.persistRecipeTemplateBaseArtifacts(nextBuild, context, this.now());
    pipeline = updateRecipePipelineSegment(pipeline, 'applet', 'enrichment_generating', {
      status: 'running',
      stage: 'enrichment_generating',
      message: 'Recipe generation is preparing the approved template artifacts in the background.',
      retryable: true,
      updatedAt: nextBuild.updatedAt
    });
    const updatedRecipe = this.persistRecipePipeline(input.requestId, pipeline, currentRecipe) ?? currentRecipe;
    await this.emitRecipePipelineStateEvent(
      updatedRecipe,
      input.session.id,
      onEvent,
      `Hermes prepared the template-generation artifacts for "${updatedRecipe.title}" from persisted seed data.`,
      {
        buildPhase: nextBuild.phase,
        asyncEnrichment: true
      }
    );

    await this.continueRecipeTemplateEnrichment(
      input.profile,
      input.session,
      this.options.database.getRecipe(updatedRecipe.id) ?? updatedRecipe,
      input.requestId,
      input.requestPreview,
      input.settings,
      onEvent,
      context,
      pipeline,
      nextBuild,
      generationTrace,
      input.mutationIntent ?? null
    );
  }

  private async runQueuedRecipeAppletEnrichmentFromArtifacts(
    input: Extract<RecipeAppletEnrichmentJobInput, { kind: 'retry' }>,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void = async () => undefined
  ) {
    const currentRecipe = this.options.database.getRecipe(input.recipeId);
    const build = this.options.database.getRecipeBuild(input.buildId);
    if (!currentRecipe || !build) {
      return;
    }
    if (this.isRecipeEnrichmentSuperseded(input.recipeId, input.requestId)) {
      await this.markRecipeEnrichmentSuperseded({
        profile: input.profile,
        session: input.session,
        requestId: input.requestId,
        requestPreview: input.requestPreview,
        recipeId: input.recipeId,
        build
      });
      return;
    }

    let pipeline = this.resolveRecipePipelineSnapshot(input.requestId, currentRecipe, createRecipeAppletRetryPipeline(this.now()));
    const generationTrace = this.createRecipeGenerationTrace(build, currentRecipe.metadata.activeTemplateId ?? null);
    let context: RecipeTemplateArtifactContext;
    try {
      context = this.resolveRecipeTemplateArtifactContext(currentRecipe);
    } catch (error) {
      const detail =
        error instanceof BridgeError && error.code === 'RECIPE_TEMPLATE_CONTEXT_MISSING'
          ? error.message
          : error instanceof Error
            ? error.message
            : 'The persisted template context was invalid.';
      const failure = this.classifyRecipeTemplateFailure({
        kind: 'validation',
        detail,
        settings: input.settings,
        failureReason: 'context_invalid'
      });
      await this.finalizeRecipeAppletBuildFailure({
        profile: input.profile,
        session: input.session,
        currentRecipe,
        requestId: input.requestId,
        requestPreview: input.requestPreview,
        build,
        pipeline,
        onEvent,
        failure,
        failureEvent: {
          code: 'RECIPE_TEMPLATE_CONTEXT_INVALID',
          message: 'Recipe template generation could not start because the artifact-only context was invalid.'
        },
        detail,
        pipelineEventMessage: `Recipe generation failed for "${currentRecipe.title}" because the persisted template context was invalid.`,
        recipeGenerationTrace: generationTrace
      });
      return;
    }

    this.persistRecipeTemplateBaseArtifacts(build, context, this.now());
    const nextBuild = await this.advanceRecipeBuild(build, input.requestPreview, onEvent, {
      phase: 'template_selecting',
      progressMessage: 'Loaded the persisted template artifacts for the retry build…'
    });
    pipeline = updateRecipePipelineSegment(pipeline, 'applet', 'enrichment_generating', {
      status: 'running',
      stage: 'enrichment_generating',
      message: 'Retrying recipe generation in the background from persisted Home artifacts.',
      retryable: true,
      updatedAt: nextBuild.updatedAt
    });
    const updatedRecipe = this.persistRecipePipeline(input.requestId, pipeline, currentRecipe) ?? currentRecipe;
    await this.emitRecipePipelineStateEvent(
      updatedRecipe,
      input.session.id,
      onEvent,
      `Hermes resumed background recipe generation for "${updatedRecipe.title}" from persisted Home artifacts.`,
      {
        buildPhase: nextBuild.phase,
        asyncEnrichment: true
      }
    );

    await this.continueRecipeTemplateEnrichment(
      input.profile,
      input.session,
      this.options.database.getRecipe(updatedRecipe.id) ?? updatedRecipe,
      input.requestId,
      input.requestPreview,
      input.settings,
      onEvent,
      context,
      pipeline,
      nextBuild,
      generationTrace
    );
  }

  private async recordFailedRecipeAppletSeedBuild(
    profile: Profile,
    session: Session,
    currentRecipe: Recipe,
    requestId: string,
    requestPreview: string,
    requestMode: ChatStreamRequest['mode'],
    pipeline: RecipePipelineState,
    settings: ReturnType<BridgeDatabase['getSettings']>,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void,
    options: {
      triggerActionId?: string | null;
      triggerKindOverride?: RecipeBuildTriggerKind | null;
      errorCode: string;
      errorMessage: string;
      errorDetail: string;
    }
  ): Promise<{ recipe: Recipe; pipeline: RecipePipelineState }> {
    this.assertExperimentalRecipeAppletRuntimeEnabled();

    const failure = this.classifyRecipeAppletFailure({
      kind: 'seed',
      detail: options.errorDetail,
      settings
    });
    let build = this.options.database.startRecipeBuild({
      id: `recipe-build-${currentRecipe.id}-${randomUUID()}`,
      recipeId: currentRecipe.id,
      profileId: profile.id,
      sessionId: session.id,
      buildVersion: this.nextRecipeBuildVersion(currentRecipe.id),
      buildKind: 'applet',
      triggerKind:
        options.triggerKindOverride ??
        (requestMode === 'recipe_refresh'
          ? 'refresh'
          : options.triggerActionId
            ? 'action'
            : 'chat'),
      triggerRequestId: requestId,
      triggerActionId: options.triggerActionId ?? null,
      phase: 'queued',
      progressMessage: 'Designing recipe applet…',
      retryCount: 0,
      startedAt: this.now(),
      updatedAt: this.now(),
      completedAt: null,
      errorCode: null,
      errorMessage: null,
      errorDetail: null,
      failureCategory: null,
      failureStage: null,
      userFacingMessage: null,
      retryable: null,
      configuredTimeoutMs: null
    });

    await this.emitRecipeBuildProgress(build, onEvent, 'Designing recipe applet…');
    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'failed',
      progressMessage: failure.userFacingMessage,
      errorCode: options.errorCode,
      errorMessage: options.errorMessage,
      errorDetail: options.errorDetail,
      completed: true,
      failureCategory: failure.category,
      failureStage: failure.failureStage,
      userFacingMessage: failure.userFacingMessage,
      retryable: failure.retryable,
      configuredTimeoutMs: failure.configuredTimeoutMs ?? null
    });
    const nextPipeline = updateRecipePipelineSegment(pipeline, 'applet', 'applet_failed', {
      status: 'failed',
      stage: 'applet_failed',
      failureCategory: failure.category,
      message: failure.userFacingMessage,
      diagnostic: failure.diagnostic,
      retryable: failure.retryable,
      configuredTimeoutMs: failure.configuredTimeoutMs,
      updatedAt: build.updatedAt
    });
    const failedRecipeWithPipeline = this.persistRecipePipeline(requestId, nextPipeline, currentRecipe) ?? currentRecipe;

    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'warning',
      category: 'recipes',
      code: options.errorCode,
      message: options.errorMessage,
      detail: options.errorDetail,
      payload: {
        recipeId: currentRecipe.id,
        failureCategory: failure.category,
        failureStage: failure.failureStage,
        retryable: failure.retryable,
        configuredTimeoutMs: failure.configuredTimeoutMs ?? null
      }
    });

    const failedRecipe = this.options.database.getRecipe(failedRecipeWithPipeline.id) ?? failedRecipeWithPipeline;
    await this.emitRecipePipelineStateEvent(
      failedRecipe,
      session.id,
      onEvent,
      `Hermes kept the baseline Home recipe for "${failedRecipe.title}" because the applet seed could not be generated.`,
      {
        buildPhase: build.phase,
        failureCategory: failure.category
      }
    );

    return {
      recipe: failedRecipe,
      pipeline: nextPipeline
    };
  }

  private async attemptRecipeAppletUpgrade(
    profile: Profile,
    session: Session,
    currentRecipe: Recipe,
    requestId: string,
    requestPreview: string,
    requestMode: ChatStreamRequest['mode'],
    settings: ReturnType<BridgeDatabase['getSettings']>,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void,
    context: RecipeAppletArtifactContext,
    pipeline: RecipePipelineState,
    options: {
      triggerActionId?: string | null;
      triggerKindOverride?: RecipeBuildTriggerKind | null;
    } = {}
  ): Promise<{ recipe: Recipe; pipeline: RecipePipelineState }> {
    this.assertExperimentalRecipeAppletRuntimeEnabled();

    let nextPipeline = updateRecipePipelineSegment(pipeline, 'applet', 'applet_generating', {
      status: 'running',
      stage: 'applet_generating',
      message: 'Generating the optional recipe applet.',
      retryable: true,
      updatedAt: this.now()
    });
    const pipelineRecipe = this.persistRecipePipeline(requestId, nextPipeline, currentRecipe);
    currentRecipe = pipelineRecipe ?? currentRecipe;
    let build = this.options.database.startRecipeBuild({
      id: `recipe-build-${currentRecipe.id}-${randomUUID()}`,
      recipeId: currentRecipe.id,
      profileId: profile.id,
      sessionId: session.id,
      buildVersion: this.nextRecipeBuildVersion(currentRecipe.id),
      buildKind: 'applet',
      triggerKind:
        options.triggerKindOverride ??
        (requestMode === 'recipe_refresh'
          ? 'refresh'
          : options.triggerActionId
            ? 'action'
            : 'chat'),
      triggerRequestId: requestId,
      triggerActionId: options.triggerActionId ?? null,
      phase: 'queued',
      progressMessage: 'Designing recipe applet…',
      retryCount: 0,
      startedAt: this.now(),
      updatedAt: this.now(),
      completedAt: null,
      errorCode: null,
      errorMessage: null,
      errorDetail: null,
      failureCategory: null,
      failureStage: null,
      userFacingMessage: null,
      retryable: null,
      configuredTimeoutMs: null
    });

    this.persistRecipeAppletBaseArtifacts(build, context, this.now());
    await this.emitRecipeBuildProgress(build, onEvent, 'Designing recipe applet…');
    await this.emitRecipeAppletProgress(profile.id, session.id, requestId, requestPreview, 'Designing recipe applet…', onEvent);
    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_APPLET_BUILD_STARTED',
      message: 'Started the optional recipe applet build.',
      detail: 'The baseline Home recipe remains active while the applet is generated and verified.',
      payload: {
        recipeId: currentRecipe.id,
        sourceArtifactBuildId: context.buildId
      }
    });

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_analyzing',
      progressMessage: 'Reviewing recipe data for an applet upgrade…'
    });
    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_generating_source',
      progressMessage: 'Generating the recipe applet source…'
    });
    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_APPLET_SOURCE_GENERATION_STARTED',
      message: 'Started recipe applet source generation.',
      detail: 'Hermes is generating only the TSX source module; the manifest and plan stay local to the bridge.',
      payload: {
        recipeId: currentRecipe.id
      }
    });

    let sourceResponse = await this.requestRecipeAppletStage(
      profile,
      requestId,
      this.buildRecipeAppletSourcePrompt({
        context,
        currentRecipe
      }),
      'source',
      settings
    );
    let extractedSource = extractRecipeAppletSource(sourceResponse.assistantMarkdown);
    if (!extractedSource.artifact && !sourceResponse.failureReason && !sourceResponse.errorDetail) {
      build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
        phase: 'applet_repairing',
        progressMessage: 'Repairing the recipe applet source…'
      });
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: session.id,
        requestId,
        severity: 'warning',
        category: 'recipes',
        code: 'RECIPE_APPLET_REPAIR_ATTEMPTED',
        message: 'Attempting one bounded recipe applet source repair.',
        detail:
          sourceResponse.errorDetail ??
          (extractedSource.errors.join('; ') || 'The source artifact was missing or invalid.'),
        payload: {
          recipeId: currentRecipe.id
        }
      });

      sourceResponse = await this.requestRecipeAppletStage(
        profile,
        requestId,
        this.buildRecipeAppletRepairPrompt({
          context,
          currentRecipe,
          sourceArtifact: {
            source: sourceResponse.assistantMarkdown
          },
          verification: {
            kind: 'applet_verification',
            schemaVersion: 'recipe_applet_verification/v1',
            status: 'failed',
            staticValidation: {
              status: 'failed',
              message: extractedSource.errors.join('; ') || 'The source artifact was missing or invalid.'
            },
            capabilityValidation: {
              status: 'skipped',
              message: 'Skipped because the applet source could not be parsed.'
            },
            typecheck: {
              status: 'skipped',
              message: 'Skipped because the applet source could not be parsed.'
            },
            generatedTests: {
              status: 'skipped',
              message: 'Skipped because the applet source could not be parsed.'
            },
            renderSmoke: {
              status: 'skipped',
              message: 'Skipped because the applet source could not be parsed.'
            },
            smallPaneSmoke: {
              status: 'skipped',
              message: 'Skipped because the applet source could not be parsed.'
            },
            errors: extractedSource.errors,
            warnings: extractedSource.warnings,
            checkedAt: this.now()
          }
        }),
        'repair',
        settings
      );
      extractedSource = extractRecipeAppletSource(sourceResponse.assistantMarkdown);
    }

    if (!extractedSource.artifact) {
      const detail =
        sourceResponse.errorDetail ??
        (extractedSource.errors.join('; ') || 'Hermes did not emit a valid recipe applet source module.');
      const failure = this.classifyRecipeAppletFailure({
        kind: 'source',
        detail,
        settings,
        failureReason: sourceResponse.failureReason
      });
      const failureEvent = this.resolveRecipeAppletFailureEvent(
        failure,
        'RECIPE_APPLET_SOURCE_FAILED',
        'The recipe applet source could not be generated.'
      );
      build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
        phase: 'failed',
        progressMessage: failure.userFacingMessage,
        errorCode: failureEvent.code,
        errorMessage: failureEvent.message,
        errorDetail: detail,
        completed: true,
        failureCategory: failure.category,
        failureStage: failure.failureStage,
        userFacingMessage: failure.userFacingMessage,
        retryable: failure.retryable,
        configuredTimeoutMs: failure.configuredTimeoutMs ?? null
      });
      nextPipeline = updateRecipePipelineSegment(nextPipeline, 'applet', 'applet_failed', {
        status: 'failed',
        stage: 'applet_failed',
        failureCategory: failure.category,
        message: failure.userFacingMessage,
        diagnostic: failure.diagnostic,
        retryable: failure.retryable,
        configuredTimeoutMs: failure.configuredTimeoutMs,
        updatedAt: build.updatedAt
      });
      const failedRecipeWithPipeline = this.persistRecipePipeline(requestId, nextPipeline, currentRecipe) ?? currentRecipe;
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: session.id,
        requestId,
        severity: 'warning',
        category: 'recipes',
        code: failureEvent.code,
        message: failureEvent.message,
        detail,
        payload: {
          recipeId: currentRecipe.id,
          failureCategory: failure.category,
          failureStage: failure.failureStage,
          retryable: failure.retryable,
          configuredTimeoutMs: failure.configuredTimeoutMs ?? null
        }
      });
      const failedRecipe = this.options.database.getRecipe(failedRecipeWithPipeline.id) ?? failedRecipeWithPipeline;
      await this.emitRecipePipelineStateEvent(
        failedRecipe,
        session.id,
        onEvent,
        `Hermes kept the baseline Home recipe because the applet source for "${failedRecipe.title}" could not be generated.`,
        {
          buildPhase: build.phase,
          failureCategory: failure.category
        }
      );
      return {
        recipe: failedRecipe,
        pipeline: nextPipeline
      };
    }

    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_APPLET_SOURCE_GENERATION_SUCCEEDED',
      message: 'Recipe applet source generation completed.',
      detail: 'Hermes emitted a TSX recipe applet module that the bridge parsed successfully.',
      payload: {
        recipeId: currentRecipe.id
      }
    });

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_synthesizing_manifest',
      progressMessage: 'Synthesizing the recipe applet manifest locally…'
    });

    let sourceArtifact = extractedSource.artifact;
    let synthesizedArtifacts = this.synthesizeRecipeAppletArtifacts({
      context,
      currentRecipe,
      sourceArtifact
    });

    if (!synthesizedArtifacts.manifest || !synthesizedArtifacts.plan || !synthesizedArtifacts.testArtifact) {
      const detail =
        synthesizedArtifacts.errors.join('; ') ||
        'The bridge could not synthesize a deterministic recipe applet manifest from the generated source.';
      const failure = this.classifyRecipeAppletFailure({
        kind: 'manifest',
        detail,
        settings
      });
      const failureEvent = this.resolveRecipeAppletFailureEvent(
        failure,
        'RECIPE_APPLET_MANIFEST_FAILED',
        'The recipe applet manifest could not be synthesized locally.'
      );
      build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
        phase: 'failed',
        progressMessage: failure.userFacingMessage,
        errorCode: failureEvent.code,
        errorMessage: failureEvent.message,
        errorDetail: detail,
        completed: true,
        failureCategory: failure.category,
        failureStage: failure.failureStage,
        userFacingMessage: failure.userFacingMessage,
        retryable: failure.retryable,
        configuredTimeoutMs: failure.configuredTimeoutMs ?? null
      });
      nextPipeline = updateRecipePipelineSegment(nextPipeline, 'applet', 'applet_failed', {
        status: 'failed',
        stage: 'applet_failed',
        failureCategory: failure.category,
        message: failure.userFacingMessage,
        diagnostic: failure.diagnostic,
        retryable: failure.retryable,
        configuredTimeoutMs: failure.configuredTimeoutMs,
        updatedAt: build.updatedAt
      });
      const failedRecipeWithPipeline = this.persistRecipePipeline(requestId, nextPipeline, currentRecipe) ?? currentRecipe;
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: session.id,
        requestId,
        severity: 'warning',
        category: 'recipes',
        code: failureEvent.code,
        message: failureEvent.message,
        detail,
        payload: {
          recipeId: currentRecipe.id,
          failureCategory: failure.category,
          failureStage: failure.failureStage,
          retryable: failure.retryable,
          configuredTimeoutMs: failure.configuredTimeoutMs ?? null
        }
      });
      const failedRecipe = this.options.database.getRecipe(failedRecipeWithPipeline.id) ?? failedRecipeWithPipeline;
      await this.emitRecipePipelineStateEvent(
        failedRecipe,
        session.id,
        onEvent,
        `Hermes kept the baseline Home recipe because the applet manifest for "${failedRecipe.title}" could not be synthesized locally.`,
        {
          buildPhase: build.phase,
          failureCategory: failure.category
        }
      );
      return {
        recipe: failedRecipe,
        pipeline: nextPipeline
      };
    }

    let manifest = synthesizedArtifacts.manifest;
    let plan = synthesizedArtifacts.plan;
    let testArtifact = synthesizedArtifacts.testArtifact;
    const manifestActionSpec = RecipeActionSpecSchema.parse({
      kind: 'action_spec',
      schemaVersion: 'recipe_action_spec/v1',
      actions: manifest.actions
    });
    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_APPLET_MANIFEST_SYNTHESIZED',
      message: 'Synthesized the recipe applet manifest locally.',
      detail:
        synthesizedArtifacts.warnings.join('; ') ||
        'The bridge derived the manifest, plan, and generated tests from the applet source and persisted Home artifacts.',
      payload: {
        recipeId: currentRecipe.id,
        actionCount: manifest.actions.length,
        capabilityCount: manifest.requestedCapabilities.length,
        datasetCount: manifest.declaredDatasets.length
      }
    });

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_generating_tests',
      progressMessage: 'Generating recipe applet tests…'
    });

    this.persistRecipeBuildArtifact(build, sourceArtifact, this.now());
    this.persistRecipeBuildArtifact(build, manifest, this.now());
    this.persistRecipeBuildArtifact(build, plan, this.now());
    this.persistRecipeBuildArtifact(build, manifestActionSpec, this.now());
    this.persistRecipeBuildArtifact(build, testArtifact, this.now());

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_validating',
      progressMessage: 'Validating recipe applet capabilities…'
    });
    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_typechecking',
      progressMessage: 'Typechecking the recipe applet…'
    });
    nextPipeline = updateRecipePipelineSegment(nextPipeline, 'applet', 'applet_validating', {
      status: 'running',
      stage: 'applet_validating',
      message: 'Validating the optional recipe applet.',
      retryable: true,
      updatedAt: build.updatedAt
    });
    currentRecipe = this.persistRecipePipeline(requestId, nextPipeline, currentRecipe) ?? currentRecipe;
    await this.emitRecipePipelineStateEvent(
      currentRecipe,
      session.id,
      onEvent,
      `Hermes is validating the optional recipe applet for "${currentRecipe.title}".`,
      {
        buildPhase: build.phase
      }
    );

    let verificationResult = await verifyRecipeApplet({
      manifest,
      sourceArtifact,
      testArtifact,
      context: this.createRecipeAppletRenderContext(currentRecipe, context),
      normalizedData: context.normalizedData
    });

    if (verificationResult.verification.status === 'failed') {
      build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
        phase: 'applet_repairing',
        progressMessage: 'Repairing the recipe applet after verification failed…'
      });
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: session.id,
        requestId,
        severity: 'warning',
        category: 'recipes',
        code: 'RECIPE_APPLET_REPAIR_ATTEMPTED',
        message: 'Attempting one bounded recipe applet repair after verification failed.',
        detail: verificationResult.verification.errors.join('; '),
        payload: {
          recipeId: currentRecipe.id
        }
      });

      sourceResponse = await this.requestRecipeAppletStage(
        profile,
        requestId,
        this.buildRecipeAppletRepairPrompt({
          context,
          currentRecipe,
          sourceArtifact,
          verification: verificationResult.verification
        }),
        'repair',
        settings
      );
      const repairedSource = extractRecipeAppletSource(sourceResponse.assistantMarkdown);
      if (repairedSource.artifact) {
        sourceArtifact = repairedSource.artifact;
        synthesizedArtifacts = this.synthesizeRecipeAppletArtifacts({
          context,
          currentRecipe,
          sourceArtifact
        });
        if (!synthesizedArtifacts.manifest || !synthesizedArtifacts.plan || !synthesizedArtifacts.testArtifact) {
          verificationResult = {
            renderTree: null,
            verification: {
              kind: 'applet_verification',
              schemaVersion: 'recipe_applet_verification/v1',
              status: 'failed',
              staticValidation: {
                status: 'failed',
                message:
                  synthesizedArtifacts.errors.join('; ') ||
                  'The repaired recipe applet source could not be synthesized into a deterministic manifest.'
              },
              capabilityValidation: {
                status: 'skipped',
                message: 'Skipped because the repaired recipe applet manifest could not be synthesized.'
              },
              typecheck: {
                status: 'skipped',
                message: 'Skipped because the repaired recipe applet manifest could not be synthesized.'
              },
              generatedTests: {
                status: 'skipped',
                message: 'Skipped because the repaired recipe applet manifest could not be synthesized.'
              },
              renderSmoke: {
                status: 'skipped',
                message: 'Skipped because the repaired recipe applet manifest could not be synthesized.'
              },
              smallPaneSmoke: {
                status: 'skipped',
                message: 'Skipped because the repaired recipe applet manifest could not be synthesized.'
              },
              errors: synthesizedArtifacts.errors,
              warnings: synthesizedArtifacts.warnings,
              checkedAt: this.now()
            }
          };
        } else {
          manifest = synthesizedArtifacts.manifest;
          plan = synthesizedArtifacts.plan;
          testArtifact = synthesizedArtifacts.testArtifact;
          this.persistRecipeBuildArtifact(build, manifest, this.now());
          this.persistRecipeBuildArtifact(build, plan, this.now());
          this.persistRecipeBuildArtifact(
            build,
            RecipeActionSpecSchema.parse({
              kind: 'action_spec',
              schemaVersion: 'recipe_action_spec/v1',
              actions: manifest.actions
            }),
            this.now()
          );
          this.persistRecipeBuildArtifact(build, testArtifact, this.now());
          this.persistRecipeBuildArtifact(build, sourceArtifact, this.now());
          this.recordTelemetry({
            profileId: profile.id,
            sessionId: session.id,
            requestId,
            severity: 'info',
            category: 'recipes',
            code: 'RECIPE_APPLET_MANIFEST_SYNTHESIZED',
            message: 'Re-synthesized the recipe applet manifest locally after repair.',
            detail:
              synthesizedArtifacts.warnings.join('; ') ||
              'The bridge refreshed the local manifest and generated tests after the repaired source was emitted.',
            payload: {
              recipeId: currentRecipe.id,
              actionCount: manifest.actions.length,
              capabilityCount: manifest.requestedCapabilities.length,
              datasetCount: manifest.declaredDatasets.length
            }
          });
          verificationResult = await verifyRecipeApplet({
            manifest,
            sourceArtifact,
            testArtifact,
            context: this.createRecipeAppletRenderContext(currentRecipe, context),
            normalizedData: context.normalizedData
          });
        }
      }
    }

    this.persistRecipeBuildArtifact(build, verificationResult.verification, this.now());
    if (verificationResult.renderTree) {
      this.persistRecipeBuildArtifact(build, verificationResult.renderTree, this.now());
      plan = synthesizeRecipeAppletPlan(manifest, {
        note: 'The bridge refreshed the plan with the verified render tree node kinds.',
        nodeKinds: collectRecipeAppletNodeKinds(verificationResult.renderTree)
      });
      this.persistRecipeBuildArtifact(build, plan, this.now());
    }

    if (verificationResult.verification.status !== 'passed' || !verificationResult.renderTree) {
      const failure = this.classifyRecipeAppletFailure({
        kind: 'verification',
        detail: verificationResult.verification.errors.join('; ') || 'Recipe applet verification failed.',
        settings,
        verification: verificationResult.verification
      });
      build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
        phase: 'failed',
        progressMessage: failure.userFacingMessage,
        errorCode: 'RECIPE_APPLET_VERIFICATION_FAILED',
        errorMessage: 'The recipe applet did not pass verification.',
        errorDetail: verificationResult.verification.errors.join('; ') || 'Recipe applet verification failed.',
        completed: true,
        failureCategory: failure.category,
        failureStage: failure.failureStage,
        userFacingMessage: failure.userFacingMessage,
        retryable: failure.retryable,
        configuredTimeoutMs: failure.configuredTimeoutMs ?? null
      });
      nextPipeline = updateRecipePipelineSegment(nextPipeline, 'applet', 'applet_failed', {
        status: 'failed',
        stage: 'applet_failed',
        failureCategory: failure.category,
        message: failure.userFacingMessage,
        diagnostic: failure.diagnostic,
        retryable: failure.retryable,
        configuredTimeoutMs: failure.configuredTimeoutMs,
        updatedAt: build.updatedAt
      });
      const failedRecipeWithPipeline = this.persistRecipePipeline(requestId, nextPipeline, currentRecipe) ?? currentRecipe;
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: session.id,
        requestId,
        severity: 'warning',
        category: 'recipes',
        code: 'RECIPE_APPLET_VERIFICATION_FAILED',
        message: 'Recipe applet verification failed.',
        detail: verificationResult.verification.errors.join('; ') || 'Recipe applet verification failed.',
        payload: {
          recipeId: currentRecipe.id,
          failureCategory: failure.category,
          failureStage: failure.failureStage,
          retryable: failure.retryable,
          configuredTimeoutMs: failure.configuredTimeoutMs ?? null
        }
      });
      const failedRecipe = this.options.database.getRecipe(failedRecipeWithPipeline.id) ?? failedRecipeWithPipeline;
      await this.emitRecipePipelineStateEvent(
        failedRecipe,
        session.id,
        onEvent,
        `Hermes kept the baseline Home recipe because the applet for "${failedRecipe.title}" failed verification.`,
        {
          buildPhase: 'failed',
          failureCategory: failure.category
        }
      );
      return {
        recipe: failedRecipe,
        pipeline: nextPipeline
      };
    }

    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'applet_promoting',
      progressMessage: 'Promoting the recipe applet…'
    });
    build = await this.advanceRecipeBuild(build, requestPreview, onEvent, {
      phase: 'ready',
      progressMessage: 'Recipe applet ready.',
      completed: true
    });
    this.options.database.promoteRecipeAppletBuild(currentRecipe.id, {
      buildId: build.id
    });
    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_APPLET_PROMOTED',
      message: 'Promoted the verified recipe applet.',
      detail: manifest.summary,
      payload: {
        recipeId: currentRecipe.id,
        buildId: build.id
      }
    });
    nextPipeline = updateRecipePipelineSegment(nextPipeline, 'applet', 'applet_ready', {
      status: 'ready',
      stage: 'applet_ready',
      message: 'The optional recipe applet is ready.',
      retryable: false,
      updatedAt: build.updatedAt
    });
    const promotedRecipeWithPipeline = this.persistRecipePipeline(requestId, nextPipeline, currentRecipe) ?? currentRecipe;
    const promotedRecipe = this.options.database.getRecipe(promotedRecipeWithPipeline.id) ?? promotedRecipeWithPipeline;
    const promotedEvent = this.createRecipeEvent(
      promotedRecipe,
      'updated',
      `Hermes upgraded "${promotedRecipe.title}" with a verified recipe applet.`,
      'bridge',
      session.id,
      {
        renderMode: 'dynamic_v1',
        buildPhase: 'ready',
        recipePipelineStage: nextPipeline.currentStage
      }
    );
    await this.emitRecipeEvent(promotedEvent, onEvent, promotedRecipe);
    return {
      recipe: promotedRecipe,
      pipeline: nextPipeline
    };
  }

  private async createOrUpdateHomeBaselineRecipe(
    profileId: string,
    session: Session,
    currentRecipeId: string | null,
    requestId: string,
    requestPreview: string,
    requestMode: ChatStreamRequest['mode'],
    assistantMarkdown: string,
    structuredRecipeIntent: StructuredRecipeIntent | null,
    recipePipeline: RecipePipelineState,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void
  ): Promise<RecipeMutationResult> {
    const currentRecipe =
      (currentRecipeId ? this.options.database.getRecipe(currentRecipeId) : null) ??
      this.options.database.getRecipeByPrimarySessionId(profileId, session.id);
    const timestamp = this.now();
    const title = this.deriveMarkdownFallbackTitle(currentRecipe, session, structuredRecipeIntent);
    const safeAssistantMarkdown = this.sanitizeAssistantMarkdownForFallback(assistantMarkdown);
    const markdownContent =
      safeAssistantMarkdown.trim() ||
      `## ${title}\n\n${this.summarizeAssistantAnswer(assistantMarkdown, 'Hermes completed the latest request.')}`;
    const description = this.summarizeAssistantAnswer(markdownContent, 'Latest assistant response.');
    const metadata = withRecipeAttemptMetadata(
      withRefreshableRecipeMetadata(
        {
          ...(currentRecipe?.metadata ?? {}),
          homeRecipe: true,
          baselineContentUpdatedAt: timestamp,
          recipePipeline,
          changeSummary: currentRecipe
            ? 'Updated the attached recipe with the latest assistant response.'
            : 'Created the attached recipe from the latest assistant response.'
        },
        {
          current: currentRecipe?.metadata,
          requestMode,
          requestPreview,
          requestId,
          timestamp
        }
      ),
      {
        current: currentRecipe?.metadata,
        outcome: 'markdown_fallback',
        mode: 'markdown_fallback',
        requestId,
        timestamp
      }
    );
    const fallbackEntryId = `entry-${randomUUID()}`;
    let tabs = normalizeRecipeTabs({
      contentFormat: 'markdown',
      contentData: {
        markdown: markdownContent
      },
      currentRecipe
    });
    tabs = replaceRecipeContentEntries(tabs, [
      {
        id: fallbackEntryId,
        md: markdownContent,
        row: {
          summary: description
        },
        card: {
          id: fallbackEntryId,
          title,
          description,
          badges: [],
          metadata: [],
          links: []
        },
        metadata: {
          fallback: true
        }
      }
    ]);
    let targetRecipe = currentRecipe;
    let created = false;
    if (targetRecipe) {
      targetRecipe =
        this.options.database.updateRecipe(targetRecipe.id, {
          profileId,
          title,
          description,
          status: 'active',
          tabs,
          renderMode: 'legacy_content_v1',
          lastUpdatedBy: 'bridge',
          metadata
        }) ?? targetRecipe;
    } else {
      targetRecipe = this.options.database.createRecipe({
        profileId,
        primarySessionId: session.id,
        title,
        description,
        status: 'active',
        tabs,
        uiState: {
          activeTab: 'content'
        },
        source: 'bridge',
        lastUpdatedBy: 'bridge',
        metadata
      });
      created = Boolean(targetRecipe);
    }

    if (!targetRecipe) {
      throw new BridgeError(500, 'RECIPE_CREATE_FAILED', 'Failed to create the attached Home recipe.');
    }

    if (targetRecipe.renderMode !== 'legacy_content_v1') {
      targetRecipe =
        this.options.database.updateRecipe(targetRecipe.id, {
          profileId,
          renderMode: 'legacy_content_v1'
        }) ?? targetRecipe;
    }

    const event = this.createRecipeEvent(
      targetRecipe,
      created ? 'created' : 'updated',
      created
        ? `Hermes created the Home recipe "${title}" from the latest answer.`
        : `Hermes updated the Home recipe "${title}" from the latest answer.`,
      'bridge',
      session.id,
      {
        contentFormat: 'markdown',
        renderMode: 'legacy_content_v1',
        recipePipelineStage: recipePipeline.currentStage
      }
    );
    await this.emitRecipeEvent(event, onEvent, targetRecipe);

    return {
      assistantMarkdown: markdownContent,
      activeRecipeId: targetRecipe.id,
      summaries: [created ? `created the Home recipe "${title}"` : `updated the Home recipe "${title}"`],
      createdRecipeIds: created ? [targetRecipe.id] : []
    };
  }

  private ensureStructuredRecipeRequestCompleted(
    profileId: string,
    sessionId: string,
    requestId: string,
    requestPreview: string,
    intent: StructuredRecipeIntent | null,
    explicitRecipeId: string | null,
    resolvedRecipeId: string | null,
    createdRecipeIds: string[] = []
  ) {
    void profileId;
    void sessionId;
    void requestId;
    void requestPreview;
    void intent;
    void explicitRecipeId;
    void resolvedRecipeId;
    void createdRecipeIds;
    return null;
  }

  private classifyRequiredStructuredRecipeIntent(
    content: string,
    hasRecipeContext: boolean,
    attachedTemplateId?: string | null
  ): { intent: StructuredRecipeIntent | null; mutationIntent: RecipeMutationIntent | null } {
    const structuredIntent = classifyStructuredRecipeIntent(content, hasRecipeContext);
    if (structuredIntent) {
      return { intent: structuredIntent, mutationIntent: null };
    }

    if (
      /\b(create|build|make)\b.*\b(recipe|recipe|table|card|cards|markdown|note|board|tracker)\b/i.test(content)
    ) {
      return {
        intent: {
          category: 'results',
          preferredContentFormat: /\btable\b/i.test(content)
            ? ('table' as const)
            : /\b(markdown|note|notes)\b/i.test(content)
              ? ('markdown' as const)
              : ('card' as const),
          label: 'recipe request'
        } satisfies StructuredRecipeIntent,
        mutationIntent: null
      };
    }

    // When a recipe is already rendered, check for mutation intent (user asking to change how it looks).
    if (hasRecipeContext && attachedTemplateId) {
      const mutationIntent = classifyRecipeMutationIntent(content, attachedTemplateId);
      if (mutationIntent) {
        // Synthesize a StructuredRecipeIntent from the mutation intent so the rest of the pipeline
        // (shouldAttemptRecipeAppletUpgrade, optimistic ghost, selection prompt) works correctly.
        const synthesizedIntent = synthesizeIntentFromMutation(mutationIntent, attachedTemplateId);
        return { intent: synthesizedIntent, mutationIntent };
      }
    }

    return { intent: null, mutationIntent: null };
  }

  private async emitRecipeEvent(
    event: RecipeEvent,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void,
    recipe: Recipe | null
  ) {
    await onEvent({
      type: 'recipe_event',
      event,
      recipe
    });
  }

  private async emitRecipePipelineStateEvent(
    recipe: Recipe,
    sessionId: string,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void,
    message: string,
    metadata: Record<string, unknown> = {}
  ) {
    const event = this.createRecipeEvent(recipe, 'updated', message, 'bridge', sessionId, {
      renderMode: recipe.renderMode,
      recipePipelineStage: recipe.metadata.recipePipeline?.currentStage ?? null,
      ...metadata
    });
    await this.emitRecipeEvent(event, onEvent, recipe);
  }

  private async applyRecipeOperations(
    profileId: string,
    session: Session,
    currentRecipeId: string | null,
    requestId: string,
    requestPreview: string,
    requestMode: ChatStreamRequest['mode'],
    assistantMarkdown: string,
    onEvent: (event: ChatStreamEvent) => Promise<void> | void
  ) {
    const extracted = extractRecipeOperations(assistantMarkdown);
    const recoveredParseErrors = extracted.operations.length > 0 ? extracted.errors : [];
    const unrecoveredParseErrors = extracted.operations.length > 0 ? [] : extracted.errors;

    for (const error of unrecoveredParseErrors) {
      const activity = {
        kind: 'warning',
        state: 'failed',
        label: 'Hermes UI Recipes block',
        detail: error,
        requestId,
        timestamp: this.now()
      } satisfies ChatActivity;
      this.appendPersistedRuntimeActivity(profileId, session.id, requestId, requestPreview, activity);
      this.recordTelemetry({
        profileId,
        sessionId: session.id,
        requestId,
        severity: 'warning',
        category: 'recipes',
        code: 'RECIPE_BLOCK_PARSE_FAILED',
        message: 'Hermes emitted an invalid Hermes UI Recipes block.',
        detail: error,
        payload: {
          recipeId: currentRecipeId,
          requestPreview,
          assistantPreview: assistantMarkdown.slice(0, 240),
          cleanedAssistantPreview: extracted.cleanedMarkdown.slice(0, 160),
          extractedOperationCount: extracted.operations.length
        }
      });
      await onEvent({
        type: 'activity',
        activity
      });
    }

    for (const error of recoveredParseErrors) {
      this.recordTelemetry({
        profileId,
        sessionId: session.id,
        requestId,
        severity: 'warning',
        category: 'recipes',
        code: 'RECIPE_BLOCK_PARSE_RECOVERED',
        message: 'Recovered Hermes UI Recipes operations from mixed assistant output.',
        detail: error,
        payload: {
          recipeId: currentRecipeId,
          requestPreview,
          assistantPreview: assistantMarkdown.slice(0, 240),
          cleanedAssistantPreview: extracted.cleanedMarkdown.slice(0, 160),
          extractedOperationCount: extracted.operations.length
        }
      });
    }

    for (const warning of extracted.warnings) {
      this.recordTelemetry({
        profileId,
        sessionId: session.id,
        requestId,
        severity: 'info',
        category: 'recipes',
        code: 'RECIPE_BLOCK_PROSE_IGNORED',
        message: 'Ignored extra prose inside a Hermes UI Recipes block.',
        detail: warning,
        payload: {
          recipeId: currentRecipeId,
          requestPreview,
          assistantPreview: assistantMarkdown.slice(0, 240),
          cleanedAssistantPreview: extracted.cleanedMarkdown.slice(0, 160),
          extractedOperationCount: extracted.operations.length
        }
      });
    }

    const summaries: string[] = [];
    const createdRecipeIds: string[] = [];
    let resolvedCurrentRecipeId = currentRecipeId;

    for (const operation of extracted.operations) {
      await onEvent({
        type: 'progress',
        requestId,
        message:
          operation.type === 'delete_space'
            ? 'Hermes is updating the recipe…'
            : operation.type === 'mark_space_changed'
              ? 'Hermes is syncing the recipe…'
              : 'Hermes is updating the recipe…'
      });

      if (operation.type === 'create_space') {
        const recipe = this.options.database.createRecipe({
          profileId,
          primarySessionId: session.id,
          title: operation.title,
          description: operation.description,
          status: operation.status ?? 'idle',
          tabs: this.normalizeRecipeTabsForMutation(operation, {
            profileId,
            sessionId: session.id,
            requestId,
            requestPreview,
            operation: 'Hermes create_space',
            currentRecipe: null
          }),
          uiState: normalizeRecipeUiState(operation.uiState),
          source: 'hermes',
          lastUpdatedBy: operation.lastUpdatedBy ?? 'hermes',
          metadata: withRefreshableRecipeMetadata(operation.metadata, {
            requestMode,
            requestPreview,
            requestId,
            timestamp: this.now()
          })
        });

        if (!recipe) {
          continue;
        }

        resolvedCurrentRecipeId = recipe.id;
        createdRecipeIds.push(recipe.id);
        const contentFormat = getRecipeContentFormat(recipe);

        const event = this.createRecipeEvent(
          recipe,
          'created',
          `Hermes created the recipe "${recipe.title}".`,
          'hermes',
          session.id,
          {
            contentFormat
          }
        );
        this.appendPersistedRuntimeActivity(profileId, session.id, requestId, requestPreview, {
          kind: 'status',
          state: 'completed',
          label: 'Recipe event',
          detail: event.message,
          requestId,
          timestamp: event.createdAt
        });
        await this.emitRecipeEvent(event, onEvent, recipe);
        summaries.push(`created the recipe "${recipe.title}"`);
        continue;
      }

      if (operation.type === 'update_space') {
        const currentRecipe = this.resolveRecipeTarget(profileId, resolvedCurrentRecipeId, operation);
        const nextRecipe = this.options.database.updateRecipe(currentRecipe.id, {
          profileId,
          title: operation.title,
          description: operation.description,
          status: operation.status,
          tabs: this.normalizeRecipeTabsForMutation(operation, {
            profileId,
            sessionId: session.id,
            requestId,
            requestPreview,
            recipeId: currentRecipe.id,
            operation: 'Hermes update_space',
            currentRecipe
          }),
          uiState: operation.uiState ? normalizeRecipeUiState({ ...currentRecipe.uiState, ...operation.uiState }) : currentRecipe.uiState,
          lastUpdatedBy: operation.lastUpdatedBy ?? 'hermes',
          metadata: withRefreshableRecipeMetadata(operation.metadata, {
            current: currentRecipe.metadata,
            requestMode,
            requestPreview,
            requestId,
            timestamp: this.now()
          })
        });

        if (!nextRecipe) {
          continue;
        }

        const renamed = operation.title !== undefined && operation.title !== currentRecipe.title;
        const contentFormat = getRecipeContentFormat(nextRecipe);
        const event = this.createRecipeEvent(
          nextRecipe,
          renamed ? 'renamed' : 'updated',
          renamed
            ? `Hermes renamed the recipe "${currentRecipe.title}" to "${nextRecipe.title}".`
            : `Hermes updated the recipe "${nextRecipe.title}".`,
          'hermes',
          session.id,
          {
            contentFormat,
            changeSummary: nextRecipe.metadata.changeSummary
          }
        );
        this.appendPersistedRuntimeActivity(profileId, session.id, requestId, requestPreview, {
          kind: 'status',
          state: 'completed',
          label: 'Recipe event',
          detail: event.message,
          requestId,
          timestamp: event.createdAt
        });
        await this.emitRecipeEvent(event, onEvent, nextRecipe);
        summaries.push(renamed ? `renamed the recipe to "${nextRecipe.title}"` : `updated the recipe "${nextRecipe.title}"`);
        continue;
      }

      if (operation.type === 'mark_space_changed') {
        const currentRecipe = this.resolveRecipeTarget(profileId, resolvedCurrentRecipeId, operation);
        const nextRecipe = this.options.database.updateRecipe(currentRecipe.id, {
          profileId,
          status: operation.status ?? 'changed',
          lastUpdatedBy: operation.lastUpdatedBy ?? 'hermes',
          metadata: {
            ...withRefreshableRecipeMetadata(operation.metadata, {
              current: currentRecipe.metadata,
              requestMode,
              requestPreview,
              requestId,
              timestamp: this.now()
            }),
            changeSummary: operation.summary ?? operation.metadata?.changeSummary ?? currentRecipe.metadata.changeSummary
          }
        });

        if (!nextRecipe) {
          continue;
        }

        const event = this.createRecipeEvent(
          nextRecipe,
          'changed',
          operation.summary
            ? `Hermes marked "${nextRecipe.title}" as changed: ${operation.summary}`
            : `Hermes marked "${nextRecipe.title}" as changed.`,
          'hermes',
          session.id,
          {
            changeSummary: operation.summary ?? nextRecipe.metadata.changeSummary
          }
        );
        this.appendPersistedRuntimeActivity(profileId, session.id, requestId, requestPreview, {
          kind: 'status',
          state: 'completed',
          label: 'Recipe event',
          detail: event.message,
          requestId,
          timestamp: event.createdAt
        });
        await this.emitRecipeEvent(event, onEvent, nextRecipe);
        summaries.push(`marked the recipe "${nextRecipe.title}" as changed`);
        continue;
      }

      const currentRecipe = this.resolveRecipeTarget(profileId, resolvedCurrentRecipeId, operation);
      this.options.database.deleteRecipe(profileId, currentRecipe.id, this.now());
      const event = this.createRecipeEvent(
        currentRecipe,
        'deleted',
        `Hermes deleted the recipe "${currentRecipe.title}".`,
        'hermes',
        session.id
      );
      this.appendPersistedRuntimeActivity(profileId, session.id, requestId, requestPreview, {
        kind: 'status',
        state: 'completed',
        label: 'Recipe event',
        detail: event.message,
        requestId,
        timestamp: event.createdAt
      });
      await this.emitRecipeEvent(event, onEvent, null);
      if (resolvedCurrentRecipeId === currentRecipe.id) {
        resolvedCurrentRecipeId = null;
      }
      summaries.push(`deleted the recipe "${currentRecipe.title}"`);
    }

    const cleanedMarkdown = extracted.cleanedMarkdown.trim();
    const assistantMarkdownWithFallback =
      unrecoveredParseErrors.length > 0 && summaries.length === 0
        ? 'Hermes ran into an issue. Check the logs for more information.'
        : cleanedMarkdown.length > 0
          ? cleanedMarkdown
          : summaries.length > 0
          ? `Hermes ${summaries.join(', ')}.`
          : unrecoveredParseErrors.length > 0
            ? 'Hermes ran into an issue. Check the logs for more information.'
            : cleanedMarkdown;

    return {
      assistantMarkdown: assistantMarkdownWithFallback,
      activeRecipeId: resolvedCurrentRecipeId,
      summaries,
      createdRecipeIds
    };
  }

  private createJobsFreshness(profileId: string, status: JobsFreshness['status'], lastError?: string, usingCache = false) {
    return JobsFreshnessSchema.parse({
      profileId,
      status,
      source: usingCache ? 'local_cache' : 'hermes_cli',
      lastRequestedAt: this.now(),
      lastSuccessfulAt: status === 'connected' ? this.now() : undefined,
      lastError
    });
  }

  async getBootstrap(): Promise<BootstrapResponse> {
    const connection = await this.syncProfilesAndSessions(this.resolveActiveProfileId());
    const profiles = this.options.database.listProfiles();
    const activeProfileId = this.resolveActiveProfileId();
    if (activeProfileId) {
      this.options.database.setActiveProfile(activeProfileId);
    }

    const uiState = this.options.database.getUiState();
    const settings = this.options.database.getSettings();
    const activeSessionId = this.options.database.getActiveSessionId(activeProfileId);

    let hermesVersion: string | null = null;
    try {
      hermesVersion = await this.options.hermesCli.getVersion();
    } catch {
      // version check is best-effort
    }

    return {
      connection,
      profiles,
      activeProfileId,
      activeSessionId,
      recentSessions: activeProfileId ? this.options.database.listRecentSessions(activeProfileId, 5) : [],
      sessionSummary: activeProfileId ? this.options.database.getSessionSummary(activeProfileId, 5) : null,
      settings,
      uiState,
      hermesVersion,
      expectedHermesVersion: HERMES_EXPECTED_VERSION
    };
  }

  async selectProfile(input: SelectProfileRequest) {
    const profile = await this.ensureProfile(input.profileId);

    this.options.database.setActiveProfile(profile.id);
    await this.syncProfilesAndSessions(profile.id);
    return this.getBootstrap();
  }

  async selectSession(input: SelectSessionRequest) {
    await this.ensureProfile(input.profileId);
    const session = this.ensureScopedSession(input.profileId, input.sessionId);
    this.options.database.associateSessionWithProfile(session.id, input.profileId, 'manual', this.now());

    this.options.database.setActiveProfile(input.profileId);
    this.options.database.setActiveSession(input.profileId, session.id);
    return this.options.database.getSession(session.id) ?? session;
  }

  async createSession(input: CreateSessionRequest) {
    const profile = await this.ensureProfile(input.profileId);
    return this.options.database.createSession(profile.id, this.now());
  }

  async renameSession(sessionId: string, input: RenameSessionRequest) {
    const parsedInput = RenameSessionRequestSchema.parse(input);
    const profile = await this.ensureProfile(parsedInput.profileId);
    const session = this.ensureScopedSession(profile.id, sessionId);
    const title = parsedInput.title.trim();

    if (session.runtimeSessionId) {
      await this.options.hermesCli.renameSession(profile, session, title);
    }

    const renamedSession = this.options.database.renameSessionTitle(session.id, title, {
      persistOverride: !session.runtimeSessionId
    });
    if (!renamedSession) {
      throw new BridgeError(404, 'SESSION_NOT_FOUND', `Session ${session.id} was not found after rename.`);
    }

    if (session.runtimeSessionId) {
      await this.syncProfilesAndSessions(profile.id);
      return this.options.database.getSession(session.id) ?? renamedSession;
    }

    return renamedSession;
  }

  async deleteSession(sessionId: string, input: DeleteSessionRequest): Promise<SessionDeletionResponse> {
    const parsedInput = DeleteSessionRequestSchema.parse(input);
    const profile = await this.ensureProfile(parsedInput.profileId);
    const session = this.ensureScopedSession(profile.id, sessionId);
    let mode: SessionDeletionResponse['mode'] = 'soft';

    if (session.runtimeSessionId) {
      await this.options.hermesCli.deleteSession(profile, session);
      mode = 'hybrid';
    }

    const deleted = this.options.database.markSessionDeleted(session.id, mode, this.now());
    if (!deleted) {
      throw new BridgeError(404, 'SESSION_NOT_FOUND', `Session ${session.id} was not found after delete.`);
    }

    return SessionDeletionResponseSchema.parse(deleted);
  }

  async listSessions(profileId: string, page: number, pageSize: number, search: string): Promise<SessionsResponse> {
    await this.ensureProfile(profileId);
    await this.syncProfilesAndSessions(profileId);
    const sessions = this.options.database.listSessions({ profileId, page, pageSize, search });

    return SessionsResponseSchema.parse({
      profileId,
      items: sessions.items,
      page,
      pageSize,
      total: sessions.total,
      hiddenSyntheticCount: sessions.hiddenSyntheticCount,
      search
    });
  }

  async getSessionMessages(profileId: string, sessionId: string): Promise<SessionMessagesResponse> {
    const profile = await this.ensureProfile(profileId);
    const session = this.ensureScopedSession(profile.id, sessionId);
    this.options.database.associateSessionWithProfile(session.id, profile.id, 'manual', this.now());
    const existingMessages = this.options.database.listMessages(sessionId);
    const lastMessageSyncAt = this.options.database.getLastMessageSyncAt(sessionId);
    const shouldRefreshFromHermes =
      Boolean(session.runtimeSessionId) &&
      (existingMessages.length === 0 ||
        !lastMessageSyncAt ||
        Date.parse(session.lastUpdatedAt) > Date.parse(lastMessageSyncAt));

    if (shouldRefreshFromHermes) {
      const importedMessages = await this.options.hermesCli.exportSessionMessages(profile, session);
      if (importedMessages.length > 0) {
        this.options.database.replaceSessionMessages(sessionId, importedMessages, this.now());
      }
    }

    this.options.database.setActiveProfile(profile.id);
    this.options.database.setActiveSession(profile.id, sessionId, {
      preserveCurrentPage: true
    });

    const refreshedSession = this.options.database.getSession(sessionId);
    if (!refreshedSession) {
      throw new BridgeError(404, 'SESSION_NOT_FOUND', `Session ${sessionId} was not found after refresh.`);
    }
    const normalizedSession = this.normalizeSessionMessages(profile.id, sessionId, shouldRefreshFromHermes ? this.now() : lastMessageSyncAt);
    const attachedRecipe = this.options.database.getRecipeByPrimarySessionId(profile.id, refreshedSession.id) ?? null;

    return SessionMessagesResponseSchema.parse({
      profileId: profile.id,
      session: refreshedSession,
      messages: normalizedSession.messages,
      runtimeRequests: normalizedSession.runtimeRequests,
      attachedRecipe: attachedRecipe ?? null,
      recipeEvents: attachedRecipe
        ? this.options.database.listRecipeEvents(profile.id, {
            limit: 50,
            recipeId: attachedRecipe.id
          })
        : []
    });
  }

  async exportSession(profileId: string, sessionId: string) {
    const payload = await this.getSessionMessages(profileId, sessionId);
    return {
      profileId: payload.profileId,
      session: payload.session,
      messages: payload.messages.filter((message) => message.visibility === 'transcript' && message.kind !== 'technical')
    };
  }

  async getJobs(profileId: string): Promise<JobsResponse> {
    const profile = await this.ensureProfile(profileId);

    try {
      const jobs = await this.options.hermesCli.loadJobs(profile);
      const freshness = this.createJobsFreshness(profile.id, 'connected');
      this.options.database.upsertJobs(profile.id, jobs, freshness);
      const mergedJobs = this.options.database.getJobs(profile.id);

      return JobsResponseSchema.parse({
        connection: {
          status: 'connected',
          checkedAt: this.now(),
          usingCachedData: false
        },
        freshness,
        items: mergedJobs.items
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Failed to refresh Hermes jobs.';
      const cachedJobs = this.options.database.getJobs(profile.id);
      const freshness = this.createJobsFreshness(
        profile.id,
        cachedJobs.items.length > 0 ? 'error' : 'disconnected',
        detail,
        cachedJobs.items.length > 0
      );
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: null,
        requestId: null,
        severity: cachedJobs.items.length > 0 ? 'warning' : 'error',
        category: 'jobs',
        code: 'JOBS_REFRESH_FAILED',
        message: `Failed to refresh jobs for ${profile.id}.`,
        detail,
        payload: {
          usingCachedData: cachedJobs.items.length > 0
        }
      });
      this.options.database.upsertJobs(profile.id, cachedJobs.items, freshness);

      if (cachedJobs.items.length === 0) {
        throw new BridgeError(502, 'JOBS_REFRESH_FAILED', detail);
      }

      return JobsResponseSchema.parse({
        connection: {
          status: 'degraded',
          detail,
          checkedAt: this.now(),
          usingCachedData: true
        },
        freshness,
        items: cachedJobs.items
      });
    }
  }

  async getTools(profileId: string): Promise<ToolsResponse> {
    const profile = await this.ensureProfile(profileId);

    try {
      const tools = await this.options.hermesCli.listTools(profile);
      this.options.database.replaceTools(profile.id, tools);

      return ToolsResponseSchema.parse({
        connection: {
          status: 'connected',
          checkedAt: this.now(),
          usingCachedData: false
        },
        items: this.options.database.listTools(profile.id)
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Failed to refresh Hermes tools.';
      const cachedTools = this.options.database.listTools(profile.id);
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: null,
        requestId: null,
        severity: cachedTools.length > 0 ? 'warning' : 'error',
        category: 'tools',
        code: 'TOOLS_REFRESH_FAILED',
        message: `Failed to refresh tools for ${profile.id}.`,
        detail,
        payload: {
          usingCachedData: cachedTools.length > 0
        }
      });
      if (cachedTools.length === 0) {
        throw new BridgeError(502, 'TOOLS_REFRESH_FAILED', detail);
      }

      return ToolsResponseSchema.parse({
        connection: {
          status: 'degraded',
          detail,
          checkedAt: this.now(),
          usingCachedData: true
        },
        items: cachedTools
      });
    }
  }

  async getSkills(profileId: string): Promise<SkillsResponse> {
    const profile = await this.ensureProfile(profileId);

    try {
      const cachedSkillSummaries = new Map(
        this.options.database.listSkills(profile.id).map((skill) => [skill.id, skill.summary] as const)
      );
      const skills = (await this.options.hermesCli.listSkills(profile)).map((skill) => ({
        ...skill,
        summary:
          skill.summary.trim() ||
          cachedSkillSummaries.get(skill.id)?.trim() ||
          this.generateSkillSummary(profile, skill) ||
          ''
      }));
      this.options.database.replaceSkills(profile.id, skills);

      return SkillsResponseSchema.parse({
        connection: {
          status: 'connected',
          checkedAt: this.now(),
          usingCachedData: false
        },
        profileId: profile.id,
        items: this.options.database.listSkills(profile.id)
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Failed to refresh Hermes skills.';
      const cachedSkills = this.options.database.listSkills(profile.id);
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: null,
        requestId: null,
        severity: cachedSkills.length > 0 ? 'warning' : 'error',
        category: 'skills',
        code: 'SKILLS_REFRESH_FAILED',
        message: `Failed to refresh skills for ${profile.id}.`,
        detail,
        payload: {
          usingCachedData: cachedSkills.length > 0
        }
      });
      if (cachedSkills.length === 0) {
        throw new BridgeError(502, 'SKILLS_REFRESH_FAILED', detail);
      }

      return SkillsResponseSchema.parse({
        connection: {
          status: 'degraded',
          detail,
          checkedAt: this.now(),
          usingCachedData: true
        },
        profileId: profile.id,
        items: cachedSkills
      });
    }
  }

  async deleteSkill(skillId: string, input: DeleteSkillRequest): Promise<SkillDeletionResponse> {
    const parsedInput = DeleteSkillRequestSchema.parse(input);
    const profile = await this.ensureProfile(parsedInput.profileId);
    const skill = this.options.database.listSkills(profile.id).find((item) => item.id === skillId);
    if (!skill) {
      throw new BridgeError(404, 'SKILL_NOT_FOUND', `Skill ${skillId} was not found.`);
    }

    await this.options.hermesCli.deleteSkill(profile, skill.name);
    this.options.database.deleteSkill(profile.id, skill.id);

    return SkillDeletionResponseSchema.parse({
      profileId: profile.id,
      skillId: skill.id,
      skillName: skill.name,
      deletedAt: this.now()
    });
  }

  async listTelemetry(options: {
    profileId?: string | null;
    sessionId?: string | null;
    requestId?: string | null;
    limit?: number;
    page?: number;
    pageSize?: number;
  } = {}): Promise<TelemetryResponse> {
    if (options.profileId) {
      await this.ensureProfile(options.profileId);
    }

    const page = Math.max(1, Math.trunc(options.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Math.trunc(options.pageSize ?? options.limit ?? 25)));
    const telemetry = this.options.database.listTelemetryEventsPage({
      profileId: options.profileId,
      sessionId: options.sessionId,
      requestId: options.requestId,
      page,
      pageSize
    });

    return TelemetryResponseSchema.parse({
      items: telemetry.items,
      page,
      pageSize,
      total: telemetry.total
    });
  }

  async listAuditEvents(options: {
    profileId?: string | null;
    page?: number;
    pageSize?: number;
  } = {}): Promise<AuditEventsResponse> {
    if (options.profileId) {
      await this.ensureProfile(options.profileId);
    }

    const page = Math.max(1, Math.trunc(options.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Math.trunc(options.pageSize ?? 25)));
    const auditEvents = this.options.database.listAuditEventsPage({
      profileId: options.profileId,
      page,
      pageSize,
      types: ['unrestricted_access_enabled', 'unrestricted_access_disabled', 'unrestricted_access_used']
    });

    return AuditEventsResponseSchema.parse({
      items: auditEvents.items,
      page,
      pageSize,
      total: auditEvents.total
    });
  }

  async listRecipes(profileId: string): Promise<RecipesResponse> {
    await this.ensureProfile(profileId);

    return RecipesResponseSchema.parse({
      profileId,
      items: this.options.database.listRecipes(profileId),
      events: this.options.database.listRecipeEvents(profileId, {
        limit: 50
      })
    });
  }

  async getRecipe(profileId: string, recipeId: string): Promise<RecipeResponse> {
    const recipe = this.ensureRecipe(profileId, recipeId);
    this.options.database.setActiveRecipe(profileId, recipe.id);

    return RecipeResponseSchema.parse({
      profileId,
      recipe,
      events: this.options.database.listRecipeEvents(profileId, {
        limit: 50,
        recipeId
      })
    });
  }

  async createRecipe(input: CreateRecipeRequest): Promise<RecipeResponse> {
    const parsedInput = CreateRecipeRequestSchema.parse(input);
    await this.ensureProfile(parsedInput.profileId);
    const session = this.ensureScopedSession(parsedInput.profileId, parsedInput.sessionId);
    const recipe = this.options.database.createRecipe({
      profileId: parsedInput.profileId,
      primarySessionId: session.id,
      title: parsedInput.title,
      description: parsedInput.description,
      status: parsedInput.status ?? 'idle',
      tabs: this.normalizeRecipeTabsForMutation(parsedInput, {
        profileId: parsedInput.profileId,
        sessionId: session.id,
        operation: 'user createRecipe',
        currentRecipe: null
      }),
      uiState: normalizeRecipeUiState(parsedInput.uiState),
      source: 'user',
      lastUpdatedBy: 'user',
      metadata: normalizeRecipeMetadata(parsedInput.metadata)
    });

    if (!recipe) {
      throw new BridgeError(500, 'RECIPE_CREATE_FAILED', 'The bridge could not create the requested recipe.');
    }

    this.createRecipeEvent(recipe, 'created', `Created the recipe "${recipe.title}".`, 'user', session.id, {
      contentFormat: getRecipeContentFormat(recipe)
    });

    return this.getRecipe(parsedInput.profileId, recipe.id);
  }

  async updateRecipe(recipeId: string, input: UpdateRecipeRequest): Promise<RecipeResponse> {
    const parsedInput = UpdateRecipeRequestSchema.parse(input);
    const currentRecipe = this.ensureRecipe(parsedInput.profileId, recipeId);

    const updatedRecipe = this.options.database.updateRecipe(recipeId, {
      profileId: parsedInput.profileId,
      title: parsedInput.title,
      description: parsedInput.description,
      status: parsedInput.status,
      tabs: this.normalizeRecipeTabsForMutation(parsedInput, {
        profileId: parsedInput.profileId,
        sessionId: currentRecipe.primarySessionId,
        recipeId: currentRecipe.id,
        operation: 'user updateRecipe',
        currentRecipe
      }),
      uiState: parsedInput.uiState ? normalizeRecipeUiState({ ...currentRecipe.uiState, ...parsedInput.uiState }) : currentRecipe.uiState,
      lastUpdatedBy: parsedInput.lastUpdatedBy ?? 'user',
      metadata: normalizeRecipeMetadata(parsedInput.metadata, currentRecipe.metadata)
    });

    if (!updatedRecipe) {
      throw new BridgeError(404, 'RECIPE_NOT_FOUND', `Recipe ${recipeId} was not found after update.`);
    }

    const renamed = parsedInput.title !== undefined && parsedInput.title !== currentRecipe.title;
    this.createRecipeEvent(
      updatedRecipe,
      renamed ? 'renamed' : 'updated',
      renamed ? `Renamed "${currentRecipe.title}" to "${updatedRecipe.title}".` : `Updated the recipe "${updatedRecipe.title}".`,
      'user',
      updatedRecipe.primarySessionId,
      {
        contentFormat: getRecipeContentFormat(updatedRecipe),
        changeSummary: updatedRecipe.metadata.changeSummary
      }
    );

    return this.getRecipe(parsedInput.profileId, updatedRecipe.id);
  }

  async applyRecipeEntryAction(recipeId: string, input: ApplyRecipeEntryActionRequest): Promise<RecipeEntryActionResponse> {
    const parsedInput = ApplyRecipeEntryActionRequestSchema.parse(input);
    const currentRecipe = this.ensureRecipe(parsedInput.profileId, recipeId);
    const contentEntries = getRecipeContentEntries(currentRecipe);
    const targetEntryIds = [...new Set(parsedInput.entryIds.map((value) => value.trim()).filter((value) => value.length > 0))];
    const targetEntries = contentEntries.filter((entry) => targetEntryIds.includes(entry.id));

    if (targetEntries.length === 0) {
      throw new BridgeError(404, 'RECIPE_ENTRY_NOT_FOUND', 'The requested recipe entries were not found.');
    }

    const removedEntryIds: string[] = [];

    if (parsedInput.action === 'delete_source') {
      // Direct outbound API calls are not permitted from action handlers.
      // Source deletion must go through a Hermes prompt action so the agent
      // can reason about the operation, apply safe guards, and respect auth scopes.
      throw new BridgeError(
        400,
        'RECIPE_ACTION_OUTBOUND_NOT_ALLOWED',
        'Source deletion must be performed through a prompt-based template action, not a direct entry action. Use a run_template_followup action configured with outboundRequestsAllowed: true.'
      );
    }

    removedEntryIds.push(...targetEntryIds);

    const nextTabs = removeRecipeContentEntries(currentRecipe, removedEntryIds);
    const updatedRecipe = this.options.database.updateRecipe(recipeId, {
      profileId: parsedInput.profileId,
      tabs: nextTabs,
      lastUpdatedBy: 'user',
      metadata: normalizeRecipeMetadata(
        {
          changeSummary: `Removed ${removedEntryIds.length} ${removedEntryIds.length === 1 ? 'entry' : 'entries'} from the recipe.`
        },
        currentRecipe.metadata
      )
    });

    if (!updatedRecipe) {
      throw new BridgeError(404, 'RECIPE_NOT_FOUND', `Recipe ${recipeId} was not found after applying entry actions.`);
    }

    this.recordTelemetry({
      profileId: parsedInput.profileId,
      sessionId: currentRecipe.primarySessionId,
      requestId: null,
      severity: 'info',
      category: 'recipes',
      code: 'RECIPE_ENTRY_REMOVED',
      message: `Removed ${removedEntryIds.length} ${removedEntryIds.length === 1 ? 'entry' : 'entries'} from recipe ${currentRecipe.id}.`,
      detail: currentRecipe.title,
      payload: {
        recipeId: currentRecipe.id,
        entryIds: removedEntryIds
      }
    });

    this.createRecipeEvent(
      updatedRecipe,
      'updated',
      `Removed ${removedEntryIds.length} ${removedEntryIds.length === 1 ? 'entry' : 'entries'} from "${updatedRecipe.title}".`,
      'user',
      updatedRecipe.primarySessionId,
      {
        contentFormat: getRecipeContentFormat(updatedRecipe),
        changeSummary: updatedRecipe.metadata.changeSummary
      }
    );

    return RecipeEntryActionResponseSchema.parse({
      profileId: parsedInput.profileId,
      action: parsedInput.action,
      removedEntryIds,
      deletedSourceEntryIds: [],
      recipe: this.ensureRecipe(parsedInput.profileId, updatedRecipe.id),
      events: this.options.database.listRecipeEvents(parsedInput.profileId, {
        limit: 50,
        recipeId: updatedRecipe.id
      })
    });
  }

  async deleteRecipe(recipeId: string, input: DeleteRecipeRequest): Promise<RecipeDeletionResponse> {
    const parsedInput = DeleteRecipeRequestSchema.parse(input);
    const currentRecipe = this.ensureRecipe(parsedInput.profileId, recipeId);
    const deleted = this.options.database.deleteRecipe(parsedInput.profileId, recipeId, this.now());
    if (!deleted) {
      throw new BridgeError(404, 'RECIPE_NOT_FOUND', `Recipe ${recipeId} was not found after delete.`);
    }

    this.createRecipeEvent(currentRecipe, 'deleted', `Deleted the recipe "${currentRecipe.title}".`, 'user', currentRecipe.primarySessionId);
    return RecipeDeletionResponseSchema.parse(deleted);
  }

  async openRecipeChat(recipeId: string, input: OpenRecipeChatRequest): Promise<OpenRecipeChatResponse> {
    const profile = await this.ensureProfile(input.profileId);
    const currentRecipe = this.ensureRecipe(profile.id, recipeId);
    const linkedSession = this.ensureScopedSession(profile.id, currentRecipe.primarySessionId);
    this.options.database.setActiveProfile(profile.id);
    this.options.database.setActiveSession(profile.id, linkedSession.id);
    this.createRecipeEvent(currentRecipe, 'linked_chat', `Opened the attached chat for the recipe "${currentRecipe.title}".`, 'bridge', linkedSession.id, {
      primarySessionId: linkedSession.id,
      primaryRuntimeSessionId: linkedSession.runtimeSessionId ?? null
    });

    return OpenRecipeChatResponseSchema.parse({
      profileId: profile.id,
      recipe: currentRecipe,
      session: linkedSession
    });
  }

  private persistRuntimeProviderState(profileId: string, runtimeState: RuntimeProviderDiscoveryResult) {
    this.options.database.upsertRuntimeModelConfig(runtimeState.config);
    this.options.database.replaceProviderConnections(profileId, runtimeState.providers);
    this.options.database.replaceRuntimeProviderCatalog(profileId, runtimeState.providers);
  }

  private buildModelProviderResponseFromRuntimeState(
    runtimeState: RuntimeProviderDiscoveryResult,
    connection: {
      status: 'connected' | 'degraded';
      detail?: string;
      usingCachedData: boolean;
    }
  ) {
    return ModelProviderResponseSchema.parse({
      connection: {
        status: connection.status,
        detail: connection.detail,
        checkedAt: this.now(),
        usingCachedData: connection.usingCachedData
      },
      config: runtimeState.config,
      providers: runtimeState.providers,
      runtimeReadiness: runtimeState.runtimeReadiness,
      inspectedProviderId:
        runtimeState.inspectedProviderId ?? runtimeState.config.provider ?? runtimeState.providers[0]?.id ?? null,
      discoveredAt: runtimeState.discoveredAt ?? runtimeState.providers[0]?.lastSyncedAt ?? runtimeState.config.lastSyncedAt ?? this.now()
    });
  }

  private async ensureRuntimeReady(profileId: string) {
    const runtimeState = await this.getModelProviderState(profileId, null);
    if (!runtimeState.runtimeReadiness.ready) {
      throw new BridgeError(409, 'RUNTIME_CONFIG_REQUIRED', runtimeState.runtimeReadiness.message);
    }

    return runtimeState.runtimeReadiness;
  }

  async getModelProviderState(profileId: string, inspectedProviderId?: string | null): Promise<ModelProviderResponse> {
    const profile = await this.ensureProfile(profileId);

    try {
      const runtimeState = await this.options.hermesCli.discoverRuntimeProviderState(profile, inspectedProviderId ?? null);
      this.persistRuntimeProviderState(profile.id, runtimeState);

      if (!runtimeState.runtimeReadiness.ready) {
        this.recordTelemetryIfLatestDifferent(
          {
            profileId: profile.id,
            sessionId: null,
            requestId: null,
            severity: 'warning',
            category: 'model_provider',
            code: 'RUNTIME_CONFIG_BLOCKED',
            message: `Hermes runtime configuration is incomplete for ${profile.id}.`,
            detail: runtimeState.runtimeReadiness.message,
            payload: {
              providerId: runtimeState.runtimeReadiness.providerId,
              modelId: runtimeState.runtimeReadiness.modelId,
              readinessCode: runtimeState.runtimeReadiness.code
            }
          },
          {
            profileId: profile.id,
            sessionId: null,
            requestId: null
          }
        );
      }

      return this.buildModelProviderResponseFromRuntimeState(runtimeState, {
        status: 'connected',
        usingCachedData: false
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Failed to refresh Hermes model/provider state.';
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: null,
        requestId: null,
        severity: 'error',
        category: 'model_provider',
        code: 'MODEL_PROVIDER_REFRESH_FAILED',
        message: `Failed to refresh Hermes model/provider state for ${profile.id}.`,
        detail,
        payload: {
          inspectedProviderId: inspectedProviderId ?? null
        }
      });
      throw new BridgeError(502, 'MODEL_PROVIDER_REFRESH_FAILED', 'Hermes authoritative model/provider state is unavailable. Open Settings and retry the provider check.');
    }
  }

  async updateRuntimeModelConfig(input: UpdateRuntimeModelConfigRequest) {
    const parsedInput = UpdateRuntimeModelConfigRequestSchema.parse(input);
    const profile = await this.ensureProfile(parsedInput.profileId);
    try {
      const config = await this.options.hermesCli.updateRuntimeModelConfig(profile, parsedInput);
      this.options.database.upsertRuntimeModelConfig(config);
      return this.getModelProviderState(profile.id, parsedInput.provider ?? config.provider);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Failed to update model/provider settings.';
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: null,
        requestId: null,
        severity: 'error',
        category: 'model_provider',
        code: 'MODEL_PROVIDER_UPDATE_FAILED',
        message: `Failed to update runtime model/provider settings for ${profile.id}.`,
        detail,
        payload: {
          provider: parsedInput.provider ?? null,
          defaultModel: parsedInput.defaultModel ?? null
        }
      });
      throw error;
    }
  }

  async connectProvider(input: ConnectProviderRequest) {
    const parsedInput = ConnectProviderRequestSchema.parse(input);
    const profile = await this.ensureProfile(parsedInput.profileId);
    try {
      const runtimeState = await this.options.hermesCli.connectProvider(profile, parsedInput);
      this.persistRuntimeProviderState(profile.id, runtimeState);
      this.options.database.appendAuditEvent({
        id: `audit-${randomUUID()}`,
        type: 'provider_connected',
        profileId: profile.id,
        sessionId: null,
        message: `Connected provider ${parsedInput.provider} for ${profile.id}.`,
        createdAt: this.now()
      });
      return this.buildModelProviderResponseFromRuntimeState(runtimeState, {
        status: 'connected',
        usingCachedData: false
      });
    } catch (error) {
      const detail =
        error instanceof HermesCliStructuredActionError
          ? error.detail ?? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to connect the provider.';
      const userMessage =
        error instanceof HermesCliStructuredActionError ? error.message : 'Hermes could not connect the provider. Check the credential and try again.';
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: null,
        requestId: null,
        severity: 'error',
        category: 'model_provider',
        code: 'PROVIDER_CONNECT_FAILED',
        message: `Failed to connect provider ${parsedInput.provider} for ${profile.id}.`,
        detail,
        payload: {
          provider: parsedInput.provider,
          actionCode: error instanceof HermesCliStructuredActionError ? error.code : null
        }
      });
      throw new BridgeError(400, 'PROVIDER_CONNECT_FAILED', userMessage);
    }
  }

  async beginProviderAuth(input: { profileId: string; provider: string }) {
    const profile = await this.ensureProfile(input.profileId);
    try {
      const runtimeState = await this.options.hermesCli.beginProviderAuth(profile, input.provider);
      this.persistRuntimeProviderState(profile.id, runtimeState);
      return this.buildModelProviderResponseFromRuntimeState(runtimeState, {
        status: 'connected',
        usingCachedData: false
      });
    } catch (error) {
      const detail =
        error instanceof HermesCliStructuredActionError
          ? error.detail ?? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to start provider auth.';
      const userMessage =
        error instanceof HermesCliStructuredActionError
          ? error.message
          : 'Hermes could not start provider authorization. Check the logs and try again.';
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: null,
        requestId: null,
        severity: 'error',
        category: 'model_provider',
        code: 'PROVIDER_AUTH_FAILED',
        message: `Failed to start provider auth for ${input.provider} in ${profile.id}.`,
        detail,
        payload: {
          provider: input.provider,
          actionCode: error instanceof HermesCliStructuredActionError ? error.code : null
        }
      });
      throw new BridgeError(400, 'PROVIDER_AUTH_FAILED', userMessage);
    }
  }

  async pollProviderAuth(input: { profileId: string; provider: string; authSessionId?: string | null }) {
    const profile = await this.ensureProfile(input.profileId);
    try {
      const runtimeState = await this.options.hermesCli.pollProviderAuth(profile, input.provider, input.authSessionId ?? null);
      this.persistRuntimeProviderState(profile.id, runtimeState);
      return this.buildModelProviderResponseFromRuntimeState(runtimeState, {
        status: 'connected',
        usingCachedData: false
      });
    } catch (error) {
      const detail =
        error instanceof HermesCliStructuredActionError
          ? error.detail ?? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to poll provider auth.';
      const userMessage =
        error instanceof HermesCliStructuredActionError
          ? error.message
          : 'Hermes could not refresh provider authorization. Check the logs and try again.';
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: null,
        requestId: null,
        severity: 'error',
        category: 'model_provider',
        code: 'PROVIDER_AUTH_POLL_FAILED',
        message: `Failed to poll provider auth for ${input.provider} in ${profile.id}.`,
        detail,
        payload: {
          provider: input.provider,
          authSessionId: input.authSessionId ?? null,
          actionCode: error instanceof HermesCliStructuredActionError ? error.code : null
        }
      });
      throw new BridgeError(400, 'PROVIDER_AUTH_POLL_FAILED', userMessage);
    }
  }

  async listToolHistory(page: number, pageSize: number, profileId: string): Promise<ToolHistoryResponse> {
    await this.ensureProfile(profileId);
    const history = this.options.database.listToolExecutions(page, pageSize, profileId);
    const runtimeHistory = this.options.database.listRuntimeActivityHistory(page, pageSize, profileId);
    return ToolHistoryResponseSchema.parse({
      items: history.items,
      runtimeItems: runtimeHistory.items,
      page,
      pageSize,
      total: history.total,
      runtimeTotal: runtimeHistory.total
    });
  }

  getSettings(): SettingsResponse {
    return SettingsResponseSchema.parse({
      settings: this.options.database.getSettings(),
      accessAudit: this.options.database.getAccessAuditSummary(this.resolveActiveProfileId())
    });
  }

  async updateSettings(input: UpdateSettingsRequest) {
    const parsedInput = UpdateSettingsRequestSchema.parse(input);
    const previousSettings = this.options.database.getSettings();
    const settings = this.options.database.updateSettings(parsedInput);

    if (!previousSettings.unrestrictedAccessEnabled && settings.unrestrictedAccessEnabled) {
      this.options.database.appendAuditEvent({
        id: `audit-${randomUUID()}`,
        type: 'unrestricted_access_enabled',
        profileId: this.resolveActiveProfileId(),
        sessionId: null,
        message: 'Unrestricted Access was enabled.',
        createdAt: this.now()
      });
    } else if (previousSettings.unrestrictedAccessEnabled && !settings.unrestrictedAccessEnabled) {
      this.options.database.appendAuditEvent({
        id: `audit-${randomUUID()}`,
        type: 'unrestricted_access_disabled',
        profileId: this.resolveActiveProfileId(),
        sessionId: null,
        message: 'Unrestricted Access was disabled.',
        createdAt: this.now()
      });
    }

    return this.getSettings();
  }

  async updateUiState(input: UpdateUiStateRequest) {
    const parsedInput = UpdateUiStateRequestSchema.parse(input);
    return this.options.database.updateUiState(parsedInput as Partial<UiState>);
  }

  async prepareToolExecution(input: ToolExecutionPrepareRequest) {
    const parsedInput = ToolExecutionPrepareRequestSchema.parse(input);
    if (parsedInput.toolId !== bridgeReviewedShellToolId) {
      throw new BridgeError(400, 'TOOL_NOT_REVIEWABLE', `Tool ${parsedInput.toolId} is not managed by the reviewed bridge execution path.`);
    }

    return this.options.database.createToolExecution({
      ...parsedInput,
      status: 'pending',
      requestedAt: this.now()
    });
  }

  async resolveToolExecution(executionId: string, input: ToolExecutionResolveRequest) {
    const execution = this.options.database.getToolExecution(executionId);
    if (!execution) {
      throw new BridgeError(404, 'TOOL_EXECUTION_NOT_FOUND', `Tool execution ${executionId} was not found.`);
    }

    if (execution.status !== 'pending') {
      return execution;
    }

    if (input.decision === 'reject') {
      return this.options.database.updateToolExecution(executionId, {
        status: 'rejected',
        resolvedAt: this.now(),
        stderr: 'Rejected by the user.',
        exitCode: 1
      });
    }

    this.options.database.updateToolExecution(executionId, {
      status: 'approved',
      resolvedAt: this.now()
    });

    const result = await runReviewedToolExecution(
      {
        toolId: execution.toolId,
        profileId: execution.profileId,
        sessionId: execution.sessionId,
        summary: execution.summary,
        command: execution.command,
        args: execution.args,
        cwd: execution.cwd
      },
      this.recipeRoot,
      execution.requestedAt
    );

    return this.options.database.updateToolExecution(executionId, {
      status: result.status,
      resolvedAt: result.resolvedAt,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode
    });
  }

  private async streamHermesRequest(input: StreamBridgeRequestInput, onEvent: (event: ChatStreamEvent) => Promise<void> | void) {
    const profile = await this.ensureProfile(input.profileId);
    await this.ensureRuntimeReady(profile.id);
    let session = this.ensureScopedSession(profile.id, input.sessionId);
    let activeRecipe = input.recipeId
      ? this.ensureRecipe(profile.id, input.recipeId)
      : session.attachedRecipeId
        ? this.ensureRecipe(profile.id, session.attachedRecipeId)
        : null;
    const requestMode = input.mode ?? 'chat';
    if (requestMode === 'recipe_refresh' && !activeRecipe) {
      throw new BridgeError(400, 'RECIPE_REFRESH_REQUIRES_ATTACHED_SPACE', 'Open an attached recipe session before refreshing it.');
    }

    const refreshContext = requestMode === 'recipe_refresh' && activeRecipe ? this.buildRecipeRefreshContext(session.id, activeRecipe) : null;
    const structuredIntentPrompt =
      requestMode === 'recipe_refresh'
        ? (refreshContext?.intentPrompt ?? input.intentContent ?? input.transcriptContent)
        : (input.intentContent ?? input.transcriptContent);
    const attachedTemplateId = activeRecipe?.dynamic?.recipeTemplate?.templateId ?? null;
    const intentClassification = this.classifyRequiredStructuredRecipeIntent(
      structuredIntentPrompt,
      Boolean(activeRecipe),
      attachedTemplateId
    );
    const structuredRecipeIntent = intentClassification.intent;
    const mutationIntent = intentClassification.mutationIntent;
    const settings = this.options.database.getSettings();
    const transcriptContent = input.transcriptContent.trim();
    const hermesContent = (input.hermesContent ?? transcriptContent).trim();
    const requestPreview = this.normalizeRequestPreview(transcriptContent);
    const isRetryBuild = this.isRetryBuildAttempt(input.triggerKindOverride ?? null, input.triggerActionId ?? null);

    this.options.database.associateSessionWithProfile(session.id, profile.id, 'bridge_chat', this.now());
    this.options.database.setActiveProfile(profile.id);
    this.options.database.setActiveSession(profile.id, session.id);
    if (activeRecipe) {
      this.options.database.linkRecipeToSession(activeRecipe.id, session);
    }
    await onEvent({
      type: 'session',
      session
    });

    const userMessage = ChatMessageSchema.parse({
      id: `message-${randomUUID()}`,
      sessionId: session.id,
      role: 'user',
      content: transcriptContent,
      createdAt: this.now(),
      requestId: `request-${randomUUID()}`,
      visibility: 'transcript',
      kind: 'conversation'
    });
    const requestId = userMessage.requestId ?? userMessage.id;

    this.options.database.appendMessage(userMessage);
    this.ensurePersistedRuntimeRequest(profile.id, session.id, requestId, requestPreview, userMessage.createdAt);
    let recipePipeline = createInitialRecipePipeline(userMessage.createdAt);
    activeRecipe = this.persistRecipePipeline(requestId, recipePipeline, activeRecipe) ?? activeRecipe;
    this.recordTelemetry({
      profileId: profile.id,
      sessionId: session.id,
      requestId,
      severity: 'info',
      category: 'runtime',
      code: 'CHAT_REQUEST_STARTED',
      message: `Started Hermes request ${requestId}.`,
      detail: requestPreview,
      payload: {
        recipeId: activeRecipe?.id ?? null,
        mode: requestMode,
        triggerActionId: input.triggerActionId ?? null,
        unrestrictedAccessEnabled: settings.unrestrictedAccessEnabled
      },
      createdAt: userMessage.createdAt
    });
    if (isRetryBuild) {
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: session.id,
        requestId,
        severity: 'info',
        category: 'recipes',
        code: 'RECIPE_RETRY_BUILD_STARTED',
        message: 'Started retrying the attached dynamic recipe build.',
        detail: requestPreview,
        payload: {
          recipeId: activeRecipe?.id ?? null,
          triggerActionId: input.triggerActionId ?? null
        },
        createdAt: userMessage.createdAt
      });
    }
    session = this.options.database.getSession(session.id) ?? session;
    await onEvent({
      type: 'message',
      message: userMessage
    });

    if (settings.unrestrictedAccessEnabled) {
      this.options.database.appendAuditEvent({
        id: `audit-${randomUUID()}`,
        type: 'unrestricted_access_used',
        profileId: profile.id,
        sessionId: session.id,
        message: `Unrestricted Access was used for session ${session.id}.`,
        createdAt: this.now()
      });
    }

    // Phase 3 quick win: emit an early optimistic ghost as soon as intent is known — before the
    // chat LLM even starts.  This gives the frontend a skeleton within ~50ms of the user hitting
    // send, rather than waiting for the full chat → baseline → queue → enrichment pipeline.
    //
    // Conditions: structured intent must resolve to a known template, a recipe must already exist
    // (we're updating), and we must not be in refresh/action mode (those have their own flows).
    const earlyGhostTemplateId =
      structuredRecipeIntent && requestMode === 'chat' && activeRecipe
        ? resolveTemplateIdForIntentLabel(structuredRecipeIntent.label)
        : null;
    if (earlyGhostTemplateId && activeRecipe) {
      const earlyGhostState = createRecipeTemplateGhostState({
        templateId: earlyGhostTemplateId,
        currentState: activeRecipe.dynamic?.recipeTemplate ?? null,
        transitionReason: null,
        updatedAt: this.now(),
        phase: 'selected',
        failureCategory: null,
        errorMessage: null,
        failureScope: 'all'
      }).state;
      if (earlyGhostState) {
        await onEvent({
          type: 'recipe_build_progress',
          recipeId: activeRecipe.id,
          build: {
            id: `early-ghost-${requestId}`,
            recipeId: activeRecipe.id,
            profileId: profile.id,
            sessionId: session.id,
            buildVersion: 0,
            buildKind: 'template_enrichment',
            triggerKind: 'chat',
            triggerRequestId: requestId,
            triggerActionId: null,
            phase: 'template_selecting',
            progressMessage: 'Preparing recipe template…',
            retryCount: 0,
            startedAt: this.now(),
            updatedAt: this.now(),
            completedAt: null,
            errorCode: null,
            errorMessage: null,
            errorDetail: null,
            failureCategory: null,
            failureStage: null,
            userFacingMessage: null,
            retryable: true,
            configuredTimeoutMs: null
          },
          recipe: activeRecipe,
          partialTemplateState: earlyGhostState
        });
        this.recordTelemetry({
          profileId: profile.id,
          sessionId: session.id,
          requestId,
          severity: 'info',
          category: 'recipes',
          code: 'RECIPE_EARLY_GHOST_EMITTED',
          message: 'Emitted early optimistic ghost state before chat LLM started.',
          detail: `Predicted template: ${earlyGhostTemplateId}`,
          payload: { templateId: earlyGhostTemplateId, recipeId: activeRecipe.id },
          createdAt: this.now()
        });
      }
    }

    try {
      const chatResult = await this.options.hermesCli.streamChat({
        profile,
        runtimeSessionId: session.runtimeSessionId,
        content: hermesContent,
        requestMode,
        spaceContext: activeRecipe ? this.buildRecipeChatContext(activeRecipe) : null,
        refreshContext,
        requestId,
        timeoutMs: settings.chatTimeoutMs,
        discoveryTimeoutMs: settings.discoveryTimeoutMs,
        nearbySearchTimeoutMs: settings.nearbySearchTimeoutMs,
        recipeOperationTimeoutMs: settings.recipeOperationTimeoutMs,
        unrestrictedTimeoutMs: settings.unrestrictedTimeoutMs,
        maxTurns: settings.restrictedChatMaxTurns,
        unrestrictedAccessEnabled: settings.unrestrictedAccessEnabled,
        onProgress: async (message) => {
          this.appendPersistedRuntimeActivity(profile.id, session.id, requestId, requestPreview, {
            kind: 'status',
            state: 'updated',
            label: 'Runtime status',
            detail: message,
            requestId,
            timestamp: this.now()
          });
          await onEvent({
            type: 'progress',
            requestId,
            message
          });
        },
        onActivity: async (activity) => {
          const resolvedActivity = {
            ...activity,
            requestId: activity.requestId ?? requestId,
            timestamp: activity.timestamp ?? this.now()
          } satisfies ChatActivity;
          this.appendPersistedRuntimeActivity(profile.id, session.id, requestId, requestPreview, resolvedActivity);
          await onEvent({
            type: 'activity',
            activity: resolvedActivity
          });
        },
        onAssistantSnapshot: async (markdown) => {
          await onEvent({
            type: 'assistant_snapshot',
            requestId,
            markdown
          });
        }
      });

      const refreshedSession = this.options.database.updateSession({
        id: session.id,
        runtimeSessionId: chatResult.runtimeSessionId ?? session.runtimeSessionId,
        lastUsedProfileId: profile.id
      });

      if (!refreshedSession) {
        throw new BridgeError(500, 'SESSION_UPDATE_FAILED', `Failed to update session ${session.id}.`);
      }

      const currentHomeRecipeId = activeRecipe?.id ?? refreshedSession.attachedRecipeId ?? null;
      const cleanedLegacyRecipeMarkdown = extractRecipeOperations(chatResult.assistantMarkdown).cleanedMarkdown.trim();
      const conversationalAssistantMarkdown =
        this.sanitizeAssistantMarkdownForFallback(cleanedLegacyRecipeMarkdown || chatResult.assistantMarkdown).trim() ||
        cleanedLegacyRecipeMarkdown ||
        chatResult.assistantMarkdown.trim();
      recipePipeline = updateRecipePipelineSegment(recipePipeline, 'task', 'baseline_updating', {
        status: 'ready',
        stage: 'task_ready',
        message: 'Hermes completed the task.',
        retryable: false,
        updatedAt: this.now()
      });
      recipePipeline = updateRecipePipelineSegment(recipePipeline, 'baseline', 'baseline_updating', {
        status: 'running',
        stage: 'baseline_updating',
        message: 'Updating the Home recipe baseline.',
        retryable: true,
        updatedAt: this.now()
      });
      activeRecipe = this.persistRecipePipeline(requestId, recipePipeline, activeRecipe) ?? activeRecipe;

      let recipeResult: RecipeMutationResult;
      try {
        recipeResult = await this.createOrUpdateHomeBaselineRecipe(
          profile.id,
          refreshedSession,
          currentHomeRecipeId,
          requestId,
          requestPreview,
          requestMode,
          conversationalAssistantMarkdown,
          structuredRecipeIntent,
          recipePipeline,
          onEvent
        );
      } catch (baselineError) {
        const baselineFailure = this.classifyBaselineFailure(
          baselineError instanceof Error ? baselineError.message : 'The Home recipe baseline could not be updated.'
        );
        const baselineFailedAt = this.now();
        recipePipeline = updateRecipePipelineSegment(recipePipeline, 'baseline', 'baseline_failed', {
          status: 'failed',
          stage: 'baseline_failed',
          failureCategory: baselineFailure.category,
          message: baselineFailure.userFacingMessage,
          diagnostic: baselineFailure.diagnostic,
          retryable: baselineFailure.retryable,
          updatedAt: baselineFailedAt
        });
        recipePipeline = updateRecipePipelineSegment(recipePipeline, 'applet', 'baseline_failed', {
          status: 'skipped',
          message: 'Applet enrichment was skipped because the Home recipe baseline was not ready.',
          retryable: false,
          updatedAt: baselineFailedAt
        });
        activeRecipe = this.persistRecipePipeline(requestId, recipePipeline, activeRecipe) ?? activeRecipe;

        this.recordTelemetry({
          profileId: profile.id,
          sessionId: refreshedSession.id,
          requestId,
          severity: 'error',
          category: 'recipes',
          code: 'HOME_WORKRECIPE_BASELINE_FAILED',
          message: 'The Home recipe baseline failed after Hermes completed the task.',
          detail: baselineFailure.diagnostic,
          payload: {
            recipeId: activeRecipe?.id ?? null,
            failureCategory: baselineFailure.category,
            failureStage: baselineFailure.failureStage,
            retryable: baselineFailure.retryable
          },
          createdAt: baselineFailedAt
        });

        const assistantMessage = this.options.database.appendMessage(
          ChatMessageSchema.parse({
            id: `message-${randomUUID()}`,
            sessionId: refreshedSession.id,
            role: 'assistant',
            content: conversationalAssistantMarkdown,
            createdAt: baselineFailedAt,
            requestId,
            visibility: 'transcript',
            kind: 'conversation'
          })
        );
        const baselineFailureNotice = this.options.database.appendMessage(
          ChatMessageSchema.parse({
            id: `message-${randomUUID()}`,
            sessionId: refreshedSession.id,
            role: 'system',
            content: baselineFailure.userFacingMessage,
            createdAt: this.now(),
            requestId,
            status: 'error',
            visibility: 'transcript',
            kind: 'notice'
          })
        );
        this.options.database.markSessionMessagesSynced(refreshedSession.id, baselineFailureNotice.createdAt);
        this.appendPersistedRuntimeActivity(profile.id, refreshedSession.id, requestId, requestPreview, {
          kind: 'warning',
          state: 'failed',
          label: 'Home recipe',
          detail: baselineFailure.userFacingMessage,
          requestId,
          timestamp: baselineFailureNotice.createdAt
        });
        this.finalizePersistedRuntimeRequest(profile.id, refreshedSession.id, requestId, requestPreview, 'completed', baselineFailureNotice.createdAt);
        this.recordTelemetry({
          profileId: profile.id,
          sessionId: refreshedSession.id,
          requestId,
          severity: 'info',
          category: 'runtime',
          code: 'CHAT_REQUEST_COMPLETED',
          message: `Completed Hermes request ${requestId}.`,
          detail: 'Hermes returned the assistant answer, but the Home recipe baseline failed to update.',
          payload: {
            recipeId: activeRecipe?.id ?? null,
            recipeOperations: ['assistant answer delivered', 'baseline failed'],
            triggerActionId: input.triggerActionId ?? null
          },
          createdAt: baselineFailureNotice.createdAt
        });

        await onEvent({
          type: 'message',
          message: assistantMessage
        });
        await onEvent({
          type: 'message',
          message: baselineFailureNotice
        });
        await onEvent({
          type: 'complete',
          session: this.options.database.getSession(refreshedSession.id) ?? refreshedSession,
          assistantMessage
        });
        return;
      }

      if (recipeResult.activeRecipeId) {
        activeRecipe = this.options.database.getRecipe(recipeResult.activeRecipeId);
      }
      recipePipeline = updateRecipePipelineSegment(recipePipeline, 'baseline', 'baseline_ready', {
        status: 'ready',
        stage: 'baseline_ready',
        message: 'The Home recipe baseline is ready.',
        retryable: false,
        updatedAt: this.now()
      });
      activeRecipe = this.persistRecipePipeline(requestId, recipePipeline, activeRecipe) ?? activeRecipe;
      if (activeRecipe) {
        await this.emitRecipePipelineStateEvent(
          activeRecipe,
          refreshedSession.id,
          onEvent,
          `Hermes finalized the Home recipe baseline for "${activeRecipe.title}".`,
          {
            contentFormat: 'markdown'
          }
        );
      }
      const recipeSummaries = [...recipeResult.summaries];
      let queuedRecipeEnrichmentJob: RecipeAppletEnrichmentJobInput | null = null;
      if (
        activeRecipe &&
        this.shouldAttemptRecipeAppletUpgrade(requestMode, structuredRecipeIntent, isRetryBuild, mutationIntent)
      ) {
        const queuedAppletBuild = await this.queueRecipeAppletBuild({
          profile,
          session: refreshedSession,
          currentRecipe: activeRecipe,
          requestId,
          requestPreview,
          requestMode,
          settings,
          pipeline: recipePipeline,
          onEvent,
          triggerActionId: input.triggerActionId ?? null,
          triggerKindOverride: input.triggerKindOverride ?? null,
          progressMessage: 'Queued recipe enrichment…',
          pipelineMessage: 'Recipe generation is queued and filling an approved template in the background.',
          pipelineEventMessage: `Hermes queued background recipe generation for "${activeRecipe.title}" after the Home baseline was ready.`,
          telemetryCode: 'RECIPE_TEMPLATE_ENRICHMENT_QUEUED',
          telemetryMessage: 'Queued async template-constrained recipe generation after the baseline Home recipe completed.',
          telemetryDetail: 'The user-facing request will complete now; the recipe template continues in the background.',
          buildKind: 'template_enrichment',
          renderMode: 'dynamic_v1'
        });
        activeRecipe = queuedAppletBuild.recipe;
        recipePipeline = queuedAppletBuild.pipeline;
        queuedRecipeEnrichmentJob = {
          kind: 'request',
          profile,
          session: refreshedSession,
          recipeId: activeRecipe.id,
          requestId,
          requestPreview,
          requestMode,
          settings,
          buildId: queuedAppletBuild.build.id,
          structuredIntentPrompt,
          conversationalAssistantMarkdown,
          structuredRecipeIntent,
          mutationIntent: mutationIntent ?? null,
          refreshContext,
          triggerActionId: input.triggerActionId ?? null,
          triggerKindOverride: input.triggerKindOverride ?? null
        };
        recipeSummaries.push(`queued background recipe enrichment for "${activeRecipe.title}"`);
      } else {
        recipePipeline = updateRecipePipelineSegment(recipePipeline, 'applet', 'baseline_ready', {
          status: 'skipped',
          message: 'No richer recipe enrichment was required for this response.',
          retryable: false,
          updatedAt: this.now()
        });
        activeRecipe = this.persistRecipePipeline(requestId, recipePipeline, activeRecipe) ?? activeRecipe;
        if (activeRecipe) {
          await this.emitRecipePipelineStateEvent(
            activeRecipe,
            refreshedSession.id,
            onEvent,
            `Hermes kept the Home recipe baseline for "${activeRecipe.title}" without richer recipe enrichment.`,
            {
              enrichmentStatus: 'skipped'
            }
          );
        }
      }
      if (activeRecipe?.id) {
        this.options.database.setActiveRecipe(profile.id, activeRecipe.id);
      }
      if (
        isRetryBuild &&
        activeRecipe?.id
      ) {
        this.recordTelemetry({
          profileId: profile.id,
          sessionId: refreshedSession.id,
          requestId,
          severity: 'info',
          category: 'recipes',
          code: 'RECIPE_RETRY_BUILD_COMPLETED',
          message: 'Retry build completed successfully.',
          detail: recipeSummaries.join(', ') || 'Hermes updated the attached Home recipe.',
          payload: {
            recipeId: activeRecipe.id,
            triggerActionId: input.triggerActionId ?? null
          }
        });
      }

      const assistantMessage = this.options.database.appendMessage(
        ChatMessageSchema.parse({
          id: `message-${randomUUID()}`,
          sessionId: refreshedSession.id,
          role: 'assistant',
          content: conversationalAssistantMarkdown || recipeResult.assistantMarkdown,
          createdAt: this.now(),
          requestId,
          visibility: 'transcript',
          kind: 'conversation'
        })
      );
      this.options.database.markSessionMessagesSynced(refreshedSession.id, assistantMessage.createdAt);
      this.appendPersistedRuntimeActivity(profile.id, refreshedSession.id, requestId, requestPreview, {
        kind: 'status',
        state: 'completed',
        label: 'Runtime status',
        detail: 'Hermes completed the active request.',
        requestId,
        timestamp: assistantMessage.createdAt
      });
      this.finalizePersistedRuntimeRequest(profile.id, refreshedSession.id, requestId, requestPreview, 'completed', assistantMessage.createdAt);
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: refreshedSession.id,
        requestId,
        severity: 'info',
        category: 'runtime',
        code: 'CHAT_REQUEST_COMPLETED',
        message: `Completed Hermes request ${requestId}.`,
        detail: recipeSummaries.length > 0 ? recipeSummaries.join(', ') : 'Hermes returned a final assistant response.',
        payload: {
          recipeId: recipeResult.activeRecipeId ?? activeRecipe?.id ?? null,
          recipeOperations: recipeSummaries,
          triggerActionId: input.triggerActionId ?? null
        },
        createdAt: assistantMessage.createdAt
      });

      await onEvent({
        type: 'complete',
        session: this.options.database.getSession(refreshedSession.id) ?? refreshedSession,
        assistantMessage
      });

      if (queuedRecipeEnrichmentJob) {
        this.enqueueRecipeAppletEnrichmentJob(queuedRecipeEnrichmentJob);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Hermes chat failed.';
      const taskFailure = this.classifyTaskFailure({
        profileId: profile.id,
        prompt: hermesContent,
        requestMode,
        structuredRecipeIntent,
        activeRecipe,
        refreshContext,
        settings,
        detail: message
      });
      const failedAt = this.now();
      recipePipeline = updateRecipePipelineSegment(recipePipeline, 'task', 'task_failed', {
        status: 'failed',
        stage: 'task_failed',
        failureCategory: taskFailure.category,
        message: taskFailure.userFacingMessage,
        diagnostic: taskFailure.diagnostic,
        retryable: taskFailure.retryable,
        configuredTimeoutMs: taskFailure.configuredTimeoutMs,
        updatedAt: failedAt
      });
      recipePipeline = updateRecipePipelineSegment(recipePipeline, 'baseline', 'task_failed', {
        status: 'skipped',
        message: 'The Home recipe baseline was not updated because the task did not finish.',
        retryable: false,
        updatedAt: failedAt
      });
      recipePipeline = updateRecipePipelineSegment(recipePipeline, 'applet', 'task_failed', {
        status: 'skipped',
        message: 'Applet enrichment was not started because the task did not finish.',
        retryable: false,
        updatedAt: failedAt
      });
      activeRecipe = this.persistRecipePipeline(requestId, recipePipeline, activeRecipe) ?? activeRecipe;
      if (activeRecipe) {
        await this.emitRecipePipelineStateEvent(
          activeRecipe,
          session.id,
          onEvent,
          taskFailure.userFacingMessage,
          {
            failureCategory: taskFailure.category
          }
        );
      }
      this.appendPersistedRuntimeActivity(profile.id, session.id, requestId, requestPreview, {
        kind: 'warning',
        state: 'failed',
        label: 'Runtime status',
        detail: message,
        requestId,
        timestamp: failedAt
      });
      this.finalizePersistedRuntimeRequest(profile.id, session.id, requestId, requestPreview, 'failed', failedAt, message);
      if (/timed out/i.test(message)) {
        this.recordTelemetry({
          profileId: profile.id,
          sessionId: session.id,
          requestId,
          severity: 'warning',
          category: 'runtime',
          code: 'CHAT_REQUEST_TIMEOUT',
          message: `Hermes timed out while handling request ${requestId}.`,
          detail: message,
          payload: {
            recipeId: activeRecipe?.id ?? null,
            unrestrictedAccessEnabled: settings.unrestrictedAccessEnabled,
            failureCategory: taskFailure.category,
            failureStage: taskFailure.failureStage,
            configuredTimeoutMs: taskFailure.configuredTimeoutMs ?? null
          },
          createdAt: failedAt
        });
      }
      this.recordTelemetry({
        profileId: profile.id,
        sessionId: session.id,
        requestId,
        severity: 'error',
        category: 'runtime',
        code: 'CHAT_STREAM_FAILED',
        message: `Hermes could not finish request ${requestId}.`,
        detail: message,
        payload: {
          recipeId: activeRecipe?.id ?? null,
          triggerActionId: input.triggerActionId ?? null,
          unrestrictedAccessEnabled: settings.unrestrictedAccessEnabled,
          failureCategory: taskFailure.category,
          failureStage: taskFailure.failureStage,
          retryable: taskFailure.retryable,
          configuredTimeoutMs: taskFailure.configuredTimeoutMs ?? null
        },
        createdAt: failedAt
      });
      await onEvent({
        type: 'activity',
        activity: {
          kind: 'warning',
          state: 'failed',
          label: 'Runtime status',
          detail: message,
          requestId,
          timestamp: failedAt
        }
      });

      const systemMessage = this.options.database.appendMessage(
        ChatMessageSchema.parse({
          id: `message-${randomUUID()}`,
          sessionId: session.id,
          role: 'system',
          content: taskFailure.userFacingMessage,
          createdAt: this.now(),
          status: 'error',
          requestId,
          visibility: 'transcript',
          kind: 'notice'
        })
      );
      this.options.database.markSessionMessagesSynced(session.id, systemMessage.createdAt);

      await onEvent({
        type: 'message',
        message: systemMessage
      });
      await onEvent({
        type: 'error',
        requestId,
        error: ApiErrorSchema.parse({
          code: 'CHAT_FAILED',
          message: taskFailure.userFacingMessage
        })
      });
    }
  }

  async streamChat(input: ChatStreamRequest, onEvent: (event: ChatStreamEvent) => Promise<void> | void) {
    await this.streamHermesRequest(
      {
        profileId: input.profileId,
        sessionId: input.sessionId,
        recipeId: input.recipeId,
        transcriptContent: input.content,
        hermesContent: input.content,
        intentContent: input.content,
        mode: input.mode
      },
      onEvent
    );
  }

  async streamBuilderChat(
    input: { profileId: string; sessionId: string; transcriptContent: string; hermesContent: string },
    onEvent: (event: ChatStreamEvent) => Promise<void> | void
  ) {
    // Lightweight chat path for the recipe builder — skips the entire Home recipe
    // baseline / enrichment / applet pipeline that streamHermesRequest runs after
    // every normal chat message.  That pipeline is designed for user-facing workspace
    // creation and can take minutes; the builder only needs the raw Hermes response.

    const profile = await this.ensureProfile(input.profileId);
    await this.ensureRuntimeReady(profile.id);
    const session = this.ensureScopedSession(profile.id, input.sessionId);
    const settings = this.options.database.getSettings();
    const transcriptContent = input.transcriptContent.trim();
    const hermesContent = input.hermesContent.trim();

    this.options.database.associateSessionWithProfile(session.id, profile.id, 'bridge_chat', this.now());
    this.options.database.setActiveProfile(profile.id);
    this.options.database.setActiveSession(profile.id, session.id);

    await onEvent({ type: 'session', session });

    // Persist the user message (with clean transcript content, not the enriched prompt)
    const userMessage = ChatMessageSchema.parse({
      id: `message-${randomUUID()}`,
      sessionId: session.id,
      role: 'user',
      content: transcriptContent,
      createdAt: this.now(),
      requestId: `request-${randomUUID()}`,
      visibility: 'transcript',
      kind: 'conversation'
    });
    const requestId = userMessage.requestId ?? userMessage.id;
    this.options.database.appendMessage(userMessage);
    await onEvent({ type: 'message', message: userMessage });

    try {
      const chatResult = await this.options.hermesCli.streamChat({
        profile,
        runtimeSessionId: session.runtimeSessionId,
        content: hermesContent,
        requestMode: 'chat',
        spaceContext: null,
        refreshContext: null,
        requestId,
        timeoutMs: settings.chatTimeoutMs,
        discoveryTimeoutMs: settings.discoveryTimeoutMs,
        nearbySearchTimeoutMs: settings.nearbySearchTimeoutMs,
        recipeOperationTimeoutMs: settings.recipeOperationTimeoutMs,
        unrestrictedTimeoutMs: settings.unrestrictedTimeoutMs,
        maxTurns: settings.restrictedChatMaxTurns,
        unrestrictedAccessEnabled: settings.unrestrictedAccessEnabled,
        onProgress: async (message) => {
          await onEvent({ type: 'progress', requestId, message });
        },
        onActivity: async (activity) => {
          await onEvent({
            type: 'activity',
            activity: { ...activity, requestId: activity.requestId ?? requestId, timestamp: activity.timestamp ?? this.now() }
          });
        },
        onAssistantSnapshot: async (markdown) => {
          await onEvent({ type: 'assistant_snapshot', requestId, markdown });
        }
      });

      // Update the session with the runtime session ID for future --resume
      const refreshedSession = this.options.database.updateSession({
        id: session.id,
        runtimeSessionId: chatResult.runtimeSessionId ?? session.runtimeSessionId,
        lastUsedProfileId: profile.id
      });

      // Persist the assistant message
      const assistantMessage = this.options.database.appendMessage(
        ChatMessageSchema.parse({
          id: `message-${randomUUID()}`,
          sessionId: session.id,
          role: 'assistant',
          content: chatResult.assistantMarkdown,
          createdAt: this.now(),
          requestId,
          visibility: 'transcript',
          kind: 'conversation'
        })
      );

      await onEvent({
        type: 'complete',
        session: refreshedSession ?? session,
        assistantMessage
      });
    } catch (chatError) {
      const errorMessage = chatError instanceof Error ? chatError.message : 'Hermes builder chat failed.';
      await onEvent({
        type: 'error',
        requestId,
        error: { code: 'BUILDER_CHAT_FAILED', message: errorMessage }
      });
    }
  }

  async streamRecipeAction(recipeId: string, input: ExecuteRecipeActionRequest, onEvent: (event: ChatStreamEvent) => Promise<void> | void) {
    const parsedInput = ExecuteRecipeActionRequestSchema.parse(input);
    const profile = await this.ensureProfile(parsedInput.profileId);
    const session = this.ensureScopedSession(profile.id, parsedInput.sessionId);
    const recipe = this.ensureRecipe(profile.id, recipeId);

    if (recipe.primarySessionId !== parsedInput.sessionId) {
      throw new BridgeError(
        400,
        'RECIPE_ACTION_SESSION_MISMATCH',
        `Recipe ${recipe.id} is attached to session ${recipe.primarySessionId}, not ${parsedInput.sessionId}.`
      );
    }

    if (recipe.dynamic?.recipeTemplate) {
      const context = this.resolveTemplateRecipeActionArtifactContext(recipe, parsedInput.actionId);

      if (context.action.visibility.whenBuildReady && !this.isRecipeActionBuildReady(recipe)) {
        throw new BridgeError(409, 'RECIPE_ACTION_BUILD_NOT_READY', `Action ${context.action.label} is only available after the template recipe is ready.`);
      }

      if (context.action.kind === 'local' || context.action.kind === 'navigation') {
        throw new BridgeError(400, 'RECIPE_ACTION_BROWSER_ONLY', `Action ${context.action.label} must be handled locally in the browser.`);
      }

      if (context.action.kind !== 'bridge') {
        throw new BridgeError(
          400,
          'RECIPE_ACTION_HANDLER_UNSUPPORTED',
          `Template action ${context.action.label} with kind ${context.action.kind} is not executable by the bridge.`
        );
      }

      const selectedItems = this.validateTemplateActionSelection(context.action, parsedInput.selectedItemIds, context.templateState);
      const handler = context.action.bridge?.handler;

      if (handler === 'retry_build') {
        await this.retryRecipeAppletUpgradeFromArtifacts(parsedInput.profileId, parsedInput.sessionId, recipe, context.action.id, onEvent);
        return;
      }

      if (handler === 'refresh_space') {
        await this.streamHermesRequest(
          {
            profileId: parsedInput.profileId,
            sessionId: parsedInput.sessionId,
            recipeId: recipe.id,
            transcriptContent: 'Refresh the attached recipe.',
            hermesContent: RECIPE_REFRESH_USER_MESSAGE,
            intentContent: context.userPrompt.originalPrompt,
            mode: 'recipe_refresh',
            triggerActionId: context.action.id,
            triggerKindOverride: 'refresh'
          },
          onEvent
        );
        return;
      }

      const requestId = `request-${randomUUID()}`;
      let nextTemplateState: RecipeTemplateState | null = null;
      let completionMessage = '';

      switch (handler) {
        case 'save_template_place': {
          const selectedItem = selectedItems[0];
          if (!selectedItem) {
            throw new BridgeError(400, 'RECIPE_ACTION_SELECTION_REQUIRED', `Action ${context.action.label} requires exactly one selected item.`);
          }
          nextTemplateState = this.saveTemplatePlaceSelection(context.templateState, selectedItem);
          completionMessage = `Saved ${selectedItem.title} in the recipe.`;
          break;
        }
        case 'select_event_venue': {
          const selectedItem = selectedItems[0];
          if (!selectedItem) {
            throw new BridgeError(400, 'RECIPE_ACTION_SELECTION_REQUIRED', `Action ${context.action.label} requires exactly one selected item.`);
          }
          nextTemplateState = this.selectEventVenue(context.templateState, selectedItem);
          completionMessage = `Selected ${selectedItem.title} as the event venue.`;
          break;
        }
        case 'add_event_guest': {
          const requestedGuestName =
            typeof parsedInput.formValues.guestName === 'string'
              ? parsedInput.formValues.guestName.trim()
              : typeof parsedInput.formValues.name === 'string'
                ? parsedInput.formValues.name.trim()
                : '';
          const guestName = requestedGuestName || `Guest ${Math.floor(Date.now() / 1000) % 1000}`;
          nextTemplateState = this.addEventGuest(context.templateState, guestName);
          completionMessage = `Added ${guestName} to the guest list.`;
          break;
        }
        case 'toggle_template_checklist': {
          const selectedItem = selectedItems[0];
          if (!selectedItem) {
            throw new BridgeError(400, 'RECIPE_ACTION_SELECTION_REQUIRED', `Action ${context.action.label} requires exactly one selected item.`);
          }
          nextTemplateState = this.toggleTemplateChecklistItem(context.templateState, selectedItem.id);
          completionMessage = `Updated checklist item ${selectedItem.title}.`;
          break;
        }
        case 'append_template_note': {
          const requestedNote =
            typeof parsedInput.formValues.note === 'string'
              ? parsedInput.formValues.note.trim()
              : typeof parsedInput.formValues.content === 'string'
                ? parsedInput.formValues.content.trim()
                : typeof parsedInput.formValues.value === 'string'
                  ? parsedInput.formValues.value.trim()
                  : '';
          const noteLine =
            requestedNote || (selectedItems[0] ? `Follow up on ${selectedItems[0].title}.` : `Recipe note added at ${new Date().toLocaleTimeString()}.`);
          nextTemplateState = this.appendTemplateNoteLine(context.templateState, noteLine);
          completionMessage = 'Added a recipe note.';
          break;
        }
        case 'move_template_card_stage': {
          const selectedItem = selectedItems[0];
          if (!selectedItem) {
            throw new BridgeError(400, 'RECIPE_ACTION_SELECTION_REQUIRED', `Action ${context.action.label} requires exactly one selected item.`);
          }
          const targetStageId =
            typeof parsedInput.formValues.targetStageId === 'string' ? parsedInput.formValues.targetStageId.trim() : null;
          nextTemplateState = this.moveTemplateCardStage(context.templateState, selectedItem.id, targetStageId);
          completionMessage = `Updated stage for ${selectedItem.title}.`;
          break;
        }
        case 'switch_template': {
          const targetTemplateId =
            typeof context.action.bridge?.payload?.targetTemplateId === 'string'
              ? (context.action.bridge.payload.targetTemplateId as RecipeTemplateId)
              : null;
          const selectedItem = selectedItems[0];

          if (!targetTemplateId || !selectedItem) {
            throw new BridgeError(400, 'RECIPE_ACTION_HANDLER_UNSUPPORTED', 'The requested template switch is missing a target template or selection.');
          }

          if (context.templateState.templateId === 'local-discovery-comparison' && targetTemplateId === 'event-planner') {
            const compiled = compileRecipeTemplateState({
              fill: this.buildEventPlannerTemplateFillFromPlace(selectedItem),
              currentState: context.templateState,
              transitionReason: 'Carry the selected place forward into event planning.'
            });
            if (!compiled.state || !compiled.definition || compiled.errors.length > 0) {
              throw new BridgeError(
                409,
                'RECIPE_TEMPLATE_SWITCH_FAILED',
                compiled.errors.join('; ') || `The ${targetTemplateId} template transition could not be completed safely.`
              );
            }

            nextTemplateState = compiled.state;
            completionMessage = `Switched the recipe into ${compiled.definition.name}.`;
            break;
          }

          throw new BridgeError(
            409,
            'RECIPE_TEMPLATE_SWITCH_UNSUPPORTED',
            `Template transition ${context.templateState.templateId} -> ${targetTemplateId} is not supported.`
          );
        }
        case 'generate_interview_prep':
        case 'expand_template_idea':
        case 'generate_campaign_email':
        case 'run_template_followup': {
          if (!context.action.prompt) {
            throw new BridgeError(
              400,
              'RECIPE_ACTION_PROMPT_MISSING',
              `Template action "${context.action.id}" invokes Hermes but has no associated prompt definition. Add a prompt.promptTemplate to the action in the template registry.`
            );
          }
          const transcriptContent = this.buildTemplateActionTranscriptContent(context.action, selectedItems);
          const hermesContent = this.buildPromptBoundTemplateActionContent(recipe, context, parsedInput, selectedItems);
          await this.streamHermesRequest(
            {
              profileId: parsedInput.profileId,
              sessionId: parsedInput.sessionId,
              recipeId: recipe.id,
              transcriptContent,
              hermesContent,
              intentContent: transcriptContent,
              mode: 'recipe_action',
              triggerActionId: context.action.id,
              triggerKindOverride: 'action'
            },
            onEvent
          );
          return;
        }
        default:
          throw new BridgeError(
            400,
            'RECIPE_ACTION_HANDLER_UNSUPPORTED',
            `Bridge action handler ${handler ?? 'unknown'} is not supported for template recipes.`
          );
      }

      if (!nextTemplateState) {
        throw new BridgeError(409, 'RECIPE_TEMPLATE_VALIDATION_FAILED', 'The template action did not produce an updated recipe state.');
      }

      await this.persistTemplateRecipeActionUpdate(recipe, context.buildId, nextTemplateState, onEvent, parsedInput.sessionId, requestId, context.action.label);
      await this.emitTemplateActionComplete(session, requestId, onEvent, completionMessage || `${context.action.label} completed.`);
      return;
    }

    const context = this.resolveRecipeActionArtifactContext(recipe, parsedInput.actionId);
    const selectedItems = this.getSelectedRecipeItems(context.normalizedData, parsedInput.selectedItemIds);
    this.validateRecipeActionSelection(context.action, parsedInput.selectedItemIds, selectedItems);

    if (context.action.visibility.whenBuildReady && !this.isRecipeActionBuildReady(recipe)) {
      throw new BridgeError(409, 'RECIPE_ACTION_BUILD_NOT_READY', `Action ${context.action.label} is only available after the dynamic recipe is ready.`);
    }

    if (context.action.kind === 'local' || context.action.kind === 'navigation') {
      throw new BridgeError(400, 'RECIPE_ACTION_BROWSER_ONLY', `Action ${context.action.label} must be handled locally in the browser.`);
    }

    if (context.action.kind === 'bridge') {
      const handler = context.action.bridge?.handler;
      if (handler === 'retry_build') {
        await this.retryRecipeAppletUpgradeFromArtifacts(parsedInput.profileId, parsedInput.sessionId, recipe, context.action.id, onEvent);
        return;
      }

      if (handler === 'refresh_space') {
        await this.streamHermesRequest(
          {
            profileId: parsedInput.profileId,
            sessionId: parsedInput.sessionId,
            recipeId: recipe.id,
            transcriptContent: 'Refresh the attached recipe.',
            hermesContent: RECIPE_REFRESH_USER_MESSAGE,
            intentContent: context.userPrompt.originalPrompt,
            mode: 'recipe_refresh',
            triggerActionId: context.action.id,
            triggerKindOverride: 'refresh'
          },
          onEvent
        );
        return;
      }

      if (handler === 'applet_capability') {
        throw new BridgeError(
          409,
          'RECIPE_EXPERIMENTAL_APPLET_RUNTIME_DISABLED',
          'Runtime TSX recipe applets are disabled in production. Retry or refresh uses the DSL-only enrichment path.'
        );
      }

      throw new BridgeError(400, 'RECIPE_ACTION_HANDLER_UNSUPPORTED', `Bridge action handler ${handler ?? 'unknown'} is not supported for dynamic spaces.`);
    }

    const transcriptContent = this.buildRecipeActionTranscriptContent(context.action, selectedItems);
    const hermesContent = this.buildPromptBoundRecipeActionContent(recipe, context, parsedInput, selectedItems);

    await this.streamHermesRequest(
      {
        profileId: parsedInput.profileId,
        sessionId: parsedInput.sessionId,
        recipeId: recipe.id,
        transcriptContent,
        hermesContent,
        intentContent: context.action.prompt?.promptTemplate ?? transcriptContent,
        mode: 'recipe_action',
        triggerActionId: context.action.id,
        triggerKindOverride: 'action'
      },
      onEvent
    );
  }
}
