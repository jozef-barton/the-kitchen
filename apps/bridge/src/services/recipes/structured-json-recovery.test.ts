import { describe, expect, it } from 'vitest';
import { parsePartialJsonObject } from './structured-json-recovery';

describe('parsePartialJsonObject', () => {
  describe('returns null for non-parseable input', () => {
    it('returns null for empty string', () => {
      expect(parsePartialJsonObject('')).toBeNull();
    });

    it('returns null for whitespace', () => {
      expect(parsePartialJsonObject('   ')).toBeNull();
    });

    it('returns null for plain text (no JSON)', () => {
      expect(parsePartialJsonObject('Hello, world!')).toBeNull();
    });

    it('returns null for a string ending inside a quoted value (non-deterministic)', () => {
      // The string is truncated inside a JSON string — completing it is ambiguous.
      expect(parsePartialJsonObject('{"title": "Incomplete str')).toBeNull();
    });
  });

  describe('parses complete JSON', () => {
    it('parses a complete JSON object', () => {
      const result = parsePartialJsonObject('{"templateId": "shopping-shortlist", "title": "Test"}');
      expect(result).toEqual({ templateId: 'shopping-shortlist', title: 'Test' });
    });

    it('parses JSON with nested objects', () => {
      const result = parsePartialJsonObject('{"data": {"cards": [{"id": "c1", "title": "Card 1"}]}}');
      expect(result).toEqual({ data: { cards: [{ id: 'c1', title: 'Card 1' }] } });
    });
  });

  describe('recovers truncated/partial JSON', () => {
    it('completes a truncated object after first field', () => {
      const result = parsePartialJsonObject('{"templateId": "price-comparison-grid"');
      expect(result).not.toBeNull();
      expect(result?.['templateId']).toBe('price-comparison-grid');
    });

    it('completes a JSON with a truncated nested array', () => {
      const result = parsePartialJsonObject('{"cards": [{"id": "c1", "title": "First"}, {"id": "c2"');
      expect(result).not.toBeNull();
      expect(Array.isArray((result as { cards: unknown[] })?.cards)).toBe(true);
    });

    it('completes a JSON with deep nesting', () => {
      const result = parsePartialJsonObject('{"a": {"b": {"c": "value"');
      expect(result).not.toBeNull();
    });

    it('handles leading prose before JSON', () => {
      const result = parsePartialJsonObject('Here is the JSON:\n{"templateId": "hotel-shortlist"}');
      expect(result?.['templateId']).toBe('hotel-shortlist');
    });

    it('handles trailing prose after JSON', () => {
      const result = parsePartialJsonObject('{"templateId": "vendor-evaluation-matrix"}\nSome trailing text');
      expect(result?.['templateId']).toBe('vendor-evaluation-matrix');
    });
  });

  describe('does not accept non-object JSON roots', () => {
    it('returns null for a JSON array at root', () => {
      expect(parsePartialJsonObject('[1, 2, 3]')).toBeNull();
    });

    it('returns null for a raw string value', () => {
      expect(parsePartialJsonObject('"just a string"')).toBeNull();
    });

    it('returns null for a raw number', () => {
      expect(parsePartialJsonObject('42')).toBeNull();
    });
  });
});
