/**
 * Hot Reload's inks. Riso palette plus shades derived the way riso ink
 * behaves (overprint = multiply, thinning = alpha / mixing with paper).
 *
 * The one sanctioned exception (spec §1, §5·11): the cold open is a raw,
 * unstyled page — browser-default white, default serif, default link blue.
 * Those three live under `raw` and are used only while the CSS is "not
 * installed" (and when REPEAT rewinds back to it).
 */
import { RISO, alpha, mix, overprint } from "@/components/life/multiverse/palette";

export const C = {
  paper: RISO.paper,
  ink: RISO.ink,
  pink: RISO.pink,
  sun: RISO.sun,
  teal: RISO.teal,
  cobalt: RISO.cobalt,
  /** Paper edge / fold shade. */
  paperShade: mix(RISO.paper, RISO.ink, 0.09),
  paperDeep: mix(RISO.paper, RISO.ink, 0.2),
  /** Ink thinned with paper: projector body, terminal chrome. */
  inkLift: mix(RISO.ink, RISO.paper, 0.08),
  inkLift2: mix(RISO.ink, RISO.paper, 0.16),
  inkMute: mix(RISO.ink, RISO.paper, 0.45),
  /** Overprints. */
  pinkDeep: overprint(RISO.pink, RISO.pink),
  sunDeep: overprint(RISO.sun, RISO.sun),
  cobaltDeep: overprint(RISO.cobalt, RISO.cobalt),
  plum: overprint(RISO.pink, RISO.cobalt),
  ember: overprint(RISO.pink, RISO.sun),
  moss: overprint(RISO.teal, RISO.sun),
} as const;

/** The cold open's browser defaults (the joke; the only off-palette moment). */
export const RAW = {
  page: "#FFFFFF",
  link: "#0000EE",
  text: RISO.ink,
  serif: '"Times New Roman", Times, serif',
  /** Placeholder grey = thinned ink. */
  box: alpha(RISO.ink, 0.07),
  boxLine: alpha(RISO.ink, 0.32),
  button: alpha(RISO.ink, 0.06),
  buttonLine: alpha(RISO.ink, 0.42),
} as const;

/** Debug outlines cycle inks by nesting depth (0 = outermost). */
export const DEPTH = [RISO.cobalt, RISO.pink, RISO.teal, RISO.sun] as const;

/** Each verb chip's ink, and the text colour that reads on it. */
export const VERB_INK = [
  { bg: RISO.cobalt, fg: RISO.paper },
  { bg: RISO.pink, fg: RISO.ink },
  { bg: RISO.sun, fg: RISO.ink },
  { bg: RISO.teal, fg: RISO.paper },
] as const;

export const FONT = {
  anybody: "var(--f-anybody)",
  mono: "var(--f-jetbrains)",
} as const;

export { alpha, mix, overprint };
