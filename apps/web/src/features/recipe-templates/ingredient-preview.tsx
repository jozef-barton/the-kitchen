import { Box, Text, VStack } from '@chakra-ui/react';
import type { Recipe, RecipeTemplateState } from '@hermes-recipes/protocol';
import { RecipeTemplateRenderer } from '../../ui/organisms/RecipeTemplateRenderer';
import type { Ingredient } from './ingredient-catalog';

export function IngredientPreview({ ingredient }: { ingredient: Ingredient }) {
  const templateState: RecipeTemplateState = {
    kind: 'recipe_template_state',
    schemaVersion: 'recipe_template_state/v1',
    templateId: 'step-by-step-instructions',
    title: ingredient.name,
    summary: ingredient.summary,
    sections: [ingredient.example],
    transitionTargets: [],
    transitionHistory: [],
    metadata: {}
  };

  const recipeStub = {} as Recipe;

  return (
    <VStack align="stretch" gap="3" p="3">
      <VStack align="start" gap="1">
        <Text fontSize="xs" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0.1em" fontWeight="600">
          {ingredient.kind}
        </Text>
        <Text fontSize="lg" fontWeight="600" color="var(--text-primary)">
          {ingredient.name}
        </Text>
        <Text fontSize="sm" color="var(--text-secondary)">
          {ingredient.summary}
        </Text>
      </VStack>

      <Box>
        <RecipeTemplateRenderer
          recipe={recipeStub}
          templateState={templateState}
          actionSpec={null}
          actionLoadingId={null}
          actionError={null}
          onRunAction={() => undefined}
        />
      </Box>
    </VStack>
  );
}
