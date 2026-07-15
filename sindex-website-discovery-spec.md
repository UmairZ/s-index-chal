# S-Index Data-Sharing Website — Discovery & Requirements Spec (v1, client-facing)

**Project:** Website / demo for the AI.Health4All submission to the NIH/NEI S-Index Challenge
**Prepared by:** Umair Zaidi (developer)
**For:** Michelle Hribar + AI.Health4All team (Robin, Travis, et al.)
**Hard deadline:** Demo in Bethesda — **July 20**
**Status:** Working document — to be filled out together

---

## How to use this document

This is the **first** of two specs. It's the one we fill out **together**, in plain language, before I write any code. Its whole job is to get the questions out of my head and onto paper so we don't discover a blocker on July 18.

Once we've answered enough of this, I'll turn it into a **second, technical spec** — the build brief I hand to my tooling (Claude Code) to actually construct the site.

A few ground rules so this goes fast:

- **"I don't know yet" is a valid answer.** Write it down. Half the value here is finding out what we *haven't* decided.
- **"N/A" is fine too.** Not every section applies. Skip freely.
- **You don't have to answer in order.** Jump to whatever you have answers for.
- **Watch for `(BLOCKER)` tags.** Those are the questions that genuinely stop me from building. If we get those answered, I can start even with the rest half-empty.
- **Watch for `(DEMO-CRITICAL)` tags.** Those are things that must work on July 20 specifically, as opposed to "eventually."

Each section ends with a **Notes / decisions** block — that's where we type answers as we go.

---

## 1. Project Snapshot & Context

*The 30-second version of what we're building and why. If we can't answer §1.1 and §1.2 clearly, nothing else matters yet.*

- **(BLOCKER)** In one or two plain sentences a non-expert could follow: **what is the S-index?** (e.g., "a score that measures how much and how well a researcher shares their data, meant to work like an h-index but for data sharing.")
- **(BLOCKER)** **What is this website, fundamentally?** Pick the closest one (or describe a blend):
  - (a) An **informational site** that explains the S-index concept and our team's proposal.
  - (b) An **interactive demo / prototype** that *shows* the S-index in action on sample data.
  - (c) A **functional tool** that actually computes or looks up S-index scores from real data.
  - (d) Some mix — if so, which parts are which?
- **(DEMO-CRITICAL)** What is the **single most important thing** the site must accomplish in the Bethesda demo? If everything else broke and only one thing worked, what would it be?
- Is this a **one-time demo artifact**, or is it meant to **live and grow** after the challenge? (This changes almost every technical decision — hosting, maintenance, data handling.)
- Who are the **stakeholders and decision-makers**? Specifically: who has **final sign-off** on (a) content/wording, (b) visual design, (c) anything involving the underlying data or method?
- Is there a **Phase 1 submission, writeup, or winning materials** I should read to understand the concept and match its framing?

**Notes / decisions:**
> …

---

## 2. The Challenge & What "Winning" Looks Like

*This is a competition submission with judges, not just a website. Building to the rubric matters more than building something generically nice.*

- **(BLOCKER)** What are the **judging / evaluation criteria** for this phase? What are the judges actually scoring us on?
- What does NIH/NEI **require as a deliverable**? Is the website itself the deliverable, a supporting artifact, or a demo aid alongside slides/a paper?
- What is the **demo format** on July 20? Live walkthrough of the site? Slides with the site embedded? In-person, projected, on our own laptop, or on their equipment? Time limit?
- Will judges (or anyone) **visit the site themselves**, on their own devices, before or after the demo? Or is it only ever shown by us? *(If they browse it unattended, robustness and self-explanation matter much more.)*
- What would make our submission **stand out** from other teams' — is there a specific angle, feature, or "wow" moment we're leaning on?
- Are there **prior/competing approaches** to the S-index (from Phase 1 or elsewhere) we should be aware of or differentiate from?

**Notes / decisions:**
> …

---

## 3. Audience & Users

*Who lands on this site, and what should each of them be able to do or understand.*

- Who is the **primary audience**? (Challenge judges? Researchers? Institutions/data stewards? Funders? The general public?) Rank them if there's more than one.
- How **technical** is each audience? (Do we assume they know what an h-index is? What FAIR data is? Nothing?)
- For each audience: **what should they be able to *do*** on the site, and **what should they walk away *understanding*?**
- Are there **different user roles** with different views — e.g., a public viewer vs. a logged-in researcher who sees their own score vs. an admin? Or is everyone a read-only visitor in this version?

**Notes / decisions:**
> …

---

## 4. The Concept / The Research Behind It

*The substance the site presents. I don't need to become a co-author, but I need to understand it well enough to present it accurately and not misstate the method.*

