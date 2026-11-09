/**
 * Stage geometry for the Sports world, computed once per stage size.
 * Desktop: a landscape rink that slides right to make a text column.
 * Phone: a portrait rink up top, copy below (390×844 is first-class).
 */
import { clamp, hash } from "@/components/life/multiverse/ease";
import { RISO } from "@/components/life/multiverse/palette";
import { PORTAL_ICONS } from "@/components/life/multiverse/portalIcons";

export type Vec = { x: number; y: number };

export type Slot = {
  /** Medal centre at rest, ribbon pivot, medal radius. */
  x: number;
  y: number;
  ax: number;
  ay: number;
  r: number;
  ghost: boolean;
  /** 0..1 stagger order for the multiply beat. */
  order: number;
  stripe: number;
};

export type Glint = { x: number; y: number; dx: number; dy: number; size: number; color: string; phase: number };

export type ExitPath = {
  pts: Float32Array;
  cum: Float32Array;
  n: number;
  ovalEnd: number;
  lineEnd: number;
  len: number;
  /** Hexagon vertices in travel order (entry first), screen px. */
  hex: Vec[];
};

export type Layout = {
  w: number;
  h: number;
  mobile: boolean;
  lowPower: boolean;
  /** Laps, strands per lap, samples per lap. */
  N: number;
  K: number;
  spl: number;
  /** Lap ellipse semi-axes, base orientation, start angle. */
  a: number;
  b: number;
  psi: number;
  theta0: number;
  /** Strand spacing, base + velocity stride wobble. */
  delta: number;
  epsBase: number;
  epsVel: number;
  /** Rosette bound radius and medal face radius at handoff (rosette = RING_IN of the face). */
  R: number;
  M0: number;
  mRest: number;
  title: Vec;
  laps: Vec;
  medal: Vec;
  apex: Vec;
  exit: Vec;
  cube: { x: number; y: number; size: number };
  slots: Slot[];
  glints: Glint[];
  path: ExitPath;
  /** Text column (px). */
  col: { x: number; w: number };
};

/** Rosette radius as a fraction of the medal face radius. */
export const RING_IN = 0.78;
/** The cube portal is born rotated by −6° (see portalFrame). */
export const CUBE_ROT = (-6 * Math.PI) / 180;

const HEX_ICON: [number, number][] = [
  [50, 12],
  [84, 31],
  [84, 69],
  [50, 88],
  [16, 69],
  [16, 31],
];

export function computeLayout(w: number, h: number, mobile: boolean, lowPower: boolean): Layout {
  const N = mobile ? 16 : 24;
  const K = lowPower ? 3 : 4;
  const spl = lowPower ? 220 : 340;
  const psi = mobile ? Math.PI / 2 : 0;
  // the phone title runs across the rink's long straights, so the start line sits on the bottom turn
  const theta0 = mobile ? 0 : Math.PI / 2;
  const delta = mobile ? 0.016 : 0.0125;
  const epsBase = 0.034;
  const epsVel = 0.03;

  const a = mobile ? Math.min(0.4 * w, 0.2 * h) : Math.min(0.355 * h, 0.235 * w);
  const b = 0.6 * a;
  const spread = 1 + ((K - 1) / 2) * delta;
  const R = a * (1 + epsBase + epsVel) * spread;
  const M0 = R / RING_IN;
  const mRest = mobile ? Math.min(0.4 * w, 0.2 * h) : Math.min(0.3 * h, 0.21 * w);

  const title = { x: 0.5 * w, y: 0.5 * h };
  const laps = mobile ? { x: 0.5 * w, y: 0.385 * h } : { x: 0.625 * w, y: 0.5 * h };
  const medal = mobile ? { x: 0.5 * w, y: 0.36 * h } : { x: 0.625 * w, y: 0.5 * h };
  const apex = mobile ? { x: 0.5 * w, y: 0.2 * h } : { x: 0.5 * w, y: 0.25 * h };
  const exit = mobile ? { x: 0.5 * w, y: 0.5 * h } : { x: 0.42 * w, y: 0.455 * h };
  const cubeSize = mobile ? clamp(0.21 * w, 72, 96) : clamp(0.082 * w, 96, 136);
  const cube = mobile ? { x: 0.74 * w, y: Math.max(0.18 * h, 150), size: cubeSize } : { x: 0.795 * w, y: 0.27 * h, size: cubeSize };

  const colX = mobile ? 22 : Math.max(40, 0.05 * w);
  const col = { x: colX, w: mobile ? w - 44 : laps.x - R - colX - 0.02 * w };

  return {
    w,
    h,
    mobile,
    lowPower,
    N,
    K,
    spl,
    a,
    b,
    psi,
    theta0,
    delta,
    epsBase,
    epsVel,
    R,
    M0,
    mRest,
    title,
    laps,
    medal,
    apex,
    exit,
    cube,
    slots: computeSlots(w, h, mobile),
    glints: computeGlints(w, h, mobile),
    path: computeExitPath(exit, a, b, psi, theta0, cube),
    col,
  };
}

