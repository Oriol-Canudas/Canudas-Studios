import { useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import ScreenBadge from './ScreenBadge'

// E02-E05 — "Aquells estius," built as one sequential component (same
// spirit as MemoryActivityScreen's step reducer). No AI drives the scene
// sequence itself (that stays authored, matching acceptance journey 2:
// "Explica'm through three scenes, no input, graceful close"), but every
// "Em ve un record" control now opens the real contribution pipeline
// (startSession -> ConversationScreen -> ChapterConfirmScreen) instead of
// an honest-but-fake "not yet" notice — that placeholder is gone now that
// P01-P03 are wired in for this stage.
type Step = 'e02' | 'e03' | 'e04' | 'e05'

export default function SummerOpeningScreen() {
  const { profile, goTo, startSession } = useGameStore()
  const t = getStrings(profile.language).summerOpening
  const [step, setStep] = useState<Step>('e02')

  function contribute(topic: string) {
    startSession(topic)
  }

  if (step === 'e02') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ScreenBadge n={7} />
        <div className="fixed inset-0 -z-10">
          <img src="/v1/aquells-estius-street.jpg" alt="" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/40 to-transparent" />
        </div>
        <div className="relative min-h-screen flex flex-col px-6 pt-8 pb-8">
          <button
            onClick={() => goTo('topicMenu')}
            className="self-start bg-ink/55 backdrop-blur-sm text-cream text-sm rounded-full px-4 py-2"
          >
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
            <button
              onClick={() => contribute(t.topicGeneric)}
              className="border border-terracotta-deep text-terracotta-deep rounded-xl px-6 py-3.5 text-base font-medium"
            >
              🎙 {t.contribute}
            </button>
            <button onClick={() => goTo('home')} className="text-ink-soft text-sm underline text-center">
              {t.leave}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'e03') {
    return (
      <div className="min-h-screen bg-cream-deep flex flex-col">
        <ScreenBadge n={7} />
        <div className="relative h-[52vh]">
          <img src="/v1/aquells-estius-window.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <button
            onClick={() => setStep('e02')}
            className="absolute top-3 left-4 bg-ink/55 backdrop-blur-sm text-cream text-sm rounded-full px-4 py-2"
          >
            {t.back}
          </button>
          <button
            onClick={() => goTo('home')}
            className="absolute top-14 right-3 bg-ink/55 backdrop-blur-sm text-cream text-sm rounded-full px-4 py-2"
          >
            {t.backHome}
          </button>
        </div>
        <div className="flex-1 px-6 py-8 flex flex-col gap-3 max-w-sm mx-auto w-full">
          <h1 className="font-display text-2xl text-ink leading-snug">{t.e03.title}</h1>
          <p className="text-ink-soft text-base">{t.e03.subtitle}</p>
          <button onClick={() => setStep('e04')} className="bg-terracotta text-surface rounded-xl px-6 py-3.5 text-base font-medium mt-2">
            {t.e03.continue}
          </button>
          <button
            onClick={() => contribute(t.topicGeneric)}
            className="border border-terracotta-deep text-terracotta-deep rounded-xl px-6 py-3.5 text-base font-medium"
          >
            🎙 {t.contribute}
          </button>
          <button onClick={() => goTo('home')} className="text-ink-soft text-sm underline text-center">
            {t.leave}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'e04') {
    return (
      <div className="min-h-screen bg-cream-deep flex flex-col">
        <ScreenBadge n={7} />
        <div className="relative h-[38vh]">
          <img src="/v1/aquells-estius-street.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'bottom' }} />
          <button
            onClick={() => setStep('e03')}
            className="absolute top-3 left-4 bg-ink/55 backdrop-blur-sm text-cream text-sm rounded-full px-4 py-2"
          >
            {t.back}
          </button>
          <button
            onClick={() => goTo('home')}
            className="absolute top-14 right-3 bg-ink/55 backdrop-blur-sm text-cream text-sm rounded-full px-4 py-2"
          >
            {t.backHome}
          </button>
        </div>
        <div className="flex-1 px-6 py-8 flex flex-col gap-3 max-w-sm mx-auto w-full">
          <h1 className="font-display text-2xl text-ink leading-snug">{t.e04.title}</h1>
          <p className="text-ink-soft text-base">{t.e04.subtitle}</p>
          <p className="font-display text-lg text-ink mt-2">{t.e04.prompt}</p>
          <button
            onClick={() => contribute(t.topicPlace)}
            className="flex items-center justify-between bg-surface border border-ink/10 rounded-xl px-5 py-3.5"
          >
            <span className="text-ink">{t.e04.place}</span>
            <span className="text-ink-faint">›</span>
          </button>
          <button
            onClick={() => contribute(t.topicPerson)}
            className="flex items-center justify-between bg-surface border border-ink/10 rounded-xl px-5 py-3.5"
          >
            <span className="text-ink">{t.e04.person}</span>
            <span className="text-ink-faint">›</span>
          </button>
          <button
            onClick={() => contribute(t.topicActivity)}
            className="flex items-center justify-between bg-surface border border-ink/10 rounded-xl px-5 py-3.5"
          >
            <span className="text-ink">{t.e04.activity}</span>
            <span className="text-ink-faint">›</span>
          </button>
          <button onClick={() => setStep('e05')} className="text-ink-soft text-sm underline text-center mt-2">
            {t.e04.keepWatching}
          </button>
        </div>
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
          <button
            onClick={() => contribute(t.topicGeneric)}
            className="border border-terracotta-deep text-terracotta-deep rounded-xl px-6 py-3.5 text-base font-medium"
          >
            🎙 {t.contribute}
          </button>
        </div>
      </div>
    </div>
  )
}
