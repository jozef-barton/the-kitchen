#!/usr/bin/env node
/**
 * Playwright fixture server — starts the bridge in fixture mode and serves
 * the built web app from apps/web/dist on the fixture port.
 *
 * Invoked by playwright.config.ts webServer.command.
 *
 * Uses tsx to run the bridge TypeScript source directly so no compiled dist
 * is required — avoids the moduleResolution:Bundler + Node ESM extension issue.
 */

import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const port = Number.parseInt(process.env.PLAYWRIGHT_BRIDGE_PORT ?? '40178', 10);
const webDistDir = path.resolve(repoRoot, 'apps/web/dist');
// Run TypeScript source directly via tsx — no dist needed
const bridgeSourceEntry = path.resolve(repoRoot, 'apps/bridge/src/server.ts');
const tsxBin = path.resolve(repoRoot, 'node_modules/.bin/tsx');
const fixtureCli = path.resolve(repoRoot, 'apps/bridge/test/fixtures/hermes-cli-fixture.mjs');
const fixtureDir = path.resolve(repoRoot, 'tmp/playwright-fixture');
const fixtureHome = path.resolve(fixtureDir, 'fixture-home');
const dbPath = path.resolve(fixtureDir, 'hermes-workspaces-e2e.sqlite');

// Ensure fixture directories exist
fs.mkdirSync(fixtureDir, { recursive: true });
fs.mkdirSync(fixtureHome, { recursive: true });

if (!fs.existsSync(webDistDir)) {
  process.stderr.write(
    `[fixture-server] ERROR: Web dist not found at ${webDistDir}\n` +
    `Run 'pnpm build --filter @hermes-recipes/web' first.\n`
  );
  process.exit(1);
}

process.stdout.write(`[fixture-server] Starting bridge on port ${port}\n`);
process.stdout.write(`[fixture-server] Static dir: ${webDistDir}\n`);
process.stdout.write(`[fixture-server] Fixture home: ${fixtureHome}\n`);

const bridge = spawn(
  tsxBin,
  [
    bridgeSourceEntry,
    '--port', String(port),
    '--static-dir', webDistDir,
    '--cli-path', fixtureCli,
    '--db-path', dbPath,
    '--fixture',
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--experimental-sqlite',
      HERMES_FIXTURE_HOME: fixtureHome,
    },
  }
);

bridge.on('error', (err) => {
  process.stderr.write(`[fixture-server] Bridge spawn error: ${err.message}\n`);
  process.exit(1);
});

// Keep this process alive until the bridge exits; forward the exit code
await new Promise((resolve) => {
  bridge.on('close', (code) => {
    process.exit(code ?? 0);
  });
  // Handle SIGTERM/SIGINT so Playwright can cleanly shut down the server
  process.on('SIGTERM', () => bridge.kill('SIGTERM'));
  process.on('SIGINT', () => bridge.kill('SIGINT'));
});
