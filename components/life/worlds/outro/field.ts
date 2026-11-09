/**
 * The print. One smooth "ridge count from the core" field F(x, y) whose level
 * sets are the ridges, plus phase vortex pairs for the minutiae:
 *
 *   phase = 2π·F/λ + Σ arg((z − P1)/(z − P2))       ridge where cos(phase) ≈ 1
 *
 * F = smax(elliptical radius around the core, a cupped "bottom" field), so the
 * inner rings are closed ovals, the outer ones flatten into the ridges that
 * run across the base of the finger, and their corners read as deltas.
 * A ± vortex pair is a real dislocation: depending on where it sits on the
 * ridge it draws a ridge ending, a bifurcation, a lake, an island or a spur
 * (positions are solved below so each one is the minutia its label says).
 *
 * Pure maths, no imports: the same constants feed the GLSL terrain
 * (`FIELD_GLSL`), the 2D raster (fallback / Static) and the SVG overlays.
 * Print space: x ∈ [−0.5, 0.5], y ∈ [−0.675, 0.675], y up.
 */

export const PW = 1;
export const PH = 1.35;
/** Whorl core. */
export const CX = 0.008;
export const CY = 0.07;
/** Elliptical stretch of the rings: long inner loops, rounder outer rings. */
const AY_IN = 1.42;
const AY_OUT = 1.14;
const AY_R = 0.3;
/** The whorl leans a few degrees clockwise, like a real thumb. */
const ROT = 0.11;
const RC = Math.cos(ROT);
const RS = Math.sin(ROT);
/** Ridge period. */
export const LAMBDA = 0.0193;
/** Eleven worlds, two ridges each (band 0 also owns the core dot). */
export const BANDS = 11;
/** Crest index of the live edge (the sun ridge that keeps drawing itself). */
export const EDGE_N = 23;
/** Bottom field: cupped ridges under the whorl. */
const D0 = 0.03;
const CUP = 1.05;
const TILT = -0.06;
const SB = 1.0;
const SMOOTH = 0.42 * LAMBDA;
/** Gentle organic warp of the whole print. */
const W1 = 0.0055;
const W2 = 0.0035;

export type V2 = { x: number; y: number };

/* ----------------------------------------------------------------- base F */

export type FieldSample = { F: number; gx: number; gy: number };

/** Smooth field (no vortices) and its gradient. */
export function baseField(x: number, y: number, out: FieldSample = { F: 0, gx: 0, gy: 0 }): FieldSample {
  // warp (gradient ignores the tiny Jacobian)
  const wx = x + W1 * Math.sin(6.1 * y + 0.7) + W2 * Math.sin(9.7 * (x + y) + 1.9);
  const wy = y + W1 * Math.sin(5.3 * x + 2.3) + W2 * Math.sin(8.9 * (x - y) + 0.4);
  const dx = wx - CX;
  const dy = wy - CY;
  // rotated frame q = R·d, stretch eased from AY_IN (core) to AY_OUT
  const qx = RC * dx + RS * dy;
  const qy = -RS * dx + RC * dy;
  const r0 = Math.sqrt(qx * qx + (qy / AY_OUT) * (qy / AY_OUT));
  const st = Math.min(1, r0 / AY_R);
  const A = AY_IN + (AY_OUT - AY_IN) * st * st * (3 - 2 * st);
  const ey = qy / A;
  const r = Math.sqrt(qx * qx + ey * ey) + 1e-6;
  // gradient (ignoring dA/dp), rotated back: ∇d = Rᵀ∇q
  const gqx = qx / r;
  const gqy = ey / A / r;
  const rgx = RC * gqx - RS * gqy;
  const rgy = RS * gqx + RC * gqy;
  // cupped bottom: B = (yc(x) − y)·SB, yc = CY − D0 + CUP·x² + TILT·x
  const yc = CY - D0 + CUP * dx * dx + TILT * dx;
  const B = (yc - wy) * SB;
  const bgx = (2 * CUP * dx + TILT) * SB;
  const bgy = -SB;
  // polynomial smooth max
  const w = Math.min(1, Math.max(0, 0.5 + (0.5 * (r - B)) / SMOOTH));
  out.F = B + w * (r - B) + SMOOTH * w * (1 - w);
  out.gx = w * rgx + (1 - w) * bgx;
  out.gy = w * rgy + (1 - w) * bgy;
  return out;
}

const tmp: FieldSample = { F: 0, gx: 0, gy: 0 };
export function F(x: number, y: number): number {
  return baseField(x, y, tmp).F;
}

