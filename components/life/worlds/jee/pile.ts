/**
 * The pile: about two years of study books, as a fixed seeded layout.
 * Once it has landed it is never touched again.
 */

import { hash } from "@/components/life/multiverse/ease";
import { RISO, overprint } from "@/components/life/multiverse/palette";

export type Book = {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  yaw: number;
  pitch: number;
  color: [number, number, number];
  /** Build time (0…1) at which this book starts to fall; < 0 means already on the desk at the title card. */
  delay: number;
  fall: number;
};

const toRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const COVERS = [
  RISO.pink,
  RISO.cobalt,
  RISO.sun,
  RISO.teal,
  RISO.paper,
  RISO.pink,
  RISO.cobalt,
  RISO.ink,
  RISO.sun,
  overprint(RISO.pink, RISO.sun),
  RISO.teal,
  overprint(RISO.cobalt, RISO.teal),
].map(toRgb);

type Column = [x: number, z: number, count: number];

const DESKTOP: Column[] = [
  [0, 0, 15],
  [-0.92, 0.28, 11],
  [0.98, 0.18, 12],
  [-0.46, -0.62, 9],
  [0.55, -0.72, 8],
  [-1.5, -0.14, 6],
  [1.66, -0.24, 7],
  [0.22, 0.8, 5],
  [-0.82, 0.98, 3],
  [1.06, 0.96, 3],
];

const PHONE: Column[] = [
  [0, 0, 14],
  [-0.56, 0.2, 9],
  [0.58, 0.14, 10],
  [-0.26, -0.5, 7],
  [0.32, -0.54, 6],
  [0.06, 0.62, 4],
];

export function buildBooks(low: boolean): Book[] {
  const cols = low ? PHONE : DESKTOP;
  const widest = low ? 0.82 : 0.94;
  const books: Book[] = [];
  let seed = 1;
  const rand = () => hash(seed++ * 1.37 + 0.11);

  cols.forEach(([cx, cz, count], ci) => {
    let y = 0;
    for (let i = 0; i < count; i++) {
      const w = widest - rand() * 0.28;
      const d = 0.48 + rand() * 0.2;
      const h = 0.052 + rand() * 0.062;
      const quarter = Math.floor(rand() * 4);
      const yaw = (quarter * Math.PI) / 2 + (rand() - 0.5) * 0.34;
      const jitter = 0.04 + (i / count) * 0.05;
      const x = cx + (rand() - 0.5) * jitter * 2;
      const z = cz + (rand() - 0.5) * jitter * 2;
      y += h / 2;
      const color = COVERS[Math.floor(rand() * COVERS.length)];
      // the centre column's first 8 are the small messy stack of the title card
      const seedStack = ci === 0 && i < 8;
      const wave = y / 1.5;
      const delay = seedStack ? -1 : Math.min(0.86, wave * 0.72 + rand() * 0.14);
      books.push({ x, y, z, w, h, d, yaw, pitch: 0, color, delay, fall: 6.5 + rand() * 2.5 });
      y += h / 2;
    }
  });

  // a few books slid off and leaning, so the mound reads as a pile and not a chart
  const leaners: [number, number, number, number, number][] = low
    ? [
        [0.98, 0.34, 0.18, 0.5, -0.5],
        [-0.98, 0.3, 0.1, -0.5, 0.45],
      ]
    : [
        [1.42, 0.5, 0.42, 0.45, -0.55],
        [-1.22, 0.42, 0.48, -0.42, 0.5],
        [0.5, 0.8, 0.5, 0.4, 0.5],
        [-0.36, 0.86, 0.62, -0.3, -0.5],
        [1.95, 0.32, -0.1, 0.5, -0.62],
      ];
  for (const [x, y, z, yaw, pitch] of leaners) {
    books.push({
      x,
      y,
      z,
      w: 0.82 - rand() * 0.18,
      h: 0.07 + rand() * 0.04,
      d: 0.56 + rand() * 0.12,
      yaw,
      pitch,
      color: COVERS[Math.floor(rand() * COVERS.length)],
      delay: 0.72 + rand() * 0.14,
      fall: 7.5,
    });
  }
  return books;
}
