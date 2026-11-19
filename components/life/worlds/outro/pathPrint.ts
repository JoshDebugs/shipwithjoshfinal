/**
 * Text along the print's crests, printed into a canvas.
 *
 * The microprint and the live edge's legend ride the print, and the camera
 * dollies while they are on screen (into the domains, out of the last
 * minutia, and on phones once more at the end). Every change of scale made
 * the browser re-rasterise hundreds of glyphs, one dropped frame in two. A
 * canvas is only scaled. Glyphs are set the way SVG <textPath> sets them: each
 * glyph's advance is centred on the path and turned to its tangent. The work
 * is done in idle slices, a few ms at a time.
 */
import { useEffect, type RefObject } from "react";
import type { V2 } from "./field";
import { SVG_U } from "./ridges";

export type PathRun = { pts: V2[]; text: string };

export type PathTextStyle = {
  family: string;
  weight: number;
  /** Font size, letter spacing and baseline shift, in SVG user units. */
  size: number;
  spacing: number;
  dy: number;
  fill: string;
  /** Optional outline under the fill (paint-order: stroke fill). */
  stroke?: string;
  strokeWidth?: number;
  /**
   * Monospace only: the per-glyph advance (spacing included) the browser's own SVG layout uses.
   * It rounds advances at the device scale, so a measured canvas advance drifts ~0.15% per glyph.
   */
  advance?: number;
};

/** The per-glyph advance of a monospace <text>, as the browser's SVG layout sets it (SVG units). */
export function svgAdvance(text: SVGTextContentElement): number | undefined {
  try {
    const n = Math.min(text.getNumberOfChars(), 6);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const a = text.getStartPositionOfChar(i);
      const b = text.getEndPositionOfChar(i);
      sum += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return n && sum > 0 ? sum / n : undefined;
  } catch {
    return undefined;
  }
}

type Glyph = { ch: string; x: number; y: number; a: number; start: number };

export type PathPrint = { x: number; y: number; w: number; h: number; scale: number };

