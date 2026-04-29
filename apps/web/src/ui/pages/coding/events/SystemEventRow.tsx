import { useState } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import type { SystemEventPayload } from '../buildConversationItems';

function toolIcon(toolName?: string): string {
  if (!toolName) return '⟳';
  const t = toolName.toLowerCase();
  if (/read|view/.test(t)) return '↗';
  if (/write|create/.test(t)) return '✎';
  if (/edit|str_replace/.test(t)) return '✐';
  if (/bash|run|exec/.test(t)) return '▶';
  if (/search|grep|find/.test(t)) return '⌕';
  return '⟳';
}

export function SystemEventRow({ payload }: { payload: SystemEventPayload }) {
  const [expanded, setExpanded] = useState(false);
  const description = payload.description ?? payload.subtype;
  const icon = toolIcon(payload.toolName);

  return (
    <Box
      px="2" py="1"
      rounded="5px"
      bg="var(--surface-1)"
      border="1px solid var(--border-subtle)"
      cursor={payload.usage ? 'pointer' : 'default'}
      onClick={() => { if (payload.usage) setExpanded(e => !e); }}
      _hover={payload.usage ? { bg: 'var(--surface-2)' } : undefined}
      transition="background 0.1s"
    >
      <HStack gap="1.5" align="center">
        <Text fontSize="10px" color="var(--text-muted)" flexShrink={0}>{icon}</Text>
        <Text
          fontSize="11px"
          color="var(--text-muted)"
          fontFamily="ui-monospace, monospace"
          flex="1"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {description}
        </Text>
        {payload.usage?.tool_uses !== undefined && (
          <Text fontSize="10px" color="var(--text-muted)" flexShrink={0}>
            {payload.usage.tool_uses} tools
          </Text>
        )}
        {payload.usage?.total_tokens !== undefined && (
          <Text fontSize="10px" color="var(--text-muted)" flexShrink={0}>
            {(payload.usage.total_tokens / 1000).toFixed(1)}k tok
          </Text>
        )}
      </HStack>

      {expanded && payload.usage && (
        <HStack gap="3" mt="1" pl="4">
          {payload.toolName && (
            <Text fontSize="10px" color="var(--text-muted)">tool: {payload.toolName}</Text>
          )}
          {payload.usage.duration_ms !== undefined && (
            <Text fontSize="10px" color="var(--text-muted)">{Math.round(payload.usage.duration_ms / 1000)}s</Text>
          )}
          {payload.usage.tool_uses !== undefined && (
            <Text fontSize="10px" color="var(--text-muted)">{payload.usage.tool_uses} tool uses</Text>
          )}
          {payload.usage.total_tokens !== undefined && (
            <Text fontSize="10px" color="var(--text-muted)">{payload.usage.total_tokens.toLocaleString()} tokens</Text>
          )}
        </HStack>
      )}
    </Box>
  );
}
