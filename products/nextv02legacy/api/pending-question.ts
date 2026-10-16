// Self-contained — no local imports, same convention as director-respond.ts.
// Proof-of-concept stage has exactly one test senior/family (see
// scripts/seed-test-data.ts), so this just returns the oldest pending
// question with no senior-id lookup. Real multi-user lookup is a
// family-side-screens concern, later.

import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'db_unavailable' })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data, error } = await supabase
    .from('questions')
    .select('id, text')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.log(JSON.stringify({ at: 'pending-question', outcome: 'db_error', message: error.message }))
    return res.status(502).json({ error: 'db_error' })
  }

  return res.status(200).json({ question: data ?? null })
}
