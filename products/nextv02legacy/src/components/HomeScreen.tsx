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
      {/* Full-screen companion portrait — the persistent backdrop, not a
          cropped box. A bottom-weighted scrim keeps the translucent menu
          legible while leaving her face, near the top, fully uncovered. */}
      <div className="fixed inset-0 -z-10">
        <img src="/director.jpg" alt="" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      </div>

      <div className="relative min-h-screen flex flex-col">
        {/* Guaranteed clear zone — her face stays uncovered no matter the
            viewport height, unlike a plain justify-end which lets content
            grow upward to fill whatever space remains. */}
        <div className="flex-1 min-h-[55vh] md:min-h-[76vh]" />
        <div className="w-full max-w-md mx-auto px-6 pb-10 flex flex-col gap-6">
          {/* Brief greeting — time-neutral, no location. */}
          <header className="text-center fade-in-up">
            <h1 className="font-display text-3xl text-cream drop-shadow-sm">{t.greeting(profile.preferredName)}</h1>
          </header>

          {/* The one main card, in priority order: a pending family
              question (the highest reward) > an acknowledgment of what
              she just saved > an honest, outcome-clear suggestion. Never
              more than one, never the same destination as the stable
              actions below. */}
          {pendingQuestion ? (
            <div className="gift-glow bg-gold/20 backdrop-blur-xl border border-gold/40 rounded-3xl p-6 shadow-lg fade-in-up-delayed">
              <button
                onClick={() => startSession(pendingQuestion.text, pendingQuestion.id)}
                className="w-full text-left active:scale-[0.98] transition-transform"
              >
                <p className="text-xs uppercase tracking-wide text-gold font-semibold mb-2">
                  ✨ {t.familyGift}
                </p>
                <p className="font-display text-xl text-cream leading-snug">{pendingQuestion.text}</p>
              </button>
              <button
                onClick={() => postponeQuestion(pendingQuestion.id)}
                className="text-cream/70 text-sm underline mt-3"
              >
                {t.postpone}
              </button>
            </div>
          ) : lastSavedChapter ? (
            <div className="bg-terracotta/20 backdrop-blur-xl border border-terracotta/40 rounded-3xl p-6 shadow-lg fade-in-up-delayed">
              <p className="text-xs uppercase tracking-wide text-terracotta font-semibold mb-2">
                ✨ {t.justSavedLabel}
              </p>
              <p className="font-display text-xl text-cream leading-snug mb-3">{lastSavedChapter.title}</p>
              <button onClick={viewSavedChapter} className="text-cream font-medium underline">
                {t.viewSaved}
              </button>
            </div>
          ) : (
            <button
              onClick={startSorpremMe}
              className="text-left bg-cream/15 backdrop-blur-xl border border-cream/30 rounded-3xl p-6 shadow-lg active:scale-[0.98] transition-transform fade-in-up-delayed"
            >
              <p className="font-display text-xl text-cream leading-snug">{t.suggestionTitle}</p>
              <p className="text-cream/70 text-base mt-1">{t.suggestionSubtitle}</p>
            </button>
          )}

          {/* Two compact stable actions — distinct from the main card and
              from each other: "bring your own" vs "offer me something." */}
          <div className="flex gap-3">
            <button
              onClick={() => goTo('conversationEntry')}
              className="flex-1 bg-cream/15 backdrop-blur-xl border border-cream/30 rounded-2xl py-4 px-4 text-left active:scale-[0.98] transition-transform shadow-lg"
            >
              <span className="font-display text-base text-cream leading-snug">{t.mindAction}</span>
            </button>
            <button
              onClick={openCategoryBrowser}
              className="flex-1 bg-cream/15 backdrop-blur-xl border border-cream/30 rounded-2xl py-4 px-4 text-left active:scale-[0.98] transition-transform shadow-lg"
            >
              <span className="font-display text-base text-cream leading-snug">{t.inspireAction}</span>
            </button>
          </div>

          {/* The HUD bar — a different, secondary layer entirely. */}
          <div className="flex gap-3 mt-1">
            <button
              onClick={() => goTo('library')}
              className="flex-1 flex items-center justify-center gap-2 bg-cream/10 backdrop-blur-xl border border-cream/20 rounded-full py-3 px-4 active:scale-[0.98] transition-transform"
            >
              <span className="text-lg">📖</span>
              <span className="text-cream/90 text-sm font-medium">{t.libraryButton}</span>
            </button>
            <button
              onClick={() => goTo('familyTree')}
              className="flex-1 flex items-center justify-center gap-2 bg-cream/10 backdrop-blur-xl border border-cream/20 rounded-full py-3 px-4 active:scale-[0.98] transition-transform"
            >
              <span className="text-lg">🌳</span>
              <span className="text-cream/90 text-sm font-medium">{familyTreeStrings.button}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
