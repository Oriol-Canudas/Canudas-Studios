import { useEffect, useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import { suspendBackgroundMusic, resumeBackgroundMusic } from '../game/backgroundMusic'
import ScreenBadge from './ScreenBadge'

// S02-S07 — the Whitney Houston / Dolly Parton discovery journey.
// Real video IDs (verified playable via a properly-embedded iframe with a
// real Referer, not raw navigation — see the session's own audio
// verification work): Whitney "I Will Always Love You" (official video)
// and Dolly's original. Listening is opt-in throughout: the iframe is
// only ever mounted after an explicit tap, never on load, and an external
// YouTube link sits next to every embed as a working fallback.
const WHITNEY_VIDEO_ID = '3JWTaaS7LdU'
const DOLLY_VIDEO_ID = 'lKsQR72HY0s'

type Step = 's02' | 's03' | 's04' | 's05' | 's06' | 's07'

function youtubeEmbedUrl(id: string) {
  return `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1`
}

function youtubeWatchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`
}

function Player({ videoId, playLabel, pauseLabel }: { videoId: string; playLabel: string; pauseLabel: string }) {
  const [playing, setPlaying] = useState(false)

  // Keep the ambient backdrop out of the way of her own listening — same
  // suspend/resume mechanism the voice recorder uses. Count-based, so S06's
  // two simultaneous players (Whitney + Dolly) don't resume ambient music
  // just because one of them was paused while the other keeps playing.
  useEffect(() => {
    if (!playing) return
    suspendBackgroundMusic()
    return () => resumeBackgroundMusic()
  }, [playing])

  return (
    <div className="flex flex-col gap-2">
      {playing ? (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-ink">
          <iframe
            src={youtubeEmbedUrl(videoId)}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="player"
          />
        </div>
      ) : null}
      <button
        onClick={() => setPlaying((p) => !p)}
        className="bg-terracotta text-surface rounded-xl px-6 py-3 text-base font-medium"
      >
        {playing ? pauseLabel : playLabel}
      </button>
      <a
        href={youtubeWatchUrl(videoId)}
        target="_blank"
        rel="noreferrer"
        className="text-ink-faint text-xs underline text-center"
      >
        youtube.com ↗
      </a>
    </div>
  )
}

export default function WhitneyJourneyScreen() {
  const { profile, goTo, startSession } = useGameStore()
  const t = getStrings(profile.language).whitneyJourney
  const [step, setStep] = useState<Step>('s02')
  const [showSources, setShowSources] = useState(false)

  function contribute() {
    startSession(t.contribute + ' — "I Will Always Love You" (Whitney Houston / Dolly Parton)')
  }

  const shell = (badge: number, children: React.ReactNode) => (
    <div className="min-h-screen bg-cream flex flex-col items-center px-6 py-10">
      <ScreenBadge n={badge} />
      <div className="w-full max-w-md flex flex-col gap-5">
        <div className="relative rounded-3xl overflow-hidden -mx-2">
          <img src="/v1/whitney-listening.jpg" alt="" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-ink/30" />
        </div>
        {children}
      </div>
    </div>
  )

  if (step === 's02') {
    return shell(
      13,
      <>
        <h1 className="font-display text-2xl text-ink leading-snug">{t.s02.title}</h1>
        <p className="text-ink-soft text-base">{t.s02.subtitle}</p>
        <p className="text-ink-faint text-sm">{t.s02.timeline}</p>
        <p className="text-ink-soft text-base mt-2">{t.s02.prelisten}</p>
        <button
          onClick={() => setStep('s03')}
          className="bg-terracotta text-surface rounded-xl px-6 py-3.5 text-base font-medium"
        >
          {t.s02.listen}
        </button>
        <button onClick={() => setStep('s04')} className="text-ink-soft text-sm underline text-center">
          {t.s02.skip}
        </button>
        <button onClick={contribute} className="border border-terracotta-deep text-terracotta-deep rounded-xl px-6 py-3 text-base font-medium">
          🎙 {t.contribute}
        </button>
        <button onClick={() => goTo('surpriseMenu')} className="text-ink-faint text-xs underline text-center">
          {t.back}
        </button>
      </>,
    )
  }

  if (step === 's03') {
    return shell(
      13,
      <>
        <h1 className="font-display text-2xl text-ink leading-snug">{t.s03.title}</h1>
        <p className="text-ink-soft text-base -mt-2">{t.s03.artist}</p>
        <p className="text-ink-soft text-base">{t.s03.subtitle}</p>
        <Player videoId={WHITNEY_VIDEO_ID} playLabel={t.s03.play} pauseLabel={t.s03.pause} />
        <button
          onClick={() => setStep('s04')}
          className="bg-terracotta text-surface rounded-xl px-6 py-3.5 text-base font-medium mt-2"
        >
          {t.s03.revealStory}
        </button>
        <button onClick={contribute} className="text-ink-soft text-sm underline text-center">
          {t.contribute}
        </button>
      </>,
    )
  }

  if (step === 's04') {
    return shell(
      13,
      <>
        <h1 className="font-display text-2xl text-ink leading-snug">{t.s04.title}</h1>
        <p className="text-ink-soft text-base">{t.s04.subtitle}</p>
        <button
          onClick={() => setStep('s05')}
          className="flex items-center justify-between bg-surface border border-ink/10 rounded-xl px-5 py-3.5"
        >
          <span className="text-ink">{t.s04.partner}</span>
          <span className="text-ink-faint">›</span>
        </button>
        <button
          onClick={() => setStep('s05')}
          className="flex items-center justify-between bg-surface border border-ink/10 rounded-xl px-5 py-3.5"
        >
          <span className="text-ink">{t.s04.colleague}</span>
          <span className="text-ink-faint">›</span>
        </button>
        <button onClick={() => setStep('s05')} className="text-ink-soft text-sm underline text-center mt-2">
          {t.s04.tellMe}
        </button>
      </>,
    )
  }

  if (step === 's05') {
    return shell(
      13,
      <>
        <p className="text-ink-soft text-base italic">{t.s05.correctIntro}</p>
        <h1 className="font-display text-2xl text-ink leading-snug">{t.s05.reveal}</h1>
        <p className="text-ink-soft text-base leading-relaxed">{t.s05.main}</p>
        <p className="text-ink-soft text-base leading-relaxed">{t.s05.main2}</p>
        <div className="bg-surface border border-ink/10 rounded-2xl p-4">
          <p className="text-ink text-base leading-relaxed italic">{t.s05.interpretation}</p>
        </div>

        {showSources && (
          <div className="bg-surface/60 rounded-xl p-4 text-xs text-ink-faint flex flex-col gap-1">
            <p>{t.sourcesLabel}:</p>
            <a className="underline" href="https://www.dollyparton.com/news/dolly-leaves-porter-wagoner-show" target="_blank" rel="noreferrer">dollyparton.com</a>
            <a className="underline" href="https://www.whitneyhouston.com/hu/news/whitney-houston-i-will-always-love-you-1-this-day-in-1992/" target="_blank" rel="noreferrer">whitneyhouston.com</a>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={() => setStep('s07')}
            className="bg-terracotta text-surface rounded-xl px-6 py-3.5 text-base font-medium"
          >
            {t.s05.keepStory}
          </button>
          <button
            onClick={() => setStep('s06')}
            className="border border-terracotta-deep text-terracotta-deep rounded-xl px-6 py-3 text-base font-medium"
          >
            {t.s05.replay}
          </button>
          <div className="flex gap-3 justify-center text-sm">
            <button onClick={contribute} className="text-ink-soft underline">
              {t.contribute}
            </button>
            <button onClick={() => setShowSources((v) => !v)} className="text-ink-soft underline">
              {t.s05.source}
            </button>
          </div>
        </div>
      </>,
    )
  }

  if (step === 's06') {
    return shell(
      13,
      <>
        <h1 className="font-display text-2xl text-ink leading-snug">{t.s06.title}</h1>
        <p className="text-ink-soft text-base">{t.s06.subtitle}</p>
        <div className="flex flex-col gap-3">
          <p className="text-ink-faint text-xs uppercase tracking-wide">{t.s06.listenWhitney}</p>
          <Player videoId={WHITNEY_VIDEO_ID} playLabel={t.s03.play} pauseLabel={t.s03.pause} />
          <p className="text-ink-faint text-xs uppercase tracking-wide mt-2">{t.s06.listenDolly}</p>
          <Player videoId={DOLLY_VIDEO_ID} playLabel={t.s03.play} pauseLabel={t.s03.pause} />
        </div>
        <button
          onClick={() => setStep('s07')}
          className="bg-terracotta text-surface rounded-xl px-6 py-3.5 text-base font-medium mt-2"
        >
          {t.s06.continueBtn}
        </button>
      </>,
    )
  }

  // s07 — discovery close
  return shell(
    13,
    <>
      <h1 className="font-display text-2xl text-ink leading-snug">{t.s07.title}</h1>
      <p className="text-ink-soft text-base">{t.s07.subtitle}</p>
      <button
        onClick={() => goTo('home')}
        className="bg-terracotta text-surface rounded-xl px-6 py-3.5 text-base font-medium mt-2"
      >
        {t.s07.home}
      </button>
      <button onClick={() => setStep('s06')} className="text-ink-soft text-sm underline text-center">
        {t.s07.replay}
      </button>
      <button onClick={contribute} className="border border-terracotta-deep text-terracotta-deep rounded-xl px-6 py-3 text-base font-medium">
        🎙 {t.contribute}
      </button>
    </>,
  )
}
