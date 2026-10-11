// ─────────────────────────────────────────────────────────────────────────
// CASE: "The Last Ascent"
//
// A deliberately different shape of decision from Case 002: not "who did
// it," but "what do we do, with a closing window and a team that doesn't
// agree." The core thing this case exists to demonstrate: conversation
// changes both what the player KNOWS and what other people are actually
// WILLING TO DO — and those two things, together with how much fictional
// time is left, are what the final plan is resolved against. Nothing here
// is a knowledge quiz; the single verdict axis is an action (which plan),
// never "did you discover X."
//
// Reuses 100% of the existing engine primitives — topics/stages, altUnlock,
// relay, demeanor, the generic N-axis verdict system, the opt-in time
// clock. The only new CONTENT idea (not new engine code) is that a
// "commitment" is just an ordinary topic whose gated stage represents a
// witness agreeing to something, and whose acceptance is itself relayable
// (via REVELATIONS) exactly like any other fact — see "the_deal",
// "pace_agreement", and "conditional_support" below.
// ─────────────────────────────────────────────────────────────────────────

import type {
  EvidenceFact,
  EvidenceId,
  EvidenceItem,
  PlayerVerdict,
  RevelationDef,
  RevelationId,
  RevealNarrative,
  TimePressureConfig,
  VerdictAxis,
  WitnessConfig,
} from "./types";
import type { GradedVerdict, Judgment, VerdictGradingConfig } from "./verdictGrading";
import type { IntroSlide } from "../components/IntroSequence";

// ── Time pressure — the one genuinely new mechanic this case exercises ───
// 75 minutes is the real, fixed storm ETA (see GROUND_TRUTH_REVEAL) — never
// shown to the player as a certainty, since no one in the fiction actually
// knows it precisely. The displayed clock is an honest GAME affordance
// (your own decision budget ticking down), not a claim about the
// character's own knowledge — the characters' disagreement about timing
// lives in their dialogue, not in the HUD.
export const TIME_PRESSURE: TimePressureConfig = {
  totalMinutes: 75,
  costMinutes: { ask: 4, presentEvidence: 4, relay: 2 },
  label: "minutes before you have to call it",
};

export const CASE_META = {
  kicker: "Perspectives — The Last Ascent",
  title: "The Last Ascent",
  chargeLabel: "The Situation",
  charge:
    "Five people are on this mountain. Ingrid, the expedition lead, just fell and had to be short-roped down to a lower camp — stable, reachable by radio, out of the decision. Before she went down, she named you, not Rae, not Soren, acting leader for what happens next. A storm is closing on the summit ridge.",
  causeOfDeath: "No one agrees on how much time that actually leaves.",
  admits: ["Ingrid is off the decision", "A storm is closing in", "No one fully agrees on the window"],
  standingLine: "The call is yours. The team isn't unanimous, and not everyone's told you everything yet.",
  roleIcon: "🏔️",
  roleLine: "You're Acting Leader, by Ingrid's own call — not by seniority. Question the team, weigh what they're not saying, and decide.",
};

/**
 * GROUND TRUTH — immutable, never shown directly until the reveal (and
 * even there, only through GROUND_TRUTH_REVEAL's paraphrase). Witnesses
 * only ever say things derivable from their own authored knowledge below,
 * never this directly.
 */
export const GROUND_TRUTH = {
  theWindow:
    "The storm's real arrival at the summit ridge is about 75 minutes out from the moment Ingrid's fall forces the decision down to the acting leader — not Dev's 'comfortable two hours,' not Soren's 'it could hit any minute.'",
  theMath:
    "A fast, disciplined push — summit and straight back, no extended photo stop — needs roughly 30 minutes and fits inside that window. Dev's full photo-and-video stop would add roughly 40 more minutes, which does not fit.",
  raesRisk:
    "Rae has a heart arrhythmia she has told no one on the team about. A forced fast pace to beat the storm is genuinely dangerous for her specifically, independent of the weather or the timing — a risk that exists whether or not anyone ever finds out about it.",
  noCleanAnswer:
    "There is no single correct call: a disciplined push is survivable for everyone except possibly Rae if her condition isn't accounted for; retreat is always safe but likely costs the expedition its funding and Rae a summit she may not get another real shot at.",
};

/** Generic reveal paragraphs RevealScreen.tsx renders in order — last one shown italic. */
export const GROUND_TRUTH_REVEAL: string[] = [GROUND_TRUTH.theWindow, GROUND_TRUTH.theMath, GROUND_TRUTH.raesRisk, GROUND_TRUTH.noCleanAnswer];

/** This case has no pre-existing crime-scene timeline to reconstruct — the story happens during play, not before it. RevealScreen only renders this section when non-empty. */
export const TIMELINE: { time: string; label: string }[] = [];

// ───────────────────────────── Evidence ─────────────────────────────────

