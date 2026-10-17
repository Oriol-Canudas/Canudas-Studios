import { useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings, LANGUAGE_NAMES } from '../game/strings'
import type { SeniorProfile } from '../game/types'
import ScreenBadge from './ScreenBadge'

// The Senyera (Catalan flag) has no reliable emoji across devices/fonts —
// drawn inline instead of risking a blank glyph. Paired with its text
// label everywhere it appears, per the brief: never a flag alone.
function SenyeraFlag() {
  const stripes = Array.from({ length: 9 }, (_, i) => i)
  return (
    <svg viewBox="0 0 750 500" className="w-10 h-7 rounded shadow-sm" role="img" aria-label="Senyera catalana">
      {stripes.map((i) => (
        <rect key={i} x="0" y={(i * 500) / 9} width="750" height={500 / 9 + 1} fill={i % 2 === 0 ? '#FCDD09' : '#DA121A'} />
      ))}
    </svg>
  )
}

const LANGUAGE_OPTIONS: { code: SeniorProfile['language']; flag: React.ReactNode }[] = [
  { code: 'ca', flag: <SenyeraFlag /> },
  { code: 'es', flag: <span className="text-3xl leading-none">🇪🇸</span> },
  { code: 'en', flag: <span className="text-3xl leading-none">🇬🇧</span> },
]

export default function WelcomeScreen() {
  const { profile, setLanguage, completeWelcome } = useGameStore()
  const t = getStrings(profile.language).welcome
  const [showLanguageSheet, setShowLanguageSheet] = useState(false)

  return (
    <div className="min-h-screen relative md:flex md:flex-row overflow-hidden bg-cream-deep">
      <ScreenBadge n={1} />
      {/* Mobile: image fills the screen, copy overlays the bottom third.
          Desktop (md:): the two live in separate halves entirely, so no
          crop/scale math can ever put text over the face — it's a
          different region of the layout, not a careful overlay. */}
      <div className="relative h-[60vh] md:h-screen md:w-1/2 overflow-hidden">
        <img src="/director.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/5 md:hidden" />

        <button
          onClick={() => setShowLanguageSheet(true)}
          className="absolute top-5 right-16 flex items-center gap-2 bg-ink/40 backdrop-blur-sm text-surface rounded-full px-4 py-2 text-sm"
        >
          <span aria-hidden>🌐</span>
          <span>{LANGUAGE_NAMES[profile.language]}</span>
        </button>
      </div>

      <div className="relative md:h-screen md:w-1/2 flex flex-col items-center justify-center px-6 py-10 md:py-0 gap-6 text-center">
        <div className="fade-in-up flex flex-col gap-2 max-w-sm">
          <h1 className="font-display text-3xl text-ink leading-snug">{t.title}</h1>
          <p className="text-ink-soft text-lg">{t.subtitle}</p>
        </div>
        <button
          onClick={completeWelcome}
          className="fade-in-up-delayed bg-terracotta text-surface rounded-xl px-8 py-4 text-lg font-medium w-full max-w-xs"
        >
          {t.start}
        </button>
      </div>

      {showLanguageSheet && (
        <div
          className="fixed inset-0 z-20 flex items-end md:items-center justify-center bg-ink/50 px-4 pb-6"
          onClick={() => setShowLanguageSheet(false)}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-3xl p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-ink-soft text-base text-center">{t.languagePrompt}</p>
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                onClick={() => {
                  setLanguage(opt.code)
                  setShowLanguageSheet(false)
                }}
                className={`w-full flex items-center gap-4 rounded-2xl px-5 py-3 transition-colors ${
                  profile.language === opt.code ? 'bg-terracotta/15 border-2 border-terracotta' : 'bg-cream border border-ink/10'
                }`}
              >
                {opt.flag}
                <span className="font-display text-xl text-ink">{LANGUAGE_NAMES[opt.code]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
