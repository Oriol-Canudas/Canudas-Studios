# Verification — concert v0.2 English, 14 October 2026

Live: https://gamex-concert.vercel.app
Deployment: `dpl_p5dYFMyvjuaVqSEypVZ1G8QDnDzK` (READY; public alias personally tested).
Stable baseline: `bb3cd01`, with local baseline screenshots retained.

| Evidence | Result and scope |
| --- | --- |
| Build and deterministic rules | Production build passed; 22/22 tests passed. Added reading-time, emotional-state and English prompt alignment checks. Existing knowledge, consent and replay checks still pass. |
| Authored browser route | Passed; English Nora preparation, professional relay, notes, Lia briefing and explicit unavailable-AI behavior locally. |
| Responsive browser | No horizontal overflow or broken loaded image at 360×740, 390×844, 430×932 and 1440×1000. Portrait images and dialogue are in separate regions. |
| Audio | Actual Web Audio context resumed on entry. Measured RMS 0.0482 with sound enabled, 0.0000108 after mute. Confirms a generated audio signal, not physical speaker audibility. |
| Reading pace | First opening screen remains after five seconds; at least twelve seconds per beat, with action cues included. Pause, next and previous tested in browser. |
| Emotional portraits | Four mood fixtures visually reviewed at mobile, tablet and desktop sizes. Composer remains visible at 390×480. |
| Resilience | Mock backend checks pass for failed send, stable retry ID, disabled pending controls, preserved newer draft, small viewport and late reply after restart. |
| Live public duet | Complete published English route through real OpenAI reply, Nora confirmation, cue, performance and reveal passed. Accepted reply took 3.70 seconds including acceptance audit. |
| Live solo | Complete published English route through real OpenAI reply, solo cue, performance and reveal passed. Accepted reply took 3.06 seconds including acceptance audit. |
| Live emotional reactions | A threat produced firm portrait and refusal; withdrawing it and sharing a confidence produced hurt portrait and an objection. Neither turn manufactured agreement. Both replies and cues were in English. |
| Prior save | Existing v1 save retained separately; new English build starts with its own save key. |

The first public-duet test returned no proposal and failed a strict first-turn-acceptance assertion. The response details were not captured in that run, so its cause is not established. Repeating the same offer without changing code produced a valid acceptance and complete journey. This remains evidence of model variability; the successful rerun does not establish universal reliability.

Local records: `qa/browser-results.json`, `qa/resilience-results.json`, `qa/immersion-results.json`, `qa/live-journeys-results.json`, `qa/live-emotions-results.json`. Screenshots include the authored Lia view, all emotional fixtures and actual published replies/endings. Generated QA output is ignored by Git and excluded from deployment.

Not physically verified: iPhone speaker/Safari playback and the actual iOS keyboard. Browser tests used isolated Chromium; a small viewport simulates available space, not an iPhone. Human assessment of dialogue richness, immersion and trade-offs remains the next acceptance step. Ambience and ending motifs are synthesized; there is no recorded singing or character voice. Earlier v0.1 API probes were not rerun and are not counted as v0.2 evidence.

## Audio and readability follow-up

Deployment `dpl_7BZduEKuU9CEGgF42dy2w2GBTjkW` replaces the earlier audio. The prior signal-only test did not establish acceptable audio quality; user feedback rejected it. Noise and continuous oscillators were removed. The new 24-second generated audience recording is normalized, quieter during conversation, user-adjustable, and crossfaded between cycles. Actual local browser tests confirmed decoding/playback, two scheduled loop segments, volume at 20% and 0%, mute and four layout widths. Build and all 22 rule tests pass. Cover and larger Bruno portrait were visually inspected after image decoding. No live AI calls were required for this audio/UI revision. Subjective listening quality is not established by these numerical checks; physical iPhone/Safari playback still needs human confirmation.

The user subsequently rejected the crowd-only recording too. It remains technically playable but is not accepted sound design. Deployment `dpl_2QpexaPJUGwF2rEpotxCU7M5j2Ve` starts with sound OFF by default. A separately generated cinematic-score plus occasional cheer preview awaits user listening review before being installed.

## Integrated music and larger audience call

User explicitly requested that the preview music be incorporated and the restrained applause replaced by a larger clamour calling the artists back. Both files now load in actual Chromium gameplay: 60.024-second score plus separate eight-second audience cue. `qa/music-crowd-results.json` confirms music playback, a single first-backstage call, no duplicate replay, music ducking beneath the call, restoration at dialogue level, mute, and two successful asset requests. All 22 rule tests and build pass. The soundtrack is integrated, not merely linked as a preview; perceived quality still needs the user’s listening assessment.

## Conversation exit and immediate send feedback

Accepted negotiations now expose a full-width primary continuation to Nora confirmation or the final solo decision. Before acceptance, a visible secondary exit lets the player end and review. A fixture-based actual browser journey verified the accepted exit at 655×1050, 390×844 and 390×480, then continued through Nora consent to performance. This test uses a stored accepted-state fixture, not a real inference call.

Enter now clears the composer immediately and places a pending player bubble in the conversation. On failure, the message returns to an empty draft; a newer draft is preserved and the failed message remains available to edit/retry. Existing browser resilience checks pass, including stable retry ID, immediate empty input, preserved newer draft, disabled pending actions and ignored late reply after restart. Records: `qa/agreement-exit-results.json`, `qa/resilience-results.json`.

Latest deployed UI repair: `dpl_HHU7Ftbx9FiJTm7GY6dGJeSBTfvQ`. The accepted-exit and send-resilience browser checks were also run against the public UI using explicitly mocked API responses.
