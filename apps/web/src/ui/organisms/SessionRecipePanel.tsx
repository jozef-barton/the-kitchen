import {
  Box,
  Button,
  Checkbox,
  Grid,
  HStack,
  Separator,
  Spinner,
  Table,
  Text,
  VStack,
  chakra
} from '@chakra-ui/react';
import type {
  Recipe,
  RecipeContentEntry,
  RecipeCellValue,
  RecipeLink,
  UpdateRecipeRequest
} from '@hermes-recipes/protocol';
import { getRecipeContentTab, getRecipeContentViewData } from '@hermes-recipes/protocol';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { safeMarkdownUrlTransform } from '../../lib/markdown-url-transform';
import { useMemo, useState } from 'react';
import { DynamicRecipeView } from './DynamicRecipeView';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SessionActionMenu } from '../molecules/SessionActionMenu';
import { toaster } from '../toaster-store';

type RecipePipeline = NonNullable<Recipe['metadata']['recipePipeline']>;
type RecipePipelineStatus = RecipePipeline['task']['status'];
type RecipeFailureCategory = RecipePipeline['task']['failureCategory'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function getCellImage(value: RecipeCellValue | unknown) {
  if (!isRecord(value) || typeof value.imageUrl !== 'string' || value.imageUrl.trim().length === 0) {
    return null;
  }

  return {
    url: value.imageUrl.trim(),
    alt: typeof value.imageAlt === 'string' && value.imageAlt.trim().length > 0 ? value.imageAlt.trim() : undefined
  };
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
    case 'dsl_generation_live_task_violation':
      return 'Recipe enrichment live-task violation';
    case 'dsl_context_invalid':
      return 'Recipe enrichment context invalid';
    case 'dsl_repair_failed':
      return 'Recipe DSL repair failed';
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
    case 'dsl_generation_failure':
      return 'Recipe DSL generation failure';
    case 'dsl_validation_failure':
      return 'Recipe DSL validation failure';
    case 'dsl_normalization_failure':
      return 'Recipe DSL normalization failure';
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
    case 'task_failure':
      return 'Task failure';
    default:
      return category
        .replace(/_/gu, ' ')
        .replace(/\b\w/gu, (character) => character.toUpperCase());
  }
}

