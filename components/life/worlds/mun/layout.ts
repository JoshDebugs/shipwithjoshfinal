/**
 * Screen layout + the camera path. Pure functions of the stage size and
 * progress, so the canvas and every DOM layer agree on where things are.
 *
 * Landscape: the hall fills the frame right of centre, speeches sit
 * bottom-left. Portrait (phones): the hall bleeds off both sides at the top,
 * speeches stack below it in big type.
 */

import { clamp, easeInOutCubic, lerp, range } from "@/components/life/multiverse/ease";
import { buildHall, HALL, newProj, project, setCam, type Cam, type HallGeo } from "./hall";
import { B, dropT, exitT, riseT } from "./timeline";

/** Height of the near-orthographic plan camera (m). */
export const DPLAN = 60;
const DEG = Math.PI / 180;

export type Layout = {
  w: number;
  h: number;
  mobile: boolean;
  portrait: boolean;
  low: boolean;
  geo: HallGeo;
  /** plan scale, px per metre */
  S: number;
  /** podium (world origin) in plan, screen px */
  pod: { x: number; y: number };
  /** Josh's seat in plan, screen px */
  joshPlan: { x: number; y: number };
  /** the paper's world centre in plan, screen px */
  q: { x: number; y: number };
  paper: { w: number; h: number; cx: number; cy: number; fs: number; pad: number };
  /** plan zoom at which the world paper exactly covers the DOM sheet */
  Z0: number;
  end: { ex: number; ey: number; ez: number; theta: number; f: number; cy: number };
  exit: { ex: number; ey: number; ez: number; theta: number; cy: number };
  /** the next portal's icon box (screen px, top-left + size) */
  house: { x: number; y: number; size: number };
  speech: { x: number; y: number; w: number; fs: number };
  top: { y: number; w: number; fs: number };
  title: { fs: number };
  /** DOM design width of Josh's name card */
  cardW: number;
  /** foreground exaggeration of the card once we're behind Josh (wide-angle near object) */
  cardBoost: number;
  seal: number;
};

export function buildLayout(w: number, h: number, mobile: boolean, lowPower: boolean): Layout {
  const portrait = h > w * 1.12;

  // ---- the position paper (DOM sheet)
  const paperW = portrait ? Math.min(w - 36, 420) : Math.min(h - 190, 700) * 0.72;
  const paperH = portrait ? Math.min(paperW * 1.42, h - 230) : Math.min(h - 190, 700);
  const paperTop = portrait ? Math.max(104, (h - paperH) / 2 + 6) : Math.max(108, (h - paperH) / 2 + 18);
  const pad = Math.round(paperW * 0.085);
  const fs = Math.min(portrait ? 15 : 19, (paperW - 2 * pad) / (34 * 0.6));
  const paper = { w: paperW, h: paperH, cx: w / 2, cy: paperTop + paperH / 2, fs, pad };

  const geo = buildHall(mobile, paperW / paperH);

  // ---- plan framing
  const zRange = geo.zMax - geo.zMin;
  const top = portrait ? 104 : 142;
  const S = portrait ? (w * 1.5) / (2 * geo.halfW) : Math.min((w * 0.65) / (2 * geo.halfW), (h - top - 168) / zRange);
  const pod = portrait ? { x: w / 2, y: top + geo.zMax * S } : { x: w / 2 + w * 0.035, y: top + geo.zMax * S };
  const toPlan = (x: number, z: number) => ({ x: pod.x + S * x, y: pod.y - S * z });
  const joshPlan = toPlan(geo.josh.x, geo.josh.z);
  const q = toPlan(geo.paper.x, geo.paper.z);
  const Z0 = (paperH / (S * HALL.paperH)) * ((DPLAN - geo.paper.y) / DPLAN);

  // ---- behind Josh: a high over-the-shoulder pose; Josh's card is placed at a chosen screen height
  const cam = {} as Cam;
  const pr = newProj();
  const endTheta = (portrait ? 34 : 30) * DEG;
  const endF = portrait ? w * 1.36 : h * 0.9;
  const eye = { x: 0, y: portrait ? 5.6 : 5.2, z: geo.josh.z - (portrait ? 3.6 : 4.4) };
  setCam(cam, eye.x, eye.y, eye.z, endTheta, 0, endF, w / 2, 0);
  project(cam, geo.card.x, geo.card.y, geo.card.z, pr);
  const cardY = portrait ? h * 0.69 : h * 0.725;
  const endCy = cardY - pr.y;

  // ---- exit: crane up and back; the hall becomes a band under the stitched house
  const exitTheta = (portrait ? 9 : 6) * DEG;
  const exitEye = { x: 0, y: portrait ? 10 : 8.5, z: portrait ? -33 : -30 };
  setCam(cam, exitEye.x, exitEye.y, exitEye.z, exitTheta, 0, endF, w / 2, 0);
  project(cam, 0, 0, -6, pr);
  const exitCy = (portrait ? h * 0.74 : h * 0.79) - pr.y;

  // ---- the house the next portal is born from
  const houseSize = portrait ? Math.round(w * 0.5) : Math.round(Math.min(250, h * 0.28));
  const houseCy = portrait ? h * 0.37 : h * 0.4;
  const house = { x: w / 2 - houseSize / 2, y: houseCy - houseSize * 0.55, size: houseSize };

  const speech = portrait
    ? { x: 22, y: joshPlan.y + 54, w: w - 44, fs: clamp(w * 0.105, 28, 46) }
    : { x: Math.max(44, w * 0.04), y: h - 74, w: Math.min(470, w * 0.33), fs: clamp(w * 0.036, 30, 58) };

  return {
    w,
    h,
    mobile,
    portrait,
    low: lowPower,
    geo,
    S,
    pod,
    joshPlan,
    q,
    paper,
    Z0,
    end: { ex: eye.x, ey: eye.y, ez: eye.z, theta: endTheta, f: endF, cy: endCy },
    exit: { ex: exitEye.x, ey: exitEye.y, ez: exitEye.z, theta: exitTheta, cy: exitCy },
    house,
    speech,
    top: portrait ? { y: 104, w: w - 40, fs: clamp(w * 0.088, 26, 40) } : { y: 112, w: Math.min(w * 0.72, 1040), fs: clamp(w * 0.036, 30, 58) },
    title: { fs: portrait ? (w - 40) / 3.95 : Math.min(w * 0.17, h * 0.36) },
    cardW: portrait ? 300 : 420,
    cardBoost: portrait ? 2.5 : 2.4,
    seal: 0,
  };
}

