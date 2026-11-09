/**
 * No-WebGL2 path (and the reduced-motion still): the same thermal image from
 * the same Frame, per-pixel on the CPU at low resolution, upscaled and then
 * the barbell and lamp drawn crisp on top. Fast enough for 60fps because the
 * body is 16 capsules on a small buffer.
 */
import { MODES, hexRgb01 } from "./colors";
import type { Frame } from "./frame";
import type { Live, Look } from "./ThermalGL";
import type { Renderer } from "./engine";
import type { WordMasks } from "./words";
import { PORTAL_ICONS } from "@/components/life/multiverse/portalIcons";

const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};

/** Signed distance to a tapered capsule. */
function sdTaper(px: number, py: number, ax: number, ay: number, bx: number, by: number, ra: number, rb: number) {
  const bax = bx - ax;
  const bay = by - ay;
  const h = Math.hypot(bax, bay);
  const qx0 = px - ax;
  const qy0 = py - ay;
  if (h < 1e-3) return Math.hypot(qx0, qy0) - Math.max(ra, rb);
  const dx = bax / h;
  const dy = bay / h;
  const qx = Math.abs(qx0 * -dy + qy0 * dx);
  const qy = qx0 * dx + qy0 * dy;
  const b = Math.max(-0.98, Math.min(0.98, (ra - rb) / h));
  const a = Math.sqrt(1 - b * b);
  const k = qx * -b + qy * a;
  if (k < 0) return Math.hypot(qx, qy) - ra;
  if (k > a * h) return Math.hypot(qx, qy - h) - rb;
  return qx * a + qy * b - ra;
}

