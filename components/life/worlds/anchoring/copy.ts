/**
 * Every word in "Up To Eleven". Shared by the live world and the static
 * (reduced-motion) poster so the two can never drift apart.
 *
 * Facts (sacred): school anchor — stage host / emcee — in Grade 6 and Grade 7.
 * Headline: "MIC ON."
 */
export const COPY = {
  label: "01 — Anchoring · Age 11",
  whisper: "is this thing on?",
  tap: "tap.",
  grade6: "Grade 6: school anchor.",
  grade6Sub: "stage host · emcee",
  opener: "“Respected Principal, teachers and my dear friends—”",
  grade7: "Grade 7: encore.",
  grade7Sub: "back on the mic",
  inside: "Inside voice: uninstalled.",
  headline: "MIC ON.",
  headlineRows: ["MIC", "ON."] as const,
  age: "Age 11. Volume 11.",
  welcome: "Please welcome our next act…",
  /** Scrawled past the end of the knob's printed scale. The arrow is drawn, not typed. */
  scrawl: "11 ← (me)",
} as const;

/** Line breaks per layout. Phones get shorter rows so the type can stay loud. */
export const ROWS = {
  desktop: {
    grade6: [COPY.grade6],
    grade7: [COPY.grade7],
    inside: ["Inside voice:", "uninstalled."],
    opener: [COPY.opener],
    welcome: [COPY.welcome],
  },
  mobile: {
    grade6: ["Grade 6:", "school anchor."],
    grade7: ["Grade 7:", "encore."],
    inside: ["Inside", "voice:", "uninstalled."],
    opener: ["“Respected Principal,", "teachers and", "my dear friends—”"],
    welcome: ["Please welcome", "our next act…"],
  },
} as const;
