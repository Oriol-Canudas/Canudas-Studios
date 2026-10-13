// ─────────────────────────────────────────────────────────────────────────
// Flight 702 v2 — EXPERIMENTAL prototype, isolated from /case3 entirely.
// Tests one mechanism: reactive authored exploration -> bounded AI
// negotiation with Hale -> an executable commitment -> a visible
// consequence. Route A only (locked scope). See data.ts's header comment
// for the two explicit experimental amendments (AMD-A, AMD-B).
// ─────────────────────────────────────────────────────────────────────────

/** The only three executable outcomes. Strictly ordered — a negotiation
 * may only ever move RIGHT along this list, never left (see
 * negotiation.ts). standard/full_prep are the same causal shape as the
 * existing /case3 outcomes; crew_only is the new, labeled middle option
 * (AMD-A). */
export type Commitment = "standard" | "crew_only" | "full_prep";

export type Mode = "ai" | "authored";

export interface HaleKnows {
  sensorDoubt: boolean;
  sealUncertainty: boolean;
}

export interface MayaAsked {
  sensor_doubt: boolean;
  seal_request: boolean;
  history: boolean;
}

export type ConversationRole = "player" | "hale" | "system";

export interface ConversationTurn {
  role: ConversationRole;
  text: string;
  cue?: string | null;
}

export type Signal =
  | "clarify"
  | "object"
  | "counter_proposal"
  | "request_condition"
  | "accept_partial"
  | "accept_full"
  | "persuade_revise"
  | "reject"
  | "acknowledge"
  /** The ONE signal that may legitimately move a commitment DOWN — only
   * when the player has explicitly proposed scaling the plan back (e.g.
   * "withdraw the evacuation, keep the crews") and Hale explicitly agrees
   * to exactly that in the same turn. Never used for anything else. */
  | "revise_down";

export type Screen = "landing" | "opening" | "exploration" | "climax_intro" | "climax" | "execution" | "reveal";

export interface SessionLogEntry {
  ts: number;
  type:
    | "init"
    | "authored_action"
    | "relay"
    | "turn_sent"
    | "turn_received"
    | "fallback_used"
    | "commitment_change"
    | "outcome"
    | "error";
  payload: Record<string, unknown>;
}

/** What the server returns for one AI negotiation turn — see
 * api/hale-negotiate.ts. `acceptedCommitment`/`proposal` here are the
 * SERVER's validated values, which the client stores as its new truth
 * (never computes its own competing version) — same "client sends raw
 * state, server independently validates" split as witness-chat.ts. */
export interface NegotiateResponse {
  dialogue: string;
  cue: string | null;
  signal: Signal;
  acceptedCommitment: Commitment | null;
  proposal: Commitment | null;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
}