/** Lay a run along its polyline (print units; set in SVG units, y flipped) like SVG textPath. */
function layout(ctx: CanvasRenderingContext2D, run: PathRun, st: PathTextStyle, out: Glyph[]) {
  const P = run.pts.map((p) => ({ x: p.x * SVG_U, y: -p.y * SVG_U }));
  if (P.length < 2) return;
  const arc = new Float64Array(P.length);
  for (let i = 1; i < P.length; i++) arc[i] = arc[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y);
  const total = arc[P.length - 1];
  const widths = new Map<string, number>();
  let s = 0;
  let seg = 1;
  for (const ch of run.text) {
    let w = widths.get(ch);
    if (w === undefined) widths.set(ch, (w = ctx.measureText(ch).width));
    const adv = st.advance ?? w + st.spacing;
    const mid = s + adv / 2;
    // a glyph whose middle runs off the end of the path isn't drawn
    if (mid > total) break;
    while (seg < P.length - 1 && arc[seg] < mid) seg++;
    const a = P[seg - 1];
    const b = P[seg];
    const t = (mid - arc[seg - 1]) / (arc[seg] - arc[seg - 1] || 1);
    if (ch !== " ") out.push({ ch, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, a: Math.atan2(b.y - a.y, b.x - a.x), start: -adv / 2 });
    s += adv;
  }
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: (d: { timeRemaining(): number; didTimeout: boolean }) => void, o?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * Print `runs` into `canvas` at `scale` canvas pixels per SVG unit, in idle slices. `done` gets
 * the canvas's box in SVG units (where to place it). Returns a cancel function.
 */
export function printPaths(canvas: HTMLCanvasElement, runs: PathRun[], st: PathTextStyle, scale: number, done: (box: PathPrint) => void) {
  const w = window as IdleWindow;
  let cancelled = false;
  let handle = 0;
  const later = (fn: (budget: number) => void) => {
    if (w.requestIdleCallback) handle = w.requestIdleCallback((d) => fn(d.didTimeout ? 5 : Math.min(8, Math.max(3, d.timeRemaining()))), { timeout: 150 });
    else handle = window.setTimeout(() => fn(5), 16);
  };

  later(() => {
    if (cancelled) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const font = `${st.weight} ${st.size}px ${st.family}`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = font;
    const glyphs: Glyph[] = [];
    for (const r of runs) layout(ctx, r, st, glyphs);
    if (!glyphs.length) return;
    const pad = st.size * 1.2 + (st.strokeWidth ?? 0);
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const g of glyphs) {
      x0 = Math.min(x0, g.x);
      y0 = Math.min(y0, g.y);
      x1 = Math.max(x1, g.x);
      y1 = Math.max(y1, g.y);
    }
    const box: PathPrint = { x: Math.floor(x0 - pad), y: Math.floor(y0 - pad), w: 0, h: 0, scale };
    box.w = Math.ceil(x1 + pad) - box.x;
    box.h = Math.ceil(y1 + pad) - box.y;
    canvas.width = Math.max(1, Math.round(box.w * scale));
    canvas.height = Math.max(1, Math.round(box.h * scale));
    // resizing reset the context: set it up again
    ctx.setTransform(scale, 0, 0, scale, -box.x * scale, -box.y * scale);
    ctx.font = font;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = st.fill;
    if (st.stroke) {
      ctx.strokeStyle = st.stroke;
      ctx.lineWidth = st.strokeWidth ?? 1;
      ctx.lineJoin = "miter";
      ctx.miterLimit = 4;
    }
    // paint-order stroke fill: every outline first, so no outline cuts into a neighbour's letter
    const passes: ("stroke" | "fill")[] = st.stroke ? ["stroke", "fill"] : ["fill"];
    let pass = 0;
    let at = 0;
    const slice = (budget: number) => {
      if (cancelled) return;
      const end = performance.now() + budget;
      while (pass < passes.length) {
        const g = glyphs[at];
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.a);
        if (passes[pass] === "stroke") ctx.strokeText(g.ch, g.start, st.dy);
        else ctx.fillText(g.ch, g.start, st.dy);
        ctx.restore();
        if (++at === glyphs.length) {
          at = 0;
          pass++;
        }
        // check the clock every few glyphs
        if (at % 24 === 0 && performance.now() > end) break;
      }
      if (pass < passes.length) later(slice);
      else done(box);
    };
    later(slice);
  });

  return () => {
    cancelled = true;
    w.cancelIdleCallback?.(handle);
    window.clearTimeout(handle);
  };
}

/**
 * Swap an SVG of text-on-paths for its canvas print once the face has loaded. The SVG keeps
 * showing until then, and stays if the face never arrives. `make` reads the SVG's first <text>
 * (for the resolved font family) and returns what to print and at what scale (canvas px per SVG
 * unit). The canvas must sit in the SVG's coordinate space (same parent, same transform).
 */
export function usePathPrint(
  svg: RefObject<SVGSVGElement | null>,
  canvas: RefObject<HTMLCanvasElement | null>,
  make: (text: SVGTextElement) => { runs: PathRun[]; style: PathTextStyle; scale: number } | null,
  deps: readonly unknown[],
) {
  useEffect(() => {
    const el = svg.current;
    const cv = canvas.current;
    const text = el?.querySelector("text");
    if (!el || !cv || !text) return;
    const first = make(text);
    if (!first) return;
    const font = `${first.style.weight} ${first.style.size}px ${first.style.family}`;
    const sample = first.runs.map((r) => r.text.slice(0, 80)).join("");
    let cancelled = false;
    let cancelPrint = () => {};
    document.fonts
      .load(font, sample)
      .then(() => {
        if (cancelled || !document.fonts.check(font, sample)) return;
        // again now the face is in: the SVG has re-laid itself out with it (measured advances)
        const job = make(text);
        if (!job) return;
        const { runs, style, scale } = job;
        cancelPrint = printPaths(cv, runs, style, scale, (box) => {
          if (cancelled) return;
          Object.assign(cv.style, { position: "absolute", left: `${box.x}px`, top: `${box.y}px`, width: `${cv.width / scale}px`, height: `${cv.height / scale}px`, display: "block" });
          el.style.display = "none";
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      cancelPrint();
      el.style.display = "";
      cv.style.display = "none";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
