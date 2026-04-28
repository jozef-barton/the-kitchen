import { useState } from 'react';
import { Box, Button, HStack, Spinner, Text, Textarea, VStack } from '@chakra-ui/react';
import { ApprovalCard } from './ApprovalCard';
import { detectApprovalIntent } from './detectApprovalIntent';

interface JobComposerProps {
  jobStatus: string;
  lastAssistantMessage?: string;
  currentActivity?: string;
  onSendTurn: (text: string) => Promise<void>;
  onEndSession: () => Promise<void>;
  onResumeSession: () => Promise<void>;
}

export function JobComposer({
  jobStatus,
  lastAssistantMessage,
  currentActivity,
  onSendTurn,
  onEndSession,
  onResumeSession,
}: JobComposerProps) {
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalResolving, setApprovalResolving] = useState(false);

  async function handleSend() {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSendTurn(replyText.trim());
      setReplyText('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEnd() {
    setSubmitting(true);
    setError(null);
    try {
      await onEndSession();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResume() {
    setSubmitting(true);
    setError(null);
    try {
      await onResumeSession();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Agent is working
  if (jobStatus === 'queued' || jobStatus === 'running') {
    return (
      <Box
        px="4" py="3"
        borderTop="1px solid var(--divider)"
        flexShrink={0}
        bg="var(--surface-1)"
      >
        <HStack gap="2" opacity={0.6}>
          <Spinner size="xs" color="var(--text-muted)" />
          <Text fontSize="13px" color="var(--text-muted)">{currentActivity ?? 'Working…'}</Text>
        </HStack>
      </Box>
    );
  }

  // Interrupted — offer resume
  if (jobStatus === 'interrupted') {
    return (
      <Box
        px="4" py="3"
        borderTop="1px solid var(--divider)"
        flexShrink={0}
        bg="var(--surface-1)"
      >
        <VStack align="stretch" gap="2">
          <Text fontSize="12px" color="var(--status-warning)">
            Process exited unexpectedly. Session context is preserved.
          </Text>
          {error && <Text fontSize="12px" color="var(--status-danger)">{error}</Text>}
          <Button
            size="sm" h="8" px="3"
            bg="var(--accent)"
            color="var(--accent-contrast)"
            _hover={{ bg: 'var(--accent-strong)' }}
            rounded="var(--radius-control)"
            loading={submitting}
            onClick={() => void handleResume()}
          >
            ↻ Resume session
          </Button>
        </VStack>
      </Box>
    );
  }

  // Terminal states
  if (jobStatus === 'completed' || jobStatus === 'failed' || jobStatus === 'cancelled') {
    return (
      <Box
        px="4" py="3"
        borderTop="1px solid var(--divider)"
        flexShrink={0}
        bg="var(--surface-1)"
      >
        <Text fontSize="12px" color="var(--text-muted)">
          Session ended.
        </Text>
      </Box>
    );
  }

  // Awaiting approval — handled by the existing pendingApproval prop in the parent
  if (jobStatus === 'awaiting_approval') {
    return null;
  }

  // Awaiting user — check for approval intent in last message
  if (jobStatus === 'awaiting_user') {
    const intent = lastAssistantMessage
      ? detectApprovalIntent(lastAssistantMessage)
      : null;

    // Only show the approval card for genuinely destructive actions (rm -rf, deletes, etc.)
    // For ordinary yes/no questions the user just types a reply
    if (intent?.isApprovalRequest && intent.category === 'destructive') {
      return (
        <Box
          px="4" py="3"
          borderTop="1px solid var(--divider)"
          flexShrink={0}
          bg="var(--surface-1)"
        >
          {error && <Text fontSize="12px" color="var(--status-danger)" mb="2">{error}</Text>}
          <ApprovalCard
            intent={intent}
            mode="turn"
            resolving={approvalResolving}
            onApprove={async () => {
              setApprovalResolving(true);
              setError(null);
              try {
                await onSendTurn(intent.affirmativeText);
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setApprovalResolving(false);
              }
            }}
            onDeny={async () => {
              setApprovalResolving(true);
              setError(null);
              try {
                await onSendTurn(intent.negativeText);
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setApprovalResolving(false);
              }
            }}
            onCustomReply={async (text) => {
              setApprovalResolving(true);
              setError(null);
              try {
                await onSendTurn(text);
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setApprovalResolving(false);
              }
            }}
          />
        </Box>
      );
    }

    // Normal text reply
    return (
      <Box
        px="4" py="3"
        borderTop="1px solid var(--divider)"
        flexShrink={0}
        bg="var(--surface-1)"
      >
        <VStack align="stretch" gap="2">
          <Textarea
            placeholder="Reply to this session…"
            value={replyText}
            onChange={e => setReplyText(e.currentTarget.value)}
            rows={2}
            bg="var(--surface-2)"
            border="1px solid var(--border-subtle)"
            rounded="var(--radius-control)"
            fontSize="13px"
            resize="none"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          {error && <Text fontSize="12px" color="var(--status-danger)">{error}</Text>}
          <HStack justify="space-between">
            <Button
              size="xs" h="7" px="3"
              variant="outline"
              color="var(--text-muted)"
              borderColor="var(--border-subtle)"
              _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
              rounded="var(--radius-control)"
              loading={submitting}
              onClick={() => void handleEnd()}
            >
              End session
            </Button>
            <HStack gap="2">
              <Text fontSize="11px" color="var(--text-muted)">Enter to send · Shift+Enter for newline</Text>
              <Button
                size="xs" h="7" px="3"
                bg="var(--accent)"
                color="var(--accent-contrast)"
                _hover={{ bg: 'var(--accent-strong)' }}
                rounded="var(--radius-control)"
                loading={submitting}
                disabled={!replyText.trim()}
                onClick={() => void handleSend()}
              >
                Send
              </Button>
            </HStack>
          </HStack>
        </VStack>
      </Box>
    );
  }

  // Paused or unknown status — show nothing
  return null;
}
