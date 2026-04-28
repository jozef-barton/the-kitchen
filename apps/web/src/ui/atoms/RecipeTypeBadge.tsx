import { Box, Text } from '@chakra-ui/react';
import type { Session } from '@hermes-recipes/protocol';

function recipeTypePresentation(recipeType: Session['recipeType']) {
  if (recipeType === 'home') {
    return {
      label: 'Kitchen',
      background: 'var(--surface-accent)',
      color: 'var(--text-primary)'
    };
  }

  return {
    label: 'TUI',
    background: 'var(--surface-2)',
    color: 'var(--text-secondary)'
  };
}

export function RecipeTypeBadge({
  recipeType,
  testId
}: {
  recipeType: Session['recipeType'];
  testId?: string;
}) {
  const presentation = recipeTypePresentation(recipeType);

  return (
    <Box
      data-testid={testId}
      display="inline-flex"
      rounded="8px"
      bg={presentation.background}
      px="2"
      py="0.5"
      aria-label={`${presentation.label} workspace`}
      title={`${presentation.label} workspace`}
    >
      <Text fontSize="10px" fontWeight="600" color={presentation.color} letterSpacing="0">
        {presentation.label}
      </Text>
    </Box>
  );
}
