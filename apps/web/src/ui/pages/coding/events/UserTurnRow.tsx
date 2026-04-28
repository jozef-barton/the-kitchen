import { Box, Text } from '@chakra-ui/react';

interface UserTurnRowProps {
  text: string;
  turnIndex: number;
}

export function UserTurnRow({ text }: UserTurnRowProps) {
  return (
    <Box display="flex" justifyContent="flex-end" py="1">
      <Box
        maxW="80%"
        px="3"
        py="2"
        rounded="var(--radius-card)"
        bg="var(--accent)"
        color="var(--accent-contrast)"
      >
        <Text fontSize="13px" whiteSpace="pre-wrap" wordBreak="break-word">
          {text}
        </Text>
      </Box>
    </Box>
  );
}
