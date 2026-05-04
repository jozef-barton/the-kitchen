import { useState } from 'react';
import type { ReactNode } from 'react';
import { Box, CloseButton, Drawer, Flex, HStack, Separator, Skeleton, Tabs, Text, VStack } from '@chakra-ui/react';
import { RECIPE_TEMPLATE_CATEGORIES } from './template-categories';
import { RecipeTemplatePreview } from './template-preview';
import { TemplateChipPill, TemplateSectionHeader, TemplateSurface } from './template-primitives';
import type { RecipeTemplateDefinition, RecipeTemplatePreviewSection } from './types';

function InfoPane({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box borderLeft="3px solid var(--accent)" pl="4" py="2">
      <Text fontSize="xs" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0" mb="1.5">
        {label}
      </Text>
      {children}
    </Box>
  );
}

type PreviewState = 'finished' | 'loading' | 'empty' | 'degraded';


export function RecipeTemplateDetailDrawer({
  template,
  open,
  onOpenChange
}: {
  template: RecipeTemplateDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [previewState, setPreviewState] = useState<PreviewState>('finished');

  if (!template) {
    return null;
  }

  const category = RECIPE_TEMPLATE_CATEGORIES.find((item) => item.id === template.category);

  return (
    <Drawer.Root lazyMount unmountOnExit open={open} onOpenChange={(event) => onOpenChange(event.open)} size={{ base: 'full', md: 'lg', xl: 'xl' }}>
      <Drawer.Backdrop backdropFilter="auto" backdropBlur="sm" bg="blackAlpha.500" />
        <Drawer.Positioner>
          <Drawer.Content bg="var(--surface-elevated)" borderLeft="1px solid var(--border-subtle)" data-testid="recipe-template-detail-drawer">
          <Drawer.Header>
            <Flex justify="space-between" align="start" gap="4">
              <VStack align="start" gap="1.5">
                <Drawer.Title color="var(--text-primary)">{template.name}</Drawer.Title>
                <Text fontSize="sm" color="var(--text-secondary)">
                  {template.useCase}
                </Text>
              </VStack>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" aria-label="Close template detail" />
              </Drawer.CloseTrigger>
            </Flex>
          </Drawer.Header>
          <Drawer.Body>
            <Tabs.Root
              defaultValue="preview"
              variant="plain"
              css={{
                '--tabs-indicator-bg': 'var(--surface-1)',
                '--tabs-indicator-shadow': 'var(--shadow-xs)',
                '--tabs-trigger-radius': '8px'
              }}
            >
              <Box overflowX="auto" mb="4" flexShrink={0} css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                <Tabs.List rounded="8px" bg="var(--surface-2)" border="1px solid var(--border-subtle)" p="1" minW="max-content">
                  <Tabs.Trigger value="preview" fontSize="xs" px="3">Preview</Tabs.Trigger>
                  <Tabs.Trigger value="info" fontSize="xs" px="3">Info</Tabs.Trigger>
                  <Tabs.Trigger value="instructions" fontSize="xs" px="3">Instructions</Tabs.Trigger>
                  <Tabs.Trigger value="update" fontSize="xs" px="3">Update Behavior</Tabs.Trigger>
                  <Tabs.Trigger value="contract" fontSize="xs" px="3">UI Contract</Tabs.Trigger>
                  <Tabs.Indicator />
                </Tabs.List>
              </Box>

              <Tabs.Content value="info">
                <VStack align="stretch" gap="4">
                  <InfoPane label={category?.label ?? template.category}>
                    <Text fontSize="lg" fontWeight="600" color="var(--text-primary)">{template.purpose}</Text>
                    <Flex gap="2" wrap="wrap" mt="2">
                      {template.goodFor.map((item) => (
                        <TemplateChipPill key={`${template.id}-drawer-good-${item}`} chip={{ label: item }} />
                      ))}
                    </Flex>
                  </InfoPane>

                  <InfoPane label="When Hermes should choose this">
                    <Text color="var(--text-secondary)">{template.whenHermesShouldChoose}</Text>
                    <Flex gap="2" wrap="wrap" mt="2">
                      {template.selectionSignals.map((item) => (
                        <TemplateChipPill key={`${template.id}-signal-${item}`} chip={{ label: item }} />
                      ))}
                    </Flex>
                  </InfoPane>

                  <InfoPane label="Supports">
                    <Flex gap="2" wrap="wrap">
                      {template.supports.map((item) => (
                        <TemplateChipPill key={`${template.id}-support-${item}`} chip={{ label: item, tone: 'accent' }} />
                      ))}
                    </Flex>
                  </InfoPane>
                </VStack>
              </Tabs.Content>

              <Tabs.Content value="preview">
                <VStack align="stretch" gap="3">
                  <HStack gap="2" flexShrink={0}>
                    {(['finished', 'loading', 'empty', 'degraded'] as const).map((state) => (
                      <Box
                        key={state}
                        as="button"
                        px="3"
                        py="1.5"
                        rounded="full"
                        fontSize="xs"
                        fontWeight="600"
                        cursor="pointer"
                        border="1px solid"
                        borderColor={previewState === state ? 'var(--accent)' : 'var(--border-subtle)'}
                        bg={previewState === state ? 'var(--surface-accent)' : 'transparent'}
                        color={previewState === state ? 'var(--accent)' : 'var(--text-secondary)'}
                        onClick={() => setPreviewState(state)}
                      >
                        {state.charAt(0).toUpperCase() + state.slice(1)}
                      </Box>
                    ))}
                  </HStack>

                  {previewState === 'finished' ? (
                    <RecipeTemplatePreview preview={template.preview} />
                  ) : previewState === 'loading' ? (
                    <LoadingStatePreview sections={template.preview.sections} />
                  ) : previewState === 'empty' ? (
                    <EmptyStatePreview sections={template.preview.sections} />
                  ) : (
                    <DegradedStatePreview sections={template.preview.sections} />
                  )}
                </VStack>
              </Tabs.Content>

              <Tabs.Content value="instructions">
                <VStack align="stretch" gap="4">
                  <Text color="var(--text-secondary)">{template.populationInstructions.summary}</Text>
                  <Separator borderColor="var(--border-subtle)" />
                  <Box>
                    <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">Populate in this order</Text>
                    <VStack align="stretch" mt="2.5" gap="2">
                      {template.populationInstructions.steps.map((step) => (
                        <Text key={step} fontSize="sm" color="var(--text-secondary)">{step}</Text>
                      ))}
                    </VStack>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">Guardrails</Text>
                    <VStack align="stretch" mt="2.5" gap="2">
                      {template.populationInstructions.guardrails.map((rule) => (
                        <Text key={rule} fontSize="sm" color="var(--text-secondary)">{rule}</Text>
                      ))}
                    </VStack>
                  </Box>
                </VStack>
              </Tabs.Content>

              <Tabs.Content value="update">
                <VStack align="stretch" gap="4">
                  <Box>
                    <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">Patch in place</Text>
                    <VStack align="stretch" mt="2.5" gap="2">
                      {template.updateRules.patchPrefer.map((item) => (
                        <Text key={item} fontSize="sm" color="var(--text-secondary)">{item}</Text>
                      ))}
                    </VStack>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">Replace only when</Text>
                    <VStack align="stretch" mt="2.5" gap="2">
                      {template.updateRules.replaceTriggers.map((item) => (
                        <Text key={item} fontSize="sm" color="var(--text-secondary)">{item}</Text>
                      ))}
                    </VStack>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">Persist across updates</Text>
                    <Flex mt="2.5" gap="2" wrap="wrap">
                      {template.updateRules.persistAcrossUpdates.map((item) => (
                        <TemplateChipPill key={`${template.id}-persist-${item}`} chip={{ label: item, tone: 'success' }} />
                      ))}
                    </Flex>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">Stable regions</Text>
                    <Flex mt="2.5" gap="2" wrap="wrap">
                      {template.updateRules.stableRegions.map((item) => (
                        <TemplateChipPill key={`${template.id}-stable-${item}`} chip={{ label: item, tone: 'accent' }} />
                      ))}
                    </Flex>
                  </Box>
                </VStack>
              </Tabs.Content>

              <Tabs.Content value="contract">
                <VStack align="stretch" gap="4">
                  <Box>
                    <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">Required sections</Text>
                    <Flex mt="2.5" gap="2" wrap="wrap">
                      {template.requiredSections.map((item) => (
                        <TemplateChipPill key={`${template.id}-section-${item}`} chip={{ label: item }} />
                      ))}
                    </Flex>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">Required actions</Text>
                    <Flex mt="2.5" gap="2" wrap="wrap">
                      {template.requiredActions.map((item) => (
                        <TemplateChipPill key={`${template.id}-action-${item}`} chip={{ label: item, tone: 'accent' }} />
                      ))}
                    </Flex>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">Supported tabs</Text>
                    <Flex mt="2.5" gap="2" wrap="wrap">
                      {template.supportedTabs.map((item) => (
                        <TemplateChipPill key={`${template.id}-tab-${item}`} chip={{ label: item }} />
                      ))}
                    </Flex>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">Expected data shape</Text>
                    <VStack align="stretch" mt="2.5" gap="2">
                      {template.idealDataShape.map((item) => (
                        <Text key={item} fontSize="sm" color="var(--text-secondary)">{item}</Text>
                      ))}
                    </VStack>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">References</Text>
                    <Flex mt="2.5" gap="2" wrap="wrap">
                      {template.references.map((item) => (
                        <TemplateChipPill key={`${template.id}-ref-${item}`} chip={{ label: item }} />
                      ))}
                    </Flex>
                  </Box>
                </VStack>
              </Tabs.Content>
            </Tabs.Root>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}

/* ---------- Section kind label helper ---------- */

const SECTION_KIND_LABELS: Record<string, string> = {
  'filter-strip': 'Filter Strip',
  'action-bar': 'Action Bar',
  stats: 'Stats',
  'comparison-table': 'Comparison Table',
  'grouped-list': 'Grouped List',
  'card-grid': 'Card Grid',
  'detail-panel': 'Detail Panel',
  timeline: 'Timeline',
  notes: 'Notes',
  'activity-log': 'Activity Log',
  kanban: 'Kanban Board',
  confirmation: 'Confirmation',
  split: 'Split Layout',
  tabs: 'Tabs'
};

function sectionLabel(section: RecipeTemplatePreviewSection): string {
  return (section as { title?: string }).title ?? SECTION_KIND_LABELS[section.kind] ?? section.kind;
}

/* ---------- Loading state skeleton helpers ---------- */

function SkeletonRows({ count, spacing = '2.5' }: { count: number; spacing?: string }) {
  return (
    <VStack align="stretch" gap={spacing}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height="14px" width={i % 3 === 0 ? '90%' : i % 3 === 1 ? '75%' : '60%'} rounded="4px" />
      ))}
    </VStack>
  );
}

