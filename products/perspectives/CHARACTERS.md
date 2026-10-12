# CHARACTERS — Case 002: "The Last Message"

Per-character reference: agenda, fears, knowledge boundaries, and
(labeled **FUTURE/PROPOSED**, not implemented) plausible reasons each
character might initiate contact with the player. Grounded in what's
actually authored in `src/game/case002.ts` and `api/witness-chat.ts`'s
`CHARACTER_CONTEXT` — nothing here is a new canonical fact; where a field
required inference beyond the authored text, it's marked as such.

## Elena Rossi — the defendant

- **Role / relationship:** Daniel's former partner of ~6 years; the one
  formally charged.
- **Knowledge boundary:** Knows her own argument with Daniel and that she
  left him alive ~23:52. Does **not** know Sofia or Tom returned afterward
  unless the player relays it.
- **Agenda:** Be believed that she left him alive and that her fingerprints
  on the knife have an unrelated explanation — not be reduced to "jealous
  ex, present, violent, done" just because she's the easiest suspect.
- **Fears:** Being convicted for something she didn't do simply because
  she was there; a shove read as a prelude to murder rather than what it
  was (her trying to leave).
- **FUTURE/PROPOSED — initiative:** Highest stakes of anyone in the case,
  which argues for low spontaneous initiative (she's the most exposed by
  speaking first) but strong reactive initiative if her credibility is
  directly attacked (e.g. after Sofia's "unstable" framing lands, or if
  the player seems convinced she's guilty).

## Sofia Mendes — Daniel's girlfriend

- **Role / relationship:** Dating Daniel ~5 months; told he was fully "in
  the past" with Elena.
- **Knowledge boundary:** Knows Daniel told her the truth about Elena
  during her own visit, and that she left him alive ~23:57. Does not know
  what happened after — including Tom's return — unless relayed.
- **Agenda:** Not be the last name standing in the apartment's timeline;
  be believed that her anger (grabbing his shirt, shouting) was anger, not
  violence.
- **Fears:** Being treated as suspicious simply for being the last person
  anyone can place with Daniel alive; her own hidden-contact lie (denying
  the 23:50 call) being read as guilt rather than self-preservation.
- **FUTURE/PROPOSED — initiative:** Highest of the five. A real candidate
  for "needs to correct something" proactive contact once her 23:50 call
  is on record and she knows the player has it — matches the already-
  authored `contact_after_text` contradiction beat exactly, just surfaced
  proactively instead of waiting to be asked.

## Tom Becker — Daniel's close friend

- **Role / relationship:** ~9 years' friendship; repeatedly warned Daniel
  to stop stringing both women along.
- **Knowledge boundary:** Knows he returned and what actually happened
  with the knife. Does not know what Elena and Daniel discussed, or what
  Sofia and Daniel discussed, beyond what's relayed to him.
- **Agenda:** Be believed it was an accident; not become the simple,
  convenient story ("Tom panicked, so Tom must be guilty").
- **Fears:** Being isolated as the only account the player has to take on
  faith; fleeing without helping being read as proof of guilt rather than
  panic.
- **FUTURE/PROPOSED — initiative:** Low initially, rising as the
  investigation closes in — matches the spec's "before you draw
  conclusions, we should talk" framing. Should read as potentially
  self-serving, not purely confessional, if built.

## Marco Costa — Daniel's brother

- **Role / relationship:** Not a suspect; knew Daniel's character better
  than anyone (habitual conflict-avoidance, lying to keep the peace).
- **Knowledge boundary:** Not present that night. Knows Daniel called him
  at 23:34, stressed. Everything else is secondhand impression.
- **Agenda** (inferred from his authored topics, not explicit in
  `CHARACTER_CONTEXT` since he's not `freeformEnabled`): Prevent Daniel's
  character from being flattened into a false narrative — specifically,
  pushes back gently on "Elena was dangerous" and "Daniel was afraid of
  her" framings he doesn't recognize.
- **Fears:** None authored explicitly — grief, understated, is his
  dominant authored tone (`demeanorImages.shaken`).
- **FUTURE/PROPOSED — initiative:** Moderate. The spec's proposed trigger
  (contact the player if Sofia's "dangerous Elena" framing becomes
  dominant) is plausible and consistent with his authored agenda above,
  but is a **new** trigger condition, not yet authored anywhere.

## Julia Ferrer — the neighbour

- **Role / relationship:** Lives across the hall; heard fragments through
  the wall. Not `freeformEnabled` — chip-only.
- **Knowledge boundary:** An honest but imprecise outside observer — her
  own authored stages repeatedly flag her uncertainty ("not very, if I'm
  honest... I wouldn't swear to the minute").
- **Agenda:** None authored — she has no stake in the outcome, which is
  deliberate (a neutral corroborating/complicating voice, not a party to
  the case).
- **Fears:** None authored.
- **FUTURE/PROPOSED — initiative:** Passive, by design — the spec is
  explicit that not every NPC should proactively contact the player, and
  Julia is the clearest candidate to stay fully reactive if that system is
  ever built.
