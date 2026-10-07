import { useEffect, useState } from "react";

export interface IntroSlide {
  image: string;
  /** Small label above the title, e.g. a witness's role. */
  eyebrow?: string;
  /** Large heading — used for character names. Omit for plain narrative beats. */
  title?: string;
  line: string;
}

interface IntroSequenceProps {
  slides: IntroSlide[];
  onDone: () => void;
  slideMs?: number;
}

const DEFAULT_SLIDE_MS = 3400;
const FADE_MS = 450;

export default function IntroSequence({ slides, onDone, slideMs = DEFAULT_SLIDE_MS }: IntroSequenceProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      if (index < slides.length - 1) {
        setVisible(false);
        setTimeout(() => {
          setIndex((i) => i + 1);
          setVisible(true);
        }, FADE_MS);
      } else {
        onDone();
      }
    }, slideMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, slides.length]);

  const slide = slides[index];

  return (
    <div className="fixed inset-0 z-50 bg-black" onClick={onDone}>
      <img
        src={slide.image}
        alt=""
        className={`h-full w-full object-cover object-top transition-opacity ease-in-out ${visible ? "opacity-60" : "opacity-0"}`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      <div className="absolute inset-0 flex items-center justify-center px-10">
        <div
          className={`text-center transition-opacity ease-in-out ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ transitionDuration: `${FADE_MS}ms` }}
        >
          {slide.eyebrow && (
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-amber-300/90">{slide.eyebrow}</p>
          )}
          {slide.title && (
            <p className="mb-1.5 text-3xl font-semibold text-white drop-shadow-lg">{slide.title}</p>
          )}
          <p className="text-center text-2xl font-medium leading-snug text-white drop-shadow-lg">{slide.line}</p>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-10 flex justify-center gap-1.5">
        {slides.map((_, i) => (
          <span key={i} className={`h-1 w-5 rounded-full ${i === index ? "bg-amber-300" : "bg-white/20"}`} />
        ))}
      </div>
      <p className="absolute right-5 top-[calc(env(safe-area-inset-top)+16px)] text-sm text-white/40">Tap to skip</p>
    </div>
  );
}