- **(BLOCKER)** Is there a **defined methodology, formula, or algorithm** for the S-index? If yes, where does it live (paper, doc, spreadsheet, someone's head)? Can I get it?
- For the demo, is the index **actually computed** (live math on real inputs), **precomputed** (we ran it ahead of time, site just displays results), or **illustrated** (mocked-up example numbers to show the concept)?
- What's **settled vs. still in flux** about the method? (I don't want to hard-code something that changes next week — tell me what's stable.)
- What parts of the method are **proprietary / not-yet-public** vs. safe to display openly? Anything under embargo or pending publication?
- Are there **existing works, tools, or standards** to reference or cite (e.g., ORCID, DataCite, FAIR principles, existing data repositories)?

**Notes / decisions:**
> …

---

## 5. Data — Sources, Sensitivity & Handling

*This is the highest-risk section for a **data-sharing** site in a **health-research** context. Please don't skip it. A wrong answer here can create a compliance problem, not just a bug.*

- **(BLOCKER)** What **actual data** will the site display or use? Is it **real, synthetic/fake, or a curated sample**?
- **(BLOCKER)** Does any of it involve **PHI (protected health information), PII, or anything HIPAA-covered**? Even indirectly? *(For an ophthalmology/clinical-data-science project, I have to assume "maybe" until told otherwise.)*
- If real data is involved: has it been **de-identified**, and does displaying it on a public website require **IRB approval, a data use agreement, or institutional sign-off**? Who confirms that?
- **(BLOCKER, if applicable)** Could we **avoid the whole problem for the demo** by using synthetic or fully public sample data? *(Strongly recommended if there's any doubt — it removes a legal blocker and lets me start immediately.)*
- **How will the data reach me?** Format (CSV / Excel / JSON / database / live API), and roughly how much of it.
- Does the data **change over time**, or is it **frozen** for the demo? Does the site need to update live, or is a snapshot fine for July 20?
- Who **owns / licenses** the data, and are there **attribution, embargo, or usage restrictions** on showing it?
- Does the site need to **collect any data from visitors** (form submissions, sign-ups, uploaded datasets)? If so, that opens its own privacy questions (see §10).

**Notes / decisions:**
> …

---

## 6. Features & Functionality

*What the site actually does. Given the timeline, we'll sort these ruthlessly into must-have vs. nice-to-have.*

- List the **candidate features**. Common ones for a project like this — check what applies:
  - Leaderboard / ranking of researchers or datasets by score
  - Individual **profile / scorecard** pages
  - A **score calculator** ("enter your inputs, see your S-index")
  - **Dataset registry / directory** (browse shared datasets)
  - **Search, filter, sort**
  - **Data visualizations** (charts, comparisons, trends over time)
  - **Export / download** of results or data
  - **User accounts / login / submissions**
  - Something else specific to our concept: ______
- **(DEMO-CRITICAL)** Of the above, which **one or two must work flawlessly** in the demo? Circle them mentally — those get built first and tested hardest.
- Which features are **"would be great but we can live without for July 20"**? *(Being honest here is what saves the deadline.)*
- Any feature that requires the **live method/algorithm** to run — vs. features that can run on precomputed results?
- Does the site need **login/accounts** in this version, or can everything be **open / read-only**? *(Read-only is dramatically faster and safer to ship.)*

**Notes / decisions:**
> …

---

## 7. Content & Site Structure (Pages)

*What pages exist, what goes on them, and — critically — who writes the words.*

- **(BLOCKER)** **Who writes the copy?** What text **already exists** (grant writeup, abstract, slides) that I can pull from, vs. what needs to be written from scratch — and by whom?
- What's the **story** for a first-time visitor / judge — the ideal path from "what is this?" to "I get it, this is compelling"?
- Rough **page list** — mark which we need. Typical set for a research project site:
  - **Home / landing** (the hook + the elevator pitch)
  - **About the concept** (what the S-index is and why it matters)
  - **How it works / Methodology**
  - **Explore / Demo** (the interactive part)
  - **Team** (bios, photos, affiliations)
  - **Publications / references**
  - **The challenge / About the project** (context, funders)
  - **Contact**
  - Anything else: ______
- **Team content:** do we have **bios, photos, titles, and institutional affiliations** for everyone who should appear? Who decides who's listed?
- **Publications / citations** to include?
- **Funding acknowledgments** — what grant(s), and any **required acknowledgment wording** (NIH grants usually mandate specific language)?

**Notes / decisions:**
> …

---

## 8. Branding, Identity & Design

*How it should look and feel — and, importantly, whose branding rules we have to follow.*

- **(BLOCKER, if it exists)** Are there **institutional branding constraints** I must respect — UIC, AI.Health4All, the College of Medicine, or NEI/NIH? Any **logos I must (or must not) use**, and any **logo-usage rules**? *(Federal and university brands often have strict guidelines and I'd rather comply from the start.)*
- Does the **project itself have an identity** yet — a name, logo, colors, fonts? Or do we create one? *(Even a simple wordmark helps it feel real for the demo.)*
- What **tone** should it strike: serious/scientific and credible, or modern/approachable and accessible? (These pull in different visual directions.)
- Any **reference sites** — ones you like the feel of, or ones you specifically *don't* want to resemble?
- Are there **institutional co-branding requirements** — e.g., "the UIC logo must appear in the footer," or an NIH/NEI acknowledgment lockup?

**Notes / decisions:**
> …

---

## 9. Technical, Hosting & Domain (client-facing version)

*I'll handle the deep technical spec later — but these decisions need institutional input I can't make alone.*

- **(BLOCKER)** **Where will the site live?** Options: a temporary demo URL I control, a **custom domain**, or a **university-hosted** address. Who owns/decides this?
- **(BLOCKER, if university-hosted)** Does hosting on **UIC (or OHSU) infrastructure** require **IT / InfoSec review or approval**? What's the lead time on that? *(University hosting approvals can take longer than the whole build — I need to know now.)*
- Is there a **budget** for a domain and any paid services (hosting, data APIs)? Even a small one? Who pays / how?
- Does the site need to **connect to any existing system** — institutional login (SSO), a data repository (Dryad, Zenodo, Redivis, etc.), ORCID, or an internal database?
- **After July 20:** who **owns and maintains** the site? Is anyone committing to keep it running, or is it fine for it to be a frozen demo artifact? *(This determines whether I build something simple-and-static or something maintainable-and-updatable.)*

**Notes / decisions:**
> …

---

## 10. Compliance, Privacy & Accessibility

*Heightened because this is health-adjacent, federally-connected research. Better to name these now than explain them to a compliance office later.*

- **(BLOCKER, if any real/health data)** **HIPAA / PHI:** confirmed we're either not touching it, or it's been cleared for public display by the right people? (Ties back to §5.)
- **IRB status:** is the underlying project/data under an IRB protocol, and does putting anything on a public site fall within or outside that protocol?
- **Section 508 / accessibility:** NIH-connected work typically expects **accessible** sites (WCAG 2.1 AA / Section 508). I plan to build to that standard by default — flag if there's a **specific institutional accessibility requirement** to meet.
- **Privacy policy:** if we collect *any* visitor info (a contact form counts), we likely need a short privacy notice. Do we? Who approves the wording?
- **Institutional review before launch:** does anything need **comms / legal / branding office sign-off** before the site is publicly reachable?
- **Required disclaimers or acknowledgments** (NIH funding disclaimer language, "views do not represent NIH," etc.)?

**Notes / decisions:**
> …

---

## 11. Timeline, Roles & Logistics

*The tight-deadline reality. This is where good intentions meet the calendar.*

- **(BLOCKER)** Besides July 20, are there **earlier internal deadlines** — a team review, a dry-run demo, a "content locked by" date?
- **Who delivers what, and by when?** Let's name owners for: the method/algorithm, the data (or sample data), copy/text, team bios & photos, logos & branding assets, any institutional approvals.
- **Turnaround speed:** when I have a question or need a decision mid-build, **who can I reach and how fast can they answer?** (The doc notes Michelle has limited availability — who's my day-to-day contact? Robin? Travis?)
- **(DEMO-CRITICAL)** What is the **minimum viable version** we'd be comfortable demoing if we run low on time — the "floor" we won't drop below?
- **Contingency:** if we're behind on July 17, **what gets cut first?** Let's decide the cut order now, calmly, rather than in a panic later.

**Notes / decisions:**
> …

---

## 12. Scope Boundaries — In vs. Out for the Demo

*Explicitly naming what we're NOT doing is one of the most useful things we can write down. It protects the timeline and prevents "wait, I thought you were building that too."*

- What is **explicitly IN scope** for July 20? (The short must-have list.)
- What is **explicitly OUT of scope** for July 20 — deferred to "after the challenge, if it continues"?
- Anything someone on the team **assumes** is included that we should confirm one way or the other?

**Notes / decisions:**
> …

---

## 13. Open Questions / Parking Lot

*Anything that came up that doesn't fit neatly above. Dump it here so it isn't lost.*

> …

---

## 14. Next Steps & Sign-off

Once we've been through this together:

1. I turn the answers into a **technical build spec** (the v2 developer document).
2. We lock the **must-have demo scope** (§6, §11, §12) so I can start building immediately.
3. We identify anyone we need to **loop in early** — especially for data clearance (§5), hosting/IT approval (§9), and branding/logos (§8), since those have the longest lead times.

**Fastest path to letting me start building even before this is fully complete — the true blockers:**
- What the site fundamentally is (§1.2)
- What data we're using and whether it's safe to display (§5)
- The one or two demo-critical features (§6)
- Where it will be hosted / whether IT approval is needed (§9)
- Who writes the copy and where existing text lives (§7)

Everything else we can refine as we go.

---

*Working notes / questions from Umair as we fill this out:*
> …
