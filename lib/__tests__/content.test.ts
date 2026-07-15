import { describe, it, expect } from 'vitest';
import { PRINCIPLES, PANELS, TERM_META, CARD_TERM, RESEARCHERS } from '../content';

describe('content integrity', () => {
  it('has exactly four principles, p1..p4 in order', () => {
    expect(PRINCIPLES.map(p => p.key)).toEqual(['p1', 'p2', 'p3', 'p4']);
    expect(PRINCIPLES.map(p => p.num)).toEqual([1, 2, 3, 4]);
  });
  it('has a panel for every term', () => {
    expect(Object.keys(PANELS).sort()).toEqual(['max', 'norm', 'omega', 'theta']);
  });
  it('maps every principle to a distinct term and back', () => {
    const terms = Object.values(CARD_TERM);
    expect(new Set(terms).size).toBe(4);
    for (const [term, meta] of Object.entries(TERM_META)) {
      expect(CARD_TERM[meta.principle]).toBe(term);
    }
  });
  it('panel links point at real terms', () => {
    for (const panel of Object.values(PANELS))
      for (const link of panel.links) expect(TERM_META[link.term]).toBeDefined();
  });
  it('has two example researchers', () => expect(RESEARCHERS).toHaveLength(2));
});
