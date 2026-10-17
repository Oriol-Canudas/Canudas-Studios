import type { SeniorProfile } from './types'

interface TopicTemplateText {
  label: string
  openingPrompt: string
}

// The 6 fixed subcategories of "Crear i recordar" — the only top-level
// area with real content today. 'llocs', 'bandaSonora', and
// 'cosesQueSeFer' have no templates yet and render an honest "Aviat"
// state in CategoryBrowserScreen rather than a faked one. Matches the
// key names in strings.ts's categoryBrowser.subcategories exactly.
export type TopicSubcategory = 'llocs' | 'bandaSonora' | 'gent' | 'cosesQueSeFer' | 'histories' | 'maneraDeVeure'

export interface TopicTemplate {
  id: string
  image: string
  subcategory: TopicSubcategory
  ca: TopicTemplateText
  es: TopicTemplateText
  en: TopicTemplateText
}

// Each openingPrompt gives the Director a specific angle to follow for
// that topic — this is the "defined flow" for a template, done entirely
// through the existing prompt the Director already receives, not a
// separate wizard UI. No backend changes needed: director-respond.ts
// already builds a whole session around whatever openingTopic it's given.
export const TOPIC_TEMPLATES: TopicTemplate[] = [
  {
    id: 'wedding',
    image: '/topics/wedding.jpg',
    subcategory: 'histories',
    ca: {
      label: 'El dia del casament',
      openingPrompt:
        'Vull parlar del dia del seu casament — on va ser, qui hi era, com es va sentir, i els petits detalls que encara recorda.',
    },
    es: {
      label: 'El día de tu boda',
      openingPrompt:
        'Quiero hablar del día de tu boda — dónde fue, quién estaba, cómo te sentiste, y los pequeños detalles que todavía recuerdas.',
    },
    en: {
      label: 'Your wedding day',
      openingPrompt:
        'I want to talk about her wedding day — where it was, who was there, how she felt, and the small details she still remembers.',
    },
  },
  {
    id: 'unforgettable-day',
    image: '/topics/unforgettable-day.jpg',
    subcategory: 'histories',
    ca: {
      label: 'Un dia que no oblidarà mai',
      openingPrompt:
        'Vull parlar d\'un dia concret que no oblidarà mai — com va començar, què va passar, i com es va sentir.',
    },
    es: {
      label: 'Un día que nunca olvidarás',
      openingPrompt:
        'Quiero hablar de un día concreto que nunca olvidarás — cómo empezó, qué pasó, y cómo te sentiste.',
    },
    en: {
      label: "A day you'll never forget",
      openingPrompt:
        "I want to talk about one specific day she'll never forget — how it began, what happened, and how she felt.",
    },
  },
  {
    id: 'money',
    image: '/topics/money.jpg',
    subcategory: 'maneraDeVeure',
    ca: {
      label: 'Els diners',
      openingPrompt:
        'Vull parlar de què han significat els diners per a ella al llarg de la vida — no només fets, sinó com ha canviat la seva relació amb ells, i un moment concret que ho resumeixi.',
    },
    es: {
      label: 'El dinero',
      openingPrompt:
        'Quiero hablar de qué ha significado el dinero para ella a lo largo de su vida — no solo hechos, sino cómo ha cambiado su relación con él, y un momento concreto que lo resuma.',
    },
    en: {
      label: 'Money',
      openingPrompt:
        "I want to talk about what money has meant to her across her life — not just facts, but how her relationship with it has changed, and one moment that captures it.",
    },
  },
  {
    id: 'love',
    image: '/topics/love.jpg',
    subcategory: 'maneraDeVeure',
    ca: {
      label: "L'amor",
      openingPrompt:
        "Vull parlar de què és l'amor per a ella — com l'ha viscut, com ha canviat, i un moment concret que el defineixi.",
    },
    es: {
      label: 'El amor',
      openingPrompt:
        'Quiero hablar de qué es el amor para ella — cómo lo ha vivido, cómo ha cambiado, y un momento concreto que lo defina.',
    },
    en: {
      label: 'Love',
      openingPrompt:
        "I want to talk about what love means to her — how she's lived it, how it's changed, and one moment that defines it.",
    },
  },
  {
    id: 'justice',
    image: '/topics/justice.jpg',
    subcategory: 'maneraDeVeure',
    ca: {
      label: 'La justícia',
      openingPrompt:
        'Vull parlar de què significa la justícia per a ella — un moment de la seva vida en què la justícia, o la seva absència, la va marcar de veritat.',
    },
    es: {
      label: 'La justicia',
      openingPrompt:
        'Quiero hablar de qué significa la justicia para ella — un momento de su vida en el que la justicia, o su ausencia, la marcó de verdad.',
    },
    en: {
      label: 'Justice',
      openingPrompt:
        'I want to talk about what justice means to her — a moment in her life where justice, or its absence, really marked her.',
    },
  },
  {
    id: 'family',
    image: '/topics/family.jpg',
    subcategory: 'gent',
    ca: {
      label: 'La família',
      openingPrompt:
        'Vull parlar de què significa la família per a ella — com ha canviat la seva idea de família al llarg de la vida, i un moment que ho capturi.',
    },
    es: {
      label: 'La familia',
      openingPrompt:
        'Quiero hablar de qué significa la familia para ella — cómo ha cambiado su idea de familia a lo largo de su vida, y un momento que lo capture.',
    },
    en: {
      label: 'Family',
      openingPrompt:
        "I want to talk about what family means to her — how her idea of family has changed through her life, and a moment that captures it.",
    },
  },
  {
    id: 'family-tree',
    image: '/topics/family-tree.jpg',
    subcategory: 'gent',
    ca: {
      label: "Fem l'arbre familiar",
      openingPrompt:
        "Vull construir amb ella l'arbre familiar, amb calma, una persona cada vegada — pares, germans, parella, fills, néts: qui són, com es deien, i una frase o record que la lligui a cadascú. No cal fer-ho tot avui.",
    },
    es: {
      label: 'Hagamos el árbol familiar',
      openingPrompt:
        'Quiero construir con ella el árbol familiar, con calma, una persona cada vez — padres, hermanos, pareja, hijos, nietos: quiénes son, cómo se llamaban, y una frase o recuerdo que la una a cada uno. No hace falta hacerlo todo hoy.',
    },
    en: {
      label: "Let's build the family tree",
      openingPrompt:
        "I want to build the family tree with her, calmly, one person at a time — parents, siblings, spouse, children, grandchildren: who they are, their names, and one line or memory that ties her to each. No need to finish it all today.",
    },
  },
]

export function getTopicText(template: TopicTemplate, language: SeniorProfile['language']): TopicTemplateText {
  return template[language] ?? template.ca
}
