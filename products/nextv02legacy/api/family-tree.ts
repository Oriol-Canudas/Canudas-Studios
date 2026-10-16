// Self-contained — same convention as the other api/*.ts files. Returns
// the family-tree members ledger for the (single, for this
// proof-of-concept stage) test senior, built up over time by
// chapter-finalize.ts whenever a chapter from the 'family-tree'
// TopicPickerScreen template is confirmed.

import { createClient } from '@supabase/supabase-js'

function dbAvailable(): boolean {
  return Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!dbAvailable()) {
    return res.status(503).json({ error: 'db_unavailable' })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: senior } = await supabase.from('seniors').select('id').limit(1).maybeSingle()
  if (!senior) {
    return res.status(200).json({ members: [] })
  }

  const { data: file } = await supabase.storage.from('family-tree').download(`${senior.id}/members.json`)
  if (!file) {
    return res.status(200).json({ members: [] })
  }

  const parsed = safeJsonParse<{ members: unknown[] }>(await file.text())
  return res.status(200).json({ members: Array.isArray(parsed?.members) ? parsed.members : [] })
}
