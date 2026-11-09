/**
 * Words that ride the waveform: each row is a <textPath> on an offset copy of
 * the wave's fundamental, rewritten every frame. A circular clip centred on
 * the mic reveals them, so the voice literally comes out of the mic.
 */
import type { RefObject } from "react";
import { RISO } from "@/components/life/multiverse/palette";

export type WaveTextRefs = {
  root: RefObject<SVGSVGElement | null>;
  paths: RefObject<(SVGPathElement | null)[]>;
  text: RefObject<SVGGElement | null>;
  reveal: RefObject<SVGCircleElement | null>;
};

const FONT = "var(--f-anybody), var(--font-geist-sans), sans-serif";

export function WaveText({
  refs,
  rows,
  idBase,
  W,
  H,
  fontSize,
  axes,
  label,
  shadow,
}: {
  refs: WaveTextRefs;
  rows: readonly string[];
  idBase: string;
  W: number;
  H: number;
  fontSize: number;
  axes: string;
  label: string;
  shadow?: string;
}) {
  return (
    <svg
      ref={refs.root}
      role="img"
      aria-label={label}
      className="pointer-events-none absolute inset-0"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ opacity: 0, visibility: "hidden", overflow: "visible" }}
    >
      <defs>
        {rows.map((_, i) => (
          <path
            key={i}
            id={`${idBase}-p${i}`}
            ref={(el) => {
              refs.paths.current[i] = el;
            }}
            d={`M0 ${H / 2} L${W} ${H / 2}`}
          />
        ))}
        <clipPath id={`${idBase}-reveal`}>
          <circle ref={refs.reveal} cx={W / 2} cy={H / 2} r={0} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${idBase}-reveal)`}>
        <g ref={refs.text} aria-hidden style={{ fontFamily: FONT, fontSize, fontVariationSettings: axes }}>
          {shadow &&
            rows.map((row, i) => (
              <text key={`s${i}`} fill={shadow} textAnchor="middle" transform="translate(2.2 1.6)" style={{ mixBlendMode: "multiply" }}>
                <textPath href={`#${idBase}-p${i}`} startOffset="50%">
                  {row}
                </textPath>
              </text>
            ))}
          {rows.map((row, i) => (
            <text key={i} fill={RISO.ink} textAnchor="middle">
              <textPath href={`#${idBase}-p${i}`} startOffset="50%">
                {row}
              </textPath>
            </text>
          ))}
        </g>
      </g>
    </svg>
  );
}
