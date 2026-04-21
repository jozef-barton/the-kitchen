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



export const ChatTranscript = memo(function ChatTranscript({
  messages,
  assistantDraft,
  loading,
  emptyTitle,
  emptyDetail,
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
  const visibleMessages = useMemo(
    () => messages.filter((message) => message.visibility === 'transcript' && message.kind !== 'technical'),
    [messages]
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    // Only auto-scroll when the user is already near the bottom (within 150px).
    // This lets users scroll up to read history without being yanked back down.
    const distFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    if (distFromBottom < 150) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [assistantDraft, loading, showTypingIndicator, visibleMessages]);

  return (
    <ScrollArea.Root flex="1" minH={0} variant="hover">
      <ScrollArea.Viewport ref={viewportRef} data-testid="chat-transcript-scroll">
        <Box maxW="740px" mx="auto" w="100%">
        <VStack align="stretch" gap="6" px={{ base: '3', md: '5' }} pt="4" pb="3">
          {loading ? (
            <TranscriptBubble messageRole="system">
              <Text fontWeight="700">Loading session…</Text>
              <Text color="var(--text-secondary)">Reading the active Hermes transcript from local persistence and the CLI bridge.</Text>
            </TranscriptBubble>
          ) : visibleMessages.length === 0 && !showTypingIndicator ? (
            <TranscriptBubble messageRole="system">
              <Text fontWeight="700">{emptyTitle}</Text>
              <Text color="var(--text-secondary)">{emptyDetail}</Text>
            </TranscriptBubble>
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

    return (
      <TranscriptBubble
        messageRole={message.role}
        timestamp={message.createdAt}
        clickable={clickable}
        selected={selected}
        copyContent={message.content}
        onClick={clickable ? () => onMessageClick?.(message) : undefined}
      >
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
  const [copied, setCopied] = useState(false);

  function handleCopy(e: ReactMouseEvent) {
    e.stopPropagation(); // always stop — click on copy should never bubble to message click
    if (!copyContent) return;
    void navigator.clipboard.writeText(copyContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  /* ── Copy button — rendered but opacity controlled by .msg-outer:hover ── */
  const CopyBtn = copyContent ? (
    <Box className="msg-actions" display="inline-flex" mt="1">
      <Button
        type="button"
        variant="ghost"
        size="xs"
        minW={0}
        px="1.5"
        h="5"
        rounded="4px"
        color="var(--text-muted)"
        fontSize="10px"
        fontWeight="400"
        _hover={{ bg: 'var(--surface-2)', color: 'var(--text-primary)' }}
        onClick={handleCopy}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </Button>
    </Box>
  ) : null;

  /* ── User message: right-aligned soft pill ── */
  if (isUser) {
    const inner = (
      <Box
        maxW="min(580px, 86%)"
        bg={selected ? 'var(--surface-selected)' : 'var(--surface-2)'}
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
        {CopyBtn}
      </Box>
    );

    return (
      <Box
        display="flex"
        justifyContent="flex-end"
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
        {inner}
      </Box>
    );
  }

  /* ── Assistant message: open canvas ── */
  if (isAssistant) {
    const inner = (
      <HStack align="start" gap="3" w="100%" maxW="100%">
        <Box flexShrink={0} mt="2px">
          <HermesAvatar size="sm" />
        </Box>
        <Box flex="1" minW={0} overflow="hidden" wordBreak="break-word">
          {children}
          {CopyBtn}
        </Box>
      </HStack>
    );

    if (clickable) {
      return (
        <Box
          className="msg-outer"
          role="button"
          tabIndex={0}
          cursor="pointer"
          rounded="10px"
          px="2"
          py="1.5"
          mx="-2"
          transition="background-color 150ms ease-in-out"
          _hover={{ bg: 'var(--surface-hover)' }}
          style={selected ? { outline: '1.5px solid var(--accent)', outlineOffset: '2px' } : undefined}
          onClick={onClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
        >
          {inner}
        </Box>
      );
    }
    return <Box className="msg-outer">{inner}</Box>;
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
