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
function detectLanguage(): SeniorProfile['language'] {
  try {
    const lang = navigator.language?.toLowerCase() ?? ''
    if (lang.startsWith('ca')) return 'ca'
    if (lang.startsWith('es')) return 'es'
    return 'en'
  } catch {
    return 'en'
  }
}

interface RecipientViewerScreenProps {
  chapterId: string
  token: string
}

export default function RecipientViewerScreen({ chapterId, token }: RecipientViewerScreenProps) {
  const [language] = useState(detectLanguage)
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

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 gap-6 text-center">
      <h1 className="font-display text-3xl text-ink leading-snug max-w-sm">{title}</h1>
      {authorName && <p className="text-ink-soft text-base">{authorName}</p>}
      <button
        onClick={() => setPlaying(true)}
        className="bg-terracotta text-surface rounded-xl px-8 py-3.5 text-base font-medium"
      >
        {t.start}
      </button>
    </div>
  )
}
