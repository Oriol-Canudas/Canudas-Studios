import { create } from "zustand";
import { HALE_TOPICS, RELAY_COPY, TURN_LIMIT } from "./data";
import { AUTHORED_START, AUTHORED_TREE, resumeAuthoredStep } from "./authoredTree";
import { applyEscalation, applyExplicitRevision } from "./negotiation";
import type { Commitment, ConversationTurn, HaleKnows, Mode, NegotiateResponse, Screen, SessionLogEntry } from "./types";

interface Case3V2State {
  mode: Mode | null;
  screen: Screen;
  mayaAsked: Record<string, boolean>;
  haleAsked: Record<string, boolean>;
  haleKnows: HaleKnows;
  /** Hale's relay acknowledgements + challenge responses, shown ONLY in
   * Exploration's HalePanel — kept separate from `conversation` on
   * purpose. They used to share one array, which meant exploration-phase
   * lines like "Good to know..." leaked into the climax transcript as if
   * Hale had said them as part of the actual negotiation — a real,
   * user-visible bug, not a hypothetical one. */
  haleExplorationLines: ConversationTurn[];
  /** The climax negotiation transcript ONLY — seeded at enterClimax,
   * never exploration content. */
  conversation: ConversationTurn[];
  proposal: Commitment | null;
  accepted: Commitment | null;
  turnsUsed: number;
  pending: boolean;
  fallbackActive: boolean;
  authoredStepId: string | null;
  authoredResolved: boolean;
  sessionLog: SessionLogEntry[];

  setMode: (mode: Mode) => void;
  goTo: (screen: Screen) => void;
  askMaya: (topicId: string) => void;
  askHale: (topicId: string) => void;
  relay: (fact: keyof HaleKnows) => void;
  enterClimax: () => void;
  sendPlayerMessage: (text: string) => Promise<void>;
  authoredChoose: (optionId: string) => void;
  endClimaxEarly: () => void;
  finalCommitment: () => Commitment;
  reset: () => void;
}

function log(set: (fn: (s: Case3V2State) => Partial<Case3V2State>) => void, type: SessionLogEntry["type"], payload: Record<string, unknown>) {
  const entry: SessionLogEntry = { ts: Date.now(), type, payload };
  set((s) => ({ sessionLog: [...s.sessionLog, entry] }));
}

const initialState = {
  mode: null as Mode | null,
  screen: "landing" as Screen,
  mayaAsked: {},
  haleAsked: {},
  haleKnows: { sensorDoubt: false, sealUncertainty: false },
  haleExplorationLines: [] as ConversationTurn[],
  conversation: [] as ConversationTurn[],
  proposal: null as Commitment | null,
  accepted: null as Commitment | null,
  turnsUsed: 0,
  pending: false,
  fallbackActive: false,
  authoredStepId: null as string | null,
  authoredResolved: false,
  sessionLog: [] as SessionLogEntry[],
};

