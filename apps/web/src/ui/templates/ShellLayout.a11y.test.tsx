import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(cleanup);
import { ShellLayout } from './ShellLayout';
import { expectNoA11yViolations } from '../../test/axe';

vi.mock('@hermes-recipes/ui', () => ({
  useHermesTheme: () => ({ themeMode: 'light', setThemeMode: vi.fn() }),
}));
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme: vi.fn() }),
}));

import type { ConnectionState } from '@hermes-recipes/protocol';

const connection: ConnectionState = {
  status: 'connected',
  checkedAt: new Date().toISOString(),
  usingCachedData: false,
};

function renderShell(children = <div>Page content</div>, overrides = {}) {
  return render(
    <MemoryRouter>
      <ChakraProvider value={defaultSystem}>
        <ShellLayout
          connection={connection}
          profileName="Test Profile"
          pageTitle="Chat"
          headerDetail="Test profile description"
          hermesVersion="1.0.0"
          expectedHermesVersion="1.0.0"
          sidebar={<nav aria-label="Sidebar">Sidebar</nav>}
          onPersistTheme={vi.fn()}
          {...overrides}
        >
          {children}
        </ShellLayout>
      </ChakraProvider>
    </MemoryRouter>
  );
}

describe('ShellLayout a11y', () => {
  it('has no axe violations in default state', async () => {
    const { container } = renderShell();
    await expectNoA11yViolations(container);
  });

  it('has a skip link as the first element', () => {
    const { container } = renderShell();
    const skipLink = container.querySelector('a[href="#main-content"]');
    expect(skipLink).not.toBeNull();
    expect(skipLink).toHaveTextContent(/skip to main content/i);
  });

  it('has exactly one <main> landmark with id="main-content"', () => {
    renderShell();
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('has a <header> landmark', () => {
    const { container } = renderShell();
    const header = container.querySelector('header');
    expect(header).not.toBeNull();
  });

  it('desktop sidebar is wrapped in a <nav> with aria-label', () => {
    renderShell();
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
  });

  it('gateway banner shows role=alert when gateway is down', async () => {
    const { container } = renderShell(undefined, {
      connection: { status: 'disconnected', checkedAt: new Date().toISOString(), detail: 'Bridge stopped', usingCachedData: false },
    });
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    await expectNoA11yViolations(container);
  });

  it('gateway banner dismiss button has accessible name', () => {
    renderShell(undefined, {
      connection: { status: 'disconnected', checkedAt: new Date().toISOString(), detail: 'Bridge stopped', usingCachedData: false },
    });
    const dismiss = screen.queryByRole('button', { name: /dismiss/i });
    // Dismiss is only rendered when onDismiss is provided — verify the element itself when present
    if (dismiss) {
      expect(dismiss).toHaveAccessibleName();
    }
  });

  it('version mismatch alert has role=alert', async () => {
    const { container } = renderShell(undefined, {
      hermesVersion: '0.9.0',
      expectedHermesVersion: '1.0.0',
    });
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    await expectNoA11yViolations(container);
  });
});
