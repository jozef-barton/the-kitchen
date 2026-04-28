import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import type {
  AppSettings,
  AuditEvent,
  ChatActivity,
  ChatMessage,
  Job,
  JobsFreshness,
  Profile,
  ProviderConnection,
  RuntimeActivityHistoryEntry,
  RuntimeRequest,
  RuntimeProviderOption,
  RuntimeModelConfig,
  Session,
  SessionAssociationSource,
  RecipeAppletManifest,
  RecipeAppletPlan,
  RecipeAppletRenderTree,
  RecipeAppletVerification,
  RecipeActionSpec,
  RecipeAnalysis,
  RecipeArtifact,
  RecipeBuild,
  RecipeBuildLog,
  RecipeFallbackState,
  RecipeNormalizedData,
  Recipe,
  RecipeEvent,
  RecipeSummary,
  RecipeTab,
  RecipeTestResults,
  RecipeUiSpec,
  Skill,
  TelemetryEvent,
  Tool,
  ToolExecution,
  UiState,
  RecipeTemplateState,
  RecipeDsl,
  RecipeModel,
  RecipePatch,
  RecipePipelineState,
  UploadedFile,
  UploadedFileKind
} from '@hermes-recipes/protocol';
import {
  AppSettingsSchema,
  AuditEventSchema,
  ChatActivitySchema,
  ChatMessageSchema,
  JobSchema,
  JobsFreshnessSchema,
  ProfileSchema,
  ProviderConnectionSchema,
  RuntimeActivityHistoryEntrySchema,
  RuntimeRequestSchema,
  RuntimeProviderOptionSchema,
  RuntimeModelConfigSchema,
  SessionSchema,
  RecipeAppletManifestSchema,
  RecipeAppletPlanSchema,
  RecipeAppletRenderTreeSchema,
  RecipeAppletVerificationSchema,
  RecipeActionSpecSchema,
  RecipeAnalysisSchema,
  RecipeArtifactSchema,
  RecipeBuildLogSchema,
  RecipeBuildSchema,
  RecipeEventSchema,
  RecipeFallbackStateSchema,
  RecipeNormalizedDataSchema,
  RecipeSchema,
  RecipeSummarySchema,
  RecipeTestResultsSchema,
  RecipeUiSpecSchema,
  SkillSchema,
  TelemetryEventSchema,
  ToolExecutionSchema,
  ToolSchema,
  UiStateSchema,
  RecipeTemplateStateSchema,
  RecipeDslSchema,
  RecipeModelSchema,
  RecipePatchSchema,
  RecipePipelineStateSchema
} from '@hermes-recipes/protocol';
import {
  getRecipeContentTab,
  getRecipeContentViewData,
  normalizeLegacyRecipeTabs,
  normalizeRecipeTabs,
  normalizeRecipeUiState
} from '@hermes-recipes/protocol';
import { bridgeReviewedShellToolId, reviewedShellCommandAllowlist } from '../reviewed-tools';
import { normalizeMessageForPersistence, normalizePersistedSessionMessages } from '../transcript-runtime';
import { classifySessionVisibility } from './session-filter-rules';

function parseJson<T>(value: string | null | undefined, fallback: T) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function sortSessionIds(sessionIds: string[], limit = 10) {
  const deduped: string[] = [];
  for (const sessionId of sessionIds) {
    if (!sessionId || deduped.includes(sessionId)) {
      continue;
    }
    deduped.push(sessionId);
  }
  return deduped.slice(0, limit);
}

function normalizeRecentSessionsByProfile(value: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(value).map(([profileId, sessionIds]) => [profileId, sortSessionIds(sessionIds ?? [])])
  );
}

function normalizeActiveIdsByProfile(value: Record<string, string | null>) {
  return Object.fromEntries(
    Object.entries(value).map(([profileId, sessionId]) => [profileId, sessionId && sessionId.length > 0 ? sessionId : null])
  );
}

function isTranscriptVisibleMessage(message: Pick<ChatMessage, 'visibility' | 'kind'>) {
  return message.visibility === 'transcript' && message.kind !== 'technical';
}

function summarizeVisibleMessages(messages: ChatMessage[], fallbackSummary: string) {
  const visibleMessages = messages.filter(isTranscriptVisibleMessage);
  const lastVisibleMessage = [...visibleMessages]
    .reverse()
    .find((message) => message.role === 'assistant' || message.role === 'user' || message.role === 'system');

  return {
    visibleMessages,
    messageCount: visibleMessages.length,
    summary: lastVisibleMessage ? truncate(lastVisibleMessage.content.trim() || fallbackSummary, 96) : fallbackSummary,
    lastUpdatedAt: lastVisibleMessage?.createdAt ?? null
  };
}

const sessionTitleStopWords = new Set([
  'a',
  'an',
  'and',
  'are',
  'at',
  'be',
  'build',
  'by',
  'can',
  'check',
  'could',
  'create',
  'did',
  'do',
  'does',
  'draft',
  'explain',
  'find',
  'for',
  'from',
  'get',
  'give',
  'good',
  'have',
  'help',
  'how',
  'i',
  'in',
  'into',
  'is',
  'it',
  'let',
  'look',
  'make',
  'me',
  'my',
  'near',
  'of',
  'on',
  'or',
  'please',
  'show',
  'summarize',
  'tell',
  'the',
  'to',
  'also',
  'change',
  'convert',
  'different',
  'format',
  'instead',
  'just',
  'like',
  'list',
  'more',
  'now',
  'other',
  'refresh',
  'same',
  'some',
  'step',
  'switch',
  'this',
  'turn',
  'use',
  'using',
  'update',
  'want',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'with',
  'would',
  'you',
  'your'
]);

function formatSessionTitleToken(token: string) {
  if (/^[A-Z0-9]{2,}$/u.test(token)) {
    return token;
  }

  return `${token.slice(0, 1).toUpperCase()}${token.slice(1).toLowerCase()}`;
}

