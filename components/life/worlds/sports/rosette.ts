/**
 * The lap rosette — a precessing, stride-wobbled ellipse.
 *
 *   P(s) = Rot(ψ − π·s/N) · (a·cos θ, b·sin θ) · (1 + ε_lap · sin(7 · 2π · frac s)),  θ = θ0 − 2π·s
 *
 * s ∈ [0, N] is the lap parameter. Over N laps the oval precesses half a turn,
 * so the finished pattern is a symmetric guilloche — the face of the medal.
 * ε per lap is recorded from scroll velocity as the comet enters each lap
 * (fast scrollers mint a wilder rosette); with no velocity it is the base
 * wobble, so frozen progress always draws the same pattern.
 */
import { RISO, mix } from "@/components/life/multiverse/palette";

export type RosetteParams = {
  N: number;
  K: number;
  spl: number;
  a: number;
  b: number;
  psi: number;
  theta0: number;
  delta: number;
};

const TAU = Math.PI * 2;
const LOBES = 7;

/** Rosette point (relative to the rink centre) for lap parameter s and strand radius multiplier m. */
export function rosettePoint(P: RosetteParams, eps: Float32Array, s: number, m: number, out: { x: number; y: number }) {
  const N = P.N;
  const lap = Math.min(N - 1, Math.max(0, Math.floor(s)));
  const f = s - lap;
  const th = P.theta0 - TAU * s;
  const rot = P.psi - (Math.PI * s) / N;
  const k = (1 + eps[lap] * Math.sin(TAU * LOBES * f)) * m;
  const x0 = P.a * Math.cos(th) * k;
  const y0 = P.b * Math.sin(th) * k;
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  out.x = x0 * c - y0 * sn;
  out.y = x0 * sn + y0 * c;
  return out;
}

/** Lap colour: the trail walks pink → sun → teal → cobalt across the laps. */
export function lapColor(i: number, N: number): string {
  const stops = [RISO.pink, RISO.sun, RISO.teal, RISO.cobalt];
  const x = (i / Math.max(1, N - 1)) * (stops.length - 1);
  const j = Math.min(stops.length - 2, Math.floor(x));
  return mix(stops[j], stops[j + 1], x - j);
}

export function strandMul(P: RosetteParams, j: number) {
  return 1 + (j - (P.K - 1) / 2) * P.delta;
}

const tmp = { x: 0, y: 0 };

/**
 * Stroke the part of the rosette between lap parameters s0 → s1 (within ONE lap)
 * onto ctx, already translated to the rink centre and scaled.
 */
export function strokeLapSpan(
  ctx: CanvasRenderingContext2D,
  P: RosetteParams,
  eps: Float32Array,
  s0: number,
  s1: number,
  opts: { color: string; alpha: number; width: number; glow?: number; glowAlpha?: number; strands?: number },
) {
  if (s1 <= s0) return;
  const steps = Math.max(2, Math.ceil((s1 - s0) * P.spl));
  const strands = opts.strands ?? P.K;
  ctx.strokeStyle = opts.color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (opts.glow && opts.glowAlpha) {
    ctx.globalAlpha = opts.glowAlpha;
    ctx.lineWidth = opts.glow;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      rosettePoint(P, eps, s0 + ((s1 - s0) * i) / steps, 1, tmp);
      if (i === 0) ctx.moveTo(tmp.x, tmp.y);
      else ctx.lineTo(tmp.x, tmp.y);
    }
    ctx.stroke();
  }
  ctx.lineWidth = opts.width;
  for (let j = 0; j < strands; j++) {
    const m = strands === P.K ? strandMul(P, j) : 1;
    // outer strands slightly thinner in ink — reads as engraved bands
    ctx.globalAlpha = opts.alpha * (strands > 2 && (j === 0 || j === strands - 1) ? 0.72 : 1);
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      rosettePoint(P, eps, s0 + ((s1 - s0) * i) / steps, m, tmp);
      if (i === 0) ctx.moveTo(tmp.x, tmp.y);
      else ctx.lineTo(tmp.x, tmp.y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Draw laps [from, to) completely (used by the trail cache and the medal face). */
export function strokeLaps(
  ctx: CanvasRenderingContext2D,
  P: RosetteParams,
  eps: Float32Array,
  from: number,
  to: number,
  style: (i: number) => { color: string; alpha: number; width: number; glow?: number; glowAlpha?: number },
) {
  for (let i = from; i < to; i++) strokeLapSpan(ctx, P, eps, i, i + 1, style(i));
}
