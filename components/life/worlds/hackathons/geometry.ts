/**
 * Stage-dependent layout for Hot Reload. Pure: (width, height) → numbers.
 *
 * Every styled element of the poster is an absolutely positioned "piece"
 * placed from these rects, so the crash, the heap and the hot reload only
 * ever move pieces with transforms (no layout per frame). Anybody's advances
 * are the font's own data (measured once in Chrome), so the heading can be
 * laid out without measuring the DOM; only the raw Times page is measured.
 */
import { B } from "./timeline";
import { clamp } from "@/components/life/multiverse/ease";
import { EVENTS } from "./copy";

export type Rect = { x: number; y: number; w: number; h: number };

/** Anybody 900 advance widths (em). */
const ADV_150: Record<string, number> = { H: 1.128, A: 1.195, C: 1.084, K: 1.025, T: 1.069, O: 1.13, N: 1.258, S: 1.1 };
const ADV_100: Record<string, number> = { HACK: 2.911, A: 0.787, THONS: 3.794 };
/** In a `line-height: 1` span, Anybody's caps sit on [CAP.top, CAP.top + CAP.h] em. */
export const CAP = { top: 0.0995, h: 0.6755 } as const;

export type PieceKind =
  | "letter"
  | "chip"
  | "card"
  | "burst"
  | "sticker"
  | "slab"
  | "tag"
  | "sun"
  | "checker"
  | "button"
  | "link"
  | "logo"
  | "tile";

export type PieceDef = {
  id: string;
  kind: PieceKind;
  /** Styled layout rect (page px). */
  rect: Rect;
  /** Styled rotation (deg). */
  r0: number;
  /** Nesting depth → debug outline ink. */
  depth: number;
  tag?: string;
  text?: string;
  index: number;
  /** Story time it pops in during BUILD. */
  appear: number;
  /** "letter" pieces fly in from the raw h1; "card" pieces grow out of the raw links. */
  enter: "pop" | "letter" | "card" | "bar";
  mass: "heavy" | "light" | "round";
  /** Largest |tilt| it may rest at in the heap (deg). */
  tilt: number;
  /** Extra full turns while falling. */
  spin: number;
};

/** Which plane of the pile a piece falls on (0 back → 2 front). */
export const planeOf = (k: PieceKind): 0 | 1 | 2 => (k === "card" ? 0 : k === "slab" || k === "chip" || k === "checker" ? 1 : 2);

export type Geo = {
  W: number;
  H: number;
  mobile: boolean;
  u: number;
  m: number;
  status: number;
  floor: number;
  head: { fs: number; wdth: number; capH: number; lineY: number[] };
  pieces: PieceDef[];
  clicks: [number, number][];
  /** Paint-bucket floods: bloom at (x,y) to r, then drain into (tx,ty,tr). */
  floods: { x: number; y: number; r: number; tx: number; ty: number; tr: number }[];
  raw: { x: number; w: number; top: number; bottom: number; h1: number; body: number; li: number; boxW: number; boxH: number; btn: number };
  editor: Rect;
  sheet: Rect;
  /** Stack lines the error sheet can afford: short stages keep only the guilty one. */
  sheetLines: 0 | 1 | 4;
  toast: { x: number; y: number; w: number; h: number; gap: number };
  /** Centre of the hot-reload pill: the free slot beside the bottom row. */
  pill: { x: number; y: number };
  terminal: Rect;
  proj: { scale: number; cy: number; tilt: number; persp: number; lens: [number, number] };
  whorl: Rect;
  motto: { lines: string[]; fs: number; lineH: number; y: number; x: number; align: "left" | "center"; wdth: number };
  gitLine: { x: number; y: number; w: number; align: "left" | "center" };
  card: { fTitle: number; fResult: number; fSmall: number; pad: number };
  chip: { fs: number };
};

export function computeGeo(W: number, H: number): Geo {
  return W < 768 ? mobileGeo(W, H) : desktopGeo(W, H);
}

/* ---------------------------------------------------------------- desktop */

