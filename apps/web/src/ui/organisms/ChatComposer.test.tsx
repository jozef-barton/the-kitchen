import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ChatComposer } from './ChatComposer';
import type { FileUploadQueue } from '../../hooks/use-file-upload-queue';

function TestProvider({ children }: PropsWithChildren) {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
}

function makeUploadQueue(): FileUploadQueue {
  return {
    pending: [],
    completedRefs: [],
    isUploading: false,
    addFiles: vi.fn(),
    removeFile: vi.fn(),
    clear: vi.fn()
  };
}

afterEach(() => {
  cleanup();
});

describe('ChatComposer', () => {
  it('submits on Enter and preserves Shift+Enter for a newline', async () => {
    const onSend = vi.fn().mockResolvedValue(true);

    render(
      <TestProvider>
        <ChatComposer onSend={onSend} sending={false} disabled={false} uploadQueue={makeUploadQueue()} onAddFiles={vi.fn()} />
      </TestProvider>
    );

    const textarea = screen.getByPlaceholderText('Ask Hermes something real.');

    await userEvent.click(textarea);
    await userEvent.keyboard('First line');
    await userEvent.keyboard('{Enter}');

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith('First line', []);
    await waitFor(() => expect(textarea).toHaveValue(''));

    await userEvent.click(textarea);
    await userEvent.keyboard('Second line');
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}');
    await userEvent.keyboard('Third line');

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue('Second line\nThird line');
  });

  it('keeps the draft when the parent does not accept the send', async () => {
    const onSend = vi.fn().mockResolvedValue(false);

    render(
      <TestProvider>
        <ChatComposer onSend={onSend} sending={false} disabled={false} uploadQueue={makeUploadQueue()} onAddFiles={vi.fn()} />
      </TestProvider>
    );

    const textarea = screen.getByPlaceholderText('Ask Hermes something real.');

    await userEvent.type(textarea, 'Retry this draft');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(onSend).toHaveBeenCalledWith('Retry this draft', []);
    expect(textarea).toHaveValue('Retry this draft');
  });

  it('keeps sibling transcript work from rerendering while typing', async () => {
    const transcriptSpy = vi.fn(() => <div data-testid="transcript-spy">Transcript</div>);

    function Harness() {
      return (
        <>
          {transcriptSpy()}
          <ChatComposer onSend={() => true} sending={false} disabled={false} uploadQueue={makeUploadQueue()} onAddFiles={vi.fn()} />
        </>
      );
    }

    render(
      <TestProvider>
        <Harness />
      </TestProvider>
    );

    expect(transcriptSpy).toHaveBeenCalledTimes(1);

    await userEvent.type(screen.getByPlaceholderText('Ask Hermes something real.'), 'Long transcript typing test');

    expect(transcriptSpy).toHaveBeenCalledTimes(1);
  });
});
