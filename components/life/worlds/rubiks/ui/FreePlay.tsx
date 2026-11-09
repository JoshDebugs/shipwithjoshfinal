"use client";

/**
 * Grab-and-twist free play. A drag on the cube turns the layer under your
 * finger (the scene does the picking); release snaps to the nearest quarter.
 * Only live inside the play window; outside it the overlay lets every touch
 * and wheel through, so scrolling always advances the film.
 */

import { useRef } from "react";
import { motion, type MotionValue } from "framer-motion";
import { RISO } from "@/components/life/multiverse/palette";
import { useProgress, usePointer, useStage } from "@/components/life/multiverse/runtime";
import { K, layout, rig, screenRadius } from "../lib/rig";
import type { Store } from "../lib/store";

export function FreePlay({ progress, store }: { progress: MotionValue<number>; store: Store }) {
  const stage = useStage();
  const pointer = usePointer();
  const overlay = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const hover = useRef(false);
  const down = useRef<{ id: number; x: number; y: number } | null>(null);

  const W = stage.width;
  const H = stage.height;
  const r = rig((K.flipEnd + K.playEnd) / 2, W, H, layout(W, H));
  const R = screenRadius(r, H) * 0.86;

  const showCursor = () => {
    const c = cursor.current;
    if (c) c.style.opacity = active.current && hover.current ? "1" : "0";
  };

  const end = () => {
    if (!down.current) return;
    down.current = null;
    store.release?.();
  };

  useProgress(progress, (p) => {
    const on = p > K.flipEnd + 0.002 && p < K.playEnd - 0.003;
    active.current = on;
    const el = overlay.current;
    if (el) {
      el.style.pointerEvents = on ? "auto" : "none";
      el.style.touchAction = on ? "none" : "auto";
    }
    if (!on) end();
    showCursor();
  });

  const local = (e: React.PointerEvent) => {
    const rect = stage.ref.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left ?? 0);
    const y = e.clientY - (rect?.top ?? 0);
    return { nx: (x / W) * 2 - 1, ny: -((y / H) * 2 - 1) };
  };

  return (
    <>
      <div
        ref={overlay}
        data-swipe-ignore
        data-site-cursor="hide"
        aria-hidden
        className="absolute rounded-full"
        style={{
          left: r.cx - R,
          top: r.cy - R,
          width: R * 2,
          height: R * 2,
          zIndex: 6,
          pointerEvents: "none",
          cursor: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onPointerEnter={(e) => {
          hover.current = e.pointerType === "mouse";
          showCursor();
        }}
        onPointerLeave={() => {
          hover.current = false;
          showCursor();
        }}
        onPointerDown={(e) => {
          if (!active.current || down.current) return;
          const { nx, ny } = local(e);
          if (!store.pick?.(nx, ny)) return;
          down.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
          e.preventDefault();
        }}
        onPointerMove={(e) => {
          const d = down.current;
          if (!d || d.id !== e.pointerId) return;
          store.dragTo?.(e.clientX - d.x, e.clientY - d.y);
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
      />
      <motion.div
        ref={cursor}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0"
        style={{ x: pointer.x, y: pointer.y, zIndex: 9, opacity: 0, transition: "opacity 160ms linear" }}
      >
        <svg width="38" height="38" viewBox="0 0 38 38" style={{ transform: "translate(-19px,-19px)" }}>
          <path d="M8 22 A12 12 0 1 1 26 29" fill="none" stroke={RISO.paper} strokeWidth="7" strokeLinecap="round" />
          <path d="M8 22 A12 12 0 1 1 26 29" fill="none" stroke={RISO.ink} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M20.5 25.5 L28.5 30.5 L22 36" fill="none" stroke={RISO.paper} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20.5 25.5 L28.5 30.5 L22 36" fill="none" stroke={RISO.ink} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="19" cy="19" r="2.2" fill={RISO.pink} />
        </svg>
      </motion.div>
    </>
  );
}
