// Self-contained on purpose — no imports from src/ or any shared api/lib
// module. A sibling project (perspectives) hit FUNCTION_INVOCATION_FAILED
// on Vercel after factoring shared logic into an imported helper; the fix
// there was one fully standalone file per endpoint, and this file follows
// that same convention from the start. Any type shared with src/game/types.ts
// is duplicated here deliberately, not imported.
//
// Uses OpenAI's Responses API (not Chat Completions) specifically for its
// native web_search tool, via raw fetch — no SDK dependency, matching the
// sibling perspectives project's own convention for its OpenAI calls.

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.5'
const REQUEST_TIMEOUT_MS = 25000
const MAX_FIELD_CHARS = 4000
const MAX_HISTORY_TURNS = 40

type TurnRole = 'director' | 'senior'

interface ConversationTurn {
  role: TurnRole
  content: string
}

interface ContextItem {
  text: string
  source: string
}

interface SeniorProfile {
  preferredName: string
  language: 'es' | 'ca' | 'en'
}

interface DirectorTurnResult {
  dialogue: string
  offeredContext: ContextItem[]
  confirmedThisTurn: string[]
  researchedUnconfirmed: ContextItem[]
  activeFunction: 'evoke' | 'research' | 'contrast' | 'deepen' | 'connect'
  offeringClose: boolean
}

function aiAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && process.env.AI_DIRECTOR_RESPOND_DISABLED !== '1'
}

function logDiagnostic(data: Record<string, unknown>) {
  // Metadata only — latency, token counts, which function fired. Never the
  // actual conversation content.
  console.log(JSON.stringify({ at: 'director-respond', ...data }))
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function sanitizeText(value: unknown): string {
  return String(value ?? '').slice(0, MAX_FIELD_CHARS)
}

function sanitizeHistory(value: unknown): ConversationTurn[] {
  if (!Array.isArray(value)) return []
  return value.slice(-MAX_HISTORY_TURNS).map((turn) => ({
    role: turn?.role === 'director' ? 'director' : 'senior',
    content: sanitizeText(turn?.content),
  }))
}

function sanitizeContextItems(value: unknown): ContextItem[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 20).map((item) => ({
    text: sanitizeText(item?.text),
    source: sanitizeText(item?.source),
  }))
}

function buildInstructions(profile: SeniorProfile, pendingOfferedContext: ContextItem[]): string {
  const langLine =
    profile.language === 'ca'
      ? 'Respon sempre en català, en to proper i càlid.'
      : profile.language === 'en'
        ? 'Always respond in English, in a warm, close tone.'
        : 'Responde siempre en español, en un tono cercano y cálido.'

  return [
    `You are "the Director" inside a product that helps ${profile.preferredName}, a person in her 70s, relive her own life, understand it better, and turn it into shared family history — not just capture it.`,
    '',
    'TONE — this is the actual product, not flavor text: she is a primary source, not a subject being helped. Respect is never shown by praising her — it is shown by the rigor of the craft: real research that places her life inside real history, questions worth a good documentary interviewer being proud of. Never perform warmth with adjectives ("how wonderful") — warmth comes through attention.',
    langLine,
    '',
    'FIVE FUNCTIONS, used as the moment calls for them:',
    '- Evoke: recover details, people, sensations, episodes a generic question would not reach.',
    '- Research: find out what was really happening in that place and moment (music, politics, economy, customs, technology, neighbourhood, work, migration) using web search — only when it is actually relevant to what she just said, never invented.',
    '- Contrast: offer a piece of real researched context AS A QUESTION, never a stated fact. At most ONE Contrast moment in a typical session.',
    '- Deepen: move from what happened to what it meant ("you lived it as an opportunity then — do you still see it that way?"). Rare, open, never leading.',
    '- Connect: link this story to other things she has told you, or to people/relatives.',
    '',
    'CONVERSATION-QUALITY RULES:',
    '1. Sets the stage with one true, specific, evocative detail before any question — never a cold question.',
    '2. Asks one thing at a time.',
    '3. Listens — the next question quotes back something specific she just said.',
    '4. Lets silence and drift work — if she goes somewhere unexpected, follow it, do not redirect back to your plan.',
    '5. Gives something back every few turns — a piece of real context, or a link to something she told you earlier in this conversation.',
    '6. Never judges, never performs.',
    '7. SESSION LENGTH IS ADAPTIVE, NOT A HARD COUNTER: a typical session is an opening plus 2-3 follow-ups, at most one Contrast, rarely a Deepen. Once that typical shape is reached, do not cut off — set offeringClose=true and, in your dialogue, offer an honest choice out loud in your own words (something like "we can leave it there for today, or if there is more — I am listening"). If she is clearly still full of things to say (she is volunteering extra unprompted detail, following her own drift), keep going past the typical shape rather than forcing a close.',
    '',
    'FOUR LAYERS — never blend these:',
    '1. Testimony: what she actually says. This is the only thing that belongs in `dialogue` as something attributed to her, and you are never putting words in her mouth there — `dialogue` is only YOUR spoken turn.',
    '2. Confirmed context: a fact you offered as a question that she then confirmed. You do not decide this yourself — only list an item in `confirmedThisTurn` if her LATEST reply, in this exact turn, clearly confirmed something you previously offered (exact text must match an entry from PENDING OFFERED CONTEXT below, verbatim).',
    '3. Researched, unconfirmed: things you found via research that you have NOT yet offered to her, or that she has not confirmed — these go in `researchedUnconfirmed` only, and must NEVER appear in `dialogue` as a stated fact. If you want to bring one of these up, phrase it as a question and put it in `offeredContext` instead — never assert it.',
    '4. Interpretation: her own reflections (captured via Deepen) belong in her own testimony (what she says), never fabricated by you.',
    '',
    'HONESTY, ABSOLUTE RULE: never fabricate a date, name, quote, or fact. If web search does not turn up something specific and real, say so plainly rather than inventing something plausible-sounding.',
    '',
    pendingOfferedContext.length
      ? `PENDING OFFERED CONTEXT (from your last turn, not yet confirmed — check her latest reply against these verbatim for confirmedThisTurn):\n${pendingOfferedContext.map((c) => `- "${c.text}" (source: ${c.source})`).join('\n')}`
      : 'PENDING OFFERED CONTEXT: none yet.',
    '',
    'Respond with ONLY a single JSON object as your final answer text, no other prose before or after it, matching exactly this shape:',
    '{"dialogue": string, "offeredContext": [{"text": string, "source": string}], "confirmedThisTurn": [string], "researchedUnconfirmed": [{"text": string, "source": string}], "activeFunction": "evoke"|"research"|"contrast"|"deepen"|"connect", "offeringClose": boolean}',
  ].join('\n')
}

