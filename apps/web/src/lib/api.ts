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
  FileRef,
  SkillSearchRequest,
  SkillInstallRequest,
  ExecuteRecipeActionRequest,
  OpenRecipeChatRequest,
  PollProviderAuthRequest,
  RenameSessionRequest,
  ResolveImagesResponse,
  TelemetryResponse,
  UpdateRecipeRequest,
  UploadedFile,
  ToolExecutionPrepareRequest,
  UiState,
  UpdateRuntimeModelConfigRequest
} from '@hermes-recipes/protocol';
export type { FileRef, UploadedFile };
import type { GetSoulMdResponse, UpdateSoulMdResponse } from '@hermes-recipes/protocol';
export type { GetSoulMdResponse, UpdateSoulMdResponse };
import {
  AuditEventsResponseSchema,
  RecipeEntryActionResponseSchema,
  BootstrapResponseSchema,
  ChatStreamEventSchema,
  OpenRecipeChatResponseSchema,
  ResolveImagesResponseSchema,
  SessionDeletionResponseSchema,
  JobsResponseSchema,
  DashboardResponseSchema,
  ModelProviderResponseSchema,
  ProfilesMetricsResponseSchema,
  ProfilesResponseSchema,
  TestModelConfigResponseSchema,
  RecipeDeletionResponseSchema,
  RecipeResponseSchema,
  RecipesResponseSchema,
  SkillDeletionResponseSchema,
  SkillSearchResponseSchema,
  SkillInstallResponseSchema,
  SessionMessagesResponseSchema,
  SessionsResponseSchema,
  SessionSchema,
  SettingsResponseSchema,
  SkillsResponseSchema,
  TelemetryResponseSchema,
  ToolExecutionSchema,
  ToolHistoryResponseSchema,
  ToolsResponseSchema,
  UiStateSchema,
  GetSoulMdResponseSchema,
  UpdateSoulMdResponseSchema
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

export async function getDashboard(profileId: string) {
  return parseJsonResponse(await apiFetch(`/api/dashboard?profileId=${encodeURIComponent(profileId)}`), DashboardResponseSchema);
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

export async function searchSkillsHub(input: SkillSearchRequest) {
  return parseJsonResponse(
    await apiFetch('/api/skills/search', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    SkillSearchResponseSchema
  );
}

export async function installSkillFromHub(input: SkillInstallRequest) {
  return parseJsonResponse(
    await apiFetch('/api/skills/install', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input)
    }),
    SkillInstallResponseSchema
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

export async function deleteProviderConnection(profileId: string, providerId: string) {
  const query = new URLSearchParams({ profileId });
  return parseJsonResponse(
    await apiFetch(`/api/provider-connections/${encodeURIComponent(providerId)}?${query}`, {
      method: 'DELETE'
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

export type ProviderModelsResponse = {
  models: Array<{ value: string; label: string }>;
  source: 'live' | 'cached' | 'unsupported' | 'error';
  error?: string;
  supportedProviders: string[];
};

export async function getProviderModels(profileId: string, provider: string): Promise<ProviderModelsResponse> {
  const query = new URLSearchParams({ profileId, provider });
  const res = await apiFetch(`/api/provider-models?${query.toString()}`);
  if (!res.ok) {
    return {
      models: [],
      source: 'error',
      error: `Bridge returned ${res.status} for /api/provider-models. The bridge may need a restart.`,
      supportedProviders: []
    };
  }
  try {
    return await res.json() as ProviderModelsResponse;
  } catch (err) {
    return {
      models: [],
      source: 'error',
      error: err instanceof Error ? err.message : 'Failed to parse model discovery response.',
      supportedProviders: []
    };
  }
}

export async function getProviderStepCompletions(profileId: string): Promise<string[]> {
  const query = new URLSearchParams({ profileId });
  const res = await apiFetch(`/api/provider-step-completions?${query.toString()}`);
  const data = await res.json() as { completedStepIds: string[] };
  return data.completedStepIds ?? [];
}

export async function setProviderStepCompletion(profileId: string, stepId: string, completed: boolean): Promise<string[]> {
  const res = await apiFetch('/api/provider-step-completions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ profileId, stepId, completed })
  });
  const data = await res.json() as { completedStepIds: string[] };
  return data.completedStepIds ?? [];
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

export interface RemoteAccessStatus {
  tailscale: { installed: boolean; running: boolean; dnsName: string | null; ipv4: string | null; error?: string };
  url: string | null;
  enabled: boolean;
}

export async function getRemoteAccessStatus(): Promise<RemoteAccessStatus> {
  const res = await apiFetch('/api/remote-access/status');
  return res.json() as Promise<RemoteAccessStatus>;
}

export async function refreshRemoteAccess(): Promise<RemoteAccessStatus> {
  const res = await apiFetch('/api/remote-access/refresh', {
    method: 'POST',
    headers: jsonHeaders()
  });
  return res.json() as Promise<RemoteAccessStatus>;
}

export async function setRemoteAccessEnabled(enabled: boolean): Promise<{ enabled: boolean }> {
  const res = await apiFetch(`/api/remote-access/${enabled ? 'enable' : 'disable'}`, {
    method: 'POST',
    headers: jsonHeaders()
  });
  return res.json() as Promise<{ enabled: boolean }>;
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

export interface UploadFileProgress {
  filename: string;
  loaded: number;
  total: number;
  percent: number;
}

export function uploadFiles(
  profileId: string,
  sessionId: string | null,
  files: File[],
  onProgress?: (progress: UploadFileProgress) => void
): Promise<UploadedFile[]> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('file', file, file.name);
    }

    const params = new URLSearchParams({ profileId });
    if (sessionId) params.set('sessionId', sessionId);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/uploads?${params.toString()}`);
    xhr.setRequestHeader('x-hermes-bridge', '1');

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && files.length > 0) {
          onProgress({
            filename: files[0]!.name,
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded / event.total) * 100)
          });
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as { files: UploadedFile[] };
          resolve(parsed.files ?? []);
        } catch {
          reject(new Error('Failed to parse upload response.'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}.`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
    xhr.addEventListener('abort', () => reject(new Error('Upload was aborted.')));

    xhr.send(formData);
  });
}

export function getUploadUrl(fileId: string): string {
  return `/api/uploads/${encodeURIComponent(fileId)}/content`;
}

export async function getSoulMd(profileId: string): Promise<GetSoulMdResponse> {
  return parseJsonResponse(
    await apiFetch(`/api/soul-md?profileId=${encodeURIComponent(profileId)}`),
    GetSoulMdResponseSchema
  );
}

export async function updateSoulMd(profileId: string, content: string): Promise<UpdateSoulMdResponse> {
  return parseJsonResponse(
    await apiFetch('/api/soul-md', {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify({ profileId, content })
    }),
    UpdateSoulMdResponseSchema
  );
}

export type HermesInstallEvent =
  | { type: 'output'; line: string }
  | { type: 'complete' }
  | { type: 'error'; detail: string };

export async function streamHermesInstall(onEvent: (event: HermesInstallEvent) => void): Promise<void> {
  const response = await apiFetch('/api/hermes/install', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({})
  });
  if (!response.ok) throw new Error(`Install request failed: ${response.status}`);
  if (!response.body) throw new Error('No response body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx = buffer.indexOf('\n\n');
    while (idx >= 0) {
      const chunk = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 2);
      if (chunk.startsWith('data:')) {
        try {
          onEvent(JSON.parse(chunk.slice(5).trim()) as HermesInstallEvent);
        } catch { /* ignore parse errors */ }
      }
      idx = buffer.indexOf('\n\n');
    }
  }
}

