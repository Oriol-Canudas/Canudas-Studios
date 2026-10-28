import { useEffect, useRef, useState } from "react";
import { playAmbient, isMuted, onMuteChange } from "../game/audio";
import { prefersReducedMotion } from "../game/motion";

export interface IntroSlide {
  image: string;
  /** Small label above the title, e.g. a witness's role. */
  eyebrow?: string;
  /** Large heading — used for character names. Omit for plain narrative beats. */
  title?: string;
  line: string;
  /**
   * Optional speaker attribution for a dramatized beat — a pre-resolved
   * display name (e.g. "Marcus"), never a witness id, so this component
   * stays fully generic and never needs to import case data itself.
   */
  speakerName?: string;
  /** Pre-resolved accent color (hex) for the speaker label — typically that witness's own accentColor. */
  speakerColor?: string;
  /** Optional italic stage direction shown beneath the line, matching Concert's `.cue` treatment. */
  cue?: string;
  /**
   * Optional recorded voice line for this beat — played once when the
   * beat appears, independent of the word-paced caption timer (a short
   * clip finishing early just leaves the caption up in silence; that's
   * fine). Undefined (default): no voice, silent captions exactly as
   * every case behaved before this field existed.
   */
  voiceUrl?: string;
}

interface IntroSequenceProps {
  slides: IntroSlide[];
  onDone: () => void;
  slideMs?: number;
  /**
   * When true, ignores `slideMs` and paces each beat by its own word count
   * (line + cue combined) instead — adapted from Concert's own
   * `openingDuration` formula. Off by default: every case that doesn't set
   * this keeps today's fixed-timer pacing exactly as-is.
   */
  autoPaceByWords?: boolean;
  /**
   * When set, renders this ONE image behind the whole sequence instead of
   * swapping to a new image per slide — reads as one continuous scene
   * rather than a slideshow. Undefined (default): unchanged per-slide
   * image-swap behavior.
   */
  singleImage?: string;
  /**
   * When true, adds Pause/Resume and a Previous control alongside the
   * existing tap-to-skip. Off by default — no new UI appears for any case
   * that doesn't explicitly opt in.
   */
  richControls?: boolean;
  /**
   * Optional looping music bed for this sequence, distinct from the
   * game's main ambient loop — starts muted-respecting on mount, stops
   * on unmount/done. Undefined (default): no music, same as every case
   * that doesn't set it.
   */
  musicUrl?: string;
}

const DEFAULT_SLIDE_MS = 3400;
const FADE_MS = 450;

