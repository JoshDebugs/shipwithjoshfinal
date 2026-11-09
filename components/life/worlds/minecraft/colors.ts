/**
 * Every colour this world uses, derived from the Riso inks the way riso ink
 * behaves: thinned with paper (mix) or overprinted (multiply). Shaders get the
 * same values as raw sRGB triples, so the canvas prints exactly these inks.
 */
import { RISO, mix, overprint } from "@/components/life/multiverse/palette";

export type RGB = [number, number, number];

export function rgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const { paper, ink, pink, sun, teal, cobalt } = RISO;

/** Light filters that shadows are overprinted with (a cobalt sky fill, a pink sunset fill). */
const COOL = mix(paper, cobalt, 0.55);
const COOLER = mix(paper, cobalt, 0.85);
const WARM = mix(paper, pink, 0.55);
const WARMER = mix(paper, pink, 0.9);

/** A cube face set: top (lit), base (front), shade (side away from the sun), dark (underside). */
export type FaceSet = { top: string; base: string; shade: string; dark: string };

const faces = (top: string, base: string, shade: string, dark: string): FaceSet => ({ top, base, shade, dark });

/** The storm: every loose block is one of these six printed inks. */
export const STORM: FaceSet[] = [
  faces(mix(pink, paper, 0.32), pink, overprint(pink, COOL), overprint(pink, COOLER)),
  faces(mix(sun, paper, 0.42), sun, overprint(sun, WARM), overprint(sun, WARMER)),
  faces(mix(teal, paper, 0.3), teal, overprint(teal, COOL), overprint(teal, COOLER)),
  faces(mix(cobalt, paper, 0.32), cobalt, overprint(cobalt, COOL), overprint(cobalt, COOLER)),
  faces(paper, mix(paper, sun, 0.12), overprint(paper, COOL), overprint(paper, mix(paper, cobalt, 0.7))),
  faces(mix(ink, paper, 0.22), mix(ink, paper, 0.08), ink, ink),
];
/** Relative odds of each storm ink. */
export const STORM_WEIGHTS = [0.22, 0.2, 0.17, 0.17, 0.16, 0.08];

/** Lock schemes for the anamorphic words: front face, top, sides (the extrusion), underside. */
export type LockScheme = { front: string; top: string; side: string; dark: string; css: string; cssInk: string };

export const LOCKS: LockScheme[] = [
  // 0 BEDWARS — hot pink over cobalt sky
  { front: pink, top: mix(pink, paper, 0.38), side: overprint(pink, COOL), dark: overprint(pink, COOLER), css: pink, cssInk: ink },
  // 1 SKYWARS — cold: mint-thinned teal over the void
  { front: mix(paper, teal, 0.1), top: paper, side: mix(teal, ink, 0.25), dark: overprint(teal, COOLER), css: teal, cssInk: paper },
  // 2 MONTAGES — paper, edges misregistered in pink + cobalt
  { front: paper, top: paper, side: mix(pink, cobalt, 0.35), dark: cobalt, css: cobalt, cssInk: paper },
  // 3 ~400 — gold digits over the high cobalt sky
  { front: sun, top: mix(sun, paper, 0.5), side: overprint(sun, WARM), dark: overprint(sun, WARMER), css: sun, cssInk: ink },
  // 4 ALMOST — pink, never quite locks
  { front: pink, top: mix(pink, paper, 0.38), side: overprint(pink, COOL), dark: overprint(pink, COOLER), css: pink, cssInk: ink },
  // 5 WENT COMPETITIVE. — white-gold
  { front: paper, top: paper, side: sun, dark: overprint(sun, WARM), css: sun, cssInk: ink },
  // 6 the receipt — flat ink (the next portal is ink)
  { front: ink, top: mix(ink, paper, 0.16), side: mix(ink, cobalt, 0.22), dark: ink, css: ink, cssInk: paper },
];

/** Island, set dressing. */
export const LAND = {
  grassTop: mix(teal, sun, 0.14),
  grass: teal,
  grassShade: overprint(teal, COOL),
  grassDark: overprint(teal, COOLER),
  dirt: mix(sun, ink, 0.55),
  dirtShade: overprint(mix(sun, ink, 0.55), COOL),
  dirtDark: overprint(mix(sun, ink, 0.6), COOLER),
  stone: mix(ink, paper, 0.45),
  stoneShade: overprint(mix(ink, paper, 0.45), COOL),
  stoneDark: overprint(mix(ink, paper, 0.38), COOLER),
  leaf: mix(teal, ink, 0.18),
  leafTop: mix(teal, sun, 0.28),
  leafShade: overprint(mix(teal, ink, 0.18), COOL),
  trunk: mix(sun, ink, 0.66),
  trunkShade: overprint(mix(sun, ink, 0.66), COOL),
  wool: pink,
  woolTop: mix(pink, paper, 0.3),
  woolShade: overprint(pink, COOL),
  pillow: paper,
  pillowShade: overprint(paper, COOL),
  glass: mix(paper, teal, 0.35),
  glassTop: mix(paper, teal, 0.18),
  glassShade: overprint(mix(paper, teal, 0.35), COOL),
  brick: mix(sun, paper, 0.25),
  brickTop: mix(sun, paper, 0.55),
  brickShade: overprint(mix(sun, paper, 0.25), WARM),
  water: cobalt,
  waterTop: mix(cobalt, paper, 0.45),
  foam: paper,
  cloudTop: paper,
  cloudSide: mix(paper, pink, 0.22),
  cloudBottom: mix(paper, pink, 0.5),
  sunFace: mix(sun, paper, 0.3),
  sunTop: paper,
  sunSide: sun,
  sunHalo: mix(sun, paper, 0.4),
  sunCore: paper,
  star: paper,
};

/**
 * Sky grades: colour stops from zenith to nadir at fixed elevations (see SKY_ELEV).
 * Every lock re-prints the sky with a different pair of inks.
 */
export type Grade = { stops: string[]; fog: string };

export const SKY_ELEV = [90, 30, 9, 0, -8, -30, -90];

export const GRADES: Grade[] = [
  // 0 title — candy sunset: cobalt → pink → sun horizon → pink → cobalt → ink void
  { stops: [cobalt, cobalt, pink, sun, pink, cobalt, ink], fog: mix(pink, sun, 0.35) },
  // 1 BEDWARS — hot pink
  { stops: [cobalt, cobalt, cobalt, sun, pink, mix(pink, cobalt, 0.6), ink], fog: pink },
  // 2 SKYWARS — cold: cobalt + teal, deep void
  { stops: [cobalt, cobalt, teal, mix(teal, paper, 0.5), teal, cobalt, ink], fog: mix(cobalt, teal, 0.5) },
  // 3 MONTAGES — candy, pinker
  { stops: [cobalt, pink, pink, sun, pink, cobalt, ink], fog: mix(pink, sun, 0.3) },
  // 4 ~400 — gold hour
  { stops: [cobalt, cobalt, pink, sun, sun, pink, cobalt], fog: mix(sun, pink, 0.35) },
  // 5 ALMOST WENT COMPETITIVE. — white-hot horizon, ink void below
  { stops: [cobalt, cobalt, pink, paper, sun, cobalt, ink], fog: mix(cobalt, ink, 0.35) },
  // 6 exit — back to the candy sunset
  { stops: [cobalt, cobalt, pink, sun, pink, cobalt, ink], fog: mix(pink, sun, 0.35) },
];
