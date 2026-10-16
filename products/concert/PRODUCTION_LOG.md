# Concert production log

## 2026-10-15 — task 001, interrupted-send recovery (local candidate)

Baseline `e7d0a7b2c2998188e8eabf8207d9518836423605`, workflow scaffold `305d84f`. A controlled delayed API response reproduced an orphaned “Sending…” label after reload before implementation (coordinator evidence: `/tmp/concert-baseline-interrupted.json` and `.png`).

Client now saves the exact request before dispatch. Reload marks unresolved delivery as unconfirmed and offers explicit retry with the original message, signed token and request ID. Retry preserves the current draft and deduplicates the player bubble. Completed replies clear the saved request; restart invalidates old replies and clears the request lock. Existing pending saves recover from their original message ID and current token. Session export omits both top-level and nested signed tokens.

Minimal repeatable setup: pinned Playwright dev dependency, `npm run qa:local` (build + static preview + four offline browser suites), and `npm run qa:interrupted`. No API middleware runs in preview; no live model, deployment, story, engine, consent or other-product change.

Worker validation: 25 Node tests passed; production build passed; existing authored-route/resilience/agreement-exit browser checks passed; new browser cases passed for newer draft, no draft and legacy interrupted saves, each with two passive reloads and an explicit retry. Evidence is in ignored `qa/*-results.json` and `qa/interrupted-send-*.png`. Independent QA verdict belongs in the frozen root task and is not asserted here.

Limitations: browser-local durable storage only; old missing request identifiers cannot be reconstructed; signed-token expiry and server instance deduplication remain unchanged; controlled fixtures validate UI/state recovery rather than real model outcomes or exactly-once inference. Chrome checks do not establish real iOS keyboard behavior or human enjoyment.

## 2026-10-15 — task 002, two-song clarity and opening scene taps (local candidate)

Baseline `cbf733b`. Bruno now explicitly explains one broadcast slot for two different songs: Lia’s brand-new solo song versus the duet Lia and Nora wrote together. Authored dialogue, notes, programme labels, conditional messages, review/ending UI and Lia prompt/audit terminology consistently distinguish them. Nora’s credit refers to their shared songs; no authorship of Lia’s new solo song is invented. Existing saved conversations are preserved.

Clicking/tapping a non-interactive opening scene advances one beat, even while paused; the last beat reaches backstage. Buttons retain their individual actions, selected text and drags do not advance, and React’s existing effect cleanup gives each manually selected beat its own complete automatic reading time. No ending-scene handler, engine, schema, consent gate, persistence or audio change.

Worker validation: 25 Node tests and production build passed. Five offline browser suites passed, including the new `opening` suite registered in `npm run qa:local`. It checks explicit alternatives, paused/automatic/manual timing, keyboard Next, notes/sound controls, selection/drag exclusions, final/skip transitions, unchanged prep/negotiation/draft/consent and reachable controls without overflow at 390x844 and 390x480. Screenshots/results are ignored under `qa/`. Existing live-script selectors were updated for the new copy, but live scripts were not run. Independent QA verdict belongs in root task 002.

Limitations: controlled Chromium fixtures and reduced-motion emulation do not establish physical iOS touch behavior, human comprehension or real-model compliance with the clarified terminology. No paid calls, push or deployment performed by BUILD.

## 2026-10-15 — task 003, conversation hierarchy (local candidate)

Baseline `dcdd0e8`. Authored dialogue now separates the labeled previous player intervention (`You said`), one character-labeled speech block, and available responses (`What do you say?`). The character's reply and following node sentence share the same speech treatment; no quotation bar suggests an internal thought. Initial dialogue and Bruno's existing spoken context use the same hierarchy. Earlier exchanges are collapsed by default and reset to collapsed for each new turn. AI speaker labels remain, physical cues are italic and separated from speech, and the player's optional goal is explicitly private. No story wording, options, reducers, saves, requests, consent or audio mechanics changed.

