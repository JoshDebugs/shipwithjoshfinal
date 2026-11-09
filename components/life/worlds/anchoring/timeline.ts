/**
 * The beat sheet. Everything in the world is a pure function of `progress`
 * (scroll position ⇒ state, fully reversible). Time only adds ambient life:
 * the speaker pump, the breathing waveform, the meter flicker, the frame buzz.
 *
 *   0.00  title card — silence, knob at 0, "11 ← (me)" already scrawled
 *   0.045 tap.        0.08 tap.          (knob kicks 0 → 1 → 2)
 *   0.10  knob slides into the console, the meter wakes up
 *   0.17  Grade 6: school anchor.        (cobalt pass)
 *   0.29  the opener rides the swelling waveform (teal pass)
 *   0.49  Grade 7: encore.               (sun pass)
 *   0.57  Inside voice: uninstalled.     (frame buzz, knob grinds on 10)
 *   0.68  THE CLIP — pink floods, MIC ON. sliced by the rails, square wave
 *   0.74  Age 11. Volume 11.
 *   0.86  release — headroom opens, the emcee hands over
 *   0.89  Please welcome our next act…   (the skate rolls on stage)
 *   1.00  exit frame — the portal is born from the skate
 */
import { RISO, overprint } from "@/components/life/multiverse/palette";
import { backOut, easeInOutSine, expoOut, range, smoothstep } from "@/components/life/multiverse/ease";

export const T = {
  tap1: 0.045,
  tap2: 0.08,
  title: [0, 0.105] as const,
  knobToConsole: [0.1, 0.2] as const,
  slugDock: [0.095, 0.155] as const,
  consoleIn: [0.13, 0.22] as const,
  grade6: [0.17, 0.3] as const,
  cones: [0.18, 0.36] as const,
  opener: [0.285, 0.5] as const,
  grade7: [0.49, 0.585] as const,
  inside: [0.57, 0.684] as const,
  grind: [0.615, 0.68] as const,
  lineRise: [0.625, 0.678] as const,
  clip: 0.68,
  flood: [0.68, 0.716] as const,
  rings: [0.68, 0.82] as const,
  circle: [0.705, 0.75] as const,
  age: [0.736, 0.775] as const,
  hum: [0.775, 0.84] as const,
  release: [0.835, 0.872] as const,
  knobHome: [0.852, 0.93] as const,
  lineDrop: [0.858, 0.925] as const,
  micOut: [0.86, 0.93] as const,
  welcome: [0.885, 0.94] as const,
  skate: [0.9, 0.982] as const,
} as const;

/** The volume knob, 0 → 11, as a function of progress. */
export function volAt(p: number): number {
  if (p < T.tap1) return 0;
  if (p < T.tap2) return backOut(range(p, T.tap1, T.tap1 + 0.014), 2.2);
  if (p < 0.12) return 1 + backOut(range(p, T.tap2, T.tap2 + 0.014), 2.2);
  if (p < 0.285) return 2 + 0.8 * smoothstep(range(p, 0.12, 0.285));
  if (p < 0.5) return 2.8 + 4.2 * easeInOutSine(range(p, 0.285, 0.5));
  if (p < 0.615) return 7 + 2.6 * easeInOutSine(range(p, 0.5, 0.615));
  if (p < T.clip) return 9.6 + 0.4 * Math.pow(range(p, 0.615, T.clip), 1.6);
  return 10 + expoOut(range(p, T.clip, T.clip + 0.012));
}

/** Knob angle in degrees, clockwise from 12 o'clock. 0 → −140°, 10 → +140°, 11 → +168°. */
export const knobAngle = (vol: number) => -140 + 28 * vol;

/** The four ink passes, printed in order as the volume climbs. */
export const PASSES = [
  { name: "cobalt", ink: RISO.cobalt, from: 0.55, to: 3.3 },
  { name: "teal", ink: RISO.teal, from: 3.1, to: 7.2 },
  { name: "sun", ink: RISO.sun, from: 7.0, to: 10 },
  { name: "pink", ink: RISO.pink, from: 10, to: 11 },
] as const;

/** Pink printed over pink: the deeper "double hit" used where pink sits on the pink flood. */
export const DEEP_PINK = overprint(RISO.pink, RISO.pink);

export const passLevel = (vol: number, k: number) => range(vol, PASSES[k].from, PASSES[k].to);

/** Fade-in / hold / fade-out envelope over a window, with a quick attack. */
export function windowEnv(p: number, a: number, b: number, attack = 0.022, release = 0.02) {
  const i = range(p, a, a + attack);
  const o = range(p, b - release, b);
  return { i, o, on: Math.min(1, i * 1.5) * (1 - o) };
}

/** The 12-segment meter: how many segments are lit for a volume (10 notches + 2 clip segments). */
export const vuLit = (vol: number) => (vol <= 10 ? vol * 1.0 : 10 + (vol - 10) * 2);

export const VU_SEGMENTS = [
  { db: "−∞", ink: RISO.cobalt },
  { db: "−40", ink: RISO.cobalt },
  { db: "−30", ink: RISO.cobalt },
  { db: "−24", ink: RISO.teal },
  { db: "−18", ink: RISO.teal },
  { db: "−12", ink: RISO.teal },
  { db: "−9", ink: RISO.teal },
  { db: "−6", ink: RISO.sun },
  { db: "−3", ink: RISO.sun },
  { db: "0", ink: RISO.sun },
  { db: "+3", ink: RISO.pink },
  { db: "CLIP", ink: RISO.pink },
] as const;

export const dbLabel = (vol: number) => {
  if (vol < 0.05) return "−∞ dB";
  if (vol >= 10.5) return "+3 dB CLIP";
  const db = -42 + vol * 4.2;
  return `${db >= 0 ? "+" : "−"}${Math.abs(db).toFixed(0).padStart(2, "0")} dB`;
};
