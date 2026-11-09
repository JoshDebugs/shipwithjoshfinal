/**
 * Progress → choreography. Pure functions shared by the WebGL scene and the
 * DOM layers so every layer agrees on where the cube is, frame by frame.
 *
 *   0      poster — the top face of a cube, seen dead flat (FOV 8°)
 *   .04    THE TURN — R swings the right third away, dolly-zoom 8° → 34°
 *   .115   scramble frenzy, camera arcs to a 3/4 view
 *   .30    scrambled hold ("Scrambled at 14.")
 *   .345   solve: P1 → LOCK 1 (.44) · P2 → LOCK 2 (.565) · P3 → LOCK 3 (.69)
 *   .74    coin-flip: the bottom face answers ("YEAH. IT'S A HABIT.")
 *   .79    free play
 *   .88    your moves unwind, the cube flattens back into a poster
 *   .915   crack (top layer twists 45°), burst, dive into the core
 *   1      ink, and an eye opening where the core was
 */

import { clamp, easeInOutCubic, easeInOutSine, lerp, range, smoothstep } from "@/components/life/multiverse/ease";
import { N_SCRAMBLE, N_TOTAL, PHASE_LEN } from "./script";

export const K = {
  poster: 0.04,
  turn: 0.115,
  scramble: 0.3,
  solve: 0.345,
  lock1: 0.44,
  p2: 0.49,
  lock2: 0.565,
  p3: 0.615,
  lock3: 0.69,
  flip: 0.74,
  flipEnd: 0.79,
  playEnd: 0.88,
  unwindEnd: 0.905,
  poster2: 0.915,
  crack: 0.935,
  burst: 0.962,
  dive: 0.985,
} as const;

/** Half the cube's outer extent (cubies are 0.98 on a 1.0 pitch). */
export const HALF = 1.49;
export const FACE = HALF * 2;
/** Bounding-sphere radius. */
export const BOUND = HALF * Math.sqrt(3);

const [N1, N2, N3] = PHASE_LEN;

/** Timeline move position m ∈ [0, N_TOTAL]: integer = at rest, fraction = mid-turn. */
export function movePos(p: number): number {
  if (p <= K.poster) return 0;
  if (p <= K.turn) return range(p, K.poster, K.turn);
  if (p <= K.scramble) return 1 + (N_SCRAMBLE - 1) * easeInOutSine(range(p, K.turn, K.scramble));
  if (p <= K.solve) return N_SCRAMBLE;
  if (p <= K.lock1) return N_SCRAMBLE + N1 * range(p, K.solve, K.lock1);
  if (p <= K.p2) return N_SCRAMBLE + N1;
  if (p <= K.lock2) return N_SCRAMBLE + N1 + N2 * range(p, K.p2, K.lock2);
  if (p <= K.p3) return N_SCRAMBLE + N1 + N2;
  if (p <= K.lock3) return N_SCRAMBLE + N1 + N2 + N3 * range(p, K.p3, K.lock3);
  return N_TOTAL;
}

/** Ease for one quarter turn: a soft start and a clicky settle. */
export function snap(t: number): number {
  return easeInOutCubic(clamp(t));
}

/* ----------------------------------------------------------------- layout */

export type Layout = {
  mobile: boolean;
  /** Poster (title card): face size in px and centre. */
  poster: { s: number; x: number; y: number };
  /** 3/4 hero view: on-screen cube size (bounding diameter, px) and centre. */
  view: { s: number; x: number; y: number };
  /** Free-play framing. */
  play: { s: number; x: number; y: number };
  /** The final "IT'S A HABIT." poster. */
  end: { s: number; x: number; y: number };
};

