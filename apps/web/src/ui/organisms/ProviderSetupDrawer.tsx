import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  HStack,
  Input,
  Spinner,
  Steps,
  Text,
  VStack,
  chakra
} from '@chakra-ui/react';
import type { ModelProviderResponse, RuntimeProviderOption, RuntimeProviderSetupStep } from '@hermes-recipes/protocol';
import { ProviderLogo } from '../atoms/ProviderLogo';
import { ErrorBanner } from '../molecules/ErrorBanner';
import { getProviderStepCompletions, setProviderStepCompletion } from '../../lib/api';
import { getProviderModelOptions, isProviderSupported } from '../../lib/provider-models';
import { useProviderModels, invalidateProviderModels } from '../../hooks/use-provider-models';
import { SearchableSelect } from '../molecules/SearchableSelect';

function ExternalLinkIcon() {
  const Svg = chakra('svg');
  return (
    <Svg viewBox="0 0 16 16" boxSize="3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" flexShrink={0}>
      <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" />
      <path d="M10 2h4v4" />
      <path d="M14 2L8 8" />
    </Svg>
  );
}

function CheckIcon() {
  const Svg = chakra('svg');
  return (
    <Svg viewBox="0 0 16 16" boxSize="3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" color="green.500">
      <path d="M2 8l4 4 8-8" />
    </Svg>
  );
}

type StepVerifyState = { status: 'idle' | 'verifying' | 'done' | 'error'; error: string | null };

type ActiveProviderConfig = { provider: string; defaultModel: string } | null;

function isStepComplete(
  step: RuntimeProviderSetupStep,
  manualCompletions: Set<string>,
  providerId: string | null = null,
  activeConfig: ActiveProviderConfig = null
): boolean {
  if (step.kind === 'manual' || step.kind === 'config' || step.kind === 'refresh') {
    return manualCompletions.has(step.id) || step.status === 'completed';
  }
  if (step.kind === 'model') {
    // The bridge sets provider.ready = connected (any API key holder), which marks the
    // model step as 'completed' even when no model has been chosen for this provider.
    // Only treat it as done if this provider is actually the active one with a real model.
    const providerIsActive = !!activeConfig && activeConfig.provider === providerId;
    const hasModel = !!activeConfig?.defaultModel && activeConfig.defaultModel !== 'unknown';
    return step.status === 'completed' && providerIsActive && hasModel;
  }
  return step.status === 'completed';
}

function getFirstIncompleteIndex(
  steps: RuntimeProviderSetupStep[],
  manualCompletions: Set<string>,
  providerId: string | null = null,
  activeConfig: ActiveProviderConfig = null
): number {
  const idx = steps.findIndex((s) => !isStepComplete(s, manualCompletions, providerId, activeConfig));
  return idx === -1 ? steps.length - 1 : idx;
}

function StepContentInspect({
  step,
  provider,
  loading,
  onRetry
}: {
  step: RuntimeProviderSetupStep;
  provider: RuntimeProviderOption;
  loading: boolean;
  onRetry: () => void;
}) {
  const done = step.status === 'completed';
  return (
    <VStack align="stretch" gap="3">
      <Text color="var(--text-secondary)" fontSize="sm">{step.description}</Text>
      {loading ? (
        <HStack gap="2">
          <Spinner size="xs" color="blue.500" />
          <Text fontSize="sm" color="var(--text-muted)">Inspecting runtime…</Text>
        </HStack>
      ) : done ? (
        <HStack gap="2">
          <CheckIcon />
          <Text fontSize="sm" color="green.500">Hermes detected {provider.displayName}</Text>
        </HStack>
      ) : (
        <VStack align="stretch" gap="2">
          <Text fontSize="sm" color="red.400">{provider.stateMessage || 'Hermes runtime did not detect this provider.'}</Text>
          <Button size="sm" variant="outline" alignSelf="start" onClick={onRetry}>Retry</Button>
        </VStack>
      )}
    </VStack>
  );
}

