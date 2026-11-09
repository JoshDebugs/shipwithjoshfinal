"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { MotionValue } from "framer-motion";
import { useProgress } from "@/components/life/multiverse/runtime";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { easeInCubic, range } from "@/components/life/multiverse/ease";
import { COPY } from "./copy";
import { fraunces, martian } from "./ink";
import type { Layout } from "./layout";
import { B } from "./timeline";
import type { Dot } from "./HallCanvas";

/** The chair's gavel (same geometry as the portal that opened into this world, minus the block). */
export function GavelGlyph({ color, className, style }: { color: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" fill={color} className={className} style={style} aria-hidden>
      <g transform="rotate(-35 42 34)">
        <rect x="16" y="19" width="52" height="30" rx="6" />
        <rect x="11" y="16" width="9" height="36" rx="3" />
        <rect x="64" y="16" width="9" height="36" rx="3" />
      </g>
      <path d="M48.6 47.7 L55.4 42.3 L86.4 81.3 L79.6 86.7 Z" />
    </svg>
  );
}

/**
 * Title card: "ORDER." in Fraunces 900, its full stop the gavel's strike
 * point (sun), halftone ripples rolling out of it (drawn by the canvas).
 */
export function TitleCard({ L, progress, dot }: { L: Layout; progress: MotionValue<number>; dot: RefObject<Dot | null> }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLHeadingElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const fs = L.title.fs;

  // where the full stop is, in stage px (layout boxes, so portal transforms don't skew it)
  useEffect(() => {
    const measure = () => {
      let el: HTMLElement | null = dotRef.current;
      const root = rootRef.current;
      if (!el || !root) return;
      let x = el.offsetWidth / 2;
      let y = el.offsetHeight / 2;
      while (el && el !== root) {
        x += el.offsetLeft;
        y += el.offsetTop;
        el = el.offsetParent as HTMLElement | null;
      }
      dot.current = { x, y, r: fs * 0.08 };
    };
    measure();
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(measure).catch(() => {});
    const id = window.setTimeout(measure, 600);
    return () => window.clearTimeout(id);
  }, [L, fs, dot]);

  useProgress(progress, (p) => {
    const root = rootRef.current;
    const word = wordRef.current;
    const sub = subRef.current;
    if (!root || !word || !sub) return;
    const o = range(p, B.titleOut[0], B.titleOut[1]);
    root.style.opacity = String(1 - easeInCubic(o));
    root.style.visibility = o >= 1 ? "hidden" : "visible";
    word.style.transform = `translate3d(0, ${-o * fs * 0.32}px, 0) scale(${1 - 0.06 * o})`;
    word.style.letterSpacing = `${-0.035 + o * 0.05}em`;
    sub.style.opacity = String(0.9 * (1 - range(p, B.titleOut[0] - 0.012, B.titleOut[0] + 0.02)));
  });

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0" style={{ zIndex: 5 }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: L.h * (L.portrait ? 0.16 : 0.1) }}>
        <h2
          ref={wordRef}
          className="relative whitespace-nowrap"
          style={{
            ...fraunces(900, 1, 0, 144),
            fontSize: fs,
            lineHeight: 0.82,
            letterSpacing: "-0.035em",
            color: RISO.paper,
            textShadow: `${fs * 0.018}px ${fs * 0.014}px 0 ${alpha(RISO.ink, 0.22)}`,
          }}
        >
          {COPY.title}
          <span className="relative inline-block" style={{ width: fs * 0.2, height: fs * 0.7 }}>
            <span
              ref={dotRef}
              className="absolute rounded-full"
              style={{ left: fs * 0.03, bottom: 0, width: fs * 0.15, height: fs * 0.15, background: RISO.sun }}
            />
            {/* the gavel's striking face rests on the full stop: rotate about the face so the barrel stands upright */}
            <GavelGlyph
              color={RISO.paper}
              className="absolute"
              style={{
                width: fs * 0.5,
                height: fs * 0.5,
                left: fs * 0.105 - fs * 0.5 * 0.203,
                top: fs * 0.7 - fs * 0.15 - fs * 0.5 * 0.492 - fs * 0.006,
                transform: "rotate(-44deg)",
                transformOrigin: "20.3% 49.2%",
              }}
            />
          </span>
        </h2>
        <p
          ref={subRef}
          className="mt-[0.9em]"
          style={{ ...martian, fontSize: L.portrait ? 11 : 13, letterSpacing: "0.32em", color: RISO.paper, opacity: 0.9 }}
        >
          {COPY.titleSub}
        </p>
      </div>
    </div>
  );
}
