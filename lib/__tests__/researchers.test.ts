import { describe, it, expect } from 'vitest';
import { RESEARCHER_LIST, sNorm, sIndex, sIndexGlobal, raisePlan, type Researcher } from '../researchers';
import { RESEARCHERS } from '../content';

const rows = (r: Researcher) =>
  r.datasets.map(d => ({ sNorm: sNorm(d.theta, d.omega, d.normFactor), qualifies: d.qualifies }));
const full = (r: Researcher) =>
  r.datasets.map(d => ({ ...d, sNorm: sNorm(d.theta, d.omega, d.normFactor) }));
const r1 = (v: number) => Math.round(v * 10) / 10;
const bySlug = (slug: string) => RESEARCHER_LIST.find(r => r.slug === slug)!;

describe('sNorm', () => {
  it('computes (0.1·θ + ω) × factor', () => {
    expect(sNorm(391, 2, 1.0)).toBeCloseTo(41.1, 4);
    expect(sNorm(7, 2, 1.7475)).toBeCloseTo(4.7183, 4);
  });
  it('floors at 1 when the scaled score falls below 1', () => {
    expect(sNorm(0, 0, 1.7475)).toBe(1);
    expect(sNorm(1, 0, 1.0)).toBe(1);
  });
});

describe('sIndex', () => {
  it('is the largest S with at least S qualifying datasets scoring ≥ S', () => {
    const vals = [41.1, 40.6, 5.5, 3.1, 1.2].map(v => ({ sNorm: v, qualifies: true }));
    expect(sIndex(vals)).toBe(3);
  });
  it('empty portfolio gives 0', () => expect(sIndex([])).toBe(0));
  it('ignores non-qualifying datasets entirely', () => {
    expect(sIndex([
      { sNorm: 40, qualifies: true },
      { sNorm: 40, qualifies: false },
      { sNorm: 40, qualifies: false },
    ])).toBe(1);
  });
});

describe('all five portfolios reproduce the published indices', () => {
  const expected: Record<string, { field: number; global: number }> = {
    'rowan-vale': { field: 3, global: 3 },
    'iris-thorne': { field: 1, global: 1 },
    'marta-lindqvist': { field: 3, global: 2 },
    'omar-reyes': { field: 3, global: 2 },
    'helen-ashby': { field: 5, global: 5 },
  };
  for (const [slug, exp] of Object.entries(expected)) {
    it(`${slug}: field S-index ${exp.field}, global ${exp.global}`, () => {
      const r = bySlug(slug);
      expect(sIndex(rows(r))).toBe(exp.field);
      expect(sIndexGlobal(r.datasets)).toBe(exp.global);
    });
  }
  it('field normalisation lifts Lindqvist and Reyes from a global 2 to a 3', () => {
    for (const slug of ['marta-lindqvist', 'omar-reyes']) {
      const r = bySlug(slug);
      expect(sIndexGlobal(r.datasets)).toBeLessThan(sIndex(rows(r)));
    }
  });
});

describe('Vale portfolio (the featured example)', () => {
  const vale = bySlug('rowan-vale');
  it('reproduces the qualifying S_norm values to 1 decimal place', () => {
    expect(vale.datasets.filter(d => d.qualifies)
      .map(d => r1(sNorm(d.theta, d.omega, d.normFactor))))
      .toEqual([41.1, 40.6, 5.5, 3.1, 1.2]);
  });
  it('the illustrative dataset is flagged, non-qualifying, and ignored by the index', () => {
    const illus = vale.datasets.find(d => d.illustrative)!;
    expect(illus.qualifies).toBe(false);
    expect(sNorm(illus.theta, illus.omega, illus.normFactor)).toBeGreaterThan(4);
    expect(sIndex(rows(vale))).toBe(3); // unaffected
    expect(vale.datasets.filter(d => d.illustrative)).toHaveLength(1);
  });
  it('an ω edit on the OCT-tilt dataset flips the S-index from 3 to 4', () => {
    const edited = vale.datasets.map(d => ({
      sNorm: sNorm(d.theta, d.id === 'bs-oct-tilt' ? 5 : d.omega, d.normFactor),
      qualifies: d.qualifies,
    }));
    expect(sIndex(edited)).toBe(4);
  });
});

describe('genuine floor cases exist in the real data', () => {
  it('Lindqvist’s Bruguiera dataset (0 downloads, 0 citations) floors to 1', () => {
    const d = bySlug('marta-lindqvist').datasets.find(x => x.id === 'lt-bruguiera')!;
    expect((0.1 * d.theta + d.omega) * d.normFactor).toBeLessThan(1);
    expect(sNorm(d.theta, d.omega, d.normFactor)).toBe(1);
  });
});

describe('gate invariant', () => {
  it('qualifying rows have no failed gate; non-qualifying rows name one', () => {
    for (const r of RESEARCHER_LIST)
      for (const d of r.datasets)
        expect(d.qualifies ? d.failedGate === null : typeof d.failedGate === 'string').toBe(true);
  });
});

describe('raisePlan', () => {
  it('Vale: reaching 4 needs one more dataset; OCT-tilt is the closest candidate', () => {
    const vale = bySlug('rowan-vale');
    const p = raisePlan(full(vale), 3);
    expect(p.target).toBe(4);
    expect(p.needed).toBe(1);
    expect(p.candidate?.id).toBe('bs-oct-tilt');
    // raw 2.0 must reach 4/1.5328 ≈ 2.61 → +1 citation or +7 downloads
    expect(p.candidate?.gapOmega).toBe(1);
    expect(p.candidate?.gapTheta).toBe(7);
    const d = vale.datasets.find(x => x.id === 'bs-oct-tilt')!;
    expect(sNorm(d.theta, d.omega + p.candidate!.gapOmega, d.normFactor)).toBeGreaterThanOrEqual(4);
    expect(sNorm(d.theta + p.candidate!.gapTheta, d.omega, d.normFactor)).toBeGreaterThanOrEqual(4);
  });
  it('Vale: the illustrative dataset shows up as clearing the bar but gated', () => {
    const p = raisePlan(full(bySlug('rowan-vale')), 3);
    expect(p.gated.map(g => g.id)).toEqual(['bs-illus']);
    expect(p.gated[0].sNorm).toBeGreaterThan(4);
  });
  it('Thorne: reaching 2 requires a second linked dataset outright', () => {
    const p = raisePlan(full(bySlug('iris-thorne')), 1);
    expect(p.target).toBe(2);
    expect(p.candidate).toBeNull();
    expect(p.missing).toBe(1);
  });
});

describe('landing cards', () => {
  it('match the researcher fixtures by slug and computed S-index', () => {
    expect(RESEARCHERS).toHaveLength(5);
    for (const card of RESEARCHERS) {
      const r = RESEARCHER_LIST.find(x => x.slug === card.slug);
      expect(r, `no fixture for slug ${card.slug}`).toBeDefined();
      expect(card.name).toBe(r!.name);
      expect(card.score).toBe(sIndex(rows(r!)));
    }
  });
  it('every researcher and dataset is anonymised (fake ORCID, no DOI shown as identity)', () => {
    for (const r of RESEARCHER_LIST) {
      expect(r.orcid).toMatch(/^0000-0000-0000-000\d$/);
    }
  });
});
