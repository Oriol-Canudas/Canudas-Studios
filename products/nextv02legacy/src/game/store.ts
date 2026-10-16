import { create } from 'zustand'
import type {
  ConversationTurn,
  ContextItem,
  SeniorProfile,
  DirectorFunction,
  ScreenName,
  PendingQuestion,
  ChapterDraft,
} from './types'
import { requestDirectorTurn, requestPendingQuestion, requestChapterFinalize } from './directorClient'

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const PROFILE_STORAGE_KEY = 'nextv02legacy.profile'

function loadSavedProfile(): SeniorProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.preferredName || !parsed?.city || !parsed?.language) return null
    return parsed as SeniorProfile
  } catch {
    return null
  }
}

function saveProfile(profile: SeniorProfile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // localStorage unavailable — intake just re-asks next time, not fatal.
  }
}

interface GameState {
  screen: ScreenName
  profile: SeniorProfile
  pendingQuestion: PendingQuestion | null
  activeQuestionId: string | null

  turns: ConversationTurn[]
  confirmedContext: ContextItem[]
  // Dev-only visibility, surfaced nowhere in the real screens — kept on
  // the store for now since TextHarness.tsx still reads it.
  researchedUnconfirmed: ContextItem[]
  pendingOfferedContext: ContextItem[]
  activeFunction: DirectorFunction | null
  offeringClose: boolean
  isThinking: boolean
  failedDraft: string | null
  lastError: string | null

  chapterDraft: ChapterDraft | null
  isFinalizing: boolean
  isConfirming: boolean

  goTo: (screen: ScreenName) => void
  setProfile: (p: SeniorProfile) => void
  completeIntake: (p: SeniorProfile) => void
  loadPendingQuestion: () => Promise<void>
  startSession: (openingTopic: string, questionId?: string | null) => Promise<void>
  sendSeniorReply: (text: string) => Promise<void>
  retryLastTurn: () => Promise<void>
  finalizeChapter: () => Promise<void>
  confirmChapter: () => Promise<void>
  requestCorrection: (note: string) => Promise<void>
  reset: () => void
}

const savedProfile = loadSavedProfile()
const fallbackProfile: SeniorProfile = { preferredName: '', city: '', age: 0, language: 'ca' }

export const useGameStore = create<GameState>((set, get) => ({
  screen: savedProfile ? 'home' : 'intake',
  profile: savedProfile ?? fallbackProfile,
  pendingQuestion: null,
  activeQuestionId: null,

  turns: [],
  confirmedContext: [],
  researchedUnconfirmed: [],
  pendingOfferedContext: [],
  activeFunction: null,
  offeringClose: false,
  isThinking: false,
  failedDraft: null,
  lastError: null,

  chapterDraft: null,
  isFinalizing: false,
  isConfirming: false,

  goTo: (screen) => set({ screen }),
  setProfile: (p) => set({ profile: p }),
  completeIntake: (p) => {
    saveProfile(p)
    set({ profile: p, screen: 'home' })
  },

  loadPendingQuestion: async () => {
    const question = await requestPendingQuestion()
    set({ pendingQuestion: question })
  },

  startSession: async (openingTopic, questionId = null) => {
    set({ isThinking: true, lastError: null, activeQuestionId: questionId, screen: 'conversation' })
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

  finalizeChapter: async () => {
    set({ isFinalizing: true, lastError: null })
    try {
      const { profile, turns, confirmedContext, activeQuestionId } = get()
      const draft = await requestChapterFinalize({
        profile,
        history: turns,
        confirmedContext,
        questionId: activeQuestionId,
      })
      set({ chapterDraft: draft, isFinalizing: false, screen: 'chapterConfirm' })
    } catch (e) {
      set({ isFinalizing: false, lastError: e instanceof Error ? e.message : 'unknown_error' })
    }
  },

  confirmChapter: async () => {
    const draft = get().chapterDraft
    if (!draft) return
    set({ isConfirming: true, lastError: null })
    try {
      const res = await fetch('/api/chapter-finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: draft.id, confirm: true }),
      })
      if (!res.ok) throw new Error(`confirm_failed_${res.status}`)
      set({ isConfirming: false, screen: 'sessionClose' })
    } catch (e) {
      set({ isConfirming: false, lastError: e instanceof Error ? e.message : 'unknown_error' })
    }
  },

  requestCorrection: async (note) => {
    set({ isFinalizing: true, lastError: null })
    try {
      const { profile, turns, confirmedContext, activeQuestionId } = get()
      const correctedHistory: ConversationTurn[] = [
        ...turns,
        { id: makeId(), role: 'senior', content: `Correction: ${note}`, createdAt: new Date().toISOString() },
      ]
      const draft = await requestChapterFinalize({
        profile,
        history: correctedHistory,
        confirmedContext,
        questionId: activeQuestionId,
      })
      set({ chapterDraft: draft, isFinalizing: false })
    } catch (e) {
      set({ isFinalizing: false, lastError: e instanceof Error ? e.message : 'unknown_error' })
    }
  },

  reset: () =>
    set({
      screen: 'home',
      activeQuestionId: null,
      turns: [],
      confirmedContext: [],
      researchedUnconfirmed: [],
      pendingOfferedContext: [],
      activeFunction: null,
      offeringClose: false,
      isThinking: false,
      failedDraft: null,
      lastError: null,
      chapterDraft: null,
      isFinalizing: false,
      isConfirming: false,
    }),
}))
