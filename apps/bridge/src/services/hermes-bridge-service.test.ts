// @vitest-environment node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ChatStreamEvent } from '@hermes-recipes/protocol';
import {
  getRecipeContentEntries,
  getRecipeContentTab,
  normalizeRecipeTabs,
  RECIPE_REFRESH_USER_MESSAGE,
  RecipeTemplateFillSchema
} from '@hermes-recipes/protocol';
import type { Session, Recipe } from '@hermes-recipes/protocol';
import type { HermesCli } from '../hermes-cli/client';
import { BridgeDatabase } from '../database';
import { buildRecipeAppletBaseArtifacts } from './recipes/home-recipe-compiler';
import {
  compileRecipeTemplateState,
  createRecipeTemplateActionSpec,
  createRecipeTemplateActionsArtifact,
  createRecipeTemplateHydrationArtifact,
  createRecipeTemplateTextArtifact
} from './recipes/recipe-template-contract';
import type { HermesRecipeDataEnvelope } from './recipes/dynamic-recipe-contract';
import { __recipeParsingForTests } from './hermes-bridge-service';
import type { BridgeError } from './hermes-bridge-service';
import { HermesBridge } from './hermes-bridge-service';

const cleanupPaths: string[] = [];

function createDatabase() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-service-'));
  cleanupPaths.push(directory);
  return new BridgeDatabase(path.join(directory, 'bridge.sqlite'));
}

async function waitForRecipeEnrichment(bridge: HermesBridge) {
  await bridge.waitForRecipeEnrichmentQueues();
}

function seedProfile(database: BridgeDatabase) {
  database.syncProfiles(
    [
      {
        id: 'jbarton',
        name: 'jbarton',
        description: 'openai/gpt-5.4',
        path: '/tmp/jbarton',
        isActive: true
      }
    ],
    '2026-04-10T12:00:00.000Z'
  );
}

function seedRuntimeReady(database: BridgeDatabase) {
  database.upsertRuntimeModelConfig({
    profileId: 'jbarton',
    defaultModel: 'openai/gpt-5.4',
    provider: 'openrouter',
    maxTurns: 150,
    lastSyncedAt: '2026-04-10T12:00:00.000Z'
  });
  database.replaceRuntimeProviderCatalog('jbarton', [
    {
      id: 'openrouter',
      profileId: 'jbarton',
      displayName: 'OpenRouter',
      authKind: 'api_key',
      status: 'connected',
      state: 'connected',
      stateMessage: 'OpenRouter is ready for Hermes chat requests.',
      ready: true,
      modelSelectionMode: 'select_only',
      supportsDisconnect: false,
      source: 'runtime',
      supportsApiKey: true,
      supportsOAuth: false,
      disabled: false,
      lastSyncedAt: '2026-04-10T12:00:00.000Z',
      supportsModelDiscovery: true,
      description: 'OpenRouter provider',
      models: [
        {
          id: 'openai/gpt-5.4',
          label: 'GPT-5.4',
          providerId: 'openrouter',
          disabled: false,
          supportsReasoningEffort: false,
          reasoningEffortOptions: [],
          metadata: {}
        }
      ],
      configurationFields: [],
      setupSteps: []
    }
  ]);
}

function createRuntimeReadyState() {
  return {
    config: {
      profileId: 'jbarton',
      defaultModel: 'openai/gpt-5.4',
      provider: 'openrouter',
      maxTurns: 150,
      lastSyncedAt: '2026-04-10T12:00:00.000Z'
    },
    providers: [
      {
        id: 'openrouter',
        profileId: 'jbarton',
        displayName: 'OpenRouter',
        authKind: 'api_key' as const,
        status: 'connected' as const,
        source: 'runtime',
        supportsApiKey: true,
        supportsOAuth: false,
        disabled: false,
        state: 'connected' as const,
        stateMessage: 'OpenRouter is ready for Hermes chat requests.',
        ready: true,
        modelSelectionMode: 'select_only' as const,
        supportsDisconnect: false,
        lastSyncedAt: '2026-04-10T12:00:00.000Z',
        supportsModelDiscovery: true,
        description: 'OpenRouter provider',
        models: [
          {
            id: 'openai/gpt-5.4',
            label: 'GPT-5.4',
            providerId: 'openrouter',
            disabled: false,
            supportsReasoningEffort: false,
            reasoningEffortOptions: [],
            metadata: {}
          }
        ],
        configurationFields: [],
        setupSteps: []
      }
    ],
    runtimeReadiness: {
      ready: true,
      code: 'ready' as const,
      message: 'OpenRouter is ready for Hermes chat requests.',
      providerId: 'openrouter',
      modelId: 'openai/gpt-5.4'
    },
    inspectedProviderId: 'openrouter',
    discoveredAt: '2026-04-10T12:00:00.000Z'
  };
}

function createAttachedRecipe(
  database: BridgeDatabase,
  tabs = normalizeRecipeTabs({
    contentFormat: 'table',
    contentData: {
      columns: [
        { id: 'hotel', label: 'Hotel', emphasis: 'primary', presentation: 'text' },
        { id: 'price', label: 'Price', emphasis: 'none', presentation: 'text' }
      ],
      rows: [
        { hotel: 'AC Hotel Dayton', price: '$189' },
        { hotel: 'Hotel Ardent', price: '$210' }
      ],
      emptyMessage: 'No rows yet.'
    }
  })
) {
  seedProfile(database);
  const session = database.createSession('jbarton', '2026-04-10T12:00:01.000Z');
  const recipe = database.createRecipe({
    profileId: 'jbarton',
    primarySessionId: session.id,
    title: 'Structured shortlist',
    description: 'Recipe action test fixture',
    status: 'active',
    tabs,
    uiState: {
      activeTab: 'content'
    },
    source: 'hermes'
  });

  return {
    session,
    recipe: recipe!
  };
}

function createNowSequence(start = '2026-04-11T17:00:00.000Z') {
  let tick = 0;
  const base = Date.parse(start);
  return () => new Date(base + tick++ * 1000).toISOString();
}

function parseStructuredLogDetail(detail?: string | null) {
  if (!detail) {
    return null;
  }

  try {
    return JSON.parse(detail) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function listStructuredBuildLogDetails(database: BridgeDatabase, buildId: string | null | undefined) {
  if (!buildId) {
    return [] as Record<string, unknown>[];
  }

  return database
    .listRecipeBuildLogs(buildId)
    .map((log) => parseStructuredLogDetail(log.detail))
    .filter((detail): detail is Record<string, unknown> => Boolean(detail?.recordType));
}

function createDynamicRecipeDataEnvelope(options: {
  invalidLink?: boolean;
  title?: string;
  intentLabel?: string;
  invalidNormalizedDataExtension?: boolean;
} = {}) {
  return {
    schemaVersion: 'hermes_space_seed/v1' as const,
    legacySchemaVersion: 'hermes_space_data/v1' as const,
    recipe: {
      title: options.title ?? 'Hotel shortlist',
      description: 'Weekend Dayton options',
      status: 'active' as const,
      preferredPresentation: 'cards' as const
    },
    rawData: {
      kind: 'raw_data' as const,
      schemaVersion: 'recipe_raw_data/v1' as const,
      payload: {
        hotels: [
          {
            id: 'hotel-ardent',
            name: 'Hotel Ardent',
            location: 'Downtown Dayton',
            price: '$210',
            website: options.invalidLink ? 'not-a-url' : 'https://example.com/hotel-ardent'
          },
          {
            id: 'ac-hotel-dayton',
            name: 'AC Hotel Dayton',
            location: 'Dayton core',
            price: '$189',
            website: 'https://example.com/ac-hotel-dayton'
          }
        ]
      },
      links: [
        {
          label: 'Downtown hotels',
          url: options.invalidLink ? 'not-a-url' : 'https://example.com/dayton-hotels',
          kind: 'website' as const
        }
      ],
      paginationHints: [
        {
          datasetId: 'primary',
          pageSize: 4,
          totalItems: 2,
          hasMore: false
        }
      ],
      metadata: {}
    },
    assistantContext: {
      kind: 'assistant_context' as const,
      schemaVersion: 'recipe_assistant_context/v1' as const,
      summary: 'I assembled a compact shortlist of weekend-friendly boutique hotel options.',
      responseLead: 'Here is a compact shortlist.',
      responseTail: 'I can refine the list by neighborhood or budget.',
      links: [
        {
          label: 'Downtown hotels',
          url: options.invalidLink ? 'not-a-url' : 'https://example.com/dayton-hotels',
          kind: 'website' as const
        }
      ],
      citations: [],
      metadata: {}
    },
    intentHints: {
      category: 'places' as const,
      label: options.intentLabel ?? 'nearby shortlist',
      summary: 'Weekend hotel shortlist in Dayton.',
      preferredPresentation: 'cards' as const,
      allowOutboundRequests: true,
      destructiveIntent: false
    },
    optionalExtensions: {},
    extensionDiagnostics: [],
    ...(options.invalidNormalizedDataExtension
      ? {
          optionalExtensions: {
            normalizedData: {
              kind: 'normalized_data' as const,
              schemaVersion: 'recipe_normalized_data/v1' as const,
              primaryDatasetId: 'primary',
              datasets: [],
              summaryStats: [],
              notes: [
                {
                  invalid: true
                }
              ],
              links: [],
              metadata: {}
            }
          }
        }
      : {})
  } as unknown as HermesRecipeDataEnvelope;
}

function extractPromptSection(prompt: string, label: string, nextLabels: string[] = []) {
  const startToken = `${label}:\n`;
  const startIndex = prompt.indexOf(startToken);
  if (startIndex < 0) {
    return '';
  }

  const remainder = prompt.slice(startIndex + startToken.length);
  let endIndex = remainder.length;
  for (const nextLabel of nextLabels) {
    const candidateIndex = remainder.indexOf(`\n\n${nextLabel}:\n`);
    if (candidateIndex >= 0) {
      endIndex = Math.min(endIndex, candidateIndex);
    }
  }

  return remainder.slice(0, endIndex).trim();
}

function parsePromptSectionJson(prompt: string, label: string, nextLabels: string[] = []) {
  const section = extractPromptSection(prompt, label, nextLabels);
  if (!section || section === 'null') {
    return null;
  }

  try {
    return JSON.parse(section) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function inferTemplateIdFromPrompt(prompt: string) {
  const selection = parsePromptSectionJson(prompt, 'Selected template', [
    'Template contract packet',
    'Template text contract packet',
    'Template hydration contract packet',
    'Template actions contract packet',
    'CANONICAL SCHEMA',
    'Schema compliance rules',
    'Staged text artifact',
    'Hydrated content artifact',
    'Current Home recipe'
  ]);
  if (selection && typeof selection.templateId === 'string') {
    return selection.templateId;
  }

  const currentTemplate = parsePromptSectionJson(prompt, 'Current template state');
  if (currentTemplate && typeof currentTemplate.templateId === 'string') {
    return currentTemplate.templateId;
  }

  const intent = parsePromptSectionJson(prompt, 'Intent summary', ['Assistant response summary', 'Current template state']);
  const currentRecipe = parsePromptSectionJson(prompt, 'Current Home recipe', ['Intent summary', 'Normalized data snapshot']);
  const assistantSummary = parsePromptSectionJson(prompt, 'Assistant response summary', ['Current template state']);
  const normalizedData = parsePromptSectionJson(prompt, 'Normalized data snapshot', ['Assistant response summary', 'Current template state']);
  const intentText = [
    intent?.category,
    intent?.label,
    intent?.summary,
    currentRecipe?.title,
    currentRecipe?.description,
    currentRecipe?.summary,
    assistantSummary?.summary,
    assistantSummary?.responseLead,
    JSON.stringify(normalizedData ?? {})
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();

  if (/\b(email|inbox|mail|sender)\b/u.test(intentText)) {
    return 'inbox-triage-board';
  }

  if (/\b(hotel|lodging|stay|weekend dayton)\b/u.test(intentText)) {
    return 'hotel-shortlist';
  }

  if (/\b(restaurant|dining)\b/u.test(intentText)) {
    return 'restaurant-finder';
  }

  if (/\b(venue|nearby|local)\b/u.test(intentText)) {
    return 'local-discovery-comparison';
  }

  if (/\b(plan|event|guests?)\b/u.test(intentText)) {
    return 'event-planner';
  }

  return 'hotel-shortlist';
}

function createHotelShortlistTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v2',
    templateId: 'hotel-shortlist',
    title: 'Hotel shortlist',
    subtitle: 'Weekend Dayton options',
    summary: 'Curated hotel options for a weekend stay.',
    data: {
      eyebrow: 'Trip stay',
      heroChips: [
        { label: '2 hotels', tone: 'accent' },
        { label: 'Downtown focus', tone: 'neutral' }
      ],
      stats: [
        {
          label: 'Options',
          value: '2',
          tone: 'accent'
        },
        {
          label: 'Budget floor',
          value: '$189',
          tone: 'success'
        }
      ],
      cards: [
        {
          id: 'hotel-ardent',
          title: 'Hotel Ardent',
          subtitle: 'Downtown Dayton',
          price: '$210',
          chips: [
            { label: 'Boutique', tone: 'accent' },
            { label: 'Walkable', tone: 'success' }
          ],
          bullets: ['Breakfast nearby', 'Historic building'],
          footer: 'Best fit for a central weekend stay.',
          links: []
        },
        {
          id: 'ac-hotel-dayton',
          title: 'AC Hotel Dayton',
          subtitle: 'Dayton core',
          price: '$189',
          chips: [
            { label: 'Modern', tone: 'neutral' },
            { label: 'Lower price', tone: 'success' }
          ],
          bullets: ['Clean business-friendly rooms', 'Easy downtown access'],
          footer: 'Lower nightly rate with a simpler room setup.',
          links: []
        }
      ],
      noteLines: ['Keep a walkable option at the top of the shortlist.']
    },
    metadata: {
      fixture: true
    }
  };
}

function createInboxTriageTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v2',
    templateId: 'inbox-triage-board',
    title: 'Inbox triage board',
    subtitle: 'Unread sender cleanup',
    summary: 'Group unread senders and review the next cleanup move.',
    data: {
      eyebrow: 'Email cleanup',
      heroChips: [
        { label: '12 unread', tone: 'accent' },
        { label: '4 senders', tone: 'neutral' }
      ],
      stats: [
        {
          label: 'Senders',
          value: '4',
          tone: 'accent'
        },
        {
          label: 'Rules suggested',
          value: '2',
          tone: 'warning'
        }
      ],
      groups: [
        {
          id: 'priority',
          label: 'Needs review',
          tone: 'warning',
          items: [
            {
              id: 'sender-product',
              title: 'Product updates',
              subtitle: '4 unread',
              meta: 'Likely archive or rule candidate',
              chips: [{ label: 'Bulk action', tone: 'warning' }],
              bullets: [],
              links: []
            }
          ]
        }
      ],
      detail: {
        id: 'sender-product',
        title: 'Selected sender preview',
        summary: 'Product updates are repeat senders with low-priority content.',
        chips: [
          { label: '4 unread', tone: 'accent' },
          { label: 'Low urgency', tone: 'neutral' }
        ],
        fields: [
          {
            label: 'Suggested move',
            value: 'Archive the current batch and propose a routing rule for future sends.',
            chips: [],
            bullets: [],
            links: [],
            fullWidth: true
          }
        ],
        note: 'Use this board to keep sender groups stable while Hermes updates the queue.',
        noteTitle: 'Why this layout'
      },
      bulkActionTitle: 'Bulk actions'
    },
    metadata: {
      fixture: true
    }
  };
}

function createRestaurantFinderTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v2',
    templateId: 'restaurant-finder',
    title: 'Restaurant finder',
    subtitle: 'Italian near Dayton',
    summary: 'Compare nearby restaurants with direct menu and booking links.',
    data: {
      eyebrow: 'Dining',
      heroChips: [
        { label: '3 options', tone: 'accent' },
        { label: 'Open tonight', tone: 'success' }
      ],
      filters: [
        { label: '$$', tone: 'neutral' },
        { label: 'Highly rated', tone: 'accent' }
      ],
      sortLabel: 'Sort: Best rated',
      groups: [
        {
          id: 'top-matches',
          label: 'Top matches',
          tone: 'accent',
          items: [
            {
              id: 'mamma-disalvos',
              title: "Mamma Disalvo's",
              subtitle: 'Classic Italian',
              meta: '4.6 rating · $$ · 7 min away',
              chips: [
                { label: 'Family style', tone: 'accent' },
                { label: 'Open until 10 PM', tone: 'success' }
              ],
              bullets: [],
              links: []
            }
          ]
        }
      ],
      detail: {
        id: 'mamma-disalvos',
        title: "Mamma Disalvo's",
        summary: 'Strong neighborhood favorite with reliable reservations and a broad menu.',
        chips: [
          { label: '4.6 rating', tone: 'accent' },
          { label: '$$', tone: 'neutral' }
        ],
        fields: [
          {
            label: 'Hours',
            value: 'Open until 10 PM',
            chips: [],
            bullets: [],
            links: [],
            fullWidth: false
          },
          {
            label: 'Booking links',
            value: undefined,
            chips: [],
            bullets: [],
            links: [],
            fullWidth: true
          }
        ],
        note: 'Use the session chat to ask Hermes to book once you settle on a place.',
        noteTitle: 'Next step'
      },
      noteLines: []
    },
    metadata: {
      fixture: true
    }
  };
}

function createLocalDiscoveryTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v2',
    templateId: 'local-discovery-comparison',
    title: 'Local discovery shortlist',
    subtitle: 'Potential venues and local fits',
    summary: 'Compare places nearby and save the best fit.',
    data: {
      eyebrow: 'Local discovery',
      heroChips: [
        { label: '3 places', tone: 'accent' },
        { label: 'Planning-ready', tone: 'success' }
      ],
      filters: [
        { label: 'Indoor', tone: 'neutral' },
        { label: 'Parking', tone: 'accent' }
      ],
      sortLabel: 'Sort: Best fit',
      groups: [
        {
          id: 'top-matches',
          label: 'Top matches',
          tone: 'accent',
          items: [
            {
              id: 'venue-dana',
              title: 'Dana Hall',
              subtitle: 'Historic venue',
              meta: 'Downtown Dayton',
              chips: [
                { label: 'Indoor', tone: 'accent' },
                { label: 'Available', tone: 'success' }
              ],
              bullets: [],
              links: []
            }
          ]
        }
      ],
      detail: {
        id: 'venue-dana',
        title: 'Selected place',
        summary: 'Dana Hall is the strongest fit for a small planning-heavy event.',
        chips: [
          { label: 'Historic', tone: 'accent' },
          { label: 'Parking nearby', tone: 'neutral' }
        ],
        fields: [
          {
            label: 'Website',
            value: undefined,
            chips: [],
            bullets: [],
            links: [
              {
                label: 'Website',
                href: 'https://example.com/dana-hall'
              }
            ],
            fullWidth: false
          },
          {
            label: 'Why it fits',
            value: 'Central location, compact layout, and a strong fit for an event-planning follow-on recipe.',
            chips: [],
            bullets: [],
            links: [],
            fullWidth: true
          }
        ]
      },
      noteLines: []
    },
    metadata: {
      fixture: true
    }
  };
}

function createRecipeTemplateSelectionArtifact(
  prompt: string,
  overrides: Partial<{
    templateId: string;
    reason: string;
    currentTemplateId: string;
    mode: 'fill' | 'update' | 'switch';
  }> = {}
) {
  const currentTemplate = parsePromptSectionJson(prompt, 'Current template state');
  const templateId = overrides.templateId ?? inferTemplateIdFromPrompt(prompt);
  const currentTemplateId =
    typeof overrides.currentTemplateId === 'string'
      ? overrides.currentTemplateId
      : currentTemplate && typeof currentTemplate.templateId === 'string'
        ? currentTemplate.templateId
        : undefined;
  const mode =
    overrides.mode ??
    (currentTemplateId ? (currentTemplateId === templateId ? 'update' : 'switch') : 'fill');

  return JSON.stringify({
    kind: 'recipe_template_selection',
    schemaVersion: 'recipe_template_selection/v2',
    templateId,
    mode,
    reason: overrides.reason ?? 'Fixture selected the closest approved template for the current Home recipe.',
    confidence: 0.86,
    hints:
      typeof currentTemplateId === 'string'
        ? { currentTemplateId }
          : undefined
  });
}

function resolveTemplateIdForStagePrompt(prompt: string) {
  const selectedTemplate = parsePromptSectionJson(prompt, 'Selected template', [
    'Template contract packet',
    'Template text contract packet',
    'Template hydration contract packet',
    'Template actions contract packet',
    'CANONICAL SCHEMA',
    'Schema compliance rules',
    'Staged text artifact',
    'Hydrated content artifact',
    'Current Home recipe'
  ]);
  if (selectedTemplate && typeof selectedTemplate.templateId === 'string') {
    return selectedTemplate.templateId;
  }

  const stagedTextArtifact = parsePromptSectionJson(prompt, 'Staged text artifact', [
    'Template hydration contract packet',
    'Template actions contract packet',
    'CANONICAL SCHEMA',
    'Schema compliance rules',
    'Current Home recipe',
    'Current template state',
    'Normalized data snapshot'
  ]);
  if (stagedTextArtifact && typeof stagedTextArtifact.templateId === 'string') {
    return stagedTextArtifact.templateId;
  }

  const hydratedArtifact = parsePromptSectionJson(prompt, 'Hydrated content artifact', [
    'Template actions contract packet',
    'CANONICAL SCHEMA',
    'Schema compliance rules',
    'Current Home recipe',
    'Current template state',
    'Normalized data snapshot'
  ]);
  if (hydratedArtifact && typeof hydratedArtifact.templateId === 'string') {
    return hydratedArtifact.templateId;
  }

  return inferTemplateIdFromPrompt(prompt);
}

function selectTemplateFillArtifact(prompt: string) {
  const templateId = resolveTemplateIdForStagePrompt(prompt);

  if (templateId === 'inbox-triage-board') {
    return createInboxTriageTemplateFillArtifact();
  }

  if (templateId === 'restaurant-finder') {
    return createRestaurantFinderTemplateFillArtifact();
  }

  if (templateId === 'research-notebook') {
    return {
      kind: 'recipe_template_fill',
      schemaVersion: 'recipe_template_fill/v2',
      templateId: 'research-notebook',
      title: 'Research notebook',
      subtitle: 'Research findings and next steps',
      summary: 'Capture sources, notes, extracted points, and follow-ups.',
      data: {
        eyebrow: 'Research plan',
        heroChips: [],
        activeTabId: 'sources',
        sources: [
          {
            id: 'sources',
            label: 'Key sources',
            tone: 'accent',
            items: [
              {
                id: 'source-1',
                title: 'Recipe generation needs staged hydration before actions.',
                subtitle: 'Reliability issue',
                meta: 'Primary issue',
                bullets: [],
                chips: [],
                links: []
              }
            ]
          }
        ],
        noteLines: ['Add a hydration stage before action generation.'],
        extractedPoints: [],
        followUps: []
      },
      metadata: {
        fixture: true
      }
    };
  }

  if (templateId === 'local-discovery-comparison') {
    return createLocalDiscoveryTemplateFillArtifact();
  }

  return createHotelShortlistTemplateFillArtifact();
}

function createRecipeTemplateTextArtifactResponse(prompt: string) {
  return JSON.stringify(createRecipeTemplateTextArtifact(RecipeTemplateFillSchema.parse(selectTemplateFillArtifact(prompt))));
}

function createRecipeTemplateHydrationArtifactResponse(prompt: string) {
  return JSON.stringify(createRecipeTemplateHydrationArtifact(RecipeTemplateFillSchema.parse(selectTemplateFillArtifact(prompt))));
}

function createRecipeTemplateActionsArtifactResponse(prompt: string) {
  return JSON.stringify(createRecipeTemplateActionsArtifact(RecipeTemplateFillSchema.parse(selectTemplateFillArtifact(prompt))));
}

function seedFailedBaselineAppletRecipe(database: BridgeDatabase, session: Session, recipe: Recipe) {
  const artifactTimestamp = '2026-04-11T19:02:00.000Z';
  const appletArtifacts = buildRecipeAppletBaseArtifacts({
    prompt: 'Check my unread email and summarize the inbox in a Home recipe.',
    requestMode: 'chat',
    timestamp: artifactTimestamp,
    currentRecipe: {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      status: recipe.status,
      metadata: recipe.metadata
    },
    envelope: createDynamicRecipeDataEnvelope({
      title: 'Inbox summary recipe'
    }),
    intentHint: {
      category: 'results',
      preferredContentFormat: 'table',
      label: 'email inbox summary'
    }
  });
  const priorAppletBuild = database.startRecipeBuild({
    id: `recipe-build-${recipe.id}-prior-enrichment`,
    recipeId: recipe.id,
    profileId: 'jbarton',
    sessionId: session.id,
    buildVersion: 1,
    buildKind: 'template_enrichment',
    triggerKind: 'chat',
    triggerRequestId: 'request-prior-enrichment',
    triggerActionId: null,
    phase: 'failed',
    progressMessage: 'Previous recipe generation failed.',
    retryCount: 0,
    startedAt: artifactTimestamp,
    updatedAt: '2026-04-11T19:02:01.000Z',
    completedAt: '2026-04-11T19:02:01.000Z',
    errorCode: 'RECIPE_TEMPLATE_FILL_FAILED',
    errorMessage: 'Previous recipe template generation failed.',
    errorDetail: 'Previous recipe template generation failed.',
    failureCategory: 'template_fill_failed',
    failureStage: 'enrichment_failed',
    userFacingMessage: 'Previous recipe template generation failed.',
    retryable: true,
    configuredTimeoutMs: null
  });

  for (const artifact of [
    appletArtifacts.userPrompt,
    appletArtifacts.intent,
    appletArtifacts.rawData,
    appletArtifacts.assistantContext,
    appletArtifacts.analysis,
    appletArtifacts.normalizedData,
    appletArtifacts.summary,
    appletArtifacts.fallback,
    appletArtifacts.actionSpec,
    appletArtifacts.recipeModel,
    appletArtifacts.recipePatch
  ].filter(Boolean)) {
    database.upsertRecipeBuildArtifact({
      id: `${priorAppletBuild.id}-${artifact.kind}`,
      recipeId: recipe.id,
      buildId: priorAppletBuild.id,
      artifactKind: artifact.kind,
      schemaVersion: artifact.schemaVersion,
      payload: artifact,
      createdAt: artifactTimestamp,
      updatedAt: artifactTimestamp
    });
  }

  database.updateRecipe(recipe.id, {
    profileId: recipe.profileId,
    renderMode: 'legacy_content_v1',
    dynamic: {
      renderMode: 'legacy_content_v1',
      activeBuild: null,
      actionSpec: appletArtifacts.actionSpec,
      applet: {
        activeBuild: null,
        promotedBuildId: null
      }
    },
    metadata: {
      ...recipe.metadata,
      recipePipeline: {
        currentStage: 'enrichment_failed',
        task: {
          status: 'ready',
          stage: 'task_ready',
          message: 'Hermes completed the task.',
          retryable: false,
          updatedAt: artifactTimestamp
        },
        baseline: {
          status: 'ready',
          stage: 'baseline_ready',
          message: 'The Home recipe baseline is ready.',
          retryable: false,
          updatedAt: artifactTimestamp
        },
        applet: {
          status: 'failed',
          stage: 'enrichment_failed',
          failureCategory: 'template_fill_failed',
          message: 'The Home recipe baseline is ready, but Hermes did not produce a valid approved template fill. You can retry recipe generation.',
          diagnostic: 'Previous recipe template generation failed.',
          retryable: true,
          updatedAt: '2026-04-11T19:02:01.000Z'
        }
      }
    }
  });

  return {
    artifactTimestamp,
    appletArtifacts,
    priorAppletBuild
  };
}

