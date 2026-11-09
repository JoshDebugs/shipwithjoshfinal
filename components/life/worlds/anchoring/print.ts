/**
 * The press: one Canvas 2D that prints the paper, the four halftone ink
 * passes and the oscilloscope trace.
 *
 * Each pass is a real halftone screen at its own angle and ruling. Dot radius
 * is "sound pressure": falloff from the sources (cones + mic) × the pass's ink
 * level, with ripples travelling outward. Inks overprint with multiply, the
 * way riso inks do. At the clip the pink pass overgrows its cells — near the
 * sources first — until the dots fuse into solid ink (no flash: it spreads).
 */
import { RISO, alpha as rgba } from "@/components/life/multiverse/palette";
import { noise2D, waveY, type WaveState } from "./wave";

export type Source = { x: number; y: number; reach: number; gain: number };

export type PrintFrame = {
  /** Effective ink level per pass, 0..1 (cobalt, teal, sun, pink). */
  levels: number[];
  /** Pink flood: 0 → pressure dots, 1 → fused solid. */
  fuse: number;
  /** Ambient clock (s) and ripple strength 0..1. */
  t: number;
  pump: number;
  sources: Source[];
  /** Plate offsets (misregistration), dx/dy per pass. */
  offsets: number[];
  wave: WaveState;
  waveWidth: number;
  waveAlpha: number;
  /** Misregistered colour copy of the trace (0 = off). */
  ghostAlpha: number;
  ghostInk: string;
  ghostDx: number;
  ghostDy: number;
};

type Grid = { xs: Float32Array; ys: Float32Array; nz: Float32Array; n: number; cell: number };

const INKS = [RISO.cobalt, RISO.teal, RISO.sun, RISO.pink] as const;
/** Classic screen angles, one per plate, so the passes rosette instead of moiré-ing. */
const ANGLES = [15, 75, 0, 45];
const TAU = Math.PI * 2;

function makeGrid(W: number, H: number, angleDeg: number, cell: number, seed: number): Grid {
  const a = (angleDeg * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const cx = W / 2;
  const cy = H / 2;
  const n = Math.ceil(Math.hypot(W, H) / 2 / cell) + 1;
  const xs: number[] = [];
  const ys: number[] = [];
  const nz: number[] = [];
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const x = cx + i * cell * ca - j * cell * sa;
      const y = cy + i * cell * sa + j * cell * ca;
      if (x < -cell || y < -cell || x > W + cell || y > H + cell) continue;
      xs.push(x);
      ys.push(y);
      nz.push(0.78 + 0.44 * (0.5 + 0.5 * noise2D(x * 0.0042 + seed * 17.3, y * 0.0042 - seed * 5.1)));
    }
  }
  return { xs: Float32Array.from(xs), ys: Float32Array.from(ys), nz: Float32Array.from(nz), n: xs.length, cell };
}

export class PrintCanvas {
  readonly W: number;
  readonly H: number;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly dpr: number;
  private readonly grids: Grid[];
  private readonly step: number;

  constructor(canvas: HTMLCanvasElement, W: number, H: number, dpr: number, cells: readonly number[], step: number) {
    this.W = W;
    this.H = H;
    this.dpr = dpr;
    this.step = step;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.grids = cells.map((c, k) => makeGrid(W, H, ANGLES[k], c, k + 1));
  }

  draw(f: PrintFrame) {
    const ctx = this.ctx;
    if (!ctx) return;
    const { W, H } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = RISO.paper;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = "multiply";
    const srcs = f.sources;
    const ns = srcs.length;
    const fuse = f.fuse;
    const ripT = f.t * 1.7;

    for (let k = 0; k < 4; k++) {
      const pink = k === 3;
      const level = f.levels[k];
      if (level <= 0.002 && !(pink && fuse > 0)) continue;
      const g = this.grids[k];
      const c = g.cell;
      const ox = f.offsets[k * 2] || 0;
      const oy = f.offsets[k * 2 + 1] || 0;
      ctx.fillStyle = INKS[k];

      // fully fused: one solid pass (cheap and exact)
      if (pink && fuse >= 0.999) {
        ctx.fillRect(0, 0, W, H);
        continue;
      }

      const rMax = c * 0.8;
      ctx.beginPath();
      for (let i = 0; i < g.n; i++) {
        const x = g.xs[i] + ox;
        const y = g.ys[i] + oy;
        let p = 0;
        let dNear = 1e9;
        for (let s = 0; s < ns; s++) {
          const src = srcs[s];
          if (src.gain <= 0) continue;
          const dx = x - src.x;
          const dy = y - src.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const u = 1 - d / src.reach;
          if (u > 0) {
            const v = u * u * (3 - 2 * u) * src.gain;
            if (v > p) {
              p = v;
              dNear = d;
            }
          }
        }
        const nz = g.nz[i];
        p *= nz;
        // pressure ripples travelling out of the sources
        const rip = f.pump > 0 && dNear < 1e8 ? 0.5 + 0.5 * Math.cos(TAU * (ripT - dNear / 150)) : 0;
        let r = c * 0.5 * level * p * (1 + f.pump * 0.18 * rip * p);
        if (pink && fuse > 0) {
          // overgrow the cells — nearest the sources first — until the dots fuse
          let lf = fuse * 1.75 - (1 - p) * 0.75;
          lf = lf < 0 ? 0 : lf > 1 ? 1 : lf;
          r += (c * 0.8 - r) * lf * lf * (3 - 2 * lf);
        }
        if (r < 0.45) continue;
        if (r > rMax) r = rMax;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
      ctx.fill();
    }

    // the oscilloscope trace
    ctx.globalCompositeOperation = "source-over";
    const w = f.wave;
    const step = this.step;
    if (f.ghostAlpha > 0.01) {
      ctx.strokeStyle = rgba(f.ghostInk, f.ghostAlpha);
      ctx.lineWidth = f.waveWidth + 1;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let x = -step; x <= W + step; x += step) {
        const y = waveY(x, w) + f.ghostDy;
        if (x === -step) ctx.moveTo(x + f.ghostDx, y);
        else ctx.lineTo(x + f.ghostDx, y);
      }
      ctx.stroke();
    }
    if (f.waveAlpha > 0.01) {
      ctx.strokeStyle = rgba(RISO.ink, f.waveAlpha);
      ctx.lineWidth = f.waveWidth;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let x = -step; x <= W + step; x += step) {
        const y = waveY(x, w);
        if (x === -step) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}