function LoadingSectionSkeleton({ section }: { section: RecipeTemplatePreviewSection }) {
  switch (section.kind) {
    case 'hero':
      return null;
    case 'comparison-table':
      return (
        <TemplateSurface>
          <VStack align="stretch" gap="3">
            <Skeleton height="16px" width="40%" rounded="4px" />
            <Flex gap="3">
              {section.columns.map((col) => (
                <Box key={col.id} flex="1">
                  <VStack align="stretch" gap="2">
                    <Skeleton height="12px" width="80%" rounded="4px" />
                    {section.rows.map((row) => (
                      <Skeleton key={row.id} height="14px" width="100%" rounded="4px" />
                    ))}
                  </VStack>
                </Box>
              ))}
            </Flex>
          </VStack>
        </TemplateSurface>
      );
    case 'grouped-list':
      return (
        <TemplateSurface>
          <VStack align="stretch" gap="3">
            <Skeleton height="16px" width="35%" rounded="4px" />
            {section.groups.map((group) => (
              <VStack key={group.id} align="stretch" gap="2">
                <Skeleton height="12px" width="25%" rounded="4px" />
                {group.items.map((_, idx) => (
                  <Flex key={idx} gap="2" align="center">
                    <Skeleton height="12px" width="12px" rounded="2px" flexShrink={0} />
                    <Skeleton height="14px" width={idx % 2 === 0 ? '70%' : '55%'} rounded="4px" />
                  </Flex>
                ))}
              </VStack>
            ))}
          </VStack>
        </TemplateSurface>
      );
    case 'detail-panel':
      return (
        <TemplateSurface>
          <VStack align="stretch" gap="3">
            <Skeleton height="10px" width="20%" rounded="4px" />
            <Skeleton height="18px" width="50%" rounded="4px" />
            <Skeleton height="12px" width="80%" rounded="4px" />
            {section.fields.map((_, idx) => (
              <Flex key={idx} gap="3" align="center">
                <Skeleton height="12px" width="30%" rounded="4px" />
                <Skeleton height="12px" width="45%" rounded="4px" />
              </Flex>
            ))}
          </VStack>
        </TemplateSurface>
      );
    case 'card-grid':
      return (
        <TemplateSurface>
          <VStack align="stretch" gap="3">
            <Skeleton height="16px" width="30%" rounded="4px" />
            <Flex gap="3" wrap="wrap">
              {section.cards.map((_, idx) => (
                <Box key={idx} flex="1" minW="140px">
                  <VStack align="stretch" gap="2" p="3" rounded="8px" border="1px solid var(--border-subtle)">
                    <Skeleton height="60px" width="100%" rounded="6px" />
                    <Skeleton height="14px" width="70%" rounded="4px" />
                    <Skeleton height="12px" width="50%" rounded="4px" />
                  </VStack>
                </Box>
              ))}
            </Flex>
          </VStack>
        </TemplateSurface>
      );
    case 'stats':
      return (
        <TemplateSurface>
          <Flex gap="4">
            {section.items.map((_, idx) => (
              <Box key={idx} flex="1">
                <VStack align="start" gap="1.5">
                  <Skeleton height="10px" width="60%" rounded="4px" />
                  <Skeleton height="22px" width="40%" rounded="4px" />
                </VStack>
              </Box>
            ))}
          </Flex>
        </TemplateSurface>
      );
    case 'timeline':
      return (
        <TemplateSurface>
          <VStack align="stretch" gap="3">
            <Skeleton height="16px" width="30%" rounded="4px" />
            {section.items.map((_, idx) => (
              <Flex key={idx} gap="3" align="start">
                <Skeleton height="10px" width="10px" rounded="full" flexShrink={0} mt="1" />
                <VStack align="stretch" gap="1" flex="1">
                  <Skeleton height="14px" width={idx % 2 === 0 ? '65%' : '50%'} rounded="4px" />
                  <Skeleton height="10px" width="30%" rounded="4px" />
                </VStack>
              </Flex>
            ))}
          </VStack>
        </TemplateSurface>
      );
    case 'kanban':
      return (
        <TemplateSurface>
          <VStack align="stretch" gap="3">
            <Skeleton height="16px" width="30%" rounded="4px" />
            <Flex gap="3">
              {section.columns.map((col, cIdx) => (
                <Box key={cIdx} flex="1">
                  <VStack align="stretch" gap="2">
                    <Skeleton height="12px" width="60%" rounded="4px" />
                    {col.cards.map((_, rIdx) => (
                      <Skeleton key={rIdx} height="48px" width="100%" rounded="6px" />
                    ))}
                  </VStack>
                </Box>
              ))}
            </Flex>
          </VStack>
        </TemplateSurface>
      );
    case 'split':
      return (
        <Flex gap="4" direction={{ base: 'column', xl: 'row' }} align="stretch">
          <Box flex="1" minW={0}>
            <VStack align="stretch" gap="4">
              {section.left.map((child, idx) => (
                <LoadingSectionSkeleton key={`left-${idx}`} section={child} />
              ))}
            </VStack>
          </Box>
          <Box flex="1" minW={0}>
            <VStack align="stretch" gap="4">
              {section.right.map((child, idx) => (
                <LoadingSectionSkeleton key={`right-${idx}`} section={child} />
              ))}
            </VStack>
          </Box>
        </Flex>
      );
    case 'tabs':
      return (
        <TemplateSurface>
          <VStack align="stretch" gap="3">
            <Flex gap="2">
              {section.tabs.map((tab) => (
                <Skeleton key={tab.id} height="32px" width="80px" rounded="full" />
              ))}
            </Flex>
            <SkeletonRows count={4} />
          </VStack>
        </TemplateSurface>
      );
    case 'accordion-list':
      return (
        <TemplateSurface>
          <VStack align="stretch" gap="2.5">
            {(section.items ?? []).map((item, idx) => (
              <Flex key={item.id ?? idx} justify="space-between" align="center" gap="3">
                <VStack align="start" gap="1" flex="1">
                  <Skeleton height="13px" width={idx % 2 === 0 ? '60%' : '45%'} rounded="4px" />
                  <Skeleton height="10px" width={idx % 2 === 0 ? '80%' : '65%'} rounded="4px" />
                </VStack>
                <Skeleton height="10px" width="40px" rounded="4px" />
              </Flex>
            ))}
          </VStack>
        </TemplateSurface>
      );
    default:
      return (
        <TemplateSurface>
          <VStack align="stretch" gap="2.5">
            <Skeleton height="16px" width="35%" rounded="4px" />
            <SkeletonRows count={3} />
          </VStack>
        </TemplateSurface>
      );
  }
}

