// Self-contained — no local imports, same convention as director-respond.ts.
//
// EXPLICITLY DISABLED for NEXT v1 — the family-request loop this powers
// is out of v1's reachable scope by product decision (SPECIFICATION.md:
// "No ... family request loop ... in the first scope"). Disabled rather
// than retrofitted with ownership scoping, since the feature itself
// isn't staying for this version — no point securing a read path for
// something we're not keeping. Code below is preserved, not deleted, in
// case the family-request loop returns in a later version; it also had
// no senior-id scoping at all before this (returned the oldest pending
// question system-wide, with no ownership check whatsoever) — do not
// re-enable without adding that first.

import { createClient } from '@supabase/supabase-js'

export default async function handler(_req: any, res: any) {
  return res.status(501).json({ error: 'not_available_in_this_version' })
}

// Preserved verbatim, not called from the handler above while this route
// is disabled — kept so the pre-v1 logic is still here if the
// family-request loop comes back in a later version.
export async function legacyPendingQuestionHandler(req: any, res: any) {
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
