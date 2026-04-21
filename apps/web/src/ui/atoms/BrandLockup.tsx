import { HStack, Text, VStack } from '@chakra-ui/react';

function HermesLogomark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {/* Outer ring */}
      <circle cx="14" cy="14" r="12.5" stroke="var(--accent)" strokeWidth="1.5" />
      {/* Inner hex shape suggesting "H" */}
      <path
        d="M9 9.5v9M19 9.5v9M9 14h10"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLockup({
  compact = false
}: {
  compact?: boolean;
}) {
  return (
    <HStack align="center" gap={compact ? '2' : '2.5'} minW={0} data-testid="hermes-home-brand">
      <HermesLogomark size={compact ? 22 : 26} />
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
