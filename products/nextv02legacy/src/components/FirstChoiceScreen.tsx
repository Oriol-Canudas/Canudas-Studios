import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'

export default function FirstChoiceScreen() {
  const { profile, completeOnboarding, openCategoryBrowser, startSorpremMe, goTo } = useGameStore()
  const t = getStrings(profile.language).firstChoice

  function choose(destination: 'starter' | 'mind' | 'overview') {
    completeOnboarding()
    if (destination === 'mind') goTo('conversationEntry')
    else if (destination === 'starter') startSorpremMe()
    else openCategoryBrowser()
  }

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <h1 className="fade-in-up font-display text-2xl text-ink text-center leading-snug">
          {t.greeting(profile.preferredName)}
        </h1>

        <div className="fade-in-up-delayed flex flex-col gap-4">
          <button
            onClick={() => choose('starter')}
            className="flex items-center gap-4 bg-surface border border-ink/10 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform text-left"
          >
            <img src="/entry/surprise.jpg" alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div>
              <p className="font-display text-lg text-ink leading-snug">{t.surpriseTitle}</p>
              <p className="text-ink-soft text-sm mt-0.5">{t.surpriseSubtitle}</p>
            </div>
          </button>

          <button
            onClick={() => choose('mind')}
            className="flex items-center gap-4 bg-surface border border-ink/10 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform text-left"
          >
            <img src="/entry/mind.jpg" alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div>
              <p className="font-display text-lg text-ink leading-snug">{t.mindTitle}</p>
              <p className="text-ink-soft text-sm mt-0.5">{t.mindSubtitle}</p>
            </div>
          </button>

          <button
            onClick={() => choose('overview')}
            className="flex items-center gap-4 bg-surface border border-ink/10 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform text-left"
          >
            <img src="/entry/showme.jpg" alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div>
              <p className="font-display text-lg text-ink leading-snug">{t.showMeTitle}</p>
              <p className="text-ink-soft text-sm mt-0.5">{t.showMeSubtitle}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
