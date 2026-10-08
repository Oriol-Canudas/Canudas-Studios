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
## Question tone: cosmetic, not mechanical (2026-10-08)

Oriol asked explicitly for a judgment call: should soft/neutral/accusative
question tone have a real gameplay effect (e.g. accusative questions
provoke faster defensiveness or shut a witness down, soft questions build
trust toward a confession)? Recommendation, implemented as stated: **keep
it cosmetic this round** — a color-coded chip tag plus sharper wording for
the clearly confrontational topics, with zero effect on `resolveStage`,
pressure, or demeanor. Reasons:
- Codex's `REVIEW_HANDOFF.md` explicitly lists "charisma dice" and
  "metagame" as out of scope for the current iteration sequence. A real
  tone-affects-outcome mechanic is exactly that shape of feature, even if
  framed differently — safer to not cross that line without a direct
  conversation with both collaborators first.
- It would require re-authoring every multi-stage topic's gating to
  define what each tone actually *does* (skip a stage? change which
  `presentedText` fires? shift demeanor an extra step?) — a meaningfully
  bigger scope than "3 chips read as more varied."
- The cosmetic version still delivers what was actually asked — the
  suggestion row feels less flat and more deliberate to pick from —
  without a new system to design, author for all 5 witnesses, and test.

If Oriol wants the mechanical version later, the natural seam is
`TestimonyStage` gaining a tone-specific override (e.g. an accusative ask
could force an earlier `demeanor` jump, a soft ask could lower a
`minAskCount` threshold) — scoped as its own small iteration, not bundled
into a UI pass.

- **Validation**: extended `scripts/selftest.ts` from 27 to 47 assertions
  covering every item above (chip reachability, loosened question order,
  Marco's split stage, presenting evidence in-chat, the new grading
  table). All pass. Browser automation was unavailable in this
  environment (Chrome extension not connected) — same limitation as the
  first build — so the actual rendered interaction (mobile chip wrapping,
  the evidence picker sheet, draft preservation, an insufficient-evidence
  playthrough end-to-end) has NOT been visually verified this round and
  needs a real phone/browser pass before calling this fully validated.

## Tom's free-form conversation scene (2026-10-08)

Oriol's direction superseded the queued general belief-propagation work
mid-session: build the one consequential scene (Tom, free text as the
interface, authored facts stay authoritative) before any further UI
polish or generalization. The propagation system already in flight was
finished first (abandoning it half-done would have shipped a real
regression — see the entry above) but NOT extended further this round;
it remains backlog for other witnesses.

**The trust boundary, and where it actually lives.** Every free-form turn
passes through exactly one gate: `validateInterpretation()`
(`witnessEngine.ts`). It runs on BOTH the AI-proposed interpretation and
the deterministic fallback's own output — there is one boundary, not two,
so a future change to the AI path can't accidentally skip validation.
Concretely: a `topicId` the witness doesn't actually have is dropped; a
`citedEvidenceIds` entry not already known in that exact conversation
context is dropped; an unrecognized `intent` string (including anything
that looks like a prompt-injection attempt — tested explicitly, see
`scripts/selftest.ts` Playthrough 19) degrades to `"unclear"`. Nothing the
model says about intent, topic, or evidence is acted on until it survives
this function.

