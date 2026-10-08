# Perspectives — Production Log

Purpose: keep a **plain-language history of meaningful build changes** so
Oriol can follow production without reading every line of code.

Each meaningful build step should append:

```text
## YYYY-MM-DD — short title

What changed
- ...

Why
- ...

Files
- ...

How to test
- ...

Current limitations / next step
- ...
```

---

## 2026-10-07 — First playable POC: deterministic vertical slice, Case 002

What changed
- Built the full Perspectives POC per the product brief: HEAR (witness
  interrogation), EXAMINE (evidence), REASON (case board), and a Judge
  VERDICT → REVEAL flow.
- Authored the complete locked case — "The Last Message" — as data, not
  prompts: ground truth, full timeline, 8 evidence items, and 5 witnesses
  (Elena, Sofia, Tom, Marco, Julia) each with progressive, evidence-gated
  testimony.
- Built a deterministic witness engine: free-text questions are matched to
  authored topics by keyword, and each witness only ever speaks a
  pre-authored "stage" — never generated text — gated by which evidence
  the player has discovered, cross-witness testimony state, and how many
  times a topic has been pressed.
- Self-tested via a scripted playthrough harness (`scripts/selftest.ts`,
  19 assertions) rather than manual browser clicking, since no browser
  automation tool was available in the build environment. This caught and
  fixed two real consistency bugs before the product was ever shown to
  Oriol:
  1. A stage-ordering bug where Tom's knife confession could be skipped
     straight past to a later "I already told you" line depending on ask
     order.
  2. A "pressure" counter bug where asking about a locked topic too early
     silently consumed pressure meant to gate a later confession.
- Deployed to Vercel (mobile-first web app, Vite + React + TypeScript +
  Tailwind + Zustand, no backend).
- Restructured the project from a standalone local repo into this monorepo
  at `products/perspectives/`, matching the convention already established
  by `products/rehearsal/`.

Why
- Core architectural hypothesis under test: can an LLM-native conversation
  layer coexist with a fixed, authored ground truth without the model being
  allowed to invent or contradict canonical facts? The deterministic engine
  proves the state-machine half of that; Step 6 will test the generative
  half.
- Oriol needs this playable on his phone within hours, not a design doc.

Files
- `src/game/caseData.ts`, `src/game/types.ts`, `src/game/witnessEngine.ts`,
  `src/game/store.ts`, `src/game/verdictGrading.ts`, `src/game/analytics.ts`
- `src/components/*` (CaseHome, HearScreen, WitnessChat, EvidenceScreen,
  CaseBoard, VerdictScreen, RevealScreen, TabBar, Portrait)
- `scripts/selftest.ts`
- `DECISIONS.md`, `README.md`, `CURRENT_BUILD_STATE.md`

How to test
- `npm install && npm run dev` → http://localhost:5173, or open the live
  Vercel URL on a phone.
- `npx tsx scripts/selftest.ts` for the scripted consistency self-test.

Current limitations / next step
- No real LLM is wired in yet — all witness dialogue is deterministic
  (authored, state-gated). Oriol has an OpenAI key ready; Step 6 is to add
  a server-side adapter (Vercel serverless function reading
  `OPENAI_API_KEY`, never exposed client-side) that can rephrase/extend
  within the same knowledge/belief/secret boundaries, with the deterministic
  engine remaining the authored fallback and ground truth.
- No automated visual/UX QA pass was possible in this build environment
  (no connected browser tool) — first real visual check is Oriol playing it
  on his phone.

---

## 2026-10-07 — Visual/UX pass: portraits, scene art, pacing, demeanor, Case Clarity, cross-witness reactions

What changed
- Generated and wired in real character portraits (5 witnesses, deliberately
  multicultural) and 3 cinematic scene banners (Home/Evidence/Verdict),
  replacing initials-only avatars and flat screens.
- Witness replies now reveal at a human reading/typing pace (brief "typing…"
  beat, then a scaled character-by-character reveal, tap to skip) instead of
  appearing instantly.
