import { z } from 'zod';
import { RecipeAssistantContextSchema, RecipeIntentCategorySchema, RecipeIntentPresentationSchema, RecipeNormalizedDataSchema, RecipeRawDataSchema, RecipeStatusSchema } from '@hermes-recipes/protocol';
import { extractRecoverableJsonObject } from './structured-json-recovery';
export const HermesRecipeTargetSchema = z
    .object({
    recipeId: z.string().min(1).optional(),
    title: z.string().min(1),
    subtitle: z.string().min(1).optional(),
    description: z.string().max(500).optional(),
    status: RecipeStatusSchema.default('active'),
    preferredPresentation: RecipeIntentPresentationSchema.optional()
})
    .strict();
export const HermesRecipeIntentHintsSchema = z
    .object({
    category: RecipeIntentCategorySchema.optional(),
    label: z.string().min(1).optional(),
    summary: z.string().min(1).optional(),
    preferredPresentation: RecipeIntentPresentationSchema.optional(),
    allowOutboundRequests: z.boolean().optional(),
    destructiveIntent: z.boolean().optional()
})
    .strict();
export const HermesRecipeSemanticHintsSchema = z
    .object({
    primaryDatasetLabel: z.string().min(1).optional(),
    primaryDatasetPath: z.string().min(1).optional(),
    groupingKeys: z.array(z.string().min(1)).default([]),
    preferredTimeField: z.string().min(1).optional(),
    notes: z.array(z.string().min(1)).default([])
})
    .strict();
export const HermesRecipeActionHintsSchema = z
    .object({
    allowRefresh: z.boolean().optional(),
    suggestedActionLabels: z.array(z.string().min(1)).default([])
})
    .strict();
const HermesRecipeSeedBaseSchema = z
    .object({
    schemaVersion: z.enum(['hermes_space_seed/v1', 'hermes_space_data/v1']),
    recipe: HermesRecipeTargetSchema,
    rawData: RecipeRawDataSchema,
    assistantContext: RecipeAssistantContextSchema
})
    .passthrough();
