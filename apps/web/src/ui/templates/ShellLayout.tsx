import { Alert, Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import type { ConnectionState } from '@hermes-recipes/protocol';
import type { ReactNode } from 'react';
import { ThemeToggle } from '../atoms/ThemeToggle';
import { BrandLockup } from '../atoms/BrandLockup';
import { StatusPill } from '../atoms/StatusPill';
import { ErrorBanner } from '../molecules/ErrorBanner';
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
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: 'var(--status-warning)',
            opacity: 0.8,
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'inherit'
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
    <HStack
      gap="1"
      px="2.5"
      py="1"
      rounded="999px"
      bg="var(--surface-2)"
      border="1px solid var(--border-subtle)"
      align="center"
    >
      {provider ? (
        <Text fontSize="11px" color="var(--text-muted)" fontWeight="500">
          {provider}
        </Text>
      ) : null}
      {provider ? (
        <Text fontSize="11px" color="var(--text-muted)" fontWeight="400">/</Text>
      ) : null}
      <Text fontSize="11px" color="var(--text-secondary)" fontWeight="600" letterSpacing="-0.01em">
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
  const versionMismatch =
    expectedHermesVersion &&
    hermesVersion &&
    hermesVersion !== expectedHermesVersion;

  const gatewayDown = connection.status !== 'connected' && connection.detail;

  return (
    <Flex
      direction={{ base: 'column', lg: 'row' }}
      minH="100dvh"
      h="100dvh"
      overflow="hidden"
      bg="var(--app-bg)"
      p={{ base: '0', lg: '4' }}
      gap={{ base: '0', lg: '4' }}
    >
      {sidebar}

      <Flex
        direction="column"
        flex="1"
        minW={0}
        minH={0}
        rounded={{ base: '0', lg: '10px' }}
        border={{ base: 'none', lg: '1px solid var(--border-subtle)' }}
        bg="var(--shell-bg)"
        boxShadow={{ base: 'none', lg: 'var(--shadow-md)' }}
        backdropFilter="blur(20px)"
        overflow="hidden"
      >
        {/* Header */}
        <Box
          px={{ base: '4', lg: '5' }}
          py={{ base: '3', lg: '3.5' }}
          borderBottom="1px solid var(--border-subtle)"
          flexShrink={0}
        >
          <HStack justify="space-between" align="center" gap="4" data-testid="shell-toolbar">
            {headerMode === 'full' ? (
              <PageHeader profileName={profileName} pageName={pageTitle} detail={headerDetail} />
            ) : (
              <Box flex="1" minW={0}>
                <BrandLockup compact />
              </Box>
            )}

            {/* Right status cluster */}
            <HStack gap="2" flexShrink={0} align="center">
              {activeModelLabel ? (
                <ModelPill label={activeModelLabel} />
              ) : null}
              <StatusPill label={connection.status} />
              <ThemeToggle onPersist={onPersistTheme} />
            </HStack>
          </HStack>
        </Box>

        {/* Gateway / connection banner */}
        {gatewayDown ? (
          <GatewayBanner detail={`${connection.detail}${connection.usingCachedData ? ' Showing cached data.' : ''}`} />
        ) : null}

        {/* Version mismatch alert */}
        {versionMismatch ? (
          <Alert.Root
            status="warning"
            borderRadius="0"
            borderBottom="1px solid rgba(234, 179, 8, 0.22)"
            bg="var(--surface-warning)"
          >
            <Alert.Content>
              <Alert.Title color="var(--text-primary)" fontSize="sm">
                Hermes version mismatch
              </Alert.Title>
              <Alert.Description color="var(--text-secondary)" fontSize="xs">
                This app was built for Hermes v{expectedHermesVersion}. You are running v{hermesVersion}. Some features may not work correctly.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        ) : null}

        {/* Tab bar */}
        {tabBar ?? null}

        {/* Page content */}
        <Box
          flex="1"
          minH={0}
          px={{ base: '4', lg: '5' }}
          pt={tabBar ? '4' : '5'}
          pb={{ base: '4', lg: '5' }}
          overflow="hidden"
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}

export { Sidebar };
