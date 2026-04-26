import { z } from 'zod';
export declare const RecipeTemplateSelectionHintsSchema: z.ZodObject<{
    primaryEntity: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    currentTemplateId: z.ZodOptional<z.ZodString>;
    suggestedTransitionFrom: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    primaryEntity?: string | undefined;
    currentTemplateId?: string | undefined;
    suggestedTransitionFrom?: string | undefined;
}, {
    primaryEntity?: unknown;
    currentTemplateId?: string | undefined;
    suggestedTransitionFrom?: string | undefined;
}>;
export type RecipeTemplateSelectionHints = z.infer<typeof RecipeTemplateSelectionHintsSchema>;
export declare const RecipeMutationKindSchema: z.ZodEnum<["change_layout", "change_visual", "add_content", "remove_content", "refine_existing", "switch_recipe"]>;
export type RecipeMutationKind = z.infer<typeof RecipeMutationKindSchema>;
export declare const RecipeMutationIntentSchema: z.ZodObject<{
    kind: z.ZodEnum<["change_layout", "change_visual", "add_content", "remove_content", "refine_existing", "switch_recipe"]>;
    wantsImages: z.ZodDefault<z.ZodBoolean>;
    wantsCards: z.ZodDefault<z.ZodBoolean>;
    wantsCharts: z.ZodDefault<z.ZodBoolean>;
    wantsTable: z.ZodDefault<z.ZodBoolean>;
    wantsKanban: z.ZodDefault<z.ZodBoolean>;
    wantsTimeline: z.ZodDefault<z.ZodBoolean>;
    wantsFewerItems: z.ZodDefault<z.ZodBoolean>;
    wantsMoreItems: z.ZodDefault<z.ZodBoolean>;
    targetTemplateHint: z.ZodOptional<z.ZodString>;
    mutationSummary: z.ZodString;
}, "strict", z.ZodTypeAny, {
    kind: "change_layout" | "change_visual" | "add_content" | "remove_content" | "refine_existing" | "switch_recipe";
    wantsImages: boolean;
    wantsCards: boolean;
    wantsCharts: boolean;
    wantsTable: boolean;
    wantsKanban: boolean;
    wantsTimeline: boolean;
    wantsFewerItems: boolean;
    wantsMoreItems: boolean;
    mutationSummary: string;
    targetTemplateHint?: string | undefined;
}, {
    kind: "change_layout" | "change_visual" | "add_content" | "remove_content" | "refine_existing" | "switch_recipe";
    mutationSummary: string;
    wantsImages?: boolean | undefined;
    wantsCards?: boolean | undefined;
    wantsCharts?: boolean | undefined;
    wantsTable?: boolean | undefined;
    wantsKanban?: boolean | undefined;
    wantsTimeline?: boolean | undefined;
    wantsFewerItems?: boolean | undefined;
    wantsMoreItems?: boolean | undefined;
    targetTemplateHint?: string | undefined;
}>;
export type RecipeMutationIntent = z.infer<typeof RecipeMutationIntentSchema>;
export declare const RecipeTemplateSelectionModeSchema: z.ZodEnum<["fill", "update", "switch"]>;
export type RecipeTemplateSelectionMode = z.infer<typeof RecipeTemplateSelectionModeSchema>;
export declare const RecipeTemplateSelectionSchema: z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_selection">;
    schemaVersion: z.ZodLiteral<"recipe_template_selection/v2">;
    templateId: z.ZodString;
    mode: z.ZodDefault<z.ZodEnum<["fill", "update", "switch"]>>;
    reason: z.ZodString;
    confidence: z.ZodNumber;
    hints: z.ZodOptional<z.ZodObject<{
        primaryEntity: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        currentTemplateId: z.ZodOptional<z.ZodString>;
        suggestedTransitionFrom: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        primaryEntity?: string | undefined;
        currentTemplateId?: string | undefined;
        suggestedTransitionFrom?: string | undefined;
    }, {
        primaryEntity?: unknown;
        currentTemplateId?: string | undefined;
        suggestedTransitionFrom?: string | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_selection";
    reason: string;
    schemaVersion: "recipe_template_selection/v2";
    templateId: string;
    mode: "fill" | "update" | "switch";
    confidence: number;
    hints?: {
        primaryEntity?: string | undefined;
        currentTemplateId?: string | undefined;
        suggestedTransitionFrom?: string | undefined;
    } | undefined;
}, {
    kind: "recipe_template_selection";
    reason: string;
    schemaVersion: "recipe_template_selection/v2";
    templateId: string;
    confidence: number;
    mode?: "fill" | "update" | "switch" | undefined;
    hints?: {
        primaryEntity?: unknown;
        currentTemplateId?: string | undefined;
        suggestedTransitionFrom?: string | undefined;
    } | undefined;
}>;
export type RecipeTemplateSelection = z.infer<typeof RecipeTemplateSelectionSchema>;
export declare const RecipeTemplateAuthoringLinkSchema: z.ZodObject<{
    label: z.ZodString;
    href: z.ZodString;
}, "strict", z.ZodTypeAny, {
    label: string;
    href: string;
}, {
    label: string;
    href: string;
}>;
export type RecipeTemplateAuthoringLink = z.infer<typeof RecipeTemplateAuthoringLinkSchema>;
export declare const RecipeTemplateAuthoringListItemSchema: z.ZodObject<Omit<{
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
}, "actions"> & {
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
}, "strict", z.ZodTypeAny, {
    chips: {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }[];
    bullets: string[];
    links: {
        label: string;
        href: string;
    }[];
    title: string;
    id?: string | undefined;
    subtitle?: string | undefined;
    meta?: string | undefined;
}, {
    title: string;
    chips?: {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }[] | undefined;
    bullets?: string[] | undefined;
    links?: {
        label: string;
        href: string;
    }[] | undefined;
    id?: unknown;
    subtitle?: unknown;
    meta?: unknown;
}>;
export type RecipeTemplateAuthoringListItem = z.infer<typeof RecipeTemplateAuthoringListItemSchema>;
export declare const RecipeTemplateAuthoringGroupSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
    items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
    }, "actions"> & {
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        bullets: string[];
        links: {
            label: string;
            href: string;
        }[];
        title: string;
        id?: string | undefined;
        subtitle?: string | undefined;
        meta?: string | undefined;
    }, {
        title: string;
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        bullets?: string[] | undefined;
        links?: {
            label: string;
            href: string;
        }[] | undefined;
        id?: unknown;
        subtitle?: unknown;
        meta?: unknown;
    }>, "many">>;
}, "strict", z.ZodTypeAny, {
    label: string;
    id: string;
    items: {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        bullets: string[];
        links: {
            label: string;
            href: string;
        }[];
        title: string;
        id?: string | undefined;
        subtitle?: string | undefined;
        meta?: string | undefined;
    }[];
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
}, {
    label: string;
    id: string;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    items?: {
        title: string;
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        bullets?: string[] | undefined;
        links?: {
            label: string;
            href: string;
        }[] | undefined;
        id?: unknown;
        subtitle?: unknown;
        meta?: unknown;
    }[] | undefined;
}>;
export type RecipeTemplateAuthoringGroup = z.infer<typeof RecipeTemplateAuthoringGroupSchema>;
export declare const RecipeTemplateAuthoringCardItemSchema: z.ZodObject<Omit<{
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
}, "actions"> & {
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
}, "strict", z.ZodTypeAny, {
    chips: {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }[];
    bullets: string[];
    links: {
        label: string;
        href: string;
    }[];
    title: string;
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
    links?: {
        label: string;
        href: string;
    }[] | undefined;
    id?: unknown;
    subtitle?: unknown;
    meta?: unknown;
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
export type RecipeTemplateAuthoringCardItem = z.infer<typeof RecipeTemplateAuthoringCardItemSchema>;
export declare const RecipeTemplateAuthoringTimelineItemSchema: z.ZodObject<Omit<{
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
}, "actions"> & {
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
}, "strict", z.ZodTypeAny, {
    chips: {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }[];
    links: {
        label: string;
        href: string;
    }[];
    title: string;
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
    links?: {
        label: string;
        href: string;
    }[] | undefined;
    id?: unknown;
    summary?: unknown;
}>;
export type RecipeTemplateAuthoringTimelineItem = z.infer<typeof RecipeTemplateAuthoringTimelineItemSchema>;
export declare const RecipeTemplateAuthoringBoardCardSchema: z.ZodObject<Omit<{
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
}, "actions"> & {
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
}, "strict", z.ZodTypeAny, {
    chips: {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }[];
    links: {
        label: string;
        href: string;
    }[];
    title: string;
    id?: string | undefined;
    subtitle?: string | undefined;
    footer?: string | undefined;
}, {
    title: string;
    chips?: {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }[] | undefined;
    links?: {
        label: string;
        href: string;
    }[] | undefined;
    id?: unknown;
    subtitle?: unknown;
    footer?: unknown;
}>;
export type RecipeTemplateAuthoringBoardCard = z.infer<typeof RecipeTemplateAuthoringBoardCardSchema>;
export declare const RecipeTemplateAuthoringBoardColumnSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
    cards: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
    }, "actions"> & {
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        links: {
            label: string;
            href: string;
        }[];
        title: string;
        id?: string | undefined;
        subtitle?: string | undefined;
        footer?: string | undefined;
    }, {
        title: string;
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        links?: {
            label: string;
            href: string;
        }[] | undefined;
        id?: unknown;
        subtitle?: unknown;
        footer?: unknown;
    }>, "many">>;
}, "strict", z.ZodTypeAny, {
    label: string;
    id: string;
    cards: {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        links: {
            label: string;
            href: string;
        }[];
        title: string;
        id?: string | undefined;
        subtitle?: string | undefined;
        footer?: string | undefined;
    }[];
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
}, {
    label: string;
    id: string;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    cards?: {
        title: string;
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        links?: {
            label: string;
            href: string;
        }[] | undefined;
        id?: unknown;
        subtitle?: unknown;
        footer?: unknown;
    }[] | undefined;
}>;
export type RecipeTemplateAuthoringBoardColumn = z.infer<typeof RecipeTemplateAuthoringBoardColumnSchema>;
export declare const RecipeTemplateAuthoringTableRowSchema: z.ZodObject<Omit<{
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
}, "actions"> & {
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
}, "strict", z.ZodTypeAny, {
    label: string;
    links: {
        label: string;
        href: string;
    }[];
    id: string;
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
    links?: {
        label: string;
        href: string;
    }[] | undefined;
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
export type RecipeTemplateAuthoringTableRow = z.infer<typeof RecipeTemplateAuthoringTableRowSchema>;
export declare const RecipeTemplateAuthoringDetailSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    title: z.ZodString;
    eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
    fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
    }>, "many">>;
    note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
}, "strict", z.ZodTypeAny, {
    chips: {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }[];
    title: string;
    fields: {
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
    }[];
    id?: string | undefined;
    summary?: string | undefined;
    eyebrow?: string | undefined;
    note?: string | undefined;
    noteTitle?: string | undefined;
}, {
    title: string;
    chips?: {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }[] | undefined;
    id?: unknown;
    summary?: unknown;
    eyebrow?: unknown;
    fields?: {
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
    }[] | undefined;
    note?: unknown;
    noteTitle?: unknown;
}>;
export type RecipeTemplateAuthoringDetail = z.infer<typeof RecipeTemplateAuthoringDetailSchema>;
export declare const RecipeTemplateAuthoringChecklistItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    meta: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    checked: z.ZodDefault<z.ZodBoolean>;
    tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
}, "strict", z.ZodTypeAny, {
    id: string;
    title: string;
    checked: boolean;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    subtitle?: string | undefined;
    meta?: string | undefined;
}, {
    id: string;
    title: string;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    subtitle?: unknown;
    meta?: unknown;
    checked?: boolean | undefined;
}>;
export type RecipeTemplateAuthoringChecklistItem = z.infer<typeof RecipeTemplateAuthoringChecklistItemSchema>;
export declare const RecipeTemplateFillBaseSchema: z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    subtitle?: unknown;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const RecipeTemplateFillSchema: z.ZodDiscriminatedUnion<"templateId", [z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"price-comparison-grid">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "price-comparison-grid";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "price-comparison-grid";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"shopping-shortlist">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "shopping-shortlist";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "shopping-shortlist";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"inbox-triage-board">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "inbox-triage-board";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "inbox-triage-board";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"restaurant-finder">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "restaurant-finder";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "restaurant-finder";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"hotel-shortlist">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "hotel-shortlist";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "hotel-shortlist";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"flight-comparison">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "flight-comparison";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "flight-comparison";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"travel-itinerary-planner">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "travel-itinerary-planner";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "travel-itinerary-planner";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"research-notebook">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "research-notebook";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "research-notebook";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"security-review-board">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "security-review-board";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "security-review-board";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"vendor-evaluation-matrix">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "vendor-evaluation-matrix";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "vendor-evaluation-matrix";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"event-planner">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "event-planner";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "event-planner";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"job-search-pipeline">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "job-search-pipeline";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "job-search-pipeline";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"local-discovery-comparison">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "local-discovery-comparison";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "local-discovery-comparison";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"step-by-step-instructions">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "step-by-step-instructions";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_fill";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_fill/v2";
    templateId: "step-by-step-instructions";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>]>;
