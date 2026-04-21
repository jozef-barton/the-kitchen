import { z } from 'zod';
import {
  RecipeTemplateBoardCardSchema,
  RecipeTemplateIdSchema,
  RecipeTemplateCardItemSchema,
  RecipeTemplateChipSchema,
  RecipeTemplateFieldSchema,
  RecipeTemplateListItemSchema,
  RecipeTemplateStatSchema,
  RecipeTemplateTableColumnSchema,
  RecipeTemplateTableRowSchema,
  RecipeTemplateTimelineItemSchema,
  RecipeTemplateToneSchema
} from './recipe-template-schemas';

const OptionalTextSchema = z.preprocess((value) => (value === null ? undefined : value), z.string().min(1).optional());

export const RecipeTemplateSelectionHintsSchema = z
  .object({
    primaryEntity: OptionalTextSchema,
    currentTemplateId: RecipeTemplateIdSchema.optional(),
    suggestedTransitionFrom: RecipeTemplateIdSchema.optional()
  })
  .strict();
export type RecipeTemplateSelectionHints = z.infer<typeof RecipeTemplateSelectionHintsSchema>;

// Mutation intent — detected when a user asks to change how a rendered recipe looks or is structured.
export const RecipeMutationKindSchema = z.enum([
  'change_layout',    // "show as kanban", "redo as cards", "switch to a comparison"
  'change_visual',    // "more pictures", "add logos", "make it more visual"
  'add_content',      // "add a stats section", "include a timeline"
  'remove_content',   // "drop the notes", "remove the checklist"
  'refine_existing',  // "only show top 3", "tighten the table"
  'switch_recipe'     // "use a different recipe for this"
]);
export type RecipeMutationKind = z.infer<typeof RecipeMutationKindSchema>;

export const RecipeMutationIntentSchema = z
  .object({
    kind: RecipeMutationKindSchema,
    wantsImages: z.boolean().default(false),
    wantsCards: z.boolean().default(false),
    wantsCharts: z.boolean().default(false),
    wantsTable: z.boolean().default(false),
    wantsKanban: z.boolean().default(false),
    wantsTimeline: z.boolean().default(false),
    wantsFewerItems: z.boolean().default(false),
    wantsMoreItems: z.boolean().default(false),
    targetTemplateHint: z.string().optional(),
    mutationSummary: z.string().min(1)
  })
  .strict();
export type RecipeMutationIntent = z.infer<typeof RecipeMutationIntentSchema>;

export const RecipeTemplateSelectionModeSchema = z.enum(['fill', 'update', 'switch']);
export type RecipeTemplateSelectionMode = z.infer<typeof RecipeTemplateSelectionModeSchema>;

export const RecipeTemplateSelectionSchema = z
  .object({
    kind: z.literal('recipe_template_selection'),
    schemaVersion: z.literal('recipe_template_selection/v2'),
    templateId: RecipeTemplateIdSchema,
    mode: RecipeTemplateSelectionModeSchema.default('fill'),
    reason: z.string().min(1),
    confidence: z.number().min(0).max(1),
    hints: RecipeTemplateSelectionHintsSchema.optional()
  })
  .strict();
export type RecipeTemplateSelection = z.infer<typeof RecipeTemplateSelectionSchema>;

export const RecipeTemplateAuthoringLinkSchema = z
  .object({
    label: z.string().min(1),
    href: z.string().min(1)
  })
  .strict();
export type RecipeTemplateAuthoringLink = z.infer<typeof RecipeTemplateAuthoringLinkSchema>;

export const RecipeTemplateAuthoringListItemSchema = RecipeTemplateListItemSchema.omit({
  actions: true
})
  .extend({
    bullets: z.array(z.string().min(1)).default([]),
    links: z.array(RecipeTemplateAuthoringLinkSchema).default([])
  })
  .strict();
