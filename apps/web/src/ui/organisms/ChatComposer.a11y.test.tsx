import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(cleanup);
import { ChatComposer } from './ChatComposer';
import { expectNoA11yViolations } from '../../test/axe';
import type { FileUploadQueue } from '../../hooks/use-file-upload-queue';

const emptyQueue: FileUploadQueue = {
  pending: [],
  completedRefs: [],
  isUploading: false,
  addFiles: vi.fn(),
  removeFile: vi.fn(),
  clear: vi.fn(),
};

function renderComposer(props: Partial<Parameters<typeof ChatComposer>[0]> = {}) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ChatComposer
        onSend={vi.fn()}
        sending={false}
        disabled={false}
        uploadQueue={emptyQueue}
        onAddFiles={vi.fn()}
        {...props}
      />
    </ChakraProvider>
  );
}

describe('ChatComposer a11y', () => {
  it('has no axe violations in idle state', async () => {
    const { container } = renderComposer();
    await expectNoA11yViolations(container);
  });

  it('has no axe violations in sending state', async () => {
    const { container } = renderComposer({ sending: true });
    await expectNoA11yViolations(container);
  });

  it('has no axe violations in disabled state', async () => {
    const { container } = renderComposer({ disabled: true });
    await expectNoA11yViolations(container);
  });

  it('form has accessible name', () => {
    renderComposer();
    const form = screen.getByRole('form');
    expect(form).toHaveAccessibleName();
  });

  it('textarea has accessible name (aria-label)', () => {
    renderComposer();
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAccessibleName();
  });

  it('attach files button has accessible name', () => {
    renderComposer();
    const btn = screen.getByRole('button', { name: /attach files/i });
    expect(btn).toBeInTheDocument();
  });

  it('send button has accessible name', () => {
    renderComposer();
    const btn = screen.getByRole('button', { name: /send/i });
    expect(btn).toBeInTheDocument();
  });

  it('submits on Enter in textarea', async () => {
    const onSend = vi.fn().mockResolvedValue(true);
    renderComposer({ onSend });
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'hello{Enter}');
    expect(onSend).toHaveBeenCalledWith('hello', []);
  });

  it('Shift+Enter does not submit', async () => {
    const onSend = vi.fn().mockResolvedValue(true);
    renderComposer({ onSend });
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'hello{Shift>}{Enter}{/Shift}');
    expect(onSend).not.toHaveBeenCalled();
  });
});
