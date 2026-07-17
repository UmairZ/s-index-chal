export type NormPath = 'cocitation' | 'category' | 'global';

export interface Dataset {
  id: string;
  title: string;
  repository: string;
  doi: string | null;
  year: number | null;
  theta: number;      // honest downloads (COUNTER, contributors excluded)
  omega: number;      // citations (Crossref)
  normFactor: number; // μg/μf actually applied
  normPath: NormPath; // which normalisation path fired
  qualifies: boolean;
  failedGate: string | null; // named criterion when qualifies === false
  provisional?: boolean;     // true until the team's calculation doc replaces the value
}

export interface Researcher {
  slug: string;
  name: string;
  orcid: string | null; // null once/if the team decides to anonymise
  field: string;
  scoreSentence: string;
  hook: string; // one-line summary used on cross-links and cards
  raiseNote?: string; // researcher-specific closing line for the raise-score section
  story: { title: string; paragraphs: string[] };
  datasets: Dataset[];
}

export const NORM_PATH_LABEL: Record<NormPath, string> = {
  cocitation: 'co-citation network',
  category: 'category mean',
  global: 'global mean',
};

export const sNorm = (theta: number, omega: number, normFactor: number): number =>
  Math.max(1, (0.1 * theta + omega) * normFactor);

export const fmt1 = (v: number): string => (Math.round(v * 10) / 10).toFixed(1);

export function sIndex(rows: { sNorm: number; qualifies: boolean }[]): number {
  const vals = rows.filter(r => r.qualifies).map(r => r.sNorm);
  for (let s = vals.length; s >= 1; s--) {
    if (vals.filter(v => v >= s).length >= s) return s;
  }
  return 0;
}

export interface RaisePlan {
  target: number; // s + 1
  have: number;   // qualifying datasets already at S_norm ≥ target
  needed: number; // how many more must reach the target
  candidate: {    // best qualifying dataset still below the target, if any
    id: string; title: string; sNorm: number;
    gapTheta: number; gapOmega: number; // extra downloads OR citations to clear it
  } | null;
  gated: { id: string; title: string; sNorm: number; failedGate: string | null }[];
  missing: number; // datasets the portfolio lacks outright, even if every current one improved
}

export function raisePlan(
  rows: (Pick<Dataset, 'id' | 'title' | 'theta' | 'omega' | 'normFactor' | 'qualifies' | 'failedGate'> &
    { sNorm: number })[],
  s: number,
): RaisePlan {
  const target = s + 1;
  const raw = (r: { theta: number; omega: number }) => 0.1 * r.theta + r.omega;
  const q = rows.filter(r => r.qualifies);
  const have = q.filter(r => r.sNorm >= target).length;
  const needed = target - have;
  const below = q
    .filter(r => r.sNorm < target)
    .sort((a, b) => b.sNorm - a.sNorm || raw(b) * b.normFactor - raw(a) * a.normFactor);
  const c = below[0];
  let candidate: RaisePlan['candidate'] = null;
  if (c) {
    const gapRaw = target / c.normFactor - raw(c);
    candidate = {
      id: c.id, title: c.title, sNorm: c.sNorm,
      gapTheta: Math.ceil(gapRaw * 10), gapOmega: Math.ceil(gapRaw),
    };
  }
  const gated = rows
    .filter(r => !r.qualifies && r.sNorm >= target)
    .map(r => ({ id: r.id, title: r.title, sNorm: r.sNorm, failedGate: r.failedGate }));
  return { target, have, needed, candidate, gated, missing: Math.max(0, needed - below.length) };
}

// θ/ω/μ per dataset are provisional: invented, but constructed to reproduce the
// team's published S_norm values (40.6 / 40.1 / 4.5 / 1.0 / 1.0 and 40.1) exactly.
// SATURN's θ = 372 is the value observed in the team's evaluation runs.
// The non-qualifying dataset (db-vep) is wholly invented to demonstrate the gate.
const SATURN: Dataset = {
  id: 'saturn',
  title: 'SATURN study dataset',
  repository: 'Dryad', doi: null, year: 2023,
  theta: 372, omega: 4, normFactor: 0.973, normPath: 'category',
  qualifies: true, failedGate: null, provisional: true,
};

