/**
 * The CPU half of the world: the post (what every eye watches), the eight
 * saccading gaze targets, the blink-wave origin and the followers.
 *
 * Progress decides *where in the story* everything is (fully reversible);
 * time only adds life on top: saccades, idle blinks, the swarm's springs.
 * Renderers (WebGL or the 2D fallback) read `field` and `fol` every frame.
 */

import { bell, clamp, easeInOutCubic, easeOutCubic, lerp, range } from "@/components/life/multiverse/ease";
import { ROW, WAVE, fieldAt, parkAt, type FieldFrame, type Layout } from "./timeline";
import { rng, sampleGavel } from "./gavel";

export type FieldUniforms = {
  S: number;
  R: number;
  cx: number;
  cy: number;
  minCell: number;
  centerScale: number;
  centerOpen: number;
  lookViewer: number;
  idle: number;
  pulse: number;
  waveX: number;
  waveY: number;
  waveR: number;
  heartR: number;
  postX: number;
  postY: number;
  clearA: [number, number, number, number];
  clearB: [number, number, number, number];
  clearAmtA: number;
  clearAmtB: number;
  time: number;
  gaze: Float32Array;
};

export type Followers = {
  n: number;
  /** instances worth drawing this frame (0 = skip the draw) */
  live: number;
  pos: Float32Array;
  size: Float32Array;
  open: Float32Array;
  gaze: Float32Array;
  spark: Float32Array;
  heart: Float32Array;
  seed: Float32Array;
  version: number;
};

const TRAIL = 128;
const GAZE_N = 8;

export type PointerSample = { x: number; y: number; live: boolean };

export class SocialSim {
  L: Layout;
  p = 0;
  frame: FieldFrame;
  field: FieldUniforms;
  fol: Followers;

  private home: Float32Array;
  private sp: Float32Array;
  private sv: Float32Array;
  private lifted: Uint8Array;
  private u: Float32Array; // 8 randoms per follower
  private target: Float32Array;
  private outlineMask: Uint8Array;

  private gazeFrom = new Float32Array(GAZE_N * 2);
  private gazeTo = new Float32Array(GAZE_N * 2);
  private gazeAt = new Float32Array(GAZE_N);
  private gazeNext = new Float32Array(GAZE_N);
  private gazeOff = new Float32Array(GAZE_N * 2);
  private rand = rng(41);
  private stareLatched = false;

  private trail = new Float32Array(TRAIL * 2);
  private trailHead = 0;
  private trailAcc = 0;
  private trailSeeded = false;

  private burst = 0;
  private waveLatched = false;
  private ticked = false;
  private ptrLive = false;
  private ptrX = 0;
  private ptrY = 0;

  constructor(L: Layout) {
    this.L = L;
    this.frame = fieldAt(0, L);
    const n = L.followers.n;
    this.field = {
      S: L.stops[0],
      R: L.radii[0],
      cx: L.cx,
      cy: L.cy,
      minCell: minCell(L),
      centerScale: 0,
      centerOpen: 0,
      lookViewer: 1,
      idle: 1,
      pulse: 0,
      waveX: L.W / 2,
      waveY: L.H / 2,
      waveR: 0,
      heartR: 0,
      postX: L.W / 2,
      postY: L.H / 2,
      clearA: [0, 0, 0, 0],
      clearB: [0, 0, 0, 0],
      clearAmtA: 0,
      clearAmtB: 0,
      time: 0,
      gaze: new Float32Array(GAZE_N * 2),
    };
    this.fol = {
      n,
      live: 0,
      pos: new Float32Array(n * 2),
      size: new Float32Array(n),
      open: new Float32Array(n),
      gaze: new Float32Array(n * 2),
      spark: new Float32Array(n),
      heart: new Float32Array(n),
      seed: new Float32Array(n),
      version: 0,
    };
    this.home = new Float32Array(n * 2);
    this.sp = new Float32Array(n * 2);
    this.sv = new Float32Array(n * 2);
    this.lifted = new Uint8Array(n);
    this.u = new Float32Array(n * 8);
    this.target = new Float32Array(n * 2);
    this.outlineMask = new Uint8Array(n);
    this.layout(L);
  }