function StepContentApiKey({
  step,
  provider,
  apiKey,
  onApiKeyChange,
  verifyState,
  onSave
}: {
  step: RuntimeProviderSetupStep;
  provider: RuntimeProviderOption;
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  verifyState: StepVerifyState;
  onSave: () => void;
}) {
  const done = step.status === 'completed';
  return (
    <VStack align="stretch" gap="3">
      <Text color="var(--text-secondary)" fontSize="sm">{step.description}</Text>
      {step.actionUrl && step.actionLabel ? (
        <Button asChild size="xs" variant="outline" alignSelf="start" gap="1.5">
          <a href={step.actionUrl} target="_blank" rel="noopener noreferrer">
            {step.actionLabel}
            <ExternalLinkIcon />
          </a>
        </Button>
      ) : null}
      {!done ? (
        <>
          <Input
            type="password"
            placeholder="Paste your API key…"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.currentTarget.value)}
            bg="var(--surface-2)"
            borderColor="var(--border-subtle)"
            size="sm"
          />
          {verifyState.error ? (
            <Text fontSize="sm" color="red.400">{verifyState.error}</Text>
          ) : null}
          <Button
            size="sm"
            bg="var(--accent)"
            color="var(--accent-contrast)"
            _hover={{ bg: 'var(--accent-strong)' }}
            alignSelf="start"
            loading={verifyState.status === 'verifying'}
            disabled={apiKey.trim().length === 0 || verifyState.status === 'verifying'}
            onClick={onSave}
          >
            Save API key
          </Button>
        </>
      ) : (
        <HStack gap="2">
          <CheckIcon />
          <Text fontSize="sm" color="green.500">{provider.displayName} is authenticated.</Text>
        </HStack>
      )}
    </VStack>
  );
}

function StepContentOAuth({
  step,
  authSession,
  verifyState,
  onBeginAuth,
  onVerify,
  loading
}: {
  step: RuntimeProviderSetupStep;
  authSession: RuntimeProviderOption['authSession'] | undefined;
  verifyState: StepVerifyState;
  onBeginAuth: () => void;
  onVerify: () => void;
  loading: boolean;
}) {
  const done = step.status === 'completed';
  const pending = authSession && ['pending', 'verifying'].includes(authSession.status);

  return (
    <VStack align="stretch" gap="3">
      <Text color="var(--text-secondary)" fontSize="sm">{step.description}</Text>
      {done ? (
        <HStack gap="2">
          <CheckIcon />
          <Text fontSize="sm" color="green.500">Authorization complete.</Text>
        </HStack>
      ) : (
        <>
          {authSession ? (
            <VStack align="stretch" gap="2">
              <Text fontSize="sm" color="var(--text-secondary)">{authSession.message}</Text>
              {authSession.verificationCode ? (
                <HStack gap="2">
                  <Text fontSize="xs" color="var(--text-muted)">Code:</Text>
                  <Text fontSize="sm" fontFamily="mono" fontWeight="700" color="var(--text-primary)">
                    {authSession.verificationCode}
                  </Text>
                </HStack>
              ) : null}
              {authSession.actionUrl && authSession.actionLabel ? (
                <Button asChild size="xs" variant="outline" alignSelf="start" gap="1.5">
                  <a href={authSession.actionUrl} target="_blank" rel="noopener noreferrer">
                    {authSession.actionLabel}
                    <ExternalLinkIcon />
                  </a>
                </Button>
              ) : null}
              {pending ? (
                <HStack gap="2">
                  <Spinner size="xs" color="blue.500" />
                  <Text fontSize="sm" color="var(--text-muted)">Waiting for authorization…</Text>
                </HStack>
              ) : null}
            </VStack>
          ) : null}
          {verifyState.error ? (
            <Text fontSize="sm" color="red.400">{verifyState.error}</Text>
          ) : null}
          {!authSession ? (
            <Button
              size="sm"
              bg="var(--accent)"
              color="var(--accent-contrast)"
              _hover={{ bg: 'var(--accent-strong)' }}
              alignSelf="start"
              loading={loading}
              onClick={onBeginAuth}
            >
              Begin authorization
            </Button>
          ) : !pending ? (
            <Button
              size="sm"
              variant="outline"
              alignSelf="start"
              loading={verifyState.status === 'verifying'}
              onClick={onVerify}
            >
              Check status
            </Button>
          ) : null}
        </>
      )}
    </VStack>
  );
}

