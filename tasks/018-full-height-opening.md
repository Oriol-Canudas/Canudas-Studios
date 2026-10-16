# Task018 — Opening fills the device, with larger character portraits

## DESIGN

Oriol's supplied mobile screenshot shows the opening image below two large bars and a substantial dark lower region. He requests the image fill the screen dynamically, menus move out of its way, and character images become larger in these screens. Scope is the opening narrative sequence shown, not the AI handoff/ending proposal in task017.

Baseline: clean `e5e2c28` (runtime `93aeb13`); branch `codex/concert-encore-v05`. Task016 goal removal has just been published and separately verified. Reproduce the opening's current geometry and capture narrator + character baseline screenshots before editing.

Player benefit: one continuous cinematic stage using the available browser viewport, with prominent speakers, legible spoken and unvoiced text, and reachable controls. Preserve image aspect ratio with cover/cropping; do not stretch faces. Browser chrome is outside app control.

## Bounded BUILD

One worker may edit `products/concert/src/main.jsx` for opening-specific markup/classes only, `src/style.css` for scoped opening layout, focused opening/scenes/intro-voice QA selectors or geometry, one focused opening layout suite/helper if useful, and PRODUCTION_LOG. Keep interaction handlers, story data, voice/timing/audio controllers, API, engine, recorder, saved state and other product screens unchanged. No new media, dependencies or services. No paid calls, push or deploy by worker. Coordinator publication follows independent QA under existing live-update authorization.

Use the existing responsive viewport measurement. Opening artwork must cover the app from top to bottom behind compact overlaid header/menu and footer controls. Remove the separate large chapter/header stack in this screen; retain a concise phase/progress indication. Keep notes, sound, volume, restart and navigation accessible with their names and behavior. Preserve readable unvoiced directions as distinct from speech. Keep the explicit Go backstage action visually prominent. Use safe-area insets for browser/fullscreen contexts.

Enlarge opening speaker artwork substantially: target at least104×120px on normal tall mobile (current70×82), 120px wide desktop. Compact/landscape may use at least80×92 to prioritize readable text, with a scrollable caption region where needed. No new portraits or distortion. Controls and artwork continue filling the viewport even if captions need scrolling; taps used for scrolling/controls must not advance a beat.

## Acceptance (frozen)

1. At390×844,430×932,320×568,390×480,844×390 and1440×1000, actual opening image bounds cover the usable app viewport behind menus (within1px). No capped-width desktop stage or unused structural blank region. Top/footer controls do not consume separate opaque bars. No horizontal overflow.
2. All11 opening beats preserve exact copy, speaker identity and unvoiced cues. Narrator, booking notification and longest spoken/cue beats inspected. Main speech remains >=24px, unvoiced directions >=18px, with visible contrast. Character portraits meet normal/compact targets, retain natural proportions and show recognizable faces. Long/short layouts can scroll captions without clipping or hiding navigation; normal tall mobile fits ordinary beats without unnecessary scrolling.
3. All named controls remain visible/reachable at >=44px effective targets; focus, notes/reset/volume overlays and safe-area padding work. Single scene taps/Next/Previous advance once; controls, selection and drag/scroll gestures do not. Dynamic height changes (browser bars/rotation) update image and controls without reload or changing the beat/state.
4. Voice/reading pacing, Nora→crowd→Bruno cue, pause/resume, notes/reset/hidden interruptions, manual skip and unavailable-audio recovery remain unchanged. No changes to saved prep/draft/negotiation/consent or non-opening product UI; especially preserve the new portrait AI and goal-free briefing.
5. Build, existing opening/scenes/intro-voice suites and focused geometry checks PASS on final candidate. Separate QA verifies actual diff, baseline defect, screenshots across sizes and dynamic resizing, plus non-opening isolation. Test adjustments may reflect the new opening geometry without weakening behavior/state checks. No real provider calls; Chromium emulation does not prove physical iPhone/Safari.

## BUILD / QA / release

Candidate `26a78cfd1dfe718a9b54e207d253c50316d038f5`; bounded BUILD by opening_fullheight_build, independent non-editing QA by goal_prompt_qa. All six criteria PASS. Independent baseline reproduced image y104/h740 at390×844 versus candidate y0/h844; portraits70×82 become112×132. All eleven beats at six specified sizes, independent390×660/668→844/rotation, readable captions, accessible controls and protected saved state passed. Lia/Nora authored text contrast11.89:1; choices retain their plum fill. Hub, goal-free briefing and portrait AI geometry/styles match baseline. Build and opening-layout, opening, scenes, intro-voice and hierarchy suites passed; coordinator inspected diff and mobile renderings.

Durable independent evidence: `../../perspectives/concert-opening-release-20261016/independent-qa/`, including verdict.md, results.json, own probe, screenshots and regression results. Controlled Chromium and real local audio assets; zero paid calls. Physical iPhone/Safari remains unverified. Published commit5284687, deploymentdpl_3afa129FtyHQxRmHdL3xmUMNVt22 READY. Live https://gamex-concert.vercel.app/?v=full-screen-opening-20261016; immutable https://gamex-concert-bn6idll3o-ocanudas-7641.vercel.app. Public asset hashes match tested client; anonymous200 and metadata available. Public opening/navigation/tint/dynamic-height probe PASS with controlled API. Coordinator inspected the public mobile render. No paid calls. Release evidence is in the same durable folder.

Subsequent user request for the full-portrait translucent treatment in authored dialogue is DRAFT ONLY. It is shown outside the repository in `concert-authored-translucent.html`; this candidate includes only the previously authorized tint. Task017 Lia/Nora/ending redesign likewise remains proposed.

## User amendment — distinguish authored speech from response choices

While BUILD was starting, Oriol supplied an authored Lia dialogue screenshot and asked for a slight tint to distinguish the character's answer from the next player questions. Include this small presentation change in the same release: scope `.screen-dialogue .character-speech` to a subtle cool blue-grey fill/border while retaining the current selectable plum response buttons, gold speaker label, readable text, arrows and layout. No changes to prior-player echo, story/choice semantics or AI translucent dialogue. This is an explicit exception to the original non-opening UI protection, limited to authored character-speech colour.

Acceptance6: inspect Lia and Nora baseline/candidate panels on mobile and desktop; character speech and selectable responses have perceptibly distinct fills, body text remains at least4.5:1 contrast, focus/controls are unchanged. Existing hierarchy suite passes. Do not add new tests merely mirroring colour constants. Include the bounded CSS change in the worker diff and independent QA.