  /** (Re)place everything that depends on the stage size. */
  layout(L: Layout) {
    this.L = L;
    this.field.cx = L.cx;
    this.field.cy = L.cy;
    this.field.minCell = minCell(L);
    const n = this.fol.n;
    const r = rng(1984);
    for (let i = 0; i < n * 8; i++) this.u[i] = r();
    for (let i = 0; i < n; i++) this.fol.seed[i] = this.u[i * 8 + 7];

    // constellation homes: a jittered grid that keeps the centre clear for the punchline
    const { W, H, mobile } = L;
    const keep = mobile ? { cx: W * 0.5, cy: H * 0.5, rx: W * 0.74, ry: H * 0.13 } : { cx: W * 0.5, cy: H * 0.5, rx: W * 0.33, ry: H * 0.2 };
    const margin = 14;
    const pts: number[] = [];
    let cell = Math.sqrt(((W - margin * 2) * (H - margin * 2)) / (n * 1.25));
    for (let tries = 0; tries < 6 && pts.length / 2 < n; tries++) {
      pts.length = 0;
      const cols = Math.max(1, Math.floor((W - margin * 2) / cell));
      const rows = Math.max(1, Math.floor((H - margin * 2) / cell));
      const cw = (W - margin * 2) / cols;
      const ch = (H - margin * 2) / rows;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = margin + (x + 0.5 + (r() - 0.5) * 0.8) * cw;
          const py = margin + (y + 0.5 + (r() - 0.5) * 0.8) * ch;
          if (((px - keep.cx) / keep.rx) ** 2 + ((py - keep.cy) / keep.ry) ** 2 < 1) continue;
          pts.push(px, py);
        }
      }
      cell *= 0.88;
    }
    // pick n of them, spread evenly (deterministic shuffle)
    const m = pts.length / 2;
    const order = Array.from({ length: m }, (_, i) => i);
    for (let i = m - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (let i = 0; i < n; i++) {
      const k = order[i % m];
      this.home[i * 2] = pts[k * 2];
      this.home[i * 2 + 1] = pts[k * 2 + 1];
    }

    // exit targets on the gavel: K on the outline (ordered by angle), the rest inside
    const K = Math.min(n, L.followers.outline);
    const g = sampleGavel(K, n - K, 11);
    const gv = L.gavel;
    const gcx = gv.x + gv.size * 0.47;
    const gcy = gv.y + gv.size * 0.52;
    const byAngle = Array.from({ length: n }, (_, i) => i).sort(
      (a, b) =>
        Math.atan2(this.home[a * 2 + 1] - gcy, this.home[a * 2] - gcx) -
        Math.atan2(this.home[b * 2 + 1] - gcy, this.home[b * 2] - gcx),
    );
    // every (n/K)-th follower (in angle order) takes an outline seat
    this.outlineMask.fill(0);
    let o = 0;
    let q = 0;
    for (let k = 0; k < n; k++) {
      const i = byAngle[k];
      const seat = Math.floor(((k + 0.5) * K) / n);
      if (seat >= o && o < K) {
        this.outlineMask[i] = 1;
        this.target[i * 2] = gv.x + (g.outline[o * 2] / 100) * gv.size;
        this.target[i * 2 + 1] = gv.y + (g.outline[o * 2 + 1] / 100) * gv.size;
        o++;
      } else {
        this.target[i * 2] = gv.x + (g.inner[q * 2] / 100) * gv.size;
        this.target[i * 2 + 1] = gv.y + (g.inner[q * 2 + 1] / 100) * gv.size;
        q = Math.min(q + 1, n - K - 1);
      }
    }
    this.outlineSpacing = estimateSpacing(g.outline, K, gv.size);
    this.lifted.fill(0);
    this.setProgress(this.p);
  }

  outlineSpacing = 16;

  /** The "2K+ / They follow." block (stage px); followers shrink out of it while it is up. */
  clearF: [number, number, number, number] = [0, 0, 0, 0];
  /** The "Then everyone blinks." line: followers wait for it to close before popping there. */
  clearC: [number, number, number, number] = [0, 0, 0, 0];

  setProgress(p: number) {
    const prev = this.p;
    this.p = p;
    const L = this.L;
    const f = fieldAt(p, L);
    this.frame = f;
    const F = this.field;
    F.S = f.S;
    F.R = f.R;
    F.centerScale = f.centerScale;
    F.centerOpen = f.centerOpen;
    F.idle = f.idle;
    F.pulse = f.pulse;
    F.clearAmtA = f.clearA;
    F.clearAmtB = f.clearB;
    if (!this.ticked) [F.postX, F.postY] = parkAt(p, L);

    // the blink wave starts wherever the post is headed when the stare breaks
    if (p < WAVE[0]) this.waveLatched = false;
    else if (!this.waveLatched || prev < WAVE[0]) {
      this.waveLatched = true;
      const [px, py] = this.ptrLive ? [this.ptrX, this.ptrY] : parkAt(p, L);
      F.waveX = px;
      F.waveY = py;
    }
    const far = Math.max(
      Math.hypot(F.waveX, F.waveY),
      Math.hypot(L.W - F.waveX, F.waveY),
      Math.hypot(F.waveX, L.H - F.waveY),
      Math.hypot(L.W - F.waveX, L.H - F.waveY),
    );
    F.waveR = f.wave > 0 ? f.wave * (far + 420) : 0;
  }

  /** A tap / click: every eye near the post turns heart-eyed for a beat. */
  poke() {
    this.burst = 1;
  }

  tick(time: number, dt: number, ptr: PointerSample) {
    const L = this.L;
    const F = this.field;
    const p = this.p;
    F.time = time;

    // --- the post: the pointer when there is one, else its parking spot
    const [px, py] = parkAt(p, L);
    const tx = ptr.live ? ptr.x : px;
    const ty = ptr.live ? ptr.y : py;
    this.ticked = true;
    this.ptrLive = ptr.live;
    this.ptrX = ptr.x;
    this.ptrY = ptr.y;
    const k = 1 - Math.exp(-dt * 14);
    F.postX += (tx - F.postX) * k;
    F.postY += (ty - F.postY) * k;
    if (!this.waveLatched) {
      F.waveX = tx;
      F.waveY = ty;
    }

    // trail of post positions at a fixed 60Hz (for the swarm's lag)
    if (!this.trailSeeded) {
      this.trailSeeded = true;
      for (let i = 0; i < TRAIL; i++) {
        this.trail[i * 2] = F.postX;
        this.trail[i * 2 + 1] = F.postY;
      }
    }
    this.trailAcc += dt;
    let pushes = 0;
    while (this.trailAcc >= 1 / 60 && pushes < 8) {
      this.trailAcc -= 1 / 60;
      this.trailHead = (this.trailHead + 1) % TRAIL;
      this.trail[this.trailHead * 2] = F.postX;
      this.trail[this.trailHead * 2 + 1] = F.postY;
      pushes++;
    }

    // --- giant eye: looks straight at you, then darts to the post
    const lookTarget = p < 0.165 ? 1 : 0;
    const step = dt / 0.08;
    F.lookViewer += clamp(lookTarget - F.lookViewer, -step, step);

    // --- hearts
    this.burst *= Math.exp(-dt / 0.7);
    const heartBase = L.mobile ? 82 : 124;
    F.heartR = p > 0.15 && p < WAVE[0] ? heartBase * (1 + 1.6 * this.burst) : 0;

    // --- saccades: dart 80ms, hold 150–700ms; at the slam everyone snaps at once
    const stare = p >= 0.474 && p < WAVE[0];
    if (stare && !this.stareLatched) this.gazeNext.fill(0);
    this.stareLatched = stare;
    const radius = stare ? 0 : L.mobile ? 46 : 82;
    for (let j = 0; j < GAZE_N; j++) {
      if (time >= this.gazeNext[j] || this.gazeNext[j] - time > 2) {
        this.gazeFrom[j * 2] = this.gazeOff[j * 2];
        this.gazeFrom[j * 2 + 1] = this.gazeOff[j * 2 + 1];
        const a = this.rand() * Math.PI * 2;
        const rr = radius * Math.sqrt(this.rand());
        this.gazeTo[j * 2] = Math.cos(a) * rr;
        this.gazeTo[j * 2 + 1] = Math.sin(a) * rr * 0.7;
        this.gazeAt[j] = time;
        this.gazeNext[j] = time + 0.08 + 0.15 + this.rand() * 0.55;
      }
      const e = easeOutCubic(clamp((time - this.gazeAt[j]) / 0.08));
      this.gazeOff[j * 2] = lerp(this.gazeFrom[j * 2], this.gazeTo[j * 2], e);
      this.gazeOff[j * 2 + 1] = lerp(this.gazeFrom[j * 2 + 1], this.gazeTo[j * 2 + 1], e);
      F.gaze[j * 2] = F.postX + this.gazeOff[j * 2];
      F.gaze[j * 2 + 1] = F.postY + this.gazeOff[j * 2 + 1];
    }

    this.tickFollowers(time, dt);
  }

  private trailAt(lagSec: number): [number, number] {
    const back = Math.min(TRAIL - 1, Math.round(lagSec * 60));
    const i = (this.trailHead - back + TRAIL) % TRAIL;
    return [this.trail[i * 2], this.trail[i * 2 + 1]];
  }

  private tickFollowers(time: number, dt: number) {
    const fol = this.fol;
    const p = this.p;
    const F = this.field;
    const L = this.L;
    if (p < WAVE[0] || F.waveR <= 0) {
      if (fol.live !== 0) {
        fol.live = 0;
        fol.version++;
      }
      this.lifted.fill(0);
      return;
    }
    const n = fol.n;
    const cellF = L.followers.cell;
    const cellO = clamp(this.outlineSpacing * 1.32, 14, 30);
    const { rMin, rMax } = L.followers;
    const swarmHearts = p > 0.72 && p < 0.87;
    const heartR = L.mobile ? 70 : 110;
    const clearAmtF = bell(p, 0.722, 0.738, 0.84, 0.852);
    const clearAmtC = 1 - range(p, 0.638, 0.654);
    const room = (x: number, y: number, r: readonly number[]) => {
      const k = clamp((Math.hypot(Math.max(r[0] - x, x - r[2], 0), Math.max(r[1] - y, y - r[3], 0)) - 6) / 28);
      return k * k * (3 - 2 * k);
    };

    for (let i = 0; i < n; i++) {
      const u = i * 8;
      const hx = this.home[i * 2];
      const hy = this.home[i * 2 + 1];
      const behind = F.waveR - Math.hypot(hx - F.waveX, hy - F.waveY) - 230;
      const popA = clamp(behind / 160);
      if (popA <= 0) {
        fol.size[i] = 0;
        continue;
      }
      const lift = easeInOutCubic(range(p, 0.712 + 0.05 * this.u[u], 0.762 + 0.05 * this.u[u]));
      const gather = easeInOutCubic(range(p, 0.872 + 0.055 * this.u[u + 1], 0.918 + 0.055 * this.u[u + 1]));

      // swarm springs (only once lifted; pinned to home before that)
      let sx = hx;
      let sy = hy;
      if (lift > 0) {
        if (!this.lifted[i]) {
          this.lifted[i] = 1;
          this.sp[i * 2] = hx;
          this.sp[i * 2 + 1] = hy;
          this.sv[i * 2] = 0;
          this.sv[i * 2 + 1] = 0;
        }
        const orbitT = Math.sqrt(this.u[u + 2]);
        const r = lerp(rMin, rMax, orbitT);
        const lag = 0.03 + 0.75 * orbitT * (0.6 + 0.4 * this.u[u + 3]);
        const [ax, ay] = this.trailAt(lag);
        const w = (0.16 + 0.34 * (1 - orbitT)) * (this.u[u + 4] < 0.5 ? 1 : 0.8);
        const ang = this.u[u + 5] * Math.PI * 2 + w * time;
        const Tx = ax + Math.cos(ang) * r;
        const Ty = ay + Math.sin(ang) * r * 0.8;
        const ks = 12 + 10 * this.u[u + 6];
        const c = 2 * Math.sqrt(ks) * 0.72;
        const h = Math.min(dt, 1 / 30);
        let vx = this.sv[i * 2];
        let vy = this.sv[i * 2 + 1];
        vx += (ks * (Tx - this.sp[i * 2]) - c * vx) * h;
        vy += (ks * (Ty - this.sp[i * 2 + 1]) - c * vy) * h;
        this.sv[i * 2] = vx;
        this.sv[i * 2 + 1] = vy;
        this.sp[i * 2] += vx * h;
        this.sp[i * 2 + 1] += vy * h;
        sx = this.sp[i * 2];
        sy = this.sp[i * 2 + 1];
      } else if (this.lifted[i]) {
        this.lifted[i] = 0;
      }

      let x = lerp(hx, sx, lift);
      let y = lerp(hy, sy, lift);
      x = lerp(x, this.target[i * 2], gather);
      y = lerp(y, this.target[i * 2 + 1], gather);
      fol.pos[i * 2] = x;
      fol.pos[i * 2 + 1] = y;

      // pop: 0 → 1.3 → 1 with a sparkle
      const b = popA - 1;
      const pop = 1 + 3.6 * b * b * b + 2.6 * b * b;
      let size = cellF * (0.88 + 0.24 * this.u[u + 7]) * pop;
      size *= lerp(1, 0.86, lift);
      if (this.outlineMask[i]) size = lerp(size, cellO, gather);
      else size *= 1 - range(gather, 0.45, 1);
      if (clearAmtF > 0) size *= lerp(1, room(x, y, this.clearF), clearAmtF);
      if (clearAmtC > 0) size *= lerp(1, room(x, y, this.clearC), clearAmtC);
      fol.size[i] = size;
      fol.spark[i] = Math.sin(Math.PI * range(popA, 0.2, 1)) * (1 - lift);

      // idle blinks
      const period = 3.2 + 4 * this.u[u + 3];
      const bt = (time + this.u[u + 5] * period) % period;
      const blink = 1 - clamp(Math.abs(bt - 0.075) / 0.075);
      fol.open[i] = clamp(range(popA, 0.12, 0.6) * (1 - blink));

      // gaze: at the post (saccading), then straight at you on the gavel
      const gj = (i % GAZE_N) * 2;
      const dx = F.gaze[gj] - x;
      const dy = F.gaze[gj + 1] - y;
      const dl = Math.hypot(dx, dy) || 1;
      const m = Math.min(dl / (0.55 * size + 1), 1) * (1 - gather);
      fol.gaze[i * 2] = (dx / dl) * m * 0.135;
      fol.gaze[i * 2 + 1] = (dy / dl) * m * 0.075;

      fol.heart[i] = swarmHearts ? 1 - clamp((Math.hypot(x - F.postX, y - F.postY) - heartR * 0.5) / (heartR * 0.5)) : 0;
    }
    fol.live = n;
    fol.version++;
  }
}

/** Smallest cell the field may use: keeps cell counts under the spec caps (30k desktop / 6k phone). */
function minCell(L: Layout) {
  const cap = L.mobile ? 6000 : 30000;
  return Math.sqrt((L.W * L.H) / (cap * ROW));
}

function estimateSpacing(outline: Float32Array, k: number, size: number) {
  if (k < 2) return 16;
  let sum = 0;
  for (let i = 0; i < k; i++) {
    let best = Infinity;
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      const d = Math.hypot(outline[i * 2] - outline[j * 2], outline[i * 2 + 1] - outline[j * 2 + 1]);
      if (d < best) best = d;
    }
    sum += best;
  }
  return (sum / k / 100) * size;
}
