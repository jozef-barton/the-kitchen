import { Text } from '@chakra-ui/react';
import type { JobEvent } from '../../../../lib/coding-api';

export function AgentInitRow({ event }: { event: Extract<JobEvent, { type: 'job.agent_initialized' }> }) {
  const tools = (event as { toolsAvailable?: string[] }).toolsAvailable ?? [];
  return (
    <Text fontSize="11px" color="var(--text-muted)" px="2">
      ○ Started · {(event as { model?: string }).model ?? 'unknown'} · {tools.length} tools available
    </Text>
  );
}