export type RecipeTemplateAuthoringListItem = z.infer<typeof RecipeTemplateAuthoringListItemSchema>;

export const RecipeTemplateAuthoringGroupSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    tone: RecipeTemplateToneSchema.optional(),
    items: z.array(RecipeTemplateAuthoringListItemSchema).default([])
  })
  .strict();
export type RecipeTemplateAuthoringGroup = z.infer<typeof RecipeTemplateAuthoringGroupSchema>;

export const RecipeTemplateAuthoringCardItemSchema = RecipeTemplateCardItemSchema.omit({
  actions: true
})
  .extend({
    links: z.array(RecipeTemplateAuthoringLinkSchema).default([])
  })
  .strict();
export type RecipeTemplateAuthoringCardItem = z.infer<typeof RecipeTemplateAuthoringCardItemSchema>;

export const RecipeTemplateAuthoringTimelineItemSchema = RecipeTemplateTimelineItemSchema.omit({
  actions: true
})
  .extend({
    links: z.array(RecipeTemplateAuthoringLinkSchema).default([])
  })
  .strict();
export type RecipeTemplateAuthoringTimelineItem = z.infer<typeof RecipeTemplateAuthoringTimelineItemSchema>;

export const RecipeTemplateAuthoringBoardCardSchema = RecipeTemplateBoardCardSchema.omit({
  actions: true
})
  .extend({
    links: z.array(RecipeTemplateAuthoringLinkSchema).default([])
  })
  .strict();
export type RecipeTemplateAuthoringBoardCard = z.infer<typeof RecipeTemplateAuthoringBoardCardSchema>;

export const RecipeTemplateAuthoringBoardColumnSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    tone: RecipeTemplateToneSchema.optional(),
    cards: z.array(RecipeTemplateAuthoringBoardCardSchema).default([])
  })
  .strict();
export type RecipeTemplateAuthoringBoardColumn = z.infer<typeof RecipeTemplateAuthoringBoardColumnSchema>;

export const RecipeTemplateAuthoringTableRowSchema = RecipeTemplateTableRowSchema.omit({
  actions: true
})
  .extend({
    links: z.array(RecipeTemplateAuthoringLinkSchema).default([])
  })
  .strict();
export type RecipeTemplateAuthoringTableRow = z.infer<typeof RecipeTemplateAuthoringTableRowSchema>;

export const RecipeTemplateAuthoringDetailSchema = z
  .object({
    id: OptionalTextSchema,
    title: z.string().min(1),
    eyebrow: OptionalTextSchema,
    summary: OptionalTextSchema,
    chips: z.array(RecipeTemplateChipSchema).default([]),
    fields: z.array(RecipeTemplateFieldSchema).default([]),
    note: OptionalTextSchema,
    noteTitle: OptionalTextSchema
  })
  .strict();
export type RecipeTemplateAuthoringDetail = z.infer<typeof RecipeTemplateAuthoringDetailSchema>;

export const RecipeTemplateAuthoringChecklistItemSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    subtitle: OptionalTextSchema,
    meta: OptionalTextSchema,
    checked: z.boolean().default(false),
    tone: RecipeTemplateToneSchema.optional()
  })
  .strict();
export type RecipeTemplateAuthoringChecklistItem = z.infer<typeof RecipeTemplateAuthoringChecklistItemSchema>;

export const RecipeTemplateFillBaseSchema = z
  .object({
    kind: z.literal('recipe_template_fill'),
    schemaVersion: z.literal('recipe_template_fill/v2'),
    title: z.string().min(1),
    subtitle: OptionalTextSchema,
    summary: z.string().min(1),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
  })
  .strict();

const PriceComparisonGridDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    scopeTags: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    columns: z.array(RecipeTemplateTableColumnSchema).min(1),
    rows: z.array(RecipeTemplateAuthoringTableRowSchema).default([]),
    noteLines: z.array(z.string().min(1)).default([])
  })
  .strict();

const ShoppingShortlistDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    cards: z.array(RecipeTemplateAuthoringCardItemSchema).default([]),
    noteLines: z.array(z.string().min(1)).default([])
  })
  .strict();

const InboxTriageBoardDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    groups: z.array(RecipeTemplateAuthoringGroupSchema).default([]),
    detail: RecipeTemplateAuthoringDetailSchema,
    bulkActionTitle: OptionalTextSchema
  })
  .strict();

const ListDetailResultsDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    filters: z.array(RecipeTemplateChipSchema).default([]),
    sortLabel: OptionalTextSchema,
    groups: z.array(RecipeTemplateAuthoringGroupSchema).default([]),
    detail: RecipeTemplateAuthoringDetailSchema,
    noteLines: z.array(z.string().min(1)).default([])
  })
  .strict();

const HotelShortlistDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    cards: z.array(RecipeTemplateAuthoringCardItemSchema).default([]),
    noteLines: z.array(z.string().min(1)).default([])
  })
  .strict();

const FlightComparisonLegSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    badge: OptionalTextSchema,
    columns: z.array(RecipeTemplateTableColumnSchema).min(1),
    rows: z.array(RecipeTemplateAuthoringTableRowSchema).default([]),
    footnote: OptionalTextSchema
  })
  .strict();

const FlightComparisonDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    activeTabId: OptionalTextSchema,
    legs: z.array(FlightComparisonLegSchema).min(1)
  })
  .strict();

const TravelItineraryPlannerDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    activeTabId: OptionalTextSchema,
    itineraryItems: z.array(RecipeTemplateAuthoringTimelineItemSchema).default([]),
    bookingCards: z.array(RecipeTemplateAuthoringCardItemSchema).default([]),
    packingItems: z.array(RecipeTemplateAuthoringChecklistItemSchema).default([]),
    noteLines: z.array(z.string().min(1)).default([]),
    links: z.array(RecipeTemplateAuthoringLinkSchema).default([])
  })
  .strict();

const ResearchNotebookDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    activeTabId: OptionalTextSchema,
    sources: z.array(RecipeTemplateAuthoringGroupSchema).default([]),
    noteLines: z.array(z.string().min(1)).default([]),
    extractedPoints: z.array(RecipeTemplateAuthoringGroupSchema).default([]),
    followUps: z.array(RecipeTemplateAuthoringGroupSchema).default([])
  })
  .strict();

const SecurityReviewBoardDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    groups: z.array(RecipeTemplateAuthoringGroupSchema).default([]),
    detail: RecipeTemplateAuthoringDetailSchema,
    remediationTitle: OptionalTextSchema,
    remediationMarkdown: OptionalTextSchema
  })
  .strict();

const VendorEvaluationMatrixDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    columns: z.array(RecipeTemplateTableColumnSchema).min(1),
    rows: z.array(RecipeTemplateAuthoringTableRowSchema).default([]),
    footerChips: z.array(RecipeTemplateChipSchema).default([]),
    footnote: OptionalTextSchema,
    noteLines: z.array(z.string().min(1)).default([])
  })
  .strict();

const EventPlannerDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    activeTabId: OptionalTextSchema,
    venueCards: z.array(RecipeTemplateAuthoringCardItemSchema).default([]),
    guestGroups: z.array(RecipeTemplateAuthoringGroupSchema).default([]),
    checklistItems: z.array(RecipeTemplateAuthoringChecklistItemSchema).default([]),
    itineraryItems: z.array(RecipeTemplateAuthoringTimelineItemSchema).default([]),
    noteLines: z.array(z.string().min(1)).default([])
  })
  .strict();

const JobSearchPipelineDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    cards: z.array(RecipeTemplateAuthoringCardItemSchema).default([]),
    noteLines: z.array(z.string().min(1)).default([])
  })
  .strict();

const ContentCampaignPlannerDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    activeTabId: OptionalTextSchema,
    ideaCards: z.array(RecipeTemplateAuthoringCardItemSchema).default([]),
    draftLines: z.array(z.string().min(1)).default([]),
    scheduleItems: z.array(RecipeTemplateAuthoringTimelineItemSchema).default([]),
    noteLines: z.array(z.string().min(1)).default([])
  })
  .strict();

const StepByStepInstructionsDataSchema = z
  .object({
    eyebrow: OptionalTextSchema,
    heroChips: z.array(RecipeTemplateChipSchema).default([]),
    stats: z.array(RecipeTemplateStatSchema).default([]),
    prerequisites: z.array(z.string().min(1)).default([]),
    steps: z
      .array(
        z
          .object({
            id: z.string().min(1),
            label: z.string().min(1),
            detail: OptionalTextSchema
          })
          .strict()
      )
      .default([]),
    noteLines: z.array(z.string().min(1)).default([])
  })
  .strict();

const StepByStepInstructionsActionsDataSchema = z
  .object({
    steps: z
      .array(
        z
          .object({
            id: z.string().min(1),
            links: z.array(z.object({ label: z.string().min(1), href: z.string().min(1) })).default([])
          })
          .strict()
      )
      .default([])
  })
  .strict();

const createTemplateFillSchema = <TemplateId extends z.infer<typeof RecipeTemplateIdSchema>>(
  templateId: TemplateId,
  dataSchema: z.ZodTypeAny
) =>
  RecipeTemplateFillBaseSchema.extend({
    templateId: z.literal(templateId),
    data: dataSchema
  }).strict();

export const RecipeTemplateFillSchema = z.discriminatedUnion('templateId', [
  createTemplateFillSchema('price-comparison-grid', PriceComparisonGridDataSchema),
  createTemplateFillSchema('shopping-shortlist', ShoppingShortlistDataSchema),
  createTemplateFillSchema('inbox-triage-board', InboxTriageBoardDataSchema),
  createTemplateFillSchema('restaurant-finder', ListDetailResultsDataSchema),
  createTemplateFillSchema('hotel-shortlist', HotelShortlistDataSchema),
  createTemplateFillSchema('flight-comparison', FlightComparisonDataSchema),
  createTemplateFillSchema('travel-itinerary-planner', TravelItineraryPlannerDataSchema),
  createTemplateFillSchema('research-notebook', ResearchNotebookDataSchema),
  createTemplateFillSchema('security-review-board', SecurityReviewBoardDataSchema),
  createTemplateFillSchema('vendor-evaluation-matrix', VendorEvaluationMatrixDataSchema),
  createTemplateFillSchema('event-planner', EventPlannerDataSchema),
  createTemplateFillSchema('job-search-pipeline', JobSearchPipelineDataSchema),
  createTemplateFillSchema('content-campaign-planner', ContentCampaignPlannerDataSchema),
  createTemplateFillSchema('local-discovery-comparison', ListDetailResultsDataSchema),
  createTemplateFillSchema('step-by-step-instructions', StepByStepInstructionsDataSchema)
]);
export type RecipeTemplateFill = z.infer<typeof RecipeTemplateFillSchema>;

const RecipeTemplateHydrationBaseSchema = z
  .object({
    kind: z.literal('recipe_template_hydration'),
    schemaVersion: z.literal('recipe_template_hydration/v1'),
    title: z.string().min(1),
    subtitle: OptionalTextSchema,
    summary: z.string().min(1),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
  })
  .strict();

const createTemplateHydrationSchema = <TemplateId extends z.infer<typeof RecipeTemplateIdSchema>>(
  templateId: TemplateId,
  dataSchema: z.ZodTypeAny
) =>
  RecipeTemplateHydrationBaseSchema.extend({
    templateId: z.literal(templateId),
    data: dataSchema
  }).strict();

