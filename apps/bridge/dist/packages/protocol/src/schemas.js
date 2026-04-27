import { z } from 'zod';
import { RecipeTemplateIdSchema, RecipeTemplateStateSchema } from './recipe-template-schemas';
import { RecipeTemplateActionsSchema, RecipeTemplateFillSchema, RecipeTemplateHydrationSchema, RecipeTemplateSelectionSchema, RecipeTemplateTextSchema, RecipeTemplateUpdateSchema } from './recipe-template-authoring-schemas';
const OptionalStringSchema = z.preprocess((value) => (value === null ? undefined : value), z.string().optional());
const OptionalTextSchema = z.preprocess((value) => (value === null ? undefined : value), z.string().min(1).optional());
const OptionalDateTimeSchema = z.preprocess((value) => (value === null ? undefined : value), z.string().datetime().optional());
export const ThemeModeSchema = z.enum(['dark', 'light']);
export const AppPageSchema = z.enum(['chat', 'recipes', 'sessions', 'jobs', 'tools', 'skills', 'settings']);
export const ToolsTabSchema = z.enum(['all', 'history']);
export const SpacesTabSchema = z.enum(['recipes', 'history']);
export const SessionAssociationSourceSchema = z.enum([
    'hermes_profile_scope',
    'bridge_created',
    'bridge_chat',
    'legacy_import',
    'manual'
]);
export const ConnectionStateSchema = z.object({
    status: z.enum(['connected', 'degraded', 'disconnected', 'error']),
    detail: OptionalStringSchema,
    checkedAt: z.string().datetime(),
    usingCachedData: z.boolean().default(false)
});
export const ProfileSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    path: OptionalTextSchema,
    model: OptionalTextSchema,
    gateway: OptionalTextSchema,
    alias: OptionalTextSchema,
    isActive: z.boolean().default(false)
});
export const SessionSchema = z.object({
    id: z.string().min(1),
    runtimeSessionId: z.string().min(1).optional(),
    title: z.string().min(1),
    summary: z.string().min(1),
    source: z.enum(['hermes_cli', 'local']),
    lastUpdatedAt: z.string().datetime(),
    lastUsedProfileId: z.string().min(1).nullable().default(null),
    associatedProfileIds: z.array(z.string().min(1)).default([]),
    messageCount: z.number().int().nonnegative().default(0),
    attachedRecipeId: z.string().min(1).nullable().default(null),
    recipeType: z.enum(['home', 'tui']).default('tui')
});
export const SessionFilterSummarySchema = z.object({
    profileId: z.string().min(1),
    visibleCount: z.number().int().nonnegative(),
    hiddenSyntheticCount: z.number().int().nonnegative(),
    recentCount: z.number().int().nonnegative()
});
export const ChatMessageVisibilitySchema = z.enum(['transcript', 'runtime']);
export const ChatMessageKindSchema = z.enum(['conversation', 'notice', 'technical']);
export const UploadedFileKindSchema = z.enum([
    'image',
    'audio',
    'video',
    'pdf',
    'text',
    'code',
    'spreadsheet',
    'archive',
    'document',
    'unknown'
]);
export const FileRefSchema = z.object({
    id: z.string().min(1),
    filename: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.number().int().nonnegative(),
    kind: UploadedFileKindSchema
});
export const UploadedFileSchema = z.object({
    id: z.string().min(1),
    profileId: z.string().min(1),
    sessionId: z.string().min(1).nullable(),
    filename: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.number().int().nonnegative(),
    kind: UploadedFileKindSchema,
    parseStatus: z.enum(['pending', 'processing', 'done', 'failed', 'not_applicable']),
    parsedText: z.string().nullable(),
    transcriptionStatus: z.enum(['none', 'pending', 'processing', 'done', 'failed']),
    transcriptionText: z.string().nullable(),
    createdAt: z.string().datetime()
});
export const ChatMessageSchema = z.object({
    id: z.string().min(1),
    sessionId: z.string().min(1),
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    content: z.string(),
    createdAt: z.string().datetime(),
    status: z.enum(['completed', 'error']).default('completed'),
    requestId: z.string().min(1).nullable().default(null),
    visibility: ChatMessageVisibilitySchema.default('transcript'),
    kind: ChatMessageKindSchema.default('conversation'),
    attachments: z.array(FileRefSchema).optional()
});
export const JobSchema = z.object({
    id: z.string().min(1),
    profileId: z.string().min(1),
    label: z.string().min(1),
    schedule: z.string().min(1),
    status: z.enum(['healthy', 'paused', 'attention']),
    description: z.string().min(1),
    lastRun: z.string().min(1),
    nextRun: z.string().min(1),
    lastSyncedAt: z.string().datetime()
});
export const JobsFreshnessSchema = z.object({
    profileId: z.string().min(1),
    status: z.enum(['connected', 'disconnected', 'error', 'refreshing']),
    source: z.enum(['hermes_cli', 'local_cache']),
    lastRequestedAt: z.string().datetime().optional(),
    lastSuccessfulAt: z.string().datetime().optional(),
    lastError: z.string().min(1).optional()
});
export const ToolSchema = z.object({
    id: z.string().min(1),
    profileId: z.string().min(1).nullable().default(null),
    source: z.enum(['hermes', 'bridge']),
    scope: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    enabled: z.boolean(),
    status: z.enum(['enabled', 'disabled', 'unavailable']),
    approvalModel: z.enum(['none', 'explicit_user_approval', 'managed_by_hermes']),
    capabilities: z.array(z.string().min(1)).default([]),
    restrictions: z.array(z.string().min(1)).default([]),
    lastSyncedAt: z.string().datetime()
});
export const ToolExecutionSchema = z.object({
    id: z.string().min(1),
    toolId: z.string().min(1),
    profileId: z.string().min(1).nullable().default(null),
    sessionId: z.string().min(1).nullable().default(null),
    summary: z.string().min(1),
    command: z.string().min(1),
    args: z.array(z.string()).default([]),
    cwd: z.string().min(1).nullable().default(null),
    status: z.enum(['pending', 'approved', 'rejected', 'completed', 'failed']),
    requestedAt: z.string().datetime(),
    resolvedAt: OptionalDateTimeSchema,
    stdout: OptionalStringSchema,
    stderr: OptionalStringSchema,
    exitCode: z.number().int().optional()
});
export const RuntimeActivityHistoryEntrySchema = z.object({
    id: z.string().min(1),
    requestId: z.string().min(1),
    sessionId: z.string().min(1),
    profileId: z.string().min(1).nullable().default(null),
    sessionTitle: OptionalTextSchema,
    requestPreview: OptionalTextSchema,
    kind: z.enum(['status', 'skill', 'tool', 'command', 'approval', 'warning']),
    state: z.enum(['started', 'updated', 'completed', 'failed', 'cancelled', 'denied']),
    label: z.string().min(1),
    detail: OptionalStringSchema,
    command: OptionalStringSchema,
    timestamp: z.string().datetime()
});
export const SkillSchema = z.object({
    id: z.string().min(1),
    profileId: z.string().min(1),
    name: z.string().min(1),
    summary: z.string().max(120).default(''),
    category: z.string().default(''),
    source: z.string().min(1),
    trust: z.string().min(1),
    lastSyncedAt: z.string().datetime()
});
export const ProviderConnectionSchema = z.object({
    id: z.string().min(1),
    profileId: z.string().min(1),
    displayName: z.string().min(1),
    authKind: z.enum(['api_key', 'oauth', 'mixed', 'external_process', 'unknown']),
    status: z.enum(['connected', 'available', 'missing', 'error']),
    credentialLabel: OptionalTextSchema,
    maskedCredential: OptionalTextSchema,
    source: z.string().min(1),
    supportsApiKey: z.boolean().default(false),
    supportsOAuth: z.boolean().default(false),
    notes: OptionalTextSchema,
    lastSyncedAt: z.string().datetime()
});
export const RuntimeConfigOptionSchema = z.object({
    value: z.string().min(1),
    label: z.string().min(1),
    description: OptionalTextSchema,
    disabled: z.boolean().default(false),
    disabledReason: OptionalTextSchema
});
export const RuntimeConfigFieldSchema = z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    description: OptionalTextSchema,
    input: z.enum(['select', 'number', 'text', 'secret', 'url']),
    required: z.boolean().default(false),
    secret: z.boolean().default(false),
    placeholder: OptionalTextSchema,
    value: OptionalTextSchema,
    options: z.array(RuntimeConfigOptionSchema).default([]),
    disabled: z.boolean().default(false),
    disabledReason: OptionalTextSchema
});
export const RuntimeProviderStateSchema = z.enum([
    'unconfigured',
    'needs_api_key',
    'needs_oauth',
    'waiting_for_verification',
    'verifying',
    'connected',
    'needs_model_selection',
    'invalid_credentials',
    'config_error',
    'discovery_pending',
    'unsupported'
]);
export const RuntimeProviderValidationSchema = z
    .object({
    status: z.enum(['ok', 'warning', 'error']).default('error'),
    code: z.string().min(1),
    message: z.string().min(1),
    detail: OptionalTextSchema,
    checkedAt: OptionalDateTimeSchema
})
    .strict();
export const ProviderAuthSessionKindSchema = z.enum(['oauth_device_code', 'oauth_external', 'api_key', 'manual']);
export const ProviderAuthSessionStatusSchema = z.enum(['pending', 'verifying', 'completed', 'unavailable', 'failed']);
export const ProviderAuthSessionSchema = z
    .object({
    id: z.string().min(1),
    providerId: z.string().min(1),
    kind: ProviderAuthSessionKindSchema,
    status: ProviderAuthSessionStatusSchema,
    actionUrl: OptionalTextSchema,
    actionLabel: OptionalTextSchema,
    verificationCode: OptionalTextSchema,
    expiresAt: OptionalDateTimeSchema,
    startedAt: OptionalDateTimeSchema,
    checkedAt: OptionalDateTimeSchema,
    pollAfterMs: z.number().int().positive().optional(),
    message: z.string().min(1),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RuntimeProviderModelSelectionModeSchema = z.enum(['select_only']);
export const RuntimeProviderAuthSessionSchema = ProviderAuthSessionSchema;
export const RuntimeProviderSetupStepStatusSchema = z.enum([
    'completed',
    'pending',
    'action_required',
    'disabled',
    'blocked'
]);
export const RuntimeProviderSetupStepKindSchema = z.enum([
    'inspect',
    'api_key',
    'oauth',
    'config',
    'model',
    'verify',
    'manual',
    'refresh',
    'complete'
]);
export const RuntimeProviderSetupStepSchema = z.object({
    id: z.string().min(1),
    kind: RuntimeProviderSetupStepKindSchema,
    title: z.string().min(1),
    description: z.string().min(1),
    status: RuntimeProviderSetupStepStatusSchema,
    actionLabel: OptionalTextSchema,
    actionUrl: OptionalTextSchema,
    command: OptionalTextSchema,
    metadata: z.record(z.string().min(1), z.unknown()).default({})
});
export const RuntimeModelOptionSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    providerId: z.string().min(1),
    description: OptionalTextSchema,
    disabled: z.boolean().default(false),
    disabledReason: OptionalTextSchema,
    supportsReasoningEffort: z.boolean().default(false),
    reasoningEffortOptions: z.array(z.string().min(1)).default([]),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
});
export const RuntimeProviderOptionSchema = ProviderConnectionSchema.extend({
    state: RuntimeProviderStateSchema,
    stateMessage: z.string().min(1),
    ready: z.boolean().default(false),
    modelSelectionMode: RuntimeProviderModelSelectionModeSchema.default('select_only'),
    description: OptionalTextSchema,
    disabled: z.boolean().default(false),
    disabledReason: OptionalTextSchema,
    supportsModelDiscovery: z.boolean().default(false),
    supportsDisconnect: z.boolean().default(false),
    validation: RuntimeProviderValidationSchema.optional(),
    authSession: RuntimeProviderAuthSessionSchema.optional(),
    models: z.array(RuntimeModelOptionSchema).default([]),
    configurationFields: z.array(RuntimeConfigFieldSchema).default([]),
    setupSteps: z.array(RuntimeProviderSetupStepSchema).default([])
});
export const RuntimeReadinessCodeSchema = z.enum([
    'ready',
    'provider_missing',
    'provider_disabled',
    'provider_auth_required',
    'model_missing',
    'model_disabled',
    'runtime_state_unavailable',
    'discovery_pending',
    'config_error',
    'invalid_credentials',
    'unsupported'
]);
export const HermesCliModelsSchemaVersionSchema = z.literal('hermes_cli_models/v2');
export const HermesCliConfigOptionSchema = z
    .object({
    value: z.string().min(1),
    label: z.string().min(1),
    description: OptionalTextSchema,
    disabled: z.boolean().default(false),
    disabledReason: OptionalTextSchema
})
    .strict();
