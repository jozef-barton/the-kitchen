// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getRecipeContentTab, normalizeRecipeTabs, normalizeRecipeUiState } from '@hermes-recipes/protocol';
import type { Recipe, UpdateRecipeRequest } from '@hermes-recipes/protocol';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRecipeTemplateGhostState } from '../../../../bridge/src/services/recipes/recipe-template-contract';
import { SessionRecipePanel } from './SessionRecipePanel';

if (typeof window !== 'undefined' && !window.PointerEvent) {
  Object.defineProperty(window, 'PointerEvent', {
    configurable: true,
    writable: true,
    value: MouseEvent
  });
}

afterEach(() => {
  cleanup();
});

function createRecipe(overrides: Partial<Recipe> = {}): Recipe {
  const defaultTabs = normalizeRecipeTabs({
    contentFormat: 'markdown',
    contentData: {
      markdown:
        '## Restaurant shortlist\n\n- **Mamma Disalvo’s** — Strong local reputation.\n  - Website: [Official site](https://mammadisalvos.com)\n  - Contact: hello@mammadisalvos.com\n  - Image: ![Dining room](https://images.example.com/mamma.jpg)'
    }
  });

  return {
    schemaVersion: overrides.schemaVersion ?? 5,
    id: overrides.id ?? 'recipe-launch',
    profileId: overrides.profileId ?? 'jbarton',
    primarySessionId: overrides.primarySessionId ?? 'session-launch',
    primaryRuntimeSessionId: overrides.primaryRuntimeSessionId ?? 'runtime-launch',
    title: overrides.title ?? 'Launch checklist',
    description: overrides.description ?? 'Track launch work',
    createdAt: overrides.createdAt ?? '2026-04-09T12:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-04-09T12:00:00.000Z',
    status: overrides.status ?? 'active',
    tabs: overrides.tabs ?? defaultTabs,
    uiState: overrides.uiState ?? {
      activeTab: 'content'
    },
    lastUpdatedBy: overrides.lastUpdatedBy ?? 'Hermes',
    source: overrides.source ?? 'hermes',
    metadata: overrides.metadata ?? {
      changeVersion: 1,
      auditTags: [],
      homeRecipe: true,
      baselineContentUpdatedAt: '2026-04-09T12:00:00.000Z',
      recipePipeline: {
        currentStage: 'baseline_ready',
        task: {
          status: 'ready',
          stage: 'task_ready',
          message: 'Hermes completed the task.',
          updatedAt: '2026-04-09T12:00:00.000Z'
        },
        baseline: {
          status: 'ready',
          stage: 'baseline_ready',
          message: 'The Home workspace baseline is ready.',
          updatedAt: '2026-04-09T12:00:00.000Z'
        },
        applet: {
          status: 'skipped',
          message: 'No richer workspace enrichment was required for this response.',
          updatedAt: '2026-04-09T12:00:00.000Z'
        }
      }
    },
    renderMode: overrides.renderMode ?? 'legacy_content_v1',
    dynamic: overrides.dynamic
  };
}

