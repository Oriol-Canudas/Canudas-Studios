# PERSPECTIVES — shared review handoff

Updated: 2026-10-08 by Codex, at Oriol's request to coordinate through this repository.

## How we work

- Claude owns implementation. Codex owns playtesting, review and reproducible feedback. Oriol owns product decisions.
- One code editor at a time. Codex will not change application code while Claude is implementing. Do not overwrite another collaborator's uncommitted changes.
- This file is the review queue and results exchange. CURRENT_BUILD_STATE.md remains the build-status entry point; DECISIONS.md records decisions; PRODUCTION_LOG.md records delivered changes. Avoid maintaining competing status documents.
- Read this file before the next iteration. Finish the already authorized integrity fixes before the AI-conversation iteration; do not restart or discard work already underway.
- Files do not notify or activate another agent. Oriol triggers Claude to read this handoff and Codex to review the resulting build. No automatic monitoring is configured.
- Do not commit, push or deploy solely because this handoff exists; follow the user's existing delivery authorization.

## Baseline observed by Codex

Local repository verified on 2026-10-08:
`/Users/oriol.canudas/dev/canudas-studios/products/perspectives`

HEAD at inspection: `fad4868`. Uncommitted changes were present in `src/game/caseData.ts` and `src/game/types.ts`; their owner and completion state were not independently verified. They were left untouched.

The current build document reports deterministic dialogue and no live LLM integration. This is not a fresh runtime/API verification. Earlier browser findings below may already be addressed by work in progress; reproduce them before changing code.

Playtest URL: https://gamexperspectives.vercel.app/

## Current objective and sequence

1. Complete the integrity/UI-flow corrections already discussed with Oriol.
2. Implement actual OpenAI conversation for Tom first, using the previously supplied detailed conversation prompt. Other witnesses may remain clearly identified as deterministic.
3. Verify the deployed experience and measure quality, latency and inference cost before expanding scope.

The experiment: can players ask natural questions, gain useful constraints and change Tom's willingness to disclose through evidence and their intervention, while authored facts remain consistent?

## Review queue from previous browser sessions — NOT retested on current HEAD

| ID | Reproduction / observed problem | Acceptance criterion |
| --- | --- | --- |
| R01 | Fresh case, open Marco: suggested question presupposed Tom's accidental-confession account before it was learned. | Suggestions never disclose unknown testimony; legitimate exploratory questions remain possible. |
| R02 | Marco failed both natural paraphrases and a suggested question about his call with Daniel. | Supported questions produce relevant answers; when AI is added, equivalent phrasing and Catalan/English/Spanish are tested without keyword dependence. |
| R03 | Tom's upstairs admission depended on first asking whether he saw someone. | Valid evidence and questioning support more than one disclosure route; an unrelated fixed question order is not required. |
| R04 | Tom's account of the stabbing appeared as FACT on the board. | Testimony, evidence, inference and uncertainty remain distinct, even if testimony matches author truth. |
| R05 | Zero-investigation verdict reported four pieces of evidence discovered; full evidence plus confession still showed low clarity. | Acquired, inspected and presented evidence are distinct; remove misleading completeness percentages. |
| R06 | Insufficient-evidence verdict received the same prosecution-belief headline as an Elena guilty verdict. | Reveal feedback matches the actual verdict and expressed uncertainty; do not claim analysis of free text unless implemented. |
| R07 | Reveal contained a six-versus-46-minute discrepancy and treated phone unlock as proof Daniel was alive. | Timeline arithmetic is correct; device activity is not presented as independent proof of life. |
| R08 | Hard to explicitly confront a witness with a selected evidence item. | Present-evidence action makes the item and accompanying question clear and records presentation to that witness. |

These were simulated player styles, not demographic or human engagement validation. Original browser tests were against an earlier deployed build, not the current uncommitted files.

## AI iteration acceptance criteria

- Real server-side OpenAI requests work locally and on the deployed app. Never expose keys in browser code, chat, logs or committed files.
- Authored world facts remain authoritative. Character knowledge, beliefs, motivations and dialogue are separate. The model cannot create evidence or alter the culprit/timeline.
- Interpretation handles free questions and follow-ups, rather than merely rephrasing a keyword-selected response. Engine validates disclosure/state changes before committing them.
- Compare accusation without evidence, precise evidence-based confrontation, and an empathetic intervention from the same starting state. Differences should be causally justified, not rewards for a magic phrase or repeated kindness.
- No premature confession, cross-witness omniscience or conversion of testimony into fact. Useful partial information counts as progress.
- Failed or repeated requests do not advance state twice. Reset invalidates stale replies. Failures are explicit; canned fallback must not masquerade as live AI.
- Record model, usage for every call (including interpretation, validation and retries), latency, failures, and estimated session cost using dated rates. Keep secrets and raw transcripts out of routine logs.
- Apply bounded requests/output/retries and a server-side disable switch. Do not invent an approved monetary budget; report configuration needed before public cost exposure is considered controlled.
- Separate mocked checks, live API checks and deployed browser checks in the completion report. Configuration alone is not proof of working AI.

Out of scope for this iteration: new cases, voice/avatar, charisma dice, metagame, general backend/auth/payments, new energy/time mechanics.

## Claude result — filled 2026-10-08 by Claude

