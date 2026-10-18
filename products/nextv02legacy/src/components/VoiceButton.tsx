import { useRef, useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import { suspendBackgroundMusic, resumeBackgroundMusic } from '../game/backgroundMusic'

type RecorderState = 'idle' | 'recording' | 'transcribing' | 'reviewing' | 'error'

export default function VoiceButton() {
  const [state, setState] = useState<RecorderState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [transcript, setTranscript] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const { profile, sendSeniorReply, isThinking } = useGameStore()
  const t = getStrings(profile.language).voice

  async function startRecording() {
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      suspendBackgroundMusic()
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => handleStop(recorder.mimeType || 'audio/webm')
      recorder.start()
      mediaRecorderRef.current = recorder
      setState('recording')
    } catch {
      setErrorMsg(t.micError)
      setState('error')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    resumeBackgroundMusic()
  }

  async function handleStop(mimeType: string) {
    setState('transcribing')
    try {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const res = await fetch(`/api/transcribe?lang=${profile.language}`, {
        method: 'POST',
        headers: { 'Content-Type': mimeType },
        body: blob,
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: 'unknown_error' }))
        throw new Error(payload.error ?? 'transcribe_failed')
      }
      const { text } = await res.json()
      // Never record implicitly: she reviews/edits the transcript here —
      // sendSeniorReply only fires once she explicitly confirms Send.
      setTranscript((text ?? '').trim())
      setState('reviewing')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : t.transcribeError)
      setState('error')
    }
  }

  function confirmSend() {
    if (!transcript.trim()) return
    sendSeniorReply(transcript.trim())
    setTranscript('')
    setState('idle')
  }

  function cancelReview() {
    setTranscript('')
    setState('idle')
  }

  const disabled = isThinking || state === 'transcribing'

  if (state === 'reviewing') {
    return (
      <div className="w-full flex flex-col gap-3">
        <p className="text-ink-soft text-sm">{t.reviewLabel}</p>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={3}
          className="w-full bg-surface border border-ink/20 rounded-2xl px-4 py-3 text-lg text-ink resize-none"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={confirmSend}
            disabled={!transcript.trim() || isThinking}
            className="flex-1 bg-terracotta text-surface rounded-xl py-3 text-base font-medium disabled:opacity-50"
          >
            {t.send}
          </button>
          <button
            onClick={() => {
              setTranscript('')
              setState('idle')
              startRecording()
            }}
            className="border border-ink/20 text-ink-soft rounded-xl px-4 py-3 text-base"
          >
            {t.rerecord}
          </button>
        </div>
        <button onClick={cancelReview} className="text-ink-soft text-sm underline text-center">
          {t.cancel}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        disabled={disabled}
        onClick={state === 'recording' ? stopRecording : startRecording}
        className={
          state === 'recording'
            ? 'w-20 h-20 rounded-full bg-terracotta-deep text-surface flex items-center justify-center shadow-lg animate-pulse disabled:opacity-50'
            : 'w-20 h-20 rounded-full bg-terracotta text-surface flex items-center justify-center shadow-lg disabled:opacity-50'
        }
        aria-label={state === 'recording' ? t.stopRecording : t.speak}
      >
        <span className="text-3xl">{state === 'recording' ? '■' : '🎙'}</span>
      </button>
      <p className="text-ink-soft text-base">
        {state === 'recording' ? t.listening : state === 'transcribing' ? t.understanding : t.tapToSpeak}
      </p>
      {errorMsg && <p className="text-red-800 text-sm text-center max-w-xs">{errorMsg}</p>}
    </div>
  )
}
