# DECISIONS — Perspective POC (Case 002: "The Last Message")

Running log of assumptions and decisions made autonomously while building,
per the brief's "decide and proceed, don't stop repeatedly for approval"
instruction. Newest at the bottom.

## Stack
- **Vite + React + TypeScript + Tailwind CSS v4, client-only, no backend.**
  Chosen over Expo/React Native because a mobile-responsive web app opens
  instantly on an iPhone via a link — no app install, no QR-scan friction —
  and the whole game is single-player with no need for native APIs. This
  was explicitly the fastest-to-playable option and the user confirmed it.
- **Zustand** for state instead of Context/Redux — minimal boilerplate, easy
  to `reset()` wholesale, trivial to read from outside React (used by the
  self-test script).
- **No database.** Game state lives in memory for the session; analytics
  events persist to `localStorage` only. Nothing here needed Convex/Supabase
  at POC scale — would reconsider if we want to compare sessions across
  players/devices later.

## Ground-truth architecture
- `src/game/caseData.ts` is the single source of truth: `GROUND_TRUTH`,
  `TIMELINE`, `EVIDENCE`, and every witness's `topics[].stages[]`. Nothing
  outside this file may introduce a new "fact." The witness engine
  (`witnessEngine.ts`) only ever selects among pre-authored stage text — it
  never generates dialogue.
- Each witness topic is a ladder of `TestimonyStage`s gated by
  `requiresEvidence`, `requiresWitnessStage` (cross-references into other
  topics/witnesses), and `minAskCount` (simple "pressure"). The engine
  always resolves to the *furthest truthfully reachable* stage given
  current state, and never regresses once a stage has been shown.
- **Caught via scripted self-test, not manual play:** a premature question
  about a gated topic was still incrementing that topic's pressure counter,
  which could let a player skip straight past a witness's actual confession
  to a later "I already told you" line once the real unlock condition was
  met. Fixed by only counting "pressure" on asks where some stage was
  actually reachable. See `scripts/selftest.ts` Playthrough 2.

## Self-testing
- No browser automation tool was available in this environment (Chrome
  extension not connected, no built-in-browser tool present). Rather than
  skip Step 9, I wrote `scripts/selftest.ts`, which runs the *actual* Zustand
  store through several realistic and adversarial playthroughs (asking
  witnesses out of order, confronting with evidence before prerequisites are
  met, re-asking the same question, double-discovering evidence) and asserts
  the resulting dialogue/board state. All 19 assertions pass
  (`npx tsx scripts/selftest.ts`). This is arguably stronger coverage of the
  consistency rule than manual clicking would have been, but it does NOT
  substitute for an actual visual/UX pass on a phone — that's on you for the
  first play.

## Case board (REASON tab)
- Deliberately does **not** render the master `TIMELINE` constant — that's
  reveal-only. The board only shows a `timeline` assembled from
  player-discovered `BoardEntry` items (facts from evidence, claims/
  contradictions from testimony), sorted by their in-world timestamp. This
  was a late catch on my own re-read: an earlier instinct would have been to
  reuse `TIMELINE` directly for convenience, which would have spoiled the
  case entirely.

## Content choices within the given case
- Evidence IDs `E01`–`E04` are available from the start (as specified);
  `E05`–`E08` (phone/garage records) are freely "requestable" at any time
  from the Examine tab — not gated behind talking to witnesses first — so
  the loop stays non-linear as required. The witness engine is what then
  gates *testimony* on having requested the right record.
- Julia's "woman in a dark coat, around midnight" sighting is deliberately
  left time-imprecise and gender/identity-ambiguous in the data so it reads
  as genuinely interpretive testimony rather than a disguised fact — this is
  the intended soft red herring per the brief's "partly reliable, partly
  interpretive" note on her.
- Verdict grading (`verdictGrading.ts`) is not pass/fail scored — it's a
  two-axis comparison (who's responsible / Elena's verdict) with narrative
  headlines, matching the brief's "what you understood vs. missed" tone
  rather than a quiz grade. Tom's legal culpability is intentionally left
  open in the reveal copy, per the brief.

## Deployment
- Delivery: deployed to Vercel per your choice. No `ANTHROPIC`/`OPENAI` key
  is used yet (see below) and no Vercel login was available in this
  environment, so the first deploy is an **anonymous temporary deployment**
  (expires in 60 minutes unless claimed). I gave you the claim link — one
  click on your end moves it into your own Vercel account permanently, no
  credentials needed from me. If you'd rather I deploy properly, run
  `vercel login` yourself and tell me, and I'll redeploy under that account.

## Monorepo restructure (2026-10-07)
- Moved from a standalone local repo (`~/dev/perspective-poc`) into
  `products/perspectives/` inside the `Canudas-Studios` GitHub repo, after
  discovering it's a structured monorepo with an explicit house rule for
  AI builders: production code must be committed there, under
  `products/<name>/`, with `README.md` + `PRODUCTION_LOG.md` +
  `CURRENT_BUILD_STATE.md`. Mirrored the same three-doc pattern already
  established by the (parked, untouched) `products/rehearsal/` product.
- The Vercel project must have its **Root Directory** set to
  `products/perspectives` for git-triggered deploys to find `package.json`.
  This is a one-time manual setting in the Vercel dashboard.

## Step 6 — AI dialogue (NOT yet wired)
- Per the build order, Steps 1–5 (deterministic vertical slice, full loop)
  were finished and self-tested before touching this.
- You said you have an OpenAI key. To wire it in safely I need it set as a
  **Vercel environment variable** (`OPENAI_API_KEY`) on the project, read by
  a small serverless function — never shipped to the client bundle. I have
  not asked you to paste it in chat on purpose; happy to take it that way
  instead if you'd rather just hand it over, your call.
