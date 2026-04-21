import { useCallback, useState } from 'react';
import { Box, Button, HStack, Text, Textarea } from '@chakra-ui/react';

export function ChatComposer({
  onSend,
  sending,
  disabled
}: {
  onSend: (content: string) => boolean | Promise<boolean>;
  sending: boolean;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState('');
  const canSubmit = !disabled && !sending && draft.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    const content = draft.trim();
    if (!content || disabled || sending) return;
    const accepted = await Promise.resolve(onSend(content)).catch(() => false);
    if (accepted) setDraft('');
  }, [disabled, draft, onSend, sending]);

  return (
    <Box
      as="form"
      rounded="16px"
      border="1px solid var(--border-default)"
      bg="var(--surface-elevated)"
      overflow="hidden"
      boxShadow="var(--shadow-sm)"
      data-testid="chat-composer"
      css={{
        transition: 'box-shadow 200ms ease, border-color 200ms ease',
        '&:focus-within': {
          borderColor: 'var(--accent)',
          boxShadow: 'var(--focus-ring), var(--shadow-sm)'
        }
      }}
      onSubmit={(event: React.FormEvent) => {
        event.preventDefault();
        if (canSubmit) void handleSubmit();
      }}
    >
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        placeholder="Ask Hermes something real."
        autoresize
        resize="none"
        variant="subtle"
        minH="0"
        maxH="280px"
        px="4"
        pt="4"
        pb="2"
        fontSize="sm"
        lineHeight="1.65"
        color="var(--text-primary)"
        disabled={disabled}
        bg="transparent"
        border="none"
        _placeholder={{ color: 'var(--text-muted)', fontSize: 'sm' }}
        _focus={{ boxShadow: 'none', bg: 'transparent' }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
          event.preventDefault();
          if (canSubmit) void handleSubmit();
        }}
      />
      <HStack justify="space-between" align="center" gap="3" px="4" pb="3" pt="1">
        <Text fontSize="xs" color="var(--text-muted)" opacity={0.7} display={{ base: 'none', md: 'block' }}>
          Enter ↵ to send · Shift+Enter for newline
        </Text>
        <Button
          type="submit"
          size="sm"
          rounded="10px"
          px="4"
          bg="var(--accent)"
          color="var(--accent-contrast)"
          fontWeight="600"
          fontSize="xs"
          _hover={{ bg: 'var(--accent-strong)' }}
          loading={sending}
          disabled={!canSubmit}
          ml="auto"
          flexShrink={0}
        >
          Send
        </Button>
      </HStack>
    </Box>
  );
}