export const EVIDENCE: EvidenceItem[] = [
  {
    id: "E01_dev_weather_brief",
    title: "Dev's weather briefing",
    category: "weather",
    summary: "The forecast printout Dev handed out at base camp this morning.",
    details: [
      "Printed satellite weather briefing, distributed at base camp this morning.",
      "Storm system shown arriving at the summit ridge in approximately 2 hours.",
      "Signed off by Dev Kapoor, expedition photographer & sponsor liaison.",
    ],
  },
  {
    id: "E02_summit_schedule",
    title: "Planned summit schedule",
    category: "records",
    summary: "The team's own written plan for the push, including Dev's requested stop.",
    details: [
      "Planned ascent/descent time, no extended stop: approximately 30 minutes round trip from the current position.",
      "Dev's requested summit photo-and-video stop: an additional ~40 minutes.",
      "Drafted before Ingrid's fall; not yet revised for the time already spent on this decision.",
    ],
  },
  {
    id: "E03_felix_incident_report",
    title: "Incident report: Mount Kestrel, three years ago",
    category: "records",
    summary: "An official write-up from a different expedition, a different mountain.",
    details: [
      "Climbing team pushed for a summit past its own planned turnaround time, for a sponsor photo opportunity.",
      "Teammate Felix Aronsen sustained severe frostbite; lost three fingers.",
      "Soren Lindqvist listed as safety officer on that expedition.",
    ],
  },
  {
    id: "E04_sponsor_messages",
    title: "Sponsor satellite messages",
    category: "records",
    summary: "Recent exchanges between Dev and the sponsor's head office.",
    details: [
      "Sponsor HQ to Dev: \"Need something usable from this one. Next year's budget is being decided this month.\"",
      "Dev to Sponsor HQ: \"Working on it. Window looks workable.\"",
    ],
  },
  {
    id: "E05_team_medical_log",
    title: "Team pre-expedition medical log",
    category: "medical",
    summary: "Standard screening status for every climber this season — not a diagnosis.",
    details: [
      "Dev Kapoor — completed standard altitude screening.",
      "Soren Lindqvist — completed standard altitude screening.",
      "Mei Tanaka — completed standard altitude screening.",
      "Rae Ninsiima — declined the optional cardiac screening this season. No reason given on file.",
    ],
  },
  {
    id: "E06_radio_transcript",
    title: "Radio transcript, lower camp — last hour",
    category: "records",
    summary: "Partial transcript from the radio operator at lower camp.",
    details: [
      "Lower camp operator: \"Latest pass just came in, it's worse than the one you've got — tell them it's closer to an hour, not two.\"",
      "No confirmation on record that this was relayed up to the summit team before the decision.",
    ],
  },
  {
    id: "E07_soren_safety_log",
    title: "Soren's safety log, this expedition",
    category: "records",
    summary: "Soren's own handwritten notes, written before the team reached this point.",
    details: [
      "\"Margin feels thin today. Asked Dev twice for a confidence level on the window. Didn't get a straight number back.\"",
      "\"Keep an eye on pace. Nobody's said anything, but something's off with how hard Rae's pushing this one.\"",
    ],
  },
];

export const EVIDENCE_FACTS: Record<EvidenceId, EvidenceFact[]> = {
  E01_dev_weather_brief: [
    { content: "Dev's distributed briefing claims a roughly 2-hour window before the storm.", type: "claim" },
  ],
  E02_summit_schedule: [
    { content: "A disciplined push, no stop, is budgeted at ~30 minutes round trip.", type: "fact" },
    { content: "Dev's requested photo/video stop would add ~40 minutes on top of that.", type: "fact" },
  ],
  E03_felix_incident_report: [
    { content: "Three years ago, a different team pushed past its turnaround for a sponsor photo — a teammate, Felix Aronsen, lost three fingers to frostbite.", type: "fact" },
    { content: "Soren Lindqvist was the safety officer on that expedition.", type: "fact" },
  ],
  E04_sponsor_messages: [
    { content: "The sponsor is explicitly pressuring Dev for \"something usable\" this season, tied to next year's budget.", type: "fact" },
  ],
  E05_team_medical_log: [
    { content: "Every climber but Rae completed this season's optional cardiac screening. Rae declined it, no reason given.", type: "lead" },
  ],
  E06_radio_transcript: [
    { content: "Lower camp's own radio operator relayed a worse, more recent satellite pass — closer to an hour than two.", type: "fact" },
    { content: "Nothing on record confirms this was actually passed up to the summit team.", type: "lead" },
  ],
  E07_soren_safety_log: [
    { content: "Soren's own notes, written beforehand, flag thin margin and an unanswered request for a real confidence number from Dev.", type: "claim" },
    { content: "Soren's notes also flag something seeming \"off\" about Rae's pace, written before anyone told him why.", type: "lead" },
  ],
};

// ───────────────────────────── Witnesses ─────────────────────────────────

