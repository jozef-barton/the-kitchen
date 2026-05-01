import { useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Box, Button, Drawer, Flex, HStack, Input, Portal, ScrollArea, Spinner, Text, VStack, chakra
} from '@chakra-ui/react';
import type { AppPage, Profile, Session } from '@hermes-recipes/protocol';
import { ConfirmDialog } from '../molecules/ConfirmDialog';
import { ErrorBanner } from '../molecules/ErrorBanner';
import { SessionRow } from '../molecules/SessionRow';
import { SessionRenameDialog } from '../molecules/SessionRenameDialog';

type SidebarIconName = 'dashboard' | 'recipes' | 'sessions' | 'jobs' | 'coding' | 'tools' | 'skills' | 'settings' | 'new-session' | 'search' | 'gear' | 'plus' | 'trash' | 'user' | 'chevron-right' | 'remote-access';

function CollapseIcon() {
  const Svg = chakra('svg');
  return (
    <Svg viewBox="0 0 16 16" boxSize="3.5" fill="none" aria-hidden="true" color="currentColor" flexShrink={0}>
      <path d="M10.5 3.5 5.5 8l5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExpandIcon() {
  const Svg = chakra('svg');
  return (
    <Svg viewBox="0 0 16 16" boxSize="3.5" fill="none" aria-hidden="true" color="currentColor" flexShrink={0}>
      <path d="M5.5 3.5 10.5 8l-5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* All nav items in a single flat list */
const allNav: Array<{ page: AppPage; label: string; icon: SidebarIconName; shortcut?: string; requiresRuntime: boolean }> = [
  { page: 'dashboard', label: 'Dashboard', icon: 'dashboard', requiresRuntime: false },
  { page: 'sessions', label: 'All sessions', icon: 'sessions', shortcut: '⌘⇧S', requiresRuntime: true },
  { page: 'recipes', label: 'Recipes', icon: 'recipes', shortcut: '⌘R', requiresRuntime: false },
  { page: 'coding', label: 'Coding', icon: 'coding', requiresRuntime: false },
  { page: 'jobs', label: 'Jobs', icon: 'jobs', requiresRuntime: true },
  { page: 'tools', label: 'Tools', icon: 'tools', requiresRuntime: true },
  { page: 'skills', label: 'Skills', icon: 'skills', requiresRuntime: true },
  { page: 'settings', label: 'Settings', icon: 'settings', requiresRuntime: false },
  { page: 'remote-access', label: 'Remote Access', icon: 'remote-access', requiresRuntime: false },
];

export type ProfileMetrics = {
  profileId: string;
  sessionCount: number;
  messageCount: number;
  recipeCount: number;
};

export function Sidebar({
  profiles,
  activeProfileId,
  activeSessionId,
  recentSessions,
  activePage,
  collapsed,
  drawerMode,
  profileMetrics,
  onCollapsedChange,
  onProfileChange,
  onCreateSession,
  onOpenSession,
  onOpenPage,
  onRenameSession,
  onDeleteSession,
  onCreateProfile,
  onDeleteProfile,
  isRuntimeReady = true
}: {
  profiles: Profile[];
  activeProfileId: string | null;
  activeSessionId: string | null;
  recentSessions: Session[];
  activePage: AppPage;
  collapsed: boolean;
  drawerMode?: boolean;
  profileMetrics?: ProfileMetrics[];
  onCollapsedChange: (collapsed: boolean) => Promise<void> | void;
  onProfileChange: (profileId: string) => void;
  onCreateSession: () => void;
  onOpenSession: (sessionId: string) => void;
  onOpenPage: (page: AppPage) => void;
  onRenameSession: (sessionId: string, title: string) => Promise<void> | void;
  onDeleteSession: (sessionId: string) => Promise<void> | void;
  onCreateProfile?: (name: string) => Promise<void> | void;
  onDeleteProfile?: (profileId: string) => Promise<void> | void;
  isRuntimeReady?: boolean;
}) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sessionSearch, setSessionSearch] = useState('');
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [activeProfileId, profiles]
  );

  const filteredSessions = useMemo(() => {
    if (!sessionSearch.trim()) return recentSessions;
    const q = sessionSearch.toLowerCase();
    return recentSessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [recentSessions, sessionSearch]);

  async function handleRename(title: string) {
    if (!selectedSession) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await onRenameSession(selectedSession.id, title);
      setRenameOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to rename the session.');
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
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete the session.');
    } finally {
      setActionLoading(false);
    }
  }

  const sidebarWidth = collapsed ? '52px' : '240px';

  /* ── Collapsed icon strip ── */
  if (collapsed && !drawerMode) {
    return (
      <>
        <Flex
          className="sidebar-theme"
          direction="column"
          width={sidebarWidth}
          minWidth={sidebarWidth}
          maxWidth={sidebarWidth}
          flexShrink={0}
          h="100dvh"
          bg="var(--sidebar-bg)"
          borderRight="1px solid var(--divider)"
          overflow="hidden"
          transition="width 220ms cubic-bezier(0.4, 0, 0.2, 1)"
          align="center"
          py="3"
          gap="0"
        >
          {/* Expand button */}
          <Button
            variant="ghost"
            w="8" h="8" minW="0" px="0" rounded="var(--radius-control)"
            color="var(--text-muted)"
            _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            onClick={() => void onCollapsedChange(false)}
            mb="1"
          >
            <ExpandIcon />
          </Button>

          {/* New session */}
          <Button
            variant="ghost"
            w="8" h="8" minW="0" px="0" rounded="var(--radius-control)"
            color="var(--text-muted)"
            _hover={isRuntimeReady ? { bg: 'var(--surface-hover)', color: 'var(--text-primary)' } : {}}
            onClick={isRuntimeReady ? onCreateSession : undefined}
            title={isRuntimeReady ? 'New session (⌘N)' : 'Set up a model to create sessions'}
            aria-label="New session"
            aria-disabled={!isRuntimeReady}
            cursor={isRuntimeReady ? 'pointer' : 'not-allowed'}
            opacity={isRuntimeReady ? 1 : 0.35}
            mb="3"
          >
            <SidebarIcon name="new-session" />
          </Button>

          {/* Profile badge */}
          <Button
            variant="ghost"
            w="8" h="8" minW="0" px="0"
            title={activeProfile ? activeProfile.id : 'Active profile'}
            aria-label={activeProfile ? activeProfile.id : 'Active profile'}
            onClick={() => setProfileDrawerOpen(true)}
            mb="auto"
          >
            <Flex
              align="center" justify="center"
              w="6" h="6" rounded="full"
              bg="var(--surface-3)"
              color="var(--text-secondary)"
              fontWeight="700"
              fontSize="10px"
            >
              {(activeProfile?.id ?? 'HM').slice(0, 2).toUpperCase()}
            </Flex>
          </Button>

          {/* Nav icons */}
          <VStack gap="0" align="center" mt="auto" pt="2"
            borderTop="1px solid var(--divider)"
            w="100%"
          >
            {allNav.map((item) => {
              const navDisabled = item.requiresRuntime && !isRuntimeReady;
              return (
                <Button
                  key={item.page}
                  variant="ghost"
                  w="8" h="8" minW="0" px="0" rounded="var(--radius-control)"
                  color={activePage === item.page ? 'var(--text-primary)' : 'var(--text-muted)'}
                  bg={activePage === item.page ? 'var(--surface-active)' : 'transparent'}
                  _hover={navDisabled ? {} : { bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                  title={navDisabled ? 'Set up a model to access this page' : item.label}
                  aria-label={item.label}
                  aria-disabled={navDisabled}
                  opacity={navDisabled ? 0.35 : 1}
                  cursor={navDisabled ? 'not-allowed' : 'pointer'}
                  onClick={navDisabled ? undefined : () => onOpenPage(item.page)}
                >
                  <SidebarIcon name={item.icon} />
                </Button>
              );
            })}
          </VStack>
        </Flex>

        <ProfileManagementDrawer
          open={profileDrawerOpen}
          profiles={profiles}
          activeProfileId={activeProfileId}
          profileMetrics={profileMetrics}
          onClose={() => setProfileDrawerOpen(false)}
          onProfileChange={(id) => { onProfileChange(id); setProfileDrawerOpen(false); }}
          onCreateProfile={onCreateProfile}
          onDeleteProfile={onDeleteProfile}
        />
      </>
    );
  }

  /* ── Expanded layout ── */
  return (
    <>
      <Flex
        className="sidebar-theme"
        direction="column"
        width={drawerMode ? '100%' : sidebarWidth}
        minWidth={drawerMode ? '0' : sidebarWidth}
        maxWidth={drawerMode ? '100%' : sidebarWidth}
        flexShrink={0}
        h={drawerMode ? '100%' : '100dvh'}
        bg="var(--sidebar-bg)"
        borderRight={drawerMode ? 'none' : '1px solid var(--divider)'}
        overflow="hidden"
        transition="width 220ms cubic-bezier(0.4, 0, 0.2, 1), min-width 220ms cubic-bezier(0.4, 0, 0.2, 1), max-width 220ms cubic-bezier(0.4, 0, 0.2, 1)"
      >
        {/* ── Workspace switcher + collapse ── */}
        <Box px="2" pt="2" pb="1" flexShrink={0}>
          <HStack gap="0" justify="space-between" align="center">
          <HStack
            gap="2"
            px="2"
            h="var(--top-bar-height)"
            flex="1"
            minW={0}
            rounded="var(--radius-control)"
            _hover={{ bg: 'var(--surface-hover)' }}
            transition="background var(--transition-fast)"
            cursor="pointer"
            onClick={() => setProfileDrawerOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Manage profiles"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProfileDrawerOpen(true); } }}
          >
            <Flex
              align="center" justify="center"
              w="6" h="6" rounded="full" flexShrink={0}
              bg="var(--surface-3)"
              color="var(--text-secondary)"
              fontWeight="700"
              fontSize="10px"
            >
              {(activeProfile?.id ?? 'HM').slice(0, 2).toUpperCase()}
            </Flex>
            <Text
              flex="1"
              fontSize="13px"
              fontWeight="500"
              color="var(--text-primary)"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              lineHeight="1"
            >
              {activeProfile?.id ?? 'No profile'}
            </Text>
            <Box color="var(--text-muted)" flexShrink={0}>
              <SidebarIcon name="chevron-right" size="sm" />
            </Box>
          </HStack>
          {!drawerMode ? (
            <Button
              variant="ghost"
              w="7" h="7" minW="0" px="0" rounded="6px"
              color="var(--text-muted)"
              _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              onClick={() => void onCollapsedChange(true)}
              flexShrink={0}
            >
              <CollapseIcon />
            </Button>
          ) : null}
          </HStack>
        </Box>

        {/* ── Search input ── */}
        <Box px="2" pb="1" flexShrink={0}>
          <Box position="relative">
            <Box
              position="absolute" left="8px" top="50%"
              transform="translateY(-50%)"
              pointerEvents="none" color="var(--text-muted)"
            >
              <SidebarIcon name="search" />
            </Box>
            <Input
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.currentTarget.value)}
              placeholder="Search sessions…"
              h="8" pl="6" pr="2"
              rounded="var(--radius-control)"
              bg="var(--surface-hover)"
              border="none"
              color="var(--text-primary)"
              fontSize="12px"
              _placeholder={{ color: 'var(--text-muted)' }}
              _focus={{ bg: 'var(--surface-2)', boxShadow: 'var(--focus-ring)' }}
            />
          </Box>
        </Box>

        {/* ── New session row ── */}
        <Box px="2" pb="1" flexShrink={0}>
          <Button
            display="flex"
            alignItems="center"
            justifyContent="flex-start"
            variant="ghost"
            w="100%"
            h="auto"
            minH="0"
            px="2"
            py="2"
            rounded="var(--radius-control)"
            color="var(--text-muted)"
            _hover={isRuntimeReady ? { bg: 'var(--surface-hover)', color: 'var(--text-secondary)' } : {}}
            onClick={isRuntimeReady ? onCreateSession : undefined}
            title={isRuntimeReady ? 'New session (⌘N)' : 'Set up a model to create sessions'}
            aria-label="New session"
            aria-disabled={!isRuntimeReady}
            cursor={isRuntimeReady ? 'pointer' : 'not-allowed'}
            opacity={isRuntimeReady ? 1 : 0.35}
          >
            <HStack gap="2" w="100%">
              <SidebarIcon name="new-session" />
              <Text fontSize="13px" fontWeight="400" color="inherit" lineHeight="1">New session</Text>
              {isRuntimeReady ? <Box ml="auto" fontSize="10px" fontWeight="400" opacity={0.4}>⌘N</Box> : null}
            </HStack>
          </Button>
        </Box>

        {/* ── Error banner ── */}
        {actionError ? (
          <Box px="2" pb="1" flexShrink={0}>
            <ErrorBanner title="Session update failed" detail={actionError} />
          </Box>
        ) : null}

        {/* ── Session list + nav — outer wrapper carries the sidebar-scroll testId for tests ── */}
        <Flex direction="column" flex="1" minH={0} overflow="hidden" data-testid="sidebar-scroll">

        {/* "Recent sessions" label — hidden after collapse, checked by tests */}
        <Box px="3" pt="2" pb="0.5" flexShrink={0}>
          <Text
            fontSize="10px"
            fontWeight="600"
            color="var(--text-muted)"
            letterSpacing="0.05em"
            textTransform="uppercase"
            opacity={0.6}
          >
            Recent sessions
          </Text>
        </Box>

        <ScrollArea.Root flex="1" minH={0} variant="hover" overflow="hidden" maxW="100%">
          <ScrollArea.Viewport style={{ overflowX: 'hidden', maxWidth: '100%' }}>
            <VStack
              align="stretch" gap="0" px="2" pt="0.5" pb="1" minW={0} w="100%" maxW="100%"
              opacity={isRuntimeReady ? 1 : 0.4}
              pointerEvents={isRuntimeReady ? undefined : 'none'}
              title={!isRuntimeReady ? 'Set up a model to open sessions' : undefined}
            >
              {filteredSessions.length === 0 ? (
                <Text px="2" py="2" fontSize="11px" color="var(--text-muted)" opacity={0.6}>
                  {sessionSearch ? 'No matching sessions.' : 'No sessions yet.'}
                </Text>
              ) : (
                filteredSessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    active={session.id === activeSessionId && activePage === 'chat'}
                    onClick={() => onOpenSession(session.id)}
                    onRename={() => {
                      setSelectedSession(session);
                      setActionError(null);
                      setRenameOpen(true);
                    }}
                    onDelete={() => {
                      setSelectedSession(session);
                      setActionError(null);
                      setDeleteOpen(true);
                    }}
                  />
                ))
              )}
            </VStack>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar />
        </ScrollArea.Root>

        {/* ── Section divider + nav items ── */}
        <Box flexShrink={0} px="2" pt="2" pb="2"
          borderTop="1px solid var(--divider)"
        >
          <VStack align="stretch" gap="0">
            {allNav.map((item) => (
              <NavButton
                key={item.page}
                label={item.label}
                icon={item.icon}
                shortcut={item.shortcut}
                active={activePage === item.page}
                disabled={item.requiresRuntime && !isRuntimeReady}
                onClick={() => onOpenPage(item.page)}
              />
            ))}
          </VStack>
        </Box>
        </Flex>{/* end sidebar-scroll outer wrapper */}
      </Flex>

      {/* Profile drawer */}
      <ProfileManagementDrawer
        open={profileDrawerOpen}
        profiles={profiles}
        activeProfileId={activeProfileId}
        profileMetrics={profileMetrics}
        onClose={() => setProfileDrawerOpen(false)}
        onProfileChange={(id) => { onProfileChange(id); setProfileDrawerOpen(false); }}
        onCreateProfile={onCreateProfile}
        onDeleteProfile={onDeleteProfile}
      />

      {selectedSession ? (
        <>
          <SessionRenameDialog
            open={renameOpen}
            loading={actionLoading}
            sessionTitle={selectedSession.title}
            onOpenChange={(open) => {
              setRenameOpen(open);
              if (!open && !deleteOpen) { setSelectedSession(null); setActionError(null); }
            }}
            onSave={handleRename}
          />
          <ConfirmDialog
            open={deleteOpen}
            loading={actionLoading}
            title="Delete session"
            description="Delete this session from the app. If Hermes supports remote deletion it will be removed there too; otherwise it will be hidden locally until new Hermes activity revives it."
            confirmLabel="Delete session"
            onOpenChange={(open) => {
              setDeleteOpen(open);
              if (!open && !renameOpen) { setSelectedSession(null); setActionError(null); }
            }}
            onConfirm={handleDelete}
          />
        </>
      ) : null}
    </>
  );
}

