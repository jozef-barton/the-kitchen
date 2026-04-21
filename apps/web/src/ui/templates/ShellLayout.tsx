import { Alert, Box, Flex, HStack, Text } from '@chakra-ui/react';
import { BrandLockup } from '../atoms/BrandLockup';
import type { ConnectionState } from '@hermes-recipes/protocol';
import type { ReactNode } from 'react';
import { ThemeToggle } from '../atoms/ThemeToggle';
import { StatusPill } from '../atoms/StatusPill';
import { PageHeader } from '../molecules/PageHeader';
import { Sidebar } from '../organisms/Sidebar';

function GatewayBanner({ detail, onDismiss }: { detail: string; onDismiss?: () => void }) {
  const isStopped = /stop|unavail/i.test(detail);
  return (
    <div className="gateway-banner">
      <span className="gateway-banner__dot" />
      <span className="gateway-banner__text">
        {isStopped ? 'Hermes gateway stopped — ' : 'Bridge issue — '}
        {detail}
      </span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '12px', color: 'var(--status-warning)', opacity: 0.8,
            padding: '2px 6px', borderRadius: '4px', fontFamily: 'inherit'
          }}
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

function ModelPill({ label }: { label?: string }) {
  if (!label) return null;
  const parts = label.split('/');
  const provider = parts.length > 1 ? parts[0] : null;
  const model = parts.length > 1 ? parts.slice(1).join('/') : label;
  return (
    <HStack gap="1" align="center">
      {provider ? (
        <Text fontSize="11px" color="var(--text-muted)" fontWeight="400">
          {provider}/
        </Text>
      ) : null}
      <Text fontSize="11px" color="var(--text-secondary)" fontWeight="500">
        {model}
      </Text>
    </HStack>
  );
}

export function ShellLayout({
  connection,
  profileName,
  pageTitle,
  headerDetail,
  headerMode = 'full',
  sidebar,
  tabBar,
  onPersistTheme,
  hermesVersion,
  expectedHermesVersion,
  activeModelLabel,
  children
}: {
  connection: ConnectionState;
  profileName: string | null;
  pageTitle: string;
  headerDetail: string;
  headerMode?: 'full' | 'compact';
  sidebar: ReactNode;
  tabBar?: ReactNode;
  onPersistTheme: (themeMode: 'dark' | 'light') => Promise<void> | void;
  hermesVersion?: string | null;
  expectedHermesVersion?: string | null;
  activeModelLabel?: string | null;
  children: ReactNode;
}) {
  const versionMismatch = expectedHermesVersion && hermesVersion && hermesVersion !== expectedHermesVersion;
  const gatewayDown = connection.status !== 'connected' && connection.detail;

  return (
    <Flex
      direction={{ base: 'column', lg: 'row' }}
      minH="100dvh"
      h="100dvh"
      overflow="hidden"
      bg="var(--shell-bg)"
    >
      {sidebar}

      <Flex
        direction="column"
        flex="1"
        minW={0}
        minH={0}
        bg="var(--shell-bg)"
        overflow="hidden"
      >
        {/* Top bar — nearly invisible chrome */}
        <Box px={{ base: '4', lg: '5' }} py="1.5" flexShrink={0}>
          <HStack justify="space-between" align="center" gap="3" data-testid="shell-toolbar">
            {headerMode === 'full' ? (
              <PageHeader profileName={profileName} pageName={pageTitle} detail={headerDetail} />
            ) : (
              <Box flex="1" minW={0}>
                <BrandLockup compact />
              </Box>
            )}

            <HStack gap="2" flexShrink={0} align="center">
              <ModelPill label={activeModelLabel ?? undefined} />
              <StatusPill label={connection.status} />
              <ThemeToggle onPersist={onPersistTheme} />
            </HStack>
          </HStack>
        </Box>

        <Box h="1px" bg="var(--border-subtle)" opacity={0.6} flexShrink={0} />

        {gatewayDown ? (
          <GatewayBanner detail={`${connection.detail}${connection.usingCachedData ? ' Showing cached data.' : ''}`} />
        ) : null}

        {versionMismatch ? (
          <Alert.Root
            status="warning"
            borderRadius="0"
            borderBottom="1px solid rgba(234, 179, 8, 0.22)"
            bg="var(--surface-warning)"
          >
            <Alert.Content>
              <Alert.Title color="var(--text-primary)" fontSize="sm">Hermes version mismatch</Alert.Title>
              <Alert.Description color="var(--text-secondary)" fontSize="xs">
                This app expects Hermes v{expectedHermesVersion}. You are running v{hermesVersion}.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        ) : null}

        {tabBar ?? null}

        {/* Main content — generous and open */}
        <Box
          flex="1"
          minH={0}
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}

export { Sidebar };
