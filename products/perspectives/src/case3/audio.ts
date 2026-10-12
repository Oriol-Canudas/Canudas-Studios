// Deliberately separate from src/game/audio.ts — same minimal pattern
// (plain HTMLAudioElement, no library), kept isolated so Case 3 never
// touches the investigation engine's files.

const canPlayAudio = typeof window !== "undefined" && typeof Audio !== "undefined";

let ambientEl: HTMLAudioElement | null = null;
const sfxCache: Record<string, HTMLAudioElement> = {};
let muted = false;

export function isCase3Muted() {
  return muted;
}

export function setCase3Muted(value: boolean) {
  muted = value;
  if (ambientEl) ambientEl.volume = value ? 0 : 0.25;
}

export function playCase3Ambient() {
  if (!canPlayAudio) return;
  if (!ambientEl) {
    ambientEl = new Audio("/case3/ambient.mp3");
    ambientEl.loop = true;
  }
  ambientEl.volume = muted ? 0 : 0.25;
  ambientEl.play().catch(() => {});
}

export function stopCase3Ambient() {
  ambientEl?.pause();
}

export function playCase3Sfx(name: "bang" | "ping") {
  if (!canPlayAudio || muted) return;
  const src = name === "bang" ? "/case3/sfx-bang.mp3" : "/case3/sfx-ping.mp3";
  let el = sfxCache[name];
  if (!el) {
    el = new Audio(src);
    sfxCache[name] = el;
  }
  el.volume = name === "bang" ? 0.6 : 0.45;
  el.currentTime = 0;
  el.play().catch(() => {});
}
