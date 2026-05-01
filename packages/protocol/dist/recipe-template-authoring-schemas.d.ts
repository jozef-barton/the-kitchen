import { z } from 'zod';
export declare const RecipeTemplateSelectionHintsSchema: z.ZodObject<{
    primaryEntity: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    currentTemplateId: z.ZodOptional<z.ZodString>;
    suggestedTransitionFrom: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type RecipeTemplateSelectionHints = z.infer<typeof RecipeTemplateSelectionHintsSchema>;
export declare const RecipeMutationKindSchema: z.ZodEnum<{
    change_layout: "change_layout";
    change_visual: "change_visual";
    add_content: "add_content";
    remove_content: "remove_content";
    refine_existing: "refine_existing";
    switch_recipe: "switch_recipe";
}>;
export type RecipeMutationKind = z.infer<typeof RecipeMutationKindSchema>;
export declare const RecipeMutationIntentSchema: z.ZodObject<{
    kind: z.ZodEnum<{
        change_layout: "change_layout";
        change_visual: "change_visual";
        add_content: "add_content";
        remove_content: "remove_content";
        refine_existing: "refine_existing";
        switch_recipe: "switch_recipe";
    }>;
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
}, z.core.$strict>;
export type RecipeMutationIntent = z.infer<typeof RecipeMutationIntentSchema>;
export declare const RecipeTemplateSelectionModeSchema: z.ZodEnum<{
    fill: "fill";
    update: "update";
    switch: "switch";
}>;
export type RecipeTemplateSelectionMode = z.infer<typeof RecipeTemplateSelectionModeSchema>;
export declare const RecipeTemplateSelectionSchema: z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_selection">;
    schemaVersion: z.ZodLiteral<"recipe_template_selection/v2">;
    templateId: z.ZodString;
    mode: z.ZodDefault<z.ZodEnum<{
        fill: "fill";
        update: "update";
        switch: "switch";
    }>>;
    reason: z.ZodString;
    confidence: z.ZodNumber;
    hints: z.ZodOptional<z.ZodObject<{
        primaryEntity: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        currentTemplateId: z.ZodOptional<z.ZodString>;
        suggestedTransitionFrom: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type RecipeTemplateSelection = z.infer<typeof RecipeTemplateSelectionSchema>;
export declare const RecipeTemplateAuthoringLinkSchema: z.ZodObject<{
    label: z.ZodString;
    href: z.ZodString;
}, z.core.$strict>;
export type RecipeTemplateAuthoringLink = z.infer<typeof RecipeTemplateAuthoringLinkSchema>;
export declare const RecipeTemplateAuthoringListItemSchema: z.ZodObject<{
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
    id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    title: z.ZodString;
    bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
    links: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        href: z.ZodString;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type RecipeTemplateAuthoringListItem = z.infer<typeof RecipeTemplateAuthoringListItemSchema>;
export declare const RecipeTemplateAuthoringGroupSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    tone: z.ZodOptional<z.ZodEnum<{
        success: "success";
        neutral: "neutral";
        accent: "accent";
        warning: "warning";
        danger: "danger";
    }>>;
    items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        title: z.ZodString;
        bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
        links: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
        }, z.core.$strict>>>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type RecipeTemplateAuthoringGroup = z.infer<typeof RecipeTemplateAuthoringGroupSchema>;
export declare const RecipeTemplateAuthoringCardItemSchema: z.ZodObject<{
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
    id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    title: z.ZodString;
    imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
    links: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        href: z.ZodString;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type RecipeTemplateAuthoringCardItem = z.infer<typeof RecipeTemplateAuthoringCardItemSchema>;
export declare const RecipeTemplateAuthoringTimelineItemSchema: z.ZodObject<{
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
    id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    title: z.ZodString;
    summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    time: z.ZodString;
    links: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        href: z.ZodString;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type RecipeTemplateAuthoringTimelineItem = z.infer<typeof RecipeTemplateAuthoringTimelineItemSchema>;
export declare const RecipeTemplateAuthoringBoardCardSchema: z.ZodObject<{
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
    id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    title: z.ZodString;
    footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    links: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        href: z.ZodString;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type RecipeTemplateAuthoringBoardCard = z.infer<typeof RecipeTemplateAuthoringBoardCardSchema>;
export declare const RecipeTemplateAuthoringBoardColumnSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    tone: z.ZodOptional<z.ZodEnum<{
        success: "success";
        neutral: "neutral";
        accent: "accent";
        warning: "warning";
        danger: "danger";
    }>>;
    cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        title: z.ZodString;
        footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        links: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
        }, z.core.$strict>>>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type RecipeTemplateAuthoringBoardColumn = z.infer<typeof RecipeTemplateAuthoringBoardColumnSchema>;
export declare const RecipeTemplateAuthoringTableRowSchema: z.ZodObject<{
    label: z.ZodString;
    id: z.ZodString;
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
    links: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        href: z.ZodString;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type RecipeTemplateAuthoringTableRow = z.infer<typeof RecipeTemplateAuthoringTableRowSchema>;
export declare const RecipeTemplateAuthoringDetailSchema: z.ZodObject<{
    id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    title: z.ZodString;
    eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
    fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
    }, z.core.$strict>>>;
    note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
}, z.core.$strict>;
export type RecipeTemplateAuthoringDetail = z.infer<typeof RecipeTemplateAuthoringDetailSchema>;
export declare const RecipeTemplateAuthoringChecklistItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    checked: z.ZodDefault<z.ZodBoolean>;
    tone: z.ZodOptional<z.ZodEnum<{
        success: "success";
        neutral: "neutral";
        accent: "accent";
        warning: "warning";
        danger: "danger";
    }>>;
}, z.core.$strict>;
export type RecipeTemplateAuthoringChecklistItem = z.infer<typeof RecipeTemplateAuthoringChecklistItemSchema>;
export declare const RecipeTemplateFillBaseSchema: z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export declare const RecipeTemplateFillSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"price-comparison-grid">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        scopeTags: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        columns: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            align: z.ZodDefault<z.ZodEnum<{
                start: "start";
                end: "end";
                center: "center";
            }>>;
        }, z.core.$strict>>;
        rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"shopping-shortlist">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"inbox-triage-board">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
        bulkActionTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"restaurant-finder">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"hotel-shortlist">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"flight-comparison">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        activeTabId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        legs: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            badge: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            columns: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                align: z.ZodDefault<z.ZodEnum<{
                    start: "start";
                    end: "end";
                    center: "center";
                }>>;
            }, z.core.$strict>>;
            rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                id: z.ZodString;
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
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
            footnote: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"travel-itinerary-planner">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        activeTabId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        itineraryItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        bookingCards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        packingItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            checked: z.ZodDefault<z.ZodBoolean>;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
        links: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"research-notebook">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        activeTabId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        sources: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
        extractedPoints: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        followUps: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"security-review-board">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
        remediationTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        remediationMarkdown: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"vendor-evaluation-matrix">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        columns: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            align: z.ZodDefault<z.ZodEnum<{
                start: "start";
                end: "end";
                center: "center";
            }>>;
        }, z.core.$strict>>;
        rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        footerChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        footnote: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"event-planner">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        activeTabId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        venueCards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        guestGroups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        checklistItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            checked: z.ZodDefault<z.ZodBoolean>;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        itineraryItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"job-search-pipeline">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"local-discovery-comparison">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_fill">;
    schemaVersion: z.ZodLiteral<"recipe_template_fill/v2">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"step-by-step-instructions">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        prerequisites: z.ZodDefault<z.ZodArray<z.ZodString>>;
        steps: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            detail: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>], "templateId">;
