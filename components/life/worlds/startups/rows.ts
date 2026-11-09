/**
 * The receipt itself: every printed row, top (header) to bottom (barcode).
 *
 * Heights are base pixels for [desktop, phone] at scale u = 1. The engine
 * multiplies them by the stage scale. Rows are the paper's physical segments:
 * each one hinges on the row below it, so the paper can curl and billow.
 */

export type RowKind =
  | "gap"
  | "stars"
  | "head"
  | "meta"
  | "rule2"
  | "rule1"
  | "itemno"
  | "name"
  | "desc"
  | "amount"
  | "note"
  | "total"
  | "thanks"
  | "barcode"
  | "digits";

export type Row = {
  id: string;
  kind: RowKind;
  h: readonly [number, number];
  text?: string;
  right?: string;
  /** Amount after the ₹ sign (drawn as a dot-matrix glyph), e.g. "70K". */
  money?: string;
};

export const ROWS: readonly Row[] = [
  { id: "top", kind: "gap", h: [18, 14] },
  { id: "stars", kind: "stars", h: [30, 24], text: "*** THE RECEIPTS ***" },
  { id: "g1", kind: "gap", h: [8, 6] },
  { id: "h1", kind: "head", h: [60, 46], text: "THEN I" },
  { id: "h2", kind: "head", h: [60, 46], text: "STARTED" },
  { id: "h3", kind: "head", h: [60, 46], text: "BUILDING." },
  { id: "g2", kind: "gap", h: [20, 14] },
  { id: "m1", kind: "meta", h: [24, 20], text: "AGE 17 · 2025–2026" },
  { id: "m2", kind: "meta", h: [24, 20], text: "3 STARTUPS" },
  { id: "g3", kind: "gap", h: [14, 10] },
  // ---------------------------------------------------------------- StarScale
  { id: "r1", kind: "rule2", h: [16, 14] },
  { id: "s-no", kind: "itemno", h: [26, 22], text: "ITEM #001", right: "2025" },
  { id: "s-name", kind: "name", h: [44, 36], text: "STARSCALE" },
  { id: "s-desc", kind: "desc", h: [24, 21], text: "HIGH-END ANIMATED WEBSITES" },
  { id: "s-amt", kind: "amount", h: [32, 28], text: "3 CLIENTS", money: "70K" },
  { id: "s-stamp", kind: "gap", h: [72, 60] },
  // ------------------------------------------------------------ Frags n Flavs
  { id: "r2", kind: "rule1", h: [16, 14] },
  { id: "f-no", kind: "itemno", h: [26, 22], text: "ITEM #002", right: "JAN–MAR 2026" },
  { id: "f-name", kind: "name", h: [44, 36], text: "FRAGS N FLAVS" },
  { id: "f-desc", kind: "desc", h: [24, 21], text: "PREMIUM INSTANT GIFTING" },
  { id: "f-ribbon", kind: "gap", h: [48, 42] },
  { id: "f-amt", kind: "amount", h: [32, 28], text: "3 MONTHS", money: "42K" },
  { id: "f-note", kind: "note", h: [30, 26], text: "KIDDING:", money: "42K", right: "IN 3 MONTHS." },
  { id: "f-stamp", kind: "gap", h: [78, 66] },
  // ----------------------------------------------------------------- LazyBull
  { id: "r3", kind: "rule1", h: [16, 14] },
  { id: "l-no", kind: "itemno", h: [26, 22], text: "ITEM #003", right: "2026" },
  { id: "l-name", kind: "name", h: [44, 36], text: "LAZYBULL" },
  { id: "l-desc", kind: "desc", h: [24, 21], text: "AI-SIMPLIFIED TRADING" },
  { id: "l-amt", kind: "amount", h: [32, 28], text: "BUILD TIME", right: "2 DAYS" },
  { id: "l-tag", kind: "gap", h: [40, 96] },
  // ------------------------------------------------------------------- footer
  { id: "r4", kind: "rule2", h: [16, 14] },
  { id: "items", kind: "total", h: [28, 24], text: "ITEMS", right: "3" },
  { id: "cashier", kind: "meta", h: [22, 19], text: "CASHIER: JOSH, 17" },
  { id: "g4", kind: "gap", h: [12, 10] },
  { id: "ty1", kind: "thanks", h: [34, 28], text: "THANK YOU." },
  { id: "ty2", kind: "thanks", h: [34, 28], text: "VISIT AGAIN." },
  { id: "g5", kind: "gap", h: [14, 12] },
  { id: "barcode", kind: "barcode", h: [60, 50] },
  { id: "digits", kind: "digits", h: [20, 18], text: "0017 2025 2026 0003" },
  { id: "bottom", kind: "gap", h: [26, 22] },
];

/** Row index by id. */
export const IDX: Record<string, number> = Object.fromEntries(ROWS.map((r, i) => [r.id, i]));

/** Row kinds whose ink is printed (gaps have nothing to sweep). */
export const PRINTS = (k: RowKind) => k !== "gap";

/** Row kinds set in Doto (their dots round off as they burn in). */
export const DOTO = (k: RowKind) => k === "stars" || k === "head" || k === "name" || k === "note" || k === "thanks";
