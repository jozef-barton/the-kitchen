import { useState } from 'react';
import { Box, Button, Text } from '@chakra-ui/react';

export function ThinkingRow({ messageId: _m, text, ts: _t }: { messageId: string; text: string; ts: number }) {
  const [open, setOpen] = useState(false);
  const wordCount = text.trim().split(/\s+/).length;
  return (
    <Box rounded="var(--radius-control)" border="1px solid var(--border-subtle)" overflow="hidden">
      <Button
        variant="ghost" w="100%" h="auto" px="3" py="2" justifyContent="space-between"
        onClick={() => setOpen(v => !v)}
        _hover={{ bg: 'var(--surface-hover)' }}
      >
        <Text fontSize="12px" color="var(--text-muted)" fontStyle="italic">
          Thinking · {wordCount} words
        </Text>
        <Text fontSize="11px" color="var(--text-muted)">{open ? '▾' : '▸'}</Text>
      </Button>
      {open && (
        <Box px="3" pb="3" bg="var(--surface-2)">
          <Text
            fontSize="12px" color="var(--text-muted)" fontStyle="italic"
            whiteSpace="pre-wrap" lineHeight="1.6"
          >
            {text}
          </Text>
        </Box>
      )}
    </Box>
  );
}
