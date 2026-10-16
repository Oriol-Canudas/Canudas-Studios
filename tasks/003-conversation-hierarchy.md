# 003 — Conversation hierarchy

## DESIGN — frozen 2026-10-15
Baseline dcdd0e8, clean codex/concert-immersion-english. User screenshot shows player's prior sentence, character answer, and next node line as three unlabeled text treatments; next line looks like internal thought. Live baseline reproduced at /tmp/concert-hierarchy-baseline.json and .png.

Goal: make who speaks and what is selectable immediately clear without changing conversation content or game logic.
Concept: previous player intervention labeled `You said`; character answer plus continued node line in ONE character-labeled speech block (two paragraphs, no quotation/insight bar suggesting inner thought). Initial character line likewise labeled. Response options visibly grouped under `What do you say?` (remain actions, not existing speech). Earlier transcript collapsed and clearly historical. Physical cues/narration muted italic and private goal explicitly private in AI view; existing AI speaker labels retained. Bruno context is his spoken dialogue, not narrator/inner thought. No new internal thoughts or story facts. Avoid dense tutorial copy.

Allowed worker files: products/concert/src/main.jsx, src/style.css; qa/hierarchy.cjs new; qa/run-local.cjs registration; existing qa/*.cjs literal selectors ONLY if affected; PRODUCTION_LOG.md. No story/engine/server/API/state/schema/audio/dependencies/other-product changes. Coordinator owns task and current documentation.

Acceptance:
1. Exact promise path from screenshot shows labeled prior player speech and a single Nora-labeled block containing BOTH her reply and current continuation, visually same speaker. No ambiguous follow-line quote bar.
2. Initial lines and subsequent conversations with Nora, Lia, Bruno use same speaker hierarchy; Bruno context clearly belongs to Bruno. All original words and choices preserved, no inferred private thoughts.
3. Choices distinct from prior speech; selecting still produces exactly same state/history/events/available choices. Prior transcript collapsed by default and clearly separated; expanding does not alter state.
4. AI retains readable speaker labels, separates physical cues from speech and labels goal private, without changing composer/recovery/agreement logic.
5. Mobile390x844/390x480 and desktop readable, no horizontal overflow, choices reachable by scroll; small labels readable >=11px. Portrait layout preserved.
6. 25 Node tests, build, existing five offline suites and new controlled hierarchy suite pass. No paid calls.

BUILD one worker, then independent QA per root AGENTS and gamex-qa skill. Worker commits allowed files only; QA read-only source/tests. Coordinator authorized to publish existing Concert after PASS as continuation of live prototype fixes. Verify published path with controlled fixtures. Physical iOS/real-model semantics out of scope.

## BUILD — completed, unpublished
Worker hierarchy_build candidate f397b4a7ec929259b6a98488d8b9b9f8649430f5. You said/character speech/choices separated, character continuation grouped, history collapsed per turn, Bruno speech labeled, AI cues/private goal distinguished. Worker reports25 tests/build/six offline suites PASS, screenshots inspected. Evidence ignored qa/hierarchy-results.json and hierarchy-*.png. No story/state/server changes, no push/deploy/paid calls. Independent QA still pending; do not treat worker report as acceptance.
## QA
Deferred while user is reviewing the changed narrative premise. No publication until the final scoped candidate receives independent QA. Current live remains task002.

## User steering — narrative review before publication
Second screenshot C1 own→hub→revisit Lia combines historic response with L0 initial monologue. Inspection confirms `entryNode` selects L0 while root UI displays last history beside it. Hierarchy task preserves mechanics; revisit continuity needs a separate scoped change. Current L0 text's `If I don’t go on` also obscures the actual solo-vs-duet decision. Original design01_RULES F07 establishes concert overrun, but original plan to perform BOTH songs is not explicitly authored. Root proposes making both planned numbers explicit, overrun causing lost slot, then Nora's solo-tour discovery causing withdrawal. This is a proposal, not approved new canon. Keep publication on hold while narrative is discussed; no story/state rewrite authorized by task003.

Proposed Lia line for discussion: “My new solo song was meant to be my next chapter. Our duet was meant to close tonight. Now we only have time for one. If I choose the premiere while Nora walks away, it looks like everything we built was just a stepping stone. But if we sing our duet, I lose the launch I’ve spent months preparing.” Must revisit broader script/knowledge/AI context/choices/endings together before implementation, not patch this one line alone.

## Superseding narrative direction — user15 October
Oriol rejects competing songs: one shared signature closing song; Nora sees solo-tour confirmation on Lia phone. Nora is in love, Lia seeing another girl; Nora grows distant/harsh, Lia misreads that as loss of belief in project. Full script review requested, not implementation. Review artifact: ../perspectives/experience-design/concert-design-v04/SCRIPT_REVIEW.md. Earlier two-song proposal above is historical and not current design. UI candidate remains held and reusable; old story engine still unchanged.
