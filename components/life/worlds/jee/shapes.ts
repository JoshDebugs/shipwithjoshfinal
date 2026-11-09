/**
 * Shadow silhouettes.
 *
 * Every wall shadow is N slabs: oriented rectangles in wall units, the shadows
 * of N imagined books. At the two solve angles the slabs tile a silhouette
 * (Anton JEE and IIT, the shared laptop portal icon) and the shader takes over
 * with the exact analytic outline. Between those angles they slide past each
 * other into a tangle, which is what a shadow sculpture actually does off-axis.
 */

import { hash } from "@/components/life/multiverse/ease";
import type { GlyphBox, IconBox } from "./rig";

export type Slab = { x: number; y: number; hx: number; hy: number; r: number };

type Rect = readonly [number, number, number, number];

// Outlines measured from the real Anton glyphs (x in cap-heights, y up).
export const JEE_RECTS: Rect[] = [
  [0.3081, 0.2229, 0.5097, 1],
  [0.0213, 0.2229, 0.219, 0.4709],
  [0.0213, -0.0097, 0.5097, 0.2229],
  [0.5868, 0, 0.7903, 1],
  [0.7903, 0, 0.9996, 0.1957],
  [0.7903, 0.4225, 0.9782, 0.6124],
  [0.7903, 0.8062, 0.986, 1],
  [1.0654, 0, 1.2689, 1],
  [1.2689, 0, 1.4782, 0.1957],
  [1.2689, 0.4225, 1.4568, 0.6124],
  [1.2689, 0.8062, 1.4646, 1],
];

export const IIT_RECTS: Rect[] = [
  [0.0349, 0, 0.2287, 1],
  [0.2983, 0, 0.4921, 1],
  [0.6566, 0, 0.8563, 0.8062],
  [0.5384, 0.8062, 0.9745, 1],
];

// PORTAL_ICONS.laptop, y down, as tiling rectangles.
export const LAPTOP_RECTS: Rect[] = [
  [14, 8, 86, 60],
  [10, 64, 90, 78],
];

/** Split rectangles into exactly n overlapping slabs, sliced across their long axis. */
function tile(rects: Rect[], n: number): Rect[] {
  const areas = rects.map(([x0, y0, x1, y1]) => (x1 - x0) * (y1 - y0));
  const total = areas.reduce((a, b) => a + b, 0);
  const counts = areas.map((a) => Math.max(1, Math.round((a / total) * n)));
  let sum = counts.reduce((a, b) => a + b, 0);
  while (sum !== n) {
    const i = sum > n ? counts.indexOf(Math.max(...counts)) : areas.indexOf(Math.max(...areas));
    counts[i] += sum > n ? -1 : 1;
    sum += sum > n ? -1 : 1;
  }
  const out: Rect[] = [];
  rects.forEach(([x0, y0, x1, y1], i) => {
    const c = counts[i];
    const tall = y1 - y0 >= x1 - x0;
    for (let k = 0; k < c; k++) {
      const a = k / c;
      const b = (k + 1) / c;
      const ov = 0.012 / c;
      out.push(
        tall
          ? [x0, y0 + (y1 - y0) * Math.max(0, a - ov), x1, y0 + (y1 - y0) * Math.min(1, b + ov)]
          : [x0 + (x1 - x0) * Math.max(0, a - ov), y0, x0 + (x1 - x0) * Math.min(1, b + ov), y1],
      );
    }
  });
  return out;
}

/** Deterministic Fisher–Yates, so a slab's neighbours in one shape are strangers in the next. */
function shuffled<T>(a: T[], seed: number): T[] {
  const o = a.slice();
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.floor(hash(seed + i) * (i + 1));
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
}

export function glyphSlabs(rects: Rect[], n: number, box: GlyphBox, seed: number): Slab[] {
  return shuffled(tile(rects, n), seed).map(([x0, y0, x1, y1]) => ({
    x: box.u0 + ((x0 + x1) / 2) * box.sx,
    y: box.v0 + ((y0 + y1) / 2) * box.sy,
    hx: ((x1 - x0) / 2) * box.sx,
    hy: ((y1 - y0) / 2) * box.sy,
    r: 0,
  }));
}