/**
 * Where the camera is at progress p:
 *  - before/through the rise: straight down, zoomed onto Josh's sheet (Z0 → 1),
 *    the sheet travelling from the screen centre to its seat;
 *  - the drop: pitch 90° → ~15°, distance and focal length log-lerped,
 *    ending just behind Josh's name card;
 *  - the exit: the camera cranes up and back; the hall shrinks to a band under the house.
 */
export function camAt(L: Layout, p: number, c: Cam) {
  const g = L.geo;
  const d = dropT(p);
  if (d <= 0) {
    const r = riseT(p);
    const Z = Math.exp((1 - r) * Math.log(L.Z0));
    const m = easeInOutCubic(range(p, B.rise[0] + 0.012, B.rise[1]));
    setCam(c, g.paper.x, DPLAN, g.paper.z, Math.PI / 2, 0, L.S * DPLAN * Z, lerp(L.paper.cx, L.q.x, m), lerp(L.paper.cy, L.q.y, m));
    return;
  }
  if (d >= 1) {
    const e = exitT(p);
    setCam(
      c,
      lerp(L.end.ex, L.exit.ex, e),
      lerp(L.end.ey, L.exit.ey, e),
      lerp(L.end.ez, L.exit.ez, e),
      lerp(L.end.theta, L.exit.theta, e),
      0,
      L.end.f,
      L.w / 2,
      lerp(L.end.cy, L.exit.cy, e),
    );
    return;
  }
  // plan pose → end pose, interpolated as an orbit around a moving ground target
  const D0 = DPLAN;
  const D1 = L.end.ey / Math.sin(L.end.theta);
  const T1x = L.end.ex;
  const T1z = L.end.ez + Math.cos(L.end.theta) * D1;
  const th = lerp(Math.PI / 2, L.end.theta, d);
  const D = Math.exp(lerp(Math.log(D0), Math.log(D1), d));
  const tx = lerp(g.paper.x, T1x, d);
  const tz = lerp(g.paper.z, T1z, d);
  const f = Math.exp(lerp(Math.log(L.S * DPLAN), Math.log(L.end.f), d));
  setCam(c, tx, D * Math.sin(th), tz - D * Math.cos(th), th, 0, f, lerp(L.q.x, L.w / 2, d), lerp(L.q.y, L.end.cy, d));
}
