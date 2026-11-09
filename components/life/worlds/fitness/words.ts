/**
 * Heat-type: the words the camera "sees" on the wall. Drawn once per layout
 * into five masks (Unbounded Black on black), packed as
 *   A = (headline, discipline, training, nutrition)   B.r = consistency
 * Top row of the arrays = top of the stage (the shader samples y-flipped).
 */
import { SETS } from "./timeline";
import type { Geo } from "./geometry";

export type WordMasks = { a: Uint8Array; b: Uint8Array; w: number; h: number };

/** The `--f-unbounded` family list (next/font hashes the real name). */
export function heatFamily(el: Element): string {
  return getComputedStyle(el).getPropertyValue("--f-unbounded").trim() || "sans-serif";
}

/** Resolves once the heat-type face can be drawn to a canvas (never rejects). */
export async function loadHeatFont(family: string): Promise<boolean> {
  if (typeof document === "undefined" || !document.fonts?.load) return false;
  try {
    const faces = await document.fonts.load(`900 120px ${family}`, "BUILTDSCPLNEAROGYUW.");
    return faces.length > 0;
  } catch {
    return false;
  }
}

type Row = { text: string; size: number; cap: number; y: number };

/** Justified block: every line fit to width `w`, stacked with `gap`, centred on `cy`. */
function blockRows(ctx: CanvasRenderingContext2D, family: string, lines: readonly string[], w: number, cy: number, gap: number, maxH: number, sy: number): Row[] {
  const rows: Row[] = lines.map((text) => {
    ctx.font = `900 100px ${family}`;
    const m = ctx.measureText(text);
    const size = (100 * w) / Math.max(1, m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
    const cap = ctx.measureText("H").actualBoundingBoxAscent * (size / 100) * sy;
    return { text, size, cap, y: 0 };
  });
  const total = () => rows.reduce((s, r) => s + r.cap, 0) + gap * (rows.length - 1);
  if (total() > maxH) {
    const k = (maxH - gap * (rows.length - 1)) / rows.reduce((s, r) => s + r.cap, 0);
    for (const r of rows) {
      r.size *= k;
      r.cap *= k;
    }
  }
  let y = cy - total() / 2;
  for (const r of rows) {
    y += r.cap;
    r.y = y;
    y += gap;
  }
  return rows;
}

export const WALL_WORDS = SETS.map((s) => s.word);

/** Renders the five masks at `scale` texels per CSS px. */
export function buildWordMasks(g: Geo, family: string, scale: number): WordMasks | null {
  const w = Math.max(4, Math.round(g.W * scale));
  const h = Math.max(4, Math.round(g.H * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";

  const head = blockRows(ctx, family, g.headline.lines, g.headline.w, g.headline.cy, g.headline.gap, g.H * 0.6, 1);
  const wall = blockRows(ctx, family, WALL_WORDS, g.wall.w, g.wall.cy, g.wall.gap, g.wall.maxH, g.wall.sy);
  const layers: { rows: Row[]; sy: number }[] = [
    { rows: head, sy: 1 },
    ...wall.map((r) => ({ rows: [r], sy: g.wall.sy })),
  ];

  const a = new Uint8Array(w * h * 4);
  const b = new Uint8Array(w * h * 4);
  layers.forEach(({ rows, sy }, k) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    for (const r of rows) {
      ctx.setTransform(scale, 0, 0, scale * sy, (g.W / 2) * scale, r.y * scale);
      ctx.font = `900 ${r.size}px ${family}`;
      ctx.fillText(r.text, 0, 0);
    }
    const px = ctx.getImageData(0, 0, w, h).data;
    const target = k < 4 ? a : b;
    const channel = k < 4 ? k : 0;
    for (let i = 0; i < w * h; i++) target[i * 4 + channel] = px[i * 4];
  });
  return { a, b, w, h };
}