export const WITNESSES: WitnessConfig[] = [
  // ───────────────────────────── RAE ─────────────────────────────
  {
    id: "rae",
    name: "Rae Ninsiima",
    role: "Lead climbing guide — most technically experienced",
    age: 41,
    context:
      "Fifteen years guiding, six summits above 8,000 meters. Confident the weather window still holds. Pushing hard for the summit — for reasons she hasn't fully said out loud.",
    keyFacts: [
      "Most technically experienced climber on the team",
      "Confident the window still holds — pushes for the summit",
      "Trusts Dev's weather numbers completely, without question",
    ],
    portraitPrompt: "Weathered mountaineer, mid-40s, composed and focused, cinematic alpine light",
    portraitImage: "/portraits/ascent/rae.jpg",
    accentColor: "#38bdf8",
    baselineDemeanor: "guarded",
    freeformEnabled: true,
    introHook: "Lead guide. Most experienced climber here — and pushing hardest for the top.",
    deflections: [
      "I'm not sure what you're asking me.",
      "Can you ask that a different way? I want to actually answer you.",
      "I don't have anything more to add there.",
    ],
    defensiveLines: [
      "I'm not going to just accept that framing. I've given you my honest read.",
      "That's not fair — I'm telling you what I actually think, not hiding behind the mountain.",
      "I don't appreciate being accused of something I haven't done.",
    ],
    demeanorLines: {
      guarded: "She's measured, watching you the way she'd watch a route — looking for where it holds.",
      nervous: "Something in her answer came out a beat too fast.",
      shaken: "Whatever you just said landed somewhere she wasn't braced for.",
      composed: "Steadier now — like something she'd been holding finally got put down.",
    },
    topics: [
      {
        id: "your_read",
        chipLabel: "What's your read on the weather right now?",
        keywords: ["weather", "window", "read", "forecast", "conditions", "storm", "time left", "how much time", "think we have"],
        stages: [
          {
            text: "We've got time. Two hours, maybe more, before anything serious moves in — that's what Dev's models are showing, and I trust his numbers. We came all this way. I think we push.",
            demeanor: "guarded",
            addsBoardEntries: [{ type: "claim", text: "Rae: believes the weather window is roughly two hours, in favor of pushing.", source: "rae" }],
          },
        ],
      },
      {
        id: "why_push",
        chipLabel: "Why does this summit matter so much to you?",
        keywords: ["why", "matter", "summit", "important", "push so hard", "mean to you", "care so much", "want this"],
        stages: [
          {
            text: "Because it's right there. Because we trained a year for this. Because turning back forty minutes from the top, with a window this size, would be the kind of regret that doesn't go away.",
            demeanor: "guarded",
          },
          {
            text: "...Because chances like this don't come around twice for someone my age, in this sport. That's the honest answer, if you actually want it.",
            minAskCount: 2,
            demeanor: "nervous",
            addsBoardEntries: [{ type: "claim", text: "Rae, pressed further: hints this may be a last realistic shot at a summit like this one.", source: "rae" }],
          },
        ],
      },
      {
        id: "your_experience",
        chipLabel: "How experienced are you, compared to the others?",
        keywords: ["experience", "experienced", "guide", "climbed", "years", "qualifications", "background", "how long"],
        stages: [
          {
            text: "Fifteen years guiding, six summits above 8,000 meters. I've turned people back before when I had to. I'm not reckless — I just don't think this is one of those times.",
            demeanor: "guarded",
          },
        ],
      },
      {
        id: "soren_disagreement",
        chipLabel: "Soren wants to turn back. What do you make of that?",
        keywords: ["soren", "disagree", "turn back", "retreat", "cautious", "overcautious", "doubts"],
        stages: [
          {
            text: "Soren's good. Careful, maybe too careful since — well, something happened on another trip, before my time on this team. I respect him. I just don't think this is that situation.",
            demeanor: "guarded",
          },
        ],
      },
      {
        id: "dev_reliability",
        chipLabel: "Do you trust Dev's weather numbers?",
        keywords: ["dev", "trust", "weather data", "numbers", "reliable", "accurate", "believe him"],
        stages: [
          {
            text: "Completely. He's got the same satellite feed everyone up here uses. I don't have a reason to think he's reading it any differently than I would.",
            demeanor: "guarded",
          },
        ],
      },
      {
        id: "heart_condition",
        chipLabel: "Is there something about your health you're not telling us?",
        keywords: ["health", "condition", "heart", "medical", "fine", "okay", "screening", "doctor", "something wrong"],
        stages: [
          {
            text: "I'm fine. I wouldn't be up here if I wasn't.",
            demeanor: "guarded",
          },
          {
            text: "...Fine. I have an arrhythmia. I skipped this season's cardiac screening because I was afraid of what it would show, and afraid of what happens to my career if it's on record. A hard, fast pace to beat a storm is a real risk for me — not because of the mountain, because of my heart. I've been telling myself the window's fine partly because I need it to be.",
            requiresEvidence: ["E05_team_medical_log"],
            presentedText:
              "...Fine — you've clearly seen the medical log. I have an arrhythmia. I skipped the screening because I was afraid of what it would show, and what happens to my career if it's on record. A hard fast pace to beat a storm is a real risk for me specifically, not just the mountain.",
            altUnlock: { requiresRelayed: ["dev_real_weather"], requiresIntent: ["empathetic_appeal", "evidence_challenge"] },
            altUnlockText:
              "...If the real window's actually tighter than Dev's been saying, then pushing blind is riskier than just telling you the truth. I have an arrhythmia. I skipped this season's cardiac screening — I was afraid of what it would show, and afraid of what happens to my career if it's known. A hard, fast pace to beat the storm is a genuine risk for me specifically. I needed the window to be fine. That's not the same as it being fine.",
            demeanor: "shaken",
            addsBoardEntries: [{ type: "claim", text: "Rae admits a heart arrhythmia she's told no one about — a forced fast pace is a real risk for her specifically.", source: "rae" }],
          },
        ],
      },
      {
        id: "pace_agreement",
        chipLabel: "Will you commit to a pace that actually protects your own safety?",
        keywords: ["commit", "pace", "agree", "promise", "safe pace", "slow down", "protect yourself", "deal"],
        stages: [
          {
            text: "I'm not going to slow the whole team down for myself. If we push, we push properly.",
            demeanor: "guarded",
          },
          {
            text: "...Alright. If we push, I keep to a pace that's actually safe for my heart, even if it costs us a few minutes. I'd rather lose a little time than find out the hard way what happens if I don't.",
            requiresWitnessStage: { witness: "rae", topic: "heart_condition", minStage: 1 },
            demeanor: "composed",
            addsBoardEntries: [{ type: "claim", text: "Rae agrees to a pace that protects her own safety, rather than pushing blind.", source: "rae" }],
          },
        ],
      },
      {
        id: "final_call",
        chipLabel: "If it were only up to you, what would you do?",
        keywords: ["final call", "decide", "your call", "what would you do", "your decision", "what do you think we should do"],
        stages: [
          {
            text: "Push. Fast, no extra stops, straight up and straight back. I think we can make it before anything serious hits.",
            demeanor: "guarded",
          },
        ],
      },
    ],
  },

  // ───────────────────────────── DEV ─────────────────────────────
  {
    id: "dev",
    name: "Dev Kapoor",
    role: "Sponsor's representative & expedition photographer",
    age: 33,
    context:
      "Documents the climb for the sponsor. Says the weather models still look workable. Next year's program funding depends on this expedition delivering a usable summit shot.",
    keyFacts: [
      "Sponsor's representative and the expedition's photographer",
      "Claims the weather models show a 'comfortable' window",
      "Next year's funding depends on a usable summit shot",
    ],
    portraitPrompt: "Expedition photographer, early 30s, wiry and alert, cinematic alpine light",
    portraitImage: "/portraits/ascent/dev.jpg",
    accentColor: "#fb923c",
    baselineDemeanor: "guarded",
    freeformEnabled: true,
    introHook: "Sponsor's rep and the expedition's photographer. Needs a shot. Says the numbers still look fine.",
    deflections: [
      "Not sure what you mean by that.",
      "I don't think that's really my call to make.",
      "Ask me something about the climb — I'm not sure what that was.",
    ],
    defensiveLines: [
      "I'm not hiding anything by saying what I actually believe.",
      "That's not fair. I'm doing my job, same as everyone else up here.",
      "I don't think that's a fair thing to accuse me of right now.",
    ],
    demeanorLines: {
      guarded: "He's quick to answer, a little too quick — like he's already decided what he's willing to say.",
      defensive: "His jaw's tight. He's decided this is an attack.",
      nervous: "He keeps glancing at his device instead of at you.",
      shaken: "Whatever just landed, he's not brushing it off this time.",
    },
    topics: [
      {
        id: "your_role",
        chipLabel: "What's your role on this expedition?",
        keywords: ["role", "job", "sponsor", "photographer", "here for", "what do you do", "your job"],
        stages: [
          {
            text: "Officially? Documentation — stills and video for the sponsor. Unofficially, I'm also the one who has to go home and explain it if we don't get a summit shot this season.",
            demeanor: "guarded",
          },
        ],
      },
      {
        id: "weather_models",
        chipLabel: "What are the weather models actually showing?",
        keywords: ["weather", "models", "forecast", "storm", "data", "satellite", "numbers", "window", "how much time"],
        stages: [
          {
            text: "Comfortable window. A couple of hours before anything serious moves in. I checked it myself before we left camp this morning.",
            demeanor: "guarded",
            addsBoardEntries: [{ type: "claim", text: "Dev: claims the weather models show a roughly 2-hour window before the storm.", source: "dev", timestamp: "this morning" }],
          },
        ],
      },
      {
        id: "the_shot",
        chipLabel: "How important is this shot, really?",
        keywords: ["shot", "photo", "photos", "video", "sponsor", "funding", "important", "why does it matter"],
        stages: [
          {
            text: "Honestly? Very. Next year's program funding is tied to this expedition delivering something usable. That's not just me — that's a few other people's jobs back home who aren't up here freezing.",
            demeanor: "guarded",
            addsBoardEntries: [{ type: "claim", text: "Dev: next year's sponsor funding depends on a usable summit shot from this trip.", source: "dev" }],
          },
        ],
      },
      {
        id: "the_stop",
        chipLabel: "How long would the photo stop actually take?",
        keywords: ["stop", "how long", "time", "photo stop", "extra time", "video", "shoot"],
        stages: [
          {
            text: "Thirty, forty minutes, if I do it properly — summit shots, a bit of video for the sponsor reel. I know that's not nothing. I think it's worth it.",
            demeanor: "guarded",
            addsBoardEntries: [{ type: "claim", text: "Dev: the full photo/video stop he wants would cost roughly 40 extra minutes.", source: "dev" }],
          },
        ],
      },
      {
        id: "soren_history",
        chipLabel: "Soren seems to have a problem with you specifically. Why?",
        keywords: ["soren", "problem", "tension", "dislike", "uneasy", "why does he", "hostile", "cold toward you"],
        stages: [
          {
            text: "I genuinely don't know. He's been short with me since we left base camp. Maybe he just doesn't like sponsor reps. Wouldn't be the first.",
            demeanor: "guarded",
          },
        ],
      },
      {
        id: "real_weather",
        chipLabel: "Is there a more recent satellite update you haven't shared?",
        keywords: ["real weather", "recent update", "hiding", "satellite data", "actual data", "more recent", "true forecast", "lying about", "the real numbers"],
        stages: [
          {
            text: "What? No — that's what I've got. That's the same feed everyone's looking at.",
            demeanor: "defensive",
          },
          {
            text: "...Fine. There was a later pass, about forty minutes ago. It's worse — the window's smaller than I said. I didn't lie, exactly. I just didn't correct it when I should have.",
            requiresEvidence: ["E06_radio_transcript"],
            presentedText:
              "...The radio transcript. Right. Yes — there was a later pass, about forty minutes ago. It's worse than what I told everyone. I didn't correct it when I should have.",
            altUnlock: { requiresRelayed: ["felix_story"], requiresIntent: ["empathetic_appeal"] },
            altUnlockText:
              "...God. Soren told you about that? ...Okay. There's a later satellite pass, about forty minutes ago. It's worse than what I told everyone. I didn't want to be the reason we turned back, not after what happened to his friend. I convinced myself the old numbers were close enough. They're not.",
            demeanor: "shaken",
            addsBoardEntries: [
              {
                type: "contradiction",
                text: "Dev's shared weather data was out of date — a worse, more recent satellite pass puts the real storm ETA much sooner than he claimed.",
                source: "dev",
              },
            ],
          },
        ],
      },
      {
        id: "the_deal",
        chipLabel: "Will you skip the extended photo stop if it means getting everyone down safely?",
        keywords: ["skip the", "extended photo stop", "down safely", "give up the shot", "abandon the shoot", "deal", "commit", "drop the photo", "no stop"],
        stages: [
          {
            text: "Why would I agree to that? We came up here for the shot.",
            demeanor: "defensive",
          },
          {
            text: "...Fine. If it's that tight, I'm not going to be the reason someone gets hurt over a photo. No stop. We get whatever we can from the summit itself if there's time, and we come straight back down.",
            requiresWitnessStage: { witness: "dev", topic: "real_weather", minStage: 1 },
            demeanor: "shaken",
            addsBoardEntries: [{ type: "claim", text: "Dev agrees to abandon the extended photo/video stop.", source: "dev" }],
          },
        ],
      },
    ],
    reactions: {
      rae_condition: {
        text: "...That's not something I knew. That actually makes me want the shot a lot less, if I'm honest. I didn't realize what pushing fast might actually cost her, specifically.",
        demeanor: "shaken",
        addsBoardEntries: [{ type: "claim", text: "Dev, told about Rae's heart condition: reconsiders how much the shot is actually worth.", source: "dev" }],
      },
    },
  },

  // ───────────────────────────── SOREN ─────────────────────────────
  {
    id: "soren",
    name: "Soren Lindqvist",
    role: "Second-most experienced climber — safety officer",
    age: 44,
    context:
      "Safety officer for this expedition. Pushing hard for retreat, citing protocol. Carries quiet blame from a different expedition, three years ago, that went wrong the same way.",
    keyFacts: [
      "Safety officer and second-most experienced climber on the team",
      "Pushes hard for retreat, citing standard protocol",
      "Was safety officer on a different expedition where a teammate was badly hurt",
    ],
    portraitPrompt: "Weathered safety officer, mid-40s, tense and watchful, cinematic alpine light",
    portraitImage: "/portraits/ascent/soren.jpg",
    accentColor: "#a78bfa",
    baselineDemeanor: "guarded",
    freeformEnabled: true,
    introHook: "Safety officer. Wants to turn back now — and has a reason he hasn't said out loud.",
    deflections: [
      "Not sure that's relevant to the decision in front of us.",
      "I don't know what you want me to say to that.",
      "Let's stay focused on what actually matters right now.",
    ],
    defensiveLines: [
      "I'm not going to apologize for being careful. That's literally my job.",
      "That's not fair. I'm trying to keep this team alive.",
      "Don't put words in my mouth. I've told you what I think.",
    ],
    demeanorLines: {
      guarded: "He answers carefully, like every word's already been weighed once before it leaves his mouth.",
      nervous: "Something you said actually got past his guard.",
      shaken: "Whatever that was, it reached something he doesn't usually let show.",
      composed: "He's settled, like a decision just got easier.",
    },
    topics: [
      {
        id: "your_call",
        chipLabel: "Why do you think we should turn back?",
        keywords: ["turn back", "retreat", "why", "protocol", "safety", "your call", "your reasoning"],
        stages: [
          {
            text: "Because the smart move, every time, is to respect a closing window you can't fully predict. I've seen what happens when people push past the point where turning back is still easy.",
            demeanor: "guarded",
          },
        ],
      },
      {
        id: "protocol",
        chipLabel: "What does standard protocol actually say here?",
        keywords: ["protocol", "standard", "rule", "procedure", "guideline", "by the book"],
        stages: [
          {
            text: "Rule of thumb: if there's real uncertainty about the storm's timing, you don't gamble the summit against it. We don't have certainty right now. That's reason enough for me.",
            demeanor: "guarded",
          },
        ],
      },
      {
        id: "felix_incident",
        chipLabel: "Has something like this happened before, on another trip?",
        keywords: ["before", "happened", "past", "other expedition", "history", "felix", "previous trip", "another time"],
        stages: [
          {
            text: "Three years ago. Different mountain, different team. We pushed for a summit shot the sponsor wanted, past when we should have turned back. A teammate of mine — Felix — lost three fingers to frostbite because of it.",
            demeanor: "guarded",
            addsBoardEntries: [{ type: "claim", text: "Soren: three years ago, a sponsor-driven push past the turnaround cost a teammate, Felix, three fingers to frostbite.", source: "soren" }],
          },
          {
            text: "I was the safety officer on that trip too. I had doubts and I didn't push hard enough on them. I told myself it wasn't really my call to make. It was. I've never really forgiven myself for that.",
            minAskCount: 2,
            demeanor: "shaken",
            addsBoardEntries: [{ type: "claim", text: "Soren admits he was safety officer during Felix's accident and has carried guilt for not pushing harder.", source: "soren" }],
          },
        ],
      },
      {
        id: "dev_suspicion",
        chipLabel: "Do you think Dev is hiding something?",
        keywords: ["dev", "suspect", "hiding", "trust", "weather data", "pressure", "shading the numbers"],
        stages: [
          {
            text: "I don't have proof of anything. I just — recognize the shape of this. Sponsor rep, rosy numbers, a push that conveniently lines up with what he needs. I've seen that movie before.",
            demeanor: "guarded",
          },
        ],
      },
      {
        id: "mei_relationship",
        chipLabel: "How are things between you and Mei?",
        keywords: ["mei", "relationship", "between you", "awkward", "tension", "dating", "together", "history"],
        stages: [
          {
            text: "Fine. Professional.",
            demeanor: "guarded",
          },
          {
            text: "...We were together, for a while, before this trip. It ended a few months ago. Not well, on my end. It's been strange, working this closely with her since.",
            minAskCount: 2,
            demeanor: "nervous",
            addsBoardEntries: [{ type: "claim", text: "Soren admits he and Mei were together before this expedition; it ended badly on his end.", source: "soren" }],
          },
        ],
      },
      {
        id: "rae_and_push",
        chipLabel: "What's your honest read on Rae's judgment here?",
        keywords: ["rae", "judgment", "trust rae", "rae's call", "read on rae", "is rae objective"],
        stages: [
          {
            text: "She's the best climber any of us will ever work with. That's not in question. But I don't think she's being purely objective right now, and I can't tell you exactly why — just a feeling.",
            demeanor: "guarded",
          },
        ],
      },
      {
        id: "conditional_support",
        chipLabel: "Would you back a plan to push with a hard turnaround deadline?",
        keywords: ["back the plan", "support", "bounded push", "turnaround deadline", "would you agree", "compromise", "get behind"],
        stages: [
          {
            text: "Not as it stands. Not unless something actually changes — the numbers, or how this team's handling the pressure.",
            demeanor: "guarded",
          },
          {
            text: "...If Dev's actually willing to walk away from the shot, that's something. That's the exact kind of pressure that got Felix hurt, gone. I could support a bounded push, if that's real.",
            altUnlock: { requiresRelayed: ["dev_agreed_to_skip_stop"], requiresIntent: ["general_question", "evidence_challenge", "empathetic_appeal"] },
            altUnlockText:
              "...If Dev's actually willing to walk away from the shot, that's something. That's the exact kind of pressure that got Felix hurt, gone. I could support a bounded push, if that's real.",
            demeanor: "nervous",
            addsBoardEntries: [{ type: "claim", text: "Soren conditionally backs a bounded push, now that Dev has agreed to drop the photo stop.", source: "soren" }],
          },
          {
            text: "...And if Rae's agreed to not force her own pace past what's safe for her — yeah. That changes my read too. I could get behind a disciplined push.",
            altUnlock: { requiresRelayed: ["rae_agreed_to_pace_plan"], requiresIntent: ["general_question", "evidence_challenge", "empathetic_appeal"] },
            altUnlockText:
              "...And if Rae's agreed to not force her own pace past what's safe for her — yeah. That changes my read too. I could get behind a disciplined push.",
            demeanor: "composed",
            addsBoardEntries: [{ type: "claim", text: "Soren's support firms up further, now that Rae's own pace is accounted for too.", source: "soren" }],
          },
          {
            text: "...Mei said that? ...Actually, that lands harder than any of the numbers have. If she's thinking for herself instead of just following Rae, maybe I've been the stubborn one here. Fine — I'll back a bounded push, with a hard turnaround.",
            altUnlock: { requiresRelayed: ["mei_independent_view"], requiresIntent: ["general_question", "evidence_challenge", "empathetic_appeal"] },
            altUnlockText:
              "...Mei said that? ...Actually, that lands harder than any of the numbers have. If she's thinking for herself instead of just following Rae, maybe I've been the stubborn one here. Fine — I'll back a bounded push, with a hard turnaround.",
            demeanor: "composed",
            addsBoardEntries: [{ type: "claim", text: "Soren fully backs the bounded push — moved less by the numbers than by Mei forming her own view.", source: "soren" }],
          },
        ],
      },
    ],
    reactions: {
      rae_condition: {
        text: "...That explains some of it, actually. Doesn't change my math much. If anything, it makes turning back — or at least slowing way down — the obvious call.",
        demeanor: "guarded",
        addsBoardEntries: [{ type: "claim", text: "Soren, told about Rae's condition: unsurprised there was something, reinforces caution.", source: "soren" }],
      },
      dev_real_weather: {
        text: "I knew it. I knew something was off with those numbers. Doesn't make me feel better, knowing I was right.",
        demeanor: "shaken",
        addsBoardEntries: [{ type: "claim", text: "Soren, told Dev's real weather data: his suspicion is confirmed.", source: "soren" }],
      },
    },
  },

  // ───────────────────────────── MEI ─────────────────────────────
  {
    id: "mei",
    name: "Mei Tanaka",
    role: "Newest full team member — defers to Rae's read",
    age: 26,
    context:
      "The team's youngest and newest full member. Idolizes Rae and generally defers to her judgment. Something unresolved with Soren colors more of her position than she's said out loud.",
    keyFacts: [
      "Newest full member of the team and its youngest climber",
      "Generally defers to Rae's judgment, leans toward pushing",
      "Something unresolved with Soren shapes more than it looks like",
    ],
    portraitPrompt: "Young climber, mid-20s, earnest and a little tense, cinematic alpine light",
    portraitImage: "/portraits/ascent/mei.jpg",
    accentColor: "#4ade80",
    baselineDemeanor: "guarded",
    freeformEnabled: true,
    introHook: "The newest full member of the team. Mostly agrees with whatever Rae says — mostly.",
    deflections: [
      "I'm not totally sure what you're asking.",
      "I don't know, honestly — maybe ask one of the others?",
      "Sorry, can you ask that differently?",
    ],
    defensiveLines: [
      "That's not fair. I'm just trying to help, same as everyone else.",
      "I don't think I deserve that — I'm doing my best here.",
      "Please don't talk to me like that. I'm on your side.",
    ],
    demeanorLines: {
      guarded: "She answers quickly, a little too eager to agree with wherever the question seems to be pointing.",
      nervous: "She's picking at her glove liner, not quite looking at you.",
      shaken: "That actually got to her — you can see her reconsidering something in real time.",
    },
    topics: [
      {
        id: "your_view",
        chipLabel: "What do you think we should do?",
        keywords: ["think", "view", "opinion", "what should we do", "your take"],
        stages: [
          {
            text: "I trust Rae's read on this. She's been doing this longer than any of us. If she says we push, I push.",
            demeanor: "guarded",
          },
        ],
      },
      {
        id: "rae_trust",
        chipLabel: "Why do you trust Rae so much?",
        keywords: ["trust rae", "why", "idolize", "admire", "rae", "look up to"],
        stages: [
          {
            text: "She's the reason I even got a spot on a team like this. She's taught me more in one season than I learned in years of guiding smaller stuff. I'd be an idiot not to trust her judgment.",
            demeanor: "guarded",
          },
        ],
      },
      {
        id: "soren_tension",
        chipLabel: "Things seem tense between you and Soren. What's going on?",
        keywords: ["soren", "tense", "tension", "awkward", "between you", "history", "weird with him"],
        stages: [
          {
            text: "It's nothing. We're both just focused on the climb.",
            demeanor: "guarded",
          },
          {
            text: "...Fine. We were together, before this trip. I ended it. It wasn't him — I just wasn't where he was, and I didn't want to keep pretending otherwise. It's been awkward since, obviously.",
            minAskCount: 2,
            demeanor: "nervous",
            addsBoardEntries: [{ type: "claim", text: "Mei admits she and Soren were together before this trip; she ended it.", source: "mei" }],
          },
        ],
      },
      {
        id: "deferring",
        chipLabel: "Do you ever disagree with Rae?",
        keywords: ["ever disagree", "disagree with rae", "own opinion", "independent", "think for yourself", "ever differ"],
        stages: [
          {
            text: "Not really, no. I mean — maybe sometimes, small things. Nothing worth making a thing out of.",
            demeanor: "guarded",
          },
        ],
      },
      {
        id: "final_call",
        chipLabel: "If it were only up to you, what would you do?",
        keywords: ["final call", "your call", "decide", "what would you do", "your decision"],
        stages: [
          {
            text: "I'd go with whatever Rae decides. I don't think I'm the one who should be making this call.",
            demeanor: "guarded",
          },
          {
            text: "...Actually — no. Hearing that about Rae, I don't think I can just say \"whatever Rae wants\" anymore. I think the shot has to go, whatever anyone decided about it. And if there's real doubt about the time, we shouldn't be pushing at all costs. That's actually what I think — not just an echo of her.",
            altUnlock: { requiresRelayed: ["rae_condition"], requiresIntent: ["empathetic_appeal", "general_question"] },
            altUnlockText:
              "...Actually — no. Hearing that about Rae, I don't think I can just say \"whatever Rae wants\" anymore. I think the shot has to go, whatever anyone decided about it. And if there's real doubt about the time, we shouldn't be pushing at all costs. That's actually what I think — not just an echo of her.",
            demeanor: "shaken",
            addsBoardEntries: [{ type: "claim", text: "Mei forms her own independent view instead of deferring to Rae, once she learns about Rae's condition.", source: "mei" }],
          },
        ],
      },
    ],
    reactions: {
      rae_condition: {
        text: "...Wait, she has a WHAT? ...Okay. Okay, that actually changes how I feel about this, a lot. I don't think I can just say 'whatever Rae wants' anymore, knowing that.",
        demeanor: "shaken",
        addsBoardEntries: [{ type: "claim", text: "Mei, told about Rae's heart condition: visibly shaken, starts separating her own judgment from automatic deference.", source: "mei" }],
      },
    },
  },
];

