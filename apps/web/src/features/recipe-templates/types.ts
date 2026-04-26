import type { RecipeTemplateId as ProtocolRecipeTemplateId } from '@hermes-recipes/protocol';
export { RECIPE_TEMPLATE_IDS } from '@hermes-recipes/protocol';

export type RecipeTemplateId = ProtocolRecipeTemplateId;

export const RECIPE_TEMPLATE_CATEGORY_IDS = ['commerce', 'communication', 'travel', 'research', 'operations', 'finance'] as const;
export type RecipeTemplateCategoryId = (typeof RECIPE_TEMPLATE_CATEGORY_IDS)[number];
export type RecipeTemplateGalleryCategory = 'all' | RecipeTemplateCategoryId;

export type TemplateTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export type RecipeTemplateLayout =
  | 'comparison-grid'
  | 'image-shortlist'
  | 'card-grid'
  | 'triage-board'
  | 'rules-builder'
  | 'list-detail'
  | 'balanced'
  | 'travel-compare'
  | 'timeline-tabs'
  | 'research-notebook'
  | 'workbench'
  | 'matrix'
  | 'kanban'
  | 'checklist';

export interface TemplateChip {
  label: string;
  tone?: TemplateTone;
}

export interface TemplateAction {
  label: string;
  tone?: TemplateTone;
  helper?: string;
}

export interface TemplateStat {
  label: string;
  value: string;
  helper?: string;
  tone?: TemplateTone;
  action?: string;
}

export interface TemplateField {
  label: string;
  value?: string;
  chips?: TemplateChip[];
  bullets?: string[];
  links?: Array<{
    label: string;
    href: string;
  }>;
  fullWidth?: boolean;
}

export interface TemplateListItem {
  title: string;
  subtitle?: string;
  meta?: string;
  chips?: TemplateChip[];
  actions?: string[];
}

export interface TemplateCardItem {
  title: string;
  subtitle?: string;
  meta?: string;
  imageLabel?: string;
  price?: string;
  chips?: TemplateChip[];
  bullets?: string[];
  footer?: string;
}

export interface TemplateTimelineItem {
  title: string;
  time: string;
  summary?: string;
  chips?: TemplateChip[];
}

export interface TemplateActivityItem {
  label: string;
  detail: string;
  timestamp?: string;
  tone?: TemplateTone;
}

export interface TemplateBoardCard {
  title: string;
  subtitle?: string;
  chips?: TemplateChip[];
  footer?: string;
}

export interface TemplateBoardColumn {
  label: string;
  tone?: TemplateTone;
  cards: TemplateBoardCard[];
}

export interface TemplateTableColumn {
  id: string;
  label: string;
  align?: 'start' | 'end' | 'center';
}

export interface TemplateTableCell {
  value: string;
  subvalue?: string;
  href?: string;
  tone?: TemplateTone;
  emphasis?: boolean;
}

export interface TemplateTableRow {
  id: string;
  label: string;
  cells: TemplateTableCell[];
}

