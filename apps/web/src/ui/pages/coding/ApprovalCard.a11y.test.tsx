import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(cleanup);
import { ApprovalCard } from './ApprovalCard';
import { expectNoA11yViolations } from '../../../test/axe';
import type { ApprovalIntent } from './detectApprovalIntent';

const genericIntent: ApprovalIntent = {
  isApprovalRequest: true,
  category: 'generic',
  question: 'Do you want to run this command?',
  affirmativeText: 'Approve',
  negativeText: 'Deny',
};

const destructiveIntent: ApprovalIntent = {
  isApprovalRequest: true,
  category: 'destructive',
  question: 'This will permanently delete files. Continue?',
  affirmativeText: 'Delete',
  negativeText: 'Cancel',
};

function renderCard(intent: ApprovalIntent, props: Partial<Parameters<typeof ApprovalCard>[0]> = {}) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ApprovalCard
        intent={intent}
        mode="turn"
        onApprove={vi.fn()}
        onDeny={vi.fn()}
        onCustomReply={vi.fn()}
        {...props}
      />
    </ChakraProvider>
  );
}

describe('ApprovalCard a11y', () => {
  it('has no axe violations for generic intent', async () => {
    const { container } = renderCard(genericIntent);
    await expectNoA11yViolations(container);
  });

  it('has no axe violations for destructive intent', async () => {
    const { container } = renderCard(destructiveIntent);
    await expectNoA11yViolations(container);
  });

  it('card has role=region with aria-label', () => {
    renderCard(genericIntent);
    const region = screen.getByRole('region');
    expect(region).toHaveAccessibleName(/approval request/i);
  });

  it('approve button has accessible name', () => {
    renderCard(genericIntent);
    const btn = screen.getByRole('button', { name: /approve/i });
    expect(btn).toBeInTheDocument();
  });

  it('deny button has accessible name', () => {
    renderCard(genericIntent);
    const btn = screen.getByRole('button', { name: /deny/i });
    expect(btn).toBeInTheDocument();
  });

  it('destructive approve button describes hold requirement', () => {
    renderCard(destructiveIntent);
    const btn = screen.getByRole('button', { name: /hold to confirm/i });
    expect(btn).toBeInTheDocument();
  });

  it('y key triggers approve for non-destructive', async () => {
    const onApprove = vi.fn();
    const { container } = renderCard(genericIntent, { onApprove });
    container.querySelector<HTMLElement>('[role="region"]')?.focus();
    await userEvent.keyboard('y');
    expect(onApprove).toHaveBeenCalledOnce();
  });

  it('n key triggers deny', async () => {
    const onDeny = vi.fn();
    const { container } = renderCard(genericIntent, { onDeny });
    container.querySelector<HTMLElement>('[role="region"]')?.focus();
    await userEvent.keyboard('n');
    expect(onDeny).toHaveBeenCalledOnce();
  });

  it('Reply differently toggle opens custom textarea', async () => {
    renderCard(genericIntent);
    await userEvent.click(screen.getByRole('button', { name: /reply differently/i }));
    const textarea = screen.getByRole('textbox', { name: /custom reply/i });
    expect(textarea).toBeInTheDocument();
  });

  it('custom reply textarea has accessible name', async () => {
    renderCard(genericIntent);
    await userEvent.click(screen.getByRole('button', { name: /reply differently/i }));
    const textarea = screen.getByRole('textbox', { name: /custom reply/i });
    expect(textarea).toHaveAccessibleName();
  });

  it('expanded state has no axe violations', async () => {
    const { container } = renderCard(genericIntent);
    await userEvent.click(screen.getByRole('button', { name: /reply differently/i }));
    await expectNoA11yViolations(container);
  });
});
