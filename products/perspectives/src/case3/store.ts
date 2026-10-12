import { create } from "zustand";
import {
  ACT2_TRANSITION_LINE,
  D1_INSTRUMENTS_RESULT,
  D1_OPTIONS,
  D1_VISUAL_CHECK_RESULT,
  HALE,
  MAYA,
  PRESSURE_START,
  ROUTE_B_FLOOR,
} from "./data";
import type { AgentDef, AgentId, AgentTopic, FireStatus, PressureLedgerEntry, Screen } from "./types";

export interface ChatLine {
  role: "player" | "agent" | "ops";
  text: string;
  cue?: string;
  /** Marks a response that was re-shown for free, not freshly charged — kept distinct in the transcript rather than silently identical to a first ask. */
  reread?: boolean;
}

interface Case3State {
  screen: Screen;
  pressure: number;
  fireStatus: FireStatus;
  hale: ChatLine[];
  maya: ChatLine[];
  ops: ChatLine[];
  ledger: PressureLedgerEntry[];
  /** Every topic ever asked, per agent — the single source of truth for "ask vs. reread" and for cross-agent requiresAsked gates. Carries over from Act I into Act II untouched (the one free Act I pick is just an asked topic like any other). */
  askedTopics: Record<AgentId, Set<string>>;
  focusedAgent: AgentId | null;

  begin: () => void;
  advanceAct1ToMaya: () => void;
  advanceAct1ToRory: () => void;
  enterAct2: () => void;
  focusAgent: (id: AgentId) => void;
  /** The single entry point for every question in the game — Act I's one
   * free pick and Act II's costed ones alike. Idempotent by construction:
   * if `topicId` is already in askedTopics, this re-shows the response
   * for free instead of charging again, so a genuine double-click (two
   * events landing before a re-render can disable the control) can never
   * double-charge — the second call just sees the topic already asked. */
  selectTopic: (agentId: AgentId, topicId: string) => void;
  openD1: () => void;
  commitD1: (option: "visual_check" | "instruments_only") => void;
  reset: () => void;
}

function agentDef(id: AgentId): AgentDef | null {
  return id === "hale" ? HALE : id === "maya" ? MAYA : null;
}

function findTopic(def: AgentDef, topicId: string): AgentTopic | undefined {
  return def.topics.find((t) => t.id === topicId);
}

function routeBStatus(pressure: number): "open" | "closed" {
  return pressure >= ROUTE_B_FLOOR ? "open" : "closed";
}

function emptyAskedTopics(): Record<AgentId, Set<string>> {
  return { hale: new Set(), maya: new Set(), rory: new Set() };
}

const initialState = {
  screen: "cold_open" as Screen,
  pressure: PRESSURE_START,
  fireStatus: "unknown" as FireStatus,
  hale: [] as ChatLine[],
  maya: [] as ChatLine[],
  ops: [] as ChatLine[],
  ledger: [] as PressureLedgerEntry[],
  askedTopics: emptyAskedTopics(),
  focusedAgent: null as AgentId | null,
};

export const useCase3Store = create<Case3State>((set, get) => ({
  ...initialState,

  begin: () => set({ screen: "act1_hale" }),

  advanceAct1ToMaya: () => set({ screen: "act1_maya_interrupt" }),
  advanceAct1ToRory: () => set({ screen: "act1_rory_interrupt" }),

  enterAct2: () =>
    set({
      screen: "act2_room",
      ops: [{ role: "ops", text: ACT2_TRANSITION_LINE }],
      focusedAgent: null,
    }),

  focusAgent: (id) => set({ focusedAgent: id }),

  selectTopic: (agentId, topicId) => {
    const state = get();
    const def = agentDef(agentId);
    const topic = def && findTopic(def, topicId);
    if (!def || !topic) return;

    const already = state.askedTopics[agentId].has(topicId);
    const key = agentId as "hale" | "maya";

    if (already) {
      // Reread: show the same response again, no new charge, no new
      // pressure/ledger entry — explicitly distinct from a first ask.
      set({ [key]: [...state[key], { role: "player", text: topic.prompt }, { role: "agent", text: topic.response, reread: true }] } as Partial<Case3State>);
      return;
    }

    const inAct1 = state.screen === "act1_hale";
    const cost = inAct1 ? 0 : topic.cost;
    const pressureAfter = Math.max(0, state.pressure - cost);
    const nextAsked = { ...state.askedTopics, [agentId]: new Set(state.askedTopics[agentId]).add(topicId) };
    const ledgerPatch = cost > 0 ? [{ label: `Asked ${def.name}: "${topic.prompt}"`, delta: -cost, pressureAfter }] : [];

    set({
      pressure: pressureAfter,
      askedTopics: nextAsked,
      ledger: [...state.ledger, ...ledgerPatch],
      [key]: [...state[key], { role: "player", text: topic.prompt }, { role: "agent", text: topic.response }],
    } as Partial<Case3State>);
  },

  openD1: () => set({ screen: "d1_decision" }),

  commitD1: (option) => {
    const state = get();
    const cost = D1_OPTIONS[option].cost;
    const pressureAfter = Math.max(0, state.pressure - cost);
    const entry: PressureLedgerEntry = {
      label: option === "visual_check" ? "D1: visual check" : "D1: instruments only",
      delta: -cost,
      pressureAfter,
    };
    const resultLine = option === "visual_check" ? D1_VISUAL_CHECK_RESULT : D1_INSTRUMENTS_RESULT;
    set({
      pressure: pressureAfter,
      fireStatus: option === "visual_check" ? "confirmed_smoldering" : "unknown",
      ledger: [...state.ledger, entry],
      ops: [...state.ops, { role: "ops", cue: resultLine.cue, text: resultLine.line }],
      screen: "d1_consequence",
    });
  },

  reset: () => set({ ...initialState, askedTopics: emptyAskedTopics() }),
}));

export { routeBStatus, agentDef, findTopic };
