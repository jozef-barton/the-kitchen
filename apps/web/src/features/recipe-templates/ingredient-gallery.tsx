import { Badge, Box, Button, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { TemplateSurface } from './template-primitives';
import { resolveTemplateGalleryFilterButtonStyles } from './template-style-helpers';
import { INGREDIENT_GROUPS, type Ingredient, type IngredientGroup } from './ingredient-catalog';

export function IngredientGallery({
  ingredients,
  activeGroup,
  selectedIngredientId,
  onGroupChange,
  onSelectIngredient
}: {
  ingredients: Ingredient[];
  activeGroup: IngredientGroup | 'all';
  selectedIngredientId: string;
  onGroupChange: (group: IngredientGroup | 'all') => void;
  onSelectIngredient: (ingredientId: string) => void;
}) {
  return (
    <VStack align="stretch" gap="3" data-testid="recipe-ingredient-gallery">
      <TemplateSurface>
        <VStack align="stretch" gap="4">
          <VStack align="start" gap="1">
            <Text fontSize="lg" fontWeight="600" color="var(--text-primary)">
              Ingredients
            </Text>
            <Text color="var(--text-secondary)">
              The section primitives available to every recipe. Click a card to render it in the preview pane.
            </Text>
          </VStack>

          <Flex gap="2" wrap="wrap">
            {INGREDIENT_GROUPS.map((group) => {
              const buttonStyles = resolveTemplateGalleryFilterButtonStyles(activeGroup === group.id);
              return (
                <Button
                  key={group.id}
                  size="sm"
                  rounded="999px"
                  bg={buttonStyles.bg}
                  border="1px solid var(--border-subtle)"
                  color={buttonStyles.color}
                  _dark={{ color: buttonStyles.darkColor }}
                  onClick={() => onGroupChange(group.id)}
                >
                  {group.label}
                </Button>
              );
            })}
          </Flex>
        </VStack>
      </TemplateSurface>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="3" alignItems="stretch">
        {ingredients.map((ingredient) => {
          const selected = ingredient.id === selectedIngredientId;

          return (
            <Box
              key={ingredient.id}
              data-testid={`recipe-ingredient-card-${ingredient.id}`}
              cursor="pointer"
              onClick={() => onSelectIngredient(ingredient.id)}
              _hover={{ bg: 'var(--surface-2)', transform: 'translateY(-1px)', transition: 'all 150ms ease' }}
              rounded="12px"
              h="100%"
            >
              <TemplateSurface bg={selected ? 'rgba(37, 99, 235, 0.06)' : 'var(--surface-1)'} padding="3">
                <VStack align="stretch" gap="2.5">
                  <Flex align="center" gap="2" wrap="wrap">
                    <Text fontSize="10px" fontWeight="600" letterSpacing="0.12em" textTransform="uppercase" color="var(--text-muted)">
                      {ingredient.group}
                    </Text>
                    <Badge size="sm" variant="subtle" colorPalette="gray">
                      {ingredient.kind}
                    </Badge>
                  </Flex>
                  <Text fontSize="md" fontWeight="600" color="var(--text-primary)" lineHeight="1.2">
                    {ingredient.name}
                  </Text>
                  <Text fontSize="sm" color="var(--text-secondary)" lineClamp={2}>
                    {ingredient.summary}
                  </Text>
                  <Text fontSize="xs" color="var(--text-muted)" lineClamp={2}>
                    {ingredient.whenToUse}
                  </Text>
                </VStack>
              </TemplateSurface>
            </Box>
          );
        })}
      </SimpleGrid>
    </VStack>
  );
}
