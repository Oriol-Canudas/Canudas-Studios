import { WITNESSES, CASE_INTRO_SLIDES, CHARACTER_INTRO_OUTRO } from "./caseData";
import type { IntroSlide } from "../components/IntroSequence";

export { CASE_INTRO_SLIDES };

/** Beat 2: meet the cast. Shown after "Begin the case," before the Hear tab. Each witness's own introHook — case-authored, not derived — plus the active case's closing beat. */
export const CHARACTER_INTRO_SLIDES: IntroSlide[] = [
  ...WITNESSES.map((w) => ({
    image: w.portraitImage,
    eyebrow: w.role,
    title: w.name,
    line: w.introHook ?? "",
  })),
  CHARACTER_INTRO_OUTRO,
];
