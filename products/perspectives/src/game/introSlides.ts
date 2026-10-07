import { WITNESSES } from "./caseData";
import type { IntroSlide } from "../components/IntroSequence";

/** Beat 1: the mystery hook. Shown once per session, before the case file. */
export const CASE_INTRO_SLIDES: IntroSlide[] = [
  { image: "/scenes/home.jpg", line: "Daniel Costa is dead." },
  { image: "/scenes/evidence.jpg", line: "A single stab wound. No one saw the moment itself." },
  { image: "/scenes/evidence.jpg", line: "Three people visited his apartment that same night." },
  { image: "/portraits/elena.jpg", line: "One of them is on trial for his murder." },
  { image: "/portraits/elena.jpg", line: "Her prints are on the knife. The prosecution is already convinced." },
  { image: "/scenes/verdict.jpg", line: "But is that the whole story? You decide what really happened." },
];

/** Beat 2: meet the cast. Shown after "Begin the case," before the Hear tab. */
const HOOKS: Record<string, string> = {
  elena: "Together with Daniel for six years. Now the one everyone's looking at.",
  sofia: "Daniel's girlfriend of five months. Says she wasn't even here that night.",
  tom: "Daniel's closest friend — the one who kept telling him to come clean.",
  marco: "Daniel's older brother. Not a suspect. But he knew him best.",
  julia: "The neighbour across the hall. She heard everything — she's just not sure what she saw.",
};

export const CHARACTER_INTRO_SLIDES: IntroSlide[] = [
  ...WITNESSES.map((w) => ({
    image: w.portraitImage,
    eyebrow: w.role,
    title: w.name,
    line: HOOKS[w.id] ?? "",
  })),
  { image: "/scenes/evidence.jpg", line: "No one has the whole picture. You do — if you look hard enough." },
];
