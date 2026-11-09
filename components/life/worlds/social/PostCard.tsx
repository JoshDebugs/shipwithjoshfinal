"use client";

/**
 * The post: a tiny logo-free 9:16 card with a play triangle — the thing every
 * eye in this world is watching. It replaces the site cursor here; on touch it
 * parks where you last tapped. Positioned by the world's ticker.
 */

import { forwardRef } from "react";
import { RISO } from "@/components/life/multiverse/palette";

export const POST = { w: 34, h: 60 } as const;

export const PostCard = forwardRef<HTMLDivElement, { scale?: number }>(function PostCard({ scale = 1 }, ref) {
  const w = POST.w * scale;
  const h = POST.h * scale;
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute left-0 top-0"
      style={{ width: w, height: h, willChange: "transform", opacity: 0, zIndex: 30 }}
    >
      <svg viewBox="0 0 40 68" width={w} height={h} style={{ overflow: "visible", display: "block" }}>
        <rect x="4.5" y="5.5" width="34" height="61" rx="5" fill={RISO.ink} />
        <rect x="1.5" y="1.5" width="34" height="61" rx="5" fill={RISO.paper} stroke={RISO.ink} strokeWidth="2.6" />
        <path d="M14 23.5 L27 32 L14 40.5 Z" fill={RISO.sun} stroke={RISO.ink} strokeWidth="2.4" strokeLinejoin="round" />
        <rect x="7" y="53" width="23" height="2.6" rx="1.3" fill={RISO.ink} opacity="0.18" />
        <rect x="7" y="53" width="14" height="2.6" rx="1.3" fill={RISO.ink} />
      </svg>
    </div>
  );
});
