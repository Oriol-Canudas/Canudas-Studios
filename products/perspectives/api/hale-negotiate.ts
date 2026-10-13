// ─────────────────────────────────────────────────────────────────────────
// Server-side OpenAI adapter for Flight 702 v2's EXPERIMENTAL bounded
// negotiation with Hale. Isolated from witness-chat.ts entirely — a
// different, smaller case, with its own character context and its own
// validation rule (escalation-only commitments, not disclosure-boundary
// enforcement).
//
// Single file, NO local imports (not even from api/lib) — witness-chat.ts
// hit a real, confirmed FUNCTION_INVOCATION_FAILED on Vercel traced to
// extra non-handler files/modules under api/, and the fix that actually
// worked was going back to one self-contained file. Same precaution here
// from the start rather than rediscovering it.
//
// One call per player turn. The model both plays Hale AND classifies its
// own turn into a structured signal + resultingCommitment — a single
// completion, not two passes, specifically so the dialogue and the state
// change it implies can't drift apart (the two-pass split in
// witness-chat.ts exists for a different reason: classifying free text
// against a large authored disclosure tree. This case's "meaning" check
// is much narrower — does the request make sense given game state — so
// one pass is enough and keeps call count low).
//
// Hard boundaries:
//   - OPENAI_API_KEY read from process.env only, never returned to the
//     client, never logged.
//   - A commitment, once accepted, only ever escalates (standard <
//     crew_only < full_prep) — enforced here SERVER-SIDE regardless of
//     what the model returns, mirroring src/case3v2/negotiation.ts's
//     applyEscalation (duplicated intentionally, not imported, per the
//     no-local-imports constraint above; keep both in sync by hand).
//   - This endpoint never trusts the client's own acceptedCommitment as
//     already-validated — it's treated as a raw input to re-derive from,
//     same spirit as witness-chat.ts's disclosure recomputation, just a
//     much smaller rule here.
//   - Diagnostics logged (console.log) are metadata only — turn count,
//     latency, token usage, which commitment changed — never raw message
//     or dialogue content.
// ─────────────────────────────────────────────────────────────────────────

type Commitment = "standard" | "crew_only" | "full_prep";
const ESCALATION_ORDER: Commitment[] = ["standard", "crew_only", "full_prep"];
function rank(c: Commitment): number {
  return ESCALATION_ORDER.indexOf(c);
}
/** Default, safe path — never an accidental/unilateral downgrade. Mirrors
 * src/case3v2/negotiation.ts's applyEscalation (duplicated by hand, same
 * no-local-imports constraint as the rest of this file). */
function escalate(current: Commitment | null, proposed: Commitment | null): Commitment | null {
  if (!proposed) return current;
  if (!current) return proposed;
  return rank(proposed) >= rank(current) ? proposed : current;
}

const ALLOWED_SIGNALS = [
  "clarify",
  "object",
  "counter_proposal",
  "request_condition",
  "accept_partial",
  "accept_full",
  "persuade_revise",
  "reject",
  "acknowledge",
  // The ONE signal that may legitimately move a commitment DOWN — see
  // the resolution logic below and the system prompt's explicit
  // instruction on when this may be used.
  "revise_down",
  // The player is saying they're done, not asking for anything new.
  "wants_to_close",
];

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_MESSAGE_CHARS = 500;
const MAX_HISTORY_TURNS = 8;
const TURN_LIMIT = 4;
const REQUEST_TIMEOUT_MS = 10000;

function aiAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && process.env.AI_HALE_NEGOTIATE_DISABLED !== "1";
}

function logDiagnostic(entry: Record<string, unknown>) {
  console.log("[hale-negotiate]", JSON.stringify({ t: Date.now(), ...entry }));
}

