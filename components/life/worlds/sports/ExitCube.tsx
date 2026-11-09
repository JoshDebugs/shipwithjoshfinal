"use client";

/**
 * The exit: the comet's trail squares the circle into the next world's cube.
 * The comet traces the hexagon on the canvas; this fills it with paper the
 * Riso way (halftone dots that grow until they merge) and registers the
 * portal origin on it. The origin box is the cube icon's 100×100 box; the
 * drawing inside is turned −6° because the cube portal is born turned −6°.
 */
import { useId, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { usePortalOrigin, useProgress } from "@/components/life/multiverse/runtime";
import { easeInOutCubic, range } from "@/components/life/multiverse/ease";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { CUBE_PATH, type Layout } from "./layout";
import { BEAT } from "./timeline";

export function ExitCube({ progress, L }: { progress: MotionValue<number>; L: Layout }) {
  const origin = usePortalOrigin();
  const wrap = useRef<HTMLDivElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const faces = useRef<SVGGElement>(null);
  const edge = useRef<SVGPathElement>(null);
  const id = `ht-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const S = L.cube.size;

  useProgress(progress, (p) => {
    const f = easeInOutCubic(range(p, BEAT.fill[0], BEAT.fill[1]));
    if (wrap.current) wrap.current.style.visibility = p >= BEAT.exitHex[1] - 0.002 ? "visible" : "hidden";
    if (dot.current) dot.current.setAttribute("r", (f * 3.75).toFixed(3));
    if (faces.current) faces.current.setAttribute("opacity", range(p, BEAT.fill[1] - 0.01, 1).toFixed(3));
    if (edge.current) edge.current.setAttribute("opacity", range(p, BEAT.exitHex[1] - 0.002, BEAT.exitHex[1] + 0.01).toFixed(3));
  });

  return (
    <div ref={origin} aria-hidden className="pointer-events-none absolute" style={{ left: L.cube.x - S / 2, top: L.cube.y - S / 2, width: S, height: S, zIndex: 3 }}>
      <div ref={wrap} className="absolute inset-0" style={{ transform: "rotate(-6deg)", visibility: "hidden" }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: "visible", display: "block" }}>
          <defs>
            <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
              <circle ref={dot} cx="2.5" cy="2.5" r="0" fill={RISO.paper} />
            </pattern>
          </defs>
          <path d={CUBE_PATH} fill={`url(#${id})`} />
          <g ref={faces} opacity="0">
            <path d={CUBE_PATH} fill={RISO.paper} />
            <path d="M16 31 L50 50 L50 88 L16 69 Z" fill={alpha(RISO.ink, 0.06)} />
            <path d="M84 31 L50 50 L50 88 L84 69 Z" fill={alpha(RISO.ink, 0.13)} />
            <path d="M50 50 L50 88 M50 50 L16 31 M50 50 L84 31" stroke={alpha(RISO.ink, 0.3)} strokeWidth="0.9" fill="none" />
          </g>
          <path ref={edge} d={CUBE_PATH} fill="none" stroke={RISO.sun} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0" />
        </svg>
      </div>
    </div>
  );
}
