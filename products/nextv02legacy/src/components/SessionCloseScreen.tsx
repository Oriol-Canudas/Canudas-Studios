import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import DirectorAvatar from './DirectorAvatar'
import TypewriterText from './TypewriterText'
import ScreenBadge from './ScreenBadge'

export default function SessionCloseScreen() {
  const { profile, reset, chapterDraft, openLibraryChapter } = useGameStore()
  const t = getStrings(profile.language).sessionClose
  const closingLine = t.closingLine(profile.preferredName)
  const savedChapterId = chapterDraft?.id

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center justify-center px-6 text-center gap-6">
      <ScreenBadge n={10} />
      <DirectorAvatar size="hero" />
      <TypewriterText
        text={closingLine}
        className="font-display text-2xl text-ink leading-snug max-w-sm"
      />
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {savedChapterId && (
          <button
            onClick={() => openLibraryChapter(savedChapterId)}
            className="bg-terracotta text-surface rounded-xl px-6 py-3 text-lg font-medium"
          >
            {t.viewBook}
          </button>
        )}
        <button
          onClick={reset}
          className={
            savedChapterId
              ? 'text-ink-soft text-base underline'
              : 'bg-terracotta text-surface rounded-xl px-6 py-3 text-lg font-medium'
          }
        >
          {t.backHome}
        </button>
      </div>
    </div>
  )
}
