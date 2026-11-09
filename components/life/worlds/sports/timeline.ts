/**
 * The world's beat sheet, in world progress (0 = title card, 1 = exit frame).
 *
 *  0.00 ─ title card (stable)            SPORTS · Age 14 — I tried to go pro. · LAP 00
 *  0.07 ─ THE LAPS                       scroll = skating, the rosette builds
 *  0.37 ─ lights cut, the comet finishes
 *  0.40 ─ THE STRIKE                     rosette condenses → coin press → struck metal
 *  0.515 ─ flip to the reverse
 *  0.56 ─ BREATH                         eight breath strokes draw a lotus, soft strike
 *  0.72 ─ THE RECEIPTS                   toss → 25 medals (20 struck + 5 ghosts), 20–25
 *  0.86 ─ ANOTHER DIRECTION              one comet breaks off its lap and squares the circle
 *  1.00 ─ exit frame: a paper cube, the next portal's origin
 */
import { backOut, bell, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, range } from "@/components/life/multiverse/ease";

export const BEAT = {
  titleOut: [0.045, 0.1],
  laps: [0.07, 0.37],
  lightsCut: [0.355, 0.4],
  handoff: 0.4,
  gather: [0.4, 0.44],
  impact: 0.447,
  pressEnd: 0.476,
  tiltUp: [0.455, 0.49],
  settle: [0.49, 0.515],
  flip: [0.515, 0.555],
  lotus: [0.56, 0.665],
  softStrike: [0.668, 0.7],
  toss: [0.72, 0.755],
  multiply: [0.752, 0.8],
  odo: [0.738, 0.81],
  liftOut: [0.855, 0.895],
  exitLights: [0.86, 0.9],
  exitOval: [0.885, 0.944],
  exitLine: [0.944, 0.956],
  exitHex: [0.956, 0.977],
  fill: [0.972, 0.992],
} as const;

/** Lap parameter s ∈ [0, N] for a progress value: accelerate off the line, cruise, glide over the finish. */
export function lapsAt(p: number, N: number): number {
  const x = range(p, BEAT.laps[0], BEAT.laps[1]);
  const k = 0.06; // fraction of the beat spent accelerating (and braking)
  const v = 1 / (1 - k); // cruise speed so that the profile integrates to 1
  let d: number;
  if (x < k) d = (v * x * x) / (2 * k);
  else if (x > 1 - k) d = 1 - (v * (1 - x) * (1 - x)) / (2 * k);
  else d = (v * k) / 2 + v * (x - k);
  return clamp(d) * N;
}

/** How bright the rink furniture is (house lights). */
export function rinkLights(p: number): number {
  const on = 1 - range(p, BEAT.lightsCut[0], BEAT.lightsCut[1]);
  const exit = 0.5 * easeInOutCubic(range(p, BEAT.exitLights[0], BEAT.exitLights[1]));
  return Math.max(on, exit);
}

export type Pose = {
  vis: boolean;
  /** Screen centre (px). */
  x: number;
  y: number;
  /** Face radius in px. */
  r: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  /** Obverse: neon emissive, metal, relief. */
  E: number;
  metal: number;
  bump: number;
  rim: number;
  /** Reverse: lotus strokes drawn (0..8), their glow, relief, inscription. */
  lotus: number;
  backE: number;
  backBump: number;
  backInsc: number;
  /** Pointer tilt authority, disco glints. */
  tiltAmt: number;
  glint: number;
};

export type PoseFrame = {
  medal: { x: number; y: number };
  laps: { x: number; y: number };
  apex: { x: number; y: number };
  M0: number;
  mRest: number;
};

const DEG = Math.PI / 180;

