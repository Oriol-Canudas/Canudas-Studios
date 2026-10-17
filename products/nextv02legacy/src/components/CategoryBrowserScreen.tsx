import { useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import { TOPIC_TEMPLATES, getTopicText, type TopicSubcategory } from '../game/topics'

type AreaId = 'discover' | 'create' | 'daily' | 'moving'

const AREA_IMAGES: Record<AreaId, string> = {
  discover: '/areas/discover.jpg',
  create: '/areas/create.jpg',
  daily: '/areas/daily.jpg',
  moving: '/areas/moving.jpg',
}

// Only "create" has real subcategories with content today — the other
// three areas are visible (per the brief, all four must show) but open
// straight to an honest "coming soon" state, never a faked activity.
const CREATE_SUBCATEGORIES: TopicSubcategory[] = ['llocs', 'bandaSonora', 'gent', 'cosesQueSeFer', 'histories', 'maneraDeVeure']

// The one highlighted pick for "Sorprèn-me" — a real, directly-startable
// template, not a fabricated personalised recommendation.
const STARTER_TEMPLATE_ID = 'family-tree'

type View = { kind: 'areas' } | { kind: 'unavailable'; area: AreaId } | { kind: 'subcategories' } | { kind: 'activities'; subcategory: TopicSubcategory }

export default function CategoryBrowserScreen() {
  const { profile, categoryBrowserMode, startSession, goTo } = useGameStore()
  const t = getStrings(profile.language).categoryBrowser
  const [view, setView] = useState<View>({ kind: 'areas' })

  function openArea(area: AreaId) {
    setView(area === 'create' ? { kind: 'subcategories' } : { kind: 'unavailable', area })
  }

  const starterTemplate = TOPIC_TEMPLATES.find((tpl) => tpl.id === STARTER_TEMPLATE_ID)

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center px-6 py-10">
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

            {categoryBrowserMode === 'starter' && starterTemplate && (
              <button
                onClick={() => {
                  const text = getTopicText(starterTemplate, profile.language)
                  startSession(text.openingPrompt, null, starterTemplate.id)
                }}
                className="fade-in-up relative aspect-[16/9] rounded-2xl overflow-hidden shadow-sm text-left active:scale-[0.98] transition-transform"
              >
                <img src={starterTemplate.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-xs uppercase tracking-wide text-gold font-semibold mb-1">{t.starterLabel}</p>
                  <p className="font-display text-xl text-surface leading-snug">
                    {getTopicText(starterTemplate, profile.language).label}
                  </p>
                </div>
              </button>
            )}

            <div className="fade-in-up-delayed grid grid-cols-2 gap-4">
              {(Object.keys(t.areas) as AreaId[]).map((area) => (
                <button
                  key={area}
                  onClick={() => openArea(area)}
                  className="relative aspect-square rounded-2xl overflow-hidden shadow-sm text-left active:scale-[0.98] transition-transform"
                >
                  <img src={AREA_IMAGES[area]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                  <p className="absolute bottom-3 left-3 right-3 font-display text-base text-surface leading-snug">
                    {t.areas[area].title}
                  </p>
                </button>
              ))}
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
            <div className="flex flex-col gap-3">
              {CREATE_SUBCATEGORIES.map((sub) => {
                const hasContent = TOPIC_TEMPLATES.some((tpl) => tpl.subcategory === sub)
                return (
                  <button
                    key={sub}
                    onClick={() => setView({ kind: 'activities', subcategory: sub })}
                    className="text-left bg-surface border border-ink/10 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform flex items-center justify-between gap-3"
                  >
                    <span className="font-display text-lg text-ink">{t.subcategories[sub]}</span>
                    {!hasContent && (
                      <span className="text-xs uppercase tracking-wide text-terracotta-deep shrink-0">{t.comingSoon}</span>
                    )}
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
