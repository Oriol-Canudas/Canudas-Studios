// A single ambient-music Audio instance, kept outside React so it
// survives every screen transition without re-mounting or re-fetching.
// Deliberately quiet (0.18) — this is a backdrop, never meant to compete
// with her own voice, the Director's conversation, or a clip's own
// soundtrack.

const VOLUME = 0.18

let audio: HTMLAudioElement | null = null
let desiredPlaying = false
// A count, not a flag: more than one thing can want ambient music out of
// the way at once (e.g. the Whitney and Dolly embeds both playing in
// S06) — resuming only when the last of them lets go avoids one player's
// pause silently un-suspending ambient music under the other.
let suspendCount = 0

function ensureAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio('/audio/ambient.mp3')
    audio.loop = true
    audio.volume = VOLUME
  }
  return audio
}

function applyState() {
  const el = ensureAudio()
  if (desiredPlaying && suspendCount === 0) {
    el.play().catch(() => {
      // Blocked until a user gesture unlocks audio — fine, the next
      // gesture-triggered call (unlockOnFirstGesture) will retry.
    })
  } else {
    el.pause()
  }
}

export function setBackgroundMusicEnabled(enabled: boolean) {
  desiredPlaying = enabled
  applyState()
}

export function suspendBackgroundMusic() {
  suspendCount += 1
  applyState()
}

export function resumeBackgroundMusic() {
  suspendCount = Math.max(0, suspendCount - 1)
  applyState()
}

// Browsers block audio with sound until a real user gesture. Call once
// on the first tap/click anywhere in the app; harmless if sound is off.
export function unlockBackgroundMusicOnFirstGesture() {
  const handler = () => {
    applyState()
    document.removeEventListener('pointerdown', handler)
  }
  document.addEventListener('pointerdown', handler, { once: true })
}
