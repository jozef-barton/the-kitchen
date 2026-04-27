import { z } from 'zod';
import { AuditEventSchema, AccessAuditSummarySchema, AppSettingsSchema, ChatActivitySchema, ChatMessageSchema, ConnectionStateSchema, JobsFreshnessSchema, JobSchema, ProfileSchema, RuntimeActivityHistoryEntrySchema, RuntimeModelConfigSchema, RuntimeReadinessSchema, RuntimeRequestSchema, RuntimeProviderOptionSchema, SessionDeletionModeSchema, SessionFilterSummarySchema, SessionSchema, RecipeContentFormatSchema, RecipeBuildSchema, RecipeEventSchema, RecipeMetadataSchema, RecipeSchema, RecipeStatusSchema, RecipeTabSchema, RecipeUiStateSchema, SkillSchema, TelemetryEventSchema, ThemeModeSchema, ToolExecutionSchema, ToolSchema, ToolsTabSchema, UiStateSchema, FileRefSchema, UploadedFileSchema } from './schemas';
import { RecipeTemplateStateSchema } from './recipe-template-schemas';
export const ApiErrorSchema = z.object({
    code: z.string().min(1),
    message: z.string().min(1)
});
export const SettingsResponseSchema = z.object({
    settings: AppSettingsSchema,
    accessAudit: AccessAuditSummarySchema
});
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
export const SessionsResponseSchema = z.object({
    profileId: z.string().min(1),
    items: z.array(SessionSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    hiddenSyntheticCount: z.number().int().nonnegative().default(0),
    search: z.string()
});
export const SessionMessagesResponseSchema = z.object({
    profileId: z.string().min(1),
    session: SessionSchema,
    messages: z.array(ChatMessageSchema),
    runtimeRequests: z.array(RuntimeRequestSchema).default([]),
    attachedRecipe: RecipeSchema.nullable().default(null),
    recipeEvents: z.array(RecipeEventSchema).default([])
});
export const JobsResponseSchema = z.object({
    connection: ConnectionStateSchema,
    freshness: JobsFreshnessSchema,
    items: z.array(JobSchema)
});
export const ToolsResponseSchema = z.object({
    connection: ConnectionStateSchema,
    items: z.array(ToolSchema)
});
export const ToolHistoryResponseSchema = z.object({
    items: z.array(ToolExecutionSchema),
    runtimeItems: z.array(RuntimeActivityHistoryEntrySchema).default([]),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    runtimeTotal: z.number().int().nonnegative().default(0)
});
export const SkillsResponseSchema = z.object({
    connection: ConnectionStateSchema,
    profileId: z.string().min(1),
    items: z.array(SkillSchema)
});
export const ModelProviderResponseSchema = z.object({
    connection: ConnectionStateSchema,
    config: RuntimeModelConfigSchema,
    providers: z.array(RuntimeProviderOptionSchema),
    runtimeReadiness: RuntimeReadinessSchema,
    inspectedProviderId: z.string().min(1).nullable().default(null),
    discoveredAt: z.string().datetime().nullable().default(null)
});
export const RecipesResponseSchema = z.object({
    profileId: z.string().min(1),
    items: z.array(RecipeSchema),
    events: z.array(RecipeEventSchema).default([])
});
export const RecipeResponseSchema = z.object({
    profileId: z.string().min(1),
    recipe: RecipeSchema,
    events: z.array(RecipeEventSchema).default([])
});
export const CreateSessionRequestSchema = z.object({
    profileId: z.string().min(1)
});
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
export const SelectProfileRequestSchema = z.object({
    profileId: z.string().min(1)
});
export const CreateProfileRequestSchema = z.object({
    name: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/i, 'Name must be alphanumeric with hyphens/underscores only')
});
export const DeleteProfileRequestSchema = z.object({
    profileId: z.string().min(1)
});
export const ProfileMetricsSchema = z.object({
    profileId: z.string().min(1),
    sessionCount: z.number().int().nonnegative(),
    messageCount: z.number().int().nonnegative(),
    recipeCount: z.number().int().nonnegative()
});
export const ProfilesMetricsResponseSchema = z.object({
    metrics: z.array(ProfileMetricsSchema)
});
export const ProfilesResponseSchema = z.object({
    profiles: z.array(ProfileSchema),
    activeProfileId: z.string().min(1).nullable()
});
export const TestModelConfigRequestSchema = z.object({
    profileId: z.string().min(1),
    defaultModel: z.string().min(1),
    provider: z.string().min(1).optional()
});
export const TestModelConfigResponseSchema = z.object({
    ok: z.boolean(),
    message: z.string(),
    model: z.string(),
    latencyMs: z.number().int().nonnegative()
});
export const SelectSessionRequestSchema = z.object({
    profileId: z.string().min(1),
    sessionId: z.string().min(1)
});
export const RenameSessionRequestSchema = z.object({
    profileId: z.string().min(1),
    title: z.string().min(1).max(120)
});
export const DeleteSessionRequestSchema = z.object({
    profileId: z.string().min(1)
});
export const SessionDeletionResponseSchema = z.object({
    sessionId: z.string().min(1),
    mode: SessionDeletionModeSchema,
    deletedAt: z.string().datetime()
});
export const DeleteSkillRequestSchema = z.object({
    profileId: z.string().min(1)
});
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
    .refine((value) => value.title !== undefined ||
    value.description !== undefined ||
    value.contentFormat !== undefined ||
    value.status !== undefined ||
    value.contentData !== undefined ||
    value.tabs !== undefined ||
    value.uiState !== undefined ||
    value.lastUpdatedBy !== undefined ||
    value.metadata !== undefined, 'At least one space field must be provided.');
