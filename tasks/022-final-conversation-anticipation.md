# Task022 — Anticipation before the final Lia conversation

## DESIGN

Oriol says the gateway to the final conversation feels like a routine screen. Make it an emotional invitation to the resolution, applying the new CREATIVE_CANON.md: warm and direct, dramatic when earned. Follow Task021 on codex/concert-encore-v05 after its independent QA; Exact accepted baseline is bce3fd8749588c74311eab41efad35beb4e31423; Task021 independent QA passed before this implementation. Existing final-conversation state/consent and outcomes remain authoritative. Reproduce the current hub CTA and brief with screenshots before editing.

Use the existing guarded Lia image as one immersive backdrop. Replace the briefing's stacked utilitarian panels with a focused teaser and one primary invitation. Hub CTA reads `Step into the conversation` with supporting line `Lia is by the curtain. What will you say?`. Keep existing readiness gate and goBrief handler. On the brief, use kicker `THE CROWD IS STILL CALLING`, heading `The next words are yours.`, and body `Lia is by the curtain. Nora won’t go back out. What would make this an encore they can both stand behind?`. Add the warm invitation `You don’t need the perfect words. Start with what you want Lia to understand.` Primary CTA stays clearly `Talk to Lia`, with existing busy text/disable/error handling. No second interstitial or extra tap, artificial countdown, forced pacing or added audio.

Keep functional guidance secondary but readable: own words, up to six turns, reading/thinking free, AI disclosure, nothing goes onstage without player cue. Preserve exact existing WHAT CAN CHANGE contents and all conditional delivered-offer / unagreed tour-promise / unavailable / error notices. They may be placed below the principal invitation in a quieter layout, but remain plainly accessible. Do not frame a delivered offer as Nora's acceptance. Do not imply a shared encore is required or guaranteed. Existing Backstage exit remains available.

## Bounded BUILD

One worker, presentation-only main.jsx and scoped style.css, short PRODUCTION_LOG, one focused teaser browser probe/runner registration and only old presentation assertions explicitly superseded by this CTA/layout. Preserve all action/state assertions. No engine/story/model/API/token/saves/drafts/audio/media/dependency changes. No paid calls, push, deployment or user preview 8810/storage changes. Coordinator owns canon/task/docs. Do not alter Task021 authored portraits/sequencing or Task020 quiet opening shortcut.

## Acceptance

1. Actual hub → teaser → Lia conversation works with a controlled start fixture; exact same prep events and request payload as baseline for the same route. Original readiness, busy guard, back navigation, errors/unavailable, retry behavior and preserved draft/agreement remain. No API call until explicit Talk to Lia; one click opens one request.
2. Distinct emotional hierarchy: one existing portrait, crowd kicker, headline, human invitation, clear Talk CTA. Review actual screenshots at390x844,390x480,320x568,844x390,1440x1000; natural face proportions, no horizontal overflow, readable copy/controls, >=44px targets, keyboard focus. Compact screens scroll rather than shrink. No time gate. Reduced motion stays complete.
3. WHAT CAN CHANGE, six-turn/AI/cue guidance and each existing conditional notice remain accurate/accessibly discoverable. Test no-offer, delivered professional offer, unresolved false promise and API-unavailable/error variants. Private love knowledge is not surfaced in teaser copy. No new facts or consent implied; player can still choose not to obtain a shared encore later.
4. Independent QA reviews exact bounded diff, runs build + focused teaser and relevant existing dialogue/authored-portrait/portrait/agreement suites. Both Task020+021 stay correct. No state/content/provider/assets altered outside the permitted gateway text/presentation. Evidence includes rendered screenshots and state checks. Do not claim tested emotional impact or real iOS from fixtures.

## Result

Independent QA PASS at c0ca9f3fae3f6847ce562099b056c7ee8f4d5aa9, clean before/after. Build and teaser, dialogue, authored-portrait, portrait, agreement-exit, encore and scenes passed. Independent archived-baseline comparison found identical prep/back/opened states and start payload, no premature POST and one guarded request. All five viewport renders, secondary guidance/notices, privacy/state and settled rotation pass. Desktop fresh and 390→1440→844→390 compact→1440 renders have one app/header/teaser/action/portrait; early screenshot artifact did not require runtime changes. Evidence /private/tmp/task022-independent-qa, durable outputs/perspectives/concert-emotional-teaser-20261016/independent-qa. No source edits or paid calls by QA; physical iPhone/Safari and human emotional response unverified.

Accepted and published with Task020+021 on 17 October. Public verification PASS; see the publication record below.


## Historical publication attempt — 16 October 2026

Combined020+021+022 accepted runtime c0ca9f3, release attempt ccf39c5 on 16 October 2026. Vercel refused publication with api-deployments-free-per-day (more than 100; try again in 24 hours), no new deployment ID. Public assets independently verified unchanged from the previous release. Accepted code is pushed; local static UI preview 8822 is available, no live AI. Public verification remains pending after a successful future deployment; no automatic retry scheduled. See CURRENT_BUILD_STATE.md and outputs/perspectives/concert-authored-portraits-20261016/deployment-blocked.json.


## Published — 17 October 2026

Combined Tasks020–022 published from `94e8729555a7cc041a4b57c4bdfc489d6905097c`, with runtime identical to independently accepted `c0ca9f3fae3f6847ce562099b056c7ee8f4d5aa9`. Existing `ocanudas-7641/gamex-concert`; deployment `dpl_6piJsrXDHLqnGn7YMeWARaUEuVxq` is Production READY. Play https://gamex-concert.vercel.app/?v=emotional-scenes-20261016 . Immutable https://gamex-concert-d4oaoj0oi-ocanudas-7641.vercel.app . The previous daily-quota block is resolved.

All four prepared public checks PASS: exact asset hashes and non-inferential metadata, opening shortcut/navigation, full-screen authored portraits with answer-before-choices/skip/scroll/resize/reload, and teaser→Lia with the unchanged guarded start payload. Coordinator visually inspected the public mobile booking beat, Nora reply and Lia teaser. Browser paths use controlled API fixtures; no paid model calls. Physical iPhone/Safari, live-model quality and emotional impact remain unverified. Durable evidence: outputs/perspectives/concert-authored-portraits-20261016/deployment.json and adjacent public results/screenshots. No runtime changes, merge, billing changes or other-product changes in this publication pass.
