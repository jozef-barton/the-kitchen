import { z } from 'zod';
export declare const RECIPE_TEMPLATE_IDS: readonly ["price-comparison-grid", "shopping-shortlist", "inbox-triage-board", "restaurant-finder", "hotel-shortlist", "flight-comparison", "travel-itinerary-planner", "research-notebook", "security-review-board", "vendor-evaluation-matrix", "event-planner", "job-search-pipeline", "local-discovery-comparison", "step-by-step-instructions"];
export type LegacyRecipeTemplateId = (typeof RECIPE_TEMPLATE_IDS)[number];
export declare const LegacyRecipeTemplateIdSchema: z.ZodEnum<["price-comparison-grid", "shopping-shortlist", "inbox-triage-board", "restaurant-finder", "hotel-shortlist", "flight-comparison", "travel-itinerary-planner", "research-notebook", "security-review-board", "vendor-evaluation-matrix", "event-planner", "job-search-pipeline", "local-discovery-comparison", "step-by-step-instructions"]>;
export declare const RecipeTemplateIdSchema: z.ZodString;
export type RecipeTemplateId = string;
export declare const RecipeTemplateToneSchema: z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>;
export type RecipeTemplateTone = z.infer<typeof RecipeTemplateToneSchema>;
export declare const RecipeTemplateChipSchema: z.ZodObject<{
    label: z.ZodString;
    tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
}, "strict", z.ZodTypeAny, {
    label: string;
    tone: "neutral" | "accent" | "success" | "warning" | "danger";
}, {
    label: string;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
}>;
export type RecipeTemplateChip = z.infer<typeof RecipeTemplateChipSchema>;
export declare const RecipeTemplateImageBorderRadiusSchema: z.ZodEnum<["none", "sm", "md", "lg", "full"]>;
export type RecipeTemplateImageBorderRadius = z.infer<typeof RecipeTemplateImageBorderRadiusSchema>;
export declare const RecipeTemplateImageBorderSchema: z.ZodEnum<["none", "subtle", "strong"]>;
export type RecipeTemplateImageBorder = z.infer<typeof RecipeTemplateImageBorderSchema>;
export declare const RecipeTemplateImageAspectSchema: z.ZodEnum<["square", "video", "portrait", "natural"]>;
export type RecipeTemplateImageAspect = z.infer<typeof RecipeTemplateImageAspectSchema>;
export declare const RecipeTemplateImageFitSchema: z.ZodEnum<["cover", "contain"]>;
export type RecipeTemplateImageFit = z.infer<typeof RecipeTemplateImageFitSchema>;
export declare const RecipeTemplateImageSchema: z.ZodObject<{
    src: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    query: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    alt: z.ZodString;
    caption: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    borderRadius: z.ZodDefault<z.ZodEnum<["none", "sm", "md", "lg", "full"]>>;
    border: z.ZodDefault<z.ZodEnum<["none", "subtle", "strong"]>>;
    aspect: z.ZodDefault<z.ZodEnum<["square", "video", "portrait", "natural"]>>;
    fit: z.ZodDefault<z.ZodEnum<["cover", "contain"]>>;
}, "strict", z.ZodTypeAny, {
    src: string | null;
    alt: string;
    borderRadius: "none" | "sm" | "md" | "lg" | "full";
    border: "none" | "subtle" | "strong";
    aspect: "square" | "video" | "portrait" | "natural";
    fit: "cover" | "contain";
    query?: string | undefined;
    caption?: string | undefined;
}, {
    alt: string;
    src?: string | null | undefined;
    query?: unknown;
    caption?: unknown;
    borderRadius?: "none" | "sm" | "md" | "lg" | "full" | undefined;
    border?: "none" | "subtle" | "strong" | undefined;
    aspect?: "square" | "video" | "portrait" | "natural" | undefined;
    fit?: "cover" | "contain" | undefined;
}>;
export type RecipeTemplateImage = z.infer<typeof RecipeTemplateImageSchema>;
export declare const RecipeTemplateActionReferenceSchema: z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    kind: z.ZodLiteral<"existing_action">;
    actionId: z.ZodString;
    selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    kind: "existing_action";
    actionId: string;
    selectedItemIds: string[];
}, {
    kind: "existing_action";
    actionId: string;
    selectedItemIds?: string[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"link">;
    label: z.ZodString;
    href: z.ZodString;
    openInNewTab: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    label: string;
    kind: "link";
    href: string;
    openInNewTab: boolean;
}, {
    label: string;
    kind: "link";
    href: string;
    openInNewTab?: boolean | undefined;
}>]>;
export type RecipeTemplateActionReference = z.infer<typeof RecipeTemplateActionReferenceSchema>;
export declare const RecipeTemplateStatSchema: z.ZodObject<{
    label: z.ZodString;
    value: z.ZodString;
    helper: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
}, "strict", z.ZodTypeAny, {
    value: string;
    label: string;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    helper?: string | undefined;
}, {
    value: string;
    label: string;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    helper?: unknown;
}>;
export type RecipeTemplateStat = z.infer<typeof RecipeTemplateStatSchema>;
export declare const RecipeTemplateFieldLinkSchema: z.ZodObject<{
    label: z.ZodString;
    href: z.ZodString;
}, "strict", z.ZodTypeAny, {
    label: string;
    href: string;
}, {
    label: string;
    href: string;
}>;
export type RecipeTemplateFieldLink = z.infer<typeof RecipeTemplateFieldLinkSchema>;
export declare const RecipeTemplateFieldSchema: z.ZodObject<{
    label: z.ZodString;
    value: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    chips: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
    }, "strict", z.ZodTypeAny, {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }, {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }>, "many">>;
    bullets: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    links: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        href: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        label: string;
        href: string;
    }, {
        label: string;
        href: string;
    }>, "many">>;
    fullWidth: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    label: string;
    chips: {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }[];
    bullets: string[];
    links: {
        label: string;
        href: string;
    }[];
    fullWidth: boolean;
    value?: string | undefined;
}, {
    label: string;
    value?: unknown;
    chips?: {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }[] | undefined;
    bullets?: string[] | undefined;
    links?: {
        label: string;
        href: string;
    }[] | undefined;
    fullWidth?: boolean | undefined;
}>;
export type RecipeTemplateField = z.infer<typeof RecipeTemplateFieldSchema>;
export declare const RecipeTemplateListItemSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    meta: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    chips: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
    }, "strict", z.ZodTypeAny, {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }, {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }>, "many">>;
    actions: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
        kind: z.ZodLiteral<"existing_action">;
        actionId: z.ZodString;
        selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
        kind: "existing_action";
        actionId: string;
        selectedItemIds: string[];
    }, {
        kind: "existing_action";
        actionId: string;
        selectedItemIds?: string[] | undefined;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"link">;
        label: z.ZodString;
        href: z.ZodString;
        openInNewTab: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        label: string;
        kind: "link";
        href: string;
        openInNewTab: boolean;
    }, {
        label: string;
        kind: "link";
        href: string;
        openInNewTab?: boolean | undefined;
    }>]>, "many">>;
}, "strict", z.ZodTypeAny, {
    chips: {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }[];
    title: string;
    actions: ({
        kind: "existing_action";
        actionId: string;
        selectedItemIds: string[];
    } | {
        label: string;
        kind: "link";
        href: string;
        openInNewTab: boolean;
    })[];
    id?: string | undefined;
    subtitle?: string | undefined;
    meta?: string | undefined;
}, {
    title: string;
    chips?: {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }[] | undefined;
    id?: unknown;
    subtitle?: unknown;
    meta?: unknown;
    actions?: ({
        kind: "existing_action";
        actionId: string;
        selectedItemIds?: string[] | undefined;
    } | {
        label: string;
        kind: "link";
        href: string;
        openInNewTab?: boolean | undefined;
    })[] | undefined;
}>;
export type RecipeTemplateListItem = z.infer<typeof RecipeTemplateListItemSchema>;
export declare const RecipeTemplateCardItemSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    meta: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    imageLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    image: z.ZodOptional<z.ZodObject<{
        src: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        query: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        alt: z.ZodString;
        caption: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        borderRadius: z.ZodDefault<z.ZodEnum<["none", "sm", "md", "lg", "full"]>>;
        border: z.ZodDefault<z.ZodEnum<["none", "subtle", "strong"]>>;
        aspect: z.ZodDefault<z.ZodEnum<["square", "video", "portrait", "natural"]>>;
        fit: z.ZodDefault<z.ZodEnum<["cover", "contain"]>>;
    }, "strict", z.ZodTypeAny, {
        src: string | null;
        alt: string;
        borderRadius: "none" | "sm" | "md" | "lg" | "full";
        border: "none" | "subtle" | "strong";
        aspect: "square" | "video" | "portrait" | "natural";
        fit: "cover" | "contain";
        query?: string | undefined;
        caption?: string | undefined;
    }, {
        alt: string;
        src?: string | null | undefined;
        query?: unknown;
        caption?: unknown;
        borderRadius?: "none" | "sm" | "md" | "lg" | "full" | undefined;
        border?: "none" | "subtle" | "strong" | undefined;
        aspect?: "square" | "video" | "portrait" | "natural" | undefined;
        fit?: "cover" | "contain" | undefined;
    }>>;
    price: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    chips: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
    }, "strict", z.ZodTypeAny, {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }, {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }>, "many">>;
    bullets: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    footer: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    actions: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
        kind: z.ZodLiteral<"existing_action">;
        actionId: z.ZodString;
        selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
        kind: "existing_action";
        actionId: string;
        selectedItemIds: string[];
    }, {
        kind: "existing_action";
        actionId: string;
        selectedItemIds?: string[] | undefined;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"link">;
        label: z.ZodString;
        href: z.ZodString;
        openInNewTab: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        label: string;
        kind: "link";
        href: string;
        openInNewTab: boolean;
    }, {
        label: string;
        kind: "link";
        href: string;
        openInNewTab?: boolean | undefined;
    }>]>, "many">>;
}, "strict", z.ZodTypeAny, {
    chips: {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }[];
    bullets: string[];
    title: string;
    actions: ({
        kind: "existing_action";
        actionId: string;
        selectedItemIds: string[];
    } | {
        label: string;
        kind: "link";
        href: string;
        openInNewTab: boolean;
    })[];
    id?: string | undefined;
    subtitle?: string | undefined;
    meta?: string | undefined;
    imageLabel?: string | undefined;
    image?: {
        src: string | null;
        alt: string;
        borderRadius: "none" | "sm" | "md" | "lg" | "full";
        border: "none" | "subtle" | "strong";
        aspect: "square" | "video" | "portrait" | "natural";
        fit: "cover" | "contain";
        query?: string | undefined;
        caption?: string | undefined;
    } | undefined;
    price?: string | undefined;
    footer?: string | undefined;
}, {
    title: string;
    chips?: {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }[] | undefined;
    bullets?: string[] | undefined;
    id?: unknown;
    subtitle?: unknown;
    meta?: unknown;
    actions?: ({
        kind: "existing_action";
        actionId: string;
        selectedItemIds?: string[] | undefined;
    } | {
        label: string;
        kind: "link";
        href: string;
        openInNewTab?: boolean | undefined;
    })[] | undefined;
    imageLabel?: unknown;
    image?: {
        alt: string;
        src?: string | null | undefined;
        query?: unknown;
        caption?: unknown;
        borderRadius?: "none" | "sm" | "md" | "lg" | "full" | undefined;
        border?: "none" | "subtle" | "strong" | undefined;
        aspect?: "square" | "video" | "portrait" | "natural" | undefined;
        fit?: "cover" | "contain" | undefined;
    } | undefined;
    price?: unknown;
    footer?: unknown;
}>;
export type RecipeTemplateCardItem = z.infer<typeof RecipeTemplateCardItemSchema>;
export declare const RecipeTemplateTimelineItemSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    title: z.ZodString;
    time: z.ZodString;
    summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    chips: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
    }, "strict", z.ZodTypeAny, {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }, {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }>, "many">>;
    actions: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
        kind: z.ZodLiteral<"existing_action">;
        actionId: z.ZodString;
        selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
        kind: "existing_action";
        actionId: string;
        selectedItemIds: string[];
    }, {
        kind: "existing_action";
        actionId: string;
        selectedItemIds?: string[] | undefined;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"link">;
        label: z.ZodString;
        href: z.ZodString;
        openInNewTab: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        label: string;
        kind: "link";
        href: string;
        openInNewTab: boolean;
    }, {
        label: string;
        kind: "link";
        href: string;
        openInNewTab?: boolean | undefined;
    }>]>, "many">>;
}, "strict", z.ZodTypeAny, {
    chips: {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }[];
    title: string;
    actions: ({
        kind: "existing_action";
        actionId: string;
        selectedItemIds: string[];
    } | {
        label: string;
        kind: "link";
        href: string;
        openInNewTab: boolean;
    })[];
    time: string;
    id?: string | undefined;
    summary?: string | undefined;
}, {
    title: string;
    time: string;
    chips?: {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }[] | undefined;
    id?: unknown;
    actions?: ({
        kind: "existing_action";
        actionId: string;
        selectedItemIds?: string[] | undefined;
    } | {
        label: string;
        kind: "link";
        href: string;
        openInNewTab?: boolean | undefined;
    })[] | undefined;
    summary?: unknown;
}>;
export type RecipeTemplateTimelineItem = z.infer<typeof RecipeTemplateTimelineItemSchema>;
export declare const RecipeTemplateActivityItemSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    label: z.ZodString;
    detail: z.ZodString;
    timestamp: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
}, "strict", z.ZodTypeAny, {
    label: string;
    detail: string;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    id?: string | undefined;
    timestamp?: string | undefined;
}, {
    label: string;
    detail: string;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    id?: unknown;
    timestamp?: unknown;
}>;
export type RecipeTemplateActivityItem = z.infer<typeof RecipeTemplateActivityItemSchema>;
export declare const RecipeTemplateBoardCardSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    chips: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
    }, "strict", z.ZodTypeAny, {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }, {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }>, "many">>;
    footer: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    actions: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
        kind: z.ZodLiteral<"existing_action">;
        actionId: z.ZodString;
        selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
        kind: "existing_action";
        actionId: string;
        selectedItemIds: string[];
    }, {
        kind: "existing_action";
        actionId: string;
        selectedItemIds?: string[] | undefined;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"link">;
        label: z.ZodString;
        href: z.ZodString;
        openInNewTab: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        label: string;
        kind: "link";
        href: string;
        openInNewTab: boolean;
    }, {
        label: string;
        kind: "link";
        href: string;
        openInNewTab?: boolean | undefined;
    }>]>, "many">>;
}, "strict", z.ZodTypeAny, {
    chips: {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }[];
    title: string;
    actions: ({
        kind: "existing_action";
        actionId: string;
        selectedItemIds: string[];
    } | {
        label: string;
        kind: "link";
        href: string;
        openInNewTab: boolean;
    })[];
    id?: string | undefined;
    subtitle?: string | undefined;
    footer?: string | undefined;
}, {
    title: string;
    chips?: {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }[] | undefined;
    id?: unknown;
    subtitle?: unknown;
    actions?: ({
        kind: "existing_action";
        actionId: string;
        selectedItemIds?: string[] | undefined;
    } | {
        label: string;
        kind: "link";
        href: string;
        openInNewTab?: boolean | undefined;
    })[] | undefined;
    footer?: unknown;
}>;
export type RecipeTemplateBoardCard = z.infer<typeof RecipeTemplateBoardCardSchema>;
export declare const RecipeTemplateBoardColumnSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    label: z.ZodString;
    tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
    cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        title: z.ZodString;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        chips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        footer: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        actions: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
            kind: z.ZodLiteral<"existing_action">;
            actionId: z.ZodString;
            selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strict", z.ZodTypeAny, {
            kind: "existing_action";
            actionId: string;
            selectedItemIds: string[];
        }, {
            kind: "existing_action";
            actionId: string;
            selectedItemIds?: string[] | undefined;
        }>, z.ZodObject<{
            kind: z.ZodLiteral<"link">;
            label: z.ZodString;
            href: z.ZodString;
            openInNewTab: z.ZodDefault<z.ZodBoolean>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            kind: "link";
            href: string;
            openInNewTab: boolean;
        }, {
            label: string;
            kind: "link";
            href: string;
            openInNewTab?: boolean | undefined;
        }>]>, "many">>;
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        title: string;
        actions: ({
            kind: "existing_action";
            actionId: string;
            selectedItemIds: string[];
        } | {
            label: string;
            kind: "link";
            href: string;
            openInNewTab: boolean;
        })[];
        id?: string | undefined;
        subtitle?: string | undefined;
        footer?: string | undefined;
    }, {
        title: string;
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        id?: unknown;
        subtitle?: unknown;
        actions?: ({
            kind: "existing_action";
            actionId: string;
            selectedItemIds?: string[] | undefined;
        } | {
            label: string;
            kind: "link";
            href: string;
            openInNewTab?: boolean | undefined;
        })[] | undefined;
        footer?: unknown;
    }>, "many">>;
}, "strict", z.ZodTypeAny, {
    label: string;
    cards: {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        title: string;
        actions: ({
            kind: "existing_action";
            actionId: string;
            selectedItemIds: string[];
        } | {
            label: string;
            kind: "link";
            href: string;
            openInNewTab: boolean;
        })[];
        id?: string | undefined;
        subtitle?: string | undefined;
        footer?: string | undefined;
    }[];
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    id?: string | undefined;
}, {
    label: string;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    id?: unknown;
    cards?: {
        title: string;
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        id?: unknown;
        subtitle?: unknown;
        actions?: ({
            kind: "existing_action";
            actionId: string;
            selectedItemIds?: string[] | undefined;
        } | {
            label: string;
            kind: "link";
            href: string;
            openInNewTab?: boolean | undefined;
        })[] | undefined;
        footer?: unknown;
    }[] | undefined;
}>;
export type RecipeTemplateBoardColumn = z.infer<typeof RecipeTemplateBoardColumnSchema>;
export declare const RecipeTemplateTableColumnSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    align: z.ZodDefault<z.ZodEnum<["start", "end", "center"]>>;
}, "strict", z.ZodTypeAny, {
    label: string;
    id: string;
    align: "start" | "end" | "center";
}, {
    label: string;
    id: string;
    align?: "start" | "end" | "center" | undefined;
}>;
export type RecipeTemplateTableColumn = z.infer<typeof RecipeTemplateTableColumnSchema>;
export declare const RecipeTemplateTableCellSchema: z.ZodObject<{
    value: z.ZodString;
    subvalue: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    href: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
    emphasis: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    value: string;
    emphasis: boolean;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    href?: string | undefined;
    subvalue?: string | undefined;
}, {
    value: string;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    href?: unknown;
    subvalue?: unknown;
    emphasis?: boolean | undefined;
}>;
export type RecipeTemplateTableCell = z.infer<typeof RecipeTemplateTableCellSchema>;
export declare const RecipeTemplateTableRowSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    leadingImage: z.ZodOptional<z.ZodObject<{
        src: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        query: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        alt: z.ZodString;
        caption: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        borderRadius: z.ZodDefault<z.ZodEnum<["none", "sm", "md", "lg", "full"]>>;
        border: z.ZodDefault<z.ZodEnum<["none", "subtle", "strong"]>>;
        aspect: z.ZodDefault<z.ZodEnum<["square", "video", "portrait", "natural"]>>;
        fit: z.ZodDefault<z.ZodEnum<["cover", "contain"]>>;
    }, "strict", z.ZodTypeAny, {
        src: string | null;
        alt: string;
        borderRadius: "none" | "sm" | "md" | "lg" | "full";
        border: "none" | "subtle" | "strong";
        aspect: "square" | "video" | "portrait" | "natural";
        fit: "cover" | "contain";
        query?: string | undefined;
        caption?: string | undefined;
    }, {
        alt: string;
        src?: string | null | undefined;
        query?: unknown;
        caption?: unknown;
        borderRadius?: "none" | "sm" | "md" | "lg" | "full" | undefined;
        border?: "none" | "subtle" | "strong" | undefined;
        aspect?: "square" | "video" | "portrait" | "natural" | undefined;
        fit?: "cover" | "contain" | undefined;
    }>>;
    cells: z.ZodDefault<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        subvalue: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        href: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        emphasis: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        value: string;
        emphasis: boolean;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        href?: string | undefined;
        subvalue?: string | undefined;
    }, {
        value: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        href?: unknown;
        subvalue?: unknown;
        emphasis?: boolean | undefined;
    }>, "many">>;
    actions: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
        kind: z.ZodLiteral<"existing_action">;
        actionId: z.ZodString;
        selectedItemIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
        kind: "existing_action";
        actionId: string;
        selectedItemIds: string[];
    }, {
        kind: "existing_action";
        actionId: string;
        selectedItemIds?: string[] | undefined;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"link">;
        label: z.ZodString;
        href: z.ZodString;
        openInNewTab: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        label: string;
        kind: "link";
        href: string;
        openInNewTab: boolean;
    }, {
        label: string;
        kind: "link";
        href: string;
        openInNewTab?: boolean | undefined;
    }>]>, "many">>;
}, "strict", z.ZodTypeAny, {
    label: string;
    id: string;
    actions: ({
        kind: "existing_action";
        actionId: string;
        selectedItemIds: string[];
    } | {
        label: string;
        kind: "link";
        href: string;
        openInNewTab: boolean;
    })[];
    cells: {
        value: string;
        emphasis: boolean;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        href?: string | undefined;
        subvalue?: string | undefined;
    }[];
    leadingImage?: {
        src: string | null;
        alt: string;
        borderRadius: "none" | "sm" | "md" | "lg" | "full";
        border: "none" | "subtle" | "strong";
        aspect: "square" | "video" | "portrait" | "natural";
        fit: "cover" | "contain";
        query?: string | undefined;
        caption?: string | undefined;
    } | undefined;
}, {
    label: string;
    id: string;
    actions?: ({
        kind: "existing_action";
        actionId: string;
        selectedItemIds?: string[] | undefined;
    } | {
        label: string;
        kind: "link";
        href: string;
        openInNewTab?: boolean | undefined;
    })[] | undefined;
    leadingImage?: {
        alt: string;
        src?: string | null | undefined;
        query?: unknown;
        caption?: unknown;
        borderRadius?: "none" | "sm" | "md" | "lg" | "full" | undefined;
        border?: "none" | "subtle" | "strong" | undefined;
        aspect?: "square" | "video" | "portrait" | "natural" | undefined;
        fit?: "cover" | "contain" | undefined;
    } | undefined;
    cells?: {
        value: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        href?: unknown;
        subvalue?: unknown;
        emphasis?: boolean | undefined;
    }[] | undefined;
}>;
export type RecipeTemplateTableRow = z.infer<typeof RecipeTemplateTableRowSchema>;
export declare const RecipeTemplateSectionHydrationStateSchema: z.ZodEnum<["pending", "hydrating", "ready", "failed"]>;
export type RecipeTemplateSectionHydrationState = z.infer<typeof RecipeTemplateSectionHydrationStateSchema>;
export declare const RecipeTemplateSectionRepairStateSchema: z.ZodEnum<["idle", "repairing", "recovered", "failed"]>;
export type RecipeTemplateSectionRepairState = z.infer<typeof RecipeTemplateSectionRepairStateSchema>;
export declare const RecipeTemplateSectionContentStateSchema: z.ZodEnum<["ghost", "partial", "hydrated", "fallback"]>;
export type RecipeTemplateSectionContentState = z.infer<typeof RecipeTemplateSectionContentStateSchema>;
export declare const RecipeTemplateSectionProgressSchema: z.ZodObject<{
    hydrationState: z.ZodDefault<z.ZodEnum<["pending", "hydrating", "ready", "failed"]>>;
    repairState: z.ZodDefault<z.ZodEnum<["idle", "repairing", "recovered", "failed"]>>;
    contentState: z.ZodDefault<z.ZodEnum<["ghost", "partial", "hydrated", "fallback"]>>;
    lastUpdatedAt: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    errorMessage: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
}, "strict", z.ZodTypeAny, {
    hydrationState: "pending" | "hydrating" | "ready" | "failed";
    repairState: "failed" | "idle" | "repairing" | "recovered";
    contentState: "ghost" | "partial" | "hydrated" | "fallback";
    lastUpdatedAt?: string | undefined;
    errorMessage?: string | undefined;
}, {
    hydrationState?: "pending" | "hydrating" | "ready" | "failed" | undefined;
    repairState?: "failed" | "idle" | "repairing" | "recovered" | undefined;
    contentState?: "ghost" | "partial" | "hydrated" | "fallback" | undefined;
    lastUpdatedAt?: unknown;
    errorMessage?: unknown;
}>;
export type RecipeTemplateSectionProgress = z.infer<typeof RecipeTemplateSectionProgressSchema>;
export declare const RecipeTemplateViewPhaseSchema: z.ZodEnum<["selected", "text", "hydrating", "actions", "repairing", "ready", "failed"]>;
export type RecipeTemplateViewPhase = z.infer<typeof RecipeTemplateViewPhaseSchema>;
export declare const RecipeTemplateStateStatusSchema: z.ZodObject<{
    phase: z.ZodDefault<z.ZodEnum<["selected", "text", "hydrating", "actions", "repairing", "ready", "failed"]>>;
    lastUpdatedAt: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    failureCategory: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    errorMessage: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
}, "strict", z.ZodTypeAny, {
    phase: "actions" | "hydrating" | "ready" | "failed" | "repairing" | "selected" | "text";
    lastUpdatedAt?: string | undefined;
    errorMessage?: string | undefined;
    failureCategory?: string | undefined;
}, {
    lastUpdatedAt?: unknown;
    errorMessage?: unknown;
    phase?: "actions" | "hydrating" | "ready" | "failed" | "repairing" | "selected" | "text" | undefined;
    failureCategory?: unknown;
}>;
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
}), z.ZodTypeDef, unknown>;
export type RecipeTemplateSection = z.infer<typeof RecipeTemplateSectionSchema>;
export declare const RecipeTemplateTransitionRecordSchema: z.ZodObject<{
    fromTemplateId: z.ZodString;
    toTemplateId: z.ZodString;
    switchedAt: z.ZodString;
    reason: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
}, "strict", z.ZodTypeAny, {
    fromTemplateId: string;
    toTemplateId: string;
    switchedAt: string;
    reason?: string | undefined;
}, {
    fromTemplateId: string;
    toTemplateId: string;
    switchedAt: string;
    reason?: unknown;
}>;
export type RecipeTemplateTransitionRecord = z.infer<typeof RecipeTemplateTransitionRecordSchema>;
export declare const RecipeTemplateStateSchema: z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_state">;
    schemaVersion: z.ZodLiteral<"recipe_template_state/v1">;
    templateId: z.ZodString;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    status: z.ZodOptional<z.ZodObject<{
        phase: z.ZodDefault<z.ZodEnum<["selected", "text", "hydrating", "actions", "repairing", "ready", "failed"]>>;
        lastUpdatedAt: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        failureCategory: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        errorMessage: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        phase: "actions" | "hydrating" | "ready" | "failed" | "repairing" | "selected" | "text";
        lastUpdatedAt?: string | undefined;
        errorMessage?: string | undefined;
        failureCategory?: string | undefined;
    }, {
        lastUpdatedAt?: unknown;
        errorMessage?: unknown;
        phase?: "actions" | "hydrating" | "ready" | "failed" | "repairing" | "selected" | "text" | undefined;
        failureCategory?: unknown;
    }>>;
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
    }, z.ZodTypeDef, unknown>, "many">>;
    transitionTargets: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    transitionHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
        fromTemplateId: z.ZodString;
        toTemplateId: z.ZodString;
        switchedAt: z.ZodString;
        reason: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        fromTemplateId: string;
        toTemplateId: string;
        switchedAt: string;
        reason?: string | undefined;
    }, {
        fromTemplateId: string;
        toTemplateId: string;
        switchedAt: string;
        reason?: unknown;
    }>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_state";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_state/v1";
    templateId: string;
    sections: ({
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
    })[];
    transitionTargets: string[];
    transitionHistory: {
        fromTemplateId: string;
        toTemplateId: string;
        switchedAt: string;
        reason?: string | undefined;
    }[];
    metadata: Record<string, unknown>;
    status?: {
        phase: "actions" | "hydrating" | "ready" | "failed" | "repairing" | "selected" | "text";
        lastUpdatedAt?: string | undefined;
        errorMessage?: string | undefined;
        failureCategory?: string | undefined;
    } | undefined;
    subtitle?: string | undefined;
}, {
    kind: "recipe_template_state";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_state/v1";
    templateId: string;
    status?: {
        lastUpdatedAt?: unknown;
        errorMessage?: unknown;
        phase?: "actions" | "hydrating" | "ready" | "failed" | "repairing" | "selected" | "text" | undefined;
        failureCategory?: unknown;
    } | undefined;
    subtitle?: unknown;
    sections?: unknown[] | undefined;
    transitionTargets?: string[] | undefined;
    transitionHistory?: {
        fromTemplateId: string;
        toTemplateId: string;
        switchedAt: string;
        reason?: unknown;
    }[] | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type RecipeTemplateState = z.infer<typeof RecipeTemplateStateSchema>;