function resolveRetryBuildLabel(label: string | null | undefined, templateBuild: boolean) {
  const normalizedLabel = label?.trim() ?? '';
  if (templateBuild) {
    if (!normalizedLabel || /^retry build$/iu.test(normalizedLabel) || /^retry workspace generation$/iu.test(normalizedLabel)) {
      return 'Rebuild recipe';
    }

    return normalizedLabel;
  }

  return normalizedLabel || 'Retry recipe enrichment';
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

function resolvePipelineSegment(recipe: Recipe) {
  const pipeline = recipe.metadata.recipePipeline;

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

function resolveHomeRecipeBannerTitle(recipe: Recipe) {
  const pipeline = recipe.metadata.recipePipeline;
  const templateBuild =
    recipe.dynamic?.activeBuild?.buildKind === 'template_enrichment' ||
    Boolean(recipe.dynamic?.recipeTemplate) ||
    recipe.metadata.activeTemplateId !== undefined;

  if (!pipeline) {
    return 'Home recipe ready';
  }

  switch (pipeline.currentStage) {
    case 'task_running':
      return 'Running task';
    case 'task_failed':
      return 'Task failed before Home update';
    case 'task_ready':
      return 'Task finished';
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
      return 'Home recipe ready';
  }
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

function linkLabel(link: RecipeLink) {
  if (link.kind === 'booking') {
    return 'Book';
  }
  if (link.kind === 'menu') {
    return 'Menu';
  }
  if (link.kind === 'map') {
    return 'Map';
  }
  if (link.kind === 'email') {
    return 'Email';
  }
  if (link.kind === 'place') {
    return 'Listing';
  }
  if (link.kind === 'website') {
    return 'Website';
  }

  return link.label;
}

function canDeleteSource(entry: RecipeContentEntry) {
  return entry.source?.integration === 'google-workspace' && entry.source.kind === 'gmail_message';
}

function getEntrySectionHeading(entry: RecipeContentEntry) {
  if (!isRecord(entry.metadata) || typeof entry.metadata.sectionHeading !== 'string') {
    return undefined;
  }

  const value = entry.metadata.sectionHeading.trim();
  return value.length > 0 ? value : undefined;
}

function compareCellValues(left: RecipeCellValue | undefined, right: RecipeCellValue | undefined) {
  const leftValue = left ?? '';
  const rightValue = right ?? '';

  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    return leftValue - rightValue;
  }

  return plainTextForSort(leftValue).localeCompare(plainTextForSort(rightValue), undefined, {
    numeric: true,
    sensitivity: 'base'
  });
}

function plainTextForSort(value: RecipeCellValue | undefined) {
  return getCellText(value ?? '').toLowerCase();
}

const markdownRendererCss = {
  '& h1, & h2, & h3': {
    fontWeight: 600,
    lineHeight: 1.15,
    letterSpacing: 0,
    marginTop: '0.85rem',
    marginBottom: '0.45rem'
  },
  '& h1': {
    fontSize: '1.4rem'
  },
  '& h2': {
    fontSize: '1.16rem'
  },
  '& h3': {
    fontSize: '1.01rem'
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
  '& ul > li, & ol > li': {
    padding: '0.2rem 0'
  },
  '& ul ul, & ol ul, & ul ol, & ol ol': {
    display: 'block',
    marginTop: '0.45rem',
    paddingInlineStart: '0.95rem'
  },
  '& ul ul > li, & ol ul > li, & ul ol > li, & ol ol > li': {
    padding: '0',
    border: 'none',
    background: 'transparent'
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
  },
  '& pre': {
    overflowX: 'auto',
    padding: '0.9rem',
    borderRadius: '14px',
    background: 'var(--surface-2)'
  },
  '& blockquote': {
    marginTop: '0.8rem',
    paddingInlineStart: '0.85rem',
    borderLeft: '3px solid var(--border-subtle)',
    color: 'var(--text-secondary)'
  },
  '& hr': {
    marginBlock: '0.9rem',
    borderColor: 'var(--border-subtle)'
  },
  '& a': {
    color: 'var(--text-primary)',
    fontWeight: 700
  }
} as const;

function ExternalActionButton({
  link,
  children,
  variant = 'outline'
}: {
  link: RecipeLink;
  children?: string;
  variant?: 'outline' | 'subtle' | 'ghost';
}) {
  const target = link.url.startsWith('mailto:') ? undefined : '_blank';
  const rel = link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer';

  return (
    <Button asChild size="xs" variant={variant} colorPalette={link.kind === 'email' ? 'teal' : 'blue'}>
      <a href={link.url} target={target} rel={rel}>
        {children ?? linkLabel(link)}
      </a>
    </Button>
  );
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

function TableCellView({
  value,
  presentation
}: {
  value: RecipeCellValue;
  presentation: 'text' | 'link' | 'email' | 'image';
}) {
  const text = getCellText(value);
  const link = getCellLink(value);
  const image = getCellImage(value);

  if ((presentation === 'image' || image) && (link || image)) {
    const href = link?.url ?? image?.url;
    if (!href) {
      return (
        <Text fontSize="sm" color="var(--text-secondary)">
          {text || 'Preview unavailable'}
        </Text>
      );
    }

    return (
      <Button asChild size="xs" variant="ghost" colorPalette="blue">
        <a href={href} target="_blank" rel="noopener noreferrer">
          {text || image?.alt || 'View image'}
        </a>
      </Button>
    );
  }

  if ((presentation === 'link' || presentation === 'email' || link) && link) {
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
    <Text fontSize="sm" color={text ? 'var(--text-primary)' : 'var(--text-secondary)'} lineClamp={3}>
      {text || '—'}
    </Text>
  );
}

function EntryActionButtons({
  entry,
  deleting,
  onRemove,
  onDeleteSource
}: {
  entry: RecipeContentEntry;
  deleting?: boolean;
  onRemove: () => void;
  onDeleteSource: () => void;
}) {
  return (
    <HStack gap="1.5" wrap="wrap" justify="end">
      {canDeleteSource(entry) ? (
        <Button size="xs" variant="outline" colorPalette="red" onClick={onDeleteSource} loading={deleting}>
          Delete email
        </Button>
      ) : null}
      <Button size="xs" variant="subtle" colorPalette="gray" onClick={onRemove} loading={deleting}>
        Remove
      </Button>
    </HStack>
  );
}

function MarkdownEntryView({
  entry,
  onRemove,
  onDeleteSource,
  deleting
}: {
  entry: RecipeContentEntry;
  onRemove: () => void;
  onDeleteSource: () => void;
  deleting?: boolean;
}) {
  return (
    <VStack
      align="stretch"
      gap="3"
      rounded="8px"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-2)"
      px="3.5"
      py="3.5"
      data-testid="recipe-markdown-entry"
    >
      <HStack justify="space-between" align="start" gap="3">
        <Text fontSize="xs" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
          Entry
        </Text>
        <EntryActionButtons entry={entry} onRemove={onRemove} onDeleteSource={onDeleteSource} deleting={deleting} />
      </HStack>

      <Box
        color="var(--text-primary)"
        css={markdownRendererCss}
      >
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
            },
            img(props) {
              const href = props.src ?? '#';
              return (
                <Button asChild size="xs" variant="outline" colorPalette="blue" mt="2">
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {props.alt?.trim() || 'View image'}
                  </a>
                </Button>
              );
            }
          }}
        >
          {entry.md || '_This entry is empty._'}
        </ReactMarkdown>
      </Box>
    </VStack>
  );
}