export const DeleteRecipeRequestSchema = z.object({
    profileId: z.string().min(1)
});
export const ApplyRecipeEntryActionRequestSchema = z
    .object({
    profileId: z.string().min(1),
    action: z.enum(['remove', 'delete_source']),
    entryIds: z.array(z.string().min(1)).min(1)
})
    .strict();
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
export const RecipeDeletionResponseSchema = z.object({
    profileId: z.string().min(1),
    recipeId: z.string().min(1),
    deletedAt: z.string().datetime()
});
export const RecipeEntryActionResponseSchema = z.object({
    profileId: z.string().min(1),
    action: ApplyRecipeEntryActionRequestSchema.shape.action,
    removedEntryIds: z.array(z.string().min(1)).default([]),
    deletedSourceEntryIds: z.array(z.string().min(1)).default([]),
    recipe: RecipeSchema,
    events: z.array(RecipeEventSchema).default([])
});
export const OpenRecipeChatRequestSchema = z.object({
    profileId: z.string().min(1)
});
export const OpenRecipeChatResponseSchema = z.object({
    profileId: z.string().min(1),
    recipe: RecipeSchema,
    session: SessionSchema
});
export const SkillDeletionResponseSchema = z.object({
    profileId: z.string().min(1),
    skillId: z.string().min(1),
    skillName: z.string().min(1),
    deletedAt: z.string().datetime()
});
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
export const SkillSearchRequestSchema = z.object({
    profileId: z.string().min(1),
    query: z.string(),
    safeOnly: z.boolean().default(true),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(50).default(12)
});
export const SkillInstallRequestSchema = z.object({
    profileId: z.string().min(1),
    identifier: z.string().min(1)
});
export const SkillInstallResponseSchema = z.object({
    profileId: z.string().min(1),
    identifier: z.string().min(1),
    skillName: z.string().min(1),
    installedAt: z.string().datetime()
});
export const UpdateSettingsRequestSchema = AppSettingsSchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one setting must be provided.');
export const UpdateUiStateRequestSchema = UiStateSchema.partial()
    .extend({
    currentPage: UiStateSchema.shape.currentPage.optional(),
    toolsTab: ToolsTabSchema.optional(),
    sidebarCollapsed: UiStateSchema.shape.sidebarCollapsed.optional()
})
    .refine((value) => Object.keys(value).length > 0, 'At least one UI state field must be provided.');
