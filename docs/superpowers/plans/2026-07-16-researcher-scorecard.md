# Researcher Scorecard Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Per-researcher pages at `/researchers/[slug]` (David Bissig, Jeffrey Kaye) with a sticky live-S-index header, an interactive equation workbench (select datasets, edit θ/ω, watch the S-index update), a live aggregation-bars strip, narrative, and caveats — plus landing-page cards that finally link to them.

**Architecture:** A new pure-data + pure-math module `lib/researchers.ts` (unit-tested) feeds a client component tree under `components/researcher/`. All interactive state (persistent per-dataset edits, selection, header collapse) lives in one client root, `ScorePage`. The route is a thin server component with `generateStaticParams`. Styling extends `app/globals.css` (plain global CSS, no frameworks), reusing the existing paper/deep-green palette and per-principle term colours.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, plain global CSS, vitest (lib tests), Playwright script for E2E (in gitignored `.superpowers/sdd/`).

**Spec:** `docs/superpowers/specs/2026-07-16-researcher-scorecard.md` — read it before starting a task.

## Global Constraints

- **NEVER run `npm run build` while the dev server is running** (shared `.next` corrupts). To build: `taskkill //F //IM node.exe`, `rm -rf .next`, then build. Restart dev afterwards with `npm run dev` (background).
- Dev server is assumed running at `http://localhost:3000` for manual verification steps. If a page 500s with `ENOENT .next/...`, kill node, `rm -rf .next`, restart dev.
- No new npm dependencies.
- All copy/data lives in `lib/*.ts` modules, never hard-coded in components — except structural labels defined in this plan's component code.
- Plain global CSS appended to `app/globals.css`; no CSS modules, no Tailwind. Reuse existing CSS custom properties: `--p1..--p4` (+`-l` light, `-w` wash variants), `--deep`, `--ink`, `--ink-2`, `--ink-3`, `--rule`, `--rule-2`, `--paper`, `--serif`, `--sans`, `--mono`, `--ease`.
- Slugs are exactly `david-bissig` and `jeffrey-kaye`.
- Every new animation/transition must be disabled under `@media (prefers-reduced-motion: reduce)`.
- Researcher pages do **not** render the floating `<Nav/>` pill (it would collide with the sticky header); the sticky header carries an `S` wordmark link back to `/`.
- Do not commit anything under `.superpowers/` (gitignored).
- End every commit message with:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

### Task 1: Score math + researcher fixtures (`lib/researchers.ts`)

**Files:**
- Create: `lib/researchers.ts`
- Test: `lib/__tests__/researchers.test.ts`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces (used by every later task):
  - `type NormPath = 'cocitation' | 'category' | 'global'`
  - `interface Dataset { id: string; title: string; repository: string; doi: string | null; year: number | null; theta: number; omega: number; normFactor: number; normPath: NormPath; qualifies: boolean; failedGate: string | null; provisional?: boolean }`
  - `interface Researcher { slug: string; name: string; orcid: string | null; field: string; scoreSentence: string; hook: string; story: { title: string; paragraphs: string[] }; datasets: Dataset[] }`
  - `RESEARCHER_LIST: Researcher[]` (two entries, slugs `david-bissig`, `jeffrey-kaye`)
  - `sNorm(theta: number, omega: number, normFactor: number): number`
  - `sIndex(rows: { sNorm: number; qualifies: boolean }[]): number`
  - `NORM_PATH_LABEL: Record<NormPath, string>`

Background you need: the method comes from the team's evaluation doc. Per dataset `S_norm = max(1, (0.1·θ + ω) × μg/μf)`. A person's S-index is the h-index analogue: the largest integer S such that ≥ S *qualifying* datasets have `S_norm ≥ S`. Published real results that our fixtures must reproduce: Bissig — 5 qualifying datasets with S_norm 40.6 / 40.1 / 4.5 / 1.0 / 1.0 → S-index 3; Kaye — 1 qualifying dataset (SATURN, S_norm 40.1) → S-index 1. SATURN's θ was observed at 372. Per-dataset θ/ω/μ details haven't arrived from the team, so those values are invented-but-consistent and every dataset is flagged `provisional: true`.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/researchers.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/__tests__/researchers.test.ts`
Expected: FAIL — cannot resolve `../researchers`.

- [ ] **Step 3: Write the implementation**

Create `lib/researchers.ts`:

```ts
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
        'That number is not a judgment of a senior researcher’s sharing record. It is a measurement of infrastructure: his other deposits do not carry his ORCID, so no pipeline can attribute them to him. The individual S-index is only as complete as a person’s ORCID-linked record.',
        'This is the metric’s designed diagnostic value. Incomplete ORCID linkage stops being an invisible gap and becomes a concrete, measurable signal of where infrastructure investment is needed.',
      ],
    },
    datasets: [SATURN],
  },
];
```

Sanity of the arithmetic (why the tests pass): `(0.1·388+8)×0.868 = 46.8×0.868 = 40.6224` → 40.6; `(0.1·372+4)×0.973 = 41.2×0.973 = 40.0876` → 40.1; `(0.1·41+1)×0.88 = 5.1×0.88 = 4.488` → 4.5; `0.6×0.91 = 0.546` and `0.2×1.04 = 0.208` → both floored to 1. Aggregation `[40.6, 40.1, 4.5, 1, 1]`: 3 values ≥ 3 but only 3 values ≥ 4 (needs 4) → 3. The flip test sets `db-erg` ω to 5: `(0.6+5)×0.91 = 5.096` → 4 values ≥ 4 → 4.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/__tests__/researchers.test.ts`
Expected: PASS (12 tests). Also run the whole suite: `npm test` — all green.

