/**
 * The film script for "From My Angle": camera vantages, the words that lock at
 * each one, where they sit on screen, and the copy.
 *
 * progress 0 → 1 is mapped onto the camera keys with plateaus: inside a key's
 * `dwell` window the camera sits EXACTLY on that vantage (so its word is pixel
 * locked); between windows it flies with smootherstep easing.
 */
import { clamp, range } from "@/components/life/multiverse/ease";

export type V3 = [number, number, number];

export type CamKey = {
  /** progress window in which the camera holds this vantage exactly */
  dwell: [number, number];
  pos: V3;
  look: V3;
  /** camera roll, radians */
  roll: number;
  /** vertical field of view (landscape), degrees */
  fov: number;
  /** portrait overrides */
  pPos?: V3;
  pLook?: V3;
  pFov?: number;
  /** waypoints the flight to the NEXT key passes through (pos + look), e.g. to swing around the island */
  via?: { pos: V3; look: V3; pPos?: V3; pLook?: V3 }[];
};

export const KEYS: CamKey[] = [
  // 0 · title card: the island floats on the horizon, the storm all around
  { dwell: [0, 0.04], pos: [0, 4, 52], look: [0, 10.6, 0], roll: 0, fov: 40, pPos: [0, 4, 58], pLook: [0, 13, 0], pFov: 62 },
  // 1 · BEDWARS: banked left around the island, the bed below
  { dwell: [0.17, 0.255], pos: [-38, 11, 24], look: [1, 9.2, -1], roll: -0.1, fov: 42, pPos: [-46, 12, 29], pLook: [1, 9.5, -1], pFov: 64 },
  // 2 · SKYWARS: under the island, the bridge going out over the void
  // (the climb to MONTAGES swings out past the island's right flank instead of through its rock…)
  {
    dwell: [0.335, 0.42],
    pos: [24, -15, 25],
    look: [4, -9, -4],
    roll: 0.04,
    fov: 44,
    pPos: [30, -18, 31],
    pLook: [5, -15, -4],
    pFov: 66,
    // …then comes round behind the MONTAGES vantage, so its word cubes stay ahead of the lens
    via: [
      { pos: [31, 3, -4], look: [4, 4, -2], pPos: [37, 3, -4], pLook: [4, 4, -2] },
      { pos: [-6, 22, -56], look: [-6, 12, 0], pPos: [-8, 24, -64], pLook: [-6, 12, 0] },
    ],
  },
  // 3 · MONTAGES: back up through the clouds
  { dwell: [0.495, 0.58], pos: [-28, 20, -38], look: [2, 9, 4], roll: 0.06, fov: 42, pPos: [-33, 22, -45], pLook: [2, 8, 4], pFov: 64 },
  // 4 · ~400: swinging past the cube-sun
  { dwell: [0.65, 0.735], pos: [21, 5, -30], look: [33, 19, -108], roll: -0.03, fov: 42, pPos: [21, 5, -30], pLook: [32, 17, -108], pFov: 64 },
  // 5 · ALMOST WENT COMPETITIVE.: the god vantage, island far below
  { dwell: [0.805, 0.905], pos: [1, 54, 15], look: [0, 0, -18], roll: 0, fov: 44, pPos: [1, 64, 18], pLook: [0, 0, -16], pFov: 66 },
  // 6 · exit: back level with the sunset, the receipt locks
  { dwell: [0.975, 1], pos: [0, 10, 64], look: [0, 13.5, 0], roll: 0, fov: 40, pPos: [0, 10, 80], pLook: [0, 15.5, 0], pFov: 62 },
];

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** progress → continuous key parameter (integers = exact vantages). */
export function camParam(p: number): number {
  const n = KEYS.length;
  for (let i = 0; i < n; i++) {
    const [a, b] = KEYS[i].dwell;
    if (p <= b) {
      if (p >= a || i === 0) return i;
      const prevEnd = KEYS[i - 1].dwell[1];
      return i - 1 + smootherstep(clamp((p - prevEnd) / (a - prevEnd)));
    }
  }
  return n - 1;
}

/* ------------------------------------------------------------------ words */

/** Stage-fraction rectangle a block of pixel text is fitted into. */
export type Rect = { cx: number; cy: number; w: number; h: number };
export type Block = { lines: string[]; rect: Rect; maxCell?: number };