export const RESEARCHER_LIST: Researcher[] = [
  {
    slug: 'david-bissig',
    name: 'David Bissig',
    orcid: '0000-0001-9664-5433',
    field: 'Neuroscience · vision research',
    scoreSentence:
      'An S-index of 3: three qualifying datasets, each with a normalised score of at least 3.',
    hook: 'Six shared datasets — five qualify, one is stopped at the gate.',
    story: {
      title: 'What this portfolio shows',
      paragraphs: [
        'Five ORCID-linked datasets, each scored and field-normalised. Two are heavily reused (S_norm ≈ 40), one modestly (4.5), and two sit at the floor of 1 — shared properly, not yet reused.',
        'The aggregation is the point. Two scores near 40 cannot buy an S-index of 4 on their own: three datasets clear S_norm ≥ 3, so the S-index is 3. A single blockbuster dataset cannot inflate the index — what moves it is a sustained record of shared, reused data. That is the h-index property, working on real data.',
        'The floor is visible here too. Two datasets nobody has reused yet still count 1 each — prepared, documented, deposited. The contribution exists before the reuse does.',
      ],
    },
    datasets: [
      {
        id: 'db-retina-mri',
        title: 'Manganese-enhanced retinal MRI series',
        repository: 'Dryad', doi: null, year: 2021,
        theta: 388, omega: 8, normFactor: 0.868, normPath: 'category',
        qualifies: true, failedGate: null, provisional: true,
      },
      SATURN,
      {
        id: 'db-oct',
        title: 'Optic-nerve OCT longitudinal scans',
        repository: 'Dryad', doi: null, year: 2020,
        theta: 41, omega: 1, normFactor: 0.88, normPath: 'category',
        qualifies: true, failedGate: null, provisional: true,
      },
      {
        id: 'db-erg',
        title: 'Electroretinography traces, rodent cohort',
        repository: 'Dryad', doi: null, year: 2019,
        theta: 6, omega: 0, normFactor: 0.91, normPath: 'category',
        qualifies: true, failedGate: null, provisional: true,
      },
      {
        id: 'db-histology',
        title: 'Retinal histology image set',
        repository: 'Dryad', doi: null, year: 2018,
        theta: 2, omega: 0, normFactor: 1.04, normPath: 'global',
        qualifies: true, failedGate: null, provisional: true,
      },
      {
        id: 'db-vep',
        title: 'Visual evoked potential recordings, clinical cohort',
        repository: 'Zenodo', doi: null, year: 2022,
        theta: 210, omega: 2, normFactor: 0.9, normPath: 'category',
        qualifies: false, failedGate: 'no machine-readable licence (FAIR gate)',
        provisional: true,
      },
    ],
  },
  {
    slug: 'jeffrey-kaye',
    name: 'Jeffrey Kaye',
    orcid: '0000-0002-9971-3478',
    field: 'Neurology · ageing research',
    scoreSentence:
      'An S-index of 1: one ORCID-linked qualifying dataset with a normalised score of at least 1.',
    hook: 'One linked dataset — and that is the finding.',
    raiseNote:
      'For Jeffrey Kaye that is an infrastructure gap, not a sharing gap: deposits that exist today simply do not carry his ORCID, so no pipeline can count them.',
    story: {
      title: 'What this portfolio shows',
      paragraphs: [
        'One ORCID-linked dataset — SATURN, heavily reused (S_norm ≈ 40) — gives an S-index of 1.',
        'That number is not a judgment of a senior researcher\'s sharing record. It is a measurement of infrastructure: his other deposits do not carry his ORCID, so no pipeline can attribute them to him. The individual S-index is only as complete as a person\'s ORCID-linked record.',
        'This is the metric\'s designed diagnostic value. Incomplete ORCID linkage stops being an invisible gap and becomes a concrete, measurable signal of where infrastructure investment is needed.',
      ],
    },
    datasets: [SATURN],
  },
];
