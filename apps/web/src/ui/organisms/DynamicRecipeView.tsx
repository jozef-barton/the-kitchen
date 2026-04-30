import {
  Box,
  Button,
  HStack,
  Input,
  Separator,
  Skeleton,
  Spinner,
  Table,
  Tabs,
  Text,
  Textarea,
  VStack,
  chakra
} from '@chakra-ui/react';
import type {
  Recipe,
  RecipeActionDefinition,
  RecipeCellValue,
  RecipeLink,
  RecipeNormalizedDataset,
  RecipeNormalizedItem,
  RecipeUiFieldBinding,
  RecipeUiNode
} from '@hermes-recipes/protocol';
import { getRecipeContentTab } from '@hermes-recipes/protocol';
import type React from 'react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RecipeDslRenderer } from './RecipeDslRenderer';
import { safeMarkdownUrlTransform } from '../../lib/markdown-url-transform';
import { RecipeTemplateRenderer } from './RecipeTemplateRenderer';

type RecipePipeline = NonNullable<Recipe['metadata']['recipePipeline']>;
type RecipePipelineStatus = RecipePipeline['task']['status'];
type RecipeFailureCategory = RecipePipeline['task']['failureCategory'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function humanizeFieldKey(value: string) {
  return value
    .replace(/[._-]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(/\b\w/gu, (character) => character.toUpperCase());
}

function getCellText(value: RecipeCellValue | unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  if (isRecord(value) && typeof value.text === 'string' && value.text.trim().length > 0) {
    return value.text.trim();
  }

  if (isRecord(value) && typeof value.imageAlt === 'string' && value.imageAlt.trim().length > 0) {
    return value.imageAlt.trim();
  }

  return '';
}

function getCellLink(value: RecipeCellValue | unknown): RecipeLink | null {
  if (!isRecord(value)) {
    return null;
  }

  const rawHref = typeof value.href === 'string' ? value.href.trim() : '';
  if (!rawHref) {
    return null;
  }

  return {
    label: getCellText(value) || rawHref.replace(/^mailto:/iu, ''),
    url: rawHref,
    kind: value.kind === 'email' ? 'email' : 'other'
  };
}

function actionButtonTone(action: RecipeActionDefinition) {
  if (action.intent === 'danger' || action.kind === 'destructive') {
    return {
      variant: 'outline' as const,
      colorPalette: 'red'
    };
  }

  if (action.intent === 'primary') {
    return {
      variant: 'solid' as const,
      colorPalette: 'blue'
    };
  }

  return {
    variant: 'outline' as const,
    colorPalette: 'gray'
  };
}

function BadgeChip({ label }: { label: string }) {
  return (
    <Box rounded="full" bg="blue.50" px="2.5" py="1" _dark={{ bg: 'whiteAlpha.120' }}>
      <Text fontSize="10px" fontWeight="500" color="blue.700" textTransform="uppercase" letterSpacing="0" _dark={{ color: 'blue.200' }}>
        {label}
      </Text>
    </Box>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <VStack
      align="start"
      gap="1"
      rounded="8px"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-2)"
      px="3"
      py="2.5"
      minW="120px"
    >
      <Text fontSize="10px" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
        {label}
      </Text>
      <Text fontSize="lg" fontWeight="600" color="var(--text-primary)" lineHeight="1.1">
        {value}
      </Text>
    </VStack>
  );
}

const markdownRendererCss = {
  '& h1, & h2, & h3': {
    fontWeight: 600,
    lineHeight: 1.15,
    letterSpacing: 0,
    marginTop: '0.85rem',
    marginBottom: '0.45rem'
  },
  '& p': {
    fontSize: '0.92rem',
    lineHeight: 1.72
  },
  '& p + p': {
    marginTop: '0.75rem'
  },
  '& ul, & ol': {
    display: 'grid',
    gap: '0.55rem',
    marginTop: '0.75rem',
    paddingInlineStart: '1.1rem'
  },
  '& li': {
    lineHeight: 1.65
  },
  '& a': {
    color: 'var(--text-primary)',
    fontWeight: 700
  },
  '& table': {
    width: '100%',
    maxWidth: '100%',
    marginTop: '0.8rem',
    borderCollapse: 'separate',
    borderSpacing: 0,
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    overflow: 'hidden',
    tableLayout: 'fixed'
  },
  '& th, & td': {
    padding: '0.68rem 0.8rem',
    textAlign: 'left',
    verticalAlign: 'top',
    borderBottom: '1px solid var(--border-subtle)',
    wordWrap: 'break-word',
    overflowWrap: 'break-word'
  },
  '& th': {
    background: 'var(--surface-2)',
    color: 'var(--text-muted)',
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0
  },
  '& tr:last-of-type td': {
    borderBottom: 'none'
  }
} as const;

function RecipeMarkdownBlock({ content }: { content: string }) {
  return (
    <Box color="var(--text-primary)" css={markdownRendererCss}>
      <ReactMarkdown
        skipHtml
        urlTransform={(url) => safeMarkdownUrlTransform(url) ?? ''}
        remarkPlugins={[remarkGfm]}
        components={{
          a(props) {
            const href = props.href ?? '#';
            return (
              <chakra.a
                href={href}
                target={href.startsWith('mailto:') ? undefined : '_blank'}
                rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                color="blue.600"
                textDecoration="underline"
                textUnderlineOffset="3px"
                _dark={{ color: 'blue.200' }}
              >
                {props.children}
              </chakra.a>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}

function itemSearchText(item: RecipeNormalizedItem) {
  return [item.title, item.subtitle, item.description, ...item.fields.map((field) => getCellText(field.value))]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function fieldValueFromItem(item: RecipeNormalizedItem, binding: RecipeUiFieldBinding) {
  return item.fields.find((field) => field.key === binding.fieldKey)?.value ?? null;
}

function renderValue(value: RecipeCellValue | unknown, presentation: RecipeUiFieldBinding['presentation']) {
  const link = getCellLink(value);
  const text = getCellText(value);
  if ((presentation === 'link' || presentation === 'email') && link) {
    return (
      <chakra.a
        href={link.url}
        target={link.url.startsWith('mailto:') ? undefined : '_blank'}
        rel={link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
        color="blue.600"
        fontWeight="600"
        textDecoration="underline"
        textUnderlineOffset="3px"
        _dark={{ color: 'blue.200' }}
      >
        {text || link.label}
      </chakra.a>
    );
  }

  return (
    <Text
      fontSize="sm"
      fontWeight={presentation === 'badge' ? '700' : '500'}
      color={text ? 'var(--text-primary)' : 'var(--text-secondary)'}
      lineClamp={3}
    >
      {text || '—'}
    </Text>
  );
}

function resolveSelectedItem(datasetId: string, dataset: RecipeNormalizedDataset, selectedByDataset: Record<string, string[]>) {
  const selectedIds = selectedByDataset[datasetId] ?? [];
  const selectedItem = dataset.items.find((item) => selectedIds.includes(item.id));
  return selectedItem ?? dataset.items[0] ?? null;
}

function humanizeRecipeFailureCategory(category: RecipeFailureCategory | null | undefined) {
  if (!category) {
    return null;
  }

  switch (category) {
    case 'timeout_user_config':
      return 'Timeout from user configuration';
    case 'timeout_runtime':
      return 'Runtime timeout';
    case 'auth_scope':
      return 'Authentication scope';
    case 'upstream_tool_failure':
      return 'Upstream tool failure';
    case 'baseline_recipe_failure':
      return 'Baseline recipe failure';
    case 'dsl_generation_failure':
      return 'Recipe DSL generation failure';
    case 'dsl_generation_live_task_violation':
      return 'Recipe enrichment live-task violation';
    case 'dsl_context_invalid':
      return 'Recipe enrichment context invalid';
    case 'dsl_validation_failure':
      return 'Recipe DSL validation failure';
    case 'dsl_normalization_failure':
      return 'Recipe DSL normalization failure';
    case 'dsl_repair_failed':
      return 'Recipe DSL repair failed';
    case 'dsl_patch_failure':
      return 'Recipe patch failure';
    case 'template_selection_failed':
      return 'Template selection failed';
    case 'template_text_failed':
      return 'Template text generation failed';
    case 'template_hydration_failed':
      return 'Template hydration failed';
    case 'template_actions_failed':
      return 'Template actions generation failed';
    case 'template_fill_failed':
      return 'Template fill failed';
    case 'template_update_failed':
      return 'Template update failed';
    case 'template_switch_failed':
      return 'Template switch failed';
    case 'template_text_repair_failed':
      return 'Template text repair failed';
    case 'template_actions_repair_failed':
      return 'Template actions repair failed';
    case 'normalization_failed':
      return 'Template normalization failed';
    case 'repair_failed':
      return 'Template repair failed';
    case 'semantic_content_failed':
      return 'Recipe content stayed empty';
    case 'validation_failed':
      return 'Template validation failed';
    case 'unsupported_template_transition':
      return 'Unsupported template transition';
    case 'applet_manifest_failure':
    case 'applet_source_failure':
    case 'applet_capability_failure':
    case 'applet_compile_failure':
    case 'applet_test_failure':
    case 'applet_render_failure':
    case 'applet_small_pane_failure':
    case 'applet_seed_failure':
    case 'applet_verification_failure':
      return 'Retired applet flow failure';
    default:
      return category
        .replace(/_/gu, ' ')
        .replace(/\b\w/gu, (character) => character.toUpperCase());
  }
}

function resolveRetryBuildLabel(retryAction: RecipeActionDefinition | undefined, templateBuild: boolean) {
  const actionLabel = retryAction?.label?.trim() ?? '';
  if (templateBuild) {
    if (!actionLabel || /^retry build$/iu.test(actionLabel) || /^retry workspace generation$/iu.test(actionLabel)) {
      return 'Rebuild recipe';
    }

    return actionLabel;
  }

  return actionLabel || 'Retry recipe enrichment';
}

function resolveRetryBuildGuidance(templateBuild: boolean) {
  return templateBuild
    ? 'Rebuild uses the persisted Home artifacts only. It does not rerun the original task.'
    : 'Retry uses the persisted Home artifacts only. It does not rerun the original task.';
}

function pipelineStatusTone(status: RecipePipelineStatus) {
  switch (status) {
    case 'ready':
      return {
        bg: 'green.50',
        borderColor: 'green.200',
        color: 'green.700'
      };
    case 'failed':
      return {
        bg: 'red.50',
        borderColor: 'red.200',
        color: 'red.700'
      };
    case 'running':
      return {
        bg: 'blue.50',
        borderColor: 'blue.200',
        color: 'blue.700'
      };
    case 'skipped':
      return {
        bg: 'gray.50',
        borderColor: 'gray.200',
        color: 'gray.600'
      };
    default:
      return {
        bg: 'gray.50',
        borderColor: 'gray.200',
        color: 'gray.600'
      };
  }
}

function formatPipelineStatus(status: RecipePipelineStatus) {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'failed':
      return 'Failed';
    case 'running':
      return 'Running';
    case 'skipped':
      return 'Skipped';
    default:
      return 'Idle';
  }
}

function formatBuildPhase(phase: string | null | undefined) {
  if (!phase) {
    return null;
  }

  return phase
    .replace(/_/gu, ' ')
    .replace(/\b\w/gu, (character) => character.toUpperCase());
}

function PipelineStatusPill({
  label,
  status
}: {
  label: string;
  status: RecipePipelineStatus;
}) {
  const tone = pipelineStatusTone(status);

  return (
    <Box
      rounded="full"
      border="1px solid"
      borderColor={tone.borderColor}
      bg={tone.bg}
      px="2.5"
      py="1"
      _dark={{
        bg: 'whiteAlpha.120',
        borderColor: 'whiteAlpha.220'
      }}
    >
      <Text fontSize="10px" fontWeight="600" color={tone.color} textTransform="uppercase" letterSpacing="0" _dark={{ color: 'whiteAlpha.920' }}>
        {label}: {formatPipelineStatus(status)}
      </Text>
    </Box>
  );
}

function resolvePipelineSegment(pipeline: RecipePipeline | undefined) {
  if (!pipeline) {
    return null;
  }

  if (pipeline.currentStage.startsWith('task')) {
    return pipeline.task;
  }

  if (pipeline.currentStage.startsWith('baseline')) {
    return pipeline.baseline;
  }

  return pipeline.applet;
}

function resolveDynamicRecipeBannerTitle(pipeline: RecipePipeline | undefined, fallbackFailed: boolean, templateBuild = false) {
  if (!pipeline) {
    return fallbackFailed ? 'Recipe build failed' : 'Building recipe…';
  }

  switch (pipeline.currentStage) {
    case 'task_running':
      return 'Running task';
    case 'task_failed':
      return 'Task failed before Home update';
    case 'baseline_updating':
      return 'Updating Home recipe';
    case 'baseline_failed':
      return 'Home recipe update failed';
    case 'baseline_ready':
      return 'Home recipe ready';
    case 'enrichment_generating':
    case 'applet_generating':
      return templateBuild ? 'Baseline ready, recipe generation running' : 'Baseline ready, recipe enrichment running';
    case 'enrichment_validating':
    case 'applet_validating':
      return templateBuild ? 'Baseline ready, recipe generation validating' : 'Baseline ready, recipe enrichment validating';
    case 'enrichment_failed':
    case 'applet_failed':
      return templateBuild ? 'Baseline ready, recipe generation failed' : 'Baseline ready, recipe enrichment failed';
    case 'enrichment_ready':
    case 'applet_ready':
      return templateBuild ? 'Template recipe ready' : 'Rich recipe ready';
    default:
      return fallbackFailed ? 'Recipe build failed' : 'Building recipe…';
  }
}

export function DynamicRecipeView({
  recipe,
  onExecuteAction
}: {
  recipe: Recipe;
  onExecuteAction: (
    recipe: Recipe,
    actionId: string,
    input: {
      selectedItemIds?: string[];
      pageState?: Record<string, number>;
      filterState?: Record<string, string>;
      formValues?: Record<string, string | number | boolean | null>;
    }
  ) => Promise<void> | void;
}) {
  const pipeline = recipe.metadata.recipePipeline;
  const dynamic = recipe.dynamic;
  const build = dynamic?.activeBuild ?? null;
  const uiSpec = dynamic?.uiSpec;
  const actionSpec = dynamic?.actionSpec;
  const normalizedData = dynamic?.normalizedData;
  const summary = dynamic?.summary;
  const fallback = dynamic?.fallback;
  const recipeTemplate = dynamic?.recipeTemplate ?? null;
  const recipeModel = dynamic?.recipeModel ?? null;
  const baselineMarkdown = useMemo(() => {
    try {
      return getRecipeContentTab(recipe).content.markdownRepresentation.markdown.trim();
    } catch {
      return '';
    }
  }, [recipe]);
  const [pageState, setPageState] = useState<Record<string, number>>({});
  const [searchState, setSearchState] = useState<Record<string, string>>({});
  const [selectedByDataset, setSelectedByDataset] = useState<Record<string, string[]>>({});
  const [formValues, setFormValues] = useState<Record<string, string | number | boolean | null>>({});
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const mergedActions = useMemo(() => [...(actionSpec?.actions ?? [])], [actionSpec]);
  const actionMap = useMemo(() => new Map(mergedActions.map((action) => [action.id, action] as const)), [mergedActions]);
  const retryBuildAction = actionMap.get('retry-build');
  const enrichmentBuild = build ?? null;
  const _enrichmentBuildFailed = enrichmentBuild?.phase === 'failed';
  const _enrichmentBuildInProgress = Boolean(enrichmentBuild && enrichmentBuild.phase !== 'ready' && enrichmentBuild.phase !== 'failed');
  const templateBuild = enrichmentBuild?.buildKind === 'template_enrichment' || Boolean(recipeTemplate) || recipe.metadata.activeTemplateId !== undefined;
  const currentPipelineSegment = resolvePipelineSegment(pipeline);
  const templatePipelineStatus = templateBuild ? pipeline?.applet.status ?? null : null;

  async function runAction(
    actionId: string,
    context: {
      selectedItemIds?: string[];
      datasetId?: string;
      formValues?: Record<string, string | number | boolean | null>;
    } = {}
  ) {
    const action = actionMap.get(actionId);
    if (!action) {
      return;
    }

    const datasetSelection =
      context.datasetId && !context.selectedItemIds
        ? selectedByDataset[context.datasetId] ?? []
        : context.selectedItemIds ?? [];
    const selectionCount = datasetSelection.length;
    const requiresSelection = action.visibility.requiresSelection;
    if (
      (requiresSelection === 'single' && selectionCount !== 1) ||
      (requiresSelection === 'one_or_more' && selectionCount < 1)
    ) {
      return;
    }

    if (action.kind === 'destructive' && action.confirmation) {
      const confirmed = window.confirm(`${action.confirmation.title}\n\n${action.confirmation.description}`);
      if (!confirmed) {
        return;
      }
    }

    setActionLoadingId(actionId);
    setActionError(null);

    try {
      await onExecuteAction(recipe, actionId, {
        selectedItemIds: datasetSelection,
        pageState,
        filterState: searchState,
        formValues: context.formValues ?? formValues
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action failed.');
    } finally {
      setActionLoadingId(null);
    }
  }

  function renderActionButtons(actionIds: string[], context: { datasetId?: string; selectedItemIds?: string[] } = {}) {
    return actionIds.map((actionId) => {
      const action = actionMap.get(actionId);
      if (!action) {
        return null;
      }
      const tone = actionButtonTone(action);
      return (
        <Button
          key={action.id}
          size="xs"
          variant={tone.variant}
          colorPalette={tone.colorPalette}
          loading={actionLoadingId === action.id}
          onClick={() => void runAction(action.id, context)}
        >
          {action.label}
        </Button>
      );
    });
  }

  function resolveDataset(datasetId: string) {
    return normalizedData?.datasets.find((dataset) => dataset.id === datasetId) ?? null;
  }

  function getDatasetViewState(dataset: RecipeNormalizedDataset, pageSize: number) {
    const searchValue = searchState[dataset.id] ?? '';
    const filteredItems = dataset.items.filter((item) => itemSearchText(item).includes(searchValue.trim().toLowerCase()));
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    const currentPage = Math.min(pageState[dataset.id] ?? 1, totalPages);
    const visibleItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    return {
      searchValue,
      filteredItems,
      totalPages,
      currentPage,
      visibleItems,
      selectedIds: selectedByDataset[dataset.id] ?? []
    };
  }

  function setSelectedDatasetItem(datasetId: string, itemId: string, selectionMode: 'none' | 'single' | 'multiple') {
    if (selectionMode === 'none') {
      return;
    }

    setSelectedByDataset((current) => ({
      ...current,
      [datasetId]: selectionMode === 'multiple' ? [...new Set([...(current[datasetId] ?? []), itemId])] : [itemId]
    }));
  }

  function renderEmptyCard(title: string, description: string) {
    return (
      <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="3.5" py="3">
        <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">
          {title}
        </Text>
        <Text fontSize="sm" color="var(--text-secondary)">
          {description}
        </Text>
      </Box>
    );
  }

  function renderCollectionNode(node: Extract<RecipeUiNode, { kind: 'collection' }>) {
    const dataset = resolveDataset(node.datasetId);
    if (!dataset) {
      return null;
    }

    const state = getDatasetViewState(dataset, node.pageSize);
    const fieldBindings =
      node.fieldKeys.length > 0
        ? node.fieldKeys.map((fieldKey) => {
            const field = dataset.fields.find((item) => item.key === fieldKey);
            return {
              label: field?.label ?? humanizeFieldKey(fieldKey),
              fieldKey,
              presentation: field?.presentation ?? 'text',
              emphasize: 'none' as const
            };
          })
        : dataset.fields.map((field) => ({
            label: field.label,
            fieldKey: field.key,
            presentation: field.presentation,
            emphasize: 'none' as const
          }));

    return (
      <VStack key={node.id} align="stretch" gap="3" data-testid={`dynamic-recipe-node-${node.id}`}>
        <HStack justify="space-between" align="center" gap="3" wrap="wrap">
          <VStack align="start" gap="0.5">
            <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
              {node.title}
            </Text>
            <Text fontSize="xs" color="var(--text-muted)">
              {state.filteredItems.length} items
            </Text>
          </VStack>
          <HStack gap="2" wrap="wrap">
            {renderActionButtons(node.actionIds, { datasetId: dataset.id })}
          </HStack>
        </HStack>

        {state.visibleItems.length === 0 ? (
          renderEmptyCard(node.emptyState.title, node.emptyState.description)
        ) : node.display === 'table' ? (
          <Table.ScrollArea borderWidth="1px" borderColor="var(--border-subtle)" rounded="8px" overflow="auto">
            <Table.Root size="sm" variant="line">
              <Table.Header bg="var(--surface-2)">
                <Table.Row>
                  {fieldBindings.map((field) => (
                    <Table.ColumnHeader key={field.fieldKey}>{field.label}</Table.ColumnHeader>
                  ))}
                  {node.actionIds.length > 0 ? <Table.ColumnHeader>Actions</Table.ColumnHeader> : null}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {state.visibleItems.map((item) => (
                  <Table.Row
                    key={item.id}
                    cursor={node.selectable === 'none' ? 'default' : 'pointer'}
                    bg={state.selectedIds.includes(item.id) ? 'blue.50' : undefined}
                    _dark={state.selectedIds.includes(item.id) ? { bg: 'whiteAlpha.120' } : undefined}
                    onClick={() => setSelectedDatasetItem(dataset.id, item.id, node.selectable)}
                  >
                    {fieldBindings.map((field) => (
                      <Table.Cell key={field.fieldKey}>{renderValue(fieldValueFromItem(item, field), field.presentation)}</Table.Cell>
                    ))}
                    {node.actionIds.length > 0 ? (
                      <Table.Cell>
                        <HStack gap="2">
                          {renderActionButtons(node.actionIds, {
                            datasetId: dataset.id,
                            selectedItemIds: [item.id]
                          })}
                        </HStack>
                      </Table.Cell>
                    ) : null}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        ) : (
          <VStack align="stretch" gap="3">
            {state.visibleItems.map((item) => (
              <Box
                key={item.id}
                rounded="8px"
                border="1px solid var(--border-subtle)"
                bg={state.selectedIds.includes(item.id) ? 'blue.50' : 'var(--surface-2)'}
                px="3.5"
                py="3.5"
                cursor={node.selectable === 'none' ? 'default' : 'pointer'}
                _dark={state.selectedIds.includes(item.id) ? { bg: 'whiteAlpha.120' } : undefined}
                onClick={() => setSelectedDatasetItem(dataset.id, item.id, node.selectable)}
              >
                <VStack align="stretch" gap="2.5">
                  <HStack justify="space-between" align="start" gap="3">
                    <VStack align="start" gap="0.5" minW={0}>
                      <Text fontSize="sm" fontWeight="600" color="var(--text-primary)" lineClamp={2}>
                        {item.title}
                      </Text>
                      {item.subtitle ? (
                        <Text fontSize="sm" color="var(--text-secondary)" lineClamp={2}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </VStack>
                    {item.badges.length > 0 ? (
                      <HStack gap="1.5" wrap="wrap" justify="end">
                        {item.badges.map((badge) => (
                          <BadgeChip key={`${item.id}-${badge}`} label={badge} />
                        ))}
                      </HStack>
                    ) : null}
                  </HStack>

                  {item.description ? (
                    <Text fontSize="sm" color="var(--text-secondary)">
                      {item.description}
                    </Text>
                  ) : null}

                  {fieldBindings.slice(0, 3).map((field) => (
                    <HStack key={`${item.id}-${field.fieldKey}`} justify="space-between" align="start" gap="3">
                      <Text fontSize="xs" fontWeight="500" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
                        {field.label}
                      </Text>
                      {renderValue(fieldValueFromItem(item, field), field.presentation)}
                    </HStack>
                  ))}

                  {node.actionIds.length > 0 ? (
                    <>
                      <Separator borderColor="var(--border-subtle)" />
                      <HStack gap="2" wrap="wrap">
                        {renderActionButtons(node.actionIds, {
                          datasetId: dataset.id,
                          selectedItemIds: [item.id]
                        })}
                      </HStack>
                    </>
                  ) : null}
                </VStack>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    );
  }

  function renderGroupedCollectionNode(node: Extract<RecipeUiNode, { kind: 'grouped_collection' }>) {
    const dataset = resolveDataset(node.datasetId);
    if (!dataset) {
      return null;
    }

    const state = getDatasetViewState(dataset, node.pageSize);
    const groups = new Map<string, RecipeNormalizedItem[]>();
    for (const item of state.visibleItems) {
      const groupValue = getCellText(item.fields.find((field) => field.key === node.groupByFieldKey)?.value ?? '') || 'Other';
      groups.set(groupValue, [...(groups.get(groupValue) ?? []), item]);
    }

    return (
      <VStack key={node.id} align="stretch" gap="3">
        <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
          {node.title}
        </Text>
        {state.visibleItems.length === 0
          ? renderEmptyCard(node.emptyState.title, node.emptyState.description)
          : [...groups.entries()].map(([groupLabel, items]) => (
              <VStack key={`${node.id}-${groupLabel}`} align="stretch" gap="2">
                <Text fontSize="xs" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
                  {groupLabel}
                </Text>
                {items.map((item) => (
                  <Box key={item.id} rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="3.5" py="3">
                    <VStack align="stretch" gap="1.5">
                      <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                        {item.title}
                      </Text>
                      {item.subtitle ? (
                        <Text fontSize="sm" color="var(--text-secondary)">
                          {item.subtitle}
                        </Text>
                      ) : null}
                      {renderActionButtons(node.actionIds, {
                        datasetId: dataset.id,
                        selectedItemIds: [item.id]
                      })}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            ))}
      </VStack>
    );
  }

  function resolveRecordForNode(datasetId: string, source: 'selected' | 'first' | 'single') {
    const dataset = resolveDataset(datasetId);
    if (!dataset) {
      return null;
    }

    if (source === 'first' || source === 'single') {
      return dataset.items[0] ?? null;
    }

    return resolveSelectedItem(dataset.id, dataset, selectedByDataset);
  }

  function renderPropertyLikeNode(node: Extract<RecipeUiNode, { kind: 'property_sheet' | 'detail_sheet' }>) {
    const dataset = resolveDataset(node.datasetId);
    if (!dataset) {
      return null;
    }

    const selectedItem = resolveRecordForNode(node.datasetId, node.source);
    const fieldBindings = node.fieldKeys.length
      ? node.fieldKeys.map((fieldKey) => {
          const field = dataset.fields.find((item) => item.key === fieldKey);
          return {
            label: field?.label ?? humanizeFieldKey(fieldKey),
            fieldKey,
            presentation: field?.presentation ?? 'text',
            emphasize: 'none' as const
          };
        })
      : dataset.fields.map((field) => ({
          label: field.label,
          fieldKey: field.key,
          presentation: field.presentation,
          emphasize: 'none' as const
        }));

    return (
      <VStack key={node.id} align="stretch" gap="3">
        <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
          {node.title}
        </Text>
        {!selectedItem ? (
          renderEmptyCard(node.emptyState.title, node.emptyState.description)
        ) : (
          <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="3.5" py="3.5">
            <VStack align="stretch" gap="2.5">
              <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                {selectedItem.title}
              </Text>
              {selectedItem.description ? (
                <Text fontSize="sm" color="var(--text-secondary)">
                  {selectedItem.description}
                </Text>
              ) : null}
              {fieldBindings.map((field) => (
                <HStack key={`${selectedItem.id}-${field.fieldKey}`} justify="space-between" align="start" gap="3">
                  <Text fontSize="xs" fontWeight="500" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
                    {field.label}
                  </Text>
                  {renderValue(fieldValueFromItem(selectedItem, field), field.presentation)}
                </HStack>
              ))}
              {node.actionIds.length > 0 ? (
                <>
                  <Separator borderColor="var(--border-subtle)" />
                  <HStack gap="2" wrap="wrap">
                    {renderActionButtons(node.actionIds, {
                      datasetId: dataset.id,
                      selectedItemIds: [selectedItem.id]
                    })}
                  </HStack>
                </>
              ) : null}
            </VStack>
          </Box>
        )}
      </VStack>
    );
  }

  function renderTimelineNode(node: Extract<RecipeUiNode, { kind: 'timeline' }>) {
    const dataset = resolveDataset(node.datasetId);
    if (!dataset) {
      return null;
    }

    const state = getDatasetViewState(dataset, dataset.pageInfo.pageSize ?? 6);
    const sortedItems = [...state.visibleItems].sort((left, right) => {
      const leftValue = getCellText(left.fields.find((field) => field.key === node.timeFieldKey)?.value ?? '');
      const rightValue = getCellText(right.fields.find((field) => field.key === node.timeFieldKey)?.value ?? '');
      return Date.parse(rightValue) - Date.parse(leftValue);
    });

    return (
      <VStack key={node.id} align="stretch" gap="3">
        <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
          {node.title}
        </Text>
        {sortedItems.length === 0
          ? renderEmptyCard(node.emptyState.title, node.emptyState.description)
          : sortedItems.map((item) => (
              <HStack key={item.id} align="start" gap="3">
                <Box mt="1.5" width="8px" height="8px" rounded="full" bg="blue.500" flexShrink={0} />
                <VStack align="stretch" gap="1.5" flex="1" minW={0}>
                  <Text fontSize="xs" fontWeight="500" color="var(--text-muted)">
                    {getCellText(item.fields.find((field) => field.key === node.timeFieldKey)?.value ?? '') || 'Unknown time'}
                  </Text>
                  <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text fontSize="sm" color="var(--text-secondary)">
                      {item.description}
                    </Text>
                  ) : null}
                  {renderActionButtons(node.actionIds, {
                    datasetId: dataset.id,
                    selectedItemIds: [item.id]
                  })}
                </VStack>
              </HStack>
            ))}
      </VStack>
    );
  }

  function renderV2Nodes(nodes: RecipeUiNode[]): ReactNode {
    return nodes.map((node) => {
      switch (node.kind) {
        case 'section_group':
          return (
            <VStack key={node.id} align="stretch" gap="3" data-testid={`dynamic-recipe-node-${node.id}`}>
              {node.title ? (
                <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                  {node.title}
                </Text>
              ) : null}
              {node.description ? (
                <Text fontSize="sm" color="var(--text-secondary)">
                  {node.description}
                </Text>
              ) : null}
              {renderV2Nodes(node.children)}
            </VStack>
          );
        case 'tab_group': {
          const activeValue = activeTabs[node.id] ?? node.defaultTabId ?? node.tabs[0]?.id;
          return (
            <Tabs.Root
              key={node.id}
              value={activeValue}
              onValueChange={(details) =>
                setActiveTabs((current) => ({
                  ...current,
                  [node.id]: details.value
                }))
              }
              variant="plain"
            >
              <Tabs.List rounded="8px" bg="var(--surface-2)" p="1" minW="max-content">
                {node.tabs.map((tab) => (
                  <Tabs.Trigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </Tabs.Trigger>
                ))}
                <Tabs.Indicator />
              </Tabs.List>
              <Tabs.ContentGroup pt="3">
                {node.tabs.map((tab) => (
                  <Tabs.Content key={tab.id} value={tab.id}>
                    <VStack align="stretch" gap="3">
                      {renderV2Nodes(tab.children)}
                    </VStack>
                  </Tabs.Content>
                ))}
              </Tabs.ContentGroup>
            </Tabs.Root>
          );
        }
        case 'markdown_block':
          return (
            <VStack key={node.id} align="stretch" gap="2">
              {node.title ? (
                <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                  {node.title}
                </Text>
              ) : null}
              <RecipeMarkdownBlock content={node.markdown} />
            </VStack>
          );
        case 'stat_grid':
          return (
            <HStack key={node.id} gap="2" wrap="wrap">
              {(summary?.stats ?? [])
                .filter((stat) => node.statIds.includes(stat.id))
                .map((stat) => (
                  <StatCard key={stat.id} label={stat.label} value={stat.value} />
                ))}
            </HStack>
          );
        case 'action_bar':
          return (
            <HStack key={node.id} gap="2" wrap="wrap">
              {renderActionButtons(node.actionIds)}
            </HStack>
          );
        case 'filter_bar':
          return (
            <Input
              key={node.id}
              size="xs"
              maxW="240px"
              placeholder={node.placeholder ?? 'Search'}
              value={searchState[node.datasetId] ?? ''}
              onChange={(event) => {
                setSearchState((current) => ({
                  ...current,
                  [node.datasetId]: event.target.value
                }));
                setPageState((current) => ({
                  ...current,
                  [node.datasetId]: 1
                }));
              }}
            />
          );
        case 'collection':
          return renderCollectionNode(node);
        case 'grouped_collection':
          return renderGroupedCollectionNode(node);
        case 'property_sheet':
        case 'detail_sheet':
          return renderPropertyLikeNode(node);
        case 'timeline':
          return renderTimelineNode(node);
        case 'paginator': {
          const dataset = resolveDataset(node.datasetId);
          if (!dataset) {
            return null;
          }
          const state = getDatasetViewState(dataset, node.pageSize);
          if (state.totalPages <= 1) {
            return null;
          }
          return (
            <HStack key={node.id} justify="space-between" align="center">
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  setPageState((current) => ({
                    ...current,
                    [dataset.id]: Math.max(1, state.currentPage - 1)
                  }))
                }
                disabled={state.currentPage <= 1}
              >
                Previous
              </Button>
              <Text fontSize="xs" color="var(--text-muted)">
                Page {state.currentPage} of {state.totalPages}
              </Text>
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  setPageState((current) => ({
                    ...current,
                    [dataset.id]: Math.min(state.totalPages, state.currentPage + 1)
                  }))
                }
                disabled={state.currentPage >= state.totalPages}
              >
                Next
              </Button>
            </HStack>
          );
        }
        case 'empty_state':
          return <Box key={node.id}>{renderEmptyCard(node.title, node.description)}</Box>;
        case 'error_state':
          return <Box key={node.id}>{renderEmptyCard(node.title, node.description)}</Box>;
        default:
          return null;
      }
    });
  }

  function renderEnrichmentStatusBanner() {
    return null;
  }

  const dynamicBuildReady = build?.phase === 'ready';
  const templateBuildFailed =
    templateBuild &&
    !recipeTemplate &&
    (templatePipelineStatus === 'failed' ||
      (templatePipelineStatus !== 'running' && (enrichmentBuild?.phase === 'failed' || (dynamicBuildReady && !recipeTemplate))));
  const templateFailureCategory = templateBuildFailed
    ? currentPipelineSegment?.failureCategory ??
      enrichmentBuild?.failureCategory ??
      (templateBuild && dynamicBuildReady && !recipeTemplate ? 'validation_failed' : null)
    : null;
  const templateBuildPhaseLabel =
    currentPipelineSegment?.status === 'running' && enrichmentBuild?.phase === 'failed'
      ? null
      : formatBuildPhase(enrichmentBuild?.phase ?? null);
  const templateStatusMessage =
    currentPipelineSegment?.message ??
    enrichmentBuild?.userFacingMessage ??
    enrichmentBuild?.progressMessage ??
    (recipeTemplate ? 'Recipe template ready.' : 'Preparing the template-constrained recipe.');

  function renderBaselineRecipePreview() {
    if (baselineMarkdown) {
      return (
        <Box
          flex="1"
          minH={0}
          rounded="8px"
          border="1px solid var(--border-subtle)"
          bg="var(--surface-1)"
          px="4"
          py="4"
          overflow="auto"
          data-testid="dynamic-recipe-baseline"
        >
          <RecipeMarkdownBlock content={baselineMarkdown} />
        </Box>
      );
    }

    if (fallback) {
      return (
        <Box
          flex="1"
          minH={0}
          rounded="8px"
          border="1px solid var(--border-subtle)"
          bg="var(--surface-1)"
          px="4"
          py="4"
          overflow="auto"
          data-testid="dynamic-recipe-fallback"
        >
          <VStack align="stretch" gap="3">
            <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">
              {fallback.title}
            </Text>
            <Text fontSize="sm" color="var(--text-secondary)">
              {fallback.message}
            </Text>
            <RecipeMarkdownBlock content={fallback.summaryMarkdown} />
          </VStack>
        </Box>
      );
    }

    return null;
  }

  function renderTemplateLoadingShell() {
    const tid = recipe.metadata.activeTemplateId;
    const ghostBar = (w: string) => <Skeleton h="3" rounded="full" w={w} />;
    const ghostCard = (idx: number) => (
      <Box key={`gcard-${idx}`} flex={{ base: '1 1 100%', md: '1 1 calc(50% - 8px)' }} minW="220px" rounded="8px" border="1px dashed var(--border-subtle)" bg="var(--surface-2)" px="4" py="3.5">
        <VStack align="stretch" gap="2.5">
          {ghostBar('52%')}
          {ghostBar('84%')}
          {ghostBar('68%')}
        </VStack>
      </Box>
    );
    const ghostListItem = (idx: number, w1 = '54%', w2 = '80%') => (
      <Box key={`gli-${idx}`} rounded="8px" border="1px dashed var(--border-subtle)" bg="var(--surface-2)" px="3.5" py="3">
        <VStack align="stretch" gap="2">
          {ghostBar(w1)}
          {ghostBar(w2)}
        </VStack>
      </Box>
    );
    const ghostStats = () => (
      <HStack gap="3" flexWrap="wrap">
        {Array.from({ length: 3 }).map((_, i) => (
          <Box key={`gs-${i}`} minW="124px" rounded="8px" border="1px dashed var(--border-subtle)" bg="var(--surface-2)" px="3.5" py="3">
            {ghostBar('42%')}
            <Box mt="3">{ghostBar('62%')}</Box>
          </Box>
        ))}
      </HStack>
    );
    const ghostTabs = (tabCount: number) => (
      <VStack align="stretch" gap="3">
        <HStack gap="2" flexWrap="wrap">
          {Array.from({ length: tabCount }).map((_, i) => (
            <Box key={`gt-${i}`} h="8" w={`${68 + i * 18}px`} rounded="8px" bg={i === 0 ? 'rgba(37, 99, 235, 0.12)' : 'rgba(148, 163, 184, 0.18)'} />
          ))}
        </HStack>
        <VStack align="stretch" gap="2.5">
          {Array.from({ length: 3 }).map((_, i) => ghostListItem(i, `${48 + i * 10}%`, '80%'))}
        </VStack>
      </VStack>
    );
    const ghostSplit = () => (
      <HStack align="stretch" gap="3" flexWrap="wrap">
        <VStack align="stretch" gap="2.5" flex="1" minW="180px">
          {Array.from({ length: 3 }).map((_, i) => ghostListItem(i, `${52 + i * 8}%`))}
        </VStack>
        <VStack align="stretch" gap="3" flex="1.5" minW="200px">
          {ghostBar('44%')}
          {ghostBar('88%')}
          {ghostBar('72%')}
          {ghostBar('60%')}
        </VStack>
      </HStack>
    );
    const ghostTable = () => (
      <VStack align="stretch" gap="2.5">
        {ghostBar('48%')}
        <Box rounded="8px" border="1px dashed var(--border-subtle)" px="3.5" py="3">
          <VStack align="stretch" gap="2">
            {ghostBar('100%')}
            {ghostBar('88%')}
            {ghostBar('94%')}
            {ghostBar('76%')}
          </VStack>
        </Box>
      </VStack>
    );

    let inner: React.ReactNode;
    switch (tid) {
      case 'flight-comparison':
      case 'travel-itinerary-planner':
      case 'event-planner':
        inner = ghostTabs(3);
        break;
      case 'research-notebook':
        inner = ghostTabs(4);
        break;
      case 'inbox-triage-board':
      case 'security-review-board':
        inner = (
          <VStack align="stretch" gap="4">
            {ghostStats()}
            {ghostSplit()}
          </VStack>
        );
        break;
      case 'restaurant-finder':
      case 'local-discovery-comparison':
        inner = (
          <VStack align="stretch" gap="4">
            <HStack gap="2" flexWrap="wrap">
              {Array.from({ length: 4 }).map((_, i) => (
                <Box key={`gfilt-${i}`} h="7" w={`${58 + i * 14}px`} rounded="full" bg="rgba(148, 163, 184, 0.18)" />
              ))}
            </HStack>
            {ghostSplit()}
          </VStack>
        );
        break;
      case 'hotel-shortlist':
      case 'job-search-pipeline':
        inner = (
          <VStack align="stretch" gap="4">
            {ghostStats()}
            <HStack gap="3.5" flexWrap="wrap">
              {ghostCard(0)}
              {ghostCard(1)}
            </HStack>
          </VStack>
        );
        break;
      case 'shopping-shortlist':
        inner = (
          <HStack gap="3.5" flexWrap="wrap">
            {ghostCard(0)}
            {ghostCard(1)}
          </HStack>
        );
        break;
      case 'price-comparison-grid':
        inner = ghostTable();
        break;
      case 'vendor-evaluation-matrix':
        inner = (
          <VStack align="stretch" gap="4">
            {ghostStats()}
            {ghostTable()}
          </VStack>
        );
        break;
      case 'step-by-step-instructions':
        inner = (
          <VStack align="stretch" gap="3">
            {Array.from({ length: 4 }).map((_, i) => (
              <HStack key={`gcl-${i}`} gap="3" align="start">
                <Box mt="1" w="4" h="4" rounded="4px" border="1px dashed var(--border-subtle)" flexShrink={0} />
                <VStack align="stretch" gap="2" flex="1">
                  {ghostBar(`${68 + i * 6}%`)}
                  {ghostBar('52%')}
                </VStack>
              </HStack>
            ))}
          </VStack>
        );
        break;
      default:
        inner = (
          <VStack align="stretch" gap="4">
            <Box rounded="8px" border="1px dashed var(--border-subtle)" bg="var(--surface-2)" px="4" py="4">
              <VStack align="stretch" gap="2.5">
                {ghostBar('38%')}
                {ghostBar('76%')}
              </VStack>
            </Box>
            <HStack align="stretch" gap="4" flexWrap="wrap">
              {ghostCard(0)}
              {ghostCard(1)}
            </HStack>
          </VStack>
        );
    }

    return (
      <Box
        flex="1"
        minH={0}
        rounded="8px"
        border="1px solid var(--border-subtle)"
        bg="var(--surface-1)"
        px="4"
        py="4"
        overflow="auto"
        data-testid="dynamic-recipe-template-shell"
      >
        {inner}
      </Box>
    );
  }

  if (templateBuild && recipeTemplate) {
    return (
      <VStack align="stretch" gap="3" h="100%" minH={0} data-testid="dynamic-recipe-template-ready">
        {renderEnrichmentStatusBanner()}
        <Box
          flex="1"
          minH={0}
          rounded="8px"
          border="1px solid var(--border-subtle)"
          bg="var(--surface-1)"
          px="4"
          py="4"
          overflow="auto"
          data-testid="dynamic-recipe-scroll"
        >
          <RecipeTemplateRenderer
            recipe={recipe}
            templateState={recipeTemplate}
            actionSpec={actionSpec}
            actionLoadingId={actionLoadingId}
            actionError={actionError}
            onRunAction={(actionId, input) =>
              runAction(actionId, {
                selectedItemIds: input.selectedItemIds,
                formValues: input.formValues
              })
            }
          />
        </Box>
      </VStack>
    );
  }

  if (templateBuild && !recipeTemplate) {
    if (templateBuildFailed) {
      return (
        <VStack
          align="stretch"
          gap="3"
          h="100%"
          minH={0}
          data-testid="recipe-template-generation-failed"
        >
          <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-1)" px="4" py="4">
            <HStack align="start" gap="3">
              <Box
                mt="0.5"
                flexShrink={0}
                width="24px"
                height="24px"
                rounded="full"
                border="1px solid"
                borderColor="red.300"
                color="red.500"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="500"
              >
                !
              </Box>
              <VStack align="start" gap="1.5">
                <Text fontSize="md" fontWeight="600" color="var(--text-primary)">
                  Recipe generation failed
                </Text>
                <Text fontSize="sm" color="var(--text-secondary)">
                  {templateStatusMessage}
                </Text>
                {templateFailureCategory ? (
                  <Text fontSize="sm" color="var(--text-muted)">
                    Reason: {humanizeRecipeFailureCategory(templateFailureCategory)}
                  </Text>
                ) : null}
                {templateBuildPhaseLabel ? (
                  <Text fontSize="sm" color="var(--text-muted)">
                    Stage: {templateBuildPhaseLabel}
                  </Text>
                ) : null}
                {actionError ? (
                  <Text fontSize="sm" color="red.500">
                    {actionError}
                  </Text>
                ) : null}
                {pipeline ? (
                  <HStack gap="2" wrap="wrap" data-testid="dynamic-recipe-pipeline-statuses">
                    <PipelineStatusPill label="Task" status={pipeline.task.status} />
                    <PipelineStatusPill label="Home" status={pipeline.baseline.status} />
                    <PipelineStatusPill label="Generation" status={pipeline.applet.status} />
                  </HStack>
                ) : null}
                {actionMap.has('retry-build') ? (
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="blue"
                    loading={actionLoadingId === 'retry-build'}
                    onClick={() => void runAction('retry-build')}
                  >
                    {resolveRetryBuildLabel(retryBuildAction, true)}
                  </Button>
                ) : null}
                <Text fontSize="xs" color="var(--text-muted)">
                  The recipe stays explicit when template generation fails. It does not silently fall back to arbitrary rendering.
                </Text>
              </VStack>
            </HStack>
          </Box>
          {renderTemplateLoadingShell()}
        </VStack>
      );
    }

    return (
      <Box h="100%" minH={0} data-testid="recipe-template-generation-running">
        {renderTemplateLoadingShell()}
      </Box>
    );
  }

  if (!recipeModel && !dynamicBuildReady) {
    const failed = enrichmentBuild?.phase === 'failed';
    const buildPhaseLabel = formatBuildPhase(enrichmentBuild?.phase ?? null);
    return (
      <VStack align="stretch" gap="3" h="100%" minH={0} data-testid={failed ? 'dynamic-recipe-failed' : 'dynamic-recipe-building'}>
        <Box
          rounded="8px"
          border="1px solid var(--border-subtle)"
          bg="var(--surface-1)"
          px="4"
          py="4"
        >
          <HStack align="start" gap="3">
            {failed ? (
              <Box
                mt="0.5"
                flexShrink={0}
                width="24px"
                height="24px"
                rounded="full"
                border="1px solid"
                borderColor="red.300"
                color="red.500"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="500"
              >
                !
              </Box>
            ) : (
              <Spinner size="sm" color="blue.500" mt="1" />
            )}
            <VStack align="start" gap="1.5">
              <Text fontSize="md" fontWeight="600" color="var(--text-primary)">
                {resolveDynamicRecipeBannerTitle(pipeline, failed, templateBuild)}
              </Text>
              <Text fontSize="sm" color="var(--text-secondary)">
                {currentPipelineSegment?.message ??
                  enrichmentBuild?.userFacingMessage ??
                  enrichmentBuild?.progressMessage ??
                  'Preparing a richer recipe view.'}
              </Text>
              {humanizeRecipeFailureCategory(currentPipelineSegment?.failureCategory ?? enrichmentBuild?.failureCategory ?? null) ? (
                <Text fontSize="sm" color="var(--text-muted)">
                  Cause:{' '}
                  {humanizeRecipeFailureCategory(currentPipelineSegment?.failureCategory ?? enrichmentBuild?.failureCategory ?? null)}
                  {currentPipelineSegment?.configuredTimeoutMs ?? enrichmentBuild?.configuredTimeoutMs
                    ? ` • ${(currentPipelineSegment?.configuredTimeoutMs ?? enrichmentBuild?.configuredTimeoutMs ?? 0).toLocaleString()}ms limit`
                    : ''}
                </Text>
              ) : null}
              {buildPhaseLabel ? (
                <Text fontSize="sm" color="var(--text-muted)">
                  Stage: {buildPhaseLabel}
                </Text>
              ) : null}
              {actionError ? (
                <Text fontSize="sm" color="red.500">
                  {actionError}
                </Text>
              ) : null}
              {pipeline ? (
                <HStack gap="2" wrap="wrap" data-testid="dynamic-recipe-pipeline-statuses">
                  <PipelineStatusPill label="Task" status={pipeline.task.status} />
                  <PipelineStatusPill label="Home" status={pipeline.baseline.status} />
                  <PipelineStatusPill label={templateBuild ? 'Generation' : 'Enrichment'} status={pipeline.applet.status} />
                </HStack>
              ) : null}
              {actionMap.has('retry-build') ? (
                <Button
                  size="xs"
                  variant="outline"
                  colorPalette="blue"
                  loading={actionLoadingId === 'retry-build'}
                  onClick={() => void runAction('retry-build')}
                >
                  {resolveRetryBuildLabel(retryBuildAction, Boolean(templateBuild))}
                </Button>
              ) : null}
              {actionMap.has('retry-build') ? (
                <Text fontSize="xs" color="var(--text-muted)">
                  {resolveRetryBuildGuidance(Boolean(templateBuild))}
                </Text>
              ) : null}
            </VStack>
          </HStack>
        </Box>

        {renderBaselineRecipePreview()}
      </VStack>
    );
  }

  if (recipeModel) {
    return (
      <VStack align="stretch" gap="3" h="100%" minH={0} data-testid="dynamic-recipe-ready">
        {renderEnrichmentStatusBanner()}
        <Box
          flex="1"
          minH={0}
          rounded="8px"
          border="1px solid var(--border-subtle)"
          bg="var(--surface-1)"
          px="4"
          py="4"
          overflow="auto"
          data-testid="dynamic-recipe-scroll"
        >
          <RecipeDslRenderer recipe={recipe} recipeModel={recipeModel} onExecuteAction={onExecuteAction} />
        </Box>
      </VStack>
    );
  }

  if (!uiSpec || !actionSpec || !normalizedData || !summary) {
    return (
      <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-1)" px="4" py="4">
        <Text fontSize="sm" color="var(--text-secondary)">
          The richer recipe is missing validated artifacts. Showing the safe fallback instead.
        </Text>
        {fallback ? <RecipeMarkdownBlock content={fallback.summaryMarkdown} /> : null}
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap="3" h="100%" minH={0} data-testid="dynamic-recipe-ready">
      {renderEnrichmentStatusBanner()}
      <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-1)" px="4" py="3.5">
        <VStack align="stretch" gap="3">
          <HStack justify="space-between" align="start" gap="3">
            <VStack align="start" gap="1" minW={0}>
              <Text fontSize="md" fontWeight="600" color="var(--text-primary)" lineClamp={2}>
                {uiSpec.header.title}
              </Text>
              {uiSpec.header.subtitle ? (
                <Text fontSize="sm" color="var(--text-secondary)" lineClamp={2}>
                  {uiSpec.header.subtitle}
                </Text>
              ) : null}
              <Text fontSize="xs" color="var(--text-muted)">
                {uiSpec.header.statusLabel ?? summary.statusLabel ?? 'Ready'}
              </Text>
            </VStack>

            <HStack gap="2" wrap="wrap" justify="end">
              {[...uiSpec.header.primaryActionIds, ...uiSpec.header.secondaryActionIds].map((actionId) => {
                const action = actionMap.get(actionId);
                if (!action) {
                  return null;
                }

                const tone = actionButtonTone(action);
                return (
                  <Button
                    key={action.id}
                    size="xs"
                    rounded="full"
                    variant={tone.variant}
                    colorPalette={tone.colorPalette}
                    loading={actionLoadingId === action.id}
                    onClick={() => void runAction(action.id)}
                  >
                    {action.label}
                  </Button>
                );
              })}
            </HStack>
          </HStack>

          {uiSpec.header.badges.length > 0 ? (
            <HStack gap="1.5" wrap="wrap">
              {uiSpec.header.badges.map((badge) => (
                <BadgeChip key={`${uiSpec.header.title}-${badge}`} label={badge} />
              ))}
            </HStack>
          ) : null}

          {summary.stats.length > 0 ? (
            <HStack gap="2" wrap="wrap">
              {summary.stats.map((stat) => (
                <StatCard key={stat.id} label={stat.label} value={stat.value} />
              ))}
            </HStack>
          ) : null}

          {actionError ? (
            <Text fontSize="sm" color="red.500">
              {actionError}
            </Text>
          ) : null}
        </VStack>
      </Box>

          <Box
            flex="1"
            minH={0}
            rounded="8px"
            border="1px solid var(--border-subtle)"
            bg="var(--surface-1)"
            px="4"
            py="4"
            overflow="auto"
            data-testid="dynamic-recipe-scroll"
          >
            <VStack align="stretch" gap="4">
              {uiSpec.schemaVersion === 'recipe_ui/v2' ? renderV2Nodes(uiSpec.nodes) : uiSpec.sections.map((section) => {
            if (section.kind === 'summary') {
              return (
                <VStack key={section.id} align="stretch" gap="3">
                  <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                    {section.title}
                  </Text>
                  {section.subtitle ? (
                    <Text fontSize="sm" color="var(--text-secondary)">
                      {section.subtitle}
                    </Text>
                  ) : null}
                  {section.statIds.length > 0 ? (
                    <HStack gap="2" wrap="wrap">
                      {summary.stats
                        .filter((stat) => section.statIds.includes(stat.id))
                        .map((stat) => (
                          <StatCard key={stat.id} label={stat.label} value={stat.value} />
                        ))}
                    </HStack>
                  ) : null}
                  {section.actionIds.length > 0 ? (
                    <HStack gap="2" wrap="wrap">
                      {section.actionIds.map((actionId) => {
                        const action = actionMap.get(actionId);
                        if (!action) {
                          return null;
                        }
                        const tone = actionButtonTone(action);
                        return (
                          <Button
                            key={action.id}
                            size="xs"
                            variant={tone.variant}
                            colorPalette={tone.colorPalette}
                            loading={actionLoadingId === action.id}
                            onClick={() => void runAction(action.id)}
                          >
                            {action.label}
                          </Button>
                        );
                      })}
                    </HStack>
                  ) : null}
                </VStack>
              );
            }

            if (section.kind === 'collection') {
              const dataset = normalizedData.datasets.find((item) => item.id === section.datasetId);
              if (!dataset) {
                return null;
              }

              const searchValue = searchState[section.id] ?? '';
              const filteredItems = dataset.items.filter((item) => itemSearchText(item).includes(searchValue.trim().toLowerCase()));
              const totalPages = Math.max(1, Math.ceil(filteredItems.length / section.pageSize));
              const currentPage = Math.min(pageState[section.id] ?? 1, totalPages);
              const visibleItems = filteredItems.slice((currentPage - 1) * section.pageSize, currentPage * section.pageSize);
              const selectedIds = selectedByDataset[dataset.id] ?? [];

              return (
                <VStack key={section.id} align="stretch" gap="3" data-testid={`dynamic-recipe-collection-${section.id}`}>
                  <HStack justify="space-between" align="center" gap="3" wrap="wrap">
                    <VStack align="start" gap="0.5">
                      <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                        {section.title}
                      </Text>
                      <Text fontSize="xs" color="var(--text-muted)">
                        {filteredItems.length} items
                      </Text>
                    </VStack>

                    <HStack gap="2" wrap="wrap">
                      {section.searchable ? (
                        <Input
                          size="xs"
                          maxW="220px"
                          placeholder={`Search ${section.title.toLowerCase()}`}
                          value={searchValue}
                          onChange={(event) => {
                            setSearchState((current) => ({
                              ...current,
                              [section.id]: event.target.value
                            }));
                            setPageState((current) => ({
                              ...current,
                              [section.id]: 1
                            }));
                          }}
                        />
                      ) : null}

                      {section.primaryActionIds.map((actionId) => {
                        const action = actionMap.get(actionId);
                        if (!action) {
                          return null;
                        }
                        const tone = actionButtonTone(action);
                        return (
                          <Button
                            key={action.id}
                            size="xs"
                            variant={tone.variant}
                            colorPalette={tone.colorPalette}
                            loading={actionLoadingId === action.id}
                            onClick={() => void runAction(action.id, { datasetId: dataset.id })}
                          >
                            {action.label}
                          </Button>
                        );
                      })}
                    </HStack>
                  </HStack>

                  {visibleItems.length === 0 ? (
                    <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="3.5" py="3">
                      <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">
                        {section.emptyState.title}
                      </Text>
                      <Text fontSize="sm" color="var(--text-secondary)">
                        {section.emptyState.description}
                      </Text>
                    </Box>
                  ) : section.presentation === 'table' ? (
                    <Table.ScrollArea borderWidth="1px" borderColor="var(--border-subtle)" rounded="8px" overflow="auto">
                      <Table.Root size="sm" variant="line">
                        <Table.Header bg="var(--surface-2)">
                          <Table.Row>
                            {(section.columns.length > 0 ? section.columns : dataset.fields.map((field) => ({
                              label: field.label,
                              fieldKey: field.key,
                              presentation: field.presentation,
                              emphasize: 'none' as const
                            }))).map((column) => (
                              <Table.ColumnHeader key={column.fieldKey}>{column.label}</Table.ColumnHeader>
                            ))}
                            {section.rowActionIds.length > 0 ? <Table.ColumnHeader>Actions</Table.ColumnHeader> : null}
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {visibleItems.map((item) => (
                            <Table.Row
                              key={item.id}
                              cursor={section.selection === 'none' ? 'default' : 'pointer'}
                              bg={selectedIds.includes(item.id) ? 'blue.50' : undefined}
                              _dark={selectedIds.includes(item.id) ? { bg: 'whiteAlpha.120' } : undefined}
                              onClick={() => {
                                if (section.selection === 'none') {
                                  return;
                                }
                                setSelectedByDataset((current) => ({
                                  ...current,
                                  [dataset.id]: section.selection === 'multiple' ? [...new Set([...(current[dataset.id] ?? []), item.id])] : [item.id]
                                }));
                              }}
                            >
                              {(section.columns.length > 0 ? section.columns : dataset.fields.map((field) => ({
                                label: field.label,
                                fieldKey: field.key,
                                presentation: field.presentation,
                                emphasize: 'none' as const
                              }))).map((column) => (
                                <Table.Cell key={column.fieldKey}>
                                  {renderValue(fieldValueFromItem(item, column), column.presentation)}
                                </Table.Cell>
                              ))}
                              {section.rowActionIds.length > 0 ? (
                                <Table.Cell>
                                  <HStack gap="2">
                                    {section.rowActionIds.map((actionId) => {
                                      const action = actionMap.get(actionId);
                                      if (!action) {
                                        return null;
                                      }
                                      const tone = actionButtonTone(action);
                                      return (
                                        <Button
                                          key={action.id}
                                          size="xs"
                                          variant={tone.variant}
                                          colorPalette={tone.colorPalette}
                                          loading={actionLoadingId === action.id}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setSelectedByDataset((current) => ({
                                              ...current,
                                              [dataset.id]: [item.id]
                                            }));
                                            void runAction(action.id, {
                                              datasetId: dataset.id,
                                              selectedItemIds: [item.id]
                                            });
                                          }}
                                        >
                                          {action.label}
                                        </Button>
                                      );
                                    })}
                                  </HStack>
                                </Table.Cell>
                              ) : null}
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Table.ScrollArea>
                  ) : (
                    <VStack align="stretch" gap="3">
                      {visibleItems.map((item) => (
                        <Box
                          key={item.id}
                          rounded="8px"
                          border="1px solid var(--border-subtle)"
                          bg={selectedIds.includes(item.id) ? 'blue.50' : 'var(--surface-2)'}
                          px="3.5"
                          py="3.5"
                          cursor={section.selection === 'none' ? 'default' : 'pointer'}
                          _dark={selectedIds.includes(item.id) ? { bg: 'whiteAlpha.120' } : undefined}
                          onClick={() => {
                            if (section.selection === 'none') {
                              return;
                            }
                            setSelectedByDataset((current) => ({
                              ...current,
                              [dataset.id]: section.selection === 'multiple' ? [...new Set([...(current[dataset.id] ?? []), item.id])] : [item.id]
                            }));
                          }}
                        >
                          <VStack align="stretch" gap="2.5">
                            <HStack justify="space-between" align="start" gap="3">
                              <VStack align="start" gap="0.5" minW={0}>
                                <Text fontSize="sm" fontWeight="600" color="var(--text-primary)" lineClamp={2}>
                                  {item.title}
                                </Text>
                                {item.subtitle ? (
                                  <Text fontSize="sm" color="var(--text-secondary)" lineClamp={2}>
                                    {item.subtitle}
                                  </Text>
                                ) : null}
                              </VStack>
                              {item.badges.length > 0 ? (
                                <HStack gap="1.5" wrap="wrap" justify="end">
                                  {item.badges.map((badge) => (
                                    <BadgeChip key={`${item.id}-${badge}`} label={badge} />
                                  ))}
                                </HStack>
                              ) : null}
                            </HStack>

                            {item.description ? (
                              <Text fontSize="sm" color="var(--text-secondary)">
                                {item.description}
                              </Text>
                            ) : null}

                            {(section.presentation === 'cards' ? section.cardFields : section.columns).slice(0, 3).map((field) => (
                              <HStack key={`${item.id}-${field.fieldKey}`} justify="space-between" align="start" gap="3">
                                <Text fontSize="xs" fontWeight="500" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
                                  {field.label}
                                </Text>
                                {renderValue(fieldValueFromItem(item, field), field.presentation)}
                              </HStack>
                            ))}

                            {section.rowActionIds.length > 0 ? (
                              <>
                                <Separator borderColor="var(--border-subtle)" />
                                <HStack gap="2" wrap="wrap">
                                  {section.rowActionIds.map((actionId) => {
                                    const action = actionMap.get(actionId);
                                    if (!action) {
                                      return null;
                                    }
                                    const tone = actionButtonTone(action);
                                    return (
                                      <Button
                                        key={action.id}
                                        size="xs"
                                        variant={tone.variant}
                                        colorPalette={tone.colorPalette}
                                        loading={actionLoadingId === action.id}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setSelectedByDataset((current) => ({
                                            ...current,
                                            [dataset.id]: [item.id]
                                          }));
                                          void runAction(action.id, {
                                            datasetId: dataset.id,
                                            selectedItemIds: [item.id]
                                          });
                                        }}
                                      >
                                        {action.label}
                                      </Button>
                                    );
                                  })}
                                </HStack>
                              </>
                            ) : null}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  )}

                  {totalPages > 1 ? (
                    <HStack justify="space-between" align="center">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          setPageState((current) => ({
                            ...current,
                            [section.id]: Math.max(1, currentPage - 1)
                          }))
                        }
                        disabled={currentPage <= 1}
                      >
                        Previous
                      </Button>
                      <Text fontSize="xs" color="var(--text-muted)">
                        Page {currentPage} of {totalPages}
                      </Text>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          setPageState((current) => ({
                            ...current,
                            [section.id]: Math.min(totalPages, currentPage + 1)
                          }))
                        }
                        disabled={currentPage >= totalPages}
                      >
                        Next
                      </Button>
                    </HStack>
                  ) : null}
                </VStack>
              );
            }

            if (section.kind === 'detail') {
              const dataset = normalizedData.datasets.find((item) => item.id === section.datasetId);
              if (!dataset) {
                return null;
              }

              const selectedItem = section.source === 'first' ? dataset.items[0] ?? null : resolveSelectedItem(dataset.id, dataset, selectedByDataset);
              return (
                <VStack key={section.id} align="stretch" gap="3">
                  <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                    {section.title}
                  </Text>
                  {!selectedItem ? (
                    <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="3.5" py="3">
                      <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">
                        {section.emptyState.title}
                      </Text>
                      <Text fontSize="sm" color="var(--text-secondary)">
                        {section.emptyState.description}
                      </Text>
                    </Box>
                  ) : (
                    <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="3.5" py="3.5">
                      <VStack align="stretch" gap="2.5">
                        <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                          {selectedItem.title}
                        </Text>
                        {selectedItem.description ? (
                          <Text fontSize="sm" color="var(--text-secondary)">
                            {selectedItem.description}
                          </Text>
                        ) : null}
                        {section.fields.map((field) => (
                          <HStack key={`${selectedItem.id}-${field.fieldKey}`} justify="space-between" align="start" gap="3">
                            <Text fontSize="xs" fontWeight="500" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
                              {field.label}
                            </Text>
                            {renderValue(fieldValueFromItem(selectedItem, field), field.presentation)}
                          </HStack>
                        ))}
                        {section.actionIds.length > 0 ? (
                          <>
                            <Separator borderColor="var(--border-subtle)" />
                            <HStack gap="2" wrap="wrap">
                              {section.actionIds.map((actionId) => {
                                const action = actionMap.get(actionId);
                                if (!action) {
                                  return null;
                                }
                                const tone = actionButtonTone(action);
                                return (
                                  <Button
                                    key={action.id}
                                    size="xs"
                                    variant={tone.variant}
                                    colorPalette={tone.colorPalette}
                                    loading={actionLoadingId === action.id}
                                    onClick={() => {
                                      void runAction(action.id, {
                                        datasetId: dataset.id,
                                        selectedItemIds: [selectedItem.id]
                                      });
                                    }}
                                  >
                                    {action.label}
                                  </Button>
                                );
                              })}
                            </HStack>
                          </>
                        ) : null}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              );
            }

            if (section.kind === 'markdown') {
              return (
                <VStack key={section.id} align="stretch" gap="2">
                  <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                    {section.title}
                  </Text>
                  <RecipeMarkdownBlock content={section.content} />
                </VStack>
              );
            }

            if (section.kind === 'notice') {
              return (
                <Box key={section.id} rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="3.5" py="3">
                  <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                    {section.title}
                  </Text>
                  <Text fontSize="sm" color="var(--text-secondary)">
                    {section.description}
                  </Text>
                </Box>
              );
            }

            if (section.kind === 'form') {
              return (
                <VStack key={section.id} align="stretch" gap="3">
                  <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                    {section.title}
                  </Text>
                  {section.description ? (
                    <Text fontSize="sm" color="var(--text-secondary)">
                      {section.description}
                    </Text>
                  ) : null}
                  {section.fields.map((field) => (
                    <VStack key={field.key} align="stretch" gap="1">
                      <Text fontSize="xs" fontWeight="500" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
                        {field.label}
                      </Text>
                      {field.input === 'textarea' ? (
                        <Textarea
                          size="sm"
                          value={String(formValues[field.key] ?? '')}
                          onChange={(event) => setFormValues((current) => ({ ...current, [field.key]: event.target.value }))}
                          placeholder={field.placeholder}
                        />
                      ) : field.input === 'select' ? (
                        <chakra.select
                          value={String(formValues[field.key] ?? '')}
                          onChange={(event) => setFormValues((current) => ({ ...current, [field.key]: event.target.value }))}
                          style={{
                            width: '100%',
                            minHeight: '36px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--surface-2)',
                            paddingInline: '0.75rem'
                          }}
                        >
                          <option value="">Select…</option>
                          {field.options.map((option) => (
                            <option key={`${field.key}-${option.value}`} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </chakra.select>
                      ) : (
                        <Input
                          size="sm"
                          type={field.input === 'number' ? 'number' : 'text'}
                          value={String(formValues[field.key] ?? '')}
                          onChange={(event) => setFormValues((current) => ({ ...current, [field.key]: event.target.value }))}
                          placeholder={field.placeholder}
                        />
                      )}
                    </VStack>
                  ))}
                  <HStack gap="2">
                    <Button size="xs" colorPalette="blue" onClick={() => void runAction(section.submitActionId)}>
                      {actionMap.get(section.submitActionId)?.label ?? 'Submit'}
                    </Button>
                    {section.cancelActionId ? (
                      <Button size="xs" variant="outline" onClick={() => void runAction(section.cancelActionId!)}>
                        {actionMap.get(section.cancelActionId)?.label ?? 'Cancel'}
                      </Button>
                    ) : null}
                  </HStack>
                </VStack>
              );
            }

            if (section.kind === 'wizard') {
              return (
                <VStack key={section.id} align="stretch" gap="3">
                  <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                    {section.title}
                  </Text>
                  {section.steps.map((step) => (
                    <Box key={step.id} rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="3.5" py="3.5">
                      <VStack align="stretch" gap="2">
                        <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                          {step.title}
                        </Text>
                        {step.description ? (
                          <Text fontSize="sm" color="var(--text-secondary)">
                            {step.description}
                          </Text>
                        ) : null}
                        {step.body ? <RecipeMarkdownBlock content={step.body} /> : null}
                        {step.actionIds.length > 0 ? (
                          <HStack gap="2" wrap="wrap">
                            {step.actionIds.map((actionId) => {
                              const action = actionMap.get(actionId);
                              if (!action) {
                                return null;
                              }
                              const tone = actionButtonTone(action);
                              return (
                                <Button
                                  key={action.id}
                                  size="xs"
                                  variant={tone.variant}
                                  colorPalette={tone.colorPalette}
                                  loading={actionLoadingId === action.id}
                                  onClick={() => void runAction(action.id)}
                                >
                                  {action.label}
                                </Button>
                              );
                            })}
                          </HStack>
                        ) : null}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              );
            }

            return null;
              })}
            </VStack>
          </Box>
    </VStack>
  );
}