export type RecipeTemplateFill = z.infer<typeof RecipeTemplateFillSchema>;
export declare const RecipeTemplateHydrationSchema: z.ZodDiscriminatedUnion<"templateId", [z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"price-comparison-grid">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "price-comparison-grid";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "price-comparison-grid";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"shopping-shortlist">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "shopping-shortlist";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "shopping-shortlist";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"inbox-triage-board">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "inbox-triage-board";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "inbox-triage-board";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"restaurant-finder">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "restaurant-finder";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "restaurant-finder";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"hotel-shortlist">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "hotel-shortlist";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "hotel-shortlist";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"flight-comparison">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "flight-comparison";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "flight-comparison";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"travel-itinerary-planner">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "travel-itinerary-planner";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "travel-itinerary-planner";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"research-notebook">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "research-notebook";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "research-notebook";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"security-review-board">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "security-review-board";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "security-review-board";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"vendor-evaluation-matrix">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "vendor-evaluation-matrix";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "vendor-evaluation-matrix";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"event-planner">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "event-planner";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "event-planner";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"job-search-pipeline">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "job-search-pipeline";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "job-search-pipeline";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"local-discovery-comparison">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "local-discovery-comparison";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "local-discovery-comparison";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"step-by-step-instructions">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "step-by-step-instructions";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_hydration";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_hydration/v1";
    templateId: "step-by-step-instructions";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>]>;
