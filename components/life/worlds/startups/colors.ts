/** The Receipts' inks: Riso palette plus shades derived the way riso ink behaves. */
import { RISO, alpha, mix, overprint } from "@/components/life/multiverse/palette";

export const C = {
  room: RISO.ink,
  ink: RISO.ink,
  paper: RISO.paper,
  pink: RISO.pink,
  sun: RISO.sun,
  teal: RISO.teal,
  cobalt: RISO.cobalt,
  /** Printer body: ink thinned with a little paper. */
  band: mix(RISO.ink, RISO.paper, 0.075),
  bandLow: mix(RISO.ink, RISO.paper, 0.035),
  bandLip: mix(RISO.ink, RISO.paper, 0.16),
  /** Printer top surface (lit by the slot) and its front edge. */
  bandTop: mix(RISO.ink, RISO.paper, 0.125),
  bandTopFar: mix(RISO.ink, RISO.paper, 0.085),
  bandEdge: mix(RISO.ink, RISO.paper, 0.21),
  bandFront: mix(RISO.ink, RISO.paper, 0.055),
  /** Paper edge / fold shade. */
  paperShade: mix(RISO.paper, RISO.ink, 0.1),
  paperDeep: mix(RISO.paper, RISO.ink, 0.22),
  /** Thermal print before it develops. */
  inkGhost: mix(RISO.ink, RISO.paper, 0.62),
  /** Ribbon: pink, its fold = pink over pink. */
  ribbonFold: overprint(RISO.pink, RISO.pink),
  ribbonSheen: mix(RISO.pink, RISO.paper, 0.38),
  /** Sticker paper: sun, its edge = sun over sun. */
  stickerEdge: overprint(RISO.sun, RISO.sun),
  /** Warm print-head light on the paper. */
  glowPaper: overprint(RISO.paper, RISO.sun),
} as const;

export { alpha, mix, overprint };
