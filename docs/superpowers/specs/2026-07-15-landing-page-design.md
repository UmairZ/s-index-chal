# S-Index Landing Page — Design Spec

**Date:** 2026-07-15
**Deadline:** Live demo in Bethesda, July 20. Landing page live on Vercel ASAP so the team can review.
**Source material:** `s-index-landing-options.html` (mockup, three directions), `sindex-website-discovery-spec.md` (client discovery doc).

## Goal

A production landing page for the S-index (a data-sharing analogue to the h-index, AI.Health4All's NIH/NEI S-Index Challenge submission). Direction: "the equation is the page," modified so visitors meet the **four principles first**, then watch them become the equation.

Two reveal mechanics ship behind an on-page A/B toggle; the team picks one, we delete the toggle and the loser.

## Stack

- **Next.js (App Router) + TypeScript**, deployed on Vercel. Chosen for zero-config Vercel deploys and so the later researchers page becomes a route (`/researchers/[slug]`) without re-architecting.
- **Plain global CSS** using the mockup's existing design tokens (principle colors, serif/sans/mono stacks, dark stage). No Tailwind/UI kit — the design is fully custom and the CSS already exists in the mockup.
- **`motion` (framer-motion)** — only dependency beyond Next. Used for scroll-linked choreography (variant A) and shared reveal transitions.
- Static content, no database, no CMS, no auth. All copy lives in typed content modules (`content.ts`) so wording edits don't touch markup.

## Pages

- `/` — the landing page (this spec).
- `/researchers/*` — future (next phase). Landing page links to it via the two example researcher cards; cards render but link nowhere yet (no dead `<a href>` — non-link elements until the page exists).

## Landing page structure

Shared by both variants:

1. **Hero — principles first.** Dark stage (deep green `#0b2422`, radial glow), nav (wordmark + Examples / The data / About placeholders), headline, and the four principle cards in a row. **No equation visible on load.**
   - P1 Inherent value (teal), P2 How & where shared (gold), P3 Norms & ethics (indigo), P4 Collaborative credit (rose). Colors are semantic and identical everywhere.
2. **The reveal** — differs per variant (below).
3. **Explorable equation.** After the reveal, the equation's colored terms are clickable, opening the explainer side panels from the mockup (floor / S_raw gate / normalisation), including the S_raw → 0.1·θ + ω expansion. Esc or ✕ closes.
4. **Tail.** "See it work" section with the two example researcher cards (Elena Marsh, Amara Okonjo — mock data) + institutional footer (AI.Health4All · CU Anschutz · U Michigan · UIC · OHSU).

### Variant A — Flying assembly

As the visitor scrolls past the hero, the four principle cards shrink and fly to dock onto their terms in the equation, which settles center-stage. Scroll-scrubbed (progress mapped to transforms), not scroll-jacked: the page never blocks native scrolling.

### Variant B — Left-rail dock

As the visitor scrolls, the cards re-stack vertically into a left rail; the equation fades in on the right. Continued scrolling steps through the principles, highlighting each card and its equation term together (sticky right column, scroll-driven active state).

### A/B toggle

Floating pill (bottom corner): "A · Assembly / B · Rail." Selection persists in the URL hash (`#a` / `#b`) so team members share exactly what they see. Default: A. The toggle is a temporary review tool — removed once the team decides.

## Accessibility & fallbacks

- `prefers-reduced-motion`: no choreography — sections simply crossfade/appear. Equation is always reachable.
- **Mobile / <960px:** no scroll choreography; plain stacked sections (principles, then equation, then explainers as accordions instead of side panels).
- Semantic HTML, keyboard operable (terms are buttons, Esc closes panels), WCAG 2.1 AA contrast held on the dark stage.
- The equation must be plain selectable text (mono font + sub tags), not images/SVG.

## Deployment

- Vercel via CLI from this repo. Preview deploy for team review; the `*.vercel.app` URL is the link sent to the team. Same link redeploys on every change.

## Out of scope (this phase)

Researchers page content, real data / live computation, CMS, analytics, custom domain, logo/branding sign-off, accounts. Copy is lifted from the mockup verbatim; final wording is the team's to edit later.

## Success criteria

- Team can open one link, flip A/B, and pick a direction.
- Lighthouse-level sanity: fast static load, no layout jank during scroll choreography.
- Nothing in the build blocks reuse for the researchers page (tokens and content modules shared).