export function layout(w: number, h: number): Layout {
  const mobile = w < 768;
  if (mobile) {
    const s = Math.min(w - 28, h * 0.5);
    return {
      mobile,
      poster: { s, x: w / 2, y: h * 0.47 },
      view: { s: Math.min(w * 1.08, h * 0.6), x: w / 2, y: h * 0.385 },
      play: { s: Math.min(w * 0.98, h * 0.54), x: w / 2, y: h * 0.4 },
      end: { s: Math.min(w - 40, h * 0.46), x: w / 2, y: h * 0.47 },
    };
  }
  const s = Math.min(h * 0.68, w * 0.5);
  return {
    mobile,
    poster: { s, x: w / 2, y: h * 0.535 },
    view: { s: Math.min(h * 0.92, w * 0.62), x: w * 0.655, y: h * 0.53 },
    play: { s: Math.min(h * 0.88, w * 0.6), x: w * 0.64, y: h * 0.52 },
    end: { s: Math.min(h * 0.64, w * 0.48), x: w / 2, y: h * 0.53 },
  };
}

/* -------------------------------------------------------------------- rig */

export type Rig = {
  /** Vertical FOV (deg). */
  fov: number;
  /** Camera elevation above the horizon (deg, 90 = straight down) and azimuth (deg, 0 = front). */
  elev: number;
  azim: number;
  /** Camera distance from the cube centre. */
  dist: number;
  /** Where the cube centre lands on screen (px). */
  cx: number;
  cy: number;
  /** Cube yaw about world Y and coin-flip about world X (rad). */
  yaw: number;
  flip: number;
  /** Hop during the flip (world units). */
  lift: number;
  /** Exit: top-layer twist 0→1 (= 45°), top layer burst 0→1, middle layer opening 0→1. */
  crack: number;
  burst: number;
  open: number;
  /** 0 → 1 while the "poster" is flat and edgeless (title + end). */
  flat: number;
  /** Shadow / depth cues fade (0 on the title poster). */
  depth: number;
  /** Puzzle-moon orbit presence 0 → 1. */
  moons: number;
};

const DEG = Math.PI / 180;

/** Camera distance so a face of FACE units spans `px` on a stage `h` px tall (face plane is HALF above centre). */
function posterDist(fov: number, px: number, h: number) {
  return FACE / (2 * Math.tan((fov * DEG) / 2) * (px / h)) + HALF;
}

/** Camera distance so the bounding sphere spans `px`. */
function viewDist(fov: number, px: number, h: number) {
  return (BOUND * h) / (px * Math.tan((fov * DEG) / 2));
}

/** Piecewise yaw keyframes (deg): the cube revolves like a tri-vision billboard,
 *  resting on F+R at every lock and on B+L at the end of every hold. */
const YAW: [number, number][] = [
  [0.26, 0],
  [K.solve, -180],
  [K.lock1, -360],
  [K.p2, -540],
  [K.lock2, -720],
  [K.p3, -900],
  [K.lock3, -1080],
  [K.flip, -1260],
  [K.flipEnd - 0.01, -1440],
];

function yawAt(p: number) {
  if (p <= YAW[0][0]) return 0;
  for (let i = 1; i < YAW.length; i++) {
    const [p1, y1] = YAW[i];
    const [p0, y0] = YAW[i - 1];
    if (p <= p1) return lerp(y0, y1, easeInOutSine(range(p, p0, p1)));
  }
  return YAW[YAW.length - 1][1];
}

