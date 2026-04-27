import { Box, Flex, HStack, Table, Tabs, Text, VStack } from '@chakra-ui/react';
import type { ToolHistoryResponse, ToolsResponse, ToolsTab } from '@hermes-recipes/protocol';
import { ErrorBanner } from '../molecules/ErrorBanner';
import { ToolHistoryPage } from './ToolHistoryPage';

function formatApprovalModel(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('explicit') || lower.includes('user')) return 'User approval';
  if (lower.includes('managed') || lower.includes('hermes') || lower.includes('auto_approved')) return 'Managed';
  return raw;
}

function StatusDot({ status }: { status: string }) {
  const isOk = ['enabled', 'connected', 'healthy'].includes(status.toLowerCase());
  const cls = isOk ? 'status-dot status-dot--connected' : 'status-dot status-dot--disconnected';
  return <span className={cls} />;
}

const DEFAULT_RESTRICTION = 'Configured through the local Hermes CLI tool settings';

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
  /* Group tools by source */
  const grouped = response?.items.reduce<Record<string, ToolsResponse['items']>>((acc, tool) => {
    const src = tool.source ?? 'Other';
    if (!acc[src]) acc[src] = [];
    acc[src].push(tool);
    return acc;
  }, {}) ?? {};
  const groups = Object.entries(grouped);

  return (
    <div className="page-content">
      {error ? <Box mb="3" flexShrink={0}><ErrorBanner title="Tools refresh failed" detail={error} /></Box> : null}

      <Tabs.Root
        value={toolsTab}
        onValueChange={(event) => { void onToolsTabChange(event.value as ToolsTab); }}
        h="100%"
        minH={0}
        display="flex"
        flexDirection="column"
        variant="plain"
        pt="0"
      >
        <Box borderBottom="1px solid var(--divider)" flexShrink={0}>
          <Tabs.List gap="0" px="0" borderBottom="none">
            {(['all', 'history'] as const).map((v) => (
              <Tabs.Trigger
                key={v}
                value={v}
                fontSize="13px"
                px="4"
                h="44px"
                color="var(--text-muted)"
                fontWeight="400"
                borderBottom="2px solid transparent"
                mb="-1px"
                transition="color 120ms ease, border-color 120ms ease"
                _selected={{ color: 'var(--text-primary)', fontWeight: '500', borderBottomColor: 'var(--accent)' }}
                _hover={{ color: 'var(--text-secondary)' }}
              >
                {v === 'all' ? 'All Tools' : 'Tool History'}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Box>

        <Tabs.Content value="all" flex="1" minH={0} pt="0">
          <Box flex="1" minH={0} h="100%" overflow="hidden" mt="4" rounded="var(--radius-card)" border="1px solid var(--border-subtle)">
            {!response ? (
              <Flex align="center" justify="center" h="100%" minH="200px">
                <Text fontSize="15px" fontWeight="500" color="var(--text-secondary)">
                  {loading ? 'Loading tools…' : 'No tools reported'}
                </Text>
              </Flex>
            ) : (
              <>
                {/* Desktop table */}
                <Box display={{ base: 'none', md: 'block' }} h="100%">
                  <Table.ScrollArea data-testid="tools-table-scroll" h="100%">
                    <Table.Root size="sm" variant="outline">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>Tool</Table.ColumnHeader>
                          <Table.ColumnHeader>Capabilities</Table.ColumnHeader>
                          <Table.ColumnHeader>Status</Table.ColumnHeader>
                          <Table.ColumnHeader>Approval</Table.ColumnHeader>
                          <Table.ColumnHeader>Restrictions</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {groups.map(([source, tools]) => {
                          /* Check if all tools share the default restriction */
                          const allDefault = tools.every(
                            (t) => !t.restrictions[0] || t.restrictions[0] === DEFAULT_RESTRICTION
                          );
                          return [
                            /* Section header row */
                            <Table.Row key={`section-${source}`} className="table-section-header" style={{ cursor: 'default' }}>
                              <Table.Cell colSpan={5} style={{ padding: 0 }}>
                                <Box className="table-section-header">
                                  {source}
                                  {allDefault && tools.some((t) => t.restrictions[0]) ? (
                                    <Text as="span" fontSize="10px" fontWeight="400" color="var(--text-muted)" ml="3" letterSpacing="0">
                                      — configured through Hermes CLI tool settings
                                    </Text>
                                  ) : null}
                                </Box>
                              </Table.Cell>
                            </Table.Row>,
                            /* Tool rows */
                            ...tools.map((tool) => (
                              <Table.Row key={tool.id} h="var(--row-height)">
                                <Table.Cell>
                                  <Text fontSize="13px" fontWeight="500" color="var(--text-primary)" fontFamily="ui-monospace, monospace">
                                    {tool.name}
                                  </Text>
                                  {tool.description ? (
                                    <Text fontSize="11px" color="var(--text-secondary)" mt="0.5" lineClamp={1}>
                                      {tool.description}
                                    </Text>
                                  ) : null}
                                </Table.Cell>
                                <Table.Cell>
                                  {tool.capabilities.length > 0 ? (
                                    <Text fontSize="11px" color="var(--text-muted)">
                                      {tool.capabilities.slice(0, 2).join(', ')}{tool.capabilities.length > 2 ? ` +${tool.capabilities.length - 2}` : ''}
                                    </Text>
                                  ) : (
                                    <Text fontSize="11px" color="var(--text-muted)">—</Text>
                                  )}
                                </Table.Cell>
                                <Table.Cell>
                                  <HStack gap="1.5" align="center">
                                    <StatusDot status={tool.status} />
                                    <Text fontSize="12px" color="var(--text-secondary)">{tool.status}</Text>
                                  </HStack>
                                </Table.Cell>
                                <Table.Cell>
                                  <Text fontSize="12px" color="var(--text-secondary)">
                                    {formatApprovalModel(tool.approvalModel)}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell>
                                  <Text fontSize="11px" color="var(--text-muted)">
                                    {(!tool.restrictions[0] || tool.restrictions[0] === DEFAULT_RESTRICTION) && allDefault
                                      ? '—'
                                      : (tool.restrictions[0] ?? '—')}
                                  </Text>
                                </Table.Cell>
                              </Table.Row>
                            ))
                          ];
                        })}
                      </Table.Body>
                    </Table.Root>
                  </Table.ScrollArea>
                </Box>

                {/* Mobile */}
                <VStack align="stretch" gap="0" display={{ base: 'flex', md: 'none' }} p="3">
                  {response.items.map((tool) => (
                    <Box key={tool.id} py="3" borderBottom="1px solid var(--border-subtle)" _last={{ borderBottom: 'none' }}>
                      <HStack justify="space-between" mb="1">
                        <Text fontSize="13px" fontWeight="500" color="var(--text-primary)" fontFamily="ui-monospace, monospace">{tool.name}</Text>
                        <HStack gap="1.5">
                          <StatusDot status={tool.status} />
                          <Text fontSize="12px" color="var(--text-secondary)">{tool.status}</Text>
                        </HStack>
                      </HStack>
                      {tool.description ? <Text fontSize="12px" color="var(--text-muted)">{tool.description}</Text> : null}
                      <Text fontSize="11px" color="var(--text-muted)" mt="0.5">{formatApprovalModel(tool.approvalModel)}</Text>
                    </Box>
                  ))}
                </VStack>
              </>
            )}
          </Box>
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
    </div>
  );
}
