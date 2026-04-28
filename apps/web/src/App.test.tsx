import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  BootstrapResponse,
  ChatMessage,
  ModelProviderResponse,
  RuntimeRequest,
  Session,
  SessionMessagesResponse,
  SessionsResponse,
  SettingsResponse,
  Recipe,
  RecipeContentFormat,
  RecipeTab,
  Skill,
  SkillsResponse,
  ToolHistoryResponse,
  ToolsResponse,
  UiState
} from '@hermes-recipes/protocol';
import { normalizeRecipeTabs } from '@hermes-recipes/protocol';
import type { PropsWithChildren } from 'react';
import { HermesUiProvider } from '@hermes-recipes/ui';
import { App } from './App';
import { toaster } from './ui/toaster-store';

const setThemeModeMock = vi.fn();

vi.mock('@hermes-recipes/ui', async () => {
  const { ChakraProvider, defaultSystem } = await import('@chakra-ui/react');
  const { MemoryRouter } = await import('react-router-dom');

  return {
    HermesUiProvider({ children }: PropsWithChildren) {
      return (
        <MemoryRouter>
          <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
        </MemoryRouter>
      );
    },
    useHermesTheme() {
      return {
        themeMode: 'dark' as const,
        setThemeMode: setThemeModeMock
      };
    }
  };
});

const originalStubGlobal = vi.stubGlobal.bind(vi);

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json'
    }
  });
}

function delayedSseResponse(events: unknown[], delayMs = 16) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        await new Promise((resolve) => {
          globalThis.setTimeout(resolve, delayMs);
        });
      }
      controller.close();
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream'
    }
  });
}

function _createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise,
    resolve,
    reject
  };
}

function createSession(
  sessionId: string,
  title = 'Inbox follow-up',
  profileId = 'jbarton',
  overrides: Partial<Session> & {
    linkedRecipeId?: string | null;
  } = {}
): Session {
  const attachedRecipeId = overrides.attachedRecipeId ?? overrides.linkedRecipeId ?? null;
  return {
    id: sessionId,
    runtimeSessionId: sessionId,
    title,
    summary: `${title} summary`,
    source: 'hermes_cli',
    lastUpdatedAt: '2026-04-08T20:00:00.000Z',
    lastUsedProfileId: profileId,
    associatedProfileIds: [profileId],
    messageCount: 2,
    attachedRecipeId,
    recipeType: attachedRecipeId ? 'home' : 'tui',
    ...overrides
  };
}

function createMessage(overrides: Partial<ChatMessage> & Pick<ChatMessage, 'id' | 'sessionId' | 'role' | 'content' | 'createdAt'>): ChatMessage {
  return {
    status: 'completed',
    requestId: null,
    visibility: 'transcript',
    kind: 'conversation',
    ...overrides
  };
}

function createSessionPayload(
  session: Session,
  messages: ChatMessage[],
  profileId = 'jbarton',
  runtimeRequests: RuntimeRequest[] = [],
  overrides: Partial<SessionMessagesResponse> = {}
): SessionMessagesResponse {
  return {
    profileId,
    session,
    messages,
    runtimeRequests,
    attachedRecipe: null,
    recipeEvents: [],
    ...overrides
  };
}

function createRuntimeRequest(
  requestId: string,
  sessionId: string,
  preview: string,
  overrides: Partial<RuntimeRequest> = {}
): RuntimeRequest {
  return {
    requestId,
    profileId: 'jbarton',
    sessionId,
    preview,
    messageIds: [],
    activities: [],
    status: 'completed',
    startedAt: '2026-04-08T20:00:00.000Z',
    updatedAt: '2026-04-08T20:00:01.000Z',
    completedAt: '2026-04-08T20:00:01.000Z',
    telemetryCount: 0,
    ...overrides
  };
}

function createUiState(
  overrides: Partial<UiState> & {
    currentPage?: UiState['currentPage'];
    activeRecipeIdByProfile?: Record<string, string | null>;
    spacesTab?: string;
  } = {}
): UiState {
  const baseUiState: UiState = {
    activeProfileId: 'jbarton',
    currentPage: 'chat',
    activeSessionIdByProfile: {},
    recentSessionIdsByProfile: {},
    toolsTab: 'all',
    sidebarCollapsed: false
  };

  return {
    ...baseUiState,
    ...overrides,
    currentPage: overrides.currentPage ?? baseUiState.currentPage,
    activeSessionIdByProfile: {
      ...baseUiState.activeSessionIdByProfile,
      ...(overrides.activeSessionIdByProfile ?? {})
    },
    recentSessionIdsByProfile: {
      ...baseUiState.recentSessionIdsByProfile,
      ...(overrides.recentSessionIdsByProfile ?? {})
    }
  };
}

function createBootstrapResponse(
  overrides: Omit<Partial<BootstrapResponse>, 'uiState'> & {
    uiState?: Partial<UiState> & {
      currentPage?: UiState['currentPage'];
      activeRecipeIdByProfile?: Record<string, string | null>;
      spacesTab?: string;
    };
  } = {}
): BootstrapResponse {
  const { uiState: uiStateOverrides, ...restOverrides } = overrides;
  const uiState = createUiState(uiStateOverrides);

  return {
    connection: {
      status: 'connected',
      checkedAt: '2026-04-08T20:00:00.000Z',
      usingCachedData: false
    },
    profiles: [
      {
        id: 'jbarton',
        name: 'jbarton',
        description: 'openai/gpt-5.4 · gateway stopped',
        isActive: true
      }
    ],
    activeProfileId: 'jbarton',
    activeSessionId: null,
    recentSessions: [],
    sessionSummary: null,
    settings: {
      themeMode: 'dark',
      sessionsPageSize: 50,
      chatTimeoutMs: 180_000,
      discoveryTimeoutMs: 240_000,
      nearbySearchTimeoutMs: 300_000,
      recipeOperationTimeoutMs: 180_000,
      unrestrictedTimeoutMs: 1_800_000,
      restrictedChatMaxTurns: 8,
      unrestrictedAccessEnabled: false
    },
    hermesVersion: '0.11.0',
    expectedHermesVersion: null,
    uiState,
    ...restOverrides
  };
}

function createSettingsResponse(overrides: Partial<SettingsResponse> = {}): SettingsResponse {
  return {
    settings: {
      themeMode: 'dark',
      sessionsPageSize: 50,
      chatTimeoutMs: 180_000,
      discoveryTimeoutMs: 240_000,
      nearbySearchTimeoutMs: 300_000,
      recipeOperationTimeoutMs: 180_000,
      unrestrictedTimeoutMs: 1_800_000,
      restrictedChatMaxTurns: 8,
      unrestrictedAccessEnabled: false
    },
    accessAudit: {
      latestEvents: [],
      unrestrictedAccessLastEnabledAt: undefined,
      unrestrictedAccessLastUsedAt: undefined
    },
    ...overrides
  };
}

function createModelProviderResponseForProfile(
  profileId: string,
  overrides: Partial<ModelProviderResponse> = {}
): ModelProviderResponse {
  const base = createModelProviderResponse();
  const providers = (overrides.providers ?? base.providers).map((provider) => ({
    ...provider,
    profileId
  }));

  return {
    ...base,
    ...overrides,
    config: {
      ...base.config,
      profileId,
      ...(overrides.config ?? {})
    },
    providers
  };
}

function createModelProviderResponse(overrides: Partial<ModelProviderResponse> = {}): ModelProviderResponse {
  return {
    connection: {
      status: 'connected',
      checkedAt: '2026-04-08T20:00:00.000Z',
      usingCachedData: false
    },
    config: {
      profileId: 'jbarton',
      defaultModel: 'openai/gpt-5.4',
      provider: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiMode: 'chat_completions',
      maxTurns: 150,
      reasoningEffort: 'medium',
      toolUseEnforcement: 'auto',
      lastSyncedAt: '2026-04-08T20:00:00.000Z'
    },
    providers: [
      {
        id: 'openrouter',
        profileId: 'jbarton',
        displayName: 'OpenRouter',
        authKind: 'api_key',
        status: 'connected',
        state: 'connected',
        stateMessage: 'OpenRouter is ready for Hermes chat requests.',
        ready: true,
        modelSelectionMode: 'select_only',
        supportsDisconnect: false,
        credentialLabel: 'OPENROUTER_API_KEY',
        maskedCredential: 'sk-o...1234',
        source: 'config',
        supportsApiKey: true,
        supportsOAuth: false,
        description: 'OpenRouter pay-per-use routing.',
        disabled: false,
        supportsModelDiscovery: true,
        models: [
          {
            id: 'openai/gpt-5.4',
            label: 'GPT-5.4',
            providerId: 'openrouter',
            disabled: false,
            supportsReasoningEffort: true,
            reasoningEffortOptions: ['low', 'medium', 'high'],
            metadata: {}
          },
          {
            id: 'openai/gpt-5.4-mini',
            label: 'GPT-5.4 mini',
            providerId: 'openrouter',
            disabled: false,
            supportsReasoningEffort: false,
            reasoningEffortOptions: [],
            metadata: {}
          }
        ],
        configurationFields: [
          {
            key: 'defaultModel',
            label: 'Default model',
            input: 'select',
            description: 'Selectable models discovered from the active Hermes runtime.',
            required: true,
            secret: false,
            value: 'openai/gpt-5.4',
            options: [
              {
                value: 'openai/gpt-5.4',
                label: 'GPT-5.4',
                disabled: false
              },
              {
                value: 'openai/gpt-5.4-mini',
                label: 'GPT-5.4 mini',
                disabled: false
              }
            ],
            disabled: false
          },
          {
            key: 'baseUrl',
            label: 'Base URL',
            input: 'url',
            description: 'Optional bridge override for the provider endpoint.',
            required: false,
            secret: false,
            value: 'https://openrouter.ai/api/v1',
            options: [],
            disabled: false
          },
          {
            key: 'apiMode',
            label: 'API mode',
            input: 'select',
            required: false,
            secret: false,
            value: 'chat_completions',
            options: [
              {
                value: 'chat_completions',
                label: 'chat_completions',
                disabled: false
              }
            ],
            disabled: false
          },
          {
            key: 'label',
            label: 'Credential label',
            input: 'text',
            description: 'Optional env-style label for the stored credential.',
            required: false,
            secret: false,
            placeholder: 'OPENROUTER_API_KEY',
            options: [],
            disabled: false
          }
        ],
        setupSteps: [
          {
            id: 'openrouter:inspect',
            kind: 'inspect',
            title: 'Inspect Hermes runtime metadata',
            description: 'The Hermes backend loaded current provider status, persisted config, and the latest discovered model options.',
            status: 'completed',
            metadata: {}
          },
          {
            id: 'openrouter:api-key',
            kind: 'api_key',
            title: 'API key connected',
            description: 'OpenRouter already has a usable credential for this profile.',
            status: 'completed',
            actionLabel: 'Open provider settings',
            actionUrl: 'https://openrouter.ai/settings/keys',
            metadata: {}
          },
          {
            id: 'openrouter:model',
            kind: 'model',
            title: 'Choose a default model',
            description: 'Select one of the models discovered from the active Hermes runtime.',
            status: 'completed',
            metadata: {}
          },
          {
            id: 'openrouter:verify',
            kind: 'verify',
            title: 'Provider ready for chat',
            description: 'OpenRouter has a usable credential and model selection for this profile.',
            status: 'completed',
            metadata: {}
          }
        ],
        lastSyncedAt: '2026-04-08T20:00:00.000Z'
      },
      {
        id: 'anthropic',
        profileId: 'jbarton',
        displayName: 'Anthropic',
        authKind: 'api_key',
        status: 'missing',
        state: 'needs_api_key',
        stateMessage: 'Add an API key for Anthropic before Hermes can use this provider.',
        ready: false,
        modelSelectionMode: 'select_only',
        supportsDisconnect: false,
        source: 'catalog',
        supportsApiKey: true,
        supportsOAuth: false,
        description: 'Direct Anthropic provider.',
        notes: 'Connect with an API key through the bridge.',
        disabled: true,
        disabledReason: 'Connect Anthropic before selecting it for this profile.',
        supportsModelDiscovery: true,
        models: [
          {
            id: 'anthropic/claude-sonnet-4.5',
            label: 'Claude Sonnet 4.5',
            providerId: 'anthropic',
            disabled: true,
            disabledReason: 'Connect Anthropic before selecting this model.',
            supportsReasoningEffort: true,
            reasoningEffortOptions: ['low', 'medium', 'high'],
            metadata: {}
          }
        ],
        configurationFields: [
          {
            key: 'defaultModel',
            label: 'Default model',
            input: 'select',
            description: 'Selectable models discovered from the active Hermes runtime.',
            required: true,
            secret: false,
            value: 'anthropic/claude-sonnet-4.5',
            options: [
              {
                value: 'anthropic/claude-sonnet-4.5',
                label: 'Claude Sonnet 4.5',
                disabled: true
              }
            ],
            disabled: true,
            disabledReason: 'Connect Anthropic before changing its runtime configuration.'
          },
          {
            key: 'label',
            label: 'Credential label',
            input: 'text',
            required: false,
            secret: false,
            placeholder: 'ANTHROPIC_API_KEY',
            options: [],
            disabled: false
          },
          {
            key: 'apiKey',
            label: 'API key',
            input: 'secret',
            required: true,
            secret: true,
            placeholder: 'Paste an Anthropic API key',
            options: [],
            disabled: false
          }
        ],
        setupSteps: [
          {
            id: 'anthropic:inspect',
            kind: 'inspect',
            title: 'Inspect Hermes runtime metadata',
            description: 'The Hermes backend loaded current provider status, persisted config, and the latest discovered model options.',
            status: 'completed',
            metadata: {}
          },
          {
            id: 'anthropic:api-key',
            kind: 'api_key',
            title: 'Add API key',
            description: 'Paste the Anthropic API key below. Hermes stores the secret locally and only non-secret connection metadata is persisted to clients.',
            status: 'action_required',
            metadata: {}
          },
          {
            id: 'anthropic:model',
            kind: 'model',
            title: 'Choose a default model',
            description: 'Select one of the models discovered from the active Hermes runtime.',
            status: 'disabled',
            metadata: {}
          },
          {
            id: 'anthropic:verify',
            kind: 'verify',
            title: 'Monitor provider readiness',
            description: 'Keep this drawer open after setup. The bridge refreshes provider status automatically, and Refresh rechecks Hermes immediately.',
            status: 'pending',
            metadata: {}
          }
        ],
        lastSyncedAt: '2026-04-08T20:00:00.000Z'
      }
    ],
    runtimeReadiness: {
      ready: true,
      code: 'ready',
      message: 'OpenRouter is ready for Hermes chat requests.',
      providerId: 'openrouter',
      modelId: 'openai/gpt-5.4'
    },
    inspectedProviderId: 'openrouter',
    discoveredAt: '2026-04-08T20:00:00.000Z',
    ...overrides
  };
}