function desktopGeo(W: number, H: number): Geo {
  const u = clamp(Math.min(W / 1440, H / 900), 0.72, 1.35);
  const m = Math.round(40 * u);
  const status = 26;
  const floor = H - status;
  const wdth = 150;
  const gap = 0.016; // em between letter pieces

  // heading: HACK / ATHONS, line 2 fills the measure
  const l1 = ["H", "A", "C", "K"];
  const l2 = ["A", "T", "H", "O", "N", "S"];
  const em = (ls: string[]) => ls.reduce((a, c) => a + ADV_150[c], 0) + gap * (ls.length - 1);
  const fs = Math.min((W - 2 * m) / em(l2), (0.235 * H) / 1);
  const capH = fs * CAP.h;
  const headTop = Math.max(108, Math.round(112 * u));
  const line2Y = headTop + capH + 0.17 * fs;
  const lineY = [headTop, line2Y];

  const pieces: PieceDef[] = [];
  const push = (p: Omit<PieceDef, "index" | "spin"> & { index?: number; spin?: number }) =>
    pieces.push({ index: 0, spin: 0, ...p, rect: roundRect(p.rect) });

  // the page, top to bottom: heading on its highlight, the four verbs as one
  // process bar, a thin checker rule, the three result cards, a bottom row
  const hackW = em(l1) * fs;
  const slabH = capH * 0.53 + 20 * u;
  const slabY = line2Y + capH * 0.47;
  const chipGap = Math.round(12 * u);
  const chipH = Math.round(46 * u);
  const chipW = (W - 2 * m - 3 * chipGap) / 4;
  const chipsY = slabY + slabH + 12 * u;
  const checkerH = Math.round(14 * u);
  const checkerY = chipsY + chipH + 10 * u;
  const cardsGap = Math.round(22 * u);
  const cardsY = checkerY + checkerH + 12 * u;
  const bottomRowH = 44 * u;
  const cardH = clamp(floor - 16 * u - bottomRowH - 14 * u - cardsY, 196 * u, 330 * u);
  const cardW = (W - 2 * m - 2 * cardsGap) / 3;

  // the free corner right of HACK: sticker, sun, age badge
  const sunD = 216 * u;
  const sunC: [number, number] = [W - m - 240 * u, headTop + capH * 0.5 + 12 * u];
  const burstD = 150 * u;
  const burstC: [number, number] = [W - m - 66 * u, headTop + capH * 0.5 - 28 * u];
  const stickerD = 104 * u;
  const stickerC: [number, number] = [W - m - 400 * u, headTop + capH * 0.5 + 12 * u];

  const clicks: [number, number][] = [
    [m + hackW * 0.42, headTop + capH * 0.5],
    burstC,
    stickerC,
  ];
  const floodAppear = (k: number, x: number, y: number) => {
    const [cx, cy] = clicks[k];
    const far = Math.hypot(W, H);
    return B.clicks[k] + 0.004 + (Math.hypot(x - cx, y - cy) / far) * B.floodDur * 1.5;
  };
  const slabL = m - 16 * u;
  const slabR = W - m + 16 * u;
  const slabJoint = W * 0.56;
  const diag = Math.hypot(W, H);
  const floods = [
    { x: clicks[0][0], y: clicks[0][1], r: 0.42 * diag, tx: slabJoint, ty: slabY + slabH / 2, tr: slabH / 2 },
    { x: clicks[1][0], y: clicks[1][1], r: 0.36 * diag, tx: sunC[0], ty: sunC[1], tr: sunD / 2 },
    { x: clicks[2][0], y: clicks[2][1], r: 0.3 * diag, tx: stickerC[0], ty: stickerC[1], tr: stickerD / 2 },
  ];
  const settled = (k: number) => B.settleA + k * B.settleStep + B.settleDur;

  // cards first: they sit furthest back in the pile — grow out of the raw links
  for (let i = 0; i < 3; i++) {
    push({
      id: `card${i}`,
      kind: "card",
      rect: { x: m + i * (cardW + cardsGap), y: cardsY, w: cardW, h: cardH },
      r0: 0,
      depth: 0,
      appear: B.cardA + i * B.cardStep,
      enter: "card",
      mass: "heavy",
      tilt: 7,
      index: i,
      tag: EVENTS[i].tag,
    });
  }

  // checker rule — flood 2
  const segW = (W - 2 * m) / 3;
  for (let i = 0; i < 3; i++) {
    const x = m + i * segW;
    push({ id: `checker${i}`, kind: "checker", rect: { x, y: checkerY, w: segW, h: checkerH }, r0: 0, depth: 1, appear: floodAppear(2, x + segW / 2, checkerY), enter: "pop", mass: "light", tilt: 9, index: i });
  }

  // the highlight is two planks butted together: the crash snaps them apart
  push({ id: "slab0", kind: "slab", rect: { x: slabL, y: slabY, w: slabJoint - slabL, h: slabH }, r0: 0, depth: 1, appear: settled(0) - 0.012, enter: "bar", mass: "heavy", tilt: 1.2, index: 0, tag: "div.highlight" });
  push({ id: "slab1", kind: "slab", rect: { x: slabJoint, y: slabY, w: slabR - slabJoint, h: slabH }, r0: 0, depth: 1, appear: settled(0) - 0.012, enter: "bar", mass: "heavy", tilt: 1.2, index: 1 });

  // the four verbs — one process bar
  for (let i = 0; i < 4; i++) {
    push({
      id: `chip${i}`,
      kind: "chip",
      rect: { x: m + i * (chipW + chipGap), y: chipsY, w: chipW, h: chipH },
      r0: 0,
      depth: 2,
      appear: B.chipA + i * B.chipStep,
      enter: "pop",
      mass: "light",
      tilt: 22,
      index: i,
      tag: i === 1 ? '<Chip verb="BREAK" />' : undefined,
    });
  }

  push({ id: "sun", kind: "sun", rect: { x: sunC[0] - sunD / 2, y: sunC[1] - sunD / 2, w: sunD, h: sunD }, r0: 0, depth: 0, appear: settled(1) - 0.012, enter: "pop", mass: "round", tilt: 0, tag: "div.sun" });

  // heading letters
  const letters = [l1, l2];
  let li = 0;
  letters.forEach((line, row) => {
    let x = m;
    line.forEach((ch) => {
      const w = ADV_150[ch] * fs;
      push({
        id: `l${li}`,
        kind: "letter",
        rect: { x, y: lineY[row], w, h: capH },
        r0: 0,
        depth: 2,
        text: ch,
        appear: B.letterA + li * B.letterStep,
        enter: "letter",
        mass: "light",
        tilt: 18,
        index: li,
        tag: li === 0 ? "h1 > span" : li === 6 ? "span.glyph" : undefined,
      });
      x += w + gap * fs;
      li++;
    });
  });

  // starburst + sticker (round)
  push({ id: "burst", kind: "burst", rect: { x: burstC[0] - burstD / 2, y: burstC[1] - burstD / 2, w: burstD, h: burstD }, r0: -8, depth: 1, appear: floodAppear(1, ...burstC) + 0.004, enter: "pop", mass: "round", tilt: 0, spin: 1, tag: "<Badge age={18} />" });
  push({ id: "sticker", kind: "sticker", rect: { x: stickerC[0] - stickerD / 2, y: stickerC[1] - stickerD / 2, w: stickerD, h: stickerD }, r0: 10, depth: 1, appear: floodAppear(2, ...stickerC) + 0.004, enter: "pop", mass: "round", tilt: 0, spin: -1 });

  // bottom row: button, hot-reload tag, halftone tile (the toasts land to their right)
  const rowY = cardsY + cardH + 14 * u;
  push({ id: "ship", kind: "button", text: "Ship it ▲", rect: { x: m, y: rowY, w: 158 * u, h: bottomRowH }, r0: 0, depth: 2, appear: B.extrasA + 0.012, enter: "pop", mass: "light", tilt: 16, tag: "button#ship" });
  push({ id: "hot", kind: "tag", text: "↻ HOT RELOAD", rect: { x: m + 178 * u, y: rowY + 1 * u, w: 220 * u, h: 42 * u }, r0: -3, depth: 2, appear: floodAppear(2, m + 288 * u, rowY), enter: "pop", mass: "light", tilt: 16 });
  push({ id: "tile", kind: "tile", rect: { x: m + 420 * u, y: rowY, w: 250 * u, h: bottomRowH }, r0: 0, depth: 1, appear: floodAppear(0, m + 545 * u, rowY), enter: "pop", mass: "light", tilt: 8 });

  // nav (top band, clear of the centre)
  push({ id: "logo", kind: "logo", text: "hack/josh", rect: { x: m, y: 30 * u, w: 172 * u, h: 38 * u }, r0: 0, depth: 2, appear: B.extrasA, enter: "pop", mass: "light", tilt: 14, tag: "nav > a.logo" });
  ["schedule", "teams", "judging"].forEach((t, i) =>
    push({ id: `link${i}`, kind: "link", text: t, rect: { x: m + 196 * u + i * 104 * u, y: 36 * u, w: 94 * u, h: 26 * u }, r0: 0, depth: 3, appear: B.extrasA + (i + 1) * B.extrasStep, enter: "pop", mass: "light", tilt: 24, index: i }),
  );
  push({ id: "submit", kind: "button", text: "Submit →", rect: { x: W - m - 172 * u, y: 27 * u, w: 172 * u, h: 44 * u }, r0: 0, depth: 2, appear: B.extrasA + 0.016, enter: "pop", mass: "light", tilt: 16, index: 1 });

  // raw v0.0.1 page — a narrow centred column so it reads through the laptop portal
  const rawW = Math.min(660 * u, W - 2 * m - 80 * u);
  const raw = {
    x: Math.round((W - rawW) / 2),
    w: Math.round(rawW),
    top: 96,
    bottom: floor - 8,
    h1: Math.round(118 * u),
    body: Math.round(24 * u),
    li: Math.round(30 * u),
    boxW: Math.round(232 * u),
    boxH: Math.round(128 * u),
    btn: Math.round(19 * u),
  };

  const sheetW = Math.min(990 * u, W - 2 * m);
  const termW = Math.min(760 * u, W - 2 * m);
  const termH = 132 * u;
  const projScale = 0.7;
  // clear of the site's tagline, which sits just under the nav
  const slideTop = Math.max(120, 124 * u);
  const whorlS = Math.round(176 * u);
  const mottoFs = Math.min(W * 0.088, H * 0.15);

  return {
    W,
    H,
    mobile: false,
    u,
    m,
    status,
    floor,
    head: { fs, wdth, capH, lineY },
    pieces,
    clicks,
    floods,
    raw,
    sheetLines: H < 800 ? 1 : 4,
    editor: roundRect({ x: W - m - 462 * u, y: Math.max(98, 100 * u), w: 462 * u, h: 172 * u }),
    sheet: roundRect({ x: (W - sheetW) / 2, y: Math.max(102, 106 * u), w: sheetW, h: 318 * u }),
    toast: { x: m + 690 * u, y: rowY + 4 * u, w: 126 * u, h: 36 * u, gap: 8 * u },
    pill: { x: m + 690 * u + 197 * u, y: rowY + 2 * u },
    terminal: roundRect({ x: m, y: floor - 22 * u - termH, w: termW, h: termH }),
    proj: { scale: projScale, cy: slideTop + (H * projScale) / 2, tilt: -7, persp: 1500 * u, lens: [W / 2, floor - 44 * u] },
    whorl: roundRect({ x: W / 2 - whorlS / 2, y: Math.max(116, H * 0.15), w: whorlS, h: whorlS }),
    motto: { lines: ["BUILD. BREAK.", "PITCH. REPEAT."], fs: mottoFs, lineH: mottoFs * 0.98, y: Math.max(116, H * 0.15) + whorlS + 46 * u, x: W / 2, align: "center", wdth: 112 },
    gitLine: { x: W / 2, y: Math.max(116, H * 0.15) + whorlS + 46 * u + mottoFs * 2.15 + 26 * u, w: W - 2 * m, align: "center" },
    card: { fTitle: Math.round(30 * u * clamp(cardH / (300 * u), 0.78, 1.1)), fResult: Math.round(112 * u * clamp(cardH / (300 * u), 0.72, 1.1)), fSmall: Math.max(11, Math.round(13 * u)), pad: Math.round(22 * u) },
    chip: { fs: Math.round(25 * u) },
  };
}

