import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AuditEventsResponse,
  AppPage,
  AppSettings,
  BootstrapResponse,
  ChatActivity,
  ChatStreamEvent,
  ChatRequestMode,
  ChatMessage,
  ModelProviderResponse,
  RuntimeRequest,
  Session,
  Recipe,
  Skill,
  SessionMessagesResponse,
  SessionsResponse,
  SettingsResponse,
  SkillsResponse,
  ToolHistoryResponse,
  ToolsResponse,
  ToolsTab,
  UiState,
  UpdateRecipeRequest,
  UpdateRuntimeModelConfigRequest
} from '@hermes-recipes/protocol';
import { RECIPE_REFRESH_USER_MESSAGE } from '@hermes-recipes/protocol';
import {
  applyRecipeEntryAction,
  getAuditEvents,
  beginProviderAuth,
  connectProvider,
  createSession,
  deleteRecipe,
  deleteSession,
  deleteSkill,
  getBootstrap,
  getJobs,
  getModelProviders,
  getSessionMessages,
  getSettings,
  getSkills,
  getTelemetry,
  getToolHistory,
  getTools,
  listSessions,
  pollProviderAuth,
  renameSession,
  selectProfile,
  selectSession,
  streamChat,
  streamRecipeAction,
  updateRecipe,
  updateRuntimeModelConfig,
  updateSettings,
  updateUiState
} from '../lib/api';
import { toaster } from '../ui/toaster-store';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function appendRecentSession(currentRecentSessions: Session[], session: Session, preserveOrder = false) {
  if (preserveOrder && currentRecentSessions.some((item) => item.id === session.id)) {
    return currentRecentSessions.map((item) => (item.id === session.id ? session : item));
  }
  const deduped = currentRecentSessions.filter((item) => item.id !== session.id);
  return [session, ...deduped].slice(0, 5);
}

function appendRecipeEvent(events: SessionMessagesResponse['recipeEvents'], event: SessionMessagesResponse['recipeEvents'][number]) {
  const deduped = events.filter((item) => item.id !== event.id);
  return [event, ...deduped].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 50);
}

function mergeRecipeEvents(
  currentEvents: SessionMessagesResponse['recipeEvents'],
  nextEvents: SessionMessagesResponse['recipeEvents']
) {
  return nextEvents.reduce((events, event) => appendRecipeEvent(events, event), currentEvents);
}

function defaultToastError(message: string) {
  toaster.error({
    title: 'Action failed',
    description: message,
    closable: true
  });
}

function getSessionsPageAfterDeletion(response: SessionsResponse | null, deletedSessionId: string) {
  if (!response) {
    return 1;
  }

  const deletedSessionWasVisible = response.items.some((session) => session.id === deletedSessionId);
  if (!deletedSessionWasVisible) {
    return response.page;
  }

  const remainingVisibleCount = response.items.length - 1;
  if (remainingVisibleCount > 0) {
    return response.page;
  }

  const remainingTotal = Math.max(0, response.total - 1);
  if (remainingTotal === 0) {
    return 1;
  }

  const lastValidPage = Math.max(1, Math.ceil(remainingTotal / Math.max(1, response.pageSize)));
  return Math.min(response.page, lastValidPage);
}

export interface ActivityRequestBucket {
  requestId: string;
  preview: string;
  messageIds: string[];
  activities: ChatActivity[];
  status: RuntimeRequest['status'];
  startedAt: string;
  updatedAt: string;
}

export interface RuntimeConfigGate {
  status: 'checking' | 'ready' | 'blocked';
  code: string;
  message: string;
  providerId: string | null;
  modelId: string | null;
}

const STARTUP_RUNTIME_DISCOVERY_RETRY_DELAYS_MS = [0, 250, 750, 1_500, 3_000] as const;

function isFinalActivityState(state: ChatActivity['state']) {
  return state === 'completed' || state === 'failed' || state === 'cancelled' || state === 'denied';
}

function activityGroupKey(activity: Pick<ChatActivity, 'kind' | 'label' | 'command'>) {
  return `${activity.kind}:${activity.label}:${activity.command ?? ''}`;
}

function mergeChatActivity(currentActivities: ChatActivity[], activity: ChatActivity) {
  const duplicate = currentActivities.some(
    (item) =>
      item.kind === activity.kind &&
      item.state === activity.state &&
      item.label === activity.label &&
      item.detail === activity.detail &&
      item.command === activity.command &&
      item.requestId === activity.requestId
  );

  if (duplicate) {
    return currentActivities;
  }

  const unresolvedIndex = currentActivities.findIndex(
    (item) => activityGroupKey(item) === activityGroupKey(activity) && !isFinalActivityState(item.state)
  );
  if (unresolvedIndex >= 0) {
    const nextActivities = [...currentActivities];
    nextActivities[unresolvedIndex] = activity;
    return nextActivities.slice(-24);
  }

  return [...currentActivities, activity].slice(-24);
}

function appendUniqueMessage(messages: ChatMessage[], message: ChatMessage) {
  if (messages.some((item) => item.id === message.id)) {
    return messages;
  }

  return [...messages, message];
}

function getMessageRequestId(message: ChatMessage) {
  return message.requestId ?? (message.role === 'user' ? message.id : null);
}

function sanitizeUserFacingErrorMessage(message: string) {
  void message;
  return 'Hermes ran into an issue. Check the logs for more information.';
}

function deriveProgressMessageFromActivity(activity: ChatActivity) {
  if (activity.kind === 'status') {
    return activity.detail ?? activity.label;
  }

  if (activity.kind === 'command') {
    if (activity.state === 'failed') {
      return activity.detail ?? 'Hermes hit a terminal issue.';
    }

    return activity.state === 'started' ? 'Hermes is using the terminal…' : 'Hermes finished in the terminal.';
  }

  if (activity.kind === 'skill') {
    if (activity.state === 'failed') {
      return activity.detail ?? `Hermes could not use the ${activity.label} skill.`;
    }

    return activity.state === 'started'
      ? `Hermes is using the ${activity.label} skill…`
      : `Hermes finished using the ${activity.label} skill.`;
  }

  if (activity.kind === 'tool') {
    const label = activity.label.toLowerCase();
    const detail = activity.detail?.trim();
    if (activity.state === 'failed') {
      return detail ?? `${activity.label} failed.`;
    }
    if (/\b(search|find|lookup|nearby|restaurant|hotel|maps|web|browse|google)\b/u.test(label)) {
      if (activity.state === 'started') {
        return detail ? `Searching: ${detail}` : `Hermes is searching with ${activity.label}…`;
      }
      return detail ? `Found: ${detail}` : 'Hermes finished searching.';
    }
    if (/\b(read|inspect|list|open|read_file)\b/u.test(label)) {
      return activity.state === 'started'
        ? (detail ? `Reading: ${detail}` : 'Hermes is inspecting local files…')
        : 'Hermes finished inspecting local files.';
    }

    if (activity.state === 'started') {
      return detail ? `${activity.label}: ${detail}` : `Hermes is using ${activity.label}…`;
    }
    return detail ? `${activity.label}: ${detail}` : `Hermes used ${activity.label}.`;
  }

  if (activity.kind === 'approval') {
    return activity.state === 'denied' ? 'A Hermes command approval was denied.' : 'Hermes is waiting for command approval.';
  }

  if (activity.kind === 'warning') {
    return activity.detail ?? activity.label;
  }

  return null;
}

function deriveRuntimeMessageActivity(message: ChatMessage): ChatActivity | null {
  if (message.visibility !== 'runtime' && message.kind !== 'technical') {
    return null;
  }

  if (message.role === 'tool') {
    return {
      kind: 'tool',
      state: message.status === 'error' ? 'failed' : 'completed',
      label: 'Runtime tool output',
      detail: message.content,
      requestId: getMessageRequestId(message),
      timestamp: message.createdAt
    };
  }

  if (message.kind === 'technical') {
    return {
      kind: message.status === 'error' ? 'warning' : 'status',
      state: message.status === 'error' ? 'failed' : 'completed',
      label: message.status === 'error' ? 'Technical diagnostic' : 'Technical note',
      detail: message.content,
      requestId: getMessageRequestId(message),
      timestamp: message.createdAt
    };
  }

  return {
    kind: message.status === 'error' ? 'warning' : 'status',
    state: message.status === 'error' ? 'failed' : 'completed',
    label: message.status === 'error' ? 'Runtime diagnostic' : 'Runtime note',
    detail: message.content,
    requestId: getMessageRequestId(message),
    timestamp: message.createdAt
  };
}

function statusFromActivityState(
  currentStatus: ActivityRequestBucket['status'] | undefined,
  activityState: ChatActivity['state']
): ActivityRequestBucket['status'] {
  if (activityState === 'failed') {
    return 'failed';
  }
  if (activityState === 'denied') {
    return 'denied';
  }
  if (activityState === 'cancelled') {
    return 'cancelled';
  }
  if (currentStatus === 'failed' || currentStatus === 'denied' || currentStatus === 'cancelled' || currentStatus === 'completed') {
    return currentStatus;
  }
  return 'running';
}

function activityStateFromRequestStatus(status: RuntimeRequest['status']): ChatActivity['state'] {
  switch (status) {
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    case 'denied':
      return 'denied';
    case 'completed':
    case 'idle':
    case 'running':
    default:
      return 'completed';
  }
}

function finalizeChatActivities(currentActivities: ChatActivity[], status: RuntimeRequest['status'], timestamp: string) {
  const fallbackState = activityStateFromRequestStatus(status);
  return currentActivities.map((activity) =>
    isFinalActivityState(activity.state)
      ? activity
      : {
          ...activity,
          state: fallbackState,
          timestamp
        }
  );
}

function upsertActivityRequestBucket(
  buckets: ActivityRequestBucket[],
  requestId: string,
  update: (current: ActivityRequestBucket | null) => ActivityRequestBucket
) {
  const currentBucket = buckets.find((bucket) => bucket.requestId === requestId) ?? null;
  const nextBucket = update(currentBucket);
  const remainingBuckets = buckets.filter((bucket) => bucket.requestId !== requestId);
  return [...remainingBuckets, nextBucket].sort((left, right) => left.startedAt.localeCompare(right.startedAt));
}

