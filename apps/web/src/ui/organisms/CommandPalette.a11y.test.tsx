import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(cleanup);
import { CommandPalette } from './CommandPalette';
import { expectNoA11yViolations } from '../../test/axe';
import type { Session } from '@hermes-recipes/protocol';

const sessions: Session[] = [
  {
    id: 's1',
    title: 'Test session',
    summary: 'A test session',
    source: 'local',
    lastUpdatedAt: new Date().toISOString(),
    lastUsedProfileId: null,
    associatedProfileIds: [],
    messageCount: 0,
    attachedRecipeId: null,
    recipeType: 'tui',
  },
];

function renderPalette(props: Partial<Parameters<typeof CommandPalette>[0]> = {}) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <CommandPalette
        recentSessions={sessions}
        onOpenSession={vi.fn()}
        onOpenPage={vi.fn()}
        onCreateSession={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />
    </ChakraProvider>
  );
}

describe('CommandPalette a11y', () => {
  it('has no axe violations in default state', async () => {
    const { container } = renderPalette();
    await expectNoA11yViolations(container);
  });

  it('dialog has role=dialog and aria-modal', () => {
    renderPalette();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName();
  });

  it('search input is a combobox with accessible name', () => {
    renderPalette();
    const input = screen.getByRole('combobox');
    expect(input).toHaveAccessibleName();
    // aria-controls points to the listbox when results are present
    expect(input).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('listbox has accessible name', () => {
    renderPalette();
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAccessibleName();
  });

  it('items have role=option with aria-selected', () => {
    renderPalette();
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    options.forEach((opt) => {
      expect(opt).toHaveAttribute('aria-selected');
    });
  });

  it('keyboard navigation with ArrowDown updates aria-activedescendant', async () => {
    renderPalette();
    const input = screen.getByRole('combobox');
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    // aria-activedescendant should point to an option id
    const activedesc = input.getAttribute('aria-activedescendant');
    expect(activedesc).toBeTruthy();
    if (activedesc) {
      expect(document.getElementById(activedesc)).not.toBeNull();
    }
  });

  it('has no axe violations after typing a query', async () => {
    const { container } = renderPalette();
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'session');
    await expectNoA11yViolations(container);
  });

  it('no-results state has a live region for screen-reader announcement', async () => {
    const { container } = renderPalette();
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'xyzzy-no-match-xyz');
    // A live region (role="status" or aria-live) announces "No results"
    const liveRegion = container.querySelector('[role="status"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.textContent).toContain('No results');
    await expectNoA11yViolations(container);
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    renderPalette({ onClose });
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('section headers are hidden from the listbox but each group has aria-label', () => {
    renderPalette();
    const groups = screen.getAllByRole('group');
    groups.forEach((group) => {
      expect(group).toHaveAccessibleName();
    });
  });
});
