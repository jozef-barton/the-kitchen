import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(cleanup);
import { ConfirmDialog } from './ConfirmDialog';
import { expectNoA11yViolations } from '../../test/axe';

function renderDialog(open: boolean, props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ConfirmDialog
        open={open}
        onOpenChange={vi.fn()}
        title="Delete session"
        description="This action cannot be undone. Are you sure?"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
        {...props}
      />
    </ChakraProvider>
  );
}

describe('ConfirmDialog a11y', () => {
  it('has no axe violations when closed', async () => {
    const { container } = renderDialog(false);
    await expectNoA11yViolations(container);
  });

  it('has no axe violations when open', async () => {
    const { container } = renderDialog(true);
    await expectNoA11yViolations(container);
  });

  it('dialog has role=alertdialog when open', () => {
    renderDialog(true);
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
  });

  it('dialog has accessible title', () => {
    renderDialog(true);
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAccessibleName('Delete session');
  });

  it('confirm and cancel buttons are present with accessible names', () => {
    renderDialog(true);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onOpenChange when Cancel is clicked', async () => {
    const onOpenChange = vi.fn();
    renderDialog(true, { onOpenChange });
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderDialog(true, { onConfirm });
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
