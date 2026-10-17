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
    <div className="min-h-screen bg-cream-deep flex flex-col items-center relative">
      <div className="fixed inset-0 -z-10">
        <img src="/landing-memory.jpg" alt="" className="w-full h-full object-cover opacity-10" />
      </div>

      <div className="w-full max-w-md">
        <img
          src="/director.jpg"
          alt=""
          className="w-full h-72 object-cover object-top rounded-b-[2.5rem] shadow-sm"
        />

        <div className="px-6 pt-8 pb-10 flex flex-col gap-6">
          {/* Brief greeting — time-neutral, no location. */}
          <header className="text-center fade-in-up">
            <h1 className="font-display text-3xl text-ink">{t.greeting(profile.preferredName)}</h1>
          </header>

          {/* The one main card, in priority order: a pending family
              question (the highest reward) > an acknowledgment of what
              she just saved > an honest, outcome-clear suggestion. Never
              more than one, never the same destination as the stable
              actions below. */}
          {pendingQuestion ? (
            <div className="gift-glow bg-gradient-to-br from-gold/25 to-surface rounded-3xl p-6 fade-in-up-delayed">
              <button
                onClick={() => startSession(pendingQuestion.text, pendingQuestion.id)}
                className="w-full text-left active:scale-[0.98] transition-transform"
              >
                <p className="text-xs uppercase tracking-wide text-terracotta-deep font-semibold mb-2">
                  ✨ {t.familyGift}
                </p>
                <p className="font-display text-xl text-ink leading-snug">{pendingQuestion.text}</p>
              </button>
              <button
                onClick={() => postponeQuestion(pendingQuestion.id)}
                className="text-ink-soft text-sm underline mt-3"
              >
                {t.postpone}
              </button>
            </div>
          ) : lastSavedChapter ? (
            <div className="bg-gradient-to-br from-terracotta/15 to-surface rounded-3xl p-6 fade-in-up-delayed">
              <p className="text-xs uppercase tracking-wide text-terracotta-deep font-semibold mb-2">
                ✨ {t.justSavedLabel}
              </p>
              <p className="font-display text-xl text-ink leading-snug mb-3">{lastSavedChapter.title}</p>
              <button onClick={viewSavedChapter} className="text-terracotta-deep font-medium underline">
                {t.viewSaved}
              </button>
            </div>
          ) : (
            <button
              onClick={startSorpremMe}
              className="text-left bg-surface border border-ink/10 rounded-3xl p-6 shadow-sm active:scale-[0.98] transition-transform fade-in-up-delayed"
            >
              <p className="font-display text-xl text-ink leading-snug">{t.suggestionTitle}</p>
              <p className="text-ink-soft text-base mt-1">{t.suggestionSubtitle}</p>
            </button>
          )}

          {/* Two compact stable actions — distinct from the main card and
              from each other: "bring your own" vs "offer me something." */}
          <div className="flex gap-3">
            <button
              onClick={() => goTo('conversationEntry')}
              className="flex-1 bg-surface border border-ink/10 rounded-2xl py-4 px-4 text-left active:scale-[0.98] transition-transform"
            >
              <span className="font-display text-base text-ink leading-snug">{t.mindAction}</span>
            </button>
            <button
              onClick={openCategoryBrowser}
              className="flex-1 bg-surface border border-ink/10 rounded-2xl py-4 px-4 text-left active:scale-[0.98] transition-transform"
            >
              <span className="font-display text-base text-ink leading-snug">{t.inspireAction}</span>
            </button>
          </div>

          {/* The HUD bar — a different, secondary layer entirely. */}
          <div className="flex gap-3 mt-1">
            <button
              onClick={() => goTo('library')}
              className="flex-1 flex items-center justify-center gap-2 bg-ink/5 rounded-full py-3 px-4 active:scale-[0.98] transition-transform"
            >
              <span className="text-lg">📖</span>
              <span className="text-ink-soft text-sm font-medium">{t.libraryButton}</span>
            </button>
            <button
              onClick={() => goTo('familyTree')}
              className="flex-1 flex items-center justify-center gap-2 bg-ink/5 rounded-full py-3 px-4 active:scale-[0.98] transition-transform"
            >
              <span className="text-lg">🌳</span>
              <span className="text-ink-soft text-sm font-medium">{familyTreeStrings.button}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
