import type { Recipe, RecipeContentEntry, RecipeCardData, RecipeContentTab, RecipeContentFormat, RecipeContentModel, RecipeExtensionTab, RecipeMarkdownData, RecipeTableData, RecipeTab, RecipeUiState } from './schemas';
type RecipeNormalizedTabs = [RecipeContentTab, ...RecipeExtensionTab[]];
export declare function getRecipeContentIntegrityFingerprint(content: Pick<RecipeContentModel, 'entries' | 'markdownRepresentation' | 'tableRepresentation' | 'cardRepresentation'> | RecipeContentModel): string;
export declare function synchronizeRecipeContentModel(options?: {
    currentContent?: RecipeContentModel | null;
    activeView?: RecipeContentFormat;
    sourceView?: RecipeContentFormat;
    contentData?: unknown;
    content?: unknown;
}): RecipeContentModel;
export declare function isRecipeContentSynchronized(content: RecipeContentModel): boolean;
export declare function isRecipeContentMeaningful(content: RecipeContentModel): boolean;
export declare function createDefaultRecipeContentModel(format?: RecipeContentFormat): {
    activeView: "table" | "card" | "markdown";
    entries: {
        id: string;
        md: string;
        row: Record<string, string | number | boolean | {
            kind: "link" | "text" | "email";
            text?: string | undefined;
            href?: string | undefined;
            imageUrl?: string | undefined;
            imageAlt?: string | undefined;
        } | null>;
        card: {
            id: string;
            title: string;
            badges: string[];
            metadata: {
                label: string;
                value: string;
                link?: {
                    label: string;
                    url: string;
                    kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
                } | undefined;
            }[];
            links: {
                label: string;
                url: string;
                kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
            }[];
            description?: string | undefined;
            eyebrow?: string | undefined;
            image?: {
                url: string;
                alt?: string | undefined;
            } | undefined;
        };
        metadata: Record<string, unknown>;
        source?: {
            integration: string;
            kind: string;
            resourceId: string;
            metadata: Record<string, unknown>;
            label?: string | undefined;
        } | undefined;
    }[];
    markdownRepresentation: {
        markdown: string;
    };
    tableRepresentation: {
        columns: {
            id: string;
            label: string;
            emphasis: "none" | "status" | "primary";
            presentation: "link" | "image" | "text" | "email";
        }[];
        rows: Record<string, string | number | boolean | {
            kind: "link" | "text" | "email";
            text?: string | undefined;
            href?: string | undefined;
            imageUrl?: string | undefined;
            imageAlt?: string | undefined;
        } | null>[];
        emptyMessage?: string | undefined;
    };
    cardRepresentation: {
        cards: {
            id: string;
            title: string;
            badges: string[];
            metadata: {
                label: string;
                value: string;
                link?: {
                    label: string;
                    url: string;
                    kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
                } | undefined;
            }[];
            links: {
                label: string;
                url: string;
                kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
            }[];
            description?: string | undefined;
            eyebrow?: string | undefined;
            image?: {
                url: string;
                alt?: string | undefined;
            } | undefined;
        }[];
        emptyMessage?: string | undefined;
    };
    sync: {
        syncVersion: number;
        sourceView: "table" | "card" | "markdown";
        fingerprint: string;
        entryCount: number;
    };
};
export declare function createDefaultRecipeTabs(format?: RecipeContentFormat): RecipeNormalizedTabs;
export declare function getRecipeContentTab(input: Pick<Recipe, 'tabs'> | RecipeTab[]): RecipeContentTab;
export declare function getRecipeContentActiveView(input: Pick<Recipe, 'tabs'> | RecipeTab[]): "table" | "card" | "markdown";
export declare function getRecipeContentFormat(input: Pick<Recipe, 'tabs'> | RecipeTab[]): "table" | "card" | "markdown";
export declare function getRecipeContentEntries(input: Pick<Recipe, 'tabs'> | RecipeTab[] | RecipeContentTab): {
    id: string;
    md: string;
    row: Record<string, string | number | boolean | {
        kind: "link" | "text" | "email";
        text?: string | undefined;
        href?: string | undefined;
        imageUrl?: string | undefined;
        imageAlt?: string | undefined;
    } | null>;
    card: {
        id: string;
        title: string;
        badges: string[];
        metadata: {
            label: string;
            value: string;
            link?: {
                label: string;
                url: string;
                kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
            } | undefined;
        }[];
        links: {
            label: string;
            url: string;
            kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
        }[];
        description?: string | undefined;
        eyebrow?: string | undefined;
        image?: {
            url: string;
            alt?: string | undefined;
        } | undefined;
    };
    metadata: Record<string, unknown>;
    source?: {
        integration: string;
        kind: string;
        resourceId: string;
        metadata: Record<string, unknown>;
        label?: string | undefined;
    } | undefined;
}[];
export declare function replaceRecipeContentEntries(input: Pick<Recipe, 'tabs'> | RecipeTab[], entries: RecipeContentEntry[]): [{
    content: {
        activeView: "table" | "card" | "markdown";
        entries: {
            id: string;
            md: string;
            row: Record<string, string | number | boolean | {
                kind: "link" | "text" | "email";
                text?: string | undefined;
                href?: string | undefined;
                imageUrl?: string | undefined;
                imageAlt?: string | undefined;
            } | null>;
            card: {
                id: string;
                title: string;
                badges: string[];
                metadata: {
                    label: string;
                    value: string;
                    link?: {
                        label: string;
                        url: string;
                        kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
                    } | undefined;
                }[];
                links: {
                    label: string;
                    url: string;
                    kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
                }[];
                description?: string | undefined;
                eyebrow?: string | undefined;
                image?: {
                    url: string;
                    alt?: string | undefined;
                } | undefined;
            };
            metadata: Record<string, unknown>;
            source?: {
                integration: string;
                kind: string;
                resourceId: string;
                metadata: Record<string, unknown>;
                label?: string | undefined;
            } | undefined;
        }[];
        markdownRepresentation: {
            markdown: string;
        };
        tableRepresentation: {
            columns: {
                id: string;
                label: string;
                emphasis: "none" | "status" | "primary";
                presentation: "link" | "image" | "text" | "email";
            }[];
            rows: Record<string, string | number | boolean | {
                kind: "link" | "text" | "email";
                text?: string | undefined;
                href?: string | undefined;
                imageUrl?: string | undefined;
                imageAlt?: string | undefined;
            } | null>[];
            emptyMessage?: string | undefined;
        };
        cardRepresentation: {
            cards: {
                id: string;
                title: string;
                badges: string[];
                metadata: {
                    label: string;
                    value: string;
                    link?: {
                        label: string;
                        url: string;
                        kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
                    } | undefined;
                }[];
                links: {
                    label: string;
                    url: string;
                    kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
                }[];
                description?: string | undefined;
                eyebrow?: string | undefined;
                image?: {
                    url: string;
                    alt?: string | undefined;
                } | undefined;
            }[];
            emptyMessage?: string | undefined;
        };
        sync: {
            syncVersion: number;
            sourceView: "table" | "card" | "markdown";
            fingerprint: string;
            entryCount: number;
        };
    };
    id: "content";
    kind: "content";
    label: string;
    metadata: Record<string, unknown>;
}, ...{
    id: string;
    kind: string;
    label: string;
    data: Record<string, unknown>;
    metadata: Record<string, unknown>;
}[]];
export declare function removeRecipeContentEntries(input: Pick<Recipe, 'tabs'> | RecipeTab[], entryIds: string[]): ({
    id: "content";
    kind: "content";
    label: string;
    content: {
        activeView: "table" | "card" | "markdown";
        entries: {
            id: string;
            md: string;
            row: Record<string, string | number | boolean | {
                kind: "link" | "text" | "email";
                text?: string | undefined;
                href?: string | undefined;
                imageUrl?: string | undefined;
                imageAlt?: string | undefined;
            } | null>;
            card: {
                id: string;
                title: string;
                badges: string[];
                metadata: {
                    label: string;
                    value: string;
                    link?: {
                        label: string;
                        url: string;
                        kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
                    } | undefined;
                }[];
                links: {
                    label: string;
                    url: string;
                    kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
                }[];
                description?: string | undefined;
                eyebrow?: string | undefined;
                image?: {
                    url: string;
                    alt?: string | undefined;
                } | undefined;
            };
            metadata: Record<string, unknown>;
            source?: {
                integration: string;
                kind: string;
                resourceId: string;
                metadata: Record<string, unknown>;
                label?: string | undefined;
            } | undefined;
        }[];
        markdownRepresentation: {
            markdown: string;
        };
        tableRepresentation: {
            columns: {
                id: string;
                label: string;
                emphasis: "none" | "status" | "primary";
                presentation: "link" | "image" | "text" | "email";
            }[];
            rows: Record<string, string | number | boolean | {
                kind: "link" | "text" | "email";
                text?: string | undefined;
                href?: string | undefined;
                imageUrl?: string | undefined;
                imageAlt?: string | undefined;
            } | null>[];
            emptyMessage?: string | undefined;
        };
        cardRepresentation: {
            cards: {
                id: string;
                title: string;
                badges: string[];
                metadata: {
                    label: string;
                    value: string;
                    link?: {
                        label: string;
                        url: string;
                        kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
                    } | undefined;
                }[];
                links: {
                    label: string;
                    url: string;
                    kind: "map" | "website" | "place" | "booking" | "menu" | "email" | "other";
                }[];
                description?: string | undefined;
                eyebrow?: string | undefined;
                image?: {
                    url: string;
                    alt?: string | undefined;
                } | undefined;
            }[];
            emptyMessage?: string | undefined;
        };
        sync: {
            syncVersion: number;
            sourceView: "table" | "card" | "markdown";
            fingerprint: string;
            entryCount: number;
        };
    };
    metadata: Record<string, unknown>;
} | {
    id: string;
    kind: string;
    label: string;
    data: Record<string, unknown>;
    metadata: Record<string, unknown>;
})[];
export declare function getRecipeContentViewData<TFormat extends RecipeContentFormat | undefined>(input: Pick<Recipe, 'tabs'> | RecipeTab[] | RecipeContentTab, format?: TFormat): TFormat extends "table" ? RecipeTableData : TFormat extends "card" ? RecipeCardData : TFormat extends "markdown" ? RecipeMarkdownData : RecipeTableData | RecipeCardData | RecipeMarkdownData;
export declare function normalizeRecipeUiState(uiState: Partial<RecipeUiState> | null | undefined): {
    activeTab: string;
};
export declare function normalizeRecipeTabs(options: {
    tabs?: unknown;
    contentFormat?: RecipeContentFormat;
    contentData?: Record<string, unknown>;
    currentRecipe?: Pick<Recipe, 'tabs'> | null;
}): RecipeNormalizedTabs;
export declare function normalizeLegacyRecipeTabs(legacyViewType: string | null | undefined, legacyData: Record<string, unknown> | null | undefined): RecipeNormalizedTabs;
export {};
