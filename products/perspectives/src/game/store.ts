import { create } from "zustand";
import { EVIDENCE, EVIDENCE_BY_ID, EVIDENCE_FACTS, REVELATIONS, WITNESS_BY_ID, WITNESSES } from "./caseData";
import { track } from "./analytics";
import { playSfx } from "./audio";
import { converseWithWitness, defaultCueFor, generateRelayReaction } from "./interpreter";
import {
  getDefensiveLine,
  getDeflection,
  isRevelationKnown,
  matchTopic,
  resolveStage,
  stageRequirementsMet,
  topicForEvidence,
  validateInterpretation,
  type AllWitnessStages,
} from "./witnessEngine";
import type {
  BoardEntry,
  ConversationEvent,
  ConversationIntent,
  Demeanor,
  EvidenceId,
  InterpretationResult,
  PerformanceCue,
  PlayerVerdict,
  RevelationId,
  TestimonyTopic,
  TurnEventKind,
  WitnessConfig,
  WitnessId,
} from "./types";

export interface ChatMessage {
  role: "player" | "witness" | "evidence" | "relay";
  text: string;
  topicId?: string;
  /** Free-form conversation only: a short authored/generated stage direction. */
  cue?: PerformanceCue;
  /** Free-form conversation only: whether this reply came from a live model call or the deterministic fallback — surfaced in the UI, never hidden. */
  source?: "ai" | "fallback";
  /** Set on a player message when its turn failed end-to-end (see sendFreeformMessage) — offers a retry instead of silently losing it. */
  failed?: boolean;
}

export interface PresentationRecord {
  witnessId: WitnessId;
  evidenceId: EvidenceId;
  excerptIndex: number;
  t: number;
}

export interface RelayRecord {
  witnessId: WitnessId;
  revelationId: RevelationId;
  t: number;
}

interface GameState {
  discoveredEvidence: Set<EvidenceId>;
  /** Evidence whose detail view has actually been opened and read — distinct from merely having requested/acquired it. */
  inspectedEvidence: Set<EvidenceId>;
  /** Evidence shown directly to each witness in conversation — distinct from the player simply possessing it. */
  presentedEvidence: Record<WitnessId, Set<EvidenceId>>;
  /** Full record of each presentation, including which excerpt was shown. */
  presentationLog: PresentationRecord[];
  /** Which revelations have already been relayed to which witness — never re-tellable. */
  relayedRevelations: Record<WitnessId, Set<RevelationId>>;
  relayLog: RelayRecord[];
  /**
   * Free-form conversation only (witnesses with freeformEnabled — Tom and
   * Sofia, this round). A topic lands here after an unsupported accusation
   * and stays until a meaningful change of approach (real evidence, or an
   * authored altUnlock route — see TestimonyStage.altUnlock) lifts it —
   * never a permanent lock.
   */
  defensiveTopics: Record<WitnessId, Set<string>>;
  /** Guards duplicate submission while a free-form turn is in flight. */
  pendingWitnesses: Set<WitnessId>;
  /** One entry per validated free-form turn — what the reveal's "what you established" summary is built from. */
  conversationEventLog: ConversationEvent[];
  witnessStages: AllWitnessStages;
  askCounts: Record<WitnessId, Record<string, number>>;
  chatHistory: Record<WitnessId, ChatMessage[]>;
  drafts: Record<WitnessId, string>;
  demeanor: Record<WitnessId, Demeanor>;
  /** Real turns taken with each witness — the clock the de-escalation cooldown runs on. */
  demeanorTurnCount: Record<WitnessId, number>;
  /** demeanorTurnCount's value at the last time a witness's demeanor actually visibly changed. */
  lastDemeanorChangeTurn: Record<WitnessId, number>;
  board: BoardEntry[];
  verdict: PlayerVerdict | null;
  revealed: boolean;
  boardEntryKeys: Set<string>;

  discoverEvidence: (id: EvidenceId) => void;
  inspectEvidence: (id: EvidenceId) => void;
  openWitness: (id: WitnessId) => void;
  askWitness: (id: WitnessId, questionText: string, topicIdHint?: string) => void;
  presentEvidence: (witnessId: WitnessId, evidenceId: EvidenceId, excerptIndex: number) => void;
  relayRevelation: (witnessId: WitnessId, revelationId: RevelationId) => Promise<void>;
  /** Free-form conversation entry point (any witness with freeformEnabled) — interprets, validates, resolves, and performs one turn. */
  sendFreeformMessage: (witnessId: WitnessId, rawText: string) => Promise<void>;
  /** Re-runs the last failed turn's text without re-appending a duplicate player bubble. */
  retryFreeformMessage: (witnessId: WitnessId) => Promise<void>;
  setDraft: (witnessId: WitnessId, text: string) => void;
  submitVerdict: (v: PlayerVerdict) => void;
  reset: () => void;
}

function initialDemeanor(): Record<WitnessId, Demeanor> {
  const out = {} as Record<WitnessId, Demeanor>;
  for (const w of WITNESSES) out[w.id] = w.baselineDemeanor;
  return out;
}

function emptyWitnessStages(): AllWitnessStages {
  const out = {} as AllWitnessStages;
  for (const w of WITNESSES) {
    out[w.id] = {};
    for (const t of w.topics) out[w.id][t.id] = -1;
  }
  return out;
}

function emptyAskCounts(): Record<WitnessId, Record<string, number>> {
  const out = {} as Record<WitnessId, Record<string, number>>;
  for (const w of WITNESSES) out[w.id] = {};
  return out;
}

