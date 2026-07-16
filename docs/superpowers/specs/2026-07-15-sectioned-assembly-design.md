# S-Index Landing — Sectioned Assembly Redesign

**Date:** 2026-07-15
**Deadline:** Live demo in Bethesda, July 20.
**Supersedes:** the reveal/variant sections of `2026-07-15-landing-page-design.md`, and the earlier autoplay draft of this spec. Stack and deployment sections of the original spec still hold.
**Source material:** `s-index-scroll-assembly.html` (assembly geometry, wires, panels, copy), `s-index-landing-options.html` (the contained-stage look the client responded to), user feedback on the shipped variants.

## Why (user feedback on the live site)

1. The full-bleed dark hero reads as "one giant green box" — bland, no composition. The earlier options mockup looked better precisely because the dark stage was a contained element with visible page around it.
2. Keep the principle cards after the reveal, visually wired to their equation terms.
3. Long scroll-scrubbing felt unsmooth. Wanted: discrete sections whose transitions each play as **one smooth animation** — scroll-triggered snap, not scroll-scrubbed, not timed autoplay.
4. Target aesthetic: **academic professionalism + glassmorphism.**

## Page architecture

Light paper page background (`--paper`). Content lives in **three snap sections**, each a composed scene with the page visible around it:

1. **Principles** — dark-green rounded stage panel (radius ~20px, margins showing paper around it), containing: kicker + headline + subline, the four principle cards at ~300px with fuller copy and watermark numerals, and the giant ~6%-opacity ghost equation behind them. "Scroll ▾" hint.
2. **The equation** — same dark stage panel (it persists; only its contents change): crisp equation centred, cards shrunk at the four corners, dashed wires card→term, prompt "Click any term to go deeper."
3. **In practice** — light section: "Two researchers, and every number traced" + the two researcher cards, followed by a slim institutional footer strip (AI.Health4All · CU Anschutz · U Michigan · UIC · OHSU). Footer is normal-flow, not floating.

### Floating chrome

- **Nav:** fixed, floating glass bar — translucent light background, `backdrop-filter: blur`, hairline border, subtle shadow, dark ink text. Legible over both paper and the dark stage.
- **Left timeline nav:** fixed, vertically centred; three entries (Principles / The equation / In practice) as dots + labels on a thin connecting line. Active section highlighted; clicking jumps to that section (playing the transition). Hidden on mobile.
- No floating footer (would eat viewport and distract; rejected deliberately).

## Scroll model — triggered snap

- One wheel gesture / trackpad swipe / PageDown / ArrowDown advances exactly one section; the transition plays as **one fixed-duration (~1s) eased animation** regardless of scroll velocity. Scrolling up plays the reverse animation. You can never land between sections.
- Gestures during a transition are ignored (no queue pile-up).
- Implementation: viewport-fixed scene container + section index state machine; wheel/touch/key events intercepted. Transition 1↔2 reuses the mockup's geometry math (`layout()`, START/END lerp, smoothstep, wire drawing) driven by a `requestAnimationFrame` timeline. Transition 2↔3 crossfades/slides the dark stage out and the light researcher scene in.
- While an explainer panel is open, section navigation is suppressed (wheel scrolls the panel; Esc closes first).

## Section 2 interactive state

As in the mockup: equation terms and corner cards clickable (`data-k`: max / raw / norm); clicking shifts the equation left, dims inactive terms, opens the matching explainer side panel (existing `ExplainerPanel` + `lib/content.ts`, including S_raw → 0.1·θ + ω and the three-gate checklist). Esc / ✕ closes; panels cross-link. Wires hide while a panel is open.

## Fallbacks

- **`prefers-reduced-motion`:** no hijacking, no animations — a normal scrolling document: principles stage, then settled-equation stage, then researchers. Everything reachable and clickable.
- **Mobile (<820px):** same normal-flow document, stacked full-width cards, centred equation, in-flow panels, no wires, no timeline nav. Native scrolling untouched.
- Semantic HTML, keyboard operable (arrows/PageDown navigate sections, terms are buttons, Esc closes), equation is selectable text, AA contrast on both stages.

## Code changes

- **New:** `components/SectionStage.tsx` (or similar) — owns the section state machine, input interception, transition timelines, timeline nav; ports `layout()`/`update()`/`drawWires()` from the mockup.
- **Modified:** `Landing.tsx` (renders the sectioned experience), `globals.css` (paper page, contained stage, glass nav, timeline nav, bigger cards, ghost equation), `Nav.tsx` (glass styling), `PrincipleCard.tsx` (fuller copy, watermark), `Tail.tsx` (becomes section 3 scene), `lib/content.ts` (longer card hooks if needed).
- **Deleted:** `RevealA.tsx`, `RevealB.tsx`, `VariantToggle.tsx`, `lib/variant.ts` (+ test), `StaticReveal.tsx` (the reduced-motion document flow replaces it).
- `s-index-scroll-assembly.html` stays as design reference until shipped, then is removed.

## Success criteria

- No full-bleed green: every scene shows paper around a contained, composed stage.
- Each scroll gesture yields exactly one smooth section transition, forwards and backwards.
- Cards remain visible in section 2, wired to their terms; panels work as before.
- Glass nav floats over everything and stays legible; timeline nav tracks and jumps sections.
- Reduced-motion and mobile get a plain scrolling document.
- Deployed to the same Vercel URL.
