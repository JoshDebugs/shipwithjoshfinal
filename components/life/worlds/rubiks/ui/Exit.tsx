"use client";

/**
 * Too deep: past the last layer there is only ink — and at the core, an eye
 * opening. The eye's box is the next portal's origin (World 04 opens out of it).
 */

import { useRef } from "react";
import type { MotionValue } from "framer-motion";
import { RISO } from "@/components/life/multiverse/palette";
import { easeOutCubic, range, smoothstep } from "@/components/life/multiverse/ease";
import { usePortalOrigin, useProgress, useStage } from "@/components/life/multiverse/runtime";
import { iconSvg } from "@/components/life/multiverse/portalIcons";

export function Exit({ progress }: { progress: MotionValue<number> }) {
  const stage = useStage();
  const origin = usePortalOrigin();
  const ink = useRef<HTMLDivElement>(null);
  const lid = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const E = stage.isMobile ? 116 : 152;
  const cx = stage.width / 2;
  const cy = stage.height / 2;

  useProgress(progress, (p) => {
    const o = smoothstep(range(p, 0.972, 0.99));
    if (ink.current) {
      ink.current.style.opacity = String(o);
      ink.current.style.visibility = o < 0.001 ? "hidden" : "visible";
    }
    const open = easeOutCubic(range(p, 0.984, 1));
    if (lid.current) {
      lid.current.style.transform = `scaleY(${(0.035 + 0.965 * open).toFixed(4)})`;
      lid.current.style.opacity = String(smoothstep(range(p, 0.978, 0.986)));
    }
    if (glow.current) glow.current.style.opacity = String(0.9 * smoothstep(range(p, 0.986, 1)));
  });

  const G = E * 3.4;
  return (
    <div ref={ink} aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 7, background: RISO.ink, opacity: 0, visibility: "hidden" }}>
      <div
        ref={glow}
        className="absolute"
        style={{
          left: cx - G / 2,
          top: cy - G / 2,
          width: G,
          height: G,
          opacity: 0,
          backgroundImage: `radial-gradient(circle, ${RISO.pink} 0 1.7px, transparent 2.1px)`,
          backgroundSize: "9px 9px",
          backgroundPosition: "center",
          maskImage: "radial-gradient(closest-side, rgba(0,0,0,.85), rgba(0,0,0,.35) 45%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(closest-side, rgba(0,0,0,.85), rgba(0,0,0,.35) 45%, transparent 100%)",
        }}
      />
      <div ref={origin} className="absolute" style={{ left: cx - E / 2, top: cy - E / 2, width: E, height: E }}>
        <div
          ref={lid}
          className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
          style={{ transform: "scaleY(0.035)", transformOrigin: "50% 50%", opacity: 0 }}
          dangerouslySetInnerHTML={{ __html: iconSvg("eye", RISO.pink) }}
        />
      </div>
    </div>
  );
}
