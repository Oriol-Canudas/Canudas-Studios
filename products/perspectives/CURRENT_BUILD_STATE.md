# Perspectives — Current Build State

Purpose: shared handoff and synchronization file for Oriol, ChatGPT and
Claude. This file is the fastest way for any collaborator to understand
**what is currently built, what is decided, what is being worked on, and
what should happen next** without reconstructing context from chat history.

## Shared review queue (2026-10-08)

Read [REVIEW_HANDOFF.md](REVIEW_HANDOFF.md) for Codex's prior playtest findings,
acceptance criteria and the implementation/review exchange. Oriol has selected
repository-based coordination: Claude implements, Codex reviews; one code editor
at a time. The agreed sequence in that handoff is integrity fixes, then actual
OpenAI conversation for Tom, then measured validation. **Claude has filled in
the "Claude result" section of that handoff — integrity fixes (step 1) are
implemented and self-tested; step 2 (OpenAI conversation for Tom) has not been
started.** The older “Next build step” and “Open product questions” below
describe the previous baseline; reconcile them after the active iteration
rather than treating them as the latest priority. No automatic agent
notification or execution is configured — Oriol still needs to trigger Codex's
review pass.

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
playable, plus four passes: (1) portraits, scene art, paced dialogue
reveal, demeanor states, Case Clarity meter, cross-witness reactions; (2)
tap-to-inspect character dossiers, an animated cold-open intro, a
text-density pass, and ambient/SFX sound; (3) intro expanded into two
slower steps — case hook, then a dedicated cast-introduction sequence
after "Begin the case"; (4) an investigation-integrity pass — spoiler-free
suggestion chips, in-chat evidence presentation, honest 3-outcome verdict
grading, authored (not parsed) board facts, and removal of the Case
Clarity %. Real LLM-driven witness dialogue (Step 6) is designed for but
not yet implemented.

**Explicit scope call (Oriol, 2026-10-07):** go deep on this one case before
going wide. Backlogged, not forgotten: RPG-style mastery/seniority
meta-progression across cases, a multi-case content pipeline, and full voice
recognition + a conversational "talking avatar" witness.

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
- No hard energy/turn-limit mechanic — the player may ask as much or as
  little as they want, per the brief. The earlier soft **Case Clarity** %
  was removed (2026-10-08, see DECISIONS.md) — it misrepresented a
  zero-investigation playthrough as partially "clear" and implied a
  completion goal. Progression is now communicated via plain counts
  (documents acquired vs. actually read, witnesses questioned).
- Witness emotional state (**demeanor**) is authored per testimony stage,
  not computed from a generic formula — keeps each witness's arc intentional.
- Cross-witness awareness is implemented as new topics on the existing
  cross-witness gating mechanism, narratively framed as the Judge (player)
  relaying testimony between witnesses — no witness ever "just knows"
  something they couldn't plausibly know.

## What is NOT being built yet

- Real LLM-driven witness conversation (Step 6).
- Cinematic (portrait-led) reveal — still a text-based reveal screen.
- RPG mastery/seniority meta-progression, multi-case content, voice
  recognition + conversational avatar — all explicitly backlogged by Oriol.
- Authentication, payments, multiplayer, persistence/database.
- Generalized case-authoring system (only Case 002 exists; it's hand-authored
  data, not a generator).

## Current runnable state

- `npm install && npm run dev` → http://localhost:5173 (or whichever port is free)
- `npx tsx scripts/selftest.ts` → 49/49 assertions pass
- Live at https://gamexperspectives.vercel.app, auto-deploys from `main`.

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
- `src/game/caseData.ts` — the only place "what happened" is allowed to live,
  including the hand-authored `EVIDENCE_FACTS` board breakdown.
- `src/game/witnessEngine.ts` — the consistency-enforcing layer; also
  `isTopicReachable` (chip visibility) and `topicForEvidence` (evidence→topic
  lookup for in-chat presentation).
- `src/game/verdictGrading.ts` — 3-outcome (correct/wrong/insufficient)
  grading per axis, plus the authored reveal notes per verdict choice.
- `src/game/demeanor.ts` — demeanor display styling.
- `public/portraits/*.jpg`, `public/scenes/*.jpg`, `public/audio/*.mp3` —
  generated assets (keep these small — see DECISIONS.md; images were 26MB
  and the ambient track 6MB before resizing/re-encoding).
- `src/game/audio.ts` — SFX/ambient; guarded for the Node-based self-test.
- `src/components/CharacterDossier.tsx`, `IntroSequence.tsx`,
  `EvidencePicker.tsx` — full-screen/overlay experiences.
- `scripts/selftest.ts` — regression harness (49 assertions); run this after
  any change to `caseData.ts`, `witnessEngine.ts`, or `store.ts`.
- `REVIEW_HANDOFF.md` — shared review queue with Codex (playtesting/review);
  read before starting the next iteration.

## Open product questions

- Should Step 6 fully replace deterministic dialogue with LLM output, or
  layer the LLM on top (rephrase/extend within the same stage boundaries)?
  Current design assumption: layer on top, deterministic stays as fallback
  and ground truth — not yet confirmed with Oriol.
- No decision yet on whether future cases will be hand-authored (like this
  one) or machine-assisted. Per the brief, do not build a case-generation
  system yet.

## Next build step

Two independent tracks are queued; which goes first is Oriol's call.

**A. Rest of the visual/UX ranked list** (items 5–8, since 1–4 are done):
1. Cinematic reveal — rebuild `RevealScreen.tsx` as a portrait-led
   walkthrough of the true timeline instead of a text wall.
2. Living portraits — subtle demeanor-driven visual feedback on the
   portrait images themselves (glow/shake/desaturate).
3. Key-line voice acting — TTS for the 2–3 most dramatic lines per
   witness (e.g. Tom's confession), as a lighter-weight stand-in for the
   backlogged full voice/avatar feature.
4. Transition polish — motion between Hear/Examine/Reason instead of
   instant tab-swaps.

**B. Step 6 — add player-facing AI**, per the original brief:
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
