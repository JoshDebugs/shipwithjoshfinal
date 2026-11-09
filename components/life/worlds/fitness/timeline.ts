/**
 * The choreography as pure functions of progress (0 = title card, 1 = exit).
 * Scrolling back un-does every rep and cools every muscle exactly; only the
 * live layer (handprints, motion trails, sensor noise) runs on time.
 *
 *  0–8%    boot: BUILT THE BODY TOO. as lukewarm heat, a dim figure at the bar
 *  8–28%   SET 01 · DISCIPLINE   clean + 3 front squats (legs ignite)
 *  28–46%  SET 02 · TRAINING     3 presses (shoulders, arms), sweat flecks
 *  46–60%  SET 03 · NUTRITION    curls while cold food drifts in and flares
 *  60–84%  SET 04 · CONSISTENCY  4 thrusters — heat stacks to white-hot
 *  84–93%  LOCKOUT GLOW          bar overhead, the field blooms
 *  93–100% EXIT                  auto-range: a hotter source, the lamp
 */
import {
  bell,
  clamp,
  easeInCubic,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  lerp,
  range,
  smoothstep,
} from "@/components/life/multiverse/ease";

export const SETS = [
  { n: "01", word: "DISCIPLINE", label: "Discipline", line: "starting cold anyway.", a: 0.08, b: 0.28 },
  { n: "02", word: "TRAINING", label: "Training", line: "effort, rendered as heat.", a: 0.28, b: 0.46 },
  { n: "03", word: "NUTRITION", label: "Nutrition", line: "fuel in, heat out.", a: 0.46, b: 0.6 },
  { n: "04", word: "CONSISTENCY", label: "Consistency", line: "the heat never fully leaves.", a: 0.6, b: 0.84 },
] as const;

export const B = {
  hintA: 0.008,
  hintB: 0.026,
  hintC: 0.07,
  hintD: 0.086,
  headCoolA: 0.088,
  headCoolB: 0.17,
  lockA: 0.84,
  lockPeak: 0.9,
  lockCapA: 0.846,
  lockCapB: 0.866,
  lockCapC: 0.952,
  lockCapD: 0.972,
  exitA: 0.918,
  exitB: 0.982,
  lampA: 0.918,
  lampB: 0.975,
} as const;

/** Motion segments (progress). */
const M = {
  cleanA: 0.085,
  cleanB: 0.12,
  squatA: 0.12,
  squatB: 0.272,
  squatN: 3,
  pressA: 0.296,
  pressB: 0.452,
  pressN: 3,
  lowerA: 0.452,
  lowerB: 0.478,
  curlA: 0.48,
  curlB: 0.598,
  curlN: 2,
  thrA: 0.602,
  thrB: 0.832,
  thrN: 4,
} as const;

/** Pillar words branded into the field (index 1–4; 0 is the headline). */
export const BRAND = [0, 0.1, 0.298, 0.482, 0.614] as const;

export type Kind = "hang" | "clean" | "squat" | "rack" | "press" | "lower" | "curl" | "thruster" | "lockout";

export type Motion = {
  /** squat depth 0–1 */
  s: number;
  /** arms: 0 hang, 1 rack, 2 overhead */
  a: number;
  /** 0–1, the concentric (working) part of a rep */
  effort: number;
  kind: Kind;
  /** completed reps inside the current set (fractional while lifting) */
  work: number;
};

const sinBell = (t: number) => Math.sin(Math.PI * clamp(t));

function repSplit(p: number, a: number, b: number, n: number) {
  const x = clamp((p - a) / (b - a)) * n;
  const i = Math.min(n - 1, Math.floor(x));
  return { i, f: x - i };
}

