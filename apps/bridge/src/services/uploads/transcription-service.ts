import fs from 'node:fs';
import path from 'node:path';
import type { BridgeDatabase } from '../../data/bridge-database.js';

const WHISPER_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';
const MAX_WHISPER_BYTES = 25 * 1024 * 1024; // 25 MB Whisper limit

export async function scheduleTranscription(
  fileId: string,
  storagePath: string,
  filename: string,
  database: BridgeDatabase,
  openAiApiKey: string | undefined
): Promise<void> {
  if (!openAiApiKey) {
    database.updateUploadedFileTranscription(fileId, { status: 'failed', transcriptionText: null });
    return;
  }

  database.updateUploadedFileTranscription(fileId, { status: 'processing' });

  // Run asynchronously — don't await so upload response is immediate
  runTranscription(fileId, storagePath, filename, database, openAiApiKey).catch(() => {
    database.updateUploadedFileTranscription(fileId, { status: 'failed', transcriptionText: null });
  });
}

async function runTranscription(
  fileId: string,
  storagePath: string,
  filename: string,
  database: BridgeDatabase,
  openAiApiKey: string
): Promise<void> {
  const stat = await fs.promises.stat(storagePath).catch(() => null);
  if (!stat) {
    database.updateUploadedFileTranscription(fileId, { status: 'failed' });
    return;
  }

  if (stat.size > MAX_WHISPER_BYTES) {
    database.updateUploadedFileTranscription(fileId, {
      status: 'failed',
      transcriptionText: null
    });
    return;
  }

  const formData = new FormData();
  const fileBuffer = await fs.promises.readFile(storagePath);
  const blob = new Blob([fileBuffer]);
  formData.append('file', blob, path.basename(filename));
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'text');

  const response = await fetch(WHISPER_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${openAiApiKey}` },
    body: formData
  });

  if (!response.ok) {
    database.updateUploadedFileTranscription(fileId, { status: 'failed' });
    return;
  }

  const transcription = await response.text();
  database.updateUploadedFileTranscription(fileId, {
    status: 'done',
    transcriptionText: transcription.trim()
  });
}