function createRecipe(
  recipeId: string,
  viewType: RecipeContentFormat | 'blank',
  overrides: Partial<Recipe> & {
    linkedSessionId?: string | null;
    linkedRuntimeSessionId?: string | null;
    data?: Record<string, unknown>;
    viewType?: RecipeContentFormat | 'blank';
  } = {}
): Recipe {
  const timestamp = '2026-04-08T20:00:00.000Z';
  const contentFormat: RecipeContentFormat = viewType === 'blank' ? 'markdown' : viewType;
  const tabs: RecipeTab[] = normalizeRecipeTabs({
    contentFormat,
    contentData:
      contentFormat === 'table'
        ? {
            columns: [
              { id: 'task', label: 'Task', emphasis: 'primary' },
              { id: 'owner', label: 'Owner', emphasis: 'none' }
            ],
            rows: [{ task: 'Ship bridge', owner: 'Hermes' }],
            emptyMessage: 'No rows yet.'
          }
        : contentFormat === 'card'
          ? {
              cards: [
                {
                  id: 'card-1',
                  title: 'Launch checklist',
                  description: 'Start here',
                  eyebrow: 'Q2',
                  badges: ['active'],
                  metadata: [{ label: 'Owner', value: 'Hermes' }]
                }
              ],
              emptyMessage: 'No cards yet.'
            }
          : {
              markdown:
                typeof overrides.data?.markdown === 'string'
                  ? overrides.data.markdown
                  : viewType === 'blank'
                    ? ''
                    : '## Notes\n\n- **Launch checklist**\n  - Owner: Hermes'
            }
  });

  return {
    schemaVersion: 3,
    id: recipeId,
    profileId: 'jbarton',
    primarySessionId: overrides.primarySessionId ?? overrides.linkedSessionId ?? `session-for-${recipeId}`,
    primaryRuntimeSessionId: overrides.primaryRuntimeSessionId ?? overrides.linkedRuntimeSessionId ?? null,
    title:
      viewType === 'blank'
        ? 'Untitled recipe'
        : viewType === 'table'
          ? 'Launch table'
          : viewType === 'card'
            ? 'Launch checklist'
              : 'Sanitized notes',
    description: viewType === 'markdown' ? 'Markdown notes' : `${viewType} recipe`,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'active',
    renderMode: overrides.renderMode ?? 'legacy_content_v1',
    tabs,
    uiState: {
      activeTab: 'content'
    },
    lastUpdatedBy: 'user',
    source: 'user',
    metadata: {
      changeVersion: 1,
      auditTags: [],
      homeRecipe: true,
      baselineContentUpdatedAt: timestamp,
      changeSummary: 'Initial recipe',
      lastChangedAt: timestamp
    },
    ...overrides
  };
}

function createDynamicReadySpace(recipeId: string, sessionId: string, overrides: Partial<Recipe> = {}): Recipe {
  const fallbackMarkdown = '- Hotel Ardent\n- AC Hotel Dayton';

  return createRecipe(recipeId, 'card', {
    schemaVersion: 5,
    primarySessionId: sessionId,
    primaryRuntimeSessionId: sessionId,
    title: 'Hotel shortlist',
    description: 'Weekend Dayton options',
    renderMode: 'dynamic_v1',
    tabs: normalizeRecipeTabs({
      contentFormat: 'markdown',
      contentData: {
        markdown: fallbackMarkdown
      }
    }),
    dynamic: {
      renderMode: 'dynamic_v1',
      activeBuild: {
        id: `build-${recipeId}`,
        recipeId,
        profileId: 'jbarton',
        sessionId,
        buildVersion: 1,
        buildKind: 'compiled_home',
        triggerKind: 'chat',
        triggerRequestId: 'request-initial-recipe',
        triggerActionId: null,
        phase: 'ready',
        progressMessage: 'Recipe ready.',
        retryCount: 0,
        startedAt: '2026-04-08T20:00:00.000Z',
        updatedAt: '2026-04-08T20:00:05.000Z',
        completedAt: '2026-04-08T20:00:05.000Z',
        failureCategory: null,
        failureStage: null,
        userFacingMessage: null,
        retryable: null,
        configuredTimeoutMs: null,
        errorCode: null,
        errorMessage: null,
        errorDetail: null
      },
      summary: {
        kind: 'summary',
        schemaVersion: 'recipe_summary/v1',
        title: 'Hotel shortlist',
        subtitle: 'Weekend Dayton options',
        statusLabel: 'Ready',
        badges: ['dynamic', 'small-pane'],
        stats: [
          {
            id: 'stat-results',
            label: 'Options',
            value: '2',
            emphasis: 'primary',
            tone: 'info'
          }
        ],
        links: [],
        lastBuiltAt: '2026-04-08T20:00:05.000Z',
        note: 'Compact card layout selected.'
      },
      normalizedData: {
        kind: 'normalized_data',
        schemaVersion: 'recipe_normalized_data/v1',
        primaryDatasetId: 'primary',
        datasets: [
          {
            id: 'primary',
            label: 'Weekend shortlist',
            kind: 'collection',
            preferredPresentation: 'cards',
            items: [
              {
                id: 'hotel-ardent',
                title: 'Hotel Ardent',
                subtitle: 'Downtown Dayton',
                description: 'Boutique stay near downtown.',
                badges: ['walkable'],
                fields: [
                  {
                    key: 'price',
                    label: 'Price',
                    value: '$210',
                    presentation: 'text',
                    emphasis: 'primary'
                  }
                ],
                links: [],
                metadata: {}
              },
              {
                id: 'ac-dayton',
                title: 'AC Hotel Dayton',
                subtitle: 'Dayton core',
                description: 'Modern downtown stay.',
                badges: ['modern'],
                fields: [
                  {
                    key: 'price',
                    label: 'Price',
                    value: '$189',
                    presentation: 'text',
                    emphasis: 'primary'
                  }
                ],
                links: [],
                metadata: {}
              }
            ],
            fields: [
              {
                key: 'price',
                label: 'Price',
                value: '$210',
                presentation: 'text',
                emphasis: 'primary'
              }
            ],
            stats: [
              {
                id: 'stat-results',
                label: 'Options',
                value: '2',
                emphasis: 'primary',
                tone: 'info'
              }
            ],
            notes: ['Pick a walkable option first.'],
            pageInfo: {
              pageSize: 1,
              totalItems: 2,
              hasMore: true
            },
            metadata: {}
          }
        ],
        summaryStats: [
          {
            id: 'stat-results',
            label: 'Options',
            value: '2',
            emphasis: 'primary',
            tone: 'info'
          }
        ],
        notes: ['Pick a walkable option first.'],
        links: [],
        metadata: {}
      },
      uiSpec: {
        kind: 'ui_spec',
        schemaVersion: 'recipe_ui/v1',
        layout: 'stack_with_detail',
        compact: {
          defaultSectionId: 'results',
          maxCardColumns: 1,
          stickyToolbar: true
        },
        header: {
          title: 'Hotel shortlist',
          subtitle: 'Weekend Dayton options',
          statusLabel: 'Ready',
          badges: ['dynamic', 'small-pane'],
          statIds: ['stat-results'],
          primaryActionIds: ['refresh-recipe'],
          secondaryActionIds: []
        },
        sections: [
          {
            id: 'overview',
            kind: 'summary',
            title: 'Overview',
            subtitle: 'Compact shortlist summary',
            statIds: ['stat-results'],
            actionIds: ['refresh-recipe']
          },
          {
            id: 'results',
            kind: 'collection',
            title: 'Results',
            datasetId: 'primary',
            presentation: 'cards',
            pageSize: 1,
            searchable: true,
            selection: 'single',
            detailSectionId: 'detail',
            columns: [],
            cardFields: [
              {
                label: 'Price',
                fieldKey: 'price',
                presentation: 'text',
                emphasize: 'primary'
              }
            ],
            primaryActionIds: ['refresh-recipe'],
            rowActionIds: ['refine-selection'],
            filterKeys: [],
            emptyState: {
              title: 'No results',
              description: 'Try broadening the request.'
            },
            loadingState: {
              title: 'Loading results',
              description: 'Building a compact recipe view.'
            },
            errorState: {
              title: 'Results unavailable',
              description: 'The recipe data could not be rendered.'
            }
          },
          {
            id: 'detail',
            kind: 'detail',
            title: 'Selection',
            datasetId: 'primary',
            source: 'selected',
            fields: [
              {
                label: 'Price',
                fieldKey: 'price',
                presentation: 'text',
                emphasize: 'primary'
              }
            ],
            actionIds: ['refine-selection'],
            emptyState: {
              title: 'Nothing selected',
              description: 'Select an item to inspect it.'
            },
            loadingState: {
              title: 'Loading details',
              description: 'Preparing the detail pane.'
            },
            errorState: {
              title: 'Detail unavailable',
              description: 'The selected item could not be rendered.'
            }
          }
        ]
      },
      actionSpec: {
        kind: 'action_spec',
        schemaVersion: 'recipe_action_spec/v1',
        actions: [
          {
            id: 'refresh-recipe',
            label: 'Refresh',
            kind: 'prompt',
            intent: 'primary',
            description: 'Refresh the shortlist.',
            visibility: {
              requiresSelection: 'none',
              whenBuildReady: true
            },
            prompt: {
              promptTemplate: 'Refresh the shortlist.',
              includeInputs: ['original_prompt', 'normalized_data'],
              allowedMutations: ['raw_data', 'normalized_data', 'ui_spec', 'assistant_response'],
              outboundRequestsAllowed: true,
              expectedOutput: 'recipe_data_update',
              timeoutMs: 120000,
              retryable: true
            },
            metadata: {}
          },
          {
            id: 'refine-selection',
            label: 'Refine selection',
            kind: 'prompt',
            intent: 'secondary',
            description: 'Refine the selected hotel.',
            visibility: {
              requiresSelection: 'single',
              whenBuildReady: true,
              datasetId: 'primary'
            },
            prompt: {
              promptTemplate: 'Refine the selected hotel.',
              includeInputs: ['selected_items', 'normalized_data'],
              allowedMutations: ['normalized_data', 'assistant_response'],
              outboundRequestsAllowed: true,
              expectedOutput: 'recipe_data_update',
              timeoutMs: 120000,
              retryable: true
            },
            metadata: {}
          }
        ]
      },
      latestTestResults: {
        kind: 'test_results',
        schemaVersion: 'recipe_test_results/v1',
        status: 'passed',
        blockingFailureCount: 0,
        results: [],
        checkedAt: '2026-04-08T20:00:05.000Z'
      },
      fallback: {
        kind: 'fallback',
        schemaVersion: 'recipe_fallback/v1',
        title: 'Hotel shortlist',
        message: 'Safe fallback summary.',
        summaryMarkdown: fallbackMarkdown,
        datasetPreview: [],
        canRetry: true
      }
    },
    ...overrides
  });
}

function createDefaultAppFetchResponse(url: string) {
  const parsed = new URL(url, 'http://localhost');
  const profileId = parsed.searchParams.get('profileId') ?? 'jbarton';
  const inspectedProviderId = parsed.searchParams.get('inspectedProviderId');
  const page = Number(parsed.searchParams.get('page') ?? '1');
  const pageSize = Number(parsed.searchParams.get('pageSize') ?? '25');

  if (parsed.pathname === '/api/model-providers' && profileId) {
    return jsonResponse(
      createModelProviderResponseForProfile(profileId, {
        inspectedProviderId: inspectedProviderId ?? undefined
      })
    );
  }

  if (parsed.pathname === '/api/settings') {
    return jsonResponse(createSettingsResponse());
  }

  if (parsed.pathname === '/api/telemetry') {
    return jsonResponse({
      items: [],
      page,
      pageSize,
      total: 0
    });
  }

  if (parsed.pathname === '/api/audit-events') {
    return jsonResponse({
      items: [],
      page,
      pageSize,
      total: 0
    });
  }

  return null;
}

