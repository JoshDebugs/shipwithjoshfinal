/**
 * Repotted — the sprout. A stem that bends over when the plant is in
 * transplant shock and straightens as new roots take hold, with leaves that
 * unfurl one home at a time, droop, grey out and perk back up.
 * All in plant units; the SVG layer just applies the result.
 */

import { backOut, clamp, range } from "@/components/life/multiverse/ease";
import { POTS } from "./geometry";
import { BEAT } from "./timeline";

export type LeafSpec = {
  /** Where along the visible stem (0 = soil, 1 = tip). */
  f: number;
  side: -1 | 1;
  /** Healthy angle away from the stem (deg). */
  ang: number;
  size: number;
  /** Unfurl window (progress); null = already open on the title card. */
  at: readonly [number, number] | null;
};

export const LEAVES: LeafSpec[] = [
  { f: 0.7, side: -1, ang: 62, size: 0.3, at: null },
  { f: 0.74, side: 1, ang: 58, size: 0.28, at: null },
  { f: 0.98, side: 1, ang: 26, size: 0.24, at: [0.086, 0.14] },
  { f: 0.92, side: -1, ang: 40, size: 0.27, at: [0.1, 0.158] },
  { f: 0.46, side: 1, ang: 60, size: 0.3, at: [0.27, 0.318] },
  { f: 0.58, side: -1, ang: 54, size: 0.28, at: [0.284, 0.326] },
  { f: 0.32, side: -1, ang: 66, size: 0.27, at: [0.41, 0.448] },
  { f: 0.84, side: 1, ang: 42, size: 0.25, at: [0.418, 0.45] },
  { f: 0.2, side: 1, ang: 70, size: 0.25, at: [0.566, 0.598] },
  { f: 0.66, side: -1, ang: 50, size: 0.24, at: [0.572, 0.6] },
  { f: 0.38, side: 1, ang: 56, size: 0.24, at: [0.656, 0.69] },
  { f: 0.1, side: -1, ang: 74, size: 0.22, at: [0.664, 0.698] },
];

/** Unit leaf along +x (base at 0, tip at 1). */
export const LEAF_PATH = "M0 0 C0.16 -0.2 0.46 -0.33 0.74 -0.25 C0.88 -0.2 0.97 -0.09 1 0 C0.9 0.13 0.7 0.24 0.46 0.22 C0.24 0.2 0.08 0.1 0 0 Z";
export const LEAF_RIB = "M0.04 0 C0.36 -0.035 0.66 -0.03 0.94 0";

export type PlantPose = {
  /** Stem polyline from the soil surface to the tip (plant units). */
  stem: Float32Array;
  /** Buried stem: original crown → soil surface. */
  buried: [number, number, number, number];
  leaves: { x: number; y: number; rot: number; s: number; open: number }[];
  /** Stem width (plant units). */
  width: number;
};

const N = 14;

export function plantPose(p: number, t: number, vigor: number, scale: number, apex: number, sproutLen: number): PlantPose {
  const sag = 1 - vigor;
  const stem = new Float32Array(N * 2);
  const ang = new Float32Array(N);
  const sway = Math.sin(t * 0.8) * 0.05 + Math.sin(t * 1.9 + 1.3) * 0.015;
  const bend = sag * 2.15;
  let x = 0;
  let y = apex;
  const L = sproutLen;
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1);
    const th = sway * s + bend * s * s * s + sag * 0.12 * s;
    ang[i] = th;
    stem[i * 2] = x;
    stem[i * 2 + 1] = y;
    const ds = L / (N - 1);
    x += Math.sin(th) * ds;
    y -= Math.cos(th) * ds;
  }

  const leaves: PlantPose["leaves"] = [];
  for (let i = 0; i < LEAVES.length; i++) {
    const lf = LEAVES[i];
    const open = lf.at ? backOut(range(p, lf.at[0], lf.at[1]), 1.4) : 1;
    if (open <= 0.001) {
      leaves.push({ x: 0, y: 0, rot: 0, s: 0, open: 0 });
      continue;
    }
    const fi = clamp(lf.f) * (N - 1);
    const i0 = Math.min(N - 2, Math.floor(fi));
    const u = fi - i0;
    const lx = stem[i0 * 2] + (stem[i0 * 2 + 2] - stem[i0 * 2]) * u;
    const ly = stem[i0 * 2 + 1] + (stem[i0 * 2 + 3] - stem[i0 * 2 + 1]) * u;
    const th = ang[i0] + (ang[i0 + 1] - ang[i0]) * u;
    const flutter = Math.sin(t * 1.3 + i * 1.7) * 3.5;
    const droop = sag * (64 + (i % 3) * 9);
    const a = (th * 180) / Math.PI + lf.side * (lf.ang + droop) + flutter;
    leaves.push({ x: lx, y: ly, rot: a - 90, s: lf.size * scale * Math.max(0, open), open });
  }

  return {
    stem,
    buried: [0, POTS[0].top, 0, apex],
    leaves,
    width: 0.034 * Math.pow(scale, 0.7),
  };
}

/** One leaf drops off at every move (the shock), spinning down into the dark. */
export function fallingLeaves(p: number): { k: number; u: number }[] {
  const out: { k: number; u: number }[] = [];
  for (let k = 0; k < 4; k++) {
    const L = BEAT.leave[k];
    const u = range(p, L[0] + 0.01, L[1] + 0.05);
    if (u > 0 && u < 1) out.push({ k, u });
  }
  return out;
}

export function stemPath(stem: Float32Array): string {
  let d = `M${stem[0].toFixed(4)} ${stem[1].toFixed(4)}`;
  for (let i = 1; i < stem.length / 2 - 1; i++) {
    const x = stem[i * 2];
    const y = stem[i * 2 + 1];
    const nx = (x + stem[i * 2 + 2]) / 2;
    const ny = (y + stem[i * 2 + 3]) / 2;
    d += ` Q${x.toFixed(4)} ${y.toFixed(4)} ${nx.toFixed(4)} ${ny.toFixed(4)}`;
  }
  const j = stem.length - 2;
  d += ` L${stem[j].toFixed(4)} ${stem[j + 1].toFixed(4)}`;
  return d;
}
