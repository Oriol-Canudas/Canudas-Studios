// ─────────────────────────────────────────────────────────────────────────
// Core types for Perspective — Case 002: "The Last Message"
//
// IMPORTANT: Ground truth lives in caseData.ts as plain data, never as LLM
// output. Witnesses only ever say things derivable from their own
// `knows` / `secrets` — never from GROUND_TRUTH directly. This file just
// defines the shapes.
// ─────────────────────────────────────────────────────────────────────────

// A plain string, not a literal union — this engine is meant to run more
// than one case. The single source of truth for which ids actually exist
// is always WITNESSES in the active case's data file, never this type.
export type WitnessId = string;

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

// Same reasoning as WitnessId — plain string, source of truth is EVIDENCE
// in the active case's data file.
export type EvidenceId = string;

export interface EvidenceItem {
  id: EvidenceId;
  title: string;
  /** Plain string, not a fixed union — each case picks its own categories. EvidenceScreen.tsx's CATEGORY_ICON falls back to a generic icon for one it doesn't recognize. */
  category: string;
  /** Shown on the card before it's opened. */
  summary: string;
  /** Full content shown once opened. Can be multi-line. */
  details: string[];
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

export interface TestimonyTopic {
  id: string;
  /** Human label shown as a suggested-question chip. */
  chipLabel: string;
  /**
   * Optional short keyword/phrase shown on the chip INSTEAD of chipLabel,
   * for easier scanning — e.g. "The timing" rather than "Why did you
   * initiate this PIP now?". Tapping the chip still fills the draft with
   * the full chipLabel sentence, unchanged; this only affects what's
   * printed on the chip itself. Falls back to chipLabel when unset, so
   * every case authored before this field keeps its exact current look.
   */
  chipKeyword?: string;
  /** Keywords/synonyms used to match free-form player questions to this topic. */
  keywords: string[];
  stages: TestimonyStage[];
  /**
   * Marks this topic as a proactive contact: a witness-INITIATED opening,
   * not an answer to a question. Once eligible (its own stage-0 gates —
   * ordinary requiresEvidence/requiresWitnessStage/minAskCount, reused
   * as-is — plus requiresRelayedTo below, if set) it's delivered as the
   * witness's own line the next time their chat opens, never waiting for
   * the player to ask, and badged on HearScreen while eligible but not
   * yet delivered. Delivery deliberately does NOT mark the topic
   * "engaged" (witnessStages stays at -1) until the player actually
   * replies — an unprompted opening isn't the same as the player having
   * engaged with it, and this is what lets an unsupported-accusation
   * REPLY still trigger the existing defensive-lock mechanic exactly as
   * it would for any other topic, rather than being silently exempted
   * because "something already happened here."
   */
  proactive?: {
    /** Shown on HearScreen while this is eligible and undelivered. */
    badgeLabel: string;
    /**
     * The one thing the existing altUnlock shape can't express: a fact
     * relayed to a DIFFERENT witness than this topic's own (altUnlock's
     * requiresRelayed only ever checks THIS witness's own
     * relayedRevelations). Omit for a contact with no relay prerequisite
     * (e.g. an opening beat available from the very start).
     */
    requiresRelayedTo?: { witness: WitnessId; revelationId: RevelationId };
  };
}

/**
 * A fact significant enough that telling another witness about it could
 * plausibly change what they say — the belief-propagation substrate.
 * "Known" is derived purely from existing stage-reach state (the same
 * signal `requiresWitnessStage` already uses), never a new flag to keep
 * in sync by hand.
 *
 * Plain string, not a literal union — same reasoning as WitnessId/
 * EvidenceId. This was a latent bug: a prior generalization round widened
 * WitnessId/EvidenceId but left this one hardcoded to Case 002's own six
 * ids, which would have silently blocked any second case from authoring
 * its own revelations. The real source of truth is always REVELATIONS in
 * the active case's data file.
 */
export type RevelationId = string;

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
  /**
   * Opt-in per witness (see "Untouchable"'s Marcus/Priya) — gives
   * demeanor real mechanical weight beyond portrait/flavor-line/badge.
   * Absent/undefined is a complete no-op, zero behavior change for every
   * witness in every case before this one.
   */
  demeanorEffects?: {
    /** Once this demeanor has held for DEMEANOR_COOLDOWN_TURNS real turns without de-escalating, the next not-yet-engaged topic the player opens gets locked defensive immediately too — a real cost for staying combative, not just flavor. */
    lockNextTopicOnSustained?: Demeanor;
    /** Once this demeanor is reached, the witness can end the session early (after one more real turn) rather than staying available indefinitely. */
    endsSessionOn?: Demeanor[];
  };
  /** One-line teaser shown on the cast-intro slide (see introSlides.ts) — e.g. their public position or relationship to the case. Case-authored, not derived. */
  introHook?: string;
}

// Generic, N-axis verdict shape — not hardcoded to "responsible" +
// "elenaVerdict" (Case 002's specific two questions). Each case authors
// its own VerdictAxis[] (see verdictGrading.ts's VerdictGradingConfig for
// how a case pairs axes with grading logic and headlines).
export interface VerdictOption {
  id: string;
  label: string;
}
export interface VerdictAxis {
  id: string;
  /** Shown as the screen's prompt for this axis, e.g. "Who is responsible for Daniel's death?" */
  question: string;
  /** Compact label for contexts with little room (share text, result badges) — e.g. "Responsible" vs. the full question. Defaults to the axis id if omitted. */
  shortLabel?: string;
  options: VerdictOption[];
}

export interface PlayerVerdict {
  theory: string;
  /** axisId -> the chosen optionId on that axis. */
  choices: Record<string, string>;
}

/**
 * Optional, per-case dynamic reveal narrative — the causal picture RevealScreen
 * renders ABOVE the static ground-truth text, built from what actually
 * happened in THIS playthrough (never invented). A case with nothing
 * beyond its static reveal copy (e.g. Case 002, which predates this)
 * exports a buildRevealNarrative() that always returns null, and
 * RevealScreen simply skips this section.
 */
export interface RevealNarrative {
  /** What was true before the player ever arrived — safe-to-reveal ground truth, not news to anyone but the player. */
  before: string[];
  /** What the player actually discovered (or never did) — derived from real stage-reach state, never assumed. */
  discovered: string[];
  /** What the player changed through conversation — commitments actually secured, specifically. */
  changed: string[];
  /** How the final choice, discoveries, and commitments actually played out together. */
  outcome: string[];
  /** Optional case-specific image shown above `outcome` — e.g. a distinct visual for a branch with real narrative weight. Undefined for every case that doesn't set one. */
  outcomeImage?: string;
  /**
   * Optional collapsed "Another side of the story" detail at the end of
   * the outcome block, matching Concert's own reveal-block pattern.
   * Grounded, conditional content only — never a static line. Undefined
   * for every case that doesn't set one.
   */
  anotherSide?: string;
}

/**
 * Opt-in, per-case soft clock — a shared resource that ticks down as the
 * player takes actions (never real wall-clock time; see DECISIONS.md on
 * why). A case that doesn't want time pressure exports `null` for this —
 * Case 002 does, unchanged from today's "ask as much as you want." The
 * engine treats `null` as "this mechanic doesn't exist for this case,"
 * not "zero time left."
 */
export interface TimePressureConfig {
  totalMinutes: number;
  /** Minutes consumed per action kind. */
  costMinutes: {
    ask: number;
    presentEvidence: number;
    relay: number;
  };
  /** Shown in the clock UI, e.g. "until the storm hits the ridge". */
  label: string;
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
