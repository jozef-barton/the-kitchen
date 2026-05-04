#!/usr/bin/env node
import { spawn } from 'node:child_process';
import net from 'node:net';
import { platform, networkInterfaces } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

// Parse --public and --port=N / --port N from argv.
const argv = process.argv.slice(2);
const publicMode = argv.includes('--public');

function parsePortArg(args) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      return Number.parseInt(args[i + 1], 10);
    }
    const match = /^--port=(\d+)$/.exec(args[i]);
    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }
  return null;
}

const PREFERRED_PORT = parsePortArg(argv) ?? Number.parseInt(process.env.BRIDGE_PORT ?? '8787', 10);
// KITCHEN_RAW=1 → fall back to raw streaming output (useful for debugging).
// Otherwise, when stdout is a TTY we run the polished progress UI.
const FANCY = process.stdout.isTTY && process.env.KITCHEN_RAW !== '1';

const ESC = '\x1b[';
const CLEAR_LINE = `${ESC}2K`;
const CURSOR_HOME = `${ESC}1G`;
const HIDE_CURSOR = `${ESC}?25l`;
const SHOW_CURSOR = `${ESC}?25h`;
const PREV_LINE = `${ESC}1A`;

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const BAR_FILLED = '█';
const BAR_EMPTY = '░';
// Strip ANSI SGR codes from captured child-process output. Built via
// String.fromCharCode so the regex literal doesn't trip ESLint's
// no-control-regex rule.
const ANSI_SGR_RE = new RegExp(`${String.fromCharCode(0x1b)}\\[[0-9;]*m`, 'g');

function checkPort(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.unref();
    srv.once('error', () => resolve(false));
    srv.listen(port, '0.0.0.0', () => srv.close(() => resolve(true)));
  });
}

function getLanIpv4s() {
  const ifaces = networkInterfaces();
  const results = [];
  for (const iface of Object.values(ifaces)) {
    if (!iface) continue;
    for (const entry of iface) {
      if (entry.family === 'IPv4' && !entry.internal) {
        results.push(entry.address);
      }
    }
  }
  return results;
}

function openBrowser(url) {
  const p = platform();
  const cmd = p === 'darwin' ? 'open' : p === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], {
    stdio: 'ignore',
    detached: true,
    shell: p === 'win32',
  }).unref();
}

// Banner shown once at startup. Kept to a few lines so the progress UI fits in
// even small terminals.
function printBanner() {
  if (!FANCY) return;
  const lines = [
    '',
    `  ${C.magenta}╔══════════════════════════════════════════╗${C.reset}`,
    `  ${C.magenta}║${C.reset}  ${C.bold}THE KITCHEN${C.reset}  ${C.dim}local Hermes frontend${C.reset}      ${C.magenta}║${C.reset}`,
    `  ${C.magenta}╚══════════════════════════════════════════╝${C.reset}`,
    '',
  ];
  process.stdout.write(lines.join('\n') + '\n');
}

function makeBar(progress, width) {
  const cells = Math.max(8, Math.min(width, 32));
  const filled = Math.round(cells * Math.max(0, Math.min(1, progress)));
  return `${C.cyan}${BAR_FILLED.repeat(filled)}${C.dim}${BAR_EMPTY.repeat(cells - filled)}${C.reset}`;
}

