import { useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import DirectorAvatar from './DirectorAvatar'
import TypewriterText from './TypewriterText'
import VoiceButton from './VoiceButton'
import ScreenBadge from './ScreenBadge'

export default function ConversationScreen() {
  const [draft, setDraft] = useState('')
  const [showTextFallback, setShowTextFallback] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
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
    reset,
  } = useGameStore()
  const strings = getStrings(profile.language).conversation

  const hasSeniorReply = turns.some((turn) => turn.role === 'senior')
  const handleSwitchTopic = hasSeniorReply ? finalizeChapter : reset

  // One current card, not a growing transcript: the latest thing the
  // Director actually said, plus — only while waiting on a reply — her
  // own just-sent message as a small compact note. Everything before
  // that stays out of view until she explicitly asks to see it.
  const lastTurn = turns[turns.length - 1]
  const latestDirectorTurn = [...turns].reverse().find((turn) => turn.role === 'director')
  const pendingSeniorTurn = lastTurn?.role === 'senior' ? lastTurn : null
  const priorTurns = latestDirectorTurn
    ? turns.slice(0, turns.lastIndexOf(latestDirectorTurn))
    : turns.slice(0, Math.max(turns.length - 1, 0))

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col">
      <ScreenBadge n={8} />
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-md mx-auto flex flex-col gap-4">
          <div className="flex justify-center">
            <DirectorAvatar size="small" />
          </div>

          {priorTurns.length > 0 && (
            <div className="self-center">
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="text-ink-soft text-sm underline"
              >
                {showHistory ? strings.hideHistory : strings.showHistory}
              </button>
            </div>
          )}

          {showHistory && priorTurns.length > 0 && (
            <div className="max-h-64 overflow-y-auto flex flex-col gap-3 border border-ink/10 rounded-2xl p-4 bg-surface/60">
              {priorTurns.map((turn) =>
                turn.role === 'director' ? (
                  <p key={turn.id} className="text-ink-soft text-base leading-relaxed">
                    {turn.content}
                  </p>
                ) : (
                  <p key={turn.id} className="text-ink text-base leading-relaxed font-medium">
                    {turn.content}
                  </p>
                ),
              )}
            </div>
          )}

          {latestDirectorTurn && (
            <div
              key={latestDirectorTurn.id}
              className="bg-surface rounded-2xl rounded-tl-sm px-5 py-5 shadow-sm"
            >
              <TypewriterText
                key={latestDirectorTurn.id}
                text={latestDirectorTurn.content}
                className="font-display text-xl text-ink leading-relaxed"
              />
            </div>
          )}

          {pendingSeniorTurn && (
            <p className="self-end max-w-[85%] text-ink-soft text-base italic px-2">{pendingSeniorTurn.content}</p>
          )}

          {confirmedContext.length > 0 && (
            <div className="self-start max-w-[90%] bg-gold/25 border border-gold/40 rounded-xl px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-terracotta-deep font-semibold mb-1">
                {strings.confirmed}
              </p>
              <p className="text-base text-ink-soft">{confirmedContext[confirmedContext.length - 1].text}</p>
            </div>
          )}

          {isThinking && <p className="text-ink-soft italic text-lg self-start">{strings.thinking}</p>}

          {lastError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center justify-between gap-3">
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

      <div className="border-t border-ink/10 bg-cream px-5 py-5">
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

            {!offeringClose && (
              <button
                onClick={handleSwitchTopic}
                disabled={isFinalizing}
                className="text-ink-soft text-sm underline disabled:opacity-50"
              >
                {isFinalizing ? strings.preparing : strings.switchTopic}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