/* ------------------------------------------------------------ minutiae */

export type MinutiaKind = "bifurcation" | "lake" | "spur" | "ending" | "island";

export type Pair = { a: V2; b: V2; /** fade radius (0 = exact, global) */ fade: number };

/**
 * Vortex pairs, solved at module load. Order matters for the GLSL uniforms.
 * 0 core spiral · 1 bifurcation/ending · 2 lake · 3 spur · 4 island
 */
export const PAIRS: Pair[] = [];

export type Minutia = { kind: MinutiaKind; x: number; y: number };
/** Callout anchor for each value (print coords), in list order. */
export const MINUTIAE: Record<MinutiaKind, Minutia> = {} as Record<MinutiaKind, Minutia>;

function wrapPi(a: number) {
  a = (a + Math.PI) % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  return a - Math.PI;
}

/** arg((z − a)/(z − b)), cut on the segment a→b. */
function pairArg(x: number, y: number, a: V2, b: V2) {
  const ax = x - a.x;
  const ay = y - a.y;
  const bx = x - b.x;
  const by = y - b.y;
  // (z−a)·conj(z−b)
  return Math.atan2(ay * bx - ax * by, ax * bx + ay * by);
}

function pairFade(x: number, y: number, p: Pair) {
  if (p.fade <= 0) return 1;
  const mx = (p.a.x + p.b.x) / 2;
  const my = (p.a.y + p.b.y) / 2;
  const d = Math.hypot(x - mx, y - my) / p.fade;
  // smooth 1 → 0 over [0.55, 1] of the radius (the cut is always well inside)
  const t = Math.min(1, Math.max(0, (d - 0.55) / 0.45));
  return 1 - t * t * (3 - 2 * t);
}

/** Total phase at a point (radians). `skip` leaves one pair out (solver). */
export function phaseAt(x: number, y: number, skip = -1): number {
  let ph = (2 * Math.PI * F(x, y)) / LAMBDA;
  for (let i = 0; i < PAIRS.length; i++) {
    if (i === skip) continue;
    const p = PAIRS[i];
    ph += pairArg(x, y, p.a, p.b) * pairFade(x, y, p);
  }
  return ph;
}

/** Point at polar angle `deg` (around the core) where F = level. */
export function onLevel(deg: number, level: number): V2 {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  let lo = 0;
  let hi = 1.4;
  for (let i = 0; i < 48; i++) {
    const m = (lo + hi) / 2;
    if (F(CX + c * m, CY + s * m) < level) lo = m;
    else hi = m;
  }
  const m = (lo + hi) / 2;
  return { x: CX + c * m, y: CY + s * m };
}

function frameAt(p: V2) {
  const g = baseField(p.x, p.y, { F: 0, gx: 0, gy: 0 });
  const len = Math.hypot(g.gx, g.gy) || 1;
  const nx = g.gx / len;
  const ny = g.gy / len;
  // tangent: counter-clockwise around the core
  return { nx, ny, tx: -ny, ty: nx, grad: len };
}

/**
 * Nudge a vortex along the ridge normal until the ridge leaves it in the
 * direction `alpha` (radians). charge +1 (pair.a) or −1 (pair.b).
 */
function solveVortex(pairIndex: number, which: "a" | "b", alpha: number) {
  const p = PAIRS[pairIndex];
  for (let it = 0; it < 6; it++) {
    const v = p[which];
    const o = which === "a" ? p.b : p.a;
    const self = which === "a" ? 1 : -1;
    // Own pair term = arg(z−a) − arg(z−b). Near a it is α − arg(a−b); near b it is arg(b−a) − α.
    const partner = Math.atan2(v.y - o.y, v.x - o.x); // arg(v − other)
    const phiRest = phaseAt(v.x, v.y, pairIndex) + (self === 1 ? -partner : partner);
    // ridge direction: charge +1 → α_r = −phiRest ; charge −1 → α_r = phiRest
    const err = self === 1 ? wrapPi(-phiRest - alpha) : wrapPi(phiRest - alpha);
    if (Math.abs(err) < 1e-4) break;
    // moving along +n raises phase by 2π·|∇F|/λ per unit → shifts α_r by ∓ that
    const fr = frameAt(v);
    const k = (2 * Math.PI * fr.grad) / LAMBDA;
    const step = self === 1 ? err / k : -err / k;
    v.x += fr.nx * step;
    v.y += fr.ny * step;
  }
}

