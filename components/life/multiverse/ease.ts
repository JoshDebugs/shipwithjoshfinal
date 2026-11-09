/** Small, allocation-free math helpers shared by every world. */

export const clamp = (v: number, min = 0, max = 1) => (v < min ? min : v > max ? max : v);

/** Map v from [a, b] to [0, 1], clamped. */
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Rise 0→1 over [a, b] then fall back 1→0 over [c, d]. */
export const bell = (v: number, a: number, b: number, c: number, d: number) =>
  Math.min(range(v, a, b), 1 - range(v, c, d));

export const smoothstep = (t: number) => t * t * (3 - 2 * t);
export const easeInCubic = (t: number) => t * t * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const expoOut = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const expoIn = (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10));
export const backOut = (t: number, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);

/** Deterministic pseudo-random in [0, 1) from an integer seed (stable across renders). */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