function fmtElapsed(ms) {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m${Math.round(s - m * 60)}s`;
}

// A polished progress UI that owns the bottom 2 lines of the terminal:
//   line 1: ⠋ <stage label>           [█████▒▒▒▒]  40%   3.2s
//   line 2:   └─ <last activity line, dimmed>
// Completed stages are pushed above as static "✓ done" lines.
class ProgressUI {
  constructor() {
    this.frame = 0;
    this.stages = []; // [{ key, label, weight, startedAt?, finishedAt?, status: 'pending'|'running'|'done'|'failed' }]
    this.activity = '';
    this.timer = null;
    this.startedAt = Date.now();
    this.rendered = false;
    this.printedDoneCount = 0;
  }

  add(key, label, weight = 1) {
    this.stages.push({ key, label, weight, status: 'pending' });
  }

  start() {
    if (!FANCY) return;
    process.stdout.write(HIDE_CURSOR);
    this.timer = setInterval(() => this.render(), 90);
    this.render();
  }

  setActivity(line) {
    this.activity = line ? line.trim().slice(0, Math.max(0, (process.stdout.columns ?? 80) - 8)) : '';
  }

  beginStage(key) {
    const stage = this.stages.find((s) => s.key === key);
    if (!stage) return;
    stage.status = 'running';
    stage.startedAt = Date.now();
    this.activity = '';
  }

  finishStage(key, ok = true) {
    const stage = this.stages.find((s) => s.key === key);
    if (!stage) return;
    stage.status = ok ? 'done' : 'failed';
    stage.finishedAt = Date.now();
    if (FANCY) this.flushDoneStages();
  }

  // Move any newly-finished stages above the live spinner area as static lines.
  flushDoneStages() {
    if (!FANCY) return;
    const newlyDone = this.stages
      .slice(this.printedDoneCount)
      .filter((s) => s.status === 'done' || s.status === 'failed');
    if (newlyDone.length === 0) return;

    if (this.rendered) {
      // Move up to the start of our 2-line live region and clear it.
      process.stdout.write(`${PREV_LINE}${CLEAR_LINE}${PREV_LINE}${CLEAR_LINE}${CURSOR_HOME}`);
      this.rendered = false;
    }
    for (const stage of newlyDone) {
      const elapsed = stage.startedAt ? fmtElapsed((stage.finishedAt ?? Date.now()) - stage.startedAt) : '';
      const icon = stage.status === 'done' ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`;
      const elapsedStr = elapsed ? `${C.dim}${elapsed.padStart(6)}${C.reset}` : '';
      process.stdout.write(`  ${icon} ${stage.label.padEnd(36, ' ')}${elapsedStr}\n`);
      this.printedDoneCount += 1;
    }
  }

  render() {
    if (!FANCY) return;
    this.frame = (this.frame + 1) % SPINNER_FRAMES.length;

    const running = this.stages.find((s) => s.status === 'running');
    const totalWeight = this.stages.reduce((sum, s) => sum + s.weight, 0);
    const doneWeight = this.stages
      .filter((s) => s.status === 'done')
      .reduce((sum, s) => sum + s.weight, 0);
    const inFlightWeight = running ? running.weight * 0.5 : 0;
    const progress = totalWeight === 0 ? 0 : (doneWeight + inFlightWeight) / totalWeight;
    const pct = Math.round(progress * 100);

    const spinner = `${C.cyan}${SPINNER_FRAMES[this.frame]}${C.reset}`;
    const label = running ? running.label : 'Done';
    const elapsed = running?.startedAt ? fmtElapsed(Date.now() - running.startedAt) : '';
    const bar = makeBar(progress, 16);
    const pctStr = `${String(pct).padStart(3)}%`;

    const line1 = `  ${spinner} ${label.padEnd(28, ' ')} ${bar} ${C.dim}${pctStr}${C.reset}  ${C.dim}${elapsed.padStart(6)}${C.reset}`;
    const line2 = this.activity
      ? `    ${C.dim}└─ ${this.activity}${C.reset}`
      : `    ${C.dim}└─${C.reset}`;

    if (this.rendered) {
      // Move up 2 lines and rewrite both.
      process.stdout.write(`${PREV_LINE}${CLEAR_LINE}${PREV_LINE}${CLEAR_LINE}${CURSOR_HOME}`);
    }
    process.stdout.write(`${line1}\n${line2}\n`);
    this.rendered = true;
  }

  stop({ keepLine = false } = {}) {
    if (!FANCY) return;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    // Final flush of any remaining done stages.
    this.flushDoneStages();
    if (this.rendered && !keepLine) {
      process.stdout.write(`${PREV_LINE}${CLEAR_LINE}${PREV_LINE}${CLEAR_LINE}${CURSOR_HOME}`);
      this.rendered = false;
    }
    process.stdout.write(SHOW_CURSOR);
  }
}

// Run a child process in fancy mode, capturing the latest meaningful stdout
// line for live display. The full output is buffered so we can dump it on error.
function runStepFancy(ui, stageKey, cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const buffer = [];
    const child = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
      ...opts,
    });

    const onChunk = (chunk) => {
      const text = chunk.toString();
      buffer.push(text);
      // Take the last non-empty line as the current activity indicator.
      const lines = text.split('\n').map((l) => l.replace(ANSI_SGR_RE, '').trim()).filter(Boolean);
      if (lines.length > 0) ui.setActivity(lines[lines.length - 1]);
    };
    child.stdout.on('data', onChunk);
    child.stderr.on('data', onChunk);

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        // On failure, surface the captured output so the user can debug.
        ui.stop();
        process.stderr.write(`\n${C.red}✗ ${stageKey} failed (exit ${code}). Recent output:${C.reset}\n`);
        const tail = buffer.join('').split('\n').slice(-25).join('\n');
        process.stderr.write(tail + '\n');
        reject(new Error(`${stageKey} failed with exit code ${code}`));
      }
    });
  });
}

