import { useGameStore } from '../game/store'

export default function SessionCloseScreen() {
  const { profile, reset } = useGameStore()

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center justify-center px-6 text-center gap-6">
      <h1 className="font-display text-2xl text-ink leading-snug max-w-sm">
        Gràcies, {profile.preferredName}. Ho guardo per avui.
      </h1>
      <button
        onClick={reset}
        className="bg-terracotta text-surface rounded-xl px-6 py-3 text-lg font-medium"
      >
        Tornar a l'inici
      </button>
    </div>
  )
}
