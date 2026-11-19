"use client";

/**
 * Type printed by the same finger: each line is stacked concentric contours in
 * alternating ink and colour around a solid fill, so the letters read as
 * ridges. The contours can ripple outward (scan hit, stamp), driven by scroll.
 *
 * Ten thick strokes of a variable font are very expensive for the browser to
 * rasterise, and in the film this type rides transforms that change every
 * frame (the portal dive's zoom, the stamp's slam), which makes the browser
 * rasterise it again every frame: 50-80 ms each, so the scroll stuttered.
 * With `print`, the type is printed once into a canvas, on the CPU, in idle
 * slices while the world still waits off screen, and from then on the browser
 * only moves a picture. The SVG shows until the print is ready (and stays as
 * the fallback). A ripple redraws the print at most once per frame, and backs
 * off on a machine where that is too slow.
 */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { RISO } from "@/components/life/multiverse/palette";
import { BIG } from "./layout";

export type RidgeLine = { text: string; size: number; x: number; y: number; anchor?: "start" | "middle" | "end" };

/** `r` = how far the contour reaches beyond the letter, in px. Outermost first. */
export type RidgeRing = { r: number; color: string; alpha?: number };

export type RidgedHandle = {
  /** t = seconds-like phase of the ripple; k = strength in px. */
  ripple: (t: number, k: number) => void;
};

/**
 * Contour stack around a letter. `q` = size / 150. Fine lines at display sizes;
 * fewer on a phone, so each one stays a clean printed line.
 */
export function contours(q: number, outer: string, mid: string, inner: string = RISO.paper): RidgeRing[] {
  const ink = RISO.ink;
  const fine = q >= 0.72;
  const line: [number, string][] = fine
    ? [
        [19.5, outer],
        [17.2, ink],
        [15.2, outer],
        [12.9, ink],
        [10.8, mid],
        [8.6, ink],
        [6.5, mid],
        [4.3, ink],
        [2.4, inner],
        [1.1, ink],
      ]
    : [
        [13, outer],
        [9.4, ink],
        [6.6, mid],
        [3.6, ink],
        [1.8, inner],
        [0.9, ink],
      ];
  return line.map(([r, color]) => ({ r: r * q * (fine ? 1 : 1.5), color }));
}

/** Fast attack, long settle. */
const bump = (t: number) => (t <= 0 ? 0 : (1 - Math.exp(-t * 34)) * Math.exp(-t * 4.6));
/** The highest `bump` gets (at t ≈ 0.063). */
const BUMP_PEAK = 0.661;

/** Extra half-width of ring `i` of `n` (outermost first): the wave starts at the letter and travels outward. */
function rippleAt(i: number, n: number, t: number, k: number) {
  const out = n - 1 - i;
  return bump(t - out * 0.07) * k * (1 + out * 0.25);
}

/* ------------------------------------------------------------------ print */

/**
 * The film sets `"opsz" 72` on this face. Canvas text has no variation settings and takes its
 * optical size from the font size, so every line is drawn at 72px or more and scaled to size.
 */
const OPSZ = 72;
/** Never print more pixels than this (a 4K screen at DPR 3 would otherwise ask for ~40 MB). */
const MAX_PIXELS = 6e6;

type Box = { x: number; y: number; w: number; h: number; dpr: number };

type Print = {
  ctx: CanvasRenderingContext2D;
  box: Box;
  family: string;
  /** Extra half-width each ring was last drawn with. */
  drawn: number[];
  /** Ripple redraws: smoothed cost (ms), the last one's time, a pending trailing redraw. */
  cost: number;
  last: number;
  timer: number;
  want: number[] | null;
};

function setFont(ctx: CanvasRenderingContext2D, family: string, line: RidgeLine) {
  const F = Math.max(OPSZ, line.size);
  ctx.font = `900 ${F}px ${family}`;
  ctx.textAlign = line.anchor === "start" ? "left" : line.anchor === "end" ? "right" : "center";
  ctx.textBaseline = "alphabetic";
  return line.size / F;
}

/** One line of one ring (`half` = stroke half-width in px) or of the fill (`half` = 0). */
function drawLine(ctx: CanvasRenderingContext2D, family: string, line: RidgeLine, color: string, alpha: number, half: number) {
  ctx.save();
  const s = setFont(ctx, family, line);
  ctx.translate(line.x, line.y);
  ctx.scale(s, s);
  ctx.globalAlpha = alpha;
  if (half > 0) {
    ctx.lineWidth = (2 * half) / s;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.strokeText(line.text, 0, 0);
  } else {
    ctx.fillStyle = color;
    ctx.fillText(line.text, 0, 0);
  }
  ctx.restore();
}

