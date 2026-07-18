import { describe, it, expect } from 'vitest';
import { PRINCIPLES, PANELS, CARD_TERM, RESEARCHERS } from '../content';

describe('content integrity', () => {
  it('has all four principles, gate principles leading', () => {
    expect(PRINCIPLES.map(p => p.key)).toEqual(['p2', 'p4', 'p1', 'p3']);
  });
  it('has a panel for every term', () => {
    expect(Object.keys(PANELS).sort()).toEqual(['gate', 'max', 'norm', 'omega', 'theta']);
  });
  it('wires every principle card to a term with a panel; both gate principles share the brace', () => {
    for (const term of Object.values(CARD_TERM)) expect(PANELS[term]).toBeDefined();
    expect(CARD_TERM.p2).toBe('gate');
    expect(CARD_TERM.p4).toBe('gate');
    expect(CARD_TERM.p1).toBe('max');
    expect(CARD_TERM.p3).toBe('norm');
  });
  it('panel links point at real terms', () => {
    for (const panel of Object.values(PANELS))
      for (const link of panel.links) expect(PANELS[link.term]).toBeDefined();
  });
  it('has five example researchers', () => expect(RESEARCHERS).toHaveLength(5));
});
