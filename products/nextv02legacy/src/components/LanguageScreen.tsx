import type { ReactNode } from 'react'
import { useGameStore } from '../game/store'
import type { SeniorProfile } from '../game/types'
import DirectorAvatar from './DirectorAvatar'

// The Senyera (Catalan language flag) has no reliable emoji across
// devices/fonts — drawn inline instead, rather than risk a blank glyph.
function SenyeraFlag() {
  const stripes = Array.from({ length: 9 }, (_, i) => i)
  return (
    <svg viewBox="0 0 750 500" className="w-16 h-11 rounded-md shadow-sm" role="img" aria-label="Senyera catalana">
      {stripes.map((i) => (
        <rect
          key={i}
          x="0"
          y={(i * 500) / 9}
          width="750"
          height={500 / 9 + 1}
          fill={i % 2 === 0 ? '#FCDD09' : '#DA121A'}
        />
      ))}
    </svg>
  )
}

const OPTIONS: { code: SeniorProfile['language']; label: string; flag: ReactNode }[] = [
  { code: 'ca', label: 'Català', flag: <SenyeraFlag /> },
  {
    code: 'es',
    label: 'Castellano',
    flag: <span className="text-5xl leading-none">🇪🇸</span>,
  },
  {
    code: 'en',
    label: 'English',
    flag: <span className="text-5xl leading-none">🇬🇧</span>,
  },
]

export default function LanguageScreen() {
  const chooseLanguage = useGameStore((s) => s.chooseLanguage)

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <DirectorAvatar size="hero" />
        <p className="text-ink-soft text-lg text-center">Tria el teu idioma · Elige tu idioma · Choose your language</p>
        <div className="w-full flex flex-col gap-4">
          {OPTIONS.map((opt) => (
            <button
              key={opt.code}
              onClick={() => chooseLanguage(opt.code)}
              className="w-full flex items-center gap-4 bg-surface border border-ink/10 rounded-2xl px-5 py-4 shadow-sm active:scale-[0.98] transition-transform"
            >
              {opt.flag}
              <span className="font-display text-xl text-ink">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
