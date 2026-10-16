import { useState } from 'react'
import { useGameStore } from '../game/store'
import DirectorAvatar from './DirectorAvatar'

const STRINGS = {
  ca: {
    intro: "Abans de començar, digue'm una mica de tu",
    name: 'Com et dius?',
    age: 'Quants anys tens?',
    city: 'On vius?',
    submit: 'Comencem',
  },
  es: {
    intro: 'Antes de empezar, cuéntame un poco sobre ti',
    name: '¿Cómo te llamas?',
    age: '¿Cuántos años tienes?',
    city: '¿Dónde vives?',
    submit: 'Empecemos',
  },
  en: {
    intro: "Before we start, tell me a bit about yourself",
    name: "What's your name?",
    age: 'How old are you?',
    city: 'Where do you live?',
    submit: "Let's begin",
  },
} as const

export default function IntakeScreen() {
  const { profile, completeIntake } = useGameStore()
  const t = STRINGS[profile.language]

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')

  const canSubmit = name.trim() && city.trim() && Number(age) > 0

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <DirectorAvatar size="hero" />
          <p className="text-ink-soft text-base">{t.intro}</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-ink-soft text-base block mb-1">{t.name}</label>
            <input
              className="w-full border border-ink/20 rounded-xl px-4 py-3 text-lg bg-surface"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-ink-soft text-base block mb-1">{t.age}</label>
            <input
              type="number"
              inputMode="numeric"
              className="w-full border border-ink/20 rounded-xl px-4 py-3 text-lg bg-surface"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <label className="text-ink-soft text-base block mb-1">{t.city}</label>
            <input
              className="w-full border border-ink/20 rounded-xl px-4 py-3 text-lg bg-surface"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={() =>
            completeIntake({ ...profile, preferredName: name.trim(), city: city.trim(), age: Number(age) })
          }
          disabled={!canSubmit}
          className="bg-terracotta text-surface rounded-xl py-4 text-lg font-medium disabled:opacity-40"
        >
          {t.submit}
        </button>
      </div>
    </div>
  )
}
