import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import ScreenBadge from './ScreenBadge'

// S01 — Sorprèn-me's own destination, distinct from Explica'm's topic
// menu (fixes the verified problem where both doors opened the same
// screen). Featured Whitney Houston journey, five genuinely inert future
// discovery territories — same "En preparació" pattern as E01.
export default function SurpriseMenuScreen() {
  const { profile, goTo } = useGameStore()
  const t = getStrings(profile.language).surpriseMenu

  const futureTerritories = [
    { key: 'llocs', image: '/subcategories/llocs.jpg' },
    { key: 'natura', image: '/topics/family.jpg' },
    { key: 'art', image: '/subcategories/banda-sonora.jpg' },
    { key: 'viatges', image: '/subcategories/coses-que-se-fer.jpg' },
    { key: 'idees', image: '/topics/love.jpg' },
  ] as const

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center px-6 py-10">
      <ScreenBadge n={12} />
      <div className="w-full max-w-md flex flex-col gap-6">
        <button onClick={() => goTo('home')} className="self-start text-ink-soft text-sm underline">
          {t.home}
        </button>

        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-terracotta-deep font-semibold">{t.eyebrow}</p>
          <h1 className="font-display text-2xl text-ink leading-snug">{t.title}</h1>
          <p className="text-ink-soft text-base">{t.subtitle}</p>
        </div>

        <div className="relative rounded-3xl overflow-hidden">
          <img src="/v1/home-companion.jpg" alt="" className="w-full h-56 object-cover object-top" />
        </div>

        <button
          onClick={() => goTo('whitneyJourney')}
          className="bg-terracotta text-surface rounded-xl px-6 py-3.5 text-base font-medium"
        >
          {t.start}
        </button>
        <p className="text-ink-faint text-sm text-center -mt-2">{t.pace}</p>

        <div className="mt-6 flex flex-col gap-3">
          <p className="text-ink-soft text-sm font-medium">{t.futureTitle}</p>
          <div className="grid grid-cols-2 gap-3">
            {futureTerritories.map(({ key, image }) => (
              <div key={key} className="relative aspect-square rounded-2xl overflow-hidden bg-surface">
                <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-ink/35" />
                <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide bg-ink/60 text-surface rounded-full px-2 py-1">
                  {t.comingSoon}
                </span>
                <p className="absolute bottom-3 left-3 right-3 font-display text-sm text-surface leading-snug">
                  {t.future[key]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