/** Adapted from Concert's own `openingDuration(beat)` — longer lines get more time instead of a flat per-slide timer. */
function wordPacedMs(slide: IntroSlide): number {
  const words = `${slide.line} ${slide.cue ?? ""}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(words <= 10 ? 10500 : 12000, words * 400 + 4000);
}

export default function IntroSequence({
  slides,
  onDone,
  slideMs = DEFAULT_SLIDE_MS,
  autoPaceByWords = false,
  singleImage,
  richControls = false,
  musicUrl,
}: IntroSequenceProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [imageErrored, setImageErrored] = useState(false);
  const [paused, setPaused] = useState(false);
  // A snapshot, not live-reactive — the OS setting doesn't change mid-session.
  const fadeMs = useState(() => (prefersReducedMotion() ? 0 : FADE_MS))[0];
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const slide = slides[index];
  const durationMs = autoPaceByWords ? wordPacedMs(slide) : slideMs;

  // Voice line per beat — plays once when the beat appears. A plain
  // HTMLAudioElement, same convention as the rest of the project's audio
  // (see game/audio.ts) rather than a second audio system.
  useEffect(() => {
    voiceRef.current?.pause();
    if (!slide.voiceUrl || isMuted()) return;
    const el = new Audio(slide.voiceUrl);
    voiceRef.current = el;
    el.volume = 0.9;
    el.play().catch(() => {});
    return () => el.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Optional music bed for the whole sequence — independent lifecycle
  // from the per-beat voice lines, stopped on unmount.
  useEffect(() => {
    if (!musicUrl || typeof Audio === "undefined") return;
    const el = new Audio(musicUrl);
    el.loop = true;
    el.volume = isMuted() ? 0 : 0.22;
    musicRef.current = el;
    el.play().catch(() => {});
    const unsubscribe = onMuteChange((m) => {
      if (musicRef.current) musicRef.current.volume = m ? 0 : 0.22;
    });
    return () => {
      el.pause();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicUrl]);

  useEffect(() => {
    if (richControls && paused) return;
    const t = setTimeout(() => {
      if (index < slides.length - 1) {
        setVisible(false);
        setTimeout(() => {
          setIndex((i) => i + 1);
          setVisible(true);
        }, fadeMs);
      } else {
        onDone();
      }
    }, durationMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, slides.length, paused]);

  // Reset per-slide — an error on one image must not make every later
  // slide skip straight to the no-art fallback too.
  useEffect(() => setImageErrored(false), [index]);

  // The mount-time autoplay attempt in App.tsx has no real user gesture
  // behind it, so strict browsers (mobile Safari, Chrome's autoplay
  // heuristic) silently block it. Any actual tap here — even the "tap to
  // skip" gesture — IS a real gesture, so retry here too; a no-op if it
  // already succeeded, the thing that actually unlocks it if it didn't.
  function handleTap() {
    playAmbient();
    onDone();
  }

  function goPrevious(e: React.MouseEvent) {
    e.stopPropagation();
    if (index === 0) return;
    setVisible(false);
    setTimeout(() => {
      setIndex((i) => Math.max(0, i - 1));
      setVisible(true);
    }, fadeMs);
  }

  function togglePause(e: React.MouseEvent) {
    e.stopPropagation();
    setPaused((p) => !p);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black" onClick={handleTap}>
      {imageErrored ? (
        // No art for this case/slide yet (e.g. a text-only-first case) —
        // a plain dark gradient reads as deliberate staging, never as a
        // broken image icon.
        <div className="h-full w-full bg-gradient-to-br from-[#1a1a22] via-[#0f0f14] to-black" />
      ) : singleImage ? (
        // One continuous scene for the whole sequence — never swapped
        // per-slide, so this reads as a single evolving moment rather
        // than a slideshow. Only the caption below still fades per beat.
        <img
          src={singleImage}
          alt=""
          onError={() => setImageErrored(true)}
          className="h-full w-full object-cover object-top opacity-70"
        />
      ) : (
        <img
          src={slide.image}
          alt=""
          onError={() => setImageErrored(true)}
          className={`h-full w-full object-cover object-top transition-opacity ease-in-out ${visible ? "opacity-70" : "opacity-0"}`}
          style={{ transitionDuration: `${fadeMs}ms` }}
        />
      )}
      {/* Darken only the lower band the caption sits in, plus a light top
          scrim for the skip label — the face (upper ~60% of a portrait
          crop) stays clear. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/90" />
      {/* Single bottom-anchored column, normal document flow — caption,
          controls and dots stack and push each other up/down as needed,
          so a long multi-line caption can never overlap the controls the
          way two independently-offset absolute blocks could. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-8 pb-6">
        <div
          className={`text-center transition-opacity ease-in-out ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ transitionDuration: `${fadeMs}ms` }}
        >
          {slide.speakerName && (
            <p
              className="mb-1.5 text-xs font-semibold uppercase tracking-[0.3em] drop-shadow-lg"
              style={{ color: slide.speakerColor ?? "#fbbf24" }}
            >
              {slide.speakerName}
            </p>
          )}
          {slide.eyebrow && (
            <p className="mb-1.5 text-xs uppercase tracking-[0.3em] text-amber-300/90">{slide.eyebrow}</p>
          )}
          {slide.title && (
            <p className="mb-1 font-serif text-2xl font-semibold text-white drop-shadow-lg">{slide.title}</p>
          )}
          <p className="text-center text-lg font-medium leading-snug text-white drop-shadow-lg">{slide.line}</p>
          {slide.cue && (
            <p className="mt-1.5 text-center text-sm italic text-white/60 drop-shadow-lg">{slide.cue}</p>
          )}
        </div>
        {richControls && (
          <div className="flex items-center justify-center gap-5">
            <button
              onClick={goPrevious}
              disabled={index === 0}
              className="text-sm text-white/50 transition-opacity disabled:opacity-30"
            >
              {"← Previous"}
            </button>
            <button onClick={togglePause} className="text-sm text-white/50">
              {paused ? "▶ Resume" : "❚❚ Pause"}
            </button>
          </div>
        )}
        <div className="flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <span key={i} className={`h-1 w-5 rounded-full ${i === index ? "bg-amber-300" : "bg-white/20"}`} />
          ))}
        </div>
      </div>
      <p className="absolute right-5 top-[calc(env(safe-area-inset-top)+16px)] text-sm text-white/40">Tap to skip</p>
    </div>
  );
}