- Bumped body text sizes app-wide (15px → 17px chat/evidence/board text,
  proportional bumps elsewhere) in response to "too text-heavy."
- Added a **Case Clarity** meter (`src/game/clarity.ts`) — a soft 0–100%
  read on how resolved the player's understanding is (evidence found +
  testimony topics pressed to their end), shown on the Reason tab and at
  the verdict moment. Deliberately not a hard energy/turn-limit mechanic —
  see DECISIONS.md for why.
- Added a **demeanor** system: each witness now has a visible emotional
  state (Composed/Guarded/Defensive/Nervous/Shaken/Panicking/Resigned)
  authored per testimony stage, shown as a badge on the witness list and in
  the chat header.
- Added **cross-witness reactions**: 4 new topics (Elena & Sofia react to
  learning Tom returned that night; Marco reacts to Tom's confession),
  built on the existing cross-witness `requiresWitnessStage` gating — no
  new engine mechanism needed.
- Extended the self-test harness from 19 to 27 assertions to cover the two
  new mechanics.

Why
- Oriol's direct feedback after playing the deterministic build: wanted
  portraits, organic-feeling dialogue, bigger text, more visual variety,
  a clearer sense of character emotional state, and testimony that doesn't
  feel siloed per-witness.

Files
- `src/game/clarity.ts`, `src/game/demeanor.ts` (new)
- `src/game/types.ts`, `src/game/caseData.ts`, `src/game/store.ts` (demeanor
  + portrait fields, 4 new topics)
- `src/components/TypewriterText.tsx`, `TypingIndicator.tsx`,
  `DemeanorBadge.tsx` (new); `Portrait.tsx`, `WitnessChat.tsx`,
  `HearScreen.tsx`, `CaseHome.tsx`, `EvidenceScreen.tsx`,
  `VerdictScreen.tsx`, `CaseBoard.tsx`, `RevealScreen.tsx`, `TabBar.tsx`
  (updated)
- `public/portraits/*.jpg`, `public/scenes/*.jpg` (new assets)
- `scripts/selftest.ts` (8 new assertions)

How to test
- `npm run dev` → http://localhost:5173, or the live Vercel URL.
- `npx tsx scripts/selftest.ts` → 27/27 should pass.

Current limitations / next step
- Step 6 (real LLM-driven dialogue) still not wired — unchanged from last
  entry, still blocked on `OPENAI_API_KEY` as a Vercel env var.
- Portrait/scene images were generated oversized (26MB total, PNGs
  mislabeled `.jpg`) and had to be resized/re-encoded before committing —
  worth remembering for any future asset generation in this project.

---

## 2026-10-07 — "Polish the one case": dossier, cold-open intro, text density, sound

What changed
- Oriol's direction: defer the RPG meta-progression and multi-case content
  pipeline (both backlogged), focus entirely on making Case 002 excellent.
  Also backlogged: full voice recognition + a conversational witness avatar.
- Tap any witness portrait (witness list or chat header) to open a
  full-screen character dossier — portrait, demeanor, 3 key facts, a
  "Question [name]" CTA straight into chat.
- Added a 4-slide animated cold-open before the case file loads (reuses
  existing scene art + Elena's portrait, tap to skip), replayed each time
  "Play again" is used rather than dropping straight back to the case file.
- Trimmed copy across Home/Evidence/Verdict screens — shorter subtitles,
  "what Elena admits" collapsed into check-chips instead of a bulleted
  paragraph. Did not touch the actual testimony content — that's the game.
- Added sound: a looping ambient tension bed plus 4 SFX (evidence
  discovered, contradiction flagged, demeanor shift, verdict delivered),
  generated via Magnific. Mute toggle persists to `localStorage`, visible
  on every screen except the intro.

Why
- Direct product decision from Oriol after playing the deterministic +
  first visual build: prioritize depth on one case over breadth of
  features, since the open commercial question is "is this experience
  itself excellent," not "how much content exists yet."

Files
- `src/components/CharacterDossier.tsx`, `IntroSequence.tsx`,
  `SoundToggle.tsx` (new)
- `src/game/audio.ts` (new) — guarded for the Node-based self-test, which
  imports `store.ts`, which now calls into it
- `src/game/types.ts`, `caseData.ts` (keyFacts, trimmed context strings)
- `src/App.tsx`, `HearScreen.tsx`, `WitnessChat.tsx`, `CaseHome.tsx`,
  `EvidenceScreen.tsx`, `VerdictScreen.tsx` (updated)
- `public/audio/*.mp3` (new assets)

How to test
- `npm run dev`, or the live Vercel URL — tap a portrait, replay the case
  to see the intro again, listen for SFX on evidence/contradictions/verdict.
- `npx tsx scripts/selftest.ts` → still 27/27 (no store-logic changes this
  round, pure UI/asset additions).

Current limitations / next step
- Reveal screen is still a text wall — the cinematic portrait-led
  walkthrough is next on Oriol's ranked list, not started this round.
- Generated ambient audio came back as a 6MB uncompressed WAV, re-encoded
  to a 388KB MP3 before committing — same oversized-asset lesson as the
  images, now true for audio too.
- Step 6 (real LLM dialogue) still unstarted, still needs `OPENAI_API_KEY`.

---

## 2026-10-08 — Intro: slower pacing, two-step case + cast sequence

What changed
- Oriol's feedback on the intro: loved it, wanted it slower and to cover
  more — recommended and built a two-step structure instead of one long
  reel: extended case-hook intro (now 6 slides, 3400ms each, 450ms
  crossfade, both up from 2200ms/250ms) → CaseHome (unchanged, serves as
  the breather) → new 6-slide character intro (one beat per witness, plays
  right after "Begin the case") → into the Hear tab.
- `IntroSequence.tsx` is now a reusable, prop-driven component (`slides`,
  `slideMs`, optional per-slide `eyebrow`/`title`) instead of one hardcoded
  sequence — both intros share it. Slide content lives in
  `src/game/introSlides.ts`.

Why
- Direct product feedback from Oriol after playing it. The two-step
  structure (vs. one combined sequence) was a judgment call — reasoning
  captured in DECISIONS.md.

Files
- `src/components/IntroSequence.tsx` (refactored to be generic)
- `src/game/introSlides.ts` (new — case + character slide content)
- `src/App.tsx` (new `introCast` screen state between CaseHome and the game)

How to test
- `npm run dev`, or the live Vercel URL. Replay via "Play again" to see
  both intros again from the top.
- `npx tsx scripts/selftest.ts` → still 27/27 (no store-logic changes).

Current limitations / next step
- Same as last entry: cinematic reveal, living portraits, key-line voice
  acting, transition polish (Oriol's ranked items 5–8), and Step 6
  (LLM dialogue) are all still pending, unstarted this round.

---

## 2026-10-08 — Investigation-integrity pass: spoilers, evidence presentation, honest grading

What changed
- A structured playtest reproduced real bugs across the engine, the board,
  and the reveal. Oriol reviewed the fix plan and approved it with seven
  explicit adjustments before any code was written (see DECISIONS.md for
  the full list); this entry describes what was actually built.
- **Suggestion chips no longer state premises the player doesn't know
  yet.** A chip is hidden only when its question would presuppose a
  cross-witness fact that isn't true yet (3 reactive topics); every
  ordinary question — even ones that currently get a denial — stays
  visible. Chips now wrap instead of clipping in a horizontal scroll.
- **"Present evidence" inside conversations.** A new icon button beside
  the question input opens a picker over only the evidence already
  requested from Examine; picking a specific excerpt line presents it to
  the witness in-chat, who replies with a variant line that explicitly
  references what was shown. Acquired (`discoveredEvidence`), inspected
  (`inspectedEvidence`, new), and presented (`presentedEvidence` +
  `presentationLog`, new, per-witness, with the exact excerpt recorded)
  are now three distinct, separately tracked states.
- **Evidence two-tap bug fixed**: requesting an undiscovered document now
  opens its detail view on the same tap, instead of requiring an
  identical-feeling second tap.
- **Testimony vs. verified fact.** Tom's knife confession is now recorded
  on the board as a `claim`, not a `fact` — matching ground truth isn't
  the same as player-verified.
- **Arbitrary question-order bug removed.** Tom's "did you see anyone" /
  "did you go up" / "the argument" no longer form a forced chain —  all
  three are independently askable once he's admitted returning, in any
  order. Sofia's apartment-visit admission no longer has an extra,
  unearned dependency on her call-back admission.
- **Board facts are now explicitly authored**, not parsed from display
  text — a new `EVIDENCE_FACTS` table in `caseData.ts` gives each document
  a small, hand-written breakdown (time + content + epistemic type),
  replacing the old single generic "Evidence obtained: …" entry. The case
  timeline is no longer testimony-only.
- **Neutral wording for the 23:58 phone-unlock record** — now states it
  doesn't establish who used the phone, in both the evidence card and the
  board fact; the reveal's omniscient timeline narration is reworded to
  flag that distinction rather than claim the record "confirms" it.
- **Keyword matching**: fixed Marco's "did you speak to him that night"
  being unanswerable before any evidence existed (split into an
  ungated baseline stage + an evidence-gated detail stage) and widened
  Julia's keyword coverage for the reproduced phrasings. Kept
  deliberately small — no ambiguous-match clarification UI, no broader
  NLU layer this round.
- **Verdict grading now has three honest outcomes per axis** (correct /
  wrong / insufficient) instead of two — "insufficient evidence" on both
  axes no longer collapses into the harshest "you believed the
  prosecution" headline. 9 distinct headlines total.
- **Reveal reworked**: the support/challenge framing per verdict choice is
  now a small set of hand-authored notes (`RESPONSIBLE_REVEAL_NOTES` /
  `ELENA_REVEAL_NOTES`), not an inference from the player's board. The
  player's free-text theory is shown as-written, explicitly not scored.
  The full ground-truth timeline is now behind a "show the complete
  story" expand instead of forced on first view. "six minutes later" →
  corrected to 46 minutes (23:06 to 23:52).
- **Case Clarity % removed entirely** (`clarity.ts` deleted) — replaced
  with plain, honest counts (documents acquired / actually read,
  witnesses questioned) on both the Case Board and the Verdict screen.
- Draft text per witness now lives in the store (`drafts`), surviving tab
  navigation away from a conversation, not just component remounts.
- Comparison tool and progressive hints were explicitly deprioritized by
  Oriol in the same approval and are not part of this round.

Why
- Direct product correction from Oriol after a structured playtest
  surfaced real integrity problems — not polish, but the UI occasionally
  showing or implying something the engine didn't actually know yet.

Files
- `src/game/types.ts` (`EvidenceFact`, `presentedText`), `caseData.ts`
  (`EVIDENCE_FACTS`, loosened Tom/Sofia gating, Marco's split stage,
  keyword additions, neutral wording), `witnessEngine.ts`
  (`isTopicReachable`, `topicForEvidence`), `store.ts` (`inspectedEvidence`,
  `presentedEvidence`, `presentationLog`, `drafts`, `presentEvidence`
  action, shared `advanceTopic` helper), `verdictGrading.ts` (rewritten),
  `analytics.ts` (2 new event types)
- `src/game/clarity.ts` — deleted
- `src/components/EvidencePicker.tsx` (new), `WitnessChat.tsx`,
  `EvidenceScreen.tsx`, `CaseBoard.tsx`, `VerdictScreen.tsx`,
  `RevealScreen.tsx` (all updated)
- `scripts/selftest.ts` — grew from 27 to 47 assertions

How to test
- `npx tsx scripts/selftest.ts` → 47/47 pass.
- `npm run dev` or the live Vercel URL — present evidence from inside a
  conversation, try Tom's follow-ups out of order, deliver an
  insufficient-evidence verdict, check the Case Board's new counts and
  attributed claims.

Current limitations / next step
- Browser automation was unavailable in this environment (Chrome
  extension not connected) — same limitation noted in the very first
  build log entry. Everything above is verified against the real store
  via `scripts/selftest.ts`, not against the rendered page. A real
  phone/browser pass — chip wrapping on a narrow screen, the evidence
  picker sheet, draft preservation across tabs, an actual
  insufficient-evidence playthrough end-to-end, and reset — is still
  needed before calling this fully validated.
- Comparison tool and progressive hints (Oriol's items C3/C5) remain
  unbuilt, deprioritized behind this integrity pass.
- Cinematic reveal, living portraits, key-line voice acting, transition
  polish, and Step 6 (LLM dialogue) are all still unstarted.

---

## 2026-10-08 — UX polish: intro layout, chip cap + tone, evidence status

What changed
- **Character-intro layout**: caption moved from dead-center to a lower-
  third band (`IntroSequence.tsx`) so the portrait's face is no longer
  covered by text; gradient now only darkens the bottom band instead of
  the whole frame. Applies to both intro sequences (shared component).
- **Suggestion chips capped at 3** (`WitnessChat.tsx`): not-yet-asked
  topics are prioritized in authored order and sliced to 3; asking one
  sinks it behind the others, surfacing the next reachable topic — no
  new state needed, purely derived from existing stage data.
- **Question tone** (`QuestionTone` in `types.ts`): every topic now
  carries a cosmetic `soft` / `neutral` / `accusative` tag, color-coding
  its chip, and several confrontational chip labels were reworded sharper
  (e.g. Tom's "What did you do after you left?" → "Where did you really
  go after you left, Tom?"). Deliberately flavor-only — no mechanical
  effect on gating, pressure, or demeanor. See DECISIONS.md for why.
- **Evidence status badges** (`EvidenceScreen.tsx`): cards now show a
  "🔒 Locked" / "● New" / "✓ Read" badge reusing the existing
  acquired/inspected distinction, instead of relying on dashed-border
  alone to signal "not yet requested."

Why
- Direct playtest feedback from Oriol: intro text overlapped faces,
  conversation chip rows ate too much screen space, and evidence cards'
  acquired/pending states weren't visually clear enough.

Files
- `src/components/IntroSequence.tsx`, `WitnessChat.tsx`, `EvidenceScreen.tsx`
- `src/game/types.ts` (`QuestionTone`), `caseData.ts` (tone tags + reworded labels)

How to test
- `npm run dev` or the live Vercel URL — check a witness's face stays
  clear during the cast intro, that only 3 chips ever show per witness,
  and that evidence cards read Locked/New/Read correctly through a
  request → open cycle.
- `npx tsx scripts/selftest.ts` → 49/49 (no engine/gating logic changed,
  so assertion count is unchanged from the previous entry).

Current limitations / next step
- Tone is cosmetic only this round — see DECISIONS.md for the tradeoff
  if Oriol wants it to have a real mechanical effect later.
- Not every topic got a hand-sharpened label — the clearly confrontational
  ones were prioritized; purely factual topics kept their original wording.

---

## 2026-10-08 — Round 2 UX fixes: scroll-while-typing, panel contrast, evidence status

What changed
- **Scroll-while-typing bug fixed**: the auto-scroll used to only fire once
  per message/animation state change, not per character — so a long
  witness reply being typed out could grow past the bottom of the
  visible area and sit there until the whole animation finished (reads
  as "lagging" / "text disappearing"). Replaced with a `ResizeObserver`
  on the message list that keeps the view pinned to the bottom the
  entire time text is being typed, gated by whether the player is
  already near the bottom (so scrolling up to reread isn't fought).
- **Conversation vs. controls contrast**: the message history and the
  chip-row/input footer used to be the same near-black tone, reading as
  one continuous surface. The footer now sits on a subtly lighter panel
  (`#171319`) so "how you ask" is visually distinct from "what was
  said" — intentionally subtle, not a hard divider.
- **Evidence status redesign**: "Locked" read as permanently
  unavailable, which fought its own "tap to request" subtitle. Renamed
  to a cool-toned "🔎 Request" badge (dashed sky-blue card) that reads as
  "available, not yet pulled," not "forbidden." Requesting a document now
  plays a brief flash/glow "discover" beat (480ms) on the card before its
  detail sheet opens, instead of request-and-open happening in the same
  instant. New/Read badges unchanged — Oriol liked those already.

Why
- Second round of direct playtest feedback from Oriol on the integrity-
  pass build.

Files
- `src/components/WitnessChat.tsx`, `EvidenceScreen.tsx`

How to test
- `npm run dev` or the live Vercel URL — ask a witness something with a
  long reply and confirm the view stays pinned to the bottom throughout
  the typing animation, not just at the end; request a locked evidence
  card and watch for the discover flash before the sheet opens.
- `npx tsx scripts/selftest.ts` → still 49/49 (UI-only changes, no engine
  logic touched).

Current limitations / next step
- Browser automation still unavailable in this environment — these fixes
  are verified by code review and the self-test suite, not by actually
  watching the animation in a browser. Worth a real check on Oriol's end.

---

## 2026-10-08 — Intro-1 music: retry the autoplay unlock on any real tap

What changed
- Oriol reported intro-1's music missing. Not a regression — nothing in
  `audio.ts`/`App.tsx` had changed since the original "best-effort
  autoplay" fix; the mount-time `playAmbient()` call in `App.tsx` simply
  has no real user gesture behind it, so strict autoplay policies (mobile
  Safari, Chrome's engagement heuristic) can silently block it. It likely
  "worked" before because tapping to skip the intro happened to double as
  the unlocking gesture; letting it auto-advance without tapping leaves
  it silent until "Begin the case."
- `IntroSequence.tsx`'s tap-to-skip handler now also calls `playAmbient()`
  before advancing — any real tap during either intro (not just the
  explicit "Begin the case" button) now retries the unlock. Safe no-op if
  it's already playing.

Why
- Direct playtest report from Oriol.

Files
- `src/components/IntroSequence.tsx`

How to test
- `npm run dev` or the live Vercel URL — load fresh, tap anywhere during
  intro-1 (not just wait for it to auto-advance), confirm ambient audio
  starts. `npx tsx scripts/selftest.ts` → still 49/49.

Current limitations / next step
- A page load with zero taps during intro-1 may still be silent on
  strict browsers until "Begin the case" — that's a hard platform
  restriction (no gesture = no guaranteed autoplay-with-sound), not
  something fixable from app code. Browser automation still unavailable
  in this environment, so this is verified by code review, not by
  actually hearing it.

---

## 2026-10-08 — Tom's free-form conversation scene (the AI-conversation iteration)

What changed
- **Free text is now the real interface for Tom.** The player can type
  anything — English or Catalan, short or long — and the engine
  interprets it as one of: an unsupported accusation, an evidence-backed
  contradiction, an empathetic appeal, an ordinary question, or
  off-topic. Three behavioral rules, all backed by the same authored
  stage data every other witness already uses, nothing invented:
  - **Accusing Tom without evidence** makes him defensive on that
    specific topic — he stonewalls, but it's never a permanent lock.
  - **Citing real evidence** (by name, in free text, or via the existing
    evidence picker) produces a limited, authored admission — exactly
    what that evidence is already gated to unlock, never more.
  - **Empathy alone, with no evidence, unlocks nothing.** Politeness is
    not a key. Empathy *combined with* real evidence can reopen a
    defensive topic.
- **A hard validation boundary** (`validateInterpretation` in
  `witnessEngine.ts`) sits between "what the model (or the deterministic
  fallback) proposed" and "what the engine will act on" — topic ids,
  evidence citations, and intent strings are all cross-checked against
  real state before anything happens. Runs identically whether the
  proposal came from a live model call or the fallback.
- **Server-side OpenAI adapter** (`api/witness-chat.ts`, new) — real
  `fetch()` calls to OpenAI, one retry on transient failure, bounded
  output, a disable switch, metadata-only diagnostics logging. Returns
  503 when no key is configured; the client treats that identically to
  any other failure — silent fallback, the scene never breaks.
- **The model's creative scope is deliberately narrow this round**: it
  classifies the player's intent and may add a short performance cue
  ("Tom looks away, then meets your eyes.") — it does NOT write Tom's
  actual dialogue. That stays the authored line verbatim. See
  DECISIONS.md for why this line was drawn here.
- **Chat UI rebuilt** (`WitnessChat.tsx`): prominent free-text composer,
  a loading state while a turn is in flight, a retry affordance if a
  turn fails end-to-end, an honest "guided matching — live AI not
  connected" indicator when running on fallback, performance cues shown
  as brief italic stage directions, reduced-motion support throughout,
  and the evidence/relay pickers both still available alongside typing.
  Chips remain available as a reliable shortcut and now respect a
  defensive lock the same as free text does.
- **Reveal extended**: a new "what your questioning of Tom established"
  section built from a real event log (`conversationEventLog`),
  explicitly labeled as his disclosures, not independently verified
  facts.
- Finished the belief-propagation generalization that was already in
  flight when this request landed (3 hardcoded cross-witness reactions →
  a data-driven relay system covering 6 revelations across all 5
  witnesses) rather than leaving it half-migrated — further expansion of
  that system is backlog, per Oriol's explicit "focus on Tom" scope call.

Why
- Direct product request: build the actual differentiator ("I discovered
  this because I knew how to conduct the conversation") as one complete,
  playable scene — not another plan, not a general simulation for every
  witness first.

Files
- New: `api/witness-chat.ts`, `src/game/interpreter.ts`,
  `src/components/RelayPicker.tsx`
- Rewritten: `src/components/WitnessChat.tsx`
- Extended: `src/game/types.ts`, `witnessEngine.ts`, `store.ts`,
  `caseData.ts` (Tom's `defensiveLines`, `REVELATIONS`), `analytics.ts`,
  `RevealScreen.tsx`, `TypewriterText.tsx` (reduced-motion `instant` prop)
- Config: `tsconfig.node.json` now also type-checks `api/**/*.ts`

How to test
- `npm run dev` or the live Vercel URL → open Tom → type freely:
  - Try "you went back after you left and killed him, didn't you" (locks
    `after_that` defensive) then "after you left, your phone records
    show you actually went back" once E07 is discovered (lifts it).
  - Try empathy with zero evidence while locked — confirm nothing moves.
  - Try presenting evidence through the 📄 picker instead — same
    recovery, different entry point.
- `npx tsx scripts/selftest.ts` → 75/75 (grew from 49).
- `npm run build` && `npm run lint` → both clean.

Real API tested? No — no `OPENAI_API_KEY` exists in this environment
(confirmed: not in the repo, no `.env`, no Vercel CLI access). Everything
above runs on and is verified against the deterministic fallback, which
is what the deployed app actually runs today. Setting the key as a
Vercel environment variable is the one remaining step for the live path;
see REVIEW_HANDOFF.md's "Claude result" for the full honest breakdown
(automated / manual-browser / live-API / human-validation, reported
separately as asked).

Current limitations / next step
- Model-generated dialogue text (not just a cue) is explicitly deferred —
  needs real-key testing to validate safely first.
- Browser automation still unavailable in this environment — the
  rendered composer, loading/retry states, cue timing, and mobile
  keyboard behavior have NOT been visually verified.
- Free-form conversation is Tom-only; other witnesses are unchanged.
  Extending it further, and whether to widen the model's dialogue scope,
  are both open product questions for Oriol.
