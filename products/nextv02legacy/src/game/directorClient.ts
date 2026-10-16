import type {
  ConversationTurn,
  ContextItem,
  SeniorProfile,
  DirectorTurnResult,
  PendingQuestion,
  ChapterDraft,
  MemoryChapter,
  ChapterClip,
  FamilyMember,
} from './types'

export interface DirectorRequestBody {
  profile: SeniorProfile
  history: ConversationTurn[]
  pendingOfferedContext: ContextItem[]
  openingTopic?: string
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

export async function requestFamilyTree(): Promise<FamilyMember[]> {
  const res = await fetch('/api/family-tree')
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data?.members) ? data.members : []
}
