/**
 * The thermal body: a front-view 2D rig of 17 joints and 16 tapered capsules
 * (smooth-unioned in the shader so the limbs melt together like a real
 * thermal silhouette, but with a V-taper so it never reads as a blob).
 *
 * Poses are joint positions, not angles: in a front view, limbs pointing at
 * the camera foreshorten, and interpolating positions gives exactly that
 * (a curl's forearm shrinks to a dot at the midpoint, thighs shorten in the
 * squat). Figure units: fh = 1, origin between the feet, +y up.
 */
import { lerp } from "@/components/life/multiverse/ease";
import { G } from "./timeline";

export const J = {
  head: 0,
  neck: 1,
  shL: 2,
  shR: 3,
  elL: 4,
  elR: 5,
  haL: 6,
  haR: 7,
  chest: 8,
  waist: 9,
  pelvis: 10,
  hipL: 11,
  hipR: 12,
  knL: 13,
  knR: 14,
  ftL: 15,
  ftR: 16,
} as const;
export const NJ = 17;

// arm keyframes relative to the shoulder (right side; mirrored for the left)
const HANG = { el: [0.052, -0.158], ha: [0.074, -0.312] };
const RACK = { el: [0.074, -0.09], ha: [0.03, 0.004] };
const OVER = { el: [0.064, 0.162], ha: [0.074, 0.33] };

/**
 * Pose → joints (figure units).
 * s: squat depth 0–1 · a: arms 0 hang / 1 front rack / 2 overhead · breath −1…1
 */
export function pose(s: number, a: number, breath: number, out: Float32Array) {
  const set = (j: number, x: number, y: number) => {
    out[j * 2] = x;
    out[j * 2 + 1] = y;
  };
  const drop = 0.25 * s;
  const pelvisY = 0.515 - drop;
  const f = 1 - 0.07 * s; // the torso leans in (towards the lens) and foreshortens
  set(J.pelvis, 0, pelvisY);
  set(J.waist, 0, pelvisY + 0.088 * f);
  set(J.chest, 0, pelvisY + 0.2 * f + 0.004 * breath);
  const shY = pelvisY + 0.275 * f + 0.012 * Math.max(0, a - 1) + 0.0025 * breath;
  const shX = 0.135 + 0.003 * breath;
  set(J.shL, -shX, shY);
  set(J.shR, shX, shY);
  set(J.neck, 0, shY + 0.02);
  set(J.head, 0, shY + 0.14 - 0.012 * s);

  const hipX = 0.074 + 0.028 * s;
  set(J.hipL, -hipX, pelvisY - 0.015);
  set(J.hipR, hipX, pelvisY - 0.015);
  const knX = 0.093 + 0.124 * s;
  const knY = 0.275 - 0.02 * s;
  set(J.knL, -knX, knY);
  set(J.knR, knX, knY);
  set(J.ftL, -0.115, 0.045);
  set(J.ftR, 0.115, 0.045);

  // arms: hang → rack is a curl / clean, rack → overhead is a press (both with a small outward arc)
  let ex: number, ey: number, hx: number, hy: number;
  if (a <= 1) {
    const t = Math.max(0, a);
    ex = lerp(HANG.el[0], RACK.el[0], t) + 0.012 * Math.sin(Math.PI * t);
    ey = lerp(HANG.el[1], RACK.el[1], t);
    hx = lerp(HANG.ha[0], RACK.ha[0], t) + 0.02 * Math.sin(Math.PI * t);
    hy = lerp(HANG.ha[1], RACK.ha[1], t);
  } else {
    const t = Math.min(1, a - 1);
    ex = lerp(RACK.el[0], OVER.el[0], t) + 0.01 * Math.sin(Math.PI * t);
    ey = lerp(RACK.el[1], OVER.el[1], t);
    hx = lerp(RACK.ha[0], OVER.ha[0], t) + 0.026 * Math.sin(Math.PI * t);
    hy = lerp(RACK.ha[1], OVER.ha[1], t);
  }
  set(J.elL, -shX - ex, shY + ey);
  set(J.elR, shX + ex, shY + ey);
  set(J.haL, -shX - hx, shY + hy);
  set(J.haR, shX + hx, shY + hy);
  return out;
}

