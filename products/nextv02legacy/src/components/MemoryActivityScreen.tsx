import { useReducer, useRef } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import { useVoiceToText } from '../game/useVoiceToText'
import TypographicMemoryCard from './TypographicMemoryCard'
import {
  STARTER_OPTIONS,
  localize,
  getStep2Prompt,
  getGenericDetailPrompt,
  type MemoryStarterId,
} from '../game/memoryTemplate'
import { requestMemoryInterpret, requestMemoryDraft, requestMemoryRevise, requestMemorySave } from '../game/directorClient'

// The "Un petit record" template: the APP (this reducer) owns the step
// sequence, navigation, and what can happen next; the TEMPLATE
// (memoryTemplate.ts) owns the authored prompts and starter options; the
// bounded AI calls (api/memory-draft.ts) only ever return {title, body}
// or {sufficient, clarificationPrompt} — never a screen or a save verdict.

type Step = 'choose' | 'provide' | 'detail' | 'creatingDraft' | 'preview' | 'saving' | 'result'

interface State {
  step: Step
  starterId: MemoryStarterId | null
  rawText: string
  detail: string
  clarificationPrompt: string | null
  draftTitle: string
  draftBody: string
  draftError: string | null
  saveError: string | null
  editing: boolean
  revising: boolean
  reviseText: string
  savedId: string | null
}

type Action =
  | { type: 'CHOOSE_STARTER'; id: MemoryStarterId }
  | { type: 'SET_RAW_TEXT'; text: string }
  | { type: 'SUBMIT_PROVIDE_PENDING' }
  | { type: 'SUBMIT_PROVIDE_SUFFICIENT' }
  | { type: 'SUBMIT_PROVIDE_NEEDS_DETAIL'; clarification: string | null }
  | { type: 'SET_DETAIL'; text: string }
  | { type: 'SUBMIT_DETAIL' }
  | { type: 'DRAFT_SUCCESS'; title: string; body: string }
  | { type: 'DRAFT_FAILED' }
  | { type: 'START_EDIT' }
  | { type: 'SET_EDITED_TITLE'; text: string }
  | { type: 'SET_EDITED_BODY'; text: string }
  | { type: 'APPLY_DIRECT_EDIT' }
  | { type: 'START_REVISE' }
  | { type: 'SET_REVISE_TEXT'; text: string }
  | { type: 'REVISE_SUCCESS'; title: string; body: string }
  | { type: 'CANCEL_EDIT' }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS'; id: string }
  | { type: 'SAVE_FAILED' }

const initialState: State = {
  step: 'choose',
  starterId: null,
  rawText: '',
  detail: '',
  clarificationPrompt: null,
  draftTitle: '',
  draftBody: '',
  draftError: null,
  saveError: null,
  editing: false,
  revising: false,
  reviseText: '',
  savedId: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'CHOOSE_STARTER':
      return { ...state, starterId: action.id, step: 'provide' }
    case 'SET_RAW_TEXT':
      return { ...state, rawText: action.text }
    case 'SUBMIT_PROVIDE_PENDING':
      return state
    case 'SUBMIT_PROVIDE_SUFFICIENT':
      return { ...state, step: 'creatingDraft' }
    case 'SUBMIT_PROVIDE_NEEDS_DETAIL':
      return { ...state, step: 'detail', clarificationPrompt: action.clarification }
    case 'SET_DETAIL':
      return { ...state, detail: action.text }
    case 'SUBMIT_DETAIL':
      return { ...state, step: 'creatingDraft' }
    case 'DRAFT_SUCCESS':
      return { ...state, step: 'preview', draftTitle: action.title, draftBody: action.body, draftError: null }
    case 'DRAFT_FAILED':
      return { ...state, step: 'preview', draftError: 'failed' }
    case 'START_EDIT':
      return { ...state, editing: true, revising: false }
    case 'SET_EDITED_TITLE':
      return { ...state, draftTitle: action.text }
    case 'SET_EDITED_BODY':
      return { ...state, draftBody: action.text }
    case 'APPLY_DIRECT_EDIT':
      return { ...state, editing: false }
    case 'START_REVISE':
      return { ...state, revising: true }
    case 'SET_REVISE_TEXT':
      return { ...state, reviseText: action.text }
    case 'REVISE_SUCCESS':
      return { ...state, draftTitle: action.title, draftBody: action.body, revising: false, reviseText: '', editing: false }
    case 'CANCEL_EDIT':
      return { ...state, editing: false, revising: false }
    case 'SAVE_START':
      return { ...state, step: 'saving', saveError: null }
    case 'SAVE_SUCCESS':
      return { ...state, step: 'result', savedId: action.id }
    case 'SAVE_FAILED':
      return { ...state, step: 'preview', saveError: 'failed' }
    default:
      return state
  }
}

