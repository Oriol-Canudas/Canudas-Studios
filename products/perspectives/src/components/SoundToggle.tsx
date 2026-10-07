import { useEffect, useState } from "react";
import { isMuted, onMuteChange, toggleMuted } from "../game/audio";

export default function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted());

  useEffect(() => onMuteChange(setMutedState), []);

  return (
    <button
      onClick={toggleMuted}
      className="fixed right-4 top-[calc(env(safe-area-inset-top)+12px)] z-40 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-base text-white/80 backdrop-blur-sm"
      aria-label={muted ? "Unmute sound" : "Mute sound"}
    >
      {muted ? "\u{1F507}" : "\u{1F50A}"}
    </button>
  );
}