export const HermesCliConfigFieldSchema = z
    .object({
    key: z.string().min(1),
    label: z.string().min(1),
    description: OptionalTextSchema,
    input: z.enum(['select', 'number', 'text', 'secret', 'url']),
    required: z.boolean().default(false),
    secret: z.boolean().default(false),
    placeholder: OptionalTextSchema,
    value: OptionalTextSchema,
    options: z.array(HermesCliConfigOptionSchema).default([]),
    disabled: z.boolean().default(false),
    disabledReason: OptionalTextSchema
})
    .strict();
export const HermesCliProviderSetupStepSchema = z
    .object({
    id: z.string().min(1),
    kind: RuntimeProviderSetupStepKindSchema,
    title: z.string().min(1),
    description: z.string().min(1),
    status: RuntimeProviderSetupStepStatusSchema,
    actionLabel: OptionalTextSchema,
    actionUrl: OptionalTextSchema,
    command: OptionalTextSchema,
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const HermesCliModelOptionSchema = z
    .object({
    id: z.string().min(1),
    label: z.string().min(1),
    providerId: z.string().min(1).optional(),
    description: OptionalTextSchema,
    disabled: z.boolean().default(false),
    disabledReason: OptionalTextSchema,
    supportsReasoningEffort: z.boolean().default(false),
    reasoningEffortOptions: z.array(z.string().min(1)).default([]),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const HermesCliProviderStatusSchema = z.enum(['connected', 'available', 'missing', 'error']);
export const HermesCliProviderAuthKindSchema = z.enum(['api_key', 'oauth', 'mixed', 'external_process', 'unknown']);
export const HermesCliProviderSchema = z
    .object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    source: z.string().min(1),
    status: HermesCliProviderStatusSchema,
    state: RuntimeProviderStateSchema,
    stateMessage: z.string().min(1),
    ready: z.boolean().default(false),
    disabled: z.boolean().default(false),
    disabledReason: OptionalTextSchema,
    authKind: HermesCliProviderAuthKindSchema,
    supportsApiKey: z.boolean().default(false),
    supportsOAuth: z.boolean().default(false),
    supportsModelDiscovery: z.boolean().default(false),
    supportsDisconnect: z.boolean().default(false),
    modelSelectionMode: RuntimeProviderModelSelectionModeSchema.default('select_only'),
    description: OptionalTextSchema,
    notes: OptionalTextSchema,
    maskedCredential: OptionalTextSchema,
    credentialLabel: OptionalTextSchema,
    validation: RuntimeProviderValidationSchema.optional(),
    authSession: ProviderAuthSessionSchema.optional(),
    setupSteps: z.array(HermesCliProviderSetupStepSchema).default([]),
    configurationFields: z.array(HermesCliConfigFieldSchema).default([]),
    models: z.array(HermesCliModelOptionSchema).default([]),
    lastSyncedAt: z.string().datetime()
})
    .strict();
export const HermesCliModelConfigSchema = z
    .object({
    provider: z.string().min(1),
    defaultModel: z.string().min(1),
    baseUrl: OptionalTextSchema,
    apiMode: OptionalTextSchema,
    maxTurns: z.number().int().positive().max(500).default(150),
    reasoningEffort: OptionalTextSchema,
    toolUseEnforcement: OptionalTextSchema,
    lastSyncedAt: z.string().datetime()
})
    .strict();
export const HermesCliRuntimeReadinessSchema = z
    .object({
    ready: z.boolean(),
    code: RuntimeReadinessCodeSchema,
    message: z.string().min(1),
    providerId: z.string().min(1).nullable().default(null),
    modelId: z.string().min(1).nullable().default(null)
})
    .strict();
export const HermesCliModelDiscoverySchema = z
    .object({
    schemaVersion: HermesCliModelsSchemaVersionSchema,
    discoveredAt: z.string().datetime(),
    inspectedProviderId: z.string().min(1).nullable().default(null),
    runtimeReadiness: HermesCliRuntimeReadinessSchema,
    config: HermesCliModelConfigSchema,
    providers: z.array(HermesCliProviderSchema)
})
    .strict();
export const HermesCliActionErrorSchema = z
    .object({
    code: z.string().min(1),
    message: z.string().min(1),
    detail: OptionalTextSchema
})
    .strict();
export const HermesCliAuthSessionSchema = ProviderAuthSessionSchema;
export const HermesCliActionResultSchema = z
    .object({
    schemaVersion: HermesCliModelsSchemaVersionSchema,
    action: z.enum(['connect', 'auth', 'auth_poll', 'configure', 'disconnect']),
    providerId: z.string().min(1),
    success: z.boolean(),
    message: z.string().min(1),
    error: HermesCliActionErrorSchema.optional(),
    authSession: HermesCliAuthSessionSchema.optional(),
    discovery: HermesCliModelDiscoverySchema.optional()
})
    .strict();
export const RuntimeModelConfigSchema = z.object({
    profileId: z.string().min(1),
    defaultModel: z.string().min(1),
    provider: z.string().min(1),
    baseUrl: OptionalTextSchema,
    apiMode: OptionalTextSchema,
    maxTurns: z.number().int().positive().max(500).default(150),
    reasoningEffort: OptionalTextSchema,
    toolUseEnforcement: OptionalTextSchema,
    lastSyncedAt: z.string().datetime()
});
export const AuditEventSchema = z.object({
    id: z.string().min(1),
    type: z.enum([
        'unrestricted_access_enabled',
        'unrestricted_access_disabled',
        'unrestricted_access_used',
        'provider_connected'
    ]),
    profileId: z.string().min(1).nullable().default(null),
    sessionId: z.string().min(1).nullable().default(null),
    message: z.string().min(1),
    createdAt: z.string().datetime()
});
export const AccessAuditSummarySchema = z.object({
    latestEvents: z.array(AuditEventSchema).default([]),
    unrestrictedAccessLastEnabledAt: z.string().datetime().optional(),
    unrestrictedAccessLastUsedAt: z.string().datetime().optional()
});
export const RuntimeReadinessSchema = z.object({
    ready: z.boolean(),
    code: RuntimeReadinessCodeSchema,
    message: z.string().min(1),
    providerId: z.string().min(1).nullable().default(null),
    modelId: z.string().min(1).nullable().default(null)
});
export const AppSettingsSchema = z.object({
    themeMode: ThemeModeSchema.default('dark'),
    sessionsPageSize: z.number().int().min(25).max(100).default(50),
    chatTimeoutMs: z.number().int().min(15_000).max(900_000).default(180_000),
    discoveryTimeoutMs: z.number().int().min(15_000).max(1_800_000).default(240_000),
    nearbySearchTimeoutMs: z.number().int().min(15_000).max(1_800_000).default(300_000),
    recipeOperationTimeoutMs: z.number().int().min(15_000).max(900_000).default(180_000),
    unrestrictedTimeoutMs: z.number().int().min(15_000).max(7_200_000).default(1_800_000),
    restrictedChatMaxTurns: z.number().int().min(1).max(150).default(8),
    unrestrictedAccessEnabled: z.boolean().default(false)
});
export const UiStateSchema = z.object({
    activeProfileId: z.string().min(1).nullable().default(null),
    currentPage: AppPageSchema.default('chat'),
    activeSessionIdByProfile: z.record(z.string().min(1), z.string().min(1).nullable()).default({}),
    recentSessionIdsByProfile: z.record(z.string().min(1), z.array(z.string().min(1))).default({}),
    toolsTab: ToolsTabSchema.default('all'),
    sidebarCollapsed: z.boolean().default(false)
});
export const SessionDeletionModeSchema = z.enum(['soft', 'hybrid']);
export const ChatActivitySchema = z.object({
    kind: z.enum(['status', 'skill', 'tool', 'command', 'approval', 'warning', 'thinking', 'website']),
    state: z.enum(['started', 'updated', 'completed', 'failed', 'cancelled', 'denied']),
    label: z.string().min(1),
    detail: z.string().optional(),
    command: z.string().optional(),
    url: z.string().optional(),
    requestId: z.string().min(1).nullable().default(null),
    timestamp: z.string().datetime()
});
export const RuntimeRequestStatusSchema = z.enum(['idle', 'running', 'completed', 'failed', 'cancelled', 'denied']);
export const RuntimeRequestSchema = z.object({
    requestId: z.string().min(1),
    profileId: z.string().min(1).nullable().default(null),
    sessionId: z.string().min(1),
    preview: z.string().min(1),
    messageIds: z.array(z.string().min(1)).default([]),
    activities: z.array(ChatActivitySchema).default([]),
    status: RuntimeRequestStatusSchema,
    startedAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    completedAt: z.string().datetime().nullable().default(null),
    lastError: z.string().optional(),
    recipePipeline: z.lazy(() => RecipePipelineStateSchema).optional(),
    telemetryCount: z.number().int().nonnegative().default(0)
});
export const RecipePipelineStageSchema = z.enum([
    'task_running',
    'task_failed',
    'task_ready',
    'baseline_updating',
    'baseline_failed',
    'baseline_ready',
    'enrichment_generating',
    'enrichment_validating',
    'enrichment_failed',
    'enrichment_ready',
    'applet_generating',
    'applet_validating',
    'applet_failed',
    'applet_ready'
]);
export const RecipePipelineSegmentStatusSchema = z.enum(['idle', 'running', 'ready', 'failed', 'skipped']);
export const RecipeFailureCategorySchema = z.enum([
    'timeout_user_config',
    'timeout_runtime',
    'auth_scope',
    'upstream_tool_failure',
    'task_failure',
    'baseline_recipe_failure',
    'template_selection_failed',
    'template_text_failed',
    'template_hydration_failed',
    'template_actions_failed',
    'template_fill_failed',
    'template_update_failed',
    'template_switch_failed',
    'template_text_repair_failed',
    'template_actions_repair_failed',
    'semantic_content_failed',
    'normalization_failed',
    'repair_failed',
    'validation_failed',
    'unsupported_template_transition',
    'dsl_seed_failure',
    'dsl_generation_live_task_violation',
    'dsl_context_invalid',
    'dsl_generation_failure',
    'dsl_validation_failure',
    'dsl_normalization_failure',
    'dsl_repair_failed',
    'dsl_patch_failure',
    'applet_seed_failure',
    'applet_generation_live_task_violation',
    'applet_generation_context_invalid',
    'applet_manifest_failure',
    'applet_source_failure',
    'applet_capability_failure',
    'applet_compile_failure',
    'applet_test_failure',
    'applet_render_failure',
    'applet_small_pane_failure',
    'applet_verification_failure',
    'unknown'
]);
export const RecipePipelineSegmentSchema = z
    .object({
    status: RecipePipelineSegmentStatusSchema,
    stage: RecipePipelineStageSchema.optional(),
    failureCategory: RecipeFailureCategorySchema.optional(),
    message: z.string().min(1).optional(),
    diagnostic: z.string().min(1).optional(),
    retryable: z.boolean().optional(),
    configuredTimeoutMs: z.number().int().positive().optional(),
    updatedAt: z.string().datetime().optional()
})
    .strict();
export const RecipePipelineStateSchema = z
    .object({
    currentStage: RecipePipelineStageSchema,
    task: RecipePipelineSegmentSchema,
    baseline: RecipePipelineSegmentSchema,
    applet: RecipePipelineSegmentSchema
})
    .strict();
export const TelemetrySeveritySchema = z.enum(['info', 'warning', 'error']);
export const TelemetryCategorySchema = z.enum([
    'runtime',
    'bridge',
    'transcript',
    'settings',
    'model_provider',
    'jobs',
    'tools',
    'skills',
    'recipes'
]);
export const TelemetryEventSchema = z.object({
    id: z.string().min(1),
    profileId: z.string().min(1).nullable().default(null),
    sessionId: z.string().min(1).nullable().default(null),
    requestId: z.string().min(1).nullable().default(null),
    severity: TelemetrySeveritySchema,
    category: TelemetryCategorySchema,
    code: z.string().min(1),
    message: z.string().min(1),
    detail: z.string().optional(),
    payload: z.record(z.string().min(1), z.unknown()).default({}),
    createdAt: z.string().datetime()
});
export const RecipeContentFormatSchema = z.enum(['table', 'card', 'markdown']);
export const RecipeStatusSchema = z.enum(['idle', 'active', 'changed', 'archived', 'error']);
export const RecipeSourceSchema = z.enum(['user', 'hermes', 'bridge']);
export const RecipeLinkKindSchema = z.enum(['website', 'place', 'booking', 'menu', 'map', 'email', 'other']);
export const RecipeLinkSchema = z.object({
    label: z.string().min(1),
    url: z.string().min(1),
    kind: RecipeLinkKindSchema.default('other')
});
export const RecipeImageSchema = z.object({
    url: z.string().min(1),
    alt: z.string().min(1).optional()
});
export const RecipeRichTextValueSchema = z
    .object({
    text: z.string().optional(),
    href: z.string().min(1).optional(),
    kind: z.enum(['text', 'link', 'email']).default('text'),
    imageUrl: z.string().min(1).optional(),
    imageAlt: z.string().min(1).optional()
})
    .refine((value) => value.text !== undefined || value.href !== undefined || value.imageUrl !== undefined, {
    message: 'Rich content values require text, a link, or an image URL.'
});
export const RecipeCellValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null(), RecipeRichTextValueSchema]);
export const RecipeTableColumnSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    emphasis: z.enum(['none', 'primary', 'status']).default('none'),
    presentation: z.enum(['text', 'link', 'email', 'image']).default('text')
});
export const RecipeTableDataSchema = z.object({
    columns: z.array(RecipeTableColumnSchema).min(1),
    rows: z.array(z.record(z.string().min(1), RecipeCellValueSchema)).default([]),
    emptyMessage: z.string().min(1).optional()
});
export const RecipeCardMetadataItemSchema = z.object({
    label: z.string().min(1),
    value: z.string().min(1),
    link: RecipeLinkSchema.optional()
});
export const RecipeCardItemSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    eyebrow: z.string().optional(),
    badges: z.array(z.string().min(1)).default([]),
    metadata: z.array(RecipeCardMetadataItemSchema).default([]),
    links: z.array(RecipeLinkSchema).default([]),
    image: RecipeImageSchema.optional()
});
export const RecipeCardDataSchema = z.object({
    cards: z.array(RecipeCardItemSchema).default([]),
    emptyMessage: z.string().min(1).optional()
});
export const RecipeMarkdownDataSchema = z.object({
    markdown: z.string()
});
export const RecipeContentEntrySourceSchema = z.object({
    integration: z.string().min(1),
    kind: z.string().min(1),
    resourceId: z.string().min(1),
    label: z.string().min(1).optional(),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
});
export const RecipeContentEntrySchema = z.object({
    id: z.string().min(1),
    md: z.string().default(''),
    row: z.record(z.string().min(1), RecipeCellValueSchema).default({}),
    card: RecipeCardItemSchema,
    source: RecipeContentEntrySourceSchema.optional(),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
}).superRefine((entry, context) => {
    if (entry.card.id !== entry.id) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Recipe content entry card ids must match the entry id.',
            path: ['card', 'id']
        });
    }
});
export const RecipeContentSyncSchema = z.object({
    syncVersion: z.number().int().positive().default(1),
    sourceView: RecipeContentFormatSchema.default('markdown'),
    fingerprint: z.string().default(''),
    entryCount: z.number().int().min(0).default(0)
});
export const RecipeMetadataSchema = z.object({
    changeVersion: z.number().int().positive().default(1),
    lastChangedAt: z.string().datetime().optional(),
    changeSummary: z.string().min(1).optional(),
    auditTags: z.array(z.string().min(1)).default([]),
    homeRecipe: z.boolean().default(false),
    recipeDefinitionVersion: z.string().min(1).optional(),
    instanceVersion: z.number().int().nonnegative().optional(),
    baselineContentUpdatedAt: z.string().datetime().optional(),
    refreshPrompt: z.string().min(1).optional(),
    refreshRequestId: z.string().min(1).optional(),
    refreshPromptUpdatedAt: z.string().datetime().optional(),
    latestRecipeAttemptOutcome: z.enum(['dynamic_ready', 'dynamic_failed', 'markdown_fallback']).optional(),
    latestRecipeAttemptMode: z.enum(['structured_only', 'markdown_fallback', 'compatibility_block']).optional(),
    latestRecipeAttemptRequestId: z.string().min(1).optional(),
    latestRecipeAttemptedAt: z.string().datetime().optional(),
    activeTemplateId: RecipeTemplateIdSchema.optional(),
    alternativeTemplates: z.array(z.object({
        id: RecipeTemplateIdSchema,
        name: z.string().min(1),
        intentLabel: z.string().min(1)
    })).optional(),
    recipePipeline: RecipePipelineStateSchema.optional()
});
export const RecipeContentModelSchema = z.object({
    activeView: RecipeContentFormatSchema.default('markdown'),
    entries: z.array(RecipeContentEntrySchema).default([]),
    markdownRepresentation: RecipeMarkdownDataSchema.default({
        markdown: ''
    }),
    tableRepresentation: RecipeTableDataSchema.default({
        columns: [
            {
                id: 'value',
                label: 'Value',
                emphasis: 'primary'
            }
        ],
        rows: [],
        emptyMessage: 'No rows yet.'
    }),
    cardRepresentation: RecipeCardDataSchema.default({
        cards: [],
        emptyMessage: 'No cards yet.'
    }),
    sync: RecipeContentSyncSchema.default({
        syncVersion: 1,
        sourceView: 'markdown',
        fingerprint: '',
        entryCount: 0
    })
});
export const RecipeContentTabSchema = z.object({
    id: z.literal('content'),
    kind: z.literal('content'),
    label: z.string().min(1).default('Content'),
    content: RecipeContentModelSchema,
    metadata: z.record(z.string().min(1), z.unknown()).default({})
});
export const RecipeExtensionTabSchema = z.object({
    id: z.string().min(1).refine((value) => value !== 'content', {
        message: 'Extension tabs must not reuse the reserved content tab id.'
    }),
    kind: z.string().min(1).refine((value) => value !== 'content', {
        message: 'Extension tabs must not reuse the reserved content tab kind.'
    }),
    label: z.string().min(1),
    data: z.record(z.string().min(1), z.unknown()).default({}),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
});
export const RecipeTabSchema = z.union([RecipeContentTabSchema, RecipeExtensionTabSchema]);
export const RecipeUiStateSchema = z.object({
    activeTab: z.string().min(1).default('content')
});
export const RecipeRenderModeSchema = z.enum(['legacy_content_v1', 'dynamic_v1']);
export const RecipeBuildKindSchema = z.enum(['compiled_home', 'dsl_enrichment', 'template_enrichment', 'applet']);
export const RecipeBuildPhaseSchema = z.enum([
    'queued',
    'analyzing',
    'planning_ui',
    'generating_ui',
    'generating_actions',
    'generating_tests',
    'validating',
    'testing',
    'dsl_analyzing',
    'dsl_generating',
    'dsl_repairing',
    'dsl_normalizing',
    'dsl_applying',
    'dsl_promoting',
    'template_selecting',
    'template_text_generating',
    'template_hydrating',
    'template_actions_generating',
    'template_text_repairing',
    'template_actions_repairing',
    'template_filling',
    'template_updating',
    'template_repairing',
    'template_switching',
    'template_validating',
    'template_promoting',
    'applet_analyzing',
    'applet_planning',
    'applet_generating_manifest',
    'applet_generating_source',
    'applet_synthesizing_manifest',
    'applet_generating_tests',
    'applet_section_ready',
    'applet_repairing',
    'applet_validating',
    'applet_typechecking',
    'applet_testing',
    'applet_render_smoke',
    'applet_promoting',
    'ready',
    'failed'
]);
export const RecipeBuildTriggerKindSchema = z.enum(['chat', 'refresh', 'action', 'retry', 'legacy_import']);
export const RecipeBuildSchema = z
    .object({
    id: z.string().min(1),
    recipeId: z.string().min(1),
    profileId: z.string().min(1),
    sessionId: z.string().min(1).nullable().default(null),
    buildVersion: z.number().int().positive(),
    buildKind: RecipeBuildKindSchema.default('compiled_home'),
    triggerKind: RecipeBuildTriggerKindSchema,
    triggerRequestId: z.string().min(1).nullable().default(null),
    triggerActionId: z.string().min(1).nullable().default(null),
    phase: RecipeBuildPhaseSchema,
    progressMessage: OptionalTextSchema,
    retryCount: z.number().int().nonnegative().default(0),
    startedAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    completedAt: z.string().datetime().nullable().default(null),
    errorCode: z.string().min(1).nullable().default(null),
    errorMessage: z.string().min(1).nullable().default(null),
    errorDetail: z.string().min(1).nullable().default(null),
    failureCategory: RecipeFailureCategorySchema.nullable().default(null),
    failureStage: RecipePipelineStageSchema.nullable().default(null),
    userFacingMessage: z.string().min(1).nullable().default(null),
    retryable: z.boolean().nullable().default(null),
    configuredTimeoutMs: z.number().int().positive().nullable().default(null)
})
    .strict();