function CardMetadataRow({ label, value, link }: { label: string; value: string; link?: RecipeLink }) {
  return (
    <HStack align="start" justify="space-between" gap="3">
      <Text fontSize="xs" fontWeight="500" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
        {label}
      </Text>
      {link ? (
        <chakra.a
          href={link.url}
          target={link.url.startsWith('mailto:') ? undefined : '_blank'}
          rel={link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
          fontSize="sm"
          fontWeight="600"
          color="blue.600"
          textDecoration="underline"
          textUnderlineOffset="3px"
          _dark={{ color: 'blue.200' }}
        >
          {value}
        </chakra.a>
      ) : (
        <Text fontSize="sm" color="var(--text-primary)" textAlign="right">
          {value}
        </Text>
      )}
    </HStack>
  );
}

function CardView({
  entry,
  onRemove,
  onDeleteSource,
  deleting
}: {
  entry: RecipeContentEntry;
  onRemove: () => void;
  onDeleteSource: () => void;
  deleting?: boolean;
}) {
  const card = entry.card;
  return (
    <VStack
      align="stretch"
      gap="4"
      rounded="8px"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-2)"
      px="4"
      py="4"
      boxShadow="sm"
      data-testid="recipe-card-renderer"
    >
      <HStack justify="space-between" align="start" gap="3">
        <Text fontSize="xs" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
          Card
        </Text>
        <EntryActionButtons entry={entry} onRemove={onRemove} onDeleteSource={onDeleteSource} deleting={deleting} />
      </HStack>

      {card.image ? (
        <chakra.img
          src={card.image.url}
          alt={card.image.alt ?? card.title}
          w="100%"
          h="132px"
          objectFit="cover"
          rounded="8px"
          border="1px solid var(--border-subtle)"
          bg="white"
        />
      ) : null}

      <VStack align="stretch" gap="2">
        <HStack justify="space-between" align="start" gap="3">
          <VStack align="start" gap="1" minW={0}>
            {card.eyebrow ? (
              <Text fontSize="10px" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
                {card.eyebrow}
              </Text>
            ) : null}
            <Text fontSize="lg" fontWeight="600" color="var(--text-primary)" lineHeight="1.2" lineClamp={2}>
              {card.title}
            </Text>
          </VStack>
          {card.badges.length > 0 ? (
            <HStack gap="1.5" wrap="wrap" justify="end">
              {card.badges.map((badge) => (
                <BadgeChip key={`${card.id}-${badge}`} label={badge} />
              ))}
            </HStack>
          ) : null}
        </HStack>

        {card.description ? (
          <Text fontSize="sm" color="var(--text-secondary)" lineHeight="1.7">
            {card.description}
          </Text>
        ) : null}
      </VStack>

      {card.metadata.length > 0 ? (
        <>
          <Separator borderColor="var(--border-subtle)" />
          <VStack align="stretch" gap="2.5">
            {card.metadata.map((item) => (
              <CardMetadataRow key={`${card.id}-${item.label}-${item.value}`} label={item.label} value={item.value} link={item.link} />
            ))}
          </VStack>
        </>
      ) : null}

      {card.links.length > 0 ? (
        <HStack gap="2" wrap="wrap">
          {card.links.map((link) => (
            <ExternalActionButton key={`${card.id}-${link.kind}-${link.url}`} link={link}>
              {linkLabel(link)}
            </ExternalActionButton>
          ))}
        </HStack>
      ) : null}
    </VStack>
  );
}

