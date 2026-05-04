import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, Spinner, Tabs, Text, VStack, HStack } from '@chakra-ui/react';
import { QRCodeSVG } from 'qrcode.react';
import { getRemoteAccessStatus, refreshRemoteAccess } from '../../lib/api';
import type { RemoteAccessStatus } from '../../lib/api';

const POLL_INTERVAL_MS = 5000;

type RemoteAccessTab = 'tailscale' | 'local-network';

export function RemoteAccessPage({
  requestedTab,
  onTabChange
}: {
  requestedTab?: RemoteAccessTab;
  onTabChange?: (tab: RemoteAccessTab) => void;
}) {
  const [status, setStatus] = useState<RemoteAccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentTab: RemoteAccessTab = requestedTab ?? 'tailscale';

  const loadStatus = useCallback(async () => {
    try {
      const result = await getRemoteAccessStatus();
      setStatus(result);
    } catch {
      // keep previous status on error
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await refreshRemoteAccess();
      setStatus(result);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Drive an initial refresh (not status) so the listener rebinds onto the tailnet immediately
    // if Tailscale started after the bridge. Status polling alone is read-only and would leave
    // the QR code pointing at a port still bound to 127.0.0.1.
    void (async () => {
      try {
        await handleRefresh();
      } finally {
        setLoading(false);
      }
    })();

    pollTimerRef.current = setInterval(() => {
      void loadStatus();
    }, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void handleRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (pollTimerRef.current !== null) clearInterval(pollTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadStatus, handleRefresh]);

  if (loading) {
    return (
      <Flex h="100%" align="center" justify="center">
        <Spinner size="md" color="var(--accent)" />
      </Flex>
    );
  }

  return (
    <Tabs.Root
      value={currentTab}
      onValueChange={(event) => {
        const next = event.value as RemoteAccessTab;
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
          {(['tailscale', 'local-network'] as const).map((v) => (
            <Tabs.Trigger
              key={v}
              value={v}
              fontSize={{ base: '12px', md: '13px' }}
              px={{ base: '2.5', md: '4' }}
              h={{ base: '36px', md: '44px' }}
              color="var(--text-muted)"
              fontWeight="400"
              borderBottom="2px solid transparent"
              mb="-1px"
              transition="color 120ms ease, border-color 120ms ease"
              _selected={{ color: 'var(--text-primary)', fontWeight: '500', borderBottomColor: 'var(--accent)' }}
              _hover={{ color: 'var(--text-secondary)' }}
            >
              {v === 'tailscale' ? 'Tailscale' : 'Local Network'}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Box>

      <Tabs.ContentGroup flex="1" minH={0} overflowY="auto">
        <Tabs.Content value="tailscale" pt="0">
          <TailscaleTabContent
            status={status}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </Tabs.Content>
        <Tabs.Content value="local-network" pt="0">
          <LocalNetworkTabContent status={status} />
        </Tabs.Content>
      </Tabs.ContentGroup>
    </Tabs.Root>
  );
}

function TailscaleTabContent({
  status,
  refreshing,
  onRefresh
}: {
  status: RemoteAccessStatus | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const isRunning = status?.tailscale.running === true;
  const accessUrl = status?.url ?? null;

  return (
    <Flex h="100%" overflowY="auto" align="flex-start" justify="center" pt="12" px="6">
      <VStack gap="6" maxW="520px" w="100%" align="stretch">
        <VStack gap="2" align="start">
          <Text fontSize="2xl" fontWeight="700" color="var(--text-primary)" letterSpacing="-0.02em">
            Remote Access
          </Text>
          <Text fontSize="14px" color="var(--text-secondary)" lineHeight="1.6">
            Open The Kitchen on your phone over your Tailscale network.
          </Text>
        </VStack>

        {isRunning && accessUrl ? (
          <TailscaleConnectedView url={accessUrl} onRefresh={onRefresh} refreshing={refreshing} />
        ) : (
          <TailscaleSetupView
            installed={status?.tailscale.installed ?? false}
            error={status?.tailscale.error}
            onCheckAgain={onRefresh}
            checking={refreshing}
          />
        )}
      </VStack>
    </Flex>
  );
}

function LocalNetworkTabContent({ status }: { status: RemoteAccessStatus | null }) {
  const publicInfo = status?.public;

  return (
    <Flex h="100%" overflowY="auto" align="flex-start" justify="center" pt="12" px="6">
      <VStack gap="6" maxW="520px" w="100%" align="stretch">
        <VStack gap="2" align="start">
          <Text fontSize="2xl" fontWeight="700" color="var(--text-primary)" letterSpacing="-0.02em">
            Local Network
          </Text>
          <Text fontSize="14px" color="var(--text-secondary)" lineHeight="1.6">
            Access The Kitchen from any device on your local network.
          </Text>
        </VStack>

        {!publicInfo?.enabled ? (
          <LocalNetworkDisabledView />
        ) : publicInfo.urls.length === 0 ? (
          <LocalNetworkNoUrlsView />
        ) : (
          <LocalNetworkEnabledView urls={publicInfo.urls} />
        )}
      </VStack>
    </Flex>
  );
}

function LocalNetworkDisabledView() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText('pnpm kitchen --public').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <VStack gap="6" align="stretch">
      <Box
        bg="var(--surface-elevated)"
        border="1px solid var(--border-subtle)"
        rounded="var(--radius-card)"
        p="5"
      >
        <VStack gap="4" align="stretch">
          <Text fontSize="14px" color="var(--text-secondary)" lineHeight="1.6">
            Local Network access is not enabled. Start The Kitchen with the{' '}
            <Box as="code" fontFamily="ui-monospace, monospace" fontSize="13px" color="var(--text-primary)">
              --public
            </Box>{' '}
            flag to share it with devices on your local network.
          </Text>

          <Box
            bg="var(--surface-base)"
            border="1px solid var(--border-subtle)"
            rounded="var(--radius-control)"
            p="3"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap="3"
          >
            <Text fontFamily="ui-monospace, monospace" fontSize="13px" color="var(--text-primary)">
              pnpm kitchen --public
            </Text>
            <Button
              size="xs"
              variant="outline"
              rounded="var(--radius-control)"
              fontSize="12px"
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </Box>

          <Box
            bg="var(--surface-warning)"
            border="1px solid var(--border-warning)"
            rounded="var(--radius-control)"
            p="3"
          >
            <Text fontSize="12px" color="var(--text-warning)" lineHeight="1.5">
              There is no authentication in --public mode. Only use it on a trusted network.
            </Text>
          </Box>
        </VStack>
      </Box>
    </VStack>
  );
}

function LocalNetworkNoUrlsView() {
  return (
    <Box
      bg="var(--surface-elevated)"
      border="1px solid var(--border-subtle)"
      rounded="var(--radius-card)"
      p="5"
    >
      <Text fontSize="14px" color="var(--text-secondary)" lineHeight="1.6">
        Public mode is enabled but no local network interfaces were detected. Connect to a Wi-Fi or
        Ethernet network and restart The Kitchen.
      </Text>
    </Box>
  );
}

function LocalNetworkEnabledView({ urls }: { urls: string[] }) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopy = (url: string) => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  return (
    <VStack gap="6" align="stretch">
      <Box
        bg="var(--surface-elevated)"
        border="1px solid var(--border-subtle)"
        rounded="var(--radius-card)"
        p="5"
      >
        <VStack gap="4" align="stretch">
          <HStack gap="2">
            <Box w="8px" h="8px" rounded="full" bg="var(--status-success)" flexShrink={0} />
            <Text fontSize="12px" color="var(--status-success)" fontWeight="500">Active</Text>
          </HStack>

          <Text fontSize="13px" color="var(--text-secondary)" lineHeight="1.5">
            The Kitchen is accessible from any device on your local network at the URLs below.
          </Text>

          <VStack gap="2" align="stretch">
            {urls.map((url) => (
              <HStack key={url} gap="3">
                <Text
                  fontFamily="ui-monospace, monospace"
                  fontSize="13px"
                  color="var(--text-primary)"
                  flex="1"
                  wordBreak="break-all"
                >
                  {url}
                </Text>
                <Button
                  size="xs"
                  variant="outline"
                  rounded="var(--radius-control)"
                  fontSize="12px"
                  flexShrink={0}
                  onClick={() => handleCopy(url)}
                >
                  {copiedUrl === url ? 'Copied!' : 'Copy'}
                </Button>
              </HStack>
            ))}
          </VStack>
        </VStack>
      </Box>

      <Box
        bg="var(--surface-warning)"
        border="1px solid var(--border-warning)"
        rounded="var(--radius-control)"
        p="3"
      >
        <Text fontSize="12px" color="var(--text-warning)" lineHeight="1.5">
          No authentication is required. Anyone on your local network can access The Kitchen.
          Stop the kitchen and restart without --public to disable.
        </Text>
      </Box>
    </VStack>
  );
}

function TailscaleConnectedView({
  url,
  onRefresh,
  refreshing
}: {
  url: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <VStack gap="6" align="stretch">
      <Box
        bg="var(--surface-elevated)"
        border="1px solid var(--border-subtle)"
        rounded="var(--radius-card)"
        p="6"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap="4"
      >
        <HStack gap="2" alignSelf="flex-end">
          <Box w="8px" h="8px" rounded="full" bg="var(--status-success)" flexShrink={0} />
          <Text fontSize="12px" color="var(--status-success)" fontWeight="500">Connected</Text>
        </HStack>

        <Box bg="white" p="3" rounded="var(--radius-card)">
          <QRCodeSVG value={url} size={200} level="M" />
        </Box>

        <VStack gap="1" align="center">
          <Text fontSize="13px" color="var(--text-secondary)">Scan with your phone&apos;s Camera app</Text>
          <Text fontSize="12px" color="var(--text-muted)" fontFamily="ui-monospace, monospace" wordBreak="break-all" textAlign="center">
            {url}
          </Text>
        </VStack>

        <Button
          size="sm"
          variant="outline"
          rounded="var(--radius-control)"
          fontSize="13px"
          loading={refreshing}
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </Box>

      <Box
        bg="var(--surface-elevated)"
        border="1px solid var(--border-subtle)"
        rounded="var(--radius-card)"
        p="5"
      >
        <VStack gap="3" align="stretch">
          <Text fontSize="13px" fontWeight="600" color="var(--text-primary)">How to connect</Text>
          <VStack gap="2" align="stretch">
            <HStack gap="3" align="flex-start">
              <Text fontSize="12px" color="var(--accent)" fontWeight="700" flexShrink={0} w="5" textAlign="center">1</Text>
              <Text fontSize="13px" color="var(--text-secondary)" lineHeight="1.5">On your phone, open the Camera app and scan the QR code above.</Text>
            </HStack>
            <HStack gap="3" align="flex-start">
              <Text fontSize="12px" color="var(--accent)" fontWeight="700" flexShrink={0} w="5" textAlign="center">2</Text>
              <Text fontSize="13px" color="var(--text-secondary)" lineHeight="1.5">Make sure your phone is connected to the same Tailscale network as this Mac.</Text>
            </HStack>
            <HStack gap="3" align="flex-start">
              <Text fontSize="12px" color="var(--accent)" fontWeight="700" flexShrink={0} w="5" textAlign="center">3</Text>
              <Text fontSize="13px" color="var(--text-secondary)" lineHeight="1.5">After scanning, you should see the same Kitchen UI on your phone.</Text>
            </HStack>
          </VStack>
        </VStack>
      </Box>
    </VStack>
  );
}

function TailscaleSetupView({
  installed,
  error,
  onCheckAgain,
  checking
}: {
  installed: boolean;
  error?: string;
  onCheckAgain: () => void;
  checking: boolean;
}) {
  return (
    <VStack gap="6" align="stretch">
      <Box
        bg="var(--surface-elevated)"
        border="1px solid var(--border-subtle)"
        rounded="var(--radius-card)"
        p="5"
      >
        <VStack gap="4" align="stretch">
          <Text fontSize="14px" color="var(--text-secondary)" lineHeight="1.6">
            {installed
              ? 'Tailscale is installed but not running. Start Tailscale and sign in, then click Check again.'
              : 'Tailscale is required for remote access. It creates a secure private network between your devices — no port forwarding needed.'}
          </Text>

          {!installed && (
            <VStack gap="3" align="stretch">
              <HStack gap="3" align="flex-start">
                <Text fontSize="12px" color="var(--accent)" fontWeight="700" flexShrink={0} w="5" textAlign="center">1</Text>
                <Text fontSize="13px" color="var(--text-secondary)" lineHeight="1.5">
                  Install Tailscale from{' '}
                  <a href="https://tailscale.com/download/macos" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                    tailscale.com/download/macos
                  </a>
                </Text>
              </HStack>
              <HStack gap="3" align="flex-start">
                <Text fontSize="12px" color="var(--accent)" fontWeight="700" flexShrink={0} w="5" textAlign="center">2</Text>
                <Text fontSize="13px" color="var(--text-secondary)" lineHeight="1.5">Open Tailscale and sign in with your account.</Text>
              </HStack>
              <HStack gap="3" align="flex-start">
                <Text fontSize="12px" color="var(--accent)" fontWeight="700" flexShrink={0} w="5" textAlign="center">3</Text>
                <Text fontSize="13px" color="var(--text-secondary)" lineHeight="1.5">Also install Tailscale on your phone and sign in to the same account.</Text>
              </HStack>
              <HStack gap="3" align="flex-start">
                <Text fontSize="12px" color="var(--accent)" fontWeight="700" flexShrink={0} w="5" textAlign="center">4</Text>
                <Text fontSize="13px" color="var(--text-secondary)" lineHeight="1.5">Click Check again below. A QR code will appear automatically.</Text>
              </HStack>
            </VStack>
          )}

          {error && (
            <Text fontSize="12px" color="var(--status-danger)" fontFamily="ui-monospace, monospace">
              {error}
            </Text>
          )}

          <Button
            bg="var(--accent)"
            color="var(--accent-contrast)"
            _hover={{ bg: 'var(--accent-strong)' }}
            rounded="var(--radius-control)"
            h="10"
            fontSize="14px"
            fontWeight="500"
            loading={checking}
            onClick={onCheckAgain}
          >
            Check again
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
}