function StepContentModel({
  step,
  provider,
  modelValue,
  modelOptions,
  modelsLoading,
  modelsError,
  onModelChange,
  verifyState
}: {
  step: RuntimeProviderSetupStep;
  provider: RuntimeProviderOption;
  modelValue: string;
  modelOptions: Array<{ value: string; label: string }>;
  modelsLoading: boolean;
  modelsError: string | null;
  onModelChange: (v: string) => void;
  verifyState: StepVerifyState;
}) {
  const done = step.status === 'completed';
  const valueInList = modelOptions.some((m) => m.value === modelValue);

  return (
    <VStack align="stretch" gap="3">
      <Text color="var(--text-secondary)" fontSize="sm">{step.description}</Text>
      {done ? (
        <HStack gap="2">
          <CheckIcon />
          <Text fontSize="sm" color="green.500">Model configured: {modelValue || 'Set'}</Text>
        </HStack>
      ) : (
        <>
          {modelOptions.length > 0 ? (
            <SearchableSelect
              value={valueInList ? modelValue : ''}
              options={modelOptions.map((o) => ({ value: o.value, label: o.label }))}
              onChange={(next) => onModelChange(next)}
              placeholder="Select a model…"
              searchPlaceholder="Search models…"
              emptyLabel="No models match"
              ariaLabel="Default model"
              size="normal"
              triggerMinW="100%"
              popoverWidth="100%"
            />
          ) : modelsLoading ? (
            <HStack gap="2">
              <Spinner size="xs" color="blue.500" />
              <Text fontSize="sm" color="var(--text-muted)">Discovering models from {provider.displayName}…</Text>
            </HStack>
          ) : modelsError ? (
            <VStack align="stretch" gap="1">
              <Text fontSize="sm" color="red.400">{`Couldn't load models: ${modelsError}`}</Text>
              <Text fontSize="xs" color="var(--text-muted)">
                Confirm your API key is valid and try again.
              </Text>
            </VStack>
          ) : (
            <Box rounded="6px" border="1px dashed var(--border-subtle)" bg="var(--surface-1)" px="3" py="2.5">
              <Text fontSize="sm" color="var(--text-muted)">
                Models for this provider aren&apos;t auto-detected yet. (Coming soon)
              </Text>
            </Box>
          )}
          {verifyState.error ? (
            <Text fontSize="sm" color="red.400">{verifyState.error}</Text>
          ) : null}
          {verifyState.status === 'verifying' ? (
            <HStack gap="2">
              <Spinner size="xs" color="blue.500" />
              <Text fontSize="sm" color="var(--text-muted)">Testing model…</Text>
            </HStack>
          ) : verifyState.status === 'done' ? (
            <HStack gap="2">
              <CheckIcon />
              <Text fontSize="sm" color="green.500">Model responds successfully.</Text>
            </HStack>
          ) : null}
        </>
      )}
    </VStack>
  );
}

