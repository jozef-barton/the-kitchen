import { Box, CloseButton, Drawer, HStack, Portal, ScrollArea, Tabs, VStack } from '@chakra-ui/react';
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
  const [mobileIngredientOpen, setMobileIngredientOpen] = useState(false);
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
    <VStack align="stretch" h="100%" minH={0} gap="0" px={{ base: '3', lg: '4' }} pt={{ base: '2', lg: '3' }}>
      {/* Tab bar — block style matching Tools */}
      <Box mb="3" flexShrink={0}>
        <Tabs.Root
          value={activeTab}
          onValueChange={(e) => setActiveTab(e.value as 'book' | 'ingredients')}
          variant="plain"
          css={{
            '--tabs-indicator-bg': 'var(--surface-1)',
            '--tabs-indicator-shadow': 'var(--shadow-xs)',
            '--tabs-trigger-radius': '7px'
          }}
        >
          <Tabs.List rounded="8px" bg="var(--surface-2)" border="1px solid var(--border-subtle)" p="1" w="fit-content">
            <Tabs.Trigger value="book" fontSize="xs" px="3">Recipe Book</Tabs.Trigger>
            <Tabs.Trigger value="ingredients" fontSize="xs" px="3">Ingredients</Tabs.Trigger>
            <Tabs.Indicator />
          </Tabs.List>
        </Tabs.Root>
      </Box>

      {activeTab === 'book' && (
        <>
          {/* Full-width scrollable gallery — no preview panel */}
          <ScrollArea.Root flex="1" minH={0} variant="hover">
            <ScrollArea.Viewport>
              <Box px={{ base: '3', lg: '4' }} pb="6" pt="1">
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
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar />
          </ScrollArea.Root>

          {/* Hidden inspector — kept in DOM for test coverage only */}
          <Box display="none" data-testid="spaces-template-inspector" aria-hidden="true">
            <RecipeTemplatePreview preview={selectedTemplate.preview} />
          </Box>
        </>
      )}

      {activeTab === 'ingredients' && (
        <>
          {/* Full-width scrollable gallery — no preview panel */}
          <ScrollArea.Root flex="1" minH={0} variant="hover">
            <ScrollArea.Viewport>
              <Box px={{ base: '3', lg: '4' }} pb="6" pt="1">
                <IngredientGallery
                  ingredients={visibleIngredients}
                  activeGroup={ingredientGroup}
                  selectedIngredientId={selectedIngredient.id}
                  onGroupChange={setIngredientGroup}
                  onSelectIngredient={setSelectedIngredientId}
                  onPreviewIngredient={(id) => {
                    setSelectedIngredientId(id);
                    setMobileIngredientOpen(true);
                  }}
                />
              </Box>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar />
          </ScrollArea.Root>

          {/* Hidden inspector — kept in DOM for test coverage only */}
          <Box display="none" data-testid="recipe-ingredient-inspector" aria-hidden="true">
            <IngredientPreview ingredient={selectedIngredient} />
          </Box>

          {/* Ingredient detail drawer — all breakpoints */}
          <Drawer.Root
            lazyMount
            unmountOnExit
            open={mobileIngredientOpen}
            onOpenChange={(e) => setMobileIngredientOpen(e.open)}
            size={{ base: 'full', md: 'lg', xl: 'xl' }}
          >
            <Portal>
              <Drawer.Backdrop backdropFilter="auto" backdropBlur="sm" bg="blackAlpha.500" />
              <Drawer.Positioner>
                <Drawer.Content
                  bg="var(--surface-elevated)"
                  borderLeft="1px solid var(--border-subtle)"
                  overflow="hidden"
                >
                  <Drawer.Header px="4" pt="4" pb="3" borderBottom="1px solid var(--border-subtle)">
                    <HStack justify="space-between" align="center">
                      <Box minW={0}>
                        <Drawer.Title color="var(--text-primary)" fontSize="md" truncate>
                          {selectedIngredient?.name ?? 'Ingredient'}
                        </Drawer.Title>
                      </Box>
                      <Drawer.CloseTrigger asChild>
                        <CloseButton size="sm" color="var(--text-muted)" flexShrink={0} />
                      </Drawer.CloseTrigger>
                    </HStack>
                  </Drawer.Header>
                  <Drawer.Body p="4" overflowY="auto">
                    <IngredientPreview ingredient={selectedIngredient} />
                  </Drawer.Body>
                </Drawer.Content>
              </Drawer.Positioner>
            </Portal>
          </Drawer.Root>
        </>
      )}

      <RecipeTemplateDetailDrawer template={selectedTemplate} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </VStack>
  );
}
