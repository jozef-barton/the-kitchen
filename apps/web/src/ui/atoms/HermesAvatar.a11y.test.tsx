import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { afterEach, describe, expect, it } from 'vitest';
afterEach(cleanup);
import { HermesAvatar } from './HermesAvatar';
import { expectNoA11yViolations } from '../../test/axe';

function renderAvatar(size?: 'xs' | 'sm' | 'md' | 'lg') {
  return render(
    <ChakraProvider value={defaultSystem}>
      <HermesAvatar size={size} />
    </ChakraProvider>
  );
}

describe('HermesAvatar a11y', () => {
  it('has no axe violations at default size', async () => {
    const { container } = renderAvatar();
    await expectNoA11yViolations(container);
  });

  it('has no axe violations across all sizes', async () => {
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      const { container, unmount } = renderAvatar(size);
      await expectNoA11yViolations(container);
      unmount();
    }
  });

  it('emoji is labelled as an image', () => {
    renderAvatar();
    const img = screen.getByRole('img', { name: /hermes/i });
    expect(img).toBeInTheDocument();
  });
});
