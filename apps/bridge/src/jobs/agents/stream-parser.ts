/**
 * Parses newline-delimited JSON from a child process stream.
 * Buffers partial lines across data chunks.
 */
export class StreamJsonParser {
  private buffer = '';

  constructor(
    private readonly onJson: (obj: unknown, rawLine: string) => void,
    private readonly onRaw: (line: string) => void,
  ) {}

  feed(chunk: Buffer | string): void {
    this.buffer += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    let newlineIdx: number;
    while ((newlineIdx = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIdx);
      this.buffer = this.buffer.slice(newlineIdx + 1);
      const trimmed = line.trim();
      if (!trimmed) continue;
      this.processLine(trimmed);
    }
  }

  end(): void {
    const remaining = this.buffer.trim();
    if (remaining) {
      this.processLine(remaining);
      this.buffer = '';
    }
  }

  private processLine(line: string): void {
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        this.onJson(JSON.parse(line), line);
        return;
      } catch {
        // fall through
      }
    }
    this.onRaw(line);
  }
}
