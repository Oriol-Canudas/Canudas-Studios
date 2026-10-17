import { useRef, useState } from 'react'
import { suspendBackgroundMusic, resumeBackgroundMusic } from './backgroundMusic'
import type { SeniorProfile } from './types'

export type RecorderState = 'idle' | 'recording' | 'transcribing' | 'error'

// Shared by every screen that lets her speak into a text field instead of
// sending immediately (ConversationEntryScreen, MemoryActivityScreen) —
// transcribes into the caller's own draft state for review, never
// auto-sends. The in-conversation VoiceButton is a separate component on
// purpose: once a session is live it sends immediately, which this never does.
export function useVoiceToText(language: SeniorProfile['language'], onTranscribed: (text: string) => void) {
  const [state, setState] = useState<RecorderState>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Ambient music bleeding into the mic (via speaker leakage on a
      // phone without headphones) would hurt transcription quality.
      suspendBackgroundMusic()
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        resumeBackgroundMusic()
        setState('transcribing')
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          const res = await fetch(`/api/transcribe?lang=${language}`, {
            method: 'POST',
            headers: { 'Content-Type': blob.type },
            body: blob,
          })
          if (!res.ok) throw new Error('transcribe_failed')
          const { text } = await res.json()
          if (text?.trim()) onTranscribed(text.trim())
          setState('idle')
        } catch {
          setState('error')
        }
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setState('recording')
    } catch {
      setState('error')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
  }

  return { state, startRecording, stopRecording }
}
