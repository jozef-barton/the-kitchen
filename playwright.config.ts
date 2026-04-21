import { defineConfig } from '@playwright/test';

const fixturePort = process.env.PLAYWRIGHT_BRIDGE_PORT ?? '40178';
process.env.PLAYWRIGHT_BRIDGE_PORT = fixturePort;

export default defineConfig({
  testDir: './apps/web/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 90_000,
  retries: 1,
  use: {
    baseURL: `http://127.0.0.1:${fixturePort}`,
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 960 }
  },
  webServer: {
    command: 'node apps/web/e2e/start-fixture-server.mjs',
    url: `http://127.0.0.1:${fixturePort}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
