/**
 * What is printed on the cube, and the moves that shred and solve it.
 *
 * The solve is written as three layer-preserving phases (top layer → middle
 * band → bottom band) and the scramble is its exact inverse, so scrolling
 * down plays scramble → solve and scrolling up plays it all backwards.
 *   P1 — anything (solves the top face + band 1)
 *   P2 — preserves the top layer   (locks band 2)
 *   P3 — preserves top + middle    (locks band 3)
 * P3 ends with R’, so the very first scramble move is R: the right third of
 * the "poster" swings away.
 */

import { RISO, overprint } from "@/components/life/multiverse/palette";
import { invert, parse, playAll, solved, STICKERS, type CubeState, type FaceId, type Move } from "./cube";

/* ------------------------------------------------------------------ inks */

export const VERMILION = overprint(RISO.pink, RISO.sun);

export type StickerInk = { bg: string; fg: string; pattern: "grid" | "dots" | "zigzag" | "grain" | "pinstripe" | "checker" };

/** Sticker inks per face (U paper poster, D pink punchline, F cobalt lead). */
export const FACE_INK: Record<FaceId, StickerInk> = {
  U: { bg: RISO.paper, fg: RISO.ink, pattern: "grid" },
  D: { bg: RISO.pink, fg: RISO.ink, pattern: "zigzag" },
  F: { bg: RISO.cobalt, fg: RISO.paper, pattern: "pinstripe" },
  B: { bg: RISO.teal, fg: RISO.paper, pattern: "checker" },
  R: { bg: RISO.sun, fg: RISO.ink, pattern: "dots" },
  L: { bg: VERMILION, fg: RISO.ink, pattern: "grain" },
};

/* ------------------------------------------------------------------ copy */

/**
 * Nine 3-character tiles per face, row-major as seen from outside (U seen
 * from above with B at the top; D seen from below with F at the top).
 * Bands are the rows of F → R → B → L, so they read around the cube.
 * Empty tiles carry a printer's mark instead of type.
 */
const T = (s: string) => s.padEnd(9, " ").match(/.{3}/g)!;

const BAND1 = { F: "7+ CUBES.", R: "DIFFERENT", B: "PUZZLE", L: "TYPES." };
const BAND2 = { F: " TIME", R: "SPENT:", B: "WAYTOO", L: " MUCH." };
const BAND3 = { F: "GOING TOO", R: " DEEP", B: " INTO", L: "THINGS?" };

export const FACE_TEXT: Record<FaceId, string[]> = {
  U: [...T("SCRAMBLED"), ...T("AT AGE 14"), ...T("WORLD 03.")],
  D: [...T(" YEAH."), ...T(" IT'S A"), ...T("HABIT.")],
  F: [...T(BAND1.F), ...T(BAND2.F), ...T(BAND3.F)],
  R: [...T(BAND1.R), ...T(BAND2.R), ...T(BAND3.R)],
  B: [...T(BAND1.B), ...T(BAND2.B), ...T(BAND3.B)],
  L: [...T(BAND1.L), ...T(BAND2.L), ...T(BAND3.L)],
};

export const MARKS = ["dot", "plus", "ring", "bar"] as const;
export type Mark = (typeof MARKS)[number];

export type StickerPrint = { text: string; mark: Mark | null; ink: StickerInk; face: FaceId };

export const PRINTS: StickerPrint[] = STICKERS.map((s, i) => {
  const text = FACE_TEXT[s.face][s.row * 3 + s.col];
  const blank = text.trim() === "";
  return { text, mark: blank ? MARKS[i % MARKS.length] : null, ink: FACE_INK[s.face], face: s.face };
});

/** The DOM copy (exact wording; the cube prints a tiled version of it). */
export const COPY = {
  headline: "Scrambled at 14.",
  lines: ["7+ cubes. Different puzzle types.", "Time spent: way too much.", "Going too deep into things? Yeah."],
  habit: "It’s a habit.",
  play: "Go on, scramble it. I’ll wait.",
} as const;

/* ----------------------------------------------------------------- moves */

/** Phase 1 — free moves; played backwards they shred everything (poster included). */
const P1 = parse("U' L2 B' R' F U2 L' D B2 F' U'");
/** Phase 2 — a middle-band insert that keeps the top layer, then the band ring clicks home (E’). */
const P2 = parse("D R D' R' D' B' D B E'");
/** Phase 3 — a bottom-band swap that keeps the top two layers (x2-mirrored J-perm), ends on R’. */
const P3 = parse("R D R' B' R D R' D' R' B R2 D' R'");

export const SOLVE: Move[] = [...P1, ...P2, ...P3];
export const SCRAMBLE: Move[] = invert(SOLVE);
export const PHASE_LEN = [P1.length, P2.length, P3.length] as const;

/** Every move the scroll plays: scramble then solve. */
export const TIMELINE: Move[] = [...SCRAMBLE, ...SOLVE];
export const N_SCRAMBLE = SCRAMBLE.length;
export const N_TOTAL = TIMELINE.length;

let cache: CubeState[] | null = null;
/** State after k timeline moves, k = 0 … N_TOTAL (k = 0 and N_TOTAL are solved). */
export function timelineStates(): CubeState[] {
  if (!cache) cache = playAll(solved(), TIMELINE);
  return cache;
}
