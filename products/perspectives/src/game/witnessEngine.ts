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
// rule enforced structurally.
//
// For Tom only, interpreter.ts adds an optional AI-backed layer on top:
// it may PROPOSE an interpretation of free text (intent/topic/cited
// evidence), but validateInterpretation() below is what actually decides
// whether any of that is trusted — cross-checked against real state, same
// as everything else in this file.
// ─────────────────────────────────────────────────────────────────────────

import type {
  ConversationIntent,
  EvidenceId,
  InterpretationResult,
  RevelationDef,
  RevelationId,
  TestimonyStage,
  TestimonyTopic,
  WitnessConfig,
  WitnessId,
} from "./types";

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

function normalGatesMet(
  stage: TestimonyStage,
  askCountAfterThis: number,
  discoveredEvidence: Set<EvidenceId>,
  allStages: AllWitnessStages
): boolean {
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
 * Whether a stage's requirements are met — either its normal authored
 * gates (evidence/cross-witness-stage/pressure), OR its altUnlock
 * conditions, evaluated as a plain OR, never an additional requirement on
 * top of the normal gates. relayedRevelations/currentIntent are optional
 * and default to "altUnlock never satisfied" — every existing call site
 * that omits them (chips, evidence presentation, tests) is completely
 * unaffected by this function's existence.
 */
export function stageRequirementsMet(
  topic: TestimonyTopic,
  stageIndex: number,
  askCountAfterThis: number,
  discoveredEvidence: Set<EvidenceId>,
  allStages: AllWitnessStages,
  relayedRevelations?: ReadonlySet<RevelationId>,
  currentIntent?: ConversationIntent
): boolean {
  const stage = topic.stages[stageIndex];
  if (!stage) return false;

  if (normalGatesMet(stage, askCountAfterThis, discoveredEvidence, allStages)) return true;

  if (stage.altUnlock && relayedRevelations && currentIntent) {
    const relayOk = stage.altUnlock.requiresRelayed.every((r) => relayedRevelations.has(r));
    const intentOk = stage.altUnlock.requiresIntent.includes(currentIntent);
    if (relayOk && intentOk) return true;
  }

  return false;
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
  allStages: AllWitnessStages,
  relayedRevelations?: ReadonlySet<RevelationId>,
  currentIntent?: ConversationIntent
): number {
  let reachable = -1;
  for (let i = 0; i < topic.stages.length; i++) {
    if (stageRequirementsMet(topic, i, askCountAfterThis, discoveredEvidence, allStages, relayedRevelations, currentIntent)) {
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

/** Whether the player has actually learned this revelation yet — derived, never a separate flag. */
export function isRevelationKnown(revelation: RevelationDef, allStages: AllWitnessStages): boolean {
  const { witness, topic, minStage } = revelation.source;
  return (allStages[witness]?.[topic] ?? -1) >= minStage;
}

/**
 * Whether a proactive-contact topic is currently eligible to be delivered
 * — independent of whether it already has been (callers check
 * `deliveredProactiveContacts` separately). Reuses the topic's own
 * stage-0 gates exactly like any other topic, via the same
 * `stageRequirementsMet` every other check already goes through — a
 * proactive topic authored with real requiresEvidence/requiresWitnessStage
 * on stage 0 is gated by them precisely as written. `requiresRelayedTo`
 * is the one additional check only a proactive contact needs: a fact
 * relayed to a DIFFERENT witness (never this witness's own
 * relayedRevelations, which altUnlock already covers).
 */
export function isProactiveContactEligible(
  topic: TestimonyTopic,
  allStages: AllWitnessStages,
  discoveredEvidence: Set<EvidenceId>,
  relayedRevelationsByWitness: Readonly<Record<WitnessId, ReadonlySet<RevelationId>>>
): boolean {
  if (!topic.proactive) return false;
  if (!stageRequirementsMet(topic, 0, 0, discoveredEvidence, allStages)) return false;
  const cross = topic.proactive.requiresRelayedTo;
  if (cross && !relayedRevelationsByWitness[cross.witness]?.has(cross.revelationId)) return false;
  return true;
}

export interface AuthorizedDisclosure {
  topicId: string;
  chipLabel: string;
  /** Furthest stage currently reachable, -1 if nothing on this topic is reachable yet. */
  stageIndex: number;
  /** The authored text at that stage — the actual content Tom is allowed to convey right now. Null when stageIndex is -1. */
  text: string | null;
  /** True if an unsupported accusation has locked this topic — overrides stageIndex: evade, don't discuss, even if something was technically reachable. */
  locked: boolean;
}

/**
 * The knowledge/permission boundary, made explicit and computable: for
 * every topic this witness has, what are they CURRENTLY authorized to
 * actually say, independent of what the character privately knows. This
 * is what a dialogue-generation prompt gets to work with — never the raw
 * ground truth, never "what Tom knows," only "what's authorized right
 * now." Uses the exact same `resolveStage` math everything else in this
 * engine already goes through; this isn't a parallel gating system, it's
 * a read-only snapshot of the existing one.
 */
export function getAuthorizedDisclosures(
  witness: WitnessConfig,
  allStages: AllWitnessStages,
  askCounts: Record<string, number>,
  discoveredEvidence: Set<EvidenceId>,
  defensiveTopics: ReadonlySet<string>,
  relayedRevelations?: ReadonlySet<RevelationId>,
  currentIntent?: ConversationIntent
): AuthorizedDisclosure[] {
  return witness.topics.map((topic) => {
    const prevStage = allStages[witness.id]?.[topic.id] ?? -1;
    const askCount = askCounts[topic.id] ?? 0;
    const stageIndex = resolveStage(topic, prevStage, askCount, discoveredEvidence, allStages, relayedRevelations, currentIntent);
    const locked = defensiveTopics.has(topic.id);
    return {
      topicId: topic.id,
      chipLabel: topic.chipLabel,
      stageIndex: locked ? -1 : stageIndex,
      text: locked || stageIndex < 0 ? null : topic.stages[stageIndex].text,
      locked,
    };
  });
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

/**
 * The reverse of the gating relationship every stage's requiresEvidence
 * already encodes: not "what evidence does this stage need," but "is
 * there a FURTHER stage on a topic the player has already engaged with,
 * still out of reach specifically because of evidence they haven't
 * found yet." Surfaced as a one-line nudge — reuses an authored link
 * that already existed for gating, never a new authored field. Returns
 * at most one id (the first found, in topic/stage order) so the nudge
 * never piles up multiple suggestions at once.
 */
export function suggestedEvidenceFor(
  witness: WitnessConfig,
  witnessStages: AllWitnessStages,
  discoveredEvidence: ReadonlySet<EvidenceId>
): EvidenceId | null {
  for (const topic of witness.topics) {
    const reached = witnessStages[witness.id]?.[topic.id] ?? -1;
    if (reached < 0) continue; // only nudge toward topics the player has actually engaged with
    for (let i = reached + 1; i < topic.stages.length; i++) {
      const needed = topic.stages[i].requiresEvidence;
      if (!needed) continue;
      const missing = needed.find((e) => !discoveredEvidence.has(e));
      if (missing) return missing;
    }
  }
  return null;
}

/** One place a witness's testimony actually turned on a piece of evidence the player has examined. */
export interface TestimonyLink {
  witnessId: WitnessId;
  witnessName: string;
  chipLabel: string;
  text: string;
}

/**
 * Which already-heard testimony a given piece of evidence unlocked —
 * the reverse of requiresEvidence again, but checking REACHED stages
 * across every witness rather than one. Only ever reports a stage the
 * player has actually reached, so this can't spoil a future reveal by
 * naming a line they haven't heard yet.
 */
export function testimonyLinksForEvidence(
  evidenceId: EvidenceId,
  witnesses: readonly WitnessConfig[],
  allStages: AllWitnessStages
): TestimonyLink[] {
  const links: TestimonyLink[] = [];
  for (const witness of witnesses) {
    for (const topic of witness.topics) {
      const reached = allStages[witness.id]?.[topic.id] ?? -1;
      if (reached < 0) continue;
      for (let i = 0; i <= reached; i++) {
        if (topic.stages[i].requiresEvidence?.includes(evidenceId)) {
          links.push({ witnessId: witness.id, witnessName: witness.name, chipLabel: topic.chipLabel, text: topic.stages[i].text });
        }
      }
    }
  }
  return links;
}

const deflectionCounters = new Map<WitnessId, number>();

export function getDeflection(witness: WitnessConfig): string {
  const n = deflectionCounters.get(witness.id) ?? 0;
  deflectionCounters.set(witness.id, n + 1);
  return witness.deflections[n % witness.deflections.length];
}

const defensiveCounters = new Map<WitnessId, number>();

export function getDefensiveLine(witness: WitnessConfig): string {
  const lines = witness.defensiveLines ?? witness.deflections;
  const n = defensiveCounters.get(witness.id) ?? 0;
  defensiveCounters.set(witness.id, n + 1);
  return lines[n % lines.length];
}

const VALID_INTENTS: ConversationIntent[] = [
  "accusation",
  "evidence_challenge",
  "empathetic_appeal",
  "repair",
  "general_question",
  "off_topic",
  "unclear",
];

/**
 * The hard trust boundary between "what the model proposed" and "what the
 * engine will act on." A `topicId` that doesn't exist on this witness is
 * dropped; `citedEvidenceIds` are filtered down to only evidence actually
 * known in this context (never the model's claim about what was shown);
 * an unrecognized `intent` string degrades to "unclear" rather than being
 * passed through. This runs on BOTH the AI-proposed and the deterministic-
 * fallback result, so there is exactly one trust boundary, not two.
 */
export function validateInterpretation(
  raw: Partial<InterpretationResult> | null | undefined,
  witness: WitnessConfig,
  knownEvidenceIds: ReadonlySet<EvidenceId>
): InterpretationResult {
  const intent: ConversationIntent =
    raw?.intent && VALID_INTENTS.includes(raw.intent) ? raw.intent : "unclear";
  const topicId =
    raw?.topicId && witness.topics.some((t) => t.id === raw.topicId) ? raw.topicId : null;
  const citedEvidenceIds = Array.isArray(raw?.citedEvidenceIds)
    ? raw!.citedEvidenceIds.filter((id): id is EvidenceId => knownEvidenceIds.has(id as EvidenceId))
    : [];
  const confidence = typeof raw?.confidence === "number" ? Math.max(0, Math.min(1, raw.confidence)) : 0;
  return { intent, topicId, citedEvidenceIds, confidence };
}
