/**
 * A 3×3×3 cube as 27 cubies with integer positions and orientations.
 *
 * Dependency-free (no three.js) so the Static composition and the SVG
 * fallback can share it without pulling the WebGL chunk.
 *
 * Coordinates: +x = R, +y = U, +z = F. A move turns every cubie whose
 * coordinate on `axis` is in `layers` by `q` quarter turns about +axis
 * (right-hand rule), so R = (x, +1, −1), L = (x, −1, +1), U = (y, +1, −1) …
 */

export type Vec3 = [number, number, number];
export type Axis = 0 | 1 | 2;

export type Move = {
  axis: Axis;
  layers: number[];
  /** Quarter turns about +axis, right-hand rule (±1, ±2). */
  q: number;
  /** Standard notation, e.g. "R’", "D2". */
  name: string;
};

export type FaceId = "U" | "D" | "F" | "B" | "R" | "L";
export const FACE_IDS: FaceId[] = ["U", "D", "F", "B", "R", "L"];

/** Outward normal, "up" and "right" of each face as seen from outside the cube. */
export const FACE_NORMAL: Record<FaceId, Vec3> = { U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0] };
export const FACE_UP: Record<FaceId, Vec3> = { U: [0, 0, -1], D: [0, 0, 1], F: [0, 1, 0], B: [0, 1, 0], R: [0, 1, 0], L: [0, 1, 0] };
export const FACE_RIGHT: Record<FaceId, Vec3> = { U: [1, 0, 0], D: [1, 0, 0], F: [1, 0, 0], B: [-1, 0, 0], R: [0, 0, -1], L: [0, 0, 1] };

const MOVE_DEF: Record<string, [Axis, number, number]> = {
  R: [0, 1, -1],
  L: [0, -1, 1],
  U: [1, 1, -1],
  D: [1, -1, 1],
  F: [2, 1, -1],
  B: [2, -1, 1],
  M: [0, 0, 1],
  E: [1, 0, 1],
  S: [2, 0, -1],
};

export const PRIME = "’";

/** "R U R' U2" → moves. Accepts ' or ’ for primes. */
export function parse(seq: string): Move[] {
  return seq
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      const def = MOVE_DEF[tok[0]];
      if (!def) throw new Error(`bad move ${tok}`);
      const [axis, layer, dir] = def;
      const mod = tok.slice(1);
      const double = mod.startsWith("2");
      const prime = mod.includes("'") || mod.includes(PRIME);
      const q = dir * (double ? 2 : 1) * (prime ? -1 : 1);
      return { axis, layers: [layer], q, name: tok[0] + (double ? "2" : prime ? PRIME : "") };
    });
}

export function invertMove(m: Move): Move {
  const base = m.name[0];
  const double = m.name.includes("2");
  const prime = m.name.includes(PRIME);
  return { ...m, q: -m.q, name: base + (double ? "2" : prime ? "" : PRIME) };
}

/** The exact inverse sequence: reversed, each move inverted. */
export function invert(moves: Move[]): Move[] {
  return moves.slice().reverse().map(invertMove);
}

/* ------------------------------------------------------------------ state */

export type CubeState = {
  /** 27 × 3 integer positions. */
  pos: Int8Array;
  /** 27 × 9 integer rotation matrices (row-major). */
  rot: Int8Array;
};

/** Home position of cubie i: index = (x+1)*9 + (y+1)*3 + (z+1). */
export const HOME: Vec3[] = (() => {
  const out: Vec3[] = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) out.push([x, y, z]);
  return out;
})();

export const cubieAt = (x: number, y: number, z: number) => (x + 1) * 9 + (y + 1) * 3 + (z + 1);

export function solved(): CubeState {
  const pos = new Int8Array(27 * 3);
  const rot = new Int8Array(27 * 9);
  for (let i = 0; i < 27; i++) {
    pos.set(HOME[i], i * 3);
    rot[i * 9] = rot[i * 9 + 4] = rot[i * 9 + 8] = 1;
  }
  return { pos, rot };
}

export function cloneState(s: CubeState): CubeState {
  return { pos: s.pos.slice(), rot: s.rot.slice() };
}

/** Integer rotation matrix (row-major) for q quarter turns about axis. */
export function quarterMatrix(axis: Axis, q: number): number[] {
  const k = ((q % 4) + 4) % 4;
  const c = [1, 0, -1, 0][k];
  const s = [0, 1, 0, -1][k];
  if (axis === 0) return [1, 0, 0, 0, c, -s, 0, s, c];
  if (axis === 1) return [c, 0, s, 0, 1, 0, -s, 0, c];
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

function mulVec(m: ArrayLike<number>, x: number, y: number, z: number): Vec3 {
  return [m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z];
}

export function applyMove(s: CubeState, m: Move): CubeState {
  const out = cloneState(s);
  const R = quarterMatrix(m.axis, m.q);
  for (let i = 0; i < 27; i++) {
    const p = s.pos.subarray(i * 3, i * 3 + 3);
    if (!m.layers.includes(p[m.axis])) continue;
    out.pos.set(mulVec(R, p[0], p[1], p[2]), i * 3);
    const r = s.rot.subarray(i * 9, i * 9 + 9);
    const o = new Int8Array(9);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++) o[row * 3 + col] = R[row * 3] * r[col] + R[row * 3 + 1] * r[3 + col] + R[row * 3 + 2] * r[6 + col];
    out.rot.set(o, i * 9);
  }
  return out;
}

