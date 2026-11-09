/**
 * SVG geometry cut from the same field as the WebGL print: true crest lines
 * (minutiae included) for the microprint and the live edge, and the small
 * whorl used by the thumbprint button. All pure maths, no DOM.
 */
import { CX, CY, LAMBDA, onLevel, phaseAt, rimAt, type V2 } from "./field";

/** Print units → SVG user units. Big enough that text layout stays exact at any scale. */
export const SVG_U = 1000;

/** Point on crest `n` at polar angle `deg`, following the real phase (not just the smooth field). */
export function onCrest(deg: number, n: number): V2 {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const target = n * 2 * Math.PI;
  const q = onLevel(deg, n * LAMBDA);
  const r0 = Math.hypot(q.x - CX, q.y - CY);
  let lo = Math.max(0, r0 - LAMBDA * 0.95);
  let hi = r0 + LAMBDA * 0.95;
  for (let i = 0; i < 26; i++) {
    const m = (lo + hi) / 2;
    if (phaseAt(CX + c * m, CY + s * m) < target) lo = m;
    else hi = m;
  }
  const m = (lo + hi) / 2;
  return { x: CX + c * m, y: CY + s * m };
}

/** A crest as a polyline, clockwise on screen from `startDeg`, spanning `spanDeg`. */
export function crestLine(n: number, startDeg: number, spanDeg: number, steps = 360): V2[] {
  const pts: V2[] = [];
  for (let i = 0; i <= steps; i++) pts.push(onCrest(startDeg - (spanDeg * i) / steps, n));
  return pts;
}

/** Polyline → SVG path in print units × SVG_U, y flipped for the screen. */
export function pathD(pts: V2[], close = false): string {
  let d = "";
  for (let i = 0; i < pts.length; i++) {
    d += `${i ? "L" : "M"}${(pts[i].x * SVG_U).toFixed(1)} ${(-pts[i].y * SVG_U).toFixed(1)}`;
  }
  return close ? `${d}Z` : d;
}

/** Cumulative arc length of a polyline in print units. */
export function arcTable(pts: V2[]) {
  const out = new Float32Array(pts.length);
  for (let i = 1; i < pts.length; i++) out[i] = out[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return out;
}

export function pointAtArc(pts: V2[], arcs: Float32Array, s: number): V2 {
  let lo = 0;
  let hi = arcs.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (arcs[m] < s) lo = m;
    else hi = m;
  }
  const t = (s - arcs[lo]) / Math.max(1e-6, arcs[hi] - arcs[lo]);
  return { x: pts[lo].x + (pts[hi].x - pts[lo].x) * t, y: pts[lo].y + (pts[hi].y - pts[lo].y) * t };
}

/* ---------------------------------------------------------------- thumb */

export type ThumbRidge = { d: string; i: number };

const THUMB_N = 9;

/**
 * A small whorl in a 100×132 box: the print's own inner crests, drawn as open
 * strokes with a few lifts so it reads as a thumbprint, not as target rings.
 */
export function thumbRidges(): ThumbRidge[] {
  const out: ThumbRidge[] = [];
  const scale = 100 / (2 * (THUMB_N + 0.5) * LAMBDA * 1.02);
  const map = (p: V2): [number, number] => [50 + (p.x - CX) * scale, 72 - (p.y - CY) * scale * 0.96];
  for (let n = 1; n <= THUMB_N; n++) {
    const steps = 40 + n * 9;
    let d = "";
    let pen = false;
    // every ridge lifts once or twice somewhere, at a place that depends on n
    const liftA = (n * 97) % 360;
    const liftB = (n * 211 + 40) % 360;
    for (let i = 0; i <= steps; i++) {
      const deg = (i / steps) * 360;
      const near = (a: number, w: number) => Math.abs(((deg - a + 540) % 360) - 180) < w;
      const lifted = n > 2 && (near(liftA, 9 + n * 0.3) || (n % 3 !== 1 && near(liftB, 6)));
      const q = onLevel(deg, n * LAMBDA);
      const [x, y] = map(q);
      // keep inside an oval whose bottom is the flat of the thumb
      const inside = rimAt((x - 50) / 104, (72 - y) / 98) < 0.97;
      if (lifted || !inside) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
      pen = true;
    }
    if (d) out.push({ d, i: n });
  }
  return out;
}
