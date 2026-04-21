import { useCallback, useState } from 'react';
import { Box, Button, Flex, Textarea } from '@chakra-ui/react';

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
      rounded="12px"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-elevated)"
      boxShadow="0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)"
      data-testid="chat-composer"
      css={{
        transition: 'border-color 150ms ease-in-out, box-shadow 150ms ease-in-out',
        '&:focus-within': {
          borderColor: 'var(--border-default)',
          boxShadow: 'var(--focus-ring)'
        }
      }}
      onSubmit={(event: React.FormEvent) => {
        event.preventDefault();
        if (canSubmit) void handleSubmit();
      }}
    >
      <Flex align="flex-end" gap="2" px="3" py="2">
        <Textarea
          flex="1"
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          placeholder="Ask Hermes something real."
          autoresize
          resize="none"
          variant="subtle"
          minH="0"
          maxH="200px"
          py="1"
          px="0"
          fontSize="sm"
          lineHeight="1.55"
          color="var(--text-primary)"
          disabled={disabled}
          bg="transparent"
          border="none"
          _placeholder={{ color: 'var(--text-muted)' }}
          _focus={{ boxShadow: 'none', bg: 'transparent' }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
            event.preventDefault();
            if (canSubmit) void handleSubmit();
          }}
        />
        <Button
          type="submit"
          size="xs"
          h="7"
          px="3"
          mb="0.5"
          rounded="8px"
          bg={canSubmit ? 'var(--accent)' : 'var(--surface-3)'}
          color={canSubmit ? 'var(--accent-contrast)' : 'var(--text-muted)'}
          fontWeight="500"
          fontSize="xs"
          flexShrink={0}
          _hover={{ bg: canSubmit ? 'var(--accent-strong)' : undefined }}
          transition="background-color 150ms ease-in-out, color 150ms ease-in-out"
          loading={sending}
          disabled={!canSubmit}
        >
          Send
        </Button>
      </Flex>
    </Box>
  );
}
