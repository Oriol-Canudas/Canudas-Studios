import { useEffect } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'

export default function HomeScreen() {
  const { profile, pendingQuestion, loadPendingQuestion, startSession, goTo } = useGameStore()
  const t = getStrings(profile.language).home

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
          <header className="text-center">
            <p className="text-ink-soft text-base mb-1">{t.greeting(profile.preferredName || '')}</p>
            <h1 className="font-display text-3xl text-ink">
              {profile.city ? t.fromCity(profile.city) : t.welcome}
            </h1>
          </header>

          <div className="flex flex-col gap-4">
            {pendingQuestion && (
              <button
                onClick={() => startSession(pendingQuestion.text, pendingQuestion.id)}
                className="text-left bg-surface/90 backdrop-blur-sm border-2 border-terracotta rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-transform"
              >
                <p className="text-xs uppercase tracking-wide text-terracotta font-semibold mb-2">
                  {t.familyAsks}
                </p>
                <p className="font-display text-xl text-ink leading-snug">{pendingQuestion.text}</p>
              </button>
            )}

            <button
              onClick={() => startSession(t.somethingOnMindPrompt)}
              className="text-left bg-surface/90 backdrop-blur-sm border border-ink/10 rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-transform"
            >
              <p className="font-display text-xl text-ink leading-snug">{t.somethingOnMindTitle}</p>
              <p className="text-ink-soft text-base mt-1">{t.somethingOnMindSubtitle}</p>
            </button>

            <button
              onClick={() => startSession(t.sparkPrompt)}
              className="text-left bg-surface/90 backdrop-blur-sm border border-ink/10 rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-transform relative overflow-hidden"
            >
              <img
                src="/landing-memory.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
              <div className="relative">
                <p className="font-display text-xl text-ink leading-snug">{t.sparkTitle}</p>
                <p className="text-ink-soft text-base mt-1">{t.sparkSubtitle}</p>
              </div>
            </button>

            <button
              onClick={() => goTo('library')}
              className="text-left bg-gold/20 backdrop-blur-sm border border-gold/40 rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-transform"
            >
              <p className="font-display text-xl text-ink leading-snug">{t.libraryButton}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
