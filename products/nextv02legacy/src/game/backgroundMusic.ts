// A single ambient-music Audio instance, kept outside React so it
// survives every screen transition without re-mounting or re-fetching.
// Deliberately quiet (0.18) — this is a backdrop, never meant to compete
// with her own voice, the Director's conversation, or a clip's own
// soundtrack.

const VOLUME = 0.18

let audio: HTMLAudioElement | null = null
let desiredPlaying = false
// True while ClipPlayer (or anything else with its own soundtrack) has
// asked us to stay out of the way — distinct from `desiredPlaying`, which
// tracks whether she wants ambient music on at all.
let suspended = false

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
  if (desiredPlaying && !suspended) {
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
  suspended = true
  applyState()
}

export function resumeBackgroundMusic() {
  suspended = false
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
