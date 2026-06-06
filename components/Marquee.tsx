"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "framer-motion";
import { useLenis } from "lenis/react";

type Props = {
  items: string[];
  /** Base drift speed in pixels per second (when no scroll velocity is applied) */
  baseVelocity?: number;
  reverse?: boolean;
};

/**
 * Infinite marquee that reacts to scroll velocity.
 * Drifts at baseVelocity at rest; scroll speed multiplies and biases direction.
 */
export function Marquee({
  items,
  baseVelocity = 35,
  reverse = false,
}: Props) {
  const baseX = useMotionValue(0);

  // Mirror the inner scroll surface's position into a motion value so
  // framer's velocity utilities work the same as they did when this was
  // hooked to window scroll. The container is what actually moves now.
  const scrollY = useMotionValue(0);
  useLenis((lenis) => {
    scrollY.set(lenis.scroll);
  });
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  // Map raw px/s scroll velocity → multiplier; clamp off lets fast scrolls overshoot a bit
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  const directionFactor = useRef<number>(reverse ? -1 : 1);

  // Wrap position 0..-50% so the duplicated half-set keeps the loop seamless
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);

  useAnimationFrame((_t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    // Direction follows scroll direction
    const vf = velocityFactor.get();
    if (vf < 0) directionFactor.current = -1;
    else if (vf > 0) directionFactor.current = 1;

    // Boost speed by scroll velocity (absolute so it always accelerates)
    moveBy += directionFactor.current * moveBy * Math.abs(vf);

    baseX.set(baseX.get() + moveBy * 0.1);
  });

  const set = (key: string) => (
    <div key={key} className="flex flex-none items-center gap-12 pr-12">
      {items.map((t, i) => (
        <span key={`${key}-${i}`} className="flex items-center gap-12">
          <span>{t}</span>
          <span className="text-accent">●</span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="relative overflow-hidden border-y border-line bg-bg-soft/30 py-4"
      aria-hidden
    >
      <motion.div
        className="flex w-max font-mono text-[11px] md:text-xs uppercase tracking-[0.25em] text-fg-soft will-change-transform"
        style={{ x }}
      >
        {set("a")}
        {set("b")}
      </motion.div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-bg to-transparent" />
    </div>
  );
}