/** Where the body is at progress p. */
export function motionAt(p: number, o: Motion): Motion {
  o.s = 0;
  o.a = 0;
  o.effort = 0;
  o.work = 0;
  if (p < M.cleanA) {
    o.kind = "hang";
  } else if (p < M.cleanB) {
    const f = range(p, M.cleanA, M.cleanB);
    o.kind = "clean";
    o.a = easeInOutCubic(range(f, 0.08, 0.86));
    o.s = 0.24 * sinBell(range(f, 0.2, 0.9));
    o.effort = 0.7 * sinBell(range(f, 0.1, 0.8));
    o.work = 0.5 * smoothstep(range(f, 0.1, 0.8));
  } else if (p < M.squatB) {
    const { i, f } = repSplit(p, M.squatA, M.squatB, M.squatN);
    o.kind = "squat";
    o.a = 1;
    const down = easeInOutSine(range(f, 0, 0.42));
    const up = easeInOutCubic(range(f, 0.5, 0.9));
    o.s = down * (1 - up);
    o.effort = sinBell(range(f, 0.48, 0.9));
    o.work = 0.5 + i + smoothstep(range(f, 0.5, 0.9));
  } else if (p < M.pressA) {
    o.kind = "rack";
    o.a = 1;
    o.work = 0;
  } else if (p < M.pressB) {
    const { i, f } = repSplit(p, M.pressA, M.pressB, M.pressN);
    o.kind = "press";
    const up = easeInOutCubic(range(f, 0.06, 0.42));
    const down = easeInOutSine(range(f, 0.55, 0.9));
    o.a = 1 + up * (1 - down);
    o.s = 0.07 * sinBell(range(f, 0.0, 0.14)); // a little dip-drive
    o.effort = sinBell(range(f, 0.04, 0.44));
    o.work = i + smoothstep(range(f, 0.06, 0.42));
  } else if (p < M.lowerB) {
    o.kind = "lower";
    o.a = 1 - easeInOutSine(range(p, M.lowerA, M.lowerB));
  } else if (p < M.curlB) {
    const { i, f } = repSplit(p, M.curlA, M.curlB, M.curlN);
    o.kind = "curl";
    const up = easeInOutCubic(range(f, 0.06, 0.44));
    const down = i === M.curlN - 1 ? 0 : easeInOutSine(range(f, 0.55, 0.92));
    o.a = p < M.curlA ? 0 : up * (1 - down);
    o.effort = 0.8 * sinBell(range(f, 0.04, 0.46));
    o.work = i + smoothstep(range(f, 0.06, 0.44));
  } else if (p < M.thrA) {
    o.kind = "rack";
    o.a = 1;
  } else if (p < M.thrB) {
    const { i, f } = repSplit(p, M.thrA, M.thrB, M.thrN);
    const last = i === M.thrN - 1;
    o.kind = "thruster";
    const down = easeInOutSine(range(f, 0, 0.3));
    const drive = easeInOutCubic(range(f, 0.36, 0.58));
    o.s = down * (1 - drive);
    const press = easeOutCubic(range(f, 0.45, 0.66));
    const lower = last ? 0 : easeInOutSine(range(f, 0.74, 0.94));
    o.a = 1 + press * (1 - lower);
    o.effort = sinBell(range(f, 0.34, 0.68));
    o.work = i + smoothstep(range(f, 0.36, 0.66));
  } else {
    o.kind = "lockout";
    o.a = 2;
  }
  return o;
}

/* ------------------------------------------------------------- heat model */

/** Muscle groups. */
export const G = { legs: 0, core: 1, arms: 2, head: 3 } as const;

// p, legs, core, arms, head — temperatures on the 0 (ink) … 1 (paper, white-hot) ramp
const KEYS: number[][] = [
  [0.0, 0.2, 0.22, 0.19, 0.26],
  [0.08, 0.2, 0.22, 0.19, 0.26],
  [0.28, 0.5, 0.31, 0.26, 0.28],
  [0.46, 0.5, 0.45, 0.6, 0.35],
  [0.6, 0.55, 0.68, 0.66, 0.43],
  [0.84, 0.95, 0.97, 0.95, 0.88],
  [0.9, 1.03, 1.08, 1.03, 0.98],
];

/** Fraction of each set's work done by p (stair-steps with the reps). */
function setWork(p: number, m: Motion): number {
  if (p < 0.08) return 0;
  if (p < 0.28) {
    if (m.kind === "hang") return 0;
    if (m.kind === "clean") return 0.15 * (m.work / 0.5);
    if (m.kind === "squat") return 0.15 + (0.85 * (m.work - 0.5)) / 3;
    return 1;
  }
  if (p < 0.46) return m.kind === "press" ? m.work / 3 : p < M.pressA ? 0 : 1;
  if (p < 0.6) {
    const curls = m.kind === "curl" ? m.work : p >= M.curlB ? 2 : 0;
    let food = 0;
    for (const f of FOOD) food += smoothstep(range(p, f.hit - 0.004, f.hit + 0.01));
    return clamp(curls * 0.2 + food * 0.2);
  }
  if (p < 0.84) return m.kind === "thruster" ? m.work / 4 : p < M.thrA ? 0 : 1;
  return easeInOutSine(range(p, 0.84, 0.9));
}

/** Rep effort weighting per group, by movement. */
const ACT: Record<Kind, [number, number, number, number]> = {
  hang: [0, 0, 0, 0],
  clean: [0.5, 0.35, 0.6, 0.2],
  squat: [1, 0.45, 0.12, 0.3],
  rack: [0, 0, 0, 0],
  press: [0.12, 0.5, 1, 0.3],
  lower: [0, 0, 0, 0],
  curl: [0, 0.25, 0.85, 0.15],
  thruster: [1, 0.8, 1, 0.55],
  lockout: [0, 0, 0, 0],
};

export type Heat = { g: [number, number, number, number]; flare: number };

