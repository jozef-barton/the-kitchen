import { z } from 'zod';
import {
  AuditEventSchema,
  AccessAuditSummarySchema,
  AppSettingsSchema,
  ChatActivitySchema,
  ChatMessageSchema,
  ConnectionStateSchema,
  JobsFreshnessSchema,
  JobSchema,
  ProfileSchema,
  RuntimeActivityHistoryEntrySchema,
  RuntimeModelConfigSchema,
  RuntimeReadinessSchema,
  RuntimeRequestSchema,
  RuntimeProviderOptionSchema,
  SessionDeletionModeSchema,
  SessionFilterSummarySchema,
  SessionSchema,
  RecipeContentFormatSchema,
  RecipeBuildSchema,
  RecipeEventSchema,
  RecipeMetadataSchema,
  RecipeSchema,
  RecipeStatusSchema,
  RecipeTabSchema,
  RecipeUiStateSchema,
  SkillSchema,
  TelemetryEventSchema,
  ThemeModeSchema,
  ToolExecutionSchema,
  ToolSchema,
  ToolsTabSchema,
  UiStateSchema,
  FileRefSchema,
  UploadedFileSchema
} from './schemas';
import { RecipeTemplateStateSchema } from './recipe-template-schemas';

export const ApiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1)
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const SettingsResponseSchema = z.object({
  settings: AppSettingsSchema,
  accessAudit: AccessAuditSummarySchema
});
export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;

export const BootstrapResponseSchema = z.object({
  connection: ConnectionStateSchema,
  profiles: z.array(ProfileSchema),
  activeProfileId: z.string().min(1).nullable(),
  activeSessionId: z.string().min(1).nullable(),
  recentSessions: z.array(SessionSchema),
  sessionSummary: SessionFilterSummarySchema.nullable().default(null),
  settings: AppSettingsSchema,
  uiState: UiStateSchema,
  hermesVersion: z.string().nullable().default(null),
  expectedHermesVersion: z.string().nullable().default(null)
});
export type BootstrapResponse = z.infer<typeof BootstrapResponseSchema>;

export const SessionsResponseSchema = z.object({
  profileId: z.string().min(1),
  items: z.array(SessionSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hiddenSyntheticCount: z.number().int().nonnegative().default(0),
  search: z.string()
});
export type SessionsResponse = z.infer<typeof SessionsResponseSchema>;

export const SessionMessagesResponseSchema = z.object({
  profileId: z.string().min(1),
  session: SessionSchema,
  messages: z.array(ChatMessageSchema),
  runtimeRequests: z.array(RuntimeRequestSchema).default([]),
  attachedRecipe: RecipeSchema.nullable().default(null),
  recipeEvents: z.array(RecipeEventSchema).default([])
});
export type SessionMessagesResponse = z.infer<typeof SessionMessagesResponseSchema>;

export const JobsResponseSchema = z.object({
  connection: ConnectionStateSchema,
  freshness: JobsFreshnessSchema,
  items: z.array(JobSchema)
});
export type JobsResponse = z.infer<typeof JobsResponseSchema>;

export const ToolsResponseSchema = z.object({
  connection: ConnectionStateSchema,
  items: z.array(ToolSchema)
});
export type ToolsResponse = z.infer<typeof ToolsResponseSchema>;

export const ToolHistoryResponseSchema = z.object({
  items: z.array(ToolExecutionSchema),
  runtimeItems: z.array(RuntimeActivityHistoryEntrySchema).default([]),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  runtimeTotal: z.number().int().nonnegative().default(0)
});
export type ToolHistoryResponse = z.infer<typeof ToolHistoryResponseSchema>;

export const SkillsResponseSchema = z.object({
  connection: ConnectionStateSchema,
  profileId: z.string().min(1),
  items: z.array(SkillSchema)
});
export type SkillsResponse = z.infer<typeof SkillsResponseSchema>;

export const ModelProviderResponseSchema = z.object({
  connection: ConnectionStateSchema,
  config: RuntimeModelConfigSchema,
  providers: z.array(RuntimeProviderOptionSchema),
  runtimeReadiness: RuntimeReadinessSchema,
  inspectedProviderId: z.string().min(1).nullable().default(null),
  discoveredAt: z.string().datetime().nullable().default(null)
});
export type ModelProviderResponse = z.infer<typeof ModelProviderResponseSchema>;

export const RecipesResponseSchema = z.object({
  profileId: z.string().min(1),
  items: z.array(RecipeSchema),
  events: z.array(RecipeEventSchema).default([])
});
export type RecipesResponse = z.infer<typeof RecipesResponseSchema>;

export const RecipeResponseSchema = z.object({
  profileId: z.string().min(1),
  recipe: RecipeSchema,
  events: z.array(RecipeEventSchema).default([])
});
export type RecipeResponse = z.infer<typeof RecipeResponseSchema>;

export const CreateSessionRequestSchema = z.object({
  profileId: z.string().min(1)
});
export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;

export const CreateRecipeRequestSchema = z.object({
  profileId: z.string().min(1),
  sessionId: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  contentFormat: RecipeContentFormatSchema.default('markdown'),
  contentData: z.record(z.string().min(1), z.unknown()).optional(),
  tabs: z.array(RecipeTabSchema).optional(),
  uiState: RecipeUiStateSchema.partial().optional(),
  status: RecipeStatusSchema.optional(),
  metadata: RecipeMetadataSchema.partial().optional()
}).strict();
export type CreateRecipeRequest = z.infer<typeof CreateRecipeRequestSchema>;

export const SelectProfileRequestSchema = z.object({
  profileId: z.string().min(1)
});
export type SelectProfileRequest = z.infer<typeof SelectProfileRequestSchema>;

export const CreateProfileRequestSchema = z.object({
  name: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/i, 'Name must be alphanumeric with hyphens/underscores only')
});
export type CreateProfileRequest = z.infer<typeof CreateProfileRequestSchema>;

