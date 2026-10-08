import { create } from "zustand";
import { EVIDENCE, EVIDENCE_BY_ID, EVIDENCE_FACTS, REVELATIONS, WITNESS_BY_ID, WITNESSES } from "./caseData";
import { track } from "./analytics";
import { playSfx } from "./audio";
import { interpretMessage, performLine } from "./interpreter";
import {
  getDefensiveLine,
  getDeflection,
  isRevelationKnown,
  matchTopic,
  resolveStage,
  topicForEvidence,
  validateInterpretation,
  type AllWitnessStages,
} from "./witnessEngine";
import type {
  BoardEntry,
  ConversationEvent,
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
   * Free-form conversation (Tom only, this iteration). A topic lands here
   * after an unsupported accusation and stays until a meaningful change of
   * approach (real evidence, or empathy backed by real evidence) lifts it —
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
  board: BoardEntry[];
  verdict: PlayerVerdict | null;
  revealed: boolean;
  boardEntryKeys: Set<string>;

  discoverEvidence: (id: EvidenceId) => void;
  inspectEvidence: (id: EvidenceId) => void;
  openWitness: (id: WitnessId) => void;
  askWitness: (id: WitnessId, questionText: string, topicIdHint?: string) => void;
  presentEvidence: (witnessId: WitnessId, evidenceId: EvidenceId, excerptIndex: number) => void;
  relayRevelation: (witnessId: WitnessId, revelationId: RevelationId) => void;
  /** Free-form conversation entry point (Tom only, this iteration) — interprets, validates, resolves, and performs one turn. */
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
  useAltText: boolean
) {
  const prevStage = state.witnessStages[id][topic.id] ?? -1;
  const newStage = resolveStage(topic, prevStage, newAskCount, state.discoveredEvidence, state.witnessStages);

  if (newStage === -1) return null;

  const stageData = topic.stages[newStage];
  const advanced = newStage > prevStage;
  const text = (useAltText && advanced ? stageData.presentedText : undefined) ?? stageData.text;

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

  const demeanorChanged = advanced && stageData.demeanor && stageData.demeanor !== state.demeanor[id];
  const nextDemeanor = demeanorChanged ? { ...state.demeanor, [id]: stageData.demeanor! } : state.demeanor;
  if (demeanorChanged) playSfx("demeanor");

  return {
    text,
    newStage,
    advanced,
    patch: {
      witnessStages: updatedWitnessStages,
      askCounts: { ...state.askCounts, [id]: { ...state.askCounts[id], [topic.id]: newAskCount } },
      board: nextBoard,
      boardEntryKeys: nextKeys,
      discoveredEvidence: nextDiscovered,
      demeanor: nextDemeanor,
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

/**
 * The validated behavior core for one free-form turn — Section 3's three
 * test cases, all reusing the same authored stage ladder `advanceTopic`
 * already walks for every other witness interaction in this app:
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
 *      Empathy with NO evidence never unlocks anything — politeness alone
 *      is not a key.
 *
 * This function makes no network calls and decides nothing the rest of
 * the engine couldn't already justify — it is the validated-transition
 * layer the brief requires between interpretation and generated dialogue.
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

  const isDefensive = state.defensiveTopics[witnessId].has(topic.id);
  const alreadyEngaged = (state.witnessStages[witnessId][topic.id] ?? -1) >= 0;

  // A. Unsupported accusation on a topic never yet admitted anything —
  // lock it, stonewall, do not touch the authored stage ladder at all.
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
      patch: {},
    };
  }

  // Still defensive and nothing offered to lift it (no evidence, and
  // empathy alone doesn't count) — stay locked, same line again. This is
  // what keeps the lock real without making it permanent: the ONLY ways
  // out are evidence or evidence-backed empathy, handled below.
  if (isDefensive && !hasEvidence) {
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
      patch: {},
    };
  }

  // B (evidence_challenge) and C (empathetic_appeal + evidence) both land
  // here: real evidence is present, so it's allowed to unlock whatever
  // it's authored to unlock — via the EXACT same call presentEvidence
  // already makes. No special-cased "instant confession" path exists.
  const newAskCount = (state.askCounts[witnessId][topic.id] ?? 0) + 1;
  const result = advanceTopic(state, witnessId, topic, newAskCount, hasEvidence);
  const clearDefensive = isDefensive && hasEvidence;

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
      patch: {},
    };
  }

  const kind: TurnEventKind = !result.advanced
    ? "no_change"
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
        kind === "evidence_admission"
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
 * the caller; this does interpret -> validate -> resolve -> perform and
 * commits the result, or marks the turn failed without ever silently
 * advancing scene state (the brief's explicit requirement).
 */
async function runFreeformTurn(witnessId: WitnessId, text: string, set: SetFn, get: GetFn): Promise<void> {
  const witness = WITNESS_BY_ID[witnessId];
  try {
    const preState = get();
    const knownEvidenceIds = Array.from(preState.discoveredEvidence);
    const evidenceTitles = Object.fromEntries(EVIDENCE.map((e) => [e.id, e.title]));

    const { result: proposed, source: interpretSource } = await interpretMessage(
      { witness, rawText: text, knownEvidenceIds, evidenceTitles },
      true
    );
    const validated = validateInterpretation(proposed, witness, new Set(knownEvidenceIds));

    const stateForResolution = get();
    const resolution = resolveFreeformTurn(stateForResolution, witnessId, validated);

    const recentHistory = stateForResolution.chatHistory[witnessId]
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text }));
    const performed = await performLine(
      { witnessId, authoredText: resolution.text, eventKind: resolution.eventKind, recentHistory },
      true
    );

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
      text: performed.text,
      topicId: resolution.topicId ?? undefined,
      cue: performed.cue,
      source: interpretSource === "ai" || performed.source === "ai" ? "ai" : "fallback",
    };

    track("freeform_turn_resolved", {
      witnessId,
      intent: validated.intent,
      topicId: validated.topicId,
      eventKind: resolution.eventKind,
      interpretSource,
      performSource: performed.source,
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
    // every witness except Tom this iteration: defensiveTopics only ever
    // gets entries from the free-form path, which only Tom's screen uses.
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

  relayRevelation: (witnessId, revelationId) => {
    const state = get();
    const witness = WITNESS_BY_ID[witnessId];
    const revelation = REVELATIONS[revelationId];
    if (!witness || !revelation) return;
    if (!isRevelationKnown(revelation, state.witnessStages)) return; // can't relay what the player hasn't learned
    if (state.relayedRevelations[witnessId].has(revelationId)) return; // never re-tellable

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

    const demeanorChanged = reaction.demeanor && reaction.demeanor !== state.demeanor[witnessId];
    const nextDemeanor = demeanorChanged ? { ...state.demeanor, [witnessId]: reaction.demeanor! } : state.demeanor;
    if (demeanorChanged) playSfx("demeanor");

    set({
      chatHistory: { ...state.chatHistory, [witnessId]: [...history, { role: "witness", text: reaction.text }] },
      relayedRevelations: nextRelayed,
      relayLog: nextLog,
      board: nextBoard,
      boardEntryKeys: nextKeys,
      demeanor: nextDemeanor,
    });
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
      board: [],
      verdict: null,
      revealed: false,
      boardEntryKeys: new Set(),
    });
  },
}));
