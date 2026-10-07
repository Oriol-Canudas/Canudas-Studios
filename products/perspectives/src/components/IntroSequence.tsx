import { useEffect, useState } from "react";

interface Slide {
  image: string;
  line: string;
}

const SLIDES: Slide[] = [
  { image: "/scenes/home.jpg", line: "Daniel Costa is dead." },
  { image: "/scenes/evidence.jpg", line: "Three people were in that apartment the night he died." },
  { image: "/portraits/elena.jpg", line: "One of them is on trial for it." },
  { image: "/scenes/verdict.jpg", line: "You decide what really happened." },
];

const SLIDE_MS = 2200;

interface IntroSequenceProps {
  onDone: () => void;
}

export default function IntroSequence({ onDone }: IntroSequenceProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      if (index < SLIDES.length - 1) {
        setVisible(false);
        setTimeout(() => {
          setIndex((i) => i + 1);
          setVisible(true);
        }, 250);
      } else {
        onDone();
      }
    }, SLIDE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const slide = SLIDES[index];

  return (
    <div className="fixed inset-0 z-50 bg-black" onClick={onDone}>
      <img
        src={slide.image}
        alt=""
        className={`h-full w-full object-cover transition-opacity duration-300 ${visible ? "opacity-60" : "opacity-0"}`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      <div className="absolute inset-0 flex items-center justify-center px-10">
        <p
          className={`text-center text-2xl font-medium leading-snug text-white drop-shadow-lg transition-opacity duration-300 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {slide.line}
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-10 flex justify-center gap-1.5">
        {SLIDES.map((_, i) => (
          <span key={i} className={`h-1 w-5 rounded-full ${i === index ? "bg-amber-300" : "bg-white/20"}`} />
        ))}
      </div>
      <p className="absolute right-5 top-[calc(env(safe-area-inset-top)+16px)] text-sm text-white/40">Tap to skip</p>
    </div>
  );
}