export const RecipeTemplateHydrationSchema = z.discriminatedUnion('templateId', [
  createTemplateHydrationSchema('price-comparison-grid', PriceComparisonGridDataSchema),
  createTemplateHydrationSchema('shopping-shortlist', ShoppingShortlistDataSchema),
  createTemplateHydrationSchema('inbox-triage-board', InboxTriageBoardDataSchema),
  createTemplateHydrationSchema('restaurant-finder', ListDetailResultsDataSchema),
  createTemplateHydrationSchema('hotel-shortlist', HotelShortlistDataSchema),
  createTemplateHydrationSchema('flight-comparison', FlightComparisonDataSchema),
  createTemplateHydrationSchema('travel-itinerary-planner', TravelItineraryPlannerDataSchema),
  createTemplateHydrationSchema('research-notebook', ResearchNotebookDataSchema),
  createTemplateHydrationSchema('security-review-board', SecurityReviewBoardDataSchema),
  createTemplateHydrationSchema('vendor-evaluation-matrix', VendorEvaluationMatrixDataSchema),
  createTemplateHydrationSchema('event-planner', EventPlannerDataSchema),
  createTemplateHydrationSchema('job-search-pipeline', JobSearchPipelineDataSchema),
  createTemplateHydrationSchema('content-campaign-planner', ContentCampaignPlannerDataSchema),
  createTemplateHydrationSchema('local-discovery-comparison', ListDetailResultsDataSchema),
  createTemplateHydrationSchema('step-by-step-instructions', StepByStepInstructionsDataSchema)
]);
export type RecipeTemplateHydration = z.infer<typeof RecipeTemplateHydrationSchema>;

const RecipeTemplateTextBaseSchema = z
  .object({
    kind: z.literal('recipe_template_text'),
    schemaVersion: z.literal('recipe_template_text/v1'),
    title: z.string().min(1),
    subtitle: OptionalTextSchema,
    summary: z.string().min(1),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
  })
  .strict();

const createTemplateTextSchema = <TemplateId extends z.infer<typeof RecipeTemplateIdSchema>>(
  templateId: TemplateId,
  dataSchema: z.ZodTypeAny
) =>
  RecipeTemplateTextBaseSchema.extend({
    templateId: z.literal(templateId),
    data: dataSchema
  }).strict();

export const RecipeTemplateTextSchema = z.discriminatedUnion('templateId', [
  createTemplateTextSchema('price-comparison-grid', PriceComparisonGridDataSchema),
  createTemplateTextSchema('shopping-shortlist', ShoppingShortlistDataSchema),
  createTemplateTextSchema('inbox-triage-board', InboxTriageBoardDataSchema),
  createTemplateTextSchema('restaurant-finder', ListDetailResultsDataSchema),
  createTemplateTextSchema('hotel-shortlist', HotelShortlistDataSchema),
  createTemplateTextSchema('flight-comparison', FlightComparisonDataSchema),
  createTemplateTextSchema('travel-itinerary-planner', TravelItineraryPlannerDataSchema),
  createTemplateTextSchema('research-notebook', ResearchNotebookDataSchema),
  createTemplateTextSchema('security-review-board', SecurityReviewBoardDataSchema),
  createTemplateTextSchema('vendor-evaluation-matrix', VendorEvaluationMatrixDataSchema),
  createTemplateTextSchema('event-planner', EventPlannerDataSchema),
  createTemplateTextSchema('job-search-pipeline', JobSearchPipelineDataSchema),
  createTemplateTextSchema('content-campaign-planner', ContentCampaignPlannerDataSchema),
  createTemplateTextSchema('local-discovery-comparison', ListDetailResultsDataSchema),
  createTemplateTextSchema('step-by-step-instructions', StepByStepInstructionsDataSchema)
]);
export type RecipeTemplateText = z.infer<typeof RecipeTemplateTextSchema>;

const RecipeTemplateTableRowLinksOverlaySchema = z
  .object({
    id: z.string().min(1),
    links: z.array(RecipeTemplateAuthoringLinkSchema).default([])
  })
  .strict();

