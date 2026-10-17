import { create } from 'zustand'
import type {
  ConversationTurn,
  ContextItem,
  SeniorProfile,
  DirectorFunction,
  ScreenName,
  PendingQuestion,
  ChapterDraft,
  SavedChapterSummary,
} from './types'
import { requestDirectorTurn, requestPendingQuestion, requestChapterFinalize } from './directorClient'

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const PROFILE_STORAGE_KEY = 'nextv02legacy.profile'
const ONBOARDING_STORAGE_KEY = 'nextv02legacy.onboardingCompleted'
const POSTPONED_STORAGE_KEY = 'nextv02legacy.postponedQuestionIds'

// Only used the very first time, before any language has been saved — the
// device's own language is a better default than always falling back to
// Catalan, per the brief ("suggest the device language when supported").
function detectDeviceLanguage(): SeniorProfile['language'] {
  try {
    const lang = navigator.language?.toLowerCase() ?? ''
    if (lang.startsWith('ca')) return 'ca'
    if (lang.startsWith('es')) return 'es'
    return 'en'
  } catch {
    return 'en'
  }
}

// Always returns a usable profile (never null) — language is decided one
// way or another (saved choice, else device, else English) even before
// she's given a name, since the language control is live from frame one.
function loadSavedProfile(): SeniorProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.language === 'ca' || parsed?.language === 'es' || parsed?.language === 'en') {
        return { preferredName: typeof parsed.preferredName === 'string' ? parsed.preferredName : '', language: parsed.language }
      }
    }
  } catch {
    // fall through to a fresh default
  }
  return { preferredName: '', language: detectDeviceLanguage() }
}

function saveProfile(profile: SeniorProfile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // localStorage unavailable — settings just don't survive a reload, not fatal.
  }
}

function loadOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function saveOnboardingCompleted() {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, '1')
  } catch {
    // Worst case she sees the welcome sequence again next visit — not fatal.
  }
}

function loadPostponedQuestionIds(): string[] {
  try {
    const raw = localStorage.getItem(POSTPONED_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function savePostponedQuestionIds(ids: string[]) {
  try {
    localStorage.setItem(POSTPONED_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // A postponed question might get re-promoted once more — not fatal.
  }
}

interface GameState {
  screen: ScreenName
  profile: SeniorProfile
  onboardingCompleted: boolean
  pendingQuestion: PendingQuestion | null
  postponedQuestionIds: string[]
  // The most recently saved "Un petit record" (or any chapter) this
  // session, so Home can acknowledge it — cleared once she's seen it.
  lastSavedChapter: SavedChapterSummary | null
  // Set right before navigating to Library so it can auto-open this one
  // chapter instead of just showing the grid.
  openChapterId: string | null
  activeQuestionId: string | null
  // Set when a session starts from a category-browser template — read back
  // at chapter-confirm time so the backend knows whether to also run
  // family-member extraction (only for the 'family-tree' template, to
  // avoid an extra AI call on every single confirmed chapter).
  activeTemplateId: string | null

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
  setLanguage: (language: SeniorProfile['language']) => void
  completeWelcome: () => void
  setNameAndContinue: (name: string | null) => void
  completeOnboarding: () => void
  openCategoryBrowser: () => void
  startSorpremMe: () => void
  loadPendingQuestion: () => Promise<void>
  postponeQuestion: (id: string) => void
  setLastSavedChapter: (chapter: SavedChapterSummary) => void
  clearLastSavedChapter: () => void
  openLibraryChapter: (chapterId: string) => void
  clearOpenChapterId: () => void
  startSession: (openingTopic: string, questionId?: string | null, templateId?: string | null) => Promise<void>
  sendSeniorReply: (text: string) => Promise<void>
  retryLastTurn: () => Promise<void>
  finalizeChapter: () => Promise<void>
  confirmChapter: () => Promise<void>
  requestCorrection: (note: string) => Promise<void>
  reset: () => void
}

const savedProfile = loadSavedProfile()
const onboardingCompleted = loadOnboardingCompleted()

export const useGameStore = create<GameState>((set, get) => ({
  screen: onboardingCompleted ? 'home' : 'welcome',
  profile: savedProfile,
  onboardingCompleted,
  pendingQuestion: null,
  postponedQuestionIds: loadPostponedQuestionIds(),
  lastSavedChapter: null,
  openChapterId: null,
  activeQuestionId: null,
  activeTemplateId: null,

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

  setLanguage: (language) => {
    const profile = { ...get().profile, language }
    saveProfile(profile)
    set({ profile })
  },

  completeWelcome: () => set({ screen: 'name' }),

  setNameAndContinue: (name) => {
    const profile = { ...get().profile, preferredName: (name ?? '').trim() }
    saveProfile(profile)
    set({ profile, screen: 'firstChoice' })
  },

  completeOnboarding: () => {
    saveOnboardingCompleted()
    set({ onboardingCompleted: true })
  },

  openCategoryBrowser: () => set({ screen: 'categoryBrowser' }),

  // "Sorprèn-me" goes straight to a short, available, outcome-clear
  // activity — never the open-ended Director chat, and never the
  // heaviest thing we have (family tree) as the very first ask.
  startSorpremMe: () => set({ screen: 'memoryActivity' }),

  setLastSavedChapter: (chapter) => set({ lastSavedChapter: chapter }),
  clearLastSavedChapter: () => set({ lastSavedChapter: null }),
  openLibraryChapter: (chapterId) => set({ openChapterId: chapterId, screen: 'library' }),
  clearOpenChapterId: () => set({ openChapterId: null }),

  loadPendingQuestion: async () => {
    const question = await requestPendingQuestion()
    const postponed = get().postponedQuestionIds
    set({ pendingQuestion: question && !postponed.includes(question.id) ? question : null })
  },

  postponeQuestion: (id) => {
    const ids = [...get().postponedQuestionIds, id]
    savePostponedQuestionIds(ids)
    set({ postponedQuestionIds: ids, pendingQuestion: null })
  },

  startSession: async (openingTopic, questionId = null, templateId = null) => {
    set({
      isThinking: true,
      lastError: null,
      activeQuestionId: questionId,
      activeTemplateId: templateId,
      screen: 'conversation',
    })
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
        body: JSON.stringify({ chapterId: draft.id, confirm: true, templateId: get().activeTemplateId }),
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
      activeTemplateId: null,
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