export const RecipeBuildLogLevelSchema = z.enum(['info', 'warning', 'error']);
export const RecipeBuildLogSchema = z
    .object({
    id: z.string().min(1),
    recipeId: z.string().min(1),
    buildId: z.string().min(1),
    phase: RecipeBuildPhaseSchema,
    level: RecipeBuildLogLevelSchema,
    message: z.string().min(1),
    detail: OptionalTextSchema,
    createdAt: z.string().datetime()
})
    .strict();
export const RecipeArtifactKindSchema = z.enum([
    'user_prompt',
    'intent',
    'raw_data',
    'analysis',
    'normalized_data',
    'assistant_context',
    'ui_spec',
    'action_spec',
    'recipe_template_selection',
    'recipe_template_text',
    'recipe_template_hydration',
    'recipe_template_actions',
    'recipe_template_fill',
    'recipe_template_update',
    'recipe_template_state',
    'recipe_dsl',
    'recipe_model',
    'recipe_patch',
    'test_spec',
    'test_results',
    'summary',
    'fallback',
    'applet_plan',
    'applet_manifest',
    'applet_source',
    'applet_test_source',
    'applet_render_tree',
    'applet_verification'
]);
const RecipeArtifactRequestModeSchema = z.enum(['chat', 'recipe_refresh', 'recipe_action']);
export const RecipeUserPromptArtifactSchema = z
    .object({
    kind: z.literal('user_prompt'),
    schemaVersion: z.literal('recipe_user_prompt/v1'),
    originalPrompt: z.string().min(1),
    normalizedPrompt: OptionalTextSchema,
    requestMode: RecipeArtifactRequestModeSchema.default('chat')
})
    .strict();
