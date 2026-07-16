# Sectioned Assembly Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the A/B variant landing with one sectioned, snap-scroll experience: contained dark stage on a paper page, glass nav, left timeline nav, and a card→equation assembly that plays as one smooth animation per scroll gesture.

**Architecture:** Desktop is a viewport-fixed scene machine — `Landing` owns a section index (0 Principles / 1 The equation / 2 In practice) and intercepts wheel/key/touch; `AssemblyStage` renders the dark stage panel shared by sections 0–1 and tweens an internal progress `t` (0=scattered row, 1=assembled corners+wires) via `requestAnimationFrame` whenever its `assembled` prop flips. Section 1↔2 slides scenes with a plain CSS transform transition. Mobile (<960px) and `prefers-reduced-motion` get a normal-flow static document (existing `useStaticMode` hook).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, plain global CSS. No new dependencies; `motion` is removed once its last consumers (RevealA/B) are deleted.

**Spec:** `docs/superpowers/specs/2026-07-15-sectioned-assembly-design.md`

## Global Constraints

- No new npm dependencies. Remove `motion` in Task 4 (its only consumers get deleted).
- All copy comes verbatim from `lib/content.ts` — do not invent or reword copy.
- Static-mode breakpoint is the repo's existing query in `lib/useStaticMode.ts` (`(prefers-reduced-motion: reduce), (max-width: 959px)`). The spec's "<820px" is superseded by this; do not change the hook.
- NEVER run `npm run build` while a dev server is running — the shared `.next` directory corrupts. Kill dev first.
- Unit tests: `npm test` (vitest, lib only). UI verification: headless Playwright scripts in `.superpowers/sdd/` (Chromium is installed; the Playwright MCP/Chrome extension are NOT available on this machine).
- Typecheck: `npx tsc --noEmit`.
- Documented deviation from spec: the explainer panel keeps the shipped overlay-with-backdrop behavior instead of the mockup's "equation shifts left" focus state — the backdrop already dims the stage, so shifting is redundant. Term highlight (`.hl`) still marks the active term.
- Deploy (Task 5 only): `npx vercel deploy --prod --yes`.

## File Structure

- `components/PrincipleCard.tsx` — modified: watermark numeral + note line (fuller copy).
- `components/Nav.tsx` — modified: floating glass bar (`.gnav`).
- `components/TimelineNav.tsx` — new: left timeline (3 dots + labels).
- `components/AssemblyStage.tsx` — new: dark stage panel; geometry, tween, wires, ghost equation, prompt.
- `components/Landing.tsx` — rewritten: section state machine, input interception, scenes, static flow.
- `app/globals.css` — modified throughout; old variant CSS deleted.
- Deleted: `components/RevealA.tsx`, `components/RevealB.tsx`, `components/VariantToggle.tsx`, `components/StaticReveal.tsx`, `lib/variant.ts`, `lib/__tests__/variant.test.ts`.
- Unchanged: `components/Equation.tsx`, `components/ExplainerPanel.tsx`, `components/HeroIntro.tsx`, `components/Tail.tsx`, `lib/content.ts`, `lib/useStaticMode.ts`, `app/page.tsx`, `app/layout.tsx`.

---

### Task 1: Fuller principle cards (watermark numeral + note line)

**Files:**
- Modify: `components/PrincipleCard.tsx`
- Modify: `app/globals.css` (the `/* ---------- principle cards ---------- */` block)

**Interfaces:**
- Consumes: `Principle` from `lib/content.ts` (fields `key,num,title,body,maps,note` — all already exist).
- Produces: `PrincipleCard({ p: Principle })` — same signature, richer markup. Later tasks render it inside `.acard` wrappers and the static flow; card must stay non-interactive (no buttons inside).

- [ ] **Step 1: Update the card markup**

Replace the full contents of `components/PrincipleCard.tsx` with:

```tsx
import type { Principle } from '@/lib/content';

export default function PrincipleCard({ p }: { p: Principle }) {
  return (
    <article className={`prin ${p.key}`}>
      <span className="wm" aria-hidden="true">{p.num}</span>
      <div className="n" aria-hidden="true">{p.num}</div>
      <b>{p.title}</b>
      <p>{p.body}</p>
      <p className="nt">{p.note}</p>
      <div className="mp">→ {p.maps}</div>
    </article>
  );
}
```

- [ ] **Step 2: Add card CSS**

In `app/globals.css`, inside the principle-cards block, change the `.prin` rule and add `.wm`/`.nt` rules. The block becomes:

