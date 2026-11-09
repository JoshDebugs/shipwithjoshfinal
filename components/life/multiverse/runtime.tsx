"use client";

/**
 * Runtime shared by every world: stage size, presence, pointer, a single
 * ticker, and portal-origin registration.
 *
 * Worlds never measure the window or read scroll themselves. The multiverse
 * hands them a `progress` MotionValue and these hooks, so every moving thing
 * stays on the same clock (Lenis drives scroll, gsap.ticker drives time).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { useMotionValue, useMotionValueEvent, type MotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { gsap } from "gsap";
import type { Presence, WorldMeta } from "./types";

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ------------------------------------------------------------------ stage */

export type Stage = {
  /** Stage size in CSS px (the visible scroll viewport inside the site frame). */
  width: number;
  height: number;
  /** width < 768 */
  isMobile: boolean;
  /** Phones and weak machines: cut particle counts, DPR and post effects. */
  lowPower: boolean;
  /** prefers-reduced-motion */
  reduced: boolean;
  /** The stage element (for pointer maths). */
  ref: RefObject<HTMLDivElement | null>;
};

const StageContext = createContext<Stage | null>(null);

export function StageProvider({ value, children }: { value: Stage; children: ReactNode }) {
  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
}

export function useStage(): Stage {
  const s = useContext(StageContext);
  if (!s) throw new Error("useStage must be used inside the Life multiverse");
  return s;
}

/* ------------------------------------------------------------------ world */

export type WorldRuntime = {
  meta: WorldMeta;
  presence: Presence;
  /** True while the world is on screen (current or entering). Pause loops otherwise. */
  running: boolean;
  /** True only for the current world: it owns pointer input. */
  active: boolean;
  /** Registered by the world; the next portal is born here. */
  originRef: RefObject<HTMLElement | null>;
};

const WorldContext = createContext<WorldRuntime | null>(null);

export function WorldProvider({ value, children }: { value: WorldRuntime; children: ReactNode }) {
  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>;
}

export function useWorld(): WorldRuntime {
  const w = useContext(WorldContext);
  if (!w) throw new Error("useWorld must be used inside a world");
  return w;
}

/**
 * Attach the returned ref to the element the NEXT world's portal should grow
 * out of. The element's box is treated as the icon's 100×100 box: give it the
 * size you want the portal to start at (0×0 = born from a point).
 */
export function usePortalOrigin() {
  const { originRef } = useWorld();
  return useCallback(
    (el: HTMLElement | null) => {
      originRef.current = el;
    },
    [originRef],
  );
}

/* ----------------------------------------------------------------- clocks */

/**
 * Run `cb(time, deltaSeconds)` every frame on gsap's shared ticker while
 * `enabled` (defaults to the world's `running`). The latest `cb` is always used.
 */
export function useTicker(cb: (time: number, dt: number) => void, enabled?: boolean) {
  const { running } = useWorld();
  const on = enabled ?? running;
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!on) return;
    const fn = (time: number, deltaMs: number) => cbRef.current(time, Math.min(deltaMs, 64) / 1000);
    gsap.ticker.add(fn);
    return () => gsap.ticker.remove(fn);
  }, [on]);
}

/** Call `cb(p)` immediately and whenever `progress` changes. */
export function useProgress(progress: MotionValue<number>, cb: (p: number) => void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useIsoLayoutEffect(() => {
    cbRef.current(progress.get());
  }, [progress]);
  useMotionValueEvent(progress, "change", (p) => cbRef.current(p));
}

/** Lenis scroll velocity (px/frame, signed), smoothed. 0 when idle. */
export function useScrollVelocity(): MotionValue<number> {
  const v = useMotionValue(0);
  useLenis((lenis) => {
    v.set(lenis.velocity);
  });
  useTicker((_, dt) => {
    // ease back to rest when scrolling stops (Lenis stops emitting)
    const cur = v.get();
    if (Math.abs(cur) > 0.01) v.set(cur * Math.pow(0.02, dt));
    else if (cur !== 0) v.set(0);
  });
  return v;
}

/* ---------------------------------------------------------------- pointer */

export type Pointer = {
  /** Stage-relative px. */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Normalised −1 … 1 from the stage centre. */
  nx: MotionValue<number>;
  ny: MotionValue<number>;
  /** 1 while a pointer is over the stage (mouse) or touching, else 0. */
  inside: MotionValue<number>;
  /** "mouse" | "touch" | "pen" — last pointer type seen. */
  type: RefObject<string>;
};

/**
 * Pointer position relative to the stage. Only updates while this world is
 * active. Starts at the stage centre so nothing jumps before the first move.
 */
export function usePointer(): Pointer {
  const stage = useStage();
  const { active } = useWorld();
  const x = useMotionValue(stage.width / 2);
  const y = useMotionValue(stage.height / 2);
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const inside = useMotionValue(0);
  const type = useRef("mouse");

  useEffect(() => {
    if (!active) return;
    const el = stage.ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      type.current = e.pointerType;
      x.set(px);
      y.set(py);
      nx.set((px / r.width) * 2 - 1);
      ny.set((py / r.height) * 2 - 1);
      inside.set(px >= 0 && py >= 0 && px <= r.width && py <= r.height ? 1 : 0);
    };
    const leave = () => inside.set(0);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [active, stage.ref, x, y, nx, ny, inside]);

  return { x, y, nx, ny, inside, type };
}
