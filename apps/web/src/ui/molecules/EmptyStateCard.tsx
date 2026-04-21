import type { ReactNode } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';

function DefaultIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="var(--border-default)" strokeWidth="1.5" />
      <path
        d="M12 16h8M16 12v8"
        stroke="var(--text-muted)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyStateCard({
  title,
  detail,
  icon,
  ctaLabel,
  ctaAction
}: {
  title: string;
  detail: string;
  icon?: ReactNode;
  ctaLabel?: string;
  ctaAction?: () => void;
}) {
  return (
    <Box
      rounded="8px"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-elevated)"
      px={{ base: '5', md: '7' }}
      py={{ base: '8', md: '10' }}
      boxShadow="var(--shadow-xs)"
    >
      <VStack align="center" gap="3">
        <Box color="var(--text-muted)">
          {icon ?? <DefaultIcon />}
        </Box>
        <VStack align="center" gap="1">
          <Text
            fontSize="sm"
            fontWeight="600"
            color="var(--text-secondary)"
            textAlign="center"
            lineHeight="1.3"
          >
            {title}
          </Text>
          <Text
            fontSize="xs"
            color="var(--text-muted)"
            textAlign="center"
            lineHeight="1.6"
            maxW="320px"
          >
            {detail}
          </Text>
        </VStack>
        {ctaLabel && ctaAction ? (
          <Button
            size="sm"
            rounded="8px"
            bg="var(--accent)"
            color="var(--accent-contrast)"
            fontWeight="650"
            _hover={{ bg: 'var(--accent-strong)', transform: 'translateY(-1px)' }}
            onClick={ctaAction}
          >
            {ctaLabel}
          </Button>
        ) : null}
      </VStack>
    </Box>
  );
}
