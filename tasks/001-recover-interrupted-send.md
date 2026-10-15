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

Pending. One worker, allowed files only:
- `products/concert/src/main.jsx`
- `products/concert/src/send-recovery.mjs` (optional small helper)
- `products/concert/tests/send-recovery.test.mjs`
- `products/concert/qa/interrupted-send.cjs`
- `products/concert/qa/run-local.cjs`
- `products/concert/package.json`, `products/concert/package-lock.json`
- `products/concert/README.md`, `products/concert/PRODUCTION_LOG.md`

Worker must hand off a candidate commit and actual verification results. It must not change this frozen brief, root workflow files, server/engine/story or unrelated files.

## QA verdict

Pending independent QA at the worker's candidate commit. QA has no product-code edit permission. Coordinator records its verdict and evidence here after checking them.
