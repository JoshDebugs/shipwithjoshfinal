/**
 * Repotted — geometry.
 *
 * Everything lives in "plant units": x = 0 is the stem, y grows downward and
 * pot 01 is one unit wide. The five pots are house-shaped and strictly nested
 * (each interior holds the previous root ball with air all round), so when the
 * last pot falls away the walls the roots ran along read as five nested
 * house rings.
 */

export type Pt = [number, number];

export type PotKind = "gable" | "tall" | "wide" | "flat" | "double";

export type Pot = {
  index: number;
  kind: PotKind;
  /** Interior (the soil / root ball), clockwise on screen. */
  inner: Pt[];
  /** Outer glaze surface (inner offset by the wall). */
  outer: Pt[];
  wall: number;
  /** Soil top at the stem (x = 0): where the sprout comes out. */
  top: number;
  bottom: number;
  hw: number;
  /** Highest interior point (smallest y). */
  peak: number;
  /** Decorative chimney stub on the roof (outer coords): x0, y0, x1, y1. */
  chimney: [number, number, number, number];
  /** Inner perimeter length. */
  perimeter: number;
};

/* ------------------------------------------------------------ polygons */

export function signedArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}

/** Miter offset; d > 0 grows the polygon outward. */
export function offsetPolygon(poly: Pt[], d: number): Pt[] {
  const n = poly.length;
  const s = signedArea(poly) > 0 ? 1 : -1;
  const lines: { px: number; py: number; dx: number; dy: number }[] = [];
  for (let i = 0; i < n; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[(i + 1) % n];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (s * dy) / len;
    const ny = (-s * dx) / len;
    lines.push({ px: ax + nx * d, py: ay + ny * d, dx, dy });
  }
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const L1 = lines[(i - 1 + n) % n];
    const L2 = lines[i];
    const cr = L1.dx * L2.dy - L1.dy * L2.dx;
    if (Math.abs(cr) < 1e-9) {
      out.push([L2.px, L2.py]);
      continue;
    }
    const t = ((L2.px - L1.px) * L2.dy - (L2.py - L1.py) * L2.dx) / cr;
    out.push([L1.px + L1.dx * t, L1.py + L1.dy * t]);
  }
  return out;
}

export function pointInPolygon(x: number, y: number, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi) inside = !inside;
  }
  return inside;
}

/** Distance from a point to the polygon outline, plus where along the outline (arc length from vertex 0). */
export function nearestOnOutline(x: number, y: number, poly: Pt[]): { d: number; arc: number } {
  let best = Infinity;
  let bestArc = 0;
  let acc = 0;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[(i + 1) % poly.length];
    const dx = bx - ax;
    const dy = by - ay;
    const L2 = dx * dx + dy * dy || 1e-12;
    let t = ((x - ax) * dx + (y - ay) * dy) / L2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = ax + dx * t;
    const qy = ay + dy * t;
    const d = Math.hypot(x - qx, y - qy);
    const len = Math.sqrt(L2);
    if (d < best) {
      best = d;
      bestArc = acc + len * t;
    }
    acc += len;
  }
  return { d: best, arc: bestArc };
}

export function perimeterOf(poly: Pt[]): number {
  let p = 0;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[(i + 1) % poly.length];
    p += Math.hypot(bx - ax, by - ay);
  }
  return p;
}

/** Point at arc length `s` along the outline (wraps). */
export function pointAtArc(poly: Pt[], s: number, perimeter = perimeterOf(poly)): Pt {
  let r = ((s % perimeter) + perimeter) % perimeter;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[(i + 1) % poly.length];
    const len = Math.hypot(bx - ax, by - ay);
    if (r <= len || i === poly.length - 1) {
      const t = len ? Math.min(1, r / len) : 0;
      return [ax + (bx - ax) * t, ay + (by - ay) * t];
    }
    r -= len;
  }
  return poly[0];
}

export function bboxOf(poly: Pt[]): [number, number, number, number] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of poly) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

export function polyPath(poly: Pt[], close = true): string {
  let d = "";
  for (let i = 0; i < poly.length; i++) d += `${i ? "L" : "M"}${poly[i][0].toFixed(4)} ${poly[i][1].toFixed(4)}`;
  return close ? d + "Z" : d;
}

/* ---------------------------------------------------------------- pots */

const gable = (hw: number, eave: number, top: number, bottom: number): Pt[] => [
  [-hw, bottom],
  [-hw, eave],
  [0, top],
  [hw, eave],
  [hw, bottom],
];

const flat = (hw: number, top: number, bottom: number): Pt[] => [
  [-hw, bottom],
  [-hw, top],
  [hw, top],
  [hw, bottom],
];

const double = (hw: number, eave: number, peak: number, valley: number, bottom: number): Pt[] => [
  [-hw, bottom],
  [-hw, eave],
  [-hw / 2, peak],
  [0, valley],
  [hw / 2, peak],
  [hw, eave],
  [hw, bottom],
];

