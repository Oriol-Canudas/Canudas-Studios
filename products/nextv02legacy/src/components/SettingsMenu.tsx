import { useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings, LANGUAGE_NAMES } from '../game/strings'
import type { SeniorProfile } from '../game/types'

const LANGUAGE_OPTIONS: SeniorProfile['language'][] = ['ca', 'es', 'en']

// Always available, on every screen (rendered once in App.tsx, outside
// the screen switch) — the one place she can change language or sound
// after onboarding, and the only way back to Welcome without losing
// anything already saved.
export default function SettingsMenu() {
  const { profile, setLanguage, soundEnabled, toggleSound, restartApp } = useGameStore()
  const t = getStrings(profile.language).settings
  const [open, setOpen] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)

  function close() {
    setOpen(false)
    setConfirmingReset(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 right-3 z-50 w-9 h-9 rounded-full bg-ink/70 text-cream flex items-center justify-center text-lg shadow-sm"
        aria-label={t.title}
      >
        ⚙️
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/50 px-4 pb-6" onClick={close}>
          <div className="w-full max-w-sm bg-surface rounded-3xl p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            {!confirmingReset ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl text-ink">{t.title}</h2>
                  <button onClick={close} className="text-ink-soft text-sm underline">
                    {t.close}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ink text-base">{t.soundLabel}</span>
                  <button
                    onClick={toggleSound}
                    className={`relative w-14 h-8 rounded-full transition-colors ${soundEnabled ? 'bg-terracotta' : 'bg-ink/15'}`}
                    aria-pressed={soundEnabled}
                    aria-label={soundEnabled ? t.soundOn : t.soundOff}
                  >
                    <span
                      className={`absolute top-1 w-6 h-6 rounded-full bg-surface shadow transition-transform ${soundEnabled ? 'translate-x-7' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-ink text-base">{t.languageLabel}</span>
                  <div className="flex gap-2">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`flex-1 rounded-xl px-3 py-2 text-sm transition-colors ${
                          profile.language === lang ? 'bg-terracotta/15 border-2 border-terracotta text-ink' : 'bg-cream border border-ink/10 text-ink-soft'
                        }`}
                      >
                        {LANGUAGE_NAMES[lang]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setConfirmingReset(true)}
                  className="text-terracotta-deep text-base underline text-left mt-2"
                >
                  {t.resetLabel}
                </button>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl text-ink">{t.resetConfirmTitle}</h2>
                <p className="text-ink-soft text-base">{t.resetConfirmBody}</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      restartApp()
                      close()
                    }}
                    className="bg-terracotta text-surface rounded-xl px-6 py-3 text-base font-medium"
                  >
                    {t.resetConfirm}
                  </button>
                  <button onClick={() => setConfirmingReset(false)} className="text-ink-soft text-base underline">
                    {t.resetCancel}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
