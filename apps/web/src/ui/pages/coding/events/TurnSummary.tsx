import { useEffect, useRef, useState } from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import type { TurnCallEntry } from '../buildConversationItems';

// ── Summary line aggregation ──────────────────────────────────────────────────

interface SummaryLine {
  icon: string;
  text: string;
  addedLines?: number;
  removedLines?: number;
}

function buildSummaryLines(calls: TurnCallEntry[]): SummaryLine[] {
  const lines: SummaryLine[] = [];

  // Writes: one line per unique file
  const writes = calls.filter(c => /^write$/i.test(c.toolName));
  const writtenFiles = new Map<string, true>();
  for (const w of writes) {
    const fp = ((w.input.file_path ?? w.input.path) as string | undefined) ?? '(unknown)';
    if (!writtenFiles.has(fp)) {
      writtenFiles.set(fp, true);
      lines.push({ icon: '📝', text: `Created ${fp.split('/').pop() ?? fp}` });
    }
  }

  // Edits: aggregate per file across all edit tool calls
  const editCalls = calls.filter(c => /^(edit|str_replace_editor|multiedit|multi_edit)$/i.test(c.toolName));
  const editsByFile = new Map<string, { added: number; removed: number }>();
  for (const ec of editCalls) {
    const fp = ((ec.input.file_path ?? ec.input.path) as string | undefined) ?? '(unknown)';
    if (/^(multiedit|multi_edit)$/i.test(ec.toolName)) {
      // MultiEdit: each entry in the edits array
      const edits = (ec.input.edits as Array<Record<string, unknown>>) ?? [];
      for (const edit of edits) {
        const efp = ((edit.file_path as string | undefined) ?? fp);
        const old = (edit.old_string as string) ?? '';
        const nw = (edit.new_string as string) ?? '';
        const ex = editsByFile.get(efp) ?? { added: 0, removed: 0 };
        editsByFile.set(efp, { added: ex.added + nw.split('\n').length, removed: ex.removed + old.split('\n').length });
      }
    } else {
      const old = (ec.input.old_string as string) ?? '';
      const nw = (ec.input.new_string as string) ?? '';
      const ex = editsByFile.get(fp) ?? { added: 0, removed: 0 };
      editsByFile.set(fp, { added: ex.added + nw.split('\n').length, removed: ex.removed + old.split('\n').length });
    }
  }
  for (const [fp, stats] of editsByFile) {
    lines.push({ icon: '✏️', text: `Edited ${fp.split('/').pop() ?? fp}`, addedLines: stats.added, removedLines: stats.removed });
  }

  // Bash: ≤3 individual, >3 collapsed
  const bashes = calls.filter(c => /^bash$/i.test(c.toolName));
  if (bashes.length > 0 && bashes.length <= 3) {
    for (const b of bashes) {
      const raw = (b.input.command as string) ?? '';
      const cmd = raw.length > 60 ? raw.slice(0, 60) + '…' : raw;
      lines.push({ icon: '🔧', text: `Ran ${cmd}` });
    }
  } else if (bashes.length > 3) {
    lines.push({ icon: '🔧', text: `Ran ${bashes.length} commands` });
  }

  // Read / Grep / Glob — collapse all into one line
  const readLike = calls.filter(c => /^(read|glob|grep)$/i.test(c.toolName));
  if (readLike.length > 0) {
    const reads = readLike.filter(r => /^read$/i.test(r.toolName));
    const searches = readLike.filter(r => /^(glob|grep)$/i.test(r.toolName));
    if (reads.length > 0 && searches.length === 0) {
      lines.push({ icon: '📖', text: `Read ${reads.length} file${reads.length !== 1 ? 's' : ''}` });
    } else if (searches.length > 0 && reads.length === 0) {
      lines.push({ icon: '🔎', text: `Searched ${searches.length} time${searches.length !== 1 ? 's' : ''}` });
    } else {
      lines.push({ icon: '🔎', text: `Read and searched (${readLike.length} calls)` });
    }
  }

  // Anything else
  const known = /^(write|edit|str_replace_editor|multiedit|multi_edit|bash|read|glob|grep)$/i;
  const others = calls.filter(c => !known.test(c.toolName));
  const otherCounts = new Map<string, number>();
  for (const o of others) otherCounts.set(o.toolName, (otherCounts.get(o.toolName) ?? 0) + 1);
  for (const [name, count] of otherCounts) {
    lines.push({ icon: '🛠️', text: count === 1 ? `Used ${name}` : `Used ${name} ×${count}` });
  }

  return lines;
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ── Component ────────────────────────────────────────────────────────────────

interface TurnSummaryProps {
  jobId: string;
  turnIndex: number;
  durationMs: number;
  calls: TurnCallEntry[];
  /** messageId of the last text message in this turn — summary waits for it to finish typing */
  lastMessageId: string | null;
}

export function TurnSummary({ jobId, turnIndex, durationMs, calls, lastMessageId }: TurnSummaryProps) {
  const summaryKey = `coding:summary:${jobId}:${turnIndex}`;
  const alreadyShown = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(summaryKey) === '1';

  // Ready = the last message in this turn has finished its typewriter animation
  const [ready, setReady] = useState(() => {
    if (alreadyShown) return true;
    if (!lastMessageId) return true;
    const msgKey = `coding:animated:${jobId}:${lastMessageId}`;
    return sessionStorage.getItem(msgKey) === '1';
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll sessionStorage until the last message finishes typing
  useEffect(() => {
    if (ready || !lastMessageId) return;
    const msgKey = `coding:animated:${jobId}:${lastMessageId}`;
    intervalRef.current = setInterval(() => {
      if (sessionStorage.getItem(msgKey) === '1') {
        setReady(true);
        clearInterval(intervalRef.current!);
      }
    }, 100);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [ready, jobId, lastMessageId]);

  // Mark as shown (slightly after the fade-in completes)
  useEffect(() => {
    if (!ready || alreadyShown) return;
    const t = setTimeout(() => sessionStorage.setItem(summaryKey, '1'), 400);
    return () => clearTimeout(t);
  }, [ready, alreadyShown, summaryKey]);

  if (!ready) return null;

  const lines = buildSummaryLines(calls);
  if (lines.length === 0) return null;

  return (
    <Box
      mx="2"
      p="3"
      rounded="var(--radius-card)"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-2)"
      style={alreadyShown
        ? undefined
        : { animation: 'summary-fade-in 0.2s ease 0.15s both' }
      }
    >
      {/* Header */}
      <HStack gap="2" mb="2">
        <Text fontSize="12px" color="var(--status-success)" fontWeight="600">✓ Done</Text>
        <Text fontSize="11px" color="var(--text-secondary)">·</Text>
        <Text fontSize="11px" color="var(--text-secondary)">{formatDuration(durationMs)}</Text>
        <Text fontSize="11px" color="var(--text-secondary)">·</Text>
        <Text fontSize="11px" color="var(--text-secondary)">{lines.length} action{lines.length !== 1 ? 's' : ''}</Text>
      </HStack>

      {/* Action lines */}
      <VStack align="stretch" gap="1">
        {lines.map((line, i) => (
          <HStack key={i} gap="2" align="center">
            <Text fontSize="12px" flexShrink={0}>{line.icon}</Text>
            <Text fontSize="12px" color="var(--text-primary)" fontFamily={line.text.includes('/') ? 'ui-monospace,monospace' : undefined}>
              {line.text}
            </Text>
            {(line.addedLines !== undefined || line.removedLines !== undefined) && (
              <HStack gap="1" ml="1">
                {(line.addedLines ?? 0) > 0 && <Text fontSize="11px" fontWeight="600" color="var(--status-success)">+{line.addedLines}</Text>}
                {(line.removedLines ?? 0) > 0 && <Text fontSize="11px" fontWeight="600" color="var(--status-danger)">−{line.removedLines}</Text>}
              </HStack>
            )}
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}
