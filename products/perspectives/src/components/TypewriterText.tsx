import { useEffect, useRef, useState } from "react";

interface TypewriterTextProps {
  text: string;
  /** Called once the full text is visible. */
  onDone?: () => void;
  /** Skips the animation entirely — honors prefers-reduced-motion. */
  instant?: boolean;
}

/**
 * Reveals text at a natural reading/typing pace instead of dumping it all
 * at once — makes a witness's answer feel like it's actually being spoken,
 * not printed. Tap anywhere on it to skip straight to the full text.
 */
export default function TypewriterText({ text, onDone, instant }: TypewriterTextProps) {
  const [visibleChars, setVisibleChars] = useState(instant ? text.length : 0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (instant) {
      setVisibleChars(text.length);
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
      return;
    }

    setVisibleChars(0);
    doneRef.current = false;

    // Total reveal time scales with length but is clamped so short lines
    // feel snappy and long confessions don't drag on forever.
    const totalMs = Math.min(Math.max(text.length * 16, 350), 2600);
    const stepMs = totalMs / Math.max(text.length, 1);

    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setVisibleChars(i);
      if (i >= text.length) {
        clearInterval(interval);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
      }
    }, stepMs);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function skip() {
    if (doneRef.current) return;
    doneRef.current = true;
    setVisibleChars(text.length);
    onDone?.();
  }

  return (
    <span onClick={skip} className="cursor-default">
      {text.slice(0, visibleChars)}
    </span>
  );
}
