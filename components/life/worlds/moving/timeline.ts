/**
 * Repotted — the score. Every beat is a window of world progress (0 → 1);
 * `sceneAt(p, t)` turns progress (+ a little ambient time) into poses for the
 * camera, plant, pots and soil. Pure maths, no state: scrubbing backwards
 * replays everything in reverse.
 */

import { backOut, bell, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, range, smoothstep } from "@/components/life/multiverse/ease";
import { POTS, bboxOf } from "./geometry";

type W = readonly [number, number];

export const BEAT = {
  titleOut: [0.026, 0.078] as W,
  /** Roots grow in pot k. */
  grow: [
    [0.058, 0.165],
    [0.256, 0.33],
    [0.398, 0.452],
    [0.556, 0.6],
    [0.652, 0.702],
  ] as W[],
  /** Pot k leaves (drop · shatter · slide · tip · split). */
  leave: [
    [0.165, 0.232],
    [0.33, 0.374],
    [0.452, 0.49],
    [0.6, 0.628],
    [0.706, 0.765],
  ] as W[],
  /** Pot k rises from below to catch the plant. */
  arrive: [null, [0.21, 0.252], [0.354, 0.394], [0.528, 0.558], [0.622, 0.652]] as (W | null)[],
  /** Soil pours into pot k round the old ball. */
  pour: [null, [0.234, 0.272], [0.378, 0.406], [0.546, 0.574], [0.64, 0.666]] as (W | null)[],
  /** The in-between: hanging over an empty frame. */
  ghost: [0.49, 0.556] as W,
  headRoots: [0.072, 0.142] as W,
  headFill: [0.118, 0.164] as W,
  headOut: [0.708, 0.744] as W,
  cap1: [0.188, 0.212, 0.31, 0.336] as const,
  cap2: [0.392, 0.416, 0.53, 0.554] as const,
  soilOff: [0.73, 0.795] as W,
  quote1: [0.8, 0.834] as W,
  quote2: [0.846, 0.878] as W,
  quoteOut: [0.902, 0.926] as W,
  labels: [0.82, 0.848] as W,
  voxel: [0.9, 0.934] as W,
  fly: [0.928, 0.988] as W,
};

/** When ring k lights up (from the centre outward). */
export const ringWindow = (k: number): W => [0.774 + k * 0.016, 0.806 + k * 0.016];

export const growFrac = (p: number, k: number) => range(p, BEAT.grow[k][0], BEAT.grow[k][1]);

/* --------------------------------------------------------------- layout */

export type Box = { x0: number; y0: number; x1: number; y1: number };

export type Layout = {
  W: number;
  H: number;
  mobile: boolean;
  title: Box;
  plant: Box;
  hero: Box;
  /** Island (the next portal's birth box): top-left + size, in stage px. */
  island: { x: number; y: number; size: number };
};

export function makeLayout(W: number, H: number, mobile: boolean): Layout {
  if (mobile) {
    const size = Math.round(Math.min(W * 0.56, H * 0.3));
    return {
      W,
      H,
      mobile,
      title: { x0: W * 0.09, y0: H * 0.39, x1: W * 0.63, y1: H * 0.79 },
      plant: { x0: 18, y0: H * 0.345, x1: W - 18, y1: H * 0.835 },
      hero: { x0: 20, y0: H * 0.115, x1: W - 20, y1: H * 0.62 },
      island: { x: Math.round(W / 2 - size / 2), y: Math.round(H * 0.47 - size * 0.52), size },
    };
  }
  const size = Math.round(Math.min(H * 0.38, W * 0.26));
  return {
    W,
    H,
    mobile,
    title: { x0: W * 0.38, y0: H * 0.37, x1: W * 0.62, y1: H * 0.84 },
    plant: { x0: W * 0.43, y0: H * 0.14, x1: W * 0.85, y1: H * 0.885 },
    hero: { x0: W * 0.33, y0: H * 0.115, x1: W * 0.67, y1: H * 0.9 },
    island: { x: Math.round(W / 2 - size / 2), y: Math.round(H * 0.53 - size * 0.52), size },
  };
}

