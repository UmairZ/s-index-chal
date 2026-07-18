export type NormPath = 'cocitation' | 'category' | 'global';

export interface Dataset {
  id: string;
  title: string;
  repository: string;
  doi: string | null;
  year: number | null;
  theta: number;      // honest downloads (contributors excluded)
  omega: number;      // citations (DataCite)
  normFactor: number; // μg/μf actually applied (>1 boosts lower-citation fields)
  normPath: NormPath; // which normalisation path fired
  subfield: string | null; // named field mean used, or null for the global mean
  qualifies: boolean;
  failedGate: string | null; // named criterion when qualifies === false
  illustrative?: boolean;    // constructed example (not part of the real portfolio)
}

export interface Researcher {
  slug: string;
  name: string;
  orcid: string | null; // null once/if the team decides to anonymise
  field: string;
  scoreSentence: string;
  hook: string; // one-line summary used on cross-links and cards
  raiseNote?: string; // researcher-specific closing line for the raise-score section
  datasets: Dataset[];
}

export const sNorm = (theta: number, omega: number, normFactor: number): number =>
  Math.max(1, (0.1 * theta + omega) * normFactor);

export const fmt1 = (v: number): string => (Math.round(v * 10) / 10).toFixed(1);

// h-index analogue: largest S with at least S qualifying datasets scoring ≥ S.
export function sIndex(rows: { sNorm: number; qualifies: boolean }[]): number {
  const vals = rows.filter(r => r.qualifies).map(r => r.sNorm);
  for (let s = vals.length; s >= 1; s--) {
    if (vals.filter(v => v >= s).length >= s) return s;
  }
  return 0;
}

