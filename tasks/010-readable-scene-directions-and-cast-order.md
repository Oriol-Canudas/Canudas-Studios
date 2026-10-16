# 010 — Readable unvoiced scene directions and Lia-first character menu

## DESIGN — frozen 16 October 2026
User requests two small fixes to the latest published concert: unvoiced secondary opening sentences are too easy to miss; make them larger/highlighted or separate them. Character menu should show Lia first, Nora second (user wrote Noa; existing character is Nora). Choose the minimal presentation fix: larger high-contrast directions in their own visually distinct block within the current beat, without adding screens or taps. Existing session authorization covers publishing this update to the same Vercel concert project after QA.

Checkout outputs/concert-build; branch codex/concert-encore-v05; clean baseline d258aaf6abcd37491bba2cebf7a8c305b7e3022c. Baseline browser /tmp/concert-cue-baseline.cjs reproduced14px italic muted text on a transparent background at390x844 and Nora→Lia menu order. Opacity is1: the issue is visual salience, not literal fading. JSON and screenshots /tmp/concert-cue-baseline* and /tmp/concert-menu-baseline.png.

## Allowed BUILD scope
products/concert/src/style.css; products/concert/src/main.jsx (contact ordering, plus a cue class only if necessary); products/concert/PRODUCTION_LOG.md. No new tests needed for these presentation changes; existing regression suites plus temporary focused visual/navigation probes suffice. No dependencies, infrastructure, artwork/voice generation, audio controller/timing, story text/facts, engine/rules, API/model, save keys, discovery/relay/consent/drafts or other products. Coordinator owns this brief and delivery documentation. One bounded BUILD worker, then a different non-editing QA agent per AGENTS.md.

## Observable acceptance
1. Every existing opening direction remains verbatim and visibly distinct from the spoken main line. Mobile and desktop cue font at least18px, normal (non-italic) readable text, strong contrast and a dark backing/accent or equivalent separation; do not change dialogue/AI .cue styling. No new text is voiced or misleadingly attributed to a speaker.
2. The same11 voiced beats/captions and existing readable durations remain. Pause/resume, Next/Previous, scene tap, notes and voice interruption retain their behavior; no new screen or mandatory tap. Intro/media/source mappings remain unchanged.
3. At390x844,390x480 and1440x1000, cue-bearing beats (including longest cue and booked-tour message) remain readable with no text/control overlap or horizontal overflow; controls remain reachable even if short screens require scrolling. Inspect actual screenshots.
4. Both initial and returning hub display Lia, Nora, then Bruno when already eligible. No automatic character selection or change to eligibility, notification, click actions, contact copy or state effects. Clicking each visible character reaches that same character; returning retains the order.
5. Existing Node tests and production build pass; focused opening/scenes/intro-voice checks and actual Lia/Nora/Bruno navigation preserve state. Browser negotiation calls must be blocked/intercepted; no paid inference. Independent QA compares candidate diff to protected baseline and records PASS/FAIL and limitations, not merely worker claims.

## BUILD / QA / publication
Pending.
