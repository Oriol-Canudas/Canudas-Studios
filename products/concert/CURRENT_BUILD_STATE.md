# Concert prototype — delivery state

Updated: 2026-10-15. Oriol accepted independent task 001 QA and explicitly authorized GitHub push and publication.

Live: https://gamex-concert.vercel.app

Vercel project: `gamex-concert`, isolated from the other Perspectives deployments.
Current deployment: `dpl_CF4F5VGzohnZLu8mmESJSefCbSoK` — production READY, confirmed by Vercel inspect. Created 2026-10-15 10:45:40 Europe/Madrid.
Deployment URL: https://gamex-concert-5rgflgu6e-ocanudas-7641.vercel.app
Deployed commit: `ac278a0a193591bb9721f352296fd6a6cfaa5e7c` (same product code as independently verified `a913c776`).
Versioned branch: `codex/concert-immersion-english`.
Application directory: `products/concert`. Confirmed local link and remote project: `ocanudas-7641/gamex-concert`, `prj_pmy012EZyymfl5MvxHQrIRhzYz3R`, root `.`, Node 24, Vite, output `dist`. CLI publication remains separate from Git push; Git auto-deployment is not configured.

## Current accepted change — interrupted-send recovery

The three task commits (`305d84f`, `a913c77`, `ac278a0`) were pushed on the existing branch without merging. The accepted minimal workflow is DESIGN → one bounded BUILD worker → a different independent QA agent. Root `AGENTS.md`, `.agents/skills/gamex-qa/SKILL.md` and `tasks/001-recover-interrupted-send.md` hold its instructions and record.

Client saves the exact send request before dispatch. Reload replaces orphaned Sending with delivery unconfirmed, preserves the newer draft and agreement state, and offers an explicit original-envelope retry. No automatic resend; one player bubble/reply/turn after successful retry. Authored content, engine, server and other products are unchanged.

**Verification: PASS.** Independent QA at `a913c776`: 25 Node tests, build and four offline browser suites. After production publication of `ac278a0`, controlled API-fixture checks passed on https://gamex-concert.vercel.app (HTTP 200): actual delayed send → reload → unconfirmed delivery → explicit retry, with newer draft and accepted agreement/consent preserved; subsequent reload passive. Existing Nora-confirmation-to-performance regression also passed on production at 655×1050, 390×844 and 390×480. No JS errors or horizontal overflow. Published recovery and performance screenshots were personally inspected.

Commands/evidence: `node /tmp/concert-published-20261015/verify.cjs`; `QA_URL=https://gamex-concert.vercel.app QA_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node qa/agreement-exit.cjs`. Report and screenshots: `/tmp/concert-published-20261015/`; existing regression results: ignored `qa/agreement-exit-results.json`. Full handoff, IDs, URLs, acceptance and evidence are in `../../tasks/001-recover-interrupted-send.md`.

All browser API calls were intercepted by fixtures; no paid model calls. This verifies published client behavior, not live-model inference, real iOS keyboard or exactly-once processing. Existing expiry/retry limits remain; no backend or scale infrastructure added. The subsequent publication-record commit changes documentation only, with product bytes identical to this deployed commit.

The prior design-only handoff to Claude is superseded for this concert implementation. The authored case and the interaction intent came from the completed concert v03 design packet; this build does not change the priority of GameX products or approved strategy.

Implemented: cinematic opening; Nora-first/Lia-first preparation; conditional authored choices; sourced character requests; private notes and chronology contradiction; bounded live Lia negotiation; current-version confirmations and repairs; three agreement packages, optional encore, no-agreement ending; performance, causal reveal, local save/export; original optional ambience.

Verification records are local in `qa/`: deterministic rules, authored browser journey, mock failure/retry checks, live-model probes, and rendered public-duet/solo journeys. Generated records distinguish mocks from real OpenAI calls. Final delivery evidence is summarized in `VERIFICATION.md`.

Next acceptance step: Oriol plays without reading the implementation or solution routes. Evaluate whether preparation creates a clear personal objective, whether an intervention feels causally acknowledged, and whether the final cost is understandable. Improve resistance, context or pacing from that observation before extending the engine or adding another case.

## Prior delivery history — 2026-10-14

The following is historical; the current accepted change and deployment above are authoritative.

English immersion revision: `concert-v0.2-en`. Full case and UI translated; slower controllable opening; real audio-state checking and audible ambience; uncropped authored portraits; large Lia presence and four reactive emotional images; blonde Nora across portraits and shared scenes. User requested these changes after playing v0.1. Baseline preserved at commit `bb3cd01` and local `qa/baseline-v01/`.

Follow-up: user rejected the synthesized sound quality and requested readable context copy, larger speaker portraits and role clarity. Deployed generated crowd ambience, scene ducking, volume control, larger context type and opening portraits, and explicit stage-manager role for Bruno. Audio technical checks are recorded in `qa/audio-repair-results.json`; perceived quality and physical iPhone playback remain human checks.

Audio review pending: Oriol also rejected the generated crowd-only sound. New agreed direction is soft cinematic music with occasional distant cheering encouraging the artists back onstage. Audio is now OFF by default with a fresh sound preference key. A separate 30-second music-and-cheer preview has been prepared for listening review before installation; it is not the active soundtrack.

Music is now integrated at the user’s explicit request: 60-second cinematic underscore plus separate, stronger eight-second audience encore call. Sound on enables both. No continuous crowd-only bed is used. Opening now spells out one final performance: Lia premieres a new song alone OR both artists sing their best-known song together. The new score is installed; prior preview-pending notes above are historical.

Conversation flow repair: prominent primary exit after Lia acceptance, secondary exit at any other time; both lead to agreement review before execution. Sending with Enter clears the input instantly and shows a pending bubble; failed send recovery and preservation of any newly typed draft remain supported.
