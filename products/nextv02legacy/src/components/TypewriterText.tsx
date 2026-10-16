import { useEffect, useRef, useState } from 'react'

interface TypewriterTextProps {
  text: string
  className?: string
}

// Reveals text a couple characters at a time, matching the pace already
// validated in the earlier Soundtrack-of-Your-Life prototype. Each mounted
// instance animates once, from empty to full — callers give it a stable
// `key` per distinct text (a turn id, a chapter id) so a new instance,
// not a text-prop change, is what starts a fresh animation; appending
// content elsewhere never replays an already-finished one.
export default function TypewriterText({ text, className }: TypewriterTextProps) {
  const [shown, setShown] = useState('')
  const indexRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      indexRef.current += 2
      setShown(text.slice(0, indexRef.current))
      if (indexRef.current >= text.length) clearInterval(id)
    }, 14)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <p className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {shown}
    </p>
  )
}
