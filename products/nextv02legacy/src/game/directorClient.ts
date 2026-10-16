import type { ConversationTurn, ContextItem, SeniorProfile, DirectorTurnResult } from './types'

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
