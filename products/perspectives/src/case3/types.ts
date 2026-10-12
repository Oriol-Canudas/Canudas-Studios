// ─────────────────────────────────────────────────────────────────────────
// PERSPECTIVES — Case 003 — Flight 702 — CRISIS v1 types.
//
// Deliberately separate from src/game/types.ts. Case 002 / Ascent's
// WitnessConfig/TestimonyTopic shape is an INVESTIGATION grammar (ask
// anything, any order, evidence/stage gates). CRISIS v1 is a different
// grammar (INCOMPLETE MODEL -> PRESSURE -> DECISION -> CONSEQUENCE ->
// STATE CHANGE -> ESCALATION -> COMMIT) and forcing it into the same
// shape would blur a distinction this whole design exercise exists to
// test. See PERSPECTIVES_CASE_003_Flight_702.md (external design pack)
// for the frozen baseline this implements.
//
// C003-AMD-004 (amendment, this round): the conversation surface moved
// from free-text (with an optional pre-fill suggestion) to fully
// authored, explicit question choices — see data.ts's header comment
// for the full rationale. AgentTopic is shaped around that: `prompt` is
// the literal button label, `response` the authored answer, no keyword
// matching involved anywhere.
// ─────────────────────────────────────────────────────────────────────────

export type AgentId = "hale" | "maya" | "rory";

export type FireStatus = "unknown" | "confirmed_smoldering";

/** This build's scope ends at D1's consequence — see README_FOR_CLAUDE.md (asset pack) and BUILD_BRIEF_Claude_Case_003.md. Acts III/IV exist as types for forward-compat only, never reachable yet. */
export type ActId = "cold_open" | "I" | "II" | "III" | "IV";

export type Screen =
  | "cold_open"
  | "act1_hale"
  | "act1_maya_interrupt"
  | "act1_rory_interrupt"
  | "act2_room"
  | "d1_decision"
  | "d1_consequence"
  | "scope_end"; // explicit "this build stops here" screen, never a silent dead end

export interface AgentTopic {
  id: string;
  /** The literal question shown on the button. Never phrased to reveal hidden information before it's actually unlocked. */
  prompt: string;
  response: string;
  /** Pressure cost when asked for the FIRST time. Rereading is always free — see store.ts's askedTopics. */
  cost: number;
  /** Gates this topic behind another one already having been asked — same agent by default, or a different one (the cross-witness "challenge" pattern). Omitted = always available from the start. */
  requiresAsked?: { agent?: AgentId; topicId: string };
}

export interface AgentDef {
  id: AgentId;
  name: string;
  role: string;
  portrait: string;
  topics: AgentTopic[];
  /** The 2-3 topic ids offered during Act I's single free pick — a subset of `topics`, reused as-is (same authored content, not a separate copy). */
  act1Topics?: string[];
}

export interface PressureLedgerEntry {
  label: string;
  delta: number;
  pressureAfter: number;
}
