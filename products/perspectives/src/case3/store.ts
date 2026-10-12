import { create } from "zustand";
import {
  ACT2_TRANSITION_LINE,
  ACT3_TRANSITION_LINE,
  ACT4_HALE_LINE,
  D1_FORCE_THRESHOLD,
  D1_INSTRUMENTS_RESULT,
  D1_OPTIONS,
  D1_VISUAL_CHECK_RESULT,
  D2_FORCE_THRESHOLD,
  D2_OPTIONS,
  HALE,
  MAYA,
  PRESSURE_START,
  RORY,
  RORY_WARNING_THRESHOLD,
  ROUTE_B_FLOOR,
} from "./data";
import type { AgentDef, AgentId, AgentTopic, D4Option, FireStatus, PressureLedgerEntry, Route, Screen } from "./types";

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
  rory: ChatLine[];
  ops: ChatLine[];
  ledger: PressureLedgerEntry[];
  /** Every topic ever asked, per agent — the single source of truth for "ask vs. reread" and for cross-agent requiresAsked gates. Carries over between acts untouched (the one free Act I pick is just an asked topic like any other). */
  askedTopics: Record<AgentId, Set<string>>;
  focusedAgent: AgentId | null;
  committedRoute: Route | null;
  /** Whether D1/D2 were opened via the forced path (margin already at/under threshold) rather than chosen manually — feeds the Decisiveness grading axis. Set once, at the moment each decision screen opens. */
  d1WasForced: boolean;
  d2WasForced: boolean;
  /** One-shot guard for Rory's real threshold event (distinct from his scripted, free Act I orientation line) — never fires twice, per the frozen rule. */
  rorysWarningFired: boolean;
  d4Choice: D4Option | null;

  begin: () => void;
  advanceAct1ToMaya: () => void;
  advanceAct1ToRory: () => void;
  enterAct2: () => void;
  focusAgent: (id: AgentId) => void;
  /** The single entry point for every question in the game — Act I's one
   * free pick and every costed one alike. Idempotent by construction:
   * if `topicId` is already in askedTopics, this re-shows the response
   * for free instead of charging again, so a genuine double-click (two
   * events landing before a re-render can disable the control) can never
   * double-charge — the second call just sees the topic already asked. */
  selectTopic: (agentId: AgentId, topicId: string) => void;
  openD1: () => void;
  commitD1: (option: "visual_check" | "instruments_only") => void;
  enterAct3: () => void;
  dismissRoryWarning: () => void;
  openD2: () => void;
  commitD2: (route: Route) => void;
  enterAct4: () => void;
  openD4: () => void;
  commitD4: (option: D4Option) => void;
  reset: () => void;
}

function agentDef(id: AgentId): AgentDef {
  if (id === "hale") return HALE;
  if (id === "maya") return MAYA;
  return RORY;
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
  rory: [] as ChatLine[],
  ops: [] as ChatLine[],
  ledger: [] as PressureLedgerEntry[],
  askedTopics: emptyAskedTopics(),
  focusedAgent: null as AgentId | null,
  committedRoute: null as Route | null,
  d1WasForced: false,
  d2WasForced: false,
  rorysWarningFired: false,
  d4Choice: null as D4Option | null,
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
    const topic = findTopic(def, topicId);
    if (!topic) return;

    const already = state.askedTopics[agentId].has(topicId);
    const key = agentId;

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

    // Rory's threshold warning can also be crossed live, mid-conversation,
    // now that he's interactive in Act III — not just during D1 (that
    // case is covered by enterAct3's own one-time check). Same one-shot
    // guard either way; `screen` stays "act3_room" through a focused
    // conversation too, so this naturally covers both views.
    const justCrossed = state.screen === "act3_room" && !state.rorysWarningFired && state.pressure >= RORY_WARNING_THRESHOLD && pressureAfter < RORY_WARNING_THRESHOLD;

    set({
      pressure: pressureAfter,
      askedTopics: nextAsked,
      ledger: [...state.ledger, ...ledgerPatch],
      [key]: [...state[key], { role: "player", text: topic.prompt }, { role: "agent", text: topic.response }],
      ...(justCrossed ? { screen: "act3_rory_warning", rorysWarningFired: true } : {}),
    } as Partial<Case3State>);
  },

  openD1: () => {
    const { pressure } = get();
    set({ screen: "d1_decision", d1WasForced: pressure <= D1_FORCE_THRESHOLD });
  },

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

  // Rory's real threshold event is evaluated exactly once, here, on the
  // transition into Act III — covers both "crossed it during D1" and
  // "crossed it during Act II conversation," per the frozen rule that it
  // doesn't matter WHEN it was crossed, only that it fires once.
  enterAct3: () => {
    const { pressure, rorysWarningFired } = get();
    const shouldWarn = pressure < RORY_WARNING_THRESHOLD && !rorysWarningFired;
    set({
      screen: shouldWarn ? "act3_rory_warning" : "act3_room",
      rorysWarningFired: shouldWarn ? true : rorysWarningFired,
      focusedAgent: null,
    });
  },

  dismissRoryWarning: () =>
    set({ screen: "act3_room", ops: [...get().ops, { role: "ops", text: ACT3_TRANSITION_LINE }] }),

  openD2: () => {
    const { pressure } = get();
    set({ screen: "d2_decision", d2WasForced: pressure <= D2_FORCE_THRESHOLD });
  },

  commitD2: (route) => {
    const state = get();
    if (route === "B" && routeBStatus(state.pressure) === "closed") return; // defense in depth — the UI already disables this
    const cost = route === "A" ? D2_OPTIONS.route_A.cost : D2_OPTIONS.route_B.cost;
    const pressureAfter = Math.max(0, state.pressure - cost);
    const label = route === "A" ? D2_OPTIONS.route_A.label : D2_OPTIONS.route_B.label;
    const entry: PressureLedgerEntry = { label: `D2: ${label}`, delta: -cost, pressureAfter };
    set({
      pressure: pressureAfter,
      committedRoute: route,
      ledger: [...state.ledger, entry],
      ops: [...state.ops, { role: "ops", text: `Route committed: ${route === "A" ? "the short field" : "the long field"}. The other option is gone.` }],
      screen: "d2_consequence",
    });
  },

  enterAct4: () =>
    set({
      screen: "act4_hale",
      hale: [...get().hale, { role: "agent", text: ACT4_HALE_LINE[get().committedRoute ?? "A"] }],
    }),

  openD4: () => set({ screen: "d4_decision" }),

  commitD4: (option) => set({ d4Choice: option, screen: "reveal" }),

  reset: () => set({ ...initialState, askedTopics: emptyAskedTopics() }),
}));

export { routeBStatus, agentDef, findTopic };
