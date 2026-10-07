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