export const WITNESS_BY_ID: Record<string, WitnessConfig> = Object.fromEntries(WITNESSES.map((w) => [w.id, w]));
export const EVIDENCE_BY_ID: Record<string, EvidenceItem> = Object.fromEntries(EVIDENCE.map((e) => [e.id, e]));

/**
 * Six facts worth relaying — three are the causal-web "secrets" (felix_story,
 * dev_real_weather, rae_condition), three are COMMITMENTS a witness just
 * made, which matter enough to tell a third party about (see
 * conditional_support's three altUnlock stages on Soren, above). A
 * commitment becoming "known" works identically to any other revelation —
 * same derived stage-reach check, nothing new to keep in sync.
 */
export const REVELATIONS: Record<RevelationId, RevelationDef> = {
  felix_story: {
    id: "felix_story",
    label: "Three years ago, a sponsor-driven push cost a teammate three fingers to frostbite.",
    source: { witness: "soren", topic: "felix_incident", minStage: 0 },
  },
  dev_real_weather: {
    id: "dev_real_weather",
    label: "Dev's real weather data is worse than what he's been sharing — the window is tighter than claimed.",
    source: { witness: "dev", topic: "real_weather", minStage: 1 },
  },
  rae_condition: {
    id: "rae_condition",
    label: "Rae has a heart arrhythmia she's told no one about — a forced fast pace is a real risk for her.",
    source: { witness: "rae", topic: "heart_condition", minStage: 1 },
  },
  dev_agreed_to_skip_stop: {
    id: "dev_agreed_to_skip_stop",
    label: "Dev agreed to abandon the extended photo/video stop.",
    source: { witness: "dev", topic: "the_deal", minStage: 1 },
  },
  rae_agreed_to_pace_plan: {
    id: "rae_agreed_to_pace_plan",
    label: "Rae agreed to a pace that protects her own safety, rather than pushing blind.",
    source: { witness: "rae", topic: "pace_agreement", minStage: 1 },
  },
  mei_independent_view: {
    id: "mei_independent_view",
    label: "Mei formed her own independent view, instead of just deferring to Rae.",
    source: { witness: "mei", topic: "final_call", minStage: 1 },
  },
};

