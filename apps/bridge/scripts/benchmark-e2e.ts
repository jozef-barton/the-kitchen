#!/usr/bin/env tsx
/**
 * E2E benchmark: The Kitchen (bridge HTTP) vs TUI (direct hermes CLI)
 *
 * Runs 3 prompts × 3 trials each through both paths simultaneously.
 * Measures timing phases and tool-call counts for each run.
 *
 * Usage:
 *   NODE_OPTIONS=--experimental-sqlite tsx scripts/benchmark-e2e.ts
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { AddressInfo } from 'node:net';
import type { BootstrapResponse, Session, ChatStreamEvent } from '@hermes-recipes/protocol';
import { createBridgeServer } from '../src/server';

const MAX_TURNS = 15;
const RUN_TIMEOUT_MS = 5 * 60_000; // 5 minutes per run
const RECIPE_POLL_TIMEOUT_MS = 3 * 60_000;
const RECIPE_POLL_INTERVAL_MS = 1_000;
const HERMES_CLI = process.env.HERMES_CLI_PATH ?? 'hermes';
const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');

const PROMPTS = [
  {
    id: 'gym_shorts',
    label: 'Gym Shorts (Amazon)',
    text: 'Please find my some gym shorts on Amazon sized 38 - 42, stretch, with a length that goes to around the knee, and decently rated. Make sure to include links.'
  },
  {
    id: 'flights',
    label: 'Flights CLE→BOS (Delta)',
    text: 'Please find some flight options (delta only) for CLE to Boston flying out next friday night and leaving sunday morning.'
  },
  {
    id: 'restaurants',
    label: 'Restaurants Cleveland (Asian)',
    text: 'Please find some restaurants near Cleveland OH that I can take my brother to for his birthday. He likes Asian food.'
  }
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhaseTime {
  label: string;
  ms: number;
}

interface ToolEvent {
  name: string;
  state: 'started' | 'completed' | 'failed';
  durationMs?: number;
  timestamp: number;
}

interface RunResult {
  system: 'bridge' | 'cli';
  promptId: string;
  trial: number;
  ok: boolean;
  error?: string;
  totalMs: number;
  phases: PhaseTime[];
  toolEvents: ToolEvent[];
  toolCallCount: number;
  turnCount: number;
}

// ─── Server helpers ───────────────────────────────────────────────────────────

type BridgeServer = ReturnType<typeof createBridgeServer> & {
  baseUrl: string;
  close: () => Promise<void>;
  tempRoot: string;
};

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function startBridgeServer(): Promise<BridgeServer> {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bench-'));
  const instance = createBridgeServer({
    databasePath: path.join(tempRoot, 'bridge.sqlite'),
    cliPath: HERMES_CLI,
    recipeRoot: repoRoot,
    legacySnapshotPaths: []
  });

  await new Promise<void>((resolve) => {
    instance.server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = instance.server.address() as AddressInfo;
  return {
    ...instance,
    tempRoot,
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      await Promise.race([
        new Promise<void>((r) => instance.server.close(() => r())),
        sleep(5_000).then(() => instance.server.closeAllConnections?.())
      ]);
      await sleep(250);
    }
  };
}

async function getBootstrap(baseUrl: string): Promise<BootstrapResponse> {
  const r = await fetch(`${baseUrl}/api/bootstrap`);
  return r.json() as Promise<BootstrapResponse>;
}

const BRIDGE_HEADERS = { 'content-type': 'application/json', 'x-hermes-bridge': '1' };

async function createSession(baseUrl: string, profileId: string): Promise<Session> {
  const r = await fetch(`${baseUrl}/api/sessions`, {
    method: 'POST',
    headers: BRIDGE_HEADERS,
    body: JSON.stringify({ profileId })
  });
  return r.json() as Promise<Session>;
}

async function collectStreamEvents(response: Response): Promise<ChatStreamEvent[]> {
  const reader = response.body?.getReader();
  if (!reader) return [];

  const decoder = new TextDecoder();
  let buffer = '';
  const events: ChatStreamEvent[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep = buffer.indexOf('\n\n');
    while (sep >= 0) {
      const chunk = buffer.slice(0, sep).trim();
      buffer = buffer.slice(sep + 2);
      if (chunk.startsWith('data:')) {
        try {
          events.push(JSON.parse(chunk.slice(5).trim()) as ChatStreamEvent);
        } catch {
          // skip malformed
        }
      }
      sep = buffer.indexOf('\n\n');
    }
  }
  return events;
}

async function waitForRecipeReady(baseUrl: string, profileId: string, sessionId: string): Promise<number> {
  const start = Date.now();
  const deadline = start + RECIPE_POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const r = await fetch(
      `${baseUrl}/api/sessions/${encodeURIComponent(sessionId)}/messages?profileId=${encodeURIComponent(profileId)}`
    );
    const data = (await r.json()) as { attachedRecipe?: { metadata?: { recipePipeline?: { applet?: { status?: string } } }; dynamic?: { activeBuild?: { phase?: string } } } };
    const recipe = data.attachedRecipe;
    const appletStatus = recipe?.metadata?.recipePipeline?.applet?.status;
    const buildPhase = recipe?.dynamic?.activeBuild?.phase;

    if (recipe && ((appletStatus && appletStatus !== 'running') || buildPhase === 'ready' || buildPhase === 'failed')) {
      return Date.now() - start;
    }

    await sleep(RECIPE_POLL_INTERVAL_MS);
  }

  return Date.now() - start;
}

// ─── Bridge run ───────────────────────────────────────────────────────────────

async function runBridge(
  server: BridgeServer,
  profileId: string,
  promptId: string,
  promptText: string,
  trial: number
): Promise<RunResult> {
  const t0 = Date.now();
  const phases: PhaseTime[] = [];
  const toolEvents: ToolEvent[] = [];
  const toolTimers = new Map<string, number>();
  let toolCallCount = 0;
  let turnCount = 0;

  try {
    const session = await createSession(server.baseUrl, profileId);
    phases.push({ label: 'session_create', ms: Date.now() - t0 });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RUN_TIMEOUT_MS);

    let firstEventMs: number | null = null;
    let firstActivityMs: number | null = null;
    let firstSnapshotMs: number | null = null;

    const events = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: BRIDGE_HEADERS,
      signal: controller.signal,
      body: JSON.stringify({ profileId, sessionId: session.id, content: promptText })
    })
      .then(async (response) => {
        const reader = response.body?.getReader();
        if (!reader) return [] as ChatStreamEvent[];

        const decoder = new TextDecoder();
        let buffer = '';
        const evts: ChatStreamEvent[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let sep = buffer.indexOf('\n\n');
          while (sep >= 0) {
            const chunk = buffer.slice(0, sep).trim();
            buffer = buffer.slice(sep + 2);
            if (chunk.startsWith('data:')) {
              try {
                const evt = JSON.parse(chunk.slice(5).trim()) as ChatStreamEvent;
                evts.push(evt);

                const now = Date.now();
                const elapsed = now - t0;

                if (firstEventMs === null) {
                  firstEventMs = elapsed;
                }

                if (evt.type === 'activity') {
                  const act = evt.activity;
                  if (firstActivityMs === null) {
                    firstActivityMs = elapsed;
                  }
                  const key = `${act.kind}:${act.label}`;
                  if (act.state === 'started') {
                    toolTimers.set(key, now);
                    if (act.kind === 'tool' || act.kind === 'skill' || act.kind === 'website' || act.kind === 'command') {
                      toolCallCount++;
                      toolEvents.push({ name: act.label, state: 'started', timestamp: now });
                    }
                    if (act.kind === 'status' && act.label.toLowerCase().includes('turn')) {
                      turnCount++;
                    }
                  } else if (act.state === 'completed' || act.state === 'failed') {
                    const startT = toolTimers.get(key);
                    const durationMs = startT ? now - startT : undefined;
                    toolEvents.push({
                      name: act.label,
                      state: act.state,
                      durationMs,
                      timestamp: now
                    });
                  }
                }

                if (evt.type === 'assistant_snapshot' && firstSnapshotMs === null) {
                  firstSnapshotMs = elapsed;
                }
              } catch {
                // skip
              }
            }
            sep = buffer.indexOf('\n\n');
          }
        }
        return evts;
      })
      .finally(() => clearTimeout(timeout));

    const chatCompleteMs = Date.now() - t0;

    if (firstEventMs !== null) phases.push({ label: 'time_to_first_event', ms: firstEventMs });
    if (firstActivityMs !== null) phases.push({ label: 'time_to_first_tool', ms: firstActivityMs });
    if (firstSnapshotMs !== null) phases.push({ label: 'time_to_first_snapshot', ms: firstSnapshotMs });
    phases.push({ label: 'chat_stream_complete', ms: chatCompleteMs });

    const completeEvent = events.find((e) => e.type === 'complete');
    if (!completeEvent) {
      phases.push({ label: 'recipe_enrichment', ms: 0 });
    } else {
      const enrichmentMs = await waitForRecipeReady(server.baseUrl, profileId, session.id);
      phases.push({ label: 'recipe_enrichment', ms: enrichmentMs });
    }

    const totalMs = Date.now() - t0;
    return { system: 'bridge', promptId, trial, ok: true, totalMs, phases, toolEvents, toolCallCount, turnCount };
  } catch (err) {
    return {
      system: 'bridge',
      promptId,
      trial,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      totalMs: Date.now() - t0,
      phases,
      toolEvents,
      toolCallCount,
      turnCount
    };
  }
}

// ─── Direct CLI run ───────────────────────────────────────────────────────────

async function runCli(promptId: string, promptText: string, trial: number): Promise<RunResult> {
  const t0 = Date.now();
  const phases: PhaseTime[] = [];
  const toolEvents: ToolEvent[] = [];
  const toolTimers = new Map<string, number>();
  let toolCallCount = 0;
  let turnCount = 0;
  let firstOutputMs: number | null = null;
  let firstActivityMs: number | null = null;

  // Hermes parses the query from a temp file to avoid shell quoting issues
  const tmpFile = path.join(os.tmpdir(), `hermes-bench-prompt-${Date.now()}-${trial}.txt`);
  fs.writeFileSync(tmpFile, promptText, 'utf8');

  return new Promise<RunResult>((resolve) => {
    const args = [
      'chat',
      '-Q',
      '--max-turns',
      String(MAX_TURNS),
      '--source',
      'tool',
      '-q',
      promptText
    ];

    const child = spawn(HERMES_CLI, args, {
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdoutBuf = '';
    const toolActivityRe = /^┊\s+(?:📞|📖|🐍)\s+(?:tool|read|exec)\s+(.+?)\s+(\d+(?:\.\d+)?)s/u;
    const toolStartRe = /^┊\s+(?:📞|📖|🐍|📚|💻)\s+preparing\s+(.+?)…$/u;

    child.stdout.on('data', (chunk: Buffer) => {
      const now = Date.now();
      if (firstOutputMs === null) {
        firstOutputMs = now - t0;
      }
      stdoutBuf += chunk.toString();
      const lines = stdoutBuf.split('\n');
      stdoutBuf = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.replace(/\x1b\[[0-9;]*m/g, '').trim();

        if (toolStartRe.test(trimmed)) {
          const m = trimmed.match(toolStartRe);
          const label = m?.[1]?.trim() ?? trimmed;
          if (firstActivityMs === null) firstActivityMs = now - t0;
          toolCallCount++;
          toolTimers.set(label, now);
          toolEvents.push({ name: label, state: 'started', timestamp: now });
        } else if (toolActivityRe.test(trimmed)) {
          const m = trimmed.match(toolActivityRe);
          const label = m?.[1]?.trim() ?? trimmed;
          const durationMs = m?.[2] ? Math.round(parseFloat(m[2]) * 1000) : undefined;
          const startT = toolTimers.get(label);
          toolEvents.push({
            name: label,
            state: 'completed',
            durationMs: durationMs ?? (startT ? now - startT : undefined),
            timestamp: now
          });
        }

        if (/turn\s+\d+/i.test(trimmed)) {
          turnCount++;
        }
      }
    });

    child.stderr.on('data', () => {});

    const killTimeout = setTimeout(() => {
      child.kill('SIGTERM');
    }, RUN_TIMEOUT_MS);

    child.on('close', (code) => {
      clearTimeout(killTimeout);
      try { fs.unlinkSync(tmpFile); } catch {}

      const totalMs = Date.now() - t0;
      if (firstOutputMs !== null) phases.push({ label: 'time_to_first_output', ms: firstOutputMs });
      if (firstActivityMs !== null) phases.push({ label: 'time_to_first_tool', ms: firstActivityMs });
      phases.push({ label: 'cli_complete', ms: totalMs });

      resolve({
        system: 'cli',
        promptId,
        trial,
        ok: code === 0,
        error: code !== 0 ? `Exit code ${code}` : undefined,
        totalMs,
        phases,
        toolEvents,
        toolCallCount,
        turnCount
      });
    });
  });
}

// ─── Reporting ────────────────────────────────────────────────────────────────

function fmtMs(ms: number) {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtPhases(phases: PhaseTime[]) {
  return phases.map((p) => `${p.label}=${fmtMs(p.ms)}`).join('  ');
}

function printResults(results: RunResult[]) {
  const line = (s: string) => process.stdout.write(s + '\n');

  line('');
  line('═══════════════════════════════════════════════════════════════════════════');
  line('  THE KITCHEN vs TUI — E2E Performance Benchmark');
  line('═══════════════════════════════════════════════════════════════════════════');

  const promptIds = [...new Set(results.map((r) => r.promptId))];
  const systems: Array<'bridge' | 'cli'> = ['bridge', 'cli'];

  for (const promptId of promptIds) {
    const prompt = PROMPTS.find((p) => p.id === promptId)!;
    line('');
    line(`┌─ ${prompt.label}`);
    line(`│  "${prompt.text.slice(0, 80)}${prompt.text.length > 80 ? '…' : ''}"`);

    for (const system of systems) {
      const label = system === 'bridge' ? 'THE KITCHEN (bridge)' : 'TUI (direct CLI)';
      line(`│`);
      line(`│  ▸ ${label}`);

      const runs = results.filter((r) => r.promptId === promptId && r.system === system);
      const okRuns = runs.filter((r) => r.ok);
      const avgTotal = okRuns.length ? okRuns.reduce((s, r) => s + r.totalMs, 0) / okRuns.length : NaN;

      for (const run of runs) {
        const status = run.ok ? '✓' : '✗';
        const toolSummary = run.toolEvents
          .filter((e) => e.state === 'completed')
          .slice(0, 6)
          .map((e) => `${e.name.slice(0, 30)}${e.durationMs !== undefined ? `(${fmtMs(e.durationMs)})` : ''}`)
          .join(', ');

        line(`│    Trial ${run.trial + 1}  ${status}  total=${fmtMs(run.totalMs)}  tools=${run.toolCallCount}  turns=${run.turnCount}`);
        line(`│    Phases: ${fmtPhases(run.phases)}`);
        if (toolSummary) {
          line(`│    Tools:  ${toolSummary}`);
        }
        if (!run.ok) {
          line(`│    Error: ${run.error}`);
        }
      }

      if (okRuns.length) {
        line(`│    ── avg total: ${fmtMs(avgTotal)}  (${okRuns.length}/${runs.length} succeeded)`);
      }
    }

    // Side-by-side comparison
    const bridgeRuns = results.filter((r) => r.promptId === promptId && r.system === 'bridge' && r.ok);
    const cliRuns = results.filter((r) => r.promptId === promptId && r.system === 'cli' && r.ok);
    if (bridgeRuns.length && cliRuns.length) {
      const bridgeAvg = bridgeRuns.reduce((s, r) => s + r.totalMs, 0) / bridgeRuns.length;
      const cliAvg = cliRuns.reduce((s, r) => s + r.totalMs, 0) / cliRuns.length;
      const diff = bridgeAvg - cliAvg;
      const pct = Math.abs(diff / cliAvg * 100).toFixed(0);
      const faster = diff > 0 ? 'CLI faster' : 'Bridge faster';
      line(`│`);
      line(`│  ⚡ ${faster} by ${fmtMs(Math.abs(diff))} (${pct}%)`);

      // Phase-level comparison
      const bridgeChatPhase = bridgeRuns.map(r => r.phases.find(p => p.label === 'chat_stream_complete')?.ms ?? 0);
      const bridgeEnrichPhase = bridgeRuns.map(r => r.phases.find(p => p.label === 'recipe_enrichment')?.ms ?? 0);
      const avgBridgeChat = bridgeChatPhase.reduce((a, b) => a + b, 0) / bridgeChatPhase.length;
      const avgBridgeEnrich = bridgeEnrichPhase.reduce((a, b) => a + b, 0) / bridgeEnrichPhase.length;
      if (avgBridgeChat > 0) {
        line(`│  Bridge breakdown: chat=${fmtMs(avgBridgeChat)}  enrichment=${fmtMs(avgBridgeEnrich)}`);
      }
    }

    line('└─────────────────────────────────────────────────────────────────────────');
  }

  // Overall summary table
  line('');
  line('═══════════════════════════════════════════════════════════════════════════');
  line('  OVERALL SUMMARY');
  line('═══════════════════════════════════════════════════════════════════════════');
  line('');
  line(`  ${'Prompt'.padEnd(28)} ${'Bridge avg'.padStart(12)} ${'CLI avg'.padStart(12)} ${'Δ overhead'.padStart(12)}`);
  line(`  ${'─'.repeat(28)} ${'─'.repeat(12)} ${'─'.repeat(12)} ${'─'.repeat(12)}`);

  for (const promptId of promptIds) {
    const prompt = PROMPTS.find((p) => p.id === promptId)!;
    const bridgeRuns = results.filter((r) => r.promptId === promptId && r.system === 'bridge' && r.ok);
    const cliRuns = results.filter((r) => r.promptId === promptId && r.system === 'cli' && r.ok);
    const bridgeAvg = bridgeRuns.length ? bridgeRuns.reduce((s, r) => s + r.totalMs, 0) / bridgeRuns.length : NaN;
    const cliAvg = cliRuns.length ? cliRuns.reduce((s, r) => s + r.totalMs, 0) / cliRuns.length : NaN;
    const delta = isNaN(bridgeAvg) || isNaN(cliAvg) ? '—' : `${bridgeAvg > cliAvg ? '+' : ''}${fmtMs(bridgeAvg - cliAvg)}`;
    line(`  ${prompt.label.padEnd(28)} ${(isNaN(bridgeAvg) ? '—' : fmtMs(bridgeAvg)).padStart(12)} ${(isNaN(cliAvg) ? '—' : fmtMs(cliAvg)).padStart(12)} ${delta.padStart(12)}`);
  }

  const allBridge = results.filter((r) => r.system === 'bridge' && r.ok);
  const allCli = results.filter((r) => r.system === 'cli' && r.ok);
  const totalBridgeAvg = allBridge.length ? allBridge.reduce((s, r) => s + r.totalMs, 0) / allBridge.length : NaN;
  const totalCliAvg = allCli.length ? allCli.reduce((s, r) => s + r.totalMs, 0) / allCli.length : NaN;
  line(`  ${'─'.repeat(28)} ${'─'.repeat(12)} ${'─'.repeat(12)} ${'─'.repeat(12)}`);
  line(`  ${'OVERALL'.padEnd(28)} ${(isNaN(totalBridgeAvg) ? '—' : fmtMs(totalBridgeAvg)).padStart(12)} ${(isNaN(totalCliAvg) ? '—' : fmtMs(totalCliAvg)).padStart(12)}`);

  line('');
  line('  Δ overhead = Bridge total − CLI total (positive = bridge is slower)');
  line('  Bridge total includes chat stream + async recipe enrichment pipeline.');
  line('  CLI total is direct hermes invocation only (no recipe enrichment).');
  line('');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  process.stdout.write('Starting benchmark server...\n');
  const server = await startBridgeServer();
  const bootstrap = await getBootstrap(server.baseUrl);
  const profileId = bootstrap.activeProfileId ?? 'default';
  process.stdout.write(`Bridge server ready at ${server.baseUrl}  profile=${profileId}\n`);
  process.stdout.write(`Launching 18 runs (3 prompts × 3 trials × 2 systems) in parallel...\n\n`);

  const allTasks: Array<Promise<RunResult>> = [];

  for (const prompt of PROMPTS) {
    for (let trial = 0; trial < 3; trial++) {
      allTasks.push(runBridge(server, profileId, prompt.id, prompt.text, trial));
      allTasks.push(runCli(prompt.id, prompt.text, trial));
    }
  }

  // Progress ticker
  let done = 0;
  const total = allTasks.length;
  const startedAt = Date.now();
  const tracked = allTasks.map((t) =>
    t.then((r) => {
      done++;
      const elapsed = fmtMs(Date.now() - startedAt);
      process.stdout.write(
        `  [${done}/${total}] ${r.system.padEnd(6)} ${r.promptId.padEnd(16)} trial=${r.trial + 1}  ${r.ok ? '✓' : '✗'}  ${fmtMs(r.totalMs)}  (elapsed ${elapsed})\n`
      );
      return r;
    })
  );

  const settled = await Promise.allSettled(tracked);
  const results: RunResult[] = settled
    .filter((s): s is PromiseFulfilledResult<RunResult> => s.status === 'fulfilled')
    .map((s) => s.value);

  // Save raw results
  const outPath = path.join(import.meta.dirname, '..', 'benchmark-results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');

  printResults(results);
  process.stdout.write(`\nRaw results saved to: ${outPath}\n`);

  await server.close();
}

void main();
