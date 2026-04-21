import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { BrandLockup } from '../atoms/BrandLockup';

export function PageHeader({
  profileName,
  pageName,
  detail
}: {
  profileName: string | null;
  pageName: string;
  detail?: string;
}) {
  return (
    <HStack align="center" flex="1" gap={{ base: '3', md: '5' }} minW={0} data-testid="page-header">
      <BrandLockup compact />
      <Box h="8" w="1px" bg="var(--border-subtle)" display={{ base: 'none', md: 'block' }} />
      <VStack align="start" gap="0.5" minW={0}>
        <HStack gap="2" minW={0}>
          <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="750" color="var(--text-primary)" lineHeight="1.2" truncate>
            {pageName}
          </Text>
          {profileName ? (
            <Text
              flexShrink={0}
              fontSize="xs"
              fontWeight="650"
              color="var(--accent)"
              bg="var(--accent-soft)"
              rounded="6px"
              px="2"
              py="0.5"
            >
              {profileName}
            </Text>
          ) : null}
        </HStack>
        {detail ? (
          <Text fontSize="sm" color="var(--text-secondary)" lineClamp={1}>
            {detail}
          </Text>
        ) : null}
      </VStack>
    </HStack>
  );
}
