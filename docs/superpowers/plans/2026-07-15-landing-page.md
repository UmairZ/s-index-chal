# S-Index Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the S-index landing page (principles-first, equation revealed) with two reveal variants behind an on-page A/B toggle, live on Vercel.

**Architecture:** Next.js App Router serving one client-rendered landing page. All copy lives in `lib/content.ts`. Two reveal components (`RevealA` scroll-scrubbed assembly, `RevealB` left-rail dock) share the Hero, PrincipleCard, Equation, and ExplainerPanel components. A hash-persisted toggle switches variants; a `matchMedia` hook swaps in a static no-choreography fallback for reduced-motion/narrow viewports.

**Tech Stack:** Next.js 15 (App Router), TypeScript, React 19, `motion` (framer-motion successor), plain global CSS, vitest (dev only), Vercel.

## Global Constraints

- Runtime dependencies: `next`, `react`, `react-dom`, `motion` — nothing else. Dev: `typescript`, `@types/*`, `vitest`.
- No Tailwind, no UI kit. One stylesheet: `app/globals.css`.
- Design tokens (copy verbatim, semantic — a color always means the same principle):
  `--p1:#2e7d74 --p1-l:#7fd3c7 --p1-w:#e7f2f0` (teal, P1) · `--p2:#a8802f --p2-l:#e8c37a --p2-w:#faf1de` (gold, P2) · `--p3:#4a5aa8 --p3-l:#9aa8ea --p3-w:#e9ecf8` (indigo, P3) · `--p4:#ac4d63 --p4-l:#e69aac --p4-w:#fae9ed` (rose, P4) · `--deep:#0b2422` (dark stage).
- The equation is selectable text (mono font + `<sub>`), never an image.
- Researcher cards in the tail are `<div>`s, not links (researchers page doesn't exist yet — no dead `<a>`).
- Reduced motion (`prefers-reduced-motion: reduce`) OR viewport < 960px → static fallback, zero choreography.
- Default variant is A; hash `#a` / `#b` selects and persists variant.
- Dev server: `npm run dev` → http://localhost:3000. Visual verification via Playwright MCP browser tools (`browser_navigate`, `browser_take_screenshot`, `browser_resize`); fall back to `curl` HTML grep when a browser isn't available.
- Windows environment: run npm/npx via PowerShell or Git Bash; paths in this plan are repo-relative.

---

### Task 1: Next.js scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a booting Next app; `app/globals.css` `:root` tokens every later task's CSS relies on; `.wrap` container class.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "s-index-site",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "motion": "^12.0.0",
    "next": "^15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `app/globals.css` (tokens + base)**

```css
:root{
  --p1:#2e7d74; --p1-l:#7fd3c7; --p1-w:#e7f2f0;
  --p2:#a8802f; --p2-l:#e8c37a; --p2-w:#faf1de;
  --p3:#4a5aa8; --p3-l:#9aa8ea; --p3-w:#e9ecf8;
  --p4:#ac4d63; --p4-l:#e69aac; --p4-w:#fae9ed;
  --deep:#0b2422;
  --ink:#0d1a19; --ink-2:#41544f; --ink-3:#7b8d89;
  --rule:#dde5e3; --rule-2:#eef2f1; --paper:#fdfdfc;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
  --sans:ui-sans-serif,-apple-system,"Segoe UI",Inter,system-ui,sans-serif;
  --mono:ui-monospace,"SF Mono",SFMono-Regular,Menlo,monospace;
  --ease:cubic-bezier(.4,0,.2,1);
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
  font:16px/1.65 var(--serif);-webkit-font-smoothing:antialiased}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0}
.wrap{max-width:1080px;margin:0 auto;padding:0 26px}
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
```

- [ ] **Step 4: Write `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'S-index · A measure of shared data',
  description:
    'A metric for research data sharing, built from four principles. An AI.Health4All proposal for the NIH data sharing challenge.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Write placeholder `app/page.tsx`**

```tsx
export default function Home() {
  return <main className="wrap">S-index</main>;
}
```

- [ ] **Step 6: Install and boot**

Run: `npm install` (expect: clean install, lockfile created), then `npm run dev` in background.
Verify: `curl -s http://localhost:3000 | grep -c "S-index"` → `1` or more. Note: first run generates `next-env.d.ts` — keep it.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: scaffold Next.js app with design tokens"
```

---

### Task 2: Content and variant modules (with tests)

**Files:**
- Create: `lib/content.ts`, `lib/variant.ts`
- Test: `lib/__tests__/content.test.ts`, `lib/__tests__/variant.test.ts`

**Interfaces:**
- Produces (used by every later task):
  - `type PrincipleKey = 'p1'|'p2'|'p3'|'p4'`, `type TermKey = 'max'|'theta'|'omega'|'norm'`, `type Variant = 'a'|'b'`
  - `PRINCIPLES: Principle[]` where `Principle = { key: PrincipleKey; num: number; title: string; body: string; maps: string; note: string }`
  - `TERM_META: Record<TermKey, { principle: PrincipleKey; label: string }>`
  - `CARD_TERM: Record<PrincipleKey, TermKey>`
  - `PANELS: Record<TermKey, Panel>` where `Panel = { badge: string; principle: PrincipleKey; title: string; paragraphs: string[]; checksLead?: string; checks?: { title: string; body: string; principle: PrincipleKey }[]; links: { label: string; term: TermKey }[] }` — `paragraphs` may contain `<em>` HTML.
  - `HERO = { kicker, headline, sub }`, `RESEARCHERS: { score: number; name: string; meta: string }[]`, `FOOTER: string`
  - `parseVariant(hash: string): Variant`

- [ ] **Step 1: Write the failing tests**

`lib/__tests__/variant.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseVariant } from '../variant';

