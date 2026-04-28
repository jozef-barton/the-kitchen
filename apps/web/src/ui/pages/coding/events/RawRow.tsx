import { Box, Text } from '@chakra-ui/react';

export function RawRow({ text, isError }: { text: string; isError: boolean }) {
  return (
    <Box
      bg={isError ? 'var(--surface-danger)' : 'var(--surface-2)'}
      rounded="var(--radius-control)"
      px="3" py="2"
    >
      <Text
        fontSize="11px" fontFamily="ui-monospace, monospace"
        color={isError ? 'var(--status-danger)' : 'var(--text-secondary)'}
        whiteSpace="pre-wrap" wordBreak="break-all"
      >
        {text.trimEnd()}
      </Text>
    </Box>
  );
}
