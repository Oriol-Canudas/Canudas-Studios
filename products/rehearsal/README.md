# Rehearsal — V0 / The Deadline

This folder contains the **actual production build** for the first Rehearsal playable moment.

## Current product frame

The V0 is **The Deadline**, an instance of **The Pushback**.

Core loop:

`Moment → Reaction → Consequence → Inner Reveal → Replay`

Current principles:

- professional entry wedge, broader human-situation ambition;
- solve the situation first, learning is a side effect;
- cinematic and human, not coach-first and not game-first;
- first user input is fully freeform;
- Marta reacts through hidden state and subtle visual state;
- Inner Reveal explains deeper subjective meaning using data captured during play;
- no retrospective confabulation;
- hard cap of 6 Marta visual states for V0;
- terminal-first: conversation credibility before visual polish.

## V0 visual states

Exactly six:

- `open`
- `strained`
- `neutral`
- `closed`
- `distant`
- `hard`

`register` and `visualState` are separate concepts.

## Production structure

Claude should keep the implementation small and readable. Recommended initial shape:

```text
products/rehearsal/
  README.md
  PRODUCTION_LOG.md
  src/
    scenario.ts
    state.ts
    visualState.ts
    turnLog.ts
    prompts.ts
    engine.ts
    reveal.ts
    cli.ts
  tests/
```

This may evolve only when a real need appears.

## Turn log — minimum fields

Each immutable turn should retain:

- `turnIndex`
- `timestamp`
- `userMessage`
- `stateBefore`
- `registerUsed`
- `visualState`
- `proposedDelta`
- `appliedDelta`
- `stateAfter`
- `martaResponse`
- `detectedBehaviors[]`
- `innerThought`
- `interpretation`

`interpretation` is what Marta inferred, assumed, or concluded about the player/situation in that exact turn.

## Inner Reveal rule

The reveal may **select and narrate** information already captured in the turn log. It must not ask the model after the scene what Marta "was thinking".

Initial V0 selection can start with the 1–2 most meaningful state movements, while keeping room later for interpretation shift / emotional / narrative weighting.

## What Oriol should be able to do

At any point, Oriol should be able to open this folder and understand:

1. what currently runs;
2. what changed last;
3. which files implement the core behavior;
4. how to run/test it;
5. what is still unresolved.

Claude should optimize for this transparency as well as code quality.
