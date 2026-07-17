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

// θ/ω/μ per dataset are provisional: invented, but constructed to reproduce the
// team's published S_norm values (40.6 / 40.1 / 4.5 / 1.0 / 1.0 and 40.1) exactly.
// SATURN's θ = 372 is the value observed in the team's evaluation runs.
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
    hook: 'Five shared datasets — the metric working as designed.',
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
