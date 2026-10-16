import { useRef, useState } from 'react'
import { useGameStore } from '../game/store'

type RecorderState = 'idle' | 'recording' | 'transcribing' | 'error'

export default function VoiceButton() {
  const [state, setState] = useState<RecorderState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const { profile, sendSeniorReply, isThinking } = useGameStore()

  async function startRecording() {
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
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
      setErrorMsg('No he pogut accedir al micròfon.')
      setState('error')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
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
      setState('idle')
      if (text?.trim()) {
        sendSeniorReply(text.trim())
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'No he pogut entendre l’àudio.')
      setState('error')
    }
  }

  const disabled = isThinking || state === 'transcribing'

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
        aria-label={state === 'recording' ? 'Atura la gravació' : 'Parla'}
      >
        <span className="text-3xl">{state === 'recording' ? '■' : '🎙'}</span>
      </button>
      <p className="text-ink-soft text-base">
        {state === 'recording'
          ? 'T’escolto…'
          : state === 'transcribing'
            ? 'Entenent el que dius…'
            : 'Toca per parlar'}
      </p>
      {errorMsg && <p className="text-red-800 text-sm text-center max-w-xs">{errorMsg}</p>}
    </div>
  )
}