export const RecipeIntentCategorySchema = z.enum(['places', 'shopping', 'plan', 'research', 'finance', 'results', 'general']);
export const RecipeIntentPresentationSchema = z.enum(['table', 'cards', 'list', 'detail', 'wizard', 'markdown']);
export const RecipeIntentEntitySchema = z
    .object({
    kind: z.string().min(1),
    value: z.string().min(1)
})
    .strict();
export const RecipeIntentFilterSchema = z
    .object({
    key: z.string().min(1),
    label: z.string().min(1),
    value: z.union([z.string().min(1), z.number(), z.boolean()])
})
    .strict();
export const RecipeIntentSortSchema = z
    .object({
    key: z.string().min(1),
    direction: z.enum(['asc', 'desc']).default('asc')
})
    .strict();
export const RecipeIntentUpdateTargetSchema = z.enum(['new_recipe', 'current_recipe']);
export const RecipeIntentSchema = z
    .object({
    kind: z.literal('intent'),
    schemaVersion: z.literal('recipe_intent/v1'),
    category: RecipeIntentCategorySchema,
    label: z.string().min(1),
    summary: z.string().min(1),
    preferredPresentation: RecipeIntentPresentationSchema.default('cards'),
    query: z.string().min(1),
    entities: z.array(RecipeIntentEntitySchema).default([]),
    filters: z.array(RecipeIntentFilterSchema).default([]),
    sort: RecipeIntentSortSchema.optional(),
    allowOutboundRequests: z.boolean().default(true),
    destructiveIntent: z.boolean().default(false),
    updateTarget: RecipeIntentUpdateTargetSchema.default('new_recipe'),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipePaginationHintSchema = z
    .object({
    datasetId: z.string().min(1),
    pageSize: z.number().int().positive().max(50).default(6),
    totalItems: z.number().int().nonnegative().optional(),
    hasMore: z.boolean().default(false),
    nextCursor: OptionalTextSchema
})
    .strict();
export const RecipeRawDataSchema = z
    .object({
    kind: z.literal('raw_data'),
    schemaVersion: z.literal('recipe_raw_data/v1'),
    payload: z.record(z.string().min(1), z.unknown()).default({}),
    links: z.array(RecipeLinkSchema).default([]),
    paginationHints: z.array(RecipePaginationHintSchema).default([]),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeAssistantContextSchema = z
    .object({
    kind: z.literal('assistant_context'),
    schemaVersion: z.literal('recipe_assistant_context/v1'),
    summary: z.string().min(1),
    responseLead: OptionalTextSchema,
    responseTail: OptionalTextSchema,
    links: z.array(RecipeLinkSchema).default([]),
    citations: z.array(z.string().min(1)).default([]),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeSummaryStatSchema = z
    .object({
    id: z.string().min(1),
    label: z.string().min(1),
    value: z.string().min(1),
    emphasis: z.enum(['none', 'primary', 'status']).default('none'),
    tone: z.enum(['info', 'success', 'warning', 'danger', 'neutral']).default('neutral')
})
    .strict();
export const RecipeAnalysisValueKindSchema = z.enum([
    'string',
    'number',
    'boolean',
    'null',
    'link',
    'email',
    'date',
    'object',
    'array',
    'mixed'
]);
export const RecipeAnalysisFieldRoleSchema = z.enum([
    'title',
    'subtitle',
    'description',
    'detail',
    'metric',
    'group',
    'sort',
    'time',
    'link',
    'email',
    'badge'
]);
export const RecipeAnalysisFieldSchema = z
    .object({
    key: z.string().min(1),
    label: z.string().min(1),
    path: z.string().min(1),
    valueKind: RecipeAnalysisValueKindSchema,
    roles: z.array(RecipeAnalysisFieldRoleSchema).default([]),
    distinctCount: z.number().int().nonnegative().default(0),
    nonEmptyCount: z.number().int().nonnegative().default(0),
    examples: z.array(z.string().min(1)).default([])
})
    .strict();
export const RecipeAnalysisRecordSchema = z
    .object({
    id: z.string().min(1),
    title: z.string().min(1),
    subtitle: OptionalTextSchema,
    description: OptionalStringSchema,
    badges: z.array(z.string().min(1)).default([]),
    values: z.record(z.string().min(1), RecipeCellValueSchema).default({}),
    links: z.array(RecipeLinkSchema).default([]),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeAnalysisDatasetKindSchema = z.enum(['collection', 'entity', 'timeline', 'grouped_collection', 'notes']);
export const RecipeAnalysisDatasetOriginSchema = z.enum(['array', 'object', 'synthetic']);
export const RecipeAnalysisDatasetCardinalitySchema = z.enum(['zero', 'one', 'many']);
export const RecipeAnalysisDatasetDefaultViewSchema = z.enum([
    'collection',
    'grouped_collection',
    'timeline',
    'property_sheet',
    'markdown'
]);
export const RecipeAnalysisDatasetSchema = z
    .object({
    id: z.string().min(1),
    label: z.string().min(1),
    path: z.string().min(1),
    kind: RecipeAnalysisDatasetKindSchema,
    origin: RecipeAnalysisDatasetOriginSchema.default('array'),
    itemCount: z.number().int().nonnegative().default(0),
    cardinality: RecipeAnalysisDatasetCardinalitySchema.default('zero'),
    parentDatasetId: OptionalTextSchema,
    parentFieldKey: OptionalTextSchema,
    fields: z.array(RecipeAnalysisFieldSchema).default([]),
    records: z.array(RecipeAnalysisRecordSchema).default([]),
    notes: z.array(z.string().min(1)).default([]),
    links: z.array(RecipeLinkSchema).default([]),
    candidateGroupKeys: z.array(z.string().min(1)).default([]),
    candidateSortKeys: z.array(z.string().min(1)).default([]),
    detailFieldKeys: z.array(z.string().min(1)).default([]),
    timeFieldKey: OptionalTextSchema,
    defaultView: RecipeAnalysisDatasetDefaultViewSchema.default('collection'),
    pageSize: z.number().int().positive().max(20).default(6),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeAnalysisSchema = z
    .object({
    kind: z.literal('analysis'),
    schemaVersion: z.literal('recipe_analysis/v1'),
    primaryDatasetId: z.string().min(1).optional(),
    datasets: z.array(RecipeAnalysisDatasetSchema).default([]),
    summaryStats: z.array(RecipeSummaryStatSchema).default([]),
    notes: z.array(z.string().min(1)).default([]),
    links: z.array(RecipeLinkSchema).default([]),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeNormalizedFieldSchema = z
    .object({
    key: z.string().min(1),
    label: z.string().min(1),
    value: RecipeCellValueSchema,
    presentation: z.enum(['text', 'link', 'email', 'image', 'badge']).default('text'),
    emphasis: z.enum(['none', 'primary', 'status']).default('none')
})
    .strict();
export const RecipeNormalizedItemSchema = z
    .object({
    id: z.string().min(1),
    title: z.string().min(1),
    subtitle: OptionalTextSchema,
    description: OptionalStringSchema,
    badges: z.array(z.string().min(1)).default([]),
    fields: z.array(RecipeNormalizedFieldSchema).default([]),
    links: z.array(RecipeLinkSchema).default([]),
    image: RecipeImageSchema.optional(),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeDatasetKindSchema = z.enum(['collection', 'detail', 'stats', 'notes']);
export const RecipeDatasetPresentationSchema = z.enum(['table', 'cards', 'list', 'detail', 'markdown']);
export const RecipeDatasetPageInfoSchema = z
    .object({
    pageSize: z.number().int().positive().max(50).default(6),
    totalItems: z.number().int().nonnegative().optional(),
    hasMore: z.boolean().default(false),
    nextCursor: OptionalTextSchema
})
    .strict();
export const RecipeNormalizedDatasetSchema = z
    .object({
    id: z.string().min(1),
    label: z.string().min(1),
    kind: RecipeDatasetKindSchema,
    preferredPresentation: RecipeDatasetPresentationSchema.default('cards'),
    items: z.array(RecipeNormalizedItemSchema).default([]),
    fields: z.array(RecipeNormalizedFieldSchema).default([]),
    stats: z.array(RecipeSummaryStatSchema).default([]),
    notes: z.array(z.string().min(1)).default([]),
    pageInfo: RecipeDatasetPageInfoSchema.default({
        pageSize: 6,
        hasMore: false
    }),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeNormalizedDataSchema = z
    .object({
    kind: z.literal('normalized_data'),
    schemaVersion: z.literal('recipe_normalized_data/v1'),
    primaryDatasetId: z.string().min(1).default('primary'),
    datasets: z.array(RecipeNormalizedDatasetSchema).min(1),
    summaryStats: z.array(RecipeSummaryStatSchema).default([]),
    notes: z.array(z.string().min(1)).default([]),
    links: z.array(RecipeLinkSchema).default([]),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeUiMessageSchema = z
    .object({
    title: z.string().min(1),
    description: z.string().min(1)
})
    .strict();
export const RecipeUiFieldBindingSchema = z
    .object({
    label: z.string().min(1),
    fieldKey: z.string().min(1),
    presentation: z.enum(['text', 'link', 'email', 'image', 'badge']).default('text'),
    emphasize: z.enum(['none', 'primary', 'status']).default('none')
})
    .strict();
export const RecipeUiSummarySectionSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('summary'),
    title: z.string().min(1),
    subtitle: OptionalTextSchema,
    statIds: z.array(z.string().min(1)).default([]),
    actionIds: z.array(z.string().min(1)).default([])
})
    .strict();
export const RecipeUiCollectionSectionSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('collection'),
    title: z.string().min(1),
    datasetId: z.string().min(1),
    presentation: z.enum(['table', 'cards', 'list']).default('cards'),
    pageSize: z.number().int().positive().max(20).default(6),
    searchable: z.boolean().default(false),
    selection: z.enum(['none', 'single', 'multiple']).default('single'),
    detailSectionId: OptionalTextSchema,
    columns: z.array(RecipeUiFieldBindingSchema).default([]),
    cardFields: z.array(RecipeUiFieldBindingSchema).default([]),
    primaryActionIds: z.array(z.string().min(1)).default([]),
    rowActionIds: z.array(z.string().min(1)).default([]),
    filterKeys: z.array(z.string().min(1)).default([]),
    emptyState: RecipeUiMessageSchema,
    loadingState: RecipeUiMessageSchema,
    errorState: RecipeUiMessageSchema
})
    .strict();
export const RecipeUiDetailSectionSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('detail'),
    title: z.string().min(1),
    datasetId: z.string().min(1),
    source: z.enum(['selected', 'first']).default('selected'),
    fields: z.array(RecipeUiFieldBindingSchema).default([]),
    actionIds: z.array(z.string().min(1)).default([]),
    emptyState: RecipeUiMessageSchema,
    loadingState: RecipeUiMessageSchema,
    errorState: RecipeUiMessageSchema
})
    .strict();
export const RecipeUiMarkdownSectionSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('markdown'),
    title: z.string().min(1),
    content: z.string()
})
    .strict();
export const RecipeUiNoticeSectionSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('notice'),
    tone: z.enum(['info', 'success', 'warning', 'danger']).default('info'),
    title: z.string().min(1),
    description: z.string().min(1)
})
    .strict();
export const RecipeUiFormFieldSchema = z
    .object({
    key: z.string().min(1),
    label: z.string().min(1),
    input: z.enum(['text', 'textarea', 'number', 'select']),
    required: z.boolean().default(false),
    placeholder: OptionalTextSchema,
    options: z.array(RuntimeConfigOptionSchema).default([])
})
    .strict();
export const RecipeUiFormSectionSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('form'),
    title: z.string().min(1),
    description: OptionalTextSchema,
    fields: z.array(RecipeUiFormFieldSchema).min(1),
    submitActionId: z.string().min(1),
    cancelActionId: z.string().min(1).optional()
})
    .strict();
export const RecipeUiWizardStepSchema = z
    .object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: OptionalTextSchema,
    body: z.string().default(''),
    actionIds: z.array(z.string().min(1)).default([])
})
    .strict();
export const RecipeUiWizardSectionSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('wizard'),
    title: z.string().min(1),
    steps: z.array(RecipeUiWizardStepSchema).min(1)
})
    .strict();
export const RecipeUiSectionV1Schema = z.discriminatedUnion('kind', [
    RecipeUiSummarySectionSchema,
    RecipeUiCollectionSectionSchema,
    RecipeUiDetailSectionSchema,
    RecipeUiMarkdownSectionSchema,
    RecipeUiNoticeSectionSchema,
    RecipeUiFormSectionSchema,
    RecipeUiWizardSectionSchema
]);
export const RecipeUiHeaderSchema = z
    .object({
    title: z.string().min(1),
    subtitle: OptionalTextSchema,
    statusLabel: OptionalTextSchema,
    badges: z.array(z.string().min(1)).default([]),
    statIds: z.array(z.string().min(1)).default([]),
    primaryActionIds: z.array(z.string().min(1)).default([]),
    secondaryActionIds: z.array(z.string().min(1)).default([])
})
    .strict();
export const RecipeUiCompactConfigSchema = z
    .object({
    defaultSectionId: z.string().min(1).optional(),
    maxCardColumns: z.number().int().min(1).max(2).default(1),
    stickyToolbar: z.boolean().default(false)
})
    .strict();
export const RecipeUiSpecV1Schema = z
    .object({
    kind: z.literal('ui_spec'),
    schemaVersion: z.literal('recipe_ui/v1'),
    layout: z.enum(['stack', 'stack_with_detail', 'wizard']).default('stack'),
    compact: RecipeUiCompactConfigSchema.default({
        maxCardColumns: 1,
        stickyToolbar: false
    }),
    header: RecipeUiHeaderSchema,
    sections: z.array(RecipeUiSectionV1Schema).min(1)
})
    .strict();
export const RecipeUiDatasetSelectionModeSchema = z.enum(['none', 'single', 'multiple']);
export const RecipeUiCollectionDisplaySchema = z.enum(['table', 'cards', 'list']);
export const RecipeUiRecordSourceSchema = z.enum(['selected', 'first', 'single']);
export const RecipeUiCompactConfigV2Schema = z
    .object({
    defaultNodeId: z.string().min(1).optional(),
    maxCollectionColumns: z.number().int().min(1).max(2).default(1),
    stickyActionBar: z.boolean().default(false)
})
    .strict();
export const RecipeUiCollectionNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('collection'),
    title: z.string().min(1),
    datasetId: z.string().min(1),
    display: RecipeUiCollectionDisplaySchema.default('cards'),
    pageSize: z.number().int().positive().max(20).default(6),
    selectable: RecipeUiDatasetSelectionModeSchema.default('single'),
    fieldKeys: z.array(z.string().min(1)).default([]),
    actionIds: z.array(z.string().min(1)).default([]),
    emptyState: RecipeUiMessageSchema,
    loadingState: RecipeUiMessageSchema,
    errorState: RecipeUiMessageSchema
})
    .strict();
export const RecipeUiGroupedCollectionNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('grouped_collection'),
    title: z.string().min(1),
    datasetId: z.string().min(1),
    groupByFieldKey: z.string().min(1),
    display: RecipeUiCollectionDisplaySchema.default('list'),
    pageSize: z.number().int().positive().max(20).default(6),
    fieldKeys: z.array(z.string().min(1)).default([]),
    actionIds: z.array(z.string().min(1)).default([]),
    emptyState: RecipeUiMessageSchema,
    loadingState: RecipeUiMessageSchema,
    errorState: RecipeUiMessageSchema
})
    .strict();
export const RecipeUiPropertySheetNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('property_sheet'),
    title: z.string().min(1),
    datasetId: z.string().min(1),
    source: RecipeUiRecordSourceSchema.default('first'),
    fieldKeys: z.array(z.string().min(1)).default([]),
    actionIds: z.array(z.string().min(1)).default([]),
    emptyState: RecipeUiMessageSchema,
    loadingState: RecipeUiMessageSchema,
    errorState: RecipeUiMessageSchema
})
    .strict();
export const RecipeUiDetailSheetNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('detail_sheet'),
    title: z.string().min(1),
    datasetId: z.string().min(1),
    source: RecipeUiRecordSourceSchema.default('selected'),
    fieldKeys: z.array(z.string().min(1)).default([]),
    actionIds: z.array(z.string().min(1)).default([]),
    emptyState: RecipeUiMessageSchema,
    loadingState: RecipeUiMessageSchema,
    errorState: RecipeUiMessageSchema
})
    .strict();
export const RecipeUiTimelineNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('timeline'),
    title: z.string().min(1),
    datasetId: z.string().min(1),
    timeFieldKey: z.string().min(1),
    titleFieldKey: z.string().min(1).optional(),
    bodyFieldKeys: z.array(z.string().min(1)).default([]),
    actionIds: z.array(z.string().min(1)).default([]),
    emptyState: RecipeUiMessageSchema,
    loadingState: RecipeUiMessageSchema,
    errorState: RecipeUiMessageSchema
})
    .strict();
export const RecipeUiMarkdownBlockNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('markdown_block'),
    title: OptionalTextSchema,
    markdown: z.string()
})
    .strict();
export const RecipeUiStatGridNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('stat_grid'),
    statIds: z.array(z.string().min(1)).default([])
})
    .strict();
export const RecipeUiActionBarNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('action_bar'),
    actionIds: z.array(z.string().min(1)).default([])
})
    .strict();
export const RecipeUiFilterBarNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('filter_bar'),
    datasetId: z.string().min(1),
    fieldKeys: z.array(z.string().min(1)).default([]),
    placeholder: OptionalTextSchema
})
    .strict();
export const RecipeUiPaginatorNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('paginator'),
    datasetId: z.string().min(1),
    pageSize: z.number().int().positive().max(20).default(6)
})
    .strict();
export const RecipeUiEmptyStateNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('empty_state'),
    title: z.string().min(1),
    description: z.string().min(1)
})
    .strict();
export const RecipeUiErrorStateNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('error_state'),
    title: z.string().min(1),
    description: z.string().min(1)
})
    .strict();
export const RecipeUiSectionGroupNodeSchema = z.lazy(() => z
    .object({
    id: z.string().min(1),
    kind: z.literal('section_group'),
    title: OptionalTextSchema,
    description: OptionalTextSchema,
    children: z.array(RecipeUiNodeSchema).min(1)
})
    .strict());
export const RecipeUiTabNodeSchema = z.lazy(() => z
    .object({
    id: z.string().min(1),
    label: z.string().min(1),
    children: z.array(RecipeUiNodeSchema).min(1)
})
    .strict());
export const RecipeUiTabGroupNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('tab_group'),
    defaultTabId: OptionalTextSchema,
    tabs: z.array(RecipeUiTabNodeSchema).min(1)
})
    .strict();
export const RecipeUiNodeSchema = z.lazy(() => z.union([
    RecipeUiCollectionNodeSchema,
    RecipeUiGroupedCollectionNodeSchema,
    RecipeUiPropertySheetNodeSchema,
    RecipeUiDetailSheetNodeSchema,
    RecipeUiTimelineNodeSchema,
    RecipeUiMarkdownBlockNodeSchema,
    RecipeUiStatGridNodeSchema,
    RecipeUiActionBarNodeSchema,
    RecipeUiFilterBarNodeSchema,
    RecipeUiPaginatorNodeSchema,
    RecipeUiEmptyStateNodeSchema,
    RecipeUiErrorStateNodeSchema,
    RecipeUiSectionGroupNodeSchema,
    RecipeUiTabGroupNodeSchema
]));
export const RecipeUiSpecV2Schema = z
    .object({
    kind: z.literal('ui_spec'),
    schemaVersion: z.literal('recipe_ui/v2'),
    compact: RecipeUiCompactConfigV2Schema.default({
        maxCollectionColumns: 1,
        stickyActionBar: false
    }),
    header: RecipeUiHeaderSchema,
    nodes: z.array(RecipeUiNodeSchema).min(1)
})
    .strict();
export const RecipeUiSpecSchema = z.discriminatedUnion('schemaVersion', [RecipeUiSpecV1Schema, RecipeUiSpecV2Schema]);
export const RecipeActionKindSchema = z.enum(['local', 'prompt', 'bridge', 'navigation', 'destructive']);
export const RecipeActionIntentSchema = z.enum(['neutral', 'primary', 'secondary', 'danger']);
export const RecipeActionSelectionRequirementSchema = z.enum(['none', 'single', 'one_or_more', 'any']);
export const RecipeActionVisibilitySchema = z
    .object({
    requiresSelection: RecipeActionSelectionRequirementSchema.default('none'),
    whenBuildReady: z.boolean().default(true),
    datasetId: z.string().min(1).optional()
})
    .strict();
export const RecipeActionConfirmationSchema = z
    .object({
    title: z.string().min(1),
    description: z.string().min(1),
    confirmLabel: z.string().min(1)
})
    .strict();
export const RecipePromptActionInputSchema = z.enum([
    'original_prompt',
    'intent',
    'recipe_summary',
    'raw_data',
    'normalized_data',
    'selected_items',
    'page_state',
    'filter_state',
    'form_values',
    'assistant_context'
]);
export const RecipeActionMutationTargetSchema = z.enum([
    'raw_data',
    'normalized_data',
    'ui_spec',
    'action_spec',
    'recipe_model',
    'recipe_patch',
    'assistant_response',
    'item_state'
]);
export const RecipePromptActionSchema = z
    .object({
    promptTemplate: z.string().min(1),
    includeInputs: z.array(RecipePromptActionInputSchema).default([]),
    allowedMutations: z.array(RecipeActionMutationTargetSchema).default([]),
    outboundRequestsAllowed: z.boolean().default(false),
    expectedOutput: z.enum(['recipe_data_update', 'assistant_only', 'recipe_delete']).default('recipe_data_update'),
    timeoutMs: z.number().int().min(5_000).max(300_000).default(120_000),
    retryable: z.boolean().default(true)
})
    .strict();
export const RecipeBridgeActionHandlerSchema = z.enum([
    'retry_build',
    'delete_source_entries',
    'remove_selected_items',
    'refresh_space',
    'applet_capability',
    'switch_template',
    'save_template_place',
    'select_event_venue',
    'add_event_guest',
    'toggle_template_checklist',
    'append_template_note',
    'move_template_card_stage',
    'generate_interview_prep',
    'expand_template_idea',
    'generate_campaign_email',
    'run_template_followup'
]);
export const RecipeBridgeActionSchema = z
    .object({
    handler: RecipeBridgeActionHandlerSchema,
    capabilityId: z.string().min(1).optional(),
    payload: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict()
    .superRefine((value, context) => {
    if (value.handler === 'applet_capability' && !value.capabilityId) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['capabilityId'],
            message: 'Applet capability bridge actions require a capability id.'
        });
    }
});
export const RecipeActionDefinitionSchema = z
    .object({
    id: z.string().min(1),
    label: z.string().min(1),
    kind: RecipeActionKindSchema,
    intent: RecipeActionIntentSchema.default('neutral'),
    description: OptionalTextSchema,
    visibility: RecipeActionVisibilitySchema.default({
        requiresSelection: 'none',
        whenBuildReady: true
    }),
    confirmation: RecipeActionConfirmationSchema.optional(),
    prompt: RecipePromptActionSchema.optional(),
    bridge: RecipeBridgeActionSchema.optional(),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict()
    .superRefine((value, context) => {
    if ((value.kind === 'prompt' || value.kind === 'destructive') && !value.prompt) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['prompt'],
            message: 'Prompt and destructive space actions require a prompt configuration.'
        });
    }
    if (value.kind === 'bridge' && !value.bridge) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['bridge'],
            message: 'Bridge space actions require a bridge handler.'
        });
    }
    if (value.kind === 'destructive' && !value.confirmation) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['confirmation'],
            message: 'Destructive space actions require an explicit confirmation payload.'
        });
    }
});
export const RecipeActionSpecSchema = z
    .object({
    kind: z.literal('action_spec'),
    schemaVersion: z.literal('recipe_action_spec/v1'),
    actions: z.array(RecipeActionDefinitionSchema).default([])
})
    .strict();
