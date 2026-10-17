import { useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import DirectorAvatar from './DirectorAvatar'
import TypewriterText from './TypewriterText'
import ScreenBadge from './ScreenBadge'

export default function ChapterConfirmScreen() {
  const [correctionDraft, setCorrectionDraft] = useState('')
  const [showCorrection, setShowCorrection] = useState(false)
  const { profile, chapterDraft, isFinalizing, isConfirming, lastError, confirmChapter, requestCorrection } =
    useGameStore()
  const t = getStrings(profile.language).chapterConfirm

  if (!chapterDraft) {
    return (
      <div className="min-h-screen bg-cream-deep flex items-center justify-center px-6">
        <ScreenBadge n={9} />
        <p className="text-ink-soft text-lg">{t.preparing}</p>
      </div>
    )
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

        {lastError && <p className="text-red-800 text-base">{t.saveError(lastError)}</p>}

        {!showCorrection ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={confirmChapter}
              disabled={isConfirming}
              className="bg-terracotta text-surface rounded-xl py-4 text-lg font-medium disabled:opacity-50"
            >
              {isConfirming ? t.saving : t.yesThatsRight}
            </button>
            <button
              onClick={() => setShowCorrection(true)}
              className="text-ink-soft text-base underline bg-surface/70 backdrop-blur-md rounded-full py-2"
            >
              {t.notQuiteRight}
            </button>
          </div>
        ) : (
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
                setShowCorrection(false)
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