function renderPanel({
  recipe = createRecipe(),
  onRefresh = vi.fn(),
  onExecuteAction = vi.fn().mockResolvedValue(undefined) as unknown as (
    recipe: Recipe,
    actionId: string,
    input: {
      selectedItemIds?: string[];
      pageState?: Record<string, number>;
      filterState?: Record<string, string>;
      formValues?: Record<string, string | number | boolean | null>;
    }
  ) => Promise<void> | void,
  onUpdateRecipe = vi.fn().mockResolvedValue(undefined) as unknown as (
    recipeId: string,
    partial: Omit<UpdateRecipeRequest, 'profileId'>,
    options?: {
      toastTitle?: string;
      toastDescription?: string;
      quiet?: boolean;
    }
  ) => Promise<Recipe> | void,
  onApplyRecipeEntryAction = vi.fn().mockResolvedValue(undefined) as unknown as (
    recipeId: string,
    action: 'remove' | 'delete_source',
    entryIds: string[],
    options?: {
      quiet?: boolean;
      toastTitle?: string;
      toastDescription?: string;
    }
  ) => Promise<void> | void
}: {
  recipe?: Recipe;
  onRefresh?: (recipe: Recipe) => void | Promise<void>;
  onExecuteAction?: (
    recipe: Recipe,
    actionId: string,
    input: {
      selectedItemIds?: string[];
      pageState?: Record<string, number>;
      filterState?: Record<string, string>;
      formValues?: Record<string, string | number | boolean | null>;
    }
  ) => Promise<void> | void;
  onUpdateRecipe?: (
    recipeId: string,
    partial: Omit<UpdateRecipeRequest, 'profileId'>,
    options?: {
      toastTitle?: string;
      toastDescription?: string;
      quiet?: boolean;
    }
  ) => Promise<Recipe> | void;
  onApplyRecipeEntryAction?: (
    recipeId: string,
    action: 'remove' | 'delete_source',
    entryIds: string[],
    options?: {
      quiet?: boolean;
      toastTitle?: string;
      toastDescription?: string;
    }
  ) => Promise<void> | void;
} = {}) {
  function Harness() {
    const [currentRecipe, setCurrentSpace] = useState(recipe);

    return (
      <ChakraProvider value={defaultSystem}>
        <SessionRecipePanel
          recipe={currentRecipe}
          onRename={vi.fn()}
          onDelete={vi.fn()}
          onRefresh={onRefresh}
          onExecuteAction={onExecuteAction}
          onUpdateRecipe={async (recipeId, partial, options) => {
            await onUpdateRecipe(recipeId, partial, options);

            let nextSpace = currentRecipe;
            setCurrentSpace((current) => {
              nextSpace = {
                ...current,
                title: partial.title ?? current.title,
                description: partial.description ?? current.description,
                status: partial.status ?? current.status,
                tabs: normalizeRecipeTabs({
                  currentRecipe: current,
                  tabs: partial.tabs,
                  contentFormat: partial.contentFormat ?? getRecipeContentTab(current).content.activeView,
                  contentData: partial.contentData
                }),
                uiState: partial.uiState ? normalizeRecipeUiState({ ...current.uiState, ...partial.uiState }) : current.uiState
              };
              return nextSpace;
            });

            return nextSpace;
          }}
          onApplyRecipeEntryAction={onApplyRecipeEntryAction}
        />
      </ChakraProvider>
    );
  }

  render(<Harness />);

  return {
    onRefresh,
    onExecuteAction,
    onUpdateRecipe,
    onApplyRecipeEntryAction
  };
}

