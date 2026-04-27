import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Box, Button, Checkbox, Drawer, Field, Grid, HStack, Input, NumberInput, NativeSelect, ScrollArea, Spinner, Table, Tabs, Text, VStack } from '@chakra-ui/react';

/* ── Discrete step slider — 240px track + inline value badge ── */
function StepSlider({
  steps,
  value,
  onChange,
  disabled
}: {
  steps: Array<{ value: number; label: string }>;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const idx = Math.max(0, steps.findIndex((s) => String(s.value) === value));
  const currentStep = steps[idx];
  const minLabel = steps[0]?.label;
  const maxLabel = steps[steps.length - 1]?.label;
  return (
    <Box>
      <HStack gap="3" align="center">
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          step={1}
          value={idx}
          disabled={disabled}
          className="settings-step-slider"
          onChange={(e) => {
            const step = steps[Number(e.target.value)];
            if (step) onChange(String(step.value));
          }}
        />
        <Text fontSize="13px" fontWeight="500" color="var(--text-primary)" minW="28px">
          {currentStep?.label ?? value}
        </Text>
      </HStack>
      {minLabel && maxLabel ? (
        <Text fontSize="11px" color="var(--text-muted)" mt="1">
          Range: {minLabel}–{maxLabel}
        </Text>
      ) : null}
    </Box>
  );
}

function msToHuman(ms: string): string {
  const n = Number.parseInt(ms, 10);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n >= 60000 && n % 60000 === 0) return `${n / 60000}m`;
  if (n >= 60000) return `${(n / 60000).toFixed(1)}m`;
  if (n >= 1000 && n % 1000 === 0) return `${n / 1000}s`;
  return `${n}ms`;
}

function parseHumanToMs(str: string): number | null {
  const s = str.trim().toLowerCase();
  if (/^\d+$/.test(s)) return Number.parseInt(s, 10);
  const sec = s.match(/^(\d+(?:\.\d+)?)\s*s(?:ec(?:onds?)?)?$/u);
  if (sec) return Math.round(parseFloat(sec[1]) * 1000);
  const min = s.match(/^(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?)?$/u);
  if (min) return Math.round(parseFloat(min[1]) * 60000);
  return null;
}

import { useHermesTheme } from '@hermes-recipes/ui';
import type {
  AccessAuditSummary,
  AppSettings,
  AuditEventsResponse,
  ModelProviderResponse,
  TelemetryResponse
} from '@hermes-recipes/protocol';
import { EmptyStateCard } from '../molecules/EmptyStateCard';
import { ErrorBanner } from '../molecules/ErrorBanner';

type SettingsTabValue = 'general' | 'model' | 'access_audit' | 'telemetry';

