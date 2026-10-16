import { useEffect, useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import { requestChapterLibrary } from '../game/directorClient'
import type { MemoryChapter } from '../game/types'

function shareChapter(chapter: MemoryChapter, shareLabel: string) {
  const text = `${chapter.title}\n\n${chapter.testimonyText}`

  if (navigator.share) {
    navigator.share({ title: chapter.title, text }).catch(() => {
      // Cancelled or unsupported mid-call — fall through to the wa.me link.
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    })
    return
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  void shareLabel
}

export default function LibraryScreen() {
  const { profile, goTo } = useGameStore()
  const t = getStrings(profile.language).library
  const [chapters, setChapters] = useState<MemoryChapter[] | null>(null)
  const [opened, setOpened] = useState<MemoryChapter | null>(null)

  useEffect(() => {
    requestChapterLibrary().then(setChapters)
  }, [])

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center px-5 py-8">
      <div className="w-full max-w-md flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-ink">{t.title}</h1>
          <button onClick={() => goTo('home')} className="text-ink-soft text-sm underline">
            {t.backHome}
          </button>
        </header>

        {chapters === null && <p className="text-ink-soft text-lg">…</p>}

        {chapters?.length === 0 && <p className="text-ink-soft text-lg">{t.empty}</p>}

        <div className="grid grid-cols-2 gap-4">
          {chapters?.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => setOpened(chapter)}
              className="relative aspect-square rounded-2xl overflow-hidden shadow-sm bg-surface text-left"
            >
              {chapter.illustrationUrl ? (
                <img src={chapter.illustrationUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <img
                  src="/director.jpg"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <p className="absolute bottom-2 left-2 right-2 text-surface font-display text-sm leading-snug">
                {chapter.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {opened && (
        <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-ink/60 px-4 py-6">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-surface rounded-2xl shadow-lg flex flex-col">
            {opened.illustrationUrl && (
              <img src={opened.illustrationUrl} alt="" className="w-full h-56 object-cover rounded-t-2xl" />
            )}
            <div className="p-6 flex flex-col gap-4">
              <h2 className="font-display text-2xl text-ink leading-snug">{opened.title}</h2>
              <p className="text-lg text-ink leading-relaxed whitespace-pre-wrap">{opened.testimonyText}</p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => shareChapter(opened, t.share)}
                  className="flex-1 bg-terracotta text-surface rounded-xl py-3 text-lg font-medium"
                >
                  {t.share}
                </button>
                <button
                  onClick={() => setOpened(null)}
                  className="px-5 border border-ink/20 rounded-xl py-3 text-lg text-ink-soft"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
