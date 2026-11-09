import * as THREE from "three";
import { PRINTS } from "../lib/script";
import { drawSticker } from "../lib/print";

/**
 * Two atlases: the caps (U poster + D punchline, seen huge and flat, so
 * printed at high resolution) and the 36 side stickers.
 */
export type Atlas = { texture: THREE.CanvasTexture; cols: number; rows: number; ids: number[] };

function build(ids: number[], cols: number, T: number, font: string, cap: number, maxAniso: number): Atlas {
  const rows = Math.ceil(ids.length / cols);
  const canvas = document.createElement("canvas");
  canvas.width = cols * T;
  canvas.height = rows * T;
  const ctx = canvas.getContext("2d")!;
  ids.forEach((id, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    drawSticker(ctx, PRINTS[id], c * T, r * T, T, font, cap, id + 1);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, maxAniso);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return { texture, cols, rows, ids };
}

export function buildAtlases(font: string, cap: number, lowPower: boolean, dpr: number, maxAniso: number) {
  const capT = lowPower ? 256 : dpr >= 1.5 ? 512 : 384;
  const sideT = lowPower ? 176 : 256;
  const caps = build(Array.from({ length: 18 }, (_, i) => i), 6, capT, font, cap, maxAniso);
  const sides = build(Array.from({ length: 36 }, (_, i) => i + 18), 6, sideT, font, cap, maxAniso);
  return { caps, sides };
}