export const RecipeSdkVersionSchema = z.enum(['recipe_sdk/v1']);
export const RecipeCollectionPreferredViewSchema = z.enum([
    'table',
    'list',
    'cards',
    'detail_panel',
    'markdown'
]);
export const RecipeCollectionSelectionModeSchema = z.enum(['none', 'single', 'multiple']);
export const RecipeViewLayoutSchema = z.enum(['stack', 'grid', 'split', 'board', 'tabbed']);
export const RecipeSectionKindSchema = z.enum([
    'summary',
    'stats',
    'table',
    'list',
    'grouped_collection',
    'comparison',
    'cards',
    'detail_panel',
    'timeline',
    'markdown',
    'media',
    'split',
    'board',
    'callout',
    'actions',
    'form',
    'empty_state',
    'error_state',
    'loading_state',
    'skeleton'
]);
export const RecipeSectionStatusSchema = z.enum(['ready', 'loading', 'error']);
export const RecipeTabStatusSchema = z.enum(['ready', 'loading', 'error']);
export const RecipeActionStateStatusSchema = z.enum(['idle', 'running', 'completed', 'error']);
export const RecipeCollectionSortSchema = z
    .object({
    fieldKey: z.string().min(1),
    direction: z.enum(['asc', 'desc']).default('asc')
})
    .strict();
