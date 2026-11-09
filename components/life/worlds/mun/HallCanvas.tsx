"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { MotionValue } from "framer-motion";
import { useProgress, useTicker } from "@/components/life/multiverse/runtime";
import { buildAtlas, type Atlas } from "./placards";
import { drawScene, makeScene, type Frame, type Scene } from "./draw";
import type { Layout } from "./layout";
import { B } from "./timeline";

export type Dot = { x: number; y: number; r: number };

/**
 * The hall canvas. Draws on the shared gsap ticker (auto-paused off screen);
 * progress is read from the MotionValue, time only feeds ambient motion
 * (breathing, carpet drift, the title's ripples) and the gavel's twang.
 */
export function HallCanvas({ L, progress, dot }: { L: Layout; progress: MotionValue<number>; dot: RefObject<Dot | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const atlasRef = useRef<Atlas | null>(null);
  const dprRef = useRef(1);
  const frame = useRef<Frame>({ p: 0, t: 0, twang: -1, dot: null, atlas: null });
  const clock = useRef(0);
  const struck = useRef(-1);
  const lastP = useRef(progress.get());

  const draw = () => {
    const ctx = ctxRef.current;
    const sc = sceneRef.current;
    if (!ctx || !sc) return;
    const f = frame.current;
    f.p = progress.get();
    f.t = clock.current;
    f.twang = struck.current >= 0 ? clock.current - struck.current : -1;
    f.dot = dot.current;
    f.atlas = atlasRef.current;
    drawScene(ctx, sc, f, dprRef.current);
  };

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !L.w || !L.h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, L.low ? 1.25 : 2);
    dprRef.current = dpr;
    c.width = Math.round(L.w * dpr);
    c.height = Math.round(L.h * dpr);
    ctxRef.current = c.getContext("2d");
    sceneRef.current = makeScene(L);
    if (!atlasRef.current) atlasRef.current = buildAtlas();
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L]);

  useTicker((time) => {
    clock.current = time;
    draw();
  });

  // the gavel: crossing it forwards plucks the whole web (a time-based damped twang)
  useProgress(progress, (p) => {
    if (lastP.current < B.gavel && p >= B.gavel) struck.current = clock.current;
    if (p < B.gavel - 0.006) struck.current = -1;
    lastP.current = p;
  });

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" style={{ zIndex: 0 }} />;
}
