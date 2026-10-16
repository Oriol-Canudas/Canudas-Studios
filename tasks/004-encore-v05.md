# 004 — Rebuild Concert around the encore

## DESIGN — implementation brief, 15 October 2026
User asks to rebuild the app and define how to operate. Narrative source: ../perspectives/experience-design/concert-design-v05/SCRIPT_REVIEW.md plus subsequent explicit user corrections incorporated there. Do not use v03/v04 or the current live story as narrative authority.

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
