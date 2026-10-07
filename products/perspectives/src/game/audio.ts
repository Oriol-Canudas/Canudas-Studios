// ─────────────────────────────────────────────────────────────────────────
// Minimal audio manager. No audio library — plain HTMLAudioElement is
// plenty for a short ambient loop plus a handful of one-shot SFX. Respects
// mobile autoplay rules (ambient only starts from a real user gesture) and
// a persisted mute preference.
// ─────────────────────────────────────────────────────────────────────────

const SFX_FILES = {
  evidence: "/audio/evidence_chime.mp3",
  contradiction: "/audio/contradiction_sting.mp3",
  demeanor: "/audio/demeanor_tick.mp3",
  verdict: "/audio/verdict_gavel.mp3",
} as const;

export type SfxName = keyof typeof SFX_FILES;

const AMBIENT_SRC = "/audio/ambient.mp3";
const AMBIENT_VOLUME = 0.32;
const SFX_VOLUME = 0.55;

// This module is also imported by store.ts, which the Node-based self-test
// (scripts/selftest.ts) exercises directly outside a browser — guard every
// entry point so it's a safe no-op there instead of throwing on `new Audio`.
const canPlayAudio = typeof window !== "undefined" && typeof Audio !== "undefined";

let ambientEl: HTMLAudioElement | null = null;
const sfxCache: Partial<Record<SfxName, HTMLAudioElement>> = {};

function readMuted(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem("perspective_muted") === "1";
  } catch {
    return false;
  }
}

let muted = readMuted();
const listeners = new Set<(muted: boolean) => void>();

export function isMuted(): boolean {
  return muted;
}

export function onMuteChange(fn: (muted: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem("perspective_muted", value ? "1" : "0");
  } catch {
    // ignore
  }
  if (ambientEl) ambientEl.volume = value ? 0 : AMBIENT_VOLUME;
  listeners.forEach((fn) => fn(value));
}

export function toggleMuted() {
  setMuted(!muted);
}

/** Call this from a real tap/click handler — mobile browsers block audio otherwise. */
export function playAmbient() {
  if (!canPlayAudio) return;
  if (!ambientEl) {
    ambientEl = new Audio(AMBIENT_SRC);
    ambientEl.loop = true;
  }
  ambientEl.volume = muted ? 0 : AMBIENT_VOLUME;
  ambientEl.play().catch(() => {
    // Autoplay blocked — fine, it'll just stay silent until a gesture allows it.
  });
}

export function stopAmbient() {
  if (!ambientEl) return;
  ambientEl.pause();
  ambientEl.currentTime = 0;
}

export function playSfx(name: SfxName) {
  if (!canPlayAudio || muted) return;
  let el = sfxCache[name];
  if (!el) {
    el = new Audio(SFX_FILES[name]);
    sfxCache[name] = el;
  }
  el.volume = SFX_VOLUME;
  el.currentTime = 0;
  el.play().catch(() => {});
}