export type RecipeTemplateFill = z.infer<typeof RecipeTemplateFillSchema>;
export declare const RecipeTemplateHydrationSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"price-comparison-grid">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        scopeTags: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        columns: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            align: z.ZodDefault<z.ZodEnum<{
                start: "start";
                end: "end";
                center: "center";
            }>>;
        }, z.core.$strict>>;
        rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"shopping-shortlist">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"inbox-triage-board">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
        bulkActionTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"restaurant-finder">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"hotel-shortlist">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"flight-comparison">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        activeTabId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        legs: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            badge: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            columns: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                align: z.ZodDefault<z.ZodEnum<{
                    start: "start";
                    end: "end";
                    center: "center";
                }>>;
            }, z.core.$strict>>;
            rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                id: z.ZodString;
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
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
            footnote: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"travel-itinerary-planner">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        activeTabId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        itineraryItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        bookingCards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        packingItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            checked: z.ZodDefault<z.ZodBoolean>;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
        links: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"research-notebook">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        activeTabId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        sources: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
        extractedPoints: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        followUps: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"security-review-board">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
        remediationTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        remediationMarkdown: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"vendor-evaluation-matrix">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        columns: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            align: z.ZodDefault<z.ZodEnum<{
                start: "start";
                end: "end";
                center: "center";
            }>>;
        }, z.core.$strict>>;
        rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        footerChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        footnote: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"event-planner">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        activeTabId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        venueCards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        guestGroups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        checklistItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            checked: z.ZodDefault<z.ZodBoolean>;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        itineraryItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"job-search-pipeline">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"local-discovery-comparison">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_hydration">;
    schemaVersion: z.ZodLiteral<"recipe_template_hydration/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"step-by-step-instructions">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        prerequisites: z.ZodDefault<z.ZodArray<z.ZodString>>;
        steps: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            detail: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>], "templateId">;
