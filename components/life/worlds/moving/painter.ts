/**
 * Repotted — the two Canvas 2D layers.
 *
 *  back:  atmosphere glow, drifting specks, rain (home 03), the root-grown headline
 *  main:  soil strata, glowing roots, falling soil, the voxel exit
 *
 * Everything is a function of progress (plus ambient time), so scrubbing back
 * and forth is exact. Per frame: one pass over the grown roots, bucketed into a
 * few Path2D strokes by width and alpha.
 */

import { bell, clamp, easeInOutCubic, easeOutCubic, hash, lerp, range, smoothstep } from "@/components/life/multiverse/ease";
import { POTS, apexArc, bboxOf, islandCells, ISLAND_BODY, ISLAND_CANOPY, ISLAND_TRUNK, pointAtArc, pointInPolygon, polyPath, rng, type Pt } from "./geometry";
import { grownEnd, type Grit, type RootData } from "./roots";
import { BEAT, growFrac, ringWindow, type Cam, type Layout, type Scene } from "./timeline";
import { DIRT, GRASS, HOME_INK, PAPER, RISO, SKY, SOIL, SOIL_LIGHT, TRUNK, alpha, mix } from "./colors";
import type { HeadRoots } from "./headRoots";

const W_LEVELS = [0.7, 1.05, 1.5, 2.2, 3.2, 4.6, 6.4];
const A_LEVELS = [0.2, 0.36, 0.55, 0.78];

type Cube = { x: number; y: number; c: string; ring: number };
type Slot = { x: number; y: number; size: number; c: string; part: string; cube: number; t0: number };

export type PaintInput = {
  scene: Scene;
  t: number;
  /** Per-ring isolation weights (1 = normal). */
  ringFocus: number[];
  plantCells: { x: number; y: number; c: string }[] | null;
};

export class Painter {
  W = 0;
  H = 0;
  dpr = 1;
  lowPower: boolean;
  main: CanvasRenderingContext2D;
  back: CanvasRenderingContext2D;
  roots: RootData | null = null;
  grit: Grit | null = null;
  head: HeadRoots | null = null;
  layout: Layout | null = null;

  private innerPaths = POTS.map((p) => new Path2D(polyPath(p.inner)));
  private halfPaths: [Path2D, Path2D][];
  private sprite: HTMLCanvasElement;
  private buckets: Path2D[] = [];
  private bucketUsed: boolean[] = [];
  private seeds: Float32Array;
  private heroSoil: Float32Array;
  private specks: Float32Array;
  private rain: Float32Array;
  private voxels: { cubes: Cube[]; slots: Slot[]; falls: { cube: number; t0: number; vx: number }[]; key: string } | null = null;
  private islandPath: Path2D | null = null;