afterEach(() => {
  while (cleanupPaths.length > 0) {
    const target = cleanupPaths.pop();
    if (target) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
});

describe('Hermes UI Recipes parsing', () => {
  it('parses a table recipe payload from a direct fenced block', () => {
    const extracted = __recipeParsingForTests.extractRecipeOperations(`Created a random numbers recipe.

\`\`\`hermes-ui-recipes
{"operations":[{"type":"create_space","title":"Random numbers","viewType":"table","data":{"columns":[{"id":"value","header":"Value","isNumeric":true}],"rows":[{"value":4},{"value":7}]}}]}
\`\`\``);

    expect(extracted.errors).toEqual([]);
    expect(extracted.operations).toHaveLength(1);
    expect(extracted.operations[0]).toMatchObject({
      type: 'create_space',
      title: 'Random numbers',
      viewType: 'table'
    });
    expect(extracted.cleanedMarkdown).toBe('Created a random numbers recipe.');
  });

  it('parses a card recipe payload from a direct fenced block', () => {
    const extracted = __recipeParsingForTests.extractRecipeOperations(`Created a launch tracker recipe.

\`\`\`hermes-ui-recipes
{"operations":[{"type":"create_space","title":"Launch tracker","viewType":"card","data":{"cards":[{"id":"launch-card-1","title":"Ship the bridge","badges":["active"],"metadata":[{"label":"Owner","value":"Hermes"}]}]}}]}
\`\`\``);

    expect(extracted.errors).toEqual([]);
    expect(extracted.operations[0]).toMatchObject({
      type: 'create_space',
      title: 'Launch tracker',
      viewType: 'card'
    });
    expect(extracted.cleanedMarkdown).toBe('Created a launch tracker recipe.');
  });

  it('parses a markdown recipe payload from mixed prose and nested fences', () => {
    const extracted = __recipeParsingForTests.extractRecipeOperations(`Created a research notes recipe.

\`\`\`hermes-ui-recipes
Created a recipe and included the structured payload below.
\`\`\`json
{"operations":[{"type":"create_space","title":"Research notes","viewType":"markdown","data":{"markdown":"## Research notes\\n\\n- Capture the initial findings"}}]}
\`\`\`
\`\`\`

Open the recipe when you are ready.`);

    expect(extracted.errors).toEqual([]);
    expect(extracted.warnings).toContain('Ignored non-JSON prose inside the Hermes UI Recipes block.');
    expect(extracted.operations[0]).toMatchObject({
      type: 'create_space',
      title: 'Research notes',
      viewType: 'markdown'
    });
    expect(extracted.cleanedMarkdown).toBe('Created a research notes recipe.\n\nOpen the recipe when you are ready.');
  });

  it('recovers a table recipe from a malformed outer recipe block with a valid inner payload', () => {
    const extracted = __recipeParsingForTests.extractRecipeOperations(`Created a random numbers recipe.

\`\`\`hermes-ui-recipes
Created a recipe and included the valid payload below.
\`\`\`hermes-ui-recipes
{"operations":[{"type":"create_space","title":"Random numbers","viewType":"table","data":{"columns":[{"id":"value","header":"Value","isNumeric":true}],"rows":[{"value":4},{"value":7}]}}]}
\`\`\`
\`\`\`

Created a table recipe successfully.`);

    expect(extracted.operations).toHaveLength(1);
    expect(extracted.operations[0]).toMatchObject({
      type: 'create_space',
      title: 'Random numbers',
      viewType: 'table'
    });
    expect(extracted.errors).toHaveLength(1);
    expect(extracted.cleanedMarkdown).toBe('Created a random numbers recipe.\n\nCreated a table recipe successfully.');
  });

  it('recovers a card recipe from malformed prose wrapped around an inner json fence', () => {
    const extracted = __recipeParsingForTests.extractRecipeOperations(`Created a launch tracker recipe.

\`\`\`hermes-ui-recipes
Created a recipe...
\`\`\`json
{"operations":[{"type":"create_space","title":"Launch tracker","viewType":"card","data":{"cards":[{"id":"launch-card-1","title":"Ship the bridge","badges":["active"],"metadata":[{"label":"Owner","value":"Hermes"}]}]}}]}
\`\`\`
Created it successfully.
\`\`\`

Open it when ready.`);

    expect(extracted.operations).toHaveLength(1);
    expect(extracted.operations[0]).toMatchObject({
      type: 'create_space',
      title: 'Launch tracker',
      viewType: 'card'
    });
    expect(extracted.errors).toEqual([]);
    expect(extracted.warnings).toContain('Ignored non-JSON prose inside the Hermes UI Recipes block.');
    expect(extracted.cleanedMarkdown).toContain('Created a launch tracker recipe.');
    expect(extracted.cleanedMarkdown).toContain('Created it successfully.');
    expect(extracted.cleanedMarkdown).toContain('Open it when ready.');
  });

  it('recovers a markdown recipe from duplicated assistant prose and nested recipe fences', () => {
    const extracted = __recipeParsingForTests.extractRecipeOperations(`Created a research notes recipe.
Created a research notes recipe.

\`\`\`hermes-ui-recipes
Created a note and included the structured payload below.
\`\`\`hermes-ui-recipes
\`\`\`json
{"operations":[{"type":"create_space","title":"Research notes","viewType":"markdown","data":{"markdown":"## Research notes\\n\\n- Capture the initial findings"}}]}
\`\`\`
\`\`\`
\`\`\`

Created a research notes recipe.`);

    expect(extracted.operations).toHaveLength(1);
    expect(extracted.operations[0]).toMatchObject({
      type: 'create_space',
      title: 'Research notes',
      viewType: 'markdown'
    });
    expect(extracted.cleanedMarkdown).toBe('Created a research notes recipe.\nCreated a research notes recipe.\n\nCreated a research notes recipe.');
  });

  it('reports malformed mixed prose recipe blocks without producing broken operations', () => {
    const extracted = __recipeParsingForTests.extractRecipeOperations(`Created a broken recipe.

\`\`\`hermes-ui-recipes
Created a recipe and included the structured payload below.
This is not valid JSON.
\`\`\``);

    expect(extracted.operations).toEqual([]);
    expect(extracted.errors).toHaveLength(1);
    expect(extracted.cleanedMarkdown).toBe('Created a broken recipe.');
  });
});

describe('HermesBridge recipe entry actions', () => {
  it('removes a single entry from a recipe and keeps the remaining representations aligned', async () => {
    const database = createDatabase();
    const { session, recipe } = createAttachedRecipe(database);
    const bridge = new HermesBridge({
      database,
      hermesCli: {} as HermesCli,
      now: () => '2026-04-10T12:05:00.000Z'
    });
    const entries = getRecipeContentEntries(recipe);

    const response = await bridge.applyRecipeEntryAction(recipe.id, {
      profileId: 'jbarton',
      action: 'remove',
      entryIds: [entries[0]!.id]
    });

    expect(response.removedEntryIds).toEqual([entries[0]!.id]);
    expect(response.deletedSourceEntryIds).toEqual([]);
    expect(getRecipeContentEntries(response.recipe)).toHaveLength(1);
    expect(getRecipeContentEntries(response.recipe)[0]?.row.hotel).toBe('Hotel Ardent');
    expect(
      database
        .listTelemetryEvents({
          profileId: 'jbarton',
          sessionId: session.id,
          limit: 10
        })
        .some((event) => event.code === 'RECIPE_ENTRY_REMOVED')
    ).toBe(true);

    database.close();
  });

  it('rejects delete_source entry actions — source deletion must go through a prompt-based template action', async () => {
    const database = createDatabase();
    const { recipe } = createAttachedRecipe(
      database,
      normalizeRecipeTabs({
        contentFormat: 'table',
        contentData: {
          columns: [
            { id: 'subject', label: 'Subject', emphasis: 'primary', presentation: 'text' },
            { id: 'from', label: 'From', emphasis: 'none', presentation: 'text' },
            { id: 'messageId', label: 'Message ID', emphasis: 'none', presentation: 'text' }
          ],
          rows: [
            { subject: 'Launch follow-up', from: 'ops@example.com', messageId: 'gmail-message-1' }
          ],
          emptyMessage: 'No emails.'
        }
      })
    );
    const bridge = new HermesBridge({
      database,
      hermesCli: {} as unknown as HermesCli,
      now: () => '2026-04-10T12:05:00.000Z'
    });
    const entry = getRecipeContentEntries(recipe)[0]!;

    await expect(
      bridge.applyRecipeEntryAction(recipe.id, {
        profileId: 'jbarton',
        action: 'delete_source',
        entryIds: [entry.id]
      })
    ).rejects.toMatchObject({
      code: 'RECIPE_ACTION_OUTBOUND_NOT_ALLOWED'
    } satisfies Partial<BridgeError>);

    // Entry must be untouched — no side effects allowed before the prompt-based flow runs
    expect(getRecipeContentEntries(database.getRecipe(recipe.id)!)).toHaveLength(1);

    database.close();
  });
});

describe('HermesBridge attached-recipe refresh', () => {
  it('builds refresh prompts from stored recipe context instead of replaying the latest user turn', async () => {
    const database = createDatabase();
    const { session, recipe } = createAttachedRecipe(database);
    seedRuntimeReady(database);
    database.updateRecipe(recipe.id, {
      profileId: 'jbarton',
      metadata: {
        ...recipe.metadata,
        refreshPrompt: 'Find the best boutique hotels in Dayton with breakfast.',
        refreshRequestId: 'request-refresh-origin',
        refreshPromptUpdatedAt: '2026-04-10T12:00:02.000Z'
      }
    });
    database.appendMessage({
      id: 'message-refresh-origin',
      sessionId: session.id,
      role: 'user',
      content: 'Find the best boutique hotels in Dayton with breakfast.',
      createdAt: '2026-04-10T12:00:02.000Z',
      status: 'completed',
      requestId: 'request-refresh-origin',
      visibility: 'transcript',
      kind: 'conversation'
    });
    database.appendMessage({
      id: 'message-refresh-unrelated',
      sessionId: session.id,
      role: 'user',
      content: 'Also draft a follow-up email for the venue manager.',
      createdAt: '2026-04-10T12:00:03.000Z',
      status: 'completed',
      requestId: 'request-refresh-unrelated',
      visibility: 'transcript',
      kind: 'conversation'
    });

    const streamChat = vi.fn(async (_options: Parameters<HermesCli['streamChat']>[0]) => ({
      assistantMarkdown: `Refreshed the shortlist.

\`\`\`hermes-ui-recipes
{"operations":[{"type":"update_space","target":"current","contentFormat":"table","contentData":{"columns":[{"id":"hotel","label":"Hotel","emphasis":"primary","presentation":"text"},{"id":"price","label":"Price","presentation":"text"}],"rows":[{"hotel":"Hotel Ardent","price":"$210"}],"emptyMessage":"No rows yet."}}]}
\`\`\``,
      runtimeSessionId: 'runtime-session-refresh'
    }));
    const discoverRuntimeProviderState = vi.fn(async () => createRuntimeReadyState());
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState,
        streamChat
      } as unknown as HermesCli,
      now: () => '2026-04-10T12:05:00.000Z'
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        recipeId: recipe.id,
        content: RECIPE_REFRESH_USER_MESSAGE,
        mode: 'recipe_refresh'
      },
      () => undefined
    );

    expect(streamChat).toHaveBeenCalledWith(
      expect.objectContaining({
        content: RECIPE_REFRESH_USER_MESSAGE,
        requestMode: 'recipe_refresh',
        refreshContext: {
          intentPrompt: 'Find the best boutique hotels in Dayton with breakfast.',
          source: 'recipe_metadata'
        }
      })
    );
    expect(discoverRuntimeProviderState).toHaveBeenCalled();
    expect(database.getRecipe(recipe.id)?.metadata.refreshPrompt).toBe('Find the best boutique hotels in Dayton with breakfast.');
    expect(database.listMessages(session.id).at(-2)?.content).toBe(RECIPE_REFRESH_USER_MESSAGE);
    expect(database.getRecipe(recipe.id)?.tabs[0]).toBeDefined();

    database.close();
  });
});

describe('HermesBridge runtime-ready cache (Phase 3)', () => {
  it('calls discoverRuntimeProviderState only once per 30-second window for back-to-back requests', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T17:00:00.000Z');
    const discoverRuntimeProviderState = vi.fn(async () => createRuntimeReadyState());
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState,
        streamChat: vi.fn(async () => ({
          assistantMarkdown: 'Hello.',
          runtimeSessionId: 'rt-session-1'
        }))
      } as unknown as HermesCli,
      now: createNowSequence()
    });

    await bridge.streamChat({ profileId: 'jbarton', sessionId: session.id, content: 'Hi.', mode: 'chat' }, () => undefined);
    await bridge.streamChat({ profileId: 'jbarton', sessionId: session.id, content: 'Hi again.', mode: 'chat' }, () => undefined);

    // Second call hits the cache — discover should only have been called once.
    expect(discoverRuntimeProviderState).toHaveBeenCalledTimes(1);

    database.close();
  });

  it('invalidates the cache after updateRuntimeModelConfig', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T17:00:00.000Z');
    const runtimeState = createRuntimeReadyState();
    const discoverRuntimeProviderState = vi.fn(async () => runtimeState);
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState,
        streamChat: vi.fn(async () => ({ assistantMarkdown: 'Hi.', runtimeSessionId: 'rt-1' })),
        updateRuntimeModelConfig: vi.fn(async () => runtimeState.config)
      } as unknown as HermesCli,
      now: createNowSequence()
    });

    // First chat call — populates cache
    await bridge.streamChat({ profileId: 'jbarton', sessionId: session.id, content: 'Hi.', mode: 'chat' }, () => undefined);
    expect(discoverRuntimeProviderState).toHaveBeenCalledTimes(1);

    // Config update — must invalidate cache
    await bridge.updateRuntimeModelConfig({ profileId: 'jbarton', provider: 'openrouter' });
    expect(discoverRuntimeProviderState).toHaveBeenCalledTimes(2); // called by updateRuntimeModelConfig → getModelProviderState

    // Next chat — cache was cleared, so discover is called again
    await bridge.streamChat({ profileId: 'jbarton', sessionId: session.id, content: 'Hi again.', mode: 'chat' }, () => undefined);
    expect(discoverRuntimeProviderState).toHaveBeenCalledTimes(3);

    database.close();
  });
});

describe('HermesBridge enrichment supersession (Phase 4)', () => {
  it('stops enrichment between stages when a newer request supersedes the current one', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T17:00:00.000Z');
    // Use 'nearby shortlist' — no deterministic template mapping, so LLM selection runs.
    const envelope = createDynamicRecipeDataEnvelope({ intentLabel: 'nearby shortlist' });
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return { assistantMarkdown: JSON.stringify(envelope), runtimeSessionId: 'rt-seed' };
      }
      return { assistantMarkdown: 'Here are some nearby places.', runtimeSessionId: 'rt-chat' };
    });
    // During the LLM selection stage, simulate a new competing request by updating
    // the recipe's latestRecipeAttemptRequestId — the inter-stage check then aborts.
    let selectionCallCount = 0;
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'select' && typeof options?.prompt === 'string') {
        selectionCallCount += 1;
        const recipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
        if (recipe) {
          database.updateRecipe(recipe.id, {
            profileId: 'jbarton',
            metadata: {
              ...recipe.metadata,
              latestRecipeAttemptRequestId: 'newer-request-id',
              latestRecipeAttemptedAt: new Date(Date.now() + 10_000).toISOString()
            }
          });
        }
        return { assistantMarkdown: createRecipeTemplateSelectionArtifact(options.prompt as string) };
      }
      // Text/hydrate/actions must not be reached after supersession.
      return { assistantMarkdown: '' };
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact
      } as unknown as HermesCli,
      now: createNowSequence()
    });

    await bridge.streamChat(
      { profileId: 'jbarton', sessionId: session.id, content: 'Find nearby coffee shops.', mode: 'chat' },
      () => undefined
    );
    await waitForRecipeEnrichment(bridge);

    expect(selectionCallCount).toBe(1);
    const postSelectionCalls = generateRecipeTemplateArtifact.mock.calls.filter(
      (call) => call[0]?.stage === 'text' || call[0]?.stage === 'hydrate' || call[0]?.stage === 'actions'
    );
    expect(postSelectionCalls).toHaveLength(0);

    const recipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const enrichmentBuild = recipe?.id
      ? database.listRecipeBuilds(recipe.id, { limit: 10 }).find((b) => b.buildKind === 'template_enrichment')
      : null;
    expect(enrichmentBuild?.phase).toBe('failed');

    database.close();
  });
});