/** Group temperatures at p (before the exit auto-range). */
export function heatAt(p: number, m: Motion, o: Heat): Heat {
  let k = 0;
  while (k < KEYS.length - 2 && p >= KEYS[k + 1][0]) k++;
  const a = KEYS[k];
  const b = KEYS[k + 1];
  const w = p >= b[0] ? 1 : setWork(p, m);
  const pulse = p < 0.3 ? 0.17 : p < 0.6 ? 0.12 : 0.1;
  const act = ACT[m.kind];
  let flare = 0;
  for (const f of FOOD) flare = Math.max(flare, foodFlare(p, f));
  for (let gi = 0; gi < 4; gi++) {
    o.g[gi] = lerp(a[gi + 1], b[gi + 1], w) + pulse * act[gi] * m.effort;
  }
  o.g[G.core] += 0.16 * flare;
  o.g[G.arms] += 0.04 * flare;
  o.flare = flare;
  return o;
}

/* ---------------------------------------------------------- food (set 3) */

export type Food = { type: 0 | 1 | 2; from: [number, number]; a: number; hit: number; size: number };

/** Egg, bowl, shaker — cold, dark, drifting into the core (figure units). */
export const FOOD: Food[] = [
  { type: 0, from: [-0.78, 0.98], a: 0.482, hit: 0.512, size: 0.11 },
  { type: 1, from: [0.82, 0.74], a: 0.514, hit: 0.546, size: 0.15 },
  { type: 2, from: [-0.8, 0.42], a: 0.546, hit: 0.578, size: 0.135 },
];

export function foodFlight(p: number, f: Food) {
  const t = range(p, f.a, f.hit);
  const alpha = smoothstep(range(t, 0, 0.25)) * (1 - smoothstep(range(p, f.hit - 0.002, f.hit + 0.004)));
  return { t: easeInOutCubic(t), alpha };
}

export function foodFlare(p: number, f: Food) {
  return bell(p, f.hit - 0.002, f.hit + 0.004, f.hit + 0.006, f.hit + 0.032);
}

/* ---------------------------------------------------------------- words */

/** Heat of each heat-type mask (0 headline, 1–4 pillar words): intensity and bleed (blur). */
export function wordHeat(p: number, k: number) {
  if (k === 0) {
    const cool = easeInOutSine(range(p, B.headCoolA, B.headCoolB));
    return { i: 1 - cool, blur: 0.12 + 0.88 * cool };
  }
  const t0 = BRAND[k];
  const rise = easeOutCubic(range(p, t0, t0 + 0.013));
  const bleed = easeInOutSine(range(p, t0 + 0.028, t0 + 0.12));
  // consistency: the earlier words resurface as warm residue while heat stacks
  const resurf = easeInOutSine(range(p, 0.64, 0.84));
  const bloom = easeInOutSine(range(p, 0.84, 0.9));
  let i = rise * lerp(1, 0.25, bleed);
  i += rise * resurf * (k < 4 ? 0.05 : 0.02);
  i = lerp(i, Math.max(i, 0.29), bloom * rise);
  // the auto-range wipes the wall: the exit frame is the figure and the lamp alone
  i *= 1 - 0.8 * easeInOutSine(range(p, B.exitA - 0.01, B.exitB - 0.01));
  const blur = clamp(0.06 + bleed * 0.9 - resurf * 0.3 - bloom * 0.2);
  return { i, blur };
}

/** Peak temperature of each heat-type mask. */
export const WORD_PEAK = [0.6, 0.9, 0.9, 0.9, 0.92] as const;

/* ------------------------------------------------------------ the finale */

/** Lockout bloom 0→1 (fades as the camera auto-ranges). */
export const bloomAt = (p: number) => easeInOutSine(range(p, B.lockA, B.lockPeak)) * (1 - 0.7 * easeInOutSine(range(p, B.exitA, B.exitB)));

/** Auto-range: a hotter source enters, everything else reads cooler. */
export const exitAt = (p: number) => easeInOutCubic(range(p, B.exitA, B.exitB));

/** The lamp: appears as a soft hot core, then focuses into the silhouette. */
export function lampAt(p: number) {
  const amt = easeInOutSine(range(p, B.lampA, B.lampB - 0.02));
  const sharp = easeInCubic(range(p, B.lampA + 0.012, B.lampB));
  return { amt, sharp };
}

/** COUCH ←→ BUILT needle (0–1) from the average heat. */
export function needleAt(avg: number) {
  return clamp((avg - 0.215) / (0.94 - 0.215));
}

/** Which HUD state we're in. */
export function phaseAt(p: number): { set: number; label: string } {
  if (p < 0.08) return { set: -1, label: "STANDBY" };
  for (let i = 0; i < SETS.length; i++) if (p < SETS[i].b) return { set: i, label: SETS[i].word };
  if (p < B.exitA + 0.02) return { set: 4, label: "LOCKOUT" };
  return { set: 5, label: "AUTO-RANGE" };
}

/** Set-4 reps completed (for the AGAIN. AGAIN. AGAIN. counter), fractional. */
export function thrusterReps(p: number) {
  const x = clamp((p - M.thrA) / (M.thrB - M.thrA)) * M.thrN;
  const i = Math.floor(x);
  const f = x - i;
  return Math.min(M.thrN, i + smoothstep(range(f, 0.5, 0.66)));
}
