# 007 — Remove promotional sidebar from story screens

## DESIGN

User follow-up screenshot shows task006 fixed only cover, while opening still pairs an old cover/title advertisement with the actual scene. Reproduced at970×1067: opening beat4 “We were going to.” and promotional desktop aside both visible. Baseline `e03a9d563314b1eb1fb7a4891390fd1d08de02d4`, clean branch `codex/concert-encore-v05`. Evidence `/tmp/concert-intro-sidebar-baseline.{json,png}`. Task006 narrow cover verdict remains historical; its requirement that the aside return on all non-cover screens is superseded for non-conversation scenes by this user correction.

Fix the source of the problem across the authored story presentation: no persistent cover/title marketing panel beside opening, hub, brief, review, ending or reveal. Use one coherent stage with readable bounded text/controls; cinematic opening/ending can be wider than reading screens. Keep existing task006 single cover. Retain functional character companion portraits for dialogue/AI, not promotional copy. On desktop show each active character portrait once: the companion portrait can remain while suppressing its repeated in-stage portrait; retain the in-stage name/role. Mobile keeps its in-stage portrait unchanged.

Acceptance:
1. At970×1067 and1440×1000 opening is one backstage scene with clear speaker/caption and reachable pause/previous/next/skip. No promotional cover/title panel or unused grid column. Check entire intro, including long booking beat and Lia beat4.
2. Hub, brief, review, ending and reveal likewise show no promotional aside or repeated artwork/title; readable text/control width and no horizontal overflow. Sample actual or explicitly fixture-backed scene transitions, including an agreed encore reaching performance and reveal.
3. Single cover remains correct; mobile390×844/390×480 geometry/behaviour unchanged. Functional desktop character companion portraits remain in dialogue and AI, without repeating the same portrait in the stage; name/role remain clear. No story/state/consent/draft/save/audio/media/dependency changes; no paid calls, push, deployment or other products.
4. Worker scoped commit then different independent QA checks exact candidate diff and rendered desktop/mobile flow. Build-only proof is insufficient. Existing cover/opening/dialogue and agreement/encore regressions stay meaningful. Update obsolete task006 QA expectations about aside returning during opening/hub; still verify its return for actual character conversations.

## BUILD bounded scope

Allowed only `products/concert/src/style.css`, new `products/concert/qa/scenes.cjs`, `products/concert/qa/cover.cjs`, `products/concert/qa/run-local.cjs` and `products/concert/PRODUCTION_LOG.md`. Prefer desktop screen-scoped CSS. Do not edit main.jsx/story/engine/server/API/assets/dependencies or other tests. Root owns task/current-state docs. No new state unit tests for this layout repair.

One worker then independent QA sequentially under AGENTS/gamex-qa. Local static8810 serves dist; runner8796. Build and focused cover/scenes/opening/dialogue/agreement/encore checks appropriate; no need unrelated repetitions unless a new concern appears. Pending BUILD/QA.
