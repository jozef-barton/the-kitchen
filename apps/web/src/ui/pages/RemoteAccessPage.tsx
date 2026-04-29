import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, Spinner, Text, VStack, HStack } from '@chakra-ui/react';
import { QRCodeSVG } from 'qrcode.react';
import { getRemoteAccessStatus, refreshRemoteAccess } from '../../lib/api';
import type { RemoteAccessStatus } from '../../lib/api';

const POLL_INTERVAL_MS = 5000;

export function RemoteAccessPage() {
  const [status, setStatus] = useState<RemoteAccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          <TailscaleConnectedView url={accessUrl} onRefresh={handleRefresh} refreshing={refreshing} />
        ) : (
          <TailscaleSetupView
            installed={status?.tailscale.installed ?? false}
            error={status?.tailscale.error}
            onCheckAgain={handleRefresh}
            checking={refreshing}
          />
        )}
      </VStack>
    </Flex>
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
