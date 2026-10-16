// Self-contained — same convention as the other api/*.ts files (see
// director-respond.ts's header comment).
//
// Turns one already-confirmed chapter into a short slideshow: 3 slides
// (a generated illustration + a short warm caption drawn only from what
// she actually said) plus one of a small pool of pre-generated warm
// instrumental tracks (see pickSharedMusicPath below for why it's a
// shared pool rather than a live per-chapter music call), played back
// client-side by ClipPlayer.tsx — there's no real video-encoding step
// here, by design (see the conversation this was scoped in: a Vercel
// function can't reliably render video, and building a whole separate
// rendering service wasn't worth it yet for a proof-of-concept-scale
// product). The result is cached as a manifest.json in the chapter-clips
// storage bucket, keyed by chapter id, so re-opening a clip is instant
// and never re-spends image generation credits.

import { createClient } from '@supabase/supabase-js'

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.5'
const CLIP_BUCKET = 'chapter-clips'
const SLIDE_COUNT = 3

// A small pool of warm, nostalgic instrumental tracks generated once
// up front (not per-chapter — the ElevenLabs key here is scoped to
// Text-to-Speech only, not Music, so a live per-chapter generation call
// isn't available) and shared across every clip. Picked deterministically
// per chapter so the same chapter always gets the same track.
const SHARED_MUSIC_COUNT = 3

function pickSharedMusicPath(chapterId: string): string {
  let hash = 0
  for (const char of chapterId) hash = (hash * 31 + char.charCodeAt(0)) % 997
  const index = (hash % SHARED_MUSIC_COUNT) + 1
  return `_shared/music-${index}.mp3`
}

interface ClipSlide {
  imageUrl: string
  caption: string
}

interface ClipManifest {
  slides: ClipSlide[]
  musicUrl: string | null
}

function dbAvailable(): boolean {
  return Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function aiAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && process.env.AI_CHAPTER_CLIP_DISABLED !== '1'
}

