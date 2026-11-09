/**
 * The choreography as numbers. Everything on screen is a pure function of
 * the world's progress p (0 = title card, 1 = exit frame), so scrolling back
 * un-crashes the page exactly.
 *
 * Most beats live on a "story clock" s. Until the end of PITCH, s = p. Then
 * REPEAT literally rewinds the story: `git reset --hard` types itself and s
 * runs back from the last slide to the raw v0.0.1 page (VHS on top), before
 * the motto resolves and the whorl is left behind for the Outro's portal.
 */
import { clamp, easeInOutCubic, easeOutCubic, lerp, range } from "@/components/life/multiverse/ease";

/** Story-time beats (s). */
export const B = {
  // COLD OPEN — raw v0.0.1 page, "compiling…"
  coldEnd: 0.05,

  // BUILD · colors.css — a paint bucket floods the page in three clicks
  bucketIn: 0.048,
  clicks: [0.062, 0.08, 0.097] as const,
  floodDur: 0.032,
  bucketOut: 0.116,
  // each flood drains into the block it leaves behind
  settleA: 0.118,
  settleStep: 0.006,
  settleDur: 0.03,
  toast1: 0.122,

  // BUILD · type.css — Times → Anybody, letter by letter; links → cards
  rawFadeA: 0.126,
  rawFadeB: 0.146,
  letterA: 0.127,
  letterStep: 0.0042,
  letterDur: 0.024,
  cardA: 0.146,
  cardStep: 0.008,
  cardDur: 0.026,
  chipA: 0.164,
  chipStep: 0.004,
  extrasA: 0.168,
  extrasStep: 0.0028,
  toast2: 0.196,

  // BUILD · motion.css — everything starts breathing
  motionA: 0.2,
  motionB: 0.232,
  toast3: 0.236,
  buildLit: 0.238,
  toastsOutA: 0.278,
  toastsOutB: 0.292,

  // BREAK — "- display: grid;"
  editorA: 0.29,
  editorB: 0.304,
  typeA: 0.306,
  typeB: 0.328,
  saveA: 0.331,
  saveB: 0.34,
  debugA: 0.339,
  debugB: 0.349,
  crash: 0.351,
  /** Story time the whole baked fall takes (see heap.ts). */
  simSpan: 0.11,
  sheetA: 0.44,
  sheetHit: 0.455,
  editorOutA: 0.436,
  editorOutB: 0.452,

  // PITCH — hot reload into presentation mode
  sheetUpA: 0.522,
  sheetUpB: 0.536,
  reloadA: 0.524,
  reloadB: 0.556,
  springA: 0.53,
  springSpread: 0.016,
  springDur: 0.028,
  dimA: 0.56,
  dimB: 0.574,
  projA: 0.56,
  projB: 0.598,
  slides: [
    [0.602, 0.62],
    [0.686, 0.702],
    [0.774, 0.79],
  ] as const,
  sEnd: 0.832,
} as const;

/** REPEAT beats (raw progress p). */
export const R = {
  termA: 0.832,
  termB: 0.842,
  typeA: 0.842,
  typeB: 0.862,
  outA: 0.864,
  outB: 0.869,
  rewA: 0.874,
  rewB: 0.94,
  termOutA: 0.892,
  termOutB: 0.906,
  // the raw page is back; its placeholder becomes the whorl
  spinA: 0.938,
  spinB: 0.954,
  whorlA: 0.95,
  whorlB: 0.976,
  floodA: 0.952,
  floodB: 0.984,
  rawOutA: 0.944,
  rawOutB: 0.964,
  mottoA: 0.962,
  mottoStep: 0.006,
  mottoDur: 0.016,
  gitLineA: 0.982,
  gitLineB: 0.992,
} as const;

/** Story time for a progress value (identity, then the rewind). */
export function story(p: number): number {
  if (p <= B.sEnd) return p;
  if (p < R.rewA) return B.sEnd;
  if (p >= R.rewB) return 0;
  const t = (p - R.rewA) / (R.rewB - R.rewA);
  // rewind accelerates, then brakes onto the raw page
  return B.sEnd * (1 - easeInOutCubic(t));
}

/** 0 → 1 → 0 across the rewind: drives scanlines, misregistration, OSD. */
export function vhsAmount(p: number): number {
  return Math.min(range(p, R.rewA - 0.004, R.rewA + 0.008), 1 - range(p, R.rewB - 0.006, R.rewB + 0.004));
}

/** 0 → 1 after a beat starts, eased out. */
export const reveal = (s: number, a: number, b: number) => easeOutCubic(range(s, a, b));

/** A slam: approach from above, land at `hit`, squash then settle. */
export function slam(s: number, a: number, hit: number) {
  const approach = range(s, a, hit);
  const after = clamp((s - hit) / 0.012);
  const y = approach < 1 ? -(1 - approach * approach) : 0;
  // squash on contact, then a soft overshoot back to 1
  const squash = after <= 0 || after >= 1 ? 0 : Math.sin(after * Math.PI) * Math.exp(-after * 2.2);
  return { approach, after, y, squash, landed: s >= hit };
}

/** ≤ 2px decaying jolt after an impact (spec: rare, ≤ 2px). */
export function jolt(s: number, hit: number, amp = 2): number {
  const t = (s - hit) / 0.005;
  if (t <= 0 || t > 3.2) return 0;
  return amp * Math.exp(-t * 1.25) * Math.sin(t * 8.5);
}

/** Linear sub-range helper used by typing effects: how many of n chars are shown. */
export const typed = (p: number, a: number, b: number, n: number) => Math.round(lerp(0, n, range(p, a, b)));
