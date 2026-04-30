import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Box, Button, Code, HStack, ScrollArea, Text, VStack, chakra } from '@chakra-ui/react';
import type { ChatActivity, ChatMessage } from '@hermes-recipes/protocol';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HermesAvatar } from '../atoms/HermesAvatar';
import { TypingDots } from '../atoms/TypingDots';
import { StatusTicker } from '../atoms/StatusTicker';
import { safeMarkdownUrlTransform } from '../../lib/markdown-url-transform';
import { getUploadUrl } from '../../lib/api';



export const ChatTranscript = memo(function ChatTranscript({
  messages,
  assistantDraft,
  loading,
  emptyTitle: _emptyTitle,
  emptyDetail: _emptyDetail,
  showTypingIndicator,
  typingStatusLabel,
  typingActivityKind,
  selectedRequestId,
  onMessageClick
}: {
  messages: ChatMessage[];
  assistantDraft: string;
  loading: boolean;
  emptyTitle: string;
  emptyDetail: string;
  showTypingIndicator: boolean;
  typingStatusLabel?: string | null;
  typingActivityKind?: ChatActivity['kind'] | null;
  selectedRequestId: string | null;
  onMessageClick?: (message: ChatMessage) => void;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const didInitialScrollRef = useRef(false);
  const prevLoadingRef = useRef(loading);
  const visibleMessages = useMemo(
    () => messages.filter((message) => message.visibility === 'transcript' && message.kind !== 'technical'),
    [messages]
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = loading;

    // Force scroll on first render and whenever a session finishes loading.
    // This covers both initial mount and switching between sessions.
    if (!didInitialScrollRef.current || (wasLoading && !loading)) {
      didInitialScrollRef.current = true;
      viewport.scrollTop = viewport.scrollHeight;
      return;
    }

    // During live streaming, only scroll if the user is already near the bottom.
    // This lets users scroll up to read history without being yanked back down.
    const distFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    if (distFromBottom < 150) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [assistantDraft, loading, showTypingIndicator, visibleMessages]);

  return (
    <ScrollArea.Root flex="1" minH={0} variant="hover" aria-label="Conversation transcript">
      <ScrollArea.Viewport ref={viewportRef} data-testid="chat-transcript-scroll">
        {/* aria-live="polite" announces new messages to screen readers without interrupting */}
        <Box maxW="740px" mx="auto" w="100%" aria-live="polite" aria-relevant="additions" aria-atomic="false">
        <VStack align="stretch" gap="6" px={{ base: '3', md: '5' }} pt="4" pb="3">
          {loading ? (
            <TranscriptBubble messageRole="system">
              <Text fontWeight="700">Loading session…</Text>
              <Text color="var(--text-secondary)">Reading the active Hermes transcript from local persistence and the CLI bridge.</Text>
            </TranscriptBubble>
          ) : visibleMessages.length === 0 && !showTypingIndicator ? (
            <div className="chat-empty">
              <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-secondary)', margin: '0 0 6px', lineHeight: 1.4 }}>
                Start a new session
              </p>
              <p className="chat-empty__copy" style={{ margin: '0 0 16px' }}>
                Choose a recent session or start a new one.
              </p>
              <div className="chat-empty__chips">
                <span className="chat-empty__chip">What should we cook?</span>
                <span className="chat-empty__chip">Show recent sessions</span>
                <span className="chat-empty__chip">Walk me through a recipe</span>
              </div>
            </div>
          ) : (
            <>
              {visibleMessages.map((message) => (
                <TranscriptMessageRow
                  key={message.id}
                  message={message}
                  selected={Boolean(message.requestId && message.requestId === selectedRequestId)}
                  onMessageClick={onMessageClick}
                />
              ))}
              {showTypingIndicator ? (
                <TranscriptTypingRow
                  assistantDraft={assistantDraft}
                  selected={selectedRequestId !== null}
                  typingStatusLabel={typingStatusLabel}
                  typingActivityKind={typingActivityKind}
                />
              ) : null}
            </>
          )}
        </VStack>
        </Box>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar />
    </ScrollArea.Root>
  );
});

