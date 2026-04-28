// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModelProviderResponse, RuntimeProviderOption } from '@hermes-recipes/protocol';
import { ProviderModelSelector } from './ModelSelector';

// Mock the live-discovery hook so each test controls what models are returned
const mockUseProviderModels = vi.fn();
vi.mock('../../hooks/use-provider-models', () => ({
  useProviderModels: (...args: unknown[]) => mockUseProviderModels(...args),
  invalidateProviderModels: vi.fn()
}));

// Mock the verification API
const mockTestModelConfig = vi.fn();
vi.mock('../../lib/api', () => ({
  testModelConfig: (...args: unknown[]) => mockTestModelConfig(...args)
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockUseProviderModels.mockReset();
  mockTestModelConfig.mockReset();
  // Default: no live models, idle state
  mockUseProviderModels.mockReturnValue({ models: [], source: 'idle', error: null, loading: false });
});

function makeProvider(overrides: Partial<RuntimeProviderOption> & { id: string }): RuntimeProviderOption {
  return {
    id: overrides.id,
    profileId: 'default',
    displayName: overrides.displayName ?? overrides.id,
    authKind: overrides.authKind ?? 'api_key',
    status: overrides.status ?? 'connected',
    source: 'local_config',
    supportsApiKey: overrides.supportsApiKey ?? true,
    supportsOAuth: overrides.supportsOAuth ?? false,
    lastSyncedAt: '2026-04-27T00:00:00.000Z',
    state: overrides.state ?? 'connected',
    stateMessage: '',
    ready: overrides.ready ?? true,
    modelSelectionMode: 'select_only',
    disabled: false,
    supportsModelDiscovery: true,
    supportsDisconnect: false,
    models: overrides.models ?? [],
    configurationFields: overrides.configurationFields ?? [],
    setupSteps: []
  };
}

function makeResponse(overrides: { provider: string; defaultModel: string; providers: RuntimeProviderOption[] }): ModelProviderResponse {
  return {
    connection: {
      status: 'connected',
      checkedAt: '2026-04-27T00:00:00.000Z',
      usingCachedData: false
    },
    config: {
      profileId: 'default',
      defaultModel: overrides.defaultModel,
      provider: overrides.provider,
      baseUrl: '',
      apiMode: 'chat_completions',
      maxTurns: 150,
      reasoningEffort: 'medium',
      toolUseEnforcement: 'auto',
      lastSyncedAt: '2026-04-27T00:00:00.000Z'
    },
    providers: overrides.providers,
    runtimeReadiness: {
      ready: true,
      code: 'ready',
      message: '',
      providerId: overrides.provider,
      modelId: overrides.defaultModel.split('/').pop() ?? overrides.defaultModel
    },
    inspectedProviderId: overrides.provider,
    discoveredAt: '2026-04-27T00:00:00.000Z'
  };
}

function renderSelector(props: Partial<Parameters<typeof ProviderModelSelector>[0]> = {}) {
  const onUpdate = props.onUpdateRuntimeModelConfig ?? vi.fn().mockResolvedValue(undefined);
  const onChooseProvider = props.onChooseProvider ?? vi.fn();
  render(
    <ChakraProvider value={defaultSystem}>
      <ProviderModelSelector
        modelProviderResponse={props.modelProviderResponse ?? null}
        onUpdateRuntimeModelConfig={onUpdate}
        onChooseProvider={onChooseProvider}
      />
    </ChakraProvider>
  );
  return { onUpdate, onChooseProvider };
}

describe('ProviderModelSelector', () => {
  it('renders nothing when there is no model provider response', () => {
    const { container } = render(
      <ChakraProvider value={defaultSystem}>
        <ProviderModelSelector
          modelProviderResponse={null}
          onUpdateRuntimeModelConfig={vi.fn()}
          onChooseProvider={vi.fn()}
        />
      </ChakraProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a "Choose a provider" CTA when no providers are connected', async () => {
    const onChooseProvider = vi.fn();
    const response = makeResponse({
      provider: 'auto',
      defaultModel: 'unknown',
      providers: [
        makeProvider({ id: 'openrouter', status: 'missing', ready: false })
      ]
    });
    renderSelector({ modelProviderResponse: response, onChooseProvider });
    const cta = screen.getByRole('button', { name: 'Choose a provider' });
    await userEvent.click(cta);
    expect(onChooseProvider).toHaveBeenCalled();
  });

  it('falls back to the first connected provider when config.provider is "auto"', () => {
    const response = makeResponse({
      provider: 'auto',
      defaultModel: 'unknown',
      providers: [
        makeProvider({ id: 'openrouter', displayName: 'OpenRouter', status: 'connected' })
      ]
    });
    renderSelector({ modelProviderResponse: response });
    // Provider trigger shows the resolved provider, not literal 'auto'
    expect(screen.getByRole('button', { name: 'Active provider' })).toHaveTextContent('OpenRouter');
  });

  it('verifies the model BEFORE saving when the user picks a new model', async () => {
    mockUseProviderModels.mockReturnValue({
      models: [
        { value: 'openai/gpt-4o', label: 'GPT-4o' },
        { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' }
      ],
      source: 'live',
      error: null,
      loading: false
    });
    mockTestModelConfig.mockResolvedValue({ ok: true, message: 'OK', latencyMs: 100 });

    const response = makeResponse({
      provider: 'openrouter',
      defaultModel: 'openai/gpt-4o',
      providers: [makeProvider({ id: 'openrouter', displayName: 'OpenRouter' })]
    });
    const { onUpdate } = renderSelector({ modelProviderResponse: response });

    // Open the model dropdown and pick a different model
    await userEvent.click(screen.getByRole('button', { name: 'Active model' }));
    await userEvent.click(screen.getByRole('option', { name: /GPT-4o Mini/ }));

    // Wait for verification to complete
    await waitFor(() => expect(mockTestModelConfig).toHaveBeenCalledTimes(1));
    expect(mockTestModelConfig).toHaveBeenCalledWith('default', 'openai/gpt-4o-mini', 'openrouter');

    // Only after verification should we call onUpdateRuntimeModelConfig
    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onUpdate).toHaveBeenCalledWith(
      { defaultModel: 'openai/gpt-4o-mini', provider: 'openrouter' },
      { scope: 'page' }
    );
  });

  it('does NOT save the new model when verification fails', async () => {
    mockUseProviderModels.mockReturnValue({
      models: [
        { value: 'openai/gpt-4o', label: 'GPT-4o' },
        { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' }
      ],
      source: 'live',
      error: null,
      loading: false
    });
    mockTestModelConfig.mockResolvedValue({
      ok: false,
      message: 'Context window too small.',
      latencyMs: 100
    });

    const response = makeResponse({
      provider: 'openrouter',
      defaultModel: 'openai/gpt-4o',
      providers: [makeProvider({ id: 'openrouter', displayName: 'OpenRouter' })]
    });
    const { onUpdate } = renderSelector({ modelProviderResponse: response });

    await userEvent.click(screen.getByRole('button', { name: 'Active model' }));
    await userEvent.click(screen.getByRole('option', { name: /GPT-4o Mini/ }));

    await waitFor(() => expect(mockTestModelConfig).toHaveBeenCalled());
    // onUpdate is NOT called because verification rejected the model
    await new Promise((r) => setTimeout(r, 50));
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('does not re-verify when the user picks the same model again', async () => {
    mockUseProviderModels.mockReturnValue({
      models: [{ value: 'openai/gpt-4o', label: 'GPT-4o' }],
      source: 'live',
      error: null,
      loading: false
    });
    const response = makeResponse({
      provider: 'openrouter',
      defaultModel: 'openai/gpt-4o',
      providers: [makeProvider({ id: 'openrouter' })]
    });
    renderSelector({ modelProviderResponse: response });

    await userEvent.click(screen.getByRole('button', { name: 'Active model' }));
    await userEvent.click(screen.getByRole('option', { name: /GPT-4o/ }));

    await new Promise((r) => setTimeout(r, 50));
    expect(mockTestModelConfig).not.toHaveBeenCalled();
  });

  it('saves the provider change immediately without verification', async () => {
    const response = makeResponse({
      provider: 'openrouter',
      defaultModel: 'openai/gpt-4o',
      providers: [
        makeProvider({ id: 'openrouter', displayName: 'OpenRouter' }),
        makeProvider({ id: 'anthropic', displayName: 'Anthropic' })
      ]
    });
    const { onUpdate } = renderSelector({ modelProviderResponse: response });

    await userEvent.click(screen.getByRole('button', { name: 'Active provider' }));
    await userEvent.click(screen.getByRole('option', { name: /Anthropic/ }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onUpdate).toHaveBeenCalledWith({ provider: 'anthropic' }, { scope: 'page' });
    // No verification on provider switch alone
    expect(mockTestModelConfig).not.toHaveBeenCalled();
  });
});
