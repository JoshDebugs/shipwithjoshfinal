/**
 * The small ink mic — the portal silhouette, landed. Same ball + tapered body
 * as the `mic` portal icon; its two sound arcs only print once there is sound.
 * 100 × 100 design box; the world scales/moves the root.
 */
import type { RefObject } from "react";
import { RISO, alpha } from "@/components/life/multiverse/palette";

export type MicRefs = {
  root?: RefObject<HTMLDivElement | null>;
  arc1?: RefObject<SVGPathElement | null>;
  arc2?: RefObject<SVGPathElement | null>;
};

export function Mic({ refs, arcs = 0, onTap }: { refs?: MicRefs; arcs?: number; onTap?: () => void }) {
  return (
    <div ref={refs?.root} className="absolute left-0 top-0" style={{ width: 100, height: 100, transformOrigin: "0 0", willChange: "transform" }}>
      <svg viewBox="0 0 100 100" width={100} height={100} overflow="visible" aria-hidden className="absolute inset-0">
        <circle cx={47} cy={33} r={17} fill={RISO.cobalt} style={{ mixBlendMode: "multiply" }} />
        <circle cx={44} cy={30} r={17} fill={RISO.ink} />
        <path d="M31 47 H57 L50.5 90 Q44 96 37.5 90 Z" fill={RISO.ink} />
        {/* grille band + mesh */}
        <path d="M27.6 33.5 H60.4" stroke={alpha(RISO.paper, 0.5)} strokeWidth={1.3} />
        <path d="M30 24 H58 M33.5 18.5 H54.5 M30.5 39.5 H57.5" stroke={alpha(RISO.paper, 0.16)} strokeWidth={0.9} />
        <path d="M31 47 H57" stroke={alpha(RISO.paper, 0.35)} strokeWidth={1.2} />
        <path
          ref={refs?.arc1}
          d="M61.2 5.4 A30 30 0 0 1 73.9 32.6 L67.9 32.1 A24 24 0 0 0 57.8 10.3 Z"
          fill={RISO.ink}
          opacity={Math.min(1, arcs * 2)}
        />
        <path ref={refs?.arc2} d="M72.3 1.7 A40 40 0 0 1 84 30 L78 30 A34 34 0 0 0 68 6 Z" fill={RISO.ink} opacity={Math.max(0, arcs * 2 - 1)} />
      </svg>
      {onTap && (
        <button
          type="button"
          aria-label="Tap the mic"
          onPointerDown={onTap}
          className="absolute rounded-full"
          style={{ left: 18, top: 4, width: 54, height: 92, cursor: "pointer", background: "transparent", touchAction: "manipulation" }}
        />
      )}
    </div>
  );
}