// Plain (non-TTY / KITCHEN_RAW=1) execution — passes stdio through.
function runStepPlain(label, cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with exit code ${code}`));
    });
    child.on('error', reject);
  });
}

async function main() {
  printBanner();

  const ui = new ProgressUI();
  ui.add('setup', 'Mise en place', 1);
  ui.add('build', 'Building the workspace', 6);
  ui.add('serve', 'Starting service', 1);
  ui.add('open', 'Plating up', 1);
  ui.start();

  try {
    // ── Stage 1: check port ──────────────────────────────────────
    ui.beginStage('setup');
    const portAvailable = await checkPort(PREFERRED_PORT);
    if (!portAvailable) {
      ui.stop();
      process.stderr.write(
        `${C.red}Port ${PREFERRED_PORT} is in use. Free it (e.g. lsof -i :${PREFERRED_PORT}) or pass --port=NNNN.${C.reset}\n`
      );
      process.exit(1);
    }
    const port = PREFERRED_PORT;
    ui.setActivity(`port ${port} reserved`);
    // Tiny delay so the user sees the stage before it flips.
    await delay(150);
    ui.finishStage('setup');

    // ── Stage 2: build ───────────────────────────────────────────
    ui.beginStage('build');
    if (FANCY) {
      await runStepFancy(ui, 'build', 'pnpm', ['build']);
    } else {
      await runStepPlain('build', 'pnpm', ['build']);
    }
    ui.finishStage('build');

    // ── Stage 3: start the bridge ────────────────────────────────
    ui.beginStage('serve');
    const bridgeArgs = [
      '--filter',
      '@hermes-recipes/bridge',
      'start',
      '--',
      '--static-dir',
      '../web/dist',
      '--port',
      String(port),
    ];
    if (publicMode) bridgeArgs.push('--public');
    const bridge = spawn('pnpm', bridgeArgs, {
      stdio: FANCY ? ['ignore', 'pipe', 'pipe'] : ['inherit', 'pipe', 'inherit'],
      env: { ...process.env, BRIDGE_PORT: String(port), FORCE_COLOR: FANCY ? '0' : process.env.FORCE_COLOR ?? '1' },
    });

    let opened = false;
    let listening = false;
    let listeningResolve;
    const listeningSeen = new Promise((resolve) => {
      listeningResolve = resolve;
    });

    const handleBridgeChunk = (chunk) => {
      const text = chunk.toString();
      if (FANCY) {
        const lines = text
          .split('\n')
          .map((l) => l.replace(ANSI_SGR_RE, '').trim())
          .filter(Boolean);
        if (lines.length > 0) ui.setActivity(lines[lines.length - 1]);
      } else {
        process.stdout.write(chunk);
      }
      if (!listening && /listening on http/i.test(text)) {
        listening = true;
        listeningResolve?.();
      }
    };
    bridge.stdout.on('data', handleBridgeChunk);
    if (FANCY) bridge.stderr.on('data', handleBridgeChunk);

    // Wait up to 15s for "listening on http..."; if it never arrives, best-effort continue.
    await Promise.race([listeningSeen, delay(15000)]);
    ui.finishStage('serve');

    // ── Stage 4: open browser ────────────────────────────────────
    ui.beginStage('open');
    const url = `http://127.0.0.1:${port}`;
    if (!opened) {
      opened = true;
      ui.setActivity(`opening ${url}`);
      openBrowser(url);
      await delay(300);
    }
    ui.finishStage('open');

    ui.stop();

    // Final summary panel — URLs are printed as plain log lines so they persist in the
    // terminal scroll buffer and the user can copy them at any time during the run.
    const totalElapsed = fmtElapsed(Date.now() - ui.startedAt);
    const lanIps = getLanIpv4s();
    if (FANCY) {
      process.stdout.write(`\n  ${C.green}● Ready${C.reset}  ${C.dim}(${totalElapsed})${C.reset}\n`);
    } else {
      process.stdout.write(`[kitchen] ready (${totalElapsed})\n`);
    }
    // Always show the loopback URL.
    process.stdout.write(`  Open ${C.bold}${C.cyan}${url}${C.reset}\n`);
    // In --public mode, list every LAN URL.
    if (publicMode) {
      for (const ip of lanIps) {
        process.stdout.write(`  Open on your LAN: ${C.bold}${C.cyan}http://${ip}:${port}${C.reset}\n`);
      }
      process.stdout.write(
        `\n  ${C.yellow}⚠  No authentication. Only use --public on a trusted network.${C.reset}\n`
      );
    }
    if (FANCY) {
      process.stdout.write(`  ${C.dim}Press Ctrl-C to stop. Set KITCHEN_RAW=1 to see verbose logs.${C.reset}\n`);
    }
    process.stdout.write('\n');

    for (const sig of ['SIGINT', 'SIGTERM']) {
      process.on(sig, () => bridge.kill(sig));
    }
    bridge.on('exit', (code) => {
      if (FANCY) process.stdout.write(SHOW_CURSOR);
      process.exit(code ?? 0);
    });
  } catch (err) {
    ui.stop();
    process.stderr.write(`${C.red}[kitchen] ${err.message}${C.reset}\n`);
    process.exit(1);
  }
}

// Restore cursor on unexpected exits.
process.on('exit', () => {
  if (FANCY) process.stdout.write(SHOW_CURSOR);
});
process.on('uncaughtException', (err) => {
  if (FANCY) process.stdout.write(SHOW_CURSOR);
  process.stderr.write(`${C.red}[kitchen] uncaught: ${err.message}${C.reset}\n`);
  process.exit(1);
});

main().catch((err) => {
  if (FANCY) process.stdout.write(SHOW_CURSOR);
  process.stderr.write(`${C.red}[kitchen] ${err.message}${C.reset}\n`);
  process.exit(1);
});
