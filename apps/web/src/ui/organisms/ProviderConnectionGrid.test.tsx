// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RuntimeProviderOption } from '@hermes-recipes/protocol';
import { ProviderConnectionGrid } from './ProviderConnectionGrid';

afterEach(() => {
  cleanup();
});

function makeProvider(overrides: Partial<RuntimeProviderOption> & { id: string }): RuntimeProviderOption {
  return {
    id: overrides.id,
    profileId: 'default',
    displayName: overrides.displayName ?? overrides.id,
    authKind: overrides.authKind ?? 'api_key',
    status: overrides.status ?? 'available',
    source: overrides.source ?? 'local_config',
    supportsApiKey: overrides.supportsApiKey ?? true,
    supportsOAuth: overrides.supportsOAuth ?? false,
    lastSyncedAt: '2026-04-27T00:00:00.000Z',
    state: overrides.state ?? 'unconfigured',
    stateMessage: overrides.stateMessage ?? '',
    ready: overrides.ready ?? false,
    modelSelectionMode: 'select_only',
    disabled: overrides.disabled ?? false,
    supportsModelDiscovery: overrides.supportsModelDiscovery ?? false,
    supportsDisconnect: overrides.supportsDisconnect ?? false,
    models: overrides.models ?? [],
    configurationFields: overrides.configurationFields ?? [],
    setupSteps: overrides.setupSteps ?? []
  };
}

const PROVIDERS: RuntimeProviderOption[] = [
  makeProvider({ id: 'openrouter', displayName: 'OpenRouter', status: 'connected' }),
  makeProvider({ id: 'anthropic', displayName: 'Anthropic' }),
  makeProvider({ id: 'openai', displayName: 'OpenAI' }),
  // Unsupported / "Coming soon" — kilocode has no entry in DISCOVERY_SUPPORTED_PROVIDERS
  makeProvider({ id: 'kilocode', displayName: 'KiloCode' }),
  makeProvider({ id: 'ai_gateway', displayName: 'AI Gateway' })
];

function renderGrid(props: Partial<Parameters<typeof ProviderConnectionGrid>[0]> = {}) {
  const onConnect = (props.onConnect ?? vi.fn()) as ReturnType<typeof vi.fn> & ((providerId: string) => void);
  render(
    <ChakraProvider value={defaultSystem}>
      <ProviderConnectionGrid
        providers={props.providers ?? PROVIDERS}
        loading={props.loading ?? false}
        onConnect={onConnect}
      />
    </ChakraProvider>
  );
  return { onConnect };
}

describe('ProviderConnectionGrid', () => {
  it('splits providers into Connected and Available sections', () => {
    renderGrid();
    expect(screen.getByText('Connected Providers')).toBeInTheDocument();
    expect(screen.getByText('Available Providers')).toBeInTheDocument();
  });

  it('renders a Connect button for available providers', () => {
    renderGrid();
    // Anthropic and OpenAI are supported & not connected → "Connect"
    const connectButtons = screen.getAllByRole('button', { name: /^Connect$/ });
    expect(connectButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders a Manage button for already-connected providers', () => {
    renderGrid();
    expect(screen.getByRole('button', { name: 'Manage' })).toBeInTheDocument();
  });

  it('marks unsupported providers as "Coming soon" and disables their button', () => {
    renderGrid();
    // kilocode and ai_gateway have no entry in DISCOVERY_SUPPORTED_PROVIDERS
    const comingSoonButtons = screen.getAllByRole('button', { name: 'Coming soon' });
    expect(comingSoonButtons.length).toBe(2);
    for (const button of comingSoonButtons) {
      expect(button).toBeDisabled();
    }
  });

  it('fires onConnect with the provider id when Connect is clicked', async () => {
    const { onConnect } = renderGrid();
    const allConnectButtons = screen.getAllByRole('button', { name: /^Connect$/ });
    await userEvent.click(allConnectButtons[0]);
    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(onConnect.mock.calls[0][0]).toMatch(/^(anthropic|openai)$/);
  });

  it('fires onConnect when Manage is clicked on a connected provider', async () => {
    const { onConnect } = renderGrid();
    await userEvent.click(screen.getByRole('button', { name: 'Manage' }));
    expect(onConnect).toHaveBeenCalledWith('openrouter');
  });

  it('does not fire onConnect when the disabled Coming soon button is clicked', async () => {
    const { onConnect } = renderGrid();
    const comingSoon = screen.getAllByRole('button', { name: 'Coming soon' })[0];
    await userEvent.click(comingSoon);
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('filters providers by display name via the search input', async () => {
    renderGrid();
    const search = screen.getByPlaceholderText('Search providers…');
    await userEvent.type(search, 'open');
    // OpenRouter (connected) + OpenAI (available) — both have "open"
    expect(screen.getByText('OpenRouter')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.queryByText('Anthropic')).not.toBeInTheDocument();
    expect(screen.queryByText('KiloCode')).not.toBeInTheDocument();
  });

  it('shows an empty-state message when search has no matches', async () => {
    renderGrid();
    const search = screen.getByPlaceholderText('Search providers…');
    await userEvent.type(search, 'zzznothing');
    expect(screen.getByText(/No providers match/)).toBeInTheDocument();
  });

  it('shows a "Refreshing…" indicator when loading', () => {
    renderGrid({ loading: true });
    expect(screen.getByText('Refreshing…')).toBeInTheDocument();
  });
});
