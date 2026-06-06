"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const dotX = useSpring(x, { stiffness: 900, damping: 40, mass: 0.3 });
  const dotY = useSpring(y, { stiffness: 900, damping: 40, mass: 0.3 });
  const ringX = useSpring(x, { stiffness: 200, damping: 22, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 200, damping: 22, mass: 0.6 });

  const [hovering, setHovering] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const interactive = t.closest("a, button, [data-cursor='hover']");
      setHovering(!!interactive);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, [x, y]);

  if (!mounted) return null;

  return (
    <>
      <motion.div
        className="cursor-ring"
        style={{ x: ringX, y: ringY }}
        animate={{ scale: hovering ? 1.6 : 1, opacity: hovering ? 0.9 : 0.6 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
      <motion.div
        className="cursor-dot"
        style={{ x: dotX, y: dotY }}
        animate={{ scale: hovering ? 0.4 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </>
  );
}