describe('parseVariant', () => {
  it('parses #b', () => expect(parseVariant('#b')).toBe('b'));
  it('parses #B case-insensitively', () => expect(parseVariant('#B')).toBe('b'));
  it('defaults empty to a', () => expect(parseVariant('')).toBe('a'));
  it('parses #a', () => expect(parseVariant('#a')).toBe('a'));
  it('defaults junk to a', () => expect(parseVariant('#pricing')).toBe('a'));
});
```

`lib/__tests__/content.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PRINCIPLES, PANELS, TERM_META, CARD_TERM, RESEARCHERS } from '../content';

describe('content integrity', () => {
  it('has exactly four principles, p1..p4 in order', () => {
    expect(PRINCIPLES.map(p => p.key)).toEqual(['p1', 'p2', 'p3', 'p4']);
    expect(PRINCIPLES.map(p => p.num)).toEqual([1, 2, 3, 4]);
  });
  it('has a panel for every term', () => {
    expect(Object.keys(PANELS).sort()).toEqual(['max', 'norm', 'omega', 'theta']);
  });
  it('maps every principle to a distinct term and back', () => {
    const terms = Object.values(CARD_TERM);
    expect(new Set(terms).size).toBe(4);
    for (const [term, meta] of Object.entries(TERM_META)) {
      expect(CARD_TERM[meta.principle]).toBe(term);
    }
  });
  it('panel links point at real terms', () => {
    for (const panel of Object.values(PANELS))
      for (const link of panel.links) expect(TERM_META[link.term]).toBeDefined();
  });
  it('has two example researchers', () => expect(RESEARCHERS).toHaveLength(2));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run`
Expected: FAIL — cannot resolve `../variant` / `../content`.

- [ ] **Step 3: Write `lib/variant.ts`**

```ts
export type Variant = 'a' | 'b';

export function parseVariant(hash: string): Variant {
  return hash.replace('#', '').toLowerCase() === 'b' ? 'b' : 'a';
}
```

- [ ] **Step 4: Write `lib/content.ts`** (copy from the mockup, adapted to term-level panels)

```ts
export type PrincipleKey = 'p1' | 'p2' | 'p3' | 'p4';
export type TermKey = 'max' | 'theta' | 'omega' | 'norm';

export interface Principle {
  key: PrincipleKey;
  num: number;
  title: string;
  body: string;
  maps: string;
  note: string;
}

export const PRINCIPLES: Principle[] = [
  {
    key: 'p1', num: 1, title: 'Inherent value',
    body: 'FAIR-aligned sharing is a real contribution, even when nobody has reused the data yet.',
    maps: 'the floor',
    note: 'The floor. A qualifying dataset is worth at least 1, even if nobody has touched it yet.',
  },
  {
    key: 'p2', num: 2, title: 'How & where shared',
    body: 'Whether data can be reused at all depends on where it lives and how it is described.',
    maps: 'the gate',
    note: 'ω — citations, weighted ten to one over downloads. Only possible with a persistent identifier.',
  },
  {
    key: 'p3', num: 3, title: 'Norms & ethics',
    body: 'Impact means different things in different fields, so it should be judged inside one.',
    maps: 'normalisation',
    note: 'μg/μf — measured against the citation norms of its own discipline.',
  },
  {
    key: 'p4', num: 4, title: 'Collaborative credit',
    body: 'Research is collective. Contributions across the data lifecycle should be named.',
    maps: 'ORCID + CRediT',
    note: 'θ — downloads, excluding your own. Only countable when contributors are named.',
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
  { score: 3, name: 'Dr. Elena Marsh', meta: 'Structural biology · 6 datasets' },
  { score: 6, name: 'Dr. Amara Okonjo', meta: 'Climate science · 11 datasets' },
];

export const FOOTER =
  'An AI.Health4All project · CU Anschutz · University of Michigan · UIC · OHSU';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run`
Expected: PASS — 2 files, 10 tests.

- [ ] **Step 6: Commit**

```bash
git add lib package.json && git commit -m "feat: content and variant modules with tests"
```

---

### Task 3: Shared shell components (Nav, HeroIntro, PrincipleCard, Tail)

**Files:**
- Create: `components/Nav.tsx`, `components/HeroIntro.tsx`, `components/PrincipleCard.tsx`, `components/Tail.tsx`
- Modify: `app/page.tsx`, `app/globals.css` (append)

**Interfaces:**
- Consumes: `PRINCIPLES`, `HERO`, `RESEARCHERS`, `FOOTER` from `@/lib/content`.
- Produces: `<Nav />`, `<HeroIntro />` (no props), `<PrincipleCard p={Principle} />`, `<Tail />`. CSS classes `.stage .snav .intro .prins .prin .tail .rcs .rc .ftr` used by later tasks.

- [ ] **Step 1: Write `components/Nav.tsx`**

```tsx
export default function Nav() {
  return (
    <header className="snav">
      <div className="mark"><span className="g">S</span> S-index</div>
      <nav className="links" aria-label="Site">
        <span>Examples</span><span>The data</span><span>About</span>
      </nav>
    </header>
  );
}
```

(Plain `<span>`s: those pages don't exist yet — no dead links.)

- [ ] **Step 2: Write `components/HeroIntro.tsx`**

```tsx
import { HERO } from '@/lib/content';

export default function HeroIntro() {
  return (
    <div className="intro">
      <div className="k">{HERO.kicker}</div>
      <h1>{HERO.headline}</h1>
      <p>{HERO.sub}</p>
    </div>
  );
}
```

- [ ] **Step 3: Write `components/PrincipleCard.tsx`**

```tsx
import type { Principle } from '@/lib/content';

export default function PrincipleCard({ p }: { p: Principle }) {
  return (
    <article className={`prin ${p.key}`}>
      <div className="n" aria-hidden="true">{p.num}</div>
      <b>{p.title}</b>
      <p>{p.body}</p>
      <div className="mp">→ {p.maps}</div>
    </article>
  );
}
```

- [ ] **Step 4: Write `components/Tail.tsx`**

```tsx
import { RESEARCHERS, FOOTER } from '@/lib/content';

export default function Tail() {
  return (
    <>
      <section className="tail wrap">
        <div className="k">See it work</div>
        <h2>Two researchers, and every number traced</h2>
        <p>The same equation, carrying real shared data. Researcher pages are coming next.</p>
        <div className="rcs">
          {RESEARCHERS.map(r => (
            <div className="rc" key={r.name}>
              <div className="s" aria-hidden="true">{r.score}</div>
              <div><b>{r.name}</b><span>{r.meta}</span></div>
            </div>
          ))}
        </div>
      </section>
      <footer className="ftr">{FOOTER}</footer>
    </>
  );
}
```

- [ ] **Step 5: Append to `app/globals.css`**

```css
/* ---------- dark stage + nav ---------- */
.stage{background:var(--deep);color:#fff;position:relative;overflow:clip;
  background-image:radial-gradient(ellipse 70% 50% at 50% 30%, #16403c 0%, var(--deep) 72%)}
.snav{display:flex;align-items:center;padding:20px 0;color:#fff}
.snav .mark{font:600 18px/1 var(--sans);display:flex;align-items:center;gap:9px}
.snav .mark .g{width:25px;height:25px;border-radius:7px;display:grid;place-items:center;
  font:700 13px/1 var(--serif);background:var(--p1-l);color:var(--deep)}
.snav .links{margin-left:auto;display:flex;gap:22px;font:500 13.5px/1 var(--sans);
  color:rgba(255,255,255,.5)}

/* ---------- hero intro ---------- */
.intro{text-align:center;padding:44px 0 10px}
.intro .k{font:600 11px/1 var(--sans);letter-spacing:.18em;text-transform:uppercase;
  color:var(--p1-l);margin-bottom:14px}
.intro h1{font:600 clamp(26px,3.6vw,40px)/1.18 var(--serif);margin:0 auto 12px;
  max-width:22ch;letter-spacing:-.015em}
.intro p{margin:0 auto;max-width:56ch;color:rgba(255,255,255,.58);font-size:16px}

/* ---------- principle cards ---------- */
.prins{display:grid;grid-template-columns:repeat(4,1fr);gap:13px}
.prin{border-radius:11px;padding:19px 19px 21px;border:1px solid transparent;color:var(--ink)}
.prin .n{width:23px;height:23px;border-radius:50%;display:grid;place-items:center;
  font:700 11.5px/1 var(--sans);color:#fff;margin-bottom:12px}
.prin b{display:block;font:600 14.5px/1.3 var(--sans);margin-bottom:6px}
.prin p{margin:0;font:400 13px/1.55 var(--sans);color:var(--ink-2)}
.prin .mp{margin-top:13px;padding-top:11px;border-top:1px dashed rgba(0,0,0,.12);
  font:500 11.5px/1.4 var(--mono)}
.prin.p1{background:var(--p1-w)} .prin.p1 .n{background:var(--p1)} .prin.p1 .mp{color:var(--p1)}
.prin.p2{background:var(--p2-w)} .prin.p2 .n{background:var(--p2)} .prin.p2 .mp{color:var(--p2)}
.prin.p3{background:var(--p3-w)} .prin.p3 .n{background:var(--p3)} .prin.p3 .mp{color:var(--p3)}
.prin.p4{background:var(--p4-w)} .prin.p4 .n{background:var(--p4)} .prin.p4 .mp{color:var(--p4)}
@media(max-width:959px){.prins{grid-template-columns:1fr}}

/* ---------- tail + footer ---------- */
.tail{padding:56px 0;}
.tail .k{font:600 11px/1 var(--sans);letter-spacing:.16em;text-transform:uppercase;
  color:var(--ink-3);margin-bottom:16px}
.tail h2{font:600 27px/1.25 var(--serif);margin:0 0 12px;letter-spacing:-.01em}
.tail p{color:var(--ink-2);max-width:60ch;margin:0 0 26px;font-size:16.5px}
.rcs{display:grid;grid-template-columns:1fr 1fr;gap:15px}
@media(max-width:900px){.rcs{grid-template-columns:1fr}}
.rc{background:#fff;border:1px solid var(--rule);border-radius:12px;padding:21px 23px;
  display:flex;align-items:center;gap:17px}
.rc .s{flex:none;width:58px;height:58px;border-radius:11px;background:var(--p1-w);
  border:1px solid #cfe4e0;display:grid;place-items:center;font:600 26px/1 var(--mono);color:var(--p1)}
.rc b{display:block;font:600 16px/1.3 var(--sans);margin-bottom:3px}
.rc span{font-size:13.5px;color:var(--ink-3)}
.ftr{padding:34px 0 54px;color:var(--ink-3);font:500 13px/1.6 var(--sans);text-align:center}
```

- [ ] **Step 6: Assemble in `app/page.tsx`** (temporary static assembly — Task 5 replaces this)

```tsx
import Nav from '@/components/Nav';
import HeroIntro from '@/components/HeroIntro';
import PrincipleCard from '@/components/PrincipleCard';
import Tail from '@/components/Tail';
import { PRINCIPLES } from '@/lib/content';

export default function Home() {
  return (
    <main>
      <div className="stage">
        <div className="wrap">
          <Nav />
          <HeroIntro />
          <div className="prins" style={{ padding: '32px 0 64px' }}>
            {PRINCIPLES.map(p => <PrincipleCard key={p.key} p={p} />)}
          </div>
        </div>
      </div>
      <Tail />
    </main>
  );
}
```

- [ ] **Step 7: Verify visually**

With dev server running, Playwright: `browser_navigate` → `http://localhost:3000`, `browser_take_screenshot`. Confirm: dark stage, nav, headline, four pastel principle cards in a row (teal/gold/indigo/rose in order), light tail with two researcher cards, footer. Fallback check: `curl -s http://localhost:3000 | grep -c "Inherent value"` → ≥1.

- [ ] **Step 8: Commit**

```bash
git add components app && git commit -m "feat: shared shell components (nav, hero, principles, tail)"
```

---

### Task 4: Equation + explainer panel

**Files:**
- Create: `components/Equation.tsx`, `components/ExplainerPanel.tsx`
- Modify: `app/page.tsx` (temporarily mount for verification), `app/globals.css` (append)

**Interfaces:**
- Consumes: `TermKey`, `TERM_META`, `PANELS` from `@/lib/content`.
- Produces:
  - `<Equation interactive={boolean} onTermClick={(k: TermKey) => void} highlight={TermKey | null | undefined} termRef={(k: TermKey, el: HTMLButtonElement | null) => void | undefined} />`
  - `<ExplainerPanel term={TermKey | null} onClose={() => void} onJump={(k: TermKey) => void} />`
  - CSS classes `.eq .term .panel*` used by Tasks 5–7.

- [ ] **Step 1: Write `components/Equation.tsx`**

```tsx
'use client';
import type { TermKey } from '@/lib/content';

interface Props {
  interactive?: boolean;
  onTermClick?: (k: TermKey) => void;
  highlight?: TermKey | null;
  termRef?: (k: TermKey, el: HTMLButtonElement | null) => void;
}

export default function Equation({ interactive = true, onTermClick, highlight, termRef }: Props) {
  const term = (k: TermKey, cls: string, label: string, children: React.ReactNode) => (
    <button
      type="button"
      className={`term ${cls}${highlight === k ? ' hl' : ''}`}
      data-term={k}
      aria-label={label}
      tabIndex={interactive ? 0 : -1}
      onClick={() => interactive && onTermClick?.(k)}
      ref={el => termRef?.(k, el)}
    >
      {children}
    </button>
  );

  return (
    <div className="eq" role="group" aria-label="The S-index equation. Each coloured term opens an explanation.">
      <span className="g">S<sub>norm</sub>&nbsp;=&nbsp;</span>
      {term('max', 't-p1', 'The floor: max of 1 — principle 1, inherent value', <>max(&nbsp;1&nbsp;,</>)}
      <span className="g">&nbsp;(0.1·</span>
      {term('theta', 't-p4', 'Theta: honest downloads — principle 4, collaborative credit', <>θ</>)}
      <span className="g">&nbsp;+&nbsp;</span>
      {term('omega', 't-p2', 'Omega: citations — principle 2, how and where shared', <>ω</>)}
      <span className="g">)&nbsp;×&nbsp;</span>
      {term('norm', 't-p3', 'Mu-g over mu-f: field normalisation — principle 3, norms and ethics',
        <>μ<sub>g</sub>/μ<sub>f</sub></>)}
      {term('max', 't-p1', 'Closing the floor: max of 1 — principle 1, inherent value', <>)</>)}
    </div>
  );
}
```

Note: `termRef` fires for `max` twice (opening and closing paren); last write wins — choreography docks P1's card on the closing paren, which is fine visually, but Task 6 measures the *opening* paren. Task 6 therefore keeps the first non-null element per key (see its `setTermRef`).

- [ ] **Step 2: Write `components/ExplainerPanel.tsx`**

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { PANELS, type TermKey } from '@/lib/content';

interface Props {
  term: TermKey | null;
  onClose: () => void;
  onJump: (k: TermKey) => void;
}

export default function ExplainerPanel({ term, onClose, onJump }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!term) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [term, onClose]);

  if (!term) return null;
  const p = PANELS[term];

  return (
    <div className="panelwrap">
      <div className="panelbg" onClick={onClose} aria-hidden="true" />
      <aside className={`panel pk-${p.principle}`} role="dialog" aria-modal="true"
        aria-label={p.title} tabIndex={-1} ref={ref}>
        <button className="cls" onClick={onClose} aria-label="Close">×</button>
        <div className="ptop">
          <span className={`bdg b-${p.principle}`}>{p.badge}</span>
          <h3>{p.title}</h3>
        </div>
        {p.paragraphs.map((html, i) => (
          <p className="bd" key={i} dangerouslySetInnerHTML={{ __html: html }} />
        ))}
        {p.checks && (
          <>
            <div className="glead">{p.checksLead}</div>
            <div className="checks">
              {p.checks.map(c => (
                <div className={`chk c-${c.principle}`} key={c.title}>
                  <span className="ck" aria-hidden="true">✓</span>
                  <div><b>{c.title}</b><span>{c.body}</span></div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="lrow">
          {p.links.map(l => (
            <button key={l.term} onClick={() => onJump(l.term)}>{l.label}</button>
          ))}
          <button onClick={onClose}>Back</button>
        </div>
        <div className="esc">Esc to close</div>
      </aside>
    </div>
  );
}
```

- [ ] **Step 3: Append to `app/globals.css`**

```css
/* ---------- equation ---------- */
.eq{font:500 clamp(20px,3vw,32px)/1.6 var(--mono);color:#fff;letter-spacing:-.02em;
  text-align:center;white-space:nowrap}
.eq .g{color:rgba(255,255,255,.42)}
.term{position:relative;padding:4px 6px;border-radius:6px;
  transition:background .2s var(--ease),box-shadow .2s var(--ease)}
.term::after{content:'';position:absolute;left:8%;right:8%;bottom:-2px;height:2.5px;border-radius:2px}
.term:hover,.term:focus-visible{background:rgba(255,255,255,.1);outline:none}
.term.hl{background:rgba(255,255,255,.12);box-shadow:0 0 0 1px rgba(255,255,255,.2)}
.term.t-p1{color:var(--p1-l)} .term.t-p1::after{background:var(--p1-l)}
.term.t-p2{color:var(--p2-l)} .term.t-p2::after{background:var(--p2-l)}
.term.t-p3{color:var(--p3-l)} .term.t-p3::after{background:var(--p3-l)}
.term.t-p4{color:var(--p4-l)} .term.t-p4::after{background:var(--p4-l)}

/* ---------- explainer panel ---------- */
.panelwrap{position:fixed;inset:0;z-index:200}
.panelbg{position:absolute;inset:0;background:rgba(5,15,14,.55)}
.panel{position:absolute;top:0;right:0;bottom:0;width:min(420px,92vw);
  background:#10312d;border-left:1px solid rgba(255,255,255,.15);
  padding:26px 26px 30px;overflow-y:auto;color:#fff;
  animation:panelin .35s var(--ease)}
@keyframes panelin{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
.panel .cls{position:absolute;top:16px;right:16px;width:28px;height:28px;border-radius:50%;
  border:1px solid rgba(255,255,255,.25);color:rgba(255,255,255,.7);font-size:15px;line-height:1}
.panel .cls:hover{background:rgba(255,255,255,.15);color:#fff}
.panel .ptop{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;padding-right:34px}
.panel .bdg{font:700 9.5px/1 var(--sans);letter-spacing:.09em;padding:5px 7px;border-radius:4px;color:var(--deep)}
.bdg.b-p1{background:var(--p1-l)} .bdg.b-p2{background:var(--p2-l)}
.bdg.b-p3{background:var(--p3-l)} .bdg.b-p4{background:var(--p4-l)}
.panel h3{font:600 17px/1.32 var(--sans);margin:7px 0 0;width:100%}
.panel .bd{font:400 13.6px/1.62 var(--sans);color:rgba(255,255,255,.72);margin:0 0 12px}
.panel .bd em{color:#fff;font-style:normal;font-weight:600}
.panel .glead{margin-top:15px;font:600 12.5px/1.5 var(--sans)}
.panel .checks{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.panel .chk{background:rgba(255,255,255,.06);border-radius:9px;padding:11px 12px;
  border-left:3px solid;display:flex;gap:9px;align-items:flex-start}
.panel .chk.c-p2{border-color:var(--p2-l)} .panel .chk.c-p4{border-color:var(--p4-l)}
.panel .chk .ck{flex:none;width:16px;height:16px;border-radius:50%;display:grid;place-items:center;
  font:700 9px/1 var(--sans);color:var(--deep);margin-top:2px}
.panel .chk.c-p2 .ck{background:var(--p2-l)} .panel .chk.c-p4 .ck{background:var(--p4-l)}
.panel .chk b{display:block;font:600 12px/1.25 var(--sans);margin-bottom:2px}
.panel .chk span{font:400 11.2px/1.45 var(--sans);color:rgba(255,255,255,.55)}
.panel .lrow{margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.1);
  display:flex;gap:7px;flex-wrap:wrap}
.panel .lrow button{font:600 11.5px/1 var(--sans);padding:9px 11px;border-radius:6px;
  background:rgba(255,255,255,.09);color:rgba(255,255,255,.78)}
.panel .lrow button:hover{background:rgba(255,255,255,.17);color:#fff}
.panel .esc{margin-top:11px;font:500 10.5px/1 var(--sans);color:rgba(255,255,255,.32)}
```

- [ ] **Step 4: Temporarily mount for verification** — in `app/page.tsx`, add `import EqDemo from '@/components/EqDemo';` and, below the `.prins` div (inside `.wrap`):

```tsx
{/* temporary — Task 5 moves this into Landing */}
<div style={{ padding: '24px 0 64px' }}>
  <EqDemo />
</div>
```

and create the throwaway demo wrapper as a new file `components/EqDemo.tsx`:

```tsx
'use client';
import { useState } from 'react';
import Equation from './Equation';
import ExplainerPanel from './ExplainerPanel';
import type { TermKey } from '@/lib/content';

export default function EqDemo() {
  const [open, setOpen] = useState<TermKey | null>(null);
  return (
    <>
      <Equation interactive onTermClick={setOpen} />
      <ExplainerPanel term={open} onClose={() => setOpen(null)} onJump={setOpen} />
    </>
  );
}
```

- [ ] **Step 5: Verify**

Playwright: navigate to `http://localhost:3000`. Confirm equation renders under the cards with four colored terms. Click `ω` → gold-badged panel slides in with the three-check gate list. Press Escape → closes. Click `max(` → teal Principle 1 panel. Screenshot each state.

- [ ] **Step 6: Commit**

```bash
git add components app && git commit -m "feat: interactive equation and explainer panels"
```

---

### Task 5: Landing shell — variant state, toggle, static fallback

**Files:**
- Create: `components/Landing.tsx`, `components/VariantToggle.tsx`, `components/StaticReveal.tsx`, `lib/useStaticMode.ts`
- Modify: `app/page.tsx` (final form), `app/globals.css` (append)
- Delete: `components/EqDemo.tsx`

**Interfaces:**
- Consumes: everything above; `parseVariant`, `Variant` from `@/lib/variant`.
- Produces:
  - `<Landing />` — the whole page; `app/page.tsx` renders only this.
  - `useStaticMode(): boolean` — true when reduced-motion or <960px (SSR-safe, returns false on server).
  - Reveal components contract (Tasks 6–7 implement): `{ onTermClick: (k: TermKey) => void }` props, and each renders its own `HeroIntro` + principle cards + `Equation` inside the dark stage.

- [ ] **Step 1: Write `lib/useStaticMode.ts`**

```ts
'use client';
import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce), (max-width: 959px)';

export function useStaticMode(): boolean {
  return useSyncExternalStore(
    cb => {
      const m = window.matchMedia(QUERY);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
```

- [ ] **Step 2: Write `components/VariantToggle.tsx`**

```tsx
'use client';
import type { Variant } from '@/lib/variant';

export default function VariantToggle({ variant, onChange }:
  { variant: Variant; onChange: (v: Variant) => void }) {
  return (
    <div className="vtoggle" role="group" aria-label="Design variant (team review tool)">
      <button className={variant === 'a' ? 'on' : ''} onClick={() => onChange('a')}>A · Assembly</button>
      <button className={variant === 'b' ? 'on' : ''} onClick={() => onChange('b')}>B · Rail</button>
    </div>
  );
}
```

- [ ] **Step 3: Write `components/StaticReveal.tsx`** (no-choreography fallback; also serves as the initial body for both variants until Tasks 6–7 land)

```tsx
'use client';
import HeroIntro from './HeroIntro';
import PrincipleCard from './PrincipleCard';
import Equation from './Equation';
import { PRINCIPLES, type TermKey } from '@/lib/content';

export default function StaticReveal({ onTermClick }: { onTermClick: (k: TermKey) => void }) {
  return (
    <div className="wrap">
      <HeroIntro />
      <div className="prins" style={{ margin: '32px 0 44px' }}>
        {PRINCIPLES.map(p => <PrincipleCard key={p.key} p={p} />)}
      </div>
      <div className="sr-eq">
        <div className="cap">And the equation they demand</div>
        <Equation interactive onTermClick={onTermClick} />
        <p className="sr-note">Every term exists because a principle demanded it. Tap any of them.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write `components/Landing.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import Nav from './Nav';
import Tail from './Tail';
import StaticReveal from './StaticReveal';
import VariantToggle from './VariantToggle';
import ExplainerPanel from './ExplainerPanel';
import { parseVariant, type Variant } from '@/lib/variant';
import { useStaticMode } from '@/lib/useStaticMode';
import type { TermKey } from '@/lib/content';

export default function Landing() {
  const [variant, setVariant] = useState<Variant>('a');
  const [panel, setPanel] = useState<TermKey | null>(null);
  const staticMode = useStaticMode();

  useEffect(() => {
    const sync = () => setVariant(parseVariant(window.location.hash));
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const choose = (v: Variant) => { window.location.hash = v; };

  // Task 6 replaces the 'a' branch with <RevealA/>, Task 7 the 'b' branch with <RevealB/>.
  const body = staticMode
    ? <StaticReveal onTermClick={setPanel} />
    : <StaticReveal onTermClick={setPanel} />;

  return (
    <main>
      <div className="stage">
        <div className="wrap"><Nav /></div>
        {body}
      </div>
      <Tail />
      <VariantToggle variant={variant} onChange={choose} />
      <ExplainerPanel term={panel} onClose={() => setPanel(null)} onJump={setPanel} />
    </main>
  );
}
```

- [ ] **Step 5: Final `app/page.tsx`; delete `components/EqDemo.tsx`**

```tsx
import Landing from '@/components/Landing';

export default function Home() {
  return <Landing />;
}
```

- [ ] **Step 6: Append to `app/globals.css`**

```css
/* ---------- variant toggle (team review tool — delete after decision) ---------- */
.vtoggle{position:fixed;right:18px;bottom:18px;z-index:300;display:flex;gap:4px;
  background:rgba(8,17,15,.92);border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:4px}
.vtoggle button{font:600 12px/1 var(--sans);color:rgba(255,255,255,.6);
  padding:8px 12px;border-radius:6px}
.vtoggle button.on{background:#fff;color:#08110f}

/* ---------- static reveal ---------- */
.sr-eq{text-align:center;padding:10px 0 64px}
.sr-eq .cap{font:600 10.5px/1 var(--sans);letter-spacing:.15em;text-transform:uppercase;
  color:rgba(255,255,255,.4);margin-bottom:22px}
.sr-eq .eq{white-space:normal}
.sr-note{margin:18px auto 0;max-width:44ch;font:400 13.5px/1.5 var(--sans);
  color:rgba(255,255,255,.45)}
```

- [ ] **Step 7: Verify**

Playwright: navigate `http://localhost:3000` → page renders hero → cards → equation → tail; toggle pill bottom-right. Click "B · Rail" → URL becomes `#b`, pill highlights B. Navigate directly to `http://localhost:3000/#b` → pill shows B active on load. `browser_resize` to 800×900 → single-column cards, equation wraps, page usable. Run `npx vitest run` (still green) and `npm run build` (compiles clean).

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: landing shell with variant toggle and static fallback"
```

---

### Task 6: Variant A — flying assembly

**Files:**
- Create: `components/RevealA.tsx`
- Modify: `components/Landing.tsx` (wire in), `app/globals.css` (append)

**Interfaces:**
- Consumes: `HeroIntro`, `PrincipleCard`, `Equation`, `CARD_TERM`, `PRINCIPLES`; `useScroll`/`useMotionValueEvent` from `motion/react`.
- Produces: `<RevealA onTermClick={(k: TermKey) => void} />`.

**Mechanic:** the section is 320vh tall with a 100vh sticky stage. Scroll progress `p` (0→1 across the section) drives, imperatively (direct style writes, no re-render per frame):
- `p 0→0.12` — hero intact: intro, four cards in a row, "Scroll" hint. Equation invisible.
- `p 0.12→0.54` — card *i* (stagger `0.06·i`) flies from its row position to its equation term's position over a `0.30` progress span (smoothstep-eased translate + scale-to-term-height); the term fades in as its card arrives and the card fades out (crossfade). Equation glue (`= ( + ×`) fades in over `p 0.30→0.50`. Intro fades out over `p 0.05→0.17`.
- `p ≥ 0.62` — equation settled, closing line fades in, terms become interactive.

- [ ] **Step 1: Write `components/RevealA.tsx`**

```tsx
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';
import HeroIntro from './HeroIntro';
import PrincipleCard from './PrincipleCard';
import Equation from './Equation';
import { PRINCIPLES, CARD_TERM, type PrincipleKey, type TermKey } from '@/lib/content';

type Delta = { dx: number; dy: number; s: number };
const START = 0.12, SPAN = 0.30, STAGGER = 0.06;

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const seg = (v: number, from: number, len: number) => smooth((v - from) / len);

export default function RevealA({ onTermClick }: { onTermClick: (k: TermKey) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const eqRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLParagraphElement>(null);
  const cardEls = useRef<Partial<Record<PrincipleKey, HTMLDivElement>>>({});
  const termEls = useRef<Partial<Record<TermKey, HTMLButtonElement>>>({});
  const deltas = useRef<Partial<Record<PrincipleKey, Delta>>>({});
  const [done, setDone] = useState(false);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  // keep the FIRST element registered per term (the opening paren for 'max')
  const setTermRef = (k: TermKey, el: HTMLButtonElement | null) => {
    if (el && !termEls.current[k]) termEls.current[k] = el;
  };

  const apply = useCallback((v: number) => {
    PRINCIPLES.forEach((p, i) => {
      const el = cardEls.current[p.key];
      const term = termEls.current[CARD_TERM[p.key]];
      const d = deltas.current[p.key];
      if (!el || !term || !d) return;
      const k = seg(v, START + i * STAGGER, SPAN);
      el.style.transform = `translate(${k * d.dx}px, ${k * d.dy}px) scale(${1 - (1 - d.s) * k})`;
      el.style.opacity = String(1 - seg(k, 0.85, 0.15)); // card fades as it lands
      term.style.opacity = String(seg(k, 0.8, 0.2));     // term fades in underneath
    });
    if (eqRef.current) {
      eqRef.current.querySelectorAll<HTMLElement>('.g').forEach(g => {
        g.style.opacity = String(seg(v, 0.30, 0.20));
      });
    }
    if (introRef.current) introRef.current.style.opacity = String(1 - seg(v, 0.05, 0.12));
    if (hintRef.current) hintRef.current.style.opacity = String(1 - seg(v, 0.05, 0.08));
    if (afterRef.current) afterRef.current.style.opacity = String(seg(v, 0.66, 0.12));
    setDone(v > 0.62);
  }, []);

  const measure = useCallback(() => {
    for (const p of PRINCIPLES) {
      const card = cardEls.current[p.key];
      const term = termEls.current[CARD_TERM[p.key]];
      if (!card || !term) return;
      card.style.transform = 'none';
      const c = card.getBoundingClientRect();
      const t = term.getBoundingClientRect();
      deltas.current[p.key] = {
        dx: t.left + t.width / 2 - (c.left + c.width / 2),
        dy: t.top + t.height / 2 - (c.top + c.height / 2),
        s: Math.max(0.18, t.height / c.height),
      };
    }
    apply(scrollYProgress.get());
  }, [apply, scrollYProgress]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useMotionValueEvent(scrollYProgress, 'change', apply);

  return (
    <section ref={sectionRef} className="revealA" aria-label="From principles to equation">
      <div className="ra-stage">
        <div className="wrap">
          <div ref={introRef}><HeroIntro /></div>
          <div className="prins ra-cards">
            {PRINCIPLES.map(p => (
              <div key={p.key} className="ra-card"
                ref={el => { cardEls.current[p.key] = el ?? undefined; }}>
                <PrincipleCard p={p} />
              </div>
            ))}
          </div>
          <div className="ra-eq" ref={eqRef}>
            <Equation interactive={done} onTermClick={onTermClick} termRef={setTermRef} />
            <p className="ra-after" ref={afterRef}>
              Every term exists because a principle demanded it. Click any of them.
            </p>
          </div>
          <div className="ra-hint" ref={hintRef} aria-hidden="true">Scroll ↓</div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Append to `app/globals.css`**

```css
/* ---------- variant A: flying assembly ---------- */
.revealA{height:320vh}
.ra-stage{position:sticky;top:0;height:100vh;overflow:hidden;display:flex;align-items:flex-start}
.ra-stage>.wrap{width:100%;padding-top:2vh}
.ra-cards{margin:4vh 0 0;position:relative;z-index:2}
.ra-card{will-change:transform,opacity}
.ra-eq{position:absolute;left:0;right:0;top:62vh;text-align:center;z-index:1}
.ra-eq .term{opacity:0}
.ra-eq .g{opacity:0}
.ra-after{margin:20px auto 0;max-width:44ch;font:400 13.5px/1.5 var(--sans);
  color:rgba(255,255,255,.45);opacity:0}
.ra-hint{position:absolute;left:50%;bottom:4vh;transform:translateX(-50%);
  font:500 12.5px/1 var(--sans);color:rgba(255,255,255,.4)}
```

- [ ] **Step 3: Wire into `components/Landing.tsx`** — replace the `body` assignment:

```tsx
import RevealA from './RevealA';
// ...
const body = staticMode
  ? <StaticReveal onTermClick={setPanel} />
  : variant === 'a'
    ? <RevealA onTermClick={setPanel} />
    : <StaticReveal onTermClick={setPanel} />; // Task 7 swaps in <RevealB/>
```

- [ ] **Step 4: Verify choreography**

Playwright at 1280×900: navigate `http://localhost:3000/#a`. Screenshot at top (hero + cards, no equation). Scroll to ~50% of the reveal section (`browser_evaluate` `window.scrollBy(0, window.innerHeight * 1.6)` or equivalent) → screenshot: cards mid-flight, equation appearing. Scroll past section end → screenshot: equation settled, closing line visible, cards gone. Click a term → panel opens. Confirm no horizontal scrollbar at any point.

- [ ] **Step 5: Run checks and commit**

Run: `npx vitest run` and `npm run build` — both green.

```bash
git add -A && git commit -m "feat: variant A flying-assembly reveal"
```

---

### Task 7: Variant B — left-rail dock

**Files:**
- Create: `components/RevealB.tsx`
- Modify: `components/Landing.tsx` (wire in), `app/globals.css` (append)

**Interfaces:**
- Consumes: `HeroIntro`, `PrincipleCard`, `Equation`, `PRINCIPLES`, `CARD_TERM`; `motion` from `motion/react`.
- Produces: `<RevealB onTermClick={(k: TermKey) => void} />`.

**Mechanic:** normal-flow hero (intro + card row + hint) that scrolls away. Then a two-column band: left rail of the four principles (each block ~55vh apart, animating in from the left), right column sticky with the equation. Whichever rail item is nearest the viewport center is "active": its card lifts and its equation term gets the `.hl` highlight.

- [ ] **Step 1: Write `components/RevealB.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { motion } from 'motion/react';
import HeroIntro from './HeroIntro';
import PrincipleCard from './PrincipleCard';
import Equation from './Equation';
import { PRINCIPLES, CARD_TERM, type PrincipleKey, type TermKey } from '@/lib/content';

export default function RevealB({ onTermClick }: { onTermClick: (k: TermKey) => void }) {
  const [active, setActive] = useState<PrincipleKey | null>(null);

  return (
    <section className="revealB" aria-label="From principles to equation">
      <div className="wrap">
        <HeroIntro />
        <div className="prins" style={{ margin: '32px 0 0' }}>
          {PRINCIPLES.map(p => <PrincipleCard key={p.key} p={p} />)}
        </div>
        <div className="rb-hint" aria-hidden="true">Scroll ↓</div>

        <div className="rb-cols">
          <div className="rb-rail">
            {PRINCIPLES.map((p, i) => (
              <motion.div
                key={p.key}
                className={`rb-item${active === p.key ? ' on' : ''}`}
                initial={{ opacity: 0, x: -28 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: i * 0.04 }}
                viewport={{ margin: '-42% 0px -42% 0px' }}
                onViewportEnter={() => setActive(p.key)}
              >
                <PrincipleCard p={p} />
                <p className="rb-note">{p.note}</p>
              </motion.div>
            ))}
          </div>
          <div className="rb-eqcol">
            <motion.div
              className="rb-sticky"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: '0px 0px -30% 0px' }}
            >
              <div className="cap">The equation they demand</div>
              <Equation interactive onTermClick={onTermClick}
                highlight={active ? CARD_TERM[active] : null} />
              <p className="rb-cap">Each principle lights up its term. Click any coloured term.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Append to `app/globals.css`**

```css
/* ---------- variant B: left-rail dock ---------- */
.rb-hint{text-align:center;padding:26px 0 8px;font:500 12.5px/1 var(--sans);
  color:rgba(255,255,255,.4)}
.rb-cols{display:grid;grid-template-columns:minmax(300px,420px) 1fr;gap:48px;
  padding:10vh 0 16vh;align-items:start}
.rb-rail{display:flex;flex-direction:column;gap:45vh;padding:20vh 0}
.rb-item{transition:transform .3s var(--ease),filter .3s var(--ease);filter:saturate(.55) brightness(.82)}
.rb-item.on{transform:scale(1.03);filter:none}
.rb-note{margin:10px 4px 0;font:500 12px/1.5 var(--mono);color:rgba(255,255,255,.5)}
.rb-item.on .rb-note{color:rgba(255,255,255,.8)}
.rb-eqcol{position:relative;height:100%}
.rb-sticky{position:sticky;top:26vh;text-align:center}
.rb-sticky .cap{font:600 10.5px/1 var(--sans);letter-spacing:.15em;text-transform:uppercase;
  color:rgba(255,255,255,.4);margin-bottom:20px}
.rb-sticky .eq{white-space:normal}
.rb-cap{margin:18px auto 0;max-width:36ch;font:400 13px/1.5 var(--sans);
  color:rgba(255,255,255,.45)}
```

- [ ] **Step 3: Wire into `components/Landing.tsx`** — final `body`:

```tsx
import RevealB from './RevealB';
// ...
const body = staticMode
  ? <StaticReveal onTermClick={setPanel} />
  : variant === 'a'
    ? <RevealA onTermClick={setPanel} />
    : <RevealB onTermClick={setPanel} />;
```

- [ ] **Step 4: Verify**

Playwright at 1280×900: navigate `http://localhost:3000/#b`. Top: hero + row of cards. Scroll into the columns: rail items fade in from left; equation sticky on the right; as each principle centers, it saturates/lifts and exactly one equation term shows the highlight ring (P1→`max(`, P2→`ω`, P3→`μg/μf`, P4→`θ`). Toggle to A via the pill → assembly variant swaps in without reload. Screenshot both.

- [ ] **Step 5: Run checks and commit**

Run: `npx vitest run` and `npm run build` — both green.

```bash
git add -A && git commit -m "feat: variant B left-rail reveal"
```

---

### Task 8: Production build, deploy, live verification

**Files:**
- Modify: none expected (fixes only if the production build or live check surfaces issues).

**Interfaces:**
- Consumes: the finished app.
- Produces: the live `*.vercel.app` URL — the deliverable sent to the team.

- [ ] **Step 1: Full local gate**

Run: `npx vitest run` → all pass. `npm run build` → compiles with no errors. `npm run start`, then Playwright sweep on http://localhost:3000: `#a` top/mid/end states, `#b` rail highlighting, panel open/Esc on both, toggle switching, 800px-wide static fallback (cards stacked, equation visible without any scrolling choreography, panels still open).

- [ ] **Step 2: Deploy to Vercel**

Use the `vercel:deploy` skill with argument `prod` (stable shareable URL). If the CLI isn't authenticated, ask the user to run `! vercel login` in the session, then retry. Accept defaults for project scope/name (`s-index-chal` or similar).

- [ ] **Step 3: Verify the live URL**

Playwright: navigate to the returned production URL. Confirm `#a` and `#b` both work, panels open, no console errors (`browser_console_messages`). Screenshot for the user.

- [ ] **Step 4: Commit any deploy artifacts and report**

```bash
git add -A && git commit -m "chore: production deploy" --allow-empty
```

Report the live URL to the user — this is the link they send the team.