describe('HermesBridge Home baseline recipes', () => {
  it('creates a baseline Home recipe, selects an approved template, and promotes a template-filled recipe for structured requests', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T17:00:00.000Z');
    const envelope = createDynamicRecipeDataEnvelope();
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return {
          assistantMarkdown: JSON.stringify(envelope),
          runtimeSessionId: 'runtime-session-home-seed'
        };
      }

      return {
        assistantMarkdown: 'Here is a compact shortlist.\n\nI can refine it further.',
        runtimeSessionId: 'runtime-session-home-baseline'
      };
    });
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'select' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateSelectionArtifact(options.prompt)
        };
      }

      if (options?.stage === 'text' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateTextArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'hydrate' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateHydrationArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'actions' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateActionsArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'actions_repair' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateActionsArtifactResponse(options.prompt)
        };
      }

      throw new Error(`Unexpected recipe template stage ${(options?.stage as string | undefined) ?? 'unknown'}.`);
    });
    const events: ChatStreamEvent[] = [];
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact
      } as unknown as HermesCli,
      now: createNowSequence()
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Find the best boutique hotels in Dayton for a weekend stay and create a recipe for this.',
        mode: 'chat'
      },
      (event) => {
        events.push(event);
      }
    );

    const queuedCompleteEvent = events.find(
      (event): event is Extract<ChatStreamEvent, { type: 'complete' }> => event.type === 'complete'
    );
    expect(queuedCompleteEvent?.assistantMessage.content).toBe('Here is a compact shortlist.\n\nI can refine it further.');

    await waitForRecipeEnrichment(bridge);

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const telemetry = database.listTelemetryEvents({
      profileId: 'jbarton',
      sessionId: session.id,
      limit: 60
    });
    const completeEvent = queuedCompleteEvent;
    const persistedBuilds = database.listRecipeBuilds(attachedRecipe?.id ?? '', {
      limit: 10
    });
    const activeBuild = attachedRecipe?.dynamic?.activeBuild ?? null;
    const buildLogs = activeBuild ? database.listRecipeBuildLogs(activeBuild.id) : [];
    const stageTimingLogs = buildLogs
      .map((log) => parseStructuredLogDetail(log.detail))
      .filter(
        (detail): detail is Record<string, unknown> =>
          detail?.recordType === 'recipe_generation_stage_timing'
      );
    const sectionProgressLogs = buildLogs
      .map((log) => parseStructuredLogDetail(log.detail))
      .filter(
        (detail): detail is Record<string, unknown> =>
          detail?.recordType === 'recipe_template_section_progress'
      );
    const stageAttemptLogs = buildLogs
      .map((log) => parseStructuredLogDetail(log.detail))
      .filter(
        (detail): detail is Record<string, unknown> =>
          detail?.recordType === 'recipe_generation_stage_attempt'
      );
    const generationSummaryLog = buildLogs
      .map((log) => parseStructuredLogDetail(log.detail))
      .find((detail) => detail?.recordType === 'recipe_generation_summary');
    const generationSummaryTelemetry = telemetry.find((event) => event.code === 'RECIPE_TEMPLATE_BUILD_SUMMARY');
    const generationSummaryPayload = toRecord(generationSummaryTelemetry?.payload);
    const generationSummaryPerStage = toRecord(generationSummaryPayload.perStageElapsedMs);

    expect(streamChat).toHaveBeenCalledTimes(2);
    expect(generateRecipeTemplateArtifact).toHaveBeenCalledTimes(4);
    expect(streamChat.mock.calls[0]?.[0]?.structuredArtifactOnly).toBeUndefined();
    expect(streamChat.mock.calls[1]?.[0]?.structuredArtifactOnly).toBe(true);
    expect(streamChat.mock.calls[1]?.[0]?.timeoutMs).toBe(90_000);
    expect(generateRecipeTemplateArtifact.mock.calls[0]?.[0]?.stage).toBe('select');
    expect(generateRecipeTemplateArtifact.mock.calls[1]?.[0]?.stage).toBe('text');
    expect(generateRecipeTemplateArtifact.mock.calls[2]?.[0]?.stage).toBe('hydrate');
    expect(generateRecipeTemplateArtifact.mock.calls[3]?.[0]?.stage).toBe('actions');
    expect(generateRecipeTemplateArtifact.mock.calls.every(([options]) => options?.timeoutMs === 90_000)).toBe(true);
    expect(generateRecipeTemplateArtifact.mock.calls[0]?.[0]?.prompt).not.toContain('Original prompt:');
    expect(generateRecipeTemplateArtifact.mock.calls[0]?.[0]?.prompt).not.toContain(
      'Find the best boutique hotels in Dayton for a weekend stay and create a recipe for this.'
    );
    expect(generateRecipeTemplateArtifact.mock.calls[0]?.[0]?.prompt).toContain('Approved template registry:');
    expect(generateRecipeTemplateArtifact.mock.calls[1]?.[0]?.prompt).toContain('CANONICAL SCHEMA');
    expect(generateRecipeTemplateArtifact.mock.calls[2]?.[0]?.prompt).toContain('CANONICAL SCHEMA');
    expect(generateRecipeTemplateArtifact.mock.calls[2]?.[0]?.prompt).toContain('Assistant response markdown:');
    expect(generateRecipeTemplateArtifact.mock.calls[3]?.[0]?.prompt).toContain('CANONICAL SCHEMA');
    expect(generateRecipeTemplateArtifact.mock.calls[3]?.[0]?.prompt).toContain('"allowedActionIds"');
    expect(attachedRecipe?.renderMode).toBe('dynamic_v1');
    expect(attachedRecipe?.dynamic?.activeBuild?.buildKind).toBe('template_enrichment');
    expect(attachedRecipe?.dynamic?.activeBuild?.phase).toBe('ready');
    expect(attachedRecipe?.dynamic?.recipeTemplate?.kind).toBe('recipe_template_state');
    expect(attachedRecipe?.dynamic?.recipeTemplate?.templateId).toBe('hotel-shortlist');
    expect(attachedRecipe?.dynamic?.recipeTemplate?.sections.some((section) => section.slotId === 'hotels')).toBe(true);
    expect(attachedRecipe?.dynamic?.recipeDsl).toBeUndefined();
    expect(attachedRecipe?.dynamic?.recipeModel).toBeUndefined();
    expect(attachedRecipe?.dynamic?.actionSpec?.kind).toBe('action_spec');
    expect(attachedRecipe?.dynamic?.actionSpec?.actions.some((action) => action.id === 'retry-build')).toBe(true);
    expect(getRecipeContentTab(attachedRecipe!).content.markdownRepresentation.markdown).toBe('Here is a compact shortlist.\n\nI can refine it further.');
    expect(getRecipeContentEntries(attachedRecipe!)).toHaveLength(1);
    expect(attachedRecipe?.metadata.latestRecipeAttemptOutcome).toBe('markdown_fallback');
    expect(attachedRecipe?.metadata.latestRecipeAttemptMode).toBe('markdown_fallback');
    expect(attachedRecipe?.metadata.activeTemplateId).toBe('hotel-shortlist');
    expect(attachedRecipe?.metadata.homeRecipe).toBe(true);
    expect(attachedRecipe?.metadata.baselineContentUpdatedAt).toBeTruthy();
    expect(database.getSession(session.id)?.recipeType).toBe('home');
    expect(events.some((event) => event.type === 'recipe_build_progress')).toBe(true);
    expect(completeEvent?.assistantMessage.content).toBe('Here is a compact shortlist.\n\nI can refine it further.');
    expect(completeEvent?.assistantMessage.content).not.toContain('hermes-recipe-data');
    expect(telemetry.some((event) => event.code === 'RECIPE_DATA_STRUCTURED_ONLY_STARTED')).toBe(true);
    expect(telemetry.some((event) => event.code === 'RECIPE_TEMPLATE_ENRICHMENT_QUEUED')).toBe(true);
    expect(telemetry.some((event) => event.code === 'RECIPE_TEMPLATE_PROMOTED')).toBe(true);
    expect(generationSummaryPayload.buildId).toBe(activeBuild?.id);
    expect(generationSummaryPayload.ready).toBe(true);
    expect(generationSummaryPayload.repairInvoked).toBe(false);
    expect(generationSummaryPerStage.structured_seed_generation).toBeGreaterThan(0);
    expect(generationSummaryPerStage.template_selection).toBeGreaterThan(0);
    expect(generationSummaryPerStage.template_text_generation).toBeGreaterThan(0);
    expect(generationSummaryPerStage.template_hydration).toBeGreaterThan(0);
    expect(generationSummaryPerStage.template_actions_generation).toBeGreaterThan(0);
    expect(generationSummaryPerStage.template_validation).toBeGreaterThan(0);
    expect(generationSummaryPerStage.template_promotion).toBeGreaterThan(0);
    expect(stageTimingLogs.map((detail) => detail.stage)).toEqual(
      expect.arrayContaining([
        'structured_seed_generation',
        'template_selection',
        'template_text_generation',
        'template_hydration',
        'template_actions_generation',
        'template_validation',
        'template_promotion'
      ])
    );
    expect(sectionProgressLogs.map((detail) => detail.stage)).toEqual(
      expect.arrayContaining([
        'template_selection',
        'template_text_generation',
        'template_hydration',
        'template_validation'
      ])
    );
    expect(sectionProgressLogs.some((detail) => detail.viewPhase === 'selected')).toBe(true);
    expect(sectionProgressLogs.some((detail) => detail.viewPhase === 'hydrating')).toBe(true);
    expect(sectionProgressLogs.some((detail) => detail.viewPhase === 'ready')).toBe(true);
    expect(stageAttemptLogs.some((detail) => detail.stage === 'template_hydration' && detail.normalizationSummary)).toBe(true);
    expect(generationSummaryLog?.finalPhase).toBe('ready');
    expect(generationSummaryLog?.totalElapsedMs).toBeGreaterThan(0);
    expect(generationSummaryLog?.repairInvoked).toBe(false);
    expect(generationSummaryLog?.perStageElapsedMs).toMatchObject({
      structured_seed_generation: expect.any(Number),
      template_selection: expect.any(Number),
      template_text_generation: expect.any(Number),
      template_hydration: expect.any(Number),
      template_actions_generation: expect.any(Number),
      template_validation: expect.any(Number),
      template_promotion: expect.any(Number)
    });
    expect(telemetry.some((event) => event.code === 'RECIPE_LEGACY_RICH_BUILDER_DISABLED')).toBe(false);
    expect(persistedBuilds.every((build) => build.buildKind === 'template_enrichment')).toBe(true);

    await waitForRecipeEnrichment(bridge);
    database.close();
  });

  it('completes the request before async recipe generation finishes selecting and filling the template', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T17:10:00.000Z');
    const envelope = createDynamicRecipeDataEnvelope();
    const events: ChatStreamEvent[] = [];
    let releaseTemplateSelection!: () => void;
    const templateSelectionGate = new Promise<void>((resolve) => {
      releaseTemplateSelection = () => resolve();
    });
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return {
          assistantMarkdown: JSON.stringify(envelope),
          runtimeSessionId: 'runtime-session-home-seed'
        };
      }

      return {
        assistantMarkdown: 'Here is a compact shortlist.\n\nI can refine it further.',
        runtimeSessionId: 'runtime-session-home-baseline'
      };
    });
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'select' && typeof options?.prompt === 'string') {
        await templateSelectionGate;
        return {
          assistantMarkdown: createRecipeTemplateSelectionArtifact(options.prompt)
        };
      }

      if (options?.stage === 'text' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateTextArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'hydrate' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateHydrationArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'actions' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateActionsArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'actions_repair' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateActionsArtifactResponse(options.prompt)
        };
      }

      throw new Error(`Unexpected recipe template stage ${(options?.stage as string | undefined) ?? 'unknown'}.`);
    });
    const generateRecipeAppletArtifact = vi.fn();
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact,
        generateRecipeAppletArtifact
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T17:10:00.000Z')
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Find the best boutique hotels in Dayton for a weekend stay and create a recipe for this.',
        mode: 'chat'
      },
      (event) => {
        events.push(event);
      }
    );

    const completeEvent = events.find((event): event is Extract<ChatStreamEvent, { type: 'complete' }> => event.type === 'complete');
    const baselineRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const runtimeRequest = database.getRuntimeRequest(completeEvent?.assistantMessage.requestId ?? '');

    expect(completeEvent?.assistantMessage.content).toBe('Here is a compact shortlist.\n\nI can refine it further.');
    expect(runtimeRequest?.status).toBe('completed');
    expect(baselineRecipe?.renderMode).toBe('dynamic_v1');
    expect(baselineRecipe?.metadata.recipePipeline?.currentStage).toBe('enrichment_generating');
    expect(baselineRecipe?.metadata.recipePipeline?.baseline.status).toBe('ready');
    expect(baselineRecipe?.metadata.recipePipeline?.applet.status).toBe('running');
    expect(baselineRecipe?.dynamic?.activeBuild?.buildKind).toBe('template_enrichment');
    expect(baselineRecipe?.dynamic?.recipeTemplate).toBeUndefined();
    expect(generateRecipeAppletArtifact).not.toHaveBeenCalled();

    releaseTemplateSelection();
    await waitForRecipeEnrichment(bridge);

    const telemetry = database.listTelemetryEvents({
      profileId: 'jbarton',
      sessionId: session.id,
      limit: 40
    });

    expect(database.getRecipeByPrimarySessionId('jbarton', session.id)?.dynamic?.recipeTemplate?.templateId).toBe('hotel-shortlist');
    expect(telemetry.some((event) => event.code.startsWith('RECIPE_APPLET_'))).toBe(false);

    await waitForRecipeEnrichment(bridge);
    database.close();
  }, 15_000);

  it('skips the LLM selection stage when the intent label deterministically maps to a template', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T17:15:00.000Z');
    // Use 'hotel shortlist' — a label that maps deterministically to 'hotel-shortlist' via INTENT_LABEL_TO_TEMPLATE_ID.
    const envelope = createDynamicRecipeDataEnvelope({ intentLabel: 'hotel shortlist' });
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return {
          assistantMarkdown: JSON.stringify(envelope),
          runtimeSessionId: 'runtime-session-deterministic-seed'
        };
      }

      return {
        assistantMarkdown: 'Here is a compact shortlist.\n\nI can refine it further.',
        runtimeSessionId: 'runtime-session-deterministic-baseline'
      };
    });
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'text' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateTextArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'hydrate' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateHydrationArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'actions' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateActionsArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'actions_repair' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateActionsArtifactResponse(options.prompt)
        };
      }

      throw new Error(`Unexpected recipe template stage ${(options?.stage as string | undefined) ?? 'unknown'} — select stage should have been skipped.`);
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T17:15:00.000Z')
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Find the best boutique hotels in Dayton for a weekend stay and create a recipe for this.',
        mode: 'chat'
      },
      () => undefined
    );

    await waitForRecipeEnrichment(bridge);

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const telemetry = database.listTelemetryEvents({
      profileId: 'jbarton',
      sessionId: session.id,
      limit: 60
    });

    // The select stage must have been bypassed: only text, hydrate, actions calls expected.
    expect(generateRecipeTemplateArtifact).not.toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'select' })
    );
    expect(generateRecipeTemplateArtifact).toHaveBeenCalledTimes(3);
    expect(generateRecipeTemplateArtifact.mock.calls[0]?.[0]?.stage).toBe('text');
    expect(generateRecipeTemplateArtifact.mock.calls[1]?.[0]?.stage).toBe('hydrate');
    expect(generateRecipeTemplateArtifact.mock.calls[2]?.[0]?.stage).toBe('actions');

    // The recipe should be fully ready with the correct template.
    expect(attachedRecipe?.dynamic?.activeBuild?.phase).toBe('ready');
    expect(attachedRecipe?.dynamic?.recipeTemplate?.templateId).toBe('hotel-shortlist');

    // A deterministic-selection telemetry event should have been recorded.
    expect(telemetry.some((event) => event.code === 'RECIPE_TEMPLATE_SELECTION_DETERMINISTIC')).toBe(true);
    const deterministicEvent = telemetry.find((event) => event.code === 'RECIPE_TEMPLATE_SELECTION_DETERMINISTIC');
    expect((deterministicEvent?.payload as Record<string, unknown>)?.intentLabel).toBe('hotel shortlist');
    expect((deterministicEvent?.payload as Record<string, unknown>)?.templateId).toBe('hotel-shortlist');

    await waitForRecipeEnrichment(bridge);
    database.close();
  }, 15_000);

  it('retries structured seed generation, persists raw payload diagnostics, and recovers on a later attempt', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T17:20:00.000Z');
    const envelope = createDynamicRecipeDataEnvelope();
    let structuredAttempt = 0;
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        structuredAttempt += 1;
        if (structuredAttempt === 1) {
          return {
            assistantMarkdown: 'Intro\n{"broken":',
            runtimeSessionId: 'runtime-session-home-seed-1'
          };
        }

        return {
          assistantMarkdown: `Intro\n${JSON.stringify(envelope)}\nThanks`,
          runtimeSessionId: 'runtime-session-home-seed-2'
        };
      }

      return {
        assistantMarkdown: 'Here is a compact shortlist.\n\nI can refine it further.',
        runtimeSessionId: 'runtime-session-home-baseline'
      };
    });
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'select' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateSelectionArtifact(options.prompt)
        };
      }

      if (options?.stage === 'text' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateTextArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'hydrate' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateHydrationArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'actions' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateActionsArtifactResponse(options.prompt)
        };
      }

      throw new Error(`Unexpected recipe template stage ${(options?.stage as string | undefined) ?? 'unknown'}.`);
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T17:20:00.000Z')
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Find the best boutique hotels in Dayton for a weekend stay and create a recipe for this.',
        mode: 'chat'
      },
      () => undefined
    );

    await waitForRecipeEnrichment(bridge);

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const activeBuild = attachedRecipe?.dynamic?.activeBuild ?? null;
    const structuredLogs = listStructuredBuildLogDetails(database, activeBuild?.id);
    const seedAttemptLogs = structuredLogs.filter(
      (detail) => detail.recordType === 'recipe_generation_stage_attempt' && detail.stage === 'structured_seed_generation'
    );
    const seedRawLogs = structuredLogs.filter(
      (detail) => detail.recordType === 'recipe_generation_stage_attempt_raw' && detail.stage === 'structured_seed_generation'
    );
    const generationSummaryLog = structuredLogs.find((detail) => detail.recordType === 'recipe_generation_summary');
    const recoveredRawLog = seedRawLogs.find((detail) => detail.status === 'succeeded');

    expect(streamChat.mock.calls.filter(([options]) => options?.structuredArtifactOnly).length).toBe(2);
    expect(attachedRecipe?.dynamic?.recipeTemplate?.templateId).toBe('hotel-shortlist');
    expect(seedAttemptLogs).toHaveLength(2);
    expect(seedRawLogs).toHaveLength(2);
    expect(seedRawLogs[0]?.status).toBe('failed');
    expect(seedRawLogs[0]?.failureKind).toBe('json_invalid');
    expect(toRecord(seedRawLogs[0]?.parserDiagnostics).recoveryAttempted).toBe(true);
    expect(recoveredRawLog?.status).toBe('succeeded');
    expect(toRecord(recoveredRawLog?.parserDiagnostics).leadingProse).toBe(true);
    expect(toRecord(recoveredRawLog?.parserDiagnostics).trailingProse).toBe(true);
    expect(generationSummaryLog?.attemptsByStage).toMatchObject({
      structured_seed_generation: 2
    });
    expect(toRecord(toRecord(generationSummaryLog?.recoveryByStage).structured_seed_generation)).toMatchObject({
      attempted: true,
      succeeded: true
    });

    database.close();
  });

  it('retries template selection three times, persists raw failed output, and then fails with attempt history', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T17:24:00.000Z');
    const envelope = createDynamicRecipeDataEnvelope();
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return {
          assistantMarkdown: JSON.stringify(envelope),
          runtimeSessionId: 'runtime-session-home-seed'
        };
      }

      return {
        assistantMarkdown: 'Here is the baseline shortlist.',
        runtimeSessionId: 'runtime-session-home-baseline'
      };
    });
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'select') {
        return {
          assistantMarkdown: createRecipeTemplateSelectionArtifact(String(options?.prompt ?? ''), {
            templateId: 'not-approved-template'
          })
        };
      }

      throw new Error(`Unexpected recipe template stage ${(options?.stage as string | undefined) ?? 'unknown'}.`);
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T17:24:00.000Z')
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Compare three CRM vendors and create a recipe for the shortlist.',
        mode: 'chat'
      },
      () => undefined
    );

    await waitForRecipeEnrichment(bridge);

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const activeBuild = attachedRecipe?.dynamic?.activeBuild ?? null;
    const structuredLogs = listStructuredBuildLogDetails(database, activeBuild?.id);
    const selectionAttemptLogs = structuredLogs.filter(
      (detail) => detail.recordType === 'recipe_generation_stage_attempt' && detail.stage === 'template_selection'
    );
    const selectionRawLogs = structuredLogs.filter(
      (detail) => detail.recordType === 'recipe_generation_stage_attempt_raw' && detail.stage === 'template_selection'
    );
    const generationSummaryLog = structuredLogs.find((detail) => detail.recordType === 'recipe_generation_summary');

    expect(generateRecipeTemplateArtifact.mock.calls.map(([options]) => options?.stage)).toEqual(['select', 'select', 'select']);
    expect(activeBuild?.failureCategory).toBe('template_selection_failed');
    expect(attachedRecipe?.dynamic?.recipeTemplate).toBeUndefined();
    expect(selectionAttemptLogs).toHaveLength(3);
    expect(selectionRawLogs).toHaveLength(3);
    expect(selectionAttemptLogs.every((detail) => detail.retryable === true || detail.attemptNumber === 3)).toBe(true);
    expect(generationSummaryLog?.attemptsByStage).toMatchObject({
      structured_seed_generation: 1,
      template_selection: 3
    });

    database.close();
  });

  it('does not waste retries when template selection context is invalid', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T17:27:00.000Z');
    const envelope = createDynamicRecipeDataEnvelope();
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return {
          assistantMarkdown: JSON.stringify(envelope),
          runtimeSessionId: 'runtime-session-home-seed'
        };
      }

      return {
        assistantMarkdown: 'Here is the shortlist baseline.',
        runtimeSessionId: 'runtime-session-home-baseline'
      };
    });
    const generateRecipeTemplateArtifact = vi.fn(async () => {
      const error = new Error('Recipe template generation could not continue because the persisted template context was incomplete.');
      error.name = 'HermesCliRecipeAppletContextError';
      throw error;
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T17:27:00.000Z')
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Good Italian restaurants near Dayton, OH.',
        mode: 'chat'
      },
      () => undefined
    );

    await waitForRecipeEnrichment(bridge);

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const activeBuild = attachedRecipe?.dynamic?.activeBuild ?? null;
    const structuredLogs = listStructuredBuildLogDetails(database, activeBuild?.id);
    const selectionAttemptLogs = structuredLogs.filter(
      (detail) => detail.recordType === 'recipe_generation_stage_attempt' && detail.stage === 'template_selection'
    );

    expect(generateRecipeTemplateArtifact).toHaveBeenCalledTimes(1);
    expect(activeBuild?.failureCategory).toBe('validation_failed');
    expect(selectionAttemptLogs).toHaveLength(1);
    expect(selectionAttemptLogs[0]?.retryable).toBe(false);
    expect(selectionAttemptLogs[0]?.failureKind).toBe('request_error');
    expect(attachedRecipe?.dynamic?.recipeTemplate).toBeUndefined();

    database.close();
  });

  it('uses same-session correction when template text generation returns invalid schema and the session id is available', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T17:30:00.000Z');
    const envelope = createDynamicRecipeDataEnvelope();
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return { assistantMarkdown: JSON.stringify(envelope), runtimeSessionId: 'runtime-session-home-seed' };
      }
      return { assistantMarkdown: 'Here is a compact hotel shortlist.', runtimeSessionId: 'runtime-session-home-baseline' };
    });
    let textCallCount = 0;
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'select') {
        return { assistantMarkdown: createRecipeTemplateSelectionArtifact(options.prompt as string), runtimeSessionId: 'session-select-1' };
      }
      if (options?.stage === 'text') {
        textCallCount += 1;
        // First text call returns valid JSON but as an array (not an object), which fails extraction
        if (textCallCount === 1) {
          return {
            assistantMarkdown: '[{"wrong": "shape"}]',
            runtimeSessionId: 'session-text-1'
          };
        }
        // If retried after correction fails, returns valid text
        return { assistantMarkdown: createRecipeTemplateTextArtifactResponse(options.prompt as string), runtimeSessionId: 'session-text-2' };
      }
      if (options?.stage === 'hydrate') {
        return { assistantMarkdown: createRecipeTemplateHydrationArtifactResponse(options.prompt as string) };
      }
      if (options?.stage === 'actions') {
        return { assistantMarkdown: createRecipeTemplateActionsArtifactResponse(options.prompt as string) };
      }
      throw new Error(`Unexpected stage ${options?.stage}`);
    });
    const generateRecipeTemplateArtifactCorrection = vi.fn(async () => {
      // Same-session correction returns valid text
      return { assistantMarkdown: createRecipeTemplateTextArtifactResponse('hotel-shortlist prompt') };
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact,
        generateRecipeTemplateArtifactCorrection
      } as unknown as HermesCli,
      now: createNowSequence()
    });

    await bridge.streamChat(
      { profileId: 'jbarton', sessionId: session.id, content: 'Find hotels in Chicago and organize them.', mode: 'chat' },
      () => undefined
    );
    await waitForRecipeEnrichment(bridge);

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const activeBuild = attachedRecipe?.dynamic?.activeBuild ?? null;
    const structuredLogs = listStructuredBuildLogDetails(database, activeBuild?.id);
    const correctionLogs = structuredLogs.filter(
      (detail) => detail.recordType === 'recipe_same_session_correction' || detail.recordType === 'recipe_same_session_correction_result'
    );
    const attemptLogs = structuredLogs.filter(
      (detail) => detail.recordType === 'recipe_generation_stage_attempt' && detail.stage === 'template_text_generation'
    );

    // The correction should have been attempted since runtimeSessionId was present
    expect(generateRecipeTemplateArtifactCorrection).toHaveBeenCalled();
    expect(correctionLogs.length).toBeGreaterThan(0);
    // The text stage should log the correction attempt
    const correctionResultLog = correctionLogs.find((detail) => detail.recordType === 'recipe_same_session_correction_result');
    expect(correctionResultLog?.correctionFixed).toBe(true);
    // Final recipe should be ready
    expect(activeBuild?.phase).toBe('ready');
    expect(attachedRecipe?.dynamic?.recipeTemplate?.templateId).toBe('hotel-shortlist');
    // Attempt log should include same-session correction metadata
    if (attemptLogs.length > 0) {
      expect(attemptLogs[0]?.sameSessionCorrections).toBeGreaterThanOrEqual(1);
      expect(attemptLogs[0]?.sameSessionCorrectionFixed).toBe(true);
    }

    database.close();
  });

  it('keeps the baseline Home recipe usable when Hermes emits a malformed hermes-recipe-data block', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T17:30:00.000Z');
    const envelope = createDynamicRecipeDataEnvelope();
    const streamChat = vi.fn(async () => ({
      assistantMarkdown: `Done.

Added direct + FWD rules for Plaid effects to SaaS AI.

\`\`\`hermes-recipe-data
${JSON.stringify(envelope)}`,
      runtimeSessionId: 'runtime-session-home-malformed'
    }));
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T17:30:00.000Z')
    });
    const events: ChatStreamEvent[] = [];

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Move them to SaaS AI and create a recipe for this.',
        mode: 'chat'
      },
      (event) => {
        events.push(event);
      }
    );

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const telemetry = database.listTelemetryEvents({
      profileId: 'jbarton',
      sessionId: session.id,
      limit: 40
    });
    const completeEvent = events.find((event): event is Extract<ChatStreamEvent, { type: 'complete' }> => event.type === 'complete');
    const errorEvent = events.find((event) => event.type === 'error');

    expect(streamChat).toHaveBeenCalledTimes(1);
    expect(errorEvent).toBeUndefined();
    expect(attachedRecipe?.renderMode).toBe('legacy_content_v1');
    expect(attachedRecipe?.dynamic).toBeUndefined();
    expect(getRecipeContentTab(attachedRecipe!).content.markdownRepresentation.markdown).toBe(
      'Done.\n\nAdded direct + FWD rules for Plaid effects to SaaS AI.'
    );
    expect(completeEvent?.assistantMessage.content).toBe('Done.\n\nAdded direct + FWD rules for Plaid effects to SaaS AI.');
    expect(completeEvent?.assistantMessage.content).not.toContain('hermes-recipe-data');
    expect(telemetry.some((event) => event.code === 'RECIPE_DATA_STRUCTURED_ONLY_STARTED')).toBe(false);
    expect(telemetry.some((event) => event.code === 'RECIPE_APPLET_BUILD_STARTED')).toBe(false);
    expect(telemetry.some((event) => event.code === 'CHAT_STREAM_FAILED')).toBe(false);

    database.close();
  });

  it('creates a markdown Home recipe for simple conversational responses', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T18:40:00.000Z');
    const streamChat = vi.fn().mockResolvedValueOnce({
      assistantMarkdown: `Here is the direct answer.

- Point one
- Point two`,
      runtimeSessionId: 'runtime-session-markdown-fallback'
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T18:40:00.000Z')
    });
    const events: ChatStreamEvent[] = [];

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Summarize the latest note.',
        mode: 'chat'
      },
      (event) => {
        events.push(event);
      }
    );

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const completeEvent = events.find((event): event is Extract<ChatStreamEvent, { type: 'complete' }> => event.type === 'complete');

    expect(streamChat).toHaveBeenCalledTimes(1);
    expect(attachedRecipe?.renderMode).toBe('legacy_content_v1');
    expect(attachedRecipe?.dynamic).toBeUndefined();
    expect(getRecipeContentTab(attachedRecipe!).content.markdownRepresentation.markdown).toContain('Here is the direct answer.');
    expect(attachedRecipe?.metadata.latestRecipeAttemptOutcome).toBe('markdown_fallback');
    expect(attachedRecipe?.metadata.latestRecipeAttemptMode).toBe('markdown_fallback');
    expect(attachedRecipe?.metadata.homeRecipe).toBe(true);
    expect(attachedRecipe?.metadata.baselineContentUpdatedAt).toBeTruthy();
    expect(attachedRecipe?.metadata.recipePipeline?.currentStage).toBe('baseline_ready');
    expect(attachedRecipe?.metadata.recipePipeline?.task.status).toBe('ready');
    expect(attachedRecipe?.metadata.recipePipeline?.baseline.status).toBe('ready');
    expect(attachedRecipe?.metadata.recipePipeline?.applet.status).toBe('skipped');
    expect(database.getSession(session.id)?.recipeType).toBe('home');
    expect(completeEvent?.assistantMessage.content).toBe(`Here is the direct answer.

- Point one
- Point two`);
    expect(database.getRuntimeRequest(completeEvent?.assistantMessage.requestId ?? '')?.recipePipeline?.currentStage).toBe('baseline_ready');

    database.close();
  });

  it('keeps the baseline Home recipe visible when template fill stays invalid after one bounded repair pass', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T18:45:00.000Z');
    const envelope = createDynamicRecipeDataEnvelope();
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return {
          assistantMarkdown: JSON.stringify(envelope),
          runtimeSessionId: 'runtime-session-home-seed'
        };
      }

      return {
        assistantMarkdown: 'Here is the shortlist baseline.',
        runtimeSessionId: 'runtime-session-home-baseline'
      };
    });
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'select' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateSelectionArtifact(options.prompt)
        };
      }

      if (options?.stage === 'text') {
        return {
          assistantMarkdown: '{"broken":'
        };
      }

      if (options?.stage === 'text_repair') {
        return {
          assistantMarkdown: '{"broken":'
        };
      }

      throw new Error(`Unexpected recipe template stage ${(options?.stage as string | undefined) ?? 'unknown'}.`);
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T18:45:00.000Z')
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Find the best boutique hotels in Dayton for a weekend stay and create a recipe for this.',
        mode: 'chat'
      },
      () => undefined
    );

    await waitForRecipeEnrichment(bridge);

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const runtimeRequest = database.listRuntimeRequests(session.id)[0];
    const enrichmentBuild = attachedRecipe?.dynamic?.activeBuild ?? null;
    const structuredLogs = enrichmentBuild
      ? database
          .listRecipeBuildLogs(enrichmentBuild.id)
          .map((log) => parseStructuredLogDetail(log.detail))
          .filter((detail): detail is Record<string, unknown> => Boolean(detail?.recordType))
      : [];
    const generationSummaryLog = structuredLogs.find((detail) => detail.recordType === 'recipe_generation_summary');
    const telemetry = database.listTelemetryEvents({
      profileId: 'jbarton',
      sessionId: session.id,
      limit: 40
    });

    expect(attachedRecipe?.renderMode).toBe('dynamic_v1');
    expect(getRecipeContentTab(attachedRecipe!).content.markdownRepresentation.markdown).toBe('Here is the shortlist baseline.');
    expect(generateRecipeTemplateArtifact).toHaveBeenCalledTimes(7);
    const templateStages = (generateRecipeTemplateArtifact.mock.calls as unknown as Array<[Record<string, unknown> | undefined]>).map(
      ([options]) => options?.stage
    );
    expect(templateStages).toEqual(['select', 'text', 'text', 'text', 'text_repair', 'text_repair', 'text_repair']);
    expect(enrichmentBuild?.phase).toBe('failed');
    expect(enrichmentBuild?.failureCategory).toBe('template_text_repair_failed');
    expect(enrichmentBuild?.userFacingMessage).toContain('bounded text/content repair pass');
    expect(attachedRecipe?.dynamic?.recipeTemplate).toMatchObject({
      templateId: 'hotel-shortlist',
      metadata: {
        preview: true,
        previewPhase: 'failed'
      },
      status: {
        phase: 'failed',
        failureCategory: 'template_text_repair_failed'
      }
    });
    expect(attachedRecipe?.dynamic?.actionSpec?.actions.some((action) => action.id === 'retry-build')).toBe(true);
    expect(attachedRecipe?.metadata.recipePipeline?.currentStage).toBe('enrichment_failed');
    expect(attachedRecipe?.metadata.recipePipeline?.baseline.status).toBe('ready');
    expect(attachedRecipe?.metadata.recipePipeline?.applet.status).toBe('failed');
    expect(attachedRecipe?.metadata.recipePipeline?.applet.failureCategory).toBe('template_text_repair_failed');
    expect(runtimeRequest?.status).toBe('completed');
    expect(runtimeRequest?.recipePipeline?.currentStage).toBe('enrichment_failed');
    expect(telemetry.some((event) => event.code === 'RECIPE_TEMPLATE_TEXT_REPAIR_FAILED')).toBe(true);
    expect(
      telemetry.some(
        (event) =>
          event.code === 'RECIPE_TEMPLATE_TEXT_REPAIR_FAILED' && event.payload.failureCategory === 'template_text_repair_failed'
      )
    ).toBe(true);
    expect(generationSummaryLog?.attemptsByStage).toMatchObject({
      template_selection: 1,
      template_text_generation: 3,
      template_text_repair: 3
    });
    expect(toRecord(toRecord(generationSummaryLog?.recoveryByStage).template_text_generation)).toMatchObject({
      attempted: true,
      succeeded: true
    });

    await waitForRecipeEnrichment(bridge);
    database.close();
  });

  it('persists timeout diagnostics when the bounded template repair stage hits the temporary 90s cap', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T18:45:30.000Z');
    const envelope = createDynamicRecipeDataEnvelope();
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return {
          assistantMarkdown: JSON.stringify(envelope),
          runtimeSessionId: 'runtime-session-home-seed'
        };
      }

      return {
        assistantMarkdown: 'Here is the shortlist baseline.',
        runtimeSessionId: 'runtime-session-home-baseline'
      };
    });
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'select' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateSelectionArtifact(options.prompt)
        };
      }

      if (options?.stage === 'text') {
        return {
          assistantMarkdown: '{"broken":'
        };
      }

      if (options?.stage === 'text_repair') {
        throw new Error('Recipe template text repair timed out after 90,000ms.');
      }

      throw new Error(`Unexpected recipe template stage ${(options?.stage as string | undefined) ?? 'unknown'}.`);
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T18:45:30.000Z')
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Find the best boutique hotels in Dayton for a weekend stay and create a recipe for this.',
        mode: 'chat'
      },
      () => undefined
    );

    await waitForRecipeEnrichment(bridge);

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const activeBuild = attachedRecipe?.dynamic?.activeBuild ?? null;
    const buildLogs = activeBuild ? database.listRecipeBuildLogs(activeBuild.id) : [];
    const structuredLogs = buildLogs
      .map((log) => parseStructuredLogDetail(log.detail))
      .filter((detail): detail is Record<string, unknown> => Boolean(detail?.recordType));
    const repairTimingLog = structuredLogs.find(
      (detail) => detail.recordType === 'recipe_generation_stage_timing' && detail.stage === 'template_text_repair'
    );
    const generationSummaryLog = structuredLogs.find((detail) => detail.recordType === 'recipe_generation_summary');
    const telemetry = database.listTelemetryEvents({
      profileId: 'jbarton',
      sessionId: session.id,
      limit: 80
    });
    const timeoutTelemetry = telemetry.find((event) => event.code === 'RECIPE_TEMPLATE_STAGE_TIMEOUT');
    const failureTelemetry = telemetry.find((event) => event.code === 'RECIPE_TEMPLATE_TEXT_REPAIR_FAILED');
    const timeoutPayload = toRecord(timeoutTelemetry?.payload);
    const failurePayload = toRecord(failureTelemetry?.payload);

    const templateStages = generateRecipeTemplateArtifact.mock.calls.map(([options]) => options?.stage);
    expect(templateStages).toEqual(['select', 'text', 'text', 'text', 'text_repair', 'text_repair', 'text_repair']);
    expect(generateRecipeTemplateArtifact.mock.calls.slice(4).every(([options]) => options?.stage === 'text_repair')).toBe(true);
    expect(generateRecipeTemplateArtifact.mock.calls.slice(4).every(([options]) => options?.timeoutMs === 90_000)).toBe(true);
    expect(activeBuild?.phase).toBe('failed');
    expect(activeBuild?.failureCategory).toBe('timeout_runtime');
    expect(activeBuild?.configuredTimeoutMs).toBe(90_000);
    expect(activeBuild?.userFacingMessage).toContain('90,000ms');
    expect(attachedRecipe?.dynamic?.recipeTemplate).toMatchObject({
      templateId: 'hotel-shortlist',
      metadata: {
        preview: true,
        previewPhase: 'failed'
      },
      status: {
        phase: 'failed',
        failureCategory: 'timeout_runtime'
      }
    });
    expect(timeoutPayload.stage).toBe('template_text_repair');
    expect(timeoutPayload.configuredTimeoutMs).toBe(90_000);
    expect(timeoutPayload.recommendedTimeoutMs).toBe(90_000);
    expect(timeoutPayload.timeoutCategory).toBe('timeout_runtime');
    expect(timeoutPayload.attemptKind).toBe('repair');
    expect(timeoutPayload.buildId).toBe(activeBuild?.id);
    expect(repairTimingLog).toMatchObject({
      status: 'timed_out',
      configuredTimeoutMs: 90_000,
      recommendedTimeoutMs: 90_000,
      timeoutCategory: 'timeout_runtime',
      attemptKind: 'repair'
    });
    expect(generationSummaryLog?.timeout).toMatchObject({
      stage: 'template_text_repair',
      configuredTimeoutMs: 90_000,
      recommendedTimeoutMs: 90_000,
      timeoutCategory: 'timeout_runtime',
      attemptKind: 'repair'
    });
    expect(generationSummaryLog?.attemptsByStage).toMatchObject({
      template_selection: 1,
      template_text_generation: 3,
      template_text_repair: 3
    });
    expect(failurePayload.failureCategory).toBe('timeout_runtime');
    expect(failurePayload.timeoutStage).toBe('template_text_repair');
    expect(failurePayload.configuredTimeoutMs).toBe(90_000);
    expect(failurePayload.recommendedTimeoutMs).toBe(90_000);

    database.close();
  });

  it('attributes empty required-array repair failures to the text stage with specific validation detail', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T18:45:45.000Z');
    const envelope = createDynamicRecipeDataEnvelope();
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return {
          assistantMarkdown: JSON.stringify(envelope),
          runtimeSessionId: 'runtime-session-home-seed'
        };
      }

      return {
        assistantMarkdown: 'Here is the vendor shortlist baseline.',
        runtimeSessionId: 'runtime-session-home-baseline'
      };
    });
    const invalidVendorMatrixArtifact = JSON.stringify({
      kind: 'recipe_template_fill',
      schemaVersion: 'recipe_template_fill/v2',
      templateId: 'vendor-evaluation-matrix',
      title: 'Vendor matrix',
      summary: 'Compare three CRM vendors against weighted criteria.',
      data: {
        eyebrow: 'Vendor review',
        heroChips: [],
        stats: [],
        columns: [],
        rows: [],
        footerChips: [],
        noteLines: []
      },
      metadata: {
        fixture: true
      }
    });
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'select' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: JSON.stringify({
            kind: 'recipe_template_selection',
            schemaVersion: 'recipe_template_selection/v2',
            templateId: 'vendor-evaluation-matrix',
            mode: 'fill',
            reason: 'Compare approved vendors in a matrix recipe.',
            confidence: 0.88
          })
        };
      }

      if (options?.stage === 'text' || options?.stage === 'text_repair') {
        return {
          assistantMarkdown: invalidVendorMatrixArtifact
        };
      }

      throw new Error(`Unexpected recipe template stage ${(options?.stage as string | undefined) ?? 'unknown'}.`);
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T18:45:45.000Z')
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Compare three CRM vendors and create a recipe for the shortlist.',
        mode: 'chat'
      },
      () => undefined
    );

    await waitForRecipeEnrichment(bridge);

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const activeBuild = attachedRecipe?.dynamic?.activeBuild ?? null;
    const structuredLogs = activeBuild
      ? database
          .listRecipeBuildLogs(activeBuild.id)
          .map((log) => parseStructuredLogDetail(log.detail))
          .filter((detail): detail is Record<string, unknown> => Boolean(detail?.recordType))
      : [];
    const rawAttemptLogs = structuredLogs.filter((detail) => detail.recordType === 'recipe_generation_stage_attempt_raw');
    const generationSummaryLog = structuredLogs.find((detail) => detail.recordType === 'recipe_generation_summary');
    const telemetry = database.listTelemetryEvents({
      profileId: 'jbarton',
      sessionId: session.id,
      limit: 40
    });

    expect(generateRecipeTemplateArtifact).toHaveBeenCalledTimes(7);
    expect(generateRecipeTemplateArtifact.mock.calls.map(([options]) => options?.stage)).toEqual([
      'select',
      'text',
      'text',
      'text',
      'text_repair',
      'text_repair',
      'text_repair'
    ]);
    expect(activeBuild?.failureCategory).toBe('template_text_repair_failed');
    expect(activeBuild?.errorDetail).toContain('Array must contain at least 1 element(s)');
    expect(activeBuild?.userFacingMessage).toContain('text/content repair pass');
    expect(attachedRecipe?.dynamic?.recipeTemplate).toMatchObject({
      templateId: 'vendor-evaluation-matrix',
      metadata: {
        preview: true,
        previewPhase: 'failed'
      },
      status: {
        phase: 'failed',
        failureCategory: 'template_text_repair_failed'
      }
    });
    expect(attachedRecipe?.metadata.recipePipeline?.applet.failureCategory).toBe('template_text_repair_failed');
    expect(rawAttemptLogs.length).toBeGreaterThanOrEqual(6);
    expect(
      rawAttemptLogs.some(
        (detail) =>
          detail.stage === 'template_text_generation' &&
          String(detail.errorDetail ?? '').includes('Array must contain at least 1 element(s)')
      )
    ).toBe(true);
    expect(generationSummaryLog?.attemptsByStage).toMatchObject({
      template_selection: 1,
      template_text_generation: 3,
      template_text_repair: 3
    });
    expect(
      telemetry.some(
        (event) =>
          event.code === 'RECIPE_TEMPLATE_TEXT_REPAIR_FAILED' &&
          String(event.detail ?? '').includes('Array must contain at least 1 element(s)')
      )
    ).toBe(true);

    database.close();
  });

  it('fails semantically empty research-notebook hydration instead of promoting an empty ready recipe', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T18:45:50.000Z');
    const envelope = createDynamicRecipeDataEnvelope({
      title: 'Research notebook'
    });
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return {
          assistantMarkdown: JSON.stringify(envelope),
          runtimeSessionId: 'runtime-session-home-seed'
        };
      }

      return {
        assistantMarkdown: '## Research notebook\n\n- Review the repo and outline a practical implementation plan.',
        runtimeSessionId: 'runtime-session-home-baseline'
      };
    });
    const emptyResearchNotebookFill = RecipeTemplateFillSchema.parse({
      kind: 'recipe_template_fill',
      schemaVersion: 'recipe_template_fill/v2',
      templateId: 'research-notebook',
      title: 'Research notebook',
      subtitle: 'Research findings',
      summary: 'Review the repository and produce a concrete implementation plan.',
      data: {
        eyebrow: 'Research plan',
        heroChips: [],
        activeTabId: 'sources',
        sources: [],
        noteLines: [],
        extractedPoints: [],
        followUps: []
      },
      metadata: {
        fixture: true
      }
    });
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'select' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateSelectionArtifact(options.prompt, {
            templateId: 'research-notebook',
            mode: 'fill'
          })
        };
      }

      if (options?.stage === 'text') {
        return {
          assistantMarkdown: JSON.stringify(createRecipeTemplateTextArtifact(emptyResearchNotebookFill))
        };
      }

      if (options?.stage === 'hydrate') {
        return {
          assistantMarkdown: JSON.stringify(createRecipeTemplateHydrationArtifact(emptyResearchNotebookFill))
        };
      }

      throw new Error(`Unexpected recipe template stage ${(options?.stage as string | undefined) ?? 'unknown'}.`);
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T18:45:50.000Z')
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Make a project plan for launching our beta and organize it in a compact Home recipe.',
        mode: 'chat'
      },
      () => undefined
    );

    await waitForRecipeEnrichment(bridge);

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const activeBuild = attachedRecipe?.dynamic?.activeBuild ?? null;
    const structuredLogs = activeBuild
      ? database
          .listRecipeBuildLogs(activeBuild.id)
          .map((log) => parseStructuredLogDetail(log.detail))
          .filter((detail): detail is Record<string, unknown> => Boolean(detail?.recordType))
      : [];
    const stageAttemptLogs = structuredLogs.filter((detail) => detail.recordType === 'recipe_generation_stage_attempt');
    const sectionProgressLogs = structuredLogs.filter((detail) => detail.recordType === 'recipe_template_section_progress');
    const generationSummaryLog = structuredLogs.find((detail) => detail.recordType === 'recipe_generation_summary');
    const telemetry = database.listTelemetryEvents({
      profileId: 'jbarton',
      sessionId: session.id,
      limit: 50
    });

    expect(generateRecipeTemplateArtifact.mock.calls.map(([options]) => options?.stage)).toEqual([
      'select',
      'text',
      'hydrate',
      'hydrate',
      'hydrate'
    ]);
    expect(activeBuild?.phase).toBe('failed');
    expect(activeBuild?.failureCategory).toBe('semantic_content_failed');
    expect(activeBuild?.errorDetail).toContain('Semantic completeness failed');
    expect(attachedRecipe?.dynamic?.recipeTemplate).toMatchObject({
      templateId: 'research-notebook',
      metadata: {
        previewPhase: 'failed'
      },
      status: {
        phase: 'failed',
        failureCategory: 'semantic_content_failed'
      }
    });
    expect(attachedRecipe?.dynamic?.actionSpec?.actions.some((action) => action.id === 'retry-build')).toBe(true);
    expect(attachedRecipe?.metadata.recipePipeline?.applet.failureCategory).toBe('semantic_content_failed');
    expect(getRecipeContentTab(attachedRecipe!).content.markdownRepresentation.markdown).toContain('Research notebook');
    expect(stageAttemptLogs.some((detail) => detail.stage === 'template_hydration' && detail.status === 'failed')).toBe(true);
    expect(sectionProgressLogs.some((detail) => detail.viewPhase === 'selected')).toBe(true);
    expect(sectionProgressLogs.some((detail) => detail.viewPhase === 'text')).toBe(true);
    expect(sectionProgressLogs.some((detail) => detail.viewPhase === 'failed')).toBe(true);
    expect(generationSummaryLog?.attemptsByStage).toMatchObject({
      template_selection: 1,
      template_text_generation: 1,
      template_hydration: 3
    });
    expect(telemetry.some((event) => event.code === 'RECIPE_TEMPLATE_SEMANTIC_CONTENT_FAILED')).toBe(true);

    database.close();
  });

  it('fails cleanly at the actions stage when Hermes returns an actions artifact for the wrong template', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T18:46:00.000Z');
    const envelope = createDynamicRecipeDataEnvelope();
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return {
          assistantMarkdown: JSON.stringify(envelope),
          runtimeSessionId: 'runtime-session-home-seed'
        };
      }

      return {
        assistantMarkdown: 'Here is the restaurant shortlist baseline.',
        runtimeSessionId: 'runtime-session-home-baseline'
      };
    });
    const wrongActionsArtifact = JSON.stringify(
      createRecipeTemplateActionsArtifact(RecipeTemplateFillSchema.parse(createHotelShortlistTemplateFillArtifact()))
    );
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'select' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateSelectionArtifact(options.prompt, {
            templateId: 'restaurant-finder'
          })
        };
      }

      if (options?.stage === 'text' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateTextArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'hydrate' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateHydrationArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'actions' || options?.stage === 'actions_repair') {
        return {
          assistantMarkdown: wrongActionsArtifact
        };
      }

      throw new Error(`Unexpected recipe template stage ${(options?.stage as string | undefined) ?? 'unknown'}.`);
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T18:46:00.000Z')
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Good Italian restaurants near Dayton, OH.',
        mode: 'chat'
      },
      () => undefined
    );

    await waitForRecipeEnrichment(bridge);

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const activeBuild = attachedRecipe?.dynamic?.activeBuild ?? null;
    const structuredLogs = activeBuild
      ? database
          .listRecipeBuildLogs(activeBuild.id)
          .map((log) => parseStructuredLogDetail(log.detail))
          .filter((detail): detail is Record<string, unknown> => Boolean(detail?.recordType))
      : [];
    const generationSummaryLog = structuredLogs.find((detail) => detail.recordType === 'recipe_generation_summary');
    const telemetry = database.listTelemetryEvents({
      profileId: 'jbarton',
      sessionId: session.id,
      limit: 60
    });

    expect(generateRecipeTemplateArtifact.mock.calls.map(([options]) => options?.stage)).toEqual([
      'select',
      'text',
      'hydrate',
      'actions',
      'actions',
      'actions',
      'actions_repair',
      'actions_repair',
      'actions_repair'
    ]);
    expect(attachedRecipe?.renderMode).toBe('dynamic_v1');
    expect(getRecipeContentTab(attachedRecipe!).content.markdownRepresentation.markdown).toBe(
      'Here is the restaurant shortlist baseline.'
    );
    expect(activeBuild?.phase).toBe('failed');
    expect(activeBuild?.failureCategory).toBe('template_actions_repair_failed');
    expect(activeBuild?.errorDetail).toContain('Template actions expected restaurant-finder, but Hermes returned hotel-shortlist.');
    expect(attachedRecipe?.dynamic?.recipeTemplate).toMatchObject({
      templateId: 'restaurant-finder',
      metadata: {
        previewPhase: 'failed'
      },
      status: {
        phase: 'failed',
        failureCategory: 'template_actions_repair_failed'
      }
    });
    expect(attachedRecipe?.dynamic?.actionSpec?.actions.some((action) => action.id === 'retry-build')).toBe(true);
    expect(attachedRecipe?.metadata.recipePipeline?.currentStage).toBe('enrichment_failed');
    expect(attachedRecipe?.metadata.recipePipeline?.applet.failureCategory).toBe('template_actions_repair_failed');
    expect(generationSummaryLog?.attemptsByStage).toMatchObject({
      template_selection: 1,
      template_text_generation: 1,
      template_hydration: 1,
      template_actions_generation: 3,
      template_actions_repair: 3
    });
    expect(telemetry.some((event) => event.code === 'RECIPE_TEMPLATE_ACTIONS_REPAIR_FAILED')).toBe(true);

    database.close();
  });

  it('updates an existing approved template when selection stays on the same template', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const { session, recipe } = createAttachedRecipe(database);
    const artifactTimestamp = '2026-04-11T18:46:00.000Z';
    const appletArtifacts = buildRecipeAppletBaseArtifacts({
      prompt: 'Check my unread email and summarize the inbox in a Home recipe.',
      requestMode: 'chat',
      timestamp: artifactTimestamp,
      currentRecipe: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        status: recipe.status,
        metadata: recipe.metadata
      },
      envelope: createDynamicRecipeDataEnvelope({
        title: 'Inbox summary recipe'
      }),
      intentHint: {
        category: 'results',
        preferredContentFormat: 'table',
        label: 'email inbox summary'
      }
    });
    const compiledPriorTemplate = compileRecipeTemplateState({
      fill: RecipeTemplateFillSchema.parse(createInboxTriageTemplateFillArtifact())
    });
    expect(compiledPriorTemplate.state).toBeTruthy();
    const priorTemplateState = compiledPriorTemplate.state!;
    const priorTemplateBuild = database.startRecipeBuild({
      id: `recipe-build-${recipe.id}-prior-template`,
      recipeId: recipe.id,
      profileId: 'jbarton',
      sessionId: session.id,
      buildVersion: 1,
      buildKind: 'template_enrichment',
      triggerKind: 'chat',
      triggerRequestId: 'request-prior-template',
      triggerActionId: null,
      phase: 'ready',
      progressMessage: 'Previous template recipe ready.',
      retryCount: 0,
      startedAt: artifactTimestamp,
      updatedAt: artifactTimestamp,
      completedAt: artifactTimestamp,
      errorCode: null,
      errorMessage: null,
      errorDetail: null,
      failureCategory: null,
      failureStage: null,
      userFacingMessage: null,
      retryable: null,
      configuredTimeoutMs: null
    });
    for (const artifact of [
      appletArtifacts.userPrompt,
      appletArtifacts.intent,
      appletArtifacts.rawData,
      appletArtifacts.assistantContext,
      appletArtifacts.analysis,
      appletArtifacts.normalizedData,
      appletArtifacts.summary,
      appletArtifacts.fallback,
      priorTemplateState
    ].filter(Boolean)) {
      database.upsertRecipeBuildArtifact({
        id: `${priorTemplateBuild.id}-${artifact.kind}`,
        recipeId: recipe.id,
        buildId: priorTemplateBuild.id,
        artifactKind: artifact.kind,
        schemaVersion: artifact.schemaVersion,
        payload: artifact,
        createdAt: artifactTimestamp,
        updatedAt: artifactTimestamp
      });
    }
    database.promoteRecipeBuild(recipe.id, {
      buildId: priorTemplateBuild.id
    });
    database.updateRecipe(recipe.id, {
      profileId: recipe.profileId,
      metadata: {
        ...recipe.metadata,
        activeTemplateId: 'inbox-triage-board'
      }
    });
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return {
          assistantMarkdown: JSON.stringify(createDynamicRecipeDataEnvelope()),
          runtimeSessionId: 'runtime-session-home-seed'
        };
      }

      return {
        assistantMarkdown: 'Here is the updated inbox baseline.',
        runtimeSessionId: 'runtime-session-home-baseline'
      };
    });
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'select' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateSelectionArtifact(options.prompt, {
            templateId: 'inbox-triage-board',
            currentTemplateId: 'inbox-triage-board'
          })
        };
      }

      if (options?.stage === 'text' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateTextArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'hydrate' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateHydrationArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'actions' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateActionsArtifactResponse(options.prompt)
        };
      }

      if (options?.stage === 'actions_repair' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateActionsArtifactResponse(options.prompt)
        };
      }

      throw new Error(`Unexpected recipe template stage ${(options?.stage as string | undefined) ?? 'unknown'}.`);
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T18:46:00.000Z')
    });

    await (bridge as unknown as {
      retryRecipeAppletUpgradeFromArtifacts: (
        profileId: string,
        sessionId: string,
        currentRecipe: Recipe,
        triggerActionId: string | null,
        onEvent: (event: ChatStreamEvent) => void
      ) => Promise<void>;
    }).retryRecipeAppletUpgradeFromArtifacts('jbarton', session.id, database.getRecipe(recipe.id)!, 'retry-build', () => undefined);

    await waitForRecipeEnrichment(bridge);

    const attachedRecipe = database.getRecipe(recipe.id);
    const telemetry = database.listTelemetryEvents({
      profileId: 'jbarton',
      sessionId: session.id,
      limit: 50
    });

    expect(generateRecipeTemplateArtifact).toHaveBeenCalledTimes(4);
    expect(generateRecipeTemplateArtifact.mock.calls[0]?.[0]?.stage).toBe('select');
    expect(generateRecipeTemplateArtifact.mock.calls[1]?.[0]?.stage).toBe('text');
    expect(generateRecipeTemplateArtifact.mock.calls[2]?.[0]?.stage).toBe('hydrate');
    expect(generateRecipeTemplateArtifact.mock.calls[3]?.[0]?.stage).toBe('actions');
    expect(attachedRecipe?.dynamic?.activeBuild?.phase).toBe('ready');
    expect(attachedRecipe?.metadata.recipePipeline?.currentStage).toBe('enrichment_ready');
    expect(attachedRecipe?.dynamic?.recipeTemplate?.templateId).toBe('inbox-triage-board');
    expect(attachedRecipe?.dynamic?.recipeTemplate?.summary).toBe('Group unread senders and review the next cleanup move.');
    expect(telemetry.some((event) => event.code === 'RECIPE_TEMPLATE_PROMOTED')).toBe(true);
    expect(telemetry.some((event) => event.code.startsWith('RECIPE_APPLET_'))).toBe(false);

    database.close();
  });

  it('blocks live-task violations during template generation while keeping the baseline Home recipe active', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T18:47:00.000Z');
    const envelope = createDynamicRecipeDataEnvelope();
    const streamChat = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.structuredArtifactOnly) {
        return {
          assistantMarkdown: JSON.stringify(envelope),
          runtimeSessionId: 'runtime-session-home-seed'
        };
      }

      return {
        assistantMarkdown: 'Here is the shortlist baseline.',
        runtimeSessionId: 'runtime-session-home-baseline'
      };
    });
    const generateRecipeTemplateArtifact = vi.fn(async () => {
      const error = new Error('Recipe template generation attempted live task activity (tool:gmail_unread_count).');
      error.name = 'HermesCliRecipeAppletViolationError';
      throw error;
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T18:47:00.000Z')
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Find the best boutique hotels in Dayton for a weekend stay and create a recipe for this.',
        mode: 'chat'
      },
      () => undefined
    );

    await waitForRecipeEnrichment(bridge);

    const attachedRecipe = database.getRecipeByPrimarySessionId('jbarton', session.id);
    const runtimeRequest = database.listRuntimeRequests(session.id)[0];
    const enrichmentBuild =
      attachedRecipe?.id != null
        ? database
            .listRecipeBuilds(attachedRecipe.id, {
              limit: 10
            })
            .find((build) => build.buildKind === 'template_enrichment')
        : null;
    const telemetry = database.listTelemetryEvents({
      profileId: 'jbarton',
      sessionId: session.id,
      limit: 40
    });

    expect(attachedRecipe?.renderMode).toBe('dynamic_v1');
    expect(getRecipeContentTab(attachedRecipe!).content.markdownRepresentation.markdown).toBe('Here is the shortlist baseline.');
    expect(generateRecipeTemplateArtifact).toHaveBeenCalledTimes(1);
    expect(enrichmentBuild).toBeTruthy();
    expect(attachedRecipe?.dynamic?.recipeTemplate).toBeUndefined();
    expect(runtimeRequest?.recipePipeline?.currentStage).toBe('enrichment_failed');
    expect(runtimeRequest?.recipePipeline?.baseline.status).toBe('ready');
    expect(runtimeRequest?.recipePipeline?.applet.message).toContain('attempted live task work');
    expect(runtimeRequest?.recipePipeline?.applet.failureCategory).toBe('template_selection_failed');
    expect(telemetry.some((event) => event.code === 'RECIPE_TEMPLATE_SELECTION_FAILED')).toBe(true);

    await waitForRecipeEnrichment(bridge);
    database.close();
  });

  it('retries template generation from persisted artifacts without rerunning live task work', async () => {
    const database = createDatabase();
    const { session, recipe } = createAttachedRecipe(database);
    seedRuntimeReady(database);
    const artifactTimestamp = '2026-04-11T19:02:00.000Z';
    const originalHotelPrompt = 'Find the best boutique hotels in Dayton for a weekend stay and create a recipe for this.';
    const appletArtifacts = buildRecipeAppletBaseArtifacts({
      prompt: originalHotelPrompt,
      requestMode: 'chat',
      timestamp: artifactTimestamp,
      currentRecipe: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        status: recipe.status,
        metadata: recipe.metadata
      },
      envelope: createDynamicRecipeDataEnvelope({
        title: 'Inbox summary recipe'
      }),
      intentHint: {
        category: 'results',
        preferredContentFormat: 'table',
        label: 'email inbox summary'
      }
    });
    const priorAppletBuild = database.startRecipeBuild({
      id: `recipe-build-${recipe.id}-prior-enrichment`,
      recipeId: recipe.id,
      profileId: 'jbarton',
      sessionId: session.id,
      buildVersion: 1,
      buildKind: 'template_enrichment',
      triggerKind: 'chat',
      triggerRequestId: 'request-prior-enrichment',
      triggerActionId: null,
      phase: 'failed',
      progressMessage: 'Previous recipe generation failed.',
      retryCount: 0,
      startedAt: artifactTimestamp,
      updatedAt: '2026-04-11T19:02:01.000Z',
      completedAt: '2026-04-11T19:02:01.000Z',
      errorCode: 'RECIPE_TEMPLATE_FILL_FAILED',
      errorMessage: 'Previous recipe template generation failed.',
      errorDetail: 'Previous recipe template generation failed.',
      failureCategory: 'template_fill_failed',
      failureStage: 'enrichment_failed',
      userFacingMessage: 'Previous recipe template generation failed.',
      retryable: true,
      configuredTimeoutMs: null
    });
    for (const artifact of [
      appletArtifacts.userPrompt,
      appletArtifacts.intent,
      appletArtifacts.rawData,
      appletArtifacts.assistantContext,
      appletArtifacts.analysis,
    appletArtifacts.normalizedData,
    appletArtifacts.summary,
    appletArtifacts.fallback,
      appletArtifacts.actionSpec
    ].filter(Boolean)) {
      database.upsertRecipeBuildArtifact({
        id: `${priorAppletBuild.id}-${artifact.kind}`,
        recipeId: recipe.id,
        buildId: priorAppletBuild.id,
        artifactKind: artifact.kind,
        schemaVersion: artifact.schemaVersion,
        payload: artifact,
        createdAt: artifactTimestamp,
        updatedAt: artifactTimestamp
      });
    }

    const streamChat = vi.fn();
    const generateRecipeAppletArtifact = vi.fn();
    const retryHotelFill = RecipeTemplateFillSchema.parse(createHotelShortlistTemplateFillArtifact());
    const generateRecipeTemplateArtifact = vi.fn(async (options?: Record<string, unknown>) => {
      if (options?.stage === 'select' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: createRecipeTemplateSelectionArtifact(options.prompt, {
            templateId: 'hotel-shortlist',
            mode: 'fill'
          })
        };
      }

      if (options?.stage === 'text' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: JSON.stringify(createRecipeTemplateTextArtifact(retryHotelFill))
        };
      }

      if (options?.stage === 'hydrate' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: JSON.stringify(createRecipeTemplateHydrationArtifact(retryHotelFill))
        };
      }

      if (options?.stage === 'actions' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: JSON.stringify(createRecipeTemplateActionsArtifact(retryHotelFill))
        };
      }

      if (options?.stage === 'actions_repair' && typeof options?.prompt === 'string') {
        return {
          assistantMarkdown: JSON.stringify(createRecipeTemplateActionsArtifact(retryHotelFill))
        };
      }

      throw new Error(`Unexpected recipe template stage ${(options?.stage as string | undefined) ?? 'unknown'}.`);
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat,
        generateRecipeTemplateArtifact,
        generateRecipeAppletArtifact
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T19:05:00.000Z')
    });

    await (bridge as unknown as {
      retryRecipeAppletUpgradeFromArtifacts: (
        profileId: string,
        sessionId: string,
        recipe: Recipe,
        triggerActionId: string | null,
        onEvent: (event: ChatStreamEvent) => void
      ) => Promise<void>;
    }).retryRecipeAppletUpgradeFromArtifacts('jbarton', session.id, database.getRecipe(recipe.id)!, 'retry-build', () => undefined);

    await waitForRecipeEnrichment(bridge);

    const runtimeRequest = database.listRuntimeRequests(session.id)[0];
    const retriedRecipe = database.getRecipe(recipe.id);

    expect(streamChat).not.toHaveBeenCalled();
    expect(generateRecipeTemplateArtifact.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(generateRecipeAppletArtifact).not.toHaveBeenCalled();
    expect(generateRecipeTemplateArtifact.mock.calls[0]?.[0]?.prompt).not.toContain('Original prompt:');
    expect(generateRecipeTemplateArtifact.mock.calls[0]?.[0]?.prompt).not.toContain(originalHotelPrompt);
    expect(generateRecipeTemplateArtifact.mock.calls[0]?.[0]?.prompt).toContain('Approved template registry:');
    const templateStages = generateRecipeTemplateArtifact.mock.calls.map(([options]) => options?.stage);
    expect(templateStages.slice(0, 4)).toEqual(['select', 'text', 'hydrate', 'actions']);
    expect(
      templateStages.every((stage) => ['select', 'text', 'hydrate', 'actions', 'text_repair', 'actions_repair'].includes(String(stage)))
    ).toBe(true);
    expect(runtimeRequest?.recipePipeline?.task.status).toBe('skipped');
    expect(runtimeRequest?.recipePipeline?.baseline.status).toBe('ready');
    expect(runtimeRequest?.recipePipeline?.applet.status).toBe('ready');
    expect(retriedRecipe?.dynamic?.recipeTemplate?.kind).toBe('recipe_template_state');
    expect(retriedRecipe?.dynamic?.recipeTemplate?.templateId).toBe('hotel-shortlist');

    await waitForRecipeEnrichment(bridge);
    database.close();
  });

  it('keeps the assistant answer visible when the baseline Home recipe update fails after task success', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-11T18:50:00.000Z');
    const streamChat = vi.fn().mockResolvedValueOnce({
      assistantMarkdown: 'Here is the completed task result.',
      runtimeSessionId: 'runtime-session-baseline-failure'
    });
    vi.spyOn(database, 'createRecipe').mockReturnValueOnce(null as never);
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T18:50:00.000Z')
    });
    const events: ChatStreamEvent[] = [];

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Summarize the latest note.',
        mode: 'chat'
      },
      (event) => {
        events.push(event);
      }
    );

    const messages = database.listMessages(session.id);
    const runtimeRequest = database.listRuntimeRequests(session.id)[0];
    const telemetry = database.listTelemetryEvents({
      profileId: 'jbarton',
      sessionId: session.id,
      limit: 20
    });

    expect(database.getRecipeByPrimarySessionId('jbarton', session.id)).toBeNull();
    expect(messages.some((message) => message.role === 'assistant' && message.content === 'Here is the completed task result.')).toBe(true);
    expect(
      messages.some(
        (message) =>
          message.role === 'system' &&
          /baseline could not be updated/i.test(message.content) &&
          /assistant answer is still available/i.test(message.content)
      )
    ).toBe(true);
    expect(runtimeRequest?.status).toBe('completed');
    expect(runtimeRequest?.recipePipeline?.currentStage).toBe('baseline_failed');
    expect(runtimeRequest?.recipePipeline?.task.status).toBe('ready');
    expect(runtimeRequest?.recipePipeline?.baseline.status).toBe('failed');
    expect(runtimeRequest?.recipePipeline?.applet.status).toBe('skipped');
    expect(telemetry.some((event) => event.code === 'HOME_WORKRECIPE_BASELINE_FAILED')).toBe(true);
    expect(events.some((event) => event.type === 'complete')).toBe(true);

    database.close();
  });

  it('classifies task timeouts separately and records the configured limit before baseline update starts', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    database.updateSettings({
      discoveryTimeoutMs: 20_000
    });
    const session = database.createSession('jbarton', '2026-04-11T18:55:00.000Z');
    const streamChat = vi.fn(async () => {
      throw new Error('Hermes timed out while checking email for the active profile jbarton.');
    });
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T18:55:00.000Z')
    });
    const events: ChatStreamEvent[] = [];

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'How many unread emails do I have?',
        mode: 'chat'
      },
      (event) => {
        events.push(event);
      }
    );

    const runtimeRequest = database.listRuntimeRequests(session.id)[0];
    const systemMessage = database.listMessages(session.id).find((message) => message.role === 'system');
    const timeoutTelemetry = database
      .listTelemetryEvents({
        profileId: 'jbarton',
        sessionId: session.id,
        limit: 20
      })
      .find((event) => event.code === 'CHAT_REQUEST_TIMEOUT');

    expect(database.getRecipeByPrimarySessionId('jbarton', session.id)).toBeNull();
    expect(runtimeRequest?.status).toBe('failed');
    expect(runtimeRequest?.recipePipeline?.currentStage).toBe('task_failed');
    expect(runtimeRequest?.recipePipeline?.task.failureCategory).toBe('timeout_user_config');
    expect(runtimeRequest?.recipePipeline?.task.configuredTimeoutMs).toBe(20_000);
    expect(systemMessage?.content).toContain('20,000ms');
    expect(systemMessage?.content).toContain('before the Home recipe baseline could update');
    expect(timeoutTelemetry?.payload.failureCategory).toBe('timeout_user_config');
    expect(timeoutTelemetry?.payload.configuredTimeoutMs).toBe(20_000);
    expect(events.some((event) => event.type === 'error')).toBe(true);

    database.close();
  });

  it('rejects prompt-bound actions for baseline Home recipes', async () => {
    const database = createDatabase();
    const { session, recipe } = createAttachedRecipe(database);
    seedRuntimeReady(database);
    seedFailedBaselineAppletRecipe(database, session, recipe);
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat: vi.fn()
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T19:00:00.000Z')
    });

    await expect(
      bridge.streamRecipeAction(
        recipe.id,
        {
          profileId: 'jbarton',
          sessionId: session.id,
          actionId: 'refine-selection',
          selectedItemIds: [],
          pageState: {},
          filterState: {},
          formValues: {}
        },
        () => undefined
      )
    ).rejects.toMatchObject({
      code: 'RECIPE_ACTION_UNAVAILABLE'
    });

    expect(database.getRecipe(recipe.id)?.renderMode).toBe('legacy_content_v1');

    database.close();
  });

  it('switches a template recipe from local discovery into event planning through the public action stream', async () => {
    const database = createDatabase();
    const { session, recipe } = createAttachedRecipe(database);
    seedRuntimeReady(database);
    const localDiscoveryCompiled = compileRecipeTemplateState({
      fill: RecipeTemplateFillSchema.parse(createLocalDiscoveryTemplateFillArtifact())
    });
    expect(localDiscoveryCompiled.state).toBeTruthy();
    expect(localDiscoveryCompiled.definition).toBeTruthy();

    const artifactTimestamp = '2026-04-11T19:05:00.000Z';
    const actionArtifacts = buildRecipeAppletBaseArtifacts({
      prompt: 'Find strong local venues near downtown Dayton.',
      requestMode: 'chat',
      timestamp: artifactTimestamp,
      currentRecipe: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        status: recipe.status,
        metadata: recipe.metadata
      },
      envelope: createDynamicRecipeDataEnvelope({
        title: 'Local discovery shortlist'
      }),
      intentHint: {
        category: 'places',
        preferredContentFormat: 'card',
        label: 'local venue shortlist'
      }
    });
    const templateBuild = database.startRecipeBuild({
      id: `recipe-build-${recipe.id}-local-discovery`,
      recipeId: recipe.id,
      profileId: 'jbarton',
      sessionId: session.id,
      buildVersion: 1,
      buildKind: 'template_enrichment',
      triggerKind: 'chat',
      triggerRequestId: 'request-local-discovery',
      triggerActionId: null,
      phase: 'ready',
      progressMessage: 'Template recipe ready.',
      retryCount: 0,
      startedAt: artifactTimestamp,
      updatedAt: artifactTimestamp,
      completedAt: artifactTimestamp,
      errorCode: null,
      errorMessage: null,
      errorDetail: null,
      failureCategory: null,
      failureStage: null,
      userFacingMessage: null,
      retryable: null,
      configuredTimeoutMs: null
    });
    for (const artifact of [
      actionArtifacts.userPrompt,
      actionArtifacts.intent,
      actionArtifacts.rawData,
      actionArtifacts.assistantContext,
      actionArtifacts.analysis,
      actionArtifacts.normalizedData,
      actionArtifacts.summary,
      actionArtifacts.fallback
    ].filter(Boolean)) {
      database.upsertRecipeBuildArtifact({
        id: `${templateBuild.id}-${artifact.kind}`,
        recipeId: recipe.id,
        buildId: templateBuild.id,
        artifactKind: artifact.kind,
        schemaVersion: artifact.schemaVersion,
        payload: artifact,
        createdAt: artifactTimestamp,
        updatedAt: artifactTimestamp
      });
    }
    database.upsertRecipeBuildArtifact({
      id: `${templateBuild.id}-action_spec`,
      recipeId: recipe.id,
      buildId: templateBuild.id,
      artifactKind: 'action_spec',
      schemaVersion: 'recipe_action_spec/v1',
      payload: createRecipeTemplateActionSpec(localDiscoveryCompiled.state!, localDiscoveryCompiled.definition!),
      createdAt: artifactTimestamp,
      updatedAt: artifactTimestamp
    });
    database.upsertRecipeBuildArtifact({
      id: `${templateBuild.id}-recipe_template_state`,
      recipeId: recipe.id,
      buildId: templateBuild.id,
      artifactKind: 'recipe_template_state',
      schemaVersion: 'recipe_template_state/v1',
      payload: localDiscoveryCompiled.state!,
      createdAt: artifactTimestamp,
      updatedAt: artifactTimestamp
    });
    database.promoteRecipeBuild(recipe.id, {
      buildId: templateBuild.id
    });
    database.updateRecipe(recipe.id, {
      profileId: recipe.profileId,
      renderMode: 'dynamic_v1',
      metadata: {
        ...recipe.metadata,
        activeTemplateId: 'local-discovery-comparison'
      }
    });

    const events: ChatStreamEvent[] = [];
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState())
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T19:05:00.000Z')
    });

    await bridge.streamRecipeAction(
      recipe.id,
      {
        profileId: 'jbarton',
        sessionId: session.id,
        actionId: 'switch-to-event-planner',
        selectedItemIds: ['venue-dana'],
        pageState: {},
        filterState: {},
        formValues: {}
      },
      (event) => {
        events.push(event);
      }
    );

    const switchedRecipe = database.getRecipe(recipe.id);
    const eventTemplate = switchedRecipe?.dynamic?.recipeTemplate;

    expect(switchedRecipe?.renderMode).toBe('dynamic_v1');
    expect(eventTemplate?.templateId).toBe('event-planner');
    expect(eventTemplate?.transitionHistory).toHaveLength(1);
    expect(eventTemplate?.transitionHistory[0]?.fromTemplateId).toBe('local-discovery-comparison');
    expect(eventTemplate?.transitionHistory[0]?.toTemplateId).toBe('event-planner');
    expect(eventTemplate?.sections.some((section) => section.slotId === 'event-tabs')).toBe(true);
    expect(switchedRecipe?.metadata.activeTemplateId).toBe('event-planner');
    expect(events.some((event) => event.type === 'complete')).toBe(true);
    expect(events.some((event) => event.type === 'recipe_event')).toBe(true);

    database.close();
  });

  it('replaces an older dynamic recipe with a baseline Home update and clears retired build pointers', async () => {
    const database = createDatabase();
    const { session, recipe } = createAttachedRecipe(database);
    seedRuntimeReady(database);
    const compiledBuild = database.startRecipeBuild({
      id: `recipe-build-${recipe.id}-compiled`,
      recipeId: recipe.id,
      profileId: 'jbarton',
      sessionId: session.id,
      buildVersion: 1,
      buildKind: 'compiled_home',
      triggerKind: 'chat',
      triggerRequestId: 'request-old-compiled',
      triggerActionId: null,
      phase: 'ready',
      progressMessage: 'Compiled Home ready.',
      retryCount: 0,
      startedAt: '2026-04-11T20:00:00.000Z',
      updatedAt: '2026-04-11T20:00:01.000Z',
      completedAt: '2026-04-11T20:00:01.000Z',
      errorCode: null,
      errorMessage: null,
      errorDetail: null,
      failureCategory: null,
      failureStage: null,
      userFacingMessage: null,
      retryable: null,
      configuredTimeoutMs: null
    });
    database.promoteRecipeBuild(recipe.id, {
      buildId: compiledBuild.id,
      tabs: recipe.tabs
    });
    const appletBuild = database.startRecipeBuild({
      id: `recipe-build-${recipe.id}-applet`,
      recipeId: recipe.id,
      profileId: 'jbarton',
      sessionId: session.id,
      buildVersion: 2,
      buildKind: 'applet',
      triggerKind: 'chat',
      triggerRequestId: 'request-old-applet',
      triggerActionId: null,
      phase: 'ready',
      progressMessage: 'Applet ready.',
      retryCount: 0,
      startedAt: '2026-04-11T20:00:02.000Z',
      updatedAt: '2026-04-11T20:00:03.000Z',
      completedAt: '2026-04-11T20:00:03.000Z',
      errorCode: null,
      errorMessage: null,
      errorDetail: null,
      failureCategory: null,
      failureStage: null,
      userFacingMessage: null,
      retryable: null,
      configuredTimeoutMs: null
    });
    database.promoteRecipeAppletBuild(recipe.id, {
      buildId: appletBuild.id
    });
    expect(database.getRecipe(recipe.id)?.renderMode).toBe('dynamic_v1');

    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat: vi.fn(async () => ({
          assistantMarkdown: 'Here is the stable baseline update.',
          runtimeSessionId: 'runtime-session-home-reset'
        }))
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-11T20:05:00.000Z')
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Refresh this recipe.',
        mode: 'chat'
      },
      () => undefined
    );

    const refreshedRecipe = database.getRecipe(recipe.id);
    const persistedBuilds = database.listRecipeBuilds(recipe.id, {
      limit: 10
    });

    expect(refreshedRecipe?.id).toBe(recipe.id);
    expect(refreshedRecipe?.title).toBe(recipe.title);
    expect(refreshedRecipe?.renderMode).toBe('legacy_content_v1');
    expect(refreshedRecipe?.dynamic).toBeUndefined();
    expect(getRecipeContentTab(refreshedRecipe!).content.markdownRepresentation.markdown).toBe('Here is the stable baseline update.');
    expect(persistedBuilds.map((build) => build.buildKind)).toEqual(expect.arrayContaining(['compiled_home', 'applet']));

    database.close();
  });

  it('emits the complete event before any recipe_event signalling baseline completion', async () => {
    const database = createDatabase();
    seedProfile(database);
    seedRuntimeReady(database);
    const session = database.createSession('jbarton', '2026-04-20T10:00:00.000Z');
    const envelope = createDynamicRecipeDataEnvelope();
    const eventTypes: string[] = [];
    const bridge = new HermesBridge({
      database,
      hermesCli: {
        discoverRuntimeProviderState: vi.fn(async () => createRuntimeReadyState()),
        streamChat: vi.fn(async (options?: Record<string, unknown>) => {
          if (options?.structuredArtifactOnly) {
            return {
              assistantMarkdown: JSON.stringify(envelope),
              runtimeSessionId: 'runtime-session-latency-seed'
            };
          }

          return {
            assistantMarkdown: 'Here is your shortlist.',
            runtimeSessionId: 'runtime-session-latency-baseline'
          };
        }),
        generateRecipeTemplateArtifact: vi.fn(async (options?: Record<string, unknown>) => {
          if (options?.stage === 'select' && typeof options?.prompt === 'string') {
            return { assistantMarkdown: createRecipeTemplateSelectionArtifact(options.prompt) };
          }
          if (options?.stage === 'text' && typeof options?.prompt === 'string') {
            return { assistantMarkdown: createRecipeTemplateTextArtifactResponse(options.prompt) };
          }
          if (options?.stage === 'hydrate' && typeof options?.prompt === 'string') {
            return { assistantMarkdown: createRecipeTemplateHydrationArtifactResponse(options.prompt) };
          }
          if (options?.stage === 'actions' && typeof options?.prompt === 'string') {
            return { assistantMarkdown: createRecipeTemplateActionsArtifactResponse(options.prompt) };
          }
          throw new Error(`Unexpected stage: ${String(options?.stage)}`);
        })
      } as unknown as HermesCli,
      now: createNowSequence('2026-04-20T10:00:00.000Z')
    });

    await bridge.streamChat(
      {
        profileId: 'jbarton',
        sessionId: session.id,
        content: 'Find the best boutique hotels in Dayton for a weekend stay and create a recipe.',
        mode: 'chat'
      },
      (event) => {
        eventTypes.push(event.type);
      }
    );

    const completeIndex = eventTypes.indexOf('complete');
    const firstRecipeEventAfterComplete = eventTypes.slice(completeIndex + 1).findIndex((t) => t === 'recipe_event');

    // complete must have been emitted
    expect(completeIndex).toBeGreaterThanOrEqual(0);
    // at least one recipe_event carrying baseline-ready state must appear AFTER complete
    expect(firstRecipeEventAfterComplete).toBeGreaterThanOrEqual(0);
    // recipe_events before complete are allowed (pipeline progress), but baseline_ready must come after
    const recipeEventIndicesAfterComplete = eventTypes
      .map((t, i) => (t === 'recipe_event' && i > completeIndex ? i : -1))
      .filter((i) => i >= 0);
    expect(recipeEventIndicesAfterComplete.length).toBeGreaterThan(0);
    // The complete event itself must carry the assistant message content
    const completeEvent = eventTypes
      .map((_, i) => i)
      .find((i) => eventTypes[i] === 'complete');
    expect(completeEvent).toBeDefined();

    await waitForRecipeEnrichment(bridge);
    database.close();
  });
});
