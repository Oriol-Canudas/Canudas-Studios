import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import { TOPIC_TEMPLATES, getTopicText } from '../game/topics'

export default function TopicPickerScreen() {
  const { profile, startSession, goTo } = useGameStore()
  const t = getStrings(profile.language).topicPicker
  const homeStrings = getStrings(profile.language).home

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center px-5 py-8">
      <div className="w-full max-w-md flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-ink leading-snug">{t.title}</h1>
          <button onClick={() => goTo('home')} className="text-ink-soft text-sm underline whitespace-nowrap ml-3">
            {t.back}
          </button>
        </header>

        <div className="grid grid-cols-2 gap-4">
          {TOPIC_TEMPLATES.map((template) => {
            const text = getTopicText(template, profile.language)
            return (
              <button
                key={template.id}
                onClick={() => startSession(text.openingPrompt, null, template.id)}
                className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-sm text-left active:scale-[0.98] transition-transform"
              >
                <img src={template.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
                <p className="absolute bottom-3 left-3 right-3 text-surface font-display text-lg leading-snug">
                  {text.label}
                </p>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => startSession(homeStrings.somethingOnMindPrompt)}
          className="text-left bg-surface/90 backdrop-blur-sm border border-ink/10 rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-transform"
        >
          <p className="font-display text-xl text-ink leading-snug">{t.freeformTitle}</p>
          <p className="text-ink-soft text-base mt-1">{t.freeformSubtitle}</p>
        </button>
      </div>
    </div>
  )
}
