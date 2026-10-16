import { useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import DirectorAvatar from './DirectorAvatar'
import TypewriterText from './TypewriterText'
import VoiceButton from './VoiceButton'

export default function ConversationScreen() {
  const [draft, setDraft] = useState('')
  const [showTextFallback, setShowTextFallback] = useState(false)
  const {
    profile,
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
  const strings = getStrings(profile.language).conversation

  // The closing offer is a mood shift — a different full-screen image
  // marks it, instead of the same portrait sitting behind every turn.
  const backgroundImage = offeringClose ? '/landing-memory.jpg' : '/director.jpg'

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed inset-0 -z-10">
        <img src={backgroundImage} alt="" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-cream-deep/55" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-8">
        <div className="max-w-md mx-auto flex flex-col gap-4">
          {turns.map((turn) =>
            turn.role === 'director' ? (
              <div
                key={turn.id}
                className="self-start max-w-[90%] flex items-start gap-3 bg-surface/80 backdrop-blur-md rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm"
              >
                <DirectorAvatar size="small" />
                <TypewriterText
                  text={turn.content}
                  className="font-display text-lg text-ink leading-relaxed"
                />
              </div>
            ) : (
              <div
                key={turn.id}
                className="self-end max-w-[85%] ml-auto bg-terracotta/90 backdrop-blur-md text-surface rounded-2xl rounded-br-sm px-5 py-4"
              >
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{turn.content}</p>
              </div>
            ),
          )}

          {confirmedContext.length > 0 && (
            <div className="self-start max-w-[90%] bg-gold/25 backdrop-blur-md border border-gold/40 rounded-xl px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-terracotta-deep font-semibold mb-1">
                {strings.confirmed}
              </p>
              <p className="text-base text-ink-soft">{confirmedContext[confirmedContext.length - 1].text}</p>
            </div>
          )}

          {isThinking && (
            <p className="text-ink-soft italic text-lg bg-surface/70 backdrop-blur-md rounded-xl px-4 py-2 self-start">
              {strings.thinking}
            </p>
          )}

          {lastError && (
            <div className="bg-red-50/90 backdrop-blur-md border border-red-200 text-red-800 rounded-xl p-4 flex items-center justify-between gap-3">
              <span>{strings.connectError(lastError)}</span>
              {failedDraft && (
                <button onClick={retryLastTurn} className="underline whitespace-nowrap">
                  {strings.retry}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-ink/10 bg-cream/85 backdrop-blur-md px-5 py-5">
        <div className="max-w-md mx-auto flex flex-col gap-3">
          {offeringClose && (
            <div className="flex flex-col gap-2">
              <p className="text-ink-soft text-base">{strings.closeOffer}</p>
              <button
                onClick={finalizeChapter}
                disabled={isFinalizing}
                className="bg-terracotta-deep text-surface rounded-xl py-3 text-lg font-medium disabled:opacity-50"
              >
                {isFinalizing ? strings.preparing : strings.enoughToday}
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
                {strings.preferToWrite}
              </button>
            ) : (
              <div className="w-full flex gap-2">
                <input
                  className="flex-1 border border-ink/20 rounded-xl px-4 py-3 text-lg bg-surface"
                  placeholder={strings.placeholder}
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
                  {strings.send}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
