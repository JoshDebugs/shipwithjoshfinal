/**
 * THE CLIP. "MIC" / "ON." set in Anybody at wdth 150 / wght 900, sized 1.35×
 * taller than their headroom bands, so two hairline rails flagged CLIP slice
 * every letter flat top and bottom — the type looks exactly like a clipped
 * waveform. Between the rows runs the oscilloscope channel, squared off
 * against the same rails, with the mic standing in it.
 *
 * Three colour plates sit under each word, off register (they jolt at the
 * clip and settle). Pure SVG: real text, crisp at any size.
 */
import type { RefObject } from "react";
import { RISO } from "@/components/life/multiverse/palette";
import { COPY } from "./copy";
import { CAP, type Layout } from "./layout";

export const PLATES = [RISO.cobalt, RISO.teal, RISO.sun] as const;

export type BandRefs = {
  root: RefObject<SVGSVGElement | null>;
  clips: RefObject<(SVGRectElement | null)[]>;
  rows: RefObject<(SVGGElement | null)[]>;
  /** [row][plate] — 3 plates then the ink text (index 3). */
  texts: RefObject<(SVGTextElement | null)[][]>;
  rails: RefObject<(SVGGElement | null)[]>;
};

const FONT = "var(--f-anybody), var(--font-geist-sans), sans-serif";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

export function bandBaseline(top: number, rowH: number, font: number) {
  return top + rowH / 2 + (CAP * font) / 2;
}

function Flag({ x, y, side }: { x: number; y: number; side: "l" | "r" }) {
  const w = 44;
  const h = 16;
  const left = side === "l" ? x : x - w;
  return (
    <g>
      <rect x={left} y={y - h / 2} width={w} height={h} rx={2} fill={RISO.ink} />
      <text x={left + w / 2} y={y + 3.6} textAnchor="middle" fontSize={10} fill={RISO.paper} style={{ fontFamily: MONO, letterSpacing: "0.14em", fontWeight: 600 }}>
        CLIP
      </text>
    </g>
  );
}

export function ClipBand({ L, refs, idBase }: { L: Layout; refs: BandRefs; idBase: string }) {
  const { W } = L;
  const { rails, rowH, font } = L.band;
  const rowsTop = [rails[0], rails[2]];
  const flagInset = L.mobile ? 10 : 22;
  return (
    <svg
      ref={refs.root}
      aria-label={COPY.headline}
      role="img"
      className="pointer-events-none absolute inset-0"
      width={L.W}
      height={L.H}
      viewBox={`0 0 ${L.W} ${L.H}`}
      style={{ opacity: 0, visibility: "hidden" }}
    >
      <defs>
        {rowsTop.map((top, r) => (
          <clipPath id={`${idBase}-row${r}`} key={r}>
            <rect
              ref={(el) => {
                refs.clips.current[r] = el;
              }}
              x={-20}
              y={top}
              width={W + 40}
              height={rowH}
            />
          </clipPath>
        ))}
      </defs>
      {COPY.headlineRows.map((word, r) => {
        const baseline = bandBaseline(rowsTop[r], rowH, font);
        return (
          <g key={word} clipPath={`url(#${idBase}-row${r})`}>
            <g
              ref={(el) => {
                refs.rows.current[r] = el;
              }}
            >
              {[...PLATES, RISO.ink].map((ink, k) => (
                <text
                  key={k}
                  ref={(el) => {
                    if (!refs.texts.current[r]) refs.texts.current[r] = [];
                    refs.texts.current[r][k] = el;
                  }}
                  x={W / 2}
                  y={baseline}
                  textAnchor="middle"
                  fontSize={font}
                  fill={ink}
                  aria-hidden={k < 3 ? true : undefined}
                  style={{
                    fontFamily: FONT,
                    fontVariationSettings: '"wdth" 150, "wght" 900',
                    mixBlendMode: k < 3 ? "multiply" : undefined,
                  }}
                >
                  {word}
                </text>
              ))}
            </g>
          </g>
        );
      })}
      {rails.map((y, i) => (
        <g
          key={i}
          ref={(el) => {
            refs.rails.current[i] = el;
          }}
        >
          <line x1={0} x2={W} y1={y} y2={y} stroke={RISO.ink} strokeWidth={i === 0 || i === 3 ? 1.6 : 1.1} />
          {i === 0 && <Flag x={flagInset} y={y} side="l" />}
          {i === 0 && !L.mobile && <Flag x={W - flagInset} y={y} side="r" />}
          {i === 3 && <Flag x={flagInset} y={y} side="l" />}
        </g>
      ))}
    </svg>
  );
}