// ───────────────────────────── Intro / reveal cinematics ─────────────────

export const CASE_INTRO_SLIDES: IntroSlide[] = [
  { image: "/scenes/ascent/ridge.jpg", line: "Ingrid just fell." },
  { image: "/scenes/ascent/ridge.jpg", line: "She's stable, short-roped down to a lower camp. Out of the decision." },
  { image: "/scenes/ascent/ridge.jpg", line: "Before she went down, she gave the call to you. Not Rae. Not Soren. You." },
  { image: "/scenes/ascent/ridge.jpg", line: "A storm is closing on the summit ridge. Nobody fully agrees on how much time that actually leaves." },
  { image: "/scenes/ascent/ridge.jpg", line: "Five people are on this mountain. Not everyone's told you everything yet." },
  { image: "/scenes/ascent/ridge.jpg", line: "What the team does next, and how much you find out first, is up to you." },
];

export const CHARACTER_INTRO_OUTRO: IntroSlide = {
  image: "/scenes/ascent/ridge.jpg",
  line: "Nobody up here has the full picture. Including, maybe, you.",
};

export const REVEAL_SLIDES: IntroSlide[] = [
  { image: "/scenes/ascent/rae.jpg", eyebrow: "Rae Ninsiima", line: "She wanted this summit more than she ever said out loud." },
  { image: "/scenes/ascent/dev.jpg", eyebrow: "Dev Kapoor", line: "He had the real numbers the whole time. He just didn't lead with them." },
  { image: "/scenes/ascent/soren.jpg", eyebrow: "Soren Lindqvist", line: "He'd seen this exact shape before. That's exactly why he dug in." },
  { image: "/scenes/ascent/window.jpg", title: "The real window", line: "75 minutes. Not two hours. Not \"any minute now.\"" },
  { image: "/scenes/ascent/decided.jpg", title: "What actually decided it", line: "Not the mountain. What you found out — and what you actually got people to agree to." },
];

