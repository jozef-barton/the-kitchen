import { useState } from 'react';
import { Box, Button, HStack, Menu, Portal, Table, Tabs, Text, Tooltip, VStack } from '@chakra-ui/react';
import type { Skill, SkillsResponse } from '@hermes-recipes/protocol';
import { ConfirmDialog } from '../molecules/ConfirmDialog';
import { EmptyStateCard } from '../molecules/EmptyStateCard';
import { ErrorBanner } from '../molecules/ErrorBanner';
import { SkillFinderTab } from '../organisms/SkillFinderTab';

type SkillsTab = 'installed' | 'finder';

function trustSlot(value: string) {
  if (/builtin/i.test(value)) return 'managed';
  if (/verified/i.test(value)) return 'managed';
  return 'auto';
}

function TrustBadge({ value }: { value: string }) {
  const slot = trustSlot(value);
  const label = /builtin/i.test(value) ? 'Built-in' : /verified/i.test(value) ? 'Verified' : value;
  return <span className={`approval-badge approval-badge--${slot}`}>{label}</span>;
}

function CategoryBadge({ value }: { value: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '4px',
        background: 'var(--status-neutral-bg)',
        color: 'var(--text-secondary)',
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }}
    >
      {value || 'Uncategorized'}
    </span>
  );
}


function SkillsIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 5l3.2 7.2 7.8.8-5.8 5 1.8 7.6L16 21.6 9 25.6l1.8-7.6L5 13l7.8-.8z" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function InstalledSkillsTab({
  response,
  loading,
  onRefresh,
  onDeleteSkill
}: {
  response: SkillsResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onDeleteSkill: (skill: Skill) => Promise<void> | void;
}) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDelete() {
    if (!selectedSkill) return;
    setDeleteLoading(true);
    setActionError(null);
    try {
      await onDeleteSkill(selectedSkill);
      setDeleteOpen(false);
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : 'Failed to delete the selected skill.');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <VStack align="stretch" h="100%" minH={0} gap="3">
      <HStack justify="flex-end">
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

      {actionError ? <ErrorBanner title="Skill update failed" detail={actionError} /> : null}

      <Box flex="1" minH={0} rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-elevated)" overflow="hidden" boxShadow="var(--shadow-sm)">
        {!response ? (
          <Box p="4">
            <EmptyStateCard title="Loading skills" detail="Reading the active profile skill catalog from Hermes." />
          </Box>
        ) : response.items.length === 0 ? (
          <Box p="4">
            <EmptyStateCard
              icon={<SkillsIcon />}
              title="No skills installed"
              detail="Hermes did not report any installed skills for the active profile."
            />
          </Box>
        ) : (
          <Table.ScrollArea data-testid="skills-table-scroll" h="100%">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Category</Table.ColumnHeader>
                  <Table.ColumnHeader>Trust</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {response.items.map((skill) => {
                  const canDelete = !/builtin/i.test(skill.source) && !/builtin/i.test(skill.trust);
                  return (
                    <Table.Row key={skill.id}>
                      <Table.Cell>
                        <VStack align="stretch" gap="0">
                          <HStack gap="1.5" align="center">
                            {skill.summary ? (
                              <Tooltip.Root openDelay={200} closeDelay={100}>
                                <Tooltip.Trigger asChild>
                                  <Box
                                    as="span"
                                    display="inline-flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    w="15px"
                                    h="15px"
                                    rounded="4px"
                                    border="1px solid var(--border-subtle)"
                                    color="var(--text-muted)"
                                    fontSize="9px"
                                    fontWeight="700"
                                    cursor="help"
                                    flexShrink={0}
                                  >
                                    ?
                                  </Box>
                                </Tooltip.Trigger>
                                <Portal>
                                  <Tooltip.Positioner>
                                    <Tooltip.Content
                                      bg="var(--surface-1)"
                                      color="var(--text-primary)"
                                      border="1px solid var(--border-subtle)"
                                      rounded="8px"
                                      px="3"
                                      py="2"
                                      maxW="280px"
                                      boxShadow="md"
                                    >
                                      <Text fontSize="xs">{skill.summary}</Text>
                                    </Tooltip.Content>
                                  </Tooltip.Positioner>
                                </Portal>
                              </Tooltip.Root>
                            ) : null}
                            <Text fontSize="sm" fontWeight="650" color="var(--text-primary)">
                              {skill.name}
                            </Text>
                          </HStack>
                          {skill.summary ? (
                            <Text fontSize="xs" color="var(--text-secondary)" mt="0.5" lineClamp={2} lineHeight="1.5">
                              {skill.summary}
                            </Text>
                          ) : null}
                        </VStack>
                      </Table.Cell>
                      <Table.Cell>
                        <CategoryBadge value={skill.category} />
                      </Table.Cell>
                      <Table.Cell>
                        <TrustBadge value={skill.trust} />
                      </Table.Cell>
                      <Table.Cell textAlign="center" w="80px" minW="80px">
                        <Menu.Root positioning={{ placement: 'bottom-end' }}>
                            <Menu.Trigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                minW={0}
                                px="3"
                                h="8"
                                rounded="7px"
                                aria-label={`Actions for ${skill.name}`}
                                color="var(--text-secondary)"
                                borderColor="var(--border-subtle)"
                                bg="var(--surface-2)"
                                _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)', borderColor: 'var(--border-strong)' }}
                              >
                                ···
                              </Button>
                            </Menu.Trigger>
                            <Portal>
                              <Menu.Positioner>
                                <Menu.Content minW="11rem" rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-1)" boxShadow="var(--shadow-md)">
                                  <Menu.Item
                                    value={`delete-${skill.id}`}
                                    disabled={!canDelete}
                                    color={canDelete ? 'fg.error' : undefined}
                                    _hover={canDelete ? { bg: 'bg.error', color: 'fg.error' } : undefined}
                                    onClick={() => {
                                      if (!canDelete) return;
                                      setSelectedSkill(skill);
                                      setActionError(null);
                                      setDeleteOpen(true);
                                    }}
                                  >
                                    {canDelete ? 'Delete' : 'Cannot delete built-in'}
                                  </Menu.Item>
                                </Menu.Content>
                              </Menu.Positioner>
                            </Portal>
                          </Menu.Root>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        )}
      </Box>

      {selectedSkill ? (
        <ConfirmDialog
          open={deleteOpen}
          loading={deleteLoading}
          title="Delete skill"
          description={`Delete ${selectedSkill.name} from the active Hermes profile. This deletion is permanent and cannot be undone.`}
          confirmLabel="Delete skill"
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
        >
          <Box mt="4" rounded="8px" border="1px solid var(--border-danger)" bg="var(--surface-danger)" px="4" py="3">
            <Text fontSize="sm" color="var(--text-primary)" fontWeight="600">
              Permanent deletion
            </Text>
            <Text fontSize="xs" color="var(--text-secondary)" mt="1">
              This removes the installed skill from the active profile immediately. The app will not recreate it locally after deletion succeeds.
            </Text>
          </Box>
        </ConfirmDialog>
      ) : null}
    </VStack>
  );
}