/* ── ProfileManagementDrawer ── */
function ProfileManagementDrawer({
  open,
  profiles,
  activeProfileId,
  profileMetrics,
  onClose,
  onProfileChange,
  onCreateProfile,
  onDeleteProfile
}: {
  open: boolean;
  profiles: Profile[];
  activeProfileId: string | null;
  profileMetrics?: ProfileMetrics[];
  onClose: () => void;
  onProfileChange: (id: string) => void;
  onCreateProfile?: (name: string) => Promise<void> | void;
  onDeleteProfile?: (profileId: string) => Promise<void> | void;
}) {
  const [newProfileName, setNewProfileName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const metricsMap = useMemo(
    () => new Map((profileMetrics ?? []).map((m) => [m.profileId, m])),
    [profileMetrics]
  );

  async function handleCreate() {
    const name = newProfileName.trim();
    if (!name || !onCreateProfile) return;
    setCreating(true);
    setCreateError(null);
    try {
      await onCreateProfile(name);
      setNewProfileName('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create profile.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(profileId: string) {
    if (!onDeleteProfile) return;
    setDeletingId(profileId);
    setDeleteError(null);
    try {
      await onDeleteProfile(profileId);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete profile.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Drawer.Root open={open} onOpenChange={(e) => { if (!e.open) onClose(); }} placement="start" size="xs">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content bg="var(--surface-1)" borderRight="1px solid var(--border-subtle)">
            <Drawer.Header borderBottom="1px solid var(--border-subtle)" pb="3">
              <Drawer.Title fontSize="sm" fontWeight="600" color="var(--text-primary)">
                Profiles
              </Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <Button variant="ghost" w="7" h="7" minW="0" px="0" rounded="6px" color="var(--text-muted)" _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }} aria-label="Close">
                  ✕
                </Button>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body px="3" py="3" overflowY="auto">
              <VStack align="stretch" gap="2">
                {deleteError ? <ErrorBanner title="Delete failed" detail={deleteError} /> : null}
                {profiles.map((profile) => {
                  const metrics = metricsMap.get(profile.id);
                  const isActive = profile.id === activeProfileId;
                  const isDeleting = deletingId === profile.id;
                  return (
                    <Box
                      key={profile.id}
                      rounded="var(--radius-card)"
                      border="1px solid"
                      borderColor={isActive ? 'var(--border-default)' : 'var(--border-subtle)'}
                      bg={isActive ? 'var(--surface-active)' : 'var(--surface-2)'}
                      p="3"
                    >
                      <HStack align="start" gap="2" mb={metrics ? '2' : '0'}>
                        <Flex align="center" justify="center" w="7" h="7" rounded="full" flexShrink={0}
                          bg="var(--surface-3)" color="var(--text-secondary)" fontWeight="700" fontSize="11px" mt="0.5">
                          {profile.id.slice(0, 2).toUpperCase()}
                        </Flex>
                        <Box flex="1" minW={0}>
                          <Text fontSize="xs" fontWeight="600" color="var(--text-primary)" lineHeight="1.3">
                            {profile.id}
                            {isActive ? (
                              <Text as="span" ml="1.5" fontSize="10px" color="var(--text-muted)" fontWeight="500" letterSpacing="0.04em">
                                active
                              </Text>
                            ) : null}
                          </Text>
                          {profile.model ? (
                            <Text fontSize="10px" color="var(--text-muted)" lineHeight="1.3" mt="0.5" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                              {profile.model}
                            </Text>
                          ) : null}
                        </Box>
                        <HStack gap="1" flexShrink={0}>
                          {!isActive && (
                            <Button size="xs" variant="ghost" h="6" px="2" fontSize="11px"
                              color="var(--text-secondary)" _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                              onClick={() => onProfileChange(profile.id)}>
                              Use
                            </Button>
                          )}
                          {!isActive && onDeleteProfile && (
                            <Button size="xs" variant="ghost" h="6" w="6" minW="0" px="0"
                              color="var(--text-muted)" _hover={{ bg: 'var(--surface-hover)', color: '#dc2626' }}
                              disabled={isDeleting}
                              onClick={() => void handleDelete(profile.id)}
                              aria-label={`Delete profile ${profile.id}`}>
                              {isDeleting ? <Spinner size="xs" /> : <SidebarIcon name="trash" />}
                            </Button>
                          )}
                        </HStack>
                      </HStack>
                      {metrics ? (
                        <HStack gap="3" px="1">
                          <MetricChip value={metrics.sessionCount} label="chats" />
                          <MetricChip value={metrics.messageCount} label="messages" />
                          <MetricChip value={metrics.recipeCount} label="spaces" />
                        </HStack>
                      ) : null}
                    </Box>
                  );
                })}
                {onCreateProfile ? (
                  <Box rounded="var(--radius-card)" border="1px dashed var(--border-subtle)" p="3" mt="1">
                    <Text fontSize="xs" fontWeight="600" color="var(--text-secondary)" mb="2">New profile</Text>
                    {createError ? <Box mb="2"><ErrorBanner title="Create failed" detail={createError} /></Box> : null}
                    <HStack gap="2">
                      <Input
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.currentTarget.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); }}
                        placeholder="profile-name"
                        size="sm" h="7" fontSize="xs" rounded="6px"
                        bg="var(--surface-hover)" border="1px solid var(--border-subtle)"
                        color="var(--text-primary)" _placeholder={{ color: 'var(--text-muted)' }}
                        _focus={{ boxShadow: 'var(--focus-ring)' }}
                        flex="1" disabled={creating}
                      />
                      <Button h="7" px="3" fontSize="xs" fontWeight="500" rounded="6px"
                        bg="var(--accent)" color="var(--accent-contrast)" _hover={{ bg: 'var(--accent-strong)' }}
                        disabled={!newProfileName.trim() || creating}
                        onClick={() => void handleCreate()} flexShrink={0}>
                        {creating ? <Spinner size="xs" /> : 'Create'}
                      </Button>
                    </HStack>
                    <Text fontSize="10px" color="var(--text-muted)" mt="1.5">
                      Clones config from active profile. Lowercase, alphanumeric.
                    </Text>
                  </Box>
                ) : null}
              </VStack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}