function seedActivityRequestsFromMessages(messages: ChatMessage[]) {
  const buckets = new Map<string, ActivityRequestBucket>();
  const orderedMessages = [...messages].sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  for (const message of orderedMessages) {
    const requestId = getMessageRequestId(message);
    if (!requestId) {
      continue;
    }

    const existingBucket = buckets.get(requestId) ?? {
      requestId,
      preview: message.role === 'user' ? message.content : 'Hermes request',
      messageIds: [],
      activities: [],
      status: 'idle' as const,
      startedAt: message.createdAt,
      updatedAt: message.createdAt
    };

    const nextBucket: ActivityRequestBucket = {
      ...existingBucket,
      preview: existingBucket.preview === 'Hermes request' && message.role === 'user' ? message.content : existingBucket.preview,
      messageIds: existingBucket.messageIds.includes(message.id) ? existingBucket.messageIds : [...existingBucket.messageIds, message.id],
      updatedAt: message.createdAt > existingBucket.updatedAt ? message.createdAt : existingBucket.updatedAt
    };

    const runtimeActivity = deriveRuntimeMessageActivity(message);
    if (runtimeActivity) {
      nextBucket.activities = mergeChatActivity(nextBucket.activities, runtimeActivity);
      nextBucket.status = statusFromActivityState(nextBucket.status, runtimeActivity.state);
    } else if (message.role === 'assistant') {
      nextBucket.status = message.status === 'error' ? 'failed' : 'completed';
    } else if (message.role === 'system' && message.status === 'error') {
      nextBucket.status = 'failed';
    } else if (message.role === 'user' && nextBucket.status === 'idle') {
      nextBucket.status = 'running';
    }

    buckets.set(requestId, nextBucket);
  }

  return Array.from(buckets.values()).sort((left, right) => left.startedAt.localeCompare(right.startedAt));
}

function seedActivityRequestsFromRuntimeRequests(runtimeRequests: RuntimeRequest[]) {
  return [...runtimeRequests]
    .sort((left, right) => left.startedAt.localeCompare(right.startedAt))
    .map((request) => ({
      requestId: request.requestId,
      preview: request.preview,
      messageIds: request.messageIds,
      activities: [...request.activities].sort((left, right) => left.timestamp.localeCompare(right.timestamp)),
      status: request.status,
      startedAt: request.startedAt,
      updatedAt: request.updatedAt
    }));
}

function upsertRuntimeRequestPayload(
  requests: RuntimeRequest[],
  requestId: string,
  update: (current: RuntimeRequest | null) => RuntimeRequest
) {
  const currentRequest = requests.find((request) => request.requestId === requestId) ?? null;
  const nextRequest = update(currentRequest);
  const remainingRequests = requests.filter((request) => request.requestId !== requestId);

  return [...remainingRequests, nextRequest].sort((left, right) => left.startedAt.localeCompare(right.startedAt));
}

function mergeSessionIntoBootstrap(
  currentBootstrap: BootstrapResponse | null,
  profileId: string,
  session: Session,
  nextPage: AppPage,
  toolsTab?: ToolsTab
) {
  if (!currentBootstrap) {
    return currentBootstrap;
  }

  const currentRecentIds = currentBootstrap.uiState.recentSessionIdsByProfile[profileId] ?? [];
  const nextRecentIds = [session.id, ...currentRecentIds.filter((id) => id !== session.id)].slice(0, 10);

  return {
    ...currentBootstrap,
    activeSessionId: session.id,
    recentSessions: currentBootstrap.activeProfileId === profileId ? appendRecentSession(currentBootstrap.recentSessions, session, true) : currentBootstrap.recentSessions,
    uiState: {
      ...currentBootstrap.uiState,
      currentPage: nextPage,
      toolsTab: toolsTab ?? currentBootstrap.uiState.toolsTab,
      activeSessionIdByProfile: {
        ...currentBootstrap.uiState.activeSessionIdByProfile,
        [profileId]: session.id
      },
      recentSessionIdsByProfile: {
        ...currentBootstrap.uiState.recentSessionIdsByProfile,
        [profileId]: nextRecentIds
      }
    }
  };
}

