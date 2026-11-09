"use client";

/**
 * A code-built 16-segment competition timer (no font): sun panel, ink
 * segments, ghosted unlit segments. It can spell words as well as digits.
 * Driven by a MotionValue<string> — segments are toggled in place, never
 * re-rendered by React.
 */

import { useMemo, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "framer-motion";
import { RISO, alpha, mix } from "@/components/life/multiverse/palette";
import { useIsoLayoutEffect } from "@/components/life/multiverse/runtime";

const SEGS = ["a1", "a2", "b", "c", "d1", "d2", "e", "f", "g1", "g2", "h", "i", "j", "k", "l", "m", "dp"] as const;
type Seg = (typeof SEGS)[number];

const MAP: Record<string, Seg[]> = {
  "0": ["a1", "a2", "b", "c", "d1", "d2", "e", "f", "j", "k"],
  "1": ["b", "c", "j"],
  "2": ["a1", "a2", "b", "g1", "g2", "e", "d1", "d2"],
  "3": ["a1", "a2", "b", "c", "d1", "d2", "g2", "g1"],
  "4": ["f", "g1", "g2", "b", "c"],
  "5": ["a1", "a2", "f", "g1", "g2", "c", "d1", "d2"],
  "6": ["a1", "a2", "f", "e", "d1", "d2", "c", "g1", "g2"],
  "7": ["a1", "a2", "b", "c"],
  "8": ["a1", "a2", "b", "c", "d1", "d2", "e", "f", "g1", "g2"],
  "9": ["a1", "a2", "b", "c", "d1", "d2", "f", "g1", "g2"],
  A: ["a1", "a2", "b", "c", "e", "f", "g1", "g2"],
  B: ["a1", "a2", "b", "c", "d1", "d2", "i", "l", "g2"],
  C: ["a1", "a2", "f", "e", "d1", "d2"],
  D: ["a1", "a2", "b", "c", "d1", "d2", "i", "l"],
  E: ["a1", "a2", "f", "e", "d1", "d2", "g1", "g2"],
  F: ["a1", "a2", "f", "e", "g1"],
  G: ["a1", "a2", "f", "e", "d1", "d2", "c", "g2"],
  H: ["f", "e", "b", "c", "g1", "g2"],
  I: ["a1", "a2", "i", "l", "d1", "d2"],
  J: ["b", "c", "d1", "d2", "e"],
  K: ["f", "e", "g1", "j", "m"],
  L: ["f", "e", "d1", "d2"],
  M: ["f", "e", "b", "c", "h", "j"],
  N: ["f", "e", "b", "c", "h", "m"],
  O: ["a1", "a2", "b", "c", "d1", "d2", "e", "f"],
  P: ["a1", "a2", "b", "f", "e", "g1", "g2"],
  Q: ["a1", "a2", "b", "c", "d1", "d2", "e", "f", "m"],
  R: ["a1", "a2", "b", "f", "e", "g1", "g2", "m"],
  S: ["a1", "a2", "f", "g1", "g2", "c", "d1", "d2"],
  T: ["a1", "a2", "i", "l"],
  U: ["f", "e", "d1", "d2", "c", "b"],
  V: ["f", "e", "k", "j"],
  W: ["f", "e", "b", "c", "k", "m"],
  X: ["h", "j", "k", "m"],
  Y: ["h", "j", "l"],
  Z: ["a1", "a2", "j", "k", "d1", "d2"],
  "-": ["g1", "g2"],
  "+": ["g1", "g2", "i", "l"],
  "'": ["i"],
  "?": ["a1", "a2", "b", "g2", "l"],
  ".": ["dp"],
};

const T = 1.5; // segment thickness
const G = 0.32; // gap
const hSeg = (x0: number, x1: number, y: number) => {
  const h = T / 2;
  return `M${x0},${y} L${x0 + h},${y - h} L${x1 - h},${y - h} L${x1},${y} L${x1 - h},${y + h} L${x0 + h},${y + h} Z`;
};
const vSeg = (x: number, y0: number, y1: number) => {
  const h = T / 2;
  return `M${x},${y0} L${x + h},${y0 + h} L${x + h},${y1 - h} L${x},${y1} L${x - h},${y1 - h} L${x - h},${y0 + h} Z`;
};
const dSeg = (x0: number, y0: number, x1: number, y1: number) => {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = (-(y1 - y0) / len) * (T * 0.42);
  const ny = ((x1 - x0) / len) * (T * 0.42);
  return `M${x0 + nx},${y0 + ny} L${x1 + nx},${y1 + ny} L${x1 - nx},${y1 - ny} L${x0 - nx},${y0 - ny} Z`;
};

const L = 1;
const R = 9;
const TOP = 1;
const MID = 8;
const BOT = 15;
const CX = 5;

const SEG_PATH: Record<Exclude<Seg, "dp">, string> = {
  a1: hSeg(L + G, CX - G, TOP),
  a2: hSeg(CX + G, R - G, TOP),
  b: vSeg(R, TOP + G, MID - G),
  c: vSeg(R, MID + G, BOT - G),
  d1: hSeg(L + G, CX - G, BOT),
  d2: hSeg(CX + G, R - G, BOT),
  e: vSeg(L, MID + G, BOT - G),
  f: vSeg(L, TOP + G, MID - G),
  g1: hSeg(L + G, CX - G, MID),
  g2: hSeg(CX + G, R - G, MID),
  h: dSeg(L + 1.35, TOP + 1.45, CX - 0.85, MID - 1.25),
  i: vSeg(CX, TOP + G, MID - G),
  j: dSeg(R - 1.35, TOP + 1.45, CX + 0.85, MID - 1.25),
  k: dSeg(L + 1.35, BOT - 1.45, CX - 0.85, MID + 1.25),
  l: vSeg(CX, MID + G, BOT - G),
  m: dSeg(R - 1.35, BOT - 1.45, CX + 0.85, MID + 1.25),
};

const ADV = 11.6;

export function Lcd({ text, cells = 12, height = 24, label }: { text: MotionValue<string>; cells?: number; height?: number; label?: MotionValue<string> }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const lit = RISO.ink;
  const ghost = alpha(RISO.ink, 0.075);

  const cache = useRef<{ els: SVGElement[][]; shown: string[] } | null>(null);

  const paint = useMemo(
    () => (s: string) => {
      const svg = svgRef.current;
      if (!svg) return;
      if (!cache.current) {
        const els: SVGElement[][] = Array.from({ length: cells }, () => []);
        svg.querySelectorAll<SVGElement>("[data-c]").forEach((el) => {
          els[Number(el.dataset.c)][SEGS.indexOf(el.dataset.s as Seg)] = el;
        });
        cache.current = { els, shown: Array(cells).fill("") };
      }
      const { els, shown } = cache.current;
      const chars = s.toUpperCase().padEnd(cells, " ").slice(0, cells);
      for (let c = 0; c < cells; c++) {
        if (shown[c] === chars[c]) continue;
        shown[c] = chars[c];
        const on = MAP[chars[c]] ?? [];
        SEGS.forEach((seg, k) => els[c][k]?.setAttribute("fill", on.includes(seg) ? lit : ghost));
      }
    },
    [cells, lit, ghost],
  );

  useIsoLayoutEffect(() => {
    paint(text.get());
    if (label && labelRef.current) labelRef.current.textContent = label.get();
  }, [paint, text, label]);
  useMotionValueEvent(text, "change", paint);
  useMotionValueEvent(label ?? text, "change", (v) => {
    if (label && labelRef.current) labelRef.current.textContent = v;
  });

  const vbW = cells * ADV + 1.5;
  return (
    <div
      className="inline-flex flex-col gap-[3px] rounded-[7px] px-[9px] pb-[7px] pt-[5px]"
      style={{
        background: RISO.sun,
        boxShadow: `inset 0 0 0 1.5px ${RISO.ink}, 3px 3px 0 ${RISO.ink}`,
        backgroundImage: `linear-gradient(180deg, ${alpha(RISO.paper, 0.28)}, transparent 55%)`,
      }}
    >
      <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase leading-none tracking-[0.16em]" style={{ color: mix(RISO.ink, RISO.sun, 0.25) }}>
        <span ref={labelRef} />
        <span className="flex items-center gap-1">
          <span className="inline-block h-[5px] w-[5px] rounded-full" style={{ background: RISO.ink }} />
          03
        </span>
      </div>
      <svg ref={svgRef} viewBox={`-0.5 0 ${vbW} 16.5`} height={height} width={(height * vbW) / 16.5} aria-hidden>
        {Array.from({ length: cells }, (_, c) => (
          <g key={c} transform={`translate(${c * ADV + 0.6} 0) skewX(-7)`}>
            {(Object.keys(SEG_PATH) as (keyof typeof SEG_PATH)[]).map((s) => (
              <path key={s} d={SEG_PATH[s]} data-c={c} data-s={s} fill={ghost} />
            ))}
            <circle cx={10.4} cy={BOT} r={0.85} data-c={c} data-s="dp" fill={ghost} />
          </g>
        ))}
      </svg>
    </div>
  );
}
