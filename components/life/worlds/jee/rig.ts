/**
 * The room, in numbers.
 *
 * The pile sits at the origin on a desk (y = 0). Two plaster walls stand R away
 * from it: the left wall at x = −R and the back wall at z = −R. A wall point is
 * written (u, v): u runs screen-right as seen from a camera square-on to that
 * wall, v is height above the desk.
 *
 * The camera never pitches. It stays horizontal and frames with lens shift (an
 * architect's shift lens), so verticals stay vertical and a rectangle on a wall
 * is a true rectangle on screen. That is what lets the DOM portal origin land
 * exactly on the laptop shadow.
 */

export const R = 3.2;
export const FOV = 34;
const TAN = Math.tan((FOV * Math.PI) / 360);
export const DEG = Math.PI / 180;

/** Camera framing: distance from the pile, eye height, lens shift in NDC. */
export type Framing = { D: number; yc: number; sx: number; sy: number };

export type GlyphBox = { u0: number; v0: number; sx: number; sy: number };
export type IconBox = { u: number; top: number; size: number };

/**
 * Where the visible lamp stands, relative to the camera (phi is measured from
 * the camera's axis, negative = screen right). The walls are lit from the true
 * lamp position; the model is staged separately so it always reads in profile
 * beside the pile and never in front of it.
 */
export type LampStaging = { r: number; rA: number; rTitle: number; phiA: number; phiRelit: number; phiB: number; scale: number };

export type Rig = {
  W: number;
  H: number;
  asp: number;
  mobile: boolean;
  title: Framing;
  a: Framing;
  b: Framing;
  exit: Framing;
  jee: GlyphBox;
  iit: GlyphBox;
  laptop: IconBox;
  lampA: number;
  lampB: number;
  lampR: number;
  lampH: number;
  model: LampStaging;
  win: [number, number, number, number];
  poolA: [number, number];
  poolB: [number, number];
  /** Cone (cos in, cos out) at each solve angle. */
  coneA: [number, number];
  coneB: [number, number];
  /** Wall height the beam is cut off at, per solve angle. */
  ceilA: number;
  ceilB: number;
};

const JEE_X = [0.0213, 1.4782] as const;
const IIT_X = [0.0349, 0.9745] as const;

/** NDC → wall (u, v) for a camera square-on to that wall. */
export function ndcToWall(f: Framing, asp: number, nx: number, ny: number): [number, number] {
  const dw = f.D + R;
  return [(nx - f.sx) * dw * TAN * asp, f.yc + (ny - f.sy) * dw * TAN];
}

/** Wall (u, v) → NDC for a camera square-on to that wall. */
export function wallToNdc(f: Framing, asp: number, u: number, v: number): [number, number] {
  const dw = f.D + R;
  return [u / (dw * TAN * asp) + f.sx, (v - f.yc) / (dw * TAN) + f.sy];
}

function glyphBox(f: Framing, asp: number, x0: number, x1: number, y0: number, y1: number, ext: readonly [number, number]): GlyphBox {
  const [ua, va] = ndcToWall(f, asp, x0, y0);
  const [ub, vb] = ndcToWall(f, asp, x1, y1);
  const sx = (ub - ua) / (ext[1] - ext[0]);
  return { u0: ua - ext[0] * sx, v0: va, sx, sy: vb - va };
}

/** Half-width in NDC of a glyph run of `ext` cap-heights drawn `ndcH` tall, kept in true proportion. */
function trueHalfWidth(asp: number, ndcH: number, ext: readonly [number, number], stretch: number, limit: number) {
  return Math.min(limit, (ndcH * (ext[1] - ext[0]) * stretch) / asp / 2);
}

function windowBox(f: Framing, asp: number, x0: number, x1: number, y0: number, y1: number): [number, number, number, number] {
  const [u0, v0] = ndcToWall(f, asp, x0, y0);
  const [u1, v1] = ndcToWall(f, asp, x1, y1);
  return [u0, u1, v0, v1];
}

/** The laptop's icon box, given its pixel placement in the exit framing. */
function laptopBox(f: Framing, asp: number, W: number, H: number, size: number, boxLeft: number, boxTop: number): IconBox {
  const [u, top] = ndcToWall(f, asp, (boxLeft / W) * 2 - 1, 1 - (boxTop / H) * 2);
  const [uEnd] = ndcToWall(f, asp, ((boxLeft + size) / W) * 2 - 1, 0);
  return { u, top, size: uEnd - u };
}

