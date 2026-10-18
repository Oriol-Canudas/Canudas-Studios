import { useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import DirectorAvatar from './DirectorAvatar'
import TypewriterText from './TypewriterText'
import ScreenBadge from './ScreenBadge'

// P03 — story review. Three distinct paths, matching the approved copy
// exactly: Guardar al meu llibre (save as-is), Editar el text (direct
// inline edit — title and body are hers to change, not just describable
// to the AI), and Un altre dia (leave the draft unconfirmed, come back
// later). "No és del tot així" stays as a fourth option: a described
// correction the AI redrafts from, for when she doesn't want to edit the
// wording herself.
export default function ChapterConfirmScreen() {
  const [correctionDraft, setCorrectionDraft] = useState('')
  const [mode, setMode] = useState<'review' | 'correcting' | 'editing'>('review')
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const {
    profile,
    chapterDraft,
    isFinalizing,
    isConfirming,
    lastError,
    confirmChapter,
    requestCorrection,
    updateChapterDraft,
    reset,
  } = useGameStore()
  const t = getStrings(profile.language).chapterConfirm

  if (!chapterDraft) {
    return (
      <div className="min-h-screen bg-cream-deep flex items-center justify-center px-6">
        <ScreenBadge n={9} />
        <p className="text-ink-soft text-lg">{t.preparing}</p>
      </div>
    )
  }

  function startEditing() {
    setEditTitle(chapterDraft!.title)
    setEditBody(chapterDraft!.testimonyText)
    setMode('editing')
  }

  function saveEdits() {
    updateChapterDraft({ title: editTitle.trim() || chapterDraft!.title, testimonyText: editBody.trim() || chapterDraft!.testimonyText })
    setMode('review')
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10 relative">
      <ScreenBadge n={9} />
      <div className="fixed inset-0 -z-10">
        <img src="/director.jpg" alt="" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-cream-deep/60" />
      </div>

      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <DirectorAvatar size="hero" />
          <p className="text-center text-ink-soft text-base bg-surface/70 backdrop-blur-md rounded-full px-4 py-1">
            {t.intro}
          </p>
        </div>

        {mode === 'editing' ? (
          <div className="bg-surface/90 backdrop-blur-md rounded-2xl p-6 shadow-sm flex flex-col gap-3">
            <label className="text-xs uppercase tracking-wide text-ink-faint font-semibold">{t.titleLabel}</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="font-display text-xl text-ink border border-ink/15 rounded-xl px-4 py-2.5 bg-surface"
            />
            <label className="text-xs uppercase tracking-wide text-ink-faint font-semibold mt-2">{t.bodyLabel}</label>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={10}
              className="text-lg text-ink leading-relaxed border border-ink/15 rounded-xl px-4 py-3 bg-surface resize-none"
            />
            <button onClick={saveEdits} className="bg-terracotta text-surface rounded-xl py-3 text-lg font-medium mt-2">
              {t.saveEdits}
            </button>
          </div>
        ) : (
          <div className="bg-surface/85 backdrop-blur-md rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <TypewriterText
              key={`${chapterDraft.id}-title`}
              text={chapterDraft.title}
              className="font-display text-2xl text-ink leading-snug"
            />
            <TypewriterText
              key={`${chapterDraft.id}-body`}
              text={chapterDraft.testimonyText}
              className="text-lg text-ink leading-relaxed"
            />
          </div>
        )}

        {lastError && <p className="text-red-800 text-base">{t.saveError(lastError)}</p>}

        {mode === 'review' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={confirmChapter}
              disabled={isConfirming}
              className="bg-terracotta text-surface rounded-xl py-4 text-lg font-medium disabled:opacity-50"
            >
              {isConfirming ? t.saving : t.yesThatsRight}
            </button>
            <button
              onClick={startEditing}
              className="text-ink-soft text-base underline bg-surface/70 backdrop-blur-md rounded-full py-2"
            >
              {t.editText}
            </button>
            <button
              onClick={() => setMode('correcting')}
              className="text-ink-soft text-base underline bg-surface/70 backdrop-blur-md rounded-full py-2"
            >
              {t.notQuiteRight}
            </button>
            <button onClick={reset} className="text-ink-faint text-sm underline text-center">
              {t.anotherDay}
            </button>
          </div>
        )}

        {mode === 'correcting' && (
          <div className="flex flex-col gap-3">
            <textarea
              className="border border-ink/20 rounded-xl px-4 py-3 text-lg bg-surface min-h-[100px]"
              placeholder={t.correctionPlaceholder}
              value={correctionDraft}
              onChange={(e) => setCorrectionDraft(e.target.value)}
            />
            <button
              onClick={() => {
                requestCorrection(correctionDraft.trim())
                setCorrectionDraft('')
                setMode('review')
              }}
              disabled={!correctionDraft.trim() || isFinalizing}
              className="bg-terracotta-deep text-surface rounded-xl py-3 text-lg font-medium disabled:opacity-50"
            >
              {isFinalizing ? t.redoing : t.redo}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