function LoadingStatePreview({ sections }: { sections: RecipeTemplatePreviewSection[] }) {
  const contentSections = sections.filter((s) => s.kind !== 'hero');
  return (
    <VStack align="stretch" gap="4">
      {contentSections.map((section, idx) => (
        <LoadingSectionSkeleton key={`loading-${section.kind}-${idx}`} section={section} />
      ))}
    </VStack>
  );
}

/* ---------- Empty state ---------- */

function EmptySectionShell({ section }: { section: RecipeTemplatePreviewSection }) {
  if (section.kind === 'hero') return null;

  if (section.kind === 'split') {
    return (
      <Flex gap="4" direction={{ base: 'column', xl: 'row' }} align="stretch">
        <Box flex="1" minW={0}>
          <VStack align="stretch" gap="4">
            {section.left.map((child, idx) => (
              <EmptySectionShell key={`left-${idx}`} section={child} />
            ))}
          </VStack>
        </Box>
        <Box flex="1" minW={0}>
          <VStack align="stretch" gap="4">
            {section.right.map((child, idx) => (
              <EmptySectionShell key={`right-${idx}`} section={child} />
            ))}
          </VStack>
        </Box>
      </Flex>
    );
  }

  if (section.kind === 'tabs') {
    return (
      <Box
        rounded="8px"
        border="2px dashed var(--border-subtle)"
        px="5"
        py="8"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="2"
      >
        <Text fontSize="xs" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
          Tabs
        </Text>
        <Flex gap="2" mb="1">
          {section.tabs.map((tab) => (
            <Box key={tab.id} px="3" py="1" rounded="full" border="1px dashed var(--border-subtle)">
              <Text fontSize="xs" color="var(--text-muted)">{tab.label}</Text>
            </Box>
          ))}
        </Flex>
        <Text fontSize="sm" color="var(--text-muted)">Waiting for data</Text>
      </Box>
    );
  }

  const kindLabel = SECTION_KIND_LABELS[section.kind] ?? section.kind;

  return (
    <Box
      rounded="8px"
      border="2px dashed var(--border-subtle)"
      px="5"
      py="8"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="1.5"
    >
      <Text fontSize="xs" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
        {kindLabel}
      </Text>
      <Text fontSize="sm" color="var(--text-muted)">Waiting for data</Text>
    </Box>
  );
}

