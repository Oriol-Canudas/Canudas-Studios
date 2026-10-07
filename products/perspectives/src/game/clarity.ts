import { EVIDENCE, WITNESSES } from "./caseData";
import type { AllWitnessStages } from "./witnessEngine";
import type { EvidenceId } from "./types";

/**
 * "Case Clarity" — a soft, non-blocking read on how resolved the player's
 * understanding is. No energy/turn limits: the brief is explicit that the
 * player may stop whenever they want and should never be required to see
 * everything. This exists purely to give the mental model itself a sense
 * of progression (H5) and a pull toward "am I ready to decide?" (H6)
 * without gating any action.
 */
export function computeClarity(discoveredEvidence: Set<EvidenceId>, witnessStages: AllWitnessStages): number {
  const evidenceScore = discoveredEvidence.size / EVIDENCE.length;

  let multiStageTopics = 0;
  let resolvedTopics = 0;
  for (const w of WITNESSES) {
    for (const t of w.topics) {
      if (t.stages.length <= 1) continue;
      multiStageTopics += 1;
      const reached = witnessStages[w.id]?.[t.id] ?? -1;
      if (reached >= t.stages.length - 1) resolvedTopics += 1;
    }
  }
  const testimonyScore = multiStageTopics > 0 ? resolvedTopics / multiStageTopics : 0;

  return Math.round(evidenceScore * 35 + testimonyScore * 65);
}

export function clarityCopy(pct: number): string {
  if (pct < 25) return "Still early. Keep asking.";
  if (pct < 55) return "A picture is forming.";
  if (pct < 85) return "You're closing in on it.";
  return "You might be ready for a verdict.";
}
