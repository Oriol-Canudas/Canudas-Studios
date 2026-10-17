import { useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import { TOPIC_TEMPLATES, getTopicText, type TopicSubcategory } from '../game/topics'
import ScreenBadge from './ScreenBadge'

type AreaId = 'discover' | 'create' | 'daily' | 'moving'

const AREA_IMAGES: Record<AreaId, string> = {
  discover: '/areas/discover.jpg',
  create: '/areas/create.jpg',
  daily: '/areas/daily.jpg',
  moving: '/areas/moving.jpg',
}

// Only "create" has real content today.
const AVAILABLE_AREAS: AreaId[] = ['create']

// Order matches the brief exactly. Three reuse an existing topic image
// that already fits; the other three (no content yet) get their own
// small illustration so every subcategory still reads as a real,
// designed card rather than a placeholder row.
const CREATE_SUBCATEGORIES: TopicSubcategory[] = ['llocs', 'bandaSonora', 'gent', 'cosesQueSeFer', 'histories', 'maneraDeVeure']

const SUBCATEGORY_IMAGES: Record<TopicSubcategory, string> = {
  llocs: '/subcategories/llocs.jpg',
  bandaSonora: '/subcategories/banda-sonora.jpg',
  gent: '/topics/family.jpg',
  cosesQueSeFer: '/subcategories/coses-que-se-fer.jpg',
  histories: '/topics/wedding.jpg',
  maneraDeVeure: '/topics/love.jpg',
}

type View = { kind: 'areas' } | { kind: 'unavailable'; area: AreaId } | { kind: 'subcategories' } | { kind: 'activities'; subcategory: TopicSubcategory }

export default function CategoryBrowserScreen() {
  const { profile, startSession, goTo } = useGameStore()
  const t = getStrings(profile.language).categoryBrowser
  const [view, setView] = useState<View>({ kind: 'areas' })

  function openArea(area: AreaId) {
    setView(area === 'create' ? { kind: 'subcategories' } : { kind: 'unavailable', area })
  }

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center px-6 py-10">
      <ScreenBadge n={6} />
      <div className="w-full max-w-sm flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <button
            onClick={() => (view.kind === 'areas' ? goTo('home') : setView(view.kind === 'activities' ? { kind: 'subcategories' } : { kind: 'areas' }))}
            className="text-ink-soft text-sm underline"
          >
            {view.kind === 'areas' ? t.back : t.backToAreas}
          </button>
        </header>

        {view.kind === 'areas' && (
          <>
            <h1 className="fade-in-up font-display text-2xl text-ink">{t.title}</h1>

            <div className="fade-in-up-delayed grid grid-cols-2 gap-4">
              {(Object.keys(t.areas) as AreaId[]).map((area) => {
                const available = AVAILABLE_AREAS.includes(area)
                return (
                  <button
                    key={area}
                    onClick={() => openArea(area)}
                    className={`relative aspect-square rounded-2xl overflow-hidden shadow-sm text-left active:scale-[0.98] transition-transform ${
                      available ? '' : 'opacity-60'
                    }`}
                  >
                    <img src={AREA_IMAGES[area]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                    {!available && (
                      <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide bg-ink/60 text-surface rounded-full px-2 py-1">
                        {t.comingSoon}
                      </span>
                    )}
                    <p className="absolute bottom-3 left-3 right-3 font-display text-base text-surface leading-snug">
                      {t.areas[area].title}
                    </p>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {view.kind === 'unavailable' && (
          <div className="fade-in-up flex flex-col gap-4">
            <h1 className="font-display text-2xl text-ink">{t.areas[view.area].title}</h1>
            <p className="text-ink-soft text-base">{t.areas[view.area].invitation}</p>
            <div className="bg-surface border border-ink/10 rounded-2xl p-6 flex flex-col gap-1">
              <p className="text-xs uppercase tracking-wide text-terracotta font-semibold">{t.comingSoon}</p>
              <p className="text-ink-soft text-base">{t.comingSoonNote}</p>
            </div>
          </div>
        )}

        {view.kind === 'subcategories' && (
          <div className="fade-in-up flex flex-col gap-4">
            <h1 className="font-display text-2xl text-ink">{t.areas.create.title}</h1>
            <p className="text-ink-soft text-base">{t.areas.create.invitation}</p>
            <div className="grid grid-cols-2 gap-4">
              {CREATE_SUBCATEGORIES.map((sub) => {
                const hasContent = TOPIC_TEMPLATES.some((tpl) => tpl.subcategory === sub)
                return (
                  <button
                    key={sub}
                    onClick={() => setView({ kind: 'activities', subcategory: sub })}
                    className={`relative aspect-square rounded-2xl overflow-hidden shadow-sm text-left active:scale-[0.98] transition-transform ${
                      hasContent ? '' : 'opacity-60'
                    }`}
                  >
                    <img src={SUBCATEGORY_IMAGES[sub]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                    {!hasContent && (
                      <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide bg-ink/60 text-surface rounded-full px-2 py-1">
                        {t.comingSoon}
                      </span>
                    )}
                    <p className="absolute bottom-3 left-3 right-3 font-display text-base text-surface leading-snug">
                      {t.subcategories[sub]}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {view.kind === 'activities' &&
          (() => {
            const templates = TOPIC_TEMPLATES.filter((tpl) => tpl.subcategory === view.subcategory).slice(0, 4)
            return (
              <div className="fade-in-up flex flex-col gap-4">
                <h1 className="font-display text-2xl text-ink">{t.subcategories[view.subcategory]}</h1>
                {templates.length === 0 ? (
                  <div className="bg-surface border border-ink/10 rounded-2xl p-6 flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-wide text-terracotta font-semibold">{t.comingSoon}</p>
                    <p className="text-ink-soft text-base">{t.comingSoonNote}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {templates.map((tpl) => {
                      const text = getTopicText(tpl, profile.language)
                      return (
                        <button
                          key={tpl.id}
                          onClick={() => startSession(text.openingPrompt, null, tpl.id)}
                          className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-sm text-left active:scale-[0.98] transition-transform"
                        >
                          <img src={tpl.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
                          <p className="absolute bottom-3 left-3 right-3 font-display text-base text-surface leading-snug">
                            {text.label}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}
      </div>
    </div>
  )
}