const spaceDataFenceOpenPattern = /```hermes-recipe-data[^\n]*\n?/iu;
const jsonStartPattern = /[[{]/u;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function formatOptionalExtensionError(detail) {
    return detail.replace(/\n+/gu, ' ').trim();
}
// Hermes sometimes emits links as plain URL strings instead of {label, url, kind} objects.
// Coerce them before schema validation so the first parse attempt succeeds.
function coerceLinksToObjects(links) {
    if (!Array.isArray(links)) {
        return links;
    }
    return links.map((item) => {
        if (typeof item === 'string' && item.trim().length > 0) {
            const url = item.trim();
            let label = url;
            try {
                label = new URL(url).hostname || url;
            }
            catch {
                // not a parseable URL — use the raw string
            }
            return { url, label, kind: 'other' };
        }
        return item;
    });
}
function normalizeLinksInEnvelopeRecord(rawValue) {
    if (!isRecord(rawValue)) {
        return rawValue;
    }
    const result = { ...rawValue };
    if (isRecord(result.rawData)) {
        result.rawData = { ...result.rawData, links: coerceLinksToObjects(result.rawData.links) };
    }
    if (isRecord(result.assistantContext)) {
        result.assistantContext = { ...result.assistantContext, links: coerceLinksToObjects(result.assistantContext.links) };
    }
    return result;
}
function parseHermesRecipeEnvelopeObject(rawValue) {
    const warnings = [];
    const diagnostics = [];
    const extensionDiagnostics = [];
    const normalizedValue = normalizeLinksInEnvelopeRecord(rawValue);
    let baseEnvelope;
    try {
        baseEnvelope = HermesRecipeSeedBaseSchema.parse(normalizedValue);
    }
    catch (error) {
        return {
            envelope: null,
            warnings,
            diagnostics,
            extensionDiagnostics,
            schemaError: error instanceof Error ? error.message : 'Invalid Hermes recipe-data payload.'
        };
    }
    const rawRecord = isRecord(rawValue) ? rawValue : {};
    const rawExtensions = isRecord(rawRecord.extensions) ? rawRecord.extensions : {};
    const envelope = {
        schemaVersion: 'hermes_space_seed/v1',
        legacySchemaVersion: baseEnvelope.schemaVersion === 'hermes_space_data/v1' ? 'hermes_space_data/v1' : undefined,
        recipe: baseEnvelope.recipe,
        rawData: baseEnvelope.rawData,
        assistantContext: baseEnvelope.assistantContext,
        optionalExtensions: {},
        extensionDiagnostics
    };
    const parseOptional = (extension, value, schema, apply) => {
        if (value === undefined) {
            return;
        }
        const parsed = schema.safeParse(value);
        if (parsed.success) {
            apply(parsed.data);
            return;
        }
        const detail = formatOptionalExtensionError(parsed.error.message);
        warnings.push(`Dropped invalid optional ${extension} extension.`);
        diagnostics.push({
            code: 'RECIPE_DATA_OPTIONAL_EXTENSION_DROPPED',
            severity: 'warning',
            detail: `Dropped optional ${extension} extension: ${detail}`
        });
        extensionDiagnostics.push({
            extension,
            detail
        });
    };
    parseOptional('intentHints', rawRecord.intentHints, HermesRecipeIntentHintsSchema, (parsed) => {
        envelope.intentHints = parsed;
    });
    parseOptional('semanticHints', rawRecord.semanticHints, HermesRecipeSemanticHintsSchema, (parsed) => {
        envelope.semanticHints = parsed;
    });
    parseOptional('actionHints', rawRecord.actionHints, HermesRecipeActionHintsSchema, (parsed) => {
        envelope.actionHints = parsed;
    });
    parseOptional('normalizedData', rawRecord.normalizedData ?? rawExtensions.normalizedData, RecipeNormalizedDataSchema, (parsed) => {
        envelope.optionalExtensions.normalizedData = parsed;
    });
    return {
        envelope,
        warnings,
        diagnostics,
        extensionDiagnostics,
        schemaError: null
    };
}
export function extractBalancedJsonValue(text) {
    const startIndex = text.search(/[[{]/u);
    if (startIndex < 0) {
        return null;
    }
    const stack = [];
    let inString = false;
    let escaped = false;
    for (let index = startIndex; index < text.length; index += 1) {
        const character = text[index];
        if (!character) {
            continue;
        }
        if (escaped) {
            escaped = false;
            continue;
        }
        if (character === '\\') {
            escaped = true;
            continue;
        }
        if (character === '"') {
            inString = !inString;
            continue;
        }
        if (inString) {
            continue;
        }
        if (character === '{' || character === '[') {
            stack.push(character);
            continue;
        }
        if (character === '}' || character === ']') {
            const expected = character === '}' ? '{' : '[';
            if (stack.at(-1) !== expected) {
                return null;
            }
            stack.pop();
            if (stack.length === 0) {
                return {
                    jsonText: text.slice(startIndex, index + 1),
                    startIndex,
                    endIndex: index + 1,
                    leadingText: text.slice(0, startIndex).trim(),
                    trailingText: text.slice(index + 1).trim()
                };
            }
        }
    }
    return null;
}
function stripTextRange(markdown, range) {
    if (!range || range.end <= range.start) {
        return markdown.trim();
    }
    return `${markdown.slice(0, range.start)}${markdown.slice(range.end)}`
        .replace(/\n{3,}/gu, '\n\n')
        .trim();
}
function buildExtractionResult(markdown, rangeToStrip, options = {}) {
    return {
        cleanedMarkdown: stripTextRange(markdown, rangeToStrip),
        envelope: options.envelope ?? null,
        warnings: options.warnings ?? [],
        errors: options.errors ?? [],
        diagnostics: options.diagnostics ?? [],
        mode: options.mode ?? 'compat',
        failureKind: options.failureKind ?? null,
        foundFence: options.foundFence ?? false,
        missingClosingFence: options.missingClosingFence ?? false,
        recovered: options.recovered ?? false,
        strategy: options.strategy ?? null,
        parserDiagnostics: options.parserDiagnostics ?? {
            responseBeginsWithJson: false,
            containsJsonStart: false,
            balancedJsonFound: false,
            leadingProse: false,
            trailingProse: false,
            jsonParseAttempted: false,
            jsonParseSucceeded: false,
            changedPayload: false,
            recoveryAttempted: false,
            recoverySucceeded: false,
            recoveryStrategiesAttempted: [],
            recoveryStrategiesSucceeded: [],
            recoveryStrategiesFailed: [],
            foundStartMarker: false,
            foundClosingFence: false,
            schemaValidationAttempted: false,
            schemaValidationSucceeded: false
        }
    };
}
function parseHermesRecipeDataPayload(payloadText, options) {
    const trimmed = payloadText.trim();
    const warnings = [];
    const errors = [];
    const diagnostics = [];
    let failureKind = null;
    const extractedJson = extractRecoverableJsonObject(trimmed, {
        requireObject: true
    });
    const parserDiagnostics = {
        ...extractedJson.diagnostics,
        foundStartMarker: options.mode === 'compat',
        foundClosingFence: !options.missingClosingFence,
        schemaValidationAttempted: false,
        schemaValidationSucceeded: false
    };
    const addMissingFenceUnrecoverableDiagnostic = (detail) => {
        diagnostics.push({
            code: 'RECIPE_DATA_BLOCK_MISSING_FENCE_UNRECOVERABLE',
            severity: 'warning',
            detail
        });
    };
    const fail = (code, detail, nextFailureKind) => {
        failureKind = nextFailureKind;
        errors.push(detail);
        diagnostics.push({
            code,
            severity: 'warning',
            detail
        });
        if (options.missingClosingFence && nextFailureKind !== 'schema_invalid') {
            addMissingFenceUnrecoverableDiagnostic(detail);
        }
        return {
            envelope: null,
            warnings,
            errors,
            diagnostics,
            recovered: false,
            failureKind,
            parserDiagnostics
        };
    };
    if (!trimmed) {
        return fail('RECIPE_DATA_BLOCK_EMPTY', 'The Hermes recipe-data block was empty.', 'empty_payload');
    }
    const addMissingFenceRecoveryDiagnostic = () => {
        const detail = 'Recovered a Hermes recipe-data block that was missing the closing fence.';
        warnings.push(detail);
        diagnostics.push({
            code: 'RECIPE_DATA_BLOCK_MISSING_FENCE_RECOVERED',
            severity: 'warning',
            detail
        });
    };
    const addIgnoredProseDiagnostic = () => {
        const detail = 'Ignored non-JSON prose inside the Hermes recipe-data block.';
        warnings.push(detail);
        diagnostics.push({
            code: 'RECIPE_DATA_BLOCK_PROSE_IGNORED',
            severity: 'info',
            detail
        });
    };
    if (extractedJson.rawValue === null || !extractedJson.jsonText) {
        const nextFailureKind = extractedJson.failureKind === 'empty_payload'
            ? 'empty_payload'
            : extractedJson.failureKind === 'json_unbalanced'
                ? 'json_unbalanced'
                : extractedJson.failureKind === 'json_invalid'
                    ? 'json_invalid'
                    : extractedJson.failureKind === 'json_root_not_object'
                        ? 'schema_invalid'
                        : 'json_missing';
        const detail = extractedJson.errors[0] ??
            (nextFailureKind === 'json_unbalanced'
                ? options.missingClosingFence
                    ? 'The Hermes recipe-data block did not close properly and no balanced JSON payload could be recovered.'
                    : 'The Hermes recipe-data block did not contain a balanced JSON payload.'
                : nextFailureKind === 'json_invalid'
                    ? 'The Hermes recipe-data block did not contain valid JSON.'
                    : 'The Hermes recipe-data block did not contain a JSON payload.');
        return fail(nextFailureKind === 'json_unbalanced'
            ? 'RECIPE_DATA_BLOCK_JSON_UNBALANCED'
            : nextFailureKind === 'json_invalid'
                ? 'RECIPE_DATA_BLOCK_JSON_INVALID'
                : nextFailureKind === 'schema_invalid'
                    ? 'RECIPE_DATA_BLOCK_SCHEMA_INVALID'
                    : 'RECIPE_DATA_BLOCK_JSON_MISSING', detail, nextFailureKind);
    }
    try {
        parserDiagnostics.schemaValidationAttempted = true;
        const parsedEnvelope = parseHermesRecipeEnvelopeObject(extractedJson.rawValue);
        if (!parsedEnvelope.envelope) {
            return fail('RECIPE_DATA_BLOCK_SCHEMA_INVALID', parsedEnvelope.schemaError ?? 'Invalid Hermes recipe-data block.', 'schema_invalid');
        }
        parserDiagnostics.schemaValidationSucceeded = true;
        if (options.missingClosingFence) {
            addMissingFenceRecoveryDiagnostic();
        }
        if (extractedJson.leadingText || extractedJson.trailingText) {
            addIgnoredProseDiagnostic();
        }
        if (extractedJson.diagnostics.recoveryStrategiesSucceeded.includes('complete_trailing_delimiters')) {
            const detail = 'Recovered missing trailing JSON closing delimiters by deterministic balance completion.';
            warnings.push(detail);
            diagnostics.push({
                code: 'RECIPE_DATA_BLOCK_JSON_DELIMITER_COMPLETED',
                severity: 'warning',
                detail
            });
        }
        return {
            envelope: parsedEnvelope.envelope,
            warnings: [...warnings, ...parsedEnvelope.warnings],
            errors,
            diagnostics: [...diagnostics, ...parsedEnvelope.diagnostics],
            recovered: options.missingClosingFence ||
                extractedJson.recovered ||
                parsedEnvelope.diagnostics.length > 0,
            failureKind,
            parserDiagnostics
        };
    }
    catch (extractedError) {
        if (extractedError instanceof SyntaxError) {
            return fail('RECIPE_DATA_BLOCK_JSON_INVALID', extractedError.message, 'json_invalid');
        }
        const detail = extractedError instanceof Error ? extractedError.message : 'Invalid Hermes recipe-data block.';
        return fail('RECIPE_DATA_BLOCK_SCHEMA_INVALID', detail, 'schema_invalid');
    }
}
export function extractHermesRecipeDataEnvelope(markdown, options = {}) {
    const mode = options.mode ?? 'compat';
    if (mode === 'structured_only') {
        const trimmed = markdown.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            const parsedPayload = parseHermesRecipeDataPayload(trimmed, {
                missingClosingFence: false,
                mode: 'structured_only'
            });
            return buildExtractionResult(markdown, {
                start: 0,
                end: markdown.length
            }, {
                ...parsedPayload,
                mode,
                strategy: 'direct_json',
                parserDiagnostics: {
                    ...parsedPayload.parserDiagnostics,
                    foundStartMarker: false,
                    foundClosingFence: false
                }
            });
        }
        const markerMatch = spaceDataFenceOpenPattern.exec(markdown);
        if (markerMatch && markerMatch.index !== undefined) {
            const blockStart = markerMatch.index;
            const payloadStart = blockStart + markerMatch[0].length;
            const closingFenceIndex = markdown.indexOf('```', payloadStart);
            if (closingFenceIndex < payloadStart) {
                const parsedPayload = parseHermesRecipeDataPayload(markdown.slice(payloadStart), {
                    missingClosingFence: true,
                    mode
                });
                return buildExtractionResult(markdown, {
                    start: blockStart,
                    end: markdown.length
                }, {
                    ...parsedPayload,
                    mode,
                    foundFence: true,
                    missingClosingFence: true,
                    strategy: 'start_marker',
                    parserDiagnostics: {
                        ...parsedPayload.parserDiagnostics,
                        foundStartMarker: true,
                        foundClosingFence: false
                    }
                });
            }
            const parsedPayload = parseHermesRecipeDataPayload(markdown.slice(payloadStart, closingFenceIndex), {
                missingClosingFence: false,
                mode
            });
            return buildExtractionResult(markdown, {
                start: blockStart,
                end: closingFenceIndex + 3
            }, {
                ...parsedPayload,
                mode,
                foundFence: true,
                missingClosingFence: false,
                strategy: 'start_marker',
                parserDiagnostics: {
                    ...parsedPayload.parserDiagnostics,
                    foundStartMarker: true,
                    foundClosingFence: true
                }
            });
        }
        if (!trimmed) {
            const parsedPayload = parseHermesRecipeDataPayload('', {
                missingClosingFence: false,
                mode: 'structured_only'
            });
            return buildExtractionResult(markdown, null, {
                ...parsedPayload,
                mode,
                parserDiagnostics: {
                    ...parsedPayload.parserDiagnostics,
                    foundStartMarker: false,
                    foundClosingFence: false
                }
            });
        }
        if (trimmed.search(jsonStartPattern) >= 0) {
            const parsedPayload = parseHermesRecipeDataPayload(trimmed, {
                missingClosingFence: false,
                mode: 'compat'
            });
            return buildExtractionResult(markdown, {
                start: 0,
                end: markdown.length
            }, {
                ...parsedPayload,
                mode,
                strategy: 'direct_json',
                parserDiagnostics: {
                    ...parsedPayload.parserDiagnostics,
                    foundStartMarker: false,
                    foundClosingFence: false
                }
            });
        }
        return buildExtractionResult(markdown, null, {
            mode,
            failureKind: 'missing_marker',
            errors: ['The structured-only response did not contain a JSON artifact or Hermes recipe-data start marker.'],
            diagnostics: [
                {
                    code: 'RECIPE_DATA_BLOCK_PARSE_FAILED',
                    severity: 'warning',
                    detail: 'The structured-only response did not contain a JSON artifact or Hermes recipe-data start marker.'
                }
            ],
            parserDiagnostics: {
                responseBeginsWithJson: trimmed.startsWith('{') || trimmed.startsWith('['),
                containsJsonStart: trimmed.search(jsonStartPattern) >= 0,
                balancedJsonFound: false,
                leadingProse: false,
                trailingProse: false,
                jsonParseAttempted: false,
                jsonParseSucceeded: false,
                changedPayload: false,
                recoveryAttempted: false,
                recoverySucceeded: false,
                recoveryStrategiesAttempted: [],
                recoveryStrategiesSucceeded: [],
                recoveryStrategiesFailed: [],
                foundStartMarker: false,
                foundClosingFence: false,
                schemaValidationAttempted: false,
                schemaValidationSucceeded: false
            }
        });
    }
    const match = spaceDataFenceOpenPattern.exec(markdown);
    if (!match || match.index === undefined) {
        return buildExtractionResult(markdown, null, {
            mode,
            failureKind: 'missing_marker'
        });
    }
    const blockStart = match.index;
    const payloadStart = blockStart + match[0].length;
    const closingFenceIndex = markdown.indexOf('```', payloadStart);
    if (closingFenceIndex < payloadStart) {
        const parsedPayload = parseHermesRecipeDataPayload(markdown.slice(payloadStart), {
            missingClosingFence: true,
            mode
        });
        return buildExtractionResult(markdown, {
            start: blockStart,
            end: markdown.length
        }, {
            ...parsedPayload,
            mode,
            foundFence: true,
            missingClosingFence: true,
            strategy: 'start_marker',
            parserDiagnostics: {
                ...parsedPayload.parserDiagnostics,
                foundStartMarker: true,
                foundClosingFence: false
            }
        });
    }
    const parsedPayload = parseHermesRecipeDataPayload(markdown.slice(payloadStart, closingFenceIndex), {
        missingClosingFence: false,
        mode
    });
    return buildExtractionResult(markdown, {
        start: blockStart,
        end: closingFenceIndex + 3
    }, {
        ...parsedPayload,
        mode,
        foundFence: true,
        missingClosingFence: false,
        strategy: 'start_marker',
        parserDiagnostics: {
            ...parsedPayload.parserDiagnostics,
            foundStartMarker: true,
            foundClosingFence: true
        }
    });
}
