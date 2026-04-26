import type {
  AuditEventsResponse,
  AppSettings,
  ApplyRecipeEntryActionRequest,
  BeginProviderAuthRequest,
  ChatStreamEvent,
  ChatStreamRequest,
  ConnectProviderRequest,
  CreateRecipeRequest,
  CreateSessionRequest,
  DeleteRecipeRequest,
  DeleteSessionRequest,
  DeleteSkillRequest,
  ExecuteRecipeActionRequest,
  OpenRecipeChatRequest,
  PollProviderAuthRequest,
  RenameSessionRequest,
  ResolveImagesResponse,
  TelemetryResponse,
  UpdateRecipeRequest,
  ToolExecutionPrepareRequest,
  UiState,
  UpdateRuntimeModelConfigRequest
} from '@hermes-recipes/protocol';
import {
  AuditEventsResponseSchema,
  RecipeEntryActionResponseSchema,
  BootstrapResponseSchema,
  ChatStreamEventSchema,
  OpenRecipeChatResponseSchema,
  ResolveImagesResponseSchema,
  SessionDeletionResponseSchema,
  JobsResponseSchema,
  ModelProviderResponseSchema,
  ProfilesMetricsResponseSchema,
  ProfilesResponseSchema,
  TestModelConfigResponseSchema,
  RecipeDeletionResponseSchema,
  RecipeResponseSchema,
  RecipesResponseSchema,
  SkillDeletionResponseSchema,
  SessionMessagesResponseSchema,
  SessionsResponseSchema,
  SessionSchema,
  SettingsResponseSchema,
  SkillsResponseSchema,
  TelemetryResponseSchema,
  ToolExecutionSchema,
  ToolHistoryResponseSchema,
  ToolsResponseSchema,
  UiStateSchema
} from '@hermes-recipes/protocol';

interface ApiErrorShape {
  error?: {
    code: string;
    message: string;
  };
}

interface ParseableSchema<T> {
  parse(input: unknown): T;
}

// The bridge enforces this header on every request as a CSRF/DNS-rebinding guard: a cross-site
// page cannot set custom headers without a CORS preflight, which the bridge's origin policy blocks.
const BRIDGE_HEADERS = { 'x-hermes-bridge': '1' } as const;

function jsonHeaders(): Record<string, string> {
  return { 'content-type': 'application/json', ...BRIDGE_HEADERS };
}

function apiFetch(input: string, init: Parameters<typeof fetch>[1] = {}): Promise<Response> {
  const mergedHeaders = { ...BRIDGE_HEADERS, ...(init?.headers ?? {}) };
  return fetch(input, { ...init, headers: mergedHeaders });
}

async function parseJsonResponse<T>(response: Response, schema: ParseableSchema<T>) {
  const raw = await response.text();
  const payload = raw.length > 0 ? (JSON.parse(raw) as T & ApiErrorShape) : ({} as T & ApiErrorShape);

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Request failed with status ${response.status}.`);
  }

  return schema.parse(payload);
}

async function streamSseResponse(path: string, input: unknown, onEvent: (event: ChatStreamEvent) => void) {
  const response = await apiFetch(path, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as ApiErrorShape | null;
    throw new Error(errorPayload?.error?.message ?? `Chat request failed with status ${response.status}.`);
  }

  if (!response.body) {
    throw new Error('The bridge did not return a streaming response body.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

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
        onEvent(ChatStreamEventSchema.parse(JSON.parse(chunk.slice(5).trim())) as ChatStreamEvent);
      }
      separatorIndex = buffer.indexOf('\n\n');
    }
  }
}

export async function getBootstrap() {
  return parseJsonResponse(await apiFetch('/api/bootstrap'), BootstrapResponseSchema);
}

export async function getSettings() {
  return parseJsonResponse(await apiFetch('/api/settings'), SettingsResponseSchema);
}

export async function selectProfile(profileId: string) {
  return parseJsonResponse(
    await apiFetch('/api/profiles/select', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        profileId
      })
    }),
    BootstrapResponseSchema
  );
}

export async function createProfile(name: string) {
  return parseJsonResponse(
    await apiFetch('/api/profiles', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ name })
    }),
    ProfilesResponseSchema
  );
}

export async function deleteProfile(profileId: string) {
  return parseJsonResponse(
    await apiFetch(`/api/profiles/${encodeURIComponent(profileId)}`, {
      method: 'DELETE',
      headers: jsonHeaders()
    }),
    ProfilesResponseSchema
  );
}

export async function testModelConfig(profileId: string, defaultModel: string, provider?: string) {
  return parseJsonResponse(
    await apiFetch('/api/model-providers/test', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ profileId, defaultModel, provider })
    }),
    TestModelConfigResponseSchema
  );
}

export async function getProfilesMetrics() {
  return parseJsonResponse(
    await apiFetch('/api/profiles/metrics'),
    ProfilesMetricsResponseSchema
  );
}

export async function createSession(input: CreateSessionRequest) {
  return parseJsonResponse(
    await apiFetch('/api/sessions', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    SessionSchema
  );
}

export async function listRecipes(profileId: string) {
  return parseJsonResponse(await apiFetch(`/api/recipes?profileId=${encodeURIComponent(profileId)}`), RecipesResponseSchema);
}

export async function getRecipe(profileId: string, recipeId: string) {
  return parseJsonResponse(
    await apiFetch(`/api/recipes/${encodeURIComponent(recipeId)}?profileId=${encodeURIComponent(profileId)}`),
    RecipeResponseSchema
  );
}

export async function createRecipe(input: CreateRecipeRequest) {
  return parseJsonResponse(
    await apiFetch('/api/recipes', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    RecipeResponseSchema
  );
}

export async function updateRecipe(recipeId: string, input: UpdateRecipeRequest) {
  return parseJsonResponse(
    await apiFetch(`/api/recipes/${encodeURIComponent(recipeId)}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    RecipeResponseSchema
  );
}

