import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Button, Code, HStack, ScrollArea, Text, VStack, chakra } from '@chakra-ui/react';
import type { ChatActivity, ChatMessage } from '@hermes-recipes/protocol';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HermesAvatar } from '../atoms/HermesAvatar';
import { TypingDots } from '../atoms/TypingDots';
import { StatusTicker } from '../atoms/StatusTicker';
import { safeMarkdownUrlTransform } from '../../lib/markdown-url-transform';

function formatMessageTime(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function roleLabel(role: ChatMessage['role'] | 'assistant_draft') {
  switch (role) {
    case 'assistant':
    case 'assistant_draft':
      return 'Hermes';
    case 'user':
      return 'You';
    default:
      return 'System';
  }
}

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
        <VStack align="stretch" gap={{ base: '6', md: '8' }} px={{ base: '2', md: '4' }} pt={{ base: '4', md: '6' }} pb={{ base: '2', md: '4' }}>
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
          fontSize: '0.875rem',
          lineHeight: 1.72
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
  timestamp,
  clickable = false,
  selected = false,
  copyContent,
  children,
  onClick
}: {
  messageRole: ChatMessage['role'] | 'assistant_draft';
  timestamp?: string;
  clickable?: boolean;
  selected?: boolean;
  copyContent?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const isUser = messageRole === 'user';
  const isAssistant = messageRole === 'assistant' || messageRole === 'assistant_draft';
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!copyContent) return;
    void navigator.clipboard.writeText(copyContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const ActionRow = ({ stopProp }: { stopProp?: boolean }) => (
    <HStack gap="1.5" opacity={0.5} _hover={{ opacity: 1 }} transition="opacity 140ms ease" mt="1.5">
      {copyContent ? (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          minW={0}
          px="2"
          h="6"
          rounded="6px"
          color="var(--text-muted)"
          fontSize="xs"
          _hover={{ bg: 'var(--surface-2)', color: 'var(--text-primary)' }}
          onClick={stopProp ? (e) => { e.stopPropagation(); handleCopy(); } : handleCopy}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      ) : null}
      {formatMessageTime(timestamp) ? (
        <Text fontSize="xs" color="var(--text-muted)">{formatMessageTime(timestamp)}</Text>
      ) : null}
    </HStack>
  );

  /* ── User message: right-aligned soft bubble ── */
  if (isUser) {
    const bubble = (
      <Box
        maxW="min(620px, 88%)"
        bg={selected ? 'var(--surface-selected)' : 'var(--surface-2)'}
        rounded="20px"
        roundedBottomRight="6px"
        px={{ base: '4', md: '5' }}
        py={{ base: '3', md: '3.5' }}
        transition="background-color 160ms ease"
        style={selected ? { outline: '2px solid var(--accent)', outlineOffset: '2px' } : undefined}
        overflow="hidden"
        wordBreak="break-word"
      >
        {children}
        <ActionRow stopProp={clickable} />
      </Box>
    );

    if (clickable) {
      return (
        <Box display="flex" justifyContent="flex-end">
          <Box
            role="button"
            tabIndex={0}
            cursor="pointer"
            onClick={onClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
          >
            {bubble}
          </Box>
        </Box>
      );
    }
    return <Box display="flex" justifyContent="flex-end">{bubble}</Box>;
  }

  /* ── Assistant message: open canvas, no bubble ── */
  if (isAssistant) {
    const content = (
      <HStack align="start" gap="3" w="100%" maxW="100%">
        <Box flexShrink={0} mt="1px">
          <HermesAvatar size="sm" />
        </Box>
        <VStack align="stretch" gap="0" flex="1" minW={0} overflow="hidden" wordBreak="break-word">
          {children}
          <ActionRow stopProp={clickable} />
        </VStack>
      </HStack>
    );

    if (clickable) {
      return (
        <Box
          role="button"
          tabIndex={0}
          cursor="pointer"
          rounded="12px"
          px="3"
          py="2"
          mx="-3"
          transition="background-color 140ms ease"
          _hover={{ bg: 'var(--surface-hover)' }}
          style={selected ? { outline: '1.5px solid var(--accent)', outlineOffset: '2px' } : undefined}
          onClick={onClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
        >
          {content}
        </Box>
      );
    }
    return <Box>{content}</Box>;
  }

  /* ── System message: centered, minimal ── */
  return (
    <Box display="flex" justifyContent="center" py="2">
      <Box
        maxW="480px"
        textAlign="center"
        px="4"
        py="3"
        rounded="10px"
        bg="var(--surface-hover)"
      >
        {children}
      </Box>
    </Box>
  );
}
