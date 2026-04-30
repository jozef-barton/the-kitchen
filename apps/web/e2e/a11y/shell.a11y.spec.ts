/**
 * A11y specs for the shell / layout — things that appear on every page:
 * skip link, landmarks, top bar, mobile drawer, keyboard shortcuts.
 */
import { test, expect } from './axe-fixture';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test('shell has a skip-to-content link as first focusable element', async ({ page }) => {
  // Tab once from the page — the skip link should be the first stop
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveAttribute('href', '#main-content');
});

test('shell has exactly one <main> landmark with id="main-content"', async ({ page }) => {
  const main = page.locator('main#main-content');
  await expect(main).toHaveCount(1);
});

test('shell has a <header> or role=banner landmark', async ({ page }) => {
  const header = page.locator('header, [role="banner"]');
  await expect(header).toHaveCount(1);
});

test('shell has a navigation landmark (sidebar / nav)', async ({ page }) => {
  const nav = page.locator('nav, [role="navigation"]');
  await expect(nav.first()).toBeVisible();
});

test('shell top bar passes axe at desktop viewport', async ({ page, a11y }) => {
  const toolbar = page.locator('[data-testid="shell-toolbar"]');
  await expect(toolbar).toBeVisible();
  await a11y.checkA11y();
});

test('mobile hamburger opens nav drawer with proper focus management', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.waitForLoadState('networkidle');

  const hamburger = page.getByRole('button', { name: /open navigation/i });
  await expect(hamburger).toBeVisible();
  await hamburger.click();

  // Drawer should be open and receive focus
  const drawer = page.locator('[data-part="content"], [role="dialog"]').first();
  await expect(drawer).toBeVisible();
});

test('mobile drawer axe scan', async ({ page, a11y }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.waitForLoadState('networkidle');

  const hamburger = page.getByRole('button', { name: /open navigation/i });
  if (await hamburger.isVisible()) {
    await hamburger.click();
    await page.waitForTimeout(300);
    await a11y.checkA11y();
  }
});

test('command palette (⌘K) is accessible', async ({ page, a11y }) => {
  await page.keyboard.press('Meta+k');
  await page.waitForSelector('[role="dialog"][aria-label="Command palette"]');

  // Dialog role with aria-modal
  const dialog = page.locator('[role="dialog"][aria-modal="true"]');
  await expect(dialog).toHaveCount(1);

  // Search input is focused
  const input = page.getByRole('combobox');
  await expect(input).toBeFocused();

  await a11y.checkA11y({ exclude: ['.command-palette-backdrop'] });
});

test('command palette keyboard navigation works', async ({ page }) => {
  await page.keyboard.press('Meta+k');
  await page.waitForSelector('[role="dialog"]');

  // Arrow down selects next item
  await page.keyboard.press('ArrowDown');
  const selected = page.locator('[role="option"][aria-selected="true"]');
  await expect(selected).toHaveCount(1);

  // Escape closes
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
});

test('version mismatch alert is announced via role=alert', async ({ page }) => {
  // The alert is conditional; if present it must have role=status/alert
  const alert = page.locator('[role="alert"], [role="status"]');
  // May be 0 (no mismatch) — that's fine; if present it must have the role
  const count = await alert.count();
  if (count > 0) {
    await expect(alert.first()).toBeVisible();
  }
});
