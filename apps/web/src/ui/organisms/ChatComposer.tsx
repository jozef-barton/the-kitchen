import { useCallback, useRef, useState, type ClipboardEvent, type FormEvent, type DragEvent } from 'react';
import { Box, Button, Flex, HStack, Text, Textarea, VStack, chakra } from '@chakra-ui/react';

const ChakraButton = chakra('button');
import type { FileRef } from '../../lib/api';
import type { FileUploadQueue } from '../../hooks/use-file-upload-queue';
import { PendingAttachmentChip } from '../molecules/AttachmentChip';

export function ChatComposer({
  onSend,
  sending,
  disabled,
  uploadQueue,
  onAddFiles
}: {
  onSend: (content: string, attachments: FileRef[]) => boolean | Promise<boolean>;
  sending: boolean;
  disabled: boolean;
  uploadQueue: FileUploadQueue;
  onAddFiles: (files: File[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const [draggingOver, setDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pending, completedRefs, isUploading, removeFile, clear: clearQueue } = uploadQueue;

  const hasPending = pending.length > 0;
  const canSubmit = !disabled && !sending && !isUploading && draft.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    const content = draft.trim();
    if (!content || disabled || sending || isUploading) return;
    const accepted = await Promise.resolve(onSend(content, completedRefs)).catch(() => false);
    if (accepted) {
      setDraft('');
      clearQueue();
    }
  }, [disabled, draft, isUploading, onSend, completedRefs, sending, clearQueue]);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;
      onAddFiles(arr);
    },
    [onAddFiles]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDraggingOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const files = Array.from(e.clipboardData.files);
      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  return (
    <Box
      as="form"
      aria-label="Chat message composer"
      position="relative"
      rounded="12px"
      border="1px solid"
      borderColor={draggingOver ? 'var(--accent)' : 'var(--border-subtle)'}
      bg={draggingOver ? 'var(--surface-accent)' : 'var(--surface-elevated)'}
      boxShadow="0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)"
      data-testid="chat-composer"
      css={{
        transition: 'border-color 150ms ease-in-out, box-shadow 150ms ease-in-out, background-color 150ms ease-in-out',
        '&:focus-within': {
          borderColor: draggingOver ? 'var(--accent)' : 'var(--border-default)',
          boxShadow: 'var(--focus-ring)'
        }
      }}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (canSubmit) void handleSubmit();
      }}
      onDragOver={(e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDraggingOver(true);
      }}
      onDragLeave={(e: DragEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDraggingOver(false);
        }
      }}
      onDrop={handleDrop}
    >
      {draggingOver && (
        <Box
          position="absolute"
          inset="0"
          rounded="12px"
          border="2px dashed var(--accent)"
          bg="var(--surface-accent)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
          zIndex="1"
        >
          <VStack gap="1.5" align="center">
            <Box color="var(--accent)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
            <Text fontSize="sm" fontWeight="500" color="var(--accent)" letterSpacing="-0.01em">
              Drop to attach
            </Text>
          </VStack>
        </Box>
      )}
      {hasPending && (
        <HStack gap="2" px="3" pt="2" pb="0" flexWrap="wrap">
          {pending.map((item) => (
            <PendingAttachmentChip
              key={item.id}
              item={item}
              onRemove={() => removeFile(item.id)}
            />
          ))}
        </HStack>
      )}
      <Flex align="flex-end" gap="2" px="3" py="2">
        <ChakraButton
          type="button"
          aria-label="Attach files"
          color="var(--text-muted)"
          _hover={{ color: 'var(--text-secondary)' }}
          disabled={disabled}
          flexShrink={0}
          mb="0.5"
          background="none"
          border="none"
          p={0}
          cursor="pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M13.5 7.5l-5.5 5.5a3.5 3.5 0 01-4.95-4.95l5.5-5.5a2 2 0 012.83 2.83L5.88 10.88a.5.5 0 01-.71-.71L10.5 4.84"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ChakraButton>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
        <Textarea
          flex="1"
          aria-label="Message"
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          placeholder={draggingOver ? 'Drop files to attach…' : 'Ask Hermes something real.'}
          autoresize
          resize="none"
          variant="subtle"
          minH="0"
          maxH="200px"
          py="1"
          px="0"
          fontSize="sm"
          lineHeight="1.55"
          color="var(--text-primary)"
          disabled={disabled}
          bg="transparent"
          border="none"
          _placeholder={{ color: draggingOver ? 'var(--accent)' : 'var(--text-muted)' }}
          _focus={{ boxShadow: 'none', bg: 'transparent' }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
            event.preventDefault();
            if (canSubmit) void handleSubmit();
          }}
          onPaste={handlePaste}
        />
        <Button
          type="submit"
          aria-label={sending ? 'Sending message…' : 'Send message'}
          size="xs"
          h="7"
          px="3"
          mb="0.5"
          rounded="8px"
          bg={canSubmit ? 'var(--accent)' : 'var(--surface-3)'}
          color={canSubmit ? 'var(--accent-contrast)' : 'var(--text-muted)'}
          fontWeight="500"
          fontSize="xs"
          flexShrink={0}
          _hover={{ bg: canSubmit ? 'var(--accent-strong)' : undefined }}
          transition="background-color 150ms ease-in-out, color 150ms ease-in-out"
          loading={sending}
          disabled={!canSubmit}
        >
          Send
        </Button>
      </Flex>
    </Box>
  );
}