/* --------------------------------------------------------------- camera */

/** screen = (world − w) · S + f */
export type Cam = { S: number; wx: number; wy: number; fx: number; fy: number };

function fit(b: [number, number, number, number], box: Box): Cam {
  const S = Math.min((box.x1 - box.x0) / (b[2] - b[0]), (box.y1 - box.y0) / (b[3] - b[1]));
  return { S, wx: (b[0] + b[2]) / 2, wy: b[3], fx: (box.x0 + box.x1) / 2, fy: box.y1 };
}

function mixCam(a: Cam, b: Cam, t: number): Cam {
  return {
    S: Math.exp(lerp(Math.log(a.S), Math.log(b.S), t)),
    wx: lerp(a.wx, b.wx, t),
    wy: lerp(a.wy, b.wy, t),
    fx: lerp(a.fx, b.fx, t),
    fy: lerp(a.fy, b.fy, t),
  };
}

/* ---------------------------------------------------------------- plant */

/** How big the plant is (1 at pot 01) — leaves and stem scale with it. */
const PLANT_SCALE = [1, 1.5, 1.95, 2.45, 3.0];
const SPROUT = 0.44; // visible stem length per unit of plant scale

export function plantScaleAt(p: number): number {
  let s = lerp(0.62, 1, smoothstep(range(p, BEAT.grow[0][0], BEAT.grow[0][1])));
  for (let k = 1; k < 5; k++) s += (PLANT_SCALE[k] - PLANT_SCALE[k - 1]) * smoothstep(growFrac(p, k));
  return s;
}

/** Plant scale reached at the end of each home (for camera framing). */
const SCALE_END = PLANT_SCALE;

/** Which soil surface the sprout comes out of (rises as new soil is poured). */
export function apexAt(p: number): number {
  let y = POTS[0].top;
  for (let k = 1; k < 5; k++) {
    const w = BEAT.pour[k]!;
    y = lerp(y, POTS[k].top, easeInOutCubic(range(p, w[0] + (w[1] - w[0]) * 0.35, w[1])));
  }
  return y;
}

/* ---------------------------------------------------------------- vigor */

/** 1 = healthy, ~0.12 = transplant shock. Recovers with the new roots. */
export function vigorAt(p: number): number {
  let v = 1;
  for (let k = 0; k < 4; k++) {
    const L = BEAT.leave[k];
    const drop = smoothstep(range(p, L[0] + 0.004, L[0] + (L[1] - L[0]) * 0.55));
    const rec = growFrac(p, k + 1);
    if (p >= L[0] && p < BEAT.grow[k + 1][1] + 0.001) {
      v = lerp(1, 0.12, drop);
      v = lerp(v, 1, easeInOutCubic(rec));
      return v;
    }
  }
  return v;
}

/* ---------------------------------------------------------------- scene */

export type PotPose = { show: boolean; tx: number; ty: number; rot: number; ox: number; oy: number; alpha: number };

export type Scene = {
  p: number;
  cam: Cam;
  /** Plant-local → world: rotate `rot` about (ox, oy), then translate. */
  plant: { tx: number; ty: number; rot: number; ox: number; oy: number };
  vigor: number;
  scale: number;
  apex: number;
  sproutLen: number;
  pots: PotPose[];
  /** Pot 05's two halves during the split. */
  halves: [PotPose, PotPose];
  crack: number;
  /** 0..1 progress of the shards of the pot that shatters (pot 02). */
  shatter: number;
  ghost: number;
  /** Outermost soil region drawn, and the pour level (plant y) for it. */
  soilOuter: number;
  soilLevel: number;
  soilAlpha: number;
  /** Tag readout: home index 0..4, or −1 for the in-between. */
  home: number;
  hang: number;
  hero: number;
};

/** Pot 02 stays whole while it cracks, then hands over to its shards. */
const s0 = (u: number) => (u < 0.11 ? 1 : 0);

