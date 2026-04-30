import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(cleanup);
import { ThemeToggle } from './ThemeToggle';
import { expectNoA11yViolations } from '../../test/axe';

vi.mock('@hermes-recipes/ui', () => ({
  useHermesTheme: () => ({
    themeMode: 'dark',
    setThemeMode: vi.fn(),
  }),
}));

function renderToggle(onPersist = vi.fn()) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ThemeToggle onPersist={onPersist} />
    </ChakraProvider>
  );
}

describe('ThemeToggle a11y', () => {
  it('has no axe violations', async () => {
    const { container } = renderToggle();
    await expectNoA11yViolations(container);
  });

  it('button has an accessible name', () => {
    renderToggle();
    const button = screen.getByRole('button');
    expect(button).toHaveAccessibleName();
  });

  it('aria-label describes the action (not the current state)', () => {
    renderToggle();
    const button = screen.getByRole('button');
    // When dark mode is active the label should say "Switch to light mode"
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('button icon is decorative (aria-hidden)', () => {
    const { container } = renderToggle();
    const svgs = container.querySelectorAll('svg');
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('is keyboard activatable', async () => {
    const persist = vi.fn();
    renderToggle(persist);
    const button = screen.getByRole('button');
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(persist).toHaveBeenCalledOnce();
  });
});