export const DeleteProfileRequestSchema = z.object({
  profileId: z.string().min(1)
});
export type DeleteProfileRequest = z.infer<typeof DeleteProfileRequestSchema>;

export const ProfileMetricsSchema = z.object({
  profileId: z.string().min(1),
  sessionCount: z.number().int().nonnegative(),
  messageCount: z.number().int().nonnegative(),
  recipeCount: z.number().int().nonnegative()
});
export type ProfileMetrics = z.infer<typeof ProfileMetricsSchema>;

export const ProfilesMetricsResponseSchema = z.object({
  metrics: z.array(ProfileMetricsSchema)
});
export type ProfilesMetricsResponse = z.infer<typeof ProfilesMetricsResponseSchema>;

export const ProfilesResponseSchema = z.object({
  profiles: z.array(ProfileSchema),
  activeProfileId: z.string().min(1).nullable()
});
export type ProfilesResponse = z.infer<typeof ProfilesResponseSchema>;

export const TestModelConfigRequestSchema = z.object({
  profileId: z.string().min(1),
  defaultModel: z.string().min(1),
  provider: z.string().min(1).optional()
});
export type TestModelConfigRequest = z.infer<typeof TestModelConfigRequestSchema>;

export const TestModelConfigResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  model: z.string(),
  latencyMs: z.number().int().nonnegative()
});
export type TestModelConfigResponse = z.infer<typeof TestModelConfigResponseSchema>;

export const SelectSessionRequestSchema = z.object({
  profileId: z.string().min(1),
  sessionId: z.string().min(1)
});
export type SelectSessionRequest = z.infer<typeof SelectSessionRequestSchema>;

export const RenameSessionRequestSchema = z.object({
  profileId: z.string().min(1),
  title: z.string().min(1).max(120)
});
export type RenameSessionRequest = z.infer<typeof RenameSessionRequestSchema>;

export const DeleteSessionRequestSchema = z.object({
  profileId: z.string().min(1)
});
export type DeleteSessionRequest = z.infer<typeof DeleteSessionRequestSchema>;

export const SessionDeletionResponseSchema = z.object({
  sessionId: z.string().min(1),
  mode: SessionDeletionModeSchema,
  deletedAt: z.string().datetime()
});
export type SessionDeletionResponse = z.infer<typeof SessionDeletionResponseSchema>;

export const DeleteSkillRequestSchema = z.object({
  profileId: z.string().min(1)
});
export type DeleteSkillRequest = z.infer<typeof DeleteSkillRequestSchema>;

export const UpdateRecipeRequestSchema = z
  .object({
    profileId: z.string().min(1),
    title: z.string().min(1).max(120).optional(),
    description: z.string().max(500).optional(),
    contentFormat: RecipeContentFormatSchema.optional(),
    status: RecipeStatusSchema.optional(),
    contentData: z.record(z.string().min(1), z.unknown()).optional(),
    tabs: z.array(RecipeTabSchema).optional(),
    uiState: RecipeUiStateSchema.partial().optional(),
    lastUpdatedBy: z.string().min(1).optional(),
    metadata: RecipeMetadataSchema.partial().optional()
  })
  .strict()
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.contentFormat !== undefined ||
      value.status !== undefined ||
      value.contentData !== undefined ||
      value.tabs !== undefined ||
      value.uiState !== undefined ||
      value.lastUpdatedBy !== undefined ||
      value.metadata !== undefined,
    'At least one space field must be provided.'
  );
