import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Badge, Box, Button, Checkbox, Flex, HStack, Image, Input, Separator, SimpleGrid, Table, Text, VStack, chakra } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type {
  RecipeTemplatePreviewSection,
  TemplateAction,
  TemplateBoardColumn,
  TemplateCardItem,
  TemplateChip,
  TemplateStat
} from './types';
import { templateToneStyles } from './template-style-helpers';
import { toaster } from '../../ui/toaster-store';
import { safeMarkdownUrlTransform } from '../../lib/markdown-url-transform';

export function TemplateSurface({
  children,
  padding = '0'
}: {
  children: ReactNode;
  bg?: string; // kept for API compat, ignored
  padding?: string;
}) {
  return (
    <Box px={padding} py={padding}>
      {children}
    </Box>
  );
}

export function TemplateSectionHeader({
  title,
  eyebrow,
  summary,
  rightSlot
}: {
  title: string;
  eyebrow?: string;
  summary?: string;
  rightSlot?: ReactNode;
}) {
  return (
    <Flex justify="space-between" align="start" gap="4">
      <VStack align="start" gap="1" minW={0}>
        {eyebrow ? (
          <Text fontSize="11px" fontWeight="600" letterSpacing="0" textTransform="uppercase" color="var(--text-muted)">
            {eyebrow}
          </Text>
        ) : null}
        <Text fontSize="lg" fontWeight="600" color="var(--text-primary)" lineHeight="1.1">
          {title}
        </Text>
        {summary ? (
          <Text fontSize="sm" color="var(--text-secondary)">
            {summary}
          </Text>
        ) : null}
      </VStack>
      {rightSlot}
    </Flex>
  );
}

export function TemplateChipPill({ chip }: { chip: TemplateChip }) {
  const tone = templateToneStyles(chip.tone);

  return (
    <Badge
      rounded="full"
      px="2"
      py="0.5"
      fontSize="10px"
      fontWeight="600"
      bg={tone.bg}
      color={tone.color}
      _dark={{ bg: tone.darkBg, color: tone.darkColor }}
    >
      {chip.label}
    </Badge>
  );
}

