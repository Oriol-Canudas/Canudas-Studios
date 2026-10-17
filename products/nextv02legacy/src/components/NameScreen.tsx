import { useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'

export default function NameScreen() {
  const { profile, setNameAndContinue } = useGameStore()
  const t = getStrings(profile.language).name
  const [name, setName] = useState('')

  return (
    <div className="min-h-screen md:flex md:flex-row overflow-hidden bg-cream-deep">
      {/* Same house scene as Welcome, for continuity — same stacked (not
          overlaid) composition so no amount of text/accessibility-size
          growth can ever creep over the face, on mobile or desktop. */}
      <div className="relative h-[55vh] md:h-screen md:w-1/2 overflow-hidden">
        <img src="/director.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
      </div>

      <div className="relative md:h-screen md:w-1/2 flex flex-col items-center justify-center px-6 py-10 gap-6">
        <div className="fade-in-up flex flex-col gap-2 text-center">
          <p className="text-ink-soft text-lg">{t.intro}</p>
          <p className="font-display text-2xl text-ink">{t.ask}</p>
        </div>

        <div className="fade-in-up-delayed flex flex-col gap-4 w-full max-w-sm">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.placeholder}
            className="w-full bg-surface border border-ink/10 rounded-xl px-5 py-4 text-lg text-ink placeholder:text-ink-soft/70"
          />
          <button
            onClick={() => setNameAndContinue(name)}
            disabled={!name.trim()}
            className="bg-terracotta text-surface rounded-xl py-4 text-lg font-medium disabled:opacity-50"
          >
            {t.continueButton}
          </button>
          <button onClick={() => setNameAndContinue(null)} className="text-ink-soft text-base underline">
            {t.skip}
          </button>
        </div>
      </div>
    </div>
  )
}
