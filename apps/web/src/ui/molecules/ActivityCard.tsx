import { Box, Code, HStack, Text, VStack } from '@chakra-ui/react';
import type { ChatActivity } from '@hermes-recipes/protocol';

function formatTimestamp(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

function formatTimestampFull(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false
  });
}

function kindBorderColor(kind: ChatActivity['kind']): string {
  switch (kind) {
    case 'tool': return '#6366f1';
    case 'skill': return '#0d9488';
    case 'command': return '#d97706';
    case 'approval': return '#7c3aed';
    case 'thinking': return '#64748b';
    case 'website': return '#0284c7';
    case 'warning': return '#dc2626';
    default: return 'var(--border-subtle)';
  }
}

function kindLabel(kind: ChatActivity['kind']): string {
  switch (kind) {
    case 'tool': return 'Tool';
    case 'skill': return 'Skill';
    case 'command': return 'CLI';
    case 'approval': return 'Approval';
    case 'warning': return 'Warning';
    case 'thinking': return 'Thinking';
    case 'website': return 'Web';
    default: return 'Status';
  }
}

function kindIcon(kind: ChatActivity['kind']): string {
  switch (kind) {
    case 'tool': return '📞';
    case 'skill': return '📚';
    case 'command': return '💻';
    case 'approval': return '⚠️';
    case 'thinking': return '💭';
    case 'website': return '🌐';
    case 'warning': return '⚠️';
    default: return '⚙️';
  }
}

function stateIcon(state: ChatActivity['state']): string {
  switch (state) {
    case 'completed': return '✓';
    case 'failed':
    case 'denied': return '✗';
    case 'cancelled': return '–';
    default: return '…';
  }
}

function isInProgress(state: ChatActivity['state']): boolean {
  return state === 'started' || state === 'updated';
}

function isError(activity: ChatActivity): boolean {
  return activity.state === 'failed' || activity.state === 'denied' || activity.kind === 'warning';
}

function detailForActivity(activity: ChatActivity) {
  if (activity.kind === 'command' && activity.command) return activity.command;
  return activity.detail ?? null;
}

export function ActivityCard({ activity }: { activity: ChatActivity }) {
  const detail = detailForActivity(activity);
  const borderColor = isError(activity) ? '#dc2626' : kindBorderColor(activity.kind);
  const inProgress = isInProgress(activity.state);

  return (
    <Box
      data-testid="activity-card"
      data-activity-kind={activity.kind}
      borderLeft={`3px solid ${borderColor}`}
      borderRadius="0 6px 6px 0"
      bg="transparent"
      px="2.5"
      py="1.5"
      minW={0}
      maxW="100%"
      overflow="hidden"
      _hover={{ bg: 'var(--surface-2)' }}
      transition="background 120ms ease"
      style={inProgress ? {
        animation: 'activityPulse 1.6s ease-in-out infinite'
      } : undefined}
    >
      <VStack align="stretch" gap="1" minW={0}>
        <HStack align="start" justify="space-between" gap="2" minW={0}>
          <HStack align="center" gap="1.5" minW={0} flex="1">
            <Text as="span" fontSize="sm" lineHeight={1} flexShrink={0}>
              {kindIcon(activity.kind)}
            </Text>
            <Text
              fontSize="xs"
              fontWeight="500"
              color="var(--text-primary)"
              lineClamp={2}
              minW={0}
              wordBreak="break-word"
            >
              {activity.label}
            </Text>
          </HStack>
          <HStack gap="1.5" flexShrink={0} align="center">
            <Text fontSize="2xs" color="var(--text-muted)" letterSpacing="0.06em" textTransform="uppercase">
              {kindLabel(activity.kind)}
            </Text>
            <Text
              fontSize="2xs"
              color={isError(activity) ? '#dc2626' : inProgress ? 'var(--accent)' : 'var(--text-muted)'}
              fontWeight="500"
            >
              {stateIcon(activity.state)}
            </Text>
            <Text fontSize="2xs" color="var(--text-muted)" title={formatTimestampFull(activity.timestamp)}>
              {formatTimestamp(activity.timestamp)}
            </Text>
          </HStack>
        </HStack>

        {detail ? (
          activity.kind === 'command' && activity.command ? (
            <Code
              display="block"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              overflowWrap="anywhere"
              maxW="100%"
              rounded="6px"
              px="1.5"
              py="1"
              bg="var(--surface-1)"
              color="var(--text-secondary)"
              fontSize="2xs"
            >
              {detail}
            </Code>
          ) : (
            <Text
              fontSize="2xs"
              color="var(--text-muted)"
              lineClamp={2}
              pl="5"
              minW={0}
              wordBreak="break-word"
            >
              {detail}
            </Text>
          )
        ) : null}
      </VStack>
    </Box>
  );
}
