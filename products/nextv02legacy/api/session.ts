// Self-contained — same convention as the other api/*.ts files.
//
// Minimal anonymous owner session. No registration UI, no password: a
// server-issued, HMAC-signed senior_id in an HttpOnly cookie — never
// readable by page JS (unlike a localStorage token), never trusted
// without verifying its signature against SESSION_SECRET (server-only).
// This is the one place a seniors row gets created at runtime; every
// other route in this stage resolves its senior strictly from this
// cookie, never from "the first row in the table."
//
// `seniors.family_id` is NOT NULL in the existing schema (it already
// anticipated multi-tenancy, just was never wired up) — an anonymous
// visitor gets a throwaway one-row family alongside her senior row,
// satisfying the constraint without any family-side concept or UI.

import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_COOKIE = 'next_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365 // 1 year — there is no login to recover with, so this is the practical lifetime

function sessionSecret(): string {
  return process.env.SESSION_SECRET || ''
}

function signSeniorId(seniorId: string): string {
  return createHmac('sha256', sessionSecret()).update(seniorId).digest('hex')
}

// Exported-in-spirit (duplicated per file, not actually exported — see
// the project's self-contained api/*.ts convention) so every route that
// needs it can carry its own copy without a shared local import.
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

function sessionCookieHeader(seniorId: string): string {
  const sig = signSeniorId(seniorId)
  const value = encodeURIComponent(`${seniorId}.${sig}`)
  return `${SESSION_COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !sessionSecret()) {
    return res.status(503).json({ error: 'session_unavailable' })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const existingId = verifiedSeniorIdFromCookie(req.headers.cookie)
  if (existingId) {
    const { data } = await supabase
      .from('seniors')
      .select('id, preferred_name, language')
      .eq('id', existingId)
      .maybeSingle()
    if (data) {
      return res
        .status(200)
        .json({ seniorId: data.id, preferredName: data.preferred_name || null, language: data.language })
    }
    // The signed id was valid but the row it pointed to is gone (e.g. a
    // manual cleanup) — fall through and issue a fresh session rather
    // than fail; nothing was trusted blindly here, the signature just no
    // longer resolves to real data.
  }

  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({ name: 'Anonim' })
    .select('id')
    .single()

  if (familyError || !family) {
    console.log(JSON.stringify({ at: 'session', outcome: 'family_insert_failed', message: familyError?.message }))
    return res.status(502).json({ error: 'db_error' })
  }

  const { data: senior, error: seniorError } = await supabase
    .from('seniors')
    .insert({ family_id: family.id, name: 'Sense nom', preferred_name: '', language: 'ca' })
    .select('id, preferred_name, language')
    .single()

  if (seniorError || !senior) {
    console.log(JSON.stringify({ at: 'session', outcome: 'senior_insert_failed', message: seniorError?.message }))
    return res.status(502).json({ error: 'db_error' })
  }

  res.setHeader('Set-Cookie', sessionCookieHeader(senior.id))
  return res.status(200).json({ seniorId: senior.id, preferredName: null, language: senior.language })
}
