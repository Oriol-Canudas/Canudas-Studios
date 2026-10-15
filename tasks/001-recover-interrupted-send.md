# 001 — Recover an interrupted Lia send

## DESIGN — frozen 2026-10-15

Checkout: `outputs/concert-build` (Git root, not the surrounding ChatGPT project).
Branch: `codex/concert-immersion-english`.
Baseline: `e7d0a7b2c2998188e8eabf8207d9518836423605`; initially clean.
Source: read-only repository audit in chat “05 - Perspectives > design & build”, turn `01a13e98-17e5-7991-9e10-7f1123ca353f`.

Player benefit: recover a message interrupted by reload without losing a newer draft or falsely claiming a delivery result.
Scope: Concert client persistence/request recovery and focused automated/browser QA; minimal reproducible browser dependencies/commands. Root workflow files are the only cross-product additions.
Non-goals: backend infrastructure, story/engine/content changes, other products, paid model calls, deployment, automatic resend, exactly-once inference guarantees.

### Acceptance (from the audit)

1. Reload while a reply is delayed: message remains recoverable; no permanent “Sending…” indicator.
2. Unknown delivery: UI says delivery is unconfirmed; it invents neither failure nor success.
3. Newer draft: interrupted message and newer draft both survive.
4. Explicit retry of unchanged text: original message, token and request ID are reused; reload does not auto-resend.
5. Successful retry: one player message and one reply; validated turn advances once.
6. Reload without retry: facts, agreements, consent and turn count remain unchanged.
7. Regressions: existing send/retry, restart safety and agreement-to-performance journeys pass.

Preserve authored facts, knowledge boundaries, agreements, consent and existing drafts. Deduplication remains best-effort across server instances.

### Baseline reproduction — confirmed before behavior changes

Command: `node /tmp/concert-reproduce.cjs` with local Vite at `http://127.0.0.1:8785`, bundled Playwright and installed Chrome; script holds the send POST using a route promise, types a newer draft, waits for save, then reloads before releasing the response.
Observed: one POST; saved player bubble still `pending:true`; after reload one “Sending…” label but zero active response statuses; newer draft survives; negotiation unchanged. Thus the delivery marker becomes orphaned and has no recovery control.
Evidence: `/tmp/concert-baseline-interrupted.json`, `/tmp/concert-baseline-interrupted.png`, `/tmp/concert-reproduce.cjs`. These are controlled browser fixtures, not live-model evidence. Durable candidate regression should encode this scenario.

## BUILD handoff

Implementation worker: `concert_build`, completed before `concert_qa` started.
Candidate: `a913c776b952ed227461b8279a1b4ea6a6362593` (parent workflow commit `305d84f`).
One worker, allowed files only:
- `products/concert/src/main.jsx`
- `products/concert/src/send-recovery.mjs` (optional small helper)
- `products/concert/tests/send-recovery.test.mjs`
- `products/concert/qa/interrupted-send.cjs`
- `products/concert/qa/run-local.cjs`
- `products/concert/package.json`, `products/concert/package-lock.json`
- `products/concert/README.md`, `products/concert/PRODUCTION_LOG.md`

Worker changed exactly the nine permitted Concert files (including the optional helper). Client persists the original request before dispatch, migrates pending saves to unconfirmed delivery, retries explicitly without replacing the current draft, and deduplicates the player bubble. Completed replies clear the saved request; restart invalidates stale responses. Export redacts the newly nested signed token.

Pinned Playwright and the local runner make browser checks repeatable. Run from `products/concert`, with Node 24:

```sh
npm ci
npx playwright install chromium  # or provide QA_CHROME for installed Chrome
npm test
npm run qa:local
```

The runner builds, serves static preview on 127.0.0.1:8796 and runs four offline browser suites; it does not start API middleware or run paid/live scripts. `npm run qa:interrupted` runs only the focused browser cases. Generated evidence stays ignored under `products/concert/qa/`.

Worker handoff reported successful installation, 25 Node tests, build and four browser suites. Independent QA reran these rather than accepting the report. No story, engine, server or other-product changes.

## QA verdict

**PASS** — independent agent `concert_qa` tested candidate `a913c776b952ed227461b8279a1b4ea6a6362593`. QA had no product-code edit permission and made no tracked edits. Coordinator inspected the actual diff, independent JSON evidence and rendered mobile evidence before recording this verdict.

| Frozen criterion | Independent result |
| --- | --- |
| 1. Delayed reload recovery | PASS: interrupted message recoverable, no permanent Sending marker. |
| 2. Honest delivery state | PASS: Delivery unconfirmed; no reply applied. |
| 3. Draft preservation | PASS: empty, same-text, different newer drafts and legacy saves; dedicated recovery retry preserves the composer. |
| 4. Explicit original-envelope retry | PASS: original message/token/request ID reused; repeated reloads produce no POST. |
| 5. Single application | PASS: one player bubble, one reply, one validated fixture turn; subsequent reload remains passive. |
| 6. State boundaries | PASS: prep/facts, accepted agreement, Nora confirmation, admission, drafts and turns unchanged by passive reload, including non-default accepted state. |
| 7. Regressions | PASS: existing authored journey, unavailable API, failed send/retry, restart/late-response safety and agreement→Nora→performance checks. |

Independently executed with exit 0: `npm ci`, `npm test` (25/25), `npm run build`, `QA_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run qa:local` (four suites), `node /tmp/concert-independent-baseline.cjs`, and `node /tmp/concert-independent-extra.cjs`. QA independently reproduced the defect from an archived `e7d0a7b` baseline without switching the active checkout. Extra probes covered failed retry→reload→success, non-default agreement/consent, same/different drafts, blocked different-text send and storage failure preventing dispatch.

Independent evidence (local artifacts, not committed):
- `/tmp/concert-independent-qa/independent-qa.json` — candidate, command exits, criterion results, limitations and source checks.
- `/tmp/concert-independent-baseline-interrupted.json` and `.png` — original defect.
- `/tmp/concert-independent-extra-results.json` and `/tmp/concert-independent-extra.cjs` — additional independent probes.
- `/tmp/concert-independent-retry-different.png` and `/tmp/concert-independent-retry-same.png` — settled mobile recovery renders.
- `/tmp/concert-independent-geometry.json` and `/tmp/concert-independent-geometry.cjs` — matched baseline/candidate bounds at 390×844, before/after composer focus. Lia x=18, turns right=371, textarea x=15/right=323, all inspected scrollLeft=0. Suspected clipping in image presentation did not reproduce in actual browser geometry; its display cause is unconfirmed.
- `products/concert/qa/{browser,resilience,agreement-exit,interrupted-send}-results.json` and recovery screenshots — suites rerun by QA.

Scope proof: candidate checkout/index clean before and after QA; baseline-to-candidate diff contains only Concert and the three requested root workflow files. Coordinator ran `git diff --check`, inspected the actual file list and verified candidate SHA. The final recording commit changes only this task, so tested product bytes remain identical to the candidate.

### Remaining limits

Chromium fixtures prove these client paths, not live-model semantics, human enjoyment, real iOS keyboard behavior or exactly-once inference across server instances. No paid calls or deployment occurred. Browser storage must work; missing legacy request IDs cannot be invented. Existing token expiry and three-attempt cap remain. Different draft text cannot send until unresolved delivery is recovered; the saved agreement can still be used to finish. Normal composer submission clears the text explicitly submitted; the dedicated recovery retry preserves it. Temporary evidence may be removed by system cleanup; durable reproduction lives in the focused browser suite and this committed verdict.