export function SettingsPage({
  settings,
  accessAudit,
  accessAuditEventsResponse,
  accessAuditEventsLoading,
  accessAuditEventsError,
  accessAuditEventsPage,
  onAccessAuditEventsPageChange,
  telemetryResponse,
  telemetryLoading,
  telemetryError,
  telemetryPage,
  onTelemetryPageChange,
  saving: _saving,
  error,
  modelProviderResponse,
  modelProviderLoading,
  modelProviderError,
  providerDrawerLoading,
  providerDrawerError,
  runtimeConfigGate,
  inspectedProvider,
  onSave,
  onUpdateRuntimeModelConfig,
  onTestModelConfig,
  onConnectProvider,
  onBeginProviderAuth,
  onPollProviderAuth,
  onRefreshProviders,
  onInspectProvider
}: {
  settings: AppSettings | null;
  accessAudit: AccessAuditSummary | null;
  accessAuditEventsResponse: AuditEventsResponse | null;
  accessAuditEventsLoading: boolean;
  accessAuditEventsError: string | null;
  accessAuditEventsPage: number;
  onAccessAuditEventsPageChange: (page: number) => void;
  telemetryResponse: TelemetryResponse | null;
  telemetryLoading: boolean;
  telemetryError: string | null;
  telemetryPage: number;
  onTelemetryPageChange: (page: number) => void;
  saving: boolean;
  error: string | null;
  modelProviderResponse: ModelProviderResponse | null;
  modelProviderLoading: boolean;
  modelProviderError: string | null;
  providerDrawerLoading: boolean;
  providerDrawerError: string | null;
  runtimeConfigGate: {
    status: 'checking' | 'ready' | 'blocked';
    code: string;
    message: string;
    providerId: string | null;
    modelId: string | null;
  };
  inspectedProvider: ModelProviderResponse['providers'][number] | null;
  onSave: (settings: Partial<AppSettings>) => Promise<void> | void;
  onUpdateRuntimeModelConfig: (
    nextConfig: Partial<Pick<ModelProviderResponse['config'], 'defaultModel' | 'provider' | 'baseUrl' | 'apiMode' | 'maxTurns' | 'reasoningEffort'>>,
    options?: {
      scope?: 'page' | 'drawer';
    }
  ) => Promise<unknown> | void;
  onTestModelConfig: (profileId: string, defaultModel: string, provider?: string) => Promise<{ ok: boolean; message: string; latencyMs: number }>;
  onConnectProvider: (
    provider: string,
    apiKey: string,
    label?: string,
    options?: { scope?: 'page' | 'drawer'; baseUrl?: string; apiMode?: string }
  ) => Promise<unknown> | void;
  onBeginProviderAuth: (providerId: string, options?: { scope?: 'page' | 'drawer' }) => Promise<unknown> | void;
  onPollProviderAuth: (
    providerId: string,
    authSessionId?: string | null,
    options?: { scope?: 'page' | 'drawer' }
  ) => Promise<unknown> | void;
  onRefreshProviders: () => Promise<void> | void;
  onInspectProvider: (providerId: string) => Promise<unknown> | void;
}) {
  const [currentTab, setCurrentTab] = useState<SettingsTabValue>('general');
  const { themeMode: activeThemeMode } = useHermesTheme();
  const [themeMode, setThemeMode] = useState<AppSettings['themeMode']>('dark');
  const [themeDirty, setThemeDirty] = useState(false);
  const [sessionsPageSize, setSessionsPageSize] = useState('50');
  const [chatTimeoutMs, setChatTimeoutMs] = useState('180000');
  const [discoveryTimeoutMs, setDiscoveryTimeoutMs] = useState('240000');
  const [nearbySearchTimeoutMs, setNearbySearchTimeoutMs] = useState('300000');
  const [recipeOperationTimeoutMs, setRecipeOperationTimeoutMs] = useState('180000');
  const [unrestrictedTimeoutMs, setUnrestrictedTimeoutMs] = useState('1800000');
  const [restrictedChatMaxTurns, setRestrictedChatMaxTurns] = useState('8');
  /* Human-readable display values for timeout inputs */
  const [chatTimeoutDisplay, setChatTimeoutDisplay] = useState(() => msToHuman('180000'));
  const [discoveryTimeoutDisplay, setDiscoveryTimeoutDisplay] = useState(() => msToHuman('240000'));
  const [nearbySearchTimeoutDisplay, setNearbySearchTimeoutDisplay] = useState(() => msToHuman('300000'));
  const [recipeOperationTimeoutDisplay, setRecipeOperationTimeoutDisplay] = useState(() => msToHuman('180000'));
  const [unrestrictedAccessEnabled, setUnrestrictedAccessEnabled] = useState(false);

  const [defaultModel, setDefaultModel] = useState('');
  const [provider, setProvider] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiMode, setApiMode] = useState('');
  const [maxTurns, setMaxTurns] = useState('150');
  const [reasoningEffort, setReasoningEffort] = useState('');
  const [providerDrawerOpen, setProviderDrawerOpen] = useState(false);
  const [drawerProviderId, setDrawerProviderId] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState('');
  const [modelVerifyStatus, setModelVerifyStatus] = useState<'idle' | 'testing' | 'passed' | 'failed'>('idle');
  const [modelVerifyError, setModelVerifyError] = useState<string | null>(null);
  const [pendingModel, setPendingModel] = useState<string | null>(null);

  const [providerLabel, setProviderLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const providerDrawerFinalFocusRef = useRef<HTMLElement | null>(null);
  const showModelProviderErrorBanner = Boolean(modelProviderError && runtimeConfigGate.status === 'blocked');
  const runtimeConfigBlockedTitle =
    runtimeConfigGate.code === 'runtime_state_unavailable' ? 'Runtime configuration unavailable' : 'Runtime configuration required';

  useEffect(() => {
    if (!settings) {
      return;
    }

    if (!themeDirty || settings.themeMode === themeMode) {
      setThemeMode(settings.themeMode);
    }
    if (settings.themeMode === themeMode) {
      setThemeDirty(false);
    }
    setSessionsPageSize(String(settings.sessionsPageSize));
    setChatTimeoutMs(String(settings.chatTimeoutMs));
    setDiscoveryTimeoutMs(String(settings.discoveryTimeoutMs));
    setNearbySearchTimeoutMs(String(settings.nearbySearchTimeoutMs));
    setRecipeOperationTimeoutMs(String(settings.recipeOperationTimeoutMs));
    setUnrestrictedTimeoutMs(String(settings.unrestrictedTimeoutMs));
    setRestrictedChatMaxTurns(String(settings.restrictedChatMaxTurns));
    setUnrestrictedAccessEnabled(settings.unrestrictedAccessEnabled);
  }, [
    settings,
    themeDirty,
    themeMode
  ]);

  useEffect(() => {
    if (activeThemeMode === themeMode) {
      return;
    }

    setThemeMode(activeThemeMode);
  }, [activeThemeMode, themeMode]);

  useEffect(() => {
    if (!modelProviderResponse) {
      return;
    }

    setDefaultModel(modelProviderResponse.config.defaultModel);
    setProvider(modelProviderResponse.config.provider);
    setBaseUrl(modelProviderResponse.config.baseUrl ?? '');
    setApiMode(modelProviderResponse.config.apiMode ?? '');
    setMaxTurns(String(modelProviderResponse.config.maxTurns));
    setReasoningEffort(modelProviderResponse.config.reasoningEffort ?? '');
    // Clear pending verify state when provider response refreshes
    setPendingModel(null);
    setModelVerifyStatus('idle');
    setModelVerifyError(null);
  }, [modelProviderResponse]);

  const selectedProvider = useMemo(
    () => modelProviderResponse?.providers.find((item) => item.id === provider) ?? modelProviderResponse?.providers[0] ?? null,
    [modelProviderResponse?.providers, provider]
  );
  const drawerProvider = useMemo(() => {
    if (!drawerProviderId) {
      return null;
    }

    return (
      modelProviderResponse?.providers.find((item) => item.id === drawerProviderId) ??
      (inspectedProvider?.id === drawerProviderId ? inspectedProvider : null)
    );
  }, [drawerProviderId, inspectedProvider, modelProviderResponse?.providers]);
  const drawerProviderDetails = drawerProvider ?? selectedProvider;
  const selectedProviderConfigurationFields = selectedProvider?.configurationFields ?? [];
  const providerConfigurationFields = drawerProviderDetails?.configurationFields ?? [];
  const selectedProviderModelField = selectedProviderConfigurationFields.find((field) => field.key === 'defaultModel') ?? null;
  const drawerProviderModelField = providerConfigurationFields.find((field) => field.key === 'defaultModel') ?? null;
  const selectedModel = useMemo(
    () => selectedProvider?.models.find((item) => item.id === defaultModel) ?? null,
    [defaultModel, selectedProvider?.models]
  );
  const shouldShowReasoningEffort = Boolean(selectedModel?.supportsReasoningEffort);
  const providerConfigCanSave = providerConfigurationFields.some((field) => !field.secret && ['defaultModel', 'baseUrl', 'apiMode'].includes(field.key));
  const providerConfigBlocked =
    drawerProviderModelField?.input === 'select' &&
    drawerProviderModelField.disabled &&
    drawerProviderModelField.options.length === 0;
  const providerConfigHasMissingRequiredValue = providerConfigurationFields.some(
    (field) =>
      !field.disabled &&
      !field.secret &&
      field.required &&
      getConfigurationFieldValue(field.key, field.value ?? '').trim().length === 0
  );
  const providerDrawerAuthPending = Boolean(
    drawerProviderDetails?.authSession && ['pending', 'verifying'].includes(drawerProviderDetails.authSession.status)
  );
  const drawerProviderAuthSession = drawerProviderDetails?.authSession ?? null;
  const shouldShowBeginAuth =
    Boolean(drawerProviderDetails?.supportsOAuth) &&
    drawerProviderDetails?.state === 'needs_oauth';
  const shouldShowConnectProvider =
    Boolean(drawerProviderDetails?.supportsApiKey) &&
    ['unconfigured', 'needs_api_key', 'invalid_credentials', 'config_error'].includes(drawerProviderDetails?.state ?? '');

  function getConfigurationFieldValue(fieldKey: string, fallback = '') {
    switch (fieldKey) {
      case 'label':
        return providerLabel;
      case 'apiKey':
        return apiKey;
      case 'baseUrl':
        return baseUrl;
      case 'apiMode':
        return apiMode;
      case 'defaultModel':
        return defaultModel;
      default:
        return fallback;
    }
  }

  useEffect(() => {
    if (!drawerProviderDetails) {
      return;
    }

    const defaultModelField = drawerProviderDetails.configurationFields.find((field) => field.key === 'defaultModel');
    const baseUrlField = drawerProviderDetails.configurationFields.find((field) => field.key === 'baseUrl');
    const apiModeField = drawerProviderDetails.configurationFields.find((field) => field.key === 'apiMode');

    setDefaultModel(defaultModelField?.value ?? '');
    setBaseUrl(baseUrlField?.value ?? '');
    setApiMode(apiModeField?.value ?? '');
    setProviderLabel('');
    setApiKey('');
  }, [drawerProviderDetails]);

  function setConfigurationFieldValue(fieldKey: string, value: string) {
    switch (fieldKey) {
      case 'label':
        setProviderLabel(value);
        break;
      case 'apiKey':
        setApiKey(value);
        break;
      case 'baseUrl':
        setBaseUrl(value);
        break;
      case 'apiMode':
        setApiMode(value);
        break;
      case 'defaultModel':
        setDefaultModel(value);
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    if (shouldShowReasoningEffort) {
      return;
    }

    setReasoningEffort('');
  }, [shouldShowReasoningEffort]);

  function openProviderDrawer(providerId: string) {
    providerDrawerFinalFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setProvider(providerId);
    setDrawerProviderId(providerId);
    setProviderDrawerOpen(true);
    void Promise.resolve(onInspectProvider(providerId)).catch(() => undefined);
  }

  useEffect(() => {
    if (
      !providerDrawerOpen ||
      !drawerProviderId ||
      providerDrawerLoading ||
      !drawerProviderDetails ||
      !providerDrawerAuthPending ||
      !drawerProviderAuthSession
    ) {
      return;
    }

    const pollIntervalMs = Math.max(1_000, drawerProviderAuthSession.pollAfterMs ?? 5_000);

    const interval = globalThis.setInterval(() => {
      void Promise.resolve(
        onPollProviderAuth(drawerProviderId, drawerProviderAuthSession.id, {
          scope: 'drawer'
        })
      ).catch(() => undefined);
    }, pollIntervalMs);

    return () => {
      globalThis.clearInterval(interval);
    };
  }, [
    drawerProviderAuthSession,
    providerDrawerAuthPending,
    drawerProviderDetails,
    drawerProviderId,
    onPollProviderAuth,
    providerDrawerLoading,
    providerDrawerOpen
  ]);

  /* Sync display values when underlying ms state changes (e.g. on settings load) */
  useEffect(() => { setChatTimeoutDisplay(msToHuman(chatTimeoutMs)); }, [chatTimeoutMs]);
  useEffect(() => { setDiscoveryTimeoutDisplay(msToHuman(discoveryTimeoutMs)); }, [discoveryTimeoutMs]);
  useEffect(() => { setNearbySearchTimeoutDisplay(msToHuman(nearbySearchTimeoutMs)); }, [nearbySearchTimeoutMs]);
  useEffect(() => { setRecipeOperationTimeoutDisplay(msToHuman(recipeOperationTimeoutMs)); }, [recipeOperationTimeoutMs]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(overrides: Partial<{
    sessionsPageSize: string;
    chatTimeoutMs: string;
    discoveryTimeoutMs: string;
    nearbySearchTimeoutMs: string;
    recipeOperationTimeoutMs: string;
    unrestrictedTimeoutMs: string;
    restrictedChatMaxTurns: string;
    unrestrictedAccessEnabled: boolean;
  }> = {}) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void onSave({
        themeMode,
        sessionsPageSize: Number.parseInt(overrides.sessionsPageSize ?? sessionsPageSize, 10),
        chatTimeoutMs: Number.parseInt(overrides.chatTimeoutMs ?? chatTimeoutMs, 10),
        discoveryTimeoutMs: Number.parseInt(overrides.discoveryTimeoutMs ?? discoveryTimeoutMs, 10),
        nearbySearchTimeoutMs: Number.parseInt(overrides.nearbySearchTimeoutMs ?? nearbySearchTimeoutMs, 10),
        recipeOperationTimeoutMs: Number.parseInt(overrides.recipeOperationTimeoutMs ?? recipeOperationTimeoutMs, 10),
        unrestrictedTimeoutMs: Number.parseInt(overrides.unrestrictedTimeoutMs ?? unrestrictedTimeoutMs, 10),
        restrictedChatMaxTurns: Number.parseInt(overrides.restrictedChatMaxTurns ?? restrictedChatMaxTurns, 10),
        unrestrictedAccessEnabled: overrides.unrestrictedAccessEnabled ?? unrestrictedAccessEnabled
      });
    }, 600);
  }

  const modelSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleModelSave(overrides: Partial<{
    defaultModel: string;
    provider: string;
    baseUrl: string;
    apiMode: string;
    maxTurns: string;
    reasoningEffort: string;
  }> = {}) {
    if (modelSaveTimerRef.current) clearTimeout(modelSaveTimerRef.current);
    modelSaveTimerRef.current = setTimeout(() => {
      const nextBaseUrl = (overrides.baseUrl ?? baseUrl).trim();
      const nextApiMode = (overrides.apiMode ?? apiMode).trim();
      const nextReasoningEffort = (overrides.reasoningEffort ?? reasoningEffort).trim();
      void Promise.resolve(
        onUpdateRuntimeModelConfig({
          defaultModel: overrides.defaultModel ?? defaultModel,
          provider: overrides.provider ?? provider,
          baseUrl: nextBaseUrl.length > 0 ? nextBaseUrl : undefined,
          apiMode: nextApiMode.length > 0 ? nextApiMode : undefined,
          maxTurns: Number.parseInt(overrides.maxTurns ?? maxTurns, 10),
          reasoningEffort: nextReasoningEffort.length > 0 ? nextReasoningEffort : undefined
        })
      ).catch(() => undefined);
    }, 600);
  }

  if (!settings) {
    return (
      <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-elevated)" px="5" py="5" boxShadow="var(--shadow-sm)">
        <EmptyStateCard title="Loading settings" detail="Reading persisted bridge and browser preferences." />
      </Box>
    );
  }

  return (
    <Tabs.Root
      value={currentTab}
      onValueChange={(event) => setCurrentTab(event.value as SettingsTabValue)}
      h="100%"
      minH={0}
      display="flex"
      flexDirection="column"
      variant="plain"
      lazyMount
    >
      <Box borderBottom="1px solid var(--divider)" flexShrink={0}>
        <Tabs.List gap="0" px="0" borderBottom="none">
          {(['general', 'model', 'access_audit', 'telemetry'] as const).map((v) => (
            <Tabs.Trigger
              key={v}
              value={v}
              fontSize="13px"
              px="4"
              h="44px"
              color="var(--text-muted)"
              fontWeight="400"
              borderBottom="2px solid transparent"
              mb="-1px"
              transition="color 120ms ease, border-color 120ms ease"
              _selected={{ color: 'var(--text-primary)', fontWeight: '500', borderBottomColor: 'var(--accent)' }}
              _hover={{ color: 'var(--text-secondary)' }}
            >
              {v === 'general' ? 'Settings' : v === 'model' ? 'Models' : v === 'access_audit' ? 'Access' : 'Audit'}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Box>

      {(error || (showModelProviderErrorBanner && modelProviderError)) ? (
        <VStack align="stretch" gap="2" pt="3">
          {error ? <ErrorBanner title="Settings save failed" detail={error} /> : null}
          {showModelProviderErrorBanner && modelProviderError ? (
            <ErrorBanner title="Runtime configuration unavailable" detail={modelProviderError} />
          ) : null}
        </VStack>
      ) : null}

      <Tabs.ContentGroup flex="1" minH={0}>
        <SettingsTabPanel value="general">
          <SectionCard
            title="Local preferences"
            description="Preferences save automatically when changed."
          >
            <VStack align="stretch" gap="5">
              <Field.Root>
                <Field.Label color="var(--text-secondary)">Sessions page size</Field.Label>
                <StepSlider
                  steps={[{ value: 25, label: '25' }, { value: 50, label: '50' }, { value: 100, label: '100' }]}
                  value={sessionsPageSize}
                  onChange={(v) => { setSessionsPageSize(v); scheduleSave({ sessionsPageSize: v }); }}
                />
              </Field.Root>

              <Field.Root disabled={unrestrictedAccessEnabled}>
                <Field.Label color="var(--text-secondary)">Restricted max turns</Field.Label>
                <StepSlider
                  steps={[{ value: 4, label: '4' }, { value: 8, label: '8' }, { value: 16, label: '16' }, { value: 32, label: '32' }]}
                  value={restrictedChatMaxTurns}
                  disabled={unrestrictedAccessEnabled}
                  onChange={(v) => { setRestrictedChatMaxTurns(v); scheduleSave({ restrictedChatMaxTurns: v }); }}
                />
                <Field.HelperText color="var(--text-muted)">
                  {unrestrictedAccessEnabled ? 'Ignored while Unrestricted Access is enabled.' : 'Used only while restricted mode stays enabled.'}
                </Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label color="var(--text-secondary)">Normal chat timeout</Field.Label>
                <Input
                  value={chatTimeoutDisplay}
                  onChange={(e) => setChatTimeoutDisplay(e.currentTarget.value)}
                  onBlur={() => {
                    const ms = parseHumanToMs(chatTimeoutDisplay);
                    if (ms !== null && ms >= 1000) {
                      const s = String(ms); setChatTimeoutMs(s); scheduleSave({ chatTimeoutMs: s });
                    } else { setChatTimeoutDisplay(msToHuman(chatTimeoutMs)); }
                  }}
                  size="sm" w="160px" bg="var(--surface-2)" borderColor="var(--border-subtle)"
                  rounded="var(--radius-control)" _placeholder={{ color: 'var(--text-muted)' }}
                />
                <Field.HelperText color="var(--text-muted)">Default timeout for regular chat requests — {msToHuman(chatTimeoutMs)}</Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label color="var(--text-secondary)">Search / discovery timeout</Field.Label>
                <Input
                  value={discoveryTimeoutDisplay}
                  onChange={(e) => setDiscoveryTimeoutDisplay(e.currentTarget.value)}
                  onBlur={() => {
                    const ms = parseHumanToMs(discoveryTimeoutDisplay);
                    if (ms !== null && ms >= 1000) {
                      const s = String(ms); setDiscoveryTimeoutMs(s); scheduleSave({ discoveryTimeoutMs: s });
                    } else { setDiscoveryTimeoutDisplay(msToHuman(discoveryTimeoutMs)); }
                  }}
                  size="sm" w="160px" bg="var(--surface-2)" borderColor="var(--border-subtle)"
                  rounded="var(--radius-control)" _placeholder={{ color: 'var(--text-muted)' }}
                />
                <Field.HelperText color="var(--text-muted)">Broad search & recommendations — {msToHuman(discoveryTimeoutMs)}</Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label color="var(--text-secondary)">Nearby / local-search timeout</Field.Label>
                <Input
                  value={nearbySearchTimeoutDisplay}
                  onChange={(e) => setNearbySearchTimeoutDisplay(e.currentTarget.value)}
                  onBlur={() => {
                    const ms = parseHumanToMs(nearbySearchTimeoutDisplay);
                    if (ms !== null && ms >= 1000) {
                      const s = String(ms); setNearbySearchTimeoutMs(s); scheduleSave({ nearbySearchTimeoutMs: s });
                    } else { setNearbySearchTimeoutDisplay(msToHuman(nearbySearchTimeoutMs)); }
                  }}
                  size="sm" w="160px" bg="var(--surface-2)" borderColor="var(--border-subtle)"
                  rounded="var(--radius-control)" _placeholder={{ color: 'var(--text-muted)' }}
                />
                <Field.HelperText color="var(--text-muted)">Nearby places & local search — {msToHuman(nearbySearchTimeoutMs)}</Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label color="var(--text-secondary)">Recipe timeout</Field.Label>
                <Input
                  value={recipeOperationTimeoutDisplay}
                  onChange={(e) => setRecipeOperationTimeoutDisplay(e.currentTarget.value)}
                  onBlur={() => {
                    const ms = parseHumanToMs(recipeOperationTimeoutDisplay);
                    if (ms !== null && ms >= 1000) {
                      const s = String(ms); setRecipeOperationTimeoutMs(s); scheduleSave({ recipeOperationTimeoutMs: s });
                    } else { setRecipeOperationTimeoutDisplay(msToHuman(recipeOperationTimeoutMs)); }
                  }}
                  size="sm" w="160px" bg="var(--surface-2)" borderColor="var(--border-subtle)"
                  rounded="var(--radius-control)" _placeholder={{ color: 'var(--text-muted)' }}
                />
                <Field.HelperText color="var(--text-muted)">Recipe creation & workspace updates — {msToHuman(recipeOperationTimeoutMs)}</Field.HelperText>
              </Field.Root>
            </VStack>
          </SectionCard>

          <SectionCard
            title="Runtime access"
            description="Use the Hermes runtime without the bridge turn limiter or reviewed restrictions."
          >
            <Box data-testid="settings-danger-zone" rounded="8px" border="1px solid rgba(177, 86, 47, 0.28)" bg="rgba(177, 86, 47, 0.08)" px="4" py="4">
              <HStack align="start" gap="3">
                <WarningBadge />
                <VStack align="stretch" gap="3">
                  <Text fontWeight="700" color="var(--text-primary)">
                    High-risk mode
                  </Text>
                  <Text color="var(--text-secondary)">
                    When enabled, Hermes can run with full autonomy through the local bridge. Restrictive turn limits are ignored, and actions may proceed without the reviewed bridge path.
                  </Text>
                  <Checkbox.Root
                    checked={unrestrictedAccessEnabled}
                    onCheckedChange={(event) => {
                      const next = !!event.checked;
                      setUnrestrictedAccessEnabled(next);
                      scheduleSave({ unrestrictedAccessEnabled: next });
                    }}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>I understand the risk and want unrestricted runtime access.</Checkbox.Label>
                  </Checkbox.Root>
                  <Field.Root>
                    <Field.Label color="var(--text-secondary)">Unrestricted timeout</Field.Label>
                    <NumberInput.Root
                      value={unrestrictedTimeoutMs}
                      onValueChange={(d) => { setUnrestrictedTimeoutMs(d.value); scheduleSave({ unrestrictedTimeoutMs: d.value }); }}
                      min={1000}
                      size="sm"
                    >
                      <NumberInput.Input bg="var(--surface-2)" borderColor="var(--border-subtle)" />
                    </NumberInput.Root>
                    <Field.HelperText color="var(--text-muted)">
                      Maximum bridge timeout (ms) used only while Unrestricted Access is enabled.
                    </Field.HelperText>
                  </Field.Root>
                </VStack>
              </HStack>
            </Box>
          </SectionCard>
        </SettingsTabPanel>

        <SettingsTabPanel value="model">
          <VStack align="stretch" gap="4">
            {runtimeConfigGate.status === 'blocked' && !showModelProviderErrorBanner ? (
              <ErrorBanner title={runtimeConfigBlockedTitle} detail={runtimeConfigGate.message} />
            ) : runtimeConfigGate.status === 'checking' ? (
              <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-1)" px="4" py="3">
                <HStack align="start" gap="3">
                  <Spinner size="sm" color="blue.500" mt="1" />
                  <VStack align="stretch" gap="1">
                    <Text fontWeight="700" color="var(--text-primary)">
                      Checking runtime configuration
                    </Text>
                    <Text color="var(--text-secondary)">{runtimeConfigGate.message}</Text>
                  </VStack>
                </HStack>
              </Box>
            ) : null}

            <SectionCard
              title="Model and provider routing"
              description="Profile-scoped runtime options. Changes save automatically."
              action={
                <HStack gap="2" wrap="wrap">
                  <Button variant="outline" onClick={() => void onRefreshProviders()} loading={modelProviderLoading}>
                    Refresh
                  </Button>
                  <Button variant="outline" onClick={() => (selectedProvider ? openProviderDrawer(selectedProvider.id) : undefined)} disabled={!selectedProvider}>
                    Configure provider
                  </Button>
                </HStack>
              }
            >
              {!modelProviderResponse ? (
                <EmptyStateCard title="Loading runtime config" detail="Reading model/provider state from Hermes." />
              ) : (
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }} gap="4">
                  <Field.Root>
                    <Field.Label color="var(--text-secondary)">Provider</Field.Label>
                    <NativeSelect.Root size="sm" variant="subtle" bg="var(--surface-2)">
                      <NativeSelect.Field
                        value={provider}
                        onChange={(event) => {
                          const nextProviderId = event.currentTarget.value;
                          setProvider(nextProviderId);
                          scheduleModelSave({ provider: nextProviderId });
                        }}
                      >
                        {modelProviderResponse.providers.map((item) => (
                          <option key={item.id} value={item.id} disabled={item.disabled}>
                            {item.displayName}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    {selectedProvider?.disabledReason ? <Field.HelperText color="var(--text-muted)">{selectedProvider.disabledReason}</Field.HelperText> : null}
                    {selectedProvider?.stateMessage ? <Field.HelperText color="var(--text-muted)">{selectedProvider.stateMessage}</Field.HelperText> : null}
                  </Field.Root>

                  <Field.Root disabled={selectedProvider?.disabled}>
                    <Field.Label color="var(--text-secondary)">Default model</Field.Label>
                    {selectedProviderModelField?.input === 'select' ? (
                      (() => {
                        const allOptions = selectedProviderModelField.options;
                        const isLargeList = allOptions.length > 12;
                        const filtered = isLargeList && modelSearch.trim()
                          ? allOptions.filter((o) =>
                              o.value.toLowerCase().includes(modelSearch.toLowerCase()) ||
                              o.label.toLowerCase().includes(modelSearch.toLowerCase())
                            )
                          : allOptions;

                        return (
                          <VStack align="stretch" gap="1.5">
                            {isLargeList ? (
                              <Input
                                size="sm"
                                value={modelSearch}
                                placeholder="Filter models…"
                                bg="var(--surface-2)"
                                borderColor="var(--border-subtle)"
                                fontSize="xs"
                                onChange={(e) => setModelSearch(e.currentTarget.value)}
                              />
                            ) : null}
                            <NativeSelect.Root size="sm" variant="subtle" bg="var(--surface-2)" disabled={selectedProviderModelField.disabled}>
                              <NativeSelect.Field
                                value={allOptions.length === 0 ? '' : defaultModel}
                                onChange={(event) => {
                                  const next = event.currentTarget.value;
                                  setDefaultModel(next);
                                  setModelSearch('');
                                  setPendingModel(next);
                                  setModelVerifyStatus('idle');
                                  setModelVerifyError(null);
                                  // Don't auto-save — require verification first
                                }}
                              >
                                {allOptions.length === 0 ? (
                                  <option value="">Model discovery unavailable</option>
                                ) : null}
                                {filtered.map((item) => (
                                  <option key={item.value} value={item.value} disabled={item.disabled}>
                                    {item.label}
                                  </option>
                                ))}
                                {isLargeList && filtered.length === 0 ? (
                                  <option value="" disabled>No models match filter</option>
                                ) : null}
                              </NativeSelect.Field>
                              <NativeSelect.Indicator />
                            </NativeSelect.Root>
                            {isLargeList ? (
                              <Text fontSize="10px" color="var(--text-muted)">
                                {filtered.length} of {allOptions.length} models shown
                                {defaultModel ? ` · active: ${defaultModel}` : ''}
                              </Text>
                            ) : null}
                            <ModelVerifyBar
                              pendingModel={pendingModel}
                              currentModel={modelProviderResponse?.config.defaultModel ?? null}
                              status={modelVerifyStatus}
                              errorMessage={modelVerifyError}
                              onVerify={async () => {
                                const profileId = modelProviderResponse?.config.profileId;
                                if (!profileId || !pendingModel) return;
                                setModelVerifyStatus('testing');
                                setModelVerifyError(null);
                                try {
                                  const result = await onTestModelConfig(profileId, pendingModel, provider || undefined);
                                  if (result.ok) {
                                    setModelVerifyStatus('passed');
                                    setPendingModel(null);
                                    scheduleModelSave({ defaultModel: pendingModel });
                                  } else {
                                    setModelVerifyStatus('failed');
                                    setModelVerifyError(result.message);
                                    setDefaultModel(modelProviderResponse?.config.defaultModel ?? defaultModel);
                                  }
                                } catch (err) {
                                  setModelVerifyStatus('failed');
                                  setModelVerifyError(err instanceof Error ? err.message : 'Verification failed.');
                                  setDefaultModel(modelProviderResponse?.config.defaultModel ?? defaultModel);
                                }
                              }}
                            />
                          </VStack>
                        );
                      })()
                    ) : selectedProviderModelField?.input === 'text' ? (
                      <VStack align="stretch" gap="1.5">
                        <Input
                          size="sm"
                          value={defaultModel}
                          placeholder={selectedProviderModelField.placeholder ?? 'Enter model ID'}
                          bg="var(--surface-2)"
                          borderColor="var(--border-subtle)"
                          onChange={(event) => {
                            const next = event.currentTarget.value;
                            setDefaultModel(next);
                            setPendingModel(next);
                            setModelVerifyStatus('idle');
                            setModelVerifyError(null);
                          }}
                        />
                        <ModelVerifyBar
                          pendingModel={pendingModel}
                          currentModel={modelProviderResponse?.config.defaultModel ?? null}
                          status={modelVerifyStatus}
                          errorMessage={modelVerifyError}
                          onVerify={async () => {
                            const profileId = modelProviderResponse?.config.profileId;
                            if (!profileId || !pendingModel) return;
                            setModelVerifyStatus('testing');
                            setModelVerifyError(null);
                            try {
                              const result = await onTestModelConfig(profileId, pendingModel, provider || undefined);
                              if (result.ok) {
                                setModelVerifyStatus('passed');
                                setPendingModel(null);
                                scheduleModelSave({ defaultModel: pendingModel });
                              } else {
                                setModelVerifyStatus('failed');
                                setModelVerifyError(result.message);
                                setDefaultModel(modelProviderResponse?.config.defaultModel ?? defaultModel);
                              }
                            } catch (err) {
                              setModelVerifyStatus('failed');
                              setModelVerifyError(err instanceof Error ? err.message : 'Verification failed.');
                              setDefaultModel(modelProviderResponse?.config.defaultModel ?? defaultModel);
                            }
                          }}
                        />
                      </VStack>
                    ) : (
                      <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="3" py="2.5">
                        <Text fontSize="sm" color="var(--text-secondary)">
                          Model discovery is unavailable for this provider right now.
                        </Text>
                      </Box>
                    )}
                    {selectedProviderModelField?.description ? (
                      <Field.HelperText color="var(--text-muted)">
                        {selectedProviderModelField.description}
                      </Field.HelperText>
                    ) : null}
                    {selectedProviderModelField?.disabledReason ? (
                      <Field.HelperText color="var(--text-muted)">{selectedProviderModelField.disabledReason}</Field.HelperText>
                    ) : null}
                    {selectedProvider?.disabledReason ? <Field.HelperText color="var(--text-muted)">{selectedProvider.disabledReason}</Field.HelperText> : null}
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color="var(--text-secondary)">Max turns</Field.Label>
                    <Input
                      type="number"
                      value={maxTurns}
                      bg="var(--surface-2)"
                      borderColor="var(--border-subtle)"
                      onChange={(event) => { setMaxTurns(event.currentTarget.value); scheduleModelSave({ maxTurns: event.currentTarget.value }); }}
                    />
                  </Field.Root>

                  {shouldShowReasoningEffort ? (
                    <Field.Root>
                      <Field.Label color="var(--text-secondary)">Reasoning effort</Field.Label>
                      <NativeSelect.Root size="sm" variant="subtle" bg="var(--surface-2)">
                        <NativeSelect.Field
                          value={reasoningEffort}
                          onChange={(event) => { setReasoningEffort(event.currentTarget.value); scheduleModelSave({ reasoningEffort: event.currentTarget.value }); }}
                        >
                          <option value="">default</option>
                          {(selectedModel?.reasoningEffortOptions ?? []).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                  ) : null}
                </Grid>
              )}
            </SectionCard>

            <SectionCard title="Provider connections" description="Discovered provider capabilities and local connection status.">
              {!modelProviderResponse ? (
                <EmptyStateCard title="Loading providers" detail="Reading provider credentials and Hermes auth state." />
              ) : (
                <VStack align="stretch" gap="3">
                  <Table.ScrollArea data-testid="provider-table-scroll" borderWidth="1px" borderColor="var(--border-subtle)" rounded="8px">
                    <Table.Root size="sm" variant="outline" minW="760px">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>Provider</Table.ColumnHeader>
                          <Table.ColumnHeader>Status</Table.ColumnHeader>
                          <Table.ColumnHeader>Auth</Table.ColumnHeader>
                          <Table.ColumnHeader>Credential</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {modelProviderResponse.providers.map((item) => (
                          <Table.Row key={item.id}>
                            <Table.Cell>
                              <Text fontWeight="700" color="var(--text-primary)">
                                {item.displayName}
                              </Text>
                              {(item.description ?? item.notes) ? (
                                <Text fontSize="sm" color="var(--text-secondary)">
                                  {item.description ?? item.notes}
                                </Text>
                              ) : null}
                            </Table.Cell>
                            <Table.Cell>
                              <HStack gap="1.5" align="center">
                                <span className={
                                  item.status === 'connected'
                                    ? 'status-dot status-dot--connected'
                                    : item.status === 'missing'
                                      ? 'status-dot status-dot--reconnecting'
                                      : 'status-dot status-dot--disconnected'
                                } />
                                <Text fontSize="12px" color="var(--text-secondary)">{item.status}</Text>
                              </HStack>
                            </Table.Cell>
                            <Table.Cell color="var(--text-secondary)">{item.authKind}</Table.Cell>
                            <Table.Cell color="var(--text-secondary)">
                              {item.maskedCredential ?? item.credentialLabel ?? (item.status === 'connected' ? 'Connected' : '—')}
                            </Table.Cell>
                            <Table.Cell textAlign="end">
                              <Button
                                variant="ghost"
                                size="xs"
                                h="6"
                                px="2"
                                rounded="5px"
                                fontSize="12px"
                                fontWeight="400"
                                color="var(--text-muted)"
                                className="table-row-actions"
                                _hover={{ color: 'var(--text-primary)', bg: 'var(--surface-hover)' }}
                                onClick={() => openProviderDrawer(item.id)}
                              >
                                Configure
                              </Button>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Table.ScrollArea>
                </VStack>
              )}
            </SectionCard>
          </VStack>

          <Drawer.Root
            lazyMount
            unmountOnExit
            open={providerDrawerOpen}
            onOpenChange={(event) => {
              setProviderDrawerOpen(event.open);
              if (!event.open) {
                setDrawerProviderId(null);
              }
            }}
            size={{ base: 'full', md: 'md' }}
            finalFocusEl={() =>
              providerDrawerFinalFocusRef.current && providerDrawerFinalFocusRef.current.isConnected
                ? providerDrawerFinalFocusRef.current
                : document.body
            }
          >
            <Drawer.Backdrop backdropFilter="auto" backdropBlur="sm" bg="blackAlpha.500" />
            <Drawer.Positioner>
              <Drawer.Content bg="var(--surface-elevated)" borderLeft="1px solid var(--border-subtle)" data-testid="provider-config-drawer">
                <Drawer.Header>
                  <Drawer.Title color="var(--text-primary)">
                    {drawerProviderDetails?.displayName ?? (drawerProviderId ? 'Loading provider settings' : 'Provider settings')}
                  </Drawer.Title>
                </Drawer.Header>
                <Drawer.Body>
                  {!drawerProviderId ? (
                    <EmptyStateCard title="No provider selected" detail="Choose a provider first to view its runtime configuration." />
                  ) : (
                    <VStack align="stretch" gap="5">
                      {providerDrawerError && !drawerProviderDetails ? (
                        <ErrorBanner title="Provider inspection failed" detail={providerDrawerError} />
                      ) : null}
                      {providerDrawerLoading ? (
                        <EmptyStateCard title="Loading provider settings" detail="Reading runtime configuration for the selected provider." />
                      ) : null}
                      {!drawerProviderDetails ? (
                        <EmptyStateCard title="Provider unavailable" detail="The selected provider is not available in the latest runtime metadata." />
                      ) : null}
                      {drawerProviderDetails ? (
                        <>
                          <VStack align="start" gap="2">
                            <Badge
                              colorPalette={
                                drawerProviderDetails.status === 'connected'
                                  ? 'green'
                                  : drawerProviderDetails.status === 'error'
                                    ? 'red'
                                    : drawerProviderDetails.status === 'missing'
                                      ? 'yellow'
                                      : drawerProviderDetails.disabled
                                        ? 'gray'
                                        : 'gray'
                              }
                            >
                              {drawerProviderDetails.status}
                            </Badge>
                            <Badge colorPalette={drawerProviderDetails.ready ? 'green' : 'orange'}>
                              {drawerProviderDetails.state.replace(/_/g, ' ')}
                            </Badge>
                            <Text color="var(--text-secondary)">
                              {drawerProviderDetails.description ?? drawerProviderDetails.notes ?? 'No extra provider guidance is available.'}
                            </Text>
                            <Text color="var(--text-secondary)">{drawerProviderDetails.stateMessage}</Text>
                            {drawerProviderDetails.disabledReason ? <Text color="var(--text-muted)">{drawerProviderDetails.disabledReason}</Text> : null}
                            {drawerProviderDetails.validation ? (
                              <Text color={drawerProviderDetails.validation.status === 'error' ? 'red.300' : 'var(--text-muted)'}>
                                {drawerProviderDetails.validation.message}
                              </Text>
                            ) : null}
                            {drawerProviderAuthSession ? (
                              <Text color="var(--text-secondary)">{drawerProviderAuthSession.message}</Text>
                            ) : null}
                            {providerDrawerLoading ? <Text color="var(--text-muted)">Refreshing provider details…</Text> : null}
                          </VStack>

                          <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="4" py="3">
                            <VStack align="stretch" gap="3">
                              <Text fontWeight="700" color="var(--text-primary)">
                                Guided setup
                              </Text>
                              <VStack align="stretch" gap="2">
                                {drawerProviderDetails.setupSteps.map((step) => (
                                  <Box key={step.id} rounded="6px" bg="var(--surface-1)" px="3" py="2.5">
                                    <HStack justify="space-between" align="start" gap="3" wrap="wrap">
                                      <VStack align="stretch" gap="1" minW={0}>
                                        <HStack gap="2" wrap="wrap">
                                          <Badge
                                            colorPalette={
                                              step.status === 'completed'
                                                ? 'green'
                                                : step.status === 'action_required'
                                                  ? 'orange'
                                                  : step.status === 'blocked'
                                                    ? 'yellow'
                                                  : step.status === 'disabled'
                                                    ? 'gray'
                                                    : 'blue'
                                            }
                                          >
                                            {step.status.replace('_', ' ')}
                                          </Badge>
                                          <Text fontWeight="700" color="var(--text-primary)">
                                            {step.title}
                                          </Text>
                                        </HStack>
                                        <Text fontSize="sm" color="var(--text-secondary)">
                                          {step.description}
                                        </Text>
                                        {step.command ? (
                                          <Text fontSize="xs" color="var(--text-muted)">
                                            {step.command}
                                          </Text>
                                        ) : null}
                                      </VStack>
                                      {step.actionUrl && step.actionLabel ? (
                                        <Button asChild size="xs" variant="outline" flexShrink={0}>
                                          <a href={step.actionUrl} target="_blank" rel="noopener noreferrer">
                                            {step.actionLabel}
                                          </a>
                                        </Button>
                                      ) : null}
                                    </HStack>
                                  </Box>
                                ))}
                              </VStack>
                            </VStack>
                          </Box>

                          {providerConfigurationFields.length > 0 ? (
                            <VStack align="stretch" gap="4">
                              {providerConfigurationFields.map((field) => (
                                <Field.Root key={field.key} disabled={field.disabled}>
                                  <Field.Label color="var(--text-secondary)">{field.label}</Field.Label>
                                  {field.input === 'select' ? (
                                    <NativeSelect.Root size="sm" variant="subtle" bg="var(--surface-2)" disabled={field.disabled}>
                                      <NativeSelect.Field
                                        value={field.options.length === 0 ? '' : getConfigurationFieldValue(field.key, field.value ?? '')}
                                        onChange={(event) => setConfigurationFieldValue(field.key, event.currentTarget.value)}
                                      >
                                        {field.options.length === 0 ? (
                                          <option value="">{field.placeholder ?? 'Not available'}</option>
                                        ) : null}
                                        {field.options.map((option) => (
                                          <option key={option.value} value={option.value} disabled={option.disabled}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </NativeSelect.Field>
                                      <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                  ) : field.input === 'text' && field.key === 'defaultModel' ? (
                                    <Input
                                      size="sm"
                                      value={getConfigurationFieldValue(field.key, field.value ?? '')}
                                      placeholder={field.placeholder ?? 'Enter model ID'}
                                      bg="var(--surface-2)"
                                      borderColor="var(--border-subtle)"
                                      onChange={(event) => setConfigurationFieldValue(field.key, event.currentTarget.value)}
                                    />
                                  ) : field.key === 'defaultModel' ? (
                                    <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="3" py="2.5">
                                      <Text fontSize="sm" color="var(--text-secondary)">
                                        Manual model entry is disabled. Refresh provider discovery and choose from the discovered model list.
                                      </Text>
                                    </Box>
                                  ) : field.secret ? (
                                    <Input
                                      type="password"
                                      value={getConfigurationFieldValue(field.key)}
                                      onChange={(event) => setConfigurationFieldValue(field.key, event.currentTarget.value)}
                                      bg="var(--surface-2)"
                                      borderColor="var(--border-subtle)"
                                      placeholder={field.placeholder}
                                    />
                                  ) : (
                                    <Input
                                      value={getConfigurationFieldValue(field.key, field.value ?? '')}
                                      onChange={(event) => setConfigurationFieldValue(field.key, event.currentTarget.value)}
                                      bg="var(--surface-2)"
                                      borderColor="var(--border-subtle)"
                                      placeholder={field.placeholder}
                                    />
                                  )}
                                  {field.description ? <Field.HelperText color="var(--text-muted)">{field.description}</Field.HelperText> : null}
                                  {field.disabledReason ? <Field.HelperText color="var(--text-muted)">{field.disabledReason}</Field.HelperText> : null}
                                </Field.Root>
                              ))}
                            </VStack>
                          ) : (
                            <Text color="var(--text-secondary)">This provider does not expose additional local bridge configuration fields.</Text>
                          )}
                        </>
                      ) : null}
                    </VStack>
                  )}
                </Drawer.Body>
                <Drawer.Footer>
                  <VStack align="stretch" gap="3" w="full">
                    {providerDrawerError ? (
                      <ErrorBanner title="Provider action failed" detail={providerDrawerError} />
                    ) : null}
                    <HStack justify="flex-end" gap="2" wrap="wrap">
                      <Button
                        variant="outline"
                        loading={providerDrawerLoading}
                        disabled={!drawerProviderId}
                        onClick={() => {
                          if (!drawerProviderId) {
                            return;
                          }

                          const refreshAction =
                            providerDrawerAuthPending && drawerProviderAuthSession
                              ? onPollProviderAuth(drawerProviderId, drawerProviderAuthSession.id, {
                                  scope: 'drawer'
                                })
                              : onInspectProvider(drawerProviderId);

                          void Promise.resolve(refreshAction).catch(() => undefined);
                        }}
                      >
                        Refresh status
                      </Button>
                      <Button variant="outline" onClick={() => setProviderDrawerOpen(false)}>
                        Close
                      </Button>
                      {shouldShowBeginAuth ? (
                        <Button
                          bg="var(--accent)"
                          color="var(--accent-contrast)"
                          _hover={{ bg: 'var(--accent-strong)' }}
                          loading={providerDrawerLoading}
                          disabled={!drawerProviderDetails || providerDrawerLoading}
                          onClick={() =>
                            void (async () => {
                              if (!drawerProviderDetails) {
                                return;
                              }

                              await onBeginProviderAuth(drawerProviderDetails.id, {
                                scope: 'drawer'
                              });
                            })().catch(() => undefined)
                          }
                        >
                          Start provider auth
                        </Button>
                      ) : null}
                      {shouldShowConnectProvider ? (
                        <Button
                          bg="var(--accent)"
                          color="var(--accent-contrast)"
                          _hover={{ bg: 'var(--accent-strong)' }}
                          loading={providerDrawerLoading}
                          disabled={apiKey.trim().length === 0 || providerDrawerLoading}
                          onClick={() =>
                            void (async () => {
                              if (!drawerProviderDetails) {
                                return;
                              }

                              try {
                                await onConnectProvider(drawerProviderDetails.id, apiKey.trim(), providerLabel.trim() || undefined, {
                                  scope: 'drawer',
                                  baseUrl: baseUrl.trim().length > 0 ? baseUrl.trim() : undefined,
                                  apiMode: apiMode.trim().length > 0 ? apiMode.trim() : undefined
                                });
                                setApiKey('');
                                setProviderLabel('');
                              } catch {
                                // Keep the drawer open so the user can correct the local provider configuration.
                              }
                            })()
                          }
                        >
                          Connect provider
                        </Button>
                      ) : providerConfigCanSave ? (
                        <Button
                          bg="var(--accent)"
                          color="var(--accent-contrast)"
                          _hover={{ bg: 'var(--accent-strong)' }}
                          loading={providerDrawerLoading}
                          disabled={
                            !drawerProviderDetails ||
                            drawerProviderDetails.disabled ||
                            providerConfigHasMissingRequiredValue ||
                            providerConfigBlocked ||
                            providerDrawerLoading
                          }
                          onClick={() =>
                            void (async () => {
                              if (!drawerProviderDetails) {
                                return;
                              }

                              try {
                                await onUpdateRuntimeModelConfig(
                                  {
                                    provider: drawerProviderDetails.id,
                                    baseUrl: baseUrl.trim().length > 0 ? baseUrl : undefined,
                                    apiMode: apiMode.trim().length > 0 ? apiMode : undefined,
                                    defaultModel
                                  },
                                  {
                                    scope: 'drawer'
                                  }
                                );
                                setProviderDrawerOpen(false);
                              } catch {
                                // Keep the drawer open so the user can correct the local provider configuration.
                              }
                            })()
                          }
                        >
                          Save provider config
                        </Button>
                      ) : null}
                    </HStack>
                  </VStack>
                </Drawer.Footer>
              </Drawer.Content>
            </Drawer.Positioner>
          </Drawer.Root>
        </SettingsTabPanel>

        <SettingsTabPanel value="access_audit">
          <VStack align="stretch" gap="4">
            <SectionCard title="Access audit" description="Recent local audit trail for unrestricted access state changes and usage.">
              <VStack align="stretch" gap="3">
                <HStack justify="space-between" wrap="wrap" gap="3">
                  <Text color="var(--text-secondary)">
                    Last enabled: {accessAudit?.unrestrictedAccessLastEnabledAt ? new Date(accessAudit.unrestrictedAccessLastEnabledAt).toLocaleString() : 'Never'}
                  </Text>
                  <Text color="var(--text-secondary)">
                    Last used: {accessAudit?.unrestrictedAccessLastUsedAt ? new Date(accessAudit.unrestrictedAccessLastUsedAt).toLocaleString() : 'Never'}
                  </Text>
                </HStack>
                {accessAuditEventsError ? <ErrorBanner title="Access audit load failed" detail={accessAuditEventsError} /> : null}
                {!accessAuditEventsResponse || accessAuditEventsResponse.items.length === 0 ? (
                  <Text color="var(--text-secondary)">
                    {accessAuditEventsLoading
                      ? 'Loading unrestricted-access audit activity…'
                      : 'No unrestricted-access audit activity has been recorded yet.'}
                  </Text>
                ) : (
                  <VStack align="stretch" gap="3">
                    <ScrollArea.Root maxH="420px" variant="hover">
                      <ScrollArea.Viewport data-testid="access-audit-scroll">
                        <VStack align="stretch" gap="2" pr="1">
                          {accessAuditEventsResponse.items.map((event) => (
                            <Box key={event.id} data-testid="access-audit-row" data-density="compact" rounded="6px" bg="var(--surface-2)" px="3.5" py="2.5">
                              <HStack justify="space-between" align="start" gap="3" wrap="wrap">
                                <VStack align="stretch" gap="1" minW={0}>
                                  <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">
                                    {event.message}
                                  </Text>
                                  <Text fontSize="xs" color="var(--text-muted)">
                                    {event.type}
                                    {event.sessionId ? ` · Session ${event.sessionId}` : ''}
                                  </Text>
                                </VStack>
                                <Text fontSize="xs" color="var(--text-muted)" flexShrink={0}>
                                  {new Date(event.createdAt).toLocaleString()}
                                </Text>
                              </HStack>
                            </Box>
                          ))}
                        </VStack>
                      </ScrollArea.Viewport>
                      <ScrollArea.Scrollbar />
                    </ScrollArea.Root>
                    <PaginationFooter
                      page={accessAuditEventsPage}
                      pageSize={accessAuditEventsResponse.pageSize}
                      total={accessAuditEventsResponse.total}
                      itemLabel="audit entries"
                      onPageChange={onAccessAuditEventsPageChange}
                    />
                  </VStack>
                )}
              </VStack>
            </SectionCard>
          </VStack>
        </SettingsTabPanel>

        <SettingsTabPanel value="telemetry">
          <VStack align="stretch" gap="4">
            <SectionCard title="Troubleshooting telemetry" description="Structured bridge/runtime warnings and errors persisted locally for later diagnosis.">
              {telemetryError ? <ErrorBanner title="Telemetry load failed" detail={telemetryError} /> : null}
              {!telemetryResponse || telemetryResponse.items.length === 0 ? (
                <Text color="var(--text-secondary)">
                  {telemetryLoading
                    ? 'Loading troubleshooting telemetry…'
                    : 'No troubleshooting telemetry has been recorded for the active profile yet.'}
                </Text>
              ) : (
                <VStack align="stretch" gap="3">
                  <ScrollArea.Root maxH="420px" variant="hover">
                    <ScrollArea.Viewport data-testid="telemetry-scroll">
                      <VStack align="stretch" gap="2" pr="1">
                        {telemetryResponse.items.map((event) => (
                          <Box key={event.id} data-testid="telemetry-row" data-density="compact" rounded="6px" bg="var(--surface-2)" px="3.5" py="2.5">
                            <HStack justify="space-between" align="start" gap="3" wrap="wrap">
                              <VStack align="stretch" gap="1" minW={0}>
                                <HStack gap="2" wrap="wrap">
                                  <Badge colorPalette={event.severity === 'error' ? 'red' : event.severity === 'warning' ? 'yellow' : 'gray'}>
                                    {event.severity}
                                  </Badge>
                                  <Badge colorPalette="gray">{event.category}</Badge>
                                  <Text fontSize="xs" color="var(--text-muted)">
                                    {event.code}
                                  </Text>
                                </HStack>
                                <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">
                                  {event.message}
                                </Text>
                                {event.detail ? (
                                  <Text fontSize="xs" color="var(--text-secondary)">
                                    {event.detail}
                                  </Text>
                                ) : null}
                                {(event.requestId || event.sessionId) ? (
                                  <Text fontSize="xs" color="var(--text-muted)">
                                    {event.requestId ? `Request ${event.requestId}` : ''}
                                    {event.requestId && event.sessionId ? ' · ' : ''}
                                    {event.sessionId ? `Session ${event.sessionId}` : ''}
                                  </Text>
                                ) : null}
                              </VStack>
                              <Text fontSize="xs" color="var(--text-muted)" flexShrink={0}>
                                {new Date(event.createdAt).toLocaleString()}
                              </Text>
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    </ScrollArea.Viewport>
                    <ScrollArea.Scrollbar />
                  </ScrollArea.Root>
                  <PaginationFooter
                    page={telemetryPage}
                    pageSize={telemetryResponse.pageSize}
                    total={telemetryResponse.total}
                    itemLabel="telemetry events"
                    onPageChange={onTelemetryPageChange}
                  />
                </VStack>
              )}
            </SectionCard>
          </VStack>
        </SettingsTabPanel>
      </Tabs.ContentGroup>
    </Tabs.Root>
  );
}

function SettingsTabPanel({
  value,
  children
}: {
  value: SettingsTabValue;
  children: ReactNode;
}) {
  return (
    <Tabs.Content value={value} h="100%" minH={0} pt="3" _open={{ display: 'block' }}>
      <ScrollArea.Root h="100%" minH={0} variant="hover">
        <ScrollArea.Viewport data-testid="settings-scroll">
          <VStack align="stretch" gap="4" pb="6" pr={{ base: '1', xl: '2' }} maxW="720px">
            {children}
          </VStack>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar />
      </ScrollArea.Root>
    </Tabs.Content>
  );
}

function SectionCard({
  title,
  description,
  action,
  children
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box py="4">
      <VStack align="stretch" gap="4">
        <HStack justify="space-between" align="start" wrap="wrap" gap="3">
          <Box>
            <Text fontSize="14px" fontWeight="600" color="var(--text-primary)" letterSpacing="-0.005em">
              {title}
            </Text>
            <Text fontSize="13px" color="var(--text-muted)" mt="0.5">{description}</Text>
          </Box>
          {action ?? null}
        </HStack>
        {children}
      </VStack>
    </Box>
  );
}

function PaginationFooter({
  page,
  pageSize,
  total,
  itemLabel,
  onPageChange
}: {
  page: number;
  pageSize: number;
  total: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}) {
  return (
    <HStack justify="space-between" wrap="wrap" gap="3">
      <Text fontSize="sm" color="var(--text-secondary)">
        {total} {itemLabel}
      </Text>
      <HStack gap="2">
        <Button size="xs" variant="outline" rounded="8px" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
          Previous
        </Button>
        <Text fontSize="sm" color="var(--text-secondary)">
          Page {page}
        </Text>
        <Button
          size="xs"
          variant="outline"
          rounded="8px"
          disabled={page * pageSize >= total}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </HStack>
    </HStack>
  );
}

function ModelVerifyBar({
  pendingModel,
  currentModel,
  status,
  errorMessage,
  onVerify
}: {
  pendingModel: string | null;
  currentModel: string | null;
  status: 'idle' | 'testing' | 'passed' | 'failed';
  errorMessage: string | null;
  onVerify: () => Promise<void>;
}) {
  const hasChange = pendingModel !== null && pendingModel !== currentModel;
  if (!hasChange && status !== 'testing' && status !== 'passed' && status !== 'failed') {
    return null;
  }

  return (
    <VStack align="stretch" gap="1">
      <HStack gap="2" align="center">
        {status === 'idle' || status === 'failed' ? (
          <Button
            size="xs"
            h="6"
            px="2.5"
            fontSize="xs"
            fontWeight="500"
            rounded="6px"
            bg="var(--accent)"
            color="var(--accent-contrast)"
            _hover={{ bg: 'var(--accent-strong)' }}
            disabled={!hasChange}
            onClick={() => void onVerify()}
          >
            Verify model
          </Button>
        ) : null}
        {status === 'testing' ? (
          <HStack gap="1.5" align="center">
            <Spinner size="xs" color="var(--accent)" />
            <Text fontSize="xs" color="var(--text-muted)">Testing {pendingModel ?? ''}…</Text>
          </HStack>
        ) : null}
        {status === 'passed' ? (
          <Text fontSize="xs" color="#16a34a" fontWeight="500">
            ✓ Verified and applied
          </Text>
        ) : null}
        {status === 'failed' && hasChange ? (
          <Text fontSize="xs" color="var(--text-muted)">
            Fix the error and verify before applying.
          </Text>
        ) : null}
      </HStack>
      {status === 'failed' && errorMessage ? (
        <Box
          rounded="7px"
          border="1px solid #dc2626"
          bg="rgba(220,38,38,0.06)"
          px="2.5"
          py="2"
        >
          <Text fontSize="xs" color="#dc2626" lineHeight="1.4">
            {errorMessage}
          </Text>
        </Box>
      ) : null}
    </VStack>
  );
}

function WarningBadge() {
  return (
    <Box
      flexShrink={0}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      rounded="full"
      width="30px"
      height="30px"
      bg="rgba(177, 86, 47, 0.18)"
      color="var(--text-primary)"
      fontWeight="700"
    >
      !
    </Box>
  );
}
