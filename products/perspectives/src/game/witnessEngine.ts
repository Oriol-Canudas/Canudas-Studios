// ─────────────────────────────────────────────────────────────────────────
// Deterministic witness response engine.
//
// This is intentionally NOT an LLM. It matches free-form player questions
// to authored topics via keyword overlap, then resolves the furthest
// testimony stage the witness can truthfully reach given:
//   - which evidence the player has discovered
//   - how many times this topic has been pressed
//   - whether a prerequisite topic (on this or another witness) has
//     already been reached
//
// A witness can NEVER say something that isn't an authored stage. There is
// no free generation here — this is the "ground truth cannot be invented"
// rule enforced structurally. See llmAdapter.ts for where a real model
// could later slot in to rephrase (not invent) these same stage texts.
// ─────────────────────────────────────────────────────────────────────────

import type { EvidenceId, TestimonyTopic, WitnessConfig, WitnessId } from "./types";

export interface WitnessStageState {
  // topicId -> highest stage index reached (−1 = never asked / not reachable yet)
  [topicId: string]: number;
}

export type AllWitnessStages = Record<WitnessId, WitnessStageState>;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

/** Best-effort keyword match of free text to one of the witness's topics. */
export function matchTopic(witness: WitnessConfig, freeText: string): TestimonyTopic | null {
  const normalized = normalize(freeText);
  const words = new Set(normalized.split(/\s+/).filter(Boolean));

  let best: { topic: TestimonyTopic; score: number } | null = null;

  for (const topic of witness.topics) {
    let score = 0;
    for (const kw of topic.keywords) {
      const kwNorm = normalize(kw);
      if (kwNorm.includes(" ")) {
        // phrase keyword: substring match against the whole question
        if (normalized.includes(kwNorm)) score += 2;
      } else if (words.has(kwNorm)) {
        score += 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { topic, score };
    }
  }

  return best?.topic ?? null;
}

function stageRequirementsMet(
  topic: TestimonyTopic,
  stageIndex: number,
  askCountAfterThis: number,
  discoveredEvidence: Set<EvidenceId>,
  allStages: AllWitnessStages
): boolean {
  const stage = topic.stages[stageIndex];
  if (!stage) return false;

  if (stage.requiresEvidence) {
    for (const ev of stage.requiresEvidence) {
      if (!discoveredEvidence.has(ev)) return false;
    }
  }
  if (stage.requiresWitnessStage) {
    const { witness, topic: otherTopic, minStage } = stage.requiresWitnessStage;
    const reached = allStages[witness]?.[otherTopic] ?? -1;
    if (reached < minStage) return false;
  }
  if (stage.minAskCount && askCountAfterThis < stage.minAskCount) {
    return false;
  }
  return true;
}

/**
 * Given the question has been resolved to `topic`, figure out the furthest
 * stage the witness can now truthfully reach. Never regresses below the
 * stage already shown.
 */
export function resolveStage(
  topic: TestimonyTopic,
  previousStage: number,
  askCountAfterThis: number,
  discoveredEvidence: Set<EvidenceId>,
  allStages: AllWitnessStages
): number {
  let reachable = -1;
  for (let i = 0; i < topic.stages.length; i++) {
    if (stageRequirementsMet(topic, i, askCountAfterThis, discoveredEvidence, allStages)) {
      reachable = i;
    }
  }
  return Math.max(reachable, previousStage);
}

/**
 * Whether a topic's suggestion chip should be shown at all right now.
 *
 * This is deliberately narrower than "can this topic advance" — an
 * ordinary investigative question (one whose first stage needs no
 * cross-witness knowledge) stays visible even when the honest answer is
 * currently a denial; a denial is a legitimate, informative answer, not a
 * reason to hide the question. The only thing that must be hidden is a
 * question whose own premise isn't yet true for the player — which only
 * happens for the handful of cross-witness reactive topics, where the
 * chip's own wording ("Tom says he came back too...") states something
 * the player doesn't actually know yet until that prerequisite is real.
 */
export function isTopicReachable(topic: TestimonyTopic, allStages: AllWitnessStages): boolean {
  const first = topic.stages[0];
  if (!first?.requiresWitnessStage) return true;
  const { witness, topic: otherTopic, minStage } = first.requiresWitnessStage;
  return (allStages[witness]?.[otherTopic] ?? -1) >= minStage;
}

/** Which of this witness's topics the given evidence is authored to speak to, if any. */
export function topicForEvidence(witness: WitnessConfig, evidenceId: EvidenceId): TestimonyTopic | null {
  for (const topic of witness.topics) {
    for (const stage of topic.stages) {
      if (stage.requiresEvidence?.includes(evidenceId)) return topic;
    }
  }
  return null;
}

const deflectionCounters = new Map<WitnessId, number>();

export function getDeflection(witness: WitnessConfig): string {
  const n = deflectionCounters.get(witness.id) ?? 0;
  deflectionCounters.set(witness.id, n + 1);
  return witness.deflections[n % witness.deflections.length];
}
