/**
 * Stage-dependent layout for Heat Signature. Pure: (width, height) → numbers.
 *
 * The figure is drawn in "figure units" (fh = standing height, origin at the
 * feet, +y up) and mapped to stage px with `fx/fy`. Phones get a portrait
 * framing of their own (bigger type ratios, the scale bar across the top).
 */
import { clamp } from "@/components/life/multiverse/ease";

export type Geo = {
  W: number;
  H: number;
  mobile: boolean;
  /** Global type/UI scale. */
  u: number;
  /** Figure height (px), centre x and floor y. */
  fh: number;
  cx: number;
  floorY: number;
  /** Barbell: half length, shaft thickness; plates as [centre offset from bar centre, half w, half h] (px). */
  barHalf: number;
  barTh: number;
  plates: [number, number, number][];
  /** Smooth-union radius and edge softness (px). */
  k: number;
  edge: number;
  /** Viewfinder frame (bracket corners). */
  frame: { l: number; t: number; r: number; b: number; arm: number };
  /** HUD text anchors. */
  hudTop: number;
  hudSide: number;
  /** COUCH ←→ BUILT scale: vertical on desktop (right edge), horizontal on phones (top). */
  scale: { vertical: boolean; x: number; y: number; len: number };
  /** Lower-third caption block (bottom-left, anchored at its bottom edge). */
  caption: { x: number; bottom: number; w: number };
  /** The lamp icon box at the exit (the next portal is born from it). */
  lamp: { x: number; y: number; s: number };
  /** Handprint size (px, wrist → fingertip). */
  hand: number;
  /** Heat buffer resolution divisor (CSS px per texel). */
  fieldDiv: number;
  /** Heat-type blocks: headline (title card) and the pillar-word wall. */
  /** Headline: `bottom` (when set) anchors the last baseline instead of centring on `cy`. */
  headline: { w: number; cy: number; gap: number; lines: string[]; maxH: number; bottom?: number };
  /**
   * Wall: centred on `cy` inside `maxH`. Phones stack it between the scale labels
   * and the lockout bar. The optional `split` sets rows before `after` above
   * `y - gap/2` and the rest below `y + gap/2`, the upper half never rising above `top`.
   */
  wall: { w: number; cy: number; gap: number; maxH: number; sy: number; split?: { after: number; y: number; gap: number; top: number } };
};

export function computeGeo(W: number, H: number, lowPower: boolean): Geo {
  const mobile = W < 768;
  const u = mobile ? clamp(Math.min(W / 390, H / 800), 0.82, 1.2) : clamp(Math.min(H / 880, W / 1300), 0.74, 1.35);

  const fh = Math.round(mobile ? Math.min(H * 0.4, W * 0.9) : Math.min(H * 0.6, W * 0.5));
  const floorY = Math.round(mobile ? H * 0.8 : H * 0.862);
  const cx = Math.round(W / 2);

  const barHalf = Math.round(mobile ? Math.min(fh * 0.6, W / 2 - 10) : fh * 0.61);
  const barTh = Math.max(4, Math.round(fh * 0.017));
  // inside → out: collar, big plate, small plate (offsets measured back from the sleeve end)
  const plates: [number, number, number][] = [
    [barHalf - fh * 0.13, fh * 0.012, fh * 0.034],
    [barHalf - fh * 0.093, fh * 0.024, fh * 0.142],
    [barHalf - fh * 0.051, fh * 0.018, fh * 0.11],
  ];

  const frame = mobile
    ? { l: 14, t: 74, r: W - 14, b: H - 68, arm: 22 }
    : { l: 40, t: 100, r: W - 40, b: H - 92, arm: 30 };

  const scale = mobile
    ? { vertical: false, x: 22, y: 142, len: W - 44 }
    : { vertical: true, x: W - 88, y: Math.round(H * 0.26), len: Math.round(H * 0.44) };

  // lamp box: its visual centre (≈ icon 55,52) sits on the lockout chest
  const lampS = Math.round(fh * (mobile ? 0.44 : 0.42));
  const chestY = floorY - fh * 0.725;
  const lamp = { s: lampS, x: Math.round(cx - lampS * 0.55), y: Math.round(chestY - lampS * 0.5) };

  // HUD and caption metrics shared with Hud.tsx
  const small = (mobile ? 11.5 : 13.5) * u;
  const hudTop = mobile ? 98 : 120;
  const caption = mobile ? { x: 22, bottom: H - 88, w: W - 44 } : { x: 70, bottom: H - 112, w: Math.min(560, W * 0.4) };

  // barbell heights (figure units): resting in the hang, locked out overhead
  const BAR_HANG = 0.484;
  const BAR_LOCK = 1.138;

  // title card: narrower than the plates, its last line clear of the bar (and collars) at rest
  const headW = Math.round(Math.min(W * 0.37, 548, fh * 0.9));
  const headBottom = Math.round(floorY - fh * (BAR_HANG + 0.05) - barTh);
  const headTop = 128;

  // desktop wall: between the HUD's two lines and the tallest caption block
  const wallTop = hudTop + small * 1.5 * 2 + 12;
  const capBlock = small * 1.2 + 7 * u + 32 * u * 1.16 * 2;
  const wallBottom = caption.bottom - capBlock - 10;

  // phone wall: between the plates, stacked between the scale labels and the lockout bar
  const lockBarY = floorY - fh * BAR_LOCK;
  const plateInner = barHalf - fh * 0.117;
  const scaleLabelsBottom = 142 + Math.max(4, Math.round(6 * u)) + 5 * u + small * 1.3;
  const phoneWallTop = scaleLabelsBottom + 10;
  const phoneWallBottom = lockBarY - barTh - fh * 0.04;

  return {
    W,
    H,
    mobile,
    u,
    fh,
    cx,
    floorY,
    barHalf,
    barTh,
    plates,
    k: fh * 0.03,
    edge: Math.max(1.2, fh * 0.004),
    frame,
    hudTop,
    hudSide: mobile ? 22 : 70,
    scale,
    caption,
    lamp,
    hand: Math.round((mobile ? 92 : 118) * u),
    fieldDiv: mobile ? 2.5 : lowPower ? 4 : 3,
    headline: mobile
      ? { w: Math.round(W * 0.8), cy: Math.round(H * 0.415), gap: Math.round(10 * u), lines: ["BUILT", "THE BODY", "TOO."], maxH: H * 0.6 }
      : { w: headW, cy: Math.round((headTop + headBottom) / 2), gap: Math.round(14 * u), lines: ["BUILT", "THE BODY", "TOO."], maxH: Math.max(60, headBottom - headTop), bottom: headBottom },
    wall: mobile
      ? {
          // all four rows stacked above the lockout bar: the raised arms and head never cover a letter
          w: Math.round(Math.min(W * 0.9, 2 * plateInner - 12)),
          cy: Math.round((phoneWallTop + phoneWallBottom) / 2),
          gap: Math.round(5 * u),
          maxH: Math.round(Math.max(48, phoneWallBottom - phoneWallTop)),
          sy: 1,
        }
      : {
          w: Math.round(Math.min(W * 0.74, 1180)),
          cy: Math.round((wallTop + wallBottom) / 2),
          gap: Math.round(22 * u),
          maxH: Math.round(Math.max(120, wallBottom - wallTop)),
          sy: 1,
        },
  };
}

/** Figure units → stage px. */
export const fx = (g: Geo, x: number) => g.cx + x * g.fh;
export const fy = (g: Geo, y: number) => g.floorY - y * g.fh;