const RecipeTemplateCardLinksOverlaySchema = z
  .object({
    id: z.string().min(1),
    links: z.array(RecipeTemplateAuthoringLinkSchema).default([])
  })
  .strict();

const RecipeTemplateListItemLinksOverlaySchema = z
  .object({
    id: z.string().min(1),
    links: z.array(RecipeTemplateAuthoringLinkSchema).default([])
  })
  .strict();

const RecipeTemplateGroupLinksOverlaySchema = z
  .object({
    id: z.string().min(1),
    items: z.array(RecipeTemplateListItemLinksOverlaySchema).default([])
  })
  .strict();

const RecipeTemplateTimelineLinksOverlaySchema = z
  .object({
    id: z.string().min(1),
    links: z.array(RecipeTemplateAuthoringLinkSchema).default([])
  })
  .strict();



const RecipeTemplateDetailFieldLinksOverlaySchema = z
  .object({
    label: z.string().min(1),
    links: z.array(RecipeTemplateAuthoringLinkSchema).default([])
  })
  .strict();

const RecipeTemplateDetailLinksOverlaySchema = z
  .object({
    id: OptionalTextSchema,
    fields: z.array(RecipeTemplateDetailFieldLinksOverlaySchema).default([])
  })
  .strict();

const FlightComparisonActionsLegSchema = z
  .object({
    id: z.string().min(1),
    rows: z.array(RecipeTemplateTableRowLinksOverlaySchema).default([])
  })
  .strict();

const PriceComparisonGridActionsDataSchema = z
  .object({
    rows: z.array(RecipeTemplateTableRowLinksOverlaySchema).default([])
  })
  .strict();

const ShoppingShortlistActionsDataSchema = z
  .object({
    cards: z.array(RecipeTemplateCardLinksOverlaySchema).default([])
  })
  .strict();

const InboxTriageBoardActionsDataSchema = z
  .object({
    groups: z.array(RecipeTemplateGroupLinksOverlaySchema).default([]),
    detail: RecipeTemplateDetailLinksOverlaySchema.optional()
  })
  .strict();

const ListDetailActionsDataSchema = z
  .object({
    groups: z.array(RecipeTemplateGroupLinksOverlaySchema).default([]),
    detail: RecipeTemplateDetailLinksOverlaySchema.optional()
  })
  .strict();

const HotelShortlistActionsDataSchema = z
  .object({
    cards: z.array(RecipeTemplateCardLinksOverlaySchema).default([])
  })
  .strict();

const FlightComparisonActionsDataSchema = z
  .object({
    legs: z.array(FlightComparisonActionsLegSchema).default([])
  })
  .strict();

const TravelItineraryPlannerActionsDataSchema = z
  .object({
    itineraryItems: z.array(RecipeTemplateTimelineLinksOverlaySchema).default([]),
    bookingCards: z.array(RecipeTemplateCardLinksOverlaySchema).default([]),
    links: z.array(RecipeTemplateAuthoringLinkSchema).default([])
  })
  .strict();

const ResearchNotebookActionsDataSchema = z
  .object({
    sources: z.array(RecipeTemplateGroupLinksOverlaySchema).default([]),
    extractedPoints: z.array(RecipeTemplateGroupLinksOverlaySchema).default([]),
    followUps: z.array(RecipeTemplateGroupLinksOverlaySchema).default([])
  })
  .strict();

const SecurityReviewBoardActionsDataSchema = z
  .object({
    groups: z.array(RecipeTemplateGroupLinksOverlaySchema).default([]),
    detail: RecipeTemplateDetailLinksOverlaySchema.optional()
  })
  .strict();

const VendorEvaluationMatrixActionsDataSchema = z
  .object({
    rows: z.array(RecipeTemplateTableRowLinksOverlaySchema).default([])
  })
  .strict();