function StepContentVerify({
  step,
  provider,
  verifyState,
  onVerify,
  loading
}: {
  step: RuntimeProviderSetupStep;
  provider: RuntimeProviderOption;
  verifyState: StepVerifyState;
  onVerify: () => void;
  loading: boolean;
}) {
  const ready = provider.ready;
  return (
    <VStack align="stretch" gap="3">
      <Text color="var(--text-secondary)" fontSize="sm">{step.description}</Text>
      {ready ? (
        <HStack gap="2">
          <CheckIcon />
          <Text fontSize="sm" color="green.500">{provider.displayName} is ready to use.</Text>
        </HStack>
      ) : (
        <>
          {verifyState.error ? (
            <Text fontSize="sm" color="red.400">{verifyState.error}</Text>
          ) : null}
          {provider.validation?.message ? (
            <Text fontSize="sm" color={provider.validation.status === 'error' ? 'red.400' : 'var(--text-muted)'}>
              {provider.validation.message}
            </Text>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            alignSelf="start"
            loading={loading || verifyState.status === 'verifying'}
            onClick={onVerify}
          >
            Re-check readiness
          </Button>
        </>
      )}
    </VStack>
  );
}

function StepContentManual({
  step
}: {
  step: RuntimeProviderSetupStep;
}) {
  return (
    <VStack align="stretch" gap="3">
      <Text color="var(--text-secondary)" fontSize="sm">{step.description}</Text>
      {step.command ? (
        <Box
          as="pre"
          bg="var(--surface-1)"
          border="1px solid var(--border-subtle)"
          rounded="6px"
          px="3"
          py="2"
          fontSize="xs"
          color="var(--text-secondary)"
          overflowX="auto"
        >
          {step.command}
        </Box>
      ) : null}
      {step.actionUrl && step.actionLabel ? (
        <Button asChild size="xs" variant="outline" alignSelf="start" gap="1.5">
          <a href={step.actionUrl} target="_blank" rel="noopener noreferrer">
            {step.actionLabel}
            <ExternalLinkIcon />
          </a>
        </Button>
      ) : null}
    </VStack>
  );
}

export function ProviderSetupDrawer({
  open,
  onOpenChange,
  providerId,
  provider,
  providerLoading,
  providerError,
  profileId,
  modelProviderConfig,
  onConnectProvider,
  onDeleteProvider,
  onBeginProviderAuth,
  onPollProviderAuth,
  onInspectProvider,
  onTestModelConfig,
  onUpdateRuntimeModelConfig
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string | null;
  provider: RuntimeProviderOption | null;
  providerLoading: boolean;
  providerError: string | null;
  profileId: string | null;
  modelProviderConfig: ModelProviderResponse['config'] | null;
  onConnectProvider: (provider: string, apiKey: string, label?: string, options?: { scope?: 'page' | 'drawer'; baseUrl?: string; apiMode?: string }) => Promise<unknown> | void;
  onDeleteProvider: (providerId: string) => Promise<void> | void;
  onBeginProviderAuth: (providerId: string, options?: { scope?: 'page' | 'drawer' }) => Promise<unknown> | void;
  onPollProviderAuth: (providerId: string, authSessionId?: string | null, options?: { scope?: 'page' | 'drawer' }) => Promise<unknown> | void;
  onInspectProvider: (providerId: string) => Promise<unknown> | void;
  onTestModelConfig: (profileId: string, defaultModel: string, provider?: string) => Promise<{ ok: boolean; message: string; latencyMs: number }>;
  onUpdateRuntimeModelConfig: (config: Partial<ModelProviderResponse['config']>, options?: { scope?: 'page' | 'drawer' }) => Promise<unknown> | void;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [modelValue, setModelValue] = useState('');
  const [stepVerify, setStepVerify] = useState<Record<string, StepVerifyState>>({});
  const [manualCompletions, setManualCompletions] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const finalFocusRef = useRef<HTMLElement | null>(null);

  const authSession = provider?.authSession ?? null;
  const authPending = Boolean(authSession && ['pending', 'verifying'].includes(authSession.status));

  // Live model discovery for this provider — fetched only after the API key is saved
  // (i.e. when status is 'connected' so the bridge can authenticate the /v1/models call).
  const canFetchModels = Boolean(open && providerId && profileId && provider?.status === 'connected' && isProviderSupported(providerId));
  const liveModels = useProviderModels(canFetchModels ? profileId : null, canFetchModels ? providerId : null);
  // Merge: live results win; fall back to bridge-supplied options + frontend static catalogue
  const mergedModelOptions = liveModels.models.length > 0
    ? liveModels.models
    : (provider ? getProviderModelOptions(provider) : []);

  // Load manual step completions from DB when drawer opens
  useEffect(() => {
    if (!open || !profileId || !providerId) return;
    getProviderStepCompletions(profileId)
      .then((ids) => {
        const forThisProvider = new Set(ids.filter((id) => id.startsWith(`${providerId}:`)));
        setManualCompletions(forThisProvider);
      })
      .catch(() => undefined);
  }, [open, profileId, providerId]);

  const activeConfig: ActiveProviderConfig = modelProviderConfig
    ? { provider: modelProviderConfig.provider, defaultModel: modelProviderConfig.defaultModel }
    : null;

  // Sync active step to first incomplete step when provider data loads. Deps deliberately
  // narrow — the activeConfig/manualCompletions/provider object reference would change every
  // render and trigger a render loop; we only need to recompute on actual state transitions.
  useEffect(() => {
    if (!provider) return;
    const idx = getFirstIncompleteIndex(provider.setupSteps, manualCompletions, provider.id, activeConfig);
    setActiveStep(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider?.id, provider?.ready, provider?.status]);

  // Sync model value from config — only inherit the active model if this provider is the active one.
  useEffect(() => {
    if (!provider) return;
    const modelField = provider.configurationFields.find((f) => f.key === 'defaultModel');
    const isActiveProvider = modelProviderConfig?.provider === provider.id;
    const inheritedModel = isActiveProvider && modelProviderConfig?.defaultModel !== 'unknown'
      ? (modelProviderConfig?.defaultModel ?? '')
      : '';
    setModelValue(modelField?.value ?? inheritedModel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider?.id, modelProviderConfig?.defaultModel, modelProviderConfig?.provider]);

  // Reset per-step verify state when step changes
  useEffect(() => {
    setStepVerify({});
  }, [providerId]);

  // OAuth auto-polling
  useEffect(() => {
    if (!open || !providerId || providerLoading || !authPending || !authSession) return;
    const ms = Math.max(1_000, authSession.pollAfterMs ?? 5_000);
    const interval = globalThis.setInterval(() => {
      void Promise.resolve(onPollProviderAuth(providerId, authSession.id, { scope: 'drawer' })).catch(() => undefined);
    }, ms);
    return () => globalThis.clearInterval(interval);
  }, [open, providerId, providerLoading, authPending, authSession, onPollProviderAuth]);

  function setVerify(stepId: string, state: StepVerifyState) {
    setStepVerify((prev) => ({ ...prev, [stepId]: state }));
  }

  function verifyOf(stepId: string): StepVerifyState {
    return stepVerify[stepId] ?? { status: 'idle', error: null };
  }

  async function handleContinue(step: RuntimeProviderSetupStep, index: number) {
    if (!providerId) return;

    switch (step.kind) {
      case 'inspect': {
        if (step.status !== 'completed') {
          setVerify(step.id, { status: 'verifying', error: null });
          try {
            await onInspectProvider(providerId);
            setVerify(step.id, { status: 'done', error: null });
          } catch (err) {
            setVerify(step.id, { status: 'error', error: err instanceof Error ? err.message : 'Inspection failed.' });
            return;
          }
        }
        setActiveStep(index + 1);
        break;
      }

      case 'api_key': {
        if (step.status !== 'completed') {
          // API key must be saved first via the "Save API key" button inside the step
          // If not yet saved, show an error prompt
          setVerify(step.id, { status: 'error', error: 'Save your API key before continuing.' });
          return;
        }
        setActiveStep(index + 1);
        break;
      }

      case 'oauth': {
        if (step.status !== 'completed') {
          setVerify(step.id, { status: 'verifying', error: null });
          try {
            await onPollProviderAuth(providerId, authSession?.id, { scope: 'drawer' });
            if (provider?.status !== 'connected') {
              setVerify(step.id, { status: 'error', error: 'Authorization not yet complete. Please finish the sign-in flow in your browser.' });
              return;
            }
            setVerify(step.id, { status: 'done', error: null });
          } catch (err) {
            setVerify(step.id, { status: 'error', error: err instanceof Error ? err.message : 'Authorization check failed.' });
            return;
          }
        }
        setActiveStep(index + 1);
        break;
      }

      case 'model': {
        if (step.status === 'completed') {
          setActiveStep(index + 1);
          return;
        }
        if (!modelValue.trim()) {
          setVerify(step.id, { status: 'error', error: 'Select or enter a model before continuing.' });
          return;
        }
        if (!profileId) return;
        setVerify(step.id, { status: 'verifying', error: null });
        try {
          const result = await onTestModelConfig(profileId, modelValue.trim(), providerId);
          if (!result.ok) {
            setVerify(step.id, { status: 'error', error: result.message });
            return;
          }
          await onUpdateRuntimeModelConfig({ defaultModel: modelValue.trim(), provider: providerId }, { scope: 'drawer' });
          setVerify(step.id, { status: 'done', error: null });
        } catch (err) {
          setVerify(step.id, { status: 'error', error: err instanceof Error ? err.message : 'Model verification failed.' });
          return;
        }
        setActiveStep(index + 1);
        break;
      }

      case 'verify':
      case 'complete': {
        if (provider?.ready) {
          setActiveStep(index + 1);
          return;
        }
        setVerify(step.id, { status: 'verifying', error: null });
        try {
          await onInspectProvider(providerId);
          setVerify(step.id, { status: 'done', error: null });
          if (provider?.ready) setActiveStep(index + 1);
        } catch (err) {
          setVerify(step.id, { status: 'error', error: err instanceof Error ? err.message : 'Readiness check failed.' });
        }
        break;
      }

      case 'manual':
      case 'config':
      case 'refresh': {
        if (profileId) {
          await setProviderStepCompletion(profileId, step.id, true).catch(() => undefined);
          setManualCompletions((prev) => new Set([...prev, step.id]));
        }
        setActiveStep(index + 1);
        break;
      }

      default:
        setActiveStep(index + 1);
    }
  }

  async function handleSaveApiKey(step: RuntimeProviderSetupStep) {
    if (!providerId || !apiKey.trim()) return;
    setVerify(step.id, { status: 'verifying', error: null });
    try {
      await onConnectProvider(providerId, apiKey.trim(), undefined, { scope: 'drawer' });
      setApiKey('');
      // Bust the live-discovery cache so the next model step render refetches with the new key
      if (profileId) invalidateProviderModels(profileId, providerId);
      setVerify(step.id, { status: 'done', error: null });
    } catch (err) {
      setVerify(step.id, { status: 'error', error: err instanceof Error ? err.message : 'Failed to save API key.' });
    }
  }

  const steps = provider?.setupSteps ?? [];
  const maxReachable = provider ? getFirstIncompleteIndex(steps, manualCompletions, provider.id, activeConfig) : 0;
  const isLastStep = activeStep === steps.length - 1;
  const isAllDone = steps.every((s) => isStepComplete(s, manualCompletions));
  const isConnected = provider?.status === 'connected';

  // Total step count includes the virtual confirm-delete step when active
  const totalStepCount = confirmingDelete ? steps.length + 1 : steps.length;
  const deleteStepIndex = steps.length;

  function handleClose() {
    setConfirmingDelete(false);
    onOpenChange(false);
  }

  async function handleConfirmDelete() {
    if (!providerId) return;
    setDeleting(true);
    try {
      await onDeleteProvider(providerId);
      handleClose();
    } catch {
      // error is shown via providerError from parent
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Drawer.Root
      lazyMount
      unmountOnExit
      open={open}
      onOpenChange={(event) => {
        if (!event.open) setConfirmingDelete(false);
        onOpenChange(event.open);
      }}
      size={{ base: 'full', md: 'lg' }}
      finalFocusEl={() =>
        finalFocusRef.current && finalFocusRef.current.isConnected
          ? finalFocusRef.current
          : document.body
      }
    >
      <Drawer.Backdrop backdropFilter="auto" backdropBlur="sm" bg="blackAlpha.500" />
      <Drawer.Positioner>
        <Drawer.Content bg="var(--surface-elevated)" borderLeft="1px solid var(--border-subtle)">
          <Drawer.Header borderBottom="1px solid var(--border-subtle)" pb="5">
            {!providerId ? (
              <Drawer.Title color="var(--text-primary)">Provider setup</Drawer.Title>
            ) : (
              <VStack align="center" gap="2" w="full" pt="2">
                <ProviderLogo providerId={providerId} size={64} />
                <Drawer.Title color="var(--text-primary)" textAlign="center">
                  {provider?.displayName ?? 'Loading…'}
                </Drawer.Title>
                {provider?.description ? (
                  <Text fontSize="sm" color="var(--text-secondary)" textAlign="center" maxW="360px">
                    {provider.description}
                  </Text>
                ) : null}
              </VStack>
            )}
          </Drawer.Header>

          <Drawer.Body overflowY="auto">
            {!providerId ? (
              <Text color="var(--text-muted)" py="6">No provider selected.</Text>
            ) : providerLoading && !provider ? (
              <HStack gap="2" py="6">
                <Spinner size="sm" color="var(--text-muted)" />
                <Text color="var(--text-muted)">Loading provider details…</Text>
              </HStack>
            ) : !provider ? (
              <Text color="var(--text-muted)" py="6">Provider data unavailable.</Text>
            ) : (
              <VStack align="stretch" gap="0">
                {providerError ? (
                  <Box mb="4">
                    <ErrorBanner title="Provider action failed" detail={providerError} />
                  </Box>
                ) : null}

                <Steps.Root
                  step={confirmingDelete ? deleteStepIndex : activeStep}
                  onStepChange={({ step: s }) => {
                    if (confirmingDelete) return;
                    if (s <= maxReachable) setActiveStep(s);
                  }}
                  count={totalStepCount}
                  orientation="horizontal"
                >
                  <Box overflowX="auto" pb="2">
                    <Steps.List minW={`${totalStepCount * 140}px`}>
                      {steps.map((s, i) => {
                        const completed = isStepComplete(s, manualCompletions);
                        const reachable = i <= maxReachable && !confirmingDelete;
                        return (
                          <Steps.Item key={s.id} index={i} opacity={reachable ? 1 : 0.35}>
                            <Steps.Trigger disabled={!reachable} cursor={reachable ? 'pointer' : 'default'}>
                              <Steps.Indicator />
                              <Steps.Title
                                fontSize="12px"
                                textDecoration={completed ? 'line-through' : undefined}
                                color={completed ? 'var(--text-muted)' : 'var(--text-primary)'}
                              >
                                {s.title}
                              </Steps.Title>
                            </Steps.Trigger>
                            <Steps.Separator />
                          </Steps.Item>
                        );
                      })}
                      {confirmingDelete && (
                        <Steps.Item key="__delete__" index={deleteStepIndex}>
                          <Steps.Trigger disabled cursor="default">
                            <Steps.Indicator />
                            <Steps.Title fontSize="12px" color="red.400">Confirm delete</Steps.Title>
                          </Steps.Trigger>
                          <Steps.Separator />
                        </Steps.Item>
                      )}
                    </Steps.List>
                  </Box>

                  <Box pt="5">
                    {steps.map((s, i) => (
                      <Steps.Content key={s.id} index={i}>
                        <Box rounded="10px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="4" py="4">
                          {s.kind === 'inspect' ? (
                            <StepContentInspect
                              step={s}
                              provider={provider}
                              loading={providerLoading}
                              onRetry={() => void Promise.resolve(onInspectProvider(providerId)).catch(() => undefined)}
                            />
                          ) : s.kind === 'api_key' ? (
                            <StepContentApiKey
                              step={s}
                              provider={provider}
                              apiKey={apiKey}
                              onApiKeyChange={setApiKey}
                              verifyState={verifyOf(s.id)}
                              onSave={() => void handleSaveApiKey(s)}
                            />
                          ) : s.kind === 'oauth' ? (
                            <StepContentOAuth
                              step={s}
                              authSession={authSession ?? undefined}
                              verifyState={verifyOf(s.id)}
                              onBeginAuth={() => void Promise.resolve(onBeginProviderAuth(providerId, { scope: 'drawer' })).catch(() => undefined)}
                              onVerify={() => void Promise.resolve(onPollProviderAuth(providerId, authSession?.id, { scope: 'drawer' })).catch(() => undefined)}
                              loading={providerLoading}
                            />
                          ) : s.kind === 'model' ? (
                            <StepContentModel
                              step={s}
                              provider={provider}
                              modelValue={modelValue}
                              modelOptions={mergedModelOptions}
                              modelsLoading={liveModels.loading}
                              modelsError={liveModels.source === 'error' ? liveModels.error : null}
                              onModelChange={setModelValue}
                              verifyState={verifyOf(s.id)}
                            />
                          ) : s.kind === 'verify' || s.kind === 'complete' ? (
                            <StepContentVerify
                              step={s}
                              provider={provider}
                              verifyState={verifyOf(s.id)}
                              onVerify={() => void Promise.resolve(onInspectProvider(providerId)).catch(() => undefined)}
                              loading={providerLoading}
                            />
                          ) : (
                            <StepContentManual step={s} />
                          )}
                        </Box>
                      </Steps.Content>
                    ))}

                    {confirmingDelete && (
                      <Steps.Content index={deleteStepIndex}>
                        <Box
                          rounded="10px"
                          border="1px solid rgba(220, 38, 38, 0.3)"
                          bg="rgba(220, 38, 38, 0.05)"
                          px="4"
                          py="4"
                        >
                          <VStack align="stretch" gap="2">
                            <Text fontWeight="600" color="var(--text-primary)">
                              Delete {provider.displayName}?
                            </Text>
                            <Text fontSize="sm" color="var(--text-secondary)">
                              This will permanently remove the stored credentials for {provider.displayName} and clear its connection from the active profile. This action cannot be undone.
                            </Text>
                          </VStack>
                        </Box>
                      </Steps.Content>
                    )}

                    <Steps.CompletedContent>
                      <VStack align="center" gap="3" py="6">
                        <CheckIcon />
                        <Text fontSize="sm" color="var(--text-secondary)">All steps complete.</Text>
                      </VStack>
                    </Steps.CompletedContent>
                  </Box>
                </Steps.Root>
              </VStack>
            )}
          </Drawer.Body>

          <Drawer.Footer borderTop="1px solid var(--border-subtle)">
            {confirmingDelete ? (
              <HStack w="full" justify="space-between" gap="3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmingDelete(false)}
                >
                  ← Back
                </Button>
                <Button
                  size="sm"
                  bg="red.500"
                  color="white"
                  _hover={{ bg: 'red.600' }}
                  loading={deleting}
                  onClick={() => void handleConfirmDelete()}
                >
                  Delete provider
                </Button>
              </HStack>
            ) : (
              <HStack w="full" justify="space-between" gap="3">
                {/* Left: Delete on last step (connected), Back on earlier steps */}
                {isConnected && provider && isLastStep ? (
                  <Button
                    variant="outline"
                    size="sm"
                    color="red.400"
                    borderColor="red.400"
                    _hover={{ bg: 'rgba(220,38,38,0.06)', borderColor: 'red.500', color: 'red.500' }}
                    onClick={() => setConfirmingDelete(true)}
                  >
                    Delete provider
                  </Button>
                ) : provider && activeStep > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveStep(activeStep - 1)}
                  >
                    ← Back
                  </Button>
                ) : (
                  <Box />
                )}

                {/* Right: Continue / Done / Close */}
                {provider && !confirmingDelete ? (
                  activeStep >= steps.length ? (
                    <Button size="sm" variant="outline" onClick={handleClose}>Close</Button>
                  ) : isLastStep ? (
                    <Button
                      size="sm"
                      bg={isAllDone ? 'var(--accent)' : 'var(--surface-3)'}
                      color={isAllDone ? 'var(--accent-contrast)' : 'var(--text-secondary)'}
                      _hover={isAllDone ? { bg: 'var(--accent-strong)' } : undefined}
                      onClick={handleClose}
                    >
                      {isAllDone ? 'Done — provider ready' : 'Close'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      bg="var(--accent)"
                      color="var(--accent-contrast)"
                      _hover={{ bg: 'var(--accent-strong)' }}
                      loading={providerLoading || (steps[activeStep] ? verifyOf(steps[activeStep].id).status === 'verifying' : false)}
                      onClick={() => {
                        const s = steps[activeStep];
                        if (s) void handleContinue(s, activeStep);
                      }}
                    >
                      Continue →
                    </Button>
                  )
                ) : (
                  <Button variant="outline" size="sm" onClick={handleClose}>Close</Button>
                )}
              </HStack>
            )}
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}
