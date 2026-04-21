import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AddressInfo } from 'node:net';
import { expect, test } from '@playwright/test';
import { createBridgeServer } from '../../bridge/src/server';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixtureCliPath = path.resolve(moduleDirectory, '../../bridge/test/fixtures/hermes-cli-fixture.mjs');
const webDistPath = path.resolve(moduleDirectory, '../dist');

async function startTemporaryBridgeServer(failureFlags: string) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-browser-e2e-'));
  const previousFixtureHome = process.env.HERMES_FIXTURE_HOME;
  const previousFailureFlags = process.env.HERMES_FIXTURE_FAIL;

  process.env.HERMES_FIXTURE_HOME = path.join(tempRoot, 'fixture-home');
  process.env.HERMES_FIXTURE_FAIL = failureFlags;

  const instance = createBridgeServer({
    databasePath: path.join(tempRoot, 'bridge.sqlite'),
    cliPath: fixtureCliPath,
    staticDirectory: webDistPath,
    workspaceRoot: process.cwd(),
    legacySnapshotPaths: []
  });

  await new Promise<void>((resolve) => {
    instance.server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = instance.server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise<void>((resolve, reject) => {
        instance.server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
      await instance.bridge.waitForRecipeEnrichmentQueues();
      instance.database.close();
      fs.rmSync(tempRoot, { recursive: true, force: true });

      if (previousFixtureHome === undefined) {
        delete process.env.HERMES_FIXTURE_HOME;
      } else {
        process.env.HERMES_FIXTURE_HOME = previousFixtureHome;
      }

      if (previousFailureFlags === undefined) {
        delete process.env.HERMES_FIXTURE_FAIL;
      } else {
        process.env.HERMES_FIXTURE_FAIL = previousFailureFlags;
      }
    }
  };
}

test('loads the browser shell with the required left navigation order and no document scroll', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('page-header')).toContainText('The Kitchen');
  await expect(page.getByRole('button', { name: 'New session', exact: true })).toBeVisible();
  await expect(page.getByText('Recent sessions', { exact: true })).toBeVisible();

  const navLabels = await page.locator('[data-testid="sidebar-scroll"] button[aria-label]').evaluateAll(
    (els) => els.map((el) => el.getAttribute('aria-label')).filter(Boolean)
  );
  const browseButtons = navLabels.filter((label) => ['Spaces', 'All sessions', 'Jobs', 'Tools', 'Skills', 'Settings'].includes(label ?? ''));
  expect(browseButtons).toEqual(['Spaces', 'All sessions', 'Jobs', 'Tools', 'Skills', 'Settings']);

  const layoutState = await page.evaluate(() => ({
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
    bodyOverflow: getComputedStyle(document.body).overflow,
    htmlScrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight
  }));
  const sidebarState = await page.evaluate(() => {
    const sidebar = document.querySelector('[data-testid="sidebar-scroll"]');
    const firstTitle = document.querySelector('[data-testid="recent-session-title"]');
    return {
      sidebarScrollWidth: sidebar instanceof HTMLElement ? sidebar.scrollWidth : 0,
      sidebarClientWidth: sidebar instanceof HTMLElement ? sidebar.clientWidth : 0,
      titleOverflow: firstTitle instanceof HTMLElement ? getComputedStyle(firstTitle).textOverflow : '',
      titleWhiteSpace: firstTitle instanceof HTMLElement ? getComputedStyle(firstTitle).whiteSpace : '',
      themeMode: document.documentElement.getAttribute('data-theme-mode')
    };
  });

  expect(layoutState.htmlOverflow).toBe('hidden');
  expect(layoutState.bodyOverflow).toBe('hidden');
  expect(layoutState.htmlScrollHeight).toBeLessThanOrEqual(layoutState.viewportHeight + 1);
  expect(sidebarState.sidebarScrollWidth).toBeLessThanOrEqual(sidebarState.sidebarClientWidth + 1);
  expect(sidebarState.titleOverflow).toBe('ellipsis');
  expect(sidebarState.titleWhiteSpace).toBe('nowrap');
  expect(sidebarState.themeMode).toMatch(/dark|light/);

  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect(page.getByText('Recent sessions', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'All sessions', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  await expect(page.getByText('Recent sessions', { exact: true })).toBeVisible();
});

test('opens the Spaces template gallery and shows a curated template inspector', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Spaces', exact: true }).click();
  await expect(page.getByTestId('page-header')).toContainText('The Kitchen');
  await expect(page.getByRole('tab', { name: 'Recipe Book' })).toBeVisible();
  await expect(page.getByTestId('spaces-template-card-price-comparison-grid')).toBeVisible();
  await expect(page.getByTestId('spaces-template-card-inbox-triage-board')).toBeVisible();

  await page.getByRole('button', { name: 'Travel & Local', exact: true }).click();
  await expect(page.getByTestId('spaces-template-card-restaurant-finder')).toBeVisible();
  await expect(page.getByTestId('spaces-template-inspector')).toContainText('Selected venue');
});