export type UpdateRecipeRequest = z.infer<typeof UpdateRecipeRequestSchema>;

export const DeleteRecipeRequestSchema = z.object({
  profileId: z.string().min(1)
});
export type DeleteRecipeRequest = z.infer<typeof DeleteRecipeRequestSchema>;

export const ApplyRecipeEntryActionRequestSchema = z
  .object({
    profileId: z.string().min(1),
    action: z.enum(['remove', 'delete_source']),
    entryIds: z.array(z.string().min(1)).min(1)
  })
  .strict();
export type ApplyRecipeEntryActionRequest = z.infer<typeof ApplyRecipeEntryActionRequestSchema>;

export const ExecuteRecipeActionRequestSchema = z
  .object({
    profileId: z.string().min(1),
    sessionId: z.string().min(1),
    actionId: z.string().min(1),
    selectedItemIds: z.array(z.string().min(1)).default([]),
    formValues: z.record(z.string().min(1), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
    pageState: z.record(z.string().min(1), z.number().int().positive()).default({}),
    filterState: z.record(z.string().min(1), z.string()).default({})
  })
  .strict();
export type ExecuteRecipeActionRequest = z.infer<typeof ExecuteRecipeActionRequestSchema>;

export const RecipeDeletionResponseSchema = z.object({
  profileId: z.string().min(1),
  recipeId: z.string().min(1),
  deletedAt: z.string().datetime()
});
export type RecipeDeletionResponse = z.infer<typeof RecipeDeletionResponseSchema>;

export const RecipeEntryActionResponseSchema = z.object({
  profileId: z.string().min(1),
  action: ApplyRecipeEntryActionRequestSchema.shape.action,
  removedEntryIds: z.array(z.string().min(1)).default([]),
  deletedSourceEntryIds: z.array(z.string().min(1)).default([]),
  recipe: RecipeSchema,
  events: z.array(RecipeEventSchema).default([])
});
export type RecipeEntryActionResponse = z.infer<typeof RecipeEntryActionResponseSchema>;

export const OpenRecipeChatRequestSchema = z.object({
  profileId: z.string().min(1)
});
export type OpenRecipeChatRequest = z.infer<typeof OpenRecipeChatRequestSchema>;

export const OpenRecipeChatResponseSchema = z.object({
  profileId: z.string().min(1),
  recipe: RecipeSchema,
  session: SessionSchema
});
export type OpenRecipeChatResponse = z.infer<typeof OpenRecipeChatResponseSchema>;

export const SkillDeletionResponseSchema = z.object({
  profileId: z.string().min(1),
  skillId: z.string().min(1),
  skillName: z.string().min(1),
  deletedAt: z.string().datetime()
});
export type SkillDeletionResponse = z.infer<typeof SkillDeletionResponseSchema>;

export const SkillSearchResultSchema = z.object({
  name: z.string().min(1),
  identifier: z.string().min(1),
  description: z.string().default(''),
  source: z.string().min(1),
  trust: z.string().min(1),
  category: z.string().default(''),
  isInstalled: z.boolean().default(false),
  isBuiltIn: z.boolean().default(false),
  isOfficial: z.boolean().default(false),
  isCommunity: z.boolean().default(false)
});
export type SkillSearchResult = z.infer<typeof SkillSearchResultSchema>;

export const SkillSearchResponseSchema = z.object({
  profileId: z.string().min(1),
  query: z.string(),
  safeOnly: z.boolean(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  results: z.array(SkillSearchResultSchema),
  generatedAt: z.string().datetime()
});
export type SkillSearchResponse = z.infer<typeof SkillSearchResponseSchema>;

export const SkillSearchRequestSchema = z.object({
  profileId: z.string().min(1),
  query: z.string(),
  safeOnly: z.boolean().default(true),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(12)
});
export type SkillSearchRequest = z.infer<typeof SkillSearchRequestSchema>;

export const SkillInstallRequestSchema = z.object({
  profileId: z.string().min(1),
  identifier: z.string().min(1)
});
export type SkillInstallRequest = z.infer<typeof SkillInstallRequestSchema>;

export const SkillInstallResponseSchema = z.object({
  profileId: z.string().min(1),
  identifier: z.string().min(1),
  skillName: z.string().min(1),
  installedAt: z.string().datetime()
});
export type SkillInstallResponse = z.infer<typeof SkillInstallResponseSchema>;

export const UpdateSettingsRequestSchema = AppSettingsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one setting must be provided.'
);
export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsRequestSchema>;

export const UpdateUiStateRequestSchema = UiStateSchema.partial()
  .extend({
    currentPage: UiStateSchema.shape.currentPage.optional(),
    toolsTab: ToolsTabSchema.optional(),
    sidebarCollapsed: UiStateSchema.shape.sidebarCollapsed.optional()
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one UI state field must be provided.');
export type UpdateUiStateRequest = z.infer<typeof UpdateUiStateRequestSchema>;

export const ChatRequestModeSchema = z.enum(['chat', 'recipe_refresh', 'recipe_action']);
export type ChatRequestMode = z.infer<typeof ChatRequestModeSchema>;

export const RECIPE_REFRESH_USER_MESSAGE = 'Refresh this attached space with updated results.';

export const ChatStreamRequestSchema = z.object({
  profileId: z.string().min(1),
  sessionId: z.string().min(1),
  recipeId: z.string().min(1).optional(),
  content: z.string().min(1).max(20_000),
  intentContent: z.string().min(1).max(500).optional(),
  mode: ChatRequestModeSchema.default('chat'),
  attachments: z.array(FileRefSchema).optional()
});
export type ChatStreamRequest = z.infer<typeof ChatStreamRequestSchema>;

export const UploadFileResponseSchema = z.object({
  file: UploadedFileSchema
});
export type UploadFileResponse = z.infer<typeof UploadFileResponseSchema>;

export const GetUploadedFileResponseSchema = z.object({
  file: UploadedFileSchema
});
export type GetUploadedFileResponse = z.infer<typeof GetUploadedFileResponseSchema>;

export const ToolExecutionPrepareRequestSchema = z.object({
  toolId: z.string().min(1),
  profileId: z.string().min(1).nullable().default(null),
  sessionId: z.string().min(1).nullable().default(null),
  summary: z.string().min(1),
  command: z.string().min(1),
  args: z.array(z.string()).max(24).default([]),
  cwd: z.string().min(1).nullable().default(null)
});
export type ToolExecutionPrepareRequest = z.infer<typeof ToolExecutionPrepareRequestSchema>;

export const ToolExecutionResolveRequestSchema = z.object({
  decision: z.enum(['approve', 'reject'])
});
export type ToolExecutionResolveRequest = z.infer<typeof ToolExecutionResolveRequestSchema>;

export const RecipeBuildProgressEventSchema = z
  .object({
    recipeId: z.string().min(1),
    build: RecipeBuildSchema,
    recipe: RecipeSchema.nullable().default(null),
    partialTemplateState: RecipeTemplateStateSchema.nullable().default(null)
  })
  .strict();
export type RecipeBuildProgressEvent = z.infer<typeof RecipeBuildProgressEventSchema>;

export const UpdateRuntimeModelConfigRequestSchema = z
  .object({
    profileId: z.string().min(1),
    defaultModel: z.string().min(1).optional(),
    provider: z.string().min(1).optional(),
    baseUrl: z.string().min(1).optional(),
    apiMode: z.string().min(1).optional(),
    maxTurns: z.number().int().positive().max(500).optional(),
    reasoningEffort: z.string().min(1).optional()
  })
  .refine(
    (value) =>
      value.defaultModel !== undefined ||
      value.provider !== undefined ||
      value.baseUrl !== undefined ||
      value.apiMode !== undefined ||
      value.maxTurns !== undefined ||
      value.reasoningEffort !== undefined,
    'At least one runtime model field must be provided.'
  );
export type UpdateRuntimeModelConfigRequest = z.infer<typeof UpdateRuntimeModelConfigRequestSchema>;

export const ConnectProviderRequestSchema = z.object({
  profileId: z.string().min(1),
  provider: z.string().min(1),
  apiKey: z.string().min(1),
  label: z.string().min(1).optional(),
  baseUrl: z.string().min(1).optional(),
  apiMode: z.string().min(1).optional()
});
export type ConnectProviderRequest = z.infer<typeof ConnectProviderRequestSchema>;

export const BeginProviderAuthRequestSchema = z
  .object({
    profileId: z.string().min(1),
    provider: z.string().min(1)
  })
  .strict();
export type BeginProviderAuthRequest = z.infer<typeof BeginProviderAuthRequestSchema>;

export const PollProviderAuthRequestSchema = z
  .object({
    profileId: z.string().min(1),
    provider: z.string().min(1),
    authSessionId: z.string().min(1).optional()
  })
  .strict();
export type PollProviderAuthRequest = z.infer<typeof PollProviderAuthRequestSchema>;

const ChatStreamProgressEventSchema = z.object({
  type: z.literal('progress'),
  requestId: z.string().min(1).nullable().default(null),
  message: z.string().min(1)
});
type ChatStreamProgressEvent = z.infer<typeof ChatStreamProgressEventSchema>;

const ChatStreamActivityEventSchema = z.object({
  type: z.literal('activity'),
  activity: ChatActivitySchema
});
type ChatStreamActivityEvent = z.infer<typeof ChatStreamActivityEventSchema>;

const ChatStreamAssistantSnapshotEventSchema = z.object({
  type: z.literal('assistant_snapshot'),
  requestId: z.string().min(1).nullable().default(null),
  markdown: z.string()
});
type ChatStreamAssistantSnapshotEvent = z.infer<typeof ChatStreamAssistantSnapshotEventSchema>;

const ChatStreamSessionEventSchema = z.object({
  type: z.literal('session'),
  session: SessionSchema
});
type ChatStreamSessionEvent = z.infer<typeof ChatStreamSessionEventSchema>;

const ChatStreamMessageEventSchema = z.object({
  type: z.literal('message'),
  message: ChatMessageSchema
});
type ChatStreamMessageEvent = z.infer<typeof ChatStreamMessageEventSchema>;

const ChatStreamCompleteEventSchema = z.object({
  type: z.literal('complete'),
  session: SessionSchema,
  assistantMessage: ChatMessageSchema
});
type ChatStreamCompleteEvent = z.infer<typeof ChatStreamCompleteEventSchema>;

const ChatStreamRecipeEventSchema = z.object({
  type: z.literal('recipe_event'),
  event: RecipeEventSchema,
  recipe: RecipeSchema.nullable().default(null)
});
type ChatStreamRecipeEvent = z.infer<typeof ChatStreamRecipeEventSchema>;

const ChatStreamRecipeBuildProgressEventSchema = z.object({
  type: z.literal('recipe_build_progress'),
  recipeId: z.string().min(1),
  build: RecipeBuildSchema,
  recipe: RecipeSchema.nullable().default(null),
  partialTemplateState: RecipeTemplateStateSchema.nullable().default(null)
});
type ChatStreamRecipeBuildProgressEvent = z.infer<typeof ChatStreamRecipeBuildProgressEventSchema>;

const ChatStreamErrorEventSchema = z.object({
  type: z.literal('error'),
  requestId: z.string().min(1).nullable().default(null),
  error: ApiErrorSchema
});
type ChatStreamErrorEvent = z.infer<typeof ChatStreamErrorEventSchema>;

export type ChatStreamEvent =
  | ChatStreamProgressEvent
  | ChatStreamActivityEvent
  | ChatStreamAssistantSnapshotEvent
  | ChatStreamSessionEvent
  | ChatStreamMessageEvent
  | ChatStreamCompleteEvent
  | ChatStreamRecipeEvent
  | ChatStreamRecipeBuildProgressEvent
  | ChatStreamErrorEvent;

export const ChatStreamEventSchema: z.ZodType<ChatStreamEvent, z.ZodTypeDef, unknown> = z.discriminatedUnion('type', [
  ChatStreamProgressEventSchema,
  ChatStreamActivityEventSchema,
  ChatStreamAssistantSnapshotEventSchema,
  ChatStreamSessionEventSchema,
  ChatStreamMessageEventSchema,
  ChatStreamCompleteEventSchema,
  ChatStreamRecipeEventSchema,
  ChatStreamRecipeBuildProgressEventSchema,
  ChatStreamErrorEventSchema
]);

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  checkedAt: z.string().datetime()
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ThemeModePayloadSchema = z.object({
  themeMode: ThemeModeSchema
});

export const TelemetryResponseSchema = z.object({
  items: z.array(TelemetryEventSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative()
});
export type TelemetryResponse = z.infer<typeof TelemetryResponseSchema>;

export const AuditEventsResponseSchema = z.object({
  items: z.array(AuditEventSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative()
});
export type AuditEventsResponse = z.infer<typeof AuditEventsResponseSchema>;

export const ResolveImagesRequestSchema = z.object({
  queries: z.array(z.string().min(1)).min(1).max(32)
});
export type ResolveImagesRequest = z.infer<typeof ResolveImagesRequestSchema>;

export const ResolveImagesResponseSchema = z.object({
  results: z.array(
    z.object({
      query: z.string(),
      url: z.string().nullable(),
      error: z.string().nullable()
    })
  )
});
export type ResolveImagesResponse = z.infer<typeof ResolveImagesResponseSchema>;
