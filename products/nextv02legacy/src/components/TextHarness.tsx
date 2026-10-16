import { useState } from 'react'
import { useGameStore } from '../game/store'

const STARTER_TOPICS = [
  'Una nit o un dia dels seus vint anys que encara recorda perfectament',
  'Com va començar a treballar',
  'Un trasllat o un viatge important',
]

export default function TextHarness() {
  const [draft, setDraft] = useState('')
  const [topicDraft, setTopicDraft] = useState(STARTER_TOPICS[0])

  const {
    turns,
    confirmedContext,
    researchedUnconfirmed,
    pendingOfferedContext,
    activeFunction,
    offeringClose,
    isThinking,
    failedDraft,
    lastError,
    startSession,
    sendSeniorReply,
    retryLastTurn,
    reset,
  } = useGameStore()

  const started = turns.length > 0

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="flex flex-col gap-4">
          <header className="flex items-baseline justify-between">
            <h1 className="text-2xl font-semibold">Director — text harness</h1>
            <button
              onClick={reset}
              className="text-sm text-stone-500 underline"
            >
              Reset
            </button>
          </header>

          {!started && (
            <div className="flex flex-col gap-2 bg-white rounded-xl p-4 border border-stone-200">
              <label className="text-sm text-stone-600">Opening topic (stands in for the Home screen's choice)</label>
              <input
                className="border border-stone-300 rounded-lg px-3 py-2"
                value={topicDraft}
                onChange={(e) => setTopicDraft(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {STARTER_TOPICS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopicDraft(t)}
                    className="text-xs bg-stone-100 hover:bg-stone-200 rounded-full px-3 py-1"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                onClick={() => startSession(topicDraft)}
                disabled={isThinking}
                className="mt-2 bg-amber-700 text-white rounded-lg py-2 disabled:opacity-50"
              >
                {isThinking ? 'Thinking…' : 'Start session'}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {turns.map((t) => (
              <div
                key={t.id}
                className={
                  t.role === 'director'
                    ? 'self-start max-w-[85%] bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-4 py-3'
                    : 'self-end max-w-[85%] bg-amber-700 text-white rounded-2xl rounded-br-sm px-4 py-3 ml-auto'
                }
              >
                {t.content}
              </div>
            ))}
            {isThinking && <div className="text-stone-400 italic">Thinking…</div>}
          </div>

          {lastError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 flex items-center justify-between">
              <span>Couldn't reach the Director ({lastError}).</span>
              {failedDraft && (
                <button onClick={retryLastTurn} className="underline">
                  Retry
                </button>
              )}
            </div>
          )}

          {started && (
            <div className="flex flex-col gap-2">
              {offeringClose && (
                <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  The Director is offering an honest close — see the dialogue above. Keep replying if there's more to say.
                </div>
              )}
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-stone-300 rounded-lg px-3 py-2"
                  placeholder="Type her reply…"
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
                  className="bg-amber-700 text-white rounded-lg px-4 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 text-sm">
          <section className="bg-white border border-stone-200 rounded-xl p-4">
            <h2 className="font-semibold mb-2">Active function</h2>
            <p className="text-stone-600">{activeFunction ?? '—'}</p>
          </section>

          <section className="bg-white border border-stone-200 rounded-xl p-4">
            <h2 className="font-semibold mb-2">Offered context (not yet confirmed)</h2>
            {pendingOfferedContext.length === 0 && <p className="text-stone-400 italic">none</p>}
            <ul className="flex flex-col gap-2">
              {pendingOfferedContext.map((c, i) => (
                <li key={i} className="text-stone-700">
                  {c.text}
                  <div className="text-xs text-stone-400">{c.source}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white border border-emerald-200 rounded-xl p-4">
            <h2 className="font-semibold mb-2 text-emerald-700">Confirmed context — layer 2</h2>
            {confirmedContext.length === 0 && <p className="text-stone-400 italic">none yet</p>}
            <ul className="flex flex-col gap-2">
              {confirmedContext.map((c, i) => (
                <li key={i} className="text-stone-700">
                  {c.text}
                  <div className="text-xs text-stone-400">{c.source}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <h2 className="font-semibold mb-2 text-stone-500">
              Researched, unconfirmed — layer 3 (dev-only view; never shown in the real product)
            </h2>
            {researchedUnconfirmed.length === 0 && <p className="text-stone-400 italic">none</p>}
            <ul className="flex flex-col gap-2">
              {researchedUnconfirmed.map((c, i) => (
                <li key={i} className="text-stone-500">
                  {c.text}
                  <div className="text-xs text-stone-400">{c.source}</div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