/* ----------------------------------------------------------------- mobile */

function mobileGeo(W: number, H: number): Geo {
  const u = clamp(Math.min(W / 390, H / 844), 0.66, 1.25);
  const m = Math.round(20 * u);
  // tall enough to hold the film's HUD pill, which sits in its right half
  const status = 54;
  const floor = H - status;
  const wdth = 100;
  const gap = 0.02;

  const lines = [["HACK", "A"], ["THONS"]];
  const em = (ls: string[]) => ls.reduce((a, c) => a + ADV_100[c], 0) + gap * (ls.length - 1);
  const fs = Math.min((W - 2 * m) / Math.max(em(lines[0]), em(lines[1])), (0.125 * H) / CAP.h);
  const capH = fs * CAP.h;
  const headTop = Math.max(104, Math.round(110 * u));
  const line2Y = headTop + capH + 0.2 * fs;
  const lineY = [headTop, line2Y];

  const pieces: PieceDef[] = [];
  const push = (p: Omit<PieceDef, "index" | "spin"> & { index?: number; spin?: number }) =>
    pieces.push({ index: 0, spin: 0, ...p, rect: roundRect(p.rect) });

  const chipGap = Math.round(10 * u);
  const chipH = Math.round(42 * u);
  const chipW = (W - 2 * m - chipGap) / 2;
  const chipsY = line2Y + capH + 26 * u;
  const checkerY = chipsY + 2 * chipH + chipGap + 18 * u;
  const checkerH = Math.round(14 * u);
  const cardsY = checkerY + checkerH + 16 * u;
  const cardGap = Math.round(10 * u);
  const rowH = 36 * u;
  const cardH = clamp((floor - 12 * u - rowH - 12 * u - cardsY - 2 * cardGap) / 3, 88 * u, 126 * u);
  const cardW = W - 2 * m;
  // the two seals sit on the checker rule, the sun rises behind the heading
  const burstD = 76 * u;
  const burstC: [number, number] = [W - m - 40 * u, checkerY + checkerH / 2 + 3 * u];
  const stickerD = 68 * u;
  const stickerC: [number, number] = [m + 36 * u, checkerY + checkerH / 2];
  const sunD = 150 * u;
  const sunC: [number, number] = [W - m - 52 * u, headTop + capH * 0.55];
  const line1W = em(lines[0]) * fs;
  const clicks: [number, number][] = [
    [m + line1W * 0.4, headTop + capH * 0.5],
    burstC,
    stickerC,
  ];
  const floodAppear = (k: number, x: number, y: number) => {
    const [cx, cy] = clicks[k];
    const far = Math.hypot(W, H);
    return B.clicks[k] + 0.004 + (Math.hypot(x - cx, y - cy) / far) * B.floodDur * 1.5;
  };
  const slabRect: Rect = { x: m - 10 * u, y: line2Y + capH * 0.47, w: W - 2 * m + 20 * u, h: capH * 0.53 + 14 * u };
  const slabJoint = W * 0.56;
  const diag = Math.hypot(W, H);
  const floods = [
    { x: clicks[0][0], y: clicks[0][1], r: 0.42 * diag, tx: slabJoint, ty: slabRect.y + slabRect.h / 2, tr: slabRect.h / 2 },
    { x: clicks[1][0], y: clicks[1][1], r: 0.36 * diag, tx: sunC[0], ty: sunC[1], tr: sunD / 2 },
    { x: clicks[2][0], y: clicks[2][1], r: 0.3 * diag, tx: stickerC[0], ty: stickerC[1], tr: stickerD / 2 },
  ];
  const settled = (k: number) => B.settleA + k * B.settleStep + B.settleDur;

  for (let i = 0; i < 2; i++) {
    const segW = (W - 2 * m) / 2;
    const x = m + i * segW;
    push({ id: `checker${i}`, kind: "checker", rect: { x, y: checkerY, w: segW, h: checkerH }, r0: 0, depth: 1, appear: floodAppear(2, x + segW / 2, checkerY), enter: "pop", mass: "light", tilt: 8, index: i });
  }

  for (let i = 0; i < 3; i++) {
    push({
      id: `card${i}`,
      kind: "card",
      rect: { x: m, y: cardsY + i * (cardH + cardGap), w: cardW, h: cardH },
      r0: 0,
      depth: 0,
      appear: B.cardA + i * B.cardStep,
      enter: "card",
      mass: "heavy",
      tilt: 6,
      index: i,
      tag: i === 1 ? EVENTS[i].tag : undefined,
    });
  }

  push({ id: "slab0", kind: "slab", rect: { x: slabRect.x, y: slabRect.y, w: slabJoint - slabRect.x, h: slabRect.h }, r0: 0, depth: 1, appear: settled(0) - 0.012, enter: "bar", mass: "heavy", tilt: 1.2, index: 0 });
  push({ id: "slab1", kind: "slab", rect: { x: slabJoint, y: slabRect.y, w: slabRect.x + slabRect.w - slabJoint, h: slabRect.h }, r0: 0, depth: 1, appear: settled(0) - 0.012, enter: "bar", mass: "heavy", tilt: 1.2, index: 1 });

  for (let i = 0; i < 4; i++) {
    const c = i % 2;
    const r = Math.floor(i / 2);
    push({
      id: `chip${i}`,
      kind: "chip",
      rect: { x: m + c * (chipW + chipGap), y: chipsY + r * (chipH + chipGap), w: chipW, h: chipH },
      r0: 0,
      depth: 2,
      appear: B.chipA + i * B.chipStep,
      enter: "pop",
      mass: "light",
      tilt: 18,
      index: i,
      tag: i === 1 ? '<Chip verb="BREAK" />' : undefined,
    });
  }

  push({ id: "sun", kind: "sun", rect: { x: sunC[0] - sunD / 2, y: sunC[1] - sunD / 2, w: sunD, h: sunD }, r0: 0, depth: 0, appear: settled(1) - 0.012, enter: "pop", mass: "round", tilt: 0, tag: "div.sun" });

  let li = 0;
  lines.forEach((line, row) => {
    let x = m;
    line.forEach((syl) => {
      const w = ADV_100[syl] * fs;
      push({
        id: `l${li}`,
        kind: "letter",
        rect: { x, y: lineY[row], w, h: capH },
        r0: 0,
        depth: 2,
        text: syl,
        appear: B.letterA + li * B.letterStep * 3.2,
        enter: "letter",
        mass: "light",
        tilt: 12,
        index: li,
        tag: li === 0 ? "h1 > span" : undefined,
      });
      x += w + gap * fs;
      li++;
    });
  });

  push({ id: "burst", kind: "burst", rect: { x: burstC[0] - burstD / 2, y: burstC[1] - burstD / 2, w: burstD, h: burstD }, r0: -8, depth: 1, appear: floodAppear(1, ...burstC) + 0.004, enter: "pop", mass: "round", tilt: 0, spin: 1 });
  push({ id: "sticker", kind: "sticker", rect: { x: stickerC[0] - stickerD / 2, y: stickerC[1] - stickerD / 2, w: stickerD, h: stickerD }, r0: 10, depth: 1, appear: floodAppear(2, ...stickerC) + 0.004, enter: "pop", mass: "round", tilt: 0, spin: -1 });

  const rowY = cardsY + 3 * cardH + 2 * cardGap + 12 * u;
  push({ id: "ship", kind: "button", text: "Ship it ▲", rect: { x: m, y: rowY, w: 124 * u, h: rowH }, r0: 0, depth: 2, appear: B.extrasA + 0.012, enter: "pop", mass: "light", tilt: 14, tag: "button#ship" });
  push({ id: "hot", kind: "tag", text: "↻ HOT RELOAD", rect: { x: m + 136 * u, y: rowY + 1 * u, w: 170 * u, h: 34 * u }, r0: -3, depth: 2, appear: floodAppear(2, m + 220 * u, rowY), enter: "pop", mass: "light", tilt: 14 });

  push({ id: "logo", kind: "logo", text: "hack/josh", rect: { x: m, y: 30 * u, w: 134 * u, h: 32 * u }, r0: 0, depth: 2, appear: B.extrasA, enter: "pop", mass: "light", tilt: 12, tag: "nav > a.logo" });
  push({ id: "submit", kind: "button", text: "Submit →", rect: { x: W - m - 116 * u, y: 28 * u, w: 116 * u, h: 36 * u }, r0: 0, depth: 2, appear: B.extrasA + 0.016, enter: "pop", mass: "light", tilt: 14, index: 1 });

  const raw = {
    x: Math.round(22 * u),
    w: Math.round(W - 44 * u),
    top: 96,
    bottom: floor - 6,
    h1: Math.round(58 * u),
    body: Math.round(15.5 * u),
    li: Math.round(18.5 * u),
    boxW: Math.round(156 * u),
    boxH: Math.round(92 * u),
    btn: Math.round(15 * u),
  };

  const termH = 132 * u;
  const projScale = 0.72;
  const slideTop = Math.max(100, 104 * u);
  const whorlS = Math.round(132 * u);
  const mottoFs = Math.min((W - 2 * m) / 4.3, H * 0.085);
  const whorlY = Math.max(110, H * 0.15);

  return {
    W,
    H,
    mobile: true,
    u,
    m,
    status,
    floor,
    head: { fs, wdth, capH, lineY },
    pieces,
    clicks,
    floods,
    raw,
    sheetLines: H < 700 ? 0 : H < 790 ? 1 : 4,
    // over the verbs: the heading stays in view while the line is typed, and the fall lands below it
    editor: roundRect({ x: 14 * u, y: chipsY - 8 * u, w: W - 28 * u, h: 172 * u }),
    sheet: roundRect({ x: 12 * u, y: Math.max(100, 102 * u), w: W - 24 * u, h: 318 * u }),
    toast: { x: m, y: floor - 10 * u - 30 * u, w: (W - 2 * m - 2 * 6 * u) / 3, h: 30 * u, gap: 6 * u },
    pill: { x: W / 2, y: floor - 12 * u - 30 * u },
    terminal: roundRect({ x: 12 * u, y: floor - 14 * u - termH, w: W - 24 * u, h: termH }),
    proj: { scale: projScale, cy: slideTop + (H * projScale) / 2, tilt: -5, persp: 1100 * u, lens: [W / 2, floor - 36 * u] },
    whorl: roundRect({ x: W / 2 - whorlS / 2, y: whorlY, w: whorlS, h: whorlS }),
    motto: { lines: ["BUILD.", "BREAK.", "PITCH.", "REPEAT."], fs: mottoFs, lineH: mottoFs * 0.96, y: whorlY + whorlS + 40 * u, x: W / 2, align: "center", wdth: 100 },
    gitLine: { x: W / 2, y: whorlY + whorlS + 40 * u + mottoFs * 0.96 * 4 + 26 * u, w: W - 2 * m, align: "center" },
    card: { fTitle: Math.round(17 * u), fResult: Math.round(50 * u * clamp(cardH / (108 * u), 0.85, 1.1)), fSmall: Math.max(10, Math.round(10.5 * u)), pad: Math.round(14 * u) },
    chip: { fs: Math.round(19 * u) },
  };
}

function roundRect(r: Rect): Rect {
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) };
}

export const centerOf = (r: Rect): [number, number] => [r.x + r.w / 2, r.y + r.h / 2];
