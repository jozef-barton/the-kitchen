import { useState } from 'react';
import { Box, Button, HStack, Text } from '@chakra-ui/react';
import type { JobEvent } from '../../../../lib/coding-api';
import { FileDiffCard } from './FileDiffCard';

type CallEvent = Extract<JobEvent, { type: 'job.tool_call' }>;
type ResultEvent = Extract<JobEvent, { type: 'job.tool_result' }>;

const FILE_TOOLS = /^(write|edit|str_replace_editor|multiedit|multi_edit)$/i;

function toolIcon(name: string): string {
  if (/^(write)$/i.test(name)) return '📝';
  if (/^(edit|str_replace_editor)$/i.test(name)) return '✏️';
  if (/^bash$/i.test(name)) return '🔧';
  if (/^read$/i.test(name)) return '📖';
  if (/^glob$/i.test(name)) return '🔍';
  if (/^grep$/i.test(name)) return '🔎';
  if (/^task$/i.test(name)) return '📋';
  if (/^(multiedit|multi_edit)$/i.test(name)) return '📋';
  return '⚙️';
}

function toolSummary(name: string, input: Record<string, unknown>): string {
  if (/^write$/i.test(name) && input.file_path) {
    const size = input.contentLength
      ? ` · ${Math.round((input.contentLength as number) / 1024 * 10) / 10} KB`
      : '';
    return String(input.file_path).split('/').pop() + size;
  }
  if (/^(edit|str_replace_editor)$/i.test(name) && (input.file_path || input.path)) {
    const fp = (input.file_path ?? input.path) as string;
    const oldLen = (input.oldLength as number | undefined) ?? ((input.old_string as string | undefined) ?? '').length;
    const newLen = (input.newLength as number | undefined) ?? ((input.new_string as string | undefined) ?? '').length;
    return `${fp.split('/').pop()} · -${oldLen} +${newLen}`;
  }
  if (/^bash$/i.test(name)) {
    const cmd = String(input.command ?? '').slice(0, 60);
    return cmd + (String(input.command ?? '').length > 60 ? '…' : '');
  }
  if (/^read$/i.test(name) && input.file_path) return String(input.file_path).split('/').pop() ?? '';
  if (/^glob$/i.test(name) && input.pattern) return String(input.pattern);
  if (/^grep$/i.test(name) && input.pattern) return String(input.pattern);
  return JSON.stringify(input).slice(0, 60);
}

export function ToolPairRow({
  call,
  result,
  onOpenFile,
  jobIsLive,
  isLatestFileTool,
  onAnimationComplete,
}: {
  call: CallEvent;
  result?: ResultEvent;
  onOpenFile?: (filePath: string) => void;
  jobIsLive?: boolean;
  isLatestFileTool?: boolean;
  onAnimationComplete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const callEvent = call as unknown as { toolName: string; input: Record<string, unknown>; toolUseId: string };
  const pending = !result;
  const resultEvent = result as unknown as { isError?: boolean; content?: string } | undefined;
  const isError = resultEvent?.isError === true;
  const content = resultEvent?.content ?? '';

  // File-modifying tools get the diff card treatment
  if (FILE_TOOLS.test(callEvent.toolName)) {
    return (
      <Box>
        <FileDiffCard call={call} onOpenFile={onOpenFile} jobIsLive={jobIsLive} isLatestFileTool={isLatestFileTool} onAnimationComplete={onAnimationComplete} />
        {/* Status line below the diff card */}
        <Box px="2" pt="1">
          {pending
            ? <Text fontSize="11px" color="var(--text-muted)">⋯ running…</Text>
            : isError
              ? <Text fontSize="11px" color="var(--status-danger)">✗ {content.slice(0, 120)}</Text>
              : null
          }
        </Box>
      </Box>
    );
  }

  // All other tools — original collapsible card
  const icon = toolIcon(callEvent.toolName);
  const summary = toolSummary(callEvent.toolName, callEvent.input);

  return (
    <Box rounded="var(--radius-control)" border="1px solid var(--border-subtle)" overflow="hidden">
      <Button
        variant="ghost" w="100%" h="auto" px="3" py="2" justifyContent="space-between"
        onClick={() => setOpen(v => !v)}
        _hover={{ bg: 'var(--surface-hover)' }}
      >
        <HStack gap="2" minW={0}>
          <Text fontSize="13px" flexShrink={0}>{icon}</Text>
          <Text fontSize="12px" fontWeight="500" color="var(--text-primary)" truncate>{callEvent.toolName}</Text>
          <Text fontSize="12px" color="var(--text-muted)" truncate>· {summary}</Text>
        </HStack>
        <Text fontSize="11px" color="var(--text-muted)" flexShrink={0} ml="2">{open ? '▾' : '▸'}</Text>
      </Button>
      <Box px="3" pb="1.5" pt="1" borderTop="1px solid var(--border-subtle)" bg="var(--surface-2)">
        {pending
          ? <Text fontSize="11px" color="var(--text-muted)">⋯ running…</Text>
          : isError
            ? <Text fontSize="11px" color="var(--status-danger)">✗ {content.slice(0, 120)}</Text>
            : <Text fontSize="11px" color="var(--status-success)">✓ {content.slice(0, 80) || 'done'}</Text>
        }
      </Box>
      {open && (
        <Box px="3" py="2" bg="var(--surface-1)" borderTop="1px solid var(--border-subtle)">
          <Text fontSize="11px" color="var(--text-muted)" mb="1">Input:</Text>
          <Box bg="var(--surface-3)" rounded="4px" p="2" overflowX="auto">
            <Text fontSize="11px" fontFamily="ui-monospace, monospace" color="var(--text-primary)" whiteSpace="pre-wrap">
              {JSON.stringify(callEvent.input, null, 2).slice(0, 2000)}
            </Text>
          </Box>
          {result && (
            <>
              <Text fontSize="11px" color="var(--text-muted)" mt="2" mb="1">Result:</Text>
              <Box bg="var(--surface-3)" rounded="4px" p="2" overflowX="auto">
                <Text fontSize="11px" fontFamily="ui-monospace, monospace" color={isError ? 'var(--status-danger)' : 'var(--text-primary)'} whiteSpace="pre-wrap">
                  {content.slice(0, 2000)}
                </Text>
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