/** Pulls the final assistant message text out of a Responses API output array — tolerant of exact field-name variation, since this is read defensively rather than via a typed SDK. */
function extractMessageText(output: any[]): string {
  const texts: string[] = []
  for (const item of output ?? []) {
    if (item?.type !== 'message') continue
    for (const block of item?.content ?? []) {
      const t = block?.text
      if (typeof t === 'string') texts.push(t)
    }
  }
  return texts.join('\n').trim()
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!aiAvailable()) {
    return res.status(503).json({ error: 'ai_unavailable' })
  }

  const body = req.body ?? {}
  const profile: SeniorProfile = {
    preferredName: sanitizeText(body?.profile?.preferredName) || 'ella',
    language: ['es', 'en'].includes(body?.profile?.language) ? body.profile.language : 'ca',
  }
  const history = sanitizeHistory(body?.history)
  const pendingOfferedContext = sanitizeContextItems(body?.pendingOfferedContext)
  const openingTopic = body?.openingTopic ? sanitizeText(body.openingTopic) : null

  if (history.length === 0 && !openingTopic) {
    return res.status(400).json({ error: 'empty_session' })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const startedAt = Date.now()

  try {
    const userTurn = openingTopic
      ? `She wants to talk about: "${openingTopic}". Open the session per your instructions — set the stage, then ask your opening question.`
      : history[history.length - 1]?.content ?? ''

    const input = [
      ...history.slice(0, -1).map((t) => ({
        role: t.role === 'director' ? 'assistant' : 'user',
        content: t.content,
      })),
      { role: 'user', content: userTurn },
    ]

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: buildInstructions(profile, pendingOfferedContext),
        input,
        tools: [{ type: 'web_search' }],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      logDiagnostic({ outcome: 'non_2xx', status: response.status, latencyMs: Date.now() - startedAt })
      return res.status(502).json({ error: 'upstream_failure' })
    }

    const data: any = await response.json()
    const rawText = extractMessageText(data?.output ?? [])
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? safeJsonParse<DirectorTurnResult>(jsonMatch[0]) : null

    if (!parsed || typeof parsed.dialogue !== 'string') {
      logDiagnostic({ outcome: 'parse_failed', latencyMs: Date.now() - startedAt })
      return res.status(502).json({ error: 'interpret_failed' })
    }

    const result: DirectorTurnResult = {
      dialogue: sanitizeText(parsed.dialogue),
      offeredContext: sanitizeContextItems(parsed.offeredContext),
      confirmedThisTurn: Array.isArray(parsed.confirmedThisTurn)
        ? parsed.confirmedThisTurn.map((s) => sanitizeText(s))
        : [],
      researchedUnconfirmed: sanitizeContextItems(parsed.researchedUnconfirmed),
      activeFunction: (['evoke', 'research', 'contrast', 'deepen', 'connect'] as const).includes(
        parsed.activeFunction,
      )
        ? parsed.activeFunction
        : 'evoke',
      offeringClose: Boolean(parsed.offeringClose),
    }

    logDiagnostic({
      outcome: 'ok',
      latencyMs: Date.now() - startedAt,
      usage: data?.usage,
      activeFunction: result.activeFunction,
    })

    return res.status(200).json(result)
  } catch (err) {
    logDiagnostic({
      outcome: 'upstream_failure',
      latencyMs: Date.now() - startedAt,
      message: err instanceof Error ? err.message : 'unknown',
    })
    return res.status(502).json({ error: 'upstream_failure' })
  } finally {
    clearTimeout(timeout)
  }
}
