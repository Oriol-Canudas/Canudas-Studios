# PERSPECTIVES — The Song Was for You

Playable concert proof of concept: [gamex-concert.vercel.app](https://gamex-concert.vercel.app).

You produce a concert whose closing slot can hold one complete song. Lia wants her solo premiere and does not want to erase Nora; Nora will not perform a reconciliation she has not agreed to. Reactive authored preparation leads to a bounded conversation with Lia, confirmation with Nora, your production cue, and a visible performance and reveal.

This is a separate product directory and Vercel project. It does not replace The Last Message, The Last Ascent or Flight 702.

## Run

Node 24; from this directory:

```sh
npm ci
npm run dev -- --port 8785
npm test
npm run build
```

For local live AI, supply `OPENAI_API_KEY` in the server process environment. Vite's development middleware runs the same API handler. No secret belongs in a `VITE_` variable, the client bundle, or version control. Without a key, authored play remains accessible and the AI entry explicitly reports that the connection is unavailable.

Production is linked to Vercel project `gamex-concert` in team `ocanudas-7641`. The existing Production secret was entered as `PerspectivesConcert`; the server accepts that name as an alias for `OPENAI_API_KEY` without revealing or recreating its value. `OPENAI_MODEL` is optional; current default is `gpt-4.1`.

```sh
npx vercel link --project gamex-concert --scope ocanudas-7641
npx vercel deploy --prod --scope ocanudas-7641
```

The current deployment uses the CLI. Git auto-deployment is not configured for this project. Do not repoint another prototype's project.

## Code and state

- `src/story.mjs`: fixed story, authored choices, discoveries, outcome packages.
- `src/engine.mjs`: preparation replay, private/communicated information separation, proposal versions and consent rules.
- `src/main.jsx` and `src/style.css`: continuous mobile/desktop experience, local save, notes, AI composer, confirmation and endings.
- `server/lia.mjs`: character context and OpenAI Responses generation with strict structured output. A separate model check reviews a proposed acceptance for semantic grounding and clarifies incomplete terms instead of silently completing the player's offer.
- `api/negotiate.mjs`: server-only credentials, signed session envelope, bounded calls, metadata diagnostics and warm-instance deduplication.
- `tests/engine.test.mjs`: deterministic state invariants.
- `qa/`: browser and live-model evaluation scripts; generated screenshots and session records stay local and are gitignored.

Past facts, private discoveries, relayed information, proposals, accepted versions and executed outcomes remain distinct. Reading a note does not inform Lia. The model controls Lia's dialogue and proposes an interpretation; it cannot edit the authored past or consent for Nora. Nora confirms the current package in an authored scene. Promising tour reconsideration, withdrawing that promise or admitting a privacy breach changes the confirmation path.

There are three agreement packages: solo, televised duet with public separation, and televised duet with separation acknowledged privately now and a joint statement tomorrow. An optional off-air encore requires both artists. No agreement is also a playable ending. This is not an unrestricted story generator.

## Prototype boundaries

- Six successful player turns in the live conversation. Invalid/failed responses preserve the draft and turn count. Up to one interpretation repair; accepted offers receive a separate grounding check. Overall server generation deadline is 48 seconds.
- Browser-local save and explicit JSON export; no database, accounts or cross-device sync. The AI envelope expires after two hours; this does not erase the local authored save or an existing agreement.
- Every model request uses `store:false`. Provider usage, request IDs and latency are recorded; raw dialogue is not written to server logs. Dialogue stays in the local browser and signed request context. Clearing the local save removes browser history for this game.
- Six turns is a gameplay limit, not a global spending cap. The 90-request/hour/IP guard and deduplication are best-effort per warm server instance. They do not guarantee global quota enforcement or protect a broadly advertised production launch.
- Grounding review is itself probabilistic. Passing the recorded examples is evidence of these examples, not proof of universal factual consistency or good persuasion quality.
- Eleven static images, restrained transitions and generated distant audience ambience with explicit mute and volume controls. No recorded character voices or full concert song.
- Responsive browser checks include 360–430 px widths and a 390×480 keyboard-sized viewport. Actual iPhone Safari/keyboard behavior and enjoyment with fresh human players remain acceptance work.

## English and immersion update

The complete case is in English: opening, authored choices and replies, notes, agreements, endings, interface and live Lia dialogue. A new local save key preserves the older Catalan session separately. The opening allows at least 12 seconds per beat, including reading time for action cues; pause, previous, next and skip controls are available. Notes, restart confirmation and hidden tabs pause the opening.

Sound is off by default pending listening review; explicitly enabling it stores the preference for a future Enter backstage gesture, and the control reflects a successfully resumed audio context. Portraits occupy a separate region above the dialogue. Lia has guarded, receptive, hurt and firm expressions, driven by the actual interpreted exchange; threat and private-disclosure events enforce firm and hurt respectively. Expressions do not grant consent. Nora is blonde in her portraits, cover and duet ending.

## Browser evaluation

Playwright is a locked development dependency. With Node 24, from this directory:

```sh
npm ci
npx playwright install chromium  # one-time browser download; or use QA_CHROME
npm test
npm run qa:local
# Run just the interrupted-send browser cases:
npm run qa:interrupted
# Existing installed Chrome can avoid the browser download (macOS example):
QA_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run qa:local
```

`qa:local` builds and starts static Vite preview on `127.0.0.1:8796`, then runs the existing authored-route, resilience and agreement-exit scripts plus interrupted-send recovery cases, sequentially. Preview has no API handler; test requests are either unavailable locally or intercepted by controlled fixtures, so this command cannot make paid model calls. It refuses an occupied port and stops preview afterward. It does not run the `live-*` or `api-cases` scripts. JSON evidence and screenshots are written under ignored `qa/` paths. `QA_PLAYWRIGHT` can still point to an existing module installation. The individual scripts below require their own local server and are separate from the safe runner; live scripts explicitly spend API tokens.

The recovery test holds a response before reload, checks both newer-draft and empty-draft cases across two reloads, and migrates an existing pending-message save. Retry keeps the original message, signed token and request ID; no reload automatically resends. A successful retry applies one server-validated fixture turn, keeps one player bubble and one reply, and preserves the newer draft. Recovery cannot determine whether the server processed the original send. Server deduplication remains best-effort, and an expired token still requires finishing with the saved agreement or starting again. Browser storage must be writable for a new message to be dispatched. Existing interrupted saves with a request ID and token are recoverable; a missing original identifier is never invented.


```sh
node qa/browser.cjs        # local authored route and unavailable API
node qa/resilience.cjs     # mocked API; failure/retry/draft/late-response behavior
node qa/live-journeys.cjs  # published public-duet and solo paths; spends API tokens
node qa/immersion.cjs      # local audio signal, pacing, portraits and responsive composer
node qa/live-emotions.cjs  # published threat/disclosure reactions; spends API tokens
node qa/api-cases.mjs      # live model probes; spends API tokens
```

The hypothesis under test is whether preparation makes the player want to intervene, and whether their own words change an agreement in a way they understand and value. A deployed app and passing technical tests do not answer that human question.

Audio repair: the original noise-and-sine synthesis was removed after user feedback. A 24-second generated backstage crowd recording now loops with overlapping fades, runs at lower gain during dialogue, and mutes in hidden tabs. No electronic startup tones or ending motifs remain. Provenance and 120-credit generation cost are in `AUDIO_ASSETS.json`. Bruno is explicitly the stage manager who coordinates crew and executes the producer’s cue. Context copy is larger, and opening speaker portraits are 70–76 pixels wide.

Current soundtrack: the 60-second cinematic score is now integrated, with a separate eight-second larger audience call. The rejected continuous crowd bed is no longer used. Audience cues occur at the first backstage hub, a later return after preparation, and the final warning in the AI conversation; cue IDs prevent replay on every navigation and a 20-second gap prevents stacking. Music ducks under the audience and during dialogue. Sound remains opt-in: use Sound on. Browser playback checks: `qa/music-crowd.cjs`.