function emptyChatHistory(): Record<WitnessId, ChatMessage[]> {
  const out = {} as Record<WitnessId, ChatMessage[]>;
  for (const w of WITNESSES) out[w.id] = [];
  return out;
}

function emptyPresentedEvidence(): Record<WitnessId, Set<EvidenceId>> {
  const out = {} as Record<WitnessId, Set<EvidenceId>>;
  for (const w of WITNESSES) out[w.id] = new Set();
  return out;
}

function emptyRelayedRevelations(): Record<WitnessId, Set<RevelationId>> {
  const out = {} as Record<WitnessId, Set<RevelationId>>;
  for (const w of WITNESSES) out[w.id] = new Set();
  return out;
}

function emptyDefensiveTopics(): Record<WitnessId, Set<string>> {
  const out = {} as Record<WitnessId, Set<string>>;
  for (const w of WITNESSES) out[w.id] = new Set();
  return out;
}

function emptyDrafts(): Record<WitnessId, string> {
  const out = {} as Record<WitnessId, string>;
  for (const w of WITNESSES) out[w.id] = "";
  return out;
}

function boardKey(entry: Omit<BoardEntry, "id">, extra: string) {
  return `${entry.source ?? "x"}:${extra}`;
}

// How "keyed up" each state reads, for deciding escalation vs. de-escalation
// — not a strict emotional journey, just enough ordering to tell "getting
// worse" from "calming down." `resigned` sits with the mid-tier states
// (quiet defeat, not blown-up panic) rather than near `composed`, so a
// witness doesn't read as instantly "fine" the moment they stop panicking.
const DEMEANOR_SEVERITY: Record<Demeanor, number> = {
  composed: 0,
  guarded: 1,
  nervous: 2,
  resigned: 2,
  defensive: 3,
  shaken: 4,
  panicking: 5,
};

// A witness's mood can spike immediately (a pointed accusation lands and
// they react right away) but settling back down takes a few real turns —
// otherwise demeanor just mirrors whatever topic was asked last and reads
// as flickering rather than someone's actual emotional state. "Turn" here
// means a question that actually matched a live topic; off-topic/deflected
// asks don't advance the engine at all, so they don't count either.
const DEMEANOR_COOLDOWN_TURNS = 3;

function emptyDemeanorTurnCount(): Record<WitnessId, number> {
  const out = {} as Record<WitnessId, number>;
  for (const w of WITNESSES) out[w.id] = 0;
  return out;
}

function emptyLastDemeanorChangeTurn(): Record<WitnessId, number> {
  const out = {} as Record<WitnessId, number>;
  for (const w of WITNESSES) out[w.id] = 0;
  return out;
}

/**
 * Decides whether a newly-authored demeanor actually takes visible effect
 * this turn. Escalation (more intense than the current state) always
 * applies immediately — a sharp question should land sharp. Anything else
 * (de-escalating, or sideways between same-tier states) is held back until
 * enough turns have passed since the last visible change, so mood doesn't
 * flicker with every topic switch.
 */
function resolveDemeanorUpdate(
  current: Demeanor,
  proposed: Demeanor | undefined,
  turnsSinceLastChange: number
): { demeanor: Demeanor; changed: boolean } {
  if (!proposed || proposed === current) return { demeanor: current, changed: false };
  const isEscalation = DEMEANOR_SEVERITY[proposed] > DEMEANOR_SEVERITY[current];
  if (isEscalation || turnsSinceLastChange >= DEMEANOR_COOLDOWN_TURNS) {
    return { demeanor: proposed, changed: true };
  }
  return { demeanor: current, changed: false };
}

/** Whether `topic.stages[stageIndex]` would be reached through its NORMAL gates alone (no relay/intent) — used only to tell "reached via altUnlock" apart from "was reachable anyway," never to decide the actual unlock. */
function normalGatesMetFor(topic: TestimonyTopic, stageIndex: number, askCountAfterThis: number, state: GameState): boolean {
  return stageRequirementsMet(topic, stageIndex, askCountAfterThis, state.discoveredEvidence, state.witnessStages);
}

/**
 * Shared stage-advancement logic used by both asking a question and
 * presenting evidence directly. `useAltText` picks the `presentedText`
 * variant (falling back to the normal text) so a confrontation reads as a
 * reaction to the specific document shown, not a generic repeat answer.
 */
