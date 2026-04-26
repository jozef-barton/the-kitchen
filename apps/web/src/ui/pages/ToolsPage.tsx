import { Box, Flex, Table, Tabs, Text, VStack } from '@chakra-ui/react';
import type { ToolHistoryResponse, ToolsResponse, ToolsTab } from '@hermes-recipes/protocol';
import { StatusPill } from '../atoms/StatusPill';
import { EmptyStateCard } from '../molecules/EmptyStateCard';
import { ErrorBanner } from '../molecules/ErrorBanner';
import { ToolHistoryPage } from './ToolHistoryPage';

function formatApprovalModel(raw: string): { label: string; slot: string } {
  const lower = raw.toLowerCase();
  if (lower.includes('explicit') || lower.includes('user')) {
    return { label: 'User approval', slot: 'explicit' };
  }
  if (lower.includes('managed') || lower.includes('hermes') || lower.includes('auto_approved')) {
    return { label: 'Managed', slot: 'managed' };
  }
  return { label: raw, slot: 'auto' };
}

function ApprovalBadge({ raw }: { raw: string }) {
  const { label, slot } = formatApprovalModel(raw);
  return <span className={`approval-badge approval-badge--${slot}`}>{label}</span>;
}

function CapabilityChips({ capabilities }: { capabilities: string[] }) {
  if (capabilities.length === 0) {
    return <Text fontSize="xs" color="var(--text-muted)">None reported</Text>;
  }
  const visible = capabilities.slice(0, 3);
  const overflow = capabilities.length - 3;
  return (
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {visible.map((cap) => (
        <span key={cap} className="skill-chip">{cap}</span>
      ))}
      {overflow > 0 ? (
        <span className="skill-chip-overflow">+{overflow}</span>
      ) : null}
    </span>
  );
}

function ToolsIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M12 6 9 9l4 4-3 3.5-4-4L4 16 8 20l4-4 3 3-4 4 4 4 4-4 5 5L28 23 19 14l-3 3-4-4 3-3L12 6Z" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function ToolCard({ tool }: { tool: ToolsResponse['items'][number] }) {
  const { label: approvalLabel, slot: approvalSlot } = formatApprovalModel(tool.approvalModel);
  return (
    <Box
      rounded="8px"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-elevated)"
      px="4"
      py="3"
      boxShadow="var(--shadow-xs)"
    >
      <VStack align="stretch" gap="2">
        <VStack align="start" gap="0.5">
          <Text fontSize="sm" fontWeight="650" color="var(--text-primary)" fontFamily="ui-monospace, monospace">
            {tool.name}
          </Text>
          {tool.description ? (
            <Text fontSize="xs" color="var(--text-secondary)" lineClamp={2} lineHeight="1.5">
              {tool.description}
            </Text>
          ) : null}
        </VStack>
        <Flex gap="2" wrap="wrap" align="center">
          <StatusPill label={tool.status} />
          <span className={`approval-badge approval-badge--${approvalSlot}`}>{approvalLabel}</span>
          {tool.source ? (
            <span className="skill-chip">{tool.source}</span>
          ) : null}
          {tool.restrictions[0] ? (
            <span className="skill-chip">{tool.restrictions[0]}</span>
          ) : null}
        </Flex>
        {tool.capabilities.length > 0 ? (
          <CapabilityChips capabilities={tool.capabilities} />
        ) : null}
      </VStack>
    </Box>
  );
}