export const ChatRequestModeSchema = z.enum(['chat', 'recipe_refresh', 'recipe_action']);
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
export const UploadFileResponseSchema = z.object({
    file: UploadedFileSchema
});
export const GetUploadedFileResponseSchema = z.object({
    file: UploadedFileSchema
});
export const ToolExecutionPrepareRequestSchema = z.object({
    toolId: z.string().min(1),
    profileId: z.string().min(1).nullable().default(null),
    sessionId: z.string().min(1).nullable().default(null),
    summary: z.string().min(1),
    command: z.string().min(1),
    args: z.array(z.string()).max(24).default([]),
    cwd: z.string().min(1).nullable().default(null)
});
export const ToolExecutionResolveRequestSchema = z.object({
    decision: z.enum(['approve', 'reject'])
});
export const RecipeBuildProgressEventSchema = z
    .object({
    recipeId: z.string().min(1),
    build: RecipeBuildSchema,
    recipe: RecipeSchema.nullable().default(null),
    partialTemplateState: RecipeTemplateStateSchema.nullable().default(null)
})
    .strict();
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
    .refine((value) => value.defaultModel !== undefined ||
    value.provider !== undefined ||
    value.baseUrl !== undefined ||
    value.apiMode !== undefined ||
    value.maxTurns !== undefined ||
    value.reasoningEffort !== undefined, 'At least one runtime model field must be provided.');
export const ConnectProviderRequestSchema = z.object({
    profileId: z.string().min(1),
    provider: z.string().min(1),
    apiKey: z.string().min(1),
    label: z.string().min(1).optional(),
    baseUrl: z.string().min(1).optional(),
    apiMode: z.string().min(1).optional()
});
export const BeginProviderAuthRequestSchema = z
    .object({
    profileId: z.string().min(1),
    provider: z.string().min(1)
})
    .strict();
export const PollProviderAuthRequestSchema = z
    .object({
    profileId: z.string().min(1),
    provider: z.string().min(1),
    authSessionId: z.string().min(1).optional()
})
    .strict();
const ChatStreamProgressEventSchema = z.object({
    type: z.literal('progress'),
    requestId: z.string().min(1).nullable().default(null),
    message: z.string().min(1)
});
const ChatStreamActivityEventSchema = z.object({
    type: z.literal('activity'),
    activity: ChatActivitySchema
});
const ChatStreamAssistantSnapshotEventSchema = z.object({
    type: z.literal('assistant_snapshot'),
    requestId: z.string().min(1).nullable().default(null),
    markdown: z.string()
});
const ChatStreamSessionEventSchema = z.object({
    type: z.literal('session'),
    session: SessionSchema
});
const ChatStreamMessageEventSchema = z.object({
    type: z.literal('message'),
    message: ChatMessageSchema
});
const ChatStreamCompleteEventSchema = z.object({
    type: z.literal('complete'),
    session: SessionSchema,
    assistantMessage: ChatMessageSchema
});
const ChatStreamRecipeEventSchema = z.object({
    type: z.literal('recipe_event'),
    event: RecipeEventSchema,
    recipe: RecipeSchema.nullable().default(null)
});
const ChatStreamRecipeBuildProgressEventSchema = z.object({
    type: z.literal('recipe_build_progress'),
    recipeId: z.string().min(1),
    build: RecipeBuildSchema,
    recipe: RecipeSchema.nullable().default(null),
    partialTemplateState: RecipeTemplateStateSchema.nullable().default(null)
});
const ChatStreamErrorEventSchema = z.object({
    type: z.literal('error'),
    requestId: z.string().min(1).nullable().default(null),
    error: ApiErrorSchema
});
export const ChatStreamEventSchema = z.discriminatedUnion('type', [
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
export const ThemeModePayloadSchema = z.object({
    themeMode: ThemeModeSchema
});
export const TelemetryResponseSchema = z.object({
    items: z.array(TelemetryEventSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative()
});
export const AuditEventsResponseSchema = z.object({
    items: z.array(AuditEventSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative()
});
export const ResolveImagesRequestSchema = z.object({
    queries: z.array(z.string().min(1)).min(1).max(32)
});
export const ResolveImagesResponseSchema = z.object({
    results: z.array(z.object({
        query: z.string(),
        url: z.string().nullable(),
        error: z.string().nullable()
    }))
});
