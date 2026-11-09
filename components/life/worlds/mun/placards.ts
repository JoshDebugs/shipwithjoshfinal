/**
 * Delegate placards, generated once into a sprite atlas.
 * Fronts: a paper card with abstract seeded geometry (no real flags, no
 * country names — the name strip is a redaction bar, like the paper).
 * Back: the pink "against" side every delegate shows before they turn.
 */

import { RISO, mix } from "@/components/life/multiverse/palette";

export const PLACARD_VARIANTS = 12;
const CW = 120;
const CH = 54;
const COLS = 4;

export type Atlas = { canvas: HTMLCanvasElement; cw: number; ch: number; cell: (i: number) => [number, number] };

const INKS = [RISO.sun, RISO.teal, RISO.cobalt, RISO.ink] as const;

function front(ctx: CanvasRenderingContext2D, x: number, y: number, v: number) {
  const w = CW;
  const h = CH;
  const ph = h * 0.64; // pattern band
  const a = INKS[v % 4];
  const b = INKS[(v + 1 + Math.floor(v / 4)) % 4];
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = RISO.paper;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = a;
  switch (v % 6) {
    case 0: // diagonal split
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.72, y);
      ctx.lineTo(x + w * 0.38, y + ph);
      ctx.lineTo(x, y + ph);
      ctx.fill();
      break;
    case 1: // offset disc
      ctx.fillRect(x, y, w, ph);
      ctx.fillStyle = b;
      ctx.beginPath();
      ctx.arc(x + w * 0.3, y + ph * 0.5, ph * 0.32, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 2: // chevron from the hoist
      ctx.fillRect(x, y, w, ph);
      ctx.fillStyle = b;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.34, y + ph / 2);
      ctx.lineTo(x, y + ph);
      ctx.fill();
      break;
    case 3: // rising half-disc
      ctx.fillStyle = b;
      ctx.fillRect(x, y, w, ph);
      ctx.fillStyle = a;
      ctx.beginPath();
      ctx.arc(x + w * 0.62, y + ph, ph * 0.62, Math.PI, 0);
      ctx.fill();
      break;
    case 4: // checker
      for (let i = 0; i < 6; i++)
        for (let j = 0; j < 2; j++) {
          ctx.fillStyle = (i + j) % 2 ? a : b;
          ctx.fillRect(x + (i * w) / 6, y + (j * ph) / 2, w / 6 + 0.5, ph / 2 + 0.5);
        }
      break;
    default: // offset band + ring
      ctx.fillRect(x, y, w * 0.24, ph);
      ctx.strokeStyle = b;
      ctx.lineWidth = ph * 0.14;
      ctx.beginPath();
      ctx.arc(x + w * 0.64, y + ph * 0.5, ph * 0.28, 0, Math.PI * 2);
      ctx.stroke();
  }
  // name strip: a redaction bar
  ctx.fillStyle = RISO.ink;
  const bw = w * (0.42 + 0.3 * ((v * 37) % 10) / 10);
  ctx.fillRect(x + w * 0.1, y + ph + (h - ph) * 0.3, bw, (h - ph) * 0.42);
  // card edge
  ctx.strokeStyle = mix(RISO.ink, RISO.paper, 0.55);
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.restore();
}

function back(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = RISO.pink;
  ctx.fillRect(x, y, CW, CH);
  ctx.fillStyle = mix(RISO.pink, RISO.ink, 0.22);
  ctx.fillRect(x, y + CH - 7, CW, 7);
}

/** index 0..11 = fronts, 12 = the pink back */
export function buildAtlas(): Atlas | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  const rows = Math.ceil((PLACARD_VARIANTS + 1) / COLS);
  canvas.width = CW * COLS;
  canvas.height = CH * rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const cell = (i: number): [number, number] => [(i % COLS) * CW, Math.floor(i / COLS) * CH];
  for (let v = 0; v < PLACARD_VARIANTS; v++) {
    const [x, y] = cell(v);
    front(ctx, x, y, v);
  }
  const [bx, by] = cell(PLACARD_VARIANTS);
  back(ctx, bx, by);
  return { canvas, cw: CW, ch: CH, cell };
}
