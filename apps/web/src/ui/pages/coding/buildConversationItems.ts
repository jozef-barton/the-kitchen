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

// Slim representation of a tool call for summary aggregation
export interface TurnCallEntry {
  toolName: string;
  toolUseId: string;
  input: Record<string, unknown>;
}

export interface SystemEventPayload {
  subtype: string;
  description?: string;
  toolName?: string;
  usage?: { total_tokens?: number; tool_uses?: number; duration_ms?: number };
}

export type ConversationItem =
  | { kind: 'init'; event: AgentInitEvent }
  | { kind: 'continuation'; prompt: string; ts: number }
  | { kind: 'thinking'; messageId: string; text: string; ts: number }
  | { kind: 'message'; messageId: string; jobId: string; text: string; ts: number }
  | ToolPair
  | { kind: 'raw'; text: string; isError: boolean; ts: number }
  | { kind: 'system_event'; payload: SystemEventPayload; ts: number }
  | { kind: 'result'; event: AgentResultEvent }
  | { kind: 'user_turn'; turnId: string; turnIndex: number; text: string; ts: number }
  | { kind: 'turn_boundary'; ts: number }
  | { kind: 'turn_action_summary'; jobId: string; turnIndex: number; durationMs: number; calls: TurnCallEntry[]; lastMessageId: string | null; ts: number };

// ── Conversation builder ──────────────────────────────────────────────────────

export function buildConversationItems(events: JobEvent[], jobPrompts?: Map<string, string>): ConversationItem[] {
  const items: ConversationItem[] = [];
  const messageMap = new Map<string, { kind: 'thinking' | 'message'; idx: number }>();
  const toolCallMap = new Map<string, number>(); // toolUseId -> items index
  let rawBuf: { text: string; isError: boolean; ts: number } | null = null;
  let firstJobId: string | null = null;

  // Per-agent-turn accumulators
  let currentTurnCalls: TurnCallEntry[] = [];
  let currentTurnLastMessageId: string | null = null;
  let currentTurnIndex = 0; // increments after each user_turn

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
        items.push({ kind: 'message', messageId: ev.messageId, jobId: ev.jobId, text: ev.text, ts: ev.ts });
      }
      currentTurnLastMessageId = ev.messageId;
    } else if (e.type === 'job.tool_call') {
      flushRaw();
      const ev = e as unknown as ToolCallEvent;
      toolCallMap.set(ev.toolUseId, items.length);
      items.push({ kind: 'tool_pair', call: ev, result: undefined });
      currentTurnCalls.push({ toolName: ev.toolName, toolUseId: ev.toolUseId, input: ev.input ?? {} });
    } else if (e.type === 'job.tool_result') {
      const ev = e as unknown as ToolResultEvent;
      const pairIdx = toolCallMap.get(ev.toolUseId);
      if (pairIdx !== undefined) {
        (items[pairIdx] as ToolPair).result = ev;
      }
    } else if (e.type === 'job.agent_result') {
      flushRaw();
      const ev = e as unknown as AgentResultEvent;
      // Emit action summary if this turn had any tool calls
      if (currentTurnCalls.length > 0) {
        items.push({
          kind: 'turn_action_summary',
          jobId: e.jobId,
          turnIndex: currentTurnIndex,
          durationMs: ev.durationMs,
          calls: [...currentTurnCalls],
          lastMessageId: currentTurnLastMessageId,
          ts: e.ts,
        });
      }
      currentTurnCalls = [];
      currentTurnLastMessageId = null;
      items.push({ kind: 'result', event: ev });
    } else if (e.type === 'job.user_turn') {
      flushRaw();
      currentTurnCalls = [];
      currentTurnLastMessageId = null;
      currentTurnIndex++;
      const ev = e as unknown as { turnId: string; turnIndex: number; text: string; ts: number };
      items.push({ kind: 'user_turn', turnId: ev.turnId, turnIndex: ev.turnIndex, text: ev.text, ts: ev.ts });
    } else if (e.type === 'job.awaiting_user') {
      flushRaw();
      // Only show the "awaiting reply" divider if the user actually waited (gap > 3s to next turn).
      const nextTurn = events.slice(idx + 1).find(ev2 => ev2.type === 'job.user_turn');
      const quickTurn = nextTurn && (nextTurn.ts - e.ts) < 3000;
      if (!quickTurn) {
        items.push({ kind: 'turn_boundary', ts: e.ts });
      }
    } else if (e.type === 'job.stdout') {
      const ev = e as unknown as { chunk: string; ts: number };
      // Parse [event:TYPE] JSON lines emitted by the codex/claude-code adapters
      const systemMatch = ev.chunk.match(/^\[event:(\w+)\]\s*(\{.*\})\s*$/);
      if (systemMatch) {
        try {
          const parsed = JSON.parse(systemMatch[2]!) as Record<string, unknown>;
          const subtype = (parsed.subtype as string) ?? systemMatch[1]!;
          // Only surface events that are useful to the user
          if (subtype === 'task_progress' || systemMatch[1] === 'system') {
            flushRaw();
            const usageRaw = parsed.usage as Record<string, number> | undefined;
            items.push({
              kind: 'system_event',
              payload: {
                subtype,
                description: (parsed.description as string) ?? undefined,
                toolName: (parsed.last_tool_name as string) ?? undefined,
                usage: usageRaw ? {
                  total_tokens: usageRaw.total_tokens,
                  tool_uses: usageRaw.tool_uses,
                  duration_ms: usageRaw.duration_ms,
                } : undefined,
              },
              ts: ev.ts,
            });
          }
          // Skip all other system events (noise)
        } catch { /* malformed JSON — fall through to raw */ }
      } else {
        if (rawBuf && !rawBuf.isError) { rawBuf.text += ev.chunk; }
        else { flushRaw(); rawBuf = { text: ev.chunk, isError: false, ts: ev.ts }; }
      }
    } else if (e.type === 'job.stderr') {
      const ev = e as unknown as { chunk: string; ts: number };
      if (rawBuf && rawBuf.isError) { rawBuf.text += ev.chunk; }
      else { flushRaw(); rawBuf = { text: ev.chunk, isError: true, ts: ev.ts }; }
    }
  }
  flushRaw();
  return items;
}