export type RecipeTemplateHydration = z.infer<typeof RecipeTemplateHydrationSchema>;
export declare const RecipeTemplateTextSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"price-comparison-grid">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        scopeTags: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        columns: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            align: z.ZodDefault<z.ZodEnum<{
                start: "start";
                end: "end";
                center: "center";
            }>>;
        }, z.core.$strict>>;
        rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"shopping-shortlist">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"inbox-triage-board">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
        bulkActionTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"restaurant-finder">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"hotel-shortlist">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"flight-comparison">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        activeTabId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        legs: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            badge: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            columns: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                align: z.ZodDefault<z.ZodEnum<{
                    start: "start";
                    end: "end";
                    center: "center";
                }>>;
            }, z.core.$strict>>;
            rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                id: z.ZodString;
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
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
            footnote: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"travel-itinerary-planner">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        activeTabId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        itineraryItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        bookingCards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        packingItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            checked: z.ZodDefault<z.ZodBoolean>;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
        links: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"research-notebook">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        activeTabId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        sources: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
        extractedPoints: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        followUps: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"security-review-board">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
        remediationTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        remediationMarkdown: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"vendor-evaluation-matrix">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        columns: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            align: z.ZodDefault<z.ZodEnum<{
                start: "start";
                end: "end";
                center: "center";
            }>>;
        }, z.core.$strict>>;
        rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        footerChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        footnote: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"event-planner">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        activeTabId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        venueCards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        guestGroups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        checklistItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            checked: z.ZodDefault<z.ZodBoolean>;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        itineraryItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"job-search-pipeline">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"local-discovery-comparison">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_text">;
    schemaVersion: z.ZodLiteral<"recipe_template_text/v1">;
    title: z.ZodString;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"step-by-step-instructions">;
    data: z.ZodObject<{
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        heroChips: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        prerequisites: z.ZodDefault<z.ZodArray<z.ZodString>>;
        steps: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            detail: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>>>;
        noteLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>], "templateId">;
