import { RecipeActionSpecSchema, RecipeTemplateActionsSchema, RecipeTemplateAuthoringBoardCardSchema, RecipeTemplateAuthoringCardItemSchema, RecipeTemplateAuthoringChecklistItemSchema, RecipeTemplateAuthoringDetailSchema, RecipeTemplateAuthoringGroupSchema, RecipeTemplateAuthoringListItemSchema, RecipeTemplateAuthoringTableRowSchema, RecipeTemplateAuthoringTimelineItemSchema, RecipeTemplateFillSchema, RecipeTemplateHydrationSchema, RecipeTemplateSelectionSchema, RecipeTemplateStateSchema, RecipeTemplateTextSchema, RecipeTemplateUpdateSchema } from '@hermes-recipes/protocol';
import { getRecipeTemplateRuntimeDefinition, WORKRECIPE_TEMPLATE_RUNTIME_REGISTRY } from './recipe-template-registry';
import { extractRecoverableJsonObject } from './structured-json-recovery';
function createRepairSummary() {
    return {
        droppedKeys: [],
        aliasMappings: [],
        defaultedFields: [],
        normalizedValues: []
    };
}
function registerDroppedKey(summary, path) {
    summary.droppedKeys.push(path);
}
function registerAlias(summary, from, to) {
    summary.aliasMappings.push(`${from} -> ${to}`);
}
function registerDefault(summary, field) {
    summary.defaultedFields.push(field);
}
function registerNormalizedValue(summary, value) {
    summary.normalizedValues.push(value);
}
function extractJsonOnlyArtifact(responseText) {
    const extracted = extractRecoverableJsonObject(responseText, {
        requireObject: true
    });
    return {
        rawValue: extracted.rawValue,
        jsonText: extracted.jsonText,
        errors: extracted.errors,
        warnings: extracted.warnings,
        failureKind: extracted.failureKind,
        recovered: extracted.recovered,
        changedPayload: extracted.changedPayload,
        parserDiagnostics: extracted.diagnostics
    };
}
export function extractRecipeTemplateSelectionArtifact(responseText) {
    return extractJsonOnlyArtifact(responseText);
}
export function extractRecipeTemplateTextArtifact(responseText) {
    return extractJsonOnlyArtifact(responseText);
}
export function extractRecipeTemplateActionsArtifact(responseText) {
    return extractJsonOnlyArtifact(responseText);
}
export function extractRecipeTemplateFillArtifact(responseText) {
    return extractJsonOnlyArtifact(responseText);
}
export function extractRecipeTemplateHydrationArtifact(responseText) {
    return extractJsonOnlyArtifact(responseText);
}
export function extractRecipeTemplateUpdateArtifact(responseText) {
    return extractJsonOnlyArtifact(responseText);
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function toRecord(value) {
    return isRecord(value) ? value : {};
}
function asString(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
function asTone(value) {
    const tone = asString(value);
    return tone === 'neutral' || tone === 'accent' || tone === 'success' || tone === 'warning' || tone === 'danger'
        ? tone
        : undefined;
}
function asStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.map((item) => asString(item)).filter((item) => Boolean(item));
}
function humanizeTemplateFieldKey(value) {
    return value
        .replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
        .replace(/[._-]+/gu, ' ')
        .replace(/\s+/gu, ' ')
        .trim()
        .replace(/\b\w/gu, (character) => character.toUpperCase());
}
function preferString(record, keys, repairs, canonicalKey) {
    for (const key of keys) {
        const resolved = asString(record[key]);
        if (resolved) {
            if (key !== canonicalKey) {
                registerAlias(repairs, key, canonicalKey);
            }
            return resolved;
        }
    }
    return undefined;
}
function preferArray(record, keys, repairs, canonicalKey) {
    for (const key of keys) {
        const value = record[key];
        if (Array.isArray(value)) {
            if (key !== canonicalKey) {
                registerAlias(repairs, key, canonicalKey);
            }
            return value;
        }
        if (value !== undefined && value !== null) {
            if (key !== canonicalKey) {
                registerAlias(repairs, key, canonicalKey);
            }
            registerNormalizedValue(repairs, `${key} -> ${canonicalKey}[]`);
            return [value];
        }
    }
    return [];
}
function preferValue(record, keys, repairs, canonicalKey) {
    for (const key of keys) {
        const value = record[key];
        if (value !== undefined && value !== null) {
            if (key !== canonicalKey) {
                registerAlias(repairs, key, canonicalKey);
            }
            return value;
        }
    }
    return undefined;
}
function coerceConfidence(value, repairs) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.min(1, Math.max(0, value));
    }
    if (typeof value === 'string') {
        const trimmed = value.trim().toLowerCase();
        if (!trimmed) {
            return undefined;
        }
        const numeric = Number.parseFloat(trimmed);
        if (Number.isFinite(numeric)) {
            registerNormalizedValue(repairs, 'confidence:string -> confidence:number');
            return Math.min(1, Math.max(0, numeric));
        }
        if (trimmed === 'high') {
            registerNormalizedValue(repairs, 'confidence:high -> 0.9');
            return 0.9;
        }
        if (trimmed === 'medium') {
            registerNormalizedValue(repairs, 'confidence:medium -> 0.65');
            return 0.65;
        }
        if (trimmed === 'low') {
            registerNormalizedValue(repairs, 'confidence:low -> 0.35');
            return 0.35;
        }
    }
    return undefined;
}
function collectActionIdsFromSections(sections, sink = new Set()) {
    for (const section of sections) {
        const visitAction = (action) => {
            if (action.kind === 'existing_action') {
                sink.add(action.actionId);
            }
        };
        switch (section.kind) {
            case 'hero':
            case 'action-bar':
            case 'notes':
            case 'checklist':
                section.actions.forEach(visitAction);
                break;
            case 'comparison-table':
                section.rows.forEach((row) => row.actions.forEach(visitAction));
                break;
            case 'grouped-list':
                section.groups.forEach((group) => group.items.forEach((item) => item.actions.forEach(visitAction)));
                break;
            case 'card-grid':
                section.cards.forEach((card) => card.actions.forEach(visitAction));
                break;
            case 'detail-panel':
                section.actions.forEach(visitAction);
                break;
            case 'timeline':
                section.items.forEach((item) => item.actions.forEach(visitAction));
                break;
            case 'kanban':
                section.columns.forEach((column) => column.cards.forEach((card) => card.actions.forEach(visitAction)));
                break;
            case 'confirmation':
                visitAction(section.confirmAction);
                if (section.secondaryAction) {
                    visitAction(section.secondaryAction);
                }
                break;
            case 'split':
                collectActionIdsFromSections(section.left, sink);
                collectActionIdsFromSections(section.right, sink);
                break;
            case 'tabs':
                for (const pane of Object.values(section.panes)) {
                    collectActionIdsFromSections(pane, sink);
                }
                break;
            default:
                break;
        }
    }
    return sink;
}
export function findSectionBySlotId(sections, slotId) {
    for (const section of sections) {
        if (section.slotId === slotId) {
            return section;
        }
        if (section.kind === 'split') {
            const leftMatch = findSectionBySlotId(section.left, slotId);
            if (leftMatch) {
                return leftMatch;
            }
            const rightMatch = findSectionBySlotId(section.right, slotId);
            if (rightMatch) {
                return rightMatch;
            }
        }
        if (section.kind === 'tabs') {
            for (const pane of Object.values(section.panes)) {
                const match = findSectionBySlotId(pane, slotId);
                if (match) {
                    return match;
                }
            }
        }
    }
    return null;
}
export function mapSections(sections, mapper) {
    return sections.map((section) => {
        const mappedChildren = section.kind === 'split'
            ? {
                ...section,
                left: mapSections(section.left, mapper),
                right: mapSections(section.right, mapper)
            }
            : section.kind === 'tabs'
                ? {
                    ...section,
                    panes: Object.fromEntries(Object.entries(section.panes).map(([key, value]) => [key, mapSections(value, mapper)]))
                }
                : section;
        return mapper(mappedChildren);
    });
}
function appendNoteLines(sections, slotId, lines) {
    return mapSections(sections, (section) => section.slotId === slotId && section.kind === 'notes'
        ? {
            ...section,
            lines: [...section.lines, ...lines]
        }
        : section);
}
function setActiveTab(sections, slotId, tabId) {
    return mapSections(sections, (section) => section.slotId === slotId && section.kind === 'tabs'
        ? {
            ...section,
            activeTabId: tabId
        }
        : section);
}
function cloneState(state) {
    return RecipeTemplateStateSchema.parse(JSON.parse(JSON.stringify(state)));
}
function resolveAllowedActionIds(definition) {
    return new Set(Object.keys(definition.actions));
}
function validateActionRefs(sections, definition, errors) {
    const allowedActionIds = resolveAllowedActionIds(definition);
    for (const actionId of collectActionIdsFromSections(sections)) {
        if (!allowedActionIds.has(actionId)) {
            errors.push(`Action "${actionId}" is not allowed for template ${definition.id}.`);
        }
    }
}
function validateTemplateSections(definition, sections, errors) {
    const seenSlotIds = new Set();
    for (const slot of definition.slots) {
        const section = sections.find((item) => item.slotId === slot.id) ?? null;
        if (!section) {
            if (slot.required) {
                errors.push(`Missing required slot "${slot.id}" for template ${definition.id}.`);
            }
            continue;
        }
        seenSlotIds.add(slot.id);
        if (section.kind !== slot.kind) {
            errors.push(`Slot "${slot.id}" must use section kind "${slot.kind}", received "${section.kind}".`);
        }
    }
    for (const section of sections) {
        if (!definition.slots.some((slot) => slot.id === section.slotId)) {
            errors.push(`Section slot "${section.slotId}" is not defined for template ${definition.id}.`);
        }
    }
    validateActionRefs(sections, definition, errors);
}
function coerceChips(value, repairs, path) {
    const source = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
    if (!Array.isArray(value) && value !== undefined && value !== null) {
        registerNormalizedValue(repairs, `${path}:singular -> array`);
    }
    return source
        .map((item) => {
        if (typeof item === 'string' && item.trim().length > 0) {
            registerNormalizedValue(repairs, `${path}:string -> chip`);
            return {
                label: item.trim(),
                tone: 'neutral'
            };
        }
        const record = toRecord(item);
        const label = preferString(record, ['label', 'value', 'name', 'text'], repairs, 'label');
        if (!label) {
            return null;
        }
        const tone = asString(record.tone);
        return {
            label,
            tone: tone === 'accent' || tone === 'success' || tone === 'warning' || tone === 'danger' ? tone : 'neutral'
        };
    })
        .filter((item) => Boolean(item));
}
function coerceNoteLines(value, repairs, path) {
    if (typeof value === 'string' && value.trim().length > 0) {
        registerNormalizedValue(repairs, `${path}:string -> lines[]`);
        return value
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);
    }
    return asStringArray(Array.isArray(value) ? value : []);
}
function coerceLinks(value, repairs, path) {
    const source = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
    if (!Array.isArray(value) && value !== undefined && value !== null) {
        registerNormalizedValue(repairs, `${path}:singular -> array`);
    }
    return source
        .map((item) => {
        if (typeof item === 'string' && item.trim().length > 0) {
            registerNormalizedValue(repairs, `${path}:string -> link`);
            return {
                label: 'Open link',
                href: item.trim()
            };
        }
        const record = toRecord(item);
        const href = preferString(record, ['href', 'url', 'link'], repairs, 'href');
        if (!href) {
            return null;
        }
        return {
            label: preferString(record, ['label', 'title', 'text'], repairs, 'label') ?? href,
            href
        };
    })
        .filter((item) => Boolean(item));
}
function coerceStats(value, repairs, path) {
    const source = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
    if (!Array.isArray(value) && value !== undefined && value !== null) {
        registerNormalizedValue(repairs, `${path}:singular -> array`);
    }
    return source
        .map((item) => {
        const parsed = RecipeTemplateAuthoringDetailSchema.safeParse(item);
        if (parsed.success) {
            registerDroppedKey(repairs, `${path}:detail-object`);
        }
        const record = toRecord(item);
        const label = preferString(record, ['label', 'name', 'title'], repairs, 'label');
        const statValue = preferString(record, ['value', 'count', 'amount', 'text'], repairs, 'value');
        if (!label || !statValue) {
            return null;
        }
        return {
            label,
            value: statValue,
            helper: preferString(record, ['helper', 'detail', 'summary'], repairs, 'helper'),
            tone: asTone(record.tone)
        };
    })
        .filter((item) => item !== null);
}
function isDeterministicTableCellValue(value) {
    return (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        (isRecord(value) &&
            (typeof value.value === 'string' ||
                typeof value.text === 'string' ||
                typeof value.label === 'string' ||
                typeof value.subvalue === 'string' ||
                typeof value.detail === 'string')));
}
function isReservedObjectRowKey(key) {
    return new Set([
        'id',
        'itemId',
        'key',
        'label',
        'title',
        'name',
        'vendor',
        'merchant',
        'provider',
        'company',
        'actions',
        'links',
        'chips',
        'tags',
        'badges',
        'bullets',
        'notes',
        'note',
        'noteLines',
        'image',
        'imageUrl',
        'imageAlt',
        'subtitle',
        'summary',
        'meta'
    ]).has(key);
}
function buildObjectRowCellEntries(record) {
    return Object.entries(record).filter(([key, value]) => !isReservedObjectRowKey(key) && isDeterministicTableCellValue(value));
}
function coerceTableCellValue(value, repairs, _path) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return {
            value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
        };
    }
    const record = toRecord(value);
    const cellValue = preferString(record, ['value', 'text', 'label'], repairs, 'value');
    if (!cellValue) {
        return null;
    }
    return {
        value: cellValue,
        subvalue: preferString(record, ['subvalue', 'detail', 'helper'], repairs, 'subvalue'),
        tone: asTone(record.tone),
        emphasis: Boolean(record.emphasis)
    };
}
function coerceTableColumns(value, repairs, path) {
    const source = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
    if (!Array.isArray(value) && value !== undefined && value !== null) {
        registerNormalizedValue(repairs, `${path}:singular -> array`);
    }
    return source
        .map((item, index) => {
        const stringValue = asString(item);
        if (stringValue) {
            registerNormalizedValue(repairs, `${path}[${index}]:string -> column`);
            return {
                id: slugify(stringValue) || `column-${index + 1}`,
                label: stringValue,
                align: /(^| )(price|cost|amount|rate|score|total|monthly|annual|fee)( |$)/iu.test(stringValue) ? 'end' : 'start'
            };
        }
        const parsed = RecipeTemplateAuthoringTableRowSchema.safeParse(item);
        if (parsed.success) {
            registerDroppedKey(repairs, `${path}[${index}]:row-object`);
        }
        const record = toRecord(item);
        const id = preferString(record, ['id', 'key'], repairs, 'id') ?? `column-${index + 1}`;
        const label = preferString(record, ['label', 'title', 'name'], repairs, 'label') ?? id;
        const align = asString(record.align);
        return {
            id,
            label,
            align: align === 'start' || align === 'center' || align === 'end' ? align : 'start'
        };
    })
        .filter(Boolean);
}
function deriveTableColumnsFromRowObjects(value, repairs, path) {
    if (!Array.isArray(value)) {
        return [];
    }
    const keys = [];
    for (const item of value) {
        const record = toRecord(item);
        for (const [key] of buildObjectRowCellEntries(record)) {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }
    }
    if (keys.length === 0) {
        return [];
    }
    registerNormalizedValue(repairs, `${path}:derived columns from object rows`);
    return keys.map((key) => ({
        id: slugify(key) || key,
        label: humanizeTemplateFieldKey(key),
        align: /(^|_)(price|cost|amount|rate|score|total|monthly|annual|fee)(_|$)/iu.test(key) ? 'end' : 'start'
    }));
}
function coerceTableRows(value, repairs, path) {
    const source = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
    if (!Array.isArray(value) && value !== undefined && value !== null) {
        registerNormalizedValue(repairs, `${path}:singular -> array`);
    }
    return source
        .map((item, index) => {
        const parsed = RecipeTemplateAuthoringTableRowSchema.safeParse(item);
        if (parsed.success) {
            return parsed.data;
        }
        const record = toRecord(item);
        const id = preferString(record, ['id', 'itemId', 'key'], repairs, 'id') ?? `row-${index + 1}`;
        const label = preferString(record, ['label', 'title', 'name', 'vendor', 'merchant', 'provider', 'company'], repairs, 'label');
        const rawCells = Array.isArray(record.cells) ? record.cells : [];
        if (label && rawCells.length > 0) {
            return {
                id,
                label,
                cells: rawCells
                    .map((cell, cellIndex) => coerceTableCellValue(cell, repairs, `${path}[${index}].cells[${cellIndex}]`))
                    .filter((cell) => cell !== null)
            };
        }
        const objectCellEntries = buildObjectRowCellEntries(record);
        if (!label || objectCellEntries.length === 0) {
            return null;
        }
        registerNormalizedValue(repairs, `${path}[${index}]:object row -> canonical cells`);
        return {
            id,
            label,
            cells: objectCellEntries
                .map(([key, cellValue], cellIndex) => coerceTableCellValue(cellValue, repairs, `${path}[${index}].${key}[${cellIndex}]`))
                .filter((cell) => cell !== null)
        };
    })
        .filter((item) => Boolean(item));
}
function coerceListItems(value, repairs, path) {
    const source = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
    if (!Array.isArray(value) && value !== undefined && value !== null) {
        registerNormalizedValue(repairs, `${path}:singular -> array`);
    }
    return source
        .map((item, index) => {
        const parsedChecklistItem = RecipeTemplateAuthoringChecklistItemSchema.safeParse(item);
        if (parsedChecklistItem.success) {
            registerDroppedKey(repairs, `${path}[${index}]:checklist-object`);
        }
        const parsed = RecipeTemplateAuthoringGroupSchema.safeParse(item);
        if (parsed.success) {
            registerDroppedKey(repairs, `${path}[${index}]:group-object`);
        }
        const parsedListItem = RecipeTemplateAuthoringListItemSchema.safeParse(item);
        if (parsedListItem.success) {
            return parsedListItem.data;
        }
        const record = toRecord(item);
        const title = preferString(record, ['title', 'label', 'name'], repairs, 'title');
        if (!title) {
            return null;
        }
        return {
            id: preferString(record, ['id', 'itemId', 'key'], repairs, 'id'),
            title,
            subtitle: preferString(record, ['subtitle', 'summary'], repairs, 'subtitle'),
            meta: preferString(record, ['meta', 'detail', 'context'], repairs, 'meta'),
            chips: coerceChips(record.chips ?? record.tags ?? record.badges, repairs, `${path}[${index}].chips`),
            bullets: coerceNoteLines(record.bullets, repairs, `${path}[${index}].bullets`),
            links: coerceLinks(record.links ?? record.actions, repairs, `${path}[${index}].links`)
        };
    })
        .filter((item) => Boolean(item));
}
function coerceGroups(value, repairs, path) {
    const source = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
    if (!Array.isArray(value) && value !== undefined && value !== null) {
        registerNormalizedValue(repairs, `${path}:singular -> array`);
    }
    return source
        .map((item, index) => {
        const parsed = RecipeTemplateAuthoringGroupSchema.safeParse(item);
        if (parsed.success) {
            return parsed.data;
        }
        const record = toRecord(item);
        const label = preferString(record, ['label', 'title', 'name'], repairs, 'label');
        if (!label) {
            return null;
        }
        return {
            id: preferString(record, ['id', 'groupId', 'key'], repairs, 'id') ?? `group-${index + 1}`,
            label,
            tone: asTone(record.tone),
            items: coerceListItems(record.items ?? record.rows ?? record.cards, repairs, `${path}[${index}].items`)
        };
    })
        .filter((item) => Boolean(item));
}
function coerceCards(value, repairs, path) {
    const source = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
    if (!Array.isArray(value) && value !== undefined && value !== null) {
        registerNormalizedValue(repairs, `${path}:singular -> array`);
    }
    return source
        .map((item, index) => {
        const parsed = RecipeTemplateAuthoringCardItemSchema.safeParse(item);
        if (parsed.success) {
            return parsed.data;
        }
        const record = toRecord(item);
        const title = preferString(record, ['title', 'label', 'name'], repairs, 'title');
        if (!title) {
            return null;
        }
        return {
            id: preferString(record, ['id', 'itemId', 'key'], repairs, 'id'),
            title,
            subtitle: preferString(record, ['subtitle', 'summary'], repairs, 'subtitle'),
            meta: preferString(record, ['meta', 'detail'], repairs, 'meta'),
            imageLabel: preferString(record, ['imageLabel', 'image', 'mediaLabel'], repairs, 'imageLabel'),
            price: preferString(record, ['price', 'amount'], repairs, 'price'),
            chips: coerceChips(record.chips ?? record.tags ?? record.badges, repairs, `${path}[${index}].chips`),
            bullets: coerceNoteLines(record.bullets ?? record.highlights, repairs, `${path}[${index}].bullets`),
            footer: preferString(record, ['footer', 'note', 'context'], repairs, 'footer'),
            links: coerceLinks(record.links ?? record.actions, repairs, `${path}[${index}].links`)
        };
    })
        .filter((item) => Boolean(item));
}
function coerceDetail(value, repairs, path) {
    const parsed = RecipeTemplateAuthoringDetailSchema.safeParse(value);
    if (parsed.success) {
        return parsed.data;
    }
    const record = toRecord(value);
    const title = preferString(record, ['title', 'label', 'name'], repairs, 'title');
    if (!title) {
        return null;
    }
    return {
        id: preferString(record, ['id', 'itemId'], repairs, 'id'),
        title,
        eyebrow: preferString(record, ['eyebrow', 'kicker'], repairs, 'eyebrow'),
        summary: preferString(record, ['summary', 'description'], repairs, 'summary'),
        chips: coerceChips(record.chips ?? record.tags ?? record.badges, repairs, `${path}.chips`),
        fields: Array.isArray(record.fields) ? record.fields : [],
        note: preferString(record, ['note'], repairs, 'note'),
        noteTitle: preferString(record, ['noteTitle'], repairs, 'noteTitle')
    };
}
function coerceTimelineItems(value, repairs, path) {
    const source = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
    if (!Array.isArray(value) && value !== undefined && value !== null) {
        registerNormalizedValue(repairs, `${path}:singular -> array`);
    }
    return source
        .map((item, index) => {
        const parsed = RecipeTemplateAuthoringTimelineItemSchema.safeParse(item);
        if (parsed.success) {
            return parsed.data;
        }
        const record = toRecord(item);
        const title = preferString(record, ['title', 'label', 'name'], repairs, 'title');
        const time = preferString(record, ['time', 'date', 'when'], repairs, 'time');
        if (!title || !time) {
            return null;
        }
        return {
            id: preferString(record, ['id', 'itemId'], repairs, 'id'),
            title,
            time,
            summary: preferString(record, ['summary', 'subtitle'], repairs, 'summary'),
            chips: coerceChips(record.chips ?? record.tags, repairs, `${path}[${index}].chips`),
            links: coerceLinks(record.links ?? record.actions, repairs, `${path}[${index}].links`)
        };
    })
        .filter((item) => Boolean(item));
}
function coerceChecklistItems(value, repairs, path) {
    const source = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
    if (!Array.isArray(value) && value !== undefined && value !== null) {
        registerNormalizedValue(repairs, `${path}:singular -> array`);
    }
    return source
        .map((item, index) => {
        const record = toRecord(item);
        const title = preferString(record, ['title', 'label', 'name'], repairs, 'title');
        if (!title) {
            return null;
        }
        return {
            id: preferString(record, ['id', 'itemId'], repairs, 'id') ?? `checklist-${index + 1}`,
            title,
            subtitle: preferString(record, ['subtitle', 'summary'], repairs, 'subtitle'),
            meta: preferString(record, ['meta', 'detail'], repairs, 'meta'),
            checked: Boolean(record.checked ?? record.done ?? record.complete),
            tone: asTone(record.tone)
        };
    })
        .filter(Boolean);
}
function unwrapTemplateDataRecord(templateId, rawData, repairs, path) {
    const record = toRecord(rawData);
    if (isRecord(record.data)) {
        registerAlias(repairs, `${path}.data`, path);
        return {
            ...record,
            ...record.data
        };
    }
    if (Array.isArray(record.data)) {
        switch (templateId) {
            case 'price-comparison-grid':
            case 'vendor-evaluation-matrix':
                registerAlias(repairs, `${path}.data`, `${path}.rows`);
                return {
                    ...record,
                    rows: record.data
                };
            case 'shopping-shortlist':
            case 'hotel-shortlist':
            case 'job-search-pipeline':
                registerAlias(repairs, `${path}.data`, `${path}.cards`);
                return {
                    ...record,
                    cards: record.data
                };
            case 'step-by-step-instructions':
                registerAlias(repairs, `${path}.data`, `${path}.steps`);
                return {
                    ...record,
                    steps: record.data
                };
            default:
                break;
        }
    }
    return record;
}
function normalizeTemplateFillData(templateId, rawData, repairs) {
    const record = unwrapTemplateDataRecord(templateId, rawData, repairs, 'data');
    switch (templateId) {
        case 'price-comparison-grid':
            {
                // When the model wraps the table inside a freeform section like "matrix" or "comparison", unwrap it.
                const priceMatrixRecord = isRecord(record.matrix) ? record.matrix : isRecord(record.comparison) ? record.comparison : null;
                const rowsSource = preferValue(record, ['rows', 'comparisonRows', 'offers', 'items'], repairs, 'rows')
                    ?? (priceMatrixRecord ? preferValue(priceMatrixRecord, ['rows', 'comparisonRows', 'offers', 'data'], repairs, 'rows') : null);
                const priceDirectColumns = preferValue(record, ['columns', 'columnLabels'], repairs, 'columns');
                const priceNestedColumns = priceMatrixRecord ? preferValue(priceMatrixRecord, ['columns', 'columnLabels'], repairs, 'columns') : null;
                if (priceMatrixRecord && (!priceDirectColumns || !rowsSource)) {
                    registerAlias(repairs, 'data.matrix', 'data');
                }
                const columns = coerceTableColumns(priceDirectColumns ?? priceNestedColumns, repairs, 'data.columns');
                return {
                    eyebrow: preferString(record, ['eyebrow', 'kicker'], repairs, 'eyebrow'),
                    heroChips: coerceChips(preferValue(record, ['heroChips', 'badges', 'tags'], repairs, 'heroChips'), repairs, 'data.heroChips'),
                    scopeTags: coerceChips(preferValue(record, ['scopeTags', 'currentScope', 'scope'], repairs, 'scopeTags'), repairs, 'data.scopeTags'),
                    columns: columns.length > 0 ? columns : deriveTableColumnsFromRowObjects(rowsSource, repairs, 'data.columns'),
                    rows: coerceTableRows(rowsSource, repairs, 'data.rows'),
                    noteLines: coerceNoteLines(preferValue(record, ['noteLines', 'notes'], repairs, 'noteLines'), repairs, 'data.noteLines')
                };
            }
        case 'shopping-shortlist':
        case 'hotel-shortlist':
            return {
                eyebrow: preferString(record, ['eyebrow', 'kicker'], repairs, 'eyebrow'),
                heroChips: coerceChips(record.heroChips ?? record.badges ?? record.tags, repairs, 'data.heroChips'),
                stats: templateId === 'hotel-shortlist' ? coerceStats(record.stats, repairs, 'data.stats') : undefined,
                cards: coerceCards(record.cards ?? record.items ?? record.shortlist, repairs, 'data.cards'),
                noteLines: coerceNoteLines(record.noteLines ?? record.notes, repairs, 'data.noteLines')
            };
        case 'inbox-triage-board':
            return {
                eyebrow: preferString(record, ['eyebrow', 'kicker'], repairs, 'eyebrow'),
                heroChips: coerceChips(record.heroChips ?? record.badges ?? record.tags, repairs, 'data.heroChips'),
                stats: coerceStats(record.stats ?? record.metrics, repairs, 'data.stats'),
                groups: coerceGroups(record.groups ?? record.senderGroups, repairs, 'data.groups'),
                detail: coerceDetail(record.detail ?? record.selectedSender ?? record.preview, repairs, 'data.detail'),
                bulkActionTitle: preferString(record, ['bulkActionTitle', 'bulkActionsTitle'], repairs, 'bulkActionTitle')
            };
        case 'restaurant-finder':
        case 'local-discovery-comparison':
            return {
                eyebrow: preferString(record, ['eyebrow', 'kicker'], repairs, 'eyebrow'),
                heroChips: coerceChips(record.heroChips ?? record.badges, repairs, 'data.heroChips'),
                filters: coerceChips(record.filters ?? record.filterChips, repairs, 'data.filters'),
                sortLabel: preferString(record, ['sortLabel', 'sort'], repairs, 'sortLabel'),
                groups: coerceGroups(record.groups ?? record.results ?? record.places, repairs, 'data.groups'),
                detail: coerceDetail(record.detail ?? record.selectedPlace ?? record.selectedResult, repairs, 'data.detail'),
                noteLines: coerceNoteLines(record.noteLines ?? record.notes, repairs, 'data.noteLines')
            };
        case 'flight-comparison':
            return {
                eyebrow: preferString(record, ['eyebrow', 'kicker'], repairs, 'eyebrow'),
                heroChips: coerceChips(preferValue(record, ['heroChips', 'badges'], repairs, 'heroChips'), repairs, 'data.heroChips'),
                activeTabId: preferString(record, ['activeTabId', 'selectedLegId', 'tab'], repairs, 'activeTabId'),
                legs: (Array.isArray(record.legs) ? record.legs : []).map((item, index) => {
                    const legRecord = toRecord(item);
                    const legRowsSource = preferValue(legRecord, ['rows', 'options', 'comparisonRows'], repairs, `legs[${index}].rows`);
                    const legColumns = coerceTableColumns(preferValue(legRecord, ['columns', 'columnLabels'], repairs, `legs[${index}].columns`), repairs, `data.legs[${index}].columns`);
                    return {
                        id: preferString(legRecord, ['id', 'legId'], repairs, 'id') ?? `leg-${index + 1}`,
                        label: preferString(legRecord, ['label', 'title', 'name'], repairs, 'label') ?? `Leg ${index + 1}`,
                        badge: preferString(legRecord, ['badge'], repairs, 'badge'),
                        columns: legColumns.length > 0 ? legColumns : deriveTableColumnsFromRowObjects(legRowsSource, repairs, `data.legs[${index}].columns`),
                        rows: coerceTableRows(legRowsSource, repairs, `data.legs[${index}].rows`),
                        footnote: preferString(legRecord, ['footnote', 'note'], repairs, 'footnote')
                    };
                })
            };
        case 'travel-itinerary-planner':
            return {
                eyebrow: preferString(record, ['eyebrow', 'kicker'], repairs, 'eyebrow'),
                heroChips: coerceChips(preferValue(record, ['heroChips', 'badges'], repairs, 'heroChips'), repairs, 'data.heroChips'),
                activeTabId: preferString(record, ['activeTabId', 'tab'], repairs, 'activeTabId'),
                itineraryItems: coerceTimelineItems(preferValue(record, ['itineraryItems', 'itinerary'], repairs, 'itineraryItems'), repairs, 'data.itineraryItems'),
                bookingCards: coerceCards(preferValue(record, ['bookingCards', 'bookings'], repairs, 'bookingCards'), repairs, 'data.bookingCards'),
                packingItems: coerceChecklistItems(preferValue(record, ['packingItems', 'packing'], repairs, 'packingItems'), repairs, 'data.packingItems'),
                noteLines: coerceNoteLines(preferValue(record, ['noteLines', 'notes'], repairs, 'noteLines'), repairs, 'data.noteLines'),
                links: coerceLinks(record.links, repairs, 'data.links')
            };
        case 'research-notebook':
            return {
                eyebrow: preferString(record, ['eyebrow', 'kicker'], repairs, 'eyebrow'),
                heroChips: coerceChips(preferValue(record, ['heroChips', 'badges'], repairs, 'heroChips'), repairs, 'data.heroChips'),
                activeTabId: preferString(record, ['activeTabId', 'tab'], repairs, 'activeTabId'),
                sources: coerceGroups(record.sources, repairs, 'data.sources'),
                noteLines: coerceNoteLines(preferValue(record, ['noteLines', 'notes'], repairs, 'noteLines'), repairs, 'data.noteLines'),
                extractedPoints: coerceGroups(preferValue(record, ['extractedPoints', 'points'], repairs, 'extractedPoints'), repairs, 'data.extractedPoints'),
                followUps: coerceGroups(preferValue(record, ['followUps', 'followupQuestions', 'followups'], repairs, 'followUps'), repairs, 'data.followUps')
            };
        case 'security-review-board':
            return {
                eyebrow: preferString(record, ['eyebrow', 'kicker'], repairs, 'eyebrow'),
                heroChips: coerceChips(record.heroChips ?? record.badges, repairs, 'data.heroChips'),
                stats: coerceStats(record.stats, repairs, 'data.stats'),
                groups: coerceGroups(record.groups ?? record.findings, repairs, 'data.groups'),
                detail: coerceDetail(record.detail ?? record.selectedFinding, repairs, 'data.detail'),
                remediationTitle: preferString(record, ['remediationTitle'], repairs, 'remediationTitle'),
                remediationMarkdown: preferString(record, ['remediationMarkdown', 'proposedRemediation'], repairs, 'remediationMarkdown')
            };
        case 'vendor-evaluation-matrix':
            {
                // When the model wraps the table inside a freeform section like "matrix", unwrap it.
                const matrixRecord = isRecord(record.matrix) ? record.matrix : null;
                const rowsSource = preferValue(record, ['rows', 'comparisonRows', 'vendors', 'entries', 'data'], repairs, 'rows')
                    ?? (matrixRecord ? preferValue(matrixRecord, ['rows', 'comparisonRows', 'data'], repairs, 'rows') : null);
                const directColumns = preferValue(record, ['columns', 'columnLabels', 'criteria'], repairs, 'columns');
                const matrixColumns = matrixRecord ? preferValue(matrixRecord, ['columns', 'columnLabels', 'criteria'], repairs, 'columns') : null;
                if (matrixRecord && (!directColumns || !rowsSource)) {
                    registerAlias(repairs, 'data.matrix', 'data');
                }
                const columnsRaw = directColumns ?? matrixColumns;
                const columns = coerceTableColumns(columnsRaw, repairs, 'data.columns');
                const rows = coerceTableRows(rowsSource, repairs, 'data.rows');
                return {
                    eyebrow: preferString(record, ['eyebrow', 'kicker'], repairs, 'eyebrow'),
                    heroChips: coerceChips(preferValue(record, ['heroChips', 'badges'], repairs, 'heroChips'), repairs, 'data.heroChips'),
                    stats: coerceStats(record.stats, repairs, 'data.stats'),
                    columns: columns.length > 0 ? columns : deriveTableColumnsFromRowObjects(rowsSource, repairs, 'data.columns'),
                    rows,
                    footerChips: coerceChips(preferValue(record, ['footerChips', 'scopeTags'], repairs, 'footerChips'), repairs, 'data.footerChips'),
                    footnote: preferString(record, ['footnote', 'note'], repairs, 'footnote'),
                    noteLines: coerceNoteLines(preferValue(record, ['noteLines', 'notes'], repairs, 'noteLines'), repairs, 'data.noteLines')
                };
            }
        case 'job-search-pipeline':
            return {
                eyebrow: preferString(record, ['eyebrow', 'kicker'], repairs, 'eyebrow'),
                heroChips: coerceChips(record.heroChips ?? record.badges, repairs, 'data.heroChips'),
                stats: coerceStats(record.stats, repairs, 'data.stats'),
                cards: coerceCards(record.cards ?? record.jobs ?? record.listings, repairs, 'data.cards'),
                noteLines: coerceNoteLines(record.noteLines ?? record.notes, repairs, 'data.noteLines')
            };
        case 'event-planner':
            return {
                eyebrow: preferString(record, ['eyebrow', 'kicker'], repairs, 'eyebrow'),
                heroChips: coerceChips(record.heroChips ?? record.badges, repairs, 'data.heroChips'),
                activeTabId: preferString(record, ['activeTabId', 'tab'], repairs, 'activeTabId'),
                venueCards: coerceCards(record.venueCards ?? record.venues, repairs, 'data.venueCards'),
                guestGroups: coerceGroups(record.guestGroups ?? record.guests, repairs, 'data.guestGroups'),
                checklistItems: coerceChecklistItems(record.checklistItems ?? record.checklist, repairs, 'data.checklistItems'),
                itineraryItems: coerceTimelineItems(record.itineraryItems ?? record.itinerary, repairs, 'data.itineraryItems'),
                noteLines: coerceNoteLines(record.noteLines ?? record.notes, repairs, 'data.noteLines')
            };
        case 'step-by-step-instructions':
            {
                const rawSteps = preferValue(record, ['steps', 'instructions', 'items'], repairs, 'steps');
                const stepsArray = Array.isArray(rawSteps) ? rawSteps : [];
                return {
                    eyebrow: preferString(record, ['eyebrow', 'kicker'], repairs, 'eyebrow'),
                    heroChips: coerceChips(preferValue(record, ['heroChips', 'badges', 'tags'], repairs, 'heroChips'), repairs, 'data.heroChips'),
                    prerequisites: asStringArray(preferValue(record, ['prerequisites', 'prereqs', 'requirements'], repairs, 'prerequisites') ?? []),
                    steps: stepsArray.map((item, index) => {
                        const stepRecord = toRecord(item);
                        return {
                            id: preferString(stepRecord, ['id', 'key'], repairs, 'id') ?? `step-${index + 1}`,
                            label: preferString(stepRecord, ['label', 'title', 'name', 'text', 'instruction'], repairs, 'label') ?? `Step ${index + 1}`,
                            detail: preferString(stepRecord, ['detail', 'description', 'summary'], repairs, 'detail')
                        };
                    }),
                    noteLines: coerceNoteLines(preferValue(record, ['noteLines', 'notes'], repairs, 'noteLines'), repairs, 'data.noteLines')
                };
            }
        default:
            return record;
    }
}
export function normalizeRecipeTemplateSelection(rawValue) {
    const repairs = createRepairSummary();
    const record = toRecord(rawValue);
    const hintsRecord = toRecord(record.hints ?? record.contextHints);
    const hintedCurrentTemplateId = preferString(hintsRecord, ['currentTemplateId'], repairs, 'currentTemplateId');
    const inferredTemplateId = preferString(record, ['templateId', 'template_id', 'template'], repairs, 'templateId');
    const rawMode = preferString(record, ['mode', 'generationMode', 'operationMode'], repairs, 'mode');
    const inferredMode = rawMode === 'fill' || rawMode === 'update' || rawMode === 'switch'
        ? rawMode
        : inferredTemplateId && hintedCurrentTemplateId
            ? inferredTemplateId === hintedCurrentTemplateId
                ? 'update'
                : 'switch'
            : 'fill';
    const candidate = {
        kind: 'recipe_template_selection',
        schemaVersion: 'recipe_template_selection/v2',
        templateId: inferredTemplateId,
        mode: inferredMode,
        reason: preferString(record, ['reason', 'why', 'summary'], repairs, 'reason') ??
            (inferredTemplateId
                ? 'Selected the closest approved template.'
                : undefined),
        confidence: coerceConfidence(record.confidence ?? record.score, repairs),
        hints: isRecord(record.hints ?? record.contextHints)
            ? {
                primaryEntity: preferString(hintsRecord, ['primaryEntity', 'entity'], repairs, 'primaryEntity'),
                currentTemplateId: hintedCurrentTemplateId,
                suggestedTransitionFrom: preferString(hintsRecord, ['suggestedTransitionFrom', 'fromTemplateId'], repairs, 'suggestedTransitionFrom')
            }
            : undefined
    };
    if (!candidate.reason && candidate.templateId) {
        registerDefault(repairs, 'reason');
        candidate.reason = 'Selected the closest approved template.';
    }
    if (candidate.confidence === undefined) {
        registerDefault(repairs, 'confidence');
        candidate.confidence = 0.5;
    }
    const parsed = RecipeTemplateSelectionSchema.safeParse(candidate);
    return {
        selection: parsed.success ? parsed.data : null,
        errors: parsed.success ? [] : parsed.error.issues.map((issue) => issue.message),
        warnings: [],
        repairs
    };
}
export function normalizeRecipeTemplateFill(input) {
    const repairs = createRepairSummary();
    const record = toRecord(input.rawValue);
    const inferredTemplateId = preferString(record, ['templateId', 'template_id', 'template'], repairs, 'templateId') ?? input.templateId;
    const dataRecord = isRecord(record.data) ? record.data : toRecord(record);
    if (!isRecord(record.data)) {
        registerNormalizedValue(repairs, 'data:implicit wrapper');
    }
    const candidate = {
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2',
        templateId: inferredTemplateId,
        title: preferString(record, ['title', 'name'], repairs, 'title') ??
            `${input.templateId.replace(/-/gu, ' ').replace(/\b\w/gu, (character) => character.toUpperCase())}`,
        subtitle: preferString(record, ['subtitle', 'tagline'], repairs, 'subtitle'),
        summary: preferString(record, ['summary', 'description'], repairs, 'summary') ??
            (input.assistantSummary?.trim() || undefined),
        data: normalizeTemplateFillData(inferredTemplateId, dataRecord, repairs),
        metadata: {}
    };
    if (!preferString(record, ['summary', 'description'], repairs, 'summary') && input.assistantSummary?.trim()) {
        registerDefault(repairs, 'summary');
    }
    const parsed = RecipeTemplateFillSchema.safeParse(candidate);
    if (parsed.success && parsed.data.templateId !== input.templateId) {
        return {
            fill: null,
            errors: [`Template fill expected ${input.templateId}, but Hermes returned ${parsed.data.templateId}.`],
            warnings: [],
            repairs
        };
    }
    return {
        fill: parsed.success ? parsed.data : null,
        errors: parsed.success ? [] : parsed.error.issues.map((issue) => issue.message),
        warnings: [],
        repairs
    };
}
export function normalizeRecipeTemplateHydration(input) {
    const normalizedFill = normalizeRecipeTemplateFill(input);
    if (!normalizedFill.fill) {
        return {
            hydration: null,
            errors: normalizedFill.errors,
            warnings: normalizedFill.warnings,
            repairs: normalizedFill.repairs
        };
    }
    const parsed = RecipeTemplateHydrationSchema.safeParse({
        ...normalizedFill.fill,
        kind: 'recipe_template_hydration',
        schemaVersion: 'recipe_template_hydration/v1'
    });
    return {
        hydration: parsed.success ? parsed.data : null,
        errors: parsed.success ? [] : parsed.error.issues.map((issue) => issue.message),
        warnings: normalizedFill.warnings,
        repairs: normalizedFill.repairs
    };
}
function clearTableRowLinks(rows) {
    return rows.map((row) => ({
        ...row,
        links: []
    }));
}
function clearListItemLinks(items) {
    return items.map((item) => ({
        ...item,
        links: []
    }));
}
function clearGroupLinks(groups) {
    return groups.map((group) => ({
        ...group,
        items: clearListItemLinks(group.items)
    }));
}
function clearCardLinks(cards) {
    return cards.map((card) => ({
        ...card,
        links: []
    }));
}
function clearTimelineLinks(items) {
    return items.map((item) => ({
        ...item,
        links: []
    }));
}
function clearDetailLinks(detail) {
    return {
        ...detail,
        fields: detail.fields.map((field) => ({
            ...field,
            links: []
        }))
    };
}
function stripTemplateActionLinks(fill) {
    switch (fill.templateId) {
        case 'price-comparison-grid':
        case 'vendor-evaluation-matrix':
            return RecipeTemplateFillSchema.parse({
                ...fill,
                data: {
                    ...fill.data,
                    rows: clearTableRowLinks(fill.data.rows)
                }
            });
        case 'shopping-shortlist':
        case 'hotel-shortlist':
            return RecipeTemplateFillSchema.parse({
                ...fill,
                data: {
                    ...fill.data,
                    cards: clearCardLinks(fill.data.cards)
                }
            });
        case 'inbox-triage-board':
            return RecipeTemplateFillSchema.parse({
                ...fill,
                data: {
                    ...fill.data,
                    groups: clearGroupLinks(fill.data.groups),
                    detail: clearDetailLinks(fill.data.detail)
                }
            });
        case 'restaurant-finder':
        case 'local-discovery-comparison':
            return RecipeTemplateFillSchema.parse({
                ...fill,
                data: {
                    ...fill.data,
                    groups: clearGroupLinks(fill.data.groups),
                    detail: clearDetailLinks(fill.data.detail)
                }
            });
        case 'flight-comparison': {
            const flightFillData = fill.data;
            return RecipeTemplateFillSchema.parse({
                ...fill,
                data: {
                    ...fill.data,
                    legs: flightFillData.legs.map((leg) => ({
                        ...leg,
                        rows: clearTableRowLinks(leg.rows)
                    }))
                }
            });
        }
        case 'travel-itinerary-planner':
            return RecipeTemplateFillSchema.parse({
                ...fill,
                data: {
                    ...fill.data,
                    itineraryItems: clearTimelineLinks(fill.data.itineraryItems),
                    bookingCards: clearCardLinks(fill.data.bookingCards),
                    links: []
                }
            });
        case 'research-notebook':
            return RecipeTemplateFillSchema.parse({
                ...fill,
                data: {
                    ...fill.data,
                    sources: clearGroupLinks(fill.data.sources),
                    extractedPoints: clearGroupLinks(fill.data.extractedPoints),
                    followUps: clearGroupLinks(fill.data.followUps)
                }
            });
        case 'security-review-board':
            return RecipeTemplateFillSchema.parse({
                ...fill,
                data: {
                    ...fill.data,
                    groups: clearGroupLinks(fill.data.groups),
                    detail: clearDetailLinks(fill.data.detail)
                }
            });
        case 'job-search-pipeline':
            return RecipeTemplateFillSchema.parse({
                ...fill,
                data: {
                    ...fill.data,
                    cards: clearCardLinks(fill.data.cards)
                }
            });
        case 'event-planner':
            return RecipeTemplateFillSchema.parse({
                ...fill,
                data: {
                    ...fill.data,
                    venueCards: clearCardLinks(fill.data.venueCards),
                    guestGroups: clearGroupLinks(fill.data.guestGroups),
                    itineraryItems: clearTimelineLinks(fill.data.itineraryItems)
                }
            });
        default:
            return fill;
    }
}
export function createRecipeTemplateTextArtifact(fill) {
    const stripped = stripTemplateActionLinks(fill);
    return RecipeTemplateTextSchema.parse({
        ...stripped,
        kind: 'recipe_template_text',
        schemaVersion: 'recipe_template_text/v1'
    });
}
export function createRecipeTemplateHydrationArtifact(fill) {
    const stripped = stripTemplateActionLinks(fill);
    return RecipeTemplateHydrationSchema.parse({
        ...stripped,
        kind: 'recipe_template_hydration',
        schemaVersion: 'recipe_template_hydration/v1'
    });
}
export function createRecipeTemplateFillFromText(text) {
    return RecipeTemplateFillSchema.parse({
        ...text,
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2'
    });
}
export function createRecipeTemplateFillFromHydration(hydration) {
    return RecipeTemplateFillSchema.parse({
        ...hydration,
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2'
    });
}
function collectLinkedRows(rows) {
    return rows
        .filter((row) => row.links.length > 0)
        .map((row) => ({
        id: row.id,
        links: row.links
    }));
}
function collectLinkedCards(cards) {
    return cards
        .filter((card) => card.links.length > 0)
        .map((card) => ({
        id: card.id ?? card.title,
        links: card.links
    }));
}
function collectLinkedGroups(groups) {
    return groups
        .map((group) => ({
        id: group.id,
        items: group.items
            .filter((item) => item.links.length > 0)
            .map((item) => ({
            id: item.id ?? item.title,
            links: item.links
        }))
    }))
        .filter((group) => group.items.length > 0);
}
function collectLinkedTimelineItems(items) {
    return items
        .filter((item) => item.links.length > 0)
        .map((item) => ({
        id: item.id ?? item.title,
        links: item.links
    }));
}
function collectLinkedDetail(detail) {
    if (!detail) {
        return undefined;
    }
    const fields = detail.fields
        .filter((field) => field.links.length > 0)
        .map((field) => ({
        label: field.label,
        links: field.links
    }));
    if (fields.length === 0) {
        return undefined;
    }
    return {
        id: detail.id,
        fields
    };
}
export function createRecipeTemplateActionsArtifact(fill) {
    const templateId = fill.templateId;
    switch (fill.templateId) {
        case 'price-comparison-grid':
            return RecipeTemplateActionsSchema.parse({
                kind: 'recipe_template_actions',
                schemaVersion: 'recipe_template_actions/v1',
                templateId: fill.templateId,
                data: {
                    rows: collectLinkedRows(fill.data.rows)
                },
                metadata: {}
            });
        case 'shopping-shortlist':
        case 'hotel-shortlist':
            return RecipeTemplateActionsSchema.parse({
                kind: 'recipe_template_actions',
                schemaVersion: 'recipe_template_actions/v1',
                templateId: fill.templateId,
                data: {
                    cards: collectLinkedCards(fill.data.cards)
                },
                metadata: {}
            });
        case 'inbox-triage-board':
            return RecipeTemplateActionsSchema.parse({
                kind: 'recipe_template_actions',
                schemaVersion: 'recipe_template_actions/v1',
                templateId: fill.templateId,
                data: {
                    groups: collectLinkedGroups(fill.data.groups),
                    detail: collectLinkedDetail(fill.data.detail)
                },
                metadata: {}
            });
        case 'restaurant-finder':
        case 'local-discovery-comparison':
            return RecipeTemplateActionsSchema.parse({
                kind: 'recipe_template_actions',
                schemaVersion: 'recipe_template_actions/v1',
                templateId: fill.templateId,
                data: {
                    groups: collectLinkedGroups(fill.data.groups),
                    detail: collectLinkedDetail(fill.data.detail)
                },
                metadata: {}
            });
        case 'flight-comparison': {
            const flightActionsData = fill.data;
            return RecipeTemplateActionsSchema.parse({
                kind: 'recipe_template_actions',
                schemaVersion: 'recipe_template_actions/v1',
                templateId: fill.templateId,
                data: {
                    legs: flightActionsData.legs
                        .map((leg) => ({
                        id: leg.id,
                        rows: collectLinkedRows(leg.rows)
                    }))
                        .filter((leg) => leg.rows.length > 0)
                },
                metadata: {}
            });
        }
        case 'travel-itinerary-planner':
            return RecipeTemplateActionsSchema.parse({
                kind: 'recipe_template_actions',
                schemaVersion: 'recipe_template_actions/v1',
                templateId: fill.templateId,
                data: {
                    itineraryItems: collectLinkedTimelineItems(fill.data.itineraryItems),
                    bookingCards: collectLinkedCards(fill.data.bookingCards),
                    links: fill.data.links
                },
                metadata: {}
            });
        case 'research-notebook':
            return RecipeTemplateActionsSchema.parse({
                kind: 'recipe_template_actions',
                schemaVersion: 'recipe_template_actions/v1',
                templateId: fill.templateId,
                data: {
                    sources: collectLinkedGroups(fill.data.sources),
                    extractedPoints: collectLinkedGroups(fill.data.extractedPoints),
                    followUps: collectLinkedGroups(fill.data.followUps)
                },
                metadata: {}
            });
        case 'security-review-board':
            return RecipeTemplateActionsSchema.parse({
                kind: 'recipe_template_actions',
                schemaVersion: 'recipe_template_actions/v1',
                templateId: fill.templateId,
                data: {
                    groups: collectLinkedGroups(fill.data.groups),
                    detail: collectLinkedDetail(fill.data.detail)
                },
                metadata: {}
            });
        case 'vendor-evaluation-matrix':
            return RecipeTemplateActionsSchema.parse({
                kind: 'recipe_template_actions',
                schemaVersion: 'recipe_template_actions/v1',
                templateId: fill.templateId,
                data: {
                    rows: collectLinkedRows(fill.data.rows)
                },
                metadata: {}
            });
        case 'job-search-pipeline':
            return RecipeTemplateActionsSchema.parse({
                kind: 'recipe_template_actions',
                schemaVersion: 'recipe_template_actions/v1',
                templateId: fill.templateId,
                data: {
                    cards: collectLinkedCards(fill.data.cards)
                },
                metadata: {}
            });
        case 'event-planner':
            return RecipeTemplateActionsSchema.parse({
                kind: 'recipe_template_actions',
                schemaVersion: 'recipe_template_actions/v1',
                templateId: fill.templateId,
                data: {
                    venueCards: collectLinkedCards(fill.data.venueCards),
                    guestGroups: collectLinkedGroups(fill.data.guestGroups),
                    itineraryItems: collectLinkedTimelineItems(fill.data.itineraryItems)
                },
                metadata: {}
            });
        default:
            return RecipeTemplateActionsSchema.parse({
                kind: 'recipe_template_actions',
                schemaVersion: 'recipe_template_actions/v1',
                templateId,
                data: {},
                metadata: {}
            });
    }
}
function mergeRowLinks(rows, overlays = []) {
    const overlayMap = new Map(overlays.map((overlay) => [overlay.id, overlay.links]));
    return rows.map((row) => ({
        ...row,
        links: overlayMap.get(row.id) ?? row.links
    }));
}
function mergeCardLinks(cards, overlays = []) {
    const overlayMap = new Map(overlays.map((overlay) => [overlay.id, overlay.links]));
    return cards.map((card) => ({
        ...card,
        links: overlayMap.get(card.id ?? card.title) ?? card.links
    }));
}
function mergeGroupLinks(groups, overlays = []) {
    const groupMap = new Map(overlays.map((overlay) => [overlay.id, overlay]));
    return groups.map((group) => {
        const groupOverlay = groupMap.get(group.id);
        if (!groupOverlay) {
            return group;
        }
        const itemMap = new Map((groupOverlay.items ?? []).map((item) => [item.id, item.links]));
        return {
            ...group,
            items: group.items.map((item) => ({
                ...item,
                links: itemMap.get(item.id ?? item.title) ?? item.links
            }))
        };
    });
}
function mergeTimelineLinks(items, overlays = []) {
    const overlayMap = new Map(overlays.map((overlay) => [overlay.id, overlay.links]));
    return items.map((item) => ({
        ...item,
        links: overlayMap.get(item.id ?? item.title) ?? item.links
    }));
}
function mergeDetailLinks(detail, overlay) {
    if (!overlay) {
        return detail;
    }
    const fieldMap = new Map((overlay.fields ?? []).map((field) => [field.label, field.links]));
    return {
        ...detail,
        fields: detail.fields.map((field) => ({
            ...field,
            links: fieldMap.get(field.label) ?? field.links
        }))
    };
}
export function assembleRecipeTemplateFill(input) {
    const baseFill = createRecipeTemplateFillFromText(input.text);
    const actions = input.actions;
    if (!actions) {
        return baseFill;
    }
    switch (baseFill.templateId) {
        case 'price-comparison-grid':
            return RecipeTemplateFillSchema.parse({
                ...baseFill,
                data: {
                    ...baseFill.data,
                    rows: mergeRowLinks(baseFill.data.rows, actions.data.rows)
                }
            });
        case 'shopping-shortlist':
        case 'hotel-shortlist':
            return RecipeTemplateFillSchema.parse({
                ...baseFill,
                data: {
                    ...baseFill.data,
                    cards: mergeCardLinks(baseFill.data.cards, actions.data.cards)
                }
            });
        case 'inbox-triage-board':
            return RecipeTemplateFillSchema.parse({
                ...baseFill,
                data: {
                    ...baseFill.data,
                    groups: mergeGroupLinks(baseFill.data.groups, actions.data.groups),
                    detail: mergeDetailLinks(baseFill.data.detail, actions.data.detail)
                }
            });
        case 'restaurant-finder':
        case 'local-discovery-comparison':
            return RecipeTemplateFillSchema.parse({
                ...baseFill,
                data: {
                    ...baseFill.data,
                    groups: mergeGroupLinks(baseFill.data.groups, actions.data.groups),
                    detail: mergeDetailLinks(baseFill.data.detail, actions.data.detail)
                }
            });
        case 'flight-comparison': {
            const flightBaseData = baseFill.data;
            const flightActionData = actions.data;
            return RecipeTemplateFillSchema.parse({
                ...baseFill,
                data: {
                    ...baseFill.data,
                    legs: flightBaseData.legs.map((leg) => {
                        const legOverlay = flightActionData.legs.find((entry) => entry.id === leg.id);
                        return {
                            ...leg,
                            rows: mergeRowLinks(leg.rows, legOverlay?.rows ?? [])
                        };
                    })
                }
            });
        }
        case 'travel-itinerary-planner':
            return RecipeTemplateFillSchema.parse({
                ...baseFill,
                data: {
                    ...baseFill.data,
                    itineraryItems: mergeTimelineLinks(baseFill.data.itineraryItems, actions.data.itineraryItems),
                    bookingCards: mergeCardLinks(baseFill.data.bookingCards, actions.data.bookingCards),
                    links: actions.data.links
                }
            });
        case 'research-notebook':
            return RecipeTemplateFillSchema.parse({
                ...baseFill,
                data: {
                    ...baseFill.data,
                    sources: mergeGroupLinks(baseFill.data.sources, actions.data.sources),
                    extractedPoints: mergeGroupLinks(baseFill.data.extractedPoints, actions.data.extractedPoints),
                    followUps: mergeGroupLinks(baseFill.data.followUps, actions.data.followUps)
                }
            });
        case 'security-review-board':
            return RecipeTemplateFillSchema.parse({
                ...baseFill,
                data: {
                    ...baseFill.data,
                    groups: mergeGroupLinks(baseFill.data.groups, actions.data.groups),
                    detail: mergeDetailLinks(baseFill.data.detail, actions.data.detail)
                }
            });
        case 'vendor-evaluation-matrix':
            return RecipeTemplateFillSchema.parse({
                ...baseFill,
                data: {
                    ...baseFill.data,
                    rows: mergeRowLinks(baseFill.data.rows, actions.data.rows)
                }
            });
        case 'job-search-pipeline':
            return RecipeTemplateFillSchema.parse({
                ...baseFill,
                data: {
                    ...baseFill.data,
                    cards: mergeCardLinks(baseFill.data.cards, actions.data.cards)
                }
            });
        case 'event-planner':
            return RecipeTemplateFillSchema.parse({
                ...baseFill,
                data: {
                    ...baseFill.data,
                    venueCards: mergeCardLinks(baseFill.data.venueCards, actions.data.venueCards),
                    guestGroups: mergeGroupLinks(baseFill.data.guestGroups, actions.data.guestGroups),
                    itineraryItems: mergeTimelineLinks(baseFill.data.itineraryItems, actions.data.itineraryItems)
                }
            });
        default:
            return baseFill;
    }
}
export function normalizeRecipeTemplateText(input) {
    const normalizedFill = normalizeRecipeTemplateFill(input);
    return {
        text: normalizedFill.fill ? createRecipeTemplateTextArtifact(normalizedFill.fill) : null,
        errors: normalizedFill.errors,
        warnings: normalizedFill.warnings,
        repairs: normalizedFill.repairs
    };
}
export function normalizeRecipeTemplateActions(input) {
    if (input.text.templateId !== input.templateId) {
        return {
            actions: null,
            errors: [`Template actions expected ${input.templateId}, but the staged text artifact is ${input.text.templateId}.`],
            warnings: [],
            repairs: createRepairSummary()
        };
    }
    const repairs = createRepairSummary();
    const record = toRecord(input.rawValue);
    const inferredTemplateId = preferString(record, ['templateId', 'template_id', 'template'], repairs, 'templateId') ?? input.templateId;
    const candidate = {
        kind: 'recipe_template_actions',
        schemaVersion: 'recipe_template_actions/v1',
        templateId: inferredTemplateId,
        data: isRecord(record.data) ? record.data : toRecord(record),
        metadata: {}
    };
    const parsed = RecipeTemplateActionsSchema.safeParse(candidate);
    if (parsed.success) {
        if (parsed.data.templateId !== input.templateId) {
            return {
                actions: null,
                errors: [`Template actions expected ${input.templateId}, but Hermes returned ${parsed.data.templateId}.`],
                warnings: [],
                repairs
            };
        }
        return {
            actions: parsed.data,
            errors: [],
            warnings: [],
            repairs
        };
    }
    const normalizedFill = normalizeRecipeTemplateFill({
        templateId: input.templateId,
        rawValue: input.rawValue,
        assistantSummary: input.assistantSummary ?? null
    });
    if (normalizedFill.fill) {
        return {
            actions: createRecipeTemplateActionsArtifact(normalizedFill.fill),
            errors: [],
            warnings: [],
            repairs: {
                droppedKeys: [...repairs.droppedKeys, ...normalizedFill.repairs.droppedKeys],
                aliasMappings: [...repairs.aliasMappings, ...normalizedFill.repairs.aliasMappings],
                defaultedFields: [...repairs.defaultedFields, ...normalizedFill.repairs.defaultedFields],
                normalizedValues: [...repairs.normalizedValues, ...normalizedFill.repairs.normalizedValues, 'derived actions overlay from fill-like response']
            }
        };
    }
    return {
        actions: null,
        errors: parsed.error.issues.map((issue) => issue.message),
        warnings: [],
        repairs
    };
}
function defaultSlotIdForTemplateOperation(templateId, op) {
    switch (op) {
        case 'set_active_tab':
            switch (templateId) {
                case 'flight-comparison':
                    return 'flight-tabs';
                case 'travel-itinerary-planner':
                    return 'trip-tabs';
                case 'research-notebook':
                    return 'research-tabs';
                case 'event-planner':
                    return 'event-tabs';
                default:
                    return 'tabs';
            }
        case 'append_note_lines':
            switch (templateId) {
                case 'price-comparison-grid':
                    return 'operator-note';
                default:
                    return 'notes';
            }
        case 'set_filter_chips':
            return 'filters';
        case 'set_scope_tags':
            return templateId === 'vendor-evaluation-matrix' ? 'matrix' : 'offer-grid';
        case 'upsert_table_rows':
            switch (templateId) {
                case 'vendor-evaluation-matrix':
                    return 'matrix';
                case 'price-comparison-grid':
                    return 'offer-grid';
                case 'flight-comparison':
                    return 'flight-outbound';
                default:
                    return 'offer-grid';
            }
        case 'upsert_cards':
            switch (templateId) {
                case 'shopping-shortlist':
                    return 'shortlist';
                case 'hotel-shortlist':
                    return 'hotels';
                case 'job-search-pipeline':
                    return 'listings';
                case 'travel-itinerary-planner':
                    return 'bookings';
                case 'event-planner':
                    return 'venues';
                default:
                    return 'cards';
            }
        case 'upsert_groups':
            switch (templateId) {
                case 'inbox-triage-board':
                    return 'triage-groups';
                case 'restaurant-finder':
                case 'local-discovery-comparison':
                    return 'result-list';
                case 'research-notebook':
                    return 'sources';
                case 'security-review-board':
                    return 'findings-list';
                case 'event-planner':
                    return 'guests';
                default:
                    return 'groups';
            }
        case 'upsert_timeline_items':
            switch (templateId) {
                case 'travel-itinerary-planner':
                    return 'itinerary';
                case 'event-planner':
                    return 'itinerary';
                default:
                    return 'timeline';
            }
        case 'set_detail':
            switch (templateId) {
                case 'inbox-triage-board':
                    return 'triage-detail';
                case 'restaurant-finder':
                case 'local-discovery-comparison':
                    return 'result-detail';
                case 'security-review-board':
                    return 'selected-finding';
                default:
                    return 'detail';
            }
        case 'upsert_board_cards':
        case 'move_board_card':
            return 'pipeline-board';
        case 'remove_items':
            switch (templateId) {
                case 'price-comparison-grid':
                    return 'offer-grid';
                case 'shopping-shortlist':
                    return 'shortlist';
                case 'hotel-shortlist':
                    return 'hotels';
                case 'job-search-pipeline':
                    return 'listings';
                case 'travel-itinerary-planner':
                    return 'bookings';
                case 'event-planner':
                    return 'venues';
                default:
                    return 'items';
            }
        case 'set_status':
        case 'set_header':
        default:
            return null;
    }
}
function normalizeUpdateOperation(templateId, rawOperation, repairs) {
    const record = toRecord(rawOperation);
    const rawOp = preferString(record, ['op', 'type', 'kind'], repairs, 'op');
    if (!rawOp) {
        return null;
    }
    const op = rawOp === 'set_title' || rawOp === 'set_summary' ? 'set_header'
        : rawOp === 'append_notes' ? 'append_note_lines'
            : rawOp === 'set_tab' || rawOp === 'activate_tab' ? 'set_active_tab'
                : rawOp === 'update_cards' ? 'upsert_cards'
                    : rawOp === 'update_rows' ? 'upsert_table_rows'
                        : rawOp === 'update_groups' ? 'upsert_groups'
                            : rawOp === 'update_detail' ? 'set_detail'
                                : rawOp === 'update_timeline' ? 'upsert_timeline_items'
                                    : rawOp === 'update_board_cards' ? 'upsert_board_cards'
                                        : rawOp;
    if (op !== rawOp) {
        registerAlias(repairs, rawOp, op);
    }
    switch (op) {
        case 'set_header':
            return {
                op,
                title: preferString(record, ['title'], repairs, 'title'),
                subtitle: preferString(record, ['subtitle'], repairs, 'subtitle'),
                summary: preferString(record, ['summary', 'description'], repairs, 'summary')
            };
        case 'set_active_tab':
            return {
                op,
                slotId: preferString(record, ['slotId', 'slot'], repairs, 'slotId') ?? defaultSlotIdForTemplateOperation(templateId, op) ?? 'tabs',
                tabId: preferString(record, ['tabId', 'tab', 'activeTabId'], repairs, 'tabId') ?? ''
            };
        case 'append_note_lines':
            return {
                op,
                slotId: preferString(record, ['slotId', 'slot'], repairs, 'slotId') ?? defaultSlotIdForTemplateOperation(templateId, op) ?? 'notes',
                lines: coerceNoteLines(record.lines ?? record.noteLines ?? record.notes, repairs, 'operations.lines')
            };
        case 'set_filter_chips':
            return {
                op,
                slotId: preferString(record, ['slotId', 'slot'], repairs, 'slotId') ?? defaultSlotIdForTemplateOperation(templateId, op) ?? 'filters',
                filters: coerceChips(record.filters ?? record.filterChips, repairs, 'operations.filters'),
                sortLabel: preferString(record, ['sortLabel', 'sort'], repairs, 'sortLabel')
            };
        case 'set_scope_tags':
            return {
                op,
                slotId: preferString(record, ['slotId', 'slot'], repairs, 'slotId') ?? defaultSlotIdForTemplateOperation(templateId, op) ?? 'offer-grid',
                chips: coerceChips(record.chips ?? record.scopeTags, repairs, 'operations.chips')
            };
        case 'upsert_table_rows':
            return {
                op,
                slotId: preferString(record, ['slotId', 'slot'], repairs, 'slotId') ?? defaultSlotIdForTemplateOperation(templateId, op) ?? 'offer-grid',
                rows: coerceTableRows(record.rows ?? record.items, repairs, 'operations.rows')
            };
        case 'upsert_cards':
            return {
                op,
                slotId: preferString(record, ['slotId', 'slot'], repairs, 'slotId') ?? defaultSlotIdForTemplateOperation(templateId, op) ?? 'cards',
                cards: coerceCards(record.cards ?? record.items, repairs, 'operations.cards')
            };
        case 'upsert_groups':
            return {
                op,
                slotId: preferString(record, ['slotId', 'slot'], repairs, 'slotId') ?? defaultSlotIdForTemplateOperation(templateId, op) ?? 'groups',
                groups: coerceGroups(record.groups ?? record.items, repairs, 'operations.groups')
            };
        case 'upsert_timeline_items':
            return {
                op,
                slotId: preferString(record, ['slotId', 'slot'], repairs, 'slotId') ?? defaultSlotIdForTemplateOperation(templateId, op) ?? 'timeline',
                items: coerceTimelineItems(record.items ?? record.timelineItems, repairs, 'operations.items')
            };
        case 'set_detail':
            return {
                op,
                slotId: preferString(record, ['slotId', 'slot'], repairs, 'slotId') ?? defaultSlotIdForTemplateOperation(templateId, op) ?? 'detail',
                detail: coerceDetail(record.detail ?? record.value, repairs, 'operations.detail') ?? {
                    title: 'Updated detail',
                    chips: [],
                    fields: []
                }
            };
        case 'upsert_board_cards':
            return {
                op,
                slotId: preferString(record, ['slotId', 'slot'], repairs, 'slotId') ?? defaultSlotIdForTemplateOperation(templateId, op) ?? 'pipeline-board',
                columnId: preferString(record, ['columnId', 'stageId'], repairs, 'columnId') ?? '',
                cards: (Array.isArray(record.cards) ? record.cards : []).map((card) => {
                    const parsed = RecipeTemplateAuthoringBoardCardSchema.safeParse(card);
                    return parsed.success ? parsed.data : null;
                }).filter((card) => Boolean(card))
            };
        case 'move_board_card':
            return {
                op,
                slotId: preferString(record, ['slotId', 'slot'], repairs, 'slotId') ?? defaultSlotIdForTemplateOperation(templateId, op) ?? 'pipeline-board',
                cardId: preferString(record, ['cardId', 'itemId'], repairs, 'cardId') ?? '',
                targetColumnId: preferString(record, ['targetColumnId', 'toColumnId', 'stageId'], repairs, 'targetColumnId') ?? '',
                position: typeof record.position === 'number' ? record.position : undefined
            };
        case 'remove_items':
            return {
                op,
                slotId: preferString(record, ['slotId', 'slot'], repairs, 'slotId') ?? defaultSlotIdForTemplateOperation(templateId, op) ?? 'items',
                itemIds: asStringArray(record.itemIds ?? record.ids)
            };
        case 'set_status':
            return {
                op,
                statusLabel: preferString(record, ['statusLabel', 'status', 'label'], repairs, 'statusLabel') ?? ''
            };
        default:
            return null;
    }
}
export function normalizeRecipeTemplateUpdate(input) {
    const repairs = createRepairSummary();
    const record = toRecord(input.rawValue);
    const operationsSource = preferArray(record, ['operations', 'updates', 'patches'], repairs, 'operations');
    const operations = operationsSource
        .map((operation) => normalizeUpdateOperation(input.templateId, operation, repairs))
        .filter((operation) => Boolean(operation));
    const candidate = {
        kind: 'recipe_template_update',
        schemaVersion: 'recipe_template_update/v2',
        templateId: preferString(record, ['templateId', 'template_id', 'template'], repairs, 'templateId') ?? input.templateId,
        operations,
        metadata: {}
    };
    const parsed = RecipeTemplateUpdateSchema.safeParse(candidate);
    return {
        update: parsed.success ? parsed.data : null,
        errors: parsed.success
            ? operations.length > 0
                ? []
                : ['Template updates must include at least one allowed operation.']
            : parsed.error.issues.map((issue) => issue.message),
        warnings: [],
        repairs
    };
}
function compactArray(items) {
    return items.filter((item) => Boolean(item));
}
function templateTitleFromId(templateId) {
    return templateId
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
function slugify(value) {
    const slug = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/giu, '-')
        .replace(/^-+|-+$/gu, '');
    return slug.length > 0 ? slug : 'item';
}
function stableId(explicitId, fallback, prefix, index) {
    return explicitId ?? `${prefix}-${slugify(fallback)}-${index + 1}`;
}
function createExistingActionRef(definition, actionId, selectedItemIds = []) {
    if (!definition.actions[actionId]) {
        return null;
    }
    return {
        kind: 'existing_action',
        actionId,
        selectedItemIds
    };
}
function createActionRefs(definition, actionIds, options = {}) {
    return compactArray([
        ...actionIds.map((actionId) => createExistingActionRef(definition, actionId, options.selectedItemIds ?? [])),
        ...(options.links ?? []).map((link) => ({
            kind: 'link',
            label: link.label,
            href: link.href,
            openInNewTab: true
        }))
    ]);
}
function normalizeDetailValue(detail, fallbackTitle, fallbackSummary) {
    return (detail ?? {
        id: `${slugify(fallbackTitle)}-detail`,
        title: fallbackTitle,
        summary: fallbackSummary,
        chips: [],
        fields: [],
        note: undefined,
        noteTitle: undefined
    });
}
function createStatsSection(slotId, title, items) {
    return {
        slotId,
        kind: 'stats',
        title,
        items
    };
}
function createNotesSection(definition, slotId, title, lines, actionIds = []) {
    return {
        slotId,
        kind: 'notes',
        title,
        lines,
        actions: createActionRefs(definition, actionIds)
    };
}
function createActionBarSection(definition, slotId, title, actionIds) {
    return {
        slotId,
        kind: 'action-bar',
        title,
        actions: createActionRefs(definition, actionIds)
    };
}
function createFilterStripSection(slotId, title, filters, sortLabel) {
    return {
        slotId,
        kind: 'filter-strip',
        title,
        filters,
        sortLabel
    };
}
function toListItems(definition, items, actionIds, prefix) {
    return items.map((item, index) => {
        const itemId = stableId(item.id, item.title, prefix, index);
        return {
            id: itemId,
            title: item.title,
            subtitle: item.subtitle,
            meta: item.meta ?? (item.bullets.length > 0 ? item.bullets.join(' • ') : undefined),
            chips: item.chips,
            actions: createActionRefs(definition, actionIds, {
                selectedItemIds: [itemId],
                links: item.links
            })
        };
    });
}
function toGroups(definition, groups, actionIds, prefix) {
    return groups.map((group, groupIndex) => ({
        id: stableId(group.id, group.label, `${prefix}-group`, groupIndex),
        label: group.label,
        tone: group.tone,
        items: toListItems(definition, group.items, actionIds, `${prefix}-${groupIndex + 1}`)
    }));
}
function toCardItems(definition, cards, actionIds, prefix) {
    return cards.map((card, index) => {
        const itemId = stableId(card.id, card.title, prefix, index);
        return {
            id: itemId,
            title: card.title,
            subtitle: card.subtitle,
            meta: card.meta,
            imageLabel: card.imageLabel,
            price: card.price,
            chips: card.chips,
            bullets: card.bullets,
            footer: card.footer,
            actions: createActionRefs(definition, actionIds, {
                selectedItemIds: [itemId],
                links: card.links
            })
        };
    });
}
function toTableRows(definition, rows) {
    return rows.map((row) => ({
        id: row.id,
        label: row.label,
        cells: row.cells,
        actions: createActionRefs(definition, [], {
            selectedItemIds: [row.id],
            links: row.links
        })
    }));
}
function toTimelineItems(definition, items, actionIds, prefix) {
    return items.map((item, index) => {
        const itemId = stableId(item.id, item.title, prefix, index);
        return {
            id: itemId,
            title: item.title,
            time: item.time,
            summary: item.summary,
            chips: item.chips,
            actions: createActionRefs(definition, actionIds, {
                selectedItemIds: [itemId],
                links: item.links
            })
        };
    });
}
function toBoardColumns(definition, columns, actionIds, prefix) {
    return columns.map((column, columnIndex) => ({
        id: stableId(column.id, column.label, `${prefix}-column`, columnIndex),
        label: column.label,
        tone: column.tone,
        cards: column.cards.map((card, cardIndex) => {
            const itemId = stableId(card.id, card.title, `${prefix}-card`, cardIndex);
            return {
                id: itemId,
                title: card.title,
                subtitle: card.subtitle,
                chips: card.chips,
                footer: card.footer,
                actions: createActionRefs(definition, actionIds, {
                    selectedItemIds: [itemId],
                    links: card.links
                })
            };
        })
    }));
}
function toChecklistGroups(definition, items, actionIds) {
    const openItems = items
        .filter((item) => !item.checked)
        .map((item, index) => ({
        id: stableId(item.id, item.title, 'checklist-open', index),
        title: item.title,
        subtitle: item.subtitle,
        meta: item.meta,
        chips: compactArray([
            item.tone ? { label: item.tone, tone: item.tone } : null,
            { label: 'Open', tone: 'warning' }
        ]),
        actions: createActionRefs(definition, actionIds, {
            selectedItemIds: [stableId(item.id, item.title, 'checklist-open', index)]
        })
    }));
    const doneItems = items
        .filter((item) => item.checked)
        .map((item, index) => ({
        id: stableId(item.id, item.title, 'checklist-done', index),
        title: item.title,
        subtitle: item.subtitle,
        meta: item.meta,
        chips: compactArray([
            item.tone ? { label: item.tone, tone: item.tone } : null,
            { label: 'Done', tone: 'success' }
        ]),
        actions: createActionRefs(definition, actionIds, {
            selectedItemIds: [stableId(item.id, item.title, 'checklist-done', index)]
        })
    }));
    return compactArray([
        {
            id: 'checklist-open',
            label: 'Open',
            items: openItems
        },
        doneItems.length > 0
            ? {
                id: 'checklist-done',
                label: 'Done',
                items: doneItems
            }
            : null
    ]);
}
function createDetailPanelSection(definition, slotId, title, detail, actionIds = []) {
    const detailId = detail.id ?? slugify(detail.title);
    return {
        slotId,
        kind: 'detail-panel',
        title,
        eyebrow: detail.eyebrow,
        summary: detail.summary,
        chips: detail.chips,
        fields: detail.fields,
        actions: createActionRefs(definition, actionIds, {
            selectedItemIds: [detailId]
        }),
        note: detail.note,
        noteTitle: detail.noteTitle
    };
}
function mergeById(existing, incoming, getId) {
    const seen = new Map(existing.map((item) => [getId(item), item]));
    for (const item of incoming) {
        seen.set(getId(item), item);
    }
    const merged = [];
    const incomingIds = new Set(incoming.map((item) => getId(item)));
    for (const item of existing) {
        const id = getId(item);
        merged.push(seen.get(id) ?? item);
    }
    for (const item of incoming) {
        const id = getId(item);
        if (!existing.some((entry) => getId(entry) === id) && incomingIds.has(id)) {
            merged.push(item);
        }
    }
    return merged;
}
function ensureActiveTabId(requested, tabs) {
    if (requested && tabs.some((tab) => tab.id === requested)) {
        return requested;
    }
    return tabs[0]?.id ?? 'overview';
}
function countGroupItems(groups) {
    return groups.reduce((total, group) => total + group.items.length, 0);
}
function semanticCompletenessFailure(fill, primaryContentCounts, requiredSignals, humanLabel) {
    const countsSummary = Object.entries(primaryContentCounts)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
    return {
        ok: false,
        templateId: fill.templateId,
        primaryContentCounts,
        requiredSignals,
        issues: [
            `Semantic completeness failed: ${humanLabel} stayed empty. Expected at least one populated primary content area across ${requiredSignals.join(', ')}. Counts: ${countsSummary}.`
        ],
        summary: `${humanLabel} stayed empty.`
    };
}
export function validateRecipeTemplateSemanticCompleteness(fill) {
    const templateId = fill.templateId;
    switch (templateId) {
        case 'price-comparison-grid': {
            const primaryContentCounts = {
                rows: fill.data.rows.length
            };
            return primaryContentCounts.rows > 0
                ? {
                    ok: true,
                    templateId: fill.templateId,
                    primaryContentCounts,
                    requiredSignals: ['rows'],
                    issues: [],
                    summary: 'Comparison rows populated.'
                }
                : semanticCompletenessFailure(fill, primaryContentCounts, ['rows'], 'Price comparison grid');
        }
        case 'shopping-shortlist':
        case 'hotel-shortlist': {
            const primaryContentCounts = {
                cards: fill.data.cards.length
            };
            return primaryContentCounts.cards > 0
                ? {
                    ok: true,
                    templateId: fill.templateId,
                    primaryContentCounts,
                    requiredSignals: ['cards'],
                    issues: [],
                    summary: 'Card shortlist populated.'
                }
                : semanticCompletenessFailure(fill, primaryContentCounts, ['cards'], 'Shortlist');
        }
        case 'inbox-triage-board': {
            const primaryContentCounts = {
                groups: fill.data.groups.length,
                items: countGroupItems(fill.data.groups)
            };
            return primaryContentCounts.items > 0
                ? {
                    ok: true,
                    templateId: fill.templateId,
                    primaryContentCounts,
                    requiredSignals: ['groups', 'items'],
                    issues: [],
                    summary: 'Inbox sender groups populated.'
                }
                : semanticCompletenessFailure(fill, primaryContentCounts, ['groups', 'items'], 'Inbox triage board');
        }
        case 'restaurant-finder':
        case 'local-discovery-comparison': {
            const primaryContentCounts = {
                groups: fill.data.groups.length,
                items: countGroupItems(fill.data.groups)
            };
            return primaryContentCounts.items > 0
                ? {
                    ok: true,
                    templateId: fill.templateId,
                    primaryContentCounts,
                    requiredSignals: ['groups', 'items'],
                    issues: [],
                    summary: 'List-detail results populated.'
                }
                : semanticCompletenessFailure(fill, primaryContentCounts, ['groups', 'items'], 'List-detail results');
        }
        case 'flight-comparison': {
            const totalRows = fill.data.legs.reduce((total, leg) => total + leg.rows.length, 0);
            const primaryContentCounts = {
                legs: fill.data.legs.length,
                rows: totalRows
            };
            return totalRows > 0
                ? {
                    ok: true,
                    templateId: fill.templateId,
                    primaryContentCounts,
                    requiredSignals: ['rows'],
                    issues: [],
                    summary: 'Flight options populated.'
                }
                : semanticCompletenessFailure(fill, primaryContentCounts, ['rows'], 'Flight comparison');
        }
        case 'travel-itinerary-planner': {
            const primaryContentCounts = {
                itineraryItems: fill.data.itineraryItems.length,
                bookingCards: fill.data.bookingCards.length,
                packingItems: fill.data.packingItems.length
            };
            return primaryContentCounts.itineraryItems + primaryContentCounts.bookingCards + primaryContentCounts.packingItems > 0
                ? {
                    ok: true,
                    templateId: fill.templateId,
                    primaryContentCounts,
                    requiredSignals: ['itineraryItems', 'bookingCards', 'packingItems'],
                    issues: [],
                    summary: 'Travel planner content populated.'
                }
                : semanticCompletenessFailure(fill, primaryContentCounts, ['itineraryItems', 'bookingCards', 'packingItems'], 'Travel itinerary planner');
        }
        case 'research-notebook': {
            const primaryContentCounts = {
                sources: countGroupItems(fill.data.sources),
                noteLines: fill.data.noteLines.length,
                extractedPoints: countGroupItems(fill.data.extractedPoints),
                followUps: countGroupItems(fill.data.followUps)
            };
            return primaryContentCounts.sources + primaryContentCounts.noteLines + primaryContentCounts.extractedPoints + primaryContentCounts.followUps >
                0
                ? {
                    ok: true,
                    templateId: fill.templateId,
                    primaryContentCounts,
                    requiredSignals: ['sources', 'noteLines', 'extractedPoints', 'followUps'],
                    issues: [],
                    summary: 'Research notebook populated.'
                }
                : semanticCompletenessFailure(fill, primaryContentCounts, ['sources', 'noteLines', 'extractedPoints', 'followUps'], 'Research notebook');
        }
        case 'security-review-board': {
            const primaryContentCounts = {
                groups: fill.data.groups.length,
                findings: countGroupItems(fill.data.groups)
            };
            return primaryContentCounts.findings > 0
                ? {
                    ok: true,
                    templateId: fill.templateId,
                    primaryContentCounts,
                    requiredSignals: ['findings'],
                    issues: [],
                    summary: 'Security findings populated.'
                }
                : semanticCompletenessFailure(fill, primaryContentCounts, ['findings'], 'Security review board');
        }
        case 'vendor-evaluation-matrix': {
            const primaryContentCounts = {
                rows: fill.data.rows.length
            };
            return primaryContentCounts.rows > 0
                ? {
                    ok: true,
                    templateId: fill.templateId,
                    primaryContentCounts,
                    requiredSignals: ['rows'],
                    issues: [],
                    summary: 'Evaluation matrix populated.'
                }
                : semanticCompletenessFailure(fill, primaryContentCounts, ['rows'], 'Vendor evaluation matrix');
        }
        case 'job-search-pipeline': {
            const primaryContentCounts = {
                cards: fill.data.cards.length
            };
            return primaryContentCounts.cards > 0
                ? {
                    ok: true,
                    templateId: fill.templateId,
                    primaryContentCounts,
                    requiredSignals: ['cards'],
                    issues: [],
                    summary: 'Job listing cards populated.'
                }
                : semanticCompletenessFailure(fill, primaryContentCounts, ['cards'], 'Job listings');
        }
        case 'event-planner': {
            const primaryContentCounts = {
                venueCards: fill.data.venueCards.length,
                guestGroups: countGroupItems(fill.data.guestGroups),
                checklistItems: fill.data.checklistItems.length,
                itineraryItems: fill.data.itineraryItems.length
            };
            return primaryContentCounts.venueCards +
                primaryContentCounts.guestGroups +
                primaryContentCounts.checklistItems +
                primaryContentCounts.itineraryItems >
                0
                ? {
                    ok: true,
                    templateId: fill.templateId,
                    primaryContentCounts,
                    requiredSignals: ['venueCards', 'guestGroups', 'checklistItems', 'itineraryItems'],
                    issues: [],
                    summary: 'Event planner populated.'
                }
                : semanticCompletenessFailure(fill, primaryContentCounts, ['venueCards', 'guestGroups', 'checklistItems', 'itineraryItems'], 'Event planner');
        }
        case 'step-by-step-instructions': {
            const primaryContentCounts = {
                steps: fill.data.steps.length
            };
            return primaryContentCounts.steps > 0
                ? {
                    ok: true,
                    templateId: fill.templateId,
                    primaryContentCounts,
                    requiredSignals: ['steps'],
                    issues: [],
                    summary: 'Step-by-step instructions populated.'
                }
                : semanticCompletenessFailure(fill, primaryContentCounts, ['steps'], 'Step-by-step instructions');
        }
        default:
            return {
                ok: true,
                templateId,
                primaryContentCounts: {},
                requiredSignals: [],
                issues: [],
                summary: 'No semantic completeness rule matched.'
            };
    }
}
function compileTemplateSections(fill, definition) {
    switch (fill.templateId) {
        case 'price-comparison-grid': {
            const data = fill.data;
            return [
                {
                    slotId: 'offer-grid',
                    kind: 'comparison-table',
                    title: 'Offer grid',
                    columns: data.columns,
                    rows: toTableRows(definition, data.rows),
                    footerChips: data.scopeTags,
                    footnote: undefined
                }
            ];
        }
        case 'shopping-shortlist': {
            const data = fill.data;
            return [
                {
                    slotId: 'shortlist',
                    kind: 'card-grid',
                    title: 'Shortlist',
                    columns: 1,
                    cards: toCardItems(definition, data.cards, [], 'shortlist-card')
                }
            ];
        }
        case 'inbox-triage-board': {
            const data = fill.data;
            return [
                createStatsSection('stats', 'Queue health', data.stats),
                {
                    slotId: 'triage-board',
                    kind: 'split',
                    ratio: 'list-detail',
                    left: [
                        {
                            slotId: 'triage-groups',
                            kind: 'grouped-list',
                            title: 'Sender groups',
                            groups: toGroups(definition, data.groups, [], 'triage')
                        }
                    ],
                    right: [
                        createDetailPanelSection(definition, 'triage-detail', 'Sender detail', normalizeDetailValue(data.detail, 'Selected sender', 'Select a sender group to review the next cleanup step.'))
                    ]
                }
            ];
        }
        case 'restaurant-finder':
        case 'local-discovery-comparison': {
            const data = fill.data;
            const detailActionIds = fill.templateId === 'local-discovery-comparison' ? ['save-place', 'switch-to-event-planner'] : [];
            const groupActionIds = fill.templateId === 'local-discovery-comparison' ? ['save-place', 'switch-to-event-planner'] : [];
            return [
                createFilterStripSection('filters', 'Filters', data.filters, data.sortLabel),
                {
                    slotId: 'results',
                    kind: 'split',
                    ratio: 'list-detail',
                    left: [
                        {
                            slotId: 'result-list',
                            kind: 'grouped-list',
                            title: fill.templateId === 'restaurant-finder' ? 'Restaurants' : 'Places',
                            groups: toGroups(definition, data.groups, groupActionIds, 'results')
                        }
                    ],
                    right: [
                        createDetailPanelSection(definition, 'result-detail', fill.templateId === 'restaurant-finder' ? 'Selected restaurant' : 'Selected place', normalizeDetailValue(data.detail, fill.templateId === 'restaurant-finder' ? 'Selected restaurant' : 'Selected place', fill.templateId === 'restaurant-finder'
                            ? 'Select a result to review hours, links, and fit.'
                            : 'Select a result to review website, contact details, and fit.'), detailActionIds)
                    ]
                }
            ];
        }
        case 'hotel-shortlist': {
            const data = fill.data;
            return compactArray([
                data.stats.length > 0 ? createStatsSection('stats', 'At a glance', data.stats) : null,
                {
                    slotId: 'hotels',
                    kind: 'card-grid',
                    title: 'Hotel shortlist',
                    columns: 1,
                    cards: toCardItems(definition, data.cards, [], 'hotel-card')
                }
            ]);
        }
        case 'flight-comparison': {
            const data = fill.data;
            const flightLegs = data.legs;
            const tabs = flightLegs.map((leg, index) => ({
                id: leg.id || `flight-${index + 1}`,
                label: leg.label,
                badge: leg.badge
            }));
            const panes = Object.fromEntries(flightLegs.map((leg, index) => [
                leg.id || `flight-${index + 1}`,
                [
                    {
                        slotId: leg.id || `flight-${index + 1}`,
                        kind: 'comparison-table',
                        title: leg.label,
                        columns: leg.columns.map((column) => ({
                            ...column,
                            align: column.align ?? 'start'
                        })),
                        rows: toTableRows(definition, leg.rows),
                        footerChips: leg.badge ? [{ label: leg.badge, tone: 'accent' }] : [],
                        footnote: leg.footnote
                    }
                ]
            ]));
            return [
                {
                    slotId: 'flight-tabs',
                    kind: 'tabs',
                    title: 'Flight comparison',
                    tabs,
                    activeTabId: ensureActiveTabId(data.activeTabId, tabs),
                    panes
                }
            ];
        }
        case 'travel-itinerary-planner': {
            const data = fill.data;
            const tabs = [
                { id: 'itinerary', label: 'Itinerary' },
                { id: 'bookings', label: 'Bookings' },
                { id: 'packing', label: 'Packing' },
                { id: 'links', label: 'Links' }
            ];
            return [
                {
                    slotId: 'trip-tabs',
                    kind: 'tabs',
                    title: 'Trip planner',
                    tabs,
                    activeTabId: ensureActiveTabId(data.activeTabId, tabs),
                    panes: {
                        itinerary: [
                            {
                                slotId: 'itinerary',
                                kind: 'timeline',
                                title: 'Itinerary',
                                items: toTimelineItems(definition, data.itineraryItems, [], 'trip-itinerary')
                            }
                        ],
                        bookings: [
                            {
                                slotId: 'bookings',
                                kind: 'card-grid',
                                title: 'Bookings',
                                columns: 1,
                                cards: toCardItems(definition, data.bookingCards, [], 'booking-card')
                            }
                        ],
                        packing: [
                            {
                                slotId: 'packing',
                                kind: 'grouped-list',
                                title: 'Packing list',
                                groups: toChecklistGroups(definition, data.packingItems, [])
                            }
                        ],
                        links: [
                            {
                                slotId: 'links',
                                kind: 'grouped-list',
                                title: 'Saved links',
                                groups: [
                                    {
                                        id: 'trip-links',
                                        label: 'Links',
                                        items: data.links.map((link, index) => ({
                                            id: `trip-link-${index + 1}`,
                                            title: link.label,
                                            meta: link.href,
                                            chips: [],
                                            actions: createActionRefs(definition, [], { links: [link] })
                                        }))
                                    }
                                ]
                            }
                        ]
                    }
                }
            ];
        }
        case 'research-notebook': {
            const data = fill.data;
            const tabs = [
                { id: 'sources', label: 'Sources' },
                { id: 'points', label: 'Extracted points' },
                { id: 'follow-ups', label: 'Follow-ups' }
            ];
            return [
                {
                    slotId: 'research-tabs',
                    kind: 'tabs',
                    title: 'Research notebook',
                    tabs,
                    activeTabId: ensureActiveTabId(data.activeTabId, tabs),
                    panes: {
                        sources: [
                            {
                                slotId: 'sources',
                                kind: 'grouped-list',
                                title: 'Sources',
                                groups: toGroups(definition, data.sources, [], 'research-sources')
                            }
                        ],
                        points: [
                            {
                                slotId: 'extracted-points',
                                kind: 'grouped-list',
                                title: 'Extracted points',
                                groups: toGroups(definition, data.extractedPoints, [], 'research-points')
                            }
                        ],
                        'follow-ups': [
                            {
                                slotId: 'follow-ups',
                                kind: 'grouped-list',
                                title: 'Follow-up prompts',
                                groups: toGroups(definition, data.followUps, ['run-followup'], 'research-followups')
                            }
                        ]
                    }
                }
            ];
        }
        case 'security-review-board': {
            const data = fill.data;
            return compactArray([
                data.stats.length > 0 ? createStatsSection('stats', 'Findings by severity', data.stats) : null,
                {
                    slotId: 'findings',
                    kind: 'split',
                    ratio: 'list-detail',
                    left: [
                        {
                            slotId: 'findings-list',
                            kind: 'grouped-list',
                            title: 'Findings by severity',
                            groups: toGroups(definition, data.groups, [], 'security-findings')
                        }
                    ],
                    right: compactArray([
                        createDetailPanelSection(definition, 'selected-finding', 'Selected finding', normalizeDetailValue(data.detail, 'Selected finding', 'Review evidence, status, and recommended next steps.')),
                        data.remediationMarkdown
                            ? createNotesSection(definition, 'remediation', data.remediationTitle ?? 'Proposed remediation', data.remediationMarkdown.split('\n').map((line) => line.trim()).filter(Boolean))
                            : null
                    ])
                }
            ]);
        }
        case 'vendor-evaluation-matrix': {
            const data = fill.data;
            return compactArray([
                data.stats.length > 0 ? createStatsSection('stats', 'Evaluation summary', data.stats) : null,
                {
                    slotId: 'matrix',
                    kind: 'comparison-table',
                    title: 'Vendor matrix',
                    columns: data.columns,
                    rows: toTableRows(definition, data.rows),
                    footerChips: data.footerChips,
                    footnote: data.footnote
                }
            ]);
        }
        case 'job-search-pipeline': {
            const data = fill.data;
            return compactArray([
                data.stats.length > 0 ? createStatsSection('stats', 'At a glance', data.stats) : null,
                {
                    slotId: 'listings',
                    kind: 'card-grid',
                    title: 'Job listings',
                    columns: 2,
                    cards: toCardItems(definition, data.cards, [], 'job-card')
                }
            ]);
        }
        case 'event-planner': {
            const data = fill.data;
            const tabs = [
                { id: 'venues', label: 'Venues' },
                { id: 'guests', label: 'Guests' },
                { id: 'checklist', label: 'Checklist' },
                { id: 'itinerary', label: 'Itinerary' }
            ];
            return [
                {
                    slotId: 'event-tabs',
                    kind: 'tabs',
                    title: 'Event planner',
                    tabs,
                    activeTabId: ensureActiveTabId(data.activeTabId, tabs),
                    panes: {
                        venues: [
                            {
                                slotId: 'venues',
                                kind: 'card-grid',
                                title: 'Venue shortlist',
                                columns: 1,
                                cards: toCardItems(definition, data.venueCards, ['select-event-venue'], 'event-venue')
                            }
                        ],
                        guests: [
                            createActionBarSection(definition, 'guest-actions', 'Guest actions', ['add-event-guest']),
                            {
                                slotId: 'guests',
                                kind: 'grouped-list',
                                title: 'Guest list',
                                groups: toGroups(definition, data.guestGroups, [], 'event-guests')
                            }
                        ],
                        checklist: [
                            {
                                slotId: 'checklist',
                                kind: 'grouped-list',
                                title: 'Checklist',
                                groups: toChecklistGroups(definition, data.checklistItems, ['toggle-template-checklist'])
                            }
                        ],
                        itinerary: [
                            {
                                slotId: 'itinerary',
                                kind: 'timeline',
                                title: 'Itinerary',
                                items: toTimelineItems(definition, data.itineraryItems, [], 'event-itinerary')
                            }
                        ]
                    }
                }
            ];
        }
        case 'step-by-step-instructions': {
            const data = fill.data;
            return compactArray([
                {
                    slotId: 'checklist',
                    kind: 'checklist',
                    title: 'Instructions',
                    prerequisites: data.prerequisites,
                    steps: data.steps.map((step) => ({
                        id: step.id,
                        label: step.label,
                        detail: step.detail,
                        checked: false
                    })),
                    actions: createActionRefs(definition, [])
                }
            ]);
        }
        default: {
            return [];
        }
    }
}
function getTemplateFillGuide(templateId) {
    switch (templateId) {
        case 'price-comparison-grid':
            return {
                allowedDataKeys: ['scopeTags', 'columns', 'rows', 'noteLines'],
                requiredDataKeys: ['columns'],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'Monitor comparison',
                    summary: 'Compare the same monitor across merchants.',
                    data: {
                        columns: [
                            { id: 'merchant', label: 'Merchant' },
                            { id: 'price', label: 'Price', align: 'end' }
                        ],
                        rows: [{ id: 'offer-1', label: 'Dell 27', cells: [{ value: 'Dell' }, { value: '$299' }] }]
                    }
                },
                invalidExamples: [
                    {
                        example: {
                            kind: 'recipe_template_fill',
                            schemaVersion: 'recipe_template_fill/v2',
                            templateId,
                            title: 'Invalid comparison',
                            summary: 'Wrong because it wraps data twice and renames canonical keys.',
                            data: {
                                data: {
                                    columnLabels: ['Merchant', 'Price'],
                                    comparisonRows: [{ merchant: 'Dell', price: '$299' }]
                                }
                            }
                        },
                        whyInvalid: 'Use data.columns and data.rows directly. Do not nest data.data or rename canonical table keys.'
                    }
                ],
                commonMistakes: ['Do not use data.data, columnLabels, or comparisonRows. Use columns and rows only.']
            };
        case 'vendor-evaluation-matrix':
            return {
                allowedDataKeys: ['stats', 'columns', 'rows', 'footerChips', 'footnote', 'noteLines'],
                requiredDataKeys: ['rows'],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'CRM evaluation matrix',
                    summary: 'Compare approved vendors against canonical criteria.',
                    data: {
                        columns: [
                            { id: 'pricing', label: 'Pricing' },
                            { id: 'automation', label: 'Automation' },
                            { id: 'fit', label: 'Team fit' }
                        ],
                        rows: [
                            {
                                id: 'hubspot',
                                label: 'HubSpot',
                                cells: [{ value: '$45/user' }, { value: 'Strong' }, { value: 'High' }]
                            }
                        ],
                        footerChips: [{ label: '10 seats', tone: 'accent' }]
                    }
                },
                invalidExamples: [
                    {
                        example: {
                            kind: 'recipe_template_fill',
                            schemaVersion: 'recipe_template_fill/v2',
                            templateId,
                            title: 'Invalid vendor matrix',
                            summary: 'Wrong because it uses near-miss wrappers and aliases.',
                            data: {
                                data: {
                                    overviewTitle: 'Overview',
                                    columnLabels: ['Pricing', 'Automation'],
                                    comparisonRows: [{ vendor: 'HubSpot', pricing: '$45/user', automation: 'Strong' }]
                                }
                            }
                        },
                        whyInvalid: 'Use data.columns and data.rows directly. Do not nest data.data or rename rows/columns.'
                    },
                    {
                        example: {
                            kind: 'recipe_template_fill',
                            schemaVersion: 'recipe_template_fill/v2',
                            templateId,
                            title: 'Invalid vendor matrix',
                            summary: 'Wrong because it wraps the table inside freeform sections like overview/matrix/criteria.',
                            data: {
                                data: {
                                    overview: { tabLabel: 'Summary', description: '...' },
                                    matrix: { columnLabels: ['Col1', 'Col2'], rows: [{ col1: 'val1' }] },
                                    criteria: { items: [] },
                                    recommendations: { items: [] }
                                }
                            }
                        },
                        whyInvalid: 'Do NOT wrap the table in freeform sections like overview/matrix/criteria/recommendations. Place columns and rows directly under data.'
                    }
                ],
                commonMistakes: [
                    'Use rows as canonical table rows and columns as canonical table columns.',
                    'Do not emit data.data, columnLabels, comparisonRows, or overviewTitle.',
                    'Do NOT create freeform sections like overview, matrix, criteria, useCases, or recommendations. Place columns and rows DIRECTLY under data.',
                    'The template is a flat table, not a multi-tab document. Each vendor is one row with cells.'
                ]
            };
        case 'research-notebook':
            return {
                allowedDataKeys: ['activeTabId', 'sources', 'noteLines', 'extractedPoints', 'followUps'],
                requiredDataKeys: [],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'Recipe reliability research',
                    summary: 'Capture sources, notes, extracted points, and follow-ups.',
                    data: {
                        activeTabId: 'sources',
                        sources: [{ id: 'sources', label: 'Sources', items: [{ id: 'source-1', title: 'Runtime logs' }] }],
                        noteLines: ['Focus on deterministic normalization before repair.'],
                        extractedPoints: [],
                        followUps: [{ id: 'follow-ups', label: 'Follow-ups', items: [{ id: 'follow-up-1', title: 'Tighten vendor matrix keys' }] }]
                    }
                },
                invalidExamples: [
                    {
                        example: {
                            kind: 'recipe_template_fill',
                            schemaVersion: 'recipe_template_fill/v2',
                            templateId,
                            title: 'Invalid notebook',
                            summary: 'Wrong because it places actions into the content payload.',
                            data: {
                                followUps: [{ id: 'follow-ups', label: 'Follow-ups', items: [{ title: 'Ask Hermes again', actions: ['run-followup'] }] }]
                            }
                        },
                        whyInvalid: 'Stage content should not author action ids directly. Keep follow-up prompts as canonical grouped items.'
                    }
                ],
                commonMistakes: ['Keep followUps as grouped items. Do not embed action ids or links into the text or hydration payloads.']
            };
        case 'travel-itinerary-planner':
            return {
                allowedDataKeys: ['activeTabId', 'itineraryItems', 'bookingCards', 'packingItems', 'noteLines', 'links'],
                requiredDataKeys: [],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'Weekend trip plan',
                    summary: 'Track itinerary, bookings, packing, notes, and saved links.',
                    data: {
                        activeTabId: 'itinerary',
                        itineraryItems: [{ id: 'arrival', title: 'Arrive', time: '6:00 PM' }],
                        bookingCards: [],
                        packingItems: [],
                        noteLines: [],
                        links: []
                    }
                },
                invalidExamples: [
                    {
                        example: {
                            kind: 'recipe_template_fill',
                            schemaVersion: 'recipe_template_fill/v2',
                            templateId,
                            title: 'Invalid travel planner',
                            summary: 'Wrong because it collapses all content into one prose block.',
                            data: {
                                markdown: '- Book hotel\n- Pack clothes'
                            }
                        },
                        whyInvalid: 'Use itineraryItems, bookingCards, packingItems, noteLines, and links. Do not replace the template with freeform markdown.'
                    }
                ],
                commonMistakes: ['Populate the canonical itinerary/bookings/packing collections. Do not collapse the template into one markdown field.']
            };
        case 'local-discovery-comparison':
            return {
                allowedDataKeys: ['filters', 'sortLabel', 'groups', 'detail', 'noteLines'],
                requiredDataKeys: ['groups'],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'Venue comparison',
                    summary: 'Compare nearby venues in a list-detail layout.',
                    data: {
                        filters: [{ label: 'Indoor', tone: 'accent' }],
                        groups: [{ id: 'venues', label: 'Venues', items: [{ id: 'venue-1', title: 'Arcade Loft' }] }],
                        detail: { title: 'Arcade Loft', fields: [] },
                        noteLines: []
                    }
                },
                invalidExamples: [
                    {
                        example: {
                            kind: 'recipe_template_fill',
                            schemaVersion: 'recipe_template_fill/v2',
                            templateId,
                            title: 'Invalid discovery comparison',
                            summary: 'Wrong because it stores places in data.data and renames result groups.',
                            data: {
                                data: {
                                    places: [{ name: 'Arcade Loft' }]
                                }
                            }
                        },
                        whyInvalid: 'Use groups plus detail directly under data. Do not wrap data.data.'
                    }
                ],
                commonMistakes: ['Do not wrap the primary grouped results in data.data. Use groups and detail directly.']
            };
        case 'event-planner':
            return {
                allowedDataKeys: ['activeTabId', 'venueCards', 'guestGroups', 'checklistItems', 'itineraryItems', 'noteLines'],
                requiredDataKeys: [],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'Launch dinner plan',
                    summary: 'Track the venue, guests, checklist, and itinerary.',
                    data: {
                        activeTabId: 'venues',
                        venueCards: [{ id: 'venue-1', title: 'Foundry Hall' }],
                        guestGroups: [{ id: 'guest-group', label: 'Guests', items: [{ id: 'guest-1', title: 'Avery' }] }],
                        checklistItems: [{ id: 'check-1', title: 'Confirm venue', checked: false }],
                        itineraryItems: [{ id: 'it-1', title: 'Doors open', time: '6:00 PM' }]
                    }
                },
                commonMistakes: ['Keep venues, guests, checklistItems, itineraryItems, and noteLines separate. Do not flatten them into one note block.']
            };
        case 'job-search-pipeline':
            return {
                allowedDataKeys: ['stats', 'cards', 'noteLines'],
                requiredDataKeys: ['cards'],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'Backend job search',
                    summary: 'Curated job listings with pay ranges and direct apply links.',
                    data: {
                        cards: [{ id: 'job-1', title: 'Platform Engineer', subtitle: 'Stripe', price: '$200k–$240k', chips: [{ label: 'Remote', tone: 'accent' }], actions: [{ kind: 'link', label: 'Apply', href: 'https://stripe.com/jobs', openInNewTab: true }] }]
                    }
                },
                commonMistakes: ['Every card must have an Apply link action. Do not use kanban columns, board stages, or detail panels for this template.']
            };
        case 'shopping-shortlist':
            return {
                allowedDataKeys: ['cards', 'noteLines'],
                requiredDataKeys: ['cards'],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'Monitor shortlist',
                    summary: 'Curated shortlist of candidate monitors.',
                    data: {
                        cards: [{ id: 'item-1', title: 'Dell 27" 4K', subtitle: '$299', imageLabel: 'Dell 27 inch 4K monitor', chips: [{ label: 'Best value', tone: 'accent' }], links: [{ label: 'View product', href: 'https://www.dell.com/monitors/27-4k' }] }],
                        noteLines: ['All prices checked 2026-04-14.']
                    }
                },
                invalidExamples: [
                    {
                        example: {
                            kind: 'recipe_template_fill',
                            schemaVersion: 'recipe_template_fill/v2',
                            templateId,
                            title: 'Invalid shortlist',
                            summary: 'Wrong because it wraps cards in data.data.',
                            data: { data: { items: [{ name: 'Dell 27"' }] } }
                        },
                        whyInvalid: 'Use data.cards directly. Do not nest data.data or rename cards to items.'
                    }
                ],
                commonMistakes: [
                    'Use cards as canonical card items. Do not use data.data, items, or shortlistItems.',
                    'Always include product/item URLs as links on each card when the source data provides them (e.g. links: [{ label: "View product", href: "https://..." }]).',
                    'Always include imageLabel on each card to describe the item visually for image lookup (e.g. imageLabel: "Nike Air Force 1 white sneaker").'
                ]
            };
        case 'inbox-triage-board':
            return {
                allowedDataKeys: ['stats', 'groups', 'detail', 'noteLines'],
                requiredDataKeys: ['groups'],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'Email triage',
                    summary: 'Triage unread senders by urgency.',
                    data: {
                        stats: [{ label: 'Unread', value: '42' }],
                        groups: [{ id: 'urgent', label: 'Urgent', items: [{ id: 'sender-1', title: 'billing@example.com' }] }],
                        detail: { title: 'billing@example.com', fields: [{ label: 'Subject', value: 'Invoice due' }] }
                    }
                },
                commonMistakes: ['Use groups for sender/urgency categories and detail for the selected entry. Do not flatten into a single list or markdown block.']
            };
        case 'restaurant-finder':
            return {
                allowedDataKeys: ['filters', 'sortLabel', 'groups', 'detail', 'noteLines'],
                requiredDataKeys: ['groups'],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'Dinner options',
                    summary: 'Compare restaurants near downtown.',
                    data: {
                        filters: [{ label: 'Italian', tone: 'accent' }],
                        groups: [{ id: 'results', label: 'Top results', items: [{ id: 'rest-1', title: 'Trattoria Roma' }] }],
                        detail: { title: 'Trattoria Roma', fields: [{ label: 'Rating', value: '4.5' }] }
                    }
                },
                invalidExamples: [
                    {
                        example: {
                            kind: 'recipe_template_fill',
                            schemaVersion: 'recipe_template_fill/v2',
                            templateId,
                            title: 'Invalid finder',
                            summary: 'Wrong because it uses data.data and renames results.',
                            data: { data: { restaurants: [{ name: 'Trattoria Roma' }] } }
                        },
                        whyInvalid: 'Use groups and detail directly under data. Do not wrap data.data or rename groups to restaurants.'
                    }
                ],
                commonMistakes: ['Use groups for restaurant results and detail for the selected restaurant. Do not use data.data, restaurants, or places.']
            };
        case 'hotel-shortlist':
            return {
                allowedDataKeys: ['stats', 'cards', 'noteLines'],
                requiredDataKeys: ['cards'],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'Dayton hotel shortlist',
                    summary: 'Compare hotels for a weekend stay.',
                    data: {
                        stats: [{ label: 'Options', value: '5' }],
                        cards: [{ id: 'hotel-1', title: 'Marriott Downtown', subtitle: '$129/night', chips: [{ label: 'Pool', tone: 'accent' }] }],
                        noteLines: ['Prices for Fri-Sun stay.']
                    }
                },
                invalidExamples: [
                    {
                        example: {
                            kind: 'recipe_template_fill',
                            schemaVersion: 'recipe_template_fill/v2',
                            templateId,
                            title: 'Invalid shortlist',
                            summary: 'Wrong because it wraps hotels in data.data.',
                            data: { data: { hotels: [{ name: 'Marriott', price: '$129' }] } }
                        },
                        whyInvalid: 'Use data.cards directly. Do not nest data.data or rename cards to hotels.'
                    }
                ],
                commonMistakes: ['Use cards as canonical card items for hotels. Do not use data.data, hotels, or hotelList.']
            };
        case 'flight-comparison':
            return {
                allowedDataKeys: ['activeTabId', 'legs', 'noteLines'],
                requiredDataKeys: ['legs'],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'NYC flight options',
                    summary: 'Compare outbound and return flight options.',
                    data: {
                        activeTabId: 'outbound',
                        legs: [
                            {
                                id: 'outbound',
                                label: 'Outbound',
                                columns: [{ id: 'airline', label: 'Airline' }, { id: 'price', label: 'Price', align: 'end' }],
                                rows: [{ id: 'flight-1', label: 'United 1234', cells: [{ value: 'United' }, { value: '$289' }] }]
                            }
                        ]
                    }
                },
                invalidExamples: [
                    {
                        example: {
                            kind: 'recipe_template_fill',
                            schemaVersion: 'recipe_template_fill/v2',
                            templateId,
                            title: 'Invalid flights',
                            summary: 'Wrong because it uses flat rows instead of legs.',
                            data: { rows: [{ airline: 'United', price: '$289' }] }
                        },
                        whyInvalid: 'Use legs as an array of tab-like flight groups with columns and rows. Do not flatten into top-level rows.'
                    }
                ],
                commonMistakes: ['Use legs with columns and rows per leg. Do not flatten all flights into a single rows array.']
            };
        case 'security-review-board':
            return {
                allowedDataKeys: ['stats', 'groups', 'detail', 'noteLines'],
                requiredDataKeys: ['groups'],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'Security audit findings',
                    summary: 'Review findings by severity.',
                    data: {
                        stats: [{ label: 'Critical', value: '2' }],
                        groups: [{ id: 'critical', label: 'Critical', items: [{ id: 'finding-1', title: 'SQL injection in login' }] }],
                        detail: { title: 'SQL injection in login', fields: [{ label: 'Severity', value: 'Critical' }] }
                    }
                },
                commonMistakes: ['Use groups for severity categories and detail for the selected finding. Do not flatten findings into one list.']
            };
        case 'step-by-step-instructions':
            return {
                allowedDataKeys: ['prerequisites', 'steps', 'noteLines'],
                requiredDataKeys: ['steps'],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: 'Deploy a Node.js app to production',
                    summary: 'Step-by-step guide for deploying a Node.js application.',
                    data: {
                        prerequisites: ['Node.js 18+ installed', 'Docker CLI available'],
                        steps: [
                            { id: 'step-1', label: 'Build the Docker image', detail: 'Run docker build -t myapp .' },
                            { id: 'step-2', label: 'Push to registry', detail: 'Tag and push the image to your container registry.' },
                            { id: 'step-3', label: 'Update the deployment manifest' }
                        ],
                        noteLines: ['Ensure CI pipeline passes before deploying.']
                    }
                },
                invalidExamples: [
                    {
                        example: {
                            kind: 'recipe_template_fill',
                            schemaVersion: 'recipe_template_fill/v2',
                            templateId,
                            title: 'Invalid instructions',
                            summary: 'Wrong because it wraps data in nested sections.',
                            data: {
                                data: {
                                    overview: { description: 'Setup guide' },
                                    sections: [{ title: 'Step 1', content: 'Install' }]
                                }
                            }
                        },
                        whyInvalid: 'Use prerequisites and steps directly under data. Do not nest data.data or create freeform sections.'
                    }
                ],
                commonMistakes: [
                    'Use steps as an array of { id, label, detail? } objects. Do not rename them to instructions or items.',
                    'Use prerequisites as a flat string array. Do not wrap data in data.data.'
                ]
            };
        default:
            return {
                allowedDataKeys: ['data'],
                requiredDataKeys: [],
                validExample: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: templateTitleFromId(templateId),
                    summary: `Populate ${templateTitleFromId(templateId)} with template-specific data.`,
                    data: {}
                },
                invalidExamples: [
                    {
                        example: {
                            kind: 'recipe_template_fill',
                            schemaVersion: 'recipe_template_fill/v2',
                            templateId,
                            title: templateTitleFromId(templateId),
                            summary: 'Wrong because the content is wrapped in data.data.',
                            data: {
                                data: {}
                            }
                        },
                        whyInvalid: 'Do not emit nested data.data wrappers. Place canonical fields directly under data.'
                    }
                ],
                commonMistakes: ['Do not emit data.data or rendered sections. Use the canonical template-specific data keys only.']
            };
    }
}
function getTemplateSemanticRequirements(templateId) {
    switch (templateId) {
        case 'price-comparison-grid':
        case 'vendor-evaluation-matrix':
            return ['Populate at least one comparison row in the main table.'];
        case 'shopping-shortlist':
        case 'hotel-shortlist':
            return ['Populate at least one primary shortlist card.'];
        case 'inbox-triage-board':
        case 'restaurant-finder':
        case 'local-discovery-comparison':
            return ['Populate at least one grouped list item in the primary results or queue view.'];
        case 'flight-comparison':
            return ['Populate at least one flight row across the outbound or return legs.'];
        case 'travel-itinerary-planner':
            return ['Populate at least one itinerary item, booking card, or packing item.'];
        case 'research-notebook':
            return ['Populate at least one source, note line, extracted point, or follow-up.'];
        case 'security-review-board':
            return ['Populate at least one finding in the severity-grouped results.'];
        case 'job-search-pipeline':
            return ['Populate at least one job listing card with a title, company subtitle, pay price, and an Apply link action.'];
        case 'event-planner':
            return ['Populate at least one venue, guest, checklist item, or itinerary item.'];
        case 'step-by-step-instructions':
            return ['Populate at least one instruction step.'];
        default:
            return ['Populate at least one meaningful primary content collection for the selected template.'];
    }
}
function getTemplateUpdateGuide(templateId) {
    return {
        allowedTopLevelKeys: ['kind', 'schemaVersion', 'templateId', 'operations', 'metadata'],
        allowedOps: getRecipeTemplateRuntimeDefinition(templateId)?.allowedUpdateOps ?? [],
        validExample: {
            kind: 'recipe_template_update',
            schemaVersion: 'recipe_template_update/v2',
            templateId,
            operations: [{ op: 'set_header', summary: 'Refined from the latest request.' }]
        },
        invalidExamples: [
            {
                example: {
                    kind: 'recipe_template_update',
                    schemaVersion: 'recipe_template_update/v2',
                    templateId,
                    sections: []
                },
                whyInvalid: 'Updates may only use allowed operations. They may not replace the full rendered layout.'
            }
        ]
    };
}
function summarizeRows(rows) {
    return rows.map((row) => ({
        id: row.id,
        label: row.label
    }));
}
function summarizeCards(cards) {
    return cards.map((card) => ({
        id: card.id ?? card.title,
        title: card.title
    }));
}
function summarizeGroups(groups) {
    return groups.map((group) => ({
        id: group.id,
        label: group.label,
        items: group.items.map((item) => ({
            id: item.id ?? item.title,
            title: item.title
        }))
    }));
}
function summarizeTimeline(items) {
    return items.map((item) => ({
        id: item.id ?? item.title,
        title: item.title,
        time: item.time
    }));
}
function summarizeDetailFields(detail) {
    if (!detail) {
        return [];
    }
    return detail.fields.map((field) => ({
        label: field.label
    }));
}
function createRecipeTemplateActionsTargetPacket(text) {
    switch (text.templateId) {
        case 'price-comparison-grid':
        case 'vendor-evaluation-matrix':
            return {
                rows: summarizeRows(text.data.rows)
            };
        case 'shopping-shortlist':
        case 'hotel-shortlist':
            return {
                cards: summarizeCards(text.data.cards)
            };
        case 'inbox-triage-board':
            return {
                groups: summarizeGroups(text.data.groups),
                detailFields: summarizeDetailFields(text.data.detail)
            };
        case 'restaurant-finder':
        case 'local-discovery-comparison':
            return {
                groups: summarizeGroups(text.data.groups),
                detailFields: summarizeDetailFields(text.data.detail)
            };
        case 'flight-comparison': {
            const flightTextData = text.data;
            return {
                legs: flightTextData.legs.map((leg) => ({
                    id: leg.id,
                    label: leg.label,
                    rows: summarizeRows(leg.rows)
                }))
            };
        }
        case 'travel-itinerary-planner':
            return {
                itineraryItems: summarizeTimeline(text.data.itineraryItems),
                bookingCards: summarizeCards(text.data.bookingCards),
                linkCollection: 'links'
            };
        case 'research-notebook':
            return {
                sources: summarizeGroups(text.data.sources),
                extractedPoints: summarizeGroups(text.data.extractedPoints),
                followUps: summarizeGroups(text.data.followUps)
            };
        case 'security-review-board':
            return {
                groups: summarizeGroups(text.data.groups),
                detailFields: summarizeDetailFields(text.data.detail)
            };
        case 'job-search-pipeline':
            return {
                cards: summarizeCards(text.data.cards)
            };
        case 'event-planner':
            return {
                venueCards: summarizeCards(text.data.venueCards),
                guestGroups: summarizeGroups(text.data.guestGroups),
                itineraryItems: summarizeTimeline(text.data.itineraryItems)
            };
        default:
            return {};
    }
}
export function createRecipeTemplateTextPacket(templateId) {
    const definition = getRecipeTemplateRuntimeDefinition(templateId);
    if (!definition) {
        return null;
    }
    const guide = getTemplateFillGuide(templateId);
    return {
        contract: {
            outputKind: 'recipe_template_text',
            schemaVersion: 'recipe_template_text/v1',
            allowedTopLevelKeys: ['kind', 'schemaVersion', 'templateId', 'title', 'subtitle', 'summary', 'data', 'metadata'],
            requiredTopLevelKeys: ['kind', 'schemaVersion', 'templateId', 'title', 'summary', 'data']
        },
        template: {
            id: definition.id,
            name: definition.name,
            useCase: definition.useCase,
            allowedDataKeys: guide.allowedDataKeys,
            requiredDataKeys: guide.requiredDataKeys,
            semanticRequirements: getTemplateSemanticRequirements(templateId),
            transitions: definition.transitions.map((transition) => ({
                targetTemplateId: transition.targetTemplateId,
                reason: transition.reason
            }))
        },
        validExamples: [
            {
                ...guide.validExample,
                kind: 'recipe_template_text',
                schemaVersion: 'recipe_template_text/v1'
            }
        ],
        invalidExamples: [
            {
                example: {
                    kind: 'recipe_template_text',
                    schemaVersion: 'recipe_template_text/v1',
                    templateId,
                    title: templateTitleFromId(templateId),
                    summary: 'Invalid because it includes link/button metadata during the text pass.',
                    data: {
                        cards: [
                            {
                                id: 'item-1',
                                title: 'Do not do this',
                                links: [{ label: 'Buy', href: 'https://example.com' }]
                            }
                        ]
                    }
                },
                whyInvalid: 'Text generation must leave link/button metadata to the later actions stage.'
            },
            ...(guide.invalidExamples ?? [])
        ],
        commonMistakes: [
            'Do not include hrefs, links arrays with values, action ids, buttons, or rendered sections.',
            'Establish stable headings, labels, notes, and section copy without relying on the renderer to invent missing text later.',
            'Populate the content words, labels, titles, summaries, and non-interactive structure only.',
            'Return JSON only.',
            ...(guide.commonMistakes ?? [])
        ]
    };
}
export function createRecipeTemplateHydrationPacket(templateId) {
    const definition = getRecipeTemplateRuntimeDefinition(templateId);
    if (!definition) {
        return null;
    }
    const guide = getTemplateFillGuide(templateId);
    return {
        contract: {
            outputKind: 'recipe_template_hydration',
            schemaVersion: 'recipe_template_hydration/v1',
            allowedTopLevelKeys: ['kind', 'schemaVersion', 'templateId', 'title', 'subtitle', 'summary', 'data', 'metadata'],
            requiredTopLevelKeys: ['kind', 'schemaVersion', 'templateId', 'title', 'summary', 'data']
        },
        template: {
            id: definition.id,
            name: definition.name,
            useCase: definition.useCase,
            allowedDataKeys: guide.allowedDataKeys,
            requiredDataKeys: guide.requiredDataKeys,
            semanticRequirements: getTemplateSemanticRequirements(templateId),
            transitions: definition.transitions.map((transition) => ({
                targetTemplateId: transition.targetTemplateId,
                reason: transition.reason
            }))
        },
        validExamples: [
            {
                ...guide.validExample,
                kind: 'recipe_template_hydration',
                schemaVersion: 'recipe_template_hydration/v1'
            }
        ],
        invalidExamples: [
            {
                example: {
                    kind: 'recipe_template_hydration',
                    schemaVersion: 'recipe_template_hydration/v1',
                    templateId,
                    title: templateTitleFromId(templateId),
                    summary: 'Invalid because every primary collection stayed empty.',
                    data: {}
                },
                whyInvalid: 'Hydration must populate the primary content collections for the selected template. Empty shells are rejected.'
            },
            ...(guide.invalidExamples ?? [])
        ],
        commonMistakes: [
            'Use the full assistant response and data snapshots to populate the main rows, cards, groups, notes, or timeline items.',
            'Do not leave all primary collections empty.',
            'Do not add links, hrefs, button labels, or action ids in this stage.',
            'Return JSON only.',
            ...(guide.commonMistakes ?? [])
        ]
    };
}
export function createRecipeTemplateActionsPacket(text) {
    const definition = getRecipeTemplateRuntimeDefinition(text.templateId);
    if (!definition) {
        return null;
    }
    return {
        contract: {
            outputKind: 'recipe_template_actions',
            schemaVersion: 'recipe_template_actions/v1',
            allowedTopLevelKeys: ['kind', 'schemaVersion', 'templateId', 'data', 'metadata'],
            requiredTopLevelKeys: ['kind', 'schemaVersion', 'templateId', 'data']
        },
        template: {
            id: definition.id,
            name: definition.name,
            allowedActionIds: Object.keys(definition.actions)
        },
        actionTargets: createRecipeTemplateActionsTargetPacket(text),
        validExamples: [
            {
                kind: 'recipe_template_actions',
                schemaVersion: 'recipe_template_actions/v1',
                templateId: text.templateId,
                data: {}
            }
        ],
        invalidExamples: [
            {
                example: {
                    kind: 'recipe_template_actions',
                    schemaVersion: 'recipe_template_actions/v1',
                    templateId: text.templateId,
                    title: 'Do not rewrite content here'
                },
                whyInvalid: 'The actions stage may only add link/action metadata. It may not rewrite text content.'
            }
        ],
        commonMistakes: [
            'Do not rewrite titles, summaries, body copy, tabs, or list wording from the text stage.',
            'Use only ids and field labels that already exist in the staged text artifact.',
            'Return JSON only.'
        ]
    };
}
export function createRecipeTemplateSelectionPacket() {
    return {
        contract: {
            outputKind: 'recipe_template_selection',
            schemaVersion: 'recipe_template_selection/v2',
            allowedKeys: ['kind', 'schemaVersion', 'templateId', 'mode', 'reason', 'confidence', 'hints'],
            requiredKeys: ['kind', 'schemaVersion', 'templateId', 'mode', 'reason', 'confidence'],
            allowedHintKeys: ['primaryEntity', 'currentTemplateId', 'suggestedTransitionFrom']
        },
        templates: Object.values(WORKRECIPE_TEMPLATE_RUNTIME_REGISTRY).filter((t) => t.enabled !== false).map((template) => ({
            id: template.id,
            name: template.name,
            useCase: template.useCase,
            selectionSignals: template.selectionSignals,
            transitionTargets: template.transitions.map((transition) => transition.targetTemplateId)
        })),
        validExamples: [
            {
                kind: 'recipe_template_selection',
                schemaVersion: 'recipe_template_selection/v2',
                templateId: 'event-planner',
                mode: 'switch',
                reason: 'The user has moved from comparing venues into active event planning.',
                confidence: 0.87,
                hints: {
                    primaryEntity: 'venue',
                    currentTemplateId: 'local-discovery-comparison'
                }
            }
        ],
        invalidExamples: [
            {
                example: {
                    templateId: 'invented-template',
                    reason: 'It feels right.'
                },
                whyInvalid: 'Template ids must come from the approved registry and the required top-level keys are missing.'
            }
        ],
        commonMistakes: [
            'Return mode as fill, update, or switch. Do not leave it implicit.',
            'Do not include sections, tabs, TSX, recipe_dsl, or recipe_model fields.',
            'Return JSON only. No prose, code fences, or Markdown.'
        ]
    };
}
export function createRecipeTemplateFillPacket(templateId) {
    const definition = getRecipeTemplateRuntimeDefinition(templateId);
    if (!definition) {
        return null;
    }
    const guide = getTemplateFillGuide(templateId);
    return {
        contract: {
            outputKind: 'recipe_template_fill',
            schemaVersion: 'recipe_template_fill/v2',
            allowedTopLevelKeys: ['kind', 'schemaVersion', 'templateId', 'title', 'subtitle', 'summary', 'data', 'metadata'],
            requiredTopLevelKeys: ['kind', 'schemaVersion', 'templateId', 'title', 'summary', 'data']
        },
        template: {
            id: definition.id,
            name: definition.name,
            useCase: definition.useCase,
            allowedDataKeys: guide.allowedDataKeys,
            requiredDataKeys: guide.requiredDataKeys,
            semanticRequirements: getTemplateSemanticRequirements(templateId),
            allowedActionIds: Object.keys(definition.actions),
            allowedUpdateOps: definition.allowedUpdateOps,
            transitions: definition.transitions.map((transition) => ({
                targetTemplateId: transition.targetTemplateId,
                reason: transition.reason
            }))
        },
        validExamples: [guide.validExample],
        invalidExamples: [
            {
                example: {
                    kind: 'recipe_template_fill',
                    schemaVersion: 'recipe_template_fill/v2',
                    templateId,
                    title: templateTitleFromId(templateId),
                    summary: 'Invalid because it tries to author the final render tree.',
                    sections: []
                },
                whyInvalid: 'Template fill may only provide template-specific authoring data under data.'
            },
            ...(guide.invalidExamples ?? [])
        ],
        commonMistakes: [
            'Do not return sections, tabs, slot ids, action refs, or the final recipe_template_state.',
            'Use only the selected template id and the template-specific data keys.',
            'Return JSON only.',
            ...(guide.commonMistakes ?? [])
        ]
    };
}
export function createRecipeTemplateUpdatePacket(templateId) {
    const definition = getRecipeTemplateRuntimeDefinition(templateId);
    if (!definition) {
        return null;
    }
    const guide = getTemplateUpdateGuide(templateId);
    return {
        contract: guide,
        template: {
            id: definition.id,
            name: definition.name,
            allowedUpdateOps: definition.allowedUpdateOps
        },
        commonMistakes: [
            'Do not rewrite the template as a full fill or rendered section tree.',
            'Use slot ids that already exist in the current template state when an operation requires one.',
            'Return JSON only.'
        ]
    };
}
function createGhostAuthoringDetail(title, summary) {
    return {
        title,
        summary,
        chips: [],
        fields: []
    };
}
function createGhostRecipeTemplateFill(templateId, currentState) {
    const title = currentState?.title ?? templateTitleFromId(templateId);
    const subtitle = currentState?.subtitle;
    const summary = currentState?.summary ?? `Preparing ${templateTitleFromId(templateId)}.`;
    switch (templateId) {
        case 'price-comparison-grid':
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId,
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    scopeTags: [],
                    columns: [
                        {
                            id: 'offer',
                            label: 'Offer'
                        }
                    ],
                    rows: [],
                    noteLines: []
                },
                metadata: {
                    preview: true
                }
            });
        case 'shopping-shortlist':
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId,
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    cards: [],
                    noteLines: []
                },
                metadata: {
                    preview: true
                }
            });
        case 'inbox-triage-board':
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId,
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    stats: [],
                    groups: [],
                    detail: createGhostAuthoringDetail('Selected sender', 'Hydrating inbox triage details.'),
                    bulkActionTitle: 'Bulk actions'
                },
                metadata: {
                    preview: true
                }
            });
        case 'restaurant-finder':
        case 'local-discovery-comparison':
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId,
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    filters: [],
                    groups: [],
                    detail: createGhostAuthoringDetail(templateId === 'restaurant-finder' ? 'Selected restaurant' : 'Selected place', 'Hydrating the selected result.'),
                    noteLines: []
                },
                metadata: {
                    preview: true
                }
            });
        case 'hotel-shortlist':
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId,
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    stats: [],
                    cards: [],
                    noteLines: []
                },
                metadata: {
                    preview: true
                }
            });
        case 'flight-comparison':
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId,
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    activeTabId: 'outbound',
                    legs: [
                        {
                            id: 'outbound',
                            label: 'Outbound',
                            columns: [
                                {
                                    id: 'itinerary',
                                    label: 'Itinerary'
                                }
                            ],
                            rows: []
                        }
                    ]
                },
                metadata: {
                    preview: true
                }
            });
        case 'travel-itinerary-planner':
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId,
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    activeTabId: 'itinerary',
                    itineraryItems: [],
                    bookingCards: [],
                    packingItems: [],
                    noteLines: [],
                    links: []
                },
                metadata: {
                    preview: true
                }
            });
        case 'research-notebook':
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId,
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    activeTabId: 'sources',
                    sources: [],
                    noteLines: [],
                    extractedPoints: [],
                    followUps: []
                },
                metadata: {
                    preview: true
                }
            });
        case 'security-review-board':
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId,
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    stats: [],
                    groups: [],
                    detail: createGhostAuthoringDetail('Selected finding', 'Hydrating evidence and remediation context.'),
                    remediationTitle: 'Proposed remediation',
                    remediationMarkdown: undefined
                },
                metadata: {
                    preview: true
                }
            });
        case 'vendor-evaluation-matrix':
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId,
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    stats: [],
                    columns: [
                        {
                            id: 'criteria',
                            label: 'Criteria'
                        }
                    ],
                    rows: [],
                    footerChips: [],
                    noteLines: []
                },
                metadata: {
                    preview: true
                }
            });
        case 'job-search-pipeline':
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId,
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    stats: [],
                    cards: [],
                    noteLines: []
                },
                metadata: {
                    preview: true
                }
            });
        case 'event-planner':
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId,
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    activeTabId: 'venues',
                    venueCards: [],
                    guestGroups: [],
                    checklistItems: [],
                    itineraryItems: [],
                    noteLines: []
                },
                metadata: {
                    preview: true
                }
            });
        case 'step-by-step-instructions':
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId,
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    prerequisites: [],
                    steps: [],
                    noteLines: []
                },
                metadata: {
                    preview: true
                }
            });
        default:
            // Unknown templateId (custom user recipe): fall back to the step-by-step shape so the preview pipeline
            // still produces a valid fill. The real rendering path is driven by section kinds regardless.
            return RecipeTemplateFillSchema.parse({
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId: 'step-by-step-instructions',
                title,
                subtitle,
                summary,
                data: {
                    heroChips: [],
                    prerequisites: [],
                    steps: [],
                    noteLines: []
                },
                metadata: {
                    preview: true
                }
            });
    }
}
function sectionHasMeaningfulContent(section) {
    switch (section.kind) {
        case 'hero':
            return Boolean(section.summary || section.chips.length > 0 || section.actions.length > 0);
        case 'filter-strip':
            return section.filters.length > 0 || Boolean(section.sortLabel);
        case 'action-bar':
            return section.actions.length > 0;
        case 'stats':
            return section.items.length > 0;
        case 'comparison-table':
            return section.columns.length > 0 || section.rows.length > 0 || section.footerChips.length > 0 || Boolean(section.footnote);
        case 'grouped-list':
            return section.groups.some((group) => group.items.length > 0);
        case 'card-grid':
            return section.cards.length > 0;
        case 'detail-panel':
            return Boolean(section.summary || section.chips.length > 0 || section.fields.length > 0 || section.note || section.actions.length > 0);
        case 'timeline':
            return section.items.length > 0;
        case 'notes':
            return section.lines.length > 0;
        case 'activity-log':
            return section.entries.length > 0;
        case 'kanban':
            return section.columns.some((column) => column.cards.length > 0);
        case 'confirmation':
            return Boolean(section.message);
        case 'checklist':
            return section.steps.length > 0;
        case 'split':
            return [...section.left, ...section.right].some((nested) => sectionHasMeaningfulContent(nested));
        case 'tabs':
            return Object.values(section.panes).some((pane) => pane.some((nested) => sectionHasMeaningfulContent(nested)));
        default:
            return false;
    }
}
function sectionCanHostActions(section) {
    switch (section.kind) {
        case 'action-bar':
        case 'comparison-table':
        case 'grouped-list':
        case 'card-grid':
        case 'detail-panel':
        case 'timeline':
        case 'notes':
        case 'confirmation':
        case 'kanban':
            return true;
        case 'split':
            return [...section.left, ...section.right].some((nested) => sectionCanHostActions(nested));
        case 'tabs':
            return Object.values(section.panes).some((pane) => pane.some((nested) => sectionCanHostActions(nested)));
        default:
            return false;
    }
}
function mapTemplateSectionsWithProgress(sections, progressResolver) {
    return sections.map((section) => {
        const progress = progressResolver(section);
        if (section.kind === 'split') {
            return {
                ...section,
                progress,
                left: mapTemplateSectionsWithProgress(section.left, progressResolver),
                right: mapTemplateSectionsWithProgress(section.right, progressResolver)
            };
        }
        if (section.kind === 'tabs') {
            return {
                ...section,
                progress,
                panes: Object.fromEntries(Object.entries(section.panes).map(([paneId, paneSections]) => [paneId, mapTemplateSectionsWithProgress(paneSections, progressResolver)]))
            };
        }
        return {
            ...section,
            progress
        };
    });
}
function createSectionProgressForPhase(input) {
    const meaningful = sectionHasMeaningfulContent(input.section);
    const actionScoped = input.failureScope === 'actions';
    const contentScoped = input.failureScope === 'content';
    const affectsSection = input.failureScope === 'all' ||
        contentScoped ||
        (actionScoped ? sectionCanHostActions(input.section) : true);
    switch (input.phase) {
        case 'selected':
            return {
                hydrationState: 'pending',
                repairState: 'idle',
                contentState: 'ghost',
                lastUpdatedAt: input.updatedAt ?? undefined
            };
        case 'text':
            return {
                hydrationState: meaningful ? 'hydrating' : 'pending',
                repairState: 'idle',
                contentState: meaningful ? 'partial' : 'ghost',
                lastUpdatedAt: input.updatedAt ?? undefined
            };
        case 'hydrating':
            return {
                hydrationState: meaningful ? 'ready' : 'hydrating',
                repairState: 'idle',
                contentState: meaningful ? 'partial' : 'ghost',
                lastUpdatedAt: input.updatedAt ?? undefined
            };
        case 'actions':
            return {
                hydrationState: meaningful ? 'ready' : 'hydrating',
                repairState: 'idle',
                contentState: meaningful ? 'hydrated' : 'ghost',
                lastUpdatedAt: input.updatedAt ?? undefined
            };
        case 'repairing':
            return {
                hydrationState: affectsSection ? (meaningful ? 'ready' : 'hydrating') : meaningful ? 'ready' : 'pending',
                repairState: affectsSection ? 'repairing' : 'idle',
                contentState: meaningful ? 'partial' : 'ghost',
                lastUpdatedAt: input.updatedAt ?? undefined,
                errorMessage: affectsSection ? input.errorMessage ?? undefined : undefined
            };
        case 'failed':
            return {
                hydrationState: affectsSection ? 'failed' : meaningful ? 'ready' : 'pending',
                repairState: affectsSection ? 'failed' : 'idle',
                contentState: meaningful ? 'fallback' : 'ghost',
                lastUpdatedAt: input.updatedAt ?? undefined,
                errorMessage: affectsSection ? input.errorMessage ?? undefined : undefined
            };
        case 'ready':
        default:
            return {
                hydrationState: meaningful ? 'ready' : 'pending',
                repairState: 'idle',
                contentState: meaningful ? 'hydrated' : 'ghost',
                lastUpdatedAt: input.updatedAt ?? undefined
            };
    }
}
export function compileRecipeTemplatePreviewState(input) {
    const validation = validateRecipeTemplateFill(input.fill);
    if (!validation.definition || validation.errors.length > 0) {
        return {
            state: null,
            definition: validation.definition,
            errors: validation.errors
        };
    }
    const baseSections = compileTemplateSections(input.fill, validation.definition);
    const errors = [];
    validateTemplateSections(validation.definition, baseSections, errors);
    if (errors.length > 0) {
        return {
            state: null,
            definition: validation.definition,
            errors
        };
    }
    const sections = mapTemplateSectionsWithProgress(baseSections, (section) => createSectionProgressForPhase({
        section,
        phase: input.phase,
        updatedAt: input.updatedAt ?? null,
        errorMessage: input.errorMessage ?? null,
        failureScope: input.failureScope ?? 'all'
    }));
    const currentTransitionHistory = input.currentState?.transitionHistory ?? [];
    const nextState = RecipeTemplateStateSchema.parse({
        kind: 'recipe_template_state',
        schemaVersion: 'recipe_template_state/v1',
        templateId: input.fill.templateId,
        title: input.fill.title,
        subtitle: input.fill.subtitle,
        summary: input.fill.summary,
        status: {
            phase: input.phase,
            lastUpdatedAt: input.updatedAt ?? undefined,
            failureCategory: input.failureCategory ?? undefined,
            errorMessage: input.errorMessage ?? undefined
        },
        sections,
        transitionTargets: validation.definition.transitions.map((transition) => transition.targetTemplateId),
        transitionHistory: input.currentState && input.currentState.templateId !== input.fill.templateId
            ? [
                ...currentTransitionHistory,
                {
                    fromTemplateId: input.currentState.templateId,
                    toTemplateId: input.fill.templateId,
                    switchedAt: input.updatedAt ?? new Date().toISOString(),
                    reason: input.transitionReason ?? undefined
                }
            ]
            : currentTransitionHistory,
        metadata: {
            ...input.fill.metadata,
            previewPhase: input.phase
        }
    });
    return {
        state: nextState,
        definition: validation.definition,
        errors: []
    };
}
export function createRecipeTemplateGhostState(input) {
    return compileRecipeTemplatePreviewState({
        fill: createGhostRecipeTemplateFill(input.templateId, input.currentState),
        currentState: input.currentState ?? null,
        transitionReason: input.transitionReason ?? null,
        phase: input.phase ?? 'selected',
        updatedAt: input.updatedAt ?? null,
        failureCategory: input.failureCategory ?? null,
        errorMessage: input.errorMessage ?? null,
        failureScope: input.failureScope ?? 'all'
    });
}
export function validateRecipeTemplateSelection(selection) {
    const definition = getRecipeTemplateRuntimeDefinition(selection.templateId);
    if (!definition) {
        return [`Template "${selection.templateId}" is not in the approved runtime registry.`];
    }
    return [];
}
export function validateRecipeTemplateFill(fill) {
    const definition = getRecipeTemplateRuntimeDefinition(fill.templateId);
    if (!definition) {
        return {
            definition: null,
            errors: [`Template "${fill.templateId}" is not in the approved runtime registry.`]
        };
    }
    return {
        definition,
        errors: []
    };
}
export function validateRecipeTemplateUpdate(update, currentState) {
    const definition = getRecipeTemplateRuntimeDefinition(update.templateId);
    if (!definition) {
        return {
            definition: null,
            errors: [`Template "${update.templateId}" is not in the approved runtime registry.`]
        };
    }
    const errors = [];
    if (currentState.templateId !== update.templateId) {
        errors.push(`Template update targeted ${update.templateId}, but the current state is ${currentState.templateId}.`);
    }
    if (update.operations.length === 0) {
        errors.push('Template updates must include at least one allowed operation.');
    }
    for (const operation of update.operations) {
        if (!definition.allowedUpdateOps.includes(operation.op)) {
            errors.push(`Update operation "${operation.op}" is not allowed for template ${definition.id}.`);
            continue;
        }
        switch (operation.op) {
            case 'set_header':
            case 'set_status':
                break;
            case 'append_note_lines': {
                const section = findSectionBySlotId(currentState.sections, operation.slotId);
                if (!section || section.kind !== 'notes') {
                    errors.push(`Append-note operation requires an existing notes slot "${operation.slotId}".`);
                }
                break;
            }
            case 'set_active_tab': {
                const section = findSectionBySlotId(currentState.sections, operation.slotId);
                if (!section || section.kind !== 'tabs') {
                    errors.push(`Set-active-tab operation requires an existing tabs slot "${operation.slotId}".`);
                    break;
                }
                if (!section.tabs.some((tab) => tab.id === operation.tabId)) {
                    errors.push(`Tab "${operation.tabId}" does not exist in slot "${operation.slotId}".`);
                }
                break;
            }
            case 'set_filter_chips': {
                const section = findSectionBySlotId(currentState.sections, operation.slotId);
                if (!section || section.kind !== 'filter-strip') {
                    errors.push(`Filter updates require an existing filter-strip slot "${operation.slotId}".`);
                }
                break;
            }
            case 'set_scope_tags':
            case 'upsert_table_rows': {
                const section = findSectionBySlotId(currentState.sections, operation.slotId);
                if (!section || section.kind !== 'comparison-table') {
                    errors.push(`Table updates require an existing comparison-table slot "${operation.slotId}".`);
                }
                break;
            }
            case 'upsert_cards': {
                const section = findSectionBySlotId(currentState.sections, operation.slotId);
                if (!section || section.kind !== 'card-grid') {
                    errors.push(`Card updates require an existing card-grid slot "${operation.slotId}".`);
                }
                break;
            }
            case 'upsert_groups': {
                const section = findSectionBySlotId(currentState.sections, operation.slotId);
                if (!section || section.kind !== 'grouped-list') {
                    errors.push(`Group updates require an existing grouped-list slot "${operation.slotId}".`);
                }
                break;
            }
            case 'upsert_timeline_items': {
                const section = findSectionBySlotId(currentState.sections, operation.slotId);
                if (!section || section.kind !== 'timeline') {
                    errors.push(`Timeline updates require an existing timeline slot "${operation.slotId}".`);
                }
                break;
            }
            case 'set_detail': {
                const section = findSectionBySlotId(currentState.sections, operation.slotId);
                if (!section || section.kind !== 'detail-panel') {
                    errors.push(`Detail updates require an existing detail-panel slot "${operation.slotId}".`);
                }
                break;
            }
            case 'upsert_board_cards':
            case 'move_board_card': {
                const section = findSectionBySlotId(currentState.sections, operation.slotId);
                if (!section || section.kind !== 'kanban') {
                    errors.push(`Board updates require an existing kanban slot "${operation.slotId}".`);
                    break;
                }
                if ('columnId' in operation && !section.columns.some((column) => (column.id ?? column.label) === operation.columnId)) {
                    errors.push(`Board column "${operation.columnId}" does not exist in slot "${operation.slotId}".`);
                }
                if ('targetColumnId' in operation && !section.columns.some((column) => (column.id ?? column.label) === operation.targetColumnId)) {
                    errors.push(`Board column "${operation.targetColumnId}" does not exist in slot "${operation.slotId}".`);
                }
                break;
            }
            case 'remove_items': {
                const section = findSectionBySlotId(currentState.sections, operation.slotId);
                if (!section) {
                    errors.push(`Remove-items operation requires an existing slot "${operation.slotId}".`);
                }
                break;
            }
            default:
                break;
        }
    }
    return {
        definition,
        errors
    };
}
export function compileRecipeTemplateState(input) {
    const validation = validateRecipeTemplateFill(input.fill);
    if (!validation.definition || validation.errors.length > 0) {
        return {
            state: null,
            definition: validation.definition,
            errors: validation.errors
        };
    }
    const semanticCompleteness = validateRecipeTemplateSemanticCompleteness(input.fill);
    if (!semanticCompleteness.ok) {
        return {
            state: null,
            definition: validation.definition,
            errors: semanticCompleteness.issues
        };
    }
    const sections = mapTemplateSectionsWithProgress(compileTemplateSections(input.fill, validation.definition), (section) => createSectionProgressForPhase({
        section,
        phase: 'ready'
    }));
    const errors = [];
    validateTemplateSections(validation.definition, sections, errors);
    if (errors.length > 0) {
        return {
            state: null,
            definition: validation.definition,
            errors
        };
    }
    const currentTransitionHistory = input.currentState?.transitionHistory ?? [];
    const nextState = RecipeTemplateStateSchema.parse({
        kind: 'recipe_template_state',
        schemaVersion: 'recipe_template_state/v1',
        templateId: input.fill.templateId,
        title: input.fill.title,
        subtitle: input.fill.subtitle,
        summary: input.fill.summary,
        status: {
            phase: 'ready'
        },
        sections,
        transitionTargets: validation.definition.transitions.map((transition) => transition.targetTemplateId),
        transitionHistory: input.currentState && input.currentState.templateId !== input.fill.templateId
            ? [
                ...currentTransitionHistory,
                {
                    fromTemplateId: input.currentState.templateId,
                    toTemplateId: input.fill.templateId,
                    switchedAt: new Date().toISOString(),
                    reason: input.transitionReason ?? undefined
                }
            ]
            : currentTransitionHistory,
        metadata: {
            ...input.fill.metadata
        }
    });
    return {
        state: nextState,
        definition: validation.definition,
        errors: []
    };
}
function upsertTableRows(definition, sections, slotId, rows) {
    return mapSections(sections, (section) => section.slotId === slotId && section.kind === 'comparison-table'
        ? {
            ...section,
            rows: mergeById(section.rows, toTableRows(definition, rows), (row) => row.id)
        }
        : section);
}
function upsertCards(definition, sections, slotId, cards) {
    return mapSections(sections, (section) => section.slotId === slotId && section.kind === 'card-grid'
        ? {
            ...section,
            cards: mergeById(section.cards, toCardItems(definition, cards, section.slotId === 'venues' ? ['select-event-venue'] : section.slotId === 'ideas' ? ['flesh-out-idea', 'write-campaign-email'] : [], slotId), (card) => card.id ?? card.title)
        }
        : section);
}
function upsertGroups(definition, sections, slotId, groups) {
    const actionIds = slotId === 'follow-ups' ? ['run-followup'] : slotId === 'checklist' ? ['toggle-template-checklist'] : [];
    return mapSections(sections, (section) => section.slotId === slotId && section.kind === 'grouped-list'
        ? {
            ...section,
            groups: mergeById(section.groups, toGroups(definition, groups, actionIds, slotId), (group) => group.id)
        }
        : section);
}
function upsertTimelineItems(definition, sections, slotId, items) {
    return mapSections(sections, (section) => section.slotId === slotId && section.kind === 'timeline'
        ? {
            ...section,
            items: mergeById(section.items, toTimelineItems(definition, items, [], slotId), (item) => item.id ?? item.title)
        }
        : section);
}
function setDetailSection(definition, sections, slotId, detail) {
    const actionIds = slotId === 'result-detail' ? ['save-place', 'switch-to-event-planner'] : [];
    return mapSections(sections, (section) => section.slotId === slotId && section.kind === 'detail-panel'
        ? createDetailPanelSection(definition, slotId, section.title, detail, actionIds)
        : section);
}
function upsertBoardCards(definition, sections, slotId, columnId, cards) {
    return mapSections(sections, (section) => {
        if (section.slotId !== slotId || section.kind !== 'kanban') {
            return section;
        }
        const actionIds = [];
        return {
            ...section,
            columns: section.columns.map((column) => (column.id ?? column.label) !== columnId
                ? column
                : {
                    ...column,
                    cards: mergeById(column.cards, toBoardColumns(definition, [{ id: columnId, label: column.label, tone: column.tone, cards }], actionIds, slotId)[0]?.cards ?? [], (card) => card.id ?? card.title)
                })
        };
    });
}
function moveBoardCard(sections, slotId, cardId, targetColumnId, position) {
    return mapSections(sections, (section) => {
        if (section.slotId !== slotId || section.kind !== 'kanban') {
            return section;
        }
        let movedCard = null;
        const nextColumns = section.columns.map((column) => ({
            ...column,
            cards: column.cards.filter((card) => {
                const matches = (card.id ?? card.title) === cardId;
                if (matches) {
                    movedCard = card;
                }
                return !matches;
            })
        }));
        if (!movedCard) {
            return section;
        }
        const destinationIndex = nextColumns.findIndex((column) => (column.id ?? column.label) === targetColumnId);
        if (destinationIndex < 0) {
            return section;
        }
        const targetCards = [...nextColumns[destinationIndex].cards];
        if (typeof position === 'number' && position >= 0 && position <= targetCards.length) {
            targetCards.splice(position, 0, movedCard);
        }
        else {
            targetCards.push(movedCard);
        }
        nextColumns[destinationIndex] = {
            ...nextColumns[destinationIndex],
            cards: targetCards
        };
        return {
            ...section,
            columns: nextColumns
        };
    });
}
function removeItemsFromSections(sections, slotId, itemIds) {
    const itemIdSet = new Set(itemIds);
    return mapSections(sections, (section) => {
        if (section.slotId !== slotId) {
            return section;
        }
        switch (section.kind) {
            case 'comparison-table':
                return {
                    ...section,
                    rows: section.rows.filter((row) => !itemIdSet.has(row.id))
                };
            case 'card-grid':
                return {
                    ...section,
                    cards: section.cards.filter((card) => !itemIdSet.has(card.id ?? card.title))
                };
            case 'grouped-list':
                return {
                    ...section,
                    groups: section.groups.map((group) => ({
                        ...group,
                        items: group.items.filter((item) => !itemIdSet.has(item.id ?? item.title))
                    }))
                };
            case 'timeline':
                return {
                    ...section,
                    items: section.items.filter((item) => !itemIdSet.has(item.id ?? item.title))
                };
            case 'kanban':
                return {
                    ...section,
                    columns: section.columns.map((column) => ({
                        ...column,
                        cards: column.cards.filter((card) => !itemIdSet.has(card.id ?? card.title))
                    }))
                };
            default:
                return section;
        }
    });
}
function setStatusLabel(sections, statusLabel, previousStatusLabel) {
    void statusLabel;
    void previousStatusLabel;
    return sections;
}
export function applyRecipeTemplateUpdate(input) {
    const validation = validateRecipeTemplateUpdate(input.update, input.currentState);
    if (!validation.definition || validation.errors.length > 0) {
        return {
            state: null,
            definition: validation.definition,
            errors: validation.errors
        };
    }
    const nextState = cloneState(input.currentState);
    for (const operation of input.update.operations) {
        switch (operation.op) {
            case 'set_header':
                nextState.title = operation.title ?? nextState.title;
                nextState.subtitle = operation.subtitle ?? nextState.subtitle;
                nextState.summary = operation.summary ?? nextState.summary;
                break;
            case 'set_active_tab':
                nextState.sections = setActiveTab(nextState.sections, operation.slotId, operation.tabId);
                break;
            case 'append_note_lines':
                nextState.sections = appendNoteLines(nextState.sections, operation.slotId, operation.lines);
                break;
            case 'set_filter_chips':
                nextState.sections = mapSections(nextState.sections, (section) => section.slotId === operation.slotId && section.kind === 'filter-strip'
                    ? {
                        ...section,
                        filters: operation.filters,
                        sortLabel: operation.sortLabel ?? section.sortLabel
                    }
                    : section);
                break;
            case 'set_scope_tags':
                nextState.sections = mapSections(nextState.sections, (section) => section.slotId === operation.slotId && section.kind === 'comparison-table'
                    ? {
                        ...section,
                        footerChips: operation.chips
                    }
                    : section);
                break;
            case 'upsert_table_rows':
                nextState.sections = upsertTableRows(validation.definition, nextState.sections, operation.slotId, operation.rows);
                break;
            case 'upsert_cards':
                nextState.sections = upsertCards(validation.definition, nextState.sections, operation.slotId, operation.cards);
                break;
            case 'upsert_groups':
                nextState.sections = upsertGroups(validation.definition, nextState.sections, operation.slotId, operation.groups);
                break;
            case 'upsert_timeline_items':
                nextState.sections = upsertTimelineItems(validation.definition, nextState.sections, operation.slotId, operation.items);
                break;
            case 'set_detail':
                nextState.sections = setDetailSection(validation.definition, nextState.sections, operation.slotId, operation.detail);
                break;
            case 'upsert_board_cards':
                nextState.sections = upsertBoardCards(validation.definition, nextState.sections, operation.slotId, operation.columnId, operation.cards);
                break;
            case 'move_board_card':
                nextState.sections = moveBoardCard(nextState.sections, operation.slotId, operation.cardId, operation.targetColumnId, operation.position);
                break;
            case 'remove_items':
                nextState.sections = removeItemsFromSections(nextState.sections, operation.slotId, operation.itemIds);
                break;
            case 'set_status': {
                const previousStatusLabel = typeof nextState.metadata.statusLabel === 'string' ? nextState.metadata.statusLabel : undefined;
                nextState.metadata = {
                    ...nextState.metadata,
                    statusLabel: operation.statusLabel
                };
                nextState.sections = setStatusLabel(nextState.sections, operation.statusLabel, previousStatusLabel);
                break;
            }
            default:
                break;
        }
    }
    const errors = [];
    validateTemplateSections(validation.definition, nextState.sections, errors);
    if (errors.length > 0) {
        return {
            state: null,
            definition: validation.definition,
            errors
        };
    }
    return {
        state: RecipeTemplateStateSchema.parse(nextState),
        definition: validation.definition,
        errors: []
    };
}
export function findCardById(sections, itemId) {
    for (const section of sections) {
        if (section.kind === 'card-grid') {
            const card = section.cards.find((item) => (item.id ?? item.title) === itemId);
            if (card) {
                return {
                    title: card.title,
                    subtitle: card.subtitle ?? undefined,
                    footer: card.footer ?? undefined
                };
            }
        }
        if (section.kind === 'kanban') {
            for (const column of section.columns) {
                const card = column.cards.find((item) => (item.id ?? item.title) === itemId);
                if (card) {
                    return {
                        title: card.title,
                        subtitle: card.subtitle ?? undefined,
                        footer: card.footer ?? undefined
                    };
                }
            }
        }
        if (section.kind === 'grouped-list') {
            for (const group of section.groups) {
                const item = group.items.find((entry) => (entry.id ?? entry.title) === itemId);
                if (item) {
                    return {
                        title: item.title,
                        subtitle: item.subtitle ?? undefined,
                        footer: item.meta ?? undefined
                    };
                }
            }
        }
        if (section.kind === 'detail-panel' && (section.title === itemId || section.slotId === itemId)) {
            return {
                title: section.title,
                subtitle: section.summary ?? undefined,
                footer: section.note ?? undefined
            };
        }
        if (section.kind === 'split') {
            const nested = findCardById([...section.left, ...section.right], itemId);
            if (nested) {
                return nested;
            }
        }
        if (section.kind === 'tabs') {
            const nested = findCardById(Object.values(section.panes).flat(), itemId);
            if (nested) {
                return nested;
            }
        }
    }
    return null;
}
function findDetailBySlotId(sections, slotId) {
    const section = findSectionBySlotId(sections, slotId);
    if (!section || section.kind !== 'detail-panel') {
        return null;
    }
    return {
        title: section.title,
        subtitle: section.summary ?? undefined,
        footer: section.note ?? undefined
    };
}
function collectNoteLines(sections) {
    const notesSection = findSectionBySlotId(sections, 'notes');
    return notesSection && notesSection.kind === 'notes' ? notesSection.lines : [];
}
export function migrateRecipeTemplateFill(input) {
    if (input.currentState.templateId !== 'local-discovery-comparison' || input.fill.templateId !== 'event-planner') {
        return input.fill;
    }
    const carriedPlace = findDetailBySlotId(input.currentState.sections, 'result-detail') ??
        findCardById(input.currentState.sections, 'migrated-selected-venue') ??
        findCardById(input.currentState.sections, 'selected-place');
    if (!carriedPlace) {
        return input.fill;
    }
    const eventFill = input.fill.templateId === 'event-planner' ? input.fill : null;
    if (!eventFill) {
        return input.fill;
    }
    const eventData = eventFill.data;
    return RecipeTemplateFillSchema.parse({
        ...eventFill,
        data: {
            ...eventData,
            venueCards: [
                {
                    id: 'migrated-selected-venue',
                    title: carriedPlace.title,
                    subtitle: carriedPlace.subtitle,
                    footer: carriedPlace.footer ?? 'Imported from Local Discovery Comparison.',
                    chips: [
                        {
                            label: 'Imported',
                            tone: 'accent'
                        },
                        {
                            label: 'Selected venue',
                            tone: 'success'
                        }
                    ],
                    bullets: ['Carry this venue forward into guest planning and itinerary decisions.'],
                    links: []
                },
                ...eventData.venueCards.filter((card) => (card.id ?? card.title) !== 'migrated-selected-venue')
            ],
            noteLines: [
                `Imported venue: ${carriedPlace.title}`,
                ...collectNoteLines(input.currentState.sections),
                ...eventData.noteLines
            ]
        },
        metadata: {
            ...eventFill.metadata,
            migratedFromTemplateId: input.currentState.templateId
        }
    });
}
export function createRecipeTemplateActionSpec(state, definition) {
    const usedActionIds = [...collectActionIdsFromSections(state.sections)].filter((actionId) => definition.actions[actionId]);
    return RecipeActionSpecSchema.parse({
        kind: 'action_spec',
        schemaVersion: 'recipe_action_spec/v1',
        actions: usedActionIds.map((actionId) => definition.actions[actionId])
    });
}
