# Researcher scorecard pages — design spec

**Date:** 2026-07-16
**Status:** Approved direction (brainstormed with Umair); numbers partially provisional pending the team's calculation document.
**Deadline context:** live demo in Bethesda, July 20.

## What we're building

Per-researcher pages at `/researchers/[slug]` that show a real researcher's S-index and let a
viewer *drive the equation*: browse the researcher's datasets, watch the equation fill with each
dataset's actual numbers, edit θ/ω to ask "what if?", and watch the researcher's S-index update
live. This is the site's proof that the metric is computable on real data — the landing page
argues the principles; this page shows the machine running.

## Source of truth for the method and data

`04 INDIVIDUAL_S_INDEX_EVALUATION_SUMMARY.docx` (Robin, shared 2026-07-16):

- Per dataset: `S_raw = 0.1·θ + ω` (θ = COUNTER downloads excluding contributors, ω = Crossref
  citations), then `S_norm = max(1, S_raw × μg/μf)` where the normalisation factor comes from the
  dataset's co-citation network (needs ≥ 20 co-cited datasets), falling back to the designated
  category mean, then the global mean.
- Qualifying gate: usefulness/FAIR and recognition/named-creators are machine-verified; the
  Ethics criterion is **not** API-assessable and must be surfaced as a human-review caveat.
- Aggregation: **an individual's S-index = S if they have S qualifying datasets each with
  S_norm ≥ S** (h-index analogue).
- Real results: David Bissig (ORCID 0000-0001-9664-5433) — 5 qualifying Dryad datasets,
  S_norm 40.6 / 40.1 / 4.5 / 1.0 / 1.0 → **S-index 3**. Jeffrey Kaye (0000-0002-9971-3478) —
  1 qualifying dataset (SATURN, S_norm 40.1) → **S-index 1**. SATURN θ observed at 372/376/391
  across runs (live COUNTER drift).
- Narratives: Bissig = the metric behaves as designed (two ~40s cannot buy an S-index of 4;
  sustained sharing moves it). Kaye = ORCID completeness is the binding constraint — a senior
  researcher scores 1 because his other deposits lack his ORCID, and surfacing that gap is the
  metric's designed diagnostic value, not a flaw.

### Provisional data handling

The per-dataset detail document (titles, DOIs, exact θ/ω/μ per dataset) has not arrived yet.
Until it does:

- Every dataset row carries `provisional?: boolean`. Provisional rows use invented but plausible
  θ/ω/μ values **constructed to reproduce the published S_norm values exactly** (40.6, 40.1, 4.5,
  1.0, 1.0, 40.1). The two 1.0 rows must be genuine floor cases (`S_raw × μg/μf < 1`).
- When the calculation doc arrives, swapping in real values is a data-file-only change.
- Identity is likewise data-only: `orcid: string | null`, and name/slug live in the same record,
  so the team's pending anonymise-or-not decision (real names vs pseudonyms) never touches
  components. Build with real names; render ORCID as a link to `https://orcid.org/<id>` only
  when non-null.

## Data model — `lib/researchers.ts`

```ts
export type NormPath = 'cocitation' | 'category' | 'global';

export interface Dataset {
  id: string;            // stable key
  title: string;
  repository: string;    // 'Dryad'
  doi: string | null;    // rendered as link when present
  year: number | null;
  theta: number;         // honest downloads (editable in UI)
  omega: number;         // citations (editable in UI)
  normFactor: number;    // μg/μf actually applied
  normPath: NormPath;    // which fallback fired
  qualifies: boolean;
  failedGate: string | null; // e.g. 'no named creators' when qualifies === false
  provisional?: boolean;
}

export interface Researcher {
  slug: string;          // 'david-bissig' | 'jeffrey-kaye'
  name: string;
  orcid: string | null;
  field: string;         // short discipline line for the header
  scoreSentence: string; // 'Three qualifying datasets, each with a normalized score of at least 3.'
  story: { title: string; paragraphs: string[] }; // 'What this portfolio shows'
  datasets: Dataset[];
}

export const RESEARCHER_LIST: Researcher[];
export function sNorm(theta: number, omega: number, normFactor: number): number;
  // max(1, (0.1*theta + omega) * normFactor)
export function sIndex(rows: { sNorm: number; qualifies: boolean }[]): number;
  // largest S with ≥ S qualifying rows having sNorm ≥ S
```

`sNorm` / `sIndex` are pure and unit-tested (vitest, alongside the existing lib tests):
Bissig fixture → 3, Kaye fixture → 1, floor engagement, edit flipping 3 → 4, non-qualifying
rows excluded, empty portfolio → 0.

Note: `scoreSentence` is written against the *original* data. When live edits change the
S-index, the header shows the number plus an "edited" tag; the sentence remains the original
(acceptable: reset restores coherence, and the tag signals the mismatch).

## Route

- `app/researchers/[slug]/page.tsx` — static params from `RESEARCHER_LIST`; unknown slug → 404
  (`notFound()`).
- The page is a **normal-flow scrolling document**. No snap sections, no scroll interception of
  any kind. Must be self-explanatory for an unattended judge.

## Page anatomy (top → bottom)

Same visual language as the landing: paper background, glass `Nav`, content in contained
composed blocks, term colours (`--p1`..`--p4`) reused so θ is always rose, ω gold, μ indigo,
the floor teal.

### 1. Sticky researcher header

- Full state: name, ORCID link, field line, dataset count, large S-index chip, and
  `scoreSentence` spelling out the definition in words.
