// ─────────────────────────────────────────────────────────────────────────
// Core types for Perspective — Case 002: "The Last Message"
//
// IMPORTANT: Ground truth lives in caseData.ts as plain data, never as LLM
// output. Witnesses only ever say things derivable from their own
// `knows` / `secrets` — never from GROUND_TRUTH directly. This file just
// defines the shapes.
// ─────────────────────────────────────────────────────────────────────────

export type WitnessId = "elena" | "sofia" | "tom" | "marco" | "julia";

/**
 * Fixed vocabulary so the UI can style these consistently. Roughly ordered
 * by escalating pressure, but witnesses don't have to move monotonically
 * through it — it reflects their state after the most recent testimony
 * advance, authored per-stage in caseData.ts.
 */
export type Demeanor =
  | "composed"
  | "guarded"
  | "defensive"
  | "nervous"
  | "shaken"
  | "panicking"
  | "resigned";

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

/** One hand-authored, individually meaningful fact drawn from a document. Not a transcript dump — a curated reading of it, same as an investigator would write up. */
export interface EvidenceFact {
  time?: string;
  content: string;
  type: BoardEntryType;
}

/** A single step in a witness's progressive testimony on one topic. */
export interface TestimonyStage {
  /** What the witness says at this stage. */
  text: string;
  /** Alternate line used only when this stage is reached by the player presenting evidence directly in conversation, rather than by asking again. References the specific document. */
  presentedText?: string;
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
  /** If set, the witness's displayed demeanor updates to this once this stage is (newly) reached. */
  demeanor?: Demeanor;
}

/**
 * Flavor-only categorization of a question's tone — purely cosmetic
 * (wording + chip color), no mechanical effect on gating or demeanor.
 * Keeps the suggestion row varied without turning tone into a stat/dice
 * mechanic.
 */
export type QuestionTone = "soft" | "neutral" | "accusative";

export interface TestimonyTopic {
  id: string;
  /** Human label shown as a suggested-question chip. */
  chipLabel: string;
  /** Cosmetic tone tag for chip color/wording variety. Defaults to "neutral". */
  tone?: QuestionTone;
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
  /** 3 short punchy bullets for the full-screen dossier — not the full context paragraph. */
  keyFacts: string[];
  portraitPrompt: string; // the brief used to generate portraitImage
  portraitImage: string; // public/ path to the generated portrait
  accentColor: string; // tailwind-ish hex for their theme tint
  baselineDemeanor: Demeanor;
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
