import { Badge, Box, Button, Flex, HStack, Table, Tabs, Text, VStack } from '@chakra-ui/react';
import type { RuntimeActivityHistoryEntry, ToolHistoryResponse } from '@hermes-recipes/protocol';
import { StatusPill } from '../atoms/StatusPill';
import { EmptyStateCard } from '../molecules/EmptyStateCard';
import { ErrorBanner } from '../molecules/ErrorBanner';

function activityKindLabel(kind: RuntimeActivityHistoryEntry['kind']) {
  switch (kind) {
    case 'tool':
      return 'Tool';
    case 'skill':
      return 'Skill';
    case 'command':
      return 'CLI';
    case 'approval':
      return 'Approval';
    case 'warning':
      return 'Warning';
    default:
      return 'Status';
  }
}

function activityKindPalette(kind: RuntimeActivityHistoryEntry['kind']) {
  switch (kind) {
    case 'tool':
      return 'blue';
    case 'skill':
      return 'teal';
    case 'command':
      return 'orange';
    case 'approval':
      return 'yellow';
    case 'warning':
      return 'red';
    default:
      return 'gray';
  }
}

function RuntimeActivityCard({ item }: { item: RuntimeActivityHistoryEntry }) {
  return (
    <Box
      rounded="8px"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-elevated)"
      px="3.5"
      py="3"
      boxShadow="var(--shadow-xs)"
    >
      <VStack align="stretch" gap="2">
        <Flex justify="space-between" align="start" gap="2" wrap="wrap">
          <Badge colorPalette={activityKindPalette(item.kind)} flexShrink={0}>{activityKindLabel(item.kind)}</Badge>
          <StatusPill label={item.state} />
        </Flex>
        <VStack align="start" gap="0.5">
          <Text fontWeight="750" color="var(--text-primary)" fontSize="sm">{item.label}</Text>
          <Text fontSize="xs" color="var(--text-secondary)">{item.command ?? item.detail ?? item.requestPreview ?? 'No detail recorded'}</Text>
        </VStack>
        <Flex gap="2" wrap="wrap" align="center">
          {item.sessionTitle ?? item.sessionId ? (
            <span className="skill-chip">{item.sessionTitle ?? item.sessionId}</span>
          ) : null}
          <Text fontSize="xs" color="var(--text-muted)">{new Date(item.timestamp).toLocaleString()}</Text>
        </Flex>
      </VStack>
    </Box>
  );
}

function ReviewedCard({ item }: { item: ToolHistoryResponse['items'][number] }) {
  return (
    <Box
      rounded="8px"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-elevated)"
      px="3.5"
      py="3"
      boxShadow="var(--shadow-xs)"
    >
      <VStack align="stretch" gap="2">
        <Flex justify="space-between" align="start" gap="2" wrap="wrap">
          <StatusPill label={item.status} />
          {item.profileId ? <span className="skill-chip">{item.profileId}</span> : null}
        </Flex>
        <VStack align="start" gap="0.5">
          <Text fontWeight="750" color="var(--text-primary)" fontSize="sm">{item.summary}</Text>
          <Text fontSize="xs" color="var(--text-secondary)">{item.command} {item.args.join(' ')}</Text>
        </VStack>
        <Text fontSize="xs" color="var(--text-muted)">{new Date(item.requestedAt).toLocaleString()}</Text>
      </VStack>
    </Box>
  );
}

