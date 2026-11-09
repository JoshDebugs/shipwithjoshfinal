"use client";

/**
 * Move-notation ticker: every turn prints its move in Tilt Warp, and the
 * letters tilt (XROT / YROT axes) with the layer while it turns. The
 * scramble prints forward; the solve prints its exact inverse.
 */

import { useRef } from "react";
import type { MotionValue } from "framer-motion";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { range, smoothstep } from "@/components/life/multiverse/ease";
import { useProgress } from "@/components/life/multiverse/runtime";
import { N_SCRAMBLE, TIMELINE } from "../lib/script";
import { K, movePos, snap } from "../lib/rig";
import type { Box } from "../lib/frame";

export function Ticker({ progress, box, slot }: { progress: MotionValue<number>; box: Box; slot: number }) {
  const strip = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const tokens = useRef<(HTMLSpanElement | null)[]>([]);
  const lastActive = useRef(-1);
  const marker = Math.round(box.w * 0.34);

  useProgress(progress, (p) => {
    const w = wrap.current;
    if (w) {
      const o = smoothstep(range(p, 0.05, 0.1)) * (1 - smoothstep(range(p, K.lock3 + 0.01, K.flip)));
      w.style.opacity = String(o);
      w.style.visibility = o < 0.001 ? "hidden" : "visible";
    }
    const m = movePos(p);
    const k = Math.min(TIMELINE.length - 1, Math.floor(m));
    const frac = m - Math.floor(m);
    const s = strip.current;
    // the "solve" label slides past the marker during the scrambled hold
    const slotPos = m + (m >= N_SCRAMBLE ? range(p, K.scramble, K.solve) : 0);
    if (s) s.style.transform = `translate3d(${(marker - slotPos * slot).toFixed(1)}px,0,0)`;
    if (lastActive.current !== k) {
      tokens.current.forEach((el, i) => {
        if (!el || i === k) return;
        el.style.color = i < k ? alpha(RISO.ink, 0.42) : alpha(RISO.ink, 0.2);
        el.style.fontVariationSettings = "'XROT' 0, 'YROT' 0";
      });
      lastActive.current = k;
    }
    const cur = tokens.current[k];
    if (cur) {
      const mv = TIMELINE[k];
      const turning = m < TIMELINE.length && frac > 0;
      const tilt = turning ? Math.sin(Math.PI * snap(frac)) * 45 * Math.sign(mv.q) : 0;
      const xr = mv.axis === 0 ? tilt : mv.axis === 2 ? tilt * 0.7 : 0;
      const yr = mv.axis === 1 ? tilt : mv.axis === 2 ? -tilt * 0.7 : 0;
      cur.style.fontVariationSettings = `'XROT' ${xr.toFixed(1)}, 'YROT' ${yr.toFixed(1)}`;
      cur.style.color = RISO.ink;
    }
  });

  return (
    <div
      ref={wrap}
      aria-hidden
      className="pointer-events-none absolute overflow-hidden"
      style={{
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        zIndex: 4,
        maskImage: "linear-gradient(90deg, transparent, #000 14%, #000 72%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 14%, #000 72%, transparent)",
      }}
    >
      <div className="absolute top-0 h-full w-px" style={{ left: marker, background: RISO.pink }} />
      <div ref={strip} className="absolute left-0 top-0 flex h-full items-center whitespace-nowrap will-change-transform">
        {TIMELINE.map((mv, i) => (
          <span key={i} className="contents">
            {i === N_SCRAMBLE && (
              <span className="inline-block text-center font-mono text-[9px] uppercase tracking-[0.2em]" style={{ width: slot, color: RISO.pink }}>
                solve
              </span>
            )}
            <span
              ref={(el) => {
                tokens.current[i] = el;
              }}
              className="inline-block text-center leading-none"
              style={{ width: slot, fontFamily: "var(--f-tilt-warp)", fontSize: Math.round(box.h * 0.62), color: alpha(RISO.ink, 0.22) }}
            >
              {mv.name}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
