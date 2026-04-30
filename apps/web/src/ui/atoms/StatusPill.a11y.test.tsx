import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
afterEach(cleanup);
import { StatusPill } from './StatusPill';
import { expectNoA11yViolations } from '../../test/axe';

const STATUSES = [
  'connected', 'disconnected', 'error', 'pending', 'completed',
  'failed', 'idle', 'warning', 'info', 'approved', 'denied',
];

describe('StatusPill a11y', () => {
  it('has no axe violations for each status variant', async () => {
    for (const label of STATUSES) {
      const { container, unmount } = render(<StatusPill label={label} />);
      await expectNoA11yViolations(container);
      unmount();
    }
  });

  it('status dot is decorative (aria-hidden)', () => {
    const { container } = render(<StatusPill label="connected" />);
    const dot = container.querySelector('.status-badge__dot');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });

  it('pill has role=status', () => {
    render(<StatusPill label="connected" />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
  });

  it('has aria-label describing status', () => {
    render(<StatusPill label="connected" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Status: connected');
  });

  it('visible text matches label', () => {
    render(<StatusPill label="error" />);
    expect(screen.getByText('error')).toBeInTheDocument();
  });
});