export default function MemoryActivityScreen() {
  const { profile, goTo, setLastSavedChapter, openLibraryChapter } = useGameStore()
  const t = getStrings(profile.language).memoryActivity
  const [state, dispatch] = useReducer(reducer, initialState)
  // A ref, not state — state updates aren't synchronous, so a check
  // against `state.step` inside the handler could still pass twice for
  // two taps in the same tick. This guard is checked and set immediately.
  const isSavingRef = useRef(false)

  const { state: recorderState, startRecording, stopRecording } = useVoiceToText(profile.language, (text) => {
    if (state.step === 'provide') dispatch({ type: 'SET_RAW_TEXT', text: state.rawText ? `${state.rawText} ${text}` : text })
    else if (state.step === 'detail') dispatch({ type: 'SET_DETAIL', text: state.detail ? `${state.detail} ${text}` : text })
  })

  const starterLabel = state.starterId ? localize(STARTER_OPTIONS.find((o) => o.id === state.starterId)!.label, profile.language) : ''

  async function submitProvide() {
    if (!state.rawText.trim()) return
    dispatch({ type: 'SUBMIT_PROVIDE_PENDING' })
    try {
      const result = await requestMemoryInterpret(state.rawText.trim(), starterLabel, profile.language)
      if (result.sufficient) {
        dispatch({ type: 'SUBMIT_PROVIDE_SUFFICIENT' })
        await createDraft(null)
      } else {
        dispatch({ type: 'SUBMIT_PROVIDE_NEEDS_DETAIL', clarification: result.clarificationPrompt })
      }
    } catch {
      // Interpretation is best-effort — fall back to the generic detail
      // step rather than blocking her.
      dispatch({ type: 'SUBMIT_PROVIDE_NEEDS_DETAIL', clarification: null })
    }
  }

  async function submitDetail() {
    dispatch({ type: 'SUBMIT_DETAIL' })
    await createDraft(state.detail.trim() || null)
  }

  async function createDraft(detail: string | null) {
    try {
      const draft = await requestMemoryDraft(state.rawText.trim(), detail, starterLabel, profile.language)
      dispatch({ type: 'DRAFT_SUCCESS', title: draft.title, body: draft.body })
    } catch {
      dispatch({ type: 'DRAFT_FAILED' })
    }
  }

  async function applyRevise() {
    if (!state.reviseText.trim()) return
    try {
      const revised = await requestMemoryRevise(state.draftTitle, state.draftBody, state.reviseText.trim(), profile.language)
      dispatch({ type: 'REVISE_SUCCESS', title: revised.title, body: revised.body })
    } catch {
      // Leave the existing draft untouched on failure — nothing to lose.
    }
  }

  async function handleSave() {
    if (isSavingRef.current) return // guards against duplicate taps, synchronously
    isSavingRef.current = true
    dispatch({ type: 'SAVE_START' })
    try {
      const saved = await requestMemorySave(state.draftTitle, state.draftBody)
      setLastSavedChapter({ id: saved.id, title: saved.title })
      dispatch({ type: 'SAVE_SUCCESS', id: saved.id })
    } catch {
      dispatch({ type: 'SAVE_FAILED' })
      isSavingRef.current = false // a real failure — retry must be possible
    }
  }

  const leaveButton = (
    <button onClick={() => goTo('home')} className="self-start text-ink-soft text-sm underline">
      {t.leave}
    </button>
  )

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col px-6 py-10">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6 flex-1">
        {state.step !== 'result' && leaveButton}

        {state.step === 'choose' && (
          <div className="fade-in-up flex flex-col gap-4">
            {STARTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => dispatch({ type: 'CHOOSE_STARTER', id: opt.id })}
                className="text-left bg-surface border border-ink/10 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform"
              >
                <p className="font-display text-lg text-ink">{localize(opt.label, profile.language)}</p>
              </button>
            ))}
          </div>
        )}

        {state.step === 'provide' && state.starterId && (
          <div className="fade-in-up flex flex-col gap-4 flex-1">
            <p className="font-display text-xl text-ink">{getStep2Prompt(state.starterId, profile.language)}</p>
            <textarea
              value={state.rawText}
              onChange={(e) => dispatch({ type: 'SET_RAW_TEXT', text: e.target.value })}
              placeholder={t.textPlaceholder}
              rows={5}
              className="w-full bg-surface border border-ink/10 rounded-2xl px-5 py-4 text-lg text-ink resize-none mt-auto"
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
                onClick={submitProvide}
                disabled={!state.rawText.trim()}
                className="flex-1 bg-terracotta text-surface rounded-xl py-4 text-lg font-medium disabled:opacity-50"
              >
                {t.continueButton}
              </button>
            </div>
          </div>
        )}

        {state.step === 'detail' && (
          <div className="fade-in-up flex flex-col gap-4 flex-1">
            <p className="font-display text-xl text-ink">
              {state.clarificationPrompt || getGenericDetailPrompt(profile.language)}
            </p>
            <textarea
              value={state.detail}
              onChange={(e) => dispatch({ type: 'SET_DETAIL', text: e.target.value })}
              placeholder={t.textPlaceholder}
              rows={4}
              className="w-full bg-surface border border-ink/10 rounded-2xl px-5 py-4 text-lg text-ink resize-none mt-auto"
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
              <button onClick={submitDetail} className="flex-1 bg-terracotta text-surface rounded-xl py-4 text-lg font-medium">
                {t.skipDetail}
              </button>
            </div>
          </div>
        )}

        {state.step === 'creatingDraft' && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-ink-soft text-lg italic">{t.creatingCard}</p>
          </div>
        )}

        {(state.step === 'preview' || state.step === 'saving') && (
          <div className="fade-in-up flex flex-col gap-4">
            {state.draftError && <p className="text-red-800 text-base">{t.draftError}</p>}

            {!state.editing ? (
              <>
                <div className="bg-surface rounded-2xl overflow-hidden shadow-sm">
                  <div className="relative h-40">
                    <TypographicMemoryCard id={state.starterId ?? 'memory'} />
                  </div>
                  <div className="p-5 flex flex-col gap-2">
                    <h2 className="font-display text-xl text-ink leading-snug">{state.draftTitle}</h2>
                    <p className="text-ink text-base leading-relaxed whitespace-pre-wrap">{state.draftBody}</p>
                  </div>
                </div>

                {state.saveError && <p className="text-red-800 text-base">{t.saveError}</p>}

                <button
                  onClick={handleSave}
                  disabled={state.step === 'saving'}
                  className="bg-terracotta text-surface rounded-xl py-4 text-lg font-medium disabled:opacity-50"
                >
                  {state.step === 'saving' ? t.savingCard : state.saveError ? t.retry : t.saveButton}
                </button>
                <button onClick={() => dispatch({ type: 'START_EDIT' })} className="text-ink-soft text-base underline text-center">
                  {t.editButton}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-ink-soft text-sm block mb-1">{t.editTitleLabel}</label>
                  <input
                    value={state.draftTitle}
                    onChange={(e) => dispatch({ type: 'SET_EDITED_TITLE', text: e.target.value })}
                    className="w-full bg-surface border border-ink/10 rounded-xl px-4 py-3 text-lg text-ink"
                  />
                </div>
                <div>
                  <label className="text-ink-soft text-sm block mb-1">{t.editBodyLabel}</label>
                  <textarea
                    value={state.draftBody}
                    onChange={(e) => dispatch({ type: 'SET_EDITED_BODY', text: e.target.value })}
                    rows={5}
                    className="w-full bg-surface border border-ink/10 rounded-xl px-4 py-3 text-lg text-ink resize-none"
                  />
                </div>
                <button
                  onClick={() => dispatch({ type: 'APPLY_DIRECT_EDIT' })}
                  className="bg-terracotta text-surface rounded-xl py-3 text-lg font-medium"
                >
                  {t.editDone}
                </button>

                <div className="border-t border-ink/10 pt-4 flex flex-col gap-2">
                  <label className="text-ink-soft text-sm">{t.reviseLabel}</label>
                  <textarea
                    value={state.reviseText}
                    onChange={(e) => dispatch({ type: 'SET_REVISE_TEXT', text: e.target.value })}
                    placeholder={t.revisePlaceholder}
                    rows={2}
                    className="w-full bg-surface border border-ink/10 rounded-xl px-4 py-3 text-base text-ink resize-none"
                  />
                  <button
                    onClick={applyRevise}
                    disabled={!state.reviseText.trim()}
                    className="bg-terracotta-deep text-surface rounded-xl py-3 text-base font-medium disabled:opacity-50"
                  >
                    {t.reviseButton}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {state.step === 'result' && state.savedId && (
          <div className="fade-in-up flex flex-col gap-4 items-center text-center flex-1 justify-center">
            <div className="w-full bg-surface rounded-2xl overflow-hidden shadow-sm">
              <div className="relative h-40">
                <TypographicMemoryCard id={state.starterId ?? 'memory'} />
              </div>
              <div className="p-5 flex flex-col gap-2 text-left">
                <h2 className="font-display text-xl text-ink leading-snug">{state.draftTitle}</h2>
                <p className="text-ink text-base leading-relaxed whitespace-pre-wrap">{state.draftBody}</p>
              </div>
            </div>
            <p className="font-display text-xl text-ink">{t.savedLine}</p>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => openLibraryChapter(state.savedId!)}
                className="bg-terracotta text-surface rounded-xl py-4 text-lg font-medium"
              >
                {t.viewAlbum}
              </button>
              <button onClick={() => goTo('home')} className="text-ink-soft text-base underline">
                {t.backHome}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
