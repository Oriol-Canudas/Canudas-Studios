// Self-contained — same convention as the other api/*.ts files.
//
// M06: creation, saving and sharing are deliberately separate actions.
// This endpoint only ever runs for a chapter whose clip is already
// confirmed (see clip-update.ts's "save" action) — sharing a clip she
// hasn't even saved yet isn't offered client-side, and is refused here
// too, not just hidden in the UI.
//
// No database migration is available this round, so the share itself is
// a storage object, not a table row: ${chapterId}/share.json in the
// existing chapter-clips bucket, holding a FROZEN snapshot (title +
// slides as they were at share time) plus the random token a recipient
// needs. Editing the chapter or regenerating the clip afterward never
// touches this file — "editing the private story must not silently
// change an already shared snapshot" — a new share explicitly
// overwrites it. Revoking deletes the file outright: no tombstone to
// leak that a link ever existed, and clip-view.ts's "missing" and
// "wrong token" responses are already identical, so a revoked link reads
// exactly like one that was never created.

import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual, randomBytes } from 'crypto'

const CLIP_BUCKET = 'chapter-clips'

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

interface ClipSlide {
  imageUrl: string
  caption: string
  imagePrompt?: string
}

interface ClipManifest {
  title: string
  slides: ClipSlide[]
  confirmed: boolean
  shared: boolean
  shareToken: string | null
}

interface ShareSnapshot {
  token: string
  title: string
  authorName: string | null
  slides: ClipSlide[]
  revoked: boolean
  createdAt: string
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
  return String(value ?? '').slice(0, 4000)
}

function logDiagnostic(data: Record<string, unknown>) {
  console.log(JSON.stringify({ at: 'clip-share', ...data }))
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!dbAvailable()) {
    return res.status(503).json({ error: 'db_unavailable' })
  }

  const chapterId = sanitizeText(req.body?.chapterId)
  const action = req.body?.action
  if (!chapterId || !['create', 'revoke'].includes(action)) {
    return res.status(400).json({ error: 'invalid_request' })
  }

  const seniorId = verifiedSeniorIdFromCookie(req.headers.cookie)
  if (!seniorId) {
    return res.status(401).json({ error: 'no_session' })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: chapter, error: fetchError } = await supabase
    .from('chapters')
    .select('senior_id')
    .eq('id', chapterId)
    .maybeSingle()

  if (fetchError || !chapter || chapter.senior_id !== seniorId) {
    logDiagnostic({ outcome: 'chapter_not_found', chapterId })
    return res.status(404).json({ error: 'chapter_not_found' })
  }

  const sharePath = `${chapterId}/share.json`
  const manifestPath = `${chapterId}/manifest.json`

  if (action === 'revoke') {
    await supabase.storage.from(CLIP_BUCKET).remove([sharePath])
    const { data: manifestFile } = await supabase.storage.from(CLIP_BUCKET).download(manifestPath)
    if (manifestFile) {
      const manifest = safeJsonParse<ClipManifest>(await manifestFile.text())
      if (manifest) {
        manifest.shared = false
        manifest.shareToken = null
        await supabase.storage
          .from(CLIP_BUCKET)
          .upload(manifestPath, JSON.stringify(manifest), { contentType: 'application/json', upsert: true })
      }
    }
    logDiagnostic({ outcome: 'revoked', chapterId })
    return res.status(200).json({ revoked: true })
  }

  // --- action === 'create' ---
  const { data: manifestFile, error: manifestError } = await supabase.storage
    .from(CLIP_BUCKET)
    .download(manifestPath)
  if (manifestError || !manifestFile) {
    return res.status(404).json({ error: 'clip_not_found' })
  }
  const manifest = safeJsonParse<ClipManifest>(await manifestFile.text())
  if (!manifest) {
    return res.status(502).json({ error: 'manifest_corrupt' })
  }
  if (!manifest.confirmed) {
    logDiagnostic({ outcome: 'not_confirmed', chapterId })
    return res.status(409).json({ error: 'clip_not_confirmed' })
  }

  const token = randomBytes(16).toString('hex')
  const authorName = typeof req.body?.authorName === 'string' ? sanitizeText(req.body.authorName).trim() || null : null

  const snapshot: ShareSnapshot = {
    token,
    title: manifest.title,
    authorName,
    slides: manifest.slides.map((s) => ({ imageUrl: s.imageUrl, caption: s.caption })),
    revoked: false,
    createdAt: new Date().toISOString(),
  }

  await supabase.storage.from(CLIP_BUCKET).upload(sharePath, JSON.stringify(snapshot), {
    contentType: 'application/json',
    upsert: true,
  })

  manifest.shared = true
  manifest.shareToken = token
  await supabase.storage
    .from(CLIP_BUCKET)
    .upload(manifestPath, JSON.stringify(manifest), { contentType: 'application/json', upsert: true })

  logDiagnostic({ outcome: 'created', chapterId })
  return res.status(200).json({ token, chapterId })
}
