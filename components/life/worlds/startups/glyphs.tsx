/**
 * Small drawn glyphs for The Receipts: a dot-matrix ₹ that matches Doto's
 * 5×7 grid (the loaded font subset has no rupee), the barcode, the bow, the
 * price gun and the bicep sticker the last shot leaves on the slot.
 */
import type { CSSProperties } from "react";
import { hash } from "@/components/life/multiverse/ease";
import { PORTAL_ICONS } from "@/components/life/multiverse/portalIcons";
import { C } from "./colors";

/* ------------------------------------------------------------------ rupee */

// 5 × 7, Doto's grid (dot pitch 0.1em, cap rows at 0.2em … 0.8em).
const RUPEE = ["11111", "00010", "11111", "00010", "11100", "00110", "00011"];
const RUPEE_DOTS = RUPEE.flatMap((row, r) => [...row].map((b, c) => (b === "1" ? [c, r] : null)).filter(Boolean) as number[][]);

/** Dot-matrix ₹ sized like a Doto glyph (0.6em advance). Decorative: pair it with real text. */
export function DotRupee({ style }: { style?: CSSProperties }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 6 10"
      width="0.6em"
      height="1em"
      style={{ display: "inline-block", verticalAlign: "-0.16em", overflow: "visible", ...style }}
      fill="currentColor"
    >
      {RUPEE_DOTS.map(([c, r]) => (
        <circle key={`${c}-${r}`} cx={c + 0.5} cy={r + 2} r={0.43} />
      ))}
    </svg>
  );
}

/** "₹70K": real text for readers, dot-matrix rupee for eyes. */
export function Money({ amount, style }: { amount: string; style?: CSSProperties }) {
  return (
    <span style={{ whiteSpace: "nowrap", ...style }}>
      <span className="sr-only">₹</span>
      <DotRupee />
      {amount}
    </span>
  );
}

/** Inline SVG markup of the dot rupee (for imperatively built stickers). */
export function rupeeMarkup(): string {
  const dots = RUPEE_DOTS.map(([c, r]) => `<circle cx="${c + 0.5}" cy="${r + 2}" r="0.43"/>`).join("");
  return `<svg aria-hidden="true" viewBox="0 0 6 10" width="0.6em" height="1em" fill="currentColor" style="display:inline-block;vertical-align:-0.16em;overflow:visible">${dots}</svg>`;
}

/* ----------------------------------------------------------- punctuation */

// Doto draws "." and ":" as crosses that read like "+"; print plain dot blocks instead.
const PUNCT: Record<string, number[][]> = {
  ".": [
    [1, 5],
    [2, 5],
    [1, 6],
    [2, 6],
  ],
  ":": [
    [1, 1],
    [2, 1],
    [1, 2],
    [2, 2],
    [1, 5],
    [2, 5],
    [1, 6],
    [2, 6],
  ],
};

function DotPunct({ ch }: { ch: string }) {
  return (
    <>
      <span className="sr-only">{ch}</span>
      <svg aria-hidden viewBox="0 0 6 10" width="0.6em" height="1em" style={{ display: "inline-block", verticalAlign: "-0.16em", overflow: "visible" }} fill="currentColor">
        {PUNCT[ch].map(([c, r]) => (
          <circle key={`${c}-${r}`} cx={c + 0.5} cy={r + 2} r={0.43} />
        ))}
      </svg>
    </>
  );
}

/** Doto text with dot-matrix punctuation (and real characters for readers). */
export function DotText({ text }: { text: string }) {
  const parts = text.split(/([.:])/);
  return (
    <>
      {parts.map((part, i) => (part === "." || part === ":" ? <DotPunct key={i} ch={part} /> : part ? <span key={i}>{part}</span> : null))}
    </>
  );
}

/* ---------------------------------------------------------------- barcode */

export const BARS: { x: number; w: number }[] = (() => {
  const out: { x: number; w: number }[] = [];
  let x = 0;
  // guard, 38 data bars, guard — widths from a fixed hash so it never changes
  const push = (w: number, gap: number) => {
    out.push({ x, w });
    x += w + gap;
  };
  push(1, 1);
  push(1, 1.5);
  for (let i = 0; i < 38; i++) push(1 + Math.floor(hash(i + 17) * 3.2), 1 + Math.floor(hash(i + 91) * 2.2));
  push(1, 1);
  push(1, 0);
  return out.map((b) => ({ x: b.x / x, w: b.w / x }));
})();