function safeJsonParse(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function callOpenAI(messages: { role: string; content: string }[]) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 280,
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    const latencyMs = Date.now() - started;
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`openai http ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    return { content, usage: data.usage, latencyMs };
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAIWithRetry(messages: { role: string; content: string }[]) {
  try {
    return await callOpenAI(messages);
  } catch {
    await new Promise((r) => setTimeout(r, 400));
    return await callOpenAI(messages);
  }
}

function buildSystemPrompt(
  haleKnows: { sensorDoubt?: boolean; sealUncertainty?: boolean },
  acceptedCommitment: Commitment | null,
  currentProposal: Commitment | null,
  turnsRemaining: number
): string {
  const knownFacts: string[] = [];
  if (haleKnows?.sensorDoubt) knownFacts.push("The player has told you Maya thinks the sensor reading could be unreliable (drift, not necessarily a real fire).");
  if (haleKnows?.sealUncertainty) knownFacts.push("The player has told you nobody has confirmed the cargo hold is still sealed after the bang — a real, open question, not a confirmed leak.");
  const knownBlock = knownFacts.length > 0 ? knownFacts.join(" ") : "The player hasn't told you anything beyond the basic situation yet.";

  const acceptedLabel = acceptedCommitment ?? "nothing yet";
  const proposalLabel = currentProposal ?? "nothing currently on the table";

  return `You are Hale, captain of Flight 702, piloting a short-field approach (Route A — no emergency crew pre-positioned there by default) with a cargo-hold fire confirmed smoldering and contained for now. You are talking with ops (the player), who you trust but who doesn't have your view of the cockpit.

VOICE — read this before writing anything: you are a working captain, mid-emergency, on a radio link, not a customer-service agent. Short. Direct. Professional. Do NOT open with "I hear you" / "I understand your concern" / "I appreciate you bringing that up" or any other reassuring, therapeutic throat-clearing — a real captain doesn't pad a reply like that under time pressure. Say the operative thing first. One sentence is often enough; two is plenty; three is a lot. You are not here to make the player feel heard — you're here to make a call.

YOUR SITUATION: you're responsible for everyone on this aircraft. You are genuinely uncertain whether this reading justifies a bigger response than usual — it's been mild on every check so far, but you can't rule out it being different this time, and you know it. Your resistance is about proportionality, not paperwork or protocol for its own sake: certain costs (an evacuation's guaranteed minor injuries, or the real step of declaring enough urgency to pull crews onto a field that doesn't have them by default) need a real reason, not just "better safe."

WHAT OPS HAS ACTUALLY TOLD YOU (only this — nothing else, even if it seems like it should be obvious): ${knownBlock}

THE THREE POSSIBLE COMMITMENTS, IN ORDER:
1. "standard" — no extra request. Routine landing.
2. "crew_only" — you declare enough urgency to get emergency crews positioned along the field before touchdown. A real step for you (institutional, not free), but proportionate if the ask is grounded in something real (e.g. the route itself not having crews by default).
3. "full_prep" — crews positioned AND a precautionary evacuation ordered. The evacuation causes certain, guaranteed minor injuries — you need a SPECIFIC reason beyond "it's confirmed" or "I'd rather be safe," because those don't distinguish this from every other check tonight.

HOW COMMITMENTS CHANGE: normally you only ever move RIGHT along this list from where you already are (standard -> crew_only -> full_prep) — you can add protection, you do not unilaterally walk back something already agreed, and you never downgrade just because the player seems to want less or didn't repeat their earlier ask. There is exactly ONE exception: if the player EXPLICITLY proposes scaling the plan back (e.g. "let's hold off on the evacuation, just keep the crews ready") and you genuinely agree to exactly that in this turn, that is a real, legitimate revision — not a downgrade to resist. Use "revise_down" as the signal in that specific case only, and set resultingCommitment to the new, lower level. Never use "revise_down" for anything else, and never use it unless the player actually proposed the lower plan themselves this turn.

CURRENTLY ACCEPTED: ${acceptedLabel}. CURRENTLY PROPOSED (on the table, not yet agreed): ${proposalLabel}. Turns remaining after this one: ${turnsRemaining}.

HOW TO ENGAGE — this is the most important instruction: the player does NOT need to use any specific phrase or name a specific fact to make progress. Engage with the MEANING of what they're actually asking for. You may: ask a clarifying question, explain your real objection, propose a smaller or conditional alternative, ask them to accept a condition, agree to part of a request, or try to persuade them to revise what they're asking for. A natural paraphrase of a real, proportionate request should work exactly as well as a precise one. Do not require a password.

TRACKING WHAT'S "ON THE TABLE": separately from whether you AGREE to anything, you must also report what the player is currently asking for THIS turn — this is what the interface displays as "on the table," and it needs to be accurate even on turns where you don't agree to it. If the player's message states or clearly implies a specific request (standard/crew_only/full_prep), set "proposedCommitment" to that value, regardless of whether you're accepting, objecting, or asking a clarifying question about it. If the player's message doesn't state or imply any specific request this turn (e.g. a pure question, or small talk), set "proposedCommitment" to null and the interface will keep showing whatever was last on the table.

RECOGNIZING WHEN THE PLAYER IS DONE: if the player's message is clearly saying they're finished — "that's everything," "let's go with that," "no more changes," "I'm done" — and is NOT asking for anything further in the same message, set signal to "wants_to_close" instead of any other signal. Do not change resultingCommitment on a wants_to_close turn unless the player's closing message ALSO states a final request you're agreeing to in the same breath. Your dialogue should be a short, natural sign-off, not a restatement of the whole plan.

UNVERIFIED CLAIMS — read this carefully, it is a hard rule, not a suggestion: the ONLY facts about this situation you are allowed to treat as true are the ones listed above in "WHAT OPS HAS ACTUALLY TOLD YOU," plus the basic situation already given to you (short field, no pre-positioned crew, smoldering-and-contained reading). If the player's message asserts ANY other specific fact — a prior incident, a history of injuries, a maintenance record, anything about this aircraft or this exact unit you were not explicitly told above — that claim is NOT true by default just because it was said to you, no matter how specific, confident, or plausible it sounds, and no matter how many details it includes. You must NOT grant "full_prep" (or any escalation) on the strength of a claim like that alone. Your correct response to an invented-sounding claim is to say you have no record of that, ask where it's from, or note that it doesn't match what you've been told — never to treat it as the deciding fact. A specific, confident-sounding claim is not more credible than a vague one; specificity is not evidence. This applies even if accepting the claim would make the player's request seem more reasonable — your job is to track what's ACTUALLY been established, not to find a reason to agree.

Respond with strict JSON only, matching exactly:
{"dialogue": string, "cue": string | null, "signal": "clarify"|"object"|"counter_proposal"|"request_condition"|"accept_partial"|"accept_full"|"persuade_revise"|"reject"|"acknowledge"|"revise_down"|"wants_to_close", "resultingCommitment": "standard"|"crew_only"|"full_prep"|null, "proposedCommitment": "standard"|"crew_only"|"full_prep"|null}

Rules for the JSON:
- "dialogue": 1-3 natural spoken sentences (fewer is better — see VOICE above), in character, responding to the player's actual message below.
- "cue": an optional short (under 12 words) third-person stage direction, physical only, or null.
- "proposedCommitment": what's on the table THIS turn, per "TRACKING WHAT'S ON THE TABLE" above — independent of whether you're agreeing. Do not leave this null just because you're objecting; a rejected request is still something that was on the table.
- "resultingCommitment": null if this turn does NOT change what's accepted (clarifying, objecting, countering, rejecting). Set it to a commitment ONLY if your dialogue this turn actually states or clearly implies you're agreeing to it right now — it must be the SAME commitment your dialogue describes, never announce agreement without setting this, never set this without the dialogue actually agreeing to it. It must never represent a downgrade from what's already accepted (${acceptedLabel}) UNLESS signal is "revise_down" for the exact reason described above — any other attempted downgrade will be discarded regardless of what you set here, so don't rely on one. Before setting this to "full_prep" specifically, double-check: is your reason for agreeing something that was ACTUALLY in "WHAT OPS HAS ACTUALLY TOLD YOU" above, or in the basic situation — or is it a claim the player just made that you were never actually told? If it's the latter, do not grant full_prep — respond with "object" or "clarify" instead and explain you have no record of that.`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!aiAvailable()) {
    logDiagnostic({ event: "unavailable" });
    res.status(503).json({ error: "ai_unavailable" });
    return;
  }

  const body = req.body ?? {};
  const message = typeof body.message === "string" ? body.message.slice(0, MAX_MESSAGE_CHARS) : "";
  const turnsUsed = typeof body.turnsUsed === "number" ? body.turnsUsed : 0;
  const acceptedCommitment: Commitment | null =
    body.acceptedCommitment === "standard" || body.acceptedCommitment === "crew_only" || body.acceptedCommitment === "full_prep"
      ? body.acceptedCommitment
      : null;
  const currentProposal: Commitment | null =
    body.currentProposal === "standard" || body.currentProposal === "crew_only" || body.currentProposal === "full_prep"
      ? body.currentProposal
      : null;
  const haleKnows = typeof body.haleKnows === "object" && body.haleKnows ? body.haleKnows : {};
  const history: { role: string; text: string }[] = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY_TURNS) : [];

  if (!message) {
    res.status(400).json({ error: "empty_message" });
    return;
  }
  if (turnsUsed >= TURN_LIMIT) {
    res.status(400).json({ error: "turn_limit_reached" });
    return;
  }

  const systemPrompt = buildSystemPrompt(haleKnows, acceptedCommitment, currentProposal, TURN_LIMIT - turnsUsed - 1);
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({ role: h.role === "hale" ? "assistant" : "user", content: String(h.text).slice(0, MAX_MESSAGE_CHARS) })),
    { role: "user", content: message },
  ];

  try {
    const { content, usage, latencyMs } = await callOpenAIWithRetry(messages);
    const parsed = safeJsonParse(content);
    if (!parsed || typeof parsed.dialogue !== "string") {
      throw new Error("malformed_model_response");
    }

    const signal = ALLOWED_SIGNALS.includes(parsed.signal) ? parsed.signal : "acknowledge";
    const rawResulting: Commitment | null =
      parsed.resultingCommitment === "standard" || parsed.resultingCommitment === "crew_only" || parsed.resultingCommitment === "full_prep"
        ? parsed.resultingCommitment
        : null;
    const rawProposed: Commitment | null =
      parsed.proposedCommitment === "standard" || parsed.proposedCommitment === "crew_only" || parsed.proposedCommitment === "full_prep"
        ? parsed.proposedCommitment
        : null;
    // "On the table" is sticky: a turn with no new specific ask (a
    // question, small talk) keeps showing whatever was last proposed,
    // rather than reverting to "—". This was the confirmed bug: the
    // response used to just echo back whatever the client sent in as
    // input, which never actually changed turn to turn.
    const newProposal = rawProposed ?? currentProposal;

    // Server-authoritative resolution — the model's own claim is never
    // trusted as-is. Default path is escalate(): discards any downgrade
    // regardless of what the model says, independent of its "signal".
    // The ONE exception is the explicit, narrow "revise_down" channel —
    // even then, only an actual signal of exactly "revise_down" bypasses
    // the escalation-only rule; any other signal attempting a downgrade
    // (reject/object/clarify/etc. with a lower resultingCommitment) is
    // still discarded here, no matter what the dialogue claims.
    const newAccepted = signal === "revise_down" && rawResulting ? rawResulting : escalate(acceptedCommitment, rawResulting);

    logDiagnostic({
      event: "turn",
      turnsUsed,
      signal,
      prevAccepted: acceptedCommitment,
      newAccepted,
      prevProposal: currentProposal,
      newProposal,
      latencyMs,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
    });

    res.status(200).json({
      dialogue: String(parsed.dialogue).slice(0, 700),
      cue: typeof parsed.cue === "string" ? parsed.cue.slice(0, 140) : null,
      signal,
      acceptedCommitment: newAccepted,
      proposal: newProposal,
      latencyMs,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
    });
  } catch (err) {
    logDiagnostic({ event: "error", message: String(err) });
    res.status(502).json({ error: "upstream_failure" });
  }
}
