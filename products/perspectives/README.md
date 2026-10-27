# Perspectives — POC

This folder contains the **actual production build** for Perspectives.
It now supports more than one case: Case 002 ("The Last Message") and
"The Last Ascent" both exist as complete, playable cases, and the app
always runs exactly one of them at a time — see "Multiple cases" below.

## Core product frame

> **You are the Judge.**

The player is presented with a case involving incomplete evidence,
conflicting testimony, hidden motives and unreliable perspectives. They can
inspect evidence, call witnesses, question them freely, compare accounts,
detect contradictions, reconstruct the timeline, and deliver a verdict
whenever they decide they know enough.

Core loop:

`Hear → Examine → Reason → Hear again`

Current principles:

- the world has a fixed, authored ground truth — the AI/engine layer never
  invents or changes canonical events;
- perspectives are mutable: witnesses can misunderstand, omit, or reveal
  gradually, but never contradict what they could plausibly know;
- conversation is the AI-native mechanic, but it is not the whole game —
  evidence is deterministic and the Case Board is where reasoning happens;
- the player may stop and deliver a verdict whenever they choose; 100%
  completion is never required;
- do not auto-solve contradictions for the player — the "aha" belongs to
  them.

## Current build stage

**Stage:** Two complete, self-tested cases. Real LLM-driven witness
dialogue is wired and live (OpenAI, `api/witness-chat.ts`) for the
witnesses marked free-form in each case — deterministic chip-based
testimony is the always-available fallback for everyone else, and
automatically if the AI call fails for any reason. See
[`DECISIONS.md`](./DECISIONS.md).

## Multiple cases

`src/game/caseData.ts` is a one-line re-export pointer (`export * from
"./caseAscent"` or `"./case002"`) — every component imports case data
from this path, never from a specific case file, so switching the whole
app to a different case locally is changing that one line. For
deployment, `scripts/select-case.mjs` runs automatically before every
build (`prebuild`) and overwrites that same line from an `ACTIVE_CASE`
env var, so **separate Vercel projects can deploy the identical
commit/branch and each still serve a different case**. Only one case is
ever active at a time — there is no in-app case library yet (deliberately
deferred, see `DECISIONS.md`).

## Production structure

```text
products/perspectives/
  README.md
  PRODUCTION_LOG.md
  CURRENT_BUILD_STATE.md
  DECISIONS.md
  ARCHITECTURE.md
  CHARACTERS.md
  index.html
  src/
    App.tsx
    game/
      types.ts          # shared types
      caseData.ts        # re-export pointer to the active case (see above)
      case002.ts          # Case 002: "The Last Message" — full case content
      caseAscent.ts        # "The Last Ascent" — full case content
      witnessEngine.ts      # deterministic testimony-stage resolver (no generation)
      interpreter.ts         # client-side free-form intent classifier + AI-call wrapper
      store.ts                 # Zustand session state
      audio.ts                   # ambient/SFX playback, persisted mute
      analytics.ts                 # lightweight local event log
      verdictGrading.ts             # grades the player's verdict against ground truth
    components/           # screens: CaseHome, HearScreen, WitnessChat,
                           # EvidenceScreen, CaseBoard, VerdictScreen, RevealScreen
  api/
    witness-chat.ts       # the only serverless function — LLM-backed witness dialogue,
                           # with a per-witness knowledge-boundary/leak-prevention layer
  scripts/
    select-case.mjs      # build-time case switcher (see "Multiple cases" above)
    selftest.ts            # Case 002 scripted playthroughs incl. adversarial ones
    selftest.ascent.ts      # The Last Ascent's own scripted playthroughs
    selftest-all.mjs         # runs BOTH suites in one command — see "Self-test" below
```

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
```

## Self-test

Runs the actual game store through several scripted playthroughs (including
adversarial ones — asking witnesses out of order, confronting with evidence
too early, re-asking the same question) and asserts the dialogue/board state
stays consistent with each case's own ground truth. Both cases' suites
hardcode that case's own witness/evidence ids and only run meaningfully
while `caseData.ts` points at the matching case file — so run both together,
regardless of which case is currently checked in as active:

```bash
npm run selftest      # runs scripts/selftest.ts (Case 002) and
                       # scripts/selftest.ascent.ts (The Last Ascent),
                       # temporarily pointing caseData.ts at each in turn
                       # and restoring it to its original content when done
```

To iterate on one case's suite directly: `npx tsx scripts/selftest.ts` or
`npx tsx scripts/selftest.ascent.ts` — but only while `caseData.ts` actually
points at that case, or it fails for reasons unrelated to a real regression.

## Reset

"Play again" on the reveal screen wipes session state (evidence discovered,
testimony progress, the board, the verdict) but never touches the authored
case data in `src/game/caseData.ts`.

## What Oriol should be able to do

At any point, Oriol should be able to open this folder and understand:

1. what currently runs (two fully playable cases, deployed, with real
   LLM-driven witness dialogue live for free-form witnesses);
2. what changed last (see `PRODUCTION_LOG.md`);
3. which files implement the core behavior (each case's own file,
   `witnessEngine.ts`, and `api/witness-chat.ts` are the load-bearing
   ones — everything else is UI);
4. how to run/test it (above);
5. what is still unresolved (`CURRENT_BUILD_STATE.md`).