/**
 * Shift a whole pair along the ridge normal until the phase of everything
 * else at its midpoint is `target` (0 = sits on a crest, π = in a valley).
 */
function solveMid(pairIndex: number, target: number) {
  const p = PAIRS[pairIndex];
  for (let it = 0; it < 6; it++) {
    const mx = (p.a.x + p.b.x) / 2;
    const my = (p.a.y + p.b.y) / 2;
    const err = wrapPi(target - phaseAt(mx, my, pairIndex));
    if (Math.abs(err) < 1e-4) break;
    const fr = frameAt({ x: mx, y: my });
    const step = err / ((2 * Math.PI * fr.grad) / LAMBDA);
    p.a.x += fr.nx * step;
    p.a.y += fr.ny * step;
    p.b.x += fr.nx * step;
    p.b.y += fr.ny * step;
  }
}

/**
 * A tight pair laid along the ridge. Walking a→b with the outward normal on
 * the LEFT pushes the neighbouring ridges away, so a pair on a crest opens a
 * lake and a pair in a valley grows an island. `tilt` (rad) angles it across.
 */
function tightPair(deg: number, level: number, len: number, fade: number, tilt = 0): Pair {
  const a = onLevel(deg, level);
  const fr = frameAt(a);
  // −t has the outward normal on its left
  const c = Math.cos(tilt);
  const s = Math.sin(tilt);
  const dx = -fr.tx * c + fr.nx * s;
  const dy = -fr.ty * c + fr.ny * s;
  return { a, b: { x: a.x + dx * len, y: a.y + dy * len }, fade };
}

/** Build every pair at a nominal place, then solve its polarity. */
(function build() {
  const ang = (t: { tx: number; ty: number }, sign = 1) => Math.atan2(sign * t.ty, sign * t.tx);

  // Every pair's cut (the segment a→b) stays inside ONE band, so the colour
  // that follows each ridge never switches mid-ridge at a visible place.

  // 0 · core spiral: +1 on the core, −1 a couple of ridges up and right (band 0)
  PAIRS.push({ a: { x: CX, y: CY }, b: onLevel(62, 1.6 * LAMBDA), fade: 6 * LAMBDA });

  // 1 · CURIOSITY bifurcation + ADAPTABILITY ridge ending, both mid-band 6 (crests 13–14)
  PAIRS.push({ a: onLevel(64, 13.5 * LAMBDA), b: onLevel(31, 13.5 * LAMBDA), fade: 0 });

  // 2 · OBSESSION lake: on crest 10 (band 4)
  PAIRS.push(tightPair(-16, 10 * LAMBDA, 3.4 * LAMBDA, 9 * LAMBDA));

  // 3 · EXPERIMENTATION spur: a valley pair on a tight curve — one end fuses with the
  //     ridge below, the other stops short (band 3, between crests 7 and 8)
  PAIRS.push(tightPair(-70, 7.5 * LAMBDA, 2.7 * LAMBDA, 8 * LAMBDA));

  // 4 · BUILDING island: a free-standing short ridge, tilted into its valley (band 2)
  PAIRS.push(tightPair(-38, 5.5 * LAMBDA, 2.6 * LAMBDA, 8 * LAMBDA, -0.22));

  for (let pass = 0; pass < 3; pass++) {
    // bifurcation: the fork opens along +t, so its stem (a ridge) leaves along −t
    solveVortex(1, "a", ang(frameAt(PAIRS[1].a), -1));
    // ridge ending: the ridge leaves along +t
    solveVortex(1, "b", ang(frameAt(PAIRS[1].b), 1));
    solveMid(2, 0);
    solveMid(3, Math.PI);
    solveMid(4, Math.PI - 1.05);
  }

  const mid = (p: Pair): V2 => ({ x: (p.a.x + p.b.x) / 2, y: (p.a.y + p.b.y) / 2 });
  MINUTIAE.bifurcation = { kind: "bifurcation", ...PAIRS[1].a };
  MINUTIAE.lake = { kind: "lake", ...mid(PAIRS[2]) };
  MINUTIAE.spur = { kind: "spur", ...mid(PAIRS[3]) };
  MINUTIAE.ending = { kind: "ending", ...PAIRS[1].b };
  MINUTIAE.island = { kind: "island", ...mid(PAIRS[4]) };
})();

/* -------------------------------------------------------------- height */

