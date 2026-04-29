import { Box, HStack, Text } from '@chakra-ui/react';
import type { JobEvent } from '../../../../lib/coding-api';

export function AgentInitRow({ event }: { event: Extract<JobEvent, { type: 'job.agent_initialized' }> }) {
  const tools = (event as { toolsAvailable?: string[] }).toolsAvailable ?? [];
  const model = (event as { model?: string }).model;
  const cwd = (event as { cwd?: string }).cwd;
  const cwdShort = cwd ? cwd.split('/').slice(-2).join('/') : null;

  return (
    <HStack gap="2" px="2" align="center" flexWrap="wrap">
      <Text fontSize="10px" color="var(--text-muted)">○</Text>
      <Text fontSize="11px" color="var(--text-muted)">Session started</Text>
      {cwdShort && (
        <Text fontSize="10px" color="var(--text-muted)" fontFamily="ui-monospace, monospace">
          {cwdShort}
        </Text>
      )}
      {tools.length > 0 && (
        <Text fontSize="10px" color="var(--text-muted)">{tools.length} tools</Text>
      )}
      {model && (
        <Box
          px="1.5" py="0.5"
          bg="var(--surface-3)"
          border="1px solid var(--border-subtle)"
          rounded="4px"
        >
          <Text fontSize="10px" fontFamily="ui-monospace, monospace" color="var(--text-secondary)" fontWeight="500">
            {model}
          </Text>
        </Box>
      )}
    </HStack>
  );
}
