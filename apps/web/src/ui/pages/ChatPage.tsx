import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Box, Button, CloseButton, Drawer, Flex, Grid, HStack, Portal, Text, chakra } from '@chakra-ui/react';

function SpaceIcon() {
  const Svg = chakra('svg');
  return (
    <Svg viewBox="0 0 16 16" boxSize="3" fill="none" aria-hidden="true" color="currentColor" flexShrink={0}>
      <path d="M3 4h4.5v4.5H3zM8.5 4H13v4.5H8.5zM3 9.5h4.5V14H3zM8.5 9.5H13V14H8.5z" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
    </Svg>
  );
}

function ActivityIcon() {
  const Svg = chakra('svg');
  return (
    <Svg viewBox="0 0 16 16" boxSize="3" fill="none" aria-hidden="true" color="currentColor" flexShrink={0}>
      <path d="M1.5 8h2.5l2-5 3 9 2-6 1.5 2H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SpinnerIcon() {
  const Svg = chakra('svg');
  return (
    <Svg viewBox="0 0 16 16" boxSize="3" fill="none" aria-hidden="true" color="currentColor" flexShrink={0}
      style={{ animation: 'spinIcon 0.7s linear infinite' }}>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="2" strokeDasharray="22" strokeDashoffset="16" strokeLinecap="round" />
    </Svg>
  );
}
import type { ChatActivity, ChatMessage, RuntimeRequest, SessionMessagesResponse, Recipe, UpdateRecipeRequest } from '@hermes-recipes/protocol';
import { ErrorBanner } from '../molecules/ErrorBanner';
import { ConfirmDialog } from '../molecules/ConfirmDialog';
import { SessionActionMenu } from '../molecules/SessionActionMenu';
import { SessionRenameDialog } from '../molecules/SessionRenameDialog';
import { ChatActivityFeed } from '../organisms/ChatActivityFeed';
import { ChatComposer } from '../organisms/ChatComposer';
import { ChatTranscript } from '../organisms/ChatTranscript';
import { SessionRecipePanel } from '../organisms/SessionRecipePanel';

export function ChatPage({
  sessionPayload,
  loading,
  error,
  onSend,
  sending,
  progress,
  activities,
  assistantDraft,
  chatError,
  typing,
  selectedActivityRequestId,
  selectedActivityPreview,
  selectedActivityStatus,
  onFocusActivityRequest,
  runtimeDrawerOpen,
  onRuntimeDrawerOpenChange,
  onOpenRuntimeRequest,
  onRenameSession,
  onDeleteSession,
  onRenameRecipe,
  onDeleteRecipe,
  onRefreshRecipe,
  onExecuteRecipeAction,
  onUpdateRecipe,
  onApplyRecipeEntryAction,
  onSwitchTemplate,
  activeModelLabel
}: {
  sessionPayload: SessionMessagesResponse | null;
  loading: boolean;
  error: string | null;
  onSend: (content: string) => boolean | Promise<boolean>;
  sending: boolean;
  progress: string | null;
  activities: ChatActivity[];
  assistantDraft: string;
  chatError: string | null;
  typing: boolean;
  selectedActivityRequestId: string | null;
  selectedActivityPreview: string | null;
  selectedActivityStatus: RuntimeRequest['status'] | null;
  onFocusActivityRequest: (requestId: string | null) => void;
  runtimeDrawerOpen: boolean;
  onRuntimeDrawerOpenChange: (open: boolean) => void;
  onOpenRuntimeRequest: (requestId: string | null) => void;
  onRenameSession: (sessionId: string, title: string) => Promise<void> | void;
  onDeleteSession: (sessionId: string) => Promise<void> | void;
  onRenameRecipe: (recipeId: string, title: string) => Promise<void> | void;
  onDeleteRecipe: (recipeId: string) => Promise<void> | void;
  onRefreshRecipe: (recipe: Recipe) => Promise<void> | void;
  onExecuteRecipeAction: (
    recipe: Recipe,
    actionId: string,
    input: {
      selectedItemIds?: string[];
      pageState?: Record<string, number>;
      filterState?: Record<string, string>;
      formValues?: Record<string, string | number | boolean | null>;
    }
  ) => Promise<void> | void;
  onUpdateRecipe: (
    recipeId: string,
    partial: Omit<UpdateRecipeRequest, 'profileId'>,
    options?: {
      toastTitle?: string;
      toastDescription?: string;
      quiet?: boolean;
    }
  ) => Promise<Recipe> | void;
  onApplyRecipeEntryAction: (
    recipeId: string,
    action: 'remove' | 'delete_source',
    entryIds: string[],
    options?: {
      quiet?: boolean;
      toastTitle?: string;
      toastDescription?: string;
    }
  ) => Promise<void> | void;
  onSwitchTemplate?: (recipe: Recipe, targetTemplateId: string, intentLabel: string) => Promise<void> | void;
  activeModelLabel?: string | null;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [spaceRenameOpen, setRecipeRenameOpen] = useState(false);
  const [spaceDeleteOpen, setRecipeDeleteOpen] = useState(false);
  const [spaceChatCollapsed, setRecipeChatCollapsed] = useState(false);
  const [spaceStatus, setSpaceStatus] = useState<'idle' | 'building' | 'updated'>('idle');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [recipePanelAnimKey, setRecipePanelAnimKey] = useState(0);
  const [runtimePanelOpen, setRuntimePanelOpen] = useState(false);
  const [mobileSpaceDrawerOpen, setMobileSpaceDrawerOpen] = useState(false);
  const prevRecipeIdRef = useRef<string | null>(null);
  const runtimeButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeSession = sessionPayload?.session ?? null;
  const attachedRecipe = sessionPayload?.attachedRecipe ?? null;

  // Derive the kind of the most recent in-progress activity to drive the chat bubble icon.
  const typingActivityKind = sending ? (() => {
    for (let i = activities.length - 1; i >= 0; i--) {
      const a = activities[i];
      if (a && (a.state === 'started' || a.state === 'updated')) return a.kind;
    }
    return null;
  })() : null;

  // Bump the animation key every time a NEW recipe attaches so the panel re-runs its entry animation.
  useEffect(() => {
    const newId = attachedRecipe?.id ?? null;
    if (newId && newId !== prevRecipeIdRef.current) {
      setRecipePanelAnimKey((k) => k + 1);
    }
    prevRecipeIdRef.current = newId;
  }, [attachedRecipe?.id]);
  const handleStandaloneTranscriptMessageClick = useCallback(
    (message: ChatMessage) => {
      onFocusActivityRequest(message.requestId);
    },
    [onFocusActivityRequest]
  );
  const handleAttachedTranscriptMessageClick = useCallback(
    (message: ChatMessage) => {
      onOpenRuntimeRequest(message.requestId);
    },
    [onOpenRuntimeRequest]
  );

  useEffect(() => {
    setRecipeChatCollapsed(false);
    setSpaceStatus('idle');
  }, [activeSession?.id, attachedRecipe?.id]);

  useEffect(() => {
    if (!attachedRecipe) return;
    if (sending) {
      setSpaceStatus('building');
    } else {
      setSpaceStatus(prev => prev === 'building' ? 'updated' : prev);
    }
  }, [sending, attachedRecipe]);

  useEffect(() => {
    if (sending) setRuntimePanelOpen(true);
  }, [sending]);

  async function handleRename(title: string) {
    if (!activeSession) {
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await onRenameSession(activeSession.id, title);
      setRenameOpen(false);
    } catch (renameError) {
      setActionError(renameError instanceof Error ? renameError.message : 'Failed to rename the session.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!activeSession) {
      return;
    }

    flushSync(() => {
      setDeleteOpen(false);
      setActionError(null);
    });
    setActionLoading(true);

    try {
      await onDeleteSession(activeSession.id);
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : 'Failed to delete the session.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRenameAttachedSpace(title: string) {
    if (!attachedRecipe) {
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await onRenameRecipe(attachedRecipe.id, title);
      setRecipeRenameOpen(false);
    } catch (renameError) {
      setActionError(renameError instanceof Error ? renameError.message : 'Failed to rename the attached recipe.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteAttachedSpace() {
    if (!attachedRecipe) {
      return;
    }

    flushSync(() => {
      setRecipeDeleteOpen(false);
      setActionError(null);
    });
    setActionLoading(true);

    try {
      await onDeleteRecipe(attachedRecipe.id);
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : 'Failed to delete the attached recipe.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Flex direction="column" h="100%" minH={0}>
      {/* Session subtitle + actions — minimal, inline, no box */}
      {!attachedRecipe ? (
        <HStack px={{ base: '4', lg: '6' }} pt="2" pb="1" justify="space-between" align="center" flexShrink={0} gap="3">
          <HStack gap="2" minW={0} overflow="hidden">
            <Text fontSize="xs" color="var(--text-muted)" minW={0} lineClamp={1} opacity={0.7}>
              {activeSession?.summary ?? 'Choose a recent session or start a new one.'}
            </Text>
            {activeModelLabel ? (
              <Text fontSize="10px" color="var(--text-muted)" flexShrink={0} opacity={0.6}
                bg="var(--surface-2)" border="1px solid var(--border-subtle)" rounded="4px" px="1.5" py="0" lineHeight="1.7">
                {activeModelLabel.split('/').pop()}
              </Text>
            ) : null}
          </HStack>
          <HStack gap="1" flexShrink={0}>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              rounded="7px"
              px="2"
              h="6"
              color={runtimePanelOpen ? 'var(--accent)' : 'var(--text-muted)'}
              bg={runtimePanelOpen ? 'var(--accent-soft)' : 'transparent'}
              _hover={{ bg: runtimePanelOpen ? 'var(--accent-soft)' : 'var(--surface-hover)', color: 'var(--text-primary)' }}
              fontSize="xs"
              fontWeight="450"
              onClick={() => setRuntimePanelOpen((v) => !v)}
              aria-label="Toggle runtime activity panel"
            >
              Activity
            </Button>
            {activeSession ? (
              <SessionActionMenu
                label={`Chat actions for ${activeSession.title}`}
                onRename={() => { setActionError(null); setRenameOpen(true); }}
                onDelete={() => { setActionError(null); setDeleteOpen(true); }}
              />
            ) : null}
          </HStack>
        </HStack>
      ) : null}

      {/* Inline errors — compact, no full-width banners */}
      {error ? (
        <Box px={{ base: '4', lg: '6' }} flexShrink={0}>
          <ErrorBanner title="Session load failed" detail={error} />
        </Box>
      ) : null}
      {chatError ? (
        <Box px={{ base: '4', lg: '6' }} flexShrink={0}>
          <ErrorBanner title="Hermes request failed" detail={chatError} />
        </Box>
      ) : null}
      {actionError ? (
        <Box px={{ base: '4', lg: '6' }} flexShrink={0}>
          <ErrorBanner title="Session update failed" detail={actionError} />
        </Box>
      ) : null}

      {attachedRecipe ? (
        <>
          <style>{`
            @keyframes recipePanelEnter {
              0%   { opacity: 0; transform: translateX(28px) scale(0.97); }
              60%  { opacity: 1; }
              100% { opacity: 1; transform: translateX(0) scale(1); }
            }
            @keyframes chatPaneCompress {
              from { opacity: 0.7; }
              to   { opacity: 1; }
            }
          `}</style>
          <Grid
            flex="1"
            minH={0}
            gap="3"
            templateColumns={
              spaceChatCollapsed
                ? { base: '1fr', xl: 'minmax(0, 1fr) 92px' }
                : { base: '1fr', xl: 'minmax(0, 1fr) 420px' }
            }
            templateRows={
              spaceChatCollapsed
                ? { base: '1fr', xl: '1fr' }
                : { base: 'minmax(0, 1fr) auto', xl: '1fr' }
            }
            css={{ transition: 'grid-template-columns 480ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            data-testid="combined-session-recipe-layout"
          >
            <Box
              minH={0}
              minW={0}
              overflow="hidden"
              key={recipePanelAnimKey}
              style={{
                animation: 'recipePanelEnter 480ms cubic-bezier(0.4, 0, 0.2, 1) both'
              }}
            >
              <SessionRecipePanel
                recipe={attachedRecipe}
                onRename={() => {
                  setActionError(null);
                  setRecipeRenameOpen(true);
                }}
                onDelete={() => {
                  setActionError(null);
                  setRecipeDeleteOpen(true);
                }}
                onRefresh={onRefreshRecipe}
                onExecuteAction={onExecuteRecipeAction}
                onUpdateRecipe={onUpdateRecipe}
                onApplyRecipeEntryAction={onApplyRecipeEntryAction}
                onSwitchTemplate={onSwitchTemplate}
              />
            </Box>

            {spaceChatCollapsed ? (
              <Flex
                direction="column"
                minH={0}
                rounded="8px"
                border="1px solid var(--border-subtle)"
                bg="var(--surface-elevated)"
                boxShadow="var(--shadow-sm)"
                px="2"
                py="3"
                align="center"
                gap="3"
                data-testid="collapsed-session-recipe-chat-rail"
              >
                <Button
                  size="xs"
                  variant="outline"
                  w="100%"
                  minW={0}
                  aria-label="Expand chat pane"
                  title="Expand chat pane"
                  onClick={() => setRecipeChatCollapsed(false)}
                >
                  Chat
                </Button>
                <Button
                  ref={runtimeButtonRef}
                  size="xs"
                  variant="subtle"
                  w="100%"
                  minW={0}
                  aria-label="Open runtime activity"
                  title="Open runtime activity"
                  onClick={() => onRuntimeDrawerOpenChange(true)}
                >
                  <ActivityIcon />
                </Button>
                <Box flex="1" minH={0} display="flex" alignItems="center" justifyContent="center">
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="var(--text-muted)"
                    textTransform="uppercase"
                    letterSpacing="0"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    Session
                  </Text>
                </Box>
              </Flex>
            ) : (
              <Flex direction="column" minH={0} gap="3">
                <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-elevated)" px="4" py="3.5" boxShadow="var(--shadow-xs)">
                  <HStack justify="space-between" align="start" gap="3">
                    <Box minW={0}>
                      <Text fontSize="xs" fontWeight="700" color="var(--text-muted)" letterSpacing="0">
                        Session chat
                      </Text>
                      <HStack gap="1.5" align="center" mt="0.5" minW={0}>
                        <Box color="var(--text-muted)" flexShrink={0}>
                          <SpaceIcon />
                        </Box>
                        <Text fontSize="sm" fontWeight="700" color="var(--text-primary)" lineClamp={2} minW={0}>
                          {attachedRecipe?.title ?? activeSession?.title ?? 'Attached chat'}
                        </Text>
                      </HStack>
                    </Box>
                    <HStack gap="1.5" flexShrink={0}>
                      <Button
                        size="xs"
                        variant="outline"
                        aria-label="View space"
                        title="View space"
                        display={{ base: 'flex', xl: 'none' }}
                        gap="1"
                        color={spaceStatus === 'updated' ? 'var(--status-success)' : undefined}
                        borderColor={spaceStatus === 'updated' ? 'var(--status-success)' : undefined}
                        style={spaceStatus === 'updated' ? { animation: 'spaceUpdatedPulse 1.4s ease-in-out infinite' } : undefined}
                        onClick={() => {
                          setMobileSpaceDrawerOpen(true);
                          setSpaceStatus('idle');
                        }}
                      >
                        {spaceStatus === 'building' ? <SpinnerIcon /> : <SpaceIcon />}
                        Space
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        aria-label="Collapse to space view"
                        title="Collapse to space view"
                        display={{ base: 'none', xl: 'flex' }}
                        gap="1"
                        color={spaceStatus === 'updated' ? 'var(--status-success)' : undefined}
                        borderColor={spaceStatus === 'updated' ? 'var(--status-success)' : undefined}
                        style={spaceStatus === 'updated' ? { animation: 'spaceUpdatedPulse 1.4s ease-in-out infinite' } : undefined}
                        onClick={() => {
                          setRecipeChatCollapsed(true);
                          setSpaceStatus('idle');
                        }}
                      >
                        {spaceStatus === 'building' ? <SpinnerIcon /> : <SpaceIcon />}
                        Space
                      </Button>
                      <Button
                        ref={runtimeButtonRef}
                        size="xs"
                        variant="outline"
                        gap="1"
                        onClick={() => onRuntimeDrawerOpenChange(true)}
                      >
                        <ActivityIcon />
                        Activity
                      </Button>
                      {activeSession ? (
                        <SessionActionMenu
                          label={`Chat actions for ${activeSession.title}`}
                          onRename={() => {
                            setActionError(null);
                            setRenameOpen(true);
                          }}
                          onDelete={() => {
                            setActionError(null);
                            setDeleteOpen(true);
                          }}
                        />
                      ) : null}
                    </HStack>
                  </HStack>
                </Box>

                <Box
                  flex="1"
                  minH={0}
                  rounded="8px"
                  border="1px solid var(--border-subtle)"
                  bg="var(--surface-1)"
                  boxShadow="var(--shadow-sm)"
                  px={{ base: '3', xl: '4' }}
                  py={{ base: '3', xl: '4' }}
                  data-testid="session-recipe-chat-pane"
                >
                  <ChatTranscript
                    loading={loading}
                    messages={sessionPayload?.messages ?? []}
                    assistantDraft={assistantDraft}
                    showTypingIndicator={typing}
                    typingStatusLabel={progress}
                    typingActivityKind={typingActivityKind}
                    selectedRequestId={selectedActivityRequestId}
                    onMessageClick={handleAttachedTranscriptMessageClick}
                    emptyTitle="No messages yet"
                    emptyDetail="Start chatting in this attached space session."
                  />
                </Box>

                <ChatComposer onSend={onSend} sending={sending} disabled={loading} />
              </Flex>
            )}
          </Grid>

          <Drawer.Root
            lazyMount
            unmountOnExit
            open={runtimeDrawerOpen}
            onOpenChange={(event) => onRuntimeDrawerOpenChange(event.open)}
            size={{ base: 'full', md: 'lg', xl: 'xl' }}
            finalFocusEl={() => (runtimeButtonRef.current && runtimeButtonRef.current.isConnected ? runtimeButtonRef.current : document.body)}
          >
            <Portal>
              <Drawer.Backdrop backdropFilter="auto" backdropBlur="sm" bg="blackAlpha.500" />
              <Drawer.Positioner>
                <Drawer.Content
                  bg="var(--surface-elevated)"
                  borderLeft="1px solid var(--border-subtle)"
                  overflow="hidden"
                  data-testid="recipe-runtime-drawer"
                >
                  <Drawer.Header>
                    <HStack justify="space-between" align="center" gap="3" minW={0}>
                      <Drawer.Title color="var(--text-primary)">Runtime activity</Drawer.Title>
                      <Drawer.CloseTrigger asChild>
                        <CloseButton size="sm" aria-label="Close runtime drawer" title="Close runtime drawer" />
                      </Drawer.CloseTrigger>
                    </HStack>
                  </Drawer.Header>
                  <Drawer.Body overflowX="hidden" minW={0}>
                    <ChatActivityFeed
                      activities={activities}
                      sending={sending}
                      progress={progress}
                      requestPreview={selectedActivityPreview}
                      requestStatus={selectedActivityStatus}
                    />
                  </Drawer.Body>
                </Drawer.Content>
              </Drawer.Positioner>
            </Portal>
          </Drawer.Root>

          {/* Mobile space drawer — full-screen recipe view on small viewports */}
          <Drawer.Root
            lazyMount
            unmountOnExit
            open={mobileSpaceDrawerOpen}
            onOpenChange={(e) => setMobileSpaceDrawerOpen(e.open)}
            size="full"
            placement="bottom"
          >
            <Portal>
              <Drawer.Backdrop backdropFilter="auto" backdropBlur="sm" bg="blackAlpha.500" />
              <Drawer.Positioner display={{ base: 'block', xl: 'none' }}>
                <Drawer.Content
                  bg="var(--surface-elevated)"
                  borderTop="1px solid var(--border-subtle)"
                  rounded={{ base: '16px 16px 0 0' }}
                  maxH="92dvh"
                  overflow="hidden"
                >
                  <Drawer.Header px="4" pt="4" pb="3" borderBottom="1px solid var(--border-subtle)">
                    <HStack justify="space-between" align="center" gap="3" minW={0}>
                      <HStack gap="2" minW={0}>
                        <SpaceIcon />
                        <Drawer.Title color="var(--text-primary)" fontSize="sm" truncate>
                          {attachedRecipe?.title ?? 'Space'}
                        </Drawer.Title>
                      </HStack>
                      <Drawer.CloseTrigger asChild>
                        <CloseButton size="sm" />
                      </Drawer.CloseTrigger>
                    </HStack>
                  </Drawer.Header>
                  <Drawer.Body p="0" overflow="hidden" display="flex" flexDirection="column">
                    {attachedRecipe ? (
                      <SessionRecipePanel
                        recipe={attachedRecipe}
                        onRename={() => {
                          setMobileSpaceDrawerOpen(false);
                          setActionError(null);
                          setRecipeRenameOpen(true);
                        }}
                        onDelete={() => {
                          setMobileSpaceDrawerOpen(false);
                          setActionError(null);
                          setRecipeDeleteOpen(true);
                        }}
                        onRefresh={onRefreshRecipe}
                        onExecuteAction={onExecuteRecipeAction}
                        onUpdateRecipe={onUpdateRecipe}
                        onApplyRecipeEntryAction={onApplyRecipeEntryAction}
                        onSwitchTemplate={onSwitchTemplate}
                      />
                    ) : null}
                  </Drawer.Body>
                </Drawer.Content>
              </Drawer.Positioner>
            </Portal>
          </Drawer.Root>
        </>
      ) : (
        <>
          {/* Desktop: side-by-side grid with activity panel */}
          <Grid
            flex="1"
            minH={0}
            templateColumns={runtimePanelOpen ? { base: '1fr', xl: 'minmax(0, 1fr) 340px' } : '1fr'}
            css={{ transition: 'grid-template-columns 280ms cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {/* Primary thread column */}
            <Flex direction="column" minH={0}>
              {/* Scrollable messages — takes all remaining space */}
              <Box flex="1" minH={0} overflow="hidden">
                <ChatTranscript
                  loading={loading}
                  messages={sessionPayload?.messages ?? []}
                  assistantDraft={assistantDraft}
                  showTypingIndicator={typing}
                  typingStatusLabel={progress}
                  typingActivityKind={typingActivityKind}
                  selectedRequestId={selectedActivityRequestId}
                  onMessageClick={handleStandaloneTranscriptMessageClick}
                  emptyTitle="No messages yet"
                  emptyDetail="Start a real Hermes session with the composer below."
                />
              </Box>

              {/* Composer — anchored at bottom, centered, open canvas */}
              <Box
                flexShrink={0}
                px={{ base: '3', md: '4', lg: '6' }}
                pt="3"
                pb={{ base: '4', lg: '5' }}
                maxW={runtimePanelOpen ? undefined : '800px'}
                mx={runtimePanelOpen ? undefined : 'auto'}
                w="100%"
              >
                <ChatComposer onSend={onSend} sending={sending} disabled={loading} />
              </Box>
            </Flex>

            {/* Desktop runtime activity panel — hidden by default, slides in on xl+ */}
            <Box
              minH={0}
              overflow="hidden"
              display={{ base: 'none', xl: 'block' }}
              borderLeft={runtimePanelOpen ? '1px solid var(--border-subtle)' : 'none'}
              style={{
                opacity: runtimePanelOpen ? 1 : 0,
                pointerEvents: runtimePanelOpen ? 'auto' : 'none',
                transition: 'opacity 220ms ease',
              }}
            >
              <ChatActivityFeed
                activities={activities}
                sending={sending}
                progress={progress}
                requestPreview={selectedActivityPreview}
                requestStatus={selectedActivityStatus}
              />
            </Box>
          </Grid>

          {/* Mobile runtime activity drawer */}
          <Drawer.Root
            lazyMount
            unmountOnExit
            open={runtimePanelOpen}
            onOpenChange={(event) => setRuntimePanelOpen(event.open)}
            size={{ base: 'full', sm: 'md' }}
            placement="bottom"
          >
            <Portal>
              <Drawer.Backdrop backdropFilter="auto" backdropBlur="sm" bg="blackAlpha.500" />
              <Drawer.Positioner display={{ base: 'block', xl: 'none' }}>
                <Drawer.Content
                  bg="var(--surface-elevated)"
                  borderTop="1px solid var(--border-subtle)"
                  maxH="75dvh"
                  rounded={{ base: '16px 16px 0 0', sm: '12px' }}
                >
                  <Drawer.Header>
                    <HStack justify="space-between" align="center" gap="3" minW={0}>
                      <Drawer.Title color="var(--text-primary)">Runtime activity</Drawer.Title>
                      <Drawer.CloseTrigger asChild>
                        <CloseButton size="sm" aria-label="Close activity panel" />
                      </Drawer.CloseTrigger>
                    </HStack>
                  </Drawer.Header>
                  <Drawer.Body overflowX="hidden" minW={0}>
                    <ChatActivityFeed
                      activities={activities}
                      sending={sending}
                      progress={progress}
                      requestPreview={selectedActivityPreview}
                      requestStatus={selectedActivityStatus}
                    />
                  </Drawer.Body>
                </Drawer.Content>
              </Drawer.Positioner>
            </Portal>
          </Drawer.Root>
        </>
      )}

      {activeSession ? (
        <>
          <SessionRenameDialog
            open={renameOpen}
            loading={actionLoading}
            sessionTitle={activeSession.title}
            onOpenChange={(open) => {
              setRenameOpen(open);
              if (!open) {
                setActionError(null);
              }
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
              if (!open) {
                setActionError(null);
              }
            }}
            onConfirm={handleDelete}
          />
        </>
      ) : null}

      {attachedRecipe ? (
        <>
          <SessionRenameDialog
            open={spaceRenameOpen}
            loading={actionLoading}
            sessionTitle={attachedRecipe.title}
            dialogTitle="Rename recipe"
            description="Update the attached recipe title used in this combined recipe."
            fieldLabel="Recipe title"
            placeholder="Give this recipe a clear title"
            saveLabel="Save recipe"
            onOpenChange={(open) => {
              setRecipeRenameOpen(open);
              if (!open) {
                setActionError(null);
              }
            }}
            onSave={handleRenameAttachedSpace}
          />
          <ConfirmDialog
            open={spaceDeleteOpen}
            loading={actionLoading}
            title="Delete attached recipe"
            description="Delete the attached structured recipe and keep the chat session intact."
            confirmLabel="Delete recipe"
            onOpenChange={(open) => {
              setRecipeDeleteOpen(open);
              if (!open) {
                setActionError(null);
              }
            }}
            onConfirm={handleDeleteAttachedSpace}
          />
        </>
      ) : null}
    </Flex>
  );
}
