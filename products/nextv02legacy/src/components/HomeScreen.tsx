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
    <div className="min-h-screen relative md:flex md:flex-row overflow-hidden bg-cream-deep">
      {/* Same structure as Welcome: on mobile the portrait is its own band
          up top, content flows below in normal document flow (never an
          overlay, so her face can never end up covered); on desktop the
          two live side by side. */}
      <div className="relative h-[42vh] md:h-screen md:w-1/2 overflow-hidden shrink-0">
        <img src="/director.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/5 md:hidden" />
      </div>

      <div className="relative md:h-screen md:w-1/2 md:overflow-y-auto flex flex-col items-center px-6 py-8 md:py-10 gap-6">
        <h1 className="fade-in-up font-display text-2xl text-ink text-center leading-snug">
          {t.greeting(profile.preferredName)}
        </h1>

        <div className="fade-in-up-delayed flex flex-col gap-4 w-full max-w-sm">
          {/* The top row, in priority order: a pending family question (the
              highest reward) > an acknowledgment of what she just saved >
              an honest, outcome-clear suggestion. Never more than one. */}
          {pendingQuestion ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => startSession(pendingQuestion.text, pendingQuestion.id)}
                className="gift-glow flex items-center gap-4 bg-gold/15 border border-gold/40 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform text-left"
              >
                <span className="w-16 h-16 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center text-2xl shrink-0">
                  ✨
                </span>
                <div>
                  <p className="font-display text-lg text-ink leading-snug">{t.familyGift}</p>
                  <p className="text-ink-soft text-sm mt-0.5">{pendingQuestion.text}</p>
                </div>
              </button>
              <button
                onClick={() => postponeQuestion(pendingQuestion.id)}
                className="text-ink-soft text-sm underline self-start ml-1"
              >
                {t.postpone}
              </button>
            </div>
          ) : lastSavedChapter ? (
            <button
              onClick={viewSavedChapter}
              className="flex items-center gap-4 bg-terracotta/10 border border-terracotta/30 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform text-left"
            >
              <span className="w-16 h-16 rounded-xl bg-terracotta/15 border border-terracotta/20 flex items-center justify-center text-2xl shrink-0">
                ✨
              </span>
              <div>
                <p className="font-display text-lg text-ink leading-snug">{t.justSavedLabel}</p>
                <p className="text-ink-soft text-sm mt-0.5">{lastSavedChapter.title}</p>
              </div>
            </button>
          ) : (
            <button
              onClick={startSorpremMe}
              className="flex items-center gap-4 bg-surface border border-ink/10 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform text-left"
            >
              <img src="/entry/surprise.jpg" alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
              <div>
                <p className="font-display text-lg text-ink leading-snug">{t.suggestionTitle}</p>
                <p className="text-ink-soft text-sm mt-0.5">{t.suggestionSubtitle}</p>
              </div>
            </button>
          )}

          <button
            onClick={() => goTo('conversationEntry')}
            className="flex items-center gap-4 bg-surface border border-ink/10 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform text-left"
          >
            <img src="/entry/mind.jpg" alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div>
              <p className="font-display text-lg text-ink leading-snug">{t.mindAction}</p>
            </div>
          </button>

          <button
            onClick={openCategoryBrowser}
            className="flex items-center gap-4 bg-surface border border-ink/10 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform text-left"
          >
            <img src="/entry/showme.jpg" alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div>
              <p className="font-display text-lg text-ink leading-snug">{t.inspireAction}</p>
            </div>
          </button>

          <button
            onClick={() => goTo('library')}
            className="flex items-center gap-4 bg-surface border border-ink/10 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform text-left"
          >
            <span className="w-16 h-16 rounded-xl bg-cream-deep border border-ink/10 flex items-center justify-center text-2xl shrink-0">
              📖
            </span>
            <div>
              <p className="font-display text-lg text-ink leading-snug">{t.libraryButton}</p>
            </div>
          </button>

          <button
            onClick={() => goTo('familyTree')}
            className="flex items-center gap-4 bg-surface border border-ink/10 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform text-left"
          >
            <img src="/topics/family-tree.jpg" alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div>
              <p className="font-display text-lg text-ink leading-snug">{familyTreeStrings.button}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