const EventPlannerActionsDataSchema = z
  .object({
    venueCards: z.array(RecipeTemplateCardLinksOverlaySchema).default([]),
    guestGroups: z.array(RecipeTemplateGroupLinksOverlaySchema).default([]),
    itineraryItems: z.array(RecipeTemplateTimelineLinksOverlaySchema).default([])
  })
  .strict();

const JobSearchPipelineActionsDataSchema = z
  .object({
    cards: z.array(RecipeTemplateCardLinksOverlaySchema).default([])
  })
  .strict();

const ContentCampaignPlannerActionsDataSchema = z
  .object({
    ideaCards: z.array(RecipeTemplateCardLinksOverlaySchema).default([]),
    scheduleItems: z.array(RecipeTemplateTimelineLinksOverlaySchema).default([])
  })
  .strict();

const RecipeTemplateActionsBaseSchema = z
  .object({
    kind: z.literal('recipe_template_actions'),
    schemaVersion: z.literal('recipe_template_actions/v1'),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
  })
  .strict();

const createTemplateActionsSchema = <TemplateId extends z.infer<typeof RecipeTemplateIdSchema>>(
  templateId: TemplateId,
  dataSchema: z.ZodTypeAny
) =>
  RecipeTemplateActionsBaseSchema.extend({
    templateId: z.literal(templateId),
    data: dataSchema
  }).strict();

export const RecipeTemplateActionsSchema = z.discriminatedUnion('templateId', [
  createTemplateActionsSchema('price-comparison-grid', PriceComparisonGridActionsDataSchema),
  createTemplateActionsSchema('shopping-shortlist', ShoppingShortlistActionsDataSchema),
  createTemplateActionsSchema('inbox-triage-board', InboxTriageBoardActionsDataSchema),
  createTemplateActionsSchema('restaurant-finder', ListDetailActionsDataSchema),
  createTemplateActionsSchema('hotel-shortlist', HotelShortlistActionsDataSchema),
  createTemplateActionsSchema('flight-comparison', FlightComparisonActionsDataSchema),
  createTemplateActionsSchema('travel-itinerary-planner', TravelItineraryPlannerActionsDataSchema),
  createTemplateActionsSchema('research-notebook', ResearchNotebookActionsDataSchema),
  createTemplateActionsSchema('security-review-board', SecurityReviewBoardActionsDataSchema),
  createTemplateActionsSchema('vendor-evaluation-matrix', VendorEvaluationMatrixActionsDataSchema),
  createTemplateActionsSchema('event-planner', EventPlannerActionsDataSchema),
  createTemplateActionsSchema('job-search-pipeline', JobSearchPipelineActionsDataSchema),
  createTemplateActionsSchema('content-campaign-planner', ContentCampaignPlannerActionsDataSchema),
  createTemplateActionsSchema('local-discovery-comparison', ListDetailActionsDataSchema),
  createTemplateActionsSchema('step-by-step-instructions', StepByStepInstructionsActionsDataSchema)
]);
export type RecipeTemplateActions = z.infer<typeof RecipeTemplateActionsSchema>;

