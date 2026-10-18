// Self-contained — same convention as the other api/*.ts files.
//
// V01 — deliberately the one api/*.ts route in this project with NO
// session check: a recipient opening a shared link has no NEXT account
// and never will. It reads only the frozen share.json snapshot written
// by clip-share.ts — never the chapters table, never conversation_turns,
// never anything "live" from the owner's book. A missing file, a wrong
// token, and a revoked link all return the exact same neutral
// "unavailable" shape, so this never confirms or denies that a given
// chapterId/token combination ever existed.

import { createClient } from '@supabase/supabase-js'

const CLIP_BUCKET = 'chapter-clips'

interface ClipSlide {
  imageUrl: string
  caption: string
}

interface ShareSnapshot {
  token: string
  title: string
  authorName: string | null
  slides: ClipSlide[]
  revoked: boolean
}

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

function sanitizeText(value: unknown): string {
  return String(value ?? '').slice(0, 200)
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!dbAvailable()) {
    return res.status(503).json({ available: false })
  }

  const chapterId = sanitizeText(req.query?.chapterId)
  const token = sanitizeText(req.query?.token)
  if (!chapterId || !token) {
    return res.status(200).json({ available: false })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: file } = await supabase.storage.from(CLIP_BUCKET).download(`${chapterId}/share.json`)
  if (!file) {
    return res.status(200).json({ available: false })
  }

  const snapshot = safeJsonParse<ShareSnapshot>(await file.text())
  if (!snapshot || snapshot.revoked || snapshot.token !== token) {
    return res.status(200).json({ available: false })
  }

  return res.status(200).json({
    available: true,
    title: snapshot.title,
    authorName: snapshot.authorName,
    slides: snapshot.slides,
  })
}