```css
/* ---------- principle cards ---------- */
.prins{display:grid;grid-template-columns:repeat(4,1fr);gap:13px}
.prin{position:relative;overflow:hidden;border-radius:11px;padding:19px 19px 21px;
  border:1px solid transparent;color:var(--ink)}
.prin .wm{position:absolute;right:4px;top:-20px;font:700 96px/1 var(--serif);
  opacity:.09;pointer-events:none;user-select:none}
.prin .n{width:23px;height:23px;border-radius:50%;display:grid;place-items:center;
  font:700 11.5px/1 var(--sans);color:#fff;margin-bottom:12px}
.prin b{display:block;font:600 14.5px/1.3 var(--sans);margin-bottom:6px}
.prin p{margin:0;font:400 13px/1.55 var(--sans);color:var(--ink-2)}
.prin .nt{margin-top:8px;font:400 12.2px/1.5 var(--sans);color:var(--ink-3)}
.prin .mp{margin-top:13px;padding-top:11px;border-top:1px dashed rgba(0,0,0,.12);
  font:500 11.5px/1.4 var(--mono)}
.prin.p1{background:var(--p1-w)} .prin.p1 .n{background:var(--p1)} .prin.p1 .mp{color:var(--p1)} .prin.p1 .wm{color:var(--p1)}
.prin.p2{background:var(--p2-w)} .prin.p2 .n{background:var(--p2)} .prin.p2 .mp{color:var(--p2)} .prin.p2 .wm{color:var(--p2)}
.prin.p3{background:var(--p3-w)} .prin.p3 .n{background:var(--p3)} .prin.p3 .mp{color:var(--p3)} .prin.p3 .wm{color:var(--p3)}
.prin.p4{background:var(--p4-w)} .prin.p4 .n{background:var(--p4)} .prin.p4 .mp{color:var(--p4)} .prin.p4 .wm{color:var(--p4)}
@media(max-width:959px){.prins{grid-template-columns:1fr}}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` — expected: no errors.
Run: `npm test` — expected: 2 test files pass (content + variant; variant is deleted later, still present now).
Start `npm run dev`, load http://localhost:3000, confirm each card shows the big faint numeral top-right and the extra note line. Kill the dev server.

- [ ] **Step 4: Commit**

```bash
git add components/PrincipleCard.tsx app/globals.css
git commit -m "feat: principle cards get watermark numeral and note line"
```

---

### Task 2: Glass nav + timeline nav

