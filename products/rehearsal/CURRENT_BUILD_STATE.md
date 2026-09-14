# Rehearsal — Current Build State

Purpose: shared handoff and synchronization file for Oriol, ChatGPT and Claude.

This file is the fastest way for any collaborator to understand **what is currently built, what is decided, what is being worked on, and what should happen next** without reconstructing context from chat history.

## Ownership

- **Claude**: production lead for implementation.
- **ChatGPT**: product integrator / strategic continuity / review and synchronization.
- **Oriol**: final product decisions.

## Rule

After every meaningful build step, Claude must update this file before reporting completion.

ChatGPT will read this file plus the latest commits / Production Log when Oriol asks for status, review, prioritization or next steps.

Do not use this file as a diary. Keep it concise and current.

---

## Current product target

**Rehearsal V0 — The Deadline**

Core loop:

`Moment → Reaction → Consequence → Inner Reveal → Replay`

Primary validation question:

> Does the user feel real causality, get a genuine insight from the Inner Reveal, and voluntarily want to go back in with a different approach?

## Current build stage

**Stage:** Production starting / terminal-first V0

## What is decided

- First Moment: The Deadline / Pushback pattern.
- Player speaks freely from the first turn.
- Hidden state drives Marta's behavior.
- `register` and `visualState` are separate concepts.
- V0 visual states capped at 6: `open`, `strained`, `neutral`, `closed`, `distant`, `hard`.
- Visual state is logged now; images are attached later.
- Turn history is immutable.
- Each turn captures Marta's interpretation at that moment.
- Inner Reveal must be grounded in captured turn data, never invented retrospectively.
- Build terminal-first; no UI required for first proof.

## What is NOT being built yet

- Visual UI
- Voice
- Authentication
- Database / persistence infrastructure
- Analytics stack
- Progression / meta systems
- Monetisation
- Multiple Moments
- Platform architecture

## Current runnable state

Not yet implemented.

Claude should replace this section with:
- exact command to run;
- prerequisites;
- what currently works;
- what is mocked;
- known limitations.

## Current architecture

To be filled from the first implementation.

Keep this at product-readable level first, then list important code modules and paths.

## Current files that matter

- `README.md` — repository-level source-of-truth rules.
- `products/rehearsal/README.md` — Rehearsal build overview.
- `products/rehearsal/PRODUCTION_LOG.md` — chronological meaningful build changes.
- `products/rehearsal/CURRENT_BUILD_STATE.md` — this current-state handoff.

Add only important runtime files here as they appear.

## Open product questions

None should block the first terminal prototype.

If implementation exposes a true product decision, write it here clearly instead of silently choosing a direction.

## Next build step

Implement the smallest runnable terminal conversation with Marta:

1. freeform player input;
2. hidden state update;
3. causal Marta response;
4. `register` and `visualState` selection;
5. immutable per-turn log including `interpretation`;
6. ending / consequence;
7. grounded Inner Reveal from captured turns.

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

Then update this file so another AI can continue without needing the original chat.
