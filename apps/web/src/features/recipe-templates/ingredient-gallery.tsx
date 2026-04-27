import { Badge, Box, Button, Flex, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { TemplateSurface } from './template-primitives';
import { INGREDIENT_GROUPS, type Ingredient, type IngredientGroup } from './ingredient-catalog';
import { IngredientPreview } from './ingredient-preview';

function MiniatureIngredientPreview({ ingredient }: { ingredient: Ingredient }) {
  return (
    <Box
      position="relative"
      flexShrink={0}
      w="120px"
      h="120px"
      overflow="hidden"
      rounded="6px"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-1)"
      onClick={(e) => e.stopPropagation()}
    >
      <Box
        position="absolute"
        top="0"
        left="0"
        p="4"
        style={{
          width: '400%',
          height: '400%',
          transformOrigin: 'top left',
          transform: 'scale(0.25)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <IngredientPreview ingredient={ingredient} />
      </Box>
    </Box>
  );
}

export function IngredientGallery({
  ingredients,
  activeGroup,
  selectedIngredientId,
  onGroupChange,
  onSelectIngredient,
  onPreviewIngredient
}: {
  ingredients: Ingredient[];
  activeGroup: IngredientGroup | 'all';
  selectedIngredientId: string;
  onGroupChange: (group: IngredientGroup | 'all') => void;
  onSelectIngredient: (ingredientId: string) => void;
  onPreviewIngredient?: (ingredientId: string) => void;
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
              The section primitives available to every recipe. Click a card to preview it.
            </Text>
          </VStack>

          <Box
            overflowX="auto"
            css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
          >
            <HStack gap="1.5" flexWrap="nowrap" pb="1">
              {INGREDIENT_GROUPS.map((group) => {
                const isActive = activeGroup === group.id;
                return (
                  <Button
                    key={group.id}
                    size="xs"
                    rounded="var(--radius-pill)"
                    h="6"
                    px="3"
                    fontSize="11px"
                    fontWeight="500"
                    bg={isActive ? 'var(--surface-active)' : 'transparent'}
                    border="1px solid var(--border-subtle)"
                    color={isActive ? 'var(--text-primary)' : 'var(--text-muted)'}
                    _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                    onClick={() => onGroupChange(group.id)}
                    flexShrink={0}
                  >
                    {group.label}
                  </Button>
                );
              })}
            </HStack>
          </Box>
        </VStack>
      </TemplateSurface>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="5" alignItems="stretch">
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
                <HStack align="start" gap="3">
                  <MiniatureIngredientPreview ingredient={ingredient} />
                  <VStack align="start" gap="1.5" flex="1" minW={0}>
                    <Flex align="center" gap="1.5" wrap="wrap">
                      <Text fontSize="10px" fontWeight="600" letterSpacing="0.12em" textTransform="uppercase" color="var(--text-muted)">
                        {ingredient.group}
                      </Text>
                      <Badge size="sm" variant="subtle" colorPalette="gray">
                        {ingredient.kind}
                      </Badge>
                    </Flex>
                    <Text fontSize="sm" fontWeight="600" color="var(--text-primary)" lineHeight="1.25">
                      {ingredient.name}
                    </Text>
                    <Text fontSize="xs" color="var(--text-secondary)" lineClamp={3}>
                      {ingredient.summary}
                    </Text>
                    {onPreviewIngredient ? (
                      <Flex justify="flex-end" w="100%">
                        <Button
                          size="xs"
                          rounded="6px"
                          variant="ghost"
                          fontSize="xs"
                          color="var(--text-muted)"
                          h="6"
                          px="2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreviewIngredient(ingredient.id);
                          }}
                        >
                          Preview
                        </Button>
                      </Flex>
                    ) : null}
                  </VStack>
                </HStack>
              </TemplateSurface>
            </Box>
          );
        })}
      </SimpleGrid>
    </VStack>
  );
}
