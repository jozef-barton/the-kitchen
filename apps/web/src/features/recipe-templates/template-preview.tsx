import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import {
  TemplateAccordionList,
  TemplateActionBar,
  TemplateCardGrid,
  TemplateComparisonTable,
  TemplateConfirmationBlock,
  TemplateDetailPanel,
  TemplateEditableNotes,
  TemplateSectionHeader,
  TemplateFilterStrip,
  TemplateGroupedList,
  TemplateInteractiveChecklist,
  TemplateInteractiveGuestList,
  TemplateKanbanBoard,
  TemplateNotesPanel,
  TemplateReportSection,
  TemplateSelectableTable,
  TemplateStatStrip,
  TemplateStepByStepPreview,
  TemplateSurface,
  TemplateTimeline,
  TemplateActivityLog
} from './template-primitives';
import type { RecipeTemplatePreviewSection, RecipeTemplatePreviewSpec } from './types';

export function RecipeTemplatePreview({
  preview
}: {
  preview: RecipeTemplatePreviewSpec;
}) {
  const contentSections = preview.sections.filter((section) => section.kind !== 'hero');

  return (
    <VStack align="stretch" gap="4">
      {contentSections.map((section, index) => (
        <RecipeTemplatePreviewSectionRenderer key={`${section.kind}-${index}`} section={section} />
      ))}
    </VStack>
  );
}

function RecipeTemplatePreviewSectionRenderer({ section }: { section: RecipeTemplatePreviewSection }) {
  switch (section.kind) {
    case 'hero':
      return null;
    case 'filter-strip':
      return <TemplateFilterStrip title={section.title} filters={section.filters} sortLabel={section.sortLabel} />;
    case 'action-bar':
      return <TemplateActionBar title={section.title} actions={section.actions} />;
    case 'stats':
      return <TemplateStatStrip title={section.title} items={section.items} />;
    case 'comparison-table':
      return <TemplateComparisonTable {...section} />;
    case 'grouped-list':
      return <TemplateGroupedList {...section} />;
    case 'card-grid':
      return <TemplateCardGrid {...section} />;
    case 'detail-panel':
      return <TemplateDetailPanel {...section} />;
    case 'timeline':
      return <TemplateTimeline {...section} />;
    case 'notes':
      return <TemplateNotesPanel {...section} />;
    case 'activity-log':
      return <TemplateActivityLog {...section} />;
    case 'kanban':
      return <TemplateKanbanBoard {...section} />;
    case 'confirmation':
      return <TemplateConfirmationBlock {...section} />;
    case 'accordion-list':
      return <TemplateAccordionList {...section} />;
    case 'selectable-table':
      return <TemplateSelectableTable {...section} />;
    case 'report':
      return <TemplateReportSection {...section} />;
    case 'interactive-guest-list':
      return <TemplateInteractiveGuestList {...section} />;
    case 'interactive-checklist':
      return <TemplateInteractiveChecklist {...section} />;
    case 'editable-notes':
      return <TemplateEditableNotes {...section} />;
    case 'step-by-step-preview':
      return <TemplateStepByStepPreview {...section} />;
    case 'split':
      return (
        <Flex
          gap="4"
          direction={{
            base: 'column',
            xl: section.ratio === 'detail-list' ? 'row-reverse' : 'row'
          }}
          align="stretch"
        >
          <Box flex={section.ratio === 'balanced' ? '1' : '1.15'} minW={0}>
            <VStack align="stretch" gap="4">
              {section.left.map((child, index) => (
                <RecipeTemplatePreviewSectionRenderer key={`left-${index}-${child.kind}`} section={child} />
              ))}
            </VStack>
          </Box>
          <Box flex={section.ratio === 'balanced' ? '1' : '0.9'} minW={0}>
            <VStack align="stretch" gap="4">
              {section.right.map((child, index) => (
                <RecipeTemplatePreviewSectionRenderer key={`right-${index}-${child.kind}`} section={child} />
              ))}
            </VStack>
          </Box>
        </Flex>
      );
    case 'tabs':
      return <TemplateTabsPreview section={section} />;
    default:
      return null;
  }
}

function TemplateTabsPreview({
  section
}: {
  section: Extract<RecipeTemplatePreviewSection, { kind: 'tabs' }>;
}) {
  const [activeTabId, setActiveTabId] = useState(section.activeTabId);
  const activeTabContent = useMemo(() => section.panes[activeTabId] ?? [], [activeTabId, section.panes]);

  return (
    <TemplateSurface>
      <VStack align="stretch" gap="4">
        {section.title ? <TemplateSectionHeader title={section.title} /> : null}
        <Flex gap="2" wrap="wrap">
          {section.tabs.map((tab) => {
            const active = tab.id === activeTabId;
            return (
              <Button
                key={tab.id}
                type="button"
                rounded="8px"
                border="1px solid var(--border-subtle)"
                bg={active ? 'var(--surface-accent)' : 'var(--surface-2)'}
                px="3.5"
                py="2"
                textAlign="left"
                height="auto"
                minW="0"
                onClick={() => setActiveTabId(tab.id)}
              >
                <Flex gap="2" align="center">
                  <Text fontSize="sm" fontWeight="700" color="var(--text-primary)">
                    {tab.label}
                  </Text>
                  {tab.badge ? (
                    <Text fontSize="xs" color="var(--text-muted)">
                      {tab.badge}
                    </Text>
                  ) : null}
                </Flex>
              </Button>
            );
          })}
        </Flex>
        <VStack align="stretch" gap="4">
          {activeTabContent.map((child, index) => (
            <RecipeTemplatePreviewSectionRenderer key={`tab-${activeTabId}-${index}-${child.kind}`} section={child} />
          ))}
        </VStack>
      </VStack>
    </TemplateSurface>
  );
}