/** Where the medal is, how it is turned and how struck it is, for a progress value. */
export function poseAt(p: number, L: PoseFrame, out: Pose): Pose {
  out.vis = p >= BEAT.handoff && p < BEAT.toss[1];
  const gather = easeInOutCubic(range(p, BEAT.gather[0], BEAT.gather[1]));
  const sRest = L.mRest / L.M0;
  let s = lerp(1, sRest, gather);

  // the press: a quick dip at impact, then a sprung release
  if (p >= BEAT.gather[1]) {
    if (p < BEAT.impact) s *= lerp(1, 0.925, easeInCubic(range(p, BEAT.gather[1], BEAT.impact)));
    else s *= lerp(0.925, 1, backOut(range(p, BEAT.impact, BEAT.pressEnd), 2.1));
  }

  // the toss: up, smaller, spinning, until it is edge-on at the apex
  const toss = range(p, BEAT.toss[0], BEAT.toss[1]);
  s *= lerp(1, 0.14, easeInCubic(toss));
  out.r = L.M0 * s;

  const cx = lerp(L.laps.x, L.medal.x, gather);
  const cy = lerp(L.laps.y, L.medal.y, gather);
  out.x = lerp(cx, L.apex.x, easeInOutCubic(toss));
  out.y = lerp(cy, L.apex.y, easeOutCubic(toss));

  out.rotZ = -14 * DEG * gather + 6 * DEG * easeInOutCubic(range(p, BEAT.settle[0], BEAT.settle[1]));
  const up = easeOutCubic(range(p, BEAT.tiltUp[0], BEAT.tiltUp[1]));
  const settle = easeInOutCubic(range(p, BEAT.settle[0], BEAT.settle[1]));
  out.rotX = (16 * up - 10 * settle) * DEG * (1 - toss);
  out.rotY = Math.PI * easeInOutCubic(range(p, BEAT.flip[0], BEAT.flip[1])) + 2.5 * Math.PI * easeInCubic(toss);

  out.E = 1 - easeInOutCubic(range(p, BEAT.gather[1], 0.47));
  out.metal = easeOutCubic(range(p, BEAT.gather[1], 0.468));
  out.bump = easeOutCubic(range(p, BEAT.impact - 0.002, 0.482));
  out.rim = easeOutCubic(range(p, BEAT.gather[1] + 0.001, 0.462));

  out.lotus = 8 * range(p, BEAT.lotus[0], BEAT.lotus[1]);
  out.backE = 1 - easeInOutCubic(range(p, BEAT.softStrike[0], BEAT.softStrike[1]));
  out.backBump = easeInOutCubic(range(p, BEAT.softStrike[0], BEAT.softStrike[1]));
  out.backInsc = easeOutCubic(range(p, BEAT.softStrike[0] + 0.004, BEAT.softStrike[1]));

  out.tiltAmt = bell(p, 0.468, 0.49, 0.705, 0.725);
  out.glint = bell(p, 0.452, 0.472, 0.738, 0.755);
  return out;
}

export function makePose(): Pose {
  return { vis: false, x: 0, y: 0, r: 0, rotX: 0, rotY: 0, rotZ: 0, E: 1, metal: 0, bump: 0, rim: 0, lotus: 0, backE: 1, backBump: 0, backInsc: 0, tiltAmt: 0, glint: 0 };
}

/** Exit comet: distance travelled along the exit path (px), or -1 before it starts. */
export function exitDistance(p: number, ovalEnd: number, lineEnd: number, total: number): number {
  if (p < BEAT.exitOval[0]) return -1;
  if (p < BEAT.exitOval[1]) {
    // ease off the line, then cruise
    const x = range(p, BEAT.exitOval[0], BEAT.exitOval[1]);
    const k = 0.18;
    const v = 1 / (1 - k / 2);
    const d = x < k ? (v * x * x) / (2 * k) : (v * k) / 2 + v * (x - k);
    return ovalEnd * d;
  }
  if (p < BEAT.exitLine[1]) return lerp(ovalEnd, lineEnd, range(p, BEAT.exitLine[0], BEAT.exitLine[1]));
  return lerp(lineEnd, total, range(p, BEAT.exitHex[0], BEAT.exitHex[1]));
}
