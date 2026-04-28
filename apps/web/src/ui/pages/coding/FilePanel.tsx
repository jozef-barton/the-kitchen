import { Box, Button, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import type { JobFileSummaryEntry } from '../../../lib/coding-api';

// ── Session summary mode ──────────────────────────────────────────────────────

interface SessionSummaryProps {
  files: JobFileSummaryEntry[];
  onSelectFile: (entry: JobFileSummaryEntry) => void;
}

function SessionSummary({ files, onSelectFile }: SessionSummaryProps) {
  if (files.length === 0) {
    return <Text fontSize="13px" color="var(--text-muted)" px="4" py="3">No files changed in this session.</Text>;
  }
  return (
    <VStack align="stretch" gap="1" px="4" py="3">
      {files.map(f => {
        const name = f.path.split('/').pop() ?? f.path;
        return (
          <Box
            key={f.path}
            p="2" rounded="var(--radius-control)"
            cursor="pointer"
            _hover={{ bg: 'var(--surface-hover)' }}
            onClick={() => onSelectFile(f)}
          >
            <HStack justify="space-between" gap="2">
              <VStack align="start" gap="0" minW={0}>
                <Text fontSize="13px" fontWeight="500" color="var(--text-primary)" truncate>{name}</Text>
                <Text fontSize="11px" color="var(--text-muted)" fontFamily="ui-monospace,monospace" truncate maxW="280px">{f.path}</Text>
              </VStack>
              <HStack gap="1" flexShrink={0}>
                {f.isNewFile && <Text fontSize="10px" color="var(--status-success)" bg="rgba(34,197,94,0.12)" px="1.5" rounded="3px">new</Text>}
                {f.linesAdded > 0 && <Text fontSize="11px" fontWeight="600" color="var(--status-success)">+{f.linesAdded}</Text>}
                {f.linesRemoved > 0 && <Text fontSize="11px" fontWeight="600" color="var(--status-danger)">−{f.linesRemoved}</Text>}
              </HStack>
            </HStack>
            <Text fontSize="10px" color="var(--text-muted)" mt="0.5">{f.edits} edit{f.edits !== 1 ? 's' : ''}</Text>
          </Box>
        );
      })}
    </VStack>
  );
}

// ── File content view ─────────────────────────────────────────────────────────

function FileContent({ content, truncated }: { content: string; truncated?: boolean }) {
  const lines = content.split('\n');
  return (
    <Box flex="1" minH={0} overflow="auto" fontFamily="ui-monospace,monospace" fontSize="12px" lineHeight="1.6">
      {truncated && (
        <Box px="3" py="1.5" bg="var(--surface-warning)" borderBottom="1px solid var(--status-warning)">
          <Text fontSize="11px" color="var(--status-warning)">File truncated at 100 KB</Text>
        </Box>
      )}
      {lines.map((line, i) => (
        <Box key={i} display="flex" px="0" _hover={{ bg: 'var(--surface-2)' }}>
          <Text
            flexShrink={0}
            w="10"
            textAlign="right"
            pr="3"
            color="var(--text-muted)"
            userSelect="none"
            fontSize="11px"
            lineHeight="1.6"
          >
            {i + 1}
          </Text>
          <Text color="var(--text-primary)" whiteSpace="pre" flex="1" minW={0}>{line}</Text>
        </Box>
      ))}
    </Box>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export type FilePanelMode =
  | { kind: 'file'; path: string; content: string | null; truncated?: boolean }
  | { kind: 'session_summary'; files: JobFileSummaryEntry[] };

interface FilePanelProps {
  mode: FilePanelMode | null; // null = closed
  loading?: boolean;
  onClose: () => void;
  onOpenFile?: (entry: JobFileSummaryEntry) => void;
}

export function FilePanel({ mode, loading, onClose, onOpenFile }: FilePanelProps) {
  if (!mode) return null;

  const title = mode.kind === 'file'
    ? (mode.path.split('/').pop() ?? mode.path)
    : 'Session files';

  const subtitle = mode.kind === 'file' ? mode.path : `${(mode as { files: JobFileSummaryEntry[] }).files.length} files changed`;

  return (
    // Backdrop
    <Box
      position="fixed" inset={0} zIndex={80}
      bg="rgba(0,0,0,0.15)"
      onClick={onClose}
    >
      {/* Panel */}
      <Box
        position="absolute" top={0} right={0} bottom={0}
        w={{ base: '100%', md: '480px' }}
        bg="var(--surface-1)"
        borderLeft="1px solid var(--border-subtle)"
        display="flex" flexDirection="column"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <HStack px="4" py="3" borderBottom="1px solid var(--divider)" flexShrink={0} gap="3">
          <VStack align="start" gap="0" flex="1" minW={0}>
            <Text fontSize="14px" fontWeight="600" color="var(--text-primary)" truncate>{title}</Text>
            <Text fontSize="11px" color="var(--text-muted)" fontFamily={mode.kind === 'file' ? 'ui-monospace,monospace' : undefined} truncate maxW="360px">
              {subtitle}
            </Text>
          </VStack>
          <HStack gap="1" flexShrink={0}>
            <Button
              size="xs" h="6" px="2"
              variant="outline"
              color="var(--text-muted)"
              borderColor="var(--border-subtle)"
              _hover={{ bg: 'var(--surface-hover)' }}
              rounded="var(--radius-control)"
              disabled
              title="Coming in Phase 3"
            >
              Open in editor
            </Button>
            <Button
              size="xs" h="6" w="6" p="0" minW={0}
              variant="ghost"
              color="var(--text-muted)"
              _hover={{ color: 'var(--text-primary)', bg: 'var(--surface-hover)' }}
              onClick={onClose}
            >
              ✕
            </Button>
          </HStack>
        </HStack>

        {/* Body */}
        {loading ? (
          <Box flex="1" display="flex" alignItems="center" justifyContent="center">
            <Spinner size="sm" color="var(--text-muted)" />
          </Box>
        ) : mode.kind === 'session_summary' ? (
          <Box flex="1" minH={0} overflow="auto">
            <SessionSummary
              files={mode.files}
              onSelectFile={(entry) => onOpenFile?.(entry)}
            />
          </Box>
        ) : mode.kind === 'file' ? (
          mode.content == null ? (
            <Box flex="1" display="flex" alignItems="center" justifyContent="center">
              <Text fontSize="13px" color="var(--text-muted)">File content unavailable</Text>
            </Box>
          ) : (
            <FileContent content={mode.content} truncated={mode.truncated} />
          )
        ) : null}
      </Box>
    </Box>
  );
}
