import { useEffect } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'

export default function HomeScreen() {
  const { profile, pendingQuestion, loadPendingQuestion, postponeQuestion, startSession, openCategoryBrowser, goTo } =
    useGameStore()
  const t = getStrings(profile.language).home
  const familyTreeStrings = getStrings(profile.language).familyTree

  useEffect(() => {
    loadPendingQuestion()
  }, [loadPendingQuestion])

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

          {/* The one main card: a pending family question is the highest
              reward when present; otherwise an honest general invitation.
              Never both, never neither leaving a visible gap. */}
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
          ) : (
            <button
              onClick={() => goTo('conversationEntry')}
              className="text-left bg-surface border border-ink/10 rounded-3xl p-6 shadow-sm active:scale-[0.98] transition-transform fade-in-up-delayed"
            >
              <p className="font-display text-xl text-ink leading-snug">{t.generalInvitationTitle}</p>
              <p className="text-ink-soft text-base mt-1">{t.generalInvitationSubtitle}</p>
            </button>
          )}

          {/* Two compact stable actions — not big competing panels. */}
          <div className="flex gap-3">
            <button
              onClick={() => goTo('conversationEntry')}
              className="flex-1 bg-surface border border-ink/10 rounded-2xl py-4 px-4 text-left active:scale-[0.98] transition-transform"
            >
              <span className="font-display text-base text-ink leading-snug">{t.mindAction}</span>
            </button>
            <button
              onClick={() => openCategoryBrowser('overview')}
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
