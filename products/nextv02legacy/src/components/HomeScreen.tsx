import { useEffect } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'

export default function HomeScreen() {
  const { profile, pendingQuestion, loadPendingQuestion, startSession, goTo } = useGameStore()
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
          {/* Warm welcome — never tied to place; location has no business on a main menu. */}
          <header className="text-center">
            <p className="text-ink-soft text-base mb-1">{t.warmLine}</p>
            <h1 className="font-display text-3xl text-ink">{t.greeting(profile.preferredName || '')}</h1>
          </header>

          {/* Tier 2 — the reward. The single most special thing on this
              screen when present; nothing at all when not, by design. */}
          {pendingQuestion && (
            <button
              onClick={() => startSession(pendingQuestion.text, pendingQuestion.id)}
              className="gift-glow text-left bg-gradient-to-br from-gold/25 to-surface rounded-3xl p-6 active:scale-[0.98] transition-transform"
            >
              <p className="text-xs uppercase tracking-wide text-terracotta-deep font-semibold mb-2">
                ✨ {t.familyGift}
              </p>
              <p className="font-display text-xl text-ink leading-snug">{pendingQuestion.text}</p>
            </button>
          )}

          {/* Tier 1 — the core choices. Big, bold, equally weighted. */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => goTo('topicPicker')}
              className="relative aspect-square rounded-3xl overflow-hidden shadow-sm text-left active:scale-[0.98] transition-transform"
            >
              <img src="/director.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="font-display text-2xl text-surface leading-snug">{t.somethingOnMindTitle}</p>
                <p className="text-surface/90 text-base mt-1">{t.somethingOnMindSubtitle}</p>
              </div>
            </button>

            <button
              onClick={() => goTo('topicPicker')}
              className="relative aspect-square rounded-3xl overflow-hidden shadow-sm text-left active:scale-[0.98] transition-transform"
            >
              <img src="/landing-memory.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="font-display text-2xl text-surface leading-snug">{t.sparkTitle}</p>
                <p className="text-surface/90 text-base mt-1">{t.sparkSubtitle}</p>
              </div>
            </button>
          </div>

          {/* Tier 3 — the HUD bar. Present, important, visually a
              different layer entirely from the two tiers above: no
              image, no card treatment, just a slim persistent strip. */}
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
