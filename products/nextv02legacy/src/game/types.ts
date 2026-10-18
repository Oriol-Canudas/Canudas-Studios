export type TurnRole = 'director' | 'senior'

export interface ConversationTurn {
  id: string
  role: TurnRole
  content: string
  createdAt: string
}

export interface ContextItem {
  text: string
  source: string
}

export type DirectorFunction = 'evoke' | 'research' | 'contrast' | 'deepen' | 'connect'

/**
 * The Director's response for one turn. Layers stay in separate fields on
 * purpose (never one blended "answer" string) so a client bug can't
 * accidentally render researched-but-unconfirmed content as a confirmed
 * fact — see the four-layers rule in the product design doc.
 */
export interface DirectorTurnResult {
  /** What the Director actually says out loud this turn. */
  dialogue: string
  /** Context offered as a question this turn — not yet confirmed. */
  offeredContext: ContextItem[]
  /**
   * Text (matched against a previous turn's offeredContext) that the
   * senior just confirmed in her latest reply — promoted to confirmed
   * context by the caller, never assumed by the model itself.
   */
  confirmedThisTurn: string[]
  /** Director-internal research notes. Never rendered to any user. */
  researchedUnconfirmed: ContextItem[]
  /** Which of the five functions this turn is primarily doing. */
  activeFunction: DirectorFunction
  /** True once the typical session shape is reached — offer, don't cut off. */
  offeringClose: boolean
}

export interface SeniorProfile {
  preferredName: string
  language: 'es' | 'ca' | 'en'
}

export type ScreenName =
  | 'welcome'
  | 'name'
  | 'firstChoice'
  | 'home'
  | 'conversationEntry'
  | 'categoryBrowser'
  | 'memoryActivity'
  | 'conversation'
  | 'chapterConfirm'
  | 'sessionClose'
  | 'library'
  | 'familyTree'
  // NEXT v1 stage 1 — E01 topic menu and the Aquells estius opening (E02-E05).
  // Kept alongside the existing screens rather than replacing them; Home is
  // the only one actually rewired this stage (see HomeScreen.tsx).
  | 'topicMenu'
  | 'summerOpening'
  // NEXT v1 — Sorprèn-me's own destination (S01-S07), distinct from
  // Explica'm's topic menu.
  | 'surpriseMenu'
  | 'whitneyJourney'
  // NEXT v1 Slice 3 — the memory-clip create/review/share flow (M01-M06).
  | 'memoryClip'

export interface PendingQuestion {
  id: string
  text: string
}

export interface ChapterDraft {
  id: string
  title: string
  testimonyText: string
}

export interface MemoryChapter {
  id: string
  title: string
  testimonyText: string
  illustrationUrl: string | null
  createdAt: string
}

export type ClipSlideRole = 'cover' | 'place' | 'moment' | 'remains'

export interface ClipSlide {
  imageUrl: string
  caption: string
  imagePrompt?: string
  role?: ClipSlideRole
}

export type ClipRepresentation = 'atmosphere' | 'people'

export interface ClipPeopleDetails {
  who: string
  approxAge: string
  depiction: string
}

export interface ChapterClip {
  title: string
  slides: ClipSlide[]
  confirmed: boolean
  shared: boolean
  shareToken: string | null
  // The language the slideshow's own words were written in — always
  // used for the player's controls and the recipient's landing page too,
  // never guessed from a viewer's browser locale (a Catalan memory must
  // never show English playback controls).
  language: SeniorProfile['language']
  representation: ClipRepresentation
  peopleDetails: ClipPeopleDetails | null
  era: string | null
}

// V01 — what a recipient actually receives: a frozen snapshot, never the
// owner's private book or raw conversation.
export interface ClipShareSnapshot {
  title: string
  authorName: string | null
  slides: ClipSlide[]
  revoked: boolean
  language: SeniorProfile['language']
}

export interface FamilyMember {
  id: string
  name: string
  relationship: string
  note: string
  createdAt: string
}

/** Set right after a successful save so Home can acknowledge the actual
 * item just created, instead of staying silent about it. */
export interface SavedChapterSummary {
  id: string
  title: string
}
