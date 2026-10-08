# Perspectives — Current Build State

Purpose: shared handoff and synchronization file for Oriol, ChatGPT and
Claude. This file is the fastest way for any collaborator to understand
**what is currently built, what is decided, what is being worked on, and
what should happen next** without reconstructing context from chat history.

## Shared review queue (2026-10-08)

Read [REVIEW_HANDOFF.md](REVIEW_HANDOFF.md) for Codex's prior playtest findings,
acceptance criteria and the implementation/review exchange. Oriol has selected
repository-based coordination: Claude implements, Codex reviews; one code editor
at a time. **Step 1 (integrity fixes), step 2 (Tom's free-form conversation
scene), and the live AI path are all implemented, deployed, and confirmed
working.** Oriol set `OPENAI_API_KEY` and OpenAI billing after the initial
build; the endpoint was then verified live from this session (real
`gpt-4o-mini` responses for both the interpret and perform calls — see
REVIEW_HANDOFF.md's "Claude result" for the original honest breakdown of
what was/wasn't tested as of that writing; this line post-dates it). The
older "Next build step" and "Open product questions" below describe the
previous baseline; reconciled where still relevant. Oriol still needs to
trigger Codex's review pass — no automatic agent notification is configured.

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
confirmed live and working once Oriol set `OPENAI_API_KEY` and billing
on OpenAI), and a deterministic fallback the scene silently degrades to
on any AI failure; (6) **emotional-state portraits** — 11 new,
identity-anchored expression portraits across the 5 witnesses, and a
brief cinematic "establishing shot" (`EmotionReveal.tsx`) shown on
opening a conversation and again on any real demeanor change — applies
uniformly to both the deterministic engine and Tom's AI scene, since
both already wrote to the same shared `demeanor` state.

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
- `npx tsx scripts/selftest.ts` → 80/80 assertions pass
- `npm run build` → clean; `npm run lint` → clean
- Live at https://gamexperspectives.vercel.app, auto-deploys from `main`.
- **`OPENAI_API_KEY` is set as a Vercel Production environment variable**
  (never in the repo/`.env` — Oriol set it via the dashboard) and
  confirmed live: both the `interpret` and `perform` calls in
  `api/witness-chat.ts` returned real `gpt-4o-mini` responses when
  tested directly against the deployed endpoint. Tom's scene runs on
  live AI by default now; it still degrades silently to the
  deterministic fallback on any transient failure, by design.

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
- `public/portraits/*.jpg` (16 total: 5 base + 11 emotion variants),
  `public/scenes/*.jpg`, `public/audio/*.mp3` — generated assets (keep
  these small — see DECISIONS.md; images were 26MB and the ambient track
  6MB before resizing/re-encoding; the emotion variants came back
  correctly sized this time, ~15KB each).
- `src/game/audio.ts` — SFX/ambient; guarded for the Node-based self-test.
- `src/components/CharacterDossier.tsx`, `IntroSequence.tsx`,
  `EvidencePicker.tsx`, `RelayPicker.tsx`, `EmotionReveal.tsx` —
  full-screen/overlay experiences.
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

Two tracks are queued; which goes first is Oriol's call.

**A. ~~Verify the AI path for real.~~ Done (2026-10-08).** `OPENAI_API_KEY`
is set and confirmed live. Still worth doing when Oriol has time: a real
playthrough watching for `source: "ai"` vs `"fallback"` in practice, and
checking the Vercel function logs for the latency/token diagnostics
`api/witness-chat.ts` emits, to get a real sense of cost/latency per turn
before considering any expansion of the model's creative scope (see
DECISIONS.md on why dialogue generation itself is still deferred).

**B. Rest of the visual/UX ranked list**: "Living portraits" (item 2) is
now done — in a bigger form than originally scoped (full distinct
emotion portraits via `EmotionReveal`, not a subtle glow/desaturate
treatment on one static image). Remaining:
1. Cinematic reveal — rebuild `RevealScreen.tsx` as a portrait-led
   walkthrough instead of a text wall.
2. Key-line voice acting.
3. Transition polish.

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
