import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Box, Button, Checkbox, Field, HStack, NativeSelect, ScrollArea, Spinner, Tabs, Text, Textarea, VStack } from '@chakra-ui/react';
import { ProviderConnectionGrid } from '../organisms/ProviderConnectionGrid';
import { ProviderSetupDrawer } from '../organisms/ProviderSetupDrawer';

/* ── Discrete step slider — 240px track + inline value badge ── */
function StepSlider({
  steps,
  value,
  onChange,
  disabled,
  label
}: {
  steps: Array<{ value: number; label: string }>;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  label: string;
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
          aria-label={label}
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

type SettingsTabValue = 'general' | 'model' | 'soul_md' | 'access_audit' | 'telemetry';

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
  onDeleteProvider,
  onBeginProviderAuth,
  onPollProviderAuth,
  onRefreshProviders: _onRefreshProviders,
  onInspectProvider,
  activeProfileId,
  soulMdContent,
  soulMdLoading,
  soulMdSaving,
  soulMdError,
  onLoadSoulMd,
  onUpdateSoulMd,
  requestedTab,
  onTabChange
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
  onDeleteProvider: (providerId: string) => Promise<void> | void;
  onBeginProviderAuth: (providerId: string, options?: { scope?: 'page' | 'drawer' }) => Promise<unknown> | void;
  onPollProviderAuth: (
    providerId: string,
    authSessionId?: string | null,
    options?: { scope?: 'page' | 'drawer' }
  ) => Promise<unknown> | void;
  onRefreshProviders: () => Promise<void> | void;
  onInspectProvider: (providerId: string) => Promise<unknown> | void;
  activeProfileId: string | null;
  soulMdContent: string | null;
  soulMdLoading: boolean;
  soulMdSaving: boolean;
  soulMdError: string | null;
  onLoadSoulMd: (profileId: string) => void;
  onUpdateSoulMd: (content: string) => Promise<void>;
  requestedTab?: SettingsTabValue;
  onTabChange?: (tab: SettingsTabValue) => void;
}) {
  const [currentTab, setCurrentTab] = useState<SettingsTabValue>(requestedTab ?? 'general');
  const { themeMode: activeThemeMode } = useHermesTheme();
  const [themeMode, setThemeMode] = useState<AppSettings['themeMode']>('dark');
  const [themeDirty] = useState(false);
  const [sessionsPageSize, setSessionsPageSize] = useState('50');
  const [chatTimeoutMs, setChatTimeoutMs] = useState('180000');
  const [discoveryTimeoutMs, setDiscoveryTimeoutMs] = useState('240000');
  const [nearbySearchTimeoutMs, setNearbySearchTimeoutMs] = useState('300000');
  const [recipeOperationTimeoutMs, setRecipeOperationTimeoutMs] = useState('180000');
  const [unrestrictedTimeoutMs, setUnrestrictedTimeoutMs] = useState('1800000');
  const [restrictedChatMaxTurns, setRestrictedChatMaxTurns] = useState('8');
  const [unrestrictedAccessEnabled, setUnrestrictedAccessEnabled] = useState(false);

  const [defaultModel, setDefaultModel] = useState('');
  const [provider, setProvider] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiMode, setApiMode] = useState('');
  const [maxTurns, setMaxTurns] = useState('150');
  const [reasoningEffort, setReasoningEffort] = useState('');
  const [providerDrawerOpen, setProviderDrawerOpen] = useState(false);
  const [drawerProviderId, setDrawerProviderId] = useState<string | null>(null);

  const providerDrawerFinalFocusRef = useRef<HTMLElement | null>(null);
  const showModelProviderErrorBanner = Boolean(modelProviderError && runtimeConfigGate.status === 'blocked');

  // Soul MD local draft — syncs from parent state when the Persona tab opens
  const [soulMdDraft, setSoulMdDraft] = useState('');
  const soulMdDraftInitialized = useRef(false);

  useEffect(() => {
    if (currentTab === 'soul_md' && activeProfileId) {
      if (soulMdContent === null && !soulMdLoading) {
        onLoadSoulMd(activeProfileId);
        soulMdDraftInitialized.current = false;
      } else if (soulMdContent !== null && !soulMdDraftInitialized.current) {
        setSoulMdDraft(soulMdContent);
        soulMdDraftInitialized.current = true;
      }
    }
  }, [currentTab, activeProfileId, soulMdContent, soulMdLoading, onLoadSoulMd]);

  // When content arrives from the server, sync it to the draft if not yet initialized
  useEffect(() => {
    if (soulMdContent !== null && !soulMdDraftInitialized.current) {
      setSoulMdDraft(soulMdContent);
      soulMdDraftInitialized.current = true;
    }
  }, [soulMdContent]);

  // Reset draft tracking when profile changes
  useEffect(() => {
    soulMdDraftInitialized.current = false;
    setSoulMdDraft('');
  }, [activeProfileId]);

  useEffect(() => {
    if (requestedTab && requestedTab !== currentTab) {
      setCurrentTab(requestedTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedTab]);

  // Sync the (read-only-ish) settings into local form state when settings load/change.
  // This runs only when `settings` itself changes — putting `themeMode`/`themeDirty` in the
  // deps caused an infinite loop with the theme-provider sync below (each effect overwrote
  // the other's themeMode every render).
  useEffect(() => {
    if (!settings) return;
    if (!themeDirty) {
      setThemeMode(settings.themeMode);
    }
    setSessionsPageSize(String(settings.sessionsPageSize));
    setChatTimeoutMs(String(settings.chatTimeoutMs));
    setDiscoveryTimeoutMs(String(settings.discoveryTimeoutMs));
    setNearbySearchTimeoutMs(String(settings.nearbySearchTimeoutMs));
    setRecipeOperationTimeoutMs(String(settings.recipeOperationTimeoutMs));
    setUnrestrictedTimeoutMs(String(settings.unrestrictedTimeoutMs));
    setRestrictedChatMaxTurns(String(settings.restrictedChatMaxTurns));
    setUnrestrictedAccessEnabled(settings.unrestrictedAccessEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Mirror the live theme mode from the theme provider into our form state.
  useEffect(() => {
    setThemeMode(activeThemeMode);
  }, [activeThemeMode]);

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
  const selectedModel = useMemo(
    () => selectedProvider?.models.find((item) => item.id === defaultModel) ?? null,
    [defaultModel, selectedProvider?.models]
  );
  const shouldShowReasoningEffort = Boolean(selectedModel?.supportsReasoningEffort);

  // Sync local form state when the active drawer-target provider changes (covers reopen
  // of a different provider, returns from inspectProvider, etc.).
  useEffect(() => {
    if (!drawerProviderDetails) return;
    const defaultModelField = drawerProviderDetails.configurationFields.find((field) => field.key === 'defaultModel');
    const baseUrlField = drawerProviderDetails.configurationFields.find((field) => field.key === 'baseUrl');
    const apiModeField = drawerProviderDetails.configurationFields.find((field) => field.key === 'apiMode');
    setDefaultModel(defaultModelField?.value ?? '');
    setBaseUrl(baseUrlField?.value ?? '');
    setApiMode(apiModeField?.value ?? '');
  }, [drawerProviderDetails]);

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
      onValueChange={(event) => {
        const next = event.value as SettingsTabValue;
        setCurrentTab(next);
        onTabChange?.(next);
      }}
      h="100%"
      minH={0}
      display="flex"
      flexDirection="column"
      variant="plain"
      lazyMount
    >
      <Box borderBottom="1px solid var(--divider)" flexShrink={0}>
        <Tabs.List gap="0" px="0" borderBottom="none">
          {(['general', 'model', 'soul_md', 'access_audit', 'telemetry'] as const).map((v) => (
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
              {v === 'general' ? 'Settings' : v === 'model' ? 'Models' : v === 'soul_md' ? 'Persona' : v === 'access_audit' ? 'Access' : 'Audit'}
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
            <VStack align="stretch" gap="7">
              <Field.Root>
                <Field.Label color="var(--text-secondary)">Sessions page size</Field.Label>
                <StepSlider
                  label="Sessions page size"
                  steps={[{ value: 25, label: '25' }, { value: 50, label: '50' }, { value: 100, label: '100' }]}
                  value={sessionsPageSize}
                  onChange={(v) => { setSessionsPageSize(v); scheduleSave({ sessionsPageSize: v }); }}
                />
              </Field.Root>

              <Field.Root disabled={unrestrictedAccessEnabled}>
                <Field.Label color="var(--text-secondary)">Restricted max turns</Field.Label>
                <StepSlider
                  label="Restricted max turns"
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
                <StepSlider
                  label="Normal chat timeout"
                  steps={[
                    { value: 30000, label: '30s' },
                    { value: 60000, label: '1m' },
                    { value: 120000, label: '2m' },
                    { value: 180000, label: '3m' },
                    { value: 300000, label: '5m' },
                    { value: 600000, label: '10m' },
                  ]}
                  value={chatTimeoutMs}
                  onChange={(v) => { setChatTimeoutMs(v); scheduleSave({ chatTimeoutMs: v }); }}
                />
                <Field.HelperText color="var(--text-muted)">Default timeout for regular chat requests.</Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label color="var(--text-secondary)">Search / discovery timeout</Field.Label>
                <StepSlider
                  label="Search / discovery timeout"
                  steps={[
                    { value: 60000, label: '1m' },
                    { value: 120000, label: '2m' },
                    { value: 240000, label: '4m' },
                    { value: 300000, label: '5m' },
                    { value: 480000, label: '8m' },
                    { value: 600000, label: '10m' },
                    { value: 900000, label: '15m' },
                  ]}
                  value={discoveryTimeoutMs}
                  onChange={(v) => { setDiscoveryTimeoutMs(v); scheduleSave({ discoveryTimeoutMs: v }); }}
                />
                <Field.HelperText color="var(--text-muted)">Broad search & recommendations.</Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label color="var(--text-secondary)">Nearby / local-search timeout</Field.Label>
                <StepSlider
                  label="Nearby / local-search timeout"
                  steps={[
                    { value: 60000, label: '1m' },
                    { value: 120000, label: '2m' },
                    { value: 180000, label: '3m' },
                    { value: 300000, label: '5m' },
                    { value: 480000, label: '8m' },
                    { value: 600000, label: '10m' },
                    { value: 900000, label: '15m' },
                  ]}
                  value={nearbySearchTimeoutMs}
                  onChange={(v) => { setNearbySearchTimeoutMs(v); scheduleSave({ nearbySearchTimeoutMs: v }); }}
                />
                <Field.HelperText color="var(--text-muted)">Nearby places & local search.</Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label color="var(--text-secondary)">Recipe timeout</Field.Label>
                <StepSlider
                  label="Recipe timeout"
                  steps={[
                    { value: 30000, label: '30s' },
                    { value: 60000, label: '1m' },
                    { value: 120000, label: '2m' },
                    { value: 180000, label: '3m' },
                    { value: 300000, label: '5m' },
                    { value: 600000, label: '10m' },
                  ]}
                  value={recipeOperationTimeoutMs}
                  onChange={(v) => { setRecipeOperationTimeoutMs(v); scheduleSave({ recipeOperationTimeoutMs: v }); }}
                />
                <Field.HelperText color="var(--text-muted)">Recipe creation & workspace updates.</Field.HelperText>
              </Field.Root>
            </VStack>
          </SectionCard>

          <SectionCard
            title="Default model behaviour"
            description="Applied to the active profile's runtime. Changes save automatically."
          >
            <VStack align="stretch" gap="6" maxW="360px">
              <Field.Root>
                <Field.Label color="var(--text-secondary)">Max turns</Field.Label>
                <StepSlider
                  label="Max turns"
                  steps={[
                    { value: 10, label: '10' },
                    { value: 25, label: '25' },
                    { value: 50, label: '50' },
                    { value: 100, label: '100' },
                    { value: 150, label: '150' },
                    { value: 200, label: '200' },
                    { value: 500, label: '500' },
                  ]}
                  value={maxTurns}
                  onChange={(v) => { setMaxTurns(v); scheduleModelSave({ maxTurns: v }); }}
                />
                <Field.HelperText color="var(--text-muted)">
                  Maximum agent turns per request for the active profile.
                </Field.HelperText>
              </Field.Root>

              {shouldShowReasoningEffort ? (
                <Field.Root>
                  <Field.Label color="var(--text-secondary)">Reasoning effort</Field.Label>
                  <NativeSelect.Root size="sm" variant="subtle" bg="var(--surface-2)">
                    <NativeSelect.Field
                      value={reasoningEffort}
                      onChange={(event) => {
                        setReasoningEffort(event.currentTarget.value);
                        scheduleModelSave({ reasoningEffort: event.currentTarget.value });
                      }}
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
                    <StepSlider
                      label="Unrestricted timeout"
                      steps={[
                        { value: 300000, label: '5m' },
                        { value: 600000, label: '10m' },
                        { value: 900000, label: '15m' },
                        { value: 1800000, label: '30m' },
                        { value: 3600000, label: '1h' },
                        { value: 7200000, label: '2h' },
                        { value: 14400000, label: '4h' },
                      ]}
                      value={unrestrictedTimeoutMs}
                      onChange={(v) => { setUnrestrictedTimeoutMs(v); scheduleSave({ unrestrictedTimeoutMs: v }); }}
                    />
                    <Field.HelperText color="var(--text-muted)">
                      Maximum bridge timeout used only while Unrestricted Access is enabled.
                    </Field.HelperText>
                  </Field.Root>
                </VStack>
              </HStack>
            </Box>
          </SectionCard>
        </SettingsTabPanel>

        <SettingsTabPanel value="model">
          {!modelProviderResponse ? (
            <EmptyStateCard title="Loading providers" detail="Reading provider credentials and Hermes runtime state." />
          ) : (
            <ProviderConnectionGrid
              providers={modelProviderResponse.providers}
              loading={modelProviderLoading}
              onConnect={(pid) => openProviderDrawer(pid)}
            />
          )}

          <ProviderSetupDrawer
            open={providerDrawerOpen}
            onOpenChange={(open) => {
              setProviderDrawerOpen(open);
              if (!open) setDrawerProviderId(null);
            }}
            providerId={drawerProviderId}
            provider={drawerProviderDetails}
            providerLoading={providerDrawerLoading}
            providerError={providerDrawerError}
            profileId={modelProviderResponse?.config.profileId ?? null}
            modelProviderConfig={modelProviderResponse?.config ?? null}
            onConnectProvider={onConnectProvider}
            onDeleteProvider={onDeleteProvider}
            onBeginProviderAuth={onBeginProviderAuth}
            onPollProviderAuth={onPollProviderAuth}
            onInspectProvider={onInspectProvider}
            onTestModelConfig={onTestModelConfig}
            onUpdateRuntimeModelConfig={onUpdateRuntimeModelConfig}
          />

        </SettingsTabPanel>

        <SettingsTabPanel value="soul_md" stretch>
          <SectionCard
            title="Agent Persona"
            description={`Customize how Hermes communicates for the ${activeProfileId ?? 'active'} profile. Loaded fresh on every message — changes take effect immediately.`}
            action={
              <Button
                size="xs"
                h="7"
                px="3"
                rounded="8px"
                bg="var(--accent)"
                color="var(--accent-contrast)"
                fontWeight="500"
                fontSize="xs"
                _hover={{ bg: 'var(--accent-strong)' }}
                loading={soulMdSaving}
                disabled={soulMdLoading || soulMdContent === null}
                onClick={() => void onUpdateSoulMd(soulMdDraft)}
              >
                Save Persona
              </Button>
            }
            stretch
          >
            <VStack align="stretch" gap="3" flex="1" minH={0}>
              {soulMdError ? (
                <Box px="3" py="2" rounded="8px" bg="var(--status-error-surface)" border="1px solid var(--status-error)">
                  <Text fontSize="sm" color="var(--status-error)">{soulMdError}</Text>
                </Box>
              ) : null}
              {soulMdLoading ? (
                <HStack gap="2" py="4" justify="center">
                  <Spinner size="sm" color="var(--text-muted)" />
                  <Text fontSize="sm" color="var(--text-muted)">Loading persona…</Text>
                </HStack>
              ) : (
                <Field.Root flex="1" minH={0} display="flex" flexDirection="column">
                  <Textarea
                    value={soulMdDraft}
                    onChange={(e) => setSoulMdDraft(e.currentTarget.value)}
                    placeholder={`# Hermes Agent Persona\n\nWrite anything here to shape how Hermes speaks to you.\n\nExamples:\n  - "You are a concise technical expert. No fluff, just facts."\n  - "You speak like a friendly coworker who knows everything."\n  - "You are warm and playful, and use kaomoji occasionally."\n\nDelete the contents (or leave empty) to use the default personality.`}
                    flex="1"
                    minH={0}
                    resize="none"
                    fontSize="sm"
                    fontFamily="monospace"
                    lineHeight="1.6"
                    bg="var(--surface-2)"
                    borderColor="var(--border-subtle)"
                    color="var(--text-primary)"
                    _placeholder={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}
                    _focus={{ borderColor: 'var(--border-default)', boxShadow: 'var(--focus-ring)' }}
                    spellCheck={false}
                  />
                  <HStack justify="space-between" mt="1">
                    <Text fontSize="xs" color="var(--text-muted)">
                      Markdown supported. Saved to <Text as="span" fontFamily="monospace" fontSize="xs">SOUL.md</Text> in the profile directory.
                    </Text>
                    <Text fontSize="xs" color="var(--text-muted)">
                      {soulMdDraft.length.toLocaleString()} chars
                    </Text>
                  </HStack>
                </Field.Root>
              )}
            </VStack>
          </SectionCard>
        </SettingsTabPanel>

        <SettingsTabPanel value="access_audit" stretch>
          <SectionCard title="Access audit" description="Recent local audit trail for unrestricted access state changes and usage." stretch>
            <VStack align="stretch" gap="3" flex="1" minH={0}>
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
                <VStack align="stretch" gap="3" flex="1" minH={0}>
                  <ScrollArea.Root flex="1" minH={0} variant="hover">
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
        </SettingsTabPanel>

        <SettingsTabPanel value="telemetry" stretch>
          <SectionCard title="Troubleshooting telemetry" description="Structured bridge/runtime warnings and errors persisted locally for later diagnosis." stretch>
            {telemetryError ? <ErrorBanner title="Telemetry load failed" detail={telemetryError} /> : null}
            {!telemetryResponse || telemetryResponse.items.length === 0 ? (
              <Text color="var(--text-secondary)">
                {telemetryLoading
                  ? 'Loading troubleshooting telemetry…'
                  : 'No troubleshooting telemetry has been recorded for the active profile yet.'}
              </Text>
            ) : (
              <VStack align="stretch" gap="3" flex="1" minH={0}>
                <ScrollArea.Root flex="1" minH={0} variant="hover">
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
        </SettingsTabPanel>
      </Tabs.ContentGroup>
    </Tabs.Root>
  );
}

function SettingsTabPanel({
  value,
  children,
  stretch
}: {
  value: SettingsTabValue;
  children: ReactNode;
  stretch?: boolean;
}) {
  if (stretch) {
    return (
      <Tabs.Content value={value} h="100%" minH={0} pt="3" _open={{ display: 'flex' }} flexDirection="column">
        <VStack align="stretch" gap="4" flex="1" minH={0} pb="2" pr={{ base: '1', xl: '2' }}>
          {children}
        </VStack>
      </Tabs.Content>
    );
  }
  return (
    <Tabs.Content value={value} h="100%" minH={0} pt="3" _open={{ display: 'block' }}>
      <ScrollArea.Root h="100%" minH={0} variant="hover">
        <ScrollArea.Viewport data-testid="settings-scroll">
          <VStack align="stretch" gap="4" pb="6" pr={{ base: '1', xl: '2' }}>
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
  children,
  stretch
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
  stretch?: boolean;
}) {
  return (
    <Box py="4" {...(stretch ? { flex: '1', minH: 0, display: 'flex', flexDirection: 'column' } : {})}>
      <VStack align="stretch" gap="4" {...(stretch ? { flex: '1', minH: 0 } : {})}>
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
