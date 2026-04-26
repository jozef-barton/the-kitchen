import { test } from '@playwright/test';

test('measure checkbox hit target on step-by-step preview', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Navigate to the Recipes page (the recipe book / spaces tab)
  const recipesLink = page.locator('nav a, [role="navigation"] a, a').filter({ hasText: /recipe|spaces/i }).first();
  if (await recipesLink.count()) {
    await recipesLink.click();
    await page.waitForTimeout(1000);
  }

  // Click on Step-by-Step Instructions template if visible
  const stepItem = page.locator('text=/step.by.step|Step.by.Step/i').first();
  if (await stepItem.count()) {
    await stepItem.click();
    await page.waitForTimeout(800);
  }

  // Find all Chakra checkbox controls
  const checkboxControls = page.locator('[data-part="control"]');
  const count = await checkboxControls.count();
  console.log(`Found ${count} checkbox controls`);

  if (count > 0) {
    const box = await checkboxControls.first().boundingBox();
    console.log('Checkbox bounding box:', JSON.stringify(box));

    // Size of click target tells us if it's big enough (min 44px recommended)
    if (box) {
      console.log(`Hit area: ${box.width.toFixed(1)}×${box.height.toFixed(1)}px`);
      console.log(`Center: ${(box.x + box.width/2).toFixed(0)}, ${(box.y + box.height/2).toFixed(0)}`);
    }

    // Check what the Checkbox.Root label bounds are (the actual clickable area)
    const checkboxLabels = page.locator('[data-scope="checkbox"][data-part="root"]');
    if (await checkboxLabels.count() > 0) {
      const labelBox = await checkboxLabels.first().boundingBox();
      console.log('Checkbox ROOT (label) bounding box:', JSON.stringify(labelBox));
    }
  }

  await page.screenshot({ path: '/tmp/checkbox-diagnostic.png', fullPage: false });
});
