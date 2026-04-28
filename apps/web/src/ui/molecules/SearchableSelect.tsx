import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Box, Button, HStack, Input, Text, VStack, chakra } from '@chakra-ui/react';

function ChevronDown() {
  const Svg = chakra('svg');
  return (
    <Svg viewBox="0 0 16 16" boxSize="3" fill="none" aria-hidden="true" color="currentColor" flexShrink={0} opacity={0.5}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon() {
  const Svg = chakra('svg');
  return (
    <Svg viewBox="0 0 16 16" boxSize="3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" color="var(--accent)" flexShrink={0}>
      <path d="M2 8l4 4 8-8" />
    </Svg>
  );
}

export type SearchableSelectOption = { value: string; label: string; disabled?: boolean };

type TriggerSize = 'compact' | 'normal';

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  emptyLabel = 'No matches',
  searchPlaceholder = 'Search…',
  ariaLabel,
  size = 'normal',
  triggerMinW,
  triggerMaxW,
  popoverWidth = '320px',
  popoverAnchor = 'start'
}: {
  value: string;
  options: SearchableSelectOption[];
  onChange: (next: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  searchPlaceholder?: string;
  ariaLabel: string;
  size?: TriggerSize;
  triggerMinW?: string;
  triggerMaxW?: string;
  popoverWidth?: string;
  popoverAnchor?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);
  const triggerLabel = selectedOption?.label ?? placeholder;

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return options;
    return options.filter((o) => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q));
  }, [options, q]);

  // Close on outside click and Escape
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Reset query + highlight when opening; focus the search input
  useEffect(() => {
    if (open) {
      setQuery('');
      const idx = Math.max(0, options.findIndex((o) => o.value === value));
      setHighlighted(idx === -1 ? 0 : idx);
      // Defer focus until after render
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, options, value]);

  // Keep highlighted within bounds when filter shrinks
  useEffect(() => {
    if (highlighted >= filtered.length) {
      setHighlighted(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, highlighted]);

  // Auto-scroll the highlighted row into view (guarded for jsdom which lacks scrollIntoView)
  useEffect(() => {
    if (!open || !listRef.current) return;
    const node = listRef.current.querySelector<HTMLElement>(`[data-idx="${highlighted}"]`);
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted, open]);

  function commit(next: string) {
    onChange(next);
    setOpen(false);
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[highlighted];
      if (opt && !opt.disabled) commit(opt.value);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const triggerHeight = size === 'compact' ? '7' : '9';
  const triggerFontSize = size === 'compact' ? '12px' : '13px';
  const triggerPx = size === 'compact' ? '2.5' : '3';

  return (
    <Box position="relative" ref={containerRef} flexShrink={0} display="inline-flex">
      <Button
        type="button"
        variant="ghost"
        h={triggerHeight}
        px={triggerPx}
        rounded="var(--radius-control)"
        bg="var(--surface-2)"
        border="1px solid var(--border-subtle)"
        _hover={{ bg: 'var(--surface-3)', borderColor: 'var(--border-moderate)' }}
        minW={triggerMinW}
        maxW={triggerMaxW}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={selectedOption?.label}
      >
        <HStack gap="1.5" align="center" w="full" justify="space-between" minW={0}>
          <Text
            fontSize={triggerFontSize}
            fontWeight="500"
            color={selectedOption ? 'var(--text-secondary)' : 'var(--text-muted)'}
            lineHeight="1"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            flex="1"
            minW={0}
            textAlign="left"
          >
            {triggerLabel}
          </Text>
          <ChevronDown />
        </HStack>
      </Button>

      {open ? (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          {...(popoverAnchor === 'end' ? { right: 0 } : { left: 0 })}
          w={popoverWidth}
          maxW="calc(100vw - 32px)"
          bg="var(--surface-elevated)"
          border="1px solid var(--border-subtle)"
          rounded="10px"
          boxShadow="var(--shadow-lg)"
          zIndex={1500}
          overflow="hidden"
          role="listbox"
        >
          <Box p="2" borderBottom="1px solid var(--divider)">
            <Input
              ref={inputRef}
              size="sm"
              value={query}
              onChange={(e) => { setQuery(e.currentTarget.value); setHighlighted(0); }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              bg="var(--surface-1)"
              borderColor="var(--border-subtle)"
              fontSize="13px"
              _placeholder={{ color: 'var(--text-muted)' }}
            />
          </Box>
          <Box ref={listRef} maxH="320px" overflowY="auto" py="1">
            {filtered.length === 0 ? (
              <Box px="3" py="3" textAlign="center">
                <Text fontSize="13px" color="var(--text-muted)">
                  {emptyLabel}{q ? ` for "${query}"` : ''}
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" gap="0">
                {filtered.map((opt, i) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = i === highlighted;
                  return (
                    <Box
                      key={opt.value}
                      data-idx={i}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlighted(i)}
                      onMouseDown={(e: ReactMouseEvent) => {
                        // mousedown so the click commits before the document handler closes us
                        e.preventDefault();
                        if (!opt.disabled) commit(opt.value);
                      }}
                      px="3"
                      py="1.5"
                      cursor={opt.disabled ? 'not-allowed' : 'pointer'}
                      opacity={opt.disabled ? 0.4 : 1}
                      bg={isHighlighted && !opt.disabled ? 'var(--surface-hover)' : 'transparent'}
                    >
                      <HStack gap="2" justify="space-between" align="center">
                        <Text
                          fontSize="13px"
                          color={isSelected ? 'var(--accent)' : 'var(--text-primary)'}
                          fontWeight={isSelected ? '600' : '400'}
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                          flex="1"
                          minW={0}
                          title={opt.label}
                        >
                          {opt.label}
                        </Text>
                        {isSelected ? <CheckIcon /> : null}
                      </HStack>
                      {opt.label !== opt.value ? (
                        <Text fontSize="10px" color="var(--text-muted)" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" mt="0.5">
                          {opt.value}
                        </Text>
                      ) : null}
                    </Box>
                  );
                })}
              </VStack>
            )}
          </Box>
          <Box px="3" py="1.5" borderTop="1px solid var(--divider)" bg="var(--surface-1)">
            <Text fontSize="10px" color="var(--text-muted)">
              {filtered.length} of {options.length}
            </Text>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
