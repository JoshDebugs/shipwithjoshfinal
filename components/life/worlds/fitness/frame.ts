/**
 * Everything one rendered frame needs, computed from (progress, time, geo)
 * into preallocated arrays (no per-frame allocation). Both renderers (WebGL
 * and the CPU fallback) and the HUD read from it.
 */
import { clamp, hash, lerp, range } from "@/components/life/multiverse/ease";
import { fx, fy, type Geo } from "./geometry";
import { J, MAX_CAPS, NJ, barY, pose, writeCapsules } from "./rig";
import {
  FOOD,
  G,
  WORD_PEAK,
  bloomAt,
  exitAt,
  foodFlare,
  foodFlight,
  heatAt,
  lampAt,
  motionAt,
  needleAt,
  wordHeat,
  type Heat,
  type Motion,
} from "./timeline";

export const MAX_FLECKS = 14;

export type Frame = {
  p: number;
  time: number;
  joints: Float32Array;
  capP: Float32Array;
  capR: Float32Array;
  capN: number;
  motion: Motion;
  heat: Heat;
  /** Figure height (px). */
  fh: number;
  /** Body render params (px). */
  k: number;
  edge: number;
  fall: number;
  haloR: number;
  haloAmt: number;
  mottle: number;
  /** Room. */
  floorY: number;
  wallY: number;
  bloom: number;
  exitK: number;
  footT: number;
  feet: Float32Array;
  chest: Float32Array;
  /** Bar: x0, y, x1, half thickness · plates: offset, hw, hh, 0 (×3). */
  bar: Float32Array;
  plates: Float32Array;
  hands: Float32Array;
  handT: number;
  handR: number;
  /** Heat-type temperatures and bleed, masks 0–4. */
  wordT: Float32Array;
  wordBlur: Float32Array;
  /** Food: x, y, size, alpha (×3) and the absorption ring x, y, r, amount. */
  food: Float32Array;
  ring: Float32Array;
  /** Sweat flecks: x, y, r, alpha. */
  flecks: Float32Array;
  fleckN: number;
  /** Lamp: x, y, box, amount · sharpness. */
  lamp: Float32Array;
  lampSharp: number;
  /** HUD readouts. */
  avgT: number;
  chestT: number;
  needle: number;
};

export function createFrame(): Frame {
  return {
    p: 0,
    time: 0,
    joints: new Float32Array(NJ * 2),
    capP: new Float32Array(MAX_CAPS * 4),
    capR: new Float32Array(MAX_CAPS * 4),
    capN: 0,
    motion: { s: 0, a: 0, effort: 0, kind: "hang", work: 0 },
    heat: { g: [0, 0, 0, 0], flare: 0 },
    fh: 100,
    k: 10,
    edge: 2,
    fall: 10,
    haloR: 20,
    haloAmt: 0.3,
    mottle: 0.12,
    floorY: 0,
    wallY: 0,
    bloom: 0,
    exitK: 1,
    footT: 0,
    feet: new Float32Array(2),
    chest: new Float32Array(2),
    bar: new Float32Array(4),
    plates: new Float32Array(12),
    hands: new Float32Array(4),
    handT: 0,
    handR: 0,
    wordT: new Float32Array(5),
    wordBlur: new Float32Array(5),
    food: new Float32Array(12),
    ring: new Float32Array(4),
    flecks: new Float32Array(MAX_FLECKS * 4),
    fleckN: 0,
    lamp: new Float32Array(4),
    lampSharp: 0,
    avgT: 0,
    chestT: 0,
    needle: 0,
  };
}

export type FrameOpts = {
  lowPower: boolean;
  /** Static/reduced composition: force every word to residue, no ambient time. */
  still?: boolean;
};