export function iconSlabs(rects: Rect[], n: number, box: IconBox, seed: number): Slab[] {
  const k = box.size / 100;
  return shuffled(tile(rects, n), seed).map(([x0, y0, x1, y1]) => ({
    x: box.u + ((x0 + x1) / 2) * k,
    y: box.top - ((y0 + y1) / 2) * k,
    hx: ((x1 - x0) / 2) * k,
    hy: ((y1 - y0) / 2) * k,
    r: 0,
  }));
}

/** A tangle, normalised: x in −.5….5 of width, y in 0…1 of height, sizes in wall units. */
export type Knot = { x: number; y: number; hx: number; hy: number; r: number };

export function knots(n: number, seed: number): Knot[] {
  const out: Knot[] = [];
  for (let i = 0; i < n; i++) {
    const h = (k: number) => hash(seed * 7.3 + i * 13.1 + k);
    // the first few stay low and fat: the heap the sticks grow out of
    const base = i < n * 0.22;
    const y = base ? h(1) * 0.16 : Math.pow(h(1), 1.25) * 0.97;
    const spread = 1.05 - 0.62 * y;
    out.push({
      x: (h(2) - 0.5) * spread,
      y,
      hx: base ? 0.7 + h(3) * 0.75 : 0.42 + h(3) * 0.95,
      hy: base ? 0.16 + h(4) * 0.2 : 0.055 + h(4) * 0.13,
      r: base ? (h(5) - 0.5) * 0.5 : (h(5) - 0.5) * 2.9,
    });
  }
  return out;
}

/** Fill `out` with a tangle centred on `cx`, rising from `base`. */
export function placeKnots(out: Slab[], src: Knot[], cx: number, base: number, width: number, height: number, unit: number) {
  for (let i = 0; i < src.length; i++) {
    const k = src[i];
    const o = out[i];
    o.x = cx + k.x * width;
    o.y = base + k.y * height;
    o.hx = k.hx * unit;
    o.hy = k.hy * unit;
    o.r = k.r;
  }
}

export const emptySlabs = (n: number): Slab[] => Array.from({ length: n }, () => ({ x: 0, y: 0, hx: 0, hy: 0, r: 0 }));

const ease = (t: number) => t * t * (3 - 2 * t);

/**
 * Write the slabs for one wall: A → (through C) → B at s, as a quadratic that
 * passes exactly through C at the midpoint, staggered per slab so the tangle
 * never moves as one rigid piece.
 */
export function writeSlabs(
  outS: Float32Array,
  outR: Float32Array,
  A: Slab[],
  C: Slab[],
  B: Slab[],
  s: number,
  boil: number,
  phase: number,
) {
  const stag = 0.24;
  for (let i = 0; i < A.length; i++) {
    const a = A[i];
    const b = B[i];
    const c = C[i];
    const d = hash(i * 3.17 + 0.5) * stag;
    const ls = Math.min(1, Math.max(0, (s - d) / (1 - stag)));
    const e = ease(ls);
    const k0 = (1 - e) * (1 - e);
    const k1 = 2 * e * (1 - e);
    const k2 = e * e;
    const mx = 2 * c.x - 0.5 * a.x - 0.5 * b.x;
    const my = 2 * c.y - 0.5 * a.y - 0.5 * b.y;
    const mhx = 2 * c.hx - 0.5 * a.hx - 0.5 * b.hx;
    const mhy = 2 * c.hy - 0.5 * a.hy - 0.5 * b.hy;
    const mr = 2 * c.r - 0.5 * a.r - 0.5 * b.r;
    const wob = boil * k1 * 2;
    const x = k0 * a.x + k1 * mx + k2 * b.x + Math.sin(phase * 1.7 + i * 2.1) * wob * 0.1;
    const y = k0 * a.y + k1 * my + k2 * b.y + Math.sin(phase * 1.3 + i * 4.7) * wob * 0.08;
    const hx = Math.max(0.001, k0 * a.hx + k1 * mhx + k2 * b.hx);
    const hy = Math.max(0.001, k0 * a.hy + k1 * mhy + k2 * b.hy);
    const r = k0 * a.r + k1 * mr + k2 * b.r + Math.sin(phase + i * 1.9) * wob * 0.09;
    outS[i * 4] = x;
    outS[i * 4 + 1] = y;
    outS[i * 4 + 2] = hx;
    outS[i * 4 + 3] = hy;
    outR[i * 2] = Math.cos(r);
    outR[i * 2 + 1] = Math.sin(r);
  }
}
