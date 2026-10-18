import { useEffect, useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import { requestChapterLibrary } from '../game/directorClient'
import { useVoiceToText } from '../game/useVoiceToText'
import ScreenBadge from './ScreenBadge'
import type { MemoryChapter } from '../game/types'

export default function ConversationEntryScreen() {
  const { profile, startSession, openCategoryBrowser, goTo, resumeChapterId, resumeExcerpt, openLibraryChapter } =
    useGameStore()
  const t = getStrings(profile.language).conversationEntry
  const [draft, setDraft] = useState('')
  const [recent, setRecent] = useState<MemoryChapter[]>([])
  const resuming = Boolean(resumeChapterId)

  const { state: recorderState, startRecording, stopRecording } = useVoiceToText(profile.language, (text) =>
    setDraft((prev) => (prev ? `${prev} ${text}` : text)),
  )

  useEffect(() => {
    if (resuming) return
    requestChapterLibrary().then((chapters) => setRecent(chapters.slice(0, 2)))
  }, [resuming])

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col px-6 py-10">
      <ScreenBadge n={5} />
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6 flex-1">
        <button
          onClick={() => (resuming && resumeChapterId ? openLibraryChapter(resumeChapterId) : goTo('home'))}
          className="self-start text-ink-soft text-sm underline"
        >
          {resuming ? t.resumeBack : t.backHome}
        </button>

        <h1 className="fade-in-up font-display text-2xl text-ink">{resuming ? t.resumePrompt : t.prompt}</h1>

        {resuming && resumeExcerpt && (
          <div className="fade-in-up bg-surface border border-ink/10 rounded-2xl p-4">
            <p className="text-ink-soft text-sm leading-relaxed line-clamp-4">{resumeExcerpt}</p>
            <p className="text-ink-faint text-xs mt-2">{t.resumeHint}</p>
          </div>
        )}

        {!resuming && recent.length > 0 && (
          <div className="fade-in-up flex flex-col gap-2">
            <p className="text-ink-soft text-sm">{t.recentLabel}</p>
            <div className="flex flex-wrap gap-2">
              {recent.map((chapter) => (
                <span key={chapter.id} className="bg-surface border border-ink/10 rounded-full px-3 py-1.5 text-sm text-ink">
                  {chapter.title}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="fade-in-up-delayed flex flex-col gap-4 mt-auto">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.placeholder}
            rows={4}
            className="w-full bg-surface border border-ink/10 rounded-2xl px-5 py-4 text-lg text-ink resize-none"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={recorderState === 'recording' ? stopRecording : startRecording}
              disabled={recorderState === 'transcribing'}
              className={
                recorderState === 'recording'
                  ? 'w-14 h-14 shrink-0 rounded-full bg-terracotta-deep text-surface flex items-center justify-center animate-pulse'
                  : 'w-14 h-14 shrink-0 rounded-full bg-terracotta text-surface flex items-center justify-center disabled:opacity-50'
              }
              aria-label="voice"
            >
              <span className="text-xl">{recorderState === 'recording' ? '■' : '🎙'}</span>
            </button>
            <button
              onClick={() => draft.trim() && startSession(draft.trim())}
              disabled={!draft.trim()}
              className="flex-1 bg-terracotta text-surface rounded-xl py-4 text-lg font-medium disabled:opacity-50"
            >
              {t.send}
            </button>
          </div>

          {!resuming && (
            <button onClick={openCategoryBrowser} className="text-ink-soft text-base underline text-center">
              {t.escape}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