const NO_POSE: PotPose = { show: false, tx: 0, ty: 0, rot: 0, ox: 0, oy: 0, alpha: 0 };

export class SceneBuilder {
  layout: Layout;
  private cams: { title: Cam; homes: Cam[]; hero: Cam };
  private keys: [number, Cam][];

  constructor(layout: Layout) {
    this.layout = layout;
    const sprout = (k: number, scale: number) => POTS[k].top - SPROUT * scale - 0.3 * scale;
    const potBox = (k: number, scale: number): [number, number, number, number] => {
      const [x0, , x1, y1] = bboxOf(POTS[k].outer);
      return [Math.min(x0, -0.42 * scale), sprout(k, scale), Math.max(x1, 0.42 * scale), y1];
    };
    const title = fit(potBox(0, 0.62), layout.title);
    const homes = POTS.map((_, k) => fit(potBox(k, SCALE_END[k]), layout.plant));
    const heroB = potBox(4, SCALE_END[4]);
    const hero = fit([heroB[0], heroB[1], heroB[2], bboxOf(POTS[4].inner)[3] + 0.04], layout.hero);
    this.cams = { title, homes, hero };
    const H = homes;
    this.keys = [
      [0, title],
      [0.04, title],
      [0.118, H[0]],
      [0.212, H[0]],
      [0.262, H[1]],
      [0.356, H[1]],
      [0.4, H[2]],
      [0.482, H[2]],
      [0.53, H[3]],
      [0.616, H[3]],
      [0.656, H[4]],
      [0.722, H[4]],
      [0.8, hero],
      [1, hero],
    ];
  }

  camAt(p: number): Cam {
    const K = this.keys;
    if (p <= K[0][0]) return K[0][1];
    for (let i = 1; i < K.length; i++) {
      if (p <= K[i][0]) {
        const t = easeInOutCubic(range(p, K[i - 1][0], K[i][0]));
        return mixCam(K[i - 1][1], K[i][1], t);
      }
    }
    return K[K.length - 1][1];
  }