function MetricChip({ value, label }: { value: number; label: string }) {
  return (
    <HStack gap="1" align="baseline">
      <Text fontSize="xs" fontWeight="700" color="var(--text-primary)" lineHeight="1">{value.toLocaleString()}</Text>
      <Text fontSize="10px" color="var(--text-muted)" lineHeight="1">{label}</Text>
    </HStack>
  );
}

/* ── NavButton ── */
function NavButton({
  label, icon, shortcut, active, disabled, onClick
}: {
  label: string;
  icon: SidebarIconName;
  shortcut?: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      display="flex"
      alignItems="center"
      justifyContent="flex-start"
      variant="ghost"
      width="100%"
      minW={0}
      rounded="var(--radius-control)"
      px="2"
      gap="2"
      h="var(--sidebar-row-h)"
      bg={active ? 'var(--surface-active)' : 'transparent'}
      color={active ? 'var(--text-primary)' : 'var(--text-muted)'}
      fontWeight={active ? '500' : '400'}
      fontSize="13px"
      overflow="hidden"
      textAlign="left"
      aria-label={label}
      opacity={disabled ? 0.35 : 1}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      _hover={disabled ? {} : { bg: active ? 'var(--surface-active)' : 'var(--surface-hover)', color: 'var(--text-primary)' }}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
      title={disabled ? 'Set up a model to access this page' : undefined}
    >
      <Box as="span" display="inline-flex" alignItems="center" flexShrink={0} color={active ? 'var(--text-secondary)' : 'var(--text-muted)'}>
        <SidebarIcon name={icon} size="sm" />
      </Box>
      <Text as="span" flex="1" minW={0} overflow="hidden" textOverflow="ellipsis" lineHeight="1">{label}</Text>
      {shortcut && !disabled ? (
        <Text as="span" fontSize="10px" color="var(--text-muted)" fontWeight="400" opacity={0.5} flexShrink={0}>{shortcut}</Text>
      ) : null}
    </Button>
  );
}

