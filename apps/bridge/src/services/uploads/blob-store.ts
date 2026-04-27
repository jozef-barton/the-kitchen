import fs from 'node:fs';
import path from 'node:path';
import type { UploadedFileKind } from '@hermes-recipes/protocol';

const KIND_BY_MIME: Record<string, UploadedFileKind> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/heic': 'image',
  'image/heif': 'image',
  'image/svg+xml': 'image',
  'image/bmp': 'image',
  'image/tiff': 'image',
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/ogg': 'audio',
  'audio/flac': 'audio',
  'audio/aac': 'audio',
  'audio/webm': 'audio',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/ogg': 'video',
  'video/quicktime': 'video',
  'video/x-msvideo': 'video',
  'video/x-matroska': 'video',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
  'application/vnd.ms-excel': 'spreadsheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',
  'application/vnd.ms-powerpoint': 'document',
  'application/zip': 'archive',
  'application/x-zip-compressed': 'archive',
  'application/x-tar': 'archive',
  'application/gzip': 'archive',
  'application/x-7z-compressed': 'archive',
  'application/x-rar-compressed': 'archive',
  'text/plain': 'text',
  'text/markdown': 'text',
  'text/csv': 'spreadsheet',
  'text/tab-separated-values': 'spreadsheet',
  'application/json': 'code',
  'application/xml': 'code',
  'text/xml': 'code',
  'text/html': 'code',
  'text/css': 'code',
  'text/javascript': 'code',
  'application/javascript': 'code',
  'application/typescript': 'code',
  'text/typescript': 'code',
  'text/x-python': 'code',
  'text/x-java-source': 'code',
  'text/x-c': 'code',
  'text/x-c++': 'code',
  'text/x-rust': 'code',
  'text/x-go': 'code',
  'text/x-shellscript': 'code',
  'application/x-sh': 'code'
};

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
  '.rs', '.go', '.rb', '.php', '.cs', '.swift', '.kt', '.scala', '.lua',
  '.r', '.m', '.sh', '.bash', '.zsh', '.fish', '.sql', '.graphql', '.proto',
  '.yaml', '.yml', '.toml', '.env', '.dockerfile', '.makefile'
]);

export function classifyFileKind(mimeType: string, filename: string): UploadedFileKind {
  const knownKind = KIND_BY_MIME[mimeType.toLowerCase()];
  if (knownKind) return knownKind;

  const ext = path.extname(filename).toLowerCase();
  if (CODE_EXTENSIONS.has(ext)) return 'code';

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('text/')) return 'text';

  return 'unknown';
}

export class BlobStore {
  constructor(private readonly uploadsRoot: string) {}

  resolveStoragePath(profileId: string, fileId: string, filename: string): string {
    const ext = path.extname(filename).slice(0, 16);
    const dir = path.join(this.uploadsRoot, profileId);
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `${fileId}${ext}`);
  }

  async deleteFile(storagePath: string): Promise<void> {
    await fs.promises.unlink(storagePath).catch(() => undefined);
  }

  createWriteStream(storagePath: string): fs.WriteStream {
    return fs.createWriteStream(storagePath);
  }

  createReadStream(storagePath: string, options?: { start?: number; end?: number }): fs.ReadStream {
    return fs.createReadStream(storagePath, options);
  }

  async stat(storagePath: string): Promise<{ size: number } | null> {
    try {
      const stat = await fs.promises.stat(storagePath);
      return { size: stat.size };
    } catch {
      return null;
    }
  }
}
