// Self-contained — same convention as the other api/*.ts files.
//
// All owner-authenticated mutations on an already-generated clip
// manifest, in one file: this was originally two files (clip-update.ts
// + clip-share.ts) but Vercel's Hobby plan caps a deployment at 12
// Serverless Functions, and this project was at 13 — merging the two
// (both are ownership-gated manifest mutations, logically one surface)
// was the fix that cost nothing: no feature removed, no code deleted,
// just one less function boundary. Five actions:
//
// M04 "save" (confirm — distinct from creation, per "creation, saving,
// and sharing are separate actions"), M05 "editText" (title/caption
// edits — never regenerates personal facts), M05 "rerollImage" (one
// slide's illustration only, same stored prompt, a new painting of it —
// the closest honest equivalent of an "alternate illustration" without
// a full multi-option gallery this round).
//
// M06 "shareCreate"/"shareRevoke": no database migration is available
// this round, so a share is a storage object, not a table row —
// ${chapterId}/share.json in the existing chapter-clips bucket, holding
// a FROZEN snapshot (title + slides as they were at share time) plus the
// random token a recipient needs. Editing the chapter or regenerating
// the clip afterward never touches this file — "editing the private
// story must not silently change an already shared snapshot" — a new
// share explicitly overwrites it. shareCreate is refused (409) unless
// the clip is already confirmed. shareRevoke deletes the file outright:
// no tombstone, and clip-view.ts's "missing" and "wrong token" responses
// are already identical, so a revoked link reads exactly like one that
// never existed.

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

type ClipSlideRole = 'cover' | 'place' | 'moment' | 'remains'
type ClipRepresentation = 'atmosphere' | 'people'

interface ClipSlide {
  imageUrl: string
  caption: string
  imagePrompt?: string
  role?: ClipSlideRole
}

interface ClipPeopleDetails {
  who: string
  approxAge: string
  depiction: string
}

interface ClipManifest {
  title: string
  slides: ClipSlide[]
  confirmed: boolean
  shared: boolean
  shareToken: string | null
  language: 'es' | 'ca' | 'en'
  representation: ClipRepresentation
  peopleDetails: ClipPeopleDetails | null
  era: string | null
}

interface ShareSnapshot {
  token: string
  title: string
  authorName: string | null
  slides: ClipSlide[]
  revoked: boolean
  createdAt: string
  language: 'es' | 'ca' | 'en'
}

const ACTIONS = ['save', 'editText', 'rerollImage', 'shareCreate', 'shareRevoke'] as const

function dbAvailable(): boolean {
  return Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function aiAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && process.env.AI_CHAPTER_CLIP_DISABLED !== '1'
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
  console.log(JSON.stringify({ at: 'clip-manage', ...data }))
}

// Same base as chapter-clip.ts — varied by role/era below, not a flat
// sepia wash (see that file's header comment for why).
const ILLUSTRATION_BASE =
  'Subtle painted realism: academic realist oil painting, fine controlled brushwork visible only on close inspection. No frame, no border, no text, no watermark — fills the entire canvas. Warm but naturally varied colour — let real daylight, interiors, and seasons show their own colour; this is not a uniform sepia or antique filter.'

const ROLE_LIGHT: Record<ClipSlideRole, string> = {
  cover: 'An intimate, evocative detail. Close, inviting framing with warm, gentle light.',
  place: 'A wider environmental composition that situates the memory. Open, airy, natural daylight.',
  moment: 'A closer, human-scale moment. Warm natural light, lived-in and immediate, not staged.',
  remains: 'A quieter, more spacious composition with soft, gentle light and room to breathe.',
}

