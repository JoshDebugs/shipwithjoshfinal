/**
 * Heat Signature's inks. The thermal ramp IS the Riso ramp (ink → cobalt →
 * teal → pink → sun → paper); the easter-egg modes are other ramps built only
 * from palette inks and the shades riso ink makes (overprint / mix).
 */
import { RISO, RISO_RAMP, alpha, mix, overprint } from "@/components/life/multiverse/palette";

export const C = {
  ink: RISO.ink,
  paper: RISO.paper,
  pink: RISO.pink,
  sun: RISO.sun,
  teal: RISO.teal,
  cobalt: RISO.cobalt,
  /** HUD text and strokes. */
  hud: RISO.paper,
  hudDim: alpha(RISO.paper, 0.58),
  hudFaint: alpha(RISO.paper, 0.26),
  /** The cold field behind everything (what the page shows before the canvas paints). */
  field: mix(RISO.ink, RISO.cobalt, 0.16),
} as const;

export type ModeId = "IRONBOW" | "RAINBOW" | "LAVA" | "ARCTIC" | "VISIBLE";

export type Mode = { id: ModeId; stops: readonly string[] };

/** Tap the HUD to cycle. Every stop is a palette ink or a riso-derived shade of one. */
export const MODES: readonly Mode[] = [
  { id: "IRONBOW", stops: RISO_RAMP },
  { id: "RAINBOW", stops: [RISO.ink, RISO.cobalt, RISO.teal, RISO.sun, RISO.pink, RISO.paper] },
  {
    id: "LAVA",
    stops: [RISO.ink, overprint(RISO.cobalt, RISO.pink), RISO.pink, overprint(RISO.pink, RISO.sun), RISO.sun, RISO.paper],
  },
  {
    id: "ARCTIC",
    stops: [RISO.ink, overprint(RISO.cobalt, RISO.teal), RISO.cobalt, RISO.teal, mix(RISO.teal, RISO.paper, 0.55), RISO.paper],
  },
  {
    id: "VISIBLE",
    stops: [
      RISO.ink,
      mix(RISO.ink, RISO.paper, 0.2),
      mix(RISO.ink, RISO.paper, 0.38),
      mix(RISO.ink, RISO.paper, 0.56),
      mix(RISO.ink, RISO.paper, 0.76),
      RISO.paper,
    ],
  },
];

/** "Visible light" greys (flat render of the boring truth). */
export const VISIBLE = {
  wall: mix(RISO.ink, RISO.paper, 0.3),
  floor: mix(RISO.ink, RISO.paper, 0.2),
  body: mix(RISO.ink, RISO.paper, 0.58),
  bar: mix(RISO.ink, RISO.paper, 0.08),
};

export function hexRgb01(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** 6 stops → 18 floats (rgb 0–1) for the shader. */
export function stopsToFloats(stops: readonly string[], out: Float32Array, offset = 0) {
  for (let i = 0; i < 6; i++) {
    const [r, g, b] = hexRgb01(stops[i]);
    out[offset + i * 3] = r;
    out[offset + i * 3 + 1] = g;
    out[offset + i * 3 + 2] = b;
  }
  return out;
}

/** CSS linear-gradient of a ramp (scale bar, mode swatch). */
export function rampCss(stops: readonly string[], dir = "to top") {
  return `linear-gradient(${dir}, ${stops.map((s, i) => `${s} ${Math.round((i / (stops.length - 1)) * 100)}%`).join(", ")})`;
}

export { alpha, mix, overprint };
