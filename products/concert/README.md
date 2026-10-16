# PERSPECTIVES — The Song Was for You

Concert web prototype: [gamex-concert.vercel.app](https://gamex-concert.vercel.app). **Encore v05 published16 October2026**; see `CURRENT_BUILD_STATE.md` for deployment and evidence. Controlled QA does not establish real-model semantics or human enjoyment.

The main set has finished. Lia fronts the band; Nora co-writes and sings many of its songs, a core creative member. Backstage, Nora sees a booking confirmation excluding her from the next tour and refuses their customary shared encore. Reactive authored discovery and explicit relays prepare a bounded negotiation with Lia. Nora answers the actual offer, and the producer gives a separate performance cue.

Four outcomes use one song: shared encore with public next-tour acknowledgment; private acknowledgment before singing, agreed stage space and jointly approved statement tomorrow; band and Lia without Nora; no encore. The future tour cannot be rewritten, romance is not payment for performance, and neither notes nor mood grant knowledge or consent. This isolated product does not replace The Last Message, The Last Ascent or Flight 702.

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

## Saves, requests and limits

Encore uses `perspectives-concert-encore-v05` and build `concert-encore-v05`. Old two-song sessions remain untouched under `perspectives-concert-v2-en`; a cover notice offers a sanitized JSON export. They are not silently migrated into a different authored past. Downloaded exports omit top-level and nested request tokens. Browser saves do not sync across devices.

A pending request is durably recorded before dispatch. Reload shows delivery unconfirmed; retry reuses the original message, token and request ID and preserves a newer draft. Reload never automatically resends. Restart ignores a late response. Old-story start requests and signed tokens are rejected before replay/provider invocation. AI envelopes expire after two hours; local saves and existing agreements remain. Server deduplication and rate limits are best-effort per warm instance, not exactly-once inference or a global spend cap.

Six successful substantive turns; failed/invalid generations do not spend one. Up to one interpretation repair, separate grounding audit for acceptance or revision of an earlier acceptance, overall48-second server deadline. Requests use `store:false`; server logs contain usage/request metadata, not raw dialogue. Model interpretation/audit remains probabilistic.

## Verification and media

`qa:local` builds then starts **static** preview on127.0.0.1:8796 and runs eight sequential suites: authored browser route, resilience, interrupted-send, agreement-exit, opening, hierarchy, encore and dialogue. It strips provider environment variables, refuses a busy port and stops preview afterward. Every API interaction is unavailable or a controlled browser fixture; the runner cannot invoke paid generation. New encore cases cover public professional, private professional relay, Lia-first without Nora, tour-promise correction, love breach/refusal, private-condition revision, six-turn no agreement legacy isolation/export, provider-fixture actor withdrawal, solo-refusal fallback protection and source-aware notes. Existing `live-*` and `api-cases` scripts are historical two-song probes, are **not v05 acceptance tests**, and must be updated before any separately authorized paid semantic evaluation.

Worker checks cover43 Node tests, production build and controlled Chromium journeys including390×844,390×480 and desktop. Independent QA is a separate gate. None of these establish real-model persuasion, physical iOS keyboard/touch behavior or fresh-player enjoyment.

Existing art and soundtrack are reused. Sound is opt-in: a60-second cinematic score with separate8-second stronger audience calls; dialogue ducking, cue spacing and hidden-tab muting remain. Portraits keep their own region; Lia's guarded/receptive/hurt/firm images reflect interpreted interaction, never consent. No new media or recorded singing was created for v05.

## Authored dialogue amendment — task 005

Nora’s optional love disclosure now stops before rehearsal exposition. The next three responses protect privacy and choose between authorized professional context, asking about rehearsals, or returning to tonight’s needs. The professional-only route remains viable without learning the confidence. Rehearsal accountability is recorded when actually spoken, separately from belief in the music and permission to relay it.

Lia’s acknowledgment branches explicitly admit planning the tour without Nora while leaving her thinking her place remained open. Visible offer relays include acknowledgment before singing, shared credit, no promise about another tour and no claim that Nora has agreed. “No promise” does not mean a promise of permanent exclusion: the confirmed fact remains the next tour. Lia visibly receives the offer on a first visit; return greetings and known-condition responses fit the conversation already heard. The chronology challenge is selected verbatim and recorded in Lia’s conversation, rather than silently replacing a weaker question.

`npm run qa:local dialogue` runs ten controlled authored browser journeys at 390×844, 390×480 and 1440×1000. Screenshots include separately scrolled speech and choice views; JSON evidence is `qa/dialogue-results.json`. Node tests also replay all 45 pre-amendment action witnesses with unchanged IDs. No save key, negotiation/consent rule, model prompt, asset or dependency changed. Tighter voices and higher interest remain editorial judgments pending fresh human play; offline fixtures do not establish real-model behavior.
