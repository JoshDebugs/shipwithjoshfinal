/**
 * Canvas 2D renderer for the assembly hall. One full-stage canvas under the
 * DOM type: carpet, desks, the opponent's podium, 168 delegates (72 on
 * phones), their gaze threads (additive, so sweeping strands throw moiré),
 * the starburst on Josh, and the string-art house the next portal opens from.
 *
 * Everything is a pure function of (progress, time): no per-frame allocation
 * beyond Canvas paths.
 */

import { RISO, alpha, mix, overprint } from "@/components/life/multiverse/palette";
import { backOut, clamp, easeInOutCubic, easeOutCubic, lerp, range, smoothstep } from "@/components/life/multiverse/ease";
import { HALL, newCam, newProj, project, type Cam, type Proj } from "./hall";
import { camAt, type Layout } from "./layout";
import { B, dropT, roomTurn, waveLocal } from "./timeline";
import { PLACARD_VARIANTS, type Atlas } from "./placards";

const DEEP = overprint(RISO.cobalt, RISO.cobalt);
const BODY = mix(RISO.cobalt, RISO.ink, 0.58);
const PINK_DEEP = overprint(RISO.pink, RISO.pink);
const THREAD = [RISO.paper, RISO.sun, RISO.teal] as const;
const FRONT_INK = [RISO.sun, RISO.teal, RISO.paper, RISO.sun, RISO.ink, RISO.teal] as const;
const SHADOW = alpha(RISO.ink, 0.26);
const WELL = alpha(RISO.ink, 0.11);
const RING = alpha(RISO.paper, 0.07);
const AISLE = alpha(RISO.paper, 0.045);
const RAIL = alpha(RISO.paper, 0.16);
const DESK = alpha(DEEP, 0.62);

/** House portal outline (icon units, 0..100), walls + roof, from the bottom-left corner clockwise. */
const HOUSE_POLY = [
  [16, 92],
  [16, 54],
  [50, 25],
  [84, 54],
  [84, 92],
] as const;

export type Scene = {
  L: Layout;
  cam: Cam;
  pr: Proj;
  n: number;
  hx: Float32Array;
  hy: Float32Array;
  hk: Float32Array;
  hz: Float32Array;
  ex: Float32Array;
  ey: Float32Array;
  ok: Uint8Array;
  order: number[];
  /** house outline sample points (icon units) and which one each seat stitches to */
  hp: Float32Array;
  hpN: number;
  assign: Int32Array;
  houseBody: Path2D | null;
  houseSprout: Path2D | null;
};

export function makeScene(L: Layout): Scene {
  const n = L.geo.seats.length;
  // sample the house walls + roof
  const segs = HOUSE_POLY.length - 1;
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i < segs; i++) {
    const l = Math.hypot(HOUSE_POLY[i + 1][0] - HOUSE_POLY[i][0], HOUSE_POLY[i + 1][1] - HOUSE_POLY[i][1]);
    lens.push(l);
    total += l;
  }
  const hpN = Math.max(24, Math.round(n * 0.6));
  const hp = new Float32Array(hpN * 2);
  for (let j = 0; j < hpN; j++) {
    let d = ((j + 0.5) / hpN) * total;
    let s = 0;
    while (s < segs - 1 && d > lens[s]) d -= lens[s++];
    const t = d / lens[s];
    hp[j * 2] = lerp(HOUSE_POLY[s][0], HOUSE_POLY[s + 1][0], t);
    hp[j * 2 + 1] = lerp(HOUSE_POLY[s][1], HOUSE_POLY[s + 1][1], t);
  }
  // seats sorted left → right stitch to the outline in order (left wall, roof, right wall)
  const idx = L.geo.seats.map((_, i) => i).sort((a, b) => L.geo.seats[a].phi - L.geo.seats[b].phi);
  const assign = new Int32Array(n);
  idx.forEach((si, rank) => {
    assign[si] = Math.min(hpN - 1, Math.floor((rank / n) * hpN));
  });

  let houseBody: Path2D | null = null;
  let houseSprout: Path2D | null = null;
  if (typeof Path2D !== "undefined") {
    houseBody = new Path2D("M16 54 L50 25 L84 54 V92 H16 Z");
    houseSprout = new Path2D();
    houseSprout.rect(48, 9, 4, 18);
    houseSprout.ellipse(42, 10, 8, 4, (-25 * Math.PI) / 180, 0, Math.PI * 2);
    houseSprout.ellipse(58, 8, 8, 4, (25 * Math.PI) / 180, 0, Math.PI * 2);
  }

  return {
    L,
    cam: newCam(),
    pr: newProj(),
    n,
    hx: new Float32Array(n),
    hy: new Float32Array(n),
    hk: new Float32Array(n),
    hz: new Float32Array(n),
    ex: new Float32Array(n),
    ey: new Float32Array(n),
    ok: new Uint8Array(n),
    order: Array.from({ length: n }, (_, i) => i),
    hp,
    hpN,
    assign,
    houseBody,
    houseSprout,
  };
}

