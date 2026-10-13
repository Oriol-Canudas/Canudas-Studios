// ─────────────────────────────────────────────────────────────────────────
// Authored comparator — a fixed decision tree reaching the SAME three
// commitments as the AI climax, through buttons instead of free text.
// Exists to answer "does free AI conversation add value over a
// well-designed authored version of the same climax" — not to be a worse
// version of the AI mode.
//
// Deliberately includes, in fixed form, the properties the AI mode must
// also demonstrate: a revision after an initial ask (step1A -> step2), a
// case where Hale persuades the PLAYER to settle for less (step1B's
// "generic_feeling" branch), an earlier accepted crew_only commitment
// surviving a LATER rejected full_prep ask (step_post_crew -> step3's
// "no_new_reason" branch), and — the one legal downgrade — an EXPLICIT,
// mutually agreed revision of full_prep back down to crew_only, before
// execution (step_post_full's "revise_down" branch). That last one is the
// only place `explicitRevision` is ever set to true in this whole tree.
// ─────────────────────────────────────────────────────────────────────────

import type { Commitment } from "./types";

export interface AuthoredOption {
  id: string;
  label: string;
  haleReply: string;
  next: string | null;
  /** What's now on the table — tracked separately from `accept`. */
  proposal?: Commitment;
  /** If present, this option actually changes the accepted commitment.
   * Normally applied via applyEscalation (negotiation.ts) — never a
   * silent/accidental downgrade. Set `explicitRevision: true` on the rare
   * option where the player and Hale are explicitly, mutually agreeing to
   * scale the plan BACK before execution — that's the one legal way
   * `accept` may represent a lower commitment than what's already in
   * place. */
  accept?: Commitment;
  explicitRevision?: boolean;
}

export interface AuthoredStep {
  id: string;
  prompt: string;
  options: AuthoredOption[];
}

export const AUTHORED_START = "step0";

/** Where the authored fallback resumes when an AI-mode conversation drops
 * out mid-negotiation — must land on the node consistent with whatever's
 * ALREADY accepted, never restart from step0 and never leave the player
 * on a dead null step with nothing accepted yet reflected. full_prep is
 * the top of the escalation ladder (nothing further to ask), so it
 * resolves straight to the reveal, same as reaching it normally. */
export function resumeAuthoredStep(accepted: Commitment | null): string | null {
  if (accepted === "crew_only") return "step_post_crew";
  if (accepted === "full_prep") return "step_post_full";
  if (accepted === "standard") return null;
  return AUTHORED_START;
}

export const AUTHORED_TREE: Record<string, AuthoredStep> = {
  step0: {
    id: "step0",
    prompt: "What do you actually want?",
    options: [
      {
        id: "ask_crew",
        label: "Get crews positioned — I'm not asking you to evacuate.",
        haleReply: "That much I can do — declaring it costs me something on paper, but it's proportionate.",
        proposal: "crew_only",
        next: "step1A",
      },
      {
        id: "ask_full",
        label: "I want full emergency response and an evacuation.",
        haleReply: "Confirmed as smoldering, same as every check tonight. Evacuation's a real cost.",
        proposal: "full_prep",
        next: "step1B",
      },
      {
        id: "ask_nothing",
        label: "Nothing for now — handle it as a routine landing.",
        haleReply: "Understood. We'll treat it as routine.",
        accept: "standard",
        next: null,
      },
    ],
  },
  step1A: {
    id: "step1A",
    prompt: "You want the evacuation too?",
    options: [
      {
        id: "decline_evac",
        label: "No — crews on the fire is enough for what I know.",
        haleReply: "Appreciate you not stretching it. Crews, no evacuation.",
        accept: "crew_only",
        next: "step_post_crew",
      },
      {
        id: "want_both",
        label: "Actually, yes — both.",
        haleReply: "Noted.",
        proposal: "full_prep",
        next: "step2",
      },
    ],
  },
  step1B: {
    id: "step1B",
    prompt: "What's the specific reason, beyond the reading itself?",
    options: [
      {
        id: "cite_seal",
        label: "Nobody's confirmed the hold's still sealed — crews on the fire won't help if it gets forward before they reach it.",
        haleReply: "...Fair. That's not something crews on the outside fix. Both — moving now.",
        accept: "full_prep",
        next: "step_post_full",
      },
      {
        id: "generic_feeling",
        label: "I'd rather not find out it's different this time.",
        haleReply:
          "That's not something I can act on without more. I'll get crews positioned — that much is proportionate. I'm not ordering the evacuation on a feeling.",
        accept: "crew_only",
        next: "step_post_crew",
      },
    ],
  },
  step2: {
    id: "step2",
    prompt: "What's the specific reason, beyond the reading itself?",
    options: [
      {
        id: "cite_seal2",
        label: "Nobody's confirmed the hold's still sealed.",
        haleReply: "...Fair. Both — moving now.",
        accept: "full_prep",
        next: "step_post_full",
      },
      {
        id: "rather_safe",
        label: "I'd just rather be safe.",
        haleReply:
          "I hear that, but I need something more specific than 'rather be safe' to add a certain injury to this landing. Crews stay as agreed — I'm not taking it further without a reason.",
        accept: "crew_only",
        next: null,
      },
    ],
  },
  step_post_crew: {
    id: "step_post_crew",
    prompt: "Crews are moving. Anything else before we land?",
    options: [
      {
        id: "ask_more",
        label: "Actually — I want the evacuation too, now.",
        haleReply: "Noted.",
        proposal: "full_prep",
        next: "step3",
      },
      {
        id: "thats_it",
        label: "That's everything.",
        haleReply: "Copy that.",
        next: null,
      },
    ],
  },
  step3: {
    id: "step3",
    prompt: "What's changed? I need a specific reason, not just wanting more.",
    options: [
      {
        id: "cite_seal3",
        label: "Nobody's confirmed the hold's still sealed.",
        haleReply: "...Fair, I hadn't weighed that. Both.",
        accept: "full_prep",
        next: "step_post_full",
      },
      {
        id: "no_new_reason",
        label: "No new reason, just being extra careful.",
        haleReply: "Then we're not changing anything — crews stay as agreed, that's where this lands.",
        next: null,
      },
    ],
  },
  step_post_full: {
    id: "step_post_full",
    prompt: "Evacuation's moving. Anything else before we land?",
    options: [
      {
        id: "revise_down",
        label: "Actually — hold off on the evacuation. Just keep the crews.",
        haleReply: "If you're sure — crews stay, no evacuation then.",
        accept: "crew_only",
        explicitRevision: true,
        next: null,
      },
      {
        id: "thats_it",
        label: "That's everything.",
        haleReply: "Copy that.",
        next: null,
      },
    ],
  },
};
