import type {
  RecipeActionDefinition,
  RecipeActionVisibility,
  RecipeBridgeActionHandler,
  RecipePromptAction,
  RecipeTemplateId,
  RecipeTemplateSection,
  RecipeTemplateUpdateOperation
} from '@hermes-recipes/protocol';

interface RecipeTemplateSlotDefinition {
  id: string;
  kind: RecipeTemplateSection['kind'];
  required?: boolean;
}

interface RecipeTemplateTransitionDefinition {
  targetTemplateId: RecipeTemplateId;
  reason: string;
  migration: 'local-discovery-to-event-planner';
}

export interface RecipeTemplateRuntimeDefinition {
  id: RecipeTemplateId;
  name: string;
  useCase: string;
  enabled?: boolean;
  selectionSignals: string[];
  slots: RecipeTemplateSlotDefinition[];
  allowedUpdateOps: RecipeTemplateUpdateOperation['op'][];
  actions: Record<string, RecipeActionDefinition>;
  transitions: RecipeTemplateTransitionDefinition[];
}

function bridgeAction(
  id: string,
  label: string,
  handler: RecipeBridgeActionHandler,
  options: {
    description?: string;
    intent?: RecipeActionDefinition['intent'];
    visibility?: Partial<RecipeActionVisibility>;
    payload?: Record<string, unknown>;
    prompt?: RecipePromptAction;
  } = {}
): RecipeActionDefinition {
  return {
    id,
    label,
    kind: 'bridge',
    intent: options.intent ?? 'neutral',
    description: options.description,
    prompt: options.prompt,
    visibility: {
      requiresSelection: options.visibility?.requiresSelection ?? 'none',
      whenBuildReady: options.visibility?.whenBuildReady ?? true,
      datasetId: options.visibility?.datasetId
    },
    bridge: {
      handler,
      payload: options.payload ?? {}
    },
    metadata: {}
  };
}

const DEFAULT_TEMPLATE_ACTIONS: Record<string, RecipeActionDefinition> = {
  'refresh-recipe': bridgeAction('refresh-recipe', 'Refresh recipe', 'refresh_space', {
    description: 'Regenerate the recipe from the latest session context.',
    intent: 'secondary',
    visibility: {
      requiresSelection: 'none',
      whenBuildReady: false
    }
  }),
  'retry-build': bridgeAction('retry-build', 'Rebuild recipe', 'retry_build', {
    description: 'Retry template generation from persisted artifacts.',
    intent: 'secondary',
    visibility: {
      requiresSelection: 'none',
      whenBuildReady: false
    }
  })
};

function withDefaults(
  definition: Omit<RecipeTemplateRuntimeDefinition, 'actions'> & {
    actions?: Record<string, RecipeActionDefinition>;
  }
): RecipeTemplateRuntimeDefinition {
  return {
    ...definition,
    actions: {
      ...DEFAULT_TEMPLATE_ACTIONS,
      ...(definition.actions ?? {})
    }
  };
}

