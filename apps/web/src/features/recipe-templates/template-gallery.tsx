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
  onInspectTemplate,
  omitTestIds = false,
  omitPreviews = false
}: {
  templates: RecipeTemplateDefinition[];
  activeCategory: RecipeTemplateGalleryCategory;
  omitTestIds?: boolean;
  omitPreviews?: boolean;
  selectedTemplateId: string;
  onCategoryChange: (category: RecipeTemplateGalleryCategory) => void;
  onSelectTemplate: (templateId: string) => void;
  onInspectTemplate: (templateId: string) => void;
}) {
  const _allButtonStyles = resolveTemplateGalleryFilterButtonStyles(activeCategory === 'all');

  return (
    <VStack align="stretch" gap="3" data-testid={omitTestIds ? undefined : 'spaces-template-gallery'}>
      <TemplateSurface>
        <VStack align="stretch" gap="4">
          <VStack align="start" gap="1">
            <Text fontSize="lg" fontWeight="600" color="var(--text-primary)">
              Recipe Book
            </Text>
            <Text color="var(--text-secondary)">
              Pre-built workspace templates for common use cases. Click a card to preview it, or start a chat to generate one.
            </Text>
          </VStack>

          {/* Filter chips — single horizontal scrollable row, no wrapping */}
          <Box
            overflowX="auto"
            css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
          >
            <HStack gap="1.5" flexWrap="nowrap" pb="1">
          <Button
            size="xs"
            rounded="var(--radius-pill)"
            h="6"
            px="3"
            fontSize="11px"
            fontWeight="500"
            bg={activeCategory === 'all' ? 'var(--surface-active)' : 'transparent'}
            border="1px solid var(--border-subtle)"
            color={activeCategory === 'all' ? 'var(--text-primary)' : 'var(--text-muted)'}
            _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
            onClick={() => onCategoryChange('all')}
            flexShrink={0}
          >
            All
          </Button>
          {RECIPE_TEMPLATE_CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <Button
                key={category.id}
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
                onClick={() => onCategoryChange(category.id)}
                flexShrink={0}
              >
                {category.label}
              </Button>
            );
          })}
        </HStack>
          </Box>
        </VStack>
      </TemplateSurface>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="5" alignItems="stretch">
        {templates.map((template) => {
          const selected = template.id === selectedTemplateId;

          return (
            <Box
              key={template.id}
              data-testid={omitTestIds ? undefined : `spaces-template-card-${template.id}`}
              cursor="pointer"
              onClick={() => onSelectTemplate(template.id)}
              _hover={{ bg: 'var(--surface-2)', transform: 'translateY(-1px)', transition: 'all 150ms ease', boxShadow: 'var(--shadow-sm)' }}
              rounded="8px"
              h="100%"
            >
              <TemplateSurface bg={selected ? 'rgba(37, 99, 235, 0.06)' : 'var(--surface-1)'} padding="3">
                <HStack align="start" gap="3">
                  {!omitPreviews ? <MiniaturePreview template={template} /> : null}
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
                    <Flex justify="flex-end" align="center">
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