/** Print outline: 0 inside, 1 on the rim (flatter at the base of the finger). */
export function rimAt(x: number, y: number): number {
  const u = x / 0.5;
  const v = y / (PH / 2);
  const vb = v < 0 ? Math.pow(Math.abs(v), 2.4) : v * v;
  return Math.sqrt(u * u + vb);
}

/** Crest index (0 = core dot) → band 0…10, 11 = live edge, 12 = beyond. */
export function bandOfCrest(n: number): number {
  if (n <= 2) return 0;
  if (n >= EDGE_N + 1) return 12;
  if (n === EDGE_N) return 11;
  return Math.min(10, Math.floor((n - 1) / 2));
}

/** Band as a continuous value from F (for colouring), boundaries in valleys. */
export function bandOfF(f: number): number {
  return bandOfCrest(Math.round(f / LAMBDA));
}

/** Crest index from the total phase: constant along each ridge, jumps only on a vortex cut. */
export function crestOf(phase: number): number {
  return Math.floor(phase / (2 * Math.PI) + 0.5);
}

/* ---------------------------------------------------------- ridge ink */

/** 32-bit integer hash (identical in GLSL: uint ops). */
export function hash32(x: number): number {
  x >>>= 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}
const h01 = (x: number) => (hash32(x) & 0xffffff) / 16777216;

/**
 * Periodic value noise along a ridge: `u` = turns around the core (0…1),
 * `cells` per turn, one independent stream per crest.
 */
function ridgeNoise(crest: number, u: number, cells: number, salt: number): number {
  const x = (u - Math.floor(u)) * cells;
  const i = Math.floor(x);
  const f = x - i;
  const seed = (crest + 64) * 7919 + salt * 104729;
  const a = h01(seed + (i % cells));
  const b = h01(seed + ((i + 1) % cells));
  const k = f * f * (3 - 2 * f);
  return a + (b - a) * k;
}

/** Breaks + width wobble for crest `c` at polar turn `u`. Returns [gap 0…1, width offset]. */
export function ridgeBreak(c: number, u: number, nearMinutia: number): [number, number] {
  const cells = Math.max(6, Math.round(c * 1.7 + 4));
  const g = ridgeNoise(c, u, cells, 1);
  const allow = c >= 3 && c !== EDGE_N ? 1 - nearMinutia : 0;
  const t = Math.min(1, Math.max(0, (g - 0.8) / 0.07));
  const gap = t * t * (3 - 2 * t) * allow;
  const wob = (ridgeNoise(c, u, cells * 2, 2) - 0.5) * 0.24;
  return [gap, wob];
}

/** 1 near any minutia pair (no random breaks there), 0 away from them. */
export function minutiaShield(x: number, y: number): number {
  let m = 0;
  for (let i = 1; i < PAIRS.length; i++) {
    const p = PAIRS[i];
    const R = i === 1 ? 3.2 * LAMBDA : 4.5 * LAMBDA;
    for (const v of i === 1 ? [p.a, p.b] : [{ x: (p.a.x + p.b.x) / 2, y: (p.a.y + p.b.y) / 2 }]) {
      const d = Math.hypot(x - v.x, y - v.y) / R;
      m = Math.max(m, 1 - Math.min(1, Math.max(0, (d - 0.6) / 0.4)));
    }
  }
  return m;
}

export type Ink = { phase: number; F: number; crest: number; band: number; cos: number; gap: number; wob: number };

/** Everything the 2D raster needs at a point. */
export function inkAt(x: number, y: number, out: Ink): Ink {
  const ph = phaseAt(x, y);
  const c = crestOf(ph);
  const u = Math.atan2(y - CY, x - CX) / (2 * Math.PI);
  const [gap, wob] = ridgeBreak(c, u, minutiaShield(x, y));
  out.phase = ph;
  out.F = F(x, y);
  out.crest = c;
  out.band = bandOfCrest(c);
  out.cos = Math.cos(ph);
  out.gap = gap;
  out.wob = wob;
  return out;
}

/* --------------------------------------------------------------- tracing */

/** A level set of F as a closed polar loop around the core (print coords). */
export function traceLevel(level: number, n = 360): V2[] {
  const pts: V2[] = [];
  for (let i = 0; i < n; i++) pts.push(onLevel((i / n) * 360, level));
  return pts;
}

/* -------------------------------------------------------------- the path */

/** Flight line: from the base of the print straight up to the core. */
export const FLIGHT_X = CX + 0.018;
export const FLIGHT_Y0 = -0.6;
export const FLIGHT_Y1 = CY - 0.034;

