import { Box, Button, Flex, HStack, Table, Text, VStack, chakra } from '@chakra-ui/react';
import type { JobsResponse } from '@hermes-recipes/protocol';
import { ErrorBanner } from '../molecules/ErrorBanner';

function formatNextRun(s: string) {
  return s;
}

function StatusDot({ status }: { status: string }) {
  const isOk = ['completed', 'healthy', 'enabled', 'connected', 'started'].includes(status.toLowerCase());
  const isWarn = ['pending', 'paused', 'degraded', 'warning'].includes(status.toLowerCase());
  const cls = isOk ? 'status-dot status-dot--connected' : isWarn ? 'status-dot status-dot--reconnecting' : 'status-dot status-dot--disconnected';
  return <span className={cls} style={{ marginRight: 6 }} />;
}

export function JobsPage({
  response,
  loading,
  error,
  onRefresh
}: {
  response: JobsResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const Svg = chakra('svg');

  return (
    <div className="page-content">
      {error ? <Box mb="3" flexShrink={0}><ErrorBanner title="Jobs refresh failed" detail={error} /></Box> : null}
      {response?.freshness.lastError ? (
        <Box mb="3" flexShrink={0}><ErrorBanner title="Latest Hermes jobs error" detail={response.freshness.lastError} /></Box>
      ) : null}

      {/* Content */}
      <Box flex="1" minH={0} overflow="hidden" rounded="var(--radius-card)" border="1px solid var(--border-subtle)">
        {!response || response.items.length === 0 ? (
          <Flex align="center" justify="center" h="100%" minH="240px">
            <VStack gap="2" textAlign="center">
              <Svg viewBox="0 0 24 24" boxSize="6" fill="none" aria-hidden="true" color="var(--text-muted)">
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8v5l3 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </Svg>
              <Text fontSize="15px" fontWeight="500" color="var(--text-secondary)">
                {loading ? 'Loading jobs…' : 'No scheduled jobs'}
              </Text>
              <Text fontSize="13px" color="var(--text-muted)">
                {loading ? '' : 'Ask Hermes to schedule a task in a chat session.'}
              </Text>
              {!loading ? (
                <Button
                  variant="ghost"
                  size="sm"
                  h="7"
                  px="3"
                  mt="1"
                  rounded="var(--radius-control)"
                  fontSize="12px"
                  color="var(--text-muted)"
                  _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                  onClick={onRefresh}
                  loading={loading}
                >
                  Refresh
                </Button>
              ) : null}
            </VStack>
          </Flex>
        ) : (
          <>
            {/* Desktop table */}
            <Box h="100%" display={{ base: 'none', md: 'block' }}>
              <Table.ScrollArea data-testid="jobs-table-scroll" h="100%">
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Job</Table.ColumnHeader>
                      <Table.ColumnHeader>Schedule</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader>Next run</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {response.items.map((job) => (
                      <Table.Row key={job.id} h="var(--row-height)">
                        <Table.Cell>
                          <Text fontSize="14px" fontWeight="500" color="var(--text-primary)">{job.label}</Text>
                          {job.description ? (
                            <Text fontSize="12px" color="var(--text-muted)" mt="0.5" lineClamp={1}>{job.description}</Text>
                          ) : null}
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="12px" color="var(--text-secondary)" fontFamily="ui-monospace, monospace">
                            {job.schedule}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <HStack gap="1.5" align="center">
                            <StatusDot status={job.status} />
                            <Text fontSize="13px" color="var(--text-secondary)">{job.status}</Text>
                          </HStack>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="12px" color="var(--text-muted)">{formatNextRun(job.nextRun ?? '—')}</Text>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Table.ScrollArea>
            </Box>

            {/* Mobile list */}
            <VStack align="stretch" gap="0" display={{ base: 'flex', md: 'none' }} p="3">
              {response.items.map((job) => (
                <Box key={job.id} py="3" borderBottom="1px solid var(--border-subtle)" _last={{ borderBottom: 'none' }}>
                  <HStack justify="space-between" mb="1">
                    <Text fontSize="14px" fontWeight="500" color="var(--text-primary)">{job.label}</Text>
                    <HStack gap="1.5">
                      <StatusDot status={job.status} />
                      <Text fontSize="12px" color="var(--text-secondary)">{job.status}</Text>
                    </HStack>
                  </HStack>
                  <Text fontSize="12px" color="var(--text-muted)" fontFamily="ui-monospace, monospace">{job.schedule}</Text>
                  {job.nextRun ? <Text fontSize="11px" color="var(--text-muted)" mt="0.5">Next: {job.nextRun}</Text> : null}
                </Box>
              ))}
            </VStack>
          </>
        )}
      </Box>
    </div>
  );
}
