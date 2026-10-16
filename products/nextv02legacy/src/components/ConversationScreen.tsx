import { useState } from 'react'
import { useGameStore } from '../game/store'
import DirectorAvatar from './DirectorAvatar'
import TypewriterText from './TypewriterText'
import VoiceButton from './VoiceButton'

export default function ConversationScreen() {
  const [draft, setDraft] = useState('')
  const [showTextFallback, setShowTextFallback] = useState(false)
  const {
    turns,
    confirmedContext,
    isThinking,
    failedDraft,
    lastError,
    offeringClose,
    sendSeniorReply,
    retryLastTurn,
    finalizeChapter,
    isFinalizing,
  } = useGameStore()

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-8">
        <div className="max-w-md mx-auto flex flex-col gap-4">
          <div className="flex justify-center mb-2">
            <DirectorAvatar size="hero" />
          </div>
          {turns.map((t) =>
            t.role === 'director' ? (
              <div
                key={t.id}
                className="self-start max-w-[90%] flex items-start gap-3 bg-surface rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm"
              >
                <DirectorAvatar size="small" />
                <TypewriterText
                  text={t.content}
                  className="font-display text-lg text-ink leading-relaxed"
                />
              </div>
            ) : (
              <div
                key={t.id}
                className="self-end max-w-[85%] ml-auto bg-terracotta text-surface rounded-2xl rounded-br-sm px-5 py-4"
              >
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{t.content}</p>
              </div>
            ),
          )}

          {confirmedContext.length > 0 && (
            <div className="self-start max-w-[90%] bg-gold/15 border border-gold/40 rounded-xl px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-terracotta-deep font-semibold mb-1">
                Confirmat
              </p>
              <p className="text-base text-ink-soft">{confirmedContext[confirmedContext.length - 1].text}</p>
            </div>
          )}

          {isThinking && <p className="text-ink-soft italic text-lg">Pensant…</p>}

          {lastError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center justify-between gap-3">
              <span>No he pogut connectar ({lastError}).</span>
              {failedDraft && (
                <button onClick={retryLastTurn} className="underline whitespace-nowrap">
                  Torna-ho a provar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-ink/10 bg-cream px-5 py-5">
        <div className="max-w-md mx-auto flex flex-col gap-3">
          {offeringClose && (
            <div className="flex flex-col gap-2">
              <p className="text-ink-soft text-base">
                Podem deixar-ho aquí per avui, o si hi ha més — t'escolto.
              </p>
              <button
                onClick={finalizeChapter}
                disabled={isFinalizing}
                className="bg-terracotta-deep text-surface rounded-xl py-3 text-lg font-medium disabled:opacity-50"
              >
                {isFinalizing ? 'Preparant…' : 'Prou per avui'}
              </button>
            </div>
          )}
          <div className="flex flex-col items-center gap-3">
            <VoiceButton />

            {!showTextFallback ? (
              <button
                onClick={() => setShowTextFallback(true)}
                className="text-ink-soft text-sm underline"
              >
                Prefereixo escriure-ho
              </button>
            ) : (
              <div className="w-full flex gap-2">
                <input
                  className="flex-1 border border-ink/20 rounded-xl px-4 py-3 text-lg bg-surface"
                  placeholder="Escriu la teva resposta…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && draft.trim() && !isThinking) {
                      sendSeniorReply(draft.trim())
                      setDraft('')
                    }
                  }}
                />
                <button
                  disabled={!draft.trim() || isThinking}
                  onClick={() => {
                    sendSeniorReply(draft.trim())
                    setDraft('')
                  }}
                  className="bg-terracotta text-surface rounded-xl px-5 text-lg font-medium disabled:opacity-50"
                >
                  Envia
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
