/**
 * The one continuous camera move. The flight spirals in over the ridges, the
 * crane lifts it straight up, and the rest of the world is top-down framings
 * of the print, so DOM overlays can be pinned to print coordinates exactly.
 */
import { clamp, easeInOutCubic, easeInOutSine, easeOutCubic, lerp, range } from "@/components/life/multiverse/ease";
import { BEAT, valueSlot } from "./beats";
import { CY, F, LAMBDA, MINUTIAE, onLevel, type MinutiaKind } from "./field";
import { isStacked } from "./layout";

export const RIDGE_H = 0.0105;
/** Print plane the DOM overlays are registered to: just under the crest. */
export const Z_REF = RIDGE_H * 0.82;
export const SKIM_Z = RIDGE_H + 0.0072;
export const TOP_FOV = 32;
export const SKIM_FOV = 72;
export const SKIM_TILT = (84.5 * Math.PI) / 180;

const L0 = 25.4;
const L1 = 0.75;
const SWEEP = (112 * Math.PI) / 180;
const END_DEG = 270;
const N = 720;

export type CamFrame = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  tilt: number;
  fov: number;
  /** 1 once the camera is straight above the print. */
  flat: number;
  /** Dusk grade: 1 in the canyons, 0 under the clean top-down light. */
  dusk: number;
  /** Crest index under the camera (flight read-out). */
  level: number;
};

/* ------------------------------------------------------------- flight LUT */

const TAB = (() => {
  const xs = new Float32Array(N + 1);
  const ys = new Float32Array(N + 1);
  const yaw = new Float32Array(N + 1);
  const lev = new Float32Array(N + 1);
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const L = lerp(L0, L1, s);
    const k = L / L0;
    const deg = END_DEG - ((SWEEP * k * k * 180) / Math.PI);
    const q = onLevel(deg, L * LAMBDA);
    xs[i] = q.x;
    ys[i] = q.y;
    lev[i] = L;
  }
  // heading from a centred difference, unwrapped
  let prev = 0;
  for (let i = 0; i <= N; i++) {
    const a = Math.max(0, i - 2);
    const b = Math.min(N, i + 2);
    let h = Math.atan2(-(xs[b] - xs[a]), ys[b] - ys[a]);
    if (i > 0) {
      while (h - prev > Math.PI) h -= Math.PI * 2;
      while (h - prev < -Math.PI) h += Math.PI * 2;
    }
    yaw[i] = h;
    prev = h;
  }
  // low-pass the heading: the eye looks ahead, it never snaps
  const W = 34;
  const smooth = new Float32Array(N + 1);
  for (let i = 0; i <= N; i++) {
    let sum = 0;
    let cnt = 0;
    for (let j = i; j <= Math.min(N, i + W); j++) {
      sum += yaw[j];
      cnt++;
    }
    smooth[i] = sum / cnt;
  }
  return { xs, ys, yaw: smooth, lev };
})();

function sampleTab(tab: Float32Array, s: number) {
  const x = clamp(s) * N;
  const i = Math.min(N - 1, Math.floor(x));
  return tab[i] + (tab[i + 1] - tab[i]) * (x - i);
}

/** Crossing speed ramp: one world per beat at first, a blur by the end, then a dead stop. */
const SPEED = (() => {
  const M = 512;
  const out = new Float32Array(M + 1);
  let acc = 0;
  for (let i = 1; i <= M; i++) {
    const t = (i - 0.5) / M;
    const v = (0.46 + 1.7 * Math.pow(t, 1.7)) * (1 - Math.pow(range(t, 0.9, 1), 2.2));
    acc += v;
    out[i] = acc;
  }
  for (let i = 0; i <= M; i++) out[i] /= acc;
  return out;
})();

export function flightS(p: number) {
  const t = range(p, BEAT.flight[0], BEAT.flight[1]) * 512;
  const i = Math.min(511, Math.floor(t));
  return SPEED[i] + (SPEED[i + 1] - SPEED[i]) * (t - i);
}

