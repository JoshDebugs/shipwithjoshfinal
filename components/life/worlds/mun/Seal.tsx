import type { CSSProperties } from "react";
import { RISO } from "@/components/life/multiverse/palette";
import { COPY } from "./copy";
import { archivo, fraunces, rubber } from "./ink";

/**
 * The award seal: a pink rubber stamp. Printed with multiply, so where it
 * lands on Josh's sun card the two inks overprint to riso red.
 */
export function Seal({ size, id, style, className }: { size: number; id: string; style?: CSSProperties; className?: string }) {
  const r = 113;
  const ring = `M150,150 m-${r},0 a${r},${r} 0 1,1 ${r * 2},0 a${r},${r} 0 1,1 -${r * 2},0`;
  return (
    <svg
      viewBox="0 0 300 300"
      width={size}
      height={size}
      className={className}
      style={{ ...rubber(3), ...style }}
      role="img"
      aria-label="2nd Best Delegate · Model United Nations"
    >
      <defs>
        <path id={id} d={ring} />
      </defs>
      <g fill="none" stroke={RISO.pink}>
        <circle cx="150" cy="150" r="143" strokeWidth="8" />
        <circle cx="150" cy="150" r="132" strokeWidth="2.2" />
        <circle cx="150" cy="150" r="93" strokeWidth="3" />
      </g>
      <g transform="rotate(-96 150 150)">
        <text fill={RISO.pink} style={{ ...archivo(100, 820), fontSize: 21.5, letterSpacing: 1.2 }}>
          <textPath href={`#${id}`} startOffset="0" textLength={Math.PI * 2 * r * 0.992} lengthAdjust="spacing">
            {COPY.seal}
          </textPath>
        </text>
      </g>
      <text x="150" y="177" textAnchor="middle" fill={RISO.pink} style={{ ...fraunces(900, 1, 0, 144), fontSize: 86, letterSpacing: -3 }}>
        {COPY.sealCentre}
      </text>
      <rect x="104" y="192" width="92" height="5" fill={RISO.pink} />
      <rect x="122" y="203" width="56" height="3" fill={RISO.pink} />
    </svg>
  );
}

/**
 * MULTIPLE CONFERENCES, stamped again and again under Josh's card (positions
 * in card widths / heights). The earlier strikes are a fading pile that
 * zig-zags down off the card (the first overprints the sun card red); the last
 * strike lands clear of the pile, square and fully inked, so it always reads.
 * No count is implied: the pile is texture, not a tally.
 */
export const BURST = [
  { x: 0.34, y: 0.9, r: -9, o: 0.8, multiply: true },
  { x: 0.63, y: 1.0, r: 6, o: 0.62, multiply: false },
  { x: 0.41, y: 1.11, r: -5, o: 0.48, multiply: false },
  { x: 0.58, y: 1.22, r: 8, o: 0.36, multiply: false },
  { x: 0.5, y: 1.56, r: -2, o: 1, multiply: false },
] as const;

/** The uncountable stamp: fired again and again into a pile, so no number is ever implied. */
export function ConferenceStamp({ fs, shift, style, className }: { fs: number; shift: number; style?: CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      style={{
        ...archivo(74, 860),
        fontSize: fs,
        lineHeight: 1,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        color: RISO.pink,
        border: `${Math.max(3, fs * 0.2)}px double ${RISO.pink}`,
        padding: `${fs * 0.24}px ${fs * 0.36}px ${fs * 0.2}px`,
        ...rubber(shift),
        ...style,
      }}
    >
      {COPY.conferences}
    </div>
  );
}
