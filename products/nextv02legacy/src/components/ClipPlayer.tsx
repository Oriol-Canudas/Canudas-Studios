import { useEffect, useState } from 'react'
import { getStrings } from '../game/strings'
import type { ClipSlide, ClipSlideRole, SeniorProfile } from '../game/types'

const SLIDE_DURATION_MS = 5500

// Local-only contrast: the top of every frame stays near-untouched so the
// image itself reads (a full-frame dark wash was the "uniform dark
// treatment" this round fixes); only the band behind the caption/controls
// darkens enough to stay legible. "remains" gets extra breathing room —
// a quieter close deserves a lighter touch than a busy "moment" beat.
const ROLE_GRADIENT: Record<ClipSlideRole, string> = {
  cover: 'bg-gradient-to-t from-black/55 via-black/0 to-transparent',
  place: 'bg-gradient-to-t from-black/50 via-black/0 to-transparent',
  moment: 'bg-gradient-to-t from-black/60 via-black/5 to-transparent',
  remains: 'bg-gradient-to-t from-black/45 via-black/0 to-transparent',
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

interface ClipPlayerProps {
  title: string
  slides: ClipSlide[]
  language: SeniorProfile['language']
  onClose: () => void
}

// M03 / V01 shared player — unobtrusive Pausa/Anterior/Següent/Repetir/
// Mostrar el text, no auto-started audio (NEXT v1 ships no clip
// soundtrack at all — see chapter-clip.ts's header comment), and honours
// reduced motion by disabling both the Ken Burns pan and the automatic
// slide advance, not just the CSS animation. `language` always comes from
// the clip's own content language (manifest/share snapshot), never a
// viewer's browser locale — a Catalan memory must show Catalan controls
// regardless of who's watching it.
export default function ClipPlayer({ title, slides, language, onClose }: ClipPlayerProps) {
  const t = getStrings(language).clipPlayer
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showText, setShowText] = useState(false)
  const [reducedMotion] = useState(prefersReducedMotion)
  const slide = slides[index]
  const role: ClipSlideRole = slide.role ?? 'moment'
  const isLast = index >= slides.length - 1

  useEffect(() => {
    if (paused || showText || reducedMotion || isLast) return
    const timer = setTimeout(() => setIndex((i) => i + 1), SLIDE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [index, paused, showText, reducedMotion, isLast])

  if (showText) {
    return (
      <div className="fixed inset-0 z-[60] bg-ink flex flex-col items-center px-6 py-10 overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-5 text-surface text-2xl" aria-label="Close">
          ✕
        </button>
        <div className="w-full max-w-md flex flex-col gap-6 mt-10">
          <h2 className="font-display text-2xl text-surface">{title}</h2>
          {slides.map((s, i) => (
            <p key={i} className="text-surface/90 text-lg leading-relaxed">
              {s.caption}
            </p>
          ))}
          <button
            onClick={() => setShowText(false)}
            className="bg-surface/15 text-surface rounded-xl py-3 text-base font-medium mt-2"
          >
            {t.hideText}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center md:p-8"
      style={{ background: 'radial-gradient(ellipse at center, #2a2320 0%, #15110f 100%)' }}
    >
      <div className="relative w-full h-full max-w-md mx-auto overflow-hidden md:h-auto md:aspect-[9/16] md:rounded-3xl md:shadow-2xl">
        <img
          key={slide.imageUrl}
          src={slide.imageUrl}
          alt=""
          className={reducedMotion ? 'absolute inset-0 w-full h-full object-cover' : 'clip-kenburns absolute inset-0 w-full h-full object-cover'}
        />
        {/* Local contrast only — the band behind the caption/controls, not the whole frame. */}
        <div className={`absolute inset-0 ${ROLE_GRADIENT[role]}`} />

        <div className="absolute top-0 left-0 right-0 flex gap-1 p-3">
          {slides.map((s, i) => (
            <div key={s.imageUrl} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              {i < index ? (
                <div className="h-full bg-white w-full" />
              ) : i === index ? (
                <div
                  key={`${index}-${paused}`}
                  className="h-full bg-white clip-progress-fill"
                  style={
                    paused || reducedMotion
                      ? { width: '100%', animation: 'none' }
                      : { animation: `clip-progress ${SLIDE_DURATION_MS}ms linear forwards` }
                  }
                />
              ) : null}
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowText(true)}
          className="absolute top-6 left-3 min-w-11 min-h-11 flex items-center justify-center text-surface text-xs font-medium bg-black/35 rounded-full px-3"
        >
          {t.showText}
        </button>
        <button
          onClick={onClose}
          className="absolute top-6 right-3 min-w-11 min-h-11 flex items-center justify-center text-surface text-2xl bg-black/35 rounded-full"
          aria-label="Close"
        >
          ✕
        </button>

        <div key={`caption-${index}`} className="absolute bottom-28 left-6 right-6 flex flex-col gap-1.5">
          {role === 'cover' ? (
            <>
              <h2 className="text-surface font-display text-3xl leading-snug drop-shadow-lg">{title}</h2>
              <p className="text-surface/90 text-base italic drop-shadow-lg">{slide.caption}</p>
            </>
          ) : (
            <p className="text-surface font-display text-2xl leading-snug drop-shadow-lg">{slide.caption}</p>
          )}
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-5">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label={t.previous}
            className="w-11 h-11 flex items-center justify-center text-surface text-xl bg-black/35 rounded-full disabled:opacity-30"
          >
            ‹
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? t.resume : t.pause}
            className="w-16 h-16 flex items-center justify-center text-surface text-2xl bg-black/45 rounded-full border border-surface/20"
          >
            {paused ? '▶' : '❙❙'}
          </button>
          {isLast ? (
            <button
              onClick={() => {
                setIndex(0)
                setPaused(false)
              }}
              aria-label={t.replay}
              className="w-11 h-11 flex items-center justify-center text-surface text-lg bg-black/35 rounded-full"
            >
              ↻
            </button>
          ) : (
            <button
              onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
              aria-label={t.next}
              className="w-11 h-11 flex items-center justify-center text-surface text-xl bg-black/35 rounded-full"
            >
              ›
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