export function makeRig(W: number, H: number): Rig {
  const asp = W / H;
  const mobile = asp < 0.8;

  if (mobile) {
    const title: Framing = { D: 5.7, yc: 1.0, sx: 0, sy: 0.08 };
    const a: Framing = { D: 9.6, yc: 1.45, sx: 0, sy: -0.27 };
    const b: Framing = { D: 9.4, yc: 1.45, sx: 0, sy: -0.25 };
    const exit: Framing = { D: 9.0, yc: 1.45, sx: 0, sy: -0.25 };
    const jee = glyphBox(title, asp, -0.82, 0.82, -0.03, 0.34, JEE_X);
    const iit = glyphBox(a, asp, -0.78, 0.78, -0.62, 0.42, IIT_X);
    const size = W * 0.86;
    const laptop = laptopBox(exit, asp, W, H, size, (W - size) / 2, H * 0.31);
    return {
      W,
      H,
      asp,
      mobile,
      title,
      a,
      b,
      exit,
      jee,
      iit,
      laptop,
      lampA: -9 * DEG,
      lampB: 81 * DEG,
      lampR: 3.3,
      lampH: 0.82,
      model: { r: 1.5, rA: 1.5, rTitle: 2.4, phiA: -32 * DEG, phiRelit: -24 * DEG, phiB: -32 * DEG, scale: 0.46 },
      win: windowBox(a, asp, 0.44, 0.84, 0.5, 0.72),
      poolA: [0, 2.3],
      poolB: [laptop.u + laptop.size / 2, 2.3],
      coneA: [0.965, 0.87],
      coneB: [0.965, 0.9],
      ceilA: ndcToWall(a, asp, 0, 0.5)[1],
      ceilB: ndcToWall(exit, asp, 0, 1 - ((H * 0.31) / H) * 2 + 0.06)[1],
    };
  }

  const title: Framing = { D: 5.2, yc: 1.0, sx: 0, sy: 0.03 };
  const a: Framing = { D: 8.6, yc: 1.55, sx: -0.17, sy: -0.27 };
  const b: Framing = { D: 8.4, yc: 1.55, sx: -0.14, sy: -0.25 };
  const exit: Framing = { D: 7.9, yc: 1.5, sx: -0.12, sy: -0.24 };

  const jeeH = 0.58;
  const jeeHalf = trueHalfWidth(asp, jeeH, JEE_X, 1.12, 0.6);
  const jee = glyphBox(title, asp, -jeeHalf, jeeHalf, -0.08, -0.08 + jeeH, JEE_X);

  // IIT in true Anton proportion, its crossbar clear of the site nav.
  const iitBottom = -0.72;
  const iitTop = 0.7;
  const iitHalf = trueHalfWidth(asp, iitTop - iitBottom, IIT_X, 1.02, 0.56);
  const iit = glyphBox(a, asp, -0.2 - iitHalf, -0.2 + iitHalf, iitBottom, iitTop, IIT_X);

  const size = Math.min(W * 0.42, H * 0.7);
  const laptop = laptopBox(exit, asp, W, H, size, W * 0.4 - size / 2, H * 0.13);
  const centre = laptop.u + laptop.size / 2;

  return {
    W,
    H,
    asp,
    mobile,
    title,
    a,
    b,
    exit,
    jee,
    iit,
    laptop,
    lampA: -27 * DEG,
    lampB: 63 * DEG,
    lampR: 3.5,
    lampH: 0.86,
    model: { r: 3.05, rA: 2.5, rTitle: 3.7, phiA: -70 * DEG, phiRelit: -52 * DEG, phiB: -70 * DEG, scale: 0.84 },
    win: windowBox(a, asp, -0.93, -0.76, 0.33, 0.71),
    poolA: [-0.5, 2.7],
    poolB: [centre - 0.55, 2.7],
    coneA: [0.925, 0.8],
    coneB: [0.93, 0.85],
    ceilA: 99,
    ceilB: 99,
  };
}

/** Projected px rect of the laptop's icon box in the exit framing. */
export function laptopScreenRect(rig: Rig): { left: number; top: number; size: number } {
  const { exit, asp, W, H, laptop } = rig;
  const [nx0, ny0] = wallToNdc(exit, asp, laptop.u, laptop.top);
  const [nx1] = wallToNdc(exit, asp, laptop.u + laptop.size, laptop.top);
  const left = ((nx0 + 1) / 2) * W;
  const right = ((nx1 + 1) / 2) * W;
  const top = ((1 - ny0) / 2) * H;
  return { left, top, size: right - left };
}

/** Screen x (px) of the room corner in a framing, for parking copy on the dark wall beyond it. */
export function cornerScreenX(rig: Rig, f: Framing): number {
  const [nx] = wallToNdc(f, rig.asp, R, f.yc);
  return ((nx + 1) / 2) * rig.W;
}
