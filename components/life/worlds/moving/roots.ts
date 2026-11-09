/**
 * Repotted — the root-growth engine.
 *
 * Space colonisation, run once per pot with a fixed seed (identical on every
 * load). Attractors are jitter-sampled in the NEW soil (pot N minus the old
 * root ball) plus a dense band just inside pot N's walls; that band makes the
 * roots run round the walls, and it is what later lights up as a house ring.
 * Growth for pot N starts from whatever old roots are nearest, so it pushes
 * out of the previous root ball.
 *
 * Scroll only reveals: every node stores the moment it was born, so the
 * renderer draws `birth ≤ t` and growth scrubs perfectly both ways.
 */

import { POTS, apexArc, bboxOf, nearestOnOutline, offsetPolygon, perimeterOf, pointAtArc, pointInPolygon, ringParam, rng, type Pt } from "./geometry";

export type RootData = {
  n: number;
  x: Float32Array;
  y: Float32Array;
  parent: Int32Array;
  /** 0 → 1 within the node's own pot (growth order). */
  birth: Float32Array;
  home: Uint8Array;
  /** 1 = runs along its pot's wall (part of a ring). */
  wall: Uint8Array;
  /** For wall nodes: 0 at the stem exit → 1 at the bottom centre, else −1. */
  ring: Float32Array;
  /** Pipe-model radius once pot k has finished growing: rad[k][i] (plant units). */
  rad: Float32Array[];
  /** Node index where each pot's growth starts; start[5] = n. */
  start: Int32Array;
  /** Generation time in ms (diagnostics). */
  ms: number;
};

export type Tier = "hi" | "lo";

const cache: Partial<Record<Tier, RootData>> = {};

/** Hard ceiling on nodes (the budget is ~5k desktop, ~2k phone). */
const MAX_NODES = 24000;

export function getRoots(tier: Tier): RootData {
  const hit = cache[tier];
  if (hit) return hit;
  const data = growAll(tier);
  cache[tier] = data;
  return data;
}

export function peekRoots(tier: Tier): RootData | undefined {
  return cache[tier];
}

