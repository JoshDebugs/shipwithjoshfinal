/**
 * "Eyes On Me" — the whole film as pure functions of progress.
 *
 *   0.000  title card: LOOK AT ME. (the O's are eyes)
 *   0.078  one giant closed eye; it opens and looks straight at you
 *   0.185  powers of ten: every step the field recedes, then a ring of eyes pops
 *   0.474  10M+ — the slam: wall-to-wall stare, every eye snaps to the post
 *   0.572  THE BLINK: a lid wave rolls out from the post, the sea closes and sinks
 *   0.640  only the followers (sun irises) open again
 *   0.712  they lift off and follow the post around
 *   0.872  they stream into the gavel outline (the next portal) — exit frame
 */

import {
  backOut,
  bell,
  clamp,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  lerp,
  range,
} from "@/components/life/multiverse/ease";

/** Show-windows [from, to) for the latched (eyelid-wipe) text blocks. */
export const SHOW = {
  title: [0, 0.074],
  tag: [0.088, 0.9],
  kicker: [0.122, 0.466],
  line0: [0.13, 0.466],
  views: [0.138, 0.62],
  caption: [0.49, 0.556],
  blinks: [0.548, 0.64],
  stayed: [0.656, 0.728],
  follow: [0.733, 0.846],
  literally: [0.745, 0.846],
  final: [0.852, 9],
  noted: [0.876, 9],
} as const;

/** Where each power of ten starts (k = 1…7 → 10, 100, 1K, 10K, 100K, 1M, 10M+). */
export const STEP_AT = [0.185, 0.233, 0.281, 0.329, 0.377, 0.425, 0.474];
const ZOOM = 0.014;
const RING = 0.022;

export const WAVE: readonly [number, number] = [0.572, 0.665];
export const SLAM = 0.474;

/** Row pitch of the eye grid as a fraction of the cell width (cells are wider than tall). */
export const ROW = 0.8;

export type Layout = ReturnType<typeof makeLayout>;

export function makeLayout(W: number, H: number, mobile: boolean) {
  const area = W * H;
  const pad = mobile ? 20 : clamp(W * 0.04, 28, 64);
  const cx = W / 2;
  const cy = H * (mobile ? 0.44 : 0.47);
  const giant = mobile ? W * 0.98 : Math.min(W * 0.56, H * 0.84);
  const cellFor = (n: number) => Math.sqrt(area / (n * ROW));
  const s1 = cellFor(12);
  const s2 = cellFor(110);
  const s3 = cellFor(1000);
  const stare = clamp(cellFor(mobile ? 1300 : 3200), 14, 26);
  const s4 = s3 * Math.pow(stare / s3, 0.45);
  const s5 = s3 * Math.pow(stare / s3, 0.7);
  const s6 = s3 * Math.pow(stare / s3, 0.87);
  const stops = [giant, s1, s2, s3, s4, s5, s6, stare];
  const cover = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
  const radii = stops.map((s, k) => (k === 0 ? 0.5 : (cover + s * 1.5) / s));

  // the exit gavel: the next portal's 100×100 icon box
  const gSize = mobile ? Math.min(W * 0.58, 230) : clamp(Math.min(W * 0.24, H * 0.42), 230, 360);
  const gCx = mobile ? W * 0.5 : W * 0.735;
  const gCy = mobile ? H * 0.69 : H * 0.5;
  // the icon's visual centre is ~(47, 52) of its box
  const gavel = { x: gCx - gSize * 0.47, y: gCy - gSize * 0.52, size: gSize };

  return {
    W,
    H,
    mobile,
    pad,
    cx,
    cy,
    stops,
    radii,
    stare,
    gavel,
    followers: {
      n: mobile ? 160 : 460,
      /** cell size (px) of a follower eye in the constellation / swarm */
      cell: mobile ? 24 : 27,
      rMin: mobile ? 30 : 40,
      rMax: mobile ? 135 : 225,
      /** how many stay on the gavel outline (the rest pour inside) */
      outline: mobile ? 64 : 96,
    },
  };
}

export type FieldFrame = {
  S: number;
  R: number;
  views: number;
  attention: number;
  centerScale: number;
  centerOpen: number;
  pulse: number;
  idle: number;
  wave: number;
  clearA: number;
  clearB: number;
  slam: number;
};

/** Everything the eye field needs at progress p. */
export function fieldAt(p: number, L: Layout): FieldFrame {
  let S = L.stops[0];
  let R = L.radii[0];
  let logV = 0;
  for (let k = 1; k <= 7; k++) {
    const t0 = STEP_AT[k - 1];
    if (p < t0) break;
    const z = easeInOutCubic(range(p, t0, t0 + ZOOM));
    const r = easeOutCubic(range(p, t0 + 0.005, t0 + RING));
    S = L.stops[k - 1] * Math.pow(L.stops[k] / L.stops[k - 1], z);
    R = lerp(L.radii[k - 1], L.radii[k], r);
    logV = k - 1 + easeOutCubic(range(p, t0, t0 + 0.02));
  }
  // the sea keeps receding while it closes
  const recede = easeInOutSine(range(p, WAVE[0], WAVE[1] + 0.005));
  S *= lerp(1, 0.74, recede);
  R /= lerp(1, 0.74, recede);

  const deflate = range(p, WAVE[0], WAVE[0] + 0.03);
  return {
    S,
    R,
    views: Math.pow(10, logV),
    attention: (logV / 7) * (1 - deflate),
    centerScale: p < 0.078 ? 0 : backOut(range(p, 0.078, 0.1), 2.2),
    centerOpen: easeInOutCubic(range(p, 0.104, 0.142)),
    pulse: Math.sin(Math.PI * range(p, SLAM, SLAM + 0.018)),
    idle: p >= SLAM && p < WAVE[0] ? 0.2 : 1,
    wave: easeInOutSine(range(p, WAVE[0], WAVE[1])),
    clearA: bell(p, 0.118, 0.142, 0.452, 0.472),
    clearB: bell(p, 0.13, 0.15, 0.452, 0.47),
    slam: backOut(range(p, 0.462, 0.478), 1.6),
  };
}

/** Odometer formatting for the views counter. */
export function formatViews(v: number): string {
  if (v >= 9.95e6) return "10M+";
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1e4) return `${Math.round(v / 1e3)}K`;
  if (v >= 999.5) return `${(v / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return `${Math.max(1, Math.round(v))}`;
}

/** Where the post (the thing every eye watches) parks when nobody is pointing. */
export function parkAt(p: number, L: Layout): [number, number] {
  const { W, H, mobile } = L;
  const a: [number, number] = mobile ? [W * 0.74, H * 0.29] : [W * 0.66, H * 0.7];
  const b: [number, number] = mobile ? [W * 0.5, H * 0.5] : [W * 0.5, H * 0.565];
  const c: [number, number] = mobile ? [W * 0.5, H * 0.62] : [W * 0.745, H * 0.5];
  const ab = easeInOutCubic(range(p, 0.452, 0.472));
  // leaves the centre while the sea closes, so it never sits on "2K+ stayed."
  const bc = easeInOutCubic(range(p, 0.622, 0.652));
  return [lerp(lerp(a[0], b[0], ab), c[0], bc), lerp(lerp(a[1], b[1], ab), c[1], bc)];
}
