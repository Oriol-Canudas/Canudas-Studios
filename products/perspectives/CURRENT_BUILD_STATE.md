# Perspectives — Current Build State

Purpose: shared handoff and synchronization file for Oriol, ChatGPT and
Claude. This file is the fastest way for any collaborator to understand
**what is currently built, what is decided, what is being worked on, and
what should happen next** without reconstructing context from chat history.

## Ownership

- **Claude**: production lead for implementation.
- **ChatGPT**: product integrator / strategic continuity / review and
  synchronization.
- **Oriol**: final product decisions.

## Rule

After every meaningful build step, Claude must update this file before
reporting completion. ChatGPT will read this file plus the latest commits /
Production Log when Oriol asks for status, review, prioritization or next
steps.

---

## Current product target

**Perspectives POC — Case 002: "The Last Message"**

Core loop: `Hear → Examine → Reason → Hear again → Verdict → Reveal`

Primary validation questions (from the original brief, H1–H8):
- Is reconstructing a hidden human situation genuinely engaging?
- Does free-form AI conversation improve the experience vs. fixed dialogue?
- Does the authored-truth + character-perspective architecture produce
  believable conversation without losing consistency?
- Does the player feel they're investigating, not chatting?
- Does the visible case board create satisfying progression?
- Does the final verdict feel earned, and the reveal land?
- Does the player want another case afterward?

## Current build stage

**Stage:** Deterministic vertical slice complete, self-tested, deployed and
playable. Real LLM-driven witness dialogue (Step 6) is designed for but not
yet implemented.

## What is decided

- Case 002 ("The Last Message") is locked as authored in `src/game/caseData.ts`:
  Elena did not kill Daniel; Tom caused his death accidentally during a
  struggle over a knife Daniel himself had grabbed; Tom's legal culpability
  is deliberately left open in the reveal copy.
- Stack: Vite + React + TypeScript + Tailwind v4 + Zustand, client-only, no
  backend/auth/payments — chosen for fastest path to an iPhone-playable link.
- Witness dialogue is deterministic and state-gated (evidence discovered +
  cross-witness testimony state + ask-count "pressure"), never generated,
  for this first build.
- Instrumentation is a local-only event log (console + `localStorage`), no
  analytics infrastructure.
- Delivery: deployed to Vercel, connected to this GitHub repo so future
  pushes to `products/perspectives/` redeploy automatically. **The Vercel
  project's Root Directory setting must be `products/perspectives`** for
  that to work — confirm this is set in Project Settings → Build &
  Deployment.

## What is NOT being built yet

- Real LLM-driven witness conversation (Step 6 — next).
- Authentication, payments, multiplayer, persistence/database.
- Generalized case-authoring system (only Case 002 exists; it's hand-authored
  data, not a generator).
- Portrait art (placeholder initial-avatars only; `portraitPrompt` fields
  exist on each witness in `caseData.ts` for when real art is generated).

## Current runnable state

- `npm install && npm run dev` → http://localhost:5173
- `npx tsx scripts/selftest.ts` → 19/19 assertions pass
- Live on Vercel (ask Oriol or check the Vercel dashboard for the current
  production URL under this project).

## Current architecture

```text
GROUND_TRUTH + TIMELINE + EVIDENCE + WITNESSES   (src/game/caseData.ts)
        ↓
witnessEngine.ts  —  matches free text → topic, resolves furthest
                     truthfully-reachable testimony stage given discovered
                     evidence + cross-witness state + ask count
        ↓
store.ts (Zustand)  —  session state: discovered evidence, witness stages,
                       chat history, case board, verdict
        ↓
components/*  —  CaseHome → Hear/Examine/Reason tabs → Verdict → Reveal
```

The Case Board (`CaseBoard.tsx`) only ever renders player-discovered
`BoardEntry` items, never the master `TIMELINE` — that constant is reveal-only
and must stay that way to avoid spoiling the case.

## Current files that matter

- `README.md` — this product's build overview.
- `PRODUCTION_LOG.md` — chronological meaningful build changes.
- `CURRENT_BUILD_STATE.md` — this handoff file.
- `DECISIONS.md` — assumptions and implementation decisions made without
  needing Oriol's approval, plus what Step 6 needs from him.
- `src/game/caseData.ts` — the only place "what happened" is allowed to live.
- `src/game/witnessEngine.ts` — the consistency-enforcing layer.
- `scripts/selftest.ts` — regression harness; run this after any change to
  `caseData.ts` or `witnessEngine.ts`.

## Open product questions

- Should Step 6 fully replace deterministic dialogue with LLM output, or
  layer the LLM on top (rephrase/extend within the same stage boundaries)?
  Current design assumption: layer on top, deterministic stays as fallback
  and ground truth — not yet confirmed with Oriol.
- No decision yet on whether future cases will be hand-authored (like this
  one) or machine-assisted. Per the brief, do not build a case-generation
  system yet.

## Next build step

**Step 6 — add player-facing AI**, per the original brief:
1. Add a Vercel serverless function (e.g. `api/witness-chat.ts`) that reads
   `OPENAI_API_KEY` server-side only.
2. Feed it: the witness's `knows`/`beliefs`/the stage text already
   authored/`revealedSecrets` so far/conversation history — ask it to
   produce a natural-language utterance consistent with that stage, not a
   new one.
3. Keep the deterministic engine as the fallback and as the hard boundary
   on what can be revealed — the model rephrases/extends, it does not
   decide new facts.
4. Needs from Oriol: confirm `OPENAI_API_KEY` is set as a Vercel environment
   variable on this project (recommended over pasting it in chat).

## Sync protocol

When Claude completes a meaningful step, report:

**BUILD VERSION / COMMIT**
- commit SHA or branch / PR

**WHAT CHANGED**
- plain-language summary

**FILES**
- exact paths

**HOW TO TEST**
- exact command and expected behavior

**WHAT I DECIDED WHILE BUILDING**
- only implementation choices that did not require product approval

**PRODUCT DECISIONS NEEDED**
- explicit questions for Oriol / ChatGPT, if any

**NEXT STEP**
- one recommended next action

Then update this file so another AI can continue without needing the
original chat.