const MarkdownMessage = memo(function MarkdownMessage({ children }: { children: string }) {
  return (
    <Box
      color="var(--text-primary)"
      overflowX="hidden"
      wordBreak="break-word"
      css={{
        '& h1, & h2, & h3': {
          fontWeight: 700,
          lineHeight: 1.15,
          marginTop: '0.9rem',
          marginBottom: '0.45rem'
        },
        '& h1': {
          fontSize: '1.35rem'
        },
        '& h2': {
          fontSize: '1.14rem'
        },
        '& h3': {
          fontSize: '0.98rem'
        },
        '& p': {
          fontSize: '0.8125rem',
          lineHeight: 1.65
        },
        '& p + p': {
          marginTop: '0.8rem'
        },
        '& ul, & ol': {
          display: 'block',
          marginTop: '0.75rem',
          marginBottom: '0.5rem'
        },
        '& ul': {
          listStyleType: 'disc',
          paddingInlineStart: '1.4rem'
        },
        '& ol': {
          listStyleType: 'decimal',
          paddingInlineStart: '1.5rem'
        },
        '& li': {
          display: 'list-item',
          lineHeight: 1.65,
          marginBottom: '0.3rem'
        },
        '& li::marker': {
          color: 'var(--text-muted)'
        },
        '& table': {
          width: '100%',
          marginTop: '0.85rem',
          borderCollapse: 'separate',
          borderSpacing: 0,
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xs)',
          display: 'block',
          overflowX: 'auto',
          maxWidth: '100%'
        },
        '& th, & td': {
          padding: '0.68rem 0.8rem',
          textAlign: 'left',
          verticalAlign: 'top',
          borderBottom: '1px solid var(--border-subtle)'
        },
        '& th': {
          background: 'var(--surface-2)',
          color: 'var(--text-muted)',
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0
        },
        '& tr:last-of-type td': {
          borderBottom: 'none'
        },
        '& pre': {
          overflowX: 'auto',
          padding: '0.85rem',
          borderRadius: '8px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-subtle)',
          maxWidth: '100%'
        },
        '& blockquote': {
          marginTop: '0.8rem',
          paddingInlineStart: '0.85rem',
          borderLeft: '3px solid var(--border-subtle)',
          color: 'var(--text-secondary)'
        },
        '& hr': {
          marginBlock: '0.9rem',
          borderColor: 'var(--border-subtle)'
        },
        '& a': {
          color: 'var(--text-primary)',
          fontWeight: 700
        }
      }}
    >
      <ReactMarkdown
        skipHtml
        urlTransform={(url) => safeMarkdownUrlTransform(url) ?? ''}
        remarkPlugins={[remarkGfm]}
        components={{
          a(props) {
            const href = props.href ?? '#';
            return (
              <chakra.a
                href={href}
                target={href.startsWith('mailto:') ? undefined : '_blank'}
                rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                color="blue.600"
                fontWeight="600"
                textDecoration="underline"
                textUnderlineOffset="3px"
                _dark={{ color: 'blue.200' }}
              >
                {props.children}
              </chakra.a>
            );
          },
          code(props) {
            const className = typeof props.className === 'string' ? props.className : '';
            const isInlineCode = className.trim().length === 0;
            return isInlineCode ? (
              <Code whiteSpace="pre-wrap">{String(props.children)}</Code>
            ) : (
              <Code display="block" whiteSpace="pre" bg="transparent" p="0" fontSize="sm">
                {String(props.children).replace(/\n$/u, '')}
              </Code>
            );
          },
          img(props) {
            return (
              <Button asChild size="xs" variant="outline" colorPalette="blue" mt="2">
                <a href={props.src ?? '#'} target="_blank" rel="noopener noreferrer">
                  {props.alt?.trim() || 'View image'}
                </a>
              </Button>
            );
          }
        }}
      >
        {children}
      </ReactMarkdown>
    </Box>
  );
});

