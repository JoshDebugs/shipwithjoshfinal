/**
 * The assembly hall: a hemicycle of delegates around the opponent's podium,
 * in world units (metres) on the floor plane y = 0. +z points from Josh's
 * seat (the back edge) toward the podium; x is to the right.
 *
 * Pure data + a tiny hand-rolled perspective camera (no three.js). The same
 * camera drives the canvas and the DOM pieces that live "in" the room
 * (the position paper, Josh's name card), so they can never drift apart.
 */

import { hash } from "@/components/life/multiverse/ease";

export const HALL = {
  span: (96 * Math.PI) / 180,
  aisle: 1.15,
  headY: 1.18,
  headR: 0.2,
  bodyY: 0.8,
  bodyRX: 0.31,
  bodyRZ: 0.16,
  bodyRY: 0.3,
  placardW: 0.5,
  placardH: 0.22,
  placardY: 0.95,
  placardOff: 0.46,
  deskIn: 0.8,
  deskOut: 0.36,
  rOuter: 13,
  joshR: 14.5,
  /** world height of Josh's typed sheet (its width follows the DOM sheet's aspect) */
  paperH: 0.44,
} as const;

export type Seat = {
  x: number;
  z: number;
  r: number;
  phi: number;
  arc: number;
  /** 0 paper · 1 sun · 2 teal */
  thread: number;
  placard: number;
  /** which of the three speeches turns this delegate */
  wave: number;
  /** 0..1 ripple delay inside that speech */
  local: number;
  /** ±1: which way the gaze swings across the room */
  side: number;
  phase: number;
};

export type HallGeo = {
  seats: Seat[];
  arcs: number[];
  josh: { x: number; z: number };
  card: { x: number; y: number; z: number; w: number; h: number };
  paper: { x: number; y: number; z: number; w: number; h: number };
  opp: { x: number; y: number; z: number };
  /** half-width of the hall in metres (for framing) */
  halfW: number;
  zMin: number;
  zMax: number;
};

/** Seats per arc ∝ radius, split into five blocks by four aisles. */
export function buildHall(mobile: boolean, paperAspect: number): HallGeo {
  const K = mobile ? 4 : 7;
  const N = mobile ? 72 : 168;
  const r0 = mobile ? 6 : 5;
  const arcs = Array.from({ length: K }, (_, k) => r0 + ((HALL.rOuter - r0) * k) / (K - 1));
  const sumR = arcs.reduce((a, b) => a + b, 0);
  const counts = arcs.map((r) => Math.round((N * r) / sumR));
  counts[K - 1] += N - counts.reduce((a, b) => a + b, 0);

  const seats: Seat[] = [];
  arcs.forEach((r, k) => {
    const n = counts[k];
    const a = HALL.aisle / r;
    const L = (2 * HALL.span - 4 * a) / 5;
    const base = Math.floor(n / 5);
    let rem = n - base * 5;
    const per = [base, base, base, base, base];
    if (rem % 2 === 1) {
      per[2]++;
      rem--;
    }
    if (rem >= 2) {
      per[1]++;
      per[3]++;
      rem -= 2;
    }
    if (rem >= 2) {
      per[0]++;
      per[4]++;
    }
    for (let b = 0; b < 5; b++) {
      const start = -HALL.span + b * (L + a);
      for (let j = 0; j < per[b]; j++) {
        const phi = start + ((j + 0.5) * L) / per[b];
        const i = seats.length;
        const h1 = hash(i * 7.13 + 1.7);
        const h2 = hash(i * 3.71 + 9.2);
        seats.push({
          x: r * Math.sin(phi),
          z: -r * Math.cos(phi),
          r,
          phi,
          arc: k,
          thread: h1 < 0.56 ? 0 : h1 < 0.8 ? 1 : 2,
          placard: Math.floor(h2 * 12),
          wave: 0,
          local: 0,
          side: 1,
          phase: hash(i * 1.37 + 4.4) * Math.PI * 2,
        });
      }
    }
  });

  // ripple: delay grows with distance from Josh (+ a little noise), then split into three speeches
  const josh = { x: 0, z: -HALL.joshR };
  const dist = seats.map((s) => Math.hypot(s.x - josh.x, s.z - josh.z));
  const maxD = Math.max(...dist);
  const delay = seats.map((_, i) => (0.65 * dist[i]) / maxD + 0.08 * hash(i * 5.31 + 2.2));
  const order = seats.map((_, i) => i).sort((a, b) => delay[a] - delay[b]);
  const cuts = [0.22, 0.56];
  const groups: number[][] = [[], [], []];
  order.forEach((idx, rank) => {
    const q = rank / seats.length;
    groups[q < cuts[0] ? 0 : q < cuts[1] ? 1 : 2].push(idx);
  });
  groups.forEach((g, gi) => {
    const lo = delay[g[0]];
    const hi = delay[g[g.length - 1]];
    g.forEach((idx) => {
      seats[idx].wave = gi;
      seats[idx].local = hi > lo ? (delay[idx] - lo) / (hi - lo) : 0;
    });
  });
  seats.forEach((s, i) => {
    s.side = s.x < -0.4 ? 1 : s.x > 0.4 ? -1 : hash(i * 9.1) < 0.5 ? 1 : -1;
  });

  const cardZ = josh.z + 0.56;
  return {
    seats,
    arcs,
    josh,
    card: { x: 0, y: 0.98, z: cardZ, w: 0.9, h: 0.3 },
    paper: { x: -0.62, y: 0.77, z: cardZ - 0.04, w: HALL.paperH * paperAspect, h: HALL.paperH },
    opp: { x: 0, y: 1.62, z: 0.45 },
    halfW: HALL.rOuter + 0.5,
    zMin: josh.z - 0.6,
    zMax: 3.1,
  };
}