/** The print's box (relative to the SVG's), from the glyphs' real ink bounds plus the widest a ring can get. */
function measure(family: string, lines: RidgeLine[], reach: number): Box | null {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const l of lines) {
    const s = setFont(ctx, family, l);
    const m = ctx.measureText(l.text);
    x0 = Math.min(x0, l.x - m.actualBoundingBoxLeft * s);
    x1 = Math.max(x1, l.x + m.actualBoundingBoxRight * s);
    y0 = Math.min(y0, l.y - m.actualBoundingBoxAscent * s);
    y1 = Math.max(y1, l.y + m.actualBoundingBoxDescent * s);
  }
  if (!(x1 > x0 && y1 > y0)) return null;
  const pad = reach + 3;
  const x = Math.floor(x0 - pad);
  const y = Math.floor(y0 - pad);
  const w = Math.ceil(x1 + pad) - x;
  const h = Math.ceil(y1 + pad) - y;
  let dpr = Math.min(3, window.devicePixelRatio || 1);
  if (w * h * dpr * dpr > MAX_PIXELS) dpr = Math.sqrt(MAX_PIXELS / (w * h));
  return { x, y, w, h, dpr };
}

/** Every stroke and fill of the print, in paint order (outermost ring first, the fill last). */
function steps(lines: RidgeLine[], rings: RidgeRing[], fill: string) {
  const out: { line: RidgeLine; color: string; alpha: number; ring: number }[] = [];
  rings.forEach((r, i) => lines.forEach((line) => out.push({ line, color: r.color, alpha: r.alpha ?? 1, ring: i })));
  lines.forEach((line) => out.push({ line, color: fill, alpha: 1, ring: -1 }));
  return out;
}

