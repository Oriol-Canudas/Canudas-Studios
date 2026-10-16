# Task020 — Quiet Backstage shortcut during the opening

## DESIGN

Baseline clean94726594d3f049796218281b100f852e47bf0fe0, branch codex/concert-encore-v05. User asks to make opening Go backstage grey and very unobtrusive: it is secondary while watching the story. Only the opening shortcut changes; important Backstage buttons in authored dialogue/brief stay gold.

## BUILD and acceptance

One bounded worker: change only the existing opening-specific CSS rule in products/concert/src/style.css and add a short PRODUCTION_LOG note. Remove the gold fill/border/text and bold emphasis; use muted grey text and a transparent or very quiet neutral treatment, visually subordinate to Pause/Previous/Next. Preserve current footprint, >=44px target, focus accessibility, label, click behavior and every other screen. No new UI, markup, tests, dependencies, story, state, audio or layout changes. Before editing capture the supplied booking beat in isolated static preview; after editing inspect mobile390x844, compact390x480 and desktop1440x1000. Build and existing opening-layout checks suffice; no broader regression campaign for a colour-only change. No paid calls, user8810/storage changes, push or deployment by worker.

Separate non-editing QA follows repo skill: inspect exact CSS diff and baseline/candidate rendered hierarchy, confirm opening click still reaches hub and dialogue Backstage remains gold. Existing target dimensions/reading/layout remain unchanged. Temporary probes/evidence only, no new permanent tests. Coordinator may publish the accepted change to existing gamex-concert under continuing release authorization, then check actual public render and shortcut.

## Result

Candidate289b172d8975483b8ec38ee30e6808b7eb2ba963 independently PASS. Exact one-rule CSS change; build/opening-layout and independent3-size rendered/click/focus checks pass. Mobile footprint unchanged, desktop within0.672px, >=44px targets. Other authored Backstage retains gold styling. Durable evidence ../../perspectives/concert-quiet-backstage-20261016/. No paid calls; physical iOS unverified. Awaiting combined publication with newly authorized task021 full-portrait authored dialogue.
