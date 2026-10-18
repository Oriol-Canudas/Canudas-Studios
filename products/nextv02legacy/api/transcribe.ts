// Self-contained — same convention as director-respond.ts and
// chapter-finalize.ts. The browser sends the recorded audio as a raw
// binary body (not multipart — simpler on our side), tagged with its
// actual mime type in Content-Type and an optional ?lang= query param;
// this function reads the raw bytes, re-wraps them as the multipart
// form ElevenLabs' Scribe endpoint expects, and returns just the text.

const MAX_AUDIO_BYTES = 15 * 1024 * 1024 // ~15MB, generous for a single reply

function elevenLabsAvailable(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY) && process.env.STT_DISABLED !== '1'
}

// This endpoint has no user auth (the app has none), so an Origin check
// is the cheap first line of defense against a direct curl hit on a
// discovered URL — it stops casual/scripted abuse, though it can't stop
// a determined attacker who forges the header themselves. The rate limit
// below is the real backstop for that case.
function isAllowedOrigin(originHeader: string | undefined): boolean {
  if (!originHeader) return false
  try {
    const { hostname } = new URL(originHeader)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.vercel.app')
  } catch {
    return false
  }
}

// In-memory per-IP sliding window. Serverless instances are ephemeral and
// can run several in parallel, so this isn't a hard global cap — but on a
// warm instance (the common case for back-to-back requests from the same
// visitor) it catches a scripted hammer even if the Origin header above
// were spoofed, which an in-browser request can never do.
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_PER_WINDOW = 10
const requestTimestampsByIp = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (requestTimestampsByIp.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  recent.push(now)
  requestTimestampsByIp.set(ip, recent)
  return recent.length > RATE_LIMIT_MAX_PER_WINDOW
}

function clientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}

// Defensive about how Vercel's Node runtime hands us a non-JSON body:
// req.body may already be a populated Buffer/string for this content type
// (observed for some content types), or the stream may still need reading
// directly — this project has no Next.js-specific body-parser config
// (that convention doesn't apply to Vercel's native, framework-agnostic
// api/*.ts functions), so cover both rather than assume.
async function readRawBody(req: any): Promise<Buffer> {
  if (Buffer.isBuffer(req.body) && req.body.length > 0) return req.body
  if (typeof req.body === 'string' && req.body.length > 0) return Buffer.from(req.body, 'binary')

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!elevenLabsAvailable()) {
    return res.status(503).json({ error: 'stt_unavailable' })
  }

  if (!isAllowedOrigin(req.headers.origin)) {
    return res.status(403).json({ error: 'forbidden_origin' })
  }

  if (isRateLimited(clientIp(req))) {
    return res.status(429).json({ error: 'rate_limited' })
  }

  const audioBuffer = await readRawBody(req)
  if (audioBuffer.length === 0) {
    return res.status(400).json({ error: 'empty_audio' })
  }
  if (audioBuffer.length > MAX_AUDIO_BYTES) {
    return res.status(413).json({ error: 'audio_too_large' })
  }

  const contentType = req.headers['content-type'] || 'audio/webm'
  const langParam = typeof req.query?.lang === 'string' ? req.query.lang : null
  const languageCode = langParam === 'ca' ? 'cat' : langParam === 'es' ? 'spa' : langParam === 'en' ? 'eng' : null

  try {
    const formData = new FormData()
    formData.append('model_id', 'scribe_v2')
    formData.append('file', new Blob([audioBuffer], { type: contentType }), 'reply.webm')
    if (languageCode) formData.append('language_code', languageCode)

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
      body: formData,
    })

    if (!response.ok) {
      console.log(JSON.stringify({ at: 'transcribe', outcome: 'non_2xx', status: response.status }))
      return res.status(502).json({ error: 'upstream_failure' })
    }

    const data: any = await response.json()
    const text = typeof data?.text === 'string' ? data.text.trim() : ''
    if (!text) {
      return res.status(502).json({ error: 'empty_transcription' })
    }

    return res.status(200).json({ text })
  } catch (err) {
    console.log(
      JSON.stringify({ at: 'transcribe', outcome: 'error', message: err instanceof Error ? err.message : 'unknown' }),
    )
    return res.status(502).json({ error: 'upstream_failure' })
  }
}
