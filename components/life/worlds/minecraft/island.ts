/**
 * The sky island, built from code: a voxel blob (teal grass, sun-dirt, stone)
 * stepping down to a tip, a chunky tree, a little bed, a pool that spills a
 * waterfall. Meshed once with hidden-face culling and per-vertex AO, colours
 * baked from the Riso shades (no lights, no textures).
 *
 * Also: the "reaction" blocks — the bed-defense dome (BEDWARS) and the bridge
 * (SKYWARS) — as cell lists with the progress at which each block appears.
 */
import { hash } from "@/components/life/multiverse/ease";
import { LAND, rgb, type RGB } from "./colors";

type Mat = { top: RGB; base: RGB; shade: RGB; dark: RGB };
const m = (top: string, base: string, shade: string, dark: string): Mat => ({ top: rgb(top), base: rgb(base), shade: rgb(shade), dark: rgb(dark) });

export const MATS = {
  grass: m(LAND.grassTop, LAND.grass, LAND.grassShade, LAND.grassDark),
  dirt: m(LAND.dirt, LAND.dirt, LAND.dirtShade, LAND.dirtDark),
  stone: m(LAND.stone, LAND.stone, LAND.stoneShade, LAND.stoneDark),
  leaf: m(LAND.leafTop, LAND.leaf, LAND.leafShade, LAND.leafShade),
  trunk: m(LAND.trunk, LAND.trunk, LAND.trunkShade, LAND.trunkShade),
  wool: m(LAND.woolTop, LAND.wool, LAND.woolShade, LAND.woolShade),
  pillow: m(LAND.pillow, LAND.pillow, LAND.pillowShade, LAND.pillowShade),
  water: m(LAND.waterTop, LAND.water, LAND.water, LAND.water),
  glass: m(LAND.glassTop, LAND.glass, LAND.glassShade, LAND.glassShade),
  brick: m(LAND.brickTop, LAND.brick, LAND.brickShade, LAND.brickShade),
} as const;
export type MatId = keyof typeof MATS;

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

export type Box3 = { min: [number, number, number]; max: [number, number, number] };

export type Island = {
  positions: Float32Array;
  colors: Float32Array;
  /** world-space boxes words must stay in front of */
  occluders: Box3[];
  /** where the pool spills over the edge */
  fall: [number, number, number];
  bed: [number, number, number];
};

const BED: [number, number, number][] = [
  [2, 1, 1],
  [3, 1, 1],
];

/** Top-layer footprint: an irregular blob, deterministic. */
function inside(x: number, z: number, layer: number) {
  const s = [1, 0.93, 0.83, 0.7, 0.56, 0.42, 0.28, 0.15][layer] ?? 0;
  if (s <= 0) return false;
  const rx = 6.3 * s;
  const rz = 5.1 * s;
  const wob = (hash(x * 13.1 + z * 7.7 + layer * 3.3) - 0.5) * 0.34;
  const d = (x / rx) ** 2 + (z / rz) ** 2;
  return d <= 1 + wob;
}

