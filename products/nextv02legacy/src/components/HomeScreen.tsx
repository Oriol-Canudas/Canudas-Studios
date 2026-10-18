import { useEffect, useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import { ensureSession } from '../game/directorClient'
import ScreenBadge from './ScreenBadge'

// H01 — rebuilt against the approved reference, this time with the
// companion's face present (public/v1/home-companion.jpg, generated from
// the same identity reference as public/director.jpg). The greeting lives
// OUTSIDE the photo entirely, in the cream header above it — not overlaid
// on the image — so there is no risk of text ever crossing her face
// regardless of viewport. The photo is shown at its own native aspect
// ratio inside a width-constrained column (never object-cover-stretched
// full-bleed), so the three pill buttons below, positioned by percentage
// against that same box, always land on the journal/postcard/book
// wherever the box itself ends up being sized.
export default function HomeScreen() {
  const { profile, goTo } = useGameStore()
  const t = getStrings(profile.language).home
  const [hour] = useState(() => new Date().getHours())

  useEffect(() => {
    ensureSession()
  }, [])

  const name = profile.preferredName ? profile.preferredName : null

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <ScreenBadge n={4} />

      <header className="px-6 pt-10 pb-4 max-w-md w-full mx-auto">
        <h1 className="font-display text-3xl text-ink leading-snug">{t.timeGreeting(name, hour)}</h1>
        <p className="text-ink-soft text-lg mt-1">{t.whatToday}</p>
      </header>

      <div className="relative w-full max-w-md mx-auto px-4 pb-8">
        <div className="relative w-full rounded-3xl overflow-hidden shadow-sm">
          <img src="/v1/home-companion.jpg" alt="" className="w-full h-auto block" />

          {/* Explica'm — anchored over the journal, bottom-left of the table */}
          <button
            onClick={() => goTo('topicMenu')}
            className="absolute flex items-center gap-1.5 bg-surface/90 backdrop-blur-sm border border-ink/10 rounded-full px-4 py-2.5 shadow-md active:scale-[0.97] transition-transform"
            style={{ left: '4%', top: '83%' }}
          >
            <span className="text-base">💬</span>
            <span className="font-display text-sm text-ink whitespace-nowrap">{t.explicamLabel}</span>
          </button>

          {/* Sorprèn-me — anchored over the postcard, upper-right of the table.
              Deliberately its own destination, not the Explica'm topic menu:
              both doors used to open the same screen, which is one of the
              verified problems this round fixes. */}
          <button
            onClick={() => goTo('surpriseMenu')}
            className="absolute flex items-center gap-1.5 bg-surface/90 backdrop-blur-sm border border-ink/10 rounded-full px-4 py-2.5 shadow-md active:scale-[0.97] transition-transform"
            style={{ right: '4%', top: '72%' }}
          >
            <span className="text-base">☀️</span>
            <span className="font-display text-sm text-ink whitespace-nowrap">{t.sorprenmeLabel}</span>
          </button>

          {/* El meu llibre — anchored over the book, front-center of the table */}
          <button
            onClick={() => goTo('library')}
            className="absolute flex items-center gap-1.5 bg-surface/90 backdrop-blur-sm border border-ink/10 rounded-full px-4 py-2.5 shadow-md active:scale-[0.97] transition-transform"
            style={{ left: '50%', top: '93%', transform: 'translateX(-50%)' }}
          >
            <span className="text-base">📖</span>
            <span className="font-display text-sm text-ink whitespace-nowrap">{t.libraryButton}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