const TranscriptMessageRow = memo(
  function TranscriptMessageRow({
    message,
    selected,
    onMessageClick
  }: {
    message: ChatMessage;
    selected: boolean;
    onMessageClick?: (message: ChatMessage) => void;
  }) {
    const clickable = Boolean(message.requestId && onMessageClick);

    const hasAttachments = message.attachments && message.attachments.length > 0;

    return (
      <TranscriptBubble
        messageRole={message.role}
        timestamp={message.createdAt}
        clickable={clickable}
        selected={selected}
        copyContent={message.content}
        onClick={clickable ? () => onMessageClick?.(message) : undefined}
      >
        {hasAttachments && (
          <HStack gap="2" flexWrap="wrap" mb="2">
            {message.attachments!.map((att) => (
              <chakra.a
                key={att.id}
                href={getUploadUrl(att.id)}
                target="_blank"
                rel="noopener noreferrer"
                display="inline-flex"
                alignItems="center"
                gap="1.5"
                px="2"
                py="1"
                rounded="8px"
                bg="var(--surface-3)"
                border="1px solid var(--border-subtle)"
                maxW="200px"
                textDecoration="none"
                _hover={{ borderColor: 'var(--border-default)', bg: 'var(--surface-active)' }}
                transition="background-color 100ms, border-color 100ms"
              >
                <Text fontSize="xs" flexShrink={0}>
                  {att.kind === 'image' ? '🖼' : att.kind === 'audio' ? '🎵' : att.kind === 'video' ? '🎬' : att.kind === 'pdf' ? '📄' : att.kind === 'code' ? '💻' : att.kind === 'spreadsheet' ? '📊' : '📎'}
                </Text>
                <Text fontSize="xs" color="var(--text-primary)" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{att.filename}</Text>
              </chakra.a>
            ))}
          </HStack>
        )}
        <MarkdownMessage>{message.content}</MarkdownMessage>
      </TranscriptBubble>
    );
  },
  (previousProps, nextProps) =>
    previousProps.message === nextProps.message &&
    previousProps.selected === nextProps.selected &&
    previousProps.onMessageClick === nextProps.onMessageClick
);

const TranscriptTypingRow = memo(function TranscriptTypingRow({
  assistantDraft,
  selected,
  typingStatusLabel,
  typingActivityKind
}: {
  assistantDraft: string;
  selected: boolean;
  typingStatusLabel?: string | null;
  typingActivityKind?: ChatActivity['kind'] | null;
}) {
  const statusText = typingStatusLabel?.trim() || 'Hermes is working…';
  const activityKind = typingActivityKind ?? 'status';
  return (
    <TranscriptBubble messageRole="assistant_draft" selected={selected}>
      <VStack align="stretch" gap="3">
        {assistantDraft.length > 0 ? <MarkdownMessage>{assistantDraft}</MarkdownMessage> : null}
        <HStack gap="2.5" align="center">
          <TypingDots />
          <StatusTicker text={statusText} kind={activityKind} />
        </HStack>
      </VStack>
    </TranscriptBubble>
  );
});

