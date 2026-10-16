# PERSPECTIVES — The Song Was for You

Concert web prototype: [gamex-concert.vercel.app](https://gamex-concert.vercel.app/?v=character-replies-20261016). **Public version: paced character replies, published 16 October 2026. New full-screen authored portraits, answer-before-choices sequencing, quiet opening shortcut and emotional Lia teaser are implemented and independently accepted locally, but publication is blocked by Vercel's daily deployment limit.** The public client was verified unchanged after the refusal. Local UI preview: http://127.0.0.1:8822/?v=emotional-scenes-20261016 (static, no live AI). See `CURRENT_BUILD_STATE.md` for evidence and release action. Lia's proposed agreement/ending flow remains a separate design proposal. [Creative canon](../../CREATIVE_CANON.md) records Oriol's warm, caring, loving, playful and direct design philosophy. Controlled QA does not establish real-model semantics, physical iOS behavior or human emotional impact.

The main set has finished. Lia fronts the band; Nora co-writes and sings many of its songs, a core creative member. Backstage, Nora sees a booking confirmation excluding her from the next tour and refuses their customary shared encore. Reactive authored discovery and explicit relays prepare a bounded negotiation with Lia. Nora answers the actual offer, and the producer gives a separate performance cue.

Four outcomes use one song: shared encore with public next-tour acknowledgment; private acknowledgment before singing, agreed stage space and jointly approved statement tomorrow; band and Lia without Nora; no encore. The future tour cannot be rewritten, romance is not payment for performance, and neither notes nor mood grant knowledge or consent. This isolated product does not replace The Last Message, The Last Ascent or Flight 702.

New character answers reveal progressively with stable layout. In the accepted local build, authored follow-up choices appear after the answer completes; tap the speech or Show full reply to reveal the answer and choices immediately. Navigation remains available. Reduced motion, restored content and history remain immediate. Run `npm run qa:local reply-reveal` for the controlled normal-motion, accessibility-structure, stable-layout, skip, reload and retry checks.

## Run

Node24, from this directory:

```sh
npm ci
npm run dev -- --port 8785
npm test
npm run build
QA_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run qa:local
```

Playwright1.62.1 is pinned; use installed Chrome as above or install Playwright Chromium once. `npm run qa:interrupted` runs only recovery; `npm run qa:local encore` runs the new full journeys.

For live AI, supply `OPENAI_API_KEY` only in the server environment. Existing Production alias `PerspectivesConcert` remains supported. No key belongs in `VITE_`, client code or Git. `OPENAI_MODEL` is optional, default `gpt-4.1`. Vite development middleware runs the same server handler. Without a key, authored preparation remains accessible and AI entry explicitly reports unavailable; no generated reply is faked.

Vercel project is `gamex-concert`, team `ocanudas-7641`, deployed separately through CLI; Git auto-deployment is not configured. Publication is a coordinator action after independent QA, not part of worker testing. Never repoint another prototype.

## Code and state

- `src/story.mjs`: fixed past, reactive dialogue graph, discoveries and encore packages.
- `src/engine.mjs`: event replay, current speech versus history, delivered knowledge, proposal versions, term grounding and consent gates.
- `src/main.jsx`, `src/style.css`: mobile/desktop flow, attributed speech and gestures, private notes, AI composer, review, cue and causal endings.
- `src/send-recovery.mjs`: original request recovery without automatic resend.
- `server/lia.mjs`: strict structured model output plus independent semantic acceptance audit. Latest negations invalidate stale terms; explicit stage-space additions revise the package version.
- `api/negotiate.mjs`: server secrets, signed story-version envelope, six-turn limit, request-identity deduplication and metadata diagnostics.
- `tests/`: deterministic logic, semantic-audit fixtures, story-token isolation and recovery invariants.
- `qa/`: controlled browser suites; generated evidence is ignored by Git.

Player discovery, permission and actual delivery are separate. A delivered professional explanation triggers a specific Lia response; private love stays out of the model's context unless explicitly stated in the conversation. A fabricated claim does not retroactively create a real confidence. Shared performance requires both artists' acceptance of the same current package. A real confidentiality breach closes the shared encore; Nora hears an explicit admission rather than learning it by magic. Correcting a tour promise does not force public framing.

Actor willingness is distinct from whether an offer is grounded. An explicit refusal or unresolved participation clarification revokes the prior yes and its version. Closing an unchanged agreed conversation can retain its yes. A withdrawn without-Nora offer cannot be immediately reaccepted by the authored alternative; remaining live negotiation or no encore is available.

A private offer missing physical-space terms goes back to the same signed AI conversation with the actual condition and remaining turns. No new six-turn session is granted. At the limit or after refusal, a distinct review scene can ask Lia explicitly to perform with the band without Nora; it is a new offer and yes, not an invented earlier AI acceptance. House lights/no encore is always available.

## Optional recording and mobile typing

In the active Lia conversation, use the large central Talk button, grant microphone permission, speak and tap Stop. No hold gesture is needed. The live amplitude ring/bar and elapsed 45-second status provide capture feedback; Cancel remains available. Type instead opens the alternative text editor. Recognition opens editable review and appends to the current draft without forcing the keyboard; only explicit Send enters the negotiation and uses a turn. Back to Talk retains text; Review saved draft makes it available after reload. Cancel discards an active recording. Overlong combined text is retained for shortening/review instead of silently truncated. Typing remains available after denied permission or failed recognition. History, notes, suggestion preview, sound/volume and restart are accessible from Conversation options; a suggestion is appended only on an explicit Add action.

Supported MediaRecorder WebM/MP4, maximum45seconds/2MiB. Capture temporarily mutes the existing soundtrack and releases microphone tracks on Stop, Cancel, scene/notes/reset or hidden-page interruption. No audio is persisted in saves. `src/speech-recording.mjs` owns lifecycle; `api/transcribe.mjs` and `server/transcription.mjs` validate the existing signed session and call OpenAI server-side. Uses the same OPENAI_API_KEY or PerspectivesConcert credential; optional OPENAI_TRANSCRIBE_MODEL defaults to gpt-transcribe. No new key or account is required. There is no AI reply TTS in this release.

The typing layout follows visible viewport height and pan, scrolls only its transcript, preserves natural message heights and compacts decorative elements while the keyboard is open. Existing drafts, explicit retry identity, agreements and saves are unchanged. Run `npm run qa:local speech-input keyboard` for controlled fixtures. Physical iPhone behavior and real recognition still require a device test; a simulated MP4 recorder is not Safari verification.

## Saves, requests and limits

Encore uses `perspectives-concert-encore-v05` and build `concert-encore-v05`. Old two-song sessions remain untouched under `perspectives-concert-v2-en`; a cover notice offers a sanitized JSON export. They are not silently migrated into a different authored past. Downloaded exports omit top-level and nested request tokens. Browser saves do not sync across devices.

A pending request is durably recorded before dispatch. Reload shows delivery unconfirmed; retry reuses the original message, token and request ID and preserves a newer draft. Reload never automatically resends. Restart ignores a late response. Old-story start requests and signed tokens are rejected before replay/provider invocation. AI envelopes expire after two hours; local saves and existing agreements remain. Server deduplication and rate limits are best-effort per warm instance, not exactly-once inference or a global spend cap.

Six successful substantive turns; failed/invalid generations do not spend one. Up to one interpretation repair, separate grounding audit for acceptance or revision of an earlier acceptance, overall48-second server deadline. Requests use `store:false`; server logs contain usage/request metadata, not raw dialogue. Model interpretation/audit remains probabilistic.

## Verification and media

`qa:local` builds then starts **static** preview on127.0.0.1:8796 and runs eighteen sequential suites: authored browser route, resilience, interrupted-send, agreement-exit, opening, hierarchy, encore, dialogue, cover, scenes, intro-voice, keyboard, speech-input, portrait, opening-layout, reply-reveal, authored-portrait and teaser. It strips provider environment variables, refuses a busy port and stops preview afterward. Every API interaction is unavailable or a controlled browser fixture; the runner cannot invoke paid generation. New encore cases cover public professional, private professional relay, Lia-first without Nora, tour-promise correction, love breach/refusal, private-condition revision, six-turn no agreement legacy isolation/export, provider-fixture actor withdrawal, solo-refusal fallback protection and source-aware notes. Existing `live-*` and `api-cases` scripts are historical two-song probes, are **not v05 acceptance tests**, and must be updated before any separately authorized paid semantic evaluation.

Current deterministic checks cover81 Node tests, production build and controlled Chromium journeys including390×844,390×480 and desktop. Independent QA is a separate gate. None of these establish real-model persuasion, physical iOS keyboard/touch behavior or fresh-player enjoyment.

Important Backstage and Return backstage navigation remains gold and easy to find. The accepted local opening shortcut is muted grey with the same accessible target. The existing8-second audience call now follows Nora’s refusal and finishes before Bruno says the audience is calling for the encore; pause/resume retains cue position and navigation/mute can cancel it.

Existing art and soundtrack are reused. Sound is opt-in: a60-second cinematic score with separate8-second stronger audience calls; dialogue ducking, cue spacing and hidden-tab muting remain. Lia's AI portrait continues behind translucent speech and controls; guarded/receptive/hurt/firm images reflect interpreted interaction, never consent. No new media or recorded singing was created for v05.

## Authored dialogue amendment — task 005

Nora’s optional love disclosure now stops before rehearsal exposition. The next three responses protect privacy and choose between authorized professional context, asking about rehearsals, or returning to tonight’s needs. The professional-only route remains viable without learning the confidence. Rehearsal accountability is recorded when actually spoken, separately from belief in the music and permission to relay it.

Lia’s acknowledgment branches explicitly admit planning the tour without Nora while leaving her thinking her place remained open. Visible offer relays include acknowledgment before singing, shared credit, no promise about another tour and no claim that Nora has agreed. “No promise” does not mean a promise of permanent exclusion: the confirmed fact remains the next tour. Lia visibly receives the offer on a first visit; return greetings and known-condition responses fit the conversation already heard. The chronology challenge is selected verbatim and recorded in Lia’s conversation, rather than silently replacing a weaker question.

`npm run qa:local dialogue` runs eleven controlled authored browser journeys at 390×844, 390×480 and 1440×1000. Screenshots include separately scrolled speech and choice views; JSON evidence is `qa/dialogue-results.json`. Node tests also replay all 45 pre-amendment action witnesses with unchanged IDs. No save key, negotiation/consent rule, model prompt, asset or dependency changed. Tighter voices and higher interest remain editorial judgments pending fresh human play; offline fixtures do not establish real-model behavior.

## Full-cast opening voices — task 008

The eleven authored opening beats use local approved MP3s in `public/audio/intro-v1`: narrator918, Nora795, Lia1208 and Bruno294. The copied generation manifest records provider/model, mapping, provenance IDs, approved total168credits, file hashes and bytes. Approved casting samples for beats0/3/6/8 are reused verbatim; no runtime synthesis or provider links are used. Stage directions and all authored captions remain unchanged.

Sound remains opt-in through the existing control/preference. With sound off, the original silent intro timing and navigation remain. With sound on, each line uses real decoded duration and waits for both speech completion and the existing caption/cue reading time. Pause, notes, restart confirmation and hidden-tab interruption retain the current speech offset and reading progress. Muting cancels speech immediately; enabling sound again restarts only the visible line. Navigation/restart cancels stale sources and loading; the score ducks rapidly during speech, and “Music and voice volume” controls their shared master bus.

A failed, corrupt or eight-second timed-out voice shows a recoverable Retry voice warning. Captions, navigation and eventual caption-based progression remain available. Only the opening is voiced; dialogue and performance scenes retain their existing audio behavior. Saves, authored facts, agreements, consent and drafts are unchanged.

Run `QA_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node qa/run-local.cjs intro-voice opening interrupted-send dialogue agreement-exit encore scenes` for the focused offline checks. `qa/intro-voice-results.json` records all eleven real decoded durations, actual voice-bus RMS/progress, pause/resume offsets, score duck/shared gain, final natural autoplay, cancellation and controlled missing/corrupt/timeout recovery. Rendered evidence covers1440×1000,970×1067,390×844 and390×480. Metadata/hash/signal checks are not an independent listening review of every final line; physical iOS autoplay and subjective full-cast listening remain unverified. Browser QA uses isolated contexts and does not reset an existing player session. To hear the opening again from an existing save, use Start again only if you want to restart that session.
