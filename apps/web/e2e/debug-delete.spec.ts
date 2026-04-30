import { test, expect } from '@playwright/test';

test('delete provider button visible on last step of connected provider', async ({ page }) => {
  await page.goto('/settings/model');
  await page.waitForTimeout(1000);

  // Click the Models tab
  await page.getByRole('tab', { name: 'Models' }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/01-models-tab.png', fullPage: true });

  // Find Manage button scoped to the tab content (not the sidebar)
  // The provider grid is inside a Tabs.Content panel
  const tabContent = page.locator('[data-state="active"]').or(page.locator('[role="tabpanel"]')).last();
  const manageBtn = tabContent.getByRole('button', { name: 'Manage' }).first();
  const hasManage = await manageBtn.isVisible({ timeout: 2000 }).catch(() => false);
  console.log('Has Manage button in tab content:', hasManage);

  if (!hasManage) {
    // No connected provider — just verify the grid rendered
    console.log('No connected provider found (expected if none configured).');
    await expect(tabContent.getByRole('button', { name: /connect/i }).first()).toBeVisible();
    return;
  }

  await manageBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/02-provider-drawer.png', fullPage: true });

  // The drawer should be open — check it has a title (provider name)
  const drawerTitle = page.getByRole('heading').filter({ hasText: /.+/ }).last();
  console.log('Drawer title:', await drawerTitle.innerText().catch(() => 'n/a'));

  // Navigate to the last step via stepper or wait for it to land there
  const stepItems = await page.locator('[data-part="item"]').all();
  console.log('Step count:', stepItems.length);
  if (stepItems.length > 1) {
    // Click the last stepper item to jump to the final step
    await stepItems[stepItems.length - 1].click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/03-last-step.png', fullPage: true });
  }

  // Delete provider button must be visible in the footer
  const deleteBtn = page.getByRole('button', { name: /delete provider/i });
  await expect(deleteBtn).toBeVisible({ timeout: 3000 });
  console.log('✓ Delete provider button is visible');

  // Click it — should show confirm step
  await deleteBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/04-confirm-delete.png', fullPage: true });

  await expect(page.getByRole('button', { name: /delete provider/i }).last()).toBeVisible();
  await expect(page.getByText(/permanently remove/i)).toBeVisible();
  console.log('✓ Confirm delete step shown');
});
