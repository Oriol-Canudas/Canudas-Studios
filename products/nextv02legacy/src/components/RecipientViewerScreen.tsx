import { useEffect, useState } from 'react'
import { requestClipView } from '../game/directorClient'
import { getStrings } from '../game/strings'
import type { SeniorProfile, ClipSlide } from '../game/types'
import ClipPlayer from './ClipPlayer'

// V01 — deliberately independent of useGameStore and of any session: a
// recipient has no NEXT account, no cookie, nothing. Rendered directly
// by main.tsx for /share/:chapterId/:token, bypassing the normal App
// shell (SettingsMenu, BackgroundMusic, onboarding) entirely, since none
// of that applies to someone who never opened NEXT itself.
//
// Language comes from the shared clip's own content (clip-view.ts's
// `language` field), never guessed from the visitor's browser locale —
// a Catalan memory must show Catalan controls to every recipient,
// regardless of their own device's language.

interface RecipientViewerScreenProps {
  chapterId: string
  token: string
}

export default function RecipientViewerScreen({ chapterId, token }: RecipientViewerScreenProps) {
  const [language, setLanguage] = useState<SeniorProfile['language']>('ca')
  const t = getStrings(language).memoryClip.v01
  const [status, setStatus] = useState<'loading' | 'unavailable' | 'ready'>('loading')
  const [title, setTitle] = useState('')
  const [authorName, setAuthorName] = useState<string | null>(null)
  const [slides, setSlides] = useState<ClipSlide[]>([])
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    requestClipView(chapterId, token).then((result) => {
      if (!result.available || !result.slides) {
        setStatus('unavailable')
        return
      }
      setTitle(result.title ?? '')
      setAuthorName(result.authorName ?? null)
      setSlides(result.slides)
      if (result.language) setLanguage(result.language)
      setStatus('ready')
    })
  }, [chapterId, token])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-ink-soft text-lg">{t.loading}</p>
      </div>
    )
  }

  if (status === 'unavailable') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6 text-center">
        <p className="text-ink-soft text-lg max-w-sm">{t.unavailable}</p>
      </div>
    )
  }

  if (playing) {
    return <ClipPlayer title={title} slides={slides} language={language} onClose={() => setPlaying(false)} />
  }

  const cover = slides.find((s) => s.role === 'cover') ?? slides[0]

  return (
    <div className="min-h-screen flex items-center justify-center md:p-8 bg-cream-deep">
      <div className="relative w-full min-h-screen md:min-h-0 max-w-md mx-auto overflow-hidden md:aspect-[9/16] md:rounded-3xl md:shadow-2xl">
        {cover && (
          <img src={cover.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
        <div className="relative z-10 min-h-screen md:min-h-0 md:h-full flex flex-col items-center justify-end px-6 pb-16 pt-24 gap-6 text-center">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl text-surface leading-snug max-w-sm drop-shadow-lg">{title}</h1>
            {authorName && <p className="text-surface/85 text-base drop-shadow-lg">{t.by(authorName)}</p>}
          </div>
          <button
            onClick={() => setPlaying(true)}
            className="bg-terracotta text-surface rounded-xl px-8 py-3.5 text-base font-medium shadow-lg"
          >
            {t.start}
          </button>
        </div>
      </div>
    </div>
  )
}