export function rig(p: number, w: number, h: number, L: Layout = layout(w, h)): Rig {
  // --- framing blend: poster → view → play → end poster → dive
  const arc = smoothstep(range(p, K.turn, 0.265));
  const toPlay = smoothstep(range(p, K.flip, K.flipEnd));
  const toEnd = smoothstep(range(p, K.playEnd, K.poster2));

  // FOV: 8 (flat) → 34 (dolly) → 30 (view) → 8 (flat again) → 46 (dive)
  let fov = lerp(8, 34, easeInOutCubic(range(p, K.poster, K.turn)));
  fov = lerp(fov, 30, arc);
  fov = lerp(fov, 8, toEnd);
  const dive = easeInOutCubic(range(p, 0.95, K.dive));
  fov = lerp(fov, 46, dive);

  // elevation / azimuth
  let elev = lerp(90, 80, smoothstep(range(p, 0.07, K.turn)));
  elev = lerp(elev, 30, arc);
  elev = lerp(elev, 50, smoothstep(range(p, K.flip + 0.01, K.flipEnd)));
  elev = lerp(elev, 38, smoothstep(range(p, K.flipEnd + 0.012, 0.83)));
  elev = lerp(elev, 90, toEnd);
  let azim = lerp(0, 45, smoothstep(range(p, 0.13, 0.27)));
  azim = lerp(azim, 0, toEnd);

  // distance + screen anchor
  const dPoster = posterDist(fov, L.poster.s, h);
  const dView = viewDist(fov, L.view.s, h);
  const dPlay = viewDist(fov, L.play.s, h);
  const dEnd = posterDist(fov, L.end.s, h);
  let dist = lerp(dPoster, dView, arc);
  // breathe out a little during the coin flip
  dist *= 1 + 0.14 * Math.sin(Math.PI * range(p, K.flip, K.flipEnd));
  dist = lerp(dist, dPlay, toPlay);
  dist = lerp(dist, dEnd, toEnd);
  // dive: down into the core (its top face sits 0.49 above centre)
  dist = lerp(dist, 0.49 + 0.5, dive);

  let cx = lerp(L.poster.x, L.view.x, arc);
  let cy = lerp(L.poster.y, L.view.y, arc);
  cx = lerp(cx, L.play.x, toPlay);
  cy = lerp(cy, L.play.y, toPlay);
  cx = lerp(cx, L.end.x, toEnd);
  cy = lerp(cy, L.end.y, toEnd);
  cx = lerp(cx, w / 2, dive);
  cy = lerp(cy, h / 2, dive);

  const flipT = easeInOutCubic(range(p, K.flip + 0.008, K.flipEnd - 0.006));

  return {
    fov,
    elev,
    azim,
    dist,
    cx,
    cy,
    yaw: yawAt(p) * DEG,
    flip: flipT * Math.PI,
    lift: Math.sin(Math.PI * flipT) * 1.6,
    crack: easeInOutCubic(range(p, K.poster2, K.crack)),
    burst: easeInOutCubic(range(p, K.crack + 0.004, K.burst)),
    open: easeInOutCubic(range(p, 0.948, 0.975)),
    flat: clamp(1 - range(p, K.poster, 0.09) + range(p, 0.895, K.poster2)),
    depth: range(p, 0.05, 0.16) * (1 - range(p, K.playEnd, 0.9)),
    moons: smoothstep(range(p, 0.17, 0.25)) * (1 - smoothstep(range(p, K.playEnd - 0.01, 0.9))),
  };
}

/* ------------------------------------------------------------- directions */

export type V3 = [number, number, number];

/** Unit vector from the cube centre to the camera. */
export function camDir(r: Rig): V3 {
  const e = Math.min(r.elev, 89.99) * DEG;
  const a = r.azim * DEG;
  return [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)];
}

/** Rotate a cube-local vector into world space (yaw about Y, then flip about X). */
export function toWorld(r: Rig, v: V3): V3 {
  const cy = Math.cos(r.yaw);
  const sy = Math.sin(r.yaw);
  const x1 = v[0] * cy + v[2] * sy;
  const z1 = -v[0] * sy + v[2] * cy;
  const y1 = v[1];
  const cf = Math.cos(r.flip);
  const sf = Math.sin(r.flip);
  return [x1, y1 * cf - z1 * sf, y1 * sf + z1 * cf];
}

/** How squarely each face looks at the camera (0…1), for the chromatic flood. */
export function faceWeights(r: Rig): Record<"U" | "D" | "F" | "B" | "R" | "L", number> {
  const c = camDir(r);
  const w = (v: V3) => {
    const n = toWorld(r, v);
    return Math.max(0, n[0] * c[0] + n[1] * c[1] + n[2] * c[2]);
  };
  return { U: w([0, 1, 0]), D: w([0, -1, 0]), F: w([0, 0, 1]), B: w([0, 0, -1]), R: w([1, 0, 0]), L: w([-1, 0, 0]) };
}

/** On-screen radius (px) of the cube's bounding sphere. */
export function screenRadius(r: Rig, h: number): number {
  return (BOUND / (r.dist * Math.tan((r.fov * DEG) / 2))) * (h / 2);
}
