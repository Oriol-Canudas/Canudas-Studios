// Self-contained — same convention as director-respond.ts/chapter-finalize.ts.
//
// Three narrow, bounded AI contributions for the "Un petit record"
// template, each returning only data — never a screen, a navigation
// decision, or a "this is saved" verdict. The app (MemoryActivityScreen.tsx)
// owns every transition; this file only ever answers the one question it's asked:
//
// 1. { mode: 'interpret', rawText, starterLabel, language } — does her
//    answer already have enough material for a faithful 40-80 word
//    memory, and if not, what's the ONE concrete thing missing (never a
//    generic "tell me more", never asking for a date/full name/location/
//    family relationship unless that's genuinely what's missing).
// 2. { mode: 'draft', rawText, detail?, starterLabel, language } — craft
//    {title, body}, 40-80 words, her meaning and point of view only,
//    never inventing dialogue/dates/feelings/events.
// 3. { mode: 'revise', currentTitle, currentBody, instruction, language }
//    — apply one plain-language correction to the existing draft.

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.5'
const REQUEST_TIMEOUT_MS = 20000
const MAX_FIELD_CHARS = 4000

type Language = 'es' | 'ca' | 'en'

function aiAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && process.env.AI_MEMORY_DRAFT_DISABLED !== '1'
}

function logDiagnostic(data: Record<string, unknown>) {
  console.log(JSON.stringify({ at: 'memory-draft', ...data }))
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

function languageOf(value: unknown): Language {
  return value === 'es' || value === 'en' ? value : 'ca'
}

function langLine(language: Language, verb: 'write' | 'respond'): string {
  if (language === 'ca') return verb === 'write' ? 'Escriu-ho en català.' : 'Respon en català.'
  if (language === 'en') return verb === 'write' ? 'Write it in English.' : 'Respond in English.'
  return verb === 'write' ? 'Escríbelo en español.' : 'Responde en español.'
}

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

async function callModel(instructions: string, userContent: string): Promise<any | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: MODEL, instructions, input: [{ role: 'user', content: userContent }] }),
      signal: controller.signal,
    })
    if (!response.ok) {
      logDiagnostic({ outcome: 'non_2xx', status: response.status })
      return null
    }
    const data: any = await response.json()
    const rawText = extractMessageText(data?.output ?? [])
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    return jsonMatch ? safeJsonParse(jsonMatch[0]) : null
  } catch (err) {
    logDiagnostic({ outcome: 'error', message: err instanceof Error ? err.message : 'unknown' })
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function buildInterpretInstructions(language: Language): string {
  return [
    "You are checking whether a short personal memory already has enough real material in it to become a faithful 40-80 word memory card, or whether one concrete thing is genuinely missing.",
    langLine(language, 'respond'),
    '',
    'HONESTY: never ask for a date, full name, exact location, or family relationship unless the text is so bare that no faithful card could be written without it. Most short, specific answers are already sufficient — lean toward sufficient=true. Never ask a generic "tell me more" question.',
    '',
    'Respond with ONLY a single JSON object, no other prose:',
    '{"sufficient": boolean, "clarificationPrompt": string | null}',
    'clarificationPrompt: one short, specific, warm question about the ONE concrete thing missing — null when sufficient is true.',
  ].join('\n')
}

function buildDraftInstructions(language: Language): string {
  return [
    'You are crafting a short memory card from what she actually said — a title and a 40-80 word memory (shorter if the source material is sparse).',
    langLine(language, 'write'),
    '',
    'HONESTY, ABSOLUTE RULE: use only what she actually said. Never invent dialogue, dates, feelings, or events. Preserve her own meaning and point of view. No generic sentimental embellishment ("a precious, unforgettable moment...") — write it with real craft instead.',
    '',
    'Respond with ONLY a single JSON object, no other prose:',
    '{"title": string, "body": string}',
    'title: short, evocative, in her voice.',
    'body: the memory itself, 40-80 words (shorter if there truly is not enough material), her own words and meaning, never a bullet list.',
  ].join('\n')
}

function buildReviseInstructions(language: Language): string {
  return [
    'You are revising an existing short memory card per one plain-language instruction from her.',
    langLine(language, 'write'),
    '',
    'HONESTY: apply exactly the requested change. Preserve everything else from the existing draft and its original source material. Never invent new facts to satisfy the instruction.',
    '',
    'Respond with ONLY a single JSON object, no other prose:',
    '{"title": string, "body": string}',
  ].join('\n')
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
  const language = languageOf(body?.language)
  const mode = body?.mode

  if (mode === 'interpret') {
    const rawText = sanitizeText(body?.rawText)
    const starterLabel = sanitizeText(body?.starterLabel)
    if (!rawText) return res.status(400).json({ error: 'missing_raw_text' })

    const parsed = await callModel(
      buildInterpretInstructions(language),
      `STARTING POINT: ${starterLabel}\n\nWHAT SHE SAID: ${rawText}`,
    )
    if (!parsed || typeof parsed.sufficient !== 'boolean') {
      // Best-effort — if interpretation fails, just fall through to the
      // generic authored detail prompt rather than blocking her.
      return res.status(200).json({ sufficient: false, clarificationPrompt: null })
    }
    return res.status(200).json({
      sufficient: parsed.sufficient,
      clarificationPrompt: parsed.sufficient ? null : sanitizeText(parsed.clarificationPrompt) || null,
    })
  }

  if (mode === 'draft') {
    const rawText = sanitizeText(body?.rawText)
    const detail = body?.detail ? sanitizeText(body.detail) : ''
    const starterLabel = sanitizeText(body?.starterLabel)
    if (!rawText) return res.status(400).json({ error: 'missing_raw_text' })

    const userContent = [
      `STARTING POINT: ${starterLabel}`,
      `WHAT SHE SAID: ${rawText}`,
      detail ? `ADDITIONAL DETAIL SHE GAVE: ${detail}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    const parsed = await callModel(buildDraftInstructions(language), userContent)
    if (!parsed || typeof parsed.title !== 'string' || typeof parsed.body !== 'string') {
      return res.status(502).json({ error: 'draft_failed' })
    }
    return res.status(200).json({ title: sanitizeText(parsed.title), body: sanitizeText(parsed.body) })
  }

  if (mode === 'revise') {
    const currentTitle = sanitizeText(body?.currentTitle)
    const currentBody = sanitizeText(body?.currentBody)
    const instruction = sanitizeText(body?.instruction)
    if (!currentBody || !instruction) return res.status(400).json({ error: 'missing_fields' })

    const parsed = await callModel(
      buildReviseInstructions(language),
      `CURRENT TITLE: ${currentTitle}\n\nCURRENT BODY: ${currentBody}\n\nREQUESTED CHANGE: ${instruction}`,
    )
    if (!parsed || typeof parsed.title !== 'string' || typeof parsed.body !== 'string') {
      return res.status(502).json({ error: 'revise_failed' })
    }
    return res.status(200).json({ title: sanitizeText(parsed.title), body: sanitizeText(parsed.body) })
  }

  return res.status(400).json({ error: 'unknown_mode' })
}
