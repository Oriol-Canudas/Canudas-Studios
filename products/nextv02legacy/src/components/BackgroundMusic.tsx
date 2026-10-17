import { useEffect } from 'react'
import { useGameStore } from '../game/store'
import { setBackgroundMusicEnabled, unlockBackgroundMusicOnFirstGesture } from '../game/backgroundMusic'

// Renders nothing — just keeps the module-level audio singleton in sync
// with her sound preference. Rendered once in App.tsx, alongside
// SettingsMenu, so it's never tied to any one screen's lifecycle.
export default function BackgroundMusic() {
  const soundEnabled = useGameStore((s) => s.soundEnabled)

  useEffect(() => {
    unlockBackgroundMusicOnFirstGesture()
  }, [])

  useEffect(() => {
    setBackgroundMusicEnabled(soundEnabled)
  }, [soundEnabled])

  return null
}
