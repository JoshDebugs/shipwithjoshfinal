/**
 * "Please welcome our next act…" — a quad skate rolls on stage along the
 * trace and stops dead centre. Its box is exactly the next portal icon's
 * 100 × 100 box, and its silhouette is that icon in ink, so the Sports world
 * (ink) opens out of it seamlessly.
 */
import type { Ref, RefObject } from "react";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { iconSvg } from "@/components/life/multiverse/portalIcons";

export type SkateRefs = {
  plate: RefObject<HTMLDivElement | null>;
  spokes: RefObject<(SVGGElement | null)[]>;
  spokeLayer: RefObject<SVGSVGElement | null>;
};

const SKATE_INK = iconSvg("skate", RISO.ink);
const SKATE_PLATE = iconSvg("skate", RISO.cobalt);
const WHEELS = [
  [30, 86],
  [72, 86],
] as const;

export function Skate({ rootRef, refs, size }: { rootRef: Ref<HTMLDivElement>; refs?: SkateRefs; size: number }) {
  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none absolute left-0 top-0" style={{ width: size, height: size, willChange: "transform" }}>
      <div
        ref={refs?.plate}
        className="absolute inset-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
        style={{ transform: "translate(4px, 3px)", mixBlendMode: "multiply" }}
        dangerouslySetInnerHTML={{ __html: SKATE_PLATE }}
      />
      <div className="absolute inset-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: SKATE_INK }} />
      <svg ref={refs?.spokeLayer} viewBox="0 0 100 100" width={size} height={size} className="absolute inset-0">
        {WHEELS.map(([cx, cy], i) => (
          <g
            key={i}
            ref={(el) => {
              if (refs) refs.spokes.current[i] = el;
            }}
          >
            <path d={`M${cx - 6.5} ${cy} H${cx + 6.5} M${cx} ${cy - 6.5} V${cy + 6.5}`} stroke={alpha(RISO.paper, 0.55)} strokeWidth={1.4} strokeLinecap="round" />
            <circle cx={cx} cy={cy} r={2.2} fill={alpha(RISO.paper, 0.55)} />
          </g>
        ))}
      </svg>
    </div>
  );
}
