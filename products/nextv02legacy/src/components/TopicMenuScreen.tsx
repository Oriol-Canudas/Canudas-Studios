import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import ScreenBadge from './ScreenBadge'

// E01 — six illustrated topics, exactly one active. The five disabled
// tiles are genuinely inert this stage (no onClick at all) rather than
// tap-then-redirect to a notice screen — "truly disabled," per the brief,
// not just visually muted.
const DISABLED_TOPICS: { key: 'llocs' | 'gent' | 'bandaSonora' | 'cosesQueSeFer' | 'maneraDeVeure'; image: string }[] = [
  { key: 'llocs', image: '/subcategories/llocs.jpg' },
  { key: 'gent', image: '/topics/family.jpg' },
  { key: 'bandaSonora', image: '/subcategories/banda-sonora.jpg' },
  { key: 'cosesQueSeFer', image: '/subcategories/coses-que-se-fer.jpg' },
  { key: 'maneraDeVeure', image: '/topics/love.jpg' },
]

export default function TopicMenuScreen() {
  const { profile, goTo } = useGameStore()
  const t = getStrings(profile.language).topicMenu

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center px-6 py-10">
      <ScreenBadge n={6} />
      <div className="w-full max-w-sm flex flex-col gap-6">
        <button onClick={() => goTo('home')} className="text-ink-soft text-sm underline self-start">
          {t.back}
        </button>

        <div>
          <h1 className="font-display text-2xl text-ink">{t.title}</h1>
          <p className="text-ink-soft text-base mt-1">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Active tile — Moments i aventures / Aquells estius */}
          <button
            onClick={() => goTo('summerOpening')}
            className="relative aspect-square rounded-2xl overflow-hidden shadow-sm text-left active:scale-[0.98] transition-transform col-span-2"
          >
            <img src="/v1/aquells-estius-street.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2 items-start">
              <p className="font-display text-base text-surface leading-snug">{t.summerLabel}</p>
              <span className="bg-terracotta text-surface text-sm font-medium rounded-full px-3 py-1.5">
                {t.summerCta}
              </span>
            </div>
          </button>

          {/* Disabled tiles — visible, labeled, genuinely inert */}
          {DISABLED_TOPICS.map((topic) => (
            <div key={topic.key} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm opacity-60">
              <img src={topic.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
              <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide bg-ink/60 text-surface rounded-full px-2 py-1">
                {t.comingSoon}
              </span>
              <p className="absolute bottom-3 left-3 right-3 font-display text-base text-surface leading-snug">
                {t.categories[topic.key]}
              </p>
            </div>
          ))}
        </div>

        <p className="text-ink-soft text-sm text-center">{t.footer}</p>
      </div>
    </div>
  )
}
