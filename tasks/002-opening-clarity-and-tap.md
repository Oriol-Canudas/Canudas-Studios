# 002 — Clear two-song choice and tap-to-advance introduction

## DESIGN — frozen 2026-10-15

Baseline: `cbf733ba5541404b106270318f9e9dfb3bad6d3d`, clean branch `codex/concert-immersion-english`.
User requests: clarify that the alternatives are two different songs, and allow tapping the narrative scene to advance.
Benefit: understand the actual performance trade-off and control reading pace naturally.

Scope: Concert opening interaction and consistent two-song terminology throughout the case. Worker allowed files: `products/concert/src/story.mjs`, `products/concert/src/main.jsx`, `products/concert/src/style.css` only if a subtle tap hint is needed, `products/concert/qa/opening.cjs`, `products/concert/qa/run-local.cjs` to register that offline suite, `products/concert/PRODUCTION_LOG.md`. Additional allowed files after user steering: `products/concert/server/lia.mjs` for terminology instructions only; existing `products/concert/qa/*.cjs` and `qa/api-cases.mjs` for literal selector/copy updates only where changed wording requires them. No other products, engine, API/backend logic, model/schema/classification changes, dependencies, music or save schema changes.
Coordinator owns this task record and CURRENT_BUILD_STATE. Worker must not edit those.

Baseline reproduction: built static preview at 127.0.0.1:8810; paused the opening and clicked `.opening-caption`. Before and after text were identical. Next control did advance. `/tmp/concert-opening-baseline.json` records it. Current wording contrasts a new solo song and best-known shared song but does not explicitly say two different songs; the user's comprehension feedback is the evidence for copy clarity, not an automated judgment.

Acceptance:
1. Bruno's English opening line explicitly says there are two different songs, names the new Lia solo song versus their shared duet song, and retains one-slot constraint. Suggested wording: “We have time for one of two different songs: Lia’s brand-new solo song, or the song you two wrote together. We can’t fit both.” No new story facts or song titles.
2. Throughout authored dialogue, questions, notes, programme summaries, suggestions and endings, use clear references to Lia’s new solo song versus the song Lia and Nora wrote together. Avoid unexplained player-facing “single”. AI prompt terminology must request the same distinction while preserving all interpretation/consent rules and allowing users to say “single”. Existing saved conversation wording is historical; do not rewrite real past AI dialogue or discard progress.
3. A single tap/click on the non-interactive opening scene advances exactly one beat, including when paused. The last beat transitions to the backstage hub.
4. Pause/Resume, Previous, Next and Go backstage each perform only their own action; bubbling never causes a second advance. Top-bar notes and sound controls do not advance the scene.
5. Automatic reading-time progression remains; manual advancement cancels the previous beat timer rather than skipping the next beat early. Reduced-motion preference is respected. Existing Next remains keyboard-operable; text selection must not inadvertently advance.
6. No preparation facts, consent, agreements or drafts change when stepping through the intro. No ending-screen tap changes in this task.
7. Mobile 390x844 and compact 390x480 controls remain reachable without horizontal overflow; existing offline QA and Node tests pass.

No paid calls. Worker does not deploy or push. QA is a separate sequential agent, read-only for product/test files. Publication after independent PASS is authorized by the user's ongoing request to update the live prototype, limited to existing gamex-concert; coordinator performs and verifies it.

## BUILD
Worker `opening_build` delivered candidate `6441d1d8ca27aacf94ab71e5962ae5e6975f29bd`.
Reported 25 Node tests, production build and five offline browser suites PASS. Changed only allowed UI/story, terminology-only prompt, QA selector/suite/runner and production log files. Evidence: ignored `products/concert/qa/opening-results.json` and screenshots. No push/deployment/paid calls. Worker report is not independent acceptance.


## QA — PASS
Independent agent `opening_qa` verified candidate `6441d1d8ca27aacf94ab71e5962ae5e6975f29bd`. All seven frozen criteria PASS: explicit two songs and consistent terminology; historic saved dialogue/draft preserved; one tap per beat and last tap to hub; controls isolated; timer reset/automatic progression/reduced motion/selection/drag; unchanged preparation/negotiation/consent/draft; mobile 390x844 and 390x480 including long Bruno caption.

Independently archived baseline and reproduced missing tap behavior. 25/25 Node tests, build and all five offline browser suites PASS. Evidence: `/tmp/concert-qa-baseline-002.json`, `/tmp/concert-independent-qa-002-extra.json`, `/tmp/concert-qa-bruno-390x480.png`, ignored `products/concert/qa/opening-results.json` and mobile screenshots. Coordinator also inspected both mobile opening screenshots. No product/test/dependency changes during QA; documentation-only coordinator edits were disclosed.

Limits: controlled Chromium fixtures, no live-model calls or physical iOS checks. Existing real AI transcript remains historical. Prompt requests clearer terminology; live adherence was not tested.

## Publication
Published `e2da375` (documentation plus verified product6441d1d) to existing `gamex-concert`. Deployment `dpl_BjuL3p4mZeaBy7c2uTgrtBwq6HRi`, production READY, aliased https://gamex-concert.vercel.app; deployment URL https://gamex-concert-ltoi56xx3-ocanudas-7641.vercel.app.

Published controlled `qa/opening.cjs`: PASS. Exact user-reported Lia line and cost question verified at390x844 with API intercepted: PASS; `/tmp/concert-published-002.json` and screenshot `/tmp/concert-published-lia-002.png`. No paid calls; no other-product changes. Existing saved progress/history preserved; replaying the whole opening requires a voluntary restart.

User steering: screenshot Lia L0 and its cost question showed “this single” after the opening distinguished two songs. User requests consistent references throughout, not only a clearer first line. This is an authorized copy-scope expansion; frozen mechanical invariants remain unchanged.
