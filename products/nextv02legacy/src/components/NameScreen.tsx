import { useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'

export default function NameScreen() {
  const { profile, setNameAndContinue } = useGameStore()
  const t = getStrings(profile.language).name
  const [name, setName] = useState('')

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Same house scene as Welcome, for continuity — only the panel changes. */}
      <img src="/director.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/5" />

      <div className="relative mt-auto px-6 pb-10 pt-16 flex flex-col gap-6">
        <div className="fade-in-up flex flex-col gap-2 text-center">
          <p className="text-surface/90 text-lg">{t.intro}</p>
          <p className="font-display text-2xl text-surface">{t.ask}</p>
        </div>

        <div className="fade-in-up-delayed flex flex-col gap-4 w-full max-w-sm mx-auto">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.placeholder}
            className="w-full bg-surface/95 backdrop-blur-sm rounded-xl px-5 py-4 text-lg text-ink placeholder:text-ink-soft/70"
          />
          <button
            onClick={() => setNameAndContinue(name)}
            disabled={!name.trim()}
            className="bg-terracotta text-surface rounded-xl py-4 text-lg font-medium disabled:opacity-50"
          >
            {t.continueButton}
          </button>
          <button onClick={() => setNameAndContinue(null)} className="text-surface/80 text-base underline">
            {t.skip}
          </button>
        </div>
      </div>
    </div>
  )
}