export function TemplateActionButton({
  action,
  compact = false,
  onClick,
  href,
  openInNewTab = true,
  loading = false,
  disabled = false
}: {
  action: TemplateAction;
  compact?: boolean;
  onClick?: () => void;
  href?: string;
  openInNewTab?: boolean;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isPrimary = action.tone === 'accent';
  const isDanger = action.tone === 'danger';
  const button = (
    <Button
      size={compact ? 'xs' : 'sm'}
      rounded="8px"
      bg={isPrimary ? 'var(--accent)' : isDanger ? 'rgba(239,68,68,0.10)' : 'var(--surface-hover)'}
      color={isPrimary ? 'var(--accent-contrast)' : isDanger ? 'var(--status-danger)' : 'var(--text-primary)'}
      _hover={{
        bg: isPrimary ? 'var(--accent-strong)' : isDanger ? 'rgba(239,68,68,0.16)' : 'var(--surface-2)',
        opacity: 1
      }}
      transition="background-color 150ms ease-in-out"
      onClick={href ? undefined : onClick}
      loading={loading}
      disabled={disabled}
    >
      {action.label}
    </Button>
  );

  if (!href) {
    return button;
  }

  return (
    <Button
      asChild
      size={compact ? 'xs' : 'sm'}
      rounded="8px"
      bg={isPrimary ? 'var(--accent)' : isDanger ? 'rgba(239,68,68,0.10)' : 'var(--surface-hover)'}
      color={isPrimary ? 'var(--accent-contrast)' : isDanger ? 'var(--status-danger)' : 'var(--text-primary)'}
      _hover={{ bg: isPrimary ? 'var(--accent-strong)' : isDanger ? 'rgba(239,68,68,0.16)' : 'var(--surface-2)' }}
      disabled={disabled}
    >
      <a href={href} target={openInNewTab ? '_blank' : undefined} rel={openInNewTab ? 'noopener noreferrer' : undefined}>
        {action.label}
      </a>
    </Button>
  );
}

export function TemplateStatStrip({ title, items }: { title?: string; items: TemplateStat[] }) {
  return (
    <VStack align="stretch" gap="3">
      {title ? (
        <Text fontSize="xs" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0.05em">
          {title}
        </Text>
      ) : null}
      <Flex gap="5" wrap="wrap">
        {items.map((item, i) => {
          const tone = templateToneStyles(item.tone);
          return (
            <Box
              key={`${item.label}-${item.value}`}
              pl={i === 0 ? '0' : '5'}
              borderLeft={i === 0 ? 'none' : '1px solid var(--border-subtle)'}
            >
              <Text fontSize="10px" fontWeight="600" color={item.tone ? tone.color : 'var(--text-muted)'} textTransform="uppercase" letterSpacing="0.05em" _dark={item.tone ? { color: tone.darkColor } : undefined}>
                {item.label}
              </Text>
              <Text mt="0.5" fontSize="xl" fontWeight="700" color="var(--text-primary)">
                {item.value}
              </Text>
              {item.helper ? (
                <Text mt="0.5" fontSize="xs" color="var(--text-muted)">
                  {item.helper}
                </Text>
              ) : null}
              {item.action ? (
                <Button
                  mt="1.5"
                  size="xs"
                  variant="outline"
                  fontSize="xs"
                  fontWeight="500"
                  h="auto"
                  px="2"
                  py="1"
                  borderColor={item.tone ? tone.border : 'var(--border-subtle)'}
                  color={item.tone ? tone.color : 'var(--text-muted)'}
                  _dark={{ borderColor: item.tone ? tone.darkBorder : undefined, color: item.tone ? tone.darkColor : undefined }}
                  _hover={{ bg: item.tone ? tone.bg : 'var(--surface-2)' }}
                  onClick={() => toaster.create({ title: 'Clicked!', type: 'info', duration: 1500 })}
                >
                  {item.action}
                </Button>
              ) : null}
            </Box>
          );
        })}
      </Flex>
    </VStack>
  );
}

export function TemplateFilterStrip({ title, filters, sortLabel }: { title?: string; filters: TemplateChip[]; sortLabel?: string }) {
  return (
    <TemplateSurface bg="var(--surface-2)">
      <VStack align="stretch" gap="3">
        <Flex justify="space-between" align="center" gap="3" wrap="wrap">
          <Text fontSize="sm" fontWeight="500" color="var(--text-secondary)">
            {title ?? 'Filters'}
          </Text>
          {sortLabel ? (
            <Text fontSize="sm" color="var(--text-muted)">
              {sortLabel}
            </Text>
          ) : null}
        </Flex>
        <Flex gap="2" wrap="wrap">
          {filters.map((filter) => (
            <TemplateChipPill key={filter.label} chip={filter} />
          ))}
        </Flex>
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateActionBar({ title, actions }: { title?: string; actions: TemplateAction[] }) {
  return (
    <TemplateSurface>
      <VStack align="stretch" gap="3">
        {title ? (
          <Text fontSize="sm" fontWeight="500" color="var(--text-secondary)">
            {title}
          </Text>
        ) : null}
        <Flex gap="2" wrap="wrap">
          {actions.map((item) => (
            <TemplateActionButton key={item.label} action={item} />
          ))}
        </Flex>
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateGroupedList({
  title,
  groups
}: Extract<RecipeTemplatePreviewSection, { kind: 'grouped-list' }>) {
  return (
    <TemplateSurface>
      <VStack align="stretch" gap="4">
        <TemplateSectionHeader title={title} />
        {groups.map((group, index) => {
          const tone = templateToneStyles(group.tone);
          return (
            <VStack key={group.id} align="stretch" gap="2.5">
              <HStack align="center" gap="2">
                <Box w="2" h="2" rounded="full" bg={tone.color} _dark={{ bg: tone.darkColor }} />
                <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                  {group.label}
                </Text>
              </HStack>
              <VStack align="stretch" gap="2">
                {group.items.map((item) => (
                  <Box key={`${group.id}-${item.title}`} py="2.5" borderBottom="1px solid var(--border-subtle)">
                    <Flex justify="space-between" align="start" gap="3">
                      <VStack align="start" gap="0.5" minW={0}>
                        <Text fontWeight="600" color="var(--text-primary)" fontSize="sm">
                          {item.title}
                        </Text>
                        {item.subtitle ? (
                          <Text fontSize="sm" color="var(--text-secondary)">
                            {item.subtitle}
                          </Text>
                        ) : null}
                        {item.meta ? (
                          <Text fontSize="xs" color="var(--text-muted)">
                            {item.meta}
                          </Text>
                        ) : null}
                      </VStack>
                    </Flex>
                    {item.chips?.length ? (
                      <Flex mt="2" gap="1.5" wrap="wrap">
                        {item.chips.map((chip) => (
                          <TemplateChipPill key={`${item.title}-${chip.label}`} chip={chip} />
                        ))}
                      </Flex>
                    ) : null}
                    {item.actions?.length ? (
                      <Flex mt="2" gap="2" wrap="wrap">
                        {item.actions.map((label) => (
                          <Button key={label} size="xs" rounded="6px" variant="ghost" color="var(--text-muted)" _hover={{ color: 'var(--text-primary)', bg: 'var(--surface-hover)' }}>
                            {label}
                          </Button>
                        ))}
                      </Flex>
                    ) : null}
                  </Box>
                ))}
              </VStack>
              {index < groups.length - 1 ? <Separator borderColor="var(--border-subtle)" /> : null}
            </VStack>
          );
        })}
      </VStack>
    </TemplateSurface>
  );
}

function TemplateCard({
  card,
  wide: _wide = false
}: {
  card: TemplateCardItem;
  wide?: boolean;
}) {
  return (
    <Box
      rounded="8px"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-1)"
      overflow="hidden"
      cursor="pointer"
      transition="opacity 120ms ease"
      _hover={{ opacity: 0.85 }}
      onClick={() => toaster.create({ title: 'Clicked!', type: 'info', duration: 1500 })}
    >
      {card.imageLabel ? (
        <Box borderBottom="1px solid var(--border-subtle)" h="110px" overflow="hidden">
          <Image
            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=640&q=60"
            alt={card.imageLabel}
            w="100%"
            h="100%"
            objectFit="cover"
          />
        </Box>
      ) : null}
      <Box py="3.5" px="3.5">
        <Text fontWeight="600" color="var(--text-primary)" fontSize="sm">
          {card.title}
        </Text>
        {card.subtitle ? (
          <Text mt="0.5" fontSize="sm" color="var(--text-secondary)">
            {card.subtitle}
          </Text>
        ) : null}
        {card.price ? (
          <Text mt="1.5" fontSize="lg" fontWeight="700" color="var(--text-primary)">
            {card.price}
          </Text>
        ) : null}
        {card.chips?.length ? (
          <Flex mt="2" gap="1.5" wrap="wrap">
            {card.chips.map((chip) => (
              <TemplateChipPill key={`${card.title}-${chip.label}`} chip={chip} />
            ))}
          </Flex>
        ) : null}
        {card.bullets?.length ? (
          <VStack mt="2" align="stretch" gap="1">
            {card.bullets.map((bullet) => (
              <HStack key={bullet} align="start" gap="2">
                <Box mt="1.5" w="1.5" h="1.5" rounded="full" bg="var(--text-muted)" flexShrink={0} />
                <Text fontSize="sm" color="var(--text-secondary)">
                  {bullet}
                </Text>
              </HStack>
            ))}
          </VStack>
        ) : null}
      </Box>
    </Box>
  );
}

export function TemplateCardGrid({
  title,
  cards,
  columns = 2
}: Extract<RecipeTemplatePreviewSection, { kind: 'card-grid' }>) {
  return (
    <TemplateSurface>
      <VStack align="stretch" gap="4">
        <TemplateSectionHeader title={title} />
        <SimpleGrid columns={{ base: 2, md: columns }} gap="3.5">
          {cards.map((card) => (
            <TemplateCard key={card.title} card={card} wide={columns === 1} />
          ))}
        </SimpleGrid>
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateComparisonTable({
  title,
  columns,
  rows,
  footerChips,
  footnote
}: Extract<RecipeTemplatePreviewSection, { kind: 'comparison-table' }>) {
  return (
    <VStack align="stretch" gap="4">
      <TemplateSectionHeader title={title} />
      <Box overflowX="auto">
        {/* Column headers */}
        {columns.length > 0 ? (
          <Flex pb="2" mb="1" borderBottom="1px solid var(--border-subtle)">
            <Box w="28%" flexShrink={0} />
            {columns.map((col) => (
              <Box
                key={col.id}
                flex={col.label === '' ? '0 0 36px' : '1'}
                textAlign={col.align ?? 'center'}
              >
                <Text fontSize="11px" fontWeight="600" color="var(--text-secondary)">
                  {col.label}
                </Text>
              </Box>
            ))}
          </Flex>
        ) : null}
        {/* Rows */}
        <VStack align="stretch" gap="0">
          {rows.map((row) => (
            <Flex key={row.id} py="1.5" borderBottom="1px solid var(--border-subtle)" align="center">
              <Text
                w="28%"
                flexShrink={0}
                fontSize="11px"
                fontWeight="600"
                color="var(--text-primary)"
              >
                {row.label}
              </Text>
              {row.cells.map((cell, index) => {
                const col = columns[index];
                const tone = templateToneStyles(cell.tone);
                const cellColor = cell.tone ? tone.color : 'var(--text-primary)';
                const cellDark = cell.tone ? { color: tone.darkColor } : undefined;
                const isIconCell = cell.href && col?.label === '';
                return (
                  <Box key={`${row.id}-${col?.id ?? index}`} flex={col?.label === '' ? '0 0 36px' : '1'} textAlign={col?.align ?? 'center'}>
                    {isIconCell ? (
                      <chakra.a
                        display="inline-flex"
                        alignItems="center"
                        justifyContent="center"
                        w="24px"
                        h="24px"
                        rounded="full"
                        border="1px solid"
                        borderColor="blue.200"
                        color="blue.600"
                        fontSize="11px"
                        _dark={{ color: 'blue.300', borderColor: 'blue.700' }}
                        _hover={{ bg: 'blue.50' }}
                        cursor="pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          toaster.create({ title: 'Clicked!', type: 'info', duration: 1500 });
                        }}
                      >
                        {cell.value}
                      </chakra.a>
                    ) : cell.href ? (
                      <chakra.a
                        href={cell.href}
                        fontWeight={cell.emphasis ? '700' : '500'}
                        fontSize="11px"
                        color="blue.600"
                        textDecoration="underline"
                        textUnderlineOffset="3px"
                        _dark={{ color: 'blue.300' }}
                        _hover={{ color: 'blue.700' }}
                        cursor="pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          toaster.create({ title: 'Clicked!', type: 'info', duration: 1500 });
                        }}
                      >
                        {cell.value}
                      </chakra.a>
                    ) : (
                      <Text
                        fontWeight={cell.emphasis ? '700' : '500'}
                        fontSize="11px"
                        color={cellColor}
                        _dark={cellDark}
                      >
                        {cell.value}
                      </Text>
                    )}
                    {cell.subvalue ? (
                      <Text fontSize="11px" color="var(--text-muted)">{cell.subvalue}</Text>
                    ) : null}
                  </Box>
                );
              })}
            </Flex>
          ))}
        </VStack>
      </Box>
      {footerChips?.length ? (
        <Flex gap="1.5" wrap="wrap">
          {footerChips.map((chip) => (
            <TemplateChipPill key={`${title}-${chip.label}`} chip={chip} />
          ))}
        </Flex>
      ) : null}
      {footnote ? (
        <Text fontSize="xs" color="var(--text-muted)">{footnote}</Text>
      ) : null}
    </VStack>
  );
}

export function TemplateDetailPanel({
  title,
  eyebrow,
  summary,
  chips,
  fields,
  actions,
  note,
  noteTitle
}: Extract<RecipeTemplatePreviewSection, { kind: 'detail-panel' }>) {
  const primaryFields = fields.filter((field) => !field.fullWidth);
  const fullWidthFields = fields.filter((field) => field.fullWidth);

  return (
    <TemplateSurface>
      <VStack align="stretch" gap="4">
        <TemplateSectionHeader title={title} eyebrow={eyebrow} summary={summary} />
        {chips?.length ? (
          <Flex gap="2" wrap="wrap">
            {chips.map((chip) => (
              <TemplateChipPill key={`${title}-${chip.label}`} chip={chip} />
            ))}
          </Flex>
        ) : null}
        {/* All fields as flat label → value rows */}
        <VStack align="stretch" gap="0">
          {[...primaryFields, ...fullWidthFields].map((field) => (
            <Flex key={`${field.label}-${field.value ?? field.bullets?.join('-') ?? ''}`} py="2.5" align="start" gap="4" borderBottom="1px solid var(--border-subtle)">
              <Text
                w="36%"
                flexShrink={0}
                fontSize="10px"
                fontWeight="600"
                color="var(--text-muted)"
                textTransform="uppercase"
                letterSpacing="0.05em"
                pt="0.5"
              >
                {field.label}
              </Text>
              <Box flex="1" minW={0}>
                {field.value ? (
                  <Text fontWeight="500" fontSize="sm" color="var(--text-primary)">
                    {field.value}
                  </Text>
                ) : null}
                {field.chips?.length ? (
                  <Flex mt={field.value ? '1.5' : '0'} gap="1.5" wrap="wrap">
                    {field.chips.map((chip) => (
                      <TemplateChipPill key={`${field.label}-${chip.label}`} chip={chip} />
                    ))}
                  </Flex>
                ) : null}
                {field.bullets?.length ? (
                  <VStack mt={field.value ? '1.5' : '0'} align="stretch" gap="1">
                    {field.bullets.map((bullet) => (
                      <HStack key={bullet} align="start" gap="2">
                        <Box mt="1.5" w="1.5" h="1.5" rounded="full" bg="var(--text-muted)" flexShrink={0} />
                        <Text fontSize="sm" color="var(--text-secondary)">{bullet}</Text>
                      </HStack>
                    ))}
                  </VStack>
                ) : null}
                {field.links?.length ? (
                  <VStack mt={field.value ? '1.5' : '0'} align="stretch" gap="1">
                    {field.links.map((link) => (
                      <Text key={link.href} fontSize="sm" color="var(--text-secondary)">
                        {link.label}:{' '}
                        <a href={link.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                          {link.href}
                        </a>
                      </Text>
                    ))}
                  </VStack>
                ) : null}
              </Box>
            </Flex>
          ))}
        </VStack>
        {actions?.length ? (
          <Flex gap="2" wrap="wrap">
            {actions.map((item) => (
              <TemplateActionButton key={item.label} action={item} />
            ))}
          </Flex>
        ) : null}
        {note ? (
          <Box pt="1">
            {noteTitle ? (
              <Text fontSize="10px" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em" color="var(--text-muted)" mb="1">
                {noteTitle}
              </Text>
            ) : null}
            <Text fontSize="sm" color="var(--text-muted)">{note}</Text>
          </Box>
        ) : null}
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateTimeline({
  title,
  items
}: Extract<RecipeTemplatePreviewSection, { kind: 'timeline' }>) {
  return (
    <TemplateSurface>
      <VStack align="stretch" gap="4">
        <TemplateSectionHeader title={title} />
        <VStack align="stretch" gap="3">
          {items.map((item) => (
            <HStack key={`${item.time}-${item.title}`} align="start" gap="3">
              <VStack align="center" gap="0" pt="1">
                <Box w="2.5" h="2.5" rounded="full" bg="var(--accent)" />
                <Box w="1px" flex="1" minH="16px" bg="var(--border-subtle)" />
              </VStack>
              <Box flex="1" pb="3">
                <Flex justify="space-between" align="center" gap="3" wrap="wrap">
                  <Text fontWeight="600" fontSize="sm" color="var(--text-primary)">
                    {item.title}
                  </Text>
                  <Text fontSize="xs" color="var(--text-muted)">
                    {item.time}
                  </Text>
                </Flex>
                {item.summary ? (
                  <Text mt="1" fontSize="sm" color="var(--text-secondary)">
                    {item.summary}
                  </Text>
                ) : null}
                {item.chips?.length ? (
                  <Flex mt="1.5" gap="1.5" wrap="wrap">
                    {item.chips.map((chip) => (
                      <TemplateChipPill key={`${item.title}-${chip.label}`} chip={chip} />
                    ))}
                  </Flex>
                ) : null}
              </Box>
            </HStack>
          ))}
        </VStack>
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateNotesPanel({
  title,
  lines,
  actions
}: Extract<RecipeTemplatePreviewSection, { kind: 'notes' }>) {
  return (
    <TemplateSurface>
      <VStack align="stretch" gap="4">
        <TemplateSectionHeader title={title} />
        <VStack align="stretch" gap="2">
          {lines.map((line) => (
            <Box key={line} py="2.5" borderBottom="1px solid var(--border-subtle)">
              <Text fontSize="sm" color="var(--text-secondary)">{line}</Text>
            </Box>
          ))}
        </VStack>
        {actions?.length ? (
          <Flex gap="2" wrap="wrap">
            {actions.map((item) => (
              <TemplateActionButton key={item.label} action={item} compact />
            ))}
          </Flex>
        ) : null}
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateActivityLog({
  title,
  entries
}: Extract<RecipeTemplatePreviewSection, { kind: 'activity-log' }>) {
  return (
    <TemplateSurface>
      <VStack align="stretch" gap="4">
        <TemplateSectionHeader title={title} />
        <VStack align="stretch" gap="2.5">
          {entries.map((entry) => {
            const tone = templateToneStyles(entry.tone);
            return (
              <Box key={`${entry.label}-${entry.timestamp ?? entry.detail}`} py="2.5" borderBottom="1px solid var(--border-subtle)">
                <Flex justify="space-between" align="center" gap="3">
                  <Text fontSize="sm" fontWeight="600" color={entry.tone ? tone.color : 'var(--text-primary)'} _dark={entry.tone ? { color: tone.darkColor } : undefined}>
                    {entry.label}
                  </Text>
                  {entry.timestamp ? (
                    <Text fontSize="xs" color="var(--text-muted)">{entry.timestamp}</Text>
                  ) : null}
                </Flex>
                <Text mt="0.5" fontSize="sm" color="var(--text-secondary)">{entry.detail}</Text>
              </Box>
            );
          })}
        </VStack>
      </VStack>
    </TemplateSurface>
  );
}

function TemplateBoardColumnView({ column }: { column: TemplateBoardColumn }) {
  const tone = templateToneStyles(column.tone);

  return (
    <Box minW={{ base: '100%', md: '220px' }} maxW={{ base: '100%', md: '220px' }}>
      <VStack align="stretch" gap="3">
        <HStack justify="space-between" align="center" pb="2" borderBottom="1px solid var(--border-subtle)">
          <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
            {column.label}
          </Text>
          <Text fontSize="xs" fontWeight="600" color={tone.color} _dark={{ color: tone.darkColor }}>
            {column.cards.length}
          </Text>
        </HStack>
        <VStack align="stretch" gap="0">
          {column.cards.map((card) => (
            <Box key={`${column.label}-${card.title}`} py="2.5" borderBottom="1px solid var(--border-subtle)">
              <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                {card.title}
              </Text>
              {card.subtitle ? (
                <Text mt="0.5" fontSize="sm" color="var(--text-secondary)">
                  {card.subtitle}
                </Text>
              ) : null}
              {card.chips?.length ? (
                <Flex mt="1.5" gap="1.5" wrap="wrap">
                  {card.chips.map((chip) => (
                    <TemplateChipPill key={`${card.title}-${chip.label}`} chip={chip} />
                  ))}
                </Flex>
              ) : null}
              {card.footer ? (
                <Text mt="1.5" fontSize="xs" color="var(--text-muted)">{card.footer}</Text>
              ) : null}
            </Box>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
}

export function TemplateKanbanBoard({
  title,
  columns
}: Extract<RecipeTemplatePreviewSection, { kind: 'kanban' }>) {
  return (
    <TemplateSurface>
      <VStack align="stretch" gap="4">
        <TemplateSectionHeader title={title} />
        <Flex gap="3.5" overflowX="auto" pb="1">
          {columns.map((column) => (
            <TemplateBoardColumnView key={column.label} column={column} />
          ))}
        </Flex>
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateConfirmationBlock({
  title,
  message,
  confirmLabel,
  secondaryLabel,
  tone: inputTone
}: Extract<RecipeTemplatePreviewSection, { kind: 'confirmation' }>) {
  const tone = templateToneStyles(inputTone);

  return (
    <TemplateSurface bg={tone.bg}>
      <VStack align="stretch" gap="4">
        <Text fontSize="lg" fontWeight="600" color="var(--text-primary)">
          {title}
        </Text>
        <Text fontSize="sm" color="var(--text-secondary)">
          {message}
        </Text>
        <Flex gap="2" wrap="wrap">
          <TemplateActionButton action={{ label: confirmLabel, tone: inputTone === 'danger' ? 'danger' : 'accent' }} />
          {secondaryLabel ? <TemplateActionButton action={{ label: secondaryLabel }} /> : null}
        </Flex>
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateEmptyStateBlock({
  title,
  detail
}: {
  title: string;
  detail: string;
}) {
  return (
    <TemplateSurface>
      <VStack align="start" gap="2">
        <Text fontSize="lg" fontWeight="600" color="var(--text-primary)">
          {title}
        </Text>
        <Text color="var(--text-secondary)">{detail}</Text>
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateAccordionList({
  title,
  items
}: Extract<RecipeTemplatePreviewSection, { kind: 'accordion-list' }>) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <TemplateSurface>
      <VStack align="stretch" gap="0">
        {title ? (
          <Box pb="3">
            <TemplateSectionHeader title={title} />
          </Box>
        ) : null}
        {items.map((item, index) => {
          const isExpanded = expandedId === item.id;
          const tone = templateToneStyles(item.tone);
          const recTone = templateToneStyles(item.recommendationTone);
          return (
            <Box key={item.id}>
              {index > 0 ? <Separator borderColor="var(--border-subtle)" /> : null}
              <Box
                py="3"
                px="1"
                cursor="pointer"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                _hover={{ bg: 'var(--surface-2)', rounded: '6px' }}
                transition="background 0.1s"
              >
                <Flex justify="space-between" align="center" gap="3">
                  <HStack gap="2.5" align="center" minW={0}>
                    {item.tone ? (
                      <Box w="2.5" h="2.5" rounded="full" bg={tone.color} _dark={{ bg: tone.darkColor }} flexShrink={0} />
                    ) : null}
                    <VStack align="start" gap="0.5" minW={0}>
                      <Text fontWeight="600" color="var(--text-primary)" fontSize="sm">
                        {item.title}
                      </Text>
                      {item.subtitle ? (
                        <Text fontSize="xs" color="var(--text-secondary)" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" maxW="100%">
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </VStack>
                  </HStack>
                  <HStack gap="2" flexShrink={0}>
                    {item.count ? (
                      <Box
                        px="2"
                        py="0.5"
                        rounded="full"
                        bg={tone.bg}
                        border="1px solid"
                        borderColor={tone.border}
                        _dark={{ bg: tone.darkBg, borderColor: tone.darkBorder }}
                      >
                        <Text fontSize="10px" fontWeight="700" color={tone.color} _dark={{ color: tone.darkColor }} textTransform="uppercase" letterSpacing="0.04em">
                          {item.count}
                        </Text>
                      </Box>
                    ) : null}
                    <Text fontSize="xs" color="var(--text-muted)">
                      {isExpanded ? '▲' : '▼'}
                    </Text>
                  </HStack>
                </Flex>
              </Box>
              {isExpanded ? (
                <Box pl="4" pb="3" pt="1">
                  <VStack align="stretch" gap="3">
                    {item.subjects && item.subjects.length > 0 ? (
                      <VStack align="stretch" gap="2">
                        <Text fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="0" color="var(--text-muted)">
                          Sample subjects
                        </Text>
                        <VStack align="stretch" gap="1">
                          {item.subjects.map((subject) => (
                            <Text key={subject} fontSize="sm" color="var(--text-secondary)">
                              {subject}
                            </Text>
                          ))}
                        </VStack>
                      </VStack>
                    ) : null}
                    {item.detailHeader ? (
                      <VStack align="stretch" gap="1.5">
                        <Text fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="0" color="var(--text-muted)">
                          {item.detailHeader}
                        </Text>
                        {item.detailText ? (
                          <Text fontSize="sm" color="var(--text-secondary)">
                            {item.detailText}
                          </Text>
                        ) : null}
                        {item.evidenceBullets && item.evidenceBullets.length > 0 ? (
                          <VStack align="stretch" gap="1.5" mt="1">
                            <Text fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="0" color="var(--text-muted)">
                              Evidence
                            </Text>
                            <VStack align="stretch" gap="1">
                              {item.evidenceBullets.map((bullet) => (
                                <HStack key={bullet} align="start" gap="2">
                                  <Box mt="1.5" w="1.5" h="1.5" rounded="full" bg="var(--accent)" flexShrink={0} />
                                  <Text fontSize="sm" color="var(--text-secondary)">
                                    {bullet}
                                  </Text>
                                </HStack>
                              ))}
                            </VStack>
                          </VStack>
                        ) : null}
                      </VStack>
                    ) : null}
                    {item.recommendation ? (
                      <Box borderLeft="2px solid" borderColor={item.recommendationTone ? recTone.color : 'var(--border-default)'} pl="3" py="0.5" _dark={{ borderColor: item.recommendationTone ? recTone.darkColor : 'var(--border-default)' }}>
                        <Text fontSize="sm" color="var(--text-secondary)">{item.recommendation}</Text>
                      </Box>
                    ) : null}
                    {item.actions && item.actions.length > 0 ? (
                      <Flex gap="2" wrap="wrap" pt="1">
                        {item.actions.map((act) => (
                          <TemplateActionButton key={act.label} action={act} compact />
                        ))}
                      </Flex>
                    ) : null}
                  </VStack>
                </Box>
              ) : null}
            </Box>
          );
        })}
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateSelectableTable({
  title,
  columns,
  rows,
  primaryAction,
  secondaryAction
}: Extract<RecipeTemplatePreviewSection, { kind: 'selectable-table' }>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  }

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < rows.length;

  return (
    <TemplateSurface>
      <VStack align="stretch" gap="4">
        {title ? <TemplateSectionHeader title={title} /> : null}
        <Table.ScrollArea>
          <Table.Root size="sm" variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader w="36px" px="3">
                  <Checkbox.Root
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleAll}
                    cursor="pointer"
                    position="relative"
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control w="4" h="4" />
                  </Checkbox.Root>
                </Table.ColumnHeader>
                <Table.ColumnHeader>Item</Table.ColumnHeader>
                {columns.map((col) => (
                  <Table.ColumnHeader key={col.id} textAlign={col.align ?? 'start'}>
                    {col.label}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => {
                const isSelected = selectedIds.has(row.id);
                return (
                  <Table.Row
                    key={row.id}
                    bg={isSelected ? 'var(--surface-accent)' : undefined}
                    _hover={{ bg: isSelected ? 'var(--surface-accent)' : 'var(--surface-2)' }}
                    cursor="pointer"
                    onClick={() => toggleRow(row.id)}
                  >
                    <Table.Cell px="3">
                      <Checkbox.Root
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(row.id)}
                        onClick={(e) => e.stopPropagation()}
                        cursor="pointer"
                        position="relative"
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control w="4" h="4" />
                      </Checkbox.Root>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontWeight="600" color="var(--text-primary)">
                        {row.label}
                      </Text>
                    </Table.Cell>
                    {row.cells.map((cell, idx) => {
                      const tone = templateToneStyles(cell.tone);
                      const col = columns[idx];
                      if (cell.tone === 'accent') {
                        return (
                          <Table.Cell key={`${row.id}-${col?.id ?? idx}`} textAlign={col?.align ?? 'start'}>
                            <Text
                              fontSize="sm"
                              color="var(--accent)"
                              textDecoration="underline"
                              textUnderlineOffset="3px"
                            >
                              {cell.value}
                            </Text>
                          </Table.Cell>
                        );
                      }
                      return (
                        <Table.Cell key={`${row.id}-${col?.id ?? idx}`} textAlign={col?.align ?? 'start'}>
                          <Text
                            fontWeight={cell.emphasis ? '700' : '500'}
                            color={cell.tone ? tone.color : 'var(--text-primary)'}
                            _dark={cell.tone ? { color: tone.darkColor } : undefined}
                          >
                            {cell.value}
                          </Text>
                          {cell.subvalue ? (
                            <Text fontSize="xs" color="var(--text-muted)">
                              {cell.subvalue}
                            </Text>
                          ) : null}
                        </Table.Cell>
                      );
                    })}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
        <Flex gap="2" wrap="wrap">
          <TemplateActionButton
            action={{ label: primaryAction, tone: 'accent' }}
            disabled={selectedIds.size === 0}
          />
          {secondaryAction ? (
            <TemplateActionButton action={{ label: secondaryAction }} />
          ) : null}
        </Flex>
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateInteractiveGuestList({
  title,
  guests: initialGuests
}: Extract<RecipeTemplatePreviewSection, { kind: 'interactive-guest-list' }>) {
  const [guests, setGuests] = useState(initialGuests);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(guest: typeof guests[number]) {
    setEditingId(guest.id);
    setEditValue(guest.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitEdit(id: string) {
    const trimmed = editValue.trim();
    if (trimmed) setGuests((prev) => prev.map((g) => g.id === id ? { ...g, name: trimmed } : g));
    setEditingId(null);
  }

  function removeGuest(id: string) {
    setGuests((prev) => prev.filter((g) => g.id !== id));
  }

  function addGuest() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setGuests((prev) => [...prev, { id: `guest-${Date.now()}`, name: trimmed }]);
    setNewName('');
  }

  return (
    <TemplateSurface>
      <VStack align="stretch" gap="4">
        <TemplateSectionHeader title={title} />
        <VStack align="stretch" gap="0">
          {guests.map((guest) => (
            <HStack key={guest.id} py="2.5" borderBottom="1px solid var(--border-subtle)" justify="space-between" gap="3">
              {editingId === guest.id ? (
                <Input
                  ref={inputRef}
                  size="sm"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(guest.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(guest.id); if (e.key === 'Escape') setEditingId(null); }}
                  flex="1"
                  fontSize="sm"
                />
              ) : (
                <VStack align="start" gap="0" minW={0} flex="1">
                  <Text fontSize="sm" fontWeight="500" color="var(--text-primary)">{guest.name}</Text>
                  {guest.meta ? <Text fontSize="xs" color="var(--text-muted)">{guest.meta}</Text> : null}
                </VStack>
              )}
              <HStack gap="1" flexShrink={0}>
                <Button size="xs" variant="ghost" color="var(--text-muted)" px="1.5" onClick={() => startEdit(guest)}>Edit</Button>
                <Button size="xs" variant="ghost" color="red.500" px="1.5" onClick={() => removeGuest(guest.id)}>Remove</Button>
              </HStack>
            </HStack>
          ))}
        </VStack>
        <HStack gap="2">
          <Input
            size="sm"
            placeholder="Add guest name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addGuest(); }}
            flex="1"
            fontSize="sm"
          />
          <Button size="sm" variant="outline" onClick={addGuest} disabled={!newName.trim()}>Add</Button>
        </HStack>
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateInteractiveChecklist({
  title,
  items: initialItems
}: Extract<RecipeTemplatePreviewSection, { kind: 'interactive-checklist' }>) {
  const [items, setItems] = useState(initialItems);
  const [newLabel, setNewLabel] = useState('');

  function toggleItem(id: string) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  }

  function addItem() {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    setItems((prev) => [...prev, { id: `item-${Date.now()}`, label: trimmed, checked: false }]);
    setNewLabel('');
  }

  return (
    <TemplateSurface>
      <VStack align="stretch" gap="4">
        <TemplateSectionHeader title={title} />
        <VStack align="stretch" gap="0">
          {items.map((item) => (
            <HStack
              key={item.id}
              py="2.5"
              borderBottom="1px solid var(--border-subtle)"
              gap="3"
              cursor="pointer"
              onClick={() => toggleItem(item.id)}
            >
              <Checkbox.Root
                checked={item.checked}
                onCheckedChange={() => toggleItem(item.id)}
                flexShrink={0}
                onClick={(e) => e.stopPropagation()}
                cursor="pointer"
                position="relative"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control w="4" h="4" rounded="4px" />
              </Checkbox.Root>
              <Text
                fontSize="sm"
                color={item.checked ? 'var(--text-muted)' : 'var(--text-primary)'}
                textDecoration={item.checked ? 'line-through' : 'none'}
                flex="1"
              >
                {item.label}
              </Text>
            </HStack>
          ))}
        </VStack>
        <HStack gap="2">
          <Input
            size="sm"
            placeholder="Add item…"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
            flex="1"
            fontSize="sm"
          />
          <Button size="sm" variant="outline" onClick={addItem} disabled={!newLabel.trim()}>Add</Button>
        </HStack>
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateEditableNotes({
  title,
  notes: initialNotes
}: Extract<RecipeTemplatePreviewSection, { kind: 'editable-notes' }>) {
  const [notes, setNotes] = useState(initialNotes);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newNote, setNewNote] = useState('');

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditValue(notes[index] ?? '');
  }

  function commitEdit(index: number) {
    const trimmed = editValue.trim();
    if (trimmed) setNotes((prev) => prev.map((n, i) => i === index ? trimmed : n));
    setEditingIndex(null);
  }

  function deleteNote(index: number) {
    setNotes((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  }

  function addNote() {
    const trimmed = newNote.trim();
    if (!trimmed) return;
    setNotes((prev) => [...prev, trimmed]);
    setNewNote('');
  }

  return (
    <TemplateSurface>
      <VStack align="stretch" gap="4">
        <TemplateSectionHeader title={title} />
        <VStack align="stretch" gap="0">
          {notes.map((note, index) => (
            <Box key={index} py="2.5" borderBottom="1px solid var(--border-subtle)">
              {editingIndex === index ? (
                <HStack gap="2">
                  <Input
                    size="sm"
                    value={editValue}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(index)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(index); if (e.key === 'Escape') setEditingIndex(null); }}
                    flex="1"
                    fontSize="sm"
                  />
                </HStack>
              ) : (
                <HStack justify="space-between" align="start" gap="3">
                  <Text fontSize="sm" color="var(--text-secondary)" flex="1">{note}</Text>
                  <HStack gap="1" flexShrink={0}>
                    <Button size="xs" variant="ghost" color="var(--text-muted)" px="1.5" onClick={() => startEdit(index)}>Edit</Button>
                    <Button size="xs" variant="ghost" color="red.500" px="1.5" onClick={() => deleteNote(index)}>Delete</Button>
                  </HStack>
                </HStack>
              )}
            </Box>
          ))}
        </VStack>
        <HStack gap="2">
          <Input
            size="sm"
            placeholder="Add note…"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
            flex="1"
            fontSize="sm"
          />
          <Button size="sm" variant="outline" onClick={addNote} disabled={!newNote.trim()}>Add</Button>
        </HStack>
      </VStack>
    </TemplateSurface>
  );
}

function StepCodeBlock({ code, dimmed }: { code: string; dimmed: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <Box position="relative" mt="2" opacity={dimmed ? 0.55 : 1}>
      <Box
        as="pre"
        rounded="8px"
        bg={dimmed ? 'var(--surface-2)' : 'rgba(0,0,0,0.06)'}
        border="1px solid var(--border-subtle)"
        px="3.5"
        py="3"
        overflowX="auto"
        _dark={{ bg: dimmed ? 'var(--surface-2)' : 'rgba(255,255,255,0.05)' }}
      >
        <Box as="code" fontFamily="mono" fontSize="xs" color="var(--text-primary)" whiteSpace="pre">
          {code}
        </Box>
      </Box>
      <Button
        size="xs"
        position="absolute"
        top="2"
        right="2"
        rounded="6px"
        bg="var(--surface-1)"
        border="1px solid var(--border-subtle)"
        color="var(--text-secondary)"
        _hover={{ bg: 'var(--surface-2)' }}
        onClick={() => {
          void navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </Button>
    </Box>
  );
}

export function TemplateStepByStepPreview({
  prerequisites = [],
  steps
}: Extract<RecipeTemplatePreviewSection, { kind: 'step-by-step-preview' }>) {
  const [checkedPrereqs, setCheckedPrereqs] = useState<Record<string, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  const markdownComponents = (dimmed: boolean) => ({
    p: ({ children }: { children: ReactNode }) => (
      <Text
        as="span"
        display="block"
        fontSize="sm"
        color={dimmed ? 'var(--text-muted)' : 'var(--text-secondary)'}
        textDecoration={dimmed ? 'line-through' : undefined}
        opacity={dimmed ? 0.7 : 1}
      >
        {children}
      </Text>
    ),
    a: ({ children, href }: { children: ReactNode; href?: string }) => (
      <chakra.a
        href={href ?? '#'}
        color="blue.600"
        textDecoration="underline"
        textUnderlineOffset="2px"
        _dark={{ color: 'blue.300' }}
        onClick={(e) => { e.preventDefault(); toaster.create({ title: 'Clicked!', type: 'info', duration: 1500 }); }}
      >
        {children}
      </chakra.a>
    ),
    code: ({ children }: { children: ReactNode }) => (
      <Box as="code" fontFamily="mono" fontSize="0.82em" bg="var(--surface-2)" border="1px solid var(--border-subtle)" px="1" py="0.5" rounded="3px" color="var(--accent)">
        {children}
      </Box>
    ),
    strong: ({ children }: { children: ReactNode }) => <Text as="strong" fontWeight="700" color="inherit">{children}</Text>,
    li: ({ children }: { children: ReactNode }) => (
      <HStack as="li" align="start" gap="2" mb="0.5">
        <Box mt="2" w="1.5" h="1.5" rounded="full" bg="var(--text-muted)" flexShrink={0} />
        <Text fontSize="sm" color={dimmed ? 'var(--text-muted)' : 'var(--text-secondary)'}>{children}</Text>
      </HStack>
    ),
    ul: ({ children }: { children: ReactNode }) => <Box as="ul" listStyleType="none" mt="1.5" mb="1">{children}</Box>
  });

  return (
    <TemplateSurface>
      <VStack align="stretch" gap="4">
        {prerequisites.length > 0 ? (
          <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-2)" px="3.5" py="3">
            <Text fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="0.04em" color="var(--text-muted)" mb="2.5">
              Prerequisites
            </Text>
            <VStack align="stretch" gap="2">
              {prerequisites.map((prereq) => {
                const isChecked = checkedPrereqs[prereq.id] ?? false;
                return (
                  <HStack
                    key={prereq.id}
                    gap="2.5"
                    cursor="pointer"
                    onClick={() => setCheckedPrereqs((p) => ({ ...p, [prereq.id]: !p[prereq.id] }))}
                  >
                    <Checkbox.Root
                      checked={isChecked}
                      onCheckedChange={() => setCheckedPrereqs((p) => ({ ...p, [prereq.id]: !p[prereq.id] }))}
                      flexShrink={0}
                      onClick={(e) => e.stopPropagation()}
                      cursor="pointer"
                      position="relative"
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control w="4" h="4" rounded="4px" />
                    </Checkbox.Root>
                    <Text
                      fontSize="sm"
                      color={isChecked ? 'var(--text-muted)' : 'var(--text-secondary)'}
                      textDecoration={isChecked ? 'line-through' : undefined}
                      opacity={isChecked ? 0.7 : 1}
                    >
                      {prereq.label}
                    </Text>
                  </HStack>
                );
              })}
            </VStack>
          </Box>
        ) : null}

        <VStack align="stretch" gap="2">
          {steps.map((step, index) => {
            const isChecked = checkedSteps[step.id] ?? false;
            const prevChecked = index === 0 || (checkedSteps[steps[index - 1]?.id ?? ''] ?? false);
            const hasContent = Boolean(step.detail) || Boolean(step.code);
            const showAskHermes = !isChecked && prevChecked;

            return (
              <Box
                key={step.id}
                rounded="8px"
                border="1px solid var(--border-subtle)"
                bg={isChecked && hasContent ? 'var(--surface-2)' : 'var(--surface-1)'}
                px="3.5"
                py="3"
                transition="background 150ms ease"
              >
                <HStack align="start" gap="3">
                  <Box
                    pt="0.5"
                    flexShrink={0}
                    cursor="pointer"
                    p="2"
                    m="-2"
                    onClick={() => setCheckedSteps((p) => ({ ...p, [step.id]: !p[step.id] }))}
                  >
                    <Checkbox.Root
                      checked={isChecked}
                      onCheckedChange={() => setCheckedSteps((p) => ({ ...p, [step.id]: !p[step.id] }))}
                      onClick={(e) => e.stopPropagation()}
                      cursor="pointer"
                      position="relative"
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control w="4" h="4" rounded="4px" />
                    </Checkbox.Root>
                  </Box>
                  <Box flex="1" minW={0}>
                    <HStack align="baseline" gap="1.5">
                      <Text as="span" fontSize="xs" fontWeight="700" color={isChecked ? 'var(--text-muted)' : 'var(--accent)'} flexShrink={0}>
                        {index + 1}.
                      </Text>
                      <Box flex="1">
                        <ReactMarkdown
                          urlTransform={(url) => safeMarkdownUrlTransform(url) ?? ''}
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents(isChecked && !hasContent) as never}
                        >
                          {step.label}
                        </ReactMarkdown>
                      </Box>
                    </HStack>
                    {step.detail ? (
                      <Box mt="1.5" opacity={isChecked ? 0.6 : 1}>
                        <ReactMarkdown
                          urlTransform={(url) => safeMarkdownUrlTransform(url) ?? ''}
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents(false) as never}
                        >
                          {step.detail}
                        </ReactMarkdown>
                      </Box>
                    ) : null}
                    {step.code ? <StepCodeBlock code={step.code} dimmed={isChecked} /> : null}
                    {showAskHermes ? (
                      <Button
                        mt="2.5"
                        size="xs"
                        variant="outline"
                        fontSize="xs"
                        color="var(--accent)"
                        borderColor="var(--accent)"
                        _hover={{ bg: 'var(--accent-soft)' }}
                        onClick={() => toaster.create({ title: 'Clicked!', type: 'info', duration: 1500 })}
                      >
                        Ask Hermes for help
                      </Button>
                    ) : null}
                  </Box>
                </HStack>
              </Box>
            );
          })}
        </VStack>
      </VStack>
    </TemplateSurface>
  );
}

export function TemplateReportSection({
  title,
  body,
  footnotes = []
}: Extract<RecipeTemplatePreviewSection, { kind: 'report' }>) {
  const [highlightedFn, setHighlightedFn] = useState<string | null>(null);

  function handleFootnoteClick(id: string) {
    setHighlightedFn(id);
    document.getElementById(`fn-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => setHighlightedFn(null), 2000);
  }

  return (
    <TemplateSurface>
      <VStack align="stretch" gap="5">
        <TemplateSectionHeader title={title} />
        <Box
          color="var(--text-primary)"
          css={{
            '& h1': { fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.4rem', lineHeight: 1.25 },
            '& h2': { fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1.25rem', marginBottom: '0.35rem', lineHeight: 1.25 },
            '& h3': { fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: '0.3rem', lineHeight: 1.3 },
            '& p': { fontSize: '0.875rem', lineHeight: 1.75, color: 'var(--text-secondary)', marginBottom: '0.75rem' },
            '& p:last-child': { marginBottom: 0 },
            '& ul, & ol': { paddingInlineStart: '1.4rem', marginBottom: '0.75rem' },
            '& ul': { listStyleType: 'disc' },
            '& ol': { listStyleType: 'decimal' },
            '& li': { fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '0.2rem' },
            '& strong': { fontWeight: 600, color: 'var(--text-primary)' },
            '& h1:first-child, & h2:first-child, & h3:first-child': { marginTop: 0 }
          }}
        >
          <ReactMarkdown
            urlTransform={(url) => safeMarkdownUrlTransform(url) ?? ''}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              sup({ children }) {
                const id = String(children);
                return (
                  <chakra.a
                    href={`#fn-${id}`}
                    fontSize="0.6em"
                    fontWeight="700"
                    color="var(--accent)"
                    verticalAlign="super"
                    lineHeight={1}
                    textDecoration="none"
                    position="relative"
                    top="-0.1em"
                    cursor="pointer"
                    _hover={{ textDecoration: 'underline' }}
                    onClick={(e) => { e.preventDefault(); handleFootnoteClick(id); }}
                  >
                    {children}
                  </chakra.a>
                );
              }
            }}
          >
            {body}
          </ReactMarkdown>
        </Box>
        {footnotes.length > 0 ? (
          <Box borderTop="1px solid var(--border-subtle)" pt="3">
            <VStack align="stretch" gap="1.5">
              {footnotes.map((fn) => (
                <HStack
                  key={fn.id}
                  id={`fn-${fn.id}`}
                  align="start"
                  gap="2"
                  px="2"
                  py="1"
                  rounded="6px"
                  bg={highlightedFn === fn.id ? 'var(--accent-soft)' : 'transparent'}
                  transition="background 300ms ease"
                >
                  <Text fontSize="10px" fontWeight="700" color="var(--accent)" flexShrink={0} minW="16px">
                    {fn.id}
                  </Text>
                  {fn.url ? (
                    <chakra.a
                      fontSize="xs"
                      color="var(--text-muted)"
                      textDecoration="underline"
                      textUnderlineOffset="2px"
                      cursor="pointer"
                      _hover={{ color: 'var(--text-secondary)' }}
                      onClick={(e) => { e.preventDefault(); toaster.create({ title: 'Clicked!', type: 'info', duration: 1500 }); }}
                    >
                      {fn.label}
                    </chakra.a>
                  ) : (
                    <Text fontSize="xs" color="var(--text-muted)">{fn.label}</Text>
                  )}
                </HStack>
              ))}
            </VStack>
          </Box>
        ) : null}
      </VStack>
    </TemplateSurface>
  );
}
