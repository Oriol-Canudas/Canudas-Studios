import { useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import ScreenBadge from './ScreenBadge'

// E02-E05 — "Aquells estius," built as one sequential component (same
// spirit as MemoryActivityScreen's step reducer). No AI this stage: pure
// authored content, matching acceptance journey 2 ("Explica'm through
// three scenes, no input, graceful close"). "Em ve un record" is visible
// everywhere the approved reference shows it, but — since contribution
// (P01) isn't part of this bounded stage — tapping it shows an honest
// inline "not yet" notice rather than faking a working flow or silently
// hiding an approved control.
type Step = 'e02' | 'e03' | 'e04' | 'e05'

export default function SummerOpeningScreen() {
  const { profile, goTo } = useGameStore()
  const t = getStrings(profile.language).summerOpening
  const [step, setStep] = useState<Step>('e02')
  const [showComingSoon, setShowComingSoon] = useState(false)

  function contribute() {
    setShowComingSoon(true)
  }

  const comingSoonNotice = showComingSoon && (
    <div
      className="fixed inset-0 z-20 flex items-end md:items-center justify-center bg-ink/50 px-4 pb-6"
      onClick={() => setShowComingSoon(false)}
    >
      <div className="w-full max-w-sm bg-surface rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <p className="text-ink text-base">{t.contributeComingSoon}</p>
        <button onClick={() => setShowComingSoon(false)} className="text-terracotta-deep font-medium underline mt-4">
          {t.ok}
        </button>
      </div>
    </div>
  )

  if (step === 'e02') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ScreenBadge n={7} />
        <div className="fixed inset-0 -z-10">
          <img src="/v1/aquells-estius-street.jpg" alt="" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/40 to-transparent" />
        </div>
        <div className="relative min-h-screen flex flex-col px-6 pt-8 pb-8">
          <button onClick={() => goTo('topicMenu')} className="text-ink-soft text-sm underline self-start drop-shadow-sm">
            {t.back}
          </button>
          <div className="mt-auto flex flex-col gap-3 max-w-sm">
            <p className="text-xs uppercase tracking-wide text-terracotta-deep font-semibold">{t.e02.eyebrow}</p>
            <h1 className="font-display text-2xl text-ink leading-snug">{t.e02.title}</h1>
            <p className="text-ink-soft text-base">{t.e02.subtitle}</p>
            <button
              onClick={() => setStep('e03')}
              className="bg-terracotta text-surface rounded-xl px-6 py-3.5 text-base font-medium mt-2"
            >
              {t.e02.continue}
            </button>
            <button onClick={contribute} className="border border-terracotta-deep text-terracotta-deep rounded-xl px-6 py-3.5 text-base font-medium">
              🎙 {t.contribute}
            </button>
            <button onClick={() => goTo('home')} className="text-ink-soft text-sm underline text-center">
              {t.leave}
            </button>
          </div>
        </div>
        {comingSoonNotice}
      </div>
    )
  }

  if (step === 'e03') {
    return (
      <div className="min-h-screen bg-cream-deep flex flex-col">
        <ScreenBadge n={7} />
        <div className="relative h-[52vh]">
          <img src="/v1/aquells-estius-window.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <button onClick={() => setStep('e02')} className="absolute top-8 left-5 text-surface text-sm underline drop-shadow">
            {t.back}
          </button>
          <button onClick={() => goTo('home')} className="absolute top-8 right-5 text-surface text-sm underline drop-shadow">
            {t.backHome}
          </button>
        </div>
        <div className="flex-1 px-6 py-8 flex flex-col gap-3 max-w-sm mx-auto w-full">
          <h1 className="font-display text-2xl text-ink leading-snug">{t.e03.title}</h1>
          <p className="text-ink-soft text-base">{t.e03.subtitle}</p>
          <button onClick={() => setStep('e04')} className="bg-terracotta text-surface rounded-xl px-6 py-3.5 text-base font-medium mt-2">
            {t.e03.continue}
          </button>
          <button onClick={contribute} className="border border-terracotta-deep text-terracotta-deep rounded-xl px-6 py-3.5 text-base font-medium">
            🎙 {t.contribute}
          </button>
          <button onClick={() => goTo('home')} className="text-ink-soft text-sm underline text-center">
            {t.leave}
          </button>
        </div>
        {comingSoonNotice}
      </div>
    )
  }

  if (step === 'e04') {
    return (
      <div className="min-h-screen bg-cream-deep flex flex-col">
        <ScreenBadge n={7} />
        <div className="relative h-[38vh]">
          <img src="/v1/aquells-estius-street.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'bottom' }} />
          <button onClick={() => setStep('e03')} className="absolute top-8 left-5 text-surface text-sm underline drop-shadow">
            {t.back}
          </button>
          <button onClick={() => goTo('home')} className="absolute top-8 right-5 text-surface text-sm underline drop-shadow">
            {t.backHome}
          </button>
        </div>
        <div className="flex-1 px-6 py-8 flex flex-col gap-3 max-w-sm mx-auto w-full">
          <h1 className="font-display text-2xl text-ink leading-snug">{t.e04.title}</h1>
          <p className="text-ink-soft text-base">{t.e04.subtitle}</p>
          <p className="font-display text-lg text-ink mt-2">{t.e04.prompt}</p>
          <button onClick={contribute} className="flex items-center justify-between bg-surface border border-ink/10 rounded-xl px-5 py-3.5">
            <span className="text-ink">{t.e04.place}</span>
            <span className="text-ink-faint">›</span>
          </button>
          <button onClick={contribute} className="flex items-center justify-between bg-surface border border-ink/10 rounded-xl px-5 py-3.5">
            <span className="text-ink">{t.e04.person}</span>
            <span className="text-ink-faint">›</span>
          </button>
          <button onClick={contribute} className="flex items-center justify-between bg-surface border border-ink/10 rounded-xl px-5 py-3.5">
            <span className="text-ink">{t.e04.activity}</span>
            <span className="text-ink-faint">›</span>
          </button>
          <button onClick={() => setStep('e05')} className="text-ink-soft text-sm underline text-center mt-2">
            {t.e04.keepWatching}
          </button>
        </div>
        {comingSoonNotice}
      </div>
    )
  }

  // E05 — discovery-only close. No question, no fabricated memory.
  return (
    <div className="min-h-screen relative overflow-hidden">
      <ScreenBadge n={7} />
      <div className="fixed inset-0 -z-10">
        <img src="/v1/aquells-estius-street.jpg" alt="" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/40 to-transparent" />
      </div>
      <div className="relative min-h-screen flex flex-col px-6 pt-8 pb-8">
        <div className="mt-auto flex flex-col gap-3 max-w-sm">
          <h1 className="font-display text-2xl text-ink leading-snug">{t.e05.title}</h1>
          <p className="text-ink-soft text-base">{t.e05.subtitle}</p>
          <button onClick={() => goTo('home')} className="bg-terracotta text-surface rounded-xl px-6 py-3.5 text-base font-medium mt-2">
            {t.e05.home}
          </button>
          <button onClick={contribute} className="border border-terracotta-deep text-terracotta-deep rounded-xl px-6 py-3.5 text-base font-medium">
            🎙 {t.contribute}
          </button>
        </div>
      </div>
      {comingSoonNotice}
    </div>
  )
}
