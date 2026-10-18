import { useEffect, useState } from 'react'
import { getStrings } from '../game/strings'
import type { ClipSlide, SeniorProfile } from '../game/types'

const SLIDE_DURATION_MS = 5500

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
// slide advance, not just the CSS animation.
export default function ClipPlayer({ title, slides, language, onClose }: ClipPlayerProps) {
  const t = getStrings(language).clipPlayer
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showText, setShowText] = useState(false)
  const [reducedMotion] = useState(prefersReducedMotion)
  const slide = slides[index]
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
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
      <div className="relative w-full h-full max-w-md mx-auto overflow-hidden">
        <img
          key={slide.imageUrl}
          src={slide.imageUrl}
          alt=""
          className={reducedMotion ? 'absolute inset-0 w-full h-full object-cover' : 'clip-kenburns absolute inset-0 w-full h-full object-cover'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />

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

        <button onClick={onClose} className="absolute top-6 right-3 text-white text-2xl px-3 py-1" aria-label="Close">
          ✕
        </button>

        <p
          key={`caption-${index}`}
          className="absolute bottom-24 left-6 right-6 text-surface font-display text-2xl leading-snug drop-shadow-lg"
        >
          {slide.caption}
        </p>

        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-2">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="text-surface text-sm bg-black/30 rounded-full px-3 py-2 disabled:opacity-30"
          >
            {t.previous}
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            className="text-surface text-sm bg-black/30 rounded-full px-3 py-2"
          >
            {paused ? t.resume : t.pause}
          </button>
          {isLast ? (
            <button
              onClick={() => {
                setIndex(0)
                setPaused(false)
              }}
              className="text-surface text-sm bg-black/30 rounded-full px-3 py-2"
            >
              {t.replay}
            </button>
          ) : (
            <button
              onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
              className="text-surface text-sm bg-black/30 rounded-full px-3 py-2"
            >
              {t.next}
            </button>
          )}
          <button onClick={() => setShowText(true)} className="text-surface text-sm bg-black/30 rounded-full px-3 py-2">
            {t.showText}
          </button>
        </div>
      </div>
    </div>
  )
}