/** Index one past the last node of pot `k` born at or before `g` (0..1). */
export function grownEnd(d: RootData, k: number, g: number): number {
  let lo = d.start[k];
  let hi = d.start[k + 1];
  if (g >= 1) return hi;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (d.birth[mid] <= g) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function growAll(tier: Tier): RootData {
  const t0 = typeof performance !== "undefined" ? performance.now() : 0;
  const R = rng(tier === "hi" ? 0x5eed : 0x5eef);
  const lo = tier === "lo";

  // growable node store
  let cap = 8192;
  let X = new Float64Array(cap);
  let Y = new Float64Array(cap);
  let PAR = new Int32Array(cap);
  let BIRTH = new Float32Array(cap);
  let HOME = new Uint8Array(cap);
  let SPAWN = new Uint8Array(cap);
  let NEXT = new Int32Array(cap); // grid linked list
  let n = 0;

  const [bx0, by0, bx1, by1] = bboxOf(POTS[4].outer);
  const CELL = 0.1;
  const gx0 = bx0 - 0.2;
  const gy0 = by0 - 0.2;
  const cols = Math.ceil((bx1 - bx0 + 0.4) / CELL);
  const rows = Math.ceil((by1 - by0 + 0.4) / CELL);
  const head = new Int32Array(cols * rows).fill(-1);
  const cellOf = (x: number, y: number) => {
    const c = Math.min(cols - 1, Math.max(0, Math.floor((x - gx0) / CELL)));
    const r = Math.min(rows - 1, Math.max(0, Math.floor((y - gy0) / CELL)));
    return r * cols + c;
  };

  const grow = () => {
    cap *= 2;
    const nx = new Float64Array(cap);
    nx.set(X);
    X = nx;
    const ny = new Float64Array(cap);
    ny.set(Y);
    Y = ny;
    const np = new Int32Array(cap);
    np.set(PAR);
    PAR = np;
    const nb = new Float32Array(cap);
    nb.set(BIRTH);
    BIRTH = nb;
    const nh = new Uint8Array(cap);
    nh.set(HOME);
    HOME = nh;
    const ns = new Uint8Array(cap);
    ns.set(SPAWN);
    SPAWN = ns;
    const nn = new Int32Array(cap);
    nn.set(NEXT);
    NEXT = nn;
  };

  const addNode = (x: number, y: number, parent: number, birth: number, home: number) => {
    if (n >= cap) grow();
    X[n] = x;
    Y[n] = y;
    PAR[n] = parent;
    BIRTH[n] = birth;
    HOME[n] = home;
    SPAWN[n] = 0;
    const c = cellOf(x, y);
    NEXT[n] = head[c];
    head[c] = n;
    return n++;
  };

  const start: number[] = [];
  const ELIG = new Uint8Array(MAX_NODES);
  const wall = new Uint8Array(MAX_NODES);
  const ring = new Float32Array(MAX_NODES).fill(-1);
  const arcOf = new Float32Array(MAX_NODES).fill(-1);
  const accX = new Float64Array(MAX_NODES);
  const accY = new Float64Array(MAX_NODES);
  const cnt = new Uint16Array(MAX_NODES);

  for (let k = 0; k < 5; k++) {
    const pot = POTS[k];
    const prev = k ? POTS[k - 1] : null;
    const s = 1 + 0.17 * k;
    const step = 0.022 * s * (lo ? 1.45 : 1);
    const infl = 0.17 * s;
    const kill = 0.036 * s * (lo ? 1.3 : 1);
    const bias = 0.34;
    const wallZone = 0.05 * s;
    start.push(n);

    /* ---- attractors: sparse new soil + a dense band inside the walls */
    const AX: number[] = [];
    const AY: number[] = [];
    const sp = 0.088 * s * (1 + 0.1 * k) * (lo ? 1.5 : 1);
    const [ix0, iy0, ix1, iy1] = bboxOf(pot.inner);
    for (let y = iy0; y < iy1; y += sp) {
      for (let x = ix0; x < ix1; x += sp) {
        const px = x + R() * sp;
        const py = y + R() * sp;
        if (!pointInPolygon(px, py, pot.inner)) continue;
        if (prev && pointInPolygon(px, py, prev.inner)) continue;
        if (nearestOnOutline(px, py, pot.inner).d < 0.07 * s) continue;
        if (Math.abs(px) < 0.05 && py < pot.top + 0.12) continue;
        AX.push(px);
        AY.push(py);
      }
    }
    const band = offsetPolygon(pot.inner, -0.024 * s);
    const bandP = perimeterOf(band);
    const bandSp = 0.026 * s * (lo ? 1.4 : 1);
    for (let a = R() * bandSp; a < bandP; a += bandSp) {
      const [px, py] = pointAtArc(band, a, bandP);
      AX.push(px + (R() - 0.5) * 0.012 * s);
      AY.push(py + (R() - 0.5) * 0.012 * s);
    }
    const na = AX.length;
    const alive = new Uint8Array(na).fill(1);
    const best = new Int32Array(na).fill(-1);
    const bestD2 = new Float64Array(na).fill(infl * infl);

    const aHead = new Int32Array(cols * rows).fill(-1);
    const aNext = new Int32Array(na);
    for (let a = 0; a < na; a++) {
      const c = cellOf(AX[a], AY[a]);
      aNext[a] = aHead[c];
      aHead[c] = a;
    }
    const reach = Math.ceil(infl / CELL);

    /* ---- where this pot's growth starts */
    for (let i = 0; i < n; i++) ELIG[i] = 0;
    if (k === 0) {
      let p = -1;
      for (let i = 0; i < 6; i++) {
        p = addNode((R() - 0.5) * 0.004, pot.top + 0.02 + i * step, p, 0, 0);
        ELIG[p] = 1;
      }
    } else if (prev) {
      // a handful of exit roots, spread round the old ball (more of them low down)
      const exits = (lo ? 5 : 6) + k;
      const P = prev.perimeter;
      const apex = apexArc(prev);
      for (let j = 0; j < exits; j++) {
        const u = (j + 0.3 + R() * 0.4) / exits;
        // bias the targets toward the lower half of the ball
        const target = apex + P * (0.5 + (u - 0.5) * 0.86);
        let bi = -1;
        let bd = Infinity;
        for (let i = start[k - 1]; i < start[k]; i++) {
          if (!wall[i]) continue;
          let d = Math.abs(arcOf[i] - (target % P));
          d = Math.min(d, P - d);
          if (d < bd) {
            bd = d;
            bi = i;
          }
        }
        if (bi >= 0) ELIG[bi] = 1;
      }
    }

    // exits far from every attractor still need to reach out: seed them toward the nearest new soil
    if (k > 0) {
      for (let i = start[k - 1]; i < start[k]; i++) {
        if (!ELIG[i]) continue;
        let bd = Infinity;
        let ba = -1;
        for (let a = 0; a < na; a++) {
          const dx = X[i] - AX[a];
          const dy = Y[i] - AY[a];
          const d2 = dx * dx + dy * dy;
          if (d2 < bd) {
            bd = d2;
            ba = a;
          }
        }
        if (ba >= 0 && bd >= infl * infl) {
          // walk straight toward it so the attractors take over
          let m = i;
          const steps = Math.ceil(Math.sqrt(bd) / step);
          for (let q = 1; q < steps; q++) {
            const t = q / steps;
            m = addNode(X[i] + (AX[ba] - X[i]) * t, Y[i] + (AY[ba] - Y[i]) * t, m, 0, k);
            ELIG[m] = 1;
          }
        }
      }
    }

    // nearest eligible node per attractor
    for (let a = 0; a < na; a++) {
      const c0 = Math.floor((AX[a] - gx0) / CELL);
      const r0 = Math.floor((AY[a] - gy0) / CELL);
      for (let r = Math.max(0, r0 - reach); r <= Math.min(rows - 1, r0 + reach); r++) {
        for (let c = Math.max(0, c0 - reach); c <= Math.min(cols - 1, c0 + reach); c++) {
          for (let m = head[r * cols + c]; m !== -1; m = NEXT[m]) {
            if (!ELIG[m]) continue;
            const dx = X[m] - AX[a];
            const dy = Y[m] - AY[a];
            const d2 = dx * dx + dy * dy;
            if (d2 < bestD2[a]) {
              bestD2[a] = d2;
              best[a] = m;
            }
          }
        }
      }
    }
    /* ---- grow */
    const touched: number[] = [];
    const fresh: number[] = [];
    const homeFirst = n;
    let iter = 0;
    const maxIter = 460;
    for (; iter < maxIter; iter++) {
      touched.length = 0;
      for (let a = 0; a < na; a++) {
        if (!alive[a]) continue;
        const m = best[a];
        if (m < 0) continue;
        const d = Math.sqrt(bestD2[a]) || 1e-6;
        accX[m] += (AX[a] - X[m]) / d;
        accY[m] += (AY[a] - Y[m]) / d;
        if (cnt[m]++ === 0) touched.push(m);
      }
      if (!touched.length) break;
      fresh.length = 0;
      for (const m of touched) {
        let dx = accX[m];
        let dy = accY[m];
        accX[m] = 0;
        accY[m] = 0;
        cnt[m] = 0;
        if (SPAWN[m] >= 4) continue;
        let len = Math.hypot(dx, dy);
        if (len < 1e-6) {
          dx = R() - 0.5;
          dy = 1;
          len = Math.hypot(dx, dy);
        }
        dx = dx / len + (R() - 0.5) * 0.4;
        dy = dy / len + bias + (R() - 0.5) * 0.4;
        // pot-bound: near the wall, roots turn and run along it (keeping their momentum)
        const near = nearestEdge(X[m], Y[m], pot.inner);
        if (near.d < wallZone) {
          const pm = PAR[m];
          const mx = pm >= 0 ? X[m] - X[pm] : dx;
          const my = pm >= 0 ? Y[m] - Y[pm] : dy;
          let sgn = mx * near.tx + my * near.ty;
          if (Math.abs(sgn) < 0.15 * step) sgn = R() < 0.5 ? -1 : 1;
          sgn = sgn < 0 ? -1 : 1;
          const w = 0.8 * (1 - near.d / wallZone) + 0.15;
          const l0 = Math.hypot(dx, dy) || 1;
          dx = (dx / l0) * (1 - w) + near.tx * sgn * w;
          dy = (dy / l0) * (1 - w) + near.ty * sgn * w;
        }
        len = Math.hypot(dx, dy) || 1;
        const st = step * (0.8 + R() * 0.4);
        const nx = X[m] + (dx / len) * st;
        const ny = Y[m] + (dy / len) * st;
        SPAWN[m]++;
        if (!pointInPolygon(nx, ny, pot.inner) || nearestOnOutline(nx, ny, pot.inner).d < 0.006) continue;
        const id = addNode(nx, ny, m, iter, k);
        ELIG[id] = 1;
        fresh.push(id);
      }
      if (!fresh.length || n > MAX_NODES - 4000) break;
      for (const m of fresh) {
        const c0 = Math.floor((X[m] - gx0) / CELL);
        const r0 = Math.floor((Y[m] - gy0) / CELL);
        for (let r = Math.max(0, r0 - reach); r <= Math.min(rows - 1, r0 + reach); r++) {
          for (let c = Math.max(0, c0 - reach); c <= Math.min(cols - 1, c0 + reach); c++) {
            for (let a = aHead[r * cols + c]; a !== -1; a = aNext[a]) {
              if (!alive[a]) continue;
              const dx = X[m] - AX[a];
              const dy = Y[m] - AY[a];
              const d2 = dx * dx + dy * dy;
              if (d2 < kill * kill) alive[a] = 0;
              else if (d2 < bestD2[a]) {
                bestD2[a] = d2;
                best[a] = m;
              }
            }
          }
        }
      }
    }
    const last = Math.max(1, iter);
    for (let i = homeFirst; i < n; i++) BIRTH[i] = Math.min(1, BIRTH[i] / last);

    /* ---- wall flags + ring parameter for this pot */
    const apex = apexArc(pot);
    const lim = 0.058 * s;
    for (let i = start[k]; i < n; i++) {
      const { d, arc } = nearestOnOutline(X[i], Y[i], pot.inner);
      arcOf[i] = arc;
      if (d < lim) {
        wall[i] = 1;
        ring[i] = ringParam(pot, arc, apex);
      }
    }
  }
  start.push(n);

  /* ---- pipe-model radii per finished pot */
  const rad: Float32Array[] = [];
  const size = new Float32Array(n);
  for (let k = 0; k < 5; k++) {
    const end = start[k + 1];
    size.fill(0);
    for (let i = 0; i < end; i++) size[i] = 1;
    for (let i = end - 1; i >= 0; i--) if (PAR[i] >= 0) size[PAR[i]] += size[i];
    const r = new Float32Array(n);
    for (let i = 0; i < end; i++) r[i] = Math.min(0.034, 0.0019 + 0.0013 * Math.pow(size[i], 0.46));
    rad.push(r);
  }

  const t1 = typeof performance !== "undefined" ? performance.now() : 0;
  return {
    n,
    x: Float32Array.from(X.subarray(0, n)),
    y: Float32Array.from(Y.subarray(0, n)),
    parent: PAR.slice(0, n),
    birth: BIRTH.slice(0, n),
    home: HOME.slice(0, n),
    wall: wall.slice(0, n),
    ring: ring.slice(0, n),
    rad,
    start: Int32Array.from(start),
    ms: t1 - t0,
  };
}

/* ------------------------------------------------------------ soil grit */

export type Grit = { x: Float32Array; y: Float32Array; kind: Uint8Array; region: Uint8Array; n: number };

/** Perlite and grit specks scattered through each pot's new soil (fixed seed). */
export function makeGrit(tier: Tier): Grit {
  const R = rng(0x9a1);
  const xs: number[] = [];
  const ys: number[] = [];
  const kinds: number[] = [];
  const regions: number[] = [];
  for (let k = 0; k < 5; k++) {
    const pot = POTS[k];
    const prev: Pt[] | null = k ? POTS[k - 1].inner : null;
    const [x0, y0, x1, y1] = bboxOf(pot.inner);
    const want = (tier === "hi" ? 70 : 34) * (1 + k * 0.5);
    let tries = 0;
    let got = 0;
    while (got < want && tries < want * 12) {
      tries++;
      const x = x0 + R() * (x1 - x0);
      const y = y0 + R() * (y1 - y0);
      if (!pointInPolygon(x, y, pot.inner)) continue;
      if (prev && pointInPolygon(x, y, prev)) continue;
      xs.push(x);
      ys.push(y);
      kinds.push(R() < 0.42 ? 1 : 0);
      regions.push(k);
      got++;
    }
  }
  return { x: Float32Array.from(xs), y: Float32Array.from(ys), kind: Uint8Array.from(kinds), region: Uint8Array.from(regions), n: xs.length };
}

/** Nearest point on an outline: distance and the unit tangent of that edge. */
function nearestEdge(x: number, y: number, poly: Pt[]): { d: number; tx: number; ty: number } {
  let best = Infinity;
  let tx = 1;
  let ty = 0;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[(i + 1) % poly.length];
    const dx = bx - ax;
    const dy = by - ay;
    const L2 = dx * dx + dy * dy || 1e-12;
    let t = ((x - ax) * dx + (y - ay) * dy) / L2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const d = Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
    if (d < best) {
      best = d;
      const L = Math.sqrt(L2);
      tx = dx / L;
      ty = dy / L;
    }
  }
  return { d: best, tx, ty };
}
