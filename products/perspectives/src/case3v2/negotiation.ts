// Pure, no network — shared escalation rule used by the authored
// comparator's local state machine AND mirrored server-side in
// api/hale-negotiate.ts (that file is deliberately self-contained with
// zero local imports, per the deploy-safety note in witness-chat.ts, so
// it reimplements this same rule rather than importing it — both copies
// must stay in sync if this ever changes).

import { commitmentRank } from "./data";
import type { Commitment } from "./types";

/** The default, "safe" path — a commitment never ACCIDENTALLY or
 * UNILATERALLY downgrades through this function. This is what makes
 * "crew_only survives a later rejected full_prep ask" true by construction.
 * It is NOT the only legal transition, though — see applyExplicitRevision
 * below for the one case where a downgrade is actually correct. */
export function applyEscalation(current: Commitment | null, proposed: Commitment | null): Commitment | null {
  if (!proposed) return current;
  if (!current) return proposed;
  return commitmentRank(proposed) >= commitmentRank(current) ? proposed : current;
}

/** The ONLY path by which a commitment may ever move down: an explicit,
 * mutually agreed revision, made before execution (i.e. still inside the
 * negotiation — once the climax ends, there's no UI left to call this
 * from, which is what makes "no revision after execution" true by
 * construction rather than a separate check). Callers (the authored
 * tree's `explicitRevision` option flag, or the server's `"revise_down"`
 * signal) are themselves the gate on what counts as "explicit" — this
 * function doesn't re-derive that, it just applies the already-decided
 * revision directly, bypassing the escalation-only rule on purpose. */
export function applyExplicitRevision(_current: Commitment | null, revised: Commitment): Commitment {
  return revised;
}
