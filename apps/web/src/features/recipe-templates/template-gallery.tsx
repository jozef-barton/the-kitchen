import { Box, Button, Flex, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { RECIPE_TEMPLATE_CATEGORIES } from './template-categories';
import { TemplateSurface } from './template-primitives';
import { RecipeTemplatePreview } from './template-preview';
import { resolveTemplateGalleryFilterButtonStyles } from './template-style-helpers';
import type { RecipeTemplateDefinition, RecipeTemplateGalleryCategory } from './types';

function MiniaturePreview({ template }: { template: RecipeTemplateDefinition }) {
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
        <RecipeTemplatePreview preview={template.preview} />
      </Box>
    </Box>
  );
}

export function RecipeTemplateGallery({
  templates,
  activeCategory,
  selectedTemplateId,
  onCategoryChange,
  onSelectTemplate,
  onInspectTemplate
}: {
  templates: RecipeTemplateDefinition[];
  activeCategory: RecipeTemplateGalleryCategory;
  selectedTemplateId: string;
  onCategoryChange: (category: RecipeTemplateGalleryCategory) => void;
  onSelectTemplate: (templateId: string) => void;
  onInspectTemplate: (templateId: string) => void;
}) {
  const allButtonStyles = resolveTemplateGalleryFilterButtonStyles(activeCategory === 'all');

  return (
    <VStack align="stretch" gap="3" data-testid="spaces-template-gallery">
      <TemplateSurface>
        <VStack align="stretch" gap="4">
          <Flex justify="space-between" align="end" gap="4" wrap="wrap">
            <VStack align="start" gap="1">
              <Text fontSize="lg" fontWeight="750" color="var(--text-primary)">
                Recipe Book
              </Text>
              <Text color="var(--text-secondary)">
                Curated templates for structured AI workspaces.
              </Text>
            </VStack>
            <Text fontSize="sm" color="var(--text-muted)">
              {templates.length} templates
            </Text>
          </Flex>

          <Flex gap="1.5" wrap="wrap">
            <Button
              size="xs"
              rounded="999px"
              h="6"
              px="3"
              fontSize="xs"
              bg={allButtonStyles.bg}
              border="1px solid var(--border-subtle)"
              color={allButtonStyles.color}
              _dark={{
                color: allButtonStyles.darkColor
              }}
              onClick={() => onCategoryChange('all')}
            >
              All
            </Button>
            {RECIPE_TEMPLATE_CATEGORIES.map((category) => {
              const buttonStyles = resolveTemplateGalleryFilterButtonStyles(activeCategory === category.id);
              return (
                <Button
                  key={category.id}
                  size="xs"
                  rounded="999px"
                  h="6"
                  px="3"
                  fontSize="xs"
                  bg={buttonStyles.bg}
                  border="1px solid var(--border-subtle)"
                  color={buttonStyles.color}
                  _dark={{
                    color: buttonStyles.darkColor
                  }}
                  onClick={() => onCategoryChange(category.id)}
                >
                  {category.label}
                </Button>
              );
            })}
          </Flex>
        </VStack>
      </TemplateSurface>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="3" alignItems="stretch">
        {templates.map((template) => {
          const selected = template.id === selectedTemplateId;

          return (
            <Box
              key={template.id}
              data-testid={`spaces-template-card-${template.id}`}
              cursor="pointer"
              onClick={() => onSelectTemplate(template.id)}
              _hover={{ bg: 'var(--surface-2)', transform: 'translateY(-1px)', transition: 'all 150ms ease', boxShadow: 'var(--shadow-sm)' }}
              rounded="8px"
              h="100%"
            >
              <TemplateSurface bg={selected ? 'rgba(37, 99, 235, 0.06)' : 'var(--surface-1)'} padding="3">
                <HStack align="start" gap="3">
                  <MiniaturePreview template={template} />
                  <VStack align="stretch" gap="2" flex="1" minW={0}>
                    <VStack align="start" gap="1" minW={0}>
                      <Text fontSize="10px" fontWeight="600" letterSpacing="0" textTransform="uppercase" color="var(--text-muted)">
                        {template.category}
                      </Text>
                      <Text fontSize="sm" fontWeight="750" color="var(--text-primary)" lineHeight="1.25">
                        {template.name}
                      </Text>
                      <Text fontSize="xs" color="var(--text-secondary)" lineClamp={3}>
                        {template.purpose}
                      </Text>
                    </VStack>
                    <Flex justify="space-between" align="center" gap="1" wrap="wrap">
                      <Text fontSize="10px" color="var(--text-muted)">Workspace recipe</Text>
                      <Button
                        size="xs"
                        rounded="6px"
                        variant="ghost"
                        fontSize="xs"
                        color="var(--text-muted)"
                        h="5"
                        px="1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTemplate(template.id);
                          onInspectTemplate(template.id);
                        }}
                      >
                        Details
                      </Button>
                    </Flex>
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
