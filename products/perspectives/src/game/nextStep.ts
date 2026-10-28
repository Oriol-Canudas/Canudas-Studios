import type { EvidenceId, EvidenceItem, WitnessConfig, WitnessId } from "./types";

export type NextStepSuggestion =
  | { kind: "talk"; witnessId: WitnessId; text: string }
  | { kind: "examine"; text: string }
  | { kind: "decide"; text: string };

/**
 * A single, always-current "what should I do now?" nudge, computed purely
 * from state every case already tracks — no new authored content, so
 * every case gets this for free. Priority order models what a genuinely
 * helpful colleague would say next:
 *   1. Someone is actively waiting to talk to you (a proactive contact
 *      just became eligible) — always the most urgent thing.
 *   2. Someone you haven't spoken to at all yet.
 *   3. There's still something left in the record you haven't pulled.
 *   4. Nothing left to do but decide.
 * Returns null only when there are zero witnesses/evidence to reason
 * about (shouldn't happen for a real case, but keeps this honest).
 */
export function computeNextStep(params: {
  witnesses: WitnessConfig[];
  evidence: EvidenceItem[];
  wantsToTalk: (witnessId: WitnessId) => boolean;
  hasSpokenTo: (witnessId: WitnessId) => boolean;
  discoveredEvidence: Set<EvidenceId>;
}): NextStepSuggestion | null {
  const { witnesses, evidence, wantsToTalk, hasSpokenTo, discoveredEvidence } = params;
  if (witnesses.length === 0) return null;

  const waiting = witnesses.find((w) => wantsToTalk(w.id));
  if (waiting) return { kind: "talk", witnessId: waiting.id, text: `${waiting.name} wants to talk to you.` };

  const unmet = witnesses.find((w) => !hasSpokenTo(w.id));
  if (unmet) return { kind: "talk", witnessId: unmet.id, text: `You haven't spoken with ${unmet.name} yet.` };

  const stillToPull = evidence.length - discoveredEvidence.size;
  if (stillToPull > 0) {
    return {
      kind: "examine",
      text: stillToPull === 1 ? "There's one more record worth pulling." : `There are ${stillToPull} more records worth pulling.`,
    };
  }

  return { kind: "decide", text: "You've spoken to everyone and pulled every record — ready to decide?" };
}
