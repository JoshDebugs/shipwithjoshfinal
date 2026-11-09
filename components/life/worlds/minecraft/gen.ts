/**
 * THE SNAP — anamorphic voxel type.
 *
 * Each word is a pixel bitmap fitted into a screen rectangle. Its vantage is
 * a camera key. For every lit cell we take the cell's point P on an image
 * plane d0 in front of the vantage camera C, pick a depth factor k, and put a
 * cube at C + k·(P − C), scaled by k and turned to the camera's axes. By
 * similar triangles every cube's front face projects onto the same screen
 * tile, so from the vantage ~100 cubes spread through 40 m of sky read as one
 * crisp block word — one step away, parallax shears it back into debris.
 *
 * Rejection sampling keeps every other cube (other words, the storm, clouds)
 * out of each word's screen rectangle as seen from that word's vantage, and
 * caps k so words always sit in front of the island.
 */
import { Matrix4, Quaternion, Vector3 } from "three";
import { KEYS, RECEIPT_ID, RECEIPT_KEY, WORDS, receiptBox, type Block } from "./beats";
import { STORM_WEIGHTS } from "./colors";
import { receiptBitmap, textBitmap, type Bitmap } from "./glyphs";
import type { Box3 } from "./island";
import { Rig } from "./rig";

export type Placed = { id: number; cell: number; x0: number; y0: number; bmp: Bitmap };

export type Vantage = { pos: Vector3; quat: Quaternion; inv: Quaternion; tanY: number; aspect: number };

export type CloudBox = { p: [number, number, number]; s: [number, number, number]; seed: number };

export type Storm = {
  count: number;
  matrices: Float32Array;
  ink: Float32Array;
  word: Float32Array;
  seed: Float32Array;
  kfac: Float32Array;
  placed: Placed[];
  /** representative cell size (px) per word id */
  cellPx: number[];
  clouds: CloudBox[];
  wordCubes: number;
};

/** Seeded PRNG so the storm is identical on every visit. */
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const D0 = 18;
const K_MIN = 0.42;
const K_MAX = 2.5;
const GAP = 0.92;

function placeBlock(id: number, block: Block, W: number, H: number): Placed {
  const bmp = textBitmap(block.lines);
  let cell = Math.min((block.rect.w * W) / bmp.cols, (block.rect.h * H) / bmp.rows);
  if (block.maxCell) cell = Math.min(cell, block.maxCell);
  return { id, cell, x0: block.rect.cx * W - (bmp.cols * cell) / 2, y0: block.rect.cy * H - (bmp.rows * cell) / 2, bmp };
}

/** Every word block laid out in stage px for this stage size (shared with the DOM overlays). */
export function layoutWords(W: number, H: number): Placed[] {
  const portrait = W < H;
  const placed: Placed[] = [];
  for (const w of WORDS) for (const b of portrait ? w.port : w.land) placed.push(placeBlock(w.id, b, W, H));
  const box = receiptBox(W, H);
  const bmp = receiptBitmap();
  const cell = (0.52 * box.size) / bmp.cols;
  placed.push({ id: RECEIPT_ID, cell, x0: box.x + 0.24 * box.size, y0: box.y + 0.04 * box.size, bmp });
  return placed;
}

function rayBox(o: Vector3, d: Vector3, b: Box3): number {
  let tmin = 0;
  let tmax = Infinity;
  const os = [o.x, o.y, o.z];
  const ds = [d.x, d.y, d.z];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(ds[i]) < 1e-9) {
      if (os[i] < b.min[i] || os[i] > b.max[i]) return Infinity;
      continue;
    }
    let t1 = (b.min[i] - os[i]) / ds[i];
    let t2 = (b.max[i] - os[i]) / ds[i];
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return Infinity;
  }
  return tmin;
}

const inBox = (p: Vector3, b: Box3, pad: number) =>
  p.x > b.min[0] - pad && p.x < b.max[0] + pad && p.y > b.min[1] - pad && p.y < b.max[1] + pad && p.z > b.min[2] - pad && p.z < b.max[2] + pad;

