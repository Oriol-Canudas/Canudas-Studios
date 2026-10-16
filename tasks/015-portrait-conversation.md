# 015 — Portrait backdrop for Lia's conversation

## DESIGN — 16 October 2026

User approved the Portrait backdrop interactive sketch and requested implementation. Baseline: clean `codex/concert-encore-v05`, `6cc57f5`. Publish to the existing gamex-concert Vercel project after independent QA, as authorized in the ongoing build/publication task. No new services or paid generation.

Approved visual reference: `/Users/oriol.canudas/.codex/visualizations/2026/09/24/01a0d4ff-4fa2-7731-87a8-c6ea888a33b4/concert-dialogue-hierarchy.html`, Portrait backdrop variant. Inspect the CSS/JS without dumping the embedded base64 image. Existing screenshots `/private/tmp/concert-sketch-860-cinematic-read.png` and `/private/tmp/concert-sketch-320-cinematic-review.png` show the approved concept. Use existing production mood images, not the thumbnail or illustrative dialogue. The player benefit is readable dialogue with Lia's expression visible and one clear interaction mode at a time.

### Accepted presentation

- One continuous full portrait behind Lia's final conversation, including the lower control area. A translucent dark text layer (approximately 32% plus restrained shadow) keeps speech readable while the face remains visible. No heavy opaque portrait/text partition or duplicate desktop portrait.
- Compact identity/status header: Lia, actual remaining turns, always reachable Review & end, conversation options. Remove the redundant app/chapter bars on this screen only; options retain notes, sound/volume, suggestion, restart access. Mood image/label remain truthful to existing interpreted state, never consent.
- Most recent Lia speech is the primary reading content, with clearly attributed stage direction. Earlier full conversation and private goal remain available on demand. Pending/unconfirmed/failed delivery, errors and retry must stay visible/reachable without being mistaken for a new Lia response. Do not delete or rewrite any history.
- Default Talk is centered and round; Type instead is secondary. Recording shows Stop, real amplitude feedback, time/max and Cancel. Permission/transcription remain explicit and cancellable. Review mode shows editable recognized words and explicit Send; text typing is an alternative mode, not another permanently stacked panel. Back to Talk preserves drafts; an existing restored draft must be discoverable and editable. No automatic keyboard or send.
- Hide the empty offer panel. A compact actual proposal/accepted-offer summary is available when applicable, without inferring consent. Review & end leads through existing review/Nora confirmation/producer cue flow; no automatic execution. Existing constraints on busy/turn/session/retry remain.
- Portrait stays behind the text in short/typing views too, but controls and reading take priority; retain the visualViewport height/pan behavior. Long replies scroll in a bounded reading area without compressing message text or displacing primary controls.

## Bounded BUILD

One worker may edit `products/concert/src/main.jsx`, `products/concert/src/style.css`, focused UI QA scripts under `products/concert/qa/`, and `products/concert/PRODUCTION_LOG.md`. A small presentational component/helper within src is allowed only if it simplifies this exact change. No story, engine, server/API, audio, recorder lifecycle, assets, dependencies, save key/version or negotiation contract changes. Test selector/geometry changes may reflect the approved hierarchy, but retain underlying semantic assertions. Add one focused portrait-layout browser suite if useful. Capture baseline overcrowding before editing with controlled fixtures. Hand off one candidate commit and evidence. No push/deploy by worker.

## Acceptance (frozen)

1. Rendered mobile 390x844, 390x480, narrow 320px and desktop 1440x1000 show one full mood portrait beneath translucent dialogue/control surfaces, clear Lia identity, readable latest response and no stacked duplicate headers/portrait/empty-offer panel. No horizontal overflow, overlap or clipped controls. Inspect actual screenshots, including long response and an accepted offer.
2. Default has primary round Talk >=88px on ordinary tall mobile, secondary Type instead, no visible textbox. Recording shows Stop and Cancel with actual existing amplitude/time feedback; review and typing have an editable >=16px textbox and Send without a competing big Talk control. Back to Talk retains text; reload retains drafts; existing typed text plus new transcript are both retained. Supported/unsupported, denied, timeout, cancel and overflow behavior remain reachable. No forced keyboard, no paid call before explicit user recording/send in real runtime; QA uses fixtures only.
3. Short/keyboard synthetic visible windows 430px and 360px with 170/250px pan keep composer in viewport, natural message heights, at least120px/90px reading space respectively, reachable exit/options and restored normal layout after dismissal. Short windows, rotation and pinch-zoom/no-visualViewport fallbacks remain usable. UI recording controls can compact to >=44px in short views.
4. Earlier messages, private goal, notes, suggestion, sound/volume and restart remain accessible without losing draft or game state. Clear screen-reader names, keyboard activation, modal focus/Escape and reduced-motion behavior. Latest successful reply is visible after send; pending, failed/unconfirmed and explicit retry remain correctly attributed and usable. Preserve interrupted-send original request identity/newer draft exactly.
5. Review is always reachable except original busy constraint, and does not execute a performance. Lia's actual proposal/acceptance remains distinct from Nora consent and the final cue. With no agreement, explicit alternatives remain; accepted flow goes through Nora then performance. Preserve all existing authored state, audio/encore cue and non-AI views byte/function behavior outside the scoped presentation.
6. Node tests, production build, focused portrait suite plus speech-input, keyboard, interrupted-send and agreement-exit regressions pass on final candidate. Adapt broader selectors for new controls where needed, without weakening state/consent assertions. Separate non-editing QA inspects actual diff and rendered screenshots, independently traverses relevant paths and confirms protected files unchanged. State limitations: Chromium fixtures do not prove real iPhone/Safari, provider recognition/AI or subjective voice quality.

## BUILD / QA / publication

Pending.
