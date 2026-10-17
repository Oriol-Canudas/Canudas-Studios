import type { SeniorProfile } from './types'

// "Un petit record" — the one template implemented this round. The
// template owns the promise, the step sequence, and the authored copy;
// the screen (MemoryActivityScreen.tsx) owns navigation/state; the AI
// calls (api/memory-draft.ts) only ever interpret/draft/revise — never
// decide what step comes next or that something is saved. See the
// future-template notes at the bottom for how a second template would
// plug into this same shape.

export type MemoryStarterId = 'place' | 'person' | 'moment' | 'already-know'

interface LocalizedText {
  ca: string
  es: string
  en: string
}

export function localize(text: LocalizedText, language: SeniorProfile['language']): string {
  return text[language] ?? text.ca
}

export const MEMORY_PROMISE: LocalizedText = {
  ca: 'Convertim un petit record en una targeta que podràs guardar.',
  es: 'Convertimos un pequeño recuerdo en una tarjeta que podrás guardar.',
  en: "We'll turn a small memory into a card you can keep.",
}

export const STARTER_OPTIONS: { id: MemoryStarterId; label: LocalizedText; step2Prompt: LocalizedText }[] = [
  {
    id: 'place',
    label: { ca: 'Un lloc', es: 'Un lugar', en: 'A place' },
    step2Prompt: {
      ca: 'Quin lloc et ve al cap, i què hi recordes?',
      es: '¿Qué lugar te viene a la cabeza, y qué recuerdas de él?',
      en: 'What place comes to mind, and what do you remember about it?',
    },
  },
  {
    id: 'person',
    label: { ca: 'Una persona', es: 'Una persona', en: 'A person' },
    step2Prompt: {
      ca: 'De qui et ve de gust guardar un petit record?',
      es: '¿De quién te apetece guardar un pequeño recuerdo?',
      en: "Who would you like to keep a small memory of?",
    },
  },
  {
    id: 'moment',
    label: { ca: 'Un moment', es: 'Un momento', en: 'A moment' },
    step2Prompt: {
      ca: 'Quin moment voldries conservar?',
      es: '¿Qué momento te gustaría conservar?',
      en: "What moment would you like to keep?",
    },
  },
  {
    id: 'already-know',
    label: { ca: 'Ja sé què vull explicar', es: 'Ya sé qué quiero contar', en: 'I already know what I want to tell' },
    step2Prompt: {
      ca: "Explica'm el que tinguis al cap.",
      es: 'Cuéntame lo que tengas en mente.',
      en: "Tell me what's on your mind.",
    },
  },
]

export function getStarterOption(id: MemoryStarterId) {
  return STARTER_OPTIONS.find((opt) => opt.id === id) ?? STARTER_OPTIONS[3]
}

export function getStep2Prompt(id: MemoryStarterId, language: SeniorProfile['language']): string {
  return localize(getStarterOption(id).step2Prompt, language)
}

export const GENERIC_DETAIL_PROMPT: LocalizedText = {
  ca: 'Hi ha algun detall que el faci especialment teu?',
  es: '¿Hay algún detalle que lo haga especialmente tuyo?',
  en: 'Is there a detail that makes it especially yours?',
}

export function getGenericDetailPrompt(language: SeniorProfile['language']): string {
  return localize(GENERIC_DETAIL_PROMPT, language)
}

/**
 * FUTURE TEMPLATES — documented per the brief's Part 6, not implemented.
 * A category (topic) and a template (how the activity unfolds) are
 * separate; one template can serve several categories. Both of these
 * would plug into the same registry shape as "Un petit record":
 *
 * "Una cosa que sé fer" (maps to the "Coses que sé fer" subcategory):
 *   topic → steps (what it is, roughly how it's done) → one personal tip
 *   → a practical card (title, the steps, the tip). Same bounded-AI
 *   shape: interpret her free text into steps, draft the card, revise on
 *   request — never invent a step she didn't describe.
 *
 * "Una dedicatòria" (a dedication/message for someone):
 *   intention (what kind of message) → tone (warm/playful/formal, a
 *   small fixed set, not freeform) → optional recipient name → one AI
 *   composition pass from what she's given → review/revise/save, same
 *   as "Un petit record"'s step 5. The recipient is optional and never
 *   required, same spirit as not forcing a date/location/relationship
 *   in this template.
 */
