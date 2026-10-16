# Concert speech: value, effort and smallest useful test

Assessment, 16 October 2026. Follow-up decision: user approved tap-to-record STT with review/edit now (task012); TTS and full duplex remain proposals. This assessment made no speech calls or service changes. Source and prices checked today; estimates below are engineering judgment, not vendor promises.

The best first version is turn-based voice around the existing validated conversation: tap Record → speak → Stop → inspect/edit transcript → Send → validated Lia reply appears and is spoken. Keep text fully usable. TTS improves Lia's presence; STT removes mobile typing effort. Neither automatically improves the relevance, resistance or consequences of her answer. Those remain a separate playtest question.

| Option | Expected player benefit | Incremental engineering effort, including basic QA |
| --- | --- | --- |
| Spoken Lia replies (TTS), replay/stop, music ducking | High emotional presence; less reading. Player can still type. | 1–2 focused engineer-days |
| Tap-to-record STT with editable transcript | High reduction in input effort; easier to argue naturally. Still safe to correct a misunderstood offer. | 1–2 focused engineer-days |
| Integrated STT + TTS pilot on real iPhone | Best first test of voice value, preserving current text/state engine. | 3–5 engineer-days total, including device checks and one voice/latency iteration |
| Full-duplex conversation with interruption | Potentially most natural, but adds turn ownership, interruption, reconnection and exact state synchronization. | Roughly 1–2 weeks; wider uncertainty, assess after the pilot |

These are planning ranges for a single developer with existing server credentials and a usable voice. Voice-account setup, unavailable catalog voices and major dialogue redesign are outside the ranges. Agent implementation may be faster; elapsed delivery is not guaranteed.

## What is already reusable / missing

The app already has a Vercel server route, server-only OpenAI credentials, signed negotiation envelopes, six-turn cap, explicit-send recovery, mood states, text subtitles, score mixing and recorded intro audio. Its server validates the complete reply and can run an acceptance audit before returning it. Speech must start only after that final validation: never speak a provisional acceptance that the audit then changes. This adds latency that must be measured, not hidden by optimistic playback.

The current audio module's speech ducking is opening-specific. Live Lia playback needs its own cancel/replay/loading/error lifecycle and coordinated music ducking. Only `reply.text` is spoken; physical cues stay visual. Stop playback when recording, leaving the scene, restarting or muting; text remains available after any audio failure. Retrying speech must not regenerate the conversation or consume another turn.

The Vercel policy currently sets `microphone=()`. An STT implementation must explicitly enable same-origin microphone access and request user permission on Record. Record short bounded clips, choose an actually supported recording format, stop tracks on Stop/Cancel/navigation, and preserve the existing draft if recognition fails. Do not auto-send or auto-translate an offer. Browser-only SpeechRecognition is not a dependable cross-browser foundation: MDN marks it limited availability. Use a recording + server-transcription path. [Browser microphone rules](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [format detection](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static), [SpeechRecognition compatibility](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

## Voice/provider recommendation and cost

Lia's existing intro voice is Beatrix Kingsley, generated through Magnific / ElevenLabs v3, catalog ID1208 in the local manifest. That numeric catalog ID is not proof of a directly accessible ElevenLabs API voice. Verify its actual API identity/availability before promising continuity; otherwise audition a close voice and explicitly decide whether to regenerate Lia's short intro clips. No voice cloning is implied.

For a pilot, audition ElevenLabs conversational TTS against the existing performance, and use OpenAI `gpt-transcribe` for short completed recordings. ElevenLabs supports streamed speech; its published latency excludes parts of our app/network path, so do not present it as total reply latency. [Models](https://elevenlabs.io/docs/overview/models), [streamed speech](https://elevenlabs.io/docs/api-reference/text-to-speech/stream), [transcription model](https://developers.openai.com/api/docs/models/gpt-transcribe).

Illustrative marginal voice cost: six Lia replies totaling1,800–3,000 characters at the fetched v3 Conversational/v4 Turbo listed rate of$0.04/1,000 characters cost$0.072–$0.12. Three minutes of player audio at$0.0045/minute cost$0.0135. Combined approximately$0.09–$0.14 per six-reply conversation, excluding the existing dialogue-model calls, subscriptions/minimum charges, taxes, retries and hosting. At1,000 such conversations, about$90–$140 in voice usage under these assumptions. Longer replies or a premium voice increase this; existing Magnific credits do not establish API entitlement. [ElevenLabs API pricing](https://elevenlabs.io/pricing/api), [OpenAI pricing](https://developers.openai.com/api/docs/pricing).

Do not start a new dependency on old OpenAI mini-TTS/transcribe recommendations copied from previous examples: official deprecations now list January6,2027 removal for legacy TTS and February26,2027 for older transcription models. Current voice architecture docs also offer GPT-Live over an existing backend and Realtime; assess those if we choose full duplex. [Deprecations](https://developers.openai.com/api/docs/deprecations), [voice architecture options](https://developers.openai.com/api/docs/guides/voice-agents).

## Small pilot acceptance

- Complete the same negotiation once by typing and once using voice, with identical state/consent rules and text fallback. The voice renderer cannot invent dialogue or approve an agreement.
- Record/edit/send works on a physical iPhone; denied microphone, silent recording, cancel, incoming interruption, network failure and repeated taps preserve draft and turn count. Audio cannot record its own playback.
- One confirmed send produces one validated reply/turn. Audio retry/replay changes none of them. No recording upload without the user's action; cap clip length and response length, use a server credential and bounded signed-session requests rather than an unrestricted paid proxy.
- Measure stop-recording→editable transcript, Send→validated reply, and validated reply→first audio separately (median and slowest observed). Target added speech wait below2seconds median as a pilot goal, not a current fact; report the existing dialogue/audit delay separately.
- Oriol compares Lia voice consistency, emotional plausibility, control over what he says and willingness to have another conversation. Success means the exchange feels more like negotiating with Lia and less like filling a form; technical PASS alone is insufficient.

Updated decision: fix the keyboard layout, then add only tap-to-record STT with editable review under task012. Three minutes of input adds about$0.0135 of transcription usage under the listed rate; TTS adds no cost until separately implemented. Keep the current story, agreement engine and six-turn format. Later evaluate a Lia voice audition and spoken replies; postpone continuous hands-free conversation until the pilot proves value.
