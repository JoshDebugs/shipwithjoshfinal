"use client";

/**
 * The 2D conductor canvas. One ticker callback per frame: reads progress,
 * pointer and scroll speed, updates the shared store (pose, tilt, medal
 * faces) and paints the rink, trail, comet, press ring, glints, receipts and
 * the exit comet. The R3F medal (desktop) only reads what this writes.
 */
import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { useIsoLayoutEffect, usePointer, useScrollVelocity, useTicker } from "@/components/life/multiverse/runtime";
import { cinzel } from "@/components/life/multiverse/fonts";
import { createRes, frame, type Res } from "./draw2d";
import type { Layout } from "./layout";
import type { SportsStore } from "./store";

export function Stage2D({ progress, store, L, use3D }: { progress: MotionValue<number>; store: SportsStore; L: Layout; use3D: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const res = useRef<Res | null>(null);
  const pointer = usePointer();
  const velocity = useScrollVelocity();

  useIsoLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, L.lowPower ? 1.25 : 2);
    c.width = Math.round(L.w * dpr);
    c.height = Math.round(L.h * dpr);
    const mono = getComputedStyle(c).getPropertyValue("--font-geist-mono").trim();
    store.mono = mono || "ui-monospace, monospace";
    res.current = createRes(L, dpr, store.mono);
    store.frontKey = "";
    store.backKey = "";
  }, [L, store]);

  // Cinzel for the struck lettering: load it, then rebuild both faces
  useEffect(() => {
    let alive = true;
    const fam = cinzel.style.fontFamily;
    store.serif = fam;
    if (typeof document === "undefined" || !document.fonts) return;
    document.fonts
      .load(`700 48px ${fam}`, "ROLLER SKATING STATE LEVEL YOGA")
      .then(() => {
        if (!alive) return;
        store.fontsReady = true;
        store.frontKey = "";
        store.backKey = "";
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [store]);

  useTicker((time, dt) => {
    const c = ref.current;
    const r = res.current;
    if (!c || !r) return;
    frame(c, r, L, store, {
      p: progress.get(),
      t: time,
      dt,
      v: velocity.get(),
      mouse: pointer.type.current === "mouse" && pointer.inside.get() > 0.5,
      nx: pointer.nx.get(),
      ny: pointer.ny.get(),
      use3D,
    });
  });

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