/** Gable, tall & narrow, wide, flat roof, double gable — generic houses, each holding the last. */
function buildPots(): Pot[] {
  const specs: { kind: PotKind; inner: Pt[]; wall: number; top: number; bottom: number; hw: number }[] = [
    { kind: "gable", inner: gable(0.5, -0.42, -0.9, 0.5), wall: 0.085, top: -0.9, bottom: 0.5, hw: 0.5 },
    { kind: "tall", inner: gable(0.72, -0.78, -1.38, 0.92), wall: 0.095, top: -1.38, bottom: 0.92, hw: 0.72 },
    { kind: "wide", inner: gable(1.35, -1.18, -1.63, 1.3), wall: 0.105, top: -1.63, bottom: 1.3, hw: 1.35 },
    { kind: "flat", inner: flat(1.69, -1.95, 1.68), wall: 0.115, top: -1.95, bottom: 1.68, hw: 1.69 },
    { kind: "double", inner: double(2.03, -2.1, -2.85, -2.3, 2.08), wall: 0.125, top: -2.3, bottom: 2.08, hw: 2.03 },
  ];
  return specs.map((s, index) => {
    const outer = offsetPolygon(s.inner, s.wall);
    const [, peak] = bboxOf(s.inner);
    // chimney on the right-hand roof slope (outer coords)
    const cw = 0.055 + index * 0.018;
    let cx: number;
    let roofY: number;
    if (s.kind === "flat") {
      cx = s.hw * 0.55;
      roofY = s.top - s.wall;
    } else if (s.kind === "double") {
      cx = s.hw * 0.78;
      const peakX = s.hw / 2;
      const eaveY = -2.1;
      const t = (cx - peakX) / (s.hw - peakX);
      roofY = -2.85 + (eaveY - -2.85) * t - s.wall;
    } else {
      cx = s.hw * 0.52;
      const eaveY = s.inner[1][1];
      roofY = s.top + (eaveY - s.top) * (cx / s.hw) - s.wall;
    }
    const ch = 0.13 + index * 0.05;
    const chimney: [number, number, number, number] = [cx - cw, roofY - ch, cx + cw, roofY + 0.08];
    return { index, kind: s.kind, inner: s.inner, outer, wall: s.wall, top: s.top, bottom: s.bottom, hw: s.hw, peak, chimney, perimeter: perimeterOf(s.inner) };
  });
}

export const POTS: Pot[] = buildPots();

/** Arc length of the stem exit (x = 0 on the roof) along a pot's inner outline. */
export function apexArc(pot: Pot): number {
  return nearestOnOutline(0, pot.top, pot.inner).arc;
}

/** 0 at the stem exit, 1 at the bottom centre, measured both ways round the house. */
export function ringParam(pot: Pot, arc: number, apex = apexArc(pot)): number {
  const P = pot.perimeter;
  const r = (((arc - apex) % P) + P) % P;
  return Math.min(r, P - r) / (P / 2);
}

/* -------------------------------------------------------------- shards */

export type Shard = { poly: Pt[]; cx: number; cy: number };

/** Break a pot's wall band into jagged shards (for the pot that shatters). */
export function shardsOf(pot: Pot, count: number, rand: () => number): Shard[] {
  const P = pot.perimeter;
  const cuts: number[] = [];
  for (let i = 0; i < count; i++) cuts.push(((i + 0.25 + rand() * 0.5) / count) * P);
  const outerP = perimeterOf(pot.outer);
  const k = outerP / P;
  const shards: Shard[] = [];
  for (let i = 0; i < count; i++) {
    const a = cuts[i];
    const b = i + 1 < count ? cuts[i + 1] : cuts[0] + P;
    const inner: Pt[] = [];
    const outer: Pt[] = [];
    const steps = Math.max(3, Math.ceil(((b - a) / P) * 40));
    for (let j = 0; j <= steps; j++) {
      const s = a + ((b - a) * j) / steps;
      inner.push(pointAtArc(pot.inner, s, P));
      outer.push(pointAtArc(pot.outer, s * k, outerP));
    }
    // jagged break line at each end
    const jag = (p: Pt, q: Pt): Pt => {
      const t = 0.35 + rand() * 0.3;
      const nx = q[1] - p[1];
      const ny = p[0] - q[0];
      const off = (rand() - 0.5) * 0.9;
      return [p[0] + (q[0] - p[0]) * t + nx * off, p[1] + (q[1] - p[1]) * t + ny * off];
    };
    const poly: Pt[] = [...inner, jag(inner[inner.length - 1], outer[outer.length - 1]), ...outer.reverse(), jag(outer[outer.length - 1], inner[0])];
    let cx = 0;
    let cy = 0;
    for (const [x, y] of poly) {
      cx += x;
      cy += y;
    }
    shards.push({ poly, cx: cx / poly.length, cy: cy / poly.length });
  }
  return shards;
}

/* -------------------------------------------------------------- island */

/** The next world's portal icon (floating voxel island), in its 100×100 box. */
export const ISLAND_BODY: Pt[] = [
  [10, 34], [90, 34], [90, 58], [82, 58], [82, 68], [72, 68], [72, 78], [60, 78], [60, 90],
  [40, 90], [40, 78], [28, 78], [28, 68], [18, 68], [18, 58], [10, 58],
];
export const ISLAND_TRUNK: [number, number, number, number] = [24, 22, 7, 13];
export const ISLAND_CANOPY: [number, number, number, number] = [15, 6, 25, 18];

export type IslandCell = { x: number; y: number; part: "grass" | "dirt" | "trunk" | "leaf"; row: number };

/** Grid cells (icon units, `g` wide) that make up the island. */
export function islandCells(g: number): IslandCell[] {
  const cells: IslandCell[] = [];
  const inRect = (x: number, y: number, r: [number, number, number, number]) => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3];
  for (let y = 4; y < 92; y += g) {
    for (let x = 8; x < 92; x += g) {
      const cx = x + g / 2;
      const cy = y + g / 2;
      let part: IslandCell["part"] | null = null;
      if (pointInPolygon(cx, cy, ISLAND_BODY)) part = cy < 34 + g ? "grass" : "dirt";
      else if (inRect(cx, cy, ISLAND_CANOPY)) part = "leaf";
      else if (inRect(cx, cy, ISLAND_TRUNK)) part = "trunk";
      if (part) cells.push({ x, y, part, row: Math.round((y - 4) / g) });
    }
  }
  return cells;
}

/* ------------------------------------------------------------------ rng */

/** Small seeded PRNG (mulberry32) — growth and debris are identical on every load. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
