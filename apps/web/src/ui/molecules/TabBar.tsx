import { useCallback, useEffect, useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import { Button, Flex, HStack, Text } from '@chakra-ui/react';

const tabPulseStyle = `@keyframes tabPulse { 0%, 100% { border-bottom-color: var(--accent); } 50% { border-bottom-color: transparent; } }`;

export interface TabItem {
  sessionId: string;
  title: string;
  status?: 'generating' | 'success' | 'error' | 'idle';
}

export function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onReorderTabs,
  rightContent
}: {
  tabs: TabItem[];
  activeTabId: string | null;
  onSelectTab: (sessionId: string) => void;
  onCloseTab: (sessionId: string) => void;
  onNewTab: () => void;
  onReorderTabs?: (tabs: TabItem[]) => void;
  rightContent?: ReactNode;
}) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [clearedStatuses, setClearedStatuses] = useState<Set<string>>(new Set());

  useEffect(() => {
    const generatingIds = tabs.filter(t => t.status === 'generating').map(t => t.sessionId);
    if (generatingIds.length > 0) {
      setClearedStatuses(prev => {
        const next = new Set(prev);
        generatingIds.forEach(id => next.delete(id));
        return next;
      });
    }
  }, [tabs]);

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
  }, []);

  const handleDragOver = useCallback((e: DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (dropIndex: number) => {
      const fromIndex = dragIndexRef.current;
      if (fromIndex === null || fromIndex === dropIndex || !onReorderTabs) {
        dragIndexRef.current = null;
        setDragOverIndex(null);
        return;
      }

      const reordered = [...tabs];
      const [moved] = reordered.splice(fromIndex, 1);
      if (moved) {
        reordered.splice(dropIndex, 0, moved);
        onReorderTabs(reordered);
      }
      dragIndexRef.current = null;
      setDragOverIndex(null);
    },
    [tabs, onReorderTabs]
  );

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  return (
    <Flex
      direction="column"
      flexShrink={0}
      data-testid="session-tab-bar"
    >
      <style>{tabPulseStyle}</style>
      <Flex
        align="center"
        gap="2"
        bg="transparent"
        borderBottom="1px solid var(--border-subtle)"
        px="4"
        py="2"
        minH="44px"
      >
        <HStack gap="2" flex="1" minW={0} overflow="auto" css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          {tabs.map((tab, index) => {
            const isActive = tab.sessionId === activeTabId;
            const isDragOver = dragOverIndex === index;
            const effectiveStatus = clearedStatuses.has(tab.sessionId) ? 'idle' : (tab.status ?? 'idle');
            return (
              <HStack
                key={tab.sessionId}
                gap="0"
                align="center"
                px="3"
                py="1.5"
                cursor="pointer"
                bg={isActive ? 'var(--surface-1)' : 'transparent'}
                rounded="6px 6px 0 0"
                borderBottom={
                  effectiveStatus === 'generating'
                    ? '2px solid var(--accent)'
                    : effectiveStatus === 'success'
                    ? '2px solid var(--status-success, #38a169)'
                    : effectiveStatus === 'error'
                    ? '2px solid var(--status-error, #e53e3e)'
                    : isActive
                    ? '2px solid var(--accent)'
                    : '2px solid transparent'
                }
                animation={effectiveStatus === 'generating' ? 'tabPulse 1.2s ease-in-out infinite' : undefined}
                borderLeft={isDragOver ? '2px solid var(--accent)' : '2px solid transparent'}
                _hover={{ bg: isActive ? 'var(--surface-1)' : 'rgba(128, 128, 128, 0.08)' }}
                transition="all 80ms ease"
                onClick={() => {
                  setClearedStatuses((prev) => new Set(prev).add(tab.sessionId));
                  onSelectTab(tab.sessionId);
                }}
                maxW="200px"
                minW="0"
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                data-testid={`session-tab-${tab.sessionId}`}
              >
                <Text
                  fontSize="xs"
                  fontWeight={isActive ? '700' : '500'}
                  color={isActive ? 'var(--text-primary)' : 'var(--text-muted)'}
                  lineClamp={1}
                  flex="1"
                  minW={0}
                  userSelect="none"
                >
                  {tab.title || 'New chat'}
                </Text>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  minW={0}
                  px="1"
                  py="0"
                  ml="1"
                  rounded="8px"
                  fontSize="xs"
                  color="var(--text-muted)"
                  _hover={{ color: 'var(--text-primary)', bg: 'var(--surface-accent)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.sessionId);
                  }}
                  aria-label={`Close ${tab.title}`}
                >
                  ×
                </Button>
              </HStack>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            minW={0}
            px="2"
            py="1"
            rounded="8px"
            fontSize="sm"
            color="var(--text-muted)"
            _hover={{ color: 'var(--text-primary)', bg: 'var(--surface-accent)' }}
            onClick={onNewTab}
            aria-label="New tab"
          >
            +
          </Button>
        </HStack>
        {rightContent ? (
          <HStack gap="2" flexShrink={0} pl="3">
            {rightContent}
          </HStack>
        ) : null}
      </Flex>
    </Flex>
  );
}
