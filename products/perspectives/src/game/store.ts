import { create } from "zustand";
import { EVIDENCE, EVIDENCE_BY_ID, WITNESS_BY_ID, WITNESSES } from "./caseData";
import { track } from "./analytics";
import { getDeflection, matchTopic, resolveStage, type AllWitnessStages } from "./witnessEngine";
import type { BoardEntry, EvidenceId, PlayerVerdict, WitnessId } from "./types";

export interface ChatMessage {
  role: "player" | "witness";
  text: string;
  topicId?: string;
}

interface GameState {
  discoveredEvidence: Set<EvidenceId>;
  witnessStages: AllWitnessStages;
  askCounts: Record<WitnessId, Record<string, number>>;
  chatHistory: Record<WitnessId, ChatMessage[]>;
  board: BoardEntry[];
  verdict: PlayerVerdict | null;
  revealed: boolean;
  boardEntryKeys: Set<string>;

  discoverEvidence: (id: EvidenceId) => void;
  openWitness: (id: WitnessId) => void;
  askWitness: (id: WitnessId, questionText: string, topicIdHint?: string) => void;
  submitVerdict: (v: PlayerVerdict) => void;
  reset: () => void;
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

function boardKey(entry: Omit<BoardEntry, "id">, extra: string) {
  return `${entry.source ?? "x"}:${extra}`;
}

export const useGameStore = create<GameState>((set, get) => ({
  discoveredEvidence: new Set(EVIDENCE.filter((e) => e.initial).map((e) => e.id)),
  witnessStages: emptyWitnessStages(),
  askCounts: emptyAskCounts(),
  chatHistory: emptyChatHistory(),
  board: [],
  verdict: null,
  revealed: false,
  boardEntryKeys: new Set(),

  discoverEvidence: (id) => {
    const { discoveredEvidence, board, boardEntryKeys } = get();
    if (discoveredEvidence.has(id)) return;
    const next = new Set(discoveredEvidence);
    next.add(id);

    const evidence = EVIDENCE_BY_ID[id];
    const key = `evidence:${id}`;
    const nextBoard = [...board];
    const nextKeys = new Set(boardEntryKeys);
    if (evidence && !nextKeys.has(key)) {
      nextKeys.add(key);
      nextBoard.push({
        id: key,
        type: "fact",
        text: `Evidence obtained: ${evidence.title} — ${evidence.summary}`,
        source: "evidence",
      });
    }

    track("evidence_inspected", { evidenceId: id });
    set({ discoveredEvidence: next, board: nextBoard, boardEntryKeys: nextKeys });
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
      });
      return;
    }

    const prevAskCount = state.askCounts[id][topic.id] ?? 0;
    const newAskCount = prevAskCount + 1;
    const prevStage = state.witnessStages[id][topic.id] ?? -1;
    const newStage = resolveStage(topic, prevStage, newAskCount, state.discoveredEvidence, state.witnessStages);

    track("witness_questioned", {
      witnessId: id,
      topicId: topic.id,
      matched: true,
      stage: newStage,
      advanced: newStage > prevStage,
    });

    if (newStage === -1) {
      // Don't bank this as "pressure" — the topic wasn't actually live yet,
      // so asking about it too early must not let the player skip ahead
      // once it does unlock (see scripts/selftest.ts Playthrough 2).
      const line = getDeflection(witness);
      set({
        chatHistory: { ...state.chatHistory, [id]: [...history, { role: "witness", text: line }] },
      });
      return;
    }

    const stageData = topic.stages[newStage];
    const advanced = newStage > prevStage;

    let nextBoard = state.board;
    let nextKeys = state.boardEntryKeys;
    let nextDiscovered = state.discoveredEvidence;

    if (advanced) {
      if (stageData.addsBoardEntries?.length) {
        nextBoard = [...nextBoard];
        nextKeys = new Set(nextKeys);
        stageData.addsBoardEntries.forEach((entry, i) => {
          const key = boardKey(entry, `${id}:${topic.id}:${newStage}:${i}`);
          if (!nextKeys.has(key)) {
            nextKeys.add(key);
            nextBoard.push({ ...entry, id: key });
          }
        });
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

    set({
      witnessStages: updatedWitnessStages,
      askCounts: { ...state.askCounts, [id]: { ...state.askCounts[id], [topic.id]: newAskCount } },
      chatHistory: { ...state.chatHistory, [id]: [...history, { role: "witness", text: stageData.text, topicId: topic.id }] },
      board: nextBoard,
      boardEntryKeys: nextKeys,
      discoveredEvidence: nextDiscovered,
    });
  },

  submitVerdict: (v) => {
    track("decision_selected", { ...v });
    track("session_completed", {});
    set({ verdict: v, revealed: true });
  },

  reset: () => {
    track("session_started", {});
    set({
      discoveredEvidence: new Set(EVIDENCE.filter((e) => e.initial).map((e) => e.id)),
      witnessStages: emptyWitnessStages(),
      askCounts: emptyAskCounts(),
      chatHistory: emptyChatHistory(),
      board: [],
      verdict: null,
      revealed: false,
      boardEntryKeys: new Set(),
    });
  },
}));