/** Pure ellipse point (no precession, no wobble) at lap parameter s — the exit comet's track. */
export function ovalPoint(cx: number, cy: number, a: number, b: number, psi: number, theta0: number, s: number, out: Vec) {
  const th = theta0 - 2 * Math.PI * s;
  const x0 = a * Math.cos(th);
  const y0 = b * Math.sin(th);
  const c = Math.cos(psi);
  const sn = Math.sin(psi);
  out.x = cx + x0 * c - y0 * sn;
  out.y = cy + x0 * sn + y0 * c;
  return out;
}

export function hexVertices(cube: { x: number; y: number; size: number }): Vec[] {
  const c = Math.cos(CUBE_ROT);
  const s = Math.sin(CUBE_ROT);
  return HEX_ICON.map(([ix, iy]) => {
    const lx = ((ix - 50) / 100) * cube.size;
    const ly = ((iy - 50) / 100) * cube.size;
    return { x: cube.x + lx * c - ly * s, y: cube.y + lx * s + ly * c };
  });
}

function computeExitPath(E: Vec, a: number, b: number, psi: number, theta0: number, cube: { x: number; y: number; size: number }): ExitPath {
  const V = hexVertices(cube);
  const entry = V[4];
  const order = [4, 5, 0, 1, 2, 3, 4].map((i) => V[i]);

  // find where the second lap's tangent points straight at the cube's entry vertex
  const P = { x: 0, y: 0 };
  const Q = { x: 0, y: 0 };
  const cross = (s: number) => {
    ovalPoint(E.x, E.y, a, b, psi, theta0, s, P);
    ovalPoint(E.x, E.y, a, b, psi, theta0, s + 1e-4, Q);
    const vx = Q.x - P.x;
    const vy = Q.y - P.y;
    const dx = entry.x - P.x;
    const dy = entry.y - P.y;
    return { c: vx * dy - vy * dx, d: vx * dx + vy * dy };
  };
  let sT = 1.3;
  let prev = cross(1);
  for (let i = 1; i <= 2400; i++) {
    const s = 1 + i / 2400;
    const cur = cross(s);
    if (Math.sign(cur.c) !== Math.sign(prev.c) && cur.d > 0) {
      let lo = s - 1 / 2400;
      let hi = s;
      const sl = Math.sign(prev.c);
      for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        if (Math.sign(cross(mid).c) === sl) lo = mid;
        else hi = mid;
      }
      sT = (lo + hi) / 2;
      break;
    }
    prev = cur;
  }

  const ovalSamples = Math.ceil(sT * 420);
  const n = ovalSamples + 1 + order.length;
  const pts = new Float32Array(n * 2);
  const cum = new Float32Array(n);
  let k = 0;
  const push = (x: number, y: number) => {
    pts[k * 2] = x;
    pts[k * 2 + 1] = y;
    cum[k] = k === 0 ? 0 : cum[k - 1] + Math.hypot(x - pts[(k - 1) * 2], y - pts[(k - 1) * 2 + 1]);
    k++;
  };
  for (let i = 0; i <= ovalSamples; i++) {
    ovalPoint(E.x, E.y, a, b, psi, theta0, (i / ovalSamples) * sT, P);
    push(P.x, P.y);
  }
  const ovalEnd = cum[k - 1];
  for (const v of order) push(v.x, v.y);
  const lineEnd = cum[ovalSamples + 1];
  return { pts, cum, n: k, ovalEnd, lineEnd, len: cum[k - 1], hex: order };
}