// The same index computed on the un-normalised raw score (0.1θ + ω, floored at 1).
export function sIndexGlobal(rows: { theta: number; omega: number; qualifies: boolean }[]): number {
  const vals = rows.filter(r => r.qualifies).map(r => Math.max(1, 0.1 * r.theta + r.omega));
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

// ---- real data ---------------------------------------------------------------
// θ, ω, titles and subfield norm factors are the team's measured values
// (Individual_S_Index_Multi_Researcher_Demo, DataCite counts). Every S_norm and
// S-index recomputes from these exactly. Researcher NAMES and ORCIDs are
// pseudonyms (fake, non-resolving placeholders) — the team asked to anonymise
// the people while keeping the real dataset records. DOIs are kept in the data
// for uniqueness but are not shown, since a real DOI resolves to the named
// author. The one constructed row is Vale's `bs-illus`, flagged `illustrative`
// to demonstrate the qualifying gate — it is not part of that portfolio.

const NF: Record<string, number> = {
  'biological sciences': 1.7475,
  'agricultural sciences': 1.64,
  'health sciences': 1.5328,
  'environmental science': 1.7646,
};

// dataset factory for the real, qualifying rows
function ds(
  id: string, title: string, doi: string, repository: string,
  theta: number, omega: number, subfield: string | null,
): Dataset {
  return {
    id, title, doi, repository, year: null,
    theta, omega,
    normFactor: subfield ? NF[subfield] : 1,
    normPath: subfield ? 'category' : 'global',
    subfield,
    qualifies: true, failedGate: null,
  };
}

// SATURN is shared: it appears in both Kaye's and Bissig's ORCID-linked records.
const SATURN = ds(
  'saturn', 'SATURN: a self-administered cognitive screening test',
  '10.5061/dryad.02v6wwpzr', 'Dryad', 391, 2, null,
);

export const RESEARCHER_LIST: Researcher[] = [
  {
    slug: 'rowan-vale',
    name: 'Rowan Vale',
    orcid: '0000-0000-0000-0001',
    field: 'Neurology · cognition & vision',
    scoreSentence:
      'An S-index of 3: three qualifying datasets, each with a field-normalised score of at least 3.',
    hook: 'Five real datasets, plus an illustrative one stopped at the gate.',
    datasets: [
      SATURN,
      ds('bs-oct-alz', "Functional OCT in Alzheimer's disease",
        '10.5061/dryad.msbcc2ftc', 'Dryad', 376, 3, null),
      ds('bs-retro-saturn', 'Retrospective data collected on SATURN',
        '10.5061/dryad.j9kd51cq4', 'Dryad', 35, 2, null),
      ds('bs-oct-tilt', 'OCT beam tilt in mouse retina',
        '10.5061/dryad.95x69p8th', 'Dryad', 10, 1, 'health sciences'),
      ds('bs-inhosp', 'Brief in-hospital cognitive screening',
        '10.5061/dryad.gn8h3tg', 'Dryad', 2, 1, null),
      {
        id: 'bs-illus',
        title: 'Illustrative example: retinal dataset without a licence',
        repository: 'personal website', doi: null, year: null,
        theta: 200, omega: 2, normFactor: 1, normPath: 'global', subfield: null,
        qualifies: false, failedGate: 'no machine-readable licence (FAIR gate)',
        illustrative: true,
      },
    ],
  },
  {
    slug: 'iris-thorne',
    name: 'Iris Thorne',
    orcid: '0000-0000-0000-0002',
    field: 'Neurology · cognitive ageing',
    scoreSentence:
      'An S-index of 1: one ORCID-linked qualifying dataset with a normalised score of at least 1.',
    hook: 'One linked dataset, and that is the finding.',
    raiseNote:
      'For Jeffrey Kaye that is an infrastructure gap, not a sharing gap: deposits that exist today simply do not carry his ORCID, so no pipeline can count them.',
    datasets: [SATURN],
  },
  {
    slug: 'marta-lindqvist',
    name: 'Marta Lindqvist',
    orcid: '0000-0000-0000-0003',
    field: 'Plant population genetics',
    scoreSentence:
      'An S-index of 3: three qualifying datasets, each field-normalised to at least 3.',
    hook: 'Field normalisation lifts a global 2 to a 3.',
    datasets: [
      ds('lt-stuckenia', 'Stuckenia pectinata gene pools',
        '10.5061/dryad.jwstqjqjb', 'Dryad', 7, 2, 'biological sciences'),
      ds('lt-avicennia-moz', 'Avicennia marina (Mozambique Channel)',
        '10.5061/dryad.8pk0p2nkt', 'Dryad', 17, 1, 'biological sciences'),
      ds('lt-avicennia-gazi', 'Avicennia marina (Gazi Bay, Kenya)',
        '10.5061/dryad.v9s4mw6t2', 'Dryad', 16, 1, 'biological sciences'),
      ds('lt-avicennia-wio', 'Microsatellites of Avicennia marina (W Indian Ocean)',
        '10.5061/dryad.hmgqnk9wr', 'Dryad', 2, 2, 'biological sciences'),
      ds('lt-avicennia-sea', 'Avicennia marina (Vietnam/Malaysia/Philippines)',
        '10.5061/dryad.3r2280gss', 'Dryad', 9, 1, 'biological sciences'),
      ds('lt-rhizophora', 'Rhizophora chloroplast genome sequences',
        '10.5061/dryad.vmcvdnctd', 'Dryad', 9, 2, null),
      ds('lt-primula', 'Microsatellites of Primula vulgaris',
        '10.5061/dryad.2bvq83c15', 'Dryad', 4, 1, 'biological sciences'),
      ds('lt-bruguiera', 'Chloroplast genomes of Bruguiera gymnorhiza',
        '10.5061/dryad.8cz8w9h6d', 'Dryad', 0, 0, 'biological sciences'),
    ],
  },
  {
    slug: 'omar-reyes',
    name: 'Omar Reyes',
    orcid: '0000-0000-0000-0004',
    field: 'Insect physiology & genomics',
    scoreSentence:
      'An S-index of 3: three of fifteen qualifying datasets clear a field-normalised score of 3.',
    hook: 'Fifteen datasets, a long floor, an S-index of 3.',
    datasets: [
      ds('jb-sleep-mosq', 'Sleep-like states in mosquitoes',
        '10.5061/dryad.41ns1rnh5', 'Dryad', 12, 2, 'biological sciences'),
      ds('jb-microbiome', 'Microbiome nucleobase & mosquito larvae',
        '10.5061/dryad.31zcrjf2h', 'Dryad', 3, 2, 'biological sciences'),
      ds('jb-humidity', 'Humidity as a zeitgeber for insects',
        '10.5061/dryad.zs7h44jr6', 'Dryad', 1, 2, 'biological sciences'),
      ds('jb-ticks', 'Thermal tolerance of ticks & pesticides',
        '10.5061/dryad.9cnp5hr18', 'Dryad', 2, 2, 'agricultural sciences'),
      ds('jb-oncopeltus', 'Oncopeltus fasciatus Official Gene Set',
        '10.15482/usda.adc/1518752', 'Ag Data Commons', 0, 2, 'agricultural sciences'),
      ds('jb-ectoparasite', 'Sleep/activity & ectoparasite resistance',
        '10.5061/dryad.ghx3ffbzc', 'Dryad', 5, 2, null),
      ds('jb-yellow', 'Yellow genes in Diaphorina citri',
        '10.5524/100899', 'GigaScience Database', 0, 1, 'biological sciences'),
      ds('jb-circadian', 'Circadian genes in Diaphorina citri',
        '10.5524/100997', 'GigaScience Database', 0, 1, 'biological sciences'),
      ds('jb-atp', 'ATP synthase subunits in Diaphorina citri',
        '10.5524/100994', 'GigaScience Database', 0, 1, 'biological sciences'),
      ds('jb-glycolysis', 'Glycolysis in Asian citrus psyllid',
        '10.5524/100996', 'GigaScience Database', 0, 1, 'biological sciences'),
      ds('jb-diaci', 'Diaci v3.0 assembly of Diaphorina citri',
        '10.5524/102431', 'GigaScience Database', 0, 1, 'biological sciences'),
      ds('jb-agrilus', 'Agrilus planipennis annotations',
        '10.15482/usda.adc/25076114', 'Ag Data Commons', 0, 1, 'agricultural sciences'),
      ds('jb-halyomorpha', 'Halyomorpha halys Official Gene Set',
        '10.15482/usda.adc/1518751', 'Ag Data Commons', 0, 0, 'agricultural sciences'),
      ds('jb-hyalella', 'Hyalella azteca Official Gene Set',
        '10.15482/usda.adc/1529441', 'Not Available', 0, 0, null),
      ds('jb-cimex', 'Cimex lectularius Official Gene Set',
        '10.15482/usda.adc/1196762', 'Ag Data Commons', 0, 0, 'agricultural sciences'),
    ],
  },
  {
    slug: 'helen-ashby',
    name: 'Helen Ashby',
    orcid: '0000-0000-0000-0005',
    field: 'Evolutionary ecology',
    scoreSentence:
      'An S-index of 5: five qualifying datasets, each field-normalised to at least 5.',
    hook: 'A dozen datasets and the demo’s highest S-index.',
    datasets: [
      ds('rf-sexual-systems', 'Global distribution & evolution of angiosperm sexual systems',
        '10.5061/dryad.s1rn8pk7n', 'Dryad', 100, 1, 'environmental science'),
      ds('rf-floral-symmetry', 'Global distribution & evolution of floral symmetry in angiosperms',
        '10.5061/dryad.ghx3ffbrh', 'Dryad', 123, 1, null),
      ds('rf-inflorescence', 'Biogeography & macroevolution of angiosperm inflorescence types',
        '10.5061/dryad.73n5tb35w', 'Dryad', 41, 1, 'biological sciences'),
      ds('rf-anisogamy', 'Anisogamy is unrelated to the intensity of sexual selection',
        '10.5061/dryad.fqz612jpp', 'Dryad', 44, 1, null),
      ds('rf-land-use-birds', 'Land-use dynamics & avian phylogenetic diversity across islands',
        '10.5061/dryad.b5mkkwhsv', 'Dryad', 0, 3, 'biological sciences'),
      ds('rf-herbicide-dynamics', 'Management & herbicide resistance in plant population dynamics',
        '10.5061/dryad.9cnp5hqn5', 'Dryad', 10, 2, 'biological sciences'),
      ds('rf-frog-care', 'Climate & mating systems as drivers of parental care in frogs',
        '10.5061/dryad.m905qftxs', 'Dryad', 30, 2, null),
      ds('rf-drought-herbicide', 'Drought & inheritance of herbicide resistance in Alopecurus myosuroides',
        '10.5061/dryad.w3r2280s3', 'Dryad', 16, 1, 'agricultural sciences'),
      ds('rf-dipterocarps', 'Distance & density dependence in Bornean dipterocarps',
        '10.5061/dryad.9cnp5hqp9', 'Dryad', 10, 1, 'biological sciences'),
      ds('rf-adult-sex-ratio', 'Demographic causes & consequences of adult sex ratio variation',
        '10.6084/m9.figshare.31490812', 'figshare', 0, 1, null),
      ds('rf-wheat', 'Evolution of competitiveness during wheat domestication',
        '10.17632/dpwyyvt66j', 'Mendeley Data', 1, 0, null),
      ds('rf-zeta-diversity', 'Tropical land-use change disrupts zeta-diversity across taxa',
        '10.6084/m9.figshare.25954063', 'figshare', 0, 0, null),
    ],
  },
];