**Files:**
- Modify: `components/Nav.tsx`
- Create: `components/TimelineNav.tsx`
- Modify: `app/globals.css` (replace the `/* ---------- dark stage + nav ---------- */` block's `.snav` rules with `.gnav`; add `.tnav`)

**Interfaces:**
- Consumes: nothing new.
- Produces: `Nav()` — now a `position:fixed` glass bar, rendered once at page top level (NOT inside `.stage`/`.wrap`). `TimelineNav({ active, onSelect }: { active: number; onSelect: (i: number) => void })` — section labels are exactly `['Principles', 'The equation', 'In practice']`; the active button carries class `on` and `aria-current="true"`. Task 4's Landing renders both and the Task 5 verify script asserts `.gnav`, `.tnav button` (count 3), and `.tnav button.on .lbl` text.

- [ ] **Step 1: Rewrite Nav as a glass bar**

Replace the full contents of `components/Nav.tsx` with:

```tsx
export default function Nav() {
  return (
    <header className="gnav">
      <div className="mark"><span className="g">S</span> S-index</div>
      <nav className="links" aria-label="Site">
        <span>Examples</span><span>The data</span><span>About</span>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Create TimelineNav**

Create `components/TimelineNav.tsx`:

```tsx
'use client';

const SECTIONS = ['Principles', 'The equation', 'In practice'];

export default function TimelineNav(
  { active, onSelect }: { active: number; onSelect: (i: number) => void },
) {
  return (
    <nav className="tnav" aria-label="Page sections">
      {SECTIONS.map((label, i) => (
        <button
          key={label}
          type="button"
          className={i === active ? 'on' : ''}
          aria-current={i === active ? 'true' : undefined}
          onClick={() => onSelect(i)}
        >
          <span className="dot" aria-hidden="true" />
          <span className="lbl">{label}</span>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: CSS — replace `.snav` with `.gnav`, add `.tnav`**

In `app/globals.css`, delete the `.snav` rules (keep `.stage` for now — the old landing still uses it until Task 4) and add:

```css
/* ---------- floating glass nav ---------- */
.gnav{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:150;
  width:min(1080px,calc(100vw - 36px));display:flex;align-items:center;
  padding:11px 20px;border-radius:14px;color:var(--ink);
  background:rgba(253,253,252,.72);
  -webkit-backdrop-filter:blur(14px) saturate(1.5);backdrop-filter:blur(14px) saturate(1.5);
  border:1px solid rgba(13,26,25,.08);box-shadow:0 10px 30px rgba(13,26,25,.08)}
.gnav .mark{font:600 17px/1 var(--sans);display:flex;align-items:center;gap:9px}
.gnav .mark .g{width:25px;height:25px;border-radius:7px;display:grid;place-items:center;
  font:700 13px/1 var(--serif);background:var(--p1);color:#fff}
.gnav .links{margin-left:auto;display:flex;gap:22px;font:500 13.5px/1 var(--sans);color:var(--ink-3)}

/* ---------- left timeline nav ---------- */
.tnav{position:fixed;left:22px;top:50%;transform:translateY(-50%);z-index:120;
  display:flex;flex-direction:column;gap:26px}
.tnav::before{content:'';position:absolute;left:5px;top:12px;bottom:12px;width:1px;
  background:rgba(13,26,25,.15)}
.tnav button{position:relative;display:flex;align-items:center;gap:10px;
  font:600 11px/1 var(--sans);letter-spacing:.06em;color:var(--ink-3)}
.tnav .dot{flex:none;width:11px;height:11px;border-radius:50%;background:var(--paper);
  border:2px solid var(--ink-3);transition:background .3s var(--ease),border-color .3s var(--ease)}
.tnav .lbl{opacity:0;transform:translateX(-4px);white-space:nowrap;
  background:rgba(253,253,252,.9);padding:5px 8px;border-radius:6px;
  box-shadow:0 2px 8px rgba(13,26,25,.1);
  transition:opacity .25s var(--ease),transform .25s var(--ease)}
.tnav button:hover .lbl,.tnav button:focus-visible .lbl,.tnav button.on .lbl{opacity:1;transform:none}
.tnav button.on{color:var(--ink)}
.tnav button.on .dot{background:var(--p1);border-color:var(--p1)}
@media(max-width:959px){.tnav{display:none}}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` — expected: no errors (TimelineNav is not rendered anywhere yet; that's fine).
Start `npm run dev`, load the page: the nav now floats as a light glass bar over the old dark hero (transitional look — the old landing is replaced in Task 4). Kill dev.

- [ ] **Step 5: Commit**

```bash
git add components/Nav.tsx components/TimelineNav.tsx app/globals.css
git commit -m "feat: floating glass nav and left timeline nav"
```

---

### Task 3: AssemblyStage — the contained dark stage with tweened assembly

**Files:**
- Create: `components/AssemblyStage.tsx`
- Modify: `app/globals.css` (add the stage block)

**Interfaces:**
- Consumes: `PRINCIPLES`, `CARD_TERM`, `TermKey` from `lib/content.ts`; `HeroIntro`, `PrincipleCard`, `Equation` components. `Equation` props: `{ interactive?: boolean; onTermClick?: (k: TermKey) => void; highlight?: TermKey | null }`; its term buttons carry `data-term="<key>"` (note: `max` appears on TWO buttons — opening and closing paren; wire code must use the FIRST match).
- Produces: `AssemblyStage({ assembled, panelOpen, activeTerm, onTermClick }: { assembled: boolean; panelOpen: boolean; activeTerm: TermKey | null; onTermClick: (k: TermKey) => void })`. Root element classes: `astage`, plus `foc` while `panelOpen`, plus `settled` while `assembled`. Children the verify script asserts: `.acard` (4), `.as-eq`, `.wires path` (4 when assembled), `.ghost`, `.as-hint`.

- [ ] **Step 1: Create the component**

Create `components/AssemblyStage.tsx`:

```tsx
'use client';
import { useCallback, useEffect, useRef } from 'react';
import HeroIntro from './HeroIntro';
import PrincipleCard from './PrincipleCard';
import Equation from './Equation';
import { PRINCIPLES, CARD_TERM, type TermKey } from '@/lib/content';

interface Props {
  assembled: boolean;
  panelOpen: boolean;
  activeTerm: TermKey | null;
  onTermClick: (k: TermKey) => void;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const DUR = 1000;   // ms for a full 0↔1 assembly
const CARD_W = 290; // natural card width, matches .acard CSS

const WIRE_COLOR: Record<string, string> = {
  p1: 'var(--p1-l)', p2: 'var(--p2-l)', p3: 'var(--p3-l)', p4: 'var(--p4-l)',
};

interface Geo {
  start: { x: number; y: number }[];
  end: { x: number; y: number }[];
  startS: number;
  endS: number;
}

export default function AssemblyStage({ assembled, panelOpen, activeTerm, onTermClick }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const t = useRef(0); // assembly progress 0..1
  const raf = useRef(0);
  const geo = useRef<Geo>({ start: [], end: [], startS: 1, endS: 0.6 });

  const layout = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const gap = 16;
    // scattered row: scale cards down until four fit with margins
    const startS = clamp((W - 96 - 3 * gap) / (4 * CARD_W), 0.55, 1);
    const sw = CARD_W * startS;
    const rowW = 4 * sw + 3 * gap;
    const x0 = (W - rowW) / 2, y0 = H * 0.42;
    // settled corners around the centred equation
    const endS = 0.6;
    const ew = CARD_W * endS;
    const cx = W / 2, cy = H / 2;
    const leftX = cx - 265 - ew, rightX = cx + 265;
    const upY = cy - 205, downY = cy + 35;
    geo.current = {
      startS, endS,
      start: [0, 1, 2, 3].map(i => ({ x: x0 + i * (sw + gap), y: y0 })),
      end: [
        { x: leftX, y: upY }, { x: leftX, y: downY },
        { x: rightX, y: upY }, { x: rightX, y: downY },
      ],
    };
  }, []);

  const drawWires = useCallback(() => {
    const el = stageRef.current, svg = svgRef.current;
    if (!el || !svg) return;
    const d = el.getBoundingClientRect();
    let out = '';
    PRINCIPLES.forEach((p, i) => {
      const card = el.querySelector(`.acard[data-i="${i}"]`);
      // first match — 'max' has two buttons, wire to the opening paren
      const term = el.querySelector(`.term[data-term="${CARD_TERM[p.key]}"]`);
      if (!card || !term) return;
      const c = card.getBoundingClientRect(), r = term.getBoundingClientRect();
      const cx = c.left + c.width / 2 - d.left, cy = c.top + c.height / 2 - d.top;
      const tx = r.left + r.width / 2 - d.left, ty = r.top + r.height / 2 - d.top;
      const mx = (cx + tx) / 2;
      const col = WIRE_COLOR[p.key];
      out += `<path d="M ${cx} ${cy} C ${mx} ${cy}, ${mx} ${ty}, ${tx} ${ty}" fill="none" `
        + `stroke="${col}" stroke-width="1.4" opacity=".45" stroke-dasharray="5 5"/>`
        + `<circle cx="${tx}" cy="${ty}" r="3" fill="${col}" opacity=".85"/>`;
    });
    svg.setAttribute('viewBox', `0 0 ${d.width} ${d.height}`);
    svg.innerHTML = out;
  }, []);

  const apply = useCallback((p: number) => {
    const el = stageRef.current;
    if (!el || !geo.current.start.length) return;
    const { start, end, startS, endS } = geo.current;
    el.querySelectorAll<HTMLElement>('.acard').forEach((c, i) => {
      const x = lerp(start[i].x, end[i].x, p);
      const y = lerp(start[i].y, end[i].y, p);
      const s = lerp(startS, endS, p);
      c.style.transform = `translate(${x}px,${y}px) scale(${s})`;
    });
    const set = (sel: string, v: number) => {
      const n = el.querySelector<HTMLElement>(sel);
      if (n) n.style.opacity = String(v);
    };
    set('.as-head', 1 - smooth(0, 0.45, p));
    set('.ghost', 0.07 * (1 - smooth(0.05, 0.5, p)));
    set('.as-hint', 1 - smooth(0, 0.2, p));
    set('.as-prompt', smooth(0.92, 1, p));
    const eqA = smooth(0.35, 0.8, p);
    const eq = el.querySelector<HTMLElement>('.as-eq');
    if (eq) {
      eq.style.opacity = String(eqA);
      eq.style.transform =
        `translate(-50%,-50%) translateY(${lerp(28, 0, eqA)}px) scale(${lerp(0.96, 1, eqA)})`;
    }
    const wireA = smooth(0.86, 1, p);
    if (svgRef.current) svgRef.current.style.opacity = String(wireA);
    if (wireA > 0) drawWires();
    else if (svgRef.current) svgRef.current.innerHTML = '';
  }, [drawWires]);

  // layout on mount and resize (declared before the tween effect so mount order is layout → apply)
  useEffect(() => {
    layout();
    apply(t.current);
    const onResize = () => { layout(); apply(t.current); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [layout, apply]);

  // tween t toward the target whenever `assembled` flips; reversal starts from current t
  useEffect(() => {
    const target = assembled ? 1 : 0;
    const from = t.current;
    if (from === target) { apply(target); return; }
    const t0 = performance.now();
    const dur = Math.max(1, DUR * Math.abs(target - from));
    const frame = (now: number) => {
      const k = clamp((now - t0) / dur, 0, 1);
      t.current = lerp(from, target, easeInOut(k));
      apply(t.current);
      if (k < 1) raf.current = requestAnimationFrame(frame);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf.current);
  }, [assembled, apply]);

  return (
    <div
      ref={stageRef}
      className={`astage${panelOpen ? ' foc' : ''}${assembled ? ' settled' : ''}`}
    >
      <div className="as-head"><HeroIntro /></div>
      <div className="ghost" aria-hidden="true">
        S<sub>norm</sub> = max( 1, (0.1·θ + ω) × μ<sub>g</sub>/μ<sub>f</sub> )
      </div>
      <svg className="wires" ref={svgRef} aria-hidden="true" />
      {PRINCIPLES.map((p, i) => (
        <div
          key={p.key}
          className="acard"
          data-i={i}
          onClick={() => assembled && onTermClick(CARD_TERM[p.key])}
        >
          <PrincipleCard p={p} />
        </div>
      ))}
      <div className="as-eq">
        <Equation interactive={assembled} onTermClick={onTermClick} highlight={activeTerm} />
        <div className="as-prompt">
          Every principle is now part of one equation. <b>Click any term to go deeper.</b>
        </div>
      </div>
      <div className="as-hint" aria-hidden="true">Scroll<span className="chev" /></div>
    </div>
  );
}
```

- [ ] **Step 2: Add stage CSS**

Append to `app/globals.css`:

```css
/* ---------- assembly stage (contained dark panel) ---------- */
.astage{position:relative;width:min(1240px,calc(100vw - 96px));height:calc(100vh - 118px);
  margin-top:48px;border-radius:20px;overflow:hidden;color:#fff;
  background:var(--deep);
  background-image:radial-gradient(ellipse 68% 52% at 50% 42%, #16403c 0%, var(--deep) 74%);
  box-shadow:0 24px 70px rgba(13,26,25,.18)}
.as-head{position:absolute;left:0;right:0;top:7%;z-index:30;padding:0 24px}
.as-head .intro{padding:0}
.ghost{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:1;
  font:500 clamp(40px,6.4vw,86px)/1 var(--mono);letter-spacing:-.04em;white-space:nowrap;
  color:#fff;opacity:.07;pointer-events:none;user-select:none}
.wires{position:absolute;inset:0;width:100%;height:100%;z-index:15;pointer-events:none;opacity:0}
.astage.foc .wires{opacity:0!important}
.acard{position:absolute;left:0;top:0;width:290px;z-index:25;transform-origin:0 0;
  will-change:transform;cursor:default}
.astage.settled .acard{cursor:pointer}
.as-eq{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:20;
  opacity:0;text-align:center}
.as-prompt{margin-top:26px;font:500 13px/1 var(--sans);color:rgba(255,255,255,.55);opacity:0}
.as-prompt b{color:#fff;font-weight:600}
.as-hint{position:absolute;left:0;right:0;bottom:5%;text-align:center;z-index:30;
  font:500 12.5px/1 var(--sans);color:rgba(255,255,255,.4)}
.chev{display:block;margin:10px auto 0;width:11px;height:11px;
  border-right:2px solid rgba(255,255,255,.4);border-bottom:2px solid rgba(255,255,255,.4);
  transform:rotate(45deg);animation:bob 1.6s var(--ease) infinite}
@keyframes bob{0%,100%{transform:rotate(45deg) translateY(0)}50%{transform:rotate(45deg) translateY(4px)}}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` — expected: no errors. (The component is not rendered until Task 4; full visual verification happens there.)

- [ ] **Step 4: Commit**

```bash
git add components/AssemblyStage.tsx app/globals.css
git commit -m "feat: AssemblyStage — contained dark stage with tweened card assembly and wires"
```

---

### Task 4: Landing rewrite — section machine, scenes, static flow, deletions

**Files:**
- Modify: `components/Landing.tsx` (full rewrite)
- Modify: `app/globals.css` (add scenes + static-flow CSS; delete `.stage`, variant A/B, vtoggle CSS)
- Delete: `components/RevealA.tsx`, `components/RevealB.tsx`, `components/VariantToggle.tsx`, `components/StaticReveal.tsx`, `lib/variant.ts`, `lib/__tests__/variant.test.ts`
- Modify: `package.json` (remove `motion`)

**Interfaces:**
- Consumes: `AssemblyStage` (Task 3 signature), `TimelineNav({ active, onSelect })` (Task 2), `Nav`, `Tail`, `HeroIntro`, `PrincipleCard`, `Equation`, `ExplainerPanel({ term, onClose, onJump })`, `useStaticMode()`, `PRINCIPLES`/`TermKey` from content.
- Produces: the page. DOM contract for the Task 5 verify script: `.scenes.sec-{0|1|2}` container (interactive mode only), `.scene-stage`, `.scene-tail`, `.astatic` (static mode only).

- [ ] **Step 1: Rewrite Landing**

Replace the full contents of `components/Landing.tsx` with:

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import Nav from './Nav';
import Tail from './Tail';
import TimelineNav from './TimelineNav';
import AssemblyStage from './AssemblyStage';
import HeroIntro from './HeroIntro';
import PrincipleCard from './PrincipleCard';
import Equation from './Equation';
import ExplainerPanel from './ExplainerPanel';
import { PRINCIPLES, type TermKey } from '@/lib/content';
import { useStaticMode } from '@/lib/useStaticMode';

const STEP_MS = 1050; // matches the 1s scene/assembly transitions

export default function Landing() {
  const [section, setSection] = useState(0);
  const [panel, setPanel] = useState<TermKey | null>(null);
  const staticMode = useStaticMode();

  // refs so the input listeners never hold stale state
  const busyUntil = useRef(0);
  const sectionRef = useRef(section);
  sectionRef.current = section;
  const panelRef = useRef(panel);
  panelRef.current = panel;

  const go = (i: number) => {
    const n = Math.max(0, Math.min(2, i));
    if (n === sectionRef.current) return;
    busyUntil.current = Date.now() + STEP_MS;
    setPanel(null);
    setSection(n);
  };

  useEffect(() => {
    if (staticMode) return;
    document.body.style.overflow = 'hidden';
    let acc = 0;
    let accTimer = 0;
    const step = (dir: 1 | -1) => {
      if (panelRef.current !== null || Date.now() < busyUntil.current) return;
      go(sectionRef.current + dir);
    };
    const onWheel = (e: WheelEvent) => {
      if (panelRef.current !== null) return; // wheel scrolls the panel, not sections
      acc += e.deltaY;
      window.clearTimeout(accTimer);
      accTimer = window.setTimeout(() => { acc = 0; }, 180);
      if (Math.abs(acc) > 60) {
        const dir: 1 | -1 = acc > 0 ? 1 : -1;
        acc = 0;
        step(dir);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (panelRef.current !== null) return; // Esc/close handled by the panel
      const tgt = e.target as HTMLElement | null;
      if (e.key === ' ' && tgt !== document.body) return; // let buttons take Space
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault(); step(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault(); step(-1);
      }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50) step(dy > 0 ? 1 : -1);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      document.body.style.overflow = '';
      window.clearTimeout(accTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticMode]);

  if (staticMode) {
    // normal-flow document: mobile + prefers-reduced-motion
    return (
      <main>
        <Nav />
        <div className="wrap static-flow">
          <section className="astatic">
            <HeroIntro />
            <div className="prins">
              {PRINCIPLES.map(p => <PrincipleCard p={p} key={p.key} />)}
            </div>
            <div className="sr-eq">
              <div className="cap">Every principle, one equation</div>
              <Equation onTermClick={setPanel} highlight={panel} />
              <p className="sr-note">Tap any coloured term to see which principle demanded it.</p>
            </div>
          </section>
        </div>
        <Tail />
        <ExplainerPanel term={panel} onClose={() => setPanel(null)} onJump={setPanel} />
      </main>
    );
  }

  return (
    <main>
      <Nav />
      <TimelineNav active={section} onSelect={go} />
      <div className={`scenes sec-${section}`}>
        <div className="scene scene-stage" inert={section === 2 || undefined}>
          <AssemblyStage
            assembled={section >= 1}
            panelOpen={panel !== null}
            activeTerm={panel}
            onTermClick={k => { if (sectionRef.current === 1) setPanel(k); }}
          />
        </div>
        <div className="scene scene-tail" inert={section !== 2 || undefined}>
          <div className="wrap"><Tail /></div>
        </div>
      </div>
      <ExplainerPanel term={panel} onClose={() => setPanel(null)} onJump={setPanel} />
    </main>
  );
}
```

Note: `inert` is a first-class boolean prop in React 19 — no `@ts-ignore` needed. If `tsc` complains, the `@types/react` version is stale; report rather than suppress.

- [ ] **Step 2: Scenes + static-flow CSS; delete dead CSS**

In `app/globals.css`:

**Add:**

```css
/* ---------- snap scenes (desktop interactive mode) ---------- */
.scenes{position:fixed;inset:0;overflow:hidden}
.scene{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  transition:transform 1s var(--ease)}
.scene-tail{transform:translateY(104%);flex-direction:column}
.scenes.sec-2 .scene-stage{transform:translateY(-104%)}
.scenes.sec-2 .scene-tail{transform:none}
.scene-tail .wrap{width:100%}
.scene-tail .ftr{padding:26px 0 8px}

/* ---------- static flow (mobile + reduced motion) ---------- */
.static-flow{padding-top:84px}
.astatic{background:var(--deep);color:#fff;border-radius:20px;padding:34px 22px 40px;
  background-image:radial-gradient(ellipse 68% 52% at 50% 42%, #16403c 0%, var(--deep) 74%)}
.astatic .prins{margin-top:18px}
```

**Delete these whole blocks** (all now dead):
- `.stage` rule (the old full-bleed dark stage — the `/* dark stage + nav */` block header can go too).
- `/* ---------- variant toggle ... ---------- */` block (`.vtoggle` rules).
- `/* ---------- variant A: flying assembly ---------- */` block (`.revealA`, `.ra-*` rules).
- `/* ---------- variant B: left-rail dock ---------- */` block (`.rb-*` rules).

**Keep:** `.sr-eq`, `.sr-eq .cap`, `.sr-note` (used by the static flow), `.intro`, `.tail`, `.rcs`, `.rc`, `.ftr`, `.eq`/`.term`, `.panel*` blocks.

- [ ] **Step 3: Delete dead components and the variant lib**

```bash
git rm components/RevealA.tsx components/RevealB.tsx components/VariantToggle.tsx components/StaticReveal.tsx lib/variant.ts lib/__tests__/variant.test.ts
```

- [ ] **Step 4: Remove the now-unused motion dependency**

Run: `npm uninstall motion`
Then confirm nothing still imports it: `grep -r "motion/react" components lib app` — expected: no matches (only `lib/useStaticMode.ts` mentions the word "motion" inside a media-query string, which is fine).

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` — expected: no errors.
Run: `npm test` — expected: 1 test file (content), all pass.
Start `npm run dev`, load http://localhost:3000 and manually confirm: paper background around a rounded dark stage; glass nav; timeline dots at left; one wheel gesture assembles the equation; another shows researchers; wheel up reverses. Kill dev.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: sectioned snap-scroll landing — scenes, static flow, variant system removed"
```

---

### Task 5: End-to-end verification, build gate, deploy

**Files:**
- Create: `.superpowers/sdd/verify-redesign.mjs`
- Delete: `s-index-scroll-assembly.html` (design reference, ships with this task)
- Modify: `.superpowers/sdd/progress.md` (append outcome)

**Interfaces:**
- Consumes: the DOM contract from Tasks 2–4 (`.gnav`, `.tnav button`, `.scenes`, `.astage`, `.acard`, `.as-eq`, `.wires path`, `.term[data-term]`, `.panel`, `.rc`, `.astatic`).
- Produces: screenshots + pass/fail in `.superpowers/sdd/`; the live deployment.

- [ ] **Step 1: Write the verification script**

Create `.superpowers/sdd/verify-redesign.mjs`:

```js
import { chromium } from 'playwright';

const url = process.env.URL ?? 'http://localhost:3000';
const b = await chromium.launch();
let failed = 0;
const fail = m => { console.error('FAIL: ' + m); failed++; };
const ok = m => console.log('ok: ' + m);

const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url);
await page.waitForTimeout(700);
await page.screenshot({ path: '.superpowers/sdd/redesign-s0.png' });

if (!(await page.locator('.gnav').isVisible())) fail('glass nav missing'); else ok('glass nav');
if ((await page.locator('.tnav button').count()) !== 3) fail('timeline nav needs 3 entries'); else ok('timeline nav');

const eqOp0 = Number(await page.locator('.as-eq').evaluate(n => getComputedStyle(n).opacity));
if (eqOp0 > 0.05) fail('equation visible before assembly'); else ok('section 0: equation hidden');

// one wheel gesture -> section 1 (assembly)
await page.mouse.wheel(0, 250);
await page.waitForTimeout(1500);
await page.screenshot({ path: '.superpowers/sdd/redesign-s1.png' });
const eqOp1 = Number(await page.locator('.as-eq').evaluate(n => getComputedStyle(n).opacity));
if (eqOp1 < 0.95) fail('equation not visible after assembly'); else ok('section 1: equation visible');
if ((await page.locator('.wires path').count()) !== 4) fail('expected 4 wires'); else ok('4 wires drawn');
const cardOp = Number(await page.locator('.acard').first().evaluate(n => getComputedStyle(n).opacity));
if (cardOp < 0.9) fail('cards vanished after assembly'); else ok('cards persist');
const act1 = (await page.locator('.tnav button.on .lbl').textContent())?.trim();
if (act1 !== 'The equation') fail(`timeline active = ${act1}`); else ok('timeline tracks section 1');

// panel opens from a term; Esc closes; wires hidden while open
await page.locator('.term[data-term="norm"]').click();
await page.waitForTimeout(500);
if (!(await page.locator('.panel').isVisible())) fail('panel did not open'); else ok('panel opens');
const wiresOp = Number(await page.locator('.wires').evaluate(n => getComputedStyle(n).opacity));
if (wiresOp > 0.05) fail('wires visible while panel open'); else ok('wires hide behind panel');
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
if (await page.locator('.panel').count()) fail('panel did not close on Esc'); else ok('Esc closes panel');

// wheel -> section 2 (researchers)
await page.mouse.wheel(0, 250);
await page.waitForTimeout(1500);
await page.screenshot({ path: '.superpowers/sdd/redesign-s2.png' });
if (!(await page.locator('.rc').first().isVisible())) fail('researcher cards not visible'); else ok('section 2: researchers');

// reverse: wheel up -> section 1, timeline jump -> section 0 disassembles
await page.mouse.wheel(0, -250);
await page.waitForTimeout(1500);
const act2 = (await page.locator('.tnav button.on .lbl').textContent())?.trim();
if (act2 !== 'The equation') fail(`reverse nav failed, active=${act2}`); else ok('reverse to section 1');
await page.locator('.tnav button').first().click();
await page.waitForTimeout(1500);
const eqOpBack = Number(await page.locator('.as-eq').evaluate(n => getComputedStyle(n).opacity));
if (eqOpBack > 0.05) fail('disassembly did not run'); else ok('timeline jump + disassembly');

// mobile: static flow, no scenes
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(url);
await m.waitForTimeout(600);
if (!(await m.locator('.astatic').isVisible())) fail('mobile static flow missing'); else ok('mobile static flow');
if (await m.locator('.scenes').count()) fail('scenes rendered on mobile'); else ok('no scenes on mobile');
await m.screenshot({ path: '.superpowers/sdd/redesign-mobile.png', fullPage: true });

// reduced motion: static flow on desktop
const ctx = await b.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
const r = await ctx.newPage();
await r.goto(url);
await r.waitForTimeout(600);
if (!(await r.locator('.astatic').isVisible())) fail('reduced-motion static flow missing'); else ok('reduced-motion static flow');

await b.close();
console.log(failed ? `${failed} FAILURE(S)` : 'ALL CHECKS PASSED');
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run it against dev**

Start the dev server (`npm run dev`, background), then:
Run: `node .superpowers/sdd/verify-redesign.mjs`
Expected: `ALL CHECKS PASSED`. If geometry looks off in the screenshots (cards overlapping the equation, clipped corners), tune the constants in `AssemblyStage.layout()` (`265`, `205`, `35`, `endS 0.6`, `y0 H*0.42`) and re-run until composed. **Inspect all four screenshots by eye** — the script can't judge aesthetics.

- [ ] **Step 3: Kill dev, production build gate**

Kill the dev server FIRST (never build while dev runs).
Run: `npm run build` — expected: clean production build, no errors.

- [ ] **Step 4: Remove the design-reference mockup**

```bash
git rm s-index-scroll-assembly.html
```

- [ ] **Step 5: Append outcome to progress notes**

Append to `.superpowers/sdd/progress.md` a line summarizing: redesign shipped (sectioned snap-scroll assembly), verification script name, any deferred items discovered.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: verify sectioned landing end-to-end; drop design mockup"
```

- [ ] **Step 7: Deploy and live-check**

Run: `npx vercel deploy --prod --yes`
Then: `URL=https://s-index-chal.vercel.app node .superpowers/sdd/verify-redesign.mjs`
Expected: `ALL CHECKS PASSED` against production.

---

## Self-Review Notes

- Spec coverage: contained stage (T3 CSS), glass nav + timeline (T2), snap model with gesture gating and reversal (T4), assembly-as-transition with wires (T3), panels + suppression while open (T4 `panelRef` guards), ghost equation + big cards (T1/T3), static fallbacks (T4), deletions incl. `motion` (T4), footer non-floating (unchanged `Tail`), deploy (T5).
- Documented deviations: overlay panel instead of shift-left focus state (Global Constraints); 959px static breakpoint instead of spec's 820px (Global Constraints).
- Type consistency: `AssemblyStage` props consumed in T4 match T3's export; `TimelineNav` props match; `Equation`/`ExplainerPanel` signatures unchanged from existing code.
