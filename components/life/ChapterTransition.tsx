"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface ChapterTransitionProps {
  lines: string[];
  finalLine?: string;
}

export function ChapterTransition({ lines, finalLine }: ChapterTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  return (
    <section ref={ref} className="relative w-screen h-[150vh] shrink-0 flex flex-col items-center justify-center bg-bg">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center px-6 text-center">
        {lines.map((line, idx) => {
          const start = 0.1 + (idx * 0.2);
          const peak = start + 0.1;
          const end = peak + 0.1;
          
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const opacity = useTransform(
            scrollYProgress,
            [start, peak, end, 0.9],
            [0, 1, 1, 0]
          );
          
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const y = useTransform(
            scrollYProgress,
            [start, peak],
            [20, 0]
          );

          return (
            <motion.h2 
              key={idx}
              style={{ opacity, y }}
              className="absolute text-2xl md:text-5xl font-bold tracking-tighter uppercase text-fg-soft"
            >
              {line}
            </motion.h2>
          );
        })}
        
        {finalLine && (
          <motion.h1
            style={{ 
              opacity: useTransform(scrollYProgress, [0.7, 0.85], [0, 1]),
              scale: useTransform(scrollYProgress, [0.7, 0.85], [0.9, 1])
            }}
            className="absolute text-5xl md:text-8xl font-bold tracking-tighter uppercase text-accent"
          >
            {finalLine}
          </motion.h1>
        )}
      </div>
    </section>
  );
}
