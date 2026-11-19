"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const SPRING = { stiffness: 180, damping: 18, mass: 0.4 };

type Props = {
  children: ReactNode;
  /** How strongly the element follows the cursor (0..1) */
  strength?: number;
  /** Activation radius in px — only pulls within this distance */
  radius?: number;
  /** Wrapper className */
  className?: string;
  /** Render as inline-block (default true) so it can be used inline */
  inline?: boolean;
};

/**
 * Wraps any element to give it a subtle "magnetic" pull toward the cursor.
 * Cohesive with the hero's magnetic letters — applied to CTAs, links, cards.
 */
export function Magnetic({
  children,
  strength = 0.35,
  radius = 110,
  className,
  inline = true,
}: Props) {
  const ref = useRef<HTMLSpanElement | HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        const factor = (1 - dist / radius) * strength;
        x.set(dx * factor);
        y.set(dy * factor);
      } else {
        x.set(0);
        y.set(0);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y, strength, radius]);

  const Tag = inline ? motion.span : motion.div;

  return (
    <Tag
      ref={ref as never}
      style={{ x: sx, y: sy, display: inline ? "inline-block" : "block" }}
      className={className}
    >
      {children}
    </Tag>
  );
}
