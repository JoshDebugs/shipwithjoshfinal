/**
 * Points on (and inside) the gavel silhouette — the next world's portal icon —
 * in icon units (0…100). The followers stream onto these at the exit.
 *
 * The shape is rasterised from the same geometry as PORTAL_ICONS.gavel, then
 * the outline is resampled with farthest-point sampling so the eyes sit evenly.
 */

const RES = 200;
const K = RES / 100;

function drawGavel(ctx: CanvasRenderingContext2D) {
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
    ctx.fill();
  };
  ctx.save();
  ctx.scale(K, K);
  ctx.fillStyle = "#000";
  // head + caps, rotated -35° about (42, 34)
  ctx.save();
  ctx.translate(42, 34);
  ctx.rotate((-35 * Math.PI) / 180);
  ctx.translate(-42, -34);
  rr(16, 19, 52, 30, 6);
  rr(11, 16, 9, 36, 3);
  rr(64, 16, 9, 36, 3);
  ctx.restore();
  // handle
  ctx.beginPath();
  ctx.moveTo(48.6, 47.7);
  ctx.lineTo(55.4, 42.3);
  ctx.lineTo(86.4, 81.3);
  ctx.lineTo(79.6, 86.7);
  ctx.closePath();
  ctx.fill();
  // sound block
  rr(8, 82, 48, 12, 4);
  ctx.restore();
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type GavelPoints = {
  /** evenly spaced outline points, ordered around the shape's centre */
  outline: Float32Array;
  /** random interior points */
  inner: Float32Array;
};

export function sampleGavel(outlineCount: number, innerCount: number, seed = 7): GavelPoints {
  const outline = new Float32Array(outlineCount * 2);
  const inner = new Float32Array(innerCount * 2);
  if (typeof document === "undefined") return { outline, inner };
  const c = document.createElement("canvas");
  c.width = RES;
  c.height = RES;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { outline, inner };
  drawGavel(ctx);
  const a = ctx.getImageData(0, 0, RES, RES).data;
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < RES && y < RES && a[(y * RES + x) * 4 + 3] > 127;

  const edge: number[] = [];
  const fillPts: number[] = [];
  for (let y = 0; y < RES; y++) {
    for (let x = 0; x < RES; x++) {
      if (!on(x, y)) continue;
      if (!on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1)) edge.push(x, y);
      else fillPts.push(x, y);
    }
  }
  const m = edge.length / 2;
  if (!m) return { outline, inner };

  // farthest-point sampling along the edge
  const minD = new Float32Array(m).fill(Infinity);
  const chosen: number[] = [];
  let cur = 0;
  for (let k = 0; k < outlineCount; k++) {
    chosen.push(cur);
    const cx = edge[cur * 2];
    const cy = edge[cur * 2 + 1];
    let best = 0;
    let bestD = -1;
    for (let j = 0; j < m; j++) {
      const dx = edge[j * 2] - cx;
      const dy = edge[j * 2 + 1] - cy;
      const d = dx * dx + dy * dy;
      if (d < minD[j]) minD[j] = d;
      if (minD[j] > bestD) {
        bestD = minD[j];
        best = j;
      }
    }
    cur = best;
  }
  // order around the centroid so neighbouring followers land next to each other
  const gx = 47 * K;
  const gy = 52 * K;
  chosen.sort((i, j) => Math.atan2(edge[i * 2 + 1] - gy, edge[i * 2] - gx) - Math.atan2(edge[j * 2 + 1] - gy, edge[j * 2] - gx));
  chosen.forEach((j, k) => {
    outline[k * 2] = (edge[j * 2] + 0.5) / K;
    outline[k * 2 + 1] = (edge[j * 2 + 1] + 0.5) / K;
  });

  const r = rng(seed);
  const pool = fillPts.length ? fillPts : edge;
  const n = pool.length / 2;
  for (let k = 0; k < innerCount; k++) {
    const j = Math.floor(r() * n);
    inner[k * 2] = (pool[j * 2] + 0.5) / K;
    inner[k * 2 + 1] = (pool[j * 2 + 1] + 0.5) / K;
  }
  return { outline, inner };
}

export { rng };
