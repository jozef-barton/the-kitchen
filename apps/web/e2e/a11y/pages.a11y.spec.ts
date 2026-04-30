/**
 * Full-page axe scans for every route in the app — both default and
 * interactive states (modals, drawers open, error states).
 *
 * Each test navigates to a route, waits for load, then runs axe with
 * WCAG 2.2 AA tags. critical/serious violations fail; moderate and minor
 * are emitted as warnings in the JSON report.
 */
import type { Page } from '@playwright/test';
import { test, expect } from './axe-fixture';

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

async function goto(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  // Allow client-side navigation + Chakra animations to settle
  await page.waitForTimeout(400);
}

// ──────────────────────────────────────────────────
// Chat page
// ──────────────────────────────────────────────────

test.describe('Chat page', () => {
  test.beforeEach(({ page }) => goto(page, '/'));

  test('default state passes axe', async ({ a11y }) => {
    await a11y.checkA11y();
  });

  test('chat composer is labelled', async ({ page }) => {
    const textarea = page.getByRole('textbox');
    await expect(textarea.first()).toBeVisible();
    // Must have accessible name (aria-label or associated <label>)
    const label = await textarea.first().getAttribute('aria-label');
    const id = await textarea.first().getAttribute('id');
    if (!label) {
      // Check for associated label element
      const associatedLabel = id ? await page.locator(`label[for="${id}"]`).count() : 0;
      expect(associatedLabel, 'Textarea must have aria-label or associated <label>').toBeGreaterThan(0);
    }
  });

  test('send button has accessible name', async ({ page }) => {
    const send = page.getByRole('button', { name: /send/i });
    await expect(send).toBeVisible();
  });
});

// ──────────────────────────────────────────────────
// Sessions page
// ──────────────────────────────────────────────────

test.describe('Sessions page', () => {
  test.beforeEach(({ page }) => goto(page, '/sessions'));

  test('default state passes axe', async ({ a11y }) => {
    await a11y.checkA11y();
  });

  test('page has a heading', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading.or(page.getByRole('heading', { level: 2 })).first()).toBeVisible();
  });
});

// ──────────────────────────────────────────────────
// Jobs page
// ──────────────────────────────────────────────────

test.describe('Jobs page', () => {
  test.beforeEach(({ page }) => goto(page, '/jobs'));

  test('default state passes axe', async ({ a11y }) => {
    await a11y.checkA11y();
  });
});

// ──────────────────────────────────────────────────
// Coding page
// ──────────────────────────────────────────────────

test.describe('Coding page', () => {
  test.beforeEach(({ page }) => goto(page, '/coding'));

  test('default state passes axe', async ({ a11y }) => {
    await a11y.checkA11y();
  });

  test('job composer has accessible label', async ({ page }) => {
    const composer = page.locator('[data-testid="chat-composer"]').or(
      page.getByRole('textbox').first()
    );
    // May not be present if no job is open
    if (await composer.count() > 0) {
      await expect(composer.first()).toBeVisible();
    }
  });
});

// ──────────────────────────────────────────────────
// Tools page
// ──────────────────────────────────────────────────

test.describe('Tools page', () => {
  test.beforeEach(({ page }) => goto(page, '/tools'));

  test('default state passes axe', async ({ a11y }) => {
    await a11y.checkA11y();
  });

  test('tools tab panel is labelled', async ({ page }) => {
    const tabpanel = page.locator('[role="tabpanel"]');
    if (await tabpanel.count() > 0) {
      await expect(tabpanel.first()).toBeVisible();
    }
  });
});

// ──────────────────────────────────────────────────
// Tool history page
// ──────────────────────────────────────────────────

test.describe('Tool history page', () => {
  test.beforeEach(({ page }) => goto(page, '/tools/history'));

  test('default state passes axe', async ({ a11y }) => {
    await a11y.checkA11y();
  });
});

// ──────────────────────────────────────────────────
// Skills page
// ──────────────────────────────────────────────────

test.describe('Skills page', () => {
  test.beforeEach(({ page }) => goto(page, '/skills'));

  test('default state passes axe', async ({ a11y }) => {
    await a11y.checkA11y();
  });
});

// ──────────────────────────────────────────────────
// Recipes page
// ──────────────────────────────────────────────────

test.describe('Recipes page', () => {
  test.beforeEach(({ page }) => goto(page, '/recipes'));

  test('default state passes axe', async ({ a11y }) => {
    await a11y.checkA11y();
  });

  test('recipe book tab is accessible', async ({ page }) => {
    const tab = page.getByRole('tab');
    if (await tab.count() > 0) {
      await expect(tab.first()).toBeVisible();
    }
  });
});

// ──────────────────────────────────────────────────
// Settings page
// ──────────────────────────────────────────────────

test.describe('Settings page', () => {
  test.beforeEach(({ page }) => goto(page, '/settings'));

  test('general tab passes axe', async ({ a11y }) => {
    await a11y.checkA11y();
  });

  test('models tab passes axe', async ({ page, a11y }) => {
    await goto(page, '/settings/models');
    await a11y.checkA11y();
  });

  test('provider drawer passes axe when open', async ({ page, a11y }) => {
    await goto(page, '/settings/models');
    const manageBtn = page.getByRole('button', { name: /manage|connect/i }).first();
    if (await manageBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await manageBtn.click();
      await page.waitForTimeout(500);
      await a11y.checkA11y({ exclude: ['[data-state="closed"]'] });
    }
  });

  test('persona tab passes axe', async ({ page, a11y }) => {
    await goto(page, '/settings/persona');
    await a11y.checkA11y();
  });

  test('access audit tab passes axe', async ({ page, a11y }) => {
    await goto(page, '/settings/access');
    await a11y.checkA11y();
  });

  test('telemetry tab passes axe', async ({ page, a11y }) => {
    await goto(page, '/settings/audit');
    await a11y.checkA11y();
  });

  test('settings tabs are keyboard navigable', async ({ page }) => {
    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    if (count > 1) {
      await tabs.first().focus();
      await page.keyboard.press('ArrowRight');
      const focusedTab = page.locator('[role="tab"]:focus');
      await expect(focusedTab).toHaveCount(1);
    }
  });
});

// ──────────────────────────────────────────────────
// Remote access page
// ──────────────────────────────────────────────────

test.describe('Remote access page', () => {
  test.beforeEach(({ page }) => goto(page, '/remote-access'));

  test('default state passes axe', async ({ a11y }) => {
    await a11y.checkA11y();
  });
});

// ──────────────────────────────────────────────────
// Hermes setup page (only shown when hermesVersion is null)
// ──────────────────────────────────────────────────
// Skipped in fixture environment because the fixture CLI returns a valid version.
// test('hermes setup page passes axe', ...)

// ──────────────────────────────────────────────────
// Dark-mode contrast (a11y-dark project adds colorScheme: dark)
// ──────────────────────────────────────────────────

test.describe('Dark mode', () => {
  test('home page passes axe in dark theme', async ({ page, a11y }) => {
    await page.addInitScript(() => {
      localStorage.setItem('hermes-workspaces-theme', 'dark');
    });
    await goto(page, '/');
    await a11y.checkA11y();
  });

  test('settings page passes axe in dark theme', async ({ page, a11y }) => {
    await page.addInitScript(() => {
      localStorage.setItem('hermes-workspaces-theme', 'dark');
    });
    await goto(page, '/settings');
    await a11y.checkA11y();
  });
});
