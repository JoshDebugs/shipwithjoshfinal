/**
 * How one sticker is printed — shared by the WebGL atlas (canvas 2D) and the
 * DOM/SVG poster, so the title card and the 3D cube are the same print.
 * All measures are fractions of the sticker's side.
 */

import { RISO, alpha, mix } from "@/components/life/multiverse/palette";
import { hash } from "@/components/life/multiverse/ease";
import type { Mark, StickerInk, StickerPrint } from "./script";

/** Cubie pitch is 1.0; stickers are this wide (gutter = 1 − STICKER). */
export const STICKER = 0.86;
export const STICKER_RADIUS = 0.12; // fraction of the sticker side
/** Type size (fraction of sticker side) and the cap-height ratio used to centre caps. */
export const TYPE_SIZE = 0.272;
export const CAP_FALLBACK = 0.72;

export function patternInk(ink: StickerInk): string {
  switch (ink.pattern) {
    case "grid":
      return alpha(RISO.ink, 0.075);
    case "dots":
      return mix(RISO.sun, RISO.pink, 0.32);
    case "zigzag":
      return alpha(RISO.ink, 0.1);
    case "grain":
      return alpha(RISO.ink, 0.13);
    case "pinstripe":
      return alpha(RISO.paper, 0.13);
    case "checker":
      return alpha(RISO.ink, 0.1);
  }
}

/** Draw the sticker's pattern into a T×T box at (x, y). */
export function drawPattern(ctx: CanvasRenderingContext2D, ink: StickerInk, x: number, y: number, T: number, seed: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, T, T);
  ctx.clip();
  ctx.fillStyle = ink.bg;
  ctx.fillRect(x, y, T, T);
  const c = patternInk(ink);
  ctx.fillStyle = c;
  ctx.strokeStyle = c;
  switch (ink.pattern) {
    case "grid": {
      ctx.lineWidth = Math.max(1, T / 220);
      const n = 6;
      ctx.beginPath();
      for (let i = 1; i < n; i++) {
        const v = (i / n) * T;
        ctx.moveTo(x + v, y);
        ctx.lineTo(x + v, y + T);
        ctx.moveTo(x, y + v);
        ctx.lineTo(x + T, y + v);
      }
      ctx.stroke();
      break;
    }
    case "dots": {
      const n = 9;
      const step = T / n;
      ctx.beginPath();
      for (let i = 0; i <= n; i++)
        for (let j = 0; j <= n; j++) {
          const cx = x + (i + (j % 2) * 0.5) * step;
          const cy = y + j * step;
          ctx.moveTo(cx + step * 0.16, cy);
          ctx.arc(cx, cy, step * 0.16, 0, Math.PI * 2);
        }
      ctx.fill();
      break;
    }
    case "zigzag": {
      ctx.lineWidth = Math.max(1, T / 70);
      const rows = 7;
      const amp = T / rows / 3.2;
      const seg = T / 10;
      ctx.beginPath();
      for (let r = 0; r <= rows; r++) {
        const cy = y + (r / rows) * T;
        ctx.moveTo(x - seg, cy);
        for (let k = 0; k <= 12; k++) ctx.lineTo(x - seg + k * seg, cy + (k % 2 ? -amp : amp));
      }
      ctx.stroke();
      break;
    }
    case "grain": {
      const n = 520;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const px = x + hash(seed * 977 + i * 3.1) * T;
        const py = y + hash(seed * 491 + i * 7.7) * T;
        const r = T * (0.004 + hash(i * 13.3 + seed) * 0.007);
        ctx.moveTo(px + r, py);
        ctx.arc(px, py, r, 0, Math.PI * 2);
      }
      ctx.fill();
      break;
    }
    case "pinstripe": {
      ctx.lineWidth = Math.max(1, T / 90);
      const step = T / 9;
      ctx.beginPath();
      for (let k = -9; k <= 18; k++) {
        ctx.moveTo(x + k * step, y);
        ctx.lineTo(x + k * step + T, y + T);
      }
      ctx.stroke();
      break;
    }
    case "checker": {
      const n = 8;
      const s = T / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if ((i + j) % 2 === 0) ctx.fillRect(x + i * s, y + j * s, s, s);
      break;
    }
  }
  ctx.restore();
}

/** Printer's marks for the type-less stickers. */
export function drawMark(ctx: CanvasRenderingContext2D, mark: Mark, cx: number, cy: number, T: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  const r = T * 0.085;
  switch (mark) {
    case "dot":
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "ring":
      ctx.lineWidth = T * 0.035;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "plus":
      ctx.fillRect(cx - r * 1.3, cy - T * 0.022, r * 2.6, T * 0.044);
      ctx.fillRect(cx - T * 0.022, cy - r * 1.3, T * 0.044, r * 2.6);
      break;
    case "bar":
      ctx.fillRect(cx - r * 1.6, cy - T * 0.03, r * 3.2, T * 0.06);
      break;
  }
  ctx.restore();
}

/** Draw a whole sticker (pattern, then type or mark) into a T×T box. */
export function drawSticker(ctx: CanvasRenderingContext2D, print: StickerPrint, x: number, y: number, T: number, font: string, capRatio: number, seed: number) {
  drawPattern(ctx, print.ink, x, y, T, seed);
  const cx = x + T / 2;
  const cy = y + T / 2;
  if (print.mark) {
    drawMark(ctx, print.mark, cx, cy, T, alpha(print.ink.fg, 0.88));
    return;
  }
  const size = T * TYPE_SIZE;
  ctx.save();
  ctx.font = `400 ${size}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = print.ink.fg;
  ctx.fillText(print.text, cx, cy + (capRatio * size) / 2);
  ctx.restore();
}

/** Measure the cap height of the loaded face (falls back to a sane ratio). */
export function measureCap(font: string): number {
  try {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    if (!ctx) return CAP_FALLBACK;
    ctx.font = `400 100px ${font}`;
    const m = ctx.measureText("H");
    const v = m.actualBoundingBoxAscent / 100;
    return v > 0.3 && v < 1 ? v : CAP_FALLBACK;
  } catch {
    return CAP_FALLBACK;
  }
}
