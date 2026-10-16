import { useState } from 'react'
import { useGameStore } from '../game/store'
import type { SeniorProfile } from '../game/types'
import DirectorAvatar from './DirectorAvatar'

const LANGUAGES: { code: SeniorProfile['language']; label: string }[] = [
  { code: 'ca', label: 'Català' },
  { code: 'es', label: 'Castellano' },
  { code: 'en', label: 'English' },
]

export default function IntakeScreen() {
  const completeIntake = useGameStore((s) => s.completeIntake)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')
  const [language, setLanguage] = useState<SeniorProfile['language']>('ca')

  const canSubmit = name.trim() && city.trim() && Number(age) > 0

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <DirectorAvatar size="hero" />
          <p className="text-ink-soft text-base">Abans de començar, digue&apos;m una mica de tu</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-ink-soft text-base block mb-1">Com et dius?</label>
            <input
              className="w-full border border-ink/20 rounded-xl px-4 py-3 text-lg bg-surface"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-ink-soft text-base block mb-1">Quants anys tens?</label>
            <input
              type="number"
              inputMode="numeric"
              className="w-full border border-ink/20 rounded-xl px-4 py-3 text-lg bg-surface"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <label className="text-ink-soft text-base block mb-1">On vius?</label>
            <input
              className="w-full border border-ink/20 rounded-xl px-4 py-3 text-lg bg-surface"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className="text-ink-soft text-base block mb-2">Idioma</label>
            <div className="flex gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={
                    language === l.code
                      ? 'flex-1 bg-terracotta text-surface rounded-xl py-3 text-base font-medium'
                      : 'flex-1 bg-surface border border-ink/20 text-ink rounded-xl py-3 text-base'
                  }
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            completeIntake({ preferredName: name.trim(), city: city.trim(), age: Number(age), language })
          }
          disabled={!canSubmit}
          className="bg-terracotta text-surface rounded-xl py-4 text-lg font-medium disabled:opacity-40"
        >
          Comencem
        </button>
      </div>
    </div>
  )
}
