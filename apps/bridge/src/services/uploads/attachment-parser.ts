import fs from 'node:fs';
import type { UploadedFileKind } from '@hermes-recipes/protocol';

const MAX_PARSED_CHARS = 40_000;

export interface ParseResult {
  text: string;
  truncated: boolean;
}

export async function parseAttachment(storagePath: string, kind: UploadedFileKind, mimeType: string): Promise<ParseResult | null> {
  switch (kind) {
    case 'text':
    case 'code':
      return parseTextFile(storagePath);

    case 'pdf':
      return parsePdf(storagePath);

    case 'document':
      if (mimeType.includes('wordprocessingml') || mimeType === 'application/msword') {
        return parseDocx(storagePath);
      }
      return null;

    case 'spreadsheet':
      if (mimeType === 'text/csv' || mimeType === 'text/tab-separated-values') {
        return parseTextFile(storagePath);
      }
      return parseSpreadsheet(storagePath, mimeType);

    default:
      return null;
  }
}

async function parseTextFile(storagePath: string): Promise<ParseResult> {
  const raw = await fs.promises.readFile(storagePath, 'utf8');
  const text = raw.slice(0, MAX_PARSED_CHARS);
  return { text, truncated: raw.length > MAX_PARSED_CHARS };
}

async function parsePdf(storagePath: string): Promise<ParseResult | null> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const buffer = await fs.promises.readFile(storagePath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const fullText = result.text ?? '';
    const text = fullText.slice(0, MAX_PARSED_CHARS);
    return { text: text.trim(), truncated: fullText.length > MAX_PARSED_CHARS };
  } catch {
    return null;
  }
}

async function parseDocx(storagePath: string): Promise<ParseResult | null> {
  try {
    const mammoth = (await import('mammoth'));
    const buffer = await fs.promises.readFile(storagePath);
    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value ?? '').slice(0, MAX_PARSED_CHARS);
    return { text: text.trim(), truncated: (result.value ?? '').length > MAX_PARSED_CHARS };
  } catch {
    return null;
  }
}

async function parseSpreadsheet(storagePath: string, _mimeType: string): Promise<ParseResult | null> {
  try {
    const ExcelJS = (await import('exceljs'));
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(storagePath);
    const parts: string[] = [];

    workbook.worksheets.forEach((sheet) => {
      const rows: string[] = [];
      sheet.eachRow((row) => {
        const cells = (row.values as (string | number | boolean | null | undefined)[]).slice(1);
        rows.push(cells.map((c) => (c == null ? '' : String(c))).join(','));
      });
      if (rows.length > 0) {
        parts.push(`## Sheet: ${sheet.name}\n${rows.join('\n')}`);
      }
    });

    const joined = parts.join('\n\n');
    const text = joined.slice(0, MAX_PARSED_CHARS);
    return { text: text.trim(), truncated: joined.length > MAX_PARSED_CHARS };
  } catch {
    return null;
  }
}

export function buildAttachmentContextBlock(
  filename: string,
  kind: UploadedFileKind,
  parsedText: string | null,
  transcriptionText: string | null,
  truncated?: boolean
): string {
  const label = transcriptionText
    ? `[Transcription of "${filename}"]`
    : `[Attached file: "${filename}" (${kind})]`;

  const body = transcriptionText ?? parsedText;

  if (!body || !body.trim()) {
    return `<attachment filename="${filename}" kind="${kind}">[No extractable text — file stored and available]</attachment>`;
  }

  const content = truncated
    ? `${body}\n… [truncated — full content stored on disk]`
    : body;

  return `<attachment filename="${filename}" kind="${kind}">\n${label}\n${content}\n</attachment>`;
}
