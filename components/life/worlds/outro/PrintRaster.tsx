"use client";

/**
 * The print as a 2D raster, computed in small slices so it never blocks a
 * frame: `PrintCanvas` is the still print used by the reduced-motion page, and
 * `PrintFallback` hangs that still on the live camera path when WebGL is missing.
 */
import { useEffect, useRef } from "react";
import { RISO } from "@/components/life/multiverse/palette";
import { BAND_INKS } from "./bands";
import { Z_REF } from "./camera";
import { PH, PW, inkAt, rimAt, type Ink } from "./field";
import type { Rig } from "./rig";

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const sstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Paint the print into `ctx` (w × h px), a few rows per slice. Returns a cancel function. */
function paint(ctx: CanvasRenderingContext2D, w: number, h: number, done?: () => void) {
  const img = ctx.createImageData(w, h);
  const inks = BAND_INKS.map(rgb);
  const ink0 = rgb(RISO.ink);
  const data = img.data;
  const out: Ink = { phase: 0, F: 0, crest: 0, band: 0, cos: 0, gap: 0, wob: 0 };
  const a = Math.max(0.05, (((2 * Math.PI) / 0.0193) * (PW / w)) * 0.78);
  let y = 0;
  let cancelled = false;
  let timer = 0;

  const slice = () => {
    if (cancelled) return;
    const end = Math.min(h, y + 28);
    for (; y < end; y++) {
      const py = PH / 2 - ((y + 0.5) / h) * PH;
      for (let x = 0; x < w; x++) {
        const px = ((x + 0.5) / w - 0.5) * PW;
        const rim = rimAt(px, py);
        const i = (y * w + x) * 4;
        const inside = 1 - sstep(0.9, 1, rim);
        let r = ink0[0];
        let g = ink0[1];
        let b = ink0[2];
        if (inside > 0) {
          inkAt(px, py, out);
          const sd = out.cos - (0.05 + out.wob) - out.gap * 1.35;
          const m = sstep(-a, a, sd) * inside;
          const c = inks[out.band];
          r += (c[0] - r) * m;
          g += (c[1] - g) * m;
          b += (c[2] - b) * m;
        }
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
    if (y < h) timer = window.setTimeout(slice, 0);
    else {
      ctx.putImageData(img, 0, 0);
      done?.();
    }
  };
  timer = window.setTimeout(slice, 0);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}

/** The still print, sized to a CSS width. Painted off-screen, then shown once. */
export function PrintCanvas({ width, maxPx = 880, className }: { width: number; maxPx?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || width <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(Math.round(width * dpr), maxPx);
    const h = Math.round((w * PH) / PW);
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const ctx = off.getContext("2d");
    if (!ctx) return;
    return paint(ctx, w, h, () => {
      c.width = w;
      c.height = h;
      c.getContext("2d")?.drawImage(off, 0, 0);
      c.style.opacity = "1";
    });
  }, [width, maxPx]);
  return <canvas ref={ref} className={className} aria-hidden style={{ width, height: (width * PH) / PW, display: "block", opacity: 0 }} />;
}

/** No WebGL: the still print on a CSS plane, pitched and flown along the live camera path. */
export function PrintFallback({ rig }: { rig: Rig }) {
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      rig.subscribe((_, f) => {
        const el = wrap.current;
        if (!el) return;
        const S = (rig.H / 2 / ((Math.max(f.z, 0.012) - Z_REF) * Math.tan((f.fov * Math.PI) / 360))) as number;
        const scale = Math.min(9, S / 480);
        const tilt = (f.tilt * 180) / Math.PI;
        el.style.transform = `translate(${rig.W / 2 - 240}px, ${rig.H / 2 - 324}px) perspective(${Math.round(rig.H * 1.1)}px) rotateX(${(Math.min(tilt, 76)).toFixed(2)}deg) scale(${scale.toFixed(3)}) translate(${(-f.x * 480).toFixed(1)}px, ${(f.y * 480).toFixed(1)}px)`;
      }),
    [rig],
  );
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div ref={wrap} className="absolute left-0 top-0" style={{ width: 480, height: 648, transformOrigin: "50% 50%", willChange: "transform" }}>
        <PrintCanvas width={480} maxPx={720} />
      </div>
    </div>
  );
}
