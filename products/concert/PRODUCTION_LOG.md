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