/* ------------------------------------------------------------------ camera */

export type Cam = {
  ex: number;
  ey: number;
  ez: number;
  rx: number;
  rz: number;
  ux: number;
  uy: number;
  uz: number;
  fx: number;
  fy: number;
  fz: number;
  f: number;
  cx: number;
  cy: number;
  /** 1 = straight down (plan), 0 = level */
  plan: number;
};

export const newCam = (): Cam => ({ ex: 0, ey: 0, ez: 0, rx: 1, rz: 0, ux: 0, uy: 0, uz: 1, fx: 0, fy: -1, fz: 0, f: 1, cx: 0, cy: 0, plan: 1 });

/** Point the camera from eye E with pitch θ (down from level) and yaw ψ. */
export function setCam(c: Cam, ex: number, ey: number, ez: number, theta: number, psi: number, f: number, cx: number, cy: number) {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const cp = Math.cos(psi);
  const sp = Math.sin(psi);
  c.fx = sp * ct;
  c.fy = -st;
  c.fz = cp * ct;
  c.rx = cp;
  c.rz = -sp;
  // U = F × R  (R has no y component)
  c.ux = c.fy * c.rz;
  c.uy = c.fz * c.rx - c.fx * c.rz;
  c.uz = -c.fy * c.rx;
  c.ex = ex;
  c.ey = ey;
  c.ez = ez;
  c.f = f;
  c.cx = cx;
  c.cy = cy;
  c.plan = theta / (Math.PI / 2);
}

export type Proj = { x: number; y: number; k: number; z: number };
export const newProj = (): Proj => ({ x: 0, y: 0, k: 0, z: 0 });

/** World → screen. Returns false when the point is behind the camera. `k` = px per metre at that depth. */
export function project(c: Cam, x: number, y: number, z: number, out: Proj): boolean {
  const dx = x - c.ex;
  const dy = y - c.ey;
  const dz = z - c.ez;
  const zc = dx * c.fx + dy * c.fy + dz * c.fz;
  if (zc < 0.08) return false;
  const xc = dx * c.rx + dz * c.rz;
  const yc = dx * c.ux + dy * c.uy + dz * c.uz;
  const k = c.f / zc;
  out.x = c.cx + xc * k;
  out.y = c.cy - yc * k;
  out.k = k;
  out.z = zc;
  return true;
}
