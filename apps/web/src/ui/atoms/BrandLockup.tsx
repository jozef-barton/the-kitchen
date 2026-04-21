import { HStack, Text, VStack } from '@chakra-ui/react';

export function BrandLockup({
  compact = false
}: {
  compact?: boolean;
}) {
  return (
    <HStack align="center" gap={compact ? '2' : '2.5'} minW={0} data-testid="hermes-home-brand">
      <span aria-hidden="true" style={{ fontSize: compact ? '18px' : '22px', lineHeight: 1, flexShrink: 0 }}>🧑‍🍳</span>
      <VStack align="start" gap="0" minW={0}>
        <Text
          fontSize={compact ? 'sm' : 'md'}
          fontWeight="700"
          letterSpacing="-0.01em"
          color="var(--text-primary)"
          lineHeight="1.15"
        >
          The Kitchen
        </Text>
        {!compact ? (
          <Text fontSize="xs" color="var(--text-muted)" lineHeight="1.35" fontWeight="400">
            Local Hermes workspace
          </Text>
        ) : null}
      </VStack>
    </HStack>
  );
}
