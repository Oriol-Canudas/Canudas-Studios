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

const MAX_FIELD_CHARS = 4000

function dbAvailable(): boolean {
  return Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function sanitizeText(value: unknown): string {
  return String(value ?? '').slice(0, MAX_FIELD_CHARS)
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

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: senior } = await supabase.from('seniors').select('id').limit(1).maybeSingle()
  if (!senior) {
    console.log(JSON.stringify({ at: 'memory-save', outcome: 'no_senior_seeded' }))
    return res.status(500).json({ error: 'no_senior_seeded' })
  }

  const { data: chapter, error } = await supabase
    .from('chapters')
    .insert({
      senior_id: senior.id,
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
