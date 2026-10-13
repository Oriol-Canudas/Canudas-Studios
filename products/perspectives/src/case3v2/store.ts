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
  /** Bumped on endClimaxEarly/reset — an in-flight sendPlayerMessage
   * captures the generation it started under and discards its result if
   * this has since changed, so a response that resolves after the player
   * has already left the negotiation can't silently rewrite state on a
   * screen they're no longer on. */
  turnGeneration: number;
  /** True when the model's last turn reported signal "wants_to_close" —
   * shows a free (no model call) confirm-and-continue prompt instead of
   * requiring the separate end button or silently closing on its own. */
  closeRequested: boolean;

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
  turnGeneration: 0,
  closeRequested: false,
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
    // AI mode needs the same opening beat, for parity with authored mode
    // (confirmed gap: without this, the transcript opened empty with no
    // greeting at all). Deterministic and free — no model call — the
    // model only ever sees it as already-said history once the player
    // actually sends their first message.
    set((s) => ({
      screen: "climax",
      conversation: [...s.conversation, { role: "hale", text: AUTHORED_TREE[AUTHORED_START].prompt }],
    }));
  },

  async sendPlayerMessage(text) {
    const s = get();
    if (s.pending || s.fallbackActive || s.turnsUsed >= TURN_LIMIT) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const myGeneration = s.turnGeneration;
    const nextHistory = [...s.conversation, { role: "player" as const, text: trimmed }];
    set({ conversation: nextHistory, pending: true, closeRequested: false });
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

      // The player may have already left the negotiation (end button,
      // turn-limit auto-resolve) while this request was in flight — a
      // late response must not silently rewrite state on a screen
      // they're no longer looking at.
      if (get().turnGeneration !== myGeneration) {
        log(set, "turn_received", { signal: data.signal, stale: true, discarded: true });
        return;
      }

      const prevAccepted = get().accepted;
      set((st) => ({
        conversation: [...st.conversation, { role: "hale" as const, text: data.dialogue, cue: data.cue }],
        proposal: data.proposal ?? st.proposal,
        accepted: data.acceptedCommitment ?? st.accepted,
        turnsUsed: st.turnsUsed + 1,
        pending: false,
        closeRequested: data.signal === "wants_to_close",
      }));
      log(set, "turn_received", { signal: data.signal, proposal: data.proposal, acceptedCommitment: data.acceptedCommitment, latencyMs: data.latencyMs });
      if (data.acceptedCommitment && data.acceptedCommitment !== prevAccepted) {
        log(set, "commitment_change", { from: prevAccepted, to: data.acceptedCommitment });
      }
    } catch (err) {
      if (get().turnGeneration !== myGeneration) {
        log(set, "fallback_used", { reason: String(err), stale: true, discarded: true });
        return;
      }
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
    set((s) => ({
      screen: "execution",
      pending: false,
      closeRequested: false,
      turnGeneration: s.turnGeneration + 1, // any in-flight response for the old generation is now discarded on arrival
    }));
    log(set, "outcome", { finalCommitment: get().finalCommitment(), endedEarly: true });
  },

  finalCommitment() {
    return get().accepted ?? "standard";
  },

  reset() {
    set({ ...initialState, sessionLog: [] });
  },
}));

