import { useEffect, useRef, useState } from "react";

// Local, deliberately duplicated rather than imported from src/game/motion.ts
// — Case 3 stays isolated from the investigation engine's files on purpose.
function prefersReducedMotion(): boolean {
  try {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

interface TypewriterProps {
  text: string;
  /** Skip straight to full text — used for already-seen history on a fresh mount (e.g. re-focusing an agent). */
  instant?: boolean;
}

/**
 * Reveals an agent's line at a natural speaking pace instead of dumping it
 * all at once — same timing model as the investigation engine's
 * TypewriterText (src/components/TypewriterText.tsx), reimplemented here
 * rather than imported, to keep Case 3 fully isolated. Tap to skip.
 *
 * Continuous scrolling while this is mid-reveal is handled by the parent
 * Transcript's ResizeObserver, not by this component — it only needs to
 * grow the DOM node as it types, the observer does the rest.
 */
export default function Typewriter({ text, instant }: TypewriterProps) {
  const reduced = useRef(prefersReducedMotion()).current;
  const skipToEnd = instant || reduced;
  const [visibleChars, setVisibleChars] = useState(skipToEnd ? text.length : 0);
  const doneRef = useRef(skipToEnd);

  useEffect(() => {
    if (skipToEnd) {
      setVisibleChars(text.length);
      doneRef.current = true;
      return;
    }

    setVisibleChars(0);
    doneRef.current = false;

    const totalMs = Math.min(Math.max(text.length * 16, 350), 2600);
    const stepMs = totalMs / Math.max(text.length, 1);

    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setVisibleChars(i);
      if (i >= text.length) {
        clearInterval(interval);
        doneRef.current = true;
      }
    }, stepMs);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function skip() {
    if (doneRef.current) return;
    doneRef.current = true;
    setVisibleChars(text.length);
  }

  return (
    <span onClick={skip} className="cursor-default">
      {text.slice(0, visibleChars)}
    </span>
  );
}
