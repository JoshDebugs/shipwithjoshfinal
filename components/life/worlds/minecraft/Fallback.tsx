"use client";

/**
 * No-WebGL stand-in: the same words, already "locked", as SVG pixel type at
 * their exact screen positions, crossfading with the camera parameter.
 */
import { useMemo, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { useProgress, useStage } from "@/components/life/multiverse/runtime";
import { clamp, smoothstep } from "@/components/life/multiverse/ease";
import { RECEIPT_ID, RECEIPT_KEY, WORDS, camParam } from "./beats";
import { LOCKS } from "./colors";
import { layoutWords } from "./gen";
import { PixelIsland } from "./PixelIsland";
import { PixelWord } from "./PixelWord";

export function Fallback({ progress }: { progress: MotionValue<number> }) {
  const stage = useStage();
  const placed = useMemo(() => layoutWords(stage.width, stage.height), [stage.width, stage.height]);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useProgress(progress, (p) => {
    const s = camParam(p);
    placed.forEach((pl, i) => {
      const el = refs.current[i];
      if (!el) return;
      const key = pl.id === RECEIPT_ID ? RECEIPT_KEY : WORDS[pl.id].key;
      el.style.opacity = String(1 - smoothstep(clamp(Math.abs(s - key) / 0.3)));
    });
  });

  return (
    <div className="absolute inset-0" aria-hidden>
      <PixelIsland className="absolute left-1/2 w-[min(46vw,420px)] -translate-x-1/2" style={{ bottom: "6%" }} />
      {placed.map((pl, i) => {
        const lock = LOCKS[pl.id];
        return (
          <div
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="absolute"
            style={{ left: pl.x0, top: pl.y0, width: pl.bmp.cols * pl.cell, opacity: 0 }}
          >
            <PixelWord bmp={pl.bmp} front={lock.front} side={lock.side} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }} />
          </div>
        );
      })}
    </div>
  );
}