export type WordDef = {
  id: number;
  /** camera key it locks at */
  key: number;
  land: Block[];
  port: Block[];
};

/** Word ids double as shader slots (see colors.LOCKS). 6 = the receipt. */
export const WORDS: WordDef[] = [
  { id: 0, key: 1, land: [{ lines: ["BEDWARS"], rect: { cx: 0.5, cy: 0.27, w: 0.7, h: 0.22 } }], port: [{ lines: ["BED", "WARS"], rect: { cx: 0.5, cy: 0.3, w: 0.82, h: 0.26 } }] },
  { id: 1, key: 2, land: [{ lines: ["SKYWARS"], rect: { cx: 0.5, cy: 0.42, w: 0.7, h: 0.24 } }], port: [{ lines: ["SKY", "WARS"], rect: { cx: 0.5, cy: 0.53, w: 0.82, h: 0.26 } }] },
  { id: 2, key: 3, land: [{ lines: ["MONTAGES"], rect: { cx: 0.5, cy: 0.38, w: 0.72, h: 0.24 } }], port: [{ lines: ["MON", "TAGES"], rect: { cx: 0.5, cy: 0.36, w: 0.84, h: 0.28 } }] },
  { id: 3, key: 4, land: [{ lines: ["~400"], rect: { cx: 0.5, cy: 0.38, w: 0.48, h: 0.3 } }], port: [{ lines: ["~400"], rect: { cx: 0.5, cy: 0.36, w: 0.84, h: 0.16 } }] },
  { id: 4, key: 5, land: [{ lines: ["ALMOST"], rect: { cx: 0.5, cy: 0.215, w: 0.42, h: 0.12 } }], port: [{ lines: ["ALMOST"], rect: { cx: 0.5, cy: 0.24, w: 0.8, h: 0.1 } }] },
  {
    id: 5,
    key: 5,
    land: [{ lines: ["WENT", "COMPETITIVE."], rect: { cx: 0.5, cy: 0.49, w: 0.78, h: 0.34 } }],
    port: [
      { lines: ["WENT"], rect: { cx: 0.5, cy: 0.355, w: 0.6, h: 0.1 } },
      { lines: ["COMPETITIVE."], rect: { cx: 0.5, cy: 0.455, w: 0.92, h: 0.06 } },
    ],
  },
];

export const RECEIPT_ID = 6;
export const RECEIPT_KEY = 6;

/** The exit portal's icon box (stage px). The receipt voxels lock exactly inside it. */
export function receiptBox(w: number, h: number) {
  const portrait = w < h;
  const size = Math.round(Math.max(118, Math.min(portrait ? w * 0.4 : h * 0.26, 236)));
  const cx = w / 2;
  const cy = h * (portrait ? 0.42 : 0.4);
  return { x: Math.round(cx - size / 2), y: Math.round(cy - size / 2), size };
}

/* ------------------------------------------------------------------ copy */

export const COPY = {
  kicker: "World 07 — Minecraft",
  age: "Age 16. Obsessed with Minecraft.",
  aside: "(It was a phase. A very serious phase.)",
  headline: "It only makes sense from here.",
  closerA: "From outside: a kid playing a block game.",
  closerB: "From my angle: the whole plan.",
};

/** The five angles, in order: which key, which lock scheme, the caption. */
export const ANGLES = [
  { key: 1, scheme: 0, name: "BEDWARS", line: "Guard your bed. Break everyone else’s." },
  { key: 2, scheme: 1, name: "SKYWARS", line: "Spawn on an island. Bridge over nothing. Don’t look down." },
  { key: 3, scheme: 2, name: "MONTAGES", line: "Made montages. Clipped the fights, cut them to the beat." },
  { key: 4, scheme: 3, name: "~400", line: "~400 YouTube subscribers. Small channel. Big montage energy." },
  { key: 5, scheme: 5, name: "ALMOST WENT COMPETITIVE.", line: "Almost went competitive. The ‘almost’ is doing a lot of heavy lifting." },
] as const;

/** How "on" a caption for key k is at progress p (0..1). */
export function angleShow(p: number, k: number) {
  const [a, b] = KEYS[k].dwell;
  return Math.min(range(p, a - 0.012, a + 0.004), 1 - range(p, b - 0.002, b + 0.016));
}
