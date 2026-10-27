# Perspectives — Case Registry

The single source of truth for which case is which, across every repo and
checkout this platform currently lives in. If a case's catalog number is
ever in question, this file wins — update it here first, then everywhere
else that cites a number.

## The naming convention (permanent)

- **Catalog name**: `Perspectives NN — "Title"`, two-digit, assigned once
  and never reused or reassigned, in the chronological order each case's
  first build commit was made.
- **The catalog number is independent of internal code names.** Existing
  internal slugs (`case002.ts`, `caseAscent.ts`, `caseUntouchable.ts`,
  `products/concert`, `src/case3`/`src/case3v2`) are NOT renamed to match —
  renaming working files/branches/deployed paths is expensive and risky
  for no real benefit. This registry is the bridge between the two.
- **One case, multiple mechanical variants = one catalog number**, not
  one per variant. A version label distinguishes them (e.g. "v1 Crisis ·
  v2 Negotiation"). A variant is a different *implementation* of the same
  premise, not a different case.
- **Category** and **status** are separate tags, never encoded in the
  number itself. Status values: `Live`, `Active` (currently the deployed
  case where a product only runs one at a time), `Prototype` (built,
  not merged/released), `Not published` (built, QA'd, intentionally not
  public yet).

## The registry

### Perspectives 01 — "The Last Message"
- **Status**: Live. **Category**: Mystery / domestic investigation.
- **First build**: 2026-10-07.
- **Internal slug**: `case002` (`src/game/case002.ts`).
- **Location**: `products/perspectives`, branch `main`, this repo
  (`canudas-studios`).
- **Live**: https://gamexperspectives.vercel.app/ when `caseData.ts`/
  `ACTIVE_CASE` points here (shared single-case-at-a-time deployment with
  02 — see that entry's note).
- **One line**: The player is a judge investigating Daniel Costa's death;
  five witnesses, three freeform (Elena, Sofia, Tom); no time pressure.

### Perspectives 02 — "The Last Ascent"
- **Status**: Live / currently Active (the deployed case on `main` as of
  2026-10-27). **Category**: Crisis / survival investigation.
- **First build**: 2026-10-11.
- **Internal slug**: `ascent` (`src/game/caseAscent.ts`).
- **Location**: same repo/branch as 01 — `caseData.ts` is a swappable
  pointer, only one of 01/02 is ever live at a time.
- **Live**: https://gamexperspectives.vercel.app/ (currently this one).
- **One line**: Same investigation engine as 01, plus a real
  `TIME_PRESSURE` clock — the proof that the engine could carry urgency
  without changing its grammar.

### Perspectives 03 — "Flight 702"
- **Status**: Prototype, not merged to `main`, not production-released.
  **Category**: Crisis / operational decision-making.
- **First build**: 2026-10-12 (v1); v2 is a later, separate experiment.
- **Two variants, same catalog number**:
  - **v1 — Crisis grammar**: `src/case3/`. Branch
    `case3-flight702-prototype` in this repo, deployed separately at
    https://perspectives-case3.vercel.app/case3 (own Vercel project,
    `perspectives-case3`, isolated from 01/02's shared deployment).
  - **v2 — Bounded negotiation experiment**: `src/case3v2/`, isolated
    authored-exploration → negotiation variant with `api/hale-negotiate.ts`.
- **Known fragmentation, worth knowing about**: this case's code also
  exists duplicated inside a separate working checkout
  (`~/.codex/.chatgpt-projects/.../outputs/concert-build/products/perspectives/src/case3*`)
  used for a ChatGPT/Codex handoff pack dated 2026-10-19. Do not assume
  the two copies are in sync — verify against this repo's own branch
  before trusting either one as current.
- **Open, unresolved from a 2026-10-13 audit** (not yet fixed as of this
  registry's writing): the D4 outcome grading contradicts its own preview
  text on Route B; confirming the fire has no in-dialogue way to inform
  Maya; the reveal narrates intended drama rather than the actual event
  when the clock forces a choice; `commitD1` isn't idempotent at the
  store level.
- **One line**: An aircraft emergency — Hale (pilot), Maya (engineer),
  Rory (ATC/weather) — under a real margin-draining clock; v2 trades the
  clock-and-chips grammar for an explicit negotiation phase with Hale.

### Perspectives 04 — "The Song Was For You"
- **Status**: Core exploration/negotiation engine implemented and live;
  a further "meeting" feature (task029) is implemented locally and
  independently QA'd but **explicitly not published yet**.
  **Category**: Romance / relationship negotiation.
- **First build**: 2026-10-14.
- **Internal slug/location**: `products/concert`, in the separate
  `concert-build` checkout (`~/.codex/.chatgpt-projects/g-p-6a4fdad14224819182ee512d0c88b88c/outputs/concert-build`)
  — not this repo. Different stack entirely: React + Vite + JS/JSX, not
  TypeScript, and does not share the investigation engine (`caseData.ts`
  etc.) that 01/02/03 use.
- **Live**: https://gamex-concert.vercel.app/ (confirmed responding
  2026-10-27; the public release is pinned to an older commit than the
  locally-accepted task029 work — recheck before assuming parity).
- **One line**: A backstage negotiation between Lia and Nora over one
  shared encore, with the producer (the player) brokering it; the
  platform's reference case for the newer six-phase hook→exploration→
  AI-conversation→decision→consequence→reflection loop.

### Perspectives 05 — "Untouchable"
- **Status**: Prototype, deployed as a one-off preview, not merged to
  `main`. **Category**: HR / workplace.
- **First build**: 2026-10-27.
- **Internal slug**: `untouchable` (`src/game/caseUntouchable.ts`).
- **Location**: `products/perspectives`, branch `case003-untouchable`,
  this repo.
- **Live preview**: https://perspectives-loiedjdi5-ocanudas-7641.vercel.app
  (temporary preview deploy; AI path untested there — see this case's own
  design docs, `CASE_003_DESIGN.md` etc., in the same folder, for the full
  history including an independent Story Critic pass).
- **One line**: An HR Business Partner reviews a star performer's PIP,
  where the underlying harm is real and overdue and the review's timing
  is opportunistic — both true at once, by design, no clean verdict.

## Not in the registry, on purpose

- **"Abans que ho enviïs"** and the **family/context experiment**
  (`family-overheard-v01`) are explicitly documented as proposed/tested
  directions, not implemented cases — no catalog number.
- Any case-specific design doc, task file, or QA verdict stays wherever
  its own case's code lives; this registry only tracks catalog identity,
  status, and location — not full production history.
