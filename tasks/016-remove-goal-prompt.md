# Task 016 — Remove the optional goal prompt before Lia

## DESIGN

User feedback: the optional “set your goal” text box before the AI talk is confusing and should be removed. Larger negotiation, mood-transition and ending changes are being explored separately; they are not authorized implementation scope here.

Clean baseline: `1e89efe8a2db5e31b04c1527bc4a18f78faa0d5d`, branch `codex/concert-encore-v05`. Benefit: enter Lia's conversation with the existing concrete scene context, without an extra task to formulate a private goal.

## Bounded BUILD

One worker may edit `products/concert/src/main.jsx` only to remove the briefing's optional goal label/input, and append the result to `products/concert/PRODUCTION_LOG.md`. Do not replace it with a new form, choices, or extra onboarding. Preserve the existing goal storage and history for older sessions; no save migration or data deletion. All other story, privacy, agreements, Nora consent, turns, speech, drafts/retry, portrait UI and API behavior stay unchanged. No new tests, dependency, media, service, push or deploy. Use controlled fixtures only.

## Acceptance

1. Reproduce the baseline briefing with visible optional goal field and retain a screenshot or reproducible fixture command.
2. Candidate briefing at 390×844 and 390×480 contains no goal label/input; existing contextual text, Backstage return, errors and primary Talk to Lia remain readable and usable with no overflow.
3. From an existing saved session with a nonempty goal and draft, opening the briefing, entering Lia, opening history and reloading preserves both values. The old goal remains accessible in history. No new API field or story event is introduced. Fresh sessions enter with no goal required.
4. Existing local scenes and portrait suites and production build pass. Actual diff is limited to removal and production log. Independent non-editing QA verifies these criteria with its own browser checks and screenshots; no paid API call.

## Handoff / QA

BUILD candidate `93aeb1399faea3fdcfca91eefb1b0eeae8cf390a`; clean. Removed only briefing goal label/input in main.jsx and appended production log. Existing stored goal/history preserved. Worker reproduced baseline and passed build, scenes, portrait and controlled fresh/legacy/error/reload probes.

Independent non-editing QA **PASS — all four criteria**, exact clean candidate. Independently built/reproduced baseline at 390×844 and 390×480, checked fresh and old-goal/draft flows through briefing, error → Backstage → retry, AI history and reload. API remains action/build/events. Build/scenes/portrait PASS; screenshots inspected. Parent inspected actual diff and candidate short-mobile screenshot. Durable evidence: outer `outputs/perspectives/concert-goal-removal-20261016/independent-qa/`. No paid calls; physical iPhone and live model not evaluated. Publication pending coordinator verification.