export function SkillsPage({
  response,
  loading,
  error,
  activeProfileId,
  onRefresh,
  onDeleteSkill
}: {
  response: SkillsResponse | null;
  loading: boolean;
  error: string | null;
  activeProfileId: string | null;
  onRefresh: () => void;
  onDeleteSkill: (skill: Skill) => Promise<void> | void;
}) {
  const [activeTab, setActiveTab] = useState<SkillsTab>('installed');

  return (
    <VStack align="stretch" h="100%" minH={0} gap="4">
      <HStack
        justify="space-between"
        wrap="wrap"
        gap="3"
        rounded="8px"
        border="1px solid var(--border-subtle)"
        bg="var(--surface-elevated)"
        px="4"
        py="3.5"
        boxShadow="var(--shadow-xs)"
      >
        <Box>
          <Text fontSize="sm" fontWeight="650" color="var(--text-primary)">
            Runtime skills
          </Text>
          <Text fontSize="xs" color="var(--text-secondary)" mt="0.5">
            Skills available to the active Hermes profile.
          </Text>
        </Box>
      </HStack>

      {error ? <ErrorBanner title="Skills refresh failed" detail={error} /> : null}

      <Tabs.Root
        value={activeTab}
        onValueChange={(e) => setActiveTab(e.value as SkillsTab)}
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
          <Tabs.Trigger value="installed" fontSize="xs" px="3">
            Installed Skills{response ? ` (${response.items.length})` : ''}
          </Tabs.Trigger>
          <Tabs.Trigger value="finder" fontSize="xs" px="3">
            Skill Finder
          </Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>

        <Tabs.Content value="installed" flex="1" minH={0} pt="4">
          <InstalledSkillsTab
            response={response}
            loading={loading}
            onRefresh={onRefresh}
            onDeleteSkill={onDeleteSkill}
          />
        </Tabs.Content>

        <Tabs.Content value="finder" flex="1" minH={0} pt="4">
          {activeProfileId ? (
            <SkillFinderTab profileId={activeProfileId} />
          ) : (
            <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-1)" px="4" py="6">
              <EmptyStateCard
                title="No active profile"
                detail="Connect a Hermes profile to use Skill Finder."
              />
            </Box>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  );
}
