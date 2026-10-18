import type {
  ConversationTurn,
  ContextItem,
  SeniorProfile,
  DirectorTurnResult,
  PendingQuestion,
  ChapterDraft,
  MemoryChapter,
  ChapterClip,
  ClipSlide,
  ClipShareSnapshot,
  FamilyMember,
} from './types'

export interface DirectorRequestBody {
  profile: SeniorProfile
  history: ConversationTurn[]
  pendingOfferedContext: ContextItem[]
  openingTopic?: string
  // L04 resume: the existing saved story she's adding to, so the Director
  // can build on it coherently instead of starting a fresh one.
  existingExcerpt?: string | null
}

export async function requestDirectorTurn(body: DirectorRequestBody): Promise<DirectorTurnResult> {
  const res = await fetch('/api/director-respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: 'unknown_error' }))
    throw new Error(payload.error ?? `request_failed_${res.status}`)
  }

  return (await res.json()) as DirectorTurnResult
}

export async function requestPendingQuestion(): Promise<PendingQuestion | null> {
  const res = await fetch('/api/pending-question')
  if (!res.ok) return null
  const data = await res.json()
  return data?.question ?? null
}

export interface ChapterFinalizeRequestBody {
  profile: SeniorProfile
  history: ConversationTurn[]
  confirmedContext: ContextItem[]
  questionId?: string | null
  // L04 resume: when set, the crafted chapter updates this existing row
  // (merging with what's already there) instead of creating a new one.
  existingChapterId?: string | null
}

export async function requestChapterFinalize(
  body: ChapterFinalizeRequestBody,
): Promise<ChapterDraft> {
  const res = await fetch('/api/chapter-finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: 'unknown_error' }))
    throw new Error(payload.error ?? `request_failed_${res.status}`)
  }

  return (await res.json()) as ChapterDraft
}

// Idempotent — safe to call on every Home mount. Resolves (and, on a
// visitor's first call ever, creates) her anonymous owner session; the
// server sets the HttpOnly cookie, nothing here needs to store anything.
export async function ensureSession(): Promise<{ seniorId: string; preferredName: string | null } | null> {
  const res = await fetch('/api/session', { method: 'POST' })
  if (!res.ok) return null
  const data = await res.json()
  return typeof data?.seniorId === 'string' ? { seniorId: data.seniorId, preferredName: data.preferredName ?? null } : null
}

export async function requestChapterLibrary(): Promise<MemoryChapter[]> {
  const res = await fetch('/api/chapters-list')
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data?.chapters) ? data.chapters : []
}

export async function requestChapterClip(chapterId: string): Promise<ChapterClip> {
  const res = await fetch('/api/chapter-clip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId }),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: 'unknown_error' }))
    throw new Error(payload.error ?? `request_failed_${res.status}`)
  }

  return (await res.json()) as ChapterClip
}

// M01 must ask before anything is generated — this only ever checks for
// an already-cached clip, never triggers generation.
export async function requestExistingClip(chapterId: string): Promise<ChapterClip | null> {
  const res = await fetch('/api/chapter-clip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId, checkOnly: true }),
  })
  if (!res.ok) return null
  return (await res.json()) as ChapterClip
}

export async function requestFamilyTree(): Promise<FamilyMember[]> {
  const res = await fetch('/api/family-tree')
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data?.members) ? data.members : []
}

async function postMemoryDraft<T>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/memory-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'unknown_error' }))
    throw new Error(error.error ?? `request_failed_${res.status}`)
  }
  return (await res.json()) as T
}

export interface MemoryInterpretation {
  sufficient: boolean
  clarificationPrompt: string | null
}

export function requestMemoryInterpret(rawText: string, starterLabel: string, language: SeniorProfile['language']) {
  return postMemoryDraft<MemoryInterpretation>({ mode: 'interpret', rawText, starterLabel, language })
}

export interface MemoryDraft {
  title: string
  body: string
}

export function requestMemoryDraft(
  rawText: string,
  detail: string | null,
  starterLabel: string,
  language: SeniorProfile['language'],
) {
  return postMemoryDraft<MemoryDraft>({ mode: 'draft', rawText, detail, starterLabel, language })
}

export function requestMemoryRevise(
  currentTitle: string,
  currentBody: string,
  instruction: string,
  language: SeniorProfile['language'],
) {
  return postMemoryDraft<MemoryDraft>({ mode: 'revise', currentTitle, currentBody, instruction, language })
}

export async function requestMemorySave(title: string, body: string): Promise<{ id: string; title: string }> {
  const res = await fetch('/api/memory-save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'unknown_error' }))
    throw new Error(error.error ?? `request_failed_${res.status}`)
  }
  return (await res.json()) as { id: string; title: string }
}

// --- NEXT v1 Slice 3 — memory clip review/save/share (M04-M06) ---
// One endpoint (clip-manage.ts) for all of these — Vercel's Hobby plan
// caps a deployment at 12 Serverless Functions, so what started as two
// files (clip-update.ts + clip-share.ts) got merged there; nothing
// about the five actions themselves changed.

async function postClipManage(payload: Record<string, unknown>): Promise<ChapterClip> {
  const res = await fetch('/api/clip-manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'unknown_error' }))
    throw new Error(error.error ?? `request_failed_${res.status}`)
  }
  return (await res.json()) as ChapterClip
}

export function requestClipSave(chapterId: string) {
  return postClipManage({ chapterId, action: 'save' })
}

export function requestClipEditText(chapterId: string, title: string, slides: { caption: string }[]) {
  return postClipManage({ chapterId, action: 'editText', title, slides })
}

export function requestClipRerollImage(chapterId: string, slideIndex: number) {
  return postClipManage({ chapterId, action: 'rerollImage', slideIndex })
}

export async function requestClipShareCreate(
  chapterId: string,
  authorName: string | null,
): Promise<{ token: string; chapterId: string }> {
  const res = await fetch('/api/clip-manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId, action: 'shareCreate', authorName }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'unknown_error' }))
    throw new Error(error.error ?? `request_failed_${res.status}`)
  }
  return await res.json()
}

export async function requestClipShareRevoke(chapterId: string): Promise<void> {
  const res = await fetch('/api/clip-manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId, action: 'shareRevoke' }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'unknown_error' }))
    throw new Error(error.error ?? `request_failed_${res.status}`)
  }
}

export interface ClipViewResult {
  available: boolean
  title?: string
  authorName?: string | null
  slides?: ClipSlide[]
}

// Public, unauthenticated — V01's recipient read. Never sends or needs
// the session cookie.
export async function requestClipView(chapterId: string, token: string): Promise<ClipViewResult> {
  const res = await fetch(`/api/clip-view?chapterId=${encodeURIComponent(chapterId)}&token=${encodeURIComponent(token)}`)
  if (!res.ok) return { available: false }
  return (await res.json()) as ClipViewResult
}

// Referenced only for its type re-export convenience — ClipShareSnapshot
// itself is never fetched client-side (clip-view.ts flattens it).
export type { ClipShareSnapshot }
