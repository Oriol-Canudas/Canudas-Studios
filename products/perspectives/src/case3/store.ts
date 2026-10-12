import { create } from "zustand";
import {
  ACT2_TRANSITION_LINE,
  D1_INSTRUMENTS_RESULT,
  D1_OPTIONS,
  D1_VISUAL_CHECK_RESULT,
  EXCHANGE_COST,
  HALE,
  MAYA,
  PRESSURE_START,
  ROUTE_B_FLOOR,
} from "./data";
import type { AgentDef, AgentId, FireStatus, PressureLedgerEntry, Screen } from "./types";

export interface ChatLine {
  role: "player" | "agent" | "ops";
  text: string;
  cue?: string;
}

interface Case3State {
  screen: Screen;
  pressure: number;
  fireStatus: FireStatus;
  hale: ChatLine[];
  maya: ChatLine[];
  ops: ChatLine[];
  ledger: PressureLedgerEntry[];
  act1FreeUsed: boolean;
  focusedAgent: AgentId | null;

  begin: () => void;
  sendAct1Free: (text: string) => void;
  advanceAct1ToMaya: () => void;
  advanceAct1ToRory: () => void;
  enterAct2: () => void;
  focusAgent: (id: AgentId) => void;
  sendCosted: (id: AgentId, text: string) => void;
  openD1: () => void;
  commitD1: (option: "visual_check" | "instruments_only") => void;
  reset: () => void;
}

function matchTopic(agent: AgentDef, text: string): string {
  const normalized = text.toLowerCase();
  for (const topic of agent.topics) {
    if (topic.keywords.some((k) => normalized.includes(k))) return topic.response;
  }
  return agent.deflection;
}

function routeBStatus(pressure: number): "open" | "closed" {
  return pressure >= ROUTE_B_FLOOR ? "open" : "closed";
}

const initialState = {
  screen: "cold_open" as Screen,
  pressure: PRESSURE_START,
  fireStatus: "unknown" as FireStatus,
  hale: [] as ChatLine[],
  maya: [] as ChatLine[],
  ops: [] as ChatLine[],
  ledger: [] as PressureLedgerEntry[],
  act1FreeUsed: false,
  focusedAgent: null as AgentId | null,
};

export const useCase3Store = create<Case3State>((set, get) => ({
  ...initialState,

  begin: () => set({ screen: "act1_hale" }),

  // The ONE free Act I exchange with Hale — zero pressure cost, per
  // C003-AMD-002 (agreed direction) and the confirmed tutorial sequence.
  sendAct1Free: (text) => {
    if (get().act1FreeUsed) return;
    const response = matchTopic(HALE, text);
    set((s) => ({
      hale: [...s.hale, { role: "player", text }, { role: "agent", text: response }],
      act1FreeUsed: true,
    }));
  },

  advanceAct1ToMaya: () => set({ screen: "act1_maya_interrupt" }),
  advanceAct1ToRory: () => set({ screen: "act1_rory_interrupt" }),

  enterAct2: () =>
    set({
      screen: "act2_room",
      ops: [{ role: "ops", text: ACT2_TRANSITION_LINE }],
      focusedAgent: null,
    }),

  focusAgent: (id) => set({ focusedAgent: id }),

  // Every Act II exchange with Hale or Maya costs EXCHANGE_COST (2),
  // flat, regardless of agent — baseline conversation rule, LOCKED SOURCE.
  sendCosted: (id, text) => {
    const state = get();
    if (state.screen !== "act2_room") return;
    const agent = id === "hale" ? HALE : MAYA;
    const response = matchTopic(agent, text);
    const pressureAfter = Math.max(0, state.pressure - EXCHANGE_COST);
    const entry: PressureLedgerEntry = { label: `Asked ${agent.name}`, delta: -EXCHANGE_COST, pressureAfter };
    const key = id === "hale" ? "hale" : "maya";
    set({
      pressure: pressureAfter,
      ledger: [...state.ledger, entry],
      [key]: [...state[key], { role: "player", text }, { role: "agent", text: response }],
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

  reset: () => set({ ...initialState }),
}));

export { routeBStatus };