function generateSessionTitle(candidate: string, fallbackTitle: string) {
  const normalized = candidate
    .replace(/\s+/gu, ' ')
    .replace(/^[`"'“”]+|[`"'“”]+$/gu, '')
    .trim();

  if (!normalized) {
    return fallbackTitle;
  }

  const firstClause =
    normalized
      .split(/\n+/u)
      .map((line) => line.trim())
      .find(Boolean)
      ?.split(/[.?!]/u)[0]
      ?.trim() ?? normalized;
  const tokens = firstClause.match(/[A-Za-z0-9]+(?:[/-][A-Za-z0-9]+)*/gu) ?? [];
  // Deduplicate: keep only the first occurrence of each lowercased keyword so
  // repeated words like "step step" in the source don't produce "Step Step".
  const seenLower = new Set<string>();
  const keywords = tokens
    .filter((token) => {
      const lower = token.toLowerCase();
      if (token.length <= 1 || sessionTitleStopWords.has(lower) || seenLower.has(lower)) return false;
      seenLower.add(lower);
      return true;
    })
    .slice(0, 6);
  const title =
    keywords.length >= 2
      ? keywords.map((token) => formatSessionTitleToken(token)).join(' ')
      : firstClause.replace(/^[^A-Za-z0-9]+|[,:;]+$/gu, '').trim();

  return truncate(title || fallbackTitle, 64);
}

function scoreSessionTitle(title: string, candidateSource: string) {
  const normalizedTitle = title.replace(/\s+/gu, ' ').trim();
  if (!normalizedTitle || normalizedTitle === 'New session') {
    return 0;
  }

  const titleTokens = normalizedTitle.match(/[A-Za-z0-9]+(?:[/-][A-Za-z0-9]+)*/gu) ?? [];
  const titleKeywords = titleTokens
    .map((token) => token.toLowerCase())
    .filter((token) => token.length > 1 && !sessionTitleStopWords.has(token));
  const sourceTokens = candidateSource.match(/[A-Za-z0-9]+(?:[/-][A-Za-z0-9]+)*/gu) ?? [];
  const sourceKeywords = new Set(
    sourceTokens.map((token) => token.toLowerCase()).filter((token) => token.length > 1 && !sessionTitleStopWords.has(token))
  );
  const overlappingKeywords = titleKeywords.filter((token) => sourceKeywords.has(token));

  let score = titleKeywords.length * 2 + overlappingKeywords.length * 2;
  if (normalizedTitle.length >= 18 && normalizedTitle.length <= 48) {
    score += 2;
  } else if (normalizedTitle.length >= 10) {
    score += 1;
  } else {
    score -= 2;
  }
  if (/^(can|could|would|please|help|i|we|tell|show|find|make|create|build|give|what|how|why)\b/i.test(normalizedTitle)) {
    score -= 3;
  }
  if (normalizedTitle.endsWith('?')) {
    score -= 1;
  }

  return score;
}

function resolveAutoSessionTitle(
  currentTitle: string,
  candidateSource: string,
  options: {
    titleOverride?: string | null;
  } = {}
) {
  if (options.titleOverride) {
    return currentTitle;
  }

  const nextTitle = generateSessionTitle(candidateSource, currentTitle);
  if (!nextTitle || nextTitle === currentTitle) {
    return currentTitle;
  }

  if (currentTitle === 'New session') {
    return nextTitle;
  }

  const currentScore = scoreSessionTitle(currentTitle, candidateSource);
  const nextScore = scoreSessionTitle(nextTitle, candidateSource);
  if (nextScore >= Math.max(5, currentScore + 2)) {
    return nextTitle;
  }

  if (currentTitle.length > 48 && nextScore > currentScore) {
    return nextTitle;
  }

  return currentTitle;
}

function isNewerThanDeletedAt(candidateTimestamp: string | null | undefined, deletedAt: string | null | undefined) {
  if (!candidateTimestamp || !deletedAt) {
    return false;
  }

  const candidate = Date.parse(candidateTimestamp);
  const deleted = Date.parse(deletedAt);
  if (Number.isNaN(candidate) || Number.isNaN(deleted)) {
    return false;
  }

  return candidate > deleted;
}

function isFinalActivityState(state: ChatActivity['state']) {
  return state === 'completed' || state === 'failed' || state === 'cancelled' || state === 'denied';
}

function isFinalRuntimeRequestStatus(status: RuntimeRequest['status'] | null | undefined) {
  return status === 'completed' || status === 'failed' || status === 'cancelled' || status === 'denied';
}

function fallbackActivityStateForRequestStatus(status: RuntimeRequest['status']): ChatActivity['state'] {
  switch (status) {
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    case 'denied':
      return 'denied';
    case 'completed':
      return 'completed';
    default:
      return 'completed';
  }
}

function runtimeRequestStatusPriority(status: RuntimeRequest['status']) {
  switch (status) {
    case 'failed':
      return 5;
    case 'denied':
      return 4;
    case 'cancelled':
      return 3;
    case 'completed':
      return 2;
    case 'running':
      return 1;
    case 'idle':
    default:
      return 0;
  }
}

function mergeRuntimeRequestStatus(current: RuntimeRequest['status'], incoming: RuntimeRequest['status']) {
  return runtimeRequestStatusPriority(incoming) > runtimeRequestStatusPriority(current) ? incoming : current;
}

function activityGroupKey(activity: Pick<ChatActivity, 'kind' | 'label' | 'command'>) {
  return `${activity.kind}:${activity.label}:${activity.command ?? ''}`;
}

function isTerminalRecipeBuildPhase(phase: RecipeBuild['phase']) {
  return phase === 'ready' || phase === 'failed';
}

function isPrimaryRecipeBuildKind(buildKind: RecipeBuild['buildKind']) {
  return buildKind === 'compiled_home' || buildKind === 'dsl_enrichment' || buildKind === 'template_enrichment';
}

export class BridgeDatabase {
  private readonly database: DatabaseSync;

  constructor(public readonly filePath: string) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    this.database = new DatabaseSync(filePath);
    this.database.exec('PRAGMA journal_mode = WAL;');
    this.database.exec('PRAGMA foreign_keys = ON;');
    this.migrate();
    this.ensureDefaults();
  }

  close() {
    this.database.close();
  }

  private hasColumn(tableName: string, columnName: string) {
    const columns = this.database.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
    return columns.some((column) => column.name === columnName);
  }

  private ensureColumn(tableName: string, columnName: string, columnSql: string) {
    if (this.hasColumn(tableName, columnName)) {
      return;
    }

    this.database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnSql};`);
  }

  private migrate() {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS app_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        path TEXT,
        model TEXT,
        gateway TEXT,
        alias TEXT,
        is_active INTEGER NOT NULL DEFAULT 0,
        last_synced_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        runtime_session_id TEXT UNIQUE,
        title TEXT NOT NULL,
        title_override TEXT,
        summary TEXT NOT NULL,
        source TEXT NOT NULL,
        last_updated_at TEXT NOT NULL,
        last_used_profile_id TEXT,
        linked_space_id TEXT,
        deleted_at TEXT,
        deletion_mode TEXT,
        message_count INTEGER NOT NULL DEFAULT 0,
        last_message_sync_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS sessions_last_updated_idx ON sessions(last_updated_at DESC);

      CREATE TABLE IF NOT EXISTS session_profile_associations (
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_interacted_at TEXT NOT NULL,
        PRIMARY KEY (session_id, profile_id)
      );

      CREATE INDEX IF NOT EXISTS session_profile_associations_profile_idx
        ON session_profile_associations(profile_id, last_interacted_at DESC);

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL,
        metadata_json TEXT NOT NULL DEFAULT '{}'
      );

      CREATE INDEX IF NOT EXISTS messages_session_created_idx ON messages(session_id, created_at ASC);

      CREATE TABLE IF NOT EXISTS job_freshness (
        profile_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        source TEXT NOT NULL,
        last_requested_at TEXT,
        last_successful_at TEXT,
        last_error TEXT
      );

      CREATE TABLE IF NOT EXISTS jobs (
        profile_id TEXT NOT NULL,
        id TEXT NOT NULL,
        label TEXT NOT NULL,
        schedule TEXT NOT NULL,
        status TEXT NOT NULL,
        description TEXT NOT NULL,
        last_run TEXT NOT NULL,
        next_run TEXT NOT NULL,
        last_synced_at TEXT NOT NULL,
        PRIMARY KEY (profile_id, id)
      );

      CREATE TABLE IF NOT EXISTS tools (
        id TEXT PRIMARY KEY,
        profile_id TEXT,
        source TEXT NOT NULL,
        scope TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        enabled INTEGER NOT NULL,
        status TEXT NOT NULL,
        approval_model TEXT NOT NULL,
        capabilities_json TEXT NOT NULL DEFAULT '[]',
        restrictions_json TEXT NOT NULL DEFAULT '[]',
        last_synced_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tool_executions (
        id TEXT PRIMARY KEY,
        tool_id TEXT NOT NULL,
        profile_id TEXT,
        session_id TEXT,
        summary TEXT NOT NULL,
        command TEXT NOT NULL,
        args_json TEXT NOT NULL DEFAULT '[]',
        cwd TEXT,
        status TEXT NOT NULL,
        requested_at TEXT NOT NULL,
        resolved_at TEXT,
        stdout TEXT,
        stderr TEXT,
        exit_code INTEGER
      );

      CREATE INDEX IF NOT EXISTS tool_executions_requested_idx ON tool_executions(requested_at DESC);

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        theme_mode TEXT NOT NULL,
        sessions_page_size INTEGER NOT NULL,
        chat_timeout_ms INTEGER NOT NULL,
        discovery_timeout_ms INTEGER NOT NULL DEFAULT 240000,
        nearby_search_timeout_ms INTEGER NOT NULL DEFAULT 300000,
        space_operation_timeout_ms INTEGER NOT NULL DEFAULT 180000,
        unrestricted_timeout_ms INTEGER NOT NULL DEFAULT 1800000,
        restricted_chat_max_turns INTEGER NOT NULL DEFAULT 8,
        unrestricted_access_enabled INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS ui_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        active_profile_id TEXT,
        active_session_id TEXT,
        recent_session_ids_json TEXT NOT NULL,
        current_page TEXT NOT NULL,
        active_session_ids_json TEXT NOT NULL DEFAULT '{}',
        active_space_ids_json TEXT NOT NULL DEFAULT '{}',
        recent_session_ids_by_profile_json TEXT NOT NULL DEFAULT '{}',
        tools_tab TEXT NOT NULL DEFAULT 'all',
        recipes_tab TEXT NOT NULL DEFAULT 'recipes',
        sidebar_collapsed INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        source TEXT NOT NULL,
        trust TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS skills_profile_idx ON skills(profile_id, category, name);

      CREATE TABLE IF NOT EXISTS provider_connections (
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        auth_kind TEXT NOT NULL,
        status TEXT NOT NULL,
        credential_label TEXT,
        masked_credential TEXT,
        source TEXT NOT NULL,
        supports_api_key INTEGER NOT NULL DEFAULT 0,
        supports_oauth INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        last_synced_at TEXT NOT NULL,
        PRIMARY KEY (profile_id, id)
      );

      CREATE INDEX IF NOT EXISTS provider_connections_profile_idx ON provider_connections(profile_id, status, display_name);

      CREATE TABLE IF NOT EXISTS runtime_model_configs (
        profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
        default_model TEXT NOT NULL,
        provider TEXT NOT NULL,
        base_url TEXT,
        api_mode TEXT,
        max_turns INTEGER NOT NULL,
        reasoning_effort TEXT,
        tool_use_enforcement TEXT,
        last_synced_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS runtime_provider_catalogs (
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL,
        PRIMARY KEY (profile_id, id)
      );

      CREATE INDEX IF NOT EXISTS runtime_provider_catalogs_profile_idx
        ON runtime_provider_catalogs(profile_id, last_synced_at DESC, id ASC);

      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        schema_version INTEGER NOT NULL DEFAULT 5,
        title TEXT NOT NULL,
        description TEXT,
        view_type TEXT NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL DEFAULT '{}',
        tabs_json TEXT NOT NULL DEFAULT '[]',
        ui_state_json TEXT NOT NULL DEFAULT '{}',
        primary_session_id TEXT,
        primary_runtime_session_id TEXT,
        linked_session_id TEXT,
        linked_runtime_session_id TEXT,
        last_updated_by TEXT,
        source TEXT NOT NULL,
        metadata_json TEXT NOT NULL DEFAULT '{}',
        render_mode TEXT NOT NULL DEFAULT 'legacy_content_v1',
        active_build_id TEXT,
        ready_build_id TEXT,
        active_applet_build_id TEXT,
        ready_applet_build_id TEXT,
        build_error_code TEXT,
        build_error_message TEXT,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS recipes_profile_idx
        ON recipes(profile_id, updated_at DESC, title ASC);

      CREATE TABLE IF NOT EXISTS recipe_events (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        space_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        space_title TEXT NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        source TEXT NOT NULL,
        session_id TEXT,
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS recipe_events_profile_idx
        ON recipe_events(profile_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS recipe_events_space_idx
        ON recipe_events(space_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS recipe_builds (
        id TEXT PRIMARY KEY,
        space_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
        build_version INTEGER NOT NULL,
        build_kind TEXT NOT NULL DEFAULT 'compiled_home',
        trigger_kind TEXT NOT NULL,
        trigger_request_id TEXT,
        trigger_action_id TEXT,
        phase TEXT NOT NULL,
        progress_message TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        started_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        error_code TEXT,
        error_message TEXT,
        error_detail TEXT,
        failure_category TEXT,
        failure_stage TEXT,
        user_facing_message TEXT,
        retryable INTEGER,
        configured_timeout_ms INTEGER
      );

      CREATE INDEX IF NOT EXISTS recipe_builds_space_idx
        ON recipe_builds(space_id, started_at DESC, build_version DESC);

      CREATE INDEX IF NOT EXISTS recipe_builds_profile_idx
        ON recipe_builds(profile_id, started_at DESC);

      CREATE TABLE IF NOT EXISTS recipe_build_artifacts (
        id TEXT PRIMARY KEY,
        space_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        build_id TEXT NOT NULL REFERENCES recipe_builds(id) ON DELETE CASCADE,
        artifact_kind TEXT NOT NULL,
        schema_version TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS recipe_build_artifacts_kind_idx
        ON recipe_build_artifacts(build_id, artifact_kind);

      CREATE INDEX IF NOT EXISTS recipe_build_artifacts_space_idx
        ON recipe_build_artifacts(space_id, updated_at DESC);

      CREATE TABLE IF NOT EXISTS recipe_build_logs (
        id TEXT PRIMARY KEY,
        space_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        build_id TEXT NOT NULL REFERENCES recipe_builds(id) ON DELETE CASCADE,
        phase TEXT NOT NULL,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        detail TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS recipe_build_logs_build_idx
        ON recipe_build_logs(build_id, created_at ASC);

      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        profile_id TEXT,
        session_id TEXT,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS runtime_requests (
        request_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
        preview TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        last_error TEXT,
        metadata_json TEXT NOT NULL DEFAULT '{}'
      );

      CREATE INDEX IF NOT EXISTS runtime_requests_session_idx
        ON runtime_requests(session_id, started_at ASC, updated_at ASC);

      CREATE TABLE IF NOT EXISTS runtime_activities (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL REFERENCES runtime_requests(request_id) ON DELETE CASCADE,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
        activity_key TEXT NOT NULL,
        kind TEXT NOT NULL,
        state TEXT NOT NULL,
        label TEXT NOT NULL,
        detail TEXT,
        command TEXT,
        started_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        metadata_json TEXT NOT NULL DEFAULT '{}'
      );

      CREATE INDEX IF NOT EXISTS runtime_activities_request_idx
        ON runtime_activities(request_id, started_at ASC, updated_at ASC);

      CREATE INDEX IF NOT EXISTS runtime_activities_session_idx
        ON runtime_activities(session_id, started_at ASC, updated_at ASC);

      CREATE TABLE IF NOT EXISTS telemetry_events (
        id TEXT PRIMARY KEY,
        profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
        session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
        request_id TEXT REFERENCES runtime_requests(request_id) ON DELETE CASCADE,
        severity TEXT NOT NULL,
        category TEXT NOT NULL,
        code TEXT NOT NULL,
        message TEXT NOT NULL,
        detail TEXT,
        payload_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS telemetry_events_created_idx
        ON telemetry_events(created_at DESC);

      CREATE INDEX IF NOT EXISTS telemetry_events_request_idx
        ON telemetry_events(request_id, created_at ASC);

      CREATE TABLE IF NOT EXISTS uploaded_files (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        session_id TEXT,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_kind TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        storage_path TEXT NOT NULL,
        parse_status TEXT NOT NULL DEFAULT 'pending',
        parsed_text TEXT,
        parse_error TEXT,
        transcription_status TEXT NOT NULL DEFAULT 'none',
        transcription_text TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS uploaded_files_profile_idx
        ON uploaded_files(profile_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS uploaded_files_session_idx
        ON uploaded_files(session_id, created_at DESC)
        WHERE session_id IS NOT NULL;
    `);

    this.database.exec('DROP TABLE IF EXISTS space_reminder_jobs;');

    this.ensureColumn('sessions', 'associated_profile_ids_json', `associated_profile_ids_json TEXT NOT NULL DEFAULT '[]'`);
    this.ensureColumn('sessions', 'is_hidden_synthetic', 'is_hidden_synthetic INTEGER NOT NULL DEFAULT 0');
    this.ensureColumn('sessions', 'hidden_reason', 'hidden_reason TEXT');
    this.ensureColumn('sessions', 'title_override', 'title_override TEXT');
    this.ensureColumn('sessions', 'linked_space_id', 'linked_space_id TEXT');
    this.ensureColumn('sessions', 'deleted_at', 'deleted_at TEXT');
    this.ensureColumn('sessions', 'deletion_mode', 'deletion_mode TEXT');
    this.ensureColumn('settings', 'restricted_chat_max_turns', 'restricted_chat_max_turns INTEGER NOT NULL DEFAULT 8');
    this.ensureColumn('settings', 'unrestricted_access_enabled', 'unrestricted_access_enabled INTEGER NOT NULL DEFAULT 0');
    this.ensureColumn('settings', 'discovery_timeout_ms', 'discovery_timeout_ms INTEGER NOT NULL DEFAULT 240000');
    this.ensureColumn('settings', 'nearby_search_timeout_ms', 'nearby_search_timeout_ms INTEGER NOT NULL DEFAULT 300000');
    this.ensureColumn('settings', 'recipe_operation_timeout_ms', 'recipe_operation_timeout_ms INTEGER NOT NULL DEFAULT 180000');
    this.ensureColumn('settings', 'unrestricted_timeout_ms', 'unrestricted_timeout_ms INTEGER NOT NULL DEFAULT 1800000');
    this.ensureColumn('ui_state', 'active_session_ids_json', `active_session_ids_json TEXT NOT NULL DEFAULT '{}'`);
    this.ensureColumn('ui_state', 'active_space_ids_json', `active_space_ids_json TEXT NOT NULL DEFAULT '{}'`);
    this.ensureColumn('ui_state', 'recent_session_ids_by_profile_json', `recent_session_ids_by_profile_json TEXT NOT NULL DEFAULT '{}'`);
    this.ensureColumn('ui_state', 'tools_tab', `tools_tab TEXT NOT NULL DEFAULT 'all'`);
    this.ensureColumn('ui_state', 'recipes_tab', `recipes_tab TEXT NOT NULL DEFAULT 'recipes'`);
    this.ensureColumn('ui_state', 'sidebar_collapsed', 'sidebar_collapsed INTEGER NOT NULL DEFAULT 0');
    this.ensureColumn('skills', 'summary', `summary TEXT NOT NULL DEFAULT ''`);
    this.ensureColumn('recipes', 'schema_version', 'schema_version INTEGER NOT NULL DEFAULT 5');
    this.ensureColumn('recipes', 'tabs_json', `tabs_json TEXT NOT NULL DEFAULT '[]'`);
    this.ensureColumn('recipes', 'deleted_at', 'deleted_at TEXT');
    this.ensureColumn('recipes', 'primary_session_id', 'primary_session_id TEXT');
    this.ensureColumn('recipes', 'primary_runtime_session_id', 'primary_runtime_session_id TEXT');
    this.ensureColumn('recipes', 'render_mode', `render_mode TEXT NOT NULL DEFAULT 'legacy_content_v1'`);
    this.ensureColumn('recipes', 'active_build_id', 'active_build_id TEXT');
    this.ensureColumn('recipes', 'ready_build_id', 'ready_build_id TEXT');
    this.ensureColumn('recipes', 'active_applet_build_id', 'active_applet_build_id TEXT');
    this.ensureColumn('recipes', 'ready_applet_build_id', 'ready_applet_build_id TEXT');
    this.ensureColumn('recipes', 'build_error_code', 'build_error_code TEXT');
    this.ensureColumn('recipes', 'build_error_message', 'build_error_message TEXT');
    this.ensureColumn('recipe_builds', 'build_kind', `build_kind TEXT NOT NULL DEFAULT 'compiled_home'`);
    this.ensureColumn('recipe_builds', 'failure_category', 'failure_category TEXT');
    this.ensureColumn('recipe_builds', 'failure_stage', 'failure_stage TEXT');
    this.ensureColumn('recipe_builds', 'user_facing_message', 'user_facing_message TEXT');
    this.ensureColumn('recipe_builds', 'retryable', 'retryable INTEGER');
    this.ensureColumn('recipe_builds', 'configured_timeout_ms', 'configured_timeout_ms INTEGER');
    this.ensureRecipeIndexes();
    this.ensureProfileScopedProviderConnectionsTable();
    this.syncAttachedRecipeSessionCache();
    this.backfillSessionTitlesFromRecipes();
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS provider_step_completions (
        profile_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        PRIMARY KEY (profile_id, step_id)
      );
    `);
  }

  private backfillSessionTitlesFromRecipes() {
    // For sessions that have a linked recipe but still carry the raw first-message as their
    // title (i.e. no manual title_override), update the title to match the recipe name.
    this.database.exec(`
      UPDATE sessions
      SET title = (
        SELECT recipes.title
        FROM recipes
        WHERE recipes.primary_session_id = sessions.id
          AND recipes.deleted_at IS NULL
        LIMIT 1
      )
      WHERE EXISTS (
        SELECT 1 FROM recipes
        WHERE recipes.primary_session_id = sessions.id
          AND recipes.deleted_at IS NULL
      )
      AND (sessions.title_override IS NULL OR sessions.title_override = '')
      AND sessions.deleted_at IS NULL;
    `);
  }

  private ensureRecipeIndexes() {
    this.database.exec(`
      CREATE INDEX IF NOT EXISTS recipes_profile_idx
        ON recipes(profile_id, updated_at DESC, title ASC);

      CREATE UNIQUE INDEX IF NOT EXISTS recipes_primary_session_active_idx
        ON recipes(primary_session_id)
        WHERE deleted_at IS NULL AND primary_session_id IS NOT NULL;
    `);
  }

  private ensureProfileScopedProviderConnectionsTable() {
    if (this.hasColumn('provider_connections', 'profile_id')) {
      this.database.exec(`
        CREATE INDEX IF NOT EXISTS provider_connections_profile_idx
        ON provider_connections(profile_id, status, display_name);
      `);
      return;
    }

    this.database.exec(`
      DROP TABLE IF EXISTS provider_connections;

      CREATE TABLE provider_connections (
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        auth_kind TEXT NOT NULL,
        status TEXT NOT NULL,
        credential_label TEXT,
        masked_credential TEXT,
        source TEXT NOT NULL,
        supports_api_key INTEGER NOT NULL DEFAULT 0,
        supports_oauth INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        last_synced_at TEXT NOT NULL,
        PRIMARY KEY (profile_id, id)
      );

      CREATE INDEX IF NOT EXISTS provider_connections_profile_idx
      ON provider_connections(profile_id, status, display_name);
    `);
  }

  private createAttachedRecipeSession(profileId: string, recipeId: string, title: string, description: string | null, timestamp: string) {
    const sessionId = `recipe-session-${recipeId}`;
    const existing = this.getSession(sessionId);
    const sessionTitle = generateSessionTitle(title, title);
    const summary = truncate(description?.trim() || 'Structured recipe attached to this session.', 96);
    const session: Session = {
      id: sessionId,
      title: existing?.title ?? sessionTitle,
      summary: existing?.summary ?? summary,
      source: 'local',
      lastUpdatedAt: timestamp,
      lastUsedProfileId: profileId,
      associatedProfileIds: sortSessionIds([profileId, ...(existing?.associatedProfileIds ?? [])], 100),
      messageCount: existing?.messageCount ?? 0,
      attachedRecipeId: recipeId,
      recipeType: 'home'
    };

    this.insertSession({
      ...session,
      createdAt: this.getSessionStorageState(sessionId)?.created_at ?? timestamp,
      updatedAt: timestamp,
      lastMessageSyncAt: this.getSessionStorageState(sessionId)?.last_message_sync_at ?? null,
      titleOverride: this.getSessionStorageState(sessionId)?.title_override ?? sessionTitle,
      deletedAt: this.getSessionStorageState(sessionId)?.deleted_at ?? null,
      deletionMode: this.getSessionStorageState(sessionId)?.deletion_mode ?? null
    });
    this.associateSessionWithProfile(sessionId, profileId, existing ? 'manual' : 'bridge_created', timestamp, {
      preserveMoreRecentInteraction: true
    });

    return sessionId;
  }

  private syncAttachedRecipeSessionCache() {
    this.database.prepare('UPDATE sessions SET linked_space_id = NULL').run();

    const rows = this.database
      .prepare(
        `
          SELECT id, primary_session_id
          FROM recipes
          WHERE deleted_at IS NULL
            AND primary_session_id IS NOT NULL
        `
      )
      .all() as Array<{ id: string; primary_session_id: string }>;

    const update = this.database.prepare('UPDATE sessions SET linked_space_id = ? WHERE id = ?');
    for (const row of rows) {
      update.run(row.id, row.primary_session_id);
    }
  }


  getMetadata(key: string) {
    const row = this.database.prepare('SELECT value FROM app_metadata WHERE key = ?').get(key) as
      | { value: string }
      | undefined;
    return row?.value ?? null;
  }

  setMetadata(key: string, value: string) {
    this.database
      .prepare(
        `
          INSERT INTO app_metadata (key, value)
          VALUES (?, ?)
          ON CONFLICT (key) DO UPDATE SET value = excluded.value
        `
      )
      .run(key, value);
  }

  getTemplateEnabledOverrides(): Record<string, boolean> {
    const raw = this.getMetadata('template_enabled_overrides');
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      return {};
    }
  }

  setTemplateEnabled(templateId: string, enabled: boolean): void {
    const overrides = this.getTemplateEnabledOverrides();
    overrides[templateId] = enabled;
    this.setMetadata('template_enabled_overrides', JSON.stringify(overrides));
  }

  hasUserData() {
    const counts = [
      'SELECT COUNT(*) AS count FROM profiles',
      'SELECT COUNT(*) AS count FROM sessions',
      'SELECT COUNT(*) AS count FROM messages',
      'SELECT COUNT(*) AS count FROM jobs',
      'SELECT COUNT(*) AS count FROM tool_executions',
      'SELECT COUNT(*) AS count FROM recipes'
    ].map((query) => (this.database.prepare(query).get() as { count: number }).count);

    return counts.some((count) => count > 0);
  }

  private ensureDefaults() {
    this.database
      .prepare(
        `
          INSERT INTO settings (
            id,
            theme_mode,
            sessions_page_size,
            chat_timeout_ms,
            discovery_timeout_ms,
            nearby_search_timeout_ms,
            space_operation_timeout_ms,
            unrestricted_timeout_ms,
            restricted_chat_max_turns,
            unrestricted_access_enabled
          )
          VALUES (1, 'dark', 50, 180000, 240000, 300000, 180000, 1800000, 8, 0)
          ON CONFLICT (id) DO NOTHING
        `
      )
      .run();

    this.database
      .prepare(
        `
          INSERT INTO ui_state (
            id,
            active_profile_id,
            active_session_id,
            recent_session_ids_json,
            current_page,
            active_session_ids_json,
            active_space_ids_json,
            recent_session_ids_by_profile_json,
            tools_tab,
            recipes_tab,
            sidebar_collapsed
          )
          VALUES (1, NULL, NULL, '[]', 'chat', '{}', '{}', '{}', 'all', 'recipes', 0)
          ON CONFLICT (id) DO NOTHING
        `
      )
      .run();

    this.ensureBridgeTool();
    this.failInterruptedRecipeBuilds();
    this.failInterruptedRuntimeRequests();
  }

  private ensureBridgeTool() {
    const timestamp = new Date().toISOString();
    this.database
      .prepare(
        `
          INSERT INTO tools (
            id,
            profile_id,
            source,
            scope,
            name,
            description,
            enabled,
            status,
            approval_model,
            capabilities_json,
            restrictions_json,
            last_synced_at
          ) VALUES (?, NULL, 'bridge', 'local', 'Reviewed shell access', 'Read-only reviewed shell execution through the local bridge.', 1, 'enabled', 'explicit_user_approval', ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            description = excluded.description,
            enabled = excluded.enabled,
            status = excluded.status,
            approval_model = excluded.approval_model,
            capabilities_json = excluded.capabilities_json,
            restrictions_json = excluded.restrictions_json,
            last_synced_at = excluded.last_synced_at
        `
      )
      .run(
        bridgeReviewedShellToolId,
        JSON.stringify(['Read-only recipe inspection after explicit approval.']),
        JSON.stringify(reviewedShellCommandAllowlist.map((entry) => `${entry.command}: ${entry.description}`)),
        timestamp
      );
  }

  private failInterruptedRuntimeRequests() {
    const timestamp = new Date().toISOString();
    this.database
      .prepare(
        `
          UPDATE runtime_requests
          SET
            status = 'failed',
            updated_at = ?,
            completed_at = ?,
            last_error = 'The Hermes request was interrupted while the bridge was restarting.'
          WHERE status = 'running'
            AND completed_at IS NULL
        `
      )
      .run(timestamp, timestamp);
  }

  private failInterruptedRecipeBuilds() {
    const timestamp = new Date().toISOString();
    const interruptedBuilds = this.database
      .prepare(
        `
          SELECT id, space_id, build_kind
          FROM recipe_builds
          WHERE phase NOT IN ('ready', 'failed')
            AND completed_at IS NULL
        `
      )
      .all() as Array<{ id: string; space_id: string; build_kind?: string | null }>;

    if (interruptedBuilds.length === 0) {
      return;
    }

    const updateBuild = this.database.prepare(
      `
        UPDATE recipe_builds
        SET
          phase = 'failed',
          progress_message = 'Recipe build interrupted while the bridge was restarting.',
          updated_at = ?,
          completed_at = ?,
          error_code = 'RECIPE_BUILD_INTERRUPTED',
          error_message = 'The recipe build was interrupted while the bridge was restarting.'
        WHERE id = ?
      `
    );
    const updateRecipe = this.database.prepare(
      `
        UPDATE recipes
        SET
          active_build_id = CASE WHEN ? = 1 THEN ? ELSE active_build_id END,
          active_applet_build_id = CASE WHEN ? = 'applet' THEN ? ELSE active_applet_build_id END,
          build_error_code = 'RECIPE_BUILD_INTERRUPTED',
          build_error_message = 'The recipe build was interrupted while the bridge was restarting.',
          updated_at = ?
        WHERE id = ?
      `
    );

    for (const interruptedBuild of interruptedBuilds) {
      updateBuild.run(timestamp, timestamp, interruptedBuild.id);
      const buildKind = interruptedBuild.build_kind === 'applet' ? 'applet' : interruptedBuild.build_kind === 'dsl_enrichment' ? 'dsl_enrichment' : 'compiled_home';
      updateRecipe.run(isPrimaryRecipeBuildKind(buildKind as RecipeBuild['buildKind']) ? 1 : 0, interruptedBuild.id, buildKind, interruptedBuild.id, timestamp, interruptedBuild.space_id);
    }
  }

  private rowToProfile(row: Record<string, unknown>) {
    return ProfileSchema.parse({
      id: row.id,
      name: row.name,
      description: row.description,
      path: row.path ?? undefined,
      model: row.model ?? undefined,
      gateway: row.gateway ?? undefined,
      alias: row.alias ?? undefined,
      isActive: Boolean(row.is_active)
    });
  }

  private rowToSession(row: Record<string, unknown>) {
    const attachedRecipeId = row.attached_space_id ?? row.linked_space_id ?? null;
    return SessionSchema.parse({
      id: row.id,
      runtimeSessionId: row.runtime_session_id ?? undefined,
      title: row.title,
      summary: row.summary,
      source: row.source,
      lastUpdatedAt: row.last_updated_at,
      lastUsedProfileId: row.last_used_profile_id ?? null,
      associatedProfileIds: parseJson<string[]>(String(row.associated_profile_ids_json ?? '[]'), []),
      messageCount: row.message_count,
      attachedRecipeId,
      recipeType: attachedRecipeId ? 'home' : 'tui'
    });
  }

  private rowToMessage(row: Record<string, unknown>) {
    const metadata = parseJson<Partial<Pick<ChatMessage, 'requestId' | 'visibility' | 'kind' | 'attachments'>>>(
      typeof row.metadata_json === 'string' ? row.metadata_json : '{}',
      {}
    );

    return ChatMessageSchema.parse({
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
      status: row.status,
      requestId: metadata.requestId ?? null,
      visibility: metadata.visibility ?? 'transcript',
      kind: metadata.kind ?? 'conversation',
      attachments: Array.isArray(metadata.attachments) ? metadata.attachments : undefined
    });
  }

  private rowToJob(row: Record<string, unknown>) {
    return JobSchema.parse({
      id: row.id,
      profileId: row.profile_id,
      label: row.label,
      schedule: row.schedule,
      status: row.status,
      description: row.description,
      lastRun: row.last_run,
      nextRun: row.next_run,
      lastSyncedAt: row.last_synced_at
    });
  }

  private rowToTool(row: Record<string, unknown>) {
    return ToolSchema.parse({
      id: row.id,
      profileId: row.profile_id ?? null,
      source: row.source,
      scope: row.scope,
      name: row.name,
      description: row.description,
      enabled: Boolean(row.enabled),
      status: row.status,
      approvalModel: row.approval_model,
      capabilities: parseJson<string[]>(String(row.capabilities_json ?? '[]'), []),
      restrictions: parseJson<string[]>(String(row.restrictions_json ?? '[]'), []),
      lastSyncedAt: row.last_synced_at
    });
  }

  private rowToToolExecution(row: Record<string, unknown>) {
    return ToolExecutionSchema.parse({
      id: row.id,
      toolId: row.tool_id,
      profileId: row.profile_id ?? null,
      sessionId: row.session_id ?? null,
      summary: row.summary,
      command: row.command,
      args: parseJson<string[]>(String(row.args_json ?? '[]'), []),
      cwd: row.cwd ?? null,
      status: row.status,
      requestedAt: row.requested_at,
      resolvedAt: row.resolved_at ?? undefined,
      stdout: row.stdout ?? undefined,
      stderr: row.stderr ?? undefined,
      exitCode: typeof row.exit_code === 'number' ? row.exit_code : undefined
    });
  }

  private rowToSkill(row: Record<string, unknown>) {
    return SkillSchema.parse({
      id: row.id,
      profileId: row.profile_id,
      name: row.name,
      summary: row.summary ?? '',
      category: row.category,
      source: row.source,
      trust: row.trust,
      lastSyncedAt: row.last_synced_at
    });
  }

  private rowToRuntimeActivity(row: Record<string, unknown>) {
    return ChatActivitySchema.parse({
      kind: row.kind,
      state: row.state,
      label: row.label,
      detail: row.detail ?? undefined,
      command: row.command ?? undefined,
      requestId: row.request_id,
      timestamp: row.updated_at
    });
  }

  private rowToRuntimeActivityHistory(row: Record<string, unknown>) {
    return RuntimeActivityHistoryEntrySchema.parse({
      id: row.id,
      requestId: row.request_id,
      sessionId: row.session_id,
      profileId: row.profile_id ?? null,
      sessionTitle: typeof row.session_title === 'string' && row.session_title.trim().length > 0 ? row.session_title : undefined,
      requestPreview: typeof row.request_preview === 'string' && row.request_preview.trim().length > 0 ? row.request_preview : undefined,
      kind: row.kind,
      state: row.state,
      label: row.label,
      detail: row.detail ?? undefined,
      command: row.command ?? undefined,
      timestamp: row.updated_at
    });
  }

  private rowToRuntimeRequest(row: Record<string, unknown>, activities: ChatActivity[], telemetryCount: number, messageIds: string[]) {
    const metadata = parseJson<{ recipePipeline?: RecipePipelineState }>(String(row.metadata_json ?? '{}'), {});
    return RuntimeRequestSchema.parse({
      requestId: row.request_id,
      profileId: row.profile_id ?? null,
      sessionId: row.session_id,
      preview: row.preview,
      messageIds,
      activities,
      status: row.status,
      startedAt: row.started_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at ?? null,
      lastError: row.last_error ?? undefined,
      recipePipeline: metadata.recipePipeline,
      telemetryCount
    });
  }

  private rowToProviderConnection(row: Record<string, unknown>) {
    return ProviderConnectionSchema.parse({
      id: row.id,
      profileId: row.profile_id,
      displayName: row.display_name,
      authKind: row.auth_kind,
      status: row.status,
      credentialLabel: row.credential_label ?? undefined,
      maskedCredential: row.masked_credential ?? undefined,
      source: row.source,
      supportsApiKey: Boolean(row.supports_api_key),
      supportsOAuth: Boolean(row.supports_oauth),
      notes: row.notes ?? undefined,
      lastSyncedAt: row.last_synced_at
    });
  }

  private rowToRuntimeProviderOption(row: Record<string, unknown>) {
    return RuntimeProviderOptionSchema.parse(
      parseJson<RuntimeProviderOption>(String(row.payload_json ?? '{}'), {
        id: String(row.id ?? ''),
        profileId: String(row.profile_id ?? ''),
        displayName: String(row.id ?? ''),
        authKind: 'unknown',
        status: 'available',
        source: 'catalog',
        lastSyncedAt: String(row.last_synced_at ?? new Date().toISOString()),
        disabled: false,
        state: 'unsupported',
        stateMessage: 'Authoritative provider state is unavailable for this cached record.',
        ready: false,
        modelSelectionMode: 'select_only',
        supportsDisconnect: false,
        supportsApiKey: false,
        supportsOAuth: false,
        supportsModelDiscovery: false,
        models: [],
        configurationFields: [],
        setupSteps: []
      })
    );
  }

  private rowToRuntimeModelConfig(row: Record<string, unknown>) {
    return RuntimeModelConfigSchema.parse({
      profileId: row.profile_id,
      defaultModel: row.default_model,
      provider: row.provider,
      baseUrl: row.base_url ?? undefined,
      apiMode: row.api_mode ?? undefined,
      maxTurns: row.max_turns,
      reasoningEffort: row.reasoning_effort ?? undefined,
      toolUseEnforcement: row.tool_use_enforcement ?? undefined,
      lastSyncedAt: row.last_synced_at
    });
  }

  private rowToAuditEvent(row: Record<string, unknown>) {
    return AuditEventSchema.parse({
      id: row.id,
      type: row.type,
      profileId: row.profile_id ?? null,
      sessionId: row.session_id ?? null,
      message: row.message,
      createdAt: row.created_at
    });
  }

  private rowToTelemetryEvent(row: Record<string, unknown>) {
    return TelemetryEventSchema.parse({
      id: row.id,
      profileId: row.profile_id ?? null,
      sessionId: row.session_id ?? null,
      requestId: row.request_id ?? null,
      severity: row.severity,
      category: row.category,
      code: row.code,
      message: row.message,
      detail: row.detail ?? undefined,
      payload: parseJson<Record<string, unknown>>(String(row.payload_json ?? '{}'), {}),
      createdAt: row.created_at
    });
  }

  private rowToRecipeBuild(row: Record<string, unknown>) {
    return RecipeBuildSchema.parse({
      id: row.id,
      recipeId: row.space_id,
      profileId: row.profile_id,
      sessionId: row.session_id ?? null,
      buildVersion: row.build_version,
      buildKind: row.build_kind ?? 'compiled_home',
      triggerKind: row.trigger_kind,
      triggerRequestId: row.trigger_request_id ?? null,
      triggerActionId: row.trigger_action_id ?? null,
      phase: row.phase,
      progressMessage: row.progress_message ?? null,
      retryCount: row.retry_count ?? 0,
      startedAt: row.started_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at ?? null,
      errorCode: row.error_code ?? null,
      errorMessage: row.error_message ?? null,
      errorDetail: row.error_detail ?? null,
      failureCategory: row.failure_category ?? null,
      failureStage: row.failure_stage ?? null,
      userFacingMessage: row.user_facing_message ?? null,
      retryable: row.retryable === null || row.retryable === undefined ? null : Number(row.retryable) !== 0,
      configuredTimeoutMs: row.configured_timeout_ms ?? null
    });
  }

  private rowToRecipeBuildArtifact(row: Record<string, unknown>) {
    return RecipeArtifactSchema.parse({
      id: row.id,
      recipeId: row.space_id,
      buildId: row.build_id,
      artifactKind: row.artifact_kind,
      schemaVersion: row.schema_version,
      payload: parseJson<Record<string, unknown>>(String(row.payload_json ?? '{}'), {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  private rowToRecipeBuildLog(row: Record<string, unknown>) {
    return RecipeBuildLogSchema.parse({
      id: row.id,
      recipeId: row.space_id,
      buildId: row.build_id,
      phase: row.phase,
      level: row.level,
      message: row.message,
      detail: row.detail ?? null,
      createdAt: row.created_at
    });
  }

  private resolveRecipeDynamicState(row: Record<string, unknown>) {
    const renderMode = row.render_mode === 'dynamic_v1' ? 'dynamic_v1' : 'legacy_content_v1';
    const activeBuildId = typeof row.active_build_id === 'string' && row.active_build_id.length > 0 ? row.active_build_id : null;
    const readyBuildId = typeof row.ready_build_id === 'string' && row.ready_build_id.length > 0 ? row.ready_build_id : null;
    const activeAppletBuildId =
      typeof row.active_applet_build_id === 'string' && row.active_applet_build_id.length > 0 ? row.active_applet_build_id : null;
    const readyAppletBuildId =
      typeof row.ready_applet_build_id === 'string' && row.ready_applet_build_id.length > 0 ? row.ready_applet_build_id : null;
    const activeCompiledBuild = activeBuildId ? this.getRecipeBuild(activeBuildId) : null;
    const activeAppletBuild = activeAppletBuildId ? this.getRecipeBuild(activeAppletBuildId) : null;
    const activeBuild = activeCompiledBuild ?? null;
    const artifactBuildIds =
      activeCompiledBuild && activeCompiledBuild.phase !== 'ready'
        ? [...new Set([activeBuildId, readyBuildId].filter((value): value is string => Boolean(value)))]
        : [...new Set([readyBuildId ?? activeBuildId].filter((value): value is string => Boolean(value)))];
    const appletArtifactBuildIds =
      activeAppletBuild && activeAppletBuild.phase !== 'ready'
        ? [...new Set([activeAppletBuildId, readyAppletBuildId].filter((value): value is string => Boolean(value)))]
        : [...new Set([readyAppletBuildId ?? activeAppletBuildId].filter((value): value is string => Boolean(value)))];

    if (
      renderMode !== 'dynamic_v1' &&
      artifactBuildIds.length === 0 &&
      appletArtifactBuildIds.length === 0 &&
      !activeBuild &&
      !activeAppletBuild
    ) {
      return undefined;
    }

    let summary: RecipeSummary | undefined;
    let analysis: RecipeAnalysis | undefined;
    let normalizedData: RecipeNormalizedData | undefined;
    let uiSpec: RecipeUiSpec | undefined;
    let actionSpec: RecipeActionSpec | undefined;
    let recipeTemplate: RecipeTemplateState | undefined;
    let recipeDsl: RecipeDsl | undefined;
    let recipeModel: RecipeModel | undefined;
    let latestRecipePatch: RecipePatch | undefined;
    let latestTestResults: RecipeTestResults | undefined;
    let fallback: RecipeFallbackState | undefined;
    let appletPlan: RecipeAppletPlan | undefined;
    let appletManifest: RecipeAppletManifest | undefined;
    let appletRenderTree: RecipeAppletRenderTree | undefined;
    let appletVerification: RecipeAppletVerification | undefined;

    for (const artifactBuildId of artifactBuildIds) {
      const artifacts = this.listRecipeBuildArtifacts(artifactBuildId);
      for (const artifact of artifacts) {
        switch (artifact.artifactKind) {
          case 'summary':
            summary ??= RecipeSummarySchema.parse(artifact.payload);
            break;
          case 'analysis':
            analysis ??= RecipeAnalysisSchema.parse(artifact.payload);
            break;
          case 'normalized_data':
            normalizedData ??= RecipeNormalizedDataSchema.parse(artifact.payload);
            break;
          case 'ui_spec':
            uiSpec ??= RecipeUiSpecSchema.parse(artifact.payload);
            break;
          case 'action_spec':
            actionSpec ??= RecipeActionSpecSchema.parse(artifact.payload);
            break;
          case 'recipe_template_state':
            recipeTemplate ??= RecipeTemplateStateSchema.parse(artifact.payload);
            break;
          case 'recipe_dsl':
            recipeDsl ??= RecipeDslSchema.parse(artifact.payload);
            break;
          case 'recipe_model':
            recipeModel ??= RecipeModelSchema.parse(artifact.payload);
            break;
          case 'recipe_patch':
            latestRecipePatch ??= RecipePatchSchema.parse(artifact.payload);
            break;
          case 'test_results':
            latestTestResults ??= RecipeTestResultsSchema.parse(artifact.payload);
            break;
          case 'fallback':
            fallback ??= RecipeFallbackStateSchema.parse(artifact.payload);
            break;
          default:
            break;
        }
      }
    }

    for (const artifactBuildId of appletArtifactBuildIds) {
      const artifacts = this.listRecipeBuildArtifacts(artifactBuildId);
      for (const artifact of artifacts) {
        switch (artifact.artifactKind) {
          case 'summary':
            summary ??= RecipeSummarySchema.parse(artifact.payload);
            break;
          case 'analysis':
            analysis ??= RecipeAnalysisSchema.parse(artifact.payload);
            break;
          case 'normalized_data':
            normalizedData ??= RecipeNormalizedDataSchema.parse(artifact.payload);
            break;
          case 'fallback':
            fallback ??= RecipeFallbackStateSchema.parse(artifact.payload);
            break;
          case 'applet_plan':
            appletPlan ??= RecipeAppletPlanSchema.parse(artifact.payload);
            break;
          case 'applet_manifest':
            appletManifest ??= RecipeAppletManifestSchema.parse(artifact.payload);
            break;
          case 'applet_render_tree':
            appletRenderTree ??= RecipeAppletRenderTreeSchema.parse(artifact.payload);
            break;
          case 'applet_verification':
            appletVerification ??= RecipeAppletVerificationSchema.parse(artifact.payload);
            break;
          case 'action_spec':
            actionSpec ??= RecipeActionSpecSchema.parse(artifact.payload);
            break;
          case 'recipe_template_state':
            recipeTemplate ??= RecipeTemplateStateSchema.parse(artifact.payload);
            break;
          case 'recipe_dsl':
            recipeDsl ??= RecipeDslSchema.parse(artifact.payload);
            break;
          case 'recipe_model':
            recipeModel ??= RecipeModelSchema.parse(artifact.payload);
            break;
          case 'recipe_patch':
            latestRecipePatch ??= RecipePatchSchema.parse(artifact.payload);
            break;
          default:
            break;
        }
      }
    }

    return {
      renderMode: 'dynamic_v1' as const,
      activeBuild,
      summary,
      analysis,
      normalizedData,
      uiSpec,
      actionSpec,
      recipeTemplate,
      recipeDsl,
      recipeModel,
      latestRecipePatch,
      latestTestResults,
      fallback,
      applet:
        activeAppletBuild ||
        readyAppletBuildId ||
        appletManifest ||
        appletRenderTree ||
        appletVerification
          ? {
              activeBuild: activeAppletBuild,
              promotedBuildId: readyAppletBuildId,
              plan: appletPlan,
              manifest: appletManifest,
              renderTree: appletRenderTree,
              verification: appletVerification
            }
          : undefined
    };
  }

  private rowToRecipe(row: Record<string, unknown>) {
    const parsedTabs = parseJson<RecipeTab[]>(String(row.tabs_json ?? '[]'), []);
    const tabs =
      parsedTabs.length > 0
        ? normalizeRecipeTabs({
            tabs: parsedTabs
          })
        : normalizeLegacyRecipeTabs(
            typeof row.view_type === 'string' ? row.view_type : null,
            parseJson<Record<string, unknown>>(String(row.data_json ?? '{}'), {})
          );
    const dynamic = this.resolveRecipeDynamicState(row);
    const renderMode = row.render_mode === 'dynamic_v1' ? 'dynamic_v1' : 'legacy_content_v1';
    return RecipeSchema.parse({
      schemaVersion: row.schema_version ?? 5,
      id: row.id,
      profileId: row.profile_id,
      primarySessionId: row.primary_session_id ?? row.linked_session_id,
      primaryRuntimeSessionId: row.primary_runtime_session_id ?? row.linked_runtime_session_id ?? null,
      title: row.title,
      description: row.description ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status,
      tabs,
      uiState: normalizeRecipeUiState(parseJson<Record<string, unknown>>(String(row.ui_state_json ?? '{}'), {})),
      lastUpdatedBy: row.last_updated_by ?? undefined,
      source: row.source,
      metadata: parseJson<Record<string, unknown>>(String(row.metadata_json ?? '{}'), {}),
      renderMode,
      dynamic
    });
  }

  private rowToRecipeEvent(row: Record<string, unknown>) {
    return RecipeEventSchema.parse({
      id: row.id,
      profileId: row.profile_id,
      recipeId: row.space_id,
      recipeTitle: row.space_title,
      type: row.type,
      message: row.message,
      source: row.source,
      sessionId: row.session_id ?? null,
      createdAt: row.created_at,
      metadata: parseJson<Record<string, unknown>>(String(row.metadata_json ?? '{}'), {})
    });
  }

  getSettings() {
    const row = this.database.prepare(
      `
        SELECT
          theme_mode,
          sessions_page_size,
          chat_timeout_ms,
          discovery_timeout_ms,
          nearby_search_timeout_ms,
          space_operation_timeout_ms,
          unrestricted_timeout_ms,
          restricted_chat_max_turns,
          unrestricted_access_enabled
        FROM settings
        WHERE id = 1
      `
    ).get() as Record<
      string,
      unknown
    > | undefined;

    return AppSettingsSchema.parse({
      themeMode: row?.theme_mode ?? 'dark',
      sessionsPageSize: row?.sessions_page_size ?? 50,
      chatTimeoutMs: row?.chat_timeout_ms ?? 180_000,
      discoveryTimeoutMs: row?.discovery_timeout_ms ?? 240_000,
      nearbySearchTimeoutMs: row?.nearby_search_timeout_ms ?? 300_000,
      recipeOperationTimeoutMs: row?.space_operation_timeout_ms ?? 180_000,
      unrestrictedTimeoutMs: row?.unrestricted_timeout_ms ?? 1_800_000,
      restrictedChatMaxTurns: row?.restricted_chat_max_turns ?? 8,
      unrestrictedAccessEnabled: Boolean(row?.unrestricted_access_enabled)
    });
  }

  updateSettings(partial: Partial<AppSettings>) {
    const nextSettings = AppSettingsSchema.parse({
      ...this.getSettings(),
      ...partial
    });

    this.database
      .prepare(
        `
          UPDATE settings
          SET
            theme_mode = ?,
            sessions_page_size = ?,
            chat_timeout_ms = ?,
            discovery_timeout_ms = ?,
            nearby_search_timeout_ms = ?,
            space_operation_timeout_ms = ?,
            unrestricted_timeout_ms = ?,
            restricted_chat_max_turns = ?,
            unrestricted_access_enabled = ?
          WHERE id = 1
        `
      )
      .run(
        nextSettings.themeMode,
        nextSettings.sessionsPageSize,
        nextSettings.chatTimeoutMs,
        nextSettings.discoveryTimeoutMs,
        nextSettings.nearbySearchTimeoutMs,
        nextSettings.recipeOperationTimeoutMs,
        nextSettings.unrestrictedTimeoutMs,
        nextSettings.restrictedChatMaxTurns,
        nextSettings.unrestrictedAccessEnabled ? 1 : 0
      );

    return nextSettings;
  }

  getProviderStepCompletions(profileId: string): string[] {
    const rows = this.database
      .prepare('SELECT step_id FROM provider_step_completions WHERE profile_id = ?')
      .all(profileId) as Array<{ step_id: string }>;
    return rows.map((r) => r.step_id);
  }

  setProviderStepCompletion(profileId: string, stepId: string, completed: boolean): void {
    if (completed) {
      this.database
        .prepare(
          `INSERT INTO provider_step_completions (profile_id, step_id, completed_at)
           VALUES (?, ?, ?)
           ON CONFLICT(profile_id, step_id) DO UPDATE SET completed_at = excluded.completed_at`
        )
        .run(profileId, stepId, new Date().toISOString());
    } else {
      this.database
        .prepare('DELETE FROM provider_step_completions WHERE profile_id = ? AND step_id = ?')
        .run(profileId, stepId);
    }
  }

  getUiState() {
    const row = this.database
      .prepare(
        `
          SELECT
            active_profile_id,
            active_session_id,
            recent_session_ids_json,
            current_page,
            active_session_ids_json,
            recent_session_ids_by_profile_json,
            tools_tab,
            sidebar_collapsed
          FROM ui_state
          WHERE id = 1
        `
      )
      .get() as Record<string, unknown> | undefined;

    const activeProfileId = (row?.active_profile_id as string | null | undefined) ?? null;
    const activeSessionIdByProfile = normalizeActiveIdsByProfile(
      parseJson<Record<string, string | null>>(String(row?.active_session_ids_json ?? '{}'), {})
    );
    const recentSessionIdsByProfile = normalizeRecentSessionsByProfile(
      parseJson<Record<string, string[]>>(String(row?.recent_session_ids_by_profile_json ?? '{}'), {})
    );
    const legacyActiveSessionId = (row?.active_session_id as string | null | undefined) ?? null;
    const legacyRecentSessionIds = parseJson<string[]>(String(row?.recent_session_ids_json ?? '[]'), []);

    if (activeProfileId && legacyActiveSessionId && activeSessionIdByProfile[activeProfileId] === undefined) {
      activeSessionIdByProfile[activeProfileId] = legacyActiveSessionId;
    }

    if (activeProfileId && legacyRecentSessionIds.length > 0 && recentSessionIdsByProfile[activeProfileId] === undefined) {
      recentSessionIdsByProfile[activeProfileId] = sortSessionIds(legacyRecentSessionIds);
    }

    return UiStateSchema.parse({
      activeProfileId,
      currentPage: row?.current_page ?? 'chat',
      activeSessionIdByProfile,
      recentSessionIdsByProfile,
      toolsTab: row?.tools_tab ?? 'all',
      sidebarCollapsed: Boolean(row?.sidebar_collapsed)
    });
  }

  updateUiState(partial: Partial<UiState>) {
    const current = this.getUiState();
    const nextState = UiStateSchema.parse({
      ...current,
      ...partial,
      activeSessionIdByProfile: normalizeActiveIdsByProfile({
        ...current.activeSessionIdByProfile,
        ...(partial.activeSessionIdByProfile ?? {})
      }),
      recentSessionIdsByProfile: normalizeRecentSessionsByProfile({
        ...current.recentSessionIdsByProfile,
        ...(partial.recentSessionIdsByProfile ?? {})
      })
    });

    const activeProfileId = nextState.activeProfileId;
    const legacyActiveSessionId = activeProfileId ? nextState.activeSessionIdByProfile[activeProfileId] ?? null : null;
    const legacyRecentSessionIds = activeProfileId ? nextState.recentSessionIdsByProfile[activeProfileId] ?? [] : [];

    this.database
      .prepare(
        `
          UPDATE ui_state
          SET
            active_profile_id = ?,
            active_session_id = ?,
            recent_session_ids_json = ?,
            current_page = ?,
            active_session_ids_json = ?,
            recent_session_ids_by_profile_json = ?,
            tools_tab = ?,
            sidebar_collapsed = ?
          WHERE id = 1
        `
      )
      .run(
        nextState.activeProfileId ?? null,
        legacyActiveSessionId,
        JSON.stringify(legacyRecentSessionIds),
        nextState.currentPage ?? 'chat',
        JSON.stringify(nextState.activeSessionIdByProfile ?? {}),
        JSON.stringify(nextState.recentSessionIdsByProfile ?? {}),
        nextState.toolsTab ?? 'all',
        nextState.sidebarCollapsed ? 1 : 0
      );

    return nextState;
  }

  setActiveProfile(profileId: string | null) {
    return this.updateUiState({
      activeProfileId: profileId
    });
  }

  getActiveSessionId(profileId: string | null) {
    if (!profileId) {
      return null;
    }

    const sessionId = this.getUiState().activeSessionIdByProfile[profileId] ?? null;
    if (!sessionId) {
      return null;
    }

    const session = this.getSession(sessionId);
    return session && this.isSessionAssociatedWithProfile(sessionId, profileId) && !this.getDeletedAt(sessionId) ? sessionId : null;
  }

  setActiveSession(
    profileId: string,
    sessionId: string | null,
    options: {
      preserveCurrentPage?: boolean;
    } = {}
  ) {
    const current = this.getUiState();
    const currentRecentSessions = current.recentSessionIdsByProfile[profileId] ?? [];
    return this.updateUiState({
      activeSessionIdByProfile: {
        [profileId]: sessionId
      },
      recentSessionIdsByProfile: {
        [profileId]: sessionId ? sortSessionIds([sessionId, ...currentRecentSessions]) : currentRecentSessions
      },
      currentPage: sessionId ? (options.preserveCurrentPage ? current.currentPage : 'chat') : current.currentPage
    });
  }

  setActiveRecipe(profileId: string, recipeId: string | null) {
    if (!recipeId) {
      return this.getUiState();
    }

    const recipe = this.getRecipe(recipeId);
    if (!recipe || recipe.profileId !== profileId) {
      return this.getUiState();
    }

    return this.setActiveSession(profileId, recipe.primarySessionId, {
      preserveCurrentPage: true
    });
  }

  getActiveRecipeId(profileId: string | null) {
    if (!profileId) {
      return null;
    }

    const sessionId = this.getActiveSessionId(profileId);
    if (!sessionId) {
      return null;
    }

    return this.getRecipeByPrimarySessionId(profileId, sessionId)?.id ?? null;
  }

  private upsertRecipe(
    recipe: Recipe & {
      deletedAt?: string | null;
    }
  ) {
    const parsedRecipe = RecipeSchema.parse(recipe);
    const currentRow = this.database
      .prepare(
        `
          SELECT
            render_mode,
            active_build_id,
            ready_build_id,
            active_applet_build_id,
            ready_applet_build_id,
            build_error_code,
            build_error_message
          FROM recipes
          WHERE id = ?
        `
      )
      .get(parsedRecipe.id) as
      | {
          render_mode?: string | null;
          active_build_id?: string | null;
          ready_build_id?: string | null;
          active_applet_build_id?: string | null;
          ready_applet_build_id?: string | null;
          build_error_code?: string | null;
          build_error_message?: string | null;
        }
      | undefined;
    const contentTab = getRecipeContentTab(parsedRecipe);
    const renderMode = parsedRecipe.renderMode ?? (currentRow?.render_mode === 'dynamic_v1' ? 'dynamic_v1' : 'legacy_content_v1');
    const clearDynamicBuildPointers = renderMode === 'legacy_content_v1' && !parsedRecipe.dynamic;
    const activeBuildId = clearDynamicBuildPointers ? null : parsedRecipe.dynamic?.activeBuild?.id ?? currentRow?.active_build_id ?? null;
    const readyBuildId = clearDynamicBuildPointers
      ? null
      : parsedRecipe.dynamic?.activeBuild?.phase === 'ready'
        ? parsedRecipe.dynamic.activeBuild.id
        : currentRow?.ready_build_id ?? null;
    const activeAppletBuildId = clearDynamicBuildPointers
      ? null
      : parsedRecipe.dynamic?.applet?.activeBuild?.id ?? currentRow?.active_applet_build_id ?? null;
    const readyAppletBuildId = clearDynamicBuildPointers
      ? null
      : parsedRecipe.dynamic?.applet?.promotedBuildId ?? currentRow?.ready_applet_build_id ?? null;
    const buildErrorCode = clearDynamicBuildPointers
      ? null
      : parsedRecipe.dynamic?.activeBuild?.phase === 'failed'
        ? parsedRecipe.dynamic.activeBuild.errorCode ?? currentRow?.build_error_code ?? null
        : currentRow?.build_error_code ?? null;
    const buildErrorMessage = clearDynamicBuildPointers
      ? null
      : parsedRecipe.dynamic?.activeBuild?.phase === 'failed'
        ? parsedRecipe.dynamic.activeBuild.errorMessage ?? currentRow?.build_error_message ?? null
        : currentRow?.build_error_message ?? null;
    this.database
      .prepare(
        `
          INSERT INTO recipes (
            id,
            profile_id,
            schema_version,
            title,
            description,
            view_type,
            status,
            data_json,
            tabs_json,
            ui_state_json,
            primary_session_id,
            primary_runtime_session_id,
            linked_session_id,
            linked_runtime_session_id,
            last_updated_by,
            source,
            metadata_json,
            render_mode,
            active_build_id,
            ready_build_id,
            active_applet_build_id,
            ready_applet_build_id,
            build_error_code,
            build_error_message,
            deleted_at,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            profile_id = excluded.profile_id,
            schema_version = excluded.schema_version,
            title = excluded.title,
            description = excluded.description,
            view_type = excluded.view_type,
            status = excluded.status,
            data_json = excluded.data_json,
            tabs_json = excluded.tabs_json,
            ui_state_json = excluded.ui_state_json,
            primary_session_id = excluded.primary_session_id,
            primary_runtime_session_id = excluded.primary_runtime_session_id,
            linked_session_id = excluded.linked_session_id,
            linked_runtime_session_id = excluded.linked_runtime_session_id,
            last_updated_by = excluded.last_updated_by,
            source = excluded.source,
            metadata_json = excluded.metadata_json,
            render_mode = excluded.render_mode,
            active_build_id = excluded.active_build_id,
            ready_build_id = excluded.ready_build_id,
            active_applet_build_id = excluded.active_applet_build_id,
            ready_applet_build_id = excluded.ready_applet_build_id,
            build_error_code = excluded.build_error_code,
            build_error_message = excluded.build_error_message,
            deleted_at = excluded.deleted_at,
            updated_at = excluded.updated_at
        `
      )
      .run(
        parsedRecipe.id,
        parsedRecipe.profileId,
        parsedRecipe.schemaVersion,
        parsedRecipe.title,
        parsedRecipe.description ?? null,
        contentTab ? contentTab.content.activeView : 'markdown',
        parsedRecipe.status,
        JSON.stringify(contentTab ? getRecipeContentViewData(contentTab, contentTab.content.activeView) : {}),
        JSON.stringify(parsedRecipe.tabs),
        JSON.stringify(parsedRecipe.uiState),
        parsedRecipe.primarySessionId,
        parsedRecipe.primaryRuntimeSessionId ?? null,
        parsedRecipe.primarySessionId,
        parsedRecipe.primaryRuntimeSessionId ?? null,
        parsedRecipe.lastUpdatedBy ?? null,
        parsedRecipe.source,
        JSON.stringify(parsedRecipe.metadata),
        renderMode,
        activeBuildId,
        readyBuildId,
        activeAppletBuildId,
        readyAppletBuildId,
        buildErrorCode,
        buildErrorMessage,
        recipe.deletedAt ?? null,
        parsedRecipe.createdAt,
        parsedRecipe.updatedAt
      );
    this.syncAttachedRecipeSessionCache();
  }

  listRecipes(profileId: string) {
    const rows = this.database
      .prepare(
        `
          SELECT *
          FROM recipes
          WHERE profile_id = ?
            AND deleted_at IS NULL
          ORDER BY updated_at DESC, title ASC
        `
      )
      .all(profileId) as Record<string, unknown>[];
    return rows.map((row) => this.rowToRecipe(row));
  }

  listRecipeEvents(profileId: string, options: { limit?: number; recipeId?: string } = {}) {
    const limit = options.limit ?? 25;
    const rows = this.database
      .prepare(
        options.recipeId
          ? `
              SELECT *
              FROM recipe_events
              WHERE profile_id = ?
                AND space_id = ?
              ORDER BY created_at DESC
              LIMIT ?
            `
          : `
              SELECT *
              FROM recipe_events
              WHERE profile_id = ?
              ORDER BY created_at DESC
              LIMIT ?
            `
      )
      .all(...(options.recipeId ? [profileId, options.recipeId, limit] : [profileId, limit])) as Record<string, unknown>[];

    return rows.map((row) => this.rowToRecipeEvent(row));
  }

  getRecipe(recipeId: string) {
    const row = this.database.prepare('SELECT * FROM recipes WHERE id = ? AND deleted_at IS NULL').get(recipeId) as
      | Record<string, unknown>
      | undefined;
    return row ? this.rowToRecipe(row) : null;
  }

  getRecipeByPrimarySessionId(profileId: string, sessionId: string) {
    const row = this.database
      .prepare(
        `
          SELECT *
          FROM recipes
          WHERE profile_id = ?
            AND primary_session_id = ?
            AND deleted_at IS NULL
          LIMIT 1
        `
      )
      .get(profileId, sessionId) as Record<string, unknown> | undefined;

    return row ? this.rowToRecipe(row) : null;
  }

  createRecipe(
    input: Pick<Recipe, 'profileId' | 'primarySessionId' | 'title' | 'description' | 'status' | 'tabs' | 'uiState' | 'source'> &
      Partial<Pick<Recipe, 'lastUpdatedBy' | 'metadata'>>
  ) {
    const timestamp = new Date().toISOString();
    const session = this.getSession(input.primarySessionId);
    const recipe = RecipeSchema.parse({
      schemaVersion: 5,
      id: `recipe-${randomUUID()}`,
      profileId: input.profileId,
      primarySessionId: input.primarySessionId,
      primaryRuntimeSessionId: session?.runtimeSessionId ?? null,
      title: input.title,
      description: input.description,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: input.status,
      tabs: normalizeRecipeTabs({
        tabs: input.tabs
      }),
      uiState: input.uiState,
      lastUpdatedBy: input.lastUpdatedBy,
      source: input.source,
      metadata: {
        changeVersion: 1,
        lastChangedAt: timestamp,
        ...(input.metadata ?? {})
      }
    });

    this.upsertRecipe(recipe);
    this.setActiveRecipe(recipe.profileId, recipe.id);
    return this.getRecipe(recipe.id);
  }

  updateRecipe(
    recipeId: string,
    partial: Partial<Omit<Recipe, 'id' | 'profileId' | 'createdAt' | 'primarySessionId'>> & Pick<Recipe, 'profileId'>
  ) {
    const current = this.getRecipe(recipeId);
    if (!current) {
      return null;
    }

    const timestamp = new Date().toISOString();
    const normalizedPartial = Object.fromEntries(
      Object.entries(partial).filter(([, value]) => value !== undefined)
    ) as Partial<Omit<Recipe, 'id' | 'profileId' | 'createdAt'>> & Pick<Recipe, 'profileId'>;
    const incrementsVersion =
      normalizedPartial.title !== undefined ||
      normalizedPartial.description !== undefined ||
      normalizedPartial.status !== undefined ||
      normalizedPartial.tabs !== undefined;
    const nextMetadata = {
      ...current.metadata,
      ...(normalizedPartial.metadata ?? {}),
      changeVersion:
        normalizedPartial.metadata?.changeVersion ??
        (incrementsVersion ? Math.max(1, current.metadata.changeVersion + 1) : current.metadata.changeVersion),
      lastChangedAt: incrementsVersion ? timestamp : (normalizedPartial.metadata?.lastChangedAt ?? current.metadata.lastChangedAt)
    };
    const nextRecipe = RecipeSchema.parse({
      ...current,
      ...normalizedPartial,
      tabs: normalizedPartial.tabs ? normalizeRecipeTabs({ tabs: normalizedPartial.tabs, currentRecipe: current }) : current.tabs,
      uiState: normalizedPartial.uiState ? normalizeRecipeUiState(normalizedPartial.uiState) : current.uiState,
      dynamic:
        normalizedPartial.renderMode === 'legacy_content_v1' && normalizedPartial.dynamic === undefined
          ? undefined
          : normalizedPartial.dynamic ?? current.dynamic,
      metadata: nextMetadata,
      updatedAt: timestamp
    });

    this.upsertRecipe(nextRecipe);
    return this.getRecipe(recipeId);
  }

  deleteRecipe(profileId: string, recipeId: string, deletedAt: string) {
    const recipe = this.getRecipe(recipeId);
    if (!recipe || recipe.profileId !== profileId) {
      return null;
    }

    this.database.prepare('UPDATE recipes SET deleted_at = ?, updated_at = ? WHERE id = ?').run(deletedAt, deletedAt, recipeId);
    this.syncAttachedRecipeSessionCache();

    return {
      profileId,
      recipeId,
      deletedAt
    };
  }

  linkRecipeToSession(recipeId: string, session: Pick<Session, 'id' | 'runtimeSessionId'> | null) {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) {
      return null;
    }
    const targetSessionId =
      session?.id ??
      this.createAttachedRecipeSession(recipe.profileId, recipe.id, recipe.title, recipe.description ?? null, new Date().toISOString());
    const targetRuntimeSessionId = session?.runtimeSessionId ?? this.getSession(targetSessionId)?.runtimeSessionId ?? null;
    const conflictingRecipe = this.getRecipeByPrimarySessionId(recipe.profileId, targetSessionId);

    if (conflictingRecipe && conflictingRecipe.id !== recipe.id) {
      const replacementSessionId = this.createAttachedRecipeSession(
        conflictingRecipe.profileId,
        conflictingRecipe.id,
        conflictingRecipe.title,
        conflictingRecipe.description ?? null,
        new Date().toISOString()
      );
      this.database
        .prepare(
          `
            UPDATE recipes
            SET primary_session_id = ?, primary_runtime_session_id = ?, linked_session_id = ?, linked_runtime_session_id = ?, updated_at = ?
            WHERE id = ?
          `
        )
        .run(
          replacementSessionId,
          this.getSession(replacementSessionId)?.runtimeSessionId ?? null,
          replacementSessionId,
          this.getSession(replacementSessionId)?.runtimeSessionId ?? null,
          new Date().toISOString(),
          conflictingRecipe.id
        );
    }

    this.database
      .prepare(
        `
          UPDATE recipes
          SET primary_session_id = ?, primary_runtime_session_id = ?, linked_session_id = ?, linked_runtime_session_id = ?, updated_at = ?
          WHERE id = ?
        `
      )
      .run(targetSessionId, targetRuntimeSessionId, targetSessionId, targetRuntimeSessionId, new Date().toISOString(), recipeId);
    this.syncAttachedRecipeSessionCache();

    return this.getRecipe(recipeId);
  }

  appendRecipeEvent(event: RecipeEvent) {
    const parsedEvent = RecipeEventSchema.parse(event);
    this.database
      .prepare(
        `
          INSERT INTO recipe_events (
            id,
            profile_id,
            space_id,
            space_title,
            type,
            message,
            source,
            session_id,
            metadata_json,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        parsedEvent.id,
        parsedEvent.profileId,
        parsedEvent.recipeId,
        parsedEvent.recipeTitle,
        parsedEvent.type,
        parsedEvent.message,
        parsedEvent.source,
        parsedEvent.sessionId ?? null,
        JSON.stringify(parsedEvent.metadata),
        parsedEvent.createdAt
      );

    return parsedEvent;
  }

  getRecipeBuild(buildId: string) {
    const row = this.database.prepare('SELECT * FROM recipe_builds WHERE id = ?').get(buildId) as Record<string, unknown> | undefined;
    return row ? this.rowToRecipeBuild(row) : null;
  }

  listRecipeBuilds(recipeId: string, options: { limit?: number } = {}) {
    const limit = options.limit ?? 10;
    const rows = this.database
      .prepare(
        `
          SELECT *
          FROM recipe_builds
          WHERE space_id = ?
          ORDER BY started_at DESC, build_version DESC
          LIMIT ?
        `
      )
      .all(recipeId, limit) as Record<string, unknown>[];
    return rows.map((row) => this.rowToRecipeBuild(row));
  }

  startRecipeBuild(build: RecipeBuild): RecipeBuild {
    const parsedBuild = RecipeBuildSchema.parse(build);
    const usesPrimaryBuildTrack = isPrimaryRecipeBuildKind(parsedBuild.buildKind);
    const currentRecipeRow = this.database
      .prepare(
        `
          SELECT ready_build_id, ready_applet_build_id
          FROM recipes
          WHERE id = ?
        `
      )
      .get(parsedBuild.recipeId) as
      | {
          ready_build_id?: string | null;
          ready_applet_build_id?: string | null;
        }
      | undefined;
    const readyBuildId =
      usesPrimaryBuildTrack && isTerminalRecipeBuildPhase(parsedBuild.phase) && parsedBuild.phase === 'ready'
        ? parsedBuild.id
        : currentRecipeRow?.ready_build_id ?? null;
    const readyAppletBuildId =
      parsedBuild.buildKind === 'applet' && isTerminalRecipeBuildPhase(parsedBuild.phase) && parsedBuild.phase === 'ready'
        ? parsedBuild.id
        : currentRecipeRow?.ready_applet_build_id ?? null;

    this.database
      .prepare(
        `
          INSERT INTO recipe_builds (
            id,
            space_id,
            profile_id,
            session_id,
            build_version,
            build_kind,
            trigger_kind,
            trigger_request_id,
            trigger_action_id,
            phase,
            progress_message,
            retry_count,
            started_at,
            updated_at,
            completed_at,
            error_code,
            error_message,
            error_detail,
            failure_category,
            failure_stage,
            user_facing_message,
            retryable,
            configured_timeout_ms
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            space_id = excluded.space_id,
            profile_id = excluded.profile_id,
            session_id = excluded.session_id,
            build_version = excluded.build_version,
            build_kind = excluded.build_kind,
            trigger_kind = excluded.trigger_kind,
            trigger_request_id = excluded.trigger_request_id,
            trigger_action_id = excluded.trigger_action_id,
            phase = excluded.phase,
            progress_message = excluded.progress_message,
            retry_count = excluded.retry_count,
            started_at = excluded.started_at,
            updated_at = excluded.updated_at,
            completed_at = excluded.completed_at,
            error_code = excluded.error_code,
            error_message = excluded.error_message,
            error_detail = excluded.error_detail,
            failure_category = excluded.failure_category,
            failure_stage = excluded.failure_stage,
            user_facing_message = excluded.user_facing_message,
            retryable = excluded.retryable,
            configured_timeout_ms = excluded.configured_timeout_ms
        `
      )
      .run(
        parsedBuild.id,
        parsedBuild.recipeId,
        parsedBuild.profileId,
        parsedBuild.sessionId ?? null,
        parsedBuild.buildVersion,
        parsedBuild.buildKind,
        parsedBuild.triggerKind,
        parsedBuild.triggerRequestId ?? null,
        parsedBuild.triggerActionId ?? null,
        parsedBuild.phase,
        parsedBuild.progressMessage ?? null,
        parsedBuild.retryCount,
        parsedBuild.startedAt,
        parsedBuild.updatedAt,
        parsedBuild.completedAt ?? null,
        parsedBuild.errorCode ?? null,
        parsedBuild.errorMessage ?? null,
        parsedBuild.errorDetail ?? null,
        parsedBuild.failureCategory ?? null,
        parsedBuild.failureStage ?? null,
        parsedBuild.userFacingMessage ?? null,
        parsedBuild.retryable === null ? null : parsedBuild.retryable ? 1 : 0,
        parsedBuild.configuredTimeoutMs ?? null
      );

    this.database
      .prepare(
        `
          UPDATE recipes
          SET
            render_mode = CASE
              WHEN ? = 1 AND ? = 'ready'
                THEN 'dynamic_v1'
              ELSE render_mode
            END,
            active_build_id = CASE WHEN ? = 1 THEN ? ELSE active_build_id END,
            ready_build_id = CASE WHEN ? = 1 THEN ? ELSE ready_build_id END,
            active_applet_build_id = CASE WHEN ? = 'applet' THEN ? ELSE active_applet_build_id END,
            ready_applet_build_id = CASE WHEN ? = 'applet' THEN ? ELSE ready_applet_build_id END,
            build_error_code = ?,
            build_error_message = ?,
            updated_at = ?
          WHERE id = ?
        `
      )
      .run(
        usesPrimaryBuildTrack ? 1 : 0,
        parsedBuild.phase,
        usesPrimaryBuildTrack ? 1 : 0,
        parsedBuild.id,
        usesPrimaryBuildTrack ? 1 : 0,
        readyBuildId,
        parsedBuild.buildKind,
        parsedBuild.id,
        parsedBuild.buildKind,
        readyAppletBuildId,
        parsedBuild.phase === 'failed' ? parsedBuild.errorCode ?? 'RECIPE_BUILD_FAILED' : null,
        parsedBuild.phase === 'failed' ? parsedBuild.errorMessage ?? 'The recipe build failed.' : null,
        parsedBuild.updatedAt,
        parsedBuild.recipeId
      );

    const persistedBuild = this.getRecipeBuild(parsedBuild.id);
    if (!persistedBuild) {
      throw new Error(`Failed to persist recipe build ${parsedBuild.id}.`);
    }

    return persistedBuild;
  }

  updateRecipeBuild(
    buildId: string,
    partial: Partial<Omit<RecipeBuild, 'id' | 'recipeId' | 'profileId' | 'buildVersion' | 'buildKind' | 'triggerKind' | 'startedAt'>>
  ) {
    const current = this.getRecipeBuild(buildId);
    if (!current) {
      return null;
    }

    const normalizedPartial = Object.fromEntries(
      Object.entries(partial).filter(([, value]) => value !== undefined)
    ) as Partial<Omit<RecipeBuild, 'id' | 'recipeId' | 'profileId' | 'buildVersion' | 'triggerKind' | 'startedAt'>>;
    const next = RecipeBuildSchema.parse({
      ...current,
      ...normalizedPartial
    });
    const usesPrimaryBuildTrack = isPrimaryRecipeBuildKind(next.buildKind);
    const currentRecipeRow = this.database
      .prepare(
        `
          SELECT ready_build_id, ready_applet_build_id
          FROM recipes
          WHERE id = ?
        `
      )
      .get(next.recipeId) as
      | {
          ready_build_id?: string | null;
          ready_applet_build_id?: string | null;
        }
      | undefined;
    const readyBuildId =
      usesPrimaryBuildTrack && next.phase === 'ready' ? next.id : currentRecipeRow?.ready_build_id ?? null;
    const readyAppletBuildId =
      next.buildKind === 'applet' && next.phase === 'ready' ? next.id : currentRecipeRow?.ready_applet_build_id ?? null;

    this.database
      .prepare(
        `
          UPDATE recipe_builds
          SET
            session_id = ?,
            trigger_request_id = ?,
            trigger_action_id = ?,
            phase = ?,
            progress_message = ?,
            retry_count = ?,
            updated_at = ?,
            completed_at = ?,
            error_code = ?,
            error_message = ?,
            error_detail = ?,
            failure_category = ?,
            failure_stage = ?,
            user_facing_message = ?,
            retryable = ?,
            configured_timeout_ms = ?
          WHERE id = ?
        `
      )
      .run(
        next.sessionId ?? null,
        next.triggerRequestId ?? null,
        next.triggerActionId ?? null,
        next.phase,
        next.progressMessage ?? null,
        next.retryCount,
        next.updatedAt,
        next.completedAt ?? null,
        next.errorCode ?? null,
        next.errorMessage ?? null,
        next.errorDetail ?? null,
        next.failureCategory ?? null,
        next.failureStage ?? null,
        next.userFacingMessage ?? null,
        next.retryable === null ? null : next.retryable ? 1 : 0,
        next.configuredTimeoutMs ?? null,
        buildId
      );

    this.database
      .prepare(
        `
          UPDATE recipes
          SET
            render_mode = CASE
              WHEN ? = 1 AND ? = 'ready'
                THEN 'dynamic_v1'
              ELSE render_mode
            END,
            active_build_id = CASE WHEN ? = 1 THEN ? ELSE active_build_id END,
            ready_build_id = CASE WHEN ? = 1 THEN ? ELSE ready_build_id END,
            active_applet_build_id = CASE WHEN ? = 'applet' THEN ? ELSE active_applet_build_id END,
            ready_applet_build_id = CASE WHEN ? = 'applet' THEN ? ELSE ready_applet_build_id END,
            build_error_code = ?,
            build_error_message = ?,
            updated_at = ?
          WHERE id = ?
        `
      )
      .run(
        usesPrimaryBuildTrack ? 1 : 0,
        next.phase,
        usesPrimaryBuildTrack ? 1 : 0,
        next.id,
        usesPrimaryBuildTrack ? 1 : 0,
        readyBuildId,
        next.buildKind,
        next.id,
        next.buildKind,
        readyAppletBuildId,
        next.phase === 'failed' ? next.errorCode ?? 'RECIPE_BUILD_FAILED' : null,
        next.phase === 'failed' ? next.errorMessage ?? 'The recipe build failed.' : null,
        next.updatedAt,
        next.recipeId
      );

    return this.getRecipeBuild(buildId);
  }

  upsertRecipeBuildArtifact(artifact: RecipeArtifact) {
    const parsedArtifact = RecipeArtifactSchema.parse(artifact);
    this.database
      .prepare(
        `
          INSERT INTO recipe_build_artifacts (
            id,
            space_id,
            build_id,
            artifact_kind,
            schema_version,
            payload_json,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (build_id, artifact_kind) DO UPDATE SET
            id = excluded.id,
            space_id = excluded.space_id,
            schema_version = excluded.schema_version,
            payload_json = excluded.payload_json,
            updated_at = excluded.updated_at
        `
      )
      .run(
        parsedArtifact.id,
        parsedArtifact.recipeId,
        parsedArtifact.buildId,
        parsedArtifact.artifactKind,
        parsedArtifact.schemaVersion,
        JSON.stringify(parsedArtifact.payload),
        parsedArtifact.createdAt,
        parsedArtifact.updatedAt
      );

    return this.getRecipeBuildArtifact(parsedArtifact.buildId, parsedArtifact.artifactKind);
  }

  getRecipeBuildArtifact(buildId: string, artifactKind: RecipeArtifact['artifactKind']) {
    const row = this.database
      .prepare(
        `
          SELECT *
          FROM recipe_build_artifacts
          WHERE build_id = ?
            AND artifact_kind = ?
          LIMIT 1
        `
      )
      .get(buildId, artifactKind) as Record<string, unknown> | undefined;
    return row ? this.rowToRecipeBuildArtifact(row) : null;
  }

  listRecipeBuildArtifacts(buildId: string) {
    const rows = this.database
      .prepare(
        `
          SELECT *
          FROM recipe_build_artifacts
          WHERE build_id = ?
          ORDER BY updated_at ASC, artifact_kind ASC
        `
      )
      .all(buildId) as Record<string, unknown>[];
    return rows.map((row) => this.rowToRecipeBuildArtifact(row));
  }

  appendRecipeBuildLog(log: RecipeBuildLog) {
    const parsedLog = RecipeBuildLogSchema.parse(log);
    this.database
      .prepare(
        `
          INSERT INTO recipe_build_logs (
            id,
            space_id,
            build_id,
            phase,
            level,
            message,
            detail,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            space_id = excluded.space_id,
            build_id = excluded.build_id,
            phase = excluded.phase,
            level = excluded.level,
            message = excluded.message,
            detail = excluded.detail,
            created_at = excluded.created_at
        `
      )
      .run(
        parsedLog.id,
        parsedLog.recipeId,
        parsedLog.buildId,
        parsedLog.phase,
        parsedLog.level,
        parsedLog.message,
        parsedLog.detail ?? null,
        parsedLog.createdAt
      );

    return parsedLog;
  }

  listRecipeBuildLogs(buildId: string) {
    const rows = this.database
      .prepare(
        `
          SELECT *
          FROM recipe_build_logs
          WHERE build_id = ?
          ORDER BY created_at ASC, id ASC
        `
      )
      .all(buildId) as Record<string, unknown>[];
    return rows.map((row) => this.rowToRecipeBuildLog(row));
  }

  promoteRecipeBuild(
    recipeId: string,
    input: {
      buildId: string;
      tabs?: RecipeTab[];
    }
  ) {
    const currentRecipe = this.getRecipe(recipeId);
    if (!currentRecipe) {
      return null;
    }

    const build = this.getRecipeBuild(input.buildId);
    if (!build || build.recipeId !== recipeId || !isPrimaryRecipeBuildKind(build.buildKind)) {
      return null;
    }

    const nextTabs = input.tabs ? normalizeRecipeTabs({ tabs: input.tabs, currentRecipe }) : currentRecipe.tabs;
    const contentTab = getRecipeContentTab({
      ...currentRecipe,
      tabs: nextTabs
    });
    const updatedAt = build.completedAt ?? build.updatedAt ?? new Date().toISOString();

    this.database
      .prepare(
        `
          UPDATE recipes
          SET
            render_mode = 'dynamic_v1',
            active_build_id = ?,
            ready_build_id = ?,
            build_error_code = NULL,
            build_error_message = NULL,
            view_type = ?,
            data_json = ?,
            tabs_json = ?,
            updated_at = ?
          WHERE id = ?
        `
      )
      .run(
        build.id,
        build.id,
        contentTab ? contentTab.content.activeView : 'markdown',
        JSON.stringify(contentTab ? getRecipeContentViewData(contentTab, contentTab.content.activeView) : {}),
        JSON.stringify(nextTabs),
        updatedAt,
        recipeId
      );

    this.syncAttachedRecipeSessionCache();

    return this.getRecipe(recipeId);
  }

  promoteRecipeAppletBuild(recipeId: string, input: { buildId: string }) {
    const currentRecipe = this.getRecipe(recipeId);
    if (!currentRecipe) {
      return null;
    }

    const build = this.getRecipeBuild(input.buildId);
    if (!build || build.recipeId !== recipeId || build.buildKind !== 'applet') {
      return null;
    }

    const updatedAt = build.completedAt ?? build.updatedAt ?? new Date().toISOString();

    this.database
      .prepare(
        `
          UPDATE recipes
          SET
            render_mode = 'dynamic_v1',
            active_applet_build_id = ?,
            ready_applet_build_id = ?,
            build_error_code = NULL,
            build_error_message = NULL,
            updated_at = ?
          WHERE id = ?
        `
      )
      .run(build.id, build.id, updatedAt, recipeId);

    this.syncAttachedRecipeSessionCache();

    return this.getRecipe(recipeId);
  }

  listProfiles() {
    const rows = this.database.prepare('SELECT * FROM profiles ORDER BY is_active DESC, name ASC').all() as Record<string, unknown>[];
    return rows.map((row) => this.rowToProfile(row));
  }

  syncProfiles(profiles: Profile[], timestamp: string) {
    const insert = this.database.prepare(
      `
        INSERT INTO profiles (id, name, description, path, model, gateway, alias, is_active, last_synced_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          path = excluded.path,
          model = excluded.model,
          gateway = excluded.gateway,
          alias = excluded.alias,
          is_active = excluded.is_active,
          last_synced_at = excluded.last_synced_at
      `
    );

    const seenProfileIds = new Set<string>();
    for (const profile of profiles) {
      seenProfileIds.add(profile.id);
      insert.run(
        profile.id,
        profile.name,
        profile.description,
        profile.path ?? null,
        profile.model ?? null,
        profile.gateway ?? null,
        profile.alias ?? null,
        profile.isActive ? 1 : 0,
        timestamp
      );
    }

    const existingProfileIds = (this.database.prepare('SELECT id FROM profiles').all() as Array<{ id: string }>).map((row) => row.id);
    for (const profileId of existingProfileIds) {
      if (!seenProfileIds.has(profileId)) {
        this.database.prepare('DELETE FROM profiles WHERE id = ?').run(profileId);
      }
    }

    const uiState = this.getUiState();
    const activeProfileId =
      (uiState.activeProfileId && seenProfileIds.has(uiState.activeProfileId) ? uiState.activeProfileId : null) ??
      profiles.find((profile) => profile.isActive)?.id ??
      profiles[0]?.id ??
      null;

    this.setActiveProfile(activeProfileId);
    return this.listProfiles();
  }

  getProfile(profileId: string) {
    const row = this.database.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId) as Record<string, unknown> | undefined;
    return row ? this.rowToProfile(row) : null;
  }

  private getSessionAssociationProfileIds(sessionId: string) {
    const rows = this.database
      .prepare(
        `
          SELECT profile_id
          FROM session_profile_associations
          WHERE session_id = ?
          ORDER BY last_interacted_at DESC, profile_id ASC
        `
      )
      .all(sessionId) as Array<{ profile_id: string }>;

    return rows.map((row) => row.profile_id);
  }

  private refreshSessionAssociationCache(sessionId: string) {
    const profileIds = this.getSessionAssociationProfileIds(sessionId);
    this.database
      .prepare('UPDATE sessions SET associated_profile_ids_json = ? WHERE id = ?')
      .run(JSON.stringify(profileIds), sessionId);
    return profileIds;
  }

  associateSessionWithProfile(
    sessionId: string,
    profileId: string,
    source: SessionAssociationSource,
    timestamp: string,
    options: {
      lastInteractedAt?: string;
      preserveMoreRecentInteraction?: boolean;
    } = {}
  ) {
    const lastInteractedAt = options.lastInteractedAt ?? timestamp;
    const preserveMoreRecentInteraction = options.preserveMoreRecentInteraction === true;
    this.database
      .prepare(
        `
          INSERT INTO session_profile_associations (session_id, profile_id, source, created_at, last_interacted_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT (session_id, profile_id) DO UPDATE SET
            source = CASE
              WHEN excluded.source = 'hermes_profile_scope' AND session_profile_associations.source <> 'hermes_profile_scope'
                THEN session_profile_associations.source
              WHEN session_profile_associations.source = 'legacy_import' AND excluded.source <> 'hermes_profile_scope'
                THEN session_profile_associations.source
              ELSE excluded.source
            END,
            last_interacted_at = CASE
              WHEN ? = 1 AND session_profile_associations.last_interacted_at > excluded.last_interacted_at
                THEN session_profile_associations.last_interacted_at
              ELSE excluded.last_interacted_at
            END
        `
      )
      .run(sessionId, profileId, source, timestamp, lastInteractedAt, preserveMoreRecentInteraction ? 1 : 0);

    this.database
      .prepare('UPDATE sessions SET last_used_profile_id = ? WHERE id = ?')
      .run(profileId, sessionId);

    return this.refreshSessionAssociationCache(sessionId);
  }

  isSessionAssociatedWithProfile(sessionId: string, profileId: string) {
    const row = this.database
      .prepare(
        `
          SELECT 1
          FROM session_profile_associations
          WHERE session_id = ?
            AND profile_id = ?
          LIMIT 1
        `
      )
      .get(sessionId, profileId) as { 1: number } | undefined;

    return Boolean(row);
  }

  listRecentSessions(profileId: string, limit: number) {
    const preferredIds = sortSessionIds(this.getUiState().recentSessionIdsByProfile[profileId] ?? [], 100);
    const orderedPreferredSessions: Session[] = [];

    if (preferredIds.length > 0) {
      const placeholders = preferredIds.map(() => '?').join(', ');
      const preferredRows = this.database
        .prepare(
          `
            SELECT sessions.*
            FROM sessions
            INNER JOIN session_profile_associations
              ON session_profile_associations.session_id = sessions.id
            WHERE session_profile_associations.profile_id = ?
              AND sessions.is_hidden_synthetic = 0
              AND sessions.deleted_at IS NULL
              AND sessions.id IN (${placeholders})
          `
        )
        .all(profileId, ...preferredIds) as Record<string, unknown>[];
      const preferredById = new Map(preferredRows.map((row) => [String(row.id), this.rowToSession(row)]));
      for (const sessionId of preferredIds) {
        const session = preferredById.get(sessionId);
        if (session) {
          orderedPreferredSessions.push(session);
        }
        if (orderedPreferredSessions.length >= limit) {
          return orderedPreferredSessions.slice(0, limit);
        }
      }
    }

    const remaining = Math.max(limit - orderedPreferredSessions.length, 0);
    if (remaining === 0) {
      return orderedPreferredSessions;
    }

    const excludedIds = orderedPreferredSessions.map((session) => session.id);
    const excludedClause =
      excludedIds.length > 0 ? `AND sessions.id NOT IN (${excludedIds.map(() => '?').join(', ')})` : '';
    const supplementalRows = this.database
      .prepare(
        `
          SELECT sessions.*
          FROM sessions
          INNER JOIN session_profile_associations
            ON session_profile_associations.session_id = sessions.id
          WHERE session_profile_associations.profile_id = ?
            AND sessions.is_hidden_synthetic = 0
            AND sessions.deleted_at IS NULL
            ${excludedClause}
          ORDER BY session_profile_associations.last_interacted_at DESC, sessions.last_updated_at DESC, sessions.title ASC
          LIMIT ?
        `
      )
      .all(profileId, ...excludedIds, remaining) as Record<string, unknown>[];

    return [...orderedPreferredSessions, ...supplementalRows.map((row) => this.rowToSession(row))];
  }

  listSessions(options: { profileId: string; page: number; pageSize: number; search: string }) {
    const search = options.search.trim();
    const searchPattern = `%${search.toLowerCase()}%`;
    const offset = (options.page - 1) * options.pageSize;
    const whereClause =
      search.length > 0
        ? `
          WHERE session_profile_associations.profile_id = ?
            AND sessions.is_hidden_synthetic = 0
            AND sessions.deleted_at IS NULL
            AND (lower(sessions.title) LIKE ? OR lower(sessions.summary) LIKE ?)
        `
        : `
          WHERE session_profile_associations.profile_id = ?
            AND sessions.is_hidden_synthetic = 0
            AND sessions.deleted_at IS NULL
        `;
    const items = this.database
      .prepare(
        `
          SELECT sessions.*
          FROM sessions
          INNER JOIN session_profile_associations
            ON session_profile_associations.session_id = sessions.id
          ${whereClause}
          ORDER BY session_profile_associations.last_interacted_at DESC, sessions.last_updated_at DESC, sessions.title ASC
          LIMIT ? OFFSET ?
        `
      )
      .all(
        ...(search.length > 0
          ? [options.profileId, searchPattern, searchPattern]
          : [options.profileId]),
        options.pageSize,
        offset
      ) as Record<string, unknown>[];

    const countRow = this.database
      .prepare(
        `
          SELECT COUNT(*) as count
          FROM sessions
          INNER JOIN session_profile_associations
            ON session_profile_associations.session_id = sessions.id
          ${whereClause}
        `
      )
      .get(...(search.length > 0 ? [options.profileId, searchPattern, searchPattern] : [options.profileId])) as {
      count: number;
    };

    const hiddenCountRow = this.database
      .prepare(
        `
          SELECT COUNT(*) as count
          FROM sessions
          INNER JOIN session_profile_associations
            ON session_profile_associations.session_id = sessions.id
          WHERE session_profile_associations.profile_id = ?
            AND sessions.is_hidden_synthetic = 1
        `
      )
      .get(options.profileId) as { count: number };

    return {
      items: items.map((row) => this.rowToSession(row)),
      total: countRow.count,
      hiddenSyntheticCount: hiddenCountRow.count
    };
  }

  getSessionSummary(profileId: string, recentLimit = 5) {
    const visibleRow = this.database
      .prepare(
        `
          SELECT COUNT(*) as count
          FROM sessions
          INNER JOIN session_profile_associations
            ON session_profile_associations.session_id = sessions.id
          WHERE session_profile_associations.profile_id = ?
            AND sessions.is_hidden_synthetic = 0
            AND sessions.deleted_at IS NULL
        `
      )
      .get(profileId) as { count: number };
    const hiddenRow = this.database
      .prepare(
        `
          SELECT COUNT(*) as count
          FROM sessions
          INNER JOIN session_profile_associations
            ON session_profile_associations.session_id = sessions.id
          WHERE session_profile_associations.profile_id = ?
            AND sessions.is_hidden_synthetic = 1
            AND sessions.deleted_at IS NULL
        `
      )
      .get(profileId) as { count: number };

    return {
      profileId,
      visibleCount: visibleRow.count,
      hiddenSyntheticCount: hiddenRow.count,
      recentCount: Math.min(visibleRow.count, recentLimit)
    };
  }

  private insertSession(
    row: Session & {
      createdAt: string;
      updatedAt: string;
      lastMessageSyncAt?: string | null;
      titleOverride?: string | null;
      deletedAt?: string | null;
      deletionMode?: string | null;
    }
  ) {
    const visibility = classifySessionVisibility(row);
    const effectiveTitle = row.titleOverride && row.titleOverride.trim().length > 0 ? row.titleOverride : row.title;
    this.database
      .prepare(
        `
          INSERT INTO sessions (
            id,
            runtime_session_id,
            title,
            title_override,
            summary,
            source,
            last_updated_at,
            last_used_profile_id,
            linked_space_id,
            associated_profile_ids_json,
            is_hidden_synthetic,
            hidden_reason,
            deleted_at,
            deletion_mode,
            message_count,
            last_message_sync_at,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            runtime_session_id = excluded.runtime_session_id,
            title = excluded.title,
            title_override = excluded.title_override,
            summary = excluded.summary,
            source = excluded.source,
            last_updated_at = excluded.last_updated_at,
            last_used_profile_id = excluded.last_used_profile_id,
            linked_space_id = excluded.linked_space_id,
            associated_profile_ids_json = excluded.associated_profile_ids_json,
            is_hidden_synthetic = excluded.is_hidden_synthetic,
            hidden_reason = excluded.hidden_reason,
            deleted_at = excluded.deleted_at,
            deletion_mode = excluded.deletion_mode,
            message_count = excluded.message_count,
            last_message_sync_at = excluded.last_message_sync_at,
            updated_at = excluded.updated_at
        `
      )
      .run(
        row.id,
        row.runtimeSessionId ?? null,
        effectiveTitle,
        row.titleOverride ?? null,
        row.summary,
        row.source,
        row.lastUpdatedAt,
        row.lastUsedProfileId ?? null,
        row.attachedRecipeId ?? null,
        JSON.stringify(sortSessionIds(row.associatedProfileIds, 100)),
        visibility.hidden ? 1 : 0,
        visibility.reason ?? null,
        row.deletedAt ?? null,
        row.deletionMode ?? null,
        row.messageCount,
        row.lastMessageSyncAt ?? null,
        row.createdAt,
        row.updatedAt
      );
  }

  syncSessions(profileId: string, runtimeSessions: Session[], timestamp: string) {
    const findByRuntime = this.database.prepare('SELECT * FROM sessions WHERE runtime_session_id = ?');
    const seenSessionIds = new Set<string>();

    for (const runtimeSession of runtimeSessions) {
      const existingRow = runtimeSession.runtimeSessionId
        ? (findByRuntime.get(runtimeSession.runtimeSessionId) as Record<string, unknown> | undefined)
        : undefined;
      const existingSession = existingRow ? this.rowToSession(existingRow) : null;
      const localId = existingSession?.id ?? (runtimeSession.runtimeSessionId ? `runtime-${runtimeSession.runtimeSessionId}` : runtimeSession.id);
      const nextSession: Session = {
        ...runtimeSession,
        id: localId,
        lastUsedProfileId: profileId,
        associatedProfileIds: sortSessionIds([profileId, ...(existingSession?.associatedProfileIds ?? [])], 100),
        messageCount: existingSession?.messageCount ?? runtimeSession.messageCount,
        attachedRecipeId: existingSession?.attachedRecipeId ?? runtimeSession.attachedRecipeId ?? null,
        recipeType:
          (existingSession?.attachedRecipeId ?? runtimeSession.attachedRecipeId ?? null) ? 'home' : 'tui'
      };
      const deletedAt = typeof existingRow?.deleted_at === 'string' ? existingRow.deleted_at : null;
      const deletionMode = typeof existingRow?.deletion_mode === 'string' ? existingRow.deletion_mode : null;
      const shouldReactivate = isNewerThanDeletedAt(nextSession.lastUpdatedAt, deletedAt);

      // If a recipe is linked to this session and no manual rename has been done,
      // prefer the recipe title over the raw first-message title from the CLI.
      const existingTitleOverride = (existingRow?.title_override as string | undefined) ?? null;
      const linkedRecipe = !existingTitleOverride
        ? this.getRecipeByPrimarySessionId(profileId, localId)
        : null;
      const resolvedTitle = linkedRecipe?.title?.trim()
        ? generateSessionTitle(linkedRecipe.title.trim(), nextSession.title)
        : nextSession.title;

      this.insertSession({
        ...nextSession,
        title: resolvedTitle,
        createdAt: (existingRow?.created_at as string | undefined) ?? timestamp,
        updatedAt: timestamp,
        lastMessageSyncAt: (existingRow?.last_message_sync_at as string | undefined) ?? null,
        titleOverride: existingTitleOverride,
        deletedAt: shouldReactivate ? null : deletedAt,
        deletionMode: shouldReactivate ? null : deletionMode
      });
      this.associateSessionWithProfile(localId, profileId, 'hermes_profile_scope', timestamp, {
        lastInteractedAt: runtimeSession.lastUpdatedAt,
        preserveMoreRecentInteraction: true
      });
      seenSessionIds.add(localId);
    }

    const staleAssociationRows = this.database
      .prepare(
        `
          SELECT session_profile_associations.session_id, session_profile_associations.source
          FROM session_profile_associations
          INNER JOIN sessions ON sessions.id = session_profile_associations.session_id
          WHERE session_profile_associations.profile_id = ?
            AND sessions.runtime_session_id IS NOT NULL
            AND sessions.source = 'hermes_cli'
        `
      )
      .all(profileId) as Array<{ session_id: string; source: SessionAssociationSource }>;

    for (const row of staleAssociationRows) {
      if (seenSessionIds.has(row.session_id)) {
        continue;
      }

      if (row.source === 'legacy_import') {
        continue;
      }

      this.database
        .prepare('DELETE FROM session_profile_associations WHERE profile_id = ? AND session_id = ?')
        .run(profileId, row.session_id);
      this.refreshSessionAssociationCache(row.session_id);
    }

    return seenSessionIds;
  }

  createSession(profileId: string, timestamp: string) {
    const session: Session = {
      id: randomUUID(),
      title: 'New session',
      summary: 'Ready for the next Hermes request.',
      source: 'local',
      lastUpdatedAt: timestamp,
      lastUsedProfileId: profileId,
      associatedProfileIds: [profileId],
      messageCount: 0,
      attachedRecipeId: null,
      recipeType: 'tui'
    };

    this.insertSession({
      ...session,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastMessageSyncAt: null,
      titleOverride: null,
      deletedAt: null,
      deletionMode: null
    });
    this.associateSessionWithProfile(session.id, profileId, 'bridge_created', timestamp);
    this.setActiveSession(profileId, session.id);
    return session;
  }

  importSession(
    session: Session,
    options: {
      createdAt: string;
      updatedAt: string;
      lastMessageSyncAt?: string | null;
    }
  ) {
    const parsedSession = SessionSchema.parse(session);
    this.insertSession({
      ...parsedSession,
      createdAt: options.createdAt,
      updatedAt: options.updatedAt,
      lastMessageSyncAt: options.lastMessageSyncAt ?? null,
      titleOverride: null,
      deletedAt: null,
      deletionMode: null
    });

    if (parsedSession.lastUsedProfileId) {
      this.associateSessionWithProfile(parsedSession.id, parsedSession.lastUsedProfileId, 'legacy_import', options.updatedAt);
    }

    return this.getSession(parsedSession.id);
  }

  getSession(sessionId: string) {
    const row = this.database.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as Record<string, unknown> | undefined;
    return row ? this.rowToSession(row) : null;
  }

  private getDeletedAt(sessionId: string) {
    const row = this.database.prepare('SELECT deleted_at FROM sessions WHERE id = ?').get(sessionId) as
      | { deleted_at?: string | null }
      | undefined;
    return row?.deleted_at ?? null;
  }

  private getSessionStorageState(sessionId: string) {
    return this.database
      .prepare(
        `
          SELECT created_at, last_message_sync_at, title_override, deleted_at, deletion_mode
          FROM sessions
          WHERE id = ?
        `
      )
      .get(sessionId) as
      | {
          created_at: string;
          last_message_sync_at?: string | null;
          title_override?: string | null;
          deleted_at?: string | null;
          deletion_mode?: string | null;
        }
      | undefined;
  }

  getSessionByRuntimeId(runtimeSessionId: string) {
    const row = this.database.prepare('SELECT * FROM sessions WHERE runtime_session_id = ?').get(runtimeSessionId) as Record<string, unknown> | undefined;
    return row ? this.rowToSession(row) : null;
  }

  getProfilesMetrics(): Array<{ profileId: string; sessionCount: number; messageCount: number; recipeCount: number }> {
    const sessionRows = this.database
      .prepare(
        `SELECT spa.profile_id AS profileId,
                COUNT(DISTINCT s.id) AS sessionCount,
                COALESCE(SUM(s.message_count), 0) AS messageCount
         FROM session_profile_associations spa
         JOIN sessions s ON s.id = spa.session_id
         WHERE s.deleted_at IS NULL
         GROUP BY spa.profile_id`
      )
      .all() as Array<{ profileId: string; sessionCount: number; messageCount: number }>;

    const recipeRows = this.database
      .prepare(
        `SELECT profile_id AS profileId, COUNT(*) AS recipeCount
         FROM recipes
         WHERE deleted_at IS NULL
         GROUP BY profile_id`
      )
      .all() as Array<{ profileId: string; recipeCount: number }>;

    const recipeMap = new Map(recipeRows.map((r) => [r.profileId, r.recipeCount]));

    return sessionRows.map((r) => ({
      profileId: r.profileId,
      sessionCount: Number(r.sessionCount),
      messageCount: Number(r.messageCount),
      recipeCount: Number(recipeMap.get(r.profileId) ?? 0)
    }));
  }

  refreshSessionTitleFromConversation(sessionId: string, userContent: string, assistantContent: string) {
    const session = this.getSession(sessionId);
    if (!session) return;
    const storageState = this.getSessionStorageState(sessionId);

    // If the session has a linked space/recipe and the user hasn't manually renamed it,
    // use the recipe title directly — it's always more meaningful than a message-derived title.
    const profileId = session.lastUsedProfileId;
    if (profileId && !storageState?.title_override) {
      const linkedRecipe = this.getRecipeByPrimarySessionId(profileId, sessionId);
      if (linkedRecipe?.title?.trim()) {
        const recipeTitle = generateSessionTitle(linkedRecipe.title.trim(), linkedRecipe.title.trim());
        if (recipeTitle && recipeTitle !== session.title) {
          this.updateSession({ id: sessionId, title: recipeTitle });
        }
        return;
      }
    }

    // Combine the user prompt with the first substantive line from the assistant response
    // so the title can reflect actual results (e.g. "Asian Restaurants Cleveland" rather than
    // just the raw question).
    const assistantHint = assistantContent
      .split('\n')
      .map((l) => l.replace(/^#+\s*/u, '').trim())
      .find((l) => l.length > 10 && !l.startsWith('```') && !l.startsWith('|')) ?? '';
    const combinedSource = assistantHint
      ? `${userContent.trim()} ${assistantHint}`.trim()
      : userContent.trim();
    const nextTitle = resolveAutoSessionTitle(session.title, combinedSource, {
      titleOverride: storageState?.title_override ?? null
    });
    if (nextTitle !== session.title) {
      this.updateSession({ id: sessionId, title: nextTitle });
    }
  }

  renameSessionTitle(sessionId: string, title: string, options: { persistOverride: boolean }) {
    const session = this.getSession(sessionId);
    if (!session) {
      return null;
    }

    this.database
      .prepare(
        `
          UPDATE sessions
          SET title = ?, title_override = ?, updated_at = ?
          WHERE id = ?
        `
      )
      .run(title, options.persistOverride ? title : null, new Date().toISOString(), sessionId);

    return this.getSession(sessionId);
  }

  markSessionDeleted(sessionId: string, mode: 'soft' | 'hybrid', timestamp: string) {
    const session = this.getSession(sessionId);
    if (!session) {
      return null;
    }

    const attachedRecipe = session.attachedRecipeId ? this.getRecipe(session.attachedRecipeId) : null;
    if (attachedRecipe) {
      const replacementSessionId = randomUUID();
      const replacementSession: Session = {
        id: replacementSessionId,
        title: generateSessionTitle(attachedRecipe.title, attachedRecipe.title),
        summary: truncate(attachedRecipe.description?.trim() || 'Structured recipe attached to this session.', 96),
        source: 'local',
        lastUpdatedAt: timestamp,
        lastUsedProfileId: attachedRecipe.profileId,
        associatedProfileIds: [attachedRecipe.profileId],
        messageCount: 0,
        attachedRecipeId: attachedRecipe.id,
        recipeType: 'home'
      };

      this.insertSession({
        ...replacementSession,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastMessageSyncAt: null,
        titleOverride: replacementSession.title,
        deletedAt: null,
        deletionMode: null
      });
      this.associateSessionWithProfile(replacementSessionId, attachedRecipe.profileId, 'bridge_created', timestamp, {
        preserveMoreRecentInteraction: true
      });
      this.database
        .prepare(
          `
            UPDATE recipes
            SET primary_session_id = ?, primary_runtime_session_id = NULL, linked_session_id = ?, linked_runtime_session_id = NULL, updated_at = ?
            WHERE id = ?
          `
        )
        .run(replacementSessionId, replacementSessionId, timestamp, attachedRecipe.id);
    }

    this.database
      .prepare(
        `
          UPDATE sessions
          SET deleted_at = ?, deletion_mode = ?, updated_at = ?
          WHERE id = ?
        `
      )
      .run(timestamp, mode, timestamp, sessionId);
    this.syncAttachedRecipeSessionCache();

    const currentUiState = this.getUiState();
    const nextActiveSessionIdByProfile = normalizeActiveIdsByProfile(
      Object.fromEntries(
        Object.entries(currentUiState.activeSessionIdByProfile).map(([profileId, activeSessionId]) => [
          profileId,
          activeSessionId === sessionId ? null : activeSessionId
        ])
      )
    );
    const nextRecentSessionIdsByProfile = normalizeRecentSessionsByProfile(
      Object.fromEntries(
        Object.entries(currentUiState.recentSessionIdsByProfile).map(([profileId, sessionIds]) => [
          profileId,
          sessionIds.filter((recentSessionId) => recentSessionId !== sessionId)
        ])
      )
    );

    this.updateUiState({
      activeSessionIdByProfile: nextActiveSessionIdByProfile,
      recentSessionIdsByProfile: nextRecentSessionIdsByProfile
    });

    return {
      sessionId,
      mode,
      deletedAt: timestamp
    };
  }

  private mergeRuntimeSessionCollision(targetSessionId: string, runtimeSessionId: string) {
    const targetRow = this.database.prepare('SELECT * FROM sessions WHERE id = ?').get(targetSessionId) as Record<string, unknown> | undefined;
    const conflictingRow = this.database.prepare('SELECT * FROM sessions WHERE runtime_session_id = ?').get(runtimeSessionId) as
      | Record<string, unknown>
      | undefined;

    if (!targetRow || !conflictingRow || conflictingRow.id === targetSessionId) {
      return;
    }

    const targetSession = this.rowToSession(targetRow);
    const conflictingSession = this.rowToSession(conflictingRow);

    this.database.prepare('UPDATE messages SET session_id = ? WHERE session_id = ?').run(targetSessionId, conflictingSession.id);
    this.database.prepare('UPDATE tool_executions SET session_id = ? WHERE session_id = ?').run(targetSessionId, conflictingSession.id);
    this.database
      .prepare(
        `
          UPDATE recipes
          SET primary_session_id = ?, linked_session_id = ?, primary_runtime_session_id = ?, linked_runtime_session_id = ?
          WHERE primary_session_id = ?
        `
      )
      .run(targetSessionId, targetSessionId, runtimeSessionId, runtimeSessionId, conflictingSession.id);

    const conflictingAssociations = this.database
      .prepare(
        `
          SELECT profile_id, source, created_at, last_interacted_at
          FROM session_profile_associations
          WHERE session_id = ?
        `
      )
      .all(conflictingSession.id) as Array<{
      profile_id: string;
      source: string;
      created_at: string;
      last_interacted_at: string;
    }>;

    const upsertAssociation = this.database.prepare(
      `
        INSERT INTO session_profile_associations (session_id, profile_id, source, created_at, last_interacted_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (session_id, profile_id) DO UPDATE SET
          source = excluded.source,
          last_interacted_at = CASE
            WHEN excluded.last_interacted_at > session_profile_associations.last_interacted_at
              THEN excluded.last_interacted_at
            ELSE session_profile_associations.last_interacted_at
          END
      `
    );

    for (const association of conflictingAssociations) {
      upsertAssociation.run(
        targetSessionId,
        association.profile_id,
        association.source,
        association.created_at,
        association.last_interacted_at
      );
    }

    this.database.prepare('DELETE FROM session_profile_associations WHERE session_id = ?').run(conflictingSession.id);

    const currentUiState = this.getUiState();
    const nextActiveSessionIdByProfile = normalizeActiveIdsByProfile(
      Object.fromEntries(
        Object.entries(currentUiState.activeSessionIdByProfile).map(([profileId, sessionId]) => [
          profileId,
          sessionId === conflictingSession.id ? targetSessionId : sessionId
        ])
      )
    );
    const nextRecentSessionIdsByProfile = normalizeRecentSessionsByProfile(
      Object.fromEntries(
        Object.entries(currentUiState.recentSessionIdsByProfile).map(([profileId, sessionIds]) => [
          profileId,
          sortSessionIds(sessionIds.map((sessionId) => (sessionId === conflictingSession.id ? targetSessionId : sessionId)))
        ])
      )
    );
    this.updateUiState({
      activeSessionIdByProfile: nextActiveSessionIdByProfile,
      recentSessionIdsByProfile: nextRecentSessionIdsByProfile
    });

    this.database.prepare('DELETE FROM sessions WHERE id = ?').run(conflictingSession.id);
    this.refreshSessionAssociationCache(targetSessionId);
    this.syncAttachedRecipeSessionCache();

    const mergedMessages = this.listMessages(targetSessionId);
    const mergedSummary = summarizeVisibleMessages(mergedMessages, targetSession.summary);
    const lastVisibleMessage = [...mergedSummary.visibleMessages]
      .reverse()
      .find((message) => message.role === 'assistant' || message.role === 'user' || message.role === 'system');
    const firstUserMessage = mergedSummary.visibleMessages.find((message) => message.role === 'user');
    const fallbackTitle = targetSession.title === 'New session' ? conflictingSession.title : targetSession.title;
    const fallbackSummary =
      targetSession.summary === 'Ready for the next Hermes request.' ? conflictingSession.summary : targetSession.summary;
    const titleSource = firstUserMessage?.content.trim() || fallbackTitle;
    const summarySource = lastVisibleMessage?.content.trim() || fallbackSummary;
    const lastUpdatedAt =
      lastVisibleMessage?.createdAt ??
      (targetSession.lastUpdatedAt > conflictingSession.lastUpdatedAt ? targetSession.lastUpdatedAt : conflictingSession.lastUpdatedAt);
    const lastMessageSyncAt =
      typeof conflictingRow.last_message_sync_at === 'string'
        ? conflictingRow.last_message_sync_at
        : typeof targetRow.last_message_sync_at === 'string'
          ? targetRow.last_message_sync_at
          : null;

    this.database
      .prepare(
        `
          UPDATE sessions
          SET title = ?, summary = ?, last_updated_at = ?, last_used_profile_id = ?, message_count = ?, last_message_sync_at = ?, updated_at = ?
          WHERE id = ?
        `
      )
      .run(
        generateSessionTitle(titleSource, fallbackTitle),
        truncate(summarySource, 96),
        lastUpdatedAt,
        targetSession.lastUsedProfileId ?? conflictingSession.lastUsedProfileId ?? null,
        mergedSummary.messageCount,
        lastMessageSyncAt,
        new Date().toISOString(),
        targetSessionId
      );

    this.refreshSessionAssociationCache(targetSessionId);
  }

  updateSession(partial: Pick<Session, 'id'> & Partial<Omit<Session, 'id'>>) {
    if (partial.runtimeSessionId) {
      this.mergeRuntimeSessionCollision(partial.id, partial.runtimeSessionId);
    }

    const current = this.getSession(partial.id);
    if (!current) {
      return null;
    }

    const timestamp = new Date().toISOString();
    const nextSession = SessionSchema.parse({
      ...current,
      ...partial
    });

    const existingRow = this.getSessionStorageState(partial.id);
    if (!existingRow) {
      return null;
    }

    this.insertSession({
      ...nextSession,
      createdAt: existingRow.created_at,
      updatedAt: timestamp,
      lastMessageSyncAt: existingRow.last_message_sync_at ?? null,
      titleOverride: existingRow.title_override ?? null,
      deletedAt: existingRow.deleted_at ?? null,
      deletionMode: existingRow.deletion_mode ?? null
    });

    if (nextSession.lastUsedProfileId) {
      this.associateSessionWithProfile(partial.id, nextSession.lastUsedProfileId, 'bridge_chat', timestamp);
    }

    return this.getSession(partial.id);
  }

  listMessages(sessionId: string) {
    const rows = this.database
      .prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC, rowid ASC')
      .all(sessionId) as Record<string, unknown>[];
    return rows.map((row) => this.rowToMessage(row));
  }

  appendMessage(message: ChatMessage, options: { skipTitleUpdate?: boolean } = {}) {
    const parsedMessage = ChatMessageSchema.parse(message);
    const existingMessages = this.listMessages(parsedMessage.sessionId);
    const previousRequestId = existingMessages.at(-1)?.requestId ?? null;
    const normalizedMessage = normalizeMessageForPersistence(parsedMessage, previousRequestId).message;
    this.database
      .prepare(
        `
          INSERT INTO messages (id, session_id, role, content, created_at, status, metadata_json)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        normalizedMessage.id,
        normalizedMessage.sessionId,
        normalizedMessage.role,
        normalizedMessage.content,
        normalizedMessage.createdAt,
        normalizedMessage.status,
        JSON.stringify({
          requestId: normalizedMessage.requestId,
          visibility: normalizedMessage.visibility,
          kind: normalizedMessage.kind,
          ...(normalizedMessage.attachments?.length ? { attachments: normalizedMessage.attachments } : {})
        })
      );

    const session = this.getSession(normalizedMessage.sessionId);
    if (session) {
      const storageState = this.getSessionStorageState(session.id);
      const nextMessageCount = session.messageCount + (normalizedMessage.visibility === 'transcript' ? 1 : 0);
      const summary =
        normalizedMessage.visibility === 'transcript' &&
        (normalizedMessage.role === 'assistant' || normalizedMessage.role === 'user' || normalizedMessage.role === 'system')
          ? truncate(normalizedMessage.content.trim() || session.summary, 96)
          : session.summary;
      const title =
        !options.skipTitleUpdate && normalizedMessage.role === 'user' && normalizedMessage.visibility === 'transcript'
          ? resolveAutoSessionTitle(session.title, normalizedMessage.content.trim(), {
              titleOverride: storageState?.title_override ?? null
            })
          : session.title;

      this.updateSession({
        id: session.id,
        title,
        summary,
        lastUpdatedAt: normalizedMessage.createdAt,
        messageCount: nextMessageCount
      });
    }

    return normalizedMessage;
  }

  replaceSessionMessages(sessionId: string, messages: ChatMessage[], syncedAt: string) {
    const parsedMessages = normalizePersistedSessionMessages(messages.map((message) => ChatMessageSchema.parse(message))).messages;
    this.database.prepare('DELETE FROM messages WHERE session_id = ?').run(sessionId);
    const insert = this.database.prepare(
      `
        INSERT INTO messages (id, session_id, role, content, created_at, status, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
    );

    for (const message of parsedMessages) {
      insert.run(
        message.id,
        message.sessionId,
        message.role,
        message.content,
        message.createdAt,
        message.status,
        JSON.stringify({
          requestId: message.requestId,
          visibility: message.visibility,
          kind: message.kind
        })
      );
    }

    const session = this.getSession(sessionId);
    if (session) {
      const storageState = this.getSessionStorageState(sessionId);
      const nextSummary = summarizeVisibleMessages(parsedMessages, session.summary);
      const deletedAt = this.getDeletedAt(sessionId);
      const latestVisibleMessageAt = nextSummary.visibleMessages.at(-1)?.createdAt ?? null;
      if (isNewerThanDeletedAt(latestVisibleMessageAt, deletedAt)) {
        this.database.prepare('UPDATE sessions SET deleted_at = NULL, deletion_mode = NULL WHERE id = ?').run(sessionId);
      }

      this.database
        .prepare(
          `
            UPDATE sessions
            SET message_count = ?, last_updated_at = ?, last_message_sync_at = ?, summary = ?, title = ?
            WHERE id = ?
          `
        )
        .run(
          nextSummary.messageCount,
          nextSummary.lastUpdatedAt ?? session.lastUpdatedAt,
          syncedAt,
          nextSummary.summary,
          resolveAutoSessionTitle(
            session.title,
            nextSummary.visibleMessages
              .filter((message) => message.role === 'user')
              .map((message) => message.content)
              .at(-1) ?? '',
            {
              titleOverride: storageState?.title_override ?? null
            }
          ),
          sessionId
        );
    }

    return this.listMessages(sessionId);
  }

  getLastMessageSyncAt(sessionId: string) {
    const row = this.database.prepare('SELECT last_message_sync_at FROM sessions WHERE id = ?').get(sessionId) as {
      last_message_sync_at?: string | null;
    } | null;
    return row?.last_message_sync_at ?? null;
  }

  markSessionMessagesSynced(sessionId: string, syncedAt: string) {
    this.database
      .prepare(
        `
          UPDATE sessions
          SET last_message_sync_at = ?
          WHERE id = ?
        `
      )
      .run(syncedAt, sessionId);
  }

  ensureRuntimeRequest(input: {
    requestId: string;
    sessionId: string;
    profileId: string | null;
    preview: string;
    startedAt: string;
    status?: RuntimeRequest['status'];
  }) {
    const status = input.status ?? 'running';
    this.database
      .prepare(
        `
          INSERT INTO runtime_requests (
            request_id,
            session_id,
            profile_id,
            preview,
            status,
            started_at,
            updated_at,
            completed_at,
            last_error,
            metadata_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '{}')
          ON CONFLICT (request_id) DO UPDATE SET
            session_id = excluded.session_id,
            profile_id = COALESCE(excluded.profile_id, runtime_requests.profile_id),
            preview = CASE
              WHEN runtime_requests.preview = 'Hermes request' AND excluded.preview <> 'Hermes request'
                THEN excluded.preview
              WHEN length(trim(runtime_requests.preview)) = 0
                THEN excluded.preview
              ELSE runtime_requests.preview
            END,
            status = CASE
              WHEN runtime_requests.status IN ('completed', 'failed', 'cancelled', 'denied')
                THEN runtime_requests.status
              ELSE excluded.status
            END,
            updated_at = CASE
              WHEN excluded.started_at > runtime_requests.updated_at
                THEN excluded.started_at
              ELSE runtime_requests.updated_at
            END
        `
      )
      .run(
        input.requestId,
        input.sessionId,
        input.profileId,
        input.preview,
        status,
        input.startedAt,
        input.startedAt,
        status === 'running' || status === 'idle' ? null : input.startedAt,
        null
      );
  }

  updateRuntimeRequestRecipePipeline(requestId: string, pipeline: RecipePipelineState | null) {
    const row = this.database.prepare('SELECT metadata_json FROM runtime_requests WHERE request_id = ?').get(requestId) as
      | { metadata_json?: string | null }
      | undefined;
    if (!row) {
      return null;
    }

    const currentMetadata = parseJson<{ recipePipeline?: RecipePipelineState }>(String(row.metadata_json ?? '{}'), {});
    const nextMetadata =
      pipeline === null
        ? Object.fromEntries(Object.entries(currentMetadata).filter(([key]) => key !== 'recipePipeline'))
        : {
            ...currentMetadata,
            recipePipeline: RecipePipelineStateSchema.parse(pipeline)
          };

    this.database
      .prepare(
        `
          UPDATE runtime_requests
          SET metadata_json = ?
          WHERE request_id = ?
        `
      )
      .run(JSON.stringify(nextMetadata), requestId);

    return this.getRuntimeRequest(requestId);
  }

  upsertRuntimeRequestStatus(
    requestId: string,
    status: RuntimeRequest['status'],
    timestamp: string,
    options: {
      preview?: string;
      profileId?: string | null;
      sessionId?: string;
      lastError?: string;
    } = {}
  ) {
    const row = this.database.prepare('SELECT * FROM runtime_requests WHERE request_id = ?').get(requestId) as Record<string, unknown> | undefined;
    if (!row) {
      if (!options.sessionId) {
        return null;
      }

      this.ensureRuntimeRequest({
        requestId,
        sessionId: options.sessionId,
        profileId: options.profileId ?? null,
        preview: options.preview ?? 'Hermes request',
        startedAt: timestamp,
        status
      });
    }

    this.database
      .prepare(
        `
          UPDATE runtime_requests
          SET
            profile_id = COALESCE(?, profile_id),
            preview = COALESCE(?, preview),
            status = ?,
            updated_at = ?,
            completed_at = CASE
              WHEN ? IN ('completed', 'failed', 'cancelled', 'denied')
                THEN ?
              ELSE completed_at
            END,
            last_error = COALESCE(?, last_error)
          WHERE request_id = ?
        `
      )
      .run(options.profileId ?? null, options.preview ?? null, status, timestamp, status, timestamp, options.lastError ?? null, requestId);

    const fallbackState = fallbackActivityStateForRequestStatus(status);
    this.database
      .prepare(
        `
          UPDATE runtime_activities
          SET
            state = ?,
            updated_at = ?,
            completed_at = COALESCE(completed_at, ?)
          WHERE request_id = ?
            AND state IN ('started', 'updated')
        `
      )
      .run(fallbackState, timestamp, timestamp, requestId);

    return this.getRuntimeRequest(requestId);
  }

  appendRuntimeActivity(
    requestId: string,
    sessionId: string,
    profileId: string | null,
    activity: ChatActivity,
    options: {
      preview?: string;
    } = {}
  ) {
    const parsedActivity = ChatActivitySchema.parse({
      ...activity,
      requestId
    });
    const currentRequestRow = this.database.prepare('SELECT status FROM runtime_requests WHERE request_id = ?').get(requestId) as
      | { status?: unknown }
      | undefined;
    const currentStatus = typeof currentRequestRow?.status === 'string' ? (currentRequestRow.status as RuntimeRequest['status']) : undefined;
    const preserveFinalStatus = isFinalRuntimeRequestStatus(currentStatus);
    this.ensureRuntimeRequest({
      requestId,
      sessionId,
      profileId,
      preview: options.preview ?? 'Hermes request',
      startedAt: parsedActivity.timestamp,
      status:
        parsedActivity.state === 'failed'
          ? 'failed'
          : parsedActivity.state === 'denied'
            ? 'denied'
            : parsedActivity.state === 'cancelled'
              ? 'cancelled'
              : 'running'
    });

    const key = activityGroupKey(parsedActivity);
    const unresolvedRow = this.database
      .prepare(
        `
          SELECT *
          FROM runtime_activities
          WHERE request_id = ?
            AND activity_key = ?
            AND state IN ('started', 'updated')
          ORDER BY started_at ASC, updated_at ASC
          LIMIT 1
        `
      )
      .get(requestId, key) as Record<string, unknown> | undefined;

    if (unresolvedRow) {
      this.database
        .prepare(
          `
            UPDATE runtime_activities
            SET
              state = ?,
              detail = ?,
              command = ?,
              updated_at = ?,
              completed_at = CASE
                WHEN ? IN ('completed', 'failed', 'cancelled', 'denied')
                  THEN ?
                ELSE completed_at
              END
            WHERE id = ?
          `
        )
        .run(
          parsedActivity.state,
          parsedActivity.detail ?? null,
          parsedActivity.command ?? null,
          parsedActivity.timestamp,
          parsedActivity.state,
          parsedActivity.timestamp,
          String(unresolvedRow.id)
        );
    } else {
      this.database
        .prepare(
          `
            INSERT INTO runtime_activities (
              id,
              request_id,
              session_id,
              profile_id,
              activity_key,
              kind,
              state,
              label,
              detail,
              command,
              started_at,
              updated_at,
              completed_at,
              metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}')
          `
        )
        .run(
          `activity-${randomUUID()}`,
          requestId,
          sessionId,
          profileId,
          key,
          parsedActivity.kind,
          parsedActivity.state,
          parsedActivity.label,
          parsedActivity.detail ?? null,
          parsedActivity.command ?? null,
          parsedActivity.timestamp,
          parsedActivity.timestamp,
          isFinalActivityState(parsedActivity.state) ? parsedActivity.timestamp : null
        );
    }

    if (!preserveFinalStatus) {
      if (parsedActivity.state === 'failed' || parsedActivity.state === 'denied' || parsedActivity.state === 'cancelled') {
        this.upsertRuntimeRequestStatus(
          requestId,
          parsedActivity.state === 'failed' ? 'failed' : parsedActivity.state === 'denied' ? 'denied' : 'cancelled',
          parsedActivity.timestamp,
          {
            profileId,
            sessionId,
            preview: options.preview,
            lastError: parsedActivity.detail ?? parsedActivity.label
          }
        );
      } else {
        this.upsertRuntimeRequestStatus(requestId, 'running', parsedActivity.timestamp, {
          profileId,
          sessionId,
          preview: options.preview
        });
      }
    }

    return parsedActivity;
  }

  getRuntimeRequest(requestId: string) {
    const row = this.database.prepare('SELECT * FROM runtime_requests WHERE request_id = ?').get(requestId) as Record<string, unknown> | undefined;
    if (!row) {
      return null;
    }

    const activities = (this.database
      .prepare(
        `
          SELECT *
          FROM runtime_activities
          WHERE request_id = ?
          ORDER BY started_at ASC, updated_at ASC, id ASC
        `
      )
      .all(requestId) as Record<string, unknown>[]).map((activityRow) => this.rowToRuntimeActivity(activityRow));
    const messageIds = (this.database
      .prepare(
        `
          SELECT id
          FROM messages
          WHERE session_id = ?
            AND json_extract(metadata_json, '$.requestId') = ?
          ORDER BY created_at ASC, rowid ASC
        `
      )
      .all(String(row.session_id), requestId) as Array<{ id: string }>).map((messageRow) => messageRow.id);
    const telemetryCountRow = this.database
      .prepare('SELECT COUNT(*) as count FROM telemetry_events WHERE request_id = ?')
      .get(requestId) as { count: number };

    return this.rowToRuntimeRequest(row, activities, telemetryCountRow.count, messageIds);
  }

  mergeRuntimeRequests(sourceRequestId: string, targetRequestId: string) {
    if (sourceRequestId === targetRequestId) {
      return this.getRuntimeRequest(targetRequestId);
    }

    const source = this.getRuntimeRequest(sourceRequestId);
    const target = this.getRuntimeRequest(targetRequestId);
    if (!source || !target) {
      return target ?? source ?? null;
    }

    this.database.prepare('UPDATE runtime_activities SET request_id = ? WHERE request_id = ?').run(targetRequestId, sourceRequestId);
    this.database.prepare('UPDATE telemetry_events SET request_id = ? WHERE request_id = ?').run(targetRequestId, sourceRequestId);
    this.database.prepare('DELETE FROM runtime_requests WHERE request_id = ?').run(sourceRequestId);

    const mergedStatus = mergeRuntimeRequestStatus(target.status, source.status);
    const mergedUpdatedAt = target.updatedAt > source.updatedAt ? target.updatedAt : source.updatedAt;
    const mergedCompletedAt =
      target.completedAt && source.completedAt
        ? (target.completedAt > source.completedAt ? target.completedAt : source.completedAt)
        : target.completedAt ?? source.completedAt ?? null;
    const mergedPreview = target.preview !== 'Hermes request' ? target.preview : source.preview;
    const mergedLastError = target.lastError ?? source.lastError ?? null;

    this.database
      .prepare(
        `
          UPDATE runtime_requests
          SET
            profile_id = COALESCE(profile_id, ?),
            preview = CASE
              WHEN preview = 'Hermes request' AND ? <> 'Hermes request'
                THEN ?
              ELSE preview
            END,
            status = ?,
            updated_at = ?,
            completed_at = ?,
            last_error = COALESCE(last_error, ?)
          WHERE request_id = ?
        `
      )
      .run(source.profileId ?? null, mergedPreview, mergedPreview, mergedStatus, mergedUpdatedAt, mergedCompletedAt, mergedLastError, targetRequestId);

    if (mergedStatus !== 'running' && mergedStatus !== 'idle') {
      this.database
        .prepare(
          `
            UPDATE runtime_activities
            SET
              state = ?,
              updated_at = CASE
                WHEN updated_at < ?
                  THEN ?
                ELSE updated_at
              END,
              completed_at = COALESCE(completed_at, ?)
            WHERE request_id = ?
              AND state IN ('started', 'updated')
          `
        )
        .run(fallbackActivityStateForRequestStatus(mergedStatus), mergedUpdatedAt, mergedUpdatedAt, mergedCompletedAt ?? mergedUpdatedAt, targetRequestId);
    }

    return this.getRuntimeRequest(targetRequestId);
  }

  listRuntimeRequests(sessionId: string) {
    const rows = this.database
      .prepare(
        `
          SELECT *
          FROM runtime_requests
          WHERE session_id = ?
          ORDER BY started_at ASC, updated_at ASC
        `
      )
      .all(sessionId) as Record<string, unknown>[];

    return rows
      .map((row) => this.getRuntimeRequest(String(row.request_id)))
      .filter((request): request is RuntimeRequest => Boolean(request));
  }

  appendTelemetryEvent(event: TelemetryEvent) {
    const parsedEvent = TelemetryEventSchema.parse(event);
    this.database
      .prepare(
        `
          INSERT INTO telemetry_events (
            id,
            profile_id,
            session_id,
            request_id,
            severity,
            category,
            code,
            message,
            detail,
            payload_json,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        parsedEvent.id,
        parsedEvent.profileId ?? null,
        parsedEvent.sessionId ?? null,
        parsedEvent.requestId ?? null,
        parsedEvent.severity,
        parsedEvent.category,
        parsedEvent.code,
        parsedEvent.message,
        parsedEvent.detail ?? null,
        JSON.stringify(parsedEvent.payload),
        parsedEvent.createdAt
      );

    return parsedEvent;
  }

  batchAppendTelemetryEvents(events: TelemetryEvent[]) {
    if (events.length === 0) return;
    const parsed = events.map((e) => TelemetryEventSchema.parse(e));
    const insert = this.database.prepare(
      `INSERT OR IGNORE INTO telemetry_events (
        id, profile_id, session_id, request_id, severity, category, code,
        message, detail, payload_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    this.database.exec('BEGIN');
    try {
      for (const r of parsed) {
        insert.run(
          r.id, r.profileId ?? null, r.sessionId ?? null, r.requestId ?? null,
          r.severity, r.category, r.code, r.message, r.detail ?? null,
          JSON.stringify(r.payload), r.createdAt
        );
      }
      this.database.exec('COMMIT');
    } catch (err) {
      this.database.exec('ROLLBACK');
      throw err;
    }
  }

  listTelemetryEvents(options: {
    profileId?: string | null;
    sessionId?: string | null;
    requestId?: string | null;
    limit?: number;
  } = {}) {
    const limit = Math.max(1, Math.min(500, Math.trunc(options.limit ?? 100)));
    const clauses: string[] = [];
    const values: Array<string | number | null> = [];

    if (options.profileId !== undefined) {
      if (options.profileId === null) {
        clauses.push('profile_id IS NULL');
      } else {
        clauses.push('profile_id = ?');
        values.push(options.profileId);
      }
    }
    if (options.sessionId !== undefined) {
      if (options.sessionId === null) {
        clauses.push('session_id IS NULL');
      } else {
        clauses.push('session_id = ?');
        values.push(options.sessionId);
      }
    }
    if (options.requestId !== undefined) {
      if (options.requestId === null) {
        clauses.push('request_id IS NULL');
      } else {
        clauses.push('request_id = ?');
        values.push(options.requestId);
      }
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.database
      .prepare(`SELECT * FROM telemetry_events ${whereClause} ORDER BY created_at DESC LIMIT ${limit}`)
      .all(...values) as Record<string, unknown>[];

    return rows.map((row) => this.rowToTelemetryEvent(row));
  }

  listTelemetryEventsPage(options: {
    profileId?: string | null;
    sessionId?: string | null;
    requestId?: string | null;
    page?: number;
    pageSize?: number;
  } = {}) {
    const page = Math.max(1, Math.trunc(options.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Math.trunc(options.pageSize ?? 25)));
    const offset = (page - 1) * pageSize;
    const clauses: string[] = [];
    const values: Array<string | number | null> = [];

    if (options.profileId !== undefined) {
      if (options.profileId === null) {
        clauses.push('profile_id IS NULL');
      } else {
        clauses.push('profile_id = ?');
        values.push(options.profileId);
      }
    }
    if (options.sessionId !== undefined) {
      if (options.sessionId === null) {
        clauses.push('session_id IS NULL');
      } else {
        clauses.push('session_id = ?');
        values.push(options.sessionId);
      }
    }
    if (options.requestId !== undefined) {
      if (options.requestId === null) {
        clauses.push('request_id IS NULL');
      } else {
        clauses.push('request_id = ?');
        values.push(options.requestId);
      }
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.database
      .prepare(`SELECT * FROM telemetry_events ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...values, pageSize, offset) as Record<string, unknown>[];
    const countRow = this.database
      .prepare(`SELECT COUNT(*) as count FROM telemetry_events ${whereClause}`)
      .get(...values) as { count: number };

    return {
      items: rows.map((row) => this.rowToTelemetryEvent(row)),
      total: countRow.count
    };
  }

  upsertJobs(profileId: string, jobs: Job[], freshness: JobsFreshness) {
    this.database.prepare('DELETE FROM jobs WHERE profile_id = ?').run(profileId);
    const insertJob = this.database.prepare(
      `
        INSERT INTO jobs (profile_id, id, label, schedule, status, description, last_run, next_run, last_synced_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    );

    for (const job of jobs) {
      const parsedJob = JobSchema.parse(job);
      insertJob.run(
        parsedJob.profileId,
        parsedJob.id,
        parsedJob.label,
        parsedJob.schedule,
        parsedJob.status,
        parsedJob.description,
        parsedJob.lastRun,
        parsedJob.nextRun,
        parsedJob.lastSyncedAt
      );
    }

    const parsedFreshness = JobsFreshnessSchema.parse(freshness);
    this.database
      .prepare(
        `
          INSERT INTO job_freshness (profile_id, status, source, last_requested_at, last_successful_at, last_error)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT (profile_id) DO UPDATE SET
            status = excluded.status,
            source = excluded.source,
            last_requested_at = excluded.last_requested_at,
            last_successful_at = excluded.last_successful_at,
            last_error = excluded.last_error
        `
      )
      .run(
        parsedFreshness.profileId,
        parsedFreshness.status,
        parsedFreshness.source,
        parsedFreshness.lastRequestedAt ?? null,
        parsedFreshness.lastSuccessfulAt ?? null,
        parsedFreshness.lastError ?? null
      );
  }

  getJobs(profileId: string) {
    const hermesJobs = (this.database.prepare('SELECT * FROM jobs WHERE profile_id = ? ORDER BY label ASC').all(profileId) as Record<string, unknown>[]).map((row) =>
      this.rowToJob(row)
    );
    const freshnessRow = this.database.prepare('SELECT * FROM job_freshness WHERE profile_id = ?').get(profileId) as Record<string, unknown> | undefined;

    const freshness = JobsFreshnessSchema.parse(
      freshnessRow
        ? {
            profileId: freshnessRow.profile_id,
            status: freshnessRow.status,
            source: freshnessRow.source,
            lastRequestedAt: freshnessRow.last_requested_at ?? undefined,
            lastSuccessfulAt: freshnessRow.last_successful_at ?? undefined,
            lastError: freshnessRow.last_error ?? undefined
          }
        : {
            profileId,
            status: 'disconnected',
            source: 'local_cache'
        }
    );

    return {
      items: [...hermesJobs].sort((left, right) => {
        const nextRunComparison = left.nextRun.localeCompare(right.nextRun);
        return nextRunComparison !== 0 ? nextRunComparison : left.label.localeCompare(right.label);
      }),
      freshness
    };
  }

  replaceTools(profileId: string, tools: Tool[]) {
    this.database.prepare('DELETE FROM tools WHERE source = ? AND profile_id IS ?').run('hermes', profileId);
    const insertTool = this.database.prepare(
      `
        INSERT INTO tools (
          id,
          profile_id,
          source,
          scope,
          name,
          description,
          enabled,
          status,
          approval_model,
          capabilities_json,
          restrictions_json,
          last_synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          profile_id = excluded.profile_id,
          source = excluded.source,
          scope = excluded.scope,
          name = excluded.name,
          description = excluded.description,
          enabled = excluded.enabled,
          status = excluded.status,
          approval_model = excluded.approval_model,
          capabilities_json = excluded.capabilities_json,
          restrictions_json = excluded.restrictions_json,
          last_synced_at = excluded.last_synced_at
      `
    );

    for (const tool of tools) {
      const parsedTool = ToolSchema.parse(tool);
      insertTool.run(
        parsedTool.id,
        parsedTool.profileId ?? null,
        parsedTool.source,
        parsedTool.scope,
        parsedTool.name,
        parsedTool.description,
        parsedTool.enabled ? 1 : 0,
        parsedTool.status,
        parsedTool.approvalModel,
        JSON.stringify(parsedTool.capabilities),
        JSON.stringify(parsedTool.restrictions),
        parsedTool.lastSyncedAt
      );
    }

    this.ensureBridgeTool();
  }

  listTools(profileId: string | null) {
    const rows = this.database
      .prepare(
        `
          SELECT * FROM tools
          WHERE profile_id IS NULL OR profile_id = ?
          ORDER BY source ASC, name ASC
        `
      )
      .all(profileId) as Record<string, unknown>[];

    return rows.map((row) => this.rowToTool(row));
  }

  createToolExecution(input: {
    toolId: string;
    profileId: string | null;
    sessionId: string | null;
    summary: string;
    command: string;
    args: string[];
    cwd: string | null;
    status: ToolExecution['status'];
    requestedAt: string;
  }) {
    const execution: ToolExecution = {
      id: randomUUID(),
      toolId: input.toolId,
      profileId: input.profileId,
      sessionId: input.sessionId,
      summary: input.summary,
      command: input.command,
      args: input.args,
      cwd: input.cwd,
      status: input.status,
      requestedAt: input.requestedAt
    };

    this.database
      .prepare(
        `
          INSERT INTO tool_executions (id, tool_id, profile_id, session_id, summary, command, args_json, cwd, status, requested_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        execution.id,
        execution.toolId,
        execution.profileId,
        execution.sessionId,
        execution.summary,
        execution.command,
        JSON.stringify(execution.args),
        execution.cwd,
        execution.status,
        execution.requestedAt
      );

    return execution;
  }

  importToolExecution(execution: ToolExecution) {
    const parsedExecution = ToolExecutionSchema.parse(execution);
    this.database
      .prepare(
        `
          INSERT INTO tool_executions (
            id,
            tool_id,
            profile_id,
            session_id,
            summary,
            command,
            args_json,
            cwd,
            status,
            requested_at,
            resolved_at,
            stdout,
            stderr,
            exit_code
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            tool_id = excluded.tool_id,
            profile_id = excluded.profile_id,
            session_id = excluded.session_id,
            summary = excluded.summary,
            command = excluded.command,
            args_json = excluded.args_json,
            cwd = excluded.cwd,
            status = excluded.status,
            requested_at = excluded.requested_at,
            resolved_at = excluded.resolved_at,
            stdout = excluded.stdout,
            stderr = excluded.stderr,
            exit_code = excluded.exit_code
        `
      )
      .run(
        parsedExecution.id,
        parsedExecution.toolId,
        parsedExecution.profileId ?? null,
        parsedExecution.sessionId ?? null,
        parsedExecution.summary,
        parsedExecution.command,
        JSON.stringify(parsedExecution.args),
        parsedExecution.cwd ?? null,
        parsedExecution.status,
        parsedExecution.requestedAt,
        parsedExecution.resolvedAt ?? null,
        parsedExecution.stdout ?? null,
        parsedExecution.stderr ?? null,
        parsedExecution.exitCode ?? null
      );

    return this.getToolExecution(parsedExecution.id);
  }

  updateToolExecution(
    executionId: string,
    partial: Pick<ToolExecution, 'status'> & Partial<Pick<ToolExecution, 'resolvedAt' | 'stdout' | 'stderr' | 'exitCode'>>
  ) {
    this.database
      .prepare(
        `
          UPDATE tool_executions
          SET status = ?, resolved_at = ?, stdout = ?, stderr = ?, exit_code = ?
          WHERE id = ?
        `
      )
      .run(
        partial.status,
        partial.resolvedAt ?? null,
        partial.stdout ?? null,
        partial.stderr ?? null,
        partial.exitCode ?? null,
        executionId
      );

    return this.getToolExecution(executionId);
  }

  getToolExecution(executionId: string) {
    const row = this.database.prepare('SELECT * FROM tool_executions WHERE id = ?').get(executionId) as Record<string, unknown> | undefined;
    return row ? this.rowToToolExecution(row) : null;
  }

  listToolExecutions(page: number, pageSize: number, profileId?: string | null) {
    const offset = (page - 1) * pageSize;
    const whereClause = profileId ? 'WHERE profile_id = ?' : '';
    const rows = this.database
      .prepare(`SELECT * FROM tool_executions ${whereClause} ORDER BY requested_at DESC LIMIT ? OFFSET ?`)
      .all(...(profileId ? [profileId, pageSize, offset] : [pageSize, offset])) as Record<string, unknown>[];
    const countRow = this.database
      .prepare(`SELECT COUNT(*) as count FROM tool_executions ${whereClause}`)
      .get(...(profileId ? [profileId] : [])) as { count: number };

    return {
      items: rows.map((row) => this.rowToToolExecution(row)),
      total: countRow.count
    };
  }

  listRuntimeActivityHistory(page: number, pageSize: number, profileId?: string | null) {
    const offset = (page - 1) * pageSize;
    const whereClauses = ["runtime_activities.kind IN ('tool', 'skill', 'command', 'approval')"];
    const values: Array<string | number | null> = [];

    if (profileId === null) {
      whereClauses.push('runtime_activities.profile_id IS NULL');
    } else if (profileId) {
      whereClauses.push('runtime_activities.profile_id = ?');
      values.push(profileId);
    }

    const whereClause = `WHERE ${whereClauses.join(' AND ')}`;
    const rows = this.database
      .prepare(
        `
          SELECT
            runtime_activities.*,
            runtime_requests.preview AS request_preview,
            sessions.title AS session_title
          FROM runtime_activities
          LEFT JOIN runtime_requests ON runtime_requests.request_id = runtime_activities.request_id
          LEFT JOIN sessions ON sessions.id = runtime_activities.session_id
          ${whereClause}
          ORDER BY runtime_activities.updated_at DESC, runtime_activities.id DESC
          LIMIT ? OFFSET ?
        `
      )
      .all(...values, pageSize, offset) as Record<string, unknown>[];
    const countRow = this.database
      .prepare(`SELECT COUNT(*) as count FROM runtime_activities ${whereClause}`)
      .get(...values) as { count: number };

    return {
      items: rows.map((row) => this.rowToRuntimeActivityHistory(row)),
      total: countRow.count
    } satisfies {
      items: RuntimeActivityHistoryEntry[];
      total: number;
    };
  }

  replaceSkills(profileId: string, skills: Skill[]) {
    this.database.prepare('DELETE FROM skills WHERE profile_id = ?').run(profileId);
    const insertSkill = this.database.prepare(
      `
        INSERT INTO skills (id, profile_id, name, summary, category, source, trust, last_synced_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          profile_id = excluded.profile_id,
          name = excluded.name,
          summary = excluded.summary,
          category = excluded.category,
          source = excluded.source,
          trust = excluded.trust,
          last_synced_at = excluded.last_synced_at
      `
    );

    for (const skill of skills) {
      const parsedSkill = SkillSchema.parse(skill);
      insertSkill.run(
        parsedSkill.id,
        parsedSkill.profileId,
        parsedSkill.name,
        parsedSkill.summary,
        parsedSkill.category,
        parsedSkill.source,
        parsedSkill.trust,
        parsedSkill.lastSyncedAt
      );
    }
  }

  listSkills(profileId: string) {
    const rows = this.database
      .prepare('SELECT * FROM skills WHERE profile_id = ? ORDER BY category ASC, name ASC')
      .all(profileId) as Record<string, unknown>[];
    return rows.map((row) => this.rowToSkill(row));
  }

  deleteSkill(profileId: string, skillId: string) {
    this.database.prepare('DELETE FROM skills WHERE profile_id = ? AND id = ?').run(profileId, skillId);
  }

  deleteProviderConnection(profileId: string, providerId: string) {
    this.database.prepare('DELETE FROM provider_connections WHERE profile_id = ? AND id = ?').run(profileId, providerId);
    this.database.prepare('DELETE FROM provider_step_completions WHERE profile_id = ? AND step_id LIKE ?').run(profileId, `${providerId}:%`);
  }

  replaceProviderConnections(profileId: string, providers: ProviderConnection[]) {
    this.database.prepare('DELETE FROM provider_connections WHERE profile_id = ?').run(profileId);
    const insertProvider = this.database.prepare(
      `
        INSERT INTO provider_connections (
          profile_id,
          id,
          display_name,
          auth_kind,
          status,
          credential_label,
          masked_credential,
          source,
          supports_api_key,
          supports_oauth,
          notes,
          last_synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (profile_id, id) DO UPDATE SET
          display_name = excluded.display_name,
          auth_kind = excluded.auth_kind,
          status = excluded.status,
          credential_label = excluded.credential_label,
          masked_credential = excluded.masked_credential,
          source = excluded.source,
          supports_api_key = excluded.supports_api_key,
          supports_oauth = excluded.supports_oauth,
          notes = excluded.notes,
          last_synced_at = excluded.last_synced_at
      `
    );

    for (const provider of providers) {
      const parsedProvider = ProviderConnectionSchema.parse(provider);
      insertProvider.run(
        profileId,
        parsedProvider.id,
        parsedProvider.displayName,
        parsedProvider.authKind,
        parsedProvider.status,
        parsedProvider.credentialLabel ?? null,
        parsedProvider.maskedCredential ?? null,
        parsedProvider.source,
        parsedProvider.supportsApiKey ? 1 : 0,
        parsedProvider.supportsOAuth ? 1 : 0,
        parsedProvider.notes ?? null,
        parsedProvider.lastSyncedAt
      );
    }
  }

  listProviderConnections(profileId: string) {
    const rows = this.database
      .prepare('SELECT * FROM provider_connections WHERE profile_id = ? ORDER BY status DESC, display_name ASC')
      .all(profileId) as Record<string, unknown>[];
    return rows.map((row) => this.rowToProviderConnection(row));
  }

  replaceRuntimeProviderCatalog(profileId: string, providers: RuntimeProviderOption[]) {
    this.database.prepare('DELETE FROM runtime_provider_catalogs WHERE profile_id = ?').run(profileId);
    const insertProvider = this.database.prepare(
      `
        INSERT INTO runtime_provider_catalogs (profile_id, id, payload_json, last_synced_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (profile_id, id) DO UPDATE SET
          payload_json = excluded.payload_json,
          last_synced_at = excluded.last_synced_at
      `
    );

    for (const provider of providers) {
      const parsedProvider = RuntimeProviderOptionSchema.parse(provider);
      insertProvider.run(profileId, parsedProvider.id, JSON.stringify(parsedProvider), parsedProvider.lastSyncedAt);
    }
  }

  listRuntimeProviderCatalog(profileId: string) {
    const rows = this.database
      .prepare(
        `
          SELECT *
          FROM runtime_provider_catalogs
          WHERE profile_id = ?
          ORDER BY last_synced_at DESC, id ASC
        `
      )
      .all(profileId) as Record<string, unknown>[];
    return rows.map((row) => this.rowToRuntimeProviderOption(row));
  }

  upsertRuntimeModelConfig(config: RuntimeModelConfig) {
    const parsedConfig = RuntimeModelConfigSchema.parse(config);
    this.database
      .prepare(
        `
          INSERT INTO runtime_model_configs (
            profile_id,
            default_model,
            provider,
            base_url,
            api_mode,
            max_turns,
            reasoning_effort,
            tool_use_enforcement,
            last_synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (profile_id) DO UPDATE SET
            default_model = excluded.default_model,
            provider = excluded.provider,
            base_url = excluded.base_url,
            api_mode = excluded.api_mode,
            max_turns = excluded.max_turns,
            reasoning_effort = excluded.reasoning_effort,
            tool_use_enforcement = excluded.tool_use_enforcement,
            last_synced_at = excluded.last_synced_at
        `
      )
      .run(
        parsedConfig.profileId,
        parsedConfig.defaultModel,
        parsedConfig.provider,
        parsedConfig.baseUrl ?? null,
        parsedConfig.apiMode ?? null,
        parsedConfig.maxTurns,
        parsedConfig.reasoningEffort ?? null,
        parsedConfig.toolUseEnforcement ?? null,
        parsedConfig.lastSyncedAt
      );

    return this.getRuntimeModelConfig(parsedConfig.profileId);
  }

  getRuntimeModelConfig(profileId: string) {
    const row = this.database.prepare('SELECT * FROM runtime_model_configs WHERE profile_id = ?').get(profileId) as
      | Record<string, unknown>
      | undefined;
    return row ? this.rowToRuntimeModelConfig(row) : null;
  }

  appendAuditEvent(event: AuditEvent) {
    const parsedEvent = AuditEventSchema.parse(event);
    this.database
      .prepare(
        `
          INSERT INTO audit_events (id, type, profile_id, session_id, message, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        parsedEvent.id,
        parsedEvent.type,
        parsedEvent.profileId ?? null,
        parsedEvent.sessionId ?? null,
        parsedEvent.message,
        parsedEvent.createdAt
      );

    return parsedEvent;
  }

  listAuditEvents(limit: number, types?: AuditEvent['type'][], profileId?: string | null) {
    const clauses: string[] = [];
    const values: Array<string | number | null> = [];

    if (types && types.length > 0) {
      clauses.push(`type IN (${types.map(() => '?').join(', ')})`);
      values.push(...types);
    }
    if (profileId !== undefined) {
      if (profileId === null) {
        clauses.push('profile_id IS NULL');
      } else {
        clauses.push('profile_id = ?');
        values.push(profileId);
      }
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.database
      .prepare(`SELECT * FROM audit_events ${whereClause} ORDER BY created_at DESC LIMIT ?`)
      .all(...values, limit) as Record<string, unknown>[];
    return rows.map((row) => this.rowToAuditEvent(row));
  }

  listAuditEventsPage(options: {
    page?: number;
    pageSize?: number;
    types?: AuditEvent['type'][];
    profileId?: string | null;
  } = {}) {
    const page = Math.max(1, Math.trunc(options.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Math.trunc(options.pageSize ?? 25)));
    const offset = (page - 1) * pageSize;
    const clauses: string[] = [];
    const values: Array<string | number | null> = [];

    if (options.types && options.types.length > 0) {
      clauses.push(`type IN (${options.types.map(() => '?').join(', ')})`);
      values.push(...options.types);
    }
    if (options.profileId !== undefined) {
      if (options.profileId === null) {
        clauses.push('profile_id IS NULL');
      } else {
        clauses.push('profile_id = ?');
        values.push(options.profileId);
      }
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.database
      .prepare(`SELECT * FROM audit_events ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...values, pageSize, offset) as Record<string, unknown>[];
    const countRow = this.database
      .prepare(`SELECT COUNT(*) as count FROM audit_events ${whereClause}`)
      .get(...values) as { count: number };

    return {
      items: rows.map((row) => this.rowToAuditEvent(row)),
      total: countRow.count
    };
  }

  getAccessAuditSummary(profileId?: string | null) {
    const latestEvents = this.listAuditEvents(10, [
      'unrestricted_access_enabled',
      'unrestricted_access_disabled',
      'unrestricted_access_used'
    ], profileId);

    const latestEnabled = this.database
      .prepare(
        `
          SELECT created_at
          FROM audit_events
          WHERE type = 'unrestricted_access_enabled'
            ${profileId === undefined ? '' : profileId === null ? 'AND profile_id IS NULL' : 'AND profile_id = ?'}
          ORDER BY created_at DESC
          LIMIT 1
        `
      )
      .get(...(profileId === undefined ? [] : profileId === null ? [] : [profileId])) as { created_at?: string } | undefined;

    const latestUsed = this.database
      .prepare(
        `
          SELECT created_at
          FROM audit_events
          WHERE type = 'unrestricted_access_used'
            ${profileId === undefined ? '' : profileId === null ? 'AND profile_id IS NULL' : 'AND profile_id = ?'}
          ORDER BY created_at DESC
          LIMIT 1
        `
      )
      .get(...(profileId === undefined ? [] : profileId === null ? [] : [profileId])) as { created_at?: string } | undefined;

    return {
      latestEvents,
      unrestrictedAccessLastEnabledAt: latestEnabled?.created_at,
      unrestrictedAccessLastUsedAt: latestUsed?.created_at
    };
  }

  insertUploadedFile(file: {
    id: string;
    profileId: string;
    sessionId: string | null;
    filename: string;
    mimeType: string;
    fileKind: UploadedFileKind;
    fileSize: number;
    storagePath: string;
    createdAt: string;
  }): void {
    this.database
      .prepare(
        `INSERT INTO uploaded_files (id, profile_id, session_id, filename, mime_type, file_kind, file_size, storage_path, parse_status, transcription_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'none', ?)`
      )
      .run(file.id, file.profileId, file.sessionId, file.filename, file.mimeType, file.fileKind, file.fileSize, file.storagePath, file.createdAt);
  }

  getUploadedFile(id: string): UploadedFile | null {
    const row = this.database.prepare('SELECT * FROM uploaded_files WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? this.rowToUploadedFile(row) : null;
  }

  getUploadedFileStoragePath(id: string): string | null {
    const row = this.database.prepare('SELECT storage_path FROM uploaded_files WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? String(row.storage_path) : null;
  }

  listUploadedFilesBySession(sessionId: string): UploadedFile[] {
    const rows = this.database
      .prepare('SELECT * FROM uploaded_files WHERE session_id = ? ORDER BY created_at ASC')
      .all(sessionId) as Record<string, unknown>[];
    return rows.map((row) => this.rowToUploadedFile(row));
  }

  updateUploadedFileParse(id: string, update: { status: UploadedFile['parseStatus']; parsedText?: string | null; parseError?: string | null }): void {
    this.database
      .prepare('UPDATE uploaded_files SET parse_status = ?, parsed_text = ?, parse_error = ? WHERE id = ?')
      .run(update.status, update.parsedText ?? null, update.parseError ?? null, id);
  }

  updateUploadedFileTranscription(id: string, update: { status: UploadedFile['transcriptionStatus']; transcriptionText?: string | null }): void {
    this.database
      .prepare('UPDATE uploaded_files SET transcription_status = ?, transcription_text = ? WHERE id = ?')
      .run(update.status, update.transcriptionText ?? null, id);
  }

  private rowToUploadedFile(row: Record<string, unknown>): UploadedFile {
    return {
      id: String(row.id),
      profileId: String(row.profile_id),
      sessionId: row.session_id != null ? String(row.session_id) : null,
      filename: String(row.filename),
      mimeType: String(row.mime_type),
      size: Number(row.file_size),
      kind: String(row.file_kind) as UploadedFileKind,
      parseStatus: String(row.parse_status) as UploadedFile['parseStatus'],
      parsedText: row.parsed_text != null ? String(row.parsed_text) : null,
      transcriptionStatus: String(row.transcription_status) as UploadedFile['transcriptionStatus'],
      transcriptionText: row.transcription_text != null ? String(row.transcription_text) : null,
      createdAt: String(row.created_at)
    };
  }
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
