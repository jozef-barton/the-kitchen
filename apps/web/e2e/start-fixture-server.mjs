#!/usr/bin/env node
/**
 * Playwright fixture server — starts the bridge in fixture mode and serves
 * the built web app from apps/web/dist on the fixture port.
 *
 * Invoked by playwright.config.ts webServer.command.
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const port = Number.parseInt(process.env.PLAYWRIGHT_BRIDGE_PORT ?? '40178', 10);
const webDistDir = path.resolve(repoRoot, 'apps/web/dist');
const bridgeServerEntry = path.resolve(repoRoot, 'apps/bridge/dist/apps/bridge/src/server.js');
const fixtureCli = path.resolve(repoRoot, 'apps/bridge/test/fixtures/hermes-cli-fixture.mjs');
const fixtureDir = path.resolve(repoRoot, 'tmp/playwright-fixture');
const fixtureHome = path.resolve(fixtureDir, 'fixture-home');
const dbPath = path.resolve(fixtureDir, 'hermes-workspaces-e2e.sqlite');

// Ensure fixture directories exist
fs.mkdirSync(fixtureDir, { recursive: true });
fs.mkdirSync(fixtureHome, { recursive: true });

// Set environment variables read by the bridge server
process.env.HERMES_FIXTURE_HOME = fixtureHome;
process.env.BRIDGE_PORT = String(port);
process.env.BRIDGE_STATIC_DIR = webDistDir;

if (!fs.existsSync(bridgeServerEntry)) {
  process.stderr.write(
    `[fixture-server] ERROR: Bridge dist not found at ${bridgeServerEntry}\n` +
    `Run 'pnpm build --filter @hermes-recipes/bridge' first.\n`
  );
  process.exit(1);
}

if (!fs.existsSync(webDistDir)) {
  process.stderr.write(
    `[fixture-server] ERROR: Web dist not found at ${webDistDir}\n` +
    `Run 'pnpm build --filter @hermes-recipes/web' first.\n`
  );
  process.exit(1);
}

// Inject argv flags the bridge server reads
process.argv = [
  process.argv[0],
  bridgeServerEntry,
  '--port', String(port),
  '--static-dir', webDistDir,
  '--cli-path', fixtureCli,
  '--db-path', dbPath,
  '--fixture',
];

process.stdout.write(`[fixture-server] Starting bridge on port ${port}\n`);
process.stdout.write(`[fixture-server] Static dir: ${webDistDir}\n`);
process.stdout.write(`[fixture-server] Fixture home: ${fixtureHome}\n`);

await import(bridgeServerEntry);
