export type PrincipleKey = 'p1' | 'p2' | 'p3' | 'p4';
export type TermKey = 'max' | 'theta' | 'omega' | 'norm' | 'gate';
// panel accent: a single principle, the two-principle gate, or none
export type PanelTone = PrincipleKey | 'gate' | 'plain';

export interface Principle {
  key: PrincipleKey;
  title: string;
  body: string;
  maps: string;
}

// Gate principles lead: their cards settle beside the brace they both wire into.
// No numbering — the principles are a set, not a sequence.
export const PRINCIPLES: Principle[] = [
  {
    key: 'p2', title: 'How & where shared',
    body: 'Whether data can be reused at all depends on where it lives and how it is described.',
    maps: 'the gate',
  },
  {
    key: 'p4', title: 'Collaborative credit',
    body: 'Research is collective. Contributions across the data lifecycle should be named.',
    maps: 'the gate',
  },
  {
    key: 'p1', title: 'Inherent value',
    body: 'FAIR-aligned sharing is a real contribution, even when nobody has reused the data yet.',
    maps: 'the floor',
  },
  {
    key: 'p3', title: 'Norms & ethics',
    body: 'Impact means different things in different fields, so it should be judged inside one.',
    maps: 'normalisation',
  },
];

export const CARD_TERM: Record<PrincipleKey, TermKey> = {
  p1: 'max', p2: 'gate', p3: 'norm', p4: 'gate',
};

export interface Panel {
  badge: string;
  principle: PanelTone;
  title: string;
  paragraphs: string[]; // may contain <em> HTML
  checksLead?: string;
  checks?: { title: string; body: string; principle: PrincipleKey }[];
  links: { label: string; term: TermKey }[];
}

export const PANELS: Record<TermKey, Panel> = {
  max: {
    badge: 'Inherent value', principle: 'p1', title: 'The floor',
    paragraphs: [
      'Nearly every metric waits for someone else to act. A paper is worth nothing until cited; a dataset, nothing until downloaded. That makes the metric a measure of <em>luck and visibility</em> as much as of contribution.',
      'The floor refuses that. A dataset prepared properly, documented, licensed and deposited where others can find it is <em>already a contribution</em>. It is worth at least 1, today, whether or not anyone has come looking for it.',
    ],
    links: [{ label: 'But first it must qualify →', term: 'gate' }],
  },
  gate: {
    badge: 'How & where shared · Collaborative credit', principle: 'gate',
    title: 'Qualified — or zero',
    paragraphs: [
      'The equation has two branches. A dataset that qualifies gets scored. A dataset that does not <em>scores zero — no matter how heavily it was downloaded or cited.</em>',
      'Two principles meet at this brace. <em>How &amp; where shared:</em> reuse is only possible when data lives in a FAIR repository, with a persistent identifier and a clear licence. <em>Collaborative credit:</em> a score is only attributable when every contributor is named, with CRediT roles and ORCID. The gate is not an obstacle in front of the equation — it is the reason the equation means anything.',
    ],
    checksLead: 'Every dataset must clear all three:',
    checks: [
      { title: 'Usefulness', body: 'A FAIR repository: persistent ID, metadata, a clear licence.', principle: 'p2' },
      { title: 'Recognition', body: 'CRediT roles and ORCID for every contributor.', principle: 'p4' },
      { title: 'Ethical responsibility', body: 'Consent, privacy and governance, documented.', principle: 'p4' },
    ],
    links: [
      { label: 'θ — honest downloads →', term: 'theta' },
      { label: 'Then it gets normalised →', term: 'norm' },
    ],
  },
  theta: {
    badge: 'In the equation', principle: 'plain', title: 'θ — honest downloads',
    paragraphs: [
      'θ counts downloads <em>by people who are not contributors</em>. Nothing stops a researcher downloading their own dataset ten thousand times — unless the record says who they are.',
      'That is one reason the gate requires every contributor to be named: without ORCID on the record, honest downloads cannot be counted at all.',
    ],
    links: [{ label: 'Citations weigh more →', term: 'omega' }],
  },
  omega: {
    badge: 'In the equation', principle: 'plain', title: 'ω — citations, ten to one',
    paragraphs: [
      'A download is not a use. A citation is a far stronger claim: <em>this data changed what I could say.</em> So citations weigh ten times more than downloads.',
      'And ω is only measurable at all for data that clears the gate — <em>a dataset with no persistent identifier cannot be cited at all.</em>',
    ],
    links: [{ label: 'Then it gets normalised →', term: 'norm' }],
  },
  norm: {
    badge: 'Norms & ethics', principle: 'p3', title: 'Judged inside its own field',
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
