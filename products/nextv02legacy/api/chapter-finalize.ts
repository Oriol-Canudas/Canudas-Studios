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
import { createHmac, timingSafeEqual } from 'crypto'

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.5'
const REQUEST_TIMEOUT_MS = 25000
const MAX_FIELD_CHARS = 4000
const MAX_HISTORY_TURNS = 60

// Duplicated per-file by this project's self-contained api/*.ts convention
// (see api/session.ts, which issues this cookie).
function sessionSecret(): string {
  return process.env.SESSION_SECRET || ''
}
function signSeniorId(seniorId: string): string {
  return createHmac('sha256', sessionSecret()).update(seniorId).digest('hex')
}
function verifiedSeniorIdFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader || !sessionSecret()) return null
  const match = cookieHeader.match(/(?:^|;\s*)next_session=([^;]+)/)
  if (!match) return null
  let raw: string
  try {
    raw = decodeURIComponent(match[1])
  } catch {
    return null
  }
  const sep = raw.lastIndexOf('.')
  if (sep < 0) return null
  const seniorId = raw.slice(0, sep)
  const sig = raw.slice(sep + 1)
  if (!/^[0-9a-f]{64}$/.test(sig)) return null
  const expected = signSeniorId(seniorId)
  const sigBuf = Buffer.from(sig, 'hex')
  const expBuf = Buffer.from(expected, 'hex')
  if (sigBuf.length !== expBuf.length) return null
  if (!timingSafeEqual(sigBuf, expBuf)) return null
  return seniorId
}

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

function buildCraftInstructions(profile: SeniorProfile, existingChapter: { title: string; testimonyText: string } | null): string {
  const langLine =
    profile.language === 'ca'
      ? 'Escriu-ho en català.'
      : profile.language === 'en'
        ? 'Write it in English.'
        : 'Escríbelo en español.'

  return [
    existingChapter
      ? `You are extending an already-saved chapter of ${profile.preferredName}'s life story with new material from a follow-up conversation. Weave the new material into the existing chapter coherently — do not just append it as a disconnected paragraph, and do not drop or contradict anything already there unless the new conversation explicitly corrects it.`
      : `You are crafting a finished chapter from a conversation the Director just had with ${profile.preferredName}, a person in her 70s, about her own life.`,
    langLine,
    '',
    'HONESTY, ABSOLUTE RULE: the chapter is built ONLY from what she actually said (her testimony turns) and context she genuinely confirmed. Never invent a detail, date, or quote that is not in the conversation. If something was offered as context but never confirmed, leave it out entirely — do not sneak it in as if it were fact.',
    '',
    'TONE: the same respect-through-rigor principle as the conversation itself — no performed warmth, no "how wonderful." Write it with real craft, like something worth printing in a real book, not a transcript summary.',
    '',
    existingChapter
      ? `EXISTING CHAPTER (preserve this, extend it — do not rewrite it from scratch):\nTitle: ${existingChapter.title}\n${existingChapter.testimonyText}`
      : '',
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

// Same "subtle painted realism" style agreed on for the Director's own
// portrait — academic realist oil painting, fine brushwork, warm palette
// — kept consistent across every illustration in the Library so it reads
// as one book, not a grab-bag of styles.
const ILLUSTRATION_STYLE =
  'Subtle painted realism: academic realist oil painting, fine controlled brushwork visible only on close inspection, warm amber/terracotta/umber palette, soft natural light. No frame, no border, no text, no watermark — fills the entire canvas.'

function buildIllustrationPrompt(title: string, testimonyText: string): string {
  const excerpt = testimonyText.slice(0, 500)
  return `${ILLUSTRATION_STYLE}\n\nScene to paint, drawn from this chapter of someone's life story — "${title}": ${excerpt}`
}

interface ExtractedFamilyMember {
  name: string
  relationship: string
  note: string
}

interface FamilyMember extends ExtractedFamilyMember {
  id: string
  createdAt: string
}

function buildFamilyExtractionInstructions(language: SeniorProfile['language']): string {
  const langLine =
    language === 'ca'
      ? 'Escriu els camps en català, tal com ella ho diria.'
      : language === 'en'
        ? "Write the fields in English, in her own words' spirit."
        : 'Escribe los campos en español, tal como ella lo diría.'

  return [
    'You are extracting a structured list of family members mentioned in the chapter text below, for a family tree.',
    langLine,
    '',
    'HONESTY, ABSOLUTE RULE: only include people she actually named or clearly described as family. Never invent a person, a name, or a relationship.',
    '',
    'Respond with ONLY a single JSON object as your final answer text, no other prose before or after it, matching exactly this shape:',
    '{"members": [{"name": string, "relationship": string, "note": string}]}',
    'name: her name for them, exactly as she said it.',
    'relationship: a short relationship label (e.g. "mother", "husband", "eldest son") in her own words.',
    'note: one short line — a memory or detail she gave about this person. Empty string if she gave none.',
  ].join('\n')
}

// Best-effort, same spirit as the illustration call below — a failed
// extraction never blocks confirming the chapter itself.
async function extractFamilyMembers(
  language: SeniorProfile['language'],
  testimonyText: string,
): Promise<ExtractedFamilyMember[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: buildFamilyExtractionInstructions(language),
        input: [{ role: 'user', content: `CHAPTER TEXT:\n${testimonyText}` }],
      }),
      signal: controller.signal,
    })
    if (!response.ok) return []
    const data: any = await response.json()
    const rawText = extractMessageText(data?.output ?? [])
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? safeJsonParse<{ members: ExtractedFamilyMember[] }>(jsonMatch[0]) : null
    if (!parsed || !Array.isArray(parsed.members)) return []
    return parsed.members
      .filter((m) => m?.name)
      .map((m) => ({
        name: sanitizeText(m.name),
        relationship: sanitizeText(m.relationship),
        note: sanitizeText(m.note),
      }))
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeKey(name: string, relationship: string): string {
  return `${name.trim().toLowerCase()}|${relationship.trim().toLowerCase()}`
}

