export type PrincipleKey = 'p1' | 'p2' | 'p3' | 'p4';
export type TermKey = 'max' | 'theta' | 'omega' | 'norm';

export interface Principle {
  key: PrincipleKey;
  num: number;
  title: string;
  body: string;
  maps: string;
}

export const PRINCIPLES: Principle[] = [
  {
    key: 'p1', num: 1, title: 'Inherent value',
    body: 'FAIR-aligned sharing is a real contribution, even when nobody has reused the data yet.',
    maps: 'the floor',
  },
  {
    key: 'p2', num: 2, title: 'How & where shared',
    body: 'Whether data can be reused at all depends on where it lives and how it is described.',
    maps: 'the gate',
  },
  {
    key: 'p3', num: 3, title: 'Norms & ethics',
    body: 'Impact means different things in different fields, so it should be judged inside one.',
    maps: 'normalisation',
  },
  {
    key: 'p4', num: 4, title: 'Collaborative credit',
    body: 'Research is collective. Contributions across the data lifecycle should be named.',
    maps: 'ORCID + CRediT',
  },
];

export const TERM_META: Record<TermKey, { principle: PrincipleKey; label: string }> = {
  max: { principle: 'p1', label: 'the floor' },
  theta: { principle: 'p4', label: 'honest downloads' },
  omega: { principle: 'p2', label: 'citations' },
  norm: { principle: 'p3', label: 'field normalisation' },
};

export const CARD_TERM: Record<PrincipleKey, TermKey> = {
  p1: 'max', p2: 'omega', p3: 'norm', p4: 'theta',
};

export interface Panel {
  badge: string;
  principle: PrincipleKey;
  title: string;
  paragraphs: string[]; // may contain <em> HTML
  checksLead?: string;
  checks?: { title: string; body: string; principle: PrincipleKey }[];
  links: { label: string; term: TermKey }[];
}

export const PANELS: Record<TermKey, Panel> = {
  max: {
    badge: 'Principle 1', principle: 'p1', title: 'Inherent value',
    paragraphs: [
      'Nearly every metric waits for someone else to act. A paper is worth nothing until cited; a dataset, nothing until downloaded. That makes the metric a measure of <em>luck and visibility</em> as much as of contribution.',
      'The floor refuses that. A dataset prepared properly, documented, licensed and deposited where others can find it is <em>already a contribution</em>. It is worth at least 1, today, whether or not anyone has come looking for it.',
    ],
    links: [{ label: 'See what ω does →', term: 'omega' }],
  },
  theta: {
    badge: 'Principle 4', principle: 'p4', title: 'Everyone who contributed',
    paragraphs: [
      'θ counts downloads <em>by people who are not contributors</em>. Nothing stops a researcher downloading their own dataset ten thousand times — unless the record says who they are.',
      'That requires CRediT roles and ORCID for every contributor, which becomes a condition of scoring at all. The fourth principle enters not as decoration, but because the metric does not work without it.',
    ],
    links: [{ label: 'Citations weigh more →', term: 'omega' }],
  },
  omega: {
    badge: 'Principle 2', principle: 'p2', title: 'How and where it was shared',
    paragraphs: [
      'A download is not a use. A citation is a far stronger claim: <em>this data changed what I could say.</em> So citations weigh ten times more than downloads.',
      'But ω is only measurable at all if the dataset qualifies first. <em>A dataset with no persistent identifier cannot be cited at all.</em> The gate is not an obstacle in front of the equation. It is the reason the equation means anything.',
    ],
    checksLead: 'Every dataset must clear all three:',
    checks: [
      { title: 'Usefulness', body: 'A FAIR repository: persistent ID, metadata, a clear licence.', principle: 'p2' },
      { title: 'Recognition', body: 'CRediT roles and ORCID for every contributor.', principle: 'p4' },
      { title: 'Ethical responsibility', body: 'Consent, privacy and governance, documented.', principle: 'p4' },
    ],
    links: [{ label: 'Then it gets normalised →', term: 'norm' }],
  },
  norm: {
    badge: 'Principle 3', principle: 'p3', title: 'Disciplinary norms and ethics',
    paragraphs: [
      'A climate dataset might be downloaded ten thousand times. A rare-disease cohort might be downloaded forty times, by exactly the forty people who can use it, and be the more valuable of the two. <em>Treating those numbers as comparable is a category error.</em>',
      'So every score is divided by what is normal in its own field. Without this term, the S-index would reward your choice of field over the quality of your work.',
    ],
    links: [{ label: 'See the floor →', term: 'max' }],
  },
};

export const HERO = {
  kicker: 'A measure of shared data',
  headline: 'Sharing data is a contribution. Nothing measures it.',
  sub: 'The h-index counts papers; it cannot see shared data. The S-index starts from four principles — and every term in its equation exists because one of them demanded it.',
};

export const RESEARCHERS = [
  {
    score: 3, slug: 'david-bissig', name: 'David Bissig',
    meta: 'Neuroscience · 6 shared datasets',
  },
  {
    score: 1, slug: 'jeffrey-kaye', name: 'Jeffrey Kaye',
    meta: 'Neurology · 1 linked dataset — and that’s the finding',
  },
];

export const FOOTER =
  'An AI.Health4All project · CU Anschutz · University of Michigan · UIC · OHSU';
