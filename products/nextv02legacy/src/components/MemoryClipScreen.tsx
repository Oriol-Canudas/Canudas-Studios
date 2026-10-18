import { useEffect, useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import {
  requestExistingClip,
  requestChapterClip,
  requestClipSave,
  requestClipEditText,
  requestClipRerollImage,
  requestClipShareCreate,
  requestClipShareRevoke,
} from '../game/directorClient'
import type { ChapterClip, ClipSlide } from '../game/types'
import ClipPlayer from './ClipPlayer'
import ScreenBadge from './ScreenBadge'

type Step = 'loading' | 'm01' | 'm02' | 'm03' | 'm04' | 'm05' | 'm05preview' | 'm06'

// M01-M06 — the memory-clip create/review/share flow. Three-layer
// architecture: this component (deterministic app logic) owns every
// screen transition and every consequential action (save, share,
// revoke); the AI only ever returns slide content through
// chapter-clip.ts/clip-update.ts, never a navigation decision.
export default function MemoryClipScreen() {
  const { profile, memoryClipChapter, openLibraryChapter, goTo, startResumeStory } = useGameStore()
  const t = getStrings(profile.language).memoryClip
  const [step, setStep] = useState<Step>('loading')
  const [clip, setClip] = useState<ChapterClip | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [editTitle, setEditTitle] = useState('')
  const [editSlides, setEditSlides] = useState<ClipSlide[]>([])
  const [rerollingIndex, setRerollingIndex] = useState<number | null>(null)

  const [shareState, setShareState] = useState<'idle' | 'consenting' | 'busy'>('idle')
  const [authorName, setAuthorName] = useState('')
  const [shareError, setShareError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const chapter = memoryClipChapter

  useEffect(() => {
    if (!chapter) {
      goTo('library')
      return
    }
    requestExistingClip(chapter.id).then((existing) => {
      if (existing) {
        setClip(existing)
        setStep(existing.confirmed ? 'm06' : 'm04')
      } else {
        setStep('m01')
      }
    })
    // Only on mount, keyed by the chapter this screen was opened for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter?.id])

  if (!chapter) return null

  async function generate() {
    setStep('m02')
    setError(null)
    try {
      const result = await requestChapterClip(chapter!.id)
      setClip(result)
      setStep('m03')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown_error')
    }
  }

  async function handleSave() {
    const result = await requestClipSave(chapter!.id)
    setClip(result)
    setStep('m06')
  }

  function startEditing() {
    if (!clip) return
    setEditTitle(clip.title)
    setEditSlides(clip.slides.map((s) => ({ ...s })))
    setStep('m05')
  }

  async function rerollSlide(i: number) {
    setRerollingIndex(i)
    try {
      const updated = await requestClipRerollImage(chapter!.id, i)
      setClip(updated)
      setEditSlides((prev) => prev.map((s, idx) => (idx === i ? { ...s, imageUrl: updated.slides[i].imageUrl } : s)))
    } catch {
      // Reroll failing leaves the existing image in place — never a blank slide.
    } finally {
      setRerollingIndex(null)
    }
  }

  async function finishEditing() {
    const result = await requestClipEditText(
      chapter!.id,
      editTitle,
      editSlides.map((s) => ({ caption: s.caption })),
    )
    setClip(result)
    setStep('m04')
  }

  async function createShare() {
    setShareState('busy')
    setShareError(null)
    try {
      const result = await requestClipShareCreate(chapter!.id, authorName.trim() || null)
      setClip((prev) => (prev ? { ...prev, shared: true, shareToken: result.token } : prev))
      setShareState('idle')
    } catch (e) {
      setShareError(e instanceof Error ? e.message : 'unknown_error')
      setShareState('consenting')
    }
  }

  async function revokeShare() {
    setShareState('busy')
    try {
      await requestClipShareRevoke(chapter!.id)
      setClip((prev) => (prev ? { ...prev, shared: false, shareToken: null } : prev))
    } finally {
      setShareState('idle')
    }
  }

  const shareUrl =
    clip?.shareToken && typeof window !== 'undefined' ? `${window.location.origin}/share/${chapter.id}/${clip.shareToken}` : null

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-cream-deep flex items-center justify-center">
        <ScreenBadge n={14} />
      </div>
    )
  }

  if (step === 'm01') {
    return (
      <div className="min-h-screen bg-cream-deep flex flex-col items-center justify-center px-6 gap-4">
        <ScreenBadge n={14} />
        <p className="font-display text-2xl text-ink text-center max-w-sm leading-snug">{t.m01.title}</p>
        <div className="w-full max-w-sm flex flex-col gap-3 mt-4">
          <button onClick={generate} className="bg-terracotta text-surface rounded-xl py-3.5 text-base font-medium">
            {t.m01.create}
          </button>
          <button
            onClick={() => startResumeStory(chapter.id, chapter.testimonyText)}
            className="text-ink-soft text-sm underline text-center"
          >
            {t.m01.addMore}
          </button>
          <button onClick={() => openLibraryChapter(chapter.id)} className="text-ink-faint text-sm underline text-center">
            {t.m01.anotherDay}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'm02') {
    return (
      <div className="min-h-screen bg-cream-deep flex flex-col items-center justify-center px-6 gap-4">
        <ScreenBadge n={14} />
        {!error ? (
          <p className="text-ink-soft text-lg">{t.m02.preparing}</p>
        ) : (
          <div className="w-full max-w-sm flex flex-col gap-3 text-center">
            <p className="text-red-800 text-base">{t.m02.failed}</p>
            <button onClick={generate} className="bg-terracotta text-surface rounded-xl py-3 text-base font-medium">
              {t.m02.retry}
            </button>
            <button onClick={() => openLibraryChapter(chapter.id)} className="text-ink-soft text-sm underline">
              {t.m02.backToBook}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (step === 'm03' && clip) {
    return <ClipPlayer title={clip.title} slides={clip.slides} language={profile.language} onClose={() => setStep('m04')} />
  }

  if (step === 'm05preview') {
    return (
      <ClipPlayer
        title={editTitle}
        slides={editSlides}
        language={profile.language}
        onClose={() => setStep('m05')}
      />
    )
  }

  if (step === 'm04' && clip) {
    return (
      <div className="min-h-screen bg-cream-deep flex flex-col items-center justify-center px-6 gap-4">
        <ScreenBadge n={14} />
        <p className="font-display text-2xl text-ink text-center">{t.m04.title}</p>
        <div className="w-full max-w-sm flex flex-col gap-3 mt-4">
          <button onClick={handleSave} className="bg-terracotta text-surface rounded-xl py-3.5 text-base font-medium">
            {t.m04.save}
          </button>
          <button onClick={startEditing} className="border border-terracotta-deep text-terracotta-deep rounded-xl py-3 text-base font-medium">
            {t.m04.changeSomething}
          </button>
          <button onClick={() => setStep('m03')} className="text-ink-soft text-sm underline text-center">
            {t.m04.watchAgain}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'm05') {
    return (
      <div className="min-h-screen bg-cream-deep flex flex-col items-center px-6 py-10">
        <ScreenBadge n={14} />
        <div className="w-full max-w-sm flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-ink-faint font-semibold">{t.m05.titleLabel}</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="font-display text-xl text-ink border border-ink/15 rounded-xl px-4 py-2.5 bg-surface"
            />
          </div>

          {editSlides.map((slide, i) => (
            <div key={i} className="flex flex-col gap-2 border border-ink/10 rounded-2xl p-4 bg-surface/60">
              <label className="text-xs uppercase tracking-wide text-ink-faint font-semibold">{t.m05.sceneLabel(i + 1)}</label>
              <img src={slide.imageUrl} alt="" className="w-full h-32 object-cover rounded-xl" />
              <textarea
                value={slide.caption}
                onChange={(e) =>
                  setEditSlides((prev) => prev.map((s, idx) => (idx === i ? { ...s, caption: e.target.value } : s)))
                }
                rows={2}
                className="text-base text-ink border border-ink/15 rounded-xl px-3 py-2 bg-surface resize-none"
              />
              <button
                onClick={() => rerollSlide(i)}
                disabled={rerollingIndex !== null}
                className="text-terracotta-deep text-sm underline self-start disabled:opacity-50"
              >
                {rerollingIndex === i ? t.m05.rerolling : t.m05.rerollImage}
              </button>
            </div>
          ))}

          <button
            onClick={() => setStep('m05preview')}
            className="border border-terracotta-deep text-terracotta-deep rounded-xl py-3 text-base font-medium"
          >
            {t.m05.preview}
          </button>
          <button onClick={finishEditing} className="bg-terracotta text-surface rounded-xl py-3.5 text-base font-medium">
            {t.m05.done}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'm06' && clip) {
    return (
      <div className="min-h-screen bg-cream-deep flex flex-col items-center justify-center px-6 gap-4">
        <ScreenBadge n={14} />
        <p className="font-display text-2xl text-ink text-center">{t.m06.title}</p>

        <div className="w-full max-w-sm flex flex-col gap-3 mt-2">
          {clip.shared && shareUrl ? (
            <div className="flex flex-col gap-2 bg-surface border border-ink/10 rounded-xl p-4">
              <p className="text-ink-soft text-sm break-all">{shareUrl}</p>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  } catch {
                    // Clipboard API can be unavailable — the link text is still selectable.
                  }
                }}
                className="text-terracotta-deep text-sm underline text-left"
              >
                {copied ? '✓' : t.m06.copyLink}
              </button>
              <button
                onClick={revokeShare}
                disabled={shareState === 'busy'}
                className="text-red-800 text-sm underline text-left disabled:opacity-50"
              >
                {t.m06.revoke}
              </button>
            </div>
          ) : shareState === 'consenting' ? (
            <div className="flex flex-col gap-3 bg-surface border border-ink/10 rounded-xl p-4">
              <p className="text-ink-soft text-sm">{t.m06.shareWarning}</p>
              {shareError && <p className="text-red-800 text-sm">{shareError}</p>}
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={t.m06.authorNameLabel}
                className="border border-ink/15 rounded-lg px-3 py-2 text-base bg-surface"
              />
              <button
                onClick={createShare}
                disabled={shareState !== 'consenting'}
                className="bg-terracotta text-surface rounded-xl py-2.5 text-base font-medium"
              >
                {t.m06.createLink}
              </button>
              <button onClick={() => setShareState('idle')} className="text-ink-soft text-sm underline">
                {t.m06.cancel}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShareState('consenting')}
              className="bg-terracotta text-surface rounded-xl py-3.5 text-base font-medium"
            >
              {t.m06.share}
            </button>
          )}

          <button onClick={() => openLibraryChapter(chapter.id)} className="text-ink-soft text-sm underline text-center">
            {t.m06.backToBook}
          </button>
          <button onClick={() => goTo('home')} className="text-ink-faint text-sm underline text-center">
            {t.m06.backHome}
          </button>
        </div>
      </div>
    )
  }

  return null
}
