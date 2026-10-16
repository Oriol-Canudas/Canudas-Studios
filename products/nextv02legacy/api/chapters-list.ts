// Self-contained — same convention as the other api/*.ts files (see
// director-respond.ts's header comment). Backs the "Biblioteca de
// records" screen: every confirmed chapter for the (single, for this
// proof-of-concept stage) test senior, newest first.

import { createClient } from '@supabase/supabase-js'

function dbAvailable(): boolean {
  return Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
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

  const { data, error } = await supabase
    .from('chapters')
    .select('id, title, testimony_text, illustration_url, created_at')
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.log(JSON.stringify({ at: 'chapters-list', outcome: 'db_error', message: error.message }))
    return res.status(502).json({ error: 'db_error' })
  }

  const chapters = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    testimonyText: row.testimony_text,
    illustrationUrl: row.illustration_url,
    createdAt: row.created_at,
  }))

  return res.status(200).json({ chapters })
}
