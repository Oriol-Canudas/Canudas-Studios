# Perspectives — Current Build State

Purpose: shared handoff and synchronization file for Oriol, ChatGPT and
Claude. This file is the fastest way for any collaborator to understand
**what is currently built, what is decided, what is being worked on, and
what should happen next** without reconstructing context from chat history.

## Shared review queue (2026-10-10)

Read [REVIEW_HANDOFF.md](REVIEW_HANDOFF.md) for Codex's prior playtest findings,
acceptance criteria and the implementation/review exchange. Oriol has selected
repository-based coordination: Claude implements, Codex reviews; one code editor
at a time.

**Step 7 (conversational depth / cross-witness causal loop) is implemented,
deployed, and live-verified** — see the new "Claude result" entry in
REVIEW_HANDOFF.md dated 2026-10-10 for the full breakdown. Headline: Tom's
AI pipeline is now generalized to Sofia (not Tom-exclusive anymore), and a
real conversational route — not evidence — can now change what a witness
is willing to disclose, demonstrated end-to-end on the live deployment: a
player can get Sofia to admit her visit, and later get Tom to confess the
knife, **without ever presenting evidence for either**, purely by relaying
what they learned and addressing each witness's own fear. This is on top
of generated dialogue text itself (not just a cue) being live and verified
for both witnesses — superseding the "cue-only, Tom-only" framing in the
rest of this file below, which is kept as a historical record of steps 1–6.

**Also worth flagging to Codex explicitly**: a genuine, significant
production bug was found and fixed this round — `api/witness-chat.ts` had
been returning `FUNCTION_INVOCATION_FAILED` on every single live request
since the step-2 contextual-conversation work, meaning the live AI path
was NEVER actually working in production despite being reported as
"confirmed live and working" in this file and in REVIEW_HANDOFF.md's prior
"Claude result" entry. Players were silently getting the deterministic
fallback the entire time. Root cause and fix are in the new REVIEW_HANDOFF.md
entry's "Production incident" section — flagging here because it means the
confidence level on the OLD "Claude result" entry below was wrong, not
just incomplete.

Oriol still needs to trigger Codex's review pass — no automatic agent
notification is configured.

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

(7) **conversational depth / a real cross-witness causal loop** — the
problem this round addressed: witnesses ran out of conversation after a
few authored exchanges, and Tom's own AI layer, while generating real
dialogue, was still bounded by the exact same finite ladder as everyone
else, so it ran dry too once all topics hit their final authored stage.
Rather than just making replies sound less repetitive, this round proves
conversation can change what's actually *available*:
- The interpret→authorize→generate→validate pipeline is generalized from
  Tom-only to any witness with `WitnessConfig.freeformEnabled` — now Tom
  **and Sofia**. Each gets real generated dialogue (not a cue bolted onto
  an authored line — the dialogue text itself is model-generated,
  validated, bounded).
