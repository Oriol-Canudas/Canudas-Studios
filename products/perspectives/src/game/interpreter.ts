// ─────────────────────────────────────────────────────────────────────────
// Free-text interpretation for the Tom conversation scene.
//
// Two paths share one contract (InterpretationResult): a deterministic,
// zero-dependency fallback that always works, and an AI-backed path that
// calls the server-side /api/witness-chat endpoint. Both are run through
// validateInterpretation() in witnessEngine.ts before anything acts on
// them — this module never gets to skip that check, by construction (it
// doesn't have access to real game state to decide trust on its own).
//
// If the AI call fails for ANY reason (no key configured, network error,
// malformed response, timeout) this silently degrades to the deterministic
// path. The scene must never break because a live model call failed — it
// just runs at the same quality as every other witness in that case.
// ─────────────────────────────────────────────────────────────────────────

import type { EvidenceId, InterpretationResult, PerformanceCue, TurnEventKind, WitnessConfig } from "./types";
import { matchTopic } from "./witnessEngine";

const REQUEST_TIMEOUT_MS = 12000;
const MAX_MESSAGE_CHARS = 600;

const ACCUSATION_MARKERS = [
  "kill",
  "killed",
  "murder",
  "murdered",
  "you did it",
  "did you do it",
  "you're lying",
  "you are lying",
  "stop lying",
  "quit lying",
  "guilty",
  "confess",
  "admit it",
  "you stabbed",
  "you killed him",
  "ho vas matar",
  "vas matar",
  "mens",
  "mentint",
];

const EMPATHY_MARKERS = [
  "understand",
  "i know this is hard",
  "must have been",
  "it's okay",
  "its okay",
  "not here to hurt",
  "i believe you",
  "take your time",
  "i get it",
  "must be scary",
  "must have been scary",
  "i'm not trying to",
  "im not trying to",
  "no estas en problemes",
  "no pasa nada",
  "entenc",
  "ho entenc",
  "se que es dificil",
];

function normalize(text: string): string {
  return text.toLowerCase();
}

/** Crude but honest: a reference counts only if it names something distinctive from a document's own title. */
function detectCitedEvidence(
  text: string,
  candidateIds: EvidenceId[],
  evidenceTitles: Record<string, string>
): EvidenceId[] {
  const normalized = normalize(text);
  return candidateIds.filter((id) => {
    const title = evidenceTitles[id]?.toLowerCase();
    if (!title) return false;
    return title.split(/\s+/).some((word) => word.replace(/[^a-z0-9]/g, "").length > 4 && normalized.includes(word));
  });
}

export interface InterpretContext {
  witness: WitnessConfig;
  rawText: string;
  /** Evidence actually known in THIS conversation — the only ones a citation can validly reference. */
  knownEvidenceIds: EvidenceId[];
  evidenceTitles: Record<string, string>;
}

/** Deterministic, zero-dependency fallback. Always available, always testable, always the thing a failed AI call degrades to. */
export function interpretDeterministic(ctx: InterpretContext): InterpretationResult {
  const text = ctx.rawText.slice(0, MAX_MESSAGE_CHARS);
  const normalized = normalize(text);
  const topic = matchTopic(ctx.witness, text);
  const citedEvidenceIds = detectCitedEvidence(text, ctx.knownEvidenceIds, ctx.evidenceTitles);

  const hasAccusation = ACCUSATION_MARKERS.some((m) => normalized.includes(m));
  const hasEmpathy = EMPATHY_MARKERS.some((m) => normalized.includes(m));

  let intent: InterpretationResult["intent"] = "general_question";
  if (citedEvidenceIds.length > 0 && hasEmpathy) intent = "empathetic_appeal";
  else if (citedEvidenceIds.length > 0) intent = "evidence_challenge";
  else if (hasAccusation) intent = "accusation";
  else if (hasEmpathy) intent = "empathetic_appeal";
  else if (!topic) intent = "off_topic";

  return { intent, topicId: topic?.id ?? null, citedEvidenceIds, confidence: topic ? 0.55 : 0.3 };
}

