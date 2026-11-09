/**
 * Halftone floods, Canvas 2D (the spec swaps the concept's shader for this).
 *
 * The room is a hex grid of halftone cells. Each stamp impact sends a ring out
 * from its point: shapes swell to a solid band at the wavefront, then settle
 * to a printed tint of that startup's shape and ink (stars → bows → arrows).
 * A cell always shows the newest flood that has reached it. Everything is a
 * pure function of progress, so floods un-print when you scroll back.
 * The canvas only redraws when a wavefront is actually moving.
 */
import { clamp, easeOutCubic, lerp, range } from "@/components/life/multiverse/ease";
import { alpha } from "@/components/life/multiverse/palette";

export type ShapeId = "dot" | "star" | "bow" | "arrow";

export type Flood = {
  x: number;
  y: number;
  /** Progress window of the wavefront. */
  a: number;
  b: number;
  shape: ShapeId;
  color: string;
  /** Misregistered second plate (riso), drawn under the wavefront only. */
  plate: string;
  /** Settled radius and wavefront radius, in grid pitches. */
  rest: number;
  peak: number;
  /** A ring that swells existing shapes without changing them. */
  transient?: boolean;
  /** Transient only: the radius it settles at, leaving a faint halo (0 = runs off-stage and fades). */
  halo?: number;
};

const TAU = Math.PI * 2;

function shapePath(id: ShapeId): Path2D {
  const p = new Path2D();
  if (id === "dot") {
    p.arc(0, 0, 1, 0, TAU);
  } else if (id === "star") {
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 1 : 0.43;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      if (i === 0) p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.closePath();
  } else if (id === "bow") {
    p.moveTo(-0.14, -0.08);
    p.lineTo(-0.95, -0.72);
    p.quadraticCurveTo(-1.08, 0, -0.95, 0.72);
    p.lineTo(-0.14, 0.08);
    p.closePath();
    p.moveTo(0.14, -0.08);
    p.lineTo(0.95, -0.72);
    p.quadraticCurveTo(1.08, 0, 0.95, 0.72);
    p.lineTo(0.14, 0.08);
    p.closePath();
    p.roundRect(-0.24, -0.3, 0.48, 0.6, 0.12);
  } else {
    p.moveTo(0, -1);
    p.lineTo(0.92, -0.04);
    p.lineTo(0.38, -0.04);
    p.lineTo(0.38, 0.98);
    p.lineTo(-0.38, 0.98);
    p.lineTo(-0.38, -0.04);
    p.lineTo(-0.92, -0.04);
    p.closePath();
  }
  return p;
}

function sprite(id: ShapeId, color: string, px = 64): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = px;
  const ctx = c.getContext("2d")!;
  ctx.translate(px / 2, px / 2);
  ctx.scale(px / 2 - 1, px / 2 - 1);
  ctx.fillStyle = color;
  ctx.fill(shapePath(id));
  return c;
}

