/**
 * Scroll → the state of the room. A pure function of progress: scrubbing
 * backwards is the same film in reverse, and every frame can be frozen.
 */

import { bell, clamp, easeInOutCubic, easeInOutSine, lerp, range, smoothstep } from "@/components/life/multiverse/ease";
import { RISO, mix } from "@/components/life/multiverse/palette";
import { DEG, type Framing, type Rig } from "./rig";

export const BEATS = {
  titleEnd: 0.05,
  buildEnd: 0.31,
  iitLock: 0.325,
  dark: 0.398,
  black: 0.41,
  ignite: 0.545,
  swing: 0.565,
  /** The lamp is home: the laptop is locked, razor-sharp, in ink. */
  solve: 0.775,
  /** The hold ends and the screen starts to boot. */
  boot: 0.925,
  end: 0.995,
};

export type RoomState = {
  build: number;
  power: number;
  conePower: number;
  dustPower: number;
  lampAz: number;
  /** 0 at position A, 1 at position B */
  s: number;
  camAz: number;
  framing: Framing;
  coneIn: number;
  coneOut: number;
  ceil: number;
  /** Azimuth of the visible lamp model. */
  modelAz: number;
  modelR: number;
  /** Wall light gains: one wall at a time gets the lamp. */
  lGain: number;
  bGain: number;
  /** 1 = lamp-lit room, falls as the screen takes over. */
  room: number;
  warp: number;
  // left wall
  lShape: 0 | 1;
  lStage: 0 | 1;
  lS: number;
  lLock: number;
  lSoft: number;
  lShear: number;
  lSlide: number;
  lGlint: number;
  lGlintX: number;
  lAlpha: number;
  // back wall
  bS: number;
  bLock: number;
  bSoft: number;
  bShear: number;
  bSlide: number;
  bGlint: number;
  bGlintX: number;
  ignite: number;
  sky: string;
  winA: number;
};

const SKIES = [RISO.cobalt, RISO.pink, RISO.sun, RISO.cobalt, RISO.pink, RISO.sun, RISO.cobalt, RISO.pink, RISO.cobalt];

function skyAt(b: number): string {
  const night = mix(RISO.ink, RISO.cobalt, 0.62);
  // ease so the cycling visibly slows into night
  const t = 1 - Math.pow(1 - clamp(b), 2.1);
  const x = t * (SKIES.length - 1);
  const i = Math.min(SKIES.length - 2, Math.floor(x));
  const c = mix(SKIES[i], SKIES[i + 1], smoothstep(x - i));
  return mix(c, night, range(b, 0.82, 1));
}

const lerpF = (a: Framing, b: Framing, t: number): Framing => ({
  D: lerp(a.D, b.D, t),
  yc: lerp(a.yc, b.yc, t),
  sx: lerp(a.sx, b.sx, t),
  sy: lerp(a.sy, b.sy, t),
});