function splitMarkdownIntoSections(markdown: string): Array<{ title: string; body: string }> {
  const lines = markdown.split('\n');
  const sections: Array<{ title: string; body: string }> = [];
  let currentTitle = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/u) ?? line.match(/^(\d+)\.\s+(.+)$/u);
    if (headingMatch) {
      if (currentTitle || currentLines.length > 0) {
        sections.push({ title: currentTitle, body: currentLines.join('\n').trim() });
      }
      currentTitle = headingMatch[2].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentTitle || currentLines.length > 0) {
    sections.push({ title: currentTitle, body: currentLines.join('\n').trim() });
  }

  if (sections.length <= 1 && markdown.trim().length > 0) {
    return [{ title: '', body: markdown.trim() }];
  }

  return sections.filter((section) => section.body.length > 0 || section.title.length > 0);
}

function MarkdownPanesRenderer({ markdown }: { markdown: string }) {
  const sections = useMemo(() => splitMarkdownIntoSections(markdown), [markdown]);

  return (
    <VStack align="stretch" gap="3" data-testid="recipe-markdown-renderer">
      {sections.map((section, index) => (
        <Box
          key={`section-${index}`}
          rounded="8px"
          border="1px solid var(--border-subtle)"
          bg="var(--surface-1)"
          px="5"
          py="4"
          overflow="hidden"
        >
          {section.title ? (
            <Text fontWeight="600" color="var(--text-primary)" mb="2">
              {section.title}
            </Text>
          ) : null}
          <Box
            color="var(--text-secondary)"
            overflow="hidden"
            css={{
              '& p': { fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '0.5rem' },
              '& p:last-child': { marginBottom: 0 },
              '& ul, & ol': { display: 'block', marginTop: '0.5rem', marginBottom: '0.5rem' },
              '& ul': { listStyleType: 'disc', paddingInlineStart: '1.4rem' },
              '& ol': { listStyleType: 'decimal', paddingInlineStart: '1.5rem' },
              '& li': { display: 'list-item', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.25rem' },
              '& li::marker': { color: 'var(--text-muted)' },
              '& code': { fontSize: '0.85rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--surface-2)' },
              '& pre': { overflowX: 'auto', padding: '0.75rem', borderRadius: '6px', background: 'var(--surface-2)', marginBottom: '0.5rem' },
              '& strong': { color: 'var(--text-primary)', fontWeight: 600 },
              '& a': { color: 'var(--accent)', textDecoration: 'underline' },
              '& h1, & h2, & h3': { fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.75rem', marginBottom: '0.35rem' },
              '& h1': { fontSize: '1.2rem' },
              '& h2': { fontSize: '1.05rem' },
              '& h3': { fontSize: '0.95rem' },
              '& table': { width: '100%', maxWidth: '100%', marginTop: '0.5rem', borderCollapse: 'separate', borderSpacing: 0, border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', tableLayout: 'fixed' },
              '& th, & td': { padding: '0.5rem 0.7rem', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', wordWrap: 'break-word', overflowWrap: 'break-word' },
              '& th': { background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0 },
              '& blockquote': { paddingInlineStart: '0.75rem', borderLeft: '3px solid var(--border-subtle)', color: 'var(--text-muted)', marginTop: '0.5rem' }
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.body}</ReactMarkdown>
          </Box>
        </Box>
      ))}
    </VStack>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ContentTabRenderer({
  contentTab,
  entries,
  onRemoveEntries,
  onDeleteSourceEntries
}: {
  contentTab: ReturnType<typeof getRecipeContentTab>;
  entries: RecipeContentEntry[];
  onRemoveEntries: (entryIds: string[]) => Promise<void> | void;
  onDeleteSourceEntries: (entryIds: string[]) => Promise<void> | void;
}) {
  const [sortColumnId, setSortColumnId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mutatingEntryIds, setMutatingEntryIds] = useState<string[]>([]);
  const entryMap = useMemo(() => new Map(entries.map((entry) => [entry.id, entry] as const)), [entries]);
  const effectiveSelectedIds = selectedIds.filter((id) => entryMap.has(id));
  const selectedIdSet = useMemo(() => new Set(effectiveSelectedIds), [effectiveSelectedIds]);

  async function runEntryMutation(entryIds: string[], action: 'remove' | 'delete_source') {
    const uniqueIds = [...new Set(entryIds.filter((value) => value.trim().length > 0))];
    if (uniqueIds.length === 0) {
      return;
    }

    setMutatingEntryIds((current) => [...new Set([...current, ...uniqueIds])]);

    try {
      if (action === 'delete_source') {
        await onDeleteSourceEntries(uniqueIds);
      } else {
        await onRemoveEntries(uniqueIds);
      }
      setSelectedIds((current) => current.filter((id) => !uniqueIds.includes(id)));
    } catch (error) {
      const fallbackMessage =
        action === 'delete_source'
          ? 'Could not delete the selected emails. Check the logs for more information.'
          : 'Could not remove the selected entries from this recipe.';
      const description = error instanceof Error && error.message.trim().length > 0 ? error.message : fallbackMessage;
      toaster.error({
        title: action === 'delete_source' ? 'Delete failed' : 'Remove failed',
        description,
        closable: true
      });
    } finally {
      setMutatingEntryIds((current) => current.filter((id) => !uniqueIds.includes(id)));
    }
  }

  if (contentTab.content.activeView === 'table') {
    const data = getRecipeContentViewData(contentTab, 'table');
    const rowsWithEntries = entries.map((entry, index) => ({
      entry,
      row: data.rows[index] ?? entry.row
    }));
    const sortedRows = [...rowsWithEntries].sort((left, right) => {
      if (!sortColumnId) {
        return 0;
      }

      const comparison = compareCellValues(left.row[sortColumnId], right.row[sortColumnId]);
      return sortDirection === 'asc' ? comparison : comparison * -1;
    });
    const allSelected = sortedRows.length > 0 && sortedRows.every((item) => selectedIdSet.has(item.entry.id));
    const selectedDeletableIds = effectiveSelectedIds.filter((id) => {
      const entry = entryMap.get(id);
      return entry ? canDeleteSource(entry) : false;
    });

    if (data.rows.length === 0) {
      return <Text color="var(--text-secondary)">{data.emptyMessage ?? 'No rows yet.'}</Text>;
    }

    return (
      <VStack align="stretch" gap="3">
        <HStack justify="space-between" align="center" gap="3" wrap="wrap">
          <Text fontSize="xs" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
            {effectiveSelectedIds.length > 0 ? `${effectiveSelectedIds.length} selected` : `${rowsWithEntries.length} rows`}
          </Text>
          <HStack gap="2" wrap="wrap" justify="end">
            {selectedDeletableIds.length > 0 ? (
              <Button
                size="xs"
                variant="outline"
                colorPalette="red"
                onClick={() => void runEntryMutation(selectedDeletableIds, 'delete_source')}
                loading={selectedDeletableIds.some((id) => mutatingEntryIds.includes(id))}
              >
                Delete selected emails
              </Button>
            ) : null}
            {effectiveSelectedIds.length > 0 ? (
              <Button
                size="xs"
                variant="subtle"
                colorPalette="gray"
                onClick={() => void runEntryMutation(effectiveSelectedIds, 'remove')}
                loading={effectiveSelectedIds.some((id) => mutatingEntryIds.includes(id))}
              >
                Remove selected
              </Button>
            ) : null}
          </HStack>
        </HStack>

        <Table.ScrollArea
          data-testid="recipe-table-renderer"
          borderWidth="1px"
          borderColor="var(--border-subtle)"
          rounded="8px"
          overflow="auto"
          maxH="100%"
        >
          <Table.Root size="sm" variant="line" striped>
            <Table.Header bg="var(--surface-2)">
              <Table.Row>
                <Table.ColumnHeader bg="var(--surface-2)" whiteSpace="nowrap">
                  <Checkbox.Root
                    checked={allSelected}
                    onCheckedChange={(event) => {
                      const checked = !!event.checked;
                      setSelectedIds((current) => {
                        const currentSet = new Set(current);
                        for (const item of sortedRows) {
                          if (checked) {
                            currentSet.add(item.entry.id);
                          } else {
                            currentSet.delete(item.entry.id);
                          }
                        }
                        return [...currentSet];
                      });
                    }}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
                {data.columns.map((column) => (
                  <Table.ColumnHeader
                    key={column.id}
                    fontSize="11px"
                    fontWeight="600"
                    letterSpacing="0"
                    textTransform="uppercase"
                    color="var(--text-muted)"
                    bg="var(--surface-2)"
                    whiteSpace="nowrap"
                  >
                    <Button
                      size="xs"
                      variant="ghost"
                      px="0"
                      h="auto"
                      color="inherit"
                      fontSize="inherit"
                      fontWeight="inherit"
                      textTransform="inherit"
                      letterSpacing="0"
                      onClick={() => {
                        if (sortColumnId === column.id) {
                          setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
                          return;
                        }

                        setSortColumnId(column.id);
                        setSortDirection('asc');
                      }}
                    >
                      {column.label ?? column.id}
                      {sortColumnId === column.id ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                    </Button>
                  </Table.ColumnHeader>
                ))}
                <Table.ColumnHeader
                  fontSize="11px"
                  fontWeight="600"
                  letterSpacing="0"
                  textTransform="uppercase"
                  color="var(--text-muted)"
                  bg="var(--surface-2)"
                  whiteSpace="nowrap"
                >
                  Actions
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sortedRows.map(({ entry, row }) => (
                <Table.Row key={entry.id} _hover={{ bg: 'blackAlpha.50', _dark: { bg: 'whiteAlpha.50' } }}>
                  <Table.Cell verticalAlign="top" py="2.5">
                    <Checkbox.Root
                      checked={selectedIdSet.has(entry.id)}
                      onCheckedChange={(event) => {
                        const checked = !!event.checked;
                        setSelectedIds((current) =>
                          checked ? [...new Set([...current, entry.id])] : current.filter((id) => id !== entry.id)
                        );
                      }}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                    </Checkbox.Root>
                  </Table.Cell>
                  {data.columns.map((column) => (
                    <Table.Cell key={column.id} verticalAlign="top" py="2.5">
                      <TableCellView value={row[column.id] ?? ''} presentation={column.presentation} />
                    </Table.Cell>
                  ))}
                  <Table.Cell verticalAlign="top" py="2.5">
                    <EntryActionButtons
                      entry={entry}
                      deleting={mutatingEntryIds.includes(entry.id)}
                      onRemove={() => void runEntryMutation([entry.id], 'remove')}
                      onDeleteSource={() => void runEntryMutation([entry.id], 'delete_source')}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      </VStack>
    );
  }

  if (contentTab.content.activeView === 'card') {
    const data = getRecipeContentViewData(contentTab, 'card');

    if (data.cards.length === 0) {
      return <Text color="var(--text-secondary)">{data.emptyMessage ?? 'No cards yet.'}</Text>;
    }

    return (
      <Grid templateColumns={{ base: '1fr', '2xl': 'repeat(2, minmax(0, 1fr))' }} gap="4">
        {entries.map((entry) => (
          <CardView
            key={entry.id}
            entry={entry}
            deleting={mutatingEntryIds.includes(entry.id)}
            onRemove={() => void runEntryMutation([entry.id], 'remove')}
            onDeleteSource={() => void runEntryMutation([entry.id], 'delete_source')}
          />
        ))}
      </Grid>
    );
  }

  const data = getRecipeContentViewData(contentTab, 'markdown');
  return (
    <VStack align="stretch" gap="3" data-testid="recipe-markdown-renderer">
      {entries.length > 0 ? (
        entries.map((entry, index) => {
          const sectionHeading = getEntrySectionHeading(entry);
          const previousSectionHeading = index > 0 ? getEntrySectionHeading(entries[index - 1]!) : undefined;
          const showSectionHeading = Boolean(sectionHeading && sectionHeading !== previousSectionHeading);

          return (
            <VStack key={entry.id} align="stretch" gap="2.5">
              {showSectionHeading ? (
                <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                  {sectionHeading}
                </Text>
              ) : null}
              <MarkdownEntryView
                entry={entry}
                deleting={mutatingEntryIds.includes(entry.id)}
                onRemove={() => void runEntryMutation([entry.id], 'remove')}
                onDeleteSource={() => void runEntryMutation([entry.id], 'delete_source')}
              />
            </VStack>
          );
        })
      ) : (
        <Box color="var(--text-primary)" css={markdownRendererCss}>
          <ReactMarkdown
            skipHtml
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
              },
              img(props) {
                const href = props.src ?? '#';
                return (
                  <Button asChild size="xs" variant="outline" colorPalette="blue" mt="2">
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {props.alt?.trim() || 'View image'}
                    </a>
                  </Button>
                );
              }
            }}
          >
            {data.markdown || '_This content tab is empty._'}
          </ReactMarkdown>
        </Box>
      )}
    </VStack>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function HomeRecipeStatusBanner({
  recipe,
  onRefresh,
  onRetryApplet
}: {
  recipe: Recipe;
  onRefresh: (recipe: Recipe) => Promise<void> | void;
  onRetryApplet?: ((recipe: Recipe) => Promise<void> | void) | null;
}) {
  const pipeline = recipe.metadata.recipePipeline;
  const enrichmentBuild = recipe.dynamic?.activeBuild ?? null;
  const currentSegment = resolvePipelineSegment(recipe);
  const failed =
    pipeline?.currentStage === 'enrichment_failed' ||
    pipeline?.currentStage === 'applet_failed' ||
    pipeline?.currentStage === 'baseline_failed' ||
    pipeline?.currentStage === 'task_failed';
  const running = pipeline?.task.status === 'running' || pipeline?.baseline.status === 'running' || pipeline?.applet.status === 'running';
  const templateBuild =
    enrichmentBuild?.buildKind === 'template_enrichment' ||
    Boolean(recipe.dynamic?.recipeTemplate) ||
    recipe.metadata.activeTemplateId !== undefined;
  const detail =
    currentSegment?.message ??
    enrichmentBuild?.userFacingMessage ??
    enrichmentBuild?.progressMessage ??
    enrichmentBuild?.errorMessage ??
    (templateBuild
      ? 'The Home recipe is available while optional recipe generation runs in the background.'
      : 'The Home recipe is available while optional recipe enrichment runs in the background.');
  const failureCategory = humanizeRecipeFailureCategory(currentSegment?.failureCategory ?? enrichmentBuild?.failureCategory ?? null);
  const timeoutLabel =
    currentSegment?.configuredTimeoutMs ?? enrichmentBuild?.configuredTimeoutMs
      ? `${(currentSegment?.configuredTimeoutMs ?? enrichmentBuild?.configuredTimeoutMs ?? 0).toLocaleString()}ms limit`
      : null;
  const buildPhaseLabel = formatBuildPhase(enrichmentBuild?.phase ?? null);
  const showRetryGuidance = pipeline?.currentStage === 'enrichment_failed' || pipeline?.currentStage === 'applet_failed';
  const canRetryApplet = showRetryGuidance && Boolean(onRetryApplet);
  const retryBuildActionLabel = recipe.dynamic?.actionSpec?.actions.find((action) => action.id === 'retry-build')?.label;

  return (
    <Box
      rounded="8px"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-1)"
      px="4"
      py="3.5"
      mb="3"
      data-testid="home-recipe-pipeline-banner"
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
        ) : running ? (
          <Spinner size="sm" color="blue.500" mt="1" />
        ) : null}
        <VStack align="start" gap="1.5">
          <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
            {resolveHomeRecipeBannerTitle(recipe)}
          </Text>
          <Text fontSize="sm" color="var(--text-secondary)">
            {detail}
          </Text>
          {failureCategory || timeoutLabel ? (
            <HStack gap="2" wrap="wrap">
              {failureCategory ? (
                <Box rounded="full" border="1px solid" borderColor="var(--border-subtle)" px="2.5" py="1">
                  <Text fontSize="10px" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
                    Cause: {failureCategory}
                  </Text>
                </Box>
              ) : null}
              {timeoutLabel ? (
                <Box rounded="full" border="1px solid" borderColor="var(--border-subtle)" px="2.5" py="1">
                  <Text fontSize="10px" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
                    {timeoutLabel}
                  </Text>
                </Box>
              ) : null}
            </HStack>
          ) : null}
          {buildPhaseLabel ? (
            <Box rounded="full" border="1px solid" borderColor="var(--border-subtle)" px="2.5" py="1">
              <Text fontSize="10px" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0">
                Stage: {buildPhaseLabel}
              </Text>
            </Box>
          ) : null}
          {pipeline ? (
            <HStack gap="2" wrap="wrap" data-testid="home-recipe-pipeline-statuses">
              <PipelineStatusPill label="Task" status={pipeline.task.status} />
              <PipelineStatusPill label="Home" status={pipeline.baseline.status} />
              <PipelineStatusPill label={templateBuild ? 'Generation' : 'Enrichment'} status={pipeline.applet.status} />
            </HStack>
          ) : null}
          <HStack gap="2" wrap="wrap">
            <Button
              data-testid="recipe-refresh-button"
              size="xs"
              variant="outline"
              colorPalette="blue"
              onClick={() => void (canRetryApplet ? onRetryApplet?.(recipe) : onRefresh(recipe))}
            >
              {canRetryApplet ? resolveRetryBuildLabel(retryBuildActionLabel, templateBuild) : 'Refresh'}
            </Button>
          </HStack>
          {canRetryApplet ? (
            <Text fontSize="xs" color="var(--text-muted)">
              {resolveRetryBuildGuidance(templateBuild)}
            </Text>
          ) : pipeline?.applet.status === 'running' ? (
            <Text fontSize="xs" color="var(--text-muted)">
              The baseline Home recipe remains usable while recipe enrichment runs.
            </Text>
          ) : null}
        </VStack>
      </HStack>
    </Box>
  );
}

export function SessionRecipePanel({
  recipe,
  onRename: _onRename,
  onDelete: _onDelete,
  onRefresh: _onRefresh,
  onExecuteAction,
  onUpdateRecipe: _onUpdateRecipe,
  onApplyRecipeEntryAction: _onApplyRecipeEntryAction
}: {
  recipe: Recipe;
  onRename: () => void;
  onDelete: () => void;
  onRefresh: (recipe: Recipe) => Promise<void> | void;
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
  onUpdateRecipe: (
    recipeId: string,
    partial: Omit<UpdateRecipeRequest, 'profileId'>,
    options?: {
      toastTitle?: string;
      toastDescription?: string;
      quiet?: boolean;
    }
  ) => Promise<Recipe> | void;
  onApplyRecipeEntryAction: (
    recipeId: string,
    action: 'remove' | 'delete_source',
    entryIds: string[],
    options?: {
      quiet?: boolean;
      toastTitle?: string;
      toastDescription?: string;
    }
  ) => Promise<void> | void;
}) {
  const contentTab = getRecipeContentTab(recipe);

  return (
    <VStack align="stretch" gap="3" h="100%" minH={0} minW={0} maxW="100%" data-testid="attached-recipe-panel">
      <Box
        flex="1"
        minH={0}
        rounded="8px"
        border="1px solid var(--border-subtle)"
        bg="var(--surface-elevated)"
        boxShadow="var(--shadow-sm)"
        px="4"
        py="4"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {recipe.renderMode === 'dynamic_v1' ? (
          <Box
            flex="1"
            minH={0}
            data-testid="session-recipe-content-scroll"
            css={{
              scrollbarGutter: 'stable'
            }}
          >
            <DynamicRecipeView
              recipe={recipe}
              onExecuteAction={onExecuteAction}
            />
          </Box>
        ) : (
          <>
            <Box
              flex="1"
              minH={0}
              overflow="auto"
              pr="1"
              data-testid="session-recipe-content-scroll"
              css={{
                scrollbarGutter: 'stable'
              }}
            >
              <MarkdownPanesRenderer
                markdown={getRecipeContentViewData(contentTab, 'markdown').markdown}
              />
            </Box>
          </>
        )}
      </Box>
    </VStack>
  );
}
