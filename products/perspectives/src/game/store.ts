import { create } from "zustand";
import { EVIDENCE, EVIDENCE_BY_ID, EVIDENCE_FACTS, WITNESS_BY_ID, WITNESSES } from "./caseData";
import { track } from "./analytics";
import { playSfx } from "./audio";
import { getDeflection, matchTopic, resolveStage, topicForEvidence, type AllWitnessStages } from "./witnessEngine";
import type { BoardEntry, Demeanor, EvidenceId, PlayerVerdict, TestimonyTopic, WitnessConfig, WitnessId } from "./types";

export interface ChatMessage {
  role: "player" | "witness" | "evidence";
  text: string;
  topicId?: string;
}

export interface PresentationRecord {
  witnessId: WitnessId;
  evidenceId: EvidenceId;
  excerptIndex: number;
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

export const useGameStore = create<GameState>((set, get) => ({
  discoveredEvidence: new Set(EVIDENCE.filter((e) => e.initial).map((e) => e.id)),
  inspectedEvidence: new Set(),
  presentedEvidence: emptyPresentedEvidence(),
  presentationLog: [],
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

    const prevAskCount = state.askCounts[witnessId][topic.id] ?? 0;
    const newAskCount = prevAskCount + 1;
    const result = advanceTopic(state, witnessId, topic, newAskCount, true);

    if (!result) {
      set({
        chatHistory: { ...state.chatHistory, [witnessId]: history },
        presentedEvidence: nextPresented,
        presentationLog: nextLog,
      });
      return;
    }

    set({
      ...result.patch,
      chatHistory: { ...state.chatHistory, [witnessId]: [...history, { role: "witness", text: result.text, topicId: topic.id }] },
      presentedEvidence: nextPresented,
      presentationLog: nextLog,
    });
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
