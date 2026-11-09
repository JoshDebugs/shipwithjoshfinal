/** Type metrics and the shared layout switches for the DOM acts. */
import { clamp } from "@/components/life/multiverse/ease";

/** Print on top + copy below (phones and portrait tablets). */
export const isStacked = (W: number, H: number) => W < 768 || W / H < 1.02;

/** Scale for desktop layouts (1 at 1440×900). */
export const desk = (W: number, H: number) => clamp(Math.min(W / 1440, H / 900), 0.55, 1.35);
/** Scale for stacked layouts (1 at 390×844). */
export const phone = (W: number, H: number) => clamp(Math.min(W / 390, H / 760), 0.8, 1.9);

/** Big Shoulders 900, opsz 72: advance widths in em. */
export const EM: Record<string, number> = {
  "SO WHAT’S": 4.05,
  THE: 1.312,
  "PATTERN?": 3.629,
  "I KEEP": 2.233,
  TRYING: 2.587,
  "THINGS.": 2.894,
  CURIOSITY: 3.769,
  OBSESSION: 4.069,
  EXPERIMENTATION: 6.65,
  ADAPTABILITY: 4.979,
  BUILDING: 3.353,
};

/** Cap height of Big Shoulders in em. */
export const CAP = 0.8;

export const BIG = {
  fontFamily: "var(--f-big-shoulders)",
  fontWeight: 900,
  fontVariationSettings: '"opsz" 72',
} as const;

export const SERIF = { fontFamily: "var(--f-instrument)", fontStyle: "italic" as const, fontWeight: 400 };

export const MONO = {
  fontFamily: "var(--font-geist-mono)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
};