export type RecipeTemplatePreviewSection =
  | {
      kind: 'hero';
      eyebrow?: string;
      title: string;
      summary: string;
      chips?: TemplateChip[];
      actions?: TemplateAction[];
    }
  | {
      kind: 'filter-strip';
      title?: string;
      filters: TemplateChip[];
      sortLabel?: string;
    }
  | {
      kind: 'action-bar';
      title?: string;
      actions: TemplateAction[];
    }
  | {
      kind: 'stats';
      title?: string;
      items: TemplateStat[];
    }
  | {
      kind: 'comparison-table';
      title: string;
      columns: TemplateTableColumn[];
      rows: TemplateTableRow[];
      footerChips?: TemplateChip[];
      footnote?: string;
    }
  | {
      kind: 'grouped-list';
      title: string;
      groups: Array<{
        id: string;
        label: string;
        tone?: TemplateTone;
        items: TemplateListItem[];
      }>;
    }
  | {
      kind: 'card-grid';
      title: string;
      columns?: 1 | 2 | 3;
      cards: TemplateCardItem[];
    }
  | {
      kind: 'detail-panel';
      title: string;
      eyebrow?: string;
      summary?: string;
      chips?: TemplateChip[];
      fields: TemplateField[];
      actions?: TemplateAction[];
      note?: string;
      noteTitle?: string;
    }
  | {
      kind: 'timeline';
      title: string;
      items: TemplateTimelineItem[];
    }
  | {
      kind: 'notes';
      title: string;
      lines: string[];
      actions?: TemplateAction[];
    }
  | {
      kind: 'activity-log';
      title: string;
      entries: TemplateActivityItem[];
    }
  | {
      kind: 'kanban';
      title: string;
      columns: TemplateBoardColumn[];
    }
  | {
      kind: 'confirmation';
      title: string;
      message: string;
      confirmLabel: string;
      secondaryLabel?: string;
      tone?: TemplateTone;
    }
  | {
      kind: 'split';
      title?: string;
      ratio?: 'balanced' | 'list-detail' | 'detail-list';
      left: RecipeTemplatePreviewSection[];
      right: RecipeTemplatePreviewSection[];
    }
  | {
      kind: 'tabs';
      title?: string;
      tabs: Array<{
        id: string;
        label: string;
        badge?: string;
      }>;
      activeTabId: string;
      panes: Record<string, RecipeTemplatePreviewSection[]>;
    }
  | {
      kind: 'accordion-list';
      title?: string;
      items: Array<{
        id: string;
        title: string;
        subtitle?: string;
        count?: string;
        tone?: TemplateTone;
        subjects?: string[];
        recommendation?: string;
        recommendationTone?: TemplateTone;
        detailHeader?: string;
        detailText?: string;
        evidenceBullets?: string[];
        actions?: TemplateAction[];
      }>;
    }
  | {
      kind: 'selectable-table';
      title?: string;
      columns: TemplateTableColumn[];
      rows: TemplateTableRow[];
      primaryAction: string;
      secondaryAction?: string;
    }
  | {
      kind: 'report';
      title: string;
      body: string;
      footnotes?: Array<{ id: string; label: string; url?: string }>;
    }
  | {
      kind: 'interactive-guest-list';
      title: string;
      guests: Array<{ id: string; name: string; meta?: string }>;
    }
  | {
      kind: 'interactive-checklist';
      title: string;
      items: Array<{ id: string; label: string; checked?: boolean }>;
    }
  | {
      kind: 'editable-notes';
      title: string;
      notes: string[];
    }
  | {
      kind: 'step-by-step-preview';
      prerequisites?: Array<{ id: string; label: string }>;
      steps: Array<{
        id: string;
        label: string;
        detail?: string;
        code?: string;
      }>;
    };

export interface RecipeTemplatePreviewSpec {
  headline: string;
  summary: string;
  sections: RecipeTemplatePreviewSection[];
}

export interface RecipeTemplatePopulationInstructions {
  summary: string;
  steps: string[];
  guardrails: string[];
}

export interface RecipeTemplateUpdateRules {
  patchPrefer: string[];
  replaceTriggers: string[];
  persistAcrossUpdates: string[];
  stableRegions: string[];
}

export interface RecipeTemplateSpec {
  id: RecipeTemplateId;
  name: string;
  category: RecipeTemplateCategoryId;
  useCase: string;
  purpose: string;
  primaryUserGoal: string;
  whenHermesShouldChoose: string;
  selectionSignals: string[];
  goodFor: string[];
  supports: string[];
  preferredLayout: RecipeTemplateLayout;
  supportedTabs: string[];
  idealDataShape: string[];
  requiredSections: string[];
  optionalSections: string[];
  requiredActions: string[];
  optionalActions: string[];
  emptyStateBehavior: string;
  loadingStateBehavior: string;
  errorStateBehavior: string;
  smallPaneAdaptationNotes: string[];
  references: string[];
  populationInstructions: RecipeTemplatePopulationInstructions;
  updateRules: RecipeTemplateUpdateRules;
  hiddenFromGallery?: boolean;
}

export interface RecipeTemplateDefinition extends RecipeTemplateSpec {
  preview: RecipeTemplatePreviewSpec;
}
