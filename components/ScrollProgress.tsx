"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useLenis } from "lenis/react";

/**
 * Top progress bar — pinned to the top of the frame.
 *
 * Reads progress from the Lenis instance attached to the scroll-container,
 * not from window scroll. Window doesn't move under the new fixed-frame
 * architecture, so framer's default `useScroll()` would never tick.
 *
 * The bar lives inside `.frame` (absolute), so it tracks the frame's edge —
 * not the viewport edge — which is the look we want.
 */
export function ScrollProgress() {
  const progress = useMotionValue(0);
  const scaleX = useSpring(progress, {
    stiffness: 220,
    damping: 30,
    mass: 0.4,
    restDelta: 0.001,
  });

  useLenis((lenis) => {
    progress.set(lenis.progress);
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="pointer-events-none absolute left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-accent shadow-[0_0_8px_rgba(197,255,61,0.5)]"
      aria-hidden
    />
  );
}
