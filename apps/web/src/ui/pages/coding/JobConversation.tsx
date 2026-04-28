import React, { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Box, Button, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import type { JobEvent } from '../../../lib/coding-api';
import { buildConversationItems } from './buildConversationItems';
import { AgentInitRow } from './events/AgentInitRow';
import { ThinkingRow } from './events/ThinkingRow';
import { MessageRow } from './events/MessageRow';
import { ToolPairRow } from './events/ToolPairRow';
import { RawRow } from './events/RawRow';
import { UserTurnRow } from './events/UserTurnRow';
import { TurnSummary } from './events/TurnSummary';

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  events: JobEvent[];
  isActive: boolean;
  jobStatus?: string;
  compact?: boolean;
  pendingApproval: {
    approvalId: string;
    message: string;
    options: string[];
    defaultOption?: number;
    category: string;
    resolving: boolean;
  } | null;
  onApprove: (approvalId: string, response: string, remember: boolean) => Promise<void>;
  jobPrompts?: Map<string, string>;
  composerSlot?: React.ReactNode;
  onOpenFile?: (filePath: string) => void;
}

export const JobConversation = memo(function JobConversation({
  events, isActive, jobStatus, compact, pendingApproval, onApprove, jobPrompts, composerSlot, onOpenFile
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);
  const [newCount, setNewCount] = useState(0);
  const [awaitingWhileScrolledUp, setAwaitingWhileScrolledUp] = useState(false);
  const prevItemsLen = useRef(0);

  // Sort defensively — SSE events should arrive in order, but guard against ties
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.ts - b.ts),
    [events],
  );
  const items = buildConversationItems(sortedEvents, jobPrompts);

  // Track which card is currently animating so we can block items below it
  const [animatingToolUseId, setAnimatingToolUseId] = useState<string | null>(null);

  // The toolUseId of the most recent file-modifying tool call — gets the live typewriter treatment
  // Scans the full item list (not the visibility-sliced one) so we always find the true latest
  const latestFileToolId = useMemo(() => {
    if (jobStatus !== 'running') return null;
    const FILE_TOOLS = /^(write|edit|str_replace_editor|multiedit|multi_edit)$/i;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]!;
      if (item.kind === 'tool_pair') {
        const ev = item.call as unknown as { toolName: string; toolUseId: string };
        if (FILE_TOOLS.test(ev.toolName)) return ev.toolUseId;
      }
    }
    return null;
  }, [items, jobStatus]);

  // When a new live file tool appears, start blocking content below it
  useEffect(() => {
    if (latestFileToolId) setAnimatingToolUseId(latestFileToolId);
  }, [latestFileToolId]);

  // While a file-diff animation is running, hold back the end-of-turn status items
  // (summary card, "Completed" result, "awaiting reply" divider) until the animation
  // finishes. Messages and tool calls still appear immediately.
  const ANIMATION_BLOCKED = new Set(['turn_action_summary', 'result', 'turn_boundary']);
  const visibleItems = useMemo(() => {
    const all = items.slice(-500);
    if (!animatingToolUseId) return all;
    const blockAt = all.findIndex(item =>
      item.kind === 'tool_pair' &&
      (item.call as unknown as { toolUseId: string }).toolUseId === animatingToolUseId
    );
    if (blockAt < 0) return all;
    return all.filter((item, idx) => idx <= blockAt || !ANIMATION_BLOCKED.has(item.kind));
  }, [items, animatingToolUseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ID of the message currently being streamed (last message item when job is running)
  const streamingMessageId = useMemo(() => {
    if (jobStatus !== 'running') return null;
    for (let i = visibleItems.length - 1; i >= 0; i--) {
      const item = visibleItems[i]!;
      if (item.kind === 'message') return item.messageId;
      if (item.kind === 'tool_pair') break;
    }
    return null;
  }, [visibleItems, jobStatus]);

  // Auto-scroll: always scroll on user_turn; detect awaiting_user while scrolled up
  useEffect(() => {
    const lastEvent = events[events.length - 1];
    if (lastEvent?.type === 'job.user_turn') {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        setNewCount(0);
        setAwaitingWhileScrolledUp(false);
        autoScrollRef.current = true;
      }
      prevItemsLen.current = items.length;
      return;
    }

    if (autoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setNewCount(0);
    } else if (items.length > prevItemsLen.current) {
      setNewCount(c => c + (items.length - prevItemsLen.current));
    }
    prevItemsLen.current = items.length;
  }, [items.length, events]);

  // Detect awaiting_user while user is scrolled up
  useEffect(() => {
    if (jobStatus === 'awaiting_user' && !autoScrollRef.current) {
      setAwaitingWhileScrolledUp(true);
    } else if (jobStatus !== 'awaiting_user') {
      setAwaitingWhileScrolledUp(false);
    }
  }, [jobStatus]);

  const scrollToBottom = useCallback(() => {
    autoScrollRef.current = true;
    setNewCount(0);
    setAwaitingWhileScrolledUp(false);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  const gap = compact ? '1.5' : '3';

  return (
    <Box flex="1" minH={0} display="flex" flexDirection="column">
      <Box position="relative" flex="1" minH={0} display="flex" flexDirection="column">
        <Box
          ref={scrollRef}
          flex="1" minH={0} overflow="auto"
          px="4" py="3"
          onScroll={(e) => {
            const el = e.currentTarget;
            autoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
            if (autoScrollRef.current) { setNewCount(0); setAwaitingWhileScrolledUp(false); }
          }}
        >
          <VStack align="stretch" gap={gap}>
            {visibleItems.map((item, _i) => {
              if (item.kind === 'init') {
                // Only ever one init per conversation — ts is unique enough
                return <AgentInitRow key={`init:${item.event.ts}`} event={item.event as unknown as Extract<JobEvent, { type: 'job.agent_initialized' }>} />;
              }
              if (item.kind === 'continuation') {
                return (
                  <Box key={`cont:${item.ts}`} py="2">
                    <HStack gap="2" align="center">
                      <Box flex="1" h="1px" bg="var(--divider)" />
                      <Text fontSize="11px" color="var(--text-muted)" flexShrink={0}>
                        ↩ {item.prompt ? `"${item.prompt.length > 60 ? item.prompt.slice(0, 60) + '…' : item.prompt}"` : 'Follow-up'}
                      </Text>
                      <Box flex="1" h="1px" bg="var(--divider)" />
                    </HStack>
                  </Box>
                );
              }
              if (item.kind === 'user_turn') {
                return <UserTurnRow key={item.turnId} text={item.text} turnIndex={item.turnIndex} />;
              }
              if (item.kind === 'turn_boundary') {
                return (
                  <Box key={`boundary:${item.ts}`} py="2">
                    <HStack gap="2" align="center">
                      <Box flex="1" h="1px" bg="var(--divider)" />
                      <Text fontSize="11px" color="var(--text-muted)" flexShrink={0}>── awaiting your reply ──</Text>
                      <Box flex="1" h="1px" bg="var(--divider)" />
                    </HStack>
                  </Box>
                );
              }
              if (item.kind === 'turn_action_summary') {
                return (
                  <TurnSummary
                    key={`summary-${item.turnIndex}-${item.jobId}`}
                    jobId={item.jobId}
                    turnIndex={item.turnIndex}
                    durationMs={item.durationMs}
                    calls={item.calls}
                    lastMessageId={item.lastMessageId}
                  />
                );
              }
              if (item.kind === 'thinking') {
                return <ThinkingRow key={item.messageId} messageId={item.messageId} text={item.text} ts={item.ts} />;
              }
              if (item.kind === 'message') {
                return (
                  <MessageRow
                    key={item.messageId}
                    messageId={item.messageId}
                    jobId={item.jobId}
                    text={item.text}
                    isStreaming={item.messageId === streamingMessageId}
                  />
                );
              }
              if (item.kind === 'tool_pair') {
                const ev = item.call as unknown as { toolUseId: string };
                const isLatest = ev.toolUseId === latestFileToolId;
                return (
                  <ToolPairRow
                    key={item.call.toolUseId}
                    call={item.call as unknown as Extract<JobEvent, { type: 'job.tool_call' }>}
                    result={item.result as unknown as Extract<JobEvent, { type: 'job.tool_result' }> | undefined}
                    onOpenFile={onOpenFile}
                    jobIsLive={jobStatus === 'running'}
                    isLatestFileTool={isLatest}
                    onAnimationComplete={isLatest ? () => setAnimatingToolUseId(null) : undefined}
                  />
                );
              }
              if (item.kind === 'raw') {
                return <RawRow key={`raw:${item.isError ? 'e' : 'o'}:${item.ts}`} text={item.text} isError={item.isError} />;
              }
              if (item.kind === 'result') {
                const ev = item.event as unknown as { numTurns: number; durationMs: number };
                return (
                  <Box key={`result:${item.event.ts}`} px="2" py="1">
                    <Text fontSize="11px" color="var(--text-muted)">
                      Completed · {ev.numTurns} turns · {Math.round(ev.durationMs / 1000)}s
                    </Text>
                  </Box>
                );
              }
              return null;
            })}

            {/* Pending approval card */}
            {pendingApproval && (
              <Box mt="2" p="3" rounded="var(--radius-card)" border="1px solid var(--status-warning)" bg="var(--surface-warning)">
                <HStack gap="2" mb="2">
                  <Text fontSize="11px" fontWeight="700" color="var(--status-warning)" textTransform="uppercase">Approval needed</Text>
                  <Text fontSize="10px" color="var(--text-muted)" bg="var(--surface-2)" px="1.5" rounded="3px">{pendingApproval.category}</Text>
                </HStack>
                <Text fontSize="12px" color="var(--text-primary)" whiteSpace="pre-wrap" mb="3" fontFamily="ui-monospace, monospace">
                  {pendingApproval.message}
                </Text>
                <HStack gap="2" flexWrap="wrap">
                  {pendingApproval.options.map((opt, i) => (
                    <Button
                      key={i} size="xs" h="7" px="3"
                      bg={i === (pendingApproval.defaultOption ?? 0) ? 'var(--accent)' : 'transparent'}
                      color={i === (pendingApproval.defaultOption ?? 0) ? 'var(--accent-contrast)' : 'var(--text-secondary)'}
                      border="1px solid var(--border-default)"
                      _hover={{ bg: 'var(--surface-hover)' }}
                      rounded="var(--radius-control)"
                      loading={pendingApproval.resolving}
                      onClick={() => void onApprove(pendingApproval.approvalId, String(i), false)}
                    >
                      {opt}
                    </Button>
                  ))}
                  {pendingApproval.category !== 'unknown' && (
                    <Button
                      size="xs" h="7" px="3" variant="ghost"
                      color="var(--text-muted)"
                      _hover={{ color: 'var(--text-primary)', bg: 'var(--surface-hover)' }}
                      rounded="var(--radius-control)"
                      loading={pendingApproval.resolving}
                      onClick={() => void onApprove(pendingApproval.approvalId, String(pendingApproval.defaultOption ?? 0), true)}
                    >
                      Always approve {pendingApproval.category}s
                    </Button>
                  )}
                </HStack>
              </Box>
            )}

            {isActive && !pendingApproval && (
              <HStack gap="1.5" px="2">
                <Spinner size="xs" color="var(--text-muted)" />
                <Text fontSize="11px" color="var(--text-muted)">Running…</Text>
              </HStack>
            )}
          </VStack>
        </Box>

        {/* Scroll pill — priority: awaiting reply > new messages */}
        {(newCount > 0 || awaitingWhileScrolledUp) && (
          <Box position="absolute" bottom="60px" right="16px" zIndex={10}>
            <Button
              size="xs" h="6" px="3"
              bg={awaitingWhileScrolledUp ? 'var(--accent)' : 'var(--accent)'}
              color="var(--accent-contrast)"
              rounded="var(--radius-pill)"
              _hover={{ bg: 'var(--accent-strong)' }}
              onClick={scrollToBottom}
            >
              {awaitingWhileScrolledUp ? '↓ Awaiting your reply' : `↓ ${newCount} new`}
            </Button>
          </Box>
        )}
      </Box>

      {composerSlot}
    </Box>
  );
});
