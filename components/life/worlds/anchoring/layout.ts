/**
 * Responsive geometry for "Up To Eleven" — every position in stage px.
 *
 * Desktop: a print poster. The knob is centre-stage on the title card, then
 * docks into a console at bottom-left (knob + meter bridge + print slug),
 * speaker cones stand cropped at the right edge, the type lives centre.
 * Phone: the console docks at the top (no site nav there), the cones become
 * stage monitors peeking from the bottom corners, rows break short and loud.
 */
import { clamp } from "@/components/life/multiverse/ease";
import { ROWS } from "./copy";

export type Pose = { x: number; y: number; s: number };

export type Layout = {
  W: number;
  H: number;
  mobile: boolean;
  /** Knob design box (px at scale 1). */
  K: number;
  knob: { title: Pose; console: Pose; exit: Pose };
  labelY: number;
  whisperY: number;
  tap: { dx: number; y: number };
  line: { title: number; mid: number; exit: number };
  mic: { h: number; hClip: number; exitX: number };
  amp: { max: number; hum: number; rest: number };
  waveK: number;
  vu: { x: number; y: number; segW: number; segH: number; gap: number; labelEvery: number };
  /** `titleX`: centre of the slug on the title card (null = it only exists docked). */
  slug: { x: number; y: number; titleX: number | null };
  /** Paper label behind the meter bridge + slug. */
  panel: { x: number; y: number; w: number; h: number };
  band: { rails: [number, number, number, number]; rowH: number; waveH: number; font: number; maxTextW: number };
  cones: { x: number; y: number; r: number; dx: number; dy: number }[];
  skate: { S: number; x: number; y: number };
  type: { whisper: number; tap: number; opener: number; openerLead: number; welcome: number; welcomeLead: number; age: number; mono: number };
  fit: { grade6: number; grade7: number; inside: number; max: number };
  ys: { grade6: number; grade7: number; inside: number; age: number };
  /** Sideways nudge that keeps the two loudest (widest) lines off the speaker cones. */
  loudDx: number;
  openerGap: number;
  welcomeGap: number;
  rows: (typeof ROWS)["desktop"] | (typeof ROWS)["mobile"];
  cells: [number, number, number, number];
  marks: { inset: number };
};

/** Anybody's cap height as a fraction of the em (measured by eye against the rails). */
export const CAP = 0.715;

/** Stage-width fraction of the two loudest desktop lines. */
const LOUD_FIT = 0.74;

