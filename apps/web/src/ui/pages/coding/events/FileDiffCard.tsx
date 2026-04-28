import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, HStack, Text } from '@chakra-ui/react';
import type { JobEvent } from '../../../../lib/coding-api';
import { useTypewriter } from './useTypewriter';
import { enqueueAnimation, animationDone } from './typewriterQueue';

type CallEvent = Extract<JobEvent, { type: 'job.tool_call' }>;

// ── LCS diff algorithm (for static / historical view) ─────────────────────────

type DiffLine = { type: 'add' | 'remove' | 'context'; line: string };

function computeLineDiff(oldStr: string, newStr: string): DiffLine[] {
  const a = oldStr.split('\n');
  const b = newStr.split('\n');
  const m = a.length, n = b.length;

  if (m * n > 80000) {
    return [
      ...a.map(line => ({ type: 'remove' as const, line })),
      ...b.map(line => ({ type: 'add' as const, line })),
    ];
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]! + 1
        : Math.max(dp[i - 1][j]!, dp[i][j - 1]!);
    }
  }

  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'context', line: a[i - 1]! });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      result.unshift({ type: 'add', line: b[j - 1]! });
      j--;
    } else {
      result.unshift({ type: 'remove', line: a[i - 1]! });
      i--;
    }
  }
  return result;
}

const CTX = 3;
type DisplayLine = DiffLine | { type: 'hidden'; count: number };

function collapseContext(lines: DiffLine[]): DisplayLine[] {
  const keep = new Set<number>();
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.type !== 'context') {
      for (let k = Math.max(0, i - CTX); k <= Math.min(lines.length - 1, i + CTX); k++) keep.add(k);
    }
  }
  const out: DisplayLine[] = [];
  let hiddenStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (keep.has(i)) {
      if (hiddenStart >= 0) {
        const count = i - hiddenStart;
        if (count > 1) out.push({ type: 'hidden', count });
        else out.push(lines[hiddenStart]!);
        hiddenStart = -1;
      }
      out.push(lines[i]!);
    } else {
      if (hiddenStart < 0) hiddenStart = i;
    }
  }
  if (hiddenStart >= 0) {
    const count = lines.length - hiddenStart;
    if (count > 1) out.push({ type: 'hidden', count });
    else out.push(lines[hiddenStart]!);
  }
  return out;
}

// ── Data model ────────────────────────────────────────────────────────────────

type DiffData =
  | { kind: 'edit'; filePath: string; lines: DiffLine[]; linesAdded: number; linesRemoved: number; oldStr: string; newStr: string }
  | { kind: 'new_file'; filePath: string; content: string; lineCount: number; truncated?: boolean }
  | { kind: 'multi_edit'; filePath: string; sections: Array<{ lines: DiffLine[]; linesAdded: number; linesRemoved: number; oldStr: string; newStr: string }> }
  | { kind: 'unavailable'; filePath: string; reason: string };

function computeDiffData(call: CallEvent): DiffData {
  const ev = call as unknown as { toolName: string; input: Record<string, unknown> };
  const name = ev.toolName;
  const input = ev.input ?? {};
  const filePath = ((input.file_path ?? input.path) as string | undefined) ?? '(unknown)';

  if (/^write$/i.test(name)) {
    // Use contentPreview as fallback when content was truncated by the agent's 3500-byte limit
    const content = (input.content as string) ?? (input.contentPreview as string) ?? '';
    const truncated = !!(input._truncated) && !input.content;
    return { kind: 'new_file', filePath, content, lineCount: content ? content.split('\n').length : 0, truncated };
  }

  if (/^(edit|str_replace_editor)$/i.test(name)) {
    const oldStr = (input.old_string as string) ?? '';
    const newStr = (input.new_string as string) ?? '';
    if (!oldStr && !newStr) return { kind: 'unavailable', filePath, reason: 'Content too large to display' };
    const lines = computeLineDiff(oldStr, newStr);
    return {
      kind: 'edit', filePath, lines,
      linesAdded: lines.filter(l => l.type === 'add').length,
      linesRemoved: lines.filter(l => l.type === 'remove').length,
      oldStr, newStr,
    };
  }

  if (/^(multiedit|multi_edit)$/i.test(name)) {
    const edits = (input.edits as Array<Record<string, unknown>>) ?? [];
    const sections = edits.map(e => {
      const oldStr = (e.old_string as string) ?? '';
      const newStr = (e.new_string as string) ?? '';
      const lines = computeLineDiff(oldStr, newStr);
      return { lines, linesAdded: lines.filter(l => l.type === 'add').length, linesRemoved: lines.filter(l => l.type === 'remove').length, oldStr, newStr };
    });
    return { kind: 'multi_edit', filePath, sections };
  }

  return { kind: 'unavailable', filePath, reason: 'Not a file-modifying tool' };
}

