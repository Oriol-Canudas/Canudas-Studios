# Task021 — Full-screen character backdrop in authored conversations

## DESIGN

User now explicitly requests implementation of the previously draft-only full-screen portrait/translucent treatment for the shown Nora authored dialogue and equivalent character screens. Baseline clean289b172d8975483b8ec38ee30e6808b7eb2ba963 on codex/concert-encore-v05, including accepted task020 quiet opening shortcut. Player benefit: stay with the character while reading and choosing; no separate portrait panel that scrolls away before the answer.

Use one continuous aspect-preserving existing character portrait covering the available app viewport behind the menus, identity, speech and response choices. Preserve a recognizable face, natural proportions and visible image through the panels. Keep text itself opaque and readable; translucent dark/cool speech and subtly different plum choices preserve attribution/interaction hierarchy. Compact overlaid top navigation/identity replaces the bulky stacked image/name blocks. Dialogue scrolls over the stable backdrop; mobile and desktop both have one coherent portrait scene, no second sidebar image. No forced presentation delay or portrait reveal animation. Keep actual existing Nora image-state selection.

## Bounded BUILD

One implementation worker. Allowed presentation-only src/main.jsx, scoped src/style.css, one focused authored portrait browser suite plus runner registration, necessary existing presentation-selector/geometry assertions in QA, and short PRODUCTION_LOG note. No story/copy, engine, save/version, request/recovery, negotiation/consent, audio/recorder, dependencies, new assets or other-product changes. Preserve existing typewriter reveal and skip, all choices, prior-player echo, notes, history and Backstage actions. User approved full-portrait authored layout here; agreement/payoff/mood-transition proposals remain out of scope. No paid calls, push/deploy by worker or user8810/storage changes.

## Acceptance

1. Capture baseline Nora supplied scene and Lia/Bruno; candidate has exactly one visible portrait covering the whole app viewport (within1px), aspect-preserving, behind headers/content, stable while scrolling. All3 cast recognizable; Nora existing conditional listening image preserved. No opaque full-width panel hides the portrait. Inspect real renders at390x844,390x480,320x568,844x390 and1440x1000, including long/continuation/history states. Text/choice surfaces can be dark enough for readability while visibly translucent; letters are fully opaque.
2. Speech, You said, cues and selectable questions remain distinct and readable, with unchanged exact copy/attribution/options; body >=18px on normal mobile, >=16px on compact; secondary labels >=11px. Preserve effective text contrast via suitable scrim/panels, focus indicators and >=44px control targets. No horizontal overflow, clipped face in ordinary portrait view, inaccessible content or controls. Scroll on compact screens instead of compressing text; dynamic viewport/rotation reflows without changing story state.
3. Backstage/return, choices (including more than one step), notes, volume, restart overlay and earlier conversation work. Changing cast updates the image. Saved prep/discoveries/communicated knowledge/consent/drafts survive presentation, navigation, modal/resize and reload. No new actions or automatic decisions. One relevant real authored path to briefing remains playable with controlled API only.
4. Character typewriter stays progressive with stable geometry and skip; reduced motion/reload/history are complete. Original AI translucent layout, opening (including quiet Go backstage), hub, brief/review/ending stay unchanged by scoped selectors. No new provider calls or timers.
5. Build + focused authored-portrait suite and existing hierarchy/dialogue/reply-reveal/scenes/portrait suites PASS. Update only assertions that genuinely encode superseded authored portrait layout, never weaken flow/state checks. Separate non-editing QA verifies exact candidate, baseline, actual screenshots, selectors/scope and criteria. Chromium emulation does not establish physical iPhone/Safari.

## Result

Pending. Coordinator publishes accepted task020+021 together to existing gamex-concert and verifies public assets and controlled browser journey.