function advanceTopic(
  state: GameState,
  id: WitnessId,
  topic: TestimonyTopic,
  newAskCount: number,
  useAltText: boolean,
  relayedRevelations?: ReadonlySet<RevelationId>,
  currentIntent?: ConversationIntent
) {
  const prevStage = state.witnessStages[id][topic.id] ?? -1;
  const newStage = resolveStage(
    topic,
    prevStage,
    newAskCount,
    state.discoveredEvidence,
    state.witnessStages,
    relayedRevelations,
    currentIntent
  );

  if (newStage === -1) return null;

  // A real turn with this witness — counts toward the de-escalation cooldown
  // regardless of whether the stage itself advanced further.
  const newTurnCount = (state.demeanorTurnCount[id] ?? 0) + 1;

  const stageData = topic.stages[newStage];
  const advanced = newStage > prevStage;
  // Reached ONLY because of altUnlock (relay + the right intent), not
  // because its normal evidence/witness-stage/pressure gates were met —
  // recomputed by checking the normal gates alone (no relay/intent args),
  // never trusted as a flag the caller passed in.
  const reachedViaAltUnlock =
    advanced && Boolean(stageData.altUnlock) && !normalGatesMetFor(topic, newStage, newAskCount, state);
  const text =
    (useAltText && advanced ? stageData.presentedText : undefined) ??
    (reachedViaAltUnlock ? stageData.altUnlockText : undefined) ??
    stageData.text;

  let nextBoard = state.board;
  let nextKeys = state.boardEntryKeys;
  let nextDiscovered = state.discoveredEvidence;

  if (advanced) {
    if (stageData.addsBoardEntries?.length) {
      nextBoard = [...nextBoard];
      nextKeys = new Set(nextKeys);
      let addedContradiction = false;
      stageData.addsBoardEntries.forEach((entry, i) => {
        const key = boardKey(entry, `${id}:${topic.id}:${newStage}:${i}`);
        if (!nextKeys.has(key)) {
          nextKeys.add(key);
          nextBoard.push({ ...entry, id: key });
          if (entry.type === "contradiction") addedContradiction = true;
        }
      });
      if (addedContradiction) playSfx("contradiction");
    }
    if (stageData.unlocksEvidence?.length) {
      nextDiscovered = new Set(nextDiscovered);
      stageData.unlocksEvidence.forEach((e) => nextDiscovered.add(e));
    }
  }

  const updatedWitnessStages: AllWitnessStages = {
    ...state.witnessStages,
    [id]: { ...state.witnessStages[id], [topic.id]: newStage },
  };

  const turnsSinceLastChange = newTurnCount - (state.lastDemeanorChangeTurn[id] ?? 0);
  const resolved = advanced
    ? resolveDemeanorUpdate(state.demeanor[id], stageData.demeanor, turnsSinceLastChange)
    : { demeanor: state.demeanor[id], changed: false };
  const nextDemeanor = resolved.changed ? { ...state.demeanor, [id]: resolved.demeanor } : state.demeanor;
  const nextLastChangeTurn = resolved.changed
    ? { ...state.lastDemeanorChangeTurn, [id]: newTurnCount }
    : state.lastDemeanorChangeTurn;
  if (resolved.changed) playSfx("demeanor");

  return {
    text,
    newStage,
    advanced,
    reachedViaAltUnlock,
    patch: {
      witnessStages: updatedWitnessStages,
      askCounts: { ...state.askCounts, [id]: { ...state.askCounts[id], [topic.id]: newAskCount } },
      board: nextBoard,
      boardEntryKeys: nextKeys,
      discoveredEvidence: nextDiscovered,
      demeanor: nextDemeanor,
      demeanorTurnCount: { ...state.demeanorTurnCount, [id]: newTurnCount },
      lastDemeanorChangeTurn: nextLastChangeTurn,
    },
  };
}

interface FreeformResolution {
  text: string;
  topicId: string | null;
  eventKind: TurnEventKind;
  clearDefensive: boolean;
  setDefensive: boolean;
  event: ConversationEvent;
  patch: Partial<GameState>;
}

/** Counts this as a real turn (for the de-escalation cooldown) and resolves whether a proposed demeanor actually takes effect. Used by resolveFreeformTurn's branches that don't go through advanceTopic. */
function countTurnAndResolveDemeanor(state: GameState, witnessId: WitnessId, proposed: Demeanor | undefined) {
  const newTurnCount = (state.demeanorTurnCount[witnessId] ?? 0) + 1;
  const turnsSinceLastChange = newTurnCount - (state.lastDemeanorChangeTurn[witnessId] ?? 0);
  const resolved = resolveDemeanorUpdate(state.demeanor[witnessId], proposed, turnsSinceLastChange);
  if (resolved.changed) playSfx("demeanor");
  return {
    demeanor: resolved.changed ? { ...state.demeanor, [witnessId]: resolved.demeanor } : state.demeanor,
    demeanorTurnCount: { ...state.demeanorTurnCount, [witnessId]: newTurnCount },
    lastDemeanorChangeTurn: resolved.changed
      ? { ...state.lastDemeanorChangeTurn, [witnessId]: newTurnCount }
      : state.lastDemeanorChangeTurn,
  };
}

/**
 * The validated behavior core for one free-form turn — reusing the same
 * authored stage ladder `advanceTopic` already walks for every other
 * witness interaction in this app:
 *
 *   A. Unsupported accusation (no cited evidence, topic not yet admitted)
 *      -> locks the topic defensive. Recoverable, never permanent.
 *   B. Evidence-backed contradiction (validated citedEvidenceIds present)
 *      -> same authored unlock path as the evidence picker (presentEvidence
 *         uses the identical advanceTopic call) — a LIMITED admission,
 *         never more than what that evidence is actually authored to
 *         unlock.
 *   C. Evidence-backed understanding (empathetic_appeal + evidence) ->
 *      clears a defensive lock and falls through to the same path as B.
 *   D. altUnlock (relay + the right intent, no evidence at all) -> an
 *      authored ALTERNATE route onto the exact same stage ladder —
 *      "learning another witness's account" or "a fear being addressed"
 *      changing what's volunteered, never a new fact invented by the
 *      model. Generic empathy with no evidence and no matching relay
 *      still unlocks nothing — politeness alone is never a key.
 *   E. Repair (the player walking back their own earlier accusation) ->
 *      acknowledged in its own right, never reclassified as a fresh
 *      accusation just because it mentions one, and never itself evidence
 *      that something false becomes true.
 *
 * This function makes no network calls and decides nothing the rest of
 * the engine couldn't already justify — it is the validated-transition
 * layer between interpretation and generated dialogue.
 */