function EmptyStatePreview({ sections }: { sections: RecipeTemplatePreviewSection[] }) {
  const contentSections = sections.filter((s) => s.kind !== 'hero');
  return (
    <VStack align="stretch" gap="4">
      {contentSections.map((section, idx) => (
        <EmptySectionShell key={`empty-${section.kind}-${idx}`} section={section} />
      ))}
    </VStack>
  );
}

/* ---------- Degraded state ---------- */

function DegradedSectionRenderer({ section }: { section: RecipeTemplatePreviewSection }) {
  if (section.kind === 'hero') return null;

  if (section.kind === 'split') {
    return (
      <Flex gap="4" direction={{ base: 'column', xl: 'row' }} align="stretch">
        <Box flex="1" minW={0}>
          <VStack align="stretch" gap="4">
            {section.left.map((child, idx) => (
              <DegradedSectionRenderer key={`left-${idx}`} section={child} />
            ))}
          </VStack>
        </Box>
        <Box flex="1" minW={0}>
          <VStack align="stretch" gap="4">
            {section.right.map((child, idx) => (
              <DegradedSectionRenderer key={`right-${idx}`} section={child} />
            ))}
          </VStack>
        </Box>
      </Flex>
    );
  }

  const title = sectionLabel(section);
  const skeletonCount = section.kind === 'stats' ? (section.items?.length ?? 3) : 3;

  return (
    <TemplateSurface>
      <Box borderLeft="3px solid" borderLeftColor="red.300" pl="3">
        <VStack align="stretch" gap="2.5">
          <HStack gap="1.5">
            <Text fontSize="xs" lineHeight="1">{'\u274C'}</Text>
            <TemplateSectionHeader title={title} />
          </HStack>
          <Box opacity={0.5}>
            <SkeletonRows count={skeletonCount} />
          </Box>
        </VStack>
      </Box>
    </TemplateSurface>
  );
}

function DegradedStatePreview({ sections }: { sections: RecipeTemplatePreviewSection[] }) {
  const contentSections = sections.filter((s) => s.kind !== 'hero');
  return (
    <VStack align="stretch" gap="4">
      {contentSections.map((section, idx) => (
        <DegradedSectionRenderer key={`degraded-${section.kind}-${idx}`} section={section} />
      ))}
    </VStack>
  );
}
