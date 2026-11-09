/**
 * Stage-dependent layout for The Receipts. Pure: (width, height) → numbers.
 * Everything the engine moves is placed from these values, so a resize just
 * recomputes the geometry and the next frame re-lays the paper.
 */
import { clamp } from "@/components/life/multiverse/ease";
import { ROWS } from "./rows";

export type Fonts = {
  stars: number;
  head: number;
  meta: number;
  itemno: number;
  name: number;
  desc: number;
  money: number;
  note: number;
  thanks: number;
  digits: number;
};

export type Geo = {
  W: number;
  H: number;
  mobile: boolean;
  /** Global scale (1 = the base design). */
  u: number;
  /** Receipt width / left / centre x / inner padding. */
  rw: number;
  rx: number;
  cx: number;
  pad: number;
  /** Row heights and paper offsets (top of the receipt = 0). */
  h: number[];
  top: number[];
  total: number;
  /** Slot (paper exit) y at the title card and after the opening camera pan. */
  slot0: number;
  slot1: number;
  /** Paper fed past the newest printed row. */
  lead: number;
  /** Camera. */
  persp: number;
  perspY: number;
  /** Rows above this screen y curl back; the curl reaches `curlMax` deg over `curlLen` px of paper. */
  curlY: number;
  curlLen: number;
  curlMax: number;
  /** Halftone grid pitch. */
  grid: number;
  /** Bicep sticker box (= the next portal's birth size). */
  sticker: number;
  fonts: Fonts;
};

export function computeGeo(W: number, H: number): Geo {
  const mobile = W < 768;
  const u = mobile ? clamp(Math.min(W / 372, H / 760), 0.84, 1.18) : clamp(Math.min(H / 880, W / 1250), 0.74, 1.32);
  const rw = Math.round(mobile ? Math.min(W * 0.84, 352 * u) : Math.min(440 * u, W * 0.48));
  const rx = Math.round((W - rw) / 2);
  const pad = Math.round((mobile ? 18 : 28) * u);
  const k = mobile ? 1 : 0;
  const h = ROWS.map((r) => Math.round(r.h[k] * u));
  const top: number[] = [];
  let acc = 0;
  for (const hh of h) {
    top.push(acc);
    acc += hh;
  }
  const lead = Math.round(6 * u);

  const band1 = Math.max(mobile ? 84 : 96, H * (mobile ? 0.115 : 0.125));
  const slot1 = Math.round(H - band1);
  // title card: the headline (rows h1–h3) sits on the stage's vertical centre
  const iHead = ROWS.findIndex((r) => r.id === "h1");
  const iFirst = ROWS.findIndex((r) => r.id === "s-no");
  const headMid = top[iHead] + (top[iHead + 3] - top[iHead]) / 2;
  const printed0 = top[iFirst];
  const slot0 = Math.round(clamp(H * 0.5 + (printed0 + lead - headMid), H * 0.6, slot1));

  const fonts: Fonts = mobile
    ? { stars: 16, head: 46, meta: 11.5, itemno: 11.5, name: 29, desc: 12.5, money: 21, note: 16.5, thanks: 22, digits: 10 }
    : { stars: 20, head: 62, meta: 13, itemno: 13, name: 36, desc: 15, money: 26, note: 22, thanks: 28, digits: 11 };
  for (const key of Object.keys(fonts) as (keyof Fonts)[]) fonts[key] = Math.round(fonts[key] * u * 10) / 10;

  return {
    W,
    H,
    mobile,
    u,
    rw,
    rx,
    cx: rx + rw / 2,
    pad,
    h,
    top,
    total: acc,
    slot0,
    slot1,
    lead,
    persp: Math.round((mobile ? 900 : 1250) * u),
    perspY: Math.round(H * 0.08),
    curlY: H * (mobile ? 0.44 : 0.47),
    curlLen: H * (mobile ? 0.5 : 0.52),
    curlMax: 62,
    grid: Math.round((mobile ? 21 : 26) * u),
    sticker: Math.round((mobile ? 104 : 126) * u),
    fonts,
  };
}

/** Paper length (from the receipt's top edge) covered by the first `c` rows (fractional). */
export function cumAt(g: Geo, c: number): number {
  const n = g.h.length;
  if (c <= 0) return 0;
  if (c >= n) return g.total + (c - n) * g.h[n - 1];
  const i = Math.floor(c);
  return g.top[i] + (c - i) * g.h[i];
}