/** The bar rests in the palms. */
export const barY = (j: Float32Array) => (j[J.haL * 2 + 1] + j[J.haR * 2 + 1]) / 2 + 0.006;

type Cap = {
  a: number;
  b: number;
  /** offsets (figure units) added to the joints, for the head/feet */
  ao?: [number, number];
  bo?: [number, number];
  ra: number;
  rb: number;
  group: number;
  mul: number;
  /** dropped on low-power devices */
  lp?: boolean;
  /** muscle belly: hotter mid-limb, cooler joints (default 1, 0 on bars and short caps) */
  belly?: number;
};

export const CAPS: Cap[] = [
  { a: J.head, b: J.head, ao: [0, -0.016], bo: [0, 0.012], ra: 0.062, rb: 0.058, group: G.head, mul: 1.06, belly: 0 },
  { a: J.neck, b: J.head, bo: [0, -0.045], ra: 0.043, rb: 0.04, group: G.head, mul: 1.0, lp: true, belly: 0 },
  { a: J.chest, b: J.waist, ra: 0.128, rb: 0.08, group: G.core, mul: 1.0 },
  { a: J.waist, b: J.pelvis, ra: 0.08, rb: 0.085, group: G.core, mul: 1.04 },
  { a: J.shL, b: J.shR, ra: 0.047, rb: 0.047, group: G.arms, mul: 0.96, belly: 0 },
  { a: J.shL, b: J.elL, ra: 0.057, rb: 0.037, group: G.arms, mul: 1.0 },
  { a: J.shR, b: J.elR, ra: 0.057, rb: 0.037, group: G.arms, mul: 1.0 },
  { a: J.elL, b: J.haL, ra: 0.036, rb: 0.028, group: G.arms, mul: 0.9 },
  { a: J.elR, b: J.haR, ra: 0.036, rb: 0.028, group: G.arms, mul: 0.9 },
  { a: J.hipL, b: J.hipR, ra: 0.075, rb: 0.075, group: G.legs, mul: 1.0, belly: 0 },
  { a: J.hipL, b: J.knL, ra: 0.066, rb: 0.043, group: G.legs, mul: 1.0 },
  { a: J.hipR, b: J.knR, ra: 0.066, rb: 0.043, group: G.legs, mul: 1.0 },
  { a: J.knL, b: J.ftL, ra: 0.047, rb: 0.03, group: G.legs, mul: 0.88 },
  { a: J.knR, b: J.ftR, ra: 0.047, rb: 0.03, group: G.legs, mul: 0.88 },
  { a: J.ftL, b: J.ftL, bo: [-0.032, -0.03], ra: 0.03, rb: 0.024, group: G.legs, mul: 0.74, lp: true, belly: 0 },
  { a: J.ftR, b: J.ftR, bo: [0.032, -0.03], ra: 0.03, rb: 0.024, group: G.legs, mul: 0.74, lp: true, belly: 0 },
];
export const MAX_CAPS = 16;

/**
 * Joints (figure units) + group temperatures → capsule arrays in stage px.
 * pos: [ax, ay, bx, by] × n · rad: [ra, rb, T, 0] × n. Returns the count.
 */
export function writeCapsules(
  joints: Float32Array,
  temps: readonly number[],
  cx: number,
  floorY: number,
  fh: number,
  lowPower: boolean,
  pos: Float32Array,
  rad: Float32Array,
): number {
  let n = 0;
  for (const c of CAPS) {
    if (lowPower && c.lp) continue;
    const ax = joints[c.a * 2] + (c.ao?.[0] ?? 0);
    const ay = joints[c.a * 2 + 1] + (c.ao?.[1] ?? 0);
    const bx = joints[c.b * 2] + (c.bo?.[0] ?? 0);
    const by = joints[c.b * 2 + 1] + (c.bo?.[1] ?? 0);
    pos[n * 4] = cx + ax * fh;
    pos[n * 4 + 1] = floorY - ay * fh;
    pos[n * 4 + 2] = cx + bx * fh;
    pos[n * 4 + 3] = floorY - by * fh;
    rad[n * 4] = c.ra * fh;
    rad[n * 4 + 1] = c.rb * fh;
    rad[n * 4 + 2] = temps[c.group] * c.mul;
    rad[n * 4 + 3] = c.belly ?? 1;
    n++;
  }
  return n;
}
