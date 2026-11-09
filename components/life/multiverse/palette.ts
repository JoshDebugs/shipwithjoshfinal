/**
 * The Riso palette — the only colours the Life multiverse is allowed to use.
 *
 * Every world leads with a different pair from this set. New shades come from
 * how riso inks actually behave: overprinting (multiply) and thinning the ink
 * (opacity / mixing with paper), never from new hues.
 */
export const RISO = {
  paper: "#F1EADB",
  ink: "#1B1A17",
  pink: "#FF4F9A",
  sun: "#FFB81F",
  teal: "#00897B",
  cobalt: "#3F5BF2",
} as const;

export type RisoInk = keyof typeof RISO;

/** Cold → white-hot ramp built only from palette inks (Fitness thermal world, heat maps). */
export const RISO_RAMP = [RISO.ink, RISO.cobalt, RISO.teal, RISO.pink, RISO.sun, RISO.paper] as const;

function toRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** Linear mix between two colours, t ∈ [0, 1]. */
export function mix(a: string, b: string, t: number): string {
  const A = toRgb(a);
  const B = toRgb(b);
  return toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

/** What two inks look like printed on top of each other (multiply blend). */
export function overprint(a: string, b: string): string {
  const A = toRgb(a);
  const B = toRgb(b);
  return toHex([(A[0] * B[0]) / 255, (A[1] * B[1]) / 255, (A[2] * B[2]) / 255]);
}

/** `rgba()` string for a palette hex at the given alpha. */
export function alpha(hex: string, a: number): string {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Sample the thermal ramp at t ∈ [0, 1]. */
export function ramp(t: number, stops: readonly string[] = RISO_RAMP): string {
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return mix(stops[i], stops[i + 1], x - i);
}
