import { useState } from 'react'
import { useGameStore } from '../game/store'
import DirectorAvatar from './DirectorAvatar'
import TypewriterText from './TypewriterText'

export default function ChapterConfirmScreen() {
  const [correctionDraft, setCorrectionDraft] = useState('')
  const [showCorrection, setShowCorrection] = useState(false)
  const { chapterDraft, isFinalizing, isConfirming, lastError, confirmChapter, requestCorrection } =
    useGameStore()

  if (!chapterDraft) {
    return (
      <div className="min-h-screen bg-cream-deep flex items-center justify-center px-6">
        <p className="text-ink-soft text-lg">Preparant el capítol…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <DirectorAvatar size="hero" />
          <p className="text-center text-ink-soft text-base">Això és el que hem fet amb el que m'has explicat</p>
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-sm flex flex-col gap-4">
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

        {lastError && <p className="text-red-800 text-base">No he pogut desar-ho ({lastError}).</p>}

        {!showCorrection ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={confirmChapter}
              disabled={isConfirming}
              className="bg-terracotta text-surface rounded-xl py-4 text-lg font-medium disabled:opacity-50"
            >
              {isConfirming ? 'Desant…' : "Sí, així és"}
            </button>
            <button
              onClick={() => setShowCorrection(true)}
              className="text-ink-soft text-base underline"
            >
              No és del tot així
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              className="border border-ink/20 rounded-xl px-4 py-3 text-lg bg-surface min-h-[100px]"
              placeholder="Què hauríem de canviar?"
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
              {isFinalizing ? 'Refent-ho…' : 'Torna-ho a fer'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