export type RecipeTemplateText = z.infer<typeof RecipeTemplateTextSchema>;
export declare const RecipeTemplateActionsSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"price-comparison-grid">;
    data: z.ZodObject<{
        rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"shopping-shortlist">;
    data: z.ZodObject<{
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"inbox-triage-board">;
    data: z.ZodObject<{
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodOptional<z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"restaurant-finder">;
    data: z.ZodObject<{
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodOptional<z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"hotel-shortlist">;
    data: z.ZodObject<{
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"flight-comparison">;
    data: z.ZodObject<{
        legs: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"travel-itinerary-planner">;
    data: z.ZodObject<{
        itineraryItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        bookingCards: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        links: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"research-notebook">;
    data: z.ZodObject<{
        sources: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        extractedPoints: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        followUps: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"security-review-board">;
    data: z.ZodObject<{
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodOptional<z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"vendor-evaluation-matrix">;
    data: z.ZodObject<{
        rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"event-planner">;
    data: z.ZodObject<{
        venueCards: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        guestGroups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        itineraryItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"job-search-pipeline">;
    data: z.ZodObject<{
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"local-discovery-comparison">;
    data: z.ZodObject<{
        groups: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        detail: z.ZodOptional<z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_actions">;
    schemaVersion: z.ZodLiteral<"recipe_template_actions/v1">;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"step-by-step-instructions">;
    data: z.ZodObject<{
        steps: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strip>>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
}, z.core.$strict>], "templateId">;
export type RecipeTemplateActions = z.infer<typeof RecipeTemplateActionsSchema>;
export declare const RecipeTemplateUpdateOperationSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    op: z.ZodLiteral<"set_header">;
    title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
}, z.core.$strict>, z.ZodObject<{
    op: z.ZodLiteral<"set_active_tab">;
    slotId: z.ZodString;
    tabId: z.ZodString;
}, z.core.$strict>, z.ZodObject<{
    op: z.ZodLiteral<"append_note_lines">;
    slotId: z.ZodString;
    lines: z.ZodArray<z.ZodString>;
}, z.core.$strict>, z.ZodObject<{
    op: z.ZodLiteral<"set_filter_chips">;
    slotId: z.ZodString;
    filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<{
            success: "success";
            neutral: "neutral";
            accent: "accent";
            warning: "warning";
            danger: "danger";
        }>>;
    }, z.core.$strict>>>;
    sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
}, z.core.$strict>, z.ZodObject<{
    op: z.ZodLiteral<"set_scope_tags">;
    slotId: z.ZodString;
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
}, z.core.$strict>, z.ZodObject<{
    op: z.ZodLiteral<"upsert_table_rows">;
    slotId: z.ZodString;
    rows: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        id: z.ZodString;
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
        links: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
        }, z.core.$strict>>>;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    op: z.ZodLiteral<"upsert_cards">;
    slotId: z.ZodString;
    cards: z.ZodArray<z.ZodObject<{
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
        id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        title: z.ZodString;
        imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
        links: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
        }, z.core.$strict>>>;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    op: z.ZodLiteral<"upsert_groups">;
    slotId: z.ZodString;
    groups: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        tone: z.ZodOptional<z.ZodEnum<{
            success: "success";
            neutral: "neutral";
            accent: "accent";
            warning: "warning";
            danger: "danger";
        }>>;
        items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    op: z.ZodLiteral<"upsert_timeline_items">;
    slotId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
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
        id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        title: z.ZodString;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        time: z.ZodString;
        links: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
        }, z.core.$strict>>>;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    op: z.ZodLiteral<"set_detail">;
    slotId: z.ZodString;
    detail: z.ZodObject<{
        id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        title: z.ZodString;
        eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
        fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
        }, z.core.$strict>>>;
        note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    op: z.ZodLiteral<"upsert_board_cards">;
    slotId: z.ZodString;
    columnId: z.ZodString;
    cards: z.ZodArray<z.ZodObject<{
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
        id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        title: z.ZodString;
        footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        links: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
        }, z.core.$strict>>>;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    op: z.ZodLiteral<"move_board_card">;
    slotId: z.ZodString;
    cardId: z.ZodString;
    targetColumnId: z.ZodString;
    position: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>, z.ZodObject<{
    op: z.ZodLiteral<"remove_items">;
    slotId: z.ZodString;
    itemIds: z.ZodArray<z.ZodString>;
}, z.core.$strict>, z.ZodObject<{
    op: z.ZodLiteral<"set_status">;
    statusLabel: z.ZodString;
}, z.core.$strict>], "op">;
export type RecipeTemplateUpdateOperation = z.infer<typeof RecipeTemplateUpdateOperationSchema>;
export declare const RecipeTemplateUpdateSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"price-comparison-grid">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"shopping-shortlist">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"inbox-triage-board">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"restaurant-finder">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"hotel-shortlist">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"flight-comparison">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"travel-itinerary-planner">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"research-notebook">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"security-review-board">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"vendor-evaluation-matrix">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"event-planner">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"job-search-pipeline">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"local-discovery-comparison">;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"recipe_template_update">;
    schemaVersion: z.ZodLiteral<"recipe_template_update/v2">;
    operations: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"set_header">;
        title: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_active_tab">;
        slotId: z.ZodString;
        tabId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"append_note_lines">;
        slotId: z.ZodString;
        lines: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_filter_chips">;
        slotId: z.ZodString;
        filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            tone: z.ZodDefault<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
        }, z.core.$strict>>>;
        sortLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_scope_tags">;
        slotId: z.ZodString;
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
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_table_rows">;
        slotId: z.ZodString;
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            id: z.ZodString;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_cards">;
        slotId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            imageLabel: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            price: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_groups">;
        slotId: z.ZodString;
        groups: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tone: z.ZodOptional<z.ZodEnum<{
                success: "success";
                neutral: "neutral";
                accent: "accent";
                warning: "warning";
                danger: "danger";
            }>>;
            items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
                id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                meta: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
                title: z.ZodString;
                bullets: z.ZodDefault<z.ZodArray<z.ZodString>>;
                links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_timeline_items">;
        slotId: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            summary: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            time: z.ZodString;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_detail">;
        slotId: z.ZodString;
        detail: z.ZodObject<{
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            eyebrow: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
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
            fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>>;
            note: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            noteTitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"upsert_board_cards">;
        slotId: z.ZodString;
        columnId: z.ZodString;
        cards: z.ZodArray<z.ZodObject<{
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
            id: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            subtitle: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            title: z.ZodString;
            footer: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
            links: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"move_board_card">;
        slotId: z.ZodString;
        cardId: z.ZodString;
        targetColumnId: z.ZodString;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"remove_items">;
        slotId: z.ZodString;
        itemIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        op: z.ZodLiteral<"set_status">;
        statusLabel: z.ZodString;
    }, z.core.$strict>], "op">>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    templateId: z.ZodLiteral<"step-by-step-instructions">;
}, z.core.$strict>], "templateId">;
export type RecipeTemplateUpdate = z.infer<typeof RecipeTemplateUpdateSchema>;
