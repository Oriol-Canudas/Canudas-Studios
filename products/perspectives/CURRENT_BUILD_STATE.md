# Perspectives — Current Build State

Purpose: shared handoff and synchronization file for Oriol, ChatGPT and
Claude. This file is the fastest way for any collaborator to understand
**what is currently built, what is decided, what is being worked on, and
what should happen next** without reconstructing context from chat history.

## Shared review queue (2026-10-08)

Read [REVIEW_HANDOFF.md](REVIEW_HANDOFF.md) for Codex's prior playtest findings,
acceptance criteria and the implementation/review exchange. Oriol has selected
repository-based coordination: Claude implements, Codex reviews; one code editor
at a time. **Both step 1 (integrity fixes) and step 2 (Tom's free-form
conversation scene) are now implemented and self-tested — see "Claude result"
in REVIEW_HANDOFF.md for the full, honest breakdown of what's verified vs.
not.** Headline: the scene is fully built and works end-to-end in
deterministic-fallback mode (no `OPENAI_API_KEY` exists in this environment —
confirmed, see below); real OpenAI calls have NOT been live-tested. The older
"Next build step" and "Open product questions" below describe the previous
baseline; reconciled where still relevant. No automatic agent notification is
configured — Oriol still needs to trigger Codex's review pass, and needs to
set `OPENAI_API_KEY` in Vercel for the live-AI path to actually activate.

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
playable, plus five passes: (1) portraits, scene art, paced dialogue
reveal, demeanor states, Case Clarity meter, cross-witness reactions; (2)
tap-to-inspect character dossiers, an animated cold-open intro, a
text-density pass, and ambient/SFX sound; (3) intro expanded into two
slower steps; (4) an investigation-integrity pass — spoiler-free
suggestion chips, in-chat evidence presentation, honest 3-outcome verdict
grading, authored board facts, removal of the Case Clarity %, plus a
generalized belief-propagation system (relay known facts to any witness,
not just 3 hardcoded reactions); (5) **Tom's free-form conversation
scene** — free text is now the primary interface for Tom specifically:
an unsupported accusation makes him defensive on that topic (recoverable,
never permanent); a real evidence citation produces a limited, authored
admission; empathy alone never unlocks anything. Built with a hard
validation boundary between interpretation and committed state (see
DECISIONS.md), a server-side OpenAI adapter (`api/witness-chat.ts`,
inert without a key), and a deterministic fallback that is what actually
runs today, end to end, with no key configured.

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

- Real-model-generated dialogue TEXT for Tom — the model's only creative
  output this round is a short performance cue; the dialogue itself stays
  the authored line verbatim. See DECISIONS.md for why this scope line
  was drawn where it was.
- Free-form conversation for any witness other than Tom.
- A general belief/trust-score engine, or any numeric persuasion mechanic
  — explicitly out of scope (Codex's "charisma dice"/metagame exclusion).
- Cinematic (portrait-led) reveal — still a text-based reveal screen.
- RPG mastery/seniority meta-progression, multi-case content, voice,
  multiplayer — all explicitly backlogged.
- Authentication, payments, persistence/database.
- Generalized case-authoring system (only Case 002 exists; it's hand-authored
  data, not a generator).

## Current runnable state

- `npm install && npm run dev` → http://localhost:5173 (or whichever port is free)
- `npx tsx scripts/selftest.ts` → 75/75 assertions pass
- `npm run build` → clean; `npm run lint` → clean
- Live at https://gamexperspectives.vercel.app, auto-deploys from `main`.
- **No `OPENAI_API_KEY` is configured anywhere** (checked: not in the repo,
  no `.env`, no Vercel CLI access in the dev environment to set one) — Tom's
  scene runs entirely on the deterministic fallback right now. Setting that
  key as a Vercel project environment variable is the one remaining step to
  light up the live-AI path; nothing else needs to change.

## Current architecture

```text
GROUND_TRUTH + TIMELINE + EVIDENCE + WITNESSES   (src/game/caseData.ts)
        ↓
witnessEngine.ts  —  matches free text → topic, resolves furthest
                     truthfully-reachable testimony stage given discovered
                     evidence + cross-witness state + ask count; also the
                     validation boundary (validateInterpretation) that
                     every free-form turn must pass through
        ↓
interpreter.ts  —  Tom only: classifies a free-text message (intent / topic /
                   cited evidence) via api/witness-chat.ts if an OpenAI key
                   exists, else a deterministic keyword fallback — same
                   contract either way, always validated before use
        ↓
store.ts (Zustand)  —  session state incl. defensiveTopics, conversationEventLog;
                       resolveFreeformTurn() decides the validated outcome,
                       reusing the same advanceTopic() every other witness uses
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
  `EvidencePicker.tsx`, `RelayPicker.tsx` — full-screen/overlay experiences.
- `src/game/interpreter.ts` — free-text interpretation for Tom: deterministic
  fallback + the client side of the AI call, always degrading silently.
- `api/witness-chat.ts` — the server-side OpenAI adapter. Reads
  `OPENAI_API_KEY` only; returns 503 (treated as "use fallback") when it's
  absent or `AI_WITNESS_CHAT_DISABLED=1` is set.
- `scripts/selftest.ts` — regression harness (75 assertions); run this after
  any change to `caseData.ts`, `witnessEngine.ts`, `store.ts`, or `interpreter.ts`.
- `REVIEW_HANDOFF.md` — shared review queue with Codex (playtesting/review);
  read before starting the next iteration.

## Open product questions

- Should the "perform" pass eventually generate the witness's actual
  dialogue text, not just a cue? Deliberately deferred — see DECISIONS.md.
  Needs real-key testing to validate safely, which hasn't been possible yet.
- Should Tom's free-form scene extend to other witnesses? Explicitly
  backlog this iteration per Oriol's instruction — not yet confirmed as
  a next step.
- No decision yet on whether future cases will be hand-authored (like this
  one) or machine-assisted. Per the brief, do not build a case-generation
  system yet.

## Next build step

Three tracks are queued; which goes first is Oriol's call.

**A. Verify the AI path for real.** Needs `OPENAI_API_KEY` set as a Vercel
project environment variable (Oriol's action — no dashboard/CLI access from
this environment). Once set: play the deployed scene, confirm `source: "ai"`
appears in messages instead of `"fallback"`, check the Vercel function logs
for the latency/token diagnostics `api/witness-chat.ts` already emits, and
validate the "perform" pass's cue quality feels right before considering any
expansion of the model's creative scope.

**B. Rest of the visual/UX ranked list** (items 5–8, since 1–4 are done):
1. Cinematic reveal — rebuild `RevealScreen.tsx` as a portrait-led
   walkthrough instead of a text wall.
2. Living portraits — subtle demeanor-driven visual feedback on the
   portrait images themselves.
3. Key-line voice acting.
4. Transition polish.

**C. General belief propagation beyond Tom's scene** — the relay system
(Section "investigation-integrity pass" below) already generalizes
cross-witness reactions; extending the accusation/evidence/empathy
mechanic itself to other witnesses is a deliberate backlog item, not
started.

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
