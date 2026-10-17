# Task020 — Quiet Backstage shortcut during the opening

## DESIGN

Baseline clean94726594d3f049796218281b100f852e47bf0fe0, branch codex/concert-encore-v05. User asks to make opening Go backstage grey and very unobtrusive: it is secondary while watching the story. Only the opening shortcut changes; important Backstage buttons in authored dialogue/brief stay gold.

## BUILD and acceptance

One bounded worker: change only the existing opening-specific CSS rule in products/concert/src/style.css and add a short PRODUCTION_LOG note. Remove the gold fill/border/text and bold emphasis; use muted grey text and a transparent or very quiet neutral treatment, visually subordinate to Pause/Previous/Next. Preserve current footprint, >=44px target, focus accessibility, label, click behavior and every other screen. No new UI, markup, tests, dependencies, story, state, audio or layout changes. Before editing capture the supplied booking beat in isolated static preview; after editing inspect mobile390x844, compact390x480 and desktop1440x1000. Build and existing opening-layout checks suffice; no broader regression campaign for a colour-only change. No paid calls, user 8810/storage changes, push or deployment by worker.

Separate non-editing QA follows repo skill: inspect exact CSS diff and baseline/candidate rendered hierarchy, confirm opening click still reaches hub and dialogue Backstage remains gold. Existing target dimensions/reading/layout remain unchanged. Temporary probes/evidence only, no new permanent tests. Coordinator may publish the accepted change to existing gamex-concert under continuing release authorization, then check actual public render and shortcut.

## Result

Candidate289b172d8975483b8ec38ee30e6808b7eb2ba963 independently PASS. Exact one-rule CSS change; build/opening-layout and independent3-size rendered/click/focus checks pass. Mobile footprint unchanged, desktop within0.672px, >=44px targets. Other authored Backstage retains gold styling. Durable evidence ../../perspectives/concert-quiet-backstage-20261016/. No paid calls; physical iOS unverified. Accepted and published with Task021 and022 on 17 October; publication history is recorded below.


## Historical publication attempt — 16 October 2026

Combined020+021+022 accepted runtime c0ca9f3, release attempt ccf39c5 on 16 October 2026. Vercel refused publication with api-deployments-free-per-day (more than 100; try again in 24 hours), no new deployment ID. Public assets independently verified unchanged from the previous release. Accepted code is pushed; local static UI preview 8822 is available, no live AI. Public verification remains pending after a successful future deployment; no automatic retry scheduled. See CURRENT_BUILD_STATE.md and outputs/perspectives/concert-authored-portraits-20261016/deployment-blocked.json.


## Published — 17 October 2026

Combined Tasks020–022 published from `94e8729555a7cc041a4b57c4bdfc489d6905097c`, with runtime identical to independently accepted `c0ca9f3fae3f6847ce562099b056c7ee8f4d5aa9`. Existing `ocanudas-7641/gamex-concert`; deployment `dpl_6piJsrXDHLqnGn7YMeWARaUEuVxq` is Production READY. Play https://gamex-concert.vercel.app/?v=emotional-scenes-20261016 . Immutable https://gamex-concert-d4oaoj0oi-ocanudas-7641.vercel.app . The previous daily-quota block is resolved.

All four prepared public checks PASS: exact asset hashes and non-inferential metadata, opening shortcut/navigation, full-screen authored portraits with answer-before-choices/skip/scroll/resize/reload, and teaser→Lia with the unchanged guarded start payload. Coordinator visually inspected the public mobile booking beat, Nora reply and Lia teaser. Browser paths use controlled API fixtures; no paid model calls. Physical iPhone/Safari, live-model quality and emotional impact remain unverified. Durable evidence: outputs/perspectives/concert-authored-portraits-20261016/deployment.json and adjacent public results/screenshots. No runtime changes, merge, billing changes or other-product changes in this publication pass.
