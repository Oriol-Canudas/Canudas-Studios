# Perspectives — POC / Case 002: "The Last Message"

This folder contains the **actual production build** for the first
Perspectives playable proof of concept.

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

**Stage:** Deterministic vertical slice complete and self-tested. Real
LLM-driven witness dialogue (Step 6) not yet wired — see
[`DECISIONS.md`](./DECISIONS.md).

## Production structure

```text
products/perspectives/
  README.md
  PRODUCTION_LOG.md
  CURRENT_BUILD_STATE.md
  DECISIONS.md
  index.html
  src/
    App.tsx
    game/
      types.ts          # shared types
      caseData.ts        # LOCKED case: ground truth, timeline, evidence, witnesses
      witnessEngine.ts    # deterministic testimony-stage resolver (no generation)
      store.ts             # Zustand session state
      analytics.ts          # lightweight local event log
      verdictGrading.ts      # grades the player's verdict against ground truth
    components/           # screens: CaseHome, HearScreen, WitnessChat,
                           # EvidenceScreen, CaseBoard, VerdictScreen, RevealScreen
  scripts/
    selftest.ts          # scripted playthroughs incl. adversarial ones
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
stays consistent with the locked ground truth:

```bash
npx tsx scripts/selftest.ts
```

## Reset

"Play again" on the reveal screen wipes session state (evidence discovered,
testimony progress, the board, the verdict) but never touches the authored
case data in `src/game/caseData.ts`.

## What Oriol should be able to do

At any point, Oriol should be able to open this folder and understand:

1. what currently runs (a fully playable deterministic case, deployed);
2. what changed last (see `PRODUCTION_LOG.md`);
3. which files implement the core behavior (`src/game/caseData.ts` +
   `witnessEngine.ts` are the load-bearing ones — everything else is UI);
4. how to run/test it (above);
5. what is still unresolved (`CURRENT_BUILD_STATE.md`).
