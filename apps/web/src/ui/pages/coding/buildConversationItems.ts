import type { JobEvent } from '../../../lib/coding-api';

// ── Conversation item types ───────────────────────────────────────────────────

export interface AgentInitEvent extends JobEvent { type: 'job.agent_initialized'; model: string; sessionId: string; cwd: string; toolsAvailable: string[] }
export interface ThinkingEvent extends JobEvent { type: 'job.thinking'; messageId: string; text: string }
export interface MessageEvent extends JobEvent { type: 'job.message'; messageId: string; text: string }
export interface ToolCallEvent extends JobEvent { type: 'job.tool_call'; messageId: string; toolUseId: string; toolName: string; input: Record<string, unknown> }
export interface ToolResultEvent extends JobEvent { type: 'job.tool_result'; toolUseId: string; content: string; isError: boolean }
export interface AgentResultEvent extends JobEvent { type: 'job.agent_result'; subtype: string; durationMs: number; numTurns: number }

export interface ToolPair {
  kind: 'tool_pair';
  call: ToolCallEvent;
  result?: ToolResultEvent;
}

export interface TurnFileEntry {
  path: string;
  toolUseId: string;
  toolName: string;
  linesAdded: number;
  linesRemoved: number;
  isNewFile: boolean;
}

export type ConversationItem =
  | { kind: 'init'; event: AgentInitEvent }
  | { kind: 'continuation'; prompt: string; ts: number }
  | { kind: 'thinking'; messageId: string; text: string; ts: number }
  | { kind: 'message'; messageId: string; text: string; ts: number }
  | ToolPair
  | { kind: 'raw'; text: string; isError: boolean; ts: number }
  | { kind: 'result'; event: AgentResultEvent }
  | { kind: 'user_turn'; turnId: string; turnIndex: number; text: string; ts: number }
  | { kind: 'turn_boundary'; ts: number }
  | { kind: 'turn_file_summary'; files: TurnFileEntry[]; ts: number };

// ── Conversation builder ──────────────────────────────────────────────────────

const FILE_TOOLS = /^(write|edit|str_replace_editor|multiedit|multi_edit)$/i;

