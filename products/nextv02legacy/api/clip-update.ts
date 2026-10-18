// Self-contained — same convention as the other api/*.ts files.
//
// Three actions on an already-generated clip manifest, gated behind the
// same ownership check: M04 "save" (confirm — distinct from creation,
// per "creation, saving, and sharing are separate actions"), M05
// "editText" (title/caption edits — never regenerates personal facts),
// M05 "rerollImage" (one slide's illustration only, same prompt, a new
// painting of it — the closest honest equivalent of an "alternate
// illustration" without a full multi-option gallery this round).

import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

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
  console.log(JSON.stringify({ at: 'clip-update', ...data }))
}

const ILLUSTRATION_STYLE =
  'Subtle painted realism: academic realist oil painting, fine controlled brushwork visible only on close inspection, warm amber/terracotta/umber palette, soft natural light. No frame, no border, no text, no watermark — fills the entire canvas.'

async function generateImageBase64(prompt: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90000)
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: `${ILLUSTRATION_STYLE}\n\nScene to paint: ${prompt}`,
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
  if (!chapterId || !['save', 'editText', 'rerollImage'].includes(action)) {
    return res.status(400).json({ error: 'invalid_request' })
  }

  const seniorId = verifiedSeniorIdFromCookie(req.headers.cookie)
  if (!seniorId) {
    return res.status(401).json({ error: 'no_session' })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Same ownership check as chapter-clip.ts, before anything else.
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
    const b64 = await generateImageBase64(prompt)
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
  }

  await supabase.storage.from(CLIP_BUCKET).upload(manifestPath, JSON.stringify(manifest), {
    contentType: 'application/json',
    upsert: true,
  })

  logDiagnostic({ outcome: 'ok', chapterId, action })
  return res.status(200).json(manifest)
}
