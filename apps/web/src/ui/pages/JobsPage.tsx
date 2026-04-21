import { Box, Button, HStack, Table, Text, VStack } from '@chakra-ui/react';
import type { JobsResponse } from '@hermes-recipes/protocol';
import { StatusPill } from '../atoms/StatusPill';
import { EmptyStateCard } from '../molecules/EmptyStateCard';
import { ErrorBanner } from '../molecules/ErrorBanner';

function JobsIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="var(--text-muted)" strokeWidth="1.5" />
      <path d="M16 11v6l4 3" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
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
  return (
    <VStack align="stretch" h="100%" minH={0} gap="4">
      {/* Status bar */}
      <HStack
        justify="space-between"
        rounded="8px"
        border="1px solid var(--border-subtle)"
        bg="var(--surface-elevated)"
        px="4"
        py="3.5"
        boxShadow="var(--shadow-xs)"
        wrap="wrap"
        gap="3"
      >
        <HStack gap="2.5" align="center">
          {response ? (
            <>
              <StatusPill label={response.freshness.status} />
              {response.freshness.lastSuccessfulAt ? (
                <Text fontSize="xs" color="var(--text-secondary)">
                  Last synced {formatDate(response.freshness.lastSuccessfulAt)}
                </Text>
              ) : (
                <Text fontSize="xs" color="var(--text-muted)">
                  Never synced
                </Text>
              )}
            </>
          ) : (
            <Text fontSize="xs" color="var(--text-muted)">Checking job schedule…</Text>
          )}
        </HStack>
        <Button
          variant="outline"
          size="sm"
          rounded="8px"
          onClick={onRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      </HStack>

      {error ? <ErrorBanner title="Jobs refresh failed" detail={error} /> : null}
      {response?.freshness.lastError ? (
        <ErrorBanner title="Latest Hermes jobs error" detail={response.freshness.lastError} />
      ) : null}

      <Box flex="1" minH={0} rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-elevated)" overflow="hidden" boxShadow="var(--shadow-sm)">
        {!response ? (
          <Box p="4">
            <EmptyStateCard title="Loading jobs" detail="Reading Hermes cron state for the selected profile." />
          </Box>
        ) : response.items.length === 0 ? (
          <Box p="4">
            <EmptyStateCard
              icon={<JobsIcon />}
              title="No scheduled jobs"
              detail="Hermes reported no cron jobs for the selected profile. Create a new session and ask Hermes to schedule a task."
            />
          </Box>
        ) : (
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
                  <Table.Row key={job.id}>
                    <Table.Cell>
                      <Text fontSize="sm" fontWeight="650" color="var(--text-primary)">
                        {job.label}
                      </Text>
                      {job.description ? (
                        <Text fontSize="xs" color="var(--text-secondary)" mt="0.5" lineHeight="1.5">
                          {job.description}
                        </Text>
                      ) : null}
                    </Table.Cell>
                    <Table.Cell>
                      <Text
                        fontSize="xs"
                        color="var(--text-secondary)"
                        fontFamily="ui-monospace, monospace"
                      >
                        {job.schedule}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <StatusPill label={job.status} />
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="xs" color="var(--text-secondary)">{job.nextRun}</Text>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        )}
      </Box>
    </VStack>
  );
}
