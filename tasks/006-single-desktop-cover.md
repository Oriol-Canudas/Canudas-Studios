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

BUILD candidate: `8d37bc3bf7988b4d4eac83873799c44f0c3f9539`. Four permitted files changed: desktop cover-only CSS, focused browser check, runner registration and production log. One cover column, decorative aside hidden on cover, bounded520px copy/424px CTA and readability gradient. Existing CSS unchanged apart from appended min-width901 cover rules.

**Independent QA PASS** on all four criteria at the exact candidate. Different QA agent independently ran `QA_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run qa:local -- cover browser opening dialogue`, exit0: production build and four suites passed, including11 dialogue journeys. Actual desktop906×1058/1440×1000 and mobile390×844/390×480 screenshots personally inspected. One image/title, no blank column or horizontal overflow, short-mobile CTA reachable through vertical scroll. Settled mobile geometry matches baseline exactly: x1,width388,height784. Four actual Enter→opening→hub→Nora paths pass and restore desktop aside outside cover; zero API POSTs.

Evidence: `/tmp/concert-cover-independent-qa/independent-qa.json`, `cover-906x1058.png`, `cover-1440x1000.png`, `cover-390x844.png`, `cover-390x480-cta.png`. Parent reproduced baseline and personally inspected the repaired906×1058 cover, checked actual file diff and clean tree. No tracked QA edits; candidate/source unchanged. Application/story/state/assets/dependencies unchanged. Final recording commit only updates this task/current-state docs.

Local static preview http://127.0.0.1:8810/?v=cover-006 serves rebuilt candidate dist; refresh to see the cover repair. Public production unchanged. No paid calls, push, deployment or other-product changes. Limits: controlled Chromium evidence, no physical iOS test.