export interface InterpretOutcome {
  result: InterpretationResult;
  source: "ai" | "fallback";
  diagnostics?: { latencyMs: number; model?: string };
}

async function fetchJsonWithTimeout(url: string, body: unknown, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

/** Attempts the live AI interpretation; always falls back silently to the deterministic path on any failure. */
export async function interpretMessage(ctx: InterpretContext, aiEnabled: boolean): Promise<InterpretOutcome> {
  if (!aiEnabled) return { result: interpretDeterministic(ctx), source: "fallback" };

  const started = Date.now();
  try {
    const res = await fetchJsonWithTimeout(
      "/api/witness-chat",
      {
        action: "interpret",
        witnessId: ctx.witness.id,
        message: ctx.rawText.slice(0, MAX_MESSAGE_CHARS),
        topics: ctx.witness.topics.map((t) => ({ id: t.id, chipLabel: t.chipLabel })),
        knownEvidenceIds: ctx.knownEvidenceIds,
        evidenceTitles: ctx.evidenceTitles,
      },
      REQUEST_TIMEOUT_MS
    );
    if (!res.ok) throw new Error(`interpret http ${res.status}`);
    const data = await res.json();
    if (typeof data?.intent !== "string") throw new Error("malformed interpretation payload");
    return {
      result: data as InterpretationResult,
      source: "ai",
      diagnostics: { latencyMs: Date.now() - started, model: data._model },
    };
  } catch {
    return { result: interpretDeterministic(ctx), source: "fallback" };
  }
}

export interface PerformContext {
  witnessId: string;
  authoredText: string;
  eventKind: TurnEventKind;
  recentHistory: { role: string; text: string }[];
}

export interface PerformOutcome {
  text: string;
  cue?: PerformanceCue;
  source: "ai" | "fallback";
}

const DEFAULT_CUES: Partial<Record<TurnEventKind, PerformanceCue>> = {
  defensive_lock: { action: "Tom's jaw tightens.", pauseMs: 500 },
  evidence_admission: { action: "Tom looks away, then meets your eyes.", pauseMs: 700 },
  empathetic_recovery: { action: "Tom exhales, some of the tension leaving his shoulders.", pauseMs: 500 },
  normal_advance: { pauseMs: 300 },
  no_change: undefined,
};

/**
 * The model's ONLY creative latitude here is the short action cue — the
 * dialogue text itself stays the authored line verbatim, always. This is
 * a deliberate, narrower scope than full free-generation of Tom's replies:
 * it can't be safely verified without a real key to test against (see
 * DECISIONS.md), so this iteration keeps the content boundary hard and
 * only asks the model to add stage direction, not to rewrite testimony.
 */
export async function performLine(ctx: PerformContext, aiEnabled: boolean): Promise<PerformOutcome> {
  const fallbackCue = DEFAULT_CUES[ctx.eventKind];
  if (!aiEnabled) return { text: ctx.authoredText, cue: fallbackCue, source: "fallback" };

  try {
    const res = await fetchJsonWithTimeout(
      "/api/witness-chat",
      {
        action: "perform",
        witnessId: ctx.witnessId,
        authoredText: ctx.authoredText,
        eventKind: ctx.eventKind,
        recentHistory: ctx.recentHistory.slice(-6),
      },
      REQUEST_TIMEOUT_MS
    );
    if (!res.ok) throw new Error(`perform http ${res.status}`);
    const data = await res.json();
    if (typeof data?.action !== "string" && data?.action !== undefined) throw new Error("malformed cue payload");
    return { text: ctx.authoredText, cue: { action: data?.action, pauseMs: fallbackCue?.pauseMs }, source: "ai" };
  } catch {
    return { text: ctx.authoredText, cue: fallbackCue, source: "fallback" };
  }
}
