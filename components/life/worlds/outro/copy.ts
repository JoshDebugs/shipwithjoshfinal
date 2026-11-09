/** Every line of the outro, shared by the film and the reduced-motion page. */
import type { MinutiaKind } from "./field";

export const TITLE = ["SO WHAT’S", "THE", "PATTERN?"] as const;
export const SUBJECT = "SUBJECT: JOSH · SCANNING…";
export const CHAOS = "Up close, it looks like chaos.";
export const MATCH = "PATTERN MATCH →";
export const HEADLINE = ["I KEEP", "TRYING", "THINGS."] as const;

export const DOMAINS = ["Sports", "Content", "Gaming", "Speaking", "Academics", "Building", "Business", "Design", "Technology"] as const;

export const HONEST = ["I don’t think I’m good at just one thing yet.", "Maybe that’s the point."] as const;

export type Value = { kind: MinutiaKind; minutia: string; name: string; line: string };

export const VALUES: Value[] = [
  { kind: "bifurcation", minutia: "Bifurcation", name: "CURIOSITY", line: "I like learning how different worlds work." },
  { kind: "lake", minutia: "Lake", name: "OBSESSION", line: "When something grabs me, I go deep." },
  { kind: "spur", minutia: "Spur", name: "EXPERIMENTATION", line: "I’d rather try than wonder." },
  { kind: "ending", minutia: "Ridge ending", name: "ADAPTABILITY", line: "I’ve had to restart more than once." },
  { kind: "island", minutia: "Island", name: "BUILDING", line: "Eventually, I stopped only consuming and started making." },
];

export const CURRENTLY = ["CS + AI/ML", "College", "Startups", "Building", "Learning", "Training"] as const;

export const NEXT = [
  "Build something people actually use",
  "Become technically dangerous",
  "Build companies",
  "Get better at everything that matters",
  "Create work I’m proud of",
] as const;

export const STORY = "The story isn’t done.";
export const BACK = "Back to home";