**Scope line drawn around dialogue generation.** The brief asks for
"generated dialogue," and the full version of that would have the model
write Tom's actual reply text, constrained to authorized disclosures. I
did not build that version. Instead, the model's only creative output
this round is a short performance cue (`"Tom looks away, then meets your
eyes."`) — the dialogue text is always the authored `TestimonyStage.text`
/ `presentedText` verbatim, exactly as every other witness in this app
already works. Reasoning: validating that a model-generated paraphrase of
an authored line hasn't silently dropped or added a fact is a real,
non-trivial problem ("do not assume schema validation alone guarantees
factual consistency," per the brief itself), and I have no way to test
that validation against real model behavior — there is no
`OPENAI_API_KEY` anywhere in this environment (checked: not in the repo,
no `.env` file, no Vercel CLI access to inspect or set one). Shipping an
unvalidated version of the riskiest integrity boundary in this entire
feature, sight-unseen, was the wrong trade. The narrower version ships a
complete, testable, genuinely free-text-driven scene today; widening the
model's scope to full dialogue generation is flagged as the natural next
step once real-key testing is possible, with the validation approach
(anchor-token comparison between authored and generated text, described
inline in `api/witness-chat.ts`) already sketched for whoever picks it up.

**The three behavioral test cases map onto existing machinery, not new
systems.** Section 3's accusation/evidence/empathy cases are implemented
as: a `defensiveTopics: Record<WitnessId, Set<string>>` per-topic lock,
set only by an unsupported accusation, cleared only by real evidence
(with or without empathy) — and once cleared, resolution runs through the
EXACT same `advanceTopic()` call every other witness interaction already
uses. There is no separate "AI confession path" — evidence-backed
disclosure can never produce more than what that evidence is already
authored to unlock via `requiresEvidence`. This was a deliberate choice
over building a parallel resolution system: it means the AI layer cannot,
even in principle, grant a disclosure the deterministic engine wouldn't
also allow through the picker or a lucky chip tap.

**Chips stay deterministic and now respect the lock too.** Suggestion
chips route through the pre-existing `askWitness` (topic already known
from `topicIdHint`, zero interpretation ambiguity) for every witness,
Tom included — free text is the only thing that goes through
interpretation. `askWitness` now also checks `defensiveTopics`, so a
locked topic can't be quietly bypassed by tapping its chip instead of
typing — same rule, both entry points.

**Reading evidence privately vs. presenting it.** `knownEvidenceIds` for
citation-validation purposes is `discoveredEvidence` (anything the player
has acquired/read), not `presentedEvidence[tom]` — because citing a
document BY NAME in a message to Tom is itself the explicit transmission
event (same principle as the evidence picker). Validated above the
`!topic` branch in `resolveFreeformTurn`: a citation is still recorded
into `presentedEvidence[tom]` even when the message's topic doesn't
resolve to anything, since saying "your phone records say otherwise" to
Tom is presenting it to him regardless of whether the engine found
something to advance.

**Server-side adapter is real code, not a stub — but genuinely untested
against the real API.** `api/witness-chat.ts` makes actual
`fetch()` calls to `api.openai.com`, with one retry on transient failure,
bounded `max_tokens`, a server-side disable switch
(`AI_WITNESS_CHAT_DISABLED`), and metadata-only diagnostics logging
(witness/action/model/latency/token counts — never raw message or
dialogue content, per the brief's privacy note). It returns 503 when no
key is configured, which `interpreter.ts` treats identically to a network
failure: silent fallback, never a player-facing error. I could not run
this against the real OpenAI API in this environment. Reviewed carefully
by inspection; flagged as the one piece of this feature that genuinely
needs a key before anyone can call it verified.

**Validation**: `scripts/selftest.ts` grew from 49 to 75 assertions,
covering: equivalent phrasings reaching the same topic (bounded claim —
see the test's own comment on why full paraphrase-independence is the AI
path's job), the full accusation → lock → recovery cycle, empathy-without-
evidence never unlocking anything, private-reading vs. presenting being
genuinely distinct, a simulated hallucinated/injected model response being
stripped by validation, duplicate-submission prevention, a minimal
Catalan phrasing hook, and chips respecting the defensive lock. All pass.
`npm run build` and `npm run lint` both clean. Browser automation remains
unavailable in this environment — the rendered scene (composer, loading/
retry states, performance-cue timing, mobile keyboard behavior) has NOT
been visually verified, same caveat as every round this session.

## Emotional-state portraits (2026-10-08)

Oriol's request: make demeanor changes visually cinematic (a face, not just
a badge), for both the deterministic engine and the AI scene, not on every
message. Decisions made while building it:

- **Only authored states get an image — never pad to hit a round number.**
  Oriol said "3–5 key emotions"; Marco only authors 2 demeanor states in
  the actual case data, Julia only ever authors 1 (she never changes).
  Generating images for demeanor values a witness never actually reaches
  would be wasted work and an invitation for the data to drift out of
  sync with the real content. `demeanorImages`/`demeanorLines` are
  `Partial<Record<Demeanor, ...>>` precisely so "no entry" is a normal,
  expected state, not a gap to paper over — the component falls back to
  the witness's base portrait, never a broken image.
- **Identity-anchored generation, not independent generations.** Each new
  portrait was generated via `images_generate` with the witness's
  *existing* portrait passed as a `type: "image"` reference, rather than
  re-describing the character from scratch per emotion. Independent
  generations from a text prompt alone tend to drift — different nose,
  different exact skin tone, etc. — which would have undermined "this is
  the same person, just a different moment," the entire point of the
  feature. Reviewed all 11 outputs visually before committing any of them;
  no regeneration was needed, the reference anchoring worked well on the
  first pass.
- **The reveal is driven by the same `demeanor[witnessId]` state every
  interaction path already writes to** — `askWitness`, `presentEvidence`,
  `relayRevelation`, and Tom's `sendFreeformMessage` all update it
  identically, and always did, even before this feature existed. That
  meant wiring this into `WitnessChat.tsx` once covered all 5 witnesses
  and both the deterministic and AI-driven paths for free — no per-witness
  or per-mode special-casing was needed, which is exactly what "applies
  to the deterministic part too" required.
- **Reused `IntroSequence`'s visual language** (full-bleed portrait,
  lower-third caption, auto-advance with tap-to-skip) for the new
  `EmotionReveal` component instead of inventing a second cinematic
  pattern — one established idiom for "a brief full-screen beat," used
  consistently everywhere it appears in the app.
- **Shown on open, and only on an actual state change — never per
  message.** This was explicit in the request ("not in every message")
  and matters mechanically too: a demeanor badge changing on nearly every
  reply (it already does, per-stage) would make a full-screen interrupt
  on every single one of those feel like a bug, not a feature. Gated on
  comparing against the previous demeanor via a ref, not on message count.
- Noted but not acted on this round: using similar visible "behavior
  sign" language to make the live-AI-vs-fallback distinction even more
  obvious to the player. Flagged for a future pass in PRODUCTION_LOG.md.

## Demeanor hysteresis (2026-10-08)

Oriol's report: mood was changing on nearly every question — not
natural. His explicit spec: fast to escalate (a pointed question can
flip it immediately), slow to calm down (~3-4 turns on average), no
flickering back and forth.

- **Picked 3 turns, not a range.** "Average 3-4" could mean a fixed
  value, a random jitter, or a range band. A fixed, predictable 3-turn
  cooldown is simpler to reason about, test, and tune later than
  randomizing it — and it's an avg-matching value (comfortably inside
  "3-4"), not a guess. If 3 turns reads as too fast or slow once
  actually played, it's a single constant
  (`DEMEANOR_COOLDOWN_TURNS`) to adjust, not a redesign.
