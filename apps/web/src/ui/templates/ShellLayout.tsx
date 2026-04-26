import { useState } from 'react';
import { Alert, Box, Button, CloseButton, Drawer, Flex, HStack, Portal, Text, chakra } from '@chakra-ui/react';
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

function _ModelPill({ label }: { label?: string }) {
  if (!label) return null;
  const model = label.split('/').pop() ?? label;
  return (
    <Text fontSize="11px" color="var(--text-muted)" fontWeight="400" letterSpacing="0">
      {model}
    </Text>
  );
}

function HamburgerIcon() {
  const Svg = chakra('svg');
  return (
    <Svg viewBox="0 0 16 16" boxSize="4" fill="none" aria-hidden="true" color="currentColor" flexShrink={0}>
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function ShellLayout({
  connection,
  profileName,
  pageTitle,
  headerDetail: _headerDetail,
  headerMode = 'full',
  sidebar,
  mobileNavContent,
  tabBar,
  onPersistTheme,
  hermesVersion,
  expectedHermesVersion,
  activeModelLabel: _activeModelLabel,
  children
}: {
  connection: ConnectionState;
  profileName: string | null;
  pageTitle: string;
  headerDetail: string;
  headerMode?: 'full' | 'compact';
  sidebar: ReactNode;
  mobileNavContent?: ReactNode;
  tabBar?: ReactNode;
  onPersistTheme: (themeMode: 'dark' | 'light') => Promise<void> | void;
  hermesVersion?: string | null;
  expectedHermesVersion?: string | null;
  activeModelLabel?: string | null;
  children: ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
      {/* Desktop sidebar — hidden on mobile by collapsing to zero height (NOT display:none so tests
          can still query nav buttons via getByRole without needing hidden:true) */}
      <Box
        h={{ base: 0, lg: '100dvh' }}
        minH={0}
        overflow="hidden"
        flexShrink={0}
      >
        {sidebar}
      </Box>

      {/* Mobile nav drawer */}
      {mobileNavContent ? (
        <Drawer.Root
          lazyMount
          unmountOnExit
          open={mobileNavOpen}
          onOpenChange={(e) => setMobileNavOpen(e.open)}
          placement="start"
        >
          <Portal>
            <Drawer.Backdrop backdropFilter="auto" backdropBlur="sm" bg="blackAlpha.500" />
            <Drawer.Positioner display={{ base: 'block', lg: 'none' }}>
              <Drawer.Content
                maxW={{ base: '100%', sm: '300px' }}
                bg="var(--sidebar-bg)"
                borderRight="1px solid var(--border-subtle)"
                overflow="hidden"
              >
                <Drawer.Header
                  px="3"
                  pt="3"
                  pb="2"
                  borderBottom="1px solid var(--border-subtle)"
                >
                  <HStack justify="space-between" align="center">
                    <HStack gap="2" minW={0}>
                      <span aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>🧑‍🍳</span>
                      <Box minW={0}>
                        <Text fontSize="xs" fontWeight="700" letterSpacing="-0.01em" color="var(--text-primary)" lineHeight="1.15" truncate>
                          The Kitchen
                        </Text>
                        <Text fontSize="10px" color="var(--text-muted)" lineHeight="1.3" fontWeight="400">
                          Local Hermes workspace
                        </Text>
                      </Box>
                    </HStack>
                    <Drawer.CloseTrigger asChild>
                      <CloseButton size="sm" color="var(--text-muted)" flexShrink={0} />
                    </Drawer.CloseTrigger>
                  </HStack>
                </Drawer.Header>
                <Drawer.Body p="0" overflow="hidden" flex="1" minH={0} display="flex" flexDirection="column">
                  {mobileNavContent}
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      ) : null}

      <Flex
        direction="column"
        flex="1"
        minW={0}
        minH={0}
        bg="var(--shell-bg)"
        overflow="hidden"
      >
        {/* Top bar — minimal chrome */}
        <Box px={{ base: '3', lg: '5' }} py="1" flexShrink={0}>
          <HStack justify="space-between" align="center" gap="3" data-testid="shell-toolbar">
            {/* Mobile hamburger */}
            {mobileNavContent ? (
              <Button
                display={{ base: 'flex', lg: 'none' }}
                variant="ghost"
                size="sm"
                rounded="8px"
                px="1.5"
                h="8"
                minW={0}
                color="var(--text-muted)"
                _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                aria-label="Open navigation"
                title="Open navigation"
                onClick={() => setMobileNavOpen(true)}
                flexShrink={0}
              >
                <HamburgerIcon />
              </Button>
            ) : null}

            {headerMode === 'full' ? (
              <PageHeader profileName={profileName} pageName={pageTitle} />
            ) : (
              <Box flex="1" minW={0}>
                <BrandLockup compact />
              </Box>
            )}

            <HStack gap="2" flexShrink={0} align="center">
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