/** "Things that could mislead you" — this case's equivalent of Case 002's misleading-signals list. */
export const MISLEADING_SIGNALS: string[] = [
  "Dev's calm, confident \"comfortable window\" claim sounds authoritative — it was simply out of date, not a lie from the start.",
  "Soren's hostility toward Dev reads as personal or paranoid — it's his own unhealed guilt from Felix's accident, projected forward onto a situation that rhymes with it.",
  "Mei's constant deferral to Rae looks like inexperience or naivety — it's partly about avoiding taking a side against Soren, not really about trusting Rae's judgment specifically.",
];

// ───────────────────────────── Verdict ─────────────────────────────────
//
// A single action-axis, not a knowledge quiz: the player picks a PLAN, and
// it's resolved against what was actually discovered, which commitments
// were actually secured, and how much fictional time was actually left —
// never against whether they merely "knew" something. See
// buildVerdictContext/judge/buildRevealNarrative below.

export const VERDICT_AXES: VerdictAxis[] = [
  {
    id: "call",
    question: "What's the call?",
    shortLabel: "The call",
    options: [
      { id: "push", label: "Push for the summit" },
      { id: "push_deadline", label: "Push, with a hard turnaround deadline" },
      { id: "retreat", label: "Retreat now" },
    ],
  },
];

