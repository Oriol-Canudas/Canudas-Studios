// ─────────────────────────────────────────────────────────────────────────
// Server-side OpenAI adapter for the Tom free-form conversation scene.
//
// Vercel auto-deploys any file under /api as a serverless function with
// zero config (Root Directory is already set to products/perspectives —
// see DECISIONS.md). No @vercel/node dependency: Vercel's Node runtime
// calls a plain (req, res) handler and auto-parses a JSON body into
// req.body when the content-type is application/json, so loose typing
// here is a deliberate choice, not an oversight.
//
// Hard boundaries this file exists to enforce:
//   - OPENAI_API_KEY is read from process.env ONLY, never sent to the
//     client, never logged.
//   - This endpoint NEVER decides game state on its own. "interpret"
//     proposes a classification; the client re-validates it against real
//     state (witnessEngine.ts's validateInterpretation) before anything
//     acts on it. "perform" proposes ONLY a short action cue — the
//     witness's actual dialogue text is supplied BY the caller (already
//     authored, already validated) and is never rewritten here.
//   - Diagnostics logged (console.log, visible in Vercel's function logs)
//     are metadata only — witnessId, action, model, token counts,
//     latency — never raw message or dialogue content.
// ─────────────────────────────────────────────────────────────────────────

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_MESSAGE_CHARS = 600;
const MAX_CUE_CHARS = 140;
const REQUEST_TIMEOUT_MS = 10000;

function aiAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && process.env.AI_WITNESS_CHAT_DISABLED !== "1";
}

async function callOpenAI(messages: { role: string; content: string }[], maxTokens: number, jsonMode: boolean) {
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
        max_tokens: maxTokens,
        temperature: 0.4,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
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

/** One retry on transient failure only — never on a malformed-response error, which a retry can't fix. */
async function callOpenAIWithRetry(messages: { role: string; content: string }[], maxTokens: number, jsonMode: boolean) {
  try {
    return await callOpenAI(messages, maxTokens, jsonMode);
  } catch {
    await new Promise((r) => setTimeout(r, 400));
    return await callOpenAI(messages, maxTokens, jsonMode);
  }
}

function logDiagnostic(entry: Record<string, unknown>) {
  // Metadata only, by design — see file header. Never pass message/
  // authoredText/dialogue content into this call.
  console.log("[witness-chat]", JSON.stringify({ t: Date.now(), ...entry }));
}

async function handleInterpret(body: any, res: any) {
  const witnessId = String(body?.witnessId ?? "");
  const message = String(body?.message ?? "").slice(0, MAX_MESSAGE_CHARS);
  const topics: { id: string; chipLabel: string }[] = Array.isArray(body?.topics) ? body.topics : [];
  const knownEvidenceIds: string[] = Array.isArray(body?.knownEvidenceIds) ? body.knownEvidenceIds : [];
  const evidenceTitles: Record<string, string> = body?.evidenceTitles ?? {};

  if (!message) return res.status(400).json({ error: "empty_message" });

  const topicList = topics.map((t) => `- ${t.id}: ${t.chipLabel}`).join("\n");
  const evidenceList = knownEvidenceIds.map((id) => `- ${id}: ${evidenceTitles[id] ?? id}`).join("\n") || "(none known yet)";

  const systemPrompt = `You classify a player's free-text question to a murder-case witness named ${witnessId}. You do NOT know what actually happened and you must NOT invent facts — you only classify the player's message.

Available topics this witness can be asked about:
${topicList}

Evidence items the player has actually shown or has available to reference (ONLY these may be cited — never invent an evidence id):
${evidenceList}

Respond with strict JSON only, matching exactly:
{"intent": "accusation" | "evidence_challenge" | "empathetic_appeal" | "general_question" | "off_topic" | "unclear", "topicId": string | null, "citedEvidenceIds": string[], "confidence": number between 0 and 1}

Rules:
- "accusation": the player confronts/accuses without citing any evidence from the list above.
- "evidence_challenge": the player cites or clearly references one or more of the evidence items above.
- "empathetic_appeal": the player acknowledges the witness's fear/position, offers understanding, with or without evidence.
- "topicId" must be one of the ids listed above, or null if none fit.
- "citedEvidenceIds" must only contain ids from the evidence list above — never invent one.
- The player may write in English or Catalan.`;

  const started = Date.now();
  const { content, usage, latencyMs } = await callOpenAIWithRetry(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    150,
    true
  );

  let parsed: any = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    // malformed — caller (interpreter.ts) treats this as a failure and
    // falls back to the deterministic path. We still log it as a failure
    // mode worth seeing in diagnostics.
    logDiagnostic({ witnessId, action: "interpret", model: MODEL, ok: false, reason: "malformed_json", latencyMs: Date.now() - started });
    return res.status(502).json({ error: "malformed_response" });
  }

  logDiagnostic({
    witnessId,
    action: "interpret",
    model: MODEL,
    ok: true,
    latencyMs,
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
  });

  return res.status(200).json({
    intent: parsed.intent,
    topicId: parsed.topicId ?? null,
    citedEvidenceIds: Array.isArray(parsed.citedEvidenceIds) ? parsed.citedEvidenceIds : [],
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    _model: MODEL,
  });
}

