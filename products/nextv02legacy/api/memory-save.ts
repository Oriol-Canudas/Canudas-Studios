// Self-contained — same convention as the other api/*.ts files.
//
// Deliberately lean: insert only. No illustration generation (the
// "Un petit record" artifact uses a client-side typographic visual, not
// a generated image — see TypographicMemoryCard.tsx), no family-tree
// extraction side effect (that stays specific to chapter-finalize.ts's
// confirm path for the 'family-tree' topic template). This endpoint
// never decides the record is "saved" on its own — it only ever runs
// when MemoryActivityScreen calls it after her explicit "Guardar al meu
// àlbum" tap, and the client treats a non-2xx response as a real failure
// with the draft preserved for retry, never a silent success.

import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

const MAX_FIELD_CHARS = 4000

function dbAvailable(): boolean {
  return Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function sanitizeText(value: unknown): string {
  return String(value ?? '').slice(0, MAX_FIELD_CHARS)
}

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  if (!dbAvailable()) {
    return res.status(503).json({ error: 'db_unavailable' })
  }

  const body = req.body ?? {}
  const title = sanitizeText(body?.title)
  const testimonyText = sanitizeText(body?.body)
  if (!title || !testimonyText) {
    return res.status(400).json({ error: 'missing_fields' })
  }

  const seniorId = verifiedSeniorIdFromCookie(req.headers.cookie)
  if (!seniorId) {
    return res.status(401).json({ error: 'no_session' })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: chapter, error } = await supabase
    .from('chapters')
    .insert({
      senior_id: seniorId,
      question_id: null,
      content_type: 'moment',
      title,
      testimony_text: testimonyText,
      confirmed_context: [],
      status: 'confirmed',
    })
    .select('id, title, testimony_text')
    .single()

  if (error || !chapter) {
    console.log(JSON.stringify({ at: 'memory-save', outcome: 'insert_failed', message: error?.message }))
    return res.status(502).json({ error: 'db_error' })
  }

  return res.status(200).json({ id: chapter.id, title: chapter.title, testimonyText: chapter.testimony_text })
}