  constructor(main: CanvasRenderingContext2D, back: CanvasRenderingContext2D, lowPower: boolean) {
    this.main = main;
    this.back = back;
    this.lowPower = lowPower;
    this.halfPaths = POTS.map((pot) => {
      const P = pot.perimeter;
      const a0 = apexArc(pot);
      const mk = (dir: 1 | -1) => {
        const path = new Path2D();
        const n = 160;
        for (let i = 0; i <= n; i++) {
          const [x, y] = pointAtArc(pot.inner, a0 + (dir * P * 0.5 * i) / n, P);
          if (i === 0) path.moveTo(x, y);
          else path.lineTo(x, y);
        }
        return path;
      };
      return [mk(1), mk(-1)];
    });

    // soft additive dot for live root tips
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, alpha(PAPER, 1));
    grad.addColorStop(0.18, alpha(mix(PAPER, RISO.sun, 0.35), 0.75));
    grad.addColorStop(0.5, alpha(RISO.sun, 0.16));
    grad.addColorStop(1, alpha(RISO.sun, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    this.sprite = c;

    const R = rng(0xd1);
    // falling-soil seeds: 4 cascades + 4 pours, each particle = 6 randoms
    const per = lowPower ? 42 : 110;
    this.seeds = new Float32Array(8 * per * 6);
    for (let i = 0; i < this.seeds.length; i++) this.seeds[i] = R();
    // soil that crumbles off the final root ball: points inside pot 05
    const nHero = lowPower ? 90 : 260;
    this.heroSoil = new Float32Array(nHero * 5);
    const pot = POTS[4];
    const [x0, y0, x1, y1] = bboxOf(pot.inner);
    for (let i = 0; i < nHero; ) {
      const x = x0 + R() * (x1 - x0);
      const y = y0 + R() * (y1 - y0);
      if (!pointInPolygon(x, y, pot.inner)) continue;
      this.heroSoil.set([x, y, R(), R(), R()], i * 5);
      i++;
    }
    const nSpecks = lowPower ? 26 : 64;
    this.specks = new Float32Array(nSpecks * 5);
    for (let i = 0; i < this.specks.length; i++) this.specks[i] = R();
    const nRain = lowPower ? 34 : 80;
    this.rain = new Float32Array(nRain * 3);
    for (let i = 0; i < this.rain.length; i++) this.rain[i] = R();

    for (let i = 0; i < W_LEVELS.length * A_LEVELS.length; i++) {
      this.buckets.push(new Path2D());
      this.bucketUsed.push(false);
    }
  }

  resize(W: number, H: number, dpr: number, layout: Layout) {
    this.W = W;
    this.H = H;
    this.dpr = dpr;
    this.layout = layout;
    for (const ctx of [this.main, this.back]) {
      ctx.canvas.width = Math.round(W * dpr);
      ctx.canvas.height = Math.round(H * dpr);
    }
    this.voxels = null;
    const { x, y, size } = layout.island;
    const k = size / 100;
    const path = new Path2D();
    path.addPath(new Path2D(polyPath(ISLAND_BODY)), new DOMMatrix([k, 0, 0, k, x, y]));
    const [tx, ty, tw, th] = ISLAND_TRUNK;
    const [cx, cy, cw, chh] = ISLAND_CANOPY;
    path.rect(x + tx * k, y + ty * k, tw * k, th * k);
    path.rect(x + cx * k, y + cy * k, cw * k, chh * k);
    this.islandPath = path;
  }

  /* ---------------------------------------------------------- transforms */

  private setPlant(ctx: CanvasRenderingContext2D, s: Scene) {
    const { S, wx, wy, fx, fy } = s.cam;
    const { tx, ty, rot, ox, oy } = s.plant;
    const c = Math.cos(rot);
    const n = Math.sin(rot);
    const d = this.dpr;
    ctx.setTransform(d * S * c, d * S * n, -d * S * n, d * S * c, d * (S * (-c * ox + n * oy + ox + tx - wx) + fx), d * (S * (-n * ox - c * oy + oy + ty - wy) + fy));
  }

  private setCam(ctx: CanvasRenderingContext2D, cam: Cam) {
    const d = this.dpr;
    ctx.setTransform(d * cam.S, 0, 0, d * cam.S, d * (cam.fx - cam.wx * cam.S), d * (cam.fy - cam.wy * cam.S));
  }

  /** Plant-space point → screen px (with the plant's sway). */
  plantToScreen(s: Scene, x: number, y: number): [number, number] {
    const { tx, ty, rot, ox, oy } = s.plant;
    const c = Math.cos(rot);
    const n = Math.sin(rot);
    const wx = c * (x - ox) - n * (y - oy) + ox + tx;
    const wy = n * (x - ox) + c * (y - oy) + oy + ty;
    return [(wx - s.cam.wx) * s.cam.S + s.cam.fx, (wy - s.cam.wy) * s.cam.S + s.cam.fy];
  }

  /* ----------------------------------------------------------------- back */

  paintBack(s: Scene, t: number) {
    const ctx = this.back;
    const { W, H, dpr } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const p = s.p;

    // atmosphere: a soft glow behind the plant, tinted per home
    const [gx, gy] = this.plantToScreen(s, 0, POTS[Math.max(0, s.soilOuter)].top * 0.3);
    let col = SKY[0] as string;
    let strength = 0.075;
    const homeT = [0, 0.252, 0.394, 0.558, 0.647];
    for (let k = 1; k < 5; k++) col = mix(col, SKY[k], smoothstep(range(p, homeT[k] - 0.05, homeT[k])));
    col = mix(col, RISO.sun, smoothstep(range(p, 0.75, 0.82)) * 0.55);
    col = mix(col, RISO.pink, smoothstep(range(p, 0.93, 1)));
    strength += 0.035 * bell(p, 0.77, 0.83, 0.9, 0.95) + 0.05 * smoothstep(range(p, 0.95, 1));
    const r = Math.max(W, H) * (this.layout?.mobile ? 0.7 : 0.5);
    const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    grad.addColorStop(0, alpha(col, strength));
    grad.addColorStop(0.45, alpha(col, strength * 0.35));
    grad.addColorStop(1, alpha(col, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // drifting specks of soil and perlite
    const sp = this.specks;
    const drift = s.cam.S * 0.0;
    for (let i = 0; i < sp.length; i += 5) {
      const x = ((sp[i] * W + t * (sp[i + 2] - 0.5) * 6 + drift) % W + W) % W;
      const y = ((sp[i + 1] * H - t * (4 + sp[i + 3] * 9)) % H + H) % H;
      const a = 0.05 + 0.13 * (0.5 + 0.5 * Math.sin(t * (0.6 + sp[i + 4]) + i));
      const z = 0.8 + sp[i + 3] * 1.8;
      ctx.fillStyle = alpha(sp[i + 4] > 0.6 ? RISO.sun : PAPER, a);
      ctx.fillRect(x, y, z, z);
    }

    // rain while in home 03
    const rain = bell(p, 0.392, 0.41, 0.468, 0.49);
    if (rain > 0) {
      ctx.strokeStyle = alpha(mix(PAPER, RISO.cobalt, 0.4), 0.22 * rain);
      ctx.lineWidth = 1;
      ctx.beginPath();
      const rn = this.rain;
      for (let i = 0; i < rn.length; i += 3) {
        const v = 520 + rn[i + 2] * 380;
        const y = ((rn[i + 1] * (H + 80) + t * v) % (H + 80)) - 40;
        const x = ((rn[i] * (W + 200) - t * v * 0.18) % (W + 200) + W + 200) % (W + 200) - 100;
        const len = 10 + rn[i + 2] * 16;
        ctx.moveTo(x, y);
        ctx.lineTo(x - len * 0.18, y + len);
      }
      ctx.stroke();
    }

    // the root-grown headline
    if (this.head) this.paintHead(ctx, p, t);
  }

  private paintHead(ctx: CanvasRenderingContext2D, p: number, t: number) {
    const h = this.head!;
    const g = range(p, BEAT.headRoots[0], BEAT.headRoots[1]);
    const fade = 1 - range(p, BEAT.headFill[0] + 0.02, BEAT.headFill[1] + 0.02);
    if (g <= 0 || fade <= 0) return;
    ctx.lineCap = "round";
    // two passes: soft glow then bright core
    const end = h.end(g);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = alpha(RISO.sun, 0.12 * fade);
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    for (let i = 0; i < end; i++) {
      const par = h.parent[i];
      if (par < 0) continue;
      if (g - h.birth[i] > 0.12) continue;
      ctx.moveTo(h.x[par], h.y[par]);
      ctx.lineTo(h.x[i], h.y[i]);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = alpha(PAPER, 0.8 * fade);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i < end; i++) {
      const par = h.parent[i];
      if (par < 0) continue;
      ctx.moveTo(h.x[par], h.y[par]);
      ctx.lineTo(h.x[i], h.y[i]);
    }
    ctx.stroke();
    // live tips
    ctx.globalCompositeOperation = "lighter";
    let tips = 0;
    for (let i = end - 1; i >= 0 && tips < 90; i--) {
      const age = g - h.birth[i];
      if (age > 0.05) continue;
      const a = (1 - age / 0.05) * fade * (0.75 + 0.25 * Math.sin(t * 3 + i));
      ctx.globalAlpha = a;
      ctx.drawImage(this.sprite, h.x[i] - 7, h.y[i] - 7, 14, 14);
      tips++;
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  /* ----------------------------------------------------------------- main */

  paintMain(inp: PaintInput) {
    const { scene: s, t } = inp;
    const ctx = this.main;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const p = s.p;
    const voxelOut = 1 - range(p, BEAT.voxel[0] + 0.004, BEAT.voxel[1]);

    if (voxelOut > 0) {
      this.setPlant(ctx, s);
      this.paintSoil(ctx, s);
      this.paintRoots(ctx, s, t, inp.ringFocus, voxelOut);
    }
    this.setCam(ctx, s.cam);
    this.paintFalls(ctx, s);
    if (p >= BEAT.voxel[0] - 0.002) this.paintVoxels(ctx, s, inp.plantCells);
  }

  private paintSoil(ctx: CanvasRenderingContext2D, s: Scene) {
    if (s.soilAlpha <= 0.001) return;
    const g = this.grit;
    const S = s.cam.S;
    ctx.globalAlpha = s.soilAlpha;
    for (let k = s.soilOuter; k >= 0; k--) {
      const clip = k === s.soilOuter && s.soilLevel > -Infinity;
      if (clip) {
        ctx.save();
        const pot = POTS[k];
        ctx.beginPath();
        ctx.rect(-pot.hw - 1, s.soilLevel, pot.hw * 2 + 2, pot.bottom - s.soilLevel + 1);
        ctx.clip();
      }
      ctx.fillStyle = SOIL[k];
      ctx.fill(this.innerPaths[k]);
      if (g) {
        const z = 1.7 / S;
        for (let i = 0; i < g.n; i++) {
          if (g.region[i] !== k) continue;
          ctx.fillStyle = g.kind[i] ? alpha(PAPER, 0.26) : alpha(SOIL_LIGHT, 0.85);
          ctx.fillRect(g.x[i] - z / 2, g.y[i] - z / 2, z * (g.kind[i] ? 1 : 1.6), z);
        }
      }
      if (clip) {
        ctx.restore();
        // a thin lip of loose soil on the rising surface
        const pot = POTS[k];
        ctx.save();
        ctx.clip(this.innerPaths[k]);
        ctx.fillStyle = alpha(SOIL_LIGHT, 0.9);
        ctx.fillRect(-pot.hw - 1, s.soilLevel - 1.5 / S, pot.hw * 2 + 2, 2.4 / S);
        ctx.restore();
      }
    }
    // inner shadow at the very edge of the ball (cutaway depth)
    ctx.globalAlpha = s.soilAlpha;
    ctx.lineWidth = 3 / S;
    ctx.strokeStyle = alpha(RISO.ink, 0.45);
    ctx.stroke(this.innerPaths[s.soilOuter]);
    ctx.globalAlpha = 1;
  }

  private paintRoots(ctx: CanvasRenderingContext2D, s: Scene, t: number, focus: number[], fadeOut: number) {
    const d = this.roots;
    if (!d) return;
    const p = s.p;
    const S = s.cam.S;
    let cur = 0;
    for (let k = 1; k < 5; k++) if (p >= BEAT.grow[k][0]) cur = k;
    const gCur = growFrac(p, cur);

    const heroDim = smoothstep(range(p, BEAT.soilOff[0], BEAT.soilOff[1]));
    const lit = HOME_INK.map((_, k) => easeInOutCubic(range(p, ...ringWindow(k))));
    const anyLit = lit.some((v) => v > 0);

    for (let i = 0; i < this.buckets.length; i++) {
      this.buckets[i] = new Path2D();
      this.bucketUsed[i] = false;
    }
    const ringPaths = anyLit ? HOME_INK.map(() => new Path2D()) : null;
    const glow = new Path2D();
    let glowUsed = false;
    const tipIdx: number[] = [];

    const radPrev = cur > 0 ? d.rad[cur - 1] : null;
    const radCur = d.rad[cur];
    const nW = W_LEVELS.length;

    for (let k = 0; k <= cur; k++) {
      const gk = k < cur ? 1 : gCur;
      const end = grownEnd(d, k, k === 0 && cur === 0 ? Math.max(gk, 0) : gk);
      const g0 = BEAT.grow[k][0];
      const gl = BEAT.grow[k][1] - g0;
      const ringLit = lit[k];
      const ringF = focus[k];
      for (let i = d.start[k]; i < end; i++) {
        const par = d.parent[i];
        if (par < 0) continue;
        const age = p - (g0 + d.birth[i] * gl);
        let r: number;
        if (k < cur && radPrev) r = lerp(radPrev[i], radCur[i], gCur);
        else r = radCur[i] * (0.45 + 0.55 * clamp(age / 0.05));
        let wpx = Math.max(0.7, 2 * r * S);
        if (age < 0.012) wpx *= 0.55 + 0.45 * (age / 0.012);
        if (ringPaths && d.wall[i] && d.ring[i] <= ringLit * 1.04 && ringLit > 0) {
          ringPaths[k].moveTo(d.x[par], d.y[par]);
          ringPaths[k].lineTo(d.x[i], d.y[i]);
          continue;
        }
        let a = 0.92 - 0.5 * clamp(age / 0.16);
        a *= 1 - heroDim * (0.82 - 0.5 * clamp((wpx - 0.8) / 3));
        if (anyLit) a *= lerp(1, Math.min(1, ringF), 0.85);
        let wi = 0;
        while (wi < nW - 1 && wpx > (W_LEVELS[wi] + W_LEVELS[wi + 1]) / 2) wi++;
        let ai = 0;
        while (ai < A_LEVELS.length - 1 && a > (A_LEVELS[ai] + A_LEVELS[ai + 1]) / 2) ai++;
        const b = ai * nW + wi;
        this.buckets[b].moveTo(d.x[par], d.y[par]);
        this.buckets[b].lineTo(d.x[i], d.y[i]);
        this.bucketUsed[b] = true;
        if (age < 0.018 && age >= 0) {
          glow.moveTo(d.x[par], d.y[par]);
          glow.lineTo(d.x[i], d.y[i]);
          glowUsed = true;
          if (age < 0.008 && tipIdx.length < 120) tipIdx.push(i);
        }
      }
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // heartwood first, live roots on top
    for (let ai = 0; ai < A_LEVELS.length; ai++) {
      for (let wi = 0; wi < nW; wi++) {
        const b = ai * nW + wi;
        if (!this.bucketUsed[b]) continue;
        ctx.lineWidth = W_LEVELS[wi] / S;
        ctx.strokeStyle = alpha(PAPER, A_LEVELS[ai] * fadeOut);
        ctx.stroke(this.buckets[b]);
      }
    }
    if (glowUsed) {
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 5 / S;
      ctx.strokeStyle = alpha(RISO.sun, 0.075 * fadeOut);
      ctx.stroke(glow);
      ctx.globalCompositeOperation = "source-over";
    }

    // the rings: roots that ran round each pot's walls light up in its glaze
    if (ringPaths) {
      for (let k = 0; k < 5; k++) {
        if (lit[k] <= 0) continue;
        const f = Math.min(1, focus[k]) * fadeOut;
        const col = HOME_INK[k];
        const P = POTS[k].perimeter;
        // a clean traced line so the house reads, under the roots
        ctx.setLineDash([lit[k] * P * 0.5 + 0.001, P]);
        ctx.lineWidth = 7 / S;
        ctx.strokeStyle = alpha(col, 0.16 * f);
        ctx.stroke(this.halfPaths[k][0]);
        ctx.stroke(this.halfPaths[k][1]);
        ctx.lineWidth = 1.6 / S;
        ctx.strokeStyle = alpha(col, 0.78 * f);
        ctx.stroke(this.halfPaths[k][0]);
        ctx.stroke(this.halfPaths[k][1]);
        ctx.setLineDash([]);
        ctx.globalCompositeOperation = "lighter";
        ctx.lineWidth = 6 / S;
        ctx.strokeStyle = alpha(col, 0.22 * f);
        ctx.stroke(ringPaths[k]);
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = 2.3 / S;
        ctx.strokeStyle = alpha(col, 0.95 * f);
        ctx.stroke(ringPaths[k]);
      }
    }

    // live tips breathe
    if (tipIdx.length) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "lighter";
      const dpr = this.dpr;
      for (let j = 0; j < tipIdx.length; j++) {
        const i = tipIdx[j];
        const [x, y] = this.plantToScreen(s, d.x[i], d.y[i]);
        const age = p - (BEAT.grow[d.home[i]][0] + d.birth[i] * (BEAT.grow[d.home[i]][1] - BEAT.grow[d.home[i]][0]));
        ctx.globalAlpha = clamp(1 - age / 0.008) * (0.7 + 0.3 * Math.sin(t * 2.4 + i)) * fadeOut;
        const z = 15 * dpr;
        ctx.drawImage(this.sprite, x * dpr - z / 2, y * dpr - z / 2, z, z);
      }
      ctx.restore();
    }
  }

  /* -------------------------------------------------------- falling soil */

  private paintFalls(ctx: CanvasRenderingContext2D, s: Scene) {
    const p = s.p;
    const S = s.cam.S;
    const per = this.lowPower ? 42 : 110;
    const sd = this.seeds;
    const z = 1 / S;
    // cascades off each hanging ball, plus a few snapped root tips
    for (let k = 0; k < 4; k++) {
      const L = BEAT.leave[k];
      const A = BEAT.arrive[k + 1]!;
      if (p < L[0] || p > A[1] + 0.06) continue;
      const pot = POTS[k];
      const P = pot.perimeter;
      const a0 = apexArc(pot);
      const base = k * per * 6;
      ctx.fillStyle = alpha(SOIL_LIGHT, 0.95);
      for (let j = 0; j < per; j++) {
        const o = base + j * 6;
        const ps = L[0] + 0.006 + sd[o] * (A[1] - L[0]) * 0.8;
        const tau = (p - ps) * 30;
        if (tau <= 0 || tau > 2.2) continue;
        const [x0, y0] = pointAtArc(pot.inner, a0 + P * (0.18 + sd[o + 1] * 0.64), P);
        const x = x0 + s.plant.tx + (sd[o + 2] - 0.5) * 0.3 * tau;
        const y = y0 + s.plant.ty + 1.8 * tau * tau;
        const sz = (1.2 + sd[o + 3] * 2.4) * z;
        ctx.globalAlpha = 1 - range(tau, 1.2, 2.2);
        ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
      // snapped root tips spin away
      ctx.strokeStyle = alpha(PAPER, 0.7);
      ctx.lineWidth = 1.1 * z;
      ctx.lineCap = "round";
      for (let j = 0; j < 6; j++) {
        const o = base + j * 6;
        const ps = L[0] + 0.012 + sd[o + 4] * 0.02;
        const tau = (p - ps) * 26;
        if (tau <= 0 || tau > 2) continue;
        const [x0, y0] = pointAtArc(pot.inner, a0 + P * (0.15 + sd[o + 5] * 0.7), P);
        const out = x0 >= 0 ? 1 : -1;
        const x = x0 + out * 0.25 * tau;
        const y = y0 + s.plant.ty + 1.5 * tau * tau - 0.1 * tau;
        const ang = tau * (4 + sd[o] * 6) * out;
        const len = 0.05 + sd[o + 2] * 0.05;
        ctx.globalAlpha = 1 - range(tau, 1, 2);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(ang) * len * 0.6, y + Math.sin(ang) * len * 0.2, x + Math.cos(ang + 0.6) * len, y + Math.sin(ang + 0.6) * len);
        ctx.stroke();
      }
    }
    // pours: two streams either side of the old ball
    for (let k = 1; k < 5; k++) {
      const w = BEAT.pour[k]!;
      if (p < w[0] - 0.01 || p > w[1] + 0.01) continue;
      const pot = POTS[k];
      const prev = POTS[k - 1];
      const base = (4 + k - 1) * per * 6;
      const topY = pot.peak - 0.55 - 0.12 * k;
      const fall = pot.bottom - topY;
      ctx.fillStyle = alpha(SOIL_LIGHT, 0.95);
      const level = s.soilLevel > -Infinity ? s.soilLevel : pot.peak;
      for (let j = 0; j < per; j++) {
        const o = base + j * 6;
        // each grain loops down the stream; streams thin out as the pour ends
        const ph = (sd[o] + (p - w[0]) * 34) % 1;
        const life = range(p, w[0] - 0.004, w[0] + 0.006) * (1 - range(p, w[1] - 0.008, w[1]));
        if (life <= 0 || sd[o + 3] > life) continue;
        const side = sd[o + 1] < 0.5 ? -1 : 1;
        const gx = side * (prev.hw + (pot.hw - prev.hw) * 0.5) + (sd[o + 2] - 0.5) * (pot.hw - prev.hw) * 0.35;
        const y = topY + ph * ph * fall;
        if (y > level) continue;
        const x = gx + (sd[o + 4] - 0.5) * 0.07 * (0.3 + ph);
        const sz = (1.6 + sd[o + 5] * 2.6) * z;
        ctx.globalAlpha = 0.95 * smoothstep(range(ph, 0, 0.12));
        ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz * (1.2 + ph * 1.6));
        // a second grain, slightly behind, so the stream reads as a pour
        ctx.globalAlpha *= 0.7;
        ctx.fillRect(x + (sd[o + 2] - 0.5) * 0.04 - sz / 2, y - 0.05 - sz / 2, sz * 0.8, sz * (1 + ph));
      }
    }
    // the final ball sheds its soil
    if (p >= BEAT.soilOff[0] - 0.01 && p <= BEAT.soilOff[1] + 0.08) {
      const hs = this.heroSoil;
      const n = hs.length / 5;
      ctx.fillStyle = alpha(SOIL_LIGHT, 0.95);
      for (let j = 0; j < n; j++) {
        const o = j * 5;
        const ps = BEAT.soilOff[0] + hs[o + 2] * (BEAT.soilOff[1] - BEAT.soilOff[0]) * 0.85;
        const tau = (p - ps) * 24;
        if (tau <= 0 || tau > 2.4) continue;
        const x = hs[o] + s.plant.tx + (hs[o + 3] - 0.5) * 0.4 * tau;
        const y = hs[o + 1] + s.plant.ty + 2.2 * tau * tau;
        const sz = (1.2 + hs[o + 4] * 2.6) * z;
        ctx.globalAlpha = 1 - range(tau, 1.2, 2.4);
        ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------- voxels */

  private buildVoxels(s: Scene, plantCells: { x: number; y: number; c: string }[] | null) {
    const L = this.layout!;
    const block = L.mobile ? 11 : 15;
    const key = `${this.W}x${this.H}`;
    const cells = new Map<string, Cube>();
    const put = (x: number, y: number, c: string, ring: number) => {
      const gx = Math.floor(x / block);
      const gy = Math.floor(y / block);
      const id = `${gx},${gy}`;
      const prev = cells.get(id);
      if (!prev || ring > prev.ring) cells.set(id, { x: gx * block + block / 2, y: gy * block + block / 2, c, ring });
    };
    for (let k = 0; k < 5; k++) {
      const pot = POTS[k];
      const P = pot.perimeter;
      const n = Math.ceil((P * s.cam.S) / (block * 0.45));
      for (let i = 0; i < n; i++) {
        const [x, y] = pointAtArc(pot.inner, (i / n) * P, P);
        const [sx, sy] = this.plantToScreen(s, x, y);
        put(sx, sy, HOME_INK[k], k);
      }
    }
    if (plantCells) for (const c of plantCells) put(c.x, c.y, c.c, 9);
    const cubes = [...cells.values()];

    // island slots
    const { x: ix, y: iy, size } = L.island;
    const g = 4;
    const k = size / 100;
    const R = rng(0x15);
    const slots: Slot[] = islandCells(g).map((c) => {
      let col: string;
      const r = R();
      if (c.part === "leaf") col = r < 0.5 ? GRASS[0] : GRASS[1];
      else if (c.part === "grass") col = r < 0.6 ? GRASS[0] : GRASS[1];
      else if (c.part === "trunk") col = TRUNK;
      else col = DIRT[Math.min(DIRT.length - 1, Math.floor(((c.y - 34) / 56) * 3 + r * 1.2))];
      return { x: ix + (c.x + g / 2) * k, y: iy + (c.y + g / 2) * k, size: g * k, c: col, part: c.part, cube: -1, t0: 0 };
    });
    // rank-map: top cubes → top slots, left → left
    const order = (a: { x: number; y: number }, b: { x: number; y: number }) => a.y - b.y || a.x - b.x;
    const cubeOrder = cubes.map((_, i) => i).sort((a, b) => order(cubes[a], cubes[b]));
    const slotOrder = slots.map((_, i) => i).sort((a, b) => order(slots[a], slots[b]));
    const used = new Uint8Array(cubes.length);
    const nS = slots.length;
    const nC = cubes.length;
    slotOrder.forEach((si, rank) => {
      // nearest unused cube within a window around the proportional rank
      const centre = Math.round((rank / Math.max(1, nS - 1)) * (nC - 1));
      let bi = -1;
      let bd = Infinity;
      for (let w = Math.max(0, centre - 40); w <= Math.min(nC - 1, centre + 40); w++) {
        const ci = cubeOrder[w];
        if (used[ci]) continue;
        const dx = cubes[ci].x - slots[si].x;
        const dy = cubes[ci].y - slots[si].y;
        const dd = dx * dx * 1.6 + dy * dy + Math.abs(w - centre) * 30;
        if (dd < bd) {
          bd = dd;
          bi = ci;
        }
      }
      if (bi < 0) {
        for (let w = 0; w < nC; w++) if (!used[cubeOrder[w]]) {
          bi = cubeOrder[w];
          break;
        }
      }
      if (bi >= 0) used[bi] = 1;
      slots[si].cube = bi;
    });
    // build bottom-up
    const span = BEAT.fly[1] - BEAT.fly[0] - FLIGHT;
    const ys = slots.map((s2) => s2.y);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    for (const sl of slots) {
      const up = 1 - (sl.y - yMin) / Math.max(1, yMax - yMin);
      sl.t0 = BEAT.fly[0] + span * (up * 0.82 + R() * 0.18);
    }
    const falls: { cube: number; t0: number; vx: number }[] = [];
    for (let i = 0; i < nC; i++) if (!used[i]) falls.push({ cube: i, t0: BEAT.voxel[1] - 0.012 + R() * 0.016, vx: (R() - 0.5) * 50 });
    this.voxels = { cubes, slots, falls, key };
  }

  private paintVoxels(ctx: CanvasRenderingContext2D, s: Scene, plantCells: { x: number; y: number; c: string }[] | null) {
    const p = s.p;
    if (!this.voxels || this.voxels.key !== `${this.W}x${this.H}`) this.buildVoxels(s, plantCells);
    const V = this.voxels!;
    const L = this.layout!;
    const block = L.mobile ? 11 : 15;
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const appear = range(p, BEAT.voxel[0], BEAT.voxel[1]);

    const cube = (x: number, y: number, size: number, col: string, a: number, tone = 0) => {
      if (a <= 0.002 || size <= 0.3) return;
      ctx.globalAlpha = a;
      const h = size / 2;
      ctx.fillStyle = col;
      ctx.fillRect(x - h, y - h, size, size);
      if (tone) {
        ctx.fillStyle = tone > 0 ? alpha(PAPER, tone) : alpha(RISO.ink, -tone);
        ctx.fillRect(x - h, y - h, size, size);
      }
      const e = Math.max(1, size * 0.16);
      ctx.fillStyle = alpha(PAPER, 0.16);
      ctx.fillRect(x - h, y - h, size - e, e);
      ctx.fillStyle = alpha(RISO.ink, 0.24);
      ctx.fillRect(x + h - e, y - h, e, size);
      ctx.fillRect(x - h, y + h - e, size - e, e);
    };

    // final island fill (exact silhouette) once most blocks have landed
    const settle = smoothstep(range(p, BEAT.fly[1] - 0.016, BEAT.fly[1]));
    if (settle > 0 && this.islandPath) {
      ctx.globalAlpha = settle;
      ctx.fillStyle = DIRT[2];
      ctx.fill(this.islandPath);
    }

    // cubes that leave: drop into the dark
    for (const f of V.falls) {
      const c = V.cubes[f.cube];
      const born = clamp((appear - hashAppear(f.cube)) / 0.35);
      if (p < f.t0) {
        cube(c.x, c.y, block * easeOutCubic(born), c.c, born);
        continue;
      }
      const tau = (p - f.t0) * 30;
      const y = c.y + 160 * tau * tau;
      const x = c.x + f.vx * tau;
      if (y > this.H + 40) continue;
      cube(x, y, block * (1 - 0.3 * clamp(tau)), c.c, 1 - range(tau, 0.6, 1.4));
    }

    // cubes that build the island
    ctx.save();
    for (const sl of V.slots) {
      if (sl.cube < 0) continue;
      const c = V.cubes[sl.cube];
      const u = range(p, sl.t0, sl.t0 + FLIGHT);
      if (u <= 0) {
        const born = clamp((appear - hashAppear(sl.cube)) / 0.35);
        cube(c.x, c.y, block * easeOutCubic(born), c.c, born);
        continue;
      }
      const e = easeInOutCubic(u);
      const mx = (c.x + sl.x) / 2;
      const my = Math.min(c.y, sl.y) - Math.abs(c.x - sl.x) * 0.18 - 30;
      const x = (1 - e) * (1 - e) * c.x + 2 * (1 - e) * e * mx + e * e * sl.x;
      const y = (1 - e) * (1 - e) * c.y + 2 * (1 - e) * e * my + e * e * sl.y;
      const col = u < 1 ? mix(c.c, sl.c, smoothstep(range(u, 0.3, 1))) : sl.c;
      const size = lerp(block, sl.size + 0.6, e);
      const tone = (hash(sl.x * 0.37 + sl.y * 1.13) - 0.5) * 0.16 * e;
      if (u >= 1 && this.islandPath) {
        ctx.save();
        ctx.clip(this.islandPath);
        cube(x, y, size, col, 1, tone);
        ctx.restore();
      } else cube(x, y, size, col, 1, tone);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

/** How long one block takes to fly to its slot (progress). */
const FLIGHT = 0.03;

/** Stagger for the cubes popping into place along the rings. */
function hashAppear(i: number) {
  return hash(i * 3.17) * 0.6;
}

export type { Pt };