export function computeLayout(W: number, H: number, mobile: boolean): Layout {
  const K = 300;
  if (mobile) {
    const sc = clamp(W / 390, 0.82, 1.15);
    const rowH = 0.098 * H;
    const waveH = 0.08 * H;
    const bandC = 0.47 * H;
    const top = bandC - (2 * rowH + waveH) / 2;
    const rails: [number, number, number, number] = [top, top + rowH, top + rowH + waveH, top + 2 * rowH + waveH];
    const knobTitleS = clamp(W / 470, 0.62, 0.9);
    const titleY = 0.395 * H;
    const lineTitle = 0.665 * H;
    const lineExit = 0.64 * H;
    const S = Math.round(clamp(W * 0.32, 100, 150));
    const coneR = 0.36 * W;
    const vuSegW = Math.floor((W - 128 - 24) / 12) - 4;
    return {
      W,
      H,
      mobile,
      K,
      knob: {
        title: { x: W / 2, y: titleY, s: knobTitleS },
        console: { x: 62, y: 134, s: 0.36 },
        exit: { x: W / 2, y: 0.265 * H, s: knobTitleS * 0.84 },
      },
      labelY: titleY - (K / 2) * knobTitleS - 22,
      whisperY: lineTitle + 0.078 * H,
      tap: { dx: 62 * sc, y: lineTitle - 28 * sc },
      line: { title: lineTitle, mid: 0.62 * H, exit: lineExit },
      mic: { h: 60 * sc, hClip: waveH * 0.86, exitX: 0.81 * W },
      amp: { max: 0.07 * H, hum: 0.02 * H, rest: 0.9 },
      waveK: (Math.PI * 2) / (W * 0.62),
      vu: { x: 128, y: 112, segW: vuSegW, segH: 11, gap: 4, labelEvery: 3 },
      slug: { x: 128, y: 150, titleX: null },
      panel: { x: 128 - 10, y: 112 - 10, w: 12 * vuSegW + 11 * 4 + 20, h: 150 + 10 + 10 - (112 - 10) },
      band: { rails, rowH, waveH, font: (1.35 * rowH) / CAP, maxTextW: 0.9 * W },
      cones: [
        { x: 0.04 * W, y: H + 0.07 * H, r: coneR, dx: 0, dy: coneR * 1.2 },
        { x: 0.96 * W, y: H + 0.07 * H, r: coneR, dx: 0, dy: coneR * 1.2 },
      ],
      skate: { S, x: W / 2 - 0.535 * S, y: lineExit - 0.96 * S },
      type: { whisper: 34 * sc, tap: 24 * sc, opener: 28 * sc, openerLead: 34 * sc, welcome: 30 * sc, welcomeLead: 36 * sc, age: 13, mono: 9 },
      fit: { grade6: 0.8, grade7: 0.86, inside: 0.88, max: 0.24 * W },
      ys: { grade6: 0.33 * H, grade7: 0.33 * H, inside: 0.34 * H, age: rails[3] + 40 },
      loudDx: 0,
      openerGap: 20 * sc,
      welcomeGap: 40 * sc,
      rows: ROWS.mobile,
      cells: [36, 40, 44, 30],
      marks: { inset: 18 },
    };
  }

  const sc = clamp(Math.min(W / 1440, H / 900), 0.6, 1.3);
  const rowH = 0.185 * H;
  const waveH = 0.105 * H;
  const bandC = 0.43 * H;
  const top = bandC - (2 * rowH + waveH) / 2;
  const rails: [number, number, number, number] = [top, top + rowH, top + rowH + waveH, top + 2 * rowH + waveH];
  const knobTitleS = clamp(H / 900, 0.62, 1.15);
  const titleY = 0.385 * H;
  const lineTitle = 0.68 * H;
  const lineExit = 0.7 * H;
  const S = Math.round(clamp(0.2 * H, 130, 230));
  const coneR = 0.27 * H;
  const consoleS = clamp(0.62 * sc, 0.5, 0.75);
  const consoleX = 40 + (K / 2) * consoleS;
  const consoleY = H - 52 - (K / 2) * consoleS;
  const cell = clamp(sc, 0.85, 1.25);
  const vuX = consoleX + (K / 2) * consoleS + 30;
  const segW = Math.round(24 * sc);
  const gap = Math.round(5 * sc);
  return {
    W,
    H,
    mobile,
    K,
    knob: {
      title: { x: W / 2, y: titleY, s: knobTitleS },
      console: { x: consoleX, y: consoleY, s: consoleS },
      exit: { x: W / 2, y: 0.29 * H, s: knobTitleS * 0.86 },
    },
    labelY: titleY - (K / 2) * knobTitleS - 26,
    whisperY: lineTitle + 0.075 * H,
    tap: { dx: 92 * sc, y: lineTitle - 34 * sc },
    line: { title: lineTitle, mid: 0.62 * H, exit: lineExit },
    mic: { h: 74 * sc, hClip: waveH * 0.86, exitX: 0.715 * W },
    amp: { max: 0.085 * H, hum: 0.026 * H, rest: 1.2 },
    waveK: (Math.PI * 2) / (W * 0.36),
    vu: { x: vuX, y: consoleY - 14, segW, segH: Math.round(13 * sc), gap, labelEvery: 1 },
    slug: { x: vuX, y: consoleY + 34, titleX: W / 2 },
    panel: { x: vuX - 14, y: consoleY - 14 - 13, w: 12 * segW + 11 * gap + 28, h: 34 + 10 + 14 + 14 + 13 },
    band: { rails, rowH, waveH, font: (1.35 * rowH) / CAP, maxTextW: 0.86 * W },
    cones: [
      { x: W + 0.12 * coneR, y: 0.24 * H, r: coneR, dx: coneR * 1.15, dy: 0 },
      { x: W + 0.12 * coneR, y: 0.77 * H, r: coneR, dx: coneR * 1.15, dy: 0 },
    ],
    skate: { S, x: W / 2 - 0.535 * S, y: lineExit - 0.96 * S },
    type: {
      whisper: 46 * sc,
      tap: 30 * sc,
      opener: 38 * sc,
      openerLead: 46 * sc,
      welcome: 42 * sc,
      welcomeLead: 50 * sc,
      age: 15 * sc,
      mono: 10,
    },
    fit: { grade6: 0.6, grade7: LOUD_FIT, inside: LOUD_FIT, max: 0.2 * H },
    ys: { grade6: 0.33 * H, grade7: 0.34 * H, inside: 0.34 * H, age: rails[3] + 46 * sc },
    loudDx: Math.min(0, W + 0.12 * coneR - coneR - 26 - (W / 2 + (LOUD_FIT * W) / 2)),
    openerGap: 26 * sc,
    welcomeGap: 62 * sc,
    rows: ROWS.desktop,
    cells: [36 * cell, 40 * cell, 44 * cell, 32 * cell],
    marks: { inset: 26 },
  };
}