type IdleDeadline = { timeRemaining(): number; didTimeout: boolean };
type IdleWindow = Window & { requestIdleCallback?: (cb: (d: IdleDeadline) => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };

/* -------------------------------------------------------------- component */

export const RidgedText = forwardRef<
  RidgedHandle,
  {
    lines: RidgeLine[];
    rings: RidgeRing[];
    fill: string;
    width: number;
    height: number;
    className?: string;
    /** Print into a canvas once the font is ready (for type that moves every frame). */
    print?: boolean;
    /** Ripple strength (px) the caller will pass to `ripple`, so the print leaves room for it. */
    swell?: number;
    /** Redraw the print for ripples (off on low-power devices: the print then stays at rest). */
    live?: boolean;
  }
>(function RidgedText({ lines, rings, fill, width, height, className, print = false, swell = 0, live = true }, ref) {
  const svg = useRef<SVGSVGElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const printed = useRef<Print | null>(null);
  // inline arrays from the parent change identity every render: print again only when the content changes
  const key = useMemo(() => JSON.stringify([lines, rings, fill, swell]), [lines, rings, fill, swell]);
  const spec = useRef({ lines, rings, fill, swell, live });
  spec.current = { lines, rings, fill, swell, live };

  useEffect(() => {
    const el = svg.current;
    const cv = canvas.current;
    if (!print || !el || !cv) return;
    const { lines, rings, fill, swell } = spec.current;
    let cancelled = false;
    let idleId = 0;
    let timeoutId = 0;
    const w = window as IdleWindow;

    const showSvg = () => {
      el.style.display = "block";
      cv.style.display = "none";
    };
    const next = (fn: (budget: number) => void) => {
      if (w.requestIdleCallback) idleId = w.requestIdleCallback((d) => fn(d.didTimeout ? 5 : Math.min(8, Math.max(3, d.timeRemaining()))), { timeout: 120 });
      else timeoutId = window.setTimeout(() => fn(5), 16);
    };

    (async () => {
      const text = el.querySelector("text");
      const family = text ? getComputedStyle(text).fontFamily : "";
      if (!family) return;
      const font = `900 ${OPSZ}px ${family}`;
      const sample = lines.map((l) => l.text).join("");
      try {
        await document.fonts.load(font, sample);
      } catch {
        return;
      }
      // the face never arrived: keep the SVG (it shows the fallback face the same way the rest of the page does)
      if (cancelled || !document.fonts.check(font, sample)) return;

      const reach = Math.max(0, ...rings.map((r) => r.r)) + (swell > 0 ? BUMP_PEAK * swell * (1 + (rings.length - 1) * 0.25) : 0);
      const box = measure(family, lines, reach);
      const ctx = box && cv.getContext("2d", { willReadFrequently: true });
      if (!box || !ctx) return;
      cv.width = Math.round(box.w * box.dpr);
      cv.height = Math.round(box.h * box.dpr);
      Object.assign(cv.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${cv.width / box.dpr}px`, height: `${cv.height / box.dpr}px` });
      ctx.setTransform(box.dpr, 0, 0, box.dpr, -box.x * box.dpr, -box.y * box.dpr);

      // print in idle slices: never more than a few ms of the main thread at a time
      const todo = steps(lines, rings, fill);
      let at = 0;
      await new Promise<void>((resolve) => {
        const slice = (budget: number) => {
          if (cancelled) return resolve();
          const end = performance.now() + budget;
          do drawLine(ctx, family, todo[at].line, todo[at].color, todo[at].alpha, todo[at].ring >= 0 ? rings[todo[at].ring].r : 0);
          while (++at < todo.length && performance.now() < end);
          if (at < todo.length) next(slice);
          else resolve();
        };
        next(slice);
      });
      if (cancelled) return;
      printed.current = { ctx, box, family, drawn: rings.map(() => 0), cost: 0, last: 0, timer: 0, want: null };
      cv.style.display = "block";
      el.style.display = "none";
    })();

    return () => {
      cancelled = true;
      if (idleId) w.cancelIdleCallback?.(idleId);
      window.clearTimeout(timeoutId);
      if (printed.current) window.clearTimeout(printed.current.timer);
      printed.current = null;
      showSvg();
    };
  }, [print, key]);

  useImperativeHandle(
    ref,
    () => {
      /** Redraw the print with each ring `extra` px wider. */
      const redraw = (p: Print, extra: number[]) => {
        const { lines, rings, fill } = spec.current;
        const t0 = performance.now();
        const { ctx, box, family } = p;
        ctx.clearRect(box.x, box.y, box.w, box.h);
        for (const s of steps(lines, rings, fill)) drawLine(ctx, family, s.line, s.color, s.alpha, s.ring >= 0 ? rings[s.ring].r + extra[s.ring] : 0);
        p.drawn = extra;
        p.last = performance.now();
        p.cost = p.cost ? p.cost * 0.7 + (p.last - t0) * 0.3 : p.last - t0;
      };
      return {
        ripple(t, k) {
          const n = rings.length;
          const p = printed.current;
          if (p) {
            if (!spec.current.live) return;
            const extra = rings.map((_, i) => rippleAt(i, n, t, k));
            const moved = extra.some((e, i) => Math.abs(e - p.drawn[i]) > 0.25);
            if (!moved) return;
            // a machine where a redraw costs most of a frame skips frames; one where it never fits stops rippling
            const rest = extra.every((e) => e < 0.25);
            if (p.cost > 40 && !rest) return;
            const gap = p.cost > 9 ? 34 : 0;
            window.clearTimeout(p.timer);
            const wait = gap - (performance.now() - p.last);
            if (wait <= 0) redraw(p, extra);
            else {
              // leave the print where the scroll stopped, even if no further ripple call comes
              p.want = extra;
              p.timer = window.setTimeout(() => {
                if (printed.current === p && p.want) redraw(p, p.want);
              }, wait);
            }
            return;
          }
          const el = svg.current;
          if (!el) return;
          for (let i = 0; i < n; i++) el.style.setProperty(`--rp${i}`, rippleAt(i, n, t, k).toFixed(2));
        },
      };
    },
    [rings],
  );

  const text = (l: RidgeLine, i: number) => (
    <text key={i} x={l.x} y={l.y} fontSize={l.size} textAnchor={l.anchor ?? "middle"}>
      {l.text}
    </text>
  );

  const vector = (
    <svg ref={svg} width={width} height={height} className={print ? undefined : className} style={{ display: "block", overflow: "visible" }} aria-hidden>
      <g style={{ ...BIG, strokeLinejoin: "round", strokeLinecap: "round", fill: "none" }}>
        {rings.map((r, i) => (
          <g
            key={i}
            stroke={r.color}
            strokeOpacity={r.alpha ?? 1}
            style={{ strokeWidth: `calc(${(r.r * 2).toFixed(2)}px + var(--rp${i}, 0) * 2px)` }}
          >
            {lines.map(text)}
          </g>
        ))}
        <g style={{ fill }}>{lines.map(text)}</g>
      </g>
    </svg>
  );

  if (!print) return vector;
  return (
    <div className={className} style={{ position: "relative", width, height }} aria-hidden>
      {vector}
      <canvas ref={canvas} aria-hidden style={{ position: "absolute", display: "none", pointerEvents: "none" }} />
    </div>
  );
});
