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
