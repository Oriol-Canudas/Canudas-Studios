// A memory that has no photo of its own (the normal case — this app
// never claims a generated image is a real family photo) gets a warm,
// distinct typographic treatment instead of the Director's own portrait.
// Reusing her portrait on every memory was the bug this fixes: it made
// every item in the Library visually indistinguishable. The motif is
// picked deterministically from the memory's id, so the same memory
// always looks the same across reloads without storing anything new.

const GRADIENTS = [
  'from-terracotta/45 to-gold/20',
  'from-gold/45 to-terracotta/20',
  'from-terracotta-deep/40 to-cream',
  'from-gold/35 to-terracotta-deep/25',
  'from-ink/25 to-gold/30',
]

function hashToIndex(id: string, mod: number): number {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 9973
  return hash % mod
}

const ICONS = [
  // place
  <path key="place" d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />,
  // person
  <path key="person" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z" />,
  // moment (star)
  <path key="moment" d="M12 2l2.6 6.6L21 10l-5 4.4L17.4 21 12 17.3 6.6 21 8 14.4 3 10l6.4-1.4z" />,
  // a little keepsake/book
  <path key="book" d="M4 4c3-1 6-1 8 .5V20c-2-1.5-5-1.5-8-.5V4zm16 0c-3-1-6-1-8 .5V20c2-1.5 5-1.5 8-.5V4z" />,
  // heart
  <path key="heart" d="M12 21s-7.5-4.6-10-9.3C.5 8.4 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.5C11 6 12.5 5 14.4 5c3.3 0 5.1 3.4 3.6 6.7C19.5 16.4 12 21 12 21z" />,
]

export default function TypographicMemoryCard({ id, className = '' }: { id: string; className?: string }) {
  const index = hashToIndex(id, GRADIENTS.length)
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[index]} flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 24 24" className="w-10 h-10 text-ink/25" fill="currentColor" aria-hidden>
        {ICONS[index]}
      </svg>
    </div>
  )
}