- The adapter boundary (`src/game/llmAdapter.ts`, to be added) will keep the
  same contract as the deterministic engine: given a witness's `knows` /
  `beliefs` / `secrets` / `revealedSecrets` / conversation history / what's
  been discovered so far, produce an utterance — never a new fact. The
  deterministic stage text remains the authored fallback and the ground
  truth for what the model is allowed to reveal.

## Visual/UX pass (2026-10-07)
- **Portraits + scene art**: generated via Magnific (5 witness portraits,
  deliberately multicultural; 3 scene banners for Home/Evidence/Verdict).
  First pass came back as 1536×1536 / 2048×1152 PNGs mislabeled `.jpg`,
  totaling 26MB — resized and re-encoded as real JPEGs (portraits 500×500,
  scenes 1280×720) via ffmpeg before committing, down to 268KB total. Always
  check actual file size/format on generated images before wiring them into
  a mobile build, not just that they rendered.
- **"Organic" reply pacing**: implemented as a typing-indicator beat (~450ms)
  followed by a character-reveal animation scaled to length (16ms/char,
  clamped 350–2600ms total so long confessions don't drag). Tap-to-skip.
  Only the single freshest witness line animates — history and the
  player's own messages render instantly, tracked via a local ref of
  previous message count rather than new store state, to avoid replaying
  the animation every time a witness screen remounts.
- **Gamification mechanic (your open question)**: recommended against
  hard energy/turn limits since the brief explicitly argues against forcing
  completion or punishing exploration. Built **Case Clarity** instead — a
  soft 0–100% readout (`src/game/clarity.ts`) blending evidence discovered
  (35%) and testimony topics pressed to their end (65%), shown on the
  Reason tab and at the verdict moment. Purely informational, gates nothing.
- **Demeanor** (`Demeanor` type in `types.ts`, `demeanor.ts` for display
  styling): authored per-stage on witnesses already, not computed generically
  — kept each witness's emotional arc intentional (e.g. Tom guarded →
  defensive → panicking → resigned) rather than deriving a label from a
  formula. Tracked as current-state-per-witness in the store, updated only
  when a stage genuinely advances.
- **Cross-witness awareness (item 6)**: implemented as new topics using the
  *existing* `requiresWitnessStage` cross-witness gating — no new engine
  mechanism needed. Framed narratively as the Judge (the player) relaying
  what one witness said to another during cross-examination, which is both
  how real interrogation works and keeps the "characters can't know things
  they couldn't plausibly know" rule intact — nobody secretly knows another
  witness's private testimony, the player is the vector. Four new topics:
  Elena & Sofia react to learning Tom returned; Marco reacts to Tom's
  confession.
- Extended `scripts/selftest.ts` to 27 assertions covering both new
  mechanics (demeanor transitions, cross-witness topics correctly gated and
  ungated) rather than trusting them unverified.

## "Polish the one case" pass (2026-10-07)
- Oriol's call: defer the RPG mastery/seniority meta-progression and
  multi-case content pipeline — both captured as backlog — and instead make
  this single case as good as it can be. Also deferred: full voice
  recognition + a conversational "talking avatar" witness.
- **Tap-portrait dossier**: added `keyFacts: string[]` to `WitnessConfig`
  (3 short bullets per witness) rather than reusing the full `context`
  paragraph — the dossier is meant to be a glance, not a re-read.
  `CharacterDossier.tsx` is a full-screen overlay; portrait taps in both
  `HearScreen` and `WitnessChat`'s header open it. Row-tap (not on the
  portrait) still opens the chat directly — kept the fast path fast.
- **Cold-open intro**: `IntroSequence.tsx` is 4 auto-advancing full-bleed
  slides (~2.2s each, tap anywhere to skip) shown once per session, before
  `CaseHome`. Reusing `scenes/home.jpg`, `scenes/evidence.jpg`,
  `scenes/verdict.jpg`, and Elena's portrait — no new art needed for this.
  Replaying a case ("Play again") returns to the intro too, not straight to
  the case file, so the ritual repeats rather than just resetting state.
- **Text density pass**: trimmed `context` paragraphs, collapsed "what Elena
  admits" from a bulleted paragraph into inline check-chips, shortened
  subtitles across Evidence/Verdict screens. Deliberately did NOT touch the
  actual testimony content in `caseData.ts` — that's the game, not chrome.
- **Sound**: generated via Magnific (1 ambient loop + 4 SFX: evidence
  discovered, contradiction flagged, demeanor shift, verdict delivered).
  Same lesson as the images: the ambient track came back as a 6MB
  uncompressed WAV and had to be re-encoded to a 388KB MP3 before
  committing — always check generated audio file size/format too, not just
  images. `src/game/audio.ts` is a plain `HTMLAudioElement` wrapper, no
  library; it's imported by `store.ts` (SFX fire from state transitions,
  not from components) which is also exercised by the Node-based
  self-test, so every entry point is guarded behind a
  `typeof window !== "undefined"` check — otherwise `new Audio(...)` would
  crash the test harness outside a browser. Ambient only starts from the
  "Begin the case" tap (a real user gesture, required for mobile autoplay)
  and stops on reaching Reveal so the verdict gavel SFX lands in near-silence.
  Mute preference persists to `localStorage`; toggle is a fixed-position
  button (`SoundToggle.tsx`) shown on every screen except the intro.
- Reveal screen's cinematic rebuild (text → portrait-led flashback
  sequence) was NOT done this round — still a text-based reveal. That's the
  next item on the list Oriol ranked, not yet started.