/* ── SidebarIcon ── */
function SidebarIcon({ name, size = 'sm' }: { name: SidebarIconName; size?: 'sm' | 'md' }) {
  const Svg = chakra('svg');
  const content = (() => {
    switch (name) {
      case 'dashboard':
        return (
          <>
            <path d="M2.5 2.5h4.5v6H2.5zM9 2.5h4.5v3.5H9zM9 8h4.5v5.5H9zM2.5 10h4.5v3.5H2.5z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </>
        );
      case 'new-session':
        return (
          <>
            <path d="M4 5.5h7.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7.5v5M5.5 10h5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'sessions':
        return (
          <>
            <path d="M3 4.5h10a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H3.5A1.5 1.5 0 0 1 2 14V6a1.5 1.5 0 0 1 1-1.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4.5 8h7M4.5 11h5.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'recipes':
        return <path d="M3 4h4.5v4.5H3zM8.5 4H13v4.5H8.5zM3 9.5h4.5V14H3zM8.5 9.5H13V14H8.5z" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />;
      case 'jobs':
        return (
          <>
            <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5.5v3l2 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'tools':
        return <path d="M6 3.5 4.5 5l2 2L5 8.5l-2-2L1.5 8 4 10.5l2-2 1.5 1.5-2 2L7 13.5l2-2 2.5 2.5L14 11.5 9.5 7 8 8.5 6 6.5 7.5 5 6 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />;
      case 'skills':
        return <path d="M8 2.5 9.6 6l3.9.4-2.9 2.5.9 3.8L8 10.8 4.5 12.7l.9-3.8L2.5 6.4 6.4 6Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />;
      case 'settings':
        return (
          <>
            <circle cx="8" cy="8" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 2.5v1.7M8 11.8v1.7M13.5 8h-1.7M4.2 8H2.5M11.9 4.1 10.7 5.3M5.3 10.7 4.1 11.9M11.9 11.9 10.7 10.7M5.3 5.3 4.1 4.1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'search':
        return (
          <>
            <circle cx="7" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L13.5 13.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'gear':
        return (
          <>
            <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 3v1.5M8 11.5V13M13 8h-1.5M4.5 8H3M11.2 4.8l-1 1M5.8 9.2l-1 1M11.2 11.2l-1-1M5.8 6.8l-1-1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </>
        );
      case 'plus':
        return <path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />;
      case 'trash':
        return (
          <>
            <path d="M3.5 5h9M5.5 5V3.5h5V5M6.5 7.5v5M9.5 7.5v5M4.5 5l.7 8h5.6l.7-8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );
      case 'user':
        return (
          <>
            <circle cx="8" cy="6" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'chevron-right':
        return <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />;
      case 'coding':
        return (
          <>
            <path d="M4 6l-2 2 2 2M12 6l2 2-2 2M7.5 13l1-10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );
      case 'remote-access':
        return (
          <>
            <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5.2 10.8a4 4 0 0 1 0-5.6M10.8 5.2a4 4 0 0 1 0 5.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3.1 12.9a7 7 0 0 1 0-9.8M12.9 3.1a7 7 0 0 1 0 9.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      default:
        return <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />;
    }
  })();
  return (
    <Svg viewBox="0 0 16 16" boxSize={size === 'md' ? '5' : '3.5'} color="currentColor" aria-hidden="true" flexShrink={0}>
      {content}
    </Svg>
  );
}