function resolveFreeformTurn(state: GameState, witnessId: WitnessId, interp: InterpretationResult): FreeformResolution {
  const witness = WITNESS_BY_ID[witnessId];
  const topic = interp.topicId ? witness.topics.find((t) => t.id === interp.topicId) ?? null : null;
  const hasEvidence = interp.citedEvidenceIds.length > 0;

  if (!topic) {
    return {
      text: getDeflection(witness),
      topicId: null,
      eventKind: "no_change",
      clearDefensive: false,
      setDefensive: false,
      event: {
        witnessId,
        t: Date.now(),
        kind: "no_change",
        topicId: null,
        citedEvidenceIds: [],
        summary: "Off-topic or unclear question — no change.",
      },
      patch: {},
    };
  }

  // E. A repair attempt is never treated as a fresh accusation (even if it
  // literally contains the word "accusing") and never itself clears a lock
  // — an apology isn't evidence. It's still a real, distinct conversational
  // event: the witness may stay guarded, but what the player actually said
  // gets acknowledged rather than met with the same stock defensive line.
  if (interp.intent === "repair") {
    const isDefensiveNow = state.defensiveTopics[witnessId].has(topic.id);
    return {
      text: isDefensiveNow ? getDefensiveLine(witness) : getDeflection(witness),
      topicId: topic.id,
      eventKind: "repair_acknowledged",
      clearDefensive: false,
      setDefensive: false,
      event: {
        witnessId,
        t: Date.now(),
        kind: "repair_acknowledged",
        topicId: topic.id,
        citedEvidenceIds: [],
        summary: `Player walked back an earlier accusation on "${topic.chipLabel}" — acknowledged; trust not automatically restored.`,
      },
      patch: countTurnAndResolveDemeanor(state, witnessId, undefined),
    };
  }

  const isDefensive = state.defensiveTopics[witnessId].has(topic.id);
  const alreadyEngaged = (state.witnessStages[witnessId][topic.id] ?? -1) >= 0;

  // A. Unsupported accusation on a topic never yet admitted anything —
  // lock it, stonewall, do not touch the authored stage ladder at all.
  // The accusation itself is a real emotional spike, though: propose
  // "defensive" as an immediate reaction (escalation always applies right
  // away — see resolveDemeanorUpdate) rather than leaving the witness
  // visually unaffected by being accused.
  if (interp.intent === "accusation" && !hasEvidence && !alreadyEngaged) {
    return {
      text: getDefensiveLine(witness),
      topicId: topic.id,
      eventKind: "defensive_lock",
      clearDefensive: false,
      setDefensive: true,
      event: {
        witnessId,
        t: Date.now(),
        kind: "defensive_lock",
        topicId: topic.id,
        citedEvidenceIds: [],
        summary: `Unsupported accusation on "${topic.chipLabel}" — ${witness.name} became defensive.`,
      },
      patch: countTurnAndResolveDemeanor(state, witnessId, "defensive"),
    };
  }

  // D. Does ANY not-yet-reached stage on this topic have an altUnlock
  // whose conditions are satisfied THIS turn? Checked against objective
  // state only — relayedRevelations is only ever populated by the
  // explicit relay action, never by the player's own unverified claim in
  // free text, and currentIntent is the same validated classification
  // every other branch already trusts, not a new trust boundary.
  const relayed = state.relayedRevelations[witnessId];
  const altUnlockCandidate = topic.stages.some(
    (s, i) => i > (state.witnessStages[witnessId][topic.id] ?? -1) && s.altUnlock
      && s.altUnlock.requiresIntent.includes(interp.intent)
      && s.altUnlock.requiresRelayed.every((r) => relayed.has(r))
  );

  // Still defensive and nothing offered to lift it (no evidence, and no
  // altUnlock route either — empathy alone still doesn't count) — stay
  // locked, same line again. This is what keeps the lock real without
  // making it permanent. Still counts as a turn, so the cooldown clock
  // keeps advancing toward the point where a calmer state is finally
  // allowed to show.
  if (isDefensive && !hasEvidence && !altUnlockCandidate) {
    return {
      text: getDefensiveLine(witness),
      topicId: topic.id,
      eventKind: "no_change",
      clearDefensive: false,
      setDefensive: false,
      event: {
        witnessId,
        t: Date.now(),
        kind: "no_change",
        topicId: topic.id,
        citedEvidenceIds: [],
        summary: `Still defensive on "${topic.chipLabel}" — no new evidence or understanding offered.`,
      },
      patch: countTurnAndResolveDemeanor(state, witnessId, undefined),
    };
  }

  // B (evidence_challenge), C (empathetic_appeal + evidence), and D
  // (altUnlock) all land here: something real is present, so it's allowed
  // to unlock whatever it's authored to unlock — via the EXACT same call
  // presentEvidence already makes, now also given relayedRevelations and
  // this turn's intent so altUnlock can fire. No special-cased "instant
  // confession" path exists outside this one authored mechanism.
  const newAskCount = (state.askCounts[witnessId][topic.id] ?? 0) + 1;
  const result = advanceTopic(state, witnessId, topic, newAskCount, hasEvidence, relayed, interp.intent);
  const clearDefensive = isDefensive && (hasEvidence || Boolean(result?.reachedViaAltUnlock));

  if (!result) {
    return {
      text: getDeflection(witness),
      topicId: topic.id,
      eventKind: "no_change",
      clearDefensive,
      setDefensive: false,
      event: {
        witnessId,
        t: Date.now(),
        kind: "no_change",
        topicId: topic.id,
        citedEvidenceIds: interp.citedEvidenceIds,
        summary: `Asked about "${topic.chipLabel}" — not reachable yet.`,
      },
      patch: countTurnAndResolveDemeanor(state, witnessId, undefined),
    };
  }

  const kind: TurnEventKind = !result.advanced
    ? "no_change"
    : result.reachedViaAltUnlock
      ? "voluntary_disclosure"
      : clearDefensive
        ? "evidence_admission"
        : interp.intent === "empathetic_appeal"
          ? "empathetic_recovery"
          : hasEvidence
            ? "evidence_admission"
            : "normal_advance";

  return {
    text: result.text,
    topicId: topic.id,
    eventKind: kind,
    clearDefensive,
    setDefensive: false,
    event: {
      witnessId,
      t: Date.now(),
      kind,
      topicId: topic.id,
      citedEvidenceIds: interp.citedEvidenceIds,
      summary:
        kind === "voluntary_disclosure"
          ? `${witness.name} volunteered an answer on "${topic.chipLabel}" because of what the player shared in conversation — not because of any evidence presented.`
          : kind === "evidence_admission"
            ? `Challenged "${topic.chipLabel}" with evidence — ${witness.name} made a limited admission.`
            : kind === "empathetic_recovery"
              ? `Reopened "${topic.chipLabel}" through empathy backed by evidence, after it had gone defensive.`
              : kind === "normal_advance"
                ? `Advanced "${topic.chipLabel}" through ordinary questioning.`
                : `Asked about "${topic.chipLabel}" — nothing new yet.`,
    },
    patch: result.patch,
  };
}