export function useAppController() {
  const [bootstrapStatus, setBootstrapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [page, setPage] = useState<AppPage>('chat');
  const [toolsTab, setToolsTab] = useState<ToolsTab>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openTabs, setOpenTabs] = useState<Array<{ sessionId: string; title: string }>>([]);
  const [sessionsQuery, setSessionsQuery] = useState('');
  const [submittedSessionsQuery, setSubmittedSessionsQuery] = useState('');
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsResponse, setSessionsResponse] = useState<SessionsResponse | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionPayload, setSessionPayload] = useState<SessionMessagesResponse | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [chatSending, setChatSending] = useState(false);
  const [chatProgress, setChatProgress] = useState<string | null>(null);
  const streamingSessionIdRef = useRef<string | null>(null);
  const [activityRequests, setActivityRequests] = useState<ActivityRequestBucket[]>([]);
  const [selectedActivityRequestId, setSelectedActivityRequestId] = useState<string | null>(null);
  const [assistantDraft, setAssistantDraft] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatAwaitingFinalAssistant, setChatAwaitingFinalAssistant] = useState(false);
  const [jobsResponse, setJobsResponse] = useState<Awaited<ReturnType<typeof getJobs>> | null>(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [toolsResponse, setToolsResponse] = useState<ToolsResponse | null>(null);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [toolHistoryResponse, setToolHistoryResponse] = useState<ToolHistoryResponse | null>(null);
  const [toolHistoryLoading, setToolHistoryLoading] = useState(false);
  const [toolHistoryError, setToolHistoryError] = useState<string | null>(null);
  const [toolHistoryPage, setToolHistoryPage] = useState(1);
  const [recipeRuntimeDrawerOpen, setRecipeRuntimeDrawerOpen] = useState(false);
  const [skillsResponse, setSkillsResponse] = useState<SkillsResponse | null>(null);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [settingsResponse, setSettingsResponse] = useState<SettingsResponse | null>(null);
  const [accessAuditEventsResponse, setAccessAuditEventsResponse] = useState<AuditEventsResponse | null>(null);
  const [accessAuditEventsLoading, setAccessAuditEventsLoading] = useState(false);
  const [accessAuditEventsError, setAccessAuditEventsError] = useState<string | null>(null);
  const [accessAuditEventsPage, setAccessAuditEventsPage] = useState(1);
  const [telemetryResponse, setTelemetryResponse] = useState<Awaited<ReturnType<typeof getTelemetry>> | null>(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [telemetryPage, setTelemetryPage] = useState(1);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [modelProviderResponse, setModelProviderResponse] = useState<ModelProviderResponse | null>(null);
  const [modelProviderLoading, setModelProviderLoading] = useState(false);
  const [modelProviderError, setModelProviderError] = useState<string | null>(null);
  const [runtimeReadinessHydratingProfileId, setRuntimeReadinessHydratingProfileId] = useState<string | null>(null);
  const [runtimeReadinessCheckedProfileId, setRuntimeReadinessCheckedProfileId] = useState<string | null>(null);
  const [providerDrawerLoading, setProviderDrawerLoading] = useState(false);
  const [providerDrawerError, setProviderDrawerError] = useState<string | null>(null);
  const [inspectedProviderId, setInspectedProviderId] = useState<string | null>(null);
  const pageRef = useRef<AppPage>('chat');
  const activeProfileIdRef = useRef<string | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const currentChatRequestIdRef = useRef<string | null>(null);

  const activeProfileId = bootstrap?.activeProfileId ?? null;
  const activeProfile = useMemo(
    () => bootstrap?.profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [activeProfileId, bootstrap?.profiles]
  );
  const activeSessionId =
    sessionPayload?.session.id ??
    (activeProfileId ? bootstrap?.uiState.activeSessionIdByProfile[activeProfileId] ?? bootstrap?.activeSessionId ?? null : null);
  const activeRecipe = sessionPayload?.attachedRecipe ?? null;
  const settings = settingsResponse?.settings ?? bootstrap?.settings ?? null;
  const accessAudit = settingsResponse?.accessAudit ?? null;
  const activeModelProviderResponse = modelProviderResponse?.config.profileId === activeProfileId ? modelProviderResponse : null;
  const selectedProviderId =
    inspectedProviderId ?? activeModelProviderResponse?.inspectedProviderId ?? activeModelProviderResponse?.config.provider ?? null;
  const inspectedProvider = useMemo(
    () => activeModelProviderResponse?.providers.find((provider) => provider.id === selectedProviderId) ?? null,
    [activeModelProviderResponse?.providers, selectedProviderId]
  );
  const selectedActivityRequest = useMemo(() => {
    if (activityRequests.length === 0) {
      return null;
    }

    return (
      activityRequests.find((request) => request.requestId === selectedActivityRequestId) ??
      activityRequests[activityRequests.length - 1] ??
      null
    );
  }, [activityRequests, selectedActivityRequestId]);
  const chatActivities = selectedActivityRequest?.activities ?? [];
  const runtimeConfigGate = useMemo<RuntimeConfigGate>(() => {
    if (!activeProfileId) {
      return {
        status: 'ready',
        code: 'ready',
        message: '',
        providerId: null,
        modelId: null
      };
    }

    const hasFreshModelProviderResponse = Boolean(
      activeModelProviderResponse && !activeModelProviderResponse.connection.usingCachedData
    );
    const startupReadinessPending =
      runtimeReadinessHydratingProfileId === activeProfileId ||
      (runtimeReadinessCheckedProfileId !== activeProfileId && !hasFreshModelProviderResponse);

    if (startupReadinessPending) {
      return {
        status: 'checking',
        code: 'checking',
        message: 'Checking Hermes runtime configuration…',
        providerId: null,
        modelId: null
      };
    }

    if (activeModelProviderResponse) {
      if (activeModelProviderResponse.runtimeReadiness.ready) {
        return {
          status: 'ready',
          code: activeModelProviderResponse.runtimeReadiness.code,
          message: activeModelProviderResponse.runtimeReadiness.message,
          providerId: activeModelProviderResponse.runtimeReadiness.providerId,
          modelId: activeModelProviderResponse.runtimeReadiness.modelId
        };
      }

      if (activeModelProviderResponse.runtimeReadiness.code === 'discovery_pending') {
        return {
          status: 'checking',
          code: activeModelProviderResponse.runtimeReadiness.code,
          message: activeModelProviderResponse.runtimeReadiness.message,
          providerId: activeModelProviderResponse.runtimeReadiness.providerId,
          modelId: activeModelProviderResponse.runtimeReadiness.modelId
        };
      }

      if (activeModelProviderResponse.connection.usingCachedData && modelProviderError) {
        return {
          status: 'blocked',
          code: 'runtime_state_unavailable',
          message: 'Hermes runtime configuration is unavailable right now. Open Settings to retry provider discovery.',
          providerId: null,
          modelId: null
        };
      }

      return {
        status: 'blocked',
        code: activeModelProviderResponse.runtimeReadiness.code,
        message: activeModelProviderResponse.runtimeReadiness.message,
        providerId: activeModelProviderResponse.runtimeReadiness.providerId,
        modelId: activeModelProviderResponse.runtimeReadiness.modelId
      };
    }

    if (modelProviderError) {
      return {
        status: 'blocked',
        code: 'runtime_state_unavailable',
        message: 'Hermes runtime configuration is unavailable right now. Open Settings to retry provider discovery.',
        providerId: null,
        modelId: null
      };
    }

    return {
      status: 'checking',
      code: 'checking',
      message: 'Checking Hermes runtime configuration…',
      providerId: null,
      modelId: null
    };
  }, [
    activeProfileId,
    activeModelProviderResponse,
    modelProviderError,
    runtimeReadinessCheckedProfileId,
    runtimeReadinessHydratingProfileId
  ]);

  useEffect(() => {
    pageRef.current = page;
    if (page !== 'chat' || !activeRecipe) {
      setRecipeRuntimeDrawerOpen(false);
    }
  }, [activeRecipe, page]);

  useEffect(() => {
    activeProfileIdRef.current = activeProfileId;
  }, [activeProfileId]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const clearRuntimeRequestState = useCallback((options?: { preserveSendingState?: boolean }) => {
    currentChatRequestIdRef.current = null;
    setActivityRequests([]);
    setSelectedActivityRequestId(null);
    setAssistantDraft('');
    if (!options?.preserveSendingState) {
      setChatProgress(null);
      setChatAwaitingFinalAssistant(false);
    }
  }, []);

  const hydrateRuntimeRequestState = useCallback((payload: SessionMessagesResponse | null) => {
    const nextBuckets =
      payload && payload.runtimeRequests.length > 0
        ? seedActivityRequestsFromRuntimeRequests(payload.runtimeRequests)
        : seedActivityRequestsFromMessages(payload?.messages ?? []);
    setActivityRequests(nextBuckets);
    setSelectedActivityRequestId((currentRequestId) => {
      if (currentRequestId && nextBuckets.some((bucket) => bucket.requestId === currentRequestId)) {
        return currentRequestId;
      }

      return nextBuckets[nextBuckets.length - 1]?.requestId ?? null;
    });
    currentChatRequestIdRef.current = nextBuckets[nextBuckets.length - 1]?.requestId ?? null;
    // Preserve the typing indicator when an active stream is still running (chatSending is true)
    // so that navigating away and back shows the response is still being generated.
    setChatAwaitingFinalAssistant((current) => current && chatSending);
  }, [chatSending]);

  useEffect(() => {
    if (page !== 'chat' || !sessionPayload || activityRequests.length > 0) {
      return;
    }

    if (sessionPayload.runtimeRequests.length === 0 && sessionPayload.messages.length === 0) {
      return;
    }

    hydrateRuntimeRequestState(sessionPayload);
  }, [activityRequests.length, hydrateRuntimeRequestState, page, sessionPayload]);

  useEffect(() => {
    if (
      page !== 'chat' ||
      !activeProfileId ||
      !sessionPayload ||
      sessionPayload.session.id !== activeSessionIdRef.current ||
      sessionPayload.attachedRecipe?.metadata.recipePipeline?.applet.status !== 'running'
    ) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;

    const pollSessionForRecipeEnrichment = async () => {
      try {
        const nextSessionPayload = await getSessionMessages(activeProfileId, sessionPayload.session.id);
        if (cancelled || activeSessionIdRef.current !== nextSessionPayload.session.id) {
          return;
        }

        setSessionPayload(nextSessionPayload);
        hydrateRuntimeRequestState(nextSessionPayload);
        setBootstrap((currentBootstrap) =>
          mergeSessionIntoBootstrap(currentBootstrap, activeProfileId, nextSessionPayload.session, 'chat', toolsTab)
        );

        if (nextSessionPayload.attachedRecipe?.metadata.recipePipeline?.applet.status !== 'running') {
          return;
        }
      } catch {
        if (cancelled) {
          return;
        }
      }

      if (!cancelled) {
        timeoutId = window.setTimeout(() => {
          void pollSessionForRecipeEnrichment();
        }, 1500);
      }
    };

    timeoutId = window.setTimeout(() => {
      void pollSessionForRecipeEnrichment();
    }, 600);

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activeProfileId, hydrateRuntimeRequestState, page, sessionPayload, toolsTab]);

  const ensureRuntimeRequestBucket = useCallback(
    (requestId: string, options: { preview?: string; messageId?: string; status?: ActivityRequestBucket['status']; timestamp?: string } = {}) => {
      const timestamp = options.timestamp ?? new Date().toISOString();
      setActivityRequests((currentBuckets) =>
        upsertActivityRequestBucket(currentBuckets, requestId, (currentBucket) => ({
          requestId,
          preview: options.preview ?? currentBucket?.preview ?? 'Hermes request',
          messageIds:
            options.messageId && !(currentBucket?.messageIds ?? []).includes(options.messageId)
              ? [...(currentBucket?.messageIds ?? []), options.messageId]
              : currentBucket?.messageIds ?? [],
          activities: currentBucket?.activities ?? [],
          status: options.status ?? currentBucket?.status ?? 'running',
          startedAt: currentBucket?.startedAt ?? timestamp,
          updatedAt: timestamp
        }))
      );
      setSessionPayload((currentPayload) => {
        if (!currentPayload) {
          return currentPayload;
        }

        return {
          ...currentPayload,
          runtimeRequests: upsertRuntimeRequestPayload(currentPayload.runtimeRequests, requestId, (currentRequest) => ({
            requestId,
            profileId: currentRequest?.profileId ?? currentPayload.profileId,
            sessionId: currentRequest?.sessionId ?? currentPayload.session.id,
            preview: options.preview ?? currentRequest?.preview ?? 'Hermes request',
            messageIds:
              options.messageId && !(currentRequest?.messageIds ?? []).includes(options.messageId)
                ? [...(currentRequest?.messageIds ?? []), options.messageId]
                : currentRequest?.messageIds ?? [],
            activities: currentRequest?.activities ?? [],
            status: options.status ?? currentRequest?.status ?? 'running',
            startedAt: currentRequest?.startedAt ?? timestamp,
            updatedAt: timestamp,
            completedAt:
              options.status && options.status !== 'idle' && options.status !== 'running'
                ? timestamp
                : currentRequest?.completedAt ?? null,
            lastError: currentRequest?.lastError,
            telemetryCount: currentRequest?.telemetryCount ?? 0
          }))
        };
      });
      setSelectedActivityRequestId(requestId);
    },
    []
  );

  const appendActivityToRuntimeRequest = useCallback((requestId: string, activity: ChatActivity) => {
    setActivityRequests((currentBuckets) =>
      upsertActivityRequestBucket(currentBuckets, requestId, (currentBucket) => ({
        requestId,
        preview: currentBucket?.preview ?? 'Hermes request',
        messageIds: currentBucket?.messageIds ?? [],
        activities: mergeChatActivity(currentBucket?.activities ?? [], activity),
        status: statusFromActivityState(currentBucket?.status, activity.state),
        startedAt: currentBucket?.startedAt ?? activity.timestamp,
        updatedAt: activity.timestamp
      }))
    );
    setSessionPayload((currentPayload) => {
      if (!currentPayload) {
        return currentPayload;
      }

      return {
        ...currentPayload,
        runtimeRequests: upsertRuntimeRequestPayload(currentPayload.runtimeRequests, requestId, (currentRequest) => {
          const nextStatus = statusFromActivityState(currentRequest?.status, activity.state);

          return {
            requestId,
            profileId: currentRequest?.profileId ?? currentPayload.profileId,
            sessionId: currentRequest?.sessionId ?? currentPayload.session.id,
            preview: currentRequest?.preview ?? 'Hermes request',
            messageIds: currentRequest?.messageIds ?? [],
            activities: mergeChatActivity(currentRequest?.activities ?? [], activity),
            status: nextStatus,
            startedAt: currentRequest?.startedAt ?? activity.timestamp,
            updatedAt: activity.timestamp,
            completedAt: nextStatus !== 'idle' && nextStatus !== 'running' ? activity.timestamp : currentRequest?.completedAt ?? null,
            lastError:
              activity.state === 'failed' || activity.state === 'denied' || activity.state === 'cancelled'
                ? activity.detail ?? activity.label
                : currentRequest?.lastError,
            telemetryCount: currentRequest?.telemetryCount ?? 0
          };
        })
      };
    });
  }, []);

  const finalizeRuntimeRequest = useCallback(
    (requestId: string, status: RuntimeRequest['status'], timestamp: string, lastError?: string) => {
      setActivityRequests((currentBuckets) =>
        upsertActivityRequestBucket(currentBuckets, requestId, (currentBucket) => ({
          requestId,
          preview: currentBucket?.preview ?? 'Hermes request',
          messageIds: currentBucket?.messageIds ?? [],
          activities: finalizeChatActivities(currentBucket?.activities ?? [], status, timestamp),
          status,
          startedAt: currentBucket?.startedAt ?? timestamp,
          updatedAt: timestamp
        }))
      );
      setSessionPayload((currentPayload) => {
        if (!currentPayload) {
          return currentPayload;
        }

        return {
          ...currentPayload,
          runtimeRequests: upsertRuntimeRequestPayload(currentPayload.runtimeRequests, requestId, (currentRequest) => ({
            requestId,
            profileId: currentRequest?.profileId ?? currentPayload.profileId,
            sessionId: currentRequest?.sessionId ?? currentPayload.session.id,
            preview: currentRequest?.preview ?? 'Hermes request',
            messageIds: currentRequest?.messageIds ?? [],
            activities: finalizeChatActivities(currentRequest?.activities ?? [], status, timestamp),
            status,
            startedAt: currentRequest?.startedAt ?? timestamp,
            updatedAt: timestamp,
            completedAt: status !== 'idle' && status !== 'running' ? timestamp : currentRequest?.completedAt ?? null,
            lastError: lastError ?? currentRequest?.lastError,
            telemetryCount: currentRequest?.telemetryCount ?? 0
          }))
        };
      });
      setSelectedActivityRequestId(requestId);
    },
    []
  );

  const loadSession = useCallback(
    async (profileId: string, sessionId: string, options: { persistSelection?: boolean; nextPage?: AppPage } = {}) => {
      setSessionLoading(true);
      setSessionError(null);

      try {
        if (options.persistSelection) {
          await selectSession(profileId, sessionId);
        }

        const nextSessionPayload = await getSessionMessages(profileId, sessionId);
        setSessionPayload(nextSessionPayload);
        setChatError(null);
        hydrateRuntimeRequestState(nextSessionPayload);
        setBootstrap((currentBootstrap) =>
          mergeSessionIntoBootstrap(currentBootstrap, profileId, nextSessionPayload.session, options.nextPage ?? 'chat', toolsTab)
        );
      } catch (error) {
        setSessionPayload(null);
        clearRuntimeRequestState();
        setSessionError(getErrorMessage(error, 'Failed to load the selected Hermes session.'));
      } finally {
        setSessionLoading(false);
      }
    },
    [clearRuntimeRequestState, hydrateRuntimeRequestState, toolsTab]
  );

  const applyBootstrapResponse = useCallback(
    async (
      nextBootstrap: BootstrapResponse,
      options: {
        preservePage?: boolean;
        openPreferredSession?: boolean;
      } = {}
    ) => {
      const nextPage = options.preservePage ? pageRef.current : nextBootstrap.uiState.currentPage;
      const nextToolsTab = nextBootstrap.uiState.toolsTab;
      const nextActiveProfileId = nextBootstrap.activeProfileId;
      const shouldReuseCurrentSession = nextActiveProfileId !== null && nextActiveProfileId === activeProfileIdRef.current;
      const preferredSessionId =
        nextActiveProfileId
          ? (shouldReuseCurrentSession ? activeSessionIdRef.current : null) ??
            nextBootstrap.uiState.activeSessionIdByProfile[nextActiveProfileId] ??
            nextBootstrap.activeSessionId ??
            nextBootstrap.recentSessions[0]?.id ??
            null
          : null;

      setBootstrap(nextBootstrap);
      setPage(nextPage);
      setToolsTab(nextToolsTab);
      setSidebarCollapsed(nextBootstrap.uiState.sidebarCollapsed);
      setBootstrapStatus('ready');

      if (!shouldReuseCurrentSession) {
        setSessionPayload(null);
        clearRuntimeRequestState();
        setSessionError(null);
        setChatError(null);
        setModelProviderResponse(null);
        setModelProviderError(null);
        setInspectedProviderId(null);
        setRuntimeReadinessHydratingProfileId(nextActiveProfileId);
        setRuntimeReadinessCheckedProfileId(null);
      }

      if (options.openPreferredSession === false || nextPage !== 'chat' || !nextActiveProfileId || !preferredSessionId) {
        setSessionPayload(null);
        clearRuntimeRequestState();
        return;
      }

      await loadSession(nextActiveProfileId, preferredSessionId, {
        persistSelection: false,
        nextPage
      });
    },
    [clearRuntimeRequestState, loadSession]
  );

  const loadSessions = useCallback(
    async (profileId: string, nextPage: number, search: string) => {
      setSessionsLoading(true);
      setSessionsError(null);
      setSessionsResponse(null);

      try {
        const response = await listSessions(profileId, nextPage, settings?.sessionsPageSize ?? 50, search);
        setSessionsResponse(response);
      } catch (error) {
        setSessionsError(getErrorMessage(error, 'Failed to load sessions.'));
      } finally {
        setSessionsLoading(false);
      }
    },
    [settings?.sessionsPageSize]
  );

  const loadJobs = useCallback(async (profileId: string) => {
    setJobsLoading(true);
    setJobsError(null);
    setJobsResponse(null);

    try {
      setJobsResponse(await getJobs(profileId));
    } catch (error) {
      setJobsError(getErrorMessage(error, 'Failed to load jobs.'));
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const loadTools = useCallback(async (profileId: string) => {
    setToolsLoading(true);
    setToolsError(null);
    setToolsResponse(null);

    try {
      setToolsResponse(await getTools(profileId));
    } catch (error) {
      setToolsError(getErrorMessage(error, 'Failed to load tools.'));
    } finally {
      setToolsLoading(false);
    }
  }, []);

  const loadToolHistory = useCallback(async (profileId: string, nextPage: number) => {
    setToolHistoryLoading(true);
    setToolHistoryError(null);
    setToolHistoryResponse(null);

    try {
      setToolHistoryResponse(await getToolHistory(profileId, nextPage, 25));
    } catch (error) {
      setToolHistoryError(getErrorMessage(error, 'Failed to load tool history.'));
    } finally {
      setToolHistoryLoading(false);
    }
  }, []);

  const loadSkills = useCallback(async (profileId: string) => {
    setSkillsLoading(true);
    setSkillsError(null);
    setSkillsResponse(null);

    try {
      setSkillsResponse(await getSkills(profileId));
    } catch (error) {
      setSkillsError(getErrorMessage(error, 'Failed to load skills.'));
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  const loadSettingsState = useCallback(async () => {
    setSettingsError(null);

    try {
      setSettingsResponse(await getSettings());
    } catch (error) {
      setSettingsError(getErrorMessage(error, 'Failed to load settings.'));
    }
  }, []);

  const loadTelemetryState = useCallback(async (profileId: string | null, nextPage: number) => {
    setTelemetryLoading(true);
    setTelemetryError(null);

    if (!profileId) {
      setTelemetryResponse(null);
      setTelemetryLoading(false);
      return;
    }

    try {
      const response = await getTelemetry({
        profileId,
        page: nextPage,
        pageSize: 25
      });
      setTelemetryResponse(response);
    } catch (error) {
      setTelemetryResponse(null);
      setTelemetryError(getErrorMessage(error, 'Failed to load troubleshooting telemetry.'));
    } finally {
      setTelemetryLoading(false);
    }
  }, []);

  const loadAccessAuditEventsState = useCallback(async (profileId: string | null, nextPage: number) => {
    setAccessAuditEventsLoading(true);
    setAccessAuditEventsError(null);

    if (!profileId) {
      setAccessAuditEventsResponse(null);
      setAccessAuditEventsLoading(false);
      return;
    }

    try {
      setAccessAuditEventsResponse(
        await getAuditEvents({
          profileId,
          page: nextPage,
          pageSize: 25
        })
      );
    } catch (error) {
      setAccessAuditEventsResponse(null);
      setAccessAuditEventsError(getErrorMessage(error, 'Failed to load access audit history.'));
    }
    finally {
      setAccessAuditEventsLoading(false);
    }
  }, []);

  const loadModelProviders = useCallback(
    async (
      profileId: string,
      nextInspectedProviderId?: string | null,
      options: {
        preserveResponse?: boolean;
        scope?: 'page' | 'drawer';
      } = {}
    ) => {
      const scope = options.scope ?? 'page';

      if (scope === 'drawer') {
        setProviderDrawerLoading(true);
        setProviderDrawerError(null);
      } else {
        setModelProviderLoading(true);
        setModelProviderError(null);
        if (!options.preserveResponse) {
          setModelProviderResponse(null);
        }
      }

      try {
        const response = await getModelProviders(profileId, nextInspectedProviderId ?? undefined);
        setModelProviderResponse(response);
        setInspectedProviderId(response.inspectedProviderId);
        return response;
      } catch (error) {
        const message = getErrorMessage(error, 'Failed to load model and provider settings.');
        if (scope === 'drawer') {
          setProviderDrawerError(message);
        } else {
          setModelProviderError(message);
        }
        throw error instanceof Error ? error : new Error(message);
      } finally {
        if (scope === 'drawer') {
          setProviderDrawerLoading(false);
        } else {
          setModelProviderLoading(false);
        }
      }
    },
    []
  );

  const refreshBootstrap = useCallback(
    async (options: { preservePage?: boolean; openPreferredSession?: boolean } = {}) => {
      setBootstrapStatus('loading');
      setBootstrapError(null);

      try {
        const nextBootstrap = await getBootstrap();
        await applyBootstrapResponse(nextBootstrap, options);
      } catch (error) {
        setBootstrapStatus('error');
        setBootstrapError(getErrorMessage(error, 'The bridge could not load Hermes data.'));
      }
    },
    [applyBootstrapResponse]
  );

  const persistUiState = useCallback(async (partial: Partial<UiState>) => {
    const nextUiState = await updateUiState(partial);
    setBootstrap((currentBootstrap) =>
      currentBootstrap
        ? {
            ...currentBootstrap,
            uiState: nextUiState,
            activeSessionId:
              currentBootstrap.activeProfileId && nextUiState.activeSessionIdByProfile[currentBootstrap.activeProfileId] !== undefined
                ? nextUiState.activeSessionIdByProfile[currentBootstrap.activeProfileId]
                : currentBootstrap.activeSessionId
          }
        : currentBootstrap
    );
    return nextUiState;
  }, []);

  const openSession = useCallback(
    async (sessionId: string) => {
      if (!activeProfileId) {
        setSessionError('Select a real Hermes profile before opening a session.');
        return;
      }

      setPage('chat');
      try {
        await persistUiState({
          currentPage: 'chat',
          activeSessionIdByProfile: {
            [activeProfileId]: sessionId
          }
        });
      } catch (error) {
        setBootstrapError(getErrorMessage(error, 'Failed to persist the selected session.'));
      }

      await loadSession(activeProfileId, sessionId, {
        persistSelection: true,
        nextPage: 'chat'
      });
    },
    [activeProfileId, loadSession, persistUiState]
  );

  const openPage = useCallback(
    async (nextPage: AppPage) => {
      setPage(nextPage);

      try {
        await persistUiState({
          currentPage: nextPage
        });
      } catch (error) {
        setBootstrapStatus('error');
        setBootstrapError(getErrorMessage(error, 'Failed to persist browser UI state.'));
      }
    },
    [persistUiState]
  );

  const handleToolsTabChange = useCallback(
    async (nextTab: ToolsTab) => {
      setToolsTab(nextTab);

      try {
        await persistUiState({
          currentPage: 'tools',
          toolsTab: nextTab
        });
      } catch (error) {
        setBootstrapStatus('error');
        setBootstrapError(getErrorMessage(error, 'Failed to persist the tools tab.'));
      }

      if (nextTab === 'history' && activeProfileId) {
        setToolHistoryPage(1);
        await loadToolHistory(activeProfileId, 1);
      }
    },
    [activeProfileId, loadToolHistory, persistUiState]
  );

  useEffect(() => {
    void refreshBootstrap({
      preservePage: false,
      openPreferredSession: true
    });
  }, [refreshBootstrap]);

  useEffect(() => {
    if (bootstrapStatus !== 'ready' || page !== 'sessions' || !activeProfileId) {
      return;
    }

    void loadSessions(activeProfileId, sessionsPage, submittedSessionsQuery);
  }, [activeProfileId, bootstrapStatus, loadSessions, page, sessionsPage, submittedSessionsQuery]);

  useEffect(() => {
    if (bootstrapStatus !== 'ready' || page !== 'jobs' || !activeProfileId) {
      return;
    }

    void loadJobs(activeProfileId);
  }, [activeProfileId, bootstrapStatus, loadJobs, page]);

  useEffect(() => {
    if (bootstrapStatus !== 'ready' || page !== 'tools' || !activeProfileId) {
      return;
    }

    void loadTools(activeProfileId);

    if (toolsTab === 'history') {
      void loadToolHistory(activeProfileId, toolHistoryPage);
    }
  }, [activeProfileId, bootstrapStatus, loadToolHistory, loadTools, page, toolHistoryPage, toolsTab]);

  useEffect(() => {
    if (bootstrapStatus !== 'ready' || page !== 'skills' || !activeProfileId) {
      return;
    }

    void loadSkills(activeProfileId);
  }, [activeProfileId, bootstrapStatus, loadSkills, page]);

  useEffect(() => {
    if (bootstrapStatus !== 'ready' || !activeProfileId) {
      return;
    }

    let cancelled = false;

    setRuntimeReadinessHydratingProfileId(activeProfileId);
    setRuntimeReadinessCheckedProfileId(null);
    setInspectedProviderId(null);
    setModelProviderResponse((currentResponse) =>
      currentResponse?.config.profileId === activeProfileId ? currentResponse : null
    );

    const hydrateRuntimeReadiness = async () => {
      let attempt = 0;
      let consecutiveFailures = 0;

      while (!cancelled) {
        const delayMs = STARTUP_RUNTIME_DISCOVERY_RETRY_DELAYS_MS[Math.min(attempt, STARTUP_RUNTIME_DISCOVERY_RETRY_DELAYS_MS.length - 1)];
        if (delayMs > 0) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, delayMs);
          });
          if (cancelled) {
            return;
          }
        }

        try {
          const response = await loadModelProviders(activeProfileId, undefined, {
            preserveResponse: true
          });

          if (cancelled) {
            return;
          }

          consecutiveFailures = 0;
          if (response.runtimeReadiness.ready || response.runtimeReadiness.code !== 'discovery_pending') {
            break;
          }
        } catch {
          consecutiveFailures += 1;
          if (consecutiveFailures >= STARTUP_RUNTIME_DISCOVERY_RETRY_DELAYS_MS.length) {
            break;
          }
        }

        attempt += 1;
      }

      if (!cancelled) {
        setRuntimeReadinessHydratingProfileId((currentProfileId) => (currentProfileId === activeProfileId ? null : currentProfileId));
        setRuntimeReadinessCheckedProfileId(activeProfileId);
      }
    };

    void hydrateRuntimeReadiness();

    return () => {
      cancelled = true;
    };
  }, [activeProfileId, bootstrapStatus, loadModelProviders]);

  useEffect(() => {
    if (bootstrapStatus !== 'ready' || page !== 'settings') {
      return;
    }

    void loadSettingsState();
    if (activeProfileId) {
      void loadTelemetryState(activeProfileId, telemetryPage);
      void loadAccessAuditEventsState(activeProfileId, accessAuditEventsPage);
    } else {
      setTelemetryResponse(null);
      setAccessAuditEventsResponse(null);
    }
  }, [
    accessAuditEventsPage,
    activeProfileId,
    bootstrapStatus,
    loadAccessAuditEventsState,
    loadSettingsState,
    loadTelemetryState,
    page,
    telemetryPage
  ]);

  useEffect(() => {
    setTelemetryPage(1);
    setAccessAuditEventsPage(1);
  }, [activeProfileId]);

  const handleProfileChange = useCallback(
    async (profileId: string) => {
      setBootstrapStatus('loading');
      setBootstrapError(null);

      try {
        const nextBootstrap = await selectProfile(profileId);
        await applyBootstrapResponse(nextBootstrap, {
          preservePage: true,
          openPreferredSession: true
        });
      } catch (error) {
        setBootstrapStatus('error');
        setBootstrapError(getErrorMessage(error, 'Failed to switch profiles.'));
      }
    },
    [applyBootstrapResponse]
  );

  const handleCreateSession = useCallback(async () => {
    if (!activeProfileId) {
      setChatError('Select a real Hermes profile before creating a session.');
      return;
    }

    try {
      const nextSession = await createSession({
        profileId: activeProfileId
      });
      await openSession(nextSession.id);
    } catch (error) {
      setChatError(getErrorMessage(error, 'Failed to create a new session.'));
    }
  }, [activeProfileId, openSession]);

  const handleSessionSearch = useCallback(() => {
    setSessionsPage(1);
    setSubmittedSessionsQuery(sessionsQuery.trim());
  }, [sessionsQuery]);

  const handleSessionsPageChange = useCallback((nextPage: number) => {
    setSessionsPage(nextPage);
  }, []);

  const applySessionUpdate = useCallback((nextSession: Session) => {
    setSessionPayload((currentPayload) =>
      currentPayload?.session.id === nextSession.id
        ? {
            ...currentPayload,
            session: nextSession
          }
        : currentPayload
    );
    setSessionsResponse((currentResponse) =>
      currentResponse
        ? {
            ...currentResponse,
            items: currentResponse.items.map((session) => (session.id === nextSession.id ? nextSession : session))
          }
        : currentResponse
    );
    setBootstrap((currentBootstrap) =>
      currentBootstrap
        ? {
            ...currentBootstrap,
            recentSessions: currentBootstrap.recentSessions.map((session) => (session.id === nextSession.id ? nextSession : session))
          }
        : currentBootstrap
    );
  }, []);

  const applySessionAttachedRecipeState = useCallback((sessionId: string, attachedRecipeId: string | null) => {
    setSessionPayload((currentPayload) =>
      currentPayload?.session.id === sessionId
        ? {
            ...currentPayload,
            session: {
              ...currentPayload.session,
              attachedRecipeId
            }
          }
        : currentPayload
    );
    setSessionsResponse((currentResponse) =>
      currentResponse
        ? {
            ...currentResponse,
            items: currentResponse.items.map((session) =>
              session.id === sessionId
                ? {
                    ...session,
                    attachedRecipeId
                  }
                : session
            )
          }
        : currentResponse
    );
    setBootstrap((currentBootstrap) =>
      currentBootstrap
        ? {
            ...currentBootstrap,
            recentSessions: currentBootstrap.recentSessions.map((session) =>
              session.id === sessionId
                ? {
                    ...session,
                    attachedRecipeId
                  }
                : session
            )
          }
        : currentBootstrap
    );
  }, []);

  const handleRenameSession = useCallback(
    async (sessionId: string, title: string) => {
      if (!activeProfileId) {
        throw new Error('Select a real Hermes profile before renaming a session.');
      }

      const renamedSession = await renameSession(sessionId, {
        profileId: activeProfileId,
        title
      });
      applySessionUpdate(renamedSession);
      return renamedSession;
    },
    [activeProfileId, applySessionUpdate]
  );

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      if (!activeProfileId) {
        throw new Error('Select a real Hermes profile before deleting a session.');
      }

      const nextSessionsPage =
        pageRef.current === 'sessions' ? getSessionsPageAfterDeletion(sessionsResponse, sessionId) : sessionsPage;

      await deleteSession(sessionId, {
        profileId: activeProfileId
      });

      setSessionsResponse((currentResponse) =>
        currentResponse
          ? {
              ...currentResponse,
              items: currentResponse.items.filter((session) => session.id !== sessionId),
              total: Math.max(0, currentResponse.total - (currentResponse.items.some((session) => session.id === sessionId) ? 1 : 0)),
              page: pageRef.current === 'sessions' ? nextSessionsPage : currentResponse.page
            }
          : currentResponse
      );
      setBootstrap((currentBootstrap) =>
        currentBootstrap
          ? {
              ...currentBootstrap,
              activeSessionId: currentBootstrap.activeSessionId === sessionId ? null : currentBootstrap.activeSessionId,
              recentSessions: currentBootstrap.recentSessions.filter((session) => session.id !== sessionId),
              uiState: {
                ...currentBootstrap.uiState,
                activeSessionIdByProfile: activeProfileId
                  ? {
                      ...currentBootstrap.uiState.activeSessionIdByProfile,
                      [activeProfileId]:
                        currentBootstrap.uiState.activeSessionIdByProfile[activeProfileId] === sessionId
                          ? null
                          : currentBootstrap.uiState.activeSessionIdByProfile[activeProfileId]
                    }
                  : currentBootstrap.uiState.activeSessionIdByProfile,
                recentSessionIdsByProfile: activeProfileId
                  ? {
                      ...currentBootstrap.uiState.recentSessionIdsByProfile,
                      [activeProfileId]: (currentBootstrap.uiState.recentSessionIdsByProfile[activeProfileId] ?? []).filter((id) => id !== sessionId)
                    }
                  : currentBootstrap.uiState.recentSessionIdsByProfile
              }
            }
          : currentBootstrap
      );

      if (sessionPayload?.session.id === sessionId) {
        setSessionPayload(null);
        clearRuntimeRequestState();
      }

      if (pageRef.current === 'sessions' && nextSessionsPage !== sessionsPage) {
        setSessionsPage(nextSessionsPage);
      }

      await refreshBootstrap({
        preservePage: true,
        openPreferredSession: pageRef.current === 'chat'
      });

      toaster.success({
        title: 'Session deleted',
        description: 'The selected session was removed from the visible lists.',
        closable: true
      });
    },
    [
      activeProfileId,
      clearRuntimeRequestState,
      refreshBootstrap,
      sessionsResponse,
      sessionPayload?.session.id,
      sessionsPage,
    ]
  );

  const handleDeleteSkill = useCallback(
    async (skill: Skill) => {
      if (!activeProfileId) {
        throw new Error('Select a real Hermes profile before deleting a skill.');
      }

      await deleteSkill(skill.id, {
        profileId: activeProfileId
      });
      setSkillsResponse((currentResponse) =>
        currentResponse
          ? {
              ...currentResponse,
              items: currentResponse.items.filter((item) => item.id !== skill.id)
            }
          : currentResponse
      );
      toaster.success({
        title: 'Skill deleted',
        description: `${skill.name} was removed from this profile.`,
        closable: true
      });
    },
    [activeProfileId]
  );

  const handleSidebarCollapsedChange = useCallback(
    async (collapsed: boolean) => {
      setSidebarCollapsed(collapsed);

      try {
        await persistUiState({
          sidebarCollapsed: collapsed
        });
      } catch (error) {
        setSidebarCollapsed((currentValue) => !currentValue);
        setBootstrapError(getErrorMessage(error, 'Failed to persist the sidebar layout.'));
      }
    },
    [persistUiState]
  );

  const handleUpdateRecipe = useCallback(
    async (
      recipeId: string,
      partial: Omit<UpdateRecipeRequest, 'profileId'>,
      options: {
        toastTitle?: string;
        toastDescription?: string;
        quiet?: boolean;
      } = {}
    ) => {
      if (!activeProfileId) {
        throw new Error('Select a real Hermes profile before updating a recipe.');
      }

      const response = await updateRecipe(recipeId, {
        profileId: activeProfileId,
        ...partial
      });
      setSessionPayload((currentPayload) =>
        currentPayload && currentPayload.session.id === response.recipe.primarySessionId
          ? {
              ...currentPayload,
              session: {
                ...currentPayload.session,
                attachedRecipeId: response.recipe.id
              },
              attachedRecipe: response.recipe,
              recipeEvents: mergeRecipeEvents(currentPayload.recipeEvents, response.events)
            }
          : currentPayload
      );
      applySessionAttachedRecipeState(response.recipe.primarySessionId, response.recipe.id);

      if (!options.quiet) {
        toaster.success({
          title: options.toastTitle ?? 'Recipe updated',
          description: options.toastDescription ?? `Updated ${response.recipe.title}.`,
          closable: true
        });
      }

      return response.recipe;
    },
    [activeProfileId, applySessionAttachedRecipeState]
  );

  const handleRenameRecipe = useCallback(
    async (recipeId: string, title: string) =>
      handleUpdateRecipe(
        recipeId,
        {
          title
        },
        {
          toastTitle: 'Recipe renamed',
          toastDescription: `Updated to ${title}.`
        }
      ),
    [handleUpdateRecipe]
  );

  const handleApplyRecipeEntryAction = useCallback(
    async (
      recipeId: string,
      action: 'remove' | 'delete_source',
      entryIds: string[],
      options: {
        quiet?: boolean;
        toastTitle?: string;
        toastDescription?: string;
      } = {}
    ) => {
      if (!activeProfileId) {
        throw new Error('Select a real Hermes profile before editing a recipe.');
      }

      const response = await applyRecipeEntryAction(recipeId, {
        profileId: activeProfileId,
        action,
        entryIds
      });

      setSessionPayload((currentPayload) =>
        currentPayload && currentPayload.session.id === response.recipe.primarySessionId
          ? {
              ...currentPayload,
              session: {
                ...currentPayload.session,
                attachedRecipeId: response.recipe.id
              },
              attachedRecipe: response.recipe,
              recipeEvents: mergeRecipeEvents(currentPayload.recipeEvents, response.events)
            }
          : currentPayload
      );
      applySessionAttachedRecipeState(response.recipe.primarySessionId, response.recipe.id);

      if (!options.quiet) {
        toaster.success({
          title: options.toastTitle ?? (action === 'delete_source' ? 'Email deleted' : 'Recipe updated'),
          description:
            options.toastDescription ??
            (action === 'delete_source'
              ? `Deleted ${response.deletedSourceEntryIds.length} ${response.deletedSourceEntryIds.length === 1 ? 'email' : 'emails'}.`
              : `Removed ${response.removedEntryIds.length} ${response.removedEntryIds.length === 1 ? 'entry' : 'entries'} from ${response.recipe.title}.`),
          closable: true
        });
      }

      return response;
    },
    [activeProfileId, applySessionAttachedRecipeState]
  );

  const handleDeleteRecipe = useCallback(
    async (recipeId: string) => {
      if (!activeProfileId) {
        throw new Error('Select a real Hermes profile before deleting a recipe.');
      }

      await deleteRecipe(recipeId, {
        profileId: activeProfileId
      });
      const activeSessionId = activeSessionIdRef.current;
      if (activeSessionId) {
        applySessionAttachedRecipeState(activeSessionId, null);
        await loadSession(activeProfileId, activeSessionId, {
          persistSelection: false,
          nextPage: 'chat'
        });
      } else {
        setSessionPayload((currentPayload) =>
          currentPayload && currentPayload.attachedRecipe?.id === recipeId
            ? {
                ...currentPayload,
                session: {
                  ...currentPayload.session,
                  attachedRecipeId: null
                },
                attachedRecipe: null
              }
            : currentPayload
        );
      }
      setRecipeRuntimeDrawerOpen(false);
      toaster.success({
        title: 'Recipe deleted',
        description: 'The attached recipe was removed. The session remains available.',
        closable: true
      });
    },
    [activeProfileId, applySessionAttachedRecipeState, loadSession]
  );

  const focusActivityRequest = useCallback((requestId: string | null) => {
    if (!requestId) {
      return;
    }

    setSelectedActivityRequestId(requestId);
  }, []);

  const openRecipeRuntimeRequest = useCallback((requestId: string | null) => {
    if (!requestId) {
      return;
    }

    setSelectedActivityRequestId(requestId);
    setRecipeRuntimeDrawerOpen(true);
  }, []);

  const handleStreamEvent = useCallback(
    (event: ChatStreamEvent) => {
      if (event.type === 'session') {
        setSessionPayload((currentPayload) =>
          currentPayload
            ? {
                ...currentPayload,
                session: event.session
              }
            : (() => {
                const resolvedProfileId =
                  activeProfileIdRef.current ?? event.session.lastUsedProfileId ?? event.session.associatedProfileIds[0] ?? null;
                if (!resolvedProfileId) {
                  return currentPayload;
                }

                return {
                  profileId: resolvedProfileId,
                  session: event.session,
                  messages: [],
                  runtimeRequests: [],
                  attachedRecipe: null,
                  recipeEvents: []
                };
              })()
        );
      }

      if (event.type === 'message') {
        const requestId = getMessageRequestId(event.message);
        setSessionPayload((currentPayload) => {
          if (!currentPayload) {
            const resolvedProfileId = activeProfileIdRef.current ?? activeRecipe?.profileId ?? null;
            if (!resolvedProfileId) {
              return currentPayload;
            }

            return {
              profileId: resolvedProfileId,
              session: {
                id: event.message.sessionId,
                title: 'Active session',
                summary: 'Streaming response in progress.',
                source: 'local',
                lastUpdatedAt: new Date().toISOString(),
                lastUsedProfileId: resolvedProfileId,
                associatedProfileIds: [resolvedProfileId],
                messageCount: 1,
                attachedRecipeId: activeRecipe?.id ?? null,
                recipeType: activeRecipe?.id ? 'home' : 'tui'
              },
              messages: [event.message],
              runtimeRequests: [],
              attachedRecipe: activeRecipe ?? null,
              recipeEvents: []
            };
          }

          return {
            ...currentPayload,
            messages: appendUniqueMessage(currentPayload.messages, event.message),
            runtimeRequests: currentPayload.runtimeRequests
          };
        });

        if (requestId) {
          currentChatRequestIdRef.current = requestId;
          ensureRuntimeRequestBucket(requestId, {
            preview: event.message.role === 'user' ? event.message.content : undefined,
            messageId: event.message.id,
            status:
              event.message.role === 'assistant'
                ? event.message.status === 'error'
                  ? 'failed'
                  : 'completed'
                : event.message.role === 'system' && event.message.status === 'error'
                  ? 'failed'
                  : 'running',
            timestamp: event.message.createdAt
          });
        }

        const runtimeActivity = deriveRuntimeMessageActivity(event.message);
        if (runtimeActivity && requestId) {
          appendActivityToRuntimeRequest(requestId, runtimeActivity);
          const runtimeProgress = deriveProgressMessageFromActivity(runtimeActivity);
          if (runtimeProgress) {
            setChatProgress(runtimeProgress);
          }
        }
      }

      if (event.type === 'assistant_snapshot') {
        const requestId = event.requestId ?? currentChatRequestIdRef.current;
        if (requestId) {
          setSelectedActivityRequestId(requestId);
        }
        if (event.markdown.trim().length > 0) {
          setChatProgress('Hermes is typing…');
        }
        setAssistantDraft(event.markdown);
      }

      if (event.type === 'progress') {
        const requestId = event.requestId ?? currentChatRequestIdRef.current;
        setChatProgress(event.message);
        if (requestId) {
          appendActivityToRuntimeRequest(requestId, {
            kind: 'status',
            state: 'updated',
            label: 'Runtime status',
            detail: event.message,
            requestId,
            timestamp: new Date().toISOString()
          });
        }
      }

      if (event.type === 'activity') {
        const requestId = event.activity.requestId ?? currentChatRequestIdRef.current;
        if (!requestId) {
          return;
        }

        appendActivityToRuntimeRequest(requestId, {
          ...event.activity,
          requestId
        });
        setSelectedActivityRequestId(requestId);
        const activityProgress = deriveProgressMessageFromActivity(event.activity);
        if (activityProgress) {
          setChatProgress(activityProgress);
        }
      }

      if (event.type === 'recipe_event') {
        const requestId = currentChatRequestIdRef.current;
        setSessionPayload((currentPayload) => {
          if (!currentPayload) {
            return currentPayload;
          }

          const currentAttachedSpace = currentPayload.attachedRecipe;
          const nextAttachedSpace =
            event.recipe && event.recipe.primarySessionId === currentPayload.session.id
              ? event.recipe
              : currentAttachedSpace?.id === event.event.recipeId
                ? null
                : currentAttachedSpace;

          return {
            ...currentPayload,
            session: {
              ...currentPayload.session,
              attachedRecipeId: nextAttachedSpace?.id ?? null
            },
            attachedRecipe: nextAttachedSpace,
            recipeEvents: appendRecipeEvent(currentPayload.recipeEvents, event.event)
          };
        });
        const resolvedSessionId = activeSessionIdRef.current ?? event.event.sessionId ?? sessionPayload?.session.id ?? null;
        if (resolvedSessionId) {
          applySessionAttachedRecipeState(resolvedSessionId, event.recipe?.id ?? null);
        }
        if (!event.recipe && sessionPayload?.attachedRecipe?.id === event.event.recipeId) {
          setRecipeRuntimeDrawerOpen(false);
        }
        setChatProgress('Hermes is updating the workspace…');
        if (requestId) {
          appendActivityToRuntimeRequest(requestId, {
            kind: 'status',
            state: event.event.type === 'deleted' ? 'completed' : 'updated',
            label: 'Recipe event',
            detail: event.event.message,
            requestId,
            timestamp: event.event.createdAt
          });
        }
      }

      if (event.type === 'recipe_build_progress') {
        const requestId = event.build.triggerRequestId ?? currentChatRequestIdRef.current;
        const pipeline = event.recipe?.metadata.recipePipeline;
        const pipelineMessage = pipeline
          ? pipeline.currentStage.startsWith('task')
            ? pipeline.task.message
            : pipeline.currentStage.startsWith('baseline')
              ? pipeline.baseline.message
              : pipeline.applet.message
          : null;
        setSessionPayload((currentPayload) => {
          if (!currentPayload || !event.recipe || event.recipe.primarySessionId !== currentPayload.session.id) {
            return currentPayload;
          }

          // Wins #1/#2/#3/#4: inject partialTemplateState into the recipe's dynamic field so
          // DynamicRecipeView can render the progressive template shell before final promotion.
          // The partial state is only applied when the recipe doesn't already have a promoted template.
          const partialTemplateState = event.partialTemplateState ?? null;
          const hasPromotedTemplate = Boolean(event.recipe.dynamic?.recipeTemplate);
          const recipeToStore =
            partialTemplateState && !hasPromotedTemplate
              ? {
                  ...event.recipe,
                  dynamic: {
                    ...event.recipe.dynamic,
                    recipeTemplate: partialTemplateState
                  }
                }
              : event.recipe;

          return {
            ...currentPayload,
            session: {
              ...currentPayload.session,
              attachedRecipeId: event.recipe.id
            },
            attachedRecipe: recipeToStore
          };
        });

        if (event.recipe) {
          applySessionAttachedRecipeState(event.recipe.primarySessionId, event.recipe.id);
        }

        setChatProgress(pipelineMessage ?? event.build.userFacingMessage ?? event.build.progressMessage ?? 'Building recipe…');

        if (requestId) {
          appendActivityToRuntimeRequest(requestId, {
            kind: 'status',
            state: event.build.phase === 'failed' ? 'failed' : event.build.phase === 'ready' ? 'completed' : 'updated',
            label:
              event.build.buildKind === 'applet'
                ? 'Recipe applet'
                : event.build.buildKind === 'dsl_enrichment'
                  ? 'Recipe enrichment'
                  : 'Home workspace',
            detail: pipelineMessage ?? event.build.userFacingMessage ?? event.build.progressMessage ?? 'Building recipe…',
            requestId,
            timestamp: event.build.updatedAt
          });
        }
      }

      if (event.type === 'complete') {
        const requestId = getMessageRequestId(event.assistantMessage) ?? currentChatRequestIdRef.current;
        setSessionPayload((currentPayload) => {
          const currentMessages = currentPayload?.messages ?? [];
          const nextMessages = appendUniqueMessage(
            currentMessages.filter((message) => message.id !== event.assistantMessage.id),
            event.assistantMessage
          );
          const resolvedProfileId =
            currentPayload?.profileId ??
            activeProfileIdRef.current ??
            event.session.lastUsedProfileId ??
            event.session.associatedProfileIds[0] ??
            null;
          if (!resolvedProfileId) {
            return currentPayload;
          }

          return {
            profileId: resolvedProfileId,
            session: event.session,
            messages: nextMessages,
            runtimeRequests: currentPayload?.runtimeRequests ?? [],
            attachedRecipe: currentPayload?.attachedRecipe ?? null,
            recipeEvents: currentPayload?.recipeEvents ?? []
          };
        });
        setAssistantDraft('');
        setChatProgress(null);
        setChatAwaitingFinalAssistant(false);
        if (requestId) {
          ensureRuntimeRequestBucket(requestId, {
            messageId: event.assistantMessage.id,
            status: 'completed',
            timestamp: event.assistantMessage.createdAt
          });
          appendActivityToRuntimeRequest(requestId, {
            kind: 'status',
            state: 'completed',
            label: 'Runtime status',
            detail: 'Hermes completed the active request.',
            requestId,
            timestamp: event.assistantMessage.createdAt
          });
          finalizeRuntimeRequest(requestId, 'completed', event.assistantMessage.createdAt);
        }
        setBootstrap((currentBootstrap) => {
          const resolvedProfileId =
            activeProfileIdRef.current ?? event.session.lastUsedProfileId ?? event.session.associatedProfileIds[0] ?? null;
          return resolvedProfileId ? mergeSessionIntoBootstrap(currentBootstrap, resolvedProfileId, event.session, 'chat', toolsTab) : currentBootstrap;
        });
      }

      if (event.type === 'error') {
        const requestId = event.requestId ?? currentChatRequestIdRef.current;
        const errorAt = new Date().toISOString();
        setAssistantDraft('');
        setChatProgress(null);
        setChatAwaitingFinalAssistant(false);
        setChatError(sanitizeUserFacingErrorMessage(event.error.message));
        if (requestId) {
          ensureRuntimeRequestBucket(requestId, {
            status: 'failed',
            timestamp: errorAt
          });
          finalizeRuntimeRequest(requestId, 'failed', errorAt, event.error.message);
        }

        setSessionPayload((currentPayload) => {
          if (!currentPayload || !requestId) {
            return currentPayload;
          }

          const alreadyHasVisibleError = currentPayload.messages.some(
            (message) => message.requestId === requestId && message.role === 'system' && message.status === 'error'
          );
          if (alreadyHasVisibleError) {
            return currentPayload;
          }

          const nextSystemMessage: ChatMessage = {
            id: `local-system-${requestId}`,
            sessionId: currentPayload.session.id,
            role: 'system',
            content: sanitizeUserFacingErrorMessage(event.error.message),
            createdAt: errorAt,
            status: 'error',
            requestId,
            visibility: 'transcript',
            kind: 'notice'
          };

          return {
            ...currentPayload,
            messages: appendUniqueMessage(currentPayload.messages, nextSystemMessage),
            runtimeRequests: currentPayload.runtimeRequests
          };
        });
      }
    },
    [
      activeRecipe,
      applySessionAttachedRecipeState,
      appendActivityToRuntimeRequest,
      ensureRuntimeRequestBucket,
      finalizeRuntimeRequest,
      sessionPayload?.attachedRecipe?.id,
      sessionPayload?.session.id,
      toolsTab
    ]
  );

  const runStreamingRequest = useCallback(
    async (options: {
      initialProgress: string;
      failureMessage: string;
      execute: (onEvent: (event: ChatStreamEvent) => void) => Promise<void>;
    }) => {
      if (chatSending) {
        return;
      }

      setChatSending(true);
      streamingSessionIdRef.current = activeSessionId;
      setChatError(null);
      setChatProgress(options.initialProgress);
      setChatAwaitingFinalAssistant(true);
      currentChatRequestIdRef.current = null;
      setSelectedActivityRequestId(null);
      setAssistantDraft('');

      try {
        await options.execute(handleStreamEvent);
      } catch (error) {
        const message = getErrorMessage(error, options.failureMessage);
        const requestId = currentChatRequestIdRef.current;
        const failedAt = new Date().toISOString();
        if (requestId) {
          finalizeRuntimeRequest(requestId, 'failed', failedAt, message);
        }
        setChatError(sanitizeUserFacingErrorMessage(message));
        setChatProgress(null);
        setAssistantDraft('');
        setChatAwaitingFinalAssistant(false);
      } finally {
        setChatSending(false);
        streamingSessionIdRef.current = null;
      }
    },
    [activeSessionId, chatSending, finalizeRuntimeRequest, handleStreamEvent]
  );

  const runChatRequest = useCallback(
    async (content: string, options: { mode?: ChatRequestMode } = {}) => {
      if (!activeProfileId) {
        setChatError('Select a real Hermes profile before sending a message.');
        return;
      }

      if (!activeSessionId) {
        setChatError('Create or open a session before sending a message.');
        return;
      }

      if (!content.trim() || chatSending) {
        return;
      }

      const resolvedRecipeId = activeRecipe?.id ?? sessionPayload?.session.attachedRecipeId ?? undefined;
      const requestMode = options.mode ?? 'chat';
      await runStreamingRequest({
        initialProgress:
          requestMode === 'recipe_refresh'
            ? 'Hermes is refreshing the workspace…'
            : resolvedRecipeId
              ? 'Hermes is updating the workspace…'
              : 'Hermes is working…',
        failureMessage: 'Failed to send the Hermes request.',
        execute: (onEvent) =>
          streamChat(
            {
              profileId: activeProfileId,
              sessionId: activeSessionId,
              recipeId: resolvedRecipeId,
              content,
              mode: requestMode
            },
            onEvent
          )
      });
    },
    [activeProfileId, activeSessionId, activeRecipe?.id, chatSending, runStreamingRequest, sessionPayload?.session.attachedRecipeId]
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      const trimmedContent = content.trim();
      if (!trimmedContent || chatSending) {
        return false;
      }

      if (!activeProfileId) {
        setChatError('Select a real Hermes profile before sending a message.');
        return false;
      }

      if (!activeSessionId) {
        setChatError('Create or open a session before sending a message.');
        return false;
      }

      void runChatRequest(trimmedContent);
      return true;
    },
    [activeProfileId, activeSessionId, chatSending, runChatRequest]
  );

  const handleRefreshRecipe = useCallback(
    async (recipe: Recipe) => {
      if (!sessionPayload || sessionPayload.attachedRecipe?.id !== recipe.id) {
        setChatError('Open the attached workspace session before refreshing its content.');
        return;
      }

      await runChatRequest(RECIPE_REFRESH_USER_MESSAGE, {
        mode: 'recipe_refresh'
      });
    },
    [runChatRequest, sessionPayload]
  );

  const handleExecuteRecipeAction = useCallback(
    async (
      recipe: Recipe,
      actionId: string,
      input: {
        selectedItemIds?: string[];
        pageState?: Record<string, number>;
        filterState?: Record<string, string>;
        formValues?: Record<string, string | number | boolean | null>;
      }
    ) => {
      if (!activeProfileId) {
        setChatError('Select a real Hermes profile before running a workspace action.');
        return;
      }

      if (!activeSessionId) {
        setChatError('Open the attached workspace session before running a workspace action.');
        return;
      }

      if (!sessionPayload || sessionPayload.attachedRecipe?.id !== recipe.id) {
        setChatError('Open the attached workspace session before running a workspace action.');
        return;
      }

      await runStreamingRequest({
        initialProgress: actionId === 'retry-build' ? 'Retrying workspace enrichment…' : 'Hermes is updating the workspace…',
        failureMessage: actionId === 'retry-build' ? 'Failed to retry workspace enrichment.' : 'Failed to run the workspace action.',
        execute: (onEvent) =>
          streamRecipeAction(
            recipe.id,
            {
              profileId: activeProfileId,
              sessionId: activeSessionId,
              actionId,
              selectedItemIds: input.selectedItemIds ?? [],
              pageState: input.pageState ?? {},
              filterState: input.filterState ?? {},
              formValues: input.formValues ?? {}
            },
            onEvent
          )
      });
    },
    [activeProfileId, activeSessionId, runStreamingRequest, sessionPayload]
  );

  const handleSaveSettings = useCallback(async (
    nextSettings: Partial<AppSettings>,
    options: {
      quiet?: boolean;
    } = {}
  ) => {
    setSettingsSaving(true);
    setSettingsError(null);

    try {
      const savedSettingsResponse = await updateSettings(nextSettings);
      setSettingsResponse(savedSettingsResponse);
      if (activeProfileId) {
        void loadAccessAuditEventsState(activeProfileId, accessAuditEventsPage);
      }
      setBootstrap((currentBootstrap) =>
        currentBootstrap
          ? {
              ...currentBootstrap,
              settings: savedSettingsResponse.settings
            }
          : currentBootstrap
      );
      if (!options.quiet) {
        toaster.success({
          title: 'Settings saved',
          description: 'Local preferences were updated.',
          closable: true
        });
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to save settings.');
      setSettingsError(message);
      defaultToastError(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setSettingsSaving(false);
    }
  }, [accessAuditEventsPage, activeProfileId, loadAccessAuditEventsState]);

  const handleUpdateRuntimeModelConfig = useCallback(
    async (
      nextConfig: Omit<UpdateRuntimeModelConfigRequest, 'profileId'>,
      options: {
        scope?: 'page' | 'drawer';
      } = {}
    ) => {
      const scope = options.scope ?? 'page';
      const setLoading = scope === 'drawer' ? setProviderDrawerLoading : setModelProviderLoading;
      const setError = scope === 'drawer' ? setProviderDrawerError : setModelProviderError;
      if (!activeProfileId) {
        const message = 'Select a real Hermes profile before changing model settings.';
        setError(message);
        throw new Error(message);
      }

      setLoading(true);
      setError(null);

      try {
        const response = await updateRuntimeModelConfig({
          profileId: activeProfileId,
          ...nextConfig
        });
        setModelProviderResponse(response);
        setInspectedProviderId(response.inspectedProviderId);
        toaster.success({
          title: 'Runtime config saved',
          description: `${response.config.provider} is now active for this profile.`,
          closable: true
        });
        return response;
      } catch (error) {
        const message = getErrorMessage(error, 'Failed to update model and provider settings.');
        setError(message);
        defaultToastError(message);
        throw error instanceof Error ? error : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [activeProfileId]
  );

  const handleConnectProvider = useCallback(
    async (
      provider: string,
      apiKey: string,
      label?: string,
      options: {
        scope?: 'page' | 'drawer';
        baseUrl?: string;
        apiMode?: string;
      } = {}
    ) => {
      const scope = options.scope ?? 'page';
      const setLoading = scope === 'drawer' ? setProviderDrawerLoading : setModelProviderLoading;
      const setError = scope === 'drawer' ? setProviderDrawerError : setModelProviderError;
      if (!activeProfileId) {
        const message = 'Select a real Hermes profile before connecting a provider.';
        setError(message);
        throw new Error(message);
      }

      setLoading(true);
      setError(null);

      try {
        const response = await connectProvider({
          profileId: activeProfileId,
          provider,
          apiKey,
          label,
          baseUrl: options.baseUrl,
          apiMode: options.apiMode
        });
        setModelProviderResponse(response);
        setInspectedProviderId(response.inspectedProviderId);
        await loadSettingsState();
        toaster.success({
          title: 'Provider connected',
          description: `${provider} is ready for this profile.`,
          closable: true
        });
        return response;
      } catch (error) {
        const message = getErrorMessage(error, 'Failed to connect the provider.');
        setError(message);
        defaultToastError(message);
        throw error instanceof Error ? error : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [activeProfileId, loadSettingsState]
  );

  const handleBeginProviderAuth = useCallback(
    async (
      provider: string,
      options: {
        scope?: 'page' | 'drawer';
      } = {}
    ) => {
      const scope = options.scope ?? 'page';
      const setLoading = scope === 'drawer' ? setProviderDrawerLoading : setModelProviderLoading;
      const setError = scope === 'drawer' ? setProviderDrawerError : setModelProviderError;
      if (!activeProfileId) {
        const message = 'Select a real Hermes profile before authorizing a provider.';
        setError(message);
        throw new Error(message);
      }

      setLoading(true);
      setError(null);

      try {
        const response = await beginProviderAuth({
          profileId: activeProfileId,
          provider
        });
        setModelProviderResponse(response);
        setInspectedProviderId(response.inspectedProviderId);
        return response;
      } catch (error) {
        const message = getErrorMessage(error, 'Failed to start provider authorization.');
        setError(message);
        defaultToastError(message);
        throw error instanceof Error ? error : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [activeProfileId]
  );

  const handlePollProviderAuth = useCallback(
    async (
      provider: string,
      authSessionId?: string | null,
      options: {
        scope?: 'page' | 'drawer';
      } = {}
    ) => {
      const scope = options.scope ?? 'page';
      const setLoading = scope === 'drawer' ? setProviderDrawerLoading : setModelProviderLoading;
      const setError = scope === 'drawer' ? setProviderDrawerError : setModelProviderError;
      if (!activeProfileId) {
        const message = 'Select a real Hermes profile before refreshing provider authorization.';
        setError(message);
        throw new Error(message);
      }

      setLoading(true);
      setError(null);

      try {
        const response = await pollProviderAuth({
          profileId: activeProfileId,
          provider,
          authSessionId: authSessionId ?? undefined
        });
        setModelProviderResponse(response);
        setInspectedProviderId(response.inspectedProviderId);
        return response;
      } catch (error) {
        const message = getErrorMessage(error, 'Failed to refresh provider authorization.');
        setError(message);
        defaultToastError(message);
        throw error instanceof Error ? error : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [activeProfileId]
  );

  const handleJobsRefresh = useCallback(async () => {
    if (!activeProfileId) {
      return;
    }

    await loadJobs(activeProfileId);
  }, [activeProfileId, loadJobs]);

  const handleSkillsRefresh = useCallback(async () => {
    if (!activeProfileId) {
      return;
    }

    await loadSkills(activeProfileId);
  }, [activeProfileId, loadSkills]);

  const handleModelProvidersRefresh = useCallback(async () => {
    if (!activeProfileId) {
      return;
    }

    await loadSettingsState();
    await loadModelProviders(activeProfileId, inspectedProviderId).catch(() => undefined);
  }, [activeProfileId, inspectedProviderId, loadModelProviders, loadSettingsState]);

  const handleInspectProvider = useCallback(
    async (providerId: string) => {
      setInspectedProviderId(providerId);
      if (!activeProfileId) {
        const message = 'Select a real Hermes profile before inspecting a provider.';
        setProviderDrawerError(message);
        throw new Error(message);
      }

      return loadModelProviders(activeProfileId, providerId, {
        preserveResponse: true,
        scope: 'drawer'
      });
    },
    [activeProfileId, loadModelProviders]
  );

  const openSessionInTab = useCallback(
    (sessionId: string, title: string) => {
      setOpenTabs((current) => {
        if (current.some((tab) => tab.sessionId === sessionId)) {
          return current.map((tab) => (tab.sessionId === sessionId ? { ...tab, title } : tab));
        }
        return [...current, { sessionId, title }];
      });
    },
    []
  );

  const closeTab = useCallback(
    (sessionId: string) => {
      setOpenTabs((current) => current.filter((tab) => tab.sessionId !== sessionId));
    },
    []
  );

  const reorderTabs = useCallback(
    (reorderedTabs: Array<{ sessionId: string; title: string }>) => {
      setOpenTabs(reorderedTabs);
    },
    []
  );

  // Auto-add the active session to tabs when it loads
  const activeSessionForTabs = sessionPayload?.session;
  useEffect(() => {
    if (activeSessionForTabs && page === 'chat') {
      openSessionInTab(activeSessionForTabs.id, activeSessionForTabs.title);
    }
  }, [activeSessionForTabs, page, openSessionInTab]);

  return {
    bootstrapStatus,
    bootstrapError,
    bootstrap,
    page,
    toolsTab,
    sidebarCollapsed,
    openTabs,
    openSessionInTab,
    closeTab,
    reorderTabs,
    activeProfile,
    activeProfileId,
    activeSessionId,
    sessionsQuery,
    setSessionsQuery,
    sessionsPage,
    sessionsResponse,
    sessionsLoading,
    sessionsError,
    sessionPayload,
    sessionLoading,
    sessionError,
    chatSending: chatSending && (streamingSessionIdRef.current === null || streamingSessionIdRef.current === activeSessionId),
    chatProgress: (streamingSessionIdRef.current === null || streamingSessionIdRef.current === activeSessionId) ? chatProgress : null,
    chatActivities,
    selectedActivityRequestId,
    selectedActivityRequest,
    assistantDraft: (streamingSessionIdRef.current === null || streamingSessionIdRef.current === activeSessionId) ? assistantDraft : '',
    chatAwaitingFinalAssistant: chatAwaitingFinalAssistant && (streamingSessionIdRef.current === null || streamingSessionIdRef.current === activeSessionId),
    chatError,
    jobsResponse,
    jobsLoading,
    jobsError,
    toolsResponse,
    toolsLoading,
    toolsError,
    toolHistoryResponse,
    toolHistoryLoading,
    toolHistoryError,
    toolHistoryPage,
    activeRecipe,
    recipeRuntimeDrawerOpen,
    skillsResponse,
    skillsLoading,
    skillsError,
    settings,
    accessAudit,
    accessAuditEventsResponse,
    accessAuditEventsLoading,
    accessAuditEventsError,
    accessAuditEventsPage,
    telemetryResponse,
    telemetryLoading,
    telemetryError,
    telemetryPage,
    settingsSaving,
    settingsError,
    modelProviderResponse: activeModelProviderResponse,
    modelProviderLoading,
    modelProviderError,
    providerDrawerLoading,
    providerDrawerError,
    runtimeConfigGate,
    inspectedProvider,
    inspectedProviderId: selectedProviderId,
    refreshBootstrap,
    openPage,
    openSession,
    handleToolsTabChange,
    handleProfileChange,
    handleCreateSession,
    handleSessionSearch,
    handleSessionsPageChange,
    handleRenameSession,
    handleDeleteSession,
    handleUpdateRecipe,
    handleApplyRecipeEntryAction,
    handleRenameRecipe,
    handleDeleteRecipe,
    handleRefreshRecipe,
    handleExecuteRecipeAction,
    handleSidebarCollapsedChange,
    handleSendMessage,
    handleSaveSettings,
    handleUpdateRuntimeModelConfig,
    handleConnectProvider,
    handleBeginProviderAuth,
    handlePollProviderAuth,
    handleInspectProvider,
    handleJobsRefresh,
    handleSkillsRefresh,
    handleDeleteSkill,
    handleModelProvidersRefresh,
    focusActivityRequest,
    openRecipeRuntimeRequest,
    setRecipeRuntimeDrawerOpen,
    setToolHistoryPage,
    setTelemetryPage,
    setAccessAuditEventsPage
  };
}