export function buildIsland(): Island {
  const vox = new Map<string, MatId>();
  const put = (x: number, y: number, z: number, mat: MatId) => vox.set(key(x, y, z), mat);

  for (let layer = 0; layer < 8; layer++) {
    const y = -layer;
    for (let x = -7; x <= 7; x++)
      for (let z = -6; z <= 6; z++) {
        if (!inside(x, z, layer)) continue;
        if (layer > 0 && !vox.has(key(x, y + 1, z))) continue;
        const r = hash(x * 3.7 + z * 11.3 + layer * 5.1);
        const mat: MatId = layer === 0 ? "grass" : layer <= 2 ? (r > 0.86 ? "stone" : "dirt") : r > 0.88 ? "dirt" : "stone";
        put(x, y, z, mat);
      }
  }

  // the pool on the left edge, spilling over
  let fall: [number, number, number] = [-6, 0, 1];
  for (let x = -7; x <= 0; x++) {
    if (vox.has(key(x, 0, 1))) {
      fall = [x, 0, 1];
      put(x, 0, 1, "water");
      put(x + 1, 0, 1, "water");
      put(x + 1, 0, 2, "water");
      break;
    }
  }

  // tree: trunk + chunky canopy (left third)
  const tx = -3;
  const tz = -2;
  for (let y = 1; y <= 3; y++) put(tx, y, tz, "trunk");
  for (let x = tx - 2; x <= tx + 2; x++)
    for (let z = tz - 2; z <= tz + 2; z++)
      for (let y = 4; y <= 5; y++) {
        const corner = Math.abs(x - tx) === 2 && Math.abs(z - tz) === 2;
        if (corner && (y === 5 || hash(x * 5 + z * 9 + y) > 0.5)) continue;
        put(x, y, z, "leaf");
      }
  for (let x = tx - 1; x <= tx + 1; x++) for (let z = tz - 1; z <= tz + 1; z++) put(x, 6, z, "leaf");

  // the bed
  put(BED[0][0], BED[0][1], BED[0][2], "wool");
  put(BED[1][0], BED[1][1], BED[1][2], "pillow");

  // --- mesh
  const pos: number[] = [];
  const col: number[] = [];
  const solid = (x: number, y: number, z: number) => vox.has(key(x, y, z));
  // face: normal, two tangents, colour slot
  const FACES: { n: [number, number, number]; u: [number, number, number]; v: [number, number, number]; slot: keyof Mat }[] = [
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], slot: "top" },
    { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], slot: "dark" },
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], slot: "base" },
    { n: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], slot: "base" },
    { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], slot: "shade" },
    { n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0], slot: "shade" },
  ];
  const AO = [0, 0.13, 0.24, 0.34];
  const shadeInk = rgb(LAND.stoneDark);

  for (const [k, mat] of vox) {
    const [x, y, z] = k.split(",").map(Number);
    for (const f of FACES) {
      const [nx, ny, nz] = f.n;
      if (solid(x + nx, y + ny, z + nz)) continue;
      const c = MATS[mat][f.slot];
      const corners: [number, number][] = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ];
      const vs = corners.map(([su, sv]) => {
        const s1 = solid(x + nx + f.u[0] * su, y + ny + f.u[1] * su, z + nz + f.u[2] * su) ? 1 : 0;
        const s2 = solid(x + nx + f.v[0] * sv, y + ny + f.v[1] * sv, z + nz + f.v[2] * sv) ? 1 : 0;
        const cc = solid(x + nx + f.u[0] * su + f.v[0] * sv, y + ny + f.u[1] * su + f.v[1] * sv, z + nz + f.u[2] * su + f.v[2] * sv) ? 1 : 0;
        const ao = s1 && s2 ? 3 : s1 + s2 + cc;
        const t = AO[ao];
        const px = x + (nx + f.u[0] * su + f.v[0] * sv) * 0.5;
        const py = y + (ny + f.u[1] * su + f.v[1] * sv) * 0.5;
        const pz = z + (nz + f.u[2] * su + f.v[2] * sv) * 0.5;
        // AO = overprint toward a cool stone shadow
        const shaded: RGB = [c[0] * (1 - t + t * shadeInk[0]), c[1] * (1 - t + t * shadeInk[1]), c[2] * (1 - t + t * shadeInk[2])];
        return { p: [px, py, pz], c: shaded, ao };
      });
      // flip the quad diagonal to keep AO gradients symmetric
      const order = vs[0].ao + vs[2].ao > vs[1].ao + vs[3].ao ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3];
      // winding: make the triangle face the normal
      const a = vs[order[0]].p;
      const b = vs[order[1]].p;
      const cpt = vs[order[2]].p;
      const cross = [
        (b[1] - a[1]) * (cpt[2] - a[2]) - (b[2] - a[2]) * (cpt[1] - a[1]),
        (b[2] - a[2]) * (cpt[0] - a[0]) - (b[0] - a[0]) * (cpt[2] - a[2]),
        (b[0] - a[0]) * (cpt[1] - a[1]) - (b[1] - a[1]) * (cpt[0] - a[0]),
      ];
      const flip = cross[0] * nx + cross[1] * ny + cross[2] * nz < 0;
      const ord = flip ? [order[0], order[2], order[1], order[3], order[5], order[4]] : order;
      for (const i of ord) {
        pos.push(...vs[i].p);
        col.push(...vs[i].c);
      }
    }
  }

  const occluders: Box3[] = [
    { min: [-7.6, -8.6, -6.6], max: [7.6, 1.6, 6.6] },
    { min: [tx - 2.6, 0.5, tz - 2.6], max: [tx + 2.6, 6.6, tz + 2.6] },
    // dome
    { min: [-1.6, 0.5, -2.6], max: [6.6, 4.6, 4.6] },
    // bridge
    { min: [5.5, -0.6, 0.4], max: [18.6, 0.6, 1.6] },
    // waterfall
    { min: [fall[0] - 2.2, -34, 0], max: [fall[0] + 0.5, 0.6, 3] },
  ];

  return { positions: new Float32Array(pos), colors: new Float32Array(col), occluders, fall, bed: [2.5, 1, 1] };
}

/* ------------------------------------------------------------- reactions */

export type ReactionCell = { p: [number, number, number]; mat: MatId; t: number };

/**
 * Bed defense (BEDWARS) — wool, then glass, then brick, layer by layer —
 * and the bridge (SKYWARS), one block per scroll tick.
 */
export function buildReactions(domeFrom: number, domeTo: number, bridgeFrom: number, bridgeTo: number): ReactionCell[] {
  const cells: { p: [number, number, number]; mat: MatId; order: number }[] = [];
  const onIsland = (x: number, z: number) => inside(x, z, 0);
  for (let x = -2; x <= 7; x++)
    for (let y = 1; y <= 4; y++)
      for (let z = -3; z <= 5; z++) {
        if (BED.some((b) => b[0] === x && b[1] === y && b[2] === z)) continue;
        if (!onIsland(x, z)) continue;
        const dx = x < 2 ? 2 - x : x > 3 ? x - 3 : 0;
        const dy = y - 1;
        const dz = Math.abs(z - 1);
        const e = Math.sqrt(dx * dx + dy * dy * 1.1 + dz * dz);
        let layer = -1;
        if (e <= 1.45) layer = 0;
        else if (e <= 2.3) layer = 1;
        if (layer < 0) continue;
        const ang = Math.atan2(z - 1, x - 2.5);
        cells.push({ p: [x, y, z], mat: layer === 0 ? "wool" : "glass", order: layer * 100 + dy * 10 + (ang + Math.PI) / (Math.PI * 2) });
      }
  cells.sort((a, b) => a.order - b.order);
  const out: ReactionCell[] = cells.map((c, i) => ({ p: c.p, mat: c.mat, t: domeFrom + ((domeTo - domeFrom) * i) / cells.length }));

  // bridge off the right edge
  let x0 = 7;
  while (x0 > 0 && !inside(x0, 1, 0)) x0--;
  const n = 11;
  for (let i = 0; i < n; i++) out.push({ p: [x0 + 1 + i, 0, 1], mat: "brick", t: bridgeFrom + ((bridgeTo - bridgeFrom) * i) / n });
  return out;
}
