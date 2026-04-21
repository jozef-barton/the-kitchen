import { Box, Button, Grid, HStack, VStack } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { RecipeTemplateDetailDrawer } from '../../features/recipe-templates/template-detail-drawer';
import { RecipeTemplateGallery } from '../../features/recipe-templates/template-gallery';
import { RecipeTemplatePreview } from '../../features/recipe-templates/template-preview';
import { getRecipeTemplateById, RECIPE_TEMPLATE_REGISTRY } from '../../features/recipe-templates/template-registry';
import { IngredientGallery } from '../../features/recipe-templates/ingredient-gallery';
import { IngredientPreview } from '../../features/recipe-templates/ingredient-preview';
import { INGREDIENT_CATALOG, getIngredientById, type IngredientGroup } from '../../features/recipe-templates/ingredient-catalog';
import type { RecipeTemplateGalleryCategory, RecipeTemplateId } from '../../features/recipe-templates/types';

export function RecipesPage({ activeProfileId: _activeProfileId }: { activeProfileId?: string | null }) {
  const [category, setCategory] = useState<RecipeTemplateGalleryCategory>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<RecipeTemplateId>('price-comparison-grid');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ingredientGroup, setIngredientGroup] = useState<IngredientGroup | 'all'>('all');
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>(INGREDIENT_CATALOG[0]?.id ?? 'hero');

  const visibleTemplates = useMemo(
    () => RECIPE_TEMPLATE_REGISTRY.filter((template) => category === 'all' || template.category === category),
    [category]
  );

  const visibleIngredients = useMemo(
    () => INGREDIENT_CATALOG.filter((ingredient) => ingredientGroup === 'all' || ingredient.group === ingredientGroup),
    [ingredientGroup]
  );

  useEffect(() => {
    if (visibleTemplates.some((template) => template.id === selectedTemplateId)) {
      return;
    }

    if (visibleTemplates[0]) {
      setSelectedTemplateId(visibleTemplates[0].id);
    }
  }, [selectedTemplateId, visibleTemplates]);

  useEffect(() => {
    if (visibleIngredients.some((ingredient) => ingredient.id === selectedIngredientId)) {
      return;
    }
    if (visibleIngredients[0]) {
      setSelectedIngredientId(visibleIngredients[0].id);
    }
  }, [selectedIngredientId, visibleIngredients]);

  const [activeTab, setActiveTab] = useState<'book' | 'ingredients'>('book');

  const selectedTemplate = getRecipeTemplateById(selectedTemplateId) ?? visibleTemplates[0] ?? RECIPE_TEMPLATE_REGISTRY[0];
  const selectedIngredient = getIngredientById(selectedIngredientId) ?? visibleIngredients[0] ?? INGREDIENT_CATALOG[0];

  return (
    <VStack align="stretch" h="100%" minH={0} gap="0">
      {/* Tab bar — sits outside the Grid so flex="1" on Grid still works */}
      <HStack borderBottom="1px solid var(--border-subtle)" gap="0" mb="4" flexShrink={0}>
        {([['book', 'Recipe Book'], ['ingredients', 'Ingredients']] as const).map(([value, label]) => (
          <Button
            key={value}
            role="tab"
            aria-selected={activeTab === value}
            variant="ghost"
            size="sm"
            rounded="0"
            px="1"
            pb="2.5"
            pt="1"
            mr="4"
            fontSize="sm"
            fontWeight={activeTab === value ? '500' : '400'}
            color={activeTab === value ? 'var(--text-primary)' : 'var(--text-muted)'}
            borderBottom={activeTab === value ? '2px solid var(--accent)' : '2px solid transparent'}
            mb="-1px"
            _hover={{ bg: 'transparent', color: 'var(--text-primary)' }}
            onClick={() => setActiveTab(value)}
          >
            {label}
          </Button>
        ))}
      </HStack>

      {activeTab === 'book' && (
        <Grid
          templateColumns={{ base: '1fr', xl: 'minmax(0, 1.2fr) minmax(360px, 0.95fr)' }}
          gap="4"
          flex="1"
          minH={0}
          overflow="hidden"
        >
          <Box minH={0} overflowY={{ base: 'visible', xl: 'auto' }} pr={{ base: '0', xl: '1' }}>
            <RecipeTemplateGallery
              templates={visibleTemplates}
              activeCategory={category}
              selectedTemplateId={selectedTemplate.id}
              onCategoryChange={setCategory}
              onSelectTemplate={(templateId) => setSelectedTemplateId(templateId as RecipeTemplateId)}
              onInspectTemplate={(templateId) => {
                setSelectedTemplateId(templateId as RecipeTemplateId);
                setDrawerOpen(true);
              }}
            />
          </Box>
          <Box minH={0} overflowY={{ base: 'visible', xl: 'auto' }} pl={{ base: '0', xl: '1' }} data-testid="spaces-template-inspector">
            <Box rounded="8px" border="1px solid var(--border-subtle)" overflow="auto">
              <RecipeTemplatePreview preview={selectedTemplate.preview} />
            </Box>
          </Box>
        </Grid>
      )}

      {activeTab === 'ingredients' && (
        <Grid
          templateColumns={{ base: '1fr', xl: 'minmax(0, 1.2fr) minmax(360px, 0.95fr)' }}
          gap="4"
          flex="1"
          minH={0}
          overflow="hidden"
        >
          <Box minH={0} overflowY={{ base: 'visible', xl: 'auto' }} pr={{ base: '0', xl: '1' }}>
            <IngredientGallery
              ingredients={visibleIngredients}
              activeGroup={ingredientGroup}
              selectedIngredientId={selectedIngredient.id}
              onGroupChange={setIngredientGroup}
              onSelectIngredient={setSelectedIngredientId}
            />
          </Box>
          <Box minH={0} overflowY={{ base: 'visible', xl: 'auto' }} pl={{ base: '0', xl: '1' }} data-testid="recipe-ingredient-inspector">
            <Box rounded="8px" border="1px solid var(--border-subtle)" overflow="auto">
              <IngredientPreview ingredient={selectedIngredient} />
            </Box>
          </Box>
        </Grid>
      )}

      <RecipeTemplateDetailDrawer template={selectedTemplate} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </VStack>
  );
}