export const RecipeTemplateUpdateOperationSchema = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('set_header'),
      title: OptionalTextSchema,
      subtitle: OptionalTextSchema,
      summary: OptionalTextSchema
    })
    .strict(),
  z
    .object({
      op: z.literal('set_active_tab'),
      slotId: z.string().min(1),
      tabId: z.string().min(1)
    })
    .strict(),
  z
    .object({
      op: z.literal('append_note_lines'),
      slotId: z.string().min(1),
      lines: z.array(z.string().min(1)).min(1)
    })
    .strict(),
  z
    .object({
      op: z.literal('set_filter_chips'),
      slotId: z.string().min(1),
      filters: z.array(RecipeTemplateChipSchema).default([]),
      sortLabel: OptionalTextSchema
    })
    .strict(),
  z
    .object({
      op: z.literal('set_scope_tags'),
      slotId: z.string().min(1),
      chips: z.array(RecipeTemplateChipSchema).default([])
    })
    .strict(),
  z
    .object({
      op: z.literal('upsert_table_rows'),
      slotId: z.string().min(1),
      rows: z.array(RecipeTemplateAuthoringTableRowSchema).min(1)
    })
    .strict(),
  z
    .object({
      op: z.literal('upsert_cards'),
      slotId: z.string().min(1),
      cards: z.array(RecipeTemplateAuthoringCardItemSchema).min(1)
    })
    .strict(),
  z
    .object({
      op: z.literal('upsert_groups'),
      slotId: z.string().min(1),
      groups: z.array(RecipeTemplateAuthoringGroupSchema).min(1)
    })
    .strict(),
  z
    .object({
      op: z.literal('upsert_timeline_items'),
      slotId: z.string().min(1),
      items: z.array(RecipeTemplateAuthoringTimelineItemSchema).min(1)
    })
    .strict(),
  z
    .object({
      op: z.literal('set_detail'),
      slotId: z.string().min(1),
      detail: RecipeTemplateAuthoringDetailSchema
    })
    .strict(),
  z
    .object({
      op: z.literal('upsert_board_cards'),
      slotId: z.string().min(1),
      columnId: z.string().min(1),
      cards: z.array(RecipeTemplateAuthoringBoardCardSchema).min(1)
    })
    .strict(),
  z
    .object({
      op: z.literal('move_board_card'),
      slotId: z.string().min(1),
      cardId: z.string().min(1),
      targetColumnId: z.string().min(1),
      position: z.number().int().nonnegative().optional()
    })
    .strict(),
  z
    .object({
      op: z.literal('remove_items'),
      slotId: z.string().min(1),
      itemIds: z.array(z.string().min(1)).min(1)
    })
    .strict(),
  z
    .object({
      op: z.literal('set_status'),
      statusLabel: z.string().min(1)
    })
    .strict()
]);
export type RecipeTemplateUpdateOperation = z.infer<typeof RecipeTemplateUpdateOperationSchema>;

const RecipeTemplateUpdateBaseSchema = z
  .object({
    kind: z.literal('recipe_template_update'),
    schemaVersion: z.literal('recipe_template_update/v2'),
    operations: z.array(RecipeTemplateUpdateOperationSchema).default([]),
    metadata: z.record(z.string().min(1), z.unknown()).default({})
  })
  .strict();

const createTemplateUpdateSchema = <TemplateId extends z.infer<typeof RecipeTemplateIdSchema>>(templateId: TemplateId) =>
  RecipeTemplateUpdateBaseSchema.extend({
    templateId: z.literal(templateId)
  }).strict();

export const RecipeTemplateUpdateSchema = z.discriminatedUnion('templateId', [
  createTemplateUpdateSchema('price-comparison-grid'),
  createTemplateUpdateSchema('shopping-shortlist'),
  createTemplateUpdateSchema('inbox-triage-board'),
  createTemplateUpdateSchema('restaurant-finder'),
  createTemplateUpdateSchema('hotel-shortlist'),
  createTemplateUpdateSchema('flight-comparison'),
  createTemplateUpdateSchema('travel-itinerary-planner'),
  createTemplateUpdateSchema('research-notebook'),
  createTemplateUpdateSchema('security-review-board'),
  createTemplateUpdateSchema('vendor-evaluation-matrix'),
  createTemplateUpdateSchema('event-planner'),
  createTemplateUpdateSchema('job-search-pipeline'),
  createTemplateUpdateSchema('content-campaign-planner'),
  createTemplateUpdateSchema('local-discovery-comparison'),
  createTemplateUpdateSchema('step-by-step-instructions')
]);
export type RecipeTemplateUpdate = z.infer<typeof RecipeTemplateUpdateSchema>;