export function computeFrame(F: Frame, p: number, time: number, g: Geo, o: FrameOpts): Frame {
  F.p = p;
  F.time = time;
  const m = motionAt(p, F.motion);
  const h = heatAt(p, m, F.heat);
  const fh = g.fh;

  // breathing: heavier once the body has worked
  const avg0 = (h.g[0] + h.g[1] + h.g[2] + h.g[3]) / 4;
  const work = clamp((avg0 - 0.15) / 0.7);
  const breath = o.still ? 0 : Math.sin(time * Math.PI * 2 * (0.22 + 0.2 * work)) * (0.35 + 0.65 * work) * (1 - m.effort * 0.6);
  pose(m.s, m.a, breath, F.joints);
  const jx = (j: number) => fx(g, F.joints[j * 2]);
  const jy = (j: number) => fy(g, F.joints[j * 2 + 1]);

  const temps = h.g;
  F.capN = writeCapsules(F.joints, temps, g.cx, g.floorY, fh, o.lowPower, F.capP, F.capR);
  F.avgT = avg0;
  F.chestT = h.g[G.core];
  F.needle = needleAt(avg0);

  const bloom = bloomAt(p);
  const e = exitAt(p);
  F.bloom = bloom;
  F.exitK = 1 - 0.72 * e;
  F.fh = fh;
  F.k = g.k;
  F.edge = g.edge;
  F.fall = fh * 0.035;
  F.haloR = fh * (0.045 + 0.06 * bloom + 0.02 * work);
  F.haloAmt = 0.3 + 0.12 * work + 0.3 * bloom;
  F.mottle = 0.16;

  F.floorY = g.floorY;
  F.wallY = g.mobile ? g.floorY - fh * 0.55 : g.floorY - fh * 0.5;
  F.footT = 0.05 + 0.2 * clamp((h.g[G.legs] - 0.15) / 0.8);
  F.feet[0] = jx(J.ftL);
  F.feet[1] = jx(J.ftR);
  F.chest[0] = jx(J.chest);
  F.chest[1] = jy(J.chest);

  // the barbell
  const by = fy(g, barY(F.joints));
  F.bar[0] = g.cx - g.barHalf;
  F.bar[1] = by;
  F.bar[2] = g.cx + g.barHalf;
  F.bar[3] = g.barTh / 2;
  for (let i = 0; i < 3; i++) {
    F.plates[i * 4] = g.plates[i][0];
    F.plates[i * 4 + 1] = g.plates[i][1];
    F.plates[i * 4 + 2] = g.plates[i][2];
    F.plates[i * 4 + 3] = 0;
  }
  F.hands[0] = jx(J.haL);
  F.hands[1] = by;
  F.hands[2] = jx(J.haR);
  F.hands[3] = by;
  F.handT = temps[G.arms] * 0.92;
  F.handR = fh * 0.026;

  // heat-type
  for (let k = 0; k < 5; k++) {
    const w = wordHeat(p, k);
    let i = w.i;
    if (o.still && k > 0) i = 0.31;
    F.wordT[k] = i * WORD_PEAK[k];
    F.wordBlur[k] = o.still ? 0.35 : w.blur;
  }
  if (!o.still) {
    // the title-card headline crawls with sensor noise
    F.wordT[0] *= 1 + 0.035 * Math.sin(time * 5.3) * Math.sin(time * 2.1 + 1.3);
  }

  // food drifting into the core (set 3)
  const coreX = jx(J.waist);
  const coreY = lerp(jy(J.waist), jy(J.chest), 0.35);
  let ringAmt = 0;
  let ringR = 0;
  for (let i = 0; i < 3; i++) {
    const f = FOOD[i];
    const fl = foodFlight(p, f);
    const fxp = fx(g, f.from[0]);
    const fyp = fy(g, f.from[1]);
    const t = fl.t;
    const bob = o.still ? 0 : Math.sin(time * 1.4 + i * 2) * fh * 0.008;
    F.food[i * 4] = lerp(fxp, coreX, t);
    F.food[i * 4 + 1] = lerp(fyp, coreY, t) - Math.sin(Math.PI * t) * fh * 0.07 + bob;
    F.food[i * 4 + 2] = f.size * fh * (1 - 0.45 * t * t) * (g.mobile ? 1.1 : 1);
    F.food[i * 4 + 3] = fl.alpha;
    const fla = foodFlare(p, f);
    if (fla > ringAmt) {
      ringAmt = fla;
      ringR = fh * (0.05 + 0.5 * range(p, f.hit, f.hit + 0.045));
    }
  }
  F.ring[0] = coreX;
  F.ring[1] = coreY;
  F.ring[2] = ringR;
  F.ring[3] = ringAmt;

  // sweat flecks from set 2 on
  const fleckAmt = o.still ? 0 : range(p, 0.3, 0.335) * (1 - range(p, 0.905, 0.94));
  const n = o.lowPower ? 8 : MAX_FLECKS;
  F.fleckN = fleckAmt > 0 ? n : 0;
  if (F.fleckN) {
    const hx = jx(J.head);
    const hy = jy(J.head);
    for (let i = 0; i < n; i++) {
      const period = 1.5 + 1.3 * hash(i + 7);
      const ph = (time / period + hash(i + 13)) % 1;
      const src = i % 3;
      const sx = src === 0 ? hx + (hash(i + 2) - 0.5) * fh * 0.1 : jx(src === 1 ? J.shL : J.shR) + (hash(i + 4) - 0.5) * fh * 0.08;
      const sy = src === 0 ? hy - fh * 0.03 : jy(J.shL) - fh * 0.02;
      const drift = (src === 1 ? -1 : src === 2 ? 1 : hash(i + 9) - 0.5) * fh * (0.05 + 0.08 * hash(i + 5));
      F.flecks[i * 4] = sx + drift * ph;
      F.flecks[i * 4 + 1] = sy - fh * (0.06 + 0.2 * hash(i + 11)) * ph;
      F.flecks[i * 4 + 2] = (1.6 + 1.6 * hash(i + 3)) * g.u * (1 - 0.4 * ph);
      F.flecks[i * 4 + 3] = Math.sin(Math.PI * ph) * fleckAmt * (0.45 + 0.55 * hash(i + 21)) * (0.5 + 0.5 * work);
    }
  }

  // the lamp: the last heat condenses into it
  const L = lampAt(p);
  F.lamp[0] = g.lamp.x;
  F.lamp[1] = g.lamp.y;
  F.lamp[2] = g.lamp.s;
  F.lamp[3] = L.amt;
  F.lampSharp = L.sharp;
  return F;
}
