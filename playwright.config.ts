import { defineConfig, devices } from '@playwright/test';

const fixturePort = process.env.PLAYWRIGHT_BRIDGE_PORT ?? '40178';
process.env.PLAYWRIGHT_BRIDGE_PORT = fixturePort;

const baseURL = `http://127.0.0.1:${fixturePort}`;

// CI sets this to fan each project out into its own parallel job.
// Valid values: 'desktop' | 'mobile' | 'dark'. Unset = run all (local dev).
const a11yProject = process.env.A11Y_PROJECT;

function makeA11yProject(
  name: string,
  use: Record<string, unknown>
) {
  const slug = name.replace('a11y-', '');
  return {
    name,
    testDir: './apps/web/e2e/a11y',
    fullyParallel: true,
    workers: 3,
    retries: 1,
    use: { ...use, baseURL },
    reporter: [
      ['list'],
      ['json', { outputFile: `test-results/a11y/${slug}.json` }],
      ['html', { outputFolder: `playwright-report/${name}`, open: 'never' }],
    ] as Parameters<typeof defineConfig>[0]['reporter'],
  };
}

const allA11yProjects = [
  makeA11yProject('a11y-desktop', {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
  }),
  makeA11yProject('a11y-mobile', {
    // Chrome-based mobile emulation — only Chromium needed in CI
    ...devices['Pixel 7'],
  }),
  makeA11yProject('a11y-dark', {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  }),
];

const activeA11yProjects = a11yProject
  ? allA11yProjects.filter((p) => p.name === `a11y-${a11yProject}`)
  : allA11yProjects;

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
    ...activeA11yProjects,
  ],
  webServer: {
    command: 'node apps/web/e2e/start-fixture-server.mjs',
    url: `${baseURL}/api/health`,
    // CI jobs each run in an isolated VM — always start fresh.
    // Local dev reuses an already-running server to avoid restart overhead.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
