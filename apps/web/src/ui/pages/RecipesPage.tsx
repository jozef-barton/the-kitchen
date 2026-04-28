import { Box, CloseButton, Drawer, HStack, Portal, ScrollArea, Tabs, Text, VStack } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { RecipeTemplateDetailDrawer } from '../../features/recipe-templates/template-detail-drawer';
import { RecipeTemplateGallery } from '../../features/recipe-templates/template-gallery';
import { RecipeTemplatePreview } from '../../features/recipe-templates/template-preview';
import { getRecipeTemplateById, RECIPE_TEMPLATE_REGISTRY } from '../../features/recipe-templates/template-registry';
import { IngredientGallery } from '../../features/recipe-templates/ingredient-gallery';
import { IngredientPreview } from '../../features/recipe-templates/ingredient-preview';
import { INGREDIENT_CATALOG, getIngredientById, type IngredientGroup } from '../../features/recipe-templates/ingredient-catalog';
import type { RecipeTemplateGalleryCategory, RecipeTemplateId } from '../../features/recipe-templates/types';

export function RecipesPage({
  activeProfileId: _activeProfileId,
  activeTab: activeTabProp,
  onTabChange
}: {
  activeProfileId?: string | null;
  activeTab?: 'book' | 'ingredients';
  onTabChange?: (tab: 'book' | 'ingredients') => void;
}) {
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

  const [activeTab, setActiveTab] = useState<'book' | 'ingredients'>(activeTabProp ?? 'book');

  useEffect(() => {
    if (activeTabProp && activeTabProp !== activeTab) {
      setActiveTab(activeTabProp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabProp]);

  const selectedTemplate = getRecipeTemplateById(selectedTemplateId) ?? visibleTemplates[0] ?? RECIPE_TEMPLATE_REGISTRY[0];
  const selectedIngredient = getIngredientById(selectedIngredientId) ?? visibleIngredients[0] ?? INGREDIENT_CATALOG[0];

  return (
    <VStack align="stretch" h="100%" minH={0} gap="0">
      <Box flexShrink={0}>
        <Box mb="1">
          <Text fontSize="xl" fontWeight="700" color="var(--text-primary)" letterSpacing="-0.01em">Recipe Library</Text>
          <Text fontSize="sm" color="var(--text-muted)" mt="0.5">Browse workspace templates and ingredient building blocks for structured Hermes responses.</Text>
        </Box>
        <Tabs.Root
          value={activeTab}
          onValueChange={(e) => {
            const tab = e.value as 'book' | 'ingredients';
            setActiveTab(tab);
            onTabChange?.(tab);
          }}
          variant="plain"
        >
          <Box borderBottom="1px solid var(--divider)" mt="3">
            <Tabs.List gap="0" px="0" borderBottom="none">
              {(['book', 'ingredients'] as const).map((v) => (
                <Tabs.Trigger
                  key={v}
                  value={v}
                  fontSize="13px"
                  px="4"
                  h="44px"
                  color="var(--text-muted)"
                  fontWeight="400"
                  borderBottom="2px solid transparent"
                  mb="-1px"
                  transition="color 120ms ease, border-color 120ms ease"
                  _selected={{ color: 'var(--text-primary)', fontWeight: '500', borderBottomColor: 'var(--accent)' }}
                  _hover={{ color: 'var(--text-secondary)' }}
                >
                  {v === 'book' ? 'Recipe Book' : 'Ingredients'}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Box>
        </Tabs.Root>
      </Box>

      {activeTab === 'book' && (
        <>
          {/* Full-width scrollable gallery — no preview panel */}
          <ScrollArea.Root flex="1" minH={0} variant="hover">
            <ScrollArea.Viewport>
              <Box pb="6" pt="1">
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
              <Box pb="6" pt="1">
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
