/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { AxeResults } from 'axe-core';

export type A11yPage = {
  /**
   * Runs axe on the current page with WCAG 2.2 AA rule tags.
   * Blocking violations (wcag2a, wcag2aa, wcag21aa, wcag22aa) fail the test.
   * best-practice and wcag2aaa are reported but not blocking.
   */
  checkA11y(options?: {
    /** Additional CSS selectors to exclude from the scan */
    exclude?: string[];
    /** If true, wcag2aaa violations also fail */
    strict?: boolean;
  }): Promise<AxeResults>;
};

// color-contrast is excluded from automated E2E scans: headless Chromium on
// Linux produces false positives because CSS custom-property stacking and
// layer compositing cannot be accurately measured without a real display.
// Contrast is verified via the manual runbook (docs/a11y-manual-runbook.md).
const DISABLED_RULES = ['color-contrast'];

export const test = base.extend<{ a11y: A11yPage }>({
  a11y: async ({ page }, use) => {
    const a11y: A11yPage = {
      async checkA11y({ exclude = [], strict = false } = {}) {
        const builder = new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .disableRules(DISABLED_RULES)
          .exclude(['[data-testid="hermes-home-brand"]']); // emoji logo, decorative

        for (const sel of exclude) {
          builder.exclude(sel);
        }

        const results = await builder.analyze();

        const blocking = results.violations.filter((v) =>
          strict
            ? true
            : ['critical', 'serious'].includes(v.impact ?? '')
        );

        if (blocking.length > 0) {
          const summary = blocking.map((v) => {
            const nodes = v.nodes
              .slice(0, 3)
              .map((n) => `  • ${n.html.trim().slice(0, 120)}`)
              .join('\n');
            return `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n${nodes}`;
          }).join('\n\n');
          expect(blocking, `a11y violations:\n\n${summary}\n`).toHaveLength(0);
        }

        return results;
      },
    };
    await use(a11y);
  },
});

export { expect };