function logDiagnostic(data: Record<string, unknown>) {
  console.log(JSON.stringify({ at: 'chapter-clip', ...data }))
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

// Same "subtle painted realism" style agreed on for the Director's own
// portrait and the Library's single-illustration generation — kept
// identical here so every slide in a clip reads as the same book.
const ILLUSTRATION_STYLE =
  'Subtle painted realism: academic realist oil painting, fine controlled brushwork visible only on close inspection, warm amber/terracotta/umber palette, soft natural light. No frame, no border, no text, no watermark — fills the entire canvas.'

function buildClipPlanInstructions(language: 'es' | 'ca' | 'en'): string {
  const langLine =
    language === 'ca'
      ? 'Escriu-ho en català.'
      : language === 'en'
        ? 'Write it in English.'
        : 'Escríbelo en español.'

  return [
    "You are turning one already-confirmed chapter of someone's life story into a short, warm slideshow of exactly 3 slides, each a different beat of the same chapter.",
    langLine,
    '',
    "HONESTY, ABSOLUTE RULE: every caption must come from what she actually said in the chapter text given to you — paraphrase lightly for pacing if needed, but never invent a detail, date, or quote that isn't there.",
    '',
    'Respond with ONLY a single JSON object as your final answer text, no other prose before or after it, matching exactly this shape:',
    '{"slides": [{"caption": string, "imagePrompt": string}, {"caption": string, "imagePrompt": string}, {"caption": string, "imagePrompt": string}]}',
    'caption: one short, warm line (max ~14 words), in her own voice, sized for a slide someone will see for a few seconds.',
    "imagePrompt: a plain-English scene description (setting, mood, what's happening) for a painter — each of the 3 should show a different moment from the chapter, never the same scene three times.",
  ].join('\n')
}

function extractMessageText(output: any[]): string {
  const texts: string[] = []
  for (const item of output ?? []) {
    if (item?.type !== 'message') continue
    for (const block of item?.content ?? []) {
      const t = block?.text
      if (typeof t === 'string') texts.push(t)
    }
  }
  return texts.join('\n').trim()
}

async function planSlides(
  language: 'es' | 'ca' | 'en',
  title: string,
  testimonyText: string,
): Promise<{ caption: string; imagePrompt: string }[] | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: buildClipPlanInstructions(language),
        input: [{ role: 'user', content: `CHAPTER TITLE: ${title}\n\nCHAPTER TEXT:\n${testimonyText}` }],
      }),
      signal: controller.signal,
    })
    if (!response.ok) return null
    const data: any = await response.json()
    const rawText = extractMessageText(data?.output ?? [])
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch
      ? safeJsonParse<{ slides: { caption: string; imagePrompt: string }[] }>(jsonMatch[0])
      : null
    if (!parsed || !Array.isArray(parsed.slides) || parsed.slides.length === 0) return null
    return parsed.slides.slice(0, SLIDE_COUNT)
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function generateImageBase64(prompt: string): Promise<string | null> {
  const controller = new AbortController()
  // gpt-image-1 regularly takes 30-60s per image on a standard-tier
  // account — the original 25s/45s timeouts were aborting real,
  // in-flight generations, not actual failures.
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
    if (!response.ok) {
      logDiagnostic({ outcome: 'image_non_2xx', status: response.status, body: await response.text() })
      return null
    }
    const data: any = await response.json()
    const b64 = data?.data?.[0]?.b64_json
    return typeof b64 === 'string' ? b64 : null
  } catch (err) {
    logDiagnostic({ outcome: 'image_error', message: err instanceof Error ? err.message : 'unknown' })
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
  if (!chapterId) return res.status(400).json({ error: 'missing_chapter_id' })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const manifestPath = `${chapterId}/manifest.json`

  // --- Cache hit: a clip already exists for this chapter ---
  const { data: cached } = await supabase.storage.from(CLIP_BUCKET).download(manifestPath)
  if (cached) {
    const manifest = safeJsonParse<ClipManifest>(await cached.text())
    if (manifest) {
      logDiagnostic({ outcome: 'cache_hit', chapterId })
      return res.status(200).json(manifest)
    }
  }

  if (!aiAvailable()) {
    return res.status(503).json({ error: 'ai_unavailable' })
  }

  const startedAt = Date.now()
  const { data: chapter, error: fetchError } = await supabase
    .from('chapters')
    .select('title, testimony_text, seniors(language)')
    .eq('id', chapterId)
    .maybeSingle()

  if (fetchError || !chapter) {
    logDiagnostic({ outcome: 'chapter_not_found', chapterId })
    return res.status(404).json({ error: 'chapter_not_found' })
  }

  const language: 'es' | 'ca' | 'en' = ['es', 'en'].includes((chapter as any)?.seniors?.language)
    ? (chapter as any).seniors.language
    : 'ca'

  const plan = await planSlides(language, chapter.title, chapter.testimony_text)
  if (!plan) {
    logDiagnostic({ outcome: 'plan_failed', chapterId })
    return res.status(502).json({ error: 'plan_failed' })
  }

  // Sequential, not Promise.all — firing all 3 image calls at once tripped
  // the OpenAI account's per-minute image-generation rate limit (a fresh,
  // low-credit account sits on a low concurrency tier).
  const imageResults: (string | null)[] = []
  for (const slide of plan) {
    imageResults.push(await generateImageBase64(slide.imagePrompt))
  }

  const slides: ClipSlide[] = []
  for (let i = 0; i < plan.length; i++) {
    const b64 = imageResults[i]
    if (!b64) continue
    const path = `${chapterId}/slide-${i}.png`
    const { error: uploadError } = await supabase.storage
      .from(CLIP_BUCKET)
      .upload(path, Buffer.from(b64, 'base64'), { contentType: 'image/png', upsert: true })
    if (uploadError) {
      logDiagnostic({ outcome: 'slide_upload_failed', message: uploadError.message, chapterId, i })
      continue
    }
    const { data: pub } = supabase.storage.from(CLIP_BUCKET).getPublicUrl(path)
    slides.push({ imageUrl: pub.publicUrl, caption: sanitizeText(plan[i].caption) })
  }

  if (slides.length === 0) {
    logDiagnostic({ outcome: 'no_slides_generated', chapterId })
    return res.status(502).json({ error: 'illustration_failed' })
  }

  const { data: musicPub } = supabase.storage.from(CLIP_BUCKET).getPublicUrl(pickSharedMusicPath(chapterId))
  const musicUrl = musicPub.publicUrl

  const manifest: ClipManifest = { slides, musicUrl }

  await supabase.storage.from(CLIP_BUCKET).upload(manifestPath, JSON.stringify(manifest), {
    contentType: 'application/json',
    upsert: true,
  })

  logDiagnostic({ outcome: 'generated', chapterId, slideCount: slides.length, hasMusic: Boolean(musicUrl), latencyMs: Date.now() - startedAt })
  return res.status(200).json(manifest)
}
