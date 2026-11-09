/**
 * Speaker cones, cropped by the stage edge. Frame + screws stay put; the
 * surround, cone and dust cap pump with the beat (amplitude = volume) and
 * punch forward at the clip. Linework in ink, a cobalt plate slightly off
 * register under the surround — printed, not rendered.
 */
import type { RefObject } from "react";
import { RISO, alpha, mix } from "@/components/life/multiverse/palette";

export type ConeRefs = {
  root: RefObject<HTMLDivElement | null>;
  pump: RefObject<SVGGElement | null>;
};

const SCREWS = [45, 135, 225, 315].map((a) => {
  const r = (a * Math.PI) / 180;
  return [Math.cos(r) * 92, Math.sin(r) * 92] as const;
});

export function Cone({ refs, size, plate = RISO.cobalt }: { refs?: Partial<ConeRefs>; size: number; plate?: string }) {
  return (
    <div ref={refs?.root} aria-hidden className="pointer-events-none absolute left-0 top-0" style={{ width: size, height: size, willChange: "transform" }}>
      <svg viewBox="-100 -100 200 200" width={size} height={size} className="absolute inset-0" overflow="visible">
        <circle r={99} fill={mix(RISO.paper, RISO.ink, 0.035)} stroke={RISO.ink} strokeWidth={1.4} />
        <circle r={95.5} fill="none" stroke={RISO.ink} strokeWidth={0.6} />
        {SCREWS.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={2.6} fill={RISO.ink} />
            <path d={`M${x - 1.6} ${y - 1.6} L${x + 1.6} ${y + 1.6}`} stroke={RISO.paper} strokeWidth={0.6} />
          </g>
        ))}
        <g ref={refs?.pump}>
          <circle cx={3} cy={3.5} r={86} fill={plate} style={{ mixBlendMode: "multiply" }} />
          <path d="M0 -86 A86 86 0 1 1 0 86 A86 86 0 1 1 0 -86 Z M0 -70 A70 70 0 1 0 0 70 A70 70 0 1 0 0 -70 Z" fill={RISO.ink} fillRule="evenodd" />
          <circle r={78} fill="none" stroke={alpha(RISO.paper, 0.18)} strokeWidth={1.2} />
          <circle r={70} fill={mix(RISO.paper, RISO.ink, 0.06)} />
          {[62, 54, 46, 38].map((r) => (
            <circle key={r} r={r} fill="none" stroke={alpha(RISO.ink, 0.34)} strokeWidth={0.8} />
          ))}
          <circle cx={1.5} cy={2} r={27} fill={plate} style={{ mixBlendMode: "multiply" }} />
          <circle r={26} fill={RISO.ink} />
          <path d="M-15 -14 A20 20 0 0 1 8 -19" fill="none" stroke={alpha(RISO.paper, 0.32)} strokeWidth={3} strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
