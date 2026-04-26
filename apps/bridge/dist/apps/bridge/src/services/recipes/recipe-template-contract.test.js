// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { RecipeTemplateFillSchema } from '@hermes-recipes/protocol';
import { compileRecipeTemplatePreviewState, compileRecipeTemplateState, createRecipeTemplateGhostState, createRecipeTemplateTextPacket, createRecipeTemplateHydrationPacket, normalizeRecipeTemplateFill, validateRecipeTemplateSemanticCompleteness } from './recipe-template-contract';
import { WORKRECIPE_TEMPLATE_RUNTIME_REGISTRY } from './recipe-template-registry';
function createResearchNotebookFill(options = {}) {
    const sourcesCount = options.sources ?? 0;
    return RecipeTemplateFillSchema.parse({
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2',
        templateId: 'research-notebook',
        title: 'TOP HERO TITLE SHOULD NOT RENDER',
        subtitle: 'Research planning',
        summary: 'TOP HERO SUMMARY SHOULD NOT RENDER',
        data: {
            eyebrow: 'Research plan',
            heroChips: [],
            activeTabId: 'sources',
            sources: sourcesCount > 0
                ? [
                    {
                        id: 'sources',
                        label: 'Key sources',
                        tone: 'accent',
                        items: Array.from({ length: sourcesCount }).map((_, index) => ({
                            id: `source-${index + 1}`,
                            title: `Source ${index + 1}`,
                            subtitle: 'Important source',
                            meta: 'Needs review',
                            chips: [],
                            bullets: [],
                            links: []
                        }))
                    }
                ]
                : [],
            noteLines: [],
            extractedPoints: [],
            followUps: []
        },
        metadata: {
            fixture: true
        }
    });
}
function createPriceComparisonFill(rowCount) {
    return RecipeTemplateFillSchema.parse({
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2',
        templateId: 'price-comparison-grid',
        title: 'Price comparison',
        subtitle: 'Merchant compare',
        summary: 'Compare the same product across stores.',
        data: {
            eyebrow: 'Shopping',
            heroChips: [],
            scopeTags: [],
            columns: [
                { id: 'merchant', label: 'Merchant', align: 'start' },
                { id: 'price', label: 'Price', align: 'end' }
            ],
            rows: Array.from({ length: rowCount }).map((_, index) => ({
                id: `row-${index + 1}`,
                label: `Offer ${index + 1}`,
                cells: [
                    { value: `Store ${index + 1}` },
                    { value: `$${199 + index}`, emphasis: true }
                ],
                links: []
            })),
            noteLines: []
        },
        metadata: {
            fixture: true
        }
    });
}
function createVendorEvaluationNearMissRawValue() {
    return {
        title: 'CRM comparison matrix',
        description: 'Compare CRM platforms for a 10-person SaaS sales team.',
        data: {
            data: {
                eyebrow: 'Procurement',
                scopeTags: ['10 sellers', 'SaaS'],
                columnLabels: ['Pricing', 'Automation', 'Best fit'],
                comparisonRows: [
                    {
                        vendor: 'HubSpot',
                        pricing: '$$$',
                        automation: 'Strong workflows',
                        bestFit: 'Fast-moving SMB team'
                    },
                    {
                        vendor: 'Pipedrive',
                        pricing: '$$',
                        automation: 'Lean automation',
                        bestFit: 'Lower-complexity sales motion'
                    }
                ],
                note: 'Use the matrix to compare vendor tradeoffs quickly.',
                notes: ['Check onboarding effort before final approval.']
            }
        }
    };
}
describe('recipe template semantic completeness', () => {
    it('normalizes vendor evaluation near-miss aliases into the canonical schema', () => {
        const result = normalizeRecipeTemplateFill({
            templateId: 'vendor-evaluation-matrix',
            rawValue: createVendorEvaluationNearMissRawValue(),
            assistantSummary: 'Compare CRM platforms.'
        });
        expect(result.errors).toEqual([]);
        expect(result.fill?.templateId).toBe('vendor-evaluation-matrix');
        const fill = result.fill;
        if (!fill || fill.templateId !== 'vendor-evaluation-matrix') {
            throw new Error('Expected a normalized vendor-evaluation-matrix fill.');
        }
        expect(fill.data.columns.map((column) => column.label)).toEqual(['Pricing', 'Automation', 'Best fit']);
        expect(fill.data.rows).toHaveLength(2);
        expect(fill.data.rows[0]).toMatchObject({
            label: 'HubSpot'
        });
        expect(fill.data.rows[0]?.cells.map((cell) => cell.value)).toEqual([
            '$$$',
            'Strong workflows',
            'Fast-moving SMB team'
        ]);
        expect(fill.data.footerChips.map((chip) => chip.label)).toEqual(['10 sellers', 'SaaS']);
        expect(fill.data.footnote).toBe('Use the matrix to compare vendor tradeoffs quickly.');
        expect(fill.data.noteLines).toEqual(['Check onboarding effort before final approval.']);
        const repairAudit = [...result.repairs.aliasMappings, ...result.repairs.normalizedValues].join(' | ');
        expect(repairAudit).toContain('columnLabels');
        expect(repairAudit).toContain('comparisonRows');
        expect(repairAudit).toContain('note');
        expect(repairAudit).toContain('notes');
    });
    it('fails loudly when a vendor matrix payload cannot be deterministically normalized', () => {
        const result = normalizeRecipeTemplateFill({
            templateId: 'vendor-evaluation-matrix',
            rawValue: {
                title: 'Broken CRM comparison',
                summary: 'Missing canonical table data.',
                data: {
                    data: [
                        {
                            summary: 'This is not a deterministic matrix row.'
                        }
                    ]
                }
            },
            assistantSummary: 'Compare CRM platforms.'
        });
        expect(result.fill).toBeNull();
        expect(result.errors.length).toBeGreaterThan(0);
    });
    it('rejects an empty research notebook before promotion', () => {
        const result = validateRecipeTemplateSemanticCompleteness(createResearchNotebookFill());
        expect(result.ok).toBe(false);
        expect(result.templateId).toBe('research-notebook');
        expect(result.summary).toBe('Research notebook stayed empty.');
        expect(result.primaryContentCounts).toMatchObject({
            sources: 0,
            noteLines: 0,
            extractedPoints: 0,
            followUps: 0
        });
        expect(result.issues[0]).toContain('Semantic completeness failed');
    });
    it('accepts a minimally populated research notebook', () => {
        const result = validateRecipeTemplateSemanticCompleteness(createResearchNotebookFill({ sources: 1 }));
        expect(result.ok).toBe(true);
        expect(result.summary).toBe('Research notebook populated.');
        expect(result.primaryContentCounts.sources).toBe(1);
    });
    it('rejects an empty comparison template when its primary rows are missing', () => {
        const result = validateRecipeTemplateSemanticCompleteness(createPriceComparisonFill(0));
        expect(result.ok).toBe(false);
        expect(result.templateId).toBe('price-comparison-grid');
        expect(result.primaryContentCounts.rows).toBe(0);
        expect(result.requiredSignals).toEqual(['rows']);
    });
    it('compiles template states without re-emitting a hero section', () => {
        const compiled = compileRecipeTemplateState({
            fill: createResearchNotebookFill({ sources: 1 })
        });
        expect(compiled.errors).toEqual([]);
        expect(compiled.state).not.toBeNull();
        expect(compiled.state?.sections.some((section) => section.kind === 'hero')).toBe(false);
        expect(compiled.state?.sections.some((section) => section.slotId === 'hero')).toBe(false);
    });
    it('creates a ghost template state with pending section hydration markers', () => {
        const preview = createRecipeTemplateGhostState({
            templateId: 'research-notebook',
            updatedAt: '2026-04-14T03:20:00.000Z',
            phase: 'selected'
        });
        expect(preview.errors).toEqual([]);
        expect(preview.state?.status?.phase).toBe('selected');
        expect(preview.state?.sections.every((section) => {
            const progress = section.progress;
            return progress?.hydrationState === 'pending';
        })).toBe(true);
        expect(preview.state?.sections.every((section) => {
            const progress = section.progress;
            return progress?.contentState === 'ghost';
        })).toBe(true);
    });
    it('marks preview sections as repairing when a content-stage repair is running', () => {
        const preview = compileRecipeTemplatePreviewState({
            fill: createResearchNotebookFill({ sources: 1 }),
            phase: 'repairing',
            updatedAt: '2026-04-14T03:21:00.000Z',
            errorMessage: 'Repairing invalid staged content.',
            failureScope: 'content'
        });
        expect(preview.errors).toEqual([]);
        expect(preview.state?.status?.phase).toBe('repairing');
        expect(preview.state?.sections.some((section) => {
            const progress = section.progress;
            return progress?.repairState === 'repairing';
        })).toBe(true);
    });
    it('provides text and hydration contract packets with valid examples for every registered template', () => {
        const templateIds = Object.keys(WORKRECIPE_TEMPLATE_RUNTIME_REGISTRY);
        expect(templateIds.length).toBeGreaterThanOrEqual(14);
        for (const templateId of templateIds) {
            const textPacket = createRecipeTemplateTextPacket(templateId);
            expect(textPacket).not.toBeNull();
            expect(textPacket.contract.outputKind).toBe('recipe_template_text');
            expect(textPacket.validExamples.length).toBeGreaterThanOrEqual(1);
            expect(textPacket.validExamples[0].templateId).toBe(templateId);
            // Ensure no template falls through to the generic "data" only guide
            if (templateId !== 'event-planner') {
                // event-planner has no invalidExamples from its fill guide (uses commonMistakes only)
                expect(textPacket.invalidExamples.length).toBeGreaterThanOrEqual(1);
            }
            expect(textPacket.commonMistakes.length).toBeGreaterThanOrEqual(1);
            const hydrationPacket = createRecipeTemplateHydrationPacket(templateId);
            expect(hydrationPacket).not.toBeNull();
            expect(hydrationPacket.contract.outputKind).toBe('recipe_template_hydration');
            expect(hydrationPacket.validExamples.length).toBeGreaterThanOrEqual(1);
            expect(hydrationPacket.template.allowedDataKeys.length).toBeGreaterThanOrEqual(1);
            // The canonical data keys should not include generic 'data' unless fallback
            if (!['event-planner', 'security-review-board', 'inbox-triage-board'].includes(templateId)) {
                expect(textPacket.template.allowedDataKeys).not.toEqual(['data']);
            }
        }
    });
    it('detects data.data wrappers as invalid through normalization', () => {
        const result = normalizeRecipeTemplateFill({
            templateId: 'vendor-evaluation-matrix',
            rawValue: {
                kind: 'recipe_template_fill',
                schemaVersion: 'recipe_template_fill/v2',
                templateId: 'vendor-evaluation-matrix',
                title: 'CRM evaluation',
                summary: 'Compare vendors.',
                data: {
                    data: {
                        columnLabels: ['Pricing', 'Automation'],
                        comparisonRows: [{ vendor: 'HubSpot' }]
                    }
                }
            }
        });
        // The deterministic normalizer should unwrap data.data and map near-miss aliases
        expect(result.fill).not.toBeNull();
        if (result.fill) {
            expect(result.repairs.aliasMappings.length).toBeGreaterThan(0);
        }
    });
});