(vi as { stubGlobal: typeof vi.stubGlobal }).stubGlobal = ((name, value) => {
  if (name !== 'fetch' || typeof value !== 'function') {
    return originalStubGlobal(name, value);
  }

  const fetchImpl = value as typeof fetch;
  const wrappedFetch = vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    try {
      return await fetchImpl(input, init);
    } catch (error) {
      const url = String(input);
      const fallbackResponse =
        error instanceof Error && error.message === `Unexpected request: ${url}` ? createDefaultAppFetchResponse(url) : null;
      if (fallbackResponse) {
        return fallbackResponse;
      }

      throw error;
    }
  });

  return originalStubGlobal(name, wrappedFetch as unknown as typeof globalThis.fetch);
}) as typeof vi.stubGlobal;

afterEach(() => {
  cleanup();
  toaster.remove();
  setThemeModeMock.mockReset();
  delete (globalThis as Record<string, unknown>).__spaceInjected;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('App', () => {
  it('shows an explicit bridge unavailable state instead of fallback content', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            error: {
              code: 'HERMES_UNAVAILABLE',
              message: 'Fixture failed to load profiles.'
            }
          },
          503
        )
      )
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    expect(await screen.findByText('Bridge unavailable')).toBeInTheDocument();
    expect(screen.getByText('Fixture failed to load profiles.')).toBeInTheDocument();
    expect(screen.queryByText('Local Profile')).not.toBeInTheDocument();
  });

  it('renders the profile-scoped shell, shared page header, and required navigation structure', async () => {
    const sessionsResponse: SessionsResponse = {
      profileId: 'jbarton',
      items: [createSession('session-2', 'Bridge reset planning session')],
      page: 1,
      pageSize: 50,
      total: 1,
      hiddenSyntheticCount: 2,
      search: ''
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              recentSessions: [createSession('session-1', 'Quarterly planning review')]
            })
          );
        }

        if (url.endsWith('/api/ui-state') && init?.method === 'PUT') {
          return jsonResponse(
            createUiState({
            activeProfileId: 'jbarton',
            currentPage: 'sessions',
            activeSessionIdByProfile: {
              jbarton: null
            },
            activeRecipeIdByProfile: {},
            recentSessionIdsByProfile: {
              jbarton: []
            },
            toolsTab: 'all'
            })
          );
        }

        if (url.includes('/api/sessions?profileId=jbarton')) {
          return jsonResponse(sessionsResponse);
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    expect(await screen.findByText('Choose a recent session or start a new one.')).toBeInTheDocument();
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    // Profile selector is now a ProfileBar — check that the active profile ID is visible
    expect(screen.getAllByText('jbarton').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'All sessions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jobs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tools' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skills' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'All sessions' }));

    expect(await screen.findByText('Bridge reset planning session')).toBeInTheDocument();
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByText(/2 synthetic sessions hidden/i)).toBeInTheDocument();
  });

  it('blocks the main screen when no usable provider and model are configured, while keeping Settings and Recipes accessible', async () => {
    const blockedProviders = createModelProviderResponse({
      config: {
        ...createModelProviderResponse().config
      },
      providers: createModelProviderResponse().providers.map((provider) =>
        provider.id === 'openrouter'
          ? {
              ...provider,
              status: 'missing',
              disabled: true,
              disabledReason: 'Connect OpenRouter before selecting it for this profile.'
            }
          : provider
      ),
      runtimeReadiness: {
        ready: false,
        code: 'provider_auth_required',
        message: 'Connect OpenRouter and choose a default model before using chat.',
        providerId: 'openrouter',
        modelId: null
      }
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              recentSessions: [createSession('session-1', 'Quarterly planning review')]
            })
          );
        }

        if (url === '/api/model-providers?profileId=jbarton') {
          return jsonResponse(blockedProviders);
        }

        if (url.endsWith('/api/ui-state') && init?.method === 'PUT') {
          return jsonResponse(
            createUiState({
            activeProfileId: 'jbarton',
            currentPage: 'settings',
            activeSessionIdByProfile: {},
            activeRecipeIdByProfile: {},
            recentSessionIdsByProfile: {},
            toolsTab: 'all'
            })
          );
        }

        if (url === '/api/settings') {
          return jsonResponse(createSettingsResponse());
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    expect(await screen.findByText('Pick a model for Hermes to use')).toBeInTheDocument();
    expect(screen.getByText('Connect OpenRouter and choose a default model before using chat.')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Ask Hermes something real.')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Recipes' }));
    expect(await screen.findByTestId('spaces-template-gallery')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(await screen.findByText('Local preferences')).toBeInTheDocument();
  }, 15_000);

  it('keeps startup in checking state until authoritative runtime discovery resolves', async () => {
    const session = createSession('session-1', 'Quarterly planning review');
    const freshReadyResponse = createModelProviderResponse();
    let modelProviderCalls = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              recentSessions: [session],
              activeSessionId: session.id,
              uiState: createUiState({
                activeProfileId: 'jbarton',
                currentPage: 'chat',
                activeSessionIdByProfile: {
                  jbarton: session.id
                }
              })
            })
          );
        }

        if (url === '/api/sessions/session-1/messages?profileId=jbarton') {
          return jsonResponse(
            createSessionPayload(session, [
              createMessage({
                id: 'message-1',
                sessionId: session.id,
                role: 'user',
                content: 'Find good hotels in Dayton, OH.',
                createdAt: '2026-04-08T20:00:00.000Z'
              })
            ])
          );
        }

        if (url.startsWith('/api/model-providers?profileId=jbarton')) {
          modelProviderCalls += 1;
          await new Promise((resolve) => setTimeout(resolve, 25));
          return jsonResponse(freshReadyResponse);
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    expect(await screen.findByText('Checking runtime configuration')).toBeInTheDocument();
    expect(screen.queryByText('Hermes runtime configuration required')).not.toBeInTheDocument();
    expect(modelProviderCalls).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      expect(modelProviderCalls).toBe(1);
      expect(screen.getByPlaceholderText('Ask Hermes something real.')).toBeInTheDocument();
    });
  });

  it('keeps startup in checking state while authoritative discovery is pending and unblocks automatically once it resolves', async () => {
    const session = createSession('session-1', 'Quarterly planning review');
    const discoveryPendingResponse = createModelProviderResponse({
      runtimeReadiness: {
        ready: false,
        code: 'discovery_pending',
        message: 'Hermes is still discovering OpenRouter models.',
        providerId: 'openrouter',
        modelId: 'openai/gpt-5.4'
      },
      providers: createModelProviderResponse().providers.map((provider) =>
        provider.id === 'openrouter'
          ? {
              ...provider,
              state: 'discovery_pending',
              stateMessage: 'Hermes is still discovering OpenRouter models.',
              ready: false,
              disabled: true,
              disabledReason: 'Hermes is still discovering OpenRouter models.'
            }
          : provider
      )
    });
    const readyResponse = createModelProviderResponse();
    let modelProviderCalls = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              recentSessions: [session],
              activeSessionId: session.id,
              uiState: createUiState({
                activeProfileId: 'jbarton',
                currentPage: 'chat',
                activeSessionIdByProfile: {
                  jbarton: session.id
                }
              })
            })
          );
        }

        if (url === '/api/sessions/session-1/messages?profileId=jbarton') {
          return jsonResponse(createSessionPayload(session, []));
        }

        if (url.startsWith('/api/model-providers?profileId=jbarton')) {
          modelProviderCalls += 1;
          return jsonResponse(modelProviderCalls < 3 ? discoveryPendingResponse : readyResponse);
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    expect(await screen.findByText('Checking runtime configuration')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(modelProviderCalls).toBe(3);
        expect(screen.getByPlaceholderText('Ask Hermes something real.')).toBeInTheDocument();
      },
      {
        timeout: 2_000
      }
    );
  });

  it('retries transient authoritative discovery failures on startup and unblocks automatically once discovery succeeds', async () => {
    const session = createSession('session-1', 'Quarterly planning review');
    const readyResponse = createModelProviderResponse();
    let modelProviderCalls = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              recentSessions: [session],
              activeSessionId: session.id,
              uiState: createUiState({
                activeProfileId: 'jbarton',
                currentPage: 'chat',
                activeSessionIdByProfile: {
                  jbarton: session.id
                }
              })
            })
          );
        }

        if (url === '/api/sessions/session-1/messages?profileId=jbarton') {
          return jsonResponse(createSessionPayload(session, []));
        }

        if (url.startsWith('/api/model-providers?profileId=jbarton')) {
          modelProviderCalls += 1;
          if (modelProviderCalls === 1) {
            return jsonResponse(
              {
                error: {
                  code: 'MODEL_PROVIDER_REFRESH_FAILED',
                  message: 'Hermes authoritative model/provider state is unavailable. Open Settings and retry the provider check.'
                }
              },
              502
            );
          }

          return jsonResponse(readyResponse);
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    expect(await screen.findByText('Checking runtime configuration')).toBeInTheDocument();
    expect(screen.queryByText('Hermes runtime configuration unavailable')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(modelProviderCalls).toBe(2);
      expect(screen.getByPlaceholderText('Ask Hermes something real.')).toBeInTheDocument();
    });
  });

  it(
    'shows one clean runtime configuration blocker when authoritative startup discovery keeps failing',
    async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: Parameters<typeof fetch>[0]) => {
          const url = String(input);

          if (url.endsWith('/api/bootstrap')) {
            return jsonResponse(
              createBootstrapResponse({
                uiState: createUiState({
                  activeProfileId: 'jbarton',
                  currentPage: 'settings',
                  activeSessionIdByProfile: {},
                  activeRecipeIdByProfile: {},
                  recentSessionIdsByProfile: {},
                  toolsTab: 'all'
                })
              })
            );
          }

          if (url === '/api/settings') {
            return jsonResponse(createSettingsResponse());
          }

          if (url.startsWith('/api/model-providers?profileId=jbarton')) {
            return jsonResponse(
              {
                error: {
                  code: 'MODEL_PROVIDER_REFRESH_FAILED',
                  message: 'Hermes authoritative model/provider state is unavailable. Open Settings and retry the provider check.'
                }
              },
              502
            );
          }

          throw new Error(`Unexpected request: ${url}`);
        })
      );

      render(
        <HermesUiProvider>
          <App />
        </HermesUiProvider>
      );

      await screen.findByText('Local preferences');

      await waitFor(
        () => {
          expect(screen.getAllByText('Runtime configuration unavailable')).toHaveLength(1);
        },
        {
          timeout: 7_500
        }
      );
      expect(screen.queryByText('Runtime configuration failed')).not.toBeInTheDocument();
      expect(screen.queryByText('Runtime configuration required')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('tab', { name: 'Models' }));
      expect(screen.getAllByText('Runtime configuration unavailable')).toHaveLength(1);
    },
    12_000
  );

  it('renders settings as top tabs with scrollable section panels', async () => {
    const settingsResponse = createSettingsResponse();
    const modelProviderResponse = createModelProviderResponse({
      inspectedProviderId: null,
      discoveredAt: null
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(createBootstrapResponse());
        }

        if (url.endsWith('/api/ui-state') && init?.method === 'PUT') {
          return jsonResponse(
            createUiState({
            activeProfileId: 'jbarton',
            currentPage: 'settings',
            activeSessionIdByProfile: {},
            activeRecipeIdByProfile: {},
            recentSessionIdsByProfile: {},
            toolsTab: 'all'
            })
          );
        }

        if (url === '/api/settings') {
          return jsonResponse(settingsResponse);
        }

        if (url === '/api/model-providers?profileId=jbarton') {
          return jsonResponse(modelProviderResponse);
        }

        if (url === '/api/telemetry?profileId=jbarton&limit=50') {
          return jsonResponse({
            items: []
          });
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    await screen.findByText('Choose a recent session or start a new one.');
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(await screen.findByRole('tab', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Models' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Access' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Audit' })).toBeInTheDocument();
    expect(screen.getByTestId('settings-scroll')).toBeInTheDocument();

    // Danger zone (unrestricted access) is now on the main Settings tab
    expect(await screen.findByTestId('settings-danger-zone')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Models' }));
    // The Models tab now renders a card grid driven by ProviderConnectionGrid.
    // Connected providers show a "Manage" button; not-yet-connected ones show "Connect".
    expect(await screen.findByPlaceholderText('Search providers…')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Access' }));
    expect(await screen.findByText('No unrestricted-access audit activity has been recorded yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('access-audit-scroll')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Audit' }));
    expect(await screen.findByText('No troubleshooting telemetry has been recorded for the active profile yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('telemetry-scroll')).not.toBeInTheDocument();
  });

  it('loads troubleshooting telemetry into settings with persisted request and session ids', async () => {
    const settingsResponse = createSettingsResponse();
    const modelProviderResponse = createModelProviderResponse();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(createBootstrapResponse());
        }

        if (url.endsWith('/api/ui-state') && init?.method === 'PUT') {
          return jsonResponse(
            createUiState({
            activeProfileId: 'jbarton',
            currentPage: 'settings',
            activeSessionIdByProfile: {},
            activeRecipeIdByProfile: {},
            recentSessionIdsByProfile: {},
            toolsTab: 'all'
            })
          );
        }

        if (url === '/api/settings') {
          return jsonResponse(settingsResponse);
        }

        if (url === '/api/model-providers?profileId=jbarton') {
          return jsonResponse(modelProviderResponse);
        }

        const parsed = new URL(url, 'http://localhost');

        if (parsed.pathname === '/api/telemetry' && parsed.searchParams.get('profileId') === 'jbarton') {
          return jsonResponse({
            items: [
              {
                id: 'telemetry-1',
                profileId: 'jbarton',
                sessionId: 'session-telemetry',
                requestId: 'request-telemetry',
                severity: 'error',
                category: 'runtime',
                code: 'CHAT_STREAM_FAILED',
                message: 'Hermes could not finish request request-telemetry.',
                detail: 'Fixture runtime failure.',
                payload: {
                  source: 'test'
                },
                createdAt: '2026-04-08T20:00:00.000Z'
              }
            ],
            page: 1,
            pageSize: 25,
            total: 1
          });
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    await screen.findByText('Choose a recent session or start a new one.');
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Audit' }));

    expect(await screen.findByText('Hermes could not finish request request-telemetry.')).toBeInTheDocument();
    expect(screen.getByText('Fixture runtime failure.')).toBeInTheDocument();
    expect(screen.getByText('Request request-telemetry · Session session-telemetry')).toBeInTheDocument();
    expect(screen.getByTestId('telemetry-scroll')).toBeInTheDocument();
    expect(screen.getByTestId('telemetry-row')).toHaveAttribute('data-density', 'compact');
  });

  it('surfaces Hermes runtime activity and reviewed bridge executions together in Tool History', async () => {
    const toolsResponse: ToolsResponse = {
      connection: {
        status: 'connected',
        checkedAt: '2026-04-08T20:00:00.000Z',
        usingCachedData: false
      },
      items: [
        {
          id: 'bridge:reviewed-shell',
          profileId: 'jbarton',
          source: 'bridge',
          scope: 'recipe',
          name: 'Reviewed shell access',
          description: 'Read-only recipe inspection after explicit approval.',
          enabled: true,
          status: 'enabled',
          approvalModel: 'explicit_user_approval',
          capabilities: ['pwd', 'git status', 'rg --files'],
          restrictions: ['Read-only recipe inspection only.'],
          lastSyncedAt: '2026-04-08T20:00:00.000Z'
        }
      ]
    };
    const toolHistoryResponse: ToolHistoryResponse = {
      items: [
        {
          id: 'tool-execution-1',
          toolId: 'bridge:reviewed-shell',
          profileId: 'jbarton',
          sessionId: 'session-tools',
          summary: 'Run pwd',
          command: 'pwd',
          args: [],
          cwd: '.',
          status: 'completed',
          requestedAt: '2026-04-08T20:05:00.000Z',
          resolvedAt: '2026-04-08T20:05:01.000Z',
          stdout: '/tmp/project',
          stderr: '',
          exitCode: 0
        }
      ],
      runtimeItems: [
        {
          id: 'runtime-history-1',
          requestId: 'request-tools-1',
          sessionId: 'session-tools',
          profileId: 'jbarton',
          sessionTitle: 'Unread inbox check',
          requestPreview: 'How many unread emails do I have?',
          kind: 'tool',
          state: 'completed',
          label: 'gmail_unread_count',
          detail: 'Unread inbox lookup finished.',
          timestamp: '2026-04-08T20:04:00.000Z'
        },
        {
          id: 'runtime-history-2',
          requestId: 'request-tools-1',
          sessionId: 'session-tools',
          profileId: 'jbarton',
          sessionTitle: 'Unread inbox check',
          requestPreview: 'How many unread emails do I have?',
          kind: 'skill',
          state: 'completed',
          label: 'google-workspace',
          detail: 'Scoped unread-email skill completed.',
          timestamp: '2026-04-08T20:04:01.000Z'
        }
      ],
      page: 1,
      pageSize: 25,
      total: 1,
      runtimeTotal: 2
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              uiState: {
                activeProfileId: 'jbarton',
                currentPage: 'tools',
                activeSessionIdByProfile: {},
                activeRecipeIdByProfile: {},
                recentSessionIdsByProfile: {},
                toolsTab: 'history'
              }
            })
          );
        }

        if (url.endsWith('/api/ui-state') && init?.method === 'PUT') {
          return jsonResponse(
            createUiState({
            activeProfileId: 'jbarton',
            currentPage: 'tools',
            activeSessionIdByProfile: {},
            activeRecipeIdByProfile: {},
            recentSessionIdsByProfile: {},
            toolsTab: 'history'
            })
          );
        }

        if (url === '/api/tools?profileId=jbarton') {
          return jsonResponse(toolsResponse);
        }

        if (url === '/api/tool-history?profileId=jbarton&page=1&pageSize=25') {
          return jsonResponse(toolHistoryResponse);
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    // Tab labels changed: "Runtime activity" → "Activity (N)", "Reviewed executions" → "Reviewed (N)"
    expect(await screen.findByText(/Activity \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText(/Reviewed \(\d+\)/)).toBeInTheDocument();
    expect(within(screen.getByTestId('runtime-tool-history-table-scroll')).getByText('gmail_unread_count')).toBeInTheDocument();
    expect(within(screen.getByTestId('runtime-tool-history-table-scroll')).getByText('google-workspace')).toBeInTheDocument();
    expect(screen.getByText(/\d+ runtime · \d+ reviewed/)).toBeInTheDocument();
  });

  it('shows the top-level Recipes navigation and keeps attached-recipe indicators in recent sessions and All sessions', async () => {
    const attachedSession = createSession('session-recipe', 'Launch recipe', 'jbarton', {
      attachedRecipeId: 'recipe-launch'
    });
    const plainSession = createSession('session-plain', 'Plain chat');

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              recentSessions: [attachedSession, plainSession]
            })
          );
        }

        if (url.endsWith('/api/ui-state') && init?.method === 'PUT') {
          return jsonResponse(
            createUiState({
              activeProfileId: 'jbarton',
              currentPage: 'sessions',
              activeSessionIdByProfile: {},
              recentSessionIdsByProfile: {
                jbarton: [attachedSession.id, plainSession.id]
              },
              toolsTab: 'all'
            })
          );
        }

        if (url.includes('/api/sessions?profileId=jbarton')) {
          return jsonResponse({
            profileId: 'jbarton',
            items: [attachedSession, plainSession],
            page: 1,
            pageSize: 50,
            total: 2,
            hiddenSyntheticCount: 0,
            search: ''
          } satisfies SessionsResponse);
        }

        return createDefaultAppFetchResponse(url);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    const sidebarScroll = await screen.findByTestId('sidebar-scroll');
    expect(within(sidebarScroll).getByRole('button', { name: /^Recipes$/ })).toBeInTheDocument();
    const recentRow = within(sidebarScroll)
      .getAllByTestId('recent-session-row')
      .find((row) => row.getAttribute('data-session-id') === attachedSession.id);
    expect(recentRow).toBeTruthy();
    expect(within(recentRow as HTMLElement).getByTestId('recent-session-meta')).toHaveTextContent('2 messages');
    expect(within(recentRow as HTMLElement).queryByText(attachedSession.summary)).not.toBeInTheDocument();
    expect(screen.getAllByTestId('hermes-home-brand').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /^Recipes$/ }));
    expect(await screen.findByTestId('spaces-template-gallery')).toBeInTheDocument();
    expect(screen.getByTestId('page-header')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^All sessions$/ }));
    const sessionsTable = await screen.findByTestId('sessions-table-scroll');
    const attachedRow = within(sessionsTable).getByText('Launch recipe').closest('tr');
    const plainRow = within(sessionsTable).getByText('Plain chat').closest('tr');
    expect(attachedRow).toBeTruthy();
    expect(plainRow).toBeTruthy();
    expect(within(sessionsTable).getByText('Type')).toBeInTheDocument();
    expect(within(attachedRow as HTMLTableRowElement).getByTestId('session-recipe-indicator')).toBeInTheDocument();
    expect(within(attachedRow as HTMLTableRowElement).getByText('Kitchen')).toBeInTheDocument();
    expect(within(plainRow as HTMLTableRowElement).getByText('TUI')).toBeInTheDocument();
    expect(within(sessionsTable).queryByText('Recipes')).not.toBeInTheDocument();
  });

  it('opens a session without an attached recipe in the normal chat-only layout', async () => {
    const activeSession = createSession('session-chat-only', 'Plain chat');
    const sessionPayload = createSessionPayload(activeSession, [
      createMessage({
        id: 'plain-assistant',
        sessionId: activeSession.id,
        role: 'assistant',
        content: 'Plain chat ready.',
        createdAt: '2026-04-08T20:00:00.000Z',
        requestId: 'request-plain'
      })
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              activeSessionId: activeSession.id,
              recentSessions: [activeSession],
              uiState: {
                activeProfileId: 'jbarton',
                currentPage: 'chat',
                activeSessionIdByProfile: {
                  jbarton: activeSession.id
                },
                recentSessionIdsByProfile: {
                  jbarton: [activeSession.id]
                },
                toolsTab: 'all'
              }
            })
          );
        }

        if (url === `/api/sessions/${activeSession.id}/messages?profileId=jbarton`) {
          return jsonResponse(sessionPayload);
        }

        return createDefaultAppFetchResponse(url);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    expect(await screen.findByText('Plain chat ready.')).toBeInTheDocument();
    expect(screen.queryByTestId('combined-session-recipe-layout')).not.toBeInTheDocument();
    expect(screen.queryByTestId('attached-recipe-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-activity-pane')).toBeInTheDocument();
  });

  it('opens an attached-recipe session in the combined layout and opens the runtime drawer from transcript clicks', async () => {
    const activeSession = createSession('session-attached', 'Launch recipe', 'jbarton', {
      attachedRecipeId: 'recipe-launch'
    });
    const attachedRecipe = createRecipe('recipe-launch', 'card', {
      primarySessionId: activeSession.id,
      title: 'Launch checklist',
      description: 'Track launch work'
    });
    const sessionPayload = createSessionPayload(
      activeSession,
      [
        createMessage({
          id: 'attached-user',
          sessionId: activeSession.id,
          role: 'user',
          content: 'Show the launch checklist.',
          createdAt: '2026-04-08T20:00:00.000Z',
          requestId: 'request-attached'
        }),
        createMessage({
          id: 'attached-assistant',
          sessionId: activeSession.id,
          role: 'assistant',
          content: 'Launch checklist ready.',
          createdAt: '2026-04-08T20:00:01.000Z',
          requestId: 'request-attached'
        })
      ],
      'jbarton',
      [
        createRuntimeRequest('request-attached', activeSession.id, 'Show the launch checklist.', {
          messageIds: ['attached-user', 'attached-assistant'],
          activities: [
            {
              kind: 'tool',
              state: 'completed',
              label: 'recipe runtime trace',
              detail: 'Attached recipe runtime detail.',
              requestId: 'request-attached',
              timestamp: '2026-04-08T20:00:01.100Z'
            }
          ]
        })
      ],
      {
        attachedRecipe
      }
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              activeSessionId: activeSession.id,
              recentSessions: [activeSession],
              uiState: {
                activeProfileId: 'jbarton',
                currentPage: 'chat',
                activeSessionIdByProfile: {
                  jbarton: activeSession.id
                },
                recentSessionIdsByProfile: {
                  jbarton: [activeSession.id]
                },
                toolsTab: 'all'
              }
            })
          );
        }

        if (url === `/api/sessions/${activeSession.id}/messages?profileId=jbarton`) {
          return jsonResponse(sessionPayload);
        }

        return createDefaultAppFetchResponse(url);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    expect(await screen.findByTestId('combined-session-recipe-layout')).toBeInTheDocument();
    expect(screen.getByTestId('attached-recipe-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('session-recipe-top-area')).not.toBeInTheDocument();
    expect(screen.getByTestId('attached-recipe-panel')).toHaveTextContent('Start here');
    expect(screen.getByTestId('session-recipe-chat-pane')).toBeInTheDocument();
    expect(screen.queryByTestId('page-header')).not.toBeInTheDocument();
    expect(screen.getByTestId('shell-toolbar')).toBeInTheDocument();
    expect(within(screen.getByTestId('shell-toolbar')).getByText('The Kitchen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch to (light|dark) mode/ })).toBeInTheDocument();
    expect(screen.queryByText('Choose a recent session or start a new one.')).not.toBeInTheDocument();
    expect(screen.queryByTestId('recipe-runtime-drawer')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Launch checklist ready.'));

    const runtimeDrawer = await screen.findByTestId('recipe-runtime-drawer');
    expect(runtimeDrawer).toBeVisible();
    expect(within(runtimeDrawer).getByText('recipe runtime trace')).toBeInTheDocument();
    expect(within(runtimeDrawer).getByText('Attached recipe runtime detail.')).toBeInTheDocument();
  });

  it('collapses the attached-recipe chat pane into a right-side rail and reopens it on demand', async () => {
    const activeSession = createSession('session-attached-collapse', 'Launch recipe', 'jbarton', {
      attachedRecipeId: 'recipe-launch'
    });
    const attachedRecipe = createRecipe('recipe-launch', 'card', {
      primarySessionId: activeSession.id,
      title: 'Launch checklist',
      description: 'Track launch work'
    });
    const sessionPayload = createSessionPayload(
      activeSession,
      [
        createMessage({
          id: 'attached-collapse-user',
          sessionId: activeSession.id,
          role: 'user',
          content: 'Show the launch checklist.',
          createdAt: '2026-04-08T20:00:00.000Z',
          requestId: 'request-attached-collapse'
        }),
        createMessage({
          id: 'attached-collapse-assistant',
          sessionId: activeSession.id,
          role: 'assistant',
          content: 'Launch checklist ready.',
          createdAt: '2026-04-08T20:00:01.000Z',
          requestId: 'request-attached-collapse'
        })
      ],
      'jbarton',
      [
        createRuntimeRequest('request-attached-collapse', activeSession.id, 'Show the launch checklist.', {
          messageIds: ['attached-collapse-user', 'attached-collapse-assistant'],
          activities: [
            {
              kind: 'tool',
              state: 'completed',
              label: 'recipe runtime trace',
              detail: 'Attached recipe runtime detail.',
              requestId: 'request-attached-collapse',
              timestamp: '2026-04-08T20:00:01.100Z'
            }
          ]
        })
      ],
      {
        attachedRecipe
      }
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              activeSessionId: activeSession.id,
              recentSessions: [activeSession],
              uiState: {
                activeProfileId: 'jbarton',
                currentPage: 'chat',
                activeSessionIdByProfile: {
                  jbarton: activeSession.id
                },
                recentSessionIdsByProfile: {
                  jbarton: [activeSession.id]
                },
                toolsTab: 'all'
              }
            })
          );
        }

        if (url === `/api/sessions/${activeSession.id}/messages?profileId=jbarton`) {
          return jsonResponse(sessionPayload);
        }

        return createDefaultAppFetchResponse(url);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    expect(await screen.findByTestId('combined-session-recipe-layout')).toBeInTheDocument();
    expect(screen.getByTestId('session-recipe-chat-pane')).toBeInTheDocument();

    // Button has display:none at base breakpoint; use title attribute to find it
    await userEvent.click(screen.getByTitle('Collapse to space view'));

    expect(screen.queryByTestId('session-recipe-chat-pane')).not.toBeInTheDocument();
    expect(screen.getByTestId('collapsed-session-recipe-chat-rail')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Ask Hermes something real.')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open runtime activity' }));

    const runtimeDrawer = await screen.findByTestId('recipe-runtime-drawer');
    expect(runtimeDrawer).toBeVisible();
    expect(within(runtimeDrawer).getByText('recipe runtime trace')).toBeInTheDocument();
    await userEvent.click(within(runtimeDrawer).getByRole('button', { name: 'Close runtime drawer' }));
    await waitFor(() => {
      expect(screen.queryByTestId('recipe-runtime-drawer')).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Expand chat pane' }));

    expect(screen.getByTestId('session-recipe-chat-pane')).toBeInTheDocument();
    expect(screen.queryByTestId('collapsed-session-recipe-chat-rail')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask Hermes something real.')).toBeInTheDocument();
  });

  it('collapses the sidebar into icon-only mode without losing accessible navigation', async () => {
    const attachedSession = createSession('session-1', 'Quarterly planning review', 'jbarton', {
      attachedRecipeId: 'recipe-launch'
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              recentSessions: [attachedSession]
            })
          );
        }

        if (url.endsWith('/api/ui-state') && init?.method === 'PUT') {
          const partial = JSON.parse(String(init.body ?? '{}')) as Partial<UiState>;
          return jsonResponse(createUiState(partial));
        }

        if (url.includes('/api/sessions?profileId=jbarton')) {
          return jsonResponse({
            profileId: 'jbarton',
            items: [attachedSession],
            page: 1,
            pageSize: 50,
            total: 1,
            hiddenSyntheticCount: 0,
            search: ''
          } satisfies SessionsResponse);
        }

        return createDefaultAppFetchResponse(url);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    await screen.findByText('Quarterly planning review');

    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(screen.queryByText('Recent sessions')).not.toBeInTheDocument();
    expect(screen.queryByText('All sessions')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^All sessions$/ }));
    expect(await screen.findByTestId('sessions-table-scroll')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(await screen.findByText('Recent sessions')).toBeInTheDocument();
  });

  it('applies live attached-recipe updates while chat is streaming without requiring a refresh', async () => {
    const activeSession = createSession('session-live-recipe', 'Notes recipe', 'jbarton', {
      attachedRecipeId: 'recipe-markdown'
    });
    const initialSpace = createRecipe('recipe-markdown', 'markdown', {
      primarySessionId: activeSession.id,
      title: 'Sanitized notes',
      description: 'Attached notes recipe',
      data: {
        markdown: '## Notes\n\nInitial content'
      }
    });
    const updatedSpace = createRecipe('recipe-markdown', 'markdown', {
      primarySessionId: activeSession.id,
      title: 'Sanitized notes',
      description: 'Attached notes recipe',
      data: {
        markdown: '## Notes\n\nUpdated while chatting'
      },
      updatedAt: '2026-04-08T20:15:01.000Z'
    });
    const sessionPayload = createSessionPayload(
      activeSession,
      [
        createMessage({
          id: 'recipe-live-assistant',
          sessionId: activeSession.id,
          role: 'assistant',
          content: 'Ready for updates.',
          createdAt: '2026-04-08T20:15:00.000Z',
          requestId: 'request-live-recipe'
        })
      ],
      'jbarton',
      [],
      {
        attachedRecipe: initialSpace
      }
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              activeSessionId: activeSession.id,
              recentSessions: [activeSession],
              uiState: {
                activeProfileId: 'jbarton',
                currentPage: 'chat',
                activeSessionIdByProfile: {
                  jbarton: activeSession.id
                },
                recentSessionIdsByProfile: {
                  jbarton: [activeSession.id]
                },
                toolsTab: 'all'
              }
            })
          );
        }

        if (url === `/api/sessions/${activeSession.id}/messages?profileId=jbarton`) {
          return jsonResponse(sessionPayload);
        }

        if (url === '/api/chat/stream') {
          return delayedSseResponse([
            {
              type: 'message',
              message: {
                id: 'recipe-live-user',
                sessionId: activeSession.id,
                role: 'user',
                content: 'Update this recipe live.',
                createdAt: '2026-04-08T20:15:00.500Z',
                status: 'completed',
                requestId: 'request-live-recipe',
                visibility: 'transcript',
                kind: 'conversation'
              }
            },
            {
              type: 'recipe_event',
              event: {
                id: 'recipe-event-live',
                profileId: 'jbarton',
                recipeId: updatedSpace.id,
                recipeTitle: updatedSpace.title,
                type: 'updated',
                message: 'Hermes updated the recipe "Sanitized notes".',
                source: 'hermes',
                sessionId: activeSession.id,
                createdAt: '2026-04-08T20:15:01.000Z',
                metadata: {}
              },
              recipe: updatedSpace
            },
            {
              type: 'complete',
              session: {
                ...activeSession,
                messageCount: 3
              },
              assistantMessage: {
                id: 'recipe-live-complete',
                sessionId: activeSession.id,
                role: 'assistant',
                content: 'Updated the recipe.',
                createdAt: '2026-04-08T20:15:02.000Z',
                status: 'completed',
                requestId: 'request-live-recipe',
                visibility: 'transcript',
                kind: 'conversation'
              }
            }
          ]);
        }

        return createDefaultAppFetchResponse(url);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    await screen.findByText('Ready for updates.');
    await userEvent.type(screen.getByPlaceholderText('Ask Hermes something real.'), 'Update this recipe live.');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByTestId('session-recipe-content-scroll')).toHaveTextContent('Updated while chatting');
      expect(screen.getByTestId('session-recipe-chat-pane')).toHaveTextContent('Updated the recipe.');
    });
    expect(screen.queryByTestId('recipe-runtime-drawer')).not.toBeInTheDocument();
  });

  it('streams prompt-bound dynamic recipe actions through the action endpoint and updates the attached recipe', async () => {
    const activeSession = createSession('session-dynamic-action', 'Dynamic hotels', 'jbarton', {
      attachedRecipeId: 'recipe-dynamic-action'
    });
    const attachedRecipe = createDynamicReadySpace('recipe-dynamic-action', activeSession.id);
    const focusedSpace = createDynamicReadySpace('recipe-dynamic-action', activeSession.id, {
      title: 'Hotel Ardent focus',
      description: 'Focused detail view',
      updatedAt: '2026-04-08T20:05:00.000Z',
      dynamic: {
        ...attachedRecipe.dynamic!,
        activeBuild: {
          ...attachedRecipe.dynamic!.activeBuild!,
          id: 'build-recipe-dynamic-action-refine',
          buildVersion: 2,
          triggerKind: 'action',
          triggerRequestId: 'request-recipe-action-live',
          triggerActionId: 'refine-selection',
          progressMessage: 'Recipe ready.',
          updatedAt: '2026-04-08T20:05:00.000Z',
          completedAt: '2026-04-08T20:05:00.000Z'
        },
        summary: {
          ...attachedRecipe.dynamic!.summary!,
          title: 'Hotel Ardent focus',
          subtitle: 'Focused detail view'
        },
        normalizedData: {
          ...attachedRecipe.dynamic!.normalizedData!,
          datasets: attachedRecipe.dynamic!.normalizedData!.datasets.map((dataset) => ({
            ...dataset,
            items: dataset.items.filter((item) => item.id === 'hotel-ardent'),
            pageInfo: {
              pageSize: 1,
              totalItems: 1,
              hasMore: false
            }
          }))
        },
        uiSpec: {
          ...attachedRecipe.dynamic!.uiSpec!,
          header: {
            ...attachedRecipe.dynamic!.uiSpec!.header,
            title: 'Hotel Ardent focus',
            subtitle: 'Focused detail view'
          }
        }
      }
    });
    const sessionPayload = createSessionPayload(
      activeSession,
      [
        createMessage({
          id: 'dynamic-user-initial',
          sessionId: activeSession.id,
          role: 'user',
          content: 'Find the best boutique hotels in Dayton for a weekend stay.',
          createdAt: '2026-04-08T20:00:00.000Z',
          requestId: 'request-recipe-initial'
        }),
        createMessage({
          id: 'dynamic-assistant-initial',
          sessionId: activeSession.id,
          role: 'assistant',
          content: 'Here is a compact shortlist.',
          createdAt: '2026-04-08T20:00:01.000Z',
          requestId: 'request-recipe-initial'
        })
      ],
      'jbarton',
      [],
      {
        attachedRecipe
      }
    );
    const actionRequests: Array<Record<string, unknown>> = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              activeSessionId: activeSession.id,
              recentSessions: [activeSession],
              uiState: {
                activeProfileId: 'jbarton',
                currentPage: 'chat',
                activeSessionIdByProfile: {
                  jbarton: activeSession.id
                },
                recentSessionIdsByProfile: {
                  jbarton: [activeSession.id]
                },
                toolsTab: 'all'
              }
            })
          );
        }

        if (url === `/api/sessions/${activeSession.id}/messages?profileId=jbarton`) {
          return jsonResponse(sessionPayload);
        }

        if (url === `/api/recipes/${attachedRecipe.id}/actions/stream` && init?.method === 'POST') {
          actionRequests.push(JSON.parse(String(init.body ?? '{}')) as Record<string, unknown>);
          return delayedSseResponse([
            {
              type: 'message',
              message: {
                id: 'dynamic-user-live',
                sessionId: activeSession.id,
                role: 'user',
                content: 'Refine selection: Hotel Ardent',
                createdAt: '2026-04-08T20:05:00.000Z',
                status: 'completed',
                requestId: 'request-recipe-action-live',
                visibility: 'transcript',
                kind: 'conversation'
              }
            },
            {
              type: 'recipe_build_progress',
              recipeId: attachedRecipe.id,
              build: focusedSpace.dynamic!.activeBuild!,
              recipe: focusedSpace
            },
            {
              type: 'complete',
              session: {
                ...activeSession,
                messageCount: 4
              },
              assistantMessage: {
                id: 'dynamic-assistant-live',
                sessionId: activeSession.id,
                role: 'assistant',
                content: 'Focused the recipe on Hotel Ardent.',
                createdAt: '2026-04-08T20:05:01.000Z',
                status: 'completed',
                requestId: 'request-recipe-action-live',
                visibility: 'transcript',
                kind: 'conversation'
              }
            }
          ], 16);
        }

        return createDefaultAppFetchResponse(url);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    await screen.findByTestId('attached-recipe-panel');
    await userEvent.click(screen.getAllByRole('button', { name: 'Refine selection' })[0]!);

    await waitFor(() => {
      expect(actionRequests).toHaveLength(1);
    });
    expect(actionRequests[0]).toMatchObject({
      profileId: 'jbarton',
      sessionId: activeSession.id,
      actionId: 'refine-selection',
      selectedItemIds: ['hotel-ardent']
    });

    await waitFor(() => {
      expect(screen.getByTestId('session-recipe-content-scroll')).toHaveTextContent('Hotel Ardent focus');
      expect(screen.getByTestId('session-recipe-chat-pane')).toHaveTextContent('Focused the recipe on Hotel Ardent.');
    });
  });

  it('switches profiles without reopening the previous profile session transcript', async () => {
    const jbartonSession = createSession('jbarton-session', 'Jbarton inbox follow-up');
    const eightSession = {
      ...createSession('8tn-session', '8tn research session', '8tn'),
      lastUsedProfileId: '8tn',
      associatedProfileIds: ['8tn']
    };
    const bootstrap = createBootstrapResponse({
      profiles: [
        {
          id: 'jbarton',
          name: 'jbarton',
          description: 'openai/gpt-5.4 · gateway stopped',
          isActive: true
        },
        {
          id: '8tn',
          name: '8tn',
          description: 'openai/gpt-5.4 · gateway stopped',
          isActive: false
        }
      ],
      activeProfileId: 'jbarton',
      activeSessionId: jbartonSession.id,
      recentSessions: [jbartonSession],
      uiState: {
        activeProfileId: 'jbarton',
        currentPage: 'chat',
        activeSessionIdByProfile: {
          jbarton: jbartonSession.id,
          '8tn': eightSession.id
        },
        activeRecipeIdByProfile: {
          jbarton: null,
          '8tn': null
        },
        recentSessionIdsByProfile: {
          jbarton: [jbartonSession.id],
          '8tn': [eightSession.id]
        },
        toolsTab: 'all'
      }
    });
    const switchedBootstrap = {
      ...bootstrap,
      activeProfileId: '8tn',
      activeSessionId: eightSession.id,
      recentSessions: [eightSession],
      uiState: {
        ...bootstrap.uiState,
        activeProfileId: '8tn'
      }
    } satisfies BootstrapResponse;
    const jbartonSessionPayload = createSessionPayload(jbartonSession, [
      createMessage({
        id: 'jbarton-message-1',
        sessionId: jbartonSession.id,
        role: 'assistant',
        content: 'Jbarton transcript',
        createdAt: '2026-04-08T20:00:00.000Z',
        requestId: 'jbarton-request'
      })
    ]);
    const eightSessionPayload = createSessionPayload(
      eightSession,
      [
        createMessage({
          id: '8tn-message-1',
          sessionId: eightSession.id,
          role: 'assistant',
          content: '8tn transcript',
          createdAt: '2026-04-08T20:05:00.000Z',
          requestId: '8tn-request'
        })
      ],
      '8tn'
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(bootstrap);
        }

        if (url === `/api/sessions/${jbartonSession.id}/messages?profileId=jbarton`) {
          return jsonResponse(jbartonSessionPayload);
        }

        if (url.endsWith('/api/profiles/select') && init?.method === 'POST') {
          const body = JSON.parse(String(init.body ?? '{}')) as { profileId?: string };
          expect(body.profileId).toBe('8tn');
          return jsonResponse(switchedBootstrap);
        }

        if (url === `/api/sessions/${eightSession.id}/messages?profileId=8tn`) {
          return jsonResponse(eightSessionPayload);
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    expect(await screen.findByText('Jbarton transcript')).toBeInTheDocument();
    // Profile switching now uses the gear-icon ProfileBar drawer instead of a combobox
    await userEvent.click(screen.getByRole('button', { name: 'Manage profiles' }));
    await userEvent.click(screen.getByRole('button', { name: 'Use' }));

    expect(await screen.findByText('8tn transcript')).toBeInTheDocument();
    expect(screen.queryByText('Jbarton transcript')).not.toBeInTheDocument();
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
  });

  it('keeps runtime and tool output out of chat while showing typing and activity for unread-email requests', async () => {
    const activeSession = createSession('session-1', 'Unread inbox check');
    const bootstrap = createBootstrapResponse({
      activeSessionId: activeSession.id,
      recentSessions: [activeSession],
      uiState: {
        activeProfileId: 'jbarton',
        currentPage: 'chat',
        activeSessionIdByProfile: {
          jbarton: activeSession.id
        },
        activeRecipeIdByProfile: {
          jbarton: null
        },
        recentSessionIdsByProfile: {
          jbarton: [activeSession.id]
        },
        toolsTab: 'all'
      }
    });
    const sessionPayload = createSessionPayload(activeSession, [
      createMessage({
        id: 'message-1',
        sessionId: activeSession.id,
        role: 'user',
        content: 'Previous question',
        createdAt: '2026-04-08T19:00:00.000Z',
        requestId: 'request-old'
      }),
      createMessage({
        id: 'message-2',
        sessionId: activeSession.id,
        role: 'assistant',
        content: 'Previous answer',
        createdAt: '2026-04-08T19:00:01.000Z',
        requestId: 'request-old'
      }),
      createMessage({
        id: 'message-3',
        sessionId: activeSession.id,
        role: 'tool',
        content: '{"tool":"google-workspace","unread":1}',
        createdAt: '2026-04-08T19:00:01.500Z',
        requestId: 'request-old',
        visibility: 'runtime',
        kind: 'technical'
      }),
      createMessage({
        id: 'message-4',
        sessionId: activeSession.id,
        role: 'system',
        content: 'Bridge note: python scripts/check_mail.py --json',
        createdAt: '2026-04-08T19:00:01.650Z',
        requestId: 'request-old',
        visibility: 'transcript',
        kind: 'technical'
      }),
      createMessage({
        id: 'message-4b',
        sessionId: activeSession.id,
        role: 'system',
        content: '⚠️  Reached maximum iterations',
        createdAt: '2026-04-08T19:00:01.700Z',
        requestId: 'request-old',
        visibility: 'runtime',
        kind: 'technical'
      })
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(bootstrap);
        }

        if (url === `/api/sessions/${activeSession.id}/messages?profileId=jbarton`) {
          return jsonResponse(sessionPayload);
        }

        if (url.endsWith('/api/profiles/metrics')) {
          return jsonResponse({ metrics: [] });
        }

        if (url === '/api/chat/stream') {
          return delayedSseResponse([
            {
              type: 'progress',
              requestId: 'request-live',
              message: 'Hermes is typing…'
            },
            {
              type: 'activity',
              activity: {
                kind: 'skill',
                state: 'completed',
                label: 'google-workspace',
                detail: 'Scoped unread-email check finished.',
                requestId: 'request-live',
                timestamp: '2026-04-08T20:00:00.000Z'
              }
            },
            {
              type: 'message',
              message: {
                id: 'message-live-runtime',
                sessionId: activeSession.id,
                role: 'tool',
                content: '{"count":1,"labels":["Inbox"]}',
                createdAt: '2026-04-08T20:00:00.100Z',
                status: 'completed',
                requestId: 'request-live',
                visibility: 'runtime',
                kind: 'technical'
              }
            },
            {
              type: 'assistant_snapshot',
              requestId: 'request-live',
              markdown: 'You have 1 unread email in jbarton.'
            },
            {
              type: 'complete',
              session: {
                ...activeSession,
                messageCount: 4
              },
              assistantMessage: {
                id: 'message-5',
                sessionId: activeSession.id,
                role: 'assistant',
                content: 'You have 1 unread email in jbarton.',
                createdAt: '2026-04-08T20:00:01.000Z',
                status: 'completed',
                requestId: 'request-live',
                visibility: 'transcript',
                kind: 'conversation'
              }
            }
          ], 120);
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    expect((await screen.findAllByText('Unread inbox check summary')).length).toBeGreaterThan(0);
    const transcript = await screen.findByTestId('chat-transcript-scroll');
    const activityPane = screen.getByTestId('chat-activity-pane');

    expect(within(transcript).queryByText('{"tool":"google-workspace","unread":1}')).not.toBeInTheDocument();
    expect(within(transcript).queryByText('Bridge note: python scripts/check_mail.py --json')).not.toBeInTheDocument();
    expect(within(transcript).queryByText(/⚠️\s+Reached maximum iterations/)).not.toBeInTheDocument();
    expect(activityPane).toHaveTextContent('{"tool":"google-workspace","unread":1}');
    expect(activityPane).toHaveTextContent('Bridge note: python scripts/check_mail.py --json');
    expect(activityPane).toHaveTextContent(/⚠️\s+Reached maximum iterations/);

    await userEvent.type(screen.getByPlaceholderText('Ask Hermes something real.'), 'How many unread emails do I have?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(
      () => {
        // typing indicator may be in the ChatActivityFeed (display:none at base) or ChatTranscript
        const indicators = screen.queryAllByTestId('hermes-typing-indicator');
        expect(indicators.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
    expect(await within(activityPane).findByText('google-workspace', undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(await within(activityPane).findByText('{"count":1,"labels":["Inbox"]}', undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(within(transcript).queryByText('{"count":1,"labels":["Inbox"]}')).not.toBeInTheDocument();
    expect(await within(transcript).findByText('You have 1 unread email in jbarton.', undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(within(transcript).queryByText('google-workspace')).not.toBeInTheDocument();
  });

  it('focuses runtime activity from transcript clicks and resets to the newest request when a new one starts', async () => {
    const activeSession = createSession('session-focus', 'Runtime focus session');
    const bootstrap = createBootstrapResponse({
      activeSessionId: activeSession.id,
      recentSessions: [activeSession],
      uiState: {
        activeProfileId: 'jbarton',
        currentPage: 'chat',
        activeSessionIdByProfile: {
          jbarton: activeSession.id
        },
        activeRecipeIdByProfile: {
          jbarton: null
        },
        recentSessionIdsByProfile: {
          jbarton: [activeSession.id]
        },
        toolsTab: 'all'
      }
    });
    const sessionPayload = createSessionPayload(activeSession, [
      createMessage({
        id: 'request-1-user',
        sessionId: activeSession.id,
        role: 'user',
        content: 'Older request',
        createdAt: '2026-04-08T18:00:00.000Z',
        requestId: 'request-1'
      }),
      createMessage({
        id: 'request-1-assistant',
        sessionId: activeSession.id,
        role: 'assistant',
        content: 'Older answer',
        createdAt: '2026-04-08T18:00:01.000Z',
        requestId: 'request-1'
      }),
      createMessage({
        id: 'request-1-runtime',
        sessionId: activeSession.id,
        role: 'tool',
        content: 'old python trace',
        createdAt: '2026-04-08T18:00:01.100Z',
        requestId: 'request-1',
        visibility: 'runtime',
        kind: 'technical'
      }),
      createMessage({
        id: 'request-2-user',
        sessionId: activeSession.id,
        role: 'user',
        content: 'Newer request',
        createdAt: '2026-04-08T19:00:00.000Z',
        requestId: 'request-2'
      }),
      createMessage({
        id: 'request-2-assistant',
        sessionId: activeSession.id,
        role: 'assistant',
        content: 'Newer answer',
        createdAt: '2026-04-08T19:00:01.000Z',
        requestId: 'request-2'
      }),
      createMessage({
        id: 'request-2-runtime',
        sessionId: activeSession.id,
        role: 'tool',
        content: 'new cli trace',
        createdAt: '2026-04-08T19:00:01.100Z',
        requestId: 'request-2',
        visibility: 'runtime',
        kind: 'technical'
      })
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(bootstrap);
        }

        if (url === `/api/sessions/${activeSession.id}/messages?profileId=jbarton`) {
          return jsonResponse(sessionPayload);
        }

        if (url === '/api/chat/stream') {
          return delayedSseResponse([
            {
              type: 'message',
              message: {
                id: 'request-3-user',
                sessionId: activeSession.id,
                role: 'user',
                content: 'Newest request',
                createdAt: '2026-04-08T20:00:00.000Z',
                status: 'completed',
                requestId: 'request-3',
                visibility: 'transcript',
                kind: 'conversation'
              }
            },
            {
              type: 'activity',
              activity: {
                kind: 'command',
                state: 'started',
                label: 'python',
                command: 'python scripts/check_mail.py',
                requestId: 'request-3',
                timestamp: '2026-04-08T20:00:00.100Z'
              }
            },
            {
              type: 'complete',
              session: {
                ...activeSession,
                messageCount: 6
              },
              assistantMessage: {
                id: 'request-3-assistant',
                sessionId: activeSession.id,
                role: 'assistant',
                content: 'Newest answer',
                createdAt: '2026-04-08T20:00:01.000Z',
                status: 'completed',
                requestId: 'request-3',
                visibility: 'transcript',
                kind: 'conversation'
              }
            }
          ]);
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    const activityPane = await screen.findByTestId('chat-activity-pane');
    expect(activityPane).toHaveTextContent('new cli trace');
    expect(activityPane).not.toHaveTextContent('old python trace');

    await userEvent.click(await screen.findByText('Older answer'));
    expect(activityPane).toHaveTextContent('old python trace');
    expect(activityPane).not.toHaveTextContent('new cli trace');

    await userEvent.type(screen.getByPlaceholderText('Ask Hermes something real.'), 'Newest request');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(activityPane).toHaveTextContent('python scripts/check_mail.py');
    });
    expect(activityPane).not.toHaveTextContent('old python trace');
  });

  it('restores persisted runtime activity after revisiting a chat and lets older assistant replies refocus it', async () => {
    const activeSession = createSession('session-revisit', 'Audit trail session');
    let uiState = createUiState({
      activeProfileId: 'jbarton',
      currentPage: 'chat',
      activeSessionIdByProfile: {
        jbarton: activeSession.id
      },
      activeRecipeIdByProfile: {
        jbarton: null
      },
      recentSessionIdsByProfile: {
        jbarton: [activeSession.id]
      },
      toolsTab: 'all'
    });
    const sessionsResponse: SessionsResponse = {
      profileId: 'jbarton',
      items: [activeSession],
      page: 1,
      pageSize: 50,
      total: 1,
      hiddenSyntheticCount: 0,
      search: ''
    };
    const sessionPayload = createSessionPayload(
      activeSession,
      [
        createMessage({
          id: 'request-1-user',
          sessionId: activeSession.id,
          role: 'user',
          content: 'Older request',
          createdAt: '2026-04-08T18:00:00.000Z',
          requestId: 'request-1'
        }),
        createMessage({
          id: 'request-1-assistant',
          sessionId: activeSession.id,
          role: 'assistant',
          content: 'Older answer',
          createdAt: '2026-04-08T18:00:01.000Z',
          requestId: 'request-1'
        }),
        createMessage({
          id: 'request-2-user',
          sessionId: activeSession.id,
          role: 'user',
          content: 'Newer request',
          createdAt: '2026-04-08T19:00:00.000Z',
          requestId: 'request-2'
        }),
        createMessage({
          id: 'request-2-assistant',
          sessionId: activeSession.id,
          role: 'assistant',
          content: 'Newer answer',
          createdAt: '2026-04-08T19:00:01.000Z',
          requestId: 'request-2'
        })
      ],
      'jbarton',
      [
        createRuntimeRequest('request-1', activeSession.id, 'Older request', {
          messageIds: ['request-1-user', 'request-1-assistant'],
          activities: [
            {
              kind: 'command',
              state: 'completed',
              label: 'python',
              command: 'python scripts/check_mail.py --json',
              requestId: 'request-1',
              timestamp: '2026-04-08T18:00:01.100Z'
            }
          ],
          startedAt: '2026-04-08T18:00:00.000Z',
          updatedAt: '2026-04-08T18:00:01.100Z'
        }),
        createRuntimeRequest('request-2', activeSession.id, 'Newer request', {
          messageIds: ['request-2-user', 'request-2-assistant'],
          activities: [
            {
              kind: 'tool',
              state: 'completed',
              label: 'google-workspace',
              detail: 'new cli trace',
              requestId: 'request-2',
              timestamp: '2026-04-08T19:00:01.100Z'
            }
          ],
          startedAt: '2026-04-08T19:00:00.000Z',
          updatedAt: '2026-04-08T19:00:01.100Z'
        })
      ]
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              activeSessionId: activeSession.id,
              recentSessions: [activeSession],
              uiState
            })
          );
        }

        if (url.endsWith('/api/ui-state') && init?.method === 'PUT') {
          const partial = JSON.parse(String(init.body ?? '{}')) as Partial<UiState>;
          uiState = {
            ...uiState,
            ...partial,
            activeSessionIdByProfile: {
              ...uiState.activeSessionIdByProfile,
              ...(partial.activeSessionIdByProfile ?? {})
            },
            recentSessionIdsByProfile: {
              ...uiState.recentSessionIdsByProfile,
              ...(partial.recentSessionIdsByProfile ?? {})
            }
          };
          return jsonResponse(uiState);
        }

        if (url === '/api/sessions/select' && init?.method === 'POST') {
          return jsonResponse(activeSession);
        }

        if (url.includes('/api/sessions?profileId=jbarton')) {
          return jsonResponse(sessionsResponse);
        }

        if (url === `/api/sessions/${activeSession.id}/messages?profileId=jbarton`) {
          return jsonResponse(sessionPayload);
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    const activityPane = await screen.findByTestId('chat-activity-pane');
    expect(activityPane).toHaveTextContent('new cli trace');
    expect(activityPane).not.toHaveTextContent('python scripts/check_mail.py --json');

    await userEvent.click(screen.getByText('Older answer'));
    expect(activityPane).toHaveTextContent('python scripts/check_mail.py --json');
    expect(activityPane).not.toHaveTextContent('new cli trace');

    await userEvent.click(screen.getByRole('button', { name: 'All sessions' }));
    await within(screen.getByTestId('sessions-table-scroll')).findByText('Audit trail session');
    await userEvent.click(screen.getByRole('cell', { name: 'Audit trail session' }));

    expect(await screen.findByText('Newer answer')).toBeInTheDocument();
    const restoredActivityPane = screen.getByTestId('chat-activity-pane');
    expect(restoredActivityPane).toHaveTextContent('python scripts/check_mail.py --json');
    expect(restoredActivityPane).not.toHaveTextContent('new cli trace');

    await userEvent.click(screen.getByText('Newer answer'));
    expect(restoredActivityPane).toHaveTextContent('new cli trace');
    expect(restoredActivityPane).not.toHaveTextContent('python scripts/check_mail.py --json');

    await userEvent.click(screen.getByText('Older answer'));
    expect(restoredActivityPane).toHaveTextContent('python scripts/check_mail.py --json');
  });

  it('resolves running runtime status rows when the active request completes', async () => {
    const activeSession = createSession('session-finalize', 'Runtime finalization session');
    const bootstrap = createBootstrapResponse({
      activeSessionId: activeSession.id,
      recentSessions: [activeSession],
      uiState: {
        activeProfileId: 'jbarton',
        currentPage: 'chat',
        activeSessionIdByProfile: {
          jbarton: activeSession.id
        },
        activeRecipeIdByProfile: {
          jbarton: null
        },
        recentSessionIdsByProfile: {
          jbarton: [activeSession.id]
        },
        toolsTab: 'all'
      }
    });
    const sessionPayload = createSessionPayload(activeSession, [
      createMessage({
        id: 'message-existing-user',
        sessionId: activeSession.id,
        role: 'user',
        content: 'Earlier request',
        createdAt: '2026-04-08T18:00:00.000Z',
        requestId: 'request-existing'
      }),
      createMessage({
        id: 'message-existing-assistant',
        sessionId: activeSession.id,
        role: 'assistant',
        content: 'Earlier answer',
        createdAt: '2026-04-08T18:00:01.000Z',
        requestId: 'request-existing'
      })
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(bootstrap);
        }

        if (url === `/api/sessions/${activeSession.id}/messages?profileId=jbarton`) {
          return jsonResponse(sessionPayload);
        }

        if (url === '/api/chat/stream') {
          return delayedSseResponse([
            {
              type: 'message',
              message: {
                id: 'request-live-user',
                sessionId: activeSession.id,
                role: 'user',
                content: 'Check inbox now',
                createdAt: '2026-04-08T20:00:00.000Z',
                status: 'completed',
                requestId: 'request-live',
                visibility: 'transcript',
                kind: 'conversation'
              }
            },
            {
              type: 'progress',
              requestId: 'request-live',
              message: 'Checking inbox…'
            },
            {
              type: 'complete',
              session: {
                ...activeSession,
                messageCount: 4
              },
              assistantMessage: {
                id: 'request-live-assistant',
                sessionId: activeSession.id,
                role: 'assistant',
                content: 'You have 2 unread emails right now.',
                createdAt: '2026-04-08T20:00:01.000Z',
                status: 'completed',
                requestId: 'request-live',
                visibility: 'transcript',
                kind: 'conversation'
              }
            }
          ]);
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    await screen.findByText('Earlier answer');
    await userEvent.type(screen.getByPlaceholderText('Ask Hermes something real.'), 'Check inbox now');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    const activityPane = await screen.findByTestId('chat-activity-pane');
    expect(await within(activityPane).findByText('Hermes completed the active request.')).toBeInTheDocument();
    expect(activityPane).not.toHaveTextContent('Checking inbox…');
    expect(activityPane).toHaveTextContent('completed');
    expect(activityPane).not.toHaveTextContent('running');
  });

  it('finalizes started terminal activity rows when the request completes without an explicit command-finished event', async () => {
    const activeSession = createSession('session-cli-finalize', 'CLI finalization session');
    const bootstrap = createBootstrapResponse({
      activeSessionId: activeSession.id,
      recentSessions: [activeSession],
      uiState: {
        activeProfileId: 'jbarton',
        currentPage: 'chat',
        activeSessionIdByProfile: {
          jbarton: activeSession.id
        },
        activeRecipeIdByProfile: {
          jbarton: null
        },
        recentSessionIdsByProfile: {
          jbarton: [activeSession.id]
        },
        toolsTab: 'all'
      }
    });
    const sessionPayload = createSessionPayload(activeSession, []);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(bootstrap);
        }

        if (url === `/api/sessions/${activeSession.id}/messages?profileId=jbarton`) {
          return jsonResponse(sessionPayload);
        }

        if (url === '/api/chat/stream') {
          return delayedSseResponse([
            {
              type: 'message',
              message: {
                id: 'request-cli-user',
                sessionId: activeSession.id,
                role: 'user',
                content: 'Run the inbox check',
                createdAt: '2026-04-08T20:10:00.000Z',
                status: 'completed',
                requestId: 'request-cli',
                visibility: 'transcript',
                kind: 'conversation'
              }
            },
            {
              type: 'activity',
              activity: {
                kind: 'command',
                state: 'started',
                label: 'python',
                command: 'python scripts/check_mail.py --json',
                requestId: 'request-cli',
                timestamp: '2026-04-08T20:10:00.100Z'
              }
            },
            {
              type: 'complete',
              session: {
                ...activeSession,
                messageCount: 2
              },
              assistantMessage: {
                id: 'request-cli-assistant',
                sessionId: activeSession.id,
                role: 'assistant',
                content: 'The inbox check completed.',
                createdAt: '2026-04-08T20:10:01.000Z',
                status: 'completed',
                requestId: 'request-cli',
                visibility: 'transcript',
                kind: 'conversation'
              }
            }
          ]);
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    const composerInput = await screen.findByPlaceholderText('Ask Hermes something real.');
    await waitFor(() => {
      expect(composerInput).not.toBeDisabled();
    });
    await userEvent.type(composerInput, 'Run the inbox check');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('The inbox check completed.')).toBeInTheDocument();
    const activityPane = await screen.findByTestId('chat-activity-pane');
    await waitFor(() => {
      expect(activityPane).toHaveTextContent('python scripts/check_mail.py --json');
    });
    expect(activityPane).toHaveTextContent('completed');
    expect(activityPane).not.toHaveTextContent('started');
    expect(activityPane).not.toHaveTextContent('running');
  });

  it('renames the active session directly from the recent sessions sidebar actions menu', async () => {
    let activeSession = createSession('session-recent-rename', 'Initial title');
    const sessionPayload = createSessionPayload(activeSession, [
      createMessage({
        id: 'message-user-1',
        sessionId: activeSession.id,
        role: 'user',
        content: 'Keep this session open.',
        createdAt: '2026-04-08T20:00:00.000Z',
        requestId: 'request-1'
      }),
      createMessage({
        id: 'message-assistant-1',
        sessionId: activeSession.id,
        role: 'assistant',
        content: 'Session loaded.',
        createdAt: '2026-04-08T20:00:01.000Z',
        requestId: 'request-1'
      })
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              activeSessionId: activeSession.id,
              recentSessions: [activeSession],
              uiState: {
                activeProfileId: 'jbarton',
                currentPage: 'chat',
                activeSessionIdByProfile: {
                  jbarton: activeSession.id
                },
                activeRecipeIdByProfile: {
                  jbarton: null
                },
                recentSessionIdsByProfile: {
                  jbarton: [activeSession.id]
                },
                toolsTab: 'all'
              }
            })
          );
        }

        if (url === `/api/sessions/${activeSession.id}/messages?profileId=jbarton`) {
          return jsonResponse({
            ...sessionPayload,
            session: activeSession
          });
        }

        if (url === `/api/sessions/${activeSession.id}/rename` && init?.method === 'POST') {
          const body = JSON.parse(String(init.body ?? '{}')) as { title?: string };
          activeSession = {
            ...activeSession,
            title: body.title ?? activeSession.title
          };
          return jsonResponse(activeSession);
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    await screen.findByText('Session loaded.');
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Initial title' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    expect(await screen.findByText('Rename session')).toBeInTheDocument();

    const titleInput = screen.getByLabelText('Session title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Renamed from recent');
    await userEvent.click(screen.getByRole('button', { name: 'Save title' }));

    expect(await within(screen.getByTestId('sidebar-scroll')).findByText('Renamed from recent')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for Renamed from recent' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Renamed from recent' }));
    expect(await screen.findByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
  });

  it('renames the active session from the chat header actions menu', async () => {
    let activeSession = createSession('session-chat-rename', 'Chat title');
    const sessionPayload = createSessionPayload(activeSession, [
      createMessage({
        id: 'message-user-chat-1',
        sessionId: activeSession.id,
        role: 'user',
        content: 'Keep this session open.',
        createdAt: '2026-04-08T20:00:00.000Z',
        requestId: 'request-chat-1'
      }),
      createMessage({
        id: 'message-assistant-chat-1',
        sessionId: activeSession.id,
        role: 'assistant',
        content: 'Chat session ready.',
        createdAt: '2026-04-08T20:00:01.000Z',
        requestId: 'request-chat-1'
      })
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              activeSessionId: activeSession.id,
              recentSessions: [activeSession],
              uiState: {
                activeProfileId: 'jbarton',
                currentPage: 'chat',
                activeSessionIdByProfile: {
                  jbarton: activeSession.id
                },
                activeRecipeIdByProfile: {
                  jbarton: null
                },
                recentSessionIdsByProfile: {
                  jbarton: [activeSession.id]
                },
                toolsTab: 'all'
              }
            })
          );
        }

        if (url === `/api/sessions/${activeSession.id}/messages?profileId=jbarton`) {
          return jsonResponse({
            ...sessionPayload,
            session: activeSession
          });
        }

        if (url === `/api/sessions/${activeSession.id}/rename` && init?.method === 'POST') {
          const body = JSON.parse(String(init.body ?? '{}')) as { title?: string };
          activeSession = {
            ...activeSession,
            title: body.title ?? activeSession.title
          };
          return jsonResponse(activeSession);
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    await screen.findByText('Chat session ready.');
    await userEvent.click(screen.getByRole('button', { name: 'Chat actions for Chat title' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    expect(await screen.findByText('Rename session')).toBeInTheDocument();

    const titleInput = screen.getByLabelText('Session title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Chat title renamed');
    await userEvent.click(screen.getByRole('button', { name: 'Save title' }));

    expect(screen.getByRole('button', { name: 'Chat actions for Chat title renamed' })).toBeInTheDocument();
    expect(within(screen.getByTestId('sidebar-scroll')).getByText('Chat title renamed')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Chat actions for Chat title renamed' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Chat actions for Chat title renamed' }));
    expect(await screen.findByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });

  it('renames and deletes sessions through explicit UI dialogs', async () => {
    const sessionOne = createSession('session-1', 'Initial title');
    const sessionTwo = createSession('session-2', 'Another title');
    let sessionsItems = [sessionOne, sessionTwo];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              recentSessions: sessionsItems,
              sessionSummary: {
                profileId: 'jbarton',
                visibleCount: sessionsItems.length,
                hiddenSyntheticCount: 0,
                recentCount: sessionsItems.length
              }
            })
          );
        }

        if (url.endsWith('/api/ui-state') && init?.method === 'PUT') {
          return jsonResponse(
            createUiState({
            activeProfileId: 'jbarton',
            currentPage: 'sessions',
            activeSessionIdByProfile: {
              jbarton: null
            },
            activeRecipeIdByProfile: {},
            recentSessionIdsByProfile: {
              jbarton: sessionsItems.map((session) => session.id)
            },
            toolsTab: 'all'
            })
          );
        }

        if (url.includes('/api/sessions?profileId=jbarton')) {
          return jsonResponse({
            profileId: 'jbarton',
            items: sessionsItems,
            page: 1,
            pageSize: 50,
            total: sessionsItems.length,
            hiddenSyntheticCount: 0,
            search: ''
          } satisfies SessionsResponse);
        }

        if (url === '/api/sessions/session-1/rename' && init?.method === 'POST') {
          const body = JSON.parse(String(init.body ?? '{}')) as { title?: string };
          sessionsItems = sessionsItems.map((session) => (session.id === 'session-1' ? { ...session, title: body.title ?? session.title } : session));
          return jsonResponse(sessionsItems[0]);
        }

        if (url === '/api/sessions/session-1/delete' && init?.method === 'POST') {
          sessionsItems = sessionsItems.filter((session) => session.id !== 'session-1');
          return jsonResponse({
            sessionId: 'session-1',
            mode: 'hybrid',
            deletedAt: '2026-04-08T20:10:00.000Z'
          });
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    await screen.findByText('Choose a recent session or start a new one.');
    await userEvent.click(screen.getByRole('button', { name: 'All sessions' }));
    const sessionsTable = screen.getByTestId('sessions-table-scroll');
    await within(sessionsTable).findByText('Initial title');
    expect(within(screen.getByTestId('sidebar-scroll')).getByRole('button', { name: 'Actions for Initial title' })).toBeInTheDocument();

    const initialRow = within(sessionsTable).getByText('Initial title').closest('tr');
    expect(initialRow).toBeTruthy();
    await userEvent.click(within(initialRow as HTMLTableRowElement).getByRole('button', { name: 'Actions for Initial title' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    expect(await screen.findByText('Rename session')).toBeInTheDocument();

    const titleInput = screen.getByLabelText('Session title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Renamed title');
    await userEvent.click(screen.getByRole('button', { name: 'Save title' }));

    expect(await within(sessionsTable).findByText('Renamed title')).toBeInTheDocument();

    const renamedRow = within(sessionsTable).getByText('Renamed title').closest('tr');
    expect(renamedRow).toBeTruthy();
    await userEvent.click(within(renamedRow as HTMLTableRowElement).getByRole('button', { name: 'Actions for Renamed title' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(await screen.findByRole('heading', { name: 'Delete session' })).toBeInTheDocument();
    expect(screen.getByText(/removed there too/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete session' }));

    expect(await within(sessionsTable).findByText('Another title')).toBeInTheDocument();
    expect(within(sessionsTable).queryByText('Renamed title')).not.toBeInTheDocument();
    expect(await screen.findByText('Session deleted')).toBeInTheDocument();
  });

  it('keeps the page interactive after deleting a session from the sessions table', async () => {
    const sessionOne = createSession('session-blocked-1', 'Delete me first');
    const sessionTwo = createSession('session-blocked-2', 'Still clickable');
    let sessionsItems = [sessionOne, sessionTwo];
    let uiState = createUiState({
      activeProfileId: 'jbarton',
      currentPage: 'sessions',
      activeSessionIdByProfile: {
        jbarton: null
      },
      recentSessionIdsByProfile: {
        jbarton: sessionsItems.map((session) => session.id)
      },
      toolsTab: 'all'
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(
            createBootstrapResponse({
              recentSessions: sessionsItems,
              sessionSummary: {
                profileId: 'jbarton',
                visibleCount: sessionsItems.length,
                hiddenSyntheticCount: 0,
                recentCount: sessionsItems.length
              },
              uiState
            })
          );
        }

        if (url.endsWith('/api/ui-state') && init?.method === 'PUT') {
          const partial = JSON.parse(String(init.body ?? '{}')) as Partial<UiState>;
          uiState = {
            ...uiState,
            ...partial,
            activeSessionIdByProfile: {
              ...uiState.activeSessionIdByProfile,
              ...(partial.activeSessionIdByProfile ?? {})
            },
            recentSessionIdsByProfile: {
              ...uiState.recentSessionIdsByProfile,
              ...(partial.recentSessionIdsByProfile ?? {})
            }
          };

          return jsonResponse(uiState);
        }

        if (url.includes('/api/sessions?profileId=jbarton')) {
          return jsonResponse({
            profileId: 'jbarton',
            items: sessionsItems,
            page: 1,
            pageSize: 50,
            total: sessionsItems.length,
            hiddenSyntheticCount: 0,
            search: ''
          } satisfies SessionsResponse);
        }

        if (url === '/api/sessions/session-blocked-1/delete' && init?.method === 'POST') {
          sessionsItems = sessionsItems.filter((session) => session.id !== 'session-blocked-1');
          return jsonResponse({
            sessionId: 'session-blocked-1',
            mode: 'hybrid',
            deletedAt: '2026-04-08T20:25:00.000Z'
          });
        }

        return createDefaultAppFetchResponse(url);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    const sessionsTable = await screen.findByTestId('sessions-table-scroll');
    const deleteRow = within(sessionsTable).getByText('Delete me first').closest('tr');
    expect(deleteRow).toBeTruthy();

    await userEvent.click(within(deleteRow as HTMLTableRowElement).getByRole('button', { name: 'Actions for Delete me first' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(await screen.findByRole('heading', { name: 'Delete session' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete session' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Delete session' })).not.toBeInTheDocument();
      expect(screen.queryByText('Delete me first')).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(await screen.findByText('Local preferences')).toBeInTheDocument();
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
  });

  it('returns to the previous sessions page after deleting the last visible row on a later page', async () => {
    const pageOneSession = createSession('session-1', 'Page one title');
    const pageTwoSession = createSession('session-2', 'Page two title');
    let sessionsItems = [pageOneSession, pageTwoSession];

    const buildSessionsPage = (page: number): SessionsResponse => ({
      profileId: 'jbarton',
      items: sessionsItems.slice((page - 1) * 1, page * 1),
      page,
      pageSize: 1,
      total: sessionsItems.length,
      hiddenSyntheticCount: 0,
      search: ''
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);
        const parsed = new URL(url, 'http://localhost');

        if (parsed.pathname === '/api/bootstrap') {
          return jsonResponse(
            createBootstrapResponse({
              uiState: {
                currentPage: 'sessions',
                activeSessionIdByProfile: {
                  jbarton: null
                },
                recentSessionIdsByProfile: {
                  jbarton: sessionsItems.map((session) => session.id)
                }
              },
              recentSessions: sessionsItems,
              sessionSummary: {
                profileId: 'jbarton',
                visibleCount: sessionsItems.length,
                hiddenSyntheticCount: 0,
                recentCount: sessionsItems.length
              }
            })
          );
        }

        if (parsed.pathname === '/api/sessions' && parsed.searchParams.get('profileId') === 'jbarton') {
          const requestedPage = Number(parsed.searchParams.get('page') ?? '1');
          return jsonResponse(buildSessionsPage(requestedPage));
        }

        if (parsed.pathname === '/api/sessions/session-2/delete' && init?.method === 'POST') {
          sessionsItems = sessionsItems.filter((session) => session.id !== 'session-2');
          return jsonResponse({
            sessionId: 'session-2',
            mode: 'hybrid',
            deletedAt: '2026-04-08T20:10:00.000Z'
          });
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    const sessionsTable = await screen.findByTestId('sessions-table-scroll');
    await within(sessionsTable).findByText('Page one title');

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    const pageTwoTable = await screen.findByTestId('sessions-table-scroll');
    expect(await within(pageTwoTable).findByText('Page two title')).toBeInTheDocument();
    expect(screen.getByText('Page 2')).toBeInTheDocument();

    const pageTwoRow = within(pageTwoTable).getByText('Page two title').closest('tr');
    expect(pageTwoRow).toBeTruthy();

    await userEvent.click(within(pageTwoRow as HTMLTableRowElement).getByRole('button', { name: 'Actions for Page two title' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete session' }));

    const pageOneTable = await screen.findByTestId('sessions-table-scroll');
    expect(await within(pageOneTable).findByText('Page one title')).toBeInTheDocument();
    expect(within(pageOneTable).queryByText('Page two title')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });

  it('deletes a skill through the permanent warning flow and removes it immediately from the UI', async () => {
    const projectNotesSkill: Skill = {
      id: 'jbarton:project-notes',
      profileId: 'jbarton',
      name: 'project-notes',
      summary: 'project notes, recipe context',
      category: 'recipe',
      source: 'hub',
      trust: 'verified',
      lastSyncedAt: '2026-04-08T20:00:00.000Z'
    };

    let skills: Skill[] = [
      {
        id: 'jbarton:google-workspace',
        profileId: 'jbarton',
        name: 'google-workspace',
        summary: 'gmail, calendar, docs',
        category: 'productivity',
        source: 'builtin',
        trust: 'builtin',
        lastSyncedAt: '2026-04-08T20:00:00.000Z'
      },
      projectNotesSkill
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = String(input);

        if (url.endsWith('/api/bootstrap')) {
          return jsonResponse(createBootstrapResponse());
        }

        if (url.endsWith('/api/ui-state') && init?.method === 'PUT') {
          return jsonResponse(
            createUiState({
            activeProfileId: 'jbarton',
            currentPage: 'skills',
            activeSessionIdByProfile: {},
            activeRecipeIdByProfile: {},
            recentSessionIdsByProfile: {},
            toolsTab: 'all'
            })
          );
        }

        if (url === '/api/skills?profileId=jbarton') {
          return jsonResponse({
            connection: {
              status: 'connected',
              checkedAt: '2026-04-08T20:00:00.000Z',
              usingCachedData: false
            },
            profileId: 'jbarton',
            items: skills
          } satisfies SkillsResponse);
        }

        if (url === '/api/skills/jbarton%3Aproject-notes/delete' && init?.method === 'POST') {
          skills = skills.filter((skill) => skill.id !== projectNotesSkill.id);
          return jsonResponse({
            profileId: 'jbarton',
            skillId: projectNotesSkill.id,
            skillName: projectNotesSkill.name,
            deletedAt: '2026-04-08T20:05:00.000Z'
          });
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    );

    await screen.findByText('Choose a recent session or start a new one.');
    await userEvent.click(screen.getByRole('button', { name: 'Skills' }));
    await screen.findByText('project-notes');
    expect(screen.getByText('project notes, recipe context')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Actions for project-notes' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(await screen.findByRole('heading', { name: 'Delete skill' })).toBeInTheDocument();
    expect(screen.getByText(/permanent and cannot be undone/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete skill' }));

    expect(await screen.findByText('google-workspace')).toBeInTheDocument();
    expect(screen.queryByText('project-notes')).not.toBeInTheDocument();
    expect(screen.queryByText('project notes, recipe context')).not.toBeInTheDocument();
  });
});
