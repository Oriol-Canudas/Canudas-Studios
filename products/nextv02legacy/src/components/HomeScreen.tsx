import { useEffect } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'

export default function HomeScreen() {
  const {
    profile,
    pendingQuestion,
    loadPendingQuestion,
    postponeQuestion,
    lastSavedChapter,
    startSession,
    startSorpremMe,
    openCategoryBrowser,
    openLibraryChapter,
    clearLastSavedChapter,
    goTo,
  } = useGameStore()
  const t = getStrings(profile.language).home
  const familyTreeStrings = getStrings(profile.language).familyTree

  useEffect(() => {
    loadPendingQuestion()
  }, [loadPendingQuestion])

  function viewSavedChapter() {
    if (!lastSavedChapter) return
    openLibraryChapter(lastSavedChapter.id)
    clearLastSavedChapter()
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* The full-screen companion scene, edge to edge. A top-weighted
          scrim keeps the translucent menu legible; it fades out by the
          point her face begins, so the picture reads clearly below it. */}
      <div className="fixed inset-0 -z-10">
        <img src="/director.jpg" alt="" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/15 to-transparent" />
      </div>

      <div className="relative min-h-screen flex flex-col items-center px-6 pt-8 pb-10 gap-4">
        <header className="text-center fade-in-up">
          <h1 className="font-display text-2xl text-cream drop-shadow-sm leading-snug">
            {t.greeting(profile.preferredName)}
          </h1>
        </header>

        <div className="fade-in-up-delayed w-full max-w-sm flex flex-col gap-3">
          {/* The one primary card, in priority order: a pending family
              question > an acknowledgment of what she just saved > an
              honest, outcome-clear suggestion. Never more than one. */}
          {pendingQuestion ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => startSession(pendingQuestion.text, pendingQuestion.id)}
                className="gift-glow text-left bg-gold/20 backdrop-blur-xl border border-gold/40 rounded-2xl p-4 shadow-lg active:scale-[0.98] transition-transform"
              >
                <p className="text-xs uppercase tracking-wide text-gold font-semibold mb-1">✨ {t.familyGift}</p>
                <p className="font-display text-lg text-cream leading-snug">{pendingQuestion.text}</p>
              </button>
              <button
                onClick={() => postponeQuestion(pendingQuestion.id)}
                className="text-cream/80 text-sm underline self-start ml-1"
              >
                {t.postpone}
              </button>
            </div>
          ) : lastSavedChapter ? (
            <button
              onClick={viewSavedChapter}
              className="text-left bg-terracotta/20 backdrop-blur-xl border border-terracotta/40 rounded-2xl p-4 shadow-lg active:scale-[0.98] transition-transform"
            >
              <p className="text-xs uppercase tracking-wide text-terracotta font-semibold mb-1">✨ {t.justSavedLabel}</p>
              <p className="font-display text-lg text-cream leading-snug">{lastSavedChapter.title}</p>
            </button>
          ) : (
            <button
              onClick={startSorpremMe}
              className="text-left bg-cream/15 backdrop-blur-xl border border-cream/30 rounded-2xl p-4 shadow-lg active:scale-[0.98] transition-transform"
            >
              <p className="font-display text-lg text-cream leading-snug">{t.suggestionTitle}</p>
              <p className="text-cream/80 text-sm mt-0.5">{t.suggestionSubtitle}</p>
            </button>
          )}

          <button
            onClick={() => goTo('conversationEntry')}
            className="text-left bg-cream/15 backdrop-blur-xl border border-cream/30 rounded-2xl p-4 shadow-lg active:scale-[0.98] transition-transform"
          >
            <span className="font-display text-lg text-cream leading-snug">{t.mindAction}</span>
          </button>

          {/* Three compact actions in a row — keeps the menu's total
              height from growing down into her face on short viewports. */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={openCategoryBrowser}
              className="flex flex-col items-center gap-1.5 bg-cream/10 backdrop-blur-xl border border-cream/20 rounded-2xl py-3 px-2 active:scale-[0.98] transition-transform"
            >
              <span className="text-xl">🧭</span>
              <span className="text-cream/90 text-xs font-medium text-center leading-tight">{t.inspireAction}</span>
            </button>
            <button
              onClick={() => goTo('library')}
              className="flex flex-col items-center gap-1.5 bg-cream/10 backdrop-blur-xl border border-cream/20 rounded-2xl py-3 px-2 active:scale-[0.98] transition-transform"
            >
              <span className="text-xl">📖</span>
              <span className="text-cream/90 text-xs font-medium text-center leading-tight">{t.libraryButton}</span>
            </button>
            <button
              onClick={() => goTo('familyTree')}
              className="flex flex-col items-center gap-1.5 bg-cream/10 backdrop-blur-xl border border-cream/20 rounded-2xl py-3 px-2 active:scale-[0.98] transition-transform"
            >
              <span className="text-xl">🌳</span>
              <span className="text-cream/90 text-xs font-medium text-center leading-tight">{familyTreeStrings.button}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