- Collapses on scroll (CSS `position: sticky` + a scroll-threshold class, or a measured
  shrink) to a slim bar: name + **live S-index chip**. The chip is the page's scoreboard —
  it always reflects the current (possibly edited) portfolio.
- When any value differs from the original data: chip shows a small `edited` tag and a
  **Reset** button appears beside it (also mirrored in the workbench). Reset restores all
  original values in one click. Scrolling/selection never resets anything.

### 2. The workbench (centrepiece)

A contained two-pane block, roughly 38/62:

- **Left — dataset list.** One entry per dataset: title, repository + year, current S_norm,
  and state. Qualifying entries carry their principle-coloured accent; a non-qualifying entry
  is *not* greyed out but carries a red "does not qualify — <failedGate>" badge and is excluded
  from all aggregation. Selection is **click or arrow keys** (roving `aria-selected`,
  `role="listbox"` semantics). No wheel hijacking — the page scrolls normally everywhere.
- **Right — the live equation.** The site's equation, rendered smaller than the landing's,
  with the selected dataset's numbers substituted in place of the symbols
  (`max( 1, (0.1·372 + 4) × 0.973 ) = 40.1`-style, with the symbol shown as a small label
  above each value). θ and ω are **editable** — click-to-edit numeric inputs with steppers,
  styled in their term colours. μg/μf is fixed (it belongs to the field, not the researcher);
  it shows its value plus a small badge naming the normalisation path that fired
  (`co-citation · category mean · global mean`). Below the equation line: the computed
  S_norm result, updating live, with a floor indicator when `max(1, …)` engaged
  ("floored to 1 — the floor at work").
  - Edits are **persistent per dataset** across selection changes (kept in component state
    keyed by dataset id) so multiple datasets can be edited to explore aggregate effects.
  - Selecting a non-qualifying dataset still fills the equation but overlays/annotates the
    pane with why the gate blocked it (failed criterion named; ethics caveat where relevant)
    and shows that its score does not count.
- Switching datasets crossfades/slides the values (~200 ms); respects reduced motion.

### 3. Aggregation strip (supporting visual)

Under the workbench, full width of the block: ranked horizontal bars of current S_norm for
qualifying datasets, **square-root scale** (values span 1.0–40.6), value labelled on each bar,
cutoff line at the current S-index with the caption
"S datasets clear S_norm ≥ S → S-index = S" instantiated with live numbers. Updates live with
edits — this is where "why did it become 4?" is answered at a glance. Non-qualifying datasets
appear as a faint slot with the red badge, outside the ranking.

### 4. "What this portfolio shows" — narrative block

Two/three short paragraphs from `story`, per researcher (Bissig: h-property made concrete;
Kaye: ORCID-completeness diagnostic, framed as what the metric is designed to surface, never
as a judgment of the researcher).

### 5. Caveats strip

Small, honest, three items: Ethics criterion needs human review (not machine-checkable);
θ = 0 wherever a repository doesn't report COUNTER (didn't bite here — Dryad reports);
download counts drift live (SATURN: 372/376/391 across runs). Plus, while provisional data is
in use: a single unobtrusive line noting per-dataset figures are illustrative pending the
team's final numbers (removed when real data lands).

### 6. Cross-link footer

Card linking to the other researcher (name, S-index, one-line hook), then the standard
`FOOTER` line.

## Landing page changes

- `RESEARCHERS` in `lib/content.ts` gains `slug` and is rewritten to the real pair:
  `{ score: 3, name: 'David Bissig', meta: '… · 5 datasets', slug: 'david-bissig' }` and
  `{ score: 1, name: 'Jeffrey Kaye', meta: '… · 1 dataset', slug: 'jeffrey-kaye' }`
  (exact meta lines written during implementation; Kaye's should gesture at the diagnostic
  story, e.g. "1 linked dataset — and that's the finding").
- `Tail.tsx` researcher cards become links to `/researchers/<slug>` (real `<a>`/`<Link>`,
  keyboard-focusable). Note for the copy-deck reconciliation: these two card lines changed
  after the deck was sent to the team.

## Responsive & static behaviour

- No `useStaticMode` fork: this page is responsive in normal flow at all widths.
- < 960px: workbench stacks — dataset list becomes a horizontal scrollable row of compact
  chips above the equation pane; aggregation bars remain full width.
- Reduced motion: no crossfades/bar animations; values swap instantly.

## Accessibility

- Dataset list: `role="listbox"` + arrow-key navigation, visible focus.
- Equation inputs: real `<input type="number">` with labels ("θ — honest downloads for
  <dataset>"); live region (`aria-live="polite"`) announcing the recomputed S_norm and
  S-index after edits.
- Sticky header chip changes announced via the same live region; contrast per existing
  palette on paper background.

## Testing

- vitest: `sNorm` / `sIndex` cases listed above.
- Playwright script (`.superpowers/sdd/`, gitignored, pattern as before): page renders for
  both slugs; unknown slug 404s; selecting datasets updates the equation; editing ω flips the
  S-index (find the minimal edit on the Bissig fixture); reset restores; header collapses on
  scroll and chip stays visible; landing cards navigate to the pages; 1366×768 and 375×812
  layouts hold.

## Out of scope (deliberately)

- Wheel-driven dataset cycling inside the list (revisit only if the team wants demo theatrics;
  additive, cursor-inside-list only).
- Editing μg/μf; editing gate outcomes.
- An illustrative non-qualifying dataset row: **wait for the calculation doc** — if it names a
  real non-qualifying deposit, use it; only then decide whether to invent one if it doesn't.
- Leaderboards, more researchers, live API computation, `/researchers` index page (cards on
  the landing are the index for now).
