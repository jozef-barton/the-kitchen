import busboy from 'busboy';
import fs from 'node:fs';
import type { IncomingMessage } from 'node:http';

export interface ParsedFilePart {
  fieldname: string;
  filename: string;
  mimeType: string;
  storagePath: string;
  bytesWritten: number;
}

export interface ParsedFormData {
  files: ParsedFilePart[];
  fields: Record<string, string>;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

export function parseMultipartUpload(
  request: IncomingMessage,
  resolveStoragePath: (filename: string, mimeType: string) => string,
  options: {
    onProgress?: (filename: string, bytesWritten: number) => void;
    maxFiles?: number;
  } = {}
): Promise<ParsedFormData> {
  return new Promise((resolve, reject) => {
    const contentType = request.headers['content-type'];
    if (!contentType?.includes('multipart/form-data')) {
      reject(new Error('Expected multipart/form-data content type.'));
      return;
    }

    const result: ParsedFormData = { files: [], fields: {} };
    let activeWrites = 0;
    let busboyDone = false;

    function maybeResolve() {
      if (busboyDone && activeWrites === 0) resolve(result);
    }

    const bb = busboy({
      headers: request.headers,
      limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: options.maxFiles ?? 20
      }
    });

    bb.on('field', (name, value) => {
      result.fields[name] = value;
    });

    bb.on('file', (fieldname, fileStream, info) => {
      const { filename, mimeType } = info;
      const storagePath = resolveStoragePath(filename, mimeType);
      const writeStream = fs.createWriteStream(storagePath);
      let bytesWritten = 0;

      activeWrites++;

      fileStream.on('data', (chunk: Buffer) => {
        bytesWritten += chunk.length;
        options.onProgress?.(filename, bytesWritten);
      });

      fileStream.on('limit', () => {
        writeStream.destroy();
        fs.unlink(storagePath, () => undefined);
        reject(new Error(`File "${filename}" exceeds the 5 GB size limit.`));
      });

      fileStream.pipe(writeStream);

      writeStream.on('finish', () => {
        result.files.push({ fieldname, filename, mimeType, storagePath, bytesWritten });
        activeWrites--;
        maybeResolve();
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    });

    bb.on('finish', () => {
      busboyDone = true;
      maybeResolve();
    });

    bb.on('error', (err) => {
      reject(err);
    });

    request.pipe(bb);
  });
}