Worker validation: 25 Node tests and build PASS; all six local controlled browser suites PASS (existing five plus new `hierarchy`). The new suite checks actual promise-path choices against the reducer state, exact available options, same-speaker response/continuation, initial and later Lia/Bruno dialogue, collapsed history with state-inert expansion, private goal/cue/speech distinction, draft preservation, 390x844/390x480 and desktop layout. Screenshots and results remain ignored under `qa/`; mobile authored and AI screenshots visually inspected. Independent QA verdict belongs in root task 003.

Limitations: no paid calls, push or deployment by BUILD; physical iOS and live-model wording untested. Returning to a character can still juxtapose the previous reply with the current entry-node line; that pre-existing narrative continuity issue requires a separate story/state brief and is deliberately preserved here. Hierarchy clarifies who is speaking, not character motivations or narrative transitions.

## 2026-10-16 — task004, encore v05 reconstruction (local candidate)

Baseline product `f397b4a`; isolated branch `codex/concert-encore-v05`. Rebuilt fixed story, authored routes/returns, knowledge relay, model/audit agreement semantics and endings around the completed main set and one customary shared encore. Nora is a core co-writer/co-vocalist; Lia fronts the band. Booking confirmation explicitly excludes Nora from next tour. Removed the competing premiere/broadcast, past kiss/residency and additional encore premises from the playable experience.

Current response, legitimate same-speaker forward continuation and prior transcript remain distinct. Permission does not deliver; a delivered professional explanation causes Lia's contextual reinterpretation. Optional love stays confidential unless explicitly disclosed. Four outcomes preserve participant boundaries and separate agreement from cue. Same-package stage-space additions and semantic term withdrawal invalidate old acceptance versions. Private condition returns use the same conversation and remaining turns. Real confidentiality breach blocks shared performance; review admits it, respects refusal and can explicitly offer the band-without-Nora alternative. Promise correction no longer mechanically forces a public result.

New versioned save retains/exportably distinguishes old two-song state; old signed build envelopes are rejected before generation. API edit is limited to that verified story-compatibility guard and initializing signed private-discovery provenance. Original pending-send, retry identity, draft and restart mechanics preserved. Legacy export strips tokens without editing old storage. Existing media/audio untouched.

Worker verification:36 deterministic Node tests PASS; build PASS; seven controlled browser suites, including eight new encore journeys, run via static preview with no provider credentials or paid inference. Screenshots and JSON evidence are ignored under `qa/`. New logic tests include same-package versioning, latest-negation semantic audit fixtures, fabricated versus real confidence, permission/delivery, contextual returns after root exhaustion, forward speech and replayable promise repair. Independent QA verdict is not asserted here and belongs in coordinator task004.

Limitations: controlled fixture dialogue is not evidence of real-model semantic quality. Physical iOS interaction, human comprehension/enjoyment and live-model evaluation remain separate acceptance work. No new services, dependencies, assets, push or deployment by BUILD.

### Task004 independent-QA correction batch

Independent QA rejected candidate5170abb: an actor refusal could retain an earlier yes when the separate audit still considered the offer terms grounded; a Lia-only Eva note also attributed Nora testimony never heard. Corrected generation/audit schema to distinguish willingness (agree/continue/withhold/withdraw) from semantic term support. Refusal and unresolved participation revoke the old acceptance version, so prior Nora confirmation cannot be reused. Closing an unchanged offer can preserve an explicitly continued yes. Withdrawing the without-Nora offer disables immediate reacceptance of that same offer through the authored alternative; actual remaining negotiation and no encore remain available.

Notes now separate Lia seeing Eva, Nora's distance, her spoken rehearsal accountability and her professional belief. Love alone/accountability does not manufacture the belief claim. Legacy notice actions use transparent themed styling and minimum44px targets.

Worker revalidation:43 Node tests PASS, build PASS and all seven offline browser suites PASS, now11 encore journeys. Regression uses provider-shaped fixtures through `generateTurn` and actual browser send/review to verify stale cue removal, solo-refusal protection, source-aware notes and unchanged-close semantics. No paid calls, push or deployment. Independent re-QA still required for the new candidate.
