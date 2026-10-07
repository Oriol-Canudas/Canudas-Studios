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

const deflectionCounters = new Map<WitnessId, number>();

export function getDeflection(witness: WitnessConfig): string {
  const n = deflectionCounters.get(witness.id) ?? 0;
  deflectionCounters.set(witness.id, n + 1);
  return witness.deflections[n % witness.deflections.length];
}