export function buildStorm(W: number, H: number, opts: { lowPower: boolean; occluders: Box3[] }): Storm {
  const portrait = W < H;
  const aspect = W / H;
  const rig = new Rig(portrait);
  const rand = prng(0x5eed16);

  // vantage poses (exactly what the rig flies to)
  const vantages: Vantage[] = KEYS.map((_, i) => {
    const pos = new Vector3();
    const quat = new Quaternion();
    const fov = rig.pose(i, pos, quat);
    return { pos, quat, inv: quat.clone().invert(), tanY: Math.tan((fov * Math.PI) / 360), aspect };
  });

  const placed = layoutWords(W, H);
  const wordKey = (id: number) => (id === RECEIPT_ID ? RECEIPT_KEY : WORDS[id].key);

  // screen rects per word id (px, padded) for rejection
  const rects = new Map<number, { x0: number; y0: number; x1: number; y1: number; key: number }>();
  for (const pl of placed) {
    const pad = pl.cell * 0.8 + 8;
    const r = { x0: pl.x0 - pad, y0: pl.y0 - pad, x1: pl.x0 + pl.bmp.cols * pl.cell + pad, y1: pl.y0 + pl.bmp.rows * pl.cell + pad, key: wordKey(pl.id) };
    const prev = rects.get(pl.id);
    rects.set(pl.id, prev ? { x0: Math.min(prev.x0, r.x0), y0: Math.min(prev.y0, r.y0), x1: Math.max(prev.x1, r.x1), y1: Math.max(prev.y1, r.y1), key: r.key } : r);
  }
  const rectList = [...rects.entries()].map(([id, r]) => ({ id, ...r }));

  // camera path samples for lens clearance
  const path: Vector3[] = [];
  {
    const q = new Quaternion();
    for (let i = 0; i <= 180; i++) {
      const v = new Vector3();
      rig.pose((i / 180) * (KEYS.length - 1), v, q);
      path.push(v);
    }
  }

  const tmp = new Vector3();
  const project = (p: Vector3, v: Vantage) => {
    tmp.copy(p).sub(v.pos).applyQuaternion(v.inv);
    const depth = -tmp.z;
    if (depth < 0.25) return null;
    const nx = tmp.x / (depth * v.tanY * v.aspect);
    const ny = tmp.y / (depth * v.tanY);
    return { x: ((nx + 1) / 2) * W, y: ((1 - ny) / 2) * H, depth, scale: H / 2 / (depth * v.tanY) };
  };

  // keep the title card (key 0) and the closer line (last key) readable: no big blocks behind the type
  // (minPx: only cubes bigger than this on screen count; the island zone only bans big blocks in front of it)
  const zones = (portrait
    ? [
        { key: 0, x0: 0.06, y0: 0.17, x1: 0.94, y1: 0.66, minPx: 0 },
        { key: 0, x0: 0.2, y0: 0.6, x1: 0.8, y1: 0.98, minPx: 9 },
        { key: KEYS.length - 1, x0: 0.03, y0: 0.11, x1: 0.97, y1: 0.29, minPx: 0 },
      ]
    : [
        { key: 0, x0: 0.28, y0: 0.15, x1: 0.72, y1: 0.7, minPx: 0 },
        { key: 0, x0: 0.3, y0: 0.6, x1: 0.7, y1: 1, minPx: 12 },
        { key: KEYS.length - 1, x0: 0.14, y0: 0.11, x1: 0.86, y1: 0.27, minPx: 0 },
      ]
  ).map((z) => ({ key: z.key, x0: z.x0 * W, y0: z.y0 * H, x1: z.x1 * W, y1: z.y1 * H, minPx: z.minPx }));
  const inZone = (p: Vector3, r: number, minPx: number) => {
    for (const z of zones) {
      const pr = project(p, vantages[z.key]);
      if (!pr) continue;
      const rp = r * pr.scale;
      if (rp < Math.max(minPx, z.minPx)) continue;
      if (pr.x + rp > z.x0 && pr.x - rp < z.x1 && pr.y + rp > z.y0 && pr.y - rp < z.y1) return true;
    }
    return false;
  };

  /** true if a cube (centre p, radius r) would sit in another word's frame from that word's vantage */
  const blocksWord = (p: Vector3, r: number, ownKey: number) => {
    for (const rc of rectList) {
      if (rc.key === ownKey) continue;
      const pr = project(p, vantages[rc.key]);
      if (!pr) continue;
      const rp = r * pr.scale;
      if (pr.x + rp > rc.x0 && pr.x - rp < rc.x1 && pr.y + rp > rc.y0 && pr.y - rp < rc.y1) return true;
    }
    return false;
  };
  const nearPath = (p: Vector3, r: number, clear: number) => {
    for (const s of path) if (s.distanceToSquared(p) < (r + clear) * (r + clear)) return true;
    return false;
  };
  const inOccluder = (p: Vector3, r: number) => opts.occluders.some((b) => inBox(p, b, r + 0.6));

  const pickInk = () => {
    let u = rand();
    for (let i = 0; i < STORM_WEIGHTS.length; i++) {
      u -= STORM_WEIGHTS[i];
      if (u <= 0) return i;
    }
    return 0;
  };

  type Cube = { p: Vector3; q: Quaternion; s: number; ink: number; word: number; k: number };
  const cubes: Cube[] = [];

  // --- word cubes
  const C = new Vector3();
  const P = new Vector3();
  const dir = new Vector3();
  const X = new Vector3();
  const cellPx: number[] = [];
  for (const pl of placed) {
    const v = vantages[wordKey(pl.id)];
    cellPx[pl.id] = Math.max(cellPx[pl.id] ?? 0, pl.cell);
    const s0 = (pl.cell * 2 * D0 * v.tanY) / H; // cell size on the image plane
    C.copy(v.pos);
    for (const [cx, cy] of pl.bmp.cells) {
      const px = pl.x0 + (cx + 0.5) * pl.cell;
      const py = pl.y0 + (cy + 0.5) * pl.cell;
      const nx = (px / W) * 2 - 1;
      const ny = 1 - (py / H) * 2;
      P.set(nx * D0 * v.tanY * v.aspect, ny * D0 * v.tanY, -D0).applyQuaternion(v.quat).add(C);
      dir.copy(P).sub(C);
      const L = dir.length();
      dir.normalize();
      let tHit = Infinity;
      for (const b of opts.occluders) tHit = Math.min(tHit, rayBox(C, dir, b));
      const kCap = Math.max(K_MIN, Math.min(K_MAX, (tHit - 2.2) / L));
      let k = K_MIN;
      let ok = false;
      for (let tries = 0; tries < 18 && !ok; tries++) {
        k = K_MIN * Math.pow(kCap / K_MIN, rand());
        X.copy(C).addScaledVector(dir, k * L);
        const r = k * s0 * 0.87;
        ok = !blocksWord(X, r, wordKey(pl.id)) && !inOccluder(X, r * 0.5) && !nearPath(X, r, 0.9) && (tries > 11 || !inZone(X, r, 3));
      }
      cubes.push({ p: X.clone(), q: v.quat.clone(), s: k * s0 * GAP, ink: pickInk(), word: pl.id, k });
    }
  }
  const wordCubes = cubes.length;

  // --- the storm
  const nDebris = portrait ? 230 : opts.lowPower ? 520 : 980;
  const q = new Quaternion();
  const axis = new Vector3();
  let guard = 0;
  let made = 0;
  while (made < nDebris && guard++ < nDebris * 12) {
    const r = 8 + 46 * Math.pow(rand(), 0.85);
    const th = rand() * Math.PI * 2;
    const yy = (rand() * 2 - 1) * 0.92;
    const rr = Math.sqrt(1 - yy * yy);
    X.set(Math.cos(th) * rr * r, yy * r * 0.72 - 2, Math.sin(th) * rr * r);
    const big = rand() < 0.05;
    const size = big ? 1.1 + rand() * 0.6 : 0.2 + 0.78 * rand() * rand();
    const rad = size * 0.87;
    if (inOccluder(X, rad)) continue;
    if (nearPath(X, rad, 1.7)) continue;
    if (blocksWord(X, rad, -1)) continue;
    if (inZone(X, rad, 2.5)) continue;
    axis.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    q.setFromAxisAngle(axis, rand() * Math.PI * 2);
    cubes.push({ p: X.clone(), q: q.clone(), s: size, ink: pickInk(), word: -1, k: 1 });
    made++;
  }

  // --- a few square stars in the deep sky / void (never in front of anything)
  const nStars = portrait ? 34 : 80;
  for (let i = 0; i < nStars; i++) {
    const below = rand() < 0.62;
    const el = below ? -(14 + rand() * 66) : 24 + rand() * 56;
    const az = rand() * Math.PI * 2;
    const R = 300 + rand() * 40;
    const ce = Math.cos((el * Math.PI) / 180);
    X.set(Math.cos(az) * ce * R, Math.sin((el * Math.PI) / 180) * R, Math.sin(az) * ce * R);
    axis.set(rand(), rand(), rand()).normalize();
    q.setFromAxisAngle(axis, rand() * 3);
    cubes.push({ p: X.clone(), q: q.clone(), s: 1.1 + rand() * 1.5, ink: rand() < 0.7 ? 4 : 1, word: -2, k: 1 });
  }

  // --- clouds: flat cuboid clusters at three depths, kept out of every word's frame
  const clouds: CloudBox[] = [];
  const layers = portrait ? [{ y: 11, n: 4 }, { y: -12, n: 2 }] : [{ y: 11, n: 5 }, { y: 22, n: 4 }, { y: -12, n: 4 }];
  const cp = new Vector3();
  for (const layer of layers) {
    let placedN = 0;
    for (let attempt = 0; attempt < 60 && placedN < layer.n; attempt++) {
      const ang = rand() * Math.PI * 2;
      const dist = 14 + rand() * 34;
      const cx = Math.cos(ang) * dist;
      const cz = Math.sin(ang) * dist;
      const cy = layer.y + (rand() - 0.5) * 4;
      const parts: CloudBox[] = [];
      const nb = 3 + Math.floor(rand() * 3);
      for (let b = 0; b < nb; b++) {
        parts.push({
          p: [cx + (rand() - 0.5) * 7, cy + (b === 0 ? 0 : (rand() - 0.3) * 1.2), cz + (rand() - 0.5) * 5],
          s: [3 + rand() * 6, 0.9 + rand() * 0.8, 2 + rand() * 4],
          seed: rand(),
        });
      }
      const bad = parts.some((pt) => {
        cp.set(pt.p[0], pt.p[1], pt.p[2]);
        const rad = Math.max(pt.s[0], pt.s[2]) * 0.6;
        // drift is ±2.5 in x, so pad a little
        return inOccluder(cp, rad) || nearPath(cp, rad, 3) || blocksWord(cp, rad + 2.5, -1);
      });
      if (bad) continue;
      clouds.push(...parts);
      placedN++;
    }
  }

  // --- pack
  const count = cubes.length;
  const matrices = new Float32Array(count * 16);
  const ink = new Float32Array(count);
  const word = new Float32Array(count);
  const seed = new Float32Array(count);
  const kfac = new Float32Array(count);
  const m = new Matrix4();
  const sc = new Vector3();
  cubes.forEach((c, i) => {
    sc.setScalar(c.s);
    m.compose(c.p, c.q, sc);
    m.toArray(matrices, i * 16);
    ink[i] = c.ink;
    word[i] = c.word;
    seed[i] = rand();
    kfac[i] = c.k;
  });

  return { count, matrices, ink, word, seed, kfac, placed, cellPx, clouds, wordCubes };
}