async function generateImageBase64(
  prompt: string,
  role: ClipSlideRole,
  era: string | null,
  correctionReason: string | null,
): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90000)
  const fullPrompt = [
    ILLUSTRATION_BASE,
    ROLE_LIGHT[role] ?? ROLE_LIGHT.moment,
    era ? `Period/era: ${era}. Keep it plausible for this era — no antique/vintage props unless the scene calls for them.` : '',
    correctionReason
      ? `The owner said the previous version of this image did not represent their memory correctly: "${correctionReason}". Avoid repeating that specific problem.`
      : '',
    `Scene to paint: ${prompt}`,
  ]
    .filter(Boolean)
    .join('\n\n')
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: fullPrompt,
        size: '1024x1024',
        quality: 'medium',
      }),
      signal: controller.signal,
    })
    if (!response.ok) return null
    const data: any = await response.json()
    const b64 = data?.data?.[0]?.b64_json
    return typeof b64 === 'string' ? b64 : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
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
  if (!chapterId || !ACTIONS.includes(action)) {
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

  const manifestPath = `${chapterId}/manifest.json`
  const sharePath = `${chapterId}/share.json`

  // --- shareRevoke doesn't need the manifest to exist to succeed ---
  if (action === 'shareRevoke') {
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

  const { data: existingFile, error: downloadError } = await supabase.storage
    .from(CLIP_BUCKET)
    .download(manifestPath)
  if (downloadError || !existingFile) {
    return res.status(404).json({ error: 'clip_not_found' })
  }
  const manifest = safeJsonParse<ClipManifest>(await existingFile.text())
  if (!manifest) {
    return res.status(502).json({ error: 'manifest_corrupt' })
  }

  if (action === 'save') {
    manifest.confirmed = true
  } else if (action === 'editText') {
    const editedTitle = typeof req.body?.title === 'string' ? sanitizeText(req.body.title).trim() : ''
    const editedSlides = Array.isArray(req.body?.slides) ? req.body.slides : null
    if (editedTitle) manifest.title = editedTitle
    if (editedSlides) {
      manifest.slides = manifest.slides.map((slide, i) => ({
        ...slide,
        caption: typeof editedSlides[i]?.caption === 'string' ? sanitizeText(editedSlides[i].caption) : slide.caption,
      }))
    }
  } else if (action === 'rerollImage') {
    if (!aiAvailable()) {
      return res.status(503).json({ error: 'ai_unavailable' })
    }
    const slideIndex = Number(req.body?.slideIndex)
    const slide = manifest.slides[slideIndex]
    if (!slide) {
      return res.status(400).json({ error: 'invalid_slide_index' })
    }
    const prompt = slide.imagePrompt || slide.caption
    const reason =
      typeof req.body?.reason === 'string' && req.body.reason.trim() ? sanitizeText(req.body.reason).trim() : null
    const b64 = await generateImageBase64(prompt, slide.role ?? 'moment', manifest.era, reason)
    if (!b64) {
      logDiagnostic({ outcome: 'reroll_failed', chapterId, slideIndex })
      return res.status(502).json({ error: 'reroll_failed' })
    }
    const path = `${chapterId}/slide-${slideIndex}-${Date.now()}.png`
    const { error: uploadError } = await supabase.storage
      .from(CLIP_BUCKET)
      .upload(path, Buffer.from(b64, 'base64'), { contentType: 'image/png', upsert: true })
    if (uploadError) {
      logDiagnostic({ outcome: 'reroll_upload_failed', chapterId, slideIndex, message: uploadError.message })
      return res.status(502).json({ error: 'reroll_failed' })
    }
    const { data: pub } = supabase.storage.from(CLIP_BUCKET).getPublicUrl(path)
    manifest.slides[slideIndex] = { ...slide, imageUrl: pub.publicUrl }
  } else if (action === 'shareCreate') {
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
      slides: manifest.slides.map((s) => ({ imageUrl: s.imageUrl, caption: s.caption, role: s.role })),
      revoked: false,
      createdAt: new Date().toISOString(),
      // A clip generated before this field existed has no manifest.language
      // — fall back rather than writing an undefined value into the frozen
      // snapshot (see MemoryClipScreen's matching fallback for the player).
      language: manifest.language || 'ca',
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

  await supabase.storage.from(CLIP_BUCKET).upload(manifestPath, JSON.stringify(manifest), {
    contentType: 'application/json',
    upsert: true,
  })

  logDiagnostic({ outcome: 'ok', chapterId, action })
  return res.status(200).json(manifest)
}
