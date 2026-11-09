"use client";

/**
 * The thumbprint: a small whorl cut from the same ridge field as the big print.
 * Stroked in currentColor, so CSS (or a parent) owns its ink. Used by the CTA in
 * the film and the reduced-motion page.
 */
import { useMemo } from "react";
import { thumbRidges } from "./ridges";

export function Thumbprint({ size, weight = 3, className }: { size: number; weight?: number; className?: string }) {
  const ridges = useMemo(thumbRidges, []);
  return (
    <svg viewBox="0 0 100 132" width={size} height={size * 1.32} className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ overflow: "visible" }}>
      {ridges.map((r) => (
        <path key={r.i} d={r.d} strokeWidth={weight} style={{ ["--i" as string]: r.i, ["--w" as string]: `${weight}px` }} />
      ))}
    </svg>
  );
}

/** Interaction CSS for the button (both the film and the Static use it). */
export const CTA_CSS = `
.outro-cta { position: relative; display: inline-flex; align-items: center; color: var(--outro-sun); text-decoration: none; -webkit-tap-highlight-color: transparent; border-radius: 12px; outline: none; transition: color .25s ease; }
.outro-cta .outro-cta-label { position: relative; display: inline-block; }
.outro-cta .outro-cta-label::after { content: ""; position: absolute; left: 0; right: 0; bottom: -0.1em; height: 0.07em; min-height: 2px; background: currentColor; transform: scaleX(0); transform-origin: 0 50%; transition: transform .38s cubic-bezier(.22,1,.36,1); }
.outro-cta .outro-cta-thumb { transition: transform .32s cubic-bezier(.22,1,.36,1); transform-origin: 50% 50%; }
.outro-cta .outro-cta-bleed { position: absolute; border-radius: 50%; background: var(--outro-sun); opacity: 0; transform: scale(.25); pointer-events: none; transition: opacity .4s ease, transform .55s cubic-bezier(.22,1,.36,1); }
.outro-cta:hover, .outro-cta:focus-visible { color: var(--outro-paper); }
.outro-cta:hover .outro-cta-label::after, .outro-cta:focus-visible .outro-cta-label::after { transform: scaleX(1); }
.outro-cta:hover .outro-cta-thumb path, .outro-cta:focus-visible .outro-cta-thumb path { animation: outro-ridge .9s cubic-bezier(.22,1,.36,1) both; animation-delay: calc(var(--i) * 38ms); }
.outro-cta:active .outro-cta-thumb { transform: scale(.92); }
.outro-cta:active .outro-cta-bleed { opacity: .22; transform: scale(1.25); }
.outro-cta:focus-visible { outline: 2px solid var(--outro-paper); outline-offset: 8px; }
@keyframes outro-ridge { 0% { stroke-width: var(--w); } 35% { stroke-width: calc(var(--w) * 2.1); } 100% { stroke-width: var(--w); } }
@media (prefers-reduced-motion: reduce) {
  .outro-cta .outro-cta-thumb path { animation: none !important; }
  .outro-cta, .outro-cta .outro-cta-label::after, .outro-cta .outro-cta-thumb, .outro-cta .outro-cta-bleed { transition: none !important; }
}
`;
