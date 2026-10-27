# "Untouchable" — Scene & Screen Structure

Maps the design onto the existing screens (`home → introCast → game [hear/
examine/reason] → verdict → reveal`) plus the one new beat (the
confrontation scene, bridging verdict → reveal). No new top-level screens
needed — this case stays inside the proven skeleton, per the engine-fit
assessment from the original case scouting.

## Hear tab — witness availability at start

- **Marcus** — available immediately (the subject of the review).
- **Priya** — available immediately (initiated the PIP).
- **Sam** — available immediately (easy internal contact).
- **Theo** — available immediately, but guarded/nervous — low initial
  disclosure until trust is built.
- **Dana** — **not available at start.** Unlocked as soon as Theo's first
  testimony stage is reached (he mentions her: "ask Dana, she dealt with
  worse than I did") — a natural investigative lead, not an evidence gate.
  Matches the existing pattern of testimony opening new threads rather than
  everything being available from minute one.

## Examine tab — evidence gating

- **E05 (performance data)** — available from the start, no gate. Public
  company data; establishes the real business tension immediately.
- **E03 (calendar/email timeline)** — available from the start. This is the
  case's own inciting hook ("something about the timing looks off") —
  should be discoverable early, not buried.
- **E06 (second, recent informal complaint)** — unlocked after Theo reaches
  his second testimony stage (earned trust, not just time passed).
- **E02 (Dana's exit-interview transcript)** — unlocked once Dana is
  reached (via the Theo-mention lead above); she can hand it over or
  reference it directly.
- **E01 (the old, buried complaint)** — gates latest. Requires E06 already
  discovered (you have to know there's a *recent* pattern before it makes
  sense to go looking for an *old* one) — framed as a deliberate archive
  dig, not something that falls out automatically.
- **E04 (the overheard "clean reason" remark)** — the hardest to get.
  Requires Sam to reach a trust threshold (a real `askCount`/stage gate on
  his own testimony ladder, same mechanism as Case 002's Tom) before he'll
  share what he overheard.

## Reason tab — what lands on the board

Standard board-entry behavior (presenting evidence to a witness adds an
entry) — the board's accumulating entries should trace the twist order
directly: harm-pattern-confirmed (from Dana/Theo + E02/E06) →
timing-tell-confirmed (from E03/E04) → institutional-complicity-confirmed
(from E01). The board becomes a visible record of the case's own three
reversals, not just a checklist.

## Verdict screen

The four axes as specified in the design doc:
`processLegitimacy` / `harmSeverity` / `finalCall` / `escalateComplicity`.
No time pressure — matches Case 002's open, stop-whenever-ready pacing
(decided in the prior conversation).

## The confrontation scene — new beat, concretely

Triggered immediately after verdict submission, before the Reveal screen.
Not optional, not skippable — this is the climax the whole case is built
around.

- **Entry condition**: verdict submitted.
- **Selector inputs**: `finalCall` (which of the 3 outcomes) **×** Marcus's
  accumulated `demeanor` at the moment of submission. 3 outcomes × a small
  number of demeanor buckets (collapse the 7 demeanor states into roughly
  3 behavioral buckets for this selection — e.g. composed/guarded →
  receptive bucket; defensive/nervous → guarded bucket; shaken/panicking/
  resigned → raw bucket) keeps this a tractable authored matrix rather than
  21 hand-written variants.
- **Mode**: a bounded freeform `WitnessChat` scene, same engine as normal
  investigation conversation, flagged internally as a "final conversation"
  (no new evidence/relay actions available — the investigation is over,
  only the conversation itself continues). Ends after a natural close (a
  small number of exchanges) or the player explicitly choosing to end it.
- **Content rule carried over from the design doc**: regardless of outcome
  bucket, the dialogue must hold both truths — the harm was real, the
  process wasn't clean — never let one cancel the other in the generated
  text. This is a system-prompt instruction for this scene specifically,
  same mechanism as the existing leak-marker/validation safety net.

## Reveal screen

Dynamic `RevealNarrative` (before/discovered/changed/outcome, built from
real play state — same proven pattern as Case 002/Ascent) plus: a genuinely
distinct narrative branch depending on `escalateComplicity` (not a one-line
epilogue — this is the case's acknowledgment that the institution itself
is culpable, and gets space proportionate to that in the design doc), and
judgment grading across all 4 axes shown honestly and separately (a
well-reasoned `finalCall` and a "lucky"/"unlucky" read of the factual axes
are never conflated — same principle Flight 702 already established for
its own outcome matrix). The closing-statement reasoning-quality score
(see the design doc's revised axis-3 section) is shown here too, separate
from which `finalCall` branch actually played out.
