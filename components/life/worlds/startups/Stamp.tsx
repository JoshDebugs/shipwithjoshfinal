import type { ReactNode } from "react";
import { C } from "./colors";

/**
 * Rubber stamp: Rubik Mono One in a double border, roughed up by an SVG
 * displacement + two noise masks (blotches and speckle). Every stamp gets its
 * own seed, so no two impressions look alike.
 */

const RUBIK_EM = 0.853; // Rubik Mono One advance per char, in em
const CAP = 0.72;

export function Stamp({
  id,
  lines,
  color,
  width,
  seed,
  label,
}: {
  id: string;
  lines: string[];
  color: string;
  width: number;
  seed: number;
  /** Accessible text (defaults to the lines). */
  label?: string;
}) {
  const vbW = 300;
  const inner = vbW - 60;
  const longest = Math.max(...lines.map((l) => l.length));
  const fs = Math.min(lines.length === 1 ? 42 : 36, inner / (longest * RUBIK_EM));
  const capH = fs * CAP;
  const gap = fs * 0.36;
  const blockH = lines.length * capH + (lines.length - 1) * gap;
  const vbH = Math.round(blockH + 64);
  const y0 = (vbH - blockH) / 2;
  const fid = `stamp-${id}`;

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      width={width}
      height={(width * vbH) / vbW}
      role="img"
      aria-label={label ?? lines.join(" ")}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <filter id={fid} filterUnits="userSpaceOnUse" x={-12} y={-12} width={vbW + 24} height={vbH + 24} colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={seed} result="edge" />
          <feDisplacementMap in="SourceGraphic" in2="edge" scale={3.4} xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={3} seed={seed + 11} result="blot" />
          <feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -7 0 0 0 5.05" result="blotMask" />
          <feComposite in="rough" in2="blotMask" operator="in" result="blotted" />
          <feTurbulence type="fractalNoise" baseFrequency="1.35" numOctaves={1} seed={seed + 29} result="speck" />
          <feColorMatrix in="speck" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -9 0 0 0 6.1" result="speckMask" />
          <feComposite in="blotted" in2="speckMask" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${fid})`} fill={color} stroke={color}>
        <rect x={5} y={5} width={vbW - 10} height={vbH - 10} rx={16} fill="none" strokeWidth={8} />
        <rect x={17} y={17} width={vbW - 34} height={vbH - 34} rx={8} fill="none" strokeWidth={2.6} />
        {lines.map((l, i) => (
          <text
            key={i}
            x={vbW / 2}
            y={y0 + capH * (i + 1) + gap * i}
            textAnchor="middle"
            stroke="none"
            style={{ fontFamily: "var(--f-rubik-mono)", fontSize: fs, letterSpacing: "0.02em" }}
          >
            {l}
          </text>
        ))}
      </g>
    </svg>
  );
}

/**
 * A stamp in flight: the impression itself, its soft shadow on the paper
 * (grows sharper as it lands) and a ring of ink spatter that pops on impact.
 */
export function StampRig({
  refs,
  x,
  y,
  width,
  color,
  children,
}: {
  refs: { stamp: (el: HTMLDivElement | null) => void; shadow: (el: HTMLDivElement | null) => void; spatter: (el: HTMLDivElement | null) => void };
  x: number;
  y: number;
  width: number;
  color: string;
  children: ReactNode;
}) {
  const dots = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + 0.4;
    const r = 0.55 + ((i * 37) % 10) / 40;
    return { x: Math.cos(a) * r * width * 0.62, y: Math.sin(a) * r * width * 0.22, s: 2 + ((i * 13) % 5) };
  });
  return (
    <>
      <div
        ref={refs.shadow}
        className="absolute"
        style={{
          left: x,
          top: y,
          width: width * 0.96,
          height: width * 0.3,
          background: C.ink,
          borderRadius: width * 0.05,
          filter: `blur(${width * 0.035}px)`,
          opacity: 0,
        }}
      />
      <div ref={refs.spatter} className="absolute" style={{ left: x, top: y, width: 0, height: 0, opacity: 0 }}>
        {dots.map((d, i) => (
          <span key={i} className="absolute rounded-full" style={{ left: d.x, top: d.y, width: d.s, height: d.s, background: color, opacity: 0.8 }} />
        ))}
      </div>
      <div ref={refs.stamp} className="absolute" style={{ left: x, top: y, mixBlendMode: "multiply", opacity: 0 }}>
        {children}
      </div>
    </>
  );
}
