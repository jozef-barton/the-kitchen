import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, Box, Button, CloseButton, Drawer, Flex, HStack, Portal, Text, chakra } from '@chakra-ui/react';
import type { ConnectionState } from '@hermes-recipes/protocol';
import type { ReactNode } from 'react';
import { ThemeToggle } from '../atoms/ThemeToggle';
import { StatusPill } from '../atoms/StatusPill';
import { PageHeader } from '../molecules/PageHeader';
import { Sidebar } from '../organisms/Sidebar';

function GatewayBanner({ detail, onDismiss }: { detail: string; onDismiss?: () => void }) {
  const isStopped = /stop|unavail/i.test(detail);
  return (
    <div className="gateway-banner" role="alert" aria-live="assertive" aria-atomic="true">
      <span className="gateway-banner__dot" aria-hidden="true" />
      <span className="gateway-banner__text">
        {isStopped ? 'Hermes gateway stopped — ' : 'Bridge issue — '}
        {detail}
      </span>
      {onDismiss ? (
        <button
          type="button"
          aria-label="Dismiss bridge issue notification"
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

/* Minimal connection indicator — dot with one-time pulse on connect */
function ConnectionIndicator({ status }: { status: string }) {
  const isConnected = status === 'connected' || status === 'healthy';
  const isReconnecting = status === 'degraded' || status === 'paused';
  const prevStatusRef = useRef<string>(status);
  const [pulse, setPulse] = useState(isConnected);

  useEffect(() => {
    if (!isConnected) { prevStatusRef.current = status; return; }
    if (prevStatusRef.current !== status) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1800);
      prevStatusRef.current = status;
      return () => clearTimeout(t);
    }
  }, [status, isConnected]);

  if (isConnected) {
    return (
      <Box
        as="span"
        role="img"
        className={`status-dot status-dot--connected${pulse ? ' status-dot--connected-pulse' : ''}`}
        title="Connected"
        aria-label="Connected"
      />
    );
  }
  if (isReconnecting) {
    return (
      <Box
        as="span"
        role="img"
        className="status-dot status-dot--reconnecting"
        title={status}
        aria-label={status}
      />
    );
  }
  return <StatusPill label={status} />;
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
  profileName: _profileName,
  pageTitle,
  headerDetail: _headerDetail,
  headerMode: _headerMode,
  sidebar,
  mobileNavContent,
  tabBar,
  onPersistTheme,
  hermesVersion,
  expectedHermesVersion,
  modelSelectorSlot,
  activeModelLabel: _activeModelLabel,
  sidebarCollapsed: _sidebarCollapsed = false,
  onToggleSidebar: _onToggleSidebar,
  noGutter = false,
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
  modelSelectorSlot?: ReactNode;
  activeModelLabel?: string | null;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  noGutter?: boolean;
  children: ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Close mobile nav whenever the URL changes (any nav action triggers this)
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

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
      {/* Skip to main content — first focusable element on the page */}
      <a
        href="#main-content"
        className="skip-link"
        style={{
          position: 'absolute',
          top: '-999px',
          left: '-999px',
          zIndex: 9999,
          padding: '8px 16px',
          background: 'var(--accent)',
          color: 'var(--accent-contrast)',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.top = '8px';
          e.currentTarget.style.left = '8px';
        }}
        onBlur={(e) => {
          e.currentTarget.style.top = '-999px';
          e.currentTarget.style.left = '-999px';
        }}
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <Box
        as="nav"
        aria-label="Main navigation"
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
                className="sidebar-theme"
                maxW={{ base: '100%', sm: '300px' }}
                h="100dvh"
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
                      <Text fontSize="xs" fontWeight="600" letterSpacing="-0.01em" color="var(--text-primary)" lineHeight="1.15" truncate>
                        The Kitchen
                      </Text>
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
        {/* ── Top bar ── */}
        <Box
          as="header"
          flexShrink={0}
          h="var(--top-bar-height)"
          px="3"
          borderBottom="1px solid var(--divider)"
        >
          <HStack h="100%" justify="space-between" align="center" gap="2" data-testid="shell-toolbar">

            {/* LEFT: collapse toggle (desktop) / hamburger (mobile) + logo + page title */}
            <HStack gap="0" minW={0} flex="1" align="center">
              {/* Spacer — sidebar collapse lives inside the Sidebar component */}

              {/* Mobile: hamburger */}
              {mobileNavContent ? (
                <Button
                  display={{ base: 'flex', lg: 'none' }}
                  variant="ghost"
                  w="7" h="7" minW="0" px="0" rounded="6px"
                  color="var(--text-muted)"
                  _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                  aria-label="Open navigation"
                  onClick={() => setMobileNavOpen(true)}
                  mr="1"
                  flexShrink={0}
                >
                  <HamburgerIcon />
                </Button>
              ) : null}

              {/* Chef hat logo */}
              <span
                data-testid="hermes-home-brand"
                style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0, marginRight: '10px', display: 'inline-flex', alignItems: 'center' }}
              >
                <span aria-hidden="true">🧑‍🍳</span>
              </span>

              {/* Page title — compact mode shows brand name (used in combined recipe layout) */}
              {_headerMode === 'compact' ? (
                <Box flex="1" minW={0}>
                  <Text fontSize="13px" fontWeight="600" color="var(--text-primary)" letterSpacing="-0.01em">
                    The Kitchen
                  </Text>
                </Box>
              ) : (
                <PageHeader pageName={pageTitle} />
              )}
            </HStack>

            {/* RIGHT: model selector + dividers + status dot + theme toggle */}
            <HStack gap="0" flexShrink={0} align="center">
              {modelSelectorSlot ? (
                <>
                  {modelSelectorSlot}
                  <span className="top-bar-divider" style={{ margin: '0 8px' }} />
                </>
              ) : null}
              <ConnectionIndicator status={connection.status} />
              <span className="top-bar-divider" style={{ margin: '0 8px' }} />
              <ThemeToggle onPersist={onPersistTheme} />
            </HStack>
          </HStack>
        </Box>

        {gatewayDown ? (
          <GatewayBanner detail={`${connection.detail}${connection.usingCachedData ? ' Showing cached data.' : ''}`} />
        ) : null}

        {versionMismatch ? (
          <Alert.Root
            status="warning"
            role="alert"
            aria-live="polite"
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

        {/* Main content — noGutter for chat, padded for all other pages */}
        <Box
          as="main"
          id="main-content"
          tabIndex={-1}
          flex="1"
          minH={0}
          overflow="hidden"
          display="flex"
          flexDirection="column"
          _focusVisible={{ outline: 'none' }}
        >
          {noGutter ? children : (
            <Box
              flex="1"
              minH={0}
              overflow="hidden"
              display="flex"
              flexDirection="column"
              px={{ base: '4', md: '8' }}
              pt={{ base: '5', md: '8' }}
              w="100%"
            >
              {children}
            </Box>
          )}
        </Box>
      </Flex>
    </Flex>
  );
}

export { Sidebar };