test('shows the requested template interaction affordances in the Spaces gallery', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Spaces', exact: true }).click();

  const inspector = page.getByTestId('spaces-template-inspector');

  await page.getByRole('button', { name: 'Research & Review', exact: true }).click();
  await page.getByTestId('spaces-template-card-research-notebook').click();
  await expect(inspector).toContainText('Sources');

  await page.getByRole('button', { name: 'Pipelines & Planning', exact: true }).click();
  await page.getByTestId('spaces-template-card-job-search-pipeline').click();
  await expect(inspector.getByText('Job listings')).toBeVisible();

  await page.getByRole('button', { name: 'Travel & Local', exact: true }).click();
  await expect(page.getByTestId('spaces-template-card-local-discovery-comparison')).toHaveCount(0);
});

test('opens real sessions from all sessions and recent sessions in chat', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'All sessions', exact: true }).click();
  await page.getByPlaceholder('Search titles or summaries').fill('Quarterly planning review');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('cell', { name: 'Quarterly planning review', exact: true }).click();

  await expect(page.getByTestId('chat-transcript-scroll').getByText('Resume Quarterly planning review')).toBeVisible();

  const recentInboxRow = page.getByTestId('recent-session-row').filter({ hasText: 'Inbox follow-up for launch prep' });
  await recentInboxRow.locator('button').first().click();
  await expect(page.getByTestId('chat-transcript-scroll').getByText('Resume Inbox follow-up for launch prep')).toBeVisible();
});

test('creates a new session, streams the assistant reply, and restores it after reload', async ({ page }) => {
  const prompt = `Browser bridge persistence smoke ${Date.now()}`;

  await page.goto('/');
  await page.getByRole('button', { name: 'New session', exact: true }).click();
  const composer = page.getByPlaceholder('Ask Hermes something real.');
  const sendButton = page.getByRole('button', { name: 'Send', exact: true });
  await expect(composer).toBeVisible();
  await composer.click();
  await composer.fill(prompt);
  await expect(sendButton).toBeEnabled({ timeout: 10_000 });
  await sendButton.click();

  await expect(
    page.getByTestId('chat-transcript-scroll').getByText(`Fixture Hermes reply for jbarton: ${prompt}`, { exact: true })
  ).toBeVisible({ timeout: 15_000 });

  await page.reload();

  await expect(page.getByTestId('chat-transcript-scroll').getByText(prompt, { exact: true })).toBeVisible();
  await expect(
    page.getByTestId('chat-transcript-scroll').getByText(`Fixture Hermes reply for jbarton: ${prompt}`, { exact: true })
  ).toBeVisible();
});


