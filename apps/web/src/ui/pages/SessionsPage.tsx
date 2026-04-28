import { useState } from 'react';
import { flushSync } from 'react-dom';
import { Box, Button, Flex, HStack, Input, Table, Text, VStack } from '@chakra-ui/react';
import type { Session, SessionsResponse } from '@hermes-recipes/protocol';
import { RecipeTypeBadge } from '../atoms/RecipeTypeBadge';
import { ErrorBanner } from '../molecules/ErrorBanner';
import { ConfirmDialog } from '../molecules/ConfirmDialog';
import { SessionActionMenu } from '../molecules/SessionActionMenu';
import { SessionRenameDialog } from '../molecules/SessionRenameDialog';

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function SessionsPage({
  value,
  onChange,
  onSearch,
  onPageChange,
  response,
  loading,
  error,
  onOpenSession,
  onRenameSession,
  onDeleteSession
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onPageChange: (page: number) => void;
  response: SessionsResponse | null;
  loading: boolean;
  error: string | null;
  onOpenSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, title: string) => Promise<void> | void;
  onDeleteSession: (sessionId: string) => Promise<void> | void;
}) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleRename(title: string) {
    if (!selectedSession) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await onRenameSession(selectedSession.id, title);
      setRenameOpen(false);
    } catch (renameError) {
      setActionError(renameError instanceof Error ? renameError.message : 'Failed to rename the session.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedSession) return;
    flushSync(() => { setDeleteOpen(false); setActionError(null); });
    setActionLoading(true);
    try {
      await onDeleteSession(selectedSession.id);
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : 'Failed to delete the session.');
    } finally {
      setActionLoading(false);
    }
  }

  function openRename(session: Session) { setSelectedSession(session); setActionError(null); setRenameOpen(true); }
  function openDelete(session: Session) { setSelectedSession(session); setActionError(null); setDeleteOpen(true); }

  return (
    <div className="page-content">
      {/* Inline search — no card wrapper */}
      <HStack gap="2" mb="5" flexShrink={0}>
        <Input
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
          placeholder="Search sessions…"
          bg="var(--surface-2)"
          border="1px solid var(--border-subtle)"
          rounded="var(--radius-control)"
          h="9"
          fontSize="13px"
          color="var(--text-primary)"
          _placeholder={{ color: 'var(--text-muted)' }}
          _focus={{ borderColor: 'var(--border-default)', boxShadow: 'var(--focus-ring)' }}
          flex="1"
        />
        <Button
          rounded="var(--radius-control)"
          bg="var(--surface-3)"
          color="var(--text-secondary)"
          _hover={{ bg: 'var(--surface-active)', color: 'var(--text-primary)' }}
          h="9"
          px="4"
          fontSize="13px"
          fontWeight="500"
          onClick={onSearch}
          loading={loading}
          flexShrink={0}
        >
          Search
        </Button>
      </HStack>

      {error ? <Box mb="3" flexShrink={0}><ErrorBanner title="Session browse failed" detail={error} /></Box> : null}
      {actionError ? <Box mb="3" flexShrink={0}><ErrorBanner title="Session update failed" detail={actionError} /></Box> : null}

      {/* Table area */}
      <Box flex="1" minH={0} overflow="hidden" rounded="var(--radius-card)" border="1px solid var(--border-subtle)">
        {!response || response.items.length === 0 ? (
          <Flex align="center" justify="center" h="100%" minH="200px">
            <VStack gap="1" textAlign="center">
              <Text fontSize="15px" fontWeight="500" color="var(--text-secondary)">
                {loading ? 'Loading sessions…' : 'No sessions matched'}
              </Text>
              <Text fontSize="13px" color="var(--text-muted)">
                {loading ? '' : 'Adjust the search terms or start a new session.'}
              </Text>
            </VStack>
          </Flex>
        ) : (
          <VStack align="stretch" gap="0" h="100%">
            <Table.ScrollArea data-testid="sessions-table-scroll" flex="1" h="100%">
              <Table.Root size="sm" variant="outline" interactive>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Title</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">Type</Table.ColumnHeader>
                    <Table.ColumnHeader>Summary</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">Updated</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end" w="40px" />
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {response.items.map((session) => (
                    <Table.Row
                      key={session.id}
                      cursor="pointer"
                      onClick={() => onOpenSession(session.id)}
                      h="var(--row-height)"
                    >
                      <Table.Cell>
                        <Text fontSize="14px" fontWeight="500" color="var(--text-primary)" lineClamp={1}>
                          {session.title}
                        </Text>
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <RecipeTypeBadge
                          recipeType={session.recipeType}
                          testId={session.recipeType === 'home' ? 'session-recipe-indicator' : 'session-type-indicator'}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontSize="13px" color="var(--text-secondary)" lineClamp={1}>
                          {session.summary}
                        </Text>
                      </Table.Cell>
                      <Table.Cell textAlign="end">
                        <Text fontSize="12px" color="var(--text-muted)" whiteSpace="nowrap">
                          {formatRelativeTime(session.lastUpdatedAt)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell textAlign="end" onClick={(e) => e.stopPropagation()}>
                        <SessionActionMenu
                          label={`Actions for ${session.title}`}
                          onRename={() => openRename(session)}
                          onDelete={() => openDelete(session)}
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Table.ScrollArea>

            {/* Footer: small, muted, right-aligned pagination */}
            <HStack
              px="4" py="2.5"
              borderTop="1px solid var(--border-subtle)"
              justify="space-between"
              flexShrink={0}
              gap="3"
            >
              <Text fontSize="11px" color="var(--text-muted)">
                {response.total} sessions for {response.profileId}
                {response.hiddenSyntheticCount > 0 ? ` · ${response.hiddenSyntheticCount} synthetic sessions hidden` : ''}
              </Text>
              <HStack gap="1">
                <Button
                  variant="ghost"
                  size="xs"
                  h="6"
                  px="2"
                  rounded="5px"
                  fontSize="12px"
                  color="var(--text-muted)"
                  _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                  onClick={() => onPageChange(Math.max(1, response.page - 1))}
                  disabled={response.page <= 1}
                >
                  ← Prev
                </Button>
                <Text fontSize="12px" color="var(--text-muted)" px="1">
                  Page {response.page}
                </Text>
                <Button
                  variant="ghost"
                  size="xs"
                  h="6"
                  px="2"
                  rounded="5px"
                  fontSize="12px"
                  color="var(--text-muted)"
                  _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                  onClick={() => onPageChange(response.page + 1)}
                  disabled={response.page * response.pageSize >= response.total}
                >
                  Next
                </Button>
              </HStack>
            </HStack>
          </VStack>
        )}
      </Box>

      {selectedSession ? (
        <>
          <SessionRenameDialog
            open={renameOpen}
            loading={actionLoading}
            sessionTitle={selectedSession.title}
            onOpenChange={setRenameOpen}
            onSave={handleRename}
          />
          <ConfirmDialog
            open={deleteOpen}
            loading={actionLoading}
            title="Delete session"
            description="Delete this session from the main lists. If Hermes supports session deletion it will be removed there too; otherwise the bridge will soft-delete it locally until new activity makes it visible again."
            confirmLabel="Delete session"
            onOpenChange={setDeleteOpen}
            onConfirm={handleDelete}
          />
        </>
      ) : null}
    </div>
  );
}
