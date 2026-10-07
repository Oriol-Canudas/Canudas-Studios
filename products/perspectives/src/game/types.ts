// ─────────────────────────────────────────────────────────────────────────
// Core types for Perspective — Case 002: "The Last Message"
//
// IMPORTANT: Ground truth lives in caseData.ts as plain data, never as LLM
// output. Witnesses only ever say things derivable from their own
// `knows` / `secrets` — never from GROUND_TRUTH directly. This file just
// defines the shapes.
// ─────────────────────────────────────────────────────────────────────────

export type WitnessId = "elena" | "sofia" | "tom" | "marco" | "julia";

export type EvidenceId =
  | "E01_knife"
  | "E02_msg_sofia_2306"
  | "E03_entrance_camera"
  | "E04_forensic_prelim"
  | "E05_daniel_phone_records"
  | "E06_elena_phone_records"
  | "E07_tom_phone_records"
  | "E08_garage_access_log";

export interface EvidenceItem {
  id: EvidenceId;
  title: string;
  category: "physical" | "message" | "video" | "forensic" | "records";
  /** Shown on the card before it's opened. */
  summary: string;
  /** Full content shown once opened. Can be multi-line. */
  details: string[];
  /** true = visible/discoverable from the start of the case. */
  initial: boolean;
}

export type BoardEntryType = "fact" | "claim" | "contradiction" | "lead";

export interface BoardEntry {
  id: string;
  type: BoardEntryType;
  text: string;
  /** witnessId if this came from testimony, otherwise undefined for pure evidence facts. */
  source?: WitnessId | "evidence";
  timestamp?: string; // in-world time label e.g. "23:50", used for timeline sorting
}

/** A single step in a witness's progressive testimony on one topic. */
export interface TestimonyStage {
  /** What the witness says at this stage. */
  text: string;
  /** Evidence that must be discovered before this stage can be reached. */
  requiresEvidence?: EvidenceId[];
  /** Another witness topic that must already be at/past a given stage. */
  requiresWitnessStage?: { witness: WitnessId; topic: string; minStage: number };
  /** Minimum number of times this topic must have been asked about before advancing (gates "pressure"). */
  minAskCount?: number;
  /** Board entries to add the first time this stage is reached. */
  addsBoardEntries?: Omit<BoardEntry, "id">[];
  /** Evidence this stage newly unlocks (e.g. a witness points you to a record). */
  unlocksEvidence?: EvidenceId[];
}

export interface TestimonyTopic {
  id: string;
  /** Human label shown as a suggested-question chip. */
  chipLabel: string;
  /** Keywords/synonyms used to match free-form player questions to this topic. */
  keywords: string[];
  stages: TestimonyStage[];
}

export interface WitnessConfig {
  id: WitnessId;
  name: string;
  role: string;
  age?: number;
  context: string; // short intro paragraph shown at top of witness screen
  portraitPrompt: string; // used if/when we generate real portraits
  accentColor: string; // tailwind-ish hex for their theme tint
  topics: TestimonyTopic[];
  /** Line used when the player's question doesn't match any topic. Rotates. */
  deflections: string[];
}

export type ResponsibleParty = "elena" | "sofia" | "tom" | "someone_else" | "insufficient_evidence";
export type ElenaVerdict = "guilty" | "not_guilty" | "insufficient_evidence";

export interface PlayerVerdict {
  theory: string;
  responsible: ResponsibleParty;
  elenaVerdict: ElenaVerdict;
}
