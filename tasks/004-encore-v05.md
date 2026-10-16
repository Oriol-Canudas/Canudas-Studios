# 004 — Rebuild Concert around the encore

## DESIGN — implementation brief, 15 October 2026
User asks to rebuild the app and define how to operate. Narrative source: tasks/reference/concert-v05/SCRIPT_REVIEW.md (versioned snapshot of the reviewed ../perspectives/experience-design/concert-design-v05/SCRIPT_REVIEW.md). It includes the user's latest role and encore corrections. Do not use v03/v04 or the current live story as narrative authority.

Checkout: outputs/concert-build, branch codex/concert-immersion-english, HEAD f397b4a (unpublished hierarchy candidate). Stable published product is e2da375 / deployment dpl_BjuL3p4mZeaBy7c2uTgrtBwq6HRi, recorded by documentation commit dcdd0e8. Untracked task003 is coordinator-owned. Keep all existing work; pending hierarchy candidate requires QA as part of new final candidate, not an assumed PASS.

Player benefit / core proof:
The main set ends; crowd calls the band back; Lia and Nora arrive backstage together. Nora then sees confirmation that next tour excludes her and refuses the customary encore. Lia fronts the band; Nora co-writes and sings substantial repertoire, a core creative member. Band can continue without her, but loss is significant. Authored discovery and authorized relay make player want a bounded AI negotiation with Lia; agreed terms visibly affect Nora and the encore.

Recommended operation: preserve existing app/media/audio/recovery, implement on an isolated branch, one worker then independent QA. First playable checkpoint: complete authored opening + Nora-first/Lia-first + at least one visibly received relay and context-aware return. Then align AI/state/confirmations/endings in the SAME experience. No cosmetic-only slice presented as testing the AI hypothesis.

Worker scope when BUILD is dispatched: products/concert/src/, server/lia.mjs, tests/, qa/ and relevant README/PRODUCTION_LOG. API handler only if a verified state/compatibility need requires it; no silent infrastructure expansion. Root owns task/current-state/publication documentation. No other products, synced sources, new dependencies/services, database, media generation or paid inference. Keep credential handling and request recovery intact. Worker commits only scoped files; never pushes/deploys.

Acceptance frozen for final candidate:
1. One shared encore song; no competing solo premiere, broadcast deadline, second extra encore, equal-duo assumption or minor-backup-singer premise in playable text/context/ends.
2. Completed main set → both backstage → notification explicitly excludes Nora → refusal. Crowd/crew creates pressure without reading-speed punishment.
3. Both first-choice routes work; adaptive options, meaningful statements/relays/repairs, context-aware return, no stale monologue appended to old reply. Speaker/action/history/choice hierarchy clearly distinguished.
4. Nora's love is optional; professional endings reachable without discovering/revealing it. Player discovery, authorization and actual delivery distinct. One authorized professional relay produces a specific Lia reaction. Lia does not receive confidential data through notes or global context.
5. AI objective concerns encore/acknowledgment/public wording. Tour cannot be rewritten; romantic relationship cannot be exchanged for performance. No invented facts or Nora consent. Preserve natural paraphrases and complete counteroffers; terms no longer validate a lost premiere.
6. Same-version consent for shared encore; new material conditions invalidate old acceptances. Rejection, overpromise, withdrawal, confidentiality breach and exhausted turns lead to explicit revision/fallback, never forced performance or concealed AI fallback. Follow v05's stated authored rules; flag material conflict before changing intent.
7. Four coherent outcomes: encore with public acknowledgment, private acknowledgment+joint statement, band returns without Nora, no encore. Execution is separate from agreement. Causal reveal reflects actual session events.
8. Existing two-song saves retained/exportable and explicitly distinguished; never silently reinterpreted as new past. New story state/version isolated. Interrupted-send recovery, retry identity, newer draft, restart safety retained.
9. Reuse media/music; no generated extra assets needed for first proof. English throughout. Mobile390x844/390x480 and desktop: controls readable/reachable; no overflow; portraits/cues unambiguous; opt-in soundtrack preserved.
10. Meaningful deterministic tests and controlled browser journeys cover public/professional, private/relay, without-Nora, promise repair, love breach and no-agreement; legacy tests updated for legitimately changed rules, recovery invariants not weakened. Different QA agent independently checks actual diff and mobile rendered path. Fixture checks not claimed as real-model/iOS/enjoyment evidence.

