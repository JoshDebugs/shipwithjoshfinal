/**
 * The live waveform: one function shared by the canvas trace and by the
 * words that ride it, so type and line can never disagree.
 *
 * A voice is a fundamental plus partials whose loudness drifts in syllables
 * (simplex noise). At the clip the signal collapses onto its fundamental and
 * the rails clamp it — which is exactly what a square wave is.
 */
import { createNoise2D } from "simplex-noise";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic noise (fixed seed): the same world every visit. */
export const noise2D = createNoise2D(mulberry32(1111));

export type WaveState = {
  W: number;
  H: number;
  /** Baseline (px). */
  base: number;
  /** Peak displacement of the voice (px). */
  amp: number;
  /** 0 → voice, 1 → pure fundamental (which the rails turn into a square). */
  square: number;
  /** Ambient clock (s). */
  t: number;
  /** Where the mic stands — the source. */
  micX: number;
  /** Spike height at the mic (px, from the taps). */
  tap: number;
  /** Clamp rails (px). Use ±Infinity when nothing clips. */
  railTop: number;
  railBot: number;
  /** Fundamental wavenumber (rad/px). */
  k: number;
  /** A held-down stretch of line (where the skate stands): centre, half-width, amount 0..1. */
  quietX: number;
  quietW: number;
  quiet: number;
  /** A second held-down stretch (where the mic stands at the exit). */
  quiet2X: number;
  quiet2W: number;
  quiet2: number;
};

export function makeWaveState(): WaveState {
  return { W: 1, H: 1, base: 0, amp: 0, square: 0, t: 0, micX: 0, tap: 0, railTop: -Infinity, railBot: Infinity, k: 0.01, quietX: 0, quietW: 1, quiet: 0, quiet2X: 0, quiet2W: 1, quiet2: 0 };
}

/** Loudness across x: the mic is the source; the edges are quieter (until it clips). */
function envelope(x: number, s: WaveState) {
  const dx = (x - s.micX) / (s.W * 0.42);
  const e = 0.42 + 0.58 * Math.exp(-dx * dx);
  const env = e + (1 - e) * s.square;
  let out = env;
  if (s.quiet > 0) {
    const q = (x - s.quietX) / s.quietW;
    out *= 1 - s.quiet * Math.exp(-q * q);
  }
  if (s.quiet2 > 0) {
    const q = (x - s.quiet2X) / s.quiet2W;
    out *= 1 - s.quiet2 * Math.exp(-q * q);
  }
  return out;
}

/** Only the fundamental, with the same envelope — the path the words ride. */
export function waveSmooth(x: number, s: WaveState) {
  const low = Math.sin(x * s.k - s.t * 2.1);
  const syll = 0.72 + 0.28 * noise2D(x * 0.0021, s.t * 0.3);
  return -s.amp * low * envelope(x, s) * (syll + (1 - syll) * s.square) * 0.62;
}

export function waveY(x: number, s: WaveState): number {
  const low = Math.sin(x * s.k - s.t * 2.1);
  const mid = Math.sin(x * s.k * 2.7 + s.t * 3.3 + 1.3);
  const hi = Math.sin(x * s.k * 6.1 - s.t * 7.9 + 0.4);
  const syll = 0.62 + 0.38 * noise2D(x * 0.0021, s.t * 0.3);
  const voice = (0.62 * low + 0.26 * mid + 0.12 * hi) * syll;
  const sig = voice + (low - voice) * s.square;
  let y = s.base - s.amp * sig * envelope(x, s);
  if (s.tap > 0.01) {
    // a knuckle on the mic: a hard spike at the source that rings outward
    const d = x - s.micX;
    const ad = Math.abs(d);
    const spike = Math.exp(-(d * d) / 260);
    const ring = Math.sin(ad * 0.085 - 1.2) * Math.exp(-ad / 150);
    y -= s.tap * (spike + 0.45 * ring);
  }
  if (y < s.railTop) y = s.railTop;
  else if (y > s.railBot) y = s.railBot;
  return y;
}

/** Polyline path string for an offset copy of the smooth wave (for <textPath>). */
export function smoothPath(s: WaveState, offset: number, step: number) {
  let d = "";
  const x0 = -step * 2;
  const x1 = s.W + step * 2;
  for (let x = x0; x <= x1; x += step) {
    const y = s.base + offset + waveSmooth(x, s);
    d += `${x === x0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}
