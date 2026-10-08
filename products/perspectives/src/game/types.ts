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
  /**
   * An alternate way to reach THIS stage without its requiresEvidence/
   * requiresWitnessStage/minAskCount gates — via a conversational
   * intervention instead. Evaluated as an OR against the normal gates,
   * never a requirement on top of them. Both conditions are checked
   * against objective, already-tracked state — never the model's
   * interpretation of what the player merely claimed:
   *   - requiresRelayed: these revelations must already be in
   *     relayedRevelations for this witness (only ever set by the
   *     explicit relay action, never inferred from free text).
   *   - requiresIntent: the player's CLASSIFIED intent on this turn
   *     (validated the same way every intent already is) must be one
   *     of these.
   * The model never decides the unlock — it only classifies intent; the
   * deterministic engine evaluates this gate exactly like any other.
   */
  altUnlock?: {
    requiresRelayed: RevelationId[];
    requiresIntent: ConversationIntent[];
  };
  /** Text used specifically when this stage is reached via altUnlock rather than evidence or a plain ask — lets the line acknowledge WHY the witness is now willing to say this. Falls back to `text` if absent. */
  altUnlockText?: string;
  /**
   * Reactions only (WitnessConfig.reactions[revelationId]): when true,
   * `text` is an ANCHOR fed to the generate pass as the one new fact this
   * witness just learned, rather than the final displayed line — the
   * model paraphrases around it, still bounded by this witness's own
   * current authorized-disclosure set, so the player can follow up on the
   * reaction in their own words. On any validation failure, falls back to
   * `text` verbatim — today's exact behavior. Omitted/false (the default
   * for every existing reaction) is unchanged: `text` is shown as-is.
   */
  generative?: boolean;
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

/**
 * A fact significant enough that telling another witness about it could
 * plausibly change what they say — the belief-propagation substrate.
 * "Known" is derived purely from existing stage-reach state (the same
 * signal `requiresWitnessStage` already uses), never a new flag to keep
 * in sync by hand.
 */
export type RevelationId =
  | "tom_returned"
  | "tom_confessed"
  | "sofia_visited"
  | "elena_shoved"
  | "daniel_lied_to_both"
  | "sofia_contact_hidden";

export interface RevelationDef {
  id: RevelationId;
  /** Shown on the relay picker and in the "you tell them" chat line. */
  label: string;
  /** The stage that, once reached by the player, makes this fact known. */
  source: { witness: WitnessId; topic: string; minStage: number };
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
  /**
   * This witness's one-shot reaction if the player relays a given
   * revelation to them, authored per (witness, revelation) pair. Not
   * every witness reacts to every revelation — only `text`,
   * `addsBoardEntries`, and `demeanor` are meaningful here; the gating
   * fields on `TestimonyStage` don't apply to a one-shot reaction.
   */
  reactions?: Partial<Record<RevelationId, TestimonyStage>>;
  /** Line used when the player's question doesn't match any topic. Rotates. */
  deflections: string[];
  /**
   * Shown when a topic gets locked by an unsupported accusation (free-form
   * conversation only — see ConversationIntent). Rotates like deflections.
   * Witnesses without this never enter the accusation/defensive mechanic.
   */
  defensiveLines?: string[];
  /**
   * Portrait variant per emotional state, for the cinematic reveal
   * (conversation intro + mid-conversation state changes). Deliberately
   * sparse — only the states a witness actually reaches in the authored
   * data get a dedicated image; `baselineDemeanor` should always have one
   * (usually `portraitImage` itself). A state with no entry here falls
   * back to the nearest one already shown, never a broken image.
   */
  demeanorImages?: Partial<Record<Demeanor, string>>;
  /** One-line behavior description shown alongside a demeanorImages portrait — "what you'd notice if you looked up right now," not plot information. */
  demeanorLines?: Partial<Record<Demeanor, string>>;
  /** Whether this witness gets the AI-backed free-form conversation (interpret → authorize → generate → validate) rather than chip-only deterministic matching. Opt-in per witness; everyone defaults to deterministic-only. */
  freeformEnabled?: boolean;
}

export type ResponsibleParty = "elena" | "sofia" | "tom" | "someone_else" | "insufficient_evidence";
export type ElenaVerdict = "guilty" | "not_guilty" | "insufficient_evidence";

export interface PlayerVerdict {
  theory: string;
  responsible: ResponsibleParty;
  elenaVerdict: ElenaVerdict;
}

// ─────────────────────────────────────────────────────────────────────────
// Free-form conversation (currently: Tom only — see DECISIONS.md).
//
// Strict separation, per the brief: authored facts → character knowledge →
// validated scene transitions → generated dialogue. The model NEVER
// decides what happened; it only (a) classifies what the player's free
// text is trying to do, cross-validated against real state before it's
// trusted, and (b) performs an already-authored, already-validated line —
// it does not invent the line's factual content.
// ─────────────────────────────────────────────────────────────────────────

/** What the engine believes the player's free-text message is doing — proposed by interpretation, then validated before anything acts on it. */
export type ConversationIntent =
  | "accusation" // confronts without evidence/admission backing it
  | "evidence_challenge" // cites real, already-known evidence
  | "empathetic_appeal" // acknowledges the witness's position, with or without evidence
  | "repair" // walks back or apologizes for the player's own earlier accusation/tone — never reclassified as a fresh accusation just because it mentions one
  | "general_question"
  | "off_topic"
  | "unclear";

export interface InterpretationResult {
  intent: ConversationIntent;
  /** Best-matching authored topic id, if any — must exist on the witness or it's discarded. */
  topicId: string | null;
  /** Evidence the message appears to reference — cross-checked against what's actually known before being trusted. */
  citedEvidenceIds: EvidenceId[];
  confidence: number;
}

/** The validated, authored outcome of one free-form turn — never something the model decided on its own. */
export type TurnEventKind =
  | "defensive_lock" // unsupported accusation closed a topic down
  | "evidence_admission" // evidence-backed contradiction produced a limited admission
  | "empathetic_recovery" // validated empathetic appeal reopened a defensive topic
  | "voluntary_disclosure" // reached via altUnlock (relay + the right intent) — never forced by evidence
  | "repair_acknowledged" // player walked back an earlier accusation; acknowledged, trust not automatically restored
  | "normal_advance" // an ordinary, already-reachable stage advance
  | "no_change"; // understood, but nothing new was reachable

export interface ConversationEvent {
  witnessId: WitnessId;
  t: number;
  kind: TurnEventKind;
  topicId: string | null;
  citedEvidenceIds: EvidenceId[];
  /** Plain-language note for the reveal's "what you established" summary. */
  summary: string;
}

export interface PerformanceCue {
  /** Short bracketed stage direction, e.g. "Tom looks away, then meets your eyes." Optional — not every beat earns one. */
  action?: string;
  /** Cosmetic pause before the line renders; never stacked on real network latency, always skippable. */
  pauseMs?: number;
}
