import { describe, it, expect, vi } from 'vitest';
import { StreamJsonParser } from './stream-parser';

describe('StreamJsonParser', () => {
  it('handles a single complete JSON line', () => {
    const onJson = vi.fn();
    const onRaw = vi.fn();
    const parser = new StreamJsonParser(onJson, onRaw);

    parser.feed('{"type":"test","value":1}\n');

    expect(onJson).toHaveBeenCalledOnce();
    expect(onJson).toHaveBeenCalledWith({ type: 'test', value: 1 }, '{"type":"test","value":1}');
    expect(onRaw).not.toHaveBeenCalled();
  });

  it('handles JSON split across two feed() calls', () => {
    const onJson = vi.fn();
    const onRaw = vi.fn();
    const parser = new StreamJsonParser(onJson, onRaw);

    parser.feed('{"type":"split"');
    expect(onJson).not.toHaveBeenCalled();

    parser.feed(',"v":2}\n');
    expect(onJson).toHaveBeenCalledOnce();
    expect(onJson).toHaveBeenCalledWith({ type: 'split', v: 2 }, '{"type":"split","v":2}');
    expect(onRaw).not.toHaveBeenCalled();
  });

  it('handles mixed JSON and plain-text lines in one chunk', () => {
    const onJson = vi.fn();
    const onRaw = vi.fn();
    const parser = new StreamJsonParser(onJson, onRaw);

    parser.feed('{"type":"a"}\nplain text line\n{"type":"b"}\n');

    expect(onJson).toHaveBeenCalledTimes(2);
    expect(onJson).toHaveBeenNthCalledWith(1, { type: 'a' }, '{"type":"a"}');
    expect(onJson).toHaveBeenNthCalledWith(2, { type: 'b' }, '{"type":"b"}');
    expect(onRaw).toHaveBeenCalledOnce();
    expect(onRaw).toHaveBeenCalledWith('plain text line');
  });

  it('flushes trailing partial line when end() is called', () => {
    const onJson = vi.fn();
    const onRaw = vi.fn();
    const parser = new StreamJsonParser(onJson, onRaw);

    parser.feed('{"type":"incomplete"');
    expect(onJson).not.toHaveBeenCalled();

    // No trailing newline — end() should flush the buffer
    parser.end();
    // It's a partial JSON line (no closing brace), so it goes to onRaw
    expect(onRaw).toHaveBeenCalledOnce();
    expect(onRaw).toHaveBeenCalledWith('{"type":"incomplete"');
  });

  it('flushes trailing complete JSON line without newline when end() is called', () => {
    const onJson = vi.fn();
    const onRaw = vi.fn();
    const parser = new StreamJsonParser(onJson, onRaw);

    parser.feed('{"type":"complete"}');
    expect(onJson).not.toHaveBeenCalled();

    parser.end();
    expect(onJson).toHaveBeenCalledOnce();
    expect(onJson).toHaveBeenCalledWith({ type: 'complete' }, '{"type":"complete"}');
    expect(onRaw).not.toHaveBeenCalled();
  });

  it('falls through malformed JSON to onRaw', () => {
    const onJson = vi.fn();
    const onRaw = vi.fn();
    const parser = new StreamJsonParser(onJson, onRaw);

    parser.feed('{not valid json}\n');

    expect(onJson).not.toHaveBeenCalled();
    expect(onRaw).toHaveBeenCalledOnce();
    expect(onRaw).toHaveBeenCalledWith('{not valid json}');
  });

  it('ignores empty and whitespace-only lines', () => {
    const onJson = vi.fn();
    const onRaw = vi.fn();
    const parser = new StreamJsonParser(onJson, onRaw);

    parser.feed('\n   \n\n{"type":"ok"}\n   \n');

    expect(onJson).toHaveBeenCalledOnce();
    expect(onRaw).not.toHaveBeenCalled();
  });

  it('handles Buffer input in addition to string', () => {
    const onJson = vi.fn();
    const onRaw = vi.fn();
    const parser = new StreamJsonParser(onJson, onRaw);

    const buf = Buffer.from('{"type":"buf","n":42}\n');
    parser.feed(buf);

    expect(onJson).toHaveBeenCalledOnce();
    expect(onJson).toHaveBeenCalledWith({ type: 'buf', n: 42 }, '{"type":"buf","n":42}');
    expect(onRaw).not.toHaveBeenCalled();
  });
});
