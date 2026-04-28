import { useMemo, useState } from 'react';
import { Box, Button, Grid, HStack, Input, Text, VStack } from '@chakra-ui/react';
import type { RuntimeProviderOption } from '@hermes-recipes/protocol';
import { ProviderLogo } from '../atoms/ProviderLogo';
import { isProviderSupported } from '../../lib/provider-models';

function providerCanBeConnected(provider: RuntimeProviderOption): boolean {
  return isProviderSupported(provider.id);
}

function authTypeLabel(provider: RuntimeProviderOption): string {
  if (provider.supportsOAuth && provider.supportsApiKey) return 'OAuth or API Key';
  if (provider.supportsOAuth) return 'OAuth';
  if (provider.supportsApiKey) return 'API Key';
  return 'Unknown';
}

function ProviderCard({
  provider,
  onConnect
}: {
  provider: RuntimeProviderOption;
  onConnect: () => void;
}) {
  const connected = provider.status === 'connected';
  const comingSoon = !providerCanBeConnected(provider);

  return (
    <Box
      rounded="12px"
      border="1px solid"
      borderColor={connected ? 'var(--border-moderate)' : 'var(--border-subtle)'}
      bg="var(--surface-elevated)"
      px="5"
      py="5"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap="3"
      textAlign="center"
      transition="box-shadow 120ms ease, border-color 120ms ease"
      _hover={!comingSoon ? { borderColor: 'var(--border-moderate)', boxShadow: 'var(--shadow-sm)' } : undefined}
      position="relative"
    >
      {comingSoon ? (
        <Box
          position="absolute"
          top="10px"
          right="10px"
          px="1.5"
          py="0.5"
          rounded="4px"
          bg="var(--surface-3)"
          border="1px solid var(--border-subtle)"
        >
          <Text fontSize="10px" fontWeight="600" color="var(--text-muted)" letterSpacing="0.05em">
            COMING SOON
          </Text>
        </Box>
      ) : null}

      <ProviderLogo providerId={provider.id} size={48} />

      <VStack gap="1" align="center">
        <Text fontSize="14px" fontWeight="600" color="var(--text-primary)" lineHeight="1.3">
          {provider.displayName}
        </Text>
        <Text fontSize="11px" color="var(--text-muted)">
          {authTypeLabel(provider)}
        </Text>
      </VStack>

      {comingSoon ? (
        <Button
          size="sm"
          rounded="8px"
          variant="outline"
          disabled
          w="full"
          fontSize="13px"
          opacity={0.5}
          cursor="not-allowed"
        >
          Coming soon
        </Button>
      ) : connected ? (
        <Button
          size="sm"
          rounded="8px"
          variant="outline"
          onClick={onConnect}
          w="full"
          fontSize="13px"
          color="var(--text-secondary)"
        >
          Manage
        </Button>
      ) : (
        <Button
          size="sm"
          rounded="8px"
          bg="var(--accent)"
          color="var(--accent-contrast)"
          _hover={{ bg: 'var(--accent-strong)' }}
          onClick={onConnect}
          px="5"
          fontSize="13px"
        >
          Connect
        </Button>
      )}
    </Box>
  );
}

const GRID_COLS = {
  base: 'repeat(2, 1fr)',
  sm: 'repeat(3, 1fr)',
  md: 'repeat(4, 1fr)',
  lg: 'repeat(5, 1fr)'
} as const;

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      fontSize="11px"
      fontWeight="600"
      color="var(--text-muted)"
      letterSpacing="0.07em"
      textTransform="uppercase"
    >
      {children}
    </Text>
  );
}

export function ProviderConnectionGrid({
  providers,
  loading,
  onConnect
}: {
  providers: RuntimeProviderOption[];
  loading: boolean;
  onConnect: (providerId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      q
        ? providers.filter(
            (p) =>
              p.displayName.toLowerCase().includes(q) ||
              p.id.toLowerCase().includes(q)
          )
        : providers,
    [providers, q]
  );

  const connectedProviders = useMemo(() => filtered.filter((p) => p.status === 'connected'), [filtered]);
  const availableProviders = useMemo(() => filtered.filter((p) => p.status !== 'connected'), [filtered]);
  const noResults = filtered.length === 0;

  return (
    <VStack align="stretch" gap="6">
      <HStack justify="space-between" align="center" gap="3">
        <Input
          placeholder="Search providers…"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          bg="var(--surface-2)"
          borderColor="var(--border-subtle)"
          rounded="8px"
          size="sm"
          maxW="280px"
        />
        {loading ? (
          <Text fontSize="12px" color="var(--text-muted)">Refreshing…</Text>
        ) : null}
      </HStack>

      {noResults ? (
        <Box py="8" textAlign="center">
          <Text color="var(--text-muted)">{`No providers match "${search}"`}</Text>
        </Box>
      ) : (
        <>
          {connectedProviders.length > 0 && (
            <VStack align="stretch" gap="3">
              <SectionLabel>Connected Providers</SectionLabel>
              <Grid templateColumns={GRID_COLS} gap="3">
                {connectedProviders.map((p) => (
                  <ProviderCard key={p.id} provider={p} onConnect={() => onConnect(p.id)} />
                ))}
              </Grid>
            </VStack>
          )}

          {availableProviders.length > 0 && (
            <VStack align="stretch" gap="3">
              <SectionLabel>Available Providers</SectionLabel>
              <Grid templateColumns={GRID_COLS} gap="3">
                {availableProviders.map((p) => (
                  <ProviderCard key={p.id} provider={p} onConnect={() => onConnect(p.id)} />
                ))}
              </Grid>
            </VStack>
          )}
        </>
      )}
    </VStack>
  );
}
