/**
 * Repotted — inks. Only the Riso set plus what riso ink actually does
 * (overprint, thin with paper, mix). Ground is ink, soil is sun printed over
 * ink, roots are paper, and each pot leads with its own glaze.
 */

import { RISO, alpha, mix, overprint } from "@/components/life/multiverse/palette";

export const INK = RISO.ink;
export const PAPER = RISO.paper;

/** Pot glazes, home 01 → 05 (and the ring colour of each home). */
export const HOME_INK = [RISO.pink, RISO.sun, RISO.cobalt, RISO.teal, RISO.paper] as const;

/** The darkest ground: ink overprinted on itself (vignette corners). */
export const VOID = overprint(RISO.ink, RISO.ink);

/** Soil: sun overprinted on ink, thinned with more sun for younger soil. */
export const SOIL_DEEP = overprint(RISO.sun, RISO.ink);
export const SOIL = [0.075, 0.09, 0.105, 0.12, 0.135].map((t) => mix(SOIL_DEEP, RISO.sun, t));
export const SOIL_LIGHT = mix(SOIL_DEEP, RISO.sun, 0.34);

export const LEAF = RISO.teal;
export const LEAF_LIT = mix(RISO.teal, RISO.sun, 0.62);
export const LEAF_SHADE = overprint(RISO.teal, mix(RISO.teal, RISO.ink, 0.35));
/** Transplant-shock grey: ink thinned with paper, a touch of sun. */
export const LEAF_SICK = mix(mix(RISO.ink, RISO.paper, 0.4), RISO.sun, 0.12);
export const LEAF_SICK_LIT = mix(RISO.ink, RISO.paper, 0.62);
export const STEM = mix(RISO.teal, RISO.ink, 0.18);
export const STEM_SICK = mix(RISO.ink, RISO.paper, 0.36);

export type Glaze = { base: string; light: string; dark: string; rim: string; shine: string };

export const GLAZE: Glaze[] = HOME_INK.map((c, i) => {
  const isPaper = i === 4;
  return {
    base: c,
    light: isPaper ? RISO.paper : mix(c, RISO.paper, 0.34),
    dark: isPaper ? mix(RISO.paper, RISO.sun, 0.22) : mix(c, RISO.ink, 0.42),
    rim: isPaper ? mix(RISO.paper, RISO.ink, 0.45) : overprint(c, mix(c, RISO.ink, 0.25)),
    shine: alpha(RISO.paper, isPaper ? 0.95 : 0.72),
  };
});

/** Atmosphere behind the plant at each home: dawn, noon, rain, dusk, night. */
export const SKY = [RISO.pink, RISO.sun, RISO.cobalt, overprint(RISO.pink, RISO.sun), RISO.cobalt] as const;

/** Island blocks for the exit (next world: a voxel island at sunset). */
const TERRA = overprint(RISO.sun, RISO.pink);
export const DIRT = [mix(SOIL_DEEP, mix(RISO.sun, TERRA, 0.45), 0.42), mix(SOIL_DEEP, mix(RISO.sun, TERRA, 0.55), 0.33), mix(SOIL_DEEP, TERRA, 0.26), mix(SOIL_DEEP, TERRA, 0.19)];
export const GRASS = [RISO.teal, mix(RISO.teal, RISO.sun, 0.32)];
export const TRUNK = mix(SOIL_DEEP, TERRA, 0.14);

export { alpha, mix, overprint, RISO };
