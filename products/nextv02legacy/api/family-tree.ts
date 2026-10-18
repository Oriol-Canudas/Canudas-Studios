// Self-contained — same convention as the other api/*.ts files.
//
// EXPLICITLY DISABLED for NEXT v1 — the family-request loop this powers
// is out of v1's reachable scope by product decision (SPECIFICATION.md:
// "No ... family request loop ... in the first scope"). Disabled rather
// than retrofitted with ownership scoping, since the feature itself
// isn't staying for this version. Code below is preserved, not deleted,
// in case the family-tree screen returns in a later version — it also
// had a real cross-owner leak before this (picked "the" senior via
// `.limit(1).maybeSingle()` with no caller identity at all, so it
// returned whichever senior happened to be first in the table to
// anyone who called it) — do not re-enable without fixing that first.

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

export default async function handler(_req: any, res: any) {
  return res.status(501).json({ error: 'not_available_in_this_version' })
}

// Preserved verbatim, not called from the handler above while this route
// is disabled — kept so the pre-v1 logic is still here if the
// family-tree screen comes back in a later version.
export async function legacyFamilyTreeHandler(req: any, res: any) {
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