/** Point + unit tangent at distance d along the exit path. */
export function pathAt(path: ExitPath, d: number, out: { x: number; y: number; tx: number; ty: number; i: number }) {
  const { pts, cum, n } = path;
  const dd = clamp(d, 0, path.len);
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= dd) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const t = (dd - cum[lo]) / seg;
  const x0 = pts[lo * 2];
  const y0 = pts[lo * 2 + 1];
  const x1 = pts[hi * 2];
  const y1 = pts[hi * 2 + 1];
  out.x = x0 + (x1 - x0) * t;
  out.y = y0 + (y1 - y0) * t;
  const l = Math.hypot(x1 - x0, y1 - y0) || 1;
  out.tx = (x1 - x0) / l;
  out.ty = (y1 - y0) / l;
  out.i = lo;
  return out;
}

const STRIPES = 4;

function computeSlots(w: number, h: number, mobile: boolean): Slot[] {
  const slots: Slot[] = [];
  if (mobile) {
    // a 5×5 display board: four struck rows, the honest fifth row in dashes
    const r = Math.min(0.056 * w, 24);
    const top = Math.max(0.17 * h, 150);
    const rowH = Math.min(0.088 * h, 78);
    for (let i = 0; i < 25; i++) {
      const row = Math.floor(i / 5);
      const colI = i % 5;
      const x = w * (0.14 + 0.18 * colI);
      const y = top + row * rowH;
      slots.push({ x, y, ax: x, ay: y - r - 0.42 * rowH, r, ghost: i >= 20, order: (row * 5 + Math.abs(colI - 2)) / 26, stripe: (row + colI) % STRIPES });
    }
    return slots;
  }
  // desktop: a medal rack hanging from the rafters, two tiers
  const r = clamp(0.024 * w, 26, 40);
  const x0 = 0.07 * w;
  const x1 = 0.93 * w;
  for (let i = 0; i < 25; i++) {
    const x = x0 + ((x1 - x0) * i) / 24;
    const tier = i % 2;
    const y = (tier ? 0.4 : 0.27) * h + 0.025 * h * Math.sin(i * 0.9);
    slots.push({ x, y, ax: x, ay: -8, r, ghost: i >= 20, order: Math.abs(i - 12) / 12, stripe: i % STRIPES });
  }
  return slots;
}

function computeGlints(w: number, h: number, mobile: boolean): Glint[] {
  const out: Glint[] = [];
  const cols = [RISO.paper, RISO.sun, RISO.pink, RISO.teal, RISO.cobalt, RISO.paper];
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2 + (hash(i * 3.1) - 0.5) * 0.22;
    const rx = (0.43 + hash(i * 7.7) * 0.06) * w;
    const ry = (0.4 + hash(i * 5.3) * 0.07) * h;
    const x = 0.5 * w + Math.cos(ang) * rx;
    const y = 0.5 * h + Math.sin(ang) * ry;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    out.push({ x, y, dx, dy, size: (mobile ? 5 : 7) + hash(i * 1.9) * (mobile ? 7 : 11), color: cols[i % cols.length], phase: hash(i * 9.1) * Math.PI * 2 });
  }
  return out;
}

/** Icon-unit hexagon path, for drawing the cube in SVG. */
export const CUBE_PATH = PORTAL_ICONS.cube.svg.match(/d="([^"]+)"/)?.[1] ?? "M50 12 L84 31 V69 L50 88 L16 69 V31 Z";