/** Where the flight line crosses the middle of band k (print y). */
export function bandCrossY(k: number): number {
  const mid = k === 0 ? 1.4 : 2 * k + 1.5; // crest index at the band's centre
  const level = mid * LAMBDA;
  let lo = FLIGHT_Y0;
  let hi = CY;
  // F decreases toward the core along the line
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (F(FLIGHT_X, m) > level) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/* ---------------------------------------------------------------- GLSL */

const n = (v: number) => (Number.isInteger(v) ? v.toFixed(1) : v.toFixed(7));

/**
 * GLSL twin of the maths above. Exposes:
 *   void baseField(vec2 p, out float F, out vec2 g)
 *   float phaseAt(vec2 p, out vec2 grad)   (needs uniform vec2 uPairA[5], uPairB[5]; float uPairFade[5])
 *   float rimAt(vec2 p)
 */
export const FIELD_GLSL = /* glsl */ `
#define LAMBDA ${n(LAMBDA)}
#define PI2 6.28318530718
const vec2 CORE = vec2(${n(CX)}, ${n(CY)});
uniform vec2 uPairA[5];
uniform vec2 uPairB[5];
uniform float uPairFade[5];

void baseField(vec2 p, out float F, out vec2 g) {
  vec2 w = p + vec2(
    ${n(W1)} * sin(6.1 * p.y + 0.7) + ${n(W2)} * sin(9.7 * (p.x + p.y) + 1.9),
    ${n(W1)} * sin(5.3 * p.x + 2.3) + ${n(W2)} * sin(8.9 * (p.x - p.y) + 0.4));
  vec2 d = w - CORE;
  vec2 q = vec2(${n(RC)} * d.x + ${n(RS)} * d.y, -${n(RS)} * d.x + ${n(RC)} * d.y);
  float r0 = length(vec2(q.x, q.y / ${n(AY_OUT)}));
  float st = min(1.0, r0 / ${n(AY_R)});
  float A = ${n(AY_IN)} + (${n(AY_OUT - AY_IN)}) * st * st * (3.0 - 2.0 * st);
  float ey = q.y / A;
  float r = sqrt(q.x * q.x + ey * ey) + 1e-6;
  vec2 gq = vec2(q.x, ey / A) / r;
  vec2 rg = vec2(${n(RC)} * gq.x - ${n(RS)} * gq.y, ${n(RS)} * gq.x + ${n(RC)} * gq.y);
  float yc = CORE.y - ${n(D0)} + ${n(CUP)} * d.x * d.x + ${n(TILT)} * d.x;
  float B = (yc - w.y) * ${n(SB)};
  vec2 bg = vec2((2.0 * ${n(CUP)} * d.x + ${n(TILT)}) * ${n(SB)}, -${n(SB)});
  float k = ${n(SMOOTH)};
  float t = clamp(0.5 + 0.5 * (r - B) / k, 0.0, 1.0);
  F = B + t * (r - B) + k * t * (1.0 - t);
  g = mix(bg, rg, t);
}

float pairFade(vec2 p, int i) {
  float f = uPairFade[i];
  if (f <= 0.0) return 1.0;
  float d = length(p - 0.5 * (uPairA[i] + uPairB[i])) / f;
  float t = clamp((d - 0.55) / 0.45, 0.0, 1.0);
  return 1.0 - t * t * (3.0 - 2.0 * t);
}

// total phase and its gradient (radians, print units)
float phaseAt(vec2 p, out float F, out vec2 grad) {
  vec2 g;
  baseField(p, F, g);
  float ph = PI2 * F / LAMBDA;
  grad = PI2 * g / LAMBDA;
  for (int i = 0; i < 5; i++) {
    vec2 a = p - uPairA[i];
    vec2 b = p - uPairB[i];
    float fade = pairFade(p, i);
    if (fade <= 0.0) continue;
    ph += fade * atan(a.y * b.x - a.x * b.y, a.x * b.x + a.y * b.y);
    grad += fade * (vec2(-a.y, a.x) / max(dot(a, a), 1e-7) - vec2(-b.y, b.x) / max(dot(b, b), 1e-7));
  }
  return ph;
}

float rimAt(vec2 p) {
  vec2 q = vec2(p.x / 0.5, p.y / ${n(PH / 2)});
  float vb = q.y < 0.0 ? pow(abs(q.y), 2.4) : q.y * q.y;
  return sqrt(q.x * q.x + vb);
}
`;
