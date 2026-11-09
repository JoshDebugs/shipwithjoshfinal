/** Every readable line in the world, with the progress window it owns. */
import { B, SETS } from "./timeline";

export type Caption = {
  /** Small HUD line above the sentence. */
  tag: string;
  line: string;
  /** Fade in over [a, b], out over [c, d]. */
  at: readonly [number, number, number, number];
};

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const HEADLINE = "Built the body too.";
export const SUBJECT = "SUBJECT: JOSH · AGE 18";
export const HINT = "Touch anything. You'll leave a mark.";
export const AGAIN = ["Again.", "Again.", "Again."] as const;
export const LOCKOUT = "No before-and-after pics. Just the heat signature.";
export const VISIBLE_NOTE = "Visible light: a guy and a barbell. Thermal: everything else.";

export const CAPTIONS: readonly Caption[] = [
  { tag: "SENSOR LIVE", line: HINT, at: [B.hintA, B.hintB, B.hintC, B.hintD] },
  ...SETS.map(
    (s): Caption => ({
      tag: `SET ${s.n} · ${s.word}`,
      line: `${sentence(s.line)}`,
      at: [s.a + 0.012, s.a + 0.03, s.b - 0.024, s.b - 0.006],
    }),
  ),
  { tag: "LOCKOUT", line: LOCKOUT, at: [0.852, 0.872, 0.93, 0.95] },
];

/** Word-only temperature readout at the reticle. */
export function readingWord(t: number) {
  if (t < 0.2) return "COLD";
  if (t < 0.34) return "COOL";
  if (t < 0.5) return "WARMING";
  if (t < 0.72) return "WORKING";
  if (t < 0.93) return "HOT";
  return "WHITE-HOT";
}