type SetFn = (partial: Partial<GameState>) => void;
type GetFn = () => GameState;

/**
 * Shared by sendFreeformMessage and retryFreeformMessage — the player
 * bubble is already in chatHistory and pendingWitnesses is already set by
 * the caller.
 *
 * converseWithWitness gives the model real conversation history AND this
 * witness's private character context, but the dialogue it returns has
 * already been validated server-side against exactly what's currently
 * authorized (see api/witness-chat.ts) — this function does NOT re-trust
 * it blindly, it only ever uses it as an alternate DISPLAY TEXT. The
 * actual STATE decision (does this topic advance, does a defensive lock
 * get set or cleared, what board entries/demeanor result) still runs
 * through the exact same validateInterpretation -> resolveFreeformTurn
 * pipeline as before, untouched — the model proposes an interpretation
 * and a performance, the deterministic engine remains the sole authority
 * on what actually happened in the case.
 */
async function runFreeformTurn(witnessId: WitnessId, text: string, set: SetFn, get: GetFn): Promise<void> {
  const witness = WITNESS_BY_ID[witnessId];
  try {
    const preState = get();
    const knownEvidenceIds = Array.from(preState.discoveredEvidence);
    const evidenceTitles = Object.fromEntries(EVIDENCE.map((e) => [e.id, e.title]));
    const history = preState.chatHistory[witnessId]
      .filter((m) => m.role === "player" || m.role === "witness")
      .slice(-10)
      .map((m) => ({ role: m.role, text: m.text }));

    // Only facts ACTUALLY relayed to this witness (relayRevelation action),
    // never anything the player merely claimed in free text — see
    // ConverseContext.relayedFacts.
    const relayedFacts = Array.from(preState.relayedRevelations[witnessId])
      .map((id) => ({ id, label: REVELATIONS[id]?.label }))
      .filter((r): r is { id: RevelationId; label: string } => Boolean(r.label));

    // Compact structured memory: what already happened with this witness,
    // not raw transcript — a projection of the existing event log.
    const conversationMemory = preState.conversationEventLog
      .filter((e) => e.witnessId === witnessId)
      .slice(-8)
      .map((e) => e.summary);

    const outcome = await converseWithWitness(
      {
        witness,
        rawText: text,
        history,
        knownEvidenceIds,
        evidenceTitles,
        witnessStages: preState.witnessStages[witnessId],
        askCounts: preState.askCounts[witnessId],
        defensiveTopicIds: Array.from(preState.defensiveTopics[witnessId]),
        relayedFacts,
        conversationMemory,
      },
      true
    );
    const validated = validateInterpretation(outcome.result, witness, new Set(knownEvidenceIds));

    const stateForResolution = get();
    const resolution = resolveFreeformTurn(stateForResolution, witnessId, validated);

    // The server already validated this dialogue against what's actually
    // authorized before ever sending it back — this client-side check is
    // just "did we get one at all," not a re-derivation of that boundary.
    const useGenerated = outcome.source === "ai" && outcome.dialogue !== null;
    const finalText = useGenerated ? outcome.dialogue! : resolution.text;
    const finalCue = useGenerated ? (outcome.cue ?? defaultCueFor(resolution.eventKind)) : defaultCueFor(resolution.eventKind);

    const latest = get();

    const nextPresented = { ...latest.presentedEvidence, [witnessId]: new Set(latest.presentedEvidence[witnessId]) };
    validated.citedEvidenceIds.forEach((id) => nextPresented[witnessId].add(id));

    const nextDefensive = { ...latest.defensiveTopics, [witnessId]: new Set(latest.defensiveTopics[witnessId]) };
    if (resolution.setDefensive && resolution.topicId) nextDefensive[witnessId].add(resolution.topicId);
    if (resolution.clearDefensive && resolution.topicId) nextDefensive[witnessId].delete(resolution.topicId);

    const nextPending = new Set(latest.pendingWitnesses);
    nextPending.delete(witnessId);

    const witnessMessage: ChatMessage = {
      role: "witness",
      text: finalText,
      topicId: resolution.topicId ?? undefined,
      cue: finalCue,
      source: useGenerated ? "ai" : "fallback",
    };

    track("freeform_turn_resolved", {
      witnessId,
      intent: validated.intent,
      topicId: validated.topicId,
      eventKind: resolution.eventKind,
      source: outcome.source,
      usedGeneratedDialogue: useGenerated,
    });

    set({
      ...resolution.patch,
      chatHistory: { ...latest.chatHistory, [witnessId]: [...latest.chatHistory[witnessId], witnessMessage] },
      presentedEvidence: nextPresented,
      defensiveTopics: nextDefensive,
      pendingWitnesses: nextPending,
      conversationEventLog: [...latest.conversationEventLog, resolution.event],
    });
  } catch (err) {
    track("freeform_turn_failed", { witnessId, message: err instanceof Error ? err.message : String(err) });
    const latest = get();
    const history = latest.chatHistory[witnessId];
    const nextHistory = [...history];
    const lastIdx = nextHistory.length - 1;
    if (lastIdx >= 0 && nextHistory[lastIdx].role === "player") {
      nextHistory[lastIdx] = { ...nextHistory[lastIdx], failed: true };
    }
    const nextPending = new Set(latest.pendingWitnesses);
    nextPending.delete(witnessId);
    set({ chatHistory: { ...latest.chatHistory, [witnessId]: nextHistory }, pendingWitnesses: nextPending });
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  discoveredEvidence: new Set(EVIDENCE.filter((e) => e.initial).map((e) => e.id)),
  inspectedEvidence: new Set(),
  presentedEvidence: emptyPresentedEvidence(),
  presentationLog: [],
  relayedRevelations: emptyRelayedRevelations(),
  relayLog: [],
  defensiveTopics: emptyDefensiveTopics(),
  pendingWitnesses: new Set(),
  conversationEventLog: [],
  witnessStages: emptyWitnessStages(),
  askCounts: emptyAskCounts(),
  chatHistory: emptyChatHistory(),
  drafts: emptyDrafts(),
  demeanor: initialDemeanor(),
  demeanorTurnCount: emptyDemeanorTurnCount(),
  lastDemeanorChangeTurn: emptyLastDemeanorChangeTurn(),
  board: [],
  verdict: null,
  revealed: false,
  boardEntryKeys: new Set(),

  discoverEvidence: (id) => {
    // Acquisition only — requesting a record from the examine screen. The
    // 4 initial documents start already acquired (they're free), which
    // must NOT by itself put anything on the board: a zero-investigation
    // playthrough should show zero board items, not "4 pieces of evidence
    // discovered" for documents nobody actually opened. Board facts are
    // added on inspection instead — see inspectEvidence.
    const { discoveredEvidence } = get();
    if (discoveredEvidence.has(id)) return;
    track("evidence_inspected", { evidenceId: id });
    playSfx("evidence");
    set({ discoveredEvidence: new Set(discoveredEvidence).add(id) });
  },

  inspectEvidence: (id) => {
    const { inspectedEvidence, board, boardEntryKeys } = get();
    if (inspectedEvidence.has(id)) return;

    const facts = EVIDENCE_FACTS[id] ?? [];
    const nextBoard = [...board];
    const nextKeys = new Set(boardEntryKeys);
    facts.forEach((fact, i) => {
      const key = `evidence:${id}:${i}`;
      if (!nextKeys.has(key)) {
        nextKeys.add(key);
        nextBoard.push({ id: key, type: fact.type, text: fact.content, source: "evidence", timestamp: fact.time });
      }
    });

    track("evidence_inspected_detail", { evidenceId: id });
    set({ inspectedEvidence: new Set(inspectedEvidence).add(id), board: nextBoard, boardEntryKeys: nextKeys });
  },

  openWitness: (id) => {
    track("witness_opened", { witnessId: id });
  },

  askWitness: (id, questionText, topicIdHint) => {
    const witness = WITNESS_BY_ID[id];
    if (!witness) return;

    const state = get();
    const topic = topicIdHint
      ? witness.topics.find((t) => t.id === topicIdHint) ?? null
      : matchTopic(witness, questionText);

    const history = [...state.chatHistory[id], { role: "player" as const, text: questionText, topicId: topic?.id }];

    if (!topic) {
      const line = getDeflection(witness);
      track("witness_questioned", { witnessId: id, matched: false, question: questionText });
      set({
        chatHistory: { ...state.chatHistory, [id]: [...history, { role: "witness", text: line }] },
        drafts: { ...state.drafts, [id]: "" },
      });
      return;
    }

    // A topic locked defensive by an unsupported accusation (free-form
    // conversation only — see sendFreeformMessage) stays locked through a
    // chip tap too — the suggestion chips are a shortcut INTO the same
    // conversation, not a side door around its rules. This is a no-op for
    // any witness without freeformEnabled: defensiveTopics only ever gets
    // entries from the free-form path.
    if (state.defensiveTopics[id].has(topic.id)) {
      const line = getDefensiveLine(witness);
      track("witness_questioned", { witnessId: id, topicId: topic.id, matched: true, stage: state.witnessStages[id][topic.id] ?? -1, advanced: false });
      set({
        chatHistory: { ...state.chatHistory, [id]: [...history, { role: "witness", text: line, topicId: topic.id }] },
        drafts: { ...state.drafts, [id]: "" },
      });
      return;
    }

    const prevAskCount = state.askCounts[id][topic.id] ?? 0;
    const newAskCount = prevAskCount + 1;
    const result = advanceTopic(state, id, topic, newAskCount, false);

    track("witness_questioned", {
      witnessId: id,
      topicId: topic.id,
      matched: true,
      stage: result?.newStage ?? -1,
      advanced: result?.advanced ?? false,
    });

    if (!result) {
      // Don't bank this as "pressure" — the topic wasn't actually live yet,
      // so asking about it too early must not let the player skip ahead
      // once it does unlock (see scripts/selftest.ts Playthrough 2).
      const line = getDeflection(witness);
      set({
        chatHistory: { ...state.chatHistory, [id]: [...history, { role: "witness", text: line }] },
        drafts: { ...state.drafts, [id]: "" },
      });
      return;
    }

    set({
      ...result.patch,
      chatHistory: { ...state.chatHistory, [id]: [...history, { role: "witness", text: result.text, topicId: topic.id }] },
      drafts: { ...state.drafts, [id]: "" },
    });
  },

  setDraft: (witnessId, text) => {
    set({ drafts: { ...get().drafts, [witnessId]: text } });
  },

  presentEvidence: (witnessId, evidenceId, excerptIndex) => {
    const state = get();
    if (!state.discoveredEvidence.has(evidenceId)) return; // can only present what's already been acquired
    const witness: WitnessConfig | undefined = WITNESS_BY_ID[witnessId];
    const evidence = EVIDENCE_BY_ID[evidenceId];
    if (!witness || !evidence) return;

    const excerpt = evidence.details[excerptIndex] ?? evidence.summary;
    const presentedMessage: ChatMessage = { role: "evidence", text: `${evidence.title}: “${excerpt}”` };
    const history = [...state.chatHistory[witnessId], presentedMessage];

    const nextPresented = {
      ...state.presentedEvidence,
      [witnessId]: new Set(state.presentedEvidence[witnessId]).add(evidenceId),
    };
    const nextLog = [...state.presentationLog, { witnessId, evidenceId, excerptIndex, t: Date.now() }];

    track("evidence_presented", { witnessId, evidenceId, excerptIndex });

    const topic = topicForEvidence(witness, evidenceId);
    if (!topic) {
      set({
        chatHistory: { ...state.chatHistory, [witnessId]: history },
        presentedEvidence: nextPresented,
        presentationLog: nextLog,
      });
      return;
    }

    // Presenting real evidence is just as valid a recovery route as citing
    // it in free text — a defensive lock on this topic lifts either way.
    const nextDefensive = state.defensiveTopics[witnessId].has(topic.id)
      ? { ...state.defensiveTopics, [witnessId]: new Set(state.defensiveTopics[witnessId]) }
      : state.defensiveTopics;
    if (nextDefensive !== state.defensiveTopics) nextDefensive[witnessId].delete(topic.id);

    const prevAskCount = state.askCounts[witnessId][topic.id] ?? 0;
    const newAskCount = prevAskCount + 1;
    const result = advanceTopic(state, witnessId, topic, newAskCount, true);

    if (!result) {
      set({
        chatHistory: { ...state.chatHistory, [witnessId]: history },
        presentedEvidence: nextPresented,
        presentationLog: nextLog,
        defensiveTopics: nextDefensive,
      });
      return;
    }

    set({
      ...result.patch,
      chatHistory: { ...state.chatHistory, [witnessId]: [...history, { role: "witness", text: result.text, topicId: topic.id }] },
      presentedEvidence: nextPresented,
      presentationLog: nextLog,
      defensiveTopics: nextDefensive,
    });
  },

  relayRevelation: async (witnessId, revelationId) => {
    const state = get();
    const witness = WITNESS_BY_ID[witnessId];
    const revelation = REVELATIONS[revelationId];
    if (!witness || !revelation) return;
    if (!isRevelationKnown(revelation, state.witnessStages)) return; // can't relay what the player hasn't learned
    if (state.relayedRevelations[witnessId].has(revelationId)) return; // never re-tellable
    if (state.pendingWitnesses.has(witnessId)) return; // same duplicate-submission guard as a free-form turn

    const nextRelayed = {
      ...state.relayedRevelations,
      [witnessId]: new Set(state.relayedRevelations[witnessId]).add(revelationId),
    };
    const nextLog = [...state.relayLog, { witnessId, revelationId, t: Date.now() }];
    const relayMessage: ChatMessage = { role: "relay", text: revelation.label };
    const history = [...state.chatHistory[witnessId], relayMessage];

    track("revelation_relayed", { witnessId, revelationId });

    const reaction = witness.reactions?.[revelationId];
    if (!reaction) {
      // Known, but this witness has no authored reaction to it — still a
      // legitimate relay (it's recorded), just not one that moves anything.
      set({ chatHistory: { ...state.chatHistory, [witnessId]: history }, relayedRevelations: nextRelayed, relayLog: nextLog });
      return;
    }

    // Board entries + demeanor are authored and deterministic regardless
    // of whether the DISPLAY TEXT ends up generated or static — the model
    // never decides any of this, only how the SAME reaction is phrased.
    let nextBoard = state.board;
    let nextKeys = state.boardEntryKeys;
    if (reaction.addsBoardEntries?.length) {
      nextBoard = [...nextBoard];
      nextKeys = new Set(nextKeys);
      let addedContradiction = false;
      reaction.addsBoardEntries.forEach((entry, i) => {
        const key = `relay:${witnessId}:${revelationId}:${i}`;
        if (!nextKeys.has(key)) {
          nextKeys.add(key);
          nextBoard.push({ ...entry, id: key });
          if (entry.type === "contradiction") addedContradiction = true;
        }
      });
      if (addedContradiction) playSfx("contradiction");
    }

    const newTurnCount = (state.demeanorTurnCount[witnessId] ?? 0) + 1;
    const turnsSinceLastChange = newTurnCount - (state.lastDemeanorChangeTurn[witnessId] ?? 0);
    const resolved = resolveDemeanorUpdate(state.demeanor[witnessId], reaction.demeanor, turnsSinceLastChange);
    const nextDemeanor = resolved.changed ? { ...state.demeanor, [witnessId]: resolved.demeanor } : state.demeanor;
    const nextLastChangeTurn = resolved.changed
      ? { ...state.lastDemeanorChangeTurn, [witnessId]: newTurnCount }
      : state.lastDemeanorChangeTurn;
    if (resolved.changed) playSfx("demeanor");

    const basePatch = {
      relayedRevelations: nextRelayed,
      relayLog: nextLog,
      board: nextBoard,
      boardEntryKeys: nextKeys,
      demeanor: nextDemeanor,
      demeanorTurnCount: { ...state.demeanorTurnCount, [witnessId]: newTurnCount },
      lastDemeanorChangeTurn: nextLastChangeTurn,
    };

    if (!reaction.generative || !witness.freeformEnabled) {
      // Today's exact behavior: the static authored line, shown immediately.
      set({
        ...basePatch,
        chatHistory: { ...state.chatHistory, [witnessId]: [...history, { role: "witness", text: reaction.text }] },
      });
      return;
    }

    // Generative: show the relay bubble right away, mark pending (so the
    // UI shows a typing indicator and blocks a second submit), then try
    // to get a paraphrased-but-bounded reaction. Falls back to the exact
    // static line — same as the non-generative path above — on ANY
    // failure; the player never sees a gap or an error.
    set({
      ...basePatch,
      chatHistory: { ...state.chatHistory, [witnessId]: history },
      pendingWitnesses: new Set(state.pendingWitnesses).add(witnessId),
    });

    try {
      const preGen = get();
      const relayedFacts = Array.from(preGen.relayedRevelations[witnessId])
        .map((id) => ({ id, label: REVELATIONS[id]?.label }))
        .filter((r): r is { id: RevelationId; label: string } => Boolean(r.label));

      const outcome = await generateRelayReaction(
        {
          witness,
          relayLabel: revelation.label,
          anchorText: reaction.text,
          knownEvidenceIds: Array.from(preGen.discoveredEvidence),
          witnessStages: preGen.witnessStages[witnessId],
          askCounts: preGen.askCounts[witnessId],
          defensiveTopicIds: Array.from(preGen.defensiveTopics[witnessId]),
          relayedFacts,
        },
        true
      );

      const finalText = outcome.dialogue ?? reaction.text;
      const afterGen = get();
      const nextPending = new Set(afterGen.pendingWitnesses);
      nextPending.delete(witnessId);
      set({
        chatHistory: {
          ...afterGen.chatHistory,
          [witnessId]: [
            ...afterGen.chatHistory[witnessId],
            { role: "witness", text: finalText, cue: outcome.cue ?? undefined, source: outcome.dialogue ? "ai" : "fallback" },
          ],
        },
        pendingWitnesses: nextPending,
      });
    } catch {
      const afterFail = get();
      const nextPending = new Set(afterFail.pendingWitnesses);
      nextPending.delete(witnessId);
      set({
        chatHistory: { ...afterFail.chatHistory, [witnessId]: [...afterFail.chatHistory[witnessId], { role: "witness", text: reaction.text }] },
        pendingWitnesses: nextPending,
      });
    }
  },

  sendFreeformMessage: async (witnessId, rawText) => {
    const state = get();
    if (state.pendingWitnesses.has(witnessId)) return; // duplicate-submission guard
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const playerMessage: ChatMessage = { role: "player", text: trimmed };
    set({
      chatHistory: { ...state.chatHistory, [witnessId]: [...state.chatHistory[witnessId], playerMessage] },
      drafts: { ...state.drafts, [witnessId]: "" },
      pendingWitnesses: new Set(state.pendingWitnesses).add(witnessId),
    });
    track("freeform_message_sent", { witnessId });

    await runFreeformTurn(witnessId, trimmed, set, get);
  },

  retryFreeformMessage: async (witnessId) => {
    const state = get();
    if (state.pendingWitnesses.has(witnessId)) return;
    const history = state.chatHistory[witnessId];
    const last = history[history.length - 1];
    if (!last || last.role !== "player" || !last.failed) return;

    const nextHistory = [...history];
    nextHistory[nextHistory.length - 1] = { ...last, failed: false };
    set({
      chatHistory: { ...state.chatHistory, [witnessId]: nextHistory },
      pendingWitnesses: new Set(state.pendingWitnesses).add(witnessId),
    });

    await runFreeformTurn(witnessId, last.text, set, get);
  },

  submitVerdict: (v) => {
    track("decision_selected", { ...v });
    track("session_completed", {});
    playSfx("verdict");
    set({ verdict: v, revealed: true });
  },

  reset: () => {
    track("session_started", {});
    set({
      discoveredEvidence: new Set(EVIDENCE.filter((e) => e.initial).map((e) => e.id)),
      inspectedEvidence: new Set(),
      presentedEvidence: emptyPresentedEvidence(),
      presentationLog: [],
      relayedRevelations: emptyRelayedRevelations(),
      relayLog: [],
      defensiveTopics: emptyDefensiveTopics(),
      pendingWitnesses: new Set(),
      conversationEventLog: [],
      witnessStages: emptyWitnessStages(),
      askCounts: emptyAskCounts(),
      chatHistory: emptyChatHistory(),
      drafts: emptyDrafts(),
      demeanor: initialDemeanor(),
      demeanorTurnCount: emptyDemeanorTurnCount(),
      lastDemeanorChangeTurn: emptyLastDemeanorChangeTurn(),
      board: [],
      verdict: null,
      revealed: false,
      boardEntryKeys: new Set(),
    });
  },
}));
