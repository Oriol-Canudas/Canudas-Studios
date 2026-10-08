// ─────────────────────────────────────────────────────────────────────────
// Server-side mirror of the knowledge/permission authorization algorithm
// in src/game/witnessEngine.ts (resolveStage / stageRequirementsMet /
// getAuthorizedDisclosures).
//
// WHY A MIRROR AT ALL: an earlier version of api/witness-chat.ts imported
// these functions directly from ../src/game/witnessEngine. That ran fine
// under local tsx execution but made the deployed Vercel function crash
// with FUNCTION_INVOCATION_FAILED on every request — proven by testing a
// plain rename of the api/_lib directory first (which did NOT fix it,
// ruling out an underscore-prefix bundling quirk) before concluding the
// cause is Vercel's function bundler not reliably tracing/including the
// api/ -> src/ cross-directory import graph.
//
// WHY THIS IS SMALLER THAN THE PREVIOUS FIX: the previous fix (now
// removed — see git history, api/lib/tomTopics.ts) duplicated Tom's
// actual authored CONTENT (topic text, gates) by hand. That is exactly
// the kind of divergent client/server copy to avoid. This file instead
// duplicates only the generic, content-free ALGORITHM — the actual topic
// data now travels in the request body on every turn (it's already
// public; it ships in the client JS bundle today), so there is nothing
// case-specific here to drift out of sync. If this algorithm changes in
// witnessEngine.ts, this file needs the same change — a small, stable,
// rarely-touched surface, unlike authored prose.
//
// Type shapes below are redeclared locally (not `import type` from
// src/game/types) purely out of caution: type-only imports are erased
// before bundling and almost certainly were never the actual cause of
// the crash, but this file has no need to import anything from src/ at
// all, so it doesn't.
// ─────────────────────────────────────────────────────────────────────────

export interface DisclosureStage {
  text: string;
  requiresEvidence?: string[];
  requiresWitnessStage?: { witness: string; topic: string; minStage: number };
  minAskCount?: number;
  altUnlock?: { requiresRelayed: string[]; requiresIntent: string[] };
  altUnlockText?: string;
}

export interface DisclosureTopic {
  id: string;
  chipLabel: string;
  stages: DisclosureStage[];
}

function normalGatesMet(
  stage: DisclosureStage,
  askCountAfterThis: number,
  discoveredEvidence: ReadonlySet<string>,
  allStages: Readonly<Record<string, Record<string, number>>>
): boolean {
  if (stage.requiresEvidence) {
    for (const ev of stage.requiresEvidence) {
      if (!discoveredEvidence.has(ev)) return false;
    }
  }
  if (stage.requiresWitnessStage) {
    const { witness, topic, minStage } = stage.requiresWitnessStage;
    const reached = allStages[witness]?.[topic] ?? -1;
    if (reached < minStage) return false;
  }
  if (stage.minAskCount && askCountAfterThis < stage.minAskCount) {
    return false;
  }
  return true;
}

function stageRequirementsMet(
  stage: DisclosureStage,
  askCountAfterThis: number,
  discoveredEvidence: ReadonlySet<string>,
  allStages: Readonly<Record<string, Record<string, number>>>,
  relayedRevelations: ReadonlySet<string>,
  currentIntent: string | null
): boolean {
  if (normalGatesMet(stage, askCountAfterThis, discoveredEvidence, allStages)) return true;
  if (stage.altUnlock && currentIntent) {
    const relayOk = stage.altUnlock.requiresRelayed.every((r) => relayedRevelations.has(r));
    const intentOk = stage.altUnlock.requiresIntent.includes(currentIntent);
    if (relayOk && intentOk) return true;
  }
  return false;
}

function resolveStage(
  topic: DisclosureTopic,
  previousStage: number,
  askCountAfterThis: number,
  discoveredEvidence: ReadonlySet<string>,
  allStages: Readonly<Record<string, Record<string, number>>>,
  relayedRevelations: ReadonlySet<string>,
  currentIntent: string | null
): number {
  let reachable = -1;
  for (let i = 0; i < topic.stages.length; i++) {
    if (stageRequirementsMet(topic.stages[i], askCountAfterThis, discoveredEvidence, allStages, relayedRevelations, currentIntent)) {
      reachable = i;
    }
  }
  return Math.max(reachable, previousStage);
}

export interface AuthorizedDisclosure {
  topicId: string;
  chipLabel: string;
  stageIndex: number;
  text: string | null;
  locked: boolean;
}

/**
 * Builds the {witnessId: topicId -> stage} shape requiresWitnessStage
 * gates are checked against. The authored data's requiresWitnessStage
 * entries are always self-referential (a witness's prerequisite always
 * points at their OWN other topics — verified against caseData.ts for
 * both Tom and Sofia), so this is just witnessStages keyed by the real
 * witnessId — callers outside getAuthorizedDisclosures (see
 * reachedViaAltUnlock's call site in witness-chat.ts) must build this
 * the exact same way, with the same real witnessId, or the two will
 * disagree about which stages are "normally" reachable.
 */
export function buildAllStages(witnessId: string, witnessStages: Readonly<Record<string, number>>): Record<string, Record<string, number>> {
  return { [witnessId]: witnessStages };
}

/**
 * Same shape/semantics as witnessEngine.ts's getAuthorizedDisclosures,
 * generic over whatever topic array this request sent, rather than tied
 * to one witness's hand-copied data.
 */
export function getAuthorizedDisclosures(
  witnessId: string,
  topics: DisclosureTopic[],
  witnessStages: Readonly<Record<string, number>>,
  askCounts: Readonly<Record<string, number>>,
  discoveredEvidence: ReadonlySet<string>,
  defensiveTopics: ReadonlySet<string>,
  relayedRevelations: ReadonlySet<string>,
  currentIntent: string | null
): AuthorizedDisclosure[] {
  const allStages = buildAllStages(witnessId, witnessStages);

  return topics.map((topic) => {
    const prevStage = witnessStages[topic.id] ?? -1;
    const askCount = askCounts[topic.id] ?? 0;
    const stageIndex = resolveStage(topic, prevStage, askCount, discoveredEvidence, allStages, relayedRevelations, currentIntent);
    const locked = defensiveTopics.has(topic.id);
    return {
      topicId: topic.id,
      chipLabel: topic.chipLabel,
      stageIndex: locked ? -1 : stageIndex,
      // Plain canonical content, not the altUnlock display variant — this
      // list is SOURCE MATERIAL for generation ("you may convey this, in
      // your own words"), not the final displayed line. Framing for HOW
      // this stage was reached (evidence vs. conversation) belongs in the
      // per-turn prompt note, not in this general-purpose list.
      text: locked || stageIndex < 0 ? null : topic.stages[stageIndex].text,
      locked,
    };
  });
}

/** Whether this stage, if reached, was reached ONLY via altUnlock rather than its normal gates — used to pick altUnlockText the same way the client does. */
export function reachedViaAltUnlock(
  stage: DisclosureStage,
  askCountAfterThis: number,
  discoveredEvidence: ReadonlySet<string>,
  allStages: Readonly<Record<string, Record<string, number>>>
): boolean {
  return Boolean(stage.altUnlock) && !normalGatesMet(stage, askCountAfterThis, discoveredEvidence, allStages);
}