export function ToolsPage({
  response,
  loading,
  error,
  toolsTab,
  onToolsTabChange,
  toolHistoryResponse,
  toolHistoryLoading,
  toolHistoryError,
  toolHistoryPage,
  onToolHistoryPageChange
}: {
  response: ToolsResponse | null;
  loading: boolean;
  error: string | null;
  toolsTab: ToolsTab;
  onToolsTabChange: (tab: ToolsTab) => Promise<void> | void;
  toolHistoryResponse: ToolHistoryResponse | null;
  toolHistoryLoading: boolean;
  toolHistoryError: string | null;
  toolHistoryPage: number;
  onToolHistoryPageChange: (page: number) => void;
}) {
  return (
    <VStack align="stretch" h="100%" minH={0} gap="3" px={{ base: '3', lg: '4' }} pt={{ base: '2', lg: '3' }}>
      {error ? <ErrorBanner title="Tools refresh failed" detail={error} /> : null}

      <Tabs.Root
        value={toolsTab}
        onValueChange={(event) => {
          void onToolsTabChange(event.value as ToolsTab);
        }}
        h="100%"
        minH={0}
        display="flex"
        flexDirection="column"
        variant="plain"
        css={{
          '--tabs-indicator-bg': 'var(--surface-1)',
          '--tabs-indicator-shadow': 'var(--shadow-xs)',
          '--tabs-trigger-radius': '7px'
        }}
      >
        <Tabs.List
          rounded="8px"
          bg="var(--surface-2)"
          border="1px solid var(--border-subtle)"
          p="1"
          w="fit-content"
        >
          <Tabs.Trigger value="all" fontSize="xs" px="3">All Tools</Tabs.Trigger>
          <Tabs.Trigger value="history" fontSize="xs" px="3">Tool History</Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>

        <Tabs.Content value="all" flex="1" minH={0} pt="4">
          <VStack align="stretch" h="100%" minH={0} gap="4">
            {/* Info card */}
            <Box
              rounded="8px"
              border="1px solid var(--border-subtle)"
              bg="var(--surface-elevated)"
              px="4"
              py="3.5"
              boxShadow="var(--shadow-xs)"
            >
              <Text fontSize="sm" fontWeight="650" color="var(--text-primary)">
                Runtime capability inventory
              </Text>
              <Text fontSize="xs" color="var(--text-secondary)" mt="0.5" lineHeight="1.6">
                Tool History shows what Hermes actually used during chat. Reviewed bridge executions remain tracked there, even though the manual shell runner is no longer exposed in this UI.
              </Text>
            </Box>

            {!response ? (
              <Box flex="1" minH={0} rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-elevated)" overflow="hidden" boxShadow="var(--shadow-sm)" p="4">
                <EmptyStateCard
                  icon={<ToolsIcon />}
                  title={loading ? 'Loading tools…' : 'No tools reported'}
                  detail="Reading Hermes and bridge tool capabilities."
                />
              </Box>
            ) : (
              <>
                {/* Desktop table */}
                <Box flex="1" minH={0} rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-elevated)" overflow="hidden" boxShadow="var(--shadow-sm)" display={{ base: 'none', md: 'block' }}>
                  <Table.ScrollArea data-testid="tools-table-scroll" h="100%">
                    <Table.Root size="sm" variant="outline">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>Tool</Table.ColumnHeader>
                          <Table.ColumnHeader>Source</Table.ColumnHeader>
                          <Table.ColumnHeader>Capabilities</Table.ColumnHeader>
                          <Table.ColumnHeader>Status</Table.ColumnHeader>
                          <Table.ColumnHeader>Approval</Table.ColumnHeader>
                          <Table.ColumnHeader>Restrictions</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {response.items.map((tool) => (
                          <Table.Row key={tool.id}>
                            <Table.Cell>
                              <Text
                                fontSize="sm"
                                fontWeight="650"
                                color="var(--text-primary)"
                                fontFamily="ui-monospace, monospace"
                              >
                                {tool.name}
                              </Text>
                              {tool.description ? (
                                <Text fontSize="xs" color="var(--text-secondary)" mt="0.5" lineClamp={2} lineHeight="1.5">
                                  {tool.description}
                                </Text>
                              ) : null}
                            </Table.Cell>
                            <Table.Cell>
                              <Text fontSize="xs" color="var(--text-secondary)">{tool.source}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <CapabilityChips capabilities={tool.capabilities} />
                            </Table.Cell>
                            <Table.Cell>
                              <StatusPill label={tool.status} />
                            </Table.Cell>
                            <Table.Cell>
                              <ApprovalBadge raw={tool.approvalModel} />
                            </Table.Cell>
                            <Table.Cell>
                              <Text fontSize="xs" color="var(--text-secondary)">
                                {tool.restrictions[0] ?? '—'}
                              </Text>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Table.ScrollArea>
                </Box>

                {/* Mobile cards */}
                <VStack align="stretch" gap="3" display={{ base: 'flex', md: 'none' }}>
                  {response.items.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </VStack>
              </>
            )}
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="history" flex="1" minH={0} pt="4">
          <ToolHistoryPage
            response={toolHistoryResponse}
            loading={toolHistoryLoading}
            error={toolHistoryError}
            page={toolHistoryPage}
            onPageChange={onToolHistoryPageChange}
          />
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  );
}
