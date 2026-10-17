import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../game/store'
import { suspendBackgroundMusic, resumeBackgroundMusic } from '../game/backgroundMusic'
import type { ChapterClip } from '../game/types'

const SLIDE_DURATION_MS = 5500

interface ClipPlayerProps {
  clip: ChapterClip
  onClose: () => void
}

export default function ClipPlayer({ clip, onClose }: ClipPlayerProps) {
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const [index, setIndex] = useState(0)
  // Starts muted when she's turned sound off globally, but this slide's
  // own mute button still works as a one-off override during playback.
  const [muted, setMuted] = useState(!soundEnabled)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const slide = clip.slides[index]

  useEffect(() => {
    if (index >= clip.slides.length - 1) return
    const timer = setTimeout(() => setIndex((i) => i + 1), SLIDE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [index, clip.slides.length])

  useEffect(() => {
    audioRef.current?.play().catch(() => {
      // Autoplay with sound can be blocked even after a tap in some
      // browsers — not fatal, the slideshow still plays silently.
    })
    // The clip has its own soundtrack — ambient background music stays
    // out of the way while it's open, and comes back once she closes it.
    suspendBackgroundMusic()
    return () => resumeBackgroundMusic()
  }, [])

  return (
    <div className="fixed inset-0 z-30 bg-black flex items-center justify-center">
      <div className="relative w-full h-full max-w-md mx-auto overflow-hidden">
        <img
          key={slide.imageUrl}
          src={slide.imageUrl}
          alt=""
          className="clip-kenburns absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />

        <div className="absolute top-0 left-0 right-0 flex gap-1 p-3">
          {clip.slides.map((s, i) => (
            <div key={s.imageUrl} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              {i < index ? (
                <div className="h-full bg-white w-full" />
              ) : i === index ? (
                <div
                  key={index}
                  className="h-full bg-white"
                  style={{ animation: `clip-progress ${SLIDE_DURATION_MS}ms linear forwards` }}
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
          className="absolute bottom-10 left-6 right-6 text-surface font-display text-2xl leading-snug drop-shadow-lg"
        >
          {slide.caption}
        </p>

        <button
          onClick={() => {
            setMuted((m) => !m)
            if (audioRef.current) audioRef.current.muted = !muted
          }}
          className="absolute bottom-10 right-6 text-surface text-2xl"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        {clip.musicUrl && <audio ref={audioRef} src={clip.musicUrl} loop muted={muted} />}
      </div>
    </div>
  )
}