  build(p: number, t: number): Scene {
    const L = this.layout;
    const cam = this.camAt(p);
    const vigor = vigorAt(p);
    const scale = plantScaleAt(p);
    const apex = apexAt(p);
    const offY = (L.H + 80) / cam.S; // "below the screen" in plant units

    // hanging between pots (the plant is held up while the old pot leaves)
    let hang = 0;
    for (let k = 0; k < 4; k++) {
      const a = BEAT.arrive[k + 1]!;
      hang = Math.max(hang, bell(p, BEAT.leave[k][0], BEAT.leave[k][0] + 0.02, a[1] - 0.014, a[1]));
    }
    const hero = range(p, BEAT.leave[4][0] + 0.02, BEAT.soilOff[1]);
    const sway = Math.sin(t * 0.9) * 0.022 * hang + Math.sin(t * 0.55) * 0.012 * hero;
    const plant = {
      tx: 0,
      ty: -0.05 * hang + Math.sin(t * 0.7) * 0.025 * hero * (1 - range(p, BEAT.voxel[0], BEAT.voxel[1])),
      rot: sway,
      ox: 0,
      oy: apex - SPROUT * scale,
    };

    /* pots */
    const pots: PotPose[] = [];
    for (let k = 0; k < 5; k++) {
      const pot = POTS[k];
      const arr = BEAT.arrive[k];
      const lv = BEAT.leave[k];
      if ((arr && p < arr[0]) || p > lv[1] || (k === 4 && p >= lv[0])) {
        pots.push(NO_POSE);
        continue;
      }
      let ty = 0;
      let tx = 0;
      let rot = 0;
      let ox = 0;
      let oy = pot.bottom;
      let alpha = 1;
      if (arr && p < arr[1]) {
        const u = range(p, arr[0], arr[1]);
        ty = (1 - backOut(u, 1.05)) * offY;
      }
      if (p >= lv[0]) {
        const u = range(p, lv[0], lv[1]);
        if (k === 0) {
          // drops into the dark
          const e = easeInCubic(u);
          ty = e * offY * 1.15;
          rot = e * 0.16;
          alpha = 1 - range(u, 0.7, 1);
        } else if (k === 2) {
          // slides out sideways like a drawer
          const e = easeInOutCubic(u);
          tx = e * ((L.W * 0.75) / cam.S + pot.hw * 2);
          ty = -Math.sin(Math.PI * Math.min(1, u * 1.4)) * 0.04;
          rot = e * 0.05;
          alpha = 1 - range(u, 0.8, 1);
        } else if (k === 3) {
          // tips over its bottom-left corner and tumbles down-left, under the headline
          const e = easeInCubic(u);
          const tip = easeInOutCubic(range(u, 0, 0.45));
          tx = -e * ((L.W * 0.3) / cam.S);
          ty = e * offY * 1.1;
          ox = -pot.hw;
          oy = pot.bottom;
          rot = -tip * 0.12 - e * 0.28;
          alpha = 1 - range(u, 0.8, 1);
        } else if (k === 1) {
          // shatters: the whole pot is hidden, shards take over
          alpha = s0(u);
        }
      }
      pots.push({ show: alpha > 0.001, tx, ty, rot, ox, oy, alpha });
    }

    /* pot 05 splits along its seam */
    let halves: [PotPose, PotPose] = [NO_POSE, NO_POSE];
    let crack = 0;
    {
      const lv = BEAT.leave[4];
      if (p >= lv[0] && p <= lv[1]) {
        const u = range(p, lv[0], lv[1]);
        crack = range(u, 0, 0.18);
        const e = easeInCubic(range(u, 0.16, 1));
        const pot = POTS[4];
        const mk = (s: number): PotPose => ({
          show: true,
          tx: s * (e * 0.9 + range(u, 0.1, 0.2) * 0.03),
          ty: e * offY * 0.9,
          rot: s * e * 0.38,
          ox: s * pot.hw,
          oy: pot.bottom,
          alpha: 1 - range(u, 0.78, 1),
        });
        halves = [mk(-1), mk(1)];
      }
    }

    const shatter = p >= BEAT.leave[1][0] && p <= BEAT.leave[1][1] + 0.02 ? range(p, BEAT.leave[1][0], BEAT.leave[1][1] + 0.02) : -1;

    /* soil */
    let soilOuter = 0;
    let soilLevel = -Infinity;
    for (let k = 1; k < 5; k++) {
      const w = BEAT.pour[k]!;
      if (p >= w[0]) {
        soilOuter = k;
        const u = easeOutCubic(range(p, w[0], w[1]));
        soilLevel = lerp(POTS[k].bottom, POTS[k].peak - 0.02, u);
        if (u >= 1) soilLevel = -Infinity;
      }
    }
    const soilAlpha = 1 - smoothstep(range(p, BEAT.soilOff[0], BEAT.soilOff[1]));

    /* tag readout */
    let home = 0;
    for (let k = 1; k < 5; k++) if (p >= BEAT.arrive[k]![1] - 0.006) home = k;
    if (p >= BEAT.ghost[0] && p < BEAT.arrive[3]![1] - 0.006) home = -1;

    const ghost = bell(p, BEAT.ghost[0], BEAT.ghost[0] + 0.012, BEAT.arrive[3]![0] + 0.016, BEAT.arrive[3]![1]);

    return {
      p,
      cam,
      plant,
      vigor,
      scale,
      apex,
      sproutLen: SPROUT * scale,
      pots,
      halves,
      crack,
      shatter,
      ghost,
      soilOuter,
      soilLevel,
      soilAlpha,
      home,
      hang,
      hero,
    };
  }
}

/** Screen position of a plant-space point (no plant transform). */
export function toScreen(cam: Cam, x: number, y: number): [number, number] {
  return [(x - cam.wx) * cam.S + cam.fx, (y - cam.wy) * cam.S + cam.fy];
}

export { clamp };
