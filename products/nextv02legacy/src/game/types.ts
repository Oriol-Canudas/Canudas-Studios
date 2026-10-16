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
  language: 'es' | 'ca'
}