- **A fixed severity ranking, not per-stage authored "is this escalation"
  flags.** Considered hand-tagging every stage's demeanor transition as
  escalating/de-escalating/neutral, which would let each author exactly
  pick the behavior per moment — but that's meaningfully more authoring
  surface for marginal gain here, since a simple ordered scale
  (`composed < guarded/resigned < nervous < defensive < shaken <
  panicking`) already captures the real cases in this case's data
  correctly (verified: Tom's actual arc, Elena's, Sofia's all resolve
  sensibly under it — see `scripts/selftest.ts` Playthroughs 24-25).
  `resigned` sits with the mid-tier states deliberately — it's quiet
  defeat after panic, not a return to calm, so it shouldn't read as
  "composed" by the cooldown logic.
- **"Turn" = a question that actually matched a live topic.** Off-topic/
  deflected asks and presenting evidence that doesn't match anything
  don't advance the cooldown clock. This was a scope call, not a
  rigorous derivation — counting every player action (including
  deflections) was the alternative, but topic-matched questions are the
  cleaner, more defensible definition of "a real exchange happened."
- **Found a real gap while implementing, fixed it in the same pass**: an
  unsupported accusation previously never touched demeanor at all — only
  a subsequent authored stage advance (if any) did. That directly
  contradicted "if a user asks a pointy question, reacts badly right
  away" — so the accusation itself now proposes an immediate "defensive"
  reaction, routed through the same escalation rule as everything else
  (no special-casing: it's just an escalation like any other).
