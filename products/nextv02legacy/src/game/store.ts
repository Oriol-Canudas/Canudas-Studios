import { create } from 'zustand'
import type { ConversationTurn, ContextItem, SeniorProfile, DirectorFunction } from './types'
import { requestDirectorTurn } from './directorClient'

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface GameState {
  profile: SeniorProfile
  turns: ConversationTurn[]
  confirmedContext: ContextItem[]
  // Dev-only visibility for this text harness — the real product never
  // renders researched-unconfirmed notes to any user, ever.
  researchedUnconfirmed: ContextItem[]
  pendingOfferedContext: ContextItem[]
  activeFunction: DirectorFunction | null
  offeringClose: boolean
  isThinking: boolean
  failedDraft: string | null
  lastError: string | null

  setProfile: (p: SeniorProfile) => void
  startSession: (openingTopic: string) => Promise<void>
  sendSeniorReply: (text: string) => Promise<void>
  retryLastTurn: () => Promise<void>
  reset: () => void
}

const initialProfile: SeniorProfile = { preferredName: 'Montserrat', language: 'ca' }

export const useGameStore = create<GameState>((set, get) => ({
  profile: initialProfile,
  turns: [],
  confirmedContext: [],
  researchedUnconfirmed: [],
  pendingOfferedContext: [],
  activeFunction: null,
  offeringClose: false,
  isThinking: false,
  failedDraft: null,
  lastError: null,

  setProfile: (p) => set({ profile: p }),

  startSession: async (openingTopic) => {
    set({ isThinking: true, lastError: null })
    try {
      const result = await requestDirectorTurn({
        profile: get().profile,
        history: [],
        pendingOfferedContext: [],
        openingTopic,
      })
      const directorTurn: ConversationTurn = {
        id: makeId(),
        role: 'director',
        content: result.dialogue,
        createdAt: new Date().toISOString(),
      }
      set({
        turns: [directorTurn],
        pendingOfferedContext: result.offeredContext,
        researchedUnconfirmed: [...get().researchedUnconfirmed, ...result.researchedUnconfirmed],
        activeFunction: result.activeFunction,
        offeringClose: result.offeringClose,
        isThinking: false,
      })
    } catch (e) {
      set({ isThinking: false, lastError: e instanceof Error ? e.message : 'unknown_error' })
    }
  },

  sendSeniorReply: async (text) => {
    const seniorTurn: ConversationTurn = {
      id: makeId(),
      role: 'senior',
      content: text,
      createdAt: new Date().toISOString(),
    }
    // Optimistic update: show her turn immediately, before the Director replies.
    set({
      turns: [...get().turns, seniorTurn],
      isThinking: true,
      lastError: null,
      failedDraft: null,
    })

    try {
      const { profile, turns, pendingOfferedContext } = get()
      const result = await requestDirectorTurn({
        profile,
        history: turns,
        pendingOfferedContext,
      })

      const nowConfirmed = pendingOfferedContext.filter((item) =>
        result.confirmedThisTurn.includes(item.text),
      )

      const directorTurn: ConversationTurn = {
        id: makeId(),
        role: 'director',
        content: result.dialogue,
        createdAt: new Date().toISOString(),
      }

      set({
        turns: [...get().turns, directorTurn],
        confirmedContext: [...get().confirmedContext, ...nowConfirmed],
        pendingOfferedContext: result.offeredContext,
        researchedUnconfirmed: [...get().researchedUnconfirmed, ...result.researchedUnconfirmed],
        activeFunction: result.activeFunction,
        offeringClose: result.offeringClose,
        isThinking: false,
      })
    } catch (e) {
      // Roll the optimistic senior turn's failure state forward rather than
      // discarding it — she gets a retry, never a silently vanished reply.
      set({
        isThinking: false,
        failedDraft: text,
        lastError: e instanceof Error ? e.message : 'unknown_error',
      })
    }
  },

  retryLastTurn: async () => {
    const draft = get().failedDraft
    if (!draft) return
    set({ turns: get().turns.slice(0, -1), failedDraft: null })
    await get().sendSeniorReply(draft)
  },

  reset: () =>
    set({
      turns: [],
      confirmedContext: [],
      researchedUnconfirmed: [],
      pendingOfferedContext: [],
      activeFunction: null,
      offeringClose: false,
      isThinking: false,
      failedDraft: null,
      lastError: null,
    }),
}))
