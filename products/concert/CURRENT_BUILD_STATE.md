# Concert prototype — delivery state

Date: 2026-10-14. Builder: Codex, explicitly authorized by Oriol to build and publish the concert web app.

Live: https://gamex-concert.vercel.app

Vercel project: `gamex-concert`, isolated from the other Perspectives deployments.
Deployment: `dpl_p5dYFMyvjuaVqSEypVZ1G8QDnDzK`.
Versioned branch: `codex/concert-immersion-english`.
Application directory: `products/concert`.

The prior design-only handoff to Claude is superseded for this concert implementation. The authored case and the interaction intent came from the completed concert v03 design packet; this build does not change the priority of GameX products or approved strategy.

Implemented: cinematic opening; Nora-first/Lia-first preparation; conditional authored choices; sourced character requests; private notes and chronology contradiction; bounded live Lia negotiation; current-version confirmations and repairs; three agreement packages, optional encore, no-agreement ending; performance, causal reveal, local save/export; original optional ambience.

Verification records are local in `qa/`: deterministic rules, authored browser journey, mock failure/retry checks, live-model probes, and rendered public-duet/solo journeys. Generated records distinguish mocks from real OpenAI calls. Final delivery evidence is summarized in `VERIFICATION.md`.

Next acceptance step: Oriol plays without reading the implementation or solution routes. Evaluate whether preparation creates a clear personal objective, whether an intervention feels causally acknowledged, and whether the final cost is understandable. Improve resistance, context or pacing from that observation before extending the engine or adding another case.

English immersion revision: `concert-v0.2-en`. Full case and UI translated; slower controllable opening; real audio-state checking and audible ambience; uncropped authored portraits; large Lia presence and four reactive emotional images; blonde Nora across portraits and shared scenes. User requested these changes after playing v0.1. Baseline preserved at commit `bb3cd01` and local `qa/baseline-v01/`.
