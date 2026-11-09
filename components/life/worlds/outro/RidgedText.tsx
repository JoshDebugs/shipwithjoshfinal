"use client";

/**
 * Type printed by the same finger: each line is stacked concentric contours in
 * alternating ink and colour around a solid fill, so the letters read as
 * ridges. The contours can ripple outward (scan hit, stamp) through one CSS
 * variable per ring, set by scroll, so nothing re-renders.
 */
import { forwardRef, useImperativeHandle, useRef } from "react";
import { RISO } from "@/components/life/multiverse/palette";
import { BIG } from "./layout";

export type RidgeLine = { text: string; size: number; x: number; y: number; anchor?: "start" | "middle" | "end" };

/** `r` = how far the contour reaches beyond the letter, in px. Outermost first. */
export type RidgeRing = { r: number; color: string; alpha?: number };

export type RidgedHandle = {
  /** t = seconds-like phase of the ripple; k = strength in px. */
  ripple: (t: number, k: number) => void;
};

/**
 * Contour stack around a letter. `q` = size / 150. Fine lines at display sizes;
 * fewer on a phone, so each one stays a clean printed line.
 */
export function contours(q: number, outer: string, mid: string, inner: string = RISO.paper): RidgeRing[] {
  const ink = RISO.ink;
  const fine = q >= 0.72;
  const line: [number, string][] = fine
    ? [
        [19.5, outer],
        [17.2, ink],
        [15.2, outer],
        [12.9, ink],
        [10.8, mid],
        [8.6, ink],
        [6.5, mid],
        [4.3, ink],
        [2.4, inner],
        [1.1, ink],
      ]
    : [
        [13, outer],
        [9.4, ink],
        [6.6, mid],
        [3.6, ink],
        [1.8, inner],
        [0.9, ink],
      ];
  return line.map(([r, color]) => ({ r: r * q * (fine ? 1 : 1.5), color }));
}

/** Fast attack, long settle. */
const bump = (t: number) => (t <= 0 ? 0 : (1 - Math.exp(-t * 34)) * Math.exp(-t * 4.6));

export const RidgedText = forwardRef<
  RidgedHandle,
  { lines: RidgeLine[]; rings: RidgeRing[]; fill: string; width: number; height: number; className?: string }
>(function RidgedText({ lines, rings, fill, width, height, className }, ref) {
  const svg = useRef<SVGSVGElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      ripple(t, k) {
        const el = svg.current;
        if (!el) return;
        for (let i = 0; i < rings.length; i++) {
          // the wave starts at the letter and travels outward (last ring = innermost)
          const d = (rings.length - 1 - i) * 0.07;
          el.style.setProperty(`--rp${i}`, (bump(t - d) * k * (1 + (rings.length - 1 - i) * 0.25)).toFixed(2));
        }
      },
    }),
    [rings.length],
  );

  const text = (l: RidgeLine, i: number) => (
    <text key={i} x={l.x} y={l.y} fontSize={l.size} textAnchor={l.anchor ?? "middle"}>
      {l.text}
    </text>
  );

  return (
    <svg ref={svg} width={width} height={height} className={className} style={{ display: "block", overflow: "visible" }} aria-hidden>
      <g style={{ ...BIG, strokeLinejoin: "round", strokeLinecap: "round", fill: "none" }}>
        {rings.map((r, i) => (
          <g
            key={i}
            stroke={r.color}
            strokeOpacity={r.alpha ?? 1}
            style={{ strokeWidth: `calc(${(r.r * 2).toFixed(2)}px + var(--rp${i}, 0) * 2px)` }}
          >
            {lines.map(text)}
          </g>
        ))}
        <g style={{ fill }}>{lines.map(text)}</g>
      </g>
    </svg>
  );
});