export class Halftone {
  private ctx: CanvasRenderingContext2D | null;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private pitch = 24;
  private cells = new Float32Array(0);
  private dist: Float32Array[] = [];
  private rmax: number[] = [];
  private floods: Flood[] = [];
  private base: Flood | null = null;
  private sprites: HTMLCanvasElement[] = [];
  private plates: HTMLCanvasElement[] = [];
  private baseSprite: HTMLCanvasElement | null = null;
  private lastKey = "";

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d");
  }

  setup(w: number, h: number, pitch: number, dpr: number, floods: Flood[], base: Flood) {
    this.w = w;
    this.h = h;
    this.pitch = pitch;
    this.dpr = dpr;
    this.floods = floods;
    this.base = base;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    // hex grid, padded one cell beyond the edges
    const dy = pitch * 0.866;
    const cols = Math.ceil(w / pitch) + 2;
    const rows = Math.ceil(h / dy) + 2;
    const cells = new Float32Array(cols * rows * 2);
    let k = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells[k++] = (c - 0.5 + (r % 2) * 0.5) * pitch;
        cells[k++] = (r - 0.5) * dy;
      }
    }
    this.cells = cells;
    this.dist = floods.map((f) => {
      const d = new Float32Array(cells.length / 2);
      for (let i = 0; i < d.length; i++) d[i] = Math.hypot(cells[i * 2] - f.x, cells[i * 2 + 1] - f.y);
      return d;
    });
    // transient rings stop at `halo` (they stay as a faint ring); floods run past the farthest corner far
    // enough for every cell to settle to its resting tint
    this.rmax = floods.map((f) =>
      f.transient && f.halo
        ? f.halo
        : Math.max(Math.hypot(f.x, f.y), Math.hypot(w - f.x, f.y), Math.hypot(f.x, h - f.y), Math.hypot(w - f.x, h - f.y)) + pitch * 36,
    );
    this.sprites = floods.map((f) => sprite(f.shape, f.color));
    this.plates = floods.map((f) => sprite(f.shape, alpha(f.plate, 0.85)));
    this.baseSprite = sprite(base.shape, base.color);
    this.lastKey = "";
  }

  /** Wavefront radius of flood i at progress p (0 before, rmax after). */
  private radius(i: number, p: number) {
    const f = this.floods[i];
    return this.rmax[i] * easeOutCubic(range(p, f.a, f.b));
  }

  render(p: number) {
    const ctx = this.ctx;
    if (!ctx || !this.base || !this.baseSprite) return;
    // skip identical frames (no wavefront moving, same set of finished floods)
    const key = this.floods.map((f) => (p <= f.a ? "0" : p >= f.b ? "1" : p.toFixed(4))).join("|");
    if (key === this.lastKey) return;
    this.lastKey = key;

    const { pitch, cells, floods, dist } = this;
    const n = cells.length / 2;
    const R = floods.map((_, i) => this.radius(i, p));
    const fall = pitch * 5.5;
    const edge = pitch * 3;
    const plateOff = pitch * 0.16;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);

    const baseR = this.base.rest * pitch;
    for (let k = 0; k < n; k++) {
      const x = cells[k * 2];
      const y = cells[k * 2 + 1];

      // newest non-transient flood that reached this cell, plus one arriving
      let cur = -1;
      let curSize = 0;
      let arriving = -1;
      let arrive = 0;
      for (let i = floods.length - 1; i >= 0; i--) {
        const f = floods[i];
        if (f.transient || R[i] <= 0) continue;
        const behind = R[i] - dist[i][k];
        if (behind >= 0) {
          cur = i;
          curSize = f.rest + (f.peak - f.rest) * Math.exp(-behind / fall);
          break;
        }
        if (behind > -edge && arriving < 0) {
          arriving = i;
          arrive = 1 + behind / edge; // 0 → 1 as the front approaches
        }
      }

      // transient rings swell whatever is printed here
      let swell = 1;
      for (let i = 0; i < floods.length; i++) {
        const f = floods[i];
        if (!f.transient || R[i] <= 0) continue;
        const d = (R[i] - dist[i][k]) / (pitch * 2.2);
        const t = range(p, f.a, f.b);
        const amp = f.halo ? lerp(1.5, 0.75, t) : 1.25 * (1 - t);
        swell += amp * Math.exp(-d * d);
      }

      // the shape currently printed in this cell
      if (cur >= 0) {
        let r = curSize * pitch * swell;
        if (arriving >= 0) r *= 1 - arrive * 0.85;
        if (r > 0.4) this.draw(cur, x, y, r, curSize > floods[cur].rest * 1.35, plateOff);
      } else {
        let r = baseR * swell;
        if (arriving >= 0) r *= 1 - arrive;
        if (r > 0.3) ctx.drawImage(this.baseSprite, x - r, y - r, r * 2, r * 2);
      }

      // tiny dots of the incoming ink just ahead of its wavefront
      if (arriving >= 0) {
        const f = floods[arriving];
        const r = f.peak * 0.7 * clamp(arrive) * arrive * pitch;
        if (r > 0.4) this.draw(arriving, x, y, r, false, plateOff);
      }
    }
  }

  private draw(i: number, x: number, y: number, r: number, plate: boolean, off: number) {
    const ctx = this.ctx!;
    if (plate) ctx.drawImage(this.plates[i], x - r + off, y - r + off * 0.7, r * 2, r * 2);
    ctx.drawImage(this.sprites[i], x - r, y - r, r * 2, r * 2);
  }
}
