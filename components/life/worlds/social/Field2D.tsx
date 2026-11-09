"use client";

/**
 * No-WebGL fallback: the same field and followers drawn with Canvas 2D, from
 * the same SocialSim state, with a much lower eye cap (~1.4k desktop, ~500
 * phone) so it stays smooth on the CPU.
 */

import { useEffect, useRef } from "react";
import { useStage, useTicker } from "@/components/life/multiverse/runtime";
import { RISO } from "@/components/life/multiverse/palette";
import { clamp, lerp, smoothstep } from "@/components/life/multiverse/ease";
import { ROW } from "./timeline";
import type { SocialSim } from "./sim";

const fract = (x: number) => x - Math.floor(x);
function hash12(x: number, y: number) {
  let a = fract(x * 0.1031);
  let b = fract(y * 0.1031);
  let c = fract(x * 0.1031);
  const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
  a += d;
  b += d;
  c += d;
  return fract((a + b) * c);
}

/** Signed distance from (x, y) to the rect [x0, y0, x1, y1]. */
function sdRect(x: number, y: number, r: readonly number[]) {
  const dx = Math.max(r[0] - x, x - r[2]);
  const dy = Math.max(r[1] - y, y - r[3]);
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
}

function almond(ctx: CanvasRenderingContext2D, w: number, h: number, dx = 0, dy = 0) {
  ctx.beginPath();
  ctx.moveTo(-w + dx, dy);
  ctx.quadraticCurveTo(dx, -2 * h + dy, w + dx, dy);
  ctx.quadraticCurveTo(dx, 2 * h + dy, -w + dx, dy);
  ctx.closePath();
}

function eye2D(ctx: CanvasRenderingContext2D, x: number, y: number, S: number, open: number, gx: number, gy: number, iris: string) {
  const w = 0.38 * S;
  const h = 0.24 * S * Math.max(open, 0.06);
  const lw = Math.max(1.1, 0.036 * S);
  const sh = clamp(0.03 * S, 1.2, 14);
  ctx.save();
  ctx.translate(x, y);
  almond(ctx, w, h, sh * 0.8, sh);
  ctx.fillStyle = RISO.ink;
  ctx.fill();
  almond(ctx, w, h);
  ctx.fillStyle = RISO.paper;
  ctx.fill();
  if (open > 0.3) {
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.arc(gx * S, gy * S, 0.152 * S, 0, Math.PI * 2);
    ctx.fillStyle = iris;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(gx * S, gy * S, 0.068 * S, 0, Math.PI * 2);
    ctx.fillStyle = RISO.ink;
    ctx.fill();
    if (S > 14) {
      ctx.beginPath();
      ctx.arc(gx * S - 0.052 * S, gy * S - 0.05 * S, 0.034 * S, 0, Math.PI * 2);
      ctx.fillStyle = RISO.paper;
      ctx.fill();
    }
    ctx.restore();
  }
  almond(ctx, w, h);
  ctx.lineWidth = lw;
  ctx.strokeStyle = RISO.ink;
  ctx.stroke();
  ctx.restore();
}

export default function Field2D({ sim }: { sim: SocialSim }) {
  const stage = useStage();
  const ref = useRef<HTMLCanvasElement>(null);
  const dpr = useRef(1);
  const frame = useRef(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    dpr.current = Math.min(window.devicePixelRatio || 1, stage.lowPower ? 1.25 : 1.5);
    c.width = Math.round(stage.width * dpr.current);
    c.height = Math.round(stage.height * dpr.current);
  }, [stage.width, stage.height, stage.lowPower]);

  useTicker(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    if (++frame.current % 2) return; // 30fps is plenty for the fallback
    const F = sim.field;
    const W = stage.width;
    const H = stage.height;
    ctx.setTransform(dpr.current, 0, 0, dpr.current, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const cap = stage.lowPower ? 500 : 1400;
    const S = Math.max(F.S, Math.sqrt((W * H) / (cap * ROW)));
    const SH = S * ROW;
    const r0 = Math.floor((0 - F.cy) / SH) - 1;
    const r1 = Math.ceil((H - F.cy) / SH) + 1;
    const c0 = Math.floor((0 - F.cx) / S) - 1;
    const c1 = Math.ceil((W - F.cx) / S) + 1;
    const gaze = F.gaze;
    for (let row = r0; row <= r1; row++) {
      const odd = ((row % 2) + 2) % 2;
      for (let col = c0; col <= c1; col++) {
        const cx = F.cx + (col + 0.5 * odd) * S;
        const cy = F.cy + row * SH;
        const center = col === 0 && row === 0;
        let scale: number;
        let open: number;
        if (center) {
          scale = F.centerScale;
          open = F.centerOpen;
        } else {
          const dist = Math.hypot(cx - F.cx, cy - F.cy) / S;
          const a = clamp((F.R - dist - hash12(col + 45.5, row + 4.4) * 0.9) / 1.2);
          if (a <= 0) continue;
          const b = a - 1;
          scale = 1 + 3.8 * b * b * b + 2.8 * b * b;
          open = smoothstep(clamp((a - 0.15) / 0.55));
        }
        if (F.waveR > 0) {
          const behind = F.waveR - Math.hypot(cx - F.waveX, cy - F.waveY);
          open *= 1 - clamp(behind / 46);
          scale *= 1 - smoothstep(clamp((behind - 70) / 180));
        }
        if (!center) {
          // same courtesy as the shader: eyes make room for the copy
          if (F.clearAmtA > 0) scale *= lerp(1, smoothstep(clamp((sdRect(cx, cy, F.clearA) - 0.25 * S) / (0.45 * S))), F.clearAmtA);
          if (F.clearAmtB > 0) scale *= lerp(1, smoothstep(clamp((sdRect(cx, cy, F.clearB) - 0.25 * S) / (0.45 * S))), F.clearAmtB);
        }
        scale *= 1 + F.pulse * 0.15;
        if (scale < 0.02) continue;
        const gi = Math.floor(hash12(col + 21.9, row + 8.8) * 8);
        const dx = gaze[gi * 2] - cx;
        const dy = gaze[gi * 2 + 1] - cy;
        const dl = Math.hypot(dx, dy) || 1;
        const m = Math.min(dl / (0.55 * S), 1) * (center ? 1 - F.lookViewer : 1);
        const iris = hash12(col + 53.9, row + 6.6) < 0.3 ? RISO.teal : RISO.cobalt;
        eye2D(ctx, cx, cy, S * scale, open, (dx / dl) * m * 0.12, (dy / dl) * m * 0.06 * open, iris);
      }
    }

    const fol = sim.fol;
    for (let i = 0; i < fol.live; i++) {
      const s = fol.size[i];
      if (s < 1) continue;
      eye2D(ctx, fol.pos[i * 2], fol.pos[i * 2 + 1], s, fol.open[i], fol.gaze[i * 2] * 0.9, fol.gaze[i * 2 + 1] * 0.8, RISO.sun);
    }
  });

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
