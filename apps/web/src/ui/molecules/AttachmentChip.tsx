import { Box, HStack, Text, chakra } from '@chakra-ui/react';
import type { PendingUpload } from '../../hooks/use-file-upload-queue';
import type { FileRef } from '../../lib/api';

const ChakraButton = chakra('button');

const KIND_ICONS: Record<string, string> = {
  image: '🖼',
  audio: '🎵',
  video: '🎬',
  pdf: '📄',
  text: '📝',
  code: '💻',
  spreadsheet: '📊',
  archive: '🗜',
  document: '📃',
  unknown: '📎'
};

function kindIcon(kind: string): string {
  return KIND_ICONS[kind] ?? '📎';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const Svg = chakra('svg');

function CloseIcon() {
  return (
    <Svg viewBox="0 0 16 16" boxSize="3" fill="none" aria-hidden="true" color="currentColor" flexShrink={0}>
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function PendingAttachmentChip({
  item,
  onRemove
}: {
  item: PendingUpload;
  onRemove: () => void;
}) {
  const icon = kindIcon('unknown');
  const isError = item.status === 'error';
  const isDone = item.status === 'done';

  return (
    <HStack
      gap="1.5"
      px="2"
      py="1"
      rounded="8px"
      bg={isError ? 'var(--status-error-surface)' : 'var(--surface-3)'}
      border="1px solid"
      borderColor={isError ? 'var(--status-error)' : 'var(--border-subtle)'}
      maxW="160px"
      position="relative"
      overflow="hidden"
    >
      {!isDone && !isError && (
        <Box
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          bg="var(--accent)"
          opacity={0.15}
          width={`${item.percent}%`}
          transition="width 200ms linear"
          pointerEvents="none"
        />
      )}
      <Text fontSize="xs" flexShrink={0}>{icon}</Text>
      <Text fontSize="xs" color={isError ? 'var(--status-error)' : 'var(--text-primary)'} truncate flex="1" minW={0}>
        {item.file.name}
      </Text>
      {!isDone && !isError && (
        <Text fontSize="xs" color="var(--text-muted)" flexShrink={0}>{item.percent}%</Text>
      )}
      <ChakraButton
        type="button"
        aria-label="Remove attachment"
        color="var(--text-muted)"
        _hover={{ color: 'var(--text-primary)' }}
        flexShrink={0}
        background="none"
        border="none"
        p={0}
        cursor="pointer"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
      >
        <CloseIcon />
      </ChakraButton>
    </HStack>
  );
}

export function PersistedAttachmentCard({ ref: fileRef }: { ref: FileRef }) {
  const icon = kindIcon(fileRef.kind);

  return (
    <HStack
      gap="1.5"
      px="2"
      py="1"
      rounded="8px"
      bg="var(--surface-3)"
      border="1px solid var(--border-subtle)"
      maxW="200px"
    >
      <Text fontSize="xs" flexShrink={0}>{icon}</Text>
      <Box flex="1" minW={0}>
        <Text fontSize="xs" color="var(--text-primary)" truncate>{fileRef.filename}</Text>
        <Text fontSize="xs" color="var(--text-muted)">{formatBytes(fileRef.size)}</Text>
      </Box>
    </HStack>
  );
}
