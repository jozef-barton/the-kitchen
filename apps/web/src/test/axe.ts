import { axe } from 'jest-axe';
import type { RenderResult } from '@testing-library/react';
import { expect } from 'vitest';

type RunOptions = Parameters<typeof axe>[1];

/**
 * Runs axe-core against a rendered container with WCAG 2.2 AA tags.
 */
export async function runAxe(
  container: Element | RenderResult,
  options?: RunOptions
): Promise<Awaited<ReturnType<typeof axe>>> {
  const element = 'container' in container ? (container as RenderResult).container : container as Element;
  return axe(element, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'],
    },
    ...options,
  });
}

/**
 * Asserts zero critical/serious WCAG 2.2 AA violations.
 * Pass strict=true to also fail on moderate/minor violations.
 */
export async function expectNoA11yViolations(
  container: Element | RenderResult,
  options?: RunOptions & { strict?: boolean }
): Promise<void> {
  const { strict = false, ...axeOptions } = options ?? {};
  const results = await runAxe(container, axeOptions as RunOptions);

  const blocking = strict
    ? results.violations
    : results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

  if (blocking.length === 0) return;

  const message = blocking
    .map((v) => {
      const nodes = v.nodes
        .slice(0, 3)
        .map((n) => `    • ${n.html.trim().slice(0, 120)}`)
        .join('\n');
      return `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n${nodes}`;
    })
    .join('\n\n');

  expect.fail(`${blocking.length} a11y violation(s) found:\n\n${message}\n`);
}