export type Frame = {
  p: number;
  /** seconds (ambient) */
  t: number;
  /** seconds since the gavel struck, or -1 */
  twang: number;
  /** screen position of the full stop of "ORDER." (title ripples) */
  dot: { x: number; y: number; r: number } | null;
  atlas: Atlas | null;
};

/* ---------------------------------------------------------------- helpers */

/** Project a ring sector (radii r0..r1, angles a0..a1) on the floor at height y and fill it. */
function sector(ctx: CanvasRenderingContext2D, sc: Scene, r0: number, r1: number, a0: number, a1: number, y: number, steps: number): boolean {
  const { cam, pr } = sc;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = lerp(a0, a1, i / steps);
    if (!project(cam, r1 * Math.sin(a), y, -r1 * Math.cos(a), pr)) return false;
    if (i === 0) ctx.moveTo(pr.x, pr.y);
    else ctx.lineTo(pr.x, pr.y);
  }
  for (let i = steps; i >= 0; i--) {
    const a = lerp(a0, a1, i / steps);
    if (!project(cam, r0 * Math.sin(a), y, -r0 * Math.cos(a), pr)) return false;
    ctx.lineTo(pr.x, pr.y);
  }
  ctx.closePath();
  return true;
}

function quad(ctx: CanvasRenderingContext2D, sc: Scene, pts: readonly (readonly [number, number, number])[]): boolean {
  const { cam, pr } = sc;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    if (!project(cam, pts[i][0], pts[i][1], pts[i][2], pr)) return false;
    if (i === 0) ctx.moveTo(pr.x, pr.y);
    else ctx.lineTo(pr.x, pr.y);
  }
  ctx.closePath();
  return true;
}

/** Aisle centre angle between block b and b+1 on a ring of radius r. */
function aisleAngle(b: number, r: number) {
  const a = HALL.aisle / r;
  const L = (2 * HALL.span - 4 * a) / 5;
  return -HALL.span + (b + 1) * L + b * a + a / 2;
}

/* ------------------------------------------------------------------ title */