describe('SessionRecipePanel', () => {
  it('keeps attached session spaces free of template-gallery metadata', () => {
    renderPanel();

    expect(screen.queryByText('When Hermes should choose it later')).not.toBeInTheDocument();
    expect(screen.queryByText('Inspect template')).not.toBeInTheDocument();
    expect(screen.queryByText('Signals')).not.toBeInTheDocument();
    expect(screen.queryByTestId('session-recipe-top-area')).not.toBeInTheDocument();
  });

  it('renders polished markdown result sets with clickable links and no inline images', () => {
    renderPanel();

    const markdown = screen.getByTestId('recipe-markdown-renderer');
    expect(within(markdown).getByText('Restaurant shortlist')).toBeInTheDocument();
    expect(within(markdown).getByRole('link', { name: 'Official site' })).toHaveAttribute('href', 'https://mammadisalvos.com');
    expect(within(markdown).getByRole('link', { name: 'hello@mammadisalvos.com' })).toHaveAttribute(
      'href',
      'mailto:hello@mammadisalvos.com'
    );
    expect(within(markdown).queryByRole('img')).not.toBeInTheDocument();
    expect(within(markdown).getByRole('link', { name: 'Dining room' })).toHaveAttribute('href', 'https://images.example.com/mamma.jpg');
  });

  it('renders a template shell with retry control while generation is still running before selection promotion', async () => {
    const onExecuteAction = vi.fn().mockResolvedValue(undefined);
    renderPanel({
      onExecuteAction,
      recipe: createRecipe({
        renderMode: 'dynamic_v1',
        metadata: {
          changeVersion: 1,
          auditTags: [],
          homeRecipe: true,
          baselineContentUpdatedAt: '2026-04-11T18:00:01.000Z',
          recipePipeline: {
            currentStage: 'enrichment_generating',
            task: {
              status: 'ready',
              stage: 'task_ready',
              message: 'Hermes completed the task.',
              updatedAt: '2026-04-11T18:00:00.000Z'
            },
            baseline: {
              status: 'ready',
              stage: 'baseline_ready',
              message: 'The Home workspace baseline is ready.',
              updatedAt: '2026-04-11T18:00:01.000Z'
            },
            applet: {
              status: 'running',
              stage: 'enrichment_generating',
              message: 'Filling the approved template…',
              updatedAt: '2026-04-11T18:00:01.000Z'
            }
          }
        },
        dynamic: {
          renderMode: 'dynamic_v1',
          activeBuild: {
            id: 'build-recipe-launch',
            recipeId: 'recipe-launch',
            profileId: 'jbarton',
            sessionId: 'session-launch',
            buildVersion: 1,
            buildKind: 'template_enrichment',
            triggerKind: 'chat',
            triggerRequestId: 'request-build',
            triggerActionId: null,
            phase: 'queued',
            progressMessage: 'Filling the approved template…',
            retryCount: 0,
            startedAt: '2026-04-11T18:00:00.000Z',
            updatedAt: '2026-04-11T18:00:01.000Z',
            completedAt: null,
            failureCategory: null,
            failureStage: null,
            userFacingMessage: null,
            retryable: null,
            configuredTimeoutMs: null,
            errorCode: null,
            errorMessage: null,
            errorDetail: null
          },
          fallback: {
            kind: 'fallback',
            schemaVersion: 'recipe_fallback/v1',
            title: 'Hotel shortlist',
            message: 'Safe fallback preview while the rich workspace is still building.',
            summaryMarkdown: '## Hotel shortlist\n\n- Hotel Ardent',
            datasetPreview: [],
            canRetry: true
          },
          actionSpec: {
            kind: 'action_spec',
            schemaVersion: 'recipe_action_spec/v1',
            actions: [
              {
                id: 'retry-build',
                label: 'Retry build',
                kind: 'bridge',
                intent: 'secondary',
                description: 'Retry the build.',
                visibility: {
                  requiresSelection: 'none',
                  whenBuildReady: false
                },
                bridge: {
                  handler: 'retry_build',
                  payload: {}
                },
                metadata: {}
              }
            ]
          }
        }
      })
    });

    expect(screen.getByTestId('recipe-template-generation-running')).toBeInTheDocument();
    expect(screen.getByTestId('dynamic-recipe-template-shell')).toBeInTheDocument();
    expect(screen.queryByTestId('dynamic-recipe-baseline')).not.toBeInTheDocument();
  });

  it('renders a failed dynamic build state without falling back to baseline markdown in the template pane', () => {
    renderPanel({
      recipe: createRecipe({
        renderMode: 'dynamic_v1',
        metadata: {
          changeVersion: 1,
          auditTags: [],
          homeRecipe: true,
          baselineContentUpdatedAt: '2026-04-11T18:12:05.000Z',
          recipePipeline: {
            currentStage: 'enrichment_failed',
            task: {
              status: 'ready',
              stage: 'task_ready',
              message: 'Hermes completed the task.',
              updatedAt: '2026-04-11T18:12:00.000Z'
            },
            baseline: {
              status: 'ready',
              stage: 'baseline_ready',
              message: 'The Home workspace baseline is ready.',
              updatedAt: '2026-04-11T18:12:01.000Z'
            },
            applet: {
              status: 'failed',
              stage: 'enrichment_failed',
              failureCategory: 'template_fill_failed',
              message: 'Recipe generation failed because Hermes did not return a valid fill for the approved template. You can retry workspace generation.',
              diagnostic: 'Hermes returned the start marker without a JSON payload.',
              retryable: true,
              updatedAt: '2026-04-11T18:12:05.000Z'
            }
          }
        },
        dynamic: {
          renderMode: 'dynamic_v1',
          activeBuild: {
            id: 'build-recipe-launch-failed',
            recipeId: 'recipe-launch',
            profileId: 'jbarton',
            sessionId: 'session-launch',
            buildVersion: 2,
            buildKind: 'template_enrichment',
            triggerKind: 'retry',
            triggerRequestId: 'request-build-failed',
            triggerActionId: 'retry-build',
            phase: 'failed',
            progressMessage: 'Recipe generation failed. Showing the baseline Home recipe.',
            retryCount: 1,
            startedAt: '2026-04-11T18:12:00.000Z',
            updatedAt: '2026-04-11T18:12:05.000Z',
            completedAt: '2026-04-11T18:12:05.000Z',
            failureCategory: 'template_fill_failed',
            failureStage: 'enrichment_failed',
            userFacingMessage: 'Recipe generation failed because Hermes did not return a valid fill for the approved template. You can retry workspace generation.',
            retryable: true,
            configuredTimeoutMs: null,
            errorCode: 'RECIPE_TEMPLATE_FILL_FAILED',
            errorMessage: 'Template fill failed.',
            errorDetail: 'Hermes returned the start marker without a JSON payload.'
          },
          fallback: {
            kind: 'fallback',
            schemaVersion: 'recipe_fallback/v1',
            title: 'Hotel shortlist',
            message: 'Safe fallback summary.',
            summaryMarkdown: '## Hotel shortlist\n\n- Hotel Ardent',
            datasetPreview: [],
            canRetry: true
          },
          actionSpec: {
            kind: 'action_spec',
            schemaVersion: 'recipe_action_spec/v1',
            actions: [
              {
                id: 'retry-build',
                label: 'Retry build',
                kind: 'bridge',
                intent: 'secondary',
                description: 'Retry the build.',
                visibility: {
                  requiresSelection: 'none',
                  whenBuildReady: false
                },
                bridge: {
                  handler: 'retry_build',
                  payload: {}
                },
                metadata: {}
              }
            ]
          }
        }
      })
    });

    expect(screen.getByTestId('recipe-template-generation-failed')).toBeInTheDocument();
    expect(screen.getByText('Recipe generation failed')).toBeInTheDocument();
    expect(screen.getByText('Recipe generation failed because Hermes did not return a valid fill for the approved template. You can retry workspace generation.')).toBeInTheDocument();
    expect(screen.getByText('Reason: Template fill failed')).toBeInTheDocument();
    expect(screen.getByTestId('dynamic-recipe-pipeline-statuses')).toHaveTextContent('Task: Ready');
    expect(screen.getByTestId('dynamic-recipe-pipeline-statuses')).toHaveTextContent('Home: Ready');
    expect(screen.getByTestId('dynamic-recipe-pipeline-statuses')).toHaveTextContent('Generation: Failed');
    expect(screen.getByTestId('dynamic-recipe-template-shell')).toBeInTheDocument();
    expect(screen.queryByTestId('dynamic-recipe-baseline')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders a running template state when a retry is queued after a failed build', () => {
    renderPanel({
      recipe: createRecipe({
        title: 'Nearby Shortlist',
        description: 'Retrying the restaurant shortlist',
        renderMode: 'dynamic_v1',
        metadata: {
          changeVersion: 2,
          auditTags: [],
          homeRecipe: true,
          baselineContentUpdatedAt: '2026-04-11T18:18:05.000Z',
          activeTemplateId: 'restaurant-finder',
          recipePipeline: {
            currentStage: 'enrichment_generating',
            task: {
              status: 'skipped',
              stage: 'task_ready',
              message: 'Retrying from persisted artifacts.',
              updatedAt: '2026-04-11T18:18:00.000Z'
            },
            baseline: {
              status: 'ready',
              stage: 'baseline_ready',
              message: 'The Home workspace baseline is ready.',
              updatedAt: '2026-04-11T18:18:01.000Z'
            },
            applet: {
              status: 'running',
              stage: 'enrichment_generating',
              message: 'Recipe generation retry is queued and running in the background from persisted Home artifacts.',
              updatedAt: '2026-04-11T18:18:02.000Z'
            }
          }
        },
        dynamic: {
          renderMode: 'dynamic_v1',
          activeBuild: {
            id: 'build-recipe-launch-retry-stale-failed',
            recipeId: 'recipe-launch',
            profileId: 'jbarton',
            sessionId: 'session-launch',
            buildVersion: 3,
            buildKind: 'template_enrichment',
            triggerKind: 'retry',
            triggerRequestId: 'request-build-retry',
            triggerActionId: 'retry-build',
            phase: 'failed',
            progressMessage: 'Recipe generation failed. Showing the baseline Home recipe.',
            retryCount: 1,
            startedAt: '2026-04-11T18:18:00.000Z',
            updatedAt: '2026-04-11T18:18:05.000Z',
            completedAt: '2026-04-11T18:18:05.000Z',
            failureCategory: 'template_fill_failed',
            failureStage: 'enrichment_failed',
            userFacingMessage: 'Recipe generation failed because Hermes did not return a valid fill for the approved template. You can retry workspace generation.',
            retryable: true,
            configuredTimeoutMs: null,
            errorCode: 'RECIPE_TEMPLATE_FILL_FAILED',
            errorMessage: 'Template fill failed.',
            errorDetail: 'Hermes returned the start marker without a JSON payload.'
          },
          fallback: {
            kind: 'fallback',
            schemaVersion: 'recipe_fallback/v1',
            title: 'Nearby Shortlist',
            message: 'Retrying from the persisted baseline.',
            summaryMarkdown: '## Restaurant shortlist\n\n- Mamma Disalvo’s',
            datasetPreview: [],
            canRetry: true
          },
          actionSpec: {
            kind: 'action_spec',
            schemaVersion: 'recipe_action_spec/v1',
            actions: [
              {
                id: 'retry-build',
                label: 'Retry build',
                kind: 'bridge',
                intent: 'secondary',
                description: 'Retry the build.',
                visibility: {
                  requiresSelection: 'none',
                  whenBuildReady: false
                },
                bridge: {
                  handler: 'retry_build',
                  payload: {}
                },
                metadata: {}
              }
            ]
          }
        }
      })
    });

    expect(screen.getByTestId('recipe-template-generation-running')).toBeInTheDocument();
    expect(screen.queryByText('Reason: Template fill failed')).not.toBeInTheDocument();
    expect(screen.queryByText('Stage: Failed')).not.toBeInTheDocument();
    expect(screen.getByTestId('dynamic-recipe-template-shell')).toBeInTheDocument();
    expect(screen.queryByTestId('dynamic-recipe-baseline')).not.toBeInTheDocument();
  });

  it('renders a ghost template instead of baseline markdown once template selection succeeds', () => {
    const preview = createRecipeTemplateGhostState({
      templateId: 'restaurant-finder',
      updatedAt: '2026-04-14T03:28:00.000Z',
      phase: 'selected'
    });
    if (!preview.state) {
      throw new Error(`Expected a ghost template state. Errors: ${preview.errors.join('; ')}`);
    }

    renderPanel({
      recipe: createRecipe({
        renderMode: 'dynamic_v1',
        metadata: {
          changeVersion: 1,
          auditTags: [],
          homeRecipe: true,
          baselineContentUpdatedAt: '2026-04-14T03:28:00.000Z',
          activeTemplateId: 'restaurant-finder',
          recipePipeline: {
            currentStage: 'enrichment_generating',
            task: {
              status: 'ready',
              stage: 'task_ready',
              message: 'Hermes completed the task.',
              updatedAt: '2026-04-14T03:27:58.000Z'
            },
            baseline: {
              status: 'ready',
              stage: 'baseline_ready',
              message: 'The Home workspace baseline is ready.',
              updatedAt: '2026-04-14T03:27:59.000Z'
            },
            applet: {
              status: 'running',
              stage: 'enrichment_generating',
              message: 'Selected the approved restaurant template and started hydrating it.',
              updatedAt: '2026-04-14T03:28:00.000Z'
            }
          }
        },
        dynamic: {
          renderMode: 'dynamic_v1',
          activeBuild: {
            id: 'build-recipe-launch-selected-template',
            recipeId: 'recipe-launch',
            profileId: 'jbarton',
            sessionId: 'session-launch',
            buildVersion: 4,
            buildKind: 'template_enrichment',
            triggerKind: 'chat',
            triggerRequestId: 'request-selected-template',
            triggerActionId: null,
            phase: 'template_text_generating',
            progressMessage: 'Hydrating the selected template…',
            retryCount: 0,
            startedAt: '2026-04-14T03:27:58.000Z',
            updatedAt: '2026-04-14T03:28:00.000Z',
            completedAt: null,
            errorCode: null,
            errorMessage: null,
            errorDetail: null,
            failureCategory: null,
            failureStage: null,
            userFacingMessage: null,
            retryable: true,
            configuredTimeoutMs: 90_000
          },
          recipeTemplate: preview.state
        }
      })
    });

    expect(screen.getByTestId('recipe-template-renderer')).toBeInTheDocument();
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.getByTestId('recipe-template-section-results')).toHaveAttribute('data-hydration-state', 'pending');
    expect(screen.queryByTestId('dynamic-recipe-baseline')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dynamic-recipe-template-shell')).not.toBeInTheDocument();
  });

  it('renders a ready dynamic recipe with pagination and dispatches prompt-bound actions', async () => {
    const onExecuteAction = vi.fn().mockResolvedValue(undefined);
    renderPanel({
      onExecuteAction,
      recipe: createRecipe({
        title: 'Hotel shortlist',
        description: 'Weekend Dayton options',
        renderMode: 'dynamic_v1',
        dynamic: {
          renderMode: 'dynamic_v1',
          activeBuild: {
            id: 'build-recipe-launch-ready',
            recipeId: 'recipe-launch',
            profileId: 'jbarton',
            sessionId: 'session-launch',
            buildVersion: 1,
            buildKind: 'compiled_home',
            triggerKind: 'chat',
            triggerRequestId: 'request-build-ready',
            triggerActionId: null,
            phase: 'ready',
            progressMessage: 'Recipe ready.',
            retryCount: 0,
            startedAt: '2026-04-11T18:10:00.000Z',
            updatedAt: '2026-04-11T18:10:05.000Z',
            completedAt: '2026-04-11T18:10:05.000Z',
            failureCategory: null,
            failureStage: null,
            userFacingMessage: null,
            retryable: null,
            configuredTimeoutMs: null,
            errorCode: null,
            errorMessage: null,
            errorDetail: null
          },
          summary: {
            kind: 'summary',
            schemaVersion: 'recipe_summary/v1',
            title: 'Hotel shortlist',
            subtitle: 'Weekend Dayton options',
            statusLabel: 'Ready',
            badges: ['dynamic', 'small-pane'],
            stats: [
              {
                id: 'stat-results',
                label: 'Options',
                value: '2',
                emphasis: 'primary',
                tone: 'info'
              }
            ],
            links: [],
            lastBuiltAt: '2026-04-11T18:10:05.000Z',
            note: 'Compact card layout selected.'
          },
          normalizedData: {
            kind: 'normalized_data',
            schemaVersion: 'recipe_normalized_data/v1',
            primaryDatasetId: 'primary',
            datasets: [
              {
                id: 'primary',
                label: 'Weekend shortlist',
                kind: 'collection',
                preferredPresentation: 'cards',
                items: [
                  {
                    id: 'hotel-ardent',
                    title: 'Hotel Ardent',
                    subtitle: 'Downtown Dayton',
                    description: 'Boutique stay near downtown.',
                    badges: ['walkable'],
                    fields: [
                      {
                        key: 'price',
                        label: 'Price',
                        value: '$210',
                        presentation: 'text',
                        emphasis: 'primary'
                      }
                    ],
                    links: [],
                    metadata: {}
                  },
                  {
                    id: 'ac-dayton',
                    title: 'AC Hotel Dayton',
                    subtitle: 'Dayton core',
                    description: 'Modern downtown stay.',
                    badges: ['modern'],
                    fields: [
                      {
                        key: 'price',
                        label: 'Price',
                        value: '$189',
                        presentation: 'text',
                        emphasis: 'primary'
                      }
                    ],
                    links: [],
                    metadata: {}
                  }
                ],
                fields: [
                  {
                    key: 'price',
                    label: 'Price',
                    value: '$210',
                    presentation: 'text',
                    emphasis: 'primary'
                  }
                ],
                stats: [
                  {
                    id: 'stat-results',
                    label: 'Options',
                    value: '2',
                    emphasis: 'primary',
                    tone: 'info'
                  }
                ],
                notes: ['Pick a walkable option first.'],
                pageInfo: {
                  pageSize: 1,
                  totalItems: 2,
                  hasMore: true
                },
                metadata: {}
              }
            ],
            summaryStats: [
              {
                id: 'stat-results',
                label: 'Options',
                value: '2',
                emphasis: 'primary',
                tone: 'info'
              }
            ],
            notes: ['Pick a walkable option first.'],
            links: [],
            metadata: {}
          },
          uiSpec: {
            kind: 'ui_spec',
            schemaVersion: 'recipe_ui/v2',
            compact: {
              defaultNodeId: 'results-section',
              maxCollectionColumns: 1,
              stickyActionBar: true
            },
            header: {
              title: 'Hotel shortlist',
              subtitle: 'Weekend Dayton options',
              statusLabel: 'Ready',
              badges: ['dynamic', 'small-pane'],
              statIds: ['stat-results'],
              primaryActionIds: ['refresh-recipe'],
              secondaryActionIds: []
            },
            nodes: [
              {
                id: 'overview-section',
                kind: 'section_group',
                title: 'Overview',
                description: 'Compact shortlist summary',
                children: [
                  {
                    id: 'overview-stats',
                    kind: 'stat_grid',
                    statIds: ['stat-results']
                  },
                  {
                    id: 'overview-actions',
                    kind: 'action_bar',
                    actionIds: ['refresh-recipe']
                  }
                ]
              },
              {
                id: 'results-section',
                kind: 'section_group',
                title: 'Results',
                children: [
                  {
                    id: 'results-filter',
                    kind: 'filter_bar',
                    datasetId: 'primary',
                    fieldKeys: [],
                    placeholder: 'Search results'
                  },
                  {
                    id: 'results-collection',
                    kind: 'collection',
                    title: 'Results',
                    datasetId: 'primary',
                    display: 'cards',
                    pageSize: 1,
                    selectable: 'single',
                    fieldKeys: ['price'],
                    actionIds: ['refine-selection'],
                    emptyState: {
                      title: 'No results',
                      description: 'Try broadening the request.'
                    },
                    loadingState: {
                      title: 'Loading results',
                      description: 'Building a compact workspace view.'
                    },
                    errorState: {
                      title: 'Results unavailable',
                      description: 'The workspace data could not be rendered.'
                    }
                  },
                  {
                    id: 'results-detail',
                    kind: 'detail_sheet',
                    title: 'Selection',
                    datasetId: 'primary',
                    source: 'selected',
                    fieldKeys: ['price'],
                    actionIds: ['refine-selection'],
                    emptyState: {
                      title: 'Nothing selected',
                      description: 'Select an item to inspect it.'
                    },
                    loadingState: {
                      title: 'Loading details',
                      description: 'Preparing the detail pane.'
                    },
                    errorState: {
                      title: 'Detail unavailable',
                      description: 'The selected item could not be rendered.'
                    }
                  },
                  {
                    id: 'results-paginator',
                    kind: 'paginator',
                    datasetId: 'primary',
                    pageSize: 1
                  }
                ]
              }
            ]
          },
          actionSpec: {
            kind: 'action_spec',
            schemaVersion: 'recipe_action_spec/v1',
            actions: [
              {
                id: 'refresh-recipe',
                label: 'Refresh',
                kind: 'prompt',
                intent: 'primary',
                description: 'Refresh the shortlist.',
                visibility: {
                  requiresSelection: 'none',
                  whenBuildReady: true
                },
                prompt: {
                  promptTemplate: 'Refresh the shortlist.',
                  includeInputs: ['original_prompt', 'normalized_data'],
                  allowedMutations: ['raw_data', 'normalized_data', 'ui_spec', 'assistant_response'],
                  outboundRequestsAllowed: true,
                  expectedOutput: 'recipe_data_update',
                  timeoutMs: 120000,
                  retryable: true
                },
                metadata: {}
              },
              {
                id: 'refine-selection',
                label: 'Refine selection',
                kind: 'prompt',
                intent: 'secondary',
                description: 'Refine the selected hotel.',
                visibility: {
                  requiresSelection: 'single',
                  whenBuildReady: true,
                  datasetId: 'primary'
                },
                prompt: {
                  promptTemplate: 'Refine the selected hotel.',
                  includeInputs: ['selected_items', 'normalized_data'],
                  allowedMutations: ['normalized_data', 'assistant_response'],
                  outboundRequestsAllowed: true,
                  expectedOutput: 'recipe_data_update',
                  timeoutMs: 120000,
                  retryable: true
                },
                metadata: {}
              }
            ]
          },
          latestTestResults: {
            kind: 'test_results',
            schemaVersion: 'recipe_test_results/v1',
            status: 'passed',
            blockingFailureCount: 0,
            results: [],
            checkedAt: '2026-04-11T18:10:05.000Z'
          },
          fallback: {
            kind: 'fallback',
            schemaVersion: 'recipe_fallback/v1',
            title: 'Hotel shortlist',
            message: 'Safe fallback summary.',
            summaryMarkdown: '- Hotel Ardent\n- AC Hotel Dayton',
            datasetPreview: [],
            canRetry: true
          }
        }
      })
    });

    expect(screen.getByTestId('dynamic-recipe-ready')).toBeInTheDocument();
    expect(screen.getAllByText('Hotel shortlist').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hotel Ardent').length).toBeGreaterThan(0);
    expect(screen.queryByText('AC Hotel Dayton')).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Refresh' })[0]!);
    expect(onExecuteAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'recipe-launch'
      }),
      'refresh-recipe',
      expect.objectContaining({
        selectedItemIds: [],
        pageState: {},
        filterState: {},
        formValues: {}
      })
    );

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => {
      expect(screen.getByText('AC Hotel Dayton')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('AC Hotel Dayton'));
    await userEvent.click(screen.getAllByRole('button', { name: 'Refine selection' })[0]!);
    expect(onExecuteAction).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'recipe-launch'
      }),
      'refine-selection',
      expect.objectContaining({
        selectedItemIds: ['ac-dayton'],
        pageState: {
          primary: 2
        }
      })
    );
  });
});