/** States after 0…n moves (n + 1 entries). */
export function playAll(start: CubeState, moves: Move[]): CubeState[] {
  const out = [start];
  for (const m of moves) out.push(applyMove(out[out.length - 1], m));
  return out;
}

/** Quaternion [x, y, z, w] of cubie i's rotation (for three.js). */
export function quatOf(s: CubeState, i: number, out: number[] = [0, 0, 0, 1]): number[] {
  const m = s.rot.subarray(i * 9, i * 9 + 9);
  const m00 = m[0], m01 = m[1], m02 = m[2], m10 = m[3], m11 = m[4], m12 = m[5], m20 = m[6], m21 = m[7], m22 = m[8];
  const tr = m00 + m11 + m22;
  if (tr > 0) {
    const S = Math.sqrt(tr + 1) * 2;
    out[3] = 0.25 * S;
    out[0] = (m21 - m12) / S;
    out[1] = (m02 - m20) / S;
    out[2] = (m10 - m01) / S;
  } else if (m00 > m11 && m00 > m22) {
    const S = Math.sqrt(1 + m00 - m11 - m22) * 2;
    out[3] = (m21 - m12) / S;
    out[0] = 0.25 * S;
    out[1] = (m01 + m10) / S;
    out[2] = (m02 + m20) / S;
  } else if (m11 > m22) {
    const S = Math.sqrt(1 + m11 - m00 - m22) * 2;
    out[3] = (m02 - m20) / S;
    out[0] = (m01 + m10) / S;
    out[1] = 0.25 * S;
    out[2] = (m12 + m21) / S;
  } else {
    const S = Math.sqrt(1 + m22 - m00 - m11) * 2;
    out[3] = (m10 - m01) / S;
    out[0] = (m02 + m20) / S;
    out[1] = (m12 + m21) / S;
    out[2] = 0.25 * S;
  }
  return out;
}

/* --------------------------------------------------------------- stickers */

export type StickerHome = {
  /** Sticker index 0…53 (face-major: U, D, F, B, R, L; then row, col). */
  id: number;
  face: FaceId;
  row: number;
  col: number;
  cubie: number;
};

export const STICKERS: StickerHome[] = (() => {
  const out: StickerHome[] = [];
  for (const face of FACE_IDS) {
    const n = FACE_NORMAL[face];
    const up = FACE_UP[face];
    const right = FACE_RIGHT[face];
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++) {
        const x = n[0] + right[0] * (col - 1) + up[0] * (1 - row);
        const y = n[1] + right[1] * (col - 1) + up[1] * (1 - row);
        const z = n[2] + right[2] * (col - 1) + up[2] * (1 - row);
        out.push({ id: out.length, face, row, col, cubie: cubieAt(x, y, z) });
      }
  }
  return out;
})();

const eq = (a: ArrayLike<number>, b: ArrayLike<number>) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

export type Facelet = {
  /** Which sticker is shown here. */
  sticker: number;
  /** Clockwise quarter turns of its text relative to the face's up. */
  turn: number;
};

/** Where every sticker is: facelets[face][row*3+col]. */
export function facelets(s: CubeState): Record<FaceId, Facelet[]> {
  const out = { U: [], D: [], F: [], B: [], R: [], L: [] } as Record<FaceId, Facelet[]>;
  for (const st of STICKERS) {
    const r = s.rot.subarray(st.cubie * 9, st.cubie * 9 + 9);
    const hn = FACE_NORMAL[st.face];
    const hu = FACE_UP[st.face];
    const n = mulVec(r, hn[0], hn[1], hn[2]);
    const u = mulVec(r, hu[0], hu[1], hu[2]);
    const p = s.pos.subarray(st.cubie * 3, st.cubie * 3 + 3);
    const face = FACE_IDS.find((f) => eq(FACE_NORMAL[f], n))!;
    const fu = FACE_UP[face];
    const fr = FACE_RIGHT[face];
    const col = p[0] * fr[0] + p[1] * fr[1] + p[2] * fr[2] + 1;
    const row = 1 - (p[0] * fu[0] + p[1] * fu[1] + p[2] * fu[2]);
    const turn = eq(u, fu) ? 0 : eq(u, fr) ? 1 : eq(u, [-fu[0], -fu[1], -fu[2]]) ? 2 : 3;
    out[face][row * 3 + col] = { sticker: st.id, turn };
  }
  return out;
}

/** True when every cubie whose HOME is in `ys` (y-layers) is home and unrotated. */
export function layersSolved(s: CubeState, ys: number[]): boolean {
  for (let i = 0; i < 27; i++) {
    if (!ys.includes(HOME[i][1])) continue;
    if (!eq(s.pos.subarray(i * 3, i * 3 + 3), HOME[i])) return false;
    const r = s.rot.subarray(i * 9, i * 9 + 9);
    if (r[0] !== 1 || r[4] !== 1 || r[8] !== 1) return false;
  }
  return true;
}

/** Notation for a single-layer turn given in the cube's own frame (free play). */
export function nameOf(axis: Axis, layer: number, q: number): string {
  const table: Record<string, [string, number]> = {
    "0:1": ["R", -1],
    "0:-1": ["L", 1],
    "0:0": ["M", 1],
    "1:1": ["U", -1],
    "1:-1": ["D", 1],
    "1:0": ["E", 1],
    "2:1": ["F", -1],
    "2:-1": ["B", 1],
    "2:0": ["S", -1],
  };
  const [base, dir] = table[`${axis}:${layer}`];
  const k = (((q * dir) % 4) + 4) % 4;
  return base + (k === 2 ? "2" : k === 3 ? PRIME : "");
}
