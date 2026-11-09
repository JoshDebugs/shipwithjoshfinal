/**
 * The choreography, as numbers on the world's progress (0 = title card,
 * 1 = exit frame). Every beat is a pure function of progress, so scrolling
 * back un-prints, un-stamps and re-attaches the receipt exactly.
 */
import { backOut, clamp, easeInOutCubic, easeOutCubic, lerp, range } from "@/components/life/multiverse/ease";
import { cumAt, type Geo } from "./geometry";
import { IDX } from "./rows";

export const B = {
  // opening camera pan: the printer settles to the bottom edge
  panA: 0.02,
  panB: 0.15,

  // 001 StarScale
  sStampA: 0.138,
  sStampHit: 0.158,
  sFloodA: 0.156,
  sFloodB: 0.25,

  // 002 Frags n Flavs
  ribbonA: 0.272,
  ribbonB: 0.302,
  bowA: 0.292,
  bowB: 0.318,
  giftA: 0.306,
  giftB: 0.338,
  barA: 0.392,
  barB: 0.418,
  fStampA: 0.442,
  fStampHit: 0.462,
  fFloodA: 0.46,
  fFloodB: 0.55,

  // 003 LazyBull
  turboA: 0.522,
  turboB: 0.54,
  tagA: 0.544,
  tagHit: 0.567,
  lFloodA: 0.565,
  lFloodB: 0.655,

  // footer
  laserA: 0.696,
  laserB: 0.732,
  beepA: 0.728,
  beepB: 0.746,

  // exit
  tearA: 0.79,
  tearB: 0.802,
  springA: 0.8,
  springB: 0.826,
  flyA: 0.822,
  flyB: 0.9,
  gunA: 0.884,
  gunHit: 0.926,
  ringA: 0.923,
  ringB: 0.985,
} as const;

/** Print cursor keyframes: (progress, rows printed). Flat stretches are holds. */
const CURSOR: [number, number][] = [
  [0, IDX["s-no"]], // title card: the header and its double rule are printed
  [0.035, IDX["s-no"]],
  [0.135, IDX.r2], // s-no … s-stamp
  [0.2, IDX.r2],
  [0.214, IDX["f-no"]],
  [0.268, IDX["f-amt"]], // f-no … f-ribbon
  [0.342, IDX["f-amt"]],
  [0.362, IDX["f-note"]], // the price prints already hidden
  [0.418, IDX["f-note"]],
  [0.44, IDX.r3], // kidding + stamp zone
  [0.51, IDX.r3],
  [0.522, IDX["l-no"]],
  [0.54, IDX.r4], // TURBO: five rows at ~5× speed
  [0.62, IDX.r4],
  [0.69, IDX.bottom], // footer through the barcode digits
  [0.762, IDX.bottom],
  [0.784, IDX.bottom + 1],
  [1, IDX.bottom + 1],
];

export function cursor(p: number): number {
  const k = CURSOR;
  if (p <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (p <= k[i][0]) {
      const [p0, c0] = k[i - 1];
      const [p1, c1] = k[i];
      return lerp(c0, c1, (p - p0) / (p1 - p0));
    }
  }
  return k[k.length - 1][1];
}

/** Slot y: tall printer at the title card, then the camera follows the paper up. */
export function slotY(g: Geo, p: number): number {
  return lerp(g.slot0, g.slot1, easeInOutCubic(range(p, B.panA, B.panB)));
}

/** Emerged paper length (along the strip) at progress p. */
export function emerged(g: Geo, p: number): number {
  return cumAt(g, cursor(p)) + g.lead;
}

/**
 * Flat-zone screen y of a row's bottom edge at progress p (the reading zone is
 * kept flat, so this is exact there and a good estimate anywhere near it).
 */
export function rowBottomY(g: Geo, i: number, p: number): number {
  const s = emerged(g, p) - (g.top[i] + g.h[i]);
  return slotY(g, p) - s;
}

/** A stamp's drop: 0 → 1 approach, then the press (scale 1.6 → 1 with a back.out settle). */
export function slam(p: number, a: number, hit: number) {
  const approach = range(p, a, hit);
  const after = clamp((p - hit) / 0.014);
  const scale = p < hit ? lerp(1.62, 1.0, approach * approach) : lerp(0.94, 1, backOut(after, 2.4));
  const opacity = range(p, a, a + (hit - a) * 0.35);
  return { approach, after, scale, opacity, landed: p >= hit };
}

/** ≤ 2px decaying jolt right after an impact (rare, per spec). */
export function jolt(p: number, hit: number, amp = 1.6): number {
  const t = (p - hit) / 0.006;
  if (t <= 0 || t > 3) return 0;
  return amp * Math.exp(-t * 1.3) * Math.sin(t * 9);
}

/** Smooth 0→1 over [a, b] (ease-out), for reveals. */
export const reveal = (p: number, a: number, b: number) => easeOutCubic(range(p, a, b));
