// Self-contained — same convention as the other api/*.ts files (see
// director-respond.ts's header comment).
//
// Turns one already-confirmed chapter into a short slideshow: 3 slides
// (a generated illustration + a short warm caption drawn only from what
// she actually said) — there's no real video-encoding step here, by
// design (see the conversation this was scoped in: a Vercel function
// can't reliably render video, and building a whole separate rendering
// service wasn't worth it yet for a proof-of-concept-scale product). The
// result is cached as a manifest.json in the chapter-clips storage
// bucket, keyed by chapter id, so re-opening a clip is instant and never
// re-spends image generation credits.
//
// NEXT v1: no background music. The approved spec is explicit ("No
// audio soundtrack or licensed song embedded by default") — this used to
// attach a shared instrumental track and ClipPlayer auto-played it on
// mount with zero consent, which was also a direct "do not auto-start
// music" violation. Both removed; see ClipPlayer.tsx.

import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.5'
const CLIP_BUCKET = 'chapter-clips'
const MAX_SLIDES = 4

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

type ClipSlideRole = 'cover' | 'place' | 'moment' | 'remains'
type ClipRepresentation = 'atmosphere' | 'people'

interface ClipSlide {
  imageUrl: string
  caption: string
  // Kept so a later "reroll this image" (clip-manage.ts) can regenerate
  // the same scene again without inventing a new one or touching the
  // caption's facts.
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
  // M04 "Guardar al meu llibre" — distinct from generation itself, per
  // "creation, saving, and sharing are separate actions." Sharing (see
  // clip-manage.ts) requires this to be true first.
  confirmed: boolean
  // Mirrors whether clip-manage.ts currently has an active link for this
  // chapter, so the owner sees real share status when reopening a saved
  // clip without a separate lookup.
  shared: boolean
  shareToken: string | null
  // The language the slideshow's own words were written in — the player
  // and a recipient's landing page always use this, never a viewer's
  // browser locale (see MemoryClipScreen/RecipientViewerScreen).
  language: 'es' | 'ca' | 'en'
  representation: ClipRepresentation
  peopleDetails: ClipPeopleDetails | null
  era: string | null
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

// Same "subtle painted realism" base agreed on for the Director's own
// portrait and the Library's single-illustration generation — kept as
// the shared foundation here, but no longer a single flat palette: a
// uniform dark amber/sepia wash on every slide was exactly the "antique
// imagery as generic shorthand for memory" complaint this round fixes.
// Each slide's role now carries its own light/colour modifier instead.
const ILLUSTRATION_BASE =
  'Subtle painted realism: academic realist oil painting, fine controlled brushwork visible only on close inspection. No frame, no border, no text, no watermark — fills the entire canvas. Warm but naturally varied colour — let real daylight, interiors, and seasons show their own colour; this is not a uniform sepia or antique filter.'

const ROLE_LIGHT: Record<ClipSlideRole, string> = {
  cover: 'An intimate, evocative detail. Close, inviting framing with warm, gentle light.',
  place: 'A wider environmental composition that situates the memory. Open, airy, natural daylight.',
  moment: 'A closer, human-scale moment. Warm natural light, lived-in and immediate, not staged.',
  remains: 'A quieter, more spacious composition with soft, gentle light and room to breathe.',
}

function buildClipPlanInstructions(
  language: 'es' | 'ca' | 'en',
  representation: ClipRepresentation,
  peopleDetails: ClipPeopleDetails | null,
): string {
  const langLine =
    language === 'ca'
      ? 'Escriu-ho en català.'
      : language === 'en'
        ? 'Write it in English.'
        : 'Escríbelo en español.'

  const representationLines =
    representation === 'people'
      ? [
          'REPRESENTATION: the owner explicitly asked for people to appear in these images.',
          `Confirmed facts about who appears — the ONLY facts you may use, nothing beyond them: who = "${peopleDetails?.who || 'unspecified'}"; approximate age at the time = "${peopleDetails?.approxAge || 'unspecified'}"; visual style requested = "${peopleDetails?.depiction || 'unspecified'}".`,
          'Do not invent gender, ethnicity, number of people, or appearance beyond these confirmed facts. If a fact is "unspecified", keep that person generically and respectfully depicted rather than guessing — never default to a specific gender or look that was not stated.',
          'These are evocative illustrations, not a faithful likeness or a photo reconstruction.',
        ]
      : [
          'REPRESENTATION: the owner chose atmosphere and details only — no identifiable individual people and no implied family portraits in any image.',
          "Focus each imagePrompt on settings, objects, light and textures connected to the story, not on depicting specific people.",
          "Do not invent the specific appearance of the person's home or belongings — prefer a plausible, fitting-but-not-overspecific composition over a confident but invented one.",
        ]

  return [
    "You are turning one already-confirmed chapter of someone's life story into a short, warm visual slideshow — a small living album, not a uniform antique slideshow.",
    langLine,
    '',
    "HONESTY, ABSOLUTE RULE: every caption must come from what she actually said in the chapter text given to you — paraphrase lightly for pacing if needed, but never invent a detail, date, or quote that isn't there. Do not invent events to fill a scene count.",
    '',
    ...representationLines,
    '',
    'PERIOD: infer the approximate era this memory took place in from the chapter text itself (a specific decade if there are clues, otherwise "contemporary" / present-day). Keep every imagePrompt plausible for that era — do NOT default to antique or vintage props (gramophones, 19th-century dress, sepia-era interiors) unless the story itself clearly describes that period. A memory that is clearly modern (e.g. about recent music, recent technology, recent events) must look modern.',
    '',
    'SCENE COUNT AND ROLES: choose between 2 and 4 slides — use exactly as many as the chapter genuinely supports, never pad with invented content. Assign each slide one role from this set, used at most once each, and skip a role entirely if the chapter has no material for it: "cover" (an evocative opening detail + the implicit title), "place" (a wider shot situating the memory), "moment" (a closer beat tied to what she described), "remains" (a quieter closing beat, what stays with her now). If the chapter only truly supports 2 beats, return exactly 2 slides.',
    '',
    'Respond with ONLY a single JSON object as your final answer text, no other prose before or after it, matching exactly this shape:',
    '{"era": string, "slides": [{"role": "cover"|"place"|"moment"|"remains", "caption": string, "imagePrompt": string}, ...]}',
    'era: a short plain-language period tag, e.g. "contemporary (2020s)" or "1970s".',
    'caption: one short, warm line (max ~14 words), in her own voice, sized for a slide someone will see for a few seconds.',
    "imagePrompt: a plain-English scene description (setting, mood, what's happening) for a painter — each slide should show a genuinely different beat of the chapter, never the same scene repeated.",
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

interface PlannedSlide {
  role: ClipSlideRole
  caption: string
  imagePrompt: string
}

async function planSlides(
  language: 'es' | 'ca' | 'en',
  title: string,
  testimonyText: string,
  representation: ClipRepresentation,
  peopleDetails: ClipPeopleDetails | null,
): Promise<{ era: string; slides: PlannedSlide[] } | null> {
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
        instructions: buildClipPlanInstructions(language, representation, peopleDetails),
        input: [{ role: 'user', content: `CHAPTER TITLE: ${title}\n\nCHAPTER TEXT:\n${testimonyText}` }],
      }),
      signal: controller.signal,
    })
    if (!response.ok) return null
    const data: any = await response.json()
    const rawText = extractMessageText(data?.output ?? [])
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch
      ? safeJsonParse<{ era?: string; slides: PlannedSlide[] }>(jsonMatch[0])
      : null
    if (!parsed || !Array.isArray(parsed.slides) || parsed.slides.length === 0) return null
    const validRoles: ClipSlideRole[] = ['cover', 'place', 'moment', 'remains']
    const slides = parsed.slides
      .slice(0, MAX_SLIDES)
      .map((s) => ({ ...s, role: validRoles.includes(s.role) ? s.role : 'moment' }))
    return { era: typeof parsed.era === 'string' && parsed.era ? parsed.era : 'contemporary', slides }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function generateImageBase64(prompt: string, role: ClipSlideRole, era: string): Promise<string | null> {
  const controller = new AbortController()
  // gpt-image-1 regularly takes 30-60s per image on a standard-tier
  // account — the original 25s/45s timeouts were aborting real,
  // in-flight generations, not actual failures.
  const timeout = setTimeout(() => controller.abort(), 90000)
  const fullPrompt = [
    ILLUSTRATION_BASE,
    ROLE_LIGHT[role],
    `Period/era: ${era}. Keep clothing, objects and decor plausible for this era — do not default to antique or vintage props unless the scene itself calls for them.`,
    `Scene to paint: ${prompt}`,
  ].join('\n\n')
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

  const seniorId = verifiedSeniorIdFromCookie(req.headers.cookie)
  if (!seniorId) {
    return res.status(401).json({ error: 'no_session' })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const manifestPath = `${chapterId}/manifest.json`

  // Ownership check comes before anything else — including the cache
  // lookup below, which used to key purely off an attacker-controllable
  // chapterId with no verification that it belonged to the caller.
  const { data: chapter, error: fetchError } = await supabase
    .from('chapters')
    .select('title, testimony_text, senior_id, seniors(language)')
    .eq('id', chapterId)
    .maybeSingle()

  if (fetchError || !chapter || chapter.senior_id !== seniorId) {
    logDiagnostic({ outcome: 'chapter_not_found', chapterId })
    return res.status(404).json({ error: 'chapter_not_found' })
  }

  // Explicit "Crear una altra versió" bypasses the cache — every other
  // path (including a plain re-open) must never silently regenerate and
  // spend image-generation credits, or silently change what an existing
  // share link points to (slides below always land on fresh, uniquely
  // named files — see the comment at the upload loop).
  const regenerate = req.body?.regenerate === true

  // --- Cache hit: a clip already exists for this chapter ---
  // On regenerate, still read the prior manifest (if any) purely to carry
  // its share status forward — a share.json written from that earlier
  // version keeps serving the frozen old slides untouched either way, but
  // the owner must still be able to see/revoke it from this screen rather
  // than losing that control just because a newer draft exists.
  let priorShared = false
  let priorShareToken: string | null = null
  const { data: cached } = await supabase.storage.from(CLIP_BUCKET).download(manifestPath)
  if (cached) {
    const manifest = safeJsonParse<ClipManifest>(await cached.text())
    if (manifest) {
      if (!regenerate) {
        logDiagnostic({ outcome: 'cache_hit', chapterId })
        return res.status(200).json(manifest)
      }
      priorShared = manifest.shared
      priorShareToken = manifest.shareToken
    }
  }

  // M01 needs to ask for consent before anything is generated — a plain
  // existence check must never itself trigger generation.
  if (req.body?.checkOnly === true) {
    return res.status(404).json({ error: 'not_generated' })
  }

  if (!aiAvailable()) {
    return res.status(503).json({ error: 'ai_unavailable' })
  }

  const startedAt = Date.now()

  const language: 'es' | 'ca' | 'en' = ['es', 'en'].includes((chapter as any)?.seniors?.language)
    ? (chapter as any).seniors.language
    : 'ca'

  const representation: ClipRepresentation = req.body?.representation === 'people' ? 'people' : 'atmosphere'
  const rawPeople = req.body?.peopleDetails
  const peopleDetails: ClipPeopleDetails | null =
    representation === 'people' && rawPeople && typeof rawPeople === 'object'
      ? {
          who: sanitizeText(rawPeople.who).slice(0, 200),
          approxAge: sanitizeText(rawPeople.approxAge).slice(0, 100),
          depiction: sanitizeText(rawPeople.depiction).slice(0, 100),
        }
      : null

  const plan = await planSlides(language, chapter.title, chapter.testimony_text, representation, peopleDetails)
  if (!plan) {
    logDiagnostic({ outcome: 'plan_failed', chapterId })
    return res.status(502).json({ error: 'plan_failed' })
  }

  // Sequential, not Promise.all — firing all image calls at once tripped
  // the OpenAI account's per-minute image-generation rate limit (a fresh,
  // low-credit account sits on a low concurrency tier).
  const imageResults: (string | null)[] = []
  for (const slide of plan.slides) {
    imageResults.push(await generateImageBase64(slide.imagePrompt, slide.role, plan.era))
  }

  // Every slide lands on a freshly timestamped path, never overwriting an
  // older one — a previously shared link's snapshot carries these same
  // URLs, so overwriting in place would silently change an already-shared
  // version, exactly what the spec forbids.
  const slides: ClipSlide[] = []
  for (let i = 0; i < plan.slides.length; i++) {
    const b64 = imageResults[i]
    if (!b64) continue
    const path = `${chapterId}/slide-${i}-${Date.now()}.png`
    const { error: uploadError } = await supabase.storage
      .from(CLIP_BUCKET)
      .upload(path, Buffer.from(b64, 'base64'), { contentType: 'image/png', upsert: true })
    if (uploadError) {
      logDiagnostic({ outcome: 'slide_upload_failed', message: uploadError.message, chapterId, i })
      continue
    }
    const { data: pub } = supabase.storage.from(CLIP_BUCKET).getPublicUrl(path)
    slides.push({
      imageUrl: pub.publicUrl,
      caption: sanitizeText(plan.slides[i].caption),
      imagePrompt: sanitizeText(plan.slides[i].imagePrompt),
      role: plan.slides[i].role,
    })
  }

  if (slides.length === 0) {
    logDiagnostic({ outcome: 'no_slides_generated', chapterId })
    return res.status(502).json({ error: 'illustration_failed' })
  }

  const manifest: ClipManifest = {
    title: chapter.title,
    slides,
    confirmed: false,
    // A still-live link from a prior version keeps pointing at that
    // version's own frozen share.json snapshot — carrying the flag
    // forward here only keeps it visible/revocable from this screen.
    shared: priorShared,
    shareToken: priorShareToken,
    language,
    representation,
    peopleDetails,
    era: plan.era,
  }

  await supabase.storage.from(CLIP_BUCKET).upload(manifestPath, JSON.stringify(manifest), {
    contentType: 'application/json',
    upsert: true,
  })

  logDiagnostic({ outcome: 'generated', chapterId, slideCount: slides.length, latencyMs: Date.now() - startedAt })
  return res.status(200).json(manifest)
}
