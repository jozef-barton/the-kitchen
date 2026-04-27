import { useCallback, useRef, useState } from 'react';
import type { FileRef, UploadedFile } from '../lib/api';
import { uploadFiles } from '../lib/api';

export interface PendingUpload {
  id: string;
  file: File;
  status: 'uploading' | 'done' | 'error';
  percent: number;
  result?: UploadedFile;
  error?: string;
}

export interface FileUploadQueue {
  pending: PendingUpload[];
  completedRefs: FileRef[];
  isUploading: boolean;
  addFiles: (files: File[], profileId: string, sessionId: string | null) => void;
  removeFile: (id: string) => void;
  clear: () => void;
}

function uploadedFileToFileRef(file: UploadedFile): FileRef {
  return {
    id: file.id,
    filename: file.filename,
    mimeType: file.mimeType,
    size: file.size,
    kind: file.kind
  };
}

export function useFileUploadQueue(): FileUploadQueue {
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  const addFiles = useCallback(
    (files: File[], profileId: string, sessionId: string | null) => {
      const newItems: PendingUpload[] = files.map((file) => ({
        id: `pending-${Math.random().toString(36).slice(2)}`,
        file,
        status: 'uploading' as const,
        percent: 0
      }));

      setPending((prev) => [...prev, ...newItems]);

      // Upload each file individually for per-file progress
      newItems.forEach((item) => {
        uploadFiles(
          profileId,
          sessionId,
          [item.file],
          ({ percent }) => {
            setPending((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, percent } : p))
            );
          }
        )
          .then((uploaded) => {
            const result = uploaded[0];
            setPending((prev) =>
              prev.map((p) =>
                p.id === item.id
                  ? { ...p, status: 'done', percent: 100, result }
                  : p
              )
            );
          })
          .catch((err: unknown) => {
            setPending((prev) =>
              prev.map((p) =>
                p.id === item.id
                  ? { ...p, status: 'error', error: err instanceof Error ? err.message : 'Upload failed.' }
                  : p
              )
            );
          });
      });
    },
    []
  );

  const removeFile = useCallback((id: string) => {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => {
    setPending([]);
  }, []);

  const completedRefs = pending
    .filter((p) => p.status === 'done' && p.result)
    .map((p) => uploadedFileToFileRef(p.result!));

  const isUploading = pending.some((p) => p.status === 'uploading');

  return { pending, completedRefs, isUploading, addFiles, removeFile, clear };
}
