import { defineConfig, devices } from '@playwright/test';

const fixturePort = process.env.PLAYWRIGHT_BRIDGE_PORT ?? '40178';
process.env.PLAYWRIGHT_BRIDGE_PORT = fixturePort;

const baseURL = `http://127.0.0.1:${fixturePort}`;

export default defineConfig({
  testDir: './apps/web/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 120_000,
  retries: 2,
  use: {
    baseURL,
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 960 }
  },
  projects: [
    {
      name: 'default',
      testMatch: /(?<!a11y\/).*\.spec\.ts$/,
    },
    {
      name: 'a11y-desktop',
      testDir: './apps/web/e2e/a11y',
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
        viewport: { width: 1440, height: 900 },
      },
      reporter: [
        ['list'],
        ['json', { outputFile: 'test-results/a11y/a11y-desktop.json' }],
        ['html', { outputFolder: 'playwright-report/a11y-desktop', open: 'never' }],
      ],
    },
    {
      name: 'a11y-mobile',
      testDir: './apps/web/e2e/a11y',
      use: {
        // Use Chrome-based mobile emulation so CI only needs the Chromium browser
        ...devices['Pixel 7'],
        baseURL,
      },
      reporter: [
        ['list'],
        ['json', { outputFile: 'test-results/a11y/a11y-mobile.json' }],
        ['html', { outputFolder: 'playwright-report/a11y-mobile', open: 'never' }],
      ],
    },
    {
      name: 'a11y-dark',
      testDir: './apps/web/e2e/a11y',
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
        viewport: { width: 1440, height: 900 },
        colorScheme: 'dark',
      },
      reporter: [
        ['list'],
        ['json', { outputFile: 'test-results/a11y/a11y-dark.json' }],
      ],
    },
  ],
  webServer: {
    command: 'node apps/web/e2e/start-fixture-server.mjs',
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