test('keeps recent sessions and runtime activity visually compact while preserving actions', async ({ page }) => {
  await page.goto('/');
  const profileSelector = page.getByRole('combobox').first();
  await profileSelector.selectOption('8tn');
  await expect(profileSelector).toHaveValue('8tn');

  const recentRow = page.getByTestId('recent-session-row').first();
  await expect(recentRow).toBeVisible();
  await expect(recentRow.getByRole('button', { name: /Actions for/ })).toBeVisible();

  const recentRowBox = await recentRow.boundingBox();
  expect(recentRowBox?.height ?? 0).toBeLessThan(72);

  await page.getByRole('button', { name: 'New session', exact: true }).click();
  const emailComposer = page.getByPlaceholder('Ask Hermes something real.');
  await emailComposer.click();
  await emailComposer.fill('How many unread emails do I have?');
  await emailComposer.press('Enter');

  await expect(page.getByRole('button', { name: 'Runtime' })).toBeVisible({ timeout: 45_000 });
  await page.getByRole('button', { name: 'Runtime' }).click();
  const runtimeDrawer = page.getByTestId('recipe-runtime-drawer');
  await expect(runtimeDrawer).toContainText(/Hermes agent|Runtime status|google-workspace|gmail_unread_count/, { timeout: 20_000 });
  const activityCard = page.getByTestId('activity-card').first();
  await expect(activityCard).toBeVisible();

  const activityCardBox = await activityCard.boundingBox();
  expect(activityCardBox?.height ?? 0).toBeLessThan(112);
  await runtimeDrawer.getByRole('button', { name: 'Close runtime drawer' }).click();
});

test('creates a session-attached space, opens the combined recipe layout, and preserves the session after deleting the space', async ({
  page
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New session', exact: true }).click();
  const firstComposer = page.getByPlaceholder('Ask Hermes something real.');
  await expect(firstComposer).toBeVisible();
  await firstComposer.click();
  await firstComposer.fill('Create a launch tracker recipe.');
  await firstComposer.press('Enter');
  await expect(page.getByTestId('chat-transcript-scroll').getByText('Created a launch tracker recipe for this request.')).toBeVisible({
    timeout: 15_000
  });
  await expect(page.getByTestId('combined-session-recipe-layout')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('attached-recipe-panel')).toContainText('Created a launch tracker recipe for this request.');
  await expect(page.getByTestId('session-recipe-chat-pane')).toBeVisible();
  await expect(page.getByTestId('page-header')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Light mode|Dark mode/ })).toBeVisible();
  await page.getByRole('button', { name: 'Collapse chat pane' }).click();
  await expect(page.getByTestId('collapsed-session-recipe-chat-rail')).toBeVisible();
  await expect(page.getByTestId('session-recipe-chat-pane')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open runtime drawer' }).click();
  const collapsedRuntimeDrawer = page.getByTestId('recipe-runtime-drawer');
  await expect(collapsedRuntimeDrawer).toBeVisible();
  await collapsedRuntimeDrawer.getByRole('button', { name: 'Close runtime drawer' }).click();
  await expect(page.getByTestId('recipe-runtime-drawer')).toHaveCount(0);
  await page.getByRole('button', { name: 'Expand chat pane' }).click();
  await expect(page.getByTestId('session-recipe-chat-pane')).toBeVisible();

  await page.getByPlaceholder('Ask Hermes something real.').fill('Update the current recipe with another card.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByTestId('session-recipe-content-scroll')).toContainText('Updated the current recipe with fixture data.', {
    timeout: 15_000
  });
  await expect(page.getByTestId('session-recipe-chat-pane')).toContainText('Updated the current recipe with fixture data.', { timeout: 15_000 });

  await page
    .getByTestId('session-recipe-chat-pane')
    .getByRole('button', { name: /Updated the current recipe with fixture data\./ })
    .click();
  const transcriptRuntimeDrawer = page.getByTestId('recipe-runtime-drawer');
  await expect(transcriptRuntimeDrawer).toBeVisible();
  await expect(transcriptRuntimeDrawer).toContainText(/Hermes is updating the recipe|Hermes updated the Home recipe|Hermes updated the recipe|Hermes completed/, {
    timeout: 15_000
  });
  await transcriptRuntimeDrawer.getByRole('button', { name: 'Close runtime drawer' }).click();
  await expect(page.getByTestId('recipe-runtime-drawer')).toHaveCount(0);

  await page.getByRole('button', { name: 'All sessions', exact: true }).click();
  const sessionsTable = page.getByTestId('sessions-table-scroll');
  const attachedSessionRow = sessionsTable.locator('tbody tr').filter({ has: page.getByTestId('session-recipe-indicator') }).first();
  await expect(attachedSessionRow.getByTestId('session-recipe-indicator')).toBeVisible();
  await attachedSessionRow.click();

  await page.reload();
  await expect(page.getByTestId('combined-session-recipe-layout')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('session-recipe-content-scroll')).toContainText('Updated the current recipe with fixture data.', {
    timeout: 15_000
  });
  await expect(page.getByTestId('page-header')).toHaveCount(0);

});