- Status: implementation complete for step 1 (integrity/UI-flow corrections). Step 2 (OpenAI conversation for Tom) not started — out of scope for this iteration per Oriol's explicit approval ("this approval covers the investigation-integrity iteration, not the separate stateful AI-conversation iteration").
- Commit / branch and uncommitted changes: committed to `main` this session (see PRODUCTION_LOG.md 2026-10-08 "Investigation-integrity pass" entry for the exact file list); nothing left uncommitted in application code at hand-off.
- Deployed URL and verified version: https://gamexperspectives.vercel.app, auto-deploys from `main` on push.
- Review IDs addressed, deferred or not reproducible:
  - **R01 (fixed)** — `isTopicReachable()` now hides a suggestion chip whenever its first stage presupposes a cross-witness fact that isn't true yet (Marco's reaction to Tom's confession, and the 2 equivalent Elena/Sofia cases). Ordinary questions stay visible even when the honest answer is a denial.
  - **R02 (partially fixed)** — The specific reproduction (Marco's suggested question about his call being unanswerable before any evidence existed) is fixed: split into an ungated baseline stage + an evidence-gated detail stage. Keyword coverage widened for the reproduced phrasings. Equivalent-phrasing-without-keyword-dependence across Catalan/English/Spanish is NOT implemented — that requires the AI iteration (step 2), consistent with this handoff's own sequencing; `matchTopic`/`resolveStage` were kept as a clean seam for it.
  - **R03 (fixed)** — Tom's "did you see anyone" / "did you go up" / "the argument" no longer form a forced chain; all three now depend directly on `after_that >= 1`, askable in any order.
  - **R04 (fixed)** — Tom's stabbing account is now board type `claim`, not `fact`.
  - **R05 (fixed)** — Acquired (`discoveredEvidence`), inspected (`inspectedEvidence`, new), and presented (`presentedEvidence` + `presentationLog`, new, per-witness with exact excerpt recorded) are now three distinct states. Board facts are added on *inspection*, not acquisition — the 4 free starting documents no longer silently populate the board or inflate "evidence discovered" counts for a zero-investigation playthrough (verified this exact scenario in `scripts/selftest.ts`). Case Clarity % removed entirely; replaced with plain counts everywhere.
  - **R06 (fixed)** — Verdict grading now has 3 outcomes per axis (correct/wrong/insufficient); insufficient-evidence on both axes gets its own honest headline, never the "believed the prosecution" one. The player's free-text theory is shown as-written with an explicit "not scored against the account below" label — no claim of analysis.
  - **R07 (fixed)** — "six minutes later" corrected to 46 minutes (23:06→23:52). The 23:58 phone-unlock record now reads "does not establish who used it" in both the evidence card and the board fact; the reveal's own ground-truth narration is reworded to flag that distinction rather than claim the record "confirms" anyone was alive.
  - **R08 (fixed, with a caveat)** — A present-evidence action exists in-chat: pick a document (from what's already acquired) → pick the specific excerpt line → it's shown to the witness and logged (`presentationLog`, with witness/evidence/excerpt/timestamp). Caveat: the player cannot attach their own free-text question alongside the presented excerpt this round — presenting is evidence-only, auto-matched to whichever topic that document is authored to speak to (if any) using the existing `requiresEvidence` authoring, reusing the same `resolveStage` rules asking a question would use (so presenting can never unlock anything a normal ask couldn't). A small set of flagship confrontations (Tom's return, Sofia's call-back, Sofia's apartment visit, Tom's knife account) get an alternate reply line that explicitly references the shown document.
  - Not addressed / explicitly deferred (per Oriol's own prioritization, "before expanding the comparison and hint features"): the board-comparison tool and progressive hints. Not part of this round.
- What changed: see PRODUCTION_LOG.md's 2026-10-08 entry for the full list; DECISIONS.md's matching entry explains the 7 adjustments Oriol required before implementation (narrower chip-hiding rule, 3-way distinct evidence tracking, hand-authored board facts instead of regex-parsed, neutral phone-unlock wording, bounded keyword work, authored reveal notes instead of inferring from the board, honest 3-outcome grading).
- Tests actually run and their results: `npx tsx scripts/selftest.ts` — 49/49 assertions pass (grew from 27). `npx tsc --noEmit` — clean, no type errors.
- Real API tested? Not applicable this round — no AI/OpenAI work was in scope or attempted. All witness dialogue remains deterministic, authored, state-gated.
- Measured latency and estimated cost per intervention/session, sample size and rate date: not applicable — no live model calls exist yet.
- Known limitations / decision needed:
  - **Browser automation was unavailable in this environment** (Chrome extension not connected) — everything above is verified against the real Zustand store via the self-test harness, not against the rendered page. Mobile chip wrapping, the evidence-picker sheet, draft preservation across tab navigation, and an actual insufficient-evidence playthrough end-to-end have NOT been visually verified. This needs a real phone/browser pass — either Oriol playing it, or Codex's next review session, before this is called fully validated.
  - R08's caveat above (no free-text question alongside a presented excerpt) is a real, intentional scope limit, not an oversight — flagging it in case it matters for the acceptance criterion's "accompanying question" wording.
  - Step 2 (OpenAI conversation for Tom) has not been started; this handoff's acceptance criteria for that section are all still open.
- Ready for Codex review: yes.

## Codex review — fill after testing the reported build

- Status: pending; no new browser test performed during handoff setup.
- Version and environment tested:
- Scenarios and observations:
- Regressions / remaining issues with reproduction:
- Recommendation and next bounded step:
