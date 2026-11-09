/**
 * The 2D conductor: one canvas draws everything that is not the R3F medal.
 * Called once per frame from useTicker with the latest progress; every frame
 * is a pure function of progress + a little ambient time (sparks, sheen,
 * swing), so scrolling back always un-draws.
 */
import { bell, clamp, easeInCubic, easeInOutCubic, easeOutCubic, expoOut, hash, lerp, range } from "@/components/life/multiverse/ease";
import { RISO, alpha, mix } from "@/components/life/multiverse/palette";
import { pathAt, type Layout } from "./layout";
import { buildBack, buildFront, drawMedal2D, makeCanvas, tint2D, trailStyle } from "./medalArt";
import { renderFurniture, type Furniture } from "./rink";
import { rosettePoint, strokeLapSpan, strokeLaps, type RosetteParams } from "./rosette";
import type { SportsStore } from "./store";
import { BEAT, exitDistance, lapsAt, poseAt, rinkLights } from "./timeline";

/* ---------------------------------------------------------------- sparks */

type Sparks = {
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  life: Float32Array;
  max: Float32Array;
  col: Uint8Array;
  cap: number;
};

const SPARK_COLS = [RISO.sun, RISO.pink, RISO.paper];

function makeSparks(cap: number): Sparks {
  return {
    x: new Float32Array(cap),
    y: new Float32Array(cap),
    vx: new Float32Array(cap),
    vy: new Float32Array(cap),
    life: new Float32Array(cap),
    max: new Float32Array(cap),
    col: new Uint8Array(cap),
    cap,
  };
}

function spawnSpark(sp: Sparks, x: number, y: number, vx: number, vy: number, life: number, col: number) {
  let best = -1;
  let bestLife = Infinity;
  for (let i = 0; i < sp.cap; i++) {
    if (sp.life[i] <= 0) {
      best = i;
      break;
    }
    if (sp.life[i] < bestLife) {
      bestLife = sp.life[i];
      best = i;
    }
  }
  sp.x[best] = x;
  sp.y[best] = y;
  sp.vx[best] = vx;
  sp.vy[best] = vy;
  sp.life[best] = life;
  sp.max[best] = life;
  sp.col[best] = col;
}

function stepSparks(ctx: CanvasRenderingContext2D, sp: Sparks, dt: number) {
  const drag = Math.exp(-2.6 * dt);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < sp.cap; i++) {
    if (sp.life[i] <= 0) continue;
    sp.life[i] -= dt;
    sp.x[i] += sp.vx[i] * dt;
    sp.y[i] += sp.vy[i] * dt;
    sp.vx[i] *= drag;
    sp.vy[i] *= drag;
    const a = clamp(sp.life[i] / sp.max[i]);
    if (a <= 0) continue;
    const s = 1 + 3.2 * a;
    ctx.globalAlpha = a;
    ctx.fillStyle = SPARK_COLS[sp.col[i]];
    ctx.fillRect(sp.x[i] - s, sp.y[i] - 0.6, 2 * s, 1.2);
    ctx.fillRect(sp.x[i] - 0.6, sp.y[i] - s, 1.2, 2 * s);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

/* --------------------------------------------------------------- shapes */

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
}

function comet(ctx: CanvasRenderingContext2D, x: number, y: number, tx: number, ty: number, t: number, a: number, scale: number, hot: string = RISO.pink) {
  if (a <= 0) return;
  ctx.globalCompositeOperation = "lighter";
  const pulse = 0.85 + 0.15 * Math.sin(t * 5.2);
  // wide pool of light on the floor, then the hot head
  const R2 = 86 * scale * pulse;
  const g2 = ctx.createRadialGradient(x, y, 0, x, y, R2);
  g2.addColorStop(0, alpha(hot, 0.26 * a));
  g2.addColorStop(1, alpha(hot, 0));
  ctx.fillStyle = g2;
  ctx.fillRect(x - R2, y - R2, 2 * R2, 2 * R2);
  const R = 34 * scale * pulse;
  const g = ctx.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, alpha(hot, 0.95 * a));
  g.addColorStop(0.3, alpha(hot, 0.5 * a));
  g.addColorStop(1, alpha(hot, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
  // two LED wheels aligned to the tangent
  const off = 7 * scale;
  const blink = 0.5 + 0.5 * Math.sin(t * 9);
  ctx.globalAlpha = a;
  ctx.fillStyle = mix(RISO.sun, RISO.paper, 0.3 * blink);
  ctx.beginPath();
  ctx.arc(x + tx * off, y + ty * off, 2.6 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = mix(RISO.teal, RISO.paper, 0.35 * (1 - blink));
  ctx.beginPath();
  ctx.arc(x - tx * off, y - ty * off, 2.6 * scale, 0, Math.PI * 2);
  ctx.fill();
  // hot core
  ctx.fillStyle = RISO.paper;
  ctx.beginPath();
  ctx.arc(x, y, 3.4 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

/* ------------------------------------------------------------- resources */

export type Res = {
  dpr: number;
  P: RosetteParams;
  furn: Furniture;
  trail: { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D; half: number; laps: number; epsV: number };
  dots: { x: Float32Array; y: Float32Array; d: Float32Array; n: number };
  sparks: Sparks;
  prevS: number;
  prevExitD: number;
  prevP: number;
  sprites: HTMLCanvasElement[];
  spriteKey: string;
  swing: { a: Float32Array; v: Float32Array };
  sv: number;
};

export function createRes(L: Layout, dpr: number, mono: string): Res {
  const P: RosetteParams = { N: L.N, K: L.K, spl: L.spl, a: L.a, b: L.b, psi: L.psi, theta0: L.theta0, delta: L.delta };
  const half = L.R + 16;
  const tc = makeCanvas(Math.ceil(2 * half * dpr));
  const tctx = tc.getContext("2d") as CanvasRenderingContext2D;

  // halftone screen for the press ring, sorted by distance from the medal centre
  const sp = L.mobile ? 10 : 9;
  const ang = (15 * Math.PI) / 180;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const reach = Math.hypot(L.w, L.h);
  const pts: [number, number, number][] = [];
  for (let gy = -reach; gy <= reach; gy += sp) {
    for (let gx = -reach; gx <= reach; gx += sp) {
      const x = L.medal.x + gx * ca - gy * sa;
      const y = L.medal.y + gx * sa + gy * ca;
      if (x < -8 || y < -8 || x > L.w + 8 || y > L.h + 8) continue;
      pts.push([x, y, Math.hypot(x - L.medal.x, y - L.medal.y)]);
    }
  }
  pts.sort((p, q) => p[2] - q[2]);
  const dots = { x: new Float32Array(pts.length), y: new Float32Array(pts.length), d: new Float32Array(pts.length), n: pts.length };
  pts.forEach((p, i) => {
    dots.x[i] = p[0];
    dots.y[i] = p[1];
    dots.d[i] = p[2];
  });

  return {
    dpr,
    P,
    furn: renderFurniture(L, dpr, mono),
    trail: { c: tc, ctx: tctx, half, laps: -1, epsV: -1 },
    dots,
    sparks: makeSparks(L.lowPower ? 20 : 60),
    prevS: 0,
    prevExitD: -1,
    prevP: -1,
    sprites: [],
    spriteKey: "",
    swing: { a: new Float32Array(25), v: new Float32Array(25) },
    sv: 0,
  };
}

function lowerBound(arr: Float32Array, n: number, v: number) {
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function halftoneRing(ctx: CanvasRenderingContext2D, res: Res, rr: number, bw: number, maxDot: number, color: string, ox: number, oy: number) {
  const { dots } = res;
  const lo = lowerBound(dots.d, dots.n, rr - bw);
  const hi = lowerBound(dots.d, dots.n, rr + bw);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = lo; i < hi; i++) {
    const q = (dots.d[i] - rr) / bw;
    const s = maxDot * (1 - q * q) * (q < 0 ? 0.75 + 0.25 * (1 + q) : 1);
    if (s < 0.35) continue;
    const x = dots.x[i] + ox;
    const y = dots.y[i] + oy;
    ctx.moveTo(x + s, y);
    ctx.arc(x, y, s, 0, Math.PI * 2);
  }
  ctx.fill();
}

/* ---------------------------------------------------------------- trail */

function updateTrailCache(res: Res, L: Layout, store: SportsStore, laps: number) {
  const T = res.trail;
  if (T.laps === laps) return;
  const glow = !L.lowPower;
  const ctx = T.ctx;
  let from = T.laps;
  // eps is only ever recorded for laps the comet is entering (never cached ones),
  // so the cache is rebuilt only when scrolling back un-draws laps
  if (laps < T.laps || T.laps < 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, T.c.width, T.c.height);
    from = 0;
  }
  ctx.setTransform(res.dpr, 0, 0, res.dpr, T.half * res.dpr, T.half * res.dpr);
  ctx.globalCompositeOperation = "lighter";
  strokeLaps(ctx, res.P, store.eps, from, laps, (i) => trailStyle(i, L.N, 1, glow));
  ctx.globalCompositeOperation = "source-over";
  T.laps = laps;
  T.epsV = store.epsVersion;
}

/* -------------------------------------------------------------- receipts */

const RIBBONS: [string, string, string][] = [
  [RISO.cobalt, RISO.sun, RISO.cobalt],
  [RISO.pink, RISO.paper, RISO.pink],
  [RISO.teal, RISO.sun, RISO.teal],
  [RISO.sun, RISO.pink, RISO.sun],
];

function ensureSprites(res: Res, L: Layout, store: SportsStore) {
  const key = `${store.front.version}|${L.w}x${L.h}`;
  if (res.spriteKey === key) return;
  const r = L.slots[0].r;
  const size = Math.ceil(2 * r * 1.25 * res.dpr);
  res.sprites = [0, 1, 2].map((v) => {
    const c = makeCanvas(size);
    const ctx = c.getContext("2d") as CanvasRenderingContext2D;
    ctx.scale(res.dpr, res.dpr);
    drawMedal2D(
      ctx,
      { x: size / res.dpr / 2, y: size / res.dpr / 2, r, rotX: 0.1, rotY: [-0.18, 0.06, 0.22][v], rotZ: [0.3, -0.5, 1.2][v], metal: 1, bump: 1, E: 0, rim: 1, sheen: [0.2, 1.6, 3.1][v] },
      { face: store.front, flat: store.front2D },
      null,
    );
    return c;
  });
  res.spriteKey = key;
}

function drawReceipts(ctx: CanvasRenderingContext2D, res: Res, L: Layout, store: SportsStore, p: number, t: number, dt: number) {
  ensureSprites(res, L, store);
  const { slots, apex } = L;
  const sw = res.swing;
  const stiff = 26;
  const damp = 3.2;
  for (let k = 0; k < slots.length; k++) {
    const target = clamp(-res.sv * 0.0042 * (0.7 + 0.6 * hash(k * 3.3)), -0.42, 0.42) + 0.035 * Math.sin(t * 1.25 + k * 0.83);
    sw.v[k] += (-stiff * (sw.a[k] - target) - damp * sw.v[k]) * dt;
    sw.a[k] += sw.v[k] * dt;
  }

  for (let pass = 0; pass < 2; pass++) {
    for (let k = 0; k < slots.length; k++) {
      const S = slots[k];
      // desktop: back tier (odd) first so its ribbons pass behind the front tier
      if (!L.mobile && (k % 2 === 1) !== (pass === 0)) continue;
      if (L.mobile && pass === 1) continue;

      const start = BEAT.multiply[0] + S.order * (S.ghost ? 0.012 : 0.022) + (S.ghost ? 0.024 : 0);
      const arrive = easeOutCubic(range(p, start, start + 0.022));
      if (arrive <= 0) continue;
      const lift = easeInCubic(range(p, BEAT.liftOut[0] + S.order * 0.012, BEAT.liftOut[0] + 0.026 + S.order * 0.012));
      const up = lift * (S.y + S.r * 2 + 60);
      const ax = S.ax;
      const ay = S.ay - up;
      const len = (S.y - S.r - S.ay) * arrive;
      const ang = sw.a[k] * arrive;
      const [c0, c1, c2] = RIBBONS[S.stripe];
      const wr = S.r * 0.62;

      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(ang);
      if (S.ghost) {
        ctx.globalAlpha = arrive * 0.75;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = alpha(RISO.paper, 0.4);
        ctx.lineWidth = 1;
        ctx.strokeRect(-wr / 2, 0, wr, len);
        ctx.strokeStyle = alpha(RISO.paper, 0.55);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, len + S.r * 1.04, S.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.arc(0, len + S.r * 1.04, S.r * 0.72, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        continue;
      }
      // ribbon: three vertical stripes, a fold shadow at the top
      ctx.fillStyle = c0;
      ctx.fillRect(-wr / 2, 0, wr, len);
      ctx.fillStyle = c1;
      ctx.fillRect(-wr / 6, 0, wr / 3, len);
      ctx.fillStyle = c2;
      ctx.fillRect(wr / 2 - wr / 6, 0, wr / 6, len);
      ctx.fillStyle = alpha(RISO.ink, 0.28);
      ctx.fillRect(-wr / 2, len - 3, wr, 3);
      // bail ring
      ctx.strokeStyle = mix(RISO.paper, RISO.ink, 0.25);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, len + 1, S.r * 0.14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // the medal flies in from the toss apex, spinning until it faces you
      const hx = ax - Math.sin(ang) * (len + S.r * 1.04);
      const hy = ay + Math.cos(ang) * (len + S.r * 1.04);
      const fx = lerp(apex.x, hx, arrive);
      const fy = lerp(apex.y, hy, arrive) - Math.sin(arrive * Math.PI) * 40;
      const spin = Math.abs(Math.cos((1 - arrive) * Math.PI * 1.5));
      const sprite = res.sprites[k % res.sprites.length];
      if (!sprite) continue;
      const sz = (sprite.width / res.dpr) * lerp(0.4, 1, arrive);
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(ang);
      ctx.scale(Math.max(0.04, spin), 1);
      ctx.drawImage(sprite, -sz / 2, -sz / 2, sz, sz);
      ctx.restore();
    }
  }
}

/* ------------------------------------------------------------------ frame */

export type FrameInput = {
  p: number;
  t: number;
  dt: number;
  v: number;
  mouse: boolean;
  nx: number;
  ny: number;
  use3D: boolean;
};

const tmp = { x: 0, y: 0 };
const tmp2 = { x: 0, y: 0 };
const at = { x: 0, y: 0, tx: 0, ty: 0, i: 0 };

export function frame(canvas: HTMLCanvasElement, res: Res, L: Layout, store: SportsStore, f: FrameInput) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { p, t, dt } = f;
  const { dpr, P } = res;
  store.time = t;

  // smoothed scroll speed
  res.sv += (f.v - res.sv) * (1 - Math.exp(-dt * 8));
  const speed = clamp(Math.abs(res.sv) / 45);

  // tilt: the pointer on desktop; on touch, the scroll itself plus a slow drift
  const tx = f.mouse ? f.nx * 0.21 : Math.sin(t * 0.55) * 0.07 + clamp(res.sv * 0.004, -0.12, 0.12);
  const ty = f.mouse ? f.ny * 0.21 : Math.cos(t * 0.47) * 0.06 + clamp(res.sv * 0.006, -0.16, 0.16);
  const kk = 1 - Math.exp(-dt * 6);
  store.tilt.x += (tx - store.tilt.x) * kk;
  store.tilt.y += (ty - store.tilt.y) * kk;

  // laps: record the stride wobble as the comet enters each lap
  const N = L.N;
  const s = lapsAt(p, N);
  if (s > res.prevS) {
    const e = L.epsBase + L.epsVel * speed;
    const first = res.prevS <= 0 ? 0 : Math.floor(res.prevS) + 1;
    for (let i = first; i <= Math.min(N - 1, Math.floor(s)); i++) {
      if (Math.abs(store.eps[i] - e) > 0.0015) {
        store.eps[i] = e;
        store.epsVersion++;
      }
    }
  }
  const dS = s - res.prevS;
  res.prevS = s;

  // pose + faces
  const pose = poseAt(p, L, store.pose);
  const lk = `${L.w}x${L.h}`;
  if (p >= BEAT.laps[1]) {
    // the laps are final: strike them into the obverse (once per rosette)
    const key = `${lk}|${store.epsVersion}|${store.fontsReady}`;
    if (store.frontKey !== key) {
      buildFront(store.front, { P, eps: store.eps, M0: L.M0, glow: !L.lowPower, serif: store.serif });
      tint2D(store.front, store.front2D);
      store.frontKey = key;
    }
  }
  if (p >= 0.49 && p < 0.8) {
    const q = (v: number, n: number) => Math.round(v * n) / n;
    const lotus = q(pose.lotus, 90);
    const relief = q(pose.backBump, 40);
    const insc = q(pose.backInsc, 40);
    const key = `${lk}|${lotus}|${relief}|${insc}|${store.fontsReady}`;
    if (store.backKey !== key) {
      buildBack(store.back, { lotus, relief, insc, glow: !L.lowPower, serif: store.serif });
      tint2D(store.back, store.back2D);
      store.backKey = key;
    }
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, L.w, L.h);

  const lights = rinkLights(p);
  const tl = easeInOutCubic(range(p, 0.035, 0.11));
  const cx = lerp(L.title.x, L.laps.x, tl);
  const cy = lerp(L.title.y, L.laps.y, tl);
  const exitPhase = p >= BEAT.liftOut[0];
  const fx = exitPhase ? L.exit.x : cx;
  const fy = exitPhase ? L.exit.y : cy;

  // floor: a slow overhead-light sheen, then the furniture
  if (lights > 0.01) {
    const sx = fx + Math.sin(t * 0.13) * 0.22 * L.w;
    const sy = fy + Math.cos(t * 0.11) * 0.16 * L.h;
    const R = 0.6 * Math.max(L.w, L.h);
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
    g.addColorStop(0, alpha(RISO.cobalt, 0.16 * lights));
    g.addColorStop(1, alpha(RISO.cobalt, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L.w, L.h);
    const { furn } = res;
    ctx.globalAlpha = lights;
    ctx.drawImage(furn.canvas, fx - furn.hx, fy - furn.hy, furn.hx * 2, furn.hy * 2);
    ctx.globalAlpha = 1;
  }

  // breath: haze + inhale/exhale rings
  const bA = bell(p, 0.545, 0.565, 0.69, 0.71);
  if (bA > 0) {
    const breath = 0.5 - 0.5 * Math.cos(Math.PI * 2 * pose.lotus);
    const hz = ctx.createRadialGradient(L.medal.x, L.medal.y, L.mRest * 0.6, L.medal.x, L.medal.y, L.mRest * 2.6);
    hz.addColorStop(0, alpha(RISO.teal, (0.12 + 0.06 * breath) * bA));
    hz.addColorStop(1, alpha(RISO.cobalt, 0));
    ctx.fillStyle = hz;
    ctx.fillRect(0, 0, L.w, L.h);
    const rr = L.mRest * (1.13 + 0.08 * breath);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = alpha(RISO.teal, 0.75 * bA);
    ctx.beginPath();
    ctx.arc(L.medal.x, L.medal.y, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([2, 7]);
    ctx.strokeStyle = alpha(RISO.cobalt, 0.7 * bA);
    ctx.beginPath();
    ctx.arc(L.medal.x, L.medal.y, rr + 14 + 10 * breath, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // the laps
  if (p < BEAT.handoff) {
    updateTrailCache(res, L, store, Math.min(N, Math.floor(s)));
    const T = res.trail;
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(T.c, cx - T.half, cy - T.half, T.half * 2, T.half * 2);
    ctx.save();
    ctx.translate(cx, cy);
    if (s < N && s > 0) {
      const i = Math.floor(s);
      strokeLapSpan(ctx, P, store.eps, i, s, trailStyle(i, N, 1, !L.lowPower));
    }
    // hot tail
    if (s > 0) {
      const tail = Math.min(0.075, s);
      for (let j = 0; j < 8; j++) {
        const a0 = s - tail * (1 - j / 8);
        const a1 = s - tail * (1 - (j + 1) / 8);
        const lap = Math.floor(a0);
        strokeLapSpan(ctx, P, store.eps, a0, Math.min(a1, lap + 1), { color: mix(RISO.pink, RISO.paper, 0.35), alpha: ((j + 1) / 8) * 0.85, width: 1 + 2.2 * ((j + 1) / 8), strands: 1 });
      }
    }
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";

    // the comet skater
    const cs = Math.min(s, N - 1e-4);
    rosettePoint(P, store.eps, cs, 1, tmp);
    rosettePoint(P, store.eps, cs + 0.002, 1, tmp2);
    const dl = Math.hypot(tmp2.x - tmp.x, tmp2.y - tmp.y) || 1;
    const ux = (tmp2.x - tmp.x) / dl;
    const uy = (tmp2.y - tmp.y) / dl;
    const ca = 1 - range(p, 0.36, 0.392);
    comet(ctx, cx + tmp.x, cy + tmp.y, ux, uy, t, ca, L.mobile ? 0.85 : 1);

    // sparks fly off the turns
    if (dS > 0 && dS < 2 && ca > 0.5) {
      const th = L.theta0 - Math.PI * 2 * s;
      const turn = Math.pow(Math.abs(Math.cos(th)), 6);
      const want = dS * 40 * turn + (Math.random() < dS * 6 * turn ? 1 : 0);
      const n = Math.min(4, Math.floor(want));
      for (let k = 0; k < n; k++) {
        const nl = Math.hypot(tmp.x, tmp.y) || 1;
        const sp = 70 + Math.random() * 120;
        spawnSpark(res.sparks, cx + tmp.x, cy + tmp.y, (tmp.x / nl) * sp + ux * (Math.random() - 0.3) * 90, (tmp.y / nl) * sp + uy * (Math.random() - 0.3) * 90, 0.35 + Math.random() * 0.45, k % 3);
      }
    }
  }

  // the press: a halftone shock ring in two inks (misregistered), no flash
  const hx = range(p, BEAT.impact, BEAT.impact + 0.055);
  if (p >= BEAT.impact && hx < 1) {
    const rr = L.mRest * (0.96 + 1.75 * expoOut(hx));
    const fade = Math.pow(1 - hx, 1.15);
    const md = (L.mobile ? 3.2 : 4) * fade;
    const bw = 18 + 46 * hx;
    halftoneRing(ctx, res, rr * 0.955, bw, md * 0.9, alpha(RISO.pink, 0.9), 2, 1.5);
    halftoneRing(ctx, res, rr, bw, md, alpha(RISO.sun, 0.95), 0, 0);
  }
  if (res.prevP < BEAT.impact && p >= BEAT.impact && p - res.prevP < 0.03) {
    for (let k = 0; k < (L.lowPower ? 10 : 22); k++) {
      const a = (k / (L.lowPower ? 10 : 22)) * Math.PI * 2 + Math.random() * 0.2;
      const sp = 180 + Math.random() * 160;
      spawnSpark(res.sparks, L.medal.x + Math.cos(a) * L.mRest, L.medal.y + Math.sin(a) * L.mRest, Math.cos(a) * sp, Math.sin(a) * sp, 0.5 + Math.random() * 0.4, k % 3);
    }
  }

  // disco: the struck medal throws four-point stars across the rink walls
  const glint = pose.glint * (1 - 0.75 * bA);
  if (glint > 0) {
    const rx = pose.rotX + store.tilt.y * pose.tiltAmt;
    const ry = pose.rotY + store.tilt.x * pose.tiltAmt;
    const nx = Math.sin(ry) * Math.cos(rx);
    const ny = Math.sin(rx);
    const mag = Math.hypot(nx, ny);
    const dx = mag > 1e-4 ? nx / mag : 0;
    const dy = mag > 1e-4 ? ny / mag : 0;
    ctx.globalCompositeOperation = "lighter";
    for (const g of L.glints) {
      const d = Math.max(0, g.dx * dx + g.dy * dy);
      const b = glint * (Math.pow(d, 5) * Math.min(1, mag * 3.2) + 0.12 * (0.5 + 0.5 * Math.sin(t * 1.7 + g.phase)));
      if (b < 0.02) continue;
      ctx.globalAlpha = clamp(b);
      ctx.fillStyle = g.color;
      sparkle(ctx, g.x, g.y, g.size * (0.55 + 0.75 * b));
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  // the medal itself, when the 2D emboss is the renderer
  const gl = store.gl3d;
  const use3DNow = f.use3D && gl.alive && gl.ready && gl.frontSeen === store.front.version;
  if (pose.vis && !use3DNow) {
    drawMedal2D(
      ctx,
      {
        x: pose.x,
        y: pose.y,
        r: pose.r,
        rotX: pose.rotX + store.tilt.y * pose.tiltAmt,
        rotY: pose.rotY + store.tilt.x * pose.tiltAmt,
        rotZ: pose.rotZ,
        metal: pose.metal,
        bump: pose.bump,
        E: pose.E,
        rim: pose.rim,
        sheen: t * 0.25,
      },
      { face: store.front, flat: store.front2D },
      { face: store.back, flat: store.back2D },
      pose.backE,
    );
  }

  // the receipts
  if (p >= BEAT.multiply[0] && p < BEAT.liftOut[1] + 0.02) drawReceipts(ctx, res, L, store, p, t, dt);

  // another direction: one comet breaks off its lap and squares the circle
  const path = L.path;
  const d = exitDistance(p, path.ovalEnd, path.lineEnd, path.len);
  if (d > 0) {
    pathAt(path, d, at);
    const lastIdx = at.i;
    const ovalN = path.n - 8; // index of the last oval sample
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const seg = (from: number, to: number, endX: number | null, endY: number | null, color: string, w: number, a: number) => {
      if (to < from) return;
      ctx.strokeStyle = color;
      ctx.globalAlpha = a;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(path.pts[from * 2], path.pts[from * 2 + 1]);
      for (let i = from + 1; i <= to; i++) ctx.lineTo(path.pts[i * 2], path.pts[i * 2 + 1]);
      if (endX !== null && endY !== null) ctx.lineTo(endX, endY);
      ctx.stroke();
    };
    const ovEnd = Math.min(lastIdx, ovalN);
    const inOval = lastIdx < ovalN;
    // glow + core, oval in pink
    seg(0, ovEnd, inOval ? at.x : null, inOval ? at.y : null, RISO.pink, 9, 0.1);
    seg(0, ovEnd, inOval ? at.x : null, inOval ? at.y : null, RISO.pink, 1.8, 0.85);
    if (!inOval) {
      const inLine = lastIdx < ovalN + 1;
      seg(ovalN, inLine ? ovalN : ovalN + 1, inLine ? at.x : null, inLine ? at.y : null, RISO.pink, 9, 0.1);
      seg(ovalN, inLine ? ovalN : ovalN + 1, inLine ? at.x : null, inLine ? at.y : null, mix(RISO.pink, RISO.sun, 0.5), 2, 0.95);
      if (!inLine) {
        seg(ovalN + 1, lastIdx, at.x, at.y, RISO.sun, 10, 0.12);
        seg(ovalN + 1, lastIdx, at.x, at.y, RISO.paper, 2.2, 0.95);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    const ca = 1 - range(p, BEAT.fill[0] + 0.004, BEAT.fill[1]);
    comet(ctx, at.x, at.y, at.tx, at.ty, t, ca, L.mobile ? 0.85 : 1, lastIdx > ovalN ? RISO.sun : RISO.pink);
    // corner sparks on the hard turns
    for (let v = 0; v < 7; v++) {
      const cd = path.cum[ovalN + 1 + v] ?? path.len;
      if (res.prevExitD < cd && d >= cd && d - res.prevExitD < 200) {
        for (let k = 0; k < 6; k++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 60 + Math.random() * 110;
          spawnSpark(res.sparks, path.pts[(ovalN + 1 + v) * 2], path.pts[(ovalN + 1 + v) * 2 + 1], Math.cos(a) * sp, Math.sin(a) * sp, 0.3 + Math.random() * 0.35, k % 3);
        }
      }
    }
  }
  res.prevExitD = d;

  stepSparks(ctx, res.sparks, dt);
  res.prevP = p;
}