export interface AscentContext {
  devRealWeatherKnown: boolean;
  raeConditionKnown: boolean;
  felixStoryKnown: boolean;
  devCommitted: boolean;
  raeCommitted: boolean;
  sorenSupports: boolean;
  minutesRemaining: number | null;
}

interface AscentStateSlice {
  witnessStages: Record<string, Record<string, number>>;
  minutesRemaining: number | null;
}

/** Everything here is DERIVED from real stage-reach state — never a separate flag, never trusting a player's unverified claim that someone "agreed" to anything. */
export function buildVerdictContext(state: AscentStateSlice): AscentContext {
  const reached = (witnessId: string, topicId: string, minStage = 1) => (state.witnessStages[witnessId]?.[topicId] ?? -1) >= minStage;
  return {
    devRealWeatherKnown: reached("dev", "real_weather"),
    raeConditionKnown: reached("rae", "heart_condition"),
    felixStoryKnown: reached("soren", "felix_incident", 0),
    devCommitted: reached("dev", "the_deal"),
    raeCommitted: reached("rae", "pace_agreement"),
    sorenSupports: reached("soren", "conditional_support"),
    minutesRemaining: state.minutesRemaining,
  };
}

/** A disciplined push (no indulgent stop) vs. a plain push that lets Dev's stop stand unless he's already agreed to drop it. Matches GROUND_TRUTH.theMath exactly. */
const BASE_CLIMB_MINUTES = 30;
const INDULGENT_STOP_MINUTES = 40;

