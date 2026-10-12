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
  /** Keywords used for best-effort free-text matching — same lightweight approach as Case 002's matchTopic, not a claim of real NLU. */
  keywords: string[];
  response: string;
  /** Marks this as content authored for the no-aviation-knowledge-required rule — never gates anything, purely a reviewer's note. */
  plainLanguageCheck?: string;
}

export interface AgentDef {
  id: AgentId;
  name: string;
  role: string;
  portrait: string;
  topics: AgentTopic[];
  deflection: string;
}

export interface PressureLedgerEntry {
  label: string;
  delta: number;
  pressureAfter: number;
}