export function Barcode({ color = C.ink }: { color?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 1000 100" preserveAspectRatio="none" width="100%" height="100%" shapeRendering="crispEdges">
      {BARS.map((b, i) => (
        <rect key={i} x={b.x * 1000} y={0} width={Math.max(2, b.w * 1000)} height={100} fill={color} />
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------- bow */

export function Bow({ size }: { size: number }) {
  return (
    <svg aria-hidden viewBox="0 0 120 80" width={size} height={(size * 80) / 120} style={{ overflow: "visible" }}>
      {/* tails */}
      <path d="M56 40 L36 78 L46 74 L50 80 L62 44 Z" fill={C.ribbonFold} />
      <path d="M64 40 L84 78 L74 74 L70 80 L58 44 Z" fill={C.pink} />
      {/* loops */}
      <path d="M58 38 C 40 6, 6 4, 8 30 C 10 52, 40 50, 58 42 Z" fill={C.pink} />
      <path d="M62 38 C 80 6, 114 4, 112 30 C 110 52, 80 50, 62 42 Z" fill={C.pink} />
      <path d="M56 39 C 42 22, 22 16, 18 28 C 30 22, 44 28, 56 41 Z" fill={C.ribbonFold} opacity={0.55} />
      <path d="M64 39 C 78 22, 98 16, 102 28 C 90 22, 76 28, 64 41 Z" fill={C.ribbonFold} opacity={0.55} />
      <path d="M20 22 C 26 14, 40 14, 48 24" stroke={C.ribbonSheen} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M100 22 C 94 14, 80 14, 72 24" stroke={C.ribbonSheen} strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* knot */}
      <rect x={51} y={30} width={18} height={20} rx={6} fill={C.ribbonFold} />
      <rect x={54} y={32} width={8} height={6} rx={3} fill={C.ribbonSheen} opacity={0.7} />
    </svg>
  );
}

/* -------------------------------------------------------------- price gun */

/** Price-tag gun, nozzle at the left. Hotspot (the sticker exit) at (3, 31) in a 64×58 box. */
export const GUN_HOTSPOT = [3, 31] as const;

export function PriceGunSvg({ size = 64 }: { size?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 64 58" width={size} height={(size * 58) / 64} style={{ overflow: "visible" }}>
      {/* handle */}
      <path d="M34 26 L50 26 L58 54 Q58 57 55 57 L46 57 Q43 57 42 54 Z" fill={C.ink} stroke={C.paper} strokeWidth={2} strokeLinejoin="round" />
      {/* trigger */}
      <path d="M26 30 Q24 44 33 47 L35 43 Q30 41 31 31 Z" fill={C.sun} stroke={C.ink} strokeWidth={1.2} />
      {/* body */}
      <path d="M8 12 Q8 6 14 6 L48 6 Q54 6 54 12 L54 30 L12 34 Q8 34 8 30 Z" fill={C.ink} stroke={C.paper} strokeWidth={2} strokeLinejoin="round" />
      {/* label roll */}
      <circle cx={40} cy={7} r={9} fill={C.sun} stroke={C.ink} strokeWidth={1.5} />
      <circle cx={40} cy={7} r={3} fill={C.ink} />
      {/* readout */}
      <rect x={15} y={13} width={22} height={9} rx={1.5} fill={C.sun} />
      <rect x={18} y={16} width={2} height={3} fill={C.ink} />
      <rect x={22} y={16} width={2} height={3} fill={C.ink} />
      <rect x={26} y={16} width={2} height={3} fill={C.ink} />
      {/* nozzle + a sticker peeking out */}
      <path d="M2 26 L12 26 L12 34 L2 34 Z" fill={C.ink} stroke={C.paper} strokeWidth={2} strokeLinejoin="round" />
      <rect x={-3} y={28} width={8} height={6} rx={1} fill={C.sun} />
    </svg>
  );
}

/* ---------------------------------------------------------- bicep sticker */

const BICEP_D = (PORTAL_ICONS.bicep.svg.match(/d="([^"]+)"/) ?? [])[1] ?? "";

/**
 * The last sticker: a die-cut sun bicep in the exact 100×100 icon box the
 * next portal uses, so the portal mask takes it over seamlessly.
 */
export function BicepSticker({ size }: { size: number }) {
  return (
    <svg aria-hidden viewBox="0 0 100 100" width={size} height={size} style={{ overflow: "visible", display: "block" }}>
      <path d={BICEP_D} transform="translate(2.5 3.5)" fill={C.ink} opacity={0.45} />
      <path d={BICEP_D} fill={C.paper} stroke={C.paper} strokeWidth={7} strokeLinejoin="round" />
      <path d={BICEP_D} fill={C.sun} />
      <path d={BICEP_D} fill="none" stroke={C.stickerEdge} strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M22 54 C 26 47, 34 45, 41 47" stroke={C.paper} strokeOpacity={0.6} strokeWidth={3} fill="none" strokeLinecap="round" />
    </svg>
  );
}