export function levelAtP(p: number) {
  return sampleTab(TAB.lev, flightS(p));
}

/** Progress at which the camera crosses crest level L (for the name pops). */
export function pAtLevel(L: number) {
  const target = (L0 - L) / (L0 - L1);
  let lo: number = BEAT.flight[0];
  let hi: number = BEAT.flight[1];
  for (let i = 0; i < 28; i++) {
    const m = (lo + hi) / 2;
    if (flightS(m) < target) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/* ---------------------------------------------------------- top-down dock */

export type Dock = { cx: number; cy: number; sx: number; sy: number; S: number };

const lerpDock = (a: Dock, b: Dock, t: number): Dock => ({
  cx: lerp(a.cx, b.cx, t),
  cy: lerp(a.cy, b.cy, t),
  sx: lerp(a.sx, b.sx, t),
  sy: lerp(a.sy, b.sy, t),
  S: Math.exp(lerp(Math.log(a.S), Math.log(b.S), t)),
});

/** Pixels per print unit that fit the whole print on this stage. */
export function fullScale(W: number, H: number) {
  return Math.min((H - 92) / 1.3, (W - 8) / 1.02);
}

export const VALUE_ORDER: MinutiaKind[] = ["bifurcation", "lake", "spur", "ending", "island"];

export type Docks = ReturnType<typeof docks>;

export function docks(W: number, H: number) {
  const mobile = isStacked(W, H);
  const S0 = fullScale(W, H);
  const reveal: Dock = { cx: 0, cy: mobile ? 0 : -0.012, sx: W / 2, sy: mobile ? H * 0.47 : H * 0.525, S: S0 };
  const domains: Dock = mobile
    ? { cx: 0.02, cy: 0.1, sx: W / 2, sy: H * 0.32, S: S0 * 1.02 }
    : { cx: 0, cy: 0, sx: W * 0.7, sy: H * 0.525, S: S0 * 0.98 };
  const macroS = mobile ? S0 * 2.75 : S0 * 2.1;
  const value = VALUE_ORDER.map<Dock>((k) => {
    const m = MINUTIAE[k];
    return mobile
      ? { cx: m.x, cy: m.y, sx: W / 2, sy: H * 0.255, S: macroS }
      : { cx: m.x, cy: m.y, sx: W * 0.31, sy: H * 0.53, S: macroS };
  });
  const finale: Dock = mobile
    ? { cx: 0, cy: 0.02, sx: W / 2, sy: H * 0.235, S: Math.min(H * 0.33, W * 0.68) }
    : { cx: 0, cy: -0.01, sx: W * 0.285, sy: H * 0.53, S: S0 * 0.93 };
  // phones: once NEXT has been read, the print grows back to fill the top of the end frame
  const ending: Dock = mobile ? { cx: 0, cy: 0.03, sx: W / 2, sy: H * 0.31, S: Math.min(H * 0.4, W * 0.84) } : finale;
  return { reveal, domains, value, finale, ending, mobile, S0 };
}

/** The framing at progress p (only meaningful once the crane has finished). */
export function dockAt(p: number, d: Docks): Dock {
  const { reveal, domains, value, finale, ending } = d;
  if (p <= BEAT.headlineOut[0]) return reveal;
  if (p < BEAT.toValues[0]) {
    return lerpDock(reveal, domains, easeInOutCubic(range(p, BEAT.headlineOut[0], BEAT.domains[0] + 0.022)));
  }
  if (p < BEAT.values[0] + 0.004) {
    return lerpDock(domains, value[0], easeInOutCubic(range(p, BEAT.toValues[0], BEAT.values[0] + 0.004)));
  }
  if (p < BEAT.values[1]) {
    let i = 0;
    while (i < 4 && p >= valueSlot(i + 1)[0]) i++;
    if (i === 0) return value[0];
    const [a, b] = valueSlot(i);
    return lerpDock(value[i - 1], value[i], easeInOutCubic(range(p, a, a + (b - a) * 0.4)));
  }
  if (p < BEAT.finale[0] + 0.03) return lerpDock(value[4], finale, easeInOutCubic(range(p, BEAT.values[1], BEAT.finale[0] + 0.03)));
  return lerpDock(finale, ending, easeInOutCubic(range(p, BEAT.story[0] - 0.016, BEAT.story[0] + 0.002)));
}

/* -------------------------------------------------------------- the pose */

export function emptyFrame(): CamFrame {
  return { x: 0, y: 0, z: 1, yaw: 0, tilt: 0, fov: TOP_FOV, flat: 1, dusk: 0, level: 0 };
}

const tanHalf = (fovDeg: number) => Math.tan((fovDeg * Math.PI) / 360);

export function poseAt(p: number, W: number, H: number, d: Docks, out: CamFrame): CamFrame {
  const s = flightS(p);
  const fx = sampleTab(TAB.xs, s);
  const fy = sampleTab(TAB.ys, s);
  const fyaw = sampleTab(TAB.yaw, s);
  out.level = sampleTab(TAB.lev, s);

  const craneRaw = range(p, BEAT.crane[0], BEAT.crane[1]);
  if (craneRaw >= 1) {
    const k = dockAt(p, d);
    const t = tanHalf(TOP_FOV);
    out.x = k.cx + (W / 2 - k.sx) / k.S;
    out.y = k.cy - (H / 2 - k.sy) / k.S;
    out.z = Z_REF + H / 2 / (k.S * t);
    out.yaw = 0;
    out.tilt = 0;
    out.fov = TOP_FOV;
    out.flat = 1;
    out.dusk = 0;
    return out;
  }

  const intro = range(p, BEAT.unspool[0], BEAT.flight[0] + 0.03);
  const introE = easeInOutCubic(intro);
  // hover above the rim for the title, then tip down to skim height
  const zFlight = lerp(SKIM_Z + 0.046, SKIM_Z, introE);
  const tiltFlight = lerp((80.5 * Math.PI) / 180, SKIM_TILT, introE);

  if (craneRaw <= 0) {
    out.x = fx;
    out.y = fy;
    out.z = zFlight;
    out.yaw = fyaw;
    out.tilt = tiltFlight;
    out.fov = SKIM_FOV;
    out.flat = 0;
    out.dusk = 1;
    return out;
  }

  // the crane: rise fast at first, settle slowly; pitch comes round behind it
  const k = d.reveal;
  const t = tanHalf(TOP_FOV);
  const zEnd = Z_REF + H / 2 / (k.S * t);
  const xEnd = k.cx + (W / 2 - k.sx) / k.S;
  const yEnd = k.cy - (H / 2 - k.sy) / k.S;
  const rise = easeInOutCubic(craneRaw);
  const pitch = easeInOutSine(range(craneRaw, 0.06, 0.92));
  const move = easeInOutCubic(range(craneRaw, 0.12, 1));
  out.x = lerp(fx, xEnd, move);
  out.y = lerp(fy, yEnd, move);
  out.z = Math.exp(lerp(Math.log(zFlight), Math.log(zEnd), rise));
  out.yaw = lerp(fyaw, 0, easeOutCubic(range(craneRaw, 0, 0.7)));
  out.tilt = lerp(tiltFlight, 0, pitch);
  out.fov = lerp(SKIM_FOV, TOP_FOV, easeInOutSine(range(craneRaw, 0.25, 1)));
  out.flat = easeInOutSine(range(craneRaw, 0.62, 1));
  out.dusk = 1 - easeInOutSine(range(craneRaw, 0.5, 0.98));
  return out;
}

/** Print coords → stage px for the current (top-down) frame. */
export function printToStage(f: CamFrame, W: number, H: number, x: number, y: number): [number, number, number] {
  const S = H / 2 / ((f.z - Z_REF) * tanHalf(f.fov));
  return [W / 2 + (x - f.x) * S, H / 2 - (y - f.y) * S, S];
}

export { CY, F };