export class CpuThermal implements Renderer {
  private ctx: CanvasRenderingContext2D | null;
  private lo: HTMLCanvasElement;
  private loCtx: CanvasRenderingContext2D | null;
  private image: ImageData | null = null;
  private lut = new Uint8ClampedArray(256 * 3);
  private lutKey = "";
  private w = 1;
  private h = 1;
  private sw = 1;
  private sh = 1;
  private dpr = 1;
  private div = 5;
  private words: WordMasks | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.lo = document.createElement("canvas");
    this.loCtx = this.lo.getContext("2d");
  }

  resize(w: number, h: number, dpr: number, fieldDiv: number) {
    this.sw = w;
    this.sh = h;
    this.dpr = Math.min(dpr, 1.5);
    this.div = Math.max(4, fieldDiv * 1.6);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.w = Math.max(16, Math.round(w / this.div));
    this.h = Math.max(16, Math.round(h / this.div));
    this.lo.width = this.w;
    this.lo.height = this.h;
    this.image = this.loCtx?.createImageData(this.w, this.h) ?? null;
  }

  setWords(a: Uint8Array, b: Uint8Array, w: number, h: number) {
    this.words = { a, b, w, h };
  }

  private buildLut(stops: Float32Array) {
    const key = Array.from(stops).join(",");
    if (key === this.lutKey) return;
    this.lutKey = key;
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * 5;
      const k = Math.min(4, Math.floor(x));
      const f = x - k;
      for (let c = 0; c < 3; c++) {
        this.lut[i * 3 + c] = 255 * (stops[k * 3 + c] + (stops[(k + 1) * 3 + c] - stops[k * 3 + c]) * f);
      }
    }
  }

  render(F: Frame, _live: Live, look: Look) {
    const { ctx, loCtx, image } = this;
    if (!ctx || !loCtx || !image) return;
    this.buildLut(look.modeMix > 0 ? look.stopsB : look.stopsA);
    const { w, h, div, lut, words } = this;
    const data = image.data;
    const k = F.k;
    const edge = F.edge;
    const wx = words ? words.w / w : 0;
    const wy = words ? words.h / h : 0;
    for (let j = 0; j < h; j++) {
      const py = (j + 0.5) * div;
      for (let i = 0; i < w; i++) {
        const px = (i + 0.5) * div;
        let dmin = 1e4;
        let wsum = 0;
        let tsum = 0;
        for (let c = 0; c < F.capN; c++) {
          const d = sdTaper(px, py, F.capP[c * 4], F.capP[c * 4 + 1], F.capP[c * 4 + 2], F.capP[c * 4 + 3], F.capR[c * 4], F.capR[c * 4 + 1]);
          dmin = smin(dmin, d, k);
          const wt = Math.exp(-Math.max(d, 0) / F.fall) + 1e-5;
          wsum += wt;
          tsum += wt * F.capR[c * 4 + 2];
        }
        const T = tsum / wsum;
        const inside = Math.min(1, Math.max(0, (edge - dmin) / (2 * edge)));
        const depth = Math.min(1, Math.max(0, -dmin / (k * 2.6)));
        const Tb = T * (0.8 + 0.27 * depth);
        const halo = T * F.haloAmt * Math.exp(-Math.max(dmin, 0) / F.haloR);
        const body = Tb * inside + halo * (1 - inside);

        let Tenv = 0.052 + (py < F.floorY ? 0.05 * Math.exp(-Math.pow((py - F.wallY) / (this.sh * 0.3), 2)) : -0.02);
        if (words) {
          const wi = Math.min(words.w - 1, Math.floor(i * wx));
          const wj = Math.min(words.h - 1, Math.floor(j * wy));
          const o = (wi + wj * words.w) * 4;
          const a = words.a;
          let tw = 0;
          for (let c = 0; c < 4; c++) tw = Math.max(tw, (a[o + c] / 255) * F.wordT[c]);
          tw = Math.max(tw, (words.b[o] / 255) * F.wordT[4]);
          Tenv = Math.max(Tenv, tw);
        }
        let t = (body + Tenv * (1 - inside)) * F.exitK;
        const dcx = px - F.chest[0];
        const dcy = py - F.chest[1];
        t += F.bloom * 0.17 * Math.exp(-(dcx * dcx + dcy * dcy) / Math.pow(F.fh * 0.75, 2));
        const vx = (px / this.sw - 0.5) * (this.sw / this.sh);
        const vy = py / this.sh - 0.5;
        t -= 0.1 * (vx * vx + vy * vy);
        const li = Math.max(0, Math.min(255, Math.round(t * 255)));
        const o = (i + j * w) * 4;
        data[o] = lut[li * 3];
        data[o + 1] = lut[li * 3 + 1];
        data[o + 2] = lut[li * 3 + 2];
        data[o + 3] = 255;
      }
    }
    loCtx.putImageData(image, 0, 0);

    const s = this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(this.lo, 0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    this.drawBar(ctx, F, look);
    this.drawLamp(ctx, F, look);
  }

  private inkAt(t: number, look: Look) {
    const stops = look.modeMix > 0 ? look.stopsB : look.stopsA;
    const x = Math.max(0, Math.min(1, t)) * 5;
    const k = Math.min(4, Math.floor(x));
    const f = x - k;
    const ch = (c: number) => Math.round(255 * (stops[k * 3 + c] + (stops[(k + 1) * 3 + c] - stops[k * 3 + c]) * f));
    return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
  }

  dispose() {
    this.ctx = null;
    this.loCtx = null;
    this.image = null;
    this.words = null;
  }

  private drawBar(ctx: CanvasRenderingContext2D, F: Frame, look: Look) {
    const [x0, y, x1, th] = F.bar;
    const cold = this.inkAt(0.012, look);
    ctx.fillStyle = cold;
    ctx.fillRect(x0, y - th, x1 - x0, th * 2);
    for (let i = 0; i < 3; i++) {
      const off = F.plates[i * 4];
      const hw = F.plates[i * 4 + 1];
      const hh = F.plates[i * 4 + 2];
      const mid = (x0 + x1) / 2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.roundRect(mid + side * off - hw, y - hh, hw * 2, hh * 2, Math.min(hw, hh) * 0.55);
        ctx.fillStyle = cold;
        ctx.fill();
        ctx.strokeStyle = this.inkAt(0.24, look);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.fillStyle = this.inkAt(F.handT, look);
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(F.hands[i * 2], F.hands[i * 2 + 1], F.handR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawLamp(ctx: CanvasRenderingContext2D, F: Frame, look: Look) {
    const a = F.lamp[3];
    if (a <= 0.001) return;
    const s = F.lamp[2] / 100;
    ctx.save();
    ctx.translate(F.lamp[0], F.lamp[1]);
    ctx.scale(s, s);
    ctx.globalAlpha = a;
    ctx.fillStyle = this.inkAt(1, look);
    drawIconPaths(ctx);
    ctx.restore();
  }
}

/** The lamp portal icon as canvas paths. */
function drawIconPaths(ctx: CanvasRenderingContext2D) {
  const svg = PORTAL_ICONS.lamp.svg;
  for (const m of svg.matchAll(/<path d="([^"]+)"/g)) ctx.fill(new Path2D(m[1]));
  const c = svg.match(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/);
  if (c) {
    ctx.beginPath();
    ctx.arc(Number(c[1]), Number(c[2]), Number(c[3]), 0, Math.PI * 2);
    ctx.fill();
  }
}

export const defaultStops = MODES[0].stops.map(hexRgb01);
