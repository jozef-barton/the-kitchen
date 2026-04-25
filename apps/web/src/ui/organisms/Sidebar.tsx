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
import { BrandLockup } from '../atoms/BrandLockup';

type SidebarIconName = 'recipes' | 'sessions' | 'jobs' | 'tools' | 'skills' | 'settings' | 'new-session' | 'collapse' | 'expand' | 'search' | 'gear' | 'plus' | 'trash' | 'user';

/* Primary nav (top of utility section) */
const primaryNav: Array<{ page: AppPage; label: string; icon: SidebarIconName; shortcut?: string }> = [
  { page: 'sessions', label: 'All sessions', icon: 'sessions', shortcut: '⌘⇧S' },
  { page: 'recipes', label: 'Recipes', icon: 'recipes', shortcut: '⌘R' }
];

/* Secondary nav (bottom utility) */
const secondaryNav: Array<{ page: AppPage; label: string; icon: SidebarIconName }> = [
  { page: 'jobs', label: 'Jobs', icon: 'jobs' },
  { page: 'tools', label: 'Tools', icon: 'tools' },
  { page: 'skills', label: 'Skills', icon: 'skills' },
  { page: 'settings', label: 'Settings', icon: 'settings' }
];

const navItems = [...primaryNav, ...secondaryNav];

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
  onDeleteProfile
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
  const activeProfileBadge =
    activeProfile?.name?.slice(0, 2).toUpperCase() ??
    activeProfile?.id?.slice(0, 2).toUpperCase() ??
    'HM';

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

  const sidebarWidth = collapsed ? '56px' : '252px';

  return (
    <>
      <Flex
        direction="column"
        width={drawerMode ? '100%' : { base: '100%', lg: sidebarWidth }}
        minWidth={drawerMode ? '0' : { base: '100%', lg: sidebarWidth }}
        maxWidth={drawerMode ? '100%' : { base: '100%', lg: sidebarWidth }}
        flexShrink={0}
        height={drawerMode ? '100dvh' : { base: '34dvh', lg: '100dvh' }}
        minHeight={drawerMode ? '0' : { base: '200px', lg: '0' }}
        maxHeight={drawerMode ? 'none' : { base: '34dvh', lg: 'none' }}
        bg="var(--sidebar-bg)"
        minH={0}
        overflow="hidden"
        overflowX="hidden"
        transition="width 220ms cubic-bezier(0.4, 0, 0.2, 1), min-width 220ms cubic-bezier(0.4, 0, 0.2, 1), max-width 220ms cubic-bezier(0.4, 0, 0.2, 1)"
        borderRight={drawerMode ? 'none' : { base: 'none', lg: '1px solid var(--border-subtle)' }}
      >
        {collapsed ? (
          /* ── Collapsed: icon strip ── */
          <Flex direction="column" h="100%" align="center" py="3" gap="0">
            {/* Expand button */}
            <Button
              variant="ghost"
              w="9" h="9" minW="0" px="0"
              color="var(--text-muted)"
              _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              onClick={() => void onCollapsedChange(false)}
              mb="2"
            >
              <SidebarIcon name="expand" />
            </Button>

            {/* New session */}
            <Button
              variant="ghost"
              w="9" h="9" minW="0" px="0"
              color="var(--text-muted)"
              _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
              onClick={onCreateSession}
              title="New session (⌘N)"
              aria-label="New session"
              mb="3"
            >
              <SidebarIcon name="new-session" />
            </Button>

            {/* Profile badge */}
            <Button
              variant="ghost"
              w="9" h="9" minW="0" px="0"
              title={activeProfile ? `${activeProfile.name} (${activeProfile.id})` : 'Active profile'}
              aria-label={activeProfile ? `${activeProfile.name} (${activeProfile.id})` : 'Active profile'}
              onClick={() => void onCollapsedChange(false)}
              mb="auto"
            >
              <Flex
                align="center" justify="center"
                w="7" h="7" rounded="full"
                bg="var(--surface-selected)"
                color="var(--text-secondary)"
                fontWeight="700"
                fontSize="10px"
              >
                {activeProfileBadge}
              </Flex>
            </Button>

            {/* Bottom nav icons */}
            <VStack gap="0.5" align="center" mt="auto">
              <Box h="1px" w="6" bg="var(--border-subtle)" mb="1" />
              {navItems.map((item) => (
                <Button
                  key={item.page}
                  variant="ghost"
                  w="9" h="8" minW="0" px="0"
                  rounded="8px"
                  color={activePage === item.page ? 'var(--text-primary)' : 'var(--text-muted)'}
                  bg={activePage === item.page ? 'var(--surface-selected)' : 'transparent'}
                  _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                  title={item.label}
                  aria-label={item.label}
                  onClick={() => onOpenPage(item.page)}
                >
                  <SidebarIcon name={item.icon} />
                </Button>
              ))}
            </VStack>
          </Flex>
        ) : (
          /* ── Expanded layout ── */
          <Flex direction="column" h="100%">
            {/* Header — hidden in drawerMode (outer drawer provides branding/close) */}
            {!drawerMode ? (
              <Box px="3" pt="3" pb="2" flexShrink={0}>
                <HStack justify="space-between" align="center" mb="3">
                  <BrandLockup />
                  <Button
                    variant="ghost"
                    w="7" h="7" minW="0" px="0" rounded="7px"
                    color="var(--text-muted)"
                    _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                    title="Collapse sidebar"
                    aria-label="Collapse sidebar"
                    onClick={() => void onCollapsedChange(true)}
                  >
                    <SidebarIcon name="collapse" />
                  </Button>
                </HStack>

                {/* Profile bar */}
                <ProfileBar
                  profile={activeProfile}
                  onGearClick={() => setProfileDrawerOpen(true)}
                />

                <Button
                  justifyContent="start"
                  variant="ghost"
                  w="100%" h="8" minH="0" px="2" rounded="8px"
                  color="var(--text-muted)"
                  fontSize="xs" fontWeight="500"
                  mt="1.5"
                  _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                  onClick={onCreateSession}
                  title="New session (⌘N)"
                  aria-label="New session"
                >
                  <HStack gap="2" w="100%">
                    <SidebarIcon name="new-session" />
                    <Text>New session</Text>
                    <Box ml="auto" fontSize="10px" fontWeight="400" opacity={0.4}>⌘N</Box>
                  </HStack>
                </Button>

                {actionError ? (
                  <Box mt="2">
                    <ErrorBanner title="Session update failed" detail={actionError} />
                  </Box>
                ) : null}
              </Box>
            ) : (
              <Box px="3" pt="3" pb="2" flexShrink={0}>
                {/* Profile bar in drawer mode */}
                <ProfileBar
                  profile={activeProfile}
                  onGearClick={() => setProfileDrawerOpen(true)}
                  mb="2"
                />
                <Button
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap="2"
                  w="100%"
                  h="9"
                  rounded="8px"
                  bg="var(--accent)"
                  color="var(--accent-contrast)"
                  fontSize="sm"
                  fontWeight="600"
                  _hover={{ bg: 'var(--accent-strong)' }}
                  onClick={onCreateSession}
                  title="New session"
                  aria-label="New session"
                >
                  <SidebarIcon name="new-session" />
                  <Text as="span">New session</Text>
                </Button>
                {actionError ? (
                  <Box mt="2">
                    <ErrorBanner title="Session update failed" detail={actionError} />
                  </Box>
                ) : null}
              </Box>
            )}

            {/* Body: sessions list + bottom nav */}
            <Flex
              data-testid="sidebar-scroll"
              direction="column"
              flex="1"
              minH={0}
              overflow="hidden"
            >
              {/* Sessions */}
              <Flex direction="column" flex="1" minH={0}>
                <Box px="3" pb="1" flexShrink={0}>
                  <Text
                    fontSize="11px"
                    fontWeight="600"
                    color="var(--text-muted)"
                    px="1"
                    pb="1.5"
                    letterSpacing="0.02em"
                    opacity={0.7}
                  >
                    Recent sessions
                  </Text>
                  <Box position="relative">
                    <Box
                      position="absolute" left="7px" top="50%"
                      transform="translateY(-50%)"
                      pointerEvents="none" color="var(--text-muted)"
                    >
                      <SidebarIcon name="search" />
                    </Box>
                    <Input
                      value={sessionSearch}
                      onChange={(e) => setSessionSearch(e.currentTarget.value)}
                      placeholder="Search sessions…"
                      size="sm" pl="6" h="6"
                      rounded="6px"
                      bg="var(--surface-hover)"
                      border="none"
                      color="var(--text-primary)"
                      fontSize="12px"
                      _placeholder={{ color: 'var(--text-muted)' }}
                      _focus={{ bg: 'var(--surface-2)', boxShadow: 'var(--focus-ring)' }}
                    />
                  </Box>
                </Box>

                <ScrollArea.Root flex="1" minH={0} variant="hover" overflow="hidden" maxW="100%">
                  <ScrollArea.Viewport style={{ overflowX: 'hidden', maxWidth: '100%' }}>
                    <VStack align="stretch" gap="0.5" px="2" py="0.5" minW={0} w="100%" maxW="100%">
                      {filteredSessions.length === 0 ? (
                        <Text px="2" py="1" fontSize="xs" color="var(--text-muted)" opacity={0.6}>
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
              </Flex>

              {/* Bottom utility nav */}
              <Box flexShrink={0} px="2" pb="3">
                <Box h="1px" bg="var(--border-subtle)" mx="1" mb="2" />

                {/* Primary nav */}
                <VStack align="stretch" gap="0.5" mb="2">
                  {primaryNav.map((item) => (
                    <NavButton
                      key={item.page}
                      label={item.label}
                      icon={item.icon}
                      shortcut={item.shortcut}
                      active={activePage === item.page}
                      onClick={() => onOpenPage(item.page)}
                      large={drawerMode}
                    />
                  ))}
                </VStack>

                <Box h="1px" bg="var(--border-subtle)" mx="1" mb="2" opacity={0.5} />

                {/* Secondary nav */}
                <VStack align="stretch" gap="0.5" mb="2">
                  {secondaryNav.map((item) => (
                    <NavButton
                      key={item.page}
                      label={item.label}
                      icon={item.icon}
                      active={activePage === item.page}
                      onClick={() => onOpenPage(item.page)}
                      secondary
                      large={drawerMode}
                    />
                  ))}
                </VStack>
              </Box>
            </Flex>
          </Flex>
        )}
      </Flex>

      {/* Profile management drawer */}
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

/* ── ProfileBar ── */
function ProfileBar({
  profile,
  onGearClick,
  mb
}: {
  profile: Profile | null;
  onGearClick: () => void;
  mb?: string;
}) {
  const badge =
    profile?.name?.slice(0, 2).toUpperCase() ??
    profile?.id?.slice(0, 2).toUpperCase() ??
    'HM';

  return (
    <HStack
      gap="2"
      px="1"
      py="1"
      rounded="8px"
      mb={mb}
      _hover={{ bg: 'var(--surface-hover)' }}
      transition="background 120ms ease"
      cursor="default"
    >
      <Flex
        align="center" justify="center"
        w="6" h="6" rounded="full" flexShrink={0}
        bg="var(--accent)"
        color="var(--accent-contrast)"
        fontWeight="700"
        fontSize="10px"
      >
        {badge}
      </Flex>
      <Text
        flex="1"
        fontSize="xs"
        fontWeight="600"
        color="var(--text-primary)"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        lineHeight="1"
      >
        {profile?.id ?? 'No profile'}
      </Text>
      <Button
        variant="ghost"
        w="6" h="6" minW="0" px="0" rounded="6px"
        flexShrink={0}
        color="var(--text-muted)"
        _hover={{ bg: 'var(--surface-2)', color: 'var(--text-primary)' }}
        title="Manage profiles"
        aria-label="Manage profiles"
        onClick={onGearClick}
      >
        <SidebarIcon name="gear" size="sm" />
      </Button>
    </HStack>
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
    if (!name) return;
    if (!onCreateProfile) return;
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
                <Button
                  variant="ghost"
                  w="7" h="7" minW="0" px="0" rounded="6px"
                  color="var(--text-muted)"
                  _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                  aria-label="Close"
                >
                  ✕
                </Button>
              </Drawer.CloseTrigger>
            </Drawer.Header>

            <Drawer.Body px="3" py="3" overflowY="auto">
              <VStack align="stretch" gap="2">
                {deleteError ? (
                  <ErrorBanner title="Delete failed" detail={deleteError} />
                ) : null}

                {profiles.map((profile) => {
                  const metrics = metricsMap.get(profile.id);
                  const isActive = profile.id === activeProfileId;
                  const isDeleting = deletingId === profile.id;

                  return (
                    <Box
                      key={profile.id}
                      rounded="10px"
                      border="1px solid"
                      borderColor={isActive ? 'var(--accent)' : 'var(--border-subtle)'}
                      bg={isActive ? 'var(--surface-selected)' : 'var(--surface-2)'}
                      p="3"
                    >
                      <HStack align="start" gap="2" mb={metrics ? '2' : '0'}>
                        <Flex
                          align="center" justify="center"
                          w="7" h="7" rounded="full" flexShrink={0}
                          bg={isActive ? 'var(--accent)' : 'var(--surface-hover)'}
                          color={isActive ? 'var(--accent-contrast)' : 'var(--text-muted)'}
                          fontWeight="700"
                          fontSize="11px"
                          mt="0.5"
                        >
                          {profile.id.slice(0, 2).toUpperCase()}
                        </Flex>

                        <Box flex="1" minW={0}>
                          <Text fontSize="xs" fontWeight="600" color="var(--text-primary)" lineHeight="1.3">
                            {profile.id}
                            {isActive ? (
                              <Text as="span" ml="1.5" fontSize="10px" color="var(--accent)" fontWeight="500">
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
                            <Button
                              size="xs"
                              variant="ghost"
                              h="6"
                              px="2"
                              fontSize="11px"
                              color="var(--text-secondary)"
                              _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                              onClick={() => onProfileChange(profile.id)}
                            >
                              Use
                            </Button>
                          )}
                          {!isActive && onDeleteProfile && (
                            <Button
                              size="xs"
                              variant="ghost"
                              h="6"
                              w="6"
                              minW="0"
                              px="0"
                              color="var(--text-muted)"
                              _hover={{ bg: 'var(--surface-hover)', color: '#dc2626' }}
                              disabled={isDeleting}
                              onClick={() => void handleDelete(profile.id)}
                              aria-label={`Delete profile ${profile.id}`}
                            >
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

                {/* Create new profile */}
                {onCreateProfile ? (
                  <Box
                    rounded="10px"
                    border="1px dashed var(--border-subtle)"
                    p="3"
                    mt="1"
                  >
                    <Text fontSize="xs" fontWeight="600" color="var(--text-secondary)" mb="2">
                      New profile
                    </Text>
                    {createError ? (
                      <Box mb="2">
                        <ErrorBanner title="Create failed" detail={createError} />
                      </Box>
                    ) : null}
                    <HStack gap="2">
                      <Input
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.currentTarget.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); }}
                        placeholder="profile-name"
                        size="sm"
                        h="7"
                        fontSize="xs"
                        rounded="6px"
                        bg="var(--surface-hover)"
                        border="1px solid var(--border-subtle)"
                        color="var(--text-primary)"
                        _placeholder={{ color: 'var(--text-muted)' }}
                        _focus={{ boxShadow: 'var(--focus-ring)' }}
                        flex="1"
                        disabled={creating}
                      />
                      <Button
                        h="7"
                        px="3"
                        fontSize="xs"
                        fontWeight="500"
                        rounded="6px"
                        bg="var(--accent)"
                        color="var(--accent-contrast)"
                        _hover={{ bg: 'var(--accent-strong)' }}
                        disabled={!newProfileName.trim() || creating}
                        onClick={() => void handleCreate()}
                        flexShrink={0}
                      >
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
      <Text fontSize="xs" fontWeight="700" color="var(--text-primary)" lineHeight="1">
        {value.toLocaleString()}
      </Text>
      <Text fontSize="10px" color="var(--text-muted)" lineHeight="1">
        {label}
      </Text>
    </HStack>
  );
}

/* ── NavButton ── */
function NavButton({
  label,
  icon,
  shortcut,
  active,
  onClick,
  secondary = false,
  large = false
}: {
  label: string;
  icon: SidebarIconName;
  shortcut?: string;
  active: boolean;
  onClick: () => void;
  secondary?: boolean;
  large?: boolean;
}) {
  return (
    <Button
      display="flex"
      alignItems="center"
      justifyContent="flex-start"
      variant="ghost"
      width="100%"
      minW={0}
      rounded="7px"
      px={large ? '3' : '2'}
      gap={large ? '3' : '2'}
      h={large ? '10' : '7'}
      bg={active ? 'var(--surface-selected)' : 'transparent'}
      color={active ? 'var(--text-primary)' : secondary ? 'var(--text-muted)' : 'var(--text-secondary)'}
      fontWeight={active ? '500' : '400'}
      fontSize={large ? 'sm' : 'xs'}
      overflow="hidden"
      textAlign="left"
      aria-label={label}
      _hover={{ bg: active ? 'var(--surface-selected)' : 'var(--surface-hover)', color: 'var(--text-primary)' }}
      onClick={onClick}
    >
      <Box
        as="span"
        display="inline-flex"
        alignItems="center"
        flexShrink={0}
        color={active ? 'var(--text-primary)' : 'var(--text-muted)'}
      >
        <SidebarIcon name={icon} size={large ? 'md' : 'sm'} />
      </Box>
      <Text as="span" flex="1" minW={0} overflow="hidden" textOverflow="ellipsis" lineHeight="1">
        {label}
      </Text>
      {shortcut ? (
        <Text as="span" fontSize={large ? 'xs' : '10px'} color="var(--text-muted)" fontWeight="400" opacity={0.5} flexShrink={0}>
          {shortcut}
        </Text>
      ) : null}
    </Button>
  );
}

/* ── SidebarIcon ── */
function SidebarIcon({ name, size = 'sm' }: { name: SidebarIconName; size?: 'sm' | 'md' }) {
  const Svg = chakra('svg');
  const content = (() => {
    switch (name) {
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
      case 'collapse':
        return <path d="M10.5 3.5 5.5 8l5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />;
      case 'expand':
      default:
        return <path d="M5.5 3.5 10.5 8l-5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />;
    }
  })();
  return (
    <Svg viewBox="0 0 16 16" boxSize={size === 'md' ? '5' : '3.5'} color="currentColor" aria-hidden="true" flexShrink={0}>
      {content}
    </Svg>
  );
}
