# 006 — Remove duplicated desktop cover

## DESIGN

User screenshot shows the same title and cover artwork twice: decorative desktop aside plus the playable cover. Confirmed locally at906×1058 on baseline `39335d60a004cc4322e8e94b463773ae42ff08fa`, branch `codex/concert-encore-v05`, clean checkout. Evidence: `/tmp/concert-cover-duplication-baseline.{json,png}`; both panels visible with identical image sources and repeated title. Baseline mobile390×844 geometry is recorded in JSON.

Fix: one cohesive desktop cover composition with one image/title and a readable Enter backstage CTA. Scope only cover layout. Preserve title/content/artwork, mobile cover, desktop non-cover layouts, story/state/consent/drafts/audio and existing authored changes. No image generation/integration, dependency/backend/other-product changes, paid calls, push or deployment.

Acceptance:
1. At906×1058 and1440×1000 the cover shows one hero/title; duplicate decorative aside hidden/omitted only on cover. One coherent composition, no blank second grid column or stretched full-width text/CTA; readable over artwork.
2. Cover CTA reachable, no horizontal overflow at906desktop,1440desktop,390×844 and390×480; short viewports may scroll vertically. Mobile geometry/appearance unchanged where comparable.
3. Enter backstage → opening → backstage hub → first authored conversation still works, and desktop non-cover aside/layout remains available. No story, dialogue, state, saves or assets change.
4. Worker hands off scoped candidate; different QA independently checks exact commit and inspects desktop/mobile renders with API fixtures. Build alone is insufficient. No new state unit tests for this CSS repair; focused browser visual/regression check is sufficient.

## BUILD bounded scope

Allowed only `products/concert/src/style.css`, `products/concert/qa/cover.cjs` (new), `products/concert/qa/run-local.cjs` (register focused check), and `products/concert/PRODUCTION_LOG.md`. Prefer cover-scoped CSS over changing the app. Root owns task/current-state docs. Worker commits scoped files, no push/deploy; QA cannot edit code/tests. Sequential worker then different QA under root AGENTS and gamex-qa skill.

Pending BUILD and independent QA. Existing static local preview8810 is running; offline runner8796. No paid model calls.