export const RecipeEntitySchema = z
    .object({
    id: z.string().min(1),
    kind: z.string().min(1),
    title: z.string().min(1),
    subtitle: OptionalTextSchema,
    description: OptionalTextSchema,
    badges: z.array(z.string().min(1)).default([]),
    fields: z.array(RecipeNormalizedFieldSchema).default([]),
    links: z.array(RecipeLinkSchema).default([]),
    image: RecipeImageSchema.optional(),
    stats: z.array(RecipeSummaryStatSchema).default([]),
    status: OptionalTextSchema,
    notes: z.array(z.string().min(1)).default([]),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeCollectionSchema = z
    .object({
    id: z.string().min(1),
    label: z.string().min(1),
    entityKind: z.string().min(1),
    entityIds: z.array(z.string().min(1)).default([]),
    preferredView: RecipeCollectionPreferredViewSchema.default('table'),
    fieldKeys: z.array(z.string().min(1)).default([]),
    pageSize: z.number().int().positive().max(50).default(6),
    selectionMode: RecipeCollectionSelectionModeSchema.default('multiple'),
    detailEntityId: z.string().min(1).nullable().default(null),
    filterKeys: z.array(z.string().min(1)).default([]),
    sort: RecipeCollectionSortSchema.optional(),
    emptyState: z.lazy(() => RecipeUiMessageSchema).default({
        title: 'No items',
        description: 'Nothing is available for this collection yet.'
    }),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeViewSchema = z
    .object({
    id: z.string().min(1),
    label: z.string().min(1),
    sectionIds: z.array(z.string().min(1)).default([]),
    layout: RecipeViewLayoutSchema.default('stack'),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeSectionSchema = z
    .object({
    id: z.string().min(1),
    kind: RecipeSectionKindSchema,
    title: OptionalTextSchema,
    description: OptionalTextSchema,
    collectionId: z.string().min(1).nullable().default(null),
    entityId: z.string().min(1).nullable().default(null),
    actionIds: z.array(z.string().min(1)).default([]),
    fieldKeys: z.array(z.string().min(1)).default([]),
    status: RecipeSectionStatusSchema.default('ready'),
    body: OptionalTextSchema,
    emptyState: z.lazy(() => RecipeUiMessageSchema).optional(),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeDslTabSchema = z
    .object({
    id: z.string().min(1),
    label: z.string().min(1),
    viewId: z.string().min(1),
    status: RecipeTabStatusSchema.default('ready'),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeCollectionStateSchema = z
    .object({
    selectedEntityIds: z.array(z.string().min(1)).default([]),
    page: z.number().int().positive().default(1),
    filters: z.record(z.string().min(1), z.string()).default({}),
    sort: RecipeCollectionSortSchema.optional()
})
    .strict();
export const RecipeActionStateSchema = z
    .object({
    status: RecipeActionStateStatusSchema.default('idle'),
    message: OptionalTextSchema
})
    .strict();
export const RecipeStateSchema = z
    .object({
    activeTabId: z.string().min(1).nullable().default(null),
    collectionState: z.record(z.string().min(1), RecipeCollectionStateSchema).default({}),
    formState: z
        .record(z.string().min(1), z.record(z.string().min(1), z.union([z.string(), z.number(), z.boolean(), z.null()])))
        .default({}),
    actionState: z.record(z.string().min(1), RecipeActionStateSchema).default({}),
    localState: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const LegacyRecipeDslRecipeSchema = z
    .object({
    id: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    subtitle: OptionalTextSchema,
    description: OptionalTextSchema,
    status: RecipeStatusSchema.optional(),
    primaryTabId: z.string().min(1).optional(),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const LegacyRecipeDslSemanticHintsSchema = z
    .object({
    primaryCollectionId: z.string().min(1).optional(),
    preferredLayout: RecipeViewLayoutSchema.optional(),
    preferredSectionKinds: z.array(RecipeSectionKindSchema).default([]),
    narrowPaneStrategy: z.enum(['stack', 'tabs', 'split']).default('stack'),
    notes: z.array(z.string().min(1)).default([])
})
    .strict();
export const RecipeDslDatasetDisplaySchema = z.enum([
    'table',
    'list',
    'cards',
    'detail',
    'markdown',
    'comparison',
    'timeline',
    'media'
]);
export const RecipeDslActionKindSchema = z.enum(['existing_action']);
export const RecipeDslActionPlacementSchema = z.enum(['toolbar', 'section', 'inline']);
export const RecipeDslActionReferenceSchema = z
    .object({
    kind: RecipeDslActionKindSchema.default('existing_action'),
    id: z.string().min(1),
    label: OptionalTextSchema,
    placement: RecipeDslActionPlacementSchema.default('toolbar'),
    datasetId: z.string().min(1).optional(),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeDslSectionTypeSchema = z.enum([
    'summary',
    'dataset',
    'comparison',
    'detail',
    'stats',
    'markdown',
    'media',
    'links',
    'notes',
    'actions',
    'callout',
    'timeline',
    'status'
]);
export const RecipeDslDatasetSchema = z
    .object({
    id: z.string().min(1),
    title: OptionalTextSchema,
    summary: OptionalTextSchema,
    display: RecipeDslDatasetDisplaySchema.optional(),
    fields: z.array(z.string().min(1)).default([]),
    focusEntityId: z.string().min(1).nullable().default(null),
    notes: z.array(z.string().min(1)).default([]),
    emptyState: z.lazy(() => RecipeUiMessageSchema).optional(),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeDslSectionSchema = z
    .object({
    id: z.string().min(1),
    type: RecipeDslSectionTypeSchema,
    title: OptionalTextSchema,
    summary: OptionalTextSchema,
    datasetId: z.string().min(1).optional(),
    body: OptionalTextSchema,
    fields: z.array(z.string().min(1)).default([]),
    entityIds: z.array(z.string().min(1)).default([]),
    actionIds: z.array(z.string().min(1)).default([]),
    links: z.array(RecipeLinkSchema).default([]),
    media: z.array(RecipeImageSchema).default([]),
    stats: z.array(RecipeSummaryStatSchema).default([]),
    emptyState: z.lazy(() => RecipeUiMessageSchema).optional(),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeAuthoringDslTabSchema = z
    .object({
    id: z.string().min(1),
    label: z.string().min(1),
    summary: OptionalTextSchema,
    sectionIds: z.array(z.string().min(1)).min(1),
    layout: RecipeViewLayoutSchema.default('stack'),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeDslOperationSchema = z.discriminatedUnion('op', [
    z
        .object({
        op: z.literal('update_dataset'),
        dataset: RecipeDslDatasetSchema
    })
        .strict(),
    z
        .object({
        op: z.literal('replace_section'),
        section: RecipeDslSectionSchema
    })
        .strict(),
    z
        .object({
        op: z.literal('remove_section'),
        sectionId: z.string().min(1)
    })
        .strict(),
    z
        .object({
        op: z.literal('update_tab'),
        tab: RecipeAuthoringDslTabSchema
    })
        .strict(),
    z
        .object({
        op: z.literal('set_active_tab'),
        tabId: z.string().min(1)
    })
        .strict(),
    z
        .object({
        op: z.literal('append_notes'),
        notes: z.array(z.string().min(1)).min(1)
    })
        .strict(),
    z
        .object({
        op: z.literal('set_selection'),
        datasetId: z.string().min(1),
        entityIds: z.array(z.string().min(1)).default([])
    })
        .strict(),
    z
        .object({
        op: z.literal('set_status'),
        status: RecipeStatusSchema,
        message: OptionalTextSchema
    })
        .strict(),
    z
        .object({
        op: z.literal('set_action_state'),
        actionId: z.string().min(1),
        state: RecipeActionStateSchema
    })
        .strict()
]);
export const RecipeDslSemanticHintsSchema = z
    .object({
    primaryDatasetId: z.string().min(1).optional(),
    preferredLayout: RecipeViewLayoutSchema.optional(),
    narrowPaneStrategy: z.enum(['stack', 'tabs', 'split']).default('stack'),
    notes: z.array(z.string().min(1)).default([])
})
    .strict();
export const RecipeModelSchema = z
    .object({
    kind: z.literal('recipe_model'),
    schemaVersion: z.literal('recipe_model/v1'),
    sdkVersion: RecipeSdkVersionSchema.default('recipe_sdk/v1'),
    revision: z.number().int().nonnegative().default(1),
    title: z.string().min(1),
    subtitle: OptionalTextSchema,
    description: OptionalTextSchema,
    status: RecipeStatusSchema.default('active'),
    entities: z.array(RecipeEntitySchema).default([]),
    collections: z.array(RecipeCollectionSchema).default([]),
    views: z.array(RecipeViewSchema).default([]),
    sections: z.array(RecipeSectionSchema).default([]),
    tabs: z.array(RecipeDslTabSchema).default([]),
    actions: z.array(RecipeActionDefinitionSchema).default([]),
    state: RecipeStateSchema.default({
        activeTabId: null,
        collectionState: {},
        formState: {},
        actionState: {},
        localState: {}
    }),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipePatchTargetStatusSchema = z.enum(['recipe', 'entity', 'section', 'tab', 'action']);
export const RecipePatchOperationSchema = z.discriminatedUnion('op', [
    z
        .object({
        op: z.literal('upsert_entities'),
        entities: z.array(RecipeEntitySchema).min(1)
    })
        .strict(),
    z
        .object({
        op: z.literal('remove_entities'),
        entityIds: z.array(z.string().min(1)).min(1)
    })
        .strict(),
    z
        .object({
        op: z.literal('update_collection'),
        collection: RecipeCollectionSchema
    })
        .strict(),
    z
        .object({
        op: z.literal('remove_collection'),
        collectionId: z.string().min(1)
    })
        .strict(),
    z
        .object({
        op: z.literal('reorder_collection'),
        collectionId: z.string().min(1),
        entityIds: z.array(z.string().min(1)).default([])
    })
        .strict(),
    z
        .object({
        op: z.literal('create_tab'),
        tab: RecipeDslTabSchema
    })
        .strict(),
    z
        .object({
        op: z.literal('update_tab'),
        tab: RecipeDslTabSchema
    })
        .strict(),
    z
        .object({
        op: z.literal('remove_tab'),
        tabId: z.string().min(1)
    })
        .strict(),
    z
        .object({
        op: z.literal('replace_view'),
        view: RecipeViewSchema
    })
        .strict(),
    z
        .object({
        op: z.literal('remove_view'),
        viewId: z.string().min(1)
    })
        .strict(),
    z
        .object({
        op: z.literal('replace_section'),
        section: RecipeSectionSchema
    })
        .strict(),
    z
        .object({
        op: z.literal('remove_section'),
        sectionId: z.string().min(1)
    })
        .strict(),
    z
        .object({
        op: z.literal('replace_actions'),
        actions: z.array(RecipeActionDefinitionSchema).default([])
    })
        .strict(),
    z
        .object({
        op: z.literal('set_selection'),
        collectionId: z.string().min(1),
        entityIds: z.array(z.string().min(1)).default([])
    })
        .strict(),
    z
        .object({
        op: z.literal('append_notes'),
        target: z.enum(['recipe', 'entity']),
        entityId: z.string().min(1).optional(),
        notes: z.array(z.string().min(1)).min(1)
    })
        .strict(),
    z
        .object({
        op: z.literal('set_status'),
        target: RecipePatchTargetStatusSchema,
        targetId: z.string().min(1).optional(),
        status: z.string().min(1),
        message: OptionalTextSchema
    })
        .strict(),
    z
        .object({
        op: z.literal('set_action_state'),
        actionId: z.string().min(1),
        state: RecipeActionStateSchema
    })
        .strict()
]);
export const RecipePatchSchema = z
    .object({
    kind: z.literal('recipe_patch'),
    schemaVersion: z.literal('recipe_patch/v1'),
    sdkVersion: RecipeSdkVersionSchema.default('recipe_sdk/v1'),
    baseRevision: z.number().int().nonnegative().default(0),
    nextRevision: z.number().int().nonnegative().default(1),
    summary: z.string().min(1),
    operations: z.array(RecipePatchOperationSchema).default([])
})
    .strict();
export const LegacyRecipeDslSchema = z
    .object({
    kind: z.literal('recipe_dsl'),
    schemaVersion: z.literal('recipe_dsl/v1'),
    sdkVersion: RecipeSdkVersionSchema.default('recipe_sdk/v1'),
    summary: z.string().min(1),
    recipe: LegacyRecipeDslRecipeSchema.default({
        metadata: {}
    }),
    entities: z.array(RecipeEntitySchema).default([]),
    collections: z.array(RecipeCollectionSchema).default([]),
    views: z.array(RecipeViewSchema).default([]),
    sections: z.array(RecipeSectionSchema).default([]),
    tabs: z.array(RecipeAuthoringDslTabSchema).default([]),
    actions: z.array(RecipeActionDefinitionSchema).default([]),
    state: RecipeStateSchema.optional(),
    operations: z.array(RecipePatchOperationSchema).default([]),
    semanticHints: LegacyRecipeDslSemanticHintsSchema.default({
        preferredSectionKinds: [],
        notes: [],
        narrowPaneStrategy: 'stack'
    }),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeAuthoringDslSchema = z
    .object({
    kind: z.literal('recipe_dsl'),
    schemaVersion: z.literal('recipe_dsl/v2'),
    sdkVersion: RecipeSdkVersionSchema.default('recipe_sdk/v1'),
    title: z.string().min(1).optional(),
    subtitle: OptionalTextSchema,
    summary: z.string().min(1),
    status: RecipeStatusSchema.optional(),
    tabs: z.array(RecipeAuthoringDslTabSchema).min(1),
    datasets: z.array(RecipeDslDatasetSchema).default([]),
    sections: z.array(RecipeDslSectionSchema).default([]),
    actions: z.array(RecipeDslActionReferenceSchema).default([]),
    notes: z.array(z.string().min(1)).default([]),
    operations: z.array(RecipeDslOperationSchema).default([]),
    semanticHints: RecipeDslSemanticHintsSchema.default({
        notes: [],
        narrowPaneStrategy: 'stack'
    }),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeDslSchema = z.union([RecipeAuthoringDslSchema, LegacyRecipeDslSchema]);
export const RecipeAppletCapabilityKindSchema = z.enum([
    'prompt_action',
    'approved_api',
    'refresh_space',
    'open_link',
    'image',
    'network_image'
]);
export const RecipeAppletCapabilitySchema = z
    .object({
    id: z.string().min(1),
    kind: RecipeAppletCapabilityKindSchema,
    label: z.string().min(1),
    description: z.string().min(1),
    requiresConfirmation: z.boolean().default(false),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeAppletSmallPaneStrategySchema = z.enum(['single_column', 'sectioned', 'tabbed']);
export const RecipeAppletPlanSchema = z
    .object({
    kind: z.literal('applet_plan'),
    schemaVersion: z.literal('recipe_applet_plan/v1'),
    summary: z.string().min(1),
    nodeKinds: z.array(z.string().min(1)).default([]),
    datasets: z.array(z.string().min(1)).default([]),
    collections: z.array(z.string().min(1)).default([]),
    tabs: z.array(z.string().min(1)).default([]),
    actionIds: z.array(z.string().min(1)).default([]),
    notes: z.array(z.string().min(1)).default([])
})
    .strict();
export const RecipeAppletManifestSchema = z
    .object({
    kind: z.literal('applet_manifest'),
    schemaVersion: z.literal('recipe_applet_manifest/v1'),
    sdkVersion: RecipeSdkVersionSchema.default('recipe_sdk/v1'),
    title: z.string().min(1),
    summary: z.string().min(1),
    description: OptionalTextSchema,
    requestedCapabilities: z.array(RecipeAppletCapabilitySchema).default([]),
    actions: z.array(RecipeActionDefinitionSchema).default([]),
    declaredDatasets: z.array(z.string().min(1)).default([]),
    declaredCollections: z.array(z.string().min(1)).default([]),
    declaredTabs: z.array(z.string().min(1)).default([]),
    usesImages: z.boolean().default(false),
    usesTabs: z.boolean().default(false),
    usesPagination: z.boolean().default(false),
    supportsPatching: z.boolean().default(true),
    smallPaneStrategy: RecipeAppletSmallPaneStrategySchema.default('sectioned'),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeAppletSourceArtifactSchema = z
    .object({
    kind: z.literal('applet_source'),
    schemaVersion: z.literal('recipe_applet_source/v1'),
    entrypoint: z.literal('default').default('default'),
    source: z.string().min(1)
})
    .strict();
export const RecipeAppletTestSourceArtifactSchema = z
    .object({
    kind: z.literal('applet_test_source'),
    schemaVersion: z.literal('recipe_applet_test_source/v1'),
    source: z.string().min(1)
})
    .strict();
export const RecipeAppletNodeToneSchema = z.enum(['neutral', 'info', 'success', 'warning', 'danger', 'accent']);
export const RecipeAppletTextToneSchema = z.enum(['default', 'muted', 'success', 'warning', 'danger', 'accent']);
export const RecipeAppletActionIntentSchema = z.enum(['neutral', 'primary', 'secondary', 'danger']);
export const RecipeAppletRecordSourceSchema = z.enum(['selected', 'first', 'single']);
export const RecipeAppletTabNodeSchema = z.lazy(() => z
    .object({
    id: z.string().min(1),
    label: z.string().min(1),
    children: z.array(RecipeAppletNodeSchema).min(1)
})
    .strict());
export const RecipeAppletStackNodeSchema = z.lazy(() => z
    .object({
    id: z.string().min(1),
    kind: z.literal('stack'),
    gap: z.number().int().min(0).max(8).default(3),
    children: z.array(RecipeAppletNodeSchema).min(1)
})
    .strict());
export const RecipeAppletInlineNodeSchema = z.lazy(() => z
    .object({
    id: z.string().min(1),
    kind: z.literal('inline'),
    gap: z.number().int().min(0).max(8).default(2),
    wrap: z.boolean().default(true),
    children: z.array(RecipeAppletNodeSchema).min(1)
})
    .strict());
export const RecipeAppletGridNodeSchema = z.lazy(() => z
    .object({
    id: z.string().min(1),
    kind: z.literal('grid'),
    columns: z.union([z.literal(1), z.literal(2)]).default(1),
    gap: z.number().int().min(0).max(8).default(3),
    children: z.array(RecipeAppletNodeSchema).min(1)
})
    .strict());
export const RecipeAppletCardNodeSchema = z.lazy(() => z
    .object({
    id: z.string().min(1),
    kind: z.literal('card'),
    title: OptionalTextSchema,
    subtitle: OptionalTextSchema,
    eyebrow: OptionalTextSchema,
    tone: RecipeAppletNodeToneSchema.default('neutral'),
    actionIds: z.array(z.string().min(1)).default([]),
    children: z.array(RecipeAppletNodeSchema).default([])
})
    .strict());
export const RecipeAppletHeadingNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('heading'),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
    text: z.string().min(1)
})
    .strict();
export const RecipeAppletTextNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('text'),
    text: z.string(),
    tone: RecipeAppletTextToneSchema.default('default'),
    lineClamp: z.number().int().positive().max(6).optional()
})
    .strict();
export const RecipeAppletMarkdownNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('markdown'),
    markdown: z.string()
})
    .strict();
export const RecipeAppletBadgeNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('badge'),
    label: z.string().min(1),
    tone: RecipeAppletNodeToneSchema.default('neutral')
})
    .strict();
export const RecipeAppletStatNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('stat'),
    label: z.string().min(1),
    value: z.string().min(1),
    helpText: OptionalTextSchema,
    tone: RecipeAppletNodeToneSchema.default('neutral')
})
    .strict();
export const RecipeAppletTabsNodeSchema = z.lazy(() => z
    .object({
    id: z.string().min(1),
    kind: z.literal('tabs'),
    defaultTabId: OptionalTextSchema,
    tabs: z.array(RecipeAppletTabNodeSchema).min(1)
})
    .strict());
export const RecipeAppletTableNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('table'),
    datasetId: z.string().min(1),
    fieldKeys: z.array(z.string().min(1)).default([]),
    pageSize: z.number().int().positive().max(20).default(6),
    actionIds: z.array(z.string().min(1)).default([]),
    emptyState: RecipeUiMessageSchema
})
    .strict();
export const RecipeAppletListNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('list'),
    datasetId: z.string().min(1),
    fieldKeys: z.array(z.string().min(1)).default([]),
    pageSize: z.number().int().positive().max(20).default(6),
    actionIds: z.array(z.string().min(1)).default([]),
    emptyState: RecipeUiMessageSchema
})
    .strict();
export const RecipeAppletDetailPanelNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('detail_panel'),
    datasetId: z.string().min(1),
    source: RecipeAppletRecordSourceSchema.default('selected'),
    fieldKeys: z.array(z.string().min(1)).default([]),
    actionIds: z.array(z.string().min(1)).default([]),
    emptyState: RecipeUiMessageSchema
})
    .strict();
export const RecipeAppletPaginatorNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('paginator'),
    datasetId: z.string().min(1),
    pageSize: z.number().int().positive().max(20).default(6)
})
    .strict();
export const RecipeAppletImageNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('image'),
    src: z.string().url(),
    alt: z.string().min(1),
    fit: z.enum(['cover', 'contain']).default('cover'),
    maxHeight: z.number().int().positive().max(480).default(180)
})
    .strict();
export const RecipeAppletButtonNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('button'),
    label: z.string().min(1),
    actionId: z.string().min(1),
    intent: RecipeAppletActionIntentSchema.default('neutral')
})
    .strict();
export const RecipeAppletButtonGroupNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('button_group'),
    children: z.array(RecipeAppletButtonNodeSchema).min(1)
})
    .strict();
export const RecipeAppletInputNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('input'),
    fieldKey: z.string().min(1),
    label: z.string().min(1),
    placeholder: OptionalTextSchema
})
    .strict();
export const RecipeAppletSelectNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('select'),
    fieldKey: z.string().min(1),
    label: z.string().min(1),
    placeholder: OptionalTextSchema,
    options: z.array(RuntimeConfigOptionSchema).default([])
})
    .strict();
export const RecipeAppletTextareaNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('textarea'),
    fieldKey: z.string().min(1),
    label: z.string().min(1),
    placeholder: OptionalTextSchema
})
    .strict();
export const RecipeAppletDividerNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('divider')
})
    .strict();
