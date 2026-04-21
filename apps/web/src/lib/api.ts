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

async function parseJsonResponse<T>(response: Response, schema: ParseableSchema<T>) {
  const raw = await response.text();
  const payload = raw.length > 0 ? (JSON.parse(raw) as T & ApiErrorShape) : ({} as T & ApiErrorShape);

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Request failed with status ${response.status}.`);
  }

  return schema.parse(payload);
}

async function streamSseResponse(path: string, input: unknown, onEvent: (event: ChatStreamEvent) => void) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
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
  return parseJsonResponse(await fetch('/api/bootstrap'), BootstrapResponseSchema);
}

export async function getSettings() {
  return parseJsonResponse(await fetch('/api/settings'), SettingsResponseSchema);
}

export async function selectProfile(profileId: string) {
  return parseJsonResponse(
    await fetch('/api/profiles/select', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId
      })
    }),
    BootstrapResponseSchema
  );
}

export async function createSession(input: CreateSessionRequest) {
  return parseJsonResponse(
    await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(input)
    }),
    SessionSchema
  );
}

export async function listRecipes(profileId: string) {
  return parseJsonResponse(await fetch(`/api/recipes?profileId=${encodeURIComponent(profileId)}`), RecipesResponseSchema);
}

export async function getRecipe(profileId: string, recipeId: string) {
  return parseJsonResponse(
    await fetch(`/api/recipes/${encodeURIComponent(recipeId)}?profileId=${encodeURIComponent(profileId)}`),
    RecipeResponseSchema
  );
}

export async function createRecipe(input: CreateRecipeRequest) {
  return parseJsonResponse(
    await fetch('/api/recipes', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(input)
    }),
    RecipeResponseSchema
  );
}

export async function updateRecipe(recipeId: string, input: UpdateRecipeRequest) {
  return parseJsonResponse(
    await fetch(`/api/recipes/${encodeURIComponent(recipeId)}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(input)
    }),
    RecipeResponseSchema
  );
}

export async function deleteRecipe(recipeId: string, input: DeleteRecipeRequest) {
  return parseJsonResponse(
    await fetch(`/api/recipes/${encodeURIComponent(recipeId)}/delete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(input)
    }),
    RecipeDeletionResponseSchema
  );
}

export async function applyRecipeEntryAction(recipeId: string, input: ApplyRecipeEntryActionRequest) {
  return parseJsonResponse(
    await fetch(`/api/recipes/${encodeURIComponent(recipeId)}/entries/actions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(input)
    }),
    RecipeEntryActionResponseSchema
  );
}

export async function openRecipeChat(recipeId: string, input: OpenRecipeChatRequest) {
  return parseJsonResponse(
    await fetch(`/api/recipes/${encodeURIComponent(recipeId)}/open-chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(input)
    }),
    OpenRecipeChatResponseSchema
  );
}

export async function selectSession(profileId: string, sessionId: string) {
  return parseJsonResponse(
    await fetch('/api/sessions/select', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
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
    await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/rename`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(input)
    }),
    SessionSchema
  );
}

export async function deleteSession(sessionId: string, input: DeleteSessionRequest) {
  return parseJsonResponse(
    await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/delete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
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

  return parseJsonResponse(await fetch(`/api/sessions?${query.toString()}`), SessionsResponseSchema);
}

export async function getSessionMessages(profileId: string, sessionId: string) {
  const query = new URLSearchParams({
    profileId
  });

  return parseJsonResponse(await fetch(`/api/sessions/${sessionId}/messages?${query.toString()}`), SessionMessagesResponseSchema);
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
  return parseJsonResponse(await fetch(`/api/telemetry${suffix ? `?${suffix}` : ''}`), TelemetryResponseSchema);
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
  return parseJsonResponse(await fetch(`/api/audit-events${suffix ? `?${suffix}` : ''}`), AuditEventsResponseSchema);
}

export async function getJobs(profileId: string) {
  return parseJsonResponse(await fetch(`/api/jobs?profileId=${encodeURIComponent(profileId)}`), JobsResponseSchema);
}

export async function getTools(profileId: string) {
  return parseJsonResponse(await fetch(`/api/tools?profileId=${encodeURIComponent(profileId)}`), ToolsResponseSchema);
}

export async function getToolHistory(profileId: string, page: number, pageSize: number) {
  const query = new URLSearchParams({
    profileId,
    page: String(page),
    pageSize: String(pageSize)
  });

  return parseJsonResponse(await fetch(`/api/tool-history?${query.toString()}`), ToolHistoryResponseSchema);
}

export async function getSkills(profileId: string) {
  return parseJsonResponse(await fetch(`/api/skills?profileId=${encodeURIComponent(profileId)}`), SkillsResponseSchema);
}

export async function deleteSkill(skillId: string, input: DeleteSkillRequest) {
  return parseJsonResponse(
    await fetch(`/api/skills/${encodeURIComponent(skillId)}/delete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
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

  return parseJsonResponse(await fetch(`/api/model-providers?${query.toString()}`), ModelProviderResponseSchema);
}

export async function updateRuntimeModelConfig(input: UpdateRuntimeModelConfigRequest) {
  return parseJsonResponse(
    await fetch('/api/model-providers', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(input)
    }),
    ModelProviderResponseSchema
  );
}

export async function connectProvider(input: ConnectProviderRequest) {
  return parseJsonResponse(
    await fetch('/api/provider-connections', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(input)
    }),
    ModelProviderResponseSchema
  );
}

export async function beginProviderAuth(input: BeginProviderAuthRequest) {
  return parseJsonResponse(
    await fetch('/api/provider-auth', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(input)
    }),
    ModelProviderResponseSchema
  );
}

export async function pollProviderAuth(input: PollProviderAuthRequest) {
  return parseJsonResponse(
    await fetch('/api/provider-auth/poll', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(input)
    }),
    ModelProviderResponseSchema
  );
}

export async function updateSettings(input: Partial<AppSettings>) {
  return parseJsonResponse(
    await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(input)
    }),
    SettingsResponseSchema
  );
}

export async function prepareToolExecution(input: ToolExecutionPrepareRequest) {
  return parseJsonResponse(
    await fetch('/api/tool-executions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(input)
    }),
    ToolExecutionSchema
  );
}

export async function resolveToolExecution(executionId: string, decision: 'approve' | 'reject') {
  return parseJsonResponse(
    await fetch(`/api/tool-executions/${executionId}/resolve`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        decision
      })
    }),
    ToolExecutionSchema
  );
}

export async function updateUiState(input: Partial<UiState>) {
  return parseJsonResponse(
    await fetch('/api/ui-state', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
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
    await fetch('/api/images/resolve', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ queries })
    }),
    ResolveImagesResponseSchema
  );
}

