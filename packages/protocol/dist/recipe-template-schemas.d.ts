import { z } from 'zod';
export declare const RECIPE_TEMPLATE_IDS: readonly ["price-comparison-grid", "shopping-shortlist", "inbox-triage-board", "restaurant-finder", "hotel-shortlist", "flight-comparison", "travel-itinerary-planner", "research-notebook", "security-review-board", "vendor-evaluation-matrix", "event-planner", "job-search-pipeline", "local-discovery-comparison", "step-by-step-instructions"];
export type LegacyRecipeTemplateId = (typeof RECIPE_TEMPLATE_IDS)[number];
export declare const LegacyRecipeTemplateIdSchema: z.ZodEnum<{
    "price-comparison-grid": "price-comparison-grid";
    "shopping-shortlist": "shopping-shortlist";
    "inbox-triage-board": "inbox-triage-board";
    "restaurant-finder": "restaurant-finder";
    "hotel-shortlist": "hotel-shortlist";
    "flight-comparison": "flight-comparison";
    "travel-itinerary-planner": "travel-itinerary-planner";
    "research-notebook": "research-notebook";
    "security-review-board": "security-review-board";
    "vendor-evaluation-matrix": "vendor-evaluation-matrix";
    "event-planner": "event-planner";
    "job-search-pipeline": "job-search-pipeline";
    "local-discovery-comparison": "local-discovery-comparison";
    "step-by-step-instructions": "step-by-step-instructions";
}>;
export declare const RecipeTemplateIdSchema: z.ZodString;
export type RecipeTemplateId = string;
export declare const RecipeTemplateToneSchema: z.ZodEnum<{
    success: "success";
    neutral: "neutral";
    accent: "accent";
    warning: "warning";
    danger: "danger";
}>;
export type RecipeTemplateTone = z.infer<typeof RecipeTemplateToneSchema>;
export declare const RecipeTemplateChipSchema: z.ZodObject<{
    label: z.ZodString;
    tone: z.ZodDefault<z.ZodEnum<{
        success: "success";
        neutral: "neutral";
        accent: "accent";
        warning: "warning";
        danger: "danger";
    }>>;
}, z.core.$strict>;
export type RecipeTemplateChip = z.infer<typeof RecipeTemplateChipSchema>;
export declare const RecipeTemplateImageBorderRadiusSchema: z.ZodEnum<{
    none: "none";
    sm: "sm";
    md: "md";
    lg: "lg";
    full: "full";
}>;
export type RecipeTemplateImageBorderRadius = z.infer<typeof RecipeTemplateImageBorderRadiusSchema>;
export declare const RecipeTemplateImageBorderSchema: z.ZodEnum<{
    none: "none";
    subtle: "subtle";
    strong: "strong";
}>;
export type RecipeTemplateImageBorder = z.infer<typeof RecipeTemplateImageBorderSchema>;
export declare const RecipeTemplateImageAspectSchema: z.ZodEnum<{
    square: "square";
    video: "video";
    portrait: "portrait";
    natural: "natural";
}>;
export type RecipeTemplateImageAspect = z.infer<typeof RecipeTemplateImageAspectSchema>;
export declare const RecipeTemplateImageFitSchema: z.ZodEnum<{
    cover: "cover";
    contain: "contain";
}>;
export type RecipeTemplateImageFit = z.infer<typeof RecipeTemplateImageFitSchema>;
export declare const RecipeTemplateImageSchema: z.ZodObject<{
    src: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    query: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    alt: z.ZodString;
    caption: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    borderRadius: z.ZodDefault<z.ZodEnum<{
        none: "none";
        sm: "sm";
        md: "md";
        lg: "lg";
        full: "full";
    }>>;
    border: z.ZodDefault<z.ZodEnum<{
        none: "none";
        subtle: "subtle";
        strong: "strong";
    }>>;
    aspect: z.ZodDefault<z.ZodEnum<{
        square: "square";
        video: "video";
        portrait: "portrait";
        natural: "natural";
    }>>;
    fit: z.ZodDefault<z.ZodEnum<{
        cover: "cover";
        contain: "contain";
    }>>;
}, z.core.$strict>;
export type RecipeTemplateImage = z.infer<typeof RecipeTemplateImageSchema>;
export declare const RecipeTemplateActionReferenceSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    kind: z.ZodLiteral<"existing_action">;
    actionId: z.ZodString;
    selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"link">;
    label: z.ZodString;
    href: z.ZodString;
    openInNewTab: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>], "kind">;
