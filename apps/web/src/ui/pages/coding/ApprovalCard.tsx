import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Button, HStack, Text, Textarea, VStack } from '@chakra-ui/react';
import type { ApprovalIntent, ApprovalCategory } from './detectApprovalIntent';

export type { ApprovalIntent };

interface ApprovalCardProps {
  intent: ApprovalIntent;
  mode: 'turn' | 'stdin';
  onApprove: () => void;
  onDeny: () => void;
  onCustomReply: (text: string) => void;
  resolving?: boolean;
}

function categoryColor(category: ApprovalCategory): string {
  switch (category) {
    case 'destructive': return 'var(--status-danger)';
    case 'modification': return 'var(--status-warning)';
    case 'install': return 'var(--status-warning)';
    case 'network': return 'var(--accent)';
    case 'generic': return 'var(--border-default)';
  }
}

function categoryBg(category: ApprovalCategory): string {
  switch (category) {
    case 'destructive': return 'var(--surface-danger)';
    case 'modification': return 'var(--surface-warning)';
    case 'install': return 'var(--surface-warning)';
    case 'network': return 'rgba(var(--accent-rgb, 99,102,241), 0.08)';
    case 'generic': return 'var(--surface-2)';
  }
}

const HOLD_DURATION_MS = 200;

export function ApprovalCard({ intent, onApprove, onDeny, onCustomReply, resolving }: ApprovalCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [holdProgress, setHoldProgress] = useState(0); // 0–1
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef<number>(0);

  // Auto-focus card on mount
  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't interfere with textarea
      if (e.target instanceof HTMLTextAreaElement) return;
      if (resolving) return;

      if (e.key === 'y' || e.key === 'Enter') {
        if (intent.category === 'destructive') return; // destructive requires hold
        onApprove();
      } else if (e.key === 'n' || e.key === 'Escape') {
        onDeny();
      } else if (e.key === 'r') {
        setCustomOpen(v => !v);
      }
    }
    const el = cardRef.current;
    if (el) {
      el.addEventListener('keydown', onKey);
      return () => el.removeEventListener('keydown', onKey);
    }
  }, [intent.category, onApprove, onDeny, resolving]);

  const startHold = useCallback(() => {
    if (resolving) return;
    holdStartRef.current = Date.now();
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      setHoldProgress(Math.min(elapsed / HOLD_DURATION_MS, 1));
    }, 16);
    holdTimerRef.current = setTimeout(() => {
      clearInterval(holdIntervalRef.current!);
      setHoldProgress(1);
      onApprove();
    }, HOLD_DURATION_MS);
  }, [onApprove, resolving]);

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setHoldProgress(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  const borderColor = categoryColor(intent.category);
  const bg = categoryBg(intent.category);

  const ApproveButton = (
    <Box position="relative" overflow="hidden" display="inline-flex" rounded="var(--radius-control)">
      {intent.category === 'destructive' && (
        <Box
          position="absolute"
          top={0} left={0} bottom={0}
          bg="var(--status-danger)"
          opacity={0.35}
          style={{ width: `${holdProgress * 100}%`, transition: holdProgress === 0 ? 'width 0.1s ease' : 'none' }}
          pointerEvents="none"
          rounded="var(--radius-control)"
        />
      )}
      <Button
        size="xs" h="7" px="3"
        bg={intent.category === 'destructive' ? 'transparent' : 'var(--accent)'}
        color={intent.category === 'destructive' ? 'var(--status-danger)' : 'var(--accent-contrast)'}
        border={intent.category === 'destructive' ? '1px solid var(--status-danger)' : 'none'}
        _hover={{ opacity: 0.9 }}
        rounded="var(--radius-control)"
        loading={resolving}
        disabled={resolving}
        onMouseDown={intent.category === 'destructive' ? startHold : undefined}
        onMouseUp={intent.category === 'destructive' ? cancelHold : undefined}
        onMouseLeave={intent.category === 'destructive' ? cancelHold : undefined}
        onClick={intent.category !== 'destructive' ? onApprove : undefined}
        title={intent.category === 'destructive' ? 'Hold to confirm' : undefined}
      >
        {intent.affirmativeText}
        {intent.category === 'destructive' ? ' (hold)' : ''}
      </Button>
    </Box>
  );

  const DenyButton = (
    <Button
      size="xs" h="7" px="3"
      variant="outline"
      color="var(--text-secondary)"
      borderColor="var(--border-default)"
      _hover={{ bg: 'var(--surface-hover)' }}
      rounded="var(--radius-control)"
      loading={resolving}
      disabled={resolving}
      onClick={onDeny}
    >
      {intent.negativeText}
    </Button>
  );

  return (
    <Box
      ref={cardRef}
      tabIndex={0}
      outline="none"
      p="3"
      rounded="var(--radius-card)"
      border={`1px solid ${borderColor}`}
      bg={bg}
      mt="2"
      _focusVisible={{ boxShadow: `0 0 0 2px ${borderColor}40` }}
    >
      {/* Header with category badge */}
      <HStack justify="space-between" mb="2" align="flex-start">
        <Text fontSize="11px" fontWeight="700" color={borderColor} textTransform="uppercase" letterSpacing="0.06em">
          Agent is asking
        </Text>
        <Text
          fontSize="10px" fontWeight="600" textTransform="uppercase" letterSpacing="0.06em"
          color={borderColor}
          bg={`${borderColor}22`}
          rounded="var(--radius-pill)"
          px="2" py="0.5"
          flexShrink={0}
        >
          {intent.category}
        </Text>
      </HStack>

      {/* Question in quoted block */}
      <Box
        mb="3"
        pl="3"
        borderLeft={`3px solid ${borderColor}66`}
      >
        <Text
          fontSize="13px"
          color="var(--text-secondary)"
          fontStyle="italic"
          whiteSpace="pre-wrap"
          wordBreak="break-word"
        >
          {intent.question}
        </Text>
      </Box>

      {/* Action buttons — destructive: deny first, then approve; others: approve first */}
      <HStack gap="2" flexWrap="wrap">
        {intent.category === 'destructive'
          ? <>{DenyButton}{ApproveButton}</>
          : <>{ApproveButton}{DenyButton}</>
        }
        <Button
          size="xs" h="7" px="2"
          variant="ghost"
          color="var(--text-muted)"
          _hover={{ color: 'var(--text-primary)', bg: 'var(--surface-hover)' }}
          rounded="var(--radius-control)"
          disabled={resolving}
          onClick={() => setCustomOpen(v => !v)}
        >
          {customOpen ? 'Cancel' : 'Reply differently'}
        </Button>
      </HStack>

      {/* Custom reply expander */}
      {customOpen && (
        <VStack mt="3" align="stretch" gap="2">
          <Textarea
            placeholder="Type a custom reply…"
            value={customText}
            onChange={e => setCustomText(e.currentTarget.value)}
            rows={2}
            fontSize="13px"
            bg="var(--surface-3)"
            border="1px solid var(--border-subtle)"
            rounded="var(--radius-control)"
            resize="none"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && customText.trim()) {
                e.preventDefault();
                onCustomReply(customText.trim());
              }
              if (e.key === 'Escape') setCustomOpen(false);
            }}
          />
          <HStack justify="flex-end">
            <Button
              size="xs" h="7" px="3"
              bg="var(--accent)"
              color="var(--accent-contrast)"
              _hover={{ bg: 'var(--accent-strong)' }}
              rounded="var(--radius-control)"
              disabled={!customText.trim() || resolving}
              onClick={() => { if (customText.trim()) onCustomReply(customText.trim()); }}
            >
              Send
            </Button>
          </HStack>
        </VStack>
      )}
    </Box>
  );
}
