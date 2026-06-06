"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  type SpringOptions,
} from "framer-motion";

const SPRING: SpringOptions = { stiffness: 180, damping: 14, mass: 0.6 };
const RADIUS = 140;
const STRENGTH = 0.45;

function Letter({ char }: { char: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS) {
        const pull = (1 - dist / RADIUS) * STRENGTH;
        x.set(dx * pull);
        y.set(dy * pull);
      } else {
        x.set(0);
        y.set(0);
      }
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [x, y]);

  if (char === " ") {
    return <span className="inline-block w-[0.35em]" aria-hidden />;
  }

  return (
    <motion.span
      ref={ref}
      style={{ x: sx, y: sy }}
      className="inline-block will-change-transform"
    >
      {char}
    </motion.span>
  );
}

export function InteractiveName({ text }: { text: string }) {
  return (
    <h1
      className="font-sans font-medium tracking-[-0.045em] leading-[0.95] text-[clamp(2.5rem,9.5vw,9rem)] select-none md:whitespace-nowrap"
      aria-label={text}
    >
      {text.split("").map((c, i) => (
        <Letter key={`${c}-${i}`} char={c} />
      ))}
    </h1>
  );
}
