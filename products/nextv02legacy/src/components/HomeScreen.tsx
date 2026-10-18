import { useEffect, useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import { ensureSession } from '../game/directorClient'
import ScreenBadge from './ScreenBadge'

// H01 — rebuilt against the approved reference: the objects on the table
// carry the functions (notebook → Explica'm, postcard → Sorprèn-me, book
// → El meu llibre) instead of a menu floating over her portrait. Family
// requests and the family tree are deliberately not wired in here this
// stage — see store.ts's comment on openCategoryBrowser/openLibraryChapter
// for where that code still lives, untouched, just not reachable from Home.
export default function HomeScreen() {
  const { profile, goTo } = useGameStore()
  const t = getStrings(profile.language).home
  const [hour] = useState(() => new Date().getHours())

  useEffect(() => {
    ensureSession()
  }, [])

  const name = profile.preferredName ? profile.preferredName : null

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ScreenBadge n={4} />
      <img src="/v1/home-objects.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-cream/70 via-cream/10 to-cream/35" />

      <div className="relative min-h-screen flex flex-col px-6 pt-10 pb-8">
        <header className="mb-auto">
          <h1 className="font-display text-3xl text-ink drop-shadow-sm leading-snug">
            {t.timeGreeting(name, hour)}
          </h1>
          <p className="text-ink-soft text-lg mt-1">{t.whatToday}</p>
        </header>

        {/* Explica'm — positioned near the open journal, left side of the scene */}
        <button
          onClick={() => goTo('topicMenu')}
          className="self-start mt-[28vh] flex items-center gap-2 bg-surface/90 backdrop-blur-sm border border-ink/10 rounded-2xl px-5 py-3 shadow-md active:scale-[0.98] transition-transform"
        >
          <span className="text-xl">💬</span>
          <span className="font-display text-lg text-ink">{t.explicamLabel}</span>
        </button>

        {/* Sorprèn-me — positioned near the postcard, upper right of the scene */}
        <button
          onClick={() => goTo('topicMenu')}
          className="self-end -mt-2 flex items-center gap-2 bg-surface/90 backdrop-blur-sm border border-ink/10 rounded-2xl px-5 py-3 shadow-md active:scale-[0.98] transition-transform"
        >
          <span className="text-xl">☀️</span>
          <span className="font-display text-lg text-ink">{t.sorprenmeLabel}</span>
        </button>

        {/* El meu llibre — positioned near the book, lower right of the scene */}
        <button
          onClick={() => goTo('library')}
          className="self-end mt-auto flex items-center gap-2 bg-surface/90 backdrop-blur-sm border border-ink/10 rounded-2xl px-5 py-3 shadow-md active:scale-[0.98] transition-transform"
        >
          <span className="text-xl">📖</span>
          <span className="font-display text-lg text-ink">{t.libraryButton}</span>
        </button>
      </div>
    </div>
  )
}