/* ── Copy icon button — clipboard / check swap ── */
function CopyIconButton({ copied, onClick }: { copied: boolean; onClick: (e: ReactMouseEvent) => void }) {
  const Svg = chakra('svg');
  return (
    <Button
      type="button"
      variant="ghost"
      w="6" h="6" minW="0" px="0"
      rounded="var(--radius-sm)"
      color={copied ? 'var(--status-success)' : 'var(--text-muted)'}
      opacity={copied ? 1 : 0.65}
      _hover={{ bg: 'var(--surface-active)', opacity: 1, color: 'var(--text-secondary)' }}
      transition="opacity 120ms ease, background-color 120ms ease, color 120ms ease"
      onClick={onClick}
      aria-label={copied ? 'Copied' : 'Copy message'}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? (
        <Svg viewBox="0 0 16 16" boxSize="3.5" fill="none" aria-hidden="true" color="currentColor" flexShrink={0}>
          <path d="M2.5 8.5l4 4 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : (
        <Svg viewBox="0 0 16 16" boxSize="3.5" fill="none" aria-hidden="true" color="currentColor" flexShrink={0}>
          <rect x="6.5" y="6.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9.5 6.5V4.5A1.5 1.5 0 0 0 8 3H4A1.5 1.5 0 0 0 2.5 4.5v4A1.5 1.5 0 0 0 4 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      )}
    </Button>
  );
}

function TranscriptBubble({
  messageRole,
  clickable = false,
  selected = false,
  copyContent,
  children,
  onClick
}: {
  messageRole: ChatMessage['role'] | 'assistant_draft';
  timestamp?: string; // kept for prop compatibility, not displayed
  clickable?: boolean;
  selected?: boolean;
  copyContent?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const isUser = messageRole === 'user';
  const isAssistant = messageRole === 'assistant' || messageRole === 'assistant_draft';
  const isStreaming = messageRole === 'assistant_draft';
  const [copied, setCopied] = useState(false);

  function handleCopy(e: ReactMouseEvent) {
    e.stopPropagation();
    if (!copyContent) return;
    void navigator.clipboard.writeText(copyContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  /* ── User message: right-aligned bubble, rail below flush-right ── */
  if (isUser) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="flex-end"
        className="msg-outer"
        {...(clickable ? {
          role: 'button',
          tabIndex: 0,
          cursor: 'pointer',
          onClick,
          onKeyDown: (e: ReactKeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
          }
        } : {})}
      >
        <Box
          maxW="min(580px, 86%)"
          bg={selected ? 'var(--user-bubble-bg-selected)' : 'var(--user-bubble-bg)'}
          rounded="16px"
          roundedBottomRight="4px"
          px="3"
          pt="2.5"
          pb="2"
          wordBreak="break-word"
          overflow="hidden"
          transition="background-color 150ms ease-in-out"
          style={selected ? { outline: '1.5px solid var(--accent)', outlineOffset: '2px' } : undefined}
        >
          {children}
        </Box>
        {copyContent && !isStreaming ? (
          <Box className="msg-actions" mt="1">
            <CopyIconButton copied={copied} onClick={handleCopy} />
          </Box>
        ) : null}
      </Box>
    );
  }

  /* ── Assistant message: left-aligned bubble, rail below offset by avatar width ── */
  if (isAssistant) {
    return (
      <Box
        className="msg-outer"
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        {...(clickable ? {
          role: 'button' as const,
          tabIndex: 0,
          cursor: 'pointer',
          onClick,
          onKeyDown: (e: ReactKeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
          }
        } : {})}
      >
        <HStack align="end" gap="2" w="100%">
          <Box flexShrink={0} pb="1">
            <HermesAvatar size="sm" />
          </Box>
          <Box
            maxW="min(620px, 88%)"
            bg={selected ? 'var(--surface-selected)' : 'var(--surface-2)'}
            rounded="16px"
            roundedBottomLeft="4px"
            px="3"
            pt="2.5"
            pb="2"
            wordBreak="break-word"
            overflow="hidden"
            transition="background-color 150ms ease-in-out"
            style={selected ? { outline: '1.5px solid var(--accent)', outlineOffset: '2px' } : undefined}
          >
            {children}
          </Box>
        </HStack>
        {copyContent && !isStreaming ? (
          /* pl="9" = 36px = avatar width (28px) + HStack gap (8px) — aligns rail with bubble */
          <Box className="msg-actions" mt="1" pl="9">
            <CopyIconButton copied={copied} onClick={handleCopy} />
          </Box>
        ) : null}
      </Box>
    );
  }

  /* ── System / empty state: centered, barely there ── */
  return (
    <Box display="flex" justifyContent="center">
      <Box maxW="440px" textAlign="center" px="4" py="3" rounded="8px" bg="var(--surface-hover)">
        {children}
      </Box>
    </Box>
  );
}