function drawTitleRings(ctx: CanvasRenderingContext2D, f: Frame, w: number, h: number, a: number) {
  if (!f.dot || a <= 0) return;
  const { x, y } = f.dot;
  const maxR = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
  const rings = 7;
  ctx.fillStyle = RISO.paper;
  for (let j = 0; j < rings; j++) {
    const fr = (f.t * 0.045 + j / rings) % 1;
    const r = 40 + fr * maxR;
    const fade = Math.sin(Math.PI * fr) * (1 - fr);
    if (fade <= 0.01) continue;
    const dotR = 0.6 + 1.5 * (1 - fr);
    const step = 10 + fr * 10;
    const count = Math.floor((Math.PI * 2 * r) / step);
    ctx.globalAlpha = a * fade * 0.42;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + j * 0.37;
      const px = x + Math.cos(ang) * r;
      const py = y + Math.sin(ang) * r;
      if (px < -4 || py < -4 || px > w + 4 || py > h + 4) continue;
      ctx.moveTo(px + dotR, py);
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ floor */

function drawFloor(ctx: CanvasRenderingContext2D, sc: Scene, f: Frame, A: number) {
  const g = sc.L.geo;
  const r0 = g.arcs[0];
  const span = HALL.span;
  const steps = sc.L.low ? 28 : 44;

  // the well in front of the podium + drifting carpet rings
  ctx.globalAlpha = A;
  ctx.fillStyle = WELL;
  if (sector(ctx, sc, 0.0001, r0 - 1.15, -span - 0.04, span + 0.04, 0, steps)) ctx.fill();
  ctx.strokeStyle = RING;
  ctx.lineWidth = 1;
  const drift = (f.t * 0.12) % 0.6;
  for (let r = 1.2 + drift; r < r0 - 1.3; r += 0.6) {
    ctx.beginPath();
    let ok = true;
    for (let i = 0; i <= steps; i++) {
      const a = lerp(-span, span, i / steps);
      if (!project(sc.cam, r * Math.sin(a), 0, -r * Math.cos(a), sc.pr)) {
        ok = false;
        break;
      }
      if (i === 0) ctx.moveTo(sc.pr.x, sc.pr.y);
      else ctx.lineTo(sc.pr.x, sc.pr.y);
    }
    if (ok) ctx.stroke();
  }

  // aisles (curved: constant metric width)
  ctx.fillStyle = AISLE;
  const rA = r0 - 1.1;
  const rB = HALL.rOuter + 0.75;
  for (let b = 0; b < 4; b++) {
    ctx.beginPath();
    let ok = true;
    const N = 8;
    for (let i = 0; i <= N && ok; i++) {
      const r = lerp(rA, rB, i / N);
      const a = aisleAngle(b, r) - (HALL.aisle * 0.42) / r;
      ok = project(sc.cam, r * Math.sin(a), 0, -r * Math.cos(a), sc.pr);
      if (i === 0) ctx.moveTo(sc.pr.x, sc.pr.y);
      else ctx.lineTo(sc.pr.x, sc.pr.y);
    }
    for (let i = N; i >= 0 && ok; i--) {
      const r = lerp(rA, rB, i / N);
      const a = aisleAngle(b, r) + (HALL.aisle * 0.42) / r;
      ok = project(sc.cam, r * Math.sin(a), 0, -r * Math.cos(a), sc.pr);
      ctx.lineTo(sc.pr.x, sc.pr.y);
    }
    if (ok) ctx.fill();
  }

  // desks: one curved bench per row and block
  ctx.fillStyle = DESK;
  for (let k = 0; k < g.arcs.length; k++) {
    const r = g.arcs[k];
    const a = HALL.aisle / r;
    const L = (2 * span - 4 * a) / 5;
    for (let b = 0; b < 5; b++) {
      const s0 = -span + b * (L + a);
      if (sector(ctx, sc, r - HALL.deskIn, r - HALL.deskOut, s0 + 0.004, s0 + L - 0.004, 0.02, 10)) ctx.fill();
    }
  }
  // the rail at the back edge
  ctx.fillStyle = RAIL;
  if (sector(ctx, sc, HALL.rOuter + 0.72, HALL.rOuter + 0.82, -span - 0.02, span + 0.02, 0, steps)) ctx.fill();

  // Josh's own little desk at the edge, and the chair's dais at the far end
  ctx.fillStyle = DESK;
  const jz = g.card.z;
  if (quad(ctx, sc, [[-0.95, 0.02, jz - 0.22], [0.95, 0.02, jz - 0.22], [0.95, 0.02, jz + 0.22], [-0.95, 0.02, jz + 0.22]])) ctx.fill();
  if (quad(ctx, sc, [[-3.7, 0.02, 2.05], [3.7, 0.02, 2.05], [3.7, 0.02, 2.6], [-3.7, 0.02, 2.6]])) ctx.fill();
  ctx.globalAlpha = 1;
}

/* ---------------------------------------------------------------- figures */

function figure(
  ctx: CanvasRenderingContext2D,
  sc: Scene,
  x: number,
  z: number,
  headY: number,
  bodyY: number,
  facing: number,
  bodyFill: string,
  headFill: string,
  pupil: number | null,
  A: number,
) {
  const { cam, pr } = sc;
  const plan = cam.plan;
  if (!project(cam, x, bodyY, z, pr)) return;
  const bx = pr.x;
  const by = pr.y;
  const k = pr.k;
  const rot = planRot(facing) * plan;
  ctx.globalAlpha = A;
  if (plan > 0.4) {
    ctx.fillStyle = SHADOW;
    ctx.beginPath();
    ctx.ellipse(bx + 0.1 * k, by + 0.12 * k, HALL.bodyRX * k, HALL.bodyRZ * k, rot, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = bodyFill;
  ctx.beginPath();
  ctx.ellipse(bx, by, HALL.bodyRX * k, lerp(HALL.bodyRY, HALL.bodyRZ, plan) * k, rot, 0, Math.PI * 2);
  ctx.fill();
  if (!project(cam, x, headY, z, pr)) return;
  ctx.fillStyle = headFill;
  ctx.beginPath();
  ctx.arc(pr.x, pr.y, HALL.headR * pr.k, 0, Math.PI * 2);
  ctx.fill();
  if (pupil !== null) {
    ctx.fillStyle = RISO.ink;
    const pk = HALL.headR * pr.k * 0.48 * plan;
    ctx.beginPath();
    ctx.arc(pr.x + Math.cos(pupil) * pk, pr.y + Math.sin(pupil) * pk, Math.max(0.8, 0.07 * pr.k), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Screen rotation (plan view) of a body whose gaze points along world angle `facing` (atan2(dz, dx)). */
function planRot(facing: number) {
  // screen direction = (cos f, -sin f) → angle -f; shoulders perpendicular; ellipse symmetric mod π
  let r = -facing + Math.PI / 2;
  r = ((r % Math.PI) + Math.PI) % Math.PI;
  if (r > Math.PI / 2) r -= Math.PI;
  return r;
}

function drawPodium(ctx: CanvasRenderingContext2D, sc: Scene, f: Frame, A: number, turn: number) {
  const g = sc.L.geo;
  const dim = 1 - 0.55 * turn;
  // chair: three figures behind the dais
  for (let i = -1; i <= 1; i++) figure(ctx, sc, i * 1.75, 2.95, 1.5, 1.05, Math.PI / 2 + Math.PI, RISO.ink, RISO.paper, null, A);
  // glow of attention on the opponent while the room still looks at them
  if (sc.cam.plan > 0.3 && project(sc.cam, g.opp.x, g.opp.y, g.opp.z, sc.pr)) {
    const R = 2.4 * sc.pr.k * (1 + 0.06 * Math.sin(f.t * 2.2));
    const gr = ctx.createRadialGradient(sc.pr.x, sc.pr.y, 0, sc.pr.x, sc.pr.y, R);
    gr.addColorStop(0, alpha(RISO.pink, 0.42 * (1 - turn)));
    gr.addColorStop(1, alpha(RISO.pink, 0));
    ctx.globalAlpha = A;
    ctx.fillStyle = gr;
    ctx.fillRect(sc.pr.x - R, sc.pr.y - R, R * 2, R * 2);
  }
  // the opponent, standing
  figure(ctx, sc, g.opp.x, g.opp.z, g.opp.y, 1.12, -Math.PI / 2, PINK_DEEP, RISO.paper, Math.PI / 2, A * (0.55 + 0.45 * dim));
  // lectern: front face + top (recedes once we're behind Josh)
  ctx.globalAlpha = A * (0.5 + 0.5 * dim) * (0.45 + 0.55 * sc.cam.plan);
  ctx.fillStyle = PINK_DEEP;
  if (quad(ctx, sc, [[-0.8, 0, -0.28], [0.8, 0, -0.28], [0.8, 1.12, -0.28], [-0.8, 1.12, -0.28]])) ctx.fill();
  ctx.fillStyle = RISO.pink;
  if (quad(ctx, sc, [[-0.8, 1.12, -0.28], [0.8, 1.12, -0.28], [0.8, 1.12, 0.22], [-0.8, 1.12, 0.22]])) ctx.fill();
  ctx.globalAlpha = 1;
}

/* -------------------------------------------------------------- delegates */

function placard(ctx: CanvasRenderingContext2D, sc: Scene, atlas: Atlas | null, cx: number, cy: number, k: number, rot: number, flip: number, variant: number, A: number) {
  const sx = Math.abs(Math.cos(Math.PI * flip));
  const w = HALL.placardW * k * Math.max(0.04, sx);
  const h = lerp(HALL.placardH, HALL.placardH * 0.78, sc.cam.plan) * k;
  const showFront = flip >= 0.5;
  ctx.globalAlpha = A;
  if (k * HALL.placardW < 26 || !atlas) {
    // small (from above): two flat inks read better than a micro-pattern
    ctx.save();
    ctx.translate(cx, cy);
    if (rot) ctx.rotate(rot);
    if (showFront) {
      ctx.fillStyle = FRONT_INK[variant % FRONT_INK.length];
      ctx.fillRect(-w / 2, -h / 2, w, h * 0.62);
      ctx.fillStyle = RISO.paper;
      ctx.fillRect(-w / 2, -h / 2 + h * 0.62, w, h * 0.38);
    } else {
      ctx.fillStyle = RISO.pink;
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    ctx.restore();
    return;
  }
  if (w > 3) {
    const [ax, ay] = atlas.cell(showFront ? variant % PLACARD_VARIANTS : PLACARD_VARIANTS);
    ctx.save();
    ctx.translate(cx, cy);
    if (rot) ctx.rotate(rot);
    ctx.drawImage(atlas.canvas, ax, ay, atlas.cw, atlas.ch, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
}

function drawDelegates(ctx: CanvasRenderingContext2D, sc: Scene, f: Frame, A: number) {
  const { cam, pr, L } = sc;
  const g = L.geo;
  const seats = g.seats;
  const plan = cam.plan;
  const O = g.opp;
  const C = g.card;
  const lenOC = Math.hypot(C.x - O.x, C.z - O.z);
  const bulge = lenOC * 0.42;
  const breath = L.low ? 0 : 0.012;

  // per-seat state → screen; depth for painter's order
  for (let i = 0; i < sc.n; i++) {
    const s = seats[i];
    const wl = waveLocal(f.p, s.wave);
    const tr = clamp((wl - 0.6 * s.local) / 0.4);
    const eT = tr <= 0 ? 0 : backOut(tr, 1.3);
    const bump = Math.sin(Math.PI * clamp(eT));
    const tx = lerp(O.x, C.x, eT) + s.side * bulge * bump;
    const ty = lerp(O.y, C.y + 0.1, eT);
    const tz = lerp(O.z, C.z, eT);
    sc.ok[i] = project(cam, s.x, HALL.headY + Math.sin(f.t * 1.3 + s.phase) * breath, s.z, pr) ? 1 : 0;
    sc.hx[i] = pr.x;
    sc.hy[i] = pr.y;
    sc.hk[i] = pr.k;
    sc.hz[i] = pr.z;
    if (project(cam, tx, ty, tz, pr)) {
      sc.ex[i] = pr.x;
      sc.ey[i] = pr.y;
    } else {
      sc.ok[i] = 0;
    }
  }
  if (plan < 0.98) sc.order.sort((a, b) => sc.hz[b] - sc.hz[a]);

  for (let n = 0; n < sc.n; n++) {
    const i = sc.order[n];
    if (!sc.ok[i]) continue;
    const s = seats[i];
    const k = sc.hk[i];
    // cull far off-screen
    if (sc.hx[i] < -80 || sc.hx[i] > L.w + 80 || sc.hy[i] < -80 || sc.hy[i] > L.h + 120) continue;
    const wl = waveLocal(f.p, s.wave);
    const tr = clamp((wl - 0.6 * s.local) / 0.4);
    const eT = tr <= 0 ? 0 : backOut(tr, 1.3);
    const bump = Math.sin(Math.PI * clamp(eT));
    const tx = lerp(O.x, C.x, eT) + s.side * bulge * bump;
    const tz = lerp(O.z, C.z, eT);
    const facing = Math.atan2(tz - s.z, tx - s.x);
    // the eye-dot looks a beat before the head follows
    const eP = easeOutCubic(clamp((wl - 0.6 * s.local + 0.12) / 0.3));
    const px = lerp(O.x, C.x, eP) + s.side * bulge * Math.sin(Math.PI * eP);
    const pz = lerp(O.z, C.z, eP);
    const look = Math.atan2(-(pz - s.z), px - s.x); // screen angle in plan
    const pupilPersp = Math.atan2(sc.ey[i] - sc.hy[i], sc.ex[i] - sc.hx[i]);
    const flip = clamp((wl - 0.6 * s.local - 0.04) / 0.32);

    // placard sits on the desk on the side the delegate faces
    const fx = Math.cos(facing);
    const fz = Math.sin(facing);
    const rot = planRot(facing) * clamp((plan - 0.45) / 0.45);
    if (project(cam, s.x + fx * HALL.placardOff, HALL.placardY, s.z + fz * HALL.placardOff, pr)) {
      const behind = pr.z > sc.hz[i]; // placard further than the head → paint before the body
      if (behind) placard(ctx, sc, f.atlas, pr.x, pr.y, pr.k, rot, flip, s.placard, A);
      // body + head
      const bodyOk = project(cam, s.x, HALL.bodyY, s.z, pr);
      if (bodyOk) {
        if (plan > 0.4) {
          ctx.globalAlpha = A;
          ctx.fillStyle = SHADOW;
          ctx.beginPath();
          ctx.ellipse(pr.x + 0.1 * pr.k, pr.y + 0.12 * pr.k, HALL.bodyRX * pr.k, HALL.bodyRZ * pr.k, rot, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = A;
        ctx.fillStyle = BODY;
        ctx.beginPath();
        ctx.ellipse(pr.x, pr.y, HALL.bodyRX * pr.k, lerp(HALL.bodyRY, HALL.bodyRZ, plan) * pr.k, rot, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = RISO.paper;
      ctx.beginPath();
      ctx.arc(sc.hx[i], sc.hy[i], HALL.headR * k, 0, Math.PI * 2);
      ctx.fill();
      // gaze: from above, one dot on the side they look; facing the camera, two eyes nudged toward their thread
      ctx.fillStyle = RISO.ink;
      const rr = HALL.headR * k;
      const face = clamp((0.62 - plan) / 0.3);
      if (face < 1) {
        ctx.globalAlpha = A * (1 - face);
        ctx.beginPath();
        ctx.arc(sc.hx[i] + Math.cos(look) * rr * 0.5, sc.hy[i] + Math.sin(look) * rr * 0.5, Math.max(0.75, 0.075 * k), 0, Math.PI * 2);
        ctx.fill();
      }
      if (face > 0) {
        ctx.globalAlpha = A * face;
        // small, low, wide-set eyes read as a face looking at you (not a skull, not an eyeball)
        const nx = Math.cos(pupilPersp) * rr * 0.16;
        const ny = Math.sin(pupilPersp) * rr * 0.08 + rr * 0.1;
        const er = Math.max(0.65, 0.034 * k);
        ctx.beginPath();
        ctx.arc(sc.hx[i] - rr * 0.38 + nx, sc.hy[i] + ny, er, 0, Math.PI * 2);
        ctx.moveTo(sc.hx[i] + rr * 0.38 + nx + er, sc.hy[i] + ny);
        ctx.arc(sc.hx[i] + rr * 0.38 + nx, sc.hy[i] + ny, er, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = A;
      if (!behind) {
        if (project(cam, s.x + fx * HALL.placardOff, HALL.placardY, s.z + fz * HALL.placardOff, pr)) placard(ctx, sc, f.atlas, pr.x, pr.y, pr.k, rot, flip, s.placard, A);
      }
    }
  }
  ctx.globalAlpha = 1;
}

/* ---------------------------------------------------------------- threads */

function drawThreads(ctx: CanvasRenderingContext2D, sc: Scene, f: Frame, A: number) {
  const { L } = sc;
  const plan = sc.cam.plan;
  const stitch = range(f.p, B.stitch[0], B.stitch[1]);
  const hs = L.house.size / 100;
  // twang: a damped wave rolls outward arc by arc
  const tw = f.twang;
  const amp0 = L.portrait ? 11 : 17;
  const baseA = (L.low ? 0.3 : 0.27) * A * (1 - 0.45 * range(f.p, B.fill[0], 1));
  const lw = L.low ? 1 : 1.15;

  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  for (let c = 0; c < 3; c++) {
    ctx.strokeStyle = THREAD[c];
    for (let i = 0; i < sc.n; i++) {
      const s = L.geo.seats[i];
      if (s.thread !== c || !sc.ok[i]) continue;
      let x1 = sc.ex[i];
      let y1 = sc.ey[i];
      if (stitch > 0) {
        const j = sc.assign[i];
        const rank = j / sc.hpN;
        const e = easeInOutCubic(clamp((stitch - 0.45 * rank) / 0.55));
        x1 = lerp(x1, L.house.x + sc.hp[j * 2] * hs, e);
        y1 = lerp(y1, L.house.y + sc.hp[j * 2 + 1] * hs, e);
      }
      const x0 = sc.hx[i];
      const y0 = sc.hy[i];
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy) || 1;
      // start at the rim of the head, not its centre
      const rr = HALL.headR * sc.hk[i] * (0.6 + 0.4 * plan);
      const sx = x0 + (dx / len) * rr;
      const sy = y0 + (dy / len) * rr;
      ctx.globalAlpha = baseA;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      if (tw >= 0 && tw < 2.2) {
        const a = amp0 * Math.exp(-3.2 * tw) * Math.sin(20 * tw - s.arc * 0.6);
        // perpendicular offset of the midpoint (quadratic control point = 2× midpoint offset)
        ctx.quadraticCurveTo((sx + x1) / 2 - (dy / len) * a * 2, (sy + y1) / 2 + (dx / len) * a * 2, x1, y1);
      } else {
        ctx.lineTo(x1, y1);
      }
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------- Josh */

function drawJosh(ctx: CanvasRenderingContext2D, sc: Scene, f: Frame, A: number) {
  const { cam, pr, L } = sc;
  const g = L.geo;
  const plan = cam.plan;
  const cardA = clamp((plan - 0.42) / 0.3); // the DOM card takes over during the drop
  // the typed sheet on his desk
  ctx.globalAlpha = A;
  const P = g.paper;
  const pw = P.w / 2;
  const ph = P.h / 2;
  const rot = (2.5 * Math.PI) / 180; // world +2.5° reads as the DOM sheet's rotate(-2.5deg)
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const corner = (dx: number, dz: number): [number, number, number] => [P.x + dx * c - dz * s, P.y, P.z + dx * s + dz * c];
  if (range(f.p, B.rise[1] - 0.012, B.rise[1]) > 0) {
    ctx.fillStyle = RISO.paper;
    if (quad(ctx, sc, [corner(-pw, ph), corner(pw, ph), corner(pw, -ph), corner(-pw, -ph)])) ctx.fill();
    // its typed, mostly-blacked-out lines
    if (pr.k > 0 && project(cam, P.x, P.y, P.z, pr) && pr.k * P.h > 40) {
      ctx.fillStyle = RISO.ink;
      for (let li = 0; li < 9; li++) {
        const zz = ph * 0.62 - li * ph * 0.14;
        const x0 = -pw * 0.72;
        const len = pw * (li === 8 ? 0.8 : 0.9 + 0.5 * ((li * 37) % 7) / 7) * (li % 4 === 3 ? 0.5 : 1);
        const thick = li === 0 ? 0.008 : 0.012;
        if (quad(ctx, sc, [corner(x0, zz), corner(x0 + len, zz), corner(x0 + len, zz - thick), corner(x0, zz - thick)])) ctx.fill();
      }
    }
  }
  // Josh himself (sun) — only while we look from above
  if (plan > 0.45) {
    const fade = clamp((plan - 0.45) / 0.25);
    figure(ctx, sc, g.josh.x, g.josh.z, HALL.headY, HALL.bodyY, Math.PI / 2, RISO.sun, RISO.paper, -Math.PI / 2, A * fade);
  }
  // his placard (canvas while small; the DOM card replaces it as the camera drops)
  if (cardA > 0 && project(cam, g.card.x, g.card.y, g.card.z, pr)) {
    const k = pr.k;
    const w = g.card.w * k;
    const h = lerp(g.card.h, g.card.h * 0.55, plan) * k;
    // pulse: he's waiting to speak
    const pulse = 1 - range(f.p, B.waves[0][0], B.waves[0][0] + 0.03);
    if (pulse > 0 && plan > 0.9) {
      const ph2 = (f.t * 0.7) % 1;
      ctx.globalAlpha = A * pulse * (1 - ph2) * 0.9;
      ctx.strokeStyle = RISO.sun;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, w * 0.7 + ph2 * w * 1.6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = A * cardA;
    ctx.fillStyle = RISO.sun;
    ctx.fillRect(pr.x - w / 2, pr.y - h / 2, w, h);
    ctx.fillStyle = RISO.ink;
    ctx.fillRect(pr.x - w * 0.3, pr.y - h * 0.12, w * 0.6, h * 0.24);
  }
  ctx.globalAlpha = 1;
}

function drawStarburst(ctx: CanvasRenderingContext2D, sc: Scene, f: Frame, A: number) {
  const { cam, pr, L } = sc;
  const lock = smoothstep(range(f.p, B.waves[2][1] - 0.022, B.waves[2][1] + 0.006));
  const out = 1 - range(f.p, B.stitch[0], B.stitch[0] + 0.05);
  const a = lock * out * A;
  if (a <= 0 || !project(cam, L.geo.card.x, L.geo.card.y + 0.05, L.geo.card.z, pr)) return;
  const R = (L.portrait ? 64 : 104) * (1 + (1 - cam.plan) * 1.5) * (0.75 + 0.25 * lock) * (1 + 0.03 * Math.sin(f.t * 3));
  const gr = ctx.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, R);
  gr.addColorStop(0, alpha(RISO.paper, 0.95 * a));
  gr.addColorStop(0.16, alpha(RISO.paper, 0.55 * a));
  gr.addColorStop(0.38, alpha(RISO.sun, 0.38 * a));
  gr.addColorStop(1, alpha(RISO.sun, 0));
  ctx.fillStyle = gr;
  ctx.fillRect(pr.x - R, pr.y - R, R * 2, R * 2);
}

/* ------------------------------------------------------------------- exit */

function drawHouse(ctx: CanvasRenderingContext2D, sc: Scene, f: Frame) {
  const { L } = sc;
  const st = range(f.p, B.stitch[0] + 0.02, B.stitch[1]);
  if (st <= 0 || !sc.houseBody || !sc.houseSprout) return;
  const fill = easeInOutCubic(range(f.p, B.fill[0], B.fill[1]));
  const hs = L.house.size / 100;
  ctx.save();
  ctx.translate(L.house.x, L.house.y);
  ctx.scale(hs, hs);
  // ink interior: the next world shows through here
  if (fill > 0) {
    ctx.globalAlpha = fill;
    ctx.fillStyle = RISO.ink;
    ctx.fill(sc.houseBody);
    ctx.fill(sc.houseSprout);
  }
  // running stitch along the outline
  ctx.globalAlpha = 1;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = RISO.paper;
  ctx.lineWidth = (L.portrait ? 2 : 2.4) / hs;
  const perim = 233.4;
  ctx.setLineDash([7 / hs, 4.5 / hs]);
  ctx.lineDashOffset = -f.t * (6 / hs);
  ctx.beginPath();
  ctx.moveTo(16, 92);
  let left = perim * easeInOutCubic(st);
  const pts: [number, number][] = [[16, 54], [50, 25], [84, 54], [84, 92], [16, 92]];
  let px = 16;
  let py = 92;
  for (const [x, y] of pts) {
    const l = Math.hypot(x - px, y - py);
    if (left >= l) {
      ctx.lineTo(x, y);
      left -= l;
    } else {
      ctx.lineTo(px + ((x - px) * left) / l, py + ((y - py) * left) / l);
      break;
    }
    px = x;
    py = y;
  }
  ctx.stroke();
  ctx.setLineDash([]);
  // the sprout on the roof grows last
  const sprout = range(st, 0.7, 1);
  if (sprout > 0) {
    ctx.globalAlpha = sprout;
    ctx.fillStyle = mix(RISO.teal, RISO.paper, 0.2 * (1 - fill));
    ctx.fill(sc.houseSprout);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawShock(ctx: CanvasRenderingContext2D, sc: Scene, f: Frame, cx: number, cy: number) {
  // halftone ring from the seal's impact
  const t = range(f.p, B.seal[0] + 0.004, B.seal[0] + 0.03);
  if (t <= 0 || t >= 1) return;
  const R = (sc.L.portrait ? 60 : 110) + easeOutCubic(t) * (sc.L.portrait ? 260 : 520);
  const a = (1 - t) * 0.8;
  const count = Math.floor((Math.PI * 2 * R) / 12);
  ctx.fillStyle = RISO.pink;
  ctx.globalAlpha = a;
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2;
    for (let j = 0; j < 3; j++) {
      const rr = R - j * 9;
      const dr = (2.6 - j * 0.7) * (1 - t * 0.5);
      const x = cx + Math.cos(ang + j * 0.08) * rr;
      const y = cy + Math.sin(ang + j * 0.08) * rr;
      ctx.moveTo(x + dr, y);
      ctx.arc(x, y, dr, 0, Math.PI * 2);
    }
  }
  ctx.fill();
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------- main */

export function drawScene(ctx: CanvasRenderingContext2D, sc: Scene, f: Frame, dpr: number) {
  const { L } = sc;
  const { w, h } = L;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = RISO.cobalt;
  ctx.fillRect(0, 0, w, h);

  const titleA = 1 - range(f.p, B.titleOut[0], B.titleOut[1] + 0.02);
  drawTitleRings(ctx, f, w, h, titleA);

  const hallA = easeInOutCubic(range(f.p, B.rise[0] + 0.035, B.rise[1] - 0.01));
  if (hallA <= 0) return;

  camAt(L, f.p, sc.cam);
  const turn = roomTurn(f.p);
  drawFloor(ctx, sc, f, hallA);
  drawPodium(ctx, sc, f, hallA, turn);
  drawDelegates(ctx, sc, f, hallA);
  drawJosh(ctx, sc, f, hallA);
  drawStarburst(ctx, sc, f, hallA);
  drawThreads(ctx, sc, f, hallA);
  drawHouse(ctx, sc, f);

  if (dropT(f.p) >= 1 && project(sc.cam, L.geo.card.x, L.geo.card.y, L.geo.card.z, sc.pr)) {
    // the gavel: the room holds its breath — a soft spotlight on Josh's card
    const spot = range(f.p, B.balloon[0] - 0.01, B.balloon[1]) * (1 - range(f.p, B.exitCam[0], B.exitCam[0] + 0.05));
    if (spot > 0) {
      const R0 = Math.min(w, h) * 0.22;
      const R1 = Math.hypot(w, h) * 0.62;
      const gr = ctx.createRadialGradient(sc.pr.x, sc.pr.y, R0, sc.pr.x, sc.pr.y, R1);
      gr.addColorStop(0, alpha(RISO.ink, 0));
      gr.addColorStop(1, alpha(RISO.ink, 0.42 * spot));
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
    }
    // seal impact: a halftone ring rolls out from the card
    drawShock(ctx, sc, f, sc.pr.x, sc.pr.y);
  }

}