export const RecipeAppletCalloutNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('callout'),
    tone: RecipeAppletNodeToneSchema.default('info'),
    title: z.string().min(1),
    description: z.string().min(1),
    actionIds: z.array(z.string().min(1)).default([])
})
    .strict();
export const RecipeAppletEmptyStateNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('empty_state'),
    title: z.string().min(1),
    description: z.string().min(1)
})
    .strict();
export const RecipeAppletErrorStateNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('error_state'),
    title: z.string().min(1),
    description: z.string().min(1)
})
    .strict();
export const RecipeAppletLoadingStateNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('loading_state'),
    title: z.string().min(1),
    description: z.string().min(1)
})
    .strict();
export const RecipeAppletSkeletonSectionNodeSchema = z
    .object({
    id: z.string().min(1),
    kind: z.literal('skeleton_section'),
    title: OptionalTextSchema,
    description: OptionalTextSchema,
    lines: z.number().int().positive().max(8).default(3)
})
    .strict();
export const RecipeAppletNodeSchema = z.lazy(() => z.union([
    RecipeAppletStackNodeSchema,
    RecipeAppletInlineNodeSchema,
    RecipeAppletGridNodeSchema,
    RecipeAppletCardNodeSchema,
    RecipeAppletHeadingNodeSchema,
    RecipeAppletTextNodeSchema,
    RecipeAppletMarkdownNodeSchema,
    RecipeAppletBadgeNodeSchema,
    RecipeAppletStatNodeSchema,
    RecipeAppletTabsNodeSchema,
    RecipeAppletTableNodeSchema,
    RecipeAppletListNodeSchema,
    RecipeAppletDetailPanelNodeSchema,
    RecipeAppletPaginatorNodeSchema,
    RecipeAppletImageNodeSchema,
    RecipeAppletButtonNodeSchema,
    RecipeAppletButtonGroupNodeSchema,
    RecipeAppletInputNodeSchema,
    RecipeAppletSelectNodeSchema,
    RecipeAppletTextareaNodeSchema,
    RecipeAppletDividerNodeSchema,
    RecipeAppletCalloutNodeSchema,
    RecipeAppletEmptyStateNodeSchema,
    RecipeAppletErrorStateNodeSchema,
    RecipeAppletLoadingStateNodeSchema,
    RecipeAppletSkeletonSectionNodeSchema
]));
export const RecipeAppletRenderTreeSchema = z
    .object({
    kind: z.literal('applet_render_tree'),
    schemaVersion: z.literal('recipe_applet_render_tree/v1'),
    root: z.array(RecipeAppletNodeSchema).min(1)
})
    .strict();
export const RecipeAppletVerificationCheckStatusSchema = z.enum(['passed', 'failed', 'skipped']);
export const RecipeAppletVerificationCheckSchema = z
    .object({
    status: RecipeAppletVerificationCheckStatusSchema,
    message: z.string().min(1)
})
    .strict();
export const RecipeAppletVerificationSchema = z
    .object({
    kind: z.literal('applet_verification'),
    schemaVersion: z.literal('recipe_applet_verification/v1'),
    status: z.enum(['passed', 'failed']),
    staticValidation: RecipeAppletVerificationCheckSchema,
    capabilityValidation: RecipeAppletVerificationCheckSchema,
    typecheck: RecipeAppletVerificationCheckSchema,
    generatedTests: RecipeAppletVerificationCheckSchema,
    renderSmoke: RecipeAppletVerificationCheckSchema,
    smallPaneSmoke: RecipeAppletVerificationCheckSchema,
    errors: z.array(z.string().min(1)).default([]),
    warnings: z.array(z.string().min(1)).default([]),
    checkedAt: z.string().datetime()
})
    .strict();
export const RecipeAppletStateSchema = z
    .object({
    activeBuild: RecipeBuildSchema.nullable().default(null),
    promotedBuildId: z.string().min(1).nullable().default(null),
    plan: RecipeAppletPlanSchema.optional(),
    manifest: RecipeAppletManifestSchema.optional(),
    renderTree: RecipeAppletRenderTreeSchema.optional(),
    verification: RecipeAppletVerificationSchema.optional()
})
    .strict();
export const RecipeTestCaseKindSchema = z.enum([
    'schema_valid',
    'render_smoke',
    'compact_layout',
    'pagination_valid',
    'actions_resolve',
    'destructive_requires_confirmation',
    'empty_state_present',
    'loading_state_present',
    'links_well_formed'
]);
export const RecipeTestSeveritySchema = z.enum(['critical', 'warning']);
export const RecipeTestCaseSchema = z
    .object({
    id: z.string().min(1),
    kind: RecipeTestCaseKindSchema,
    severity: RecipeTestSeveritySchema,
    sectionId: z.string().min(1).optional(),
    actionId: z.string().min(1).optional(),
    config: z.record(z.string().min(1), z.unknown()).default({})
})
    .strict();
export const RecipeTestSpecSchema = z
    .object({
    kind: z.literal('test_spec'),
    schemaVersion: z.literal('recipe_test_spec/v1'),
    cases: z.array(RecipeTestCaseSchema).min(1)
})
    .strict();
export const RecipeTestCaseResultSchema = z
    .object({
    id: z.string().min(1),
    kind: RecipeTestCaseKindSchema,
    severity: RecipeTestSeveritySchema,
    passed: z.boolean(),
    message: z.string().min(1),
    checkedAt: z.string().datetime()
})
    .strict();
export const RecipeTestResultsSchema = z
    .object({
    kind: z.literal('test_results'),
    schemaVersion: z.literal('recipe_test_results/v1'),
    status: z.enum(['passed', 'failed']),
    blockingFailureCount: z.number().int().nonnegative().default(0),
    results: z.array(RecipeTestCaseResultSchema).default([]),
    checkedAt: z.string().datetime()
})
    .strict();
export const RecipeSummarySchema = z
    .object({
    kind: z.literal('summary'),
    schemaVersion: z.literal('recipe_summary/v1'),
    title: z.string().min(1),
    subtitle: OptionalTextSchema,
    statusLabel: OptionalTextSchema,
    badges: z.array(z.string().min(1)).default([]),
    stats: z.array(RecipeSummaryStatSchema).default([]),
    links: z.array(RecipeLinkSchema).default([]),
    lastBuiltAt: OptionalDateTimeSchema,
    note: OptionalTextSchema
})
    .strict();
export const RecipeFallbackStateSchema = z
    .object({
    kind: z.literal('fallback'),
    schemaVersion: z.literal('recipe_fallback/v1'),
    title: z.string().min(1),
    message: z.string().min(1),
    summaryMarkdown: z.string().default(''),
    datasetPreview: z.array(RecipeNormalizedItemSchema).default([]),
    canRetry: z.boolean().default(true)
})
    .strict();
export const RecipeArtifactPayloadSchema = z.union([
    RecipeUserPromptArtifactSchema,
    RecipeIntentSchema,
    RecipeRawDataSchema,
    RecipeAnalysisSchema,
    RecipeNormalizedDataSchema,
    RecipeAssistantContextSchema,
    RecipeUiSpecSchema,
    RecipeActionSpecSchema,
    RecipeTemplateSelectionSchema,
    RecipeTemplateTextSchema,
    RecipeTemplateHydrationSchema,
    RecipeTemplateActionsSchema,
    RecipeTemplateFillSchema,
    RecipeTemplateUpdateSchema,
    RecipeTemplateStateSchema,
    RecipeDslSchema,
    RecipeModelSchema,
    RecipePatchSchema,
    RecipeTestSpecSchema,
    RecipeTestResultsSchema,
    RecipeSummarySchema,
    RecipeFallbackStateSchema,
    RecipeAppletPlanSchema,
    RecipeAppletManifestSchema,
    RecipeAppletSourceArtifactSchema,
    RecipeAppletTestSourceArtifactSchema,
    RecipeAppletRenderTreeSchema,
    RecipeAppletVerificationSchema
]);
const BaseRecipeArtifactSchema = z
    .object({
    id: z.string().min(1),
    recipeId: z.string().min(1),
    buildId: z.string().min(1),
    artifactKind: RecipeArtifactKindSchema,
    schemaVersion: z.string().min(1),
    payload: RecipeArtifactPayloadSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
})
    .strict();
export const RecipeArtifactSchema = BaseRecipeArtifactSchema
    .superRefine((value, context) => {
    if (value.artifactKind !== value.payload.kind) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['artifactKind'],
            message: 'Space artifact kinds must match the payload kind.'
        });
    }
    if (value.schemaVersion !== value.payload.schemaVersion) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['schemaVersion'],
            message: 'Space artifact schema versions must match the payload schema version.'
        });
    }
});
export const RecipeDynamicStateSchema = z
    .object({
    renderMode: RecipeRenderModeSchema.default('dynamic_v1'),
    activeBuild: RecipeBuildSchema.nullable().default(null),
    summary: RecipeSummarySchema.optional(),
    analysis: RecipeAnalysisSchema.optional(),
    normalizedData: RecipeNormalizedDataSchema.optional(),
    uiSpec: RecipeUiSpecSchema.optional(),
    actionSpec: RecipeActionSpecSchema.optional(),
    recipeTemplate: RecipeTemplateStateSchema.optional(),
    recipeDsl: RecipeDslSchema.optional(),
    recipeModel: RecipeModelSchema.optional(),
    latestRecipePatch: RecipePatchSchema.optional(),
    latestTestResults: RecipeTestResultsSchema.optional(),
    fallback: RecipeFallbackStateSchema.optional(),
    applet: RecipeAppletStateSchema.optional()
})
    .strict();
const rawRecipeSchema = z.object({
    schemaVersion: z.number().int().positive().default(5),
    id: z.string().min(1),
    profileId: z.string().min(1),
    primarySessionId: z.string().min(1),
    primaryRuntimeSessionId: z.string().min(1).nullable().default(null),
    title: z.string().min(1),
    description: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    status: RecipeStatusSchema.default('idle'),
    tabs: z.array(RecipeTabSchema).default([]),
    uiState: RecipeUiStateSchema.default({
        activeTab: 'content'
    }),
    lastUpdatedBy: z.string().min(1).optional(),
    source: RecipeSourceSchema.default('user'),
    metadata: RecipeMetadataSchema.default({
        changeVersion: 1,
        auditTags: []
    }),
    renderMode: RecipeRenderModeSchema.default('legacy_content_v1'),
    dynamic: RecipeDynamicStateSchema.optional()
});
export const RecipeSchema = rawRecipeSchema.superRefine((value, context) => {
    const contentTabs = value.tabs.filter((tab) => tab.kind === 'content');
    const duplicateTabIds = new Set();
    if (contentTabs.length !== 1) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tabs'],
            message: 'Spaces must contain exactly one content tab.'
        });
    }
    for (const tab of value.tabs) {
        if (duplicateTabIds.has(tab.id)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['tabs'],
                message: `Spaces cannot contain duplicate tab ids. Found multiple "${tab.id}" entries.`
            });
            break;
        }
        duplicateTabIds.add(tab.id);
    }
});
export const RecipeEventTypeSchema = z.enum(['created', 'updated', 'renamed', 'deleted', 'changed', 'linked_chat']);
export const RecipeEventSchema = z.object({
    id: z.string().min(1),
    profileId: z.string().min(1),
    recipeId: z.string().min(1),
    recipeTitle: z.string().min(1),
    type: RecipeEventTypeSchema,
    message: z.string().min(1),
    source: RecipeSourceSchema.default('bridge'),
    sessionId: z.string().min(1).nullable().default(null),
    createdAt: z.string().datetime(),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
});
