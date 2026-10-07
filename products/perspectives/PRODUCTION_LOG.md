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