function requiredMinutesFor(plan: string, ctx: AscentContext): number {
  if (plan === "retreat") return 0;
  if (plan === "push_deadline") return BASE_CLIMB_MINUTES; // the deadline itself forces the disciplined profile
  return ctx.devCommitted ? BASE_CLIMB_MINUTES : BASE_CLIMB_MINUTES + INDULGENT_STOP_MINUTES;
}

/** A player's own CLAIM that a witness "agreed" never counts — this only ever reads ctx, which is itself only ever derived from validated stage-reach state. */
function resolvePlan(plan: string, ctx: AscentContext): { timeOk: boolean; raeSafe: boolean } {
  const minsLeft = ctx.minutesRemaining ?? 0;
  if (plan === "retreat") return { timeOk: true, raeSafe: true };
  return { timeOk: minsLeft >= requiredMinutesFor(plan, ctx), raeSafe: ctx.raeCommitted };
}

export const VERDICT_CONFIG: VerdictGradingConfig<AscentContext> = {
  axes: VERDICT_AXES,
  judge: (axisId, chosen, ctx): Judgment => {
    if (axisId !== "call") return "wrong";
    if (chosen === "retreat") {
      const couldHaveGoneSafely = (ctx.minutesRemaining ?? 0) >= BASE_CLIMB_MINUTES && ctx.devCommitted && ctx.raeCommitted;
      return couldHaveGoneSafely ? "insufficient" : "correct";
    }
    const { timeOk, raeSafe } = resolvePlan(chosen, ctx);
    return timeOk && raeSafe ? "correct" : "wrong";
  },
  headlines: {
    correct: "The call held up — and you'd done enough of the actual work to deserve that.",
    wrong: "The plan didn't survive contact with the mountain.",
    insufficient: "You played it safer than the situation actually demanded, by the time you decided.",
  },
};

export const VERDICT_REVEAL_NOTES: Record<string, Record<string, string>> = {
  call: {
    push: "You pushed for the summit, full stop — no explicit turnaround commitment.",
    push_deadline: "You pushed, but bound the team to a hard turnaround deadline first.",
    retreat: "You called it off and took the team back down.",
  },
};

/** Grounded entirely in the real playthrough via `ctx` — nothing here is invented, including the "lucky vs. sound" distinction. */
export function buildRevealNarrative(
  state: AscentStateSlice,
  verdict: PlayerVerdict,
  graded: GradedVerdict
): RevealNarrative {
  const ctx = buildVerdictContext(state);
  const chosen = verdict.choices["call"];
  const judgment = graded.axisGrades.find((g) => g.axisId === "call")?.judgment;
  const minsLeft = ctx.minutesRemaining ?? 0;

  const discovered: string[] = [
    ctx.devRealWeatherKnown
      ? "You got Dev to admit his satellite data was worse than he'd been sharing."
      : "You never got Dev to admit his weather numbers were out of date — the team only ever had his word for it.",
    ctx.raeConditionKnown
      ? "You learned about Rae's heart condition."
      : "You never learned about Rae's heart condition — nothing in the climb forced it into the open.",
  ];
  if (ctx.felixStoryKnown) discovered.push("You heard Soren's account of what happened to his teammate Felix, three years ago.");

  const changed: string[] = [];
  if (ctx.devCommitted) changed.push("Dev abandoned the extended photo/video stop after your conversation, leaving real time in reserve.");
  if (ctx.raeCommitted) changed.push("Rae agreed to a pace that protected her own safety, rather than pushing blind on your word alone.");
  if (ctx.sorenSupports) changed.push("Soren came around to backing a bounded plan, rather than holding out for a full retreat.");
  if (changed.length === 0) changed.push("No one actually changed position before the decision — every public stance was exactly where it had started.");

  const outcome: string[] = [];
  if (chosen === "retreat") {
    outcome.push(
      judgment === "insufficient"
        ? "You had the time, Dev's stop off the table, and Rae's pace accounted for — and still chose not to push. A safe call, but not the one the evidence actually supported by then."
        : "Given what was actually secured by the time you decided, retreating was the sound, defensible choice — a correctly read mountain, not a wasted climb."
    );
  } else {
    const required = requiredMinutesFor(chosen, ctx);
    const { timeOk, raeSafe } = resolvePlan(chosen, ctx);
    if (timeOk && raeSafe) {
      outcome.push(`With about ${minsLeft} minutes left against a climb that needed roughly ${required}, the push fit inside the real window.`);
      if (!ctx.devRealWeatherKnown) outcome.push("You never actually confirmed the real numbers before committing, though — this worked, but you were deciding on faith, not evidence.");
      if (!ctx.sorenSupports) outcome.push("Soren never actually got on board — the plan worked, but you pushed without the full team behind it.");
    } else if (!timeOk) {
      outcome.push(`The math didn't work: about ${minsLeft} minutes left against a climb that needed roughly ${required}. The storm caught up with the plan, not just the mountain.`);
    } else {
      outcome.push(
        "The timing held, but Rae's pace was never actually protected — pushing fast with an unresolved heart condition in the group is exactly the risk that was there to be managed, and wasn't."
      );
    }
  }

  return {
    before: [GROUND_TRUTH.theWindow, GROUND_TRUTH.theMath, GROUND_TRUTH.raesRisk],
    discovered,
    changed,
    outcome,
  };
}
