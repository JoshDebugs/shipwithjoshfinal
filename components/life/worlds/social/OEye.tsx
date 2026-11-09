"use client";

/**
 * An "O" that is also an eye: the letter's ink ring, a paper eyeball, a cobalt
 * iris and two pink lids that meet on an ink lash line. Used in "LOOK AT ME."
 * (title card and corner tag) and in the static composition.
 *
 * The world's ticker writes the iris offset and the lids through `setOEye`,
 * so nothing re-renders per frame.
 */

import { useId, type CSSProperties } from "react";
import { RISO } from "@/components/life/multiverse/palette";

export type OEyeParts = { iris: SVGGElement | null; upper: SVGGElement | null; lower: SVGGElement | null; root: SVGSVGElement | null };

/** Ring and eyeball radii in the SVG's own units (viewBox −50 −40 100 80). */
export const OEYE = { rx: 50, ry: 40, ix: 26.5, iy: 19.5, irisR: 12.6, maxX: 11.5, maxY: 6.2 } as const;

const SEAM = -4; // where the lids meet when shut (the lash line sags ~9 below it)
const upperY = (open: number) => SEAM + (-OEYE.iy - 14 - SEAM) * open;
const lowerY = (open: number) => SEAM + (OEYE.iy + 2 - SEAM) * open;

/** gx, gy ∈ [−1, 1] (look direction), open ∈ [0, 1]. */
export function setOEye(parts: OEyeParts, gx: number, gy: number, open: number) {
  parts.iris?.setAttribute("transform", `translate(${(gx * OEYE.maxX).toFixed(2)} ${(gy * OEYE.maxY).toFixed(2)})`);
  parts.upper?.setAttribute("transform", `translate(0 ${upperY(open).toFixed(2)})`);
  parts.lower?.setAttribute("transform", `translate(0 ${lowerY(open).toFixed(2)})`);
}

export function OEye({
  className,
  style,
  register,
  gaze = [0, 0],
  open = 1,
  iris = RISO.cobalt,
  ring = RISO.ink,
}: {
  className?: string;
  style?: CSSProperties;
  register?: (parts: OEyeParts) => void;
  gaze?: [number, number];
  open?: number;
  iris?: string;
  ring?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const parts: OEyeParts = { iris: null, upper: null, lower: null, root: null };
  const done = () => {
    if (parts.iris && parts.upper && parts.lower && parts.root) register?.(parts);
  };
  return (
    <svg
      ref={(el) => {
        parts.root = el;
        done();
      }}
      aria-hidden
      viewBox="-50 -40 100 80"
      className={className}
      style={{ display: "inline-block", overflow: "visible", ...style }}
    >
      <defs>
        <clipPath id={`ball-${id}`}>
          <ellipse rx={OEYE.ix} ry={OEYE.iy} />
        </clipPath>
      </defs>
      <ellipse rx={OEYE.rx} ry={OEYE.ry} fill={ring} />
      <g clipPath={`url(#ball-${id})`}>
        <ellipse rx={OEYE.ix} ry={OEYE.iy} fill={RISO.paper} />
        <g
          ref={(el) => {
            parts.iris = el;
            done();
          }}
          transform={`translate(${gaze[0] * OEYE.maxX} ${gaze[1] * OEYE.maxY})`}
        >
          <circle r={OEYE.irisR} fill={iris} />
          <circle r={6} fill={RISO.ink} />
          <circle cx={-4.3} cy={-4.1} r={2.9} fill={RISO.paper} />
          <circle cx={3.9} cy={3.6} r={1.2} fill={RISO.paper} />
        </g>
        <g
          ref={(el) => {
            parts.lower = el;
            done();
          }}
          transform={`translate(0 ${lowerY(open)})`}
        >
          <path d="M-40 0 Q0 18 40 0 V70 H-40 Z" fill={RISO.pink} />
        </g>
        <g
          ref={(el) => {
            parts.upper = el;
            done();
          }}
          transform={`translate(0 ${upperY(open)})`}
        >
          <path d="M-40 -70 H40 V0 Q0 18 -40 0 Z" fill={RISO.pink} />
          <path d="M-31 1.5 Q0 16.5 31 1.5" fill="none" stroke={RISO.ink} strokeWidth={5.5} strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