export const WORKRECIPE_TEMPLATE_RUNTIME_REGISTRY: Record<RecipeTemplateId, RecipeTemplateRuntimeDefinition> = {
  'price-comparison-grid': withDefaults({
    id: 'price-comparison-grid',
    name: 'Price Comparison Grid',
    useCase: 'Compare the same product or adjacent products across multiple merchants.',
    selectionSignals: ['price comparison', 'same product', 'cheapest store', 'merchant grid'],
    slots: [
      { id: 'offer-grid', kind: 'comparison-table', required: true },
      { id: 'operator-note', kind: 'notes' },
    ],
    allowedUpdateOps: ['set_header', 'set_scope_tags', 'upsert_table_rows', 'remove_items', 'append_note_lines'],
    transitions: []
  }),
  'shopping-shortlist': withDefaults({
    id: 'shopping-shortlist',
    name: 'Shopping Results',
    useCase: 'Show a wide variety of items as small tiled cards with name, photo, and price.',
    selectionSignals: ['shopping results', 'find me', 'browse items', 'show me options', 'gift ideas'],
    slots: [
      { id: 'shortlist', kind: 'card-grid', required: true },
      { id: 'notes', kind: 'notes' },
    ],
    allowedUpdateOps: ['set_header', 'upsert_cards', 'remove_items', 'append_note_lines'],
    transitions: []
  }),
  'inbox-triage-board': withDefaults({
    id: 'inbox-triage-board',
    name: 'Inbox Triage Board',
    useCase: 'Triage unread senders and apply safe inbox cleanup actions.',
    selectionSignals: ['unread email', 'inbox triage', 'sender cleanup', 'bulk archive'],
    slots: [
      { id: 'stats', kind: 'stats', required: true },
      { id: 'triage-board', kind: 'split', required: true }
    ],
    allowedUpdateOps: ['set_header', 'upsert_groups', 'set_detail', 'set_status'],
    transitions: []
  }),
  'restaurant-finder': withDefaults({
    id: 'restaurant-finder',
    name: 'Restaurant Finder',
    useCase: 'Find and compare nearby restaurants with fast booking-oriented context.',
    selectionSignals: ['restaurants nearby', 'dinner options', 'places to eat', 'restaurant shortlist'],
    slots: [
      { id: 'filters', kind: 'filter-strip', required: true },
      { id: 'results', kind: 'split', required: true },
    ],
    allowedUpdateOps: ['set_header', 'set_filter_chips', 'upsert_groups', 'set_detail', 'append_note_lines'],
    transitions: []
  }),
  'hotel-shortlist': withDefaults({
    id: 'hotel-shortlist',
    name: 'Hotel Shortlist',
    useCase: 'Compare likely hotels for a destination or trip window.',
    selectionSignals: ['hotel shortlist', 'where to stay', 'compare hotels', 'lodging options'],
    slots: [
      { id: 'stats', kind: 'stats' },
      { id: 'hotels', kind: 'card-grid', required: true }
    ],
    allowedUpdateOps: ['set_header', 'upsert_cards', 'remove_items', 'append_note_lines'],
    actions: {
      'get-hotel-details': bridgeAction('get-hotel-details', 'Get details', 'run_template_followup', {
        intent: 'primary',
        visibility: { requiresSelection: 'single' },
        prompt: { promptTemplate: 'Get booking details and current availability for the selected hotel.', includeInputs: ['selected_items'], allowedMutations: [], outboundRequestsAllowed: true, expectedOutput: 'assistant_only', timeoutMs: 60_000, retryable: true }
      }),
      'append-template-note': bridgeAction('append-template-note', 'Add note', 'append_template_note')
    },
    transitions: []
  }),
  'flight-comparison': withDefaults({
    id: 'flight-comparison',
    name: 'Flight Comparison',
    useCase: 'Compare flight options across outbound and return legs.',
    selectionSignals: ['flight comparison', 'airline options', 'compare itineraries', 'stops and price'],
    slots: [
      { id: 'flight-tabs', kind: 'tabs', required: true }
    ],
    allowedUpdateOps: ['set_header', 'set_active_tab', 'upsert_table_rows', 'remove_items'],
    actions: {
      'get-flight-details': bridgeAction('get-flight-details', 'Flight details', 'run_template_followup', {
        intent: 'primary',
        visibility: { requiresSelection: 'single' },
        prompt: { promptTemplate: 'Get full details and fare rules for the selected flight itinerary.', includeInputs: ['selected_items'], allowedMutations: [], outboundRequestsAllowed: true, expectedOutput: 'assistant_only', timeoutMs: 60_000, retryable: true }
      }),
      'continue-booking': bridgeAction('continue-booking', 'Continue booking', 'run_template_followup', {
        intent: 'primary',
        visibility: { requiresSelection: 'single' },
        prompt: { promptTemplate: 'Continue booking the selected flight and provide the next steps.', includeInputs: ['selected_items'], allowedMutations: [], outboundRequestsAllowed: true, expectedOutput: 'assistant_only', timeoutMs: 60_000, retryable: true }
      }),
      'append-template-note': bridgeAction('append-template-note', 'Add note', 'append_template_note')
    },
    transitions: []
  }),
  'travel-itinerary-planner': withDefaults({
    id: 'travel-itinerary-planner',
    name: 'Travel Itinerary Planner',
    useCase: 'Organize a trip across itinerary, bookings, packing, and saved links.',
    selectionSignals: ['trip itinerary', 'travel planner', 'bookings and packing', 'trip notes'],
    slots: [
      { id: 'trip-tabs', kind: 'tabs', required: true }
    ],
    allowedUpdateOps: ['set_header', 'set_active_tab', 'upsert_timeline_items', 'upsert_cards', 'append_note_lines', 'remove_items'],
    actions: {
      'get-trip-details': bridgeAction('get-trip-details', 'Get details', 'run_template_followup', {
        intent: 'primary',
        visibility: { requiresSelection: 'single' },
        prompt: { promptTemplate: 'Get details for the selected trip item and suggest next steps.', includeInputs: ['selected_items'], allowedMutations: [], outboundRequestsAllowed: true, expectedOutput: 'assistant_only', timeoutMs: 60_000, retryable: true }
      }),
      'append-template-note': bridgeAction('append-template-note', 'Add note', 'append_template_note')
    },
    transitions: []
  }),
  'research-notebook': withDefaults({
    id: 'research-notebook',
    name: 'Research Notebook',
    useCase: 'Gather sources, notes, extracted points, and follow-up prompts.',
    selectionSignals: ['research notebook', 'sources and notes', 'claims', 'follow-up questions'],
    slots: [
      { id: 'research-tabs', kind: 'tabs', required: true }
    ],
    allowedUpdateOps: ['set_header', 'set_active_tab', 'upsert_groups', 'append_note_lines', 'remove_items'],
    actions: {
      'run-followup': bridgeAction('run-followup', 'Run follow-up', 'run_template_followup', {
        intent: 'primary',
        visibility: { requiresSelection: 'single' },
        prompt: { promptTemplate: 'Follow up on the selected research item: expand notes, find additional sources, or answer open questions.', includeInputs: ['selected_items', 'original_prompt'], allowedMutations: ['raw_data', 'normalized_data'], outboundRequestsAllowed: true, expectedOutput: 'recipe_data_update', timeoutMs: 120_000, retryable: true }
      }),
      'append-template-note': bridgeAction('append-template-note', 'Add note', 'append_template_note')
    },
    transitions: []
  }),
  'security-review-board': withDefaults({
    id: 'security-review-board',
    name: 'Security Review Board',
    useCase: 'Review security findings by severity with evidence and remediation context.',
    selectionSignals: ['security review', 'threat findings', 'audit board', 'severity triage'],
    slots: [
      { id: 'stats', kind: 'stats' },
      { id: 'findings', kind: 'split', required: true }
    ],
    allowedUpdateOps: ['set_header', 'upsert_groups', 'set_detail', 'set_status'],
    actions: {
      'ignore-finding': bridgeAction('ignore-finding', 'Ignore', 'remove_selected_items', {
        intent: 'neutral',
        visibility: { requiresSelection: 'single' }
      }),
      'remediate-finding': bridgeAction('remediate-finding', 'Remediate', 'run_template_followup', {
        intent: 'primary',
        visibility: { requiresSelection: 'single' },
        prompt: { promptTemplate: 'Provide a remediation plan for the selected security finding, including steps, priority, and affected components.', includeInputs: ['selected_items'], allowedMutations: [], outboundRequestsAllowed: false, expectedOutput: 'assistant_only', timeoutMs: 60_000, retryable: true }
      })
    },
    transitions: []
  }),
  'vendor-evaluation-matrix': withDefaults({
    id: 'vendor-evaluation-matrix',
    name: 'Comparison Matrix',
    useCase: 'Compare any set of items (frameworks, vendors, technologies, apps, products) side by side.',
    selectionSignals: ['comparison matrix', 'compare frameworks', 'compare technologies', 'compare vendors', 'compare apps', 'versus'],
    slots: [
      { id: 'stats', kind: 'stats' },
      { id: 'matrix', kind: 'comparison-table', required: true },
      { id: 'notes', kind: 'notes' }
    ],
    allowedUpdateOps: ['set_header', 'upsert_table_rows', 'remove_items', 'append_note_lines', 'set_scope_tags'],
    actions: {
      'compare-vendor': bridgeAction('compare-vendor', 'Compare in detail', 'run_template_followup', {
        intent: 'primary',
        visibility: { requiresSelection: 'single' },
        prompt: { promptTemplate: 'Compare the selected option in depth: strengths, weaknesses, pricing, and a recommendation relative to the other candidates.', includeInputs: ['selected_items', 'original_prompt'], allowedMutations: [], outboundRequestsAllowed: false, expectedOutput: 'assistant_only', timeoutMs: 60_000, retryable: true }
      }),
      'append-template-note': bridgeAction('append-template-note', 'Add note', 'append_template_note')
    },
    transitions: []
  }),
  'event-planner': withDefaults({
    id: 'event-planner',
    name: 'Event Planner',
    useCase: 'Plan an event across venues, guests, checklist, itinerary, notes, and links.',
    selectionSignals: ['event planner', 'venue and guests', 'event checklist', 'plan an event'],
    slots: [
      { id: 'event-tabs', kind: 'tabs', required: true }
    ],
    allowedUpdateOps: ['set_header', 'set_active_tab', 'upsert_cards', 'upsert_groups', 'upsert_timeline_items', 'append_note_lines', 'remove_items'],
    actions: {
      'add-event-guest': bridgeAction('add-event-guest', 'Add guest', 'add_event_guest', {
        intent: 'primary'
      }),
      'toggle-template-checklist': bridgeAction('toggle-template-checklist', 'Toggle checklist item', 'toggle_template_checklist', {
        visibility: {
          requiresSelection: 'single'
        }
      }),
      'append-template-note': bridgeAction('append-template-note', 'Add note', 'append_template_note'),
      'switch-template': bridgeAction('switch-template', 'Switch template', 'switch_template', {
        visibility: {
          requiresSelection: 'single'
        }
      })
    },
    transitions: []
  }),
  'job-search-pipeline': withDefaults({
    id: 'job-search-pipeline',
    name: 'Job Listings',
    useCase: 'Find and compare job postings with salary ranges, descriptions, and application links.',
    selectionSignals: ['job listings', 'job postings', 'job search', 'career opportunities', 'open positions'],
    slots: [
      { id: 'stats', kind: 'stats' },
      { id: 'pipeline', kind: 'split', required: true }
    ],
    allowedUpdateOps: ['set_header', 'upsert_board_cards', 'move_board_card', 'set_detail', 'append_note_lines'],
    actions: {
      'move-job-stage': bridgeAction('move-job-stage', 'Update stage', 'move_template_card_stage', {
        intent: 'primary',
        visibility: { requiresSelection: 'single' }
      }),
      'run-interview-prep': bridgeAction('run-interview-prep', 'Interview prep', 'generate_interview_prep', {
        intent: 'primary',
        visibility: { requiresSelection: 'single' },
        prompt: { promptTemplate: 'Prepare targeted interview questions, key talking points, and research notes for the selected job posting.', includeInputs: ['selected_items', 'original_prompt'], allowedMutations: [], outboundRequestsAllowed: true, expectedOutput: 'assistant_only', timeoutMs: 90_000, retryable: true }
      }),
      'append-template-note': bridgeAction('append-template-note', 'Add note', 'append_template_note')
    },
    transitions: []
  }),
  'content-campaign-planner': withDefaults({
    id: 'content-campaign-planner',
    name: 'Content / Campaign Planner',
    useCase: 'Track campaign ideas, drafts, schedule, email, and notes.',
    selectionSignals: ['campaign planner', 'content ideas', 'drafts and schedule', 'launch email'],
    slots: [
      { id: 'campaign-tabs', kind: 'tabs', required: true }
    ],
    allowedUpdateOps: ['set_header', 'set_active_tab', 'upsert_cards', 'upsert_timeline_items', 'append_note_lines', 'remove_items'],
    actions: {
      'flesh-out-idea': bridgeAction('flesh-out-idea', 'Flesh out', 'expand_template_idea', {
        intent: 'primary',
        visibility: { requiresSelection: 'single' },
        prompt: { promptTemplate: 'Expand the selected content idea into a full brief with goals, audience, format, key messages, and a draft outline.', includeInputs: ['selected_items', 'original_prompt'], allowedMutations: ['raw_data', 'normalized_data'], outboundRequestsAllowed: false, expectedOutput: 'recipe_data_update', timeoutMs: 60_000, retryable: true }
      }),
      'write-campaign-email': bridgeAction('write-campaign-email', 'Write email', 'generate_campaign_email', {
        intent: 'primary',
        visibility: { requiresSelection: 'single' },
        prompt: { promptTemplate: 'Write a complete campaign email for the selected idea: subject line, body copy, and a clear CTA.', includeInputs: ['selected_items', 'original_prompt'], allowedMutations: [], outboundRequestsAllowed: false, expectedOutput: 'assistant_only', timeoutMs: 60_000, retryable: true }
      })
    },
    transitions: []
  }),
  'local-discovery-comparison': withDefaults({
    id: 'local-discovery-comparison',
    name: 'Local Discovery Comparison',
    useCase: 'Compare nearby providers, venues, or local services outside the dedicated restaurant and hotel templates.',
    selectionSignals: ['nearby places', 'local comparison', 'service providers', 'venue shortlist'],
    slots: [
      { id: 'filters', kind: 'filter-strip', required: true },
      { id: 'results', kind: 'split', required: true }
    ],
    allowedUpdateOps: ['set_header', 'set_filter_chips', 'upsert_groups', 'set_detail', 'append_note_lines'],
    actions: {
      'save-place': bridgeAction('save-place', 'Save place', 'save_template_place', {
        intent: 'primary',
        visibility: { requiresSelection: 'single' }
      }),
      'switch-to-event-planner': bridgeAction('switch-to-event-planner', 'Convert to event plan', 'switch_template', {
        intent: 'primary',
        visibility: {
          requiresSelection: 'single'
        },
        payload: {
          targetTemplateId: 'event-planner'
        }
      }),
      'append-template-note': bridgeAction('append-template-note', 'Add note', 'append_template_note')
    },
    transitions: [
      {
        targetTemplateId: 'event-planner',
        reason: 'Carry the selected place forward into event planning when the user pivots from comparison to planning.',
        migration: 'local-discovery-to-event-planner'
      }
    ]
  }),
  'step-by-step-instructions': withDefaults({
    id: 'step-by-step-instructions',
    name: 'Step-by-Step Instructions',
    useCase: 'Follow a procedure with prerequisites and numbered steps that can be checked off.',
    selectionSignals: ['how to', 'step by step', 'instructions', 'tutorial', 'guide'],
    slots: [
      { id: 'checklist', kind: 'checklist', required: true },
      { id: 'notes', kind: 'notes' }
    ],
    allowedUpdateOps: ['set_header', 'append_note_lines'],
    actions: {
      'append-template-note': bridgeAction('append-template-note', 'Add note', 'append_template_note')
    },
    transitions: []
  })
};

export function getRecipeTemplateRuntimeDefinition(templateId: RecipeTemplateId) {
  return WORKRECIPE_TEMPLATE_RUNTIME_REGISTRY[templateId] ?? null;
}
