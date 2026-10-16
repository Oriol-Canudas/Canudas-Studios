import { useEffect } from 'react'
import { useGameStore } from '../game/store'

const SOMETHING_ON_YOUR_MIND_PROMPT =
  "Explica'm alguna cosa que tinguis al cap avui — el que sigui."
const TODAYS_SPARK_PROMPT =
  'Una nit o un dia dels seus vint anys que encara recorda perfectament'

export default function HomeScreen() {
  const { profile, pendingQuestion, loadPendingQuestion, startSession } = useGameStore()

  useEffect(() => {
    loadPendingQuestion()
  }, [loadPendingQuestion])

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center">
      <div className="w-full max-w-md">
        <img
          src="/director.jpg"
          alt=""
          className="w-full h-72 object-cover object-top rounded-b-[2.5rem] shadow-sm"
        />

        <div className="px-6 pt-8 pb-10 flex flex-col gap-6">
          <header className="text-center">
            <p className="text-ink-soft text-base mb-1">Bon dia, {profile.preferredName || ''}</p>
            <h1 className="font-display text-3xl text-ink">
              {profile.city ? `Des de ${profile.city}` : 'Benvinguda'}
            </h1>
          </header>

          <div className="flex flex-col gap-4">
            {pendingQuestion && (
              <button
                onClick={() => startSession(pendingQuestion.text, pendingQuestion.id)}
                className="text-left bg-surface border-2 border-terracotta rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-transform"
              >
                <p className="text-xs uppercase tracking-wide text-terracotta font-semibold mb-2">
                  La família et pregunta
                </p>
                <p className="font-display text-xl text-ink leading-snug">{pendingQuestion.text}</p>
              </button>
            )}

            <button
              onClick={() => startSession(SOMETHING_ON_YOUR_MIND_PROMPT)}
              className="text-left bg-surface border border-ink/10 rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-transform"
            >
              <p className="font-display text-xl text-ink leading-snug">Tens alguna cosa al cap</p>
              <p className="text-ink-soft text-base mt-1">Parlem del que vulguis, ara</p>
            </button>

            <button
              onClick={() => startSession(TODAYS_SPARK_PROMPT)}
              className="text-left bg-surface border border-ink/10 rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-transform relative overflow-hidden"
            >
              <img
                src="/landing-memory.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-15"
              />
              <div className="relative">
                <p className="font-display text-xl text-ink leading-snug">Una espurna d&apos;avui</p>
                <p className="text-ink-soft text-base mt-1">Una cosa que et vull preguntar</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