// Simple append-with-dedup merge — fine at this proof-of-concept scale
// (a handful of family members, not a dataset needing real conflict
// resolution). A repeat mention just fills in a note if the earlier
// entry didn't have one yet, rather than creating a duplicate person.
function mergeFamilyMembers(existing: FamilyMember[], incoming: ExtractedFamilyMember[]): FamilyMember[] {
  const byKey = new Map(existing.map((m) => [normalizeKey(m.name, m.relationship), m]))
  for (const member of incoming) {
    const key = normalizeKey(member.name, member.relationship)
    const current = byKey.get(key)
    if (current) {
      if (!current.note && member.note) current.note = member.note
    } else {
      byKey.set(key, { ...member, id: crypto.randomUUID(), createdAt: new Date().toISOString() })
    }
  }
  return Array.from(byKey.values())
}

// Best-effort — a failed illustration never blocks confirming the chapter
// itself, since the Library can show the text alone if this comes back null.
async function generateIllustrationBase64(prompt: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1024' }),
      signal: controller.signal,
    })
    if (!response.ok) return null
    const data: any = await response.json()
    const b64 = data?.data?.[0]?.b64_json
    return typeof b64 === 'string' ? b64 : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!dbAvailable()) {
    return res.status(503).json({ error: 'db_unavailable' })
  }

  const seniorId = verifiedSeniorIdFromCookie(req.headers.cookie)
  if (!seniorId) {
    return res.status(401).json({ error: 'no_session' })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const body = req.body ?? {}

  // --- Path 2: confirm an existing draft (no AI call) ---
  if (body?.confirm === true) {
    const chapterId = sanitizeText(body?.chapterId)
    if (!chapterId) return res.status(400).json({ error: 'missing_chapter_id' })

    const { data: chapter, error: fetchError } = await supabase
      .from('chapters')
      .select('id, title, testimony_text, question_id, senior_id, illustration_url, seniors(language)')
      .eq('id', chapterId)
      .maybeSingle()

    // Same response for "doesn't exist" and "exists but isn't yours" —
    // deliberately not distinguishing the two, so this never confirms to
    // an unauthorized caller that a given chapterId is real.
    if (fetchError || !chapter || chapter.senior_id !== seniorId) {
      logDiagnostic({ outcome: 'confirm_chapter_not_found', chapterId })
      return res.status(404).json({ error: 'chapter_not_found' })
    }

    // She may have edited the title/text directly in review (P03 "Editar
    // el text") before saving — persist those edits here, not just the
    // status flip, or they'd be silently discarded.
    const editedTitle = typeof body?.title === 'string' ? sanitizeText(body.title).trim() : ''
    const editedText = typeof body?.testimonyText === 'string' ? sanitizeText(body.testimonyText).trim() : ''
    const updatePayload: Record<string, unknown> = { status: 'confirmed' }
    if (editedTitle) updatePayload.title = editedTitle
    if (editedText) updatePayload.testimony_text = editedText

    const { error: updateError } = await supabase
      .from('chapters')
      .update(updatePayload)
      .eq('id', chapterId)

    if (updateError) {
      logDiagnostic({ outcome: 'confirm_update_failed', message: updateError.message })
      return res.status(502).json({ error: 'db_error' })
    }

    if (editedTitle) chapter.title = editedTitle
    if (editedText) chapter.testimony_text = editedText

    if (chapter.question_id) {
      await supabase.from('questions').update({ status: 'answered' }).eq('id', chapter.question_id)
    }

    // Only generate on first confirm — re-confirming an already-illustrated
    // chapter (e.g. an L04 resume-and-save) must not silently replace a
    // picture she already has, and avoids a wasted image call every time.
    if (aiAvailable() && !chapter.illustration_url) {
      const b64 = await generateIllustrationBase64(
        buildIllustrationPrompt(chapter.title, chapter.testimony_text),
      )
      if (b64) {
        const path = `${chapterId}.png`
        const { error: uploadError } = await supabase.storage
          .from('chapter-illustrations')
          .upload(path, Buffer.from(b64, 'base64'), { contentType: 'image/png', upsert: true })
        if (!uploadError) {
          const { data: pub } = supabase.storage.from('chapter-illustrations').getPublicUrl(path)
          await supabase.from('chapters').update({ illustration_url: pub.publicUrl }).eq('id', chapterId)
        } else {
          logDiagnostic({ outcome: 'illustration_upload_failed', message: uploadError.message, chapterId })
        }
      } else {
        logDiagnostic({ outcome: 'illustration_generation_failed', chapterId })
      }
    }

    // Independent of illustration generation — must still run on a resume
    // confirm even though the chapter already has a picture.
    if (aiAvailable() && sanitizeText(body?.templateId) === 'family-tree') {
      const language: SeniorProfile['language'] = ['es', 'en'].includes((chapter as any)?.seniors?.language)
        ? (chapter as any).seniors.language
        : 'ca'
      const extracted = await extractFamilyMembers(language, chapter.testimony_text)
      if (extracted.length > 0) {
        const familyPath = `${chapter.senior_id}/members.json`
        const { data: existingFile } = await supabase.storage.from('family-tree').download(familyPath)
        const existing = existingFile
          ? (safeJsonParse<{ members: FamilyMember[] }>(await existingFile.text())?.members ?? [])
          : []
        const merged = mergeFamilyMembers(existing, extracted)
        const { error: writeError } = await supabase.storage
          .from('family-tree')
          .upload(familyPath, JSON.stringify({ members: merged }), {
            contentType: 'application/json',
            upsert: true,
          })
        if (writeError) {
          logDiagnostic({ outcome: 'family_tree_write_failed', message: writeError.message, chapterId })
        } else {
          logDiagnostic({ outcome: 'family_tree_updated', chapterId, memberCount: merged.length })
        }
      } else {
        logDiagnostic({ outcome: 'family_tree_extraction_empty', chapterId })
      }
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
    language: ['es', 'en'].includes(body?.profile?.language) ? body.profile.language : 'ca',
  }
  const history = sanitizeHistory(body?.history)
  const confirmedContext = sanitizeContextItems(body?.confirmedContext)
  const questionId = body?.questionId ? sanitizeText(body.questionId) : null
  const existingChapterId = body?.existingChapterId ? sanitizeText(body.existingChapterId) : null

  if (history.length === 0) {
    return res.status(400).json({ error: 'empty_conversation' })
  }

  // L04 resume: verify she actually owns the chapter she's extending
  // before using its text as context or updating it — same
  // can't-distinguish-exists-vs-not-yours 404 pattern as the confirm path.
  let existingChapter: { title: string; testimonyText: string } | null = null
  if (existingChapterId) {
    const { data: row, error: fetchError } = await supabase
      .from('chapters')
      .select('title, testimony_text, senior_id')
      .eq('id', existingChapterId)
      .maybeSingle()
    if (fetchError || !row || row.senior_id !== seniorId) {
      logDiagnostic({ outcome: 'resume_chapter_not_found', existingChapterId })
      return res.status(404).json({ error: 'chapter_not_found' })
    }
    existingChapter = { title: row.title, testimonyText: row.testimony_text }
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
        instructions: buildCraftInstructions(profile, existingChapter),
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

    // Resume (L04): this is a PROPOSED update to an already-confirmed
    // chapter, not a new one. Per spec ("P02 -> proposed update P03 ->
    // explicit save. Cancel preserves prior version"), it must not touch
    // that row yet — only confirmChapter's title/testimonyText update (see
    // the confirm path above) writes it, once she explicitly approves.
    if (existingChapterId) {
      const turnRows = history.map((t) => ({
        senior_id: seniorId,
        chapter_id: existingChapterId,
        role: t.role,
        content: t.content,
      }))
      await supabase.from('conversation_turns').insert(turnRows)

      logDiagnostic({
        outcome: 'ok_resume_proposed',
        latencyMs: Date.now() - startedAt,
        usage: data?.usage,
        chapterId: existingChapterId,
      })

      return res.status(200).json({
        id: existingChapterId,
        title: sanitizeText(parsed.title),
        testimonyText: sanitizeText(parsed.testimonyText),
      })
    }

    const { data: chapter, error: insertError } = await supabase
      .from('chapters')
      .insert({
        senior_id: seniorId,
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
      senior_id: seniorId,
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