function totalChangedLines(data: DiffData): number {
  if (data.kind === 'new_file') return data.lineCount;
  if (data.kind === 'edit') return data.linesAdded + data.linesRemoved;
  if (data.kind === 'multi_edit') return data.sections.reduce((s, e) => s + e.linesAdded + e.linesRemoved, 0);
  return 0;
}

// ── Static rendering (historical / post-animation) — always instantly visible ─

function StaticDiffBody({ lines }: { lines: DiffLine[] }) {
  const display = collapseContext(lines);
  let lineNum = 1;
  return (
    <Box fontFamily="ui-monospace,monospace" fontSize="11px" lineHeight="1.6" overflow="auto" maxH="min(500px,60vh)">
      {display.map((item, idx) => {
        if (item.type === 'hidden') {
          return (
            <Box key={idx} px="3" py="0.5" bg="var(--surface-2)" opacity={0.7}>
              <Text color="var(--text-muted)" fontSize="10px">⋯ {item.count} unchanged lines</Text>
            </Box>
          );
        }
        const ln = lineNum++;
        const bg = item.type === 'add' ? 'rgba(34,197,94,0.12)' : item.type === 'remove' ? 'rgba(239,68,68,0.12)' : 'transparent';
        const fg = item.type === 'add' ? 'var(--status-success)' : item.type === 'remove' ? 'var(--status-danger)' : 'var(--text-secondary)';
        const pfx = item.type === 'add' ? '+' : item.type === 'remove' ? '−' : ' ';
        return (
          <Box key={idx} display="flex" bg={bg} minW={0}>
            <Text flexShrink={0} w="8" textAlign="right" pr="2" color="var(--text-muted)" userSelect="none" fontSize="10px" lineHeight="1.6">{ln}</Text>
            <Text flexShrink={0} w="4" color={fg} userSelect="none">{pfx}</Text>
            <Text color={fg} whiteSpace="pre" overflowX="auto" flex="1" minW={0}>{item.line}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

function StaticNewFileBody({ content }: { content: string; truncated?: boolean }) {
  const lines = content.split('\n');
  return (
    <Box fontFamily="ui-monospace,monospace" fontSize="11px" lineHeight="1.6" overflow="auto" maxH="min(500px,60vh)">
      {lines.map((line, i) => (
        <Box key={i} display="flex" bg="rgba(34,197,94,0.08)">
          <Text flexShrink={0} w="8" textAlign="right" pr="2" color="var(--text-muted)" userSelect="none" fontSize="10px" lineHeight="1.6">{i + 1}</Text>
          <Text flexShrink={0} w="4" color="var(--status-success)" userSelect="none">+</Text>
          <Text color="var(--text-secondary)" whiteSpace="pre" overflowX="auto" flex="1" minW={0}>{line}</Text>
        </Box>
      ))}
    </Box>
  );
}

// ── Live typewriter bodies ────────────────────────────────────────────────────

/** Shared scroll container for animated bodies — keeps cursor in view */
function useAutoScroll(trigger: string) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const userScrolled = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      userScrolled.current = (el.scrollHeight - el.scrollTop - el.clientHeight) > 40;
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (userScrolled.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < 60) el.scrollTop = el.scrollHeight;
  }, [trigger]);

  return scrollRef;
}

/** Typewriter body for Write (new file) */
function LiveWriteBody({ content, onDone }: { content: string; onDone: () => void }) {
  const { displayText, isComplete } = useTypewriter({
    text: content,
    enabled: true,
    onComplete: onDone,
  });
  const scrollRef = useAutoScroll(displayText);

  return (
    <Box
      ref={scrollRef}
      fontFamily="ui-monospace,monospace" fontSize="11px" lineHeight="1.6"
      overflow="auto" maxH="min(500px,60vh)"
      p="2" bg="rgba(34,197,94,0.05)"
    >
      <Text whiteSpace="pre" color="var(--status-success)">
        {displayText}
        {!isComplete && <span className="typewriter-cursor" />}
      </Text>
    </Box>
  );
}

/** Typewriter body for Edit: instant red, then typed green */
function LiveEditBody({ oldStr, newStr, onDone }: { oldStr: string; newStr: string; onDone: () => void }) {
  const [phase, setPhase] = useState<'old' | 'new'>('old');

  useEffect(() => {
    const t = setTimeout(() => setPhase('new'), 200);
    return () => clearTimeout(t);
  }, []);

  const { displayText, isComplete } = useTypewriter({
    text: newStr,
    enabled: phase === 'new',
    onComplete: onDone,
  });
  const scrollRef = useAutoScroll(displayText);

  return (
    <Box ref={scrollRef} fontFamily="ui-monospace,monospace" fontSize="11px" lineHeight="1.6" overflow="auto" maxH="min(500px,60vh)">
      {/* Old string — instant red */}
      <Box bg="rgba(239,68,68,0.10)" p="2" pb="1">
        <Text whiteSpace="pre" color="var(--status-danger)">{oldStr}</Text>
      </Box>
      {/* New string — typed green */}
      {phase === 'new' && (
        <Box bg="rgba(34,197,94,0.10)" p="2" pt="1">
          <Text whiteSpace="pre" color="var(--status-success)">
            {displayText}
            {!isComplete && <span className="typewriter-cursor" />}
          </Text>
        </Box>
      )}
    </Box>
  );
}

/** Typewriter body for MultiEdit: hunks play sequentially */
function LiveMultiEditBody({ sections, onDone }: {
  sections: Array<{ oldStr: string; newStr: string }>;
  onDone: () => void;
}) {
  const [currentHunk, setCurrentHunk] = useState(0);
  const [completedHunks, setCompletedHunks] = useState<number[]>([]);

  const handleHunkDone = useCallback((idx: number) => {
    setCompletedHunks(prev => [...prev, idx]);
    if (idx < sections.length - 1) {
      setTimeout(() => setCurrentHunk(idx + 1), 150);
    } else {
      onDone();
    }
  }, [sections.length, onDone]);

  return (
    <Box fontFamily="ui-monospace,monospace" fontSize="11px" lineHeight="1.6" overflow="auto" maxH="min(500px,60vh)">
      {sections.map((s, i) => (
        <Box key={i} borderTop={i > 0 ? '1px dashed var(--border-subtle)' : undefined}>
          {completedHunks.includes(i) ? (
            // Already done — show final state
            <>
              <Box bg="rgba(239,68,68,0.10)" p="2" pb="1">
                <Text whiteSpace="pre" color="var(--status-danger)">{s.oldStr}</Text>
              </Box>
              <Box bg="rgba(34,197,94,0.10)" p="2" pt="1">
                <Text whiteSpace="pre" color="var(--status-success)">{s.newStr}</Text>
              </Box>
            </>
          ) : i === currentHunk ? (
            <LiveEditBody oldStr={s.oldStr} newStr={s.newStr} onDone={() => handleHunkDone(i)} />
          ) : null /* not started yet */}
        </Box>
      ))}
    </Box>
  );
}

// ── Diff stat ─────────────────────────────────────────────────────────────────

function DiffStat({ added, removed }: { added: number; removed: number }) {
  return (
    <HStack gap="1" flexShrink={0}>
      {added > 0 && <Text fontSize="11px" fontWeight="600" color="var(--status-success)">+{added}</Text>}
      {removed > 0 && <Text fontSize="11px" fontWeight="600" color="var(--status-danger)">−{removed}</Text>}
    </HStack>
  );
}

function toolIcon(name: string) {
  if (/^write$/i.test(name)) return '📝';
  if (/^(edit|str_replace_editor)$/i.test(name)) return '✏️';
  if (/^(multiedit|multi_edit)$/i.test(name)) return '📋';
  return '⚙️';
}

// ── Main FileDiffCard ─────────────────────────────────────────────────────────

interface FileDiffCardProps {
  call: CallEvent;
  onOpenFile?: (filePath: string) => void;
  jobIsLive?: boolean;
  isLatestFileTool?: boolean;
  /** Called when the typewriter animation fully completes — signals downstream content can appear */
  onAnimationComplete?: () => void;
}

export function FileDiffCard({ call, onOpenFile, jobIsLive, isLatestFileTool, onAnimationComplete }: FileDiffCardProps) {
  const ev = call as unknown as { toolName: string; input: Record<string, unknown>; toolUseId: string; jobId: string };
  const sessionKey = `coding:animated:${ev.jobId}:${ev.toolUseId}`;

  // ── Determine animation mode — computed ONCE at mount ──
  const animMode = useRef<'animate' | 'instant' | null>(null);
  if (animMode.current === null) {
    const alreadyDone = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(sessionKey) !== null;
    if (!alreadyDone && jobIsLive && isLatestFileTool) {
      animMode.current = 'animate';
    } else {
      if (!alreadyDone) {
        try { sessionStorage.setItem(sessionKey, '1'); } catch { /* ignore */ }
      }
      animMode.current = 'instant';
    }
  }

  const shouldAnimate = animMode.current === 'animate';

  const data = useMemo(() => computeDiffData(call), [call]);
  const defaultOpen = shouldAnimate ? false : totalChangedLines(data) <= (data.kind === 'new_file' ? 50 : 30);

  const [expanded, setExpanded] = useState(defaultOpen);
  const [animStarted, setAnimStarted] = useState(false);
  const [animDone, setAnimDone] = useState(!shouldAnimate);

  // ── Enqueue animation when this card mounts as the live card ──
  useEffect(() => {
    if (!shouldAnimate) return;
    let unmounted = false;
    const cancel = enqueueAnimation(() => {
      if (unmounted) { animationDone(); return; }
      // It's our turn — open the drawer and start typing
      setExpanded(true);
      setAnimStarted(true);
    });
    return () => { unmounted = true; cancel(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- animation mode is intentionally fixed at mount; shouldAnimate is derived from a ref

  function markDone() {
    try { sessionStorage.setItem(sessionKey, '1'); } catch { /* ignore */ }
    setAnimDone(true);
    animationDone();
    onAnimationComplete?.();
  }

  function handleToggle() {
    if (shouldAnimate && animStarted && !animDone) {
      // User collapsed mid-animation — cancel cleanly
      markDone();
    }
    setExpanded(v => !v);
  }

  const showLive = shouldAnimate && animStarted && !animDone && expanded;
  const fileName = data.filePath.split('/').pop() ?? data.filePath;

  return (
    <Box
      id={`diff-${ev.toolUseId}`}
      rounded="var(--radius-control)"
      border="1px solid var(--border-subtle)"
      overflow="hidden"
      bg="var(--surface-1)"
    >
      {/* Header */}
      <HStack
        px="3" py="2"
        justify="space-between"
        bg="var(--surface-2)"
        cursor="pointer"
        _hover={{ bg: 'var(--surface-hover)' }}
        onClick={handleToggle}
        gap="2"
      >
        <HStack gap="2" minW={0} flex="1">
          <Text fontSize="13px" flexShrink={0}>{toolIcon(ev.toolName)}</Text>
          <Text fontSize="12px" fontWeight="500" color="var(--text-secondary)" flexShrink={0}>{ev.toolName}</Text>
          <Text
            fontSize="12px" color="var(--accent)" truncate
            _hover={{ textDecoration: 'underline' }}
            onClick={e => { e.stopPropagation(); onOpenFile?.(data.filePath); }}
          >
            {fileName}
          </Text>
        </HStack>
        <HStack gap="2" flexShrink={0}>
          {data.kind === 'edit' && <DiffStat added={data.linesAdded} removed={data.linesRemoved} />}
          {data.kind === 'multi_edit' && <DiffStat added={data.sections.reduce((s, e) => s + e.linesAdded, 0)} removed={data.sections.reduce((s, e) => s + e.linesRemoved, 0)} />}
          {data.kind === 'new_file' && <Text fontSize="11px" color="var(--text-muted)">New · {data.lineCount} lines</Text>}
          <Button
            size="xs" variant="ghost" h="5" w="5" p="0" minW={0}
            color="var(--text-muted)" _hover={{ color: 'var(--text-primary)', bg: 'transparent' }}
            onClick={e => { e.stopPropagation(); onOpenFile?.(data.filePath); }}
            title="View full file"
          >⊞</Button>
          <Text fontSize="11px" color="var(--text-muted)">{expanded ? '▾' : '▸'}</Text>
        </HStack>
      </HStack>

      {/* Body */}
      {expanded && (
        <Box borderTop="1px solid var(--border-subtle)">
          {showLive ? (
            // ── Live typewriter rendering ──
            <>
              {data.kind === 'new_file' && (
                <LiveWriteBody content={data.content} onDone={markDone} />
              )}
              {data.kind === 'edit' && (
                <LiveEditBody oldStr={data.oldStr} newStr={data.newStr} onDone={markDone} />
              )}
              {data.kind === 'multi_edit' && (
                <LiveMultiEditBody
                  sections={data.sections.map(s => ({ oldStr: s.oldStr, newStr: s.newStr }))}
                  onDone={markDone}
                />
              )}
              {data.kind === 'unavailable' && (
                <Box px="3" py="2"><Text fontSize="11px" color="var(--text-muted)">{data.reason}</Text></Box>
              )}
            </>
          ) : (
            // ── Static rendering (historical or post-animation reopen) ──
            <>
              {data.kind === 'edit' && <StaticDiffBody lines={data.lines} />}
              {data.kind === 'new_file' && <StaticNewFileBody content={data.content} truncated={data.truncated} />}
              {data.kind === 'multi_edit' && data.sections.map((section, i) => (
                <Box key={i} borderTop={i > 0 ? '1px dashed var(--border-subtle)' : undefined}>
                  <StaticDiffBody lines={section.lines} />
                </Box>
              ))}
              {data.kind === 'unavailable' && (
                <Box px="3" py="2"><Text fontSize="11px" color="var(--text-muted)">{data.reason}</Text></Box>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
