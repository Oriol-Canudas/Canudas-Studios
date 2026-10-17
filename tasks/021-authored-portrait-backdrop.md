# Task021 — Full-screen character backdrop in authored conversations

## DESIGN

User now explicitly requests implementation of the previously draft-only full-screen portrait/translucent treatment for the shown Nora authored dialogue and equivalent character screens. Baseline clean289b172d8975483b8ec38ee30e6808b7eb2ba963 on codex/concert-encore-v05, including accepted task020 quiet opening shortcut. Player benefit: stay with the character while reading and choosing; no separate portrait panel that scrolls away before the answer.

Use one continuous aspect-preserving existing character portrait covering the available app viewport behind the menus, identity, speech and response choices. Preserve a recognizable face, natural proportions and visible image through the panels. Keep text itself opaque and readable; translucent dark/cool speech and subtly different plum choices preserve attribution/interaction hierarchy. Compact overlaid top navigation/identity replaces the bulky stacked image/name blocks. Dialogue scrolls over the stable backdrop; mobile and desktop both have one coherent portrait scene, no second sidebar image. No forced presentation delay or portrait reveal animation. Keep actual existing Nora image-state selection.

## Bounded BUILD

One implementation worker. Allowed presentation-only src/main.jsx, scoped src/style.css, src/reply-reveal.jsx only if genuinely needed for the user sequencing amendment, one focused authored portrait browser suite plus runner registration, necessary existing presentation-selector/geometry assertions in QA, and short PRODUCTION_LOG note. No story/copy, engine, save/version, request/recovery, negotiation/consent, audio/recorder, dependencies, new assets or other-product changes. Preserve existing typewriter reveal and skip, all choices, prior-player echo, notes, history and Backstage actions. User approved full-portrait authored layout here; agreement/payoff/mood-transition proposals remain out of scope. No paid calls, push/deploy by worker or user 8810/storage changes. Coordinator owns the explicit user design-rule addition to repo AGENTS.md and this brief.

## Acceptance

1. Capture baseline Nora supplied scene and Lia/Bruno; candidate has exactly one visible portrait covering the whole app viewport (within1px), aspect-preserving, behind headers/content, stable while scrolling. All3 cast recognizable; Nora existing conditional listening image preserved. No opaque full-width panel hides the portrait. Inspect real renders at390x844,390x480,320x568,844x390 and1440x1000, including long/continuation/history states. Text/choice surfaces can be dark enough for readability while visibly translucent; letters are fully opaque.
2. Speech, You said, cues and selectable questions remain distinct and readable, with unchanged exact copy/attribution/options; body >=18px on normal mobile, >=16px on compact; secondary labels >=11px. Preserve effective text contrast via suitable scrim/panels, focus indicators and >=44px control targets. No horizontal overflow, clipped face in ordinary portrait view, inaccessible content or controls. Scroll on compact screens instead of compressing text; dynamic viewport/rotation reflows without changing story state.
3. Backstage/return, choices (including more than one step), notes, volume, restart overlay and earlier conversation work. Changing cast updates the image. Saved prep/discoveries/communicated knowledge/consent/drafts survive presentation, navigation, modal/resize and reload. No new actions or automatic decisions. One relevant real authored path to briefing remains playable with controlled API only.
4. Character typewriter stays progressive with stable geometry and skip; reduced motion/reload/history are complete. Original AI translucent layout, opening (including quiet Go backstage), hub, brief/review/ending stay unchanged by scoped selectors. No new provider calls or timers.
5. Build + focused authored-portrait suite and existing hierarchy/dialogue/reply-reveal/scenes/portrait suites PASS. Update only assertions that genuinely encode superseded authored portrait layout, never weaken flow/state checks. Separate non-editing QA verifies exact candidate, baseline, actual screenshots, selectors/scope and criteria. Chromium emulation does not establish physical iPhone/Safari.

## Explicit user amendment — sequential attention

Oriol asks that the answer appears first with typewriting, followed by the next questions, and makes purposeful scene sequencing a standing design rule. Repo AGENTS.md now records that rule. In these authored conversations, keep the prior-player echo subordinate context; show cue and speech first. Hide the follow-up question label/choice group while a fresh reply reveals; reveal the whole group after natural completion or immediately on Tap/Show full reply. Keep layout stable, navigation/notes/Backstage accessible and state independent. Reduced motion, reload and previously heard content show the answer and choices immediately, without extra artificial waits.

Acceptance6: during a fresh normal-motion authored reply, follow-up choices are not visible, clickable or keyboard/accessibility-focusable; upon completion/skip they are visible and operate with the same exact available options and reducer results. Selection of an unlocked choice starts the next answer/sequence; no obsolete callback unlocks the next reply early. Stable geometry through reveal and skip, no double action, navigation can interrupt safely, reduced-motion/restored paths remain immediate. Existing task019 immediate-choice expectation is explicitly superseded here only for authored follow-up choices; update that probe to await completion/skip, preserving all state assertions. AI Talk/type/review timing is unchanged. Do not add scene-wide autoplay or unnecessary staging to unrelated screens; ask Oriol when future content leaves the sequence ambiguous.

## Result

Independent QA PASS at bce3fd8749588c74311eab41efad35beb4e31423. Build and authored-portrait, hierarchy, dialogue, reply-reveal, scenes and portrait suites passed. Actual Nora confession/permission/history, all cast/five sizes, state/privacy/draft/reload, natural completion/skip and explicit prior-reply deadline probe passed. No defects or source edits during QA. Evidence: /private/tmp/task021-independent-qa and durable outputs/perspectives/concert-authored-portraits-20261016/independent-qa. Physical iPhone/Safari and human emotional impact remain unverified.

Accepted and published with Task022 on 17 October; the earlier blocked attempt and successful publication are recorded below.


## Historical publication attempt — 16 October 2026

Combined020+021+022 accepted runtime c0ca9f3, release attempt ccf39c5 on 16 October 2026. Vercel refused publication with api-deployments-free-per-day (more than 100; try again in 24 hours), no new deployment ID. Public assets independently verified unchanged from the previous release. Accepted code is pushed; local static UI preview 8822 is available, no live AI. Public verification remains pending after a successful future deployment; no automatic retry scheduled. See CURRENT_BUILD_STATE.md and outputs/perspectives/concert-authored-portraits-20261016/deployment-blocked.json.


## Published — 17 October 2026

Combined Tasks020–022 published from `94e8729555a7cc041a4b57c4bdfc489d6905097c`, with runtime identical to independently accepted `c0ca9f3fae3f6847ce562099b056c7ee8f4d5aa9`. Existing `ocanudas-7641/gamex-concert`; deployment `dpl_6piJsrXDHLqnGn7YMeWARaUEuVxq` is Production READY. Play https://gamex-concert.vercel.app/?v=emotional-scenes-20261016 . Immutable https://gamex-concert-d4oaoj0oi-ocanudas-7641.vercel.app . The previous daily-quota block is resolved.

All four prepared public checks PASS: exact asset hashes and non-inferential metadata, opening shortcut/navigation, full-screen authored portraits with answer-before-choices/skip/scroll/resize/reload, and teaser→Lia with the unchanged guarded start payload. Coordinator visually inspected the public mobile booking beat, Nora reply and Lia teaser. Browser paths use controlled API fixtures; no paid model calls. Physical iPhone/Safari, live-model quality and emotional impact remain unverified. Durable evidence: outputs/perspectives/concert-authored-portraits-20261016/deployment.json and adjacent public results/screenshots. No runtime changes, merge, billing changes or other-product changes in this publication pass.