async function handlePerform(body: any, res: any) {
  const witnessId = String(body?.witnessId ?? "");
  const authoredText = String(body?.authoredText ?? "").slice(0, 1000);
  const eventKind = String(body?.eventKind ?? "normal_advance");
  const recentHistory: { role: string; text: string }[] = Array.isArray(body?.recentHistory) ? body.recentHistory.slice(-6) : [];

  if (!authoredText) return res.status(400).json({ error: "empty_authored_text" });

  const historyBlock = recentHistory.map((m) => `${m.role}: ${m.text}`).join("\n") || "(start of conversation)";

  const systemPrompt = `You add a SHORT stage direction (performance cue) for a tense witness interrogation scene. You do NOT write or alter dialogue — the witness's actual line is fixed and given to you only as context for tone.

Scene event type: ${eventKind}
Recent exchange:
${historyBlock}

The witness's line that is about to be delivered (for tone only — do not repeat or rewrite it):
"${authoredText}"

Respond with strict JSON only: {"action": string or null}
"action" is a short (under 15 words) third-person stage direction, e.g. "Tom looks away, then meets your eyes." or "Tom's jaw tightens." Return null if no cue fits naturally. Never describe the witness confessing, lying, or being guilty/innocent — only physical/behavioral cues.`;

  const started = Date.now();
  const { content, usage, latencyMs } = await callOpenAIWithRetry(
    [{ role: "system", content: systemPrompt }],
    80,
    true
  );

  let parsed: any = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    logDiagnostic({ witnessId, action: "perform", model: MODEL, ok: false, reason: "malformed_json", latencyMs: Date.now() - started });
    return res.status(502).json({ error: "malformed_response" });
  }

  logDiagnostic({
    witnessId,
    action: "perform",
    model: MODEL,
    ok: true,
    latencyMs,
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
  });

  const action = typeof parsed.action === "string" ? parsed.action.slice(0, MAX_CUE_CHARS) : undefined;
  return res.status(200).json({ action });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  if (!aiAvailable()) {
    return res.status(503).json({ error: "ai_unavailable" });
  }

  const body = req.body ?? {};
  try {
    if (body.action === "interpret") return await handleInterpret(body, res);
    if (body.action === "perform") return await handlePerform(body, res);
    return res.status(400).json({ error: "unknown_action" });
  } catch (err) {
    logDiagnostic({ action: body.action, ok: false, reason: "exception", message: err instanceof Error ? err.message : String(err) });
    return res.status(502).json({ error: "upstream_failure" });
  }
}