export function roomAt(p: number, rig: Rig, wobble: number, out?: RoomState): RoomState {
  const b = BEATS;

  // lamp power: full on, a two-step filament death, then pure dark, then back
  let power = 1;
  if (p > b.dark) {
    const k = range(p, b.dark, b.black);
    if (k < 0.3) power = lerp(1, 0.22, k / 0.3);
    else if (k < 0.5) power = lerp(0.22, 0.5, (k - 0.3) / 0.2);
    else power = lerp(0.5, 0, (k - 0.5) / 0.5);
    power *= 1 - range(p, b.ignite - 0.01, b.ignite);
  }
  if (p >= b.ignite) power = easeInOutSine(range(p, b.ignite, b.swing + 0.008));

  // lamp arc
  const swing = easeInOutSine(range(p, b.swing, b.solve));
  let s = 0;
  if (p >= b.ignite) {
    const wob = wobble * (1 - range(p, b.solve + 0.012, b.solve + 0.03)) * range(p, b.swing, b.swing + 0.05);
    const raw = lerp(0.222, 1.005, swing);
    // magnetic last few degrees
    const near = range(raw, 0.948, 1);
    s = clamp(lerp(raw, 1, smoothstep(near))) + wob;
    s = Math.min(1.025, Math.max(0.15, s));
  }
  const lampAz = lerp(rig.lampA, rig.lampB, s);

  // camera: title push → A framing → swing to B → a very slow push through the hold
  const pull = easeInOutCubic(range(p, b.titleEnd, 0.29));
  const camSwing = easeInOutCubic(range(p, 0.585, 0.765));
  const camAz = camSwing * 90 * DEG;
  let framing = lerpF(rig.title, rig.a, pull);
  if (p > 0.585) framing = lerpF(rig.a, rig.b, camSwing);
  if (p > b.solve) framing = lerpF(rig.b, rig.exit, easeInOutSine(range(p, b.solve, 1)));

  // the visible lamp stays beside the pile, and is visibly elsewhere when it comes back
  const relit = p >= b.ignite ? 1 - easeInOutSine(range(p, b.swing, b.solve)) : 0;
  const phi = lerp(p >= b.ignite ? rig.model.phiB : rig.model.phiA, rig.model.phiRelit, relit);
  const modelAz = camAz + phi;
  // off-frame for the title card, then clear of the back wall while facing the left one
  const modelR = p >= b.ignite ? rig.model.r : lerp(rig.model.rTitle, rig.model.rA, pull);

  // the beam opens from a narrow title spot, then tightens around each shadow
  const beam = easeInOutCubic(range(p, 0.05, 0.26));
  const coneOut = lerp(lerp(0.9, rig.coneA[1], beam), rig.coneB[1], smoothstep(range(s, 0.4, 1)));
  const coneIn = lerp(lerp(0.975, rig.coneA[0], beam), rig.coneB[0], smoothstep(range(s, 0.4, 1)));

  const ceil = lerp(lerp(8, rig.ceilA, beam), rig.ceilB, smoothstep(range(s, 0.4, 1)));

  // one wall at a time
  const lGain = lerp(1, 0.26, smoothstep(range(s, 0.42, 0.95)));
  const bGain = lerp(0.14, 1, smoothstep(range(s, 0.22, 0.72)));

  // left wall
  const lStage: 0 | 1 = p < 0.54 ? 0 : 1;
  const lS = lStage === 0 ? easeInOutSine(range(p, 0.07, b.iitLock)) : range(s, 0.05, 1.02);
  const lShape: 0 | 1 = p < 0.2 ? 0 : 1;
  let lLock = 0;
  if (lStage === 0) lLock = p < 0.2 ? 1 - range(p, 0.058, 0.09) : range(p, b.buildEnd, b.iitLock);
  const lSoft = lerp(0.1, 0, smoothstep(lLock)) + (lStage === 1 ? 0.06 * range(s, 0.2, 0.8) : 0);
  const lShear = lStage === 1 ? -0.55 * s : 0;
  const lSlide = lStage === 1 ? 2.0 * s * s : 0;
  const lGlint = bell(p, b.iitLock - 0.012, b.iitLock - 0.002, b.iitLock + 0.012, b.iitLock + 0.034);
  const iu0 = rig.iit.u0;
  const iu1 = rig.iit.u0 + rig.iit.sx + rig.iit.sy * 0.42;
  const lGlintX = lerp(iu0 - 0.6, iu1 + 0.6, range(p, b.iitLock - 0.01, b.iitLock + 0.03));
  // by the time the new shape locks, the old one has left the room
  const lAlpha = lStage === 0 ? 1 : 1 - smoothstep(range(s, 0.62, 0.9));

  // back wall
  const bS = range(s, 0.18, 1);
  const bLock = smoothstep(range(s, 0.93, 0.992));
  const bSoft = lerp(0.14, 0, smoothstep(range(s, 0.72, 0.985)));
  const bShear = 0.4 * (1 - range(s, 0.3, 1)) * (1 - bLock);
  const bSlide = -1.1 * Math.pow(1 - range(s, 0.3, 1), 2) * (1 - bLock);
  const bGlint = bell(p, b.solve - 0.015, b.solve - 0.002, b.solve + 0.03, b.solve + 0.07);
  const lu0 = rig.laptop.u;
  const lu1 = rig.laptop.u + rig.laptop.size + rig.laptop.top * 0.42;
  const bGlintX = lerp(lu0 - 0.6, lu1 + 0.6, range(p, b.solve - 0.012, b.solve + 0.06));
  const ignite = easeInOutSine(range(p, b.boot, b.end));

  const st: RoomState = out ?? ({} as RoomState);
  st.build = clamp(range(p, b.titleEnd, b.buildEnd));
  st.power = power;
  // the beam hangs quietly in the air, and thins while the shape is held
  st.conePower = power * lerp(1, 0.5, range(p, b.solve - 0.03, b.solve + 0.02));
  // nothing floats in front of the silhouette while it is held
  st.dustPower = power * lerp(1, 0.16, range(p, b.solve - 0.05, b.solve)) * (1 - 0.8 * bell(p, b.buildEnd - 0.02, b.iitLock, b.dark - 0.01, b.dark));
  st.lampAz = lampAz;
  st.s = s;
  st.camAz = camAz;
  st.framing = framing;
  st.coneIn = coneIn;
  st.coneOut = coneOut;
  st.ceil = ceil;
  st.modelAz = modelAz;
  st.modelR = modelR;
  st.lGain = lGain;
  st.bGain = bGain;
  st.room = lerp(1, 0.26, smoothstep(range(p, b.boot - 0.012, b.end)));
  st.warp = p >= b.ignite ? 0.9 * bell(s, 0.22, 0.5, 0.74, 0.96) : 0.42 * bell(p, 0.08, 0.18, 0.26, b.buildEnd);
  st.lShape = lShape;
  st.lStage = lStage;
  st.lS = lS;
  st.lLock = lLock;
  st.lSoft = lSoft;
  st.lShear = lShear;
  st.lSlide = lSlide;
  st.lGlint = lGlint;
  st.lGlintX = lGlintX;
  st.lAlpha = lAlpha;
  st.bS = bS;
  st.bLock = bLock;
  st.bSoft = bSoft;
  st.bShear = bShear;
  st.bSlide = bSlide;
  st.bGlint = bGlint;
  st.bGlintX = bGlintX;
  st.ignite = ignite;
  st.sky = skyAt(st.build);
  // the window only exists where it reads as one: gone before the camera turns it into a sliver
  st.winA = p < 0.54 ? 1 : 1 - range(p, 0.585, 0.635);
  return st;
}