export const useCase3V2Store = create<Case3V2State>((set, get) => ({
  ...initialState,

  setMode(mode) {
    set({ mode, screen: "opening" });
    log(set, "init", { mode });
  },

  goTo(screen) {
    set({ screen });
  },

  askMaya(topicId) {
    if (get().mayaAsked[topicId]) return;
    set((s) => ({ mayaAsked: { ...s.mayaAsked, [topicId]: true } }));
    log(set, "authored_action", { kind: "ask_maya", topicId });
  },

  askHale(topicId) {
    const s = get();
    if (s.haleAsked[topicId]) return;
    const topic = HALE_TOPICS.find((t) => t.id === topicId);
    if (!topic || !s.haleKnows[topic.requiresRelay]) return;
    set((st) => ({
      haleAsked: { ...st.haleAsked, [topicId]: true },
      haleExplorationLines: [...st.haleExplorationLines, { role: "hale", text: topic.response }],
    }));
    log(set, "authored_action", { kind: "ask_hale", topicId });
  },

  relay(fact) {
    if (get().haleKnows[fact]) return;
    const copy = RELAY_COPY[fact];
    if (!get().mayaAsked[copy.requiresTopic]) return;
    set((s) => ({
      haleKnows: { ...s.haleKnows, [fact]: true },
      haleExplorationLines: [...s.haleExplorationLines, { role: "hale", text: copy.haleAck }],
    }));
    log(set, "relay", { fact });
  },

  enterClimax() {
    const mode = get().mode;
    if (mode === "authored") {
      set((s) => ({
        screen: "climax",
        authoredStepId: AUTHORED_START,
        conversation: [...s.conversation, { role: "hale", text: AUTHORED_TREE[AUTHORED_START].prompt }],
      }));
      return;
    }
    set({ screen: "climax" });
  },

  async sendPlayerMessage(text) {
    const s = get();
    if (s.pending || s.fallbackActive || s.turnsUsed >= TURN_LIMIT) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const nextHistory = [...s.conversation, { role: "player" as const, text: trimmed }];
    set({ conversation: nextHistory, pending: true });
    log(set, "turn_sent", { turnsUsed: s.turnsUsed, message: trimmed });

    try {
      const res = await fetch("/api/hale-negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: s.conversation,
          haleKnows: s.haleKnows,
          acceptedCommitment: s.accepted,
          currentProposal: s.proposal,
          turnsUsed: s.turnsUsed,
          message: trimmed,
        }),
      });

      if (!res.ok) throw new Error(`http_${res.status}`);
      const data = (await res.json()) as NegotiateResponse;
      if (typeof data.dialogue !== "string") throw new Error("malformed_response");

      const prevAccepted = get().accepted;
      set((st) => ({
        conversation: [...st.conversation, { role: "hale" as const, text: data.dialogue, cue: data.cue }],
        proposal: data.proposal ?? st.proposal,
        accepted: data.acceptedCommitment ?? st.accepted,
        turnsUsed: st.turnsUsed + 1,
        pending: false,
      }));
      log(set, "turn_received", { signal: data.signal, proposal: data.proposal, acceptedCommitment: data.acceptedCommitment, latencyMs: data.latencyMs });
      if (data.acceptedCommitment && data.acceptedCommitment !== prevAccepted) {
        log(set, "commitment_change", { from: prevAccepted, to: data.acceptedCommitment });
      }
    } catch (err) {
      const resumeStep = resumeAuthoredStep(get().accepted);
      set((st) => ({
        pending: false,
        fallbackActive: true,
        authoredStepId: resumeStep,
        conversation: resumeStep ? [...st.conversation, { role: "hale" as const, text: AUTHORED_TREE[resumeStep].prompt }] : st.conversation,
      }));
      log(set, "fallback_used", { reason: String(err), resumeStep });
      log(set, "error", { message: String(err) });
    }
  },

  authoredChoose(optionId) {
    const s = get();
    const step = s.authoredStepId ? AUTHORED_TREE[s.authoredStepId] : null;
    const option = step?.options.find((o) => o.id === optionId);
    if (!step || !option) return;

    const newAccepted = !option.accept
      ? s.accepted
      : option.explicitRevision
        ? applyExplicitRevision(s.accepted, option.accept)
        : applyEscalation(s.accepted, option.accept);
    const prevAccepted = s.accepted;
    const nextPrompt = option.next ? AUTHORED_TREE[option.next].prompt : null;
    set({
      conversation: [
        ...s.conversation,
        { role: "player", text: option.label },
        { role: "hale", text: option.haleReply },
        ...(nextPrompt ? [{ role: "hale" as const, text: nextPrompt }] : []),
      ],
      proposal: option.proposal ?? s.proposal,
      accepted: newAccepted,
      authoredStepId: option.next,
      authoredResolved: option.next === null,
    });
    log(set, "authored_action", { kind: "choose", stepId: step.id, optionId });
    if (option.accept && option.accept !== prevAccepted) {
      log(set, "commitment_change", { from: prevAccepted, to: option.accept });
    }
  },

  endClimaxEarly() {
    set({ screen: "execution" });
    log(set, "outcome", { finalCommitment: get().finalCommitment(), endedEarly: true });
  },

  finalCommitment() {
    return get().accepted ?? "standard";
  },

  reset() {
    set({ ...initialState, sessionLog: [] });
  },
}));

