# 013 — Hear the encore crowd between Nora and Bruno

## DESIGN —16 October2026
Baseline432487e87afcd9ce88b3c30df83203dc62a2288b, clean codex/concert-encore-v05. User wants the existing crowd asking the artists back onstage immediately after Nora: “About what? You’ve already told them I’m not coming.” (opening beat5) and before Bruno: “They’re calling for the encore. Are you both ready?” (beat6). Current source only cues audience at hub/later scenes. Coordinator baseline browser probe /tmp/concert-crowd-baseline.cjs and .json checks actual MP3 sequence in isolated8810 context without touching user storage.

Use the existing /audio/encore-call-v2.mp3 (approximately8seconds), at its existing audience loudness/fade, as an interlude after Nora's recorded voice finishes. Keep the current Nora caption/stage direction while the crowd plays. Automatic progression to Bruno must wait for both the cue and existing readable caption time. Existing music ducks during the cue. No new media generation, story copy, screen, tap requirement or provider calls. Sound-off stays silent with unchanged existing reading flow. Manual Next/Previous/tap/Go backstage may skip/cancel audio, preserving existing navigation freedom. Replaying Nora's beat deliberately can replay its cue once; no accidental duplicates within one playback.

## BUILD scope
products/concert/src/intro-voice.mjs and src/audio.mjs; src/main.jsx only if minimal sequencing/lifecycle glue necessary. Focused existing intro-voice tests/browser suite and an optional narrowly scoped audio-sequence helper/test if needed; qa runner registration only if a focused suite is added; PRODUCTION_LOG. No story/engine/API/speech-recorder/assets/dependencies/save changes. Coordinator owns brief/release docs. One bounded worker, then different non-editing QA using .agents/skills/gamex-qa/SKILL.md. Worker commits scoped files; no push/deploy/paid generation. Coordinator has standing authorization to publish to existing gamex-concert after PASS.

## Acceptance
1. In actual browser WebAudio playback with Sound on: Nora beat5 completes → existing crowd cue starts promptly → cue finishes → Bruno beat6 starts. No voice/crowd overlap, no overlapping sources or duplicate cue. All11 recorded voice mappings/text/cast remain unchanged. Existing caption minimum is respected. Verify source start/end timeline plus rendered target caption.
2. Pause/notes/reset overlay/hidden interruption freeze the cue and resume appropriately without replaying Nora or duplicating cue. Mute, navigation and confirmed restart stop obsolete cue immediately; rapid Next/Previous or delayed voice completion cannot leak stale crowd or block the next scene. Sound-off unchanged, no microphone/model calls. Existing hub/later audience cues remain governed by their existing behavior; do not mistake intentional hub cheer for stale opening cue.
3. Existing soundtrack volume/capture mute and introductory voice playback remain intact. Missing/failed optional cue must never trap story/navigation. Story, speech input, knowledge/consent/turns/saves and existing assets unchanged.
4. Node tests and production build plus focused intro-voice/opening/speech-input suites PASS. Different QA agent checks exact diff, independently verifies audio timeline and lifecycle, inspects mobile target moment, reports evidence and physical-iOS/listening limitations. No unrelated broadened testing absent new concerns. Coordinator publishes same product and verifies public sequence and asset identity.

## BUILD / QA / release
Pending.
