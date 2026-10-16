# 005 — Amend the initial authored conversations

## DESIGN frozen 16 October 2026

User authorizes amending the question/answer trees using the review's relevance, punch and interest parameters. This is a scoped dialogue amendment, not another story redesign.
Checkout: `outputs/concert-build`; branch `codex/concert-encore-v05`; baseline `6371cddc36dddb2eaa22286c72025c6fe58cb622`, initially clean. Preserve any later unrelated work.
Review: `/Users/oriol.canudas/Library/CloudStorage/GoogleDrive-ocanudas@gmail.com/La meva unitat/Els meus/01. PERSPECTIVES/03 - CONCERT/reviews/concert-v05-dialogue-review-2026-10-16.md`. Inventory and scores: sibling `dialogue-tree-source.json`; current text audited at 24f2f22, whose story/engine hashes matched the 6371cdd baseline. The editorial ratings are judgments, not measured player enjoyment.
Baseline source archive: `/tmp/concert-dialogue-baseline-20261016/`. Baseline rendered examples and reducer witnesses: the review directory and `/tmp/concert-dialogue-{browser-results.json,audit.json}`. All 44 authored choices plus conditional relay_ack were reachable in the bounded crawl. Four rendered baseline paths verified with API blocked.

### Player benefit and agreed direction

Each meaningful choice should reveal a concrete fact, invite a different interpretation, establish a boundary, or carry a visible consequence. Preserve low-intensity navigation/consent bridges where useful. Keep the strongest details: Nora's answering vocal line, Lia's “I heard permission. Maybe I wanted to”, and the three-day/two-day chronology.

Distinct voices: Nora uses concrete stage/body boundaries and guarded, personal observations; Lia uses music, practical decisions and initially defensive explanations; Bruno reports observations and cue requirements. Reduce repeated workshop language such as “own that”, “honest offer”, “stand behind” and automatic “I know” agreement. Do not manufacture new past events or make resistance a numerical trust system.

### Required amendments and acceptance

1. Tighten initial questions and answers in Nora/Lia/Bruno routes using the review, keeping necessary exits and all substantive discoveries. Pairwise ratings guide editorial choices; do not force every bridge to be dramatic.
2. Give Nora's optional love confession a response beat: the rehearsal exposition must not automatically append immediately after it. The next choices let the player explicitly protect privacy and either ask what professional context can be relayed, ask about rehearsals, or return to tonight's needs. Confidential knowledge remains optional; a professional-only route reaches an equivalent legitimate offer without discovering love. Do not add unnecessary screens or new mechanics. Use existing action IDs where feasible, so old event lists remain replayable.
3. Every authored path that flags acknowledgment and enables relay_ack must contain an actual explicit admission that Lia had already planned the tour without Nora and left her believing the decision remained open. Prospective “I can admit” alone must not be relayed as an admission. Prefer clearer authored speech over expanding the save schema.
4. Visible professional relay wording matches what is delivered: acknowledgment to Nora before singing, shared credit, no promise of another tour, and no claim Nora already agreed. Keep permission, delivery and consent separate. Shorten private/professional relays into natural spoken language while retaining material conditions.
5. Return greetings and offered responses fit the same situation. Nora must not demand Lia's counteroffer immediately after sending her own conditions when the player has not heard Lia; provide a natural invitation to ask remaining questions or defer. Lia should visibly acknowledge a delivered professional offer on the first visit as well as a return. Adapt listen when Nora's conditions are already known; do not ask the player to rediscover them.
6. Chronology confrontation does not silently substitute a stronger/different producer line for the choice selected. Make the actual intervention selectable or clearly staged; attribute the producer's challenge and Lia's reply to their actual conversation.
7. Preserve immutable roles, dates, one shared encore, confirmed next-tour exclusion, optional love, source-aware knowledge, no consent inferred from disclosure, versioned agreements, four outcomes, original request/reload/draft/restart recovery, and existing save keys. No permanent band breakup invented by “goodbye” language. Old valid event sequences remain replayable or a compatibility issue is explicitly reported rather than hidden.
8. Meaningful state tests and controlled browser checks cover Nora-first, Lia-first, love/no-love, authorized context relay, acknowledgment relay, contextual returns, chronology confrontation and dialogue-to-negotiation. Existing encore/consent/recovery/legacy regressions remain meaningful and pass. Inspect mobile 390×844/390×480 and desktop. Score improvement remains an editorial claim pending fresh human play.

Non-goals: image integration (asset exists separately), intro redesign, changed agreement/endings rules, live AI changes, backend/API changes, new dependencies/infrastructure, other products, paid calls, push or deployment. Existing production stays as published; rebuilding static local preview is allowed.

## BUILD bounded handoff

One implementation worker, then a different QA agent, sequentially.
Allowed files only:
- `products/concert/src/story.mjs`
- `products/concert/src/engine.mjs` for narrowly necessary authored-transition/availability/provenance fixes; do not alter negotiation/consent rules
- `products/concert/qa/*.cjs` for the new dialogue suite and selector updates preserving existing assertions; do not change/run live-model suites
- `products/concert/tests/dialogue.test.mjs` (new) and existing `tests/engine.test.mjs` / `tests/encore.test.mjs` only when necessary for valid authored changes
- `products/concert/README.md`, `products/concert/PRODUCTION_LOG.md`

Worker must not edit task/current-state/reference docs, src/main.jsx/style.css, audio/media, signed API, server model prompts, dependencies, other products or unrelated files. Handoff candidate commit, actual checks, paths and limits. If genuinely blocked by allowed scope, report before broadening it. Root owns this task, current-state record and final amended-tree review.

BUILD round 1 candidate: `073b2bba04709f06e2df5f1708895bcb67dd6dfd`. Worker changed nine permitted files; reports 53 Node tests, eight offline browser suites and ten focused dialogue journeys PASS. Parent independently replayed all 45 original action witnesses and verified the engine AI/negotiation/consent suffix unchanged. Worker stopped before independent QA.

## Independent QA verdict

Pending. Use `.agents/skills/gamex-qa/SKILL.md`; no product-code/test edits by QA. Independently inspect and run the actual candidate; play the relevant authored paths and check state/knowledge/privacy/consent, not just selected strings or worker claims. No paid inference. Return PASS / FAIL / BLOCKED with criterion evidence and source-unchanged proof. More engaging means an editorial improvement, not proven enjoyment.


### Independent QA round 1 — FAIL

QA agent `concert_qa` independently inspected candidate `073b2bba`, ran npm ci, 53 tests, build and eight offline browser suites (all exit 0), then added an actual-browser ordering probe. Criterion 2 FAIL: Lia-first `visit:lia → chronology → leave → visit:nora → sheet → changed → love` has a pending acknowledgment; options prepends relay_ack and the three-choice cap displaces tonight_nora. The immediate confidence response therefore lacks the promised privacy-protecting practical exit. Criteria 1 and 3–8 otherwise pass within editorial/source/controlled-fixture scope. No tracked edits; candidate/tree unchanged during QA.

Report: `/tmp/concert-dialogue-independent-qa/independent-qa.json`; reproduction state: `reordered-confession.json`; mobile390×844/390×480 and desktop screenshots in the same folder. Baseline automatic rehearsal continuation independently reproduced; all 45 old action witnesses replayed. Source proof: `state-invariants.json`.

Returned to the same worker for a bounded menu-priority fix. Preserve all three immediate confidentiality responses; defer rather than erase acknowledgment relay, keeping it available after the protected response. Preserve knowledge, consent, action IDs and existing regressions. Add the exact Lia-first pending-ack browser/state case, then hand off a new commit for independent re-QA. Acceptance unchanged.