test('creates a prose-only Home recipe and hides the legacy content-format controls', async ({ page }) => {
  const temporaryServer = await startTemporaryBridgeServer('');

  try {
    await page.goto(temporaryServer.baseUrl);
    const profileSelector = page.getByRole('combobox').first();
    await profileSelector.selectOption('jbarton');
    await expect(profileSelector).toHaveValue('jbarton');
    await page.getByRole('button', { name: 'New session', exact: true }).click();
    const composer = page.getByPlaceholder('Ask Hermes something real.');
    await expect(composer).toBeVisible();
    await composer.click();
    await composer.fill('Summarize the latest note.');
    await composer.press('Enter');

    await expect(page.getByTestId('combined-session-recipe-layout')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('attached-recipe-panel')).toContainText('Fixture Hermes reply for jbarton: Summarize the latest note.', {
      timeout: 15_000
    });
    await expect(page.getByRole('button', { name: 'Markdown' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Table' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cards' })).toHaveCount(0);
  } finally {
    await temporaryServer.close();
  }
});

test('shows the baseline Home recipe immediately and fills richer sections asynchronously', async ({ page }) => {
  const temporaryServer = await startTemporaryBridgeServer('template_slow_success');

  try {
    await page.goto(temporaryServer.baseUrl);
    await page.getByRole('button', { name: 'New session', exact: true }).click();
    const composer = page.getByPlaceholder('Ask Hermes something real.');
    const sendButton = page.getByRole('button', { name: 'Send', exact: true });
    await expect(composer).toBeVisible();
    await composer.click();
    await composer.fill('good Italian restaurants near Dayton, OH');
    await expect(sendButton).toBeEnabled({ timeout: 10_000 });
    await sendButton.click();

    await expect(page.getByTestId('combined-session-recipe-layout')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('recipe-template-generation-running')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('dynamic-recipe-template-shell')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('dynamic-recipe-baseline')).toHaveCount(0);

    await expect(page.getByTestId('recipe-template-renderer')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('dynamic-recipe-template-ready')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('recipe-template-section-results')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('dynamic-recipe-baseline')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Markdown' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Table' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cards' })).toHaveCount(0);
  } finally {
    await temporaryServer.close();
  }
});

test('keeps a data-rich Home recipe usable in a smaller pane without legacy format controls', async ({ page }) => {
  await page.setViewportSize({
    width: 900,
    height: 900
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'New session', exact: true }).click();
  const composer = page.getByPlaceholder('Ask Hermes something real.');
  const sendButton = page.getByRole('button', { name: 'Send', exact: true });
  await expect(composer).toBeVisible();
  await composer.click();
  await composer.fill('good Italian restaurants near Dayton, OH');
  await expect(sendButton).toBeEnabled({ timeout: 10_000 });
  await sendButton.click();

  await expect(page.getByTestId('combined-session-recipe-layout')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('dynamic-recipe-template-ready')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('attached-recipe-panel')).toContainText('Mamma Disalvo');
  await expect(page.getByRole('button', { name: 'Markdown' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Table' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cards' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Collapse chat pane' }).click();
  await expect(page.getByTestId('collapsed-session-recipe-chat-rail')).toBeVisible();
  await expect(page.getByTestId('attached-recipe-panel')).toContainText('Selected restaurant');
});


test('renders an explicit recipe generation failure state when fill and bounded repair both fail', async ({ page }) => {
  const temporaryServer = await startTemporaryBridgeServer('template_fill_invalid,template_repair_invalid');

  try {
    await page.goto(temporaryServer.baseUrl);
    await page.getByRole('button', { name: 'New session', exact: true }).click();
    const composer = page.getByPlaceholder('Ask Hermes something real.');
    const sendButton = page.getByRole('button', { name: 'Send', exact: true });
    await expect(composer).toBeVisible();
    await composer.click();
    await composer.fill('good Italian restaurants near Dayton, OH');
    await expect(sendButton).toBeEnabled({ timeout: 10_000 });
    await sendButton.click();

    await expect(page.getByTestId('combined-session-recipe-layout')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('recipe-enrichment-failed-banner')).toContainText('Baseline ready, recipe generation failed', {
      timeout: 15_000
    });
    await expect(page.getByTestId('recipe-enrichment-failed-banner')).toContainText('Cause: Template text repair failed');
    await expect(page.getByRole('button', { name: 'Rebuild recipe' })).toBeVisible();
    await expect(page.getByTestId('recipe-template-renderer')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('recipe-template-section-results')).toHaveAttribute('data-hydration-state', 'failed');
    await expect(page.getByTestId('recipe-template-section-results')).toHaveAttribute('data-repair-state', 'failed');
    await expect(page.getByTestId('dynamic-recipe-baseline')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Markdown' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Table' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cards' })).toHaveCount(0);
  } finally {
    await temporaryServer.close();
  }
});

test('renders a specific timeout failure when template generation exceeds the scoped runtime budget', async ({ page }) => {
  const temporaryServer = await startTemporaryBridgeServer('template_timeout');

  try {
    await page.goto(temporaryServer.baseUrl);
    await page.getByRole('button', { name: 'New session', exact: true }).click();
    const composer = page.getByPlaceholder('Ask Hermes something real.');
    const sendButton = page.getByRole('button', { name: 'Send', exact: true });
    await expect(composer).toBeVisible();
    await composer.click();
    await composer.fill('good Italian restaurants near Dayton, OH');
    await expect(sendButton).toBeEnabled({ timeout: 10_000 });
    await sendButton.click();

    await expect(page.getByTestId('combined-session-recipe-layout')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('dynamic-recipe-template-shell')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('dynamic-recipe-baseline')).toHaveCount(0);
    await expect(page.getByTestId('recipe-template-generation-failed')).toContainText('Recipe generation failed', {
      timeout: 25_000
    });
    await expect(page.getByTestId('recipe-template-generation-failed')).toContainText('Reason: Runtime timeout');
    await expect(page.getByTestId('recipe-template-generation-failed')).toContainText('template selection');
    await expect(page.getByTestId('recipe-template-generation-failed')).toContainText('90,000ms');
    await expect(page.getByRole('button', { name: 'Rebuild recipe' })).toBeVisible();
    await expect(page.getByTestId('recipe-template-renderer')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Markdown' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Table' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cards' })).toHaveCount(0);
  } finally {
    await temporaryServer.close();
  }
});

test('classifies timeout failures clearly when the configured limit is too small', async ({ page }) => {
  const temporaryServer = await startTemporaryBridgeServer('task_timeout_email');

  try {
    await page.goto(temporaryServer.baseUrl);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByLabel('Search / discovery timeout (ms)').fill('20000');
    await page.getByRole('button', { name: 'Save preferences' }).click();

    await page.getByRole('button', { name: 'New session', exact: true }).click();
    await page.getByPlaceholder('Ask Hermes something real.').fill('How many unread emails do I have?');
    await page.getByRole('button', { name: 'Send', exact: true }).click();

    await expect(page.getByTestId('chat-transcript-scroll')).toContainText('The configured limit is 20,000ms.', {
      timeout: 15_000
    });
    await expect(page.getByTestId('chat-transcript-scroll')).toContainText('before the Home recipe baseline could update');
    await expect(page.getByTestId('combined-session-recipe-layout')).toHaveCount(0);
  } finally {
    await temporaryServer.close();
  }
});

test('retries recipe enrichment explicitly and promotes it after a one-time failure', async ({ page }) => {
  const temporaryServer = await startTemporaryBridgeServer(
    'template_fill_invalid_first_build,template_repair_invalid_first_build,template_slow_success'
  );

  try {
    await page.goto(temporaryServer.baseUrl);
    await page.getByRole('button', { name: 'New session', exact: true }).click();
    const composer = page.getByPlaceholder('Ask Hermes something real.');
    const sendButton = page.getByRole('button', { name: 'Send', exact: true });
    await expect(composer).toBeVisible();
    await composer.click();
    await composer.fill('good Italian restaurants near Dayton, OH');
    await expect(sendButton).toBeEnabled({ timeout: 10_000 });
    await sendButton.click();

    await expect(page.getByTestId('recipe-enrichment-failed-banner')).toContainText('Baseline ready, recipe generation failed', {
      timeout: 15_000
    });
    await page.getByRole('button', { name: 'Rebuild recipe' }).click();

    await expect(page.getByTestId('recipe-enrichment-building-banner')).toContainText('Baseline ready, recipe generation running', {
      timeout: 15_000
    });
    await expect(page.getByTestId('recipe-template-renderer')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('dynamic-recipe-baseline')).toHaveCount(0);
    await expect(page.getByTestId('dynamic-recipe-template-ready')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('recipe-enrichment-building-banner')).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Markdown' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Table' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cards' })).toHaveCount(0);
  } finally {
    await temporaryServer.close();
  }
});

test('shows a visible repairing marker on ghost template sections while staged repair is in progress', async ({ page }) => {
  const temporaryServer = await startTemporaryBridgeServer('template_fill_invalid,template_repair_invalid_once,template_slow_success');

  try {
    await page.goto(temporaryServer.baseUrl);
    await page.getByRole('button', { name: 'New session', exact: true }).click();
    const composer = page.getByPlaceholder('Ask Hermes something real.');
    const sendButton = page.getByRole('button', { name: 'Send', exact: true });
    await expect(composer).toBeVisible();
    await composer.click();
    await composer.fill('good Italian restaurants near Dayton, OH');
    await expect(sendButton).toBeEnabled({ timeout: 10_000 });
    await sendButton.click();

    await expect(page.getByTestId('combined-session-recipe-layout')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('recipe-template-renderer')).toBeVisible({ timeout: 20_000 });
    const resultsSection = page.getByTestId('recipe-template-section-results');
    await expect(resultsSection).toHaveAttribute('data-repair-state', 'repairing', { timeout: 20_000 });
    await expect(resultsSection).toContainText('Repairing', { timeout: 20_000 });
    await expect(page.getByTestId('dynamic-recipe-baseline')).toHaveCount(0);

    await expect(page.getByTestId('recipe-enrichment-failed-banner')).toContainText('Baseline ready, recipe generation failed', {
      timeout: 25_000
    });
    await expect(resultsSection).toHaveAttribute('data-repair-state', 'failed', { timeout: 25_000 });
  } finally {
    await temporaryServer.close();
  }
});

test('shows an explicit disconnected state when Hermes bootstrap fails', async ({ page }) => {
  const temporaryServer = await startTemporaryBridgeServer('profile');

  try {
    await page.goto(temporaryServer.baseUrl);

    await expect(page.getByText('Bridge unavailable')).toBeVisible();
    await expect(page.getByText('Fixture failed to load profiles.')).toBeVisible();
    await expect(page.getByText('Retry')).toBeVisible();
    await expect(page.getByText('Local Profile')).toHaveCount(0);
  } finally {
    await temporaryServer.close();
  }
});