export type RecipeTemplateHydration = z.infer<typeof RecipeTemplateHydrationSchema>;
export declare const RecipeTemplateTextSchema: z.ZodDiscriminatedUnion<"templateId", [z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"price-comparison-grid">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "price-comparison-grid";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "price-comparison-grid";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"shopping-shortlist">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "shopping-shortlist";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "shopping-shortlist";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"inbox-triage-board">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "inbox-triage-board";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "inbox-triage-board";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"restaurant-finder">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "restaurant-finder";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "restaurant-finder";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"hotel-shortlist">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "hotel-shortlist";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "hotel-shortlist";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"flight-comparison">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "flight-comparison";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "flight-comparison";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"travel-itinerary-planner">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "travel-itinerary-planner";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "travel-itinerary-planner";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"research-notebook">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "research-notebook";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "research-notebook";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"security-review-board">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "security-review-board";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "security-review-board";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"vendor-evaluation-matrix">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "vendor-evaluation-matrix";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "vendor-evaluation-matrix";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"event-planner">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "event-planner";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "event-planner";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"job-search-pipeline">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "job-search-pipeline";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "job-search-pipeline";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"local-discovery-comparison">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "local-discovery-comparison";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "local-discovery-comparison";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"step-by-step-instructions">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "step-by-step-instructions";
    metadata: Record<string, unknown>;
    subtitle?: string | undefined;
    data?: any;
}, {
    kind: "recipe_template_text";
    title: string;
    summary: string;
    schemaVersion: "recipe_template_text/v1";
    templateId: "step-by-step-instructions";
    subtitle?: unknown;
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>]>;
export type RecipeTemplateText = z.infer<typeof RecipeTemplateTextSchema>;
export declare const RecipeTemplateActionsSchema: z.ZodDiscriminatedUnion<"templateId", [z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"price-comparison-grid">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "price-comparison-grid";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "price-comparison-grid";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"shopping-shortlist">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "shopping-shortlist";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "shopping-shortlist";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"inbox-triage-board">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "inbox-triage-board";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "inbox-triage-board";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"restaurant-finder">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "restaurant-finder";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "restaurant-finder";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"hotel-shortlist">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "hotel-shortlist";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "hotel-shortlist";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"flight-comparison">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "flight-comparison";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "flight-comparison";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"travel-itinerary-planner">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "travel-itinerary-planner";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "travel-itinerary-planner";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"research-notebook">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "research-notebook";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "research-notebook";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"security-review-board">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "security-review-board";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "security-review-board";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"vendor-evaluation-matrix">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "vendor-evaluation-matrix";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "vendor-evaluation-matrix";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"event-planner">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "event-planner";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "event-planner";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"job-search-pipeline">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "job-search-pipeline";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "job-search-pipeline";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"local-discovery-comparison">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "local-discovery-comparison";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "local-discovery-comparison";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"step-by-step-instructions">;
    data: z.ZodTypeAny;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "step-by-step-instructions";
    metadata: Record<string, unknown>;
    data?: any;
}, {
    kind: "recipe_template_actions";
    schemaVersion: "recipe_template_actions/v1";
    templateId: "step-by-step-instructions";
    data?: any;
    metadata?: Record<string, unknown> | undefined;
}>]>;
export type RecipeTemplateActions = z.infer<typeof RecipeTemplateActionsSchema>;
export declare const RecipeTemplateUpdateOperationSchema: z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
    op: z.ZodLiteral<"set_header">;
    title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
}, "strict", z.ZodTypeAny, {
    op: "set_header";
    title?: string | undefined;
    subtitle?: string | undefined;
    summary?: string | undefined;
}, {
    op: "set_header";
    title?: unknown;
    subtitle?: unknown;
    summary?: unknown;
}>, z.ZodObject<{
    op: z.ZodLiteral<"set_active_tab">;
    slotId: z.ZodString;
    tabId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    slotId: string;
    op: "set_active_tab";
    tabId: string;
}, {
    slotId: string;
    op: "set_active_tab";
    tabId: string;
}>, z.ZodObject<{
    op: z.ZodLiteral<"append_note_lines">;
    slotId: z.ZodString;
    lines: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    slotId: string;
    lines: string[];
    op: "append_note_lines";
}, {
    slotId: string;
    lines: string[];
    op: "append_note_lines";
}>, z.ZodObject<{
    op: z.ZodLiteral<"set_filter_chips">;
    slotId: z.ZodString;
    filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
    }, "strict", z.ZodTypeAny, {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }, {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }>, "many">>;
    sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
}, "strict", z.ZodTypeAny, {
    slotId: string;
    filters: {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }[];
    op: "set_filter_chips";
    sortLabel?: string | undefined;
}, {
    slotId: string;
    op: "set_filter_chips";
    filters?: {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }[] | undefined;
    sortLabel?: unknown;
}>, z.ZodObject<{
    op: z.ZodLiteral<"set_scope_tags">;
    slotId: z.ZodString;
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
}, "strict", z.ZodTypeAny, {
    chips: {
        label: string;
        tone: "neutral" | "accent" | "success" | "warning" | "danger";
    }[];
    slotId: string;
    op: "set_scope_tags";
}, {
    slotId: string;
    op: "set_scope_tags";
    chips?: {
        label: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }[] | undefined;
}>, z.ZodObject<{
    op: z.ZodLiteral<"upsert_table_rows">;
    slotId: z.ZodString;
    rows: z.ZodArray<z.ZodObject<Omit<{
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
    }, "actions"> & {
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
    }, "strict", z.ZodTypeAny, {
        label: string;
        links: {
            label: string;
            href: string;
        }[];
        id: string;
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
        links?: {
            label: string;
            href: string;
        }[] | undefined;
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
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    slotId: string;
    rows: {
        label: string;
        links: {
            label: string;
            href: string;
        }[];
        id: string;
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
    }[];
    op: "upsert_table_rows";
}, {
    slotId: string;
    rows: {
        label: string;
        id: string;
        links?: {
            label: string;
            href: string;
        }[] | undefined;
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
    }[];
    op: "upsert_table_rows";
}>, z.ZodObject<{
    op: z.ZodLiteral<"upsert_cards">;
    slotId: z.ZodString;
    cards: z.ZodArray<z.ZodObject<Omit<{
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
    }, "actions"> & {
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        bullets: string[];
        links: {
            label: string;
            href: string;
        }[];
        title: string;
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
        links?: {
            label: string;
            href: string;
        }[] | undefined;
        id?: unknown;
        subtitle?: unknown;
        meta?: unknown;
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
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    cards: {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        bullets: string[];
        links: {
            label: string;
            href: string;
        }[];
        title: string;
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
    }[];
    slotId: string;
    op: "upsert_cards";
}, {
    cards: {
        title: string;
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        bullets?: string[] | undefined;
        links?: {
            label: string;
            href: string;
        }[] | undefined;
        id?: unknown;
        subtitle?: unknown;
        meta?: unknown;
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
    }[];
    slotId: string;
    op: "upsert_cards";
}>, z.ZodObject<{
    op: z.ZodLiteral<"upsert_groups">;
    slotId: z.ZodString;
    groups: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            meta?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
        }>, "many">>;
    }, "strict", z.ZodTypeAny, {
        label: string;
        id: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            meta?: string | undefined;
        }[];
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }, {
        label: string;
        id: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        items?: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
        }[] | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    slotId: string;
    groups: {
        label: string;
        id: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            meta?: string | undefined;
        }[];
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
    }[];
    op: "upsert_groups";
}, {
    slotId: string;
    groups: {
        label: string;
        id: string;
        tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        items?: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
        }[] | undefined;
    }[];
    op: "upsert_groups";
}>, z.ZodObject<{
    op: z.ZodLiteral<"upsert_timeline_items">;
    slotId: z.ZodString;
    items: z.ZodArray<z.ZodObject<Omit<{
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
    }, "actions"> & {
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        links: {
            label: string;
            href: string;
        }[];
        title: string;
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
        links?: {
            label: string;
            href: string;
        }[] | undefined;
        id?: unknown;
        summary?: unknown;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    slotId: string;
    items: {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        links: {
            label: string;
            href: string;
        }[];
        title: string;
        time: string;
        id?: string | undefined;
        summary?: string | undefined;
    }[];
    op: "upsert_timeline_items";
}, {
    slotId: string;
    items: {
        title: string;
        time: string;
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        links?: {
            label: string;
            href: string;
        }[] | undefined;
        id?: unknown;
        summary?: unknown;
    }[];
    op: "upsert_timeline_items";
}>, z.ZodObject<{
    op: z.ZodLiteral<"set_detail">;
    slotId: z.ZodString;
    detail: z.ZodObject<{
        id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        title: z.ZodString;
        eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
        fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }>, "many">>;
        note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        title: string;
        fields: {
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
        }[];
        id?: string | undefined;
        summary?: string | undefined;
        eyebrow?: string | undefined;
        note?: string | undefined;
        noteTitle?: string | undefined;
    }, {
        title: string;
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        id?: unknown;
        summary?: unknown;
        eyebrow?: unknown;
        fields?: {
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
        }[] | undefined;
        note?: unknown;
        noteTitle?: unknown;
    }>;
}, "strict", z.ZodTypeAny, {
    detail: {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        title: string;
        fields: {
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
        }[];
        id?: string | undefined;
        summary?: string | undefined;
        eyebrow?: string | undefined;
        note?: string | undefined;
        noteTitle?: string | undefined;
    };
    slotId: string;
    op: "set_detail";
}, {
    detail: {
        title: string;
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        id?: unknown;
        summary?: unknown;
        eyebrow?: unknown;
        fields?: {
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
        }[] | undefined;
        note?: unknown;
        noteTitle?: unknown;
    };
    slotId: string;
    op: "set_detail";
}>, z.ZodObject<{
    op: z.ZodLiteral<"upsert_board_cards">;
    slotId: z.ZodString;
    columnId: z.ZodString;
    cards: z.ZodArray<z.ZodObject<Omit<{
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
    }, "actions"> & {
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        links: {
            label: string;
            href: string;
        }[];
        title: string;
        id?: string | undefined;
        subtitle?: string | undefined;
        footer?: string | undefined;
    }, {
        title: string;
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        links?: {
            label: string;
            href: string;
        }[] | undefined;
        id?: unknown;
        subtitle?: unknown;
        footer?: unknown;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    cards: {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        links: {
            label: string;
            href: string;
        }[];
        title: string;
        id?: string | undefined;
        subtitle?: string | undefined;
        footer?: string | undefined;
    }[];
    slotId: string;
    op: "upsert_board_cards";
    columnId: string;
}, {
    cards: {
        title: string;
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        links?: {
            label: string;
            href: string;
        }[] | undefined;
        id?: unknown;
        subtitle?: unknown;
        footer?: unknown;
    }[];
    slotId: string;
    op: "upsert_board_cards";
    columnId: string;
}>, z.ZodObject<{
    op: z.ZodLiteral<"move_board_card">;
    slotId: z.ZodString;
    cardId: z.ZodString;
    targetColumnId: z.ZodString;
    position: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    slotId: string;
    op: "move_board_card";
    cardId: string;
    targetColumnId: string;
    position?: number | undefined;
}, {
    slotId: string;
    op: "move_board_card";
    cardId: string;
    targetColumnId: string;
    position?: number | undefined;
}>, z.ZodObject<{
    op: z.ZodLiteral<"remove_items">;
    slotId: z.ZodString;
    itemIds: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    slotId: string;
    op: "remove_items";
    itemIds: string[];
}, {
    slotId: string;
    op: "remove_items";
    itemIds: string[];
}>, z.ZodObject<{
    op: z.ZodLiteral<"set_status">;
    statusLabel: z.ZodString;
}, "strict", z.ZodTypeAny, {
    op: "set_status";
    statusLabel: string;
}, {
    op: "set_status";
    statusLabel: string;
}>]>;
export type RecipeTemplateUpdateOperation = z.infer<typeof RecipeTemplateUpdateOperationSchema>;
export declare const RecipeTemplateUpdateSchema: z.ZodDiscriminatedUnion<"templateId", [z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"price-comparison-grid">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "price-comparison-grid";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "price-comparison-grid";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"shopping-shortlist">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "shopping-shortlist";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "shopping-shortlist";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"inbox-triage-board">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "inbox-triage-board";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "inbox-triage-board";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"restaurant-finder">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "restaurant-finder";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "restaurant-finder";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"hotel-shortlist">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "hotel-shortlist";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "hotel-shortlist";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"flight-comparison">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "flight-comparison";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "flight-comparison";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"travel-itinerary-planner">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "travel-itinerary-planner";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "travel-itinerary-planner";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"research-notebook">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "research-notebook";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "research-notebook";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"security-review-board">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "security-review-board";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "security-review-board";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"vendor-evaluation-matrix">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "vendor-evaluation-matrix";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "vendor-evaluation-matrix";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"event-planner">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "event-planner";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "event-planner";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"job-search-pipeline">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "job-search-pipeline";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "job-search-pipeline";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"local-discovery-comparison">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "local-discovery-comparison";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "local-discovery-comparison";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"op", [z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        subtitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        summary: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    }, {
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }, {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }, {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }, {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }>, "many">>;
        sortLabel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    }, {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, "strict", z.ZodTypeAny, {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    }, {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    }, {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<["neutral", "accent", "success", "warning", "danger"]>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<Omit<{
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
            }, "actions"> & {
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
            }, "strict", z.ZodTypeAny, {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }, {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }>, "many">>;
        }, "strict", z.ZodTypeAny, {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }, {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    }, {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    }, {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            title: z.ZodString;
            eyebrow: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }>, "many">>;
            note: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
            noteTitle: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        }>;
    }, "strict", z.ZodTypeAny, {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    }, {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    }>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<Omit<{
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
        }, "actions"> & {
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
        }, "strict", z.ZodTypeAny, {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }, {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }, {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }, {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    }>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }, {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    }>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        op: "set_status";
        statusLabel: string;
    }, {
        op: "set_status";
        statusLabel: string;
    }>]>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    templateId: z.ZodLiteral<"step-by-step-instructions">;
}, "strict", z.ZodTypeAny, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "step-by-step-instructions";
    metadata: Record<string, unknown>;
    operations: ({
        op: "set_header";
        title?: string | undefined;
        subtitle?: string | undefined;
        summary?: string | undefined;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        filters: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        op: "set_filter_chips";
        sortLabel?: string | undefined;
    } | {
        chips: {
            label: string;
            tone: "neutral" | "accent" | "success" | "warning" | "danger";
        }[];
        slotId: string;
        op: "set_scope_tags";
    } | {
        slotId: string;
        rows: {
            label: string;
            links: {
                label: string;
                href: string;
            }[];
            id: string;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            bullets: string[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            items: {
                chips: {
                    label: string;
                    tone: "neutral" | "accent" | "success" | "warning" | "danger";
                }[];
                bullets: string[];
                links: {
                    label: string;
                    href: string;
                }[];
                title: string;
                id?: string | undefined;
                subtitle?: string | undefined;
                meta?: string | undefined;
            }[];
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            time: string;
            id?: string | undefined;
            summary?: string | undefined;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            title: string;
            fields: {
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
            }[];
            id?: string | undefined;
            summary?: string | undefined;
            eyebrow?: string | undefined;
            note?: string | undefined;
            noteTitle?: string | undefined;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            chips: {
                label: string;
                tone: "neutral" | "accent" | "success" | "warning" | "danger";
            }[];
            links: {
                label: string;
                href: string;
            }[];
            title: string;
            id?: string | undefined;
            subtitle?: string | undefined;
            footer?: string | undefined;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[];
}, {
    kind: "recipe_template_update";
    schemaVersion: "recipe_template_update/v2";
    templateId: "step-by-step-instructions";
    metadata?: Record<string, unknown> | undefined;
    operations?: ({
        op: "set_header";
        title?: unknown;
        subtitle?: unknown;
        summary?: unknown;
    } | {
        slotId: string;
        op: "set_active_tab";
        tabId: string;
    } | {
        slotId: string;
        lines: string[];
        op: "append_note_lines";
    } | {
        slotId: string;
        op: "set_filter_chips";
        filters?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
        sortLabel?: unknown;
    } | {
        slotId: string;
        op: "set_scope_tags";
        chips?: {
            label: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
        }[] | undefined;
    } | {
        slotId: string;
        rows: {
            label: string;
            id: string;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
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
        }[];
        op: "upsert_table_rows";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            bullets?: string[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            meta?: unknown;
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
        }[];
        slotId: string;
        op: "upsert_cards";
    } | {
        slotId: string;
        groups: {
            label: string;
            id: string;
            tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            items?: {
                title: string;
                chips?: {
                    label: string;
                    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
                }[] | undefined;
                bullets?: string[] | undefined;
                links?: {
                    label: string;
                    href: string;
                }[] | undefined;
                id?: unknown;
                subtitle?: unknown;
                meta?: unknown;
            }[] | undefined;
        }[];
        op: "upsert_groups";
    } | {
        slotId: string;
        items: {
            title: string;
            time: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
        }[];
        op: "upsert_timeline_items";
    } | {
        detail: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            id?: unknown;
            summary?: unknown;
            eyebrow?: unknown;
            fields?: {
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
            }[] | undefined;
            note?: unknown;
            noteTitle?: unknown;
        };
        slotId: string;
        op: "set_detail";
    } | {
        cards: {
            title: string;
            chips?: {
                label: string;
                tone?: "neutral" | "accent" | "success" | "warning" | "danger" | undefined;
            }[] | undefined;
            links?: {
                label: string;
                href: string;
            }[] | undefined;
            id?: unknown;
            subtitle?: unknown;
            footer?: unknown;
        }[];
        slotId: string;
        op: "upsert_board_cards";
        columnId: string;
    } | {
        slotId: string;
        op: "move_board_card";
        cardId: string;
        targetColumnId: string;
        position?: number | undefined;
    } | {
        slotId: string;
        op: "remove_items";
        itemIds: string[];
    } | {
        op: "set_status";
        statusLabel: string;
    })[] | undefined;
}>]>;
export type RecipeTemplateUpdate = z.infer<typeof RecipeTemplateUpdateSchema>;
