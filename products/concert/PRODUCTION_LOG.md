# Concert production log

## 2026-10-15 — task 001, interrupted-send recovery (local candidate)

Baseline `e7d0a7b2c2998188e8eabf8207d9518836423605`, workflow scaffold `305d84f`. A controlled delayed API response reproduced an orphaned “Sending…” label after reload before implementation (coordinator evidence: `/tmp/concert-baseline-interrupted.json` and `.png`).

Client now saves the exact request before dispatch. Reload marks unresolved delivery as unconfirmed and offers explicit retry with the original message, signed token and request ID. Retry preserves the current draft and deduplicates the player bubble. Completed replies clear the saved request; restart invalidates old replies and clears the request lock. Existing pending saves recover from their original message ID and current token. Session export omits both top-level and nested signed tokens.

Minimal repeatable setup: pinned Playwright dev dependency, `npm run qa:local` (build + static preview + four offline browser suites), and `npm run qa:interrupted`. No API middleware runs in preview; no live model, deployment, story, engine, consent or other-product change.

Worker validation: 25 Node tests passed; production build passed; existing authored-route/resilience/agreement-exit browser checks passed; new browser cases passed for newer draft, no draft and legacy interrupted saves, each with two passive reloads and an explicit retry. Evidence is in ignored `qa/*-results.json` and `qa/interrupted-send-*.png`. Independent QA verdict belongs in the frozen root task and is not asserted here.

Limitations: browser-local durable storage only; old missing request identifiers cannot be reconstructed; signed-token expiry and server instance deduplication remain unchanged; controlled fixtures validate UI/state recovery rather than real model outcomes or exactly-once inference. Chrome checks do not establish real iOS keyboard behavior or human enjoyment.
