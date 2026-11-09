/** Repotted — words and type voices. Facts: 5 homes in 3 years; age 15. */

export const FRAUNCES = "var(--f-fraunces), Georgia, serif";
export const MONO = "var(--f-dm-mono), ui-monospace, monospace";
export const HAND = "var(--f-caveat), cursive";

export const HEADLINE = "5 homes in 3 years.";

/** Headline words per line (desktop two lines, phone three). */
export const HEAD_LINES = {
  desktop: [
    ["5", "homes"],
    ["in", "3", "years."],
  ],
  mobile: [["5", "homes"], ["in", "3"], ["years."]],
} as const;

export const CAPTIONS = ["Roots remember the shape of every pot.", "Droops after every move. Adjusts anyway."] as const;

export const QUOTE = ["Some years weren't about winning anything.", "Some years were just about adjusting."] as const;

export const TAG = {
  name: "JOSHMANN SINGH",
  age: "AGE 15",
  care: ["Hardy.", "Tolerates relocation."],
  note: "Drooped. Adjusted.",
} as const;