export function ToolHistoryPage({
  response,
  loading,
  error,
  page,
  onPageChange
}: {
  response: ToolHistoryResponse | null;
  loading: boolean;
  error: string | null;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const reviewedCount = response?.total ?? 0;
  const runtimeCount = response?.runtimeTotal ?? 0;
  const maxCount = Math.max(reviewedCount, runtimeCount);

  return (
    <Box h="100%" minH={0} rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-elevated)" p="4" boxShadow="var(--shadow-sm)">
      {error ? <ErrorBanner title="Tool history failed" detail={error} /> : null}

      {!response || (response.items.length === 0 && response.runtimeItems.length === 0) ? (
        <EmptyStateCard
          title={loading ? 'Loading tool history' : 'No runtime or reviewed tool activity'}
          detail={
            loading
              ? 'Reading persisted Hermes runtime activity and reviewed bridge executions.'
              : 'Hermes tool, skill, and command activity plus reviewed bridge executions will appear here.'
          }
        />
      ) : (
        <Box h="100%" display="flex" flexDirection="column" gap="4">
        <Tabs.Root
          defaultValue="runtime"
          h="100%"
          minH={0}
          display="flex"
          flexDirection="column"
          variant="plain"
          css={{
            '--tabs-indicator-bg': 'var(--surface-1)',
            '--tabs-indicator-shadow': 'var(--shadow-xs)',
            '--tabs-trigger-radius': '8px'
          }}
        >
          <Tabs.List rounded="8px" bg="var(--surface-2)" border="1px solid var(--border-subtle)" p="1" mb="3" flexShrink={0} w="fit-content">
            <Tabs.Trigger value="runtime" fontSize="xs" px="3">Activity ({runtimeCount})</Tabs.Trigger>
            <Tabs.Trigger value="reviewed" fontSize="xs" px="3">Reviewed ({reviewedCount})</Tabs.Trigger>
            <Tabs.Indicator />
          </Tabs.List>

          <Tabs.Content value="runtime" flex="1" minH={0} display="flex" flexDirection="column" gap="2">
            <Text fontSize="sm" color="var(--text-secondary)" mb="1">
              Tool, skill, command, and approval activity captured during chat requests.
            </Text>

            {response.runtimeItems.length === 0 ? (
              <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="4" py="4">
                <Text color="var(--text-secondary)">No Hermes runtime tool or command activity has been persisted for this profile yet.</Text>
              </Box>
            ) : (
              <>
                {/* Desktop table */}
                <Table.ScrollArea
                  data-testid="runtime-tool-history-table-scroll"
                  borderWidth="1px"
                  borderColor="var(--border-subtle)"
                  rounded="8px"
                  flex="1"
                  minH={0}
                  display={{ base: 'none', md: 'block' }}
                >
                  <Table.Root size="sm" variant="outline">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Type</Table.ColumnHeader>
                        <Table.ColumnHeader>Activity</Table.ColumnHeader>
                        <Table.ColumnHeader>Session</Table.ColumnHeader>
                        <Table.ColumnHeader>Updated</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {response.runtimeItems.map((item) => (
                        <Table.Row key={item.id}>
                          <Table.Cell>
                            <Badge colorPalette={activityKindPalette(item.kind)}>{activityKindLabel(item.kind)}</Badge>
                          </Table.Cell>
                          <Table.Cell>
                            <Text fontWeight="750" color="var(--text-primary)">
                              {item.label}
                            </Text>
                            <Text fontSize="sm" color="var(--text-secondary)">
                              {item.command ?? item.detail ?? item.requestPreview ?? 'No detail recorded'}
                            </Text>
                            <Text fontSize="xs" color="var(--text-muted)">
                              {item.requestId}
                            </Text>
                          </Table.Cell>
                          <Table.Cell color="var(--text-secondary)">{item.sessionTitle ?? item.sessionId}</Table.Cell>
                          <Table.Cell>
                            <VStack align="start" gap="0.5">
                              <StatusPill label={item.state} />
                              <Text fontSize="xs" color="var(--text-muted)">
                                {new Date(item.timestamp).toLocaleString()}
                              </Text>
                            </VStack>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Table.ScrollArea>

                {/* Mobile cards */}
                <VStack align="stretch" gap="3" display={{ base: 'flex', md: 'none' }} overflowY="auto" flex="1" minH={0}>
                  {response.runtimeItems.map((item) => (
                    <RuntimeActivityCard key={item.id} item={item} />
                  ))}
                </VStack>
              </>
            )}
          </Tabs.Content>

          <Tabs.Content value="reviewed" flex="1" minH={0} display="flex" flexDirection="column" gap="2">
            <Text fontSize="sm" color="var(--text-secondary)" mb="1">
              Explicitly approved bridge-reviewed commands and their outcomes.
            </Text>

            {response.items.length === 0 ? (
              <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="4" py="4">
                <Text color="var(--text-secondary)">No reviewed bridge executions have been recorded for this profile yet.</Text>
              </Box>
            ) : (
              <>
                {/* Desktop table */}
                <Table.ScrollArea
                  data-testid="tool-history-table-scroll"
                  borderWidth="1px"
                  borderColor="var(--border-subtle)"
                  rounded="8px"
                  flex="1"
                  minH={0}
                  display={{ base: 'none', md: 'block' }}
                >
                  <Table.Root size="sm" variant="outline">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Status</Table.ColumnHeader>
                        <Table.ColumnHeader>Summary</Table.ColumnHeader>
                        <Table.ColumnHeader>Profile</Table.ColumnHeader>
                        <Table.ColumnHeader>Requested</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {response.items.map((item) => (
                        <Table.Row key={item.id}>
                          <Table.Cell>
                            <StatusPill label={item.status} />
                          </Table.Cell>
                          <Table.Cell>
                            <Text fontWeight="750" color="var(--text-primary)">
                              {item.summary}
                            </Text>
                            <Text fontSize="sm" color="var(--text-secondary)">
                              {item.command} {item.args.join(' ')}
                            </Text>
                          </Table.Cell>
                          <Table.Cell color="var(--text-secondary)">{item.profileId ?? 'Global'}</Table.Cell>
                          <Table.Cell color="var(--text-secondary)">
                            {new Date(item.requestedAt).toLocaleString()}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Table.ScrollArea>

                {/* Mobile cards */}
                <VStack align="stretch" gap="3" display={{ base: 'flex', md: 'none' }} overflowY="auto" flex="1" minH={0}>
                  {response.items.map((item) => (
                    <ReviewedCard key={item.id} item={item} />
                  ))}
                </VStack>
              </>
            )}
          </Tabs.Content>
        </Tabs.Root>

          <HStack justify="space-between">
            <Text color="var(--text-secondary)">
              {runtimeCount} runtime · {reviewedCount} reviewed
            </Text>
            <HStack gap="2">
              <ButtonLike onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
                Previous
              </ButtonLike>
              <Text color="var(--text-secondary)">Page {page}</Text>
              <ButtonLike onClick={() => onPageChange(page + 1)} disabled={page * (response?.pageSize ?? 25) >= maxCount}>
                Next
              </ButtonLike>
            </HStack>
          </HStack>
        </Box>
      )}
    </Box>
  );
}

function ButtonLike({
  children,
  disabled,
  onClick
}: {
  children: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      disabled={disabled}
      size="sm"
      variant="outline"
      rounded="8px"
      color="var(--text-primary)"
      borderColor="var(--border-subtle)"
      opacity={disabled ? 0.5 : 1}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
