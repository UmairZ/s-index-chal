# S-Index Landing — Autoplay Assembly Redesign

**Date:** 2026-07-15
**Deadline:** Live demo in Bethesda, July 20.
**Supersedes:** the reveal/variant sections of `2026-07-15-landing-page-design.md`. Stack, tail, deployment, and out-of-scope sections of that spec still hold.
**Source material:** `s-index-scroll-assembly.html` (user's mockup — geometry, wires, panels, copy) + user feedback on the shipped variants.

## Why (user feedback on the live site)

1. The first view looks far too empty.
2. Don't remove the principle cards after the reveal — keep them visible, visually linked to their equation terms.
3. Variant A's long scroll-scrub is not smooth. Wanted: **one smooth animation**, no repeated scrolling.

## Decision

Both shipped variants and the A/B toggle are **deleted**. One new experience replaces them: the mockup's flying assembly, driven by **time, not scroll**.

## First view (fills the viewport)

Dark stage as before. Top to bottom:

- Nav (unchanged).
- Kicker ("A measure of shared data") + headline ("Four principles, decided before any maths.") + subline.
- **Ambient equation:** the full equation rendered giant (spanning most of the viewport width, behind the cards) at ~6% opacity — background texture that foreshadows the payoff.
- Four principle cards, **~300px wide**, in a centred row: number, colour, title, and fuller copy (3–4 lines, hook text from `lib/content.ts`), plus a large watermark numeral.
- Bottom: "watch it assemble ▾" affordance.

## The animation

- **One continuous time-based sequence, ~2.5s**, eased. Triggered ~1.5s after load, or immediately on the first scroll/click/keypress — whichever comes first. Plays exactly once (subsequent scrolls/clicks don't restart it).
- No scroll hijacking. The page is a normal-flow document; the hero is one `100vh` section, the tail sits below it.
- Sequence (overlapping phases, single `requestAnimationFrame` timeline mapped to the mockup's `update(p)` math):
  1. Heading and hint fade; ghost equation fades out.
  2. Crisp equation fades/scales in at centre.
  3. Cards shrink (~0.7 scale) and glide to the four corner positions around the equation (mockup START/END lerp with smoothstep).
  4. Wires draw from each card to its equation term (P1→max, P2→S_raw, P3→μg/μf, P4→S_raw), dashed, in principle colours.
  5. Prompt appears: "Every principle is now part of one equation. Click any term to go deeper."
- After settle, a small **replay ↺** control appears (corner, unobtrusive) that reruns the sequence.

## After settle (interactive state)

Identical to the mockup:

- Equation terms and cards are clickable (`data-k`: max / raw / norm).
- Clicking shifts the equation left, dims non-active terms, opens the matching explainer side panel (reuse existing `ExplainerPanel` + `lib/content.ts` content, including the S_raw → 0.1·θ + ω expansion and the three-gate checklist).
- Esc / ✕ closes; panels cross-link ("See what S_raw does →").
- Wires hide while a panel is open, redraw on close.

## Fallbacks

- **`prefers-reduced-motion`:** no animation — page renders directly in the settled state (equation centred, cards at corners, wires drawn, everything clickable). No replay control.
- **Mobile (<820px):** static stacked flow like the mockup's media query — heading, stacked full-width cards, centred equation, panels in-flow. No animation, no wires.
- Semantic HTML, keyboard operable (terms are buttons), equation is selectable text. Existing a11y wins (aria-pressed etc.) carry over where applicable.

## Code changes

- **New:** `components/RevealAssembly.tsx` — owns the timeline, card geometry (ported `layout()`/`update()`/`drawWires()` from the mockup), settle state, replay.
- **Modified:** `Landing.tsx` (drops variant switching, renders RevealAssembly), `globals.css` (bigger cards, ghost equation, watermark numerals), `PrincipleCard.tsx` (fuller copy, watermark), `lib/content.ts` (card hook copy if longer text needed).
- **Deleted:** `RevealA.tsx`, `RevealB.tsx`, `VariantToggle.tsx`, `lib/variant.ts` (+ its test), and `StaticReveal.tsx` — RevealAssembly's settled render is the static/reduced-motion state, so a separate static component is redundant.
- `s-index-scroll-assembly.html` stays as design reference until shipped, then is removed.

## Success criteria

- First view fills a 1080p viewport with no dead space.
- The assembly plays as one uninterrupted animation; no user scrolling needed to complete it.
- Cards remain visible after settle, wired to their terms.
- Panels, Esc, reduced-motion, and mobile all behave as before or better.
- Deployed to the same Vercel URL.