Delivery:
- First useful checkpoint is playable authored flow, not new design planning.
- Final candidate+worker handoff → independent QA → controlled preview mobile journey. Existing production remains stable until the new complete candidate is accepted/tested for publication.
- Live AI semantic test is a separately identified paid-inference step; no such calls silently made from fixtures. Publication uses existing isolated gamex-concert project only; record IDs and actual verification.

Status: BUILD authorized by Oriol on16 October2026 ("let's do it. ja som a codex"). Isolated branch codex/concert-encore-v05 created from f397b4a. One implementation worker then different QA agent. Existing production held stable; preview publication permitted after independent QA under ongoing concert web-app authorization. No paid inference calls authorized.

## Execution
BUILD dispatched16 October. Root owns task003/task004 and CURRENT_BUILD_STATE/VERIFICATION; worker owns bounded product files only. All provisional v05 implementation details use the recommended script defaults; do not silently change meaningful behavior. Keep technical solo/public/private IDs if preserving schema avoids churn, but change their semantics and all visible text to new story.

## Coordinator checkpoint16 October
Baseline archived at /tmp/concert-encore-baseline-20261016/baseline.json. Production inspected via Vercel: remains dpl_BjuL3p4mZeaBy7c2uTgrtBwq6HRi READY before publication. Root personally played static mobile booking→Nora professional permission→delivery→Lia specific reaction, without love discovery: PASS (/tmp/concert-encore-checkpoint.json and screenshots). Long toast overlap identified and worker shortened it while retaining exact inline delivery receipts. Root also identified and worker corrected missing forward-node continuation and old cached client starts. These are scoped flow/compatibility corrections, not changed acceptance. Catalogue wording clarified from entire set to substantial repertoire in source reference.

## BUILD round1
Worker encore_build candidate5170abb84ede83f4c8e062c97eb40d369f2109a4. Reports36 Node tests/build/seven offline browser suites includingeight encore journeys PASS. No paid calls/push/deploy. Worker evidence /tmp/concert-encore-build-20261016/worker-validation.json; historical live files in that folder are NOT current evidence.

## Independent QA round1 — FAIL
Agent encore_qa independently reran36 tests/build/seven suites PASS, inspected mobile/desktop, and added adversarial probes. Criteria4 and6 FAIL:
- Lia-only visit:lia→why→eva_lia notes manufacture Nora's account despite empty Nora history.
- Existing accepted public/version1+confirmed Nora1, model explicit refusal accepted:false plus terms-supported audit preserves old acceptance/version and permits execution. Grounded offer terms do not equal current artist willingness.
Evidence /tmp/concert-independent-qa-20261016/{probes.cjs,probe-results.json,lia-only-nora-note.png,refusal-still-cue.png}. All other criteria pass within controlled fixture/source scope; no live-model/iOS/enjoyment claim. Product/test source unchanged during QA.
Returned to same worker for a bounded fix: source-aware notes (including related shared-fact provenance), actor-willingness withdrawal separate from grounded terms, provider+browser regression, and minor legacy-button styling. Acceptance unchanged. Independent QA must repeat on newcandidate before publication.

## BUILD round2
Candidate24f2f22b19b83bbd237a7e8c3b8cf918e9006810. Worker reports43 Node tests/build/seven browser suites PASS, including11 encore journeys. Explicit model and audit willingness separate from grounded terms; withdrawals revoke accepted version and Nora confirmation; unchanged agreed close preserves consent; withdrawn without-Nora package cannot bypass refusal via authored fallback. Notes now source-aware; legacy buttons styled with44px targets. Evidence /tmp/concert-encore-repair-20261016/. Independent re-QA dispatched; publication remains pending.

## Independent QA round2 — PASS
Different agent encore_qa independently verified24f2f22b19b83bbd237a7e8c3b8cf918e9006810 against all10 frozen criteria.43 Node tests/build/seven browser suites including11 encore journeys PASS; original adversarial failures resolved, explicit continuing close preserved, withdrawals revoke stale consent/version, without-Nora fallback cannot bypass refusal, source-specific discovery and provider privacy verified. Mobile390x480/390x844 and desktop1440x1000 inspected. Evidence /tmp/concert-independent-reqa-20261016/{probes.mjs,probe-results.json,browser.cjs,browser-results.json} and screenshots; fresh ignored qa/ outputs. Source/tests/dependencies unchanged during QA. No live provider calls or physical iOS/enjoyment proof. Coordinator inspected repaired mobile notes and withdrawal review; earlier personally played booking→professional relay→specific Lia response. Accepted for existing-project publication under user's ongoing authorization.
