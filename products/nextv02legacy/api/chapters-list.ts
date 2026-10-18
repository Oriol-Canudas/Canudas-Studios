// Self-contained — same convention as the other api/*.ts files (see
// director-respond.ts's header comment). Backs "El meu llibre": every
// confirmed chapter belonging to the session's own senior, newest first
// — scoped by api/session.ts's cookie, never the whole table.

import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

function dbAvailable(): boolean {
  return Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
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
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
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

  const { data, error } = await supabase
    .from('chapters')
    .select('id, title, testimony_text, illustration_url, created_at')
    .eq('senior_id', seniorId)
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