export async function deleteRecipe(recipeId: string, input: DeleteRecipeRequest) {
  return parseJsonResponse(
    await apiFetch(`/api/recipes/${encodeURIComponent(recipeId)}/delete`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    RecipeDeletionResponseSchema
  );
}

export async function applyRecipeEntryAction(recipeId: string, input: ApplyRecipeEntryActionRequest) {
  return parseJsonResponse(
    await apiFetch(`/api/recipes/${encodeURIComponent(recipeId)}/entries/actions`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    RecipeEntryActionResponseSchema
  );
}

export async function openRecipeChat(recipeId: string, input: OpenRecipeChatRequest) {
  return parseJsonResponse(
    await apiFetch(`/api/recipes/${encodeURIComponent(recipeId)}/open-chat`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    OpenRecipeChatResponseSchema
  );
}

export async function selectSession(profileId: string, sessionId: string) {
  return parseJsonResponse(
    await apiFetch('/api/sessions/select', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        profileId,
        sessionId
      })
    }),
    SessionSchema
  );
}

export async function renameSession(sessionId: string, input: RenameSessionRequest) {
  return parseJsonResponse(
    await apiFetch(`/api/sessions/${encodeURIComponent(sessionId)}/rename`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    SessionSchema
  );
}

export async function deleteSession(sessionId: string, input: DeleteSessionRequest) {
  return parseJsonResponse(
    await apiFetch(`/api/sessions/${encodeURIComponent(sessionId)}/delete`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    SessionDeletionResponseSchema
  );
}

export async function listSessions(profileId: string, page: number, pageSize: number, search: string) {
  const query = new URLSearchParams({
    profileId,
    page: String(page),
    pageSize: String(pageSize),
    search
  });

  return parseJsonResponse(await apiFetch(`/api/sessions?${query.toString()}`), SessionsResponseSchema);
}

export async function getSessionMessages(profileId: string, sessionId: string) {
  const query = new URLSearchParams({
    profileId
  });

  return parseJsonResponse(await apiFetch(`/api/sessions/${sessionId}/messages?${query.toString()}`), SessionMessagesResponseSchema);
}

export async function getTelemetry(options: {
  profileId?: string;
  sessionId?: string;
  requestId?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<TelemetryResponse> {
  const query = new URLSearchParams();
  if (options.profileId) {
    query.set('profileId', options.profileId);
  }
  if (options.sessionId) {
    query.set('sessionId', options.sessionId);
  }
  if (options.requestId) {
    query.set('requestId', options.requestId);
  }
  if (options.page) {
    query.set('page', String(options.page));
  }
  if (options.pageSize) {
    query.set('pageSize', String(options.pageSize));
  }

  const suffix = query.toString();
  return parseJsonResponse(await apiFetch(`/api/telemetry${suffix ? `?${suffix}` : ''}`), TelemetryResponseSchema);
}

export async function getAuditEvents(options: {
  profileId?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<AuditEventsResponse> {
  const query = new URLSearchParams();
  if (options.profileId) {
    query.set('profileId', options.profileId);
  }
  if (options.page) {
    query.set('page', String(options.page));
  }
  if (options.pageSize) {
    query.set('pageSize', String(options.pageSize));
  }

  const suffix = query.toString();
  return parseJsonResponse(await apiFetch(`/api/audit-events${suffix ? `?${suffix}` : ''}`), AuditEventsResponseSchema);
}

export async function getJobs(profileId: string) {
  return parseJsonResponse(await apiFetch(`/api/jobs?profileId=${encodeURIComponent(profileId)}`), JobsResponseSchema);
}

export async function getTools(profileId: string) {
  return parseJsonResponse(await apiFetch(`/api/tools?profileId=${encodeURIComponent(profileId)}`), ToolsResponseSchema);
}

export async function getToolHistory(profileId: string, page: number, pageSize: number) {
  const query = new URLSearchParams({
    profileId,
    page: String(page),
    pageSize: String(pageSize)
  });

  return parseJsonResponse(await apiFetch(`/api/tool-history?${query.toString()}`), ToolHistoryResponseSchema);
}

export async function getSkills(profileId: string) {
  return parseJsonResponse(await apiFetch(`/api/skills?profileId=${encodeURIComponent(profileId)}`), SkillsResponseSchema);
}

export async function deleteSkill(skillId: string, input: DeleteSkillRequest) {
  return parseJsonResponse(
    await apiFetch(`/api/skills/${encodeURIComponent(skillId)}/delete`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    SkillDeletionResponseSchema
  );
}

export async function getModelProviders(profileId: string, inspectedProviderId?: string) {
  const query = new URLSearchParams({
    profileId
  });

  if (inspectedProviderId) {
    query.set('inspectedProviderId', inspectedProviderId);
  }

  return parseJsonResponse(await apiFetch(`/api/model-providers?${query.toString()}`), ModelProviderResponseSchema);
}

export async function updateRuntimeModelConfig(input: UpdateRuntimeModelConfigRequest) {
  return parseJsonResponse(
    await apiFetch('/api/model-providers', {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    ModelProviderResponseSchema
  );
}

export async function connectProvider(input: ConnectProviderRequest) {
  return parseJsonResponse(
    await apiFetch('/api/provider-connections', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    ModelProviderResponseSchema
  );
}

export async function beginProviderAuth(input: BeginProviderAuthRequest) {
  return parseJsonResponse(
    await apiFetch('/api/provider-auth', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    ModelProviderResponseSchema
  );
}

export async function pollProviderAuth(input: PollProviderAuthRequest) {
  return parseJsonResponse(
    await apiFetch('/api/provider-auth/poll', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    ModelProviderResponseSchema
  );
}

export async function updateSettings(input: Partial<AppSettings>) {
  return parseJsonResponse(
    await apiFetch('/api/settings', {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    SettingsResponseSchema
  );
}

export async function prepareToolExecution(input: ToolExecutionPrepareRequest) {
  return parseJsonResponse(
    await apiFetch('/api/tool-executions', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    ToolExecutionSchema
  );
}

export async function resolveToolExecution(executionId: string, decision: 'approve' | 'reject') {
  return parseJsonResponse(
    await apiFetch(`/api/tool-executions/${executionId}/resolve`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        decision
      })
    }),
    ToolExecutionSchema
  );
}

export async function updateUiState(input: Partial<UiState>) {
  return parseJsonResponse(
    await apiFetch('/api/ui-state', {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    UiStateSchema
  );
}

export async function streamChat(input: ChatStreamRequest, onEvent: (event: ChatStreamEvent) => void) {
  await streamSseResponse('/api/chat/stream', input, onEvent);
}

export async function streamRecipeAction(recipeId: string, input: ExecuteRecipeActionRequest, onEvent: (event: ChatStreamEvent) => void) {
  await streamSseResponse(`/api/recipes/${encodeURIComponent(recipeId)}/actions/stream`, input, onEvent);
}

export async function resolveImages(queries: string[]): Promise<ResolveImagesResponse> {
  return parseJsonResponse(
    await apiFetch('/api/images/resolve', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ queries })
    }),
    ResolveImagesResponseSchema
  );
}

