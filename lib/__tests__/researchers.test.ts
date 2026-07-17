import { describe, it, expect } from 'vitest';
import { RESEARCHER_LIST, sNorm, sIndex, raisePlan, type Researcher } from '../researchers';
import { RESEARCHERS } from '../content';

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
    expect(bissig.datasets.filter(d => d.qualifies)
      .map(d => r1(sNorm(d.theta, d.omega, d.normFactor))))
      .toEqual([40.6, 40.1, 4.5, 1, 1]);
    const k = kaye.datasets[0];
    expect(r1(sNorm(k.theta, k.omega, k.normFactor))).toBe(40.1);
  });
  it('aggregates to the published S-indices: Bissig 3, Kaye 1', () => {
    expect(sIndex(rows(bissig))).toBe(3);
    expect(sIndex(rows(kaye))).toBe(1);
  });
  it('the two 1.0 rows are genuine floor cases (raw score below 1)', () => {
    for (const d of bissig.datasets.slice(3, 5))
      expect((0.1 * d.theta + d.omega) * d.normFactor).toBeLessThan(1);
  });
  it('the non-qualifying dataset would clear the bar but leaves the S-index at 3', () => {
    const dq = bissig.datasets.find(d => !d.qualifies)!;
    expect(sNorm(dq.theta, dq.omega, dq.normFactor)).toBeGreaterThan(4);
    expect(sIndex(rows(bissig))).toBe(3);
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

describe('raisePlan', () => {
  const bissig = RESEARCHER_LIST.find(r => r.slug === 'david-bissig')!;
  const kaye = RESEARCHER_LIST.find(r => r.slug === 'jeffrey-kaye')!;
  const full = (r: Researcher) =>
    r.datasets.map(d => ({ ...d, sNorm: sNorm(d.theta, d.omega, d.normFactor) }));

  it('Bissig: reaching 4 needs one more dataset at S_norm ≥ 4', () => {
    const p = raisePlan(full(bissig), 3);
    expect(p.target).toBe(4);
    expect(p.have).toBe(3);
    expect(p.needed).toBe(1);
    expect(p.missing).toBe(0);
  });
  it('Bissig: the closest candidate is the ERG floor dataset with correct gaps', () => {
    const p = raisePlan(full(bissig), 3);
    expect(p.candidate?.id).toBe('db-erg');
    // raw 0.6 must reach 4/0.91 ≈ 4.396: +4 citations or +38 downloads
    expect(p.candidate?.gapOmega).toBe(4);
    expect(p.candidate?.gapTheta).toBe(38);
    // the suggested gaps genuinely clear the target
    const d = bissig.datasets.find(x => x.id === 'db-erg')!;
    expect(sNorm(d.theta, d.omega + p.candidate!.gapOmega, d.normFactor)).toBeGreaterThanOrEqual(4);
    expect(sNorm(d.theta + p.candidate!.gapTheta, d.omega, d.normFactor)).toBeGreaterThanOrEqual(4);
  });
  it('Bissig: the gated dataset is reported as clearing the bar', () => {
    const p = raisePlan(full(bissig), 3);
    expect(p.gated.map(g => g.id)).toEqual(['db-vep']);
    expect(p.gated[0].sNorm).toBeGreaterThan(4);
  });
  it('Kaye: reaching 2 requires a second linked dataset outright', () => {
    const p = raisePlan(full(kaye), 1);
    expect(p.target).toBe(2);
    expect(p.have).toBe(1);
    expect(p.needed).toBe(1);
    expect(p.candidate).toBeNull();
    expect(p.missing).toBe(1);
  });
  it('retargets after an edit lifts the S-index: candidate becomes the OCT dataset', () => {
    const edited = full(bissig).map(d =>
      d.id === 'db-erg' ? { ...d, omega: 5, sNorm: sNorm(d.theta, 5, d.normFactor) } : d);
    expect(sIndex(edited)).toBe(4);
    const p = raisePlan(edited, 4);
    expect(p.target).toBe(5);
    expect(p.candidate?.id).toBe('db-oct');
  });
});

describe('landing cards', () => {
  it('match the researcher fixtures by slug and computed S-index', () => {
    expect(RESEARCHERS).toHaveLength(2);
    for (const card of RESEARCHERS) {
      const r = RESEARCHER_LIST.find(x => x.slug === card.slug);
      expect(r, `no fixture for slug ${card.slug}`).toBeDefined();
      expect(card.name).toBe(r!.name);
      expect(card.score).toBe(sIndex(rows(r!)));
    }
  });
});
