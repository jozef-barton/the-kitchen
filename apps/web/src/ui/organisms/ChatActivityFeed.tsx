import { useMemo } from 'react';
import { Box, Flex, HStack, ScrollArea, Text, VStack } from '@chakra-ui/react';
import type { ChatActivity, RuntimeRequest } from '@hermes-recipes/protocol';
import { TypingDots } from '../atoms/TypingDots';
import { StatusTicker } from '../atoms/StatusTicker';
import { ActivityCard } from '../molecules/ActivityCard';

function requestStatusLabel(status: RuntimeRequest['status'] | null, sending: boolean): string {
  if (sending) return 'Running';
  switch (status) {
    case 'running': return 'Running';
    case 'completed': return 'Done';
    case 'failed': return 'Failed';
    case 'denied': return 'Denied';
    case 'cancelled': return 'Cancelled';
    default: return 'Idle';
  }
}

function requestStatusColor(status: RuntimeRequest['status'] | null, sending: boolean): string {
  if (sending) return 'var(--accent)';
  switch (status) {
    case 'completed': return '#16a34a';
    case 'failed':
    case 'denied': return '#dc2626';
    default: return 'var(--text-muted)';
  }
}


export function ChatActivityFeed({
  activities,
  sending,
  progress,
  requestPreview,
  requestStatus,
  hideTestId = false
}: {
  activities: ChatActivity[];
  sending: boolean;
  progress: string | null;
  requestPreview: string | null;
  requestStatus: RuntimeRequest['status'] | null;
  hideTestId?: boolean;
}) {
  // Find the most recent in-progress activity for the live status strip.
  const liveActivity = useMemo(() => {
    for (let i = activities.length - 1; i >= 0; i--) {
      const a = activities[i];
      if (a && (a.state === 'started' || a.state === 'updated')) return a;
    }
    return null;
  }, [activities]);

  const statusText = progress ?? (sending ? 'Waiting for runtime events…' : 'Idle');
  const statusKind = liveActivity?.kind ?? 'status';
  const isRunning = sending || requestStatus === 'running';
  const statusColor = requestStatusColor(requestStatus, sending);

  return (
    <Flex
      direction="column"
      h="100%"
      minH={{ base: '240px', xl: 0 }}
      rounded="8px"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-1)"
      overflow="hidden"
      data-testid={hideTestId ? undefined : 'chat-activity-pane'}
    >
      {/* Header */}
      <Box px="3" pt="2.5" pb="0" flexShrink={0}>
        <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
          Runtime activity
        </Text>
      </Box>

      {/* Live status strip — collapses to a single updating line while running */}
      <Box
        px="3"
        py="2"
        borderBottom="1px solid var(--border-subtle)"
        flexShrink={0}
        bg="var(--surface-1)"
      >
        <HStack justify="space-between" gap="2" align="center" wrap="nowrap">
          <Box minW={0} flex="1">
            {requestPreview ? (
              <Text fontSize="xs" color="var(--text-muted)" lineClamp={1} mb="0.5">
                {requestPreview}
              </Text>
            ) : null}
            <HStack gap="2" align="center">
              {isRunning ? <TypingDots /> : null}
              {isRunning ? (
                <StatusTicker text={statusText} kind={statusKind} />
              ) : (
                <Text fontSize="xs" color="var(--text-secondary)">
                  {requestPreview
                    ? statusText
                    : 'Click a message to focus its runtime trail.'}
                </Text>
              )}
            </HStack>
          </Box>
          <Text
            fontSize="2xs"
            fontWeight="600"
            color={statusColor}
            letterSpacing="0.08em"
            textTransform="uppercase"
            flexShrink={0}
          >
            {requestStatusLabel(requestStatus, sending)}
          </Text>
        </HStack>
      </Box>

      {/* Activity log */}
      <ScrollArea.Root flex="1" minH={0} minW={0} variant="hover">
        <ScrollArea.Viewport data-testid="chat-activity-scroll">
          <VStack align="stretch" gap="0" px="2" py="1.5" minW={0}>
            {activities.length === 0 ? (
              <Box px="1" py="2">
                <Text fontSize="xs" color="var(--text-muted)">
                  {sending
                    ? 'No structured runtime events yet — Hermes may still be thinking.'
                    : 'No runtime activity recorded for this request.'}
                </Text>
              </Box>
            ) : (
              activities.map((activity) => (
                <ActivityCard
                  key={`${activity.timestamp}-${activity.kind}-${activity.label}-${activity.state}`}
                  activity={activity}
                />
              ))
            )}
          </VStack>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar />
      </ScrollArea.Root>
    </Flex>
  );
}