- New `TestimonyStage.altUnlock`: an authored alternate route onto an
  *existing* stage via (a) a revelation actually relayed to that witness
  (never the player's unverified claim) plus (b) the player's classified
  intent (e.g. empathetic_appeal) — evaluated as a plain OR against the
  normal evidence/witness-stage/pressure gates, never a new fact invented.
  Live-verified closed loop: Tom admits he returned (evidence) → relayed
  to Sofia + her fear addressed → Sofia voluntarily admits her own visit,
  **no evidence ever needed** → that becomes `sofia_visited` → relayed
  back to Tom + his fear addressed → Tom voluntarily confesses the knife,
  **no evidence ever needed**. The model only ever classifies intent; the
  deterministic engine evaluates the actual gate.
- New `"repair"` intent: an apology for an earlier accusation is never
  reclassified as a fresh accusation just because it mentions one (a real
  bug existed here independent of this feature — `witnessEngine.ts`'s
  intent whitelist didn't have `"repair"` either, caught by a new test).
- Reactions can be `generative: true` — a relay's authored line becomes
  an anchor paraphrased through the same validated pipeline instead of a
  single fixed sentence forever, so the player can follow up on a
  witness's reaction in their own words. Used for a new `reactions
  .sofia_visited` entry on Tom.
- `validateDialogue` now also scans the generated **cue**, not just the
  dialogue, for leak markers — a real gap in the previous round's
  validation, fixed as part of this one.
- `api/witness-chat.ts` no longer hand-mirrors any witness's authored
  content server-side — the client sends its own public topic data in
  the request; the server keeps only the generic, content-free
  authorization algorithm. See "Production incident" in REVIEW_HANDOFF.md
  for why this file is now a single self-contained file with zero local
  imports at all.
- Live-verified (`gpt-4o-mini`, real deployed endpoint, not fixture-only):
  the full causal loop above, an accusation→repair exchange correctly
  distinguished from a fresh accusation, a false claim about another
  witness correctly NOT confirmed, an exhausted topic restated without
  being verbatim, and English/Catalan (Catalan needed one follow-up fix —
  see REVIEW_HANDOFF.md).

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

- Free-form conversation for Elena, Marco, or Julia — this round
  deliberately generalized the mechanism (so adding a 3rd/4th/5th witness
  is now "author `freeformEnabled: true` + a `CHARACTER_CONTEXT` entry,"
  not new engine code) but only actually authored it for Tom and Sofia,
  per "generalize only what Tom and Sofia need."
  Elena/Marco/Julia remain fully deterministic.
- A general belief/trust-score engine, or any numeric persuasion mechanic
  — explicitly out of scope (Codex's "charisma dice"/metagame exclusion).
  Demeanor + its authored causes remain the only "emotion" mechanic.
- Witness-initiated conversational agency beyond the existing one-shot
  authored reactions (e.g. a witness proactively asking the player a
  question). Deliberately deferred — see "Trade-offs" in REVIEW_HANDOFF.md's
  new entry.
- More `altUnlock`/`generative` relay pairs beyond the one Tom↔Sofia loop
  authored this round — the mechanism generalizes; the content doesn't
  yet, by design (small slice, not "more conversation everywhere").
- Cinematic (portrait-led) reveal — still a text-based reveal screen.
- RPG mastery/seniority meta-progression, multi-case content, voice,
  multiplayer — all explicitly backlogged.
- Authentication, payments, persistence/database.
- Generalized case-authoring system (only Case 002 exists; it's hand-authored
  data, not a generator).

## Current runnable state

- `npm install && npm run dev` → http://localhost:5173 (or whichever port is free)
- `npx tsx scripts/selftest.ts` → **115/115 assertions pass** (up from 80)
- `npm run build` → clean; `npm run lint` → clean
- Live at https://gamexperspectives.vercel.app, auto-deploys from `main`.
- **`OPENAI_API_KEY` is set as a Vercel Production environment variable**
  (never in the repo/`.env` — Oriol set it via the dashboard) and
  **re-confirmed live as of 2026-10-10** after fixing the production
  incident described in REVIEW_HANDOFF.md: both Tom's and Sofia's
  `converse` action return real `gpt-4o-mini`-generated dialogue (not
  just a cue) against the deployed endpoint. Degrades silently to the
  deterministic fallback on any transient failure, by design — and this
  round added a live-observed example of that safety net actually
  firing (see REVIEW_HANDOFF.md's Scenario 4).

## Current architecture

```text
GROUND_TRUTH + TIMELINE + EVIDENCE + WITNESSES   (src/game/caseData.ts)
  — WITNESSES now includes TestimonyStage.altUnlock (conversational
    alt-route) and reactions[x].generative — authored for Tom + Sofia
        ↓
witnessEngine.ts  —  matches free text → topic, resolves furthest
                     truthfully-reachable testimony stage given discovered
                     evidence + cross-witness state + ask count + (NEW)
                     relayed revelations + this turn's classified intent
                     (altUnlock, evaluated as an OR against the normal
                     gates — 2 new optional params, every pre-existing
                     call site unaffected); also the validation boundary
                     (validateInterpretation) every free-form turn passes
        ↓
interpreter.ts  —  any witness.freeformEnabled (Tom, Sofia): classifies a
                   free-text message via api/witness-chat.ts if an OpenAI
                   key exists, else a deterministic keyword fallback —
                   same contract either way, always validated before use.
                   Sends the witness's own full public topic data + a
                   compact conversationMemory projection + relayedFacts.
        ↓
store.ts (Zustand)  —  session state incl. defensiveTopics,
                       conversationEventLog, relayedRevelations;
                       resolveFreeformTurn() decides the validated
                       outcome (now incl. "repair" and "voluntary_
                       disclosure" as distinct TurnEventKinds), reusing
                       the same advanceTopic() every witness uses.
                       relayRevelation() is now async: a `generative:
                       true` reaction calls the server's "relay" action
                       to paraphrase its authored anchor, falling back
                       to the anchor verbatim on any failure.
        ↓
api/witness-chat.ts  —  SINGLE self-contained file, zero local imports
                        (see REVIEW_HANDOFF.md's "Production incident" —
                        this shape is deliberate, not an oversight).
                        "converse" (2-pass: interpret → authorize →
                        generate → validate) and "relay" (1-pass
                        paraphrase of an anchor) actions.
        ↓
components/*  —  CaseHome → Hear/Examine/Reason tabs → Verdict → Reveal.
                 RevealScreen's "what your questioning established"
                 section now also surfaces voluntary_disclosure events.
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
- `src/game/interpreter.ts` — free-text interpretation for any
  `freeformEnabled` witness: deterministic fallback + the client side of
  the AI call (`converseWithWitness`, `generateRelayReaction`), always
  degrading silently.
- `api/witness-chat.ts` — the server-side OpenAI adapter. **Single
  self-contained file, intentionally zero local imports — see
  REVIEW_HANDOFF.md's "Production incident" before adding any
  `api/lib/*` file back; that exact shape caused a live-production
  crash twice.** Reads `OPENAI_API_KEY` only; returns 503 (treated as
  "use fallback") when it's absent or `AI_WITNESS_CHAT_DISABLED=1` is set.
- `scripts/selftest.ts` — regression harness (**115 assertions**); run this
  after any change to `caseData.ts`, `witnessEngine.ts`, `store.ts`,
  `interpreter.ts`, or `api/witness-chat.ts`.
- `REVIEW_HANDOFF.md` — shared review queue with Codex (playtesting/review);
  read before starting the next iteration.

## Open product questions

- Should Elena, Marco, and/or Julia get `freeformEnabled` + authored
  character context next, now that the mechanism is proven on 2
  witnesses? The engine work is done; this is now purely a content/
  authoring decision (and a cost/latency one — see Next build step).
- Should more `altUnlock`/`generative` relay pairs be authored across the
  rest of the cast, now that the Tom↔Sofia loop has proven the pattern
  live? Each one is a deliberate, hand-authored addition, not something
  that should be generated/inferred.
- Should the accusation/defensive-lock mechanic stay bundled with
  `freeformEnabled`, or become its own separate flag? Flagged as an
  explicit trade-off in REVIEW_HANDOFF.md — e.g. Julia probably shouldn't
  ever "lock" the way Tom/Sofia do, but could still benefit from
  non-repetitive generated replies.
- No decision yet on whether future cases will be hand-authored (like this
  one) or machine-assisted. Per the brief, do not build a case-generation
  system yet.

## Next build step

**A. Human product validation** — still the biggest gap across every
round so far: whether players actually notice "because I shared this,
they told me something they wouldn't have otherwise" without being told
to look for it. Nothing in this round's automated/live-API testing can
substitute for that.

**B. Decide on widening `freeformEnabled`/`altUnlock` content** to Elena/
Marco/Julia, per the open questions above — purely an authoring decision
now, no new engine work required.

**C. Rest of the visual/UX ranked list** (unchanged from before this
round): cinematic portrait-led reveal, key-line voice acting, transition
polish — all still backlogged, untouched this round.

**D. Watch Vercel's function logs for real cost/latency** now that two
witnesses generate dialogue instead of one — bounded at 2 OpenAI calls
per turn per witness either way, but worth a real look before widening
further.

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