export function buildConversationItems(events: JobEvent[], jobPrompts?: Map<string, string>): ConversationItem[] {
  const items: ConversationItem[] = [];
  const messageMap = new Map<string, { kind: 'thinking' | 'message'; idx: number }>();
  const toolCallMap = new Map<string, number>(); // toolUseId -> items index
  let rawBuf: { text: string; isError: boolean; ts: number } | null = null;
  let firstJobId: string | null = null;

  // Per-agent-turn file edit accumulator
  let currentTurnFiles: TurnFileEntry[] = [];

  const flushRaw = () => {
    if (rawBuf) { items.push({ kind: 'raw', ...rawBuf }); rawBuf = null; }
  };

  for (let idx = 0; idx < events.length; idx++) {
    const e = events[idx]!;

    if (e.type === 'job.agent_initialized') {
      flushRaw();
      if (firstJobId === null) {
        firstJobId = e.jobId;
        items.push({ kind: 'init', event: e as unknown as AgentInitEvent });
      } else {
        const prompt = jobPrompts?.get(e.jobId) ?? '';
        items.push({ kind: 'continuation', prompt, ts: e.ts });
      }
    } else if (e.type === 'job.thinking') {
      flushRaw();
      const ev = e as unknown as ThinkingEvent;
      const key = 't:' + ev.messageId;
      const existing = messageMap.get(key);
      if (existing) {
        (items[existing.idx] as { text: string }).text = ev.text;
      } else {
        messageMap.set(key, { kind: 'thinking', idx: items.length });
        items.push({ kind: 'thinking', messageId: ev.messageId, text: ev.text, ts: ev.ts });
      }
    } else if (e.type === 'job.message') {
      flushRaw();
      const ev = e as unknown as MessageEvent;
      const key = 'm:' + ev.messageId;
      const existing = messageMap.get(key);
      if (existing) {
        (items[existing.idx] as { text: string }).text = ev.text;
      } else {
        messageMap.set(key, { kind: 'message', idx: items.length });
        items.push({ kind: 'message', messageId: ev.messageId, text: ev.text, ts: ev.ts });
      }
    } else if (e.type === 'job.tool_call') {
      flushRaw();
      const ev = e as unknown as ToolCallEvent;
      toolCallMap.set(ev.toolUseId, items.length);
      items.push({ kind: 'tool_pair', call: ev, result: undefined });

      // Track file edits for per-turn summary
      if (FILE_TOOLS.test(ev.toolName)) {
        const input = ev.input ?? {};
        const fp = ((input.file_path ?? input.path) as string | undefined);
        if (fp) {
          const isWrite = /^write$/i.test(ev.toolName);
          const isEdit = /^(edit|str_replace_editor)$/i.test(ev.toolName);
          const oldStr = isEdit ? ((input.old_string as string | undefined) ?? '') : '';
          const newStr = isEdit ? ((input.new_string as string | undefined) ?? '') : '';
          const content = isWrite ? ((input.content as string | undefined) ?? '') : '';
          currentTurnFiles.push({
            path: fp,
            toolUseId: ev.toolUseId,
            toolName: ev.toolName,
            linesAdded: isWrite ? content.split('\n').length : (newStr ? newStr.split('\n').length : 0),
            linesRemoved: isEdit ? (oldStr ? oldStr.split('\n').length : 0) : 0,
            isNewFile: isWrite,
          });
        }
      }
    } else if (e.type === 'job.tool_result') {
      const ev = e as unknown as ToolResultEvent;
      const pairIdx = toolCallMap.get(ev.toolUseId);
      if (pairIdx !== undefined) {
        (items[pairIdx] as ToolPair).result = ev;
      }
    } else if (e.type === 'job.agent_result') {
      flushRaw();
      // Emit file summary before the result marker if any files were changed
      if (currentTurnFiles.length > 0) {
        items.push({ kind: 'turn_file_summary', files: [...currentTurnFiles], ts: e.ts });
        currentTurnFiles = [];
      }
      items.push({ kind: 'result', event: e as unknown as AgentResultEvent });
    } else if (e.type === 'job.user_turn') {
      flushRaw();
      currentTurnFiles = []; // reset for this agent turn
      const ev = e as unknown as { turnId: string; turnIndex: number; text: string; ts: number };
      items.push({ kind: 'user_turn', turnId: ev.turnId, turnIndex: ev.turnIndex, text: ev.text, ts: ev.ts });
    } else if (e.type === 'job.awaiting_user') {
      flushRaw();
      // Only show the "awaiting reply" divider if the user actually waited (gap > 3s to next turn).
      // Queued/immediate turns (sent before agent finished) get no divider.
      const nextTurn = events.slice(idx + 1).find(ev2 => ev2.type === 'job.user_turn');
      const quickTurn = nextTurn && (nextTurn.ts - e.ts) < 3000;
      if (!quickTurn) {
        items.push({ kind: 'turn_boundary', ts: e.ts });
      }
    } else if (e.type === 'job.stdout') {
      const ev = e as unknown as { chunk: string; ts: number };
      if (rawBuf && !rawBuf.isError) { rawBuf.text += ev.chunk; }
      else { flushRaw(); rawBuf = { text: ev.chunk, isError: false, ts: ev.ts }; }
    } else if (e.type === 'job.stderr') {
      const ev = e as unknown as { chunk: string; ts: number };
      if (rawBuf && rawBuf.isError) { rawBuf.text += ev.chunk; }
      else { flushRaw(); rawBuf = { text: ev.chunk, isError: true, ts: ev.ts }; }
    }
    // job.maybe_idle, job.heartbeat, job.warning, job.started, job.cost_update, etc. — skip
  }
  flushRaw();
  return items;
}
