# ARCHITECTURE — Truth / Drama / Expression

Describes the separation of concerns already present in the codebase. This
is a description of what's **CURRENT** and built, not a proposal — nothing
here required a rewrite to produce; the three-layer split is just naming
something that was already true.

## Truth engine — CURRENT

Immutable, authored canonical facts. Lives in each case's data file
(`src/game/case002.ts`, `src/game/caseAscent.ts`):

- `GROUND_TRUTH` — the actual solution, never shown to the player directly
  except paraphrased on the Reveal screen.
- `TIMELINE` — the canonical, ordered sequence of events (Case 002 only;
  Ascent has none, since its story happens during play rather than before it).
- `EVIDENCE` / `EVIDENCE_FACTS` — documents and the curated facts each one
  establishes.

Nothing outside these constants may introduce a new "fact." The LLM is
never shown `GROUND_TRUTH` and never asked to decide what actually
happened — see Expression engine below.

## Drama engine — CURRENT

Mutable state: what's currently known, believed, or disclosed, and how
each character is reacting. Lives in `src/game/store.ts`'s Zustand state
plus the per-witness authored content (`WitnessConfig.topics[].stages[]`,
`reactions`) in the case data files:

- `witnessStages` — per-witness, per-topic furthest-reached disclosure stage.
- `demeanor` / `demeanorTurnCount` / `lastDemeanorChangeTurn` — emotional
  state with hysteresis (won't flip-flop turn to turn).
- `defensiveTopics` — topics an unsupported accusation has locked.
- `relayedRevelations` — facts actually told to a witness by the player
  (never inferred from free text — only set by the explicit relay action).
- `conversationEventLog` — structured record of what each free-form turn
  established (`defensive_lock`, `evidence_admission`, `voluntary_disclosure`, etc).

`witnessEngine.ts`'s `resolveStage`/`getAuthorizedDisclosures` compute,
from this state plus the authored gates (`requiresEvidence`,
`requiresWitnessStage`, `minAskCount`, `altUnlock`), exactly what each
witness is currently authorized to say — this is deterministic and
contains zero LLM involvement. The server mirrors this exact algorithm
(`api/witness-chat.ts`'s inlined copy) and re-derives it from the raw
state the client sends, never trusting a client claim that something is
"already unlocked."

## Expression engine — CURRENT

The LLM layer (`api/witness-chat.ts`, called via `src/game/interpreter.ts`).
Two passes:

1. **Interpret** — classifies the player's free text into
   `{intent, topicId, citedEvidenceIds}`. Classification only; the model
   never decides what's true.
2. **Generate** — given the Drama engine's authorized-disclosure snapshot
   for this turn (never the raw ground truth), produces natural dialogue.
   Validated before being shown: every claimed `factRef` must be in the
   authorized set, and a leak-marker scan catches the clearest tells of an
   accidental confession on a now-sensitive topic. On any failure, the
   server substitutes the authored fallback line — the client never sees
   rejected content.

The LLM owns wording, tone, and delivery. It never owns canonical truth
and never independently mutates game state — every stage advance,
defensive lock, and board entry is decided by the deterministic engine
first; the model only narrates it.

## What this means for future work

A proposal that asks the LLM to "decide" a plot fact, invent a character's
backstory beyond what's authored, or infer state from something the player
merely *claimed* in free text (rather than a validated action like
`relayRevelation`) crosses this boundary and should be flagged rather than
built as described. See `DECISIONS.md` for the specific incidents that
established several of these rules (the "I already told you" hallucination
fix, the Elena fingerprint "not relevant" bug, etc).