export type RecipeTemplateActionReference = z.infer<typeof RecipeTemplateActionReferenceSchema>;
export declare const RecipeTemplateStatSchema: z.ZodObject<{
    label: z.ZodString;
    value: z.ZodString;
    helper: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    tone: z.ZodOptional<z.ZodEnum<{
        success: "success";
        neutral: "neutral";
        accent: "accent";
        warning: "warning";
        danger: "danger";
    }>>;
}, z.core.$strict>;
export type RecipeTemplateStat = z.infer<typeof RecipeTemplateStatSchema>;
export declare const RecipeTemplateFieldLinkSchema: z.ZodObject<{
    label: z.ZodString;
    href: z.ZodString;
}, z.core.$strict>;
export type RecipeTemplateFieldLink = z.infer<typeof RecipeTemplateFieldLinkSchema>;
export declare const RecipeTemplateFieldSchema: z.ZodObject<{
    label: z.ZodString;
    value: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    chips: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<{
            success: "success";
            neutral: "neutral";
            accent: "accent";
            warning: "warning";
            danger: "danger";
        }>>;
    }, z.core.$strict>>>;
    bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
    links: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        href: z.ZodString;
    }, z.core.$strict>>>;
    fullWidth: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
export type RecipeTemplateField = z.infer<typeof RecipeTemplateFieldSchema>;
export declare const RecipeTemplateListItemSchema: z.ZodObject<{
    id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    chips: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<{
            success: "success";
            neutral: "neutral";
            accent: "accent";
            warning: "warning";
            danger: "danger";
        }>>;
    }, z.core.$strict>>>;
    actions: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        kind: z.ZodLiteral<"existing_action">;
        actionId: z.ZodString;
        selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        kind: z.ZodLiteral<"link">;
        label: z.ZodString;
        href: z.ZodString;
        openInNewTab: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>], "kind">>>;
}, z.core.$strict>;
export type RecipeTemplateListItem = z.infer<typeof RecipeTemplateListItemSchema>;
export declare const RecipeTemplateCardItemSchema: z.ZodObject<{
    id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    image: z.ZodOptional<z.ZodObject<{
        src: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        query: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        alt: z.ZodString;
        caption: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        borderRadius: z.ZodDefault<z.ZodEnum<{
            none: "none";
            sm: "sm";
            md: "md";
            lg: "lg";
            full: "full";
        }>>;
        border: z.ZodDefault<z.ZodEnum<{
            none: "none";
            subtle: "subtle";
            strong: "strong";
        }>>;
        aspect: z.ZodDefault<z.ZodEnum<{
            square: "square";
            video: "video";
            portrait: "portrait";
            natural: "natural";
        }>>;
        fit: z.ZodDefault<z.ZodEnum<{
            cover: "cover";
            contain: "contain";
        }>>;
    }, z.core.$strict>>;
    price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    chips: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<{
            success: "success";
            neutral: "neutral";
            accent: "accent";
            warning: "warning";
            danger: "danger";
        }>>;
    }, z.core.$strict>>>;
    bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
    footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    actions: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        kind: z.ZodLiteral<"existing_action">;
        actionId: z.ZodString;
        selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        kind: z.ZodLiteral<"link">;
        label: z.ZodString;
        href: z.ZodString;
        openInNewTab: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>], "kind">>>;
}, z.core.$strict>;
export type RecipeTemplateCardItem = z.infer<typeof RecipeTemplateCardItemSchema>;
export declare const RecipeTemplateTimelineItemSchema: z.ZodObject<{
    id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    title: z.ZodString;
    time: z.ZodString;
    summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    chips: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<{
            success: "success";
            neutral: "neutral";
            accent: "accent";
            warning: "warning";
            danger: "danger";
        }>>;
    }, z.core.$strict>>>;
    actions: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        kind: z.ZodLiteral<"existing_action">;
        actionId: z.ZodString;
        selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        kind: z.ZodLiteral<"link">;
        label: z.ZodString;
        href: z.ZodString;
        openInNewTab: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>], "kind">>>;
}, z.core.$strict>;
export type RecipeTemplateTimelineItem = z.infer<typeof RecipeTemplateTimelineItemSchema>;
export declare const RecipeTemplateActivityItemSchema: z.ZodObject<{
    id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    label: z.ZodString;
    detail: z.ZodString;
    timestamp: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    tone: z.ZodOptional<z.ZodEnum<{
        success: "success";
        neutral: "neutral";
        accent: "accent";
        warning: "warning";
        danger: "danger";
    }>>;
}, z.core.$strict>;
export type RecipeTemplateActivityItem = z.infer<typeof RecipeTemplateActivityItemSchema>;
export declare const RecipeTemplateBoardCardSchema: z.ZodObject<{
    id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    chips: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<{
            success: "success";
            neutral: "neutral";
            accent: "accent";
            warning: "warning";
            danger: "danger";
        }>>;
    }, z.core.$strict>>>;
    footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    actions: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        kind: z.ZodLiteral<"existing_action">;
        actionId: z.ZodString;
        selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        kind: z.ZodLiteral<"link">;
        label: z.ZodString;
        href: z.ZodString;
        openInNewTab: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>], "kind">>>;
}, z.core.$strict>;
export type RecipeTemplateBoardCard = z.infer<typeof RecipeTemplateBoardCardSchema>;
export declare const RecipeTemplateBoardColumnSchema: z.ZodObject<{
    id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    label: z.ZodString;
    tone: z.ZodOptional<z.ZodEnum<{
        success: "success";
        neutral: "neutral";
        accent: "accent";
        warning: "warning";
        danger: "danger";
    }>>;
    cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        title: z.ZodString;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        chips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        actions: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            kind: z.ZodLiteral<"existing_action">;
            actionId: z.ZodString;
            selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>, z.ZodObject<{
            kind: z.ZodLiteral<"link">;
            label: z.ZodString;
            href: z.ZodString;
            openInNewTab: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strict>], "kind">>>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type RecipeTemplateBoardColumn = z.infer<typeof RecipeTemplateBoardColumnSchema>;
export declare const RecipeTemplateTableColumnSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    align: z.ZodDefault<z.ZodEnum<{
        start: "start";
        end: "end";
        center: "center";
    }>>;
}, z.core.$strict>;
export type RecipeTemplateTableColumn = z.infer<typeof RecipeTemplateTableColumnSchema>;
export declare const RecipeTemplateTableCellSchema: z.ZodObject<{
    value: z.ZodString;
    subvalue: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    href: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    tone: z.ZodOptional<z.ZodEnum<{
        success: "success";
        neutral: "neutral";
        accent: "accent";
        warning: "warning";
        danger: "danger";
    }>>;
    emphasis: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
export type RecipeTemplateTableCell = z.infer<typeof RecipeTemplateTableCellSchema>;
export declare const RecipeTemplateTableRowSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    leadingImage: z.ZodOptional<z.ZodObject<{
        src: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        query: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        alt: z.ZodString;
        caption: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        borderRadius: z.ZodDefault<z.ZodEnum<{
            none: "none";
            sm: "sm";
            md: "md";
            lg: "lg";
            full: "full";
        }>>;
        border: z.ZodDefault<z.ZodEnum<{
            none: "none";
            subtle: "subtle";
            strong: "strong";
        }>>;
        aspect: z.ZodDefault<z.ZodEnum<{
            square: "square";
            video: "video";
            portrait: "portrait";
            natural: "natural";
        }>>;
        fit: z.ZodDefault<z.ZodEnum<{
            cover: "cover";
            contain: "contain";
        }>>;
    }, z.core.$strict>>;
    cells: z.ZodDefault<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        subvalue: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        href: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        tone: z.ZodOptional<z.ZodEnum<{
            success: "success";
            neutral: "neutral";
            accent: "accent";
            warning: "warning";
            danger: "danger";
        }>>;
        emphasis: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>>>;
    actions: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        kind: z.ZodLiteral<"existing_action">;
        actionId: z.ZodString;
        selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        kind: z.ZodLiteral<"link">;
        label: z.ZodString;
        href: z.ZodString;
        openInNewTab: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>], "kind">>>;
}, z.core.$strict>;
export type RecipeTemplateTableRow = z.infer<typeof RecipeTemplateTableRowSchema>;
export declare const RecipeTemplateSectionHydrationStateSchema: z.ZodEnum<{
    pending: "pending";
    hydrating: "hydrating";
    ready: "ready";
    failed: "failed";
}>;
export type RecipeTemplateSectionHydrationState = z.infer<typeof RecipeTemplateSectionHydrationStateSchema>;
export declare const RecipeTemplateSectionRepairStateSchema: z.ZodEnum<{
    failed: "failed";
    idle: "idle";
    repairing: "repairing";
    recovered: "recovered";
}>;
export type RecipeTemplateSectionRepairState = z.infer<typeof RecipeTemplateSectionRepairStateSchema>;
export declare const RecipeTemplateSectionContentStateSchema: z.ZodEnum<{
    ghost: "ghost";
    partial: "partial";
    hydrated: "hydrated";
    fallback: "fallback";
}>;
export type RecipeTemplateSectionContentState = z.infer<typeof RecipeTemplateSectionContentStateSchema>;
export declare const RecipeTemplateSectionProgressSchema: z.ZodObject<{
    hydrationState: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        hydrating: "hydrating";
        ready: "ready";
        failed: "failed";
    }>>;
    repairState: z.ZodDefault<z.ZodEnum<{
        failed: "failed";
        idle: "idle";
        repairing: "repairing";
        recovered: "recovered";
    }>>;
    contentState: z.ZodDefault<z.ZodEnum<{
        ghost: "ghost";
        partial: "partial";
        hydrated: "hydrated";
        fallback: "fallback";
    }>>;
    lastUpdatedAt: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    errorMessage: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
}, z.core.$strict>;
export type RecipeTemplateSectionProgress = z.infer<typeof RecipeTemplateSectionProgressSchema>;
export declare const RecipeTemplateViewPhaseSchema: z.ZodEnum<{
    actions: "actions";
    hydrating: "hydrating";
    ready: "ready";
    failed: "failed";
    repairing: "repairing";
    selected: "selected";
    text: "text";
}>;
export type RecipeTemplateViewPhase = z.infer<typeof RecipeTemplateViewPhaseSchema>;
export declare const RecipeTemplateStateStatusSchema: z.ZodObject<{
    phase: z.ZodDefault<z.ZodEnum<{
        actions: "actions";
        hydrating: "hydrating";
        ready: "ready";
        failed: "failed";
        repairing: "repairing";
        selected: "selected";
        text: "text";
    }>>;
    lastUpdatedAt: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    failureCategory: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    errorMessage: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
}, z.core.$strict>;
export type RecipeTemplateStateStatus = z.infer<typeof RecipeTemplateStateStatusSchema>;
export declare const RecipeTemplateSectionSchema: z.ZodType<({
    slotId: string;
    kind: 'hero';
    eyebrow?: string;
    title: string;
    summary: string;
    chips: RecipeTemplateChip[];
    actions: RecipeTemplateActionReference[];
}) | ({
    slotId: string;
    kind: 'filter-strip';
    title?: string;
    filters: RecipeTemplateChip[];
    sortLabel?: string;
}) | ({
    slotId: string;
    kind: 'action-bar';
    title?: string;
    actions: RecipeTemplateActionReference[];
}) | ({
    slotId: string;
    kind: 'stats';
    title?: string;
    items: RecipeTemplateStat[];
}) | ({
    slotId: string;
    kind: 'comparison-table';
    title: string;
    columns: RecipeTemplateTableColumn[];
    rows: RecipeTemplateTableRow[];
    footerChips: RecipeTemplateChip[];
    footnote?: string;
}) | ({
    slotId: string;
    kind: 'grouped-list';
    title: string;
    groups: Array<{
        id: string;
        label: string;
        tone?: RecipeTemplateTone;
        items: RecipeTemplateListItem[];
    }>;
}) | ({
    slotId: string;
    kind: 'card-grid';
    title: string;
    columns?: 1 | 2 | 3;
    cards: RecipeTemplateCardItem[];
}) | ({
    slotId: string;
    kind: 'detail-panel';
    title: string;
    eyebrow?: string;
    summary?: string;
    chips: RecipeTemplateChip[];
    fields: RecipeTemplateField[];
    actions: RecipeTemplateActionReference[];
    note?: string;
    noteTitle?: string;
}) | ({
    slotId: string;
    kind: 'timeline';
    title: string;
    items: RecipeTemplateTimelineItem[];
}) | ({
    slotId: string;
    kind: 'notes';
    title: string;
    lines: string[];
    actions: RecipeTemplateActionReference[];
}) | ({
    slotId: string;
    kind: 'activity-log';
    title: string;
    entries: RecipeTemplateActivityItem[];
}) | ({
    slotId: string;
    kind: 'kanban';
    title: string;
    columns: RecipeTemplateBoardColumn[];
}) | ({
    slotId: string;
    kind: 'confirmation';
    title: string;
    message: string;
    confirmAction: RecipeTemplateActionReference;
    secondaryAction?: RecipeTemplateActionReference;
    tone?: RecipeTemplateTone;
}) | ({
    slotId: string;
    kind: 'split';
    title?: string;
    ratio?: 'balanced' | 'list-detail' | 'detail-list';
    left: RecipeTemplateSection[];
    right: RecipeTemplateSection[];
}) | ({
    slotId: string;
    kind: 'tabs';
    title?: string;
    tabs: Array<{
        id: string;
        label: string;
        badge?: string;
    }>;
    activeTabId: string;
    panes: Record<string, RecipeTemplateSection[]>;
}) | ({
    slotId: string;
    kind: 'checklist';
    title: string;
    prerequisites: string[];
    steps: Array<{
        id: string;
        label: string;
        detail?: string;
        checked?: boolean;
    }>;
    actions: RecipeTemplateActionReference[];
}) | ({
    slotId: string;
    kind: 'image';
    title?: string;
    image: RecipeTemplateImage;
}) | ({
    slotId: string;
    kind: 'audio';
    title: string;
    src: string;
    subtitle?: string;
    transcript?: string;
}) | ({
    slotId: string;
    kind: 'bar-chart';
    title: string;
    xKey: string;
    series: Array<{
        id: string;
        label: string;
        tone?: RecipeTemplateTone;
    }>;
    data: Array<Record<string, string | number>>;
    orientation?: 'vertical' | 'horizontal';
    stacked?: boolean;
    valueFormat?: 'number' | 'currency' | 'percent';
}) | ({
    slotId: string;
    kind: 'line-chart';
    title: string;
    xKey: string;
    series: Array<{
        id: string;
        label: string;
        tone?: RecipeTemplateTone;
    }>;
    data: Array<Record<string, string | number>>;
    smooth?: boolean;
    valueFormat?: 'number' | 'currency' | 'percent';
}) | ({
    slotId: string;
    kind: 'pie-chart';
    title: string;
    data: Array<{
        id: string;
        label: string;
        value: number;
        tone?: RecipeTemplateTone;
    }>;
    variant?: 'pie' | 'donut';
    valueFormat?: 'number' | 'currency' | 'percent';
}) | ({
    slotId: string;
    kind: 'time-series';
    title: string;
    xKey: string;
    series: Array<{
        id: string;
        label: string;
        tone?: RecipeTemplateTone;
    }>;
    data: Array<Record<string, string | number>>;
    valueFormat?: 'number' | 'currency' | 'percent';
}) | ({
    slotId: string;
    kind: 'report';
    title: string;
    body: string;
    footnotes: Array<{
        id: string;
        label: string;
        url?: string;
    }>;
}) | ({
    slotId: string;
    kind: 'video';
    title: string;
    src: string;
    poster?: string;
    subtitle?: string;
}) | ({
    slotId: string;
    kind: 'file-attachment';
    title: string;
    files: Array<{
        id: string;
        filename: string;
        mimeType: string;
        size: number;
        kind: string;
        url: string;
    }>;
}) | ({
    slotId: string;
    kind: 'pdf-viewer';
    title: string;
    src: string;
    filename?: string;
}) | ({
    slotId: string;
    kind: 'code-block';
    title: string;
    language: string;
    code: string;
    filename?: string;
}) | ({
    slotId: string;
    kind: 'data-table';
    title: string;
    columns: Array<{
        key: string;
        label: string;
    }>;
    rows: Array<Record<string, string | number | null>>;
    filename?: string;
})>;
export type RecipeTemplateSection = z.infer<typeof RecipeTemplateSectionSchema>;
export declare const RecipeTemplateTransitionRecordSchema: z.ZodObject<{
    fromTemplateId: z.ZodString;
    toTemplateId: z.ZodString;
    switchedAt: z.ZodString;
    reason: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
}, z.core.$strict>;
export type RecipeTemplateTransitionRecord = z.infer<typeof RecipeTemplateTransitionRecordSchema>;
export declare const RecipeTemplateStateSchema: z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_state">;
    schemaVersion: z.ZodLiteral<"recipe_template_state/v1">;
    templateId: z.ZodString;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    status: z.ZodOptional<z.ZodObject<{
        phase: z.ZodDefault<z.ZodEnum<{
            actions: "actions";
            hydrating: "hydrating";
            ready: "ready";
            failed: "failed";
            repairing: "repairing";
            selected: "selected";
            text: "text";
        }>>;
        lastUpdatedAt: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        failureCategory: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        errorMessage: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>>;
    sections: z.ZodDefault<z.ZodArray<z.ZodType<{
        slotId: string;
        kind: "hero";
        eyebrow?: string;
        title: string;
        summary: string;
        chips: RecipeTemplateChip[];
        actions: RecipeTemplateActionReference[];
    } | {
        slotId: string;
        kind: "filter-strip";
        title?: string;
        filters: RecipeTemplateChip[];
        sortLabel?: string;
    } | {
        slotId: string;
        kind: "action-bar";
        title?: string;
        actions: RecipeTemplateActionReference[];
    } | {
        slotId: string;
        kind: "stats";
        title?: string;
        items: RecipeTemplateStat[];
    } | {
        slotId: string;
        kind: "comparison-table";
        title: string;
        columns: RecipeTemplateTableColumn[];
        rows: RecipeTemplateTableRow[];
        footerChips: RecipeTemplateChip[];
        footnote?: string;
    } | {
        slotId: string;
        kind: "grouped-list";
        title: string;
        groups: Array<{
            id: string;
            label: string;
            tone?: RecipeTemplateTone;
            items: RecipeTemplateListItem[];
        }>;
    } | {
        slotId: string;
        kind: "card-grid";
        title: string;
        columns?: 1 | 2 | 3;
        cards: RecipeTemplateCardItem[];
    } | {
        slotId: string;
        kind: "detail-panel";
        title: string;
        eyebrow?: string;
        summary?: string;
        chips: RecipeTemplateChip[];
        fields: RecipeTemplateField[];
        actions: RecipeTemplateActionReference[];
        note?: string;
        noteTitle?: string;
    } | {
        slotId: string;
        kind: "timeline";
        title: string;
        items: RecipeTemplateTimelineItem[];
    } | {
        slotId: string;
        kind: "notes";
        title: string;
        lines: string[];
        actions: RecipeTemplateActionReference[];
    } | {
        slotId: string;
        kind: "activity-log";
        title: string;
        entries: RecipeTemplateActivityItem[];
    } | {
        slotId: string;
        kind: "kanban";
        title: string;
        columns: RecipeTemplateBoardColumn[];
    } | {
        slotId: string;
        kind: "confirmation";
        title: string;
        message: string;
        confirmAction: RecipeTemplateActionReference;
        secondaryAction?: RecipeTemplateActionReference;
        tone?: RecipeTemplateTone;
    } | {
        slotId: string;
        kind: "split";
        title?: string;
        ratio?: "balanced" | "list-detail" | "detail-list";
        left: RecipeTemplateSection[];
        right: RecipeTemplateSection[];
    } | {
        slotId: string;
        kind: "tabs";
        title?: string;
        tabs: Array<{
            id: string;
            label: string;
            badge?: string;
        }>;
        activeTabId: string;
        panes: Record<string, RecipeTemplateSection[]>;
    } | {
        slotId: string;
        kind: "checklist";
        title: string;
        prerequisites: string[];
        steps: Array<{
            id: string;
            label: string;
            detail?: string;
            checked?: boolean;
        }>;
        actions: RecipeTemplateActionReference[];
    } | {
        slotId: string;
        kind: "image";
        title?: string;
        image: RecipeTemplateImage;
    } | {
        slotId: string;
        kind: "audio";
        title: string;
        src: string;
        subtitle?: string;
        transcript?: string;
    } | {
        slotId: string;
        kind: "bar-chart";
        title: string;
        xKey: string;
        series: Array<{
            id: string;
            label: string;
            tone?: RecipeTemplateTone;
        }>;
        data: Array<Record<string, string | number>>;
        orientation?: "vertical" | "horizontal";
        stacked?: boolean;
        valueFormat?: "number" | "currency" | "percent";
    } | {
        slotId: string;
        kind: "line-chart";
        title: string;
        xKey: string;
        series: Array<{
            id: string;
            label: string;
            tone?: RecipeTemplateTone;
        }>;
        data: Array<Record<string, string | number>>;
        smooth?: boolean;
        valueFormat?: "number" | "currency" | "percent";
    } | {
        slotId: string;
        kind: "pie-chart";
        title: string;
        data: Array<{
            id: string;
            label: string;
            value: number;
            tone?: RecipeTemplateTone;
        }>;
        variant?: "pie" | "donut";
        valueFormat?: "number" | "currency" | "percent";
    } | {
        slotId: string;
        kind: "time-series";
        title: string;
        xKey: string;
        series: Array<{
            id: string;
            label: string;
            tone?: RecipeTemplateTone;
        }>;
        data: Array<Record<string, string | number>>;
        valueFormat?: "number" | "currency" | "percent";
    } | {
        slotId: string;
        kind: "report";
        title: string;
        body: string;
        footnotes: Array<{
            id: string;
            label: string;
            url?: string;
        }>;
    } | {
        slotId: string;
        kind: "video";
        title: string;
        src: string;
        poster?: string;
        subtitle?: string;
    } | {
        slotId: string;
        kind: "file-attachment";
        title: string;
        files: Array<{
            id: string;
            filename: string;
            mimeType: string;
            size: number;
            kind: string;
            url: string;
        }>;
    } | {
        slotId: string;
        kind: "pdf-viewer";
        title: string;
        src: string;
        filename?: string;
    } | {
        slotId: string;
        kind: "code-block";
        title: string;
        language: string;
        code: string;
        filename?: string;
    } | {
        slotId: string;
        kind: "data-table";
        title: string;
        columns: Array<{
            key: string;
            label: string;
        }>;
        rows: Array<Record<string, string | number | null>>;
        filename?: string;
    }, unknown, z.core.$ZodTypeInternals<{
        slotId: string;
        kind: "hero";
        eyebrow?: string;
        title: string;
        summary: string;
        chips: RecipeTemplateChip[];
        actions: RecipeTemplateActionReference[];
    } | {
        slotId: string;
        kind: "filter-strip";
        title?: string;
        filters: RecipeTemplateChip[];
        sortLabel?: string;
    } | {
        slotId: string;
        kind: "action-bar";
        title?: string;
        actions: RecipeTemplateActionReference[];
    } | {
        slotId: string;
        kind: "stats";
        title?: string;
        items: RecipeTemplateStat[];
    } | {
        slotId: string;
        kind: "comparison-table";
        title: string;
        columns: RecipeTemplateTableColumn[];
        rows: RecipeTemplateTableRow[];
        footerChips: RecipeTemplateChip[];
        footnote?: string;
    } | {
        slotId: string;
        kind: "grouped-list";
        title: string;
        groups: Array<{
            id: string;
            label: string;
            tone?: RecipeTemplateTone;
            items: RecipeTemplateListItem[];
        }>;
    } | {
        slotId: string;
        kind: "card-grid";
        title: string;
        columns?: 1 | 2 | 3;
        cards: RecipeTemplateCardItem[];
    } | {
        slotId: string;
        kind: "detail-panel";
        title: string;
        eyebrow?: string;
        summary?: string;
        chips: RecipeTemplateChip[];
        fields: RecipeTemplateField[];
        actions: RecipeTemplateActionReference[];
        note?: string;
        noteTitle?: string;
    } | {
        slotId: string;
        kind: "timeline";
        title: string;
        items: RecipeTemplateTimelineItem[];
    } | {
        slotId: string;
        kind: "notes";
        title: string;
        lines: string[];
        actions: RecipeTemplateActionReference[];
    } | {
        slotId: string;
        kind: "activity-log";
        title: string;
        entries: RecipeTemplateActivityItem[];
    } | {
        slotId: string;
        kind: "kanban";
        title: string;
        columns: RecipeTemplateBoardColumn[];
    } | {
        slotId: string;
        kind: "confirmation";
        title: string;
        message: string;
        confirmAction: RecipeTemplateActionReference;
        secondaryAction?: RecipeTemplateActionReference;
        tone?: RecipeTemplateTone;
    } | {
        slotId: string;
        kind: "split";
        title?: string;
        ratio?: "balanced" | "list-detail" | "detail-list";
        left: RecipeTemplateSection[];
        right: RecipeTemplateSection[];
    } | {
        slotId: string;
        kind: "tabs";
        title?: string;
        tabs: Array<{
            id: string;
            label: string;
            badge?: string;
        }>;
        activeTabId: string;
        panes: Record<string, RecipeTemplateSection[]>;
    } | {
        slotId: string;
        kind: "checklist";
        title: string;
        prerequisites: string[];
        steps: Array<{
            id: string;
            label: string;
            detail?: string;
            checked?: boolean;
        }>;
        actions: RecipeTemplateActionReference[];
    } | {
        slotId: string;
        kind: "image";
        title?: string;
        image: RecipeTemplateImage;
    } | {
        slotId: string;
        kind: "audio";
        title: string;
        src: string;
        subtitle?: string;
        transcript?: string;
    } | {
        slotId: string;
        kind: "bar-chart";
        title: string;
        xKey: string;
        series: Array<{
            id: string;
            label: string;
            tone?: RecipeTemplateTone;
        }>;
        data: Array<Record<string, string | number>>;
        orientation?: "vertical" | "horizontal";
        stacked?: boolean;
        valueFormat?: "number" | "currency" | "percent";
    } | {
        slotId: string;
        kind: "line-chart";
        title: string;
        xKey: string;
        series: Array<{
            id: string;
            label: string;
            tone?: RecipeTemplateTone;
        }>;
        data: Array<Record<string, string | number>>;
        smooth?: boolean;
        valueFormat?: "number" | "currency" | "percent";
    } | {
        slotId: string;
        kind: "pie-chart";
        title: string;
        data: Array<{
            id: string;
            label: string;
            value: number;
            tone?: RecipeTemplateTone;
        }>;
        variant?: "pie" | "donut";
        valueFormat?: "number" | "currency" | "percent";
    } | {
        slotId: string;
        kind: "time-series";
        title: string;
        xKey: string;
        series: Array<{
            id: string;
            label: string;
            tone?: RecipeTemplateTone;
        }>;
        data: Array<Record<string, string | number>>;
        valueFormat?: "number" | "currency" | "percent";
    } | {
        slotId: string;
        kind: "report";
        title: string;
        body: string;
        footnotes: Array<{
            id: string;
            label: string;
            url?: string;
        }>;
    } | {
        slotId: string;
        kind: "video";
        title: string;
        src: string;
        poster?: string;
        subtitle?: string;
    } | {
        slotId: string;
        kind: "file-attachment";
        title: string;
        files: Array<{
            id: string;
            filename: string;
            mimeType: string;
            size: number;
            kind: string;
            url: string;
        }>;
    } | {
        slotId: string;
        kind: "pdf-viewer";
        title: string;
        src: string;
        filename?: string;
    } | {
        slotId: string;
        kind: "code-block";
        title: string;
        language: string;
        code: string;
        filename?: string;
    } | {
        slotId: string;
        kind: "data-table";
        title: string;
        columns: Array<{
            key: string;
            label: string;
        }>;
        rows: Array<Record<string, string | number | null>>;
        filename?: string;
    }, unknown>>>>;
    transitionTargets: z.ZodDefault<z.ZodArray<z.ZodString>>;
    transitionHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
        fromTemplateId: z.ZodString;
        toTemplateId: z.ZodString;
        switchedAt: z.ZodString;
        reason: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export type RecipeTemplateState = z.infer<typeof RecipeTemplateStateSchema>;
