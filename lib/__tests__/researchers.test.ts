import { describe, it, expect } from 'vitest';
import { RESEARCHER_LIST, sNorm, sIndex, type Researcher } from '../researchers';

const rows = (r: Researcher) =>
  r.datasets.map(d => ({ sNorm: sNorm(d.theta, d.omega, d.normFactor), qualifies: d.qualifies }));
const r1 = (v: number) => Math.round(v * 10) / 10;

describe('sNorm', () => {
  it('computes (0.1·θ + ω) × factor', () => {
    expect(sNorm(372, 4, 0.973)).toBeCloseTo(40.0876, 4);
  });
  it('floors at 1 when the scaled score falls below 1', () => {
    expect(sNorm(6, 0, 0.91)).toBe(1);
    expect(sNorm(0, 0, 1)).toBe(1);
  });
});

describe('sIndex', () => {
  it('is the largest S with at least S qualifying datasets scoring ≥ S', () => {
    const vals = [40.6, 40.1, 4.5, 1, 1].map(v => ({ sNorm: v, qualifies: true }));
    expect(sIndex(vals)).toBe(3);
  });
  it('a single qualifying dataset gives 1', () => {
    expect(sIndex([{ sNorm: 40.1, qualifies: true }])).toBe(1);
  });
  it('ignores non-qualifying datasets entirely', () => {
    expect(sIndex([
      { sNorm: 40, qualifies: true },
      { sNorm: 40, qualifies: false },
      { sNorm: 40, qualifies: false },
    ])).toBe(1);
  });
  it('empty portfolio gives 0', () => expect(sIndex([])).toBe(0));
  it('two ~40s alone cannot buy more than 2 (the h-index property)', () => {
    expect(sIndex([40.6, 40.1].map(v => ({ sNorm: v, qualifies: true })))).toBe(2);
  });
});

describe('researcher fixtures', () => {
  const bissig = RESEARCHER_LIST.find(r => r.slug === 'david-bissig')!;
  const kaye = RESEARCHER_LIST.find(r => r.slug === 'jeffrey-kaye')!;

  it('has both researchers', () => {
    expect(bissig).toBeDefined();
    expect(kaye).toBeDefined();
  });
  it('reproduces the published S_norm values to 1 decimal place', () => {
    expect(bissig.datasets.map(d => r1(sNorm(d.theta, d.omega, d.normFactor))))
      .toEqual([40.6, 40.1, 4.5, 1, 1]);
    const k = kaye.datasets[0];
    expect(r1(sNorm(k.theta, k.omega, k.normFactor))).toBe(40.1);
  });
  it('aggregates to the published S-indices: Bissig 3, Kaye 1', () => {
    expect(sIndex(rows(bissig))).toBe(3);
    expect(sIndex(rows(kaye))).toBe(1);
  });
  it('the two 1.0 rows are genuine floor cases (raw score below 1)', () => {
    for (const d of bissig.datasets.slice(3))
      expect((0.1 * d.theta + d.omega) * d.normFactor).toBeLessThan(1);
  });
  it('an ω edit on a floor dataset can flip Bissig from 3 to 4', () => {
    const edited = bissig.datasets.map((d, i) => ({
      sNorm: sNorm(d.theta, i === 3 ? 5 : d.omega, d.normFactor),
      qualifies: d.qualifies,
    }));
    expect(sIndex(edited)).toBe(4);
  });
  it('qualifying rows have no failed gate; non-qualifying rows name one', () => {
    for (const r of RESEARCHER_LIST)
      for (const d of r.datasets)
        expect(d.qualifies ? d.failedGate === null : typeof d.failedGate === 'string').toBe(true);
  });
});
