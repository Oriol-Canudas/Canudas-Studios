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

## Intro feedback round (2026-10-08)
- Oriol liked the intro, asked for it slower and to cover more — either
  case + characters in one sequence, or two steps. Recommended two steps
  (case hook → CaseHome as the breather → cast intro → game) over one
  long reel: one continuous sequence covering the case and all 5 witnesses
  would run 10+ slides before the player has any agency, even skippable.
  Splitting it also reuses CaseHome's existing static charge-card instead
  of needing to cram that content into timed slides too.
- Refactored `IntroSequence.tsx` from a hardcoded 4-slide component into a
  reusable one (`slides`/`slideMs` props, optional `eyebrow`/`title` for
  the character-intro's name+role format). Slide content now lives in
  `src/game/introSlides.ts`, not the component — same data/presentation
  split as everywhere else in this codebase.
- Slowed pacing: 2200ms → 3400ms per slide, 250ms → 450ms crossfade.
- Case intro grew from 4 to 6 slides (adds a forensic beat and a
  prosecution-case beat); new 6-slide character intro (5 witnesses + a
  closing line) plays after "Begin the case," before the Hear tab. Both
  reuse existing portrait/scene art — no new asset generation needed.
- Character-intro hook lines are intentionally different wording from each
  witness's `keyFacts` (used by the dossier) — avoids reading the same
  three bullets twice in two different UI contexts.

## Investigation-integrity pass (2026-10-08)

A structured playtest (impatient / completionist / conversational-explorer
personas) reproduced real bugs: spoiler/fabricated-premise suggestion
chips, testimony misfiled as verified fact, an "insufficient evidence"
verdict grading as the harshest possible outcome, an arbitrary forced
question order, a two-tap evidence-request bug, and a Case Clarity %
that implied a completion goal the brief explicitly argues against. Oriol
reviewed the proposed fix plan and approved it with seven adjustments
before implementation; the adjustments (not the original plan) are what's
reflected below.

- **Chip visibility vs. revelation eligibility are different gates.**
  `isTopicReachable()` (`witnessEngine.ts`) hides a suggestion chip only
  when the topic's *first* stage requires a cross-witness precondition
  that isn't true yet — i.e. only when the question's own wording would
  state something the player doesn't actually know (the 3 reactive
  topics: Elena's/Sofia's "did you know Tom also returned," Marco's
  reaction to Tom's confession). Every ordinary question stays visible
  even when the honest answer is a denial — a denial is a legitimate,
  informative answer, not a reason to hide the question. Rejected my own
  earlier draft of this fix, which would have also capped/hidden chips
  more aggressively than that.
- **Acquired / inspected / presented evidence are three distinct states.**
  `discoveredEvidence` (requested from the record, Examine tab) is
  unchanged; new `inspectedEvidence` marks a document actually opened and
  read; new `presentedEvidence` (per witness) + `presentationLog` (with
  the exact excerpt index and timestamp) track evidence shown directly to
  a specific witness in conversation. The Case Board's old "documents
  inspected" label, which actually measured possession, now correctly
  reads "documents acquired" alongside a separate "actually read" count.
- **Presenting evidence doesn't invent new gating.** `presentEvidence()`
  reuses the exact same `resolveStage` rules as asking a question —
  it just also surfaces a document picker in-chat and, via
  `topicForEvidence()`, finds the one topic (if any) that document is
  *already authored* to speak to for that witness. No new
  "unlocks-on-presentation" field, so presenting a document can never
  cascade into unrelated admissions — only the stage that document was
  always gated on, if its other conditions are also met. A
  `presentedText` variant (new, optional, on `TestimonyStage`) is used
  instead of the normal line only for the handful of flagship
  confrontations (Tom's return, Sofia's call-back, Sofia's apartment
  visit, Tom's knife account), so the reply visibly references what was
  shown rather than reading as a repeat answer.
- **Board facts are hand-authored, not parsed.** Rejected regex-extracting
  "HH:MM" lines out of evidence `details[]` strings as inferring meaning
  from display text. Added `EVIDENCE_FACTS` (`caseData.ts`) — a small,
  explicitly authored breakdown per document, each entry with its own
  time/content/epistemic type, the same editorial judgment an
  investigator writing up a document would apply. This is what now
  populates the board and timeline on evidence discovery, replacing the
  old single generic "Evidence obtained: …" blob.
- **Neutral wording for inference-prone evidence.** The 23:58 phone-unlock
  record now reads "unlocked and active for approximately 20 seconds —
  this record does not establish who used it" in both the evidence card
  and the board fact. `TIMELINE`'s omniscient, reveal-only narration (which
  *does* know Daniel was alive) is reworded to flag that distinction
  explicitly rather than stating the record "confirms" it.
- **Keyword matching stayed small on purpose.** Fixed the specific
  reproduced failures (Marco's "did you speak to him that night" was
  unanswerable before evidence existed — split into an ungated baseline
  stage + an evidence-gated specific-detail stage; Julia's topics were
  missing common phrasings) and added a modest regression set. Did not
  build an ambiguous-match clarification UI or any broader NLU layer —
  explicitly deferred, bundled with the existing (also deferred) Step 6
  LLM work, which needs the same `matchTopic`/`resolveStage` seam to stay
  clean for a future real-model layer to slot into.
- **Reveal support/challenge framing is authored, not inferred.** Rejected
  reusing the player's board entries as implicit "proof" of their verdict
  — a board entry's mere presence doesn't establish whether it supports or
  challenges a given conclusion. Added small, fixed `RESPONSIBLE_REVEAL_NOTES`
  / `ELENA_REVEAL_NOTES` tables (`verdictGrading.ts`) — one authored note
  per structured verdict option (5 + 3 = 8 total), shown with the verdict
  the player actually chose. The player's free-text theory is still shown
  on the Reveal, but as-written, explicitly uncompared against anything.
- **Verdict grading now has three outcomes per axis, not two.**
  `insufficient_evidence` grades as its own `Judgment` ("insufficient"),
  distinct from "correct"/"wrong" — 9 honest headlines instead of 4, so
  declining to convict without enough evidence never reads as "you
  believed the prosecution."
- Comparison tool (pin-a-hypothesis + mark-pairs-consistent) and
  progressive hints were explicitly deprioritized by Oriol in this same
  approval — "before expanding the comparison and hint features" — and
  are not implemented this round. Backlogged, not forgotten.
- **Validation**: extended `scripts/selftest.ts` from 27 to 47 assertions
  covering every item above (chip reachability, loosened question order,
  Marco's split stage, presenting evidence in-chat, the new grading
  table). All pass. Browser automation was unavailable in this
  environment (Chrome extension not connected) — same limitation as the
  first build — so the actual rendered interaction (mobile chip wrapping,
  the evidence picker sheet, draft preservation, an insufficient-evidence
  playthrough end-to-end) has NOT been visually verified this round and
  needs a real phone/browser pass before calling this fully validated.
