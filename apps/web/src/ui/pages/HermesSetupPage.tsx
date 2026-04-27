import { useCallback, useRef, useState } from 'react';
import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import { streamHermesInstall } from '../../lib/api';

export function HermesSetupPage({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<'idle' | 'installing' | 'done' | 'error'>('idle');
  const [lines, setLines] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const install = useCallback(async () => {
    setStatus('installing');
    setLines([]);
    setErrorMsg(null);
    try {
      await streamHermesInstall((event) => {
        if (event.type === 'output') {
          setLines((prev) => [...prev, event.line]);
          // auto-scroll
          setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }, 0);
        } else if (event.type === 'complete') {
          setStatus('done');
          setTimeout(onComplete, 1500);
        } else if (event.type === 'error') {
          setStatus('error');
          setErrorMsg(event.detail);
        }
      });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Install failed');
    }
  }, [onComplete]);

  return (
    <Flex h="100dvh" align="center" justify="center" bg="var(--app-bg)">
      <VStack gap="6" maxW="560px" w="100%" px="6" align="stretch">
        <VStack gap="2" align="start">
          <Text fontSize="2xl" fontWeight="700" color="var(--text-primary)" letterSpacing="-0.02em">
            Set up Hermes
          </Text>
          <Text fontSize="14px" color="var(--text-secondary)" lineHeight="1.6">
            Hermes is the AI engine that powers The Kitchen. Install it once and configure your provider to get started.
          </Text>
        </VStack>

        {status === 'idle' && (
          <Button
            bg="var(--accent)"
            color="var(--accent-contrast)"
            _hover={{ bg: 'var(--accent-strong)' }}
            rounded="var(--radius-control)"
            h="10"
            fontSize="14px"
            fontWeight="500"
            onClick={() => void install()}
          >
            Install Hermes
          </Button>
        )}

        {(status === 'installing' || status === 'done' || (status === 'error' && lines.length > 0)) && (
          <Box
            ref={scrollRef}
            bg="hsl(220, 14%, 8%)"
            rounded="var(--radius-card)"
            p="4"
            maxH="280px"
            overflowY="auto"
            fontFamily="ui-monospace, monospace"
            fontSize="12px"
            color="hsl(142, 45%, 65%)"
            lineHeight="1.6"
            css={{ scrollbarWidth: 'thin' }}
          >
            {lines.map((line, i) => (
              <Text key={i} display="block" whiteSpace="pre-wrap" wordBreak="break-all">{line}</Text>
            ))}
            {status === 'installing' && (
              <Text display="block" opacity={0.5}>…</Text>
            )}
          </Box>
        )}

        {status === 'done' && (
          <Text fontSize="14px" color="var(--status-success)" fontWeight="500">
            Hermes installed successfully. Setting up…
          </Text>
        )}

        {status === 'error' && (
          <VStack align="stretch" gap="2">
            <Text fontSize="13px" color="var(--status-danger)">{errorMsg}</Text>
            <Button
              variant="outline"
              rounded="var(--radius-control)"
              h="9"
              fontSize="13px"
              onClick={() => void install()}
            >
              Retry
            </Button>
          </VStack>
        )}

        <Text fontSize="12px" color="var(--text-muted)">
          Hermes installs to ~/.hermes and takes ~1 minute. After setup, configure your AI provider in Settings.
        </Text>
      </VStack>
    </Flex>
  );
}