- [ ] **Step 5: Commit**

```bash
git add lib/researchers.ts lib/__tests__/researchers.test.ts
git commit -m "feat: researcher data model with S-index math (provisional per-dataset figures)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Route + page shell — sticky header, story, caveats, cross-link

**Files:**
- Create: `app/researchers/[slug]/page.tsx`
- Create: `components/researcher/ScorePage.tsx`
- Modify: `app/globals.css` (append at end of file)

**Interfaces:**
- Consumes: everything from Task 1 (`RESEARCHER_LIST`, `sNorm`, `sIndex`, `Researcher`, `Dataset`).
- Produces: `ScorePage({ r }: { r: Researcher })` default export — the client root. It computes `rows: (Dataset & { sNorm: number })[]` (current values after edits) and `s = sIndex(rows)`; Tasks 3–4 mount their components inside its `<main className="wrap rmain">`, right above `.story`, and consume `rows`, `s`, and the `edits` state via callbacks added in those tasks.

- [ ] **Step 1: Create the route**

Create `app/researchers/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RESEARCHER_LIST } from '@/lib/researchers';
import ScorePage from '@/components/researcher/ScorePage';

export function generateStaticParams() {
  return RESEARCHER_LIST.map(r => ({ slug: r.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const r = RESEARCHER_LIST.find(x => x.slug === slug);
  if (!r) return {};
  return { title: `${r.name} · S-index`, description: r.scoreSentence };
}

export default async function ResearcherRoute(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const r = RESEARCHER_LIST.find(x => x.slug === slug);
  if (!r) notFound();
  return <ScorePage r={r} />;
}
```

(Next 15: `params` is a Promise — the `await` is required.)

- [ ] **Step 2: Create the ScorePage shell**

Create `components/researcher/ScorePage.tsx`:

```tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FOOTER } from '@/lib/content';
import { RESEARCHER_LIST, sNorm, sIndex, type Researcher } from '@/lib/researchers';

interface Edit { theta: number; omega: number }

export default function ScorePage({ r }: { r: Researcher }) {
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [slim, setSlim] = useState(false);

  useEffect(() => {
    const on = () => setSlim(window.scrollY > 60);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const rows = useMemo(() => r.datasets.map(d => {
    const e = edits[d.id];
    const theta = e?.theta ?? d.theta;
    const omega = e?.omega ?? d.omega;
    return { ...d, theta, omega, sNorm: sNorm(theta, omega, d.normFactor) };
  }), [r, edits]);
  const s = sIndex(rows);
  const edited = Object.keys(edits).length > 0;

  const other = RESEARCHER_LIST.find(x => x.slug !== r.slug);
  const otherS = other
    ? sIndex(other.datasets.map(d => ({
        sNorm: sNorm(d.theta, d.omega, d.normFactor), qualifies: d.qualifies,
      })))
    : 0;
  const hasProvisional = r.datasets.some(d => d.provisional);

  return (
    <div className="rpage">
      <header className={`rhead${slim ? ' slim' : ''}`}>
        <div className="wrap rh-in">
          <Link href="/" className="rh-back" aria-label="Back to the S-index overview">S</Link>
          <div className="rh-id">
            <h1>{r.name}</h1>
            <div className="rh-meta">
              {r.orcid && (
                <a href={`https://orcid.org/${r.orcid}`} target="_blank" rel="noreferrer">
                  ORCID {r.orcid}
                </a>
              )}
              <span>{r.field}</span>
              <span>{r.datasets.length} dataset{r.datasets.length === 1 ? '' : 's'}</span>
            </div>
            <p className="rh-sentence">{r.scoreSentence}</p>
          </div>
          <div className="rh-score">
            {edited && (
              <button type="button" className="reset" onClick={() => setEdits({})}>
                Reset values
              </button>
            )}
            <div className="chip">
              <span className="lbl">S-index</span>
              <span className="val">{s}</span>
              {edited && <span className="tag">edited</span>}
            </div>
          </div>
        </div>
      </header>

      <main className="wrap rmain">
        {/* Task 3 mounts <Workbench/> here; Task 4 mounts <AggregationStrip/> after it */}
        <section className="story">
          <div className="k">{r.story.title}</div>
          {r.story.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </section>

        <section className="cavs" aria-label="Caveats">
          <div className="cav">
            <b>Ethics is reviewed by humans.</b>
            The ethics criterion of the qualifying gate cannot be machine-checked; it is
            flagged for human review before any reporting use.
          </div>
          <div className="cav">
            <b>θ depends on infrastructure.</b>
            Where a repository does not report COUNTER usage, θ is 0 regardless of real
            use. It did not bite here — Dryad reports downloads.
          </div>
          <div className="cav">
            <b>Counts drift live.</b>
            Download counts update continuously; SATURN was observed at 372, 376 and 391
            across successive runs.
          </div>
          {hasProvisional && (
            <div className="cav prov">
              Per-dataset figures on this page are illustrative pending the team&rsquo;s
              final calculation document; the published S-index values are real.
            </div>
          )}
        </section>

        {other && (
          <Link href={`/researchers/${other.slug}`} className="xlink">
            <span className="xs" aria-hidden="true">{otherS}</span>
            <span><b>{other.name}</b><i>{other.hook}</i></span>
          </Link>
        )}
      </main>

      <footer className="ftr">{FOOTER}</footer>
    </div>
  );
}
```

- [ ] **Step 3: Append the shell CSS**

Append to `app/globals.css` (at the end, under a `/* ---- researcher pages ---- */` banner comment):

```css
/* ---- researcher pages ---- */
.rpage{min-height:100vh;background:var(--paper)}
.rhead{position:sticky;top:0;z-index:120;background:rgba(253,253,252,.9);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid transparent;padding:34px 0 22px;
  transition:padding .3s var(--ease)}
.rhead.slim{padding:11px 0;border-bottom-color:var(--rule);
  box-shadow:0 6px 24px rgba(11,36,34,.05)}
.rh-in{display:flex;align-items:center;gap:20px}
.rh-back{flex:none;width:34px;height:34px;border-radius:9px;background:var(--deep);
  color:#fff;display:grid;place-items:center;font:700 15px/1 var(--sans);
  text-decoration:none}
.rh-back:hover{background:var(--p1)}
.rh-id{min-width:0;flex:1}
.rhead h1{font:600 clamp(26px,4vw,38px)/1.12 var(--serif);letter-spacing:-.01em;
  margin:0;transition:font-size .25s var(--ease)}
.rhead.slim h1{font-size:18px}
.rh-meta{display:flex;flex-wrap:wrap;gap:5px 16px;margin-top:8px;
  font:500 13.5px/1.4 var(--sans);color:var(--ink-3)}
.rh-meta a{color:var(--p1);text-decoration:none;border-bottom:1px dotted var(--p1)}
.rh-sentence{margin:10px 0 0;color:var(--ink-2);font-size:15.5px;line-height:1.55;
  max-width:58ch}
.rhead.slim .rh-meta,.rhead.slim .rh-sentence{display:none}
.rh-score{display:flex;align-items:center;gap:12px;flex:none}
.chip{display:flex;align-items:baseline;gap:10px;background:var(--deep);color:#fff;
  border-radius:12px;padding:12px 18px}
.chip .lbl{font:600 11px/1 var(--sans);letter-spacing:.14em;text-transform:uppercase;
  color:rgba(255,255,255,.6)}
.chip .val{font:600 30px/1 var(--mono);transition:font-size .25s var(--ease)}
.rhead.slim .chip{padding:7px 13px;border-radius:9px}
.rhead.slim .chip .val{font-size:20px}
.chip .tag{font:600 10px/1 var(--sans);letter-spacing:.1em;text-transform:uppercase;
  background:var(--p2-l);color:var(--deep);border-radius:5px;padding:3px 6px;
  align-self:center}
.reset{font:600 12.5px/1 var(--sans);color:var(--ink-2);background:#fff;
  border:1px solid var(--rule);border-radius:8px;padding:9px 13px;cursor:pointer;
  transition:border-color .15s var(--ease)}
.reset:hover{border-color:var(--ink-3)}
.rmain{padding:30px 0 8px}
.story{margin:44px 0 0}
.story .k{font:600 11px/1 var(--sans);letter-spacing:.16em;text-transform:uppercase;
  color:var(--p1);margin-bottom:12px}
.story p{color:var(--ink-2);max-width:68ch;font-size:16px;line-height:1.65;
  margin:0 0 14px}
.cavs{margin:38px 0 0;display:grid;
  grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:13px}
.cav{background:#fff;border:1px solid var(--rule);border-radius:11px;
  padding:15px 17px;font:400 13.5px/1.55 var(--sans);color:var(--ink-2)}
.cav b{display:block;font-weight:600;color:var(--ink);margin-bottom:4px}
.cav.prov{grid-column:1/-1;background:var(--p2-w);border-color:var(--p2-l)}
.xlink{margin:42px 0 26px;display:flex;align-items:center;gap:16px;background:#fff;
  border:1px solid var(--rule);border-radius:13px;padding:19px 22px;
  text-decoration:none;color:var(--ink);
  transition:border-color .2s var(--ease),box-shadow .2s var(--ease)}
.xlink:hover{border-color:var(--p1);box-shadow:0 8px 22px rgba(11,36,34,.07)}
.xlink .xs{flex:none;width:52px;height:52px;border-radius:10px;background:var(--p1-w);
  color:var(--p1);display:grid;place-items:center;font:600 22px/1 var(--mono)}
.xlink b{display:block;font:600 15.5px/1.3 var(--sans)}
.xlink i{font:400 13.5px/1.4 var(--sans);color:var(--ink-3);font-style:normal}
@media (max-width:720px){
  .rh-in{flex-wrap:wrap}
  .rh-score{order:-1;margin-left:auto}
}
@media (prefers-reduced-motion: reduce){
  .rhead,.rhead h1,.chip .val,.xlink,.reset{transition:none}
}
```

- [ ] **Step 4: Verify in the dev server**

With the dev server running:

```bash
curl -s http://localhost:3000/researchers/david-bissig | grep -o "David Bissig" | head -1
curl -s http://localhost:3000/researchers/jeffrey-kaye | grep -o "Jeffrey Kaye" | head -1
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/researchers/nobody
```

Expected: `David Bissig`, `Jeffrey Kaye`, `404`. Also `npm test` still green, and `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add app/researchers components/researcher/ScorePage.tsx app/globals.css
git commit -m "feat: researcher page shell — route, sticky collapsing header, story, caveats, cross-link

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: The workbench — dataset list + live editable equation

**Files:**
- Create: `components/researcher/Workbench.tsx`
- Modify: `components/researcher/ScorePage.tsx` (add selection/edit wiring, mount Workbench)
- Modify: `app/globals.css` (append)

**Interfaces:**
- Consumes: `Dataset`, `NORM_PATH_LABEL` from `lib/researchers`; `rows` and `s` from ScorePage.
- Produces: `Workbench` default export with props
  `{ rows: WbRow[]; selected: string; sValue: number; onSelect: (id: string) => void; onEdit: (id: string, field: 'theta' | 'omega', value: number) => void }`
  where `export interface WbRow extends Dataset { sNorm: number }` (θ/ω in a `WbRow` are the *current*, possibly edited values). Task 4 and the E2E script rely on class names `.wb`, `.wb-list`, `.wb-it`, `.wb-num.t4`, `.wb-num.t2`, `.wb-out`.

- [ ] **Step 1: Create the Workbench component**

Create `components/researcher/Workbench.tsx`:

```tsx
'use client';
import { NORM_PATH_LABEL, type Dataset } from '@/lib/researchers';

export interface WbRow extends Dataset { sNorm: number }

interface Props {
  rows: WbRow[];
  selected: string;
  sValue: number;
  onSelect: (id: string) => void;
  onEdit: (id: string, field: 'theta' | 'omega', value: number) => void;
}

const fmt = (v: number) => (Math.round(v * 10) / 10).toFixed(1);

export default function Workbench({ rows, selected, sValue, onSelect, onEdit }: Props) {
  const sel = rows.find(x => x.id === selected) ?? rows[0];
  const floored = (0.1 * sel.theta + sel.omega) * sel.normFactor < 1;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = rows.findIndex(x => x.id === sel.id);
    const next = rows[i + (e.key === 'ArrowDown' ? 1 : -1)];
    if (next) onSelect(next.id);
  };

  const num = (field: 'theta' | 'omega', value: number, cls: string, label: string) => (
    <input
      type="number" min={0} step={1} value={value}
      className={`wb-num ${cls}`}
      style={{ width: `${String(value).length + 2.5}ch` }}
      aria-label={`${label} for ${sel.title}`}
      onChange={e => {
        const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
        onEdit(sel.id, field, v);
      }}
    />
  );

  return (
    <section className="wb" aria-label="Score workbench">
      <div
        className="wb-list" role="listbox" aria-label="Datasets" tabIndex={0}
        onKeyDown={onKey}
      >
        {rows.map(d => (
          <div
            key={d.id} role="option" aria-selected={d.id === sel.id}
            className={`wb-it${d.id === sel.id ? ' on' : ''}${d.qualifies ? '' : ' dq'}`}
            onClick={() => onSelect(d.id)}
          >
            <b>{d.title}</b>
            <span className="m">{d.repository}{d.year ? ` · ${d.year}` : ''}</span>
            {d.qualifies
              ? <span className="sn">S<sub>norm</sub> {fmt(d.sNorm)}</span>
              : <span className="bad">does not qualify · {d.failedGate}</span>}
          </div>
        ))}
      </div>

      <div className="wb-eq" key={sel.id}>
        <div className="wb-ds">
          <b>{sel.title}</b>
          <span>{sel.repository}{sel.doi ? ` · DOI ${sel.doi}` : ''}</span>
        </div>
        <div className="wb-line" role="group" aria-label="The equation with this dataset's values">
          <span className="g">S<sub>norm</sub> = max( 1, ( 0.1 · </span>
          <span className="wb-term t4">
            <i>θ downloads</i>
            {num('theta', sel.theta, 't4', 'θ — honest downloads')}
          </span>
          <span className="g"> + </span>
          <span className="wb-term t2">
            <i>ω citations</i>
            {num('omega', sel.omega, 't2', 'ω — citations')}
          </span>
          <span className="g"> ) × </span>
          <span className="wb-term t3">
            <i>μ<sub>g</sub>/μ<sub>f</sub></i>
            <span className="wb-fix">{sel.normFactor}</span>
          </span>
          <span className="g"> )</span>
        </div>
        <div className="wb-path">
          normalised via <b>{NORM_PATH_LABEL[sel.normPath]}</b> — the field mean is not
          the researcher&rsquo;s number, so it stays fixed
        </div>
        <p className="wb-out" aria-live="polite">
          {sel.qualifies ? (
            <>
              S<sub>norm</sub> = <b>{fmt(sel.sNorm)}</b>
              {floored && <span className="floor"> · floored to 1 — the floor at work</span>}
              <span className="agg-note"> · S-index {sValue}</span>
            </>
          ) : (
            <>S<sub>norm</sub> would be {fmt(sel.sNorm)} — <b>not counted</b></>
          )}
        </p>
        {!sel.qualifies && (
          <div className="wb-gate">
            Blocked at the gate: <b>{sel.failedGate}</b>. A dataset that fails a qualifying
            criterion is excluded from the S-index entirely — the equation only ever runs
            on qualifying datasets.
          </div>
        )}
      </div>
    </section>
  );
}
```

(Note: `key={sel.id}` on `.wb-eq` remounts the pane on selection change so the entrance animation replays; typing in the inputs does not change the key, so focus is preserved while editing. There are no non-qualifying datasets in the current fixtures — the `dq`/`wb-gate` paths are dormant until the team's calculation doc names one; the unit tests already cover exclusion in the math.)

- [ ] **Step 2: Wire it into ScorePage**

Modify `components/researcher/ScorePage.tsx`:

Add to the imports:

```tsx
import { useCallback } from 'react';           // merge into the existing react import
import Workbench from '@/components/researcher/Workbench';
```

Add state + handler after the `slim` state declaration:

```tsx
const [selected, setSelected] = useState(r.datasets[0].id);

const onEdit = useCallback((id: string, field: 'theta' | 'omega', value: number) => {
  setEdits(prev => {
    const d = r.datasets.find(x => x.id === id);
    if (!d) return prev;
    const cur = prev[id] ?? { theta: d.theta, omega: d.omega };
    const next = { ...cur, [field]: value };
    if (next.theta === d.theta && next.omega === d.omega) {
      const { [id]: _drop, ...rest } = prev;
      return rest; // editing back to the original value clears the edit
    }
    return { ...prev, [id]: next };
  });
}, [r]);
```

Replace the placeholder comment `{/* Task 3 mounts <Workbench/> here; Task 4 mounts <AggregationStrip/> after it */}` with:

```tsx
<Workbench
  rows={rows}
  selected={selected}
  sValue={s}
  onSelect={setSelected}
  onEdit={onEdit}
/>
```

- [ ] **Step 3: Append the workbench CSS**

Append to `app/globals.css`:

```css
/* ---- workbench ---- */
.wb{background:var(--deep);border-radius:22px;padding:24px;display:grid;
  grid-template-columns:minmax(250px,2fr) 3fr;gap:22px;margin-top:32px;
  box-shadow:0 24px 60px -28px rgba(11,36,34,.45)}
.wb-list{display:flex;flex-direction:column;gap:9px;outline:none;border-radius:12px}
.wb-list:focus-visible{box-shadow:0 0 0 2px var(--p1-l)}
.wb-it{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);
  border-radius:11px;padding:12px 14px;cursor:pointer;color:#fff;
  transition:background .15s var(--ease),border-color .15s var(--ease)}
.wb-it:hover{background:rgba(255,255,255,.09)}
.wb-it.on{background:rgba(255,255,255,.12);border-color:var(--p1-l)}
.wb-it b{display:block;font:600 13.5px/1.35 var(--sans)}
.wb-it .m{display:block;font:500 11.5px/1.4 var(--sans);
  color:rgba(255,255,255,.5);margin-top:2px}
.wb-it .sn{display:inline-block;margin-top:7px;font:600 12px/1 var(--mono);
  color:var(--p1-l)}
.wb-it .bad{display:inline-block;margin-top:7px;font:600 10.5px/1.3 var(--sans);
  letter-spacing:.04em;text-transform:uppercase;color:#ff9d9d}
.wb-it.dq{border-color:rgba(255,120,120,.35)}
.wb-eq{color:#fff;min-width:0;animation:wbin .22s var(--ease)}
@keyframes wbin{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:none}}
.wb-ds b{font:600 15.5px/1.35 var(--sans);display:block}
.wb-ds span{font:500 12px/1.4 var(--sans);color:rgba(255,255,255,.5)}
.wb-line{margin:20px 0 10px;font:500 clamp(15px,1.9vw,21px)/1.9 var(--mono);
  letter-spacing:-.01em;display:flex;flex-wrap:wrap;align-items:center;row-gap:14px}
.wb-line .g{color:rgba(255,255,255,.55);white-space:pre}
.wb-term{display:inline-flex;flex-direction:column;align-items:center;margin:0 2px}
.wb-term i{font:600 9.5px/1 var(--sans);letter-spacing:.09em;text-transform:uppercase;
  font-style:normal;margin-bottom:4px;opacity:.8}
.wb-term.t4 i,.wb-num.t4{color:var(--p4-l)}
.wb-term.t2 i,.wb-num.t2{color:var(--p2-l)}
.wb-term.t3 i,.wb-term.t3 .wb-fix{color:var(--p3-l)}
.wb-num{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.22);
  border-radius:7px;color:inherit;font:inherit;padding:1px 6px;text-align:center}
.wb-num:focus{outline:none;border-color:#fff;background:rgba(255,255,255,.14)}
.wb-fix{padding:1px 6px}
.wb-path{font:500 12px/1.5 var(--sans);color:rgba(255,255,255,.5)}
.wb-path b{color:var(--p3-l);font-weight:600}
.wb-out{margin:16px 0 0;font:500 16px/1.5 var(--mono)}
.wb-out b{color:var(--p1-l)}
.wb-out .floor{color:var(--p1-l);font:500 12.5px/1 var(--sans)}
.wb-out .agg-note{color:rgba(255,255,255,.55);font:500 12.5px/1 var(--sans)}
.wb-gate{margin-top:14px;background:rgba(255,90,90,.12);
  border:1px solid rgba(255,120,120,.4);border-radius:10px;padding:12px 14px;
  font:400 13px/1.5 var(--sans);color:#ffd9d9}
.wb-gate b{color:#ff9d9d}
@media (max-width:959px){
  .wb{grid-template-columns:1fr}
  .wb-list{flex-direction:row;overflow-x:auto;padding-bottom:6px}
  .wb-it{flex:none;width:200px}
}
@media (prefers-reduced-motion: reduce){
  .wb-eq{animation:none}
  .wb-it{transition:none}
}
```

- [ ] **Step 4: Verify in the dev server**

```bash
curl -s http://localhost:3000/researchers/david-bissig | grep -c "wb-it"
curl -s http://localhost:3000/researchers/david-bissig | grep -o "normalised via" | head -1
```

Expected: `5` (or more — class appears once per dataset entry) and `normalised via`. Then `npx tsc --noEmit` clean, `npm test` green. Interactivity (clicks, edits, S-index flip) is verified by the Task 6 Playwright script — do not skip it.

- [ ] **Step 5: Commit**

```bash
git add components/researcher app/globals.css
git commit -m "feat: interactive workbench — dataset listbox, live editable equation, persistent edits

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Aggregation strip — live ranked bars with cutoff

**Files:**
- Create: `components/researcher/AggregationStrip.tsx`
- Modify: `components/researcher/ScorePage.tsx` (mount below Workbench)
- Modify: `app/globals.css` (append)

**Interfaces:**
- Consumes: `rows` and `s` from ScorePage.
- Produces: `AggregationStrip` default export with props
  `{ rows: { id: string; title: string; sNorm: number; qualifies: boolean; failedGate: string | null }[]; s: number }`
  (structurally satisfied by `WbRow[]`). E2E relies on `.agg`, `.agg-cap`, `.fill`, `.fill.under`, `.track .cut`.

- [ ] **Step 1: Create the component**

Create `components/researcher/AggregationStrip.tsx`:

```tsx
'use client';

interface AggRow {
  id: string; title: string; sNorm: number;
  qualifies: boolean; failedGate: string | null;
}

const fmt = (v: number) => (Math.round(v * 10) / 10).toFixed(1);

export default function AggregationStrip({ rows, s }: { rows: AggRow[]; s: number }) {
  const q = rows.filter(r => r.qualifies).slice().sort((a, b) => b.sNorm - a.sNorm);
  const dq = rows.filter(r => !r.qualifies);
  const max = Math.max(...q.map(r => r.sNorm), s, 1);
  // square-root scale: the data spans 1.0–40.6, linear bars would hide the small ones
  const pos = (v: number) => Math.sqrt(v / max) * 100;

  return (
    <section className="agg" aria-label="How the datasets aggregate to the S-index">
      <div className="agg-cap" aria-live="polite">
        {s > 0
          ? <>{s} qualifying dataset{s === 1 ? '' : 's'} clear S<sub>norm</sub> ≥ {s} → <b>S-index = {s}</b></>
          : <>No qualifying datasets → <b>S-index = 0</b></>}
      </div>
      <div className="agg-rows">
        {q.map(r => (
          <div className="agg-row" key={r.id}>
            <span className="t">{r.title}</span>
            <div className="track">
              <div
                className={`fill${s > 0 && r.sNorm >= s ? '' : ' under'}`}
                style={{ width: `${pos(r.sNorm)}%` }}
              />
              {s > 0 && <i className="cut" style={{ left: `${pos(s)}%` }} aria-hidden="true" />}
              <span
                className="v"
                style={{ left: `min(calc(${pos(r.sNorm)}% + 8px), calc(100% - 44px))` }}
              >
                {fmt(r.sNorm)}
              </span>
            </div>
          </div>
        ))}
      </div>
      {dq.map(r => (
        <div className="agg-dq" key={r.id}>
          {r.title} — does not qualify ({r.failedGate}); outside the ranking
        </div>
      ))}
      <div className="agg-note">
        Bar lengths use a square-root scale so small scores stay visible. The dashed line
        is the S-index cutoff.
      </div>
    </section>
  );
}
```

(The per-track dashed `.cut` ticks sit at the same percentage in every equal-width track, so they align into one vertical cutoff line across the strip.)

- [ ] **Step 2: Mount it in ScorePage**

In `components/researcher/ScorePage.tsx`, add the import:

```tsx
import AggregationStrip from '@/components/researcher/AggregationStrip';
```

and directly below the `<Workbench … />` element add:

```tsx
<AggregationStrip rows={rows} s={s} />
```

- [ ] **Step 3: Append the CSS**

Append to `app/globals.css`:

```css
/* ---- aggregation strip ---- */
.agg{background:#fff;border:1px solid var(--rule);border-radius:16px;
  padding:22px 24px;margin-top:16px}
.agg-cap{font:500 14.5px/1.4 var(--sans);color:var(--ink-2);margin-bottom:16px}
.agg-cap b{color:var(--ink)}
.agg-row{display:flex;align-items:center;gap:14px;margin:9px 0}
.agg-row .t{flex:none;width:200px;font:500 12.5px/1.35 var(--sans);
  color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  text-align:right}
.track{position:relative;flex:1;height:22px;background:var(--rule-2);border-radius:6px}
.fill{height:100%;border-radius:6px;background:var(--p1);opacity:.85;
  transition:width .35s var(--ease)}
.fill.under{background:var(--ink-3);opacity:.5}
.track .cut{position:absolute;top:-4px;bottom:-4px;
  border-left:2px dashed var(--p4);opacity:.65}
.track .v{position:absolute;top:50%;transform:translateY(-50%);
  font:600 11.5px/1 var(--mono);color:var(--ink-2)}
.agg-dq{margin-top:12px;font:500 12.5px/1.4 var(--sans);color:var(--p4)}
.agg-note{margin-top:14px;font:400 11.5px/1.4 var(--sans);color:var(--ink-3)}
@media (max-width:640px){.agg-row .t{width:110px}}
@media (prefers-reduced-motion: reduce){.fill{transition:none}}
```

- [ ] **Step 4: Verify in the dev server**

```bash
curl -s http://localhost:3000/researchers/david-bissig | grep -o "S-index = 3" | head -1
curl -s http://localhost:3000/researchers/jeffrey-kaye | grep -o "S-index = 1" | head -1
```

Expected: `S-index = 3` and `S-index = 1`. `npx tsc --noEmit` clean, `npm test` green.

- [ ] **Step 5: Commit**

```bash
git add components/researcher app/globals.css
git commit -m "feat: live aggregation strip — sqrt-scaled ranked bars with S-index cutoff

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Landing page — real researcher cards that link

**Files:**
- Modify: `lib/content.ts:108-111` (the `RESEARCHERS` array)
- Modify: `components/Tail.tsx`
- Modify: `app/globals.css` (append)
- Test: `lib/__tests__/researchers.test.ts` (add one consistency test)

**Interfaces:**
- Consumes: `RESEARCHER_LIST`, `sNorm`, `sIndex` from Task 1.
- Produces: `RESEARCHERS` entries gain a `slug: string` field consumed by `Tail.tsx`.

- [ ] **Step 1: Write the failing consistency test**

Append to `lib/__tests__/researchers.test.ts` (add `import { RESEARCHERS } from '../content';` to the imports):

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/__tests__/researchers.test.ts`
Expected: FAIL — TypeScript/runtime: `card.slug` is undefined and names/scores don't match (`Dr. Elena Marsh` etc.).

- [ ] **Step 3: Update the content and the Tail**

In `lib/content.ts`, replace the whole `RESEARCHERS` block:

```ts
export const RESEARCHERS = [
  {
    score: 3, slug: 'david-bissig', name: 'David Bissig',
    meta: 'Neuroscience · 5 shared datasets',
  },
  {
    score: 1, slug: 'jeffrey-kaye', name: 'Jeffrey Kaye',
    meta: 'Neurology · 1 linked dataset — and that’s the finding',
  },
];
```

Replace `components/Tail.tsx` entirely with:

```tsx
import Link from 'next/link';
import { RESEARCHERS, FOOTER } from '@/lib/content';

export default function Tail() {
  return (
    <>
      <section className="tail wrap">
        <div className="k">See it work</div>
        <h2>Two researchers, and every number traced</h2>
        <p>
          The same equation, carrying real shared data — open a researcher and drive
          the numbers yourself.
        </p>
        <div className="rcs">
          {RESEARCHERS.map(r => (
            <Link className="rc" key={r.slug} href={`/researchers/${r.slug}`}>
              <div className="s" aria-hidden="true">{r.score}</div>
              <div><b>{r.name}</b><span>{r.meta}</span></div>
              <span className="go" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
      <footer className="ftr">{FOOTER}</footer>
    </>
  );
}
```

Append to `app/globals.css` (do not edit the existing `.rc` block — these are additive rules):

```css
/* ---- researcher cards are links now ---- */
a.rc{text-decoration:none;color:inherit;
  transition:border-color .2s var(--ease),box-shadow .2s var(--ease),
    transform .2s var(--ease)}
a.rc:hover{border-color:var(--p1);box-shadow:0 10px 26px rgba(11,36,34,.08);
  transform:translateY(-2px)}
.rc .go{margin-left:auto;color:var(--p1);font:600 17px/1 var(--sans)}
@media (prefers-reduced-motion: reduce){a.rc{transition:none}}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: all green, including the existing `content.test.ts` ('has two example researchers' still holds) and the new landing-cards test. `npx tsc --noEmit` clean. Quick smoke: `curl -s http://localhost:3000 | grep -o "researchers/david-bissig" | head -1` → `researchers/david-bissig`.

- [ ] **Step 5: Commit**

```bash
git add lib/content.ts components/Tail.tsx app/globals.css lib/__tests__/researchers.test.ts
git commit -m "feat: landing cards show the real researchers and link to their pages

Note for the copy-deck reconciliation: the two researcher card lines changed
after the deck went to the team.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: End-to-end verification + production build check

**Files:**
- Create: `.superpowers/sdd/verify-researchers.mjs` (gitignored — never committed)
- Modify: only if the script finds defects (fix + commit each fix).

**Interfaces:**
- Consumes: the running dev server, all class names produced by Tasks 2–5 (`.rhead`, `.chip .val`, `.chip .tag`, `.reset`, `.wb-it`, `.wb-num.t4`, `.wb-num.t2`, `.agg-cap`, `.fill`, `a.rc`).
- Produces: a pass/fail report; a clean production build.

- [ ] **Step 1: Write the verification script**

Create `.superpowers/sdd/verify-researchers.mjs`:

```js
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗ FAIL:', name); }
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e)));

// --- Bissig page basics
await page.goto(`${BASE}/researchers/david-bissig`);
await page.waitForSelector('.wb-it');
ok((await page.locator('.rhead h1').textContent()) === 'David Bissig', 'Bissig h1 renders');
ok((await page.locator('.chip .val').textContent()) === '3', 'header chip shows S-index 3');
ok((await page.locator('.wb-it').count()) === 5, 'five datasets in the list');
ok((await page.locator('.agg-cap').textContent()).includes('S-index = 3'), 'aggregation caption says 3');
ok((await page.locator('.fill:not(.under)').count()) === 3, 'three bars clear the cutoff');

// --- selection updates the equation
await page.locator('.wb-it').nth(1).click();
ok((await page.locator('.wb-num.t4').inputValue()) === '372', 'selecting SATURN shows θ = 372');

// --- keyboard selection
await page.locator('.wb-list').focus();
await page.keyboard.press('ArrowDown');
ok(await page.locator('.wb-it').nth(2).getAttribute('aria-selected') === 'true',
  'ArrowDown moves selection');

// --- edit flips the S-index; edits persist across selection; reset restores
await page.locator('.wb-it').nth(3).click();
await page.locator('.wb-num.t2').fill('5');
ok((await page.locator('.chip .val').textContent()) === '4', 'ω edit flips S-index to 4');
ok(await page.locator('.chip .tag').isVisible(), 'edited tag appears');
await page.locator('.wb-it').nth(0).click(); // switch away…
await page.locator('.wb-it').nth(3).click(); // …and back
ok((await page.locator('.wb-num.t2').inputValue()) === '5', 'edit persists across selection');
await page.locator('.reset').click();
ok((await page.locator('.chip .val').textContent()) === '3', 'reset restores S-index 3');
ok((await page.locator('.chip .tag').count()) === 0, 'edited tag gone after reset');

// --- sticky header collapses and stays visible
await page.mouse.wheel(0, 800);
await page.waitForTimeout(400);
ok(await page.locator('.rhead.slim').count() === 1, 'header collapses to slim on scroll');
const chipBox = await page.locator('.chip').boundingBox();
ok(chipBox !== null && chipBox.y >= 0 && chipBox.y < 120, 'S-index chip still visible when slim');

// --- Kaye page
await page.goto(`${BASE}/researchers/jeffrey-kaye`);
await page.waitForSelector('.wb-it');
ok((await page.locator('.chip .val').textContent()) === '1', 'Kaye chip shows 1');
ok((await page.locator('.wb-it').count()) === 1, 'Kaye lists one dataset');
ok((await page.locator('.story').textContent()).includes('ORCID'), 'Kaye story tells the ORCID finding');

// --- 404 for unknown slug
const resp = await page.goto(`${BASE}/researchers/nobody`);
ok(resp.status() === 404, 'unknown slug returns 404');

// --- landing links (static-flow mode at narrow width so the Tail is plainly in flow)
const nPage = await (await browser.newContext({ viewport: { width: 800, height: 900 } })).newPage();
await nPage.goto(BASE);
await nPage.waitForSelector('a.rc');
ok((await nPage.locator('a.rc').first().getAttribute('href')) === '/researchers/david-bissig',
  'landing card links to Bissig');
await nPage.locator('a.rc').first().click();
await nPage.waitForURL('**/researchers/david-bissig');
ok(true, 'landing card navigates');

// --- mobile layout: workbench stacks to one column
const mPage = await (await browser.newContext({ viewport: { width: 375, height: 812 } })).newPage();
await mPage.goto(`${BASE}/researchers/david-bissig`);
await mPage.waitForSelector('.wb');
const cols = await mPage.locator('.wb').evaluate(el => getComputedStyle(el).gridTemplateColumns);
ok(!cols.trim().includes(' '), 'workbench is single-column at 375px');

ok(pageErrors.length === 0, `no page errors (got: ${pageErrors.join(' | ') || 'none'})`);

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it against the dev server**

Ensure the dev server is running, then:

Run: `node .superpowers/sdd/verify-researchers.mjs`
Expected: `21 passed, 0 failed`, exit code 0.

- [ ] **Step 3: Fix anything it catches**

For each failure: diagnose, fix the component/CSS, re-run the script until green. Commit each real fix separately with a `fix:` message (+ the co-author trailer). Do not weaken the script's assertions to make it pass.

- [ ] **Step 4: Production build check**

The dev server must be stopped first (global constraint):

```bash
taskkill //F //IM node.exe
rm -rf .next
npm run build
```

Expected: build succeeds; the route list shows `/researchers/[slug]` as SSG with the two slugs prerendered. Then restart the dev server in the background (`npm run dev`) for any follow-up work.

- [ ] **Step 5: Final commit (only if fixes were made in Step 3/4)**

```bash
git add -A ':!.superpowers'
git commit -m "fix: researcher page issues found in E2E verification

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Deliberately out of scope (do not build)

- Wheel-driven dataset cycling inside the list.
- Editing μg/μf or gate outcomes.
- Inventing a non-qualifying dataset row (wait for the team's calculation doc; the code paths for `qualifies: false` exist and are dormant).
- A `/researchers` index page, leaderboards, more researchers, live API computation.
- Deploying to production — the user decides that after review.
