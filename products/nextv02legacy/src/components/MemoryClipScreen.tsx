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
import type { ChapterClip, ClipSlide, ClipRepresentation, ClipPeopleDetails } from '../game/types'
import ClipPlayer from './ClipPlayer'
import ScreenBadge from './ScreenBadge'

type Step =
  | 'loading'
  | 'm01'
  | 'm01b'
  | 'm01c'
  | 'm02'
  | 'm03'
  | 'm04'
  | 'm05'
  | 'm05preview'
  | 'm06'
  | 'regenerateConfirm'

// M01-M06 — the memory-clip create/review/share flow. Three-layer
// architecture: this component (deterministic app logic) owns every
// screen transition and every consequential action (save, share,
// revoke, regenerate); the AI only ever returns slide content through
// chapter-clip.ts/clip-manage.ts, never a navigation decision.
//
// "Donem forma al teu record" (m01b/m01c) sits between the ask-first
// step (m01) and generation — a creative choice about HOW to evoke the
// memory, never a mandatory personal-information questionnaire: the
// atmosphere path (and "Prefereixo no concretar-ho" inside the people
// path) both generate immediately with no further questions.
export default function MemoryClipScreen() {
  const { profile, memoryClipChapter, openLibraryChapter, goTo, startResumeStory } = useGameStore()
  const t = getStrings(profile.language).memoryClip
  const [step, setStep] = useState<Step>('loading')
  const [clip, setClip] = useState<ChapterClip | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Representation choice — preserved across back-navigation inside this
  // screen (it's just component state, never reset by a "back" tap), and
  // remembered as the starting point for an explicit "create another
  // version."
  const [peopleWho, setPeopleWho] = useState('')
  const [peopleAge, setPeopleAge] = useState('')
  const [peopleDepiction, setPeopleDepiction] = useState('')
  const [lastRepresentation, setLastRepresentation] = useState<ClipRepresentation>('atmosphere')
  const [lastPeopleDetails, setLastPeopleDetails] = useState<ClipPeopleDetails | null>(null)
  const [pendingRegenerate, setPendingRegenerate] = useState(false)

  const [editTitle, setEditTitle] = useState('')
  const [editSlides, setEditSlides] = useState<ClipSlide[]>([])
  const [rerollingIndex, setRerollingIndex] = useState<number | null>(null)
  const [reasonSlideIndex, setReasonSlideIndex] = useState<number | null>(null)
  const [reasonText, setReasonText] = useState('')

  const [shareState, setShareState] = useState<'idle' | 'consenting' | 'busy'>('idle')
  const [authorName, setAuthorName] = useState('')
  const [shareError, setShareError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [manageLinkOpen, setManageLinkOpen] = useState(false)

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

  async function generate(representation: ClipRepresentation, peopleDetails: ClipPeopleDetails | null, regenerate: boolean) {
    setLastRepresentation(representation)
    setLastPeopleDetails(peopleDetails)
    setPendingRegenerate(false)
    setStep('m02')
    setError(null)
    try {
      const result = await requestChapterClip(chapter!.id, { representation, peopleDetails, regenerate })
      setClip(result)
      setStep('m03')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown_error')
    }
  }

  function retryGenerate() {
    generate(lastRepresentation, lastPeopleDetails, pendingRegenerate)
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

  async function rerollSlide(i: number, reason: string | null) {
    setRerollingIndex(i)
    try {
      const updated = await requestClipRerollImage(chapter!.id, i, reason)
      setClip(updated)
      setEditSlides((prev) => prev.map((s, idx) => (idx === i ? { ...s, imageUrl: updated.slides[i].imageUrl } : s)))
    } catch {
      // Reroll failing leaves the existing image in place — never a blank slide.
    } finally {
      setRerollingIndex(null)
      setReasonSlideIndex(null)
      setReasonText('')
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
      setCopied(false)
      if (clip) {
        const url = `${window.location.origin}/share/${chapter!.id}/${result.token}`
        try {
          await navigator.clipboard.writeText(url)
          setCopied(true)
        } catch {
          // Clipboard API can be unavailable — "Copiar l'enllaç" still works on tap.
        }
      }
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

  function startRegenerate() {
    if (clip?.shared) {
      setStep('regenerateConfirm')
    } else {
      setPendingRegenerate(true)
      setStep('m01b')
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
          <button onClick={() => setStep('m01b')} className="bg-terracotta text-surface rounded-xl py-3.5 text-base font-medium">
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

  if (step === 'm01b') {
    return (
      <div className="min-h-screen bg-cream-deep flex flex-col items-center justify-center px-6 gap-4">
        <ScreenBadge n={14} />
        <p className="font-display text-2xl text-ink text-center max-w-sm leading-snug">{t.m01b.title}</p>
        <p className="text-ink-soft text-base text-center max-w-sm">{t.m01b.intro}</p>
        <div className="w-full max-w-sm flex flex-col gap-3 mt-4">
          <button
            onClick={() => generate('atmosphere', null, pendingRegenerate)}
            className="flex flex-col items-start gap-1 bg-surface border border-ink/10 rounded-2xl px-5 py-4 text-left"
          >
            <span className="text-ink text-base font-medium">🌿 {t.m01b.atmosphereLabel}</span>
            <span className="text-ink-faint text-sm">{t.m01b.atmosphereHint}</span>
          </button>
          <button
            onClick={() => setStep('m01c')}
            className="flex flex-col items-start gap-1 bg-surface border border-ink/10 rounded-2xl px-5 py-4 text-left"
          >
            <span className="text-ink text-base font-medium">🧑‍🤝‍🧑 {t.m01b.peopleLabel}</span>
            <span className="text-ink-faint text-sm">{t.m01b.peopleHint}</span>
          </button>
          <div className="flex flex-col items-start gap-1 bg-surface/50 border border-ink/10 rounded-2xl px-5 py-4 text-left opacity-70">
            <span className="text-ink-soft text-base font-medium flex items-center gap-2">
              📷 {t.m01b.photoLabel}
              <span className="text-[10px] uppercase tracking-wide bg-ink/10 text-ink-faint rounded-full px-2 py-0.5">
                {t.m01b.photoBadge}
              </span>
            </span>
            <span className="text-ink-faint text-sm">{t.m01b.photoHint}</span>
          </div>
          <button onClick={() => setStep('m01')} className="text-ink-soft text-sm underline text-center mt-1">
            {t.m01b.back}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'm01c') {
    const canConfirm = peopleWho.trim().length > 0
    return (
      <div className="min-h-screen bg-cream-deep flex flex-col items-center px-6 py-10">
        <ScreenBadge n={14} />
        <div className="w-full max-w-sm flex flex-col gap-5">
          <p className="font-display text-xl text-ink leading-snug">{t.m01c.title}</p>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-ink-faint font-semibold">{t.m01c.whoLabel}</label>
            <div className="flex flex-wrap gap-2">
              {t.m01c.whoChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setPeopleWho(chip)}
                  className={`text-sm rounded-full px-3 py-1.5 border ${
                    peopleWho === chip ? 'bg-terracotta text-surface border-terracotta' : 'bg-surface text-ink-soft border-ink/15'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <input
              value={peopleWho}
              onChange={(e) => setPeopleWho(e.target.value)}
              placeholder={t.m01c.whoPlaceholder}
              className="border border-ink/15 rounded-lg px-3 py-2.5 text-base bg-surface"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-ink-faint font-semibold">{t.m01c.ageLabel}</label>
            <div className="flex flex-wrap gap-2">
              {t.m01c.ageChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setPeopleAge(chip)}
                  className={`text-sm rounded-full px-3 py-1.5 border ${
                    peopleAge === chip ? 'bg-terracotta text-surface border-terracotta' : 'bg-surface text-ink-soft border-ink/15'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-ink-faint font-semibold">{t.m01c.depictionLabel}</label>
            <div className="flex flex-wrap gap-2">
              {t.m01c.depictionChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setPeopleDepiction(chip)}
                  className={`text-sm rounded-full px-3 py-1.5 border ${
                    peopleDepiction === chip ? 'bg-terracotta text-surface border-terracotta' : 'bg-surface text-ink-soft border-ink/15'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {canConfirm && (
            <div className="bg-surface/60 border border-ink/10 rounded-xl p-4 flex flex-col gap-1">
              <p className="text-xs uppercase tracking-wide text-ink-faint font-semibold">{t.m01c.summaryTitle}</p>
              <p className="text-ink-soft text-sm">
                {t.m01c.summaryWho}: {peopleWho}
              </p>
              {peopleAge && (
                <p className="text-ink-soft text-sm">
                  {t.m01c.summaryAge}: {peopleAge}
                </p>
              )}
              {peopleDepiction && (
                <p className="text-ink-soft text-sm">
                  {t.m01c.summaryStyle}: {peopleDepiction}
                </p>
              )}
              <p className="text-ink-faint text-xs mt-1">{t.m01c.summaryNote}</p>
            </div>
          )}

          {!canConfirm && <p className="text-ink-faint text-xs">{t.m01c.requiredHint}</p>}

          <button
            onClick={() => generate('people', { who: peopleWho.trim(), approxAge: peopleAge, depiction: peopleDepiction }, pendingRegenerate)}
            disabled={!canConfirm}
            className="bg-terracotta text-surface rounded-xl py-3.5 text-base font-medium disabled:opacity-40"
          >
            {t.m01c.confirm}
          </button>
          <button onClick={() => generate('atmosphere', null, pendingRegenerate)} className="text-ink-soft text-sm underline text-center">
            {t.m01c.skip}
          </button>
          <button onClick={() => setStep('m01b')} className="text-ink-faint text-sm underline text-center">
            {t.m01b.back}
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
            <button onClick={retryGenerate} className="bg-terracotta text-surface rounded-xl py-3 text-base font-medium">
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
          <button onClick={startRegenerate} className="text-ink-faint text-sm underline text-center">
            {t.m06.createAnother}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'regenerateConfirm') {
    return (
      <div className="min-h-screen bg-cream-deep flex flex-col items-center justify-center px-6 gap-4">
        <ScreenBadge n={14} />
        <p className="font-display text-xl text-ink text-center max-w-sm leading-snug">{t.m06.createAnotherWarning}</p>
        <div className="w-full max-w-sm flex flex-col gap-3 mt-2">
          <button
            onClick={() => {
              setPendingRegenerate(true)
              setStep('m01b')
            }}
            className="bg-terracotta text-surface rounded-xl py-3.5 text-base font-medium"
          >
            {t.m06.createAnotherConfirm}
          </button>
          <button
            onClick={() => setStep(clip?.confirmed ? 'm06' : 'm04')}
            className="text-ink-soft text-sm underline text-center"
          >
            {t.m06.createAnotherCancel}
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
              <div className="flex gap-4">
                <button
                  onClick={() => rerollSlide(i, null)}
                  disabled={rerollingIndex !== null}
                  className="text-terracotta-deep text-sm underline self-start disabled:opacity-50"
                >
                  {rerollingIndex === i ? t.m05.rerolling : t.m05.rerollImage}
                </button>
                <button
                  onClick={() => {
                    setReasonSlideIndex(i)
                    setReasonText('')
                  }}
                  disabled={rerollingIndex !== null}
                  className="text-ink-faint text-sm underline self-start disabled:opacity-50"
                >
                  {t.m05.notRepresentative}
                </button>
              </div>
              {reasonSlideIndex === i && (
                <div className="flex flex-col gap-2 bg-surface border border-ink/10 rounded-xl p-3">
                  <textarea
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder={t.m05.reasonPlaceholder}
                    rows={2}
                    className="text-sm text-ink border border-ink/15 rounded-lg px-3 py-2 bg-surface resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => rerollSlide(i, reasonText.trim() || null)}
                      disabled={rerollingIndex !== null}
                      className="flex-1 bg-terracotta text-surface rounded-lg py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {t.m05.reasonConfirm}
                    </button>
                    <button
                      onClick={() => {
                        setReasonSlideIndex(null)
                        setReasonText('')
                      }}
                      className="text-ink-soft text-sm underline"
                    >
                      {t.m05.reasonCancel}
                    </button>
                  </div>
                </div>
              )}
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
    const cover = clip.slides.find((s) => s.role === 'cover') ?? clip.slides[0]
    return (
      <div className="min-h-screen bg-cream-deep flex flex-col items-center px-6 py-10 gap-5">
        <ScreenBadge n={14} />
        <div className="w-full max-w-sm flex flex-col gap-5">
          <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden">
            {cover && <img src={cover.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
            <p className="absolute bottom-4 left-4 right-4 text-surface font-display text-xl leading-snug drop-shadow-lg">
              {clip.title}
            </p>
          </div>
          <p className="font-display text-2xl text-ink text-center">{t.m06.title}</p>

          <div className="flex flex-col gap-3">
            <button onClick={() => setStep('m03')} className="bg-terracotta text-surface rounded-xl py-3.5 text-base font-medium">
              {t.m06.watchClip}
            </button>

            {clip.shared && shareUrl ? (
              <div className="flex flex-col gap-2 bg-surface border border-ink/10 rounded-xl p-4">
                <p className="text-ink text-sm font-medium">✓ {t.m06.linkReady}</p>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareUrl)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    } catch {
                      // Clipboard API can be unavailable — the link text is still selectable via "manage."
                    }
                  }}
                  className="bg-terracotta/10 text-terracotta-deep rounded-lg py-2 text-sm font-medium"
                >
                  {copied ? '✓' : t.m06.copyLink}
                </button>
                <button onClick={() => setManageLinkOpen((v) => !v)} className="text-ink-soft text-sm underline text-left">
                  {t.m06.manageLink}
                </button>
                {manageLinkOpen && (
                  <div className="flex flex-col gap-2 border-t border-ink/10 pt-2">
                    <p className="text-ink-faint text-xs break-all">{shareUrl}</p>
                    <button
                      onClick={revokeShare}
                      disabled={shareState === 'busy'}
                      className="text-red-800 text-sm underline text-left disabled:opacity-50"
                    >
                      {t.m06.revoke}
                    </button>
                  </div>
                )}
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
                className="border border-terracotta-deep text-terracotta-deep rounded-xl py-3 text-base font-medium"
              >
                {t.m06.share}
              </button>
            )}

            <button onClick={startRegenerate} className="text-ink-faint text-sm underline text-center">
              {t.m06.createAnother}
            </button>
            <button onClick={() => openLibraryChapter(chapter.id)} className="text-ink-soft text-sm underline text-center">
              {t.m06.backToBook}
            </button>
            <button onClick={() => goTo('home')} className="text-ink-faint text-sm underline text-center">
              {t.m06.backHome}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
