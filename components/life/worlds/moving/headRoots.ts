/**
 * Repotted — "5 homes in 3 years." takes root.
 *
 * Once the display font is ready, each letter of the DOM headline is drawn to
 * an offscreen canvas at its laid-out position, attractors are sampled inside
 * the glyph, and a small space-colonisation pass grows roots that fill the
 * letter from the top down (fixed seed). The solid type fades in over them.
 * Roots are in stage px; births are sorted so scrubbing is one binary search.
 */

import { rng } from "./geometry";

export type HeadRoots = {
  n: number;
  x: Float32Array;
  y: Float32Array;
  parent: Int32Array;
  birth: Float32Array;
  /** Nodes born at or before g (0..1). */
  end: (g: number) => number;
};

export type GlyphBox = { ch: string; x: number; y: number; w: number; h: number; lineHeight: number; size: number; family: string; weight: number };

export function buildHeadRoots(glyphs: GlyphBox[], lowPower: boolean): HeadRoots | null {
  const ink = glyphs.filter((g) => g.ch.trim());
  if (!ink.length) return null;
  const pad = 8;
  const x0 = Math.floor(Math.min(...ink.map((g) => g.x)) - pad);
  const y0 = Math.floor(Math.min(...ink.map((g) => g.y)) - pad);
  const x1 = Math.ceil(Math.max(...ink.map((g) => g.x + g.w)) + pad);
  const y1 = Math.ceil(Math.max(...ink.map((g) => g.y + g.h)) + pad);
  const cw = x1 - x0;
  const ch = y1 - y0;
  if (cw <= 0 || ch <= 0 || cw * ch > 6e6) return null;

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#000";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const R = rng(0x4ead);
  const step = lowPower ? 4.2 : 3.2;
  const kill = step * 1.45;
  const infl = step * 7;
  const X: number[] = [];
  const Y: number[] = [];
  const PAR: number[] = [];
  const BIRTH: number[] = [];

  ink.forEach((g, li) => {
    ctx.clearRect(0, 0, cw, ch);
    ctx.font = `${g.weight} ${g.size}px ${g.family}`;
    const m = ctx.measureText(g.ch);
    const A = m.fontBoundingBoxAscent ?? g.size * 0.9;
    const D = m.fontBoundingBoxDescent ?? g.size * 0.25;
    const baseline = g.y + (g.lineHeight - (A + D)) / 2 + A;
    const gx = g.x + (g.w - m.width) / 2;
    ctx.fillText(g.ch, gx - x0, baseline - y0);

    // glyph mask (letter box only)
    const bx0 = Math.max(0, Math.floor(g.x - x0 - 4));
    const by0 = Math.max(0, Math.floor(g.y - y0 - 4));
    const bw = Math.min(cw - bx0, Math.ceil(g.w + 8));
    const bh = Math.min(ch - by0, Math.ceil(g.h + 8));
    if (bw <= 0 || bh <= 0) return;
    const img = ctx.getImageData(bx0, by0, bw, bh).data;
    const inside = (x: number, y: number) => {
      const ix = Math.round(x - bx0);
      const iy = Math.round(y - by0);
      if (ix < 0 || iy < 0 || ix >= bw || iy >= bh) return false;
      return img[(iy * bw + ix) * 4 + 3] > 110;
    };

    // attractors: jittered grid inside the glyph
    const AX: number[] = [];
    const AY: number[] = [];
    const sp = lowPower ? 6.5 : 5;
    for (let y = by0; y < by0 + bh; y += sp) {
      for (let x = bx0; x < bx0 + bw; x += sp) {
        const px = x + R() * sp;
        const py = y + R() * sp;
        if (inside(px, py)) {
          AX.push(px);
          AY.push(py);
        }
      }
    }
    if (!AX.length) return;
    const alive = new Uint8Array(AX.length).fill(1);
    let left = AX.length;

    const nodes: number[] = []; // indices into X/Y for this letter
    const letterStart = X.length;
    let iter = 0;
    const iters: number[] = [];

    const seedAt = (a: number) => {
      X.push(AX[a]);
      Y.push(AY[a]);
      PAR.push(-1);
      iters.push(iter);
      nodes.push(X.length - 1);
      alive[a] = 0;
      left--;
    };
    // first seed: the highest attractor (roots grow down from the top of the letter)
    const topmost = () => {
      let bi = -1;
      for (let a = 0; a < AX.length; a++) if (alive[a] && (bi < 0 || AY[a] < AY[bi] - 0.5 || (Math.abs(AY[a] - AY[bi]) <= 0.5 && Math.abs(AX[a] - (g.x - x0 + g.w / 2)) < Math.abs(AX[bi] - (g.x - x0 + g.w / 2))))) bi = a;
      return bi;
    };
    seedAt(topmost());

    const acc = new Map<number, [number, number]>();
    while (left > 0 && iter < 400) {
      acc.clear();
      for (let a = 0; a < AX.length; a++) {
        if (!alive[a]) continue;
        let bi = -1;
        let bd = infl * infl;
        for (const m of nodes) {
          const dx = X[m] - AX[a];
          const dy = Y[m] - AY[a];
          const d2 = dx * dx + dy * dy;
          if (d2 < bd) {
            bd = d2;
            bi = m;
          }
        }
        if (bi < 0) continue;
        const d = Math.sqrt(bd) || 1;
        const v = acc.get(bi) ?? [0, 0];
        v[0] += (AX[a] - X[bi]) / d;
        v[1] += (AY[a] - Y[bi]) / d;
        acc.set(bi, v);
      }
      if (!acc.size) {
        // a disconnected part (the dot of an i, a full stop): plant a new seed there
        const a = topmost();
        if (a < 0) break;
        seedAt(a);
        iter++;
        continue;
      }
      let grew = 0;
      for (const [m, v] of acc) {
        let dx = v[0];
        let dy = v[1];
        const l0 = Math.hypot(dx, dy) || 1;
        dx = dx / l0 + (R() - 0.5) * 0.5;
        dy = dy / l0 + 0.28 + (R() - 0.5) * 0.5;
        const l = Math.hypot(dx, dy) || 1;
        const nx = X[m] + (dx / l) * step;
        const ny = Y[m] + (dy / l) * step;
        if (!inside(nx, ny)) continue;
        X.push(nx);
        Y.push(ny);
        PAR.push(m);
        iters.push(iter + 1);
        const id = X.length - 1;
        nodes.push(id);
        grew++;
        for (let a = 0; a < AX.length; a++) {
          if (!alive[a]) continue;
          const ddx = AX[a] - nx;
          const ddy = AY[a] - ny;
          if (ddx * ddx + ddy * ddy < kill * kill) {
            alive[a] = 0;
            left--;
          }
        }
      }
      iter++;
      if (!grew) {
        // stuck: kill the attractors nobody can reach without leaving the glyph, reseed
        const a = topmost();
        if (a < 0) break;
        seedAt(a);
      }
    }
    // birth: letters start in a left-to-right wave
    const wave = (li / Math.max(1, ink.length - 1)) * 0.32;
    const last = Math.max(1, iter);
    for (let i = letterStart; i < X.length; i++) BIRTH.push(wave + (iters[i - letterStart] / last) * 0.66);
  });

  // sort by birth (parents are always born first, so a stable sort keeps them ahead)
  const n = X.length;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => BIRTH[a] - BIRTH[b] || a - b);
  const remap = new Int32Array(n);
  order.forEach((old, i) => (remap[old] = i));
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const parent = new Int32Array(n);
  const birth = new Float32Array(n);
  order.forEach((old, i) => {
    x[i] = X[old] + x0;
    y[i] = Y[old] + y0;
    parent[i] = PAR[old] >= 0 ? remap[PAR[old]] : -1;
    birth[i] = BIRTH[old];
  });
  return {
    n,
    x,
    y,
    parent,
    birth,
    end(g: number) {
      let lo = 0;
      let hi = n;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (birth[mid] <= g) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
  };
}
