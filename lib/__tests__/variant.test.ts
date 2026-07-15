import { describe, it, expect } from 'vitest';
import { parseVariant } from '../variant';

describe('parseVariant', () => {
  it('parses #b', () => expect(parseVariant('#b')).toBe('b'));
  it('parses #B case-insensitively', () => expect(parseVariant('#B')).toBe('b'));
  it('defaults empty to a', () => expect(parseVariant('')).toBe('a'));
  it('parses #a', () => expect(parseVariant('#a')).toBe('a'));
  it('defaults junk to a', () => expect(parseVariant('#pricing')).toBe('a'));
});
