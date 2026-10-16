// Self-contained on purpose — same convention as director-respond.ts, see
// its header comment for why (the FUNCTION_INVOCATION_FAILED lesson from
// the sibling perspectives project).
//
// Two request shapes, same endpoint:
// 1. { profile, history, confirmedContext, questionId? } — craft the
//    chapter from a finished conversation (one OpenAI call, never
//    inventing beyond what was actually said/confirmed), write it to
//    Supabase as status 'draft' along with its conversation_turns, and
//    return the draft. "Draft" because she hasn't approved it yet — see
//    the product doc: "before a chapter leaves the house, the person
//    hears or sees it crafted back and confirms or corrects it."
// 2. { chapterId, confirm: true } — a lean DB-only update, no AI call:
//    flips that chapter to status 'confirmed' and marks its question (if
//    any) answered.

import { createClient } from '@supabase/supabase-js'

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.5'
const REQUEST_TIMEOUT_MS = 25000
const MAX_FIELD_CHARS = 4000
const MAX_HISTORY_TURNS = 60

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
  language: 'es' | 'ca'
}

function aiAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && process.env.AI_CHAPTER_FINALIZE_DISABLED !== '1'
}

function dbAvailable(): boolean {
  return Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function logDiagnostic(data: Record<string, unknown>) {
  console.log(JSON.stringify({ at: 'chapter-finalize', ...data }))
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

function buildCraftInstructions(profile: SeniorProfile): string {
  const langLine =
    profile.language === 'ca'
      ? 'Escriu-ho en català.'
      : 'Escríbelo en español.'

  return [
    `You are crafting a finished chapter from a conversation the Director just had with ${profile.preferredName}, a person in her 70s, about her own life.`,
    langLine,
    '',
    'HONESTY, ABSOLUTE RULE: the chapter is built ONLY from what she actually said (her testimony turns) and context she genuinely confirmed. Never invent a detail, date, or quote that is not in the conversation. If something was offered as context but never confirmed, leave it out entirely — do not sneak it in as if it were fact.',
    '',
    'TONE: the same respect-through-rigor principle as the conversation itself — no performed warmth, no "how wonderful." Write it with real craft, like something worth printing in a real book, not a transcript summary.',
    '',
    'Respond with ONLY a single JSON object as your final answer text, no other prose before or after it, matching exactly this shape:',
    '{"title": string, "testimonyText": string}',
    'title: short, evocative, in her voice, never a bare label.',
    'testimonyText: the crafted chapter itself, a few warm paragraphs weaving her own words and whatever context she actually confirmed — never a bullet-point recap.',
  ].join('\n')
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!dbAvailable()) {
    return res.status(503).json({ error: 'db_unavailable' })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const body = req.body ?? {}

  // --- Path 2: confirm an existing draft (no AI call) ---
  if (body?.confirm === true) {
    const chapterId = sanitizeText(body?.chapterId)
    if (!chapterId) return res.status(400).json({ error: 'missing_chapter_id' })

    const { data: chapter, error: fetchError } = await supabase
      .from('chapters')
      .select('id, title, testimony_text, question_id')
      .eq('id', chapterId)
      .maybeSingle()

    if (fetchError || !chapter) {
      logDiagnostic({ outcome: 'confirm_chapter_not_found', chapterId })
      return res.status(404).json({ error: 'chapter_not_found' })
    }

    const { error: updateError } = await supabase
      .from('chapters')
      .update({ status: 'confirmed' })
      .eq('id', chapterId)

    if (updateError) {
      logDiagnostic({ outcome: 'confirm_update_failed', message: updateError.message })
      return res.status(502).json({ error: 'db_error' })
    }

    if (chapter.question_id) {
      await supabase.from('questions').update({ status: 'answered' }).eq('id', chapter.question_id)
    }

    logDiagnostic({ outcome: 'confirmed', chapterId })
    return res.status(200).json({
      id: chapter.id,
      title: chapter.title,
      testimonyText: chapter.testimony_text,
    })
  }

  // --- Path 1: craft a fresh draft ---
  if (!aiAvailable()) {
    return res.status(503).json({ error: 'ai_unavailable' })
  }

  const profile: SeniorProfile = {
    preferredName: sanitizeText(body?.profile?.preferredName) || 'ella',
    language: body?.profile?.language === 'es' ? 'es' : 'ca',
  }
  const history = sanitizeHistory(body?.history)
  const confirmedContext = sanitizeContextItems(body?.confirmedContext)
  const questionId = body?.questionId ? sanitizeText(body.questionId) : null

  if (history.length === 0) {
    return res.status(400).json({ error: 'empty_conversation' })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const startedAt = Date.now()

  try {
    const transcript = history.map((t) => `${t.role === 'director' ? 'Director' : profile.preferredName}: ${t.content}`).join('\n\n')
    const confirmedBlock = confirmedContext.length
      ? `\n\nCONFIRMED CONTEXT (safe to use):\n${confirmedContext.map((c) => `- ${c.text}`).join('\n')}`
      : ''

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: buildCraftInstructions(profile),
        input: [{ role: 'user', content: `CONVERSATION:\n${transcript}${confirmedBlock}` }],
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
    const parsed = jsonMatch ? safeJsonParse<{ title: string; testimonyText: string }>(jsonMatch[0]) : null

    if (!parsed || typeof parsed.title !== 'string' || typeof parsed.testimonyText !== 'string') {
      logDiagnostic({ outcome: 'parse_failed', latencyMs: Date.now() - startedAt })
      return res.status(502).json({ error: 'interpret_failed' })
    }

    const { data: senior } = await supabase.from('seniors').select('id').limit(1).maybeSingle()
    if (!senior) {
      logDiagnostic({ outcome: 'no_senior_seeded' })
      return res.status(500).json({ error: 'no_senior_seeded' })
    }

    const { data: chapter, error: insertError } = await supabase
      .from('chapters')
      .insert({
        senior_id: senior.id,
        question_id: questionId,
        content_type: 'moment',
        title: sanitizeText(parsed.title),
        testimony_text: sanitizeText(parsed.testimonyText),
        confirmed_context: confirmedContext,
        status: 'draft',
      })
      .select('id, title, testimony_text')
      .single()

    if (insertError || !chapter) {
      logDiagnostic({ outcome: 'chapter_insert_failed', message: insertError?.message })
      return res.status(502).json({ error: 'db_error' })
    }

    const turnRows = history.map((t) => ({
      senior_id: senior.id,
      chapter_id: chapter.id,
      role: t.role,
      content: t.content,
    }))
    await supabase.from('conversation_turns').insert(turnRows)

    logDiagnostic({
      outcome: 'ok',
      latencyMs: Date.now() - startedAt,
      usage: data?.usage,
      chapterId: chapter.id,
    })

    return res.status(200).json({
      id: chapter.id,
      title: chapter.title,
      testimonyText: chapter.testimony_text,
    })
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
