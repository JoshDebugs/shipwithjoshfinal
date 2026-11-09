content = """"use client";

import { motion, useTransform, useMotionValue } from "framer-motion";
import { useRef, ReactNode } from "react";
import { useLenis } from "lenis/react";

interface HorizontalScrollGroupProps {
  children: ReactNode;
  numPanels: number;
}

export function HorizontalScrollGroup({ children, numPanels }: HorizontalScrollGroupProps) {
  const targetRef = useRef<HTMLElement>(null);
  const xProgress = useMotionValue(0);

  useLenis(() => {
    if (!targetRef.current) return;
    
    const rect = targetRef.current.getBoundingClientRect();
    const startScroll = -rect.top;
    const maxScroll = rect.height - window.innerHeight;
    
    if (maxScroll > 0) {
      let progress = startScroll / maxScroll;
      progress = Math.max(0, Math.min(1, progress));
      xProgress.set(progress);
    }
  });

  // Transform scroll progress (0 to 1) into x translation
  const x = useTransform(xProgress, [0, 1], ["0vw", `-${(numPanels - 1) * 100}vw`]);

  return (
    <section ref={targetRef} className="relative w-full" style={{ height: `${numPanels * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center">
        <motion.div 
          style={{ x, width: `${numPanels * 100}vw` }} 
          className="flex h-full"
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}
"""

with open('components/life/HorizontalScrollGroup.tsx', 'w') as f:
    f.write(content)
